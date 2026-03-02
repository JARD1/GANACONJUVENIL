import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import DetallesRifa from './components/DetallesRifa'; 
import DashboardAdmin from './components/DashboardAdmin'; 
import LoginAdmin from './components/LoginAdmin';
import ConsultaTickets from './components/ConsultaTickets';

import { sincronizarInventario } from './services/syncRifas';

// =========================================================================
// 🚧 EL INTERRUPTOR MÁGICO DE MANTENIMIENTO
// Si en tu archivo .env o en Vercel pones VITE_MODO_MANTENIMIENTO=true, la página se tumba para el público.
// =========================================================================
const MODO_MANTENIMIENTO = import.meta.env.VITE_MODO_MANTENIMIENTO === 'false';

const PantallaMantenimiento = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-700">
    <div className="text-6xl mb-6 animate-bounce">🚧</div>
    <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
      Mantenimiento <span className="text-blue-500">Programado</span>
    </h1>
    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm max-w-md mx-auto leading-relaxed">
      Estamos realizando una limpieza y optimización en nuestra base de datos para garantizar la total seguridad del sorteo. Volvemos en breves minutos.
    </p>
  </div>
);
// =========================================================================

function App() {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    sincronizarInventario();
  }, []);

  const fondoRifa = "/img/fondo de rifa.png"; 
  
  // 🟢 NÚMERO DE SOPORTE WHATSAPP (Cámbialo por el tuyo)
  const numeroSoporte = "584241855037"; 
  const mensajeSoporte = "Hola, necesito ayuda con la plataforma de Gana con Juvenil.";

  return (
    <Router>
      <div className="relative min-h-screen text-slate-100 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
        
        {/* --- CAPA 1: IMAGEN COLLAGE --- */}
        <div 
          className="fixed inset-0 z-[-1] pointer-events-none"
          style={{
            backgroundImage: `url('${fondoRifa}')`,
            backgroundRepeat: 'repeat',
            backgroundSize: '450px', 
            opacity: 0.12, 
            imageRendering: 'auto'
          }}
        />

        {/* --- CAPA 2: FONDO OSCURO PROFUNDO --- */}
        <div className="fixed inset-0 z-[-2] bg-slate-950" />
        <div className="fixed inset-0 z-[-2] bg-gradient-to-b from-slate-900/50 via-slate-950 to-black" />

        {/* --- BANNER SUPERIOR DARK --- */}
        <div className="bg-black py-1.5 md:py-2 text-center text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 relative z-50 border-b border-slate-800">
          🔒 Verifica Conexión : ganaconjuvenil.com
        </div>

        {/* --- NAVEGACIÓN RESPONSIVA CON LOGO CORONA DE FUEGO --- */}
        <nav className="bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-800 px-3 md:px-6 flex justify-between items-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] h-14 md:h-20 overflow-visible">
          
          <div className="flex items-center relative h-full">
            <Link to="/" className="flex items-center group relative pl-2 h-full">
              <img 
                src="/img/LOGO.png" 
                alt="Logo Gana con Juvenil" 
                className="absolute left-[-10px] md:left-[-5px] w-16 h-16 md:w-24 md:h-24 object-contain 
                  filter drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] md:drop-shadow-[0_0_20px_rgba(249,115,22,0.9)] 
                  -rotate-6 md:-rotate-12 group-hover:rotate-0 group-hover:scale-105 transition-transform duration-300 z-[60] 
                  max-w-none top-[-10px] md:top-[-18px]"
              />
              <span className="text-base md:text-2xl font-black italic tracking-tighter text-white uppercase ml-12 md:ml-20 leading-none whitespace-nowrap relative z-50">
                GANA CON <span className="text-blue-500">JUVENIL</span>
              </span>
            </Link>
          </div>
          
          <div className="flex gap-2">
            <Link 
              to="/mis-tickets" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-900/40 active:scale-95 whitespace-nowrap flex items-center gap-1.5 border border-blue-500/50"
            >
              Mis Tickets <span className="text-xs md:text-sm">🎟️</span>
            </Link>
          </div>
        </nav>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <main className="relative z-10 w-full max-w-7xl mx-auto px-4 py-6 md:py-10 flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={MODO_MANTENIMIENTO ? <PantallaMantenimiento /> : <Home />} />
            <Route path="/participar/:id" element={MODO_MANTENIMIENTO ? <PantallaMantenimiento /> : <DetallesRifa />} />
            <Route path="/mis-tickets" element={MODO_MANTENIMIENTO ? <PantallaMantenimiento /> : <ConsultaTickets />} />
            

            <Route path="/admin" element={isLogged ? <DashboardAdmin /> : <LoginAdmin onLogin={setIsLogged} />} />
          </Routes>
        </main>

        {/* --- FOOTER SÚPER COMPACTO Y FUNCIONAL --- */}
        <footer className="py-4 text-center relative z-10 mt-auto border-t border-slate-900 bg-slate-950/90 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center gap-3">
            
            <div className="flex gap-4 md:gap-8 items-center justify-center">
              <Link to="/mis-tickets" className="text-slate-500 font-black text-[9px] uppercase tracking-widest hover:text-blue-400 transition-colors">
                🎟️ Verificar Boletos
              </Link>
              
              {/* BOTÓN WHATSAPP DE SOPORTE */}
              <a 
                href={`https://wa.me/${numeroSoporte}?text=${encodeURIComponent(mensajeSoporte)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-500 font-black text-[9px] uppercase tracking-widest hover:text-green-400 transition-colors flex items-center gap-1"
              >
                💬 Contactar Soporte
              </a>
            </div>

            <div className="h-px w-24 bg-slate-800"></div>

            <div className="flex flex-col items-center">
              <p className="text-[7px] text-slate-600 font-bold uppercase tracking-widest">
                © 2026 Gana con Juvenil • Sistema de Sorteos
              </p>
            </div>
          </div>
        </footer>

      </div>
    </Router>
  );
}

export default App;