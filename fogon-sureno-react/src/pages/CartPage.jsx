import React from 'react';
import { Link } from 'react-router-dom';

export const CartPage = ({ cart, removeFromCart, updateQuantity }) => {
  const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    <main className="cart-page-container">
      <section id="carrito-detalle">
        <h2>Tu Pedido</h2>
        <div className="cart-list">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>Tu carrito está vacío.</p>
              <Link title="Volver al menú" to="/" className="btn-agregar">Explorar Platos</Link>
            </div>
          ) : (
            <>
              <div className="cart-items-full">
                {cart.map(item => (
                  <article key={item.id} className="cart-item-full">
                    <div className="item-details">
                      <h4>{item.nombre}</h4>
                      <p>Precio unitario: ${item.precio.toLocaleString('es-CL')}</p>
                    </div>
                    <div className="item-actions">
                      <div className="cart-quantity-controls">
                        <button className="btn-qty" onClick={() => updateQuantity(item.id, -1)}>-</button>
                        <span className="qty-value">{item.cantidad}</span>
                        <button className="btn-qty" onClick={() => updateQuantity(item.id, 1)}>+</button>
                      </div>
                      <button className="btn-eliminar" onClick={() => removeFromCart(item.id)}>Eliminar</button>
                    </div>
                    <div className="item-subtotal">
                      <strong>${(item.precio * item.cantidad).toLocaleString('es-CL')}</strong>
                    </div>
                  </article>
                ))}
              </div>
              <div className="cart-summary">
                <h3>Resumen de compra</h3>
                <div className="summary-row"><span>Total:</span> <strong>${total.toLocaleString('es-CL')}</strong></div>
                <button className="btn-pagar" onClick={() => alert('Procesando pago...')}>Continuar compra</button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
};