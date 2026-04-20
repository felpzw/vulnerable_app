# 🔓 Vulnerable App - PoC para Laboratório de Cibersegurança

[![Expo](https://img.shields.io/badge/Expo-54.0+-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81+-green.svg)](https://reactnative.dev)
[![License](https://img.shields.io/badge/License-Educational-yellow.svg)](#license)

Uma aplicação React Native **intencionalmente vulnerável** para demonstrar falhas de segurança comuns em aplicativos móveis conforme descrito na **OWASP Mobile Top 10**.

## 🎯 Objetivo

Este PoC foi desenvolvido para **fins educacionais** em laboratórios de cibersegurança, permitindo que estudantes:

- ✅ Entendam como vulnerabilidades são exploradas
- ✅ Identifiquem sinais de segurança fraca em código
- ✅ Pratiquem técnicas de penetration testing em ambiente controlado
- ✅ Aprendam a corrigir vulnerabilidades comuns

## 🚨 Vulnerabilidades Implementadas

| # | Vulnerabilidade | Localização | Severidade | Status |
|---|-----------------|-------------|-----------|--------|
| M1 | Insecure Communication | `services/authService.ts` | 🔴 Crítica | ✅ Implementada |
| M2 | Insecure Data Storage | `context/AuthContext.tsx` | 🔴 Crítica | ✅ Implementada |
| M3 | Broken Access Control | `app/dashboard.tsx` | 🔴 Crítica | ✅ Implementada |

### M1 - Insecure Communication (HTTP)
```typescript
// ❌ VULNERÁVEL: HTTP sem criptografia
await fetch('http://192.168.1.100:3000/api/login', { ... })
```

**Risco**: Qualquer interceptação de rede expõe credenciais.

### M2 - Insecure Data Storage
```typescript
//❌ VULNERÁVEL: Salvando em AsyncStorage em texto claro
await AsyncStorage.setItem('token', response.token);
await AsyncStorage.setItem('role', response.role);
```

**Risco**: Qualquer app no device pode acessar os dados.

### M3 - Broken Access Control
```typescript
// ❌ VULNERÁVEL: Verificação apenas no cliente
if (role === 'administrador') {
  // Mostrar recursos admin
}
```

**Risco**: Usuário pode modificar `role` e acessar recursos restritos.

## ⚡ Quick Start

### 1️⃣ Instalação
```bash
# Clonar/acessar o projeto
cd vulnerable_app

# Instalar dependências
npm install
npx expo install @react-native-async-storage/async-storage
```

### 2️⃣ Iniciar Mock Server
```bash
# Em outro terminal
node mock-server.js
```

### 3️⃣ Executar a Aplicação
```bash
# Iniciar Expo
npx expo start

# Escanear QR com Expo Go ou usar emulador
```

### 4️⃣ Testar Vulnerabilidades
```bash
# Executar script de testes
bash test-vulnerabilities.sh
```

## 👤 Credenciais de Teste

| Usuário | Senha | Role |
|---------|-------|------|
| `comprador` | `senha123` | comprador |
| `vendedor` | `senha123` | vendedor |
| `admin` | `senha123` | administrador |

## 🧪 Exercícios de Exploração

### Exercício 1: Interceptar Requisições HTTP
**Tempo**: 15-20 minutes

1. Configure um proxy HTTP (mitmproxy, Burp Suite)
2. Configure seu emulador para usar o proxy
3. Faça login na aplicação
4. Observe a requisição POST com credenciais **em texto claro**
5. Capture o token de resposta

**Material suplementar**: Veja `SETUP.md` → "Ferramentas Recomendadas"

### Exercício 2: Modificar AsyncStorage
**Tempo**: 10-15 minutos

1. Abra Expo DevTools (`npx expo start`, depois `j`)
2. Navegue até "Storage" ou "AsyncStorage"
3. Procure pelos valores: `username`, `token`, `role`
4. **Modifique** `role` para `"administrador"`
5. Recarregue a app
6. Veja novos botões de admin aparecerem

**Material suplementar**: Veja `SETUP.md` → "Método 1 - Expo DevTools"

### Exercício 3: Simular Ataque de Privilege Escalation
**Tempo**: 5-10 minutos

1. Faça login como `comprador`
2. Na tela de Dashboard, clique em **"Modificar Role (Simular Ataque)"**
3. Selecione `"Administrador"`
4. Observe o botão vermelho "🔴 Painel de Administração" aparecer
5. Clique em "Logout" e faça login novamente
6. Você ainda tem **acesso de admin**

## 📂 Estrutura do Projeto

```
vulnerable_app/
├── app/
│   ├── _layout.tsx                  # Layout principal com navegação condicional
│   ├── login.tsx                    # 🔴 Tela de login (sem validação de senha)
│   └── dashboard.tsx                # 🔴 Tela de dashboard (controle no cliente)
│
├── services/
│   └── authService.ts               # 🔴 Serviço com HTTP inseguro
│
├── context/
│   └── AuthContext.tsx              # 🔴 Contexto com AsyncStorage inseguro
│
├── mock-server.js                   # Mock backend em HTTP
├── test-vulnerabilities.sh          # Script de teste automatizado
│
├── VULNERABILITIES.md               # Documentação detalhada de cada falha
├── SETUP.md                         # Guia de setup e troubleshooting
└── README.md                        # Este arquivo
```

## 🔧 Configuração para Diferentes Ambientes

### iOS Simulator
```typescript
// services/authService.ts
const response = await fetch('http://localhost:3000/api/login', {
```

### Android Emulator
```typescript
// services/authService.ts
const response = await fetch('http://10.0.2.2:3000/api/login', {
```

### Dispositivo Físico (Expo Go)
```typescript
// services/authService.ts
// Obter IP local: ifconfig getifaddr en0
const response = await fetch('http://192.168.X.X:3000/api/login', {
```

## 📚 Documentação Completa

- **[VULNERABILITIES.md](./VULNERABILITIES.md)** - Análise técnica de cada vulnerabilidade
- **[SETUP.md](./SETUP.md)** - Guia detalhado de setup e testes
- **[Referências OWASP](https://owasp.org/www-project-mobile-top-10/)** - Padrão de segurança

## 🛡️ Corrigir as Vulnerabilidades

### M1 - Usar HTTPS
```typescript
// ✅ SEGURO
const response = await fetch('https://api.exemplo.com/api/login', {
```

### M2 - Usar Secure Storage
```bash
npm install react-native-keychain
```
```typescript
// ✅ SEGURO
import * as Keychain from 'react-native-keychain';
await Keychain.setGenericPassword('token', response.token);
```

### M3 - Validar no Servidor
```typescript
// ✅ SEGURO: Backend valida token
const user = await fetch('https://api.com/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});

if (!user.isAdmin) throw new Error('Acesso negado');
```

## ⚖️ Aviso Legal

```
🔴 ESTE CÓDIGO É INTENCIONALMENTE VULNERÁVEL

❌ NÃO USE EM PRODUÇÃO
❌ NÃO USE EM DADOS REAIS
❌ NÃO USE FORA DE AMBIENTES CONTROLADOS

✅ USE APENAS PARA FINS EDUCACIONAIS
✅ USE APENAS EM LABORATÓRIOS DE CIBERSEGURANÇA
✅ USE APENAS EM AMBIENTES CONTROLADOS

Ao usar este código, você concorda que:
- Você entende as implicações de segurança
- Você terá responsabilidade legal pelo seu uso
- O autor não é responsável por uso indevido
```

## 🤝 Contribuições

Sugestões de melhorias para fins educacionais são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-vulnerabilidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova vulnerabilidade X'`)
4. Push para a branch (`git push origin feature/nova-vulnerabilidade`)
5. Abra um Pull Request

## 📞 Suporte Educacional

Para dúvidas sobre:
- **Segurança Mobile**: Consulte [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- **Setup/Instalação**: Veja `SETUP.md`
- **Vulnerabilidades**: Veja `VULNERABILITIES.md`

## 📄 Licença

Este projeto é fornecido **APENAS PARA FINS EDUCACIONAIS**. 

Você é responsável por entender e cumprir todas as leis aplicáveis em sua jurisdição ao usar este código.

---

**Desenvolvido para laboratório educacional de cibersegurança.**

**Última atualização**: 2026-04-20
