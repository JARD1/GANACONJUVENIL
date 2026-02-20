import React, { useState } from 'react';

export default function LoginAdmin({ onLogin }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí defines la clave temporal para tu jefe
    if (clave === "2026") { 
      onLogin(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 uppercase italic">Acceso Admin</h2>
          <p className="text-slate-500 font-medium">Introduce el código de seguridad</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="••••"
            className={`w-full text-center text-3xl tracking-[1em] p-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all ${
              error ? 'border-red-500 shake' : 'border-slate-100 focus:border-blue-500'
            }`}
          />
          
          {error && <p className="text-red-500 text-xs font-black uppercase">Código Incorrecto</p>}

          <button
            type="submit"
            className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
          >
            Entrar al Panel
          </button>
        </form>
      </div>
    </div>
  );
}