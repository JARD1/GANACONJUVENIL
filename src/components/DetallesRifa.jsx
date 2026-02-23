import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { listaRifas } from '../data/rifas';
import ProcesoPago from './ProcesoPago';

export default function DetallesRifa() {
  const { id } = useParams();
  
  const [tasaBCV, setTasaBCV] = useState(null);
  const [errorTasa, setErrorTasa] = useState(false);
  const [mostrarTerminos, setMostrarTerminos] = useState(true);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  useEffect(() => {
    fetch('https://ve.dolarapi.com/v1/dolares/oficial')
      .then(response => {
        if (!response.ok) throw new Error("Error al conectar con la API");
        return response.json();
      })
      .then(data => {
        if (data && data.promedio) {
          setTasaBCV(data.promedio);
        } else {
          setErrorTasa(true);
        }
      })
      .catch(err => {
        console.error("Fallo en la tasa:", err);
        setErrorTasa(true);
      });
  }, []);

  const rifa = listaRifas.find(r => r.id === id);

  if (!rifa) {
    return (
      <div className="text-center py-20 text-white">
        <h2 className="text-3xl font-black uppercase italic">Rifa no encontrada</h2>
        <p className="text-slate-500 mt-2">El producto solicitado no existe o ha sido eliminado.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen selection:bg-blue-500 selection:text-white">
      
      {/* --- MODAL DE TÉRMINOS Y CONDICIONES COMPACTO --- */}
{mostrarTerminos && (
  <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
    <div className="bg-slate-900 border border-slate-700/50 rounded-[2rem] max-w-sm w-full p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-3">
        {/* Icono reducido */}
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/10 text-blue-500 rounded-full text-2xl mb-1 shadow-inner">
          📜
        </div>
        
        {/* Título reducido */}
        <h2 className="text-xl font-black uppercase italic tracking-tighter text-white leading-none">
          TÉRMINOS Y <span className="text-blue-500">CONDICIONES</span>
        </h2>
        
        <div className="w-10 h-1 bg-blue-600 mx-auto rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
        
        {/* Lista de términos compacta */}
        <div className="text-left text-slate-400 text-[11px] space-y-2 max-h-40 overflow-y-auto pr-2 py-1 scrollbar-thin scrollbar-thumb-slate-800">
          <p className="bg-slate-800/50 p-2 rounded-lg border-l-2 border-blue-600 text-slate-200">
            <strong>1. Validación:</strong> Tarda de 1 a 12 horas hábiles.
          </p>
          <p><strong>2. Números:</strong> Asignados aleatoriamente tras verificar fondos.</p>
          <p><strong>3. Datos:</strong> Requiere captura legible con referencia visible.</p>
          <p><strong>4. Premios:</strong> Sujetos a las condiciones del evento.</p>
          <p><strong>5. Cambios:</strong> No se aceptan devoluciones tras el reporte.</p>
        </div>

        <div className="pt-4 space-y-3">
          <label className="flex items-center justify-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={aceptoTerminos}
              onChange={() => setAceptoTerminos(!aceptoTerminos)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer transition-transform group-hover:scale-110"
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-500 transition-colors">
              Acepto los términos
            </span>
          </label>

          <button
            disabled={!aceptoTerminos}
            onClick={() => setMostrarTerminos(false)}
            className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-lg ${
              aceptoTerminos 
              ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-blue-900/40' 
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            Continuar al Pago
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className={`max-w-6xl mx-auto p-4 py-10 transition-all duration-700 ${mostrarTerminos ? 'blur-2xl pointer-events-none' : 'blur-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLUMNA IZQUIERDA: Información de la Rifa */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/80 backdrop-blur-md rounded-[3rem] overflow-hidden shadow-2xl border border-slate-700/50 sticky top-28">
              <div className="relative">
                <img 
                  src={rifa.imagen} 
                  alt={rifa.nombre} 
                  className="w-full h-[450px] object-cover opacity-90" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute top-6 right-6 bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-xl shadow-2xl border border-blue-400/30">
                  <span className="text-blue-200 text-sm mr-1">$</span>{rifa.precioBoleto}
                </div>
              </div>
              <div className="p-10">
                <h1 className="text-4xl font-black text-white uppercase italic leading-tight mb-4">
                  {rifa.nombre}
                </h1>
                <div className="w-16 h-1.5 bg-blue-600 rounded-full mb-6 shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                <p className="text-slate-400 leading-relaxed text-lg font-medium">
                  {rifa.descripcion}
                </p>
                <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      <span>Sorteo Activo</span>
                   </div>
                   <span>ID: {rifa.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: El Motor de Pago */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-[3rem] p-1 border border-slate-800/50 shadow-2xl">
              <ProcesoPago 
                  rifaId={rifa.id} 
                  precioTicket={rifa.precioBoleto} 
                  tasaExterna={tasaBCV}
                  errorTasaExterna={errorTasa}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}