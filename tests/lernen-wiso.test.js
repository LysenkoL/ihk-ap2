"use strict";

/* WiSo-Themen (gen/lernen-wiso-daten.js):
   1. Daten vollständig: teil „WiSo“, Russisch/Deutsch an der richtigen Stelle,
      kurze deutsche Sätze, Quiz mit gültigen Antworten, Quellen.
   2. Ladereihenfolge wie im Browser (lernen-daten → [katalog] → WiSo →
      lernen.js) lässt die alten Themen unverändert; doppeltes Laden
      verdoppelt nichts; alle Themen- und Fragen-IDs sind eindeutig.
   3. Rechen- und Faktenfragen stimmen (nachgerechnet, nicht abgeschrieben).
   4. lernen.js: Runde, Bewertung, Lernstand, „Fehler wiederholen“.
   5. Einbindung in index.html / sw.js — sobald sie eingetragen ist.        */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const gen = n => path.join(root, "gen", n);
const KATALOG = "lernen-katalog-daten.js";
const mitKatalog = fs.existsSync(gen(KATALOG));
const kopie = x => JSON.parse(JSON.stringify(x));
const KYR = /[а-яё]/i;

/* ---- 1. Laden in einem eigenen Kontext, so wie der Browser die Skripte lädt */
function lade(reihe) {
  const speicher = {};
  const ctx = { console, setTimeout: () => 0, clearTimeout: () => {},
    localStorage: { getItem: k => (k in speicher ? speicher[k] : null), setItem: (k, v) => { speicher[k] = String(v); } } };
  ctx.window = ctx;
  vm.createContext(ctx);
  reihe.forEach(n => vm.runInContext(fs.readFileSync(gen(n), "utf8"), ctx, { filename: n }));
  return ctx;
}
const basisReihe = ["lernen-daten.js"].concat(mitKatalog ? [KATALOG] : []);
const basis = lade(basisReihe);
const alt = kopie(basis.AP2_THEMEN);
const altIds = alt.map(t => t.id);
assert(altIds.length >= 15, "alte Themen geladen: " + altIds.length);

const reihen = [["lernen-daten.js", "lernen-wiso-daten.js", "lernen.js"]];
if (mitKatalog) {
  reihen.push(["lernen-daten.js", KATALOG, "lernen-wiso-daten.js", "lernen.js"]);
  reihen.push(["lernen-daten.js", "lernen-wiso-daten.js", KATALOG, "lernen.js"]);
}
let wisoIds = null;
reihen.forEach(reihe => {
  const ctx = lade(reihe);
  const name = reihe.join(" → ");
  const T = kopie(ctx.AP2_THEMEN);
  wisoIds = kopie(ctx.AP2_THEMEN_WISO);
  assert(Array.isArray(wisoIds) && wisoIds.length >= 7 && wisoIds.length <= 10, name + ": 7–10 WiSo-Themen, sind " + (wisoIds || []).length);
  /* alte Themen: gleiche Reihenfolge, unverändert */
  const ohneWiso = T.filter(t => !/^wiso-/.test(t.id));
  const erwartet = reihe.indexOf(KATALOG) >= 0 ? altIds : alt.filter(t => (basis.AP2_THEMEN_KATALOG || []).indexOf(t.id) < 0).map(t => t.id);
  assert.deepStrictEqual(ohneWiso.map(t => t.id), erwartet, name + ": alte Themen in alter Reihenfolge");
  ohneWiso.forEach(t => assert.deepStrictEqual(t, alt.find(a => a.id === t.id), name + ": Thema verändert: " + t.id));
  /* WiSo als eigener Block am Ende */
  assert.deepStrictEqual(T.slice(-wisoIds.length).map(t => t.id), wisoIds, name + ": WiSo-Block am Ende");
  /* IDs eindeutig, auch über alle Dateien */
  assert.strictEqual(new Set(T.map(t => t.id)).size, T.length, name + ": Themen-ID doppelt");
  const fragen = ctx.GENLERNEN.alleFragen();
  assert.strictEqual(new Set(fragen.map(q => q.id)).size, fragen.length, name + ": Fragen-ID doppelt");
  assert.strictEqual(fragen.length, T.reduce((s, t) => s + (t.quiz || []).length, 0), name + ": alle Fragen erreichbar");
  /* zweimal geladen: ersetzt, verdoppelt nicht */
  vm.runInContext(fs.readFileSync(gen("lernen-wiso-daten.js"), "utf8"), ctx, { filename: "nochmal" });
  assert.deepStrictEqual(kopie(ctx.AP2_THEMEN).map(t => t.id), T.map(t => t.id), name + ": doppeltes Laden verdoppelt");
});
/* ohne Grunddaten (falsche Reihenfolge): legt die Liste an, statt abzustürzen */
const allein = lade(["lernen-wiso-daten.js"]);
assert.deepStrictEqual(kopie(allein.AP2_THEMEN).map(t => t.id), wisoIds);

