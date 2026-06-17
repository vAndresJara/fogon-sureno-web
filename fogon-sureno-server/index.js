const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let reservas = []; // Base de datos temporal en memoria

// Endpoint para obtener el menú desde el archivo JSON
// Endpoint para obtener el menú desde el archivo JSON local al servidor
app.get('/api/menu', (req, res) => {
    const dataPath = path.join(__dirname, 'menu.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer el menú' });
        }
        res.json(JSON.parse(data));
    });
});

// Endpoint para recibir nuevas reservas (Ahora guarda en la DB)
app.post('/api/reservas', async (req, res) => {
    const { nombre, email, fecha, personas } = req.body;
    
    if (!nombre || !email || !fecha || !personas) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const nuevaReserva = new Reserva({ nombre, email, fecha, personas });
        await nuevaReserva.save();
        console.log('Reserva guardada en DB:', nuevaReserva);
        res.status(201).json({ message: 'Reserva confirmada', reserva: nuevaReserva });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo guardar la reserva' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor del Fogón Sureño corriendo en http://localhost:${PORT}`);
});