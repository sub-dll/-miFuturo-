const db = require('../infrastructure/database/db');
const bcrypt = require('bcryptjs');

const registrarUsuario = async (req, res) => {
    try {
        // 1. Recibir los datos exactos del formulario
        const { nombres, email, telefono, password } = req.body;

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
// NUEVA FUNCIÓN: INICIAR SESIÓN (MIF-3)
// ==========================================
const iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar si el usuario existe en la base de datos
        const [usuarios] = await db.query('SELECT * FROM Usuario WHERE email = ?', [email]);
        
        if (usuarios.length === 0) {
            // Si el correo no está registrado
            return res.status(401).send('Correo o contraseña incorrectos.');
        }

        const usuario = usuarios[0];

        // 2. Comparar la contraseña ingresada con la encriptada en la base de datos
        const contrasenaValida = await bcrypt.compare(password, usuario.password);
        
        if (!contrasenaValida) {
            // Si la contraseña no coincide
            return res.status(401).send('Correo o contraseña incorrectos.');
        }

        // 3. ¡ÉXITO! Crear la sesión del usuario (vital para que funcione el foro)
        // Aquí le damos el valor real a req.session.id_usuario
        req.session.id_usuario = usuario.id_usuario;
        
        console.log(`✅ Sesión iniciada para el usuario ID: ${usuario.id_usuario} (${usuario.email})`);

        // 4. Redirigir a la página principal o a los foros
        res.redirect('/foros'); 

    } catch (error) {
        console.error('❌ Error en el inicio de sesión:', error.message);
        res.status(500).send('Error interno del servidor al iniciar sesión');
    }
};

// Asegurarnos de exportar AMBAS funciones para que authRoutes.js las pueda usar
module.exports = { registrarUsuario, iniciarSesion };