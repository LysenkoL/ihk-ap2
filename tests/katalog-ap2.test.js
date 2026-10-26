"use strict";
/* Prüfungskatalog AP2 als Checkliste (gen/katalog-ap2.js, gen/katalog-ap2-daten.js):
   Datenform, Ziele existieren, Status auf Attrappen, Filter und Suche,
   eigene Markierung inkl. kaputtem Speicher, Einbindung.
   node tests/katalog-ap2.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");

global.window = global;
const speicher = {};
global.localStorage = { getItem: k => (k in speicher ? speicher[k] : null), setItem: (k, v) => { speicher[k] = String(v); }, removeItem: k => { delete speicher[k]; } };
const lade = f => require(path.join(root, "gen", f));

/* Datenmodule wie in index.html */
lade("kern.js");
lade("satzbausteine.js");
lade("satzbausteine2.js");
lade("satzbausteine-ap2.js");
lade("satzbausteine-katalog.js");
lade("lernen-daten.js");
lade("lernen-katalog-daten.js");
lade("lernen-wiso-daten.js");
lade("lernweg-daten.js");
lade("praxis-daten.js");
lade("code-daten.js");
lade("katalog-ap2-daten.js");
const K = lade("katalog-ap2.js");
const D = global.AP2_KATALOG2, P = D.punkte;

/* ---- Datenform ---- */
assert.ok(P.length > 100, "alle Punkte des Katalogs");
assert.strictEqual(new Set(P.map(p => p.id)).size, P.length, "IDs eindeutig");
const gruppen = new Set(D.gruppen.map(g => g.id)), bereiche = new Set(D.bereiche.map(b => b.id));
P.forEach(p => {
  ["nr", "titel", "ru", "bereich", "gruppe", "s"].forEach(f => assert.ok(typeof p[f] === "string" && p[f].trim(), p.id + ": " + f));
  assert.ok(/^[а-яё]/i.test(p.ru) || /[а-яё]/i.test(p.ru), p.id + ": ru auf Russisch");
  assert.ok(gruppen.has(p.gruppe), p.id + ": Gruppe " + p.gruppe);
  assert.ok(bereiche.has(p.bereich), p.id + ": Bereich " + p.bereich);
  assert.ok(["keine", "GA1", "GA2", "GA1+GA2", "WiSo"].includes(p.pruefung), p.id + ": pruefung " + p.pruefung);
  assert.ok(Array.isArray(p.trainieren) && p.trainieren.length <= 4, p.id + ": höchstens 4 Ziele");
  assert.ok(Array.isArray(p.stichworte), p.id + ": Stichworte");
});
D.gruppen.forEach(g => assert.ok(g.titel && g.ru && g.bereich && g.s, "Gruppe " + g.id));

/* ---- Jedes Ziel existiert in den Daten ---- */
P.forEach(p => p.trainieren.forEach(l => assert.ok(K.zielVon(l), p.id + ": Ziel fehlt " + JSON.stringify(l))));
/* Diagramm-Knöpfe gibt es in index.html */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
Object.values(K.DIAGRAMM).forEach(([id]) => assert.ok(html.includes('id="' + id + '"'), "Knopf " + id));
assert.strictEqual(K.zielVon({ typ: "quiz", id: "gibtsnicht" }), null);
assert.strictEqual(K.zielVon({ typ: "sql", id: "x" }), null, "sql ohne id");
assert.strictEqual(K.zielVon(null), null);

/* ---- Status auf Attrappen ---- */
const p = { id: "t1", nr: "99.01.01", titel: "Test", ru: "тест", pruefung: "GA2",
  trainieren: [{ typ: "quiz", id: "algo" }, { typ: "sql" }, { typ: "pruefung", id: "ga2-sql" }, { typ: "bogen" }] };
const alle = { verfuegbar: () => true };
let st = K.statusVon(p, alle);
assert.deepStrictEqual([st.stufe, st.material, st.aktiv, st.fehler], ["offen", "ja", false, false], "nichts geübt");
st = K.statusVon(p, Object.assign({}, alle, { quiz: () => ({ gesamt: 10, richtig: 8, falsch: 0, neu: 2 }) }));
assert.strictEqual(st.stufe, "begonnen");
assert.ok(st.kurz[0].includes("8/10"));
st = K.statusVon(p, Object.assign({}, alle, { quiz: () => ({ gesamt: 10, richtig: 8, falsch: 1, neu: 1 }) }));
assert.strictEqual(st.stufe, "fehler", "falsche Quizantwort");
st = K.statusVon(p, Object.assign({}, alle, { journal: t => (t === "sql" ? { total: 3, weak: 1 } : null) }));
assert.strictEqual(st.stufe, "fehler", "Journal mit Fehlern (SQL-Trainer)");
st = K.statusVon(p, Object.assign({}, alle, { pruefung: () => ({ gesamt: 10, begonnen: 2, fertig: 2, verlust: 0 }) }));
assert.strictEqual(st.stufe, "begonnen");
st = K.statusVon(p, Object.assign({}, alle, { pruefung: () => ({ gesamt: 10, begonnen: 1, fertig: 1, verlust: 1 }) }));
assert.strictEqual(st.stufe, "fehler", "Punkte in Prüfungsaufgabe verloren");
st = K.statusVon(p, { verfuegbar: l => l.typ === "bogen" });
assert.deepStrictEqual([st.stufe, st.material], ["bogen", "bogen"], "nur Bögen");
st = K.statusVon(p, { verfuegbar: () => false });
assert.deepStrictEqual([st.stufe, st.material], ["nichts", "nein"], "nichts geladen");
st = K.statusVon(Object.assign({}, p, { pruefung: "keine" }), alle);
assert.strictEqual(st.stufe, "keine");
/* Quellen aus der App fangen Fehler selbst ab (memo in quellenAusApp) */
assert.doesNotThrow(() => K.statusVon(p, K.quellenAusApp()));

