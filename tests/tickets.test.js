"use strict";
/* Tickets und Eskalation (gen/tickets-daten.js) im Motor gen/uebung-gen.js.  node tests/tickets.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
const G = require(path.join(root, "gen", "uebung-gen.js"));
const S = require(path.join(root, "gen", "tickets-daten.js"));
G.sammlung(S);

/* Matrix: symmetrisch, 1 nur bei hoch × hoch, 5 nur bei niedrig × niedrig */
assert.deepStrictEqual(S.MATRIX, [[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
/* Fälle stimmig: Art im Bereich, Service Requests sind nie Level 3, Change nie Level 1 */
S.FAELLE.forEach(f => {
  assert.ok([0, 1, 2].includes(f.a) && [0, 1, 2].includes(f.d) && [0, 1, 2, 3].includes(f.art) && [1, 2, 3].includes(f.level));
  if (f.art === 1) assert.ok(f.level < 3, "Service Request nicht beim Hersteller: " + f.t);
  if (f.art === 3) assert.ok(f.level > 1, "Change nicht beim Service Desk");
  assert.ok(f.wa && f.wd, "Begründung für Auswirkung/Dringlichkeit");
});

/* Jede Aufgabe für viele Startwerte: gültig, eigene Lösung besteht */
S.aufgaben.forEach(a => {
  for (let seed = 1; seed <= 300; seed++) {
    const x = G.bauen("tickets", a.id, seed);
    const antw = {}; x.felder.forEach(f => { antw[f.id] = String(f.soll); });
    const r = G.bewerten(x, antw);
    assert.strictEqual(r.correct, r.max, a.id + " " + seed);
    x.felder.forEach(f => assert.strictEqual(new Set(f.optionen).size, f.optionen.length, a.id + ": Optionen eindeutig"));
    assert.ok(!/\{name\}/.test(x.situation), "Name eingesetzt");
  }
});

/* SLA von Hand: Eingang Do 15:30, Servicezeit 8–17, 4 Stunden → Fr 10:30 */
let gefunden = 0;
for (let seed = 1; seed < 20000 && gefunden < 3; seed++) {
  const x = G.bauen("tickets", "sla", seed);
  const g = Object.fromEntries(x.gegeben);
  if (g["Ticket eingegangen"] === "Donnerstag, 15:30 Uhr" && g["Servicezeit"].endsWith("8:00–17:00 Uhr") && g["Lösungszeit laut SLA"] === "4 Stunden") {
    assert.strictEqual(x.felder[0].optionen[x.felder[0].soll], "Freitag, 10:30 Uhr"); gefunden++;
  }
  if (g["Ticket eingegangen"] === "Freitag, 16:00 Uhr" && g["Servicezeit"].endsWith("8:00–18:00 Uhr") && g["Lösungszeit laut SLA"] === "8 Stunden") {
    assert.strictEqual(x.felder[0].optionen[x.felder[0].soll], "Montag (nächste Woche), 14:00 Uhr"); gefunden++;
  }
  if (g["Ticket eingegangen"] === "Montag, 09:00 Uhr" && g["Lösungszeit laut SLA"] === "2 Stunden") {
    assert.strictEqual(x.felder[0].optionen[x.felder[0].soll], "Montag, 11:00 Uhr"); gefunden++;
  }
}
assert.ok(gefunden >= 2, "SLA-Fälle von Hand geprüft: " + gefunden);

const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.ok(html.includes("gen/tickets-daten.js") && sw.includes("./gen/tickets-daten.js"));
assert.ok(html.indexOf("gen/uebung-gen.js") < html.indexOf("gen/tickets-daten.js"));
console.log("tickets: " + S.aufgaben.length + " Aufgabentypen, " + S.FAELLE.length + " Fälle OK");
