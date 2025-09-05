# 🚀 Configuração Rápida - JSONBin.io

## ⚡ Setup em 3 Minutos

### Passo 1: Criar Conta Gratuita
1. Acesse [jsonbin.io](https://jsonbin.io)
2. Clique em **"Create a Free Account"**
3. Faça login com email ou Google

### Passo 2: Obter API Key
1. Após login, vá em **"API Keys"** no menu
2. Copie sua **Master Key** (começa com `$2b$10$...`)

### Passo 3: Configurar Sistema
1. Abra o arquivo `jsonbin-config.js`
2. Substitua na linha 7:
```javascript
apiKey: 'YOUR_API_KEY', // ← Cole sua chave aqui
```

3. Exemplo:
```javascript
apiKey: '$2b$10$abcd1234...', // ← Sua chave real
```

### Passo 4: Testar
1. Abra `index.html` no navegador
2. Verifique o indicador no canto superior direito:
   - 🟢 **☁️ Nuvem** = Funcionando!
   - 🟡 **⚙️ Config** = Precisa configurar a chave
   - 🔴 **📵 Offline** = Problema de conexão

## 📊 Funcionalidades

### ✅ O que funciona:
- **Backup automático** na nuvem
- **Sincronização** entre dispositivos
- **Modo offline** completo
- **Indicador visual** de status
- **Fila de sincronização** quando offline

### 🎯 Benefícios:
- **Gratuito**: 10.000 requests/mês
- **Sem SQL**: Só JSON simples
- **Rápido**: 2 minutos para configurar
- **Confiável**: Backup sempre atualizado

## 🔧 Como Usar

1. **Normal**: Use o sistema normalmente
2. **Offline**: Dados salvos localmente
3. **Online**: Sincroniza automaticamente
4. **Multi-device**: Acesse de qualquer lugar

## 🆘 Problemas?

### ⚠️ Indicador mostra "Config"
**Solução**: Verifique se colocou a API key correta

### ⚠️ Indicador mostra "Erro"  
**Solução**: 
1. Verifique sua conexão
2. Confirme se a API key é válida
3. Teste em [jsonbin.io](https://jsonbin.io)

### ⚠️ Dados não sincronizam
**Solução**:
1. Abra o Console (F12)
2. Procure por erros
3. Verifique se está online

## 📱 Status do Indicador

| Ícone | Status | Significado |
|-------|--------|-------------|
| ☁️ | Nuvem | Conectado e sincronizando |
| 📱 | Local | Apenas local (sem config) |
| ⚙️ | Config | Precisa configurar API |
| 📵 | Offline | Sem internet |
| ⚠️ | Erro | Problema na conexão |

## 🎉 Pronto!

Seu sistema agora tem backup automático na nuvem!

### 📝 Estrutura dos Dados
```json
{
  "dados": [...], // Array com todos os registros
  "meta": {...},  // Configurações (frentes, responsáveis)
  "lastUpdate": "2025-09-05T10:30:00Z"
}
```

---
**💡 Dica**: A conta gratuita permite 10.000 requests/mês, que é suficiente para uso normal do sistema.
