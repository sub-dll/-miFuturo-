const db = require("../infrastructure/database/db")

// Funcion de configuracion 
const obtenerConfiguracion = async(req, res) => {
    try {
        const idUsuario = req.session.usuario ? req.session.usuario.id_usuario : req.user.id_usuario;
        const [rows] = await db.query('SELECT * FROM Configuracion WHERE id_usuario = ?', [idUsuario]);
        let configuracion = rows[0];

        if (!configuracion) {
            await db.query(`
                INSERT INTO Configuracion 
                (id_usuario, tema, contraste_alto, idioma, notif_comentarios, notif_menciones, notif_email)
                VALUES (?, 'claro', 0, 'es', 1, 1, 1)
            `, [idUsuario]);

            configuracion = {
                id_usuario: idUsuario,
                tema: 'claro',
                contraste_alto: 0,
                idioma: 'es',
                notif_comentarios: 1,
                notif_menciones: 1,
                notif_email: 1
            };
        }
        res.render('configuracion', { configuracion });



    } catch(error) {
        console.error("Error al obtener la configuracion",error);
        res.status(500).send("Error inerno del servidor");
    }
};

// Funcion actualizar 

const actualizarConfiguracion = async (req, res) => {
    try {
        const idUsuario = req.session.usuario ? req.session.usuario.id_usuario : req.user.id_usuario;
        const { tema, contraste_alto, idioma, notif_comentarios, notif_menciones, notif_email } = req.body;
        const cAlto = contraste_alto ? 1 : 0;
        const nComentarios = notif_comentarios ? 1 : 0;
        const nMenciones = notif_menciones ? 1 : 0;
        const nEmail = notif_email ? 1 : 0;

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


