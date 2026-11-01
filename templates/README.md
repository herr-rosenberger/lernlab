Neue App: Vorlage nach `simulationen/<Klasse>/<name>/index.html` (bzw. `lernapps/<Klasse>/<name>/`) kopieren,
`meta.json` danebenlegen und alle `../` auf `../../../` ändern. Die Klasse ergibt sich aus dem Ordner.
Lern-Apps: Aufgaben in `aufgaben.json` (Vorlage: `templates/aufgaben.json`). Typen: auswahl, zahl, text.
Jede Aufgabe braucht eine eindeutige `id`; bei Änderungen an einer Aufgabe die `id` behalten, sonst geht der Lernstand dafür verloren.
