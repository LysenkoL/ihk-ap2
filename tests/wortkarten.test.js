"use strict";
/* Карточки слов (gen/wortkarten.js): Quellen, Leitner-Fächer, Tageslimit, Gegenrichtung,
   Überblick und Tagesnorm, Zusammenführen, Einbindung.  node tests/wortkarten.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
require(path.join(root, "gen", "glossar-daten.js"));
require(path.join(root, "gen", "glossar-ap2.js"));
require(path.join(root, "gen", "wortschatz-daten.js"));
const W = require(path.join(root, "gen", "wortkarten.js"));

/* ---- Quellen ---- */
const echte = W.karten({ wortschatz: global.IHK_WORTSCHATZ, glossar: global.IHK_GLOSSAR, gebiete: global.IHK_GLOSSAR_GEBIETE });
assert.ok(echte.length > 800, "Prüfungsdeutsch + Fachbegriffe AP2: " + echte.length);
assert.strictEqual(new Set(echte.map(k => k.id)).size, echte.length, "IDs eindeutig");
assert.ok(echte.every(k => k.de && k.ru), "jede Karte hat beide Seiten");
assert.ok(!echte.some(k => k.de.includes("|")), "Trennstrich aus Verben entfernt (an|geben → angeben)");
const nurAp1 = global.IHK_GLOSSAR.filter(z => z[3] === "1").map(z => z[0]);
assert.ok(!echte.some(k => k.quelle === "glossar" && nurAp1.includes(k.de)), "keine reinen AP1-Begriffe");
const iPruef = echte.findIndex(k => k.quelle === "pruefung"), iGloss = echte.findIndex(k => k.quelle === "glossar");
assert.ok(iPruef >= 0 && iPruef < iGloss, "Prüfungsdeutsch vor Fachbegriffen");

const mein = { "m-aufwand": { wort: "der Aufwand", ru: "затраты", kontext: "Der Aufwand ist zu hoch.", t: 5 }, "m-leer": { wort: "x", ru: "" } };
const mitMein = W.karten({ mein, wortschatz: [["n", "der Aufwand", "затраты, трудоёмкость"], ["v", "an|geben", "указать"]], glossar: [["der Test", "тест", "Prüfen.", "1", "qual"], ["das Kanban", "канбан", "Tafel mit Spalten.", "2", "proj"]] });
assert.deepStrictEqual(mitMein.map(k => k.de), ["der Aufwand", "angeben", "das Kanban"], "Meine Wörter zuerst, doppelt nur einmal, AP1-Begriff weg, leeres RU weg");
assert.strictEqual(mitMein[0].beispiel, "Der Aufwand ist zu hoch.", "Satz aus der Aufgabe als Beispiel");
assert.strictEqual(mitMein[0].quelle, "mein");

/* ---- Datumsrechnung ---- */
assert.strictEqual(W.plusTage("2026-12-31", 1), "2027-01-01");
assert.strictEqual(W.plusTage("2027-02-28", 1), "2027-03-01");
assert.strictEqual(W.plusTage("2026-10-26", 16), "2026-11-11");

/* ---- Runde: Tageslimit und Reihenfolge ---- */
const K = Array.from({ length: 15 }, (_, i) => ({ id: "k" + i, de: "D" + i, ru: "R" + i }));
const H = "2026-10-26";
let st = W.normStand(null);
let r = W.runde(K, st, H);
assert.strictEqual(r.faellig.length, 0);
assert.strictEqual(r.neu.length, W.NEU_PRO_TAG, "höchstens 10 neue am Tag");
assert.ok(r.neu.every(k => k.startsWith("de-ru|")), "neu zuerst DE → RU");
assert.strictEqual(r.neu[0], "de-ru|k0", "Reihenfolge der Quellen");

/* Antworten: Fächer und Fälligkeit */
st = W.antworten(st, "de-ru|k0", true, H, 1000, 20);
assert.deepStrictEqual([st.k["de-ru|k0"].b, st.k["de-ru|k0"].f], [2, "2026-10-28"], "neu und gewusst → Fach 2, in 2 Tagen");
st = W.antworten(st, "de-ru|k1", false, H, 1001, 10);
assert.deepStrictEqual([st.k["de-ru|k1"].b, st.k["de-ru|k1"].f], [1, "2026-10-27"], "nicht gewusst → Fach 1, morgen");
assert.deepStrictEqual(st.tage[H], { n: 2, sek: 30, neu: 2 });
r = W.runde(K, st, H);
assert.strictEqual(r.neu.length, W.NEU_PRO_TAG - 2, "heute schon 2 neue");
assert.strictEqual(r.neu[0], "ru-de|k0", "Gegenrichtung, sobald DE → RU in Fach 2 ist");
assert.ok(!r.neu.includes("ru-de|k1"), "keine Gegenrichtung für Fach 1");
assert.ok(!r.neu.includes("de-ru|k0") && !r.neu.includes("de-ru|k1"), "schon begonnene Karten sind nicht neu");

