import React, { useState, useEffect } from 'react';
import { listaRifas } from '../data/rifas';

export default function RuletaGanador() {
  const [rifaSeleccionada, setRifaSeleccionada] = useState(listaRifas[0]?.id || "");
  const [numero, setNumero] = useState("0000");
  const [girando, setGirando] = useState(false);
  const [ganadorFinal, setGanadorFinal] = useState(false);

  const rifaActual = listaRifas.find(r => r.id === rifaSeleccionada);

  const girarRuleta = () => {
    if (!rifaActual || girando) return;
    
    setGirando(true);
    setGanadorFinal(false);

    // Efecto de sonido de tensión (Visualmente hablando)
    let iteraciones = 0;
    const maxIteraciones = 50; // Cantidad de saltos antes de parar
    
    // Intervalo que cambia el número muy rápido
    const intervalo = setInterval(() => {
      const randomTemp = Math.floor(Math.random() * rifaActual.maxTickets);
      setNumero(randomTemp.toString().padStart(4, '0'));
      iteraciones++;

      if (iteraciones >= maxIteraciones) {
        clearInterval(intervalo);
        
        // El número ganador final
        const ganadorReal = Math.floor(Math.random() * rifaActual.maxTickets);
        setNumero(ganadorReal.toString().padStart(4, '0'));
        setGirando(false);
        setGanadorFinal(true);
      }
    }, 80); // Cambia cada 80 milisegundos (súper rápido)
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      
      {/* HEADER DE LA RULETA */}
      <div className="text-center mb-10 animate-in fade-in slide-in-from-top-10 duration-700">
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-2">
          Sorteo <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(37,99,235,0.8)]">Oficial</span>
        </h1>
        <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"></div>
      </div>

      {/* SELECTOR DE RIFA */}
      <div className="mb-12 w-full max-w-md animate-in fade-in duration-1000">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2 text-center">Selecciona la Rifa a Sortear</label>
        <select 
          value={rifaSeleccionada} 
          onChange={(e) => {
            setRifaSeleccionada(e.target.value);
            setGanadorFinal(false);
            setNumero("0000");
          }}
          disabled={girando}
          className="w-full p-4 bg-slate-900/80 border border-slate-700 rounded-2xl font-black text-slate-200 outline-none focus:border-blue-500 text-center uppercase tracking-widest backdrop-blur-md shadow-xl"
        >
          {listaRifas.map(rifa => (
            <option key={rifa.id} value={rifa.id}>{rifa.nombre} (Máx: {rifa.maxTickets})</option>
          ))}
        </select>
      </div>

      {/* LA PANTALLA DE LA RULETA */}
      <div className={`relative w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border-2 rounded-[3rem] p-10 md:p-16 flex flex-col items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden ${
        ganadorFinal ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)] scale-105' : 
        girando ? 'border-blue-500 shadow-[0_0_50px_rgba(37,99,235,0.4)]' : 'border-slate-800'
      }`}>
        
        {/* Decoraciones de fondo */}
        {ganadorFinal && <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none"></div>}
        {girando && <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>}

        <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-slate-500 mb-6 relative z-10">
          {ganadorFinal ? '🎉 ¡TICKET GANADOR! 🎉' : girando ? 'Buscando ganador...' : 'Esperando para girar'}
        </p>

        {/* EL NÚMERO */}
        <div className={`text-7xl md:text-9xl font-black tracking-widest relative z-10 font-mono transition-colors duration-300 ${
          ganadorFinal ? 'text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]' : 
          girando ? 'text-white blur-[1px]' : 'text-slate-700'
        }`}>
          {numero}
        </div>

      </div>

      {/* BOTÓN DE ACCIÓN */}
      <div className="mt-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
        <button 
          onClick={girarRuleta} 
          disabled={girando}
          className={`px-12 py-5 rounded-2xl font-black uppercase text-sm md:text-base tracking-[0.2em] transition-all shadow-2xl border ${
            girando 
            ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 border-blue-400/50 shadow-blue-900/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]'
          }`}
        >
          {girando ? 'GIRANDO...' : '🎰 INICIAR RULETA'}
        </button>
      </div>

    </div>
  );
}