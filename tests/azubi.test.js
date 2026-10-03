"use strict";

/* Bogen-Player für echte AP2-Prüfungen (gen/azubi.js, ehemals Azubi-Navigator): Kontrolle der Eingaben, Punkte, Noten,
   Reihenfolge der Empfehlung — und, falls das private Paket im Ordner
   liegt, dessen Aufbau. Ohne privat/ laufen nur die Logik-Tests.        */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

const A = require(path.join(root, "gen", "azubi.js"));

/* Zahlen: Komma, Tausenderpunkt, Einheiten */
assert.deepStrictEqual(A.zahlen("760000"), [760000]);
assert(A.zahlen("760.000").includes(760000), "Tausenderpunkt");
assert(A.zahlen("1.512").includes(1512) && A.zahlen("1.512").includes(1.512), "beide Lesarten");
assert.deepStrictEqual(A.zahlen("10,91 GiB"), [10.91]);
assert.deepStrictEqual(A.zahlen("€ 30400"), [30400]);
assert.deepStrictEqual(A.zahlen("abc"), []);

const zahl = soll => ({ id: "1", art: "zahl", soll: [].concat(soll) });
assert(A.feldRichtig(zahl("760000"), "760.000"));
assert(A.feldRichtig(zahl("760000"), "760000 €"));
assert(!A.feldRichtig(zahl("760000"), "760500"));
assert(A.feldRichtig(zahl("10,91"), "10.91"));
assert(A.feldRichtig(zahl("10,91"), "10,92"), "Rundung in der letzten Stelle zählt als richtig");
assert(!A.feldRichtig(zahl("10,91"), "10,8"));
assert(A.feldRichtig(zahl("3"), "3"));
assert(!A.feldRichtig(zahl("3"), "2"));
assert(!A.feldRichtig(zahl("3"), ""));

const text = soll => ({ id: "1", art: "text", soll: [].concat(soll) });
assert(A.feldRichtig(text(["Nein", "nein", "n"]), " NEIN "));
assert(A.feldRichtig(text("ökonomisch"), "Oekonomisch"));
assert(A.feldRichtig(text("192.168.1.2"), "192.168.1.2"));
assert(!A.feldRichtig(text("192.168.1.2"), "192.168.1.20"));

/* Teilaufgaben prüfen */
const raster = { id: "t1", punkte: 4, eingabe: { typ: "raster", spalten: 2, zeilen: 2, zellen: [
  { h: "Jahr" }, { h: "Zinsen" }, { h: "1" }, { f: { id: "1", art: "zahl", soll: ["30400"] } }] } };
let r = A.pruefe(raster, { f1: "30.400" });
assert.strictEqual(r.n, 1); assert.strictEqual(r.k, 1); assert.strictEqual(r.vorschlag, 4);
r = A.pruefe(raster, { f1: "30000" });
assert.strictEqual(r.vorschlag, 0);

const wahl = { id: "t2", punkte: 3, eingabe: { typ: "wahl", zeilen: [
  { id: "1", optionen: ["1st", "2nd", "3rd"], soll: 1 },
  { id: "2", optionen: ["1st", "2nd", "3rd"], soll: 0 },
  { id: "3", optionen: ["1st", "2nd", "3rd"], soll: 2 }] } };
r = A.pruefe(wahl, { w1: 1, w2: 0, w3: 0 });
assert.strictEqual(r.k, 2); assert.strictEqual(r.vorschlag, 2);
assert.strictEqual(r.marken.w3, false);

const zuo = { id: "t3", punkte: 2, eingabe: { typ: "zuordnung", optionen: ["a", "b"], zeilen: [{ id: "1", soll: "2" }, { id: "2", soll: "1" }] } };
assert.strictEqual(A.pruefe(zuo, { z1: "2", z2: "1" }).vorschlag, 2);
assert.strictEqual(A.pruefe(zuo, { z1: "1" }).vorschlag, 1 * 0 + 0, "nur falsch → 0");

