import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { login as authLogin } from '../services/authService';
import { storageService } from '../services/storageService';

// Wrapper to safely handle AsyncStorage when native module may not be available
const safeAsyncStorage = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') return null;
      return await AsyncStorage.getItem(key);
    } catch (error: any) {
      if (error?.message?.includes('Native module is null')) {
        console.warn(`AsyncStorage not available on ${Platform.OS}`);
      } else {
        console.warn(`AsyncStorage.getItem('${key}') error:`, error);
      }
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web') return;
      await AsyncStorage.setItem(key, value);
    } catch (error: any) {
      if (error?.message?.includes('Native module is null')) {
        console.warn(`AsyncStorage not available on ${Platform.OS}`);
      } else {
        console.warn(`AsyncStorage.setItem('${key}') error:`, error);
      }
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') return;
      await AsyncStorage.removeItem(key);
    } catch (error: any) {
      if (error?.message?.includes('Native module is null')) {
        console.warn(`AsyncStorage not available on ${Platform.OS}`);
      } else {
        console.warn(`AsyncStorage.removeItem('${key}') error:`, error);
      }
    }
  },
};

// Função para gerar UUID simples
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

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
    // Skip AsyncStorage on web platform - it doesn't support native modules
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }

    // Add small delay to ensure native bridge is initialized
    const timer = setTimeout(() => {
      checkStoredUser();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /**
   * VULNERABILIDADE 2: Insecure Data Storage
   * Carrega token e role do AsyncStorage em texto claro
   * Qualquer app no device pode acessar estes dados
   */
  const checkStoredUser = async () => {
    try {
      // Skip on web - AsyncStorage native module not available
      if (Platform.OS === 'web') {
        setIsLoading(false);
        return;
      }

      const storedUsername = await safeAsyncStorage.getItem('username');
      const storedToken = await safeAsyncStorage.getItem('token');
      const storedRole = await safeAsyncStorage.getItem('role');

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
   * TAMBÉM CRIA UM PSEUDO-COOKIE COM INFORMAÇÕES DA SESSÃO
   */
  const handleLogin = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authLogin({ username, password });

      // ⚠️ VULNERÁVEL: Salvando token e role em texto claro no AsyncStorage
      // Isto pode ser acessado por qualquer app ou debug tools
      if (Platform.OS !== 'web') {
        await safeAsyncStorage.setItem('username', response.username);
        await safeAsyncStorage.setItem('token', response.token);
        await safeAsyncStorage.setItem('role', response.role);

        // ⚠️ VULNERABILIDADE M2: Criar pseudo-cookie em texto claro
        // Um cookie contém sessionId, loginTime, username, role
        const sessionId = generateSessionId();
        const cookie = {
          sessionId,
          loginTime: Date.now(),
          username: response.username,
          role: response.role,
        };
        await storageService.setCookie(cookie);
      }

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
   * Realiza logout removendo dados do AsyncStorage e limpando cookie
   */
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      if (Platform.OS !== 'web') {
        await safeAsyncStorage.removeItem('username');
        await safeAsyncStorage.removeItem('token');
        await safeAsyncStorage.removeItem('role');
        // Limpar cookie ao fazer logout
        await storageService.clearCookie();
      }
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
