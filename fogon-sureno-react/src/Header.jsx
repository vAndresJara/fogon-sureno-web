import React from 'react';
import { Link } from 'react-router-dom';

export const Header = ({ cartCount }) => (
  <header>
    <div className="logo">
      <Link title="Ir al inicio" to="/">
        <h1>Fogón Sureño</h1>
      </Link>
    </div>
    <nav>
      <ul>
        <li><Link to="/#inicio">Inicio</Link></li>
        <li><Link to="/#nosotros">Nosotros</Link></li>
        <li><Link to="/#menu">Nuestro Menú</Link></li>
        <li><Link to="/#contacto">Contacto</Link></li>
        <Link title="Ir al carrito" to="/carrito" className="cart-indicator">
          🛒 <span>{cartCount}</span>
        </Link>
      </ul>
    </nav>
  </header>
);