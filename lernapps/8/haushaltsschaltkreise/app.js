(async () => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mount = $('#app');
  let D; try { D = await (await fetch('daten.json')).json(); } catch (e) { mount.textContent = 'Die Inhalte konnten nicht geladen werden. Lade die Seite neu.'; return; }
  const KEY = 'haushalt:' + location.pathname; let st = {};
  try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  st.n = st.n || {}; st.g = st.g || {}; st.c = st.c || {}; st.v = st.v || {}; st.text = st.text || ''; st.bild = st.bild || ''; st.name = st.name || '';
  st.c.c1 = st.c.c1 || {}; st.c.c2 = st.c.c2 || {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  // ---------- Schaltzeichen ----------
  const WC = { L: 'var(--f-mathematik)', N: 'var(--f-physik)', PE: 'var(--f-chemie)' };
  const TXT = 'fill="var(--text)" font-size="14" font-family="inherit"';
  const OPT = { leitung: 'Leitung', sicherung: 'Sicherung', schalter: 'Schalter', fi: 'FI-Schutzschalter' };
  const wire = (x1, y1, x2, y2, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${WC[w]}" stroke-width="3" stroke-linecap="round"${w === 'PE' ? ' stroke-dasharray="10 5"' : ''}/>`;
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="var(--text)"/>`;
  const comp = (t, c) => ({
    leitung: `<line x1="-37" x2="37" stroke="${c}" stroke-width="3"/>`,
    sicherung: `<line x1="-37" x2="-22" stroke="${c}" stroke-width="3"/><line x1="22" x2="37" stroke="${c}" stroke-width="3"/><rect x="-22" y="-9" width="44" height="18" fill="none" stroke="var(--text)" stroke-width="2.5"/><line x1="-22" x2="22" stroke="var(--text)" stroke-width="2"/>`,
    schalter: `<line x1="-37" x2="-20" stroke="${c}" stroke-width="3"/><line x1="22" x2="37" stroke="${c}" stroke-width="3"/><line x1="-20" y1="0" x2="16" y2="-17" stroke="var(--text)" stroke-width="2.5" stroke-linecap="round"/><circle cx="-20" r="3.5" fill="var(--text)"/><circle cx="22" r="3.5" fill="var(--text)"/>`,
    fi: `<line x1="-37" x2="-26" stroke="${c}" stroke-width="3"/><line x1="26" x2="37" stroke="${c}" stroke-width="3"/><rect x="-26" y="-13" width="52" height="26" rx="3" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/><text x="0" y="5" text-anchor="middle" ${TXT} font-weight="700">FI</text>`
  }[t] || '');
  const slot = (s, val, stat) => {
    const attrs = stat ? '' : ` class="sl" data-slot="${s.id}" role="button" tabindex="0" aria-label="Platz ${s.id}: ${val ? OPT[val] : 'leer'}"`;
    const hit = stat ? '' : `<rect x="${s.x - (s.v ? 22 : 40)}" y="${s.fi ? 36 : s.y - (s.v ? 40 : 22)}" width="${s.v ? 44 : 80}" height="${s.fi ? 128 : s.v ? 80 : 44}" fill="transparent"/>`;
    const lab = `<text x="${s.v ? s.x - 50 : s.x}" y="${s.fi ? 26 : s.v ? s.y + 5 : s.y - 28}" text-anchor="middle" ${TXT} font-weight="700">${s.id}</text>`;
    if (s.fi) { // hoher Kasten über beide Leiter
      const box = `<rect x="${s.x - 32}" y="36" width="64" height="128" rx="6" fill="${val ? 'var(--surface)' : 'none'}" stroke="${val ? 'var(--text)' : 'var(--accent)'}" stroke-width="2.5"${val ? '' : ' stroke-dasharray="5 4"'}/>`;
      const t = val === 'fi' ? 'FI' : val === 'sicherung' ? 'Sicherung' : val === 'schalter' ? 'Schalter' : '';
      return `<g${attrs}>${val === 'leitung' ? '' : box}<text x="${s.x}" y="106" text-anchor="middle" ${TXT} font-size="${val === 'fi' ? 22 : 11}" font-weight="700">${t}</text>${hit}${lab}</g>`;
    }
    const base = `<rect x="-37" y="-18" width="74" height="36" rx="6" fill="var(--surface)" ${val ? 'stroke="none"' : 'stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"'}/>`;
    return `<g${attrs}><g transform="translate(${s.x} ${s.y}) rotate(${s.v ? 90 : 0})">${base}${comp(val, WC[s.w])}</g>${hit}${lab}</g>`;
  };
  const lamp = (x, y, n) => `<circle cx="${x}" cy="${y}" r="20" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/><path d="M${x - 14} ${y - 14}L${x + 14} ${y + 14}M${x + 14} ${y - 14}L${x - 14} ${y + 14}" stroke="var(--text)" stroke-width="2.5"/><text x="${x + 30}" y="${y + 5}" ${TXT}>${n}</text>`;
  const sourceCircle = (x, y) => `<circle cx="${x}" cy="${y}" r="24" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/><text x="${x}" y="${y + 8}" text-anchor="middle" font-size="24" ${TXT}>~</text>`;
  const svg = (vb, inner, stat) => `<svg viewBox="${vb}" ${stat ? 'role="img" aria-label="Schaltbild"' : 'role="group" aria-label="Schaltbild mit Lücken"'} focusable="false">${inner}</svg>`;
  const eraser = '<path d="M-12 -12L12 12M12 -12L-12 12" stroke="var(--muted)" stroke-width="3" stroke-linecap="round"/>';

  // ---------- Aufgaben: Rückmeldungen als Denkanstöße, nicht als Lösung ----------
  const OPT3 = ['leitung', 'sicherung', 'schalter'], OPT4 = ['leitung', 'sicherung', 'schalter', 'fi'];
  const OKC = 'Der Schalter im Außenleiter macht die Lampe spannungsfrei, wenn er geöffnet ist.', OKD = 'Im Neutralleiter ist eine durchgehende Leitung richtig.';
  const MC = { leitung: 'Ohne Bauteil lässt sich diese Lampe nicht ausschalten.', sicherung: 'Eine Sicherung trennt nur bei zu großer Stromstärke, nicht auf Knopfdruck.' };
  const MD = { schalter: 'Die Lampe geht damit aus. Aber welche der beiden Leitungen liegt dann noch an der Lampenfassung an? Was bedeutet das beim Lampenwechsel?', sicherung: 'Die gemeinsame Zuleitung ist schon gesichert. Brauchst du in diesem Zweig noch ein Bauteil?' };
  const CIRC = [{
    id: 'c1', titel: 'Aufgabe A: Zwei Lampen im Haushaltsstromkreis',
    aufgabe: 'Setze in die Lücken A bis F passende Bauteile ein. Die Lampen sollen einzeln schaltbar sein, die Leitung soll gegen zu große Stromstärken gesichert sein, und der Lampenwechsel soll ungefährlich sein.',
    tipps: ['Überlege: Welche Bauteile trennen den Stromkreis automatisch, welche nur von Hand?', 'Stell dir vor, der Schalter ist offen und du wechselst die Lampe. Welcher Leiter darf dann nicht mehr an der Fassung anliegen?', 'Jede Lampe braucht ihren eigenen Schalter. Die gemeinsame Zuleitung schützt ein Bauteil, das von selbst auslöst.'],
    opt: OPT3,
    slots: [
      { id: 'A', x: 170, y: 60, w: 'L', name: 'gemeinsame Zuleitung, Außenleiter', richtig: ['sicherung'], msg: { ok: 'Die Sicherung im Außenleiter trennt bei Überlastung oder Kurzschluss den Stromkreis.', leitung: 'Mit einer durchgehenden Leitung gibt es hier keinen Schutz. Was passiert mit der Leitung, wenn zu viele Geräte laufen oder ein Kurzschluss auftritt?', schalter: 'Ein Schalter öffnet nur, wenn ihn jemand betätigt. Wer trennt den Stromkreis, wenn ein Kurzschluss entsteht und niemand zu Hause ist?' } },
      { id: 'B', x: 170, y: 300, w: 'N', name: 'gemeinsame Zuleitung, Neutralleiter', richtig: ['leitung', 'sicherung'], msg: { ok: 'Im Neutralleiter genügt hier eine durchgehende Leitung (oder eine Sicherung, die beide Leiter trennt).', schalter: 'Ein Schalter im Neutralleiter allein schaltet die Anlage nicht spannungsfrei. Welcher Leiter bleibt dann unter Spannung?' } },
      { id: 'C', x: 330, y: 115, v: 1, w: 'L', name: 'Lampe 1, Außenleiter-Seite', richtig: ['schalter'], msg: { ok: OKC, ...MC } },
      { id: 'D', x: 330, y: 245, v: 1, w: 'N', name: 'Lampe 1, Neutralleiter-Seite', richtig: ['leitung'], msg: { ok: OKD, ...MD } },
      { id: 'E', x: 520, y: 115, v: 1, w: 'L', name: 'Lampe 2, Außenleiter-Seite', richtig: ['schalter'], msg: { ok: OKC, ...MC } },
      { id: 'F', x: 520, y: 245, v: 1, w: 'N', name: 'Lampe 2, Neutralleiter-Seite', richtig: ['leitung'], msg: { ok: OKD, ...MD } }
    ],
    draw(v, fehler, stat) {
      const L = 60, N = 300;
      return svg('0 0 740 340', wire(60, L, 690, L, 'L') + wire(60, N, 690, N, 'N') + wire(60, L, 60, 156, 'L') + wire(60, 204, 60, N, 'N') + sourceCircle(60, 180) +
        [330, 520].map((x, i) => wire(x, L, x, 180, 'L') + wire(x, 180, x, N, 'N') + dot(x, L) + dot(x, N) + lamp(x, 180, 'Lampe ' + (i + 1))).join('') +
        `<text x="76" y="44" ${TXT}>L (Außenleiter)</text><text x="76" y="326" ${TXT}>N (Neutralleiter)</text><text x="92" y="186" ${TXT}>230 V</text>` +
        this.slots.map(s => slot(s, v[s.id], stat)).join(''), stat);
    }
  }, {
    id: 'c2', titel: 'Aufgabe B: Steckdose, Schutzleiter und FI-Schutzschalter',
    aufgabe: 'Ein Gerät mit Metallgehäuse hängt an einer Steckdose. Setze Schutzeinrichtungen in die Lücken A bis C. Eine leere Lücke bedeutet: Die Einrichtung fehlt. Teste danach mit dem Gehäuseschluss, was passiert.',
    tipps: ['Es gibt drei Gefahren: zu große Stromstärke, ein kleiner Fehlerstrom durch den Körper und Spannung am Gehäuse. Welche Einrichtung passt zu welcher Gefahr?', 'Ein Bauteil muss Hin- und Rückstrom vergleichen. Dafür braucht es beide Leiter. Der Schutzleiter wird nicht durch Schalter geführt.', 'Teste mit „Gehäuseschluss simulieren“, was bei leeren Lücken passiert, und vergleiche.'],
    opt: OPT4,
    slots: [
      { id: 'A', x: 130, y: 60, w: 'L', name: 'Außenleiter, nahe am Netz', richtig: ['sicherung'], msg: { ok: 'Der Leitungsschutzschalter im Außenleiter schützt die Leitung vor Überlastung und Kurzschluss.', leitung: 'Ohne Schutzeinrichtung im Außenleiter: Was passiert bei Überlastung oder Kurzschluss mit der Leitung?', schalter: 'Ein Schalter öffnet nur von Hand. Wer trennt den Stromkreis bei zu großer Stromstärke?', fi: 'Der FI-Schutzschalter reagiert auf Fehlerströme und misst dafür beide Leiter. Reicht das, um die Leitung vor Überlastung zu schützen?' } },
      { id: 'B', x: 270, y: 100, fi: 1, name: 'beide Leiter gemeinsam', richtig: ['fi'], msg: { ok: 'Der FI-Schutzschalter vergleicht die Stromstärke im Außen- und im Neutralleiter und trennt bei einer Differenz von etwa 30 mA.', leitung: 'Ohne dieses Bauteil bleibt ein kleiner Strom durch einen Körper unbemerkt. Würde die Sicherung schon bei 30 mA auslösen?', sicherung: 'Eine Sicherung löst erst bei sehr großer Stromstärke aus (Ampere-Bereich). Reicht das, um einen Menschen zu schützen?', schalter: 'Ein Schalter löst nicht von selbst aus.' } },
      { id: 'C', x: 440, y: 220, w: 'PE', name: 'Schutzleiter zum Gehäuse', richtig: ['leitung'], msg: { ok: 'Der Schutzleiter verbindet das Metallgehäuse dauerhaft mit der Erde.', sicherung: 'Dieser Leiter muss immer durchgehend verbunden sein. Was passiert bei einem Gehäuseschluss, wenn er unterbrochen werden kann?', schalter: 'Dieser Leiter muss immer durchgehend verbunden sein. Was passiert bei einem Gehäuseschluss, wenn er unterbrochen werden kann?', fi: 'Dieser Leiter muss immer durchgehend verbunden sein. Was passiert bei einem Gehäuseschluss, wenn er unterbrochen werden kann?' } }
    ],
    draw(v, fehler, stat) {
      const red = '#e11d48';
      return svg('0 0 780 300', wire(50, 60, 650, 60, 'L') + wire(50, 140, 650, 140, 'N') + wire(50, 220, 560, 220, 'PE') + wire(50, 60, 50, 76, 'L') + wire(50, 124, 50, 140, 'N') + sourceCircle(50, 100) +
        `<g stroke="var(--text)" stroke-width="2.5"><line x1="50" y1="220" x2="50" y2="236"/><line x1="38" y1="236" x2="62" y2="236"/><line x1="42" y1="243" x2="58" y2="243"/><line x1="46" y1="250" x2="54" y2="250"/></g>` +
        `<line x1="520" y1="30" x2="520" y2="250" stroke="var(--muted)" stroke-width="2" stroke-dasharray="3 5"/><text x="520" y="272" text-anchor="middle" ${TXT}>Steckdose</text>` +
        `<rect x="560" y="30" width="190" height="220" rx="10" fill="none" stroke="var(--text)" stroke-width="2.5" stroke-dasharray="8 5"/><text x="655" y="22" text-anchor="middle" ${TXT}>Metallgehäuse</text>` +
        wire(650, 60, 650, 78, 'L') + wire(650, 122, 650, 140, 'N') + `<rect x="638" y="78" width="24" height="44" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/><text x="672" y="104" ${TXT}>Heizdraht</text>` +
        dot(560, 220) + dot(650, 60) + dot(650, 140) +
        `<text x="400" y="48" ${TXT}>L (Außenleiter)</text><text x="400" y="128" ${TXT}>N (Neutralleiter)</text><text x="300" y="208" ${TXT}>PE (Schutzleiter)</text>` +
        this.slots.map(s => slot(s, v[s.id], stat)).join('') +
        (fehler ? `<path d="M650 100 L690 84 L700 100 L748 72" fill="none" stroke="${red}" stroke-width="3.5" stroke-linejoin="round"/><text x="655" y="240" text-anchor="middle" font-size="13" font-weight="700" fill="${red}" font-family="inherit">Gehäuseschluss</text>` : ''), stat);
    }
  }];
  const loesung = c => Object.fromEntries(c.slots.map(s => [s.id, s.richtig[0]]));
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
  const pruefListe = (c, v) => {
    let ok = 0;
    const li = c.slots.map(s => {
      const val = v[s.id] || '', r = s.richtig.includes(val); if (r) ok++;
      const text = r ? s.msg.ok : val ? (s.msg[val] || 'Das passt hier nicht.') : 'Diese Lücke ist noch leer.';
      return `<li class="${r ? 'ok' : 'nok'}"><span class="badge" aria-hidden="true">${s.id}</span><div><p class="pr-status"><strong>Platz ${s.id}: ${r ? '✓ Richtig' : '✗ Noch nicht'}</strong> <span class="muted">${esc(s.name)}</span></p><p>${esc(text)}</p></div></li>`;
    }).join('');
    return `<p class="pr-summe"><strong>${ok} von ${c.slots.length}</strong> Plätzen richtig.</p><ul class="pruef">${li}</ul>`;
  };

  // ---------- Hilfsfunktionen Text ----------
  const wortzahl = t => t.trim().split(/\s+/).filter(Boolean).length;
  const begriffe = t => D.begriffe.map(b => ({ name: b.name, da: new RegExp(b.muster, 'i').test(t) }));
  const begriffeHtml = t => { const b = begriffe(t), n = b.filter(x => x.da).length; return `<p><strong>${n} von ${b.length}</strong> Fachbegriffen verwendet (Ziel: mindestens ${D.ziel}).</p><ul class="begriffe">${b.map(x => `<li class="${x.da ? 'da' : ''}">${x.da ? '✓' : '○'} ${esc(x.name)}</li>`).join('')}</ul>`; };
  const hinweiseHtml = t => D.hinweise.filter(h => new RegExp(h.muster, 'i').test(t)).map(h => `<p class="hint">${esc(h.text)}</p>`).join('');
  const grow = t => { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight + 2, 104) + 'px'; };
  // ---------- Aussagen-Check ----------
  let letzte = null;
  const checkHtml = r => {
    const gr = { ok: [], teil: [], fehlt: [] }; r.aussagen.forEach((a, i) => gr[a.status].push([a, i]));
    const btn = (ai, ti, z) => `<button type="button" class="btn ghost kl" data-note data-a="${ai}" data-t="${ti}"${z ? ' data-z="1"' : ''}>In meine Notizen übernehmen</button>`;
    const liste = (titel, items, f) => items.length ? `<h4>${titel}</h4><ul class="pruef">${items.map(f).join('')}</ul>` : '';
    const ok = ([a]) => `<li class="ok"><span class="badge" aria-hidden="true">✓</span><div><p class="pr-status"><strong>${esc(a.titel)}</strong></p><p>${esc(a.lob)}</p></div></li>`;
    const off = ([a, i]) => `<li class="nok"><span class="badge" aria-hidden="true">?</span><div><p class="pr-status"><strong>${esc(a.titel)}</strong> <span class="muted">${a.status === 'teil' ? 'teilweise erkennbar' : 'noch nicht erkennbar'}</span></p>` +
      a.teile.filter(t => t.ok).map(t => `<p>✓ ${esc(t.lob)}</p>`).join('') + a.teile.map((t, j) => t.ok ? '' : `<p>${esc(t.frage)}</p>${btn(i, j)}`).join('') + `<p class="muted">Gehört zu Leitfrage ${a.leitfrage + 1}.</p></div></li>`;
    const zus = (z, i) => z.ok ? `<li class="ok"><span class="badge" aria-hidden="true">✓</span><div><p>${esc(z.lob)}</p></div></li>` : `<li class="nok"><span class="badge" aria-hidden="true">+</span><div><p>${esc(z.frage)}</p>${btn(i, 0, true)}</div></li>`;
    return `<p><strong>${gr.ok.length} von ${r.aussagen.length}</strong> Kernaussagen sind in deinem Text erkennbar.</p>` +
      (r.hinweise.length ? `<h4>Achtung bei dieser Formulierung</h4>${r.hinweise.map(h => `<p class="hint">${esc(h)}</p>`).join('')}` : '') +
      liste('Das steht schon in deinem Text', gr.ok, ok) + liste('Das ist noch ungenau', gr.teil, off) + liste('Das fehlt noch', gr.fehlt, off) +
      (r.zusaetze.length ? `<h4>Zum Weiterdenken</h4><ul class="pruef">${r.zusaetze.map(zus).join('')}</ul>` : '') +
      '<p class="muted">Stand der letzten Prüfung. Prüfe nach Änderungen erneut.</p>';
  };
  const notiz = (idx, frage) => { const z = 'Offene Frage: ' + frage, alt = st.n[idx] || ''; if (!alt.includes(z)) st.n[idx] = alt ? alt + '\n' + z : z; save(); };
  const offen = () => {
    const o = [], gel = D.quellen.filter((_, i) => st.g[i]).length;
    if (gel < D.quellen.length) o.push(`${D.quellen.length - gel} Quelle(n) noch nicht als gelesen markiert`);
    const nn = D.fragen.filter((_, i) => (st.n[i] || '').trim()).length; if (nn < D.fragen.length) o.push(`${D.fragen.length - nn} Leitfrage(n) ohne Notizen`);
    CIRC.forEach((c, i) => { if (c.slots.some(s => !st.c[c.id][s.id])) o.push(`Schaltbild ${'AB'[i]} hat noch leere Lücken`); });
    if (wortzahl(st.text) < 30) o.push('Der Erklärtext ist noch sehr kurz'); if (!st.bild.trim()) o.push('Die Bildunterschrift fehlt');
    return o;
  };

  // ---------- Schritte ----------
  const ROUTEN = ['recherche', 'schaltbilder', 'fachtext', 'ergebnis'];
  let fehlerAn = false; const tool = {}, tipp = {};
  const steps = [{
    name: 'Recherchieren',
    html: () => `<p class="eyebrow">Schritt 1 von 4</p><h2>Recherchieren</h2><p>${esc(D.auftrag)}</p>
      <h3>Quellen</h3>
      <ul class="karten">${D.quellen.map((q, i) => `<li class="karte"><p><a class="q-titel" href="${esc(q.url)}" target="_blank" rel="noopener noreferrer">${esc(q.titel)}<span class="extern" aria-hidden="true">↗</span><span class="visually-hidden"> (öffnet in einem neuen Tab)</span></a></p>
        <p class="muted">${esc(q.beschreibung)}</p><label class="check"><input type="checkbox" data-g="${i}"><span>Ich habe diese Quelle gelesen</span></label></li>`).join('')}</ul>
      <p class="muted">Die Quellen brauchen Internet. Deine Notizen bleiben auch offline in diesem Browser gespeichert.</p>
      <h3>Leitfragen</h3>
      <div class="karten">${D.fragen.map((f, i) => `<div class="karte"><div class="fk-kopf"><span class="nr" aria-hidden="true">${i + 1}</span><label for="n${i}">${esc(f.frage)}</label></div>
        <textarea id="n${i}" rows="3" placeholder="Meine Stichpunkte …"></textarea>
        <ul class="chips" aria-label="Suchbegriffe"><li>Suchbegriffe:</li>${f.suche.split(',').map(x => `<li>${esc(x.trim())}</li>`).join('')}</ul></div>`).join('')}</div>`,
    bind() {
      D.quellen.forEach((_, i) => { const c = $(`[data-g="${i}"]`); c.checked = !!st.g[i]; c.onchange = () => { st.g[i] = c.checked; save(); }; });
      D.fragen.forEach((_, i) => { const t = $('#n' + i); t.value = st.n[i] || ''; grow(t); t.oninput = () => { st.n[i] = t.value; save(); grow(t); }; });
    }
  }, {
    name: 'Schaltbilder',
    html: () => `<p class="eyebrow">Schritt 2 von 4</p><h2>Schaltbilder darstellen</h2><p>Stelle zwei Haushaltsstromkreise als Schaltbild dar. Wähle ein Bauteil und klicke auf eine Lücke. Die Schaltzeichen sind vereinfacht dargestellt.</p>` +
      CIRC.map(c => `<section class="aufgabe" aria-labelledby="h-${c.id}"><h3 id="h-${c.id}">${c.titel}</h3><p>${c.aufgabe}</p>
      <div class="palette" role="group" aria-label="Bauteile">${[...c.opt, 'x'].map(o => `<button type="button" class="bauteil" data-tool="${o}" aria-pressed="false"><svg viewBox="-42 -20 84 40" aria-hidden="true">${o === 'x' ? eraser : comp(o, 'var(--muted)')}</svg><span>${o === 'x' ? 'Entfernen' : OPT[o]}</span></button>`).join('')}</div>
      <p class="status muted" id="status-${c.id}" role="status">Wähle ein Bauteil und klicke dann auf eine Lücke im Schaltbild.</p>
      <figure class="schaltbild" id="fig-${c.id}"><div class="zeichnung"></div><figcaption class="muted">Orange: Außenleiter L, blau: Neutralleiter N${c.id === 'c2' ? ', grün gestrichelt: Schutzleiter PE' : ''}. Die Lücken lassen sich auch mit der Tastatur auswählen (Tab, dann Eingabetaste).</figcaption></figure>
      <div class="aktionen"><button class="btn" type="button" data-pruef>Prüfen</button><button class="btn ghost" type="button" data-tipp>Tipp</button><button class="btn ghost" type="button" data-loes disabled>Lösung anzeigen</button><button class="btn ghost" type="button" data-reset>Zurücksetzen</button>${c.id === 'c2' ? '<button class="btn ghost" type="button" id="fehler" aria-pressed="false">Gehäuseschluss simulieren</button>' : ''}</div>
      <p class="muted" id="lh-${c.id}"></p><div id="tipp-${c.id}" aria-live="polite"></div><div id="out-${c.id}" aria-live="polite"></div></section>`).join('<hr>'),
    bind() {
      CIRC.forEach(c => {
        const root = $(`#fig-${c.id}`).closest('section'), q = s => root.querySelector(s), status = t => { q('#status-' + c.id).textContent = t; };
        const loesBtn = () => { const n = st.v[c.id] || 0; q('[data-loes]').disabled = n < 2; q('#lh-' + c.id).textContent = n < 2 ? 'Die Lösung kannst du nach zwei Prüfungen anzeigen lassen.' : ''; };
        const redraw = fokus => {
          q('.zeichnung').innerHTML = c.draw(st.c[c.id], c.id === 'c2' && fehlerAn);
          if (fokus) { const g = q(`[data-slot="${fokus}"]`); if (g) g.focus(); }
          if (c.id === 'c2' && fehlerAn) { const a = ausgang(st.c.c2); q('#out-c2').innerHTML = `<p class="feedback ${a.optimal ? 'ok' : 'nok'}"><strong>${a.optimal ? 'Gut geschützt.' : a.sicher ? 'Nur teilweise geschützt.' : 'Gefährlich.'}</strong></p>` + a.text.map(x => `<p>${esc(x)}</p>`).join('') + (a.optimal ? '' : '<p class="muted">Vergleiche mit anderen Kombinationen: Was schützt wovor?</p>'); }
        };
        const place = id => {
          const t = tool[c.id]; if (!t) { status('Wähle zuerst oben ein Bauteil.'); return; }
          st.c[c.id][id] = t === 'x' ? '' : t; save(); if (!(c.id === 'c2' && fehlerAn)) q('#out-' + c.id).innerHTML = '';
          status(`Platz ${id}: ${t === 'x' ? 'geleert' : OPT[t] + ' eingesetzt'}.`); redraw(id);
        };
        root.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => {
          const o = b.dataset.tool; tool[c.id] = tool[c.id] === o ? null : o;
          root.querySelectorAll('[data-tool]').forEach(x => x.setAttribute('aria-pressed', x.dataset.tool === tool[c.id]));
          status(!tool[c.id] ? 'Kein Bauteil gewählt.' : o === 'x' ? 'Entfernen gewählt. Klicke auf ein eingesetztes Bauteil.' : `${OPT[o]} gewählt. Klicke auf eine Lücke.`);
        });
        const fig = $(`#fig-${c.id}`);
        fig.onclick = e => { const g = e.target.closest('.sl'); if (g) place(g.dataset.slot); };
        fig.onkeydown = e => { if (e.key !== 'Enter' && e.key !== ' ') return; const g = e.target.closest('.sl'); if (g) { e.preventDefault(); place(g.dataset.slot); } };
        q('[data-pruef]').onclick = () => { st.v[c.id] = (st.v[c.id] || 0) + 1; save(); fehlerAn = false; if (c.id === 'c2') $('#fehler').setAttribute('aria-pressed', 'false'); q('#out-' + c.id).innerHTML = pruefListe(c, st.c[c.id]); redraw(); loesBtn(); };
        q('[data-tipp]').onclick = () => { const i = Math.min((tipp[c.id] ?? -1) + 1, c.tipps.length - 1); tipp[c.id] = i; q('#tipp-' + c.id).innerHTML = `<p class="hint"><strong>Tipp ${i + 1} von ${c.tipps.length}:</strong> ${esc(c.tipps[i])}</p>`; };
        q('[data-loes]').onclick = () => { if (!confirm('Die Lösung wird eingetragen und deine Eingaben werden überschrieben. Fortfahren?')) return; st.c[c.id] = loesung(c); save(); fehlerAn = false; redraw(); q('#out-' + c.id).innerHTML = pruefListe(c, st.c[c.id]); };
        q('[data-reset]').onclick = () => { st.c[c.id] = {}; save(); fehlerAn = false; q('#out-' + c.id).innerHTML = ''; status('Alle Lücken geleert.'); redraw(); };
        redraw(); loesBtn();
      });
      $('#fehler').onclick = () => { fehlerAn = !fehlerAn; $('#fehler').setAttribute('aria-pressed', fehlerAn); if (!fehlerAn) $('#out-c2').innerHTML = ''; $('#fig-c2 .zeichnung').innerHTML = CIRC[1].draw(st.c.c2, fehlerAn); if (fehlerAn) { const a = ausgang(st.c.c2); $('#out-c2').innerHTML = `<p class="feedback ${a.optimal ? 'ok' : 'nok'}"><strong>${a.optimal ? 'Gut geschützt.' : a.sicher ? 'Nur teilweise geschützt.' : 'Gefährlich.'}</strong></p>` + a.text.map(x => `<p>${esc(x)}</p>`).join('') + (a.optimal ? '' : '<p class="muted">Vergleiche mit anderen Kombinationen: Was schützt wovor?</p>'); } };
    }
  }, {
    name: 'Fachtext',
    html: () => `<p class="eyebrow">Schritt 3 von 4</p><h2>Fachsprachlich erklären</h2><p>Erkläre in 5 bis 8 Sätzen, wie ein Stromkreis im Haushalt aufgebaut ist und wie er vor Gefahren schützt. Nutze deine Notizen und Schaltbilder.</p>
      <div class="editor"><p class="eb-titel">Satzanfänge zum Einfügen</p>
        <div class="bausteine" role="group" aria-label="Satzanfänge">${D.bausteine.map((b, i) => `<button type="button" class="btn ghost" data-b="${i}">${esc(b.trim())} …</button>`).join('')}</div>
        <label for="text">Dein Erklärtext</label><textarea id="text" rows="9" placeholder="Schreibe in ganzen Sätzen und benutze Fachbegriffe …"></textarea><p class="zaehler muted" id="worte"></p></div>
      <div id="begriffe" aria-live="polite"></div><div id="hinweise" aria-live="polite"></div>
      <div class="editor"><h3>Aussagen-Check</h3>
        <p>Der Check vergleicht deinen Text mit den wichtigsten Kernaussagen und stellt dir Rückfragen. Rechtschreib- und Zeichensetzungsfehler spielen dabei keine Rolle. Er ist ein automatischer Textvergleich und keine Bewertung und kann richtige Formulierungen übersehen, die er nicht kennt.</p>
        <button class="btn" type="button" id="check">Text prüfen</button><div id="checkout" aria-live="polite"></div></div>
      <div class="editor field"><label for="bild">Bildunterschrift zu Schaltbild A (1 bis 2 Sätze)</label><textarea id="bild" rows="3" placeholder="Das Schaltbild zeigt …"></textarea><p class="muted">Beschreibe, was das Schaltbild zeigt und worauf man bei der Sicherheit achten muss.</p></div>
      <p class="muted">Die Fachbegriffe-Anzeige ist nur eine Orientierung. Ob dein Text inhaltlich stimmt, prüft deine Lehrkraft.</p>`,
    bind() {
      const t = $('#text'), b = $('#bild'); t.value = st.text; b.value = st.bild; t.parentElement.classList.add('field');
      const upd = () => { $('#begriffe').innerHTML = begriffeHtml(t.value); $('#hinweise').innerHTML = hinweiseHtml(t.value); $('#worte').textContent = wortzahl(t.value) + ' Wörter'; grow(t); };
      t.oninput = () => { st.text = t.value; save(); upd(); }; b.oninput = () => { st.bild = b.value; save(); grow(b); };
      $$('[data-b]').forEach(x => x.onclick = () => { const s = D.bausteine[x.dataset.b], p = t.selectionStart, pre = p > 0 && !/\s$/.test(t.value.slice(0, p)) ? ' ' : ''; t.setRangeText(pre + s, p, t.selectionEnd, 'end'); t.focus(); t.oninput(); });
      $('#check').onclick = () => {
        const out = $('#checkout');
        if (wortzahl(t.value) < 15) { out.innerHTML = '<p class="hint">Dein Text ist noch sehr kurz. Schreibe zuerst mindestens zwei bis drei Sätze und prüfe dann erneut.</p>'; return; }
        letzte = LernLab.textcheck.pruefe(t.value, D); out.innerHTML = checkHtml(letzte);
        out.querySelectorAll('[data-note]').forEach(x => x.onclick = () => {
          const ai = +x.dataset.a, ti = +x.dataset.t, z = x.dataset.z ? letzte.zusaetze[ai] : null, a = z || letzte.aussagen[ai];
          notiz(a.leitfrage, z ? z.frage : a.teile[ti].frage); x.textContent = `✓ In Leitfrage ${a.leitfrage + 1} übernommen`; x.disabled = true;
        });
      };
      upd(); grow(b);
    }
  }, {
    name: 'Ergebnisblatt',
    html: () => { const o = offen(); return `<p class="eyebrow">Schritt 4 von 4</p><h2>Ergebnisblatt</h2>
      ${o.length ? `<div class="hint noprint"><strong>Noch offen:</strong><ul>${o.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '<p class="feedback ok noprint">Alles bearbeitet. Du kannst das Blatt drucken oder als PDF speichern.</p>'}
      <div class="field noprint"><label for="name">Dein Name</label><input id="name" type="text" autocomplete="off" placeholder="Vor- und Nachname"></div>
      <div class="ergebnis"><h3>${esc(D.titel)}</h3><p id="nameAus"></p>
      <h4>Genutzte Quellen</h4><ul>${D.quellen.filter((_, i) => st.g[i]).map(q => `<li>${esc(q.titel)}</li>`).join('') || '<li>keine markiert</li>'}</ul>
      ${CIRC.map((c, i) => `<h4>Schaltbild ${'AB'[i]}: ${esc(c.titel.replace(/^Aufgabe [AB]: /, ''))}</h4><figure class="schaltbild">${c.draw(st.c[c.id], false, true)}</figure>${i === 0 ? `<p><em>${esc(st.bild) || 'Keine Bildunterschrift.'}</em></p>` : ''}`).join('')}
      <h4>Erklärung</h4><p>${esc(st.text) || 'Noch kein Text.'}</p></div>
      <div class="aktionen noprint"><button class="btn" type="button" id="druck">Drucken oder als PDF speichern</button><button class="btn ghost" type="button" id="kopie">Text kopieren</button><span class="muted" id="kopiert" aria-live="polite"></span></div>`; },
    bind() {
      const n = $('#name'); n.value = st.name; const z = () => { $('#nameAus').textContent = st.name ? 'Name: ' + st.name : ''; }; z();
      n.oninput = () => { st.name = n.value; save(); z(); };
      $('#druck').onclick = () => print();
      $('#kopie').onclick = async () => { const s = `${D.titel}\n${st.name ? 'Name: ' + st.name + '\n' : ''}\nBildunterschrift: ${st.bild}\n\n${st.text}`; try { await navigator.clipboard.writeText(s); $('#kopiert').textContent = 'Kopiert.'; } catch (e) { $('#kopiert').textContent = 'Kopieren nicht möglich. Markiere den Text und kopiere ihn von Hand.'; } };
    }
  }];

  function render(fokus) {
    const nr = Math.max(0, ROUTEN.indexOf(location.hash.slice(1))), s = steps[nr];
    const link = (i, cls, text) => `<a class="${cls}" href="#${ROUTEN[i]}">${text}</a>`;
    mount.innerHTML = `<nav class="schritte" aria-label="Arbeitsschritte">${steps.map((x, i) => `<a class="schritt" href="#${ROUTEN[i]}"${i === nr ? ' aria-current="step"' : ''}><span class="nr" aria-hidden="true">${i + 1}</span><span>${x.name}</span></a>`).join('')}</nav>` + s.html() +
      `<div class="nav-unten">${nr > 0 ? link(nr - 1, 'btn ghost', 'Zurück') : '<span></span>'}${nr < steps.length - 1 ? link(nr + 1, 'btn', 'Weiter') : '<span></span>'}</div>`;
    s.bind();
    if (fokus) { const h = mount.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } if (mount.scrollIntoView) mount.scrollIntoView(); }
  }
  addEventListener('hashchange', () => render(true));
  render();
})();
