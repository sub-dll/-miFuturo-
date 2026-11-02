// src/controllers/foroController.js
const db = require('../infrastructure/database/db');

const renderForoPrincipal = async (req, res) => {
    try {
        const [universidades] = await db.query(`SELECT id_universidad, nombre, logo_url, ciudad FROM Universidad ORDER BY nombre ASC`);
        const [carreras] = await db.query(`SELECT DISTINCT cb.id_carrera_base, cb.nombre_carrera FROM Carrera_Base cb INNER JOIN Programa_Universitario pu ON cb.id_carrera_base = pu.id_carrera_base ORDER BY cb.nombre_carrera ASC`);
        
        for (const universidad of universidades) {
            const [cantidad] = await db.query(`SELECT COUNT(*) AS cantidadCarreras FROM Programa_Universitario WHERE id_universidad = ?`, [universidad.id_universidad]);
            universidad.cantidadCarreras = cantidad[0].cantidadCarreras;

            const [carrerasUniversidad] = await db.query(`SELECT id_carrera_base FROM Programa_Universitario WHERE id_universidad = ?`, [universidad.id_universidad]);
            universidad.carrerasIds = carrerasUniversidad.map(c => c.id_carrera_base);

            const [populares] = await db.query(`
                SELECT cb.nombre_carrera, pu.empleabilidad_pct
                FROM Programa_Universitario pu
                INNER JOIN Carrera_Base cb ON pu.id_carrera_base = cb.id_carrera_base
                WHERE pu.id_universidad = ?
                ORDER BY pu.empleabilidad_pct DESC LIMIT 3
            `, [universidad.id_universidad]);
            universidad.carrerasPopulares = populares;
        }
        res.render('foros-principal', { universidades, carreras });
    } catch (error) {
        console.error('Error al cargar foros principales:', error);
        res.status(500).send('Error interno del servidor');
    }
};

const renderForoUniversidad = async (req, res) => {
    const { id_universidad } = req.params;
    const buscar = (req.query.buscar || "").trim();

    try {
        // AQUI TRAEMOS LA DESCRIPCIÓN, ACREDITACIÓN Y SITIO WEB
        const [universidades] = await db.query(
            `SELECT id_universidad, nombre, logo_url, ciudad, descripcion, años_acreditacion, sitio_web 
             FROM Universidad WHERE id_universidad = ?`, 
            [id_universidad]
        );
        
        if (universidades.length === 0) return res.status(404).send("Universidad no encontrada");

        let sqlCarreras = `SELECT DISTINCT C.id_carrera_base, C.nombre_carrera, C.descripcion_general FROM Programa_Universitario P INNER JOIN Carrera_Base C ON P.id_carrera_base = C.id_carrera_base WHERE P.id_universidad = ?`;
        const parametrosCarreras = [id_universidad];
        if (buscar) { sqlCarreras += ` AND C.nombre_carrera LIKE ? `; parametrosCarreras.push(`%${buscar}%`); }
        sqlCarreras += ` ORDER BY C.nombre_carrera ASC `;

        const [carreras] = await db.query(sqlCarreras, parametrosCarreras);
        res.render("foros-universidad", { universidad: universidades[0], carreras, buscar });
    } catch (error) {
        console.error("Error al cargar foro de universidad:", error);
        res.status(500).send("Error interno del servidor");
    }
};

const renderForoTemas = async (req, res) => {
    const { id_universidad, id_carrera } = req.params;
    const { programa } = req.query;

    try {
        // AQUÍ TRAEMOS LA DESCRIPCIÓN GENERAL DE LA CARRERA
        const [programas] = await db.query(
            `SELECT P.id_programa, C.nombre_carrera, C.descripcion_general 
             FROM Programa_Universitario P 
             INNER JOIN Carrera_Base C ON P.id_carrera_base = C.id_carrera_base 
             WHERE P.id_universidad = ? AND P.id_carrera_base = ? 
             ORDER BY C.nombre_carrera ASC`, 
            [id_universidad, id_carrera]
        );
        
        let sqlHilos = `
            SELECT H.id_hilo, H.titulo, H.contenido, H.fecha_publicacion, H.likes, H.dislikes, H.id_usuario, H.id_programa, U.username, U.nombres, U.apellidos, U.avatar_url, P.id_universidad, P.id_carrera_base, C.nombre_carrera, Uni.nombre AS nombre_universidad
            FROM Hilo H
            INNER JOIN Usuario U ON H.id_usuario = U.id_usuario
            INNER JOIN Programa_Universitario P ON H.id_programa = P.id_programa
            INNER JOIN Carrera_Base C ON P.id_carrera_base = C.id_carrera_base
            INNER JOIN Universidad Uni ON P.id_universidad = Uni.id_universidad
            WHERE P.id_universidad = ? AND P.id_carrera_base = ?
        `;
        const parametrosHilos = [id_universidad, id_carrera];
        if (programa) { sqlHilos += ` AND H.id_programa = ? `; parametrosHilos.push(programa); }
        sqlHilos += ` ORDER BY H.fecha_publicacion DESC `;

        const [hilos] = await db.query(sqlHilos, parametrosHilos);
        const tituloForo = programas.length > 0 ? programas[0].nombre_carrera : "";

        res.render("foros-temas", { hilos, programas, tituloForo, id_universidad, id_carrera, programaSeleccionado: programa || "", buscar: "" });
    } catch (error) {
        console.error("Error al cargar temas del foro:", error);
        res.status(500).send("Error interno del servidor");
    }
};

