// Aufgabengenerator für „Rechnen mit R = U/I“: zehn Aufgabenfamilien mit zufälligen, „schönen“ Zahlen.
// Die Lösung wird immer berechnet. Zu typischen Fehlern gibt es eine Diagnose (diagnosen / optionHinweise), zu jeder Aufgabe einen Rechenweg.
(() => {
  const { rnd, rund, sauber, z, tx, bereinige } = LernLab.gen;
  const V = '\\,\\mathrm{V}', A = '\\,\\mathrm{A}', mA = '\\,\\mathrm{mA}', O = '\\,\\Omega', kO = '\\,\\mathrm{k}\\Omega';
  const KLEIN = [['Ein Lämpchen', [3, 4.5, 6]], ['Ein Spielzeugmotor', [3, 4.5, 6, 9]], ['Eine Taschenlampenbirne', [3, 4.5]], ['Ein Widerstand', [3, 5, 9, 12]], ['Eine Heizspirale', [12, 24]]];
  const NETZ = ['Ein Toaster', 'Ein Wasserkocher', 'Ein Heizlüfter', 'Eine Kochplatte'];
  const I_KLEIN = [0.01, 0.02, 0.025, 0.03, 0.04, 0.05, 0.06, 0.075, 0.08, 0.09, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 1, 1.5, 2];
  const I_NETZ = [0.2, 0.5, 1, 2, 2.5, 4, 5, 10];
  const R_KLEIN = [10, 12, 15, 20, 22, 24, 25, 30, 36, 40, 47, 48, 50, 60, 75, 80, 100, 120, 150, 180, 220, 240, 300, 330, 470, 600, 680, 1000, 1200, 1500, 2200, 3300, 4700];
  const R_NETZ = [23, 46, 57.5, 92, 115, 230, 460, 1150];
  const fertig = (t, diag) => { if (t.typ === 'zahl') t.diagnosen = bereinige(t.richtig, t.toleranz, diag); return t; };
  const tol = (r, rel = 0.005, min = 0.0005) => Math.max(Math.abs(r) * rel, min);

  const G = [
    // ---------- Einheiten umrechnen ----------
    { id: 'umrechnen', titel: 'Einheiten umrechnen', erzeuge() {
      const art = rnd.pick(['mA>A', 'A>mA', 'kO>O', 'O>kO']);
      const W = { 'mA>A': [5, 12, 15, 20, 25, 35, 45, 60, 75, 120, 250, 350, 480], 'A>mA': [0.015, 0.02, 0.05, 0.2, 0.35, 0.8, 1.2, 2.5], 'kO>O': [0.33, 0.47, 0.68, 1.2, 2.2, 3.3, 4.7, 6.8, 10], 'O>kO': [47, 150, 220, 470, 680, 1500, 3300, 4700] }[art];
      const [von, bis] = { 'mA>A': [mA, A], 'A>mA': [A, mA], 'kO>O': [kO, O], 'O>kO': [O, kO] }[art], f = art === 'mA>A' || art === 'O>kO' ? 0.001 : 1000;
      const v = rnd.pick(W), r = rund(v * f, 6), kl = f < 1, nv = { mA: 'mA', A: 'A', kO: 'kΩ', O: 'Ω' }[art.split('>')[0]], nb = { mA: 'mA', A: 'A', kO: 'kΩ', O: 'Ω' }[art.split('>')[1]];
      const hint = { 'mA>A': 'Milli bedeutet ein Tausendstel: $1' + mA + '=0{,}001' + A + '$.', 'A>mA': '$1' + A + '=1000' + mA + '$.', 'kO>O': 'Kilo bedeutet tausend: $1' + kO + '=1000' + O + '$.', 'O>kO': '$1' + kO + '=1000' + O + '$.' }[art] + (r >= 1000 ? ' Schreibe große Zahlen ohne Punkt, zum Beispiel 4700.' : '');
      const tz = (kl ? '0{,}001' : '1000');
      return fertig({ typ: 'zahl', frage: `Wandle um: $${tx(v)}${von}$ sind wie viel ${nb}?`, richtig: r, toleranz: tol(r, 1e-4, 1e-6), einheit: nb, hinweis: hint,
        erklaerung: `$1${von}=${tz}${bis}$, also $${tx(v)}${von}=${tx(v)}\\cdot${tz}${bis}=${tx(r)}${bis}$. Das Ergebnis ist ${kl ? 'kleiner' : 'größer'} als die Ausgangszahl.` },
        [{ wert: rund(v / f, 6), text: `Du hast in die falsche Richtung umgerechnet. Beim Wechsel von ${nv} zu ${nb} wird die Zahl ${kl ? 'kleiner' : 'größer'}.` },
         { wert: r * 10, text: `Das Komma wurde um eine Stelle zu weit nach rechts verschoben. Zwischen ${nv} und ${nb} verschiebt man das Komma um drei Stellen.` },
         { wert: r / 10, text: `Das Komma wurde um eine Stelle zu weit nach links verschoben. Zwischen ${nv} und ${nb} verschiebt man das Komma um drei Stellen.` }]);
    } },
    // ---------- Widerstand berechnen ----------
    { id: 'widerstand', titel: 'Widerstand berechnen', erzeuge() {
      const netz = rnd.zufall() < 0.3, [name, us] = netz ? [rnd.pick(NETZ), [230]] : rnd.pick(KLEIN); let U, I, R = null;
      for (let n = 0; n < 300 && R === null; n++) { U = rnd.pick(us); I = rnd.pick(netz ? I_NETZ : I_KLEIN); const r = U / I; if (sauber(r, 1) && r >= 1 && r <= 5000) R = r; }
      if (R === null) return null;
      const inMA = !netz && I < 0.5 && rnd.zufall() < 0.55, iMA = rund(I * 1000, 3), inKO = inMA && R >= 1000 && sauber(R / 1000, 3) && rnd.zufall() < 0.5;
      const ang = inMA ? `$${tx(iMA)}${mA}$` : `$${tx(I)}${A}$`, richtig = inKO ? rund(R / 1000, 4) : R;
      const frage = `${name} liegt ${netz ? 'an der Netzspannung von' : 'an'} $${tx(U)}${V}$, es fließen ${ang}. Berechne $R$ in ${inKO ? 'kΩ' : 'Ω'}.`;
      const rw = `$R=\\dfrac{U}{I}=\\dfrac{${tx(U)}${V}}{${tx(I)}${A}}=${tx(R)}${O}$`;
      const erk = (inMA ? `$${tx(iMA)}${mA}=${tx(I)}${A}$, also ` : '') + rw + (inKO ? `, das sind $${tx(richtig)}${kO}$. Mit V und mA kommt der Widerstand direkt in kΩ heraus.` : '');
      const d = [];
      if (inMA && !inKO) d.push({ wert: U / iMA, text: `Die Stromstärke wurde nicht von mA in A umgerechnet: $${tx(iMA)}${mA}=${tx(I)}${A}$. Wer mit mA rechnet, erhält das Ergebnis in kΩ.` });
      if (inKO) d.push({ wert: R, text: `Gefragt ist das Ergebnis in kΩ, nicht in Ω. Es gilt $1${kO}=1000${O}$.` });
      d.push({ wert: I / U, text: 'Die Gleichung wurde umgedreht. Der Widerstand ist die Spannung geteilt durch die Stromstärke: $R=\\dfrac{U}{I}$.' }, { wert: U * I, text: 'Es wurde multipliziert statt geteilt. Es gilt $R=\\dfrac{U}{I}$.' },
        { wert: richtig * 1000, text: 'Prüfe die Einheit: Das Ergebnis ist um den Faktor 1000 zu groß.' }, { wert: richtig / 1000, text: 'Prüfe die Einheit: Das Ergebnis ist um den Faktor 1000 zu klein.' });
      return fertig({ typ: 'zahl', frage, richtig, toleranz: tol(richtig), einheit: inKO ? 'kΩ' : 'Ω', hinweis: inKO ? 'V durch mA ergibt kΩ.' : inMA ? `Wandle zuerst die Stromstärke in A um: $1${mA}=0{,}001${A}$.` : '$R=\\dfrac{U}{I}$', erklaerung: erk }, d);
    } },
    // ---------- Stromstärke berechnen ----------
    { id: 'strom', titel: 'Stromstärke berechnen', erzeuge() {
      const netz = rnd.zufall() < 0.25, [name, us] = netz ? [rnd.pick(NETZ), [230]] : rnd.pick(KLEIN); let U, R, I = null;
      for (let n = 0; n < 300 && I === null; n++) { U = rnd.pick(us); R = rnd.pick(netz ? R_NETZ : R_KLEIN); const i = U / R; if ((sauber(i, 3) || sauber(i * 1000, 1)) && i >= 0.002 && i <= 10) I = i; }
      if (I === null) return null;
      const mAfrage = !sauber(I, 3) || I < 0.1 && rnd.zufall() < 0.6, Rk = R >= 1000 && sauber(R / 1000, 3) && rnd.zufall() < 0.6;
      const richtig = mAfrage ? rund(I * 1000, 1) : rund(I, 3), ang = Rk ? `$${tx(R / 1000)}${kO}$` : `$${tx(R)}${O}$`;
      const frage = `${name} hat den Widerstand ${ang} und liegt ${netz ? 'an der Netzspannung von' : 'an'} $${tx(U)}${V}$. Berechne $I$ in ${mAfrage ? 'mA' : 'A'}.`;
      const erk = (Rk ? `$${tx(R / 1000)}${kO}=${tx(R)}${O}$, also ` : '') + `$I=\\dfrac{U}{R}=\\dfrac{${tx(U)}${V}}{${tx(R)}${O}}=${tx(I, 4)}${A}$` + (mAfrage ? `, das sind $${tx(richtig)}${mA}$` : '') + (Rk && mAfrage ? '. Mit V und kΩ kommt die Stromstärke direkt in mA heraus.' : '.');
      const d = [];
      if (Rk && !mAfrage) d.push({ wert: U / (R / 1000), text: `Der Widerstand wurde nicht von kΩ in Ω umgerechnet: $${tx(R / 1000)}${kO}=${tx(R)}${O}$. Mit kΩ erhält man die Stromstärke in mA.` });
      d.push({ wert: U * R, text: 'Es wurde multipliziert statt geteilt. Es gilt $I=\\dfrac{U}{R}$.' }, { wert: R / U, text: 'Die Gleichung wurde umgedreht. Die Stromstärke ist die Spannung geteilt durch den Widerstand: $I=\\dfrac{U}{R}$.' },
        mAfrage ? { wert: richtig / 1000, text: 'Prüfe die Einheit: Du hast offenbar in A gerechnet, gefragt sind mA. Es gilt $1' + A + '=1000' + mA + '$.' } : { wert: richtig * 1000, text: 'Prüfe die Einheit: Du hast offenbar in mA gerechnet, gefragt sind A. Es gilt $1' + mA + '=0{,}001' + A + '$.' });
      return fertig({ typ: 'zahl', frage, richtig, toleranz: tol(richtig, 0.005, mAfrage ? 0.05 : 0.0005), einheit: mAfrage ? 'mA' : 'A', hinweis: Rk ? (mAfrage ? 'Mit V und kΩ kommt die Stromstärke direkt in mA heraus.' : 'Wandle zuerst den Widerstand in Ω um.') : '$I=\\dfrac{U}{R}$', erklaerung: erk }, d);
    } },
    // ---------- Spannung berechnen ----------
    { id: 'spannung', titel: 'Spannung berechnen', erzeuge() {
      let R, I, U = null;
      for (let n = 0; n < 300 && U === null; n++) { R = rnd.pick(R_KLEIN); I = rnd.pick(I_KLEIN); const u = R * I; if (sauber(u, 2) && u >= 0.5 && u <= 60) U = u; }
      if (U === null) return null;
      const Rk = R >= 1000 && sauber(R / 1000, 3) && rnd.zufall() < 0.6, iMA = rund(I * 1000, 3), inMA = I < 0.5 && sauber(iMA, 3) && rnd.zufall() < 0.6;
      const Rt = Rk ? `$${tx(R / 1000)}${kO}$` : `$${tx(R)}${O}$`, It = inMA ? `$${tx(iMA)}${mA}$` : `$${tx(I)}${A}$`;
      const pre = [Rk ? `$${tx(R / 1000)}${kO}=${tx(R)}${O}$` : '', inMA ? `$${tx(iMA)}${mA}=${tx(I)}${A}$` : ''].filter(Boolean).join(' und ');
      const erk = (pre ? pre + ', also ' : '') + `$U=R\\cdot I=${tx(R)}${O}\\cdot${tx(I)}${A}=${tx(U, 3)}${V}$` + (Rk && inMA ? '. Mit kΩ und mA kommt die Spannung direkt in V heraus.' : '.');
      const d = [{ wert: R / I, text: 'Es wurde geteilt statt multipliziert. Es gilt $U=R\\cdot I$.' }];
      if (inMA && !Rk) d.push({ wert: R * iMA, text: `Die Stromstärke wurde nicht von mA in A umgerechnet: $${tx(iMA)}${mA}=${tx(I)}${A}$.` });
      if (Rk && !inMA) d.push({ wert: R / 1000 * I, text: `Der Widerstand wurde nicht von kΩ in Ω umgerechnet: $${tx(R / 1000)}${kO}=${tx(R)}${O}$.` });
      if (Rk && inMA) d.push({ wert: R * iMA, text: 'Wer kΩ in Ω umrechnet, muss auch mA in A umrechnen. Oder man rechnet beide Größen unverändert, dann kommt die Spannung in V heraus.' });
      d.push({ wert: U * 1000, text: 'Prüfe die Einheiten: Das Ergebnis ist um den Faktor 1000 zu groß.' }, { wert: U / 1000, text: 'Prüfe die Einheiten: Das Ergebnis ist um den Faktor 1000 zu klein.' });
      return fertig({ typ: 'zahl', frage: `${rnd.pick(['Ein Bauteil', 'Ein Heizdraht', 'Eine Glühlampe'])} mit dem Widerstand ${Rt} wird von ${It} durchflossen. Berechne die anliegende Spannung $U$ in V.`, richtig: rund(U, 3), toleranz: tol(U, 0.005, 0.02), einheit: 'V', hinweis: '$U=R\\cdot I$' + (pre ? ' Rechne zuerst in Ω bzw. A um.' : ''), erklaerung: erk }, d);
    } },
    // ---------- Welche Rechnung? ----------
    { id: 'ansatz', titel: 'Passende Rechnung wählen', erzeuge() {
      let U, I, R = null;
      for (let n = 0; n < 300 && R === null; n++) { U = rnd.pick([3, 6, 9, 12, 24]); I = rnd.pick([0.05, 0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 1, 2]); const r = U / I; if (sauber(r, 1) && r >= 3) R = r; }
      if (R === null) return null;
      const u = `${tx(U)}${V}`, i = `${tx(I)}${A}`, r = `${tx(R)}${O}`, ziel = rnd.pick(['R', 'I', 'U']);
      const T = {
        R: { geg: `liegt an $${u}$, es fließen $${i}$`, gesucht: 'den Widerstand $R$', opt: [`\\dfrac{${u}}{${i}}`, `\\dfrac{${i}}{${u}}`, `${u}\\cdot${i}`, `${u}-${i}`], hint: ['', 'Das ist der Kehrwert. Der Widerstand ist die Spannung geteilt durch die Stromstärke, also $\\dfrac{U}{I}$.', 'Multiplizieren passt nicht: Bei größerer Stromstärke wird der Widerstand bei gleicher Spannung kleiner.', 'Spannung und Stromstärke sind verschiedene Größen, man darf sie nicht subtrahieren.'], erk: `Aus $R=\\dfrac{U}{I}$ folgt $R=\\dfrac{${u}}{${i}}=${r}$.` },
        I: { geg: `liegt an $${u}$ und hat den Widerstand $${r}$`, gesucht: 'die Stromstärke $I$', opt: [`\\dfrac{${u}}{${r}}`, `\\dfrac{${r}}{${u}}`, `${u}\\cdot${r}`, `${u}-${r}`], hint: ['', 'Das ist der Kehrwert. Die Stromstärke ist die Spannung geteilt durch den Widerstand, also $\\dfrac{U}{R}$.', 'Multiplizieren passt nicht: Bei größerem Widerstand wird die Stromstärke bei gleicher Spannung kleiner.', 'Spannung und Widerstand sind verschiedene Größen, man darf sie nicht subtrahieren.'], erk: `Aus $R=\\dfrac{U}{I}$ folgt $I=\\dfrac{U}{R}=\\dfrac{${u}}{${r}}=${i}$.` },
        U: { geg: `hat den Widerstand $${r}$, es fließen $${i}$`, gesucht: 'die Spannung $U$', opt: [`${r}\\cdot${i}`, `\\dfrac{${r}}{${i}}`, `\\dfrac{${i}}{${r}}`, `${r}+${i}`], hint: ['', 'Geteilt durch die Stromstärke ergäbe der Widerstand, nicht die Spannung. Aus $R=\\dfrac{U}{I}$ folgt $U=R\\cdot I$.', 'So würde man die Spannung nicht erhalten. Aus $R=\\dfrac{U}{I}$ folgt $U=R\\cdot I$.', 'Widerstand und Stromstärke sind verschiedene Größen, man darf sie nicht addieren.'], erk: `Aus $R=\\dfrac{U}{I}$ folgt $U=R\\cdot I=${r}\\cdot${i}=${u}$.` }
      }[ziel];
      return { typ: 'auswahl', frage: `Ein Bauteil ${T.geg}. Welche Rechnung liefert ${T.gesucht}?`, optionen: T.opt.map(o => `$${o}$`), optionHinweise: T.hint, richtig: 0, erklaerung: T.erk };
    } },
    // ---------- Welche Einheit? (mit Zahlen, das Ergebnis wird mitberechnet) ----------
    { id: 'einheit', titel: 'Einheiten bestimmen', erzeuge() {
      const C = [
        { a: [6, 12, 24], b: [0.2, 0.5, 2], t: (x, y) => `\\dfrac{${tx(x)}${V}}{${tx(y)}${A}}`, w: (x, y) => x / y, e: O, k: 'Ohm' },
        { a: [3, 6, 9, 12], b: [2, 3, 4, 6], t: (x, y) => `\\dfrac{${tx(x)}${V}}{${tx(y)}${mA}}`, w: (x, y) => x / y, e: kO, k: 'Kiloohm' },
        { a: [6, 12, 24], b: [2, 3, 4, 6], t: (x, y) => `\\dfrac{${tx(x)}${V}}{${tx(y)}${kO}}`, w: (x, y) => x / y, e: mA, k: 'Milliampere' },
        { a: [6, 12, 24], b: [12, 24, 30, 60], t: (x, y) => `\\dfrac{${tx(x)}${V}}{${tx(y)}${O}}`, w: (x, y) => x / y, e: A, k: 'Ampere' },
        { a: [0.2, 0.5, 2], b: [10, 20, 50, 100], t: (x, y) => `${tx(x)}${A}\\cdot${tx(y)}${O}`, w: (x, y) => x * y, e: V, k: 'Volt' },
        { a: [2, 5, 10, 20], b: [1, 1.5, 2, 3.3], t: (x, y) => `${tx(x)}${mA}\\cdot${tx(y)}${kO}`, w: (x, y) => x * y, e: V, k: 'Volt' }
      ];
      const c = rnd.pick(C); let x, y, r = null;
      for (let n = 0; n < 100 && r === null; n++) { x = rnd.pick(c.a); y = rnd.pick(c.b); const v = c.w(x, y); if (sauber(v, 2)) r = v; }
      if (r === null) return null;
      const POOL = ['\\Omega', '\\mathrm{k}\\Omega', '\\mathrm{m}\\Omega', '\\mathrm{V}', '\\mathrm{mV}', '\\mathrm{A}', '\\mathrm{mA}'].map(e => `\\,${e}`).filter(e => e !== c.e);
      const erk = { 'Ohm': 'Das ist die Definition der Einheit Ohm: $1\\,\\Omega=1\\,\\dfrac{\\mathrm{V}}{\\mathrm{A}}$.', 'Kiloohm': 'Spannung in V durch Stromstärke in mA ergibt den Widerstand in kΩ, denn $1\\,\\dfrac{\\mathrm{V}}{\\mathrm{mA}}=1000\\,\\Omega=1\\,\\mathrm{k}\\Omega$.',
        'Milliampere': 'Spannung in V durch Widerstand in kΩ ergibt die Stromstärke in mA, denn $1\\,\\dfrac{\\mathrm{V}}{\\mathrm{k}\\Omega}=0{,}001\\,\\mathrm{A}=1\\,\\mathrm{mA}$.', 'Ampere': 'Aus $I=\\dfrac{U}{R}$ folgt: $\\dfrac{\\mathrm{V}}{\\Omega}=\\mathrm{A}$.',
        'Volt': c.e === V && c.t(1, 1).includes('mathrm{mA}') ? 'Stromstärke in mA mal Widerstand in kΩ ergibt die Spannung in V, denn $1\\,\\mathrm{mA}\\cdot1\\,\\mathrm{k}\\Omega=0{,}001\\,\\mathrm{A}\\cdot1000\\,\\Omega=1\\,\\mathrm{V}$.' : 'Aus $U=R\\cdot I$ folgt: $\\mathrm{A}\\cdot\\Omega=\\mathrm{V}$.' }[c.k];
      return { typ: 'auswahl', frage: `Welche Einheit hat das Ergebnis von $${c.t(x, y)}$?`, optionen: [c.e, ...rnd.mische(POOL).slice(0, 3)].map(e => `$${e.replace(/^\\,/, '')}$`), richtig: 0, erklaerung: `${erk} Rechnung: $${c.t(x, y)}=${tx(r)}${c.e}$.` };
    } },
    // ---------- Plausibilität ----------
    { id: 'plausibel', titel: 'Ergebnis abschätzen', erzeuge() {
      let U, I, R = null;
      for (let n = 0; n < 300 && R === null; n++) { U = rnd.pick([3, 4.5, 6, 9, 12, 24]); I = rnd.pick([0.05, 0.1, 0.2, 0.25, 0.3, 0.5, 1, 2]); const r = U / I; if (sauber(r, 1) && r >= 3 && r <= 500) R = r; }
      if (R === null) return null;
      const falsch = [R / 10, R * 10, R * 100].filter(x => sauber(x, 2) && x >= 0.1), opt = [R, ...falsch].slice(0, 4);
      if (opt.length < 3) return null;
      return { typ: 'auswahl', frage: `Ein Bauteil liegt an $${tx(U)}${V}$, es fließen $${tx(I)}${A}$. Welcher Widerstand ist plausibel?`, optionen: opt.map(x => `etwa $${tx(x)}${O}$`),
        optionHinweise: opt.map((x, k) => k ? `Probe: $R\\cdot I=${tx(x)}${O}\\cdot${tx(I)}${A}=${tx(rund(x * I, 3))}${V}$. Gegeben sind aber $${tx(U)}${V}$. Der Wert ist um den Faktor ${tx(rund(x / R, 3))} zu ${x > R ? 'groß' : 'klein'}.` : ''), richtig: 0,
        erklaerung: `Überschlag: $R=\\dfrac{U}{I}=\\dfrac{${tx(U)}${V}}{${tx(I)}${A}}=${tx(R)}${O}$. Prüfe Ergebnisse immer auf ihre Größenordnung.` };
    } },
    // ---------- Proportionalität ----------
    { id: 'proportional', titel: 'Aus einem Wertepaar schließen', erzeuge() {
      let U1, I1, k, ok = false;
      for (let n = 0; n < 300 && !ok; n++) { U1 = rnd.pick([2, 3, 4, 5, 6]); I1 = rnd.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]); k = rnd.pick([1.5, 2, 2.5, 3, 4]); ok = sauber(U1 * k, 1) && sauber(I1 * k, 3); }
      const U2 = rund(U1 * k, 1), I2 = rund(I1 * k, 3), R = rund(U1 / I1, 1), nachI = rnd.zufall() < 0.5;
      const kt = tx(k);
      if (nachI) return fertig({ typ: 'zahl', frage: `Durch einen ohmschen Widerstand fließen bei $${tx(U1)}${V}$ genau $${tx(I1)}${A}$. Welche Stromstärke fließt bei $${tx(U2)}${V}$? Gib sie in A an.`, richtig: I2, toleranz: tol(I2), einheit: 'A', hinweis: 'Berechne zuerst den Widerstand.',
        erklaerung: `$R=\\dfrac{${tx(U1)}${V}}{${tx(I1)}${A}}=${tx(R)}${O}$ und $I=\\dfrac{U}{R}=\\dfrac{${tx(U2)}${V}}{${tx(R)}${O}}=${tx(I2)}${A}$. Oder: Die Spannung wird um den Faktor ${kt} größer, also auch die Stromstärke.` },
        [{ wert: rund(I1 / k, 4), text: 'Bei einem ohmschen Widerstand wächst die Stromstärke mit der Spannung (proportional), sie sinkt nicht.' }, { wert: rund(I1 + (U2 - U1), 4), text: 'Die Stromstärke wächst nicht um denselben Betrag wie die Spannung, sondern um denselben Faktor.' }, { wert: R, text: 'Das ist der Widerstand, nicht die gesuchte Stromstärke.' }]);
      return fertig({ typ: 'zahl', frage: `Durch einen ohmschen Widerstand fließen bei $${tx(U1)}${V}$ genau $${tx(I1)}${A}$. Bei welcher Spannung fließen $${tx(I2)}${A}$? Gib sie in V an.`, richtig: U2, toleranz: tol(U2, 0.005, 0.02), einheit: 'V', hinweis: 'Berechne zuerst den Widerstand.',
        erklaerung: `$R=\\dfrac{${tx(U1)}${V}}{${tx(I1)}${A}}=${tx(R)}${O}$ und $U=R\\cdot I=${tx(R)}${O}\\cdot${tx(I2)}${A}=${tx(U2)}${V}$. Oder: Die Stromstärke wird um den Faktor ${kt} größer, also auch die Spannung.` },
        [{ wert: rund(U1 / k, 4), text: 'Bei einem ohmschen Widerstand gehört zu einer größeren Stromstärke eine größere Spannung (proportional).' }, { wert: rund(U1 + (I2 - I1), 4), text: 'Die Spannung wächst nicht um denselben Betrag wie die Stromstärke, sondern um denselben Faktor.' }, { wert: R, text: 'Das ist der Widerstand, nicht die gesuchte Spannung.' }]);
    } },
    // ---------- Haushalt: wie viele Geräte an einer Sicherung? ----------
    { id: 'haushalt', titel: 'Geräte an einer Sicherung', erzeuge() {
      const K = [[46, 5, 16], [23, 10, 16], [92, 2.5, 16], [46, 5, 13], [57.5, 4, 13], [92, 2.5, 13], [46, 5, 10], [57.5, 4, 10], [23, 10, 13]];
      const [R, I, S] = rnd.pick(K), n = Math.floor(S / I), nm = rnd.pick(['Heizgeräte', 'Wasserkocher', 'Toaster', 'Heizlüfter']);
      return fertig({ typ: 'zahl', frage: `Mehrere gleiche ${nm} sind parallel geschaltet. Jedes Gerät hat den Widerstand $${tx(R)}${O}$ und liegt an der Netzspannung von $230${V}$. Wie viele davon dürfen höchstens gleichzeitig an einem Stromkreis mit einer $${S}${A}$-Sicherung betrieben werden?`, richtig: n, toleranz: 0.001, einheit: 'Geräte',
        hinweis: 'Berechne zuerst die Stromstärke eines Geräts. Die Stromstärken paralleler Zweige addieren sich.',
        erklaerung: `Ein Gerät: $I=\\dfrac{U}{R}=\\dfrac{230${V}}{${tx(R)}${O}}=${tx(I)}${A}$. Bei $${n}$ Geräten fließen $${n}\\cdot${tx(I)}${A}=${tx(rund(n * I, 2))}${A}$, das liegt unter $${S}${A}$. Bei $${n + 1}$ Geräten wären es $${tx(rund((n + 1) * I, 2))}${A}$, die Sicherung würde auslösen.` },
        [{ wert: n + 1, text: `Aufgerundet. Bei $${n + 1}$ Geräten würde die Stromstärke die Sicherung überschreiten.` }, { wert: rund(S / I, 2), text: 'Man kann nur ganze Geräte anschließen. Das Ergebnis muss abgerundet werden.' }, { wert: I, text: 'Das ist die Stromstärke eines einzelnen Geräts. Gefragt ist, wie viele Geräte zusammen die Sicherung nicht überlasten.' }]);
    } }
  ];
  LernLab.generatoren = G;
})();
