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
      message: 'Mock Server para PoC Vulnerável',
      routes: [
        'POST /api/login - Endpoint de login (HTTP inseguro)',
        'GET /api/status - Status do servidor',
      ],
      users: Object.keys(USERS),
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
