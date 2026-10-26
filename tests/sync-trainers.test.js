"use strict";
const assert = require("assert"), fs = require("fs"), path = require("path"), vm = require("vm");
const S = require("../gen/sync.js"), J = JSON.stringify;
const merge = (key, a, b, lm = 100, fm = 200) => {
  const r = S.mische({ [key]: J(a) }, { [key]: lm }, { [key]: J(b) }, { [key]: fm });
  return r.schreiben[key] ? JSON.parse(r.schreiben[key]) : a;
};
const errors = [];
function test(name, run) { try { run(); } catch (e) { errors.push(name + ": " + e.stack); } }

test("Code: independent tasks, conflicting drafts and complete histories survive repeated imports", () => {
  const h = { id: "same", t: 10, code: "A", bestanden: 0, gesamt: 5, erfasst: false };
  const a = { v: 1, aufgaben: { one: { code: "old", t: 300, hilfe: true, historie: [h] }, two: { code: "local" } } };
  const b = { v: 1, aufgaben: { one: { code: "new", t: 400, hilfe: false, historie: [{ ...h, erfasst: true }, { ...h, code: "B" }] }, three: { code: "foreign" } } };
  const z = merge("ap2:code", a, b, 900, 800);
  assert.deepStrictEqual(Object.keys(z.aufgaben).sort(), ["one", "three", "two"]);
  assert.strictEqual(z.aufgaben.one.code, "new");
  assert.strictEqual(z.aufgaben.one.hilfe, false, "help belongs to selected draft");
  assert.strictEqual(z.aufgaben.one.historie.length, 2);
  assert.strictEqual(z.aufgaben.one.historie.find(x => x.code === "A").erfasst, true);
  assert(z.aufgaben.one.konflikte.some(x => x.code === "old" && x.hilfe));
  assert(z.aufgaben.one.konflikte.some(x => x.code === "new"));
  assert.deepStrictEqual(merge("ap2:code", z, b, 900, 800), z);
  assert.deepStrictEqual(merge("ap2:code", z, a, 900, 900), z);
});

test("Normal: merge scenarios and steps without attaching old assessment to different answer", () => {
  const x = { a: { key: "A" }, check: { t: 80, correct: 1 }, hilfe: true, t: 100 };
  const y = { a: { key: "B" }, check: null, hilfe: false, t: 200 };
  const a = { v: 1, sz: { kurs: { schritt: 2, s: { key: x, nf1: { a: { a: 1 } } } } }, offen: [{ id: "pc", t: 90 }] };
  const b = { v: 1, sz: { kurs: { schritt: 3, s: { key: y, nf2: { a: { b: 2 } } } }, bestellung: { s: { nf1: { a: { c: 3 } } } } }, offen: [{ id: "phone", t: 99 }] };
  const z = merge("ap2:normal", a, b);
  assert(z.sz.kurs.s.nf1 && z.sz.kurs.s.nf2 && z.sz.bestellung);
  assert.deepStrictEqual(z.sz.kurs.s.key.a, { key: "B" });
  assert.strictEqual(z.sz.kurs.s.key.check, null);
  assert(z.sz.kurs.s.key.konflikte.some(x => x.check && x.check.correct === 1));
  assert.deepStrictEqual(z.offen.map(x => x.id), ["pc", "phone"]);
  assert.deepStrictEqual(merge("ap2:normal", z, b, 200, 200), z);
  assert.deepStrictEqual(merge("ap2:normal", z, a, 200, 100), z);
});

