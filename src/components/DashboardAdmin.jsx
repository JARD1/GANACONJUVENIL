import React, { useState } from 'react';

export default function DashboardAdmin() {
  // --- 1. ESTADOS ---
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [procesandoId, setProcesandoId] = useState(null);
  
  const [reportes, setReportes] = useState([
    {
      id: 1,
      cliente: "Carlos Rodríguez",
      whatsapp: "+58 412 555 1234",
      rifa: "Ford Fiesta 2021",
      tickets: 10,
      montoUsd: 30.00,
      montoBs: 1080.00,
      metodo: "Pago Móvil",
      referencia: "88231",
      status: "pendiente",
      imagen: "https://morocotacoin.news/wp-content/uploads/2022/08/9-1.jpg"
    },
    {
      id: 2,
      cliente: "Mariana Silva",
      whatsapp: "+58 424 999 0011",
      rifa: "Kawasaki KLR 650",
      tickets: 2,
      montoUsd: 3.00,
      montoBs: 108.00,
      metodo: "Zelle",
      referencia: "TRX-9921",
      status: "pendiente",
      imagen: "https://larepublica.cronosmedia.glr.pe/migration/images/UIBPUJRS3FHJRPA6M3TYTMELQA.jpg"
    },{
      id: 3,
      cliente: "Manuel Gómez",
      whatsapp: "+58 416 777 8899",
      rifa: "Ford Fiesta 2021",
      tickets: 50,
      montoUsd: 800.00,
      montoBs: 1080.00,
      metodo: "Binance Pay",
      referencia: "BN-12345",
      status: "pendiente",
      imagen: "https://public.bnbstatic.com/image/cms/article/body/202209/0d9ff01de50565615825fb6d350b3b5e.png"
    }
  ]);

  // --- LÓGICA DE COLORES POR MÉTODO ---
  const obtenerColorMetodo = (metodo) => {
    const m = metodo.toLowerCase();
    if (m.includes("pago")) return "bg-green-100 text-green-700 border-green-200";
    if (m.includes("zelle")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (m.includes("binance")) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  // --- LÓGICA DE FILTRADO ---
  const reportesFiltrados = reportes.filter(r => 
    r.cliente.toLowerCase().includes(busqueda.toLowerCase()) || 
    r.referencia.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- LÓGICA DE DECISIÓN ---
  const manejarAccion = (id, nuevoStatus) => {
    if (nuevoStatus === 'aprobado') {
      setProcesandoId(id);
      setTimeout(() => {
        setReportes(prev => prev.map(r => r.id === id ? { ...r, status: 'aprobado' } : r));
        setProcesandoId(null);
        alert("✅ Solicitud aceptada: Números generados y enviados.");
      }, 2000);
    } else {
      setReportes(prev => prev.map(r => r.id === id ? { ...r, status: nuevoStatus } : r));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 relative">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter">
            Control de Ventas
          </h1>
          <p className="text-slate-500 font-medium text-lg">Panel de administración</p>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="relative">
        <input 
          type="text"
          placeholder="Buscar por nombre o referencia..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-white border-2 border-slate-100 p-5 pl-14 rounded-3xl outline-none focus:border-blue-500 font-bold shadow-sm"
        />
        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-widest">
                <th className="p-8 italic">ID</th>
                <th className="p-8">Cliente / Método</th>
                <th className="p-8 text-center">Compra</th>
                <th className="p-8">Monto Reportado</th>
                <th className="p-8 text-center">Capture</th>
                <th className="p-8 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportesFiltrados.map((r) => (
                <tr key={r.id} className={`hover:bg-slate-50/50 transition-all ${r.status !== 'pendiente' && r.status !== 'espera' ? 'opacity-40' : ''}`}>
                  <td className="p-8 font-black text-slate-300 italic">#{r.id}</td>
                  
                  <td className="p-8">
                    <p className="font-extrabold text-slate-800 text-lg leading-none">{r.cliente}</p>
                    {/* ETIQUETA DEL MÉTODO DE PAGO */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${obtenerColorMetodo(r.metodo)}`}>
                        {r.metodo}
                      </span>
                      <a href={`https://wa.me/${r.whatsapp.replace(/\D/g,'')}`} target="_blank" className="text-[10px] text-green-600 font-black hover:underline">
                        WhatsApp 🟢
                      </a>
                    </div>
                  </td>

                  <td className="p-8 text-center">
                    <p className="text-xs font-black text-slate-900 uppercase italic bg-slate-100 p-2 rounded-xl inline-block">
                      {r.rifa}
                    </p>
                    <br />
                    <span className="text-xs font-bold text-blue-600 underline underline-offset-4">
                      {r.tickets} tickets
                    </span>
                  </td>

                  <td className="p-8">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-xl tracking-tighter">
                        ${Number(r.montoUsd || 0).toFixed(2)}
                      </span>
                      {r.metodo.toLowerCase().includes("pago") && (
                        <span className="text-[11px] font-black text-green-600 mt-1">
                          Bs. {Number(r.montoBs || 0).toLocaleString('es-VE', {minimumFractionDigits: 2})}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono mt-1 font-bold italic uppercase">
                        Ref: {r.referencia}
                      </span>
                    </div>
                  </td>

                  <td className="p-8 text-center">
                    <button onClick={() => setComprobanteSeleccionado(r.imagen)} className="bg-slate-100 p-3 rounded-2xl hover:bg-slate-900 group transition-all">
                      <span className="text-2xl group-hover:scale-110 inline-block transition-transform">🖼️</span>
                    </button>
                  </td>

                  <td className="p-8">
                    {procesandoId === r.id ? (
                      <div className="text-center animate-pulse text-blue-600 font-black text-[10px] uppercase">
                        🚀 Procesando...
                      </div>
                    ) : r.status === 'pendiente' || r.status === 'espera' ? (
                      <div className="flex flex-col gap-2">
                        <button onClick={() => manejarAccion(r.id, 'aprobado')} className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                          Admitir
                        </button>
                        <div className="flex gap-1">
                          <button onClick={() => manejarAccion(r.id, 'espera')} className="flex-1 bg-amber-400 text-white p-2 rounded-xl font-black text-[9px] uppercase">
                            Espera
                          </button>
                          <button onClick={() => manejarAccion(r.id, 'rechazado')} className="flex-1 bg-red-50 text-red-500 p-2 rounded-xl font-black text-[9px] uppercase">
                            Negar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl ${r.status === 'aprobado' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {r.status === 'aprobado' ? '✅ Aprobado' : '❌ Negado'}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {comprobanteSeleccionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="relative bg-white p-3 rounded-[3rem] max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setComprobanteSeleccionado(null)} className="absolute -top-5 -right-5 bg-red-500 text-white w-12 h-12 rounded-full font-black text-xl shadow-2xl">✕</button>
            <img src={comprobanteSeleccionado} alt="Capture" className="w-full h-auto rounded-[2.5rem] object-cover max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}