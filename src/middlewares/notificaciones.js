const db = require('../infrastructure/database/db');

const cargarNotificaciones = async (req, res, next) => {
    const usuarioId = req.session && (req.session.userId || req.session.id_usuario);
    res.locals.usuarioId = usuarioId || null;
    res.locals.notificaciones = [];
    res.locals.notificacionesCount = 0;

    if (!usuarioId) {
        return next();
    }

    try {
        const [notificaciones] = await db.query(
            `SELECT id_notificacion, mensaje, link_destino, fecha
             FROM notificacion
             WHERE id_usuario_destino = ? AND leida = 0
             ORDER BY fecha DESC
             LIMIT 20`,
            [usuarioId]
        );
        res.locals.notificaciones = notificaciones;
        res.locals.notificacionesCount = notificaciones.length;
    } catch (error) {
        console.error('Error al cargar notificaciones:', error.message);
    }

    return next();
};

module.exports = { cargarNotificaciones };
