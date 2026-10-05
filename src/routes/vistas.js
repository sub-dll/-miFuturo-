const express = require('express');
const path = require('path');   // tenemos que quitar esto despues ajustandotodos los EJS que tienen las lineas res.sendFile(path.join(...)) que era para los antiguo .html yr eplzararlo en todos los archivos EJS llamando a res.render(), la librería path
const router = express.Router();

// Importar la conexión a la base de datos para las consultas SQL
const db = require('../infrastructure/database/db');

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

// ==========================================
// 3. RUTAS DE ACCIONES (APIs internas)
// ==========================================

// NUEVA RUTA: Backend para dar "Like" a un hilo
router.post("/hilos/:id/like", async (req, res) => {
    const { id } = req.params;

    try {
        // Ejecutamos el UPDATE en MySQL según el requerimiento
        const [resultado] = await db.query(
            'UPDATE Hilo SET likes = likes + 1 WHERE id = ?',
            [id]
        );

        // Validamos si el hilo realmente existía en la base de datos
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Hilo no encontrado' });
        }

        // Respondemos al cliente (frontend) que todo salió bien
        res.json({ ok: true, mensaje: 'Like registrado exitosamente' });
        
    } catch (error) {
        console.error('Error al dar me gusta en el hilo:', error);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;