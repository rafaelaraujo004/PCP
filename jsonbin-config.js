// Configuração JSONBin.io - Banco de dados JSON gratuito
// INSTRUÇÕES RÁPIDAS:
// 1. Acesse https://jsonbin.io
// 2. Clique em "Create a Free Account"
// 3. Após login, vá em "API Keys" e copie sua chave
// 4. Substitua 'YOUR_API_KEY' pela sua chave real
// 5. Execute o sistema - um bin será criado automaticamente

const JSONBIN_CONFIG = {
  apiKey: '$2a$10$0S4xPtqnezFj8MFzG4nx7.l9Zh2ZYCu4ztZq4RZVi8Pw9BsUVfi6i', // Sua chave de acesso JSONBin.io
  baseUrl: 'https://api.jsonbin.io/v3',
  binId: null // Será preenchido automaticamente na primeira execução
};

// Classe para gerenciar dados com JSONBin.io
class JSONBinManager {
  constructor() {
    this.apiKey = JSONBIN_CONFIG.apiKey;
    this.baseUrl = JSONBIN_CONFIG.baseUrl;
    this.binId = localStorage.getItem('jsonbin_bin_id') || null;
    this.isOnline = navigator.onLine;
    this.isConfigured = this.apiKey !== 'YOUR_API_KEY';
    
    console.log('🔧 JSONBin Manager inicializado:');
    console.log('  - API Key configurada:', this.isConfigured);
    console.log('  - Online:', this.isOnline);
    console.log('  - Bin ID:', this.binId || 'Será criado automaticamente');
    
    // Monitorar conexão
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    console.log('📡 JSONBin Manager inicializado');
  }
  
  isReady() {
    return this.isConfigured && this.isOnline;
  }
  
  // Criar um novo bin
  async createBin(data) {
    if (!this.isReady()) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}/b`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.apiKey,
          'X-Bin-Name': 'controle-lavador-dados',
          'X-Bin-Private': 'false'
        },
        body: JSON.stringify({
          dados: data.dados || [],
          meta: data.meta || {},
          lastUpdate: new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      this.binId = result.metadata.id;
      localStorage.setItem('jsonbin_bin_id', this.binId);
      
      console.log('✅ Bin criado com sucesso:', this.binId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar bin:', error);
      return false;
    }
  }
  
  // Salvar dados
  async saveData(dados, meta) {
    console.log('💾 Tentativa de salvamento na nuvem:', {
      dados: dados?.length || 0,
      meta: Object.keys(meta || {}).length,
      isReady: this.isReady()
    });
    
    if (!this.isReady()) {
      console.log('📱 Offline ou não configurado - salvando apenas localmente');
      this.addToPendingSync(dados, meta);
      return false;
    }
    
    const data = {
      dados: dados || [],
      meta: meta || {},
      lastUpdate: new Date().toISOString()
    };
    
    try {
      // Se não tem bin, criar um novo
      if (!this.binId) {
        return await this.createBin(data);
      }
      
      // Atualizar bin existente
      const response = await fetch(`${this.baseUrl}/b/${this.binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.apiKey,
          'X-Bin-Versioning': 'false'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        // Se bin não existe mais, criar novo
        if (response.status === 404) {
          this.binId = null;
          localStorage.removeItem('jsonbin_bin_id');
          return await this.createBin(data);
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      console.log('☁️ Dados salvos na nuvem com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar na nuvem:', error);
      this.addToPendingSync(dados, meta);
      return false;
    }
  }
  
