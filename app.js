
// PCP Go — v1p2 (gráficos + "Rápido" + limpar tudo)
const STORE='pcpgo:v1p2';
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>Array.from(el.querySelectorAll(s));

let DB={
  workCenters:[], // {id,name,capUph,shiftHours}
  atividades:[],  // {id,tagFamilia,descricao}
  roteiros:[],    // {id,atividadeId,steps:[{id,wcId,minPerUnit,seq}]}
  os:[],          // {...}
  apontamentos:[] // {id,osId,wcId,qtyOk,qtyRef,resp,obs,ts,reviewed}
};
function save(){ localStorage.setItem(STORE, JSON.stringify(DB)); }
function load(){ try{ DB=JSON.parse(localStorage.getItem(STORE))||DB; }catch(e){} }
load();

// seed

let currentTab='dash';
const TABS=[
  {id:'dash',name:'Dashboard'},
  {id:'rap',name:'Rápido'},
  {id:'os',name:'OS'},
  {id:'atv',name:'Atividades'},
  {id:'wc',name:'Frentes/Centros'},
  {id:'rot',name:'Roteiros'},
  {id:'sched',name:'Agenda'}
];

function renderTabs(){
  const nav=$('#tabs'); nav.innerHTML='';
  TABS.forEach(t=>{
    const b=document.createElement('button'); b.textContent=t.name;
    b.className=t.id===currentTab?'active':'';
    b.onclick=()=>{ currentTab=t.id; render(); };
    nav.appendChild(b);
  });
  // Botão limpar (limpa TUDO)
  const clean=document.createElement('button');
  clean.textContent='🧹 Limpar';
  clean.className='clean';
  clean.onclick=()=>{
    if(confirm('Isso vai apagar TODOS os dados do app (OS, atividades, frentes, roteiros, apontamentos, configurações). Confirmar?')){
      localStorage.clear(); // limpa todas as chaves
      alert('Tudo limpo. Recarregando...');
      location.reload();
    }
  };
  nav.appendChild(clean);
}

function render(){
  renderTabs();
  const m=$('#app'); m.innerHTML='';
  if(currentTab==='dash') renderDash(m);
  if(currentTab==='rap') renderRapido(m);
  if(currentTab==='os') renderOS(m);
  if(currentTab==='atv') renderAtividades(m);
  if(currentTab==='wc') renderWC(m);
  if(currentTab==='rot') renderRoteiros(m);
  if(currentTab==='sched') renderSchedule(m);
  initDnD();
}

