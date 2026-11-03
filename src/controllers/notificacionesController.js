const db = require('../infrastructure/database/db');

const obtenerIdSesion = req => req.session && (req.session.userId || req.session.id_usuario);

const obtenerHistorial = async (req, res) => {
    const usuarioId = obtenerIdSesion(req);
    if (!usuarioId) {
        return res.redirect('/login');
    }

    try {
        // Se cambia 'notificacion' por 'Notificacion'
        const [notificaciones] = await db.query(
            `SELECT * FROM Notificacion
             WHERE id_usuario_destino = ?
             ORDER BY fecha DESC`,
            [usuarioId]
        );
        return res.render('perfil-historial-notificaciones', { notificaciones });
    } catch (error) {
        console.error('Error al cargar el historial de notificaciones:', error.message);
        return res.status(500).send('Error interno');
    }
};

const marcarComoLeida = async (req, res) => {
    const usuarioId = obtenerIdSesion(req);
    if (!usuarioId) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    const idNotificacion = Number(req.body.id_notificacion);
    if (!Number.isInteger(idNotificacion)) {
        return res.status(400).json({ error: 'Notificacion invalida' });
    }

    try {
        // Se cambia 'notificacion' por 'Notificacion'
        await db.query(
            `UPDATE Notificacion SET leida = 1
             WHERE id_notificacion = ? AND id_usuario_destino = ?`,
            [idNotificacion, usuarioId]
        );
        return res.json({ success: true });
    } catch (error) {
        console.error('Error al marcar la notificacion como leida:', error.message);
        return res.status(500).json({ success: false });
    }
};

module.exports = { obtenerHistorial, marcarComoLeida };
