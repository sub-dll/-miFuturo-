const express = require('express');
const path = require('path');
const router = express.Router();

// Ruta para el Home (index.html)
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Ruta para el Login (login.html)
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/login.html'));
});

// Ruta para el Comparador (comparador.html)
router.get('/comparador', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/comparador.html'));
});

// Ruta para el Foro (foro.html)
router.get('/foros', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/foro.html'));
});

module.exports = router;