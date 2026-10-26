"use strict";
/* Foto der Papier-Antwort (gen/fotos.js): Schlüssel, wann der Knopf kommt,
   Größe beim Verkleinern. IndexedDB und Canvas prüft der Browser-Test.    */
const assert = require("assert");
const F = require("../gen/fotos.js");

/* ---------------------------------------------------------- Schlüssel --- */
assert.strictEqual(F.DB_NAME, "ap2-fotos", "eigene Datenbank, nicht ap2-azubi");
assert.notStrictEqual(F.DB_NAME, "ap2-azubi");
assert.strictEqual(F.schluessel("ga2-2023-w", "ga2-2023-w-1a", 1760000000000), "ga2-2023-w|ga2-2023-w-1a|1760000000000");
assert.strictEqual(F.schluessel("ga1-2025-w", "ga1-2025-w-4c", 1760000000123.7), "ga1-2025-w|ga1-2025-w-4c|1760000000123", "ganze ms");
assert.throws(() => F.schluessel("", "x", 1), "ohne Modul kein Schlüssel");
assert.throws(() => F.schluessel("m", null, 1), "ohne Teilaufgabe kein Schlüssel");
assert.deepStrictEqual(F.zerlegen("ga2-2023-w|ga2-2023-w-1a|1760000000000"), { modul: "ga2-2023-w", teil: "ga2-2023-w-1a", t: 1760000000000 });
assert.strictEqual(F.zerlegen("kaputt"), null);
assert.strictEqual(F.praefix("m", "t"), "m|t|");
assert.strictEqual(F.praefix("m"), "m|", "ohne Teil: ganzes Modul");

/* Bereich einer Teilaufgabe: nur ihre Fotos, nicht die von „1a“ bei „1“ */
{
  const g = F.grenzen("ga2-2023-w", "ga2-2023-w-1");
  const drin = k => k >= g.von && k <= g.bis;
  assert(drin(F.schluessel("ga2-2023-w", "ga2-2023-w-1", 1760000000000)));
  assert(drin(F.schluessel("ga2-2023-w", "ga2-2023-w-1", 9999999999999)));
  assert(!drin(F.schluessel("ga2-2023-w", "ga2-2023-w-1a", 1760000000000)), "1a gehört nicht zu 1");
  assert(!drin(F.schluessel("ga2-2023-w", "ga2-2023-w-10", 1760000000000)), "10 gehört nicht zu 1");
  assert(!drin(F.schluessel("ga2-2023-s", "ga2-2023-w-1", 1760000000000)), "anderes Modul");
  const gm = F.grenzen("ga2-2023-w");
  assert(F.schluessel("ga2-2023-w", "x", 1) >= gm.von && F.schluessel("ga2-2023-w", "x", 1) <= gm.bis, "Modul-Bereich");
  assert(!(F.schluessel("ga2-2023-wx", "x", 1) <= gm.bis && F.schluessel("ga2-2023-wx", "x", 1) >= gm.von), "ähnliches Modul nicht");
  /* Zeit sortiert als Text richtig (13 Stellen) */
  const a = F.schluessel("m", "t", 1760000000000), b = F.schluessel("m", "t", 1760000000001), c = F.schluessel("m", "t", 1800000000000);
  assert(a < b && b < c);
}

/* ------------------------------------------------- Knopf: wo ja, wo nein --- */
assert.strictEqual(F.zeigenFuer("ga1"), true);
assert.strictEqual(F.zeigenFuer("ga2"), true);
assert.strictEqual(F.zeigenFuer("wiso"), false, "WiSo: nichts zu zeichnen");
assert.strictEqual(F.zeigenFuer("weitere"), false);
assert.strictEqual(F.zeigenFuer(""), false);
assert.strictEqual(F.zeigenFuer(undefined), false);
/* Bereich ohne GENAZUBI: aus m.bereich oder der Modul-ID */
assert.strictEqual(F.bereichVon({ id: "ga2-2023-w", bereich: "ga2" }), "ga2");
assert.strictEqual(F.bereichVon({ id: "ga1-2025-s" }), "ga1");
assert.strictEqual(F.bereichVon({ id: "wiso-2024-w" }), "wiso");
assert.strictEqual(F.bereichVon({ id: "azprog1" }), "");
/* mit GENAZUBI: dessen bereichVon zählt (wie im Bogen) */
{
  const azubi = require("../gen/azubi.js");
  globalThis.GENAZUBI = azubi;
  assert.strictEqual(F.bereichVon({ id: "x", bereich: "GA2" }), "ga2");
  assert.strictEqual(F.zeigenFuer(F.bereichVon({ id: "wiso-2023-s", bereich: "wiso" })), false);
  assert.strictEqual(F.zeigenFuer(F.bereichVon({ id: "ga1-2023-s" })), true);
  delete globalThis.GENAZUBI;
}
/* ohne DOM: anhaengen tut nichts und wirft nicht */
assert.strictEqual(F.anhaengen(null, { id: "ga1-x" }, { id: "t" }), null);

