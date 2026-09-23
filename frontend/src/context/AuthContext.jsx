import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = api.getToken();
      if (token) {
        try {
          const res = await api.getMe();
          if (res && res.user) {
            setUser(res.user);
          } else {
            api.logout();
          }
        } catch (err) {
          console.warn('Session restoration failed:', err.message);
          api.logout();
          setUser(null);
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setUser(res.user);
    return res;
  };

  const signup = async (name, email, password) => {
    const res = await api.signup(name, email, password);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
