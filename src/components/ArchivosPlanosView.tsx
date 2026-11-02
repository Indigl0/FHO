import { useState } from 'react';
import { FileText, Download, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface PalletItem {
  id: string;
  nPallet: string;
  cantidadCajas: number | '';
}

export default function ArchivosPlanosView() {
  const [tipoFormato, setTipoFormato] = useState<'INS' | 'DES'>('INS');
  const [nSolicitud, setNSolicitud] = useState('');
  const [codigoEspecie] = useState('10314200'); // Fijo por regla SAG
  const [establecimiento] = useState('0984'); // Fijo por regla SAG
  
  // Códigos de país destino con valores por defecto (editables)
  const [codigoPais1, setCodigoPais1] = useState('520');
  const [codigoPais2, setCodigoPais2] = useState('000');

  const [fecha, setFecha] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  });

  const [pallets, setPallets] = useState<PalletItem[]>([
    { id: '1', nPallet: '', cantidadCajas: '' }
  ]);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddPallet = () => {
    setPallets([...pallets, { id: Date.now().toString(), nPallet: '', cantidadCajas: '' }]);
  };

  const handleRemovePallet = (id: string) => {
    if (pallets.length === 1) return;
    setPallets(pallets.filter((p) => p.id !== id));
  };

  const handlePalletChange = (id: string, field: 'nPallet' | 'cantidadCajas', value: any) => {
    setPallets(
      pallets.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const generarArchivoPlano = () => {
    setErrorMsg('');
    setSuccessMsg('');

    // Validaciones estrictas
    if (!nSolicitud.trim()) {
      setErrorMsg('El campo N° Solicitud (ISV) es obligatorio.');
      return;
    }
    if (!codigoPais1.trim() || codigoPais1.length !== 3) {
      setErrorMsg('El Código País Destino (1) debe tener exactamente 3 dígitos.');
      return;
    }
    if (!codigoPais2.trim() || codigoPais2.length !== 3) {
      setErrorMsg('El Código País Destino (2) debe tener exactamente 3 dígitos.');
      return;
    }
    if (!fecha.trim() || fecha.length !== 8) {
      setErrorMsg('La Fecha debe tener el formato AAAAMMDD (8 dígitos).');
      return;
    }

    // Validar pallets
    for (let i = 0; i < pallets.length; i++) {
      const p = pallets[i];
      if (!p.nPallet.trim()) {
        setErrorMsg(`El Pallet #${i + 1} tiene el campo "Folio del Pallet" vacío.`);
        return;
      }
      if (p.cantidadCajas === '' || Number(p.cantidadCajas) <= 0) {
        setErrorMsg(`El Pallet #${i + 1} (${p.nPallet || 'Sin Folio'}) debe tener una Cantidad de Cajas válida mayor a 0.`);
        return;
      }
    }

    // Construcción del Archivo Plano SAG según norma D-PA-EA-021
    let contenido = '';
    
    pallets.forEach((p, index) => {
      const numLinea = String(index + 1).padStart(3, '0');
      const est = establecimiento.padEnd(4, '0');
      const isv = nSolicitud.padStart(5, '0');
      const esp = codigoEspecie.padEnd(8, '0');
      const pais1 = codigoPais1.padEnd(3, '0');
      const pais2 = codigoPais2.padEnd(3, '0');
      const fch = fecha.padEnd(8, '0');
      const nroPallet = String(p.nPallet || '').padEnd(10, ' ').slice(0, 10);
      const cjs = String(p.cantidadCajas || 0).padStart(5, '0');

      contenido += `${numLinea}|${est}|${isv}|${esp}|${pais1}|${pais2}|${fch}|${nroPallet}|${cjs}\r\n`;
    });

    // Descarga del archivo
    const extension = tipoFormato.toLowerCase();
    const nombreArchivo = `SAG_${nSolicitud}_${tipoFormato}.${extension}`;
    
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccessMsg(`¡Archivo ${nombreArchivo} generado y descargado con éxito!`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col items-center justify-center text-center space-y-1.5 py-4 border-b border-gray-200">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
          <FileText className="h-3.5 w-3.5" /> Módulo de Cumplimiento SAG
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Generador de Archivos Planos SAG
        </h2>
        <p className="text-xs font-medium text-slate-500 max-w-lg">
          Confección y validación de archivos normativos (D-PA-EA-021) para Inspección, Reinspección y Fumigación.
        </p>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl shadow-sm text-xs font-bold animate-fadeIn">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Alerta de Éxito */}
      {successMsg && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl shadow-sm text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Selección de Formato */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Seleccione Formato</h3>
        <div className="flex items-center gap-4">
          <div className="w-full max-w-xs">
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Formato de Archivo</label>
            <select
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-semibold outline-none focus:border-blue-500 bg-white shadow-sm"
              value={tipoFormato}
              onChange={(e) => setTipoFormato(e.target.value as 'INS' | 'DES')}
            >
              <option value="INS">Inspección, Reinspección o Fumigación (.INS)</option>
              <option value="DES">Despacho (.DES)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Datos de Encabezado */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Datos de Encabezado</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">N° Establecimiento (4 dígitos)</label>
            <input
              type="text"
              value={establecimiento}
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">N° Solicitud / ISV (5 dígitos) *</label>
            <input
              type="text"
              maxLength={5}
              placeholder="Ej: 31000"
              value={nSolicitud}
              onChange={(e) => setNSolicitud(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-bold outline-none focus:border-blue-500 bg-white"
            />
          </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Código País Destino (1) *</label>
            <input
              type="text"
              maxLength={3}
              value={codigoPais1}
              onChange={(e) => setCodigoPais1(e.target.value)}
              className="w-full rounded-xl border border-blue-300 bg-blue-50/50 p-2.5 text-xs font-bold text-blue-900 outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Código País Destino (2) *</label>
            <input
              type="text"
              maxLength={3}
              value={codigoPais2}
              onChange={(e) => setCodigoPais2(e.target.value)}
              className="w-full rounded-xl border border-blue-300 bg-blue-50/50 p-2.5 text-xs font-bold text-blue-900 outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fecha (AAAAMMDD) *</label>
            <input
              type="text"
              maxLength={8}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-bold outline-none focus:border-blue-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* 3. Detalle de Pallets */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Detalle de Pallets (Estructura Interna)</h3>
          <button
            onClick={handleAddPallet}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" /> Agregar Pallet
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {pallets.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-500 w-6">#{idx + 1}</span>
              
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Folio del Pallet (máx. 10 dígitos) *</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Ej: 0000011111"
                  value={p.nPallet}
                  onChange={(e) => handlePalletChange(p.id, 'nPallet', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs font-semibold bg-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="w-36">
                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Cantidad de Cajas *</label>
                <input
                  type="number"
                  min={1}
                  placeholder="0"
                  value={p.cantidadCajas}
                  onChange={(e) => handlePalletChange(p.id, 'cantidadCajas', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs font-semibold bg-white outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => handleRemovePallet(p.id)}
                disabled={pallets.length === 1}
                className="mt-4 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                title="Eliminar pallet"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Botón de Generación Final */}
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
