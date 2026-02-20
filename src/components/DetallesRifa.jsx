import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { listaRifas } from '../data/rifas';
import SelectorCantidad from './SelectorCantidad';
import FormularioPago from './FormularioPago';

/**
 * COMPONENTE: DetallesRifa
 * Maneja la lógica de visualización del producto seleccionado y la 
 * obtención de la tasa de cambio en tiempo real.
 */
export default function DetallesRifa() {
  const { id } = useParams(); // ID extraído de la URL (ej: /participar/ford-fiesta-21)
  
  // ESTADOS
  const [cantidad, setCantidad] = useState(1); // Cantidad de tickets elegida
  const [tasaBCV, setTasaBCV] = useState(null); // null indica que el dato no ha llegado
  const [errorTasa, setErrorTasa] = useState(false); // true si falla la conexión con la API

  // Buscamos los datos de la rifa en nuestro archivo local según el ID
  const rifa = listaRifas.find(r => r.id === id);

  /**
   * EFECTO: Obtención de tasa oficial
   * Se ejecuta una sola vez cuando el componente se monta.
   */
  useEffect(() => {
    // URL de la API de referencia para el dólar oficial en Venezuela
    fetch('https://ve.dolarapi.com/v1/dolares/oficial')
      .then(response => {
        if (!response.ok) throw new Error("Error al conectar con la API");
        return response.json();
      })
      .then(data => {
        // Validamos que el dato exista antes de guardarlo
        if (data && data.promedio) {
          setTasaBCV(data.promedio);
        } else {
          setErrorTasa(true);
        }
      })
      .catch(err => {
        console.error("Fallo en la tasa:", err);
        setErrorTasa(true); // Bloquea los cálculos en el frontend
      });
  }, []);

  // Validación de seguridad: Si el ID en la URL no existe en nuestros datos
  if (!rifa) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800">Rifa no encontrada</h2>
        <p className="text-gray-500">El producto solicitado no existe o ha sido eliminado.</p>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: Tarjeta informativa del premio */}
        <div className="space-y-4">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
            <img 
              src={rifa.imagen} 
              alt={rifa.nombre} 
              className="w-full h-80 object-cover" 
            />
            <div className="p-8">
              <h1 className="text-4xl font-black text-slate-900 uppercase italic leading-tight">
                {rifa.nombre}
              </h1>
              <div className="w-20 h-2 bg-blue-600 my-4 rounded-full"></div>
              <p className="text-slate-500 leading-relaxed">
                {rifa.descripcion}
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Interacción y Pago */}
        <div className="flex flex-col gap-6">
          
          {/* Componente que permite elegir cantidad y muestra convertidor a Bs */}
          <SelectorCantidad 
            cantidad={cantidad} 
            setCantidad={setCantidad} 
            precio={rifa.precioBoleto} 
            tasaBCV={tasaBCV}
            errorTasa={errorTasa}
          />
          
          {/* Formulario para registrar los datos del comprobante */}
          <FormularioPago 
            onSubmit={(e) => { 
              e.preventDefault(); 
              alert(`Registro de ${cantidad} boletos enviado para revisión.`); 
            }} 
          />
          
        </div>

      </div>
    </main>
  );
}