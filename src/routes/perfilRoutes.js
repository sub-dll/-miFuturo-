const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');

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

// Modificar correo, teléfono, nombre de usuario o contraseña
router.post('/perfil/actualizar', requiereSesion, perfilController.actualizarPerfil);

module.exports = router;
