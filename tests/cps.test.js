"use strict";
/* Cyber-physische Systeme (gen/cps-daten.js) im Motor gen/uebung-gen.js.  node tests/cps.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
const G = require(path.join(root, "gen", "uebung-gen.js"));
const S = require(path.join(root, "gen", "cps-daten.js"));
G.sammlung(S);
assert.ok(S.GERAETE.some(g => g[2]) && S.GERAETE.some(g => !g[2]), "Sensoren und Aktoren");
assert.strictEqual(new Set(S.GERAETE.map(g => g[1])).size, S.GERAETE.length);
S.aufgaben.forEach(a => {
  for (let seed = 1; seed <= 300; seed++) {
    const x = G.bauen("cps", a.id, seed);
    const antw = {}; x.felder.forEach(f => { antw[f.id] = f.art === "wahl" ? String(f.soll) : G.fmt(f.soll, 2); });
    const r = G.bewerten(x, antw);
    assert.strictEqual(r.correct, r.max, a.id + " " + seed + " " + JSON.stringify(antw));
  }
});
/* Werte von Hand */
const finde = (id, t) => { for (let s = 1; s < 20000; s++) { const x = G.bauen("cps", id, s); if (t(x)) return x; } throw new Error(id); };
let x = finde("abtast", x => x.gegeben[0][1] === "50 Hz");
assert.deepStrictEqual(x.felder.map(f => f.soll), [100, 10], "50 Hz → mindestens 100 Hz, höchstens 10 ms");
x = finde("adc", x => x.gegeben[0][1] === "10 Bit" && x.gegeben[1][1] === "0 bis 5 V");
assert.strictEqual(x.felder[0].soll, 1024);
assert.ok(Math.abs(x.felder[1].soll - 4.8828125) < 1e-9, "5 V / 1024 = 4,88 mV");
for (let s = 1; s < 3000; s++) { const y = G.bauen("cps", "adc", s); assert.ok(y.felder[2].soll <= y.felder[0].soll - 1 && y.felder[2].soll >= 0, "Digitalwert im Bereich"); }
x = finde("messreihe", x => x.gegeben[0][1] === "12 Bit je Wert");
assert.strictEqual(x.felder[0].soll, 2, "12 Bit → 2 Byte");
x = finde("ereignis", x => /mindestens 100 ms/.test(x.situation) && /alle 150 ms/.test(x.situation));
assert.strictEqual(x.felder[0].soll, 1, "150 ms Intervall bei 100 ms Druck: nicht sicher");
assert.strictEqual(x.felder[1].soll, 50);
const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.ok(html.includes("gen/cps-daten.js") && sw.includes("./gen/cps-daten.js"));
console.log("cps: " + S.aufgaben.length + " Aufgabentypen OK");
