import React, { useState, useEffect } from 'react';
import { RechazoRecord } from '../types';
import { Pencil, Trash2, Plus, Download, Search, Loader2 } from 'lucide-react';
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

  // Cargar registros y escuchar cambios en tiempo real desde Supabase
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
        .order('created_at', { ascending: true });

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
    setFormData({
      fecha: '',
      numero: rechazos.length + 1,
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
        // Actualizar en Supabase
        const { error } = await supabase
          .from('rechazos_records')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // Insertar nuevo en Supabase
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

  const exportToExcel = () => {
    alert('Exportando detalle de rechazos a Excel...');
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs font-medium text-gray-500">Cargando rechazos desde Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Detalle de Rechazos ASQUE</h2>
          <p className="text-sm text-slate-500">Monitoreo y control oficial de rechazos de fruta a granel y empaque (Sincronizado con Supabase).</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Download className="h-4 w-4" /> Exportar Excel Profesional
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> Nuevo Registro
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por productor, lote, folio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-sm text-slate-500 font-medium">Total registros: {filteredRechazos.length}</span>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-emerald-50 text-emerald-900 border-b border-emerald-100 font-semibold">
              <th className="p-3">Fecha</th>
              <th className="p-3">N°</th>
              <th className="p-3">Lote</th>
              <th className="p-3">Productor</th>
              <th className="p-3">Tipo Rechazo</th>
              <th className="p-3">Folio</th>
              <th className="p-3">OP Inicial</th>
              <th className="p-3">Embalaje</th>
              <th className="p-3">F. Embalaje</th>
              <th className="p-3">Proceso FHO</th>
              <th className="p-3">OP Final</th>
              <th className="p-3">N° Contenedor</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Observaciones</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredRechazos.length > 0 ? (
              filteredRechazos.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-3">{item.fecha}</td>
                  <td className="p-3 font-medium">{item.numero}</td>
                  <td className="p-3">{item.lote}</td>
                  <td className="p-3 font-medium text-slate-900">{item.productor}</td>
                  <td className="p-3">
                    {item.tipoRechazo ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-medium">
                        {item.tipoRechazo}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3">{item.folio}</td>
                  <td className="p-3">{item.opInicial}</td>
                  <td className="p-3">{item.embalaje}</td>
                  <td className="p-3">{item.fechaEmbalaje}</td>
                  <td className="p-3">{item.procesoFho}</td>
                  <td className="p-3">{item.opFinal}</td>
                  <td className="p-3 font-mono">{item.nContenedor}</td>
                  <td className="p-3">
                    {item.estado ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                        {item.estado}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500">{item.observaciones}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
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
                <td colSpan={15} className="text-center py-8 text-slate-400">
                  No hay registros de rechazos disponibles en la base de datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Crear / Editar Registro */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingId ? 'Editar Registro de Rechazo' : 'Nuevo Registro de Rechazo'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Fecha</label>
                <input type="text" name="fecha" placeholder="Ej: 12-12-25" value={formData.fecha ?? ''} onChange={handleInputChange} required className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Lote</label>
                <input type="text" name="lote" placeholder="Ej: 118" value={formData.lote ?? ''} onChange={handleInputChange} required className="w-full border p-2 rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Productor</label>
                <input type="text" name="productor" placeholder="Ej: AGRICOLA AGROBERRIES SPA..." value={formData.productor ?? ''} onChange={handleInputChange} required className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Tipo de Rechazo</label>
                <input type="text" name="tipoRechazo" placeholder="Ej: SAG - USDA" value={formData.tipoRechazo ?? ''} onChange={handleInputChange} required className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Folio</label>
                <input type="text" name="folio" placeholder="Ej: 4686" value={formData.folio ?? ''} onChange={handleInputChange} required className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">OP Inicial</label>
                <input type="text" name="opInicial" placeholder="Ej: 224" value={formData.opInicial ?? ''} onChange={handleInputChange} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Embalaje</label>
                <input type="text" name="embalaje" placeholder="Ej: 12 X 1 PTNA R/F" value={formData.embalaje ?? ''} onChange={handleInputChange} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Fecha Embalaje</label>
                <input type="text" name="fechaEmbalaje" placeholder="Ej: 10-12-25" value={formData.fechaEmbalaje ?? ''} onChange={handleInputChange} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Proceso FHO</label>
                <input type="text" name="procesoFho" placeholder="Ej: FUMIGACION" value={formData.procesoFho ?? ''} onChange={handleInputChange} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">OP Final</label>
                <input type="text" name="opFinal" placeholder="Ej: 224" value={formData.opFinal ?? ''} onChange={handleInputChange} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">N° Contenedor</label>
                <input type="text" name="nContenedor" placeholder="Ej: MMAU131365-2" value={formData.nContenedor ?? ''} onChange={handleInputChange} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Estado</label>
                <input type="text" name="estado" placeholder="Ej: EXPORTADO" value={formData.estado ?? ''} onChange={handleInputChange} className="w-full border p-2 rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Observaciones</label>
                <input type="text" name="observaciones" placeholder="Ej: FLM / Se asocia a..." value={formData.observaciones ?? ''} onChange={handleInputChange} className="w-full border p-2 rounded-lg" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
