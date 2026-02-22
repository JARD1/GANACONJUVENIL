import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, query, onSnapshot, doc, updateDoc, getDocs, where } from "firebase/firestore";
import { listaRifas } from '../data/rifas';

export default function DashboardAdmin() {
  const [reportes, setReportes] = useState([]);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRifa, setFiltroRifa] = useState("todas");
  const [procesandoId, setProcesandoId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "pagos"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setReportes(docs.sort((a, b) => b.fecha?.seconds - a.fecha?.seconds));
    });
    return () => unsubscribe();
  }, []);

  const generarNumerosUnicos = async (cantidadSolicitada, rifaId) => {
    const q = query(
      collection(db, "pagos"), 
      where("rifaId", "==", rifaId), 
      where("estado", "==", "aprobado")
    );
    const querySnapshot = await getDocs(q);
    const numerosOcupados = new Set(querySnapshot.docs.flatMap(doc => doc.data().ticketsAsignados || []));

    const rifaData = listaRifas.find(r => r.id === rifaId);
    const maxTickets = rifaData?.maxTickets || 1000;

    const disponibles = [];
    for (let i = 1; i <= maxTickets; i++) {
      const numFormateado = i.toString().padStart(3, '0');
      if (!numerosOcupados.has(numFormateado)) {
        disponibles.push(numFormateado);
      }
    }

    if (disponibles.length < cantidadSolicitada) {
      throw new Error(`¡Agotado! Solo quedan ${disponibles.length} tickets disponibles.`);
    }

    const seleccionados = disponibles
      .sort(() => Math.random() - 0.5)
      .slice(0, cantidadSolicitada);

    return seleccionados;
  };

  const admitirPago = async (reporte) => {
    setProcesandoId(reporte.id);
    try {
      const tickets = await generarNumerosUnicos(reporte.cantidadTickets, reporte.rifaId);
      const rifaNombre = listaRifas.find(r => r.id === reporte.rifaId)?.nombre || "la rifa";
      
      const docRef = doc(db, "pagos", reporte.id);
      await updateDoc(docRef, {
        estado: "aprobado",
        ticketsAsignados: tickets,
        fechaAprobacion: new Date()
      });

      const textoMensaje = 
        `¡Hola ${reporte.nombreCliente}! 👋\n\n` +
        `Tu pago por la rifa *${rifaNombre}* ha sido confirmado. ✅\n\n` +
        `🎟️ *Tus números asignados:*\n` +
        `*${tickets.join(" - ")}*\n\n` +
        `Puedes consultar tus tickets en cualquier momento aquí:\n` +
        `https://ganaconjuvenil.netlify.app/mis-tickets\n\n` +
        `¡Mucha suerte! 🍀`;

      const mensajeFinal = encodeURIComponent(textoMensaje);
      const tlf = reporte.whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${tlf}?text=${mensajeFinal}`, '_blank');

    } catch (error) {
      console.error(error);
      alert(error.message || "Error al procesar el pago");
    } finally {
      setProcesandoId(null);
    }
  };

  const rechazarPago = async (id) => {
    if(window.confirm("¿Rechazar este pago?")) {
        await updateDoc(doc(db, "pagos", id), { estado: "rechazado" });
    }
  };

  const reportesFiltrados = reportes.filter(r => {
    const coincideRifa = filtroRifa === "todas" || r.rifaId === filtroRifa;
    const coincideBusqueda = r.nombreCliente?.toLowerCase().includes(busqueda.toLowerCase()) || 
                             r.referencia?.includes(busqueda);
    return coincideRifa && coincideBusqueda;
  });

  const totalTicketsConfirmados = reportes
    .filter(r => r.rifaId === filtroRifa && r.estado === "aprobado")
    .reduce((acc, curr) => acc + (curr.cantidadTickets || 0), 0);

  const rifaActual = listaRifas.find(r => r.id === filtroRifa);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Panel Control</h1>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Administración de Pagos</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select 
            onChange={(e) => setFiltroRifa(e.target.value)}
            className="p-4 bg-slate-900 text-white rounded-2xl font-bold text-sm outline-none cursor-pointer"
          >
            <option value="todas">Todas las Rifas</option>
            {listaRifas.map(rifa => (
              <option key={rifa.id} value={rifa.id}>{rifa.nombre}</option>
            ))}
          </select>
          
          {rifaActual && (
            <div className="bg-blue-600 text-white p-4 rounded-2xl flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] font-black uppercase opacity-80">Tickets Vendidos</span>
              <span className="text-xl font-black">{totalTicketsConfirmados} / {rifaActual.maxTickets}</span>
            </div>
          )}
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="relative">
        <input 
          type="text" placeholder="Buscar por nombre o referencia..."
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-white border-2 border-slate-50 p-5 pl-14 rounded-3xl outline-none focus:border-blue-500 font-bold shadow-sm"
        />
        <span className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔍</span>
      </div>

      {/* TABLA DE REPORTES */}
      <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                <th className="p-8">Cliente</th>
                <th className="p-6 text-center">Info Rifa</th> {/* Reducido padding lateral */}
                <th className="p-8">Monto Reportado</th>
                <th className="p-8 text-center">Capture</th>
                <th className="p-8 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportesFiltrados.map((r) => (
                <tr key={r.id} className={`hover:bg-slate-50/50 transition-all ${r.estado !== 'pendiente' ? 'opacity-60' : ''}`}>
                  <td className="p-8">
                    <p className="font-extrabold text-slate-800 text-lg leading-none">{r.nombreCliente}</p>
                    <div className="flex gap-2 mt-2 items-center">
                      <span className="text-[9px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                        {r.metodoPago}
                      </span>
                      <a href={`https://wa.me/${r.whatsapp?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-[10px] text-green-600 font-black hover:underline whitespace-nowrap">WhatsApp 🟢</a>
                    </div>
                  </td>

                  {/* COLUMNA INFO RIFA CORREGIDA */}
                  <td className="p-6 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic mb-1 truncate max-w-[120px] mx-auto">
                      {r.rifaId}
                    </p>
                    <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full whitespace-nowrap">
                      {r.cantidadTickets} tickets
                    </span>
                  </td>

                  <td className="p-8">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-xl tracking-tighter">
                        ${Number(r.montoUsd || 0).toFixed(2)}
                      </span>
                      {r.montoBs && (
                        <span className="text-[11px] font-black text-green-600 mt-1 bg-green-50 px-2 py-0.5 rounded-md self-start whitespace-nowrap">
                          Bs. {Number(r.montoBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono mt-1 font-bold italic uppercase">Ref: {r.referencia}</span>
                    </div>
                  </td>

                  <td className="p-8 text-center">
                    <button onClick={() => setComprobanteSeleccionado(r.comprobanteUrl)} className="bg-slate-100 p-3 rounded-2xl hover:bg-slate-900 group transition-all">
                      <span className="text-xl">🖼️</span>
                    </button>
                  </td>

                  <td className="p-8">
                    <div className="flex flex-col items-center gap-2">
                      {procesandoId === r.id ? (
                        <span className="animate-pulse text-blue-600 font-black text-xs uppercase">Asignando...</span>
                      ) : r.estado === 'pendiente' ? (
                        <>
                          <button onClick={() => admitirPago(r)} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-green-100 transition-transform active:scale-95 whitespace-nowrap">
                            Aprobar y Enviar WA
                          </button>
                          <button onClick={() => rechazarPago(r.id)} className="text-[10px] font-black text-red-400 uppercase hover:text-red-600">Rechazar</button>
                        </>
                      ) : (
                        <div className="text-center">
                          <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl whitespace-nowrap ${r.estado === 'aprobado' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {r.estado === 'aprobado' ? '✅ Confirmado' : '❌ Rechazado'}
                          </span>
                          {r.ticketsAsignados && (
                            <p className="text-[10px] font-mono font-bold text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-dashed border-slate-200">
                              {r.ticketsAsignados.join(" - ")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE IMAGEN */}
      {comprobanteSeleccionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md" onClick={() => setComprobanteSeleccionado(null)}>
          <div className="relative">
            <button className="absolute -top-12 right-0 text-white font-bold text-lg">Cerrar ✕</button>
            <img src={comprobanteSeleccionado} alt="Capture" className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl border-4 border-white object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}