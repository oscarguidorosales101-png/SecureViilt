// ==============================================================================
// SECUREVAULT - CONTEXTO GLOBAL DE AUTENTICACIÓN Y SESIÓN
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificación inicial de sesión activa en el servidor
  const checkSession = useCallback(async () => {
    try {
      const data = await authService.getMe();
      const currentUser = data?.user || data;
      if (currentUser && currentUser.id) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();

    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session_expired', handleSessionExpired);
    };
  }, [checkSession]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const loggedUser = data?.user || data;
    if (loggedUser && loggedUser.id) {
      setUser(loggedUser);
    }
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    // Establecer la sesión activa inmediatamente iniciando sesión
    await login(email, password);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAdmin: user?.role === 'ADMIN',
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refreshUser: checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
