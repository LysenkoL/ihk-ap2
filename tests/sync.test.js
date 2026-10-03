"use strict";

/* Abgleich Handy ↔ Computer (gen/sync.js): nichts geht verloren, die
   neuere Fassung gewinnt, Zähler verdoppeln sich beim Hin- und Rück-
   Abgleich nicht, Azubi-Navigator je Teilaufgabe.                        */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const S = require(path.join(root, "gen", "sync.js"));

const J = JSON.stringify;
const P = r => JSON.parse(r);

/* Antworten: beide Seiten bleiben; Widerspruch → neuere Seite */
let r = S.mische(
  { "ap2:answers": J({ a: "Handy alt", b: "nur hier" }) }, { "ap2:answers": 100 },
  { "ap2:answers": J({ a: "Computer neu", c: "nur dort" }) }, { "ap2:answers": 200 });
assert.deepStrictEqual(P(r.schreiben["ap2:answers"]), { a: "Computer neu", b: "nur hier", c: "nur dort" });
r = S.mische(
  { "ap2:answers": J({ a: "hier neuer" }) }, { "ap2:answers": 300 },
  { "ap2:answers": J({ a: "dort älter", c: "x" }) }, { "ap2:answers": 200 });
assert.deepStrictEqual(P(r.schreiben["ap2:answers"]), { a: "hier neuer", c: "x" });

/* Neuer Schlüssel kommt dazu, gleicher Stand → nichts zu schreiben */
r = S.mische({}, {}, { "ap2:glossar:kann": J({ tilgung: 1 }) }, {});
assert.strictEqual(r.schreiben["ap2:glossar:kann"], J({ tilgung: 1 }));
r = S.mische({ "ap2:x": "1" }, {}, { "ap2:x": "1" }, {});
assert.deepStrictEqual(r.schreiben, {});
/* fremde Schlüssel ohne ap2: werden ignoriert */
r = S.mische({}, {}, { "ihk:auth": "1", "anderes": "x" }, {});
assert.deepStrictEqual(r.schreiben, {});
/* Geräte-Einstellungen bleiben auf dem Gerät */
r = S.mische({}, {}, { "ap2:theme": J("dunkel"), "ap2:start:offen": "{}", "ap2:glossar:ui": "{}", "ap2:pwa:weg": "1" }, {});
assert.deepStrictEqual(r.schreiben, {});

/* SQL-Trainer: gelöst bleibt gelöst, neuerer Code gewinnt */
r = S.mische({ "ap2:sql": J({ v: 1, a: { g1: { ok: 1, n: 1, t: 5, code: "alt" }, g2: { n: 2, t: 9, code: "hier" } } }) }, {},
             { "ap2:sql": J({ v: 1, a: { g1: { n: 3, t: 8, code: "neu" }, w1: { ok: 1, n: 1, t: 3 } } }) }, {});
const sq = P(r.schreiben["ap2:sql"]).a;
assert.deepStrictEqual(sq.g1, { ok: 1, n: 3, t: 8, code: "neu" });
assert(sq.g2 && sq.w1.ok === 1);

/* Zähler: Maximum, nicht Summe — hin und zurück bleibt es bei 5 */
const hier = { "ap2:cards": J({ k1: { richtig: 5, falsch: 1 } }) };
const dort = { "ap2:cards": J({ k1: { richtig: 3, falsch: 2 }, k2: { richtig: 1, falsch: 0 } }) };
r = S.mische(hier, {}, dort, {});
const nach = P(r.schreiben["ap2:cards"]);
assert.deepStrictEqual(nach, { k1: { richtig: 5, falsch: 2 }, k2: { richtig: 1, falsch: 0 } });
const zurueck = S.mische(dort, {}, { "ap2:cards": J(nach) }, {});
assert.deepStrictEqual(P(zurueck.schreiben["ap2:cards"]), nach, "Rückweg verdoppelt nichts");

/* Listen: vereinigt, nach Kennung */
r = S.mische({ "ap2:attempts": J([{ datum: "2026-09-01", p: 50 }]) }, {},
             { "ap2:attempts": J([{ datum: "2026-09-01", p: 50 }, { datum: "2026-09-20", p: 70 }]) }, {});
assert.strictEqual(P(r.schreiben["ap2:attempts"]).length, 2);

/* Azubi-Navigator: Teilaufgaben von beiden Seiten, Widerspruch → später bearbeitete Seite */
const az = (a, p, zuletzt, extra) => J(Object.assign({ v: 1, modus: "uebung", a, auf: {}, p, auto: {}, zeit: 0, abgegeben: false,
  versuche: [], start: 1, zuletzt, pos: null }, extra || {}));
