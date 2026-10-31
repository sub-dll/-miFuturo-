const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

// 1. Middlewares para procesar datos de formularios e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2. Configuración de express-session (DEBE ir antes de las rutas)
app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto_temporal_mifuturo',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // En entorno de desarrollo (HTTP)
        maxAge: 1000 * 60 * 60 * 24 // Duración de la sesión: 24 horas
    }
}));

// 3. Middleware Global: Expone los datos del usuario autenticado a todas las vistas EJS
app.use((req, res, next) => {
    res.locals.usuario = (req.session && req.session.usuario) ? req.session.usuario : null;
    next();
});

// 4. Configuración del Motor de Plantillas (EJS) y Archivos Estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'infrastructure/views'));
app.use(express.static(path.join(__dirname, '../public')));

// 5. Importar Rutas de la rama actual
const vistasRoutes = require('./routes/vistas');
const authRoutes = require('./routes/authRoutes');
const comparadorRoutes = require('./routes/comparadorRoutes');
const perfilRoutes = require('./routes/perfilRoutes'); 

// Registrar las rutas
app.use('/', perfilRoutes);  
app.use('/', vistasRoutes);
app.use('/', authRoutes); 
app.use('/comparador', comparadorRoutes);

// 6. Conexión a Base de Datos y Encendido del Servidor
require('./infrastructure/database/db.js');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});