import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import CryptoJS from 'crypto-js';

export default function ProcesoPago({ 
  rifaId, 
  precioTicket = 0, 
  tasaExterna = 1, 
  maxTickets = 1000 
}) {
  // --- ESTADOS ---
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState(""); 
  const [metodo, setMetodo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [whatsappFormateado, setWhatsappFormateado] = useState(""); 
  const [ticketsTemporales, setTicketsTemporales] = useState([]);
  const [reservaId, setReservaId] = useState(null);
  const [modalStatus, setModalStatus] = useState({ visible: false, tipo: '', mensaje: '' });

  const SECRET_KEY = import.meta.env.VITE_SECRET_KEY; 
  const API_KEY_IMGBB = import.meta.env.VITE_IMGBB_KEY;
  const digitos = maxTickets ? maxTickets.toString().length : 3;

  const datosCuentas = {
    pagomovil: { banco: "Banesco", tlf: "04241234567", ci: "20.123.456" },
    zelle: { correo: "pagos@tuweb.com", titular: "Nombre de Empresa" },
    binance: { id: "987654321", email: "user@binance.com" }
  };

  const totalUSD = (Number(cantidad) || 0) * precioTicket;
  const totalBS = tasaExterna ? totalUSD * tasaExterna : 0;

  // --- LÓGICA DE LIMPIEZA PROFUNDA (RESERVAS > 30 MIN) ---
  const ejecutarLimpiezaReservasAntiguas = async () => {
    try {
      const tiempoLimite = Date.now() - (30 * 60 * 1000); 
      const q = query(collection(db, "reservas"), where("expiracion", "<", tiempoLimite));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        console.log("🧹 Limpieza física completada");
      }
    } catch (error) {
      console.error("Error en autolimpieza:", error);
    }
  };

  // Intento de limpieza al cerrar/recargar
  useEffect(() => {
    const limpiarReserva = async () => {
      if (reservaId) {
        await deleteDoc(doc(db, "reservas", reservaId)).catch(() => {}); 
      }
    };
    const handleBeforeUnload = () => { if (reservaId) limpiarReserva(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (reservaId) limpiarReserva();
    };
  }, [reservaId]);

  const mostrarAviso = (tipo, mensaje) => {
    setModalStatus({ visible: true, tipo, mensaje });
  };

  const generarHashSeguridad = (data) => {
    const payload = `${data.nombre}-${data.referencia}-${data.whatsapp}-${data.montoUsd}-${data.tickets.join(',')}-${SECRET_KEY}`;
    return CryptoJS.SHA256(payload).toString();
  };

  // --- PASO 1: RESERVAR Y LIMPIAR ---
  const abrirModalConfirmacion = async (e) => {
    e.preventDefault();
    if (cantidad < 1) return mostrarAviso('error', 'La cantidad debe ser al menos 1.');
    if (!archivo || !metodo || !referencia) return mostrarAviso('error', 'Por favor rellena todos los campos.');

    let numLimpio = whatsapp.replace(/\D/g, ''); 
    if (numLimpio.startsWith('0')) numLimpio = numLimpio.substring(1); 
    if (!numLimpio.startsWith('58')) numLimpio = '58' + numLimpio; 
    
    if (numLimpio.length !== 12) {
      return mostrarAviso('error', 'WhatsApp inválido. Debe tener 11 dígitos.');
    }

    setCargando(true);

    try {
      await ejecutarLimpiezaReservasAntiguas();

      const qRef = query(collection(db, "pagos"), where("referencia", "==", referencia), where("metodoPago", "==", metodo));
      const resRef = await getDocs(qRef);
      if (!resRef.empty) {
        setCargando(false);
        return mostrarAviso('error', 'Esta referencia ya fue usada.');
      }

      const qVendidos = query(collection(db, "pagos"), where("rifaId", "==", rifaId));
      const snapVendidos = await getDocs(qVendidos);
      let ocupados = new Set();
      snapVendidos.forEach(doc => doc.data().tickets?.forEach(n => ocupados.add(n.toString())));

      const snapReservas = await getDocs(query(collection(db, "reservas"), where("rifaId", "==", rifaId)));
      snapReservas.forEach(doc => {
        const data = doc.data();
        if (data.expiracion > Date.now()) {
          data.tickets?.forEach(n => ocupados.add(n.toString()));
        }
      });

      let disponibles = [];
      for (let i = 0; i < maxTickets; i++) {
        const n = i.toString().padStart(digitos, '0');
        if (!ocupados.has(n)) disponibles.push(n);
      }

      if (disponibles.length < cantidad) {
        setCargando(false);
        return mostrarAviso('error', `Solo quedan ${disponibles.length} números.`);
      }

      const asignados = [];
      for (let i = 0; i < cantidad; i++) {
        const index = Math.floor(Math.random() * disponibles.length);
        asignados.push(disponibles.splice(index, 1)[0]);
      }

      const docReserva = await addDoc(collection(db, "reservas"), {
        rifaId,
        tickets: asignados,
        expiracion: Date.now() + 600000, 
        createdAt: serverTimestamp()
      });

      setReservaId(docReserva.id);
      setTicketsTemporales(asignados);
      setWhatsappFormateado(numLimpio); 
      setMostrarConfirmacion(true); 

    } catch (error) {
      console.error(error);
      mostrarAviso('error', 'Error al reservar números.');
    } finally {
      setCargando(false);
    }
  };

  const ejecutarEnvio = async () => {
    setMostrarConfirmacion(false);
    setCargando(true);

    try {
      const formData = new FormData();
      formData.append("image", archivo);
      const resImg = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY_IMGBB}`, { method: "POST", body: formData });
      const dataImg = await resImg.json();

      const hash = generarHashSeguridad({
        nombre, referencia, whatsapp: whatsappFormateado, montoUsd: totalUSD, tickets: ticketsTemporales
      });

      await addDoc(collection(db, "pagos"), {
        nombreCliente: nombre,
        whatsapp: whatsappFormateado,
        metodoPago: metodo,
        referencia: referencia,
        comprobanteUrl: dataImg.data.url,
        rifaId,
        cantidadTickets: Number(cantidad),
        tickets: ticketsTemporales,
        montoUsd: totalUSD,
        montoBs: totalBS,
        tasaReferencia: tasaExterna,
        estado: "pendiente",
        fecha: new Date(),
        integrityHash: hash 
      });

      if (reservaId) await deleteDoc(doc(db, "reservas", reservaId));

      // MENSAJE DE ÉXITO ORIGINAL RESTAURADO
      mostrarAviso('exito', `¡Pago enviado! \n 🎟️Recuerde que le enviaremos un mensaje por WhatsApp con sus números asignados una vez verifiquemos el pago.🎟️`);
      
      setNombre(""); setWhatsapp(""); setMetodo(""); setReferencia(""); setArchivo(null); 
      setCantidad(1); setTicketsTemporales([]); setReservaId(null);
    } catch (error) {
      console.error(error);
      mostrarAviso('error', 'Error al procesar el pago.');
    } finally {
      setCargando(false);
    }
  };

  const cancelarYLibrear = async () => {
    setMostrarConfirmacion(false);
    if (reservaId) {
      await deleteDoc(doc(db, "reservas", reservaId));
      setReservaId(null);
    }
    setTicketsTemporales([]);
  };

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1: CANTIDAD */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-[3px] border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-4 italic uppercase">1. Cantidad de boletos</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 5, 10, 20, 50, 100].map(num => (
            <button key={num} type="button" onClick={() => setCantidad(num)}
              className={`py-3 rounded-2xl font-black transition-all border-b-4 active:border-b-0 active:translate-y-1 ${cantidad === num ? 'bg-blue-600 text-white border-blue-800' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>
              +{num}
            </button>
          ))}
        </div>
        <input type="number" value={cantidad} onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center font-black text-2xl outline-none" />
        
        <div className="mt-4 space-y-2 text-white">
            <div className="flex justify-between items-center p-5 bg-slate-900 rounded-2xl">
                <span className="text-[10px] uppercase font-bold opacity-50">Total Divisas</span>
                <span className="text-3xl font-black text-blue-400">${totalUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-5 bg-blue-600 rounded-2xl shadow-lg">
                <span className="text-[10px] font-bold opacity-80 uppercase">Monto en Bs.</span>
                <span className="text-2xl font-black">{totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
      </div>

      {/* SECCIÓN 2: FORMULARIO */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-[3px] border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-4 italic uppercase">2. Confirmar Pago</h2>
        <form onSubmit={abrirModalConfirmacion} className="space-y-4">
          <input type="text" placeholder="Nombre completo" required value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" />
          
          <div className="relative flex items-center">
            <span className="absolute left-4 font-black text-slate-400 border-r-2 border-slate-200 pr-3">+58</span>
            <input type="tel" placeholder="0412 000 0000" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full p-4 pl-16 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" />
          </div>

          <select required value={metodo} onChange={(e) => setMetodo(e.target.value)}
            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none">
            <option value="" disabled>-- Método de pago --</option>
            <option value="pagomovil">Pago Móvil (Bs)</option>
            <option value="zelle">Zelle (USD)</option>
            <option value="binance">Binance Pay</option>
          </select>

          {metodo && (
            <div className="p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl text-xs font-bold text-slate-700">
              <h3 className="font-black text-blue-600 uppercase mb-1 italic">Transferir a:</h3>
              {metodo === "pagomovil" && <p>{datosCuentas.pagomovil.banco} | {datosCuentas.pagomovil.tlf} | {datosCuentas.pagomovil.ci}</p>}
              {metodo === "zelle" && <p>{datosCuentas.zelle.correo} | {datosCuentas.zelle.titular}</p>}
              {metodo === "binance" && <p>ID: {datosCuentas.binance.id}</p>}
            </div>
          )}

          <input type="text" placeholder="Número de Referencia" required value={referencia} onChange={(e) => setReferencia(e.target.value)}
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" />

          <label className={`flex flex-col items-center justify-center w-full h-32 border-4 border-dashed rounded-2xl cursor-pointer transition-all ${archivo ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
            <span className="text-3xl mb-1">{archivo ? '✅' : '📸'}</span>
            <p className="text-[10px] font-black text-slate-400 uppercase">{archivo ? archivo.name : 'Subir Captura'}</p>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => setArchivo(e.target.files[0])} />
          </label>

          <button type="submit" disabled={cargando} className="w-full bg-green-500 text-white font-black py-5 rounded-2xl shadow-xl border-b-4 border-green-700 uppercase">
            {cargando ? 'Procesando...' : 'Finalizar Reporte'}
          </button>
        </form>
      </div>

      {/* --- MODAL DE CONFIRMACIÓN --- */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-center text-white font-black uppercase tracking-widest">Confirma tus datos</div>
            <div className="p-8">
              <div className="space-y-3 bg-slate-50 p-6 rounded-3xl mb-6">
                <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">Cliente</span><span className="text-sm font-bold uppercase">{nombre}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">WhatsApp</span><span className="text-sm font-bold">+{whatsappFormateado}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">Tickets</span><span className="text-lg font-black">{cantidad}</span></div>
                
                <div className="mt-4 space-y-2">
                  <div className="bg-slate-900 p-4 rounded-2xl text-white flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase opacity-60">Total USD</span>
                    <span className="text-xl font-black text-blue-400">${totalUSD.toFixed(2)}</span>
                  </div>
                  {metodo === "pagomovil" && (
                    <div className="bg-blue-600 p-4 rounded-2xl text-white flex justify-between items-center shadow-lg">
                      <span className="text-[10px] font-black uppercase opacity-80">Monto en Bs.</span>
                      <span className="text-lg font-black">{totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-center text-slate-400 mb-4 font-bold uppercase italic">Los números seleccionados estarán apartados para ti mientras este modal esté abierto.</p>
              <button onClick={ejecutarEnvio} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs">SÍ, ENVIAR ✅</button>
              <button onClick={cancelarYLibrear} className="w-full text-slate-400 py-2 font-black uppercase text-[10px] mt-2">CANCELAR Y LIBERAR</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL STATUS --- */}
      {modalStatus.visible && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-8">
            <div className="text-5xl mb-4">{modalStatus.tipo === 'exito' ? '✅' : '⚠️'}</div>
            <h4 className="text-xl font-black text-slate-900 uppercase">{modalStatus.tipo === 'exito' ? '¡LISTO!' : '¡ERROR!'}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase mb-6 leading-relaxed whitespace-pre-line">{modalStatus.mensaje}</p>
            <button onClick={() => setModalStatus({ ...modalStatus, visible: false })} className="w-full py-4 rounded-2xl font-black text-white bg-slate-900 uppercase text-[10px]">ENTENDIDO</button>
          </div>
        </div>
      )}
    </div>
  );
}