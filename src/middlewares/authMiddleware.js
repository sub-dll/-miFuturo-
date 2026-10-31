const protegerRuta = (req, res, next) => {
    // Revisamos si el objeto session existe y si tiene un userId guardado
    if (req.session && req.session.userId) {
        // Todo está en orden, usamos next() para dejarlo pasar a la ruta solicitada
        next();
    } else {
        // No hay sesión activa, lo redirigimos a la página de login
        res.redirect('/login');
    }
};

module.exports = { protegerRuta };