#!/bin/bash

# Script de Teste - Vulnerable App PoC
# Este script testa as 3 vulnerabilidades principais

set -e

echo ""
echo "=================================================="
echo "🧪 Teste de Vulnerabilidades - PoC"
echo "=================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
MOCK_SERVER_URL="http://localhost:3000"
TIMEOUT=5

# Função para verificar se servidor mock está rodando
check_mock_server() {
  echo -e "${BLUE}[1/3]${NC} Verificando Mock Server..."

  if timeout $TIMEOUT curl -s "$MOCK_SERVER_URL/api/status" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Mock Server está rodando em $MOCK_SERVER_URL"
    return 0
  else
    echo -e "${RED}✗${NC} Mock Server não está respondendo"
    echo ""
    echo "   Inicie o servidor com:"
    echo "   ${YELLOW}node mock-server.js${NC}"
    echo ""
    return 1
  fi
}

# Função para testar requisição HTTP (não HTTPS)
test_insecure_communication() {
  echo ""
  echo -e "${BLUE}[2/3]${NC} Testando Insecure Communication (HTTP)..."

  # Testar se a API está em HTTP (não HTTPS)
  if [[ "$MOCK_SERVER_URL" == http://* ]]; then
    echo -e "${GREEN}✓${NC} API está usando HTTP (inseguro)"
    echo "   Endpoint: $MOCK_SERVER_URL/api/login"
    echo "   Status: SEM CRIPTOGRAFIA"
  else
    echo -e "${RED}✗${NC} API está usando HTTPS"
  fi
}

# Função para testar credenciais
test_login() {
  echo ""
  echo -e "${BLUE}[3/3]${NC} Testando Login..."

  local response=$(curl -s -X POST "$MOCK_SERVER_URL/api/login" \
    -H "Content-Type: application/json" \
    -d '{
      "username": "comprador",
      "password": "senha123"
    }')

  if echo "$response" | grep -q '"token"'; then
    echo -e "${GREEN}✓${NC} Login bem-sucedido!"

    # Extrair token
    local token=$(echo "$response" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
    local role=$(echo "$response" | grep -o '"role":"[^"]*"' | head -1 | cut -d'"' -f4)

    echo ""
    echo "   Resposta recebida:"
    echo "   ${YELLOW}Token:${NC} $token"
    echo "   ${YELLOW}Role:${NC} $role"
    echo ""
    echo -e "${RED}⚠️  VULNERABILIDADE DETECTADA${NC}: Token em texto claro na rede!"

  else
    echo -e "${RED}✗${NC} Erro no login"
    echo "   Resposta: $response"
  fi
}

# Função para resumo de vulnerabilidades
print_summary() {
  echo ""
  echo "=================================================="
  echo "📋 Resumo de Vulnerabilidades"
  echo "=================================================="
  echo ""

  echo -e "${RED}[M1] Insecure Communication${NC}"
  echo "    ├─ HTTP sem criptografia: $MOCK_SERVER_URL"
  echo "    ├─ Credenciais visíveis na rede"
  echo "    └─ Risco: MITM (Man-in-the-Middle)"
  echo ""

  echo -e "${RED}[M2] Insecure Data Storage${NC}"
  echo "    ├─ Token salvo em AsyncStorage (texto claro)"
  echo "    ├─ Role salvo em AsyncStorage (texto claro)"
  echo "    └─ Risco: Outro app pode acessar"
  echo ""

  echo -e "${RED}[M3] Broken Access Control${NC}"
  echo "    ├─ Verificação de role no cliente"
  echo "    ├─ Nenhuma validação no servidor"
  echo "    └─ Risco: Escalação de privilégio"
  echo ""

  echo "=================================================="
  echo "🎯 Próximas Etapas"
  echo "=================================================="
  echo ""
  echo "1. Abra a aplicação em seu emulador"
  echo "2. Faça login com: comprador / senha123"
  echo "3. Teste modificar o role no Dashboard"
  echo ""
  echo "Para análise detalhada:"
  echo "   📖 Leia: VULNERABILITIES.md"
  echo "   📖 Leia: SETUP.md"
  echo ""
}

# Executar testes
main() {
  check_mock_server || exit 1
  test_insecure_communication
  test_login
  print_summary
}

# Executar
main
