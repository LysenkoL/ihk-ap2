"use strict";
/* Prüfungstag (gen/pruefungstag.js): reine Funktionen und Einbindung.  node tests/pruefungstag.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const P = require(path.join(root, "gen", "pruefungstag.js"));

assert.strictEqual(P.GESAMT, 240, "90 + 90 + 60");
const mods = ["ga1-2024-s", "ga2-2024-s", "wiso-2024-s", "ga1-2023-w", "ga2-2023-w", "ga1-2025-s", "ga2-2025-s", "wiso-2025-s", "prognose-1", "ga1-2024-s-x"].map(id => ({ id }));
const t = P.termine(mods);
assert.deepStrictEqual(t.map(x => x.termin), ["2025-s", "2024-s"], "nur vollständige Termine, neueste zuerst");
assert.strictEqual(t[0].name, "Sommer 2025");
assert.strictEqual(P.terminName("2023-w"), "Winter 2023");
assert.deepStrictEqual(t[1].ids, { ga1: "ga1-2024-s", ga2: "ga2-2024-s", wiso: "wiso-2024-s" });
assert.deepStrictEqual(P.termine([]), []);

/* Status je Teil */
const ga1 = P.PLAN[0], wiso = P.PLAN[2];
const tag = { termin: "2024-s", start: 1000, teile: { ga1: { id: "ga1-2024-s", start: 5000 } } };
assert.strictEqual(P.teilStatus(tag, ga1, { modus: "pruefung", start: 5000, abgegeben: false }, 5000 + 60000).s, "laeuft");
assert.strictEqual(P.teilStatus(tag, ga1, { modus: "pruefung", start: 5000, abgegeben: false }, 5000 + 60000).rest, 89 * 60000);
assert.strictEqual(P.teilStatus(tag, ga1, { modus: "pruefung", start: 5000, abgegeben: false }, 5000 + 91 * 60000).s, "zeitUm");
assert.strictEqual(P.teilStatus(tag, ga1, { modus: "pruefung", start: 5000, abgegeben: true }, 0).s, "abgegeben");
assert.strictEqual(P.teilStatus(tag, ga1, { modus: "pruefung", start: 7777, abgegeben: true }, 0).s, "offen", "anderswo neu gestartet → zählt nicht");
assert.strictEqual(P.teilStatus(tag, ga1, { modus: "uebung", start: 5000, abgegeben: false }, 0).s, "offen");
assert.strictEqual(P.teilStatus(tag, wiso, { modus: "pruefung", start: 5000 }, 0).s, "offen", "WiSo noch nicht gestartet");

assert.strictEqual(P.dran([{ s: "abgegeben" }, { s: "laeuft" }, { s: "offen" }]), 1);
assert.strictEqual(P.dran([{ s: "abgegeben" }, { s: "abgegeben" }, { s: "abgegeben" }]), null);
assert.strictEqual(P.dran([{ s: "offen" }, { s: "offen" }, { s: "offen" }]), 0);

assert.deepStrictEqual(P.werte({ ga1: { fertig: true, prozent: 61.5 }, ga2: { fertig: false, prozent: 40 }, wiso: { fertig: true, prozent: 72 } }), { ga1: 61.5, ga2: null, wiso: 72 });
assert.strictEqual(P.uhr(0), "0:00");
assert.strictEqual(P.uhr(90 * 60000), "1:30:00");
assert.strictEqual(P.uhr(59 * 60000 + 5000), "59:05");

/* Player-Schnittstelle vorhanden, Einbindung */
const az = fs.readFileSync(path.join(root, "gen", "azubi.js"), "utf8");
assert.ok(/function pruefungStarten\(/.test(az) && /neuerVersuch, pruefungStarten,/.test(az), "GENAZUBI.pruefungStarten");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.ok(html.includes("gen/pruefungstag.js") && html.includes("gen/pruefungstag.css"));
assert.ok(sw.includes("./gen/pruefungstag.js") && sw.includes("./gen/pruefungstag.css"));
const zr = fs.readFileSync(path.join(root, "gen", "zurueck.js"), "utf8");
assert.ok(/scPruefTag: "scStart"/.test(zr) && /"scPruefTag"\]/.test(zr));
console.log("pruefungstag: ok");
assert.strictEqual(P.zahl(99.99999999999997), "100"); assert.strictEqual(P.zahl(61.25), "61,3");
