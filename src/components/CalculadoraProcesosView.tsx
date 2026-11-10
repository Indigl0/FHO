import React, { useState } from 'react';
import { Calculator, Search, Package, Scale, Layers, FileSpreadsheet } from 'lucide-react';

interface EmbalajeItem {
  id: string;
  embalaje: string;
  pesoNetoEmbalaje: number; // en KG
  bandejas: number | '';
}

const INITIAL_DATA: EmbalajeItem[] = [
  { id: '1', embalaje: '12 X 11 OZ (1 Pinta)', pesoNetoEmbalaje: 3.75, bandejas: 150 },
  { id: '2', embalaje: '12 X 125 GRS', pesoNetoEmbalaje: 1.5, bandejas: 250 },
  { id: '3', embalaje: '12 X 18 OZ (7 X7)', pesoNetoEmbalaje: 6.12, bandejas: 90 },
  { id: '4', embalaje: '12 X 200 GRS', pesoNetoEmbalaje: 2.4, bandejas: '' },
  { id: '5', embalaje: '12 X 250 GRS', pesoNetoEmbalaje: 3.0, bandejas: 150 },
  { id: '6', embalaje: '12 X 300 GRS', pesoNetoEmbalaje: 3.6, bandejas: '' },
  { id: '7', embalaje: '12 X 500', pesoNetoEmbalaje: 6.0, bandejas: 90 },
  { id: '8', embalaje: '12 X 6 OZ', pesoNetoEmbalaje: 2.04, bandejas: 220 },
  { id: '9', embalaje: '18 X 150 GRS', pesoNetoEmbalaje: 2.7, bandejas: '' },
  { id: '10', embalaje: '28 X 200 GRS', pesoNetoEmbalaje: 5.6, bandejas: '' },
  { id: '11', embalaje: '3 KG GRANEL', pesoNetoEmbalaje: 3.0, bandejas: 220 },
  { id: '12', embalaje: '3,6 KG GRANEL', pesoNetoEmbalaje: 3.6, bandejas: 180 },
  { id: '13', embalaje: '42 X125 GRS', pesoNetoEmbalaje: 5.25, bandejas: 70 },
  { id: '14', embalaje: '42 X 150 GRS', pesoNetoEmbalaje: 6.3, bandejas: 70 },
  { id: '15', embalaje: '8 X 18 OZ (7X5)', pesoNetoEmbalaje: 4.08, bandejas: 150 },
];

