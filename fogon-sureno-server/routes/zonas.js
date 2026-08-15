const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const Zona = require('../models/Zona');
const Reserva = require('../models/Reserva');

// Obtener todas las zonas (Solo administradores)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const zonas = await Zona.find().sort({ capacidadMesa: 1 });
        res.json(zonas);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor al obtener zonas');
    }
});

// Obtener zonas disponibles para clientes (Requiere autenticación, busca por fecha y capacidad)
router.get('/disponibles', authMiddleware, async (req, res) => {
    const { fecha, personas } = req.query;
    if (!fecha || !personas) {
        return res.status(400).json({ error: 'Fecha y personas son obligatorias.' });
    }

    try {
        const numPersonas = parseInt(personas);
        const zonas = await Zona.find({ 
            disponible: { $ne: false },
            capacidadMesa: { $gte: numPersonas } 
        }).sort({ capacidadMesa: 1 });

        const fechaBuscada = new Date(fecha);
        const inicioDia = new Date(fechaBuscada.setUTCHours(0,0,0,0));
        const finDia = new Date(fechaBuscada.setUTCHours(23,59,59,999));

        const zonasDisponibles = [];

        for (const zona of zonas) {
            const reservasCount = await Reserva.countDocuments({
                zonaId: zona._id,
                fecha: { $gte: inicioDia, $lte: finDia }
            });

            if (reservasCount < zona.mesasDisponibles) {
                zonasDisponibles.push({
                    ...zona.toObject(),
                    mesasLibres: zona.mesasDisponibles - reservasCount
                });
            }
        }

        res.json(zonasDisponibles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al buscar zonas disponibles.' });
    }
});

// Crear una zona (Solo administradores)
router.post('/', authMiddleware, isAdmin, [
    body('nombre').trim().notEmpty().withMessage('El nombre de la zona es obligatorio.').escape(),
    body('mesasDisponibles').isInt({ min: 1 }).withMessage('El stock de mesas debe ser al menos 1.'),
    body('capacidadMesa').isInt({ min: 1 }).withMessage('La capacidad por mesa debe ser al menos 1 persona.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, mesasDisponibles, capacidadMesa, disponible } = req.body;
    try {
        const nuevaZona = new Zona({ nombre, mesasDisponibles, capacidadMesa, disponible });
        await nuevaZona.save();
        res.status(201).json({ message: 'Zona creada correctamente', zona: nuevaZona });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'No se pudo crear la zona en el servidor' });
    }
});

// Modificar una zona por su ID (Solo administradores)
router.put('/:id', authMiddleware, isAdmin, [
    body('nombre').trim().notEmpty().withMessage('El nombre de la zona es obligatorio.').escape(),
    body('mesasDisponibles').isInt({ min: 1 }).withMessage('El stock de mesas debe ser al menos 1.'),
    body('capacidadMesa').isInt({ min: 1 }).withMessage('La capacidad por mesa debe ser al menos 1 persona.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre, mesasDisponibles, capacidadMesa, disponible } = req.body;

    try {
        const zonaActualizada = await Zona.findByIdAndUpdate(
            id,
            { nombre, mesasDisponibles, capacidadMesa, disponible },
            { new: true }
        );

        if (!zonaActualizada) {
            return res.status(404).json({ error: 'La zona no existe.' });
        }

        res.json({ message: 'Zona modificada correctamente', zona: zonaActualizada });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor al intentar modificar la zona.' });
    }
});

// Eliminar una zona por su ID (Solo administradores, bloqueado si tiene reservas)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const reservasActivas = await Reserva.countDocuments({ zonaId: id });
        if (reservasActivas > 0) {
            return res.status(400).json({ error: 'No se puede eliminar esta zona porque tiene reservas registradas en el sistema.' });
        }

        const zonaEliminada = await Zona.findByIdAndDelete(id);
        if (!zonaEliminada) {
            return res.status(404).json({ error: 'La zona no existe.' });
        }

        res.json({ message: 'Zona eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor al intentar eliminar la zona.' });
    }
});

module.exports = router;
