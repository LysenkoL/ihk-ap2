"use strict";
/* UML-Diagramme lesen (gen/uml-lesen-daten.js) im Motor gen/uebung-gen.js.  node tests/uml-lesen.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
const G = require(path.join(root, "gen", "uebung-gen.js"));
const S = require(path.join(root, "gen", "uml-lesen-daten.js"));
G.sammlung(S);
S.aufgaben.forEach(a => {
  for (let seed = 1; seed <= 300; seed++) {
    const x = G.bauen("uml-lesen", a.id, seed);
    assert.ok(/^<svg[\s\S]*<\/svg>$/.test(x.bild), a.id + ": SVG");
    assert.ok(!/<script|on\w+=/i.test(x.bild), "kein Skript im Bild");
    const antw = {}; x.felder.forEach(f => { antw[f.id] = String(f.soll); });
    const r = G.bewerten(x, antw);
    assert.strictEqual(r.correct, r.max, a.id + " " + seed);
  }
});
/* Automaten: jeder Übergang zwischen bekannten Zuständen, deterministisch */
S.AUTOMATEN.forEach(A => {
  A.t.forEach(([v, e, n]) => assert.ok(A.z[v] && A.z[n], A.name + ": Zustände " + v + "/" + n));
  const k = A.t.map(t => t[0] + "|" + t[1]); assert.strictEqual(new Set(k).size, k.length, A.name + ": deterministisch");
  assert.ok(A.z[A.start]);
});
/* Durchspielen von Hand */
const B = S.AUTOMATEN.find(a => a.name === "Bestellung");
assert.deepStrictEqual(S.durchspielen(B, ["versenden", "bezahlen", "stornieren", "zustellen"]), { zustand: "storniert", uebergaenge: 2 });
const T = S.AUTOMATEN.find(a => a.name === "Ticket");
assert.deepStrictEqual(S.durchspielen(T, ["annehmen", "lösen", "ablehnen", "lösen", "bestätigen"]), { zustand: "geschlossen", uebergaenge: 5 });
/* Multiplizität von Hand: Kunde 1 — 0..* Bestellung */
for (let s = 1; s < 5000; s++) {
  const x = G.bauen("uml-lesen", "multiplizitaet", s);
  if (/>Kunde</.test(x.bild) && />1<\/text>[\s\S]*>0\.\.\*</.test(x.bild)) {
    assert.deepStrictEqual(x.felder.map(f => f.soll), [2, 0, 0], "beliebig viele, ja, mindestens 0"); break;
  }
}
const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.ok(html.includes("gen/uml-lesen-daten.js") && sw.includes("./gen/uml-lesen-daten.js"));
console.log("uml-lesen: " + S.aufgaben.length + " Aufgabentypen OK");
