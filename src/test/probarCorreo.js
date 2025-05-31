const enviarCorreo = require('../utils/mailer');
require('dotenv').config(); 

const main = async () => {
  try {
    await enviarCorreo(
      'tu_destinatario@gmail.com',  // Cambia por un correo válido tuyo
      '¡Hola desde Mercabit! 🚀',
      '<h1>Hola 👋</h1><p>Este es un correo de prueba desde tu backend.</p>'
    );
  } catch (error) {
    console.error('Error al enviar:', error);
  }
};

main();
