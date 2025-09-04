// JavaScript para Formulário U&M 384 - Transferência de Equipamentos

// Variáveis globais para assinatura digital
let isDrawing = false;
let signatures = {
    signatureEnvio: null,
    signatureRecebimento: null
};

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const previewBtn = document.getElementById('previewBtn');
    const exportBtn = document.getElementById('exportBtn');
    const previewModal = document.getElementById('previewModal');
    const closeBtn = document.querySelector('.close');
    const form = document.querySelector('form') || document;
    
    // Inicialização
    init();
    
    function init() {
        // Inicializar assinaturas digitais
        initSignaturePads();
        
        // Adicionar event listeners
        if (previewBtn) previewBtn.addEventListener('click', showPreview);
    if (exportBtn) exportBtn.addEventListener('click', exportToExcel);
        if (closeBtn) closeBtn.addEventListener('click', closePreview);
        
        // Event listener para fechar modal clicando fora
        window.addEventListener('click', function(event) {
            if (event.target === previewModal) {
                closePreview();
            }
        });
        
        // Event listener para reset do formulário
        const resetBtn = document.querySelector('button[type="reset"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Tem certeza que deseja limpar todos os dados do formulário?')) {
                    clearForm();
                }
            });
        }
        
        // Auto-save no localStorage
        setupAutoSave();
        
        // Carregar dados salvos
        loadSavedData();
        
        // Inicializar formatação da TAG
        initTagFormatting();
    }
    
    // (Removida) addNewItem: Não é mais permitida a adição dinâmica de itens no formulário.
    
    // Função para mostrar prévia dos dados
    function showPreview() {
        const formData = collectFormData();
        const previewContent = document.getElementById('previewContent');
        
        if (!previewContent) return;
        
        previewContent.innerHTML = generatePreviewHTML(formData);
        previewModal.style.display = 'block';
        
        // Adicionar animação
        setTimeout(() => {
            previewModal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    }
    
    // Função para fechar prévia
    function closePreview() {
        const modalContent = previewModal.querySelector('.modal-content');
        modalContent.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            previewModal.style.display = 'none';
            modalContent.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Função para coletar dados do formulário
    function collectFormData() {
        const data = {
            informacoes_basicas: {},
            estrutura_equipamento: [],
            cabine: []
        };
        
        // Coletar informações básicas
        const basicFields = [
            'fabricante', 'modelo', 'ano_fabricacao', 'serie',
            'km', 'horimetro', 'tag', 'data',
            'origem', 'destino', 'tecnico_responsavel'
        ];
        
        // Campos que devem ser em maiúsculo
        const uppercaseFields = ['fabricante', 'modelo', 'serie', 'tag', 'origem', 'destino', 'tecnico_responsavel'];
        
        basicFields.forEach(field => {
            const element = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
            if (element) {
                let value = element.value;
                // Converter para maiúsculo se necessário
                if (uppercaseFields.includes(field) && value) {
                    value = value.toUpperCase();
                }
                data.informacoes_basicas[field] = value;
            }
        });
        
        // Coletar dados da estrutura do equipamento
        const equipmentRows = document.querySelectorAll('.equipment-section .equipment-table tbody tr');
        equipmentRows.forEach((row, index) => {
            const itemData = {
                item: index + 1,
                descricao: '',
                envio: '',
                recebimento: ''
            };
            
            const descCell = row.querySelector('.description');
            if (descCell) {
                const input = descCell.querySelector('input');
                const textContent = descCell.querySelector('.description-text');
                
                if (input) {
                    itemData.descricao = input.value;
                } else if (textContent) {
                    itemData.descricao = textContent.textContent;
                    const subDesc = descCell.querySelector('.sub-description');
                    if (subDesc) {
                        itemData.descricao += ' - ' + subDesc.textContent;
                    }
                }
            }
            
            const envioSelect = row.querySelector('select[name*="envio"]');
            const recebimentoSelect = row.querySelector('select[name*="recebimento"]');
            
            if (envioSelect) itemData.envio = envioSelect.value;
            if (recebimentoSelect) itemData.recebimento = recebimentoSelect.value;
            
            data.estrutura_equipamento.push(itemData);
        });
        
        // Coletar dados da cabine
        const cabinRows = document.querySelectorAll('.cabin-section .equipment-table tbody tr');
        cabinRows.forEach((row, index) => {
            const itemData = {
                item: index + 1,
                descricao: '',
                envio: '',
                recebimento: ''
            };
            
            const descCell = row.querySelector('.description');
            if (descCell) {
                itemData.descricao = descCell.textContent.trim();
            }
            
            const envioSelect = row.querySelector('select[name*="envio"]');
            const recebimentoSelect = row.querySelector('select[name*="recebimento"]');
            
            if (envioSelect) itemData.envio = envioSelect.value;
            if (recebimentoSelect) itemData.recebimento = recebimentoSelect.value;
            
            data.cabine.push(itemData);
        });
        
    // Coletar assinaturas
        data.assinaturas = {
            tecnico_envio_nome: '',
            tecnico_envio_assinatura: '',
            tecnico_recebimento_nome: '',
            tecnico_recebimento_assinatura: ''
        };
        
        // Nome dos técnicos
        const envioNome = document.querySelector('input[name="tecnico_envio_nome"]');
        const recebimentoNome = document.querySelector('input[name="tecnico_recebimento_nome"]');
        
        if (envioNome) data.assinaturas.tecnico_envio_nome = envioNome.value.toUpperCase();
        if (recebimentoNome) data.assinaturas.tecnico_recebimento_nome = recebimentoNome.value.toUpperCase();
        
        // Assinaturas digitais
        if (signatures.signatureEnvio) {
            data.assinaturas.tecnico_envio_assinatura = signatures.signatureEnvio;
        }
        if (signatures.signatureRecebimento) {
            data.assinaturas.tecnico_recebimento_assinatura = signatures.signatureRecebimento;
        }

        // Coletar Informações Adicionais (envio / recebimento)
        data.informacoes_adicionais = [];
        const infoFields = [
            { label: 'Equipamento estava parado?', envio: 'equipamento_parado_tempo_envio', recebimento: 'equipamento_parado_tempo_recebimento' },
            { label: 'Fotos foram anexadas?', envio: 'fotos_anexadas_envio', recebimento: 'fotos_anexadas_recebimento' },
            { label: 'Histórico de análise de fluidos?', envio: 'historico_analise_fluidos_envio', recebimento: 'historico_analise_fluidos_recebimento' },
            { label: 'Equipamento possui Backlog?', envio: 'equipamento_possui_backlog_envio', recebimento: 'equipamento_possui_backlog_recebimento' }
        ];

        infoFields.forEach(f => {
            const envioEl = document.querySelector(`[name="${f.envio}"]`);
            const recebimentoEl = document.querySelector(`[name="${f.recebimento}"]`);
            data.informacoes_adicionais.push({
                label: f.label,
                envio: envioEl ? envioEl.value : '',
                recebimento: recebimentoEl ? recebimentoEl.value : ''
            });
        });

        // Coletar Manutenção
        data.manutencao = [];
        const reparoEnvio = document.querySelector('[name="reparo_equipamento_envio"]');
        const reparoRecebimento = document.querySelector('[name="reparo_equipamento_recebimento"]');
        const obsManEnvio = document.querySelector('[name="obs_manutencao_envio"]');
        const obsManReceb = document.querySelector('[name="obs_manutencao_recebimento"]');

        if (reparoEnvio || reparoRecebimento || obsManEnvio || obsManReceb) {
            data.manutencao.push({
                label: 'Reparos realizados',
                envio: reparoEnvio ? reparoEnvio.value : '',
                recebimento: reparoRecebimento ? reparoRecebimento.value : '',
                observacoes: `Envio: ${obsManEnvio ? obsManEnvio.value : ''} | Recebimento: ${obsManReceb ? obsManReceb.value : ''}`
            });
        }

        // Coletar Backlog (textareas)
        data.backlog = [];
        const backlogEnv = document.querySelector('[name="backlog_envio"]');
        const backlogRec = document.querySelector('[name="backlog_recebimento"]');
        if (backlogEnv || backlogRec) {
            data.backlog.push({ label: 'Backlog', envio: backlogEnv ? backlogEnv.value : '', recebimento: backlogRec ? backlogRec.value : '' });
        }
        
        return data;
    }
    
    // Função para gerar HTML da prévia
    function generatePreviewHTML(data) {
        let html = '';
        
        // Informações Básicas
        html += `
            <div class="preview-section">
                <h4>📋 INFORMAÇÕES BÁSICAS</h4>
                <div class="preview-field"><strong>Fabricante:</strong> <span>${data.informacoes_basicas.fabricante || '-'}</span></div>
                <div class="preview-field"><strong>Modelo:</strong> <span>${data.informacoes_basicas.modelo || '-'}</span></div>
                <div class="preview-field"><strong>Ano Fabricação:</strong> <span>${data.informacoes_basicas.ano_fabricacao || '-'}</span></div>
                <div class="preview-field"><strong>Série:</strong> <span>${data.informacoes_basicas.serie || '-'}</span></div>
                <div class="preview-field"><strong>KM:</strong> <span>${data.informacoes_basicas.km || '-'}</span></div>
                <div class="preview-field"><strong>Horímetro:</strong> <span>${data.informacoes_basicas.horimetro || '-'}</span></div>
                <div class="preview-field"><strong>TAG:</strong> <span>${data.informacoes_basicas.tag || '-'}</span></div>
                <div class="preview-field"><strong>Data:</strong> <span>${data.informacoes_basicas.data || '-'}</span></div>
                <div class="preview-field"><strong>Origem:</strong> <span>${data.informacoes_basicas.origem || '-'}</span></div>
                <div class="preview-field"><strong>Destino:</strong> <span>${data.informacoes_basicas.destino || '-'}</span></div>
                <div class="preview-field"><strong>Técnico Responsável:</strong> <span>${data.informacoes_basicas.tecnico_responsavel || '-'}</span></div>
            </div>
        `;
        
        // Estrutura do Equipamento
        html += `
            <div class="preview-section">
                <h4>🔧 ESTRUTURA DO EQUIPAMENTO</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="border: 1px solid #ddd; padding: 8px;">Item</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Descrição</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Envio</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Recebimento</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.estrutura_equipamento.forEach(item => {
            html += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.item}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.descricao || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.envio || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.recebimento || '-'}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Cabine
        html += `
            <div class="preview-section">
                <h4>🚗 CABINE</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="border: 1px solid #ddd; padding: 8px;">Item</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Descrição</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Envio</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Recebimento</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.cabine.forEach(item => {
            html += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.item}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.descricao || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.envio || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.recebimento || '-'}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Assinaturas
        html += `
            <div class="preview-section">
                <h4>✍️ ASSINATURAS</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                    <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
                        <h5 style="color: #006633; margin-bottom: 10px;">Técnico Responsável pelo Envio</h5>
                        <div><strong>Nome:</strong> ${data.assinaturas?.tecnico_envio_nome || '-'}</div>
                        <div style="margin-top: 10px;">
                            <strong>Assinatura:</strong><br>
                            ${data.assinaturas?.tecnico_envio_assinatura ? 
                                `<img src="${data.assinaturas.tecnico_envio_assinatura}" style="max-width: 200px; max-height: 80px; border: 1px solid #ccc;">` : 
                                '<span style="color: #999;">Não assinado</span>'
                            }
                        </div>
                    </div>
                    <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
                        <h5 style="color: #006633; margin-bottom: 10px;">Técnico Responsável pelo Recebimento</h5>
                        <div><strong>Nome:</strong> ${data.assinaturas?.tecnico_recebimento_nome || '-'}</div>
                        <div style="margin-top: 10px;">
                            <strong>Assinatura:</strong><br>
                            ${data.assinaturas?.tecnico_recebimento_assinatura ? 
                                `<img src="${data.assinaturas.tecnico_recebimento_assinatura}" style="max-width: 200px; max-height: 80px; border: 1px solid #ccc;">` : 
                                '<span style="color: #999;">Não assinado</span>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Função para exportar para Excel (reformulada para layout mais fiel ao original)
    function exportToExcel() {
        if (!validateSignatures()) return;

        const data = collectFormData();
        const wb = XLSX.utils.book_new();

        // Montar matriz (AoA) com a estrutura do formulário
        const wsData = [];

        // Cabeçalho grande
        wsData.push(['FORMULÁRIO 384 - TRANSFERÊNCIA DE EQUIPAMENTOS', '', '', 'Revisão 09']);
        wsData.push(['U&M', '', '', '']);
        wsData.push([]);

        // INFORMAÇÕES BÁSICAS (em 2 colunas)
        wsData.push(['INFORMAÇÕES BÁSICAS']);
        wsData.push(['Fabricante', data.informacoes_basicas.fabricante || '', 'Modelo', data.informacoes_basicas.modelo || '']);
        wsData.push(['Ano Fabricação', data.informacoes_basicas.ano_fabricacao || '', 'Série', data.informacoes_basicas.serie || '']);
        wsData.push(['KM', data.informacoes_basicas.km || '', 'Horímetro', data.informacoes_basicas.horimetro || '']);
        wsData.push(['TAG', data.informacoes_basicas.tag || '', 'Data', data.informacoes_basicas.data || '']);
        wsData.push(['Origem', data.informacoes_basicas.origem || '', 'Destino', data.informacoes_basicas.destino || '']);
        wsData.push(['Técnico Responsável', data.informacoes_basicas.tecnico_responsavel || '', '', '']);
        wsData.push([]);

        // ESTRUTURA DO EQUIPAMENTO (tabela)
        wsData.push(['ESTRUTURA DO EQUIPAMENTO']);
        wsData.push(['Item', 'Descrição', 'Envio', 'Recebimento']);
        data.estrutura_equipamento.forEach(item => {
            wsData.push([item.item || '', item.descricao || '', item.envio || '', item.recebimento || '']);
        });
        wsData.push([]);

        // CABINE
        wsData.push(['CABINE']);
        wsData.push(['Item', 'Descrição', 'Envio', 'Recebimento']);
        data.cabine.forEach(item => {
            wsData.push([item.item || '', item.descricao || '', item.envio || '', item.recebimento || '']);
        });
        wsData.push([]);

        // INFORMAÇÕES ADICIONAIS (com envio/recebimento)
        wsData.push(['INFORMAÇÕES ADICIONAIS']);
        wsData.push(['Item', 'Envio', 'Recebimento']);
        const infos = data.informacoes_adicionais || [];
        infos.forEach(info => {
            wsData.push([info.label || '', info.envio || '', info.recebimento || '']);
        });
        wsData.push([]);

        // MANUTENÇÃO
        wsData.push(['MANUTENÇÃO']);
        wsData.push(['Item', 'Envio', 'Recebimento', 'Observações Envio/Recebimento']);
        const manut = data.manutencao || [];
        manut.forEach(row => {
            wsData.push([row.label || '', row.envio || '', row.recebimento || '', row.observacoes || '']);
        });
        wsData.push([]);

        // BACKLOG
        wsData.push(['BACKLOG / PENDÊNCIAS']);
        const backlog = data.backlog || [];
        backlog.forEach(row => {
            wsData.push([row.label || '', row.envio || '', row.recebimento || '']);
        });
        wsData.push([]);

        // ASSINATURAS - deixar espaço para imagens
        wsData.push(['ASSINATURAS']);
        wsData.push(['Técnico Envio Nome', data.assinaturas?.tecnico_envio_nome || '', '', 'Técnico Recebimento Nome', data.assinaturas?.tecnico_recebimento_nome || '']);
        wsData.push(['Assinatura Envio', data.assinaturas?.tecnico_envio_assinatura ? 'Verificar aba de imagens' : '', '', 'Assinatura Recebimento', data.assinaturas?.tecnico_recebimento_assinatura ? 'Verificar aba de imagens' : '']);

        // Criar worksheet e configurar colunas
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [ { width: 18 }, { width: 48 }, { width: 14 }, { width: 14 }, { width: 14 } ];

        // Forçar merges para títulos de seções (para que ocupem toda a largura da planilha)
        const sectionTitles = new Set(['INFORMAÇÕES BÁSICAS','ESTRUTURA DO EQUIPAMENTO','CABINE','INFORMAÇÕES ADICIONAIS','MANUTENÇÃO','BACKLOG / PENDÊNCIAS','ASSINATURAS','FORMULÁRIO 384 - TRANSFERÊNCIA DE EQUIPAMENTOS']);
        const merges = [];
        try {
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const firstCellAddr = XLSX.utils.encode_cell({ r: R, c: 0 });
                const cell = ws[firstCellAddr];
                if (cell && cell.v && sectionTitles.has(String(cell.v).toUpperCase())) {
                    // Merge da coluna 0 até 4 nessa linha
                    merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 4 } });
                    // centralizar o conteúdo via propriedade de alinhamento (algumas versões do xlsx ignoram estilos)
                    if (!cell.s) cell.s = {};
                    cell.s.alignment = { horizontal: 'center' };
                    if (!cell.s.font) cell.s.font = {};
                    cell.s.font.bold = true;
                }
            }
            if (merges.length) ws['!merges'] = merges;
        } catch (e) {
            console.warn('Erro ao aplicar merges na planilha:', e);
        }

        // Tentar aplicar estilos básicos nas células de cabeçalho (fallback se suportado)
        try {
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) continue;
                    const v = String(ws[cellAddress].v || '').toUpperCase();
                    if (v === 'ITEM' || v === 'DESCRIÇÃO' || v === 'ENVIO' || v === 'RECEBIMENTO') {
                        if (!ws[cellAddress].s) ws[cellAddress].s = {};
                        if (!ws[cellAddress].s.font) ws[cellAddress].s.font = {};
                        ws[cellAddress].s.font.bold = true;
                        ws[cellAddress].s.alignment = { horizontal: 'center' };
                    }
                }
            }
        } catch (e) {
            console.warn('Estilização XLSX ignorada (cabeçalhos):', e);
        }

        XLSX.utils.book_append_sheet(wb, ws, 'FORM_384');

        // Criar aba separada com imagens de assinaturas (se existirem)
        const imgs = [];
        if (data.assinaturas?.tecnico_envio_assinatura) imgs.push({ name: 'assinatura_envio.png', dataURL: data.assinaturas.tecnico_envio_assinatura });
        if (data.assinaturas?.tecnico_recebimento_assinatura) imgs.push({ name: 'assinatura_recebimento.png', dataURL: data.assinaturas.tecnico_recebimento_assinatura });

        if (imgs.length > 0) {
            // Criar uma planilha com referências às imagens (inserir imagens pode não ser suportado por todas as versões do xlsx lib)
            const imgSheetData = [['Imagens das Assinaturas'] , []];
            const imgWs = XLSX.utils.aoa_to_sheet(imgSheetData);
            XLSX.utils.book_append_sheet(wb, imgWs, 'IMAGENS');
            // Não tentar embutir binários; deixar como fallback instrução na planilha principal
        }

        const now = new Date();
        const timestamp = now.toISOString().slice(0,19).replace(/:/g,'-');
        
        // Obter valor da TAG para incluir no nome do arquivo
        const tagValue = data.informacoes_basicas.tag || '';
        // Manter o formato XX-XXXX e converter para maiúsculo se necessário
        const normalizedTag = tagValue.toUpperCase();
        const tagSuffix = normalizedTag ? `_${normalizedTag}` : '';
        
        const filename = `FORM_384_Transferencia_Equipamentos${tagSuffix}_${timestamp}.xlsx`;

        try {
            XLSX.writeFile(wb, filename);
            showNotification('✅ Arquivo Excel exportado com sucesso!', 'success');
            if (previewModal && previewModal.style && previewModal.style.display === 'block') closePreview();
        } catch (error) {
            console.error('Erro ao exportar:', error);
            showNotification('❌ Erro ao exportar arquivo. Tente novamente.', 'error');
        }
    }
    
    // Função para mostrar notificações
    function showNotification(message, type = 'info') {
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        // Definir cor baseada no tipo
        switch (type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
                break;
            default:
                notification.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
    
    // Função para limpar formulário
    function clearForm() {
        // Limpar inputs e selects
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
        
        // Limpar assinaturas digitais
        clearSignature('signatureEnvio');
        clearSignature('signatureRecebimento');
        
        // Remover itens adicionados dinamicamente (manter apenas os originais)
        const equipmentTable = document.querySelector('.equipment-section .equipment-table tbody');
        if (equipmentTable) {
            const rows = equipmentTable.querySelectorAll('tr');
            // Manter apenas as primeiras 5 linhas (originais)
            for (let i = 5; i < rows.length; i++) {
                rows[i].remove();
            }
        }
        
        // Limpar localStorage
        localStorage.removeItem('form384_data');
        localStorage.removeItem('signature_signatureEnvio');
        localStorage.removeItem('signature_signatureRecebimento');
        
        showNotification('🔄 Formulário limpo com sucesso!', 'info');
    }
    
    // Auto-save no localStorage
    function setupAutoSave() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', saveToLocalStorage);
        });
        
        // Salvar a cada 30 segundos
        setInterval(saveToLocalStorage, 30000);
    }
    
    function saveToLocalStorage() {
        try {
            const data = collectFormData();
            localStorage.setItem('form384_data', JSON.stringify(data));
        } catch (error) {
            console.warn('Erro ao salvar no localStorage:', error);
        }
    }
    
    function loadSavedData() {
        try {
            const savedData = localStorage.getItem('form384_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                populateForm(data);
            }
        } catch (error) {
            console.warn('Erro ao carregar dados salvos:', error);
        }
    }
    
    function populateForm(data) {
        // Preencher informações básicas
        if (data.informacoes_basicas) {
            Object.keys(data.informacoes_basicas).forEach(key => {
                const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                if (element && data.informacoes_basicas[key]) {
                    element.value = data.informacoes_basicas[key];
                }
            });
        }
        
        // Preencher estrutura do equipamento
        if (data.estrutura_equipamento) {
            data.estrutura_equipamento.forEach((item, index) => {
                const envioSelect = document.querySelector(`select[name*="item${index + 1}_envio"], select[name*="estrutura_envio"]`);
                const recebimentoSelect = document.querySelector(`select[name*="item${index + 1}_recebimento"], select[name*="estrutura_recebimento"]`);
                const descInput = document.querySelector(`input[name*="item${index + 1}_desc"]`);
                
                if (envioSelect && item.envio) envioSelect.value = item.envio;
                if (recebimentoSelect && item.recebimento) recebimentoSelect.value = item.recebimento;
                if (descInput && item.descricao) descInput.value = item.descricao;
            });
        }
        
        // Preencher cabine
        if (data.cabine) {
            const cabinSelects = document.querySelectorAll('.cabin-section select');
            data.cabine.forEach((item, index) => {
                const baseIndex = index * 2;
                if (cabinSelects[baseIndex] && item.envio) {
                    cabinSelects[baseIndex].value = item.envio;
                }
                if (cabinSelects[baseIndex + 1] && item.recebimento) {
                    cabinSelects[baseIndex + 1].value = item.recebimento;
                }
            });
        }
    }
    
    // Adicionar animações CSS dinamicamente
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification {
            animation: slideInRight 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
});

// Funções globais para serem usadas inline
function closePreview() {
    const previewModal = document.getElementById('previewModal');
    if (previewModal) {
        previewModal.style.display = 'none';
    }
}

function exportToExcel() {
    // Esta função será chamada através do event listener já configurado
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.click();
    }
}

// Função para inicializar upload de fotos
function initPhotoUpload() {
    const photoInputs = document.querySelectorAll('.photo-input');
    
    photoInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            handlePhotoUpload(e.target);
        });
    });
}

// Função para manipular upload de fotos
function handlePhotoUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        input.value = '';
        return;
    }
    
    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 5MB.');
        input.value = '';
        return;
    }
    
    const previewId = 'preview_' + input.id.replace('foto_', '');
    const previewDiv = document.getElementById(previewId);
    
    if (previewDiv) {
        // Criar preview da imagem
        const reader = new FileReader();
        reader.onload = function(e) {
            previewDiv.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <div class="photo-filename">${file.name}</div>
                <button type="button" onclick="removePhoto('${input.id}')" class="btn btn-sm btn-danger" style="margin-top: 5px; padding: 4px 8px; font-size: 12px;">
                    🗑️ Remover
                </button>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Função para remover foto
function removePhoto(inputId) {
    const input = document.getElementById(inputId);
    const previewId = 'preview_' + inputId.replace('foto_', '');
    const previewDiv = document.getElementById(previewId);
    
    if (input) input.value = '';
    if (previewDiv) previewDiv.innerHTML = '';
}

// ============= FUNÇÕES DE ASSINATURA DIGITAL =============

// Função para inicializar os pads de assinatura
function initSignaturePads() {
    const canvases = ['signatureEnvio', 'signatureRecebimento'];
    
    canvases.forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            setupSignatureCanvas(canvas);
        }
    });
}

// Função para configurar um canvas de assinatura
function setupSignatureCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    let rect = canvas.getBoundingClientRect();
    
    // Configurações do canvas
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    // Event listeners para mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Event listeners para touch (dispositivos móveis)
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Função para iniciar o desenho
    function startDrawing(e) {
        isDrawing = true;
        rect = canvas.getBoundingClientRect();
        const pos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
    
    // Função para desenhar
    function draw(e) {
        if (!isDrawing) return;
        
        e.preventDefault();
        const pos = getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
    
    // Função para parar o desenho
    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
        }
    }
    
    // Função para obter posição do mouse/touch
    function getMousePos(e) {
        rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    // Função para lidar com eventos touch
    function handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                          e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
}

// Função para limpar assinatura
function clearSignature(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Limpar também o campo hidden
        const hiddenField = document.getElementById('hidden' + canvasId.charAt(0).toUpperCase() + canvasId.slice(1));
        if (hiddenField) {
            hiddenField.value = '';
        }
        
        // Remover da storage local
        signatures[canvasId] = null;
        localStorage.removeItem('signature_' + canvasId);
        
        alert('Assinatura removida com sucesso!');
    }
}

// Função para salvar assinatura
function saveSignature(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        // Verificar se há algo desenhado
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let hasContent = false;
        
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 0) { // Alpha channel
                hasContent = true;
                break;
            }
        }
        
        if (!hasContent) {
            alert('Por favor, desenhe uma assinatura antes de salvar.');
            return;
        }
        
        // Converter para base64
        const dataURL = canvas.toDataURL('image/png');
        
        // Salvar no campo hidden
        const hiddenField = document.getElementById('hidden' + canvasId.charAt(0).toUpperCase() + canvasId.slice(1));
        if (hiddenField) {
            hiddenField.value = dataURL;
        }
        
        // Salvar na storage local
        signatures[canvasId] = dataURL;
        localStorage.setItem('signature_' + canvasId, dataURL);
        
        alert('Assinatura salva com sucesso!');
    }
}

// Função para carregar assinaturas salvas
function loadSavedSignatures() {
    const canvases = ['signatureEnvio', 'signatureRecebimento'];
    
    canvases.forEach(canvasId => {
        const savedSignature = localStorage.getItem('signature_' + canvasId);
        if (savedSignature) {
            const canvas = document.getElementById(canvasId);
            const hiddenField = document.getElementById('hidden' + canvasId.charAt(0).toUpperCase() + canvasId.slice(1));
            
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = function() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = savedSignature;
                
                if (hiddenField) {
                    hiddenField.value = savedSignature;
                }
                
                signatures[canvasId] = savedSignature;
            }
        }
    });
}

// Função para verificar se há assinaturas antes do export
function validateSignatures() {
    const envioName = document.querySelector('input[name="tecnico_envio_nome"]');
    const recebimentoName = document.querySelector('input[name="tecnico_recebimento_nome"]');
    const envioSignature = signatures.signatureEnvio;
    const recebimentoSignature = signatures.signatureRecebimento;
    
    let warnings = [];
    
    if (envioName && envioName.value && !envioSignature) {
        warnings.push('Técnico de Envio: Nome preenchido mas assinatura não salva');
    }
    
    if (recebimentoName && recebimentoName.value && !recebimentoSignature) {
        warnings.push('Técnico de Recebimento: Nome preenchido mas assinatura não salva');
    }
    
    if (warnings.length > 0) {
        const message = 'Atenção:\n\n' + warnings.join('\n') + '\n\nDeseja continuar mesmo assim?';
        return confirm(message);
    }
    
    return true;
}

// Função para inicializar formatação da TAG
function initTagFormatting() {
    const tagInput = document.getElementById('tag');
    if (!tagInput) return;
    
    tagInput.addEventListener('input', function(e) {
        let value = e.target.value.toUpperCase();
        
        // Remove caracteres não permitidos (mantém apenas letras, números e hífen)
        value = value.replace(/[^A-Z0-9\-]/g, '');
        
        // Aplica formatação automática conforme o usuário digita
        let formatted = '';
        let letterCount = 0;
        let numberCount = 0;
        
        for (let i = 0; i < value.length && formatted.length < 7; i++) {
            const char = value[i];
            
            // Primeiros dois caracteres devem ser letras
            if (letterCount < 2 && /[A-Z]/.test(char)) {
                formatted += char;
                letterCount++;
            }
            // Após duas letras, adiciona hífen automaticamente
            else if (letterCount === 2 && formatted.length === 2 && char !== '-') {
                formatted += '-';
                // Se o caractere atual é número, adiciona ele também
                if (/[0-9]/.test(char) && numberCount < 4) {
                    formatted += char;
                    numberCount++;
                }
            }
            // Aceita hífen na posição correta
            else if (letterCount === 2 && formatted.length === 2 && char === '-') {
                formatted += char;
            }
            // Depois do hífen, aceita apenas números (máximo 4)
            else if (letterCount === 2 && formatted.length >= 3 && /[0-9]/.test(char) && numberCount < 4) {
                formatted += char;
                numberCount++;
            }
        }
        
        e.target.value = formatted;
    });
    
    // Validação ao sair do campo
    tagInput.addEventListener('blur', function(e) {
        const value = e.target.value;
        const pattern = /^[A-Z]{2}-[0-9]{4}$/;
        
        if (value && !pattern.test(value)) {
            e.target.setCustomValidity('TAG deve estar no formato: XX-XXXX (Ex: CR-1075)');
        } else {
            e.target.setCustomValidity('');
        }
    });
}

// Inicializar upload de fotos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initPhotoUpload();
    
    // Carregar assinaturas salvas após um pequeno delay para garantir que os canvas estejam prontos
    setTimeout(loadSavedSignatures, 100);
});
