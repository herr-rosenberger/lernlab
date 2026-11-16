(() => {
  const $ = id => document.getElementById(id);
  const fmt = (v, d) => Number.isFinite(v) ? v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const BT = {
    rA: { name: 'Widerstand A', label: 'R = 50 Ω', R: 50, farbe: '--accent', form: 'kreis', sym: '●' },
    rB: { name: 'Widerstand B', label: 'R = 100 Ω', R: 100, farbe: '--f-mathematik', form: 'quadrat', sym: '■' },
    lampe: { name: 'Glühlampe', label: '6 V / 0,1 A', farbe: '--f-chemie', form: 'dreieck', sym: '▲' }
  };
  // Zustand: bt = Bauteil, a/v = Anschluss von Amperemeter/Voltmeter (null, 'reihe', 'parallel'), an = Netzgerät eingeschaltet
  const S = { bt: 'rA', an: false, U: 0, a: null, v: null, rows: { rA: [], rB: [], lampe: [] }, showR: false, linie: true, defekt: false, meld: ['', ''], antw: {} };
  const P = LernLab.plot($('c'), 800, 440);

  // Physik: Widerstände sind ohmsch, die Glühlampe nicht (Widerstand wächst mit der Temperatur)
  const strom = (bt, U) => bt === 'lampe' ? (S.defekt ? 0 : 0.1 * Math.pow(U / 6, 0.6)) : U / BT[bt].R;
  const zustand = () => !S.a || !S.v ? 'offen' : S.a === 'parallel' ? 'kurzschluss' : S.v === 'reihe' ? 'vreihe' : 'ok';
  function werte() {
    const z = zustand(); if (!S.an || z === 'offen') return { A: null, V: null, z };
    if (z === 'ok') return { A: strom(S.bt, S.U), V: S.U, z };
    return { A: 0, V: S.U, z };   // Voltmeter in Reihe: es fließt (fast) kein Strom, das Voltmeter zeigt die Quellenspannung
  }
  const meld = (text, art = '') => { S.meld = [text, art]; };

  // ---------- Schaltbild des Aufbaus ----------
  function aufbau() {
    const w = werte(), T = 60, B = 240, XR = 660, p = [], tx = (x, y, t, a = 'middle', s = 15, wt = 400) => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="${s}" font-weight="${wt}" fill="var(--text)" font-family="inherit">${t}</text>`;
    const ln = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/>`;
    const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--text)"/>`;
    const meter = (x, y, b, wert, frei) => `<circle cx="${x}" cy="${y}" r="26" fill="var(--surface)" stroke="var(--text)" stroke-width="3"${frei ? ' stroke-dasharray="6 5"' : ''}/>` + tx(x, y + 8, b, 'middle', 22, 700) + (wert !== undefined ? `<rect x="${x - (wert.length * 4.6 + 8)}" y="${y + 32}" width="${wert.length * 9.2 + 16}" height="24" rx="5" fill="var(--surface)"/>` + tx(x, y + 49, wert, 'middle', 15, 600) : '');
    const ablesA = w.A === null ? '–' : fmt(w.A, 3) + ' A', ablesV = w.V === null ? '–' : fmt(w.V, 2) + ' V';
    // Rahmen
    p.push(ln(90, T, XR, T), ln(90, B, XR, B), ln(XR, T, XR, B), ln(90, T, 90, 100), ln(90, 200, 90, B));
    // Netzgerät
    p.push(`<rect x="40" y="100" width="100" height="100" rx="8" fill="var(--surface)" stroke="var(--text)" stroke-width="3"/>` + tx(90, 122, 'Netzgerät', 'middle', 14, 700) +
      `<rect x="54" y="132" width="72" height="30" rx="4" fill="var(--bg)" stroke="var(--muted)" stroke-width="2"/>` + tx(90, 154, fmt(S.an ? S.U : 0, 1) + ' V', 'middle', 18, 700) + tx(90, 186, S.an ? 'EIN' : 'AUS', 'middle', 14, 700));
    // Messgeräte: in Reihe auf der oberen Leitung, parallel als Zweig zum Bauteil
    const par = { v: 580, a: S.v === 'parallel' ? 500 : 580 };
    if (S.a === 'reihe') p.push(meter(260, T, 'A', ablesA)); if (S.v === 'reihe') p.push(meter(400, T, 'V', ablesV));
    [['a', 'A', ablesA], ['v', 'V', ablesV]].forEach(([k, b, a]) => { if (S[k] === 'parallel') p.push(ln(par[k], T, par[k], B), dot(par[k], T), dot(par[k], B), meter(par[k], 150, b, a)); });
    if (!S.a) p.push(meter(230, 300, 'A', undefined, true), tx(230, 346, 'Amperemeter', 'middle', 14));
    if (!S.v) p.push(meter(400, 300, 'V', undefined, true), tx(400, 346, 'Voltmeter', 'middle', 14));
    // Bauteil
    if (S.bt === 'lampe') p.push(`<circle cx="${XR}" cy="150" r="28" fill="var(--surface)" stroke="var(--text)" stroke-width="3"/><path d="M${XR - 20} 130L${XR + 20} 170M${XR + 20} 130L${XR - 20} 170" stroke="var(--text)" stroke-width="3"/>`);
    else p.push(`<rect x="${XR - 15}" y="114" width="30" height="72" fill="var(--surface)" stroke="var(--text)" stroke-width="3"/>`);
    p.push(tx(XR + 38, 146, esc(BT[S.bt].name), 'start', 15, 700), tx(XR + 38, 166, BT[S.bt].label, 'start'));
    const beschr = `Messaufbau mit ${BT[S.bt].name}. Amperemeter: ${S.a === 'reihe' ? 'in Reihe' : S.a === 'parallel' ? 'parallel zum Bauteil' : 'nicht angeschlossen'}. Voltmeter: ${S.v === 'parallel' ? 'parallel zum Bauteil' : S.v === 'reihe' ? 'in Reihe' : 'nicht angeschlossen'}. Netzgerät ${S.an ? 'an, ' + fmt(S.U, 1) + ' V' : 'aus'}.`;
    return `<svg viewBox="0 0 780 ${S.a && S.v ? 290 : 370}" role="img" aria-label="${esc(beschr)}">${p.join('')}</svg>`;
  }

  // ---------- Tabelle, Kennlinie, Auswertung ----------
  function tabelle() {
    const rows = S.rows[S.bt];
    if (!rows.length) return `<p class="muted">Für ${esc(BT[S.bt].name)} gibt es noch keine Messwerte.</p>`;
    return `<table class="tabelle"><caption class="muted">Messreihe: ${esc(BT[S.bt].name)}</caption><thead><tr><th scope="col">Nr.</th><th scope="col">U in V</th><th scope="col">I in A</th>${S.showR ? '<th scope="col">R = U : I in Ω</th>' : ''}</tr></thead><tbody>` +
      rows.map((r, i) => `<tr><th scope="row">${i + 1}</th><td>${fmt(r.U, 2)}</td><td>${fmt(r.I, 3)}</td>${S.showR ? `<td>${r.I > 0 ? fmt(r.U / r.I, 1) : '–'}</td>` : ''}</tr>`).join('') + '</tbody></table>';
  }
  function kennlinie() {
    const alle = Object.values(S.rows).flat(), imax = Math.max(0.1, ...alle.map(r => r.I)), ymax = Math.ceil(imax * 1.15 * 20) / 20;
    P.view(0, 12.5, 0, ymax); P.clear(); P.axes();
    const ctx = P.ctx; ctx.save(); ctx.fillStyle = P.farbe('--text'); ctx.font = '700 14px sans-serif'; ctx.strokeStyle = P.farbe('--surface'); ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.textAlign = 'left'; ctx.strokeText('I in A', P.X(0) + 12, 26); ctx.fillText('I in A', P.X(0) + 12, 26); ctx.textAlign = 'right'; ctx.strokeText('U in V', P.X(12.5) - 8, P.Y(0) - 10); ctx.fillText('U in V', P.X(12.5) - 8, P.Y(0) - 10); ctx.restore();
    Object.entries(S.rows).forEach(([k, rows]) => {
      if (!rows.length) return; const f = P.farbe(BT[k].farbe), srt = [...rows].sort((a, b) => a.U - b.U);
      if (S.linie) { ctx.save(); ctx.strokeStyle = f; ctx.lineWidth = 2; ctx.beginPath(); srt.forEach((r, i) => i ? ctx.lineTo(P.X(r.U), P.Y(r.I)) : ctx.moveTo(P.X(r.U), P.Y(r.I))); ctx.stroke(); ctx.restore(); }
      srt.forEach(r => { const x = P.X(r.U), y = P.Y(r.I); ctx.save(); ctx.fillStyle = f; ctx.beginPath();
        if (BT[k].form === 'kreis') ctx.arc(x, y, 6, 0, 7); else if (BT[k].form === 'quadrat') ctx.rect(x - 6, y - 6, 12, 12); else { ctx.moveTo(x, y - 8); ctx.lineTo(x + 7, y + 6); ctx.lineTo(x - 7, y + 6); ctx.closePath(); }
        ctx.fill(); ctx.restore(); });
    });
    $('legende').innerHTML = Object.entries(BT).filter(([k]) => S.rows[k].length).map(([k, b]) => `<li><span style="color:var(--${b.farbe.slice(2)})" aria-hidden="true">${b.sym}</span> ${esc(b.name)} (${S.rows[k].length} Messwerte)</li>`).join('') || '<li class="muted">Noch keine Messwerte im Diagramm.</li>';
    $('c').setAttribute('aria-label', `Kennlinien-Diagramm mit ${alle.length} Messpunkten. Waagerecht U in V, senkrecht I in A.`);
  }
  const FRAGEN = {
    ohmsch: [
      { id: 'form', frage: 'Welche Form hat die Kennlinie dieses Widerstands?', o: ['Eine nach rechts flacher werdende Kurve', 'Eine Gerade durch den Ursprung', 'Eine nach oben gekrümmte Kurve', 'Eine waagerechte Gerade'], r: 1, e: 'Verdoppelt man die Spannung, verdoppelt sich die Stromstärke: I ist proportional zu U.' },
      { id: 'R', frage: 'Schalte „R anzeigen“ ein. Was fällt bei R = U : I auf?', o: ['R wird mit wachsender Spannung größer.', 'R ist in allen Zeilen (fast) gleich groß.', 'R wird mit wachsender Spannung kleiner.', 'R ist in jeder Zeile null.'], r: 1, e: 'Das ist typisch für einen ohmschen Widerstand: R = U : I ist konstant und stimmt mit dem Wert am Bauteil überein.' }],
    lampe: [
      { id: 'form', frage: 'Welche Form hat die Kennlinie der Glühlampe?', o: ['Eine Gerade durch den Ursprung', 'Eine Kurve, die nach rechts flacher wird', 'Eine Kurve, die nach rechts steiler wird', 'Eine waagerechte Gerade'], r: 1, e: 'Die Stromstärke wächst langsamer als die Spannung. Die Kennlinie ist keine Gerade.' },
      { id: 'R', frage: 'Schalte „R anzeigen“ ein. Wie verändert sich R = U : I bei wachsender Spannung?', o: ['R bleibt gleich.', 'R wird kleiner.', 'R wird größer.', 'Das lässt sich nicht berechnen.'], r: 2, e: 'R = U : I wächst mit der Spannung. Die Glühlampe ist kein ohmscher Widerstand.' },
      { id: 'warum', frage: 'Wie lässt sich das erklären?', o: ['Der Glühfaden wird heißer, und mit der Temperatur wächst sein Widerstand.', 'Die Spannungsquelle liefert bei höherer Spannung weniger Strom.', 'Die Lampe verbraucht den Strom.', 'Die Messgeräte verfälschen die Werte immer stärker.'], r: 0, e: 'Bei höherer Spannung fließt mehr Strom, der Glühfaden erhitzt sich stärker, und sein Widerstand nimmt zu.' }]
  };
  function auswertung() {
    const fr = S.bt === 'lampe' ? FRAGEN.lampe : FRAGEN.ohmsch, n = S.rows[S.bt].length, vergl = S.rows.rA.length >= 3 && S.rows.rB.length >= 3;
    const liste = n >= 5 ? fr.map(q => ({ ...q, id: S.bt + q.id })) : [];
    if (vergl) liste.push({ id: 'vergleich', frage: 'Vergleiche die Kennlinien von Widerstand A (50 Ω) und B (100 Ω). Welche verläuft steiler, und warum?', o: ['Die von B, denn B hat den größeren Widerstand.', 'Die von A, denn bei gleicher Spannung fließt durch A mehr Strom.', 'Beide verlaufen gleich steil.', 'Die von B, denn durch B fließt bei gleicher Spannung mehr Strom.'], r: 1, e: 'Je kleiner der Widerstand, desto größer die Stromstärke bei gleicher Spannung und desto steiler die Kennlinie.' });
    if (!liste.length) return '<p class="muted">Miss mindestens fünf Wertepaare, dann erscheinen hier Fragen zur Auswertung.</p>';
    return liste.map(q => { const a = S.antw[q.id], fertig = a === q.r;
      return `<fieldset class="frage"><legend>${esc(q.frage)}</legend>${q.o.map((t, i) => `<button type="button" class="antwort${a === i ? (i === q.r ? ' ok' : ' nok') : ''}" data-q="${q.id}" data-o="${i}" aria-pressed="${a === i}">${esc(t)}</button>`).join('')}` +
        (a === undefined ? '' : `<p class="feedback ${fertig ? 'ok' : 'nok'}"><strong>${fertig ? '✓ Richtig.' : '✗ Noch nicht.'}</strong> ${fertig ? esc(q.e) : 'Schau noch einmal auf deine Tabelle und die Kennlinie.'}</p>`) + '</fieldset>'; }).join('');
  }
  const bewerte = id => { for (const q of [...FRAGEN.ohmsch, ...FRAGEN.lampe]) if (id.endsWith(q.id)) return q; };

  // ---------- Steuerung ----------
  function bedienung() {
    const an = S.an, z = zustand();
    document.querySelectorAll('[data-bt]').forEach(b => { b.setAttribute('aria-pressed', b.dataset.bt === S.bt); b.disabled = an; });
    document.querySelectorAll('[data-a]').forEach(b => { b.setAttribute('aria-pressed', b.dataset.a === S.a); b.disabled = an; });
    document.querySelectorAll('[data-v]').forEach(b => { b.setAttribute('aria-pressed', b.dataset.v === S.v); b.disabled = an; });
    $('netz').textContent = an ? 'Netzgerät ausschalten' : 'Netzgerät einschalten'; $('netz').setAttribute('aria-pressed', an);
    $('U').disabled = !an; $('U').value = S.U; $('oU').textContent = fmt(S.U, 1) + ' V';
    $('uebernehmen').disabled = !(an && z === 'ok');
    $('zeileweg').disabled = !S.rows[S.bt].length; $('reiheweg').disabled = !S.rows[S.bt].length;
    $('neueLampe').hidden = !(S.bt === 'lampe' && S.defekt); $('neueLampe').disabled = an;
    $('ueberNenn').hidden = !(an && S.bt === 'lampe' && S.U > 6);
    $('showR').checked = S.showR; $('linie').checked = S.linie;
  }
  function render() {
    $('aufbau').innerHTML = aufbau(); $('tabelle').innerHTML = tabelle(); $('auswertung').innerHTML = auswertung();
    const m = $('meldung'); m.textContent = S.meld[0]; m.className = 'meldung ' + S.meld[1]; m.hidden = !S.meld[0];
    bedienung(); kennlinie();
  }
  function aus(text, art = 'nok') { S.an = false; S.U = 0; meld(text, art); }
  document.querySelectorAll('[data-bt]').forEach(b => b.onclick = () => { if (S.an) return; S.bt = b.dataset.bt; meld(''); render(); });
  document.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { if (S.an) return; S.a = b.dataset.a; meld(''); render(); });
  document.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { if (S.an) return; S.v = b.dataset.v; meld(''); render(); });
  $('netz').onclick = () => {
    if (S.an) { aus('Netzgerät ausgeschaltet. Jetzt kannst du umbauen.', 'ok'); return render(); }
    if (zustand() === 'offen') { meld('Baue die Messschaltung zuerst vollständig auf: Schließe das Amperemeter und das Voltmeter an.', 'nok'); return render(); }
    S.an = true; S.U = 0; meld('Netzgerät eingeschaltet. Der Regler steht bei 0 V. Miss zuerst diesen Wert und erhöhe die Spannung dann langsam.', 'ok'); render();
  };
  $('U').oninput = e => {
    S.U = +e.target.value; const z = zustand();
    if (z === 'kurzschluss' && S.U > 0) aus('Kurzschluss! Das Amperemeter ist parallel zum Bauteil angeschlossen. Es hat fast keinen Widerstand, deshalb wird die Stromstärke sehr groß. Das Netzgerät hat abgeschaltet. Im echten Versuch könnte das Messgerät kaputtgehen. Ein Amperemeter gehört immer in Reihe.');
    else if (z === 'vreihe' && S.U > 0) meld('Das Voltmeter ist in Reihe geschaltet. Es hat einen sehr großen Widerstand, deshalb fließt fast kein Strom: Das Amperemeter zeigt 0 A, und das Voltmeter zeigt die Spannung des Netzgeräts. Ein Voltmeter gehört parallel zum Bauteil. Schalte das Netzgerät aus und baue um.', 'nok');
    else if (z === 'ok' && S.bt === 'lampe' && S.U > 7) { S.defekt = true; aus('Die Glühlampe ist durchgebrannt, weil die Spannung weit über der Nennspannung von 6 V lag. Das Netzgerät ist ausgeschaltet. Setze eine neue Lampe ein und bleibe bei höchstens 6 V.'); }
    else if (S.meld[1] !== 'ok' || S.U > 0) meld('');
    render();
  };
  $('uebernehmen').onclick = () => {
    const w = werte(), rows = S.rows[S.bt]; if (!(S.an && w.z === 'ok')) return;
    const U = +w.V.toFixed(2), I = +w.A.toFixed(3);
    if (rows.some(r => r.U === U)) meld('Diese Spannung hast du schon gemessen. Stelle einen anderen Wert ein.', 'nok');
    else if (rows.length >= 15) meld('Die Tabelle ist voll (15 Werte).', 'nok');
    else { rows.push({ U, I }); meld(`Messwert ${rows.length} übernommen: U = ${fmt(U, 2)} V, I = ${fmt(I, 3)} A.`, 'ok'); }
    render();
  };
  $('zeileweg').onclick = () => { S.rows[S.bt].pop(); meld(''); render(); };
  $('reiheweg').onclick = () => { S.rows[S.bt] = []; meld(''); render(); };
  $('neueLampe').onclick = () => { S.defekt = false; meld('Neue Lampe eingesetzt.', 'ok'); render(); };
  $('showR').onchange = e => { S.showR = e.target.checked; render(); };
  $('linie').onchange = e => { S.linie = e.target.checked; render(); };
  $('auswertung').onclick = e => { const b = e.target.closest('[data-q]'); if (b) { S.antw[b.dataset.q] = +b.dataset.o; render(); } };
  LernLab.plot.onTheme(render); render();
})();
