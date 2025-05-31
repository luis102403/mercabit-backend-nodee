// src/controllers/transaccionesController.js

const transaccionesModel = require('../models/transaccionesModel');
const { cerrarSubastaComoVendida, registrarTransaccion, obtenerSubastaPorId } = require('../models/subastaModels');

const obtenerComprasPorUsuario = async (req, res) => {
  console.log('Usuario autenticado:', req.user);
  const usuario_id  = req.user.id; 

  try {
    const compras = await transaccionesModel.obtenerComprasPorUsuario(usuario_id);
    res.json(compras);
  } catch (err) {
    console.error('Error al obtener compras:', err);
    res.status(500).json({ error: 'Error al obtener las compras del usuario.' });
  }
};

const obtenerVentasPorUsuario = async (req, res) => {
  const  usuario_id  = req.user.id;

  try {
    const ventas = await transaccionesModel.obtenerVentasUsuario(usuario_id);
    res.json(ventas);
  } catch (err) {
    console.error('Error al obtener ventas:', err);
    res.status(500).json({ error: 'Error al obtener las ventas del usuario.' });
  }
};

// Ruta para registrar una transacción
const registrarTransaccionCompra = async (req, res) => {  // <-- Aquí agregué 'async' a la función
  const { subasta_id, monto_total } = req.body;

  if (!subasta_id || !monto_total) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  const { usuario_id } = req.user;
  
  try {
    // 1. Verificar si la subasta ya está vendida
    const subasta = await obtenerSubastaPorId(subasta_id);
    if (!subasta) {
      return res.status(404).json({ message: 'Subasta no encontrada' });
    }
    if (subasta.estado === 'vendida') {
      return res.status(400).json({ message: 'La subasta ya ha sido vendida' });
    }

    // 2. Registrar la transacción en la tabla transacciones
    const transaccion = await registrarTransaccion(subasta_id, usuario_id, monto_total);

    // 3. Marcar la subasta como vendida y asignar al usuario ganador
    await cerrarSubastaComoVendida(subasta_id, usuario_id);

    // 4. Registrar el pago en la transacción
    await transaccionesModel.registrarPago(transaccion.transaccion_id, new Date());

    // Enviar respuesta
    res.status(201).json({ message: 'Transacción completada y subasta cerrada', transaccion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar la transacción', error: error.message });
  }
};

module.exports = {
  obtenerComprasPorUsuario,
  obtenerVentasPorUsuario,
  registrarTransaccionCompra
};
