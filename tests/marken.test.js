"use strict";
/* Личные отметки (gen/marken.js): Setzen, Löschen leerer Einträge, Liste, Zählen, Fehlerliste, Einbindung.
   node tests/marken.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
const M = require(path.join(root, "gen", "marken.js"));
const k1 = M.schluessel("ga1-2025-s", "ga1-2025-s-2a"), k2 = M.schluessel("wiso-2024-w", "wiso-2024-w-7");
assert.strictEqual(k1, "ga1-2025-s|ga1-2025-s-2a");
let st = M.setzen({}, k1, { fav: true, titel: "GA1 S25 · 2a" }, 10);
st = M.setzen(st, k2, { fehler: true, notiz: "Option C doppelt", titel: "WiSo W24 · 7" }, 20);
st = M.setzen(st, k1, { spaeter: true }, 30);
assert.deepStrictEqual(Object.keys(st).sort(), [k1, k2].sort());
assert.ok(st[k1].fav && st[k1].spaeter, "Änderungen kombinieren");
assert.strictEqual(st[k1].t, 30);
assert.deepStrictEqual(M.liste(st).map(e => e.key), [k1, k2], "neueste zuerst");
assert.deepStrictEqual(M.liste(st, "fehler").map(e => e.teil), ["wiso-2024-w-7"]);
assert.deepStrictEqual(M.liste(st, "notiz").map(e => e.key), [k2]);
const z = M.zaehlen(st);
assert.deepStrictEqual([z.alle, z.fav, z.spaeter, z.unklar, z.fehler, z.notiz], [2, 1, 1, 0, 1, 1]);
assert.strictEqual(M.fehlerText(st), "Ошибки в заданиях (1):\n- WiSo W24 · 7 [wiso-2024-w-7]: Option C doppelt");
assert.strictEqual(M.fehlerText({}), "");
/* alles abgewählt → Eintrag verschwindet */
st = M.setzen(st, k1, { fav: false, spaeter: false }, 40);
assert.ok(!st[k1], "leerer Eintrag wird entfernt");
st = M.setzen(st, k2, { fehler: false }, 50);
assert.ok(st[k2], "Notiz allein hält den Eintrag");
st = M.setzen(st, k2, { notiz: "   " }, 60);
assert.ok(!st[k2]);
/* alter Stand bleibt unverändert, Notiz wird gekürzt */
const vorher = { [k1]: { fav: true, t: 1 } }, jetzt = M.setzen(vorher, k1, { notiz: "x".repeat(5000) }, 2);
assert.strictEqual(vorher[k1].notiz, undefined);
assert.strictEqual(jetzt[k1].notiz.length, 1000);
/* Einbindung: Hook im Bogen, Dateien, Abgleich je Eintrag */
const az = fs.readFileSync(path.join(root, "gen", "azubi.js"), "utf8"), html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8"), sy = fs.readFileSync(path.join(root, "gen", "sync.js"), "utf8");
assert.ok(/GENMARKEN\.anhaengen\(c, m, t\)/.test(az), "Hook in azubi.js");
["gen/marken.js", "gen/marken.css"].forEach(f => { assert.ok(html.includes(f)); assert.ok(sw.includes("./" + f)); });
assert.ok(sy.includes('"ap2:marken"'), "sync.js führt ap2:marken je Eintrag zusammen");
console.log("marken: ok");
