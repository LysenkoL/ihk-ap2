"use strict";
/* Тренажёр операторов (gen/operatoren-uebung.js).
   Фальшивый пакет ниже — авторские тексты, не IHK. */
const assert = require("assert");
const fs = require("fs"), path = require("path"), vm = require("vm");
const QUELLE = fs.readFileSync(path.join(__dirname, "../gen/operatoren-uebung.js"), "utf8");
const O = require("../gen/operatoren-uebung.js");

/* детерминированный генератор для повторяемых проверок */
function rngVon(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

/* ---------- 1. Каталог = regex/rang из gen/operatoren.js ---------- */
const ctxOp = { console, document: { readyState: "complete", getElementById: () => null, addEventListener() {} } };
ctxOp.window = ctxOp; vm.createContext(ctxOp);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../gen/operatoren.js"), "utf8"), ctxOp);
const GENOP = ctxOp.window.GENOP;
assert.strictEqual(O.KATALOG.length, GENOP.OPERATOREN.length, "все операторы из operatoren.js есть в тренажёре");
GENOP.OPERATOREN.forEach((g, i) => {
  const o = O.KATALOG[i];
  assert.strictEqual(o.key, g.key, "тот же порядок каталога (важно при равном rang)");
  assert.strictEqual(o.rang, g.rang, "rang " + g.key);
  assert.strictEqual(o.regex.source, g.regex.source, "regex " + g.key);
  assert.strictEqual(o.regex.flags, g.regex.flags, "flags " + g.key);
  ["ru", "umfang", "falle", "muster", "verb"].forEach(k => assert(o[k] && String(o[k]).trim(), k + " у " + g.key));
});

/* ---------- 2. Распознавание: при нескольких — самый требовательный ---------- */
assert.strictEqual(O.erkenne("Nennen Sie drei Vorteile.").key, "nennen");
assert.strictEqual(O.erkenne("Nennen und begründen Sie zwei Vorteile.").key, "begruenden", "begründen (5) сильнее nennen (1)");
assert.strictEqual(O.erkenne("Beschreiben Sie den Unterschied zwischen A und B.").key, "vergleichen", "«Unterschied» = сравнение");
assert.strictEqual(O.erkenne("Erläutern Sie, warum das sinnvoll ist.").key, "begruenden", "warum (5) сильнее erläutern (4)");
assert.strictEqual(O.erkenne("Beurteilen und begründen Sie die Lösung.").key, "beurteilen");
assert.strictEqual(O.erkenne("Geben Sie zwei Beispiele an.").key, "nennen");
assert.strictEqual(O.erkenne("Die Firma hat drei Standorte."), null);
assert.strictEqual(O.erkenne(null), null);
const probe = O.FALLBACK.map(f => f.text).concat([
  "Empfehlen Sie eine Lösung und begründen Sie Ihre Wahl.", "Prüfen Sie und berechnen Sie.", "Vergleichen und erläutern Sie.",
  "Erklären Sie, wie funktioniert ein Hash?", "Wägen Sie ab, ob …", "Ermitteln Sie den Rechenweg."]);
probe.forEach(t => {
  const a = O.erkenne(t), b = GENOP.erkenne(t);
  assert.strictEqual(a && a.key, b && b.key, "как GENOP.erkenne: " + t);
});
assert.deepStrictEqual(O.alleTreffer("Nennen und begründen Sie").map(o => o.key), ["nennen", "begruenden"]);
const st = O.verbStellen("Nennen und begründen Sie zwei Vorteile.");
assert.deepStrictEqual(st.map(x => [x.s, x.e, x.cls]), [[0, 6, "ou-verb2"], [11, 20, "ou-verb"]], "подсветка: главный глагол и второстепенный");

/* ---------- 3. HTML → предложения ---------- */
const html = "<div><p>Die Kopf &amp; Co. GmbH hat z. B. drei Standorte in Halle, Jena bzw. Gera.</p>" +
  "<p>ab) Nennen Sie zwei Vorteile der 2. Normalform. Erläutern Sie Ihre Wahl!</p>" +
  "<table><tr><td>Nennen Sie das nicht, es ist eine Tabelle.</td></tr></table>" +
  "<pre>Nennen Sie das auch nicht.</pre>" +
  "<ul><li>Beschreiben Sie den Ablauf&nbsp;der Anmeldung<br>Begründen Sie kurz.</li></ul>" +
  "<p>Erstellen Sie eine SQL-Abfrage, mit der Sie die Summe ermitteln.</p>" +
  "<p>Erstellen Sie das Diagramm und begründen Sie Ihre Wahl.</p></div>";
const text = O.htmlZuText(html);
assert(!/</.test(text), "теги убраны");
assert(!/Tabelle|auch nicht/.test(text), "таблицы и блоки кода выкинуты");
assert(/Kopf & Co\. GmbH/.test(text) && /Ablauf der/.test(text), "сущности раскодированы");
const s = O.saetze(text);
assert.deepStrictEqual(s.slice(0, 3), [
  "Die Kopf & Co. GmbH hat z. B. drei Standorte in Halle, Jena bzw. Gera.",
  "ab) Nennen Sie zwei Vorteile der 2. Normalform.",
  "Erläutern Sie Ihre Wahl!"], "z. B., bzw., Co., 2. — не режут предложение");
assert(s.includes("Beschreiben Sie den Ablauf der Anmeldung") && s.includes("Begründen Sie kurz."), "<br> и <li> — границы");
const k = O.kandidaten(html);
assert.deepStrictEqual(k, ["Nennen Sie zwei Vorteile der 2. Normalform.", "Erläutern Sie Ihre Wahl!",
  "Beschreiben Sie den Ablauf der Anmeldung", "Begründen Sie kurz.", "Erstellen Sie das Diagramm und begründen Sie Ihre Wahl."],
  "только предложения с «Sie» и оператором; метка «ab)» снята; «Erstellen …, mit der Sie ermitteln» — не berechnen");
assert.deepStrictEqual(O.kandidaten(""), []);
assert.deepStrictEqual(O.kandidaten(null), []);

/* ---------- 4. Сколько пунктов ---------- */
const z = t => { const a = O.anzahl(t); return a && [a.n, a.jeweils, a.mindestens, a.objekte]; };
assert.deepStrictEqual(z("Nennen Sie drei Vorteile."), [3, false, false, null]);
assert.deepStrictEqual(z("Nennen Sie 3 Testarten."), [3, false, false, null]);
assert.deepStrictEqual(z("Erläutern Sie mindestens zwei Maßnahmen."), [2, false, true, null]);
assert.deepStrictEqual(z("Nennen Sie für beide Varianten jeweils zwei Nachteile."), [2, true, false, 2]);
assert.deepStrictEqual(z("Nennen Sie für die drei Systeme jeweils zwei Risiken."), [2, true, false, 3], "число перед jeweils = объекты");
assert.deepStrictEqual(z("Nennen Sie für die Kriterien je zwei Beispiele."), [2, true, false, null]);
assert.deepStrictEqual(z("Erläutern Sie jeweils einen Aspekt aus den folgenden zwei Bereichen."), [1, true, false, 2]);
assert.deepStrictEqual(z("Nennen Sie jeweils einen Vorteil und einen Nachteil."), [2, true, false, null], "ein … und ein … = 2");
assert.deepStrictEqual(z("Erläutern Sie drei Vorteile und einen Nachteil des Systems."), [4, false, false, null], "3 + 1");
assert.deepStrictEqual(z("Nennen Sie je einen Vor- und Nachteil der Lösung."), [2, true, false, null], "Vor- und Nachteil = 2");
assert.deepStrictEqual(z("Nennen Sie jeweils zwei Vor- und zwei Nachteile."), [4, true, false, null], "второе число — часть суммы, не объекты");
assert.deepStrictEqual(O.anzahl("Erläutern Sie drei Vorteile und einen Nachteil.").teile, [3, 1]);
assert.deepStrictEqual(z("Finden Sie zwei Fehler und geben Sie jeweils die Zeile an."), [2, false, false, null], "jeweils без числа после него — не «на каждый»");
assert.deepStrictEqual(z("Die Firma hat drei Standorte. Nennen Sie zwei Vorteile."), [2, false, false, null], "число из ситуации до «Sie» не в счёт");
assert.strictEqual(O.anzahl("Prüfen Sie, ob die Tabelle die 2. Normalform erfüllt."), null, "2. = порядковое");
assert.strictEqual(O.anzahl("Berechnen Sie die Kosten für 4 Wochen."), null, "единицы времени — не пункты");
assert.strictEqual(O.anzahl("Runden Sie auf zwei Nachkommastellen und berechnen Sie den Preis."), null);
assert.strictEqual(O.anzahl("Erläutern Sie Aufgabe 3 Ihrer Lösung."), null);
assert.strictEqual(O.anzahl("Erläutern Sie eine Maßnahme."), null, "артикль «eine» — не число");
assert.strictEqual(O.anzahl("Ohne Anrede zwei Dinge."), null);
const hl = O.anzahl("Nennen Sie zwei Vorteile.");
assert.strictEqual("Nennen Sie zwei Vorteile.".slice(hl.s, hl.e), "zwei", "позиция числа для подсветки");

/* ---------- 5. Варианты ---------- */
O.KATALOG.forEach(op => {
  for (let seed = 1; seed <= 150; seed++) {
    const opt = O.optionen(op.key, rngVon(seed * 7 + op.rang));
    assert.strictEqual(opt.length, 4);
    assert.strictEqual(new Set(opt).size, 4, "без повторов");
    assert(opt.includes(op.key), "правильный всегда среди 4");
    opt.forEach(x => assert(O.KATALOG.some(o => o.key === x)));
    assert.strictEqual(new Set(opt.map(x => O.KATALOG.find(o => o.key === x).ru)).size, 4, "разные тексты вариантов");
  }
});
let ersteOben = 0;
for (let seed = 1; seed <= 200; seed++) if (O.optionen("erlaeutern", rngVon(seed))[0] === "erlaeutern") ersteOben++;
assert(ersteOben > 20 && ersteOben < 90, "правильный вариант не всегда на одном месте: " + ersteOben);
for (let n = 1; n <= 8; n++) for (let seed = 1; seed <= 40; seed++) {
  const zo = O.zahlOptionen(n, rngVon(seed));
  assert.strictEqual(zo.length, 4); assert.strictEqual(new Set(zo).size, 4); assert(zo.includes(n)); assert(zo.every(x => x >= 1));
  assert.deepStrictEqual(zo, zo.slice().sort((a, b) => a - b), "числа по возрастанию");
}

/* ---------- 6. Запасной набор ---------- */
assert(O.FALLBACK.length >= 20, "20+ авторских фраз");
assert.strictEqual(new Set(O.FALLBACK.map(f => f.id)).size, O.FALLBACK.length, "уникальные id");
O.FALLBACK.forEach(f => {
  assert(/\bSie\b/.test(f.text), "стиль экзамена: " + f.id);
  assert.strictEqual(O.erkenne(f.text).key, f.op, "заявленный оператор распознаётся: " + f.id + " " + f.text);
  if (f.luecke) { assert(f.muster, "к неполному ответу нужен полный: " + f.id); assert(["erklaerung", "punkte"].includes(f.luecke.fehlt), f.id); }
  if (f.luecke && f.luecke.fehlt === "punkte") assert(O.anzahl(f.text), "«не хватает пунктов» только при числе в задании: " + f.id);
});
const fbOps = new Set(O.FALLBACK.map(f => f.op));
O.KATALOG.forEach(o => assert(fbOps.has(o.key), "каждый оператор есть в запасном наборе: " + o.key));
assert(O.FALLBACK.filter(f => O.anzahl(f.text)).length >= 6, "достаточно фраз с числами");
assert(O.FALLBACK.some(f => /jeweils/.test(f.text)) && O.FALLBACK.some(f => /mindestens/.test(f.text)));
assert(O.FALLBACK.filter(f => f.muster).length >= 10, "образцы ответов для «хватает ли ответа»");

/* ---------- 7. Фальшивый пакет → пул GA ---------- */
const GEHEIM = "Quokkasoft";   /* слово из «экзаменного» текста — не должно попасть в хранилище */
const paketModule = [
  { id: "ga2-2025-w", marke: "GA2 W25/26", kurz: "GA2 Winter 2025/26", aufgaben: [
    { nr: 3, teile: [
      { id: "ga2-2025-w-3a", nr: 3, label: "a)", text: "<p>Die " + GEHEIM + " AG plant ein Portal.</p><p>Nennen Sie zwei Vorteile eines Portals für die " + GEHEIM + " AG.</p>" },
      { id: "ga2-2025-w-3b", nr: 3, label: "b)", text: "<p>Erläutern Sie drei Risiken beim Betrieb im " + GEHEIM + "-Rechenzentrum.</p><p>Begründen Sie, warum ein Backup nötig ist.</p>" },
      { id: "ga2-2025-w-3c", nr: 3, label: "ca)", text: "<p>Nennen Sie zwei Vorteile eines Portals für die " + GEHEIM + " AG.</p>" }
    ] }] },
  { id: "ga1-2024-s", marke: "GA1 S24", aufgaben: [
    { nr: 1, teile: [{ id: "ga1-2024-s-1a", nr: 1, label: "a)", text: "<p>Beschreiben Sie für beide Abteilungen jeweils zwei Aufgaben der " + GEHEIM + " IT.</p>" }] }] },
  { id: "wiso-2025-w", marke: "WiSo W25/26", aufgaben: [{ nr: 1, teile: [{ id: "wiso-1", text: "<p>Nennen Sie zwei Rechte des Betriebsrats.</p>" }] }] }
];
const ga = O.gaPool(paketModule);
assert.deepStrictEqual(ga.map(x => x.id), ["ga:ga2-2025-w-3a#0", "ga:ga2-2025-w-3b#0", "ga:ga2-2025-w-3b#1", "ga:ga1-2024-s-1a#0"], "WiSo не берём, дубликаты убраны");
assert.strictEqual(ga[1].quelle, "GA2 W25/26, Aufgabe 3b", "подпись источника");
assert.strictEqual(ga[3].quelle, "GA1 S24, Aufgabe 1a");
assert.deepStrictEqual(ga.map(x => x.op), ["nennen", "erlaeutern", "begruenden", "beschreiben"]);
assert(ga.every(x => x.ga === true));
assert.deepStrictEqual(O.gaPool(null), []);
assert.deepStrictEqual(O.gaPool([{ id: "ga1-x" }, null, { id: "ga2-y", aufgaben: [{ teile: [null, { text: "Nennen Sie zwei" }] }] }]), [], "битые модули не роняют");

/* ---------- 7b. Состав раунда (много случайных раундов) ---------- */
[O.fallbackPool(), ga.concat(O.fallbackPool())].forEach((pool, pi) => {
  for (let seed = 1; seed <= 120; seed++) {
    const f = O.rundeBauen(pool, { rng: rngVon(seed + pi * 1000) });
    assert.strictEqual(f.length, 10, "10 вопросов");
    assert(f.filter(x => x.typ === "zahl").length >= 2, "минимум 2 вопроса «сколько пунктов»");
    assert.strictEqual(f.filter(x => x.typ === "genug").length, 2, "2 вопроса «хватает ли»");
    f.forEach((x, i) => { if (x.typ === "zahl") assert(f[i - 1].typ === "op" && f[i - 1].ref === x.ref, "пара op → zahl"); });
    const opRefs = f.filter(x => x.typ !== "zahl").map(x => x.ref);
    assert.strictEqual(new Set(opRefs).size, opRefs.length, "фраза не повторяется в раунде");
    assert(f.every(x => x.optionen.map(String).includes(String(x.richtig))));
  }
});
assert.deepStrictEqual(O.rundeBauen([], {}), [], "пустой пул — пустой раунд");

/* ---------- 8. Раунд и статистика с поддельным localStorage ---------- */
function laden(opts) {
  opts = opts || {};
  const ctx = { console, Promise, Date, Math, JSON, setTimeout,
    localStorage: { getItem: k => (k in opts.mem ? opts.mem[k] : null), setItem: (k, v) => { if (opts.voll) throw new Error("Quota"); opts.mem[k] = String(v); } },
    GENLERNSTAND: { record: e => { opts.events.push(JSON.parse(JSON.stringify(e))); return { ok: !opts.journalAus }; } } };
  if (opts.azubi) ctx.GENAZUBI = opts.azubi;
  ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(QUELLE, ctx);
  return ctx.GENOPUEB;
}
const mem = {}, events = [];
let U = laden({ mem, events, azubi: { laden: () => Promise.resolve({}), alleModule: () => paketModule, paket: () => ({}) } });

(async () => {
  await U.poolLaden();
  assert.deepStrictEqual(Object.assign({}, U.info()), { ga: 4, fb: O.FALLBACK.length, paket: true });
  assert(U.starten(false, rngVon(42)), "раунд стартует");
  let r = U.stand().runde;
  assert.strictEqual(r.fragen.length, 10, "раунд — 10 вопросов");
  const typen = r.fragen.map(f => f.typ);
  assert(typen.includes("op") && typen.includes("zahl") && typen.includes("genug"), "все три типа вопросов: " + typen);
  assert.strictEqual(typen.filter(t => t === "genug").length, 2);
  r.fragen.forEach((f, i) => {
    if (f.typ === "zahl") { assert.strictEqual(r.fragen[i - 1].typ, "op"); assert.strictEqual(r.fragen[i - 1].ref, f.ref, "«сколько» идёт сразу после «какой оператор» к той же фразе"); }
    if (f.typ === "genug") assert(/^f:/.test(f.ref), "«хватает ли» — только авторские фразы с образцом");
    assert(f.optionen.map(String).includes(String(f.richtig)), "правильный среди вариантов");
  });
  const gaRefs = r.fragen.filter(f => /^ga:/.test(f.ref)).map(f => f.ref);
  assert(gaRefs.length >= 4, "настоящие формулировки GA в приоритете");

  /* отвечаем: каждый второй — неверно */
  const falscheOps = [];
  r.fragen.forEach((f, i) => {
    const falsch = i % 2 === 1;
    const wahl = falsch ? f.optionen.find(o => String(o) !== String(f.richtig)) : f.richtig;
    if (falsch && f.typ === "op") falscheOps.push(f.richtig + ">" + wahl);
    const erg = U.beantworten(wahl);
    assert.strictEqual(erg.richtig, !falsch);
    assert.strictEqual(U.beantworten(f.richtig), null, "повторный ответ на тот же вопрос игнорируется");
    U.weiter();
  });
  let S = U.stand();
  assert(S.runde.abgeschlossen && S.runde.pos === 10);
  assert.strictEqual(S.runden.length, 1); assert.strictEqual(S.runden[0].r, 5); assert.strictEqual(S.runden[0].n, 10);
  const opsSumme = Object.keys(S.ops).reduce((a, k) => a + S.ops[k].r + S.ops[k].f, 0);
  assert.strictEqual(opsSumme, typen.filter(t => t === "op").length, "статистика по операторам");
  falscheOps.forEach(k => assert(S.verwechslung[k] >= 1, "путаница записана: " + k));
  assert.strictEqual(Object.keys(S.fehler).length, 5, "5 ошибок для раунда «только мои ошибки»");

  /* журнал */
  assert.strictEqual(events.length, 10);
  events.forEach((e, i) => {
    assert.strictEqual(e.topic, "taktik"); assert.strictEqual(e.source, "operatoren"); assert.strictEqual(e.kind, "recognition");
    assert.strictEqual(e.support, "selbst"); assert.strictEqual(e.max, 1); assert.strictEqual(e.correct, i % 2 ? 0 : 1);
    assert(O.KATALOG.some(o => o.key === e.task), "task = ключ оператора");
    assert(e.id.startsWith("opueb:" + r.id + ":"));
  });
  assert.strictEqual(new Set(events.map(e => e.id)).size, 10, "стабильные уникальные id");

  /* тексты экзаменов никуда не сохраняются */
  assert(!JSON.stringify(mem).includes(GEHEIM), "в localStorage нет текста GA");
  assert(!JSON.stringify(events).includes(GEHEIM), "в журнале нет текста GA");
  assert(!JSON.stringify(mem).includes("Vorteile eines Portals"));

  /* перезагрузка: всё на месте */
  U = laden({ mem, events, azubi: { laden: () => Promise.resolve({}), alleModule: () => paketModule, paket: () => ({}) } });
  await U.poolLaden();
  S = U.stand();
  assert.strictEqual(S.runden.length, 1); assert.strictEqual(Object.keys(S.fehler).length, 5); assert(S.runde && S.runde.abgeschlossen);

  /* раунд «только мои ошибки» */
  assert(U.starten(true, rngVon(3)));
  r = U.stand().runde;
  assert.strictEqual(r.fragen.length, 5, "только ошибки");
  const fehlerKeys = Object.keys(S.fehler);
  r.fragen.forEach(f => assert(fehlerKeys.includes(f.ref + "|" + f.typ), "вопрос из списка ошибок"));
  r.fragen.forEach(f => { U.beantworten(f.richtig); U.weiter(); });
  assert.strictEqual(Object.keys(U.stand().fehler).length, 0, "верный ответ убирает ошибку");
  assert.strictEqual(U.starten(true), false, "без ошибок раунд ошибок не стартует");

  /* незавершённый раунд переживает перезагрузку (только ссылки, без текста) */
  U.zumUeberblick();
  assert(U.starten(false, rngVon(9)));
  U.beantworten(U.stand().runde.fragen[0].richtig);
  U = laden({ mem, events, azubi: { laden: () => Promise.resolve({}), alleModule: () => paketModule, paket: () => ({}) } });
  r = U.stand().runde;
  assert.strictEqual(r.pos, 0); assert.strictEqual(r.antworten.length, 1); assert(!r.abgeschlossen);
  assert(!JSON.stringify(mem).includes(GEHEIM));
  U.abbrechen();
  assert.strictEqual(U.stand().runde, null); assert.strictEqual(U.stand().runden.length, 3, "прерванный раунд с ответами учтён");

  /* ---------- 9. Без пакета ---------- */
  const mem2 = {}, ev2 = [];
  let V = laden({ mem: mem2, events: ev2 });                      /* GENAZUBI нет вообще */
  await V.poolLaden();
  assert.deepStrictEqual(Object.assign({}, V.info()), { ga: 0, fb: O.FALLBACK.length, paket: false });
  assert(V.starten(false, rngVon(5)));
  const rv = V.stand().runde;
  assert.strictEqual(rv.fragen.length, 10);
  assert(rv.fragen.every(f => /^f:/.test(f.ref)), "только авторские фразы");
  assert.strictEqual(new Set(rv.fragen.filter(f => f.typ === "op").map(f => f.ref)).size, rv.fragen.filter(f => f.typ === "op").length, "фразы в раунде не повторяются");
  V = laden({ mem: {}, events: [], azubi: { laden: () => Promise.reject(new Error("offline")), alleModule: () => [] } });
  await V.poolLaden();
  assert.strictEqual(V.info().paket, false, "ошибка загрузки пакета → запасной набор");
  assert(V.starten(false));
  V = laden({ mem: {}, events: [], azubi: { laden: () => Promise.resolve(null), alleModule: () => { throw new Error("kaputt"); } } });
  await V.poolLaden();
  assert.strictEqual(V.info().fb, O.FALLBACK.length);
  /* пакет был, теперь нет: ссылки GA в старых ошибках просто не используются */
  V = laden({ mem, events: [] });
  await V.poolLaden();
  V.zumUeberblick();
  assert(V.starten(false));

  /* ---------- 10. Хранилище: битые данные и полная память ---------- */
  const mem3 = { "ap2:opueb": "{kaputt" };
  V = laden({ mem: mem3, events: [] });
  assert(V.fehler(), "понятное сообщение при битых данных");
  await V.poolLaden(); V.starten(false); V.beantworten("nennen");
  assert.strictEqual(mem3["ap2:opueb"], "{kaputt", "битые данные не перезаписаны");
  const mem4 = {};
  V = laden({ mem: mem4, events: [], voll: true });
  await V.poolLaden();
  assert(V.starten(false), "раунд идёт и при полной памяти");
  assert(V.fehler(), "сообщение о сбое сохранения");
  assert(V.beantworten(V.stand().runde.fragen[0].richtig).richtig, "ответ учитывается в памяти вкладки");
  mem4["ap2:opueb"] = JSON.stringify({ ops: [], runden: "x", runde: { fragen: "x" } });
  V = laden({ mem: mem4, events: [] });
  assert.strictEqual(V.fehler(), "", "чужие типы полей мягко сбрасываются");
  assert.deepStrictEqual(V.stand().runden, []); assert.strictEqual(V.stand().runde, null);

  /* ---------- 11. Журнал недоступен → повтор с тем же id в конце раунда ---------- */
  const mem5 = {}, ev5 = [];
  const opts5 = { mem: mem5, events: ev5, journalAus: true };
  V = laden(opts5);
  await V.poolLaden();
  V.starten(false, rngVon(11));
  V.beantworten(V.stand().runde.fragen[0].richtig);
  assert.strictEqual(V.stand().runde.antworten[0].recorded, false);
  opts5.journalAus = false;
  for (let i = 0; i < 10; i++) { if (i) V.beantworten(V.stand().runde.fragen[i].richtig); V.weiter(); }
  assert.strictEqual(ev5.filter(e => e.id === ev5[0].id).length, 2, "повтор с тем же id");
  assert.strictEqual(ev5[ev5.length - 1].id, ev5[0].id, "повтор — при завершении раунда");
  assert.strictEqual(JSON.stringify(ev5[ev5.length - 1]), JSON.stringify(ev5[0]), "та же запись без изменений");
  assert(V.stand().runde.antworten.every(a => a.recorded));

  /* ---------- 12. «Путаешь A и B» ---------- */
  assert.deepStrictEqual(O.verwechslungen({ "erlaeutern>beschreiben": 2, "beschreiben>erlaeutern": 1, "nennen>beschreiben": 1 }).map(v => [v.a, v.b, v.n]),
    [["beschreiben", "erlaeutern", 3], ["beschreiben", "nennen", 1]]);

  console.log("operatoren-uebung: ok");
})().catch(e => { console.error(e); process.exit(1); });
