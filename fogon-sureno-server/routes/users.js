const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User');

// Obtener detalles del perfil propio
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error en el servidor al obtener el perfil.' });
    }
});

// Actualizar perfil propio (Nombre y Teléfono)
router.put('/profile', authMiddleware, [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.').escape(),
    body('telefono').trim().notEmpty().withMessage('El teléfono debe tener el formato +56 X XXXX XXXX').matches(/^\+56\s\d\s\d{4}\s\d{4}$/)
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, telefono } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        user.nombre = nombre;
        user.telefono = telefono;
        await user.save();

        // Generar un nuevo JWT para reflejar el nombre actualizado en el cliente
        const payload = { user: { id: user.id, role: user.role, nombre: user.nombre } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ 
                message: 'Perfil actualizado correctamente.', 
                token, 
                user: { nombre: user.nombre, email: user.email, telefono: user.telefono, role: user.role } 
            });
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error en el servidor al actualizar el perfil.' });
    }
});

// Endpoint para OBTENER TODOS los usuarios (Solo administradores)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error.message);
        res.status(500).send('Error en el servidor al obtener usuarios');
    }
});

// Endpoint para MODIFICAR un usuario por completo (Solo administradores)
router.put('/:id', authMiddleware, isAdmin, [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.').escape(),
    body('telefono').trim().notEmpty().withMessage('El teléfono debe tener el formato +56 X XXXX XXXX').matches(/^\+56\s\d\s\d{4}\s\d{4}$/),
    body('role').isIn(['user', 'admin']).withMessage('Rol inválido.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre, telefono, role } = req.body;

    // Impedir que un administrador se degrade a sí mismo
    if (req.user.id === id && role !== 'admin') {
        return res.status(400).json({ error: 'No puedes cambiar tu propio rol para evitar bloquear tu cuenta.' });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        user.nombre = nombre;
        user.telefono = telefono;
        user.role = role;
        await user.save();

        res.json({ message: 'Usuario actualizado correctamente por el administrador.', user });
    } catch (error) {
        console.error('Error al actualizar el usuario:', error.message);
        res.status(500).send('Error en el servidor al actualizar el usuario');
    }
});

// Endpoint para ELIMINAR un usuario (Solo administradores)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
    const { id } = req.params;

    // Impedir que un administrador se elimine a sí mismo
    if (req.user.id === id) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta mientras estás logueado.' });
    }

    try {
        const userEliminado = await User.findByIdAndDelete(id);
        if (!userEliminado) {
            return res.status(404).json({ error: 'El usuario no existe.' });
        }

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error.message);
        res.status(500).send('Error en el servidor al intentar eliminar el usuario');
    }
});

module.exports = router;
