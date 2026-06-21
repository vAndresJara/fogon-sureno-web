const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { type: String, required: true },
    nombre: { type: String },
    telefono: { type: String },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // Campos para la recuperación de contraseña
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
