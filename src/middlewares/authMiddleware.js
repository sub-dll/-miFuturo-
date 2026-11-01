const protegerRuta = (req, res, next) => {
    const usuarioId = req.session && (req.session.userId || req.session.id_usuario);
    if (usuarioId) {
        req.session.userId = usuarioId;
        next();
    } else {
        // No hay sesión activa, lo redirigimos a la página de login
        res.redirect('/login');
    }
};

module.exports = { protegerRuta };