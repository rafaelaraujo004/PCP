// PWA install
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});
installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

// Toast helper
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  setTimeout(()=> el.hidden = true, 2500);
}

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// Data model
const MODEL_KEY = 'form384:v1';
const model = JSON.parse(localStorage.getItem(MODEL_KEY) || '{}');

// Section definitions (subset faithful ao PDF)
const tables = {
  cabine: [
    "Estado dos vidros",
    "Estado das fechaduras/maçanetas",
    "Vedação das portas",
    "Painel e seus acabamentos",
    "Painel de instrumentos",
    "Portas",
    "Retrovisores",
    "Acionamento dos vidros",
    "Volante/Joystick/Alavanca de Marcha/Comando de implementos",
    "Instrumentos de operação do implemento",
    "Pedais",
    "Alerta visual e sonoro de posicionamento da bascula"
  ],
  estruturaExterna: [
    "Adesivo POP U&M completos - mobilização e transferência",
    "Adesivo POP U&M retirados - desmobilização",
    "Faixas refletivas Detran",
    "Faixas refletivas U&M",
    "Guarda-ciclista",
    "Placas Onu",
    "Placas Detran (Dianteira/Traseira)",
    "Guarda-corpo",
    "Para-choques dianteiro e traseiro",
    "Cones",
    "Escadas de acesso",
    "Dispositivo de Aterramento",
    "Armários Implemento"
  ],
  estadoImplemento: [
    "Bascula (ver aba - Bascula)",
    "Concha, pontas e adaptadores",
    "Lâmina e bordas",
    "Pipa / canhão d’água / rabo de pavão",
    "Escarificador",
    "Caçamba Rodoviário",
    "Comboio",
    "Munk (Controles/Bateria/Patolas/Abertura de Hastes)",
    "Tire Handler/Garfo/Torre",
    "Estado geral do implemento",
    "Estado geral do chassi",
    "Dispositivo de Enclinômetro caçamba rodoviário",
    "Sistema de lubrificação automático",
    "Sistema de supressão de incêndio",
    "Sistema de acionamento do implemento",
    "Tacógrafo",
    "CRLV, CIV, CIPP, Laudo dos Vasos & Manômetro"
  ],
  pneus: [
    "Em condições de uso?",
    "Pneus estão calibrados?",
    "Perfurações",
    "Picoteamento",
    "Desgaste irregular",
    "Desgaste total",
    "Rodas",
    "Estepe",
    "Transporte será realizado com os pneus vazios?"
  ],
  chassi: [
    "Trincas na fixação dos implementos?",
    "Trincas na estrutura do chassi?",
    "Trincas no tanque comboio, diesel e pipa?"
  ],
  sistDirecao: [
    "Direção sem folga",
    "Setor e barra de direção sem folga",
    "Bomba de direção sem vazamento"
  ],
  sistFreio: [
    "Freio retarder",
    "Lonas/discos/pastilhas/tambor",
    "Válvula",
    "Catracas de freio",
    "Cuícas de freio"
  ],
  sistSusp: [
    "Amortecedor",
    "Eixos do caminhão",
    "Molas"
  ],
  tremForca: [
    "Comando final",
    "Conversor de torque",
    "Cubos de roda",
    "Diferencial",
    "Transmissão",
    "Alternador principal",
    "Roda motorizada",
    "Motor elétrico",
    "Embreagem",
    "Barra V",
    "Grampos",
    "Caixa de Marcha",
    "Cardan/Cruzeta"
  ],
  motor: [
    "Motor diesel",
    "Tubulação de descarga",
    "Bomba d'água",
    "Manta térmica",
    "Turbina",
    "Número de série do motor"
  ],
  refrig: [
    "Radiador",
    "Hélice",
    "Mangueiras",
    "Correia"
  ],
  vazamentos: [
    "Apresenta vazamento hidráulico",
    "Apresenta vazamento óleo do motor",
    "Apresenta vazamento transmissão",
    "Apresenta vazamento líquido arrefecedor",
    "Apresenta vazamento na linha do diesel do implemento",
    "Apresenta vazamento nos cubos de roda/cilindros/juntas/comandos",
    "Apresenta vazamento na linha de abastecimento dos fluidos do implemento",
    "Apresenta vazamento na linha do ar do caminhão",
    "Apresenta vazamento nas bombas",
    "Apresenta vazamento nas mangueiras"
  ],
  eletrico: [
    "Bateria(s)",
    "Bandeirola",
    "Buzina",
    "Caixa de bateria",
    "Caixa de bloqueio",
    "Câmera marcha à ré",
    "Chave geral",
    "Display da câmera",
    "Faróis e setas LD/LE dianteiros",
    "Faróis e setas LD/LE traseiros",
    "Giroled",
    "Iluminação interna da cabine",
    "Luzes auxiliares de manobras",
    "Luz e alerta sonoro marcha à ré",
    "Câmera guarda corpo"
  ],
  manutencao: [
    "Foi realizado algum reparo no equipamento antes do envio?",
    "Equipamento estava parado? Informe tempo",
    "Equipamento possui histórico de análise de fluidos? (FORM – Análise de Fluidos)",
    "Fotos foram anexadas? (ABA – Fotos)",
    "Equipamento lubrificado"
  ],
  formsDocs: [
    "FORM_321 - Inspeção e Medição de Material Rodante",
    "FORM_283 - Formulário de Teste e Ajuste"
  ],
};

