const { createSubasta, getAllSubastas, getSubastaById, updateSubasta, cancelarSubasta, getSubastasActivas, getAuctionsBySeller } = require('../models/subastaModels');
const { notificarSubastaGanada, notificarSubastaFinalizada } = require('./notificacionesController');

// Crear una nueva subasta
async function crearSubasta(req, res) {
  const vendedor_id = req.user.id;
  const { titulo, imagen_producto, descripcion, categoria_id, precio_inicial, precio_compra_inmediata, duracion, precio_actual } = req.body;

  if (!titulo || !imagen_producto || !descripcion || !categoria_id || !precio_inicial || !duracion || !precio_actual) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const newSubasta = await createSubasta(vendedor_id, titulo, imagen_producto, descripcion, categoria_id, precio_inicial, precio_compra_inmediata, duracion, precio_actual);
    res.status(201).json({ message: 'Subasta creada exitosamente', subasta: newSubasta });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear subasta', error: error.message });
  }
}

// Obtener todas las subastas
async function obtenerSubastas(req, res){
  try {
    const subastas = await getAllSubastas();
    res.json(subastas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener subastas', error: error.message });
  }
};

// Obtener las subas Activas
const getSubastasActivasController = async (req, res) => {
  try {
    const subastas = await getSubastasActivas()
    res.json(subastas)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Obtener una subasta por ID / incrementar vistas
async function obtenerSubastaPorId(req, res) {
  const subasta_id = req.params.id;

  try {
    const subasta = await getSubastaById(subasta_id);  // Este ya actualiza vistas
    if (!subasta) {
      return res.status(404).json({ message: 'Subasta no encontrada' });
    }
    res.json(subasta);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener subasta', error: error.message });
  }
}

//Obtener subasta por vendedor
async function obtenerSubastasPorVendedor(req, res){
  const vendedor_id = req.user.id;

  try {
    const subastas = await getAuctionsBySeller(vendedor_id);
    res.json(subastas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener subastas del vendedor', error: error.message });
  }
};

// Actualizar una subasta
async function actualizarSubasta(req, res){
  const subasta_id = req.params.id;
  const vendedor_id = req.user.usuario_id;  // Extraemos el vendedor_id del token JWT

  const {
    titulo,
    imagen_producto,
    descripcion,
    categoria_id,
    precio_inicial,
    precio_compra_inmediata,
    duracion
  } = req.body;

  if (!titulo || !imagen_producto || !descripcion || !categoria_id || !precio_inicial || !duracion) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const subasta = await getSubastaById(subasta_id);
    if (!subasta) {
      return res.status(404).json({ message: 'Subasta no encontrada' });
    }

    if (subasta.vendedor_id !== vendedor_id) {
      return res.status(403).json({ message: 'No tienes permiso para actualizar esta subasta' });
    }

    const updatedSubasta = await updateSubasta(subasta_id, vendedor_id, titulo, imagen_producto, descripcion, categoria_id, precio_inicial, precio_compra_inmediata, duracion);

    res.json({ message: 'Subasta actualizada exitosamente', subasta: updatedSubasta });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar subasta', error: error.message });
  }
};


//Cancelar una subasta
async function cancelar_Subasta (req, res) {
  const subasta_id = req.params.id;
  const vendedor_id = req.user.usuario_id;  // Extraemos el vendedor_id del token JWT

  try {
    const subasta = await getSubastaById(subasta_id);
    if (!subasta) return res.status(404).json({ message: 'Subasta no encontrada' });

    if (subasta.vendedor_id !== vendedor_id) {
      return res.status(403).json({ message: 'No tienes permiso para cancelar esta subasta' });
    }

    if (subasta.estado !== 'activa') {
      return res.status(400).json({ message: 'Solo se pueden cancelar subastas activas' });
    }

    const ofertasActivas = await tieneOfertas(subasta_id);
    if (ofertasActivas) {
      return res.status(400).json({ message: 'No se puede cancelar una subasta con ofertas activas' });
    }

    const subastaCancelada = await cancelarSubasta(subasta_id);
    res.json({ message: 'Subasta cancelada exitosamente', subasta: subastaCancelada });

  } catch (error) {
    res.status(500).json({ message: 'Error al cancelar subasta', error: error.message });
  }
};


// Función para finalizar la subasta
async function finalizar_Subasta(req, res) {
  const subasta_id = req.params.id;
  const vendedor_id = req.user.usuario_id;  // Extraemos el vendedor_id del token JWT

  try {
    const subasta = await getSubastaById(subasta_id);

    if (!subasta) {
      return res.status(404).json({ message: 'Subasta no encontrada' });
    }

    if (subasta.vendedor_id !== vendedor_id) {
      return res.status(403).json({ message: 'No tienes permiso para finalizar esta subasta' });
    }

    if (subasta.estado === 'finalizada') {
      return res.status(400).json({ message: 'La subasta ya está finalizada' });
    }

    // Cambiar el estado de la subasta a finalizada
    const updatedSubasta = await updateSubasta(subasta_id, subasta.titulo, subasta.imagen_producto, subasta.descripcion, subasta.categoria_id, subasta.precio_inicial, subasta.precio_compra_inmediata, subasta.duracion);

    // Enviar notificación al ganador, si existe
    if (subasta.usuario_ganador_id) {
      await notificarSubastaGanada(subasta.usuario_ganador_id, subasta.subasta_id, subasta.titulo);
    }

    // Notificar al vendedor
    await notificarSubastaFinalizada(subasta.vendedor_id, subasta.subasta_id, subasta.titulo);

    res.json({ message: 'Subasta finalizada exitosamente', subasta: updatedSubasta });
  } catch (error) {
    res.status(500).json({ message: 'Error al finalizar subasta', error: error.message });
  }
}

module.exports = {
  finalizar_Subasta,
  cancelar_Subasta,
  crearSubasta, 
  obtenerSubastas,
  obtenerSubastaPorId, 
  obtenerSubastasPorVendedor, 
  actualizarSubasta,
  getSubastasActivasController
};