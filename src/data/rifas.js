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
🥈 2do Lugar: Equivalente a $600 en Bs. 💵
🥉 3er Lugar: Equivalente a $400 en Bs. 💵

✨ Premios Especiales: Estaremos repartiendo 4 premios equivalentes a $50 en Bs. c/u para tickets ganadores al azar. 🎫💸

👑 ¡PREMIOS EXTRA A LOS MAYORES COMPRADORES! 👑

Para agradecer tu lealtad, premiaremos a las 3 personas que compren la mayor cantidad de boletos en toda la rifa:

🥇 Top 1 en compras: Equivalente a $200 en Bs.
🥈 Top 2 en compras: Equivalente a $125 en Bs.
🥉 Top 3 en compras: Equivalente a $75 en Bs.

¡Participar es súper fácil! Mientras más tickets adquieras, más oportunidades tienes de ganar la moto y de asegurar tu puesto en el podio de compradores. 🎟️🚀`,
    estado: "activa", // <--- Controla si se vende o no
  },
];