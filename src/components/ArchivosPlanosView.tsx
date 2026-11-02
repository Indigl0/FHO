import { useState } from 'react';
import { FileText, Download, Plus, Trash2, AlertCircle } from 'lucide-react';

interface PalletItem {
  folio: string;
  cajas: string;
  especie?: string;
}

export default function ArchivosPlanosView() {
  const [tipoArchivo, setTipoArchivo] = useState<'INS' | 'DES'>('INS');
  
  // Valores fijos y por defecto solicitados
  const establecimiento = '0984';
  const codigoEspecie = '10314200';
  
  const [numeroSolicitud, setNumeroSolicitud] = useState('');
  const [paisDestino1, setPaisDestino1] = useState('');
  const [paisDestino2, setPaisDestino2] = useState('520'); // Por defecto 520, editable
  const [fecha, setFecha] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  });

  const [pallets, setPallets] = useState<PalletItem[]>([{ folio: '', cajas: '', especie: '' }]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddPallet = () => {
    setPallets([...pallets, { folio: '', cajas: '', especie: '' }]);
  };

  const handleRemovePallet = (index: number) => {
    setPallets(pallets.filter((_, i) => i !== index));
  };

  const handlePalletChange = (index: number, field: keyof PalletItem, value: string) => {
    const updated = [...pallets];
    updated[index][field] = value.replace(/[^0-9]/g, '');
    setPallets(updated);
  };

  const padLeft = (str: string, length: number) => {
    const clean = str.replace(/[^0-9]/g, '') || '0';
    return clean.padStart(length, '0').slice(-length);
  };

  const generarArchivoPlano = () => {
    setErrorMsg(null);

    if (pallets.length === 0 || pallets.some(p => !p.folio || !p.cajas)) {
      setErrorMsg('Debe completar el folio y la cantidad de cajas para todos los pallets.');
      return;
    }

    let headerLine = '';
    let fileName = '';

    if (tipoArchivo === 'INS') {
      const est4 = padLeft(establecimiento, 4);
      const sif5 = padLeft(numeroSolicitud, 5);
      const esp8 = padLeft(codigoEspecie, 8);
      const p1 = padLeft(paisDestino1, 3);
      const p2 = padLeft(paisDestino2, 3);
      const fecha8 = padLeft(fecha, 8);
      const totalPallets4 = padLeft(String(pallets.length), 4);

      headerLine = `${sif5}${est4}${esp8}${p1}${p2}${fecha8}${totalPallets4}`;
      fileName = `${est4}${sif5}.INS`;
    } else {
      const est4 = padLeft(establecimiento, 4);
      const planilla5 = padLeft(numeroSolicitud, 5);
      const p1 = padLeft(paisDestino1, 3);
      const fecha8 = padLeft(fecha, 8);
      const totalPallets4 = padLeft(String(pallets.length), 4);

      headerLine = `${est4}${p1}${fecha8}${totalPallets4}`;
      fileName = `${est4}${planilla5}.DES`;
    }

    const internalLines = pallets.map((p) => {
      const folio10 = padLeft(p.folio, 10);
      const cajas4 = padLeft(p.cajas, 4);
      if (tipoArchivo === 'DES') {
        const esp8 = padLeft(p.especie || codigoEspecie, 8);
        return `${folio10}${cajas4}${esp8}`;
      }
      return `${folio10}${cajas4}`;
    });

    const fileContent = [headerLine, ...internalLines, '&&', ''].join('\r\n');

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Generador de Archivos Planos SAG</h2>
            <p className="text-xs text-gray-500">Normativa oficial D-PA-EA-021 (Inspecciones y Despachos)</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipo de Archivo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">1. Tipo de Trámite SAG</h3>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccione formato</label>
            <select
              className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              value={tipoArchivo}
              onChange={(e) => setTipoArchivo(e.target.value as 'INS' | 'DES')}
            >
              <option value="INS">Inspección, Reinspección o Fumigación (.INS)</option>
              <option value="DES">Despachos (.DES)</option>
            </select>
          </div>
        </div>

        {/* Datos de Encabezado */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">2. Datos de Encabezado</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Establecimiento Fijo */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">N° Establecimiento (Fijo)</label>
              <input
                type="text"
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-sm text-gray-600 cursor-not-allowed font-mono font-bold"
                value={establecimiento}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {tipoArchivo === 'INS' ? 'N° Solicitud / SIF (5 dígitos)' : 'N° Planilla Despacho (5 dígitos)'}
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ej. 31080"
                value={numeroSolicitud}
                onChange={(e) => setNumeroSolicitud(e.target.value)}
              />
            </div>

            {/* Código Especie Fijo */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Código de Especie (Fijo)</label>
              <input
                type="text"
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-sm text-gray-600 cursor-not-allowed font-mono font-bold"
                value={codigoEspecie}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Código País Destino (1)</label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ej. 038"
                value={paisDestino1}
                onChange={(e) => setPaisDestino1(e.target.value)}
              />
            </div>

            {/* Código País Destino (2) con 520 por defecto pero editable */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Código País Destino (2)</label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={paisDestino2}
                onChange={(e) => setPaisDestino2(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha (AAAAMMDD)</label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="20261102"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Estructura Interna / Pallets */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-900">3. Detalle de Pallets (Estructura Interna)</h3>
            <button
              type="button"
              onClick={handleAddPallet}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> Agregar Pallet
            </button>
          </div>

          <div className="space-y-3">
            {pallets.map((p, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-bold text-gray-400 w-6">#{index + 1}</span>
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Folio del Pallet (10 dígitos)</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs outline-none focus:border-blue-500 bg-white"
                    placeholder="Ej. 0000011111"
                    value={p.folio}
                    onChange={(e) => handlePalletChange(index, 'folio', e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Cantidad de Cajas</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs outline-none focus:border-blue-500 bg-white"
                    placeholder="Ej. 50"
                    value={p.cajas}
                    onChange={(e) => handlePalletChange(index, 'cajas', e.target.value)}
                  />
                </div>
                {tipoArchivo === 'DES' && (
                  <div className="w-36">
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Especie (8 dig)</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs outline-none focus:border-blue-500 bg-white"
                      placeholder="Opcional"
                      value={p.especie || ''}
                      onChange={(e) => handlePalletChange(index, 'especie', e.target.value)}
                    />
                  </div>
                )}
                {pallets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePallet(index)}
                    className="mt-5 p-2 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={generarArchivoPlano}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition"
        >
          <Download className="h-4 w-4" /> Generar y Descargar Archivo Plano SAG
        </button>
      </div>
    </div>
  );
}
