const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Motor de plantillas EJS
app.set('view engine', 'ejs');

// 2. Como server.js está en 'src', subimos un nivel con '..' para entrar a 'src/infrastructure/views' 
// o simplemente apuntamos directo si estás en la misma ruta:
app.set('views', path.join(__dirname, 'infrastructure/views'));

// 3. Como 'public' está en la raíz (fuera de 'src'), subimos un nivel con '..' para encontrarla:
app.use(express.static(path.join(__dirname, '../public')));

// Importar el enrutador de vistas (está dentro de src/routes/vistas.js)
const vistasRoutes = require('./routes/vistas');

// Middlewares para procesar peticiones HTTP
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registrar las rutas principales
app.use('/', vistasRoutes);

// Encender el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});