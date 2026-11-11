(() => {
  const $ = id => document.getElementById(id), T = LernLab.term, P = LernLab.plot($('c'));
  const fmt = v => Number.isFinite(v) ? (+v.toFixed(4)).toLocaleString('de-DE') : 'nicht definiert';
  const PRE = [['x²', 'x^2', 0, 2], ['x³', 'x^3', 0, 2], ['√x', 'sqrt(x)', 0, 4], ['1 + sin x', '1+sin(x)', 0, 6.2], ['1/x', '1/x', 1, 4],
    ['eˣ', 'e^x', 0, 2], ['−x² + 4', '-x^2+4', -2, 2], ['(x − 1)(x − 3)', '(x-1)*(x-3)', 0, 4]];
  let f = T.parse(PRE[0][1]), mode = 'beide';
  const val = id => +$(id).value;
  const simpson = (g, a, b, N = 2000) => { const h = (b - a) / N; let s = g(a) + g(b); for (let i = 1; i < N; i++) s += g(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
  const extrem = (g, x0, x1) => { let lo = Infinity, hi = -Infinity; for (let k = 0; k <= 20; k++) { const y = g(x0 + (x1 - x0) * k / 20); if (y < lo) lo = y; if (y > hi) hi = y; } return [lo, hi]; };

  function draw() {
    const a = val('a'), b = val('b'), n = val('n'), h = (b - a) / n, pad = (b - a) * .12 + .3, x0 = a - pad, x1 = b + pad;
    $('oa').textContent = fmt(a); $('ob').textContent = fmt(b); $('on').textContent = n;
    const [y0, y1] = P.autoY(f, x0, x1); P.view(x0, x1, y0, y1); P.clear(); P.axes();
    const orange = P.farbe('--f-mathematik'), blau = P.farbe('--accent');
    let U = 0, O = 0;
    for (let i = 0; i < n; i++) {
      const xa = a + i * h, [lo, hi] = extrem(f, xa, xa + h); U += lo * h; O += hi * h;
      if (mode !== 'U' && Number.isFinite(hi)) P.rect(xa, xa + h, 0, hi, orange, .28, n <= 60);
      if (mode !== 'O' && Number.isFinite(lo)) P.rect(xa, xa + h, 0, lo, blau, .5, n <= 60);
    }
    P.line(a, y0, a, y1, P.farbe('--muted'), 1.5, [6, 4]); P.line(b, y0, b, y1, P.farbe('--muted'), 1.5, [6, 4]);
    P.curve(f, P.farbe('--text'));
    const I = simpson(f, a, b);
    $('rU').textContent = fmt(U); $('rO').textContent = fmt(O); $('rD').textContent = fmt(O - U); $('rI').textContent = fmt(I);
    $('c').setAttribute('aria-label', `Graph von f zwischen a=${fmt(a)} und b=${fmt(b)} mit ${n} Streifen. Untersumme ${fmt(U)}, Obersumme ${fmt(O)}.`);
  }
  const halten = w => { const A = $('a'), B = $('b');
    if (w === 'a') { if (+B.value < +A.value + .1) B.value = +A.value + .1; if (+B.value < +A.value + .1) A.value = +B.value - .1; }
    else if (+A.value > +B.value - .1) { A.value = +B.value - .1; if (+A.value > +B.value - .1) B.value = +A.value + .1; } };
  PRE.forEach(([n], i) => $('fn').add(new Option(n, i))); $('fn').add(new Option('Eigene Eingabe', 'e'));
  $('fn').onchange = e => { if (e.target.value === 'e') return; const [, t, a, b] = PRE[e.target.value]; $('eigen').value = t; f = T.parse(t); $('a').value = a; $('b').value = b; $('fehler').textContent = ''; draw(); };
  $('eigen').oninput = e => { try { f = T.parse(e.target.value); $('fehler').textContent = ''; $('fn').value = 'e'; draw(); } catch (err) { $('fehler').textContent = 'Das kann ich nicht lesen: ' + err.message + '.'; } };
  $('a').oninput = () => { halten('a'); draw(); }; $('b').oninput = () => { halten('b'); draw(); }; $('n').oninput = draw;
  document.querySelectorAll('.seg button').forEach(bt => bt.onclick = () => { mode = bt.dataset.m; document.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', x === bt)); draw(); });
  LernLab.plot.onTheme(draw); draw();
})();
