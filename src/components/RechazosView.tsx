import React, { useState, useEffect } from 'react';
import { RechazoRecord } from '../types';
import { Pencil, Trash2, Plus, Download, Search, FileCode, Layers, Package } from 'lucide-react';
import { supabase } from '../utils/supabase';

export const RechazosView: React.FC = () => {
  const [rechazos, setRechazos] = useState<RechazoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const getTodayFormatted = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const [formData, setFormData] = useState({
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
    nRecillasFho: '' as number | '',
    nRecillasAcopio: '' as number | '',
    opFinal: '',
    nContenedor: '',
    estado: 'EXPORTADO',
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

      const formatted: any[] = (data || []).map((r: any) => ({
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
        nRecillasFho: r.n_recillas_fho !== null && r.n_recillas_fho !== undefined && r.n_recillas_fho !== 0 ? Number(r.n_recillas_fho) : '',
        nRecillasAcopio: r.n_recillas_acopio !== null && r.n_recillas_acopio !== undefined && r.n_recillas_acopio !== 0 ? Number(r.n_recillas_acopio) : '',
        opFinal: r.op_final || '',
        nContenedor: r.n_contenedor || '',
        estado: r.estado || 'EXPORTADO',
        observaciones: r.observaciones || '',
      }));

      setRechazos(formatted);
    } catch (err) {
      console.error('Error al cargar rechazos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    const nextNumero = rechazos.length > 0 
      ? Math.max(...rechazos.map(r => Number(r.numero) || 0)) + 1 
      : 1;

    const today = getTodayFormatted();

    setFormData({
      fecha: today,
      numero: nextNumero,
      lote: '',
      productor: '',
      tipoRechazo: '',
      folio: '',
      opInicial: '',
      embalaje: '',
      fechaEmbalaje: today,
      procesoFho: '',
      nRecillasFho: '',
      nRecillasAcopio: '',
      opFinal: '',
      nContenedor: '',
      estado: 'EXPORTADO',
      observaciones: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
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
      nRecillasFho: item.nRecillasFho !== '' && !isNaN(Number(item.nRecillasFho)) ? Number(item.nRecillasFho) : '',
      nRecillasAcopio: item.nRecillasAcopio !== '' && !isNaN(Number(item.nRecillasAcopio)) ? Number(item.nRecillasAcopio) : '',
      opFinal: item.opFinal ?? '',
      nContenedor: item.nContenedor ?? '',
      estado: item.estado ?? 'EXPORTADO',
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
        n_recillas_fho: formData.nRecillasFho === '' ? 0 : Number(formData.nRecillasFho),
        n_recillas_acopio: formData.nRecillasAcopio === '' ? 0 : Number(formData.nRecillasAcopio),
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

  const totalReembalajesCount = rechazos.filter(r => String(r.procesoFho).toUpperCase().includes('REEMBALAJE') || (Number(r.nRecillasFho) > 0 || Number(r.nRecillasAcopio) > 0)).length;
  const totalRecillasFhoSum = rechazos.reduce((acc, r) => acc + (Number(r.nRecillasFho) || 0), 0);
  const totalRecillasAcopioSum = rechazos.reduce((acc, r) => acc + (Number(r.nRecillasAcopio) || 0), 0);

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
            <x:Name>Consolidado Rechazos ASQUE</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; width: 100%; }
          th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #0f172a; padding: 8px 10px; text-align: center; vertical-align: middle; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: middle; color: #334155; }
          .text { text-align: left; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .num { text-align: right; mso-number-format:"#,##0"; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Fecha</th>
              <th>Lote</th>
              <th>Productor</th>
              <th>T. Rechazo</th>
              <th>Folio</th>
              <th>OP Inc</th>
              <th>Embalaje</th>
              <th>F. Embalaje</th>
              <th style="background-color: #1e3b8a; color: white;">Proceso</th>
              <th style="background-color: #1e3b8a; color: white;">N° Recillas FHO</th>
              <th style="background-color: #1e3b8a; color: white;">N° Recillas Acopio</th>
              <th style="background-color: #1e3b8a; color: white;">Total Recillas</th>
              <th style="background-color: #1e3b8a; color: white;">OP Final</th>
              <th style="background-color: #1e3b8a; color: white;">Contenedor</th>
              <th style="background-color: #1e3b8a; color: white;">Estado</th>
              <th style="background-color: #1e3b8a; color: white;">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRechazos.map((item: any) => {
              const totalRec = (Number(item.nRecillasFho) || 0) + (Number(item.nRecillasAcopio) || 0);
              return `
                <tr>
                  <td class="center bold">${item.numero || ''}</td>
                  <td class="center">${item.fecha || ''}</td>
                  <td class="center">${item.lote || ''}</td>
                  <td class="text bold">${item.productor || ''}</td>
                  <td class="center" style="background-color: #ffedd5; color: #9a3412; font-weight: bold;">${item.tipoRechazo || ''}</td>
                  <td class="center">${item.folio || ''}</td>
                  <td class="center">${item.opInicial || ''}</td>
                  <td class="center">${item.embalaje || ''}</td>
                  <td class="center">${item.fechaEmbalaje || ''}</td>
                  <td class="center" style="background-color: #eff6ff;">${item.procesoFho || ''}</td>
                  <td class="num" style="background-color: #eff6ff; font-weight: bold;">${item.nRecillasFho || ''}</td>
                  <td class="num" style="background-color: #eff6ff; font-weight: bold;">${item.nRecillasAcopio || ''}</td>
                  <td class="num" style="background-color: #dbeafe; font-weight: bold;">${totalRec > 0 ? totalRec : ''}</td>
                  <td class="center" style="background-color: #eff6ff;">${item.opFinal || ''}</td>
                  <td class="center" style="background-color: #eff6ff; font-family: monospace;">${item.nContenedor || ''}</td>
                  <td class="center" style="background-color: #eff6ff; font-weight: bold;">${item.estado || ''}</td>
                  <td class="text" style="background-color: #eff6ff;">${item.observaciones || ''}</td>
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
    a.download = `Consolidado_Rechazos_ASQUE_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (filteredRechazos.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredRechazos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Rechazos_ASQUE_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
            placeholder="Buscar por productor, lote, folio, proceso, observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportExcelPro}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
          >
            <Download className="h-4 w-4" /> Exportar Excel Profesional (.xls)
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FileCode className="h-4 w-4 text-blue-600" /> JSON
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Nuevo Registro
          </button>
        </div>
      </div>

      {/* Tarjetas de Indicadores y Consolidado de Reembalajes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Registros</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{filteredRechazos.length} Reg.</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Reembalajes</p>
            <p className="text-lg font-bold text-orange-600 mt-0.5">{totalReembalajesCount} Oper.</p>
          </div>
          <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Rejillas FHO</p>
            <p className="text-lg font-bold text-blue-700 mt-0.5">{totalRecillasFhoSum.toLocaleString('es-CL')} cjs</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Rejillas Acopio</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">{totalRecillasAcopioSum.toLocaleString('es-CL')} cjs</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <Package className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabla detallada con columnas de reembalaje integradas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <th className="py-3.5 px-2 text-center whitespace-nowrap w-12">N°</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Fecha</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Lote</th>
                <th className="py-3.5 px-4 text-left min-w-[200px]">Productor</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">T. Rechazo</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Folio</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">OP Inc</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Embalaje</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">F. Embalaje</th>
                
                {/* Bloque FHO / Reembalaje con color azul distintivo */}
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-x border-blue-200">Proceso</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-r border-blue-200">N° Recillas FHO</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-r border-blue-200">N° Recillas Acopio</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-200 text-blue-950 border-r border-blue-300 font-black">Total</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-r border-blue-200">OP Final</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-r border-blue-200">Contenedor</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap bg-blue-100 text-blue-900 border-r border-blue-200">Estado</th>
                <th className="py-3.5 px-4 text-left min-w-[150px] bg-blue-100 text-blue-900">Observaciones</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRechazos.length > 0 ? (
                filteredRechazos.map((item: any) => {
                  const totalRec = (Number(item.nRecillasFho) || 0) + (Number(item.nRecillasAcopio) || 0);
                  const isPendiente = String(item.estado || '').toUpperCase() === 'PENDIENTE';
                  const isExportado = String(item.estado || '').toUpperCase() === 'EXPORTADO';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-2 text-center font-bold text-slate-900 whitespace-nowrap">{item.numero}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">{item.fecha}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">{item.lote}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{item.productor}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.tipoRechazo ? (
                          <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-800 rounded font-medium">
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
                      
                      {/* Celdas del bloque FHO y Reembalaje */}
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-50 border-x border-blue-100 font-medium">{item.procesoFho}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-50 border-r border-blue-100 font-semibold">{item.nRecillasFho !== '' ? item.nRecillasFho : '-'}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-50 border-r border-blue-100 font-semibold">{item.nRecillasAcopio !== '' ? item.nRecillasAcopio : '-'}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-100/70 border-r border-blue-200 font-bold text-blue-900">
                        {totalRec > 0 ? totalRec : '-'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-50 border-r border-blue-100">{item.opFinal}</td>
                      <td className="py-3 px-3 text-center font-mono whitespace-nowrap bg-blue-50 border-r border-blue-100">{item.nContenedor}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap bg-blue-50 border-r border-blue-100">
                        {item.estado ? (
                          <span className={`inline-block px-2 py-1 rounded font-medium ${
                            isPendiente 
                              ? 'bg-rose-100 text-rose-800' 
                              : isExportado 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {item.estado}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 bg-blue-50">{item.observaciones}</td>
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={18} className="text-center py-12 text-slate-400">
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
                <input type="text" name="procesoFho" placeholder="Ej: REEMBALAJE" value={formData.procesoFho ?? ''} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">N° Recillas FHO</label>
                <input 
                  type="number" 
                  name="nRecillasFho" 
                  placeholder="Ej: 150"
                  value={formData.nRecillasFho} 
                  onChange={handleInputChange} 
                  className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-blue-50/50 font-semibold" 
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">N° Recillas Acopio</label>
                <input 
                  type="number" 
                  name="nRecillasAcopio" 
                  placeholder="Ej: 122"
                  value={formData.nRecillasAcopio} 
                  onChange={handleInputChange} 
                  className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-blue-50/50 font-semibold" 
                />
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
                <select 
                  name="estado" 
                  value={formData.estado} 
                  onChange={handleInputChange} 
                  className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white font-medium"
                >
                  <option value="EXPORTADO">EXPORTADO</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                </select>
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
