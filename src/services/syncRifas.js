// src/services/syncRifas.js
import { db } from '../firebase'; 
import { listaRifas } from '../data/rifas.js'; 
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * ARQUITECTURA V2: EL POOL DE MEMORIA
 * Recorre la lista local de rifas y las crea en Firestore si no existen.
 * Guarda todos los números disponibles en un ÚNICO arreglo dentro del documento,
 * reduciendo el costo de base de datos a $0.
 */
export const sincronizarInventario = async () => {
  try {
    for (const rifa of listaRifas) {
      // Referencia al documento único de la rifa
      const rifaRef = doc(db, "rifas", rifa.id);
      const docSnap = await getDoc(rifaRef);

      // Solo si la rifa NO existe en Firebase, la creamos
      if (!docSnap.exists()) {
        console.log(`🚀 Creando base de datos optimizada para: ${rifa.nombre}...`);
        
        // 1. Generar el Arreglo (Array) gigante con todos los números (ej. ["0000", "0001", ..., "9999"])
        const arrayTicketsLibres = Array.from({ length: rifa.maxTickets }, (_, i) => 
          i.toString().padStart(4, '0')
        );

        // 2. Guardar el documento con el Array incluido (¡Una sola escritura!)
        await setDoc(rifaRef, {
          nombre: rifa.nombre,
          totalTicketsGenerados: rifa.maxTickets,
          fechaCreacion: new Date(),
          estadoRifa: "activa",
          ticketsLibres: arrayTicketsLibres // <--- AQUÍ ESTÁ LA MAGIA 🪄
        });

        console.log(`📦 Inventario de ${rifa.maxTickets} tickets creado exitosamente en 1 sola operación para ${rifa.id}`);
      }
    }
    console.log("Sincronización V2 finalizada correctamente ✅");
  } catch (error) {
    console.error("❌ Error en la sincronización de inventario:", error);
  }
};