export const CalculadoraProcesosView: React.FC = () => {
  const [deshidratacion, setDeshidratacion] = useState<number>(1.057);
  const [pesoNetoBandejas, setPesoNetoBandejas] = useState<number>(1.5); // Peso neto bandejas para cálculo por fila
  
  // Simulador por Kilos Disponibles
  const [kilosDisponibles, setKilosDisponibles] = useState<number | ''>(500);
  const [pesoTotem, setPesoTotem] = useState<number>(3.5);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [items, setItems] = useState<EmbalajeItem[]>(INITIAL_DATA);

  // Manejar cambio en Bandejas (calcula Cajas automáticamente)
  const handleBandejasChange = (id: string, value: string) => {
    const numericValue = value === '' ? '' : parseFloat(value);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, bandejas: numericValue } : item))
    );
  };

  // Cálculos del Simulador por Kilos
  const numKilos = typeof kilosDisponibles === 'number' ? kilosDisponibles : 0;
  const bandejasTotemCalc = pesoTotem > 0 ? numKilos / pesoTotem : 0;

  // Filtrar elementos por búsqueda
  const filteredItems = items.filter((item) =>
    item.embalaje.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Totales generales
  const totalBandejas = items.reduce((acc, curr) => acc + (typeof curr.bandejas === 'number' ? curr.bandejas : 0), 0);
  
  // Total de cajas calculadas a partir de las bandejas ingresadas
  const totalCajasCalculadas = items.reduce((acc, curr) => {
    const bandejasVal = typeof curr.bandejas === 'number' ? curr.bandejas : 0;
    const divisor = curr.pesoNetoEmbalaje * deshidratacion;
    const cajasCalc = divisor > 0 ? (bandejasVal * pesoNetoBandejas) / divisor : 0;
    return acc + cajasCalc;
  }, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-emerald-600" />
            Módulo de Cálculo y Simulador de Procesos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Simulador por Kilos Disponibles y cálculo automático de Cajas según el Nº de Bandejas (Deshidratación: {deshidratacion}).
          </p>
        </div>

        {/* Parámetros Globales */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase">
              % Deshidratación
            </label>
            <input
              type="number"
              step="0.001"
              value={deshidratacion}
              onChange={(e) => setDeshidratacion(parseFloat(e.target.value) || 1.057)}
              className="mt-1 w-24 px-2.5 py-1 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase">
              Peso Bandeja (Fila)
            </label>
            <input
              type="number"
              step="0.1"
              value={pesoNetoBandejas}
              onChange={(e) => setPesoNetoBandejas(parseFloat(e.target.value) || 1.5)}
              className="mt-1 w-24 px-2.5 py-1 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* PANEL: Simulador por Kilos Disponibles y Tótems */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-wider">
          <Scale className="w-5 h-5" />
          Simulador por Kilos Disponibles (Tótems / Bandejas Base)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-medium">
              Kilos Disponibles (Ej. 500 KG)
            </label>
            <input
              type="number"
              value={kilosDisponibles}
              onChange={(e) => setKilosDisponibles(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="Ej. 500"
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-lg font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-medium">
              Peso del Formato Tótem / Bandeja (KG)
            </label>
            <input
              type="number"
              step="0.1"
              value={pesoTotem}
              onChange={(e) => setPesoTotem(parseFloat(e.target.value) || 3.5)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="bg-white/10 border border-white/15 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-300 uppercase font-medium">Bandejas / Tótems Necesarios</p>
              <h3 className="text-2xl font-black text-emerald-300">
                {bandejasTotemCalc.toLocaleString('es-CL', { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-300">unds</span>
              </h3>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-300 italic">
          * Con estos {numKilos} KG, revisa en la tabla de abajo cuántas cajas te alcanzarían a armar según el formato que elijas.
        </p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Total Bandejas Ingresadas</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalBandejas.toLocaleString('es-CL', { maximumFractionDigits: 1 })}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Total Cajas Calculadas</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalCajasCalculadas.toLocaleString('es-CL', { maximumFractionDigits: 1 })}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Formatos Activos</p>
            <h3 className="text-2xl font-bold text-slate-800">{items.length} Tipos</h3>
          </div>
        </div>
      </div>

      {/* Buscador y Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por tipo de embalaje..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6 font-semibold">Embalaje</th>
                <th className="py-3.5 px-6 font-semibold">Peso Neto Embalaje</th>
                <th className="py-3.5 px-6 font-semibold bg-blue-50/50 text-blue-900">
                  Nº de Bandejas <span className="text-[10px] lowercase text-blue-600 font-normal">(Editable)</span>
                </th>
                <th className="py-3.5 px-6 font-semibold bg-emerald-50/50 text-emerald-900">
                  Nº de Cajas <span className="text-[10px] lowercase text-emerald-600 font-normal">(Calculado)</span>
                </th>
                <th className="py-3.5 px-6 font-semibold bg-purple-50/50 text-purple-900">
                  Cajas Estimadas (según {numKilos} KG)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredItems.map((item) => {
                const bandejasVal = typeof item.bandejas === 'number' ? item.bandejas : 0;
                
                // Cálculo de Cajas según la fórmula: ( Nº bandejas * Peso neto bandejas ) / ( Peso neto embalaje * % Deshidratación )
                const divisor = item.pesoNetoEmbalaje * deshidratacion;
                const cajasCalc = divisor > 0 && bandejasVal > 0 ? (bandejasVal * pesoNetoBandejas) / divisor : 0;

                // Cálculo de Cajas estimadas según Kilos Disponibles
                const cajasSimuladas = divisor > 0 && numKilos > 0 ? numKilos / divisor : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-800">{item.embalaje}</td>
                    <td className="py-3 px-6 text-slate-600">{item.pesoNetoEmbalaje} KG</td>
                    
                    {/* Campo Bandejas Editable */}
                    <td className="py-3 px-6 bg-blue-50/20">
                      <input
                        type="number"
                        step="0.1"
                        value={item.bandejas}
                        onChange={(e) => handleBandejasChange(item.id, e.target.value)}
                        placeholder="Ej. 150"
                        className="w-28 px-3 py-1.5 bg-white border border-blue-300 rounded-md shadow-sm text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    {/* Nº de Cajas Calculado */}
                    <td className="py-3 px-6 bg-emerald-50/20 font-bold text-emerald-900">
                      {bandejasVal > 0 ? (
                        <span>
                          {cajasCalc.toLocaleString('es-CL', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-emerald-700">cajas</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">-</span>
                      )}
                    </td>

                    {/* Columna Cajas Estimadas por Kilos Disponibles */}
                    <td className="py-3 px-6 bg-purple-50/20 font-bold text-purple-900">
                      {numKilos > 0 ? (
                        <span>
                          {cajasSimuladas.toLocaleString('es-CL', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-purple-700">cajas</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">Ingrese kilos</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
