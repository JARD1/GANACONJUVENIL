import React from 'react';

/**
 * COMPONENTE: SelectorCantidad
 * Propiedades (Props):
 * @param {number} cantidad - Estado actual de la cantidad de boletos.
 * @param {function} setCantidad - Función para actualizar el estado.
 * @param {number} precio - Precio individual en USD.
 * @param {number|null} tasaBCV - Tasa de cambio (puede ser null mientras carga).
 * @param {boolean} errorTasa - Indica si hubo un fallo al obtener la tasa.
 */
export default function SelectorCantidad({ cantidad, setCantidad, precio, tasaBCV, errorTasa }) {
  
  // Opciones predefinidas para compra rápida
  const opcionesRapidas = [1, 5, 10, 20, 50, 100];

  const manejarInputManual = (e) => {
    const valor = e.target.value;
    if (valor === "") {
      setCantidad("");
      return;
    }
    const numero = parseInt(valor);
    if (numero >= 0) {
      setCantidad(numero);
    }
  };

  // Cálculos dinámicos
  const totalUSD = (Number(cantidad) || 0) * Number(precio);
  // Solo calculamos Bs si tenemos la tasa
  const totalBS = tasaBCV ? totalUSD * tasaBCV : 0;

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4 italic uppercase">
        1. Cantidad de boletos
      </h2>
      
      {/* SECCIÓN: BOTONES RÁPIDOS */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {opcionesRapidas.map((num) => (
          <button
            key={num}
            onClick={() => setCantidad(num)}
            className={`py-3 rounded-xl font-black transition-all duration-200 ${
              cantidad === num 
              ? 'bg-blue-600 text-white shadow-lg scale-105 border-2 border-blue-400' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            +{num}
          </button>
        ))}
      </div>

      {/* SECCIÓN: CONTADOR MANUAL PERSONALIZADO */}
      <div className="mb-6">
        <label className="text-[10px] text-gray-400 uppercase font-black ml-1 tracking-widest">
          O escribe la cantidad exacta:
        </label>
        <div className="relative mt-1">
          <input 
            type="number"
            value={cantidad}
            onChange={manejarInputManual}
            placeholder="0"
            className="w-full p-4 bg-slate-50 border-2 border-dashed border-gray-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white text-center font-black text-2xl transition-all"
          />
        </div>
      </div>
      
      {/* SECCIÓN: CONVERTIDOR Y TOTALES */}
      <div className="space-y-3">
        
        {/* Cuadro Total Dólares */}
        <div className="flex justify-between items-center p-5 bg-slate-900 rounded-2xl text-white shadow-inner">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold opacity-60">Total a pagar</span>
            <span className="font-medium">Monto en Divisas:</span>
          </div>
          <span className="text-3xl font-black text-blue-400">
            ${totalUSD.toFixed(2)}
          </span>
        </div>

        {/* Cuadro Total Bolívares con VALIDACIÓN para evitar error toFixed */}
        <div className="flex justify-between items-center p-5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200 border-b-4 border-blue-800 min-h-[80px]">
          {errorTasa ? (
            /* Mostrar error si la API falló */
            <div className="text-center w-full font-bold text-sm text-red-200">
              ⚠️ Error al obtener tasa BCV
            </div>
          ) : !tasaBCV ? (
            /* Mostrar carga mientras tasaBCV sea null */
            <div className="text-center w-full font-medium text-sm animate-pulse">
              Consultando tasa oficial...
            </div>
          ) : (
            /* Mostrar datos cuando la tasa esté lista */
            <>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold opacity-80 italic">Referencia BCV</span>
                <span className="text-[10px]">Tasa: {tasaBCV.toFixed(2)} Bs/$</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase opacity-80">Monto en Bs.</span>
                <span className="text-2xl font-black">
                  {totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}
        </div>

      </div>

      <p className="text-[9px] text-center text-gray-400 mt-4 italic uppercase tracking-tighter">
        * El monto en Bs. es referencial basado en la tasa oficial del día.
      </p>
    </div>
  );
}