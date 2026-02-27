import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, query, where, getDocs, doc, writeBatch, getCountFromServer, orderBy, limit, getDoc, serverTimestamp } from "firebase/firestore";
import { listaRifas } from '../data/rifas.js';
import * as XLSX from 'xlsx';
import emailjs from '@emailjs/browser';

export default function DashboardAdmin() {
  const [rifaSeleccionada, setRifaSeleccionada] = useState(listaRifas[0]?.id || "");
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalImagen, setModalImagen] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("pagado"); 
  const [statsTickets, setStatsTickets] = useState({ disponibles: 0, confirmados: 0, pendientes: 0 });
  const [busqueda, setBusqueda] = useState("");

  // ESTADOS MODO DIOS (HERRAMIENTAS AVANZADAS)
  const [modalAuditoria, setModalAuditoria] = useState(false);
  const [ticketQuery, setTicketQuery] = useState("");
  const [ticketData, setTicketData] = useState(null);

  const [modalVenta, setModalVenta] = useState(false);
  // Añadimos referencia al estado inicial
  const [formVenta, setFormVenta] = useState({ nombre: "", whatsapp: "", tickets: "", monto: "", metodoPago: "", referencia: "" });

  const EMAILJS_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_TICKETS = import.meta.env.VITE_EMAILJS_TEMPLATE_TICKETS;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  useEffect(() => {
    if (!rifaSeleccionada) return;
    cargarPagos();
    cargarEstadisticas();
    setBusqueda("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rifaSeleccionada, filtroEstado]);

  const cargarEstadisticas = async () => {
    try {
      const ticketsRef = collection(db, "rifas", rifaSeleccionada, "tickets");
      const [snapDisp, snapConf, snapPend] = await Promise.all([
        getCountFromServer(query(ticketsRef, where("estado", "==", "disponible"))),
        getCountFromServer(query(ticketsRef, where("estado", "==", "confirmado"))),
        getCountFromServer(query(ticketsRef, where("estado", "==", "pagado"))) 
      ]);
      setStatsTickets({ disponibles: snapDisp.data().count, confirmados: snapConf.data().count, pendientes: snapPend.data().count });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const cargarPagos = async () => {
    setCargando(true);
    try {
      const q = query(
        collection(db, "pagos"), 
        where("rifaId", "==", rifaSeleccionada),
        where("estado", "==", filtroEstado),
        orderBy("fecha", "desc"),
        limit(100) 
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPagos(data);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
    } finally {
      setCargando(false);
    }
  };

  const limpiarTicketsFantasmas = async () => {
    if (!window.confirm("⚠️ ¿Buscar carritos abandonados y liberarlos?")) return;
    setCargando(true);
    try {
      const q = query(collection(db, "rifas", rifaSeleccionada, "tickets"), where("estado", "==", "reservado"));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        alert("✨ ¡Todo limpio! No hay tickets atascados.");
        setCargando(false);
        return;
      }
      let lotes = [];
      let batch = writeBatch(db);
      let contador = 0;
      snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { estado: "disponible", reservadoPor: null });
        contador++;
        if (contador === 500) { lotes.push(batch.commit()); batch = writeBatch(db); contador = 0; }
      });
      if (contador > 0) { lotes.push(batch.commit()); }
      await Promise.all(lotes);
      alert(`✅ Se liberaron ${snapshot.size} tickets fantasma.`);
      cargarEstadisticas();
    } catch (error) {
      alert("Error al limpiar los tickets.");
    } finally {
      setCargando(false);
    }
  };

  const revertirPago = async (pago) => {
    if (!window.confirm(`¿Devolver el pago de ${pago.nombreCliente} a PENDIENTE?`)) return;
    setCargando(true);
    try {
      if (pago.estado === "rechazado") {
        for (const num of pago.tickets) {
          const tRef = doc(db, "rifas", pago.rifaId, "tickets", num);
          const tSnap = await getDoc(tRef);
          if (tSnap.exists() && tSnap.data().estado !== "disponible") {
            throw new Error(`El ticket ${num} ya fue tomado por otra persona. No puedes revertir este rechazo.`);
          }
        }
      }
      const batch = writeBatch(db);
      batch.update(doc(db, "pagos", pago.id), { estado: "pagado" });
      pago.tickets.forEach(num => {
        batch.update(doc(db, "rifas", pago.rifaId, "tickets", num), { estado: "pagado" });
      });
      await batch.commit();
      alert("✅ Pago devuelto a Pendiente exitosamente.");
      cargarPagos();
      cargarEstadisticas();
    } catch (error) {
      alert(error.message || "Error al revertir el pago");
    } finally {
      setCargando(false);
    }
  };

  const aprobarPago = async (pago) => {
    if (!window.confirm(`¿Aprobar los tickets de ${pago.nombreCliente}?`)) return;
    setCargando(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "pagos", pago.id), { estado: "confirmado" });
      pago.tickets.forEach(num => {
        batch.update(doc(db, "rifas", pago.rifaId, "tickets", num), { estado: "confirmado" });
      });
      await batch.commit();

      try {
        await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE_TICKETS, {
          to_email: pago.correo, nombre_cliente: pago.nombreCliente, monto: `$${pago.montoUsd}`, tickets: pago.tickets.join(" - ")
        }, EMAILJS_PUBLIC_KEY);
      } catch (e) { console.error("Error email", e); }
      
      cargarPagos(); cargarEstadisticas();
    } catch (error) { alert("Error al aprobar"); } finally { setCargando(false); }
  };

  const rechazarPago = async (pago) => {
    if (!window.confirm(`¿RECHAZAR el pago de ${pago.nombreCliente}?`)) return;
    setCargando(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "pagos", pago.id), { estado: "rechazado" });
      pago.tickets.forEach(num => {
        batch.update(doc(db, "rifas", pago.rifaId, "tickets", num), { estado: "disponible", reservadoPor: null });
      });
      await batch.commit();
      cargarPagos(); cargarEstadisticas();
    } catch (error) { alert("Error al rechazar"); } finally { setCargando(false); }
  };

  const auditarTicket = async (e) => {
    e.preventDefault();
    if (!ticketQuery) return;
    const numLimpio = ticketQuery.trim().padStart(4, '0');
    setCargando(true);
    try {
      const tSnap = await getDoc(doc(db, "rifas", rifaSeleccionada, "tickets", numLimpio));
      if (tSnap.exists()) {
        setTicketData({ id: tSnap.id, ...tSnap.data() });
      } else {
        alert("Ese número de ticket no existe en la base de datos.");
      }
    } catch (error) {
      console.error(error);
    } finally { setCargando(false); }
  };

  const forzarLiberacionTicket = async () => {
    if (!window.confirm(`🚨 PELIGRO: Vas a forzar la liberación del ticket ${ticketData.id}. ¿Continuar?`)) return;
    setCargando(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "rifas", rifaSeleccionada, "tickets", ticketData.id), { estado: "disponible", reservadoPor: null });
      await batch.commit();
      alert(`Ticket ${ticketData.id} liberado a la fuerza.`);
      setTicketData(null);
      setTicketQuery("");
      cargarEstadisticas();
    } catch (error) { alert("Error al liberar"); } finally { setCargando(false); }
  };

  const procesarVentaManual = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      if (!formVenta.metodoPago) throw new Error("Debe seleccionar un método de pago.");
      if (!formVenta.referencia) throw new Error("Debe colocar la referencia del pago.");
      
      const numerosArreglo = formVenta.tickets.split(",").map(n => n.trim().padStart(4, '0')).filter(n => n !== "0000" && n !== "");
      if (numerosArreglo.length === 0) throw new Error("Debe ingresar al menos un ticket válido.");

      for (const num of numerosArreglo) {
        const tSnap = await getDoc(doc(db, "rifas", rifaSeleccionada, "tickets", num));
        if (!tSnap.exists() || tSnap.data().estado !== "disponible") {
          throw new Error(`El ticket ${num} no está disponible (Estado: ${tSnap.data()?.estado}).`);
        }
      }

      const batch = writeBatch(db);
      numerosArreglo.forEach(num => {
        batch.update(doc(db, "rifas", rifaSeleccionada, "tickets", num), { estado: "confirmado" });
      });

      // Aseguramos que el monto no sea negativo
      const montoAbsoluto = Math.abs(Number(formVenta.monto)) || 0;

      const pagoRef = doc(collection(db, "pagos"));
      batch.set(pagoRef, {
        nombreCliente: formVenta.nombre + " (Manual)",
        whatsapp: formVenta.whatsapp,
        correo: "Venta Directa",
        direccion: "Taquilla",
        metodoPago: formVenta.metodoPago,
        referencia: formVenta.referencia, // Referencia incluida
        rifaId: rifaSeleccionada,
        cantidadTickets: numerosArreglo.length,
        tickets: numerosArreglo,
        montoUsd: montoAbsoluto,
        montoBs: 0,
        estado: "confirmado",
        fecha: serverTimestamp(),
        comprobanteUrl: ""
      });

      await batch.commit();
      alert("✅ Venta manual registrada con éxito.");
      setModalVenta(false);
      setFormVenta({ nombre: "", whatsapp: "", tickets: "", monto: "", metodoPago: "", referencia: "" });
      cargarPagos();
      cargarEstadisticas();
    } catch (error) {
      alert(error.message);
    } finally {
      setCargando(false);
    }
  };

  const exportarExcel = async () => {
    setCargando(true);
    try {
      const q = query(collection(db, "pagos"), where("rifaId", "==", rifaSeleccionada), where("estado", "==", "confirmado"));
      const snapshot = await getDocs(q);
      if (snapshot.empty) { alert("No hay pagos."); setCargando(false); return; }
      const nombreRifa = listaRifas.find(r => r.id === rifaSeleccionada)?.nombre || "Rifa";
      let totalRecaudadoUSD = 0, totalRecaudadoBS = 0;
      const datosExcel = [ ["🏆 GANA CON JUVENIL - REPORTE OFICIAL 🏆"], [""], ["Sorteo:", nombreRifa, "", "", "Fecha Reporte:", new Date().toLocaleDateString('es-VE')], [""], ["TICKET", "CLIENTE", "WHATSAPP", "CORREO", "DIRECCIÓN (ESTADO/CIUDAD)", "MÉTODO", "REFERENCIA", "MONTO ($)", "MONTO (Bs)", "FECHA COMPRA"] ];
      const filasDatos = [];
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const pUSD = data.montoUsd / data.cantidadTickets, pBS = (data.montoBs || 0) / data.cantidadTickets;
        data.tickets.forEach(t => {
          totalRecaudadoUSD += pUSD; totalRecaudadoBS += pBS;
          filasDatos.push([ t, data.nombreCliente?.toUpperCase() || "N/A", data.whatsapp || "N/A", data.correo?.toLowerCase() || "N/A", data.direccion?.toUpperCase() || "N/A", data.metodoPago?.toUpperCase() || "N/A", data.referencia || "N/A", `$${pUSD.toFixed(2)}`, `Bs. ${pBS.toFixed(2)}`, data.fecha ? new Date(data.fecha.toDate()).toLocaleString('es-VE') : "N/A" ]);
        });
      });
      filasDatos.sort((a, b) => a[0].localeCompare(b[0]));
      datosExcel.push(...filasDatos); datosExcel.push(["", "", "", "", "", "", "", "", "", ""]); datosExcel.push(["", "", "", "", "", "", "TOTAL RECAUDADO:", `$${totalRecaudadoUSD.toFixed(2)}`, `Bs. ${totalRecaudadoBS.toFixed(2)}`, ""]); 
      const worksheet = XLSX.utils.aoa_to_sheet(datosExcel);
      worksheet['!cols'] = [ { wch: 10 }, { wch: 35 }, { wch: 18 }, { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 22 } ];
      const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoría"); XLSX.writeFile(workbook, `Reporte_GanaConJuvenil_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) { alert("Error Excel"); } finally { setCargando(false); }
  };

  const pagosFiltrados = pagos.filter(pago => {
    if (!busqueda) return true;
    const t = busqueda.toLowerCase().trim();
    return pago.tickets?.some(tk => tk.toLowerCase().includes(t)) || pago.nombreCliente?.toLowerCase().includes(t) || pago.referencia?.toLowerCase().includes(t) || pago.whatsapp?.includes(t);
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER MODO DIOS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Panel <span className="text-blue-500">Admin</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Centro de Comando God-Mode</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <select value={rifaSeleccionada} onChange={(e) => setRifaSeleccionada(e.target.value)} className="w-full sm:w-auto p-3 bg-slate-950 border border-slate-700 rounded-xl font-bold text-slate-200 outline-none focus:border-blue-500">
            {listaRifas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>

          <button onClick={() => setModalVenta(true)} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
            🎟️ Venta Manual
          </button>
          
          <button onClick={() => setModalAuditoria(true)} className="flex-1 sm:flex-none bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
            🔎 Auditar
          </button>

          <button onClick={limpiarTicketsFantasmas} className="flex-1 sm:flex-none bg-slate-800 text-red-400 border border-red-500/30 px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
            🧹 Limpiar
          </button>

          <button onClick={exportarExcel} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
            📊 Excel
          </button>
        </div>
      </div>

      {/* ESTADÍSTICAS GLOBALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/10 rounded-bl-full"></div>
          <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Disponibles</p><h3 className="text-3xl font-black text-white">{statsTickets.disponibles}</h3></div>
          <div className="text-3xl relative z-10">🎟️</div>
        </div>
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-bl-full"></div>
          <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">En Revisión</p><h3 className="text-3xl font-black text-yellow-500">{statsTickets.pendientes}</h3></div>
          <div className="text-3xl relative z-10">⏳</div>
        </div>
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full"></div>
          <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Confirmados</p><h3 className="text-3xl font-black text-green-500">{statsTickets.confirmados}</h3></div>
          <div className="text-3xl relative z-10">✅</div>
        </div>
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
          <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Ingresos ($)</p><h3 className="text-3xl font-black text-white">${pagos.reduce((a, c) => a + (c.montoUsd || 0), 0).toFixed(2)}</h3></div>
          <div className="text-3xl">💰</div>
        </div>
      </div>

      {/* LISTA DE PAGOS Y FILTROS */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center flex-wrap gap-4">
          <div className="relative w-full md:flex-1 max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🔍</span>
            <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl font-bold text-slate-200 outline-none focus:border-blue-500 text-xs uppercase" />
          </div>
        </div>

        <div className="flex border-b border-slate-800 bg-slate-950/30">
          <button onClick={() => setFiltroEstado("pagado")} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${filtroEstado === "pagado" ? 'text-yellow-500 border-b-2 border-yellow-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`}>🟡 Pendientes</button>
          <button onClick={() => setFiltroEstado("confirmado")} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${filtroEstado === "confirmado" ? 'text-green-500 border-b-2 border-green-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`}>🟢 Confirmados</button>
          <button onClick={() => setFiltroEstado("rechazado")} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${filtroEstado === "rechazado" ? 'text-red-500 border-b-2 border-red-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`}>🔴 Rechazados</button>
        </div>

        <div className="p-6">
          {cargando ? <div className="text-center py-10 text-slate-500 font-bold uppercase text-[10px]">Cargando...</div> : pagosFiltrados.map(pago => (
            <div key={pago.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-4 flex flex-col md:flex-row gap-6 items-start hover:border-slate-700 transition-colors shadow-lg">
              {pago.comprobanteUrl && (
                <div className="w-full md:w-32 h-32 bg-slate-900 rounded-xl overflow-hidden cursor-pointer border border-slate-700 flex-shrink-0 relative shadow-inner" onClick={() => setModalImagen(pago.comprobanteUrl)}>
                  <img src={pago.comprobanteUrl} alt="Comprobante" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 w-full space-y-3">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-white uppercase text-lg">{pago.nombreCliente}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">📅 {pago.fecha ? new Date(pago.fecha.toDate()).toLocaleString() : "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-black text-green-500 text-2xl">${pago.montoUsd?.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/50"><span className="text-blue-400">{pago.metodoPago}</span> • REF: {pago.referencia}</div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/50"><span className="text-green-500">💬 {pago.whatsapp}</span></div>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Tickets ({pago.cantidadTickets}):</span>
                  <div className="flex flex-wrap gap-1">{pago.tickets?.map(t => <span key={t} className="text-[10px] font-black px-2 py-0.5 rounded border bg-blue-600/20 text-blue-400 border-blue-500/30">{t}</span>)}</div>
                </div>
              </div>

              {/* CONTROLES CONDICIONALES */}
              <div className="flex w-full md:w-32 flex-row md:flex-col gap-2 flex-shrink-0 mt-4 md:mt-0">
                {filtroEstado === "pagado" ? (
                  <>
                    <button onClick={() => aprobarPago(pago)} className="flex-1 bg-green-600 text-white hover:bg-green-500 px-4 py-3 md:py-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-900/20 active:scale-95 transition-all">✅ Aprobar</button>
                    <button onClick={() => rechazarPago(pago)} className="flex-1 bg-slate-800 text-red-500 border border-red-500/20 px-4 py-3 md:py-2 rounded-xl font-black text-[10px] uppercase active:scale-95 transition-all">❌ Rechazar</button>
                  </>
                ) : (
                  <button onClick={() => revertirPago(pago)} className="bg-yellow-600/20 text-yellow-500 border border-yellow-500/50 hover:bg-yellow-600 hover:text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase transition-all">
                    🔄 Revertir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: VENTA MANUAL */}
      {modalVenta && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <form onSubmit={procesarVentaManual} className="bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl">
            <h2 className="text-2xl font-black text-white uppercase italic mb-6">🎟️ Venta Manual</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre del Cliente" required value={formVenta.nombre} onChange={e => setFormVenta({...formVenta, nombre: e.target.value})} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none font-bold text-white focus:border-blue-500" />
              <input type="text" placeholder="WhatsApp (Ej. 0412...)" required value={formVenta.whatsapp} onChange={e => setFormVenta({...formVenta, whatsapp: e.target.value})} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none font-bold text-white focus:border-blue-500" />
              
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" step="0.01" placeholder="Monto ($)" required value={formVenta.monto} onChange={e => setFormVenta({...formVenta, monto: e.target.value})} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none font-bold text-white focus:border-blue-500" />
                <select required value={formVenta.metodoPago} onChange={e => setFormVenta({...formVenta, metodoPago: e.target.value})} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none font-bold text-slate-300 focus:border-blue-500">
                  <option value="" disabled>Método...</option>
                  <option value="pagomovil">📱 Pago Móvil</option>
                  <option value="zelle">💵 Zelle</option>
                  <option value="binance">🔶 Binance Pay</option>
                  <option value="efectivo">💵 Efectivo</option>
                </select>
              </div>

              <input type="text" placeholder="Número de Referencia" required value={formVenta.referencia} onChange={e => setFormVenta({...formVenta, referencia: e.target.value})} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none font-bold text-white focus:border-blue-500" />

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Números a asignar (Separados por coma)</label>
                <input type="text" placeholder="Ej. 5, 12, 105" required value={formVenta.tickets} onChange={e => setFormVenta({...formVenta, tickets: e.target.value})} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none font-black tracking-widest text-blue-400 focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setModalVenta(false)} className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-xl font-black uppercase text-[10px] transition-colors hover:text-white">Cancelar</button>
              <button type="submit" disabled={cargando} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-blue-900/30 transition-transform active:scale-95">{cargando ? 'Guardando...' : 'Guardar Venta'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: AUDITOR DE TICKETS */}
      {modalAuditoria && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl">
            <h2 className="text-xl font-black text-white uppercase italic mb-6">🔎 Auditar Ticket</h2>
            
            <form onSubmit={auditarTicket} className="flex gap-3 mb-6">
              <input type="number" min="0" placeholder="Ej. 15" value={ticketQuery} onChange={e=>setTicketQuery(e.target.value)} className="w-full flex-1 p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none font-black text-center text-xl text-white focus:border-blue-500" />
              <button type="submit" className="w-auto bg-blue-600 hover:bg-blue-500 px-6 py-4 rounded-xl text-white font-black uppercase text-[10px] tracking-widest transition-colors shadow-lg active:scale-95">Buscar</button>
            </form>
            
            {ticketData && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center mb-6 animate-in zoom-in-95">
                <p className="text-3xl font-black text-blue-500 mb-2">#{ticketData.id}</p>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado Actual:</p>
                <span className={`inline-block px-3 py-1 mt-1 rounded text-xs font-black uppercase tracking-widest ${ticketData.estado === 'disponible' ? 'bg-green-500/20 text-green-500' : ticketData.estado === 'confirmado' ? 'bg-blue-500/20 text-blue-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                  {ticketData.estado}
                </span>
                {ticketData.reservadoPor && <p className="text-[10px] font-bold text-slate-500 mt-2">Teléfono: {ticketData.reservadoPor}</p>}
                
                {ticketData.estado !== 'disponible' && (
                  <button onClick={forzarLiberacionTicket} className="w-full mt-4 bg-red-600/20 border border-red-500/50 hover:bg-red-600 text-red-500 hover:text-white py-3 rounded-xl font-black text-[10px] uppercase transition-colors active:scale-95">
                    ⚠️ Forzar Liberación
                  </button>
                )}
              </div>
            )}
            <button onClick={() => {setModalAuditoria(false); setTicketData(null); setTicketQuery("");}} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-xl font-black uppercase text-[10px] transition-colors">Cerrar Auditoría</button>
          </div>
        </div>
      )}

      {/* VISOR DE IMÁGENES */}
      {modalImagen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl" onClick={() => setModalImagen(null)}>
          <div className="relative max-w-3xl w-full flex flex-col items-center">
            <button className="absolute -top-12 right-0 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest transition-colors">CERRAR VISOR [X]</button>
            <img src={modalImagen} alt="Comprobante Ampliado" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-slate-700" />
          </div>
        </div>
      )}

    </div>
  );
}