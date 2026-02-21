import React, { useState } from 'react';
import { db } from '../firebase'; 
import { collection, addDoc } from "firebase/firestore";

export default function ProcesoPago({ rifaId, precioTicket, tasaExterna, errorTasaExterna }) {
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [metodo, setMetodo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  
  // Nuevo estado para el Modal Elegante
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [whatsappFormateado, setWhatsappFormateado] = useState("");

  const API_KEY_IMGBB = "ea37b1cb1475b5d9b8e4a6a92fa56c21";

  const datosCuentas = {
    pagomovil: { banco: "Banesco", tlf: "04241234567", ci: "20.123.456" },
    zelle: { correo: "pagos@tuweb.com", titular: "Nombre de Empresa" },
    binance: { id: "987654321", email: "user@binance.com" }
  };

  const totalUSD = (Number(cantidad) || 0) * precioTicket;
  const totalBS = tasaExterna ? totalUSD * tasaExterna : 0;

  // 1. Pre-validación y apertura del Modal
  const abrirModalConfirmacion = (e) => {
    e.preventDefault();
    if (cantidad < 1) return alert("La cantidad debe ser al menos 1.");
    if (!archivo) return alert("Sube el comprobante de pago");

    // Formateo previo para mostrar en el modal
    let numLimpio = whatsapp.replace(/\D/g, '');
    if (numLimpio.startsWith('0')) numLimpio = numLimpio.substring(1);
    if (!numLimpio.startsWith('58')) numLimpio = '58' + numLimpio;

    if (numLimpio.length < 11) return alert("Número de WhatsApp incompleto.");

    setWhatsappFormateado(numLimpio);
    setMostrarConfirmacion(true);
  };

  // 2. Ejecución final del proceso
  const ejecutarEnvio = async () => {
    setMostrarConfirmacion(false);
    setCargando(true);

    try {
      const formData = new FormData();
      formData.append("image", archivo);
      const resImg = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY_IMGBB}`, {
        method: "POST",
        body: formData
      });
      const dataImg = await resImg.json();
      const urlFoto = dataImg.data.url;

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

      alert("¡Reporte enviado con éxito! Verificaremos tu pago pronto.");
      setNombre(""); setWhatsapp(""); setMetodo(""); setReferencia(""); setArchivo(null); setCantidad(1);
    } catch (error) {
      alert("Error al procesar. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN 1: CANTIDAD */}
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
        <input 
          type="number" 
          value={cantidad} 
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setCantidad(isNaN(val) || val < 1 ? 1 : val);
          }}
          className="w-full p-4 bg-slate-50 border-2 border-dashed border-gray-200 rounded-2xl text-center font-black text-2xl outline-none focus:border-blue-500 transition-all" 
        />
        
        {/* TOTALES */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center p-5 bg-slate-900 rounded-2xl text-white shadow-inner">
            <div className="flex flex-col text-left">
               <span className="text-[10px] uppercase font-bold opacity-60">Total Divisas</span>
               <span className="font-medium text-sm">Monto a pagar:</span>
            </div>
            <span className="text-3xl font-black text-blue-400">${totalUSD.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-5 bg-blue-600 rounded-2xl text-white shadow-xl">
             <div className="flex flex-col text-left text-[10px]">
               <span className="uppercase font-bold opacity-80 italic">Ref. BCV</span>
               <span>Tasa: {tasaExterna?.toFixed(2)} Bs/$</span>
             </div>
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
            <input 
              type="tel" placeholder="0412 719 1034" required value={whatsapp} 
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full p-4 pl-16 bg-slate-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700" 
            />
          </div>

          <select required value={metodo} onChange={(e) => setMetodo(e.target.value)}
            className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
            <option value="" disabled>-- Método de pago --</option>
            <option value="pagomovil">Pago Móvil (Bolívares)</option>
            <option value="zelle">Zelle (Dólares)</option>
            <option value="binance">Binance Pay</option>
          </select>

          {metodo && (
            <div className="p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl animate-in fade-in zoom-in duration-300 text-sm font-bold text-slate-700">
              <h3 className="text-xs font-black text-blue-600 uppercase mb-2">Datos para transferir:</h3>
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
            {cargando ? 'Enviando...' : 'Finalizar Reporte'}
          </button>
        </form>
      </div>

      {/* MODAL DE CONFIRMACIÓN ELEGANTE */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 border border-white">
            <div className="bg-blue-600 p-8 text-center">
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <span className="text-4xl">📱</span>
              </div>
              <h3 className="text-white text-2xl font-black uppercase tracking-tighter">¿Todo correcto?</h3>
              <p className="text-blue-100 text-xs font-bold uppercase mt-1 opacity-80">Verificación de contacto</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tu WhatsApp asignado</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight">+{whatsappFormateado}</span>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={ejecutarEnvio}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-slate-200 active:scale-95 transition-all"
                >
                  Sí, enviar mi pago ✅
                </button>
                <button 
                  onClick={() => setMostrarConfirmacion(false)}
                  className="w-full bg-white text-slate-400 py-3 rounded-2xl font-bold uppercase text-[10px] hover:text-red-500 transition-colors"
                >
                  No, corregir número
                </button>
              </div>
              
              <p className="text-[9px] text-center text-slate-400 font-bold leading-tight px-4 uppercase italic">
                Al confirmar, procesaremos tu reporte y enviaremos tus tickets a este número de WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}