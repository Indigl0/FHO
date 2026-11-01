import { ACTIVE_BOX_FORMATS } from '../constants';
import type { ProcessRecord } from '../types';
import { computeRecord, num } from './calculations';

function fmt(n: number, d = 3): string {
  return Number.isFinite(n) ? n.toFixed(d) : '0';
}

export function recordsToCSV(records: ProcessRecord[]): string {
  const boxCols = ACTIVE_BOX_FORMATS.map((b) => `Cajas ${b.label}`);
  const headers = [
    'Mes Produccion',
    'Mes Recepcion',
    'Productor',
    'Semana',
    'Fecha Produccion',
    'Fecha Recepcion',
    'N Proceso',
    'Guia Recepcion',
    'Guia Asignada',
    'Variedad',
    'Recepcion (Kg)',
    'Rechazo QC (Kg)',
    'Fruta a proceso (Kg)',
    'Procesado (Kg)',
    'Stock (Kg)',
    ...boxCols,
    'Embalado (Kg)',
    'Deshidrata (Kg)',
    'Fruta IQF (Kg)',
    'Merma (Kg)',
    '% Exportacion',
    '% Deshidra',
    '% IQF',
    '% Merma',
    'N Tarjas',
    'Observaciones',
    'Traspaso Cajas',
    'Ajustar Diferencia',
  ];

  const rows = records.map((r) => {
    const c = computeRecord(r);
    const boxVals = ACTIVE_BOX_FORMATS.map((b) => num(r.cajas[b.id]));
    return [
      r.mesProduccion,
      r.mesRecepcion,
      r.productor,
      r.semana,
      r.fechaProduccion,
      r.fechaRecepcion,
      r.nProceso,
      r.guiaRecepcion,
      r.guiaAsignada,
      r.variedad,
      num(r.recepcionKg),
      num(r.rechazoQcKg),
      c.frutaProcesoKg,
      num(r.procesadoKg),
      c.stockKg,
      ...boxVals,
      fmt(c.embaladoKg),
      fmt(c.deshidrataKg),
      fmt(num(r.frutaIqfKg)),
      fmt(num(r.mermaKg)),
      fmt(c.pctExportacion * 100, 2) + '%',
      fmt(c.pctDeshidra * 100, 2) + '%',
      fmt(c.pctIqf * 100, 2) + '%',
      fmt(c.pctMerma * 100, 2) + '%',
      r.nTarjas,
      r.observaciones,
      r.traspasoCajas,
      r.ajustarDiferencia,
    ];
  });

  const all = [headers, ...rows];
  return all
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(',')
    )
    .join('\n');
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
