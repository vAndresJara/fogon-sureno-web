import React from 'react';
import { useAuth } from './AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

// Componente para proteger rutas que requieren autenticación.
// requireAdmin: si es true, además de estar autenticado el usuario debe tener rol 'admin'.
const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, isAdmin } = useAuth();
    const location = useLocation();

    // Si no está autenticado, redirigimos al login.
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si se requiere admin y el usuario no es admin, redirigimos al inicio.
    if (requireAdmin && !isAdmin) {
        // Usuario autenticado pero sin permisos de admin: lo mandamos al inicio.
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
