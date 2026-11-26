// Rechenkern für Schaltungen aus Batterien, Widerständen, Kabeln und Messgeräten (ideale Bauteile).
// analysiereNetz(elemente) löst die Schaltung (Knotenspannungs-Verfahren), erkennt Reihen- und Parallelschaltungen und liefert
// Gesamtwiderstand, Gesamtstromstärke, Gesamtspannung, alle Teilwerte und einen Rechenweg. Läuft im Browser und in Node.
(() => {
  const LL = typeof window !== 'undefined' ? (window.LernLab = window.LernLab || {}) : (globalThis.LernLab = globalThis.LernLab || {});
  const R_AMPERE = 1e-3, R_VOLT = 1e9;   // idealisiert: Amperemeter fast 0 Ω, Voltmeter sehr groß

  function gauss(A, z) {                  // lineares Gleichungssystem, null bei Singularität
    const n = z.length; if (!n) return [];
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-15) return null;
      [A[c], A[p]] = [A[p], A[c]]; [z[c], z[p]] = [z[p], z[c]];
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; if (!f) continue; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; z[r] -= f * z[c]; }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) { let s = z[r]; for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]; x[r] = s / A[r][r]; }
    return x;
  }
  function loeseMNA(knoten, widerstaende, quellen) {   // knoten[0] ist die Masse
    const idx = new Map(); knoten.slice(1).forEach((k, i) => idx.set(k, i));
    const nn = knoten.length - 1, N = nn + quellen.length, A = Array.from({ length: N }, () => new Array(N).fill(0)), z = new Array(N).fill(0), ix = k => idx.has(k) ? idx.get(k) : -1;
    for (const w of widerstaende) { const i = ix(w.ka), j = ix(w.kb); if (i >= 0) A[i][i] += w.g; if (j >= 0) A[j][j] += w.g; if (i >= 0 && j >= 0) { A[i][j] -= w.g; A[j][i] -= w.g; } }
    quellen.forEach((q, s) => { const b = nn + s, i = ix(q.p), j = ix(q.m); if (i >= 0) { A[i][b] -= 1; A[b][i] += 1; } if (j >= 0) { A[j][b] += 1; A[b][j] -= 1; } z[b] = q.E; });
    const x = gauss(A, z); if (!x) return null;
    return { v: k => ix(k) >= 0 ? x[ix(k)] : 0, i: quellen.map((_, s) => x[nn + s]) };
  }

  // ---------- Reihen-/Parallelzerlegung ----------
  const flip = b => b.typ === 'B' ? { ...b, plusAmAnfang: !b.plusAmAnfang } : b.typ === 'S' ? { typ: 'S', kinder: b.kinder.slice().reverse().map(flip) } : b.typ === 'P' ? { typ: 'P', kinder: b.kinder.map(flip) } : b;
  const blaetter = b => b.kinder ? b.kinder.flatMap(blaetter) : [b];
  function reduziere(kanten, T1, T2) {
    const unbenutzt = [], ueberbrueckt = [];
    let E = kanten.filter(k => { if (k.a === k.b) { ueberbrueckt.push(...blaetter(k.baum)); return false; } return true; });
    for (let geaendert = true; geaendert;) {
      geaendert = false;
      const grad = new Map(); E.forEach(k => { grad.set(k.a, (grad.get(k.a) || 0) + 1); grad.set(k.b, (grad.get(k.b) || 0) + 1); });
      const lose = E.findIndex(k => (k.a !== T1 && k.a !== T2 && grad.get(k.a) === 1) || (k.b !== T1 && k.b !== T2 && grad.get(k.b) === 1));
      if (lose >= 0) { unbenutzt.push(...blaetter(E[lose].baum)); E.splice(lose, 1); geaendert = true; continue; }
      outer: for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) {
        const p = E[i], q = E[j];
        if ((p.a === q.a && p.b === q.b) || (p.a === q.b && p.b === q.a)) {
          const qb = p.a === q.a ? q.baum : flip(q.baum);
          E[i] = { a: p.a, b: p.b, baum: { typ: 'P', kinder: [...(p.baum.typ === 'P' ? p.baum.kinder : [p.baum]), ...(qb.typ === 'P' ? qb.kinder : [qb])] } };
          E.splice(j, 1); geaendert = true; break outer;
        }
      }
      if (geaendert) continue;
      for (const [x, g] of grad) if (g === 2 && x !== T1 && x !== T2) {
        const ids = E.map((k, i) => (k.a === x || k.b === x) ? i : -1).filter(i => i >= 0); let p = E[ids[0]], q = E[ids[1]];
        if (p.a === x) p = { a: p.b, b: p.a, baum: flip(p.baum) };
        if (q.b === x) q = { a: q.b, b: q.a, baum: flip(q.baum) };
        const kinder = [...(p.baum.typ === 'S' ? p.baum.kinder : [p.baum]), ...(q.baum.typ === 'S' ? q.baum.kinder : [q.baum])];
        E = E.filter((_, i) => i !== ids[0] && i !== ids[1]); E.push({ a: p.a, b: q.b, baum: { typ: 'S', kinder } }); geaendert = true; break;
      }
    }
    if (E.length === 1 && ((E[0].a === T1 && E[0].b === T2) || (E[0].a === T2 && E[0].b === T1))) return { baum: E[0].a === T1 ? E[0].baum : flip(E[0].baum), unbenutzt, ueberbrueckt };
    return { baum: null, grund: E.length ? 'nichtSP' : 'offen', unbenutzt, ueberbrueckt };
  }
  const rges = b => b.typ === 'R' ? b.el.v : b.typ === 'V' ? Infinity : (b.typ === 'A' || b.typ === 'B') ? 0 :
    b.typ === 'S' ? b.kinder.reduce((s, k) => s + rges(k), 0) : (() => { const g = b.kinder.reduce((s, k) => { const r = rges(k); return s + (r === 0 ? Infinity : 1 / r); }, 0); return g === Infinity ? 0 : g === 0 ? Infinity : 1 / g; })();
  const blockierer = b => b.typ === 'V' ? [b] : b.typ === 'S' ? b.kinder.filter(k => rges(k) === Infinity).flatMap(blockierer) : b.typ === 'P' && rges(b) === Infinity ? b.kinder.flatMap(blockierer) : [];
  const amperePar = b => b.typ === 'P' ? [...(b.kinder.length > 1 ? b.kinder.filter(k => k.typ === 'A') : []), ...b.kinder.flatMap(amperePar)] : b.typ === 'S' ? b.kinder.flatMap(amperePar) : [];

  // ---------- Hauptfunktion ----------
  // elemente: [{key, t: 'W'|'R'|'B'|'A'|'V', v, rev, a, b, seq}], a/b = Knotennamen. Batterie: Pluspol = rev ? b : a.
  function analysiereNetz(elemente) {
    const uf = new Map(), find = x => { if (!uf.has(x)) uf.set(x, x); let r = x; while (uf.get(r) !== r) r = uf.get(r); uf.set(x, r); return r; };
    elemente.filter(e => e.t === 'W').forEach(e => { const ra = find(e.a), rb = find(e.b); if (ra !== rb) uf.set(ra, rb); });
    const el = elemente.filter(e => e.t !== 'W').map(e => ({ ...e, ka: find(e.a), kb: find(e.b), I: 0, U: 0, aktiv: false }));
    el.forEach(e => { if (e.t === 'B') { e.kp = e.rev ? e.kb : e.ka; e.km = e.rev ? e.ka : e.kb; } });
    const erg = { el, haupt: null, baum: null, grund: null, unbenutzt: [], ueberbrueckt: [], codes: {}, rges: null, uges: null, iges: 0 };
    const batterien = el.filter(e => e.t === 'B').sort((a, b) => (a.seq || 0) - (b.seq || 0));
    if (!batterien.length) { erg.codes.keineBatterie = true; return erg; }
    erg.codes.kurzBatterie = batterien.filter(b => b.kp === b.km).map(b => b.key);
    // Zusammenhangskomponenten
    const nach = new Map(); el.forEach(e => { for (const k of [e.ka, e.kb]) { if (!nach.has(k)) nach.set(k, []); nach.get(k).push(e); } });
    const gesehen = new Set(), gruppen = [];
    for (const start of nach.keys()) { if (gesehen.has(start)) continue; const kn = [], es = new Set(), st = [start]; gesehen.add(start);
      while (st.length) { const k = st.pop(); kn.push(k); for (const e of nach.get(k)) { es.add(e); for (const m of [e.ka, e.kb]) if (!gesehen.has(m)) { gesehen.add(m); st.push(m); } } }
      gruppen.push({ kn, es: [...es] }); }
    let hauptGruppe = null;
    for (const g of gruppen) {
      const qs = g.es.filter(e => e.t === 'B'); if (!qs.length || qs.some(b => b.kp === b.km)) continue;
      if (qs.includes(batterien[0])) hauptGruppe = g;
      const ws = g.es.filter(e => e.t !== 'B' && e.ka !== e.kb).map(e => ({ ka: e.ka, kb: e.kb, g: 1 / (e.t === 'R' ? e.v : e.t === 'A' ? R_AMPERE : R_VOLT) }));
      const loes = loeseMNA(g.kn, ws, qs.map(b => ({ p: b.kp, m: b.km, E: b.v })));
      if (!loes) { erg.codes.nichtLoesbar = true; continue; }
      g.es.forEach(e => { e.aktiv = true; e.U = loes.v(e.ka) - loes.v(e.kb); if (e.t === 'R') e.I = e.U / e.v; else if (e.t === 'A') e.I = e.U / R_AMPERE; else if (e.t === 'V') e.I = e.U / R_VOLT; });
      qs.forEach((b, s) => { b.I = loes.i[s]; b.U = b.v; });
      if (g.es.some(e => Math.abs(e.I) > 100)) erg.codes.kurzStrom = true;
    }
    const haupt = batterien[0]; erg.haupt = haupt;
    if (haupt.kp === haupt.km) return erg;
    erg.iges = haupt.I;
    if (!hauptGruppe) return erg;
    const kanten = hauptGruppe.es.filter(e => e !== haupt).map(e => ({ a: e.ka, b: e.kb, baum: { typ: e.t, el: e, plusAmAnfang: e.t === 'B' ? e.kp === e.ka : undefined } }));
    const red = reduziere(kanten, haupt.kp, haupt.km);
    erg.baum = red.baum; erg.grund = red.grund || null; erg.unbenutzt = red.unbenutzt.map(b => b.el.key); erg.ueberbrueckt = red.ueberbrueckt.map(b => b.el.key);
    if (erg.baum) {
      erg.rges = rges(erg.baum);
      if (erg.rges === Infinity) { erg.codes.vReihe = blockierer(erg.baum).map(b => b.el.key); if (!erg.codes.vReihe.length) erg.codes.offen = true; }
      if (erg.rges === 0 && !erg.codes.kurzBatterie.length) erg.codes.kurzStrom = true;
      erg.codes.aParallel = amperePar(erg.baum).map(b => b.el.key);
      const oben = erg.baum.typ === 'S' ? erg.baum.kinder : [erg.baum]; let u = haupt.v, ok = true;
      const alle = blaetter(erg.baum).filter(b => b.typ === 'B');
      for (const b of alle) { if (oben.includes(b)) u += (b.plusAmAnfang ? -1 : 1) * b.el.v; else ok = false; }
      erg.uges = ok ? u : null;
    } else if (erg.grund === 'offen') erg.codes.offen = true;
    else if (erg.grund === 'nichtSP') erg.codes.nichtSP = true;
    return erg;
  }

  // ---------- Rechenweg für den Gesamtwiderstand (nur Widerstände; Messgeräte zählen nicht mit) ----------
  function vereinfache(b) {
    if (b.typ === 'R') return b;
    if (b.typ === 'A' || b.typ === 'B') return { typ: 'NULL' };
    if (b.typ === 'V') return { typ: 'INF' };
    const ks = b.kinder.map(vereinfache);
    if (b.typ === 'S') { if (ks.some(k => k.typ === 'INF')) return { typ: 'INF' }; const r = ks.filter(k => k.typ !== 'NULL'); return !r.length ? { typ: 'NULL' } : r.length === 1 ? r[0] : { typ: 'S', kinder: r }; }
    if (ks.some(k => k.typ === 'NULL')) return { typ: 'NULL' }; const r = ks.filter(k => k.typ !== 'INF'); return !r.length ? { typ: 'INF' } : r.length === 1 ? r[0] : { typ: 'P', kinder: r };
  }
  function rechenweg(baum, name, tx) {
    const O = '\\,\\Omega', zeilen = []; let ns = 0, np = 0;
    const liste = ks => ks.length === 2 ? `$${ks[0].name}$ und $${ks[1].name}$` : ks.slice(0, -1).map(k => `$${k.name}$`).join(', ') + ` und $${ks[ks.length - 1].name}$`;
    const rec = b => {
      if (b.typ === 'R') return { name: name(b.el), wert: b.el.v };
      const ks = b.kinder.map(rec);
      if (b.typ === 'S') { const n = `R_{\\mathrm{S}${++ns}}`, w = ks.reduce((s, k) => s + k.wert, 0);
        zeilen.push(`Reihenschaltung von ${liste(ks)}: $${n}=${ks.map(k => k.name).join('+')}=${ks.map(k => tx(k.wert) + O).join('+')}=${tx(w)}${O}$`); return { name: n, wert: w }; }
      const n = `R_{\\mathrm{P}${++np}}`, w = 1 / ks.reduce((s, k) => s + 1 / k.wert, 0);
      zeilen.push(`Parallelschaltung von ${liste(ks)} (Vertiefung): $\\dfrac{1}{${n}}=${ks.map(k => `\\dfrac{1}{${k.name}}`).join('+')}=${ks.map(k => `\\dfrac{1}{${tx(k.wert)}${O}}`).join('+')}$, also $${n}=${tx(w, 3)}${O}$`);
      return { name: n, wert: w };
    };
    const wurzel = vereinfache(baum); if (wurzel.typ === 'NULL' || wurzel.typ === 'INF') return { zeilen, name: null, wert: wurzel.typ === 'NULL' ? 0 : Infinity };
    const r = rec(wurzel); return { zeilen, name: r.name, wert: r.wert };
  }

  LL.schaltung = { analysiereNetz, rechenweg, vereinfache, rges, blaetter, R_AMPERE, R_VOLT };
  if (typeof module !== 'undefined') module.exports = LL.schaltung;
})();
