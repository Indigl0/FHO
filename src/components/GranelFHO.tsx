import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Download, FileJson, Search, ArrowUpDown, Lock } from 'lucide-react';
import type { ProcessRecord } from '../types';
import { INITIAL_VARIEDADES } from '../constants';
import { computeRecord, num } from '../utils/calculations';
import { recordsToCSV, downloadFile } from '../utils/export';
import { useLocalStorage } from '../utils/storage';
import { supabase } from '../utils/supabase';
import RecordForm from './RecordForm';

interface Props {
  records: ProcessRecord[];
  userRole: 'admin' | 'viewer';
  onRefresh: () => void;
}

function fmtKg(n: number): string {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

const thCls = 'px-2.5 py-3 font-semibold text-gray-600 whitespace-nowrap text-xs';
const tdCls = 'px-2.5 py-2.5 text-gray-700 whitespace-nowrap text-xs';
const tdNum = 'px-2.5 py-2.5 text-right text-gray-700 whitespace-nowrap tabular-nums text-xs';
const tdCalc = 'px-2.5 py-2.5 text-right font-semibold whitespace-nowrap tabular-nums text-xs';

export default function GranelFHO({ records, userRole, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProcessRecord | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'fecha' | 'proceso' | 'mes'>('fecha');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [, setSubmitting] = useState(false);
  const [extraVariedades, setExtraVariedades] = useLocalStorage<string[]>(
    'granel-variedades-extra',
    []
  );

  const variedades = useMemo(() => {
    const fromRecords = records
      .map((r) => r.variedad)
      .filter((v) => v.trim() !== '');
    const all = [...new Set([...INITIAL_VARIEDADES, ...extraVariedades, ...fromRecords])];
    return all.sort((a, b) => a.localeCompare(b));
  }, [records, extraVariedades]);

  const filtered = records
    .filter((r) => {
      const s = search.toLowerCase();
      return (
        r.mesProduccion.toLowerCase().includes(s) ||
        r.mesRecepcion.toLowerCase().includes(s) ||
        r.productor.toLowerCase().includes(s) ||
        r.variedad.toLowerCase().includes(s) ||
        r.semana.toLowerCase().includes(s) ||
        String(r.nProceso).includes(s) ||
        String(r.guiaRecepcion || '').toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'fecha') cmp = a.fechaRecepcion.localeCompare(b.fechaRecepcion);
      if (sortKey === 'proceso') cmp = Number(a.nProceso || 0) - Number(b.nProceso || 0);
      if (sortKey === 'mes') cmp = a.mesProduccion.localeCompare(b.mesProduccion);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleAdd = () => {
    if (userRole === 'viewer') return;
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (r: ProcessRecord) => {
    if (userRole === 'viewer') return;
    setEditing(r);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (userRole === 'viewer') return;
    if (confirm('¿Estás seguro de eliminar este registro de la base de datos?')) {
      try {
        const { error } = await supabase.from('process_records').delete().eq('id', id);
        if (error) throw error;
        onRefresh();
      } catch (err: any) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  const handleSave = async (r: ProcessRecord) => {
    if (userRole === 'viewer') return;
    setSubmitting(true);

    try {
      const payload = {
        id: r.id,
        mes_produccion: r.mesProduccion,
        mes_recepcion: r.mesRecepcion,
        productor: r.productor,
        semana: r.semana,
        fecha_produccion: r.fechaProduccion,
        fecha_recepcion: r.fechaRecepcion,
        n_proceso: r.nProceso,
        guia_recepcion: r.guiaRecepcion,
        guia_asignada: r.guiaAsignada,
        variedad: r.variedad,
        recepcion_kg: num(r.recepcionKg),
        rechazo_qc_kg: num(r.rechazoQcKg),
        fruta_proceso_kg: computeRecord(r).frutaProcesoKg,
        procesado_kg: num(r.procesadoKg),
        cajas: r.cajas,
        deshidrata_kg: computeRecord(r).deshidrataKg,
        fruta_iqf_kg: num(r.frutaIqfKg),
        merma_kg: num(r.mermaKg),
        n_tarjas: num(r.nTarjas),
        observaciones: r.observaciones,
        traspaso_cajas: r.traspasoCajas,
        ajustar_diferencia: r.ajustarDiferencia,
      };

      const { error } = await supabase.from('process_records').upsert(payload);
      if (error) throw error;

      if (
        r.variedad.trim() !== '' &&
        !extraVariedades.includes(r.variedad.trim()) &&
        !INITIAL_VARIEDADES.includes(r.variedad.trim())
      ) {
        setExtraVariedades((prev: string[]) => [...prev, r.variedad.trim()]);
      }

      setShowForm(false);
      setEditing(null);
      onRefresh();
    } catch (err: any) {
      alert('Error al guardar en Supabase: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const exportCSV = () => {
    downloadFile(recordsToCSV(records), 'granel-fho.csv', 'text/csv;charset=utf-8');
  };

  const exportJSON = () => {
    downloadFile(JSON.stringify(records, null, 2), 'granel-fho.json', 'application/json');
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 bg-white shadow-sm"
            placeholder="Buscar por mes, guía, variedad, proceso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 bg-white shadow-sm">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={exportJSON} className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 bg-white shadow-sm">
            <FileJson className="h-3.5 w-3.5" /> JSON
          </button>
          {userRole === 'admin' ? (
            <button onClick={handleAdd} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-blue-700">
              <Plus className="h-3.5 w-3.5" /> Nuevo Registro
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800">
              <Lock className="h-3.5 w-3.5" /> Modo Solo Lectura
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
          {records.length} reg.
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
          Recepción total: {fmtKg(records.reduce((s, r) => s + num(r.recepcionKg), 0))} Kg
        </span>
        <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
          Embalado total: {fmtKg(records.reduce((s, r) => s + computeRecord(r).embaladoKg, 0))} Kg
        </span>
        <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-700">
          Deshidratado total: {fmtKg(records.reduce((s, r) => s + computeRecord(r).deshidrataKg, 0))} Kg
        </span>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 text-left">
              <th className={thCls}>
                <button onClick={() => toggleSort('mes')} className="flex items-center gap-1 hover:text-gray-900">
                  Mes P. <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className={thCls}>Prod.</th>
              <th className={thCls}>Sem.</th>
              <th className={thCls}>
                <button onClick={() => toggleSort('fecha')} className="flex items-center gap-1 hover:text-gray-900">
                  F. Recep. <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className={thCls}>
                <button onClick={() => toggleSort('proceso')} className="flex items-center gap-1 hover:text-gray-900">
                  N° Proc. <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className={`${thCls} text-blue-900 bg-blue-100`}>N° Guía</th>
              <th className={`${thCls} text-right`}>Recep. (Kg)</th>
              <th className={`${thCls} text-right`}>Rech. (Kg)</th>
              <th className={`${thCls} text-right`}>Fruta Proc.</th>
              <th className={`${thCls} text-right`}>Procesado</th>
              <th className={`${thCls} text-right`}>Stock</th>
              <th className={`${thCls} text-right text-emerald-900 bg-emerald-100`}>Embalado</th>
              <th className={`${thCls} text-right text-amber-900 bg-amber-100`}>Deshid.</th>
              <th className={`${thCls} text-right`}>IQF</th>
              <th className={`${thCls} text-right`}>Merma</th>
              <th className={`${thCls} text-right`}>% Exp.</th>
              <th className={thCls}>Variedad</th>
              {userRole === 'admin' && <th className={`${thCls} text-center`}>Acc.</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={userRole === 'admin' ? 18 : 17} className="py-12 text-center text-gray-400">
                  No hay registros disponibles en la nube.
                </td>
              </tr>
            ) : (
              filtered.map((r, idx) => {
                const c = computeRecord(r);
                return (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-blue-50/30 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                    <td className={`${tdCls} font-medium text-gray-800`}>{r.mesProduccion}</td>
                    <td className={tdCls}>{r.productor}</td>
                    <td className={`${tdCls} font-semibold text-center`}>{r.semana}</td>
                    <td className={tdCls}>{r.fechaRecepcion}</td>
                    <td className={tdCls}>{r.nProceso}</td>
                    <td className={`${tdCls} font-bold text-blue-900 bg-blue-50/50`}>{r.guiaRecepcion || '—'}</td>
                    <td className={tdNum}>{fmtKg(num(r.recepcionKg))}</td>
                    <td className={tdNum}>{fmtKg(num(r.rechazoQcKg))}</td>
                    <td className={tdNum}>{fmtKg(c.frutaProcesoKg)}</td>
                    <td className={tdNum}>{fmtKg(num(r.procesadoKg))}</td>
                    <td className={tdNum}>{fmtKg(c.stockKg)}</td>
                    <td className={`${tdCalc} text-emerald-800 bg-emerald-50/30`}>{fmtKg(c.embaladoKg)}</td>
                    <td className={`${tdCalc} text-amber-800 bg-amber-50/30`}>{fmtKg(c.deshidrataKg)}</td>
                    <td className={tdNum}>{fmtKg(num(r.frutaIqfKg))}</td>
                    <td className={tdNum}>{fmtKg(num(r.mermaKg))}</td>
                    <td className={`${tdNum} text-gray-500`}>{fmtPct(c.pctExportacion)}</td>
                    <td className={`${tdCls} font-medium`}>{r.variedad}</td>
                    {userRole === 'admin' && (
                      <td className="px-2.5 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(r)} className="rounded p-1 text-gray-400 hover:bg-blue-100 hover:text-blue-600" title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600" title="Eliminar">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && userRole === 'admin' && (
        <RecordForm record={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} variedades={variedades} />
      )}
    </div>
  );
}
