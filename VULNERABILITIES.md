# Vulnerable App PoC - Laboratório de Cibersegurança

## 🎯 Objetivo

Este aplicativo é um **Proof of Concept (PoC) intencionalmente vulnerável** para demonstrar falhas de segurança comuns em aplicativos móveis, conforme descrito na **OWASP Mobile Top 10**.

## 🚨 Vulnerabilidades Implementadas

### 1️⃣ **Insecure Communication (M1)**
- **Localização**: `services/authService.ts`
- **Descrição**: O endpoint de login utiliza **HTTP sem criptografia** em vez de HTTPS
- **Endpoint**: `http://192.168.1.100:3000/api/login`
- **Impacto**: Qualquer interceptação de rede (MITM) pode expor credenciais e tokens
- **Demonstração**:
  - Use ferramentas como `mitmproxy` ou `Wireshark`
  - Intercepte requisições HTTP
  - Observe credenciais em texto claro

### 2️⃣ **Insecure Data Storage (M2)**
- **Localização**: `context/AuthContext.tsx` (linha ~67)
- **Descrição**: Token e role salvos em `AsyncStorage` em **texto claro**
- **Código Vulnerável**:
  ```typescript
  await AsyncStorage.setItem('token', response.token);
  await AsyncStorage.setItem('role', response.role);
  ```
- **Impacto**: 
  - Qualquer app no device pode acessar `AsyncStorage`
  - Ferramentas de debug (Flipper, React DevTools) expõem os dados
  - Risco de roubo de sessão
- **Demonstração**:
  - Abra Expo DevTools
  - Navegue até a aba de Storage
  - Veja token e role em texto claro
  - Modifique manualmente

### 3️⃣ **Broken Access Control - Client-Side (M3)**
- **Localização**: `app/dashboard.tsx`
- **Descrição**: Controle de acesso baseado inteiramente no cliente
- **Lógica Vulnerável**:
  ```typescript
  if (role === 'comprador') { /* mostrar botão de comprador */ }
  if (role === 'vendedor') { /* mostrar botão de vendedor */ }
  if (role === 'administrador') { /* mostrar botão admin */ }
  ```
- **Impacto**:
  - Role é lida do `AsyncStorage` (modificável)
  - Usuário pode se tornar administrador modificando o `AsyncStorage`
  - Nenhuma validação no servidor
- **Demonstração**:
  1. Faça login como "comprador"
  2. Clique em "Modificar Role (Simular Ataque)"
  3. Selecione "Administrador"
  4. Observe o botão vermelho "Painel de Administração" aparecer
  5. Nenhuma autenticação do servidor necessária

## 📱 Como Usar

### Instalação
```bash
npm install
npx expo install @react-native-async-storage/async-storage
```

### Executar
```bash
npx expo start

# iOS
npx expo start --ios

# Android
npx expo start --android

# Web
npx expo start --web
```

### Credenciais de Teste
| Usuário | Senha | Role |
|---------|-------|------|
| comprador | senha123 | comprador |
| vendedor | senha123 | vendedor |
| admin | senha123 | administrador |

## 🔧 Estrutura do Projeto

```
vulnerable_app/
├── app/
│   ├── _layout.tsx              # Layout principal com navegação
│   ├── login.tsx                # Tela de login (M2 - dados em texto claro)
│   └── dashboard.tsx            # Tela de dashboard (M3 - acesso baseado no cliente)
├── services/
│   └── authService.ts           # Serviço de autenticação (M1 - HTTP)
├── context/
│   └── AuthContext.tsx          # Contexto de autenticação (M2 - armazenamento inseguro)
└── package.json
```

## 🎓 Exercícios Educacionais

### Exercício 1: Interceptar Requisições HTTP
**Objetivo**: Demonstrar insecure communication

**Passos**:
1. Configure um proxy HTTP (mitmproxy, Burp Suite, Charles)
2. Configure seu device/emulador para usar o proxy
3. Faça login
4. Observe a requisição POST com credenciais em texto claro
5. Capture o token de resposta

### Exercício 2: Modificar AsyncStorage
**Objetivo**: Demonstrar insecure data storage

**Passos**:
1. Use Expo DevTools ou React Native Debugger
2. Navegue até a aba Storage/AsyncStorage
3. Localize as chaves: `username`, `token`, `role`
4. Modifique `role` para "administrador"
5. Recarregue a tela
6. Observe novos botões de admin aparecendo

### Exercício 3: Simular Ataque de Privilege Escalation
**Objetivo**: Demonstrar broken access control

**Passos**:
1. Faça login como "comprador"
2. Clique em "Modificar Role (Simular Ataque)"
3. Selecione qualquer outro role
4. Observe que a tela muda sem comunicação com o servidor
5. Não há validação do servidor

### Exercício 4: Criar um Mock Server
**Objetivo**: Aprender a usar ferramentas de interceptação

**Exemplo com json-server**:
```bash
npm install -g json-server

# Criar db.json
echo '{
  "posts": [
    { "id": 1, "title": "foo" }
  ]
}' > db.json

# Iniciar server
json-server --host 192.168.1.X --port 3000 db.json
```

## 🛡️ Correções de Segurança (Para Referência)

### M1 - Usar HTTPS
```javascript
const response = await fetch('https://api.exemplo.com/api/login', { ... });
```

### M2 - Usar Secure Storage
```bash
npm install react-native-keychain
```
```typescript
import * as Keychain from 'react-native-keychain';
await Keychain.setGenericPassword('token', response.token);
```

### M3 - Validar no Servidor
```javascript
// Backend deve validar token e retornar role
const user = await validateToken(token); // Do servidor
if (!user) return 401;
const canAccessAdmin = user.role === 'administrador'; // Validar no servidor
```

## ⚖️ Aviso Legal

Esta aplicação é **APENAS PARA FINS EDUCACIONAIS** em ambientes controlados de laboratório. Não use em produção. Compreenda as implicações de segurança antes de implementar qualquer padrão vulnerável em aplicações reais.

## 📚 Referências

- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [Insecure Communication](https://owasp.org/www-community/attacks/Manipulator-in-the-middle_attack)
- [Insecure Data Storage](https://owasp.org/www-community/attacks/Sensitive_Data_Exposure)
- [Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

## 📝 Notas para Instrutores

Para usar este PoC em laboratório:
1. Configure um backend mock que responda em `http://192.168.1.X:3000/api/login`
2. Configure emuladores ou devices para interceptar requisições
3. Use ferramentas como Burp Suite Community ou mitmproxy
4. Documente as vulnerabilidades encontradas

---

**Desenvolvido para fins educacionais em laboratório de cibersegurança.**
