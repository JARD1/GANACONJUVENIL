/**
 * Lista maestra de todas las rifas disponibles.
 * Cada objeto representa una "tarjeta" en la página principal.
 * 
  * Estructura de cada rifa: 
  * estado: "activa" | "finalizada" (controla si se vende o no y el estado visual)
 */
export const listaRifas = [
  {
    id: "Moto MD 150cc 0km",
    nombre: "Moto MD 150cc 0km",
    precioBoleto: 1,
    maxTickets: 10000,
    imagen: "/img/sorteo1.png",
    descripcion: `¿Te imaginas estrenando moto o llevándote cientos de dólares por tan solo 1$? 😱

¡Deja de imaginar y hazlo realidad!

Estamos lanzando nuestro gran sorteo con premios que no puedes dejar pasar:

🏆 1er Lugar: ¡Una espectacular Moto 0km! 🏍️

🥈 2nd Lugar: Equivalente $600 en Bs. 💵

🥉 3rd Lugar: Equivalente $400 en Bs. 💵

✨ Premios Especiales: Estaremos repartiendo 4 premios equivalente a $50 en Bs. c/u para tickets ganadores. 💸

¡Participar es súper fácil!`,
    estado: "activa", // <--- Controla si se vende o no
  },
];