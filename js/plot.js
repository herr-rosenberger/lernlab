// LernLab Plot: kleines Koordinatensystem für Simulationen auf <canvas>. Farben kommen aus dem aktuellen Theme.
// Nutzung: const P = LernLab.plot(canvas); P.view(x0,x1,y0,y1); P.clear(); P.axes(); P.curve(f, P.farbe('--accent')); LernLab.plot.onTheme(neuZeichnen);
(() => {
  const probe = document.createElement('span'); probe.style.display = 'none'; document.documentElement.append(probe);
  const farbe = n => { probe.style.color = `var(${n})`; return getComputedStyle(probe).color; }; // löst light-dark() auf
  const zahl = v => (+v.toFixed(6)).toLocaleString('de-DE');
  const nice = r => { const p = 10 ** Math.floor(Math.log10(r)), m = r / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };

  function plot(canvas, W = 800, H = 450) {
    const S = 2, ctx = canvas.getContext('2d'), P = { l: 52, r: 16, t: 14, b: 30 };
    canvas.width = W * S; canvas.height = H * S;
    let v = { x0: -1, x1: 1, y0: -1, y1: 1 };
    const X = x => P.l + (x - v.x0) / (v.x1 - v.x0) * (W - P.l - P.r);
    const Y = y => H - P.b - (y - v.y0) / (v.y1 - v.y0) * (H - P.t - P.b);
    const innen = fn => { ctx.save(); ctx.beginPath(); ctx.rect(P.l, P.t, W - P.l - P.r, H - P.t - P.b); ctx.clip(); fn(); ctx.restore(); };
    return {
      X, Y, ctx, farbe,
      view(x0, x1, y0, y1) { v = { x0, x1, y0, y1 }; },
      clear() { ctx.setTransform(S, 0, 0, S, 0, 0); ctx.clearRect(0, 0, W, H); },
      axes() {
        ctx.save(); ctx.font = `13px ${getComputedStyle(document.body).fontFamily}`; ctx.fillStyle = farbe('--muted');
        const sx = nice((v.x1 - v.x0) / 8), sy = nice((v.y1 - v.y0) / 6); ctx.strokeStyle = farbe('--line'); ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        for (let k = Math.ceil(v.x0 / sx); k * sx <= v.x1 + 1e-9; k++) { const x = k * sx; ctx.beginPath(); ctx.moveTo(X(x), P.t); ctx.lineTo(X(x), H - P.b); ctx.stroke(); ctx.fillText(zahl(x), X(x), H - P.b + 18); }
        ctx.textAlign = 'right';
        for (let k = Math.ceil(v.y0 / sy); k * sy <= v.y1 + 1e-9; k++) { const y = k * sy; ctx.beginPath(); ctx.moveTo(P.l, Y(y)); ctx.lineTo(W - P.r, Y(y)); ctx.stroke(); ctx.fillText(zahl(y), P.l - 6, Y(y) + 4); }
        ctx.strokeStyle = farbe('--muted'); ctx.lineWidth = 1.5;
        if (v.y0 < 0 && v.y1 > 0) { ctx.beginPath(); ctx.moveTo(P.l, Y(0)); ctx.lineTo(W - P.r, Y(0)); ctx.stroke(); }
        if (v.x0 < 0 && v.x1 > 0) { ctx.beginPath(); ctx.moveTo(X(0), P.t); ctx.lineTo(X(0), H - P.b); ctx.stroke(); }
        ctx.restore();
      },
      curve(f, color, w = 3) {
        innen(() => {
          ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath();
          let pen = false, py = 0; const N = 700, dy = v.y1 - v.y0;
          for (let i = 0; i <= N; i++) {
            const x = v.x0 + (v.x1 - v.x0) * i / N, y = f(x);
            if (!Number.isFinite(y) || Math.abs(y) > 1e4) { pen = false; continue; }
            if (pen && Math.abs(y - py) > 3 * dy) pen = false; // Polstelle: Linie unterbrechen
            pen ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); pen = true; py = y;
          }
          ctx.stroke();
        });
      },
      line(x0, y0, x1, y1, color, w = 2, dash) {
        innen(() => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x1), Y(y1)); ctx.stroke(); });
      },
      dot(x, y, color, r = 5) { innen(() => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X(x), Y(y), r, 0, 7); ctx.fill(); }); },
      rect(x0, x1, ya, yb, color, alpha = .3, rand = true) {
        innen(() => {
          const x = X(x0), y = Y(Math.max(ya, yb)), w = X(x1) - x, h = Math.abs(Y(ya) - Y(yb));
          ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
          if (rand) { ctx.globalAlpha = .9; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); }
        });
      },
      // Fläche zwischen Graph und x-Achse von a bis b; Teile über der Achse in cpos, darunter in cneg
      area(f, a, b, cpos, cneg, alpha = .35) {
        innen(() => {
          const N = 300, h = (b - a) / N, pos = new Path2D(), neg = new Path2D();
          for (let i = 0; i < N; i++) {
            const xa = a + i * h, y = f(xa + h / 2); if (!Number.isFinite(y)) continue;
            (y >= 0 ? pos : neg).rect(X(xa), Math.min(Y(0), Y(y)), X(xa + h) - X(xa), Math.abs(Y(y) - Y(0)));
          }
          ctx.globalAlpha = alpha; ctx.fillStyle = cpos; ctx.fill(pos); ctx.fillStyle = cneg; ctx.fill(neg);
        });
      },
      autoY(f, x0, x1, lim = 30) {
        let lo = 0, hi = 0;
        for (let i = 0; i <= 300; i++) { const y = f(x0 + (x1 - x0) * i / 300); if (Number.isFinite(y) && Math.abs(y) <= lim) { lo = Math.min(lo, y); hi = Math.max(hi, y); } }
        const p = (hi - lo || 1) * .12; return [lo - p, hi + p];
      }
    };
  }
  plot.onTheme = cb => { new MutationObserver(cb).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); matchMedia('(prefers-color-scheme: dark)').addEventListener('change', cb); };
  (window.LernLab = window.LernLab || {}).plot = plot;
})();
