"use strict";
/* «Что тренировать» для WiSo (gen/training-wiso-daten.js, erzeugt von tools/wiso_training.py):
   jede Aufgabe der 9 WiSo-Prüfungen genau einem Thema zugeordnet, Verweise passen zum Paket.
   node tests/training-wiso.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const { spawnSync } = require("child_process");
const root = path.join(__dirname, "..");
global.window = global;
require(path.join(root, "gen", "lernen-daten.js"));
require(path.join(root, "gen", "lernen-wiso-daten.js"));
require(path.join(root, "gen", "lernweg-daten.js"));
const gaAnzahl = global.AP2_TRAINING.length;
const DATEN = require(path.join(root, "gen", "training-wiso-daten.js"));
const T = global.AP2_TRAINING;

assert.strictEqual(DATEN.length, 10, "10 WiSo-Themen");
assert.strictEqual(T.length, gaAnzahl + 10, "an AP2_TRAINING angehängt");
assert.ok(T.slice(0, gaAnzahl).every(t => t.bereich !== "WiSo"), "GA-Einträge unverändert vorn");
const W = T.filter(t => t.bereich === "WiSo");
W.forEach(t => {
  assert.ok(global.AP2_THEMEN_WISO.includes(t.id), t.id + ": gleichnamiges WiSo-Thema");
  assert.strictEqual(t.quiz, t.id);
  assert.deepStrictEqual(t.lern, [t.id]);
  assert.strictEqual(t.von, 9);
  assert.ok(t.pruef >= 1 && t.pruef <= 9);
  assert.ok(t.name && /[а-яё]/i.test(t.name), t.id + ": russischer Name");
  assert.ok(t.aufgaben.length > 0);
});
/* Doppeltes Laden fügt nichts hinzu */
delete require.cache[require.resolve(path.join(root, "gen", "training-wiso-daten.js"))];
require(path.join(root, "gen", "training-wiso-daten.js"));
assert.strictEqual(global.AP2_TRAINING.length, gaAnzahl + 10);

/* Verweise gegen das Paket: jede WiSo-Aufgabe genau einmal, Teil-IDs und Punkte stimmen */
const paketText = fs.readFileSync(path.join(root, "privat", "ap2-paket.js"), "utf8");
const paket = JSON.parse(paketText.slice(paketText.indexOf("{"), paketText.lastIndexOf("}") + 1));
const wisoModule = paket.module.filter(m => /^wiso-\d{4}-[sw]$/.test(m.id));
assert.strictEqual(wisoModule.length, 9);
const gesehen = new Map();
W.forEach(t => t.aufgaben.forEach(([mid, nr, punkte, teile]) => {
  const m = wisoModule.find(x => x.id === mid);
  assert.ok(m, "Modul " + mid);
  const a = m.aufgaben.find(x => String(x.nr) === nr);
  assert.ok(a, mid + " Aufgabe " + nr);
  assert.deepStrictEqual(teile, a.teile.map(x => x.id));
  assert.ok(Math.abs(punkte - a.teile.reduce((s, x) => s + x.punkte, 0)) < 0.01);
  const k = mid + ":" + nr;
  assert.ok(!gesehen.has(k), k + " doppelt (" + gesehen.get(k) + ", " + t.id + ")");
  gesehen.set(k, t.id);
}));
const alle = wisoModule.reduce((n, m) => n + m.aufgaben.length, 0);
assert.strictEqual(gesehen.size, alle, "jede WiSo-Aufgabe einem Thema zugeordnet");

/* Erzeugte Datei ist aktuell: der Generator meldet keine offenen Themen */
const pyLauf = exe => spawnSync(exe, [path.join(root, "tools", "wiso_training.py"), "--pruefe"], { encoding: "utf8" });
let py = null;
for (const exe of [process.env.PYTHON, "python", "python3"].filter(Boolean)) { py = pyLauf(exe); if (!py.error) break; }
assert.strictEqual(py.status, 0, "tools/wiso_training.py --pruefe: " + (py.stdout || py.stderr));

console.log("training-wiso: " + W.length + " Themen, " + gesehen.size + " Aufgaben OK");
