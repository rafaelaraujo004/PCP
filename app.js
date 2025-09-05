const LS_KEY='controleLavador_dados_v1';const LS_META='controleLavador_meta_v1';
const $=(s,c=document)=>c.querySelector(s);const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
const uid=()=>Math.random().toString(36).slice(2,10);
const load=()=>({dados:JSON.parse(localStorage.getItem(LS_KEY)||'[]'),meta:JSON.parse(localStorage.getItem(LS_META)||'{}')});

// Função para carregar dados com prioridade na nuvem
const loadWithCloudSync = async () => {
  console.log('🔄 Iniciando carregamento de dados...');
  
  // Primeiro, carregar dados locais
  let localData = load();
  console.log('📱 Dados locais encontrados:', { dados: localData.dados.length, temMeta: Object.keys(localData.meta).length > 0 });
  
  // Tentar carregar da nuvem se disponível
  if (window.jsonBinManager) {
    try {
      console.log('☁️ Tentando carregar dados da nuvem...');
      const cloudData = await window.jsonBinManager.loadData();
      
      if (cloudData && cloudData.dados) {
        console.log('✅ Dados da nuvem carregados:', { dados: cloudData.dados.length, temMeta: Object.keys(cloudData.meta || {}).length > 0 });
        
        // Se temos dados na nuvem, verificar qual é mais recente
        const localCount = localData.dados.length;
        const cloudCount = cloudData.dados.length;
        
        // Se a nuvem tem mais dados ou se local está vazio, usar dados da nuvem
        if (cloudCount > localCount || localCount === 0) {
          console.log('📥 Usando dados da nuvem (mais recentes)');
          
          // Salvar dados da nuvem localmente para sincronizar
          localStorage.setItem(LS_KEY, JSON.stringify(cloudData.dados));
          localStorage.setItem(LS_META, JSON.stringify(cloudData.meta || {}));
          
          return {
            dados: cloudData.dados,
            meta: { ...localData.meta, ...cloudData.meta }
          };
        } else {
          console.log('📱 Usando dados locais (mais recentes)');
          
          // Se local tem mais dados, sincronizar para a nuvem
          if (localCount > cloudCount) {
            console.log('📤 Sincronizando dados locais para a nuvem...');
            await window.jsonBinManager.saveData(localData.dados, localData.meta);
          }
        }
      } else {
        console.log('🌐 Nenhum dado encontrado na nuvem');
        
        // Se não há dados na nuvem mas temos dados locais, enviar para nuvem
        if (localData.dados.length > 0) {
          console.log('📤 Enviando dados locais para a nuvem...');
          await window.jsonBinManager.saveData(localData.dados, localData.meta);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar da nuvem:', error);
    }
  } else {
    console.log('⚠️ JSONBin Manager não disponível, usando dados locais');
  }
  
  return localData;
};

// Função de salvamento atualizada para incluir JSONBin
const save = async (d, m) => {
  console.log('💾 Função save chamada com:', { dados: d?.length || 0, meta: Object.keys(m || {}).length });
  
  // Sempre salvar no localStorage primeiro (funciona offline)
  localStorage.setItem(LS_KEY, JSON.stringify(d));
  localStorage.setItem(LS_META, JSON.stringify(m));
  
  // Tentar salvar na nuvem se disponível
  if (window.jsonBinManager) {
    console.log('🌐 JSONBin Manager encontrado, tentando salvar na nuvem...');
    try {
      await window.jsonBinManager.saveData(d, m);
    } catch (error) {
      console.error('❌ Erro ao salvar na nuvem:', error);
    }
  } else {
    console.log('⚠️ JSONBin Manager não encontrado');
  }
  
  // Atualizar indicador de status
  if (typeof updateSyncIndicator === 'function') {
    updateSyncIndicator();
  }
};
const fmtData=v=>{
  if(!v) return '';
  
  // Se já está no formato DD/MM/YYYY, retorna como está
  if(typeof v === 'string' && v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return v;
  }
  
  // Se está no formato ISO (YYYY-MM-DD), converte diretamente sem timezone
  if(typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [ano, mes, dia] = v.split('-');
    return `${dia.padStart(2,'0')}/${mes.padStart(2,'0')}/${ano}`;
  }
  
  // Tenta criar uma data válida
  const d = new Date(v); 
  if(isNaN(d)) return v; // Se não conseguir converter, retorna o valor original
  
  // Converte para formato brasileiro
  return d.toLocaleDateString('pt-BR');
};
const fmtDataISO=v=>{
  if(!v) return '';
  
  // Se já está no formato ISO (YYYY-MM-DD), retorna como está
  if(typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return v;
  }
  
  // Se está no formato DD/MM/YYYY, converte para ISO
  if(typeof v === 'string' && v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [dia, mes, ano] = v.split('/');
    return `${ano}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`;
  }
  
  // Tenta criar uma data válida
  const d = new Date(v); 
  if(isNaN(d)) return v; // Se não conseguir converter, retorna o valor original
  
  // Converte para formato ISO
  return d.toISOString().slice(0,10);
};

// Função auxiliar para criar data sem problemas de timezone
const criarDataLocal = (dateStr) => {
  if(!dateStr) return null;
  
  // Se é formato ISO (YYYY-MM-DD), cria data local
  if(typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [ano, mes, dia] = dateStr.split('-');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  }
  
  // Para outros formatos, usa Date normal
  return new Date(dateStr);
};

let state = load(); // Carregamento inicial local (rápido)

// Função de inicialização assíncrona para carregar dados da nuvem
const initApp = async () => {
  console.log('🚀 Inicializando aplicação...');
  
  // Aguardar JSONBin Manager estar disponível
  if (window.jsonBinManager) {
    try {
      // Carregar dados da nuvem com sincronização inteligente
      state = await loadWithCloudSync();
      
      // Configurar valores padrão se necessário
      if(!state.meta.frentes){state.meta.frentes=["EVA","EUDO CONCEIÇÃO","VICENTE DE PAULA","FRENTE 4"];}
      if(!state.meta.responsaveis){state.meta.responsaveis=["DOMINGOS","EUDO CONCEIÇÃO","VICENTE DE PAULA"];}
      
      // Limpar dados antigos na primeira execução após atualização (apenas se local estiver vazio)
      if(localStorage.getItem('dados_limpos') !== 'true' && state.dados.length === 0) {
        state.dados = [];
        state.meta.consumo = 0;
        localStorage.setItem('dados_limpos', 'true');
        await save(state.dados, state.meta);
      }
      
      // Re-renderizar interface com dados atualizados
      initConsumo();
      preencherListasAuxiliares();
      renderTable();
      renderDashboard();
      
      console.log('✅ Aplicação inicializada com dados da nuvem');
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
    }
  } else {
    console.log('⚠️ JSONBin não disponível, usando dados locais');
  }
};

// Configurar valores padrão para inicialização rápida local
if(!state.meta.frentes){state.meta.frentes=["EVA","EUDO CONCEIÇÃO","VICENTE DE PAULA","FRENTE 4"];}
if(!state.meta.responsaveis){state.meta.responsaveis=["DOMINGOS","EUDO CONCEIÇÃO","VICENTE DE PAULA"];}

// Executar inicialização assíncrona quando JSONBin estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Dar tempo para todos os scripts carregarem
  setTimeout(() => {
    initApp();
  }, 1000);
});

