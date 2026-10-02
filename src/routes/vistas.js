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



// ==========================================
//  VISTAS DE LOS FOROS
// ==========================================

// Foro de una universidad
router.get("/foros/:id_universidad", async (req, res) => {
    const { id_universidad } = req.params;

    const sqlUniversidad = `
        SELECT
            id_universidad,
            nombre,
            logo_url,
            ciudad
        FROM Universidad
        WHERE id_universidad = ?
    `;

    const sqlCarreras = `
        SELECT DISTINCT
            C.id_carrera_base,
            C.nombre_carrera,
            C.descripcion_general
        FROM Programa_Universitario P
        INNER JOIN Carrera_Base C
            ON P.id_carrera_base = C.id_carrera_base
        WHERE P.id_universidad = ?
        ORDER BY C.nombre_carrera ASC
    `;

    try {
        const [universidades] = await db.query(sqlUniversidad, [
            id_universidad
        ]);

        if (universidades.length === 0) {
            return res.status(404).send("Universidad no encontrada");
        }

        const [carreras] = await db.query(sqlCarreras, [
            id_universidad
        ]);

        res.render("foros-universidad", {
            universidad: universidades[0],
            carreras: carreras,
            buscar: ""
        });

    } catch (error) {
        console.error("Error al obtener la universidad:", error);
        res.status(500).send("Error al cargar el foro de la universidad");
    }
});


// Foros de una carrera específica + programa especifico dentro de una universidad

router.get("/foros/:id_universidad/:id_carrera", async (req, res) => {

    const { id_universidad, id_carrera } = req.params;
    const { programa } = req.query;

    //
    // 1. Obtener los programas de esta carrera
    //

    const sqlProgramas = `
        SELECT
            P.id_programa,
            C.nombre_carrera
        FROM Programa_Universitario P
        INNER JOIN Carrera_Base C
            ON P.id_carrera_base = C.id_carrera_base
        WHERE P.id_universidad = ?
          AND P.id_carrera_base = ?
        ORDER BY C.nombre_carrera ASC
    `;

    //
    // 2. Obtener los hilos
    //

    let sqlHilos = `
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

            P.id_universidad,
            P.id_carrera_base,

            C.nombre_carrera,

            Uni.nombre AS nombre_universidad

        FROM Hilo H

        INNER JOIN Usuario U
            ON H.id_usuario = U.id_usuario
        INNER JOIN Programa_Universitario P
            ON H.id_programa = P.id_programa
        INNER JOIN Carrera_Base C
            ON P.id_carrera_base = C.id_carrera_base
        INNER JOIN Universidad Uni
            ON P.id_universidad = Uni.id_universidad

        WHERE P.id_universidad = ?
          AND P.id_carrera_base = ?
    `;

    const parametrosHilos = [
        id_universidad,
        id_carrera
    ];


    // 
    // 3. Aplicar filtro por programa
    // 

    if (programa) {

        sqlHilos += `
            AND H.id_programa = ?
        `;

        parametrosHilos.push(programa);
    }

    sqlHilos += `
        ORDER BY H.fecha_publicacion DESC
    `;

    try {

        // Obtener programas
        const [programas] = await db.query(
            sqlProgramas,
            [
                id_universidad,
                id_carrera
            ]
        );


        // Obtener hilos
        const [hilos] = await db.query(
            sqlHilos,
            parametrosHilos
        );

        // Obtener título de la carrera

        let tituloForo = "";

        if (programas.length > 0) {
            tituloForo = programas[0].nombre_carrera;
        }

        // 
        // Enviar todo a foros-temas.ejs
        // 

        res.render("foros-temas", {

            hilos: hilos,
            programas: programas,
            tituloForo: tituloForo,
            id_universidad: id_universidad,
            id_carrera: id_carrera,
            programaSeleccionado: programa || "",
            buscar: ""
        });


    } catch (error) {

        console.error(
            "Error al obtener los hilos y programas:",
            error
        );

        res.status(500).send(
            "Error al cargar los hilos"
        );
    }

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
