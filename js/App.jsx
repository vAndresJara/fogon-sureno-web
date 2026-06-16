import React, { useState, useEffect, useMemo } from 'react';
import { menuPlatos } from './menu'; // Ajusta la ruta según tu carpeta
import { PlatoCard } from './PlatoCard';
import { Header } from './Header';
import { Footer } from './Footer';
import '../css/variables.css';
import '../css/styles.css';

function App() {
  // Estados
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [favoritos, setFavoritos] = useState(() => {
    const save = localStorage.getItem('favoritos-fogon');
    return save ? JSON.parse(save) : [];
  });
  const [cart, setCart] = useState([]);

  // Persistencia de favoritos
  useEffect(() => {
    localStorage.setItem('favoritos-fogon', JSON.stringify(favoritos));
  }, [favoritos]);

  // Lógica de filtrado (optimizada con useMemo)
  const platosFiltrados = useMemo(() => {
    return menuPlatos.filter(plato => {
      const coincideTexto = plato.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                            plato.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      
      let coincideCategoria = false;
      if (categoria === "todos") coincideCategoria = true;
      else if (categoria === "favoritos") coincideCategoria = favoritos.includes(plato.id);
      else coincideCategoria = plato.categoria.includes(categoria);

      return coincideTexto && coincideCategoria;
    });
  }, [busqueda, categoria, favoritos]);

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

  // Calculamos el total de items para mostrar en el Header
  const cartCount = cart.reduce((total, item) => total + item.cantidad, 0);

  return (
    <div className="App">
      <Header cartCount={cartCount} />

      <main>
        <section id="inicio">
          <h2>Bienvenidos al Auténtico Sabor del Sur</h2>
          <p>Disfruta de la mejor gastronomía tradicional, preparada con pasión y al calor del fogón.</p>
          <a href="#menu">Ver la Carta</a>
        </section>

        <section id="nosotros">
          <h2>Nuestra Historia</h2>
          <p>Nacidos con el propósito de traer las recetas más rústicas, sabrosas y tradicionales directamente a tu mesa. Cada plato cuenta una historia de tradición familiar.</p>
        </section>
      
      <section id="menu">
        <h2>Especialidades de la Casa</h2>
        <p>Conoce algunos de nuestros platos más destacados:</p>

        <div className="busqueda-container">
          <input 
            type="text" 
            placeholder="Busca tu plato favorito..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filtros-container">
          {['todos', 'carnes', 'mariscos', 'postres', 'favoritos'].map(cat => (
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

      <Footer />
    </div>
  );
}

export default App;