"use strict";
/* Schreibtischtest (gen/trace-trainer.js, gen/trace-daten.js, verfolgen() in gen/code-lauf.js).
   Erwartete Werte sind von Hand gerechnet, nicht aus dem Ausführer abgeschrieben.
   node tests/trace.test.js */
const assert = require("assert");

/* ---------------------------------------------------- Umgebung ohne DOM --- */
const speicher = new Map();
global.localStorage = { getItem: k => (speicher.has(k) ? speicher.get(k) : null), setItem: (k, v) => speicher.set(k, String(v)), removeItem: k => speicher.delete(k) };
const journal = [];
global.GENLERNSTAND = { record: e => { journal.push(e); return { ok: true, event: e }; } };
const L = require("../gen/code-lauf.js");
global.GENCODELAUF = L;
require("../gen/trace-daten.js");
const A = global.AP2_TRACE_AUFGABEN;
const T = require("../gen/trace-trainer.js");

assert.ok(Array.isArray(A) && A.length === 12, "12 Aufgaben");
assert.strictEqual(new Set(A.map(a => a.id)).size, 12, "IDs eindeutig");
const typen = t => A.filter(a => a.typ === t).length;
assert.deepStrictEqual([typen("tabelle"), typen("fehler"), typen("ausgabe")], [6, 4, 2]);
A.forEach(a => {
  assert.ok(a.titel && a.titelDe && a.aufgabe && a.code && a.methode, a.id + ": Pflichtfelder");
  assert.ok(Array.isArray(a.begriffe) && a.begriffe.length, a.id + ": Begriffe");
});

/* =========================================================== verfolgen() --- */
const code1 = [
  "int f(int n) {",
  "    int s = 0;",
  "    for (int i = 0; i < n; i++) {",
  "        for (int j = 0; j < i; j++) {",
  "            s = s + j;",
  "        }",
  "    }",
  "    System.out.println(\"s=\" + s);",
  "    return s;",
  "}"
].join("\n");
let r = L.verfolgen(code1, { methode: "f", args: [3], punkte: [{ zeile: 4, wann: "durchlauf", werte: ["i", "j", "s"] }] });
assert.ok(r.ok, JSON.stringify(r.fehler));
assert.deepStrictEqual(r.spur.map(z => z.werte.map(w => w.js)), [[1, 0, 0], [2, 0, 0], [2, 1, 1]], "verschachtelte Schleife: innere Durchläufe");
assert.deepStrictEqual(r.spur.map(z => z.nr), [1, 2, 3]);
assert.strictEqual(r.rueckgabe.js, 1);
assert.strictEqual(r.ausgabe, "s=1\n");

/* Bedingung: auch die letzte, falsche Prüfung */
r = L.verfolgen(code1, { methode: "f", args: [2], punkte: [{ zeile: 3, wann: "bedingung", werte: ["i"], bedingungen: [3] }] });
assert.deepStrictEqual(r.spur.map(z => [z.werte[0].js, z.bedingungen[0]]), [[0, true], [1, true], [2, false]]);

/* vor/nach, Ausgabe je Spurzeile, nicht vorhandene Variable = null */
const code2 = [
  "void g(int[] a) {",
  "    int i = 0;",
  "    while (i < a.length) {",
  "        System.out.print(a[i] + \" \");",
  "        i++;",
  "    }",
  "    System.out.println(\"!\");",
  "}"
].join("\n");
r = L.verfolgen(code2, { methode: "g", args: [[4, 5]], punkte: [{ zeile: 2, wann: "vor", werte: ["i"] }, { zeile: 3, wann: "durchlauf", werte: ["i", "a[i]"] }, { zeile: 7, wann: "nach", werte: ["i"] }] });
assert.ok(r.ok);
assert.deepStrictEqual(r.spur.map(z => [z.wann, z.werte.map(w => (w ? w.js : null))]), [["vor", [null]], ["durchlauf", [1, 5]], ["durchlauf", [2, null]], ["nach", [2]]],
  "vor: i fehlt; nach Durchlauf 2 ist a[2] außerhalb → null");
assert.deepStrictEqual(r.spur.map(z => z.ausgabe), ["", "4 ", "5 ", "!\n"]);
assert.strictEqual(r.rueckgabe, null, "void");

