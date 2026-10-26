"use strict";
/* Motor für Übungen mit neuen Zahlen (gen/uebung-gen.js) und Rechen-Trainer AP2
   (gen/rechnen-ap2-daten.js): Zufall mit Startwert, Zahlen lesen, Toleranz,
   jede Aufgabe für viele Startwerte gültig, Rechenwerte von Hand nachgerechnet.
   node tests/uebung-gen.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
const G = require(path.join(root, "gen", "uebung-gen.js"));
const S = require(path.join(root, "gen", "rechnen-ap2-daten.js"));

/* ---- Zufall mit Startwert ---- */
const r1 = G.zufall(42), r2 = G.zufall(42);
assert.deepStrictEqual([r1.int(1, 100), r1.int(1, 100), r1.pick("abc")], [r2.int(1, 100), r2.int(1, 100), r2.pick("abc")], "gleicher Startwert → gleiche Folge");
const r3 = G.zufall(7);
for (let i = 0; i < 500; i++) { const x = r3.int(3, 5); assert.ok(x >= 3 && x <= 5); const y = r3.schritt(10, 50, 5); assert.ok(y >= 10 && y <= 50 && y % 5 === 0); }

/* ---- Zahlen lesen ---- */
const z = (s, soll) => G.zahlLesen(s, soll);
assert.strictEqual(z("1,5"), 1.5);
assert.strictEqual(z("1.5"), 1.5);
assert.strictEqual(z("1.234,5"), 1234.5);
assert.strictEqual(z("1,234.5"), 1234.5);
assert.strictEqual(z("1.234", 1234), 1234, "Tausenderpunkt bei großer Sollzahl");
assert.strictEqual(z("1.234", 1.234), 1.234, "sonst Dezimalpunkt");
assert.strictEqual(z("12.345.678"), 12345678);
assert.strictEqual(z("5,93 GiB"), 5.93, "Einheit dahinter");
assert.strictEqual(z("−3"), -3);
assert.strictEqual(z("≈ 4"), 4);
assert.strictEqual(z("abc"), null);
assert.strictEqual(z(""), null);

/* ---- Toleranz ---- */
assert.ok(G.feldOk({ soll: 5.9326, rel: 0.003 }, "5,93"));
assert.ok(!G.feldOk({ soll: 5.9326, rel: 0.003 }, "6,1"));
assert.ok(G.feldOk({ soll: 120, tol: 0 }, "120"));
assert.ok(!G.feldOk({ soll: 120, tol: 0 }, "121"));
assert.ok(G.feldOk({ art: "wahl", soll: 1, optionen: ["a", "b"] }, "1"));
assert.ok(!G.feldOk({ art: "wahl", soll: 1, optionen: ["a", "b"] }, ""));
assert.strictEqual(G.fmt(1234567.891), "1.234.567,89");
assert.strictEqual(G.fmt(2.5, 0), "3");
assert.strictEqual(G.fmt(-0.5), "−0,5");

/* ---- Jede Aufgabe: 300 Startwerte bauen, Felder gültig, Lösung besteht die eigene Prüfung ---- */
G.sammlung(S);
S.aufgaben.forEach(a => {
  for (let seed = 1; seed <= 300; seed++) {
    const x = G.bauen("rechnen", a.id, seed);
    assert.ok(x.frage && x.weg.length, a.id + ": Frage und Lösungsweg");
    const antwort = {};
    x.felder.forEach(f => { antwort[f.id] = f.art === "wahl" ? String(f.soll) : G.fmt(f.soll, 2); });
    const r = G.bewerten(x, antwort);
    assert.strictEqual(r.correct, r.max, a.id + " seed " + seed + ": gerundete Musterantwort muss passen " + JSON.stringify(antwort));
    x.felder.forEach(f => { if (f.art !== "wahl") assert.ok(f.soll >= 0 && Number.isFinite(f.soll), a.id + ": positive Zahl"); });
  }
  const p = G.bauen("rechnen", a.id, 5), q = G.bauen("rechnen", a.id, 5);
  assert.deepStrictEqual(p.felder.map(f => f.soll), q.felder.map(f => f.soll), a.id + ": reproduzierbar");
});

/* ---- Rechenwerte nachgerechnet (unabhängig vom Generator) ---- */
function finde(id, test) { for (let s = 1; s < 5000; s++) { const x = G.bauen("rechnen", id, s); if (test(x)) return x; } throw new Error("kein Fall für " + id); }
let x = finde("foto", x => /1\.920 × 1\.080/.test(x.gegeben[0][1]) && x.gegeben[1][1].startsWith("24 "));
const n = Number(x.gegeben[2][1].replace(/\./g, ""));
assert.ok(Math.abs(x.felder[0].soll - 5.9326171875) < 1e-9, "1920×1080×24 Bit = 6.220.800 Byte = 5,93 MiB");
assert.ok(Math.abs(x.felder[1].soll - 6220800 * n / 1073741824) < 1e-9);
x = finde("einheiten", x => /500 GB/.test(x.situation));
assert.ok(Math.abs(x.felder[0].soll - 465.66128730773926) < 1e-9, "500 GB = 465,66 GiB");
x = finde("uebertragung", x => x.gegeben[0][1].startsWith("8 GB") && x.gegeben[1][1] === "100 Mbit/s" && !/Overhead/.test(x.situation));
assert.strictEqual(x.felder[0].soll, 640, "8 GB über 100 Mbit/s = 640 s");
x = finde("raid", x => x.gegeben[0][1] === "RAID 5" && x.gegeben[1][1] === "4 × 2 TB");
assert.deepStrictEqual([x.felder[0].soll, x.felder[1].soll], [6, 1]);
x = finde("raid", x => x.gegeben[0][1] === "RAID 6" && x.gegeben[1][1].startsWith("6 ×"));
assert.strictEqual(x.felder[1].soll, 2);
x = finde("raid", x => x.gegeben[0][1] === "RAID 10");
assert.strictEqual(x.felder[0].soll, Number(x.gegeben[1][1].split(" ")[0]) / 2 * Number(x.gegeben[1][1].split(" ")[2]));
x = finde("breakeven", () => true);
const [fix, vk, preis] = x.gegeben.map(g => Number(g[1].replace(/[^\d]/g, "")));
assert.strictEqual(x.felder[1].soll, Math.ceil(fix / (preis - vk)));
assert.ok(x.felder[1].soll * (preis - vk) >= fix && (x.felder[1].soll - 1) * (preis - vk) < fix, "Break-even: genau die erste Menge ohne Verlust");
x = finde("sensor", x => x.gegeben[2][1] === "alle 10 Sekunden");
assert.strictEqual(x.felder[0].soll, 8640);

/* ---- Einbindung ---- */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/uebung-gen.js", "gen/uebung-gen.css", "gen/rechnen-ap2-daten.js"].forEach(f => { assert.ok(html.includes(f), f); assert.ok(sw.includes("./" + f), f); });
assert.ok(html.indexOf("gen/uebung-gen.js") < html.indexOf("gen/rechnen-ap2-daten.js"));

console.log("uebung-gen: Motor + Rechen-Trainer (" + S.aufgaben.length + " Aufgabentypen × 300 Startwerte) OK");
