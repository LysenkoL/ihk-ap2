"use strict";
/* «Мой уровень по частям» (gen/niveau.js): чистые функции на поддельных данных.  node tests/niveau.test.js */
const assert = require("assert");
const N = require("../gen/niveau.js");

/* ---------------------------------------------- Поддельный плеер --- */
const modul = id => ({ id, kurz: id.toUpperCase(), aufgaben: [] });
const bereichVon = m => m.id.split("-")[0];
const fertig = {};                                   /* id → текущая попытка полностью оценена? */
const auswertung = (m, z) => ({ fertig: !!fertig[m.id], prozent: z.aktuell || 0 });
const v = (d, prozent, bewertet, n) => ({ d, prozent, bewertet: bewertet == null ? 10 : bewertet, n: n == null ? 10 : n });
const Z = {
  "ga1-2025-s": { versuche: [v(1, 20), v(2, 40), v(3, 60), v(4, 70), v(5, 80)] },   /* последние 3: 60, 70, 80 */
  "ga1-2025-w": { versuche: [v(6, 10, 5, 10)] },                                     /* неполная — не считается */
  "ga2-2024-s": { versuche: [], aktuell: 45, zuletzt: 9 },                           /* текущая, оценена полностью */
  "ga2-2024-w": { versuche: [], aktuell: 99, zuletzt: 10 },                          /* текущая, но не оценена */
  "wiso-2025-s": { versuche: [v(3, 0, 0, 0)] },                                      /* n = 0 — не считается */
  "azprog1": { versuche: [v(1, 100)] }                                               /* не оригинал — игнор */
};
fertig["ga2-2024-s"] = true;
const zustandVon = id => Z[id] || { versuche: [] };
const mods = Object.keys(Z).map(modul);

const erg = N.ergebnisse(mods, zustandVon, auswertung, bereichVon);
assert.strictEqual(erg.ga1.length, 5, "неполная попытка GA1 не попала");
assert.strictEqual(erg.ga2.length, 1, "только оценённая текущая попытка GA2");
assert.strictEqual(erg.ga2[0].prozent, 45);
assert.strictEqual(erg.wiso.length, 0, "попытка без частей не считается");
assert.ok(!Object.values(erg).some(l => l.some(x => x.id === "azprog1")), "Prognose не входит");

/* ---------------------------------------------------------- Среднее --- */
const w1 = N.teilWert(erg.ga1);
assert.strictEqual(w1.punkte, 70, "среднее последних трёх: 60, 70, 80");
assert.strictEqual(w1.anzahl, 3);
assert.deepStrictEqual(w1.versuche.map(x => x.d), [5, 4, 3], "самые свежие первыми");
assert.strictEqual(N.teilWert([{ d: 1, prozent: 33.3 }, { d: 2, prozent: 50 }]).punkte, 41.7, "2 попытки, округление до 0,1");
assert.strictEqual(N.teilWert([]), null);
assert.strictEqual(N.teilWert(null), null);

const st = N.stand({ module: mods, zustandVon, auswertung, bereichVon });
assert.deepStrictEqual(st.werte, { ga1: 70, ga2: 45, wiso: null });
assert.strictEqual(st.zuerst, "wiso", "часть без данных — первой");
assert.strictEqual(st.regel.status, "offen");
assert.ok(/WiSo/.test(st.regel.text));

/* ---------------------------------------------------------- Пороги --- */
const s = p => N.stufe(p);
assert.strictEqual(s(29.9).farbe, "rot");
assert.strictEqual(s(29.9).note.text, "ungenügend");
assert.strictEqual(s(30).farbe, "gelb");
assert.strictEqual(s(30).note.text, "mangelhaft");
assert.strictEqual(s(49.9).farbe, "gelb");
assert.strictEqual(s(50).farbe, "gruen");
assert.strictEqual(s(50).note.text, "ausreichend");
assert.strictEqual(s(95).note.text, "sehr gut");
assert.strictEqual(s(null).farbe, "leer");

/* ---------------------------------------------------- Правило 3 из 4 --- */
const R = (a, b, c) => N.regel({ ga1: a, ga2: b, wiso: c });
assert.strictEqual(R(50, 60, 70).status, "ja", "все ≥ 50");
assert.strictEqual(R(50, 35, 70).status, "ja", "одна 30–49 допустима");
assert.ok(/GA2/.test(R(50, 35, 70).text));
assert.strictEqual(R(45, 35, 70).status, "nein", "две 30–49 — нет");
assert.strictEqual(R(80, 29.9, 90).status, "nein", "одна ниже 30 — нет");
assert.ok(/ниже 30/.test(R(80, 29.9, 90).text));
assert.strictEqual(R(null, null, null).status, "offen", "нет данных");
assert.strictEqual(R(20, null, null).status, "nein", "ниже 30 — нет, даже без остальных данных");
assert.strictEqual(R(40, null, 60).status, "offen");
assert.ok(R(1, 2, 3).bedingung.indexOf("проект ≥ 50") >= 0);

/* ---------------------------------------------------- Выбор части --- */
assert.strictEqual(N.zuerst({ ga1: 70, ga2: 45, wiso: 60 }), "ga2", "самый низкий балл");
assert.strictEqual(N.zuerst({ ga1: null, ga2: 45, wiso: null }), "ga1", "пустая часть, по порядку GA1 → GA2 → WiSo");
assert.strictEqual(N.zuerst({ ga1: 70, ga2: 80, wiso: null }), "wiso");
assert.strictEqual(N.zuerst({ ga1: null, ga2: null, wiso: null }), "ga1");