test("Operators: keep distinct errors, round histories and conflicting unfinished rounds", () => {
  const r1 = { id: "pc", t: 10, fragen: [{ ref: "f1", typ: "op" }], antworten: [{ wahl: "nennen", t: 15 }], pos: 0 };
  const r2 = { id: "phone", t: 20, fragen: [{ ref: "f2", typ: "zahl" }], antworten: [], pos: 0 };
  const a = { v: 1, ops: { nennen: { r: 5, f: 1 } }, typen: { op: { r: 5, f: 1 } }, verwechslung: { "a>b": 2 }, fehler: { "f1|op": { ref: "f1", typ: "op", t: 10 } }, runden: [{ t: 1, r: 2, n: 3 }], runde: r1 };
  const b = { v: 1, ops: { nennen: { r: 2, f: 3 }, erklaeren: { r: 1, f: 1 } }, typen: { op: { r: 2, f: 3 }, zahl: { r: 2, f: 0 } }, verwechslung: { "a>b": 1, "c>d": 1 }, fehler: { "f2|zahl": { ref: "f2", typ: "zahl", t: 20 } }, runden: [{ t: 1, r: 0, n: 3 }], runde: r2 };
  const z = merge("ap2:opueb", a, b);
  assert.deepStrictEqual(z.ops.nennen, { r: 5, f: 3 });
  assert(z.ops.erklaeren && z.typen.zahl);
  assert.strictEqual(z.verwechslung["a>b"], 2);
  assert.strictEqual(Object.keys(z.fehler).length, 2);
  assert.strictEqual(z.runden.length, 2);
  assert.deepStrictEqual(z.runde, r2);
  assert(z.rundenKonflikte.some(x => x.id === "pc" && x.antworten[0].wahl === "nennen"));
  assert(z.rundenKonflikte.some(x => x.id === "phone"));
  assert.deepStrictEqual(merge("ap2:opueb", z, b, 200, 200), z);
  assert.deepStrictEqual(merge("ap2:opueb", z, a, 200, 100), z);
});

test("Azubi rubric stays with exact answer and independent rubric entries are retained", () => {
  const a = { a: { one: { f: "old" }, two: { f: "same" } }, pruefpunkte: { one: [true], two: [false, true] }, zuletzt: 100 };
  const b = { a: { one: { f: "new" }, three: { f: "other" } }, pruefpunkte: { three: [true] }, zuletzt: 200 };
  const z = merge("ap2:azubi:ga1-test", a, b);
  assert.deepStrictEqual(z.pruefpunkte, { two: [false, true], three: [true] });
  assert(z.konflikte.some(x => x.teil === "one" && x.stand.pruefpunkte[0] === true));
  assert.deepStrictEqual(merge("ap2:azubi:ga1-test", z, b), z);
});

// Exercise the actual FileReader import path with browser boundary adapters.
function importer(values, accept = true, failBackup = false) {
  const memory = { ...values }, messages = [];
  class Storage {
    get length() { return Object.keys(memory).length; }
    key(i) { return Object.keys(memory)[i]; }
    getItem(k) { return memory[k] ?? null; }
    setItem(k, v) { if (failBackup && k === "ap2-sync:backup") throw Error("quota"); memory[k] = String(v); }
    removeItem(k) { delete memory[k]; }
  }
  const R = { Storage, localStorage: new Storage(), console, setTimeout: () => 0, clearTimeout() {}, addEventListener() {},
    document: { readyState: "loading", addEventListener() {}, getElementById: id => id === "syMeldung" ? { set textContent(text) { messages.push(text); }, classList: { toggle() {}, add() {}, remove() {} } } : null },
    FileReader: class { readAsText(file) { this.result = file; this.onload(); } },
    confirm: text => { messages.push(text); return accept; }, toast: text => messages.push(text),
    location: { reload() { R.reloaded = true; } }, navigator: {}, reloaded: false };
  R.window = R; vm.createContext(R);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../gen/sync.js"), "utf8"), R);
  return { R, memory, messages };
}
test("Same-device backup restores missing data and saves current data for Undo", () => {
  const initial = { "ap2-sync:geraet": J({ id: "pc", name: "Computer" }), "ap2:code": J({ v: 1, aufgaben: { current: { code: "keep" } } }) };
  const backup = J({ typ: "ap2-sync", geraet: { id: "pc" }, speicher: { "ap2:code": J({ v: 1, aufgaben: { restored: { code: "restore" } } }) }, meta: {} });
  const { R, memory } = importer(initial);
  R.GENSYNC.holen(backup);
  assert(R.reloaded, "own backup must import and reload");
  const z = JSON.parse(memory["ap2:code"]);
  assert(z.aufgaben.current && z.aufgaben.restored);
  assert.strictEqual(JSON.parse(memory["ap2-sync:backup"]).speicher["ap2:code"], initial["ap2:code"]);
  const declined = importer(initial, false);
  declined.R.GENSYNC.holen(backup);
  assert.deepStrictEqual(declined.memory, initial, "cancel restores nothing");
});

if (errors.length) throw Error(errors.join("\n\n"));
console.log("sync trainers: nested states, conflicts, histories and own-device recovery OK");
