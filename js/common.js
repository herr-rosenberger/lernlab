// Theme-Umschalter: Systemeinstellung als Standard, manuelle Wahl wird lokal gemerkt.
(function(){
  const root=document.documentElement;
  try{const t=localStorage.getItem('theme');if(t)root.dataset.theme=t}catch(e){}
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.app-head').forEach(e=>e.dataset.url=location.href.split('#')[0]); // für den Ausdruck
    const btn=document.getElementById('theme-toggle');if(!btn)return;
    btn.addEventListener('click',()=>{
      const dark=getComputedStyle(root).colorScheme.trim()==='dark'||matchMedia('(prefers-color-scheme: dark)').matches&&!root.dataset.theme;
      const next=dark?'light':'dark';root.dataset.theme=next;
      try{localStorage.setItem('theme',next)}catch(e){}
    });
  });
})();
