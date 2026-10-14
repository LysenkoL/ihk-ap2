# GA1/GA2-Bögen abschreiben — Arbeitsanweisung

Ziel: Ein echter IHK-Prüfungsbogen (AP2 Fachinformatiker Anwendungsentwicklung,
GA1 „Planen eines Softwareproduktes“ oder GA2 „Entwicklung und Umsetzung von
Algorithmen“) wird **von Hand** aus den Seitenbildern abgeschrieben — mit den
Lösungshinweisen der ZPA und den Punkten. Ergebnis ist eine JSON-Datei in
`/home/claude/ap2/privat/quellen/`, aus der `tools/paket_bauen.py` das Paket
für den Bogen-Player baut (Übung/Prüfung, 90-Minuten-Uhr, Selbstbewertung).

**Muster (unbedingt zuerst ansehen):**
`privat/quellen/ga1-2025-w.json` und `privat/quellen/ga2-2025-w.json`.

## Die wichtigsten Regeln

1. **Abschreiben durch Ansehen.** Jede Seite mit dem Read-Tool als Bild öffnen
   und den Text daraus übernehmen. Keine OCR-Programme, keine API-Erkennung.
   Wo es eine `.txt`-Datei mit Textebene gibt, darf sie als Hilfe dienen —
   jede Stelle trotzdem am Bild prüfen (Ziffern, Code, Tabellen!).
2. **Wortgetreu.** Aufgabentext und Lösungshinweise im Original-Deutsch, nichts
   kürzen, nichts „verbessern“. Offensichtliche Druckfehler bleiben; ein
   Hinweis darauf darf als `<p><i>Anmerkung: …</i></p>` in die Lösung.
3. **HTML** (erlaubte Tags: p, div, br, b, strong, i, em, u, sub, sup, ul, ol,
   li, table, thead, tbody, tr, td, th (colspan/rowspan), pre, code, h3, h4,
   hr, img data-bild="…"). In Text und `<pre>` immer `&lt;` `&gt;` `&amp;`
   schreiben. Code und Pseudocode in `<pre>` mit genauer Einrückung (Leerzeichen,
   keine Tabs) und mit Zeilennummern, wenn das Original welche hat.
4. **Tabellen als HTML-Tabellen** abschreiben (Datentabellen, Klassenkästen,
   Testtabellen, leere Ausfülltabellen mit ihren Spalten- und Zeilenköpfen).
5. **Abbildungen**, die sich nicht sauber als Text/Tabelle wiedergeben lassen
   (UML-Diagramme, Netzpläne, ER-Diagramme, Struktogramme, Skizzen, Mockups),
   als **Bildausschnitt**: unter `"bilder"` einen Schlüssel anlegen
   (`"<termin>-<ga1|ga2>-<aufgabe><teil>"`, z. B. `"s24-ga2-2a"`, bei mehreren
   `-l` für Lösung oder `-2`, `-3` …) mit `{"seite": "<ordner>/<datei ohne .jpg>",
   "box": [x0, y0, x1, y1]}` — Anteile 0…1 von Breite und Höhe der Seite.
   Danach `AP2_SEITEN=/home/claude/seiten python3 tools/bilder_schneiden.py --nur <id> --neu`
   ausführen (nur die eigene Datei, z. B. `--nur ga1-2024-s`) und **jeden
   Ausschnitt mit Read ansehen** (`privat/bilder/<schlüssel>.webp`): nichts
   abgeschnitten, nicht zu viel Rand. Falsch? Box ändern und erneut schneiden. Diagramme in Lösungen zusätzlich kurz „In Worten“
   als Liste beschreiben (Akteure, Klassen, Zustände, Übergänge …), wenn das
   machbar ist.
6. **Jede Teilaufgabe muss für sich verständlich sein** (sie wird auch einzeln
   in „Fehler wiederholen“ gezeigt): Material, das mehrere Teilaufgaben
   brauchen (Datentabellen, Klassenbeschreibungen, Code), gehört als
   `"anlagen"` an die Aufgabe (erscheint bei jeder Teilaufgabe) oder als
   `"anlagen"` an die einzelne Teilaufgabe. Belegsatz-Teile hängt man mit
   `"beleg": ["id"]` an.
