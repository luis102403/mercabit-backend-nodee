// models/categoriaModel.js
const db = require('../config/db');

const obtenerCategorias = async () => {
  const result = await db.query('SELECT * FROM categorias');
  return result.rows;
};

// Función para obtener productos por categoría
const getProductosPorCategoria = async (categoria_id) => {
  const query = `
    SELECT 
      s.subasta_id,
      s.titulo,
      s.imagen_producto,
      s.descripcion,
      s.precio_inicial,
      s.precio_compra_inmediata,
      s.precio_final,
      s.duracion,
      s.fecha_inicio,
      s.fecha_finalizacion,
      s.estado,
      c.nombre AS categoria_nombre
    FROM 
      subastas s
    JOIN 
      categorias c ON s.categoria_id = c.categoria_id
    WHERE 
      c.categoria_id = $1;
  `;
  const values = [categoria_id];

  try {
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error('Error al obtener productos por categoría: ' + error.message);
  }
};

module.exports = {
  obtenerCategorias,
  getProductosPorCategoria
};
