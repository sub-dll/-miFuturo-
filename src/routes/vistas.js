const express = require('express');
const router = express.Router();

// MIDDLEWARE
const { protegerRuta } = require('../middlewares/authMiddleware');

// ==========================================
// 1. RUTAS PÚBLICAS Y DE AUTENTICACIÓN
// ==========================================
router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/registro', (req, res) => {
    res.render('registro');
});

router.get('/recuperar', (req, res) => {
    res.render('recuperar');
});

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/perfil-carrera', (req, res) => {
    res.render('perfil-carrera');
});

// ==========================================
// 2. RUTAS PRIVADAS SECUNDARIAS DEL PERFIL
// ==========================================
router.get('/perfil/preferencias', protegerRuta, (req, res) => {
    res.render('perfil-preferencias');
});

router.get('/perfil/notificaciones', protegerRuta, (req, res) => {
    res.render('perfil-notificaciones', { user: null });
});

// Exportamos el enrutador
module.exports = router;