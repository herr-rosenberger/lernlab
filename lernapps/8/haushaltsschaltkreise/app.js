(async () => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mount = $('#app');
  let D; try { D = await (await fetch('daten.json')).json(); } catch (e) { mount.textContent = 'Die Inhalte konnten nicht geladen werden. Lade die Seite neu.'; return; }
  const KEY = 'haushalt:' + location.pathname; let st = {};
  try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  st.n = st.n || {}; st.g = st.g || {}; st.c = st.c || { c1: {}, c2: {} }; st.text = st.text || ''; st.bild = st.bild || ''; st.name = st.name || '';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  // ---------- Schaltbilder ----------
  const WC = { L: 'var(--f-mathematik)', N: 'var(--f-physik)', PE: 'var(--f-chemie)' };
  const TXT = 'fill="var(--text)" font-size="14" font-family="inherit"';
  const OPT = { leitung: 'Leitung (durchgehend)', sicherung: 'Sicherung', schalter: 'Schalter', fi: 'FI-Schutzschalter' };
  const wire = (x1, y1, x2, y2, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${WC[w]}" stroke-width="3" stroke-linecap="round"${w === 'PE' ? ' stroke-dasharray="10 5"' : ''}/>`;
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="var(--text)"/>`;
  const comp = (t, c) => ({
    leitung: `<line x1="-37" x2="37" stroke="${c}" stroke-width="3"/>`,
    sicherung: `<line x1="-37" x2="-22" stroke="${c}" stroke-width="3"/><line x1="22" x2="37" stroke="${c}" stroke-width="3"/><rect x="-22" y="-9" width="44" height="18" fill="none" stroke="var(--text)" stroke-width="2.5"/><line x1="-22" x2="22" stroke="var(--text)" stroke-width="2"/>`,
    schalter: `<line x1="-37" x2="-20" stroke="${c}" stroke-width="3"/><line x1="22" x2="37" stroke="${c}" stroke-width="3"/><line x1="-20" y1="0" x2="16" y2="-17" stroke="var(--text)" stroke-width="2.5" stroke-linecap="round"/><circle cx="-20" r="3.5" fill="var(--text)"/><circle cx="22" r="3.5" fill="var(--text)"/>`
  }[t] || '');
  const slot = (s, val) => {
    const hit = `<rect x="${s.x - (s.v ? 22 : 40)}" y="${s.y - (s.v ? 40 : 22)}" width="${s.v ? 44 : 80}" height="${s.v ? 80 : 44}" fill="transparent"/>`;
    const lab = `<text x="${s.v ? s.x - 50 : s.x}" y="${s.v ? s.y + 5 : s.y - 28}" text-anchor="middle" ${TXT} font-weight="700">${s.id}</text>`;
    if (s.fi) { // Kasten über beide Leiter
      const box = `<rect x="${s.x - 32}" y="36" width="64" height="128" rx="6" fill="${val ? 'var(--surface)' : 'none'}" stroke="${val ? 'var(--text)' : 'var(--accent)'}" stroke-width="2.5"${val ? '' : ' stroke-dasharray="5 4"'}/>`;
      const t = val === 'fi' ? 'FI' : val === 'sicherung' ? 'Sicherung' : '';
      return `<g class="sl" data-slot="${s.id}">${val === 'leitung' ? '' : box}<text x="${s.x}" y="106" text-anchor="middle" ${TXT} font-size="${val === 'fi' ? 22 : 11}" font-weight="700">${t}</text>${hit.replace(/y="[^"]*" width="[^"]*" height="[^"]*"/, `y="36" width="80" height="128"`)}${lab.replace(/y="[^"]*"/, 'y="26"')}</g>`;
    }
    const base = `<rect x="-37" y="-18" width="74" height="36" rx="6" fill="var(--surface)" ${val ? 'stroke="none"' : 'stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"'}/>`;
    return `<g class="sl" data-slot="${s.id}"><g transform="translate(${s.x} ${s.y}) rotate(${s.v ? 90 : 0})">${base}${comp(val, WC[s.w])}</g>${hit}${lab}</g>`;
  };
  const lamp = (x, y, n) => `<circle cx="${x}" cy="${y}" r="20" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/><path d="M${x - 14} ${y - 14}L${x + 14} ${y + 14}M${x + 14} ${y - 14}L${x - 14} ${y + 14}" stroke="var(--text)" stroke-width="2.5"/><text x="${x + 30}" y="${y + 5}" ${TXT}>${n}</text>`;
  const sourceCircle = (x, y) => `<circle cx="${x}" cy="${y}" r="24" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/><text x="${x}" y="${y + 8}" text-anchor="middle" font-size="24" ${TXT}>~</text>`;
  const svg = (vb, inner) => `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;

  const m1 = (a, b) => ({ ok: a, ...b });
  const OKC = 'Der Schalter im Außenleiter macht die Lampe spannungsfrei, wenn er geöffnet ist.', OKD = 'Im Neutralleiter ist eine durchgehende Leitung richtig.';
  const MC = { leitung: 'Ohne Schalter lässt sich die Lampe nicht ausschalten.', sicherung: 'Eine Sicherung ist kein Ausschalter. Sie löst nur bei zu großer Stromstärke aus.' };
  const MD = { schalter: 'Der Schalter sitzt im Neutralleiter. Die Lampe ist dann zwar aus, aber an der Fassung liegt weiter der Außenleiter mit 230 V. Beim Lampenwechsel droht ein Stromschlag. Der Schalter gehört in den Außenleiter.', sicherung: 'Die Sicherung gehört in den Außenleiter der Zuleitung. Hier genügt eine durchgehende Leitung.' };
  const OPT3 = ['leitung', 'sicherung', 'schalter'];
  const CIRC = [{
    id: 'c1', titel: 'Aufgabe A: Zwei Lampen im Haushaltsstromkreis',
    aufgabe: 'Setze in die Lücken A bis F ein Bauteil ein. Die Lampen sollen einzeln schaltbar sein, und der Stromkreis soll gegen zu große Stromstärken gesichert sein. Achte auf die Sicherheit beim Lampenwechsel.',
    slots: [
      { id: 'A', x: 170, y: 60, w: 'L', name: 'Hauptleitung, Außenleiter', opt: OPT3, richtig: ['sicherung'], msg: m1('Die Sicherung im Außenleiter trennt bei Überlastung oder Kurzschluss den Stromkreis.', { leitung: 'Ohne Sicherung kann bei Überlastung oder Kurzschluss eine sehr große Stromstärke fließen. Die Leitung erwärmt sich stark, es droht ein Kabelbrand.', schalter: 'Ein Schalter öffnet nur, wenn ihn jemand betätigt. Bei einem Kurzschluss muss der Stromkreis automatisch getrennt werden. Dafür braucht man eine Sicherung.' }) },
      { id: 'B', x: 170, y: 300, w: 'N', name: 'Hauptleitung, Neutralleiter', opt: OPT3, richtig: ['leitung', 'sicherung'], msg: m1('Im Neutralleiter genügt hier eine durchgehende Leitung (oder eine Sicherung, die beide Leiter trennt).', { schalter: 'Ein Schalter im Neutralleiter allein macht die Anlage nicht spannungsfrei, denn der Außenleiter bleibt unter Spannung.' }) },
      { id: 'C', x: 330, y: 115, v: 1, w: 'L', name: 'Lampe 1, Außenleiter-Seite', opt: OPT3, richtig: ['schalter'], msg: m1(OKC, MC) },
      { id: 'D', x: 330, y: 245, v: 1, w: 'N', name: 'Lampe 1, Neutralleiter-Seite', opt: OPT3, richtig: ['leitung'], msg: m1(OKD, MD) },
      { id: 'E', x: 520, y: 115, v: 1, w: 'L', name: 'Lampe 2, Außenleiter-Seite', opt: OPT3, richtig: ['schalter'], msg: m1(OKC, MC) },
      { id: 'F', x: 520, y: 245, v: 1, w: 'N', name: 'Lampe 2, Neutralleiter-Seite', opt: OPT3, richtig: ['leitung'], msg: m1(OKD, MD) }
    ],
    draw(v) {
      const S = this.slots, L = 60, N = 300;
      return svg('0 0 740 340', wire(60, L, 690, L, 'L') + wire(60, N, 690, N, 'N') + wire(60, L, 60, 156, 'L') + wire(60, 204, 60, N, 'N') + sourceCircle(60, 180) +
        [330, 520].map((x, i) => wire(x, L, x, 180, 'L') + wire(x, 180, x, N, 'N') + dot(x, L) + dot(x, N) + lamp(x, 180, 'Lampe ' + (i + 1))).join('') +
        `<text x="76" y="44" ${TXT}>L (Außenleiter)</text><text x="76" y="326" ${TXT}>N (Neutralleiter)</text><text x="92" y="186" ${TXT}>230 V</text>` +
        S.map(s => slot(s, v[s.id])).join(''));
    }
  }, {
    id: 'c2', titel: 'Aufgabe B: Steckdose, Schutzleiter und FI-Schutzschalter',
    aufgabe: 'Ein Gerät mit Metallgehäuse hängt an einer Steckdose. Setze die Schutzeinrichtungen A bis C ein. Lässt du eine Lücke offen, fehlt die Einrichtung. Teste danach mit dem Gehäuseschluss, was passiert.',
    slots: [
      { id: 'A', x: 130, y: 60, w: 'L', name: 'Außenleiter, nahe am Netz', opt: OPT3, richtig: ['sicherung'], msg: { ok: 'Der Leitungsschutzschalter im Außenleiter schützt die Leitung vor Überlastung und Kurzschluss.', leitung: 'Ohne Leitungsschutzschalter wird der Stromkreis bei Überlastung oder Kurzschluss nicht getrennt. Es droht ein Kabelbrand.', schalter: 'Ein Schalter trennt nicht automatisch. Bei zu großer Stromstärke muss eine Sicherung auslösen.' } },
      { id: 'B', x: 270, y: 100, fi: 1, name: 'Außen- und Neutralleiter gemeinsam', opt: ['leitung', 'fi', 'sicherung'], richtig: ['fi'], msg: { ok: 'Der FI-Schutzschalter vergleicht die Stromstärke im Außen- und im Neutralleiter und trennt bei einer Differenz von etwa 30 mA.', leitung: 'Ohne FI-Schutzschalter bleibt ein Fehlerstrom durch den Körper unbemerkt, solange er unter dem Nennstrom der Sicherung liegt.', sicherung: 'Eine Sicherung erkennt keinen kleinen Fehlerstrom von 30 mA. Dafür ist der FI-Schutzschalter da.' } },
      { id: 'C', x: 440, y: 220, w: 'PE', name: 'Schutzleiter zum Gehäuse', opt: OPT3, richtig: ['leitung'], msg: { ok: 'Der Schutzleiter verbindet das Metallgehäuse dauerhaft mit der Erde.', sicherung: 'Im Schutzleiter darf nie eine Sicherung oder ein Schalter sitzen. Er muss immer durchgehend verbunden sein.', schalter: 'Im Schutzleiter darf nie eine Sicherung oder ein Schalter sitzen. Er muss immer durchgehend verbunden sein.' } }
    ],
    draw(v, fehler) {
      const S = this.slots, red = '#e11d48';
      return svg('0 0 780 300', wire(50, 60, 650, 60, 'L') + wire(50, 140, 650, 140, 'N') + wire(50, 220, 560, 220, 'PE') + wire(50, 60, 50, 76, 'L') + wire(50, 124, 50, 140, 'N') + sourceCircle(50, 100) +
        `<g stroke="var(--text)" stroke-width="2.5"><line x1="50" y1="220" x2="50" y2="236"/><line x1="38" y1="236" x2="62" y2="236"/><line x1="42" y1="243" x2="58" y2="243"/><line x1="46" y1="250" x2="54" y2="250"/></g>` +
        `<line x1="520" y1="30" x2="520" y2="250" stroke="var(--muted)" stroke-width="2" stroke-dasharray="3 5"/><text x="520" y="272" text-anchor="middle" ${TXT}>Steckdose</text>` +
        `<rect x="560" y="30" width="190" height="220" rx="10" fill="none" stroke="var(--text)" stroke-width="2.5" stroke-dasharray="8 5"/><text x="655" y="22" text-anchor="middle" ${TXT}>Metallgehäuse</text>` +
        wire(650, 60, 650, 78, 'L') + wire(650, 122, 650, 140, 'N') + `<rect x="638" y="78" width="24" height="44" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/><text x="672" y="104" ${TXT}>Heizdraht</text>` +
        dot(560, 220) + dot(650, 60) + dot(650, 140) +
        `<text x="400" y="48" ${TXT}>L (Außenleiter)</text><text x="400" y="128" ${TXT}>N (Neutralleiter)</text><text x="300" y="208" ${TXT}>PE (Schutzleiter)</text>` +
        S.map(s => slot(s, v[s.id])).join('') +
        (fehler ? `<path d="M650 100 L690 84 L700 100 L748 72" fill="none" stroke="${red}" stroke-width="3.5" stroke-linejoin="round"/><text x="655" y="240" text-anchor="middle" font-size="13" font-weight="700" fill="${red}" font-family="inherit">Gehäuseschluss</text>` : ''));
    }
  }];
  const ausgang = v => {
    const ls = v.A === 'sicherung', fi = v.B === 'fi', pe = v.C === 'leitung', t = [];
    if (pe) {
      t.push('Das Gehäuse ist über den Schutzleiter mit der Erde verbunden. Der Fehlerstrom fließt über den Schutzleiter. Sein Widerstand ist sehr klein, die Stromstärke wird groß.');
      t.push(ls ? 'Die Stromstärke übersteigt den Nennstrom, der Leitungsschutzschalter löst aus und trennt den Stromkreis.' : 'Ohne Leitungsschutzschalter fließt der große Strom weiter. Die Leitung wird heiß, es droht ein Brand.');
      if (fi) t.push('Zusätzlich bemerkt der FI-Schutzschalter den Unterschied zwischen Hin- und Rückstrom und löst ebenfalls aus.');
    } else {
      t.push('Das Gehäuse steht unter Spannung (230 V gegen Erde). Wer es berührt und auf leitfähigem Boden steht, wird vom Strom durchflossen. Diese Stromstärke ist zu klein für den Leitungsschutzschalter, er löst nicht aus.');
      t.push(fi ? 'Der FI-Schutzschalter bemerkt, dass im Außenleiter mehr Strom fließt als im Neutralleiter, und schaltet bei etwa 30 mA nach wenigen Hundertstelsekunden ab.' : 'Ohne Schutzleiter und ohne FI-Schutzschalter bleibt der Stromschlag lebensgefährlich.');
    }
    return { sicher: (pe && ls) || fi, text: t, optimal: pe && ls && fi };
  };

  // ---------- Schritte ----------
  let schritt = 1, fehlerAn = false;
  const ta = (id, label, rows, hint) => `<div class="field"><label for="${id}">${label}</label><textarea id="${id}" rows="${rows}"></textarea>${hint ? `<p class="muted">${hint}</p>` : ''}</div>`;
  const wortzahl = t => t.trim().split(/\s+/).filter(Boolean).length;
  const begriffe = t => D.begriffe.map(b => ({ name: b.name, da: new RegExp(b.muster, 'i').test(t) }));
  const begriffeHtml = t => { const b = begriffe(t), n = b.filter(x => x.da).length; return `<p><strong>${n} von ${b.length}</strong> Fachbegriffen verwendet (Ziel: mindestens ${D.ziel}).</p><ul class="begriffe">${b.map(x => `<li class="${x.da ? 'da' : ''}">${x.da ? '✓' : '○'} ${esc(x.name)}</li>`).join('')}</ul>`; };
  const hinweiseHtml = t => D.hinweise.filter(h => new RegExp(h.muster, 'i').test(t)).map(h => `<p class="hint">${esc(h.text)}</p>`).join('');
  const offen = () => {
    const o = [], gel = D.quellen.filter((_, i) => st.g[i]).length;
    if (gel < D.quellen.length) o.push(`${D.quellen.length - gel} Quelle(n) noch nicht als gelesen markiert`);
    const nn = D.fragen.filter((_, i) => (st.n[i] || '').trim()).length; if (nn < D.fragen.length) o.push(`${D.fragen.length - nn} Leitfrage(n) ohne Notizen`);
    CIRC.forEach((c, i) => { if (c.slots.some(s => !st.c[c.id][s.id])) o.push(`Schaltbild ${'AB'[i]} hat noch leere Lücken`); });
    if (wortzahl(st.text) < 30) o.push('Der Erklärtext ist noch sehr kurz'); if (!st.bild.trim()) o.push('Die Bildunterschrift fehlt');
    return o;
  };

  const steps = [{
    name: 'Recherchieren',
    html: () => `<h2>1 Recherchieren</h2><p>${esc(D.auftrag)}</p><h3>Quellen</h3>
      <ul class="quellen">${D.quellen.map((q, i) => `<li><label><input type="checkbox" data-g="${i}"> gelesen</label> <a href="${esc(q.url)}" target="_blank" rel="noopener noreferrer">${esc(q.titel)}</a><span class="muted">${esc(q.beschreibung)}</span></li>`).join('')}</ul>
      <p class="muted">Die Quellen öffnen sich in einem neuen Tab und brauchen Internet. Deine Notizen bleiben auch offline in diesem Browser gespeichert.</p>
      <h3>Leitfragen</h3>${D.fragen.map((f, i) => ta('n' + i, `${i + 1}. ${esc(f.frage)}`, 3, 'Suchbegriffe: ' + esc(f.suche))).join('')}`,
    bind() {
      D.quellen.forEach((_, i) => { const c = $(`[data-g="${i}"]`); c.checked = !!st.g[i]; c.onchange = () => { st.g[i] = c.checked; save(); }; });
      D.fragen.forEach((_, i) => { const t = $('#n' + i); t.value = st.n[i] || ''; t.oninput = () => { st.n[i] = t.value; save(); }; });
    }
  }, {
    name: 'Schaltbilder',
    html: () => '<h2>2 Schaltbilder darstellen</h2><p>Stelle zwei Haushaltsstromkreise als Schaltbild dar und begründe die Sicherheitsregeln. Die Schaltzeichen sind vereinfacht dargestellt.</p>' + CIRC.map(c => `<section aria-labelledby="h-${c.id}"><h3 id="h-${c.id}">${c.titel}</h3><p>${c.aufgabe}</p>
      <figure class="schaltbild" id="fig-${c.id}"><div class="zeichnung"></div><figcaption class="muted">Klicke auf eine Lücke oder wähle unten ein Bauteil. Orange: Außenleiter L, blau: Neutralleiter N${c.id === 'c2' ? ', grün gestrichelt: Schutzleiter PE' : ''}.</figcaption></figure>
      <div class="slots">${c.slots.map(s => `<label>Platz ${s.id}: ${esc(s.name)}<select data-c="${c.id}" data-slot="${s.id}"><option value="">– leer –</option>${s.opt.map(o => `<option value="${o}">${OPT[o]}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="row"><button class="btn" type="button" data-pruef="${c.id}">Prüfen</button>${c.id === 'c2' ? '<button class="btn ghost" type="button" id="fehler" aria-pressed="false">Gehäuseschluss simulieren</button>' : ''}</div>
      <div id="out-${c.id}" aria-live="polite"></div></section>`).join('<hr>'),
    bind() {
      const redraw = c => { $(`#fig-${c.id} .zeichnung`).innerHTML = c.draw(st.c[c.id], c.id === 'c2' && fehlerAn); if (c.id === 'c2' && fehlerAn) { const a = ausgang(st.c.c2); $('#out-c2').innerHTML = `<p class="feedback ${a.optimal ? 'ok' : 'nok'}"><strong>${a.optimal ? 'Gut geschützt.' : a.sicher ? 'Nur teilweise geschützt.' : 'Gefährlich.'}</strong></p>` + a.text.map(x => `<p>${esc(x)}</p>`).join('') + (a.optimal ? '' : '<p class="muted">Am sichersten sind Schutzleiter, Leitungsschutzschalter und FI-Schutzschalter zusammen.</p>'); } };
      CIRC.forEach(c => {
        c.slots.forEach(s => { const sel = $(`select[data-c="${c.id}"][data-slot="${s.id}"]`); sel.value = st.c[c.id][s.id] || ''; sel.onchange = () => { st.c[c.id][s.id] = sel.value; save(); if (!(c.id === 'c2' && fehlerAn)) $('#out-' + c.id).innerHTML = ''; redraw(c); }; });
        $('#fig-' + c.id).onclick = e => { const g = e.target.closest('.sl'); if (!g) return; const sel = $(`select[data-c="${c.id}"][data-slot="${g.dataset.slot}"]`); sel.selectedIndex = (sel.selectedIndex + 1) % sel.options.length; sel.onchange(); };
        $(`[data-pruef="${c.id}"]`).onclick = () => {
          let ok = 0; const li = c.slots.map(s => { const v = st.c[c.id][s.id] || '', r = s.richtig.includes(v); if (r) ok++;
            return `<li class="${r ? 'ok' : 'nok'}"><strong>${r ? 'Richtig' : 'Noch nicht'}</strong> Platz ${s.id}: ${esc(r ? s.msg.ok : v ? (s.msg[v] || 'Das passt hier nicht.') : 'Hier fehlt noch ein Bauteil.')}</li>`; }).join('');
          fehlerAn = false; $('#out-' + c.id).innerHTML = `<p><strong>${ok} von ${c.slots.length}</strong> Plätzen richtig.</p><ul class="pruef">${li}</ul>`; if (c.id === 'c2') { $('#fehler').setAttribute('aria-pressed', 'false'); redraw(c); }
        };
        redraw(c);
      });
      $('#fehler').onclick = () => { fehlerAn = !fehlerAn; $('#fehler').setAttribute('aria-pressed', fehlerAn); if (!fehlerAn) $('#out-c2').innerHTML = ''; redraw(CIRC[1]); };
    }
  }, {
    name: 'Fachtext',
    html: () => `<h2>3 Fachsprachlich erklären</h2><p>Erkläre in 5 bis 8 Sätzen, wie ein Stromkreis im Haushalt aufgebaut ist und wie er vor Gefahren schützt. Nutze deine Notizen und Schaltbilder.</p>
      <div class="bausteine" role="group" aria-label="Satzanfänge">${D.bausteine.map((b, i) => `<button type="button" class="btn ghost" data-b="${i}">${esc(b.trim())} …</button>`).join('')}</div>
      ${ta('text', 'Dein Erklärtext', 9)}<p class="muted" id="worte"></p><div id="begriffe" aria-live="polite"></div><div id="hinweise" aria-live="polite"></div>
      ${ta('bild', 'Bildunterschrift zu Schaltbild A (1 bis 2 Sätze)', 3, 'Beschreibe, was das Schaltbild zeigt und worauf man bei der Sicherheit achten muss.')}
      <p class="muted">Die Fachbegriffe-Anzeige ist nur eine Orientierung. Ob dein Text inhaltlich stimmt, prüft deine Lehrkraft.</p>`,
    bind() {
      const t = $('#text'), b = $('#bild'); t.value = st.text; b.value = st.bild;
      const upd = () => { $('#begriffe').innerHTML = begriffeHtml(t.value); $('#hinweise').innerHTML = hinweiseHtml(t.value); $('#worte').textContent = wortzahl(t.value) + ' Wörter'; };
      t.oninput = () => { st.text = t.value; save(); upd(); }; b.oninput = () => { st.bild = b.value; save(); };
      document.querySelectorAll('[data-b]').forEach(x => x.onclick = () => { const s = D.bausteine[x.dataset.b], p = t.selectionStart, pre = p > 0 && !/\s$/.test(t.value.slice(0, p)) ? ' ' : ''; t.setRangeText(pre + s, p, t.selectionEnd, 'end'); t.focus(); t.oninput(); });
      upd();
    }
  }, {
    name: 'Ergebnisblatt',
    html: () => { const o = offen(); return `<h2>4 Ergebnisblatt</h2>
      ${o.length ? `<div class="hint noprint"><strong>Noch offen:</strong><ul>${o.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '<p class="feedback ok noprint">Alles bearbeitet. Du kannst das Blatt drucken oder als PDF speichern.</p>'}
      <div class="field noprint"><label for="name">Dein Name</label><input id="name" type="text" autocomplete="off"></div>
      <div class="ergebnis"><h3>${esc(D.titel)}</h3><p id="nameAus"></p>
      <h4>Genutzte Quellen</h4><ul>${D.quellen.filter((_, i) => st.g[i]).map(q => `<li>${esc(q.titel)}</li>`).join('') || '<li>keine markiert</li>'}</ul>
      ${CIRC.map((c, i) => `<h4>Schaltbild ${'AB'[i]}: ${esc(c.titel.replace(/^Aufgabe [AB]: /, ''))}</h4><figure class="schaltbild">${c.draw(st.c[c.id], false)}</figure>${i === 0 ? `<p><em>${esc(st.bild) || 'Keine Bildunterschrift.'}</em></p>` : ''}`).join('')}
      <h4>Erklärung</h4><p>${esc(st.text) || 'Noch kein Text.'}</p></div>
      <div class="row noprint"><button class="btn" type="button" id="druck">Drucken oder als PDF speichern</button><button class="btn ghost" type="button" id="kopie">Text kopieren</button><span class="muted" id="kopiert" aria-live="polite"></span></div>`; },
    bind() {
      const n = $('#name'); n.value = st.name; const z = () => { $('#nameAus').textContent = st.name ? 'Name: ' + st.name : ''; }; z();
      n.oninput = () => { st.name = n.value; save(); z(); };
      $('#druck').onclick = () => print();
      $('#kopie').onclick = async () => { const s = `${D.titel}\n${st.name ? 'Name: ' + st.name + '\n' : ''}\nBildunterschrift: ${st.bild}\n\n${st.text}`; try { await navigator.clipboard.writeText(s); $('#kopiert').textContent = 'Kopiert.'; } catch (e) { $('#kopiert').textContent = 'Kopieren nicht möglich. Markiere den Text und kopiere ihn von Hand.'; } };
    }
  }];

  function render(fokus) {
    const s = steps[schritt - 1];
    mount.innerHTML = `<ol class="schritte" aria-label="Arbeitsschritte">${steps.map((x, i) => `<li><button type="button" data-step="${i + 1}"${i + 1 === schritt ? ' aria-current="step"' : ''}>${i + 1}. ${x.name}</button></li>`).join('')}</ol>` + s.html() +
      `<div class="nav-unten">${schritt > 1 ? `<button class="btn ghost" type="button" data-step="${schritt - 1}">Zurück</button>` : '<span></span>'}${schritt < steps.length ? `<button class="btn" type="button" data-step="${schritt + 1}">Weiter</button>` : '<span></span>'}</div>`;
    mount.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { schritt = +b.dataset.step; render(true); });
    s.bind();
    if (fokus) { const h = mount.querySelector('h2,h3'); if (h) { h.tabIndex = -1; h.focus(); } scrollTo(0, 0); }
  }
  render();
})();
