const Notificacion = require('../models/notificacionModel');

async function crearNotificacion(req, res) {
    try {
        const { usuario_id, subasta_id, oferta_id, mensaje, tipo } = req.body;

        // Validación para verificar si los datos requeridos están presentes
        if (!usuario_id || !subasta_id || !mensaje || !tipo) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        // Si mensaje está vacío o nulo, asignar un mensaje predeterminado
        if (!mensaje.trim()) {
            return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
        }

        // Verificar si la subasta existe
        const subastaExiste = await Notificacion.existeSubasta(subasta_id);
        if (!subastaExiste) {
            return res.status(400).json({ message: 'La subasta no existe' });
        }

        // Si hay oferta, verificar que exista
        if (oferta_id) {
            const ofertaExiste = await Notificacion.existeOferta(oferta_id);
            if (!ofertaExiste) {
                return res.status(400).json({ message: 'La oferta no existe' });
            }
        }

        // Crear la notificación
        const notificacion = await Notificacion.crearNotificacion(
            usuario_id,
            subasta_id,
            oferta_id,
            mensaje,
            tipo
        );

        // Responder con la notificación creada
        res.json(notificacion);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear notificación', error: error.message });
    }
}


async function getNotificacionesPorUsuario(req, res) {
    try {
        const usuario_id = req.user.id;
        const notificaciones = await Notificacion.getNotificacionesPorUsuario(usuario_id);
        res.json(notificaciones);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener notificaciones', error: error.message });
    }
}

async function marcarComoLeida(req, res) {
    try {
        const { id } = req.params;
        const notificacion = await Notificacion.marcarComoLeida(id);
        res.json(notificacion);
    } catch (error) {
        res.status(500).json({ message: 'Error al marcar como leída', error: error.message });
    }
}

async function marcarTodasComoLeidas(req, res) {
    try {
        const { usuario_id } = req.params;
        const notificaciones = await Notificacion.marcarTodasComoLeidas(usuario_id);
        res.json(notificaciones);
    } catch (error) {
        res.status(500).json({ message: 'Error al marcar todas como leídas', error: error.message });
    }
}

// Endpoint para obtener las notificaciones de un usuario
async function obtenerNotificaciones(req, res) {
    try {
      const usuario_id = req.user.usuario_id; // Viene del token JWT
  
      const notificaciones = await Notificacion.getNotificacionesPorUsuario(usuario_id);
  
      if (notificaciones.length === 0) {
        return res.status(404).json({ message: 'No hay notificaciones para este usuario.' });
      }
  
      res.json({ notificaciones });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener las notificaciones', error: error.message });
    }
  }

module.exports = {
    crearNotificacion,
    getNotificacionesPorUsuario,
    marcarComoLeida,
    marcarTodasComoLeidas,
    obtenerNotificaciones
};
