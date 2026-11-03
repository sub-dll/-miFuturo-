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

// Ruta para ver la presentación de una universidad (Flujo 1)
router.get('/universidad/:id', async (req, res) => {
    try {
        const db = require('../infrastructure/database/db');
        const id_universidad = req.params.id;

        // 1. Obtener los datos de la universidad
        const [universidades] = await db.query(
            `SELECT id_universidad, nombre, logo_url, ciudad, descripcion, años_acreditacion, sitio_web 
             FROM Universidad WHERE id_universidad = ?`, 
            [id_universidad]
        );

        if (universidades.length === 0) {
            return res.status(404).send("Universidad no encontrada");
        }

        // 2. Obtener la lista de carreras (programas) que imparte esta universidad
        const [programas] = await db.query(
            `SELECT P.id_programa, C.nombre_carrera, C.descripcion_general 
             FROM Programa_Universitario P 
             INNER JOIN Carrera_Base C ON P.id_carrera_base = C.id_carrera_base 
             WHERE P.id_universidad = ? 
             ORDER BY C.nombre_carrera ASC`, 
            [id_universidad]
        );

        res.render('universidad', { universidad: universidades[0], programas });
    } catch (error) {
        console.error('Error al cargar la universidad:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para ver el perfil detallado de una carrera (Flujo 1)
router.get('/programa/:id', async (req, res) => {
    try {
        const db = require('../infrastructure/database/db');
        
        const [resultados] = await db.query(`
            SELECT P.*, 
                   U.nombre AS uni_nombre, U.ciudad AS uni_ciudad, U.logo_url AS uni_logo, U.sitio_web AS uni_web,
                   C.nombre_carrera, C.descripcion_general, C.competencias, C.areas_desempeno,
                   R.pct_nem, R.pct_ranking, R.pct_m1, R.pct_m2, R.pct_lectora, R.pct_ciencias_historia, R.pct_corte
            FROM Programa_Universitario P
            INNER JOIN Universidad U ON P.id_universidad = U.id_universidad
            INNER JOIN Carrera_Base C ON P.id_carrera_base = C.id_carrera_base
            LEFT JOIN Requisitos_Programa R ON P.id_programa = R.id_programa
            WHERE P.id_programa = ?
        `, [req.params.id]);

        if (resultados.length === 0) {
            return res.status(404).send('Programa no encontrado');
        }

        const programa = resultados[0];
        
        // Generador de datos simulados para el gráfico de barras (para que no pierdas tu diseño visual)
        const anioActual = new Date().getFullYear();
        programa.matriculas_vs_titulados = [];
        for(let i = 4; i >= 0; i--) {
            programa.matriculas_vs_titulados.push({
                anio: anioActual - i,
                matriculados: Math.floor(programa.ingresados_anual * (0.8 + Math.random() * 0.4)), 
                titulados: Math.floor(programa.egresados_anual * (0.8 + Math.random() * 0.4))
            });
        }

        res.render('perfil-carrera', { programa });
    } catch (error) {
        console.error('Error al cargar el perfil de la carrera:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Exportamos el enrutador
module.exports = router;