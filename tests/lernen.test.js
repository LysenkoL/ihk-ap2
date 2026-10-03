"use strict";

/* Themen AP2 (gen/lernen-daten.js + gen/lernen.js): Daten vollständig,
   Quiz-Antworten eindeutig, Bewertung, Runden, „Fehler wiederholen“,
   Einbindung und Offline-Cache.                                           */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

global.window = global;
const speicher = {};
global.localStorage = { getItem: k => (k in speicher ? speicher[k] : null), setItem: (k, v) => { speicher[k] = String(v); } };
require(path.join(root, "gen", "kern.js"));
require(path.join(root, "gen", "satzbausteine.js"));
require(path.join(root, "gen", "satzbausteine2.js"));
require(path.join(root, "gen", "satzbausteine-ap2.js"));
const T = require(path.join(root, "gen", "lernen-daten.js"));
const L = require(path.join(root, "gen", "lernen.js"));

/* ---- Daten ---------------------------------------------------------- */
assert(T.length >= 15, "Themen: " + T.length);
const tIds = new Set(), qIds = new Set();
const karten = new Set((global.SATZ_POOL || []).map(x => x.id));
T.forEach(t => {
  assert(!tIds.has(t.id), "Thema doppelt: " + t.id); tIds.add(t.id);
  ["titel", "ru", "teil", "katalog", "kurzRu", "merke"].forEach(f => assert(t[f] && String(t[f]).trim(), t.id + " ohne " + f));
  assert(/[а-яё]/i.test(t.kurzRu) && /[а-яё]/i.test(t.ru), t.id + " Russisch fehlt");
  assert(["GA1", "GA2", "GA1+GA2"].includes(t.teil), t.id + " teil");
  assert(Array.isArray(t.punkte) && t.punkte.length >= 5, t.id + " zu wenig Punkte");
  t.punkte.forEach(p => { assert.strictEqual(p.length, 3, t.id + " Punkt: " + p[0]); assert(/[а-яё]/i.test(p[1]), t.id + " Punkt ohne Russisch: " + p[0]); });
  (t.links || []).forEach(([u, x]) => assert(/^https:\/\/ap2\.online\//.test(u) && x, t.id + " Link " + u));
  if (t.tabelle) t.tabelle.zeilen.forEach(z => assert.strictEqual(z.length, t.tabelle.kopf.length, t.id + " Tabellenzeile " + z[0]));
  (t.karten || []).forEach(k => assert(karten.has(k), t.id + ": Kurzfrage " + k + " fehlt"));
  assert(t.quiz.length >= 5, t.id + " Quiz zu kurz");
  t.quiz.forEach(q => {
    assert(!qIds.has(q.id), "Frage doppelt: " + q.id); qIds.add(q.id);
    assert(q.f && q.w, q.id + " Text/Erklärung");
    assert(q.o.length >= 3 && q.o.length <= 5, q.id + " Optionen");
    assert.strictEqual(new Set(q.o).size, q.o.length, q.id + " doppelte Option");
    assert(q.r.length >= 1 && q.r.every(i => i >= 0 && i < q.o.length), q.id + " r");
    if (q.r.length > 1) assert(/alle richtigen/.test(q.f), q.id + ": Mehrfachauswahl muss angesagt sein");
    else assert(!/alle richtigen/.test(q.f), q.id + ": „alle richtigen“, aber nur eine Antwort");
  });
});
assert(qIds.size >= 120, "Quizfragen: " + qIds.size);

/* ---- Inhalte, die stimmen müssen (Stichproben) ------------------------ */
const q = id => L.frage(id);
assert.strictEqual(q("al2").o[q("al2").r[0]], "10", "1000 Elemente → 10 Vergleiche");
assert.strictEqual(q("re3").o[q("re3").r[0]], "POST", "POST nicht idempotent");
assert.strictEqual(q("kr1").o[q("kr1").r[0]], "Bens öffentlichen Schlüssel");
assert.strictEqual(q("kr2").o[q("kr2").r[0]], "Mit ihrem privaten Schlüssel");
assert.strictEqual(q("oo1").o[q("oo1").r[0]], "#");
/* die Feld-Fragen gegen den echten Algorithmus */
const A = require(path.join(root, "gen", "algo.js"));
assert.strictEqual(q("al4").o[0], "[" + A.bubble([5, 1, 4, 2], true)[0].feld.join(", ") + "]");
assert.strictEqual(q("al5").o[0], "[" + A.selection([7, 3, 9, 1], true)[0].feld.join(", ") + "]");
assert.strictEqual(q("al6").o[0], "[" + A.insertion([4, 2, 6, 1], true)[1].feld.join(", ") + "]");

/* ---- Bewertung ------------------------------------------------------ */
assert(L.pruefe({ r: [0] }, [0]));
assert(!L.pruefe({ r: [0] }, [1]));
assert(L.pruefe({ r: [0, 1] }, [1, 0]), "Reihenfolge der Auswahl egal");
assert(!L.pruefe({ r: [0, 1] }, [0]), "unvollständig = falsch");
assert(!L.pruefe({ r: [0, 1] }, [0, 1, 2]), "zu viel = falsch");

/* ---- Stand, Runde, Fehler wiederholen --------------------------------- */
assert.strictEqual(L.standVon("al1"), "neu");
const r0 = L.runde({ themen: ["algo"], anzahl: 5 });
assert.strictEqual(r0.length, 5);
assert(r0.every(x => x.thema === "algo"));
/* eine Frage falsch, eine richtig */
const S = speicher;
S["ap2:lernen"] = JSON.stringify({ "q:al3": { ok: 0, n: 1, f: 1, t: 1 }, "q:al1": { ok: 1, n: 1, f: 0, t: 1 } });
delete require.cache[require.resolve(path.join(root, "gen", "lernen.js"))];
const L2 = require(path.join(root, "gen", "lernen.js"));
assert.strictEqual(L2.standVon("al3"), "falsch");
assert.strictEqual(L2.standVon("al1"), "richtig");
assert.strictEqual(L2.runde({ themen: ["algo"], anzahl: 3 })[0].id, "al3", "falsche zuerst");
assert.deepStrictEqual(L2.runde({ nurFalsch: true, anzahl: 9 }).map(x => x.id), ["al3"]);
const z = L2.zahlen();
assert.strictEqual(z.richtig, 1); assert.strictEqual(z.falsch, 1); assert.strictEqual(z.gesamt, qIds.size);
const W = (global.GENWIEDER_EXTRA || []).find(p => p.key === "lernen");
assert(W, "Quelle für Fehler wiederholen angemeldet");
const items = W.sammeln();
assert.deepStrictEqual(items.map(x => x.id), ["lq:al3"]);
W.einordnen(items[0], "gut");
assert.strictEqual(L2.standVon("al3"), "falsch", "Selbsteinschätzung ersetzt kein geprüftes Quizresultat");
assert.strictEqual(W.sammeln().length, 1, "erste Selbsteinschätzung entfernt die Frage nicht");
W.einordnen(items[0], "gut", { l: 2, raus: 1 });
assert.strictEqual(W.sammeln().length, 0, "verzögerte Wiederholung kann abgeschlossen werden");
const LS = require(path.join(root, "gen", "lernstand.js"));
assert.strictEqual(typeof L2.antwortEintragen, "function");
L2.antwortEintragen("al3", [99]);
assert.strictEqual(W.sammeln().length, 1, "neue falsche Antwort öffnet abgeschlossene Wiederholung");
L2.antwortEintragen("al3", L2.frage("al3").r);
assert.strictEqual(W.sammeln().length, 1, "sofortige Korrektur ersetzt keinen verzögerten Abruf");
assert.strictEqual(LS.list().length, 2);
assert.strictEqual(LS.list()[0].kind, "recognition");
assert.strictEqual(LS.list()[1].support, "loesung", "direkte Wiederholung nach Erklärung wird erkannt");
assert.strictEqual(LS.summary()[0].ratio, null);

/* ---- Einbindung ----------------------------------------------------- */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/lernen-daten.js", "gen/lernen.js", "gen/lernen.css"].forEach(f => {
  assert(html.includes(f), f + " in index.html");
  assert(sw.includes("./" + f), f + " im Service Worker");
});
assert(html.indexOf("gen/lernen-daten.js") < html.indexOf("gen/lernen.js"));
assert(html.indexOf("gen/satzbau.js") < html.indexOf("gen/lernen.js"), "Kurzfragen vor den Themen");
assert(fs.readFileSync(path.join(root, "gen", "zurueck.js"), "utf8").includes("scLernen"), "Zurück kennt die Themen");
assert(fs.readFileSync(path.join(root, "gen", "wiederholen.js"), "utf8").includes("GENWIEDER_EXTRA"), "Fehler wiederholen nimmt weitere Quellen");
assert(fs.readFileSync(path.join(root, "gen", "start.js"), "utf8").includes('key: "lernen"'), "Startseite hat den Block");

console.log("lernen: " + T.length + " Themen, " + qIds.size + " Quizfragen, Bewertung, Runden, Fehler wiederholen OK");
