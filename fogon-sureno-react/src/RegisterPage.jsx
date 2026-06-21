import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [success, setSuccess] = useState('');
    const { register, authError } = useAuth();
    const navigate = useNavigate();

    const cleanAndFormatPhone = (phoneStr) => {
        if (!phoneStr) return '';
        let clean = phoneStr.replace(/\D/g, '');
        if (clean.startsWith('56') && clean.length === 11) {
            clean = clean.substring(2);
        }
        if (clean.length === 9) {
            return `+56 ${clean.substring(0, 1)} ${clean.substring(1, 5)} ${clean.substring(5)}`;
        }
        return '';
    };

    const handlePhoneChange = (val) => {
        setTelefono(val);
        const cleaned = val.replace(/\D/g, '');
        if (cleaned.length === 9 || (cleaned.startsWith('56') && cleaned.length === 11)) {
            const formatted = cleanAndFormatPhone(val);
            if (formatted) {
                setTelefono(formatted);
            }
        }
    };

    const handlePhoneBlur = () => {
        const formatted = cleanAndFormatPhone(telefono);
        if (formatted) {
            setTelefono(formatted);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccess('');

        if (!nombre.trim()) {
            setLocalError('El nombre completo es obligatorio.');
            return;
        }
        
        const formattedPhone = cleanAndFormatPhone(telefono);
        const regexTelefono = /^\+56\s\d\s\d{4}\s\d{4}$/;
        if (!formattedPhone || !regexTelefono.test(formattedPhone)) {
            setLocalError('El teléfono de contacto debe contener 9 dígitos (ej: 123456789 o +56 9 1234 5678).');
            return;
        }
        if (password.length < 6) {
            setLocalError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setLocalError('Las contraseñas no coinciden.');
            return;
        }

        const result = await register(email, password, nombre, formattedPhone);
        if (result.success) {
            setSuccess('¡Cuenta creada! Redirigiendo al inicio de sesión...');
            setTimeout(() => navigate('/login'), 1500);
        }
    };

    return (
        <div className="reserva-page-container" style={{ minHeight: '70vh' }}>
            <h2>Crear Cuenta</h2>
            <form onSubmit={handleSubmit} className="reserva-form">
                <div className="form-group">
                    <label htmlFor="nombre">Nombre Completo</label>
                    <input
                        type="text"
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="telefono">Teléfono de Contacto</label>
                    <input
                        type="tel"
                        id="telefono"
                        value={telefono}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onBlur={handlePhoneBlur}
                        placeholder="Ej: +56 9 1234 5678"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ej: juan@test.com"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar contraseña</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                {(localError || authError) && <p style={{ color: 'red' }}>{localError || authError}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <button type="submit" className="btn-pagar">Registrarme</button>
            </form>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
            </div>
        </div>
    );
};

export default RegisterPage;
