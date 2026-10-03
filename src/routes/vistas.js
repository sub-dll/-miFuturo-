const express = require('express');
const path = require('path');   // tenemos que quitar esto despues ajustandotodos los EJS que tienen las lineas res.sendFile(path.join(...)) que era para los antiguo .html yr eplzararlo en todos los archivos EJS llamando a res.render(), la librería path
const db = require('../infrastructure/database/db');
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

// Ruta para el Foro de Temas (busca foros-temas.ejs)

router.get("/foros/temas", (req, res) => {
    res.render("foros-temas", {
        tituloForo: "Ingeniería Civil Informática",
        hilos: [],
        buscar: ""
    });
});

// Ruta para consultar un hilo y sus comentarios
router.get(['/foro/hilo/:id', '/foros/hilo/:id'], (req, res) => {
    const { id } = req.params;

    db.query(
        `SELECT Hilo.*, Usuario.username AS usuario, Usuario.avatar_url,
                Hilo.fecha_publicacion AS fecha
         FROM Hilo
         LEFT JOIN Usuario ON Usuario.id_usuario = Hilo.id_usuario
         WHERE Hilo.id_hilo = ?`,
        [id],
        (error, hilos) => {
            if (error) {
                console.error('Error al consultar el hilo:', error.message);
                return res.status(500).send('Error al consultar el hilo');
            }

            if (hilos.length === 0) {
                return res.status(404).send('Hilo no encontrado');
            }

            db.query(
                `SELECT Comentario.*, Usuario.username AS usuario, Usuario.avatar_url,
                        Comentario.fecha_publicacion AS fecha
                 FROM Comentario
                 LEFT JOIN Usuario ON Usuario.id_usuario = Comentario.id_usuario
                 WHERE Comentario.id_hilo = ?`,
                [id],
                (error, respuestas) => {
                    if (error) {
                        console.error('Error al consultar los comentarios:', error.message);
                        return res.status(500).send('Error al consultar los comentarios');
                    }

                    res.render('foros-hilo', { hilo: hilos[0], respuestas });
                }
            );
        }
    );
});

module.exports = router;
