// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware para verificar si el token es válido
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Obtener el token del encabezado

  if (!token) {
    return res.status(403).json({ message: 'No token provided' }); // Si no hay token
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token no válido' }); // Si el token es inválido
    }
    req.user = user; // Guardamos la información del usuario en la solicitud
    next(); // Continuamos con la siguiente acción en la ruta
  });
};

module.exports = authenticateToken;
