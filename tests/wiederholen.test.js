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

/* Ein neuer Versuch darf die noch nicht behobene alte Lücke nicht löschen. */
const teil = { id: "t1", titel: "SQL", nr: 1, label: "a", punkte: 4 };
let az = { p: {}, a: {}, versuche: [{ d: 10, zustand: { p: { t1: 1 }, a: { t1: { frei: "SELECT falsch" } }, beobachtet: { t1: { id: "erste-luecke" } } } }] };
global.GENAZUBI = { paket: () => null, alleModule: () => [{ id: "ga2-test", kurz: "GA2" }], teileVon: () => [teil], zustand: () => az,
  hatAntwort: (t, a) => !!a, antwortMd: (t, a) => a.frei || "" };
let kandidaten = W.kandidaten();
assert.strictEqual(kandidaten.length, 1, "archivierter Fehler bleibt nach neuem Versuch fällig");
assert.strictEqual(kandidaten[0].antwort, "SELECT falsch", "alter Antworttext bleibt beim Vergleich verfügbar");
az.p.t1 = 4; az.a.t1 = { frei: "SELECT richtig" }; az.hilfe = { t1: { vorAntwort: true } };
assert.strictEqual(W.kandidaten().length, 1, "vollständige Antwort mit Lösung beseitigt alte Lücke nicht");
az.hilfe = {}; az.auf = {}; az.beobachtet = { t1: { id: "kontrolle" } };
assert.strictEqual(W.kandidaten().length, 0, "neue volle selbständige Kontrolle schließt Lücke");
az.p.t1 = 2; az.beobachtet.t1.id = "zweite-luecke";
assert.notStrictEqual(W.kandidaten()[0].id, kandidaten[0].id, "neuer Fehler erhält neue Wiederholungsserie");
delete global.GENAZUBI;

const vm = require("vm"), A = require("../gen/azubi.js");
function queueApi(state, modul, zustand) {
  const data = { "ap2:wieder": JSON.stringify(state) }, context = { console, module: { exports: {} },
    localStorage: { getItem: k => data[k] || null, setItem: (k, v) => { data[k] = v; } },
    GENAZUBI: Object.assign({}, A, { paket: () => null, alleModule: () => [modul], zustand: () => zustand }) };
  vm.runInNewContext(fs.readFileSync(path.join(root, "gen/wiederholen.js"), "utf8"), context);
  return context.module.exports;
}
const wi = { id: "w", titel: "WiSo", nr: 1, label: "a", punkte: 100 / 30, eingabe: { typ: "mehrfach", soll: [1], optionen: ["Richtig", "Falsch"] } };
const wm = { id: "wiso-test", kurz: "WiSo", aufgaben: [{ teile: [wi] }] };
const wz = { p: {}, a: {}, versuche: [{ d: 10, zustand: { p: { w: 0 }, a: {} } },
  { d: 20, zustand: { p: { w: 3.33 }, auto: { w: 1 }, a: { w: { m: [1] } } } }] };
assert.strictEqual(queueApi({}, wm, wz).kandidaten().length, 0, "alte gerundete WiSo-Vollpunktzahl schließt Lücke exakt");
const lm = { id: "ga2-test", kurz: "GA2", aufgaben: [{ teile: [teil] }] };
const lz = { start: 10, p: { t1: 1 }, a: { t1: { frei: "alt" } }, beobachtet: { t1: { id: "bestehend" } } };
const legacy = { k: { "az:ga2-test:t1": { l: 1, f: "2026-10-08", t: 20 } }, tage: {} };
const lq = queueApi(legacy, lm, lz);
assert.strictEqual(lq.liste()[0].faellig, "2026-10-08", "vorhandene Frist übersteht neue Ereignis-ID");
assert.strictEqual(lq.liste()[0].st.l, 1, "Erfolgsserie bleibt erhalten");
lz.start = 30; lz.beobachtet.t1.id = "neuer-fehler";
assert.strictEqual(lq.liste()[0].st, null, "neuer Fehler erbt alte Erfolgsserie nicht");
const erledigt = { k: { "az:ga2-test:t1": { raus: 1, t: 20 } }, tage: {} };
lz.start = 10; lz.beobachtet.t1.id = "bestehend";
assert.strictEqual(queueApi(erledigt, lm, lz).liste().length, 0, "bereits erledigtes Ereignis bleibt erledigt");

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/wiederholen.js", "gen/wiederholen.css"].forEach(f => {
  assert(html.includes(f), f + " in index.html");
  assert(sw.includes("./" + f), f + " im Service Worker");
});
assert(html.indexOf("gen/azubi.js") < html.indexOf("gen/wiederholen.js"), "nach azubi.js laden");

console.log("wiederholen: Abstände, Raus-Regel und Einbindung OK");
