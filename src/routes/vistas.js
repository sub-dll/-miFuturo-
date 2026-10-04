const express = require('express');
const path = require('path');   // tenemos que quitar esto despues ajustandotodos los EJS que tienen las lineas res.sendFile(path.join(...)) que era para los antiguo .html yr eplzararlo en todos los archivos EJS llamando a res.render(), la librería path
const router = express.Router();
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

router.get(["/foros/hilo", "/foros/hilo/:id_hilo"], (req, res) => {
    const idHilo = req.params.id_hilo === undefined ? 1 : Number(req.params.id_hilo);

    if (!Number.isInteger(idHilo) || idHilo <= 0) {
        return res.status(400).send('El identificador del hilo no es válido.');
    }

    const consultaHilo = `
        SELECT h.id_hilo, h.titulo, h.contenido, h.likes,
            DATE_FORMAT(h.fecha_publicacion, '%d/%m/%Y %H:%i') AS fecha,
            COALESCE(u.username, 'Usuario') AS usuario, u.avatar_url
        FROM Hilo h
        LEFT JOIN Usuario u ON u.id_usuario = h.id_usuario
        WHERE h.id_hilo = ?
    `;

    db.query(consultaHilo, [idHilo], (errorHilo, hilos) => {
        if (errorHilo) {
            console.error('Error al cargar el hilo:', errorHilo.message);
            return res.status(500).send('No se pudo cargar el hilo.');
        }

        if (hilos.length === 0) {
            return res.status(404).send('No se encontró el hilo.');
        }

        const consultaRespuestas = `
            SELECT c.id_comentario, c.contenido, c.likes,
                DATE_FORMAT(c.fecha_publicacion, '%d/%m/%Y %H:%i') AS fecha,
                COALESCE(u.username, 'Usuario') AS usuario, u.avatar_url
            FROM Comentario c
            LEFT JOIN Usuario u ON u.id_usuario = c.id_usuario
            WHERE c.id_hilo = ? AND c.parent_comentario_id IS NULL
            ORDER BY c.fecha_publicacion ASC
        `;

        db.query(consultaRespuestas, [idHilo], (errorRespuestas, respuestas) => {
            if (errorRespuestas) {
                console.error('Error al cargar las respuestas:', errorRespuestas.message);
                return res.status(500).send('No se pudieron cargar las respuestas.');
            }

            return res.render('foros-hilo', {
                hilo: hilos[0],
                respuestas
            });
        });
    });
});

router.post('/foros/hilo/:id_hilo/responder', (req, res) => {
    const idHilo = Number(req.params.id_hilo);
    const contenido = typeof req.body.contenido === 'string' ? req.body.contenido.trim() : '';

    if (!Number.isInteger(idHilo) || idHilo <= 0 || !contenido) {
        return res.status(400).send('El hilo y el contenido de la respuesta son obligatorios.');
    }

    const query = `
        INSERT INTO Comentario (id_hilo, contenido, fecha_publicacion, likes, dislikes)
        VALUES (?, ?, NOW(), 0, 0)
    `;

    db.query(query, [idHilo, contenido], (error) => {
        if (error) {
            console.error('Error al guardar la respuesta:', error.message);
            return res.status(500).send('No se pudo guardar la respuesta.');
        }

        return res.redirect(`/foros/hilo/${idHilo}`);
    });
});

module.exports = router;
