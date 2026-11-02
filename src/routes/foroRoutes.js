// src/routes/foroRoutes.js
const express = require('express');
const router = express.Router();
const foroController = require('../controllers/foroController');
const { protegerRuta } = require('../middlewares/authMiddleware');

router.get('/foros', foroController.renderForoPrincipal);
router.get("/foros/temas", (req, res) => res.render("foros-temas", { tituloForo: "Ingeniería Civil Informática", hilos: [], buscar: "" }));
router.get(['/foro/hilo/:id', '/foros/hilo/:id'], foroController.renderHilo);
router.post(['/foro/hilo/:id/responder', '/foros/hilo/:id/responder'], protegerRuta, foroController.responderHilo);
router.get('/foros/:id_universidad', foroController.renderForoUniversidad);
router.get('/foros/:id_universidad/:id_carrera', foroController.renderForoTemas);

// Crear un nuevo hilo (Requiere sesión)
router.post('/foro/hilo/crear', protegerRuta, foroController.crearHilo);

module.exports = router;