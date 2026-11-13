// Aussagen-Check: vergleicht einen Schülertext mit einem Erwartungshorizont (ohne KI, komplett im Browser).
// Rechtschreibung und Zeichensetzung werden nicht bewertet: Umlaute/ß werden vereinheitlicht, einzelne Tippfehler in Begriffen toleriert.
// Aufbau eines Teils: { ort: "text" | "satz" | "satz2", gruppen: [[Begriffe …], …] } oder { varianten: [gruppen, gruppen] }, dazu lob, frage.
//   ort "text": irgendwo im Text · "satz": alles im selben Satz · "satz2": innerhalb von zwei aufeinanderfolgenden Sätzen.
//   Ein Teil gilt als erfüllt, wenn aus JEDER Gruppe mindestens ein Begriff im selben Fenster vorkommt.
//   Begriffe: Wortstamm (findet auch Zusammensetzungen und Endungen), "=fi" nur als ganzes Wort, Begriffe mit Leerzeichen/Ziffern als Textstück.
(() => {
  const norm = s => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  const normT = t => t[0] === '=' ? '=' + norm(t.slice(1)) : norm(t);
  const lev = (a, b) => { let p = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[b.length]; };
  const tol = l => l < 6 ? 0 : l < 10 ? 1 : 2;
  const cache = new Map();
  const fuzzy = (t, term) => { const k = t + '|' + term; if (cache.has(k)) return cache.get(k); const T = tol(term.length), n = term.length; let r = false; // nur Wortanfang, gleicher Anfangsbuchstabe (Tippfehler passieren selten am ersten Buchstaben)
    if (t[0] === term[0]) for (let L = Math.max(3, n - T); L <= n + T && !r; L++) if (t.length >= L && lev(t.slice(0, L), term) <= T) r = true;
    cache.set(k, r); return r; };
  const hat = (term, w) => {
    if (term[0] === '=') return w.t.includes(term.slice(1));
    if (/[\s\d]/.test(term)) return w.s.replace(/\s+/g, ' ').includes(term) || w.s.replace(/\s/g, '').includes(term.replace(/\s/g, ''));
    if (w.t.some(t => t.includes(term))) return true;
    return tol(term.length) > 0 && w.t.some(t => fuzzy(t, term));
  };
  const mk = s => { const n = norm(s); return { s: n, t: n.split(/[^a-z0-9]+/).filter(Boolean) }; };
  const fenster = text => { const sents = text.split(/(?<=[.!?;])\s+|\n+/).map(s => s.trim()).filter(Boolean);
    return { text: [mk(text)], satz: sents.map(mk), satz2: sents.map((s, i) => mk(s + ' ' + (sents[i + 1] || ''))), sents }; };
  const teilOk = (teil, F) => { const v = (teil.varianten || [teil.gruppen]).map(g => g.map(gr => gr.map(normT)));
    return (F[teil.ort || 'satz'] || []).some(w => v.some(gr => gr.every(g => g.some(t => hat(t, w))))); };

  function pruefe(text, cfg) {
    const F = fenster(text || '');
    const aussagen = (cfg.aussagen || []).map(a => {
      const teile = a.teile.map(t => ({ ok: teilOk(t, F), lob: t.lob || '', frage: t.frage || '' })), n = teile.filter(t => t.ok).length;
      return { id: a.id, titel: a.titel, leitfrage: a.leitfrage, lob: a.lob || '', teile, status: n === teile.length ? 'ok' : n ? 'teil' : 'fehlt' };
    });
    const zusaetze = (cfg.zusaetze || []).map(z => ({ id: z.id, titel: z.titel, leitfrage: z.leitfrage, lob: z.lob || '', frage: z.frage || '', ok: teilOk(z.teil, F) }));
    const hinweise = [];
    (cfg.fehlvorstellungen || []).forEach(h => { const m = new RegExp(h.muster), ex = h.ausser ? new RegExp(h.ausser) : null;
      if (F.sents.some(s => { const n = norm(s); return m.test(n) && !(ex && ex.test(n)); }) && !hinweise.includes(h.text)) hinweise.push(h.text); });
    return { aussagen, zusaetze, hinweise };
  }
  const api = { pruefe, norm };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') (window.LernLab = window.LernLab || {}).textcheck = api;
})();
