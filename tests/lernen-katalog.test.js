"use strict";

/* Katalog-Themen (gen/lernen-katalog-daten.js) und ihre Kurzfragen
   (gen/satzbausteine-katalog.js): Pflicht-Themen vorhanden, IDs eindeutig
   (zusammen mit den alten), Quiz-Antworten gültig, Rechenwerte stimmen,
   Kurzfragen bestehen die eigene Prüfung (GENSATZ.bewerte), alte Themen und
   Karten bleiben unverändert, Reihenfolge, doppeltes Laden, Einbindung.    */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

global.window = global;
const speicher = {};
global.localStorage = { getItem: k => (k in speicher ? speicher[k] : null), setItem: (k, v) => { speicher[k] = String(v); } };
global.document = { readyState: "loading", getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, createElement: () => ({ appendChild() {}, classList: { add() {} } }) };

const datei = f => path.join(root, "gen", f);
const lade = f => require(datei(f));

/* Reihenfolge wie in index.html */
lade("kern.js");
lade("satzbausteine.js");
lade("satzbausteine2.js");
lade("satzbausteine-ap2.js");
const poolVorher = global.SATZ_POOL.slice();
const { K } = lade("satzbausteine-katalog.js");
lade("satzbau.js");
const ALT = lade("lernen-daten.js");                 /* dasselbe Array wie window.AP2_THEMEN */
const altIds = ALT.map(t => t.id);
const altObjekte = ALT.slice();
const altJson = JSON.stringify(ALT);
const NEU = lade("lernen-katalog-daten.js");
const L = lade("lernen.js");
const S = global.GENSATZ, P = global.SATZ_POOL, T = global.AP2_THEMEN;
const kyr = s => /[а-яё]/i.test(String(s || ""));
const thema = id => T.find(t => t.id === id);

/* ---- Pflicht-Themen und Zusatzthemen --------------------------------- */
const PFLICHT = ["netz", "betrieb", "cps", "bedrohungen", "testen2", "architektur", "qualitaet"];
const EXTRA = ["speicher", "prozesse", "skripte"];
PFLICHT.concat(EXTRA).forEach(id => assert(thema(id), "Thema fehlt: " + id));
assert.deepStrictEqual(NEU.map(t => t.id).sort(), PFLICHT.concat(EXTRA).sort(), "genau diese neuen Themen");
assert.deepStrictEqual(global.AP2_THEMEN_KATALOG.slice().sort(), NEU.map(t => t.id).sort());

/* ---- alte Themen unverändert, Reihenfolge ----------------------------- */
assert.strictEqual(T, ALT, "dasselbe Array wird ergänzt (andere Module halten die Referenz)");
assert.strictEqual(T.length, altIds.length + NEU.length);
const altJetzt = T.filter(t => altIds.includes(t.id));
assert.deepStrictEqual(altJetzt.map(t => t.id), altIds, "alte Themen behalten ihre Reihenfolge");
altJetzt.forEach((t, i) => assert.strictEqual(t, altObjekte[i], "altes Thema ersetzt: " + t.id));
assert.strictEqual(JSON.stringify(altObjekte), altJson, "alte Themen inhaltlich unverändert");
assert.strictEqual(T[T.length - 1].id, "taktik", "Prüfungstaktik bleibt das letzte Thema");
const NACH = { architektur: "muster", testen2: "tests", qualitaet: "testen2", bedrohungen: "auth", prozesse: "anforderungen",
               skripte: "werkzeuge", cps: "skripte", netz: "cps", betrieb: "netz", speicher: "betrieb" };
Object.keys(NACH).forEach(id => assert.strictEqual(T.findIndex(t => t.id === id) - 1, T.findIndex(t => t.id === NACH[id]),
  id + " steht direkt hinter " + NACH[id]));

/* ---- IDs eindeutig (alt + neu) ---------------------------------------- */
assert.strictEqual(new Set(T.map(t => t.id)).size, T.length, "Themen-IDs eindeutig");
const qIds = new Set();
T.forEach(t => (t.quiz || []).forEach(q => { assert(!qIds.has(q.id), "Frage doppelt: " + q.id); qIds.add(q.id); }));