const mehr = { id: "t4", punkte: 4, eingabe: { typ: "mehrfach", optionen: ["1", "2", "3", "4", "5", "6"], soll: [1, 2, 6, 8], anzahl: 4 } };
assert.strictEqual(A.pruefe(mehr, { m: [1, 2, 6, 8] }).vorschlag, 4);
assert.strictEqual(A.pruefe(mehr, { m: [1, 2, 3] }).vorschlag, 1, "zwei Treffer minus ein Fehlgriff");
assert.strictEqual(A.pruefe(mehr, { m: [1, 1, 1, 1] }).vorschlag, 1, "doppelte importierte Auswahl verdient keine mehrfachen Punkte");
assert.strictEqual(A.pruefe({ ...mehr, global: true }, { m: [1, 1, 1, 1] }).vorschlag, 0, "Duplikate ersetzen keine fehlenden Lösungen");

const offen = { id: "t5", punkte: 4, eingabe: { typ: "zeilen", zeilen: [{ h: "", frei: "1", gross: true }] } };
r = A.pruefe(offen, { t1: "Risiko: Verzug" });
assert.strictEqual(r.pruefbar, false); assert.strictEqual(r.vorschlag, null);
assert(A.hatAntwort(offen, { t1: "x" })); assert(!A.hatAntwort(offen, { t1: "  " }));

/* Noten nach IHK-Schlüssel */
assert.strictEqual(A.note(92).text, "sehr gut");
assert.strictEqual(A.note(91.9).text, "gut");
assert.strictEqual(A.note(50).text, "ausreichend");
assert.strictEqual(A.note(49.5).text, "mangelhaft");
assert.strictEqual(A.note(29).text, "ungenügend");

/* Auswertung und Empfehlung */
const modul = (id, nr, art) => ({ id, nr, art: art || "pruefung", aufgaben: [{ nr: "1", titel: "Aufgabe 1", teile: [raster, offen] }] });
const Z = () => ({ a: {}, auf: {}, p: {}, auto: {}, versuche: [], zuletzt: 0 });

/* WiSo: erst die Summe runden, nicht jede der 30 Aufgaben. */
const wisoTeile = Array.from({ length: 30 }, (_, i) => ({
  id: "wiso" + i, punkte: 100 / 30, global: true,
  eingabe: { typ: "mehrfach", optionen: ["richtig", "falsch"], soll: [1] }
}));
const wisoModul = { id: "wiso-test", aufgaben: [{ nr: "1", teile: wisoTeile }] };
for (const [richtig, erwartet] of [[0, 0], [15, 50], [30, 100]]) {
  const wz = Z();
  wisoTeile.forEach((t, i) => {
    wz.a[t.id] = { m: [i < richtig ? 1 : 2] };
    wz.p[t.id] = A.pruefe(t, wz.a[t.id]).vorschlag;
    wz.auto[t.id] = 1;
  });
  assert.strictEqual(A.auswertung(wisoModul, wz).prozent, erwartet, richtig + "/30 WiSo genau");
}
const bruchTeil = { ...wahl, punkte: 100 / 30 };
assert(Math.abs(A.pruefe(bruchTeil, { w1: 1, w2: 0, w3: 0 }).vorschlag - 20 / 9) < 1e-12,
  "Teilpunkte behalten ihre Genauigkeit");
assert.strictEqual(A.pruefe({ ...bruchTeil, global: true }, { w1: 1 }).vorschlag, 0,
  "Globalbewertung bleibt ganz oder gar nicht");
const altWiso = Z();
wisoTeile.forEach((t, i) => {
  altWiso.a[t.id] = { m: [i < 15 ? 1 : 2] };
  altWiso.p[t.id] = i < 15 ? 3.33 : 0;
  altWiso.auto[t.id] = 1;
});
assert.strictEqual(A.auswertung(wisoModul, altWiso).prozent, 50, "alte automatische Rundung korrigiert");
delete altWiso.auto.wiso0;
assert(Math.abs(A.auswertung(wisoModul, altWiso).punkte - (3.33 + 140 / 3)) < 1e-10,
  "manuelle 3,33 bleiben erhalten");
assert.strictEqual(altWiso.p.wiso0, 3.33, "Auswertung schreibt manuelle Bewertung nicht um");

