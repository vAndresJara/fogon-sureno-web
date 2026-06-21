import { useState, useEffect } from 'react';
// Custom Hook para obtener el menú desde el backend
export const useMenu = () => {
  // Estados para almacenar los platos y el estado de carga
  const [platos, setPlatos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Efecto para cargar el menú al montar el componente
  useEffect(() => {
    // Función asíncrona para obtener el menú desde el backend
    const cargarMenu = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/menu');
        const data = await response.json();
        
        // Mapear id defensivamente para evitar problemas si viene _id desde MongoDB
        const platosMapeados = data.map(plato => ({
          ...plato,
          id: plato.id || plato._id
        }));

        setPlatos(platosMapeados);
      } catch (error) {
        console.error("Error al obtener el menú:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarMenu();
  }, []);

  return { platos, loading };
};