const express = require('express');
const router = express.Router();
const db = require('../infrastructure/database/db');

// MIDDLEWARE
const { protegerRuta } = require('../middlewares/authMiddleware');

// ==========================================
// 1. RUTAS PÚBLICAS Y DE AUTENTICACIÓN
// ==========================================
router.get('/login', (req, res) => {
    res.render('login', { mensaje: req.query.mensaje || null });
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


// ==========================================
//  VISTAS DE LOS FOROS
// ==========================================

// Ruta principal de foros /foros
router.get('/foros', async (req, res) => {

    try {
        const universidadesPorPagina = 10;

        // Pagina solicitada
        const paginaSolicitada = Number.parseInt(req.query.pagina, 10);

        const paginaInicial = (
            Number.isInteger(paginaSolicitada) && paginaSolicitada > 0
        ) ? paginaSolicitada : 1;

        // Nombre de universidad
        const nombreBusqueda = typeof req.query.nombre === 'string'
            ? req.query.nombre.trim()
            : '';

        // Ciudad
        const ciudadSeleccionada = typeof req.query.ciudad === 'string'
            ? req.query.ciudad.trim()
            : '';

        // Carrera
        const carreraSolicitada = Number.parseInt(req.query.carrera, 10);
        const carreraSeleccionada = (
            Number.isInteger(carreraSolicitada) &&
            carreraSolicitada > 0
        ) ? carreraSolicitada : null;


        const condiciones = [];
        const parametrosFiltros = [];

        // Filtrar por nombre de universidad
        if (nombreBusqueda) {
            condiciones.push('u.nombre LIKE ?');
            parametrosFiltros.push(`%${nombreBusqueda}%`);
        }

        // Filtrar por ciudad
        if (ciudadSeleccionada) {
            condiciones.push('u.ciudad = ?');
            parametrosFiltros.push(ciudadSeleccionada);
        }

        // Filtrar por carrera
        if (carreraSeleccionada) {
            condiciones.push(`
                EXISTS (
                    SELECT 1
                    FROM Programa_Universitario pu
                    WHERE pu.id_universidad = u.id_universidad
                      AND pu.id_carrera_base = ?
                )
            `);
            parametrosFiltros.push(carreraSeleccionada);
        }

        // Unir las condiciones utilizando AND
        const condicionFiltros = condiciones.length > 0
            ? `WHERE ${condiciones.join(' AND ')}`
            : '';

        // Resultado universidades filtradas
        const [resultadoTotal] = await db.query(`
            SELECT COUNT(*) AS total
            FROM Universidad u
            ${condicionFiltros}
        `, parametrosFiltros);

        const totalUniversidades = resultadoTotal[0].total;

        // Calcula paginacion
        const totalPaginas = Math.ceil(
            totalUniversidades / universidadesPorPagina
        );

        const paginaActual = Math.min(
            paginaInicial,
            Math.max(totalPaginas, 1)
        );

        const offset = (paginaActual - 1) * universidadesPorPagina;

        const [universidades] = await db.query(`
            SELECT
                u.id_universidad,
                u.nombre,
                u.logo_url,
                u.ciudad
            FROM Universidad u
            ${condicionFiltros}
            ORDER BY u.nombre ASC
            LIMIT ? OFFSET ?
        `, [
            ...parametrosFiltros,
            universidadesPorPagina,
            offset
        ]);

        // Carreras disponibles
        const [carreras] = await db.query(`
            SELECT DISTINCT
                cb.id_carrera_base,
                cb.nombre_carrera
            FROM Carrera_Base cb
            INNER JOIN Programa_Universitario pu
                ON cb.id_carrera_base = pu.id_carrera_base
            ORDER BY cb.nombre_carrera ASC
        `);

        // Ciudades disponibles 
        const [ciudades] = await db.query(`
            SELECT DISTINCT ciudad
            FROM Universidad
            WHERE ciudad IS NOT NULL
              AND TRIM(ciudad) <> ''
            ORDER BY ciudad ASC
        `);

        for (const universidad of universidades) {

            // Cantidad total de carreras
            const [cantidad] = await db.query(`
                SELECT COUNT(*) AS cantidadCarreras
                FROM Programa_Universitario
                WHERE id_universidad = ?
            `, [universidad.id_universidad]);
            universidad.cantidadCarreras = cantidad[0].cantidadCarreras;

            // IDs de carreras que ofrece
            const [carrerasUniversidad] = await db.query(`
                SELECT id_carrera_base
                FROM Programa_Universitario
                WHERE id_universidad = ?
            `, [universidad.id_universidad]);

            universidad.carrerasIds = carrerasUniversidad.map(
                carrera => carrera.id_carrera_base
            );


            // Top 3 carreras según empleabilidad
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
            carreras,
            ciudades: ciudades.map(c => c.ciudad),

            paginaActual,
            totalPaginas,

            nombreBusqueda,
            ciudadSeleccionada,
            carreraSeleccionada
        });

    } catch (error) {

        console.error('Error al cargar los foros:', error);

        res.status(500).send('Error al cargar los foros');
    }

});



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


// Vista de hilo
router.get("/foros/hilo/:id_hilo", async (req, res) => {

    const id = parseInt(req.params.id_hilo, 10);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).send("Identificador de hilo inválido");
    }

    try {
        const sqlHilo = `
            SELECT
                H.id_hilo,
                H.titulo,
                H.contenido,
                H.fecha_publicacion,
                DATE_FORMAT(
                    H.fecha_publicacion,
                    '%d/%m/%Y %H:%i'
                ) AS fecha,
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

            WHERE H.id_hilo = ?
        `;

        const [hilos] = await db.query(sqlHilo, [id]);

        if (hilos.length === 0) {
            return res.status(404).send("Hilo no encontrado");
        }
        const hilo = hilos[0];

        const sqlComentarios = `
            SELECT
                C.id_comentario,
                C.id_hilo,
                C.id_usuario,
                C.parent_comentario_id,
                C.contenido,
                C.fecha_publicacion,

                DATE_FORMAT(
                    C.fecha_publicacion,
                    '%d/%m/%Y %H:%i'
                ) AS fecha,

                C.likes,
                C.dislikes,

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
                U.avatar_url

            FROM Comentario C

            INNER JOIN Usuario U
                ON C.id_usuario = U.id_usuario

            WHERE C.id_hilo = ?

            ORDER BY
                C.fecha_publicacion ASC,
                C.id_comentario ASC
        `;

        const [comentarios] = await db.query(
            sqlComentarios,
            [id]
        );

        // Organizar comentarios

        const comentariosPorId = new Map();

        comentarios.forEach(comentario => {

            comentario.respuestas = [];

            comentariosPorId.set(
                comentario.id_comentario,
                comentario
            );
        });

        const respuestas = [];

        comentarios.forEach(comentario => {

            const padre = comentariosPorId.get(
                comentario.parent_comentario_id
            );

            if (padre && padre.id_comentario !== comentario.id_comentario) {

                padre.respuestas.push(comentario);

            } else {
                respuestas.push(comentario);

            }
        });

        // Enlace de regreso
        const urlForo =
            `/foros/${hilo.id_universidad}/${hilo.id_carrera_base}`;

        // Renderizar vista

        res.render("foros-hilo", {

            hilo,
            respuestas,
            urlForo
        });

    } catch (error) {

        console.error(
            "Error al visualizar el hilo:",
            error
        );

        res.status(500).send(
            "Error al cargar el hilo"
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

            -- Contar los comentarios pertenecientes a cada hilo
            (
                SELECT COUNT(*)
                FROM Comentario Com
                WHERE Com.id_hilo = H.id_hilo
            ) AS respuestas,

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

// Exportamos el enrutador
module.exports = router;
