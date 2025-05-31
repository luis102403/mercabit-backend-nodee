const CategoriaModel = require('../models/categoriaModel');

const listarCategorias = async (req, res) => {
  try {
    const categorias = await CategoriaModel.obtenerCategorias();
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// Controlador obtener productos por categorias
const obtenerProductosPorCategoria = async (req, res) => {
  const categoria_id = req.params.categoria_id;

  try {
    const productos = await CategoriaModel.getProductosPorCategoria(categoria_id);
    res.status(200).json({ productos });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

module.exports = {
  listarCategorias,
  obtenerProductosPorCategoria
};
