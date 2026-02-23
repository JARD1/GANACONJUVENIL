import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import DetallesRifa from './components/DetallesRifa'; 
import DashboardAdmin from './components/DashboardAdmin'; 
import LoginAdmin from './components/LoginAdmin';
import ConsultaTickets from './components/ConsultaTickets';

function App() {
  const [isLogged, setIsLogged] = useState(false);

  // Ruta a la imagen local en public/img/
  const fondoRifa = "/img/fondo de rifa.png"; 

  return (
    <Router>
      {/* Cambiamos text-slate-900 por text-slate-100 para que todo el texto base sea blanco/gris claro */}
      <div className="relative min-h-screen text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
        
        {/* --- CAPA 1: IMAGEN COLLAGE --- */}
        <div 
          className="fixed inset-0 z-[-1] pointer-events-none"
          style={{
            backgroundImage: `url('${fondoRifa}')`,
            backgroundRepeat: 'repeat',
            backgroundSize: '450px', 
            opacity: 0.12, // Reducimos un poco la opacidad para que se mezcle con el fondo oscuro
            imageRendering: 'auto'
          }}
        />

        {/* --- CAPA 2: FONDO OSCURO PROFUNDO (Sustituye a los grises claros) --- */}
        <div className="fixed inset-0 z-[-2] bg-slate-950" />
        
        {/* Capa de degradado extra para dar profundidad */}
        <div className="fixed inset-0 z-[-2] bg-gradient-to-b from-slate-900/50 via-slate-950 to-black" />

        {/* --- BANNER SUPERIOR DARK --- */}
        <div className="bg-black py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 relative z-50 border-b border-slate-800">
          🔒 Verifica Conexión : ganaconjuvenil.com
        </div>

        {/* --- NAVEGACIÓN OSCURA (Glassmorphism) --- */}
        <nav className="bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <Link to="/" className="text-2xl font-black italic tracking-tighter text-white">
            GANA CON <span className="text-blue-500">JUVENIL</span>
          </Link>
          
          <div className="flex gap-4">
            <Link 
              to="/mis-tickets" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-900/40 active:scale-95"
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