/* Nur lesen erlaubt; ungültige Punkte melden */
assert.strictEqual(L.verfolgen(code2, { methode: "g", args: [[1]], punkte: [{ zeile: 3, wann: "durchlauf", werte: ["i++"] }] }).phase, "spur");
assert.strictEqual(L.verfolgen(code2, { methode: "g", args: [[1]], punkte: [{ zeile: 2, wann: "durchlauf" }] }).phase, "spur", "durchlauf nur am Schleifenkopf");
assert.strictEqual(L.verfolgen(code2, { methode: "g", args: [[1]], punkte: [{ zeile: 2, wann: "bedingung" }] }).phase, "spur");
/* Ohne Spur: dasselbe Ergebnis wie ausfuehren() */
assert.strictEqual(L.ausfuehren(code1, { methode: "f", args: [4] }).wert, L.verfolgen(code1, { methode: "f", args: [4], punkte: [] }).wert);
/* Fehler im Lauf: Spur bis zum Fehler */
r = L.verfolgen(code2.replace("i < a.length", "i <= a.length"), { methode: "g", args: [[7]], punkte: [{ zeile: 3, wann: "durchlauf", werte: ["i"] }] });
assert.strictEqual(r.ok, false);
assert.deepStrictEqual(r.spur.map(z => z.werte[0].js), [1]);

/* ====================================================== Wertetabellen --- */
const tab = id => T.referenz(id).zeilen.map(z => z.zellen.map(c => (c == null ? null : c.typ === "ausgabe" ? c.text : c.js)));
assert.deepStrictEqual(tab("lager-buchungen"), [
  [0, -4, true, 6, ""], [1, 7, true, 13, ""], [2, -15, false, 13, "abgelehnt: -15"], [3, -6, true, 7, ""]]);
assert.strictEqual(T.referenz("lager-buchungen").rueckgabe.js, 7);

assert.deepStrictEqual(tab("noten-while"), [
  [0, 2, true, 0, 0], [1, 3, true, 2, 1], [2, 1, true, 5, 2], [3, 0, false, 6, 3]]);
assert.strictEqual(T.referenz("noten-while").rueckgabe.js, 2);

assert.deepStrictEqual(tab("temperatur-anstieg"), [
  [null, null, 0], [1, 1.5, 1.5], [2, -0.5, 1.5], [3, 3.5, 3.5], [4, 1.5, 3.5]]);
assert.strictEqual(T.referenz("temperatur-anstieg").rueckgabe.js, 3.5);

assert.deepStrictEqual(tab("passwort-punkte"), [
  [0, "a", 0, false], [1, "B", 1, false], [2, "3", 3, true], [3, "x", 3, true], [4, "7", 3, true], [5, "Q", 4, true]]);
assert.strictEqual(T.referenz("passwort-punkte").rueckgabe.js, 4);

assert.deepStrictEqual(tab("regal-summen"), [
  [0, 0, 4, 4], [0, 1, 0, 4], [0, 2, 6, 10], [1, 0, 2, 2], [1, 1, 5, 7], [2, 0, 3, 3]]);
assert.deepStrictEqual(T.referenz("regal-summen").rueckgabe.js, [10, 7, 3]);

assert.deepStrictEqual(tab("offene-bestellungen"), [
  [101, true, 0, 0], [102, false, 120, 1], [103, false, 135.5, 2], [104, true, 135.5, 2]]);
assert.strictEqual(T.referenz("offene-bestellungen").rueckgabe.js, 135.5);
assert.strictEqual(T.referenz("offene-bestellungen").ausgabe, "2 offen\n");

/* ============================================================ Ausgabe --- */
assert.deepStrictEqual(T.referenz("muster-ausgabe").zeilen, ["1", "2 4", "3 6 9", "4 8 12 16", "Ende"]);
assert.deepStrictEqual(T.referenz("rabatt-ausgabe").zeilen, ["120: 10 %", "50: 5 %", "49: kein Rabatt", "Ende nach 3"]);

/* ====================================================== Fehler finden --- */
A.filter(a => a.typ === "fehler").forEach(a => {
  const auf = { signatur: a.signatur, tests: a.tests, klassen: a.klassen || [] };
  const roh = L.pruefeAufgabe(auf, a.code);
  assert.ok(!roh.kompiliert || roh.bestanden < roh.gesamt, a.id + ": Originalcode muss an Tests scheitern");
  const alle = {}; a.fehler.forEach(f => Object.assign(alle, f.fix));
  const fix = L.pruefeAufgabe(auf, T.codeMit(a.id, alle));
  assert.ok(fix.kompiliert && fix.bestanden === fix.gesamt, a.id + ": Korrektur besteht alle Tests (" + fix.bestanden + "/" + fix.gesamt + ")");
  /* jede Korrektur allein ist nötig: ohne sie scheitert mindestens ein Test */
  a.fehler.forEach((f, i) => {
    const ohne = {}; a.fehler.forEach((g, j) => { if (j !== i) Object.assign(ohne, g.fix); });
    const p = L.pruefeAufgabe(auf, T.codeMit(a.id, ohne));
    assert.ok(!p.kompiliert || p.bestanden < p.gesamt, a.id + ": Fehler " + (i + 1) + " wird von Tests erkannt");
  });
});

