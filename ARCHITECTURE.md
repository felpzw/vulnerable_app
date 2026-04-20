# 📊 Diagrama Técnico - Fluxo de Autenticação Vulnerável

## 1. Fluxo de Login (com vulnerabilidades)

```
┌─────────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO REACT NATIVE                       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ 1. LoginScreen
                             │ username + password
                             ▼
        ╔════════════════════════════════════════════════════════╗
        ║  🔴 VULNERABILIDADE M1: HTTP SEM CRIPTOGRAFIA         ║
        ║  POST http://192.168.1.100:3000/api/login             ║
        ║  {"username":"comprador","password":"senha123"}       ║
        ╚════════════════════════════════════════════════════════╝
                             │
                             │ 🚨 Interceptável na rede!
                             │    (MITM, Wireshark, mitmproxy)
                             │
                             ▼
        ┌─────────────────────────────────────────────────────┐
        │          MOCK SERVER (HTTP - INSEGURO)              │
        │                                                      │
        │  Validação simples de credenciais                  │
        │  Retorna token fictício + role                    │
        └─────────────────────────────────────────────────────┘
                             │
                             │ 2. Response JSON
                             │ {"token":"fake_token...","role":"comprador"}
                             ▼
        ╔════════════════════════════════════════════════════════╗
        ║  🔴 VULNERABILIDADE M2: INSECURE DATA STORAGE         ║
        ║  async Storage.setItem('token', response.token)       ║
        ║  AsyncStorage.setItem('role', response.role)          ║
        ║                                                        ║
        ║  💾 Salvos em texto claro!                           ║
        ║  ❌ Qualquer app pode acessar                        ║
        ╚════════════════════════════════════════════════════════╝
                             │
                             │ 3. Navegar para Dashboard
                             ▼
        ┌─────────────────────────────────────────────────────┐
        │         DASHBOARD SCREEN                            │
        │                                                      │
        │  Ler role do AsyncStorage:                        │
        │  role = await AsyncStorage.getItem('role')       │
        └─────────────────────────────────────────────────────┘
                             │
                             ▼
        ╔════════════════════════════════════════════════════════╗
        ║  🔴 VULNERABILIDADE M3: BROKEN ACCESS CONTROL        ║
        ║                                                        ║
        ║  if (role === 'administrador') {                    ║
        ║    mostrar "Painel de Administração"                ║
        ║  }                                                    ║
        ║                                                        ║
        ║  ❌ Nenhuma validação no servidor!                 ║
        ║  ❌ Role verificado apenas no cliente!             ║
        ╚════════════════════════════════════════════════════════╝
```

## 2. Diagrama de Exploração - Modificar Role

```
CENÁRIO NORMAL (Usuário Legítimo):
──────────────────────────────────

comprador faça login:
    ↓
    AsyncStorage contém: role = "comprador"
    ↓
    Dashboard mostra: "Ver Catálogo", "Carrinho"
    ↓ Logout


CENÁRIO EXPLORADO (Atacante):
──────────────────────────────

1. Comprador faz login:
    ↓
    AsyncStorage: role = "comprador"
    ↓
    Dashboard mostra: "Ver Catálogo"

2. Atacante usa Expo DevTools/Debugger:
    ↓
    ┌─────────────────────────────────┐
    │ AsyncStorage.setItem(           │
    │   'role',                       │
    │   'administrador'  ← MODIFICADO │
    │ )                               │
    └─────────────────────────────────┘
    ↓ Recarrega app

3. Dashboard recarrega:
    ↓
    AsyncStorage: role = "administrador"  ← AGORA É ADMIN!
    ↓
    Dashboard mostra: 🔴 "Painel de Administração"
                      🔴 "Gerenciar Usuários"
                      🔴 "Logs de Sistema"
    ↓ SEM LOGOUT NECESSÁRIO! ✅ ACESSO OBTIDO!

4. Resultado:
    ✅ Escalação instantânea de privilégio
    ✅ Nenhuma validação do servidor
    ✅ Nenhuma resposta de segurança ativada
```

## 3. Arquitetura - Onde Estão as Vulnerabilidades

