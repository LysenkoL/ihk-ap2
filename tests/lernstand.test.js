"use strict";
const assert = require("assert"), path = require("path"), fs = require("fs"), vm = require("vm");
const file = path.join(__dirname, "../gen/lernstand.js");
function laden(werte = {}, opt = {}) {
  const speicher = Object.assign({}, werte), alerts = [];
  const body = { appendChild: e => alerts.push(e) };
  const ctx = { Date, Math, JSON, Set, Map, console, localStorage: {
    getItem: k => speicher[k] || null,
    setItem: (k, v) => { if (opt.voll) throw new Error("quota"); speicher[k] = v; }
  }, document: { body, getElementById: () => null, createElement: () => ({ setAttribute(k, v) { this[k] = v; } }) } };
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx);
  return { api: ctx.GENLERNSTAND, speicher, alerts };
}
const plain = x => JSON.parse(JSON.stringify(x));
const a = laden();
let r = a.api.record({ topic: "sql", source: "sql", task: "select1", correct: 3, max: 4, support: "selbst", kind: "auto", answers: { code: "SELECT name FROM Kunde" } });
assert(r.ok && r.event.id, "ein überprüftes Ergebnis wird gespeichert");
assert.strictEqual(JSON.parse(a.speicher["ap2:lernstand"])[0].answers.code, "SELECT name FROM Kunde");
assert.strictEqual(laden(a.speicher).api.list().length, 1, "bleibt nach Neuladen erhalten");
const copy = a.api.list(); copy[0].answers.code = "verändert";
assert.strictEqual(a.api.list()[0].answers.code, "SELECT name FROM Kunde", "Rückgabe ändert das Archiv nicht");

a.api.record({ topic: "sql", source: "sql", task: "select2", correct: 1, max: 2, support: "selbst", kind: "auto", answers: "SELECT *" });
a.api.record({ topic: "sql", source: "sql", task: "select1", correct: 4, max: 4, support: "loesung", kind: "auto", answers: "Muster" });
a.api.record({ topic: "sql", source: "quiz", task: "select3", correct: 1, max: 1, support: "selbst", kind: "recognition", answers: [1] });
a.api.record({ topic: "sql", source: "rubrik", task: "select4", correct: 1, max: 1, support: "selbst", kind: "selbst", answers: "Ich glaube ja" });
const s = a.api.summary()[0];
assert.strictEqual(s.total, 5);
assert.strictEqual(s.independent, 2);
assert.strictEqual(s.assisted, 1);
assert.strictEqual(s.recognition, 1);
assert.strictEqual(s.selfRated, 1);
assert.strictEqual(s.ratio, 4 / 6, "nur selbständige automatische Prüfungen ergeben die Quote");
assert.strictEqual(s.weak, 2, "Lösungskopie beseitigt vorherigen selbständigen Fehler nicht");
assert.strictEqual(laden({ "ap2:lernstand": JSON.stringify([{ id: "q", t: 1, topic: "git", source: "quiz", task: "g1", correct: 1, max: 1, support: "selbst", kind: "recognition" }]) }).api.summary()[0].ratio, null);

const fixed = { id: "stable-observation", topic: "algo", source: "algo", task: "bubble", correct: 1, max: 1, support: "hilfe", kind: "auto", answers: [1, 2] };
assert(a.api.record(fixed).ok);
assert(a.api.record(fixed).ok);
assert.strictEqual(a.api.list().filter(x => x.id === fixed.id).length, 1, "Doppelklick auf dieselbe Beobachtung erzeugt keine neue Übung");
assert.strictEqual(a.api.record(Object.assign({}, fixed, { correct: 0 })).ok, false, "vorhandene Beobachtung wird nicht überschrieben");
for (const bad of [{ max: 0 }, { correct: 2, max: 1 }, { correct: -1 }, { support: "unbekannt" }, { kind: "exakt" }]) {
  const before = a.api.list().length;
  assert.strictEqual(a.api.record(Object.assign({}, fixed, { id: undefined }, bad)).ok, false);
  assert.strictEqual(a.api.list().length, before);
}

const many = Array.from({ length: 250 }, (_, i) => ({ id: "old" + i, t: i, topic: "sql", source: "sql", task: "t" + i, correct: 0, max: 1, support: "selbst", kind: "auto" }));
const b = laden({ "ap2:lernstand": JSON.stringify(many), "ap2:lernen": '{"q:rest":{"ok":1}}' });
b.api.record({ topic: "sql", source: "sql", task: "next", correct: 1, max: 1, support: "selbst", kind: "auto" });
assert.strictEqual(b.api.list().length, 251, "Historie wird nicht abgeschnitten");
assert(b.api.coverage().some(x => x.source === "quiz" && x.hasLegacy && x.events === 0), "alter Quizstand wird nicht als beobachtete Selbständigkeit erfunden");

const voll = laden({}, { voll: true });
const v = voll.api.record({ topic: "sql", source: "sql", task: "t", correct: 0, max: 1, support: "selbst", kind: "auto" });
assert.strictEqual(v.ok, false);
assert.strictEqual(voll.api.list().length, 1, "bei vollem Speicher bleibt die Beobachtung in der geöffneten Seite");
assert(voll.alerts.some(x => x.role === "alert" && /не сохран/i.test(x.textContent)), "sichtbare Fehlermeldung statt stiller Erfolg");
assert.strictEqual(voll.api.record(v.event).ok, false, "wiederholter Speicherversuch meldet keinen falschen Erfolg");
console.log("lernstand: unveränderliche Beobachtungen, Hilfe getrennt, ehrliche Quote, Speicherfehler OK");
