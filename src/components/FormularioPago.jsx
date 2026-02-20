import React, { useState } from 'react';

/**
 * COMPONENTE: FormularioPago
 * Muestra dinámicamente los datos de cuenta según el método seleccionado
 * y permite adjuntar el comprobante de pago.
 */
export default function FormularioPago({ onSubmit }) {
  // Estado para controlar qué método de pago seleccionó el usuario
  const [metodo, setMetodo] = useState("");

  // Datos de ejemplo para las cuentas (Esto luego puede venir de un archivo de configuración)
  const datosCuentas = {
    pagomovil: { banco: "Banesco", tlf: "04241234567", ci: "20.123.456" },
    zelle: { correo: "pagos@tuweb.com", titular: "Nombre de Empresa" },
    binance: { id: "987654321", email: "user@binance.com" }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 italic uppercase">
        2. Confirmar Pago
      </h2>
      
      <form className="space-y-4" onSubmit={onSubmit}>
        {/* Nombre del pagador */}
        <input 
          type="text" 
          placeholder="Nombre completo del pagador" 
          required
          className="w-full p-4 bg-slate-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
        />
        
        {/* WhatsApp */}
        <input 
          type="tel" 
          placeholder="WhatsApp de contacto" 
          required
          className="w-full p-4 bg-slate-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
        />

        {/* SELECTOR DE MÉTODO DINÁMICO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Selecciona el método usado:</label>
          <select 
            required
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
            className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
          >
            <option value="" disabled>-- Elegir Método --</option>
            <option value="pagomovil">Pago Móvil (Bolívares)</option>
            <option value="zelle">Zelle (Dólares)</option>
            <option value="binance">Binance Pay</option>
          </select>
        </div>

        {/* CAJA DE DATOS BANCARIOS (Solo aparece si hay un método seleccionado) */}
        {metodo && (
          <div className="p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-xs font-black text-blue-600 uppercase mb-2 tracking-tighter">Datos para realizar el pago:</h3>
            
            {metodo === "pagomovil" && (
              <div className="text-sm text-slate-700 space-y-1">
                <p>🏦 <b>Banco:</b> {datosCuentas.pagomovil.banco}</p>
                <p>📱 <b>Teléfono:</b> {datosCuentas.pagomovil.tlf}</p>
                <p>🪪 <b>Cédula:</b> {datosCuentas.pagomovil.ci}</p>
              </div>
            )}

            {metodo === "zelle" && (
              <div className="text-sm text-slate-700 space-y-1">
                <p>📧 <b>Correo:</b> {datosCuentas.zelle.correo}</p>
                <p>👤 <b>Titular:</b> {datosCuentas.zelle.titular}</p>
              </div>
            )}

            {metodo === "binance" && (
              <div className="text-sm text-slate-700 space-y-1">
                <p>🆔 <b>Pay ID:</b> {datosCuentas.binance.id}</p>
                <p>📧 <b>Email:</b> {datosCuentas.binance.email}</p>
              </div>
            )}
          </div>
        )}

        {/* REFERENCIA BANCARIA */}
        <input 
          type="text" 
          placeholder="Número de Referencia" 
          required
          className="w-full p-4 bg-slate-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
        />

        {/* SUBIR COMPROBANTE (Área visual) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Adjuntar comprobante (Capture):</label>
          <div className="relative">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <span className="text-2xl mb-1">📸</span>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Subir comprobante</p>
                <p className="text-[10px] text-gray-400">JPG, PNG o PDF</p>
              </div>
              <input type="file" required className="hidden" accept="image/*" />
            </label>
          </div>
        </div>

        {/* BOTÓN DE ENVÍO */}
        <button 
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-green-100 transition-all active:scale-95 uppercase tracking-wider mt-4"
        >
          Enviar reporte de pago
        </button>
        
        <p className="text-[10px] text-center text-gray-400 mt-4 italic leading-tight uppercase px-4">
          Tus boletos se asignarán una vez el administrador verifique los fondos en cuenta.
        </p>
      </form>
    </div>
  );
}