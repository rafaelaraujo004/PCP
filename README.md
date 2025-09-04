# Controle Lavador (HTML + CSS + JavaScript)

## 🚀 Funcionalidades Principais
- **Registros Completos**: CRUD com filtros avançados por status, responsável, frente e período
- **Dashboard Interativo**: KPIs em tempo real e 3 gráficos dinâmicos (Chart.js)
- **Configurações Flexíveis**: Gerenciamento de frentes e responsáveis
- **📊 Exportação Excel Avançada**: Dados organizados em múltiplas planilhas
- **Importação de Dados**: Suporte a arquivos JSON
- **Persistência Local**: Dados salvos automaticamente no navegador

## 📊 Nova Funcionalidade: Exportação Excel

A aplicação agora exporta dados em formato Excel (.xlsx) com **4 planilhas organizadas**:

### 1. **Planilha "Registros"**
- Todos os registros com formatação profissional
- Colunas ajustadas automaticamente
- Dados limpos e organizados

### 2. **Planilha "Resumo Geral"**
- Estatísticas completas do sistema
- Total de registros por status
- Consumo do lavador
- Lista de frentes e responsáveis cadastrados
- Data/hora da exportação

### 3. **Planilha "Por Responsável"**
- Breakdown detalhado por responsável
- Contadores por status (Programado, Em Processo, Finalizado)
- Visão gerencial clara

### 4. **Planilha "Por Frente"**
- Análise por frente de trabalho
- Distribuição de trabalhos por setor
- Acompanhamento de produtividade

## 🎯 Como Usar

1. **Abra `index.html`** no navegador
2. **Navegue pelos módulos**:
   - **Registros**: Gerencie dados completos
   - **Dashboard**: Visualize métricas e gráficos
3. **Exporte para Excel**: Clique em "📊 Exportar Excel" para baixar relatório completo
4. **Configure**: Ajuste frentes e responsáveis conforme necessário

## 🔧 Tecnologias
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Gráficos**: Chart.js
- **Exportação Excel**: SheetJS (XLSX)
- **Armazenamento**: localStorage
- **Interface**: Design responsivo com tema claro/escuro

## 📁 Estrutura dos Arquivos
```
├── index.html          # Página inicial com menu
├── registros.html      # Módulo de registros
├── dashboard.html      # Módulo de dashboard
├── app.js             # Lógica principal + exportação Excel
├── styles.css         # Estilos responsivos
└── README.md          # Esta documentação
```

## 🚀 Início Rápido
1. Baixe todos os arquivos
2. Abra `index.html` no navegador
3. Comece a usar imediatamente (dados de exemplo incluídos)
4. Exporte seus primeiros relatórios Excel!

---
**💡 Dica**: A exportação Excel funciona offline e gera nomes de arquivo com timestamp para organização automática.
