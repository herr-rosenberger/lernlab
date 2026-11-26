(() => {
  const $ = id => document.getElementById(id), SC = LernLab.schaltung;
  const COLS = 8, ROWS = 5, DX = 100, M = 44, BW = M * 2 + (COLS - 1) * DX, BH = M * 2 + (ROWS - 1) * DX;
  const px = c => M + c * DX, py = r => M + r * DX;
  const fmt = (v, d = 3) => Number.isFinite(v) ? v.toLocaleString('de-DE', { maximumFractionDigits: d, useGrouping: false }) : '–';
  const tx = (v, d = 4) => fmt(v, d).replace(',', '{,}');
  const strom = v => { const a = Math.abs(v); return a === 0 ? '0 A' : a < 0.1 ? fmt(a * 1000, 2) + ' mA' : fmt(a, 3) + ' A'; };   // unter 0,1 A in mA
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SUB = '₀₁₂₃₄₅₆₇₈₉', sub = n => String(n).replace(/\d/g, d => SUB[+d]);
  const mathe = el => (window.LernLab && LernLab.mathe) ? LernLab.mathe(el) : Promise.resolve();
  const S = { teile: {}, wz: 'W', sel: null, vor: { B: 6, R: 100 }, hide: false, fokus: 'h:0:0', seq: 0, verlauf: [], refokus: false };
  let werte = {}, nr = {};

  // ---------- Raster ----------
  const KANTEN = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 1; c++) KANTEN.push(`h:${c}:${r}`); for (let r = 0; r < ROWS - 1; r++) for (let c = 0; c < COLS; c++) KANTEN.push(`v:${c}:${r}`);
  const geo = k => { const [t, c, r] = k.split(':'), C = +c, R = +r, h = t === 'h'; return { h, c: C, r: R, x1: px(C), y1: py(R), x2: h ? px(C + 1) : px(C), y2: h ? py(R) : py(R + 1) }; };
  const knoten = (c, r) => `${c},${r}`;
  const elemente = () => Object.entries(S.teile).map(([k, t]) => { const g = geo(k); return { key: k, t: t.t, v: t.v, rev: !!t.rev, seq: t.seq || 0, a: knoten(g.c, g.r), b: g.h ? knoten(g.c + 1, g.r) : knoten(g.c, g.r + 1) }; });
  const nummeriere = () => { nr = { R: {}, A: {}, V: {}, B: {} }; for (const t of ['R', 'A', 'V', 'B']) Object.entries(S.teile).filter(([, x]) => x.t === t).sort((a, b) => (a[1].seq || 0) - (b[1].seq || 0)).forEach(([k], i) => { nr[t][k] = i + 1; }); };
  const nameR = k => 'R' + sub(nr.R[k]), texR = k => `R_{${nr.R[k]}}`, texB = k => `U_{\\mathrm{B}${nr.B[k]}}`;
  const bez = k => { const t = S.teile[k]; return t.t === 'R' ? `R${sub(nr.R[k])}` : t.t === 'A' ? `Amperemeter ${nr.A[k]}` : t.t === 'V' ? `Voltmeter ${nr.V[k]}` : t.t === 'B' ? `Batterie ${nr.B[k]}` : 'Kabel'; };
  const beschreibe = k => { const g = geo(k), t = S.teile[k], inh = !t ? 'leer' : t.t === 'W' ? 'Kabel' : t.t === 'R' ? `Widerstand ${fmt(t.v)} Ohm` : t.t === 'B' ? `Batterie ${fmt(t.v)} Volt` : t.t === 'A' ? 'Amperemeter' : 'Voltmeter'; return `Verbindung von Punkt ${g.c + 1}/${g.r + 1} nach Punkt ${g.h ? g.c + 2 : g.c + 1}/${g.h ? g.r + 1 : g.r + 2}: ${inh}`; };

  // ---------- Baubrett (Aufbau) ----------
  const T = (x, y, s, a = 'middle', z = 14, w = 400) => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="${z}" font-weight="${w}" fill="var(--text)" font-family="inherit">${s}</text>`;
  const lw = (x1, x2, f = 'var(--text)') => `<line x1="${x1}" y1="0" x2="${x2}" y2="0" stroke="${f}" stroke-width="5" stroke-linecap="round"/>`;
  function teilSVG(k) {
    const t = S.teile[k], g = geo(k), cx = (g.x1 + g.x2) / 2, cy = (g.y1 + g.y2) / 2, w = werte[k], an = w && w.aktiv, ab = x => Math.abs(x);
    let in_ = '', zeilen = [];
    if (S.sel === k) in_ += `<rect x="-54" y="-27" width="108" height="54" rx="12" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2.5"/>`;
    if (t.t === 'W') in_ += lw(-50, 50);
    else if (t.t === 'R') { in_ += lw(-50, -28) + lw(28, 50) + `<rect x="-28" y="-11" width="56" height="22" rx="3" fill="var(--surface-2)" stroke="var(--text)" stroke-width="2.5"/><line x1="-10" y1="-11" x2="-10" y2="11" stroke="var(--f-mathematik)" stroke-width="4"/><line x1="0" y1="-11" x2="0" y2="11" stroke="var(--f-physik)" stroke-width="4"/><line x1="10" y1="-11" x2="10" y2="11" stroke="var(--f-chemie)" stroke-width="4"/>`; zeilen = [[`${nameR(k)} = ${fmt(t.v)} Ω`, 700]]; if (!S.hide && an) zeilen.push([`U = ${fmt(ab(w.U))} V`, 400], [`I = ${strom(w.I)}`, 400]); }
    else if (t.t === 'B') { const pa = !t.rev; in_ += lw(-50, -26) + lw(26, 50) + `<rect x="-26" y="-15" width="52" height="30" rx="5" fill="var(--surface-2)" stroke="var(--text)" stroke-width="2.5"/><text x="${pa ? -14 : 14}" y="6" text-anchor="middle" font-size="18" font-weight="700" fill="var(--f-mathematik)">+</text><text x="${pa ? 14 : -14}" y="6" text-anchor="middle" font-size="18" font-weight="700" fill="var(--f-physik)">−</text>`; zeilen = [[`${fmt(t.v)} V`, 700]]; }
    else { const b = t.t; in_ += lw(-50, -22) + lw(22, 50) + `<circle r="22" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/><text y="7" text-anchor="middle" font-size="20" font-weight="700" fill="var(--text)">${b}</text>`; zeilen = [[S.hide ? '?' : (an ? (b === 'A' ? strom(w.I) : `${fmt(ab(w.U))} V`) : '–'), 700]]; }
    let s = `<g transform="translate(${cx} ${cy}) rotate(${g.h ? 0 : 90})">${in_}</g>`;
    zeilen.forEach(([z, wt], i) => { s += g.h ? T(cx, cy + (i ? 34 + (i - 1) * 16 : (t.t === 'A' || t.t === 'V' ? 42 : -32)), z, 'middle', 14, wt) : T(cx + 36, cy + (zeilen.length > 1 ? (i - 0.5) * 17 : 5), z, 'start', 14, wt); });
    return s;
  }
  function brettSVG() {
    const p = [];
    for (const k of KANTEN) if (!S.teile[k]) { const g = geo(k); p.push(`<line x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}" stroke="var(--line)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`); }
    for (const k of KANTEN) if (S.teile[k]) p.push(teilSVG(k));
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) p.push(`<circle cx="${px(c)}" cy="${py(r)}" r="5.5" fill="var(--text)"/>`);
    for (const k of KANTEN) { const g = geo(k), d = 20, ax = g.h ? g.x1 + d : g.x1, bx = g.h ? g.x2 - d : g.x2, ay = g.h ? g.y1 : g.y1 + d, by = g.h ? g.y2 : g.y2 - d;
      p.push(`<line class="kante" data-kante="${k}" x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" tabindex="${k === S.fokus ? 0 : -1}" role="button" aria-label="${esc(beschreibe(k))}"/>`); }
    return `<svg viewBox="0 0 ${BW} ${BH}" role="group" aria-label="Baubrett mit Raster">${p.join('')}</svg>`;
  }

  // ---------- Schaltbild (automatisch aus der Zerlegung) ----------
  const LW = 120, LH = 86, YB = 43, GAP = 16, BAR = 22;
  function blatt(b) {
    const e = b.el, w = werte[e.key], an = w && w.aktiv, ab = Math.abs;
    return { w: LW, h: LH, yb: YB, zeichne(x, y) {
      const Y = y + YB, mx = x + LW / 2, dr = (a, z) => `<line x1="${a}" y1="${Y}" x2="${z}" y2="${Y}" stroke="var(--text)" stroke-width="2.5"/>`; let s = '';
      if (b.typ === 'R') { s += dr(x, mx - 30) + dr(mx + 30, x + LW) + `<rect x="${mx - 30}" y="${Y - 12}" width="60" height="24" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/>` + T(mx, Y - 20, `${nameR(e.key)} = ${fmt(e.v)} Ω`, 'middle', 14, 700); if (!S.hide && an) s += T(mx, Y + 30, `U = ${fmt(ab(w.U))} V`, 'middle', 13) + T(mx, Y + 46, `I = ${strom(w.I)}`, 'middle', 13); }
      else if (b.typ === 'A' || b.typ === 'V') { s += dr(x, mx - 20) + dr(mx + 20, x + LW) + `<circle cx="${mx}" cy="${Y}" r="20" fill="var(--surface)" stroke="var(--text)" stroke-width="2.5"/>` + T(mx, Y + 7, b.typ, 'middle', 20, 700) + T(mx, Y + 40, S.hide ? '?' : an ? (b.typ === 'A' ? strom(w.I) : `${fmt(ab(w.U))} V`) : '–', 'middle', 13, 700); }
      else { const l = b.plusAmAnfang; s += dr(x, mx - 7) + dr(mx + 7, x + LW) + `<line x1="${mx - 7}" y1="${Y - (l ? 20 : 11)}" x2="${mx - 7}" y2="${Y + (l ? 20 : 11)}" stroke="var(--text)" stroke-width="${l ? 2.5 : 5}"/><line x1="${mx + 7}" y1="${Y - (l ? 11 : 20)}" x2="${mx + 7}" y2="${Y + (l ? 11 : 20)}" stroke="var(--text)" stroke-width="${l ? 5 : 2.5}"/>` + T(mx, Y - 26, `U = ${fmt(e.v)} V`, 'middle', 14, 700); }
      return s; } };
  }
  function layout(b) {
    if (b.typ === 'S') { const ks = b.kinder.map(layout), yb = Math.max(...ks.map(k => k.yb)), unt = Math.max(...ks.map(k => k.h - k.yb));
      return { w: ks.reduce((s, k) => s + k.w, 0), h: yb + unt, yb, zeichne(x, y) { let cx = x; return ks.map(k => { const t = k.zeichne(cx, y + yb - k.yb); cx += k.w; return t; }).join(''); } }; }
    if (b.typ === 'P') { const ks = b.kinder.map(layout), wmax = Math.max(...ks.map(k => k.w)); let y = 0; const tops = ks.map(k => { const t = y; y += k.h + GAP; return t; });
      const b1 = tops[0] + ks[0].yb, b2 = tops[ks.length - 1] + ks[ks.length - 1].yb, yb = (b1 + b2) / 2;
      return { w: wmax + 2 * BAR, h: y - GAP, yb, zeichne(x, y0) { const xl = x + BAR, xr = xl + wmax, L = (a, b_, c, d) => `<line x1="${a}" y1="${b_}" x2="${c}" y2="${d}" stroke="var(--text)" stroke-width="2.5"/>`;
        let s = L(x, y0 + yb, xl, y0 + yb) + L(xr, y0 + yb, xr + BAR, y0 + yb) + L(xl, y0 + b1, xl, y0 + b2) + L(xr, y0 + b1, xr, y0 + b2);
        ks.forEach((k, i) => { const cx = xl + (wmax - k.w) / 2, Y = y0 + tops[i] + k.yb; s += L(xl, Y, cx, Y) + L(cx + k.w, Y, xr, Y) + k.zeichne(cx, y0 + tops[i]); });
        return s + `<circle cx="${xl}" cy="${y0 + yb}" r="4.5" fill="var(--text)"/><circle cx="${xr}" cy="${y0 + yb}" r="4.5" fill="var(--text)"/>`; } }; }
    return blatt(b);
  }
  function schaltbildSVG(erg) {
    const wz = layout(erg.baum), x0 = 50, xl = x0 + 72, yTop = 40, yT = yTop + wz.yb, yB = Math.max(yTop + wz.h + 30, yT + 104), xr = xl + wz.w + 36, W = xr + 40, H = yB + 44, yc = (yT + yB) / 2;
    const L = (a, b, c, d) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="var(--text)" stroke-width="2.5"/>`, hb = erg.haupt;
    const s = L(x0, yT, xl, yT) + wz.zeichne(xl, yTop) + L(xl + wz.w, yT, xr, yT) + L(xr, yT, xr, yB) + L(xr, yB, x0, yB) + L(x0, yB, x0, yc + 10) + L(x0, yT, x0, yc - 10) +
      `<line x1="${x0 - 22}" y1="${yc - 10}" x2="${x0 + 22}" y2="${yc - 10}" stroke="var(--text)" stroke-width="3"/><line x1="${x0 - 12}" y1="${yc + 10}" x2="${x0 + 12}" y2="${yc + 10}" stroke="var(--text)" stroke-width="6"/>` +
      T(x0 - 30, yc - 5, '+', 'end', 20, 700) + T(x0 + 32, yc + 5, `U = ${fmt(hb.v)} V`, 'start', 14, 700) + `<path d="M${x0 + 34} ${yT - 8}L${x0 + 50} ${yT}L${x0 + 34} ${yT + 8}Z" fill="var(--accent)"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Schaltbild der aufgebauten Schaltung" style="min-width:${Math.min(W, 560)}px">${s}</svg>`;
  }

  // ---------- Auswertung und Anzeige ----------
  const einheiten = ['R', 'A', 'V', 'B'];
  function meldungen(erg) {
    const m = [], c = erg.codes, ks = S.teile ? Object.keys(S.teile) : [], namen = l => l.map(k => bez(k)).join(', ');
    if (!ks.length) return [['info', 'Baue eine Schaltung: Wähle links ein Werkzeug und klicke auf eine Verbindung im Raster. Oder lade ein Beispiel.']];
    if (c.keineBatterie) return [['nok', 'Es fehlt eine Batterie. Ohne sie fließt kein Strom.']];
    if (c.kurzBatterie && c.kurzBatterie.length) m.push(['nok', 'Kurzschluss! Die Pole der Batterie sind nur durch Kabel verbunden. Die Stromstärke wäre gefährlich groß. Baue einen Widerstand ein.']);
    else if (c.kurzStrom) m.push(['nok', 'Kurzschluss! Zwischen den Polen der Batterie gibt es (fast) keinen Widerstand, zum Beispiel nur Kabel und Amperemeter. Die Stromstärke wäre gefährlich groß. Baue einen Widerstand ein.']);
    else if (c.vReihe && c.vReihe.length) m.push(['nok', `${namen(c.vReihe)} liegt in Reihe. Ein Voltmeter hat einen sehr großen Widerstand, deshalb fließt (fast) kein Strom. Ein Voltmeter gehört parallel zum Bauteil.`]);
    else if (c.offen) m.push(['nok', 'Der Stromkreis ist nicht geschlossen. Es fließt kein Strom. Verbinde beide Pole der Batterie über die Bauteile miteinander.']);
    else if (c.nichtSP) m.push(['info', 'Diese Schaltung (zum Beispiel eine Brückenschaltung) lässt sich nicht in Reihen- und Parallelschaltungen zerlegen. Die Werte sind berechnet, ein Schaltbild und einen Rechenweg gibt es hier nicht.']);
    if (c.aParallel && c.aParallel.length && !c.kurzStrom) m.push(['nok', `${namen(c.aParallel)} liegt parallel zu anderen Bauteilen und überbrückt sie. Ein Amperemeter gehört in Reihe, sonst kann es kaputtgehen.`]);
    if (erg.unbenutzt.length) m.push(['info', `Nicht in einem Stromkreis: ${namen(erg.unbenutzt)}. Diese Bauteile haben keine Wirkung.`]);
    if (erg.ueberbrueckt.length) m.push(['info', `Durch Kabel überbrückt: ${namen(erg.ueberbrueckt)}. Durch sie fließt kein Strom.`]);
    return m;
  }
  const kennzahlenHTML = (erg, ok, r, u, i) => {
    const q = x => S.hide ? '?' : x;
    return [['R_{\\mathrm{ges}}', 'Gesamtwiderstand', ok || r != null ? q(fmt(r, 3) + ' Ω') : '–'], ['I_{\\mathrm{ges}}', 'Gesamtstromstärke', ok || r != null ? q(strom(i)) : '–'], ['U_{\\mathrm{ges}}', 'Gesamtspannung', u != null ? q(fmt(u, 3) + ' V') : '–']]
      .map(([sym, name, wert]) => `<div class="kennzahl"><span class="gr">${name} $${sym}$</span><span class="wert">${wert}</span></div>`).join('');
  };
  function tabelle(erg) {
    const zeilen = Object.keys(S.teile).filter(k => S.teile[k].t !== 'W').sort((a, b) => einheiten.indexOf(S.teile[a].t) - einheiten.indexOf(S.teile[b].t) || nr[S.teile[a].t][a] - nr[S.teile[b].t][b]).map(k => {
      const t = S.teile[k], w = werte[k], an = w && w.aktiv, q = x => S.hide ? '?' : x, ab = Math.abs;
      const [einst, u, i] = t.t === 'R' ? [`${fmt(t.v)} Ω`, an ? q(`${fmt(ab(w.U))} V`) : '–', an ? q(strom(w.I)) : '–'] : t.t === 'B' ? [`${fmt(t.v)} V (Quelle)`, '–', an ? q(strom(w.I)) : '–'] : t.t === 'A' ? ['–', '–', an ? q(strom(w.I)) : '–'] : ['–', an ? q(`${fmt(ab(w.U))} V`) : '–', '–'];
      return `<tr><th scope="row">${esc(bez(k))}</th><td>${einst}</td><td>${u}</td><td>${i}</td></tr>`;
    });
    return zeilen.length ? `<div class="tabwrap"><table class="tabelle"><thead><tr><th scope="col">Bauteil</th><th scope="col">Einstellung</th><th scope="col">Spannung</th><th scope="col">Stromstärke</th></tr></thead><tbody>${zeilen.join('')}</tbody></table></div>` : '';
  }
  function wegHTML(erg, r, u, i) {
    if (S.hide) return '<p class="muted">Rechne zuerst selbst. Blende die Ergebnisse danach wieder ein, dann siehst du hier den Rechenweg.</p>';
    if (!erg.baum || !(r > 0) || !isFinite(r) || u == null) return '<p class="muted">Für diese Schaltung gibt es keinen Rechenweg.</p>';
    const V = '\\,\\mathrm{V}', A = '\\,\\mathrm{A}', O = '\\,\\Omega', rw = SC.rechenweg(erg.baum, el => texR(el.key), tx), L = [...rw.zeilen];
    L.push(rw.name ? `Gesamtwiderstand: $R_{\\mathrm{ges}}=${rw.name}=${tx(rw.wert)}${O}$` : `Gesamtwiderstand: $R_{\\mathrm{ges}}=${tx(rw.wert)}${O}$`);
    const bat = SC.blaetter(erg.baum).filter(b => b.typ === 'B'), hb = erg.haupt;
    L.push(bat.length ? `Gesamtspannung: $U_{\\mathrm{ges}}=${texB(hb.key)}${bat.map(b => (b.plusAmAnfang ? '-' : '+') + texB(b.el.key)).join('')}=${tx(hb.v)}${V}${bat.map(b => (b.plusAmAnfang ? '-' : '+') + tx(b.el.v) + V).join('')}=${tx(u)}${V}$` : `Gesamtspannung: $U_{\\mathrm{ges}}=${texB(hb.key)}=${tx(u)}${V}$`);
    L.push(`Gesamtstromstärke: $I_{\\mathrm{ges}}=\\dfrac{U_{\\mathrm{ges}}}{R_{\\mathrm{ges}}}=\\dfrac{${tx(u)}${V}}{${tx(r)}${O}}=${tx(Math.abs(i), 6)}${A}${Math.abs(i) < 0.1 ? '=' + tx(Math.abs(i) * 1000, 4) + '\\,\\mathrm{mA}' : ''}$`);
    return L.map(z => `<p>${z}</p>`).join('');
  }
  function render() {
    nummeriere();
    const erg = SC.analysiereNetz(elemente()); werte = Object.fromEntries(erg.el.map(e => [e.key, e]));
    const c = erg.codes, bat = Object.values(S.teile).filter(t => t.t === 'B').length;
    const rechenbar = !!erg.baum && erg.rges > 0 && isFinite(erg.rges) && !c.kurzStrom && !(c.kurzBatterie && c.kurzBatterie.length);
    let r = null, u = null, i = erg.haupt ? erg.iges : 0;
    if (rechenbar) { r = erg.rges; u = erg.uges; } else if (c.nichtSP && !c.kurzBatterie.length && bat === 1 && Math.abs(i) > 1e-12) { u = erg.haupt.v; r = u / i; }
    $('brettwrap').innerHTML = brettSVG();
    const ms = meldungen(erg), m = $('meldung'); m.innerHTML = ms.map(([a, t]) => `<span class="${a}">${esc(t)}</span>`).join('<br>'); m.hidden = !ms.length; m.className = 'meldung ' + (ms.some(x => x[0] === 'nok') ? 'nok' : '');
    $('schaltbild').innerHTML = erg.baum ? schaltbildSVG(erg) : '<p class="muted">Ein Schaltbild entsteht, sobald ein geschlossener Stromkreis mit Batterie gebaut ist, der aus Reihen- und Parallelschaltungen besteht.</p>';
    $('kennzahlen').innerHTML = kennzahlenHTML(erg, rechenbar, r, u, i); $('tabelle').innerHTML = tabelle(erg); $('weg').innerHTML = wegHTML(erg, r, u, i);
    mathe($('kennzahlen')); mathe($('weg'));
    $('rueck').disabled = !S.verlauf.length; $('leer').disabled = !Object.keys(S.teile).length;
    document.querySelectorAll('[data-wz]').forEach(b => b.setAttribute('aria-pressed', b.dataset.wz === S.wz));
    if (S.refokus) { const f = $('brettwrap').querySelector(`[data-kante="${S.fokus}"]`); if (f) f.focus(); S.refokus = false; }
    return erg;
  }

  // ---------- Bearbeiten ----------
  const sichern = () => { S.verlauf.push(JSON.stringify({ t: S.teile, s: S.seq })); if (S.verlauf.length > 60) S.verlauf.shift(); };
  function eigen() {
    const k = S.sel, t = k && S.teile[k], ok = t && (t.t === 'R' || t.t === 'B');
    $('eigenLeer').hidden = !!t; $('eigenBox').hidden = !t;
    if (!t) return;
    $('eigTitel').textContent = bez(k); $('eigFeld').hidden = !ok; $('drehen').hidden = t.t !== 'B';
    if (ok) { $('wertLabel').textContent = t.t === 'R' ? 'Widerstand in Ω' : 'Spannung in V'; $('wert').value = fmt(t.v, 6); }
  }
  function waehle(key) {
    S.fokus = key; const t = S.teile[key], wz = S.wz;
    if (wz === 'waehlen') S.sel = t ? key : null;
    else if (wz === 'loeschen') { if (!t) return; sichern(); delete S.teile[key]; if (S.sel === key) S.sel = null; }
    else if (wz === 'B' && t && t.t === 'B') { sichern(); t.rev = !t.rev; S.sel = key; }
    else { sichern(); S.teile[key] = wz === 'W' ? { t: 'W' } : wz === 'R' ? { t: 'R', v: S.vor.R, seq: ++S.seq } : wz === 'B' ? { t: 'B', v: S.vor.B, rev: false, seq: ++S.seq } : { t: wz, seq: ++S.seq }; S.sel = (wz === 'R' || wz === 'B') ? key : null; }
    S.refokus = true; eigen(); render();
  }
  $('brettwrap').addEventListener('click', e => { const k = e.target.closest('[data-kante]'); if (k) waehle(k.dataset.kante); });
  $('brettwrap').addEventListener('keydown', e => {
    const k = e.target.closest('[data-kante]'); if (!k) return; let i = KANTEN.indexOf(k.dataset.kante);
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); waehle(k.dataset.kante); return; }
    const sprung = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (sprung === undefined && e.key !== 'Home' && e.key !== 'End') return; e.preventDefault();
    i = e.key === 'Home' ? 0 : e.key === 'End' ? KANTEN.length - 1 : Math.max(0, Math.min(KANTEN.length - 1, i + sprung)); S.fokus = KANTEN[i]; S.refokus = true; render();
  });
  document.querySelectorAll('[data-wz]').forEach(b => b.onclick = () => { S.wz = b.dataset.wz; render(); });
  const zahl = (s, lo, hi) => { const v = parseFloat(String(s).replace(',', '.')); return Number.isFinite(v) && v >= lo && v <= hi ? v : null; };
  $('wert').oninput = e => { const t = S.sel && S.teile[S.sel]; if (!t) return; const v = zahl(e.target.value, 0.1, t.t === 'R' ? 1e6 : 100); $('wertFehler').textContent = v === null ? (t.t === 'R' ? 'Bitte eine Zahl von 0,1 bis 1000000 eingeben.' : 'Bitte eine Zahl von 0,1 bis 100 eingeben.') : ''; if (v !== null) { sichern(); t.v = v; render(); } };
  $('drehen').onclick = () => { const t = S.sel && S.teile[S.sel]; if (t) { sichern(); t.rev = !t.rev; render(); } };
  $('entf').onclick = () => { if (S.sel) { sichern(); delete S.teile[S.sel]; S.sel = null; eigen(); render(); } };
  $('vorB').oninput = e => { const v = zahl(e.target.value, 0.1, 100); if (v !== null) S.vor.B = v; $('vorFehler').textContent = v === null ? 'Batterie: 0,1 bis 100 V.' : ''; };
  $('vorR').oninput = e => { const v = zahl(e.target.value, 0.1, 1e6); if (v !== null) S.vor.R = v; $('vorFehler').textContent = v === null ? 'Widerstand: 0,1 bis 1000000 Ω.' : ''; };
  $('rueck').onclick = () => { const s = S.verlauf.pop(); if (!s) return; const o = JSON.parse(s); S.teile = o.t; S.seq = o.s; if (S.sel && !S.teile[S.sel]) S.sel = null; eigen(); render(); };
  $('leer').onclick = () => { sichern(); S.teile = {}; S.sel = null; eigen(); render(); };
  $('hide').onchange = e => { S.hide = e.target.checked; render(); };

  // ---------- Beispiele ----------
  const rail = (zeile, c1, c2) => { const l = []; for (let c = c1; c < c2; c++) l.push([`h:${c}:${zeile}`, 'W']); return l; };
  const BEISPIEL = {
    reihe: [['v:1:1', 'B', 6], ['v:1:2', 'W'], ['h:1:1', 'W'], ['h:2:1', 'R', 100], ['h:3:1', 'W'], ['h:4:1', 'R', 220], ['h:5:1', 'W'], ['v:6:1', 'W'], ['v:6:2', 'W'], ...rail(3, 1, 6)],
    parallel: [['v:1:1', 'B', 6], ['v:1:2', 'W'], ...rail(1, 1, 5), ...rail(3, 1, 5), ['v:3:1', 'R', 200], ['v:3:2', 'W'], ['v:5:1', 'R', 300], ['v:5:2', 'W']],
    gemischt: [['v:1:1', 'B', 6], ['v:1:2', 'W'], ['h:1:1', 'W'], ['h:2:1', 'R', 100], ['h:3:1', 'W'], ['h:4:1', 'W'], ['h:5:1', 'W'], ...rail(3, 1, 6), ['v:4:1', 'R', 300], ['v:4:2', 'W'], ['v:6:1', 'R', 600], ['v:6:2', 'W']],
    messung: [['v:1:1', 'B', 6], ['v:1:2', 'W'], ['h:1:1', 'W'], ['h:2:1', 'A'], ['h:3:1', 'R', 100], ['h:4:1', 'R', 200], ['h:5:1', 'W'], ['v:6:1', 'W'], ['v:6:2', 'W'], ...rail(3, 1, 6), ['v:3:1', 'W'], ['h:3:2', 'V'], ['v:4:1', 'W']]
  };
  document.querySelectorAll('[data-beispiel]').forEach(b => b.onclick = () => {
    sichern(); S.teile = {}; S.seq = 0; S.sel = null;
    for (const [k, t, v] of BEISPIEL[b.dataset.beispiel]) S.teile[k] = t === 'R' ? { t, v, seq: ++S.seq } : t === 'B' ? { t, v, rev: false, seq: ++S.seq } : t === 'W' ? { t } : { t, seq: ++S.seq };
    eigen(); render();
  });
  LernLab.schaltungBrett = { S, render, waehle };   // für Tests
  eigen(); render();
})();
