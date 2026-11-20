import React, { useState } from 'react';
import { Upload, Printer, Trash2, FileText, Plus, CheckCircle2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface GuiaChequeoData {
  id: string;
  numeroGuia: string;
  nombreChofer: string;
  companiaTransporte: string;
  fecha: string;
  hora: string;
  destino: string;
  patenteCamion: string;
  patenteCarro: string;
}

function emptyChequeo(partial?: Partial<GuiaChequeoData>): GuiaChequeoData {
  return {
    id: crypto.randomUUID(),
    numeroGuia: '',
    nombreChofer: '',
    companiaTransporte: '',
    fecha: '',
    hora: '',
    destino: '',
    patenteCamion: '',
    patenteCarro: '',
    ...partial,
  };
}

function limpiarNombreChofer(raw: string): string {
  return raw
    .replace(/\bORIGINAL\b/gi, '')
    .replace(/^[:.\-\s]+|[:.\-\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseGuiaText(rawText: string, fileName = ''): GuiaChequeoData {
  const normalized = rawText.replace(/\s+/g, ' ').trim();

  // 1. Número de guía ("Nº 25504" / "Nº 25478")
  const guiaMatch =
    normalized.match(/\bN[°ºo.]\s*(\d{4,8})\b/i) ||
    normalized.match(/\bGU[IÍ]A\s*(?:DE\s*DESPACHO)?\s*(?:ELECTR[OÓ]NICA)?\s*N[°ºo.]?\s*(\d{4,8})\b/i) ||
    fileName.match(/(\d{4,8})/);
  const numeroGuia = guiaMatch ? guiaMatch[1] : '';

  // 2. Fecha ("18-11-2026" / "17-11-2026")
  const fechaMatch = normalized.match(/\b(\d{2}[-/]\d{2}[-/]\d{4})\b/);
  const fecha = fechaMatch ? fechaMatch[1].replace(/\//g, '-') : '';

  // 3. Hora (si viene en formato hh:mm)
  const horaMatch = normalized.match(/\bHora\s*:?\s*(\d{1,2}:\d{2}(?::\d{2})?)\b/i);
  const hora = horaMatch ? horaMatch[1] : '';

  // 4. Patente camión y patente carro (ej. "BYXL-11 / JP-4054" o "DRHY55 / KDGB65")
  let patenteCamion = '';
  let patenteCarro = '';
  const dosPatentesMatch = normalized.match(
    /\b([A-Z]{2,4}-?\d{2,4})\s*\/\s*([A-Z]{2,4}-?\d{2,4})\b/
  );
  if (dosPatentesMatch) {
    patenteCamion = dosPatentesMatch[1].toUpperCase();
    patenteCarro = dosPatentesMatch[2].toUpperCase();
  } else {
    const etiquetaPatenteMatch = normalized.match(
      /\bPatente(?:s)?\s*(?:Cami[oó]n\s*\/?\s*Carro)?\s*:?\s*([A-Z0-9-]{4,9})(?:\s*(?:\/|-)\s*([A-Z0-9-]{4,9}))?\b/i
    );
    if (etiquetaPatenteMatch) {
      patenteCamion = etiquetaPatenteMatch[1].toUpperCase();
      patenteCarro = (etiquetaPatenteMatch[2] || '').toUpperCase();
    }
  }

  // 5. Nombre del chofer (antes del RUT con o sin puntos, o antes de "Patente: RUT Transp.: Nombre Transp.:")
  let nombreChofer = '';
  const choferAntesRutMatch = normalized.match(
    /\b([A-ZÁÉÍÓÚÑ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ]{2,}){1,5})\s+\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\s+Patente:/
  );
  if (choferAntesRutMatch) {
    nombreChofer = limpiarNombreChofer(choferAntesRutMatch[1]);
  } else {
    const choferAntesBloqueTranspMatch = normalized.match(
      /\b([A-ZÁÉÍÓÚÑ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ]{2,}){1,5})\s+(?:\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\s+)?Patente:\s*RUT\s*Transp\.:/i
    );
    if (choferAntesBloqueTranspMatch) {
      nombreChofer = limpiarNombreChofer(choferAntesBloqueTranspMatch[1]);
    } else {
      const choferEtiquetaMatch = normalized.match(
        /(?:Nombre\s*Transp\.?|Chofer)\s*:?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s.]{2,45}?)(?=\s+(?:RUT\s*Transp|Patente|SON:|Observaciones|Timbre|Folio|FECHA|PAIS|Celular|\d{2}[-/]\d{2}[-/]\d{4}|$))/i
      );
      if (choferEtiquetaMatch) {
        nombreChofer = limpiarNombreChofer(choferEtiquetaMatch[1]);
      }
    }
  }

  // 6. Destino ("Puerto de Destino:") y Compañía de Transporte ("Nave:")
  let destino = '';
  let companiaTransporte = '';

  // Caso A: etiquetas explícitas "Puerto de Destino:" y "Nave:" seguidas de sus valores en columna
  const puertoDestinoEtiquetaMatch = normalized.match(
    /Puerto\s+de\s+Destino\s*:\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\-]{1,35}?)(?=\s+(?:Nave\s*:|Numero\s+de\s+Contendor\s*:|Sello\s+Naviera\s*:|Reserva\s*:|$))/i
  );
  if (puertoDestinoEtiquetaMatch) {
    destino = puertoDestinoEtiquetaMatch[1].replace(/^[:.\-\s]+|[:.\-\s]+$/g, '').trim();
  }

  const naveEtiquetaMatch = normalized.match(
    /\bNave\s*:\s*([A-Z0-9ÁÉÍÓÚÑ][A-Z0-9ÁÉÍÓÚÑ\s\-_.\/]{1,45}?)(?=\s+(?:Numero\s+de\s+Contendor\s*:|N[°º]?\s*Contenedor\s*:|Sello\s+Naviera\s*:|Sello\s+USDA-APHIS\s*:|Reserva\s*:|Termografo\s*:|Referencia\s*:|$))/i
  );
  if (naveEtiquetaMatch) {
    companiaTransporte = naveEtiquetaMatch[1].replace(/^[:.\-\s]+|[:.\-\s]+$/g, '').trim();
  }

  // Caso B: en PDFs donde las etiquetas salen juntas y los valores salen en fila tras "LOS PRECIOS SON REFERENCIALES"
  if (!destino || !companiaTransporte) {
    const bloqueConConsignatarioMatch = normalized.match(
      /LOS PRECIOS SON REFERENCIALES\s+[\d.]+\s+[\d.]+\s+[A-Z0-9ÁÉÍÓÚÑ\s.&-]+?\s+([A-ZÁÉÍÓÚÑ]+(?:\s+[A-ZÁÉÍÓÚÑ]+){0,2}?)\s+([A-Z0-9ÁÉÍÓÚÑ]+(?:\s+[A-Z0-9ÁÉÍÓÚÑ]+){0,3}?)\s+(?:[A-Z]{4}\d{6,7}-\d|[A-Z]{4}\d{7}|ML-[A-Z0-9]+|\d{6,})/i
    );

    if (bloqueConConsignatarioMatch) {
      if (!destino) destino = bloqueConConsignatarioMatch[1].trim();
      if (!companiaTransporte) companiaTransporte = bloqueConConsignatarioMatch[2].trim();
    } else {
      const bloqueExportMatch = normalized.match(
        /LOS PRECIOS SON REFERENCIALES\s+[\d.]+\s+[\d.]+\s+[A-Z0-9ÁÉÍÓÚÑ\s.&-]+?\s+(ROTTERDAM|[A-ZÁÉÍÓÚÑ]{4,25})\s+([A-Z0-9ÁÉÍÓÚÑ][A-Z0-9ÁÉÍÓÚÑ\s-]{2,35}?)\s+(?:MSDU|[A-Z]{4}\d{7}|FX\d+|EBKG|\d{6,})/
      );

      if (bloqueExportMatch) {
        if (!destino) destino = bloqueExportMatch[1].trim();
        if (!companiaTransporte) companiaTransporte = bloqueExportMatch[2].trim();
      }
    }
  }

  return emptyChequeo({
    numeroGuia,
    nombreChofer,
    companiaTransporte,
    fecha,
    hora,
    destino,
    patenteCamion,
    patenteCarro,
  });
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += `\n${strings}`;
  }

  console.log('TEXTO DEL PDF:', fullText);
  return fullText;
}

