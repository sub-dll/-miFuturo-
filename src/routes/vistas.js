const express = require('express');
const db = require('../infrastructure/database/db');
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

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/perfil-carrera', (req, res) => {
    res.render('perfil-carrera');
});

// ==========================================
// 2. RUTAS PRIVADAS SECUNDARIAS DEL PERFIL
// (GET /perfil y POST /perfil/actualizar viven en perfilRoutes.js)
// ==========================================
router.get('/perfil/preferencias', protegerRuta, (req, res) => {
    res.render('perfil-preferencias');
});

router.get('/perfil/notificaciones', protegerRuta, (req, res) => {
    res.render('perfil-notificaciones', { user: null });
});

// ==========================================
// 3. VISTAS DE LOS FOROS
// ==========================================

// Ruta principal de foros /foros
router.get('/foros', async (req, res) => {
    try {
        const [universidades] = await db.query(`
            SELECT id_universidad, nombre, logo_url, ciudad
            FROM Universidad
            ORDER BY nombre ASC
        `);

        const [carreras] = await db.query(`
            SELECT DISTINCT cb.id_carrera_base, cb.nombre_carrera
            FROM Carrera_Base cb
            INNER JOIN Programa_Universitario pu ON cb.id_carrera_base = pu.id_carrera_base
            ORDER BY cb.nombre_carrera ASC
        `);

        for (const universidad of universidades) {
            const [cantidad] = await db.query(`
                SELECT COUNT(*) AS cantidadCarreras
                FROM Programa_Universitario
                WHERE id_universidad = ?
            `, [universidad.id_universidad]);

            universidad.cantidadCarreras = cantidad[0].cantidadCarreras;

            const [carrerasUniversidad] = await db.query(`
                SELECT id_carrera_base
                FROM Programa_Universitario
                WHERE id_universidad = ?
            `, [universidad.id_universidad]);

            universidad.carrerasIds = carrerasUniversidad.map(c => c.id_carrera_base);

            const [populares] = await db.query(`
                SELECT cb.nombre_carrera, pu.empleabilidad_pct
                FROM Programa_Universitario pu
                INNER JOIN Carrera_Base cb ON pu.id_carrera_base = cb.id_carrera_base
                WHERE pu.id_universidad = ?
                ORDER BY pu.empleabilidad_pct DESC
                LIMIT 3
            `, [universidad.id_universidad]);

            universidad.carrerasPopulares = populares;
        }

        res.render('foros-principal', { universidades, carreras });
    } catch (error) {
        console.error('Error al cargar los foros:', error);
        res.status(500).send('Error al cargar los foros');
    }
});

// Rutas estáticas de respaldo (deben ir ANTES de las rutas con parámetros :id_universidad)
router.get("/foros/temas", (req, res) => {
    res.render("foros-temas", {
        tituloForo: "Ingeniería Civil Informática",
        hilos: [],
        buscar: ""
    });
});

// Consultar un hilo y sus comentarios
router.get(['/foro/hilo/:id', '/foros/hilo/:id'], async (req, res) => {
    const { id } = req.params;

    try {
        const [hilos] = await db.query(
            `SELECT Hilo.*, Usuario.username AS usuario, Usuario.avatar_url,
                    Hilo.fecha_publicacion AS fecha
             FROM Hilo
             LEFT JOIN Usuario ON Usuario.id_usuario = Hilo.id_usuario
             WHERE Hilo.id_hilo = ?`,
            [id]
        );

        if (hilos.length === 0) {
            return res.status(404).send('Hilo no encontrado');
        }

        const [respuestas] = await db.query(
            `SELECT Comentario.*, Usuario.username AS usuario, Usuario.avatar_url,
                    Comentario.fecha_publicacion AS fecha
             FROM Comentario
             LEFT JOIN Usuario ON Usuario.id_usuario = Comentario.id_usuario
             WHERE Comentario.id_hilo = ?`,
            [id]
        );

        res.render('foros-hilo', { hilo: hilos[0], respuestas });
    } catch (error) {
        console.error('Error al consultar el hilo y sus comentarios:', error.message);
        return res.status(500).send('Error al consultar el hilo y sus comentarios');
    }
});