/* nächster Tag: k1 fällig, k0 noch nicht */
r = W.runde(K, st, "2026-10-27");
assert.deepStrictEqual(r.faellig, ["de-ru|k1"]);
assert.strictEqual(r.neu.length, W.NEU_PRO_TAG, "neuer Tag, neues Limit");
/* aufsteigen bis Fach 5, dort bleiben */
let s2 = W.normStand(null), tag = H;
for (let i = 0; i < 7; i++) { s2 = W.antworten(s2, "de-ru|k5", true, tag, i, 0); tag = s2.k["de-ru|k5"].f; }
assert.strictEqual(s2.k["de-ru|k5"].b, 5);
assert.strictEqual(s2.k["de-ru|k5"].n, 7);
assert.strictEqual(s2.k["de-ru|k5"].r, 7);
s2 = W.antworten(s2, "de-ru|k5", false, tag, 9, 0);
assert.strictEqual(s2.k["de-ru|k5"].b, 1, "nicht gewusst → zurück in Fach 1");
/* fällig: niedriges Fach zuerst */
const s3 = { k: { "de-ru|k2": { b: 3, f: "2026-10-20", t: 1 }, "de-ru|k3": { b: 1, f: "2026-10-25", t: 2 }, "de-ru|k4": { b: 1, f: "2026-10-24", t: 3 } }, tage: {} };
assert.deepStrictEqual(W.runde(K, s3, H).faellig, ["de-ru|k4", "de-ru|k3", "de-ru|k2"]);
/* Karten, deren Wort es nicht mehr gibt, werden übersprungen */
assert.deepStrictEqual(W.runde(K.filter(k => k.id !== "k3"), s3, H).faellig, ["de-ru|k4", "de-ru|k2"]);

/* ---- Überblick und Tagesnorm ---- */
let u = W.ueberblick(K, st, H);
assert.deepStrictEqual(u.faecher, [1, 1, 0, 0, 0]);
assert.strictEqual(u.fertig, false, "30 Sekunden, noch neue Karten");
u = W.ueberblick(K, W.zeitBuchen(st, H, 290), H);
assert.strictEqual(u.heuteSek, 320);
assert.strictEqual(u.fertig, true, "5 Minuten erreicht");
const wenig = [K[0]];
const sw = W.antworten(W.normStand(null), "de-ru|k0", true, H, 1, 5);
assert.strictEqual(W.ueberblick(wenig, sw, H).fertig, false, "Gegenrichtung noch offen");
const sw2 = W.antworten(sw, "ru-de|k0", true, H, 2, 5);
assert.strictEqual(W.ueberblick(wenig, sw2, H).fertig, true, "nichts mehr zu tun und geübt → erledigt");
assert.strictEqual(W.ueberblick(wenig, W.normStand(null), H).fertig, false, "ohne Übung nicht erledigt");

/* ---- Ungültiges wird ignoriert, Stand nicht verändert ---- */
const kaputt = { k: { "de-ru|k0": { b: 9, f: "x" }, "de-ru|k1": { b: 2, f: "2026-10-27", t: 1 } }, tage: { a: 5 } };
assert.deepStrictEqual(Object.keys(W.normStand(kaputt).k), ["de-ru|k1"]);
const vorher = JSON.stringify(st);
W.antworten(st, "de-ru|k2", true, H, 5, 1);
assert.strictEqual(JSON.stringify(st), vorher, "antworten() ändert den alten Stand nicht");

/* ---- Seiten ---- */
assert.deepStrictEqual(W.seiten({ de: "der Aufwand", ru: "затраты" }, "ru-de"), { vorne: "затраты", vorneDe: false, hinten: "der Aufwand", hintenDe: true });

/* ---- Zusammenführen (Geräteabgleich) ---- */
const a = { k: { "de-ru|k0": { b: 2, f: "2026-10-28", t: 10 }, "de-ru|k1": { b: 1, f: "2026-10-27", t: 5 } }, tage: { [H]: { n: 3, sek: 100, neu: 2 } } };
const b = { k: { "de-ru|k0": { b: 3, f: "2026-11-01", t: 20 }, "de-ru|k2": { b: 1, f: "2026-10-27", t: 7 } }, tage: { [H]: { n: 1, sek: 200, neu: 1 } } };
const m = W.vereinigen(a, b);
assert.deepStrictEqual(Object.keys(m.k).sort(), ["de-ru|k0", "de-ru|k1", "de-ru|k2"]);
assert.strictEqual(m.k["de-ru|k0"].b, 3, "neuere Antwort gewinnt");
assert.deepStrictEqual(m.tage[H], { n: 3, sek: 200, neu: 2 });

/* ---- Einbindung ---- */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), swj = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/wortkarten.js", "gen/wortkarten.css"].forEach(f => { assert.ok(html.includes(f)); assert.ok(swj.includes("./" + f)); });
assert.ok(html.indexOf("gen/wortkarten.js") < html.indexOf("gen/heute.js"), "vor heute.js");
assert.ok(html.indexOf("gen/wortschatz-daten.js") < html.indexOf("gen/wortkarten.js"));

/* ---- «Сегодня»: Schritt erscheint nur mit Daten ---- */
const Heute = require(path.join(root, "gen", "heute.js"));
const ohne = Heute.schritte({ minuten: 20, satz: true });
assert.ok(!ohne.liste.some(x => x.key === "worte"));
const mit = Heute.schritte({ minuten: 20, satz: true, worte: { sek: 130, fertig: false } });
const sch = mit.liste.find(x => x.key === "worte");
assert.deepStrictEqual([sch.titel, sch.fertig], ["Слова: 2/5 минут", false]);
assert.strictEqual(Heute.schritte({ worte: { sek: 400, fertig: true } }).liste.find(x => x.key === "worte").titel, "Слова: 5/5 минут");

console.log("wortkarten: " + echte.length + " Karten, Leitner, Tagesnorm, Abgleich OK");
