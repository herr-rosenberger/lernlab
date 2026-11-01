// Sammelt alle meta.json -> data/apps.json und erzeugt README.md. Aufruf: node scripts/build.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const site = JSON.parse(readFileSync('data/site.json', 'utf8'));
const typen = { simulationen: 'Simulationen', lernapps: 'Lern-Apps' };
const dirs = p => existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
  .sort((a, b) => a.localeCompare(b, 'de', { numeric: true })) : [];
const apps = [];
for (const typ of Object.keys(typen)) for (const kl of dirs(typ)) for (const app of dirs(join(typ, kl))) {
  const m = join(typ, kl, app, 'meta.json'); if (!existsSync(m)) continue;
  apps.push({ ...JSON.parse(readFileSync(m, 'utf8')), typ, klasse: Number(kl), pfad: `${typ}/${kl}/${app}/` });
}
writeFileSync('data/apps.json', JSON.stringify(apps, null, 2) + '\n');
let md = `# ${site.name}\n\n${site.claim}. Live: <${site.baseUrl}>\n\n`;
md += `Gesamtübersicht mit Suche und Filtern: **[Zur Startseite](${site.baseUrl})**\n\n`;
for (const [typ, label] of Object.entries(typen)) {
  md += `## ${label}\n\n`;
  const ks = [...new Set(apps.filter(a => a.typ === typ).map(a => a.klasse))].sort((a, b) => a - b);
  if (!ks.length) md += '_Noch keine Einträge._\n\n';
  for (const k of ks) {
    md += `### Klasse ${k}\n\n| App | Fach | Lehrplanbezug |\n|---|---|---|\n`;
    for (const a of apps.filter(a => a.typ === typ && a.klasse === k))
      md += `| [${a.titel}](${site.baseUrl}${a.pfad}) | ${a.fach} | ${a.lehrplanBezug || ''} |\n`;
    md += '\n';
  }
}
md += `---\nInhalte: CC BY-SA 4.0 · Code: MIT. Neue App anlegen: siehe \`templates/\`. README und \`data/apps.json\` werden mit \`node scripts/build.mjs\` erzeugt.\n`;
writeFileSync('README.md', md);
console.log(`${apps.length} App(s) erfasst.`);

// Service Worker: Cache-Version aus dem Inhalt aller Dateien, Vorab-Liste aus css/, js/ und assets/.
const alle = (d = '.', out = []) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(e.name)) continue;
    const p = d === '.' ? e.name : join(d, e.name);
    e.isDirectory() ? alle(p, out) : out.push(p.replaceAll('\\', '/'));
  }
  return out;
};
const dateien = alle().filter(f => f !== 'sw.js').sort();
const hash = createHash('sha1');
for (const f of dateien) hash.update(f).update(readFileSync(f));
const shell = ['./', 'index.html', 'impressum.html', 'datenschutz.html', 'manifest.webmanifest', 'data/apps.json',
  ...dateien.filter(f => /^(css|js|assets)\//.test(f))];
const sw = readFileSync('sw.js', 'utf8')
  .replace(/^const V = .*$/m, `const V = 'lernlab-${hash.digest('hex').slice(0, 10)}'; // build`)
  .replace(/^const SHELL = .*$/m, `const SHELL = ${JSON.stringify(shell)}; // build`);
writeFileSync('sw.js', sw);
console.log(`Service Worker: ${shell.length} Dateien vorab gespeichert.`);
