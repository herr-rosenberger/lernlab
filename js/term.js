// Sicherer Formelparser (ohne eval) für Lern-Apps. Liest Eingaben wie "1/2*e^(2x+1)", "ln|x|", "-x^2/2 + C".
// Funktionen: sin cos tan exp ln sqrt abs arctan · Konstanten: e pi · Variable: x · "C" zählt als 0.
// ln ist streng: ln(y) gilt nur für y>0. Für negative Werte braucht man Betragsstriche, also ln|y|.
(() => {
  const FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, ln: v => v > 0 ? Math.log(v) : NaN, sqrt: Math.sqrt, abs: Math.abs, arctan: Math.atan };
  const KONST = { e: Math.E, pi: Math.PI, c: 0 };
  const NAMEN = ['arctan', 'sqrt', 'sin', 'cos', 'tan', 'exp', 'abs', 'ln', 'pi', 'x', 'e', 'c'];
  const STANDARD = [-3.2, -1.7, -0.6, 0.5, 1.4, 2.6];

  function tokens(s) {
    s = s.replace(/−/g, '-').replace(/[·×]/g, '*').replace(/²/g, '^2').replace(/³/g, '^3').replace(/π/g, 'pi').replace(/\s+/g, '');
    const re = /(\d+(?:[.,]\d+)?)|([A-Za-z]+)|([-+*\/^()|])/y, t = [];
    for (let i = 0; i < s.length;) {
      re.lastIndex = i; const m = re.exec(s);
      if (!m) throw new Error(`Zeichen „${s[i]}“ verstehe ich nicht`);
      i = re.lastIndex;
      if (m[1] !== undefined) t.push({ n: parseFloat(m[1].replace(',', '.')) });
      else if (m[2]) { // "xe" oder "2xsin" in bekannte Namen zerlegen
        let rest = m[2].toLowerCase();
        while (rest) { const n = NAMEN.find(k => rest.startsWith(k)); if (!n) throw new Error(`„${rest}“ verstehe ich nicht`); t.push({ id: n }); rest = rest.slice(n.length); }
      } else t.push({ op: m[3] });
    }
    return t;
  }

  function parse(src) {
    const t = tokens(String(src).replace(/^\s*[Ff]\s*\(\s*x\s*\)\s*=/, '')); let i = 0;
    const op = o => t[i] && t[i].op === o;
    const expr = () => { let f = term(); while (op('+') || op('-')) { const m = t[i++].op, g = term(), h = f; f = m === '+' ? x => h(x) + g(x) : x => h(x) - g(x); } return f; };
    const term = () => {
      let f = unary();
      for (;;) {
        if (op('*') || op('/')) { const m = t[i++].op, g = unary(), h = f; f = m === '*' ? x => h(x) * g(x) : x => h(x) / g(x); }
        else if (t[i] && (t[i].id || op('('))) { const g = unary(), h = f; f = x => h(x) * g(x); } // 2x, 3(x+1)
        else return f;
      }
    };
    const unary = () => { if (op('-')) { i++; const f = unary(); return x => -f(x); } if (op('+')) { i++; return unary(); } return power(); };
    const power = () => { const b = primary(); if (op('^')) { i++; const e = unary(); return x => Math.pow(b(x), e(x)); } return b; };
    const primary = () => {
      const k = t[i++]; if (!k) throw new Error('Der Ausdruck ist unvollständig');
      if (k.n !== undefined) return () => k.n;
      if (k.id) { if (FN[k.id]) { const a = primary(), fn = FN[k.id]; return x => fn(a(x)); } return k.id === 'x' ? x => x : () => KONST[k.id]; }
      if (k.op === '(') { const f = expr(); if (!op(')')) throw new Error('Eine Klammer fehlt'); i++; return f; }
      if (k.op === '|') { const f = expr(); if (!op('|')) throw new Error('Ein Betragsstrich fehlt'); i++; return x => Math.abs(f(x)); }
      throw new Error(`Hier steht „${k.op}“ an falscher Stelle`);
    };
    const f = expr(); if (i < t.length) throw new Error('Der Ausdruck ist unvollständig oder hat ein Zeichen zu viel');
    return f;
  }

  // Zahl oder konstanter Term (z. B. "0,5", "ln(2)", "e-1"); sonst NaN
  const zahl = s => {
    s = String(s).replace(/\s/g, '');
    if (/^[+-]?\d+([.,]\d+)?$/.test(s)) return parseFloat(s.replace(',', '.'));
    try { const f = parse(s), a = f(0); return a === f(1) && Number.isFinite(a) ? a : NaN; } catch (e) { return NaN; }
  };

  // Ist "eingabe" eine Stammfunktion zu "referenz"? Beide dürfen sich nur um eine Konstante unterscheiden.
  const istStammfunktion = (eingabe, referenz, punkte = STANDARD) => {
    const g = parse(eingabe), r = parse(referenz); let d0 = null;
    for (const x of punkte) {
      const a = g(x), b = r(x); if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
      const d = a - b; if (d0 === null) d0 = d; else if (Math.abs(d - d0) > 1e-6 * (1 + Math.abs(d0) + Math.abs(b))) return false;
    }
    return true;
  };

  const api = { parse, zahl, istStammfunktion, STANDARD };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') (window.LernLab = window.LernLab || {}).term = api;
})();
