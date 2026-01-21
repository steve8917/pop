import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      // Nessuna sessione valida (cookie assente/scaduto) oppure token non valido.
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.user);
      toast.success('Login effettuato con successo!');
    } catch (error: any) {
      const apiError = error?.response?.data;
      const status = error?.response?.status;

      // Se email non verificata, accompagniamo l'utente al reinvio con email già compilata.
      if (status === 403 && apiError?.error === 'EMAIL_NOT_VERIFIED') {
        sessionStorage.setItem('pendingVerificationEmail', email);
      }

      const message = error.response?.data?.message || 'Errore durante il login';
      toast.error(message);
      throw error;
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const { data } = await api.post('/auth/register', registerData);
      // Non impostiamo più il token perché l'utente deve prima verificare l'email
      toast.success(data.message || 'Registrazione completata! Controlla la tua email per verificare il tuo account.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Errore durante la registrazione';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      toast.success('Logout effettuato');
    } catch (error) {
      // Anche se la chiamata fallisce (es. cookie già scaduto), vogliamo chiudere la sessione lato client.
      setUser(null);
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
