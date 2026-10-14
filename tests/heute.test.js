"use strict";
/* Карточка «Сегодня» (gen/heute.js): чистые функции.  node tests/heute.test.js */
process.env.TZ = "Europe/Berlin";
const assert = require("assert");
const H = require("../gen/heute.js");

/* ---------------------------------------------------------- Этапы --- */
const et = ymd => H.etappe(ymd);
assert.strictEqual(et("2026-10-10").nr, 1);
assert.strictEqual(et("2026-10-10").titel, "Этап 1 из 3: основы и частые темы");
assert.strictEqual(et("2027-01-31").nr, 1, "31.01. ещё этап 1");
assert.strictEqual(et("2027-02-01").nr, 2, "01.02. уже этап 2");
assert.strictEqual(et("2027-02-01").titel, "Этап 2 из 3: раз в неделю пробный экзамен (Übung)");
assert.strictEqual(et("2027-03-31").nr, 2, "31.03. ещё этап 2");
assert.strictEqual(et("2027-04-01").nr, 3, "01.04. этап 3");
assert.strictEqual(et("2027-04-01").titel, "Этап 3 из 3: режим Prüfung 90 минут и повтор ошибок");
assert.strictEqual(et("2027-04-28").nr, 3, "день экзамена — этап 3");
assert.strictEqual(et("2027-04-28").restText, "экзамен сегодня");
assert.strictEqual(et("2027-04-29").vorbei, true);
assert.strictEqual(et("2027-04-29").titel, "Экзамен позади");
assert.strictEqual(et("2027-04-29").restText, "");
assert.strictEqual(et("2027-04-27").restText, "остался 1 день");
assert.strictEqual(et("2027-04-26").restText, "осталось 2 дня");
assert.strictEqual(et("2027-04-23").restText, "осталось 5 дней");
assert.strictEqual(et("2027-04-07").restText, "остался 21 день");
assert.strictEqual(et("2027-04-17").restText, "осталось 11 дней");
assert.strictEqual(et("2026-10-10").rest, 200);
[1, 2, 3].forEach(n => assert.ok(H.ETAPPEN[n - 1].tipp.length > 10 && !/\n/.test(H.ETAPPEN[n - 1].tipp), "подсказка этапа " + n));

/* Берлинская дата: 31.01. 23:30 по Берлину = 22:30 UTC — ещё этап 1 */
assert.strictEqual(H.berlinTag(new Date(Date.UTC(2027, 0, 31, 22, 30))), "2027-01-31");
assert.strictEqual(H.berlinTag(new Date(Date.UTC(2027, 0, 31, 23, 30))), "2027-02-01", "после полуночи в Берлине");
assert.strictEqual(et(H.berlinTag(new Date(Date.UTC(2027, 0, 31, 22, 59)))).nr, 1);
assert.strictEqual(et(H.berlinTag(new Date(Date.UTC(2027, 0, 31, 23, 0)))).nr, 2);
/* Летнее время: 31.03. 23:30 CEST = 21:30 UTC */
assert.strictEqual(H.berlinTag(new Date(Date.UTC(2027, 2, 31, 21, 30))), "2027-03-31");
assert.strictEqual(H.berlinTag(new Date(Date.UTC(2027, 2, 31, 22, 0))), "2027-04-01");

/* ---------------------------------------------------------- Неделя --- */
const mo = new Date(2026, 9, 5, 9, 0);        /* Пн 05.10.2026 */
const so = new Date(2026, 9, 11, 22, 0);      /* Вс 11.10.2026 */
const sa = new Date(2026, 9, 10, 12, 0);      /* Сб 10.10.2026 */
const W = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"];
assert.deepStrictEqual(H.wochenTage(mo), W, "понедельник — первый день");
assert.deepStrictEqual(H.wochenTage(so), W, "воскресенье — последний день той же недели");
assert.deepStrictEqual(H.wochenTage(sa), W);
assert.deepStrictEqual(H.wochenTage(new Date(2026, 9, 12, 0, 0)).slice(0, 1), ["2026-10-12"], "новая неделя с понедельника 00:00");
/* Неделя через смену времени (25.10.2026) */
assert.deepStrictEqual(H.wochenTage(new Date(2026, 9, 26, 8)), ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]);
assert.deepStrictEqual(H.wochenTage(new Date(2026, 9, 25, 23)), ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]);

