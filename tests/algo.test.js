"use strict";

/* Sortieren & Suchen (gen/algo.js): jedes Verfahren gegen eine
   unabhängige Rechnung, Zwischenstände nach den Regeln des Pseudocodes,
   Abbruch bei Bubble Sort, binäre Suche mit links/rechts/mitte.          */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {} };
const A = require(path.join(root, "gen", "algo.js"));

const sortiert = (a, auf) => a.slice().sort((x, y) => auf ? x - y : y - x);
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* Beispiele von Hand gerechnet */
assert.deepStrictEqual(A.bubble([5, 1, 4, 2], true).map(s => s.feld), [[1, 4, 2, 5], [1, 2, 4, 5], [1, 2, 4, 5]], "Bubble mit Abbruch");
assert.deepStrictEqual(A.bubble([5, 1, 4, 2], true).map(s => s.tausche), [3, 1, 0]);
assert.deepStrictEqual(A.selection([7, 3, 9, 1], true).map(s => s.feld), [[1, 3, 9, 7], [1, 3, 9, 7], [1, 3, 7, 9]]);
assert.deepStrictEqual(A.selection([7, 3, 9, 1], true).map(s => s.tausche), [1, 0, 1]);
assert.deepStrictEqual(A.insertion([4, 2, 6, 1], true).map(s => s.feld), [[2, 4, 6, 1], [2, 4, 6, 1], [1, 2, 4, 6]]);
assert.deepStrictEqual(A.insertion([4, 2, 6, 1], true).map(s => s.vergleiche), [1, 1, 3]);
assert.deepStrictEqual(A.bubble([3, 8, 5], false).map(s => s.feld), [[8, 5, 3], [8, 5, 3]], "absteigend");

/* Zufallsfelder: Endzustand sortiert, Eigenschaften je Durchlauf */
for (let k = 0; k < 400; k++) {
  const n = 5 + (k % 4), auf = k % 3 !== 0;
  const f = A.zufallsFeld(n, false);
  assert.strictEqual(new Set(f).size, n, "keine doppelten Werte");
  assert(!gleich(f, sortiert(f, true)) && !gleich(f, sortiert(f, false)), "nie schon sortiert");
  const ziel = sortiert(f, auf);

  const b = A.bubble(f, auf);
  assert(gleich(b[b.length - 1].feld, ziel), "Bubble Ende");
  assert(b.length <= n - 1);
  assert(b[b.length - 1].tausche === 0 || b.length === n - 1, "Bubble endet mit Durchlauf ohne Tausch oder nach n−1");
  b.forEach((s, i) => { assert.strictEqual(s.vergleiche, n - 1 - i); assert.strictEqual(s.feld[n - 1 - i], ziel[n - 1 - i], "Bubble: Ende steht fest"); });

  const s = A.selection(f, auf);
  assert.strictEqual(s.length, n - 1);
  assert(gleich(s[n - 2].feld, ziel), "Selection Ende");
  s.forEach((x, i) => { assert.strictEqual(x.vergleiche, n - 1 - i); assert.strictEqual(x.feld[i], ziel[i], "Selection: Anfang steht fest"); assert(x.tausche <= 1); });

  const ins = A.insertion(f, auf);
  assert.strictEqual(ins.length, n - 1);
  assert(gleich(ins[n - 2].feld, ziel), "Insertion Ende");
  ins.forEach((x, i) => {
    assert(gleich(x.feld.slice(0, i + 2), sortiert(f.slice(0, i + 2), auf)), "Insertion: linker Teil sortiert");
    assert(gleich(x.feld.slice(i + 2), f.slice(i + 2)), "Insertion: rechter Teil unberührt");
  });

  /* binäre Suche */
  const sf = A.zufallsFeld(11 + (k % 5), true);
  const x = k % 4 === 0 ? 100 : sf[k % sf.length];
  const r = A.binaer(sf, x);
  assert.strictEqual(r.index, sf.indexOf(x));
  assert(r.schritte.filter(t => !t.leer).length <= Math.floor(Math.log2(sf.length)) + 1, "höchstens ⌊log₂ n⌋ + 1 Schritte");
  r.schritte.forEach((t, i) => {
    if (t.leer) { assert(t.links > t.rechts); return; }
    assert.strictEqual(t.mitte, Math.floor((t.links + t.rechts) / 2));
    if (i === 0) { assert.strictEqual(t.links, 0); assert.strictEqual(t.rechts, sf.length - 1); }
  });
  const lin = A.linear(sf, x);
  assert.strictEqual(lin.pruefungen, sf.indexOf(x) >= 0 ? sf.indexOf(x) + 1 : sf.length);
}

/* Einbindung */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/algo.js", "gen/algo.css"].forEach(f => { assert(html.includes(f), f); assert(sw.includes("./" + f), f); });
assert(fs.readFileSync(path.join(root, "gen", "zurueck.js"), "utf8").includes("scAlgo"));

console.log("algo: Bubble, Selection, Insertion, binäre und lineare Suche — 400 Zufallsfelder OK");