/* Lösung vor dem Antworten und Nachbearbeitung dürfen nicht wie Eigenleistung aussehen. */
assert.strictEqual(typeof A.loesungAnsehen, "function");
assert.strictEqual(typeof A.antwortSetzen, "function");
const mitHilfe = Z();
A.loesungAnsehen(offen, mitHilfe, 700);
assert.deepStrictEqual(mitHilfe.hilfe.t5, { loesungGezeigt: 700, vorAntwort: true });
A.antwortSetzen(offen, mitHilfe, "t1", "nachgelesene Antwort");
assert.strictEqual(mitHilfe.hilfe.t5.nachLoesung, true);
A.loesungAnsehen(offen, mitHilfe, 800);
assert.strictEqual(mitHilfe.hilfe.t5.loesungGezeigt, 700, "Zeit der ersten Hilfe erhalten");
const ohneHilfe = Z();
A.antwortSetzen(offen, ohneHilfe, "t1", "eigener Entwurf");
assert.deepStrictEqual(ohneHilfe.a.t5, { t1: "eigener Entwurf" });
assert.strictEqual(ohneHilfe.hilfe, undefined, "normale Eingabe zählt nicht als Hilfe");
A.loesungAnsehen(offen, ohneHilfe, 900);
assert.strictEqual(ohneHilfe.hilfe.t5.vorAntwort, false, "Lösung erst nach Antwort");

const geaendert = { ...Z(), a: { t1: { f1: "30400" } }, p: { t1: 4 }, auto: { t1: 1 },
  auf: { t1: 1 }, beobachtet: { t1: { signatur: "alt", ok: true } } };
A.antwortSetzen(raster, geaendert, "f1", "30000");
assert.strictEqual(geaendert.p.t1, 0, "falsche geänderte Antwort darf volle alte Auto-Punkte nicht behalten");
assert.strictEqual(geaendert.auto.t1, 1);
assert.strictEqual(geaendert.beobachtet.t1, undefined, "neue Antwort braucht neue Beobachtung");
A.antwortSetzen(raster, geaendert, "f1", "30400");
assert.strictEqual(geaendert.p.t1, 4);
geaendert.beobachtet.t1 = { signatur: "aktuell", ok: true };
A.antwortSetzen(raster, geaendert, "f1", "30400");
assert.strictEqual(geaendert.beobachtet.t1.signatur, "aktuell", "unveränderter Wert verwirft den Stempel nicht");
const manuellGeaendert = { ...Z(), a: { t1: { f1: "30400" } }, p: { t1: 2.5 } };
A.antwortSetzen(raster, manuellGeaendert, "f1", "30000");
assert.strictEqual(manuellGeaendert.p.t1, 2.5, "manuelle Bewertung nicht automatisch überschreiben");

/* Grenze zum Lernstand: Auswahl, Selbstbewertung und Hilfe nicht vermischen. */
assert.strictEqual(typeof A.beobachten, "function");
const alteBeobachtung = global.GENLERNSTAND;
const ereignisse = [];
let beobachtungSpeicherbar = true;
global.GENLERNSTAND = { record: event => {
  if (!beobachtungSpeicherbar) return { ok: false, error: "quota" };
  ereignisse.push(event); return { ok: true, event };
} };
try {
  const beobachtet = { ...Z(), modus: "uebung", a: { wiso0: { m: [1] } },
    p: { wiso0: 100 / 30 }, auto: { wiso0: 1 } };
  A.loesungAnsehen(wisoTeile[0], beobachtet, 1000);
  assert(A.beobachten(wisoModul, wisoTeile[0], beobachtet));
  assert.strictEqual(ereignisse[0].source, "azubi");
  assert.strictEqual(ereignisse[0].topic, "wiso");
  assert.strictEqual(ereignisse[0].task, "wiso-test:wiso0");
  assert.strictEqual(ereignisse[0].kind, "recognition", "Auswahl ist kein selbst formulierter Lösungsweg");
  assert.strictEqual(ereignisse[0].support, "selbst", "erster unveränderter Antwortversuch vor Aufdecken");
  A.beobachten(wisoModul, wisoTeile[0], beobachtet);
  assert.strictEqual(ereignisse.length, 1, "dieselbe Bewertung wird nicht wiederholt gezählt");
  A.antwortSetzen(wisoTeile[0], beobachtet, "m", [2]);
  beobachtet.p.wiso0 = 0;
  A.beobachten(wisoModul, wisoTeile[0], beobachtet);
  assert.strictEqual(ereignisse[1].support, "loesung", "Änderung nach Aufdecken als Hilfe erfasst");
  assert.deepStrictEqual(ereignisse[0].answers, { m: [1] }, "frühere Beobachtung bleibt eigenständig");
  const selbst = { ...Z(), modus: "uebung", a: { t5: { t1: "selbst geschrieben" } }, p: { t5: 2 } };
  A.loesungAnsehen(offen, selbst, 1100);
  A.beobachten(wisoModul, offen, selbst);
  assert.strictEqual(ereignisse[2].kind, "selbst");
  assert.strictEqual(ereignisse[2].correct, 2);
  assert.strictEqual(ereignisse[2].max, 4);
  assert.strictEqual(ereignisse[2].support, "selbst");
  const alteHilfe = { ...Z(), modus: "uebung", a: { t5: { t1: "älter" } }, p: { t5: 2 }, auf: { t5: 1 } };
  A.beobachten(wisoModul, offen, alteHilfe);
  assert.strictEqual(ereignisse[3].support, "loesung", "alte offene Lösung ohne Zeit nicht als unabhängig ausgeben");
  const pruefung = { ...Z(), modus: "pruefung", abgegeben: true, a: { wiso0: { m: [1] } }, p: { wiso0: 100 / 30 }, auto: { wiso0: 1 }, auf: { wiso0: 1 } };
  beobachtungSpeicherbar = false;
  assert.strictEqual(A.beobachten(wisoModul, wisoTeile[0], pruefung), false);
  beobachtungSpeicherbar = true;
  assert(A.beobachten(wisoModul, wisoTeile[0], pruefung), "erneutes Speichern nach Fehler bleibt möglich");
  assert.strictEqual(ereignisse[4].support, "selbst", "Abgabe deckt erst nach dem Antwortversuch auf");
  delete global.GENLERNSTAND;
  assert.strictEqual(A.beobachten(wisoModul, wisoTeile[0], pruefung), false, "optionales Modul darf fehlen");
} finally {
  if (alteBeobachtung === undefined) delete global.GENLERNSTAND; else global.GENLERNSTAND = alteBeobachtung;
}