  // Carregar dados
  async loadData() {
    if (!this.isReady() || !this.binId) {
      return null;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/b/${this.binId}/latest`, {
        headers: {
          'X-Master-Key': this.apiKey
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('📄 Bin não encontrado, será criado no próximo salvamento');
          this.binId = null;
          localStorage.removeItem('jsonbin_bin_id');
        }
        return null;
      }
      
      const result = await response.json();
      console.log('📥 Dados carregados da nuvem');
      return {
        dados: result.record.dados || [],
        meta: result.record.meta || {}
      };
    } catch (error) {
      console.error('❌ Erro ao carregar da nuvem:', error);
      return null;
    }
  }
  
  // Sincronizar dados da nuvem
  async syncFromCloud() {
    const cloudData = await this.loadData();
    if (cloudData) {
      const localData = load();
      
      // Verificar se os dados da nuvem são mais recentes
      const cloudCount = cloudData.dados?.length || 0;
      
      if (cloudCount > 0) {
        save(cloudData.dados, cloudData.meta);
        console.log(`📥 Sincronizado: ${cloudCount} registros baixados da nuvem`);
        
        // Atualizar interface
        if (typeof renderTable === 'function') renderTable();
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof preencherListasAuxiliares === 'function') preencherListasAuxiliares();
      }
    }
  }
  
  // Adicionar à fila de sincronização
  addToPendingSync(dados, meta) {
    try {
      const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
      pending.push({
        dados,
        meta,
        timestamp: Date.now()
      });
      localStorage.setItem('pendingSync', JSON.stringify(pending));
      console.log('📝 Adicionado à fila de sincronização');
    } catch (error) {
      console.error('❌ Erro ao adicionar à fila:', error);
    }
  }
  
  // Sincronizar dados pendentes
  async syncPendingData() {
    if (!this.isReady()) return;
    
    try {
      const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
      if (pending.length === 0) return;
      
      console.log(`📤 Sincronizando ${pending.length} alterações pendentes...`);
      
      // Pegar a alteração mais recente
      const latest = pending[pending.length - 1];
      const success = await this.saveData(latest.dados, latest.meta);
      
      if (success) {
        localStorage.removeItem('pendingSync');
        console.log('✅ Sincronização pendente concluída');
      }
    } catch (error) {
      console.error('❌ Erro na sincronização pendente:', error);
    }
  }
  
  // Status da conexão
  getStatus() {
    return {
      configured: this.isConfigured,
      online: this.isOnline,
      ready: this.isReady(),
      binId: this.binId
    };
  }
  
  // Resetar configuração (para testes)
  reset() {
    this.binId = null;
    localStorage.removeItem('jsonbin_bin_id');
    localStorage.removeItem('pendingSync');
    console.log('🔄 Configuração resetada');
  }
}

// Instância global
window.jsonBinManager = new JSONBinManager();

// Função de teste para verificar se está funcionando
window.testarJSONBin = async function() {
  console.log('🧪 Iniciando teste detalhado do JSONBin...');
  
  const manager = window.jsonBinManager;
  const status = manager.getStatus();
  
  console.log('📊 Status atual:', status);
  console.log('🔑 API Key (primeiros 10 chars):', manager.apiKey.substring(0, 10) + '...');
  
  if (!status.configured) {
    console.log('❌ API Key não configurada');
    return false;
  }
  
  if (!status.online) {
    console.log('❌ Sem conexão com internet');
    return false;
  }
  
  // Primeiro, testar se a API key é válida fazendo uma requisição simples
  try {
    console.log('🔍 Testando autenticação...');
    const authTest = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': manager.apiKey,
        'X-Bin-Name': 'teste-auth-' + Date.now(),
        'X-Bin-Private': 'false'
      },
      body: JSON.stringify({ teste: true, timestamp: new Date().toISOString() })
    });
    
    console.log('📡 Status da resposta:', authTest.status);
    
    if (authTest.status === 401) {
      console.log('❌ Erro 401: API Key inválida');
      console.log('💡 Verifique se copiou a chave correta do JSONBin.io');
      return false;
    }
    
    if (authTest.status === 429) {
      console.log('⚠️ Limite de requests excedido, tente novamente em alguns minutos');
      return false;
    }
    
    if (!authTest.ok) {
      const errorText = await authTest.text();
      console.log('❌ Erro na autenticação:', authTest.status, errorText);
      return false;
    }
    
    const result = await authTest.json();
    console.log('✅ Autenticação funcionou! Bin de teste criado:', result.metadata.id);
    
    // Agora testar o salvamento real
    const dadosTeste = [
      { id: 'teste123', descricao: 'Teste de conexão', status: 'PROGRAMADO' }
    ];
    const metaTeste = { teste: true, timestamp: new Date().toISOString() };
    
    console.log('🔄 Testando salvamento dos dados reais...');
    const sucesso = await manager.saveData(dadosTeste, metaTeste);
    
    if (sucesso) {
      console.log('✅ Teste concluído com sucesso! Sistema funcionando perfeitamente.');
      return true;
    } else {
      console.log('❌ Falha no teste de salvamento dos dados reais');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return false;
  }
};

// Auto-teste após 3 segundos (quando tudo estiver carregado)
setTimeout(async () => {
  console.log('🔍 Executando auto-teste do JSONBin...');
  const resultado = await window.testarJSONBin();
  
  if (resultado) {
    console.log('🎉 Sistema configurado e funcionando!');
  } else {
    console.log('⚠️ Verificar configuração - pode haver problema');
  }
}, 3000);

// Função para testar salvamento direto (pode ser chamada manualmente)
window.forcarSalvamento = async function() {
  console.log('🚀 Forçando salvamento de teste...');
  
  // Criar dados de teste
  const dadosTeste = [
    {
      id: 'teste_' + Date.now(),
      descricao: 'Teste de salvamento ' + new Date().toLocaleString(),
      tag1: 'TESTE',
      tag2: 'LAVAGEM',
      status: 'PROGRAMADO',
      responsavel: 'Sistema',
      frente: 'Teste'
    }
  ];
  
  const metaTeste = {
    frentes: ['EVA', 'TESTE'],
    responsaveis: ['Sistema', 'Teste'],
    consumo: 0,
    ultimoTeste: new Date().toISOString()
  };
  
  // Usar a função save do sistema
  if (typeof save === 'function') {
    console.log('📤 Chamando função save do sistema...');
    await save(dadosTeste, metaTeste);
  } else {
    console.log('❌ Função save não encontrada');
    // Tentar salvar diretamente
    if (window.jsonBinManager) {
      await window.jsonBinManager.saveData(dadosTeste, metaTeste);
    }
  }
  
  console.log('✅ Teste de salvamento concluído');
};

// Função específica para verificar se a chave API está válida
window.verificarChaveAPI = async function() {
  console.log('🔑 Verificando se a chave API está válida...');
  
  const chave = '$2a$10$0S4xPtqnezFj8MFzG4nx7.l9Zh2ZYCu4ztZq4RZVi8Pw9BsUVfi6i';
  
  try {
    const response = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': chave,
        'X-Bin-Name': 'teste-chave-' + Date.now()
      },
      body: JSON.stringify({ teste: 'verificacao', data: new Date().toISOString() })
    });
    
    console.log('📡 Código de resposta:', response.status);
    
    if (response.status === 401) {
      console.log('❌ ERRO: A chave API não é válida ou expirou');
      console.log('💡 Soluções possíveis:');
      console.log('1. Vá para https://jsonbin.io/login');
      console.log('2. Entre na sua conta');
      console.log('3. Vá em Profile > API Keys');
      console.log('4. Copie a Master Key atual');
      console.log('5. Cole a nova chave no código');
      return false;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCESSO: Chave API válida!');
      console.log('📦 Bin de teste criado:', data.metadata.id);
      return true;
    } else {
      console.log('⚠️ Resposta inesperada:', response.status);
      const text = await response.text();
      console.log('📄 Detalhes:', text);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return false;
  }
};

// Função para detectar se dados locais foram limpos e recuperar da nuvem
window.detectarRecuperacaoNecessaria = async function() {
  const temDadosLocais = localStorage.getItem('controleLavador_dados_v1');
  const dadosLocais = temDadosLocais ? JSON.parse(temDadosLocais) : [];
  
  console.log('🔍 Verificando necessidade de recuperação...');
  console.log('📱 Dados locais encontrados:', dadosLocais.length);
  
  // Se não há dados locais, tentar recuperar da nuvem
  if (dadosLocais.length === 0 && window.jsonBinManager) {
    console.log('🔄 Tentando recuperar dados da nuvem...');
    
    try {
      const cloudData = await window.jsonBinManager.loadData();
      
      if (cloudData && cloudData.dados && cloudData.dados.length > 0) {
        console.log('✅ Dados recuperados da nuvem:', cloudData.dados.length, 'registros');
        
        // Restaurar dados locais
        localStorage.setItem('controleLavador_dados_v1', JSON.stringify(cloudData.dados));
        localStorage.setItem('controleLavador_meta_v1', JSON.stringify(cloudData.meta || {}));
        
        // Notificar usuário
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed; top: 20px; right: 20px; 
          background: var(--success, #4CAF50); color: white; 
          padding: 15px 20px; border-radius: 8px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
          z-index: 1000; font-weight: 500;
          border-left: 4px solid rgba(255,255,255,0.3);
        `;
        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>☁️</span>
            <span>Dados recuperados da nuvem!</span>
          </div>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
            ${cloudData.dados.length} registros restaurados
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 5000);
        
        // Recarregar página para aplicar dados recuperados
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
        return true;
      } else {
        console.log('📭 Nenhum dado encontrado na nuvem para recuperar');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao tentar recuperar dados:', error);
      return false;
    }
  } else {
    console.log('✅ Dados locais OK, nenhuma recuperação necessária');
    return false;
  }
};

// Executar verificação automática
setTimeout(() => {
  console.log('🚀 Iniciando verificação automática...');
  window.verificarChaveAPI();
  
  // Verificar se precisa recuperar dados após limpar cache
  setTimeout(() => {
    window.detectarRecuperacaoNecessaria();
  }, 2000);
}, 3000);
