"use strict";
/* Нормализация: данные сценариев, проверка шагов, сохранение и журнал. */
const assert = require("assert");
const fs = require("fs"), path = require("path"), vm = require("vm");
const DATA = require("../gen/normal-daten.js");
const N = require("../gen/normal.js");
const gleich = (a, b) => a.length === b.length && a.every(x => b.includes(x));

/* ---------- 1. Данные сценариев полны и согласованы ---------- */
assert(DATA.length >= 4, "минимум 4 сценария");
assert.strictEqual(new Set(DATA.map(s => s.id)).size, DATA.length, "id сценариев уникальны");
DATA.forEach(sz => {
  const id = sz.id, sp1 = sz.nf1.spalten, key = sz.schluessel;
  /* Исходная таблица: 4–6 строк, повторяющиеся группы согласованы с 1NF */
  assert(sz.ausgang.zeilen.length >= 4 && sz.ausgang.zeilen.length <= 6, id + ": 4–6 строк примера");
  sz.ausgang.zeilen.forEach(z => assert.strictEqual(z.length, sz.ausgang.spalten.length, id + ": ширина строки"));
  sz.ausgang.spalten.forEach((c, i) => {
    const arr = sz.ausgang.zeilen.map(z => Array.isArray(z[i]));
    assert(arr.every(Boolean) || !arr.some(Boolean), id + ": столбец " + c + " — либо всегда группа, либо никогда");
  });
  assert(sz.ausgang.zeilen.some(z => z.some(v => Array.isArray(v) && v.length > 1)), id + ": есть повторяющаяся группа");
  const n1 = sz.ausgang.zeilen.reduce((s, z) => s + Math.max(1, ...z.map(v => Array.isArray(v) ? v.length : 1)), 0);
  assert.strictEqual(sz.nf1.zeilen.length, n1, id + ": строк 1NF = сумма значений в группах");
  sz.ausgang.zeilen.forEach(z => { const l = z.filter(Array.isArray).map(v => v.length); assert(l.every(x => x === l[0]), id + ": группы в строке одной длины"); });
  const ausSpalten = sz.ausgang.spalten.flatMap(c => (sz.zerlegung || {})[c] || [c]);
  assert(gleich(ausSpalten, sp1), id + ": разбиение исходных столбцов даёт столбцы 1NF");
  assert(N.nf1Richtig(sz).length >= 2 && N.nf1Richtig(sz).length < sz.ausgang.spalten.length, id + ": есть и атомарные, и неатомарные столбцы");
  sz.nf1.zeilen.forEach(z => z.forEach(v => assert(typeof v === "string" && v && !Array.isArray(v), id + ": 1NF атомарна")));

  /* Ключ и функциональные зависимости */
  assert(key.length >= 2 && key.every(k => sp1.includes(k)), id + ": составной ключ из столбцов 1NF");
  key.forEach(k => { assert(!sz.abh[k], id + ": у ключевого " + k + " нет детерминанты"); assert(sz.schluesselWarum[k], id + ": объяснение для " + k); });
  sp1.filter(c => !key.includes(c)).forEach(a => {
    const x = sz.abh[a];
    assert(x && Array.isArray(x.von) && x.von.length && x.warum, id + ": неключевой " + a + " имеет зависимость и объяснение");
    assert(x.von.every(v => sp1.includes(v) && v !== a), id + ": детерминанта " + a + " из столбцов 1NF");
    assert(N.huelle(sz, key).has(a), id + ": ключ определяет " + a);
  });
  Object.keys(sz.abh).forEach(a => assert(sp1.includes(a) && !key.includes(a), id + ": лишняя зависимость " + a));
  const uniq = new Set(sz.nf1.zeilen.map(z => key.map(k => z[sp1.indexOf(k)]).join("|")));
  assert.strictEqual(uniq.size, sz.nf1.zeilen.length, id + ": ключ уникален в примерах");
  key.forEach(k => { const rest = key.filter(x => x !== k), u = new Set(sz.nf1.zeilen.map(z => rest.map(r => z[sp1.indexOf(r)]).join("|"))); assert(u.size < sz.nf1.zeilen.length, id + ": без " + k + " ключ не уникален (ключ минимален)"); });
  Object.entries(sz.abh).forEach(([a, x]) => {
    const m = new Map();
    sz.nf1.zeilen.forEach(z => { const k = x.von.map(v => z[sp1.indexOf(v)]).join("|"), w = z[sp1.indexOf(a)]; if (m.has(k)) assert.strictEqual(m.get(k), w, id + ": зависимость " + x.von + " → " + a + " выполняется в примерах"); m.set(k, w); });
  });
  /* 2NF-ответ однозначен и имеет контрпример в данных для «целого ключа» */
  sp1.filter(c => !key.includes(c)).forEach(a => {
    const z = N.nf2Ziel(sz, a); assert(z, id + ": " + a + " зависит от ключа");
    if (z === "ganz") key.forEach(k => { const rest = key.filter(x => x !== k); assert(N.gegenbeispiel(sz, rest, a), id + ": контрпример, что " + a + " не зависит от " + rest); });
    else { const teil = z.split("+"); const gleiche = key.filter(k => !teil.includes(k)).map(k => [k]).filter(s => N.huelle(sz, s).has(a)); assert.strictEqual(gleiche.length, 0, id + ": " + a + " однозначно зависит от " + z); }
  });

  /* Эталон 2NF: нет частичных зависимостей, всё покрыто, детерминанты внутри таблицы */
  const sp2 = new Set(sz.nf2.flatMap(t => t.spalten));
  assert(gleich(Array.from(sp2), sp1), id + ": 2NF покрывает все столбцы 1NF");
  sz.nf2.forEach(t => {
    assert(t.pk.length && t.pk.every(c => t.spalten.includes(c)), id + ": PK внутри " + t.name);
    t.spalten.filter(c => !t.pk.includes(c)).forEach(a => {
      const minimal = [];
      for (let m = 1; m < (1 << t.pk.length); m++) { const s = t.pk.filter((_, i) => m & (1 << i)); if (N.huelle(sz, s).has(a)) minimal.push(s); }
      assert(minimal.length && minimal.every(s => s.length === t.pk.length), id + ": в 2NF-таблице " + t.name + " атрибут " + a + " зависит от всего PK");
      assert(sz.abh[a].von.every(v => t.spalten.includes(v)), id + ": детерминанта " + a + " в таблице " + t.name);
      const z = N.nf2Ziel(sz, a);
      assert(gleich(z === "ganz" ? key : z.split("+"), t.pk), id + ": " + a + " лежит в таблице со своей частью ключа");
    });
  });
  N.nf3Punkte(sz).forEach(p => { if (p.richtig !== "direkt") { const x = p.richtig.slice(6); assert(p.tab.spalten.includes(x) && !p.tab.pk.includes(x), id + ": транзитивная детерминанта " + x + " — неключевой атрибут"); } });
  assert(N.nf3Punkte(sz).some(p => p.richtig !== "direkt"), id + ": есть транзитивная зависимость");

  /* Эталон 3NF: каждый неключевой атрибут зависит ровно от PK своей таблицы */
  const names = sz.nf3.map(t => t.name);
  assert.strictEqual(new Set(names).size, names.length, id + ": имена таблиц уникальны");
  assert(gleich(Array.from(new Set(sz.nf3.flatMap(t => t.spalten))), sp1), id + ": 3NF покрывает все столбцы 1NF");
  sp1.filter(c => !key.includes(c)).forEach(a => {
    const tabs = sz.nf3.filter(t => t.spalten.includes(a) && !t.pk.includes(a));
    assert(tabs.length <= 1, id + ": " + a + " как неключевой только в одной таблице");
  });
  sz.nf3.forEach(t => {
    assert(t.pk.length && t.pk.every(c => t.spalten.includes(c)), id + ": PK внутри " + t.name);
    t.spalten.filter(c => !t.pk.includes(c)).forEach(a => {
      if (!sz.abh[a]) { assert(t.fk[a], id + ": ключевой атрибут " + a + " вне PK должен быть FK"); return; }
      assert(gleich(sz.abh[a].von, t.pk), id + ": 3NF " + t.name + "." + a + " без частичной/транзитивной зависимости");
    });
    Object.entries(t.fk).forEach(([c, ziel]) => {
      const z = sz.nf3.find(x => x.name === ziel);
      assert(t.spalten.includes(c), id + ": FK " + c + " есть в " + t.name);
      assert(z, id + ": FK " + t.name + "." + c + " → существующая таблица " + ziel);
      assert(gleich(z.pk, [c]), id + ": FK " + t.name + "." + c + " ссылается на PK " + ziel);
      assert(sz.beziehungen.some(b => (b.a === t.name && b.b === ziel) || (b.a === ziel && b.b === t.name)), id + ": у FK " + t.name + "." + c + " есть связь");
    });
  });
  sz.nf2.forEach(t => Object.entries(t.fk).forEach(([c, ziel]) => { const z = sz.nf2.find(x => x.name === ziel); assert(z && gleich(z.pk, [c]), id + ": 2NF-FK " + t.name + "." + c); }));
  /* Связи: кардинальности соответствуют FK */
  assert(sz.beziehungen.some(b => b.art === "n:m" && b.ueber), id + ": есть n:m через таблицу-связку");
  sz.beziehungen.forEach(b => {
    const A = sz.nf3.find(t => t.name === b.a), B = sz.nf3.find(t => t.name === b.b);
    assert(A && B && b.de, id + ": связь " + b.a + "–" + b.b + " между существующими таблицами");
    if (b.art === "1:n") assert(Object.values(B.fk).includes(A.name), id + ": 1:n — FK в " + B.name);
    else if (b.art === "n:1") assert(Object.values(A.fk).includes(B.name), id + ": n:1 — FK в " + A.name);
    else if (b.art === "n:m") { const U = sz.nf3.find(t => t.name === b.ueber); assert(U && Object.values(U.fk).includes(A.name) && Object.values(U.fk).includes(B.name), id + ": n:m через " + b.ueber); }
    else assert.fail(id + ": неизвестная кардинальность " + b.art);
  });
  /* Аномалии: три разных типа */
  assert.strictEqual(sz.anomalien.length, 3, id + ": три аномалии");
  assert(gleich(sz.anomalien.map(x => x.typ), ["einfuege", "loesch", "aenderung"]), id + ": все три типа");
  sz.anomalien.forEach(x => assert(x.text && x.erkl && x.de, id + ": тексты аномалии"));
  /* Образцы немецких предложений есть для 1NF, ключа, 2NF, 3NF */
  ["nf1", "schluessel", "nf2", "nf3"].forEach(s => assert(N.satz(sz, s).length === 1, id + ": образец для " + s));
});

