const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta POST que recibe los datos del formulario de registro
router.post('/registro', authController.registrarUsuario);

// Ruta POST que recibe los datos del formulario de login
router.post('/login', authController.iniciarSesion);

// Rutas de recuperación de contraseña
router.post('/recuperar', authController.solicitarRecuperacion);
router.get('/restablecer', authController.mostrarRestablecimiento);
router.post('/restablecer', authController.restablecerPassword);

// RUTA GET para cerrar sesión (conectada con el enlace /logout de la navbar)
router.get('/logout', authController.cerrarSesion);

module.exports = router;