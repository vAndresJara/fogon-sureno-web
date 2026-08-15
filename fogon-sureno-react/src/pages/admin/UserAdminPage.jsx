import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const formatFecha = (fechaString) => {
    if (!fechaString) return '';
    const fechaSolo = fechaString.split('T')[0];
    const partes = fechaSolo.split('-');
    if (partes.length !== 3) return fechaString;
    const [year, month, day] = partes;
    return `${day}/${month}/${year}`;
};

export const UserAdminPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [editingUsuario, setEditingUsuario] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const { token, userId, logout } = useAuth();
    const navigate = useNavigate();

    const fetchUsuarios = useCallback(async (signal) => {
        if (!token) {
            setError('No estás autenticado.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const config = {
                headers: { 'x-auth-token': token },
                signal: signal
            };
            const res = await axios.get('http://localhost:5000/api/users', config);
            setUsuarios(res.data);
        } catch (err) {
            if (axios.isCancel(err)) {
                return;
            }
            const errorMsg = err.response?.data?.msg || err.response?.data?.error || err.message;
            const errorStatus = err.response?.status ? `(Código: ${err.response.status})` : '';
            setError(`No se pudieron cargar los usuarios. Detalle: ${errorMsg} ${errorStatus}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const controller = new AbortController();
        fetchUsuarios(controller.signal);
        return () => {
            controller.abort();
        };
    }, [fetchUsuarios]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

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

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!editingUsuario) return;

        const formattedPhone = cleanAndFormatPhone(editingUsuario.telefono);
        const regexTelefono = /^\+56\s\d\s\d{4}\s\d{4}$/;
        if (!formattedPhone || !regexTelefono.test(formattedPhone)) {
            alert('El teléfono debe contener 9 dígitos (ej: 123456789 o +56 9 1234 5678).');
            return;
        }

        setEnviando(true);
        setMensajeExito('');
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const res = await axios.put(`http://localhost:5000/api/users/${editingUsuario._id}`, {
                nombre: editingUsuario.nombre,
                telefono: formattedPhone,
                role: editingUsuario.role
            }, config);

            setUsuarios(prev => prev.map(u => u._id === editingUsuario._id ? res.data.user : u));
            setMensajeExito('Usuario actualizado correctamente.');
            setEditingUsuario(null);
            setTimeout(() => setMensajeExito(''), 4000);
        } catch (err) {
            const errorText = err.response?.data?.error || 'Error al actualizar el usuario.';
            alert(`No se pudo actualizar el usuario. Detalle: ${errorText}`);
        } finally {
            setEnviando(false);
        }
    };

    const handleEliminarUsuario = async (id) => {
        if (id === userId) {
            alert('No puedes eliminar tu propia cuenta mientras estás logueado.');
            return;
        }

        if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario permanentemente? Esta acción no se puede deshacer.')) return;

        setMensajeExito('');
        try {
            const config = { headers: { 'x-auth-token': token } };
            await axios.delete(`http://localhost:5000/api/users/${id}`, config);

            // Actualizar estado local
            setUsuarios(prev => prev.filter(u => u._id !== id));
            setMensajeExito('Usuario eliminado correctamente.');
            setTimeout(() => setMensajeExito(''), 4000);
        } catch (err) {
            alert(err.response?.data?.error || 'No se pudo eliminar el usuario.');
            console.error(err);
        }
    };

    return (
        <div className="cart-page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h2>Panel de Administración de Usuarios</h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => fetchUsuarios()}
                        className="btn-agregar"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        disabled={loading}
                    >
                        🔄 Actualizar
                    </button>
                    <button onClick={handleLogout} className="btn-eliminar">Cerrar Sesión</button>
                </div>
            </div>

            {mensajeExito && (
                <div style={{
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    padding: '0.8rem 1.2rem',
                    borderRadius: 'var(--borde-radio)',
                    marginTop: '1.5rem',
                    fontWeight: '600',
                    border: '1px solid #a7f3d0'
                }}>
                    ✓ {mensajeExito}
                </div>
            )}

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
                        <p style={{ color: 'var(--neutro-gris)', fontWeight: '600' }}>Cargando usuarios...</p>
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
                        <button onClick={() => fetchUsuarios()} className="btn-agregar" style={{ margin: '0 auto' }}>
                            Intentar de nuevo
                        </button>
                    </div>
                ) : usuarios.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--neutro-gris)', padding: '2rem' }}>No hay usuarios registrados.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-principal)', backgroundColor: 'rgba(44, 74, 62, 0.05)' }}>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-principal)' }}>Nombre</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-principal)' }}>Correo Electrónico</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--color-principal)' }}>Teléfono</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--color-principal)' }}>Rol</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--color-principal)' }}>Fecha de Creación</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--color-principal)' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map(usuario => {
                                    const esPropioUsuario = usuario._id === userId;
                                    return (
                                        <tr key={usuario._id} style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }} className="usuario-row">
                                            <td style={{ padding: '12px 8px', fontWeight: '600' }}>
                                                {usuario.nombre || <span style={{ color: 'var(--neutro-gris)', fontStyle: 'italic' }}>Sin nombre</span>}
                                            </td>
                                            <td style={{ padding: '12px 8px', color: 'var(--neutro-gris)' }}>
                                                {usuario.email} {esPropioUsuario && <span style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontWeight: 'bold' }}>(Tú)</span>}
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                {usuario.telefono || <span style={{ color: 'var(--neutro-gris)', fontStyle: 'italic' }}>Sin teléfono</span>}
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <span style={{
                                                    backgroundColor: usuario.role === 'admin' ? 'rgba(44, 74, 62, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                                    color: usuario.role === 'admin' ? 'var(--color-principal)' : 'var(--neutro-gris)',
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.85rem',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {usuario.role === 'admin' ? 'Administrador' : 'Cliente'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--neutro-gris)' }}>
                                                {formatFecha(usuario.createdAt)}
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => setEditingUsuario({ ...usuario })}
                                                        className="btn-qty"
                                                        style={{
                                                            width: 'auto',
                                                            height: 'auto',
                                                            padding: '0.3rem 0.6rem',
                                                            fontSize: '0.8rem',
                                                            backgroundColor: 'var(--color-principal)',
                                                            color: 'white',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Editar datos de usuario"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminarUsuario(usuario._id)}
                                                        className="btn-eliminar"
                                                        style={{
                                                            opacity: esPropioUsuario ? 0.5 : 1,
                                                            cursor: esPropioUsuario ? 'not-allowed' : 'pointer'
                                                        }}
                                                        disabled={esPropioUsuario}
                                                        title={esPropioUsuario ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <style>{`
                            .usuario-row:hover {
                                background-color: rgba(44, 74, 62, 0.02);
                            }
                        `}</style>
                    </div>
                )}
            </div>

            {/* Modal de edición */}
            {editingUsuario && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflow: 'auto' }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px', margin: '1.75rem auto' }}>
                        <div className="modal-content" style={{ backgroundColor: 'white', borderRadius: 'var(--borde-radio)', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                            <div className="modal-header bg-dark text-white" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #dee2e6', borderTopLeftRadius: 'var(--borde-radio)', borderTopRightRadius: 'var(--borde-radio)' }}>
                                <h5 className="modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>Editar Usuario: {editingUsuario.email}</h5>
                                <button type="button" className="btn-close btn-close-white" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }} onClick={() => setEditingUsuario(null)}>&times;</button>
                            </div>
                            <form onSubmit={handleUpdateSubmit}>
                                <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label className="fw-bold text-secondary" style={{ fontSize: '0.9rem' }}>Nombre Completo</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            required
                                            value={editingUsuario.nombre || ''}
                                            onChange={e => setEditingUsuario({ ...editingUsuario, nombre: e.target.value })}
                                            style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: 'var(--borde-radio)', fontSize: '1rem' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label className="fw-bold text-secondary" style={{ fontSize: '0.9rem' }}>Teléfono de Contacto</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            required
                                            value={editingUsuario.telefono || ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const cleaned = val.replace(/\D/g, '');
                                                let finalVal = val;
                                                if (cleaned.length === 9 || (cleaned.startsWith('56') && cleaned.length === 11)) {
                                                    const formatted = cleanAndFormatPhone(val);
                                                    if (formatted) {
                                                        finalVal = formatted;
                                                    }
                                                }
                                                setEditingUsuario({ ...editingUsuario, telefono: finalVal });
                                            }}
                                            onBlur={e => {
                                                const formatted = cleanAndFormatPhone(e.target.value);
                                                if (formatted) {
                                                    setEditingUsuario({ ...editingUsuario, telefono: formatted });
                                                }
                                            }}
                                            style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: 'var(--borde-radio)', fontSize: '1rem' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label className="fw-bold text-secondary" style={{ fontSize: '0.9rem' }}>Rol del Usuario</label>
                                        <select
                                            required
                                            className="form-control"
                                            value={editingUsuario.role}
                                            onChange={e => setEditingUsuario({ ...editingUsuario, role: e.target.value })}
                                            style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: 'var(--borde-radio)', background: 'white', fontSize: '1rem' }}
                                            disabled={editingUsuario._id === userId}
                                            title={editingUsuario._id === userId ? "No puedes cambiar tu propio rol" : ""}
                                        >
                                            <option value="user">Cliente</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #eee', borderBottomLeftRadius: 'var(--borde-radio)', borderBottomRightRadius: 'var(--borde-radio)' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditingUsuario(null)} style={{ padding: '0.6rem 1.2rem', border: '1px solid #ccc', borderRadius: '4px', background: '#e5e7eb', color: '#374151', cursor: 'pointer', fontWeight: 'bold' }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-agregar" disabled={enviando} style={{ margin: 0, padding: '0.6rem 1.2rem', fontWeight: 'bold' }}>
                                        {enviando ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
