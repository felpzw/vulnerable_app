import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeAsyncStorage } from './safeAsyncStorage';

/**
 * VULNERABILIDADE M2: Insecure Data Storage
 * Este serviço armazena TODOS os dados em AsyncStorage em TEXTO CLARO
 * Qualquer app no device pode ler estes dados via debug tools (Flipper, Debugger)
 */

export interface Cookie {
  sessionId: string;
  loginTime: number;
  username: string;
  role: 'comprador' | 'vendedor' | 'administrador';
}

export interface Purchase {
  id: string;
  username: string;
  amount: number;
  cardLastDigits: string;
  transactionId: string;
  timestamp: number;
  status: 'completed' | 'failed';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  seller: string;
  description?: string;
  createdAt: number;
}

export interface AdminLog {
  id: string;
  adminUsername: string;
  operation: string;
  targetData: string;
  timestamp: number;
}

// ⚠️ VULNERÁVEL: Todas as funções armazenam dados em TEXTO CLARO no AsyncStorage
export const storageService = {
  // ====== COOKIES ======
  async setCookie(cookie: Cookie): Promise<void> {
    try {
      await safeAsyncStorage.setItem('cookies', JSON.stringify(cookie));
    } catch (error) {
      console.error('Erro ao salvar cookie:', error);
    }
  },

  async getCookie(): Promise<Cookie | null> {
    try {
      const cookieStr = await safeAsyncStorage.getItem('cookies');
      return cookieStr ? JSON.parse(cookieStr) : null;
    } catch (error) {
      console.error('Erro ao recuperar cookie:', error);
      return null;
    }
  },

  async clearCookie(): Promise<void> {
    try {
      await safeAsyncStorage.removeItem('cookies');
    } catch (error) {
      console.error('Erro ao limpar cookie:', error);
    }
  },

  // ====== PURCHASES ======
  async savePurchase(username: string, purchase: Purchase): Promise<void> {
    try {
      const key = `purchases_${username}`;
      const purchasesStr = await safeAsyncStorage.getItem(key);
      const purchases: Purchase[] = purchasesStr ? JSON.parse(purchasesStr) : [];
      purchases.push(purchase);
      await safeAsyncStorage.setItem(key, JSON.stringify(purchases));
    } catch (error) {
      console.error('Erro ao salvar compra:', error);
    }
  },

  async getPurchases(username: string): Promise<Purchase[]> {
    try {
      const key = `purchases_${username}`;
      const purchasesStr = await safeAsyncStorage.getItem(key);
      return purchasesStr ? JSON.parse(purchasesStr) : [];
    } catch (error) {
      console.error('Erro ao recuperar compras:', error);
      return [];
    }
  },

  async getAllPurchases(): Promise<Purchase[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const purchaseKeys = keys.filter(k => k.startsWith('purchases_'));

      let allPurchases: Purchase[] = [];
      for (const key of purchaseKeys) {
        const purchasesStr = await safeAsyncStorage.getItem(key);
        if (purchasesStr) {
          const purchases = JSON.parse(purchasesStr) as Purchase[];
          allPurchases = allPurchases.concat(purchases);
        }
      }
      return allPurchases;
    } catch (error) {
      console.error('Erro ao recuperar todas as compras:', error);
      return [];
    }
  },

  // ====== PRODUCTS ======
  async addProduct(product: Product): Promise<void> {
    try {
      const productsStr = await safeAsyncStorage.getItem('products');
      const products: Product[] = productsStr ? JSON.parse(productsStr) : [];
      products.push(product);
      await safeAsyncStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
    }
  },

  async getProducts(): Promise<Product[]> {
    try {
      const productsStr = await safeAsyncStorage.getItem('products');
      return productsStr ? JSON.parse(productsStr) : [];
    } catch (error) {
      console.error('Erro ao recuperar produtos:', error);
      return [];
    }
  },

  async getProductsBySeller(seller: string): Promise<Product[]> {
    try {
      const products = await this.getProducts();
      return products.filter(p => p.seller === seller);
    } catch (error) {
      console.error('Erro ao recuperar produtos do vendedor:', error);
      return [];
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    try {
      const products = await this.getProducts();
      const filtered = products.filter(p => p.id !== productId);
      await safeAsyncStorage.setItem('products', JSON.stringify(filtered));
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
    }
  },

  // ====== ADMIN LOGS ======
  async addAdminLog(log: AdminLog): Promise<void> {
    try {
      const logsStr = await safeAsyncStorage.getItem('adminLogs');
      const logs: AdminLog[] = logsStr ? JSON.parse(logsStr) : [];
      logs.push(log);
      await safeAsyncStorage.setItem('adminLogs', JSON.stringify(logs));
    } catch (error) {
      console.error('Erro ao salvar log admin:', error);
    }
  },

  async getAdminLogs(): Promise<AdminLog[]> {
    try {
      const logsStr = await safeAsyncStorage.getItem('adminLogs');
      return logsStr ? JSON.parse(logsStr) : [];
    } catch (error) {
      console.error('Erro ao recuperar logs admin:', error);
      return [];
    }
  },

  async clearAllData(): Promise<void> {
    try {
      const keys = ['cookies', 'products', 'adminLogs'];
      // Também limpa purchases_*
      const allKeys = await AsyncStorage.getAllKeys();
      const purchaseKeys = allKeys.filter(k => k.startsWith('purchases_'));

      await safeAsyncStorage.removeItem('cookies');
      await safeAsyncStorage.removeItem('products');
      await safeAsyncStorage.removeItem('adminLogs');

      for (const key of purchaseKeys) {
        await safeAsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Erro ao limpar todos os dados:', error);
    }
  },
};
