(() => {
  const $ = id => document.getElementById(id), T = LernLab.term, P = LernLab.plot($('c'), 800, 400), Q = LernLab.plot($('c2'), 800, 300);
  const fmt = v => Number.isFinite(v) ? (+v.toFixed(4)).toLocaleString('de-DE') : 'nicht definiert';
  // [Name, Term, Ausschnitt von, bis, a, b]
  const PRE = [['sin x', 'sin(x)', -1, 7, 0, 3.15], ['x³ − 3x', 'x^3-3*x', -3, 3, -1.5, 2], ['e^(−x²)', 'e^(-x^2)', -3, 3, -1, 1],
    ['1/x', '1/x', 0.2, 6, 1, 4], ['½x² − 2', '0.5*x^2-2', -4, 4, -3, 3], ['√x', 'sqrt(x)', 0, 6, 1, 4]];
  let f = T.parse(PRE[0][1]), F = null;
  const val = id => +$(id).value;
  const simpson = (g, a, b, N = 2000) => { const h = (b - a) / N; let s = g(a) + g(b); for (let i = 1; i < N; i++) s += g(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };

  function draw() {
    const a = val('a'), b = val('b'), x0 = +$('a').min, x1 = +$('a').max;
    $('oa').textContent = fmt(a); $('ob').textContent = fmt(b);
    const blau = P.farbe('--accent'), orange = P.farbe('--f-mathematik');
    const [y0, y1] = P.autoY(f, x0, x1); P.view(x0, x1, y0, y1); P.clear(); P.axes();
    P.area(f, a, b, blau, orange); P.line(a, y0, a, y1, P.farbe('--muted'), 1.5, [6, 4]); P.line(b, y0, b, y1, P.farbe('--muted'), 1.5, [6, 4]);
    P.curve(f, P.farbe('--text'));
    const I = simpson(f, a, b), A = simpson(x => Math.abs(f(x)), a, b, 4000);
    $('rI').textContent = fmt(I); $('rA').textContent = fmt(A);
    // Integralfunktion J(x) = Integral von a bis x
    const M = 600, dx = (x1 - x0) / M, C = [0], g = x => { const y = f(x); return Number.isFinite(y) ? y : 0; };
    for (let k = 1; k <= M; k++) C[k] = C[k - 1] + (g(x0 + (k - 1) * dx) + g(x0 + k * dx)) / 2 * dx;
    const at = x => { const t = (x - x0) / dx, k = Math.max(0, Math.min(M - 1, Math.floor(t))), r = t - k; return C[k] * (1 - r) + C[k + 1] * r; };
    const Ca = at(a), J = x => at(x) - Ca;
    let lo = 0, hi = 0; for (let k = 0; k <= M; k++) { const v = C[k] - Ca; lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const p = (hi - lo || 1) * .12; Q.view(x0, x1, lo - p, hi + p); Q.clear(); Q.axes();
    Q.curve(J, Q.farbe('--text')); const w = (x1 - x0) * .12, m = f(b);
    if (Number.isFinite(m)) Q.line(b - w, J(b) - m * w, b + w, J(b) + m * w, orange, 2.5);
    Q.dot(a, 0, Q.farbe('--muted')); Q.dot(b, J(b), blau, 6);
    // Probe mit eigener Stammfunktion
    const st = $('stamm');
    if (F) { const d = F(b) - F(a); st.textContent = Number.isFinite(d) ? `F(b) − F(a) = ${fmt(d)}. ` + (Math.abs(d - I) < 1e-3 * (1 + Math.abs(I)) ? 'Das passt zum Integral.' : 'Das weicht vom Integral ab. Prüfe F durch Ableiten.') : 'F ist an einer Grenze nicht definiert.'; }
    else st.textContent = '';
    $('c').setAttribute('aria-label', `Graph von f mit Fläche zwischen a=${fmt(a)} und b=${fmt(b)}. Integral ${fmt(I)}, Flächeninhalt ${fmt(A)}.`);
  }
  const halten = w => { const A = $('a'), B = $('b');
    if (w === 'a') { if (+B.value < +A.value + .05) B.value = +A.value + .05; if (+B.value < +A.value + .05) A.value = +B.value - .05; }
    else if (+A.value > +B.value - .05) { A.value = +B.value - .05; if (+A.value > +B.value - .05) B.value = +A.value + .05; } };
  const bereich = (x0, x1) => { for (const id of ['a', 'b']) { $(id).min = x0; $(id).max = x1; } };
  PRE.forEach(([n], i) => $('fn').add(new Option(n, i))); $('fn').add(new Option('Eigene Eingabe', 'e'));
  $('fn').onchange = e => { if (e.target.value === 'e') return; const [, t, x0, x1, a, b] = PRE[e.target.value]; $('eigen').value = t; f = T.parse(t); bereich(x0, x1); $('a').value = a; $('b').value = b; $('fehler').textContent = ''; draw(); };
  $('eigen').oninput = e => { try { f = T.parse(e.target.value); $('fehler').textContent = ''; $('fn').value = 'e'; draw(); } catch (err) { $('fehler').textContent = 'Das kann ich nicht lesen: ' + err.message + '.'; } };
  $('Feingabe').oninput = e => { const s = e.target.value.trim(); if (!s) { F = null; $('fehlerF').textContent = ''; return draw(); } try { F = T.parse(s); $('fehlerF').textContent = ''; draw(); } catch (err) { F = null; $('fehlerF').textContent = 'Das kann ich nicht lesen: ' + err.message + '.'; } };
  $('a').oninput = () => { halten('a'); draw(); }; $('b').oninput = () => { halten('b'); draw(); };
  bereich(PRE[0][2], PRE[0][3]); $('a').value = PRE[0][4]; $('b').value = PRE[0][5];
  LernLab.plot.onTheme(draw); draw();
})();
