import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import DetallesRifa from './components/DetallesRifa'; 
import DashboardAdmin from './components/DashboardAdmin'; 
import LoginAdmin from './components/LoginAdmin';
import ConsultaTickets from './components/ConsultaTickets';

function App() {
  const [isLogged, setIsLogged] = useState(false);

  const fondoRifa = "/img/fondo de rifa.png"; 

  return (
    <Router>
      <div className="relative min-h-screen text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
        
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
        <div className="bg-black py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 relative z-50 border-b border-slate-800">
          🔒 Verifica Conexión : ganaconjuvenil.com
        </div>

        {/* --- NAVEGACIÓN OSCURA (AJUSTADA: LOGO FLOTANTE) --- */}
        <nav className="bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-800 px-4 flex justify-between items-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] h-16">
          
          {/* CONTENEDOR RELATIVO PARA EL LOGO */}
          <div className="flex items-center relative">
            <Link to="/" className="flex items-center group">
              {/* LOGO CON POSICIÓN ABSOLUTA Y ROTACIÓN IZQUIERDA */}
              <img 
                src="/img/LOGO.png" 
                alt="Logo" 
                className="absolute left-10 w-20 h-20 object-contain filter drop-shadow-[0_0_15px_rgba(37,99,235,0.6)] -rotate-25 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-300 z-[60] max-w-none"
                style={{ top: '-18px' }} 
                />
              
              {/* TEXTO CON MARGEN IZQUIERDO: Para compensar el logo absoluto */}
              <span className="text-2xl font-black italic tracking-tighter text-white uppercase ml-28 leading-none">
                GANA CON <span className="text-blue-500">JUVENIL</span>
              </span>
            </Link>
          </div>
          
          <div className="flex gap-2">
            <Link 
              to="/mis-tickets" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-900/40 active:scale-95"
            >
              Mis Tickets 🎟️
            </Link>
          </div>
        </nav>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <main className="relative z-10 container mx-auto px-4 py-8">
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

        {/* --- FOOTER ELEGANTE OSCURO --- */}
        <footer className="py-20 text-center relative z-10">
          <div className="h-[1px] w-24 bg-blue-600/30 mx-auto mb-8"></div>
          <Link to="/mis-tickets" className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] hover:text-blue-400 transition-colors">
            - Verificar Estado de Mis Boletos -
          </Link>
          <p className="text-[9px] text-slate-600 mt-6 font-bold uppercase tracking-widest">
            © 2026 Gana con Juvenil • Sistema de Sorteos Premium
          </p>
        </footer>

      </div>
    </Router>
  );
}

export default App;