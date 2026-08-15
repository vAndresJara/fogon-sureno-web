const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true },
    telefono: { type: String },
    fecha: { type: Date, required: true },
    personas: { type: Number, required: true },
    zonaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Reserva', reservaSchema);
