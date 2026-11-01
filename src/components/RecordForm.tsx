import { useState, useEffect } from 'react';
import { X, Save, Calculator, Info } from 'lucide-react';
import { ACTIVE_BOX_FORMATS as BOX_FORMATS, MONTHS, PRODUCTORES, DEFAULT_MERMA_PCT } from '../constants';
import type { ProcessRecord } from '../types';
import { computeRecord, suggestedMerma, num } from '../utils/calculations';

interface Props {
  record: ProcessRecord | null;
  onSave: (r: ProcessRecord) => void;
  onClose: () => void;
  variedades: string[];
}

// Función para calcular el número de semana ISO a partir de una fecha
function getWeekNumber(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `SEMANA Nº ${weekNum}`;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      {children}
      {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const inputCalcCls =
  'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 outline-none';

function SectionCard({
  title,
  subtitle,
  color,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  color: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border-2 ${color} p-5`}>
      <div className="mb-4 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function RecordForm({ record, onSave, onClose, variedades }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const currentMonthName = MONTHS[new Date().getMonth()];

  const [data, setData] = useState<ProcessRecord>(
    record ?? {
      id: crypto.randomUUID(),
      mesProduccion: currentMonthName,
      mesRecepcion: currentMonthName,
      productor: 'FHO',
      semana: getWeekNumber(today),
      fechaProduccion: today,
      fechaRecepcion: today,
      nProceso: '',
      guiaRecepcion: '',
      guiaAsignada: '',
      variedad: '',
      recepcionKg: '',
      rechazoQcKg: '',
      frutaProcesoKg: '',
      procesadoKg: '',
      cajas: Object.fromEntries(BOX_FORMATS.map((b) => [b.id, ''])),
      deshidrataKg: '',
      frutaIqfKg: '',
      mermaKg: '',
      nTarjas: '',
      observaciones: '',
      traspasoCajas: '',
      ajustarDiferencia: '',
    }
  );

  // Automatizar cálculo de fruta a proceso y semana al cambiar fechas
  useEffect(() => {
    if (data.recepcionKg !== '' || data.rechazoQcKg !== '') {
      const val = num(data.recepcionKg) - num(data.rechazoQcKg);
      setData((d) => ({ ...d, frutaProcesoKg: Math.round(val * 1000) / 1000 }));
    }
  }, [data.recepcionKg, data.rechazoQcKg]);

  const handleDateChange = (field: 'fechaProduccion' | 'fechaRecepcion', val: string) => {
    setData((d) => {
      const updated = { ...d, [field]: val };
      // Si cambia la fecha de recepción, actualizamos automáticamente la semana
      if (field === 'fechaRecepcion' && val) {
        updated.semana = getWeekNumber(val);
      }
      return updated;
    });
  };

  const computed = computeRecord(data);

  const set = <K extends keyof ProcessRecord>(key: K, val: ProcessRecord[K]) =>
    setData((d) => ({ ...d, [key]: val }));

  const setCaja = (id: string, val: number | '') =>
    setData((d) => ({ ...d, cajas: { ...d.cajas, [id]: val } }));

  const applySuggestedMerma = () => {
    set('mermaKg', suggestedMerma(data.procesadoKg));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(data);
  };

  const round3 = (n: number) => Math.round(n * 1000) / 1000;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="my-8 w-full max-w-5xl rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-200 px-7 py-5">
          <h2 className="text-xl font-bold text-gray-900">
            {record ? 'Editar Registro' : 'Nuevo Registro'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[72vh] space-y-5 overflow-y-auto px-7 py-6">
          {/* Sección 1: Recepción y Producción */}
          <SectionCard
            title="Datos de Recepción y Producción"
            subtitle="Información general del proceso"
            color="border-blue-100 bg-blue-50/40"
          >
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              <Field label="Mes Producción">
                <select
                  className={inputCls}
                  value={data.mesProduccion}
                  onChange={(e) => set('mesProduccion', e.target.value)}
                >
                  <option value="">--</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Mes Recepción">
                <select
                  className={inputCls}
                  value={data.mesRecepcion}
                  onChange={(e) => set('mesRecepcion', e.target.value)}
                >
                  <option value="">--</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Field>
              
              {/* CAMPO PRODUCTOR CAMBIADO A TEXTO LIBRE CON DATALIST */}
              <Field label="Productor" hint="Escribe libremente o selecciona">
                <input
                  type="text"
                  className={inputCls}
                  list="productor-list"
                  placeholder="Ej: FHO, OTRO..."
                  value={data.productor}
                  onChange={(e) => set('productor', e.target.value)}
                />
                <datalist id="productor-list">
                  {PRODUCTORES.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </Field>

              <Field label="Semana">
                <input
                  className={inputCls}
                  placeholder="SEMANA Nº 47"
                  value={data.semana}
                  onChange={(e) => set('semana', e.target.value)}
                />
              </Field>
              <Field label="Fecha Producción">
                <input
                  type="date"
                  className={inputCls}
                  value={data.fechaProduccion}
                  onChange={(e) => handleDateChange('fechaProduccion', e.target.value)}
                />
              </Field>
              <Field label="Fecha Recepción">
                <input
                  type="date"
                  className={inputCls}
                  value={data.fechaRecepcion}
                  onChange={(e) => handleDateChange('fechaRecepcion', e.target.value)}
                />
              </Field>
              <Field label="Nº Proceso">
                <input
                  type="text"
                  className={inputCls}
                  value={data.nProceso}
                  onChange={(e) => set('nProceso', e.target.value)}
                />
              </Field>
              <Field label="Guía Recepción">
                <input
                  type="text"
                  className={inputCls}
                  value={data.guiaRecepcion}
                  onChange={(e) => set('guiaRecepcion', e.target.value)}
                />
              </Field>
              <Field label="Guía Asignada">
                <input
                  className={inputCls}
                  value={data.guiaAsignada}
                  onChange={(e) => set('guiaAsignada', e.target.value)}
                />
              </Field>
              <Field label="Variedad" hint="Escribe libremente o selecciona de la lista">
                <input
                  className={inputCls}
                  list="variedad-list"
                  placeholder="Ej: SUZIBLUE, DUKE, ..."
                  value={data.variedad}
                  onChange={(e) => set('variedad', e.target.value)}
                />
                <datalist id="variedad-list">
                  {variedades.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </Field>
            </div>
          </SectionCard>

          {/* Sección 2: Control de Kilos */}
          <SectionCard
            title="Control de Kilos"
            subtitle="Ingreso y cálculo de pesos del proceso"
            color="border-cyan-100 bg-cyan-50/40"
          >
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              <Field label="Recepción (Kg)">
                <input
                  type="number"
                  step="0.001"
                  className={inputCls}
                  value={data.recepcionKg}
                  onChange={(e) =>
                    set('recepcionKg', e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Rechazo QC (Kg)">
                <input
                  type="number"
                  step="0.001"
                  className={inputCls}
                  value={data.rechazoQcKg}
                  onChange={(e) =>
                    set('rechazoQcKg', e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Fruta a proceso (Kg)" hint="Auto: Recepción − Rechazo">
                <input
                  type="number"
                  step="0.001"
                  className={`${inputCls} bg-blue-50 font-semibold`}
                  value={data.frutaProcesoKg}
                  onChange={(e) =>
                    set('frutaProcesoKg', e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Procesado (Kg)">
                <input
                  type="number"
                  step="0.001"
                  className={inputCls}
                  value={data.procesadoKg}
                  onChange={(e) =>
                    set('procesadoKg', e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Stock (Kg)" hint="Auto: Fruta proc. − Procesado">
                <input
                  type="number"
                  step="0.001"
                  disabled
                  className={inputCalcCls}
                  value={round3(computed.stockKg)}
                />
              </Field>
            </div>
          </SectionCard>

          {/* Sección 3: Cajas */}
          <SectionCard
            title="Formato de Embalaje en Cajas"
            subtitle="Cantidad de cajas por formato activo"
            color="border-amber-100 bg-amber-50/40"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BOX_FORMATS.map((b) => (
                <div key={b.id} className="rounded-lg border border-amber-200/60 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">{b.label}</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      × {b.factor}
                    </span>
                  </div>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="0 cajas"
                    value={data.cajas[b.id] ?? ''}
                    onChange={(e) =>
                      setCaja(b.id, e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Sección 4: Totales y Porcentajes */}
          <SectionCard
            title="Totales y Porcentajes Automáticos"
            subtitle="Cálculos derivados del proceso"
            color="border-green-100 bg-green-50/40"
          >
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              <Field label="Embalado (Kg)" hint="Auto: Σ cajas × factor">
                <input
                  type="number"
                  step="0.001"
                  disabled
                  className={`${inputCalcCls} bg-blue-50 text-blue-800`}
                  value={round3(computed.embaladoKg)}
                />
              </Field>
              <Field label="Deshidrata. (Kg)" hint="Auto: Recepción − (Embalado + Merma)">
                <input
                  type="number"
                  step="0.001"
                  disabled
                  className={`${inputCalcCls} bg-orange-50 text-orange-800`}
                  value={round3(computed.deshidrataKg)}
                />
              </Field>
              <Field label="Fruta IQF (Kg)">
                <input
                  type="number"
                  step="0.001"
                  className={inputCls}
                  value={data.frutaIqfKg}
                  onChange={(e) =>
                    set('frutaIqfKg', e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </Field>
              <Field label={`Merma (Kg)`} hint={`Sugerido: ${(DEFAULT_MERMA_PCT * 100).toFixed(1)}% del procesado`}>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    className={inputCls}
                    value={data.mermaKg}
                    onChange={(e) =>
                      set('mermaKg', e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                  <button
                    type="button"
                    onClick={applySuggestedMerma}
                    title="Calcular merma sugerida (1.5%)"
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
                  >
                    <Calculator className="h-4 w-4" />
                    1.5%
                  </button>
                </div>
              </Field>
              <Field label="% Exportación" hint="Embalado ÷ Procesado">
                <input disabled className={inputCalcCls} value={(computed.pctExportacion * 100).toFixed(2) + '%'} />
              </Field>
              <Field label="% Deshidra." hint="Deshidra ÷ Procesado">
                <input disabled className={inputCalcCls} value={(computed.pctDeshidra * 100).toFixed(2) + '%'} />
              </Field>
              <Field label="% IQF" hint="IQF ÷ Procesado">
                <input disabled className={inputCalcCls} value={(computed.pctIqf * 100).toFixed(2) + '%'} />
              </Field>
              <Field label="% Merma" hint="Merma ÷ Procesado">
                <input disabled className={inputCalcCls} value={(computed.pctMerma * 100).toFixed(2) + '%'} />
              </Field>
            </div>

            {/* Divider */}
            <div className="my-5 border-t border-gray-200" />

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              <Field label="Nº Tarjas">
                <input
                  type="number"
                  className={inputCls}
                  value={data.nTarjas}
                  onChange={(e) =>
                    set('nTarjas', e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Traspaso de cajas">
                <input
                  className={inputCls}
                  value={data.traspasoCajas}
                  onChange={(e) => set('traspasoCajas', e.target.value)}
                />
              </Field>
              <Field label="Ajustar Diferencia">
                <input
                  className={inputCls}
                  value={data.ajustarDiferencia}
                  onChange={(e) => set('ajustarDiferencia', e.target.value)}
                />
              </Field>
              <Field label="Observaciones">
                <textarea
                  className={inputCls}
                  rows={1}
                  value={data.observaciones}
                  onChange={(e) => set('observaciones', e.target.value)}
                />
              </Field>
            </div>
          </SectionCard>

          {/* Formula info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div className="text-xs text-blue-800">
              <p className="font-semibold mb-1">Fórmula de balance aplicada:</p>
              <p>Deshidratado (Kg) = Recepción (Kg) − [ Embalado (Kg) + Merma (Kg) ]</p>
              <p className="mt-1 text-blue-600">La merma sugerida corresponde al 1.5% del procesado.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t-2 border-gray-200 px-7 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
