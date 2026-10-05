const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta POST que recibe los datos del formulario de registro
router.post('/registro', authController.registrarUsuario);

module.exports = router;