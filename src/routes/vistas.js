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

module.exports = router;