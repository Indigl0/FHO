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

// NUEVO: Interfaz para el módulo de Rechazos ASQUE
export interface RechazoRecord {
  id: string;
  fecha: string;
  numero: number;
  lote: number | string;
  productor: string;
  tipoRechazo: string;
  folio: string | number;
  opInicial: string | number;
  embalaje: string;
  fechaEmbalaje: string;
  procesoFho: string;
  nRecillasFho?: number;
  nRecillasAcopio?: number;
  opFinal: string | number;
  nContenedor: string;
  estado: string;
  observaciones: string;
}

// ACTUALIZADO: Se añade 'rechazos' a las vistas permitidas
export type ViewKey = 'granel' | 'consolidado' | 'planos' | 'rechazos';