/* ---------------------------------------------------- Слабые темы --- */
const themen = [
  { id: "algo", teil: "GA2", ru: "Алгоритмы" }, { id: "oop", teil: "GA1+GA2", ru: "ООП" },
  { id: "vorgehen", teil: "GA1", ru: "Модели" }, { id: "wiso-entgelt", teil: "WiSo", ru: "Зарплата" },
  { id: "tests", teil: "GA1+GA2", ru: "Тесты" }
];
const training = [
  { id: "ga1-db", bereich: "GA1", name: "БД", lern: ["normalisierung", "integritaet"] },
  { id: "ga2-db", bereich: "GA2", name: "Модель данных", lern: ["normalisierung", "integritaet"] },
  { id: "ga2-sql", bereich: "GA2", name: "SQL", lern: ["sql"] },
  { id: "ga2-algo", bereich: "GA2", name: "Алгоритмы", lern: ["algo"] }
];
assert.deepStrictEqual(N.teileVonThema("oop", themen, training).sort(), ["ga1", "ga2"]);
assert.deepStrictEqual(N.teileVonThema("sql", themen, training), ["ga2"]);
assert.deepStrictEqual(N.teileVonThema("normalisierung", themen, training).sort(), ["ga1", "ga2"]);
assert.deepStrictEqual(N.teileVonThema("wiso-arbeitsrecht", themen, training), ["wiso"], "WiSo по префиксу, даже без темы");
assert.deepStrictEqual(N.teileVonThema("ga1", themen, training), [], "целый бланк — не тема");
assert.deepStrictEqual(N.teileVonThema("unbekannt", themen, training), []);

const summary = [
  { topic: "algo", weak: 2, selfWeak: 0, latestIndependentRatio: 0.4 },
  { topic: "oop", weak: 1, selfWeak: 1, latestIndependentRatio: 0.2 },
  { topic: "sql", weak: 0, selfWeak: 3, latestIndependentRatio: null, ratio: 0.5 },
  { topic: "tests", weak: 0, selfWeak: 0, latestIndependentRatio: 0.1 },            /* без ошибок — нет */
  { topic: "normalisierung", weak: 4, selfWeak: 0, latestIndependentRatio: 0.6 },
  { topic: "vorgehen", weak: 1, selfWeak: 0, latestIndependentRatio: 0 },
  { topic: "wiso-entgelt", weak: 1, selfWeak: 0, latestIndependentRatio: 0.3 },
  { topic: "ga2", weak: 5, selfWeak: 0, latestIndependentRatio: 0 }
];
const ga2 = N.schwacheThemen("ga2", summary, themen, training);
assert.deepStrictEqual(ga2.map(x => x.topic), ["oop", "algo", "sql"], "максимум 3, слабейшие первыми, без «ga2» и без тем без ошибок");
assert.strictEqual(ga2[0].quiz, "oop");
assert.strictEqual(ga2[1].training, "ga2-algo");
assert.strictEqual(ga2[2].quiz, null, "у SQL нет темы квиза");
assert.strictEqual(ga2[2].training, "ga2-sql");
assert.strictEqual(ga2[2].fehler, 3);
const ga1 = N.schwacheThemen("ga1", summary, themen, training);
assert.deepStrictEqual(ga1.map(x => x.topic), ["vorgehen", "oop", "normalisierung"], "GA1+GA2 есть и в GA1");
assert.strictEqual(ga1[2].training, "ga1-db", "кнопка ведёт в задания своей части");
assert.deepStrictEqual(N.schwacheThemen("wiso", summary, themen, training).map(x => x.topic), ["wiso-entgelt"]);
assert.deepStrictEqual(N.schwacheThemen("ga1", [], themen, training), []);
assert.deepStrictEqual(N.schwacheThemen("ga1", null, null, null), []);

/* ---------------------------------------------------- Пробный экзамен --- */
const E = [
  { id: "ga2-2023-s", bereich: "ga2", g: "neu", r: 1 },
  { id: "ga2-2025-s", bereich: "ga2", g: "neu", r: 0 },
  { id: "ga2-2024-s", bereich: "ga2", g: "neu", r: 0 },
  { id: "ga2-2022-s", bereich: "ga2", g: "gemacht", r: 0 },
  { id: "ga1-2025-s", bereich: "ga1", g: "weiter", r: 0 }
];
assert.strictEqual(N.naechsteProbe("ga2", E).id, "ga2-2025-s", "новый, решения ZPA, самый свежий");
assert.strictEqual(N.naechsteProbe("ga2", E.concat([{ id: "ga2-2021-w", bereich: "ga2", g: "weiter", r: 2 }])).id, "ga2-2021-w", "начатый — первым");
assert.strictEqual(N.naechsteProbe("ga1", E).id, "ga1-2025-s");
assert.strictEqual(N.naechsteProbe("wiso", E), null);
assert.strictEqual(N.naechsteProbe("ga1", null), null);

/* ---------------------------------------------------- Пусто --- */
const leer = N.stand({ module: [] });
assert.deepStrictEqual(leer.werte, { ga1: null, ga2: null, wiso: null });
assert.strictEqual(leer.zuerst, "ga1");
assert.strictEqual(leer.regel.status, "offen");
assert.deepStrictEqual(N.ergebnisse(null, zustandVon), { ga1: [], ga2: [], wiso: [] });

console.log("niveau: ok");
