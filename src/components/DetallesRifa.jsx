import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { listaRifas } from '../data/rifas';
import ProcesoPago from './ProcesoPago'; // Usamos el componente unificado

export default function DetallesRifa() {
  const { id } = useParams();
  
  // --- ESTADOS ---
  const [tasaBCV, setTasaBCV] = useState(null);
  const [errorTasa, setErrorTasa] = useState(false);
  
  // ESTADOS DEL MODAL
  const [mostrarTerminos, setMostrarTerminos] = useState(true);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  // 1. Obtener la tasa una sola vez para pasarla al ProcesoPago
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

  const rifa = listaRifas.find(r => r.id === id);

  if (!rifa) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800">Rifa no encontrada</h2>
        <p className="text-gray-500">El producto solicitado no existe o ha sido eliminado.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      
      {/* --- MODAL DE TÉRMINOS Y CONDICIONES --- */}
      {mostrarTerminos && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full text-3xl mb-2">
                📜
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                Reglamento de Participación
              </h2>
              <div className="w-12 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
              
              <div className="text-left text-slate-600 text-sm space-y-3 max-h-64 overflow-y-auto pr-2 py-2">
                <p className="bg-slate-50 p-2 rounded-lg border-l-4 border-blue-500">
                  <strong>1. Verificación de Pago:</strong> El proceso de validación puede tardar de 1 a 12 horas hábiles.
                </p>
                <p><strong>2. Asignación de Números:</strong> Los números se generan aleatoriamente tras confirmar la recepción de los fondos.</p>
                <p><strong>3. Datos Requeridos:</strong> Debes subir una captura legible con el número de referencia visible.</p>
                <p><strong>4. Premios:</strong> Se entregarán bajo las condiciones descritas en el evento.</p>
                <p><strong>5. Cancelaciones:</strong> No se aceptan cambios ni devoluciones tras reportar el pago.</p>
              </div>

              <div className="pt-6 space-y-4">
                <label className="flex items-center justify-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={aceptoTerminos}
                    onChange={() => setAceptoTerminos(!aceptoTerminos)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer transition-transform group-hover:scale-110"
                  />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600">
                    Entiendo y acepto los términos
                  </span>
                </label>

                <button
                  disabled={!aceptoTerminos}
                  onClick={() => setMostrarTerminos(false)}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${
                    aceptoTerminos 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-200' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  Continuar al Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className={`max-w-6xl mx-auto p-4 py-10 transition-all duration-500 ${mostrarTerminos ? 'blur-md pointer-events-none brightness-75' : 'blur-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMNA IZQUIERDA: Información de la Rifa (Ocupa 5/12) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 sticky top-6">
              <div className="relative">
                <img 
                  src={rifa.imagen} 
                  alt={rifa.nombre} 
                  className="w-full h-96 object-cover" 
                />
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-6 py-2 rounded-full font-black italic shadow-lg">
                  ${rifa.precioBoleto} USD
                </div>
              </div>
              <div className="p-8">
                <h1 className="text-4xl font-black text-slate-900 uppercase italic leading-tight">
                  {rifa.nombre}
                </h1>
                <div className="w-20 h-2 bg-blue-600 my-4 rounded-full"></div>
                <p className="text-slate-500 leading-relaxed text-lg">
                  {rifa.descripcion}
                </p>
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
                   <span>ID: {rifa.id}</span>
                   <span>•</span>
                   <span>Estatus: Activo</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: El Motor de Pago Unificado (Ocupa 7/12) */}
          <div className="lg:col-span-7">
            {/* Invocamos el componente unificado que ya creamos.
               Le pasamos la tasaBCV y el error que ya calculamos aquí arriba.
            */}
            <ProcesoPago 
               rifaId={rifa.id} 
               precioTicket={rifa.precioBoleto} 
               tasaExterna={tasaBCV}
               errorTasaExterna={errorTasa}
            />
          </div>

        </div>
      </main>
    </div>
  );
}