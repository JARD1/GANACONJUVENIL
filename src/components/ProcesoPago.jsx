import React, { useState } from 'react';
import { db } from '../firebase'; 
import { collection, query, where, getDocs, doc, addDoc, runTransaction, serverTimestamp, writeBatch, orderBy, limit } from "firebase/firestore";
import CryptoJS from 'crypto-js';
import emailjs from '@emailjs/browser';

export default function ProcesoPago({ 
  rifaId, 
  precioTicket = 0, 
  tasaExterna = 1 
}) {
  // PASOS DEL FLUJO: 1 (Datos), 2 (Verificación), 3 (Pago), 4 (Éxito)
  const [paso, setPaso] = useState(1);
  
  // DATOS DEL USUARIO
  const [cantidad, setCantidad] = useState(2); // Inicia en 2 por tu regla de compra mínima
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState(""); 
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  
  // VERIFICACIÓN
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [codigoInput, setCodigoInput] = useState("");
  
  // PAGO
  const [metodo, setMetodo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [archivo, setArchivo] = useState(null);
  
  // SISTEMA
  const [cargando, setCargando] = useState(false);
  const [ticketsTemporales, setTicketsTemporales] = useState([]);
  const [whatsappFormateado, setWhatsappFormateado] = useState(""); 
  const [modalStatus, setModalStatus] = useState({ visible: false, tipo: '', mensaje: '' });

  // VARIABLES DE ENTORNO
  const SECRET_KEY = import.meta.env.VITE_SECRET_KEY; 
  const API_KEY_IMGBB = import.meta.env.VITE_IMGBB_KEY;
  const EMAILJS_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_PIN = import.meta.env.VITE_EMAILJS_TEMPLATE_PIN;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const datosCuentas = {
    pagomovil: { banco: "Banesco", tlf: "04241234567", ci: "20.123.456" },
    zelle: { correo: "pagos@tuweb.com", titular: "Nombre de Empresa" },
    binance: { id: "987654321", email: "user@binance.com" }
  };

  const totalUSD = (Number(cantidad) || 0) * precioTicket;
  const totalBS = tasaExterna ? totalUSD * tasaExterna : 0;

  const mostrarAviso = (tipo, mensaje) => { setModalStatus({ visible: true, tipo, mensaje }); };

  // --- PASO 1: ASIGNACIÓN SECUENCIAL OPTIMIZADA (MENOR A MAYOR) ---
  const procesarPaso1 = async (e) => {
    e.preventDefault();
    if (cantidad < 2) return mostrarAviso('error', 'La compra mínima es de 2 boletos.');
    
    let numLimpio = whatsapp.replace(/\D/g, ''); 
    if (numLimpio.startsWith('0')) numLimpio = numLimpio.substring(1); 
    if (!numLimpio.startsWith('58')) numLimpio = '58' + numLimpio; 
    if (numLimpio.length !== 12) return mostrarAviso('error', 'WhatsApp inválido.');

    setCargando(true);
    try {
      // 1. BÚSQUEDA SECUENCIAL INTELIGENTE
      const ticketsRef = collection(db, "rifas", rifaId, "tickets");
      const qDisponibles = query(
        ticketsRef, 
        where("estado", "==", "disponible"),
        orderBy("numero", "asc"), // De menor a mayor siempre
        limit(Number(cantidad))   // Solo pide los necesarios
      );
      
      const snapshot = await getDocs(qDisponibles);

      if (snapshot.docs.length < cantidad) {
        throw new Error(`Lo sentimos, solo quedan ${snapshot.docs.length} tickets disponibles.`);
      }

      // 2. Transacción Segura en Firebase
      const asignados = await runTransaction(db, async (transaction) => {
        const comprobaciones = [];
        for (const docSnap of snapshot.docs) {
          const ref = doc(db, "rifas", rifaId, "tickets", docSnap.id);
          const snap = await transaction.get(ref);
          comprobaciones.push({ snap, ref, numero: docSnap.data().numero });
        }

        for (const item of comprobaciones) {
          if (item.snap.data().estado !== "disponible") {
            throw new Error("Colisión de red. Alguien tomó un número en este instante. Intenta de nuevo.");
          }
        }

        for (const item of comprobaciones) {
          transaction.update(item.ref, { 
            estado: "reservado",
            reservadoPor: numLimpio
          });
        }

        return comprobaciones.map(item => item.numero);
      });

      // 3. Generar PIN de 4 dígitos
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      setCodigoGenerado(pin);
      
      // ENVÍO DE CORREO REAL CON EMAILJS Y VARIABLES DE ENTORNO
      try {
        await emailjs.send(
          EMAILJS_SERVICE,
          EMAILJS_TEMPLATE_PIN,
          {
            to_email: correo,
            pin: pin,
          },
          EMAILJS_PUBLIC_KEY
        );
        console.log("Correo de PIN enviado con éxito");
      } catch (err) {
        console.error("Error enviando el correo:", err);
        return mostrarAviso('error', 'Hubo un error al enviar el código a tu correo. Por favor, verifica que esté bien escrito.');
      }

      setTicketsTemporales(asignados);
      setWhatsappFormateado(numLimpio);
      setPaso(2); // Ir al paso del PIN
    } catch (error) {
      console.error("Error detallado:", error);
      mostrarAviso('error', error.message || 'Error al asignar números.');
    } finally {
      setCargando(false);
    }
  };

  // --- PASO 2: VERIFICAR PIN ---
  const procesarPaso2 = (e) => {
    e.preventDefault();
    if (codigoInput === codigoGenerado) {
      setPaso(3); 
    } else {
      mostrarAviso('error', 'Código de seguridad incorrecto.');
    }
  };

  // --- PASO 3: ENVIAR PAGO ---
  const ejecutarEnvioPago = async (e) => {
    e.preventDefault();
    if (!archivo || !metodo || !referencia) return mostrarAviso('error', 'Completa los datos de pago y sube el comprobante.');
    
    setCargando(true);
    try {
      const qRef = query(collection(db, "pagos"), where("referencia", "==", referencia), where("metodoPago", "==", metodo));
      const resRef = await getDocs(qRef);
      if (!resRef.empty) throw new Error('Esta referencia ya fue usada en nuestro sistema.');

      // Subir imagen a ImgBB
      const formData = new FormData();
      formData.append("image", archivo);
      const resImg = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY_IMGBB}`, { method: "POST", body: formData });
      const dataImg = await resImg.json();

      // Sello de seguridad para evitar hackeos
      const hash = CryptoJS.SHA256(`${nombre}-${referencia}-${whatsappFormateado}-${totalUSD}-${ticketsTemporales.join(',')}-${SECRET_KEY}`).toString();

      // Guardar el reporte
      await addDoc(collection(db, "pagos"), {
        nombreCliente: nombre,
        whatsapp: whatsappFormateado,
        correo: correo,
        direccion: direccion,
        metodoPago: metodo,
        referencia: referencia,
        comprobanteUrl: dataImg.data.url,
        rifaId,
        cantidadTickets: Number(cantidad),
        tickets: ticketsTemporales,
        montoUsd: totalUSD,
        montoBs: totalBS,
        tasaReferencia: tasaExterna,
        estado: "pagado", 
        fecha: serverTimestamp(),
        integrityHash: hash 
      });

      // Pasar tickets de "reservado" a "pagado"
      const batch = writeBatch(db);
      ticketsTemporales.forEach(num => {
        const tRef = doc(db, "rifas", rifaId, "tickets", num);
        batch.update(tRef, { estado: "pagado" });
      });
      await batch.commit();

      setPaso(4); 
    } catch (error) {
      mostrarAviso('error', error.message || 'Error al enviar el reporte.');
    } finally {
      setCargando(false);
    }
  };

  // --- FUNCIÓN PARA CANCELAR Y LIBERAR TICKETS ---
  const cancelarCompra = async () => {
    setCargando(true);
    try {
      if (ticketsTemporales.length > 0) {
        const batch = writeBatch(db);
        ticketsTemporales.forEach(num => {
          const tRef = doc(db, "rifas", rifaId, "tickets", num);
          batch.update(tRef, { estado: "disponible", reservadoPor: null });
        });
        await batch.commit();
      }
      // Resetear todo al paso 1
      setPaso(1);
      setTicketsTemporales([]);
      setCodigoInput("");
      setArchivo(null);
      setReferencia("");
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ==================== PASO 1: DATOS PERSONALES ==================== */}
      {paso === 1 && (
        <form onSubmit={procesarPaso1} className="space-y-6">
          <div className="bg-slate-900/80 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-slate-700/50">
            <h2 className="text-xl font-black text-white mb-6 italic uppercase border-b border-slate-800 pb-4">
              1. Selección y Datos
            </h2>
            
            {/* SECCIÓN DE CANTIDAD REFORZADA */}
            <div className="mb-8 space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em] block text-center md:text-left">
                ¿Cuántos boletos deseas? (Mínimo 2)
              </label>

              {/* SELECTOR CON INPUT EDITABLE */}
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-[2.5rem] border-2 border-slate-800 shadow-inner max-w-[280px] mx-auto md:mx-0">
                <button 
                  type="button"
                  onClick={() => setCantidad(Math.max(2, Number(cantidad) - 1))}
                  className="w-14 h-14 flex items-center justify-center bg-slate-900 text-white rounded-full border border-slate-700 active:scale-90 transition-transform text-2xl font-black shadow-lg"
                >
                  -
                </button>
                
                <div className="flex flex-col items-center">
                  {/* Input para modificar manualmente */}
                  <input 
                    type="number"
                    value={cantidad}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (isNaN(val)) {
                         setCantidad(""); 
                      } else {
                         setCantidad(val);
                      }
                    }}
                    onBlur={() => {
                      // Al salir del campo, forzamos el mínimo de 2
                      if (cantidad < 2 || cantidad === "") setCantidad(2);
                    }}
                    className="w-20 bg-transparent text-center text-3xl font-black text-blue-500 italic outline-none hide-arrows"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }} // Oculta las flechitas por defecto del input number
                  />
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Boletos</span>
                </div>

                <button 
                  type="button"
                  onClick={() => setCantidad(Number(cantidad) + 1)}
                  className="w-14 h-14 flex items-center justify-center bg-blue-600 text-white rounded-full border border-blue-400/30 active:scale-90 transition-transform text-2xl font-black shadow-lg shadow-blue-900/20"
                >
                  +
                </button>
              </div>

              {/* BOTONES DE SUMA RÁPIDA (Comportamiento Aditivo) */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[2, 5, 10, 20].map(num => (
                  <button 
                    key={num} 
                    type="button" 
                    onClick={() => setCantidad(Number(cantidad) + num)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 py-3 rounded-xl font-black text-xs transition-all active:scale-95 hover:border-blue-500/50 hover:text-blue-400"
                  >
                    +{num}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-600 text-center md:text-left italic font-bold">
                * Toca la cantidad para escribir, o usa los botones para sumar
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-1 block">Nombre Completo</label>
                  <input type="text" placeholder="Ej. Juan Pérez" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none font-bold text-white focus:border-blue-600 transition-all placeholder:text-slate-700 shadow-inner" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-1 block">WhatsApp</label>
                  <div className="flex items-stretch bg-slate-950/50 border border-slate-800 rounded-2xl focus-within:border-blue-600 transition-all shadow-inner overflow-hidden">
                    <div className="flex items-center justify-center px-4 border-r border-slate-800 bg-slate-900/80 text-blue-500 font-black text-sm select-none">
                      +58
                    </div>
                    <input type="tel" placeholder="0412 000 0000" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                      className="flex-1 w-full p-4 bg-transparent outline-none text-white font-bold placeholder:text-slate-700" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-1 block">Correo Electrónico (Verificación)</label>
                <input type="email" placeholder="tu@correo.com" required value={correo} onChange={(e) => setCorreo(e.target.value)}
                  className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none font-bold text-white focus:border-blue-600 transition-all placeholder:text-slate-700 shadow-inner" />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-1 block">Dirección Corta (Estado / Ciudad)</label>
                <input type="text" placeholder="Ej. Caracas, Distrito Capital" required value={direccion} onChange={(e) => setDireccion(e.target.value)}
                  className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none font-bold text-white focus:border-blue-600 transition-all placeholder:text-slate-700 shadow-inner" />
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <div className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Total USD</span>
                  <span className="text-2xl font-black text-blue-500">${totalUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Bs.</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-white">{totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Tasa BCV: {tasaExterna}</p>
                  </div>
              </div>
            </div>

            <button type="submit" disabled={cargando} className="w-full mt-6 bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50">
              {cargando ? 'Asignando Números...' : 'Generar Mis Números 🎟️'}
            </button>
          </div>
        </form>
      )}

      {/* ==================== PASO 2: VERIFICACIÓN Y NÚMEROS ==================== */}
      {paso === 2 && (
        <div className="bg-slate-900/80 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-blue-500/30 animate-in slide-in-from-right-8">
          <div className="text-center mb-6">
            <span className="inline-block bg-green-500/20 text-green-400 p-3 rounded-full text-2xl mb-3 border border-green-500/30">🎯</span>
            <h2 className="text-2xl font-black text-white uppercase italic">¡Números Reservados!</h2>
            <p className="text-slate-400 text-xs font-bold mt-2">Estos son tus boletos generados por el sistema:</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner mb-8">
            {ticketsTemporales.map(t => (
              <span key={t} className="bg-blue-600/20 text-blue-400 text-xl md:text-2xl font-black px-5 py-3 rounded-2xl border border-blue-500/30 shadow-lg transform rotate-[-2deg] hover:rotate-0 transition-transform">
                {t}
              </span>
            ))}
          </div>

          <form onSubmit={procesarPaso2} className="space-y-4 border-t border-slate-800 pt-6">
            <div className="text-center">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verificación de Seguridad</label>
              <p className="text-xs text-blue-400 mt-1 mb-4">Introduce el PIN de 4 dígitos enviado a <strong>{correo}</strong></p>
              
              <input type="text" placeholder="••••" maxLength={4} required value={codigoInput} onChange={(e) => setCodigoInput(e.target.value)}
                className="w-40 text-center text-4xl tracking-[0.5em] p-4 bg-slate-950 border-2 border-slate-700 rounded-2xl outline-none font-black text-white focus:border-blue-600 transition-all mx-auto block shadow-inner placeholder:text-slate-700" />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all uppercase tracking-widest text-[10px] mt-4">
              Verificar y Proceder al Pago ✅
            </button>
            <button type="button" onClick={cancelarCompra} className="w-full text-slate-500 hover:text-red-400 font-black py-3 uppercase tracking-widest text-[9px] transition-colors mt-2">
              Cancelar y Liberar Números
            </button>
          </form>
        </div>
      )}

      {/* ==================== PASO 3: REPORTE DE PAGO ==================== */}
      {paso === 3 && (
        <form onSubmit={ejecutarEnvioPago} className="bg-slate-900/80 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-slate-700/50 animate-in zoom-in-95">
          <h2 className="text-xl font-black text-white mb-6 italic uppercase border-b border-slate-800 pb-4">
            3. Confirmar Pago
          </h2>
          
          <div className="space-y-5">
            <select required value={metodo} onChange={(e) => setMetodo(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-black text-slate-300 outline-none focus:border-blue-600 appearance-none shadow-inner">
              <option value="" disabled>-- Selecciona Método de Pago --</option>
              <option value="pagomovil">Pago Móvil (Bs {totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })})</option>
              <option value="zelle">Zelle (${totalUSD.toFixed(2)})</option>
              <option value="binance">Binance Pay (${totalUSD.toFixed(2)})</option>
            </select>

            {metodo && (
              <div className="p-5 bg-blue-600/10 border border-blue-500/30 rounded-2xl text-xs font-bold text-slate-300 animate-in slide-in-from-top-2">
                <h3 className="font-black text-blue-500 uppercase mb-2 italic tracking-widest">Datos para transferir:</h3>
                {metodo === "pagomovil" && <div className="space-y-1"><p>Banco: {datosCuentas.pagomovil.banco}</p><p>Teléfono: {datosCuentas.pagomovil.tlf}</p><p>C.I: {datosCuentas.pagomovil.ci}</p></div>}
                {metodo === "zelle" && <div className="space-y-1"><p>Correo: {datosCuentas.zelle.correo}</p><p>Titular: {datosCuentas.zelle.titular}</p></div>}
                {metodo === "binance" && <p>Pay ID: {datosCuentas.binance.id}</p>}
              </div>
            )}

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-1 block">Número de Referencia</label>
              <input type="text" placeholder="Ej. 12345678" required value={referencia} onChange={(e) => setReferencia(e.target.value)}
                className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none font-bold text-white focus:border-blue-600 transition-all placeholder:text-slate-700 shadow-inner" />
            </div>

            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${archivo ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-950/50 hover:bg-slate-900'}`}>
              <span className="text-3xl mb-2">{archivo ? '✅' : '📸'}</span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">
                {archivo ? archivo.name : 'Subir Captura de Pago'}
              </p>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setArchivo(e.target.files[0])} />
            </label>

            <button type="submit" disabled={cargando} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all uppercase tracking-widest text-[11px] disabled:opacity-50 mt-4">
              {cargando ? 'Procesando Pago...' : 'Finalizar y Reportar Pago 🚀'}
            </button>
            <button type="button" onClick={cancelarCompra} disabled={cargando} className="w-full text-slate-500 hover:text-red-400 font-black py-3 uppercase tracking-widest text-[9px] transition-colors mt-2">
              Cancelar Compra
            </button>
          </div>
        </form>
      )}

      {/* ==================== PASO 4: ÉXITO (RECIBO DIGITAL PARA CAPTURA) ==================== */}
      {paso === 4 && (
        <div className="animate-in zoom-in duration-500 flex flex-col items-center w-full max-w-md mx-auto">
          
          <div className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            📸 Tómale captura a este recibo
          </div>

          <div className="bg-slate-950 w-full rounded-[2rem] border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden relative">
            <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-green-500 to-blue-600"></div>
            
            <div className="p-6 md:p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 border border-green-500/20 shadow-inner">
                  ✓
                </div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Reporte Exitoso</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {new Date().toLocaleString('es-VE')}
                </p>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-2xl text-center border border-slate-800/50 mb-6">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Monto Procesado</p>
                <h3 className="text-3xl font-black text-green-500">${totalUSD.toFixed(2)}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Bs. {totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="space-y-3 text-xs border-y border-dashed border-slate-800 py-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Cliente</span>
                  <span className="text-slate-200 font-black truncate max-w-[150px]">{nombre}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">WhatsApp</span>
                  <span className="text-slate-200 font-black">+{whatsappFormateado}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Transacción</span>
                  <span className="text-blue-400 font-black uppercase">{metodo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Referencia</span>
                  <span className="text-slate-200 font-black uppercase">{referencia}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Sorteo ID</span>
                  <span className="text-slate-400 font-black uppercase text-[10px]">{rifaId.slice(0, 10)}</span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">
                  Boletos Asignados ({cantidad})
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {ticketsTemporales.map(t => (
                    <span key={t} className="bg-blue-600/20 text-blue-400 text-sm md:text-base font-black px-3 py-1.5 rounded-lg border border-blue-500/30 shadow-inner">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 border-t border-slate-800 text-center">
               <p className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500">
                 © Gana con Juvenil • Sistema Validado
               </p>
            </div>
          </div>

          <button onClick={() => window.location.reload()} className="mt-6 w-full text-blue-400 hover:text-blue-300 font-black py-3 uppercase tracking-widest text-[10px] underline transition-colors">
            Finalizar y volver al inicio
          </button>
        </div>
      )}

      {/* MODAL STATUS DE ERROR */}
      {modalStatus.visible && modalStatus.tipo === 'error' && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-xs rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-8 border border-slate-800">
            <div className="text-4xl mb-4">⚠️</div>
            <h4 className="text-xl font-black text-white uppercase italic mb-3">¡Aviso!</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-6">{modalStatus.mensaje}</p>
            <button onClick={() => setModalStatus({ visible: false, tipo: '', mensaje: '' })} className="w-full py-4 rounded-xl font-black text-white bg-blue-600 uppercase text-[10px] tracking-widest shadow-lg active:scale-95">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}