/* ---- 2. Daten ------------------------------------------------------------ */
global.window = global;
const speicher = {};
global.localStorage = { getItem: k => (k in speicher ? speicher[k] : null), setItem: (k, v) => { speicher[k] = String(v); } };
const T0 = require(gen("lernen-daten.js"));
const altAnzahl = T0.length;
const W = require(gen("lernen-wiso-daten.js"));
const L = require(gen("lernen.js"));
const LS = require(gen("lernstand.js"));
assert.strictEqual(global.AP2_THEMEN.length, altAnzahl + W.length, "WiSo ergänzt die Liste");
assert.deepStrictEqual(W.map(t => t.id), wisoIds);

const ERLAUBT = /^https:\/\/(www\.gesetze-im-internet\.de|www\.bibb\.de|www\.tk\.de|www\.revosax\.sachsen\.de|www\.ihk\.de|www\.dguv\.de|www\.umweltpakt\.bayern\.de|www\.blauer-engel\.de|eur-lex\.europa\.eu)\//;
const JAHRESWERT = /Beitragsbemessungsgrenze|Geringfügigkeitsgrenze|Mindestvergütung|Zusatzbeitrag|Beitragssätze|Übergangsbereich|Minijob/;
const ZAHL = /\d[\d.,]*\s?(€|%)/;
const markiert = text => /Stand 2026|[Ll]aut Aufgabe/.test(text);
const saetze = text => text.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„А-ЯЁ«(])/);
/* für die Satzlänge: auch „… ab. 5 bis 20: …“ ist ein neuer Satz */
const teile = text => text.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„(\d])/);
const qIds = new Set();
let nFragen = 0;