function initTabs(){
  // Nova funcionalidade para abrir em ambientes separados
  $$('.tab').forEach(b=>b.addEventListener('click',(e)=>{
    e.preventDefault();
    const tab = b.dataset.tab;
    const url = b.dataset.url;
    
    if(url) {
      // Abrir em nova aba/janela
      window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    } else {
      // Funcionalidade de tabs original (fallback)
      $$('.tab').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const t = b.dataset.tab; 
      $$('.tab-content').forEach(s=>s.classList.remove('visible')); 
      const tabContent = $('#tab-'+t);
      if(tabContent) {
        tabContent.classList.add('visible'); 
        if(t==='dashboard') renderDashboard();
      }
    }
  }));
}
function initConsumo(){$('#consumoLavador').value=state.meta.consumo||0; $('#btnSalvarConsumo').onclick=()=>{const v=Number($('#consumoLavador').value||0); state.meta.consumo=isNaN(v)?0:v; save(state.dados,state.meta); renderDashboard();};}
function preencherListasAuxiliares(){const fl=$('#frenteList'); fl.innerHTML=''; state.meta.frentes.forEach(f=>{const o=document.createElement('option'); o.value=f; fl.appendChild(o);}); const rl=$('#respList'); rl.innerHTML=''; state.meta.responsaveis.forEach(f=>{const o=document.createElement('option'); o.value=f; rl.appendChild(o);}); $('#filtroResponsavel').innerHTML='<option value=\"\">Todos os responsáveis</option>'+state.meta.responsaveis.map(r=>`<option value=\"${r}\">${r}</option>`).join(''); $('#filtroFrente').innerHTML='<option value=\"\">Todas as frentes</option>'+state.meta.frentes.map(r=>`<option value=\"${r}\">${r}</option>`).join('');}
function abrirModal(reg=null){
  const dlg=$('#modal');
  $('#modalTitulo').textContent=reg?'Editar registro':'Novo registro';
  const f=$('#formRegistro');
  f.reset();
  preencherListasAuxiliares();
  if(reg){
    f.descricao.value=reg.descricao||'';
    f.tag1.value=reg.tag1||'';
    f.tag2.value=reg.tag2||'';
    f.paletes.value=reg.paletes??'';
    f.observacoes.value=reg.observacoes||'';
    f.os.value=reg.os||'';
    f.setor.value=reg.setor||'';
    f.status.value=reg.status||'PROGRAMADO';
    f.responsavel.value=reg.responsavel||'';
    f.frente.value=reg.frente||'';
    f.fim.value=fmtDataISO(reg.fim);
    f.dataset.editing=reg.id;
  } else {
    delete f.dataset.editing;
  }
  setTimeout(()=>{f.descricao.focus();},100);
  $('#registroFeedback').style.display='none';
  $('#btnSalvarRegistro').disabled=true;
  dlg.showModal();
}

