const { Notificacion } = require('./models/notificacionModel');  // Suponiendo que tienes un modelo de notificaciones

// Función para crear una notificación
async function crearNotificacion(usuario_id, subasta_id, mensaje, tipo) {
  const notificacion = new Notificacion({
    usuario_id,
    subasta_id,
    mensaje,
    tipo,
  });

  await notificacion.save();
  console.log(`Notificación enviada a ${usuario_id}: ${mensaje}`);
}

// Funciones específicas para los tipos de notificación
async function notificarSubastaGanada(usuario_id, subasta_id, titulo_subasta) {
  const mensaje = `¡Felicidades! Has ganado la subasta "${titulo_subasta}".`;
  const tipo = 'subasta_ganada';
  await crearNotificacion(usuario_id, subasta_id, mensaje, tipo);
}

async function notificarOfertaSuperada(usuario_id, subasta_id, titulo_subasta) {
  const mensaje = `Tu oferta ha sido superada en la subasta "${titulo_subasta}".`;
  const tipo = 'oferta_superada';
  await crearNotificacion(usuario_id, subasta_id, mensaje, tipo);
}

async function notificarSubastaFinalizada(usuario_id, subasta_id, titulo_subasta) {
  const mensaje = `La subasta "${titulo_subasta}" ha finalizado.`;
  const tipo = 'subasta_finalizada';
  await crearNotificacion(usuario_id, subasta_id, mensaje, tipo);
}

module.exports = { 
  crearNotificacion, 
  notificarSubastaGanada, 
  notificarOfertaSuperada, 
  notificarSubastaFinalizada 
};
