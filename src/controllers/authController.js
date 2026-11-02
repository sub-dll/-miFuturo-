const db = require('../infrastructure/database/db');
const bcrypt = require('bcryptjs');

const registrarUsuario = async (req, res) => {
    try {
        // 1. Recibir los datos exactos del formulario
        const { nombres, email, telefono, password } = req.body;

        // 1.5 Validación de seguridad de la contraseña (Mínimo 8 caracteres, 1 letra y 1 número)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&.]{8,}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).send('La contraseña debe tener al menos 8 caracteres, e incluir como mínimo una letra y un número.');
        }

        // 2. Verificar si el email ya existe en la base de datos
        const [usuariosExistentes] = await db.query('SELECT * FROM Usuario WHERE email = ?', [email]);
        if (usuariosExistentes.length > 0) {
            return res.status(400).send('El correo electrónico ya está registrado.');
        }

        // 3. Encriptar la contraseña (hash)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Guardar en tu tabla Usuario
        const [resultado] = await db.query(
            'INSERT INTO Usuario (nombres, email, telefono, password) VALUES (?, ?, ?, ?)',
            [nombres, email, telefono, hashedPassword]
        );

        console.log('✅ Nuevo usuario registrado con ID:', resultado.insertId);

        // 5. Redirigir a la vista de login tras el éxito
        res.redirect('/login');

    } catch (error) {
        console.error('❌ Error en el registro:', error.message);
        res.status(500).send('Error interno del servidor al registrar');
    }
};

// ==========================================
// INICIAR SESIÓN (CORREGIDO Y COMPLETADO)
// ==========================================
const iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar si el usuario existe en la base de datos
        const [usuarios] = await db.query('SELECT * FROM Usuario WHERE email = ?', [email]);
        
        if (usuarios.length === 0) {
            return res.status(401).send('Correo o contraseña incorrectos.');
        }

        const usuario = usuarios[0];

        // 2. Comparar la contraseña ingresada con la encriptada
        const contrasenaValida = await bcrypt.compare(password, usuario.password);
        
        if (!contrasenaValida) {
            return res.status(401).send('Correo o contraseña incorrectos.');
        }

        // 3. ¡CORRECCIÓN CLAVE! Guardar el objeto usuario en la sesión
        req.session.id_usuario = usuario.id_usuario;
        req.session.usuario = {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombres,
            email: usuario.email,
            telefono: usuario.telefono
        };
        
        console.log(`✅ Sesión iniciada para: ${usuario.nombres} (${usuario.email})`);

        // 4. Redirigir a la página principal o a los foros
        res.redirect('/foros'); 

    } catch (error) {
        console.error('❌ Error en el inicio de sesión:', error.message);
        res.status(500).send('Error interno del servidor al iniciar sesión');
    }
};

// ==========================================
// CERRAR SESIÓN (NUEVA FUNCIÓN)
// ==========================================
const cerrarSesion = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Error al cerrar sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        res.clearCookie('connect.sid'); // Limpiar la cookie de sesión
        console.log('🚪 Sesión cerrada correctamente');
        res.redirect('/login');
    });
};

module.exports = { registrarUsuario, iniciarSesion, cerrarSesion };