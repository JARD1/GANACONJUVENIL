import React from 'react';
import { Link } from 'react-router-dom';
import { listaRifas } from '../data/rifas';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto p-6 relative z-10">
      {/* --- ENCABEZADO DARK --- */}
      <header className="mb-16 text-center">
        <h1 className="text-6xl font-black text-slate-100 uppercase italic tracking-tighter leading-none mb-4">
          SORTEOS <span className="text-blue-500">DISPONIBLES</span>
        </h1>
        <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full mb-4 shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">
          • Selecciona tu rifa y adquiere tus boletos para participar •
        </p>
      </header>

      {/* --- GRID DE TARJETAS DARK --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {listaRifas.map((rifa) => (
          <div 
            key={rifa.id} 
            className="group bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 border border-slate-700/50 flex flex-col"
          >
            {/* Contenedor de Imagen */}
            <div className="relative h-72 overflow-hidden">
              <img 
                src={rifa.imagen} 
                alt={rifa.nombre} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
              />
              
              {/* Overlay oscuro para la imagen */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

              {/* ETIQUETA DE PRECIO: Azul Neón sobre Negro */}
              <div className="absolute top-5 right-5 bg-slate-950 text-white px-5 py-2 rounded-2xl font-black text-xl shadow-2xl border border-blue-500/30">
                <span className="text-blue-500 text-sm mr-1">$</span>
                {rifa.precioBoleto.toFixed(2)}
              </div>

              {/* Status */}
              <div className="absolute bottom-5 left-5 bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse">
                🟢 EN VIVO
              </div>
            </div>

            {/* Contenido de la Tarjeta */}
            <div className="p-8 flex flex-col flex-grow">
              <h2 className="text-2xl font-black text-white uppercase italic leading-tight mb-3 group-hover:text-blue-400 transition-colors">
                {rifa.nombre}
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                {rifa.descripcion}
              </p>
              
              {/* Botón de acción con estilo Glow */}
              <div className="mt-auto">
                <Link 
                  to={`/participar/${rifa.id}`} 
                  className="relative overflow-hidden block w-full text-center bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95"
                >
                  ADQUIRIR BOLETOS
                </Link>
                
                <div className="flex justify-between items-center mt-4 px-2">
                   <span className="text-[8px] text-slate-500 font-bold uppercase">Gana Con Juvenil ™</span>
                   <span className="text-[8px] text-blue-500/50 font-bold uppercase tracking-widest">Premium Access</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}