import { API_BASE_URL } from '../config';
import { Purchase, storageService } from './storageService';

/**
 * VULNERABILIDADE M1: Insecure Communication
 * VULNERABILIDADE M2: Insecure Data Storage
 * VULNERABILIDADE M3: Broken Access Control
 *
 * Sistema de Pagamento Pseudo
 * - Envia dados de cartão via HTTP sem TLS
 * - Armazena histórico em AsyncStorage em texto claro
 * - Sem validação server-side adequada
 */

export interface PaymentRequestPayload {
  username: string;
  cardLastDigits: string;
  cvv: string;
  amount: number;
}

export interface OTPResponse {
  success: boolean;
  iToken: string;
  message: string;
  transactionReference?: string;
}

export interface PaymentConfirmPayload {
  username: string;
  iToken: string;
  userInputCode: string;
  cardLastDigits: string;
  amount: number;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  timestamp?: number;
}

export const paymentService = {
  /**
   * Passo 1: Cliente solicita OTP
   * ⚠️ VULNERÁVEL: Envia dados de cartão via HTTP (M1)
   */
  async requestOTP(payload: PaymentRequestPayload): Promise<OTPResponse> {
    try {
      // ⚠️ M1: HTTP sem TLS, dados de cartão viajando em texto claro
      const response = await fetch(`${API_BASE_URL}/api/payment/request`, {
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
      return data;
    } catch (error) {
      console.error('Erro ao solicitar OTP:', error);
      throw error;
    }
  },

  /**
   * Passo 2: Cliente confirma OTP
   * Valida se o código digitado matches o iToken
   */
  async confirmPayment(
    payload: PaymentConfirmPayload
  ): Promise<PaymentResponse> {
    try {
      // ⚠️ M1: HTTP sem TLS, credenciais viajando em texto claro
      const response = await fetch(`${API_BASE_URL}/api/payment/confirm`, {
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

      // Se sucesso, salva no histórico local
      // ⚠️ M2: Armazenando em AsyncStorage em texto claro
      if (data.success) {
        const purchase: Purchase = {
          id: `purc_${Date.now()}`,
          username: payload.username,
          amount: payload.amount,
          cardLastDigits: payload.cardLastDigits,
          transactionId: data.transactionId || `txn_${Date.now()}`,
          timestamp: Date.now(),
          status: 'completed',
        };

        await storageService.savePurchase(payload.username, purchase);
      }

      return data;
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      throw error;
    }
  },

  /**
   * Recuperar histórico de compras
   * ⚠️ M2: Dados em texto claro no AsyncStorage
   */
  async getPurchaseHistory(username: string): Promise<Purchase[]> {
    try {
      return await storageService.getPurchases(username);
    } catch (error) {
      console.error('Erro ao recuperar histórico de compras:', error);
      return [];
    }
  },

  /**
   * Obter todas as compras (admin)
   * ⚠️ M3: Sem validação de permissão no cliente
   */
  async getAllPurchases(): Promise<Purchase[]> {
    try {
      return await storageService.getAllPurchases();
    } catch (error) {
      console.error('Erro ao recuperar todas as compras:', error);
      return [];
    }
  },
};
