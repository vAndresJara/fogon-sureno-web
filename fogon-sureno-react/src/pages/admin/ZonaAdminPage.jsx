import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/zonas`;

export const ZonaAdminPage = () => {
    const { token, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    // Estados
    const [zonas, setZonas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [enviando, setEnviando] = useState(false);

    // Formulario de Agregar
    const [formData, setFormData] = useState({
        nombre: '',
        mesasDisponibles: 1,
        capacidadMesa: 2,
        disponible: true
    });

    // Formulario de Edición (Modal)
    const [editingZona, setEditingZona] = useState(null);

    // Redirección si no está autenticado o no es administrador
    useEffect(() => {
        if (!token || !isAdmin) {
            navigate('/');
        }
    }, [token, isAdmin, navigate]);

    // Obtener las zonas
    const fetchZonas = useCallback(async (signal) => {
        setLoading(true);
        setError('');
        try {
            const config = {
                headers: { 'x-auth-token': token },
                signal
            };
            const res = await axios.get(API_URL, config);
            setZonas(res.data);
        } catch (err) {
            if (axios.isCancel(err)) return;
            setError('No se pudieron cargar las zonas. Es posible que tu sesión haya expirado.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const controller = new AbortController();
        fetchZonas(controller.signal);
        return () => {
            controller.abort();
        };
    }, [fetchZonas]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Agregar nueva zona
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setMensaje({ texto: '', tipo: '' });
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const res = await axios.post(API_URL, formData, config);
            setZonas(prev => [...prev, res.data.zona].sort((a, b) => a.capacidadMesa - b.capacidadMesa));
            setMensaje({ texto: 'Zona creada exitosamente.', tipo: 'success' });
            setFormData({
                nombre: '',
                mesasDisponibles: 1,
                capacidadMesa: 2,
                disponible: true
            });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        } catch (err) {
            const errorText = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Error al crear la zona';
            setMensaje({ texto: errorText, tipo: 'error' });
        } finally {
            setEnviando(false);
        }
    };

    // Editar zona
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!editingZona) return;
        setEnviando(true);
        setMensaje({ texto: '', tipo: '' });
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const res = await axios.put(`${API_URL}/${editingZona._id}`, editingZona, config);

            setZonas(prev => prev.map(z => z._id === editingZona._id ? res.data.zona : z).sort((a, b) => a.capacidadMesa - b.capacidadMesa));
            setMensaje({ texto: 'Zona actualizada correctamente.', tipo: 'success' });
            setEditingZona(null);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        } catch (err) {
            const errorText = err.response?.data?.error || 'Error al actualizar la zona';
            alert(`No se pudo actualizar la zona. Detalle: ${errorText}`);
        } finally {
            setEnviando(false);
        }
    };

    // Alternar disponibilidad (Ocultar/Mostrar)
    const handleToggleDisponible = async (zona) => {
        const nuevoEstado = zona.disponible === false ? true : false;
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const res = await axios.put(`${API_URL}/${zona._id}`, { ...zona, disponible: nuevoEstado }, config);
            setZonas(prev => prev.map(z => z._id === zona._id ? res.data.zona : z));
            setMensaje({ texto: `Zona "${zona.nombre}" ${nuevoEstado ? 'visible' : 'oculta'} correctamente.`, tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        } catch (err) {
            alert('No se pudo cambiar la disponibilidad de la zona.');
            console.error(err);
        }
    };

    // Eliminar zona
    const handleEliminarZona = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta zona? No podrás hacerlo si hay reservas registradas en ella.')) return;
        setMensaje({ texto: '', tipo: '' });
        try {
            const config = { headers: { 'x-auth-token': token } };
            await axios.delete(`${API_URL}/${id}`, config);
            setZonas(prev => prev.filter(z => z._id !== id));
            setMensaje({ texto: 'Zona eliminada correctamente.', tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        } catch (err) {
            const errorText = err.response?.data?.error || 'No se pudo eliminar la zona.';
            alert(`Error: ${errorText}`);
        }
    };

    return (
        <div className="container mt-5">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <h2>Panel de Administración de Zonas</h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => fetchZonas()} className="btn btn-success" disabled={loading}>
                        🔄 Refrescar
                    </button>
                    <button onClick={handleLogout} className="btn-eliminar">Cerrar Sesión</button>
                </div>
            </div>

            {mensaje.texto && (
                <div className={`alert alert-dismissible fade show ${mensaje.tipo === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                    {mensaje.tipo === 'success' ? '✓' : '⚠️'} {mensaje.texto}
                    <button type="button" className="btn-close" onClick={() => setMensaje({ texto: '', tipo: '' })} aria-label="Close"></button>
                </div>
            )}

            <div className="row g-4">
                {/* Formulario Agregar */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0" style={{ borderTop: '4px solid var(--color-principal)' }}>
                        <div className="card-header bg-dark text-white fw-bold py-3">
                            ➕ Crear Nueva Zona
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleAddSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-secondary">Nombre de la Zona</label>
                                    <input
                                        type="text"
                                        className="form-control border-secondary-subtle"
                                        required
                                        placeholder="Ej: Terraza, VIP, Salón"
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-secondary">Mesas Disponibles (Stock)</label>
                                    <input
                                        type="number"
                                        className="form-control border-secondary-subtle"
                                        required
                                        min="1"
                                        value={formData.mesasDisponibles}
                                        onChange={e => setFormData({ ...formData, mesasDisponibles: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-secondary">Capacidad de Personas por Mesa</label>
                                    <input
                                        type="number"
                                        className="form-control border-secondary-subtle"
                                        required
                                        min="1"
                                        value={formData.capacidadMesa}
                                        onChange={e => setFormData({ ...formData, capacidadMesa: parseInt(e.target.value) || 2 })}
                                    />
                                </div>
                                <button type="submit" className="btn btn-success w-100 mt-2" disabled={enviando}>
                                    {enviando ? 'Guardando...' : 'Crear Zona'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Tabla de Zonas */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-dark text-white fw-bold py-3">
                            📋 Zonas y Stock de Mesas
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 text-muted fw-semibold">Cargando sectores de mesas...</p>
                                </div>
                            ) : error ? (
                                <div className="alert alert-warning text-center">{error}</div>
                            ) : zonas.length === 0 ? (
                                <p className="text-center text-muted py-4">No hay zonas creadas en el sistema.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-striped table-hover align-middle">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>Nombre</th>
                                                <th className="text-center">Mesas (Stock)</th>
                                                <th className="text-center">Capacidad de Mesa</th>
                                                <th className="text-center">Estado</th>
                                                <th className="text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {zonas.map(zona => (
                                                <tr key={zona._id} style={{ opacity: zona.disponible === false ? 0.6 : 1 }}>
                                                    <td className="fw-semibold">
                                                        {zona.nombre}
                                                        {zona.disponible === false && <span className="badge bg-secondary ms-2">Oculto</span>}
                                                    </td>
                                                    <td className="text-center">{zona.mesasDisponibles}</td>
                                                    <td className="text-center">{zona.capacidadMesa} {zona.capacidadMesa === 1 ? 'persona' : 'personas'}</td>
                                                    <td className="text-center">
                                                        <span className={`badge ${zona.disponible === false ? 'bg-danger' : 'bg-success'}`}>
                                                            {zona.disponible === false ? 'Inactivo' : 'Activo'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex gap-2 justify-content-center">
                                                            <button
                                                                onClick={() => setEditingZona({ ...zona })}
                                                                className="btn btn-sm btn-primary fw-bold"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleDisponible(zona)}
                                                                className={`btn btn-sm fw-bold ${zona.disponible === false ? 'btn-success' : 'btn-warning'}`}
                                                            >
                                                                {zona.disponible === false ? 'Mostrar' : 'Ocultar'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleEliminarZona(zona._id)}
                                                                className="btn btn-sm btn-danger fw-bold"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de edición */}
            {editingZona && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-dark text-white">
                                <h5 className="modal-title">Editar Zona: {editingZona.nombre}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingZona(null)}></button>
                            </div>
                            <form onSubmit={handleUpdateSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary">Nombre de la Zona</label>
                                        <input
                                            type="text"
                                            className="form-control border-secondary-subtle"
                                            required
                                            value={editingZona.nombre}
                                            onChange={e => setEditingZona({ ...editingZona, nombre: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary">Mesas Disponibles (Stock)</label>
                                        <input
                                            type="number"
                                            className="form-control border-secondary-subtle"
                                            required
                                            min="1"
                                            value={editingZona.mesasDisponibles}
                                            onChange={e => setEditingZona({ ...editingZona, mesasDisponibles: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary">Capacidad de Personas por Mesa</label>
                                        <input
                                            type="number"
                                            className="form-control border-secondary-subtle"
                                            required
                                            min="1"
                                            value={editingZona.capacidadMesa}
                                            onChange={e => setEditingZona({ ...editingZona, capacidadMesa: parseInt(e.target.value) || 2 })}
                                        />
                                    </div>
                                    <div className="mb-3 form-check form-switch">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="zona-disponible"
                                            checked={editingZona.disponible !== false}
                                            onChange={e => setEditingZona({ ...editingZona, disponible: e.target.checked })}
                                        />
                                        <label className="form-check-label fw-bold text-secondary" htmlFor="zona-disponible">
                                            Activa para Reservas (Pública)
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditingZona(null)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={enviando}>
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
