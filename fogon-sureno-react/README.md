# Fogón Sureño - Aplicación Full-stack de Restaurante

Este proyecto es una aplicación web full-stack para el restaurante "Fogón Sureño", que permite a los usuarios explorar el menú, gestionar un carrito de pedidos y realizar reservas de mesas. El desarrollo sigue una metodología por hitos, cubriendo desde el frontend con React hasta el backend con Node.js, Express y MongoDB.

## Características Implementadas (Hitos 3, 4 y 5)

-   **Hito 3: React Avanzado (Context / Custom Hooks)**
    *   **Gestión de Carrito de Compras**: Utiliza `CartContext` para un estado global del carrito, permitiendo añadir, eliminar y actualizar la cantidad de productos.
    *   **Gestión de Menú**: Implementa un `useMenu` custom hook para la carga y gestión de los platos del restaurante.
    *   **Filtrado y Búsqueda**: Funcionalidad para buscar platos por texto y filtrar por categorías (incluyendo favoritos).
    *   **Detalle de Plato (Modal)**: Visualización de información detallada de cada plato en un modal.
    *   **Favoritos**: Opción para marcar platos como favoritos, persistiendo en el estado del contexto.

-   **Hito 4: Back-end Inicial (Node.js / Express / APIs)**
    *   **API REST para Menú**: El frontend consume el menú desde un endpoint `/api/menu` provisto por el servidor Express.
    *   **API REST para Reservas**: Endpoint `/api/reservas` para recibir y procesar las solicitudes de reserva desde el frontend.
    *   **Manejo de CORS**: Configuración del servidor para permitir solicitudes desde el frontend.

-   **Hito 5: Integración Full-stack (Base de Datos)**
    *   **Persistencia de Reservas**: Las reservas realizadas a través del formulario se guardan permanentemente en una base de datos MongoDB.
    *   **Configuración de Entorno**: Uso de `dotenv` para gestionar variables de entorno (como la URI de la base de datos).
    *   **Validación de Formulario**: El formulario de reservas incluye validación básica (fecha mínima, campos requeridos) y manejo de estado de carga.

## Tecnologías Utilizadas

*   **Frontend**: React.js, Vite, React Router DOM, Custom Hooks, Context API.
*   **Backend**: Node.js, Express.js, Mongoose, CORS, Dotenv.
*   **Base de Datos**: MongoDB.
*   **Estilos**: CSS puro.

## Estructura del Proyecto

El proyecto está dividido en dos directorios principales:

*   `fogon-sureno-react/`: Contiene la aplicación frontend desarrollada con React y Vite.
*   `fogon-sureno-server/`: Contiene la API backend desarrollada con Node.js y Express.

## Cómo Poner en Marcha el Proyecto

Sigue estos pasos para configurar y ejecutar la aplicación en tu entorno local.

### 1. Requisitos Previos

Asegúrate de tener instalado:
*   Node.js (versión 18 o superior recomendada)
*   npm (viene con Node.js)
*   MongoDB (servidor local o acceso a una instancia en la nube como MongoDB Atlas)

### 2. Configuración del Backend

1.  Navega al directorio del servidor:
    ```bash
    cd c:\Desarrollo\fogon-sureno-web\fogon-sureno-server
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env` en este directorio con el siguiente contenido (ajusta la `MONGO_URI` si usas una instancia en la nube):
    ```dotenv
    PORT=5000
    MONGO_URI=mongodb://127.0.0.1:27017/fogon_sureno
    ```
4.  Asegúrate de que tu servidor MongoDB esté en ejecución.
5.  Inicia el servidor:
    ```bash
    node index.js
    ```
    Deberías ver un mensaje indicando que el servidor está corriendo en `http://localhost:5000` y conectado a MongoDB.

### 3. Configuración del Frontend

1.  Abre una nueva terminal y navega al directorio del frontend:
    ```bash
    cd c:\Desarrollo\fogon-sureno-web\fogon-sureno-react
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Inicia la aplicación React:
    ```bash
    npm run dev
    ```
    La aplicación se abrirá en tu navegador, generalmente en `http://localhost:5173`.

¡Listo! Ahora puedes interactuar con la aplicación "Fogón Sureño", explorar el menú, añadir al carrito y realizar reservas que se guardarán en tu base de datos.
