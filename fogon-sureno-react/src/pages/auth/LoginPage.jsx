import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, authError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirigir a la página que el usuario intentaba visitar, o al panel de admin por defecto
    const from = location.state?.from?.pathname || "/#inicio";

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="reserva-page-container" style={{ minHeight: '70vh' }}>
            <h2>Iniciar Sesión</h2>
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
                <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {authError && <p style={{ color: 'red' }}>{authError}</p>}
                <button type="submit" className="btn-pagar">Ingresar</button>
            </form>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p>¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link></p>
                <p><Link to="/recuperar">¿Olvidaste tu contraseña?</Link></p>
            </div>
        </div>
    );
};

export default LoginPage;
