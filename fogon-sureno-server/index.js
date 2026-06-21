require('dotenv').config(); // Carga las variables de entorno desde .env
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const path = require('path');
const mongoose = require('mongoose');
const authMiddleware = require('./middleware/auth');
const isAdmin = require('./middleware/isAdmin');
const User = require('./models/User');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Servir de forma estática la carpeta de imágenes subidas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Conexión a MongoDB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// --- Definición de Esquemas ---
const zonaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    mesasDisponibles: { type: Number, required: true },
    capacidadMesa: { type: Number, required: true },
    disponible: { type: Boolean, default: true }
}, { timestamps: true });

const Zona = mongoose.model('Zona', zonaSchema);

const reservaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true },
    telefono: { type: String },
    fecha: { type: Date, required: true },
    personas: { type: Number, required: true },
    zonaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Reserva = mongoose.model('Reserva', reservaSchema);


const MenuSchema = new mongoose.Schema({
    //id: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    precio: { type: Number, required: true },
    imagen: { type: String, required: true },
    categoria: { type: String, required: true },
    disponible: { type: Boolean, default: true }
});

const MenuItem = mongoose.model('MenuItem', MenuSchema);

// --- Configuración de Almacenamiento de Imágenes con Multer ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads');
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
app.post('/api/upload', authMiddleware, isAdmin, upload.single('imagen'), (req, res) => {
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

//Endpoint para almacenar un nuevo plato del menú en mongoDB (Solo administradores)
app.post('/api/menu', authMiddleware, isAdmin, [
    //body('id').trim().notEmpty().withMessage('El ID es obligatorio.').escape(),
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.').escape(),
    body('descripcion').trim().notEmpty().withMessage('La descripción es obligatoria.').escape(),
    body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo.'),
    body('imagen').trim().notEmpty().withMessage('El nombre de la imagen es obligatorio.'),
    body('categoria').trim().notEmpty().withMessage('La categoría es obligatoria.').escape()
], async (req, res) => {
    const errors = validationResult(req);
    // Si hay errores de validación, respondemos con un 400 y los detalles de los errores
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });// Esto ayuda al frontend a mostrar mensajes de error específicos para cada campo
    }
    const { id, nombre, descripcion, precio, imagen, categoria, disponible } = req.body;
    try {
        const nuevoPlato = new MenuItem({ id, nombre, descripcion, precio, imagen, categoria, disponible });
        await nuevoPlato.save();
        res.status(201).json({ message: 'Plato agregado al menú', plato: nuevoPlato });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo agregar el plato al menú' });
    }
});

//endpoint para obtener el menú completo desde mongoDB (sin autenticación, ya que es público)
app.get('/api/menu', async (req, res) => {
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
app.put('/api/menu/:id', authMiddleware, isAdmin, [
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
            { new: true } // devuelve el documento actualizado
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
app.delete('/api/menu/:id', authMiddleware, isAdmin, async (req, res) => {
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

// --- ENDPOINTS DE RESERVAS ---

// Endpoint para OBTENER TODAS las reservas (Solo administradores)
app.get('/api/reservas', authMiddleware, isAdmin, async (req, res) => {
    try {
        // Populamos zonaId para obtener la información de la zona correspondiente
        const reservas = await Reserva.find().populate('zonaId').sort({ fecha: -1 });
        res.json(reservas);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

// Endpoint para recibir nuevas reservas (Ahora requiere login, zona y obtiene datos del perfil)
app.post('/api/reservas', authMiddleware, [
    // Reglas de validación
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
app.delete('/api/reservas/:id', authMiddleware, isAdmin, async (req, res) => {
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

// --- ENDPOINTS DE ZONAS ---

// Obtener todas las zonas (Solo administradores)
app.get('/api/zonas', authMiddleware, isAdmin, async (req, res) => {
    try {
        const zonas = await Zona.find().sort({ capacidadMesa: 1 });
        res.json(zonas);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor al obtener zonas');
    }
});

// Crear una zona (Solo administradores)
app.post('/api/zonas', authMiddleware, isAdmin, [
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
app.put('/api/zonas/:id', authMiddleware, isAdmin, [
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
app.delete('/api/zonas/:id', authMiddleware, isAdmin, async (req, res) => {
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

// Obtener zonas disponibles para clientes (Requiere autenticación, busca por fecha y capacidad)
app.get('/api/zonas/disponibles', authMiddleware, async (req, res) => {
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

// --- Endpoints de Perfil Personal (Autenticados) ---

// Obtener detalles del perfil propio
app.get('/api/users/profile', authMiddleware, async (req, res) => {
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
app.put('/api/users/profile', authMiddleware, [
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

// --- Endpoint para OBTENER TODOS los usuarios (Solo administradores) ---
app.get('/api/users', authMiddleware, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error.message);
        res.status(500).send('Error en el servidor al obtener usuarios');
    }
});

// --- Endpoint para MODIFICAR un usuario por completo (Solo administradores) ---
app.put('/api/users/:id', authMiddleware, isAdmin, [
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

// --- Endpoint para ELIMINAR un usuario (Solo administradores) ---
app.delete('/api/users/:id', authMiddleware, isAdmin, async (req, res) => {
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

// --- Rutas de Autenticación ---
app.use('/api/auth', require('./routes/auth'));

app.listen(PORT, () => {
    console.log(`Servidor del Fogón Sureño corriendo en http://localhost:${PORT}`);
});