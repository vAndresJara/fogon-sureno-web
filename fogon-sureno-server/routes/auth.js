const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendResetPasswordEmail } = require('../services/emailService');

// Helper: responde con los errores de validación si los hay.
const checkValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return false;
    }
    return true;
};

// @route   POST api/auth/register
// @desc    Registrar un nuevo usuario con correo, contraseña, nombre y teléfono
// @access  Public
router.post(
    '/register',
    [
        body('email', 'Por favor, incluye un correo válido').isEmail().normalizeEmail(),
        body('password', 'La contraseña debe tener 6 o más caracteres').isLength({ min: 6 }),
        body('nombre', 'El nombre es obligatorio').trim().notEmpty(),
        body('telefono', 'El número de teléfono debe tener el formato +56 X XXXX XXXX').matches(/^\+56\s\d\s\d{4}\s\d{4}$/),
    ],
    async (req, res) => {
        if (!checkValidation(req, res)) return;

        const { email, password, nombre, telefono } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ msg: 'Ya existe una cuenta con este correo' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({ email, password: hashedPassword, nombre, telefono });
            await user.save();

            res.status(201).json({ msg: 'Usuario registrado exitosamente' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Error en el servidor');
        }
    }
);

// @route   POST api/auth/login
// @desc    Autenticar usuario y obtener token
// @access  Public
router.post(
    '/login',
    [
        body('email', 'Por favor, incluye un correo válido').isEmail().normalizeEmail(),
        body('password', 'La contraseña es requerida').exists(),
    ],
    async (req, res) => {
        if (!checkValidation(req, res)) return;

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) return res.status(400).json({ msg: 'Credenciales inválidas' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ msg: 'Credenciales inválidas' });

            const payload = { user: { id: user.id, role: user.role, nombre: user.nombre || '' } };

            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
                if (err) throw err;
                res.json({ token });
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Error en el servidor');
        }
    }
);

// @route   POST api/auth/forgot-password
// @desc    Solicitar recuperación de contraseña (MODO DEV: el enlace se imprime en consola)
// @access  Public
router.post(
    '/forgot-password',
    [body('email', 'Por favor, incluye un correo válido').isEmail().normalizeEmail()],
    async (req, res) => {
        if (!checkValidation(req, res)) return;

        const { email } = req.body;

        try {
            const user = await User.findOne({ email });

            // Si el usuario existe, generamos el token de reseteo.
            if (user) {
                // Token en claro que va en el enlace; en la DB guardamos su hash.
                const resetToken = crypto.randomBytes(32).toString('hex');
                const hashedToken = crypto
                    .createHash('sha256')
                    .update(resetToken)
                    .digest('hex');

                user.resetPasswordToken = hashedToken;
                user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hora
                await user.save();

                // Enviar el correo electrónico con el enlace de restablecimiento
                const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
                const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

                await sendResetPasswordEmail(email, resetUrl);
            }

            // Respuesta genérica para no revelar qué correos están registrados.
            res.json({
                msg: 'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.',
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Error en el servidor');
        }
    }
);

// @route   POST api/auth/reset-password/:token
// @desc    Restablecer la contraseña usando el token recibido
// @access  Public
router.post(
    '/reset-password/:token',
    [
        param('token', 'Token inválido').isLength({ min: 1 }),
        body('password', 'La contraseña debe tener 6 o más caracteres').isLength({ min: 6 }),
    ],
    async (req, res) => {
        if (!checkValidation(req, res)) return;

        const { token } = req.params;
        const { password } = req.body;

        try {
            // Hasheamos el token recibido para compararlo con el almacenado.
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            const user = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: Date.now() },
            });

            if (!user) {
                return res.status(400).json({ msg: 'El enlace es inválido o ha expirado' });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.json({ msg: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Error en el servidor');
        }
    }
);

module.exports = router;
