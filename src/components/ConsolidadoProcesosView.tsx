import React, { useState } from 'react';
import { Download, Search, BarChart2, MessageSquare, Package } from 'lucide-react';
import type { ProcessRecord } from '../types';
import { computeRecord, num, getBoxCountByWeight } from '../utils/calculations';

interface Props {
  records: ProcessRecord[];
}

function round1(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 10) / 10;
}

function toExcelDec(n: number): string {
  return round1(n).toFixed(1).replace('.', ',');
}

function fmtKg(n: number): string {
  return round1(n).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtBoxes(n: number): string {
  return n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
}

function fmtPallets(n: number): string {
  const esEntero = Math.abs(n - Math.round(n)) < 1e-9;
  const valorFormateado = n.toLocaleString('es-CL', {
    minimumFractionDigits: esEntero ? 0 : 1,
    maximumFractionDigits: esEntero ? 0 : 1,
  });
  return `${valorFormateado} ${Math.round(n) === 1 && esEntero ? 'pallet' : 'pallets'}`;
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

function getDeshidratadoKg(record: any, computed: ReturnType<typeof computeRecord>): number {
  if (computed && typeof computed.deshidrataKg === 'number' && !Number.isNaN(computed.deshidrataKg)) {
    return computed.deshidrataKg;
  }
  return num(record?.deshidratadoKg ?? record?.deshidrataKg);
}

const thCompactCls = 'px-2 py-2.5 font-bold text-gray-900 whitespace-nowrap text-[11px] bg-gray-200 border-r border-gray-300 text-center';
const thCompactLeft = 'px-2.5 py-2.5 font-bold text-gray-900 whitespace-nowrap text-[11px] bg-gray-200 border-r border-gray-300 text-left';
const tdCls = 'px-2 py-2 text-gray-700 whitespace-nowrap text-[11px] border-r border-slate-100';
const tdNum = 'px-2 py-2 text-right text-gray-700 whitespace-nowrap tabular-nums text-[11px] border-r border-slate-100';

export const ConsolidadoProcesosView: React.FC<Props> = ({ records }) => {
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
          table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
          .sheet-title { background-color: #eff6ff; color: #0f172a; font-size: 14pt; font-weight: bold; text-align: center; padding: 12px 14px; border: 1px solid #93c5fd; height: 34px; vertical-align: middle; }
          th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #0f172a; padding: 10px 14px; text-align: center; vertical-align: middle; height: 28px; }
          td { border: 1px solid #cbd5e1; padding: 8px 14px; vertical-align: middle; color: #1e293b; height: 24px; }
          .num { text-align: right; mso-number-format:"0,0"; }
          .boxes { text-align: right; mso-number-format:"0"; }
          .pct { text-align: right; mso-number-format:"0,0"; }
          .text { text-align: left; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <colgroup>
            <col width="110" />
            <col width="130" />
            <col width="145" />
            <col width="120" />
            <col width="120" />
            <col width="95" />
            <col width="105" />
            <col width="125" />
            <col width="135" />
            <col width="125" />
            <col width="135" />
            <col width="120" />
            <col width="155" />
            <col width="165" />
            <col width="175" />
            <col width="145" />
            <col width="340" />
          </colgroup>
          <thead>
            <tr>
              <th class="sheet-title" colspan="17">CONSOLIDADO DE PROCESOS — MONITOREO DE FRUTA A GRANEL FHO</th>
            </tr>
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
              <th style="background-color: #e11d48; color: white;">Merma kg</th>
              <th style="background-color: #ea580c; color: white;">Deshidratado kg</th>
              <th style="background-color: #0284c7; color: white;">Bulk 3,0 kg (cajas)</th>
              <th style="background-color: #0284c7; color: white;">Rejillas 3,6 kg (cajas)</th>
              <th style="background-color: #d97706; color: white;">% Exportación</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((r: any) => {
              const c = computeRecord(r);
              const recepKg = round1(num(r.recepcionKg));
              const procKg = round1(num(r.procesadoKg));
              const embKg = round1(c.embaladoKg);
              const mermaKg = round1(num(r.mermaKg));
              const deshidratadoKg = round1(getDeshidratadoKg(r, c));
              const cajas3 = Math.round(getBoxCountByWeight(r, 3.0));
              const cajas36 = Math.round(getBoxCountByWeight(r, 3.6));
              const pctExp = procKg > 0 ? round1((embKg / procKg) * 100) : 0;
              return `
                <tr>
                  <td class="text bold">${r.productor || ''}</td>
                  <td class="text">${r.mesProduccion || ''}</td>
                  <td class="center bold">${r.semana || ''}</td>
                  <td class="center">${formatDate(r.fechaRecepcion)}</td>
                  <td class="center">${formatDate(r.fechaProduccion)}</td>
                  <td class="center">${r.nProceso || ''}</td>
                  <td class="center bold" style="background-color: #bae6fd; color: #0c4a6e;">${r.guiaRecepcion || '—'}</td>
                  <td class="num">${toExcelDec(recepKg)}</td>
                  <td class="text bold">${r.variedad || ''}</td>
                  <td class="num">${toExcelDec(procKg)}</td>
                  <td class="num bold" style="background-color: #a7f3d0; color: #064e3b;">${toExcelDec(embKg)}</td>
                  <td class="num bold" style="background-color: #fecdd3; color: #881337;">${toExcelDec(mermaKg)}</td>
                  <td class="num bold" style="background-color: #fed7aa; color: #7c2d12;">${toExcelDec(deshidratadoKg)}</td>
                  <td class="boxes" style="background-color: #f0f9ff; color: #0369a1; font-weight: bold;">${cajas3}</td>
                  <td class="boxes" style="background-color: #f0f9ff; color: #0369a1; font-weight: bold;">${cajas36}</td>
                  <td class="pct bold" style="background-color: #fde68a; color: #78350f;">${toExcelDec(pctExp)}</td>
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

  const palletsBulk3 = totalCajas3 / 324;
  const palletsBulk36 = totalCajas36 / 272;

  const monthlyStats = filtered.reduce((acc: Record<string, { recep: number; proc: number }>, r) => {
    const mes = r.mesProduccion ? r.mesProduccion.toUpperCase() : 'SIN MES';
    if (!acc[mes]) {
      acc[mes] = { recep: 0, proc: 0 };
    }
    acc[mes].recep += num(r.recepcionKg);
    acc[mes].proc += num(r.procesadoKg);
    return acc;
  }, {});

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
    <div className="space-y-6 w-full max-w-full px-2 sm:px-0">
      {/* Título Principal */}
      <div className="flex flex-col items-center justify-center text-center space-y-1.5 py-4 border-b border-gray-200/85 mb-2">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
          <BarChart2 className="h-3.5 w-3.5" /> Monitoreo y Cuadratura en Línea
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
          Monitoreo de Fruta a Granel FHO
        </h2>
        <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-xl px-4">
          Panel oficial de control y seguimiento en línea de recepciones, rendimientos de embalado y exportación de arándanos.
        </p>
      </div>

      {/* Dos Recuadros Grandes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recuadro 1: Naranja */}
        <div className="relative overflow-hidden rounded-3xl bg-[#e67e22] px-5 sm:px-7 py-8 shadow-lg text-white transition-all duration-300 space-y-6">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-orange-100" /> Resumen Operativo de Procesos
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 divide-x-2 divide-white/40 text-center items-start">
            <div className="px-1 flex flex-col items-center">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-100">Recepción Total</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {fmtKg(totalRecepcion)} <span className="text-xs sm:text-sm font-bold text-orange-100">Kg</span>
              </p>
            </div>
            <div className="px-2 flex flex-col items-center">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-100">Procesado Total</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {fmtKg(totalProcesado)} <span className="text-xs sm:text-sm font-bold text-orange-100">Kg</span>
              </p>
            </div>
            <div className="pl-2 flex flex-col items-center">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-100">% Exportación</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {globalPctExportacion.toFixed(1)}<span className="text-lg sm:text-2xl font-bold text-orange-100">%</span>
              </p>
            </div>
          </div>

          {Object.keys(monthlyStats).length > 0 && (
            <div className="border-t border-white/40 pt-4 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-100 text-center mb-3">
                📊 Totales por Mes de Producción
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {Object.entries(monthlyStats).map(([mes, stats]) => (
                  <div key={mes} className="bg-black/15 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 border border-white/20 text-xs text-orange-100 shadow-sm">
                    <span className="font-extrabold uppercase text-white tracking-wide text-sm">{mes}</span>
                    <div className="flex gap-4 text-xs">
                      <span>Recep: <strong className="text-white text-xs sm:text-sm ml-1">{fmtKg(stats.recep)} kg</strong></span>
                      <span>Proc: <strong className="text-white text-xs sm:text-sm ml-1">{fmtKg(stats.proc)} kg</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recuadro 2: Verde */}
        <div className="relative overflow-hidden rounded-3xl bg-[#27ae60] px-5 sm:px-7 py-8 shadow-lg text-white transition-all duration-300 space-y-6">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-100" /> Producción Terminada y Cajas
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 divide-x-2 divide-white/40 text-center items-start">
            <div className="px-1 flex flex-col items-center">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100">Embalado Total</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {fmtKg(totalEmbalado)} <span className="text-xs sm:text-sm font-bold text-emerald-100">Kg</span>
              </p>
            </div>
            <div className="px-2 flex flex-col items-center">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100">Bulk 3,0 kg</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {fmtBoxes(totalCajas3)} <span className="text-xs sm:text-sm font-bold text-emerald-100">cajas</span>
              </p>
              <span className="mt-1 text-[11px] sm:text-xs font-semibold text-emerald-50/90">
                {fmtPallets(palletsBulk3)}
              </span>
            </div>
            <div className="pl-2 flex flex-col items-center">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100">Rejillas 3,6 kg</p>
              <p className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
                {fmtBoxes(totalCajas36)} <span className="text-xs sm:text-sm font-bold text-emerald-100">cajas</span>
              </p>
              <span className="mt-1 text-[11px] sm:text-xs font-semibold text-emerald-50/90">
                {fmtPallets(palletsBulk36)}
              </span>
            </div>
          </div>

          {Object.keys(monthlyProductionStats).length > 0 && (
            <div className="border-t border-white/40 pt-4 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100 text-center mb-3">
                📦 Producción y Cajas por Mes
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {Object.entries(monthlyProductionStats).map(([mes, stats]) => (
                  <div key={mes} className="bg-black/15 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 border border-white/20 text-xs text-emerald-100 shadow-sm">
                    <span className="font-extrabold uppercase text-white tracking-wide text-sm">{mes}</span>
                    <div className="flex flex-wrap justify-center gap-3 text-xs">
                      <span>Emb: <strong className="text-white text-xs sm:text-sm ml-1">{fmtKg(stats.embalado)} kg</strong></span>
                      <span>3.0kg: <strong className="text-white text-xs sm:text-sm ml-1">{fmtBoxes(stats.cajas3)} cjs</strong></span>
                      <span>3.6kg: <strong className="text-white text-xs sm:text-sm ml-1">{fmtBoxes(stats.cajas36)} cjs</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm w-full sm:w-auto justify-center"
        >
          <Download className="h-4 w-4" /> Exportar Excel Profesional (.xls)
        </button>
      </div>

      {/* Tabla detallada optimizada */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-xs min-w-[900px]">
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

              <th className={`${thCompactCls} text-center`}>Recep. kg</th>
              <th className={thCompactLeft}>Variedad</th>
              <th className={`${thCompactCls} text-center`}>Procesado</th>

              <th className="px-2 py-2.5 font-extrabold text-emerald-950 whitespace-nowrap text-[11px] bg-emerald-200 border-r border-emerald-300 text-center">Embalado kg</th>
              <th className="px-2 py-2.5 font-extrabold text-rose-950 whitespace-nowrap text-[11px] bg-rose-200 border-r border-rose-300 text-center">Merma kg</th>
              <th className="px-2 py-2.5 font-extrabold text-orange-950 whitespace-nowrap text-[11px] bg-orange-200 border-r border-orange-300 text-center">Deshidratado kg</th>

              <th className="px-2 py-2.5 font-semibold text-sky-900 whitespace-nowrap text-[11px] bg-sky-50 border-r border-sky-200 text-center">Bulk 3,0 kg</th>
              <th className="px-2 py-2.5 font-semibold text-sky-900 whitespace-nowrap text-[11px] bg-sky-50 border-r border-sky-200 text-center">Rejillas 3,6 kg</th>

              <th className="px-2 py-2.5 font-extrabold text-amber-950 whitespace-nowrap text-[11px] bg-amber-200 border-r border-amber-300 text-center">% Exportación</th>
              <th className="px-2.5 py-2.5 font-semibold text-slate-900 whitespace-nowrap text-[11px] bg-slate-100 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={17} className="py-12 text-center text-gray-400">
                  No hay registros disponibles para mostrar en el consolidado.
                </td>
              </tr>
            ) : (
              filtered.map((r: any, idx: number) => {
                const c = computeRecord(r);
                const procKg = num(r.procesadoKg);
                const deshidratadoKg = getDeshidratadoKg(r, c);
                const cajas3 = getBoxCountByWeight(r, 3.0);
                const cajas36 = getBoxCountByWeight(r, 3.6);
                const pctExp = procKg > 0 ? (c.embaladoKg / procKg) * 100 : 0;

                return (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50/50 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                    <td className={`${tdCls} font-medium text-gray-800`}>{r.productor}</td>
                    <td className={tdCls}>{r.mesProduccion}</td>
                    <td className={`${tdCls} font-semibold text-center`}>{r.semana}</td>
                    <td className={tdCls}>{formatDate(r.fechaRecepcion)}</td>
                    <td className={tdCls}>{formatDate(r.fechaProduccion)}</td>
                    <td className={tdCls}>{r.nProceso}</td>

                    <td className="px-2.5 py-2 font-extrabold text-sky-950 bg-sky-100 whitespace-nowrap text-[11px] border-r border-sky-200 text-center">
                      {r.guiaRecepcion || '—'}
                    </td>

                    <td className={tdNum}>{fmtKg(num(r.recepcionKg))}</td>
                    <td className={`${tdCls} font-bold text-gray-800`}>{r.variedad}</td>
                    <td className={tdNum}>{fmtKg(procKg)}</td>

                    <td className={`${tdNum} font-bold text-emerald-950 bg-emerald-100/80 border-r border-emerald-200`}>{fmtKg(c.embaladoKg)}</td>
                    <td className={`${tdNum} font-bold text-rose-950 bg-rose-100/80 border-r border-rose-200`}>{fmtKg(num(r.mermaKg))}</td>
                    <td className={`${tdNum} font-bold text-orange-950 bg-orange-100/80 border-r border-orange-200`}>{fmtKg(deshidratadoKg)}</td>

                    <td className={`${tdNum} font-bold text-sky-800 bg-sky-50/25`}>
                      {fmtBoxes(cajas3)}
                    </td>

                    <td className={`${tdNum} font-bold text-sky-800 bg-sky-50/25`}>
                      {fmtBoxes(cajas36)}
                    </td>

                    <td className={`${tdNum} font-extrabold text-amber-950 bg-amber-100/80 border-r border-amber-200`}>{pctExp.toFixed(1)}%</td>

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
};
