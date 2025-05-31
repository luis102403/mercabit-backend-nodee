// src/config/db.js
const { Pool } = require('pg');

// Creamos un "pool" de conexiones a la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

pool.on('connect', () => {
  console.log('Conexión a la base de datos establecida');
});

module.exports = pool;
