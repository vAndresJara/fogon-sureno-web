import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ReservaPage = () => {
  const { token, nombreUsuario } = useAuth();
  const [formData, setFormData] = useState({
    fecha: '',
    personas: 2,
    zonaId: ''
  });
  
  const [zonasDisponibles, setZonasDisponibles] = useState([]);
  const [buscandoZonas, setBuscandoZonas] = useState(false);
  const [errorZonas, setErrorZonas] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [perfilCompleto, setPerfilCompleto] = useState(true);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  const hoy = new Date().toISOString().split('T')[0];

  // Verificar completitud del perfil al cargar la página
  useEffect(() => {
    if (!token) return;

    const checkPerfil = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/profile', {
          headers: { 'x-auth-token': token }
        });
        const data = await res.json();
        if (res.ok) {
          if (!data.nombre || !data.telefono) {
            setPerfilCompleto(false);
          }
        }
      } catch (err) {
        console.error('Error al comprobar completitud del perfil:', err);
      } finally {
        setCargandoPerfil(false);
      }
    };

    checkPerfil();
  }, [token]);

  // Buscar zonas disponibles cuando cambian la fecha o la cantidad de personas
  useEffect(() => {
    if (!formData.fecha || !formData.personas) {
      setZonasDisponibles([]);
      setFormData(prev => ({ ...prev, zonaId: '' }));
      return;
    }

    const fetchZonasDisponibles = async () => {
      setBuscandoZonas(true);
      setErrorZonas('');
      try {
        const res = await fetch(`http://localhost:5000/api/zonas/disponibles?fecha=${formData.fecha}&personas=${formData.personas}`, {
          headers: { 'x-auth-token': token }
        });
        const data = await res.json();
        if (res.ok) {
          setZonasDisponibles(data);
          if (data.length > 0) {
            // Seleccionar automáticamente la primera zona disponible
            setFormData(prev => ({ ...prev, zonaId: data[0]._id }));
          } else {
            setFormData(prev => ({ ...prev, zonaId: '' }));
          }
        } else {
          setErrorZonas(data.error || 'Error al buscar zonas.');
          setZonasDisponibles([]);
          setFormData(prev => ({ ...prev, zonaId: '' }));
        }
      } catch (err) {
        setErrorZonas('No se pudo conectar con el servidor.');
        setZonasDisponibles([]);
        setFormData(prev => ({ ...prev, zonaId: '' }));
      } finally {
        setBuscandoZonas(false);
      }
    };

    const timer = setTimeout(() => {
      fetchZonasDisponibles();
    }, 300); // Pequeño debounce para no sobrecargar el servidor al tipear personas

    return () => clearTimeout(timer);
  }, [formData.fecha, formData.personas, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.zonaId) {
      setMensaje('Error: Debe seleccionar una zona de mesa válida.');
      return;
    }
    setEnviando(true);
    setMensaje('');
    try {
      const response = await fetch('http://localhost:5000/api/reservas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setMensaje(`¡Reserva confirmada con éxito!`);
        setFormData({ fecha: '', personas: 2, zonaId: '' });
        setZonasDisponibles([]);
      } else {
        setMensaje('Error: ' + (data.error || (data.errors && data.errors[0]?.msg) || 'Error desconocido'));
      }
    } catch (error) {
      setMensaje('Error: No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="cart-page-container">
      <section id="reserva-detalle" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2>Reservar una Mesa</h2>

        {cargandoPerfil ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--neutro-gris)' }}>Comprobando perfil...</p>
          </div>
        ) : !perfilCompleto ? (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '1.5rem',
            borderRadius: 'var(--borde-radio)',
            marginBottom: '1.5rem',
            border: '1px solid #fecaca',
            textAlign: 'center'
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '1.2rem' }}>
              ⚠️ Debes completar tu Nombre y tu Teléfono de contacto en tu perfil antes de poder realizar una reserva.
            </p>
            <Link to="/perfil" className="btn-agregar" style={{ display: 'inline-block' }}>
              Completar mi Perfil
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--color-principal)', fontWeight: 'bold', textAlign: 'center', marginBottom: '1.5rem' }}>
              📝 Reservando a nombre de: <span style={{ textDecoration: 'underline' }}>{nombreUsuario}</span>
            </p>

            {mensaje && (
              <p className="mensaje-status" style={{ 
                backgroundColor: mensaje.startsWith('Error') ? '#fee2e2' : '#d1fae5',
                color: mensaje.startsWith('Error') ? '#991b1b' : '#065f46',
                textAlign: 'center'
              }}>
                {mensaje}
              </p>
            )}
            
            <form className="reserva-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Fecha de Reserva:</label>
                <input type="date" min={hoy} required value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
              </div>
              <div className="form-group">
                <label>N° Personas:</label>
                <input type="number" min="1" max="15" required value={formData.personas} onChange={e => setFormData({...formData, personas: parseInt(e.target.value) || 1})} />
              </div>
              
              <div className="form-group">
                <label>Zona disponible:</label>
                {buscandoZonas ? (
                  <div style={{ color: 'var(--neutro-gris)', fontSize: '0.9rem', fontStyle: 'italic' }}>Buscando zonas con stock...</div>
                ) : errorZonas ? (
                  <div style={{ color: 'red', fontSize: '0.9rem', fontWeight: 'bold' }}>{errorZonas}</div>
                ) : formData.fecha && zonasDisponibles.length === 0 ? (
                  <div style={{ color: '#991b1b', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '4px' }}>
                    ⚠️ No hay zonas con mesas libres para esta fecha o cantidad de personas.
                  </div>
                ) : !formData.fecha ? (
                  <div style={{ color: 'var(--neutro-gris)', fontSize: '0.9rem' }}>Selecciona una fecha y N° de personas para ver zonas disponibles.</div>
                ) : (
                  <select
                    required
                    className="form-control"
                    value={formData.zonaId}
                    onChange={e => setFormData({ ...formData, zonaId: e.target.value })}
                    style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: 'var(--borde-radio)', background: 'white' }}
                  >
                    {zonasDisponibles.map(z => (
                      <option key={z._id} value={z._id}>
                        {z.nombre} (Capacidad: {z.capacidadMesa} personas/mesa - {z.mesasLibres} libres)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button 
                type="submit" 
                className="btn-agregar" 
                disabled={enviando || buscandoZonas || !formData.zonaId}
                style={{ opacity: (enviando || buscandoZonas || !formData.zonaId) ? 0.6 : 1, cursor: (enviando || buscandoZonas || !formData.zonaId) ? 'not-allowed' : 'pointer', marginTop: '1rem' }}
              >
                {enviando ? 'Procesando...' : 'Confirmar Reserva'}
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/" className="btn-agregar">Volver al Inicio</Link>
        </div>
      </section>
    </main>
  );
};