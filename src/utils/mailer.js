// utils/mailer.js
const nodemailer = require('nodemailer');
const config = require('../../config');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.email,
        pass: config.password
    },
});

// Función para enviar el correo
const enviarCorreo = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"Mercabit" <${config.email}>`,
            to,
            subject,
            html,
        });
        console.log('Correo enviado a', to);
    } catch (error) {
        console.error('Error enviando correo:', error);
        throw error;
    }
};

module.exports = enviarCorreo; // Exportando la función
