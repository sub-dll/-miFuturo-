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

module.exports = { registrarUsuario };