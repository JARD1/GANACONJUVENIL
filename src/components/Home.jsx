import React from 'react';
import { Link } from 'react-router-dom';
import { listaRifas } from '../data/rifas';

/**
 * Componente de la Página Principal.
 * Muestra el catálogo de rifas activas en formato de tarjetas.
 */
export default function Home() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Encabezado de la página */}
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-slate-900 uppercase italic tracking-tighter">
          Sorteos Disponibles
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Selecciona tu premio y adquiere tus boletos</p>
      </header>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {listaRifas.map((rifa) => (
          <div 
            key={rifa.id} 
            className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 flex flex-col"
          >
            {/* Contenedor de Imagen con el Precio encima */}
            <div className="relative h-64 overflow-hidden">
              <img 
                src={rifa.imagen} 
                alt={rifa.nombre} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* ETIQUETA DE PRECIO: Posicionada absoluta sobre la imagen */}
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full font-black text-xl shadow-lg border-2 border-white">
                ${rifa.precioBoleto.toFixed(2)}
              </div>
              {/* Etiqueta de disponibilidad */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-green-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                🟢 Disponible
              </div>
            </div>

            {/* Contenido de la Tarjeta */}
            <div className="p-6 flex flex-col flex-grow">
              <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-tight mb-2">
                {rifa.nombre}
              </h2>
              <p className="text-slate-500 text-sm line-clamp-2 mb-6">
                {rifa.descripcion}
              </p>
              
              {/* Botón de acción al final de la tarjeta */}
              <div className="mt-auto">
                <Link 
                  to={`/participar/${rifa.id}`} 
                  className="block w-full text-center bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
                >
                  COMPRAR BOLETO
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}