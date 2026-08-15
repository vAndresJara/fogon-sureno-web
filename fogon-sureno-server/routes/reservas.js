const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const Reserva = require('../models/Reserva');
const User = require('../models/User');
const Zona = require('../models/Zona');

// Endpoint para OBTENER TODAS las reservas (Solo administradores)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const reservas = await Reserva.find().populate('zonaId').sort({ fecha: -1 });
        res.json(reservas);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

// Endpoint para recibir nuevas reservas (Requiere login, zona y obtiene datos del perfil)
router.post('/', authMiddleware, [
    body('fecha').isISO8601().toDate().withMessage('La fecha no es válida.'),
    body('personas').isInt({ min: 1, max: 15 }).withMessage('El número de personas debe estar entre 1 y 15.'),
    body('zonaId').isMongoId().withMessage('Debe seleccionar una zona válida.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
 
    const { fecha, personas, zonaId } = req.body;
    try {
        // 1. Obtener datos del usuario logueado
        const userObj = await User.findById(req.user.id);
        if (!userObj) {
            return res.status(404).json({ error: 'Usuario no encontrado en el sistema.' });
        }

        // 2. Validar que tenga el perfil completo
        if (!userObj.nombre || !userObj.telefono) {
            return res.status(400).json({ error: 'Debes completar tu Nombre y Teléfono en tu Perfil antes de poder realizar una reserva.' });
        }

        const nombre = userObj.nombre;
        const email = userObj.email;
        const telefono = userObj.telefono;

        // 3. Validar que la zona exista y esté disponible
        const zona = await Zona.findById(zonaId);
        if (!zona || zona.disponible === false) {
            return res.status(404).json({ error: 'La zona seleccionada no está disponible o no existe.' });
        }

        // 4. Validar capacidad de mesa en la zona
        if (zona.capacidadMesa < personas) {
            return res.status(400).json({ error: `La capacidad máxima por mesa en la zona ${zona.nombre} es de ${zona.capacidadMesa} personas.` });
        }

        // 5. Validar disponibilidad de stock (mesas libres) en la zona para la fecha
        const fechaBuscada = new Date(fecha);
        const inicioDia = new Date(fechaBuscada.setUTCHours(0,0,0,0));
        const finDia = new Date(fechaBuscada.setUTCHours(23,59,59,999));

        const reservasCount = await Reserva.countDocuments({
            zonaId: zonaId,
            fecha: { $gte: inicioDia, $lte: finDia }
        });

        if (reservasCount >= zona.mesasDisponibles) {
            return res.status(400).json({ error: 'Lo sentimos, ya no quedan mesas disponibles en la zona seleccionada para esta fecha.' });
        }

        // 6. Crear la reserva asociándola al usuario autenticado
        const nuevaReserva = new Reserva({ 
            nombre, 
            email, 
            telefono,
            fecha, 
            personas, 
            zonaId, 
            userId: req.user.id 
        });

        await nuevaReserva.save();
        res.status(201).json({ message: 'Reserva confirmada con éxito', reserva: nuevaReserva });
    } catch (error) {
        console.error('Error al guardar reserva:', error);
        res.status(500).json({ error: 'No se pudo registrar la reserva en el servidor' });
    }
});

// Endpoint para ELIMINAR una reserva por su ID (Solo administradores)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const reservaEliminada = await Reserva.findByIdAndDelete(req.params.id);
        if (!reservaEliminada) {
            return res.status(404).json({ error: 'La reserva no existe.' });
        }
        res.json({ message: 'Reserva eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar reserva:', error.message);
        res.status(500).send('Error en el servidor al intentar eliminar');
    }
});

module.exports = router;
