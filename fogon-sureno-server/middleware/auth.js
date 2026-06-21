const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Obtener el token de la cabecera 'x-auth-token'
    const token = req.header('x-auth-token');

    // 2. Si no hay token, devolver un error de no autorizado
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }

    // 3. Si hay un token, verificarlo
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Guardamos el payload del usuario en la petición
        next(); // El token es válido, continuamos a la ruta
    } catch (err) {
        res.status(401).json({ msg: 'El token no es válido' });
    }
};