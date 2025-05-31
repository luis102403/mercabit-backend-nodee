// routes/categoriaRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');
const categoriaController = require('../controllers/categoriaController');

//Todas las rutas estan proteguidas
router.use(authenticateToken);

//Ruta para obtener todas las categorias
router.get('/', categoriaController.listarCategorias);

// Ruta para obtener productos por categoría
router.get('/productos/:categoria_id', categoriaController.obtenerProductosPorCategoria);

module.exports = router;
