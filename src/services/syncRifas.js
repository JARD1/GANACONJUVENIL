// src/services/syncRifas.js
import { db } from '../firebase'; 
import { listaRifas } from '../data/rifas.js'; // <--- CAMBIO AQUÍ
import { doc, setDoc, getDoc, collection, writeBatch } from "firebase/firestore";

/**
 * Recorre la lista local de rifas y las crea en Firestore si no existen.
 * Genera automáticamente el inventario de tickets basado en maxTickets.
 */
export const sincronizarInventario = async () => {
  try {
    for (const rifa of listaRifas) {
      // Referencia al documento de la rifa usando su ID de rifas.js
      const rifaRef = doc(db, "rifas", rifa.id);
      const docSnap = await getDoc(rifaRef);

      // Solo si la rifa NO existe en Firebase, procedemos a crearla
      if (!docSnap.exists()) {
        console.log(`🚀 Creando base de datos para: ${rifa.nombre}...`);
        
        // 1. Guardar metadatos de la rifa
        await setDoc(rifaRef, {
          ...rifa,
          totalTicketsGenerados: rifa.maxTickets,
          fechaCreacion: new Date(),
          estadoRifa: "activa" // Metadata útil para filtrado futuro
        });

        // 2. Generación masiva de tickets en subcolección
        const ticketsRef = collection(db, "rifas", rifa.id, "tickets");
        const batchSize = 500; // Límite de Firestore por operación batch

        for (let i = 0; i < rifa.maxTickets; i += batchSize) {
          const batch = writeBatch(db);
          const chunkEnd = Math.min(i + batchSize, rifa.maxTickets);

          for (let j = i; j < chunkEnd; j++) {
            // Genera números formateados (0000, 0001, etc.)
            const numeroTicket = j.toString().padStart(4, '0');
            const tRef = doc(ticketsRef, numeroTicket);
            
            batch.set(tRef, {
              numero: numeroTicket,
              estado: "disponible",
              reservadoPor: null,
              timestamp: null
            });
          }
          
          await batch.commit();
          console.log(`📦 Lote creado: ${i} a ${chunkEnd} para ${rifa.id}`);
        }
      }
    }
    console.log("Sincronización finalizada correctamente ✅");
  } catch (error) {
    console.error("❌ Error en la sincronización de inventario:", error);
  }
};