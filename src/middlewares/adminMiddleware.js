const verificarAdmin = (req, res, next) => {
    // 1. Verificamos que el objeto session exista en la petición para evitar el TypeError
    if (!req.session) {
        return res.redirect('/login');
    }

    // 2. Buscamos el usuario de forma segura
    const adminUser = req.session.user || req.session.usuario;

    // 3. Verificamos si existe el usuario y tiene el rol correcto
    if (adminUser && adminUser.tipo_perfil === 'admin') {
        req.session.user = adminUser; // Lo aseguramos para el Navbar
        return next();
    }
    
    // 4. Si no es admin o no hay usuario, bloqueamos
    return res.status(403).send("Acceso denegado. Se requieren privilegios de administrador para gestionar la plataforma.");
};

module.exports = { verificarAdmin };