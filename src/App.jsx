import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import DetallesRifa from './components/DetallesRifa'; 
import DashboardAdmin from './components/DashboardAdmin'; 
import LoginAdmin from './components/LoginAdmin';
import ConsultaTickets from './components/ConsultaTickets'; // <--- Importamos el nuevo componente

function App() {
  // Estado para la seguridad del Dashboard
  const [isLogged, setIsLogged] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-[#f1f5f9]">
        {/* Banner de seguridad corporativo */}
        <div className="bg-yellow-400 py-2 text-center text-xs font-bold uppercase text-black">
          ⚠️ Verifica la URL: ganaconjuvenil.com
        </div>

        {/* Pequeño menú de navegación para facilitar el acceso a consulta */}
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 px-6 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-black italic tracking-tighter text-slate-900">
            GANA CON <span className="text-blue-600">JUVENIL</span>
          </Link>
          <Link 
            to="/mis-tickets" 
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 transition-colors"
          >
            Mis Tickets 🎟️
          </Link>
        </nav>

        <Routes>
          {/* RUTA PÚBLICA: Home (Lista de rifas disponibles) */}
          <Route path="/" element={<Home />} />
          
          {/* RUTA PÚBLICA: Detalles de Rifa */}
          <Route 
            path="/participar/:id" 
            element={<DetallesRifa />} 
          />

          {/* NUEVA RUTA PÚBLICA: Consulta de Tickets */}
          <Route 
            path="/mis-tickets" 
            element={<ConsultaTickets />} 
          />

          {/* RUTA PROTEGIDA: Admin Dashboard */}
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

        {/* Footer simple con link rápido */}
        <footer className="py-10 text-center">
          <Link to="/mis-tickets" className="text-slate-400 font-bold text-[10px] uppercase hover:text-blue-500">
            ¿Ya compraste? Consulta tus números aquí
          </Link>
        </footer>
      </div>
    </Router>
  );
}

export default App;