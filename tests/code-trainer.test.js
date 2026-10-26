"use strict";
/* Code-Trainer: Entwurf, Versuche, Hilfe/Lösung, Journal — mit falschem localStorage. */
const assert = require("assert");
const fs = require("fs"), path = require("path"), vm = require("vm");

const memory = {}, events = [];
let now = 1000, failStorage = false, failRecord = false;
function laden() {
  const root = {
    Date: class extends Date { static now() { return now; } }, console, JSON, Math,
    localStorage: {
      getItem: k => (Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null),
      setItem: (k, v) => { if (failStorage) throw new Error("QuotaExceeded"); memory[k] = String(v); }
    },
    GENLERNSTAND: { record: e => { if (failRecord) return { ok: false, error: "Результат не сохранён" }; events.push(JSON.parse(JSON.stringify(e))); return { ok: true }; } }
  };
  root.globalThis = root;
  vm.createContext(root);
  ["code-lauf.js", "code-daten.js", "code-trainer.js"].forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, "../gen", f), "utf8"), root, { filename: f }));
  return root;
}

let R = laden(), C = R.GENCODE;
assert(C && typeof C.oeffnen === "function" && typeof C.liste === "function", "API GENCODE");
const A = R.AP2_CODE_AUFGABEN, a = A.find(x => x.id === "summe-zugaenge");
assert.strictEqual(C.liste().length, 10);
assert(C.liste().every(x => x.status.art === "neu" && x.status.text === "не решала"), "anfangs nichts gelöst");

/* Entwurf übersteht das Neuladen */
assert.strictEqual(C.code(a.id), a.vorlage, "ohne Entwurf: Vorlage");
assert(C.entwurf(a.id, "int summeZugaenge(int[] aenderungen) {\n    int summe = 0;\n}\n").ok);
R = laden(); C = R.GENCODE;
assert(/int summe = 0;/.test(C.code(a.id)), "Entwurf nach Reload da");
assert(/черновик/.test(C.status(a.id).text), "Status zeigt Entwurf");

/* Lösung erst nach einem Lauf */
assert.strictEqual(C.loesungZeigen(a.id).ok, false, "Lösung vor dem ersten Lauf gesperrt");
assert.strictEqual(C.support(a.id), "selbst");

/* Erster Lauf: Kompilierfehler, 0 von 5, Journal-Eintrag */
now = 2000;
let r = C.pruefen(a.id);
assert.strictEqual(r.kompiliert, false); assert.strictEqual(r.bestanden, 0); assert.strictEqual(r.gesamt, 5);
assert(/Строка 3/.test(r.fehler.meldung), "Fehler mit Zeilennummer: " + r.fehler.meldung);
assert.strictEqual(events.length, 1);
let e = events[0];
assert.strictEqual(e.topic, "algo"); assert.strictEqual(e.source, "code"); assert.strictEqual(e.task, a.id);
assert.strictEqual(e.correct, 0); assert.strictEqual(e.max, 5); assert.strictEqual(e.kind, "auto"); assert.strictEqual(e.support, "selbst");
assert(e.id && e.answers && /summe = 0/.test(e.answers.code), "Code im Journal");
assert.strictEqual(C.status(a.id).text, "решено 0 из 5 тестов");

/* Teilweise richtig */
now = 3000;
r = C.pruefen(a.id, "int summeZugaenge(int[] aenderungen) {\n    int summe = 0;\n    for (int x : aenderungen) summe += x;\n    return summe;\n}\n");
assert(r.kompiliert && r.bestanden > 0 && r.bestanden < r.gesamt, "Summe aller Werte besteht nur einen Teil");
assert(r.tests.some(t => t.verdeckt && !t.ok && t.fall), "verdeckter Grenzfall ist beschriftet");
assert.strictEqual(C.status(a.id).text, "решено " + r.bestanden + " из 5 тестов");
assert.notStrictEqual(events[1].id, events[0].id, "jeder Lauf hat eine eigene ID");

