import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export const ProfilePage = () => {
    const { token, setToken } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get('http://localhost:5000/api/users/profile', config);
                setEmail(res.data.email);
                setNombre(res.data.nombre || '');
                setTelefono(res.data.telefono || '');
            } catch (err) {
                console.error(err);
                setMensaje({ texto: 'Error al cargar perfil desde el servidor.', tipo: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token, navigate]);

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
        setMensaje({ texto: '', tipo: '' });

        const formattedPhone = cleanAndFormatPhone(telefono);
        const regexTelefono = /^\+56\s\d\s\d{4}\s\d{4}$/;
        if (!formattedPhone || !regexTelefono.test(formattedPhone)) {
            setMensaje({ texto: 'El teléfono de contacto debe contener 9 dígitos (ej: 123456789 o +56 9 1234 5678).', tipo: 'danger' });
            return;
        }

        setGuardando(true);

        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const res = await axios.put('http://localhost:5000/api/users/profile', { nombre, telefono: formattedPhone }, config);
            
            // Actualizar el token local en el contexto si se devolvió uno nuevo
            if (res.data.token) {
                setToken(res.data.token);
            }

            setTelefono(formattedPhone);
            setMensaje({ texto: 'Perfil actualizado exitosamente.', tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        } catch (err) {
            const errorText = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Error al actualizar perfil.';
            setMensaje({ texto: errorText, tipo: 'danger' });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <main className="cart-page-container" style={{ minHeight: '65vh' }}>
            <section id="reserva-detalle" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <h2>Mi Perfil de Usuario</h2>
                <p style={{ color: 'var(--neutro-gris)', marginBottom: '2rem', textAlign: 'center' }}>
                    Mantén tus datos actualizados para simplificar tus reservas.
                </p>

                {mensaje.texto && (
                    <div style={{
                        backgroundColor: mensaje.tipo === 'success' ? '#d1fae5' : '#fee2e2',
                        color: mensaje.tipo === 'success' ? '#065f46' : '#991b1b',
                        padding: '1rem',
                        borderRadius: 'var(--borde-radio)',
                        marginBottom: '1.5rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        border: `1px solid ${mensaje.tipo === 'success' ? '#a7f3d0' : '#fecaca'}`
                    }}>
                        {mensaje.tipo === 'success' ? '✓' : '⚠️'} {mensaje.texto}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ color: 'var(--neutro-gris)', fontWeight: '600' }}>Cargando datos de perfil...</p>
                    </div>
                ) : (
                    <form className="reserva-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Correo Electrónico:</label>
                            <input 
                                type="email" 
                                value={email} 
                                disabled 
                                style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Nombre Completo:</label>
                            <input 
                                type="text" 
                                required 
                                value={nombre} 
                                onChange={e => setNombre(e.target.value)} 
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>
                        <div className="form-group">
                            <label>Teléfono de Contacto:</label>
                            <input 
                                type="tel" 
                                required 
                                value={telefono} 
                                onChange={e => handlePhoneChange(e.target.value)} 
                                onBlur={handlePhoneBlur}
                                placeholder="Ej: +56 9 1234 5678"
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn-agregar" 
                            disabled={guardando}
                            style={{ marginTop: '1.5rem', width: '100%' }}
                        >
                            {guardando ? 'Guardando cambios...' : 'Guardar Cambios'}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link to="/" className="btn-agregar" style={{ backgroundColor: 'var(--neutro-gris)', color: 'white' }}>
                        Volver al Inicio
                    </Link>
                </div>
            </section>
        </main>
    );
};