const levels = [
  "Óleo combustível",
  "Óleo do motor",
  "Óleo hidráulico",
  "Óleo hidráulico do martelo (perfuratriz)",
  "Óleo da transmissão",
  "Óleo de freio",
  "Óleo de direção",
  "Graxa reservatório",
  "Óleo de engrenagem (roda motorizada)",
  "Óleo de engrenagem (cubo dianteiro/comando final/redutor de giro)",
  "Óleo de engrenagem (caixa de giro/comando dianteiro/comando traseiro/diferencial/eixo planetário/transmissão)",
  "Óleo do PTO",
  "Líquido Arrefecimento - XLC"
];

// Render helper
function renderTables() {
  document.querySelectorAll('.table-wrap').forEach(container => {
    const key = container.getAttribute('data-table');
    const items = tables[key];
    const tpl = document.getElementById('tplCheckTable');
    const node = tpl.content.cloneNode(true);
    const tbody = node.querySelector('tbody');
    items.forEach((desc, idx) => {
      const tr = document.createElement('tr');
      const id = `${key}.${idx}`;
      tr.innerHTML = `
        <td style="width:12px;max-width:12px;padding:1px 2px;text-align:center;">${String(idx+1).padStart(2,'0')}</td>
  <td style="width:40px;max-width:60px;padding:1px 2px;">${desc}</td>
        <td style="width:40px;max-width:60px;padding:1px 2px;">
          ${radioGroup(`${id}.envio`, model?.[key]?.[idx]?.envio ?? '')}
        </td>
        <td style="width:40px;max-width:60px;padding:1px 2px;">
          ${radioGroup(`${id}.receb`, model?.[key]?.[idx]?.receb ?? '')}
        </td>`;
      tbody.appendChild(tr);
    });
    container.innerHTML = '';
    container.appendChild(node);
  });

  const levelsGrid = document.getElementById('levelsGrid');
  levelsGrid.innerHTML = '';
  levels.forEach((desc, i) => {
    const valEnvio = getModel(`niveis.${i}.envio`) || '';
    const valReceb = getModel(`niveis.${i}.receb`) || '';
    const wrap = document.createElement('div');
    wrap.className = 'level';
    wrap.innerHTML = `
      <div>${desc}</div>
      <select data-model="niveis.${i}.envio">
        ${opts(valEnvio)}
      </select>
      <select data-model="niveis.${i}.receb">
        ${opts(valReceb)}
      </select>`;
    levelsGrid.appendChild(wrap);
  });
}
function opts(sel){ return ['Completo','Parcial','Drenado','N/A'].map(v=>`<option ${sel===v?'selected':''}>${v}</option>`).join(''); }