{
  const zeiten = [
    new Date(2026, 9, 5, 0, 0, 0).getTime(),        /* Пн 00:00 — эта неделя */
    new Date(2026, 9, 4, 23, 59, 59, 999).getTime(), /* Вс прошлой недели 23:59:59 — нет */
    new Date(2026, 9, 7, 13, 0).getTime(),          /* Ср */
    new Date(2026, 9, 7, 18, 0).getTime(),          /* Ср ещё раз — тот же день */
    "2026-10-10",                                    /* Сб: ключ из повторения ошибок */
    new Date(2026, 9, 11, 23, 59, 59, 999).getTime(),/* Вс 23:59:59 — эта неделя */
    new Date(2026, 9, 12, 0, 0, 0).getTime(),        /* Пн следующей недели — нет */
    null, 0, "", "abc", NaN
  ];
  const w = H.woche(zeiten, sa);
  assert.deepStrictEqual(w.tage.map(t => t.aktiv), [true, false, true, false, false, true, true]);
  assert.strictEqual(w.anzahl, 4);
  assert.deepStrictEqual(w.tage.map(t => t.wt), ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]);
  assert.deepStrictEqual(w.tage.map(t => t.heute), [false, false, false, false, false, true, false]);
  assert.deepStrictEqual(w.tage.map(t => t.zukunft), [false, false, false, false, false, false, true]);
  assert.strictEqual(H.woche([], so).anzahl, 0);
}

/* Сегодня — по локальной полуночи */
{
  const jetzt = new Date(2026, 9, 10, 0, 5);
  assert.strictEqual(H.heuteDa([new Date(2026, 9, 10, 0, 0).getTime()], jetzt), true, "00:00 — уже сегодня");
  assert.strictEqual(H.heuteDa([new Date(2026, 9, 9, 23, 59, 59).getTime()], jetzt), false, "23:59 вчера — не сегодня");
  assert.strictEqual(H.heuteDa(["2026-10-10"], jetzt), true);
  assert.strictEqual(H.heuteDa([], jetzt), false);
}

/* ---------------------------------------------------------- Шаги --- */
{
  const basis = { wieder: { faellig: 4, geschafft: 0 }, lern: { titel: "Читать задание" }, satz: true, exam: true };
  const s10 = H.schritte(Object.assign({ minuten: 10 }, basis));
  assert.deepStrictEqual(s10.liste.map(x => x.key), ["wieder", "satz"], "10 минут: только повтор и вопросы");
  const s20 = H.schritte(Object.assign({ minuten: 20 }, basis));
  assert.deepStrictEqual(s20.liste.map(x => x.key), ["wieder", "lern", "satz"]);
  const s40 = H.schritte(Object.assign({ minuten: 40 }, basis));
  assert.deepStrictEqual(s40.liste.map(x => x.key), ["wieder", "lern", "satz", "exam"], "40 минут: плюс задание из экзамена");
  assert.strictEqual(H.schritte(Object.assign({ minuten: 99 }, basis)).minuten, 20, "неизвестное время → 20");
  assert.strictEqual(H.schritte(Object.assign({}, basis)).minuten, 20, "без профиля → 20");
  assert.strictEqual(H.schritte(Object.assign({ minuten: "40" }, basis)).gesamt, 4);
  assert.strictEqual(s20.liste[0].titel, "Повторить ошибки (4)");
  assert.strictEqual(s20.liste[0].fertig, false);
  assert.strictEqual(s20.liste[0].knopf, "Начать");
  assert.strictEqual(s20.liste[1].titel, "Читать задание");
  assert.strictEqual(s20.fertig, 0);
  assert.strictEqual(s20.gesamt, 3);

  /* повтор: сделано, если сегодня повторяла или повторять нечего */
  const w1 = H.schritte({ minuten: 10, wieder: { faellig: 4, geschafft: 2 } }).liste[0];
  assert.strictEqual(w1.fertig, true); assert.strictEqual(w1.knopf, "Начать");
  const w2 = H.schritte({ minuten: 10, wieder: { faellig: 0, geschafft: 0 } }).liste[0];
  assert.strictEqual(w2.fertig, true); assert.strictEqual(w2.knopf, null); assert.strictEqual(w2.titel, "Ошибок к повтору нет");
  const w3 = H.schritte({ minuten: 10, wieder: { faellig: 0, geschafft: 7 } }).liste[0];
  assert.strictEqual(w3.titel, "Ошибки повторены"); assert.strictEqual(w3.fertig, true);

  const lf = H.schritte({ minuten: 20, lern: { titel: "Читать код" }, lernFertig: true }).liste[0];
  assert.strictEqual(lf.titel, "Занятие сделано"); assert.strictEqual(lf.unter, "дальше: Читать код"); assert.strictEqual(lf.fertig, true);

  const alle = H.schritte({ minuten: 40, wieder: { faellig: 0, geschafft: 3 }, lern: { titel: "x" }, lernFertig: true, satz: true, satzFertig: true, exam: true, examFertig: false });
  assert.strictEqual(alle.fertig, 3); assert.strictEqual(alle.gesamt, 4);

  /* нет модулей — строки пропускаются */
  const leer = H.schritte({ minuten: 40 });
  assert.strictEqual(leer.gesamt, 0);
  assert.deepStrictEqual(H.schritte({ minuten: 20, satz: true }).liste.map(x => x.key), ["satz"]);
}

