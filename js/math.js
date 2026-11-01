// Formeln mit KaTeX (lokal, lädt erst bei Bedarf). Schreibweise: $a^2+b^2=c^2$ im Text oder $$…$$ als eigene Zeile.
// Nutzung: LernLab.mathe(element) nach dem Einfügen von Text. Dollarbeträge im Text bitte als "Euro" ausschreiben, da $ als Formelbegrenzer gilt.
window.LernLab = window.LernLab || {};
(() => {
  const base = new URL('../assets/katex/', document.currentScript.src);
  let geladen;
  const skript = f => new Promise((ok, fehler) => { const s = document.createElement('script'); s.src = base + f; s.onload = ok; s.onerror = fehler; document.head.append(s); });
  LernLab.mathe = (el = document.body) => {
    if (!/\$|\\\(/.test(el.textContent)) return Promise.resolve();
    geladen = geladen || (() => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = base + 'katex.min.css'; document.head.append(l);
      return skript('katex.min.js').then(() => skript('auto-render.min.js'));
    })();
    return geladen.then(() => renderMathInElement(el, {
      throwOnError: false,
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false }]
    }));
  };
})();
