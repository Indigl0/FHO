export interface BoxFormat {
  id: string;
  label: string;
  factor: number;
}

export interface ProcessRecord {
  id: string;
  // Datos de recepción y producción
  mesProduccion: string;
  mesRecepcion: string;
  productor: string;
  semana: string;
  fechaProduccion: string;
  fechaRecepcion: string;
  nProceso: number | string | '';
  guiaRecepcion: string | number | '';
  guiaAsignada: string;
  variedad: string;
  // Control de kilos
  recepcionKg: number | '';
  rechazoQcKg: number | '';
  frutaProcesoKg: number | '';
  procesadoKg: number | '';
  // Cajas: formatoId -> cantidad (soporta indexación flexible para compatibilidad)
  cajas: Record<string, number | ''>;
  [key: string]: any; // Permite propiedades adicionales o dinámicas de Supabase sin romper TypeScript
}

export interface ComputedRecord {
  frutaProcesoKg: number;
  stockKg: number;
  embaladoKg: number;
  deshidrataKg: number;
  pctExportacion: number;
  pctDeshidra: number;
  pctIqf: number;
  pctMerma: number;
}

export type ViewKey = 'granel' | 'consolidado';
