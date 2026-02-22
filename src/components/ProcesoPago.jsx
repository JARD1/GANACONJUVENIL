import React, { useState } from 'react';
import { db } from '../firebase'; 
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export default function ProcesoPago({ rifaId, precioTicket, tasaExterna, errorTasaExterna }) {
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [metodo, setMetodo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  
  // Estados para Modales
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [whatsappFormateado, setWhatsappFormateado] = useState("");
  const [modalStatus, setModalStatus] = useState({ visible: false, tipo: '', mensaje: '' });

  const API_KEY_IMGBB = "ea37b1cb1475b5d9b8e4a6a92fa56c21";

  const datosCuentas = {
    pagomovil: { banco: "Banesco", tlf: "04241234567", ci: "20.123.456" },
    zelle: { correo: "pagos@tuweb.com", titular: "Nombre de Empresa" },
    binance: { id: "987654321", email: "user@binance.com" }
  };

  const totalUSD = (Number(cantidad) || 0) * precioTicket;
  const totalBS = tasaExterna ? totalUSD * tasaExterna : 0;

  // Función para mostrar avisos elegantes
  const mostrarAviso = (tipo, mensaje) => {
    setModalStatus({ visible: true, tipo, mensaje });
  };

  const abrirModalConfirmacion = (e) => {
    e.preventDefault();
    if (cantidad < 1) return mostrarAviso('error', 'La cantidad debe ser al menos 1.');
    if (!archivo) return mostrarAviso('error', 'Por favor, sube el comprobante de pago.');
    if (!metodo) return mostrarAviso('error', 'Selecciona un método de pago.');
    if (!referencia) return mostrarAviso('error', 'Ingresa el número de referencia.');

    let numLimpio = whatsapp.replace(/\D/g, '');
    if (numLimpio.startsWith('0')) numLimpio = numLimpio.substring(1);
    if (!numLimpio.startsWith('58')) numLimpio = '58' + numLimpio;

    if (numLimpio.length < 11) return mostrarAviso('error', 'El número de WhatsApp está incompleto.');

    setWhatsappFormateado(numLimpio);
    setMostrarConfirmacion(true);
  };

  const ejecutarEnvio = async () => {
    setMostrarConfirmacion(false);
    setCargando(true);

    try {
      // 1. Validación de Referencia
      const q = query(
        collection(db, "pagos"),
        where("referencia", "==", referencia),
        where("metodoPago", "==", metodo)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setCargando(false);
        return mostrarAviso('error', `La referencia "${referencia}" ya ha sido registrada anteriormente para ${metodo}.`);
      }

      // 2. Subida de Imagen
      const formData = new FormData();
      formData.append("image", archivo);
      const resImg = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY_IMGBB}`, {
        method: "POST",
        body: formData
      });
      const dataImg = await resImg.json();
      const urlFoto = dataImg.data.url;

      // 3. Guardado
      await addDoc(collection(db, "pagos"), {
        nombreCliente: nombre,
        whatsapp: whatsappFormateado,
        metodoPago: metodo,
        referencia: referencia,
        comprobanteUrl: urlFoto,
        rifaId,
        cantidadTickets: Number(cantidad),
        montoUsd: totalUSD,
        montoBs: totalBS,
        tasaReferencia: tasaExterna,
        estado: "pendiente",
        fecha: new Date()
      });

      mostrarAviso('exito', '¡Reporte enviado con éxito! Verificaremos tu pago pronto.');
      setNombre(""); setWhatsapp(""); setMetodo(""); setReferencia(""); setArchivo(null); setCantidad(1);
    } catch (error) {
      mostrarAviso('error', 'Hubo un error al procesar tu solicitud. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN 1: CANTIDAD (Igual a la anterior) */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 italic uppercase">1. Cantidad de boletos</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 5, 10, 20, 50, 100].map(num => (
            <button key={num} type="button" onClick={() => setCantidad(num)}
              className={`py-3 rounded-xl font-black transition-all ${cantidad === num ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              +{num}
            </button>
          ))}
        </div>
        <input type="number" value={cantidad} onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full p-4 bg-slate-50 border-2 border-dashed border-gray-200 rounded-2xl text-center font-black text-2xl outline-none focus:border-blue-500 transition-all" />
        
        <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center p-5 bg-slate-900 rounded-2xl text-white shadow-inner">
                <div className="flex flex-col text-left text-[10px] uppercase font-bold opacity-60">Total Divisas</div>
                <span className="text-3xl font-black text-blue-400">${totalUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-5 bg-blue-600 rounded-2xl text-white shadow-xl">
                <div className="flex flex-col text-left text-[10px] font-bold opacity-80 uppercase italic">Ref. BCV</div>
                <div className="text-right">
                    <span className="block text-[10px] font-bold uppercase opacity-80">Monto en Bs.</span>
                    <span className="text-2xl font-black">{totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>
      </div>

      {/* SECCIÓN 2: FORMULARIO */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 italic uppercase">2. Confirmar Pago</h2>
        <form onSubmit={abrirModalConfirmacion} className="space-y-4">
          <input type="text" placeholder="Nombre completo" required value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="w-full p-4 bg-slate-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-medium" />
          
          <div className="relative flex items-center">
            <span className="absolute left-4 font-bold text-slate-400 border-r-2 border-slate-200 pr-3">+58</span>
            <input type="tel" placeholder="0412 719 1034" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full p-4 pl-16 bg-slate-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700" />
          </div>

          <select required value={metodo} onChange={(e) => setMetodo(e.target.value)}
            className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
            <option value="" disabled>-- Método de pago --</option>
            <option value="pagomovil">Pago Móvil (Bolívares)</option>
            <option value="zelle">Zelle (Dólares)</option>
            <option value="binance">Binance Pay</option>
          </select>

          {metodo && (
            <div className="p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl text-sm font-bold text-slate-700">
              <h3 className="text-xs font-black text-blue-600 uppercase mb-2 italic">Datos para transferir:</h3>
              {metodo === "pagomovil" && <><p>Banco: {datosCuentas.pagomovil.banco}</p><p>Tlf: {datosCuentas.pagomovil.tlf}</p><p>C.I: {datosCuentas.pagomovil.ci}</p></>}
              {metodo === "zelle" && <><p>Correo: {datosCuentas.zelle.correo}</p><p>Titular: {datosCuentas.zelle.titular}</p></>}
              {metodo === "binance" && <p>Pay ID: {datosCuentas.binance.id}</p>}
            </div>
          )}

          <input type="text" placeholder="Número de Referencia" required value={referencia} onChange={(e) => setReferencia(e.target.value)}
            className="w-full p-4 bg-slate-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-medium" />

          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${archivo ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-slate-50 hover:bg-gray-100'}`}>
            <span className="text-2xl mb-1">{archivo ? '✅' : '📸'}</span>
            <p className="text-xs font-bold text-gray-500 uppercase">{archivo ? archivo.name : 'Subir captura'}</p>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => setArchivo(e.target.files[0])} />
          </label>

          <button type="submit" disabled={cargando}
            className={`w-full text-white font-black py-5 rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-wider ${cargando ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600 shadow-green-100'}`}>
            {cargando ? 'Procesando...' : 'Finalizar Reporte'}
          </button>
        </form>
      </div>

      {/* MODAL 1: CONFIRMACIÓN DE WHATSAPP */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-8 text-center text-white">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md text-3xl">📱</div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">¿Todo bien?</h3>
            </div>
            <div className="p-8 text-center space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-black text-xl text-slate-800">+{whatsappFormateado}</div>
              <div className="space-y-2">
                <button onClick={ejecutarEnvio} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-sm active:scale-95 transition-all">SÍ, ENVIAR PAGO ✅</button>
                <button onClick={() => setMostrarConfirmacion(false)} className="w-full text-slate-400 py-2 font-bold uppercase text-[10px]">CORREGIR NÚMERO</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AVISOS (ÉXITO / ERROR) */}
      {modalStatus.visible && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 text-center">
            <div className={`p-6 ${modalStatus.tipo === 'exito' ? 'bg-green-500' : 'bg-red-500'} text-white text-4xl`}>
              {modalStatus.tipo === 'exito' ? '✨' : '⚠️'}
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-slate-700 leading-tight uppercase italic">{modalStatus.mensaje}</p>
              <button onClick={() => setModalStatus({ ...modalStatus, visible: false })}
                className={`w-full py-3 rounded-xl font-black text-white uppercase text-xs tracking-widest ${modalStatus.tipo === 'exito' ? 'bg-green-500 shadow-green-100' : 'bg-red-500 shadow-red-100'} shadow-lg`}>
                ENTENDIDO
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}