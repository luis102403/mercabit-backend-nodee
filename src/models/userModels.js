// src/models/user.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const createUser = async (cedula, nombre_usuario, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const saldoInicial = 100000000;
  const query = `
    INSERT INTO usuarios (cedula, nombre_usuario, email, password_hash, saldo, estado_cuenta)
    VALUES ($1, $2, $3, $4, $5, 'pendiente')
    RETURNING usuario_id, cedula, nombre_usuario, email, foto_usuario, fecha_registro, saldo, estado_cuenta
  `;
  const values = [cedula, nombre_usuario, email, hashedPassword, saldoInicial];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error('Error al crear usuario: ' + error.message);
  }
};

// Función para obtener un usuario por email
const getUserByEmail = async (email) => {
  const query = 'SELECT * FROM usuarios WHERE email = $1';
  const values = [email];

  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Retornamos el primer usuario encontrado
  } catch (error) {
    throw new Error('Error al obtener usuario: ' + error.message);
  }
};

const aumentarSaldoUsuario = async (usuario_id, monto) => {
  await pool.query(`
    UPDATE usuarios
    SET saldo = saldo + $1
    WHERE usuario_id = $2
  `, [monto, usuario_id]);
};

const disminuirSaldoUsuario = async (usuario_id, monto) => {
  await pool.query(`
    UPDATE usuarios
    SET saldo = saldo - $1
    WHERE usuario_id = $2
  `, [monto, usuario_id]);
};

// Actualizar la contraseña
const updateUserPassword = async (email, password) => {
  const result = await pool.query(
    'UPDATE usuarios SET password_hash = $1 WHERE email = $2 RETURNING *',
    [password, email]
  );
  return result.rows[0]; // Regresa el usuario actualizado
};

module.exports = { createUser, getUserByEmail, aumentarSaldoUsuario, disminuirSaldoUsuario, updateUserPassword };
