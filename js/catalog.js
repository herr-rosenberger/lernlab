// Lädt data/apps.json und baut die filterbare Übersicht.
const state={q:'',typ:'alle',klasse:'',fach:''};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let apps=[];
function render(){
  const q=state.q.toLowerCase();
  const list=apps.filter(a=>(state.typ==='alle'||a.typ===state.typ)&&(!state.klasse||a.klasse==state.klasse)&&(!state.fach||a.fach===state.fach)
    &&(!q||[a.titel,a.fach,a.kurzbeschreibung,a.lehrplanBezug,...(a.tags||[])].join(' ').toLowerCase().includes(q)));
  $('#count').textContent=list.length===1?'1 Treffer':list.length+' Treffer';
  $('#grid').innerHTML=list.length?list.map(a=>`<li><a class="card" data-fach="${esc(a.fach.toLowerCase())}" href="${esc(a.pfad)}">
    <h3>${esc(a.titel)}</h3><p>${esc(a.kurzbeschreibung||'')}</p>
    <div class="meta"><span class="chip fach">${esc(a.fach)}</span><span class="chip">Klasse ${a.klasse}</span>
    <span class="chip">${a.typ==='simulationen'?'Simulation':'Lern-App'}</span>${a.dauerMin?`<span class="chip">${a.dauerMin} min</span>`:''}</div></a></li>`).join('')
    :'<li class="empty">Keine Treffer. Setze einen Filter zurück oder suche nach einem anderen Begriff.</li>';
}
fetch('data/apps.json').then(r=>r.json()).then(d=>{
  apps=d;
  for(const f of [...new Set(apps.map(a=>a.fach))].sort())$('#fach').add(new Option(f,f));
  for(const k of [...new Set(apps.map(a=>a.klasse))].sort((a,b)=>a-b))$('#klasse').add(new Option('Klasse '+k,k));
  render();
}).catch(()=>{$('#grid').innerHTML='<li class="empty">Die Übersicht konnte nicht geladen werden. Lade die Seite neu.</li>'});
$('#q').addEventListener('input',e=>{state.q=e.target.value;render()});
$('#klasse').addEventListener('change',e=>{state.klasse=e.target.value;render()});
$('#fach').addEventListener('change',e=>{state.fach=e.target.value;render()});
document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{
  state.typ=b.dataset.typ;document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));render();
}));
