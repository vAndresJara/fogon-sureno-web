import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const { forgotPassword, authError } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        const result = await forgotPassword(email);
        if (result.success) {
            setMessage(result.msg);
        }
    };

    return (
        <div className="reserva-page-container" style={{ minHeight: '70vh' }}>
            <h2>Recuperar Contraseña</h2>
            <p>Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.</p>
            <form onSubmit={handleSubmit} className="reserva-form">
                <div className="form-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                {authError && <p style={{ color: 'red' }}>{authError}</p>}
                {message && <p style={{ color: 'green' }}>{message}</p>}
                <button type="submit" className="btn-pagar">Enviar enlace</button>
            </form>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p><Link to="/login">Volver a iniciar sesión</Link></p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