function renderTable(){const tb=$('#tabela tbody'); tb.innerHTML=''; const q=($('#busca').value||'').toLowerCase(); const fs=$('#filtroStatus').value; const fr=$('#filtroResponsavel').value; const ff=$('#filtroFrente').value; const dDe=$('#filtroDe').value?criarDataLocal($('#filtroDe').value):null; const dAte=$('#filtroAte').value?criarDataLocal($('#filtroAte').value):null; const rows=state.dados.filter(r=>{const txt=[r.descricao,r.os,r.setor,r.responsavel,r.frente,r.tag1,r.tag2].join(' ').toLowerCase(); if(q && !txt.includes(q)) return false; if(fs && r.status!==fs) return false; if(fr && r.responsavel!==fr) return false; if(ff && r.frente!==ff) return false; if(dDe||dAte){const d=r.fim?criarDataLocal(r.fim):null; if(dDe && (!d||d<dDe)) return false; if(dAte && (!d||d>dAte)) return false;} return true;}); rows.sort((a,b)=>(a.fim||'').localeCompare(b.fim||'')); for(const r of rows){const tr=document.createElement('tr'); const sClass=r.status==='FINALIZADO'?'finalizado':(r.status==='EM PROCESSO'?'processo':'programado'); tr.innerHTML=`
      <td>${r.descricao||''}</td><td>${r.tag1||''}</td><td>${r.tag2||''}</td><td>${r.paletes??''}</td><td>${r.observacoes||''}</td><td>${r.os||''}</td><td>${r.setor||''}</td><td><span class="badge ${sClass}">${r.status||''}</span></td><td>${r.responsavel||''}</td><td>${r.frente||''}</td><td>${fmtData(r.fim)||''}</td>
      <td><div class="row-actions"><button class="ghost" data-act="edit" data-id="${r.id}">Editar</button><button class="danger" data-act="del" data-id="${r.id}">Excluir</button></div></td>`; tb.appendChild(tr);} tb.querySelectorAll('button[data-act="edit"]').forEach(b=>b.onclick=()=>{const reg=state.dados.find(x=>x.id===b.dataset.id); abrirModal(reg);}); tb.querySelectorAll('button[data-act="del"]').forEach(b=>b.onclick=()=>{const id=b.dataset.id; if(confirm('Excluir este registro?')){state.dados=state.dados.filter(x=>x.id!==id); save(state.dados,state.meta); renderTable(); renderDashboard();}});}
