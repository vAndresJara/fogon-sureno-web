import React from 'react';

export const CartModal = ({ isOpen, onClose, cart, removeFromCart, updateQuantity }) => {
  if (!isOpen) return null;

  const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tu Pedido</h2>
          <button className="btn-cerrar" onClick={onClose}>&times;</button>
        </div>
        
        <div className="cart-items">
          {cart.length === 0 ? (
            <p>El carrito está vacío.</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.nombre}</h4>
                  <div className="cart-quantity-controls">
                    <button className="btn-qty" onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span className="qty-value">{item.cantidad}</span>
                    <button className="btn-qty" onClick={() => updateQuantity(item.id, 1)}>+</button>
                    <span className="price-value"> x ${item.precio.toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <button className="btn-eliminar" onClick={() => removeFromCart(item.id)}>Eliminar</button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="modal-footer">
            <h3>Total: ${total.toLocaleString('es-CL')}</h3>
            <button className="btn-pagar" onClick={() => alert('¡Gracias por tu compra!')}>Finalizar Pedido</button>
          </div>
        )}
      </div>
    </div>
  );
};