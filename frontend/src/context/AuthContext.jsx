import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('skavt_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('skavt_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const logout = React.useCallback(() => {
    localStorage.removeItem('skavt_token');
    localStorage.removeItem('skavt_user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
          localStorage.setItem('skavt_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Seja je potekla ali žeton ni veljaven:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token, logout]);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    const authToken = res.token;
    const authUser = res.user;

    localStorage.setItem('skavt_token', authToken);
    localStorage.setItem('skavt_user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
    return res;
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Preverjanje prijave...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
