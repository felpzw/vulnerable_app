# 🚀 Guia de Setup e Testes - Vulnerable App PoC

## Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn
- Expo CLI: `npm install -g expo-cli`
- Um emulador Android/iOS ou Expo Go no seu telefone

## 1️⃣ Instalação

### Passo 1: Instalar dependências
```bash
cd vulnerable_app
npm install
npx expo install @react-native-async-storage/async-storage
```

### Passo 2: Iniciar o Mock Server (em outro terminal)
```bash
node mock-server.js
```

Você verá:
```
============================================================
🚀 Mock Server para PoC Vulnerável
============================================================
Servidor rodando em: http://localhost:3000

📊 Rotas disponíveis:
   POST http://localhost:3000/api/login
   GET  http://localhost:3000/api/status

👤 Credenciais de teste:
   - comprador / senha123
   - vendedor / senha123
   - admin / senha123

⚠️  Este servidor utiliza HTTP (inseguro) propositalmente
============================================================
```

## 2️⃣ Configurar Endereço IP do Mock Server

### Para iOS Simulator
```bash
# Descobrir IP local
ipconfig getifaddr en0  # macOS
# ou
hostname -i  # Linux

# Atualizar em: services/authService.ts linha ~17
# Mudar: http://192.168.1.100:3000 para http://SEU_IP:3000
```

### Para Android Emulator
O emulador Android acessa `localhost` como `10.0.2.2`
```typescript
// services/authService.ts
const response = await fetch('http://10.0.2.2:3000/api/login', {
```

### Para Dispositivo Físico/Expo Go
```typescript
// services/authService.ts
// Use o IP local da sua máquina
const response = await fetch('http://192.168.x.x:3000/api/login', {
```

## 3️⃣ Executar a Aplicação

### Opção A: Desenvolvimento com Expo
```bash
npx expo start

# Escanear QR code com:
# - Expo Go (iOS/Android)
# - iOS Simulator (i)
# - Android Emulator (a)
```

### Opção B: Compilar para Android
```bash
npx expo build:android -t apk
# ou (novo sistema)
eas build --platform android --local
```

### Opção C: Compilar para iOS
```bash
eas build --platform ios
```

## 4️⃣ Testar as Vulnerabilidades

### 🔴 Teste 1: Insecure Communication

**Objetivo**: Interceptar requisições HTTP

**Ferramentas**:
- mitmproxy
- Burp Suite Community
- Charles Proxy
- Wireshark

**Passos**:
1. Instale e configure um proxy HTTP
2. Configure seu emulador/device para usar o proxy
3. Abra a aplicação
4. Entre com: `comprador` / `senha123`
5. No proxy, veja a requisição:
   ```
   POST http://192.168.x.x:3000/api/login
   Content-Type: application/json
   
   {"username":"comprador","password":"senha123"}
   ```
6. Veja a resposta com token em texto claro

### 🔴 Teste 2: Insecure Data Storage

**Objetivo**: Acessar e modificar dados no AsyncStorage

**Método 1 - Expo DevTools**:
```bash
# Durante expo start, pressione:
# - 'j' para abrir DevTools
# - Clique em "Storage" ou "AsyncStorage"
# Veja: username, token, role em texto claro
```

**Método 2 - React Native Debugger**:
```bash
# Instalar
brew install react-native-debugger  # macOS
# ou baixar em: https://github.com/jhen0409/react-native-debugger/releases

# Iniciar debugger
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

**Método 3 - Código Manual**:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ver dados
const username = await AsyncStorage.getItem('username');
const token = await AsyncStorage.getItem('token');
const role = await AsyncStorage.getItem('role');

console.log({ username, token, role });

// Modificar dados
await AsyncStorage.setItem('role', 'administrador');
```

### 🔴 Teste 3: Broken Access Control

**Objetivo**: Elevar privilégios sem autenticação do servidor

**Passos**:
1. Faça login como `comprador` / `senha123`
2. Na tela de Dashboard, clique em **"Modificar Role (Simular Ataque)"**
3. Selecione **"Administrador"**
4. Observe o botão vermelho "🔴 Painel de Administração" aparecer
5. Clique em **"Logout"** e faça login novamente
6. Você ainda tem acesso de admin (dados persistem)

**Simulação Manual**:
```javascript
// No console do Debugger ou DevTools
await AsyncStorage.setItem('role', 'administrador');

// Recarregue a app (Ctrl+R ou Cmd+R)
// Agora você é um admin
```

## 5️⃣ Ferramentas Recomendadas para Análise

### Proxy HTTP
```bash
# mitmproxy (recomendado para iniciantes)
pip install mitmproxy
mitmproxy -p 8080

# ou com Homebrew (macOS)
brew install mitmproxy
mitmproxy
```

### Acessar Storage
- **Expo DevTools** (built-in em `npx expo start`)
- **React Native Debugger** (https://github.com/jhen0409/react-native-debugger)
- **Flipper** (https://fbflipper.com/)
- **Android Studio Device File Explorer** (para Android)

### Análise de Network
- **Wireshark** (packet sniffer)
- **tcpdump** (Linux/macOS)
- **Burp Suite Community** (proxy avançado)

## 6️⃣ Troubleshooting

### ❌ "Cannot reach backend"
```bash
# Verificar se mock server está rodando
curl http://localhost:3000/api/status

# Verificar IP correto
ipconfig getifaddr en0  # macOS
# Atualizar em services/authService.ts
```

### ❌ "AsyncStorage not working"
```bash
# Reinstalar pacote
npm uninstall @react-native-async-storage/async-storage
npx expo install @react-native-async-storage/async-storage

# Limpar cache Expo
expo start --clear
```

### ❌ "Proxy não intercepta requisições"
- Configurar HTTPS para o proxy (Some proxies requerem certificado)
- Tentar HTTP_PROXY e HTTPS_PROXY
- Verificar firewall do device

## 7️⃣ Exercícios Avançados

### Exercício 1: Capturar Token e Fazer Replay
```bash
# 1. Intercepte requisição de login no mitmproxy
# 2. Copie o token da resposta
# 3. Use o token em outra máquina:

curl -H "Authorization: Bearer TOKEN_AQUI" \
     http://192.168.x.x:3000/api/protected
```

### Exercício 2: Modificar Role No Middleware
Se você estiver analisando, crie um interceptor:
```javascript
// Simular modificação MITM
const response = {
  ...original_response,
  role: 'administrador'  // Modificar papel!
};
```

### Exercício 3: Desabilitar SSL Pinning
Se houvesse SSL pinning, você:
1. Usaria HookedMethodBytecode (Frida)
2. Ou modificaria o APK com apktool
3. Removeria a validação de certificado

## 📊 Checklist de Segurança

Após testar as vulnerabilidades:

- [ ] HTTP transformado para HTTPS
- [ ] Token movido para Secure Enclave/Keychain
- [ ] Role validada no servidor
- [ ] Implementado SSL Pinning
- [ ] Criptografia de dados sensíveis em repouso
- [ ] Logs de segurança implementados
- [ ] Rate limiting no backend
- [ ] Validação de entrada no backend

## 🎓 Próximos Passos

1. Leia [VULNERABILITIES.md](./VULNERABILITIES.md) para entender cada falha
2. Pesquise corrigir cada vulnerabilidade
3. Implemente as correções
4. Teste novamente para confirmar

---

**Dúvidas?** Consulte a documentação em `VULNERABILITIES.md`
