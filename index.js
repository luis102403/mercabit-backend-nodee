// index.js
const express = require('express');
const app = express();
require('dotenv').config(); 
require('./src/cronJobs/cronJobs');
const testMailRouter = require('./src/routes/testMailRouter');
const authRoutes = require('./src/routes/auth');
const subastaRouter = require('./src/routes/subasta');
const ofertaRouter = require('./src/routes/oferta');
const notificacionRoutes = require('./src/routes/notificacion');
const transaccionesRoutes = require('./src/routes/transacciones'); // Asegúrate de que la ruta sea correcta
const cors = require('cors');
const categoriaRoutes = require('./src/routes/categoria');

const PORT = process.env.PORT || 3000;

// Middleware para que el servidor entienda JSON
app.use(express.json());
// Habilita CORS para permitir solicitudes desde el frontend
app.use(cors());

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'Bienvenido al Backend Mercabit API' });
});

// Registro de rutas
app.use('/auth', authRoutes); 
app.use('/api/subastas', subastaRouter);
app.use('/api/ofertas', ofertaRouter);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/transacciones', transaccionesRoutes); // Asegúrate de que la ruta sea correcta
app.use('/api', testMailRouter);
app.use('/api/categorias', categoriaRoutes); 

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
