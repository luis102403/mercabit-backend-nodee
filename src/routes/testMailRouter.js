const express = require('express');
const router = express.Router();
const enviarCorreo = require('../utils/mailer');

router.post('/test-mail', async (req, res) => {
  const { to } = req.body;
  try {
    await enviarCorreo(to, 'Correo de prueba Mercabit', `
      <h1>¡Hola desde Mercabit!</h1>
      <p>Esto es un correo de prueba con</p>
    `);
    res.status(200).json({ message: 'Correo enviado con éxito' });
  } catch (err) {
    res.status(500).json({ error: 'Error enviando correo' });
  }
});

module.exports = router;