/* Hinweis → hilfe, Lösung → loesung */
assert(C.hilfe(a.id).ok); assert.strictEqual(C.support(a.id), "hilfe");
now = 4000; r = C.pruefen(a.id);
assert.strictEqual(r.support, "hilfe"); assert.strictEqual(events[2].support, "hilfe");
const lz = C.loesungZeigen(a.id);
assert(lz.ok && lz.loesung === a.loesung, "Lösung nach einem Lauf sichtbar");
now = 5000; r = C.pruefen(a.id, a.loesung);
assert.strictEqual(r.bestanden, r.gesamt); assert.strictEqual(r.support, "loesung");
assert.strictEqual(events[3].support, "loesung"); assert.strictEqual(events[3].correct, events[3].max);
assert(/все тесты пройдены/.test(C.status(a.id).text) && /с решением/.test(C.status(a.id).text), "Hilfe bleibt im Status sichtbar");

/* Reload: Flags und Historie bleiben */
R = laden(); C = R.GENCODE;
assert.strictEqual(C.support(a.id), "loesung");
assert.strictEqual(C.stand().aufgaben[a.id].historie.length, 4);
assert.strictEqual(C.stand().aufgaben[a.id].historie[3].code, a.loesung);

/* Neuer Versuch: ohne Hilfe, Vorlage, selbständig gelöst zählt besser */
assert(C.neuerVersuch(a.id).ok);
assert.strictEqual(C.support(a.id), "selbst"); assert.strictEqual(C.code(a.id), a.vorlage);
assert.strictEqual(C.loesungZeigen(a.id).ok, false, "im neuen Versuch wieder erst nach Lauf");
now = 6000; r = C.pruefen(a.id, a.loesung);
assert.strictEqual(r.support, "selbst");
assert.strictEqual(r.eintrag.familiar, true, "reset preserves familiarity with the solution");
assert(/знаком/.test(C.status(a.id).text), "known solution is labelled as familiar practice");
assert.strictEqual(C.stand().aufgaben[a.id].historie[4].versuch, 2);

/* Speicher voll: Text bleibt im Arbeitsspeicher, klare Meldung */
const b = A.find(x => x.id === "bubble-sort");
failStorage = true;
const s = C.entwurf(b.id, "void sortiere(int[] punkte) { }");
assert.strictEqual(s.ok, false); assert(/не удалось сохранить/i.test(s.error) && /Текст остаётся/.test(s.error));
assert.strictEqual(C.code(b.id), "void sortiere(int[] punkte) { }", "Eingabe geht nicht verloren");
now = 7000; r = C.pruefen(b.id);
assert.strictEqual(r.gespeichert, false); assert(r.speicherfehler);
failStorage = false;

/* Journal nicht erreichbar: später mit derselben ID nachtragen */
failRecord = true;
const vorher = events.length;
now = 8000; C.pruefen(b.id, b.loesung);
assert.strictEqual(events.length, vorher);
const offen = C.stand().aufgaben[b.id].historie.filter(h => !h.erfasst).map(h => h.id);
assert(offen.length >= 1);
failRecord = false;
now = 9000; C.pruefen(b.id, b.loesung);
offen.forEach(id => assert(events.some(x => x.id === id), "nachgetragen: " + id));
assert(C.stand().aufgaben[b.id].historie.every(h => h.erfasst), "alles erfasst");

/* History and imported conflicting drafts survive subsequent saves. */
let saved = JSON.parse(memory["ap2:code"]);
saved.aufgaben[b.id].konflikte = [{ code: "phone draft", t: 500 }];
saved.extra = { future: true };
memory["ap2:code"] = JSON.stringify(saved);
R = laden(); C = R.GENCODE;
for (let i = 0; i < 45; i++) { now++; C.pruefen(b.id, b.loesung); }
assert(C.stand().aufgaben[b.id].historie.length >= 48, "history is never silently trimmed");
assert.strictEqual(C.stand().aufgaben[b.id].konflikte[0].code, "phone draft");
assert.strictEqual(C.stand().extra.future, true);

/* Kaputter Speicher: kein Absturz, Sicherung bleibt */
memory["ap2:code"] = "{kaputt";
R = laden(); C = R.GENCODE;
assert(/повреждены/.test(C.fehler()));
assert.strictEqual(C.code(a.id), a.vorlage);
C.entwurf(a.id, "neu");
assert.strictEqual(memory["ap2:code:sicherung"], "{kaputt", "alte Daten werden gesichert, nicht verworfen");

/* Unbekannte Aufgabe */
assert.throws(() => C.pruefen("gibt-es-nicht"), /Неизвестная/);

console.log("code-trainer: ok");
