const db = require("../infrastructure/database/db");

// Función para obtener la configuración
const obtenerConfiguracion = async (req, res) => {
    try {
        // Usa ?. para evitar errores si req.session o req.user no existen, y asigna 1 por defecto para pruebas
        const idUsuario = req.session?.usuario?.id_usuario || req.user?.id_usuario || 1;

        const [rows] = await db.query('SELECT * FROM Configuracion WHERE id_usuario = ?', [idUsuario]);
        let configuracion = rows[0];

        if (!configuracion) {
            await db.query(`
                INSERT INTO Configuracion 
                (id_usuario, tema, contraste_alto, idioma, notif_comentarios, notif_menciones, notif_email)
                VALUES (?, 'oscuro', 0, 'es', 1, 1, 1)
            `, [idUsuario]);

            configuracion = {
                id_usuario: idUsuario,
                tema: 'oscuro',
                contraste_alto: 0,
                idioma: 'es',
                notif_comentarios: 1,
                notif_menciones: 1,
                notif_email: 1
            };
        }

        // Se especifica la ruta completa dentro de la carpeta 'vista-panel'
        res.render('vista-panel/perfil-preferencias', { configuracion });

    } catch (error) {
        console.error("Error al obtener la configuración", error);
        res.status(500).send("Error interno del servidor");
    }
};

// Función para actualizar la configuración
const actualizarConfiguracion = async (req, res) => {
    try {
        const idUsuario = req.session?.usuario?.id_usuario || req.user?.id_usuario || 1;
        const { tema, contraste_alto, idioma, notif_comentarios, notif_menciones, notif_email } = req.body;

        // Evaluación explícita para evitar que el string '0' sea tomado como verdadero
        const cAlto = (contraste_alto == 1 || contraste_alto === 'on') ? 1 : 0;
        const nComentarios = (notif_comentarios == 1 || notif_comentarios === 'on') ? 1 : 0;
        const nMenciones = (notif_menciones == 1 || notif_menciones === 'on') ? 1 : 0;
        const nEmail = (notif_email == 1 || notif_email === 'on') ? 1 : 0;

        await db.query(`
            UPDATE Configuracion 
            SET tema = ?, contraste_alto = ?, idioma = ?, notif_comentarios = ?, notif_menciones = ?, notif_email = ?
            WHERE id_usuario = ?
        `, [tema, cAlto, idioma, nComentarios, nMenciones, nEmail, idUsuario]);

        res.redirect('/configuracion');

    } catch (error) {
        console.error("Error al actualizar la configuración", error);
        res.status(500).send("Error interno del servidor");
    }
};

module.exports = {
    obtenerConfiguracion,
    actualizarConfiguracion
};

