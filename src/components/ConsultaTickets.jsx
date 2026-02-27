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

    // Limpieza del número para que coincida con la base de datos
    let numLimpio = whatsapp.replace(/\D/g, '');
    if (numLimpio.startsWith('0')) numLimpio = numLimpio.substring(1);
    if (!numLimpio.startsWith('58')) numLimpio = '58' + numLimpio;

    try {
      // 🚀 OPTIMIZACIÓN V2: Filtramos el estado "rechazado" directamente en la consulta (usando in)
      const q = query(
        collection(db, "pagos"),
        where("whatsapp", "==", numLimpio),
        where("estado", "in", ["pagado", "confirmado"])
      );

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => doc.data());

      if (docs.length === 0) {
        setError("No se encontraron boletos activos para este número de teléfono.");
      } else {
        // Ordenamos para mostrar los confirmados primero
        docs.sort((a, b) => {
          if (a.estado === "confirmado" && b.estado !== "confirmado") return -1;
          if (a.estado !== "confirmado" && b.estado === "confirmado") return 1;
          return 0;
        });
        setResultados(docs);
      }
    } catch (err) {
      console.error(err);
      setError("Hubo un error al consultar la base de datos. Intenta de nuevo.");
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col items-center relative z-10 w-full">
      <div className="max-w-2xl w-full space-y-8 mt-4 md:mt-10">
        
        {/* ENCABEZADO DARK */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 text-blue-500 rounded-full text-3xl mb-4 shadow-inner">
            🎟️
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
            MIS <span className="text-blue-500">TICKETS</span>
          </h1>
          <div className="h-1.5 w-20 bg-blue-600 mx-auto mt-4 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"></div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-4">
            Consulta el estado de tu compra
          </p>
        </div>

        {/* FORMULARIO DARK & GLASS */}
        <form 
          onSubmit={consultar} 
          className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-slate-700/50 space-y-6"
        >
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest block text-center md:text-left">
              Ingresa tu WhatsApp registrado
            </label>
            
            {/* INPUT GROUP */}
            <div className="flex items-stretch bg-slate-950/50 border-2 border-slate-800 rounded-2xl focus-within:border-blue-600 transition-all shadow-inner overflow-hidden group">
              <div className="flex items-center justify-center px-4 md:px-5 border-r border-slate-800 bg-slate-900/80 text-blue-500 font-black text-lg md:text-xl select-none">
                +58
              </div>
              <input 
                type="tel" 
                placeholder="0412 000 0000"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="flex-1 w-full p-4 md:p-5 bg-transparent outline-none text-white font-bold text-lg md:text-xl placeholder:text-slate-700"
              />
            </div>

          </div>

          <button 
            type="submit" 
            disabled={buscando}
            className="w-full bg-blue-600 text-white font-black py-4 md:py-5 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40 uppercase tracking-widest text-[11px] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buscando ? "Buscando en sistema..." : "Consultar Mis Números 🔍"}
          </button>
        </form>

        {/* ERROR DARK */}
        {error && (
          <div className="bg-red-500/10 text-red-500 p-5 rounded-2xl text-center font-black text-[10px] uppercase tracking-widest border border-red-500/20 animate-in fade-in slide-in-from-top-2">
            ⚠️ {error}
          </div>
        )}

        {/* RESULTADOS DARK RESPONSIVOS */}
        <div className="space-y-6">
          {resultados.map((pago, index) => {
            const isConfirmado = pago.estado === "confirmado";

            return (
              <div 
                key={index} 
                className="bg-slate-900/90 backdrop-blur-md p-6 md:p-8 rounded-[2rem] shadow-2xl border border-slate-800 relative overflow-hidden group transition-all"
              >
                {/* Decoración lateral según estado */}
                <div className={`absolute top-0 left-0 bottom-0 w-2 ${isConfirmado ? 'bg-green-500' : 'bg-yellow-500'}`}></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-black text-white text-xl md:text-2xl uppercase italic leading-tight">
                      ¡Hola, {pago.nombreCliente}!
                    </h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                      Sorteo ID: <span className="text-slate-300">{pago.rifaId}</span>
                    </p>
                  </div>
                  
                  {/* BADGE DE ESTADO */}
                  <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-lg flex items-center gap-2 ${
                    isConfirmado 
                    ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  }`}>
                    <span className={isConfirmado ? 'animate-pulse' : 'animate-spin-slow'}>
                      {isConfirmado ? '✅' : '⏳'}
                    </span>
                    {isConfirmado ? 'Boleto Confirmado' : 'Pago en Revisión'}
                  </div>
                </div>
                
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-4">
                    Tus números asignados ({pago.cantidadTickets}):
                  </p>
                  
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {pago.tickets?.map(num => (
                      <span 
                        key={num} 
                        className={`px-4 py-2 md:px-5 md:py-3 rounded-xl font-mono font-black text-lg md:text-xl border shadow-md transition-transform hover:scale-105 cursor-default ${
                          isConfirmado 
                          ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>

                {!isConfirmado && (
                  <p className="text-[10px] text-yellow-500/80 mt-4 text-center font-bold uppercase tracking-widest italic">
                    Tus números están reservados. Espera a que el administrador valide tu captura.
                  </p>
                )}
                
                <p className="text-[8px] text-slate-600 mt-6 font-black uppercase tracking-[0.2em] text-center w-full">
                  © Gana Con Juvenil ™ - Sistema Validado
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}