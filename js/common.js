// Gemeinsame Funktionen: Theme-Umschalter, großer Link für den Beamer, Service Worker.
(function(){
  const SRC=document.currentScript&&document.currentScript.src;
  const root=document.documentElement;
  try{const t=localStorage.getItem('theme');if(t)root.dataset.theme=t}catch(e){}
  const seitenLink=()=>location.href.split(/[?#]/)[0].replace(/index\.html$/,'');
  const laden=(datei,schonDa)=>new Promise((ok,fehler)=>{if(schonDa())return ok();const s=document.createElement('script');s.src=new URL(datei,SRC);s.onload=ok;s.onerror=fehler;document.head.append(s)});

  // Großer Link mit QR-Code, z. B. zum Zeigen per Beamer
  function zeigeLink(){
    let d=document.getElementById('link-dialog');
    if(!d){
      d=document.createElement('dialog');d.id='link-dialog';d.className='link-dialog';d.setAttribute('aria-labelledby','ld-titel');
      d.innerHTML='<h2 id="ld-titel">Link zu dieser Seite</h2><p class="ld-url" id="ld-url"></p><button type="button" class="ld-qr" id="ld-qr" aria-label="QR-Code im Vollbild anzeigen"><span id="ld-qrbild"></span></button><p class="muted">Zum Vergrößern auf den QR-Code klicken.</p><div class="row"><button class="btn" type="button" id="ld-kopie">Link kopieren</button><button class="btn ghost" type="button" id="ld-zu">Schließen</button></div><p class="muted" id="ld-info" aria-live="polite"></p>';
      document.body.append(d);
      d.querySelector('#ld-zu').onclick=()=>d.close();
      d.querySelector('#ld-qr').onclick=()=>zeigeQrVoll(seitenLink());
      d.addEventListener('click',e=>{if(e.target===d)d.close()});
      d.querySelector('#ld-kopie').onclick=async()=>{const i=d.querySelector('#ld-info');try{await navigator.clipboard.writeText(seitenLink());i.textContent='Link kopiert.'}catch(e){i.textContent='Kopieren nicht möglich. Markiere den Link und kopiere ihn von Hand.'}};
    }
    const url=seitenLink();d.querySelector('#ld-url').textContent=url;d.querySelector('#ld-info').textContent='';
    d.showModal();
    laden('qr.js',()=>window.LernLab&&LernLab.qr).then(()=>LernLab.qr(d.querySelector('#ld-qrbild'),url)).catch(()=>{});
  }

  // QR-Code über den ganzen Bildschirm (Klick oder Esc schließt). Wenn der Browser es erlaubt, auch im echten Vollbild.
  function zeigeQrVoll(url){
    let v=document.getElementById('qr-voll');
    if(!v){
      v=document.createElement('dialog');v.id='qr-voll';v.className='qr-voll';v.setAttribute('aria-label','QR-Code im Vollbild');
      v.innerHTML='<button type="button" class="qv-btn" aria-label="Vollbild schließen"><span class="qv-bild"></span></button><p class="qv-url"></p><p class="qv-hinweis">Zum Schließen klicken oder Esc drücken</p>';
      document.body.append(v);
      v.querySelector('.qv-btn').onclick=()=>v.close();
      v.addEventListener('close',()=>{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{})});
      document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&v.open)v.close()});
    }
    v.querySelector('.qv-url').textContent=url;
    v.showModal();
    try{if(v.requestFullscreen)v.requestFullscreen().catch(()=>{})}catch(e){}
    laden('qr.js',()=>window.LernLab&&LernLab.qr).then(()=>LernLab.qr(v.querySelector('.qv-bild'),url)).catch(()=>{});
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.app-head').forEach(e=>e.dataset.url=seitenLink()); // für den Ausdruck
    const btn=document.getElementById('theme-toggle');if(!btn)return;
    const lb=document.createElement('button');lb.type='button';lb.className='link-btn';lb.id='link-btn';lb.setAttribute('aria-haspopup','dialog');lb.setAttribute('aria-label','Link groß anzeigen (z. B. für den Beamer)');
    lb.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/></svg><span>Link zeigen</span>';
    btn.before(lb);lb.addEventListener('click',zeigeLink);
    btn.addEventListener('click',()=>{
      const dark=getComputedStyle(root).colorScheme.trim()==='dark'||matchMedia('(prefers-color-scheme: dark)').matches&&!root.dataset.theme;
      const next=dark?'light':'dark';root.dataset.theme=next;
      try{localStorage.setItem('theme',next)}catch(e){}
    });
  });
  if('serviceWorker' in navigator&&SRC)addEventListener('load',()=>navigator.serviceWorker.register(new URL('../sw.js',SRC)).catch(()=>{}));
})();
