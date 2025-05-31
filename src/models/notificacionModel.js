const pool = require('../config/db');

// Función para crear una notificación
const crearNotificacion = async (usuario_id, subasta_id, mensaje, tipo) => {
  // Asigna un mensaje por defecto si no se proporciona
  const mensajeFinal = mensaje || 'Tienes una nueva notificación';

  const query = `
      INSERT INTO notificaciones (usuario_id, subasta_id, mensaje, tipo)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
  const values = [usuario_id, subasta_id, mensajeFinal, tipo];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];  // Devuelve la notificación creada
  } catch (error) {
    throw new Error('Error al crear notificación: ' + error.message);
  }
};

// Verificar si existe una subasta
async function existeSubasta(subasta_id) {
  const { rows } = await pool.query(
    'SELECT 1 FROM subastas WHERE subasta_id = $1',
    [subasta_id]
  );
  return rows.length > 0;
}

// Verificar si existe una oferta
async function existeOferta(oferta_id) {
  const { rows } = await pool.query(
    'SELECT 1 FROM ofertas WHERE oferta_id = $1',
    [oferta_id]
  );
  return rows.length > 0;
}

// Obtener notificaciones por usuario
async function getNotificacionesPorUsuario(usuario_id) {
  const { rows } = await pool.query(
    `SELECT n.*, s.titulo AS titulo_subasta
         FROM notificaciones n
         LEFT JOIN subastas s ON n.subasta_id = s.subasta_id
         WHERE n.usuario_id = $1
         ORDER BY n.fecha_envio DESC`,
    [usuario_id]
  );
  return rows;
}

// Marcar una notificación como leída
async function marcarComoLeida(notificacion_id) {
  const { rows } = await pool.query(
    `UPDATE notificaciones 
         SET estado = 'leida' 
         WHERE notificacion_id = $1 
         RETURNING *`,
    [notificacion_id]
  );
  return rows[0];
}

// Marcar todas las notificaciones de un usuario como leídas
async function marcarTodasComoLeidas(usuario_id) {
  const result = await pool.query(
    `UPDATE notificaciones
         SET estado = 'leida'
         WHERE usuario_id = $1 AND estado = 'no_leida'
         RETURNING *`,
    [usuario_id]
  );
  return result.rows;
}

// Funcion para notificar a las personas horas antes de la subasta
async function notificarSubastasProximas() {
  // Consultamos las subastas que finalizan en las próximas 24 horas
  const { rows: subastasProximas } = await pool.query(
    `SELECT * FROM subastas 
       WHERE fecha_finalizacion BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '1 day' 
       AND estado = 'activa'`
  );

  for (let subasta of subastasProximas) {
    // Enviar notificación a todos los participantes de la subasta
    const { rows: usuariosSubasta } = await pool.query(
      `SELECT DISTINCT usuario_id FROM ofertas WHERE subasta_id = $1`,
      [subasta.subasta_id]
    );

    for (let usuario of usuariosSubasta) {
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, subasta_id, mensaje, tipo) 
           VALUES ($1, $2, $3, 'subasta_proxima')`,
        [usuario.usuario_id, subasta.subasta_id, `La subasta "${subasta.titulo}" está por finalizar en 24 horas.`]
      );
    }
  }
}

module.exports = {
  crearNotificacion,
  getNotificacionesPorUsuario,
  marcarComoLeida,
  marcarTodasComoLeidas,
  existeOferta,
  existeSubasta,
  notificarSubastasProximas
};
