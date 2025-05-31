const { createUser, getUserByEmail } = require('../models/userModels');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const enviarCorreo = require('../utils/mailer');
const pool = require('../config/db');
const nodemailer = require('nodemailer');

// Registrar un nuevo usuario
const registerUser = async (req, res) => {
  const { cedula, nombre_usuario, email, password } = req.body;

  if (!cedula || !nombre_usuario || !email || !password) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear el usuario con estado_cuenta = 'pendiente'
    const newUser = await createUser(cedula, nombre_usuario, email, password); // este debe tener el campo estado_cuenta

    // Generar token de verificación
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const verificationLink = `http://localhost:3000/auth/verify?token=${token}`;

    // Enviar correo de verificación
    await enviarCorreo(email, 'Confirma tu registro', `
      <h3>¡Hola ${nombre_usuario}!</h3>
      <p>Gracias por registrarte en Mercabit. Por favor, confirma tu cuenta haciendo clic en el siguiente enlace:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>Este enlace expirará en 24 horas.</p>
    `);
    ;

    res.status(201).json({
      message: 'Usuario creado. Verifica tu correo para activar la cuenta.',
      user: newUser,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// Iniciar sesión (login) de un usuario
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Verificacion de Correo confirmado 
    if (user.estado_cuenta !== 'activo') {
      return res.status(401).json({ message: 'Debes verificar tu correo antes de iniciar sesión.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // Generar el JWT
    const token = jwt.sign({ id: user.usuario_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login exitoso', token });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

// Obtener el perfil de usuario (requiere autenticación)
const getUserProfile = async (req, res) => {
  try {
    const user = await getUserByEmail(req.user.email); // Usamos el email del token
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({
      nombre_usuario: user.nombre_usuario,
      email: user.email,
      foto_usuario: user.foto_usuario,
      saldo: user.saldo,
      cedula: user.cedula
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
};

// Verificacion de confirmacion de creacion de la cuenta
const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    // Cambiar estado_cuenta a 'activo'
    await pool.query(`UPDATE usuarios SET estado_cuenta = 'activo' WHERE email = $1`, [email]);

    res.send('¡Cuenta verificada con éxito!');
  } catch (error) {
    console.error(error); // Esto ayudará a entender más detalles del error
    res.status(400).send('Token inválido o expirado');
  }
};

// Solicitar recuperación de contraseña (envío de token al correo)
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Falta el correo electrónico' });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Generar un token para restablecer la contraseña
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`;

    // Enviar el correo con el enlace de recuperación
    await enviarCorreo(email, 'Recupera tu contraseña', `
      <h3>¡Hola!</h3>
      <p>Hemos recibido una solicitud para recuperar tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Este enlace expirará en 1 hora.</p>
    `);

    res.status(200).json({
      message: 'Correo de recuperación enviado, por favor revisa tu bandeja de entrada.',
    });
  } catch (error) {
    console.error('Error al enviar correo de recuperación:', error);
    res.status(500).json({ message: 'Error al enviar correo de recuperación', error: error.message });
  }
};

// Restablecer la contraseña
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    await updateUserPassword(email, hashedPassword);

    res.status(200).json({
      message: 'Contraseña actualizada con éxito',
    });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(400).json({ message: 'Token inválido o expirado', error: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, verifyEmail, resetPassword, requestPasswordReset };
