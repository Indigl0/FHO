import { ACTIVE_BOX_FORMATS, DEFAULT_MERMA_PCT } from '../constants';
import type { ProcessRecord, ComputedRecord } from '../types';

export const num = (v: number | string | '' | undefined | null): number =>
  v === '' || v === undefined || v === null || isNaN(Number(v)) ? 0 : Number(v);

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
export const round1 = (n: number): number => Math.round(n * 10) / 10;

export function computeRecord(r: ProcessRecord): ComputedRecord {
  const recepcionKg = num(r.recepcionKg);
  const frutaProcesoKg = num(r.frutaProcesoKg);
  const procesadoKg = num(r.procesadoKg);
  const stockKg = round3(frutaProcesoKg - procesadoKg);

  let embaladoKg = 0;

  if (r.cajas && typeof r.cajas === 'object' && !Array.isArray(r.cajas)) {
    for (const fmt of ACTIVE_BOX_FORMATS) {
      const cant = num(r.cajas[fmt.id]);
      embaladoKg += cant * fmt.factor;
    }
  }
  embaladoKg = round3(embaladoKg);

  const mermaKg = num(r.mermaKg);
  const deshidrataKg = round3(recepcionKg - (embaladoKg + mermaKg));
  const frutaIqfKg = num(r.frutaIqfKg);

  const pctExportacion = procesadoKg > 0 ? embaladoKg / procesadoKg : 0;
  const pctDeshidra = procesadoKg > 0 ? deshidrataKg / procesadoKg : 0;
  const pctIqf = procesadoKg > 0 ? frutaIqfKg / procesadoKg : 0;
  const pctMerma = procesadoKg > 0 ? mermaKg / procesadoKg : 0;

  return {
    frutaProcesoKg,
    stockKg,
    embaladoKg,
    deshidrataKg,
    pctExportacion,
    pctDeshidra,
    pctIqf,
    pctMerma,
  };
}

export function getBoxCountByWeight(r: ProcessRecord | any, targetWeight: number): number {
  if (!r) return 0;

  let cajasObj = r.cajas;
  if (typeof cajasObj === 'string') {
    try {
      cajasObj = JSON.parse(cajasObj);
    } catch (e) {}
  }

  if (cajasObj && typeof cajasObj === 'object' && !Array.isArray(cajasObj)) {
    for (const [key, val] of Object.entries(cajasObj)) {
      const boxFormat = ACTIVE_BOX_FORMATS.find((b) => b.id === key);
      const weight = boxFormat ? boxFormat.factor : num(key);
      if (Math.abs(weight - targetWeight) < 0.1) {
        return num(val as any);
      }
    }
  }

  if (Array.isArray(cajasObj)) {
    for (const item of cajasObj) {
      if (!item) continue;
      const w = num(item.peso ?? item.weight ?? item.factor ?? 0);
      const c = num(item.cantidad ?? item.count ?? item.cajas ?? 0);
      if (Math.abs(w - targetWeight) < 0.1) return c;
    }
  }

  if (targetWeight === 3.0) {
    return num(r.cajasBulk3 ?? r.cajasBulk30 ?? r.cajas30 ?? r.bulk3 ?? 0);
  }
  if (targetWeight === 3.6) {
    return num(r.cajasBulk36 ?? r.cajas36 ?? r.bulk36 ?? 0);
  }

  return 0;
}

export function emptyRecord(): ProcessRecord {
  const cajas: Record<string, number | ''> = {};
  for (const fmt of ACTIVE_BOX_FORMATS) cajas[fmt.id] = '';
  return {
    id: crypto.randomUUID(),
    mesProduccion: '',
    mesRecepcion: '',
    productor: 'FHO',
    semana: '',
    fechaProduccion: '',
    fechaRecepcion: '',
    nProceso: '',
    guiaRecepcion: '',
    guiaAsignada: '',
    variedad: '',
    recepcionKg: '',
    rechazoQcKg: '',
    frutaProcesoKg: '',
    procesadoKg: '',
    cajas,
    deshidrataKg: '',
    frutaIqfKg: '',
    mermaKg: '',
    nTarjas: '',
    observaciones: '',
    traspasoCajas: '',
    ajustarDiferencia: '',
  };
}

export function suggestedMerma(procesadoKg: number | ''): number {
  return Math.round(num(procesadoKg) * DEFAULT_MERMA_PCT * 1000) / 1000;
}
