import React, { useState, useEffect } from 'react';
import { Search, BarChart2, Package, Download, FileCode } from 'lucide-react';
import { supabase } from '../utils/supabase';

export const ConsolidadoRechazosView: React.FC = () => {
  const [rechazos, setRechazos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRechazos();

    const channel = supabase
      .channel('public:rechazos_records')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rechazos_records' },
        () => {
          fetchRechazos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRechazos = async () => {
    try {
      const { data, error } = await supabase
        .from('rechazos_records')
        .select('*')
        .order('numero', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((r: any) => ({
        id: r.id,
        fecha: r.fecha || '',
        numero: r.numero || 1,
        lote: r.lote || '',
        productor: r.productor || '',
        tipoRechazo: r.tipo_rechazo || '',
        folio: r.folio || '',
        embalaje: r.embalaje || '',
        fechaEmbalaje: r.fecha_embalaje || '',
        procesoFho: r.proceso_fho || '',
        nRecillasFho: Number(r.n_recillas_fho) || 0,
        nRecillasAcopio: Number(r.n_recillas_acopio) || 0,
      }));

      setRechazos(formatted);
    } catch (err) {
      console.error('Error al cargar rechazos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRechazos = rechazos.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Cálculos para el resumen superior
  const totalRegistros = filteredRechazos.length;
  const totalReembalajes = filteredRechazos.filter(r => String(r.procesoFho).toUpperCase().includes('REEMBALAJE') || (Number(r.nRecillasFho) > 0 || Number(r.nRecillasAcopio) > 0)).length;
  const totalRecillasFho = filteredRechazos.reduce((acc, r) => acc + (Number(r.nRecillasFho) || 0), 0);
  const totalRecillasAcopio = filteredRechazos.reduce((acc, r) => acc + (Number(r.nRecillasAcopio) || 0), 0);
  const totalGeneralRecillas = totalRecillasFho + totalRecillasAcopio;

  const exportExcelPro = () => {
    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>Consolidado Rechazos ASQUE</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; width: 100%; }
          th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #0f172a; padding: 8px 10px; text-align: center; vertical-align: middle; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: middle; color: #334155; }
          .text { text-align: left; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Fecha</th>
              <th>Productor</th>
              <th>T. Rechazo</th>
              <th>Folio</th>
              <th>Embalaje</th>
              <th>F. Embalaje</th>
              <th>Proceso</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRechazos.map((item: any) => `
              <tr>
                <td class="center bold">${item.numero || ''}</td>
                <td class="center">${item.fecha || ''}</td>
                <td class="text bold">${item.productor || ''}</td>
                <td class="center" style="background-color: #ffedd5; color: #9a3412; font-weight: bold;">${item.tipoRechazo || ''}</td>
                <td class="center">${item.folio || ''}</td>
                <td class="center">${item.embalaje || ''}</td>
                <td class="center">${item.fechaEmbalaje || ''}</td>
                <td class="center" style="background-color: #eff6ff;">${item.procesoFho || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consolidado_Rechazos_ASQUE_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const thCompactCls = 'px-2 py-2.5 font-bold text-gray-900 whitespace-nowrap text-[11px] bg-gray-200 border-r border-gray-300 text-center';
  const thCompactLeft = 'px-2.5 py-2.5 font-bold text-gray-900 whitespace-nowrap text-[11px] bg-gray-200 border-r border-gray-300 text-left';
  const tdCls = 'px-2 py-2 text-gray-700 whitespace-nowrap text-[11px] border-r border-slate-100';

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">Cargando consolidado desde Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full px-2 sm:px-0">
      {/* Título Principal */}
      <div className="flex flex-col items-center justify-center text-center space-y-1.5 py-4 border-b border-gray-200/85 mb-2">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
          <BarChart2 className="h-3.5 w-3.5" /> Monitoreo y Cuadratura en Línea
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
          Monitoreo de Rechazos y Reembalajes ASQUE
        </h2>
        <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-xl px-4">
          Panel oficial público de control y seguimiento en línea de rechazos, motivos, folios y operaciones de reembalaje.
        </p>
      </div>

      {/* Cuadros Resumen Grandes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-[#e67e22] px-5 sm:px-7 py-8 shadow-lg text-white transition-all duration-300 space-y-6">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-orange-100" /> Resumen Operativo de Rechazos
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 divide-x-2 divide-white/40 text-center">
            <div className="px-1 flex flex-col justify-between">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-100">Total Registros</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {totalRegistros} <span className="text-xs sm:text-sm font-bold text-orange-100">Reg.</span>
              </p>
            </div>
            <div className="pl-2 flex flex-col justify-between">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-100">Total Reembalajes</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {totalReembalajes} <span className="text-xs sm:text-sm font-bold text-orange-100">Oper.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-[#27ae60] px-5 sm:px-7 py-8 shadow-lg text-white transition-all duration-300 space-y-6">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-100" /> Cuadratura de Rejillas (FHO vs Acopio)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 divide-x-2 divide-white/40 text-center">
            <div className="px-1 flex flex-col justify-between">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100">Rejillas FHO</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {totalRecillasFho.toLocaleString('es-CL')} <span className="text-xs sm:text-sm font-bold text-emerald-100">cjs</span>
              </p>
            </div>
            <div className="px-2 flex flex-col justify-between">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100">Rejillas Acopio</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {totalRecillasAcopio.toLocaleString('es-CL')} <span className="text-xs sm:text-sm font-bold text-emerald-100">cjs</span>
              </p>
            </div>
            <div className="pl-2 flex flex-col justify-between">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100">Total General</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {totalGeneralRecillas.toLocaleString('es-CL')} <span className="text-xs sm:text-sm font-bold text-emerald-100">cjs</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Exportación */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 bg-white shadow-sm"
            placeholder="Buscar por productor, lote, folio, proceso, observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={exportExcelPro}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm w-full sm:w-auto justify-center"
        >
          <Download className="h-4 w-4" /> Exportar Excel Profesional (.xls)
        </button>
      </div>

      {/* Tabla Pública con las 8 columnas solicitadas */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left bg-gray-100">
              <th className={`${thCompactCls} w-16`}>N°</th>
              <th className={thCompactCls}>Fecha</th>
              <th className={thCompactLeft}>Productor</th>
              <th className={thCompactCls}>T. Rechazo</th>
              <th className={thCompactCls}>Folio</th>
              <th className={thCompactCls}>Embalaje</th>
              <th className={thCompactCls}>F. Embalaje</th>
              <th className="px-2.5 py-2.5 font-bold text-sky-950 whitespace-nowrap text-[11px] bg-sky-100 border-r border-sky-200 text-center">Proceso</th>
            </tr>
          </thead>
          <tbody>
            {filteredRechazos.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  No hay registros disponibles para mostrar en el consolidado.
                </td>
              </tr>
            ) : (
              filteredRechazos.map((item: any, idx: number) => (
                <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50/50 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                  <td className={`${tdCls} font-bold text-center text-gray-900`}>{item.numero}</td>
                  <td className={`${tdCls} text-center`}>{item.fecha}</td>
                  <td className={`${tdCls} font-medium text-gray-800`}>{item.productor}</td>
                  <td className={`${tdCls} text-center`}>
                    {item.tipoRechazo ? (
                      <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-800 rounded font-medium">
                        {item.tipoRechazo}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className={`${tdCls} text-center font-semibold`}>{item.folio}</td>
                  <td className={`${tdCls} text-center`}>{item.embalaje}</td>
                  <td className={`${tdCls} text-center`}>{item.fechaEmbalaje}</td>
                  <td className="px-2 py-2 text-center text-sky-900 bg-sky-50/50 whitespace-nowrap text-[11px] border-r border-sky-100 font-semibold">
                    {item.procesoFho || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