const renderHilo = async (req, res) => {
    const { id } = req.params;
    try {
        const [hilos] = await db.query(`SELECT Hilo.*, Usuario.username AS usuario, Usuario.avatar_url, Hilo.fecha_publicacion AS fecha FROM Hilo LEFT JOIN Usuario ON Usuario.id_usuario = Hilo.id_usuario WHERE Hilo.id_hilo = ?`, [id]);
        if (hilos.length === 0) return res.status(404).send('Hilo no encontrado');

        const [respuestas] = await db.query(`SELECT Comentario.*, Usuario.username AS usuario, Usuario.avatar_url, Comentario.fecha_publicacion AS fecha FROM Comentario LEFT JOIN Usuario ON Usuario.id_usuario = Comentario.id_usuario WHERE Comentario.id_hilo = ?`, [id]);
        res.render('foros-hilo', { hilo: hilos[0], respuestas });
    } catch (error) {
        console.error('Error al cargar el hilo:', error);
        res.status(500).send('Error interno del servidor');
    }
};

const responderHilo = async (req, res) => {
    const { id } = req.params;
    const contenido = typeof req.body.contenido === 'string' ? req.body.contenido.trim() : '';
    const usuarioId = req.session && (req.session.id_usuario || req.session.userId);

    if (!usuarioId) return res.redirect('/login');
    if (!contenido) return res.status(400).send('El comentario no puede estar vacío');

    try {
        await db.query(`INSERT INTO Comentario (id_hilo, id_usuario, contenido, fecha_publicacion, likes, dislikes) VALUES (?, ?, ?, NOW(), 0, 0)`, [id, usuarioId, contenido]);
        
        const [hilos] = await db.query('SELECT id_usuario, titulo FROM Hilo WHERE id_hilo = ?', [id]);
        if (hilos.length > 0 && Number(hilos[0].id_usuario) !== Number(usuarioId)) {
            const mensaje = `Tienes una nueva respuesta en: "${hilos[0].titulo}"`;
            const linkDestino = `/foro/hilo/${id}`;
            const [resultado] = await db.query(`INSERT INTO notificacion (id_usuario_destino, tipo_notificacion, mensaje, link_destino) VALUES (?, 'respuesta_hilo', ?, ?)`, [hilos[0].id_usuario, mensaje, linkDestino]);
            const io = req.app.get('io');
            if (io) io.to(`usuario_${hilos[0].id_usuario}`).emit('nueva_notificacion', { id: resultado.insertId, mensaje, link_destino: linkDestino });
        }
        res.redirect(`/foro/hilo/${encodeURIComponent(id)}`);
    } catch (error) {
        console.error('Error al guardar comentario:', error);
        res.status(500).send('Error interno del servidor');
    }
};

const crearHilo = async (req, res) => {
    const { titulo, contenido, id_programa, id_universidad, id_carrera } = req.body;
    const usuarioId = req.session && (req.session.userId || req.session.id_usuario);

    if (!usuarioId) {
        return res.redirect('/login');
    }

    if (!titulo || !contenido || !id_programa) {
        return res.status(400).send('Faltan datos obligatorios para crear el hilo');
    }

    try {
        await db.query(
            `INSERT INTO Hilo (titulo, contenido, id_usuario, id_programa, fecha_publicacion, likes, dislikes) 
             VALUES (?, ?, ?, ?, NOW(), 0, 0)`,
            [titulo.trim(), contenido.trim(), usuarioId, id_programa]
        );
        res.redirect(`/foros/${id_universidad}/${id_carrera}`);
    } catch (error) {
        console.error('❌ Error al crear el hilo:', error.message);
        res.status(500).send('Error interno del servidor al crear el hilo');
    }
};

module.exports = { renderForoPrincipal, renderForoUniversidad, renderForoTemas, renderHilo, responderHilo, crearHilo };