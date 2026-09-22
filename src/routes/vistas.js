const express = require('express');
const router = express.Router(); // ¡Ya no necesitamos requerir 'path'!

// Ruta para el Home (busca index.ejs)
router.get('/', (req, res) => {
    res.render('index');
});

// Ruta para el Login (busca login.ejs)
router.get('/login', (req, res) => {
    res.render('login');
});

// Ruta para el Comparador (busca comparador.ejs)
router.get('/comparador', (req, res) => {
    res.render('comparador');
});

// Ruta para el Foro (busca foro.ejs)
router.get('/foros', (req, res) => {
    res.render('foro');
});

// NUEVA RUTA: Para el Perfil de cuenta (busca perfil-cuenta.ejs)
router.get('/perfil', (req, res) => {
    res.render('perfil-cuenta');
});
// NUEVA RUTA: Para el Perfil de preferencias (busca perfil-preferencias.ejs)
router.get('/perfil/preferencias', (req, res) => {
    res.render('perfil-preferencias');
});

module.exports = router;