// src/routes/transacciones.routes.js
const express = require('express');
const router = express.Router();
const transaccionesController = require('../controllers/transaccionesController');
const authenticateToken = require('../middlewares/authMiddleware')

//Todas las rutas estan proteguidas
router.use(authenticateToken);

// Historial de compras del usuario
router.get('/compras', transaccionesController.obtenerComprasPorUsuario);

// Historial de ventas del usuario
router.get('/ventas', transaccionesController.obtenerVentasPorUsuario);

// Ruta para registrar la compra de una subasta
router.post('/transacciones', transaccionesController.registrarTransaccionCompra);

module.exports = router;
