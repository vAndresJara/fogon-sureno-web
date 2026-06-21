import React from 'react';

export const PlatoCard = ({ plato, esFavorito, toggleFavorito, addToCart, onVerDetalle }) => {
  return (
    <article className="plato">
      <img src={plato.imagen} alt={plato.nombre} onClick={onVerDetalle} style={{cursor: 'pointer'}} />
      <div className="plato-header">
        <h3 onClick={onVerDetalle} style={{cursor: 'pointer'}}>{plato.nombre}</h3>
        <button 
          className={`btn-favorito ${esFavorito ? 'activo' : ''}`} 
          onClick={() => toggleFavorito(plato.id)}
          title={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          ❤
        </button>
      </div>
      <p onClick={onVerDetalle} style={{cursor: 'pointer'}}>{plato.descripcion}</p>
      <div className="plato-footer">
        <p><strong>Precio: ${plato.precio.toLocaleString('es-CL')}</strong></p>
        <button className="btn-agregar" onClick={() => addToCart(plato)}>
          Agregar
        </button>
      </div>
    </article>
  );
};