// Middleware de autorización: requiere que el usuario tenga rol 'admin'.
// Debe usarse SIEMPRE después del middleware de autenticación (auth.js),
// que es quien rellena req.user a partir del token.
module.exports = function (req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Acceso denegado: se requieren permisos de administrador' });
    }
    next();
};
