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

router.get('/perfil/general', protegerRuta, (req, res) => {
    res.render('vista-panel/perfil-general');
});

router.get('/perfil/preferencias', protegerRuta, (req, res) => {
    res.render('vista-panel/perfil-preferencias');
});

router.get('/perfil/notificaciones', protegerRuta, (req, res) => {
    res.render('vista-panel/perfil-notificaciones', { user: null });
});

// ==========================================
// 3. RUTAS DE FOROS (Públicas por ahora)
// ==========================================
router.get('/foros', (req, res) => {
    res.render('foros-principal', {
        universidades: [
            { id_universidad: 1, nombre: "Universidad Católica de Temuco", cantidadCarreras: 45 },
            { id_universidad: 2, nombre: "Universidad de La Frontera", cantidadCarreras: 52 },
            { id_universidad: 3, nombre: "Universidad Mayor", cantidadCarreras: 28 }
        ]
    });
});

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