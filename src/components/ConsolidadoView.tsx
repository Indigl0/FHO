import { useState } from 'react';
import { Download, Search, BarChart2, MessageSquare, Package } from 'lucide-react';
import type { ProcessRecord } from '../types';
import { computeRecord, num, getBoxCountByWeight } from '../utils/calculations';

interface Props {
  records: ProcessRecord[];
}

function fmtKg(n: number): string {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtBoxes(n: number): string {
  return n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return dateStr;
}

const thCompactCls = 'px-2 py-2.5 font-bold text-gray-900 whitespace-nowrap text-[11px] bg-gray-200 border-r border-gray-300 text-center';
const thCompactLeft = 'px-2.5 py-2.5 font-bold text-gray-900 whitespace-nowrap text-[11px] bg-gray-200 border-r border-gray-300 text-left';
const tdCls = 'px-2 py-2 text-gray-700 whitespace-nowrap text-[11px] border-r border-slate-100';
const tdNum = 'px-2 py-2 text-right text-gray-700 whitespace-nowrap tabular-nums text-[11px] border-r border-slate-100';

export default function ConsolidadoView({ records }: Props) {
  const [search, setSearch] = useState('');

  const filtered = records.filter((r) => {
    const s = search.toLowerCase();
    return (
      r.mesProduccion.toLowerCase().includes(s) ||
      r.mesRecepcion.toLowerCase().includes(s) ||
      r.productor.toLowerCase().includes(s) ||
      r.variedad.toLowerCase().includes(s) ||
      r.semana.toLowerCase().includes(s) ||
      String(r.nProceso).includes(s) ||
      String(r.guiaRecepcion || '').toLowerCase().includes(s) ||
      String(r.observaciones || '').toLowerCase().includes(s)
    );
  });

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
            <x:Name>Consolidado Procesos</x:Name>
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
          .num { text-align: right; mso-number-format:"#,##0.0"; }
          .boxes { text-align: right; mso-number-format:"#,##0"; }
          .text { text-align: left; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Productor</th>
              <th>Mes P.</th>
              <th>Semana</th>
              <th>F. Recep.</th>
              <th>F. Prod.</th>
              <th>N° Proc.</th>
              <th style="background-color: #0284c7; color: white;">N° Guía</th>
              <th>Recep. kg</th>
              <th>Variedad</th>
              <th>Procesado</th>
              <th style="background-color: #059669; color: white;">Embalado kg</th>
              <th style="background-color: #0284c7; color: white;">Bulk 3,0 kg (cajas)</th>
              <th style="background-color: #0284c7; color: white;">Bulk 3,6 kg (cajas)</th>
              <th>Merma kg</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((r: any) => {
              const c = computeRecord(r);
              const procKg = num(r.procesadoKg);
              const cajas3 = getBoxCountByWeight(r, 3.0);
              const cajas36 = getBoxCountByWeight(r, 3.6);
              return `
                <tr>
                  <td class="text bold">${r.productor || ''}</td>
                  <td class="text">${r.mesProduccion || ''}</td>
                  <td class="center bold">${r.semana || ''}</td>
                  <td class="center">${formatDate(r.fechaRecepcion)}</td>
                  <td class="center">${formatDate(r.fechaProduccion)}</td>
                  <td class="center">${r.nProceso || ''}</td>
                  <td class="center bold" style="background-color: #e0f2fe; color: #0369a1;">${r.guiaRecepcion || '—'}</td>
                  <td class="num">${num(r.recepcionKg)}</td>
                  <td class="text bold">${r.variedad || ''}</td>
                  <td class="num">${procKg}</td>
                  <td class="num bold" style="background-color: #ecfdf5; color: #065f46;">${c.embaladoKg}</td>
                  <td class="boxes" style="background-color: #f0f9ff; color: #0369a1; font-weight: bold;">${cajas3}</td>
                  <td class="boxes" style="background-color: #f0f9ff; color: #0369a1; font-weight: bold;">${cajas36}</td>
                  <td class="num" style="background-color: #fff1f2; color: #9f1239;">${num(r.mermaKg)}</td>
                  <td class="text">${r.observaciones || ''}</td>
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
    a.download = 'Consolidado_Arandanos_Pro.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cálculos de Totales Generales
  const totalRecepcion = filtered.reduce((s, r) => s + num(r.recepcionKg), 0);
  const totalProcesado = filtered.reduce((s, r) => s + num(r.procesadoKg), 0);
  const totalEmbalado = filtered.reduce((s, r) => s + computeRecord(r).embaladoKg, 0);
  const globalPctExportacion = totalProcesado > 0 ? (totalEmbalado / totalProcesado) * 100 : 0;

  const totalCajas3 = filtered.reduce((s, r) => s + getBoxCountByWeight(r, 3.0), 0);
  const totalCajas36 = filtered.reduce((s, r) => s + getBoxCountByWeight(r, 3.6), 0);

  // Agrupación automática por Mes de Producción (Recepción y Procesado)
  const monthlyStats = filtered.reduce((acc: Record<string, { recep: number; proc: number }>, r) => {
    const mes = r.mesProduccion ? r.mesProduccion.toUpperCase() : 'SIN MES';
    if (!acc[mes]) {
      acc[mes] = { recep: 0, proc: 0 };
    }
    acc[mes].recep += num(r.recepcionKg);
    acc[mes].proc += num(r.procesadoKg);
    return acc;
  }, {});

  // Agrupación automática por Mes de Producción (Embalado y Cajas)
  const monthlyProductionStats = filtered.reduce((acc: Record<string, { embalado: number; cajas3: number; cajas36: number }>, r) => {
    const mes = r.mesProduccion ? r.mesProduccion.toUpperCase() : 'SIN MES';
    if (!acc[mes]) {
      acc[mes] = { embalado: 0, cajas3: 0, cajas36: 0 };
    }
    acc[mes].embalado += computeRecord(r).embaladoKg;
    acc[mes].cajas3 += getBoxCountByWeight(r, 3.0);
    acc[mes].cajas36 += getBoxCountByWeight(r, 3.6);
    return acc;
  }, {});

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Título Principal: Monitoreo de Fruta a Granel FHO */}
      <div className="flex flex-col items-center justify-center text-center space-y-1.5 py-4 border-b border-gray-200/85 mb-2">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
          <BarChart2 className="h-3.5 w-3.5" /> Monitoreo y Cuadratura en Línea
        </div>
        <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
          Monitoreo de Fruta a Granel FHO
        </h2>
        <p className="text-xs lg:text-sm font-medium text-slate-500 max-w-xl">
          Panel oficial de control y seguimiento en línea de recepciones, rendimientos de embalado y exportación de arándanos.
        </p>
      </div>

      {/* Dos Recuadros Grandes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Recuadro 1: Recepción, Procesado, % Exportación + Desglose Mensual */}
        <div className="relative overflow-hidden rounded-3xl bg-[#e67e22] px-7 py-9 shadow-lg text-white transition-all duration-300 hover:shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-orange-100" /> Resumen Operativo de Procesos
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 divide-x-2 divide-white/40 text-center">
            <div className="px-2">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-100">Recepción Total</p>
              <p className="mt-2.5 text-3xl font-black tracking-tight text-white">
                {fmtKg(totalRecepcion)} <span className="text-sm font-bold text-orange-100">Kg</span>
              </p>
            </div>
            <div className="px-3">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-100">Procesado Total</p>
              <p className="mt-2.5 text-3xl font-black tracking-tight text-white">
                {fmtKg(totalProcesado)} <span className="text-sm font-bold text-orange-100">Kg</span>
              </p>
            </div>
            <div className="pl-3">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-100">% Exportación</p>
              <p className="mt-2.5 text-3xl font-black tracking-tight text-white">
                {globalPctExportacion.toFixed(1)}<span className="text-2xl font-bold text-orange-100">%</span>
              </p>
            </div>
          </div>

          {/* Desglose Automático por Mes (Naranja) */}
          {Object.keys(monthlyStats).length > 0 && (
            <div className="border-t border-white/40 pt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-100 mb-3 text-center">
                📊 Totales por Mes de Producción
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(monthlyStats).map(([mes, stats]) => (
                  <div key={mes} className="bg-black/15 rounded-2xl p-3 text-center border border-white/25 shadow-sm">
                    <p className="text-xs font-black uppercase text-white tracking-wide mb-1.5 underline decoration-orange-300 underline-offset-4">{mes}</p>
                    <div className="flex justify-around text-xs text-orange-100 divide-x divide-white/30">
                      <div className="px-1 text-center">
                        <span className="block text-[10px] uppercase opacity-80 font-semibold">Recep.</span>
                        <span className="font-bold text-white text-sm">{fmtKg(stats.recep)} kg</span>
                      </div>
                      <div className="px-1 pl-2 text-center">
                        <span className="block text-[10px] uppercase opacity-80 font-semibold">Proc.</span>
                        <span className="font-bold text-white text-sm">{fmtKg(stats.proc)} kg</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recuadro 2: Embalado Total, Bulk 3,0 kg, Bulk 3,6 kg + Desglose Mensual de Cajas */}
        <div className="relative overflow-hidden rounded-3xl bg-[#27ae60] px-7 py-9 shadow-lg text-white transition-all duration-300 hover:shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-100" /> Producción Terminada y Cajas
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 divide-x-2 divide-white/40 text-center">
            <div className="px-2">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Embalado Total</p>
              <p className="mt-2.5 text-3xl font-black tracking-tight text-white">
                {fmtKg(totalEmbalado)} <span className="text-sm font-bold text-emerald-100">Kg</span>
              </p>
            </div>
            <div className="px-3">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Bulk 3,0 kg</p>
              <p className="mt-2.5 text-3xl font-black tracking-tight text-white">
                {fmtBoxes(totalCajas3)} <span className="text-sm font-bold text-emerald-100">cajas</span>
              </p>
            </div>
            <div className="pl-3">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Bulk 3,6 kg</p>
              <p className="mt-2.5 text-3xl font-black tracking-tight text-white">
                {fmtBoxes(totalCajas36)} <span className="text-sm font-bold text-emerald-100">cajas</span>
              </p>
            </div>
          </div>

          {/* Desglose Automático por Mes (Verde - Cajas y Embalado) */}
          {Object.keys(monthlyProductionStats).length > 0 && (
            <div className="border-t border-white/40 pt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100 mb-3 text-center">
                📦 Producción y Cajas por Mes
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(monthlyProductionStats).map(([mes, stats]) => (
                  <div key={mes} className="bg-black/15 rounded-2xl p-3 text-center border border-white/25 shadow-sm">
                    <p className="text-xs font-black uppercase text-white tracking-wide mb-1.5 underline decoration-emerald-300 underline-offset-4">{mes}</p>
                    <div className="grid grid-cols-3 text-[11px] text-emerald-100 divide-x divide-white/30">
                      <div className="px-0.5 text-center">
                        <span className="block text-[9px] uppercase opacity-80 font-semibold">Embalado</span>
                        <span className="font-bold text-white text-xs">{fmtKg(stats.embalado)} kg</span>
                      </div>
                      <div className="px-0.5 text-center">
                        <span className="block text-[9px] uppercase opacity-80 font-semibold">3.0 kg</span>
                        <span className="font-bold text-white text-xs">{fmtBoxes(stats.cajas3)} cjs</span>
                      </div>
                      <div className="px-0.5 text-center">
                        <span className="block text-[9px] uppercase opacity-80 font-semibold">3.6 kg</span>
                        <span className="font-bold text-white text-xs">{fmtBoxes(stats.cajas36)} cjs</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 bg-white shadow-sm"
            placeholder="Buscar por productor, guía, variedad, proceso, observaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={exportExcelPro}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
        >
          <Download className="h-4 w-4" /> Exportar Excel Profesional (.xls)
        </button>
      </div>

      {/* Tabla detallada optimizada */}
      <div className="w-full overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className={thCompactLeft}>Productor</th>
              <th className={thCompactCls}>Mes P.</th>
              <th className={thCompactCls}>Semana</th>
              <th className={thCompactCls}>F. Recep.</th>
              <th className={thCompactCls}>F. Prod.</th>
              <th className={thCompactCls}>N° Proc.</th>
              
              <th className="px-2 py-2.5 font-extrabold text-sky-950 whitespace-nowrap text-[11px] bg-sky-200 border-r border-sky-300 text-center shadow-inner">
                N° Guía
              </th>

              <th className={`${thCompactCls} text-right`}>Recep. kg</th>
              <th className={thCompactLeft}>Variedad</th>
              <th className={`${thCompactCls} text-right`}>Procesado</th>

              <th className="px-2 py-2.5 font-semibold text-emerald-900 whitespace-nowrap text-[11px] bg-emerald-50 border-r border-emerald-200 text-right">Embalado kg</th>
              
              <th className="px-2 py-2.5 font-semibold text-sky-900 whitespace-nowrap text-[11px] bg-sky-50 border-r border-sky-200 text-right">Bulk 3,0 kg</th>
              <th className="px-2 py-2.5 font-semibold text-sky-900 whitespace-nowrap text-[11px] bg-sky-50 border-r border-sky-200 text-right">Bulk 3,6 kg</th>

              <th className="px-2 py-2.5 font-semibold text-rose-900 whitespace-nowrap text-[11px] bg-rose-50 border-r border-rose-200 text-right">Merma kg</th>
              <th className="px-2.5 py-2.5 font-semibold text-slate-900 whitespace-nowrap text-[11px] bg-slate-100 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-12 text-center text-gray-400">
                  No hay registros disponibles para mostrar en el consolidado.
                </td>
              </tr>
            ) : (
              filtered.map((r: any, idx: number) => {
                const c = computeRecord(r);
                const procKg = num(r.procesadoKg);
                const cajas3 = getBoxCountByWeight(r, 3.0);
                const cajas36 = getBoxCountByWeight(r, 3.6);

                return (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50/50 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                    <td className={`${tdCls} font-medium text-gray-800`}>{r.productor}</td>
                    <td className={tdCls}>{r.mesProduccion}</td>
                    <td className={`${tdCls} font-semibold text-center`}>{r.semana}</td>
                    <td className={tdCls}>{formatDate(r.fechaRecepcion)}</td>
                    <td className={tdCls}>{formatDate(r.fechaProduccion)}</td>
                    <td className={tdCls}>{r.nProceso}</td>
                    
                    <td className="px-2.5 py-2 font-bold text-sky-950 bg-sky-100/90 whitespace-nowrap text-[11px] border-r border-sky-200 text-center">
                      {r.guiaRecepcion || '—'}
                    </td>
                    
                    <td className={tdNum}>{fmtKg(num(r.recepcionKg))}</td>
                    <td className={`${tdCls} font-bold text-gray-800`}>{r.variedad}</td>
                    <td className={tdNum}>{fmtKg(procKg)}</td>
                    
                    <td className={`${tdNum} font-medium text-emerald-800 bg-emerald-50/25`}>{fmtKg(c.embaladoKg)}</td>
                    
                    <td className={`${tdNum} font-bold text-sky-800 bg-sky-50/25`}>
                      {fmtBoxes(cajas3)}
                    </td>

                    <td className={`${tdNum} font-bold text-sky-800 bg-sky-50/25`}>
                      {fmtBoxes(cajas36)}
                    </td>

                    <td className={`${tdNum} font-medium text-rose-800 bg-rose-50/25`}>{fmtKg(num(r.mermaKg))}</td>
                    
                    <td className={`${tdCls} text-slate-600 max-w-[180px] truncate relative group cursor-pointer`}>
                      {r.observaciones ? (
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-3 w-3 text-amber-600 shrink-0" />
                          <span className="truncate">{r.observaciones}</span>
                          
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 w-72 p-3.5 bg-slate-900 text-white text-left text-xs rounded-xl shadow-2xl border border-slate-700 leading-normal">
                            <p className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                              <MessageSquare className="h-3.5 w-3.5" /> Detalle de Observación:
                            </p>
                            <p className="text-slate-200 whitespace-normal break-words">{r.observaciones}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