export const ChequeoPrecargaView: React.FC = () => {
  const [chequeos, setChequeos] = useState<GuiaChequeoData[]>([]);
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setProcessing(true);
    setStatusMsg(`Procesando ${files.length} guía(s)...`);

    try {
      const nuevos: GuiaChequeoData[] = [];
      for (const file of files) {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const text = await extractTextFromPdf(file);
          nuevos.push(parseGuiaText(text, file.name));
        } else {
          const text = await file.text();
          nuevos.push(parseGuiaText(text, file.name));
        }
      }
      setChequeos((prev) => [...prev, ...nuevos]);
      setStatusMsg(`Se generaron ${nuevos.length} chequeo(s) desde las guías subidas.`);
    } catch (err) {
      console.error('Error al leer guías:', err);
      setStatusMsg('Hubo un problema al leer una de las guías. Puedes revisar o completar los campos manualmente.');
    } finally {
      setProcessing(false);
      e.target.value = '';
    }
  };

  const updateField = (id: string, field: keyof GuiaChequeoData, value: string) => {
    setChequeos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeChequeo = (id: string) => {
    setChequeos((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-root space-y-6 w-full">
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-root,
          .print-list,
          .print-item-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-list > * + * {
            margin-top: 0 !important;
          }
          .print-sheet {
            page-break-after: always;
            break-after: page;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            outline: none !important;
            background: #ffffff !important;
            margin: 0 auto !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 190mm !important;
          }
          .print-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }

        .fho-sheet {
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          background: #fff;
          font-size: 9.5pt;
          line-height: 1.25;
          width: 100%;
          max-width: 188mm;
          margin: 0 auto;
          padding: 10mm 12mm;
        }
        .fho-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          gap: 12px;
        }
        .fho-logo-box {
          width: 24%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .fho-logo-img {
          width: 84px;
          height: 84px;
          object-fit: contain;
          display: block;
        }
        .fho-header-table {
          width: 76%;
          border-collapse: collapse;
          font-size: 9pt;
        }
        .fho-header-table td {
          border: 1px solid #000;
          padding: 4px 8px;
          vertical-align: middle;
        }
        .fho-title-top {
          text-align: center;
          font-weight: bold;
          font-size: 9.5pt;
          width: 63%;
        }
        .fho-title-bottom {
          text-align: center;
          font-weight: bold;
          font-size: 9.5pt;
        }
        .fho-meta {
          width: 37%;
          font-size: 8.5pt;
          text-align: left;
        }
        .fho-info-section {
          margin: 12px 0 14px 12px;
          width: 78%;
        }
        .fho-info-row {
          display: flex;
          align-items: flex-end;
          margin-bottom: 5px;
          font-size: 8.8pt;
          font-weight: bold;
        }
        .fho-info-label {
          width: 38%;
          white-space: nowrap;
        }
        .fho-info-val {
          width: 62%;
          border-bottom: 1px solid #000;
          min-height: 14px;
          padding: 0 4px 1px 4px;
          font-weight: normal;
        }
        table.fho-checklist {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 8.8pt;
        }
        table.fho-checklist th,
        table.fho-checklist td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: center;
          vertical-align: middle;
        }
        table.fho-checklist th {
          background-color: #d9d9d9;
          font-weight: bold;
        }
        table.fho-checklist td.item-col {
          font-weight: bold;
          width: 44%;
        }
        table.fho-checklist td.si-col,
        table.fho-checklist td.no-col {
          width: 8%;
        }
        table.fho-checklist td.action-col {
          font-weight: bold;
          width: 40%;
        }
        .fho-bottom-tables {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
        }
        table.fho-subtable {
          border-collapse: collapse;
          font-size: 8.5pt;
        }
        table.fho-subtable th,
        table.fho-subtable td {
          border: 1px solid #000;
          padding: 5px 6px;
          vertical-align: middle;
        }
        table.fho-subtable th {
          background-color: #d9d9d9;
          font-weight: bold;
          text-align: center;
        }
        .fho-temp-table {
          width: 57%;
        }
        .fho-temp-table td.row-label {
          font-weight: bold;
          text-align: left;
          width: 46%;
          padding-top: 10px;
          padding-bottom: 4px;
        }
        .fho-temp-table th.tc-col {
          width: 22%;
        }
        .fho-temp-table th.req-col {
          width: 16%;
        }
        .fho-sag-table {
          width: 41%;
        }
        .fho-sag-table th {
          width: 25%;
        }
        .fho-sag-table td {
          height: 26px;
        }
        .fho-observations {
          font-size: 8.8pt;
          font-weight: bold;
          margin-bottom: 14px;
          line-height: 1.35;
        }
        table.fho-approval-table {
          width: 57%;
          border-collapse: collapse;
          margin-bottom: 22px;
          font-size: 9pt;
        }
        table.fho-approval-table td {
          border: 1px solid #000;
          padding: 5px 8px;
          font-weight: bold;
          text-align: center;
        }
        table.fho-approval-table td.label-cell {
          width: 68%;
        }
        table.fho-approval-table td.check-cell {
          width: 16%;
        }
        .fho-signature-section {
          width: 66%;
          margin-top: 8px;
        }
        .fho-sig-row {
          display: flex;
          align-items: flex-end;
          margin-bottom: 16px;
          font-size: 9pt;
        }
        .fho-sig-label {
          width: 48%;
        }
        .fho-sig-line {
          width: 52%;
          border-bottom: 1px solid #000;
          height: 14px;
        }
      `}</style>

      <div className="no-print bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Chequeo de Pre-Carga para Camiones (R27-POE41-BRC6.1)
            </h2>
            <p className="text-xs text-slate-500">
              Sube una o varias guías en PDF para generar automáticamente 1 chequeo listo para imprimir en tamaño Carta.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setChequeos((prev) => [...prev, emptyChequeo()])}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Plus className="h-4 w-4" /> Chequeo vacío
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={chequeos.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition"
            >
              <Printer className="h-4 w-4" /> Imprimir ({chequeos.length})
            </button>
          </div>
        </div>

        <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-6 text-center cursor-pointer hover:bg-blue-50 transition">
          <Upload className="h-7 w-7 text-blue-600 mb-2" />
          <span className="text-sm font-bold text-blue-900">
            {processing ? 'Extrayendo datos de las guías...' : 'Haz clic aquí para subir una o varias guías (PDF)'}
          </span>
          <span className="text-xs text-blue-600 mt-1">
            Extrae automáticamente: Chofer, Compañía de Transporte (Nave), Fecha, Hora, Destino, Patente camión y Patente carro.
          </span>
          <input
            type="file"
            accept=".pdf,text/plain"
            multiple
            onChange={handleFilesUpload}
            className="hidden"
          />
        </label>

        {statusMsg && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {chequeos.length === 0 ? (
        <div className="no-print rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 text-sm">
          Sube tus guías arriba para generar los chequeos listos para imprimir.
        </div>
      ) : (
        <div className="print-list space-y-8">
          {chequeos.map((item, idx) => (
            <div key={item.id} className="print-item-wrapper space-y-3">
              <div className="no-print bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>
                      Chequeo #{idx + 1} {item.numeroGuia ? `— Guía N° ${item.numeroGuia}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChequeo(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Quitar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Nombre del chofer</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                      value={item.nombreChofer}
                      onChange={(e) => updateField(item.id, 'nombreChofer', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Compañía de Transporte (Nave)</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                      value={item.companiaTransporte}
                      onChange={(e) => updateField(item.id, 'companiaTransporte', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Fecha</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                      value={item.fecha}
                      onChange={(e) => updateField(item.id, 'fecha', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Hora</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                      placeholder="Ej. 10:30"
                      value={item.hora}
                      onChange={(e) => updateField(item.id, 'hora', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Destino</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                      value={item.destino}
                      onChange={(e) => updateField(item.id, 'destino', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Patente camión</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                      value={item.patenteCamion}
                      onChange={(e) => updateField(item.id, 'patenteCamion', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Patente carro</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                      value={item.patenteCarro}
                      onChange={(e) => updateField(item.id, 'patenteCarro', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="print-sheet fho-sheet rounded-2xl border border-slate-200 shadow-sm">
                <div className="fho-header">
                  <div className="fho-logo-box">
                    <img
                      src="/logo%20HO.jpeg"
                      alt="Logo Agrícola Frutícola y Forestal Higuera Oriente"
                      className="fho-logo-img"
                    />
                  </div>
                  <table className="fho-header-table">
                    <tbody>
                      <tr>
                        <td className="fho-title-top">FRUTÍCOLA HIGUERA ORIENTE</td>
                        <td className="fho-meta">Código: R27-POE41-BRC6.1</td>
                      </tr>
                      <tr>
                        <td className="fho-title-bottom" rowSpan={2}>
                          CHEQUEO DE PRE-CARGA PARA CAMIONES
                        </td>
                        <td className="fho-meta">Versión: &nbsp;&nbsp;&nbsp;&nbsp;04</td>
                      </tr>
                      <tr>
                        <td className="fho-meta">Fecha: 19-06-2026</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="fho-info-section">
                  <div className="fho-info-row">
                    <span className="fho-info-label">Nombre del chofer</span>
                    <span className="fho-info-val">{item.nombreChofer}</span>
                  </div>
                  <div className="fho-info-row">
                    <span className="fho-info-label">Compañía de Transporte</span>
                    <span className="fho-info-val">{item.companiaTransporte}</span>
                  </div>
                  <div className="fho-info-row">
                    <span className="fho-info-label">Fecha</span>
                    <span className="fho-info-val">{item.fecha}</span>
                  </div>
                  <div className="fho-info-row">
                    <span className="fho-info-label">Hora</span>
                    <span className="fho-info-val">{item.hora}</span>
                  </div>
                  <div className="fho-info-row">
                    <span className="fho-info-label">Destino</span>
                    <span className="fho-info-val">{item.destino}</span>
                  </div>
                  <div className="fho-info-row">
                    <span className="fho-info-label">Patente camión</span>
                    <span className="fho-info-val">{item.patenteCamion}</span>
                  </div>
                  <div className="fho-info-row">
                    <span className="fho-info-label">Patente carro</span>
                    <span className="fho-info-val">{item.patenteCarro}</span>
                  </div>
                </div>

                <table className="fho-checklist">
                  <thead>
                    <tr>
                      <th className="item-col">ITEM</th>
                      <th className="si-col">SI</th>
                      <th className="no-col">NO</th>
                      <th className="action-col">Si es NO, hacer lo siguiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="item-col">El interior de la carrocería está limpia</td>
                      <td className="si-col"></td>
                      <td className="no-col"></td>
                      <td className="action-col">Hacer lavado del interior de la carrocería</td>
                    </tr>
                    <tr>
                      <td className="item-col">Los orificios de drenajes limpios</td>
                      <td className="si-col"></td>
                      <td className="no-col"></td>
                      <td className="action-col">Hacer limpieza</td>
                    </tr>
                    <tr>
                      <td className="item-col">El equipo de refrigeración opera adecuadamente</td>
                      <td className="si-col"></td>
                      <td className="no-col"></td>
                      <td className="action-col">Llamar a otro camión hasta su reparación</td>
                    </tr>
                    <tr>
                      <td className="item-col">Las puertas y cerraduras sin daños y en buen funcionamiento</td>
                      <td className="si-col"></td>
                      <td className="no-col"></td>
                      <td className="action-col">Llamar a otro camión hasta su reparación</td>
                    </tr>
                    <tr>
                      <td className="item-col">El interior de la carrocería está libre de olores extraños</td>
                      <td className="si-col"></td>
                      <td className="no-col"></td>
                      <td className="action-col">Hacer lavado del interior de la carrocería con detergente y aplicar sanitizante</td>
                    </tr>
                    <tr>
                      <td className="item-col">El camión ha sido usado previamente para transporte de ganado o productos animales no embalados</td>
                      <td className="si-col"></td>
                      <td className="no-col"></td>
                      <td className="action-col">Si es Sí, hacer lavado del interior de la carrocería con detergente y aplicar sanitizante</td>
                    </tr>
                  </tbody>
                </table>

                <div className="fho-bottom-tables">
                  <table className="fho-subtable fho-temp-table">
                    <thead>
                      <tr>
                        <th>Temperaturas al Momento de carga</th>
                        <th className="tc-col">T° C</th>
                        <th className="req-col">Cumple<br />requisitos</th>
                        <th className="req-col">No cumple</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="row-label">Del producto</td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="row-label">Del camión</td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="fho-subtable fho-sag-table">
                    <thead>
                      <tr>
                        <th colSpan={2}>Sellos SAG</th>
                        <th colSpan={2}>Documentos SAG</th>
                      </tr>
                      <tr>
                        <th>Cumple<br />requisitos</th>
                        <th>No cumple</th>
                        <th>Cumple<br />requisitos</th>
                        <th>No cumple</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="fho-observations">
                  Observaciones: Si el camión no cumple con las condiciones para cargar, deberá dar aviso al jefe de despacho o jefe de planta. No se podrá cargar hasta que no se cumpla condiciones para ello.
                </div>

                <table className="fho-approval-table">
                  <tbody>
                    <tr>
                      <td className="label-cell">Aprobado para cargar por:</td>
                      <td className="check-cell">SI</td>
                      <td className="check-cell">NO</td>
                    </tr>
                  </tbody>
                </table>

                <div className="fho-signature-section">
                  <div className="fho-sig-row">
                    <span className="fho-sig-label">Nombre de responsable:</span>
                    <span className="fho-sig-line"></span>
                  </div>
                  <div className="fho-sig-row">
                    <span className="fho-sig-label">Firma responsable:</span>
                    <span className="fho-sig-line"></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
