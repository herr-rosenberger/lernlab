Neue App: Vorlage nach `simulationen/<Klasse>/<name>/index.html` (bzw. `lernapps/<Klasse>/<name>/`) kopieren,
`meta.json` danebenlegen und alle `../` auf `../../../` ändern. Die Klasse ergibt sich aus dem Ordner.
Lern-Apps: Aufgaben in `aufgaben.json` (Vorlage: `templates/aufgaben.json`). Typen: auswahl, zahl, text.
Jede Aufgabe braucht eine eindeutige `id`; bei Änderungen an einer Aufgabe die `id` behalten, sonst geht der Lernstand dafür verloren.
Formeln: `$…$` (im Text) oder `$$…$$` (eigene Zeile) in Fragen, Optionen, Hinweisen und Erklärungen; in JSON Backslashes doppelt schreiben (`\\frac`).
Bilder: `"bild": "datei.svg", "bildAlt": "Beschreibung"` (Datei im App-Ordner, Alternativtext ist Pflicht).
Arbeitsblatt: `…/index.html?arbeitsblatt` bzw. `?arbeitsblatt&loesung` öffnet eine druckfertige Ansicht.
Simulationen: `templates/app.js` als Ausgangspunkt mitkopieren.
Druck: Jede App zeigt beim Drucken automatisch einen QR-Code zur Seite (data-qr in `.app-head`).
Offline: `sw.js` speichert das Grundgerüst vorab und jede besuchte App beim ersten Aufruf. Die Cache-Version setzt `scripts/build.mjs`.
Prüfung vor dem Veröffentlichen: `node scripts/check.mjs`.
