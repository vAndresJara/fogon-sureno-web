// CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
// Contexto para manejar el carrito de compras y favoritos
const CartContext = createContext();
// Hook personalizado para acceder al contexto del carrito
export const useCart = () => useContext(CartContext);
// Proveedor del contexto del carrito, maneja el estado de favoritos y carrito, y lo sincroniza con localStorage
export const CartProvider = ({ children }) => {
  // Inicializa el estado de favoritos y carrito desde localStorage o con valores predeterminados
  const [favoritos, setFavoritos] = useState(() => {
    // Intenta cargar los favoritos desde localStorage, si no hay nada, devuelve un array vacío
    const save = localStorage.getItem('favoritos-fogon');
    // Si hay datos guardados, los parsea y devuelve, de lo contrario devuelve un array vacío
    return save ? JSON.parse(save) : [];
  });

  // Inicializa el estado del carrito desde localStorage o con un array vacío
  const [cart, setCart] = useState(() => {
    const save = localStorage.getItem('cart-fogon');
    // Si hay datos guardados, los parsea y devuelve, de lo contrario devuelve un array vacío
    return save ? JSON.parse(save) : [];
  });

  // Sincroniza los favoritos con localStorage cada vez que cambian
  useEffect(() => {
    // Guarda los favoritos en localStorage cada vez que cambian
    localStorage.setItem('favoritos-fogon', JSON.stringify(favoritos));
  }, [favoritos]);

  // Sincroniza el carrito con localStorage cada vez que cambia
  useEffect(() => {
    // Guarda el carrito en localStorage cada vez que cambia
    localStorage.setItem('cart-fogon', JSON.stringify(cart));
  }, [cart]);

  // Función para agregar o quitar un plato de los favoritos
  const toggleFavorito = (id) => {
    setFavoritos(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Función para agregar un plato al carrito, si ya existe, incrementa la cantidad
  const addToCart = (plato) => {
    
    setCart(prev => {
      // Verifica si el plato ya está en el carrito
      const itemExistente = prev.find(item => item.id === plato.id);
      if (itemExistente) {
        return prev.map(item =>
          item.id === plato.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...plato, cantidad: 1 }];
    });
  };

  // Función para actualizar la cantidad de un plato en el carrito, asegurándose de que no sea menor a 1
  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item =>
      item.id === id 
        ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } 
        : item
    ));
  };

  // Función para eliminar un plato del carrito
  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Calcula el número total de platos en el carrito sumando las cantidades de cada plato
  const cartCount = cart.reduce((total, item) => total + item.cantidad, 0);

  // El valor que se proporcionará a los componentes que consumen este contexto
  const value = {
    cart,
    favoritos,
    cartCount,
    toggleFavorito,
    addToCart,
    updateQuantity,
    removeFromCart
  };

  // Proporciona el contexto a los componentes hijos
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};