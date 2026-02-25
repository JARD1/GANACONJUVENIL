import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, query, where, getDocs, doc, writeBatch, getCountFromServer, orderBy, limit } from "firebase/firestore";
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

  const EMAILJS_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_TICKETS = import.meta.env.VITE_EMAILJS_TEMPLATE_TICKETS;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  useEffect(() => {
    if (!rifaSeleccionada) return;
    cargarPagos();
    cargarEstadisticas();
    setBusqueda("");
  }, [rifaSeleccionada, filtroEstado]);

  const cargarEstadisticas = async () => {
    try {
      const ticketsRef = collection(db, "rifas", rifaSeleccionada, "tickets");
      
      const [snapDisp, snapConf, snapPend] = await Promise.all([
        getCountFromServer(query(ticketsRef, where("estado", "==", "disponible"))),
        getCountFromServer(query(ticketsRef, where("estado", "==", "confirmado"))),
        getCountFromServer(query(ticketsRef, where("estado", "==", "pagado"))) 
      ]);

      setStatsTickets({
        disponibles: snapDisp.data().count,
        confirmados: snapConf.data().count,
        pendientes: snapPend.data().count
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const cargarPagos = async () => {
    setCargando(true);
    try {
      // OPTIMIZACIÓN DE COSTOS: Solo traemos los últimos 100 documentos
      const q = query(
        collection(db, "pagos"), 
        where("rifaId", "==", rifaSeleccionada),
        where("estado", "==", filtroEstado),
        orderBy("fecha", "desc"), // Del más nuevo al más viejo
        limit(100) // Límite estricto de seguridad para Firebase
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setPagos(data);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      alert("Error de carga. Si es primera vez, revisa la consola para crear el índice de Firebase.");
    } finally {
      setCargando(false);
    }
  };

  const aprobarPago = async (pago) => {
    if (!window.confirm(`¿Aprobar los tickets de ${pago.nombreCliente}?`)) return;
    
    setCargando(true);
    try {
      const batch = writeBatch(db);
      const pagoRef = doc(db, "pagos", pago.id);
      batch.update(pagoRef, { estado: "confirmado" });

      pago.tickets.forEach(num => {
        const tRef = doc(db, "rifas", pago.rifaId, "tickets", num);
        batch.update(tRef, { estado: "confirmado" });
      });

      await batch.commit();

      try {
        await emailjs.send(
          EMAILJS_SERVICE,
          EMAILJS_TEMPLATE_TICKETS,
          {
            to_email: pago.correo,
            nombre_cliente: pago.nombreCliente,
            monto: `$${pago.montoUsd}`,
            tickets: pago.tickets.join(" - "), 
          },
          EMAILJS_PUBLIC_KEY
        );
      } catch (emailError) {
        console.error("Error enviando el correo:", emailError);
      }
      
      cargarPagos(); 
      cargarEstadisticas();
    } catch (error) {
      console.error("Error al aprobar:", error);
      alert("Error al aprobar el pago");
    } finally {
      setCargando(false);
    }
  };

  const rechazarPago = async (pago) => {
    if (!window.confirm(`¿RECHAZAR el pago de ${pago.nombreCliente}? Los tickets se liberarán.`)) return;
    
    setCargando(true);
    try {
      const batch = writeBatch(db);
      const pagoRef = doc(db, "pagos", pago.id);
      batch.update(pagoRef, { estado: "rechazado" });

      pago.tickets.forEach(num => {
        const tRef = doc(db, "rifas", pago.rifaId, "tickets", num);
        batch.update(tRef, { estado: "disponible", tempUser: null, reservadoPor: null });
      });

      await batch.commit();
      cargarPagos();
      cargarEstadisticas();
    } catch (error) {
      console.error("Error al rechazar:", error);
      alert("Error al rechazar el pago");
    } finally {
      setCargando(false);
    }
  };

  const exportarExcel = async () => {
    setCargando(true);
    try {
      // Para el Excel sí traemos todos los confirmados sin límite, ya que es un reporte final
      const q = query(collection(db, "pagos"), where("rifaId", "==", rifaSeleccionada), where("estado", "==", "confirmado"));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert("No hay pagos confirmados para exportar en esta rifa.");
        setCargando(false);
        return;
      }

      const nombreRifa = listaRifas.find(r => r.id === rifaSeleccionada)?.nombre || "Rifa";
      let totalRecaudado = 0;

      // EXCEL ESTRUCTURADO Y PROFESIONAL
      const datosExcel = [
        ["🏆 GANA CON JUVENIL - REPORTE OFICIAL 🏆"],
        [""],
        ["Sorteo:", nombreRifa, "", "Fecha Reporte:", new Date().toLocaleDateString()],
        [""],
        ["TICKET", "CLIENTE", "WHATSAPP", "MÉTODO", "REFERENCIA", "MONTO ($)", "FECHA COMPRA"]
      ];

      const filasDatos = [];
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const precioPorTicket = data.montoUsd / data.cantidadTickets;
        
        data.tickets.forEach(ticketNum => {
          totalRecaudado += precioPorTicket;
          filasDatos.push([
            ticketNum,
            data.nombreCliente.toUpperCase(),
            data.whatsapp,
            data.metodoPago.toUpperCase(),
            data.referencia,
            `$${precioPorTicket.toFixed(2)}`,
            data.fecha ? new Date(data.fecha.toDate()).toLocaleString() : "N/A"
          ]);
        });
      });

      // Ordenar por número de ticket
      filasDatos.sort((a, b) => a[0].localeCompare(b[0]));
      
      // Añadir datos a la hoja
      datosExcel.push(...filasDatos);
      datosExcel.push(["", "", "", "", "", "", ""]); // Espacio
      datosExcel.push(["", "", "", "", "TOTAL RECAUDADO:", `$${totalRecaudado.toFixed(2)}`, ""]); // Fila de Total

      const worksheet = XLSX.utils.aoa_to_sheet(datosExcel);
      
      // Anchos de columna para que se vea bonito
      worksheet['!cols'] = [
        { wch: 10 }, // Ticket
        { wch: 35 }, // Cliente
        { wch: 18 }, // WhatsApp
        { wch: 15 }, // Metodo
        { wch: 15 }, // Ref
        { wch: 15 }, // Monto
        { wch: 22 }  // Fecha
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoría");
      XLSX.writeFile(workbook, `Reporte_${nombreRifa}_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Error al generar el Excel.");
    } finally {
      setCargando(false);
    }
  };

  const pagosFiltrados = pagos.filter(pago => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase().trim();
    const tieneTicket = pago.tickets?.some(t => t.toLowerCase().includes(termino));
    const coincideNombre = pago.nombreCliente?.toLowerCase().includes(termino);
    const coincideRef = pago.referencia?.toLowerCase().includes(termino);
    const coincideTlf = pago.whatsapp?.includes(termino);
    return tieneTicket || coincideNombre || coincideRef || coincideTlf;
  });

  const totalPagos = pagos.length;
  const ingresosEstimados = pagos.reduce((acc, curr) => acc + (curr.montoUsd || 0), 0);
  const rifaActualData = listaRifas.find(r => r.id === rifaSeleccionada);
  const totalTicketsRifa = rifaActualData ? rifaActualData.maxTickets : 0;

  return (
    <div className="space-y-6">
      
      {/* HEADER DEL DASHBOARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Panel <span className="text-blue-500">Administrativo</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestión de Reportes y Aprobaciones</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <select 
            value={rifaSeleccionada} 
            onChange={(e) => setRifaSeleccionada(e.target.value)}
            className="w-full md:w-64 p-3 bg-slate-950 border border-slate-700 rounded-xl font-bold text-slate-200 outline-none focus:border-blue-500"
          >
            {listaRifas.map(rifa => (
              <option key={rifa.id} value={rifa.id}>{rifa.nombre}</option>
            ))}
          </select>

          <button 
            onClick={exportarExcel}
            disabled={cargando}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_15px_rgba(22,163,74,0.4)] active:scale-95 transition-all whitespace-nowrap"
          >
            📊 Reporte .XLSX
          </button>
        </div>
      </div>

      {/* ESTADÍSTICAS GLOBALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/10 rounded-bl-full"></div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Disponibles</p>
            <h3 className="text-3xl font-black text-white">
              {statsTickets.disponibles} <span className="text-sm text-slate-600">/ {totalTicketsRifa}</span>
            </h3>
          </div>
          <div className="text-3xl relative z-10">🎟️</div>
        </div>
        
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-bl-full"></div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">En Revisión</p>
            <h3 className="text-3xl font-black text-yellow-500">{statsTickets.pendientes}</h3>
          </div>
          <div className="text-3xl relative z-10">⏳</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full"></div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Confirmados</p>
            <h3 className="text-3xl font-black text-green-500">{statsTickets.confirmados}</h3>
          </div>
          <div className="text-3xl relative z-10">✅</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
          <div>
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Ingresos ($)</p>
            <h3 className="text-3xl font-black text-white">${ingresosEstimados.toFixed(2)}</h3>
          </div>
          <div className="text-3xl">💰</div>
        </div>
      </div>

      {/* FILTROS, BUSCADOR Y LISTA DE PAGOS */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center flex-wrap gap-4">
          <div className="relative w-full md:flex-1 max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Buscar por Ticket, Nombre, Referencia o Tlf..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl font-bold text-slate-200 outline-none focus:border-blue-500 transition-colors text-xs uppercase tracking-widest placeholder:text-slate-600 shadow-inner"
            />
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2">
            Mostrando últimos 100 registros
          </div>
        </div>

        <div className="flex border-b border-slate-800 bg-slate-950/30">
          <button onClick={() => setFiltroEstado("pagado")} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${filtroEstado === "pagado" ? 'text-yellow-500 border-b-2 border-yellow-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`}>
            🟡 Pendientes ({filtroEstado === "pagado" ? totalPagos : '-'})
          </button>
          <button onClick={() => setFiltroEstado("confirmado")} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${filtroEstado === "confirmado" ? 'text-green-500 border-b-2 border-green-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`}>
            🟢 Confirmados ({filtroEstado === "confirmado" ? totalPagos : '-'})
          </button>
          <button onClick={() => setFiltroEstado("rechazado")} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${filtroEstado === "rechazado" ? 'text-red-500 border-b-2 border-red-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`}>
            🔴 Rechazados ({filtroEstado === "rechazado" ? totalPagos : '-'})
          </button>
        </div>

        <div className="p-6">
          {cargando ? (
            <div className="text-center py-10 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Cargando datos...</div>
          ) : pagosFiltrados.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                {busqueda ? "No hay resultados para tu búsqueda." : "No hay reportes en esta categoría."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pagosFiltrados.map(pago => (
                <div key={pago.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-6 items-start hover:border-slate-700 transition-colors shadow-lg">
                  
                  <div 
                    className="w-full md:w-32 h-32 bg-slate-900 rounded-xl overflow-hidden cursor-pointer border border-slate-700 flex-shrink-0 group relative shadow-inner"
                    onClick={() => setModalImagen(pago.comprobanteUrl)}
                  >
                    <img src={pago.comprobanteUrl} alt="Comprobante" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-2xl font-black">🔍</span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-3">
                    
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-black text-white uppercase text-lg leading-none">{pago.nombreCliente}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                          📅 {pago.fecha ? new Date(pago.fecha.toDate()).toLocaleString('es-VE') : "Fecha no registrada"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-green-500 text-2xl leading-none">${pago.montoUsd?.toFixed(2)}</span>
                        {pago.montoBs && (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Bs. {pago.montoBs.toLocaleString('es-VE')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest">
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/50">
                        <span className="block text-slate-600 mb-0.5">Transacción</span>
                        <span className="text-blue-400">{pago.metodoPago}</span> <span className="text-slate-300">• REF: {pago.referencia}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/50">
                        <span className="block text-slate-600 mb-0.5">Contacto WhatsApp</span>
                        <a href={`https://wa.me/${pago.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 flex items-center gap-1 transition-colors">
                          <span className="text-xs">💬</span> {pago.whatsapp}
                        </a>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mr-2 block mb-1">Boletos Adquiridos ({pago.cantidadTickets}):</span>
                      <div className="flex flex-wrap gap-1">
                        {pago.tickets?.map(t => (
                          <span key={t} className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                            busqueda && t.includes(busqueda) 
                            ? 'bg-yellow-500/30 text-yellow-400 border-yellow-500/50' 
                            : 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {filtroEstado === "pagado" && (
                    <div className="flex w-full md:w-32 flex-row md:flex-col gap-2 flex-shrink-0 mt-4 md:mt-0">
                      <button onClick={() => aprobarPago(pago)} className="flex-1 bg-green-600 text-white hover:bg-green-500 px-4 py-3 md:py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-green-900/20 active:scale-95">
                        ✅ Aprobar Pago
                      </button>
                      <button onClick={() => rechazarPago(pago)} className="flex-1 bg-slate-800 text-red-500 border border-red-500/20 hover:bg-red-900/30 px-4 py-3 md:py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                        ❌ Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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