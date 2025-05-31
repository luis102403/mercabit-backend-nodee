const express = require('express');
const router = express.Router();
const subastaController = require('../controllers/subastaController');
const authenticateToken = require('../middlewares/authMiddleware')

//Todas las rutas estan proteguidas
router.use(authenticateToken);

// Ruta para crear una nueva subasta
router.post('/create', subastaController.crearSubasta);

// Ruta para obtener todas las subastas activas
router.get('/activas', subastaController.getSubastasActivasController);

// Ruta para obtener todas las subastas
router.get('/', subastaController.obtenerSubastas);

// Ruta para obtener subastas por vendedor
router.get('/vendedor', subastaController.obtenerSubastasPorVendedor);

// Ruta para obtener una subasta por ID
router.get('/:id', subastaController.obtenerSubastaPorId);

// Ruta para actualizar una subasta
router.put('/:id', subastaController.actualizarSubasta);

// Ruta para cancelara una subasta
router.put('/cancelar/:id', subastaController.cancelar_Subasta);

// Ruta para finalizar una subasta
router.post('/:id/finalizar', subastaController.finalizar_Subasta);

module.exports = router;