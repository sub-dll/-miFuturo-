const express = require('express');
const path = require('path');   // tenemos que quitar esto despues ajustandotodos los EJS que tienen las lineas res.sendFile(path.join(...)) que era para los antiguo .html yr eplzararlo en todos los archivos EJS llamando a res.render(), la librería path
const router = express.Router();

// Importa la conexión a la base de datos
const db = require('../infrastructure/database/db');

// MIDDLEWARE
const { protegerRuta } = require('../middlewares/authMiddleware');

// ==========================================
// 1. RUTAS PÚBLICAS Y DE AUTENTICACIÓN
// (No llevan protegerRuta porque cualquiera debe poder verlas)
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
// 2. RUTAS PRIVADAS (Requieren inicio de sesión)
// (Aquí inyectamos protegerRuta justo antes de (req, res))
// ==========================================

router.get('/perfil', protegerRuta, (req, res) => {
    res.render('vista-panel/perfil-cuenta');
});

router.get('/perfil/preferencias', protegerRuta, (req, res) => {
    res.render('vista-panel/perfil-preferencias');
});

router.get('/perfil/notificaciones', protegerRuta, (req, res) => {
    res.render('vista-panel/perfil-notificaciones', { user: null });
});


// ==========================================
//  VISTAS DE LOS FOROS
// ==========================================

// Ruta principal de foros /foros

router.get('/foros', async (req, res) => {

    try {
        // Obtener todas las universidades
        const [universidades] = await db.query(`
            SELECT
                id_universidad,
                nombre,
                logo_url,
                ciudad
            FROM Universidad
            ORDER BY nombre ASC
        `);


        // Obtener todas las carreras disponibles
        const [carreras] = await db.query(`
            SELECT DISTINCT
                cb.id_carrera_base,
                cb.nombre_carrera
            FROM Carrera_Base cb
            INNER JOIN Programa_Universitario pu
                ON cb.id_carrera_base = pu.id_carrera_base
            ORDER BY cb.nombre_carrera ASC
        `);


        // Obtener información adicional de cada universidad
        for (const universidad of universidades) {

            // Cantidad total de carreras
            const [cantidad] = await db.query(`
                SELECT COUNT(*) AS cantidadCarreras
                FROM Programa_Universitario
                WHERE id_universidad = ?
            `, [universidad.id_universidad]);

            universidad.cantidadCarreras = cantidad[0].cantidadCarreras;


            // Carreras que ofrece esta universidad
            const [carrerasUniversidad] = await db.query(`
                SELECT id_carrera_base
                FROM Programa_Universitario
                WHERE id_universidad = ?
            `, [universidad.id_universidad]);

            universidad.carrerasIds = carrerasUniversidad.map(
                carrera => carrera.id_carrera_base
            );


            // Top carreras según empleabilidad, limite de 3
            const [populares] = await db.query(`
                SELECT
                    cb.nombre_carrera,
                    pu.empleabilidad_pct
                FROM Programa_Universitario pu
                INNER JOIN Carrera_Base cb
                    ON pu.id_carrera_base = cb.id_carrera_base
                WHERE pu.id_universidad = ?
                ORDER BY pu.empleabilidad_pct DESC
                LIMIT 3
            `, [universidad.id_universidad]);

            universidad.carrerasPopulares = populares;
        }


        res.render('foros-principal', {
            universidades,
            carreras
        });


    } catch (error) {

        console.error('Error al cargar los foros:', error);

        res.status(500).send('Error al cargar los foros');

    }

});

//
// Foro de una universidad