/* ---------- 2. Проверка ответов: верно, частично, неверно ---------- */
const kurs = DATA.find(s => s.id === "kurs"), werk = DATA.find(s => s.id === "werkstatt"), term = DATA.find(s => s.id === "termine");
DATA.forEach(sz => N.SCHRITTE.forEach(s => {
  const r = N.pruefen(sz, s.id, N.loesung(sz, s.id));
  assert(r.voll && r.correct === r.max && r.max > 0, sz.id + ":" + s.id + " эталон полностью верен");
  const leer = N.pruefen(sz, s.id, {});
  /* В модели «нет FK» у таблицы без внешних ключей — верный ответ и при пустом выборе. */
  const frei = s.id === "modell" ? sz.nf3.filter(t => !Object.keys(t.fk).length).length : 0;
  assert(!leer.voll && leer.correct === frei, sz.id + ":" + s.id + " пустой ответ — 0 баллов (кроме «нет FK»)");
}));
// Шаг 0: две верные, одна неверная
let r = N.pruefen(kurs, "anomalie", { 0: "aenderung", 1: "einfuege", 2: "einfuege" });
assert.deepStrictEqual([r.correct, r.max, r.voll], [2, 3, false]);
assert.match(r.items[2].erkl, /не Einfügeanomalie.*Löschanomalie/);
r = N.pruefen(kurs, "anomalie", { 0: "loesch", 1: "aenderung", 2: "einfuege" });
assert.strictEqual(r.correct, 0, "все неверно");
// Шаг 1: нашла не все столбцы → частично; лишняя отметка → без бонуса
assert.deepStrictEqual(N.nf1Richtig(kurs), ["Wohnort", "Kurse", "Preis", "Anmeldedatum"]);
r = N.pruefen(kurs, "nf1", { Kurse: true, Preis: true });
assert.deepStrictEqual([r.correct, r.max], [3, 5], "2 найдены + бонус за отсутствие лишних");
assert.match(r.items.find(x => x.key === "Wohnort").erkl, /не атомарно.*PLZ, Ort/);
r = N.pruefen(kurs, "nf1", { Wohnort: true, Kurse: true, Preis: true, Anmeldedatum: true, Name: true });
assert.deepStrictEqual([r.correct, r.max, r.voll], [4, 5, false], "лишняя отметка Name");
assert.match(r.items.find(x => x.key === "Name").erkl, /атомарно/);
assert.match(N.pruefen(kurs, "nf1", { Kurse: true }).items.find(x => x.key === "Kurse").erkl, /Wiederholungsgruppe.*KursNr, Kurstitel/);
// Шаг 2: ключ
r = N.pruefen(kurs, "schluessel", { TeilnehmerNr: true });
assert.deepStrictEqual([r.correct, r.max], [2, 3], "часть ключа найдена");
assert(r.hinweise.some(h => /строки 1 и 2 одинаковы \(TeilnehmerNr = 101\)/.test(h)), "контрпример уникальности");
assert.match(r.items.find(x => x.key === "KursNr").erkl, /Не хватает KursNr/);
r = N.pruefen(kurs, "schluessel", { TeilnehmerNr: true, KursNr: true, Name: true });
assert.deepStrictEqual([r.correct, r.max], [2, 3], "лишний столбец в ключе");
assert.match(r.items.find(x => x.key === "Name").erkl, /не нужен в ключе: он уже определяется TeilnehmerNr/);
r = N.pruefen(kurs, "schluessel", { Anmeldedatum: true });
assert.strictEqual(r.correct, 0);
assert.match(r.items.find(x => x.key === "Anmeldedatum").erkl, /данные записи/);
// Шаг 3: 2NF
assert.strictEqual(N.nf2Ziel(kurs, "Ort"), "TeilnehmerNr", "Ort через PLZ зависит от части ключа");
assert.strictEqual(N.nf2Ziel(kurs, "Anmeldedatum"), "ganz");
assert.strictEqual(N.nf2Ziel(term, "Arztname"), "ganz", "транзитивно через ArztNr, но от всего ключа");
r = N.pruefen(kurs, "nf2", Object.assign(N.loesung(kurs, "nf2"), { Kurstitel: "ganz", Anmeldedatum: "KursNr" }));
assert.deepStrictEqual([r.correct, r.max], [4, 6], "две ошибки из шести");
assert.match(r.items.find(x => x.key === "Kurstitel").erkl, /только от KursNr — это частичная зависимость.*K12.*Excel Grundlagen.*3 раза — Redundanz/);
assert.match(r.items.find(x => x.key === "Anmeldedatum").erkl, /от всего ключа.*При KursNr = K12 встречаются разные Anmeldedatum/);
assert.match(N.pruefen(kurs, "nf2", { Ort: "ganz" }).items.find(x => x.key === "Ort").erkl, /Цепочка: TeilnehmerNr → PLZ → Ort/);
assert.match(N.pruefen(term, "nf2", { Arztname: "PatientNr" }).items.find(x => x.key === "Arztname").erkl, /транзитивная зависимость — её уберём на шаге 3NF/);
// Шаг 4: 3NF
r = N.pruefen(werk, "nf3", Object.assign(N.loesung(werk, "nf3"), { "Auftrag.Name": "ueber:Kennzeichen", "Auftrag.Datum": "ueber:KundenNr" }));
assert.strictEqual(r.correct, r.max - 2, "3NF частично");
assert.match(r.items.find(x => x.key === "Auftrag.Name").erkl, /Почти: через Kennzeichen.*Kennzeichen → KundenNr → Name/);
assert.match(r.items.find(x => x.key === "Auftrag.Datum").erkl, /Из KundenNr нельзя вывести Datum: при KundenNr = K7 разные значения/);
r = N.pruefen(kurs, "nf3", { "Teilnehmer.Ort": "direkt" });
assert.match(r.items.find(x => x.key === "Teilnehmer.Ort").erkl, /TeilnehmerNr → PLZ → Ort.*transitive Abhängigkeit/);
assert(!N.nf3Punkte(kurs).some(p => p.tab.name === "Anmeldung"), "таблица с одним неключевым атрибутом без вопросов");
// Шаг 5: модель
const lm = N.loesung(term, "modell");
delete lm["fk:Termin:ArztNr"]; lm["pk:Termin:ArztNr"] = true; lm["rel:2"] = "1:n";
r = N.pruefen(term, "modell", lm);
assert.deepStrictEqual([r.correct, r.max], [r.max - 3, 9], "модель: PK, FK и связь неверны");
assert.match(r.items.find(x => x.key === "pk:Termin").erkl, /ArztNr не нужен в PK/);
assert.match(r.items.find(x => x.key === "fk:Termin").erkl, /Не отмечен FK ArztNr/);
assert.match(r.items.find(x => x.key === "rel:2").erkl, /таблица-связка Termin/);
assert.match(N.pruefen(kurs, "modell", { "fk:Kurs:KursNr": true }).items.find(x => x.key === "fk:Kurs").erkl, /первичный ключ этой таблицы/);
assert.deepStrictEqual(N.notation(kurs)[0], "Teilnehmer(TeilnehmerNr [PK], Name, PLZ [FK])");
assert.strictEqual(N.beziehungText(kurs.beziehungen[3]), "Teilnehmer n : m Kurs (über Anmeldung)");
assert.strictEqual(N.satz(kurs, "nf2")[0][0], "Die Tabelle ist nicht in der 2. NF, weil Name nur von TeilnehmerNr abhängt (partielle Abhängigkeit).");
assert.strictEqual(N.satz(kurs, "nf3")[0][0], "Die Tabelle Teilnehmer ist nicht in der 3. NF, weil Ort von PLZ abhängt und PLZ kein Schlüssel ist (transitive Abhängigkeit).");
assert.deepStrictEqual(N.projektion(kurs, ["PLZ", "Ort"]).length, 3, "проекция без повторов");
assert.throws(() => N.pruefen(kurs, "nf9", {}), /Неизвестный шаг/);

