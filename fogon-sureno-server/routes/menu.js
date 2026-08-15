const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const MenuItem = require('../models/MenuItem');

// --- Configuración de Almacenamiento de Imágenes con Multer ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads');
        // Crear carpeta si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Renombrar archivo a plato-[timestamp]-[random].png
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'plato-' + uniqueSuffix + '.png');
    }
});

// Filtro estricto para aceptar únicamente archivos PNG
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes de formato PNG (.png)'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

// Endpoint para subir imágenes PNG (Solo administradores)
router.post('/upload', authMiddleware, isAdmin, upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen o el archivo no es PNG.' });
    }
    // Retornar la URL pública de la imagen
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ imageUrl });
}, (error, req, res, next) => {
    // Manejar errores lanzados por el filtro de multer
    res.status(400).json({ error: error.message });
});

// Endpoint para almacenar un nuevo plato del menú en mongoDB (Solo administradores)
router.post('/', authMiddleware, isAdmin, [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.').escape(),
    body('descripcion').trim().notEmpty().withMessage('La descripción es obligatoria.').escape(),
    body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo.'),
    body('imagen').trim().notEmpty().withMessage('El nombre de la imagen es obligatorio.'),
    body('categoria').trim().notEmpty().withMessage('La categoría es obligatoria.').escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { nombre, descripcion, precio, imagen, categoria, disponible } = req.body;
    try {
        const nuevoPlato = new MenuItem({ nombre, descripcion, precio, imagen, categoria, disponible });
        await nuevoPlato.save();
        res.status(201).json({ message: 'Plato agregado al menú', plato: nuevoPlato });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo agregar el plato al menú' });
    }
});

// Endpoint para obtener el menú completo desde mongoDB (sin autenticación, ya que es público)
router.get('/', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        let query = { disponible: { $ne: false } };

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.user?.role === 'admin') {
                    query = {}; // Los administradores ven todos los platos (incluidos los ocultos)
                }
            } catch (err) {
                // Token inválido/expirado, procedemos con consulta pública
            }
        }

        const menuData = await MenuItem.find(query);
        res.json(menuData);
    } catch (error) {
        res.status(500).json({ error: 'No se pudo obtener el menú' });
    }
});

// Endpoint para MODIFICAR un plato del menú por su ID (Solo administradores)
router.put('/:id', authMiddleware, isAdmin, [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.').escape(),
    body('descripcion').trim().notEmpty().withMessage('La descripción es obligatoria.').escape(),
    body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo.'),
    body('imagen').trim().notEmpty().withMessage('La URL/nombre de la imagen es obligatorio.'),
    body('categoria').trim().notEmpty().withMessage('La categoría es obligatoria.').escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre, descripcion, precio, imagen, categoria, disponible } = req.body;

    try {
        const platoActualizado = await MenuItem.findByIdAndUpdate(
            id,
            { nombre, descripcion, precio, imagen, categoria, disponible },
            { new: true }
        );

        if (!platoActualizado) {
            return res.status(404).json({ error: 'El plato no existe.' });
        }

        res.json({ message: 'Plato modificado correctamente', plato: platoActualizado });
    } catch (error) {
        console.error('Error al modificar plato:', error.message);
        res.status(500).send('Error en el servidor al intentar modificar el plato');
    }
});

// Endpoint para ELIMINAR un plato del menú por su ID (Solo administradores)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const platoEliminado = await MenuItem.findByIdAndDelete(id);
        if (!platoEliminado) {
            return res.status(404).json({ error: 'El plato no existe.' });
        }
        res.json({ message: 'Plato eliminado correctamente de la base de datos' });
    } catch (error) {
        console.error('Error al eliminar plato:', error.message);
        res.status(500).send('Error en el servidor al intentar eliminar el plato');
    }
});

module.exports = router;
