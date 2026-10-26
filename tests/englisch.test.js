"use strict";
/* Английский текст GA1 (gen/englisch-daten.js, gen/englisch.js): Daten, Mischung der Antworten,
   Fortschritt, Einbindung.  node tests/englisch.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
const T = require(path.join(root, "gen", "englisch-daten.js"));
const E = require(path.join(root, "gen", "englisch.js"));

assert.ok(T.length >= 8, "mindestens 8 Texte");
assert.strictEqual(new Set(T.map(t => t.id)).size, T.length);
T.forEach(t => {
  assert.ok(t.titel && t.ru && t.situation, t.id + ": Titel/Situation");
  const woerter = t.text.join(" ").split(/\s+/).length;
  assert.ok(woerter >= 120 && woerter <= 320, t.id + ": Textlänge " + woerter + " Wörter");
  assert.ok(!/[äöüß]/i.test(t.text.join(" ")), t.id + ": Text ist Englisch");
  assert.ok(t.vokabeln.length >= 5 && t.vokabeln.every(v => v.length === 3 && v.every(Boolean)), t.id + ": Vokabeln en/de/ru");
  assert.ok(t.fragen.some(f => f.art === "wahl") && t.fragen.some(f => f.art === "offen"), t.id + ": Auswahl- und offene Fragen");
  t.fragen.forEach((f, qi) => {
    assert.ok(/Sie|Was|Wie|Welche|Wann|Unter/.test(f.frage), t.id + "/" + qi + ": Frage auf Deutsch");
    if (f.art === "wahl") {
      assert.ok(f.optionen.length >= 3 && Number.isInteger(f.soll) && f.soll < f.optionen.length);
      const ord = E.reihenfolge(t.id, qi, f.optionen.length);
      assert.deepStrictEqual(ord.slice().sort(), f.optionen.map((_, i) => i), "Reihenfolge ist eine Permutation");
      assert.deepStrictEqual(E.reihenfolge(t.id, qi, f.optionen.length), ord, "stabil");
    } else {
      assert.ok(f.punkte >= 1 && f.muster && f.kriterien.length >= 2, t.id + "/" + qi + ": Muster + Kriterien");
      assert.ok(/^(Nennen|Erläutern|Beschreiben|Begründen|Erklären)/.test(f.frage), t.id + "/" + qi + ": Operator am Anfang");
    }
  });
});
/* Die richtige Antwort steht nicht immer an derselben Stelle */
const pos = new Set();
T.forEach(t => t.fragen.forEach((f, qi) => { if (f.art === "wahl") pos.add(E.reihenfolge(t.id, qi, f.optionen.length).indexOf(f.soll)); }));
assert.ok(pos.size >= 3, "richtige Antwort an mindestens 3 verschiedenen Plätzen: " + [...pos]);

/* Fortschritt */
const t0 = T[0];
assert.deepStrictEqual(E.fortschritt(t0, {}), { fertig: 0, gesamt: t0.fragen.length, punkte: 0, max: t0.fragen.reduce((s, f) => s + (f.art === "wahl" ? 1 : f.punkte), 0) });
const iw = t0.fragen.findIndex(f => f.art === "wahl"), io = t0.fragen.findIndex(f => f.art === "offen");
const p = E.fortschritt(t0, { mc: { [iw]: true }, selbst: { [io]: t0.fragen[io].kriterien.map((_, i) => i === 0) } });
assert.strictEqual(p.fertig, 2);
assert.strictEqual(p.punkte, 1 + Math.round(1 / t0.fragen[io].kriterien.length * t0.fragen[io].punkte * 2) / 2);
assert.throws(() => E.stand("{kaputt"));
assert.deepStrictEqual(E.stand(null), {});

/* Einbindung */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/englisch-daten.js", "gen/englisch.js", "gen/englisch.css"].forEach(f => { assert.ok(html.includes(f)); assert.ok(sw.includes("./" + f)); });
global.AP2_TRAINING = undefined; require(path.join(root, "gen", "lernweg-daten.js"));
assert.ok(global.AP2_TRAINING.find(x => x.id === "ga1-englisch").engl, "«Что тренировать» kennt den Trainer");

console.log("englisch: " + T.length + " Texte OK");