```
┌─────────────────────────────────────────────────────────────┐
│                CLIENT (REACT NATIVE)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ app/login.tsx                                       │  │
│  │ - Input de senha em texto claro                    │  │
│  │ - Chama authService.login()                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                      │                                      │
│                      ▼                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ services/authService.ts                            │  │
│  │ 🔴 M1: fetch('http://...')  ← SEM HTTPS           │  │
│  └──────────────────────────────────────────────────────┘  │
│                      │                                      │
│                      ▼                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ context/AuthContext.tsx                            │  │
│  │ 🔴 M2: AsyncStorage.setItem('token', ...)         │  │
│  │ 🔴 M2: AsyncStorage.setItem('role', ...)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                      │                                      │
│                      ▼                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ app/dashboard.tsx                                  │  │
│  │ 🔴 M3: if (role === 'admin') { ... }              │  │
│  │ 🔴 M3: Nenhuma chamada ao servidor para validar    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
           ║
           ║ 🔴 SEM CRIPTOGRAFIA NESTA CONEXÃO
           ║
           ▼
┌─────────────────────────────────────────────────────────────┐
│                SERVER (MOCK)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  mock-server.js (HTTP port 3000)                          │
│  - Aceita POST /api/login                                 │
│  - Valida username + password                            │
│  - Retorna token simples + role                          │
│                                                             │
│  ⚠️  Não valida que cliente é quem diz ser             │
│  ⚠️  Não implementa HTTPS                               │
│  ⚠️  Não valida token em requisições subsequentes       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 4. Matriz de Ameaças

```
┌─────────────────────┬──────────────────┬───────────────────┐
│ Vulnerabilidade     │ Vetor de Ataque  │ Impacto           │
├─────────────────────┼──────────────────┼───────────────────┤
│ M1: HTTP Inseguro   │ MITM Attack      │ Token roubado    │
│                     │ Wireshark        │ Sessão hijacked  │
│                     │ mitmproxy        │ Acesso não-aut. │
│                     │ Proxy HTTP       │                   │
├─────────────────────┼──────────────────┼───────────────────┤
│ M2: Data Storage    │ Debug Tools      │ Token exposto    │
│                     │ Flipper          │ Role modificado │
│                     │ DevTools         │ Outros dados    │
│                     │ ADB              │                   │
├─────────────────────┼──────────────────┼───────────────────┤
│ M3: Access Control  │ Storage Modify   │ Privesc (user→   │
│                     │ Role Change      │    admin)       │
│                     │ Local Exploit    │ Acesso irrestrito│
│                     │ No server check  │                   │
└─────────────────────┴──────────────────┴───────────────────┘
```

## 5. Timeline de Exploração

```
T+0s    ┌─ Usuário faz login como "comprador"
        └─ Credenciais enviadas via HTTP (M1)
           📍 INTERCEPTAÇÃO POSSÍVEL

T+1s    ├─ Token recebido e salvo em AsyncStorage (M2)
        └─ 📍 TODO HTTP VISÍVEL NA REDE

T+2s    ├─ Dashboard carregado
        ├─ Role lida do AsyncStorage: "comprador"
        └─ Apenas botão de catálogo exibido

T+3s    ├─ Atacante abre DevTools
        ├─ Modifica AsyncStorage: role = "administrador"
        └─ 📍 NÃO HÁ VALIDAÇÃO DO SERVIDOR

T+4s    ├─ App recarregado
        ├─ Role lida: "administrador"
        ├─ Novo botão "Painel de Admin" exibido
        └─ ✅ ESCALAÇÃO COMPLETA!

T+5s    └─ Atacante tem acesso total sem validação de servidor
```

## 6. Checklist de Testes

```
TESTE 1: HTTP Inseguro (M1)
═════════════════════════════
  ☐ Configurar proxy HTTP (mitmproxy, Burp)
  ☐ Fazer login
  ☐ Ver requisição em texto claro no proxy
  ☐ Copiar token da resposta
  ☐ ✅ PROVA: Token visível na rede

TESTE 2: AsyncStorage Inseguro (M2)
═════════════════════════════════════
  ☐ Abrir Expo DevTools (npx expo start → j)
  ☐ Navegar to Storage/AsyncStorage
  ☐ Ver chaves: username, token, role
  ☐ Modificar role para "administrador"
  ☐ Recarregar app
  ☐ ✅ PROVA: Novo acesso apareceu

TESTE 3: Access Control Cliente (M3)
══════════════════════════════════════
  ☐ Fazer login como "comprador"
  ☐ Clique em "Modificar Role (Simular Ataque)"
  ☐ Selecionar "administrador"
  ☐ Verificar desaparecimento de botão de comprador
  ☐ Verificar aparecimento de botão de admin
  ☐ Ver que não houve chamada ao servidor
  ☐ ✅ PROVA: Mudança instantânea de privilégio
```

---

**Diagrama atualizado**: 2026-04-20

Para análise completa, veja:
- `VULNERABILITIES.md` - Detalhes técnicos
- `SETUP.md` - Guia de testes práticos
