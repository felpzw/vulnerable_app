#!/usr/bin/env node

/**
 * Mock Server para Aplicação Vulnerável de PoC
 *
 * Este servidor simula um backend inseguro que:
 * 1. Aceita requisições HTTP (sem HTTPS)
 * 2. Retorna token e role em JSON
 * 3. Não valida credenciais adequadamente
 *
 * Uso:
 * node mock-server.js
 *
 * Ficará disponível em: http://localhost:3000
 */

const http = require('http');
const url = require('url');

// Usuários fictícios com roles
const USERS = {
  comprador: { role: 'comprador', password: 'senha123' },
  vendedor: { role: 'vendedor', password: 'senha123' },
  admin: { role: 'administrador', password: 'senha123' },
};

// Handler para requisições
const requestHandler = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Configurar CORS para testes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Responder ao preflight CORS
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Rota: POST /api/login
  if (pathname === '/api/login' && method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body);

        // Validação simples
        if (!username || !password) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Username and password required' }));
          return;
        }

        // Verificar credenciais
        const user = USERS[username];
        if (!user || user.password !== password) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }

        // Login bem-sucedido - retornar token e role
        // ⚠️ VULNERÁVEL: Token é apenas uma string simples, sem validação real
        const token = `fake_token_${username}_${Date.now()}`;

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          token: token,
          role: user.role,
          username: username,
          message: `Login bem-sucedido como ${user.role}`,
        }));

        console.log(`✓ ${new Date().toISOString()} - Login: ${username} (${user.role})`);
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Rota: GET /api/status
  if (pathname === '/api/status' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'running',
      message: 'Mock Server para PoC Vulnerável - PoucoSeguro App',
      routes: [
        'POST /api/login - Endpoint de login (HTTP inseguro)',
        'POST /api/payment/request - Solicitar OTP (M1 + M2)',
        'POST /api/payment/confirm - Confirmar pagamento (M1 + M2)',
        'POST /api/products - Adicionar produto (M1 + M3)',
        'GET /api/products - Listar produtos',
        'POST /api/admin/delete-product - Deletar produto (M1 + M3)',
        'GET /api/admin/all-transactions - Ver transações (M1 + M3 - credenciais em query string)',
        'GET /api/status - Status do servidor',
      ],
      users: Object.keys(USERS),
      vulnerabilities: ['M1: Insecure Communication (HTTP)', 'M2: Insecure Data Storage', 'M3: Broken Access Control'],
    }));
    return;
  }

  // Rota: GET / (raiz)
  if (pathname === '/' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Mock Server para Aplicação Vulnerável de PoC',
      docs: 'Para detalhes, acesse /api/status',
    }));
    return;
  }

  // ====== PAYMENT ENDPOINTS ======
  // Rota: POST /api/payment/request - Solicitar OTP
  if (pathname === '/api/payment/request' && method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { username, cardLastDigits, cvv, amount } = JSON.parse(body);

        if (!username || !cardLastDigits || !cvv || !amount) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Dados de pagamento incompletos' }));
          return;
        }

        // ⚠️ VULNERÁVEL: Gera código OTP simples de 4 dígitos
        const iToken = String(Math.floor(Math.random() * 9000) + 1000);

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          iToken: iToken,
          message: `🔐 SMS de Banco:\n\nSeu código de acesso é: ${iToken}\n\nNunca compartilhe este código.`,
          transactionReference: `TXN_${Date.now()}`,
        }));

        console.log(`✓ ${new Date().toISOString()} - OTP solicitado para ${username}: ${iToken}`);
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Rota: POST /api/payment/confirm - Confirmar pagamento com código OTP
  if (pathname === '/api/payment/confirm' && method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { username, iToken, userInputCode, cardLastDigits, amount } = JSON.parse(body);

        if (!username || !iToken || !userInputCode || !cardLastDigits || !amount) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Dados incompletos' }));
          return;
        }

        // ⚠️ VULNERÁVEL: Validação simples do código
        if (iToken !== userInputCode) {
          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            message: 'Código OTP incorreto! Tente novamente.',
          }));
          return;
        }

        // Pagamento confirmado
        const transactionId = `TXN_${username}_${Date.now()}`;

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          transactionId: transactionId,
          message: `✅ Pagamento de R$ ${amount.toFixed(2)} realizado com sucesso!`,
          timestamp: Date.now(),
        }));

        console.log(`✓ ${new Date().toISOString()} - Pagamento confirmado: ${transactionId}`);
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // ====== PRODUCT ENDPOINTS ======
  // Rota: POST /api/products - Adicionar produto
  if (pathname === '/api/products' && method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { name, price, description, seller } = JSON.parse(body);

        if (!name || !price || !seller) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Dados de produto incompletos' }));
          return;
        }

        // ⚠️ VULNERÁVEL: Sem validação se seller é realmente um vendedor
        const productId = `PROD_${Date.now()}`;

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          productId: productId,
          message: `Produto "${name}" cadastrado com sucesso!`,
        }));

        console.log(`✓ ${new Date().toISOString()} - Produto adicionado: ${productId} por ${seller}`);
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Rota: GET /api/products - Listar produtos
  if (pathname === '/api/products' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      products: [],
      message: 'Use o armazenamento local para produtos',
    }));
    return;
  }

  // ====== ADMIN ENDPOINTS ======
  // Rota: POST /api/admin/delete-product - Deletar produto (Admin only)
  if (pathname === '/api/admin/delete-product' && method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { productId, adminUsername, adminPassword } = JSON.parse(body);

        // ⚠️ VULNERÁVEL: Validação simples de credenciais
        if (adminUsername !== 'admin' || adminPassword !== 'senha123') {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Credenciais admin inválidas' }));
          return;
        }

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: `Produto ${productId} deletado com sucesso.`,
        }));

        console.log(`✓ ${new Date().toISOString()} - Produto deletado: ${productId} por admin`);
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Rota: GET /api/admin/all-transactions - Ver todas as transações
  // ⚠️ M1: Credenciais em query string!! SUPER INSEGURO
  if (pathname === '/api/admin/all-transactions' && method === 'GET') {
    const adminUsername = parsedUrl.query.adminUsername;
    const adminPassword = parsedUrl.query.adminPassword;

    // ⚠️ VULNERÁVEL: Validação trivial
    if (adminUsername !== 'admin' || adminPassword !== 'senha123') {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Credenciais admin inválidas' }));
      return;
    }

    // Simular retorno de transações
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      transactions: [
        {
          id: 'TXN_comprador_123456',
          username: 'comprador',
          amount: 99.90,
          timestamp: Date.now() - 3600000,
        },
        {
          id: 'TXN_comprador_234567',
          username: 'comprador',
          amount: 149.90,
          timestamp: Date.now(),
        },
      ],
      message: 'Todas as transações',
    }));

    console.log(`✓ ${new Date().toISOString()} - Admin acessou todas as transações`);
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Rota não encontrada' }));
};

// Criar servidor
const PORT = process.env.PORT || 3000;
const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Mock Server para PoC Vulnerável');
  console.log('='.repeat(60));
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
  console.log('\n📊 Rotas disponíveis:');
  console.log(`   POST http://localhost:${PORT}/api/login`);
  console.log(`   GET  http://localhost:${PORT}/api/status`);
  console.log('\n👤 Credenciais de teste:');
  console.log('   - comprador / senha123');
  console.log('   - vendedor / senha123');
  console.log('   - admin / senha123');
  console.log('\n⚠️  Este servidor utiliza HTTP (inseguro) propositalmente');
  console.log('='.repeat(60) + '\n');
});

// Manipular Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n❌ Servidor interrompido');
  process.exit(0);
});
