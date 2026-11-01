const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const notificacionesController = require('../controllers/notificacionesController');

// ==========================================
// Middleware propio del perfil
// El login (authController) guarda req.session.id_usuario, pero el resto del
// proyecto espera req.session.userId. Aquí se aceptan ambos y se normaliza a userId.
// ==========================================
const requiereSesion = (req, res, next) => {
    const id = req.session && (req.session.userId || req.session.id_usuario);
    if (!id) {
        return res.redirect('/login');
    }
    req.session.userId = id;
    next();
};

// Ver el perfil con los datos reales del usuario
router.get('/perfil', requiereSesion, perfilController.obtenerPerfil);
// Ver la pestaña General del perfil con datos de BD
router.get('/perfil/general', requiereSesion, perfilController.obtenerPerfilGeneral);

// Modificar correo, teléfono, nombre de usuario o contraseña
router.post('/perfil/actualizar', requiereSesion, perfilController.actualizarPerfil);

router.get('/notificaciones', requiereSesion, notificacionesController.obtenerHistorial);
router.post('/notificaciones/leer', requiereSesion, notificacionesController.marcarComoLeida);

module.exports = router;