/* ---------- 3. Сохранение, перезагрузка, журнал ---------- */
const memory = {}, events = [];
let now = 1000, failStorage = false, failRecord = false;
function laden() {
  const root = { Date: class extends Date { static now() { return now; } }, Math, JSON, console,
    localStorage: { getItem: k => (k in memory ? memory[k] : null), setItem: (k, v) => { if (failStorage) throw new Error("Quota"); memory[k] = v; } },
    GENLERNSTAND: { record: e => { events.push(JSON.parse(JSON.stringify(e))); return failRecord ? { ok: false, event: e, error: "voll" } : { ok: true, event: e }; } } };
  root.globalThis = root; vm.createContext(root);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../gen/normal-daten.js"), "utf8"), root);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../gen/normal.js"), "utf8"), root);
  return root.GENNORMAL;
}
let G = laden();
assert.strictEqual(G.liste().length, DATA.length);
assert.strictEqual(G.status("kurs", "nf2"), "offen");
assert.strictEqual(G.pruefenSpeichern("kurs", "nf2"), null, "пустой шаг не проверяется и не пишется в журнал");
assert.strictEqual(events.length, 0);
G.setzen("kurs", "nf2", "Name", "TeilnehmerNr");
G.setzen("kurs", "nf2", "Ort", "ganz");
G.setzen("kurs", "nf2", "Preis", "KursNr");
G.aktivSetzen("kurs", 3);
G = laden();
assert.deepStrictEqual(Object.assign({}, G.antworten("kurs", "nf2")), { Name: "TeilnehmerNr", Ort: "ganz", Preis: "KursNr" }, "черновик переживает перезагрузку");
assert.strictEqual(G.stand().sz.kurs.schritt, 3, "активный шаг сохранён");
assert.strictEqual(G.status("kurs", "nf2"), "begonnen");
// Первая проверка — частично, самостоятельно
now = 2000;
r = G.pruefenSpeichern("kurs", "nf2");
assert.deepStrictEqual([r.correct, r.max, r.support, r.neu], [2, 6, "selbst", true]);
assert.strictEqual(events.length, 1);
const e1 = events[0];
assert.deepStrictEqual([e1.topic, e1.source, e1.task, e1.kind, e1.support, e1.correct, e1.max], ["normalisierung", "normal", "kurs:nf2", "recognition", "selbst", 2, 6]);
assert(/^normal:kurs:nf2:2000-/.test(e1.id) && e1.t === 2000 && e1.answers.Ort === "ganz");
// Двойное нажатие без изменений — без дубля
assert.strictEqual(G.pruefenSpeichern("kurs", "nf2").neu, false);
assert.strictEqual(events.length, 1, "повторная проверка тех же ответов не создаёт запись");
G = laden();
assert.strictEqual(G.status("kurs", "nf2"), "fehler", "результат проверки переживает перезагрузку");
assert.strictEqual(G.fortschritt("kurs").geprueft, 1);
// Исправление после объяснений — «hilfe»
Object.entries(N.loesung(kurs, "nf2")).forEach(([k, v]) => G.setzen("kurs", "nf2", k, v));
now = 3000; r = G.pruefenSpeichern("kurs", "nf2");
assert.deepStrictEqual([r.voll, r.support], [true, "hilfe"]);
assert.strictEqual(events[1].support, "hilfe");
assert.strictEqual(G.status("kurs", "nf2"), "ok-hilfe");
// Пройти заново → чистая попытка «selbst»
G.zuruecksetzen("kurs", "nf2");
assert.deepStrictEqual(Object.keys(G.antworten("kurs", "nf2")), []);
assert.strictEqual(G.status("kurs", "nf2"), "offen");
Object.entries(N.loesung(kurs, "nf2")).forEach(([k, v]) => G.setzen("kurs", "nf2", k, v));
now = 4000; r = G.pruefenSpeichern("kurs", "nf2");
assert.deepStrictEqual([r.voll, r.support], [true, "selbst"]);
assert.strictEqual(events[events.length - 1].familiar, true, "reset preserves familiarity");
assert.strictEqual(G.status("kurs", "nf2"), "ok");
// «Показать правильно» до проверки → support «loesung»
G.setzen("kurs", "nf3", "Teilnehmer.Name", "direkt");
assert.deepStrictEqual(Object.assign({}, G.zeigen("kurs", "nf3")), N.loesung(kurs, "nf3"));
assert.strictEqual(G.status("kurs", "nf3"), "gezeigt");
now = 5000; r = G.pruefenSpeichern("kurs", "nf3");
assert.strictEqual(r.support, "loesung");
assert.strictEqual(events[events.length - 1].support, "loesung");
assert.strictEqual(events[events.length - 1].task, "kurs:nf3");
G = laden();
assert.strictEqual(G.stand().sz.kurs.s.nf3.loesung, true, "открытое решение запомнено");
// Late steps expose previous answers and preserve imported conflicts on reset.
G.aktivSetzen("werkstatt", 5);
G.setzen("werkstatt", "nf2", "Name", "ganz");
now = 5500;
assert.notStrictEqual(G.pruefenSpeichern("werkstatt", "nf2").support, "selbst");
let imported = JSON.parse(memory["ap2:normal"]);
imported.sz.kurs.s.nf2.konflikte = [{ a: { Name: "phone answer" }, t: 1 }];
imported.extra = true;
memory["ap2:normal"] = JSON.stringify(imported);
G = laden(); G.zuruecksetzen("kurs", "nf2");
assert.strictEqual(G.stand().sz.kurs.s.nf2.konflikte[0].a.Name, "phone answer");
assert(G.stand().sz.kurs.s.nf2.historie.length >= 2, "previous checks remain in local history");
assert.strictEqual(G.stand().extra, true);
assert.strictEqual(G.stand().sz.kurs.s.nf2.t, now);
assert(events.find(e => e.source === "normal").snapshot.question, "journal includes task context");
// Сбой журнала: событие ждёт и повторяется с тем же id
failRecord = true;
G.setzen("termine", "anomalie", "0", "einfuege");
now = 6000; G.pruefenSpeichern("termine", "anomalie");
assert.strictEqual(G.stand().offen.length, 1, "незаписанное событие сохранено");
const wartend = G.stand().offen[0].id;
failRecord = false; G = laden();
G.setzen("termine", "anomalie", "1", "loesch");
now = 7000; G.pruefenSpeichern("termine", "anomalie");
assert.strictEqual(G.stand().offen.length, 0, "очередь журнала опустела");
assert.strictEqual(events.filter(e => e.id === wartend).length, 2, "повтор с тем же id");
// Сбой записи в localStorage: ответ остаётся в памяти, сообщение понятно
const vorher = memory["ap2:normal"];
failStorage = true;
assert.strictEqual(G.setzen("werkstatt", "nf1", "Fahrzeug", true), false);
assert.match(G.fehler(), /Не удалось сохранить/);
assert.strictEqual(G.antworten("werkstatt", "nf1").Fahrzeug, true, "ответ не потерян");
assert.strictEqual(memory["ap2:normal"], vorher);
failStorage = false;
assert.strictEqual(G.setzen("werkstatt", "nf1", "Leistungen", true), true);
assert.strictEqual(G.fehler(), "");
G = laden();
assert.deepStrictEqual(Object.assign({}, G.antworten("werkstatt", "nf1")), { Fahrzeug: true, Leistungen: true }, "после восстановления сохранено всё");
// Сценарий заново
G.szZuruecksetzen("kurs");
assert.strictEqual(G.fortschritt("kurs").geprueft, 0);
assert.throws(() => G.setzen("gibt-es-nicht", "nf1", "x", true), /Неизвестный сценарий/);
assert.throws(() => G.setzen("kurs", "nf7", "x", true), /Неизвестный шаг/);
// Испорченное хранилище не перезаписывается
memory["ap2:normal"] = "{kaputt";
G = laden();
assert.match(G.fehler(), /не читается/);
G.setzen("kurs", "nf1", "Kurse", true);
assert.strictEqual(G.antworten("kurs", "nf1").Kurse, true, "можно работать в памяти");
assert.strictEqual(memory["ap2:normal"], "{kaputt", "испорченный оригинал не перезаписан");
memory["ap2:normal"] = JSON.stringify({ sz: [], offen: {} });
assert.match(laden().fehler(), /не читается/, "неверная структура распознаётся");
console.log("Normalisierung: Daten, Prüfung und Speicherung verifiziert");
