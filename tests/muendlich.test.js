"use strict";
/* Mündliche Ergänzungsprüfung (gen/muendlich.js): Gewichtung 2 : 1, Mindestpunkte, Auswahl der Fragen.
   node tests/muendlich.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
const M = require(path.join(root, "gen", "muendlich.js"));

assert.strictEqual(M.ergebnis(40, 70), 50, "(2·40 + 70) ÷ 3 = 50");
assert.strictEqual(M.ergebnis(45, 50), 46.7);
assert.strictEqual(M.noetig(40), 70);
assert.strictEqual(M.noetig(45), 60);
assert.strictEqual(M.noetig(44.5), 61, "ganze Punkte, aufgerundet");
assert.strictEqual(M.noetig(25), 100, "genau 100 reicht");
assert.strictEqual(M.noetig(24), null, "auch 100 reichen nicht");
assert.strictEqual(M.noetig(50), 0);
assert.strictEqual(M.noetig(70), 0);
for (let x = 25; x < 50; x++) { const n = M.noetig(x); assert.ok(M.ergebnis(x, n) >= 50 && (n === 0 || (2 * x + n - 1) / 3 < 50), "Minimum für " + x); }
assert.strictEqual(M.DAUER, 180, "3 Minuten");
assert.strictEqual(M.KRITERIEN.length, 5);

/* Kandidaten: nur Originalbögen der Teilprüfung, nur Teile mit Musterlösung */
const mod = (id, teile) => ({ id, aufgaben: [{ nr: 1, teile }] });
const mods = [
  mod("ga1-2025-s", [{ id: "a", loesung: "x" }, { id: "b" }]),
  mod("ga2-2025-s", [{ id: "c", loesung: "y" }]),
  mod("azprog1", [{ id: "d", loesung: "z" }])
];
assert.deepStrictEqual(M.kandidaten(mods, null, "ga1").map(x => x.tid), ["a"]);
assert.deepStrictEqual(M.kandidaten(mods, null, "ga2").map(x => x.tid), ["c"]);
assert.deepStrictEqual(M.kandidaten(mods, null, "wiso"), []);
/* echtes Paket: in jeder Teilprüfung gibt es Fragen */
const t = fs.readFileSync(path.join(root, "privat", "ap2-paket.js"), "utf8");
const P = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
["ga1", "ga2", "wiso"].forEach(b => assert.ok(M.kandidaten(P.module, null, b).length >= 20, b + ": genug Fragen mit Lösung"));

const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/muendlich.js", "gen/muendlich.css"].forEach(f => { assert.ok(html.includes(f)); assert.ok(sw.includes("./" + f)); });
console.log("muendlich: ok");