let z = Z(); z.p.t1 = 4; z.p.t5 = 2;
const s = A.auswertung(modul("x", 1), z);
assert.strictEqual(s.punkte, 6); assert.strictEqual(s.max, 8); assert.strictEqual(s.fertig, true); assert.strictEqual(s.prozent, 75);

/* Neustart muss Antworten sichern, auch unfertige, und bei Speicherfehler abbrechen. */
assert.strictEqual(typeof A.neuerVersuch, "function", "Neustart mit vollständigem Archiv ist verfügbar");
const gespeichert = new Map();
const alterStorage = global.localStorage;
let speicherVoll = false;
global.localStorage = {
  getItem: key => gespeichert.get(key) || null,
  setItem: (key, wert) => { if (speicherVoll) throw new Error("quota"); gespeichert.set(key, wert); }
};
try {
  const mz = modul("archiv-test", 1);
  const az = { ...Z(), modus: "uebung", zeit: 120000, start: 101, pos: "t5", abgegeben: false,
    a: { t1: { f1: "30400" }, t5: { t1: "Mein eigener Entwurf" } },
    p: { t1: 4, t5: 2 }, auto: { t1: 1 }, auf: { t1: 1, t5: 1 },
    hilfe: { t5: { loesungGezeigt: 102, vorAntwort: true } },
    konflikte: [{ teil: "t1", a: { f1: "30000" } }] };
  const alteAntworten = az.a;
  assert(A.neuerVersuch(mz, az), "Neustart gespeichert");
  const gespeichertNeu = A.zustand(mz.id);
  assert.deepStrictEqual(gespeichertNeu.a, {}, "neuer Bogen ist leer");
  assert.strictEqual(gespeichertNeu.versuche.length, 1);
  const v = gespeichertNeu.versuche[0];
  assert.strictEqual(v.p, 6);
  assert.strictEqual(v.zustand.a.t5.t1, "Mein eigener Entwurf", "Freitext wieder lesbar");
  assert.deepStrictEqual(v.zustand.p, { t1: 4, t5: 2 }, "alle Einzelpunkte erhalten");
  assert.deepStrictEqual(v.zustand.auto, { t1: 1 }, "manuell und automatisch unterscheidbar");
  assert.strictEqual(v.zustand.zeit, 120000);
  assert.strictEqual(v.zustand.start, 101);
  assert.strictEqual(v.zustand.pos, "t5");
  assert.strictEqual(v.zustand.hilfe.t5.vorAntwort, true, "Hilfe erhalten");
  assert.deepStrictEqual(gespeichertNeu.konflikte, [{ teil: "t1", a: { f1: "30000" } }], "Importkonflikt beim Neustart erhalten");
  assert.strictEqual(v.zustand.versuche, undefined, "keine rekursiven Archive");
  alteAntworten.t5.t1 = "später verändert";
  assert.strictEqual(az.versuche[0].zustand.a.t5.t1, "Mein eigener Entwurf", "Archiv ist eigenständige Kopie");

  const unfertig = { ...Z(), modus: "pruefung", zeit: 17000, a: { t5: { t1: "noch nicht bewertet" } } };
  assert(A.neuerVersuch(mz, unfertig));
  assert.strictEqual(unfertig.versuche[0].zustand.a.t5.t1, "noch nicht bewertet", "unbewertete Antwort archiviert");
  assert.strictEqual(unfertig.versuche[0].bewertet, 0);

  const teilweise = { ...Z(), modus: "pruefung", zeit: 17000,
    a: { t1: { f1: "1" }, t5: { t1: "behalten" } }, p: { t1: 0, t5: 3 }, auto: { t1: 1 },
    auf: { t1: 1 }, hilfe: { t1: { vorAntwort: true } } };
  assert(A.neuerVersuch(mz, teilweise, ["t1"]));
  assert.deepStrictEqual(teilweise.a, { t5: { t1: "behalten" } }, "nur gewünschte Aufgabe geleert");
  assert.strictEqual(teilweise.p.t5, 3);
  assert.strictEqual(teilweise.hilfe.t1, undefined);
  assert.strictEqual(teilweise.modus, "uebung");
  assert.strictEqual(teilweise.zeit, 0);
  assert.strictEqual(teilweise.versuche[0].zustand.a.t1.f1, "1");

  const langeHistorie = { ...Z(), a: { t5: { t1: "neu" } },
    versuche: Array.from({ length: 21 }, (_, i) => ({ d: i + 1, p: i })) };
  assert(A.neuerVersuch(mz, langeHistorie));
  assert.strictEqual(langeHistorie.versuche.length, 22, "alte Versuche niemals still löschen");
  assert.strictEqual(langeHistorie.versuche[0].d, 1, "Altformat bleibt erhalten");

  const leererBogen = { ...Z(), modus: "uebung" };
  assert(A.neuerVersuch(mz, leererBogen));
  assert.strictEqual(leererBogen.versuche.length, 0, "kein leeres Schein-Ergebnis");

  /* Reales Ereignisarchiv: Reload dupliziert nicht, ein neuer Versuch zählt neu. */
  const lernstand = require(path.join(root, "gen", "lernstand.js"));
  const beobachtung = { ...Z(), modus: "pruefung", abgegeben: true, start: 2000,
    a: { wiso0: { m: [1] } }, p: { wiso0: 100 / 30 }, auto: { wiso0: 1 } };
  assert(A.beobachten(wisoModul, wisoTeile[0], beobachtung));
  localStorage.setItem("ap2:azubi:" + wisoModul.id, JSON.stringify(beobachtung));
  const nachLaden = A.zustand(wisoModul.id);
  assert(A.beobachten(wisoModul, wisoTeile[0], nachLaden));
  assert.strictEqual(lernstand.list().length, 1, "Reload erzeugt keine zusätzliche Erfolgsmeldung");
  assert(A.neuerVersuch(wisoModul, nachLaden, ["wiso0"]));
  nachLaden.a.wiso0 = { m: [1] }; nachLaden.p.wiso0 = 100 / 30; nachLaden.auto.wiso0 = 1;
  assert(A.beobachten(wisoModul, wisoTeile[0], nachLaden));
  assert.strictEqual(lernstand.list().length, 2, "neuer Antwortversuch erzeugt neue Beobachtung");
  assert.strictEqual(lernstand.summary()[0].recognition, 2);
  assert.strictEqual(lernstand.summary()[0].independent, 0, "Auswahl wird nicht in selbständige Lösungsquote gerechnet");
  if (alteBeobachtung === undefined) delete global.GENLERNSTAND; else global.GENLERNSTAND = alteBeobachtung;

  const fehler = { ...Z(), a: { t5: { t1: "unersetzbar" } } };
  const vorher = JSON.stringify(fehler);
  const vorherGespeichert = gespeichert.get("ap2:azubi:" + mz.id);
  speicherVoll = true;
  assert.strictEqual(A.neuerVersuch(mz, fehler), false, "Speicherfehler verhindert Neustart");
  assert.strictEqual(JSON.stringify(fehler), vorher, "aktuelle Antworten bleiben bei Speicherfehler");
  assert.strictEqual(gespeichert.get("ap2:azubi:" + mz.id), vorherGespeichert, "gespeicherter Stand bleibt bei Speicherfehler");
} finally {
  if (alterStorage === undefined) delete global.localStorage; else global.localStorage = alterStorage;
}

