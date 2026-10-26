"use strict";
/* WiSo-Rechner (gen/wiso-gen-daten.js) im Motor gen/uebung-gen.js.  node tests/wiso-gen.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
const G = require(path.join(root, "gen", "uebung-gen.js"));
const S = require(path.join(root, "gen", "wiso-gen-daten.js"));
G.sammlung(S);
const K = S.rechnen, d = K.datum;

/* jede Aufgabe: 400 Startwerte, Musterantwort ist richtig, Optionen eindeutig */
S.aufgaben.forEach(a => {
  assert.ok(/^wiso-/.test(a.topic), a.id + ": topic");
  assert.ok(S.gruppen.some(g => g.id === a.gruppe), a.id + ": gruppe");
  for (let seed = 1; seed <= 400; seed++) {
    const x = G.bauen("wiso", a.id, seed);
    assert.strictEqual(x.topic, a.topic);
    x.felder.forEach(f => { if (f.art === "wahl") assert.strictEqual(new Set(f.optionen).size, f.optionen.length, a.id + " " + seed + " doppelte Option"); });
    const antw = {}; x.felder.forEach(f => { antw[f.id] = f.art === "wahl" ? String(f.soll) : G.fmt(f.soll, 2); });
    const r = G.bewerten(x, antw);
    assert.strictEqual(r.correct, r.max, a.id + " " + seed + " " + JSON.stringify(antw));
  }
});

/* Kündigungsfristen § 622 BGB */
const T = (j, m, t) => K.tag(j, m - 1, t);
assert.strictEqual(d(K.grundfrist(T(2027, 1, 3))), "31.01.2027", "3.1. + 4 Wochen → 31.1.");
assert.strictEqual(d(K.grundfrist(T(2027, 1, 4))), "15.02.2027", "4.1. zu spät für 31.1. → 15.2.");
assert.strictEqual(d(K.grundfrist(T(2027, 1, 18))), "15.02.2027", "18.1. + 28 = 15.2.");
assert.strictEqual(d(K.grundfrist(T(2027, 1, 19))), "28.02.2027");
assert.strictEqual(d(K.grundfrist(T(2027, 5, 3))), "31.05.2027", "Zugang 3.5. reicht für 31.5.");
assert.strictEqual(d(K.grundfrist(T(2027, 5, 4))), "15.06.2027", "Zugang 4.5. zu spät für 31.5.");
assert.strictEqual(d(K.kuendigungsende("probe", T(2027, 3, 10))), "24.03.2027");
assert.strictEqual(d(K.kuendigungsende("ag", T(2027, 1, 31), 3)), "28.02.2027", "1 Monat: 31.1. → 28.2.");
assert.strictEqual(d(K.kuendigungsende("ag", T(2027, 2, 1), 3)), "31.03.2027", "1 Monat: 1.2. → Ende März");
assert.strictEqual(d(K.kuendigungsende("ag", T(2027, 4, 15), 9)), "31.07.2027", "8 Jahre → 3 Monate");
assert.strictEqual(d(K.kuendigungsende("ag", T(2027, 4, 15), 1)), d(K.grundfrist(T(2027, 4, 15))), "unter 2 Jahren → Grundfrist");
assert.strictEqual(d(K.kuendigungsende("an", T(2027, 4, 15), 22)), d(K.grundfrist(T(2027, 4, 15))), "Arbeitnehmer: immer Grundfrist");
assert.deepStrictEqual([1, 2, 5, 8, 10, 12, 15, 20].map(K.agMonate), [0, 1, 2, 3, 4, 5, 6, 7]);

/* Betriebsrat und JAV */
assert.deepStrictEqual([4, 5, 20, 21, 50, 51, 100, 101, 200, 201, 1000, 1001].map(K.brGroesse), [0, 1, 1, 3, 3, 5, 5, 7, 7, 9, 13, 15]);
assert.deepStrictEqual([4, 5, 20, 21, 50, 51, 150, 151, 300, 301].map(K.javGroesse), [0, 1, 1, 3, 3, 5, 5, 7, 7, 9]);

/* Urlaub */
assert.strictEqual(K.urlaubRunden(12.5), 13);
assert.strictEqual(K.urlaubRunden(12.4), 12.4, "unter einem halben Tag nicht abrunden");
assert.deepStrictEqual([14, 15, 16, 17, 18].map(K.jugendUrlaub), [30, 30, 27, 25, 24]);

/* Lohn von Hand: 3.000 €, Zusatz 2,5 %, kinderlos, ohne Kirche */
const finde = (id, t) => { for (let s = 1; s < 40000; s++) { const x = G.bauen("wiso", id, s); if (t(x)) return x; } throw new Error(id); };
let x = finde("lohn", x => x.gegeben[0][1] === "3.000,00 €" && /2,5 %/.test(x.gegeben[1][1]) && /kinderlos/.test(x.situation) && /keine/.test(x.gegeben[6][1]));
/* KV 8,55 % = 256,50; RV 279; AV 39; PV 2,4 % = 72 → 646,50 */
assert.strictEqual(x.felder[0].soll, 646.5);
/* Rentabilität */
x = G.bauen("wiso", "rentabilitaet", 7);
const zahl = s => Number(s.replace(/[^\d,]/g, "").replace(",", "."));
const ek = zahl(x.gegeben[0][1]), gw = zahl(x.gegeben[2][1]);
assert.ok(Math.abs(x.felder[0].soll - gw / ek * 100) < 1e-9);
/* Rechtsformen: Kapital stimmt */
const kap = Object.fromEntries(S.FORMEN.map(f => [f[1], f[2]]));
assert.strictEqual(kap.GmbH, 25000); assert.strictEqual(kap.AG, 50000); assert.strictEqual(kap["UG (haftungsbeschränkt)"], 1);
S.FORMEN.forEach(f => assert.ok(!f[4].includes(f[1])));

const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.ok(html.includes("gen/wiso-gen-daten.js") && sw.includes("./gen/wiso-gen-daten.js"));
console.log("wiso-gen: " + S.aufgaben.length + " Aufgabentypen OK");
