// src/models/transaccionesModel.js
const pool = require('../config/db'); // Asegúrate de que la ruta sea correcta

const obtenerComprasPorUsuario = async (usuario_id) => {
  const { rows } = await pool.query(`
    SELECT 
      t.transaccion_id,
      t.subasta_id,
      s.titulo,
      s.descripcion,
      s.imagen_producto,
      c.nombre AS categoria,
      u.nombre_usuario AS nombre_vendedor,
      t.monto_total,
      t.fecha_pago
    FROM transacciones t
    JOIN subastas s ON t.subasta_id = s.subasta_id
    JOIN usuarios u ON s.vendedor_id = u.usuario_id
    JOIN categorias c ON s.categoria_id = c.categoria_id 
    WHERE t.comprador_id = $1
    ORDER BY t.fecha_pago DESC
  `, [usuario_id]);

  return rows;
};

const obtenerVentasUsuario = async (usuario_id) => {
  const { rows } = await pool.query(`
    SELECT 
      t.transaccion_id,
      t.subasta_id,
      s.titulo,
      t.monto_total,
      t.fecha_pago
    FROM transacciones t
    JOIN subastas s ON t.subasta_id = s.subasta_id
    WHERE s.vendedor_id = $1
    ORDER BY t.fecha_pago DESC
  `, [usuario_id]);

  return rows;
};

// Función para registrar el pago en la transacción
async function registrarPago(transaccion_id, fecha_pago) {
  const { rows } = await pool.query(
    `UPDATE transacciones SET fecha_pago = $1 WHERE transaccion_id = $2 RETURNING *`,
    [fecha_pago, transaccion_id]
  );
  return rows[0];  // Devolvemos la transacción actualizada con la fecha de pago
}

module.exports = {
  obtenerComprasPorUsuario,
  obtenerVentasUsuario,
  registrarPago
};
