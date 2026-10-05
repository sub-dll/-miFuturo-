const express = require('express');
const path = require('path');
const session = require('express-session'); // <-- 1. Importación de la librería
const app = express();

// Middleware para entender los datos de los formularios HTML/EJS
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Aquí conectamos las rutas de autenticación (si creaste el authRoutes.js)
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

const PORT = process.env.PORT || 3000;
require('./infrastructure/database/db.js');

// Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'infrastructure/views'));

// 3. Como 'public' está en la raíz (fuera de 'src'), subimos un nivel con '..' para encontrarla:
app.use(express.static(path.join(__dirname, '../public')));

// Importar el enrutador de vistas (está dentro de src/routes/vistas.js)
const vistasRoutes = require('./routes/vistas');

// Middlewares para procesar peticiones HTTP (Estos son los de formularios)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// <-- 2. Configuración de express-session -->
app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto_temporal_mifuturo',
    resave: false,
    saveUninitialized: false
}));

// Registrar las rutas principales
app.use('/', vistasRoutes);

// Encender el servidor
app.listen(PORT, () => {
  console.log(` Servidor ejecutándose en http://localhost:${PORT}`);
});