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



// Rutas de >EJEMPLO< para testear sin conectar la base de datos

// Ruta para el Foro (busca foros-principal.ejs)
router.get("/foros", (req, res) => {

    const universidades = [
        {
            id_universidad: 1,
            nombre: "Universidad de Chile",
            cantidadCarreras: 12,
        },
        {
            id_universidad: 2,
            nombre: "Pontificia Universidad Católica de Chile",
            cantidadCarreras: 10,
        },
        {
            id_universidad: 3,
            nombre: "Universidad de Concepción",
            cantidadCarreras: 8,
        }
    ];

    res.render("foros-principal", {
        universidades: universidades
    });
});

router.get("/foros/universidad/:id", (req, res) => {

    const id = req.params.id;

    res.send(`
        <h1>Prueba del foro de universidad</h1>
        <p>ID recibido: ${id}</p>
        <a href="/foros">Volver a foros</a>
    `);
});


// Ruta para el Foro de una Universidad (busca foros-universidad.ejs)

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

// Ruta para el Foro de Temas (busca foros-temas.ejs)

router.get("/foros/temas", (req, res) => {
    res.render("foros-temas", {
        tituloForo: "Ingeniería Civil Informática",
        hilos: [],
        buscar: ""
    });
});

// Ruta para el Foro de un Hilo (busca foros-hilo.ejs)

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