function radioGroup(name, sel) {
  // Se for pneus ou chassi, usa Sim/OK/NOK/N/A
  if (name.startsWith('pneus.') || name.startsWith('chassi.')) {
    return ['Sim', 'OK', 'NOK', 'N/A'].map(v => `
      <div class="check">
        <label class="radio-label">
          <input type="radio" id="${name}-${v}" name="${name}" value="${v}" ${sel===v ? 'checked' : ''}>
          <span>${v}</span>
        </label>
      </div>`).join('');
  }
  // Demais seções continuam com OK/NOK/N/A
  return ['OK', 'NOK', 'N/A'].map(v => `
    <div class="check">
      <label class="radio-label">
        <input type="radio" id="${name}-${v}" name="${name}" value="${v}" ${sel===v ? 'checked' : ''}>
        <span>${v}</span>
      </label>
    </div>`).join('');
}

function setModel(path, value) {
  const parts = path.split('.');
  let ref = model;
  for (let i=0; i<parts.length-1; i++) {
    const p = parts[i];
    if (!ref[p]) ref[p] = {};
    ref = ref[p];
  }
  ref[parts[parts.length-1]] = value;
  localStorage.setItem(MODEL_KEY, JSON.stringify(model));
}

function getModel(path) {
  return path.split('.').reduce((acc, p)=> acc?.[p], model);
}

// Bind inputs
function bindInputs() {
  document.querySelectorAll('[data-model]').forEach(el => {
    const path = el.getAttribute('data-model');
    const val = getModel(path);
    if (val !== undefined) {
      if (el.type === 'checkbox') el.checked = Boolean(val);
      else el.value = val;
    }
    el.addEventListener('input', () => {
      setModel(path, el.type==='checkbox' ? el.checked : el.value);
    });
  });

  document.querySelectorAll('input[type="radio"]').forEach(el => {
    el.addEventListener('change', e => {
      const name = el.getAttribute('name'); // already namespaced
      setModel(name, el.value);
    });
  });
}

// Fotos
const fotoInput = document.getElementById('fotoInput');
const fotosGrid = document.getElementById('fotosGrid');
fotoInput?.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  for (const f of files) {
    const url = await fileToDataURL(f);
    pushPhoto(url);
  }
  toast('Fotos adicionadas');
  renderPhotos();
});
function pushPhoto(dataUrl) {
  if (!model.fotos) model.fotos = [];
  model.fotos.push({dataUrl, ts: Date.now()});
  localStorage.setItem(MODEL_KEY, JSON.stringify(model));
}
function renderPhotos() {
  fotosGrid.innerHTML = '';
  (model.fotos||[]).forEach((p, i) => {
    const fig = document.createElement('figure');
    fig.innerHTML = `<img src="${p.dataUrl}" alt="Foto ${i+1}"><figcaption>Foto ${i+1}</figcaption>`;
    fotosGrid.appendChild(fig);
  });
}
function fileToDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }

// Signatures
function initSignature(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  let drawing = false, last = null;
  function pos(e) { const rect = canvas.getBoundingClientRect(); const x = (e.touches?e.touches[0]:e).clientX-rect.left; const y = (e.touches?e.touches[0]:e).clientY-rect.top; return {x,y}; }
  function start(e){ drawing = true; last = pos(e); }
  function move(e){ if(!drawing) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p; }
  function end(){ drawing=false; setModel(`assinaturas.${canvasId}`, canvas.toDataURL('image/png')); }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, {passive:true});
  canvas.addEventListener('touchmove', move, {passive:true});
  window.addEventListener('touchend', end);

  // restore
  const saved = getModel(`assinaturas.${canvasId}`);
  if (saved) {
    const img = new Image();
    img.onload = ()=> ctx.drawImage(img,0,0);
    img.src = saved;
  }
}
initSignature('signEnvio');
initSignature('signReceb');

// Render tables and bind
renderTables();
bindInputs();
renderPhotos();

// Botões
document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
  window.print();
});
document.getElementById('limparBtn')?.addEventListener('click', () => {
  if (confirm('Limpar todos os dados preenchidos?')) {
    localStorage.removeItem(MODEL_KEY);
    // Limpa as assinaturas dos canvas
    const canvasIds = ['signEnvio', 'signReceb'];
    canvasIds.forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
    location.reload();
  }
});

// Backend sync (opcional): tenta enviar para /api/submissoes se existir
async function trySync() {
  try {
    const res = await fetch('/api/submissoes', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ payload: model, ts: Date.now() })
    });
    if (res.ok) toast('Dados enviados para o servidor');
  } catch (e) {
    // offline ou sem backend — tudo bem
  }
}
window.addEventListener('online', trySync);
