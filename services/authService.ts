/**
 * VULNERABILIDADE 1: Insecure Communication
 * Este serviço utiliza HTTP sem criptografia em vez de HTTPS.
 * Qualquer interceptação de rede pode expor credenciais e tokens.
 */

interface LoginResponse {
  token: string;
  role: 'comprador' | 'vendedor' | 'administrador';
  username: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Realiza login contra endpoint HTTP desprotegido
 * VULNERÁVEL: Sem criptografia de transporte
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    // ⚠️ VULNERÁVEL: HTTP sem criptografia - qualquer proxy/MITM pode interceptar
    const response = await fetch('http://192.168.1.100:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Login error: ${error}`);
  }
}

/**
 * Realiza logout (simples)
 */
export async function logout(): Promise<void> {
  // Logout seria feito na tela de dashboard
}
