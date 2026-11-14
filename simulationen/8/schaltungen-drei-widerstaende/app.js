(() => {
  const $ = id => document.getElementById(id);
  const fmt = (v, d = 3) => Number.isFinite(v) ? (+v.toFixed(d)).toLocaleString('de-DE') : '–';
  const tx = (v, d = 3) => fmt(v, d).replace(',', '{,}');
  const SUB = '₀₁₂₃', S = { typ: 'reihe', n: 3, U: 6, R: [20, 30, 50], hide: false };
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
  function draw() {
    const c = calc(), gem = S.typ === 'gemischt', n = c.n;
    ['U', 'R1', 'R2', 'R3'].forEach(id => { const o = $('o' + id); if (o) o.textContent = id === 'U' ? fmt(S.U, 1) + ' V' : fmt(S.R[+id[1] - 1], 0) + ' Ω'; });
    $('f3').hidden = n < 3; $('nGroup').hidden = gem; $('hinweisGem').hidden = !gem;
    $('bild').innerHTML = schaltbild(c); $('tabelle').innerHTML = tabelle(c); $('weg').innerHTML = weg(c);
    document.querySelectorAll('[data-typ]').forEach(b => b.setAttribute('aria-pressed', b.dataset.typ === S.typ));
    document.querySelectorAll('[data-n]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.n === S.n));
    if (window.LernLab && LernLab.mathe) LernLab.mathe($('weg'));
  }
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
  draw();
})();
