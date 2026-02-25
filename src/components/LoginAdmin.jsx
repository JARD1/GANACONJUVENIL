import React, { useState } from 'react';

export default function LoginAdmin({ onLogin }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState(false);

  // Leer la contraseña desde el archivo .env
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Comparamos lo que escribe el usuario con la variable de entorno
    if (clave === ADMIN_PASSWORD) { 
      onLogin(true);
    } else {
      setError(true);
      setClave(""); // Limpiamos el input si se equivoca
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 relative z-10 w-full">
      
      {/* TARJETA GLASSMORPHISM */}
      <div className={`bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md border transition-all duration-300 relative overflow-hidden ${
        error ? 'border-red-500/50 shadow-red-900/20' : 'border-slate-700/50'
      }`}>
        
        {/* Decoración de fondo */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 text-center space-y-6">
          
          {/* HEADER DARK */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-950 text-blue-500 rounded-full text-4xl mb-2 shadow-inner border border-slate-800">
              {error ? '❌' : '🔒'}
            </div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
              Acceso <span className="text-blue-500">Admin</span>
            </h2>
            <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              Introduce el código de seguridad
            </p>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            
            <div className="relative">
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="••••"
                // NOTA: Eliminamos el maxLength={4} temporalmente por si tu contraseña nueva ("gana2026.") es más larga
                className={`w-full text-center text-4xl tracking-[0.2em] p-5 bg-slate-950/50 border-2 rounded-2xl outline-none font-black text-white transition-all shadow-inner ${
                  error 
                  ? 'border-red-500 focus:border-red-500 text-red-500 placeholder:text-red-900/50 animate-pulse' 
                  : 'border-slate-800 focus:border-blue-600 placeholder:text-slate-700'
                }`}
              />
            </div>
            
            {/* MENSAJE DE ERROR */}
            {error && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-center font-black text-[10px] uppercase tracking-widest border border-red-500/20 animate-in fade-in zoom-in">
                Código Incorrecto
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-900/40"
            >
              Entrar al Panel ⚡
            </button>
          </form>

          {/* FOOTER TEXT */}
          <div className="pt-4 border-t border-slate-800/50">
            <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em]">
              Área Restringida • Gana Con Juvenil
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}