/* ---- Inhalt der neuen Themen ------------------------------------------ */
const kartenIds = new Set(P.map(x => x.id));
const kBenutzt = new Map();
let nFragen = 0;
NEU.forEach(t => {
  ["titel", "ru", "teil", "katalog", "kurzRu", "merke"].forEach(f => assert(t[f] && String(t[f]).trim(), t.id + " ohne " + f));
  assert(/^AP2\b/.test(t.katalog), t.id + ": Katalogstelle beginnt mit „AP2“");
  assert(t.katalog.length <= 140, t.id + ": Katalogzeile zu lang für die Kopfzeile am Handy");
  assert(["GA1", "GA2", "GA1+GA2"].includes(t.teil), t.id + " teil");
  assert(kyr(t.ru) && kyr(t.kurzRu), t.id + " Russisch fehlt");
  const saetze = (t.kurzRu.match(/[.!?](\s|$)/g) || []).length;
  assert(saetze >= 2 && saetze <= 3, t.id + ": kurzRu soll 2–3 Sätze haben, hat " + saetze);
  assert(t.punkte.length >= 6 && t.punkte.length <= 12, t.id + ": 6–12 Begriffe, hat " + t.punkte.length);
  t.punkte.forEach(p => {
    assert.strictEqual(p.length, 3, t.id + " Punkt: " + p[0]);
    assert(p[0].trim() && kyr(p[1]), t.id + " Punkt ohne Russisch: " + p[0]);
    assert(p[2].trim() && !kyr(p[2]), t.id + ": Erklärung auf Deutsch: " + p[0]);
    assert(p[2].length <= 420, t.id + ": Erklärung zu lang (" + p[2].length + "): " + p[0]);
  });
  (t.links || []).forEach(([u, x]) => assert(/^https:\/\/ap2\.online\//.test(u) && x, t.id + " Link " + u));
  if (t.tabelle) {
    assert(t.tabelle.titel && t.tabelle.kopf.length >= 2, t.id + " Tabelle");
    t.tabelle.zeilen.forEach(z => assert.strictEqual(z.length, t.tabelle.kopf.length, t.id + " Tabellenzeile " + z[0]));
  }
  (t.code || []).forEach(c => {
    assert(c.titel && c.text && !/\$\{/.test(c.text), t.id + " Code " + c.titel);
    c.text.split("\n").forEach(z => assert(Array.from(z).length <= 40, t.id + ": Codezeile breiter als das Handy: " + z));
  });
  assert(t.quiz.length >= 6 && t.quiz.length <= 10, t.id + ": 6–10 Quizfragen, hat " + t.quiz.length);
  assert.strictEqual(t.anzahl, t.quiz.length, t.id + " anzahl");
  t.quiz.forEach(q => {
    nFragen++;
    assert(q.id && q.f && q.w, q.id + " Text/Erklärung");
    assert(kyr(q.w), q.id + ": Erklärung auf Russisch");
    assert(!kyr(q.f) && q.o.every(o => !kyr(o)), q.id + ": Frage und Antworten auf Deutsch");
    assert(q.o.length >= 3 && q.o.length <= 5, q.id + " Optionen");
    assert.strictEqual(new Set(q.o).size, q.o.length, q.id + " doppelte Option");
    assert(q.r.length >= 1 && q.r.every(i => Number.isInteger(i) && i >= 0 && i < q.o.length), q.id + " r");
    assert.strictEqual(new Set(q.r).size, q.r.length, q.id + " r doppelt");
    if (q.r.length > 1) assert(/alle richtigen/.test(q.f), q.id + ": Mehrfachauswahl muss angesagt sein");
    else assert(!/alle richtigen/.test(q.f), q.id + ": „alle richtigen“, aber nur eine Antwort");
    assert(L.pruefe(q, q.r), q.id + " richtige Antwort wird erkannt");
    const falsch = q.o.map((x, i) => i).filter(i => !q.r.includes(i));
    assert(!L.pruefe(q, [falsch[0]]), q.id + " falsche Antwort wird abgelehnt");
  });
  assert(Array.isArray(t.karten) && t.karten.length >= 3, t.id + ": mindestens 3 Kurzfragen");
  t.karten.forEach(k => {
    assert(kartenIds.has(k), t.id + ": Kurzfrage " + k + " fehlt im Pool");
    if (/^k\d\d$/.test(k)) { assert(!kBenutzt.has(k), k + " gehört zu zwei Themen"); kBenutzt.set(k, t.id); }
  });
  assert(t.karten.filter(k => /^k\d\d$/.test(k)).length >= 3, t.id + ": mindestens 3 eigene Kurzfragen (k…)");
});
assert.strictEqual(nFragen, NEU.reduce((s, t) => s + t.quiz.length, 0));

/* ---- Rechen- und Faktenwerte nachgerechnet ----------------------------- */
const frage = id => L.frage(id);
const richtig = id => { const q = frage(id); return q.o[q.r[0]]; };
const de = (x, n) => x.toFixed(n).replace(".", ",");
assert.strictEqual(richtig("sp1"), (4 - 1) * 4 + " TiB", "RAID 5: (n − 1) × Platte");
assert.strictEqual(richtig("sp2"), 6 / 2 * 2 + " TiB", "RAID 10: n ÷ 2 × Platte");
assert.strictEqual(richtig("sp3"), "2", "RAID 6: zwei Ausfälle");
assert.strictEqual(richtig("sp4"), "RAID 0");
assert.strictEqual(richtig("be4"), de(8760 * 0.001, 2) + " Stunden", "99,9 % von 8.760 h");
assert.strictEqual(richtig("cp4"), de(86400 / 10 * 4 / 1024, 2) + " KiB", "Datenmenge pro Tag");
assert.strictEqual(richtig("cp5"), Math.pow(2, 10).toLocaleString("de-DE"), "10 Bit = 1.024 Stufen");
assert.strictEqual(richtig("qu6"), (2.5 - 2.0) / 2.0 * 100 + " % über dem Soll", "Abweichung durch das Soll");
const daten = frage("qu7").f.match(/Daten (\d+)/)[1];
assert.strictEqual(richtig("qu7"), String(daten.split("").filter(b => b === "1").length % 2), "gerade Parität");
assert(/2:00 Uhr/.test(richtig("sk1")) && /0 2 \* \* \*/.test(frage("sk1").f), "cron: Minute Stunde …");
assert.strictEqual(richtig("ne1"), "Schicht 2 (Sicherung)");
assert.strictEqual(richtig("ne7"), "Authentication, Authorization, Accounting");
assert.strictEqual(richtig("pm1"), "Mit einem Ereignis");
/* Verfügbarkeitstabelle */
const stunden = s => { const n = parseFloat(s.replace(/\./g, "").replace(",", ".")); return / min/.test(s) ? n / 60 : n; };
thema("betrieb").tabelle.zeilen.forEach(z => {
  const p = parseFloat(z[0].replace(",", "."));
  assert(Math.abs(stunden(z[1]) - 8760 * (100 - p) / 100) < 0.01, "Jahr bei " + z[0]);
  assert(Math.abs(stunden(z[2]) - 720 * (100 - p) / 100) < 0.01, "Monat bei " + z[0]);
});
/* RAID-Tabelle und Rechenbeispiel */
const raidCode = thema("speicher").code[0].text;
[["RAID 0", 16], ["RAID 5", 12], ["RAID 6", 8], ["RAID 10", 8]].forEach(([lvl, tib]) =>
  assert(new RegExp(lvl + ":[^\\n]*= *" + tib + " TiB").test(raidCode), lvl + " im Rechenbeispiel"));
assert(/\(3 − 1\) × 2 TiB = 4 TiB/.test(raidCode), "kleinste Platte zählt");
/* Paritätsbeispiel */
const parCode = thema("qualitaet").code[0].text;
(parCode.match(/gesendet: (\d+) (\d)/g) || []).forEach(m => {
  const [, d, b] = m.match(/gesendet: (\d+) (\d)/);
  assert.strictEqual((d + b).split("").filter(x => x === "1").length % 2, 0, "gerade Parität: " + m);
});
const emp = parCode.match(/Empfangen: (\d+) (\d)/);
assert.strictEqual((emp[1] + emp[2]).split("").filter(x => x === "1").length % 2, 1, "Empfang mit Fehler ist ungerade");
assert(/30 % über dem Soll/.test(thema("qualitaet").code[1].text), "Soll-Ist: 0,6 ÷ 2,0 = 30 %");
/* Kurzfragen mit Rechnung */
assert(/3,6 Stunden/.test(K.find(x => x.id === "k09").muster), "720 h × 0,5 % = 3,6 h");
assert(/= 15 %/.test(K.find(x => x.id === "k34").muster), "6 ÷ 40 = 15 %");
assert(/= 12 TiB/.test(K.find(x => x.id === "k10").muster), "RAID 5 mit 4 × 4 TiB");

/* ---- Kurzfragen k01 … ------------------------------------------------- */
assert(K.length >= 3 * NEU.length, "3–5 Kurzfragen je Thema");
const kIds = new Set();
K.forEach(x => {
  assert(/^k\d\d$/.test(x.id), x.id + " Format k01 …");
  assert(!kIds.has(x.id), "Kurzfrage doppelt: " + x.id); kIds.add(x.id);
  assert(!poolVorher.some(y => y.id === x.id), x.id + " kollidiert mit einer alten Karte");
  ["thema", "frage", "stichwort", "muster", "tipp", "ru"].forEach(f => assert(x[f] && String(x[f]).trim(), x.id + " ohne " + f));
  assert(kyr(x.ru) && !kyr(x.muster) && !kyr(x.frage), x.id + ": ru russisch, Frage und Muster deutsch");
  assert(!["Netzwerk", "Hardware", "Arbeitsplatz"].includes(x.thema), x.id + ": dieses Thema filtert satzbausteine-ap2.js heraus");
  assert(Array.isArray(x.muss) && x.muss.length >= 2 && x.muss.length <= 3, x.id + ": 2–3 Pflichtgruppen");
  const e = S.bewerte(x, x.muster);
  assert.strictEqual(e.punkte, 2, x.id + ": Musterantwort bekommt nur " + e.punkte + " — fehlt " +
    e.begriffe.filter(b => !b.ok).map(b => b.soll).join(", "));
  assert(e.ganzerSatz, x.id + ": Muster ist ein ganzer Satz");
  assert(S.bewerte(x, x.stichwort).punkte < 2, x.id + ": Stichwort allein darf keine vollen Punkte geben");
  x.muster.replace(/([.!?])\s+(?=[A-ZÄÖÜ„])/g, "$1\n").split("\n").forEach(s =>
    assert(s.split(/\s+/).length <= 25, x.id + ": Satz zu lang für einfache Sprache: " + s));
  const o = S.optionen(x);
  assert.strictEqual(o.filter(y => y.be === 2).length, 1, x.id + " eine volle Antwort");
  assert(o.length >= 3 && o.length <= 4, x.id + " Optionen " + o.length);
  assert(o.some(y => y.be === 0.5 && y.text.indexOf(x.stichwort) === 0), x.id + " Stichwort-Option");
  assert(new Set(o.map(y => y.text)).size === o.length, x.id + " doppelte Option");
  assert(kBenutzt.has(x.id), x.id + " gehört zu keinem Thema");
});
/* alter Pool unverändert, neue Karten hinten angehängt */
assert.strictEqual(P.length, poolVorher.length + K.length);
poolVorher.forEach((x, i) => assert.strictEqual(P[i], x, "alte Karte verändert: " + x.id));
/* Runden nach Kurzfragen-Thema */
const rn = S.runde({ modus: "schreiben", anzahl: 20, themen: ["Netze & Dienste"], folge: "wackelig" });
assert.deepStrictEqual(rn.map(x => x.id).sort(), ["k01", "k02", "k03", "k04", "k05"]);
assert(S.runde({ anzahl: 20, themen: ["Cyber-physische Systeme"] }).every(x => /^k1[4-7]$/.test(x.id)));

/* ---- Quiz-Funktionen mit den neuen Themen ------------------------------ */
assert.strictEqual(L.alleFragen().length, qIds.size);
assert.strictEqual(L.zahlen().gesamt, qIds.size);
const rq = L.runde({ themen: ["netz"], anzahl: 50 });
assert.strictEqual(rq.length, thema("netz").quiz.length);
assert(rq.every(q => q.thema === "netz" && q.themaTitel === thema("netz").titel));
assert.strictEqual(L.antwortEintragen("cp1", [0]), true);
assert.strictEqual(L.standVon("cp1"), "richtig");
assert.strictEqual(L.antwortEintragen("be1", [1]), false);
assert.strictEqual(L.standVon("be1"), "falsch");
assert.deepStrictEqual(L.runde({ nurFalsch: true, anzahl: 9 }).map(q => q.id), ["be1"]);
const W = (global.GENWIEDER_EXTRA || []).find(p => p.key === "lernen");
assert.deepStrictEqual(W.sammeln().map(x => x.id), ["lq:be1"], "falsche Frage landet in „Fehler wiederholen“");

/* ---- doppeltes Laden verdoppelt nichts --------------------------------- */
const vorherIds = T.map(t => t.id).join();
delete require.cache[require.resolve(datei("lernen-katalog-daten.js"))];
delete require.cache[require.resolve(datei("satzbausteine-katalog.js"))];
lade("lernen-katalog-daten.js");
lade("satzbausteine-katalog.js");
assert.strictEqual(T.map(t => t.id).join(), vorherIds, "zweites Laden ändert Reihenfolge und Anzahl nicht");
assert.strictEqual(P.length, poolVorher.length + K.length, "zweites Laden verdoppelt keine Kurzfragen");

/* ---- Laden ohne gen/lernen-daten.js (falsche Reihenfolge) wirft nicht ---- */
{
  const vm = require("vm");
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(datei("lernen-katalog-daten.js"), "utf8"), ctx);
  assert.strictEqual(ctx.AP2_THEMEN.length, NEU.length, "allein geladen: nur die neuen Themen, kein Fehler");
}

/* ---- Einbindung (sobald eingetragen) ----------------------------------- */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const pos = f => html.indexOf('src="gen/' + f + '"');
const hinweise = [];
if (pos("lernen-katalog-daten.js") >= 0) {
  assert(pos("lernen-daten.js") < pos("lernen-katalog-daten.js") && pos("lernen-katalog-daten.js") < pos("lernen.js"),
    "lernen-katalog-daten.js zwischen lernen-daten.js und lernen.js");
  assert(sw.includes('"./gen/lernen-katalog-daten.js"'), "lernen-katalog-daten.js im Service Worker");
} else hinweise.push("lernen-katalog-daten.js noch nicht in index.html");
if (pos("satzbausteine-katalog.js") >= 0) {
  assert(pos("satzbausteine-ap2.js") < pos("satzbausteine-katalog.js") && pos("satzbausteine-katalog.js") < pos("satzbau.js"),
    "satzbausteine-katalog.js zwischen satzbausteine-ap2.js und satzbau.js");
  assert(sw.includes('"./gen/satzbausteine-katalog.js"'), "satzbausteine-katalog.js im Service Worker");
} else hinweise.push("satzbausteine-katalog.js noch nicht in index.html");

console.log("lernen-katalog: " + NEU.length + " neue Themen (" + T.length + " insgesamt), " + nFragen + " Quizfragen, " +
  K.length + " Kurzfragen 2/2, Rechenwerte, Reihenfolge, doppeltes Laden OK" + (hinweise.length ? " — Hinweis: " + hinweise.join("; ") : ""));
