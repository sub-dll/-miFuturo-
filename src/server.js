const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Importar el enrutador de vistas
const vistasRoutes = require('./routes/vistas');

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, '../public')));

// Middlewares para procesar peticiones HTTP
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registrar las rutas principales
app.use('/', vistasRoutes);

// Encender el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});