function renderDashboard(){const total=state.dados.length; const programado=state.dados.filter(r=>r.status==='PROGRAMADO').length; const processo=state.dados.filter(r=>r.status==='EM PROCESSO').length; const finalizado=state.dados.filter(r=>r.status==='FINALIZADO').length; $('#kpiTotal').textContent=total; $('#kpiProgramado').textContent=programado; $('#kpiEmProcesso').textContent=processo; $('#kpiFinalizado').textContent=finalizado; $('#kpiConsumo').textContent=state.meta.consumo||0; window._charts = window._charts || {}; for(const k in window._charts){window._charts[k].destroy();}
  
  // Gráfico de barras por status
  const statusData = [programado,processo,finalizado];
  const maxStatusValue = Math.max(...statusData);
  const c1=$('#chartStatus').getContext('2d'); 
  window._charts.status=new Chart(c1,{
    type:'bar',
    data:{
      labels:['Programado','Em processo','Finalizado'],
      datasets:[{
        label:'Qtd',
        data:statusData,
        backgroundColor:['#e2a937','#575756','#19502f']
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:false},
        tooltip:{
          callbacks:{
            label:function(context){
              return context.label + ': ' + context.parsed.y;
            }
          }
        }
      },
      scales:{
        y:{
          beginAtZero:true,
          max: maxStatusValue + 10,
          ticks:{
            stepSize:1
          }
        }
      }
    },
    plugins:[{
      afterDatasetsDraw: function(chart) {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
          const meta = chart.getDatasetMeta(i);
          meta.data.forEach((bar, index) => {
            const value = dataset.data[index];
            if(value > 0) {
              ctx.fillStyle = '#333';
              ctx.font = 'bold 12px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(value, bar.x, bar.y - 5);
            }
          });
        });
      }
    }]
  });
  
  // Gráfico de pizza por responsável
  const porResp={}; 
  state.dados.forEach(r=>porResp[r.responsavel]=(porResp[r.responsavel]||0)+1); 
  const c2=$('#chartResp').getContext('2d'); 
  window._charts.resp=new Chart(c2,{
    type:'doughnut',
    data:{
      labels:Object.keys(porResp),
      datasets:[{
        data:Object.values(porResp),
        backgroundColor:['#19502f','#466c53','#b2bfb4','#575756','#e2a937','#dadada','#f5f4f4','#ffffff']
      }]
    },
    options:{
      responsive:true,
      cutout:'50%',
      radius:'70%',
      plugins:{
        legend:{
          display:true,
          position:'bottom',
          labels:{
            boxWidth:8,
            font:{size:10},
            padding:10,
            color: document.documentElement.classList.contains('light-theme') ? '#000000' : '#f7fafc',
            generateLabels:function(chart){
              const data = chart.data;
              if(data.labels.length && data.datasets.length){
                return data.labels.map(function(label,i){
                  const value = data.datasets[0].data[i];
                  return {
                    text:label + ': ' + value,
                    fillStyle:data.datasets[0].backgroundColor[i],
                    strokeStyle:data.datasets[0].backgroundColor[i],
                    lineWidth:1,
                    index:i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip:{
          callbacks:{
            label:function(context){
              return context.label + ': ' + context.parsed;
            }
          }
        }
      }
    },
    plugins:[{
      afterDatasetsDraw: function(chart) {
        const ctx = chart.ctx;
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        const meta = chart.getDatasetMeta(0);
        meta.data.forEach((arc, index) => {
          const value = chart.data.datasets[0].data[index];
          if(value > 0) {
            const angle = (arc.startAngle + arc.endAngle) / 2;
            const radius = (arc.innerRadius + arc.outerRadius) / 2;
            const x = arc.x + Math.cos(angle) * radius * 0.8;
            const y = arc.y + Math.sin(angle) * radius * 0.8;
            ctx.fillText(value, x, y);
          }
        });
      }
    }]
  });
  
  // Gráfico de barras por tipo de serviço
  const porTipo = {};
  state.dados.forEach(r => {
    const tipo = r.tag2 || 'Não Definido';
    const paletes = parseInt(r.paletes) || 0;
    porTipo[tipo] = (porTipo[tipo] || 0) + paletes;
  });
  
  const tipoData = Object.values(porTipo);
  const maxTipoValue = Math.max(...tipoData, 0);
  
  const c3=$('#chartLinha').getContext('2d'); 
  window._charts.linha=new Chart(c3,{
    type:'bar',
    data:{
      labels:Object.keys(porTipo),
      datasets:[{
        label:'Paletes',
        data:tipoData,
        backgroundColor:['#19502f','#e2a937','#466c53','#575756']
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:false},
        tooltip:{
          callbacks:{
            label:function(context){
              return context.label + ': ' + context.parsed.y + ' paletes';
            }
          }
        }
      },
      scales:{
        y:{
          beginAtZero:true,
          max: maxTipoValue + 10,
          ticks:{
            stepSize:1
          }
        }
      }
    },
    plugins:[{
      afterDatasetsDraw: function(chart) {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
          const meta = chart.getDatasetMeta(i);
          meta.data.forEach((bar, index) => {
            const value = dataset.data[index];
            if(value > 0) {
              ctx.fillStyle = '#333';
              ctx.font = 'bold 12px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(value, bar.x, bar.y - 5);
            }
          });
        });
      }
    }]
  });
}
function exportarExcel(){
  // Verificar se a biblioteca XLSX está disponível
  if(typeof XLSX === 'undefined') {
    alert('Biblioteca de Excel não carregada. Exportando em JSON...');
    const blob = new Blob([JSON.stringify({dados:state.dados,meta:state.meta},null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'controle-lavador-dados.json';
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // Preparar dados para Excel
  const dadosFormatados = state.dados.map(registro => ({
    'Descrição': registro.descricao || '',
    'TAG 1': registro.tag1 || '',
    'Tipo de Serviço': registro.tag2 || '',
    'Paletes': registro.paletes ?? '',
    'Observações': registro.observacoes || '',
    'OS': registro.os || '',
    'Setor Solicitante': registro.setor || '',
    'Status': registro.status || '',
    'Responsável': registro.responsavel || '',
    'Frente': registro.frente || '',
    'Data de Fim': fmtData(registro.fim) || ''
  }));

  // Criar planilha com dados principais
  const ws = XLSX.utils.json_to_sheet(dadosFormatados);

  // Configurar larguras das colunas
  const colWidths = [
    { wch: 25 }, // Descrição
    { wch: 12 }, // TAG 1
    { wch: 12 }, // Tipo de Serviço
    { wch: 10 }, // Paletes
    { wch: 20 }, // Observações
    { wch: 12 }, // OS
    { wch: 18 }, // Setor Solicitante
    { wch: 15 }, // Status
    { wch: 18 }, // Responsável
    { wch: 18 }, // Frente
    { wch: 12 }  // Data de Fim
  ];
  ws['!cols'] = colWidths;

  // Criar estatísticas resumidas
  const estatisticas = [
    ['ESTATÍSTICAS DO SISTEMA', ''],
    ['', ''],
    ['Total de Registros', state.dados.length],
    ['Registros Programados', state.dados.filter(r => r.status === 'PROGRAMADO').length],
    ['Registros Em Processo', state.dados.filter(r => r.status === 'EM PROCESSO').length],
    ['Registros Finalizados', state.dados.filter(r => r.status === 'FINALIZADO').length],
    ['', ''],
    ['Consumo do Lavador', state.meta.consumo || 0],
    ['', ''],
    ['FRENTES CADASTRADAS', ''],
    ...state.meta.frentes.map(frente => ['', frente]),
    ['', ''],
    ['RESPONSÁVEIS CADASTRADOS', ''],
    ...state.meta.responsaveis.map(resp => ['', resp]),
    ['', ''],
    ['Data da Exportação', new Date().toLocaleString('pt-BR')]
  ];

  const wsEstatisticas = XLSX.utils.aoa_to_sheet(estatisticas);
  wsEstatisticas['!cols'] = [{ wch: 25 }, { wch: 20 }];

  // Criar estatísticas por responsável
  const porResponsavel = {};
  state.dados.forEach(r => {
    const resp = r.responsavel || 'Sem Responsável';
    if (!porResponsavel[resp]) {
      porResponsavel[resp] = { total: 0, programado: 0, processo: 0, finalizado: 0 };
    }
    porResponsavel[resp].total++;
    if (r.status === 'PROGRAMADO') porResponsavel[resp].programado++;
    else if (r.status === 'EM PROCESSO') porResponsavel[resp].processo++;
    else if (r.status === 'FINALIZADO') porResponsavel[resp].finalizado++;
  });

  const dadosResponsavel = [
    ['Responsável', 'Total', 'Programado', 'Em Processo', 'Finalizado']
  ];
  
  Object.keys(porResponsavel).forEach(resp => {
    const stats = porResponsavel[resp];
    dadosResponsavel.push([resp, stats.total, stats.programado, stats.processo, stats.finalizado]);
  });

  const wsResponsavel = XLSX.utils.aoa_to_sheet(dadosResponsavel);
  wsResponsavel['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];

  // Criar estatísticas por frente
  const porFrente = {};
  state.dados.forEach(r => {
    const frente = r.frente || 'Sem Frente';
    if (!porFrente[frente]) {
      porFrente[frente] = { total: 0, programado: 0, processo: 0, finalizado: 0 };
    }
    porFrente[frente].total++;
    if (r.status === 'PROGRAMADO') porFrente[frente].programado++;
    else if (r.status === 'EM PROCESSO') porFrente[frente].processo++;
    else if (r.status === 'FINALIZADO') porFrente[frente].finalizado++;
  });

  const dadosFrente = [
    ['Frente', 'Total', 'Programado', 'Em Processo', 'Finalizado']
  ];
  
  Object.keys(porFrente).forEach(frente => {
    const stats = porFrente[frente];
    dadosFrente.push([frente, stats.total, stats.programado, stats.processo, stats.finalizado]);
  });

  const wsFrente = XLSX.utils.aoa_to_sheet(dadosFrente);
  wsFrente['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];

  // Criar workbook e adicionar as planilhas
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');
  XLSX.utils.book_append_sheet(wb, wsEstatisticas, 'Resumo Geral');
  XLSX.utils.book_append_sheet(wb, wsResponsavel, 'Por Responsável');
  XLSX.utils.book_append_sheet(wb, wsFrente, 'Por Frente');

  // Gerar nome do arquivo com data/hora
  const agora = new Date();
  const timestamp = agora.toISOString().slice(0, 19).replace(/[:]/g, '-');
  const nomeArquivo = `controle-lavador-${timestamp}.xlsx`;

  // Exportar arquivo
  XLSX.writeFile(wb, nomeArquivo);
}

function bindToolbar(){
  const btnNovo = $('#btnNovo');
  const btnExportar = $('#btnExportar');
  const btnImportar = $('#btnImportar');
  const btnLimparTudo = $('#btnLimparTudo');
  const importarArquivo = $('#importarArquivo');
  
  if(btnNovo) {
    btnNovo.onclick = () => abrirModal(null);
  }
  
  if(btnExportar) {
    btnExportar.onclick = exportarExcel;
  }
  
  if(btnImportar) {
    btnImportar.onclick = () => importarArquivo.click();
  }
  
  if(importarArquivo) {
    importarArquivo.addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const obj = JSON.parse(r.result);
          if (Array.isArray(obj.dados)) {
            state.dados = obj.dados;
            if (obj.meta) state.meta = {...state.meta, ...obj.meta};
            save(state.dados, state.meta);
            initConsumo();
            preencherListasAuxiliares();
            renderTable();
            renderDashboard();
            alert('Importado com sucesso!');
          } else {
            alert('Arquivo inválido. Esperado formato: {dados: [...], meta: {...}}');
          }
        } catch (err) {
          alert('Erro ao ler arquivo: ' + err.message);
        }
      };
      r.readAsText(f);
    });
  }
  
  if(btnLimparTudo) {
    btnLimparTudo.onclick = () => {
      if (confirm('Tem certeza? Todos os dados serão perdidos!')) {
        state.dados = [];
        save(state.dados, state.meta);
        renderTable();
        renderDashboard();
      }
    };
  }

  // Event listeners para os filtros
  const busca = $('#busca');
  const filtroStatus = $('#filtroStatus');
  const filtroResponsavel = $('#filtroResponsavel');
  const filtroFrente = $('#filtroFrente');
  const filtroDe = $('#filtroDe');
  const filtroAte = $('#filtroAte');
  const btnLimparFiltros = $('#btnLimparFiltros');
  
  // Adicionar event listeners para renderizar tabela quando filtros mudarem
  if(busca) {
    busca.addEventListener('input', renderTable);
  }
  
  if(filtroStatus) {
    filtroStatus.addEventListener('change', renderTable);
  }
  
  if(filtroResponsavel) {
    filtroResponsavel.addEventListener('change', renderTable);
  }
  
  if(filtroFrente) {
    filtroFrente.addEventListener('change', renderTable);
  }
  
  if(filtroDe) {
    filtroDe.addEventListener('change', renderTable);
  }
  
  if(filtroAte) {
    filtroAte.addEventListener('change', renderTable);
  }
  
  if(btnLimparFiltros) {
    btnLimparFiltros.onclick = () => {
      if(busca) busca.value = '';
      if(filtroStatus) filtroStatus.value = '';
      if(filtroResponsavel) filtroResponsavel.value = '';
      if(filtroFrente) filtroFrente.value = '';
      if(filtroDe) filtroDe.value = '';
      if(filtroAte) filtroAte.value = '';
      renderTable();
    };
  }
}

function bindConfig(){
  const btnSalvarFrentes = $('#btnSalvarFrentes');
  const btnAddResp = $('#btnAddResp');
  const listaResponsaveis = $('#listaResponsaveis');
  
  if(btnSalvarFrentes) {
    btnSalvarFrentes.onclick = () => {
      const frentes = [
        $('#frente1').value.trim(),
        $('#frente2').value.trim(),
        $('#frente3').value.trim(),
        $('#frente4').value.trim(),
        $('#frente5').value.trim(),
        $('#frente6').value.trim(),
        $('#frente7').value.trim(),
        $('#frente8').value.trim(),
        $('#frente9').value.trim()
      ].filter(f => f);
      
      state.meta.frentes = frentes;
      save(state.dados, state.meta);
      preencherListasAuxiliares();
      alert('Frentes salvas!');
    };
  }
  
  if(btnAddResp) {
    btnAddResp.onclick = () => {
      const novoResp = $('#novoResponsavel').value.trim();
      if (novoResp && !state.meta.responsaveis.includes(novoResp)) {
        state.meta.responsaveis.push(novoResp);
        save(state.dados, state.meta);
        preencherListasAuxiliares();
        renderListaResponsaveis();
        $('#novoResponsavel').value = '';
      }
    };
  }
  
  // Carregar dados existentes no modal
  if($('#frente1')) {
    $('#frente1').value = state.meta.frentes[0] || '';
    $('#frente2').value = state.meta.frentes[1] || '';
    $('#frente3').value = state.meta.frentes[2] || '';
    $('#frente4').value = state.meta.frentes[3] || '';
    $('#frente5').value = state.meta.frentes[4] || '';
    $('#frente6').value = state.meta.frentes[5] || '';
    $('#frente7').value = state.meta.frentes[6] || '';
    $('#frente8').value = state.meta.frentes[7] || '';
    $('#frente9').value = state.meta.frentes[8] || '';
  }
  
  renderListaResponsaveis();
}

function renderListaResponsaveis(){
  const lista = $('#listaResponsaveis');
  if(!lista) return;
  
  lista.innerHTML = '';
  state.meta.responsaveis.forEach(resp => {
    const li = document.createElement('li');
    li.innerHTML = `${resp} <button onclick="removerResponsavel('${resp}')" style="margin-left:8px;background:var(--danger);color:white;border:none;padding:2px 6px;border-radius:4px;cursor:pointer;">×</button>`;
    lista.appendChild(li);
  });
}

function removerResponsavel(resp){
  state.meta.responsaveis = state.meta.responsaveis.filter(r => r !== resp);
  save(state.dados, state.meta);
  preencherListasAuxiliares();
  renderListaResponsaveis();
}

function bindModal(){
  const form = $('#formRegistro');
  const dlg = $('#modal');
  const btnSalvar = $('#btnSalvarRegistro');
  const feedback = $('#registroFeedback');
  
  if(!form || !dlg || !btnSalvar || !feedback) return;
  
  // Event listener para o botão X do header
  const btnFechar = form.querySelector('.modal-header button[value="cancel"]');
  if(btnFechar){
    btnFechar.addEventListener('click', (e) => {
      e.preventDefault();
      dlg.close();
    });
  }
  
  // Event listener para fechar com Escape
  dlg.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
      e.preventDefault();
      dlg.close();
    }
  });
  
  // Validação em tempo real
  function validarForm(){
    let valido = true;
    if(!form.descricao.value.trim()) valido = false;
    if(!form.status.value) valido = false;
    btnSalvar.disabled = !valido;
    // Destacar campos obrigatórios
    form.descricao.style.borderColor = form.descricao.value.trim() ? '' : 'red';
    form.status.style.borderColor = form.status.value ? '' : 'red';
  }
  
  form.addEventListener('input', validarForm);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    
    // Garantir que a data seja salva no formato ISO
    let dataFim = data.fim || '';
    if(dataFim) {
      // Se já está no formato DD/MM/YYYY, converter para ISO
      if(dataFim.includes('/')) {
        const [dia, mes, ano] = dataFim.split('/');
        dataFim = `${ano}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`;
      }
    }
    
    const reg = {
      id: form.dataset.editing || uid(),
      descricao: data.descricao?.trim(),
      tag1: data.tag1?.trim(),
      tag2: data.tag2?.trim(),
      paletes: data.paletes ? Number(data.paletes) : null,
      observacoes: data.observacoes?.trim(),
      os: data.os?.trim(),
      setor: data.setor?.trim(),
      status: data.status || 'PROGRAMADO',
      responsavel: data.responsavel?.trim(),
      frente: data.frente?.trim(),
      fim: dataFim
    };
    
    if(form.dataset.editing){
      const idx = state.dados.findIndex(x => x.id === form.dataset.editing);
      state.dados[idx] = reg;
    } else {
      state.dados.push(reg);
    }
    
    save(state.dados, state.meta);
    feedback.textContent = 'Registro salvo com sucesso!';
    feedback.style.display = 'inline';
    setTimeout(() => {
      feedback.style.display = 'none';
      dlg.close();
    }, 900);
    renderTable();
    renderDashboard();
  });
  
  // Inicializar validação ao abrir
  form.addEventListener('reset', () => {
    setTimeout(validarForm, 50);
  });
}

function boot(){
  console.log('🚀 Starting application...'); // Debug
  try {
    initTheme();
    initConsumo();
    
    // Inicializar sincronização na nuvem
    setTimeout(initCloudSync, 2000); // Aguardar 2 segundos para garantir que JSONBin carregou
    
    // Verificar se estamos na página principal
    const welcomeScreen = document.querySelector('.welcome-screen');
    if(welcomeScreen) {
      console.log('✅ Welcome screen found - usando navegação inline'); // Debug
      // Não precisa fazer nada, os botões usam onclick inline
    } else {
      console.log('📄 Not on welcome screen, loading full functionality'); // Debug
      initTabs();
      preencherListasAuxiliares();
      bindToolbar();
      bindConfig();
      bindModal();
      renderTable();
      renderDashboard();
    }
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
  }
}

function initTheme(){
  // Recuperar tema salvo ou usar escuro como padrão
  const savedTheme = localStorage.getItem('controle-lavador-theme') || 'dark';
  applyTheme(savedTheme);
  
  // Adicionar event listener ao botão
  const btnToggle = $('#btnToggleTheme');
  if(btnToggle) {
    btnToggle.onclick = toggleTheme;
  }
}

function toggleTheme(){
  const currentTheme = document.documentElement.classList.contains('light-theme') ? 'light' : 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('controle-lavador-theme', newTheme);
  
  // Recriar gráficos para aplicar as novas cores de legenda
  if(window.location.pathname.includes('dashboard.html')){
    renderDashboard();
  }
}

function applyTheme(theme){
  const root = document.documentElement;
  const themeIcon = $('#themeIcon');
  
  if(theme === 'light'){
    root.classList.add('light-theme');
    if(themeIcon) themeIcon.textContent = '☀️';
    const btnToggle = $('#btnToggleTheme');
    if(btnToggle) btnToggle.title = 'Alternar para modo escuro';
  } else {
    root.classList.remove('light-theme');
    if(themeIcon) themeIcon.textContent = '🌙';
    const btnToggle = $('#btnToggleTheme');
    if(btnToggle) btnToggle.title = 'Alternar para modo claro';
  }
}

// Função para atualizar o indicador de sincronização
function updateSyncIndicator() {
  const indicator = $('#syncIndicator');
  if (!indicator) return;
  
  const icon = indicator.querySelector('.sync-icon');
  const text = indicator.querySelector('.sync-text');
  
  if (!window.jsonBinManager) {
    // JSONBin não carregado
    indicator.className = 'sync-indicator offline';
    if (icon) icon.textContent = '📱';
    if (text) text.textContent = 'Local';
    indicator.title = 'Dados salvos apenas localmente';
    return;
  }
  
  const status = window.jsonBinManager.getStatus();
  
  if (!status.configured) {
    // Não configurado
    indicator.className = 'sync-indicator offline';
    if (icon) icon.textContent = '⚙️';
    if (text) text.textContent = 'Config';
    indicator.title = 'JSONBin não configurado - dados apenas locais';
  } else if (!status.online) {
    // Offline
    indicator.className = 'sync-indicator offline';
    if (icon) icon.textContent = '📵';
    if (text) text.textContent = 'Offline';
    indicator.title = 'Sem conexão - dados salvos localmente';
  } else if (status.ready) {
    // Online e pronto
    indicator.className = 'sync-indicator online';
    if (icon) icon.textContent = '☁️';
    if (text) text.textContent = 'Nuvem';
    indicator.title = 'Conectado ao JSONBin - dados sincronizados';
  } else {
    // Erro
    indicator.className = 'sync-indicator error';
    if (icon) icon.textContent = '⚠️';
    if (text) text.textContent = 'Erro';
    indicator.title = 'Erro na conexão com JSONBin';
  }
}

// Função para sincronizar dados da nuvem ao iniciar
async function initCloudSync() {
  try {
    if (window.jsonBinManager && window.jsonBinManager.isReady()) {
      console.log('🔄 Sincronizando dados da nuvem...');
      await window.jsonBinManager.syncFromCloud();
    }
    updateSyncIndicator();
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}

// Atualizar indicador a cada 10 segundos
setInterval(updateSyncIndicator, 10000);

document.addEventListener('DOMContentLoaded', boot);
