const pool = require('../config/db');

// Crear nueva oferta
async function crearOferta(subasta_id, usuario_id, cantidad) {
  // Obtener la oferta más alta actual
  const { rows: ofertasAltas } = await pool.query(
    `SELECT * FROM ofertas 
     WHERE subasta_id = $1 AND estado = 'activa'
     ORDER BY cantidad DESC LIMIT 1`,
    [subasta_id]
  );

  const ofertaAnterior = ofertasAltas[0];
  const cantidadMaxima = ofertaAnterior?.cantidad || 0;
  const es_mas_alta = parseFloat(cantidad) > parseFloat(cantidadMaxima);

  // Si es la nueva más alta, actualizar las demás y notificar
  if (es_mas_alta) {
    // 1. Desmarcar ofertas anteriores como la más alta
    await pool.query(
      `UPDATE ofertas SET es_mas_alta = false WHERE subasta_id = $1`,
      [subasta_id]
    );

    // 2. Insertar nueva oferta como más alta
    const { rows } = await pool.query(
      `INSERT INTO ofertas (subasta_id, usuario_id, cantidad, es_mas_alta)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [subasta_id, usuario_id, cantidad, es_mas_alta]
    );

    const nuevaOferta = rows[0];

    // 3. Notificar al usuario anterior si existía
    if (ofertaAnterior) {
      const mensaje = `Tu oferta de $${ofertaAnterior.cantidad} ha sido superada en la subasta #${subasta_id}.`;

      await pool.query(
        `INSERT INTO notificaciones (usuario_id, subasta_id, oferta_id, mensaje, tipo)
         VALUES ($1, $2, $3, $4, 'oferta_superada')`,
        [ofertaAnterior.usuario_id, subasta_id, ofertaAnterior.oferta_id, mensaje]
      );
    }

    return nuevaOferta;
  }

  // Si no es más alta, igual se guarda la oferta
  const { rows } = await pool.query(
    `INSERT INTO ofertas (subasta_id, usuario_id, cantidad, es_mas_alta)
     VALUES ($1, $2, $3, false) RETURNING *`,
    [subasta_id, usuario_id, cantidad]
  );

  return rows[0];
}


// Obtener todas las ofertas de una subasta
async function obtenerOfertasPorSubasta(subasta_id) {
  const { rows } = await pool.query(
    `SELECT o.*, u.nombre_usuario 
     FROM ofertas o
     JOIN usuarios u ON o.usuario_id = u.usuario_id
     WHERE subasta_id = $1
     ORDER BY fecha_hora DESC`,
    [subasta_id]
  );

  return rows;
}

// Obtener todas las ofertas
async function getAllOfertas() {
  const result = await pool.query(`
    SELECT o.*, u.nombre_usuario
    FROM ofertas o
    JOIN usuarios u ON o.usuario_id = u.usuario_id
    ORDER BY o.fecha_hora DESC
  `);
  return result.rows;
}

// Eliminar oferta activa de un usuario
async function eliminarOferta(oferta_id, usuario_id) {
  const { rowCount } = await pool.query(
    `DELETE FROM ofertas 
     WHERE oferta_id = $1 AND usuario_id = $2 AND estado = 'activa'`,
    [oferta_id, usuario_id]
  );
  return rowCount > 0;
}

// Cambiar estado de una oferta
async function actualizarEstadoOferta(oferta_id, nuevoEstado) {
  const { rowCount } = await pool.query(
    `UPDATE ofertas SET estado = $1 WHERE oferta_id = $2`,
    [nuevoEstado, oferta_id]
  );
  return rowCount > 0;
}

// Obtener la oferta más alta
async function obtenerOfertaMasAlta(subasta_id) {
  const { rows } = await pool.query(
    `SELECT o.*, u.nombre_usuario 
     FROM ofertas o 
     JOIN usuarios u ON o.usuario_id = u.usuario_id 
     WHERE o.subasta_id = $1 AND o.es_mas_alta = true
     LIMIT 1`,
    [subasta_id]
  );
  return rows[0];
}

// Historial de ofertas por usuario
async function obtenerOfertasPorUsuario(usuario_id) {
  const { rows } = await pool.query(
    `SELECT o.*, s.titulo AS titulo_subasta 
     FROM ofertas o 
     JOIN subastas s ON o.subasta_id = s.subasta_id 
     WHERE o.usuario_id = $1 
     ORDER BY o.fecha_hora DESC`,
    [usuario_id]
  );
  return rows;
}

module.exports = {
  crearOferta,
  obtenerOfertasPorSubasta,
  getAllOfertas,
  eliminarOferta,
  obtenerOfertasPorUsuario,
  obtenerOfertaMasAlta,
  actualizarEstadoOferta
};
