import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import DetallesRifa from './components/DetallesRifa'; 
import DashboardAdmin from './components/DashboardAdmin'; 
import LoginAdmin from './components/LoginAdmin';
import ConsultaTickets from './components/ConsultaTickets';

import { sincronizarInventario } from './services/syncRifas';

function App() {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    sincronizarInventario();
  }, []);

  const fondoRifa = "/img/fondo de rifa.png"; 

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
        <div className="bg-black py-2 text-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 relative z-50 border-b border-slate-800">
          🔒 Verifica Conexión : ganaconjuvenil.com
        </div>

        {/* --- NAVEGACIÓN RESPONSIVA CON LOGO SUPERPUESTO --- */}
        {/* Añadí overflow-visible para asegurar que el logo flotante no se corte */}
        <nav className="bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-800 px-3 md:px-6 flex justify-between items-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] h-16 md:h-20 overflow-visible">
          
          <div className="flex items-center relative">
            <Link to="/" className="flex items-center group relative pl-2"> {/* Añadí un pequeño pl-2 para separarlo mínimamente del borde de la pantalla */}
              
              {/* LOGO SUPERPUESTO (OVERLAP) */}
              <img 
                src="/img/LOGO.png" 
                alt="Logo" 
                // AJUSTES CLAVE AQUÍ:
                // 1. Más grande: w-16 h-16 (móvil), w-24 h-24 (PC)
                // 2. Más a la izquierda: left-[-10px] (móvil), md:left-[-5px] (PC) para que 'muerda' el borde.
                // 3. Más arriba: top-[-12px] / top-[-22px] para flotar más.
                // 4. z-[60] asegura que esté ENCIMA del texto.
                className="absolute left-[-10px] md:left-[-5px] w-16 h-16 md:w-24 md:h-24 object-contain filter drop-shadow-[0_0_10px_rgba(37,99,235,0.6)] md:drop-shadow-[0_0_15px_rgba(37,99,235,0.6)] -rotate-12 md:-rotate-25 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-300 z-[60] max-w-none top-[-12px] md:top-[-22px]"
              />
              
              {/* TEXTO MOVIDO A LA IZQUIERDA (DEBAJO DEL LOGO) */}
              {/* AJUSTE CLAVE AQUÍ: Reduje drásticamente el margen izquierdo (ml-10 md:ml-16).
                  Antes era ml-16/ml-32. Ahora el texto empieza 'debajo' del logo. */}
              <span className="text-lg md:text-2xl font-black italic tracking-tighter text-white uppercase ml-10 md:ml-16 leading-none whitespace-nowrap relative z-50">
                GANA CON <span className="text-blue-500">JUVENIL</span>
              </span>
            </Link>
          </div>
          
          <div className="flex gap-2">
            <Link 
              to="/mis-tickets" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 md:px-5 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-900/40 active:scale-95 whitespace-nowrap flex items-center gap-1.5"
            >
              Mis Tickets <span className="text-xs md:text-sm">🎟️</span>
            </Link>
          </div>
        </nav>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <main className="relative z-10 w-full max-w-7xl mx-auto px-4 py-6 md:py-10 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/participar/:id" element={<DetallesRifa />} />
            <Route path="/mis-tickets" element={<ConsultaTickets />} />
            <Route 
              path="/admin" 
              element={
                isLogged ? (
                  <DashboardAdmin />
                ) : (
                  <LoginAdmin onLogin={setIsLogged} />
                )
              } 
            />
          </Routes>
        </main>

        {/* --- FOOTER --- */}
        <footer className="py-12 md:py-20 text-center relative z-10 mt-auto border-t border-slate-900 bg-slate-950/50">
          <div className="h-[1px] w-16 md:w-24 bg-blue-600/30 mx-auto mb-6 md:mb-8"></div>
          
          <Link to="/mis-tickets" className="text-slate-500 font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] hover:text-blue-400 transition-colors px-4 block">
            - Verificar Estado de Mis Boletos -
          </Link>
          
          <div className="mt-6 md:mt-8 space-y-2">
            <p className="text-[7px] md:text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              © 2026 Gana con Juvenil • Sistema de Sorteos Premium
            </p>
            <p className="text-[6px] md:text-[8px] text-slate-700 font-bold uppercase tracking-widest">
              Desarrollado con tecnología segura
            </p>
          </div>
        </footer>

      </div>
    </Router>
  );
}

export default App;