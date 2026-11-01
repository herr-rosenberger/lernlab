// Qualitätsprüfung ohne Abhängigkeiten. Aufruf: node scripts/check.mjs (Exit-Code 1 bei Fehlern)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
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
    else if (t.typ === 'text') { if (!Array.isArray(t.richtig) || !t.richtig.length) err(w, '"richtig" muss eine Liste sein'); }
    else err(w, `Unbekannter typ "${t.typ}"`);
    if (t.bild) { if (!t.bildAlt) err(w, 'bildAlt (Alternativtext) fehlt'); if (!existsSync(join(dirname(f), t.bild))) err(w, `Bild fehlt: ${t.bild}`); }
  }
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
