import React, { useState } from 'react';
import { Calculator, Scale, Layers, PackageCheck, ChevronDown } from 'lucide-react';

interface EmbalajeItem {
  id: string;
  embalaje: string;
  pesoNetoEmbalaje: number; // en KG
}

const INITIAL_DATA: EmbalajeItem[] = [
  { id: '1', embalaje: '12 X 11 OZ (1 Pinta)', pesoNetoEmbalaje: 3.75 },
  { id: '2', embalaje: '12 X 125 GRS', pesoNetoEmbalaje: 1.5 },
  { id: '3', embalaje: '12 X 18 OZ (7 X7)', pesoNetoEmbalaje: 6.12 },
  { id: '4', embalaje: '12 X 200 GRS', pesoNetoEmbalaje: 2.4 },
  { id: '5', embalaje: '12 X 250 GRS', pesoNetoEmbalaje: 3.0 },
  { id: '6', embalaje: '12 X 300 GRS', pesoNetoEmbalaje: 3.6 },
  { id: '7', embalaje: '12 X 500', pesoNetoEmbalaje: 6.0 },
  { id: '8', embalaje: '12 X 6 OZ', pesoNetoEmbalaje: 2.04 },
  { id: '9', embalaje: '18 X 150 GRS', pesoNetoEmbalaje: 2.7 },
  { id: '10', embalaje: '28 X 200 GRS', pesoNetoEmbalaje: 5.6 },
  { id: '11', embalaje: '3 KG GRANEL', pesoNetoEmbalaje: 3.0 },
  { id: '12', embalaje: '3,6 KG GRANEL', pesoNetoEmbalaje: 3.6 },
  { id: '13', embalaje: '42 X125 GRS', pesoNetoEmbalaje: 5.25 },
  { id: '14', embalaje: '42 X 150 GRS', pesoNetoEmbalaje: 6.3 },
  { id: '15', embalaje: '8 X 18 OZ (7X5)', pesoNetoEmbalaje: 4.08 },
];

export const CalculadoraProcesosView: React.FC = () => {
  const [deshidratacion, setDeshidratacion] = useState<number>(1.057);
  
  // Estados del Simulador e Input de Embalaje Seleccionado
  const [kilosDisponibles, setKilosDisponibles] = useState<number | ''>('');
  const [pesoTotem, setPesoTotem] = useState<number | ''>('');
  const [selectedEmbalajeId, setSelectedEmbalajeId] = useState<string>('');

  // Cálculos seguros
  const numKilos = typeof kilosDisponibles === 'number' ? kilosDisponibles : 0;
  const numPesoTotem = typeof pesoTotem === 'number' ? pesoTotem : 0;
  const bandejasTotemCalc = numPesoTotem > 0 ? numKilos / numPesoTotem : 0;

  // Encontrar el embalaje seleccionado por el usuario
  const embalajeSeleccionado = INITIAL_DATA.find((item) => item.id === selectedEmbalajeId);

  // Cálculo de cajas estimadas para el embalaje seleccionado
  const divisorSim = embalajeSeleccionado ? embalajeSeleccionado.pesoNetoEmbalaje * deshidratacion : 0;
  const cajasSimuladas = divisorSim > 0 && numKilos > 0 ? numKilos / divisorSim : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-emerald-600" />
            Módulo de Cálculo y Simulador de Procesos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Selecciona un embalaje específico para consultar su rendimiento (Deshidratación: {deshidratacion}).
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
              className="mt-1 w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* PANEL 1: Simulador por Kilos Disponibles y Tótems */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-wider">
          <Scale className="w-5 h-5" />
          1. Ingrese Kilos y Formato de Tótem / Bandeja Base
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-medium">
              Kilos Disponibles (Ej. 680 KG)
            </label>
            <input
              type="number"
              value={kilosDisponibles}
              onChange={(e) => setKilosDisponibles(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="Ingrese kilos..."
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-lg font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-medium">
              Peso del Tótem / Bandeja Base (KG)
            </label>
            <input
              type="number"
              step="0.1"
              value={pesoTotem}
              onChange={(e) => setPesoTotem(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="Ingrese peso..."
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-lg font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="bg-white/10 border border-white/15 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-300 uppercase font-medium">Tótems Necesarios</p>
              <h3 className="text-2xl font-black text-emerald-300">
                {numPesoTotem > 0 ? bandejasTotemCalc.toLocaleString('es-CL', { maximumFractionDigits: 1 }) : '0'} <span className="text-sm font-normal text-slate-300">unds</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL 2: Selector de Embalaje Específico */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm uppercase tracking-wider">
          <PackageCheck className="w-5 h-5 text-emerald-600" />
          2. Seleccione el Embalaje a Revisar
        </div>

        <div className="relative">
          <select
            value={selectedEmbalajeId}
            onChange={(e) => setSelectedEmbalajeId(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 cursor-pointer"
          >
            <option value="">-- Seleccione un tipo de embalaje de la lista --</option>
            {INITIAL_DATA.map((item) => (
              <option key={item.id} value={item.id}>
                {item.embalaje} (Peso Neto: {item.pesoNetoEmbalaje} KG)
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
        </div>

        {/* Tarjeta de Resultado Individual */}
        {embalajeSeleccionado ? (
          <div className="mt-6 p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                Formato Seleccionado
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">{embalajeSeleccionado.embalaje}</h3>
              <p className="text-sm text-slate-600">
                Peso Neto del Embalaje: <strong className="text-slate-800">{embalajeSeleccionado.pesoNetoEmbalaje} KG</strong>
              </p>
            </div>

            <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-emerald-100 text-center min-w-[220px]">
              <p className="text-xs font-semibold text-slate-500 uppercase">Cajas Estimadas a Obtener</p>
              <h2 className="text-3xl font-black text-emerald-600 mt-1">
                {numKilos > 0 ? (
                  <>
                    {cajasSimuladas.toLocaleString('es-CL', { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-600">cajas</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400 font-normal">Ingrese kilos arriba</span>
                )}
              </h2>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
            Seleccione un embalaje arriba para ver el cálculo detallado de cajas.
          </div>
        )}
      </div>
    </div>
  );
};