// Responder en un hilo
router.post(['/foro/hilo/:id/responder', '/foros/hilo/:id/responder'], async (req, res) => {
    const { id } = req.params;
    const contenido = typeof req.body.contenido === 'string' ? req.body.contenido.trim() : '';

    if (!contenido) {
        return res.status(400).send('El comentario no puede estar vacío');
    }

    try {
        await db.query(
            `INSERT INTO Comentario (id_hilo, contenido, fecha_publicacion, likes, dislikes)
             VALUES (?, ?, NOW(), 0, 0)`,
            [id, contenido]
        );

        res.redirect(`/foro/hilo/${encodeURIComponent(id)}`);
    } catch (error) {
        console.error('Error al guardar el comentario:', error.message);
        return res.status(500).send('Error al guardar el comentario');
    }
});

// Foro de una universidad
router.get("/foros/:id_universidad", async (req, res) => {
    const { id_universidad } = req.params;
    const buscar = (req.query.buscar || "").trim();

    const sqlUniversidad = `
        SELECT id_universidad, nombre, logo_url, ciudad
        FROM Universidad
        WHERE id_universidad = ?
    `;

    let sqlCarreras = `
        SELECT DISTINCT C.id_carrera_base, C.nombre_carrera, C.descripcion_general
        FROM Programa_Universitario P
        INNER JOIN Carrera_Base C ON P.id_carrera_base = C.id_carrera_base
        WHERE P.id_universidad = ?
    `;

    const parametrosCarreras = [id_universidad];

    if (buscar) {
        sqlCarreras += ` AND C.nombre_carrera LIKE ? `;
        parametrosCarreras.push(`%${buscar}%`);
    }

    sqlCarreras += ` ORDER BY C.nombre_carrera ASC `;

    try {
        const [universidades] = await db.query(sqlUniversidad, [id_universidad]);

        if (universidades.length === 0) {
            return res.status(404).send("Universidad no encontrada");
        }

        const [carreras] = await db.query(sqlCarreras, parametrosCarreras);

        res.render("foros-universidad", {
            universidad: universidades[0],
            carreras: carreras,
            buscar: buscar
        });
    } catch (error) {
        console.error("Error al obtener la universidad y sus carreras:", error);
        res.status(500).send("Error al cargar el foro de la universidad");
    }
});

// Foros de una carrera específica + programa específico dentro de una universidad
router.get("/foros/:id_universidad/:id_carrera", async (req, res) => {
    const { id_universidad, id_carrera } = req.params;
    const { programa } = req.query;

    const sqlProgramas = `
        SELECT P.id_programa, C.nombre_carrera
        FROM Programa_Universitario P
        INNER JOIN Carrera_Base C ON P.id_carrera_base = C.id_carrera_base
        WHERE P.id_universidad = ? AND P.id_carrera_base = ?
        ORDER BY C.nombre_carrera ASC
    `;

    let sqlHilos = `
        SELECT H.id_hilo, H.titulo, H.contenido, H.fecha_publicacion, H.likes, H.dislikes,
               H.id_usuario, H.id_programa, U.username, U.nombres, U.apellidos, U.avatar_url,
               P.id_universidad, P.id_carrera_base, C.nombre_carrera, Uni.nombre AS nombre_universidad
        FROM Hilo H
        INNER JOIN Usuario U ON H.id_usuario = U.id_usuario
        INNER JOIN Programa_Universitario P ON H.id_programa = P.id_programa
        INNER JOIN Carrera_Base C ON P.id_carrera_base = C.id_carrera_base
        INNER JOIN Universidad Uni ON P.id_universidad = Uni.id_universidad
        WHERE P.id_universidad = ? AND P.id_carrera_base = ?
    `;

    const parametrosHilos = [id_universidad, id_carrera];

    if (programa) {
        sqlHilos += ` AND H.id_programa = ? `;
        parametrosHilos.push(programa);
    }

    sqlHilos += ` ORDER BY H.fecha_publicacion DESC `;

    try {
        const [programas] = await db.query(sqlProgramas, [id_universidad, id_carrera]);
        const [hilos] = await db.query(sqlHilos, parametrosHilos);

        let tituloForo = "";
        if (programas.length > 0) {
            tituloForo = programas[0].nombre_carrera;
        }

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
        console.error("Error al obtener los hilos y programas:", error);
        res.status(500).send("Error al cargar los hilos");
    }
});

module.exports = router;