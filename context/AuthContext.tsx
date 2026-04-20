import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as authLogin } from './authService';

interface User {
  username: string;
  token: string;
  role: 'comprador' | 'vendedor' | 'administrador';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se há usuário salvo ao iniciar a app
  useEffect(() => {
    checkStoredUser();
  }, []);

  /**
   * VULNERABILIDADE 2: Insecure Data Storage
   * Carrega token e role do AsyncStorage em texto claro
   * Qualquer app no device pode acessar estes dados
   */
  const checkStoredUser = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedToken = await AsyncStorage.getItem('token');
      const storedRole = await AsyncStorage.getItem('role');

      if (storedToken && storedRole && storedUsername) {
        setUser({
          username: storedUsername,
          token: storedToken,
          role: storedRole as any,
        });
      }
    } catch (error) {
      console.error('Erro ao verificar usuário armazenado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Realiza login e armazena dados NO ASYNC STORAGE EM TEXTO CLARO
   */
  const handleLogin = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authLogin({ username, password });

      // ⚠️ VULNERÁVEL: Salvando token e role em texto claro no AsyncStorage
      // Esto pode ser acessado por qualquer app ou debug tools
      await AsyncStorage.setItem('username', response.username);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('role', response.role);

      setUser({
        username: response.username,
        token: response.token,
        role: response.role,
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Realiza logout removendo dados do AsyncStorage
   */
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('role');
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        isLoggedIn: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
