import { useState } from 'react';
import { FileText, Download, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface PalletItem {
  id: string;
  nPallet: string;
  cantidadCajas: number | '';
  accion?: 'A' | 'M' | 'E';
  solicitudInspeccion?: string;
  codigoPais?: string;
  fechaInspeccion?: string;
  finInfo?: string;
}

type TipoFormato = 'INS' | 'INT' | 'REP' | 'DET' | 'DES';

function soloDigitos(valor: string, len: number): string {
  const limpio = String(valor || '').replace(/[^0-9]/g, '0');
  return limpio.padStart(len, '0').slice(-len);
}

export default function ArchivosPlanosView() {
  const [tipoFormato, setTipoFormato] = useState<TipoFormato>('INS');
  const [nSolicitud, setNSolicitud] = useState('');
  const [codigoEspecie] = useState('10314200'); // Fijo por regla SAG (8 dígitos)
  const [establecimiento] = useState('0984'); // Fijo por regla SAG (4 dígitos)

  const [codigoPais1, setCodigoPais1] = useState('520');
  const [codigoPais2, setCodigoPais2] = useState('000');

  // Campos adicionales para INT, REP y DET según D-PA-EA-021
  const [establecimiento3, setEstablecimiento3] = useState('098');
  const [correlativoDoc, setCorrelativoDoc] = useState('');

  const [fecha, setFecha] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  });

  const [pallets, setPallets] = useState<PalletItem[]>([
    {
      id: '1',
      nPallet: '',
      cantidadCajas: '',
      accion: 'A',
      solicitudInspeccion: '',
      codigoPais: '520',
      fechaInspeccion: '',
      finInfo: '00',
    },
  ]);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [invalidField, setInvalidField] = useState<string | null>(null);

  const handleAddPallet = () => {
    setPallets([
      ...pallets,
      {
        id: Date.now().toString(),
        nPallet: '',
        cantidadCajas: '',
        accion: 'A',
        solicitudInspeccion: nSolicitud,
        codigoPais: codigoPais1,
        fechaInspeccion: fecha,
        finInfo: '00',
      },
    ]);
  };

  const handleRemovePallet = (id: string) => {
    if (pallets.length === 1) return;
    setPallets(pallets.filter((p) => p.id !== id));
  };

  const handlePalletChange = (id: string, field: keyof PalletItem, value: any) => {
    setPallets(pallets.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const generarArchivoPlano = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setInvalidField(null);

    if (tipoFormato === 'INS' || tipoFormato === 'DES') {
      if (!nSolicitud.trim()) {
        setErrorMsg('El campo N° Solicitud (ISV) es obligatorio.');
        setInvalidField('nSolicitud');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!codigoPais1.trim() || codigoPais1.length !== 3) {
        setErrorMsg('El Código País Destino (1) debe tener exactamente 3 dígitos.');
        setInvalidField('pais1');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (tipoFormato === 'INS' && (!codigoPais2.trim() || codigoPais2.length !== 3)) {
        setErrorMsg('El Código País Destino (2) debe tener exactamente 3 dígitos.');
        setInvalidField('pais2');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!fecha.trim() || fecha.length !== 8) {
        setErrorMsg('La Fecha debe tener el formato AAAAMMDD (8 dígitos).');
        setInvalidField('fecha');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } else {
      if (!correlativoDoc.trim()) {
        setErrorMsg(
          tipoFormato === 'INT'
            ? 'El N° Planilla / Correlativo Interplanta (5 dígitos) es obligatorio.'
            : tipoFormato === 'REP'
            ? 'El Número de Repaletizaje es obligatorio.'
            : 'El Correlativo de Anulación (5 dígitos) es obligatorio.'
        );
        setInvalidField('correlativoDoc');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (tipoFormato === 'INT' && (!fecha.trim() || fecha.length !== 8)) {
        setErrorMsg('La Fecha debe tener el formato AAAAMMDD (8 dígitos).');
        setInvalidField('fecha');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    for (let i = 0; i < pallets.length; i++) {
      const p = pallets[i];
      if (!p.nPallet.trim()) {
        setErrorMsg(`El Pallet #${i + 1} tiene el campo "Folio del Pallet" vacío.`);
        setInvalidField(`pallet-folio-${p.id}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (tipoFormato !== 'DET' && (p.cantidadCajas === '' || Number(p.cantidadCajas) <= 0)) {
        setErrorMsg(`El Pallet #${i + 1} (${p.nPallet || 'Sin Folio'}) debe tener una Cantidad de Cajas válida mayor a 0.`);
        setInvalidField(`pallet-cajas-${p.id}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (tipoFormato === 'REP') {
        if (!p.fechaInspeccion || p.fechaInspeccion.trim().length !== 8) {
          setErrorMsg(`El Pallet #${i + 1} requiere Fecha de Inspección en formato AAAAMMDD (8 dígitos).`);
          setInvalidField(`pallet-fecha-${p.id}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    const lineas: string[] = [];
    const totalPalletsStr = String(pallets.length).padStart(4, '0');

    if (tipoFormato === 'INS') {
      const isv5 = nSolicitud.padStart(5, '0');
      const estab4 = establecimiento.padStart(4, '0');
      const esp8 = codigoEspecie.padStart(8, '0');
      const p1_3 = codigoPais1.padStart(3, '0');
      const p2_3 = codigoPais2.padStart(3, '0');
      const fch8 = fecha.padStart(8, '0');

      lineas.push(`${isv5}${estab4}${esp8}${p1_3}${p2_3}${fch8}${totalPalletsStr}`);

      pallets.forEach((p) => {
        const folio10 = String(p.nPallet || '').padStart(10, '0');
        const cajas4 = String(p.cantidadCajas || 0).padStart(4, '0');
        lineas.push(`${folio10}${cajas4}`);
      });
    } else if (tipoFormato === 'DES') {
      const estab4 = establecimiento.padStart(4, '0');
      const p1_3 = codigoPais1.padStart(3, '0');
      const fch8 = fecha.padStart(8, '0');

      lineas.push(`${estab4}${p1_3}${fch8}${totalPalletsStr}`);

      const esp8 = codigoEspecie.padStart(8, '0');
      pallets.forEach((p) => {
        const folio10 = String(p.nPallet || '').padStart(10, '0');
        const cajas4 = String(p.cantidadCajas || 0).padStart(4, '0');
        lineas.push(`${folio10}${cajas4}${esp8}`);
      });
    } else if (tipoFormato === 'INT') {
      // Encabezado INT: Establecimiento sin región (3) + Correlativo interplanta (5) + Cantidad pallets (4)
      const estab3 = soloDigitos(establecimiento3, 3);
      const corr5 = soloDigitos(correlativoDoc, 5);
      lineas.push(`${estab3}${corr5}${totalPalletsStr}`);

      // Detalle INT: Folio pallet (10) + Número cajas (4) + Código especie (8) + Código país (3) + Fecha aaaammdd (8)
      const esp8 = soloDigitos(codigoEspecie, 8);
      const pais3 = soloDigitos(codigoPais1, 3);
      const fch8 = soloDigitos(fecha, 8);
      pallets.forEach((p) => {
        const folio10 = soloDigitos(p.nPallet, 10);
        const cajas4 = soloDigitos(String(p.cantidadCajas || 0), 4);
        lineas.push(`${folio10}${cajas4}${esp8}${pais3}${fch8}`);
      });
    } else if (tipoFormato === 'REP') {
      // Encabezado REP: Establecimiento sin región (4) + Número repaletizaje (4)
      const estab4 = soloDigitos(establecimiento, 4);
      const rep4 = soloDigitos(correlativoDoc, 4);
      lineas.push(`${estab4}${rep4}`);

      // Detalle REP: Acción A/M/E (1) + Solicitud inspección (5) + Folio pallet (10) + Cajas (4) + Especie (8) + País (3) + Fecha inspec aaaammdd (8) + Fin info (2)
      const esp8 = soloDigitos(codigoEspecie, 8);
      pallets.forEach((p) => {
        const acc1 = (p.accion || 'A') as 'A' | 'M' | 'E';
        const sol5 = soloDigitos(p.solicitudInspeccion || nSolicitud || '0', 5);
        const folio10 = soloDigitos(p.nPallet, 10);
        const cajas4 = soloDigitos(String(p.cantidadCajas || 0), 4);
        const pais3 = soloDigitos(p.codigoPais || codigoPais1 || '0', 3);
        const fchIns8 = soloDigitos(p.fechaInspeccion || fecha, 8);
        const fin2 = soloDigitos(p.finInfo || '00', 2);
        lineas.push(`${acc1}${sol5}${folio10}${cajas4}${esp8}${pais3}${fchIns8}${fin2}`);
      });
    } else if (tipoFormato === 'DET') {
      // Encabezado DET: Correlativo anulación (5) + Establecimiento sin región (4) + Cantidad pallets anulados (4)
      const corr5 = soloDigitos(correlativoDoc, 5);
      const estab4 = soloDigitos(establecimiento, 4);
      lineas.push(`${corr5}${estab4}${totalPalletsStr}`);

      // Detalle DET: Folio pallet (10)
      pallets.forEach((p) => {
        const folio10 = soloDigitos(p.nPallet, 10);
        lineas.push(`${folio10}`);
      });
    }

    lineas.push('&&');

    const contenidoFinal = lineas.join('\r\n') + '\r\n';

    const extension = tipoFormato.toUpperCase();
    const prefijoEstab = tipoFormato === 'INT' ? soloDigitos(establecimiento3, 3) : soloDigitos(establecimiento, 4);
    const idArchivo5 = soloDigitos(tipoFormato === 'INS' || tipoFormato === 'DES' ? nSolicitud : correlativoDoc, 5);
    const nombreArchivo = `${prefijoEstab}${idArchivo5}.${extension}`;

    const blob = new Blob([contenidoFinal], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccessMsg(`¡Archivo ${nombreArchivo} generado y descargado con éxito con formato estricto SAG!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col items-center justify-center text-center space-y-1.5 py-4 border-b border-gray-200">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
          <FileText className="h-3.5 w-3.5" /> Módulo de Cumplimiento SAG (Norma D-PA-EA-021)
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Generador de Archivos Planos SAG
        </h2>
        <p className="text-xs font-medium text-slate-500 max-w-lg">
          Confección de archivos de ancho fijo sin delimitadores para Inspección, Interplanta, Repaletizaje, Anulaciones y Despacho.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl shadow-sm text-xs font-bold">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl shadow-sm text-xs font-bold">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Seleccione Formato</h3>
        <div className="flex items-center gap-4">
          <div className="w-full max-w-md">
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Formato de Archivo</label>
            <select
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-semibold outline-none focus:border-blue-500 bg-white shadow-sm"
              value={tipoFormato}
              onChange={(e) => setTipoFormato(e.target.value as TipoFormato)}
            >
              <option value="INS">Inspección, Reinspección o Fumigación (.INS)</option>
              <option value="INT">Despacho Interplanta y Devoluciones (.INT)</option>
              <option value="REP">Repaletizaje (.REP)</option>
              <option value="DET">Anulaciones (.DET)</option>
              <option value="DES">Despacho (.DES)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Datos de Encabezado</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              {tipoFormato === 'INT' ? 'N° Establecimiento (3 dígitos)' : 'N° Establecimiento (4 dígitos)'}
            </label>
            {tipoFormato === 'INT' ? (
              <input
                type="text"
                maxLength={3}
                value={establecimiento3}
                onChange={(e) => setEstablecimiento3(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-blue-500"
              />
            ) : (
              <input
                type="text"
                value={establecimiento}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold text-gray-600 cursor-not-allowed"
              />
            )}
          </div>

          {tipoFormato === 'INS' || tipoFormato === 'DES' ? (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                {tipoFormato === 'INS' ? 'N° Solicitud / SIF (5 dígitos) *' : 'N° Planilla Despacho (5 dígitos) *'}
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="Ej: 00001"
                value={nSolicitud}
                onChange={(e) => setNSolicitud(e.target.value)}
                className={`w-full rounded-xl border p-2.5 text-xs font-bold outline-none bg-white ${
                  invalidField === 'nSolicitud'
                    ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                {tipoFormato === 'INT'
                  ? 'N° Planilla / Correlativo Interplanta (5 dígitos) *'
                  : tipoFormato === 'REP'
                  ? 'Número de Repaletizaje (4 dígitos encab. / 5 arch.) *'
                  : 'Correlativo de Anulación (5 dígitos) *'}
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="Ej: 00038"
                value={correlativoDoc}
                onChange={(e) => setCorrelativoDoc(e.target.value)}
                className={`w-full rounded-xl border p-2.5 text-xs font-bold outline-none bg-white ${
                  invalidField === 'correlativoDoc'
                    ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Código de Especie</label>
            <input
              type="text"
              value={codigoEspecie}
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>

        {(tipoFormato === 'INS' || tipoFormato === 'DES' || tipoFormato === 'INT') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Código País Destino (1) *</label>
              <input
                type="text"
                maxLength={3}
                value={codigoPais1}
                onChange={(e) => setCodigoPais1(e.target.value)}
                className={`w-full rounded-xl border p-2.5 text-xs font-bold outline-none ${
                  invalidField === 'pais1'
                    ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20 text-rose-900'
                    : 'border-blue-300 bg-blue-50/50 text-blue-900 focus:border-blue-500'
                }`}
              />
            </div>

            {tipoFormato === 'INS' ? (
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Código País Destino (2) *</label>
                <input
                  type="text"
                  maxLength={3}
                  value={codigoPais2}
                  onChange={(e) => setCodigoPais2(e.target.value)}
                  className={`w-full rounded-xl border p-2.5 text-xs font-bold outline-none ${
                    invalidField === 'pais2'
                      ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20 text-rose-900'
                      : 'border-blue-300 bg-blue-50/50 text-blue-900 focus:border-blue-500'
                  }`}
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Código País Destino (2)</label>
                <input
                  type="text"
                  value={`No aplica en ${tipoFormato}`}
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold text-gray-400 cursor-not-allowed"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fecha (AAAAMMDD) *</label>
              <input
                type="text"
                maxLength={8}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={`w-full rounded-xl border p-2.5 text-xs font-bold outline-none bg-white ${
                  invalidField === 'fecha'
                    ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            3. {tipoFormato === 'DET' ? 'Pallets Anulados (Estructura Interna)' : 'Detalle de Pallets (Estructura Interna)'}
          </h3>
          <button
            onClick={handleAddPallet}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" /> Agregar Pallet
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {pallets.map((p, idx) => {
            const isFolioInvalid = invalidField === `pallet-folio-${p.id}`;
            const isCajasInvalid = invalidField === `pallet-cajas-${p.id}`;
            const isFechaInsInvalid = invalidField === `pallet-fecha-${p.id}`;

            return (
              <div key={p.id} className="flex flex-wrap items-center gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-500 w-6">#{idx + 1}</span>

                {tipoFormato === 'REP' && (
                  <div className="w-24">
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Acción *</label>
                    <select
                      value={p.accion || 'A'}
                      onChange={(e) => handlePalletChange(p.id, 'accion', e.target.value as 'A' | 'M' | 'E')}
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs font-semibold bg-white outline-none focus:border-blue-500"
                    >
                      <option value="A">A (Agregar)</option>
                      <option value="M">M (Modificar)</option>
                      <option value="E">E (Eliminar)</option>
                    </select>
                  </div>
                )}

                {tipoFormato === 'REP' && (
                  <div className="w-28">
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Sol. Insp. (5)</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="00001"
                      value={p.solicitudInspeccion ?? nSolicitud}
                      onChange={(e) => handlePalletChange(p.id, 'solicitudInspeccion', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs font-semibold bg-white outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Folio del Pallet (10 dígitos) *</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Ej: 0000011111"
                    value={p.nPallet}
                    onChange={(e) => handlePalletChange(p.id, 'nPallet', e.target.value)}
                    className={`w-full rounded-lg border p-2 text-xs font-semibold bg-white outline-none ${
                      isFolioInvalid
                        ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                </div>

                {tipoFormato !== 'DET' && (
                  <div className="w-32">
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Cantidad de Cajas *</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="0"
                      value={p.cantidadCajas}
                      onChange={(e) =>
                        handlePalletChange(p.id, 'cantidadCajas', e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className={`w-full rounded-lg border p-2 text-xs font-semibold bg-white outline-none ${
                        isCajasInvalid
                          ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                          : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                  </div>
                )}

                {tipoFormato === 'REP' && (
                  <>
                    <div className="w-24">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">País (3)</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={p.codigoPais ?? codigoPais1}
                        onChange={(e) => handlePalletChange(p.id, 'codigoPais', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2 text-xs font-semibold bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">F. Insp. (AAAAMMDD) *</label>
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="20100620"
                        value={p.fechaInspeccion ?? fecha}
                        onChange={(e) => handlePalletChange(p.id, 'fechaInspeccion', e.target.value)}
                        className={`w-full rounded-lg border p-2 text-xs font-semibold bg-white outline-none ${
                          isFechaInsInvalid
                            ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Fin (2)</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={p.finInfo ?? '00'}
                        onChange={(e) => handlePalletChange(p.id, 'finInfo', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2 text-xs font-semibold bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={() => handleRemovePallet(p.id)}
                  disabled={pallets.length === 1}
                  className="mt-4 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={generarArchivoPlano}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-blue-700 transition"
        >
          <Download className="h-4 w-4" /> Generar y Descargar Archivo Plano SAG
        </button>
      </div>
    </div>
  );
}
