const mongoose = require('mongoose');

const zonaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    mesasDisponibles: { type: Number, required: true },
    capacidadMesa: { type: Number, required: true },
    disponible: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Zona', zonaSchema);
