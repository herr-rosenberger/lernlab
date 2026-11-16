(() => {
  const $ = id => document.getElementById(id);
  const fmt = (v, d = 3) => Number.isFinite(v) ? (+v.toFixed(d)).toLocaleString('de-DE') : '–';
  const tx = (v, d = 3) => fmt(v, d).replace(',', '{,}');
  const SUB = '₀₁₂₃', S = { typ: 'reihe', n: 2, U: 12, R: [20, 30, 50], hide: false, modus: 'entdecken' };
  const NAME = { reihe: 'Reihenschaltung', parallel: 'Parallelschaltung', gemischt: 'Gemischte Schaltung' };

  function calc() {
    const { typ, U } = S, n = typ === 'gemischt' ? 3 : S.n, R = S.R.slice(0, n); let Rg, I, Ui, Ii, R23 = null;
    if (typ === 'reihe') { Rg = R.reduce((a, b) => a + b, 0); I = U / Rg; Ui = R.map(r => I * r); Ii = R.map(() => I); }
    else if (typ === 'parallel') { Ii = R.map(r => U / r); I = Ii.reduce((a, b) => a + b, 0); Rg = U / I; Ui = R.map(() => U); }
    else { R23 = R[1] * R[2] / (R[1] + R[2]); Rg = R[0] + R23; I = U / Rg; const U23 = I * R23; Ui = [I * R[0], U23, U23]; Ii = [I, U23 / R[1], U23 / R[2]]; }
    return { n, R, U, Rg, I, Ui, Ii, R23 };
  }

  // ---------- Schaltbild ----------
  const wireW = (i, hide) => hide ? 4 : 2.5 + Math.min(i / 2, 1) * 7;
  const ln = (x1, y1, x2, y2, i, hide) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--accent)" stroke-width="${wireW(i, hide)}" stroke-linecap="round"/>`;
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--text)"/>`;
  const tx2 = (x, y, t, a = 'middle', w = 400) => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="15" font-weight="${w}" fill="var(--text)" font-family="inherit">${t}</text>`;
  function schaltbild(c) {
    const h = S.hide, q = v => h ? '?' : v, T = 70, B = 280, X0 = 60, MID = 175, p = [];
    const name = i => `R${SUB[i + 1]} = ${fmt(c.R[i], 0)} Ω`, uu = i => `U${SUB[i + 1]} = ${q(fmt(c.Ui[i], 2))} V`, ii = i => `I${SUB[i + 1]} = ${q(fmt(c.Ii[i]))} A`;
    const resH = (cx, i) => `<rect x="${cx - 34}" y="${T - 14}" width="68" height="28" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/>` + tx2(cx, T - 24, name(i), 'middle', 700) + tx2(cx, T + 38, uu(i)) + tx2(cx, T + 57, ii(i));
    const resV = (cx, i) => `<rect x="${cx - 14}" y="${MID - 34}" width="28" height="68" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/>` + tx2(cx + 26, MID - 14, name(i), 'start', 700) + tx2(cx + 26, MID + 6, uu(i), 'start') + tx2(cx + 26, MID + 25, ii(i), 'start');
    let xr;
    if (S.typ === 'reihe') {
      xr = 720; const xs = Array.from({ length: c.n }, (_, i) => Math.round(X0 + (xr - X0) * (i + 1) / (c.n + 1)));
      let cur = X0; xs.forEach((x, i) => { p.push(ln(cur, T, x - 34, T, c.I, h), resH(x, i)); cur = x + 34; });
      p.push(ln(cur, T, xr, T, c.I, h), ln(xr, T, xr, B, c.I, h), ln(X0, B, xr, B, c.I, h));
    } else {
      const bx = S.typ === 'parallel' ? (c.n === 2 ? [300, 560] : [250, 420, 590]) : [430, 640], n = bx.length; xr = bx[n - 1];
      const branchI = S.typ === 'parallel' ? c.Ii : [c.Ii[1], c.Ii[2]];
      if (S.typ === 'gemischt') { p.push(ln(X0, T, 230 - 34, T, c.I, h), resH(230, 0), ln(230 + 34, T, bx[0], T, c.I, h)); }
      else p.push(ln(X0, T, bx[0], T, c.I, h));
      let rest = c.I; bx.forEach((x, k) => {
        const Ib = branchI[k], idx = S.typ === 'parallel' ? k : k + 1;
        if (k > 0) p.push(ln(bx[k - 1], T, x, T, rest, h));
        p.push(ln(x, T, x, MID - 34, Ib, h), resV(x, idx), ln(x, MID + 34, x, B, Ib, h));
        rest -= Ib;
      });
      // untere Sammelleitung: Strom wächst von rechts nach links
      let acc = 0; for (let k = n - 1; k >= 0; k--) { acc += branchI[k]; p.push(ln(k === 0 ? X0 : bx[k - 1], B, bx[k], B, acc, h)); }
      bx.slice(0, n - 1).forEach(x => p.push(dot(x, T), dot(x, B)));
    }
    // Spannungsquelle links
    p.push(ln(X0, T, X0, MID - 12, c.I, h), ln(X0, MID + 12, X0, B, c.I, h),
      `<line x1="${X0 - 20}" y1="${MID - 12}" x2="${X0 + 20}" y2="${MID - 12}" stroke="var(--text)" stroke-width="3"/><line x1="${X0 - 11}" y1="${MID + 12}" x2="${X0 + 11}" y2="${MID + 12}" stroke="var(--text)" stroke-width="6"/>`,
      tx2(X0 - 30, MID - 6, '+', 'end', 700), tx2(X0 + 30, MID + 6, `U = ${fmt(c.U, 1)} V`, 'start', 700), tx2(X0 + 30, MID + 28, `I = ${q(fmt(c.I))} A`, 'start'),
      `<path d="M96 ${T - 9}L114 ${T}L96 ${T + 9}Z" fill="var(--accent)"/>`);
    return `<svg viewBox="0 0 780 330" role="img" aria-label="${esc(beschreibung(c))}">${p.join('')}</svg>`;
  }
  const esc = s => String(s).replace(/"/g, '&quot;');
  const beschreibung = c => `${NAME[S.typ]} mit ${c.n} Widerständen an ${fmt(c.U, 1)} V.` + (S.hide ? ' Die Ergebnisse sind ausgeblendet.' : ` Gesamtwiderstand ${fmt(c.Rg, 1)} Ω, Gesamtstromstärke ${fmt(c.I)} A.`);

  // ---------- Tabelle und Rechenweg ----------
  function tabelle(c) {
    const q = v => S.hide ? '?' : v;
    return `<table class="tabelle"><thead><tr><th scope="col">Bauteil</th><th scope="col">Widerstand</th><th scope="col">Spannung</th><th scope="col">Stromstärke</th></tr></thead><tbody>` +
      c.R.map((r, i) => `<tr><th scope="row">R${SUB[i + 1]}</th><td>${fmt(r, 0)} Ω</td><td>${q(fmt(c.Ui[i], 2))} V</td><td>${q(fmt(c.Ii[i]))} A</td></tr>`).join('') +
      `<tr class="summe"><th scope="row">gesamt</th><td>${q(fmt(c.Rg, 2))} Ω</td><td>${fmt(c.U, 1)} V</td><td>${q(fmt(c.I))} A</td></tr></tbody></table>`;
  }
  function weg(c) {
    if (S.hide) return '<p class="muted">Rechne zuerst selbst. Blende die Ergebnisse danach wieder ein, dann siehst du hier den Rechenweg.</p>';
    const { R, U, I, Rg, Ui, Ii } = c, o = '\\,\\Omega', V = '\\,\\mathrm{V}', A = '\\,\\mathrm{A}', L = [];
    const r = i => `${tx(R[i], 0)}${o}`;
    if (S.typ === 'reihe') {
      L.push(`Gesamtwiderstand: $R_{ges}=${R.map((_, i) => `R_${i + 1}`).join('+')}=${R.map((_, i) => r(i)).join('+')}=${tx(Rg, 2)}${o}$`,
        `Stromstärke (überall gleich): $I=\\dfrac{U}{R_{ges}}=\\dfrac{${tx(U, 1)}${V}}{${tx(Rg, 2)}${o}}=${tx(I)}${A}$`,
        ...R.map((_, i) => `Spannung an $R_${i + 1}$: $U_${i + 1}=R_${i + 1}\\cdot I=${r(i)}\\cdot${tx(I)}${A}=${tx(Ui[i], 2)}${V}$`),
        `Kontrolle: $U=${Ui.map((_, i) => `U_${i + 1}`).join('+')}=${Ui.map(u => tx(u, 2) + V).join('+')}=${tx(Ui.reduce((a, b) => a + b, 0), 2)}${V}$`);
    } else if (S.typ === 'parallel') {
      L.push(`An jedem Widerstand liegt die volle Spannung an: $U_1=U_2=\\dots=${tx(U, 1)}${V}$`,
        ...R.map((_, i) => `Stromstärke durch $R_${i + 1}$: $I_${i + 1}=\\dfrac{U}{R_${i + 1}}=\\dfrac{${tx(U, 1)}${V}}{${r(i)}}=${tx(Ii[i])}${A}$`),
        `Knotenregel: $I=${Ii.map((_, i) => `I_${i + 1}`).join('+')}=${Ii.map(x => tx(x) + A).join('+')}=${tx(I)}${A}$`,
        `Gesamtwiderstand: $R_{ges}=\\dfrac{U}{I}=\\dfrac{${tx(U, 1)}${V}}{${tx(I)}${A}}=${tx(Rg, 2)}${o}$`);
    } else {
      L.push(`$R_1$ liegt in Reihe zu den parallelen Widerständen $R_2$ und $R_3$.`,
        `Ersatzwiderstand der Parallelschaltung (Vertiefung): $R_{23}=\\dfrac{R_2\\cdot R_3}{R_2+R_3}=\\dfrac{${r(1)}\\cdot${r(2)}}{${r(1)}+${r(2)}}=${tx(c.R23, 2)}${o}$`,
        `Gesamtwiderstand: $R_{ges}=R_1+R_{23}=${r(0)}+${tx(c.R23, 2)}${o}=${tx(Rg, 2)}${o}$`,
        `Stromstärke durch $R_1$ (= Gesamtstromstärke): $I=\\dfrac{U}{R_{ges}}=\\dfrac{${tx(U, 1)}${V}}{${tx(Rg, 2)}${o}}=${tx(I)}${A}$`,
        `Spannung an $R_1$: $U_1=R_1\\cdot I=${r(0)}\\cdot${tx(I)}${A}=${tx(Ui[0], 2)}${V}$`,
        `Spannung an $R_2$ und $R_3$: $U_{23}=U-U_1=${tx(U, 1)}${V}-${tx(Ui[0], 2)}${V}=${tx(Ui[1], 2)}${V}$`,
        `Stromstärken: $I_2=\\dfrac{U_{23}}{R_2}=${tx(Ii[1])}${A}$ und $I_3=\\dfrac{U_{23}}{R_3}=${tx(Ii[2])}${A}$`,
        `Kontrolle: $I_2+I_3=${tx(Ii[1])}${A}+${tx(Ii[2])}${A}=${tx(Ii[1] + Ii[2])}${A}=I_1$`);
    }
    return L.map(x => `<p>${x}</p>`).join('');
  }

  // ---------- Steuerung ----------
  const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Entdecken: Messreihen aufnehmen und Vermutungen testen ----------
  const T = LernLab.term;
  const GR = { R1: ['R₁', 'Ω', 0], R2: ['R₂', 'Ω', 0], R3: ['R₃', 'Ω', 0], Rges: ['R_ges', 'Ω', 2], U: ['U', 'V', 1], U1: ['U₁', 'V', 2], U2: ['U₂', 'V', 2], I: ['I', 'A', 3], I1: ['I₁', 'A', 3], I2: ['I₂', 'A', 3] };
  const GLEICH = ['Miss mindestens vier Kombinationen, auch mit zwei gleich großen Widerständen.'];
  const AUFTR = [
    { id: 'e1', titel: '1 Reihenschaltung: Gesamtwiderstand', typ: 'reihe', n: 2, uVar: false, spalten: ['R1', 'R2', 'Rges'], ziel: 'Rges',
      text: 'Zwei Widerstände liegen in Reihe an 12 V. Die App bestimmt den Gesamtwiderstand wie im Experiment aus Spannung und Stromstärke. Stelle verschiedene Werte ein und übernimm jede Messung in die Tabelle.',
      schritte: [...GLEICH, 'Vergleiche R_ges mit R₁ und R₂.', 'Stelle eine Vermutung als Gleichung auf und teste sie.'],
      tipps: ['Wähle Werte, mit denen du gut rechnen kannst, zum Beispiel 10, 20 und 30 Ω.', 'Ist R_ges größer oder kleiner als R₁ und R₂? Um wie viel?', 'Teste die Gleichung Rges = R1 + R2.'] },
    { id: 'e2', titel: '2 Parallelschaltung: Gesamtwiderstand (Vertiefung)', typ: 'parallel', n: 2, uVar: false, spalten: ['R1', 'R2', 'Rges'], ziel: 'Rges',
      text: 'Zwei Widerstände liegen parallel an 12 V. Der Gesamtwiderstand wird wieder aus Spannung und Stromstärke bestimmt. Diese Untersuchung geht über den Lehrplan hinaus.',
      schritte: [...GLEICH, 'Vergleiche R_ges mit dem kleineren der beiden Widerstände.', 'Untersuche, was bei zwei gleich großen Widerständen geschieht.', 'Stelle eine Vermutung als Gleichung auf und teste sie.'],
      tipps: ['Ist R_ges größer, kleiner oder gleich dem kleineren Einzelwiderstand?', 'Bei zwei gleichen Widerständen R: Wie groß ist R_ges im Verhältnis zu R?', 'Teste Rges = R1*R2/(R1+R2). Du kannst auch 1/Rges = 1/R1 + 1/R2 testen.'] },
    { id: 'e3', titel: '3 Reihenschaltung: Spannungen', typ: 'reihe', n: 2, uVar: true, spalten: ['U', 'R1', 'R2', 'U1', 'U2'], ziel: 'U',
      text: 'Zwei Widerstände liegen in Reihe. Du kannst jetzt auch die Spannung U ändern. Miss die Teilspannungen U₁ und U₂.',
      schritte: ['Miss mindestens vier Kombinationen mit verschiedenen Werten für U, R₁ und R₂.', 'Was ergibt U₁ + U₂? Vergleiche mit U.', 'Vergleiche das Verhältnis U₁ : U₂ mit dem Verhältnis R₁ : R₂.'],
      tipps: ['Addiere U₁ und U₂ in jeder Zeile.', 'Teile U₁ durch U₂ und R₁ durch R₂. Vergleiche die Ergebnisse.', 'Teste U = U1 + U2 und U1/U2 = R1/R2.'] },
    { id: 'e4', titel: '4 Parallelschaltung: Stromstärken', typ: 'parallel', n: 2, uVar: true, spalten: ['U', 'R1', 'R2', 'I1', 'I2', 'I'], ziel: 'I',
      text: 'Zwei Widerstände liegen parallel. Du kannst auch die Spannung U ändern. Miss die Stromstärken I₁ und I₂ in den Zweigen und die Gesamtstromstärke I.',
      schritte: ['Miss mindestens vier Kombinationen mit verschiedenen Werten für U, R₁ und R₂.', 'Was ergibt I₁ + I₂? Vergleiche mit I.', 'Vergleiche das Verhältnis I₁ : I₂ mit dem Verhältnis R₁ : R₂ und mit R₂ : R₁.'],
      tipps: ['Addiere I₁ und I₂ in jeder Zeile.', 'Teile I₁ durch I₂. Vergleiche mit R₁ : R₂ und mit R₂ : R₁.', 'Teste I = I1 + I2 und I1/I2 = R2/R1. Auch I1 = U/R1 lohnt sich.'] },
    { id: 'e5', titel: '5 Gemischte Schaltung: anwenden (Vertiefung)', typ: 'gemischt', n: 3, uVar: false, spalten: ['R1', 'R2', 'R3', 'Rges'], ziel: 'Rges',
      text: 'R₁ liegt in Reihe zu R₂ und R₃, die parallel liegen. Nutze deine Regeln aus Auftrag 1 und 2.',
      schritte: ['Setze zuerst R₂ = R₃ und überlege, wie groß der Ersatzwiderstand der beiden ist.', 'Stelle dann eine Gleichung für R_ges auf und teste sie mit mehreren Messungen.'],
      tipps: ['Die parallelen Widerstände R₂ und R₃ wirken zusammen wie ein einzelner Widerstand.', 'Dieser Ersatzwiderstand liegt in Reihe zu R₁.', 'Teste Rges = R1 + R2*R3/(R2+R3).'] }
  ];
  const E = { aktiv: 'e1', rows: {}, hyp: {}, regel: {}, tipp: {} };
  AUFTR.forEach(a => { E.rows[a.id] = []; E.hyp[a.id] = { a: a.ziel, b: '' }; E.regel[a.id] = ''; E.tipp[a.id] = -1; });
  const akt = () => AUFTR.find(a => a.id === E.aktiv);
  const mess = () => { const c = calc(); return { R1: c.R[0], R2: c.R[1], R3: c.R[2], Rges: c.Rg, U: c.U, U1: c.Ui[0], U2: c.Ui[1], I: c.I, I1: c.Ii[0], I2: c.Ii[1] }; };
  const zelle = (k, v) => fmt(v, GR[k][2]);

  // Term der Schülerin auswerten: Größen aus der Tabelle werden durch die Messwerte der Zeile ersetzt
  function wert(txt, row, erlaubt) {
    const ids = new Map(erlaubt.map(k => [k.toLowerCase(), k]));
    const ersetzt = String(txt).replace(/[A-Za-zÄÖÜäöü]+\d*/g, tok => {
      const k = ids.get(tok.toLowerCase()); if (k) return '(' + row[k] + ')';
      if (/^(sqrt|abs|pi)$/i.test(tok)) return tok;
      throw new Error(`„${tok}“ gibt es in dieser Tabelle nicht. Verfügbar: ${erlaubt.join(', ')}.`);
    });
    const v = T.parse(ersetzt)(0); if (!Number.isFinite(v)) throw new Error('Das Ergebnis ist keine Zahl.'); return v;
  }
  function tabEnt(a) {
    const rows = E.rows[a.id], h = E.hyp[a.id], hasT = h.a.trim() && h.b.trim(); let fehler = '', gleich = 0;
    const zeilen = rows.map(r => { let A = '', B = '', m = '';
      if (hasT) { try { const va = wert(h.a, r, a.spalten), vb = wert(h.b, r, a.spalten); A = fmt(va, 4); B = fmt(vb, 4); const ok = Math.abs(va - vb) <= 1e-6 * (1 + Math.abs(va)); m = ok ? '✓ gleich' : '✗ verschieden'; if (ok) gleich++; } catch (e) { fehler = e.message; } }
      return `<tr>${a.spalten.map(k => `<td>${zelle(k, r[k])}</td>`).join('')}${hasT ? `<td>${A}</td><td>${B}</td><td>${m}</td>` : ''}</tr>`; }).join('');
    const tabelle = rows.length ? `<table class="tabelle"><thead><tr>${a.spalten.map(k => `<th scope="col">${GR[k][0]} in ${GR[k][1]}</th>`).join('')}${hasT ? '<th scope="col">linke Seite</th><th scope="col">rechte Seite</th><th scope="col">Vergleich</th>' : ''}</tr></thead><tbody>${zeilen}</tbody></table>` : '<p class="muted">Noch keine Messwerte. Stelle Werte ein und übernimm die Messung.</p>';
    let msg = '';
    if (fehler) msg = `<p class="feedback nok">${escH(fehler)}</p>`;
    else if (!hasT) msg = '<p class="muted">Schreibe links und rechts je einen Term, dann vergleicht die Tabelle beide Seiten für jede Messung.</p>';
    else if (!rows.length) msg = '<p class="muted">Übernimm zuerst Messwerte, dann kann ich deine Gleichung prüfen.</p>';
    else if (gleich === rows.length) msg = rows.length >= 4 ? `<p class="feedback ok"><strong>Deine Gleichung stimmt bei allen ${rows.length} Messungen.</strong> Formuliere sie jetzt als Regel in Worten.</p>` : `<p class="feedback ok">Deine Gleichung stimmt bei allen bisherigen Messungen. Miss noch weitere, am besten mindestens vier, um sicher zu sein.</p>`;
    else msg = `<p class="feedback nok"><strong>Die Gleichung stimmt bei ${gleich} von ${rows.length} Messungen.</strong> Schau dir die Zeilen mit „verschieden“ an. Was ist dort anders?</p>`;
    return { tabelle, msg };
  }
  function renderTab() { const t = tabEnt(akt()); $('mtab').innerHTML = t.tabelle; $('hypErg').innerHTML = t.msg; }
  function updateMess() {
    const el = $('messung'); if (!el) return; const a = akt(), m = mess();
    el.innerHTML = `<ul class="messwerte">${a.spalten.map(k => `<li><span>${GR[k][0]}</span><strong>${zelle(k, m[k])} ${GR[k][1]}</strong></li>`).join('')}</ul>` +
      (a.spalten.includes('Rges') ? `<p class="muted">Gemessen wie im Experiment: R_ges = U : I = ${fmt(m.U, 1)} V : ${fmt(m.I)} A = <strong>${fmt(m.Rges, 2)} Ω</strong></p>` : '');
  }
  function ueberblick() {
    const teile = AUFTR.filter(a => E.rows[a.id].length || E.regel[a.id].trim()).map(a => { const h = E.hyp[a.id];
      return `<h3>${escH(a.titel)}</h3>${tabEnt(a).tabelle}` + (h.b.trim() ? `<p>Meine Gleichung: <strong>${escH(h.a)} = ${escH(h.b)}</strong></p>` : '') + (E.regel[a.id].trim() ? `<p>Meine Regel: ${escH(E.regel[a.id].trim())}</p>` : ''); });
    return '<h2>Mein Entdeckerblatt</h2>' + (teile.join('') || '<p>Noch keine Messungen.</p>');
  }
  function renderEnt() {
    const a = akt(), h = E.hyp[a.id];
    $('entdecken').innerHTML = `<h2>${escH(a.titel)}</h2><p>${escH(a.text)}</p><ol>${a.schritte.map(x => `<li>${escH(x)}</li>`).join('')}</ol>
      <div class="aktionen"><button class="btn ghost" type="button" id="tipp">Tipp</button></div><div id="tippOut" aria-live="polite"></div>
      <h3>Messung</h3><div id="messung" aria-live="polite"></div>
      <div class="aktionen"><button class="btn" type="button" id="uebernehmen">Messwert in die Tabelle übernehmen</button><button class="btn ghost" type="button" id="zeileweg">Letzte Zeile löschen</button><button class="btn ghost" type="button" id="tabweg">Tabelle leeren</button></div>
      <div id="mtab"></div>
      <h3>Deine Vermutung als Gleichung</h3>
      <p class="muted">Schreibe die Größen so: ${a.spalten.join(', ')}. Erlaubt sind + − * / und Klammern, zum Beispiel R1*R2/(R1+R2).</p>
      <div class="gleichung field"><label class="visually-hidden" for="hypA">Linke Seite</label><input id="hypA" type="text" autocomplete="off" spellcheck="false"><span aria-hidden="true">=</span><label class="visually-hidden" for="hypB">Rechte Seite</label><input id="hypB" type="text" autocomplete="off" spellcheck="false" placeholder="dein Term"></div>
      <div id="hypErg" aria-live="polite"></div>
      <div class="field"><label for="regel"><strong>Meine Regel in Worten</strong></label><textarea id="regel" rows="3" placeholder="Wenn …, dann …"></textarea></div>
      <div class="aktionen"><button class="btn ghost" type="button" id="drucken">Entdeckerblatt drucken</button></div>`;
    $('hypA').value = h.a; $('hypB').value = h.b; $('regel').value = E.regel[a.id];
    const tipp = () => { const i = E.tipp[a.id]; $('tippOut').innerHTML = i < 0 ? '' : `<p class="hint"><strong>Tipp ${i + 1} von ${a.tipps.length}:</strong> ${escH(a.tipps[i])}</p>`; }; tipp();
    $('tipp').onclick = () => { E.tipp[a.id] = Math.min(E.tipp[a.id] + 1, a.tipps.length - 1); tipp(); };
    $('uebernehmen').onclick = () => { if (E.rows[a.id].length >= 12) return; E.rows[a.id].push(mess()); renderTab(); };
    $('zeileweg').onclick = () => { E.rows[a.id].pop(); renderTab(); };
    $('tabweg').onclick = () => { E.rows[a.id] = []; renderTab(); };
    $('hypA').oninput = e => { h.a = e.target.value; renderTab(); }; $('hypB').oninput = e => { h.b = e.target.value; renderTab(); };
    $('regel').oninput = e => { E.regel[a.id] = e.target.value; };
    $('drucken').onclick = () => { $('ueberblick').innerHTML = ueberblick(); print(); };
    updateMess(); renderTab();
  }
  function waehle(id) {
    E.aktiv = id; const a = akt(); S.typ = a.typ; S.n = a.n; if (!a.uVar) { S.U = 12; $('U').value = 12; }
    renderEnt(); draw();
  }
  function modus(m) {
    S.modus = m; const ent = m === 'entdecken';
    ['frei', 'freiSteuer', 'hideWrap', 'zufallWrap'].forEach(id => $(id).hidden = ent);
    $('entdecken').hidden = !ent; $('entdAuftraege').hidden = !ent;
    document.querySelectorAll('[data-modus]').forEach(b => b.setAttribute('aria-pressed', b.dataset.modus === m));
    if (ent) { S.hide = false; $('hide').checked = false; waehle(E.aktiv); } else draw();
  }

  // ---------- Zeichnen und Steuerung ----------
  function draw() {
    const c = calc(), gem = S.typ === 'gemischt', ent = S.modus === 'entdecken';
    ['U', 'R1', 'R2', 'R3'].forEach(id => { const o = $('o' + id); if (o) o.textContent = id === 'U' ? fmt(S.U, 1) + ' V' : fmt(S.R[+id[1] - 1], 0) + ' Ω'; });
    $('f3').hidden = c.n < 3; $('fU').hidden = ent && !akt().uVar;
    $('bild').innerHTML = schaltbild(c);
    if (ent) updateMess();
    else {
      $('nGroup').hidden = gem; $('hinweisGem').hidden = !gem;
      $('tabelle').innerHTML = tabelle(c); $('weg').innerHTML = weg(c);
      document.querySelectorAll('[data-typ]').forEach(b => b.setAttribute('aria-pressed', b.dataset.typ === S.typ));
      document.querySelectorAll('[data-n]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.n === S.n));
      if (window.LernLab && LernLab.mathe) LernLab.mathe($('weg'));
    }
    document.querySelectorAll('[data-auf]').forEach(b => b.setAttribute('aria-pressed', b.dataset.auf === E.aktiv));
  }
  $('auftraege').innerHTML = AUFTR.map(a => `<button type="button" class="auf" data-auf="${a.id}" aria-pressed="false">${escH(a.titel)}</button>`).join('');
  document.querySelectorAll('[data-auf]').forEach(b => b.onclick = () => waehle(b.dataset.auf));
  document.querySelectorAll('[data-modus]').forEach(b => b.onclick = () => modus(b.dataset.modus));
  document.querySelectorAll('[data-typ]').forEach(b => b.onclick = () => { S.typ = b.dataset.typ; draw(); });
  document.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { S.n = +b.dataset.n; draw(); });
  $('U').oninput = e => { S.U = +e.target.value; draw(); };
  ['R1', 'R2', 'R3'].forEach((id, i) => $(id).oninput = e => { S.R[i] = +e.target.value; draw(); });
  $('hide').onchange = e => { S.hide = e.target.checked; draw(); };
  $('zufall').onclick = () => {
    const w = [10, 20, 30, 40, 50, 60, 80, 100], pick = () => w[Math.random() * w.length | 0];
    S.U = [3, 6, 9, 12][Math.random() * 4 | 0]; S.R = [pick(), pick(), pick()];
    ['U', 'R1', 'R2', 'R3'].forEach((id, i) => $(id).value = i ? S.R[i - 1] : S.U); draw();
  };
  $('U').value = S.U; modus('entdecken');
})();
