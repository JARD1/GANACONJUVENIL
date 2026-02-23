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
    <div className="min-h-screen p-6 flex flex-col items-center relative z-10">
      <div className="max-w-md w-full space-y-8 mt-10">
        
        {/* ENCABEZADO DARK */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
            MIS <span className="text-blue-500">TICKETS</span>
          </h1>
          <div className="h-1 w-16 bg-blue-600 mx-auto mt-2 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-4">
            Consulta tus números asignados
          </p>
        </div>

        {/* FORMULARIO DARK & GLASS */}
        <form 
          onSubmit={consultar} 
          className="bg-slate-900/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 space-y-6"
        >
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">
              Tu WhatsApp
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-black text-blue-500 border-r border-slate-700 pr-3 text-sm">
                +58
              </span>
              <input 
                type="tel" 
                placeholder="0412 123 4567"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-4 pl-16 bg-slate-950/50 border-2 border-slate-800 rounded-2xl outline-none focus:border-blue-600 text-white font-bold transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={buscando}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50"
          >
            {buscando ? "Verificando..." : "Consultar Números"}
          </button>
        </form>

        {/* ERROR DARK */}
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-center font-bold text-xs border border-red-500/20 animate-pulse">
            ⚠️ {error}
          </div>
        )}

        {/* RESULTADOS DARK */}
        <div className="space-y-4">
          {resultados.map((pago, index) => (
            <div 
              key={index} 
              className="bg-slate-900/90 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border border-slate-800 border-l-4 border-l-blue-600 group transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-tighter">
                  Sorteo: {pago.rifaId}
                </p>
                <span className="bg-blue-600/10 text-blue-500 text-[8px] font-black px-2 py-1 rounded-md uppercase">
                  ✓ Verificado
                </span>
              </div>
              
              <h3 className="font-black text-white text-xl uppercase italic leading-tight">
                ¡Hola, {pago.nombreCliente}!
              </h3>
              
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Tus números de la suerte:</p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {pago.ticketsAsignados?.map(num => (
                  <span 
                    key={num} 
                    className="bg-slate-950 text-blue-400 px-4 py-2 rounded-xl font-mono font-black text-xl border border-slate-800 shadow-inner group-hover:border-blue-500/30 transition-colors"
                  >
                    {num}
                  </span>
                ))}
              </div>
              
              <p className="text-[9px] text-slate-600 mt-6 font-bold uppercase text-center border-t border-slate-800/50 pt-4">
                © Gana Con Juvenil ™ - Mucha Suerte
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}