router.get("/foros/:id_universidad", async (req, res) => {

    const { id_universidad } = req.params;

    // Obtener el texto ingresado en el buscador
    const buscar = (req.query.buscar || "").trim();

    const sqlUniversidad = `
        SELECT
            id_universidad,
            nombre,
            logo_url,
            ciudad
        FROM Universidad
        WHERE id_universidad = ?
    `;

    // Consulta de carreras con filtro opcional
    let sqlCarreras = `
        SELECT DISTINCT
            C.id_carrera_base,
            C.nombre_carrera,
            C.descripcion_general
        FROM Programa_Universitario P
        INNER JOIN Carrera_Base C
            ON P.id_carrera_base = C.id_carrera_base
        WHERE P.id_universidad = ?
    `;

    const parametrosCarreras = [id_universidad];

    // Aplicar búsqueda por nombre de carrera
    if (buscar) {
        sqlCarreras += `
            AND C.nombre_carrera LIKE ?
        `;

        parametrosCarreras.push(`%${buscar}%`);
    }

    // Ordenar alfabéticamente
    sqlCarreras += `
        ORDER BY C.nombre_carrera ASC
    `;

    try {

        // Obtener universidad
        const [universidades] = await db.query(
            sqlUniversidad,
            [id_universidad]
        );

        if (universidades.length === 0) {
            return res.status(404).send("Universidad no encontrada");
        }

        // Obtener carreras, aplicando el filtro si corresponde
        const [carreras] = await db.query(
            sqlCarreras,
            parametrosCarreras
        );

        // Enviar datos a la vista
        res.render("foros-universidad", {
            universidad: universidades[0],
            carreras: carreras,
            buscar: buscar
        });

    } catch (error) {

        console.error("Error al obtener la universidad y sus carreras:", error);

        res.status(500).send(
            "Error al cargar el foro de la universidad"
        );
    }
});

// Foros de una carrera específica + programa específico

router.get("/foros/:id_universidad/:id_carrera", async (req, res) => {

    const { id_universidad, id_carrera } = req.params;
    const { programa, ajax } = req.query;

    // Determina de que hilo comenzar
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limite = 10;

    const offset = (page - 1) * limite;

    // Obtener los programas de la carrera
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

    // Obtener hilos
    let sqlHilos = `
        SELECT
            H.id_hilo,
            H.titulo,
            H.contenido AS descripcion,
            H.fecha_publicacion,
            DATE_FORMAT(H.fecha_publicacion, '%d/%m/%Y %H:%i') AS fecha,
            H.likes,
            H.dislikes,
            H.id_usuario,
            H.id_programa,

            COALESCE(
                NULLIF(
                    TRIM(CONCAT_WS(' ',
                        NULLIF(U.nombres, ''),
                        NULLIF(U.apellidos, '')
                    )),
                    ''
                ),
                NULLIF(U.username, ''),
                'Usuario'
            ) AS usuario,

            U.username,
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

    // Filtro por programa
    if (programa) {
        sqlHilos += `
            AND H.id_programa = ?
        `;

        parametrosHilos.push(programa);
    }

    sqlHilos += `
        ORDER BY H.fecha_publicacion DESC, H.id_hilo DESC
        LIMIT 11 OFFSET ?
    `;

    parametrosHilos.push(offset);

    try {

        // Obtener programas
        const [programas] = await db.query(
            sqlProgramas,
            [id_universidad, id_carrera]
        );

        // Obtener hilos
        const [resultados] = await db.query(
            sqlHilos,
            parametrosHilos
        );

        // Comprobar si existen más hilos y solo mostrar 10
        const hayMasHilos = resultados.length > 10;
        const hilos = resultados.slice(0, 10);

        // Si la peticion viene del fetch() responder JSON
        if (ajax === '1') {
            return res.json({
                hilos,
                hayMasHilos
            });
        }

        // Obtener titulo de la carrera
        let tituloForo = "";

        if (programas.length > 0) {
            tituloForo = programas[0].nombre_carrera;
        }

        // Renderiza vista
        res.render("foros-temas", {

            hilos,
            programas,
            tituloForo,

            id_universidad,
            id_carrera,

            programaSeleccionado: programa || "",
            buscar: "",

            hayMasHilos
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
