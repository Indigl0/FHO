import type { BoxFormat } from './types';

export const BOX_FORMATS: BoxFormat[] = [
  { id: '12x44oz', label: '12 x 4,4 OZ', factor: 1.496854 },
  { id: '12x44ozbcgc', label: '12 x 4,4 OZ BCGC', factor: 1.496854 },
  { id: '12x44oz16bcgc', label: '12 x 4,4OZ(16mm) BCGC', factor: 1.496854 },
  { id: '12x6oz', label: '12 x 6 OZ', factor: 2.041164 },
  { id: '28x200grs', label: '28x200grs.', factor: 5.6 },
  { id: '12x200grs', label: '12 x 200 Grs', factor: 2.4 },
  { id: '12x300grsbcgc', label: '12 x 300 grs BCGC', factor: 3.6 },
  { id: '12x300grs', label: '12 x 300 grs', factor: 3.6 },
  { id: '12x500grs', label: '12 x 500 Grs.', factor: 6.0 },
  { id: '12x11oz', label: '12 x11 OZ', factor: 3.742134 },
  { id: '8x14oz', label: '8 x 14 OZ', factor: 3.175144 },
  { id: '8x18oz', label: '8 x 18 OZ', factor: 4.082328 },
  { id: '12x18oz', label: '12 x 18 OZ', factor: 6.123492 },
  { id: '16x18oz', label: '16 x 18 OZ', factor: 8.164656 },
  { id: 'bulk25kg', label: 'Bulk 2,5 Kg', factor: 2.5 },
  { id: 'bulk36kg', label: 'Bulk 3.6 Kg', factor: 3.6 },
  { id: 'bulk30kg', label: 'Bulk 3,0 Kg', factor: 3.0 },
  { id: '42x150grs', label: '42 X 150 Grs.', factor: 6.3 },
];

export const MONTHS = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

// Meses usados en el consolidado, en orden de temporada
export const CONSOLIDADO_MONTHS = [
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
  'ENERO',
  'FEBRERO',
];

export const PRODUCTORES = ['FHO'];

// Variedades iniciales sugeridas; el usuario puede agregar nuevas libremente
export const INITIAL_VARIEDADES = ['SUZIBLUE', 'DUKE'];

// Únicamente estos formatos son visibles y activos en la interfaz
export const ACTIVE_BOX_FORMATS: BoxFormat[] = [
  BOX_FORMATS.find((b) => b.id === 'bulk30kg')!,
  BOX_FORMATS.find((b) => b.id === 'bulk36kg')!,
];

export const DEFAULT_MERMA_PCT = 0.015;
