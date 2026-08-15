import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const formatFecha = (fechaString) => {
    if (!fechaString) return '';
    // El backend envía fechas en formato ISO largo: "2026-06-21T00:00:00.000Z"
    // Extraemos la parte de fecha pura "YYYY-MM-DD"
    const fechaSolo = fechaString.split('T')[0];
    const partes = fechaSolo.split('-');
    if (partes.length !== 3) return fechaString;
    const [year, month, day] = partes;
    return `${day}/${month}/${year}`;
};

const AdminReservasPage = () => {
    const [reservas, setReservas] = useState([]); // Estado para almacenar las reservas
    const [loading, setLoading] = useState(true); // Estado para controlar la carga de datos
    const [error, setError] = useState(''); // Estado para manejar errores
    const { token, logout } = useAuth(); // Obtenemos el token del contexto
    const navigate = useNavigate(); // Para redirigir al usuario después de cerrar sesión

    // Función memorizada para cargar las reservas
    const fetchReservas = useCallback(async (signal) => {
        if (!token) {
            setError('No estás autenticado.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Configuramos axios con token y señal de cancelación
            const config = {
                headers: { 'x-auth-token': token },
                signal: signal
            };
            const res = await axios.get('http://localhost:5000/api/reservas', config);
            setReservas(res.data);
        } catch (err) {
            if (axios.isCancel(err)) {
                return; // Petición cancelada por desmontado, no actualizar estado
            }
            setError('No se pudieron cargar las reservas. Es posible que tu sesión haya expirado o no tengas permisos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Efecto para cargar las reservas de forma segura al montar/cambiar token
    useEffect(() => {
        const controller = new AbortController();
        fetchReservas(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchReservas]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleEliminar = async (id) => {
        // Preguntar al administrador si está seguro
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta reserva?')) return;

        try {
            const config = { headers: { 'x-auth-token': token } };
            // Enviamos la petición DELETE con el ID de la reserva
            await axios.delete(`http://localhost:5000/api/reservas/${id}`, config);

            // Si el backend responde bien, la quitamos del estado local
            setReservas(prev => prev.filter(reserva => reserva._id !== id));
        } catch (err) {
            alert('No se pudo eliminar la reserva.');
            console.error(err);
        }
    };

    return (
        <div className="cart-page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h2>Panel de Administración de Reservas</h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => fetchReservas()}
                        className="btn-agregar"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        disabled={loading}
                    >
                        🔄 Actualizar
                    </button>
                    <button onClick={handleLogout} className="btn-eliminar">Cerrar Sesión</button>
                </div>
            </div>

            <div className="cart-items-full" style={{ marginTop: '2rem', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner" style={{
                            margin: '0 auto 1rem auto',
                            width: '40px',
                            height: '40px',
                            border: '4px solid rgba(44, 74, 62, 0.1)',
                            borderTop: '4px solid var(--color-principal)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{ color: 'var(--neutro-gris)', fontWeight: '600' }}>Cargando reservas...</p>
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : error ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        backgroundColor: 'rgba(140, 58, 30, 0.1)',
                        border: '1px solid var(--color-secundario)',
                        borderRadius: 'var(--borde-radio)',
                        color: 'var(--color-secundario)'
                    }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>{error}</p>
                        <button onClick={() => fetchReservas()} className="btn-agregar" style={{ margin: '0 auto' }}>
                            Intentar de nuevo
                        </button>
                    </div>
                ) : reservas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--neutro-gris)', padding: '2rem' }}>No hay reservas registradas.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-principal)', backgroundColor: 'rgba(44, 74, 62, 0.05)' }}>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-principal)' }}>Nombre</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-principal)' }}>Email</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-principal)' }}>Teléfono</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-principal)' }}>Fecha</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-principal)' }}>Zona</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--color-principal)' }}>Personas</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--color-principal)' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservas.map(reserva => (
                                    <tr key={reserva._id} style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }} className="reserva-row">
                                        <td style={{ padding: '12px 8px', fontWeight: '500' }}>{reserva.nombre}</td>
                                        <td style={{ padding: '12px 8px', color: 'var(--neutro-gris)' }}>{reserva.email}</td>
                                        <td style={{ padding: '12px 8px', color: 'var(--neutro-gris)', whiteSpace: 'nowrap' }}>{reserva.telefono || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>N/A</span>}</td>
                                        <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                backgroundColor: 'rgba(44, 74, 62, 0.1)',
                                                color: 'var(--color-principal)',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontWeight: '600',
                                                fontSize: '0.9rem'
                                            }}>
                                                {formatFecha(reserva.fecha)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                                color: '#0d6efd',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontWeight: '600',
                                                fontSize: '0.9rem'
                                            }}>
                                                {reserva.zonaId?.nombre || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                                                color: 'var(--color-acento)',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem'
                                            }}>
                                                {reserva.personas} {reserva.personas === 1 ? 'persona' : 'personas'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                            <button onClick={() => handleEliminar(reserva._id)} className="btn-eliminar">
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <style>{`
                            .reserva-row:hover {
                                background-color: rgba(44, 74, 62, 0.02);
                            }
                        `}</style>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReservasPage;