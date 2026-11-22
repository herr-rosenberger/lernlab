Neue App: Vorlage nach `simulationen/<Klasse>/<name>/index.html` (bzw. `lernapps/<Klasse>/<name>/`) kopieren,
`meta.json` danebenlegen und alle `../` auf `../../../` ändern. Die Klasse ergibt sich aus dem Ordner.
Lern-Apps: Aufgaben in `aufgaben.json` (Vorlage: `templates/aufgaben.json`). Typen: auswahl, zahl, text.
Jede Aufgabe braucht eine eindeutige `id`. Es wird kein Lernstand gespeichert; falsch beantwortete Aufgaben kommen nur innerhalb einer Sitzung bevorzugt wieder.
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
Grafiken mit Werten: Zusätzlich zu `bildAlt` kann `bildText` die Werte der Grafik als Text enthalten. Er erscheint aufklappbar unter dem Bild („Grafik als Text beschreiben“).
Kennlinien-Diagramme und Aufgaben von lernapps/8/kennlinien-deuten entstehen mit `tools/kennlinien_erzeugen.py`.
Die Aufgaben von lernapps/8/widerstand-berechnen entstehen mit `tools/rechnen_erzeugen.py`.
Katalog: `data/apps.json` enthält nur die Liste der App-Ordner. Titel, Fach, Beschreibung usw. stehen ausschließlich in der `meta.json` der jeweiligen App. Nach dem Anlegen einer App `node scripts/build.mjs` ausführen und `data/apps.json` mit hochladen.
Aufgabengenerator (optional, ohne KI): In `aufgaben.json` `"generator": {"skript": "generator.js", "anteil": 0.5}` eintragen und im App-Ordner eine `generator.js` ablegen, die `LernLab.generatoren = [{id, titel, erzeuge()}]` setzt (Vorbild: `lernapps/8/widerstand-berechnen/generator.js`, Hilfen in `js/generator.js`).
`erzeuge()` liefert eine Aufgabe im üblichen Format, bei Zahlaufgaben zusätzlich `diagnosen: [{wert, text}]` (typische Fehler, z. B. mA nicht umgerechnet) und eine Erklärung mit Rechenweg, bei Auswahlaufgaben optional `optionHinweise`. Erzeugte Aufgaben werden unter die festen gemischt (Anteil 0,5 = die Hälfte einer Runde). Familien mit Fehlern kommen in der nächsten Runde zuerst wieder. Es wird nichts gespeichert.
`node scripts/check.mjs` prüft jeden Generator mit 400 Zufallsaufgaben (Aufbau, Formeln, Zahlen, Diagnosen).