7. **Punkte** genau aus dem Bogen. Summe der Teilaufgaben = Punkte der Aufgabe,
   Summe aller Aufgaben = 100. Teilaufgaben-Nummern wie im Original
   (`"a"`, `"ba"`, `"bb"` …).
8. **Lösungen** aus den Lösungshinweisen der ZPA, wortgetreu, Tabellen als
   HTML, Code in `<pre>`. Bewertungsangaben („je … 2 Punkte“, „Hinweis für die
   Korrektur …“) gehören in `"hinweis"` (Klartext ohne HTML). Gibt es keine
   Angaben, `"hinweis": ""`.
9. **Eingabe** je Teilaufgabe: `"frei"` (kurze Antwort), `"gross"` (längerer
   Text), `"code"` (Pseudocode/SQL/Programm), `"zeichnen"` (Diagramm auf
   Papier) oder `{"zeilen": ["Zeilenkopf 1", "Zeilenkopf 2"]}` für
   Ausfülltabellen (ein Textfeld je Tabellenzeile).
10. **Belegsatz**: Ältere Bögen haben einen aufgabenbezogenen Belegsatz
    (Tabellen, Code, Beschreibungen) → als `"beleg"`-Einträge mit HTML
    abschreiben (Diagramme darin als Bild). Neuere Bögen haben nur einen
    Notations-Belegsatz (UML-Notation, SQL-Syntax, „Stand 2024-10-07“) — wenn er
    gleich aussieht wie in `w25`, die vorhandenen Bilder `bs24-uc`,
    `bs24-klasse`, `bs24-zustand`, `bs24-sql1`, `bs24-sql2` wiederverwenden
    (wie im Muster, **ohne** sie neu unter `"bilder"` anzulegen). Weicht er ab,
    eigene Ausschnitte anlegen.
11. **Fehlen offizielle Lösungen**, eine eigene, fachlich saubere Musterlösung
    schreiben und jede so kennzeichnen: `<p><i>Eigene Musterlösung — keine
    offiziellen Lösungshinweise vorhanden.</i></p>`; `"schluessel"` entsprechend.
12. **Prüfen**: `python3 tools/paket_bauen.py --pruefe privat/quellen/<id>.json`
    muss „OK“ melden (andere Bögen werden parallel geschrieben — deshalb nur
    die eigene Datei prüfen). Nur die eigene Quelldatei und eigene
    Bildausschnitte anlegen — keine anderen Dateien ändern.

## Kopf der Datei

```json
{
  "id": "ga1-2024-s",              // ga1|ga2 - Jahr - s|w (Winter 2024/25 = 2024-w)
  "bereich": "ga1",
  "termin": "Sommer 2024",          // oder "Winter 2024/25"
  "kurz": "GA1 S24",                // oder "GA2 W24/25"
  "minuten": 90,
  "schluessel": "Lösungshinweise der ZPA (Abschlussprüfung Sommer 2024)",
  "situation": "<p>Ausgangssituation wortgetreu</p>",
  "beleg": [ … ], "bilder": { … }, "aufgaben": [ … ]
}
```

Aufgabe: `{"nr", "titel" (kurz, eigene Worte), "punkte", "themen": [...],
"text" (Einleitung der Aufgabe, optional), "anlagen" (optional), "teile": [...]}`.
Teilaufgabe: `{"nr", "punkte", "eingabe", "text", "loesung", "hinweis",
"beleg" (optional), "anlagen" (optional)}`. Die Frage selbst im Text **fett**.

Themen-Namen (für Auswertungen) möglichst aus: Projektmanagement,
Wirtschaftlichkeit, UML, Datenbank, SQL, Algorithmen, Programmierung/OOP,
Qualität & Test, IT-Sicherheit, Datenschutz, Software-Ergonomie, Schnittstellen,
Englisch, Netzwerk.
