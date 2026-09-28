const express = require('express');
const path = require('path');
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

// Redirige la raíz '/' automáticamente al Login
router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/comparador', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/comparador.html'));
});

router.get('/foros', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/foro.html'));
});

module.exports = router;