W.forEach(t => {
  const n = t.id;
  assert(/^wiso-[a-z]+$/.test(n), "Themen-ID mit Präfix wiso-: " + n);
  assert.strictEqual(t.teil, "WiSo", n + ": teil");
  ["titel", "ru", "katalog", "kurzRu", "merke"].forEach(f => assert(t[f] && String(t[f]).trim(), n + " ohne " + f));
  assert(KYR.test(t.ru) && KYR.test(t.kurzRu), n + ": Russisch fehlt");
  assert(!KYR.test(t.titel + t.merke), n + ": Titel und Merksatz deutsch");
  const k = saetze(t.kurzRu).length;
  assert(k >= 2 && k <= 3, n + ": kurzRu soll 2–3 Sätze haben, hat " + k);
  assert(/^AP2 03\.0[1-5]\.\d\d/.test(t.katalog) && /\(S\. (2[6-9]|3[0-3])/.test(t.katalog), n + ": Katalogverweis „AP2 03.xx.xx (S. 26–33)“: " + t.katalog);
  assert.strictEqual(t.anzahl, t.quiz.length, n + ": anzahl");
  (t.links || []).forEach(([u]) => assert(/^https:\/\/ap2\.online\//.test(u), n + ": links nur ap2.online (Überschrift in lernen.js)"));
  assert(Array.isArray(t.quellen) && t.quellen.length >= 1, n + ": Quellen fehlen");
  t.quellen.forEach(([u, x]) => assert(ERLAUBT.test(u) && x && x.trim(), n + ": Quelle " + u));

  /* Begriffe: deutsch, russisch, einfache deutsche Erklärung */
  assert(Array.isArray(t.punkte) && t.punkte.length >= 8 && t.punkte.length <= 14, n + ": 8–14 Begriffe, sind " + t.punkte.length);
  t.punkte.forEach(p => {
    assert.strictEqual(p.length, 3, n + " Punkt: " + p[0]);
    const [de, ru, text] = p;
    assert(de && !KYR.test(de), n + ": Begriff deutsch: " + de);
    assert(KYR.test(ru), n + ": Begriff ohne Russisch: " + de);
    assert(text && !KYR.test(text), n + ": Erklärung soll deutsch sein: " + de);
    teile(text).forEach(s => assert(s.split(/\s+/).length <= 25, n + ": Satz zu lang (" + de + "): " + s));
    if (JAHRESWERT.test(de + " " + text) && ZAHL.test(text)) assert(markiert(text), n + ": jährlicher Wert ohne „Stand 2026“: " + de);
  });
  if (t.tabelle) {
    t.tabelle.zeilen.forEach(z => assert.strictEqual(z.length, t.tabelle.kopf.length, n + " Tabellenzeile " + z[0]));
    const alles = t.tabelle.zeilen.map(z => z.join(" ")).join(" ");
    if (JAHRESWERT.test(alles + t.tabelle.titel) && /\d,\d\s?%/.test(alles)) assert(markiert(t.tabelle.titel), n + ": Tabelle mit Jahreswerten ohne „Stand 2026“");
  }
  (t.code || []).forEach(c => {
    assert(c.titel && c.text, n + ": Codeblock");
    c.text.split("\n").forEach(z => assert(z.length <= 38, n + ": Zeile zu breit fürs Handy: " + z));
  });

  /* Quiz im WiSo-Stil */
  assert(t.quiz.length >= 8 && t.quiz.length <= 12, n + ": 8–12 Quizfragen, sind " + t.quiz.length);
  t.quiz.forEach(q => {
    nFragen++;
    assert(/^wiso-[a-z]{2}\d+$/.test(q.id), "Fragen-ID: " + q.id);
    assert(!qIds.has(q.id), "Frage doppelt: " + q.id); qIds.add(q.id);
    assert(q.f && q.f.trim() && !KYR.test(q.f), q.id + ": Frage deutsch");
    assert(q.w && KYR.test(q.w), q.id + ": Erklärung auf Russisch fehlt");
    assert(q.o.length >= 3 && q.o.length <= 5, q.id + ": 3–5 Antworten");
    q.o.forEach(o => assert(o && o.trim() && !KYR.test(o), q.id + ": Antwort leer oder nicht deutsch"));
    assert.strictEqual(new Set(q.o).size, q.o.length, q.id + ": doppelte Antwort");
    assert(q.r.length >= 1 && q.r.every(i => Number.isInteger(i) && i >= 0 && i < q.o.length), q.id + ": richtige Antwort nicht unter den Antworten");
    assert.strictEqual(new Set(q.r).size, q.r.length, q.id + ": r doppelt");
    assert(q.r.length < q.o.length, q.id + ": nicht alle Antworten richtig");
    if (q.r.length > 1) assert(/alle richtigen/.test(q.f), q.id + ": Mehrfachauswahl muss angesagt sein");
    else assert(!/alle richtigen/.test(q.f), q.id + ": „alle richtigen“, aber nur eine Antwort");
    const sicht = q.f + " " + q.o.join(" ");
    if (JAHRESWERT.test(sicht) && ZAHL.test(sicht)) assert(markiert(q.f), q.id + ": jährlicher Wert ohne „Stand 2026“/„laut Aufgabe“");
  });
});
assert(nFragen >= 70, "WiSo-Quizfragen: " + nFragen);
/* keine Kollision mit alten Fragen */
/* T0 ist dasselbe Array wie window.AP2_THEMEN — nur die alten Themen ansehen */
T0.filter(t => !/^wiso-/.test(t.id)).forEach(t => (t.quiz || []).forEach(q => assert(!qIds.has(q.id), "ID schon vergeben: " + q.id)));

/* ---- 3. Rechnungen und Fakten — nachgerechnet ------------------------------ */
const q = id => L.frage(id);
const richtig = id => q(id).r.map(i => q(id).o[i]);
const euro = x => x.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €";
const datum = d => d.getDate() + ". " + ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"][d.getMonth()];
/* Grundfrist § 622 BGB: Zugang + 4 Wochen, dann zum 15. oder Monatsende */
function kuendigungsende(zugang) {
  const fristEnde = new Date(zugang.getTime()); fristEnde.setDate(fristEnde.getDate() + 28);
  return fristEnde.getDate() <= 15 ? new Date(fristEnde.getFullYear(), fristEnde.getMonth(), 15)
    : new Date(fristEnde.getFullYear(), fristEnde.getMonth() + 1, 0);
}
const ar = W.find(t => t.id === "wiso-arbeitsrecht").code[0].text;
const z1 = new Date(2027, 2, 10), f1 = new Date(2027, 2, 38);
assert(ar.includes("Zugang am " + datum(z1)) && ar.includes(datum(f1)) && ar.includes(datum(kuendigungsende(z1))), "Rechenweg 10. März");
assert(ar.includes(datum(kuendigungsende(new Date(2027, 2, 3)))), "Rechenweg 3. März");
const spaetester = new Date(2027, 4, 31 - 28);
assert.strictEqual(kuendigungsende(spaetester).getDate(), 31);
assert.strictEqual(richtig("wiso-ar2")[0], "Am " + datum(spaetester), "spätester Zugang für den 31. Mai");
assert(ar.includes(datum(spaetester)));
assert(/1 Monat zum Ende/.test(richtig("wiso-ar1")[0]), "3 Jahre Betriebszugehörigkeit → 1 Monat");
/* Brutto → Netto */
const netto = 2800 - 280 - 280 * 0.09 - 2800 * 0.21;
assert.strictEqual(richtig("wiso-en3")[0], euro(netto), "Netto-Rechnung");
const ent = W.find(t => t.id === "wiso-entgelt").code[0].text;
const n2 = 3000 - 350 - 350 * 0.09 - 3000 * 0.21;
assert(ent.includes(euro(350 * 0.09).replace(" €", "")) && ent.includes(euro(n2).replace(" €", "")) && ent.includes(euro(n2 - 40).replace(" €", "")), "Rechenbeispiel Entgelt");
/* Kennzahlen */
assert.strictEqual(richtig("wiso-un5")[0], (40000 / 250000 * 100) + " %");
const un = W.find(t => t.id === "wiso-unternehmen").code[0].text;
assert(un.includes("= " + (1200 / 400) + " Tickets") && un.includes("= " + String(600000 / 500000).replace(".", ",")) && un.includes("= " + (40000 / 250000 * 100) + " %"), "Kennzahlen im Rechenweg");
/* Zahlen aus Gesetzen (Stand Oktober 2026) */
assert(/höchstens 4 Monate/.test(richtig("wiso-au1")[0]), "Probezeit Ausbildung 1–4 Monate (§ 20 BBiG)");
assert(/4 Wochen/.test(richtig("wiso-au2")[0]), "§ 22 BBiG");
assert(/25\.000/.test(richtig("wiso-rf3")[0]) && /12\.500/.test(richtig("wiso-rf3")[0]), "GmbH 25.000 €, Anmeldung 12.500 €");
assert.strictEqual(richtig("wiso-sp1")[0], "Aus 1 Person", "§ 9 BetrVG: 5–20 → 1");
assert(/3 Wochen/.test(richtig("wiso-ar6")[0]), "§ 4 KSchG");
assert(/3 Tagen/.test(richtig("wiso-as7")[0]), "§ 193 SGB VII");
assert.strictEqual(richtig("wiso-as8")[0], String(Math.ceil(60 * 0.05)), "DGUV V1 § 26: 5 % in der Verwaltung");
assert(/2 Monaten/.test(richtig("wiso-di7")[0]), "§ 15 Abs. 4 AGG");
assert(/72 Stunden/.test(richtig("wiso-di4")[0]), "Art. 33 DSGVO");
assert(/UG/.test(richtig("wiso-rf5")[0]));

/* ---- 4. lernen.js mit WiSo ------------------------------------------------ */
assert(W.every(t => L.THEMEN().indexOf(t) >= 0), "lernen.js sieht die WiSo-Themen");
const rundeWiso = L.runde({ themen: wisoIds, anzahl: 500 });
assert.strictEqual(rundeWiso.length, nFragen, "WiSo-Runde enthält alle WiSo-Fragen");
assert(rundeWiso.every(x => /^wiso-/.test(x.thema) && x.themaTitel), "WiSo-Runde nur mit WiSo-Fragen");
const mehrfach = q("wiso-au4");
assert(L.pruefe(mehrfach, mehrfach.r.slice().reverse()), "Reihenfolge der Auswahl egal");
assert(!L.pruefe(mehrfach, mehrfach.r.slice(1)), "unvollständig = falsch");
const falsch = q("wiso-au1").o.findIndex((o, i) => q("wiso-au1").r.indexOf(i) < 0);
assert.strictEqual(L.antwortEintragen("wiso-au1", [falsch]), false);
assert.strictEqual(L.standVon("wiso-au1"), "falsch");
assert.strictEqual(L.antwortEintragen("wiso-sp1", q("wiso-sp1").r.slice()), true);
assert.strictEqual(L.standVon("wiso-sp1"), "richtig");
const eintraege = LS.list();
assert(eintraege.some(e => e.topic === "wiso-ausbildung" && e.task === "wiso-au1" && e.kind === "recognition" && e.correct === 0), "Lernstand: WiSo-Antwort gespeichert");
assert(eintraege.some(e => e.topic === "wiso-sozialpartner" && e.correct === 1));
const WIEDER = (global.GENWIEDER_EXTRA || []).find(p => p.key === "lernen");
assert(WIEDER.sammeln().some(x => x.id === "lq:wiso-au1"), "falsche WiSo-Frage landet in „Fehler wiederholen“");
const z = L.zahlen();
assert.strictEqual(z.gesamt, L.alleFragen().length);
assert.strictEqual(z.falsch, 1); assert.strictEqual(z.richtig, 1);
assert(JSON.parse(speicher["ap2:lernen"])["q:wiso-au1"], "Speicherschlüssel ap2:lernen");

/* ---- 5. Einbindung (sobald eingetragen) ------------------------------------ */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const f = "gen/lernen-wiso-daten.js";
if (html.includes(f)) {
  const i = html.indexOf(f);
  assert(html.indexOf("gen/lernen-daten.js") < i, "WiSo nach gen/lernen-daten.js");
  assert(i < html.indexOf("gen/lernen.js"), "WiSo vor gen/lernen.js");
  assert(sw.includes("./" + f), f + " im Service Worker");
  console.log("lernen-wiso: in index.html und sw.js eingebunden");
} else {
  console.log("lernen-wiso: noch nicht in index.html eingebunden (Reihenfolge wird geprüft, sobald sie drinsteht)");
}

console.log("lernen-wiso: " + W.length + " Themen, " + nFragen + " Quizfragen, " + reihen.length + " Ladereihenfolgen, Rechnungen, lernen.js OK");

/* ---- Teile-Filter und WiSo-Quiz (gen/lernen.js) ---- */
{
  const LN = global.GENLERNEN;
  assert.ok(LN && LN.themenIm, "GENLERNEN.themenIm geladen");
  {
    const alleT = LN.THEMEN();
    const w = LN.themenIm("wiso");
    assert.strictEqual(w.length, W.length, "WiSo-Filter: alle WiSo-Themen");
    assert.ok(w.every(t => t.teil === "WiSo"));
    const g1 = LN.themenIm("ga1"), g2 = LN.themenIm("ga2");
    assert.ok(g1.some(t => t.teil === "GA1+GA2") && g2.some(t => t.teil === "GA1+GA2"), "GA1+GA2 in beiden Teilen");
    assert.ok(!g1.some(t => t.teil === "GA2") && !g2.some(t => t.teil === "GA1"));
    assert.ok(!g1.concat(g2).some(t => t.teil === "WiSo"), "WiSo nicht in GA");
    assert.strictEqual(LN.themenIm("alle").length, alleT.length);
    const wisoFragen = LN.runde({ themen: w.map(t => t.id), anzahl: 10 });
    assert.strictEqual(wisoFragen.length, 10);
    assert.ok(wisoFragen.every(q => /^wiso-/.test(q.thema)), "WiSo-Quiz nur aus WiSo-Themen");
    console.log("lernen-wiso: Teile-Filter und WiSo-Quiz OK");
  }
}
