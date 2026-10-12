const express = require('express');
const router = express.Router();
const comparadorController = require('../controllers/comparadorController');

// Ruta GET para /comparador
router.get('/', comparadorController.renderComparador);

module.exports = router;