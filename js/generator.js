// Gemeinsame Hilfen für Aufgabengeneratoren (laufen im Browser und in Node für die Qualitätsprüfung).
// Ein Generator ist ein Objekt {id, titel, erzeuge()}, das eine Aufgabe im Format der Lern-Apps liefert (oder null, wenn die Zufallswahl nicht passte).
(() => {
  const LL = typeof window !== 'undefined' ? (window.LernLab = window.LernLab || {}) : (globalThis.LernLab = globalThis.LernLab || {});
  const rnd = {
    zufall: () => Math.random(),                                              // für Tests austauschbar
    int: (a, b) => a + Math.floor(rnd.zufall() * (b - a + 1)),
    pick: l => l[Math.floor(rnd.zufall() * l.length)],
    mische: l => { l = [...l]; for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rnd.zufall() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; }
  };
  const rund = (v, d) => +Number(v).toFixed(d);
  const sauber = (v, d) => Math.abs(v - rund(v, d)) < 1e-9;                  // höchstens d Nachkommastellen
  const z = (v, d = 6) => String(rund(v, d)).replace('.', ',');              // Text mit Komma: 0,25
  const tx = (v, d = 6) => z(v, d).replace(',', '{,}');                      // TeX mit Dezimalkomma: 0{,}25
  // typische Fehlwerte aufräumen: nur endliche, nicht in der Nähe der richtigen Lösung, ohne Dopplungen
  const bereinige = (richtig, tol, liste) => liste
    .filter(d => Number.isFinite(d.wert) && Math.abs(d.wert - richtig) > Math.max(tol, Math.abs(richtig) * 0.012))
    .filter((d, i, a) => a.findIndex(x => Math.abs(x.wert - d.wert) <= Math.abs(d.wert) * 0.012) === i);
  LL.gen = { rnd, rund, sauber, z, tx, bereinige };
  if (typeof module !== 'undefined') module.exports = LL.gen;
})();