r = S.mische(
  { "ap2:azubi:az8091": az({ t1: { t1: "Handy" }, t2: { t1: "gleich" } }, { t1: 2 }, 1000, { zeit: 500 }) }, {},
  { "ap2:azubi:az8091": az({ t1: { t1: "Computer" }, t3: { f1: "760000" } }, { t1: 3, t3: 5 }, 2000, { zeit: 900, versuche: [{ d: 5, p: 40 }] }) }, {});
const m = P(r.schreiben["ap2:azubi:az8091"]);
assert.deepStrictEqual(m.a, { t1: { t1: "Computer" }, t2: { t1: "gleich" }, t3: { f1: "760000" } });
assert.deepStrictEqual(m.p, { t1: 3, t3: 5 });
assert.strictEqual(m.zeit, 900); assert.strictEqual(m.zuletzt, 2000); assert.strictEqual(m.versuche.length, 1);

/* Fehler wiederholen: je Aufgabe die Fassung mit mehr Wiederholungen */
r = S.mische(
  { "ap2:wieder": J({ k: { a: { l: 1, n: 1, t: 10 }, b: { l: 0, n: 3, t: 5 } }, tage: { "2026-09-23": 4 } }) }, {},
  { "ap2:wieder": J({ k: { a: { l: 2, n: 2, t: 20, raus: 1 }, c: { l: 0, n: 1, t: 7 } }, tage: { "2026-09-23": 2, "2026-09-24": 6 } }) }, {});
const w = P(r.schreiben["ap2:wieder"]);
assert.strictEqual(w.k.a.raus, 1); assert.strictEqual(w.k.b.n, 3); assert(w.k.c);
assert.deepStrictEqual(w.tage, { "2026-09-23": 4, "2026-09-24": 6 });

/* Endspurt: Haken von beiden Geräten */
r = S.mische({ "ap2:endspurt": J({ v: 2, erledigt: { "2026-09-23": { art: "azubi" } } }) }, {},
             { "ap2:endspurt": J({ v: 2, erledigt: { "2026-09-24": { art: "sim" } } }) }, {});
assert.deepStrictEqual(Object.keys(P(r.schreiben["ap2:endspurt"]).erledigt).sort(), ["2026-09-23", "2026-09-24"]);

/* Bericht nach Bereichen */
assert.strictEqual(S.bereichVon("ap2:azubi:az8091"), "Azubi-Navigator");
assert.strictEqual(S.bereichVon("ap2:azubi:azprog1"), "Prognose-Prüfungen");
assert.strictEqual(S.bereichVon("ap2:pruefen:chats"), "Claude-Chats je Prüfung");
/* Modus „Senden“ bleibt auf dem Gerät, die Chat-Links wandern mit */
assert.deepStrictEqual(Object.keys(S.mische({}, {}, { "ap2:pruefen:ui": "{\"modus\":\"kopieren\"}", "ap2:pruefen:chats": "{}" }, {}).schreiben), ["ap2:pruefen:chats"]);
assert.strictEqual(S.bereichVon("ap2:scores"), "Prüfungen (Antworten, Punkte)");

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/sync.js", "gen/sync.css"].forEach(f => { assert(html.includes(f)); assert(sw.includes("./" + f)); });
assert(html.indexOf("gen/sync.js") < html.indexOf("gen/start.js"), "sync.js früh laden (Zeitstempel)");

/* Reale AP2-Formate, von Hand konstruierte Handy-/Computer-Stände.
   Alle Fälle laufen auch bei einem Fehler, damit RED jeden Defekt zeigt. */
const fehler = [];
function fall(name, pruefen) {
  try { pruefen(); }
  catch (e) { fehler.push(name + ": " + e.message); }
}
const abgleichen = (key, lokal, fremd, lm = 10, fm = 20) => {
  const r = S.mische({ [key]: J(lokal) }, { [key]: lm }, { [key]: J(fremd) }, { [key]: fm });
  return r.schreiben[key] ? P(r.schreiben[key]) : lokal;
};
const zustand = (a, extra) => P(az(a, {}, 0, extra));

fall("Reale WiSo-Kennung vereinigt unabhängige Teilaufgaben", () => {
  const lokal = zustand({ "1": { m: [2] } }, { p: { "1": 10 / 3 }, auto: { "1": true }, zuletzt: 100 });
  const fremd = zustand({ "2": { m: [0] } }, { p: { "2": 0 }, auto: { "2": true }, zuletzt: 200 });
  const z = abgleichen("ap2:azubi:wiso-2026-s", lokal, fremd);
  assert.deepStrictEqual(z.a, { "1": { m: [2] }, "2": { m: [0] } });
  assert.deepStrictEqual(z.p, { "1": 10 / 3, "2": 0 });
  assert.deepStrictEqual(z.auto, { "1": true, "2": true });
  assert.strictEqual(S.bereichVon("ap2:azubi:wiso-2026-s"), "Azubi-Navigator");
  assert.deepStrictEqual(abgleichen("ap2:azubi:wiso-2026-s", z, fremd), z);
});

