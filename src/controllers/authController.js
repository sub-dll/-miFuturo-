const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar si el correo existe en la base de datos
        const [usuarios] = await db.query('SELECT * FROM Usuario WHERE email = ?', [email]);
        
        if (usuarios.length === 0) {
            return res.status(401).send('Credenciales incorrectas');
        }

        const usuario = usuarios[0]; // Extraemos el usuario encontrado

        // 2. Comparar la contraseña ingresada con la encriptada
        const coinciden = await bcrypt.compare(password, usuario.password);

        if (!coinciden) {
            return res.status(401).send('Credenciales incorrectas');
        }

        // 3. Guardar la ID en la sesión
        req.session.userId = usuario.id_usuario;
        
        console.log(`✅ Sesión iniciada exitosamente para el usuario ID: ${usuario.id_usuario}`);
        
        // 4. Redirigir a la página principal tras entrar
        res.redirect('/'); // Ajusta esta ruta a donde quieras llevar al usuario (ej: '/dashboard', '/inicio')

    } catch (error) {
        console.error('❌ Error en el login:', error.message);
        res.status(500).send('Error interno del servidor al iniciar sesión');
    }
};

// No olvides exportar ambas funciones al final de tu archivo:
module.exports = { registrarUsuario, loginUsuario };