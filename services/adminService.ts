import { API_BASE_URL } from '../config';
import { AdminLog, storageService } from './storageService';

/**
 * VULNERABILIDADE M1: Insecure Communication
 * VULNERABILIDADE M2: Insecure Data Storage
 * VULNERABILIDADE M3: Broken Access Control
 *
 * Serviço Admin
 * - Credenciais admin em query string no GET (M1)
 * - Valida credenciais apenas no cliente (M3)
 * - Dados sensíveis em AsyncStorage (M2)
 */

export interface AdminDeleteProductPayload {
  productId: string;
  adminUsername: string;
  adminPassword: string;
}

export interface AdminViewTransactionsPayload {
  adminUsername: string;
  adminPassword: string;
}

export interface AdminOperationResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const adminService = {
  /**
   * Deletar Produto (Admin only)
   * ⚠️ M1: HTTP sem TLS
   * ⚠️ M3: Credenciais validadas apenas no cliente
   */
  async deleteProduct(
    payload: AdminDeleteProductPayload
  ): Promise<AdminOperationResponse> {
    try {
      // Valida credenciais no CLIENTE (vulnerável!)
      // ⚠️ M3: Sem validação real server-side
      if (payload.adminPassword !== 'senha123') {
        return {
          success: false,
          message: 'Credenciais inválidas',
        };
      }

      // ⚠️ M1: HTTP sem TLS
      const response = await fetch(`${API_BASE_URL}/api/admin/delete-product`, {
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

      // Registra operação
      // ⚠️ M2: AsyncStorage em texto claro
      if (data.success) {
        const log: AdminLog = {
          id: `log_${Date.now()}`,
          adminUsername: payload.adminUsername,
          operation: 'DELETE_PRODUCT',
          targetData: payload.productId,
          timestamp: Date.now(),
        };
        await storageService.addAdminLog(log);
      }

      return data;
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return {
        success: false,
        message: 'Erro ao deletar produto',
      };
    }
  },

  /**
   * Visualizar todas as transações (Admin only)
   * ⚠️ M1: Credenciais em query string (inseguro!)
   * ⚠️ M3: Sem validação real server-side
   */
  async viewAllTransactions(payload: AdminViewTransactionsPayload): Promise<AdminOperationResponse> {
    try {
      // Valida credenciais no CLIENTE (vulnerável!)
      // ⚠️ M3: Sem validação real server-side
      if (payload.adminPassword !== 'senha123') {
        return {
          success: false,
          message: 'Credenciais inválidas',
        };
      }

      // ⚠️ M1: Credenciais em query string (SUPER inseguro!)
      // Isso será interceptado em plaintext em qualquer proxy/MITM
      const queryString = new URLSearchParams({
        adminUsername: payload.adminUsername,
        adminPassword: payload.adminPassword,
      });

      const response = await fetch(
        `${API_BASE_URL}/api/admin/all-transactions?${queryString}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Transações recuperadas',
        data: data.transactions,
      };
    } catch (error) {
      console.error('Erro ao recuperar transações:', error);
      return {
        success: false,
        message: 'Erro ao recuperar transações',
      };
    }
  },

  /**
   * Obter logs de operações admin
   */
  async getAdminLogs(): Promise<AdminLog[]> {
    try {
      return await storageService.getAdminLogs();
    } catch (error) {
      console.error('Erro ao recuperar logs admin:', error);
      return [];
    }
  },

  /**
   * Limpar banco de dados (Admin only, para demonstração)
   * ⚠️ SUPER vulnerável - sem nenhuma proteção
   */
  async clearDatabase(): Promise<AdminOperationResponse> {
    try {
      await storageService.clearAllData();

      const log: AdminLog = {
        id: `log_${Date.now()}`,
        adminUsername: 'admin',
        operation: 'CLEAR_DATABASE',
        targetData: 'entire_database',
        timestamp: Date.now(),
      };
      await storageService.addAdminLog(log);

      return {
        success: true,
        message: 'Banco de dados limpo',
      };
    } catch (error) {
      console.error('Erro ao limpar banco de dados:', error);
      return {
        success: false,
        message: 'Erro ao limpar banco de dados',
      };
    }
  },
};
