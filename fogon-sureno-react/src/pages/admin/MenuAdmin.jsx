import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/menu';

export const MenuAdmin = () => {
    const { token, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'agregar';

    // Estados
    const [platos, setPlatos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [subiendoImg, setSubiendoImg] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Paginación y Búsqueda
    const [busqueda, setBusqueda] = useState('');
    const [limite, setLimite] = useState(15);
    const [currentPage, setCurrentPage] = useState(1);

    // Estado para el plato nuevo (Agregar)
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: 0,
        imagen: '',
        categoria: '',
        disponible: true
    });

    // Estado para el plato en edición (Modal)
    const [editingPlato, setEditingPlato] = useState(null);

    const categorias = ['Carnes', 'Pescados y Mariscos', 'Postres', 'Bebidas', 'Ensaladas', 'Sopas', 'Aperitivos', 'Tablas'];

    // Redirección si no está autenticado o no es administrador
    useEffect(() => {
        if (!token || !isAdmin) {
            navigate('/');
        }
    }, [token, isAdmin, navigate]);

    // Función para obtener la lista de platos desde el servidor (enviando token para incluir los ocultos)
    const fetchPlatos = useCallback(async (signal) => {
        setLoading(true);
        setError('');
        try {
            const config = {
                headers: { 'x-auth-token': token },
                signal
            };
            const res = await axios.get(API_URL, config);
            setPlatos(res.data);
        } catch (err) {
            if (axios.isCancel(err)) return;
            setError('No se pudo cargar el menú desde el servidor.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Cargar platos cuando cambia la pestaña a editar o eliminar
    useEffect(() => {
        const controller = new AbortController();
        if (activeTab === 'editar' || activeTab === 'eliminar') {
            fetchPlatos(controller.signal);
        }
        return () => {
            controller.abort();
        };
    }, [activeTab, fetchPlatos]);

    // Resetear filtros al cambiar de pestaña
    useEffect(() => {
        setBusqueda('');
        setCurrentPage(1);
    }, [activeTab]);

    // Lógica de filtrado de platos por búsqueda
    const platosFiltrados = useMemo(() => {
        return platos.filter(plato => 
            plato.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            plato.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
            plato.descripcion.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [platos, busqueda]);

    // Calcular total de páginas
    const totalPages = useMemo(() => {
        return Math.ceil(platosFiltrados.length / limite) || 1;
    }, [platosFiltrados, limite]);

    // Obtener los platos correspondientes a la página actual
    const platosPaginados = useMemo(() => {
        const startIndex = (currentPage - 1) * limite;
        return platosFiltrados.slice(startIndex, startIndex + limite);
    }, [platosFiltrados, currentPage, limite]);

    // Lógica para cargar y subir imágenes PNG
    const handleImageUpload = async (e, isEditing = false) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar formato PNG en el navegador
        if (file.type !== 'image/png') {
            alert('Solo se permiten imágenes en formato PNG (.png).');
            e.target.value = ''; // Limpiar el input
            return;
        }

        setSubiendoImg(true);
        const uploadData = new FormData();
        uploadData.append('imagen', file);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-auth-token': token
                }
            };
            const res = await axios.post('http://localhost:5000/api/upload', uploadData, config);
            const returnedUrl = res.data.imageUrl;

            if (isEditing) {
                setEditingPlato(prev => ({ ...prev, imagen: returnedUrl }));
            } else {
                setFormData(prev => ({ ...prev, imagen: returnedUrl }));
            }
        } catch (err) {
            const errorText = err.response?.data?.error || err.message || 'Error al subir la imagen';
            alert(`No se pudo subir la imagen. Detalle: ${errorText}`);
            e.target.value = ''; // Limpiar el input
        } finally {
            setSubiendoImg(false);
        }
    };

    // Manejar envío de nuevo plato (Agregar)
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!formData.imagen) {
            alert('Por favor, selecciona y sube una imagen PNG para el plato.');
            return;
        }
        setEnviando(true);
        setMensaje({ texto: '', tipo: '' });
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            await axios.post(API_URL, formData, config);
            setMensaje({ texto: 'Plato agregado al menú correctamente.', tipo: 'success' });
            setFormData({
                nombre: '',
                descripcion: '',
                precio: 0,
                imagen: '',
                categoria: '',
                disponible: true
            });
            // Limpiar input file
            const fileInput = document.getElementById('imagen-file-input');
            if (fileInput) fileInput.value = '';
        } catch (err) {
            const errorText = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Error al agregar el item al menú';
            setMensaje({ texto: errorText, tipo: 'error' });
            console.error(err);
        } finally {
            setEnviando(false);
        }
    };

    // Alternar disponibilidad rápidamente (Ocultar/Mostrar)
    const handleToggleDisponible = async (plato) => {
        const nuevoEstado = plato.disponible === false ? true : false;
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const res = await axios.put(`${API_URL}/${plato._id}`, { ...plato, disponible: nuevoEstado }, config);
            
            // Actualizar localmente
            setPlatos(prev => prev.map(p => p._id === plato._id ? res.data.plato : p));
            setMensaje({ 
                texto: `Plato "${plato.nombre}" ${nuevoEstado ? 'marcado como visible' : 'oculto de la carta'} correctamente.`, 
                tipo: 'success' 
            });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        } catch (err) {
            alert('No se pudo modificar el estado de disponibilidad del plato.');
            console.error(err);
        }
    };

    // Manejar actualización de plato (Editar)
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!editingPlato) return;
        setEnviando(true);
        setMensaje({ texto: '', tipo: '' });
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const res = await axios.put(`${API_URL}/${editingPlato._id}`, editingPlato, config);
            
            setMensaje({ texto: 'Plato actualizado correctamente.', tipo: 'success' });
            setPlatos(prev => prev.map(p => p._id === editingPlato._id ? res.data.plato : p));
            setEditingPlato(null); // Cerrar modal
        } catch (err) {
            const errorText = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Error al actualizar el plato';
            setMensaje({ texto: errorText, tipo: 'error' });
            console.error(err);
        } finally {
            setEnviando(false);
        }
    };

    // Manejar eliminación de plato
    const handleEliminarPlato = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este plato permanentemente de la carta?')) return;
        setMensaje({ texto: '', tipo: '' });
        try {
            const config = { headers: { 'x-auth-token': token } };
            await axios.delete(`${API_URL}/${id}`, config);
            setMensaje({ texto: 'Plato eliminado correctamente.', tipo: 'success' });
            setPlatos(prev => prev.filter(p => p._id !== id));
        } catch (err) {
            alert(err.response?.data?.error || 'No se pudo eliminar el plato del menú.');
            console.error(err);
        }
    };

    if (!token || !isAdmin) {
        return (
            <div className="container mt-5 text-center">
                <div className="alert alert-danger" role="alert">
                    Acceso denegado. Por favor, inicia sesión como administrador.
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
                    <h3 className="mb-0 fs-4">Control y Administración de Menú</h3>
                    {activeTab !== 'agregar' && (
                        <button onClick={() => fetchPlatos()} className="btn btn-sm btn-outline-light" disabled={loading}>
                            🔄 Refrescar
                        </button>
                    )}
                </div>
                
                <div className="card-body">
                    {/* Mensaje de estado */}
                    {mensaje.texto && (
                        <div className={`alert alert-dismissible fade show ${mensaje.tipo === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                            {mensaje.tipo === 'success' ? '✓' : '⚠️'} {mensaje.texto}
                            <button type="button" className="btn-close" onClick={() => setMensaje({ texto: '', tipo: '' })} aria-label="Close"></button>
                        </div>
                    )}

                    {/* Navegación por Pestañas de Bootstrap */}
                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button 
                                className={`nav-link fs-6 fw-semibold py-2 px-3 ${activeTab === 'agregar' ? 'active' : ''}`}
                                onClick={() => setSearchParams({ tab: 'agregar' })}
                            >
                                ➕ Agregar ítem
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link fs-6 fw-semibold py-2 px-3 ${activeTab === 'editar' ? 'active' : ''}`}
                                onClick={() => setSearchParams({ tab: 'editar' })}
                            >
                                ✏️ Editar plato
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link fs-6 fw-semibold py-2 px-3 ${activeTab === 'eliminar' ? 'active' : ''}`}
                                onClick={() => setSearchParams({ tab: 'eliminar' })}
                            >
                                ❌ Eliminar plato
                            </button>
                        </li>
                    </ul>

                    {/* PESTAÑA: AGREGAR */}
                    {activeTab === 'agregar' && (
                        <form onSubmit={handleAddSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-secondary">Nombre del Plato</label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-lg border-secondary-subtle" 
                                        required 
                                        value={formData.nombre} 
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-secondary">Categoría</label>
                                    <select 
                                        className="form-select form-select-lg border-secondary-subtle" 
                                        required 
                                        value={formData.categoria} 
                                        onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                    >
                                        <option value="">Selecciona una categoría</option>
                                        {categorias.map(cat => (
                                            <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-secondary">Precio ($)</label>
                                    <input 
                                        type="number" 
                                        className="form-control form-control-lg border-secondary-subtle" 
                                        required 
                                        min="0"
                                        value={formData.precio} 
                                        onChange={e => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })} 
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-secondary">Imagen (.png)</label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input 
                                            id="imagen-file-input"
                                            type="file" 
                                            className="form-control form-control-lg border-secondary-subtle" 
                                            required 
                                            accept="image/png"
                                            onChange={(e) => handleImageUpload(e, false)}
                                            disabled={subiendoImg}
                                        />
                                        {subiendoImg && (
                                            <div className="spinner-border text-primary" role="status" style={{ width: '1.5rem', height: '1.5rem' }}></div>
                                        )}
                                    </div>
                                    {formData.imagen && (
                                        <div className="mt-3">
                                            <span className="d-block text-muted small mb-1">Vista Previa:</span>
                                            <img 
                                                src={formData.imagen} 
                                                alt="Previsualización" 
                                                className="img-thumbnail rounded shadow-sm"
                                                style={{ maxHeight: '120px', maxWidth: '200px', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold text-secondary">Descripción</label>
                                    <textarea 
                                        className="form-control border-secondary-subtle" 
                                        rows="3"
                                        required 
                                        value={formData.descripcion} 
                                        onChange={e => setFormData({ ...formData, disponible: true, descripcion: e.target.value })} 
                                    />
                                </div>
                                <div className="col-12 mt-4">
                                    <button type="submit" className="btn btn-success btn-lg w-100 fs-5" disabled={enviando || subiendoImg}>
                                        {enviando ? 'Guardando Plato...' : 'Guardar y Publicar Plato'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* PESTAÑA: EDITAR */}
                    {activeTab === 'editar' && (
                        <div>
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 text-muted fw-semibold">Cargando platos de la carta...</p>
                                </div>
                            ) : error ? (
                                <div className="alert alert-warning text-center" role="alert">{error}</div>
                            ) : platos.length === 0 ? (
                                <p className="text-center py-4 text-muted">No hay platos registrados en el menú.</p>
                            ) : (
                                <div>
                                    {/* Panel de Búsqueda y Paginación */}
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3 p-2 bg-light rounded border border-light-subtle">
                                        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
                                            <span className="text-secondary fw-semibold text-nowrap">🔍 Buscar:</span>
                                            <input 
                                                type="text" 
                                                className="form-control form-control-sm border-secondary-subtle" 
                                                placeholder="Buscar por nombre, categoría, descripción..." 
                                                value={busqueda}
                                                onChange={(e) => {
                                                    setBusqueda(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="text-secondary fw-semibold">Mostrar:</span>
                                            <select 
                                                className="form-select form-select-sm border-secondary-subtle" 
                                                style={{ width: '80px' }}
                                                value={limite}
                                                onChange={(e) => {
                                                    setLimite(parseInt(e.target.value) || 15);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                <option value="15">15</option>
                                                <option value="25">25</option>
                                                <option value="50">50</option>
                                            </select>
                                            <span className="text-secondary">platos</span>
                                        </div>
                                    </div>

                                    {/* Tabla */}
                                    {platosFiltrados.length === 0 ? (
                                        <div className="alert alert-info text-center mt-3">No hay platos que coincidan con la búsqueda "{busqueda}".</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-striped table-hover align-middle">
                                                <thead className="table-dark">
                                                    <tr>
                                                        <th style={{ width: '80px' }}>Imagen</th>
                                                        <th>Nombre</th>
                                                        <th>Categoría</th>
                                                        <th>Precio</th>
                                                        <th className="text-center" style={{ width: '220px' }}>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {platosPaginados.map(plato => (
                                                        <tr key={plato._id} style={{ opacity: plato.disponible === false ? 0.6 : 1 }}>
                                                            <td>
                                                                <img 
                                                                    src={plato.imagen.startsWith('http') ? plato.imagen : `http://localhost:5000/${plato.imagen}`} 
                                                                    alt={plato.nombre} 
                                                                    className="rounded shadow-sm"
                                                                    style={{ width: '55px', height: '55px', objectFit: 'cover', border: '1px solid #ddd' }}
                                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/55?text=Plato'; }}
                                                                />
                                                            </td>
                                                            <td className="fw-semibold">
                                                                {plato.nombre} 
                                                                {plato.disponible === false && <span className="badge bg-secondary ms-2">Oculto</span>}
                                                            </td>
                                                            <td className="text-capitalize">{plato.categoria}</td>
                                                            <td>${plato.precio.toLocaleString('es-CL')}</td>
                                                            <td className="text-center">
                                                                <div className="d-flex gap-2 justify-content-center">
                                                                    <button 
                                                                        onClick={() => setEditingPlato({ ...plato })} 
                                                                        className="btn btn-sm btn-primary fw-bold"
                                                                    >
                                                                        Editar
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleToggleDisponible(plato)} 
                                                                        className={`btn btn-sm fw-bold ${plato.disponible === false ? 'btn-success' : 'btn-warning'}`}
                                                                        title={plato.disponible === false ? 'Hacer visible en la carta' : 'Ocultar temporalmente de la carta'}
                                                                    >
                                                                        {plato.disponible === false ? 'Mostrar' : 'Ocultar'}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Paginación */}
                                    {totalPages > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3 p-2 bg-light rounded border border-light-subtle flex-wrap gap-2">
                                            <div className="text-muted small">
                                                Mostrando platos {Math.min(platosFiltrados.length, (currentPage - 1) * limite + 1)} al {Math.min(platosFiltrados.length, currentPage * limite)} de {platosFiltrados.length}
                                            </div>
                                            <nav aria-label="Paginacion de platos">
                                                <ul className="pagination pagination-sm mb-0">
                                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                        <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                                                            Anterior
                                                        </button>
                                                    </li>
                                                    {[...Array(totalPages)].map((_, index) => (
                                                        <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                                            <button className="page-link" onClick={() => setCurrentPage(index + 1)}>
                                                                {index + 1}
                                                            </button>
                                                        </li>
                                                    ))}
                                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                        <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                                                            Siguiente
                                                        </button>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PESTAÑA: ELIMINAR */}
                    {activeTab === 'eliminar' && (
                        <div>
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-danger" role="status"></div>
                                    <p className="mt-2 text-muted fw-semibold">Cargando platos de la carta...</p>
                                </div>
                            ) : error ? (
                                <div className="alert alert-warning text-center" role="alert">{error}</div>
                            ) : platos.length === 0 ? (
                                <p className="text-center py-4 text-muted">No hay platos registrados en el menú.</p>
                            ) : (
                                <div>
                                    {/* Panel de Búsqueda y Paginación */}
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3 p-2 bg-light rounded border border-light-subtle">
                                        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
                                            <span className="text-secondary fw-semibold text-nowrap">🔍 Buscar:</span>
                                            <input 
                                                type="text" 
                                                className="form-control form-control-sm border-secondary-subtle" 
                                                placeholder="Buscar por nombre, categoría, descripción..." 
                                                value={busqueda}
                                                onChange={(e) => {
                                                    setBusqueda(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="text-secondary fw-semibold">Mostrar:</span>
                                            <select 
                                                className="form-select form-select-sm border-secondary-subtle" 
                                                style={{ width: '80px' }}
                                                value={limite}
                                                onChange={(e) => {
                                                    setLimite(parseInt(e.target.value) || 15);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                <option value="15">15</option>
                                                <option value="25">25</option>
                                                <option value="50">50</option>
                                            </select>
                                            <span className="text-secondary">platos</span>
                                        </div>
                                    </div>

                                    {/* Tabla */}
                                    {platosFiltrados.length === 0 ? (
                                        <div className="alert alert-info text-center mt-3">No hay platos que coincidan con la búsqueda "{busqueda}".</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-striped table-hover align-middle">
                                                <thead className="table-dark">
                                                    <tr>
                                                        <th style={{ width: '80px' }}>Imagen</th>
                                                        <th>Nombre</th>
                                                        <th>Categoría</th>
                                                        <th>Precio</th>
                                                        <th className="text-center">Acción</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {platosPaginados.map(plato => (
                                                        <tr key={plato._id} style={{ opacity: plato.disponible === false ? 0.6 : 1 }}>
                                                            <td>
                                                                <img 
                                                                    src={plato.imagen.startsWith('http') ? plato.imagen : `http://localhost:5000/${plato.imagen}`} 
                                                                    alt={plato.nombre} 
                                                                    className="rounded shadow-sm"
                                                                    style={{ width: '55px', height: '55px', objectFit: 'cover', border: '1px solid #ddd' }}
                                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/55?text=Plato'; }}
                                                                />
                                                            </td>
                                                            <td className="fw-semibold">
                                                                {plato.nombre}
                                                                {plato.disponible === false && <span className="badge bg-secondary ms-2">Oculto</span>}
                                                            </td>
                                                            <td className="text-capitalize">{plato.categoria}</td>
                                                            <td>${plato.precio.toLocaleString('es-CL')}</td>
                                                            <td className="text-center">
                                                                <button 
                                                                    onClick={() => handleEliminarPlato(plato._id)} 
                                                                    className="btn btn-sm btn-danger px-3 fw-bold"
                                                                >
                                                                    Eliminar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Paginación */}
                                    {totalPages > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3 p-2 bg-light rounded border border-light-subtle flex-wrap gap-2">
                                            <div className="text-muted small">
                                                Mostrando platos {Math.min(platosFiltrados.length, (currentPage - 1) * limite + 1)} al {Math.min(platosFiltrados.length, currentPage * limite)} de {platosFiltrados.length}
                                            </div>
                                            <nav aria-label="Paginacion de platos">
                                                <ul className="pagination pagination-sm mb-0">
                                                    <li className="page-item">
                                                        <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                                                            Anterior
                                                        </button>
                                                    </li>
                                                    {[...Array(totalPages)].map((_, index) => (
                                                        <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                                            <button className="page-link" onClick={() => setCurrentPage(index + 1)}>
                                                                {index + 1}
                                                            </button>
                                                        </li>
                                                    ))}
                                                    <li className="page-item">
                                                        <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                                                            Siguiente
                                                        </button>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE EDICIÓN BOOTSTRAP */}
            {editingPlato && (
                <div>
                    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content">
                                <div className="modal-header bg-dark text-white">
                                    <h5 className="modal-title">Editar Plato: {editingPlato.nombre}</h5>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white" 
                                        onClick={() => setEditingPlato(null)} 
                                        aria-label="Close"
                                    ></button>
                                </div>
                                <form onSubmit={handleUpdateSubmit}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            {/* Vista Previa de Imagen Actual / Nueva */}
                                            <div className="col-12 text-center mb-2">
                                                <span className="d-block text-muted small mb-1">Imagen del Plato:</span>
                                                <img 
                                                    src={editingPlato.imagen.startsWith('http') ? editingPlato.imagen : `http://localhost:5000/${editingPlato.imagen}`} 
                                                    alt="Vista previa" 
                                                    className="img-thumbnail rounded"
                                                    style={{ maxHeight: '140px', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/140?text=Plato'; }}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-bold text-secondary">Nombre del Plato</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control border-secondary-subtle" 
                                                    required 
                                                    value={editingPlato.nombre} 
                                                    onChange={e => setEditingPlato({ ...editingPlato, nombre: e.target.value })} 
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold text-secondary">Categoría</label>
                                                <select 
                                                    className="form-select border-secondary-subtle" 
                                                    required 
                                                    value={editingPlato.categoria} 
                                                    onChange={e => setEditingPlato({ ...editingPlato, categoria: e.target.value })}
                                                >
                                                    <option value="">Selecciona una categoría</option>
                                                    {categorias.map(cat => (
                                                        <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold text-secondary">Precio ($)</label>
                                                <input 
                                                    type="number" 
                                                    className="form-control border-secondary-subtle" 
                                                    required 
                                                    min="0"
                                                    value={editingPlato.precio} 
                                                    onChange={e => setEditingPlato({ ...editingPlato, precio: parseFloat(e.target.value) || 0 })} 
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold text-secondary">Actualizar Imagen (.png)</label>
                                                <div className="d-flex align-items-center gap-2">
                                                    <input 
                                                        type="file" 
                                                        className="form-control border-secondary-subtle" 
                                                        accept="image/png" 
                                                        onChange={(e) => handleImageUpload(e, true)} 
                                                        disabled={subiendoImg}
                                                    />
                                                    {subiendoImg && (
                                                        <div className="spinner-border text-primary" role="status" style={{ width: '1.5rem', height: '1.5rem' }}></div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-secondary">Descripción</label>
                                                <textarea 
                                                    className="form-control border-secondary-subtle" 
                                                    rows="3"
                                                    required 
                                                    value={editingPlato.descripcion} 
                                                    onChange={e => setEditingPlato({ ...editingPlato, descripcion: e.target.value })} 
                                                />
                                            </div>
                                            
                                            {/* Control de Disponibilidad en el modal */}
                                            <div className="col-12 mt-3">
                                                <div className="form-check form-switch">
                                                    <input 
                                                        type="checkbox" 
                                                        className="form-check-input border-secondary-subtle" 
                                                        id="disponible-checkbox"
                                                        style={{ cursor: 'pointer' }}
                                                        checked={editingPlato.disponible !== false}
                                                        onChange={e => setEditingPlato({ ...editingPlato, disponible: e.target.checked })} 
                                                    />
                                                    <label className="form-check-label fw-bold text-secondary" htmlFor="disponible-checkbox" style={{ cursor: 'pointer' }}>
                                                        Disponible para la venta (Si se desactiva, se ocultará de la vista pública de clientes)
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-secondary" onClick={() => setEditingPlato(null)}>
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={enviando || subiendoImg}>
                                            {enviando ? 'Guardando Cambios...' : 'Guardar Cambios'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuAdmin;
