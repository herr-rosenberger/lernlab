// LernLab Mini-Framework für Lern-Apps. Aufgaben stehen in aufgaben.json neben der index.html.
// Typen: "auswahl" {optionen[], richtig:Index} · "zahl" {richtig:Zahl, toleranz?, einheit?} · "text" {richtig:[Strings]}
// Optional je Aufgabe: hinweis, erklaerung, bild + bildAlt (Alternativtext Pflicht). Formeln: $…$ (KaTeX). Arbeitsblatt: ?arbeitsblatt bzw. ?arbeitsblatt&loesung.
// Lernstand: Leitner-Boxen (0–3), nur lokal im Browser.
(() => {
  const root = document.getElementById('quiz'), side = document.getElementById('side');
  const KEY = 'lernapp:' + location.pathname, RUNDE = 10, GEMEISTERT = 3, mem = {};
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return mem.d || {}; } },
    set(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { mem.d = d; } }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
  const num = s => parseFloat(String(s).replace(/\s/g, '').replace(',', '.'));
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mathe = el => (window.LernLab && LernLab.mathe) ? LernLab.mathe(el) : null;
  const bild = t => t.bild ? `<figure class="fig"><img src="${esc(t.bild)}" alt="${esc(t.bildAlt || '')}"></figure>` : '';
  const q = new URLSearchParams(location.search);
  let tasks = [], prog = { box: {} }, run = null;
  prog = Object.assign(prog, store.get());

  const korrekt = (t, v) => t.typ === 'auswahl' ? +v === t.richtig
    : t.typ === 'zahl' ? Math.abs(num(v) - t.richtig) <= (t.toleranz || 0) + 1e-9
    : t.richtig.map(norm).includes(norm(v));
  const loesung = t => t.typ === 'auswahl' ? t.optionen[t.richtig]
    : t.typ === 'zahl' ? String(t.richtig).replace('.', ',') + (t.einheit ? ' ' + t.einheit : '') : t.richtig[0];

  function neueRunde() {
    const sortiert = shuffle(tasks).sort((a, b) => (prog.box[a.id] || 0) - (prog.box[b.id] || 0));
    run = { liste: shuffle(sortiert.slice(0, RUNDE)), i: 0, punkte: 0, falsch: [], beantwortet: false };
    frage();
  }

  function frage() {
    const t = run.liste[run.i], n = run.liste.length; run.beantwortet = false;
    let eingabe;
    if (t.typ === 'auswahl') {
      eingabe = '<fieldset class="opts"><legend class="visually-hidden">Antworten</legend>' +
        shuffle(t.optionen.map((o, k) => [o, k])).map(([o, k]) =>
          `<label class="opt"><input type="radio" name="a" value="${k}"><span>${esc(o)}</span></label>`).join('') + '</fieldset>';
    } else {
      eingabe = `<label class="visually-hidden" for="a">Deine Antwort</label><div class="row"><input id="a" name="a" type="text" ${t.typ === 'zahl' ? 'inputmode="decimal"' : ''} autocomplete="off">${t.einheit ? `<span>${esc(t.einheit)}</span>` : ''}</div>`;
    }
    root.innerHTML = `<p class="muted">Aufgabe ${run.i + 1} von ${n}</p><h2 id="f-titel" tabindex="-1">${esc(t.frage)}</h2>${bild(t)}
      <form id="f" novalidate>${eingabe}<div class="row"><button class="btn" id="ok" type="submit">Prüfen</button>
      ${t.hinweis ? '<button class="btn ghost" id="hint" type="button">Hinweis</button>' : ''}</div></form>
      <p class="hint" id="hinweis" hidden>${esc(t.hinweis || '')}</p><div id="fb" aria-live="polite"></div>`;
    document.getElementById('f-titel').focus(); mathe(root);
    if (t.hinweis) document.getElementById('hint').onclick = () => document.getElementById('hinweis').hidden = false;
    document.getElementById('f').onsubmit = e => { e.preventDefault(); run.beantwortet ? weiter() : pruefen(t); };
  }

  function pruefen(t) {
    const f = document.getElementById('f'), el = f.elements.a;
    const v = t.typ === 'auswahl' ? (f.querySelector('input:checked') || {}).value : el.value;
    const fb = document.getElementById('fb');
    if (v === undefined || String(v).trim() === '') { fb.innerHTML = '<p class="feedback nok">Gib zuerst eine Antwort ein.</p>'; return; }
    if (t.typ === 'zahl' && isNaN(num(v))) { fb.innerHTML = '<p class="feedback nok">Das ist keine Zahl. Schreibe zum Beispiel 3,5.</p>'; return; }
    const ok = korrekt(t, t.typ === 'auswahl' ? v : v);
    prog.box[t.id] = ok ? Math.min((prog.box[t.id] || 0) + 1, GEMEISTERT) : 0; store.set(prog);
    if (ok) run.punkte++; else run.falsch.push(t);
    f.querySelectorAll('input').forEach(i => i.disabled = true);
    fb.innerHTML = `<p class="feedback ${ok ? 'ok' : 'nok'}"><strong>${ok ? 'Richtig.' : 'Nicht ganz.'}</strong>${ok ? '' : ' Richtig ist: ' + esc(loesung(t)) + '.'}</p>${t.erklaerung ? `<p class="muted">${esc(t.erklaerung)}</p>` : ''}`;
    const b = document.getElementById('ok'); b.textContent = run.i + 1 < run.liste.length ? 'Weiter' : 'Ergebnis'; b.focus();
    run.beantwortet = true; seite(); mathe(fb);
  }

  function weiter() { run.i++; run.i < run.liste.length ? frage() : ergebnis(); }

  function ergebnis() {
    const n = run.liste.length;
    root.innerHTML = `<h2 id="f-titel" tabindex="-1">Runde geschafft</h2><p class="readout">${run.punkte} von ${n} richtig</p>
      ${run.falsch.length ? '<h3>Das üben wir weiter</h3><ul>' + run.falsch.map(t => `<li>${esc(t.frage)} <span class="muted">Lösung: ${esc(loesung(t))}</span></li>`).join('') + '</ul>' : '<p>Alles richtig. Stark!</p>'}
      <button class="btn" id="neu" type="button">Neue Runde</button>`;
    document.getElementById('f-titel').focus(); document.getElementById('neu').onclick = neueRunde; seite(); mathe(root);
  }

  function arbeitsblatt(mitLoesung) {
    document.querySelector('.app-layout').classList.add('einspaltig'); side.parentElement.hidden = true;
    root.innerHTML = `<div class="row noprint"><button class="btn" type="button" onclick="print()">Drucken</button></div>
      <h2>${mitLoesung ? 'Lösungen' : 'Arbeitsblatt'}</h2><p>Name: ______________________ Datum: ____________</p>
      <ol class="ab">${tasks.map(t => `<li>${esc(t.frage)}${bild(t)}${t.typ === 'auswahl' ? '<ul class="ab-opt">' + t.optionen.map(o => `<li>${esc(o)}</li>`).join('') + '</ul>' : '<br><span class="ab-line"></span> ' + esc(t.einheit || '')}${mitLoesung ? `<div class="ab-lsg">Lösung: ${esc(loesung(t))}</div>` : ''}</li>`).join('')}</ol>`;
    mathe(root);
  }

  function seite() {
    if (!side) return;
    const g = tasks.filter(t => (prog.box[t.id] || 0) >= GEMEISTERT).length, p = Math.round(100 * g / tasks.length);
    side.innerHTML = `<div class="readout">${g} / ${tasks.length}</div><p class="muted">Aufgaben sicher gelernt</p>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><span style="width:${p}%"></span></div>
      <p class="muted">Falsche Aufgaben kommen früher wieder. Dein Lernstand bleibt nur in diesem Browser.</p>
      <p class="muted">Für den Unterricht:<br><a href="?arbeitsblatt">Arbeitsblatt drucken</a><br><a href="?arbeitsblatt&loesung">Arbeitsblatt mit Lösungen</a></p>
      <div class="row"><button class="btn ghost" id="exp" type="button">Lernstand speichern</button><button class="btn ghost" id="rst" type="button">Zurücksetzen</button></div>`;
    document.getElementById('exp').onclick = () => {
      const a = document.createElement('a'); a.download = 'lernstand.json';
      a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: location.pathname, datum: new Date().toISOString(), boxen: prog.box }, null, 2)], { type: 'application/json' })); a.click();
    };
    document.getElementById('rst').onclick = () => { if (confirm('Lernstand wirklich löschen?')) { prog = { box: {} }; store.set(prog); neueRunde(); } };
  }

  fetch('aufgaben.json').then(r => r.json()).then(d => { tasks = d.aufgaben; if (q.has('arbeitsblatt')) return arbeitsblatt(q.has('loesung')); seite(); neueRunde(); })
    .catch(() => { root.innerHTML = '<p class="feedback nok">Die Aufgaben konnten nicht geladen werden. Lade die Seite neu.</p>'; });
})();
