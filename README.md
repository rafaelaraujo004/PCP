# FORMULÁRIO 384 - TRANSFERÊNCIA DE EQUIPAMENTOS U&M

## 📋 Descrição
Este é um modelo digital interativo do Formulário 384 da empresa U&M para transferência de equipamentos. O sistema permite preenchimento digital e exportação para Excel mantendo todas as formatações originais.

## 🚀 Características
- ✅ Interface idêntica ao formulário original U&M
- ✅ Preenchimento digital intuitivo 
- ✅ Exportação para Excel com formatação preservada
- ✅ Auto-salvamento dos dados
- ✅ Visualização prévia antes da exportação
- ✅ Responsivo (funciona em mobile e desktop)
- ✅ Adição dinâmica de novos itens

## 📁 Estrutura do Projeto
```
FORM/
├── index.html          # Arquivo principal do formulário
├── styles.css          # Estilos CSS (formatação idêntica ao original)
├── script.js           # JavaScript para funcionalidades
├── logo.svg           # Logo da U&M
└── README.md          # Este arquivo de instruções
```

## 🔧 Como Usar

### 1. Abrir o Formulário
- Abra o arquivo `index.html` em qualquer navegador web moderno
- Chrome, Firefox, Safari ou Edge (versões recentes)

### 2. Preenchimento
- **Informações Básicas**: Preencha fabricante, modelo, ano, série, etc.
- **Estrutura do Equipamento**: Avalie cada item e marque OK/NOK/N/A
- **Cabine**: Verifique portas, retrovisores, vidros, etc.

### 3. Funcionalidades Especiais
- **➕ Adicionar Item**: Adiciona novos itens à estrutura do equipamento
- **👁️ Visualizar Dados**: Mostra prévia de todos os dados preenchidos
- **📊 Exportar Excel**: Gera arquivo Excel com formatação original
- **🔄 Limpar Formulário**: Remove todos os dados (com confirmação)

### 4. Auto-salvamento
- Os dados são salvos automaticamente no navegador
- Mesmo fechando e reabrindo, os dados são mantidos
- Para limpar dados salvos, use o botão "Limpar Formulário"

## 📊 Exportação para Excel

O arquivo Excel exportado contém:
- **Cabeçalho**: Logo U&M, título e numeração do formulário
- **Informações Básicas**: Todos os campos de identificação
- **Estrutura do Equipamento**: Tabela completa com status
- **Cabine**: Verificações de todos os componentes
- **Formatação**: Cores, bordas e layout idênticos ao original

### Formato do Arquivo
- Nome: `FORM_384_Transferencia_Equipamentos_YYYY-MM-DD-HH-MM-SS.xlsx`
- Planilha: "FORM_384"
- Formatação: Preserva cores verde U&M (#006633) e layout original

## 🖥️ Requisitos Técnicos

### Navegadores Suportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Recursos Utilizados
- HTML5
- CSS3 (Grid, Flexbox, Animações)
- JavaScript ES6+
- Biblioteca XLSX.js (para exportação Excel)

## 📱 Responsividade

O formulário se adapta automaticamente a diferentes tamanhos de tela:
- **Desktop**: Layout completo em formato A4
- **Tablet**: Campos reorganizados em colunas
- **Mobile**: Layout em coluna única, preservando usabilidade

## ⚡ Funcionalidades Avançadas

### Auto-salvamento
- Salva dados automaticamente a cada alteração
- Backup de segurança a cada 30 segundos
- Dados persistem entre sessões do navegador

### Validação
- Campos obrigatórios destacados
- Feedback visual em tempo real
- Prevenção de perda de dados

### Acessibilidade
- Suporte a navegação por teclado
- Labels descritivos para leitores de tela
- Contraste adequado para visibilidade

## 🔧 Personalização

### Alterar Cores
No arquivo `styles.css`, procure por:
```css
.logo-um {
    background-color: #006633; /* Verde U&M */
}
```

### Adicionar Campos
1. Edite `index.html` para adicionar novos campos
2. Atualize `script.js` na função `collectFormData()`
3. Modifique `generatePreviewHTML()` para mostrar novos campos

### Modificar Logo
- Substitua o arquivo `logo.svg`
- Ou edite o SVG existente com novo design

## 🐛 Solução de Problemas

### Excel não exporta
- Verifique se JavaScript está habilitado
- Teste em outro navegador
- Certifique-se que não há bloqueadores de popup

### Dados não salvam
- Verifique se localStorage está habilitado
- Limpe cache do navegador
- Tente em modo anônimo/privado

### Layout quebrado
- Atualize o navegador
- Desabilite extensões que modificam CSS
- Verifique resolução mínima (320px)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Teste em navegador diferente
3. Certifique-se que todos os arquivos estão presentes

## 📝 Notas Importantes

- **Backup**: Sempre faça backup dos dados importantes
- **Compatibilidade**: Testado com Excel 2016+
- **Privacidade**: Todos os dados ficam locais (não são enviados para servidor)
- **Offline**: Funciona completamente offline após primeiro carregamento

## 🔄 Histórico de Versões

### v1.0 (2025-09-03)
- ✅ Interface idêntica ao formulário original U&M
- ✅ Exportação Excel com formatação completa
- ✅ Sistema de auto-salvamento
- ✅ Responsividade total
- ✅ Funcionalidades de prévia e validação

---

**Desenvolvido para U&M** | Formulário 384 - Transferência de Equipamentos | Revisão 09
