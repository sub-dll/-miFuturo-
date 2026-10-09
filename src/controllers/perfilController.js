const db = require('../infrastructure/database/db');
const bcrypt = require('bcryptjs');

// Columnas que se envían a la vista (nunca se manda el hash de la contraseña)
const COLUMNAS_PERFIL = 'id_usuario, nombres, apellidos, email, telefono, username, avatar_url, tipo_perfil';

// Campos que el formulario del perfil puede modificar
const CAMPOS_EDITABLES = ['email', 'telefono', 'username', 'password'];

const NOMBRES_CAMPOS = {
    email: 'correo electrónico',
    telefono: 'número de teléfono',
    username: 'nombre de usuario',
    password: 'contraseña'
};

// ==========================================
// Helper: obtiene el ID de la sesión activa
// (el login actual guarda id_usuario; el middleware usa userId)
// ==========================================
const obtenerIdSesion = (req) => req.session.userId || req.session.id_usuario;

// ==========================================
// Helper: SELECT del usuario por ID
// ==========================================
const buscarUsuarioPorId = async (idUsuario) => {
    const [filas] = await db.query(
        `SELECT ${COLUMNAS_PERFIL} FROM Usuario WHERE id_usuario = ?`,
        [idUsuario]
    );
    return filas[0] || null;
};

// ==========================================
// Helper: renderiza la vista del perfil con los datos del usuario
// ==========================================
const renderPerfil = (res, usuario, { error = null, exito = null, status = 200 } = {}) => {
    return res.status(status).render('vista-panel/perfil-cuenta', { usuario, error, exito });
};

// ==========================================
// Validaciones del backend (no confiar en el navegador)
// Devuelve un mensaje de error o null si el valor es válido
// ==========================================
const validarCampo = (campo, valor) => {
    if (!CAMPOS_EDITABLES.includes(campo)) {
        return 'El campo que intentas modificar no es válido.';
    }
    if (valor === '') {
        return `El ${NOMBRES_CAMPOS[campo]} no puede estar vacío.`;
    }
    switch (campo) {
        case 'email':
            if (valor.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
                return 'El correo electrónico no tiene un formato válido.';
            }
            break;
        case 'telefono':
            if (!/^\+?\d{8,15}$/.test(valor.replace(/[\s-]/g, ''))) {
                return 'El teléfono debe tener entre 8 y 15 dígitos (puede empezar con +).';
            }
            break;
        case 'username':
            if (!/^[\p{L}\p{N}_. -]{3,50}$/u.test(valor)) {
                return 'El nombre de usuario debe tener entre 3 y 50 caracteres (letras, números, espacios, _ . -).';
            }
            break;
        case 'password':
            if (valor.length < 8) {
                return 'La contraseña debe tener al menos 8 caracteres.';
            }
            break;
    }
    return null;
};

// ==========================================
// GET /perfil  →  SELECT del usuario de la sesión y render de la vista
// ==========================================
const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await buscarUsuarioPorId(obtenerIdSesion(req));

        if (!usuario) {
            // La sesión apunta a un usuario que ya no existe
            return req.session.destroy(() => res.redirect('/login'));
        }

        const exito = req.query.ok && NOMBRES_CAMPOS[req.query.ok]
            ? `Se ha modificado tu ${NOMBRES_CAMPOS[req.query.ok]} correctamente.`
            : null;

        return renderPerfil(res, usuario, { exito });
    } catch (error) {
        console.error('❌ Error al cargar el perfil:', error.message);
        return res.status(500).send('Error interno del servidor al cargar el perfil');
    }
};

// ==========================================
// POST /perfil/actualizar  →  validación + UPDATE de un campo
// Body esperado: { campo: 'email' | 'telefono' | 'username' | 'password', valor: '...' }
// ==========================================
const actualizarPerfil = async (req, res) => {
    const idUsuario = obtenerIdSesion(req);

    try {
        const usuario = await buscarUsuarioPorId(idUsuario);
        if (!usuario) {
            return req.session.destroy(() => res.redirect('/login'));
        }

        const campo = String(req.body.campo || '');
        let valor = String(req.body.valor ?? '');
        if (campo !== 'password') valor = valor.trim();
        if (campo === 'email') valor = valor.toLowerCase();

        // 1. Validaciones de formato
        const errorValidacion = validarCampo(campo, valor);
        if (errorValidacion) {
            return renderPerfil(res, usuario, { error: errorValidacion, status: 400 });
        }

        // 2. Antes del UPDATE: verificar que el correo / username no pertenezca a OTRA persona
        if (campo === 'email' || campo === 'username') {
            const [duplicados] = await db.query(
                `SELECT id_usuario FROM Usuario WHERE ${campo} = ? AND id_usuario <> ?`,
                [valor, idUsuario]
            );
            if (duplicados.length > 0) {
                const mensaje = campo === 'email'
                    ? 'Ese correo electrónico ya está registrado por otro usuario.'
                    : 'Ese nombre de usuario ya está en uso.';
                return renderPerfil(res, usuario, { error: mensaje, status: 409 });
            }
        }

        // 3. La contraseña se guarda siempre encriptada
        if (campo === 'password') {
            valor = await bcrypt.hash(valor, 10);
        }

        // 4. UPDATE (el nombre de columna viene de la lista blanca CAMPOS_EDITABLES)
        await db.query(`UPDATE Usuario SET ${campo} = ? WHERE id_usuario = ?`, [valor, idUsuario]);

        console.log(`✅ Usuario ${idUsuario} actualizó su ${campo}`);

        // Patrón PRG (Post/Redirect/Get): evita reenviar el formulario al recargar
        return res.redirect(`/perfil?ok=${campo}`);

    } catch (error) {
        // Red de seguridad: UNIQUE de MySQL por si dos peticiones llegan al mismo tiempo
        if (error.code === 'ER_DUP_ENTRY') {
            const usuario = await buscarUsuarioPorId(idUsuario).catch(() => null);
            if (usuario) {
                return renderPerfil(res, usuario, { error: 'Ese valor ya está en uso por otro usuario.', status: 409 });
            }
        }
        console.error('❌ Error al actualizar el perfil:', error.message);
        return res.status(500).send('Error interno del servidor al actualizar el perfil');
    }
};

module.exports = { obtenerPerfil, actualizarPerfil };
