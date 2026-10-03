"use strict";
const assert = require("assert");
const fs = require("fs"), path = require("path"), vm = require("vm");
const base = path.join(__dirname, "..", "gen");
assert(fs.existsSync(path.join(base, "praxis.js")), "Der Praxis-Trainer muss vorliegen");
const memory = {};
const records = [];
function laden() {
  const root = { console, Date, setTimeout, clearTimeout,
    localStorage: { getItem: k => memory[k] || null, setItem: (k, v) => { memory[k] = v; } },
    GENLERNSTAND: { record: x => records.push(x) } };
  root.globalThis = root;
  vm.createContext(root);
  for (const file of ["praxis-daten.js", "praxis.js"]) vm.runInContext(fs.readFileSync(path.join(base, file), "utf8"), root);
  return root.GENPRAXIS;
}
let P = laden();
assert.strictEqual(P.liste().length, 16);
assert.strictEqual(new Set(P.liste().map(t => t.id)).size, 16);

// Hand-calculated trace: sum positive values [3, -2, 4] -> 3, 3, 7.
P.start("test-trace", "pruefung");
P.entwurf("test-trace", { verlauf: "3, 3, 7", ergebnis: "7" });
assert.strictEqual(P.abgeben("test-trace").correct, 3);
const first = P.speichern("test-trace", [], "aufmerksamkeit");
assert.strictEqual(first.support, "selbst");
assert.strictEqual(first.kind, "auto");
assert.strictEqual(records.length, 1);
assert.strictEqual(records[0].answers.verlauf, "3, 3, 7");
first.answers.verlauf = "tampered";
records[0].answers.ergebnis = "tampered";
assert.strictEqual(P.stand("test-trace").attempts[0].answers.verlauf, "3, 3, 7");
assert.strictEqual(P.stand("test-trace").attempts[0].answers.ergebnis, "7");
P.speichern("test-trace", [], "wissen");
assert.strictEqual(records.length, 1, "Doppelklick darf keinen zweiten Versuch erzeugen");
assert.throws(() => P.entwurf("test-trace", { ergebnis: "8" }), /уже сдан/i);

// Reload keeps complete old answers; the second variant has other numbers.
P = laden();
assert.strictEqual(P.stand("test-trace").attempts[0].reason, "aufmerksamkeit");
const second = P.start("test-trace", "hilfe", true);
assert.strictEqual(second.variant, 1);
P.entwurf("test-trace", { verlauf: "0 5 6", ergebnis: "6" });
P.hilfe("test-trace", "hilfe");
P.modus("test-trace", "pruefung");
assert.strictEqual(P.abgeben("test-trace").correct, 3);
assert.strictEqual(P.speichern("test-trace").support, "hilfe", "Moduswechsel löscht gesehene Hilfe nicht");
assert.strictEqual(P.stand("test-trace").attempts.length, 2);

P.start("test-trace", "pruefung", true);
P.entwurf("test-trace", { verlauf: "3 3 7", ergebnis: "7 Tage" });
assert.strictEqual(P.abgeben("test-trace").correct, 2, "Zahlparser darf angehängten Text nicht ignorieren");
assert.strictEqual(P.speichern("test-trace").support, "selbst", "Lösung erst nach Abgabe ist normale Rückmeldung");
P.start("test-trace", "pruefung", true);
P.hilfe("test-trace", "loesung");
P.entwurf("test-trace", { verlauf: "0 5 6", ergebnis: "6" });
P.abgeben("test-trace");
assert.strictEqual(P.speichern("test-trace").support, "loesung");

// Ordinary draft, pending submission and abandoned draft survive navigation/reload.
P.start("ga1-api", "hilfe");
P.entwurf("ga1-api", { antwort: "POST /reservierungen; Eingaben werden geprüft." });
P = laden();
assert(P.stand("ga1-api").draft.answers.antwort.includes("reservierungen"));
assert.strictEqual(P.abgeben("ga1-api").kind, "selbst");
P = laden();
assert(P.stand("ga1-api").draft.submission.answers.antwort.includes("reservierungen"));
assert.throws(() => P.speichern("ga1-api", ["fremdes-kriterium"]), /Kriterium/);
const apiResult = P.speichern("ga1-api", ["vertrag", "validierung"], "sprache");
assert.strictEqual(apiResult.kind, "selbst");
assert.strictEqual(apiResult.correct, 2);
assert.strictEqual(apiResult.max, 4);
assert.strictEqual(apiResult.support, "selbst");
P.start("ga1-api", "erklaert", true);
P.entwurf("ga1-api", { antwort: "Nicht verlieren" });
P.start("ga1-api", "pruefung", true);
assert.strictEqual(P.stand("ga1-api").drafts[0].answers.antwort, "Nicht verlieren");

// Structured comparison is exact; order matters for a trace, duplicates never disappear.
assert.strictEqual(P.pruefeFeld({ typ: "folge", loesung: [1, 2, 3] }, "3 2 1"), false);
assert.strictEqual(P.pruefeFeld({ typ: "folge", loesung: [1, 2, 3] }, "1 2 3 4"), false);
assert.strictEqual(P.pruefeFeld({ typ: "menge", loesung: [1, 2, 3] }, "3; 1; 2"), true);
assert.strictEqual(P.pruefeFeld({ typ: "menge", loesung: [1, 2, 3] }, "1 2 2 3"), false);
for (const roh of ["", "NaN", "Infinity", "7abc", "7 + 0", "0x7"]) {
  assert.strictEqual(P.pruefeFeld({ typ: "zahl", loesung: 7 }, roh), false);
}
assert.strictEqual(P.pruefeFeld({ typ: "zahl", loesung: 1.5 }, "1,5"), true);

// Every exact variant accepts its complete solution and rejects blank answers.
let auto = 0, rubric = 0;
for (const info of P.liste()) {
  const task = P.aufgabe(info.id);
  assert(task.erklaerung && task.beispiel && task.hinweis && task.begriffe.length);
  for (const v of task.varianten) {
    assert(v.auftrag && v.loesung && v.analyse);
    if (v.rubrik) {
      rubric++;
      assert(v.rubrik.length >= 3);
      assert.strictEqual(new Set(v.rubrik.map(x => x.id)).size, v.rubrik.length);
    } else {
      auto++;
      assert(task.varianten.length >= 2);
      for (const f of v.felder) {
        const answer = Array.isArray(f.loesung) ? f.loesung.join(" ") : String(f.loesung);
        assert(P.pruefeFeld(f, answer), info.id + ": vollständige Lösung");
        assert(!P.pruefeFeld(f, ""), info.id + ": leer ist keine Lösung");
      }
    }
  }
}
assert(auto >= 12 && rubric >= 6);
assert.throws(() => P.start("unbekannt"), /Unbekannte/);
assert.throws(() => P.start("test-trace", "invalid", true), /Modus/);

console.log("praxis: 16 Aufgaben, genaue Vergleiche, Varianten, Entwürfe, unveränderliche Versuche und Hilfe-Historie OK");