const M = [modul("a", 1), modul("b", 2), modul("c", 3), modul("d", 4), modul("v", 1, "vertiefung")];
const zust = { a: Z(), b: Z(), c: Z(), d: Z(), v: Z() };
zust.c.a.t5 = { t1: "angefangen" }; zust.c.zuletzt = 5;
const reihe = A.sortiert(M, id => zust[id], { a: "befriedigend", d: "mangelhaft" }).map(e => e.m.id + ":" + e.g);
assert.deepStrictEqual(reihe, ["c:weiter", "b:neu", "v:neu", "d:schwach", "a:gemacht"]);

/* Paket aus Datei-Text: .js mit Vorspann oder reines JSON */
const mini = { module: [{ id: "az1", aufgaben: [] }], bilder: {} };
assert.strictEqual(A.paketAusText("window.IHK_AZUBI = " + JSON.stringify(mini) + ";\n").module[0].id, "az1");
assert.throws(() => A.paketAusText("{\"module\":[]}"), /kein AP2-Prüfungspaket/);
assert.throws(() => A.paketAusText("hallo"), /keine Daten/);

/* Eingebunden, offline verfügbar — und das Paket selbst NICHT öffentlich */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/azubi.js", "gen/azubi.css"].forEach(f => {
  assert(html.includes(f), f + " in index.html");
  assert(sw.includes("./" + f), f + " im Service Worker");
});
assert(!sw.includes("privat/"), "privates Paket darf nicht in den Cache-Vorrat");
assert(!/src="privat\//.test(html), "privates Paket nicht fest in index.html");
const gi = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
assert(/^privat\/$/m.test(gi), "privat/ steht in .gitignore");

/* Falls vorhanden: das echte Paket prüfen */
const paketDatei = path.join(root, "privat", "ap2-paket.js");
if (fs.existsSync(paketDatei)) {
  const P = A.paketAusText(fs.readFileSync(paketDatei, "utf8"));
  const ids = new Set();
  let teile = 0, pruefbar = 0;
  P.module.forEach(m => {
    assert(!ids.has(m.id), "Modul doppelt: " + m.id); ids.add(m.id);
    const summe = m.aufgaben.reduce((s, a) => s + a.teile.reduce((x, t) => x + t.punkte, 0), 0);
    assert(Math.abs(summe - m.punkte) < 1e-6, "Punktsumme " + m.id + ": " + summe);
    if (m.art === "pruefung") assert.strictEqual(m.punkte, 100, m.id + " hat 100 Punkte");
    const tids = new Set();
    m.aufgaben.forEach(a => a.teile.forEach(t => {
      teile++;
      assert(!tids.has(t.id), "Teil doppelt " + t.id); tids.add(t.id);
      assert(t.eingabe && t.eingabe.typ, "Eingabe fehlt " + t.id);
      if (A.stellen(t).length) pruefbar++;
      /* jede Soll-Angabe muss sich selbst als richtig erkennen */
      A.stellen(t).filter(s => s.art === "feld").forEach(s =>
        assert(A.feldRichtig(s.f, s.f.soll[0]), "Soll nicht erkannt: " + m.id + " " + t.id + " " + s.f.soll[0]));
      assert(!/<script|on\w+=|javascript:/i.test(t.text + t.loesung), "unsicheres HTML " + t.id);
    }));
  });
  console.log("azubi: Paket " + P.module.length + " Module, " + teile + " Teilaufgaben (" + pruefbar + " automatisch prüfbar)");
} else {
  console.log("azubi: Logik OK (kein privates Paket im Ordner)");
}
