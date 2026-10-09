const express = require('express');
const path = require('path');   // tenemos que quitar esto despues ajustandotodos los EJS que tienen las lineas res.sendFile(path.join(...)) que era para los antiguo .html yr eplzararlo en todos los archivos EJS llamando a res.render(), la librería path
const router = express.Router();

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

router.get('/comparador', (req, res) => {
  res.render('comparador');
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
// Ruta principal de foros /foros (busca foros-principal.ejs)
// =========================================

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
            carreras
        });


    } catch (error) {

        console.error('Error al cargar los foros:', error);

        res.status(500).send('Error al cargar los foros');

    }

});




// ==========================================
// RUTA DE PRUEBA PARA FOROS PRINCIPAL /forose
// Esta se puede borrar sin problema una vez que la ruta principal funcione correctamente
// =========================================

// Ruta de prueba para Foros
router.get('/forose', (req, res) => {

    // Carreras disponibles para el filtro
    const carreras = [
        {
            id_carrera_base: 1,
            nombre_carrera: "Medicina"
        },
        {
            id_carrera_base: 2,
            nombre_carrera: "Derecho"
        },
        {
            id_carrera_base: 3,
            nombre_carrera: "Psicología"
        },
        {
            id_carrera_base: 4,
            nombre_carrera: "Ingeniería Civil Informática"
        },
        {
            id_carrera_base: 5,
            nombre_carrera: "Enfermería"
        },
        {
            id_carrera_base: 6,
            nombre_carrera: "Arquitectura"
        }
    ];


    // Universidades de prueba
    const universidades = [

        {
            id_universidad: 1,
            nombre: "Universidad Católica de Temuco",
            logo_url: "/img/uct.png",
            ciudad: "Temuco",
            cantidadCarreras: 45,

            // Todas las carreras que ofrece esta universidad
            carrerasIds: [1, 2, 3, 4, 5],

            // Solo las 3 con mayor empleabilidad
            carrerasPopulares: [
                {
                    nombre_carrera: "Medicina",
                    empleabilidad_pct: 95
                },
                {
                    nombre_carrera: "Enfermería",
                    empleabilidad_pct: 92
                },
                {
                    nombre_carrera: "Ingeniería Civil Informática",
                    empleabilidad_pct: 90
                }
            ]
        },


        {
            id_universidad: 2,
            nombre: "Universidad de La Frontera",
            logo_url: "/img/ufro.png",
            ciudad: "Temuco",
            cantidadCarreras: 52,

            // Esta universidad NO tiene Arquitectura
            carrerasIds: [1, 2, 3, 4, 5],

            carrerasPopulares: [
                {
                    nombre_carrera: "Medicina",
                    empleabilidad_pct: 97
                },
                {
                    nombre_carrera: "Derecho",
                    empleabilidad_pct: 94
                },
                {
                    nombre_carrera: "Enfermería",
                    empleabilidad_pct: 91
                }
            ]
        },


        {
            id_universidad: 3,
            nombre: "Universidad Mayor",
            logo_url: "/img/umayor.png",
            ciudad: "Temuco",
            cantidadCarreras: 28,

            // Esta universidad sí tiene Arquitectura
            carrerasIds: [1, 3, 4, 6],

            carrerasPopulares: [
                {
                    nombre_carrera: "Medicina",
                    empleabilidad_pct: 96
                },
                {
                    nombre_carrera: "Psicología",
                    empleabilidad_pct: 89
                },
                {
                    nombre_carrera: "Arquitectura",
                    empleabilidad_pct: 87
                }
            ]
        }

    ];

    res.render('foros-principal', {
        universidades,
        carreras
    });

});




// Ruta para el Foro de una Universidad (busca foros-universidad.ejs)

router.get("/foros/universidad", (req, res) => {
    res.render("foros-universidad", {
        universidad: { id_universidad: 1, nombre: "Universidad Católica de Temuco" },
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