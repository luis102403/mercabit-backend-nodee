// Importa la conexión a la base de datos

const pool = require('../config/db');
// Importa el módulo para tareas programadas
const cron = require('node-cron');


// Importa funciones para modificar saldo de usuario
const { aumentarSaldoUsuario, disminuirSaldoUsuario } = require('../models/userModels');

// Importa la función para notificar subastas próximas
const { notificarSubastasProximas } = require('../models/notificacionModel');

const finalizarSubastas = async () => {
  try {
     // Consulta todas las subastas activas
    console.log('Verificando subastas vencidas...');
    const { rows: subastas } = await pool.query(`
      SELECT * FROM subastas
      WHERE estado = 'activa' AND fecha_finalizacion <= NOW()
    `);

    console.log(`Subastas vencidas encontradas: ${subastas.length}`);

    for (const subasta of subastas) {
      const { rows: [ofertaMasAlta] } = await pool.query(`
        SELECT * FROM ofertas
        WHERE subasta_id = $1
        ORDER BY cantidad DESC
        LIMIT 1
      `, [subasta.subasta_id]);

      let nuevoEstado = 'finalizada';
      let usuarioGanadorId = null;

      if (ofertaMasAlta) {
        nuevoEstado = 'vendida';
        usuarioGanadorId = ofertaMasAlta.usuario_id;

        // Crear transacción
        await pool.query(`
          INSERT INTO transacciones (comprador_id, subasta_id, monto_total, fecha_pago)
          VALUES ($1, $2, $3, NOW())
        `, [usuarioGanadorId, subasta.subasta_id, ofertaMasAlta.cantidad]);

        // Marcar oferta como ganadora
        await pool.query(`
          UPDATE ofertas
          SET estado = 'ganadora', es_mas_alta = true
          WHERE oferta_id = $1
        `, [ofertaMasAlta.oferta_id]);

        // Aumentar saldo del vendedor
        await aumentarSaldoUsuario(subasta.vendedor_id, ofertaMasAlta.cantidad);
      }

      // Actualizar subasta
      await pool.query(`
        UPDATE subastas
        SET estado = $1, usuario_ganador_id = $2
        WHERE subasta_id = $3
      `, [nuevoEstado, usuarioGanadorId, subasta.subasta_id]);

      // Notificar al vendedor
      const mensaje = nuevoEstado === 'vendida'
        ? `¡Tu subasta '${subasta.titulo}' ha sido vendida!`
        : `Tu subasta '${subasta.titulo}' finalizó sin ofertas`;

      await pool.query(`
        INSERT INTO notificaciones (usuario_id, subasta_id, mensaje, tipo)
        VALUES ($1, $2, $3, 'subasta_finalizada')
      `, [subasta.vendedor_id, subasta.subasta_id, mensaje]);

      // Notificar al ganador (si lo hay)
      if (usuarioGanadorId) {
        await pool.query(`
          INSERT INTO notificaciones (usuario_id, subasta_id, mensaje, tipo)
          VALUES ($1, $2, $3, 'ganador_subasta')
        `, [usuarioGanadorId, subasta.subasta_id, `¡Ganaste la subasta '${subasta.titulo}'!`]);
      }

      // Disminuir saldo del comprador
      await disminuirSaldoUsuario(usuarioGanadorId, ofertaMasAlta.cantidad);
    }

  } catch (err) {
    console.error('Error finalizando subastas:', err);
  }
};

// Configurar la tarea para ejecutar a medianoche todos los días
cron.schedule('0 0 * * *', async () => {
  console.log('Ejecutando tarea de notificación de subastas próximas...');
  try {
    await notificarSubastasProximas();
  } catch (error) {
    console.error('Error al enviar notificaciones de subastas próximas:', error);
  }
});

// Ejecutar cada minuto
cron.schedule('* * * * *', finalizarSubastas);