/* pruefungStand mit Attrappe des Lernwegs */
global.GENLERNWEG = { aufgabeStand: (z, teile) => ({ beantwortet: teile.filter(t => z.a[t]).length, bewertet: teile.filter(t => z.p[t] != null).length, gesamt: teile.length }) };
const tr = global.AP2_TRAINING.find(t => t.id === "ga2-sql");
const [mid, , pmax, teile] = tr.aufgaben[0];
const zst = { a: {}, p: {} }; teile.forEach(t => { zst.a[t] = "x"; zst.p[t] = 1; });
let ps = K.pruefungStand("ga2-sql", id => (id === mid ? zst : { a: {}, p: {} }));
assert.deepStrictEqual([ps.gesamt, ps.begonnen, ps.fertig, ps.verlust], [tr.aufgaben.length, 1, 1, teile.length < pmax ? 1 : 0]);
assert.strictEqual(K.pruefungStand("gibtsnicht", () => null), null);
delete global.GENLERNWEG;

/* ---- Suche und Filter ---- */
assert.ok(K.suchen(P.find(x => x.nr === "01.02.03"), "normalformen"), "Suche Stichwort");
assert.ok(K.suchen(P.find(x => x.nr === "01.02.03"), "базы данных"), "Suche Russisch");
assert.ok(K.suchen(P.find(x => x.nr === "01.02.03"), "01.02"), "Suche Nummer");
assert.strictEqual(K.norm("Übung"), K.norm("Uebung"));
assert.ok(!K.suchen(P[0], "zzzzqqq"));
const Q0 = { verfuegbar: () => true };
const neu = K.filtern(P, { f: "neu" }, Q0, () => "");
assert.ok(neu.length > 0 && neu.every(x => x.p.neu), "Filter neu");
const wiso = K.filtern(P, { f: "wiso" }, Q0, () => "");
assert.ok(wiso.length > 0 && wiso.every(x => x.p.pruefung === "WiSo"));
const ga2 = K.filtern(P, { f: "ga2" }, Q0, () => "");
assert.ok(ga2.every(x => /GA2/.test(x.p.pruefung)));
const z = K.zaehlen(P, Q0, id => (id === P[0].id ? "kann" : id === P[1].id ? "nicht" : ""));
assert.strictEqual(z.gesamt, P.length);
assert.strictEqual(z.kann, 1);
assert.strictEqual(z.filter.alle, P.length);
assert.ok(z.filter.fehler >= 1, "«Не знаю» zählt als Fehler");
assert.strictEqual(K.filtern(P, { f: "offen" }, Q0, id => (id === P[0].id ? "kann" : "")).some(x => x.p.id === P[0].id), false, "«Знаю» ist nicht «Не начато»");

/* ---- Eigene Markierung ---- */
const id = P[3].id;
assert.strictEqual(K.marke(id), "");
assert.ok(K.markieren(id, "wieder").ok);
assert.strictEqual(K.marke(id), "wieder");
assert.strictEqual(JSON.parse(speicher["ap2:katalog2"])[id].s, "wieder");
assert.ok(K.markieren(id, "").ok, "Markierung zurücknehmen");
assert.strictEqual(K.marke(id), "");
assert.strictEqual(K.markieren("gibtsnicht", "kann").ok, false);
assert.strictEqual(K.markieren(id, "vielleicht").ok, false);
/* nach Neuladen bleibt sie */
K.markieren(id, "kann"); K.neuLesen();
assert.strictEqual(K.marke(id), "kann");
/* ungültige Einträge zählen als keine Markierung */
speicher["ap2:katalog2"] = JSON.stringify({ [id]: { s: "quatsch" }, [P[4].id]: 5 });
K.neuLesen();
assert.strictEqual(K.marke(id), "");
assert.strictEqual(K.marke(P[4].id), "");
/* kaputter Speicher wird nie überschrieben */
speicher["ap2:katalog2"] = "{kaputt";
assert.strictEqual(K.neuLesen(), false);
assert.ok(K.fehler());
const r = K.markieren(id, "kann");
assert.strictEqual(r.ok, false);
assert.strictEqual(speicher["ap2:katalog2"], "{kaputt", "kaputte Daten bleiben stehen");

/* ---- Einbindung ---- */
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/katalog-ap2-daten.js", "gen/katalog-ap2.js", "gen/katalog-ap2.css"].forEach(f => {
  assert.ok(html.includes(f), "index.html: " + f);
  assert.ok(sw.includes("./" + f), "sw.js: " + f);
});
const zr = fs.readFileSync(path.join(root, "gen", "zurueck.js"), "utf8");
assert.ok(/scKatalog2: "scStart"/.test(zr) && /"scKatalog2"\]/.test(zr), "zurueck.js kennt scKatalog2");

console.log("katalog-ap2: ok");
