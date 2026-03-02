import { Resend } from 'resend';

// Vercel leerá la API Key desde sus variables de entorno secretas
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { tipo, email, datos } = req.body;

  try {
    let subject = '';
    let htmlTemplate = '';

    // 1️⃣ PLANTILLA: PIN DE VERIFICACIÓN
    if (tipo === 'pin') {
      subject = 'Tu código de verificación - Gana con Juvenil';
      htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">
            <h2 style="color: #0f172a; text-transform: uppercase; font-style: italic;">Gana con <span style="color: #2563eb;">Juvenil</span></h2>
            <p style="color: #475569; font-size: 16px;">Tu código de verificación para continuar con la compra es:</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h1 style="color: #2563eb; font-size: 40px; margin: 0; letter-spacing: 8px;">${datos.pin}</h1>
            </div>
            <p style="color: #64748b; font-size: 12px;">Si no solicitaste este código, puedes ignorar este correo.</p>
        </div>
      `;
    } 
    // 2️⃣ PLANTILLA: TICKETS APROBADOS (DASHBOARD)
    else if (tipo === 'confirmacion') {
      subject = '¡Tickets Confirmados! 🎟️ - Gana con Juvenil';
      htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">
            <h2 style="color: #0f172a; text-transform: uppercase; font-style: italic;">¡Hola, ${datos.nombre}! 🎉</h2>
            <p style="color: #475569; font-size: 16px;">Hemos verificado tu pago con éxito. Aquí están tus números oficiales para el sorteo:</p>
            
            <div style="background-color: #eff6ff; border: 2px dashed #2563eb; padding: 20px; border-radius: 10px; margin: 25px 0;">
                <h3 style="color: #1e3a8a; font-size: 24px; margin: 0; letter-spacing: 3px;">${datos.tickets.join(' - ')}</h3>
            </div>
            
            <p style="color: #475569; font-size: 14px;">Recuerda que puedes revisar tus boletos y el estado del sorteo en vivo haciendo clic aquí:</p>
            
            <a href="https://www.ganaconjuvenil.com/mistickets" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 10px; text-transform: uppercase;">Ir a Mis Tickets</a>
            
            <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">¡Mucha suerte! 🍀<br>El equipo de Gana con Juvenil</p>
        </div>
      `;
    } else {
      return res.status(400).json({ error: 'Tipo de correo inválido' });
    }

    // Enviamos el correo con Resend
    const data = await resend.emails.send({
      from: 'Sorteos <sorteos@ganaconjuvenil.com>',
      to: email,
      subject: subject,
      html: htmlTemplate,
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error enviando correo:", error);
    res.status(500).json({ error: error.message });
  }
}