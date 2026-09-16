const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Decirle a Express que use EJS como motor de plantillas 
app.set('view engine', 'ejs');

// 2. Decirle a Express dónde están guardadas físicamente las vistas ahora 
app.set('views', path.join(__dirname, 'infrastructure/views'));

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