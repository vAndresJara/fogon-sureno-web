import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PlatoCard } from './PlatoCard';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartPage } from './CartPage';
import { ReservaPage } from './ReservaPage';
import './css/variables.css';
import './css/styles.css';

function App() {
  // Estados
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [platos, setPlatos] = useState([]);
  const [platoSeleccionado, setPlatoSeleccionado] = useState(null);
  const [favoritos, setFavoritos] = useState(() => {
    const save = localStorage.getItem('favoritos-fogon');
    return save ? JSON.parse(save) : [];
  });
  const [cart, setCart] = useState(() => {
    const save = localStorage.getItem('cart-fogon');
    return save ? JSON.parse(save) : [];
  });

  // Carga asíncrona del menú
  useEffect(() => {
    const cargarMenu = async () => {
      try {
        const response = await fetch('/menu.json');
        const data = await response.json();
        setPlatos(data);
      } catch (error) {
        console.error("Error al obtener el menú:", error);
      }
    };

    cargarMenu();
  }, []);

  // Persistencia de favoritos
  useEffect(() => {
    localStorage.setItem('favoritos-fogon', JSON.stringify(favoritos));
  }, [favoritos]);

  // Persistencia de carrito
  useEffect(() => {
    localStorage.setItem('cart-fogon', JSON.stringify(cart));
  }, [cart]);

  // Lógica de filtrado (optimizada con useMemo)
  const platosFiltrados = useMemo(() => {
    return platos.filter(plato => {
      const coincideTexto = plato.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                            plato.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      
      let coincideCategoria = false;
      if (categoria === "todos") coincideCategoria = true;
      else if (categoria === "favoritos") coincideCategoria = favoritos.includes(plato.id);
      else coincideCategoria = plato.categoria.includes(categoria);

      return coincideTexto && coincideCategoria;
    });
  }, [platos, busqueda, categoria, favoritos]);

  const toggleFavorito = (id) => {
    setFavoritos(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const addToCart = (plato) => {
    setCart(prev => {
      const itemExistente = prev.find(item => item.id === plato.id);
      if (itemExistente) {
        return prev.map(item =>
          item.id === plato.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...plato, cantidad: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item =>
      item.id === id 
        ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } 
        : item
    ));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Calculamos el total de items para mostrar en el Header
  const cartCount = cart.reduce((total, item) => total + item.cantidad, 0);

  return (
    <Router>
      <div className="App">
        <Header cartCount={cartCount} />

        <Routes>
          <Route path="/" element={
            <main>
              <section id="inicio">
                <h2>Bienvenidos al Auténtico Sabor del Sur</h2>
                <p>Disfruta de la mejor gastronomía tradicional, preparada con pasión y al calor del fogón.</p>
                <div className="hero-buttons">
                </div>
              </section>

              <section id="nosotros">
                <h2>Nuestra Historia</h2>
                <p>
                  Nacidos en el corazón del sur, nuestra cocina rinde homenaje a las tradiciones de nuestra tierra. 
                  Desde el calor del fogón de leña hasta la selección de los ingredientes más frescos de la zona, 
                  buscamos rescatar los sabores que han unido a las familias por generaciones.
                </p>
                <p>Cada receta es un legado de identidad y amor por el arte culinario rústico, traído con pasión directamente a tu mesa.</p>
              </section>
            
              <section id="menu">
                <h2>Especialidades de la Casa</h2>
                <div className="busqueda-container">
                  <input 
                    id="busqueda-input"
                    type="text" 
                    placeholder="Busca tu plato favorito..." 
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>

                <div className="filtros-container">
                  {['todos', 'tablas', 'carnes', 'mariscos', 'postres', 'bebidas', 'favoritos'].map(cat => (
                    <button 
                      key={cat}
                      className={`btn-filtro ${categoria === cat ? 'activo' : ''}`}
                      onClick={() => setCategoria(cat)}
                    >
                      {cat === 'favoritos' ? '❤️ Mis Favoritos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="plato-container">
                  {platosFiltrados.map(plato => (
                    <PlatoCard 
                      key={plato.id} 
                      plato={plato} 
                      esFavorito={favoritos.includes(plato.id)} 
                      toggleFavorito={toggleFavorito}
                      addToCart={addToCart}
                      onVerDetalle={() => setPlatoSeleccionado(plato)}
                    />
                  ))}
                </div>
              </section>

              <section id="contacto">
          <h2>Encuéntranos / Reservas</h2>
          <div className="contacto-flex">
            <article className="info-contacto">
              <h3>Horarios de Atención</h3>
              <p>Lunes a Sábado: 12:30 a 23:00 hrs.<br/>Domingos: 12:30 a 17:00 hrs.</p>
            </article>

            <article className="info-contacto">
              <h3>Ubicación y Teléfono</h3>
              <p>Dirección: Av. Principal #123, Región Metropolitana, Chile.</p>
              <p>Teléfono / WhatsApp: +56 9 1234 5678</p>
            </article>
          </div>
        </section>
            </main>
          } />

          <Route path="/carrito" element={
            <CartPage 
              cart={cart} 
              removeFromCart={removeFromCart} 
              updateQuantity={updateQuantity} 
            />
          } />

          <Route path="/reservas" element={<ReservaPage />} />
        </Routes>

        {/* Ventana Modal de Detalle */}
        {platoSeleccionado && (
          <div className="modal-overlay" onClick={() => setPlatoSeleccionado(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setPlatoSeleccionado(null)}>&times;</button>
              <img src={platoSeleccionado.imagen} alt={platoSeleccionado.nombre} />
              <div className="modal-info">
                <h2>{platoSeleccionado.nombre}</h2>
                <p>{platoSeleccionado.descripcion}</p>
                <div className="modal-footer">
                  <strong>Precio: ${platoSeleccionado.precio.toLocaleString('es-CL')}</strong>
                  <button className="btn-agregar" onClick={() => { addToCart(platoSeleccionado); setPlatoSeleccionado(null); }}>Agregar al Carrito</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </Router>
  );
}

export default App;