/* ============================================================ Bewerten --- */
let b = T.bewerten("lager-buchungen", { zellen: {
  "1:0": "1", "1:1": "7", "1:2": "wahr", "1:3": "13", "1:4": "",
  "2:0": "2", "2:1": "−15", "2:2": "false", "2:3": "13", "2:4": "abgelehnt: -15",
  "3:0": "3", "3:1": "-6", "3:2": "true", "3:3": "7", "3:4": "-" }, rueckgabe: "7" });
assert.deepStrictEqual([b.correct, b.max], [16, 16], "Vorgabezeile zählt nicht; wahr/−/Strich werden verstanden");
b = T.bewerten("lager-buchungen", { zellen: {}, rueckgabe: "" });
assert.strictEqual(b.correct, 0, "leere Tabelle bekommt keine Punkte (auch nicht für leere Ausgabe)");
b = T.bewerten("temperatur-anstieg", { zellen: { "0:2": "0,0", "1:0": "1", "1:1": "1,5", "1:2": "1.5" } });
assert.strictEqual(b.zellen["1:1"], true, "Dezimalkomma");
assert.strictEqual(b.zellen["0:2"], true);
b = T.bewerten("regal-summen", { zellen: {}, rueckgabe: "{10, 7, 3}" });
assert.strictEqual(b.rueckgabe, true, "Rückgabe-Array in {…}-Schreibweise");
assert.strictEqual(T.bewerten("regal-summen", { zellen: {}, rueckgabe: "10 7 3" }).rueckgabe, true, "auch ohne Klammern");

b = T.bewerten("beste-note", { markiert: [2, 3], korrektur: { 2: "int beste = noten[0];", 3: "for (int i = 0; i < noten.length; i++) {" } });
assert.deepStrictEqual([b.correct, b.max], [4, 4], "beide gefunden und behoben");
b = T.bewerten("beste-note", { markiert: [3], korrektur: { 3: "for (int i = 0; i < noten.length; i++) {" } });
assert.deepStrictEqual([b.correct, b.max], [2, 4], "ein Fehler gefunden und behoben");
b = T.bewerten("beste-note", { markiert: [3, 8], korrektur: {} });
assert.strictEqual(b.correct, 0, "markiert ohne Änderung + falsche Zeile: 1 − 1 = 0");
b = T.bewerten("bubble-fehler", { markiert: [6], korrektur: { 6: "gewichte[j] = gewichte[j + 1];" } });
assert.strictEqual(b.fehler[1].gefunden, true, "Vertauschung: eine der zwei Zeilen genügt zum Finden");

b = T.bewerten("muster-ausgabe", { text: "1\n2  4 \n3 6 9\n4 8 12 16\nEnde" });
assert.deepStrictEqual([b.correct, b.max], [5, 5], "Leerraum egal");
b = T.bewerten("muster-ausgabe", { text: "1\n2 4\n3 6 9\n4 8 12 16\nEnde\nEnde" });
assert.strictEqual(b.correct, 4, "zusätzliche Zeile kostet einen Punkt");

/* ===================================================== Speichern, Journal --- */
const vorher = journal.length;
let p = T.pruefen("muster-ausgabe", { text: "1\n2 4" });
assert.ok(p.gespeichert);
assert.strictEqual(journal.length, vorher + 1);
const e = journal[journal.length - 1];
assert.deepStrictEqual([e.topic, e.source, e.task, e.kind, e.support, e.correct, e.max], ["tests", "trace", "muster-ausgabe", "auto", "selbst", 2, 5]);
T.hilfe("muster-ausgabe");
p = T.pruefen("muster-ausgabe", { text: "1\n2 4\n3 6 9\n4 8 12 16\nEnde" });
assert.strictEqual(journal[journal.length - 1].support, "hilfe");
const gespeichert = JSON.parse(speicher.get("ap2:trace"));
assert.strictEqual(gespeichert.aufgaben["muster-ausgabe"].historie.length, 2);
T._neuLaden();
assert.strictEqual(T.status("muster-ausgabe").art, "fertig");
assert.ok(/подсказк/.test(T.status("muster-ausgabe").text));
T.entwurf("lager-buchungen", { zellen: { "1:0": "1" } });
T._neuLaden();
assert.strictEqual(T.antwort("lager-buchungen").zellen["1:0"], "1", "Entwurf bleibt nach Neuladen");
assert.ok(/черновик/.test(T.status("lager-buchungen").text));
/* beschädigter Speicher: alte Zeichenkette landet in ap2:trace:sicherung */
speicher.set("ap2:trace", "{kaputt");
T._neuLaden();
T.entwurf("noten-while", { zellen: { "0:0": "0" } });
assert.strictEqual(speicher.get("ap2:trace:sicherung"), "{kaputt", "kaputte Daten werden vor dem Überschreiben gesichert");
assert.ok(/повреждены/.test(T.fehler()), "Hinweis für die Nutzerin");

console.log("trace: ok");
