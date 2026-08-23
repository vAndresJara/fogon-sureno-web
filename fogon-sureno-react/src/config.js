// Leer la URL base del backend desde la variable de entorno de Vite o usar localhost por defecto
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// URL base para las consultas a la API
export const API_BASE_URL = `${BASE_URL}/api`;