/* ---------------------------------------------------- Сбор времени --- */
{
  const heute = new Date(2026, 9, 10, 15, 0).getTime(), gestern = heute - 864e5;
  const z = H.zeitenSammeln({
    lernstand: [{ t: heute, source: "praxis" }, { t: gestern, source: "quiz" }, { t: heute, source: "azubi" }, { source: "lernweg" }, null],
    lernweg: { done: { a: gestern, b: 0 }, history: [{ time: gestern }, {}] },
    satz: { s01: { t: heute }, s02: { versuche: 1 } },
    azubi: [gestern, 0],
    wieder: { "2026-10-08": 3, "2026-10-07": 0 }
  });
  assert.deepStrictEqual(z.lern, [heute, gestern, gestern]);
  assert.deepStrictEqual(z.satz, [heute]);
  assert.deepStrictEqual(z.exam, [heute, gestern]);
  assert.deepStrictEqual(z.wieder, ["2026-10-08"]);
  assert.strictEqual(z.alle.length, 3 + 2 + 1 + 1 + 1);
  ["lernweg", "praxis", "code", "normal", "operatoren"].forEach(q =>
    assert.strictEqual(H.zeitenSammeln({ lernstand: [{ t: heute, source: q }] }).lern.length, 1, q));
  assert.strictEqual(H.zeitenSammeln({ lernstand: [{ t: heute, source: "quiz" }] }).lern.length, 0);
  assert.deepStrictEqual(H.zeitenSammeln(), { alle: [], lern: [], satz: [], exam: [], wieder: [] });
  assert.deepStrictEqual(H.zeitenSammeln({ lernstand: "kaputt", lernweg: { history: "x" }, satz: "x" }).alle, []);
}

/* ---------------------------------------------------------- Профиль --- */
assert.deepStrictEqual(H.profil({ minutes: 10, days: 5 }), { minuten: 10, tage: 5 });
assert.deepStrictEqual(H.profil(null), { minuten: 20, tage: 4 });
assert.deepStrictEqual(H.profil({ minutes: 15, days: 0 }), { minuten: 20, tage: 4 });
assert.deepStrictEqual(H.profil({ minutes: "40", days: "3" }), { minuten: 40, tage: 3 });

