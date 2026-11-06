import React, { useState, useEffect } from 'react';
import { Search, Download, BarChart4, Package, Layers } from 'lucide-react';
import { supabase } from '../utils/supabase';

export const ConsolidadoRechazosView: React.FC = () => {
  const [rechazos, setRechazos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRechazos();

    const channel = supabase
      .channel('public:rechazos_records_public')
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
        opInicial: r.op_inicial || '',
        embalaje: r.embalaje || '',
        fechaEmbalaje: r.fecha_embalaje || '',
        procesoFho: r.proceso_fho || '',
        nRecillasFho: r.n_recillas_fho !== null && r.n_recillas_fho !== undefined && r.n_recillas_fho !== 0 ? Number(r.n_recillas_fho) : '',
        nRecillasAcopio: r.n_recillas_acopio !== null && r.n_recillas_acopio !== undefined && r.n_recillas_acopio !== 0 ? Number(r.n_recillas_acopio) : '',
        opFinal: r.op_final || '',
        nContenedor: r.n_contenedor || '',
        estado: r.estado || 'EXPORTADO',
        observaciones: r.observaciones || '',
      }));

      setRechazos(formatted);
    } catch (err) {
      console.error('Error al cargar rechazos públicos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRechazos = rechazos.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalReembalajesCount = rechazos.filter(r => String(r.procesoFho).toUpperCase().includes('REEMBALAJE') || (Number(r.nRecillasFho) > 0 || Number(r.nRecillasAcopio) > 0)).length;
  const totalRecillasFhoSum = rechazos.reduce((acc, r) => acc + (Number(r.nRecillasFho) || 0), 0);
  const totalRecillasAcopioSum = rechazos.reduce((acc, r) => acc + (Number(r.nRecillasAcopio) || 0), 0);

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
          .num { text-align: right; mso-number-format:"#,##0"; }
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
              <th>Lote</th>
              <th>Productor</th>
              <th>T. Rechazo</th>
              <th>Folio</th>
              <th>OP Inc</th>
              <th>Embalaje</th>
              <th>F. Embalaje</th>
              <th>Proceso</th>
              <th>N° Recillas FHO</th>
              <th>N° Recillas Acopio</th>
              <th>Total Recillas</th>
              <th>OP Final</th>
              <th>Contenedor</th>
              <th>Estado</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRechazos.map((item: any) => {
              const totalRec = (Number(item.nRecillasFho) || 0) + (Number(item.nRecillasAcopio) || 0);
              return `
                <tr>
                  <td class="center bold">${item.numero}</td>
                  <td class="center">${item.fecha}</td>
                  <td class="center">${item.lote}</td>
                  <td class="text bold">${item.productor}</td>
                  <td class="center">${item.tipoRechazo}</td>
                  <td class="center">${item.folio}</td>
                  <td class="center">${item.opInicial}</td>
                  <td class="center">${item.embalaje}</td>
                  <td class="center">${item.fechaEmbalaje}</td>
                  <td class="center bold" style="background-color: #e0f2fe; color: #0369a1;">${item.procesoFho}</td>
                  <td class="num">${item.nRecillasFho !== '' ? item.nRecillasFho : '-'}</td>
                  <td class="num">${item.nRecillasAcopio !== '' ? item.nRecillasAcopio : '-'}</td>
                  <td class="num bold" style="background-color: #bae6fd; color: #0c4a6e;">${totalRec > 0 ? totalRec : '-'}</td>
                  <td class="center">${item.opFinal}</td>
                  <td class="center" style="mso-number-format:\@;">${item.nContenedor}</td>
                  <td class="center bold">${item.estado}</td>
                  <td class="text">${item.observaciones}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Consolidado_Rechazos_ASQUE_Completo.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">Cargando consolidado de rechazos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Título de la Vista */}
      <div className="flex flex-col items-center justify-center text-center space-y-1.5 py-4 border-b border-gray-200/85 mb-2">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
          <BarChart4 className="h-3.5 w-3.5" /> Monitoreo y Cuadratura en Línea
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
          Consolidado Rechazos ASQUE
        </h2>
        <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-xl px-4">
          Seguimiento público en tiempo real de los registros de rechazos, reembalajes y cuadratura de recillas.
        </p>
      </div>

      {/* Tarjetas Indicadoras (Cuadrados de Resúmenes) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Registros</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{filteredRechazos.length} Reg.</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Reembalajes</p>
            <p className="text-lg font-bold text-orange-600 mt-0.5">{totalReembalajesCount} Oper.</p>
          </div>
          <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Rejillas FHO</p>
            <p className="text-lg font-bold text-blue-700 mt-0.5">{totalRecillasFhoSum.toLocaleString('es-CL')} cjs</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Rejillas Acopio</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">{totalRecillasAcopioSum.toLocaleString('es-CL')} cjs</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <Package className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Botón de Exportar */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por productor, lote, folio, proceso, observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportExcelPro}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-emerald-700 w-full sm:w-auto justify-center"
          >
            <Download className="h-4 w-4" /> Exportar Reporte Completo (.xls)
          </button>
        </div>
      </div>

      {/* Tabla detallada completa en pantalla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <th className="py-3.5 px-2 text-center whitespace-nowrap w-12">N°</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Fecha</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Lote</th>
                <th className="py-3.5 px-4 text-left min-w-[200px]">Productor</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">T. Rechazo</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Folio</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">OP Inc</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Embalaje</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">F. Embalaje</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-x border-blue-200">Proceso</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-r border-blue-200">N° Recillas FHO</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-r border-blue-200">N° Recillas Acopio</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-200 text-blue-950 border-r border-blue-300 font-black">Total</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-r border-blue-200">OP Final</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-r border-blue-200">Contenedor</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-r border-blue-200">Estado</th>
                <th className="py-3.5 px-4 text-left min-w-[150px] bg-blue-100 text-blue-900">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRechazos.length > 0 ? (
                filteredRechazos.map((item: any) => {
                  const totalRec = (Number(item.nRecillasFho) || 0) + (Number(item.nRecillasAcopio) || 0);
                  const isPendiente = String(item.estado || '').toUpperCase() === 'PENDIENTE';
                  const isExportado = String(item.estado || '').toUpperCase() === 'EXPORTADO';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-2 text-center font-bold text-slate-900 whitespace-nowrap">{item.numero}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">{item.fecha}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">{item.lote}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{item.productor}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.tipoRechazo ? (
                          <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-800 rounded font-medium">
                            {item.tipoRechazo}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">{item.folio}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">{item.opInicial}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">{item.embalaje}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">{item.fechaEmbalaje}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-50 border-x border-blue-100 font-medium">{item.procesoFho}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-50 border-r border-blue-100 font-semibold">{item.nRecillasFho !== '' ? item.nRecillasFho : '-'}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-50 border-r border-blue-100 font-semibold">{item.nRecillasAcopio !== '' ? item.nRecillasAcopio : '-'}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-100/70 border-r border-blue-200 font-bold text-blue-900">
                        {totalRec > 0 ? totalRec : '-'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-50 border-r border-blue-100">{item.opFinal}</td>
                      <td className="py-3 px-3 text-center font-mono whitespace-nowrap bg-blue-50 border-r border-blue-100">{item.nContenedor}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-50 border-r border-blue-100">
                        {item.estado ? (
                          <span className={`inline-block px-2 py-1 rounded font-medium ${
                            isPendiente 
                              ? 'bg-rose-100 text-rose-800' 
                              : isExportado 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {item.estado}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 bg-blue-50">{item.observaciones}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={17} className="text-center py-12 text-slate-400">
                    No hay registros disponibles en el consolidado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
