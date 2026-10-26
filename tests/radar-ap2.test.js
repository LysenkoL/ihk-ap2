"use strict";
/* Radar AP2 (gen/radar-ap2.js) auf den echten Verweisen aus AP2_TRAINING.  node tests/radar-ap2.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
require(path.join(root, "gen", "lernweg-daten.js"));
require(path.join(root, "gen", "training-wiso-daten.js"));
const R = require(path.join(root, "gen", "radar-ap2.js"));
const T = global.AP2_TRAINING;

assert.strictEqual(R.terminName("2021-w"), "W21/22");
assert.strictEqual(R.terminName("2026-s"), "S26");
assert.strictEqual(R.terminName("2099-w"), "W99/00");
assert.strictEqual(R.terminVon("ga2-2024-w"), "2024-w");
assert.strictEqual(R.terminVon("prognose-1"), null);
assert.deepStrictEqual([0, 3, 4, 6, 7, 9, 10].map(n => R.kategorie(n, 10)), ["selten", "selten", "manch", "manch", "oft", "oft", "immer"]);
assert.strictEqual(R.kategorie(9, 9), "immer"); assert.strictEqual(R.kategorie(0, 0), "selten");

const tj = R.termineJeTeil(T);
assert.strictEqual(tj.GA1.length, 10, "10 GA1-Termine");
assert.strictEqual(tj.GA2.length, 10, "10 GA2-Termine");
assert.strictEqual(tj.WiSo.length, 9, "9 WiSo-Termine");
assert.deepStrictEqual(tj.GA1.slice(0, 3), ["2021-w", "2022-s", "2022-w"], "Sommer vor Winter, aufsteigend");

const z = R.radar(T);
assert.strictEqual(z.length, T.length);
z.forEach(x => {
  assert.strictEqual(x.zellen.length, x.von);
  assert.ok(x.n <= x.von && x.n4 <= 4 && x.n4 <= x.n);
  const t = T.find(y => y.id === x.id);
  if (t.pruef != null && x.bereich !== "WiSo") assert.strictEqual(x.n, t.pruef, x.id + ": Anzahl Prüfungen wie in AP2_TRAINING");
});
for (let i = 1; i < z.length; i++) assert.ok(z[i - 1].schnitt >= z[i].schnitt, "sortiert nach Punkten je Prüfung");
const algo = z.find(x => x.id === "ga2-algo");
assert.strictEqual(algo.n, 10); assert.strictEqual(algo.kat, "immer"); assert.strictEqual(algo.pause, 0);
assert.ok(new Set(z.map(x => x.kat)).size >= 2, "Kategorien unterscheiden die Themen");

/* Künstliche Daten: Zellen, Schnitt, Pause */
const fake = [{ id: "a", bereich: "GA1", name: "A", aufgaben: [["ga1-2021-w", "1", 20, []], ["ga1-2022-s", "1", 10, []], ["ga1-2022-s", "2", 5, []]] },
  { id: "b", bereich: "GA1", name: "B", aufgaben: [["ga1-2022-w", "1", 25, []], ["ga1-2023-s", "1", 25, []]] }];
const f = R.radar(fake);
const a = f.find(x => x.id === "a");
assert.deepStrictEqual(a.zellen.map(c => c.punkte), [20, 15, 0, 0]);
assert.strictEqual(a.schnitt, 8.8); assert.strictEqual(a.zuletzt, "2022-s"); assert.strictEqual(a.pause, 2);
assert.strictEqual(a.n4, 2); assert.strictEqual(f.find(x => x.id === "b").n4, 2);

/* Eigener Stand: aktueller Stand, sonst letzter Versuch; nur bewertete Teile */
const thema = { aufgaben: [["ga1-2024-s", "1", 20, ["t1", "t2"]], ["ga1-2023-w", "2", 10, ["u1"]], ["ga1-1999-s", "1", 5, ["x"]]] };
const zst = { "ga1-2024-s": { p: { t1: 6 }, versuche: [] }, "ga1-2023-w": { p: {}, versuche: [{ zustand: { p: { u1: 2 } } }] } };
const mx = { t1: 10, t2: 10, u1: 10 };
const st = R.eigenerStand(thema, mid => zst[mid] || null, (mid, tid) => mx[tid] || 0);
assert.deepStrictEqual(st, { punkte: 8, max: 20, prozent: 40, teile: 2 });
assert.strictEqual(R.eigenerStand(thema, () => null, () => 10), null);
assert.strictEqual(R.prioritaet({ kat: "immer", schnitt: 5 }, st), true);
assert.strictEqual(R.prioritaet({ kat: "oft", schnitt: 20 }, null), true, "viele Punkte");
assert.strictEqual(R.prioritaet({ kat: "oft", schnitt: 10 }, null), false);
assert.strictEqual(R.prioritaet({ kat: "immer", schnitt: 30 }, { prozent: 70 }), false);

const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.ok(html.includes("gen/radar-ap2.js") && html.includes("gen/radar-ap2.css") && sw.includes("./gen/radar-ap2.js") && sw.includes("./gen/radar-ap2.css"));
console.log("radar-ap2: " + z.length + " Themen OK");
