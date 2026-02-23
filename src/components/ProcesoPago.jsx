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
  // --- ESTADOS (SIN CAMBIOS) ---
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState(""); 
  const [metodo, setMetodo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
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

  // --- LÓGICA DE LIMPIEZA (SIN CAMBIOS) ---
  const ejecutarLimpiezaReservasAntiguas = async () => {
    try {
      const tiempoLimite = Date.now() - (30 * 60 * 1000); 
      const q = query(collection(db, "reservas"), where("expiracion", "<", tiempoLimite));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (error) { console.error("Error en autolimpieza:", error); }
  };

  useEffect(() => {
    const limpiarReserva = async () => { if (reservaId) await deleteDoc(doc(db, "reservas", reservaId)).catch(() => {}); };
    const handleBeforeUnload = () => { if (reservaId) limpiarReserva(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (reservaId) limpiarReserva();
    };
  }, [reservaId]);

  const mostrarAviso = (tipo, mensaje) => { setModalStatus({ visible: true, tipo, mensaje }); };

  const generarHashSeguridad = (data) => {
    const payload = `${data.nombre}-${data.referencia}-${data.whatsapp}-${data.montoUsd}-${data.tickets.join(',')}-${SECRET_KEY}`;
    return CryptoJS.SHA256(payload).toString();
  };

  const abrirModalConfirmacion = async (e) => {
    e.preventDefault();
    if (cantidad < 1) return mostrarAviso('error', 'La cantidad debe ser al menos 1.');
    if (!archivo || !metodo || !referencia) return mostrarAviso('error', 'Por favor rellena todos los campos.');

    let numLimpio = whatsapp.replace(/\D/g, ''); 
    if (numLimpio.startsWith('0')) numLimpio = numLimpio.substring(1); 
    if (!numLimpio.startsWith('58')) numLimpio = '58' + numLimpio; 
    
    if (numLimpio.length !== 12) return mostrarAviso('error', 'WhatsApp inválido. Debe tener 11 dígitos.');

    setCargando(true);
    try {
      await ejecutarLimpiezaReservasAntiguas();
      const qRef = query(collection(db, "pagos"), where("referencia", "==", referencia), where("metodoPago", "==", metodo));
      const resRef = await getDocs(qRef);
      if (!resRef.empty) { setCargando(false); return mostrarAviso('error', 'Esta referencia ya fue usada.'); }

      const qVendidos = query(collection(db, "pagos"), where("rifaId", "==", rifaId));
      const snapVendidos = await getDocs(qVendidos);
      let ocupados = new Set();
      snapVendidos.forEach(doc => doc.data().tickets?.forEach(n => ocupados.add(n.toString())));

      const snapReservas = await getDocs(query(collection(db, "reservas"), where("rifaId", "==", rifaId)));
      snapReservas.forEach(doc => {
        const data = doc.data();
        if (data.expiracion > Date.now()) data.tickets?.forEach(n => ocupados.add(n.toString()));
      });

      let disponibles = [];
      for (let i = 0; i < maxTickets; i++) {
        const n = i.toString().padStart(digitos, '0');
        if (!ocupados.has(n)) disponibles.push(n);
      }

      if (disponibles.length < cantidad) { setCargando(false); return mostrarAviso('error', `Solo quedan ${disponibles.length} números.`); }

      const asignados = [];
      for (let i = 0; i < cantidad; i++) {
        const index = Math.floor(Math.random() * disponibles.length);
        asignados.push(disponibles.splice(index, 1)[0]);
      }

      const docReserva = await addDoc(collection(db, "reservas"), {
        rifaId, tickets: asignados, expiracion: Date.now() + 600000, createdAt: serverTimestamp()
      });

      setReservaId(docReserva.id);
      setTicketsTemporales(asignados);
      setWhatsappFormateado(numLimpio); 
      setMostrarConfirmacion(true); 
    } catch (error) { console.error(error); mostrarAviso('error', 'Error al reservar números.'); }
    finally { setCargando(false); }
  };

  const ejecutarEnvio = async () => {
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
      setPagoExitoso(true); 
    } catch (error) {
      console.error(error);
      setMostrarConfirmacion(false);
      mostrarAviso('error', 'Error al procesar el pago.');
    } finally {
      setCargando(false);
    }
  };

  const cancelarYLibrear = async () => {
    setMostrarConfirmacion(false);
    if (reservaId) { await deleteDoc(doc(db, "reservas", reservaId)); setReservaId(null); }
    setTicketsTemporales([]);
  };

  const limpiarTodoYSalir = () => {
    setMostrarConfirmacion(false);
    setPagoExitoso(false);
    setNombre("");
    setWhatsapp("");
    setMetodo("");
    setReferencia("");
    setArchivo(null);
    setCantidad(1);
    setTicketsTemporales([]);
    setReservaId(null);
  };

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1: CANTIDAD DARK */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl border border-slate-700/50">
        <h2 className="text-xl font-black text-white mb-4 italic uppercase">1. Cantidad de boletos</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 5, 10, 20, 50, 100].map(num => (
            <button key={num} type="button" onClick={() => setCantidad(num)}
              className={`py-3 rounded-2xl font-black transition-all active:scale-95 ${cantidad === num ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'}`}>
              +{num}
            </button>
          ))}
        </div>
        <input type="number" value={cantidad} onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full p-4 bg-slate-950/50 border-2 border-dashed border-slate-700 rounded-2xl text-center font-black text-2xl outline-none text-blue-500 focus:border-blue-600 transition-colors" />
        
        <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center p-5 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Total Divisas</span>
                <span className="text-3xl font-black text-blue-500">${totalUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-5 bg-blue-600 rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.3)]">
                <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Monto en Bs.</span>
                <span className="text-2xl font-black text-white">{totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-xs text-slate-500 italic">• Tasa Oficial BCV •</p>
        </div>
      </div>

      {/* SECCIÓN 2: FORMULARIO DARK */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl border border-slate-700/50">
        <h2 className="text-xl font-black text-white mb-4 italic uppercase">2. Confirmar Pago</h2>
        <form onSubmit={abrirModalConfirmacion} className="space-y-4">
          <input type="text" placeholder="Nombre completo" required value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none font-bold text-white focus:border-blue-600 transition-all placeholder:text-slate-600" />
          
          <div className="relative flex items-center">
            <span className="absolute left-4 font-black text-blue-500 border-r border-slate-800 pr-3">+58</span>
            <input type="tel" placeholder="0412 000 0000" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full p-4 pl-16 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none font-bold text-white focus:border-blue-600 transition-all placeholder:text-slate-600" />
          </div>

          <select required value={metodo} onChange={(e) => setMetodo(e.target.value)}
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-black text-slate-300 outline-none focus:border-blue-600">
            <option value="" disabled className="bg-slate-900">-- Método de pago --</option>
            <option value="pagomovil" className="bg-slate-900 text-white">Pago Móvil (Bs)</option>
            <option value="zelle" className="bg-slate-900 text-white">Zelle (USD)</option>
            <option value="binance" className="bg-slate-900 text-white">Binance Pay</option>
          </select>

          {metodo && (
            <div className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-xs font-bold text-slate-300 animate-in fade-in slide-in-from-top-2">
              <h3 className="font-black text-blue-500 uppercase mb-1 italic">Transferir a:</h3>
              {metodo === "pagomovil" && <p>{datosCuentas.pagomovil.banco} | {datosCuentas.pagomovil.tlf} | {datosCuentas.pagomovil.ci}</p>}
              {metodo === "zelle" && <p>{datosCuentas.zelle.correo} | {datosCuentas.zelle.titular}</p>}
              {metodo === "binance" && <p>ID: {datosCuentas.binance.id}</p>}
            </div>
          )}

          <input type="text" placeholder="Número de Referencia" required value={referencia} onChange={(e) => setReferencia(e.target.value)}
            className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none font-bold text-white focus:border-blue-600 transition-all placeholder:text-slate-600" />

          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${archivo ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-950/50 hover:bg-slate-900'}`}>
            <span className="text-3xl mb-1">{archivo ? '✅' : '📸'}</span>
            <p className="text-[10px] font-black text-slate-500 uppercase">{archivo ? archivo.name : 'Subir Captura'}</p>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => setArchivo(e.target.files[0])} />
          </label>

          <button type="submit" disabled={cargando} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-500 active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-50">
            {cargando ? 'Procesando...' : 'Finalizar Reporte'}
          </button>
        </form>
      </div>

     {/* --- MODAL DE CONFIRMACIÓN / ÉXITO DARK --- */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-black/95 backdrop-blur-xl">
          <div className="bg-slate-900 w-full max-w-xs rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden border border-slate-800 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-950 p-4 text-center text-blue-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
              {pagoExitoso ? '✅ Reporte Exitoso' : 'Confirma tus datos'}
            </div>
            
            <div className="p-5">
              <div className="space-y-2 bg-slate-950/50 p-4 rounded-2xl mb-4 border border-slate-800">
                <div className="flex justify-between border-b border-slate-800/50 pb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Rifa</span>
                  <span className="text-[10px] font-bold uppercase truncate ml-4 text-slate-200">{rifaId || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Cliente</span>
                  <span className="text-[10px] font-bold uppercase truncate ml-4 text-slate-200">{nombre}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">WhatsApp</span>
                  <span className="text-[10px] font-bold text-slate-200">{whatsappFormateado}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Método</span>
                  <span className="text-[10px] font-bold uppercase text-slate-200">{metodo}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Referencia</span>
                  <span className="text-[10px] font-bold uppercase text-slate-200">{referencia}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Tickets</span>
                  <span className="text-md font-black text-blue-500">{cantidad}</span>
                </div>

                <div className="py-2">
                  <span className="text-[8px] font-black text-slate-600 uppercase block mb-2 text-center">Números Reservados</span>
                  <div className="flex flex-wrap justify-center gap-1 max-h-24 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {ticketsTemporales.length > 0 ? (
                      ticketsTemporales.map((t, idx) => (
                        <span key={idx} className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-2 py-1 rounded-md border border-blue-500/20">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] font-bold text-slate-700 italic">Generando...</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 space-y-1">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-slate-500">Total Divisas</span>
                    <span className="text-lg font-black text-blue-500">${totalUSD.toFixed(2)}</span>
                  </div>
                  {metodo === "pagomovil" && (
                    <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase opacity-80">Monto en Bs.</span>
                        <span className="text-lg font-black">{totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {!pagoExitoso ? (
                  <>
                    <button onClick={ejecutarEnvio} disabled={cargando} 
                      className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${cargando ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'}`}>
                      {cargando ? 'PROCESANDO...' : 'SÍ, ENVIAR ✅'}
                    </button>
                    {!cargando && (
                      <button onClick={cancelarYLibrear} className="w-full text-slate-600 py-1 font-black uppercase text-[8px] tracking-widest">
                        CANCELAR Y LIBERAR
                      </button>
                    )}
                  </>
                ) : (
                  <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] text-center shadow-lg">
                      ¡REPORTE ENVIADO! 🎟️
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-center">
                       <p className="text-[10px] text-blue-400 font-black uppercase">
                         📸 ¡TOMA CAPTURA AHORA!
                       </p>
                       <p className="text-[8px] text-slate-500 font-bold mt-1">
                         Guarda tus números. Verificaremos a la brevedad.
                       </p>
                    </div>
                    <button onClick={limpiarTodoYSalir} 
                      className="w-full text-slate-400 py-2 font-black uppercase text-[9px] underline tracking-widest">
                      CERRAR Y FINALIZAR
                    </button>
                  </div>
                )}
                <p className="text-[7px] text-center text-slate-700 mt-2 font-black uppercase tracking-[0.2em]">👑 ganaconjuvenil.com 👑</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL STATUS DARK */}
      {modalStatus.visible && modalStatus.tipo === 'error' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-xs rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-8 border border-slate-800">
            <div className="text-4xl mb-4">⚠️</div>
            <h4 className="text-xl font-black text-white uppercase italic">¡ERROR!</h4>
            <div className="w-8 h-1 bg-red-500 mx-auto my-3 rounded-full"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 leading-relaxed">{modalStatus.mensaje}</p>
            <button onClick={() => setModalStatus({ ...modalStatus, visible: false })} className="w-full py-4 rounded-2xl font-black text-white bg-blue-600 uppercase text-[10px] tracking-widest shadow-lg">ENTENDIDO</button>
          </div>
        </div>
      )}
    </div>
  );
}