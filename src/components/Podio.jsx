import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, query, where, getDocs } from "firebase/firestore";

export default function Podio({ rifaId }) {
  const [topUsuarios, setTopUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!rifaId) return;

    const cargarPodio = async () => {
      try {
        // Buscamos los pagos confirmados de esta rifa
        const q = query(
          collection(db, "pagos"), 
          where("estado", "==", "confirmado"),
          where("rifaId", "==", rifaId)
        );
        
        // getDocs lee la base de datos UNA SOLA VEZ (Ahorro masivo de lecturas)
        const snapshot = await getDocs(q);
        const conteoBoletos = {};

        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          const tlf = data.whatsapp;
          
          if (!conteoBoletos[tlf]) {
            // 👇 NUEVA LÓGICA: Extraer Nombre + Apellido 👇
            // Si el cliente puso "Jorge Diaz Perez", esto agarra "Jorge Diaz"
            const partesNombre = data.nombreCliente ? data.nombreCliente.trim().split(' ') : ['Usuario'];
            const nombreMostrar = partesNombre.length > 1 
              ? `${partesNombre[0]} ${partesNombre[1]}` 
              : partesNombre[0];
            
            conteoBoletos[tlf] = { nombre: nombreMostrar, tickets: 0 };
          }
          conteoBoletos[tlf].tickets += Number(data.cantidadTickets || 0);
        });

        // Convertimos a array, ordenamos por cantidad de tickets y tomamos los top 3
        const ordenados = Object.values(conteoBoletos)
          .sort((a, b) => b.tickets - a.tickets)
          .slice(0, 3);

        setTopUsuarios(ordenados);
      } catch (error) {
        console.error("Error al cargar el podio:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarPodio();
  }, [rifaId]);

  if (cargando || topUsuarios.length === 0) return null; 

  const primero = topUsuarios[0];
  const segundo = topUsuarios[1]; 
  const tercero = topUsuarios[2]; 

  return (
    <div className="w-full pt-4 px-1 animate-in fade-in zoom-in duration-700 relative z-20">
      
      {/* Contenedor Flex: flex-1 a cada columna garantiza que siempre quepan los 3 */}
      <div className="flex justify-between items-end gap-1 h-32">
        
        {/* ================= 2DO LUGAR (PLATA) ================= */}
        <div className="flex-1 flex flex-col items-center group">
          {segundo ? (
            <div className="mb-1 text-center animate-in fade-in slide-in-from-bottom-2">
              <span className="text-lg md:text-xl block mb-0.5 drop-shadow-lg">🥈</span>
              <p className="text-[9px] md:text-[10px] font-black text-slate-100 truncate w-full uppercase drop-shadow-md">{segundo.nombre}</p>
              <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest drop-shadow-md">{segundo.tickets} Blts</p>
            </div>
          ) : (
            <div className="mb-1 text-center opacity-40">
              <span className="text-lg md:text-xl block mb-0.5 grayscale">🥈</span>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Libre</p>
            </div>
          )}
          
          <div className={`w-full h-12 md:h-14 bg-gradient-to-t from-slate-800 via-slate-400 to-slate-200 rounded-t-lg flex items-end justify-center pb-1 transition-all ${segundo ? 'shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'opacity-40'}`}>
            <span className="text-slate-900 font-black text-sm opacity-60 italic">2</span>
          </div>
        </div>

        {/* ================= 1ER LUGAR (FUEGO / ORO RADIANTE) ================= */}
        <div className="flex-[1.2] flex flex-col items-center z-10 group relative mx-1">
          
          <div className="absolute -inset-4 bg-orange-500/30 blur-2xl rounded-full pointer-events-none animate-pulse"></div>
          
          <div className="mb-1 text-center relative z-10">
            <span className="text-3xl md:text-4xl block mb-0.5 drop-shadow-[0_0_15px_rgba(249,115,22,1)]">👑</span>
            <p className="text-[11px] md:text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 truncate w-full uppercase drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">
              {primero.nombre}
            </p>
            <p className="text-[9px] text-yellow-100 font-black uppercase tracking-widest bg-orange-600/80 px-2 py-0.5 rounded-full mt-1 border border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.6)]">
              {primero.tickets} Blts
            </p>
          </div>

          <div className="w-full h-16 md:h-20 bg-gradient-to-t from-red-700 via-orange-500 to-yellow-300 rounded-t-lg border-t-2 border-yellow-200 shadow-[0_0_30px_rgba(249,115,22,0.7)] relative overflow-hidden flex items-end justify-center pb-1">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-400/30 to-red-600/50 animate-pulse"></div>
            <span className="text-red-950 font-black text-xl opacity-80 italic relative z-10">1</span>
          </div>
        </div>

        {/* ================= 3ER LUGAR (BRONCE) ================= */}
        <div className="flex-1 flex flex-col items-center group">
          {tercero ? (
            <div className="mb-1 text-center animate-in fade-in slide-in-from-bottom-2">
              <span className="text-lg md:text-xl block mb-0.5 drop-shadow-lg">🥉</span>
              <p className="text-[9px] md:text-[10px] font-black text-slate-100 truncate w-full uppercase drop-shadow-md">{tercero.nombre}</p>
              <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest drop-shadow-md">{tercero.tickets} Blts</p>
            </div>
          ) : (
            <div className="mb-1 text-center opacity-40">
              <span className="text-lg md:text-xl block mb-0.5 grayscale">🥉</span>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Libre</p>
            </div>
          )}
          
          <div className={`w-full h-10 md:h-12 bg-gradient-to-t from-orange-950 via-amber-700 to-orange-500 rounded-t-lg flex items-end justify-center pb-1 transition-all ${tercero ? 'shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'opacity-40'}`}>
             <span className="text-amber-950 font-black text-sm opacity-60 italic">3</span>
          </div>
        </div>

      </div>
    </div>
  );
}