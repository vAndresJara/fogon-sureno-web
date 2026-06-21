// Script para promover un usuario existente a administrador.
//
// Uso (desde la carpeta fogon-sureno-server):
//   node scripts/makeAdmin.js correo@ejemplo.com
//
// El usuario debe haberse registrado antes desde la app.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];

if (!email) {
    console.error('Debes indicar el correo. Ejemplo: node scripts/makeAdmin.js correo@ejemplo.com');
    process.exit(1);
}

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOneAndUpdate(
            { email: normalizedEmail },
            { role: 'admin' },
            { new: true }
        );

        if (!user) {
            console.error(`No se encontró ningún usuario con el correo: ${normalizedEmail}`);
            process.exitCode = 1;
        } else {
            console.log(`✓ El usuario ${user.email} ahora tiene rol: ${user.role}`);
        }
    } catch (err) {
        console.error('Error:', err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
})();
