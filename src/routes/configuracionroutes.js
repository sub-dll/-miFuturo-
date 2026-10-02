const express = require('express');
const router = express.Router();

// Importar el controlador (revisa la ruta y la C mayúscula en el nombre del archivo si aplica)
const configuracionController = require('../controllers/configuracioncontroller');

// Definir las rutas
router.get('/', configuracionController.obtenerConfiguracion);
router.post('/', configuracionController.actualizarConfiguracion);

module.exports = router;