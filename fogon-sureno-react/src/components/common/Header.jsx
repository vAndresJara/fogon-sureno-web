import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
//
export const Header = () => {
  const { cartCount } = useCart();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [reservasDropdownOpen, setReservasDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
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
          {isAuthenticated ? (
            <li><Link title="Reservar mesa" to="/reservas">Reservas</Link></li>
          ) : (
            <li><Link title="Reservar mesa" to="/login" state={{ from: { pathname: '/reservas' } }}>Reservas</Link></li>
          )}
          {isAuthenticated && (
            <li><Link title="Ver mi perfil" to="/perfil">Mi Perfil</Link></li>
          )}
          {isAdmin && (
            <li
              className="dropdown"
              style={{ position: 'relative' }}
              onMouseEnter={() => {
                setReservasDropdownOpen(true);
                setMenuDropdownOpen(false);
              }}
              onMouseLeave={() => setReservasDropdownOpen(false)}
            >
              <button
                type="button"
                className="btn btn-link text-white dropdown-toggle p-0 text-decoration-none"
                style={{ font: 'inherit', verticalAlign: 'baseline' }}
                onClick={() => {
                  setReservasDropdownOpen(!reservasDropdownOpen);
                  setMenuDropdownOpen(false);
                }}
              >
                Control reservas
              </button>
              {reservasDropdownOpen && (
                <ul className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: '0', zIndex: 1000 }}>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/admin"
                      onClick={() => setReservasDropdownOpen(false)}
                    >
                      Panel de reservas
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/admin/zonas"
                      onClick={() => setReservasDropdownOpen(false)}
                    >
                      Panel de zonas
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          )}
          {isAdmin && (
            <li
              className="dropdown"
              style={{ position: 'relative' }}
              onMouseEnter={() => {
                setMenuDropdownOpen(true);
                setReservasDropdownOpen(false);
              }}
              onMouseLeave={() => setMenuDropdownOpen(false)}
            >
              <button
                type="button"
                className="btn btn-link text-white dropdown-toggle p-0 text-decoration-none"
                style={{ font: 'inherit', verticalAlign: 'baseline' }}
                onClick={() => {
                  setMenuDropdownOpen(!menuDropdownOpen);
                  setReservasDropdownOpen(false);
                }}
              >
                Control menú
              </button>
              {menuDropdownOpen && (
                <ul className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: '0', zIndex: 1000 }}>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/MenuAdmin?tab=agregar"
                      onClick={() => setMenuDropdownOpen(false)}
                    >
                      Agregar ítem al menú
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/MenuAdmin?tab=editar"
                      onClick={() => setMenuDropdownOpen(false)}
                    >
                      Editar plato del menú
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/MenuAdmin?tab=eliminar"
                      onClick={() => setMenuDropdownOpen(false)}
                    >
                      Eliminar plato del menú
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          )}
          {isAdmin && (
            <li><Link title="Administrar Usuarios" to="/admin/usuarios">Panel de usuarios</Link></li>
          )}
          <li>
            {isAuthenticated ? (
              <button type="button" className="btn-sesion" onClick={handleLogout}>
                Cerrar sesión
              </button>
            ) : (
              <Link title="Iniciar sesión" to="/login">Iniciar sesión</Link>
            )}
          </li>
          <li>
            <Link title="Ir al carrito" to="/carrito" className="cart-indicator">
              🛒 <span>{cartCount}</span>
            </Link>
          </li>

        </ul>
      </nav>
    </header>
  );
};