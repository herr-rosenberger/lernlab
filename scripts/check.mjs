// Qualitätsprüfung ohne Abhängigkeiten. Aufruf: node scripts/check.mjs (Exit-Code 1 bei Fehlern)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { createRequire } from 'node:module';
const term = createRequire(import.meta.url)('../js/term.js');
const textcheck = createRequire(import.meta.url)('../js/textcheck.js');
let fehler = 0;
const err = (f, m) => { console.error(`✗ ${f}: ${m}`); fehler++; };
const walk = (d, out = []) => { for (const e of readdirSync(d, { withFileTypes: true })) {
  if (['.git', 'node_modules'].includes(e.name)) continue;
  const p = join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };
const dateien = walk('.');
const json = f => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch (e) { err(f, 'Kein gültiges JSON: ' + e.message); return null; } };

for (const f of dateien.filter(f => f.endsWith('meta.json'))) {
  const m = json(f); if (!m) continue;
  for (const k of ['titel', 'fach', 'lehrplanBezug', 'kurzbeschreibung']) if (!m[k]) err(f, `Feld "${k}" fehlt`);
}
for (const f of dateien.filter(f => f.endsWith('aufgaben.json'))) {
  const d = json(f); if (!d) continue;
  if (!Array.isArray(d.aufgaben) || d.aufgaben.length < 3) { err(f, 'Mindestens 3 Aufgaben unter "aufgaben" nötig'); continue; }
  const ids = new Set();
  for (const t of d.aufgaben) {
    const w = `${f} (${t.id || '?'})`;
    if (!t.id) err(w, 'id fehlt'); else if (ids.has(t.id)) err(w, 'id doppelt'); ids.add(t.id);
    if (!t.frage) err(w, 'frage fehlt');
    if (t.typ === 'auswahl') { if (!Array.isArray(t.optionen) || t.optionen.length < 2) err(w, 'optionen fehlen'); else if (!Number.isInteger(t.richtig) || t.richtig < 0 || t.richtig >= t.optionen.length) err(w, '"richtig" ist kein gültiger Index'); }
    else if (t.typ === 'zahl') { if (typeof t.richtig !== 'number') err(w, '"richtig" muss eine Zahl sein'); }
    else if (t.typ === 'term') {
      if (typeof t.richtig !== 'string' || typeof t.f !== 'string') err(w, '"richtig" und "f" müssen Terme (Text) sein');
      else try {
        const r = term.parse(t.richtig), f = term.parse(t.f);
        for (const x of t.punkte || term.STANDARD) { const h = 1e-5, d = (r(x + h) - r(x - h)) / (2 * h), v = f(x);
          if (!Number.isFinite(d) || !Number.isFinite(v) || Math.abs(d - v) > 1e-5 * (1 + Math.abs(v))) err(w, `Ableitung von "richtig" passt bei x=${x} nicht zu f (${d} statt ${v})`); }
      } catch (e) { err(w, 'Term nicht lesbar: ' + e.message); }
    }
    else if (t.typ === 'text') { if (!Array.isArray(t.richtig) || !t.richtig.length) err(w, '"richtig" muss eine Liste sein'); }
    else err(w, `Unbekannter typ "${t.typ}"`);
    if (t.bild) { if (!t.bildAlt) err(w, 'bildAlt (Alternativtext) fehlt'); if (!existsSync(join(dirname(f), t.bild))) err(w, `Bild fehlt: ${t.bild}`); }
  }
}
// Erwartungshorizont (Aussagen-Check): Aufbau prüfen, Musterantwort muss alles erfüllen, leerer Text nichts
for (const f of dateien.filter(f => f.endsWith('daten.json'))) {
  const d = json(f); if (!d || !d.aussagen) continue;
  d.aussagen.forEach(a => {
    if (!a.titel || !Number.isInteger(a.leitfrage) || a.leitfrage < 0 || a.leitfrage >= (d.fragen || []).length) err(f, `Aussage "${a.id}": titel oder leitfrage fehlt/ungültig`);
    (a.teile || []).forEach((t, i) => { if (!t.frage || !t.lob) err(f, `Aussage "${a.id}", Teil ${i + 1}: lob oder frage fehlt`); if (!t.gruppen && !t.varianten) err(f, `Aussage "${a.id}", Teil ${i + 1}: gruppen oder varianten fehlen`); });
  });
  const mf = join('tests', basename(dirname(f)) + '-musterantwort.txt');
  if (!existsSync(mf)) { err(f, 'Musterantwort fehlt: ' + mf); continue; }
  textcheck.pruefe(readFileSync(mf, 'utf8'), d).aussagen.filter(a => a.status !== 'ok').forEach(a => err(f, `Die Musterantwort erfüllt "${a.titel}" nicht (Status: ${a.status})`));
  if (textcheck.pruefe('', d).aussagen.some(a => a.status !== 'fehlt')) err(f, 'Ein leerer Text darf keine Aussage erfüllen');
}
for (const f of dateien.filter(f => f.endsWith('.html'))) {
  const h = readFileSync(f, 'utf8');
  if (!/<html[^>]*lang=/.test(h)) err(f, 'lang-Attribut fehlt');
  if (!/<title>[^<]+<\/title>/.test(h)) err(f, 'title fehlt');
  for (const m of h.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) err(f, 'img ohne alt: ' + m[0].slice(0, 60));
  for (const m of h.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)) {
    if (/^(https?:|mailto:|data:)/.test(m[1])) continue;
    if (!existsSync(resolve(dirname(f), m[1]))) err(f, `Verweis ins Leere: ${m[1]}`);
  }
}
console.log(fehler ? `\n${fehler} Problem(e) gefunden.` : '✓ Alles in Ordnung.');
process.exit(fehler ? 1 : 0);
