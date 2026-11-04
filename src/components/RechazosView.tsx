import React, { useState, useEffect } from 'react';
import { RechazoRecord } from '../types';
import { Pencil, Trash2, Plus, Download, Search, FileSpreadsheet, FileCode } from 'lucide-react';
import { supabase } from '../utils/supabase';

export const RechazosView: React.FC = () => {
  const [rechazos, setRechazos] = useState<RechazoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<RechazoRecord, 'id'>>({
    fecha: '',
    numero: 1,
    lote: '',
    productor: '',
    tipoRechazo: '',
    folio: '',
    opInicial: '',
    embalaje: '',
    fechaEmbalaje: '',
    procesoFho: '',
    opFinal: '',
    nContenedor: '',
    estado: '',
    observaciones: '',
  });

  useEffect(() => {
    fetchRechazos();

    const channel = supabase
      .channel('public:rechazos_records')
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

      const formatted: RechazoRecord[] = (data || []).map((r: any) => ({
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
        opFinal: r.op_final || '',
        nContenedor: r.n_contenedor || '',
        estado: r.estado || '',
        observaciones: r.observaciones || '',
      }));

      setRechazos(formatted);
    } catch (err) {
      console.error('Error al cargar rechazos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    const nextNumero = rechazos.length > 0 
      ? Math.max(...rechazos.map(r => Number(r.numero) || 0)) + 1 
      : 1;

    setFormData({
      fecha: '',
      numero: nextNumero,
      lote: '',
      productor: '',
      tipoRechazo: '',
      folio: '',
      opInicial: '',
      embalaje: '',
      fechaEmbalaje: '',
      procesoFho: '',
      opFinal: '',
      nContenedor: '',
      estado: '',
      observaciones: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: RechazoRecord) => {
    setEditingId(item.id);
    setFormData({
      fecha: item.fecha ?? '',
      numero: item.numero ?? 1,
      lote: item.lote ?? '',
      productor: item.productor ?? '',
      tipoRechazo: item.tipoRechazo ?? '',
      folio: item.folio ?? '',
      opInicial: item.opInicial ?? '',
      embalaje: item.embalaje ?? '',
      fechaEmbalaje: item.fechaEmbalaje ?? '',
      procesoFho: item.procesoFho ?? '',
      opFinal: item.opFinal ?? '',
      nContenedor: item.nContenedor ?? '',
      estado: item.estado ?? '',
      observaciones: item.observaciones ?? '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de rechazo?')) {
      try {
        const { error } = await supabase.from('rechazos_records').delete().eq('id', id);
        if (error) throw error;
        fetchRechazos();
      } catch (err) {
        console.error('Error al eliminar:', err);
        alert('No se pudo eliminar el registro de la base de datos.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        fecha: formData.fecha,
        numero: Number(formData.numero) || 1,
        lote: formData.lote,
        productor: formData.productor,
        tipo_rechazo: formData.tipoRechazo,
        folio: formData.folio,
        op_inicial: formData.opInicial,
        embalaje: formData.embalaje,
        fecha_embalaje: formData.fechaEmbalaje,
        proceso_fho: formData.procesoFho,
        op_final: formData.opFinal,
        n_contenedor: formData.nContenedor,
        estado: formData.estado,
        observaciones: formData.observaciones,
      };

      if (editingId) {
        const { error } = await supabase
          .from('rechazos_records')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const newId = Date.now().toString();
        const { error } = await supabase
          .from('rechazos_records')
          .insert([{ id: newId, ...payload }]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingId(null);
      fetchRechazos();
    } catch (err) {
      console.error('Error al guardar en Supabase:', err);
      alert('Hubo un error al guardar en la base de datos.');
    }
  };

  const filteredRechazos = rechazos.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const exportToCSV = () => {
    alert('Exportando rechazos a CSV...');
  };

  const exportToJSON = () => {
    alert('Exportando rechazos a JSON...');
  };

  const exportToExcel = () => {
    alert('Exportando detalle de rechazos a Excel profesional...');
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">Cargando rechazos desde Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Barra de Búsqueda y Acciones */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por productor, lote, folio, tipo rechazo, observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> CSV
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FileCode className="h-4 w-4 text-blue-600" /> JSON
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
          >
            <Download className="h-4 w-4" /> Exportar Excel
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Nuevo Registro
          </button>
        </div>
      </div>

      {/* Barra de Indicadores */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm whitespace-nowrap">
          <span className="text-xs font-medium text-slate-500">Total Registros:</span>
          <span className="text-sm font-bold text-slate-900">{filteredRechazos.length} Reg.</span>
        </div>
      </div>

      {/* Tabla con el orden de columnas reorganizado y optimizado en espacios */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <th className="py-3.5 px-2 text-center whitespace-nowrap w-12">N°</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Fecha</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Lote</th>
                <th className="py-3.5 px-4 text-left min-w-[220px]">Productor</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">T. Rechazo</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Folio</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">OP Inc</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Embalaje</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">F. Embalaje</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Proceso</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">OP Final</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Contenedor</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Estado</th>
                <th className="py-3.5 px-4 text-left min-w-[150px]">Observaciones</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRechazos.length > 0 ? (
                filteredRechazos.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-2 text-center font-bold text-slate-900 whitespace-nowrap">{item.numero}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">{item.fecha}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">{item.lote}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.productor}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {item.tipoRechazo ? (
                        <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded font-medium">
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
                    <td className="py-3 px-3 text-center whitespace-nowrap">{item.procesoFho}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">{item.opFinal}</td>
                    <td className="py-3 px-3 text-center font-mono whitespace-nowrap">{item.nContenedor}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {item.estado ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                          {item.estado}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.observaciones}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Editar registro"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                          title="Eliminar registro"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={15} className="text-center py-12 text-slate-400">
                    No hay registros disponibles en el consolidado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear / Editar Registro */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingId ? 'Editar Registro de Rechazo' : `Nuevo Registro de Rechazo (N° ${formData.numero})`}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-slate-600 font-medium mb-1">N° Correlativo</label>
                <input type="number" name="numero" value={formData.numero} onChange={handleInputChange} required className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Fecha</label>
                <input type="text" name="fecha" placeholder="Ej: 12-12-25" value={formData.fecha ?? ''} onChange={handleInputChange} required className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Lote</label>
                <input type="text" name="lote" placeholder="Ej: 118" value={formData.lote ?? ''} onChange={handleInputChange} required className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">T. Rechazo</label>
                <input type="text" name="tipoRechazo" placeholder="Ej: SAG - USDA" value={formData.tipoRechazo ?? ''} onChange={handleInputChange} required className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Productor</label>
                <input type="text" name="productor" placeholder="Ej: AGRICOLA AGROBERRIES SPA..." value={formData.productor ?? ''} onChange={handleInputChange} required className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Folio</label>
                <input type="text" name="folio" placeholder="Ej: 4686" value={formData.folio ?? ''} onChange={handleInputChange} required className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">OP Inc</label>
                <input type="text" name="opInicial" placeholder="Ej: 224" value={formData.opInicial ?? ''} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Embalaje</label>
                <input type="text" name="embalaje" placeholder="Ej: 12 X 1 PTNA R/F" value={formData.embalaje ?? ''} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">F. Embalaje</label>
                <input type="text" name="fechaEmbalaje" placeholder="Ej: 10-12-25" value={formData.fechaEmbalaje ?? ''} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Proceso</label>
                <input type="text" name="procesoFho" placeholder="Ej: FUMIGACION" value={formData.procesoFho ?? ''} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">OP Final</label>
                <input type="text" name="opFinal" placeholder="Ej: 224" value={formData.opFinal ?? ''} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Contenedor</label>
                <input type="text" name="nContenedor" placeholder="Ej: MMAU131365-2" value={formData.nContenedor ?? ''} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Estado</label>
                <input type="text" name="estado" placeholder="Ej: EXPORTADO" value={formData.estado ?? ''} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Observaciones</label>
                <input type="text" name="observaciones" placeholder="Ej: FLM / Se asocia a..." value={formData.observaciones ?? ''} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-md">
                  {editingId ? 'Guardar Cambios' : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
