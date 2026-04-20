import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Wrapper seguro para AsyncStorage que trata erros graciosamente
 * Especialmente para o erro "Native module is null" que ocorre durante inicialização
 */
export const safeAsyncStorage = {
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