fall("Bewertung und Hilfe bleiben beim zugehörigen Antwortstand", () => {
  const lokal = zustand({ "1": { t1: "ältere Antwort" }, "2": { t1: "gleich" } }, {
    p: { "1": 3, "2": 2 }, auto: { "1": true }, auf: { "1": true }, hilfe: { "1": "vorher" }, zuletzt: 100
  });
  const fremd = zustand({ "1": { t1: "neue, noch ungeprüfte Antwort" }, "2": { t1: "gleich" } }, {
    p: { "2": 1 }, auto: { "2": true }, zuletzt: 200
  });
  const z = abgleichen("ap2:azubi:ga2-eigene-aufgabe", lokal, fremd);
  assert.deepStrictEqual(z.p, { "2": 1 }, "alte Punkte dürfen nicht die neue Antwort bewerten");
  assert.deepStrictEqual(z.auto, { "2": true });
  assert.deepStrictEqual(z.auf, {});
  assert.deepStrictEqual(z.hilfe, {});
  const alt = z.konflikte.find(x => x.teil === "1" && x.stand.a.t1 === "ältere Antwort");
  const neu = z.konflikte.find(x => x.teil === "1" && x.stand.a.t1 === "neue, noch ungeprüfte Antwort");
  assert(alt && neu, "beide tatsächlichen Antwortstände bleiben erhalten");
  assert.strictEqual(alt.stand.p, 3);
  assert.strictEqual(alt.stand.hilfe, "vorher");
  assert(!("p" in neu.stand));
  assert.deepStrictEqual(abgleichen("ap2:azubi:ga2-eigene-aufgabe", z, fremd), z, "erneuter Import ist idempotent");
  assert.deepStrictEqual(abgleichen("ap2:azubi:ga2-eigene-aufgabe", z, lokal), z, "alte Sicherung erzeugt keine doppelten Konflikte");
});

fall("Gleiche Antworten aus zwei Geräten behalten unabhängige Bewertungen", () => {
  const lokal = zustand({ "1": { m: [2] } }, { p: { "1": 3 }, auto: { "1": true }, zuletzt: 100 });
  const fremd = zustand({ "1": { m: [2] }, "2": { m: [1] } }, { zuletzt: 200 });
  const z = abgleichen("ap2:azubi:wiso-2026-s", lokal, fremd);
  assert.strictEqual(z.p["1"], 3, "unveränderte Antwort verliert nicht ihre Bewertung");
  assert.strictEqual(z.auto["1"], true);
});

fall("Hilfe an derselben Antwort bleibt erhalten und Import bleibt idempotent", () => {
  const lokal = zustand({ "1": { m: [2] } }, { zuletzt: 100,
    hilfe: { "1": { loesungGezeigt: 70, vorAntwort: true, nachLoesung: false } }
  });
  const fremd = zustand({ "1": { m: [2] } }, { zuletzt: 200,
    hilfe: { "1": { loesungGezeigt: 80, vorAntwort: false, nachLoesung: true } }
  });
  const z = abgleichen("ap2:azubi:wiso-2026-s", lokal, fremd);
  assert.deepStrictEqual(z.hilfe["1"], { loesungGezeigt: 70, vorAntwort: true, nachLoesung: true });
  assert.deepStrictEqual(abgleichen("ap2:azubi:wiso-2026-s", z, fremd), z);
  assert.deepStrictEqual(abgleichen("ap2:azubi:wiso-2026-s", z, lokal), z);
});

fall("Gleichzeitige historische Versuche verlieren weder Antwort noch Summen", () => {
  const a = { d: 50, modus: "uebung", p: 3, max: 10, zustand: { a: { "1": { t1: "A" } }, p: { "1": 3 } } };
  const b = { d: 50, modus: "uebung", p: 0, max: 10, zustand: { a: { "1": { t1: "B" } }, p: { "1": 0 } } };
  const lokal = zustand({}, { start: 0, versuche: [a] });
  const fremd = zustand({}, { start: 0, versuche: [b] });
  const z = abgleichen("ap2:azubi:wiso-2026-s", lokal, fremd);
  assert.strictEqual(z.versuche.length, 2);
  assert(z.versuche.some(x => x.p === 3 && x.zustand.a["1"].t1 === "A"));
  assert(z.versuche.some(x => x.p === 0 && x.zustand.a["1"].t1 === "B"));
  assert.strictEqual(z.start, 0, "Import erfindet keinen Beginn eines Versuchs");
  assert.deepStrictEqual(abgleichen("ap2:azubi:wiso-2026-s", z, fremd), z);
});

