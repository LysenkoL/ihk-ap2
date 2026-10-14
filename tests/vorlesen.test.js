"use strict";
/* Vorlesen (gen/vorlesen.js): Text säubern, Code erkennen, Stimme wählen,
   Knopf nur, wenn es etwas Vorlesbares gibt — mit gefälschter Sprachausgabe. */
const assert = require("assert");
const fs = require("fs"), path = require("path"), vm = require("vm");
const V = require("../gen/vorlesen.js");

/* ------------------------------------------------------------ Säubern --- */
assert.strictEqual(V.saeubern("<p>Die Daten werden <b>verschlüsselt</b>.</p><p>Dadurch sind sie sicher</p>"),
  "Die Daten werden verschlüsselt. Dadurch sind sie sicher.", "HTML weg, jeder Absatz ein Satz");
assert.strictEqual(V.saeubern("<ul><li>Marktanalyse</li><li>Konkurrenzanalyse</li></ul>"),
  "Marktanalyse. Konkurrenzanalyse.", "Listenpunkte werden Sätze");
assert.strictEqual(V.saeubern("Zeile eins<br>Zeile zwei"), "Zeile eins. Zeile zwei.", "<br> trennt");
assert.strictEqual(V.saeubern("1) Backup erstellen\n2) Backup prüfen"), "Backup erstellen. Backup prüfen.", "Nummern „1)“ weg");
assert.strictEqual(V.saeubern("(3) Test\n12: Ende"), "Test. Ende.", "„(3)“ und Zeilennummer „12:“ weg");
assert.strictEqual(V.saeubern("a) Erstens\n- zweitens\n• drittens"), "Erstens. zweitens. drittens.", "a) und Aufzählungszeichen weg");
assert.strictEqual(V.saeubern("Mehrere\n\n\n   Leerzeilen   hier."), "Mehrere. Leerzeilen hier.", "Leerraum zusammengefasst");
assert.strictEqual(V.saeubern("A &amp; B &lt; C&nbsp;D &#228; &#x00FC;"), "A & B kleiner als C D ä ü.", "Entitäten dekodiert, „<“ gesprochen");
assert.strictEqual(V.saeubern("Das ist z. B. wichtig, d. h. bzw. ggf. usw."),
  "Das ist zum Beispiel wichtig, das heißt beziehungsweise gegebenenfalls und so weiter", "Abkürzungen ausgeschrieben");
assert.strictEqual(V.saeubern("Z. B. so."), "Zum Beispiel so.", "Großschreibung am Satzanfang bleibt");
assert.strictEqual(V.saeubern("Der Risikowert ist 4 × 5 = 20."), "Der Risikowert ist 4 mal 5 gleich 20.", "Rechenzeichen gesprochen");
assert.strictEqual(V.saeubern("Bei zeit <= 17:00 zählt es."), "Bei zeit kleiner gleich 17:00 zählt es.");
assert.strictEqual(V.saeubern("Kunde → Plätze reservieren"), "Kunde – Plätze reservieren.", "Pfeil als Pause");
assert.strictEqual(V.saeubern("<img data-bild=\"x\"><p>In Worten: Gast (id_Gast (PK), Name)</p>"),
  "In Worten: Gast (id Gast (Primärschlüssel), Name).", "Bild weg, PK ausgeschrieben, Unterstrich weg");
assert.strictEqual(V.saeubern("**Fett** und `code` und [Link](http://x.de)"), "Fett und code und Link.", "Markdown weg");
assert.strictEqual(V.saeubern(""), "");
assert.strictEqual(V.saeubern(null), "");
assert.strictEqual(V.htmlZuText("<script>alert(1)</script>Hallo").trim(), "Hallo", "Skripte nie vorlesen");

/* ------------------------------------------------------------ Code? --- */
const code = [
  "SELECT * FROM Kunde WHERE Kd_PLZ LIKE '508%'",
  "select name\nfrom kunde\nwhere id = 3",
  "UPDATE Artikel SET Preis = 3",
  "INSERT INTO Kunde VALUES (1, 'A')",
  "for (int i = 0; i < n; i++) {\n  summe += a[i];\n}",
  "x = 5\ny = x + 1\nreturn y",
  "WENN x > 0 DANN\n  AUSGABE x\nENDE WENN",
  "if (a == b) { tueEtwas(); }",
  "flightPositions[0] = geoPositions[0]\ncurrentPos = flightPositions[0]",
  "public static void main(String[] args)",
  "1 SELECT Name\n2 FROM Kunde"
];
code.forEach(c => assert(V.istCode(c), "Code nicht erkannt: " + c));
const text = [
  "Die Transportverschlüsselung bei der E-Mail-Übertragung ist eine hybride Verschlüsselung.",
  "Bei < zählt der Grenzwert nicht mit, bei <= schon. Steht in der Bedingung zeit < 17:00, wird ein Zugriff um genau 17:00 Uhr nicht gezählt.",
  "Der Risikowert ist 4 × 5 = 20 und damit sehr hoch.",
  "Der Konstruktor ist private, damit niemand von außen ein zweites Objekt erzeugen kann; man bekommt das Objekt über eine statische Methode getInstanz(). Ein Beispiel ist ein Logger.",
  "Für einen Newsletter reicht zum Beispiel die E-Mail-Adresse; Geburtsdatum und Anschrift sind dafür nicht erforderlich.",
  "Gast (id_Gast (PK), Name, Vorname, Telefon, Email)\nBewertung (id_Gast (PK)(FK), id_Leist (PK)(FK))",
  "Die Daten werden in einer Tabelle gespeichert. Ein Update der Software schließt Lücken.",
  "Man wählt (select) die Daten aus. Danach kommen sie aus dem Lager."
];
text.forEach(t => assert(!V.istCode(t), "Text als Code erkannt: " + t));

