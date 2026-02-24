import React from 'react';
import { Link } from 'react-router-dom';
import { listaRifas } from '../data/rifas';

export default function Home() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center">
      
      {/* --- HERO SECTION (ENCABEZADO) --- */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-8 md:pt-16 pb-12 md:pb-24 text-center relative">
        
        {/* Efecto de luz de fondo para el título */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-24 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>

        <h1 className="relative text-4xl md:text-6xl lg:text-7xl font-black text-slate-100 uppercase italic tracking-tighter leading-none mb-6 animate-in slide-in-from-bottom-4 duration-700">
          SORTEOS <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(37,99,235,0.8)]">DISPONIBLES</span>
        </h1>
        
        <div className="relative h-1.5 w-16 md:w-32 bg-blue-600 mx-auto rounded-full mb-6 shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-in zoom-in duration-1000"></div>
        
        <p className="relative text-slate-400 font-bold uppercase text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.5em] animate-in fade-in duration-1000 delay-300">
          • Participa • Gana • Disfruta •
        </p>
      </div>

      {/* --- GRID DE TARJETAS --- */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          
          {listaRifas.map((rifa, index) => (
            <div 
              key={rifa.id} 
              className="group relative bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 border border-slate-700/50 hover:border-blue-500/50 hover:shadow-[0_10px_40px_rgba(0,0,0,0.6)] hover:-translate-y-2 flex flex-col"
              style={{ animationDelay: `${index * 100}ms` }} // Efecto cascada al cargar
            >
              
              {/* Contenedor de Imagen */}
              <div className="relative h-64 md:h-80 overflow-hidden">
                <img 
                  src={rifa.imagen} 
                  alt={rifa.nombre} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                
                {/* Overlay degradado para legibilidad */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-80" />

                {/* PRECIO FLOTANTE */}
                <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-slate-950/90 backdrop-blur-sm text-white px-4 py-2 md:px-5 md:py-2 rounded-2xl font-black text-lg md:text-xl shadow-xl border border-blue-500/30 group-hover:border-blue-500 transition-colors">
                  <span className="text-blue-500 text-sm mr-1">$</span>
                  {rifa.precioBoleto.toFixed(2)}
                </div>

                {/* ETIQUETA 'EN VIVO' */}
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-blue-900/50">
                  🟢 En Vivo
                </div>
              </div>

              {/* Contenido de la Tarjeta */}
              <div className="p-6 md:p-8 flex flex-col flex-grow relative z-10">
                {/* Título */}
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic leading-tight mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {rifa.nombre}
                </h2>
                
                {/* Descripción corta */}
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6 md:mb-8 line-clamp-3">
                  {rifa.descripcion}
                </p>
                
                {/* Barra de Progreso Falsa (Estética) */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                   <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full w-3/4 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
                </div>

                {/* Botón de Acción */}
                <div className="mt-auto space-y-3">
                  <Link 
                    to={`/participar/${rifa.id}`} 
                    className="relative overflow-hidden block w-full text-center bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-[0.2em] transition-all hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-95 border border-transparent hover:border-blue-300/50"
                  >
                    COMPRAR BOLETOS 🎟️
                  </Link>
                  
                  <div className="flex justify-between items-center px-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="text-[7px] md:text-[8px] text-slate-500 font-bold uppercase">Sorteo Verificado</span>
                      <span className="text-[7px] md:text-[8px] text-blue-400 font-bold uppercase tracking-widest">ID: {rifa.id.slice(0,8)}...</span>
                  </div>
                </div>
              </div>
              
            </div>
          ))}

          {/* TARJETA "PRÓXIMAMENTE" (Relleno estético) */}
          <div className="group relative bg-slate-950/30 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-10 min-h-[400px] text-center opacity-50 hover:opacity-100 transition-opacity cursor-default">
             <div className="text-6xl mb-4 grayscale group-hover:grayscale-0 transition-all">🚀</div>
             <h3 className="text-2xl font-black text-slate-600 uppercase italic mb-2">¿Qué sigue?</h3>
             <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Pronto nuevos premios</p>
          </div>

        </div>
      </div>
    </div>
  );
}