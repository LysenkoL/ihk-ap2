"use strict";

/* Fehler wiederholen (gen/wiederholen.js): Abstände, zweimal gewusst → raus,
   nie über den Tag vor der Prüfung hinaus; eingebunden und offline.      */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

global.GENSTART = { TERMIN: new Date(2026, 8, 30) };   /* Logiktest mit festem Termin (wie AP1) */
const W = require(path.join(root, "gen", "wiederholen.js"));

const mi = new Date(2026, 8, 23, 10, 0);          /* Mi 23.09.2026 */
assert.strictEqual(W.plusTage(1, mi), "2026-09-24");
assert.strictEqual(W.plusTage(2, mi), "2026-09-25");
/* nie später als der Tag vor der Prüfung (29.09.) */
assert.strictEqual(W.plusTage(4, new Date(2026, 8, 27, 9)), "2026-09-29");
assert.strictEqual(W.plusTage(2, new Date(2026, 8, 28, 9)), "2026-09-29");

let st = W.naechster(null, "nicht", mi);
assert.strictEqual(st.l, 0); assert.strictEqual(st.f, "2026-09-24"); assert(!st.raus);
st = W.naechster(st, "gut", new Date(2026, 8, 24, 9));
assert.strictEqual(st.l, 1); assert.strictEqual(st.f, "2026-09-26"); assert(!st.raus);
st = W.naechster(st, "halb", new Date(2026, 8, 26, 9));
assert.strictEqual(st.l, 0, "halb unterbricht die Erfolgsserie"); assert.strictEqual(st.f, "2026-09-27");
st = W.naechster(st, "gut", new Date(2026, 8, 27, 9));
assert(!st.raus, "nach halb ist ein weiterer Erfolg an einem anderen Tag nötig");
st = W.naechster(st, "gut", new Date(2026, 8, 28, 9));
assert.strictEqual(st.raus, 1, "zweimal hintereinander gewusst → raus");
assert.strictEqual(st.n, 5);

let tag = W.naechster(null, "gut", mi);
tag = W.naechster(tag, "gut", new Date(2026, 8, 23, 18));
assert.strictEqual(tag.l, 1, "zwei Klicks am selben Tag sind keine verzögerte Kontrolle");
assert(!tag.raus);
tag = W.naechster(tag, "gut", new Date(2026, 8, 25, 9));
assert.strictEqual(tag.raus, 1);
tag = W.naechster(tag, "halb", new Date(2026, 8, 26, 9));
assert(!tag.raus, "ein neuer Fehler öffnet die Wiederholung wieder");
assert.strictEqual(tag.l, 0);

let st2 = W.naechster(W.naechster(null, "gut", mi), "nicht", new Date(2026, 8, 25, 9));
assert.strictEqual(st2.l, 0, "nicht gewusst setzt zurück"); assert.strictEqual(st2.f, "2026-09-26");

/* ohne Browser-Daten: keine Kandidaten, kein Absturz */
assert.deepStrictEqual(W.kandidaten(), []);

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/wiederholen.js", "gen/wiederholen.css"].forEach(f => {
  assert(html.includes(f), f + " in index.html");
  assert(sw.includes("./" + f), f + " im Service Worker");
});
assert(html.indexOf("gen/azubi.js") < html.indexOf("gen/wiederholen.js"), "nach azubi.js laden");

console.log("wiederholen: Abstände, Raus-Regel und Einbindung OK");
