import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [success, setSuccess] = useState('');
    const { resetPassword, authError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccess('');

        if (password.length < 6) {
            setLocalError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setLocalError('Las contraseñas no coinciden.');
            return;
        }

        const result = await resetPassword(token, password);
        if (result.success) {
            setSuccess(result.msg);
            setTimeout(() => navigate('/login'), 1500);
        }
    };

    return (
        <div className="reserva-page-container" style={{ minHeight: '70vh' }}>
            <h2>Restablecer Contraseña</h2>
            <form onSubmit={handleSubmit} className="reserva-form">
                <div className="form-group">
                    <label htmlFor="password">Nueva contraseña</label>
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
                    <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
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
                <button type="submit" className="btn-pagar">Guardar contraseña</button>
            </form>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p><Link to="/login">Volver a iniciar sesión</Link></p>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
