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
        <li><a href="/#inicio">Inicio</a></li>
        <li><a href="/#nosotros">Nosotros</a></li>
        <li><a href="/#menu">Nuestro Menú</a></li>
        <li><a href="/#contacto">Contacto</a></li>
        <Link title="Ir al carrito" to="/carrito" className="cart-indicator">
          🛒 <span>{cartCount}</span>
        </Link>
      </ul>
    </nav>
  </header>
);