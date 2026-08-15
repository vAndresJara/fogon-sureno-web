const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    precio: { type: Number, required: true },
    imagen: { type: String, required: true },
    categoria: { type: String, required: true },
    disponible: { type: Boolean, default: true }
});

module.exports = mongoose.model('MenuItem', MenuSchema);