fall("Gleiche alte und vollständige Versuche sind unabhängig von Objekt-Reihenfolge eindeutig", () => {
  const a = { d: 50, p: 0, max: 10, zustand: { a: { "1": { f1: "A", f2: "B" } } } };
  const b = { max: 10, p: 0, d: 50, zustand: { a: { "1": { f2: "B", f1: "A" } } } };
  const lokal = zustand({}, { versuche: [{ d: 1, p: 3 }, a] });
  const fremd = zustand({}, { versuche: [b, { d: 1, p: 3 }, { d: 60, p: 1 }] });
  const z = abgleichen("ap2:azubi:wiso-2026-s", lokal, fremd);
  assert.strictEqual(z.versuche.length, 3);
  assert.deepStrictEqual(z.versuche.map(v => v.d), [1, 50, 60]);
  assert.deepStrictEqual(abgleichen("ap2:azubi:wiso-2026-s", z, fremd), z);
});

fall("Dienstwerte des Navigators bleiben auf ihrem Gerät", () => {
  const r = S.mische({ "ap2:azubi:ui": J({ filter: "offen" }) }, {}, {
    "ap2:azubi:ui": J({ filter: "fertig" }), "ap2:algo:ui": J({ n: 8 })
  }, { "ap2:azubi:ui": 200 });
  assert.deepStrictEqual(r.schreiben, {});
});

fall("Quiz verwendet die Zeit je Frage und verliert falsche Antworten nicht", () => {
  const lokal = { "q:rest": { n: 4, f: 3, ok: 0, t: 300 }, "q:git": { n: 1, f: 0, ok: 1, t: 10 }, "g:rest": 100 };
  const fremd = { "q:rest": { n: 5, f: 1, ok: 1, t: 200 }, "q:tests": { n: 1, f: 1, ok: 0, t: 400 }, "g:rest": 50, "g:tests": 400 };
  const z = abgleichen("ap2:lernen", lokal, fremd, 300, 400);
  assert.deepStrictEqual(z, {
    "q:rest": { n: 5, f: 3, ok: 0, t: 300 }, "q:git": { n: 1, f: 0, ok: 1, t: 10 },
    "q:tests": { n: 1, f: 1, ok: 0, t: 400 }, "g:rest": 100, "g:tests": 400
  });
  assert.deepStrictEqual(abgleichen("ap2:lernen", z, fremd, 400, 400), z);
  assert.deepStrictEqual(abgleichen("ap2:lernen", fremd, z, 400, 400), z);
});

fall("Quiz ohne eindeutige Reihenfolge erhält widersprüchliche Ergebnisse", () => {
  const lokal = { "q:rest": { n: 2, f: 0, ok: 1, t: 100 } };
  const fremd = { "q:rest": { n: 2, f: 1, ok: 0, t: 100 } };
  const z = abgleichen("ap2:lernen", lokal, fremd);
  assert(Array.isArray(z["q:rest"].konflikte), "gleichzeitige widersprüchliche Resultate werden aufbewahrt");
  assert(z["q:rest"].konflikte.some(v => v.ok === 0));
  assert(z["q:rest"].konflikte.some(v => v.ok === 1));
  assert.strictEqual(z["q:rest"].ok, 0, "unsicherer Erfolg darf einen Lernbedarf nicht verdecken");
  assert.deepStrictEqual(abgleichen("ap2:lernen", z, fremd), z);
});

fall("Algo vereinigt unabhängige Verfahren und verdoppelt Zähler nicht", () => {
  const lokal = { bubble: { n: 6, ok: 5, fehler: 2, t: 100 }, linear: { n: 1, ok: 1, fehler: 0, t: 50 } };
  const fremd = { bubble: { n: 4, ok: 1, fehler: 7, t: 200 }, binaer: { n: 2, ok: 0, fehler: 3, t: 200 } };
  const z = abgleichen("ap2:algo", lokal, fremd);
  assert.deepStrictEqual(z, {
    bubble: { n: 6, ok: 5, fehler: 7, t: 200 }, linear: { n: 1, ok: 1, fehler: 0, t: 50 },
    binaer: { n: 2, ok: 0, fehler: 3, t: 200 }
  });
  assert.deepStrictEqual(abgleichen("ap2:algo", z, fremd), z);
  assert.deepStrictEqual(abgleichen("ap2:algo", fremd, z), z);
});

if (fehler.length) throw new Error("AP2-Abgleich:\n" + fehler.join("\n\n"));

console.log("sync: zusammenführen ohne Verlust, neuere Fassung gewinnt, Zähler ohne Verdopplung OK");
