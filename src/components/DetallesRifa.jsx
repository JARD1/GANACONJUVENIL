import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { listaRifas } from '../data/rifas';
import ProcesoPago from './ProcesoPago';

export default function DetallesRifa() {
  const { id } = useParams();
  const rifa = listaRifas.find(r => r.id === id);
  const isFinalizada = rifa?.estado === "finalizada";
  
  const [tasaBCV, setTasaBCV] = useState(null);
  const [errorTasa, setErrorTasa] = useState(false);
  
  // Si está finalizada, NO mostramos los términos
  const [mostrarTerminos, setMostrarTerminos] = useState(!isFinalizada);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  useEffect(() => {
    fetch('https://ve.dolarapi.com/v1/dolares/oficial')
      .then(response => {
        if (!response.ok) throw new Error("Error al conectar con la API");
        return response.json();
      })
      .then(data => {
        if (data && data.promedio) {
          setTasaBCV(data.promedio);
        } else {
          setErrorTasa(true);
        }
      })
      .catch(err => {
        console.error("Fallo en la tasa:", err);
        setErrorTasa(true);
      });
  }, []);

  if (!rifa) {
    return (
      <div className="text-center py-20 text-white">
        <h2 className="text-3xl font-black uppercase italic">Rifa no encontrada</h2>
        <p className="text-slate-500 mt-2">El producto solicitado no existe o ha sido eliminado.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen selection:bg-blue-500 selection:text-white">
      
      {/* --- MODAL DE TÉRMINOS Y CONDICIONES --- */}
      {mostrarTerminos && !isFinalizada && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700/50 rounded-[2rem] max-w-lg w-full p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            
            <div className="text-center space-y-3 mb-4 shrink-0">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600/10 text-blue-500 rounded-full text-3xl mb-1 shadow-inner border border-blue-500/20">
                📜
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">
                TÉRMINOS Y <span className="text-blue-500">CONDICIONES</span>
              </h2>
              <div className="w-12 h-1 bg-blue-600 mx-auto rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"></div>
            </div>
            
            {/* CONTENEDOR CON SCROLL PARA LOS TÉRMINOS */}
            <div className="text-left text-slate-300 text-[11px] md:text-xs space-y-4 overflow-y-auto pr-3 py-2 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-slate-800/50 flex-grow">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner space-y-3">
                <p><strong>1.-</strong> Los números disponibles para la compra en cada uno de nuestros sorteos se especificarán en la página de detalles correspondiente a cada sorteo.</p>
                <div className="h-[1px] w-full bg-slate-800/50"></div>
                <p><strong>2.-</strong> Solo podrán participar en nuestros sorteos personas naturales mayores de 18 años.</p>
                <div className="h-[1px] w-full bg-slate-800/50"></div>
                <p><strong>3.-</strong> Los premios deberán ser retirados en persona en la ubicación designada para cada sorteo. Si está afuera del estado se realizarán entregas personales en la dirección indicada por el ganador.</p>
                <div className="h-[1px] w-full bg-slate-800/50"></div>
                <p><strong>4.-</strong> De no venderse el 80% de la boletería la fecha del sorteo se reprogramará con previo aviso.</p>
                <div className="h-[1px] w-full bg-slate-800/50"></div>
                <p><strong>5.-</strong> Para reclamar tu premio tienes un lapso de 72 horas.</p>
                <div className="h-[1px] w-full bg-slate-800/50"></div>
                <p><strong>6.-</strong> Los ganadores aceptan aparecer en el contenido audiovisual del sorteo mostrando su presencia en las redes y entrega de los premios. Esto es <strong>OBLIGATORIO</strong>.</p>
                <div className="h-[1px] w-full bg-slate-800/50"></div>
                <p><strong>7.-</strong> La confirmación de su ticket será validada en nuestro portal web y notificada a su WhatsApp en un lapso no mayor a 12 horas después de confirmar el pago.</p>
              </div>
            </div>

            <div className="pt-6 space-y-4 shrink-0">
              <label className="flex items-center justify-center gap-3 cursor-pointer group bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={aceptoTerminos}
                  onChange={() => setAceptoTerminos(!aceptoTerminos)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer transition-transform group-hover:scale-110"
                />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-400 transition-colors">
                  He leído y acepto los términos
                </span>
              </label>

              <button
                disabled={!aceptoTerminos}
                onClick={() => setMostrarTerminos(false)}
                className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg ${
                  aceptoTerminos 
                  ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-blue-900/40' 
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                Continuar al Pago ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className={`max-w-7xl mx-auto p-4 md:p-6 py-10 transition-all duration-700 ${mostrarTerminos ? 'blur-2xl pointer-events-none' : 'blur-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
          
          {/* COLUMNA IZQUIERDA: Información de la Rifa */}
          <div className="lg:col-span-5 space-y-6">
            <div className={`bg-slate-900/80 backdrop-blur-xl rounded-[3rem] overflow-hidden shadow-2xl border ${isFinalizada ? 'border-red-900/50' : 'border-slate-700/50'} sticky top-24`}>
              <div className="relative">
                <img 
                  src={rifa.imagen} 
                  alt={rifa.nombre} 
                  className={`w-full h-[350px] md:h-[450px] object-cover ${isFinalizada ? 'grayscale opacity-40' : 'opacity-90'}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                
                {/* PRECIO FLOTANTE */}
                <div className="absolute top-6 right-6 bg-slate-900/80 backdrop-blur-md text-white px-6 py-2 rounded-2xl font-black text-xl md:text-2xl shadow-2xl border border-slate-700">
                  <span className="text-blue-500 text-sm mr-1">$</span>{rifa.precioBoleto.toFixed(2)}
                </div>
              </div>
              
              <div className="p-8 md:p-10">
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic leading-tight mb-4">
                  {rifa.nombre}
                </h1>
                <div className={`w-16 h-1.5 rounded-full mb-6 ${isFinalizada ? 'bg-red-600' : 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]'}`}></div>
                <p className="text-slate-400 leading-relaxed text-base md:text-lg font-medium">
                  {rifa.descripcion}
                </p>
                <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-between text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <div className="flex items-center gap-2">
                      {isFinalizada ? (
                        <>
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                          <span className="text-red-500">Sorteo Cerrado</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                          <span className="text-green-500">Sorteo Activo</span>
                        </>
                      )}
                   </div>
                   <span>ID: {rifa.id.slice(0, 10)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Motor de Pago o Mensaje Finalizado */}
          <div className="lg:col-span-7">
            {isFinalizada ? (
              <div className="bg-slate-900/40 backdrop-blur-md rounded-[3rem] p-10 md:p-16 border border-slate-800/50 shadow-2xl h-full flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="text-6xl md:text-8xl mb-6">🏆</div>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
                  Sorteo <span className="text-red-500">Finalizado</span>
                </h2>
                <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mb-6"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm max-w-md mx-auto leading-relaxed">
                  Todos los boletos han sido vendidos o el sorteo ha culminado exitosamente. ¡Muchas gracias a todos por participar!
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/40 backdrop-blur-md rounded-[3rem] p-1 md:p-2 border border-slate-800/50 shadow-2xl">
                <ProcesoPago 
                  rifaId={rifa.id} 
                  precioTicket={rifa.precioBoleto} 
                  tasaExterna={tasaBCV}
                />
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}