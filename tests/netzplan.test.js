"use strict";

/* Prüft echte Antworten gegen die öffentlich angezeigte Vorgangsliste.
   Die Referenz enumeriert Teilmengen und summiert Dauern; sie verwendet
   weder die Vor-/Rückwärtsrechnung noch einen Pfad-Helfer der Produktion. */
const assert = require("assert");
const path = require("path");
global.window = global;
["kern", "vorlagen-diagramm"].forEach(m => require(path.join(__dirname, "..", "gen", m + ".js")));
const G = global.GEN;
const vorlage = G.vorlageVon("dia-netzplan");
const direkt = saat => vorlage.bau(new G.Rng(saat), { firma: "Test GmbH" });
const pfadFeld = a => a.felder.find(f => /kritischer Pfad/i.test(f.label));

function pruefe(a, antwort, richtig, nachricht) {
  const f = pfadFeld(a);
  const r = G.pruefeFeld(f, antwort);
  assert.strictEqual(r.status, richtig ? "richtig" : "falsch", nachricht + ": " + antwort);
  assert.strictEqual(r.punkte, richtig ? 2 : 0, nachricht + ": Punkte für " + antwort);
}

/* Seed 9 direkt an die Vorlage: zwei gleich lange Starts und Enden.
   A/B dauern 9, D 9, E/F 5 Tage; C dauert nur 4 Tage. */
const regression = direkt(9);
assert.deepStrictEqual(regression.tabellen[0].zeilen, [
  ["A", "9", "—"], ["B", "9", "—"], ["C", "4", "—"],
  ["D", "9", "C, B, A"], ["E", "5", "D"], ["F", "5", "D"]
]);
assert.strictEqual(regression.felder.find(f => f.typ === "zahl").loesung, 23);
pruefe(regression, "A B D E F", false, "Parallele kritische Vorgänge sind kein einzelner Pfad");
for (const antwort of ["A D E", "A D F", "B D E", "B D F"]) {
  pruefe(regression, antwort, true, "Jeder der vier kritischen Pfade ist gültig");
}
for (const antwort of ["ADE", "a d e", "  A   D   E  ", "A, D, E", "A-D-E", "A – D – E", "A → D → E", "A -> D -> E", "A,D → E"]) {
  pruefe(regression, antwort, true, "Schreibweisen desselben Pfads");
}
for (const antwort of ["E D A", "D A E", "A D", "D E", "A E", "C D E", "A D E F", "B A D E", "A D D E", "X A D E", "A D E 23", "A D E oder A D F", "nicht A D E", "???"]) {
  pruefe(regression, antwort, false, "Nur ein vollständiger gültiger Pfad zählt");
}
for (const antwort of ["", "   ", null, undefined]) {
  assert.strictEqual(G.pruefeFeld(pfadFeld(regression), antwort).status, "leer");
}

function referenz(a) {
  const vorgaenge = a.tabellen[0].zeilen.map(([name, dauer, vor]) => ({
    name, dauer: Number(dauer), vor: vor === "—" ? [] : vor.split(", ")
  }));
  const kandidaten = [];
  for (let maske = 1; maske < 2 ** vorgaenge.length; maske++) {
    const folge = vorgaenge.filter((v, i) => maske & (1 << i));
    const anfang = folge[0], ende = folge[folge.length - 1];
    const verbunden = folge.every((v, i) => i === 0 || v.vor.includes(folge[i - 1].name));
    const vollstaendig = !anfang.vor.length && !vorgaenge.some(v => v.vor.includes(ende.name));
    kandidaten.push({ namen: folge.map(v => v.name), pfad: verbunden && vollstaendig,
      dauer: folge.reduce((s, v) => s + v.dauer, 0) });
  }
  const dauer = Math.max(...kandidaten.filter(k => k.pfad).map(k => k.dauer));
  return { kandidaten, dauer };
}

let geprueft = 0, mehrfach = 0, einfach = 0;
for (let saat = 0; saat < 300; saat++) {
  // Beide Aufrufwege: direkt reproduzierbare Vorlage und normalisiertes UI-Modell.
  for (const [weg, a] of [["Vorlage", direkt(saat)], ["Generator", G.erzeuge("dia-netzplan", saat)]]) {
    const ref = referenz(a), kontext = weg + " Saat " + saat;
    const kritische = ref.kandidaten.filter(k => k.pfad && k.dauer === ref.dauer);
    assert(kritische.length > 0, kontext + ": mindestens ein längster Pfad");
    if (kritische.length > 1) mehrfach++; else einfach++;
    assert.strictEqual(a.felder.find(f => f.typ === "zahl").loesung, ref.dauer, kontext + ": Projektdauer");
    for (const k of ref.kandidaten) {
      const richtig = k.pfad && k.dauer === ref.dauer;
      pruefe(a, k.namen.join(" "), richtig, kontext);
      geprueft++;
      if (richtig && k.namen.length > 1) {
        pruefe(a, k.namen.slice().reverse().join(" "), false, kontext + ": umgekehrte Reihenfolge");
      }
    }
  }
}
assert(mehrfach > 0 && einfach > 0, "Sowohl eindeutige als auch alternative kritische Pfade geprüft");
console.log("netzplan: Seed 9, Schreibweisen und " + geprueft + " Antworten in 600 Netzplänen OK (" + mehrfach + " mit Alternativen)");
