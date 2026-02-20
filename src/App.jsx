import React, { useState } from 'react'; // Combinado en una sola línea
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import DetallesRifa from './components/DetallesRifa';
import DashboardAdmin from './components/DashboardAdmin'; 
import LoginAdmin from './components/LoginAdmin';

function App() {
  // Estado para controlar si el jefe ya puso la clave correcta
  const [isLogged, setIsLogged] = useState(false);

  const procesarReportePago = async (datos) => {
    console.log("Datos recibidos para el Dashboard:", datos);
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#f1f5f9]">
        {/* Banner de seguridad corporativo */}
        <div className="bg-yellow-400 py-2 text-center text-xs font-bold uppercase text-black">
          ⚠️ Verifica la URL: ganaconjuvenil.com
        </div>

        <Routes>
          {/* RUTA PÚBLICA: Home */}
          <Route path="/" element={<Home />} />
          
          {/* RUTA PÚBLICA: Detalles de Rifa */}
          <Route 
            path="/participar/:id" 
            element={<DetallesRifa alEnviar={procesarReportePago} />} 
          />

          {/* RUTA PROTEGIDA: Admin */}
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
      </div>
    </Router>
  );
}

export default App;