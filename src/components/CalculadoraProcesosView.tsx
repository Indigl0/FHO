import React, { useState } from 'react';

// 1. Diccionario con los datos del cuadro de embalaje
const cajasPorPalletMap: Record<string, number> = {
  "12 X 11 OZ (1 Pinta)": 204,
  "12 X 125 GRS": 375,
  "12 X 18 OZ (7 X7)": 115,
  "12 X 250 GRS": 204,
  "12 X 500": 115,
  "12 X 6 OZ": 324,
  "3 KG GRANEL": 324,
  "3,6 KG GRANEL": 272,
  "42 X 125 GRS": 90,
  "42 X 150 GRS": 90,
  "8 X 18 OZ (7X5)": 204,
};

export const CalculadoraProcesosView: React.FC = () => {
  // Asegúrate de usar tu estado actual de selección de embalaje
  const [selectedEmbalaje, setSelectedEmbalaje] = useState<string>('');

  // Obtener la cantidad de cajas por pallet según la selección actual
  const cajasPorPallet = selectedEmbalaje ? cajasPorPalletMap[selectedEmbalaje] : null;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Calculadora de Procesos</h2>
      
      {/* Selector de embalaje (ejemplo, reemplaza con tu select o botones actuales) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Seleccione Embalaje:
        </label>
        <select 
          className="w-full p-2 border border-slate-300 rounded-md"
          value={selectedEmbalaje}
          onChange={(e) => setSelectedEmbalaje(e.target.value)}
        >
          <option value="">-- Seleccione un embalaje --</option>
          {Object.keys(cajasPorPalletMap).map((embalaje) => (
            <option key={embalaje} value={embalaje}>
              {embalaje}
            </option>
          ))}
        </select>
      </div>

      {/* Visualización del cálculo y la información de cajas por pallet */}
      {selectedEmbalaje ? (
        <div className="space-y-4">
          {/* Indicador de cajas por pallet solicitado */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium flex items-center justify-between">
            <span>📦 Cajas por pallet para <strong>{selectedEmbalaje}</strong>:</span>
            <span className="text-lg font-bold">
              {cajasPorPallet ? `${cajasPorPallet} cajas` : 'No especificado en cuadro'}
            </span>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="text-sm sm:text-base font-semibold text-slate-700">
              Cálculo detallado de cajas
            </h3>
            <span className="text-xs sm:text-sm text-slate-400 font-normal">
              Ingrese kilos a procesar...
            </span>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg">
          Seleccione un embalaje arriba para ver el cálculo detallado de cajas.
        </div>
      )}
    </div>
  );
};
