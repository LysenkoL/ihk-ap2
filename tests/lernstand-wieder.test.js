"use strict";
const assert = require("assert");
const storage = {};
global.localStorage = { getItem: k => storage[k] || null, setItem: (k, v) => { storage[k] = String(v); } };
const journal = require("../gen/lernstand.js");
const wieder = require("../gen/wiederholen.js");
const sql = require("../gen/sql-daten.js");
const pxSnapshot = { titel: "Alter Stand", variante: { auftrag: "Berechnen Sie 2 + 3.", loesung: "5", analyse: "Zwei plus drei.", felder: [{ id: "summe", label: "Summe" }] } };
global.GENPRAXIS = { stand: () => ({ attempts: [{ id: "px1", snapshot: pxSnapshot }] }) };
global.GENLERNWEG = { stand: () => ({ history: [{ id: "lw1", snapshot: { title: "Begründen", control: "Erklären Sie den Unterschied.", answer: "Modellantwort", rubric: ["Zwei Begriffe unterscheiden"] } }] }) };
function event(id, source, task, opt = {}) {
  const e = Object.assign({ id, t: 100, topic: source, source, task, correct: 0, max: 1, support: "selbst", kind: "auto", answers: "mein Versuch" }, opt);
  assert(journal.record(e).ok); return e;
}
event("sql-falsch", "sql", "g1");
event("sql-kopie", "sql", "g1", { t: 200, correct: 1, support: "loesung" });
event("algo-alt", "algo", "bubble:alter-datensatz", { answers: { input: [4, 2], phase: "sortieren" } });
event("praxis:px1", "praxis", "test", { kind: "selbst" });
event("lw1", "lernweg", "erstes", { kind: "selbst", support: "hilfe" });
event("quiz-falsch", "quiz", "q1", { kind: "recognition" });
const P = require("../gen/lernstand-wieder.js");
assert.strictEqual(global.GENWIEDER_EXTRA.filter(p => p.key === P.key).length, 1);
let items = P.sammeln();
assert.strictEqual(items.length, 4, "SQL, Algo, Praxis und Lernweg; Quiz bleibt bei seiner vorhandenen Quelle");
const sq = items.find(x => x.event.source === "sql");
assert.strictEqual(sq.event.id, "sql-falsch", "Kopie der Lösung löscht selbständige Fehler nicht");
assert(items.find(x => x.event.source === "praxis").punkte.includes("самооценка"));
assert(items.find(x => x.event.source === "lernweg").punkte.includes("помощ"));
assert.strictEqual(wieder.kandidaten().filter(x => x.quelle === P.key).length, 4, "echte gemeinsame Warteschlange erhält die Quelle");
const initial = wieder.naechster(null, "gut", new Date(2026, 9, 1, 9));
wieder.S.k[sq.id] = wieder.naechster(initial, "gut", new Date(2026, 9, 1, 17));
assert(wieder.liste().some(x => x.id === sq.id), "zweimal am selben Tag ist noch offen");
wieder.S.k[sq.id] = wieder.naechster(wieder.S.k[sq.id], "gut", new Date(2026, 9, 3, 9));
assert(!wieder.liste().some(x => x.id === sq.id), "Erfolg an zweitem Tag beendet nur die Wiederholung");
assert.strictEqual(journal.list().length, 6, "Queue-Abschluss löscht keine Beobachtung");
event("sql-neuer-fehler", "sql", "g1", { t: 300 });
assert(wieder.liste().some(x => x.event && x.event.id === "sql-neuer-fehler"), "späterer Fehler öffnet eine neue Wiederholung");
P.einordnen(P.sammeln().find(x => x.event.source === "sql"), "halb");
assert.strictEqual(journal.list().slice(-1)[0].kind, "selbst");
assert.strictEqual(journal.list().slice(-1)[0].source, "wiederholung");
assert.strictEqual(P.sammeln().length, 4, "Selbsteinschätzung erzeugt keine rekursive neue Fehlerkarte");