// helpers
function uid(p='id'){ return p+Math.random().toString(36).slice(2,9); }
function today(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
function plusDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function fmtDate(d){ return d? new Date(d).toLocaleDateString(): '—'; }
function fmtDateTime(ts){ return new Date(ts).toLocaleString(); }

// CRUD
function addWC(name,capUph=30,shiftHours=8){ const wc={id:uid('wc_'),name,capUph:Number(capUph),shiftHours:Number(shiftHours)}; DB.workCenters.push(wc); return wc; }
function addAtv(tagFamilia,descricao){ const a={id:uid('at_'),tagFamilia,descricao}; DB.atividades.push(a); return a; }
function addRoteiro(atividadeId,steps){ const r={id:uid('rt_'),atividadeId,steps:steps.map((s,i)=>({id:uid('st_'),wcId:s.wcId,minPerUnit:Number(s.minPerUnit),seq:i+1}))}; DB.roteiros.push(r); return r; }
function addOS(atividadeId,tagItem,osNumber,setor,responsavel,inicio,fim,prioridade,status,qty,due){
  const o={id:uid('os_'),atividadeId,tagItem,osNumber,setor,responsavel,inicio,fim,prioridade:Number(prioridade||2),status,qty:Number(qty||0),due,stepIndex:0,history:[]};
  DB.os.push(o); return o;
}
function addApontamento(osId,wcId,qtyOk,qtyRef,resp,obs){
  const a={id:uid('ap_'),osId,wcId,qtyOk:Number(qtyOk||0),qtyRef:Number(qtyRef||0),resp:resp||'',obs:obs||'',ts:new Date().toISOString(),reviewed:false};
  DB.apontamentos.push(a); save(); return a;
}
function atvById(id){ return DB.atividades.find(a=>a.id===id); }
function wcById(id){ return DB.workCenters.find(w=>w.id===id); }
function rotByAtv(id){ return DB.roteiros.find(r=>r.atividadeId===id); }
function osById(id){ return DB.os.find(o=>o.id===id); }

// Dashboard com KPIs + gráficos
function renderDash(m){
  const aberto = DB.os.filter(o=>o.status!=='FINALIZADO').length;
  const finalizadas = DB.os.filter(o=>o.status==='FINALIZADO').length;
  const atrasadas = DB.os.filter(o=>o.status!=='FINALIZADO' && new Date(o.due) < new Date()).length;
  const wrap=document.createElement('div');
  wrap.innerHTML=`
    <div class="grid cols-3">
      <div class="card kpi"><div class="dot" style="background:#0ea5e9"></div><div><div class="muted">OS em aberto</div><div style="font-size:28px;font-weight:900">${aberto}</div></div></div>
      <div class="card kpi"><div class="dot" style="background:#22c55e"></div><div><div class="muted">Finalizadas</div><div style="font-size:28px;font-weight:900">${finalizadas}</div></div></div>
      <div class="card kpi"><div class="dot" style="background:#ef4444"></div><div><div class="muted">Atrasadas</div><div style="font-size:28px;font-weight:900">${atrasadas}</div></div></div>
    </div>
    <div class="charts" style="margin-top:12px">
      <div class="chart"><h3>Status das OS</h3><div id="chart-status" class="box"></div><div class="legend" id="legend-status"></div></div>
      <div class="chart"><h3>Produção por Frente (7 dias)</h3><div id="chart-wc" class="box"></div></div>
      <div class="chart" style="grid-column:1/2 / span 2"><h3>Throughput Diário (14 dias)</h3><div id="chart-line" class="box"></div></div>
    </div>`;
  m.appendChild(wrap);

  const sc = countByStatus();
  const cols = ['#0ea5e9','#f59e0b','#60a5fa','#22c55e'];
  drawDonut($('#chart-status'), [sc.PROGRAMADO, sc['EM PROCESSO'], sc.PAUSADO, sc.FINALIZADO], cols);
  renderLegend($('#legend-status'), ['PROGRAMADO','EM PROCESSO','PAUSADO','FINALIZADO'], cols, [sc.PROGRAMADO, sc['EM PROCESSO'], sc.PAUSADO, sc.FINALIZADO]);

  const wcAgg = aggregateByWC(7); drawBars($('#chart-wc'), wcAgg.labels, wcAgg.values, '#0ea5e9', '#22c55e');
  const lineAgg = throughputByDay(14); drawLine($('#chart-line'), lineAgg.labels, lineAgg.values, '#f59e0b', '#0ea5e9');
}
function countByStatus(){ const m={'PROGRAMADO':0,'EM PROCESSO':0,'PAUSADO':0,'FINALIZADO':0}; DB.os.forEach(o=> m[o.status]=(m[o.status]||0)+1 ); return m; }
function aggregateByWC(days=7){
  const since = new Date(); since.setDate(since.getDate()-days);
  const map = new Map();
  DB.apontamentos.forEach(a=>{ const ts=new Date(a.ts); if(ts>=since){ map.set(a.wcId,(map.get(a.wcId)||0)+Number(a.qtyOk||0)); }});
  const labels = DB.workCenters.map(w=>w.name);
  const values = labels.map(n=> { const w=DB.workCenters.find(x=>x.name===n); return map.get(w?.id)||0; });
  return {labels, values};
}
function throughputByDay(days=14){
  const map = new Map(); for(let i=days-1;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const key=d.toISOString().slice(0,10); map.set(key,0); }
  DB.apontamentos.forEach(a=>{ const key=(new Date(a.ts)).toISOString().slice(0,10); if(map.has(key)) map.set(key, map.get(key)+Number(a.qtyOk||0)); });
  const labels = Array.from(map.keys()).map(d=> new Date(d).toLocaleDateString());
  const values = Array.from(map.values());
  return {labels, values};
}
function renderLegend(el, labels, colors, values){
  el.innerHTML = labels.map((l,i)=>`<div class="item"><span class="dot" style="background:${colors[i]}"></span>${l} (${values[i]||0})</div>`).join('');
}
// Charts SVG
function drawDonut(el, values, colors){
  const size = 240, cx=size/2, cy=size/2, r=80, stroke=36;
  const total = values.reduce((a,b)=>a+b,0) || 1;
  const svg = [`<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`];
  let start = -90;
  for(let i=0;i<values.length;i++){
    const v=values[i]; const ang=360*(v/total); const end=start+ang; const large=ang>180?1:0;
    const sx = cx + r*Math.cos(Math.PI*start/180), sy = cy + r*Math.sin(Math.PI*start/180);
    const ex = cx + r*Math.cos(Math.PI*end/180),   ey = cy + r*Math.sin(Math.PI*end/180);
    svg.push(`<path d="M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}" stroke="${colors[i%colors.length]}" stroke-width="${stroke}" fill="none" />`);
    start=end;
  }
  svg.push(`<circle cx="${cx}" cy="${cy}" r="${r-stroke/2}" fill="#0b1220"/><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="#cbd5e1" font-weight="700">${total}</text></svg>`);
  el.innerHTML = svg.join('');
}
function drawBars(el, labels, values, color, highlight){
  const width = Math.max(320, labels.length*70), height=280, pad=40, max=Math.max(10, ...values);
  const svg=[`<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`];
  for(let g=0; g<=4; g++){ const y=pad+(height-pad-30)*g/4; svg.push(`<line x1="${pad}" y1="${y}" x2="${width-10}" y2="${y}" stroke="#1f2937"/>`); }
  const barW=32, gap=(width-pad-20)/labels.length;
  values.forEach((v,i)=>{ const h=(height-pad-30)*(v/max); const x=pad+gap*i+(gap-barW)/2; const y=height-30 - h;
    const c=(v===Math.max(...values) && v>0)?highlight:color;
    svg.push(`<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(0,h)}" rx="6" ry="6" fill="${c}"/>`);
    svg.push(`<text x="${x+barW/2}" y="${height-12}" font-size="11" fill="#9ca3af" text-anchor="middle">${labels[i].slice(0,10)}</text>`);
  });
  svg.push(`</svg>`); el.innerHTML=svg.join('');
}
function drawLine(el, labels, values, stroke, fill){
  const width=Math.max(400, labels.length*40), height=280, pad=40, max=Math.max(10, ...values);
  const svg=[`<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`];
  for(let g=0; g<=4; g++){ const y=pad+(height-pad-30)*g/4; svg.push(`<line x1="${pad}" y1="${y}" x2="${width-10}" y2="${y}" stroke="#1f2937"/>`); }
  const pts = values.map((v,i)=>{ const x=pad + i*(width-pad-20)/Math.max(1,labels.length-1); const y=height-30 - (height-pad-30)*(v/max); return [x,y]; });
  if(pts.length){
    const d=pts.map((p,i)=> (i?'L':'M')+p[0]+' '+p[1]).join(' ');
    const d2 = d+` L ${pad+(width-pad-20)} ${height-30} L ${pad} ${height-30} Z`;
    svg.push(`<path d="${d2}" fill="${fill}30"/>`);
    svg.push(`<path d="${d}" stroke="${stroke}" stroke-width="2.5" fill="none"/>`);
    pts.forEach(p=> svg.push(`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${stroke}"/>`));
  }
  labels.forEach((lab,i)=>{ if(i%Math.ceil(labels.length/7)===0 || i===labels.length-1){ const x=pad + i*(width-pad-20)/Math.max(1,labels.length-1); svg.push(`<text x="${x}" y="${height-8}" font-size="11" fill="#9ca3af" text-anchor="middle">${lab}</text>`); } });
  svg.push(`</svg>`); el.innerHTML=svg.join('');
}

// RÁPIDO — apontamento simplificado
function renderRapido(m){
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="card">
      <h2>Adicionar Apontamento (Rápido)</h2>
      <div class="pill">Operacional — mínimo de campos</div>
      <div class="row">
        <div><label>OS</label><select id="qa-os"></select></div>
        <div><label>Frente/Centro</label><select id="qa-wc"></select></div>
      </div>
      <div class="row">
        <div><label>Quantidade OK</label><input id="qa-ok" type="number" min="0" value="0"></div>
        <div><label>Refugo</label><input id="qa-ref" type="number" min="0" value="0"></div>
      </div>
      <div class="row">
        <div><label>Responsável</label><input id="qa-resp" placeholder="Ex.: GAVIÃO"></div>
        <div><label>Observação</label><input id="qa-obs" placeholder="Ex.: ajuste / setup"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn" id="qa-save">Salvar</button>
        <button class="btn ghost" id="qa-new">Salvar + Novo</button>
      </div>
    </div>
    <div class="card" style="margin-top:12px">
      <h2>Últimos apontamentos</h2>
      <table><thead><tr><th>Data</th><th>OS</th><th>Frente</th><th>OK</th><th>Ref</th><th>Resp.</th><th>Obs</th></tr></thead>
      <tbody id="qa-list"></tbody></table>
    </div>`;
  m.appendChild(wrap);

  const selOS=$('#qa-os',wrap); selOS.innerHTML = DB.os.filter(o=>o.status!=='FINALIZADO').map(o=>{
    const a=atvById(o.atividadeId); return `<option value="${o.id}">${a?.descricao||'Atividade'} • OS ${o.osNumber||o.id.slice(-6).toUpperCase()}</option>`;
  }).join('');
  const selWC=$('#qa-wc',wrap);
  function refreshWC(){ const o=osById(selOS.value); const r=rotByAtv(o?.atividadeId); selWC.innerHTML=(r?.steps||[]).map(s=> `<option value="${s.wcId}">${wcById(s.wcId)?.name||''}</option>`).join(''); }
  selOS.onchange=refreshWC; refreshWC();

  function saveAct(reset=false){
    const osId=selOS.value, wcId=selWC.value;
    const ok=Number($('#qa-ok',wrap).value||0), ref=Number($('#qa-ref',wrap).value||0);
    const resp=$('#qa-resp',wrap).value.trim(), obs=$('#qa-obs',wrap).value.trim();
    if(!osId||!wcId) return alert('Selecione OS e Frente');
    addApontamento(osId,wcId,ok,ref,resp,obs); save();
    if(reset){ $('#qa-ok',wrap).value=0; $('#qa-ref',wrap).value=0; $('#qa-resp',wrap).value=''; $('#qa-obs',wrap).value=''; }
    renderRapido(m);
  }
  $('#qa-save',wrap).onclick=()=> saveAct(false);
  $('#qa-new',wrap).onclick=()=> saveAct(true);

  const list=$('#qa-list',wrap);
  const latest=[...DB.apontamentos].sort((a,b)=> new Date(b.ts)-new Date(a.ts)).slice(0,12);
  list.innerHTML = latest.map(a=>{
    const o=osById(a.osId); const atv=atvById(o?.atividadeId);
    return `<tr><td>${fmtDateTime(a.ts)}</td><td>${atv?.descricao||''} • ${o?.osNumber||o?.id.slice(-6).toUpperCase()}</td><td>${wcById(a.wcId)?.name||''}</td><td>${a.qtyOk}</td><td>${a.qtyRef}</td><td>${a.resp||''}</td><td>${a.obs||''}</td></tr>`;
  }).join('');
}

// (demais telas) — iguais à v1p, preservadas
function renderOS(m){
  const wrap=document.createElement('div');
  wrap.innerHTML=`
  <div class="grid cols-2">
    <div class="card">
      <h2>Criar OS</h2>
      <div class="row">
        <div><label>Atividade Demanda</label><select id="os-atv"></select></div>
        <div><label>TAG (família)</label><input id="os-tagfam" placeholder="Ex.: CL09"/></div>
      </div>
      <div class="row">
        <div><label>TAG (item)</label><input id="os-tag" placeholder="Ex.: CL09053"/></div>
        <div><label>OS nº</label><input id="os-osn" placeholder="Ex.: 4656835"/></div>
      </div>
      <div class="row">
        <div><label>Setor Solicitante</label><input id="os-setor" placeholder="Ex.: CILINDROS"/></div>
        <div><label>Responsável</label><input id="os-resp" placeholder="Ex.: GAVIÃO"/></div>
      </div>
      <div class="row">
        <div><label>Início</label><input id="os-inicio" type="date" value="${today()}"/></div>
        <div><label>Fim</label><input id="os-fim" type="date"/></div>
      </div>
      <div class="row">
        <div><label>Prioridade</label><select id="os-prio"><option value="1">1</option><option value="2" selected>2</option></select></div>
        <div><label>Prazo (Due)</label><input id="os-due" type="date" value="${plusDays(7)}"/></div>
      </div>
      <div class="row">
        <div><label>Quantidade</label><input id="os-qty" type="number" value="10"/></div>
        <div><label>Status</label><select id="os-status"><option>PROGRAMADO</option><option>EM PROCESSO</option><option>PAUSADO</option><option>FINALIZADO</option></select></div>
      </div>
      <label>Observações</label><input id="os-obs" placeholder="Anotações..."/>
      <button class="btn" id="os-save">Salvar OS</button>
    </div>
    <div class="card">
      <h2>OS</h2>
      <table><thead><tr>
        <th>ATIVIDADE DEMANDA</th><th>TAG</th><th>TAG (ITEM)</th><th>OS</th><th>SETOR SOLICITANTE</th><th>STATUS</th><th>RESPONSÁVEL</th><th>INÍCIO</th><th>FIM</th><th>PRIORIDADE</th>
      </tr></thead><tbody id="os-list"></tbody></table>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <h2>Kanban</h2>
    <div class="kanban">
      ${kanbanCol('PROGRAMADO','PROGRAMADO')}
      ${kanbanCol('EM PROCESSO','EM PROCESSO')}
      ${kanbanCol('PAUSADO','PAUSADO')}
      ${kanbanCol('FINALIZADO','FINALIZADO')}
    </div>
  </div>`;
  m.appendChild(wrap);

  const sel=$('#os-atv',wrap); sel.innerHTML=DB.atividades.map(a=>`<option value="${a.id}">${a.descricao} (TAG ${a.tagFamilia||''})</option>`).join('');
  $('#os-save',wrap).onclick=()=>{
    const atv = $('#os-atv',wrap).value;
    const tagfam = $('#os-tagfam',wrap).value.trim();
    const tag = $('#os-tag',wrap).value.trim();
    const osn = $('#os-osn',wrap).value.trim();
    const setor = $('#os-setor',wrap).value.trim();
    const resp = $('#os-resp',wrap).value.trim();
    const inicio = $('#os-inicio',wrap).value;
    const fim = $('#os-fim',wrap).value;
    const prio = $('#os-prio',wrap).value;
    const status = $('#os-status',wrap).value;
    const qty = Number($('#os-qty',wrap).value||0);
    const due = $('#os-due',wrap).value;
    const a = DB.atividades.find(x=>x.id===atv); if(a){ a.tagFamilia = tagfam || a.tagFamilia; }
    addOS(atv, tag, osn, setor, resp, inicio, fim, prio, status, qty, due); save(); render();
  };

  const tb=$('#os-list',wrap);
  tb.innerHTML = DB.os.map(o=>{
    const a=atvById(o.atividadeId)||{};
    return `<tr>
      <td>${a.descricao||''}</td>
      <td>${a.tagFamilia||''}</td>
      <td>${o.tagItem||''}</td>
      <td>${o.osNumber||''}</td>
      <td>${o.setor||''}</td>
      <td>${o.status||''}</td>
      <td>${o.responsavel||''}</td>
      <td>${fmtDate(o.inicio)}</td>
      <td>${fmtDate(o.fim)}</td>
      <td>${o.prioridade||''}</td>
    </tr>`;
  }).join('');
}

function osCard(o){
  const a=atvById(o.atividadeId)||{descricao:'Atividade'};
  const r=rotByAtv(o.atividadeId); const tot=r? r.steps.length:0;
  const step = tot? `${Math.min(o.stepIndex+1,tot)}/${tot}` : '—';
  const map = {'PROGRAMADO':['status-backlog','PROGRAMADO'],'EM PROCESSO':['status-prog','EM PROCESSO'],'PAUSADO':['status-pause','PAUSADO'],'FINALIZADO':['status-done','FINALIZADO']};
  const [cls,label]=map[o.status]||['status-backlog',o.status];
  return `<div class="card-wo" draggable="true" data-os="${o.id}">
    <div style="display:flex;justify-content:space-between;gap:8px">
      <div><b>${a.descricao}</b><div class="muted">TAG ${a.tagFamilia||''} • OS ${o.osNumber||o.id.slice(-6).toUpperCase()}</div></div>
      <div class="status ${cls}"><span class="badge"></span>${label}</div>
    </div>
    <div class="muted">Qtde: <b>${o.qty}</b> • Prazo: <b>${fmtDate(o.due)}</b> • Etapa: <b>${step}</b></div>
    <div class="actions">
      ${o.status!=='FINALIZADO'? `<button class="btn" data-act="start" data-id="${o.id}">Iniciar</button>`:''}
      ${o.status==='EM PROCESSO'? `<button class="btn ghost" data-act="pause" data-id="${o.id}">Pausar</button>`:''}
      ${o.status!=='FINALIZADO'? `<button class="btn ghost" data-act="advance" data-id="${o.id}">Avançar etapa</button>`:''}
      ${o.status!=='FINALIZADO'? `<button class="btn warn" data-act="finish" data-id="${o.id}">Finalizar</button>`:''}
    </div>
  </div>`;
}
function kanbanCol(status,title){
  const list=DB.os.filter(o=>o.status===status);
  return `<div class="col" data-col="${status}"><h3>${title} (${list.length})</h3>${list.map(osCard).join('') || '<div class="muted">Sem itens</div>'}</div>`;
}
function initDnD(){
  $$('.card-wo').forEach(c=>c.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain', c.dataset.os);}));
  $$('.col').forEach(col=>{
    col.addEventListener('dragover',e=>e.preventDefault());
    col.addEventListener('drop',e=>{
      e.preventDefault();
      const id=e.dataTransfer.getData('text/plain');
      const o=DB.os.find(x=>x.id===id); if(!o) return;
      o.status=col.dataset.col; save(); render();
    });
  });
  $$('.actions .btn').forEach(b=> b.onclick=onAction);
}
function onAction(e){
  const id=e.target.dataset.id, act=e.target.dataset.act;
  const o=DB.os.find(x=>x.id===id); if(!o) return;
  if(act==='start'){ o.status='EM PROCESSO'; o.history.push({ts:Date.now(),type:'start'}); }
  if(act==='pause'){ o.status='PAUSADO'; o.history.push({ts:Date.now(),type:'pause'}); }
  if(act==='advance'){ const r=rotByAtv(o.atividadeId); if(r){ o.stepIndex=Math.min(o.stepIndex+1,r.steps.length-1);} o.history.push({ts:Date.now(),type:'advance',step:o.stepIndex}); }
  if(act==='finish'){ o.status='FINALIZADO'; o.history.push({ts:Date.now(),type:'finish'}); }
  save(); render();
}

// Atividades (catálogo)
function renderAtividades(m){
  const wrap=document.createElement('div');
  wrap.innerHTML=`
  <div class="grid cols-2">
    <div class="card">
      <h2>Nova Atividade (Demanda)</h2>
      <label>TAG (família)</label><input id="a-tag" placeholder="Ex.: CL09"/>
      <label>Descrição</label><input id="a-desc" placeholder="Ex.: CILINDRO ELEVAÇÃO LÂMINA"/>
      <button class="btn" id="a-save">Salvar</button>
    </div>
    <div class="card">
      <h2>Catálogo de Atividades</h2>
      <table><thead><tr><th>TAG</th><th>Descrição</th></tr></thead><tbody id="a-list"></tbody></table>
    </div>
  </div>`;
  m.appendChild(wrap);
  $('#a-save',wrap).onclick=()=>{
    const tag=$('#a-tag',wrap).value.trim(), desc=$('#a-desc',wrap).value.trim();
    if(!desc) return alert('Informe a descrição'); addAtv(tag,desc); save(); render();
  };
  $('#a-list',wrap).innerHTML=DB.atividades.map(a=>`<tr><td>${a.tagFamilia||''}</td><td>${a.descricao}</td></tr>`).join('');
}

// Frentes/Centros
function renderWC(m){
  const wrap=document.createElement('div');
  wrap.innerHTML=`
  <div class="grid cols-2">
    <div class="card">
      <h2>Nova Frente/Centro</h2>
      <label>Nome</label><input id="wc-name" placeholder="Ex.: FRENTE 1"/>
      <div class="row"><div><label>Capacidade (un/h)</label><input id="wc-cap" type="number" value="30"/></div><div><label>Horas/turno</label><input id="wc-shift" type="number" value="8"/></div></div>
      <button class="btn" id="wc-save">Salvar</button>
    </div>
    <div class="card">
      <h2>Frentes/Centros</h2>
      <table><thead><tr><th>Nome</th><th>Cap (un/h)</th><th>Turno (h)</th></tr></thead><tbody id="wc-list"></tbody></table>
    </div>
  </div>`;
  m.appendChild(wrap);
  $('#wc-save',wrap).onclick=()=>{
    const name=$('#wc-name',wrap).value.trim(); if(!name) return alert('Informe o nome');
    addWC(name,$('#wc-cap',wrap).value,$('#wc-shift',wrap).value); save(); render();
  };
  $('#wc-list',wrap).innerHTML=DB.workCenters.map(w=>`<tr><td>${w.name}</td><td>${w.capUph}</td><td>${w.shiftHours}</td></tr>`).join('');
}

// Roteiros
function renderRoteiros(m){
  const wrap=document.createElement('div');
  wrap.innerHTML=`
  <div class="card">
    <h2>Roteiro por Atividade</h2>
    <div class="row"><div><label>Atividade</label><select id="rt-atv"></select></div><div class="pill">Defina etapas (Frente + min/un)</div></div>
    <div class="row"><div><label>Frente/Centro</label><select id="rt-wc"></select></div><div><label>Min/un</label><input id="rt-min" type="number" step="0.1" value="2"/></div></div>
    <button class="btn" id="rt-add">Adicionar etapa</button>
    <div class="card" style="margin-top:10px"><h2>Etapas</h2><table><thead><tr><th>#</th><th>Frente/Centro</th><th>Min/un</th></tr></thead><tbody id="rt-list"></tbody></table></div>
  </div>`;
  m.appendChild(wrap);
  const selP=$('#rt-atv',wrap); selP.innerHTML=DB.atividades.map(p=>`<option value="${p.id}">${p.descricao}</option>`).join('');
  const selW=$('#rt-wc',wrap); selW.innerHTML=DB.workCenters.map(w=>`<option value="${w.id}">${w.name}</option>`).join('');
  function refresh(){ const r=rotByAtv(selP.value); $('#rt-list',wrap).innerHTML=(r?.steps||[]).map((s,i)=>`<tr><td>${i+1}</td><td>${wcById(s.wcId)?.name||''}</td><td>${s.minPerUnit}</td></tr>`).join(''); }
  selP.onchange=refresh; refresh();
  $('#rt-add',wrap).onclick=()=>{
    const pid=selP.value, wcId=selW.value, min=Number($('#rt-min',wrap).value);
    let r=rotByAtv(pid); if(!r){ r=addRoteiro(pid,[]); }
    r.steps.push({id:uid('st_'), wcId, minPerUnit:min, seq:(r.steps.length+1)}); save(); refresh();
  };
}

// Agenda
function renderSchedule(m){
  const plan=planSchedule();
  const wrap=document.createElement('div'); wrap.className='card gantt';
  wrap.innerHTML='<h2>Agenda de Produção (estimada)</h2><div id="gantt"></div>';
  m.appendChild(wrap); drawGantt($('#gantt',wrap),plan);
}
function planSchedule(){
  const today=new Date(); today.setHours(8,0,0,0);
  const wcClock=new Map(DB.workCenters.map(w=>[w.id,new Date(today)]));
  const result=[];
  const pend=DB.os.filter(o=>o.status!=='FINALIZADO').sort((a,b)=> new Date(a.due)-new Date(b.due));
  for(const o of pend){
    const r=rotByAtv(o.atividadeId); if(!r) continue;
    for(const s of r.steps){
      const wc=wcClock.get(s.wcId);
      const dur=o.qty*s.minPerUnit;
      const start=new Date(wc); const end=new Date(start.getTime()+dur*60000);
      const segs=splitShifts(start,end);
      for(const sg of segs){ result.push({wcId:s.wcId, osId:o.id, label:atvById(o.atividadeId)?.descricao||'OS', start:sg.s, end:sg.e}); }
      wcClock.set(s.wcId, new Date(segs.at(-1).e));
    }
  }
  return result;
}
function splitShifts(start,end){
  const out=[]; let s=new Date(start);
  while(s<end){
    const dayStart=new Date(s); dayStart.setHours(8,0,0,0);
    const dayEnd=new Date(s); dayEnd.setHours(16,0,0,0);
    let e=new Date(Math.min(dayEnd.getTime(), end.getTime()));
    if(s<dayStart) s=dayStart;
    if(s>=dayEnd){ s=new Date(dayStart.getTime()+24*3600*1000); continue; }
    out.push({s:new Date(s), e:new Date(e)});
    s=new Date(e);
    if(s>=dayEnd){ s=new Date(dayStart.getTime()+24*3600*1000); }
  }
  return out;
}
function drawGantt(container,tasks){
  const wcs=DB.workCenters; if(!tasks.length){ container.innerHTML='<div class="muted">Sem tarefas planejadas.</div>'; return; }
  const wcIndex=new Map(wcs.map((w,i)=>[w.id,i]));
  const minStart=new Date(Math.min(...tasks.map(t=>t.start.getTime())));
  const maxEnd=new Date(Math.max(...tasks.map(t=>t.end.getTime())));
  const days=Math.ceil((maxEnd-minStart)/864e5)+1;
  const width=Math.max(700, days*140);
  const rowH=36, headerH=40, h=headerH + wcs.length*rowH + 20;
  const svg=[`<svg height="${h}" width="${width}" xmlns="http://www.w3.org/2000/svg">`];
  for(let d=0; d<days; d++){
    const x=100 + d*(width-120)/days;
    svg.push(`<rect x="${x}" y="0" width="${(width-120)/days}" height="${h}" fill="${d%2? '#0f1524':'#0b1220'}"/>`);
    const day=new Date(minStart); day.setDate(day.getDate()+d);
    svg.push(`<text x="${x+8}" y="20" font-size="12" fill="#9ca3af">${day.toLocaleDateString()}</text>`);
  }
  wcs.forEach((w,i)=>{
    const y=headerH+i*rowH+rowH/2;
    svg.push(`<text x="10" y="${y}" font-size="12" fill="#e5e7eb">${w.name}</text>`);
    svg.push(`<line x1="100" y1="${y}" x2="${width-10}" y2="${y}" stroke="#1f2937"/>`);
  });
  for(const t of tasks){
    const i=wcIndex.get(t.wcId);
    const y=headerH+i*rowH+6;
    const x1=toX(t.start,minStart,width,days);
    const x2=toX(t.end,minStart,width,days);
    const w=Math.max(6,x2-x1-8);
    svg.push(`<rect rx="6" ry="6" x="${x1}" y="${y}" width="${w}" height="${rowH-12}" fill="#0ea5e9"/>`);
    svg.push(`<text x="${x1+8}" y="${y+18}" font-size="12" fill="#00111a">${t.label} • ${t.osId.slice(-4).toUpperCase()}</text>`);
  }
  svg.push(`</svg>`);
  container.innerHTML=svg.join('');
}
function toX(time,minStart,width,days){ const diff=((new Date(time))-minStart)/864e5; return 100 + diff*(width-120)/days; }

// boot
render();