/* ------------------------------------------------------- Verkleinern --- */
assert.strictEqual(F.MAX_SEITE, 1400);
assert.strictEqual(F.QUALITAET, 0.8);
assert.deepStrictEqual(F.masse(4032, 3024), { w: 1400, h: 1050, faktor: 1400 / 4032 }, "Handyfoto quer");
assert.deepStrictEqual(F.masse(3024, 4032), { w: 1050, h: 1400, faktor: 1400 / 4032 }, "Handyfoto hoch");
assert.deepStrictEqual(F.masse(4000, 4000), { w: 1400, h: 1400, faktor: 0.35 }, "quadratisch");
assert.deepStrictEqual(F.masse(800, 600), { w: 800, h: 600, faktor: 1 }, "kleine Bilder nicht vergrößern");
assert.deepStrictEqual(F.masse(1400, 900), { w: 1400, h: 900, faktor: 1 }, "genau 1400 bleibt");
assert.strictEqual(F.masse(1401, 10).w, 1400);
assert.strictEqual(F.masse(10000, 3).h, 1, "nie 0 px");
assert.deepStrictEqual(F.masse(2000, 1000, 1000), { w: 1000, h: 500, faktor: 0.5 }, "eigene Grenze");
[[0, 10], [10, 0], [-5, 5], [NaN, 4], [Infinity, 4], [undefined, undefined]].forEach(([w, h]) =>
  assert.strictEqual(F.masse(w, h), null, "ungültig: " + w + "×" + h));
for (const [w, h] of [[4032, 3024], [3000, 4000], [12000, 9000], [1600, 1200], [4624, 2084]]) {
  const m = F.masse(w, h);
  assert.strictEqual(Math.max(m.w, m.h), 1400, "lange Seite genau 1400: " + w + "×" + h);
  assert(Math.abs(m.w / m.h - w / h) < 0.01, "Seitenverhältnis bleibt: " + w + "×" + h);
}
/* JPEG-Qualität: 0,8; nur wenn zu groß, schrittweise bis 0,5 */
assert.strictEqual(F.naechsteQualitaet(250 * 1024, 0.8), null, "250 KB passt");
assert.strictEqual(F.naechsteQualitaet(500 * 1024, 0.8), 0.7);
assert.strictEqual(F.naechsteQualitaet(500 * 1024, 0.7), 0.6);
assert.strictEqual(F.naechsteQualitaet(500 * 1024, 0.6), 0.5);
assert.strictEqual(F.naechsteQualitaet(500 * 1024, 0.5), null, "nicht schlechter als 0,5");

/* ----------------------------------------------------------- Anzeige --- */
assert.strictEqual(F.groesseText(512), "512 Б");
assert.strictEqual(F.groesseText(212 * 1024), "212 КБ");
assert.strictEqual(F.groesseText(1.5 * 1024 * 1024), "1,5 МБ");
assert.match(F.zeitText(new Date(2026, 9, 10, 9, 5).getTime()), /^10\.10\.2026 09:05$/);
assert(/только на этом устройстве/.test(F.HINWEIS) && /резервной копии/.test(F.HINWEIS), "ehrlicher Hinweis");
/* navigator.storage.persist(): erst fragen, ob schon dauerhaft; Fehler → null */
(async () => {
  let gefragt = 0;
  assert.strictEqual(await F.dauerhaft({ persisted: () => Promise.resolve(false), persist: () => { gefragt++; return Promise.resolve(true); } }), true);
  assert.strictEqual(gefragt, 1);
  assert.strictEqual(await F.dauerhaft({ persisted: () => Promise.resolve(true), persist: () => { gefragt++; return Promise.resolve(true); } }), true);
  assert.strictEqual(gefragt, 1, "schon dauerhaft → nicht erneut fragen");
  assert.strictEqual(await F.dauerhaft({ persist: () => Promise.resolve(false) }), false, "abgelehnt");
  assert.strictEqual(await F.dauerhaft(null), null, "nicht unterstützt");
  assert.strictEqual(await F.dauerhaft({ persisted: () => Promise.reject(new Error("x")), persist: () => Promise.resolve(true) }), null);
  console.log("fotos: ok");
})().catch(e => { console.error(e); process.exit(1); });
