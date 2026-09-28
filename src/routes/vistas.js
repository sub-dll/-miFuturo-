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

// Ruta para el Foro (busca foros-principal.ejs)
router.get('/foros', (req, res) => {
    res.render('foros-principal', {
        universidades: []
    });
});

// Rutas de ejemplo para testear sin conectar la base de datos

router.get("/foros/universidad", (req, res) => {
    res.render("foros-universidad", {
        universidad: {
            id_universidad: 1,
            nombre: "Universidad Católica de Temuco"
        },
        carreras: [],
        buscar: ""
    });
});
router.get("/foros/temas", (req, res) => {
    res.render("foros-temas", {
        tituloForo: "Ingeniería Civil Informática",
        hilos: [],
        buscar: ""
    });
});
router.get("/foros/hilo", (req, res) => {
    res.render("foros-hilo", {
        hilo: {
            id_hilo: 1,
            titulo: "Hilo de prueba",
            usuario: "Usuario de prueba",
            contenido: "Contenido de prueba",
            likes: 5,
            fecha: "28/09/2026"
        },
        respuestas: []
    });
});



module.exports = router;