/* ------------------------------------------------- Резервная копия --- */
{
  const jetzt = new Date(2026, 9, 10, 12, 0).getTime();
  const vor = n => new Date(2026, 9, 10 - n, 20, 0).getTime();
  assert.deepStrictEqual(H.sicherung({ letzte: null, jetzt, fortschritt: false }), { zeigen: false, warn: false, tage: null, text: "" }, "нечего терять — молчим");
  const nie = H.sicherung({ letzte: null, jetzt, fortschritt: true });
  assert.strictEqual(nie.warn, true); assert.strictEqual(nie.text, "Резервная копия: ещё не делала");
  const s7 = H.sicherung({ letzte: vor(7), jetzt, fortschritt: true });
  assert.strictEqual(s7.tage, 7); assert.strictEqual(s7.warn, false, "7 дней — ещё нормально");
  assert.strictEqual(s7.text, "Резервная копия: 7 дней назад");
  const s8 = H.sicherung({ letzte: vor(8), jetzt, fortschritt: true });
  assert.strictEqual(s8.warn, true, "8 дней — пора");
  assert.strictEqual(s8.text, "Резервная копия: последняя 8 дней назад");
  assert.strictEqual(H.sicherung({ letzte: vor(2), jetzt, fortschritt: true }).text, "Резервная копия: 2 дня назад");
  assert.strictEqual(H.sicherung({ letzte: vor(1), jetzt, fortschritt: true }).text, "Резервная копия: вчера");
  assert.strictEqual(H.sicherung({ letzte: jetzt - 1000, jetzt, fortschritt: true }).text, "Резервная копия: сегодня");
  assert.strictEqual(H.sicherung({ letzte: vor(21), jetzt, fortschritt: true }).text, "Резервная копия: последняя 21 день назад");
  assert.strictEqual(H.sicherung({ letzte: vor(30), jetzt, fortschritt: false }).warn, false, "без прогресса не пугаем");
  assert.strictEqual(H.sicherung({ letzte: vor(30), jetzt, fortschritt: false }).zeigen, true);
  /* полночь: вчера 23:59 → «вчера», хотя прошло 2 минуты */
  assert.strictEqual(H.tageZwischen(new Date(2026, 9, 9, 23, 59).getTime(), new Date(2026, 9, 10, 0, 1).getTime()), 1);
  assert.strictEqual(H.tageZwischen(new Date(2026, 9, 11).getTime(), new Date(2026, 9, 10).getTime()), 0, "будущее → 0");
  assert.strictEqual(H.sicherungNoetig({ letzte: null, jetzt, fortschritt: true }), true);
  assert.strictEqual(H.sicherungNoetig({ letzte: vor(3), jetzt, fortschritt: true }), false);
}

/* ------------------------------------------------- Есть ли прогресс --- */
assert.strictEqual(H.hatFortschritt({}), false);
assert.strictEqual(H.hatFortschritt({ "ap2:auth": "1", "ap2:theme": "\"dunkel\"", "ap2:start:offen": "[\"satz\"]", "ap2:azubi:ui": "{\"x\":1}",
  "ap2:satz:ein": "{\"anzahl\":6}", "ap2:heute:ui": "{\"sicherung\":{\"zeit\":1}}", "ap2-sync:meta": "{\"a\":1}" }), false, "настройки — не прогресс");
assert.strictEqual(H.hatFortschritt({ "ap2:wieder": "{\"k\":{},\"tage\":{}}", "ap2:lernstand": "[]", "ap2:answers": "{}" }), false, "пустые структуры");
assert.strictEqual(H.hatFortschritt({ "ap2:lernstand": "[{\"t\":1}]" }), true);
assert.strictEqual(H.hatFortschritt({ "ap2:gen:satz": "{\"s01\":{\"t\":5}}" }), true);
assert.strictEqual(H.hatFortschritt({ "ap2:notizen": "Text" }), true, "не JSON, но с текстом");

/* ------------------------------------------------------- Склонения --- */
assert.strictEqual(H.plural(1, ["день", "дня", "дней"]), "день");
assert.strictEqual(H.plural(4, ["день", "дня", "дней"]), "дня");
assert.strictEqual(H.plural(11, ["день", "дня", "дней"]), "дней");
assert.strictEqual(H.plural(22, ["день", "дня", "дней"]), "дня");
assert.strictEqual(H.plural(112, ["день", "дня", "дней"]), "дней");

console.log("heute: ok");
