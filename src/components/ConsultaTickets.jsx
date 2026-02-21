import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";

export default function ConsultaTickets() {
  const [whatsapp, setWhatsapp] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  const consultar = async (e) => {
    e.preventDefault();
    setBuscando(true);
    setError("");
    setResultados([]);

    // Aplicamos la misma limpieza que en el registro
    let numLimpio = whatsapp.replace(/\D/g, '');
    if (numLimpio.startsWith('0')) numLimpio = numLimpio.substring(1);
    if (!numLimpio.startsWith('58')) numLimpio = '58' + numLimpio;

    try {
      const q = query(
        collection(db, "pagos"),
        where("whatsapp", "==", numLimpio),
        where("estado", "==", "aprobado")
      );

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => doc.data());

      if (docs.length === 0) {
        setError("No se encontraron tickets aprobados para este número.");
      } else {
        setResultados(docs);
      }
    } catch (err) {
      setError("Hubo un error al consultar. Intenta de nuevo.");
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="max-w-md w-full space-y-8 mt-10">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Mis Tickets</h1>
          <p className="text-slate-500 font-bold text-xs uppercase mt-2">Consulta tus números asignados</p>
        </div>

        <form onSubmit={consultar} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tu WhatsApp</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-bold text-slate-400 border-r-2 border-slate-200 pr-3">+58</span>
              <input 
                type="tel" 
                placeholder="0412 123 4567"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-4 pl-16 bg-slate-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={buscando}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest text-sm"
          >
            {buscando ? "Buscando..." : "Consultar Números"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center font-bold text-sm border border-red-100 animate-shake">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {resultados.map((pago, index) => (
            <div key={index} className="bg-white p-6 rounded-[2rem] shadow-md border-l-8 border-l-green-500">
              <p className="text-[10px] font-black text-slate-400 uppercase">{pago.rifaId}</p>
              <h3 className="font-bold text-slate-800 text-lg uppercase leading-tight mt-1">¡Hola, {pago.nombreCliente}!</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {pago.ticketsAsignados?.map(num => (
                  <span key={num} className="bg-slate-900 text-blue-400 px-3 py-1 rounded-lg font-mono font-black text-lg">
                    {num}
                  </span>
                ))}
              </div>
                <p className="text-xs text-slate-500 mt-4">Gracias por participar. ¡Mucha suerte!</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}