/* ------------------------------------------------------ vorbereiten --- */
assert.strictEqual(V.vorbereiten("<pre>SELECT 1</pre>").grund, "code", "<pre> → kein Knopf");
assert.strictEqual(V.vorbereiten("<p>Text</p><table><tr><td>x</td></tr></table>").grund, "tabelle", "Tabelle → kein Knopf");
assert.strictEqual(V.vorbereiten("SELECT a FROM b").text, "", "SQL ohne <pre> → kein Knopf");
assert.strictEqual(V.vorbereiten("  ").grund, "leer");
assert.strictEqual(V.vorbereiten("<img data-bild=\"x\">").grund, "leer", "nur Bild → kein Knopf");
assert.strictEqual(V.vorbereiten("<p>Redundanz heißt doppelte Speicherung.</p>").text, "Redundanz heißt doppelte Speicherung.");

/* Alle Kurzfragen-Musterantworten bekommen einen Knopf */
{
  const kontext = { console };
  kontext.window = kontext; vm.createContext(kontext);
  ["satzbausteine.js", "satzbausteine2.js", "satzbausteine-ap2.js"].forEach(f =>
    vm.runInContext(fs.readFileSync(path.join(__dirname, "../gen", f), "utf8"), kontext));
  const pool = kontext.SATZ_POOL;
  assert(pool.length > 100);
  pool.forEach(x => {
    const r = V.vorbereiten(x.muster);
    assert(r.text, x.id + ": Musterantwort hätte keinen Vorlese-Knopf (" + r.grund + ")");
    assert(!/[<>*_#`|]/.test(r.text), x.id + ": Zeichen bleiben stehen: " + r.text);
  });
}

/* ------------------------------------------------------------ Stücke --- */
{
  const lang = "Erster Satz ist hier. " + "Wort ".repeat(80).trim() + ". Kurz. 20.000.000 Pixel sind 1.512 Bilder.";
  const st = V.teile(lang, 120);
  st.forEach(s => assert(s.length <= 120, "Stück zu lang: " + s.length));
  assert.strictEqual(st.join(" ").replace(/\s+/g, " "), lang, "nichts geht verloren");
  assert(st.some(s => s.indexOf("20.000.000 Pixel sind 1.512 Bilder.") >= 0), "Zahlen mit Punkt werden nicht zerrissen");
  assert.deepStrictEqual(V.teile("Eins. Zwei. Drei.", 200), ["Eins. Zwei. Drei."], "kurze Sätze zusammen");
  assert.deepStrictEqual(V.teile("", 200), []);
}

/* ------------------------------------------------------ Stimme wählen --- */
{
  const S = (name, lang, o) => Object.assign({ name, lang, localService: false, default: false }, o || {});
  const en = S("Samantha", "en-US", { default: true, localService: true });
  const at = S("Deutsch (Österreich)", "de-AT", { localService: true });
  const deNetz = S("Google Deutsch", "de-DE");
  const deLokal = S("Anna", "de-DE", { localService: true });
  const deUnter = S("Deutsch Android", "de_DE", { localService: true, default: true });
  assert.strictEqual(V.waehleStimme([en, at, deNetz, deLokal]), deLokal, "de-DE lokal vor Netz und vor de-AT");
  assert.strictEqual(V.waehleStimme([en, at, deNetz]), deNetz, "de-DE vor de-AT");
  assert.strictEqual(V.waehleStimme([en, at]), at, "notfalls andere deutsche Variante");
  assert.strictEqual(V.waehleStimme([en]), null, "keine deutsche Stimme → null");
  assert.strictEqual(V.waehleStimme([]), null);
  assert.strictEqual(V.waehleStimme(null), null);
  assert.strictEqual(V.waehleStimme([deLokal, deUnter]), deUnter, "„de_DE“ (Android) zählt als de-DE; Standard gewinnt");
}

/* --------------------------------- Sprachausgabe mit Fälschung (vm) --- */
function laden(mitSprache, stimmen) {
  const gesprochen = [], abgebrochen = [];
  const knoepfe = [];
  const elem = tag => {
    const e = { tagName: tag.toUpperCase(), className: "", textContent: "", attrs: {}, isConnected: true, listener: {},
      classList: { _s: new Set(), toggle(c, an) { an ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } },
      setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
      addEventListener(t, f) { this.listener[t] = f; }, appendChild(x) { return x; },
      click() { this.listener.click({ preventDefault() {}, stopPropagation() {} }); } };
    if (tag === "button") knoepfe.push(e);
    return e;
  };
  const kontext = {
    console, setTimeout: f => f(), clearInterval() {}, setInterval: () => 1,
    document: { getElementById: () => null, createElement: elem, head: { appendChild() {} } },
    addEventListener() {}
  };
  if (mitSprache) {
    const ss = {
      speaking: false, pending: false, paused: false, voices: stimmen || [],
      getVoices() { return this.voices; },
      speak(u) { gesprochen.push(u); this.speaking = true; },
      cancel() { abgebrochen.push(gesprochen.length); this.speaking = false; },
      resume() {}, addEventListener() {}
    };
    kontext.speechSynthesis = ss;
    kontext.SpeechSynthesisUtterance = function (t) { this.text = t; };
  }
  kontext.window = kontext;
  vm.createContext(kontext);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../gen/vorlesen.js"), "utf8"), kontext);
  return { G: kontext.GENVORLESEN, gesprochen, abgebrochen, ss: kontext.speechSynthesis };
}
{
  const ohne = laden(false);
  assert.strictEqual(ohne.G.verfuegbar(), false);
  assert.strictEqual(ohne.G.knopf("Ein Satz."), null, "ohne speechSynthesis kein Knopf");
}
{
  const de = { name: "Anna", lang: "de-DE", localService: true };
  const mit = laden(true, [{ name: "Alex", lang: "en-US" }, de]);
  const G = mit.G;
  assert.strictEqual(G.verfuegbar(), true);
  assert.strictEqual(G.knopf("SELECT * FROM t"), null, "SQL → kein Knopf");
  assert.strictEqual(G.knopf("<pre>x = 1;</pre>"), null, "Code-Block → kein Knopf");
  assert.strictEqual(G.knopf(""), null, "leer → kein Knopf");
  const b = G.knopf("<p>Die Daten werden z. B. verschlüsselt.</p>");
  assert(b, "Text → Knopf");
  assert.strictEqual(b.textContent, "🔊 Anhören");
  b.click();
  assert.strictEqual(mit.gesprochen.length, 1);
  const u = mit.gesprochen[0];
  assert.strictEqual(u.text, "Die Daten werden zum Beispiel verschlüsselt.");
  assert.strictEqual(u.lang, "de-DE");
  assert.strictEqual(u.rate, 0.9);
  assert.strictEqual(u.voice, de, "deutsche Stimme gewählt");
  assert.strictEqual(b.textContent, "⏹ Stopp");
  assert.strictEqual(b.attrs["aria-pressed"], "true");
  b.click();
  assert.strictEqual(b.textContent, "🔊 Anhören", "zweites Tippen = Stopp");
  assert(mit.abgebrochen.length >= 1, "cancel() aufgerufen");
  /* Lazy-Quelle: erst beim Tippen gelesen */
  let txt = "";
  const lazy = G.knopf(() => txt);
  assert(lazy, "Funktion, noch leer → Knopf (entscheidet beim Tippen)");
  txt = "Jetzt gibt es Text.";
  lazy.click();
  assert.strictEqual(mit.gesprochen[mit.gesprochen.length - 1].text, "Jetzt gibt es Text.");
  assert.strictEqual(G.knopf(() => "SELECT a FROM b"), null, "Funktion mit Code → kein Knopf");
  /* Ende → Knopf zurück */
  mit.gesprochen[mit.gesprochen.length - 1].onend();
  assert.strictEqual(lazy.textContent, "🔊 Anhören", "nach dem Ende wieder „Anhören“");
}
{
  /* ohne deutsche Stimme: trotzdem lang = de-DE */
  const mit = laden(true, [{ name: "Alex", lang: "en-US", default: true }]);
  mit.G.knopf("Ein deutscher Satz.").click();
  assert.strictEqual(mit.gesprochen[0].lang, "de-DE");
  assert.strictEqual(mit.gesprochen[0].voice, undefined, "keine fremde Stimme setzen");
}
{
  /* langer Text → mehrere Stücke, letzte meldet das Ende */
  const mit = laden(true, []);
  const lang = Array.from({ length: 12 }, (_, i) => "Das ist der Satz Nummer " + (i + 1) + " mit etwas mehr Text darin.").join(" ");
  mit.G.knopf(lang).click();
  assert(mit.gesprochen.length >= 2, "in Stücke geteilt");
  assert(mit.gesprochen.every(u => u.text.length <= 220));
  assert.strictEqual(typeof mit.gesprochen[mit.gesprochen.length - 1].onend, "function");
}
console.log("vorlesen: ok");
