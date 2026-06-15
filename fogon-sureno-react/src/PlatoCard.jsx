import React from 'react';

export const PlatoCard = ({ plato, esFavorito, toggleFavorito, addToCart }) => {
  return (
    <article className="plato">
      <div className="plato-header">
        <h3>{plato.nombre}</h3>
        <button 
          className={`btn-favorito ${esFavorito ? 'activo' : ''}`} 
          onClick={() => toggleFavorito(plato.id)}
          title={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          ❤
        </button>
      </div>
      <p>{plato.descripcion}</p>
      <div className="plato-footer">
        <p><strong>Precio: ${plato.precio.toLocaleString('es-CL')}</strong></p>
        <button className="btn-agregar" onClick={() => addToCart(plato)}>
          Agregar
        </button>
      </div>
    </article>
  );
};