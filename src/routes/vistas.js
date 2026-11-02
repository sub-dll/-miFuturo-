const express = require('express');
const router = express.Router();
const db = require('../infrastructure/database/db');

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

router.get('/', async (req, res) => {
    try {
        // Obtenemos todas las universidades ordenadas alfabéticamente
        const [universidades] = await db.query(`SELECT id_universidad, nombre, logo_url, ciudad FROM Universidad ORDER BY nombre ASC`);
        
        // Extraemos un arreglo limpio sin duplicados de las ciudades disponibles
        const ciudades = [...new Set(universidades.map(u => u.ciudad).filter(Boolean))];

        res.render('index', { universidades, ciudades });
    } catch (error) {
        console.error('Error al cargar el home:', error);
        res.status(500).send('Error interno al cargar la página principal');
    }
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