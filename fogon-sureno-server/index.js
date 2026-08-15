require('dotenv').config(); // Carga las variables de entorno desde .env
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

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

// --- Rutas ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/zonas', require('./routes/zonas'));
app.use('/api/users', require('./routes/users'));

app.listen(PORT, () => {
    console.log(`Servidor del Fogón Sureño corriendo en http://localhost:${PORT}`);
});