/* Kleine DOM-Grenze, echte Renderer und sichtbarer Inhalt werden geprüft. */
function node(tag) { return { tag, textContent: "", children: [], appendChild(n) { this.children.push(n); return n; } }; }
global.document = { createElement: node, getElementById: () => null };
const text = n => [n.textContent, ...n.children.map(text)].join(" ");
let question = node("div"), solution = node("div");
P.frage(sq, question); P.loesung(sq, solution);
assert(text(question).includes(sql.AUFGABEN.find(a => a.id === "g1").text));
assert(text(solution).includes(sql.AUFGABEN.find(a => a.id === "g1").loesung));
assert(/Текущая версия/.test(text(question)), "ältere SQL-Einträge ohne Snapshot werden als aktuelle Fassung bezeichnet");
question = node("div"); solution = node("div");
const oldAlgo = P.sammeln().find(x => x.event.source === "algo");
P.frage(oldAlgo, question); P.loesung(oldAlgo, solution);
assert(/полностью восстановить/i.test(text(question)));
assert(/новый пример/i.test(text(solution)));
assert(!/Массив:/.test(text(question)), "fehlende Ausgangszahlen werden nicht erfunden");
question = node("div"); solution = node("div");
const px = P.sammeln().find(x => x.event.source === "praxis");
P.frage(px, question); P.loesung(px, solution);
assert(text(question).includes("Berechnen Sie 2 + 3."));
assert(text(solution).includes("5"));
question = node("div"); solution = node("div");
const lw = P.sammeln().find(x => x.event.source === "lernweg");
P.frage(lw, question); P.loesung(lw, solution);
assert(text(question).includes("Erklären Sie den Unterschied."));
assert(text(solution).includes("Zwei Begriffe unterscheiden"));

event("algo-voll", "algo", "bubble:neu", { t: 400, answers: { input: [3, 1] }, snapshot: {
  type: "algo", modus: "bubble", aufgabe: { feld: [3, 1], auf: true }, schritt: 0, phase: "sortieren", soll: [1, 3]
} });
question = node("div"); solution = node("div");
const exactAlgo = P.sammeln().find(x => x.event.id === "algo-voll");
P.frage(exactAlgo, question); P.loesung(exactAlgo, solution);
assert(text(question).includes("[3,1]"));
assert(text(solution).includes("[1,3]"));
assert(!text(question).includes("[1,3]"), "Lösung steht nicht vor dem Aufdecken in der Frage");
event("algo-unvollstaendig", "algo", "binaer:alt", { t: 500, snapshot: {
  type: "algo", modus: "binaer", aufgabe: { feld: [1, 3, 7] }, soll: { links: 0, rechts: 2, mitte: 1 }
} });
question = node("div");
P.frage(P.sammeln().find(x => x.event.id === "algo-unvollstaendig"), question);
assert(/полностью восстановить/.test(text(question)), "fehlende Suchzahl, Phase und Schrittnummer werden nicht ergänzt");
const calls = [];
global.GENSQL = { oeffnen: opt => calls.push(["sql", opt.id]) };
global.GENALGO = { oeffnen: modus => calls.push(["algo", modus]) };
global.GENPRAXIS.oeffnen = id => calls.push(["praxis", id]);
global.GENLERNWEG.oeffnen = id => calls.push(["lernweg", id]);
P.oeffnen(sq); P.oeffnen(exactAlgo); P.oeffnen(px); P.oeffnen(lw);
assert.deepStrictEqual(calls, [["sql", "g1"], ["algo", "bubble"], ["praxis", "test"], ["lernweg", "erstes"]]);
event("bad-rubric", "lernweg", "kaputt", { snapshot: { title: "Unvollständig", control: "Frage", answer: "Antwort", rubric: {} } });
const brokenRubric = P.sammeln().find(x => x.event.id === "bad-rubric");
assert.doesNotThrow(() => P.loesung(brokenRubric, node("div")), "unvollständige importierte Rubrik blockiert die Karte nicht");
event("bad-fields", "praxis", "kaputt", { snapshot: { titel: "Unvollständig", variante: { auftrag: "Frage", loesung: "Antwort", felder: {}, rubrik: {} } } });
const brokenFields = P.sammeln().find(x => x.event.id === "bad-fields");
assert.doesNotThrow(() => P.frage(brokenFields, node("div")), "unvollständige Felder blockieren Frage nicht");
assert.doesNotThrow(() => P.loesung(brokenFields, node("div")), "unvollständige Kriterien blockieren Lösung nicht");
console.log("lernstand-wieder: gemeinsame Queue, Hilfe/Selbstbewertung, Snapshots, Rückwege, zwei Lerntage OK");
