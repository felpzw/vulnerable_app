import { API_BASE_URL } from '../config';
import { Product, storageService } from './storageService';

/**
 * VULNERABILIDADE M1: Insecure Communication
 * VULNERABILIDADE M2: Insecure Data Storage
 * VULNERABILIDADE M3: Broken Access Control
 *
 * Serviço de Produtos
 * - Envia dados via HTTP sem TLS (M1)
 * - Armazena em AsyncStorage em texto claro (M2)
 * - Comprador pode adicionar produtos (M3)
 */

export interface AddProductPayload {
  name: string;
  price: number;
  description?: string;
  seller: string;
}

export interface AddProductResponse {
  success: boolean;
  productId?: string;
  message: string;
}

export const productService = {
  /**
   * Adicionar novo produto
   * ⚠️ M1: HTTP sem TLS
   * ⚠️ M3: Sem validação de permissão (comprador consegue adicionar produto)
   */
  async addProduct(payload: AddProductPayload): Promise<AddProductResponse> {
    try {
      // ⚠️ M1: Enviando via HTTP em texto claro
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Se sucesso, salva localmente
      // ⚠️ M2: AsyncStorage em texto claro
      if (data.success) {
        const product: Product = {
          id: `prod_${Date.now()}`,
          name: payload.name,
          price: payload.price,
          seller: payload.seller,
          description: payload.description,
          createdAt: Date.now(),
        };

        await storageService.addProduct(product);
      }

      return data;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      throw error;
    }
  },

  /**
   * Obter todos os produtos
   * ⚠️ M2: AsyncStorage em texto claro
   */
  async getProducts(): Promise<Product[]> {
    try {
      return await storageService.getProducts();
    } catch (error) {
      console.error('Erro ao recuperar produtos:', error);
      return [];
    }
  },

  /**
   * Obter produtos de um vendedor específico
   * ⚠️ M3: Sem validação se usuário é realmente vendedor
   */
  async getProductsBySeller(seller: string): Promise<Product[]> {
    try {
      return await storageService.getProductsBySeller(seller);
    } catch (error) {
      console.error('Erro ao recuperar produtos do vendedor:', error);
      return [];
    }
  },

  /**
   * Deletar produto
   * ⚠️ M3: Admin não valida credenciais no cliente
   */
  async deleteProduct(productId: string): Promise<{ success: boolean }> {
    try {
      await storageService.deleteProduct(productId);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return { success: false };
    }
  },
};
