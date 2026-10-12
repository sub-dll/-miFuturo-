const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

// 1. Middlewares para entender los datos de los formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2. Configuración de express-session (¡DEBE ir ANTES de las rutas!)
app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto_temporal_mifuturo',
    resave: false,
    saveUninitialized: false
}));

// Middleware para pasar la sesión a todas las vistas EJS (Navbar condicional)
app.use((req, res, next) => {
    // Si existe la sesión, la pasamos a la vista. Si no, pasamos null.
    res.locals.usuario = (req.session && req.session.usuario) ? req.session.usuario : null;
    next();
});

// 3. Configuración de Vistas EJS y Archivos Estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'infrastructure/views'));
app.use(express.static(path.join(__dirname, '../public')));

// 4. Importar y Registrar Rutas
const vistasRoutes = require('./routes/vistas');
const authRoutes = require('./routes/authRoutes');
const comparadorRoutes = require('./routes/comparadorRoutes');
const perfilRoutes = require('./routes/perfilRoutes'); 

// Registrar las rutas principales
app.use('/', perfilRoutes);  
app.use('/', vistasRoutes);
app.use('/', authRoutes); 
app.use('/comparador', comparadorRoutes);

// 5. Base de Datos y Encendido del Servidor
require('./infrastructure/database/db.js');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
