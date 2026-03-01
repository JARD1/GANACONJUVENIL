import React from 'react';
import { Link } from 'react-router-dom';
import { listaRifas } from '../data/rifas';
import Podio from './Podio'; 

export default function Home() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center">
      
      {/* --- HERO SECTION --- */}
      <div className="w-full max-w-5xl mx-auto px-4 pt-8 md:pt-12 pb-8 md:pb-16 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-20 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none"></div>
        <h1 className="relative text-3xl md:text-5xl lg:text-6xl font-black text-slate-100 uppercase italic tracking-tighter leading-none mb-4 animate-in slide-in-from-bottom-4 duration-700">
          SORTEOS <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(37,99,235,0.8)]">DISPONIBLES</span>
        </h1>
        <div className="relative h-1 w-12 md:w-24 bg-blue-600 mx-auto rounded-full mb-4 shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-in zoom-in duration-1000"></div>
        <p className="relative text-slate-400 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em] animate-in fade-in duration-1000 delay-300">
          • Participa • Gana • Disfruta •
        </p>
      </div>

      {/* --- GRID DE TARJETAS --- */}
      <div className="w-full max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          
          {listaRifas.map((rifa, index) => {
            const isFinalizada = rifa.estado === "finalizada";

            return (
              <div key={rifa.id} className="flex flex-col gap-1.5 h-full">
                
                {/* PODIO */}
                <Podio rifaId={rifa.id} />

                {/* LA TARJETA */}
                <div 
                  className={`group relative bg-slate-900/80 backdrop-blur-xl rounded-[1.75rem] overflow-hidden shadow-2xl transition-all duration-500 border flex flex-col h-full ${
                    isFinalizada ? 'border-red-900/30 hover:border-red-500/30' : 'border-slate-700/50 hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:-translate-y-1.5'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }} 
                >
                  
                  {/* Contenedor de Imagen adaptado para Flyers Verticales */}
                  <div className="relative h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden shrink-0">
                    <img 
                      src={rifa.imagen} 
                      alt={rifa.nombre} 
                      className={`w-full h-full object-cover object-center transition-transform duration-700 ${
                        isFinalizada ? 'grayscale opacity-50' : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'
                      }`}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-80" />

                    {/* PRECIO FLOTANTE */}
                    <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-slate-950/90 backdrop-blur-sm text-white px-3 py-1.5 md:px-4 md:py-1.5 rounded-xl font-black text-base md:text-lg shadow-xl border border-blue-500/30">
                      <span className="text-blue-500 text-xs mr-1">$</span>
                      {rifa.precioBoleto.toFixed(2)}
                    </div>

                    {/* ETIQUETA ESTADO */}
                    {isFinalizada ? (
                      <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-red-600 text-white px-2 py-1 md:px-2.5 md:py-1 rounded-md text-[8px] font-black uppercase tracking-widest shadow-lg shadow-red-900/50">
                        🔴 Finalizada
                      </div>
                    ) : (
                      <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-blue-600 text-white px-2 py-1 md:px-2.5 md:py-1 rounded-md text-[8px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-blue-900/50">
                        🟢 En Vivo
                      </div>
                    )}
                  </div>

                  {/* Contenido de la Tarjeta */}
                  <div className="p-5 flex flex-col flex-grow relative z-10">
                    {/* Título */}
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase italic leading-tight mb-2">
                      {rifa.nombre}
                    </h2>
                    
                    {/* 👇 DESCRIPCIÓN CORREGIDA: Sin límite de líneas y con saltos de línea (whitespace-pre-line) 👇 */}
                    <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed mb-5 whitespace-pre-line">
                      {rifa.descripcion}
                    </p>
                    {/* 👆 FIN DESCRIPCIÓN CORREGIDA 👆 */}
                    
                    <div className="w-full bg-slate-800 h-1 rounded-full mb-5 overflow-hidden mt-auto">
                        <div className={`h-full w-3/4 rounded-full ${isFinalizada ? 'bg-red-600' : 'bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.8)]'}`}></div>
                    </div>

                    <div className="space-y-2.5">
                      <Link 
                        to={`/participar/${rifa.id}`} 
                        className={`relative overflow-hidden block w-full text-center py-3 md:py-3.5 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] transition-all border ${
                          isFinalizada 
                          ? 'bg-slate-900 text-slate-500 border-slate-700 hover:bg-slate-800' 
                          : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 border-transparent hover:border-blue-300/50'
                        }`}
                      >
                        {isFinalizada ? 'SORTEO CERRADO 🔒' : 'COMPRAR BOLETOS 🎟️'}
                      </Link>
                      
                      <div className="flex justify-between items-center px-1.5 opacity-60">
                          <span className="text-[7px] text-slate-500 font-bold uppercase">{isFinalizada ? 'Sorteo Concluido' : 'Sorteo Verificado'}</span>
                          <span className="text-[7px] text-blue-400 font-bold uppercase tracking-widest">ID: {rifa.id.slice(0,8)}</span>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            );
          })}

          {/* TARJETA "PRÓXIMAMENTE" */}
          <div className="group relative bg-slate-950/30 backdrop-blur-sm rounded-[1.75rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-8 min-h-[320px] h-full text-center opacity-50 hover:opacity-100 transition-opacity cursor-default">
             <div className="text-5xl mb-3 grayscale group-hover:grayscale-0 transition-all">🚀</div>
             <h3 className="text-xl font-black text-slate-600 uppercase italic mb-1">¿Qué sigue?</h3>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pronto nuevos premios</p>
          </div>

        </div>
      </div>
    </div>
  );
}