import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';

const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api/auth';

export const useAuth = () => useContext(AuthContext);

// Decodifica el payload de un JWT (sin verificar la firma; solo para leer datos en el cliente).
const decodeToken = (token) => {
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token-fogon'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!token);
    const [authError, setAuthError] = useState('');

    // Derivamos el rol, el ID y el nombre del usuario a partir del token.
    const decoded = useMemo(() => decodeToken(token), [token]);
    const role = useMemo(() => decoded?.user?.role ?? null, [decoded]);
    const userId = useMemo(() => decoded?.user?.id ?? null, [decoded]);
    const nombreUsuario = useMemo(() => decoded?.user?.nombre ?? '', [decoded]);
    const isAdmin = role === 'admin';

    useEffect(() => {
        if (token) {
            localStorage.setItem('token-fogon', token);
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem('token-fogon');
            setIsAuthenticated(false);
        }
    }, [token]);

    // Extrae un mensaje legible desde la respuesta del backend (msg o errores de validación).
    const extractError = (data, fallback) => {
        if (data?.msg) return data.msg;
        if (Array.isArray(data?.errors) && data.errors.length > 0) return data.errors[0].msg;
        return fallback;
    };

    const login = async (email, password) => {
        setAuthError('');
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(extractError(data, 'Error al iniciar sesión'));
            }

            setToken(data.token);
            return true;
        } catch (error) {
            console.error('Error de login:', error);
            setAuthError(error.message);
            return false;
        }
    };

    // Registra un usuario nuevo. Devuelve { success, msg } para que la página muestre feedback.
    const register = async (email, password, nombre, telefono) => {
        setAuthError('');
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nombre, telefono }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(extractError(data, 'Error al registrar la cuenta'));
            }

            return { success: true, msg: data.msg };
        } catch (error) {
            console.error('Error de registro:', error);
            setAuthError(error.message);
            return { success: false, msg: error.message };
        }
    };

    // Solicita el enlace de recuperación. El backend siempre responde de forma genérica.
    const forgotPassword = async (email) => {
        setAuthError('');
        try {
            const response = await fetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(extractError(data, 'No se pudo procesar la solicitud'));
            }

            return { success: true, msg: data.msg };
        } catch (error) {
            console.error('Error en recuperación:', error);
            setAuthError(error.message);
            return { success: false, msg: error.message };
        }
    };

    // Restablece la contraseña usando el token recibido en el enlace.
    const resetPassword = async (resetToken, password) => {
        setAuthError('');
        try {
            const response = await fetch(`${API_URL}/reset-password/${resetToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(extractError(data, 'No se pudo restablecer la contraseña'));
            }

            return { success: true, msg: data.msg };
        } catch (error) {
            console.error('Error al restablecer:', error);
            setAuthError(error.message);
            return { success: false, msg: error.message };
        }
    };

    const logout = () => {
        setToken(null);
    };

    const value = {
        token,
        setToken,
        isAuthenticated,
        role,
        isAdmin,
        userId,
        nombreUsuario,
        authError,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
