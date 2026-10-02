const express = require('express');
const path = require('path');   // tenemos que quitar esto despues ajustandotodos los EJS que tienen las lineas res.sendFile(path.join(...)) que era para los antiguo .html yr eplzararlo en todos los archivos EJS llamando a res.render(), la librería path
const router = express.Router();

// ==========================================
// 1. RUTAS DE AUTENTICACIÓN (Usan EJS)
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

// ==========================================
// 2. OTRAS VISTAS DEL PROYECTO
// ==========================================

// Redirige la raíz '/' automáticamente al Home
router.get('/', (req, res) => {
  res.render('index');
});

// NUEVA RUTA: Para el Perfil de cuenta (busca perfil-cuenta.ejs)
router.get('/perfil', (req, res) => {
    res.render('vista-panel/perfil-cuenta');
});

router.get('/comparador', (req, res) => {
  res.render('comparador');
});

router.get('/perfil-carrera', (req, res) => {
  res.render('perfil-carrera');
});

router.get('/perfil/general', (req, res) => {
    res.render('vista-panel/perfil-general');
});

// Ruta principal de Foros
router.get('/foros', (req, res) => {
    res.render('foros-principal', {
        // Datos de prueba para que el EJS cargue las tarjetas correctamente en la demo
        universidades: [
            {
                id_universidad: 1,
                nombre: "Universidad Católica de Temuco",
                cantidadCarreras: 45
            },
            {
                id_universidad: 2,
                nombre: "Universidad de La Frontera",
                cantidadCarreras: 52
            },
            {
                id_universidad: 3,
                nombre: "Universidad Mayor",
                cantidadCarreras: 28
            }
        ]
    });
});

// NUEVA RUTA: Para el Perfil de preferencias (busca perfil-preferencias.ejs)
router.get('/perfil/preferencias', (req, res) => {
    res.render('vista-panel/perfil-preferencias');
});

router.get('/perfil/notificaciones', (req, res) => {
    res.render('vista-panel/perfil-notificaciones', { user: null });
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


// Ruta para el Foro de Temas (busca foros-temas.ejs) con el id_programa como parámetro

router.get("/foros/temas/:id_programa", async (req, res) => {

    const id_programa = req.params.id_programa;

    const sql = `
        SELECT
            H.id_hilo,
            H.titulo,
            H.contenido,
            H.fecha_publicacion,
            H.likes,
            H.dislikes,
            H.id_usuario,
            H.id_programa,
            U.username,
            U.nombres,
            U.apellidos,
            U.avatar_url,
            C.nombre_carrera
        FROM Hilo H
        INNER JOIN Usuario U
            ON H.id_usuario = U.id_usuario
        INNER JOIN Programa_Universitario P
            ON H.id_programa = P.id_programa
        INNER JOIN Carrera_Base C
            ON P.id_carrera_base = C.id_carrera_base
        WHERE H.id_programa = ?
        ORDER BY H.fecha_publicacion DESC
    `;

    try {

        const [hilos] = await db.query(sql, [id_programa]);

        // Si existen hilos, todos tendrán el mismo programa/carrera
        // por lo que podemos obtener el nombre desde el primer resultado.
        const tituloForo = hilos.length > 0
            ? hilos[0].nombre_carrera
            : "Foro";

        res.render("foros-temas", {
            tituloForo: tituloForo,
            hilos: hilos,
            buscar: ""
        });

    } catch (error) {

        console.error("Error al obtener los hilos:", error);
        res.status(500).send("Error al obtener los hilos");

    }
});


// Ruta para crear un nuevo hilo, insertando un registro en la base de datos
// Se entra desde /foros/temas con el boton de + Nuevo hilo

router.post('/nuevo-hilo', async (req, res) => {

    const { titulo, contenido } = req.body;
    const id_usuario = req.session.id_usuario;

    const id_programa = req.body.id_programa;

    const sql = `
        INSERT INTO Hilo
        (titulo, contenido, fecha_publicacion, likes, dislikes, id_usuario, id_programa)
        VALUES (?, ?, NOW(), 0, 0, ?, ?)
    `;

    try {
        await db.query(sql, [
            titulo,
            contenido,
            id_usuario,
            id_programa
        ]);

        const id_hilo = resultado.insertId;

        res.redirect(`/foros/hilo/${id_hilo}`);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear el hilo');
    }
});

module.exports = router;
