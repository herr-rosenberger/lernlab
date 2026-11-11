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
Typ `term`: Schüler tippen eine Stammfunktion ein. `richtig` ist eine Stammfunktion als Text, `f` die Funktion (zur Prüfung in check.mjs), optional `punkte` (Testpunkte ohne Definitionslücken). `ln` ist streng: negative Argumente brauchen Betragsstriche.
Typ `zahl` mit `"exakt": true` akzeptiert auch Terme wie `ln(2)` oder `e-1`. Mit `loesungTeX` überschreibst du die angezeigte Lösung.
Diagramme in Simulationen: `js/plot.js` (Koordinatensystem, Kurven, Flächen, Theme-Farben) und `js/term.js` (Funktionseingabe) einbinden. Beispiele: `simulationen/13/…`.
Canvas-Farben nie direkt aus `getPropertyValue` lesen (liefert `light-dark(…)` als Text), sondern `P.farbe('--accent')` nutzen.
