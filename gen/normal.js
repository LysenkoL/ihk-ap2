/* Нормализация шаг за шагом (1NF → 2NF → 3NF → модель).
   Каждый шаг проверяется автоматически по ключам и функциональным
   зависимостям сценария (gen/normal-daten.js); ошибки объясняются по-русски.
   Хранение: localStorage "ap2:normal". Журнал: GENLERNSTAND.record. */
"use strict";
(function (root) {
  const SK = "ap2:normal", hasDom = typeof document !== "undefined";
  const SCHRITTE = [
    { id: "anomalie", kurz: "Аномалии", titel: "Шаг 0. Аномалии" },
    { id: "nf1", kurz: "1NF", titel: "Шаг 1. Первая нормальная форма (1NF)" },
    { id: "schluessel", kurz: "Ключ", titel: "Шаг 2. Первичный ключ" },
    { id: "nf2", kurz: "2NF", titel: "Шаг 3. Вторая нормальная форма (2NF)" },
    { id: "nf3", kurz: "3NF", titel: "Шаг 4. Третья нормальная форма (3NF)" },
    { id: "modell", kurz: "Модель", titel: "Шаг 5. Модель: PK, FK и связи" }
  ];
  const SCHRITT_IDS = SCHRITTE.map(s => s.id);
  const clone = x => JSON.parse(JSON.stringify(x));
  const szenarien = () => root.AP2_NORMAL || [];
  const findSz = id => szenarien().find(s => s.id === id) || null;
  const gleich = (a, b) => a.length === b.length && a.every(x => b.includes(x));
  const plus = arr => arr.join(" + ");
  const mal = n => { const a = n % 10, b = n % 100; return a >= 2 && a <= 4 && (b < 12 || b > 14) ? "раза" : "раз"; };

  /* ---------------- Анализ сценария (чистые функции) ---------------- */
  function huelle(sz, menge) {
    const h = new Set(menge);
    let neu = true;
    while (neu) {
      neu = false;
      for (const [a, x] of Object.entries(sz.abh)) if (!h.has(a) && x.von.every(v => h.has(v))) { h.add(a); neu = true; }
    }
    return h;
  }
  function teilmengen(arr) {
    const r = [];
    for (let m = 1; m < (1 << arr.length); m++) r.push(arr.filter((_, i) => m & (1 << i)));
    return r.sort((a, b) => a.length - b.length);
  }
  const nichtSchluessel = sz => sz.nf1.spalten.filter(c => !sz.schluessel.includes(c));
  function spaltenArt(sz, sp) {
    const i = sz.ausgang.spalten.indexOf(sp);
    const teile = (sz.zerlegung || {})[sp] || [sp];
    return { wdh: sz.ausgang.zeilen.some(z => Array.isArray(z[i])), zus: teile.length > 1, teile };
  }
  const nf1Richtig = sz => sz.ausgang.spalten.filter(s => { const a = spaltenArt(sz, s); return a.wdh || a.zus; });
  /* 2NF: минимальная часть ключа, от которой зависит атрибут ("ganz" = весь ключ). */
  function nf2Ziel(sz, a) {
    for (const s of teilmengen(sz.schluessel)) if (huelle(sz, s).has(a)) return s.length === sz.schluessel.length ? "ganz" : s.join("+");
    return null;
  }
  /* 3NF: "direkt" — от ключа таблицы, иначе "ueber:X" — непосредственная детерминанта. */
  function nf3Ziel(sz, tab, a) {
    const d = sz.abh[a].von;
    return d.every(x => tab.pk.includes(x)) ? "direkt" : "ueber:" + d.join("+");
  }
  function nf3Punkte(sz) {
    const r = [];
    sz.nf2.forEach(t => {
      const ns = t.spalten.filter(c => !t.pk.includes(c));
      if (ns.length < 2) return;
      ns.forEach(a => r.push({ key: t.name + "." + a, tab: t, attr: a, richtig: nf3Ziel(sz, t, a),
        optionen: [["direkt", "напрямую от ключа (" + plus(t.pk) + ")"]].concat(ns.filter(x => x !== a).map(x => ["ueber:" + x, "транзитивно — через " + x])) }));
    });
    return r;
  }
  function nf2Optionen(sz) {
    return [["ganz", "от всего ключа (" + plus(sz.schluessel) + ")"]].concat(
      teilmengen(sz.schluessel).filter(s => s.length < sz.schluessel.length).map(s => [s.join("+"), "только от " + plus(s)]));
  }
  const ANOMALIE = [["einfuege", "Einfügeanomalie — вставка"], ["loesch", "Löschanomalie — удаление"], ["aenderung", "Änderungsanomalie — изменение"]];
  const ANOMALIE_DEF = { einfuege: "Einfügeanomalie: новые данные нельзя записать без других данных",
    loesch: "Löschanomalie: при удалении строки теряются другие нужные данные",
    aenderung: "Änderungsanomalie: одно изменение приходится делать во многих строках" };
  const KARD = [["1:1", "1 : 1"], ["1:n", "1 : n"], ["n:1", "n : 1"], ["n:m", "n : m"]];
  const spalteIdx = (sz, c) => sz.nf1.spalten.indexOf(c);
  function projektion(sz, spalten) {
    const idx = spalten.map(c => spalteIdx(sz, c)), seen = new Set(), r = [];
    sz.nf1.zeilen.forEach(z => { const row = idx.map(i => z[i]), k = row.join("\u0001"); if (!seen.has(k)) { seen.add(k); r.push(row); } });
    return r;
  }
  /* Две строки 1NF с одинаковыми von, но разными zu. */
  function gegenbeispiel(sz, von, zu) {
    const iv = von.map(c => spalteIdx(sz, c)), iz = spalteIdx(sz, zu), seen = new Map();
    if (iz < 0 || iv.some(i => i < 0)) return null;
    for (const z of sz.nf1.zeilen) {
      const k = iv.map(i => z[i]).join("\u0001");
      if (seen.has(k) && seen.get(k) !== z[iz]) return { von: von.map((c, j) => c + " = " + z[iv[j]]).join(", "), a: seen.get(k), b: z[iz] };
      if (!seen.has(k)) seen.set(k, z[iz]);
    }
    return null;
  }
  /* Пример избыточности: значение von повторяется, zu каждый раз одно и то же. */
  function wiederholt(sz, von, zu) {
    const iv = von.map(c => spalteIdx(sz, c)), iz = spalteIdx(sz, zu), n = new Map();
    sz.nf1.zeilen.forEach(z => { const k = iv.map(i => z[i]).join("\u0001"); const x = n.get(k) || { z, n: 0 }; x.n++; n.set(k, x); });
    let best = null;
    n.forEach(x => { if (x.n > 1 && (!best || x.n > best.n)) best = x; });
    return best ? { von: von.map((c, j) => c + " = " + best.z[iv[j]]).join(", "), w: best.z[iz], n: best.n } : null;
  }
  function doppelteZeilen(sz, spalten) {
    const idx = spalten.map(c => spalteIdx(sz, c)), seen = new Map();
    for (let i = 0; i < sz.nf1.zeilen.length; i++) {
      const k = idx.map(j => sz.nf1.zeilen[i][j]).join("\u0001");
      if (seen.has(k)) return { a: seen.get(k), b: i, werte: spalten.map((c, j) => c + " = " + sz.nf1.zeilen[i][idx[j]]).join(", ") };
      seen.set(k, i);
    }
    return null;
  }
  function beziehungText(b) { const [x, y] = b.art.split(":"); return b.a + " " + x + " : " + y + " " + b.b + (b.ueber ? " (über " + b.ueber + ")" : ""); }
  function notation(sz) {
    return sz.nf3.map(t => t.name + "(" + t.spalten.map(c => {
      const m = []; if (t.pk.includes(c)) m.push("PK"); if (t.fk[c]) m.push("FK");
      return c + (m.length ? " [" + m.join(", ") + "]" : "");
    }).join(", ") + ")");
  }
  const tabVon = (sz, name) => sz.nf3.find(t => t.name === name);
  const fkSpalte = (t, ziel) => Object.keys(t.fk).find(c => t.fk[c] === ziel);

  /* ---------------- Эталон и проверка ---------------- */
  function loesung(sz, schritt) {
    const o = {};
    switch (schritt) {
      case "anomalie": sz.anomalien.forEach((x, i) => { o[i] = x.typ; }); break;
      case "nf1": nf1Richtig(sz).forEach(s => { o[s] = true; }); break;
      case "schluessel": sz.schluessel.forEach(s => { o[s] = true; }); break;
      case "nf2": nichtSchluessel(sz).forEach(a => { o[a] = nf2Ziel(sz, a); }); break;
      case "nf3": nf3Punkte(sz).forEach(p => { o[p.key] = p.richtig; }); break;
      case "modell":
        sz.nf3.forEach(t => { t.pk.forEach(c => { o["pk:" + t.name + ":" + c] = true; }); Object.keys(t.fk).forEach(c => { o["fk:" + t.name + ":" + c] = true; }); });
        sz.beziehungen.forEach((b, i) => { o["rel:" + i] = b.art; }); break;
      default: throw new Error("Неизвестный шаг.");
    }
    return o;
  }
  /* Множество: каждый нужный элемент — балл, плюс балл, если нет лишних отметок. */
  function mengeWertung(gewaehlt, richtig) {
    const sauber = gewaehlt.length > 0 && gewaehlt.every(x => richtig.includes(x));
    return { correct: richtig.filter(x => gewaehlt.includes(x)).length + (sauber ? 1 : 0), max: richtig.length + 1 };
  }
  const label = (opts, v) => { const o = opts.find(x => x[0] === v); return o ? o[1] : v; };
  const gewaehlt = (a, praefix) => Object.keys(a).filter(k => a[k] === true && k.startsWith(praefix)).map(k => k.slice(praefix.length));

  function pruefen(sz, schritt, antworten) {
    const a = antworten || {}, items = [], hinweise = [];
    let wertung = null;
    if (schritt === "anomalie") {
      sz.anomalien.forEach((x, i) => {
        const g = a[i], ok = g === x.typ;
        items.push({ key: String(i), ok, richtig: label(ANOMALIE, x.typ), de: x.de,
          erkl: (ok ? "" : (g ? "Нет, это не " + label(ANOMALIE, g).split(" —")[0] + ". " : "Не выбрано. ") + "Здесь " + ANOMALIE_DEF[x.typ] + ". ") + x.erkl });
      });
    } else if (schritt === "nf1") {
      const richtig = nf1Richtig(sz), wahl = gewaehlt(a, "");
      sz.ausgang.spalten.forEach((s, i) => {
        const soll = richtig.includes(s), ist = !!a[s], art = spaltenArt(sz, s);
        const zelle = (sz.ausgang.zeilen.find(z => Array.isArray(z[i]) && z[i].length > 1) || sz.ausgang.zeilen[0])[i];
        const bsp = Array.isArray(zelle) ? zelle.join(" | ") : zelle;
        let t;
        if (art.wdh && art.zus) t = "В ячейке несколько значений — повторяющаяся группа (Wiederholungsgruppe). И каждое значение состоит из частей (" + plus(art.teile) + ") — не атомарно. В 1NF: каждое значение — своя строка, части — отдельные столбцы " + art.teile.join(", ") + ".";
        else if (art.wdh) t = "В ячейке несколько значений — повторяющаяся группа (Wiederholungsgruppe). В 1NF каждое значение получает свою строку.";
        else if (art.zus) t = "В одной ячейке несколько частей (" + plus(art.teile) + ") — значение не атомарно. В 1NF: отдельные столбцы " + art.teile.join(", ") + ".";
        else t = "В каждой ячейке одно неделимое значение — атомарно (atomar). Столбец остаётся как есть.";
        items.push({ key: s, ok: soll === ist, richtig: soll ? "нарушает 1NF" : "атомарно", erkl: (soll === ist ? "" : soll ? "Этот столбец нарушает 1NF. " : "Этот столбец не нарушает 1NF. ") + t + " Пример: «" + bsp + "»." });
      });
      wertung = mengeWertung(wahl.filter(s => sz.ausgang.spalten.includes(s)), richtig);
      hinweise.push("Баллы: по одному за каждый найденный столбец и ещё один, если нет лишних отметок.");
    } else if (schritt === "schluessel") {
      const key = sz.schluessel, wahl = sz.nf1.spalten.filter(c => a[c] === true);
      sz.nf1.spalten.forEach(c => {
        const soll = key.includes(c), ist = !!a[c];
        let t;
        if (soll) t = (ist ? "" : "Не хватает " + c + ". ") + c + " входит в ключ. " + (sz.schluesselWarum[c] || "");
        else {
          const z = nf2Ziel(sz, c);
          t = z === "ganz" ? c + " — данные записи, а не идентификатор: " + c + " сам определяется ключом (" + plus(key) + ")."
            : c + " не нужен в ключе: он уже определяется " + z.split("+").join(" + ") + " (" + z.split("+").join(", ") + " → " + c + "). Ключ должен быть минимальным.";
        }
        items.push({ key: c, ok: soll === ist, richtig: soll ? "часть ключа" : "не ключ", erkl: t });
      });
      if (!wahl.length) hinweise.push("Не выбран ни один столбец.");
      else {
        const d = doppelteZeilen(sz, wahl);
        if (d) hinweise.push("По выбранным столбцам строки " + (d.a + 1) + " и " + (d.b + 1) + " одинаковы (" + d.werte + "). Значит, такой ключ не определяет строку однозначно.");
      }
      wertung = mengeWertung(wahl, key);
      hinweise.push("Баллы: по одному за каждый столбец ключа и ещё один, если нет лишних столбцов.");
    } else if (schritt === "nf2") {
      const key = sz.schluessel, opts = nf2Optionen(sz);
      nichtSchluessel(sz).forEach(A => {
        const r = nf2Ziel(sz, A), g = a[A] || "", d = sz.abh[A].von, w = sz.abh[A].warum;
        let t;
        if (r === "ganz") {
          t = A + " зависит от всего ключа (" + plus(key) + "). " + w;
          teilmengen(key).filter(s => s.length === key.length - 1).forEach(s => {
            const x = gegenbeispiel(sz, s, A);
            if (x) t += " При " + x.von + " встречаются разные " + A + ": «" + x.a + "» и «" + x.b + "» — от одного " + plus(s) + " не зависит.";
          });
          if (!d.every(x => key.includes(x))) t += " Зависимость идёт через " + plus(d) + " (ключ → " + plus(d) + " → " + A + "). Это не частичная, а транзитивная зависимость — её уберём на шаге 3NF.";
        } else {
          const teil = r.split("+");
          t = A + " зависит только от " + plus(teil) + " — это частичная зависимость (partielle Abhängigkeit), нарушение 2NF. " + w;
          if (!gleich(d, teil)) t += " Цепочка: " + plus(teil) + " → " + plus(d) + " → " + A + ".";
          const bsp = wiederholt(sz, teil, A);
          if (bsp) t += " Например, при " + bsp.von + " всегда " + A + " = «" + bsp.w + "» (" + bsp.n + " " + mal(bsp.n) + " — Redundanz).";
          if (g === "ganz") t += " Весь ключ здесь не нужен: уже " + plus(teil) + " однозначно задаёт " + A + ".";
          if (g && g !== "ganz" && g !== r) { const x = gegenbeispiel(sz, g.split("+"), A); if (x) t += " От " + g.split("+").join(" + ") + " " + A + " не зависит: при " + x.von + " разные значения «" + x.a + "» и «" + x.b + "»."; }
        }
        items.push({ key: A, ok: g === r, richtig: label(opts, r), erkl: (g ? "" : "Не выбрано. ") + t });
      });
    } else if (schritt === "nf3") {
      nf3Punkte(sz).forEach(p => {
        const A = p.attr, g = a[p.key] || "", w = sz.abh[A].warum, pk = plus(p.tab.pk);
        let t;
        if (p.richtig === "direkt") {
          t = A + " зависит напрямую от ключа " + pk + ". " + w;
          if (g.startsWith("ueber:")) { const y = g.slice(6), x = gegenbeispiel(sz, [y], A); t += x ? " Из " + y + " нельзя вывести " + A + ": при " + x.von + " разные значения «" + x.a + "» и «" + x.b + "»." : " " + y + " не определяет " + A + " однозначно: такого правила в задании нет, " + A + " задаётся ключом " + pk + "."; }
        } else {
          const x = p.richtig.slice(6);
          t = A + " зависит от " + x + ", а " + x + " — не ключ: " + pk + " → " + x + " → " + A + ". Это транзитивная зависимость (transitive Abhängigkeit), нарушение 3NF. " + w;
          if (g.startsWith("ueber:") && g !== p.richtig) {
            const y = g.slice(6);
            if (huelle(sz, [y]).has(A)) t += " Почти: через " + y + " " + A + " тоже определяется, но только по цепочке " + y + " → " + x + " → " + A + ". Выбирай непосредственную детерминанту " + x + " — тогда " + A + " уйдёт в таблицу вместе с " + x + ".";
            else { const z = gegenbeispiel(sz, [y], A); t += z ? " Из " + y + " нельзя вывести " + A + ": при " + z.von + " разные значения «" + z.a + "» и «" + z.b + "»." : " " + y + " не определяет " + A + " однозначно: такого правила в задании нет, " + A + " задаётся через " + x + "."; }
          }
        }
        items.push({ key: p.key, ok: g === p.richtig, richtig: label(p.optionen, p.richtig), erkl: (g ? "" : "Не выбрано. ") + t });
      });
    } else if (schritt === "modell") {
      sz.nf3.forEach(t => {
        const pkG = gewaehlt(a, "pk:" + t.name + ":"), fkG = gewaehlt(a, "fk:" + t.name + ":"), fkR = Object.keys(t.fk);
        let e = "PK таблицы " + t.name + ": " + plus(t.pk) + "." + (t.pk.length > 1 ? " Составной ключ (zusammengesetzter Schlüssel): только вместе " + plus(t.pk) + " однозначно определяют строку." : "");
        pkG.filter(c => !t.pk.includes(c)).forEach(c => { e += " " + c + " не нужен в PK" + (t.fk[c] ? " — это внешний ключ, а не первичный." : "."); });
        t.pk.filter(c => !pkG.includes(c)).forEach(c => { e += " Не хватает " + c + "."; });
        items.push({ key: "pk:" + t.name, ok: gleich(pkG, t.pk), richtig: "PK: " + plus(t.pk), erkl: e });
        let f = fkR.length ? "Внешние ключи (Fremdschlüssel) в " + t.name + ": " + fkR.map(c => c + " → " + t.fk[c] + "." + c).join("; ") + ". FK — столбец, который ссылается на PK другой таблицы."
          : "В " + t.name + " нет внешних ключей: ни один столбец не ссылается на другую таблицу.";
        fkG.filter(c => !fkR.includes(c)).forEach(c => { f += " " + c + " — не FK: " + (t.pk.includes(c) ? "это первичный ключ этой таблицы; на него ссылаются другие таблицы." : "обычный атрибут, он не ссылается на другую таблицу."); });
        fkR.filter(c => !fkG.includes(c)).forEach(c => { f += " Не отмечен FK " + c + "."; });
        items.push({ key: "fk:" + t.name, ok: gleich(fkG, fkR), richtig: fkR.length ? "FK: " + fkR.join(", ") : "FK: нет", erkl: f });
      });
      sz.beziehungen.forEach((b, i) => {
        const g = a["rel:" + i] || "";
        let e;
        if (b.art === "n:m") e = beziehungText(b) + ": прямого FK между " + b.a + " и " + b.b + " нет. Пары хранит таблица-связка " + b.ueber + " (FK на " + b.a + " и на " + b.b + ").";
        else {
          const [eins, viele] = b.art === "1:n" ? [b.a, b.b] : [b.b, b.a], col = fkSpalte(tabVon(sz, viele), eins);
          e = beziehungText(b) + ": в " + viele + " есть FK " + col + " → " + eins + ". Одной записи " + eins + " соответствует много записей " + viele + ", а каждая запись " + viele + " относится ровно к одной записи " + eins + ".";
        }
        items.push({ key: "rel:" + i, ok: g === b.art, richtig: label(KARD, b.art), de: b.de, erkl: (g ? "" : "Не выбрано. ") + e });
      });
    } else throw new Error("Неизвестный шаг.");
    const correct = wertung ? wertung.correct : items.filter(x => x.ok).length, max = wertung ? wertung.max : items.length;
    return { items, hinweise, correct, max, voll: correct === max };
  }
  /* Немецкий образец ответа к шагу + перевод. */
  function satz(sz, schritt) {
    if (schritt === "nf1") {
      const r = nf1Richtig(sz), w = r.find(s => spaltenArt(sz, s).wdh), z = r.find(s => spaltenArt(sz, s).zus && !spaltenArt(sz, s).wdh);
      return [["Die Tabelle ist nicht in der 1. NF, weil die Spalte " + w + " mehrere Werte enthält." + (z ? " Die Spalte " + z + " ist nicht atomar." : ""),
        "Таблица не в 1NF, потому что столбец " + w + " содержит несколько значений." + (z ? " Столбец " + z + " не атомарен." : "")]];
    }
    if (schritt === "schluessel") {
      const k = sz.schluessel;
      return [[k.length > 1 ? "Der Primärschlüssel ist zusammengesetzt aus " + k.slice(0, -1).join(", ") + " und " + k[k.length - 1] + "." : "Der Primärschlüssel ist " + k[0] + ".",
        k.length > 1 ? "Первичный ключ составной: " + plus(k) + "." : "Первичный ключ — " + k[0] + "."]];
    }
    if (schritt === "nf2") {
      const A = nichtSchluessel(sz).find(x => nf2Ziel(sz, x) !== "ganz");
      if (!A) return [];
      const P = nf2Ziel(sz, A).split("+").join(" und ");
      return [["Die Tabelle ist nicht in der 2. NF, weil " + A + " nur von " + P + " abhängt (partielle Abhängigkeit).",
        "Таблица не во 2NF, потому что " + A + " зависит только от " + P.replace(" und ", " + ") + " — от части ключа."]];
    }
    if (schritt === "nf3") {
      const p = nf3Punkte(sz).find(x => x.richtig !== "direkt");
      if (!p) return [];
      const X = p.richtig.slice(6);
      return [["Die Tabelle " + p.tab.name + " ist nicht in der 3. NF, weil " + p.attr + " von " + X + " abhängt und " + X + " kein Schlüssel ist (transitive Abhängigkeit).",
        "Таблица " + p.tab.name + " не в 3NF, потому что " + p.attr + " зависит от " + X + ", а " + X + " — не ключ."]];
    }
    return [];
  }

  /* ---------------- Хранение ---------------- */
  let readError = "", saveError = "", view = null;
  const leer = () => ({ v: 1, sz: {}, offen: [] });
  function laden() {
    readError = "";
    try {
      const raw = root.localStorage && root.localStorage.getItem(SK);
      if (!raw) return leer();
      const x = JSON.parse(raw);
      if (!x || typeof x !== "object" || Array.isArray(x)) throw new Error("format");
      if (x.sz != null && (typeof x.sz !== "object" || Array.isArray(x.sz))) throw new Error("sz");
      if (x.offen != null && !Array.isArray(x.offen)) throw new Error("offen");
      return Object.assign({}, x, { v: 1, sz: x.sz || {}, offen: x.offen || [] });
    } catch (e) {
      readError = "Сохранённый прогресс нормализации не читается. Старые данные не трогаю: можно решать дальше, но новые ответы пока не сохраняются. Сделай резервную копию прогресса.";
      return leer();
    }
  }
  let state = laden();
  function speichern() {
    try {
      if (readError) throw new Error(readError);
      root.localStorage.setItem(SK, JSON.stringify(state));
      saveError = "";
      if (hasDom) meldung();
      return true;
    } catch (e) {
      saveError = readError || "Не удалось сохранить прогресс на этом устройстве. Ответы остаются на экране — не закрывай вкладку, сделай резервную копию и освободи место.";
      if (hasDom) meldung();
      return false;
    }
  }
  function szVon(id) { const sz = findSz(id); if (!sz) throw new Error("Неизвестный сценарий."); return sz; }
  function szStand(id) {
    szVon(id);
    const s = state.sz[id];
    if (!s || typeof s !== "object" || !s.s || typeof s.s !== "object") state.sz[id] = { schritt: 0, s: {} };
    return state.sz[id];
  }
  function schrittStand(id, schritt) {
    if (!SCHRITT_IDS.includes(schritt)) throw new Error("Неизвестный шаг.");
    const ss = szStand(id);
    const st = ss.s[schritt];
    if (!st || typeof st !== "object" || !st.a || typeof st.a !== "object") ss.s[schritt] = { a: {}, check: null, loesung: false, hilfe: false };
    return ss.s[schritt];
  }
  const signatur = a => JSON.stringify(Object.keys(a).sort().map(k => [k, a[k]]));
  function setzen(id, schritt, key, wert) {
    const st = schrittStand(id, schritt);
    if (wert === false || wert === "" || wert == null) delete st.a[key]; else st.a[key] = wert;
    st.t = Date.now();
    return speichern();
  }
  const antworten = (id, schritt) => clone(schrittStand(id, schritt).a);
  function journal() {
    const L = root.GENLERNSTAND;
    if (!L || typeof L.record !== "function") return;
    state.offen = state.offen.filter(ev => {
      try { const r = L.record(ev); return !!(r && !r.ok && r.event); }  /* только сбой записи повторяем позже */
      catch (e) { return true; }
    });
  }
  function pruefenSpeichern(id, schritt) {
    const sz = szVon(id), st = schrittStand(id, schritt);
    if (!Object.keys(st.a).length) return null;  /* пустой ответ не записываем в журнал */
    const r = pruefen(sz, schritt, st.a), sig = signatur(st.a);
    if (st.check && st.check.sig === sig) return Object.assign(r, { event: st.check.id, support: st.check.support, neu: false });
    /* «loesung» — решение открыто до проверки; «hilfe» — повтор после объяснений ошибок. */
    const support = st.loesung ? "loesung" : st.hilfe ? "hilfe" : "selbst", t = Date.now();
    const ev = { id: "normal:" + id + ":" + schritt + ":" + t + "-" + Math.random().toString(36).slice(2, 8), t, topic: "normalisierung", source: "normal",
      task: id + ":" + schritt, correct: r.correct, max: r.max, support, kind: "recognition", familiar: !!st.familiar, answers: clone(st.a),
      snapshot: { type: "normal", title: sz.titel + " · " + SCHRITTE.find(s => s.id === schritt).titel, question: sz.situation.join("\n") + "\n" + SCHRITTE.find(s => s.id === schritt).titel, solution: loesung(sz, schritt), explanation: satz(sz, schritt).map(x => x.join(" — ")).join("\n") } };
    st.check = { id: ev.id, t, correct: r.correct, max: r.max, voll: r.voll, support, sig };
    st.t = t;
    if (!Array.isArray(st.historie)) st.historie = [];
    st.historie.push(clone(ev));
    if (!r.voll) st.hilfe = true;
    state.offen.push(ev);
    journal();
    speichern();
    return Object.assign(r, { event: ev.id, support, neu: true });
  }
  function zeigen(id, schritt) { const st = schrittStand(id, schritt); st.loesung = true; st.t = Date.now(); speichern(); return loesung(szVon(id), schritt); }
  function resetSchritt(st) {
    const versuche = (Array.isArray(st.versuche) ? st.versuche : []).concat([{ a: clone(st.a), check: clone(st.check || null), t: st.t || 0 }]);
    Object.assign(st, { a: {}, check: null, loesung: false, hilfe: false, familiar: !!(st.familiar || st.hilfe || st.loesung || st.check), versuche, t: Date.now() });
  }
  function zuruecksetzen(id, schritt) { resetSchritt(schrittStand(id, schritt)); return speichern(); }
  function szZuruecksetzen(id) {
    const ss = szStand(id);
    Object.keys(ss.s).forEach(s => { if (ss.s[s] && ss.s[s].a) resetSchritt(ss.s[s]); });
    ss.schritt = 0; ss.t = Date.now(); return speichern();
  }
  function aktivSetzen(id, idx) {
    const ss = szStand(id);
    if (Number.isInteger(idx) && idx >= 0 && idx < SCHRITTE.length) {
      ss.schritt = idx; ss.t = Date.now();
      // Later tables and keys expose answers to previous steps (not anomalies).
      for (let i = 1; i < idx; i++) { const st = schrittStand(id, SCHRITTE[i].id); st.hilfe = true; st.t = Date.now(); }
      speichern();
    }
    return ss.schritt;
  }
  function status(id, schritt) {
    const st = state.sz[id] && state.sz[id].s && state.sz[id].s[schritt];
    if (!st) return "offen";
    if (st.check) return st.check.voll ? (st.check.support === "selbst" ? "ok" : "ok-hilfe") : "fehler";
    if (st.loesung) return "gezeigt";
    return st.a && Object.keys(st.a).length ? "begonnen" : "offen";
  }
  function fortschritt(id) {
    const r = { geprueft: 0, selbst: 0, gesamt: SCHRITTE.length };
    SCHRITT_IDS.forEach(s => { const x = status(id, s); if (x === "ok" || x === "ok-hilfe" || x === "fehler") r.geprueft++; if (x === "ok") r.selbst++; });
    return r;
  }
  const liste = () => szenarien().map(s => ({ id: s.id, titel: s.titel, ru: s.ru, fortschritt: fortschritt(s.id) }));

  /* ---------------- Интерфейс ---------------- */
  const $ = id => document.getElementById(id);
  const el = (t, c, s) => { const n = document.createElement(t); if (c) n.className = c; if (s != null) n.textContent = s; return n; };
  const de = (t, c, s) => { const n = el(t, c, s); n.lang = "de"; return n; };
  function button(text, fn, primary) { const b = el("button", "btn" + (primary ? " primary" : ""), text); b.type = "button"; b.onclick = fn; return b; }
  function karte(parent, titel, tag) { const c = el(tag || "section", "nf-card"); if (titel) c.appendChild(el("h2", null, titel)); parent.appendChild(c); return c; }
  function meldung() {
    const w = $("normalInhalt"); if (!w) return;
    let m = $("nfMeldung");
    const text = readError || saveError;
    if (!text) { if (m) m.remove(); return; }
    if (!m) { m = el("p", "nf-alert nf-card"); m.id = "nfMeldung"; m.setAttribute("role", "alert"); w.insertBefore(m, w.firstChild); }
    m.textContent = text;
  }
  function tabelle(t, opts) {
    const o = opts || {}, box = el("div", "nf-scroll"), tab = el("table", "nf-tab");
    box.tabIndex = 0; box.setAttribute("role", "region"); box.setAttribute("aria-label", "Таблица " + t.name);
    const cap = de("caption", o.ohneTitel ? "nf-sr" : null, t.name); tab.appendChild(cap);  /* при заголовке h3 подпись только для экранного диктора */
    const tr = el("tr");
    t.spalten.forEach(c => {
      const th = de("th", null, c); th.scope = "col";
      if (o.marken && t.pk && t.pk.includes(c)) { th.classList.add("nf-pk"); th.appendChild(el("span", "nf-marke", "PK")); }
      if (o.marken && t.fk && t.fk[c]) th.appendChild(el("span", "nf-marke nf-fk", "FK"));
      tr.appendChild(th);
    });
    const thead = el("thead"); thead.appendChild(tr); tab.appendChild(thead);
    const tb = el("tbody");
    (o.zeilen || []).forEach(z => {
      const r = el("tr");
      z.forEach(v => { const td = de("td"); if (Array.isArray(v)) v.forEach(x => td.appendChild(el("div", "nf-wert", x))); else td.textContent = v; r.appendChild(td); });
      tb.appendChild(r);
    });
    tab.appendChild(tb); box.appendChild(tab);
    return box;
  }
  const tabMitZeilen = (sz, t, marken, ohneTitel) => tabelle(t, { marken, ohneTitel, zeilen: projektion(sz, t.spalten) });
  const zumSchritt = () => { const z = document.querySelector(".nf-schritte"); if (z && z.scrollIntoView) z.scrollIntoView({ block: "start" }); };
  function infoKarte(parent) {
    const d = el("details", "nf-card nf-info");
    d.appendChild(el("summary", null, "Коротко о нормальных формах"));
    d.appendChild(el("p", null, "Цель нормализации — убрать избыточность (Redundanz) и аномалии: каждое сведение хранится один раз, в своей таблице."));
    const dl = el("dl", "nf-terms");
    [["Primärschlüssel (PK)", "первичный ключ: столбец(ы), которые однозначно определяют строку"],
      ["zusammengesetzter Schlüssel", "составной ключ: PK из нескольких столбцов"],
      ["Fremdschlüssel (FK)", "внешний ключ: столбец, который ссылается на PK другой таблицы"],
      ["funktionale Abhängigkeit (A → B)", "функциональная зависимость: зная A, однозначно знаешь B"],
      ["partielle Abhängigkeit", "частичная зависимость: атрибут зависит только от части составного ключа"],
      ["transitive Abhängigkeit", "транзитивная зависимость: ключ → неключевой атрибут → другой атрибут"],
      ["Redundanz", "избыточность: одно и то же значение хранится много раз"],
      ["Einfügeanomalie", "аномалия вставки: новые данные нельзя записать без других данных"],
      ["Löschanomalie", "аномалия удаления: вместе со строкой теряются другие нужные данные"],
      ["Änderungsanomalie", "аномалия изменения: одно изменение нужно делать во многих строках"],
      ["atomar", "атомарный: в ячейке одно неделимое значение"],
      ["Wiederholungsgruppe", "повторяющаяся группа: несколько однотипных значений в одной записи"]
    ].forEach(([d1, d2]) => { dl.appendChild(de("dt", null, d1)); dl.appendChild(el("dd", null, d2)); });
    d.appendChild(dl);
    d.appendChild(el("h3", null, "Правила"));
    const ol = el("ul");
    ["1. NF: все значения атомарны, повторяющихся групп нет.",
      "2. NF: 1NF и каждый неключевой атрибут зависит от всего ключа (нет partielle Abhängigkeit). Если ключ из одного столбца, таблица в 1NF уже во 2NF.",
      "3. NF: 2NF и ни один неключевой атрибут не зависит от другого неключевого атрибута (нет transitive Abhängigkeit)."
    ].forEach(x => ol.appendChild(el("li", null, x)));
    d.appendChild(ol);
    d.appendChild(el("h3", null, "Образцы ответа на экзамене"));
    [["Die Tabelle ist nicht in der 1. NF, weil die Spalte … mehrere Werte enthält.", "Таблица не в 1NF, потому что столбец … содержит несколько значений."],
      ["Die Tabelle ist nicht in der 2. NF, weil … nur von … abhängt.", "Таблица не во 2NF, потому что … зависит только от … (части ключа)."],
      ["Die Tabelle ist nicht in der 3. NF, weil … von … abhängt und … kein Schlüssel ist.", "Таблица не в 3NF, потому что … зависит от …, а … не ключ."]
    ].forEach(([x, y]) => { const p = el("div", "nf-satz"); p.appendChild(de("p", null, "„" + x + "“")); p.appendChild(el("p", "nf-muted", y)); d.appendChild(p); });
    parent.appendChild(d);
    return d;
  }
  function screen() {
    let s = $("scNormal"); if (s) return s;
    s = el("div", "seite nf-page"); s.id = "scNormal"; s.hidden = true;
    const w = el("div", "nf-wrap"); w.id = "normalInhalt"; s.appendChild(w);
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling); else document.body.appendChild(s);
    return s;
  }
  function verlauf(push) {
    const daten = { ihk: 1, seite: "scNormal", nf: view, nfs: view ? szStand(view).schritt : null };
    try {
      if (push) { if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, ""); history.pushState(daten, ""); }
      else if (history.state && history.state.seite === "scNormal") history.replaceState(daten, "");
    } catch (e) { /* Verlauf ist optional */ }
  }
  function oeffnen(id, fromHistory, schritt) {
    const sz = findSz(id);
    view = sz ? sz.id : null;
    if (sz && Number.isInteger(schritt) && schritt >= 0 && schritt < SCHRITTE.length) szStand(sz.id).schritt = schritt;
    const s = screen();
    document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
    ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { if ($(k)) $(k).hidden = true; });
    if ($("kopfTitel")) $("kopfTitel").hidden = false;
    if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · Datenbanken · Normalisierung";
    if ($("kTitel")) $("kTitel").textContent = sz ? sz.titel : "Нормализация шаг за шагом";
    if (!fromHistory) verlauf(true);
    zeichnen();
    if (root.GENZURUECK) root.GENZURUECK.knopfPflegen();
    root.scrollTo(0, 0);
  }
  function zeichnen() {
    const w = $("normalInhalt"); if (!w) return;
    w.replaceChildren();
    meldung();
    try { if (view) szenarioAnsicht(w, findSz(view)); else listeAnsicht(w); }
    catch (e) { const p = el("p", "nf-alert nf-card", "Ошибка отображения: " + e.message); p.setAttribute("role", "alert"); w.appendChild(p); }
  }
  function fortschrittText(id) {
    const f = fortschritt(id);
    if (!f.geprueft) return "Ещё не начат";
    return "Проверено шагов: " + f.geprueft + " из " + f.gesamt + " · верно выбраны ответы без подсказок: " + f.selbst;
  }
  function listeAnsicht(w) {
    const k = karte(w, "Нормализация шаг за шагом");
    k.appendChild(el("p", null, "Один пример — шесть шагов: аномалии → 1NF → первичный ключ → 2NF → 3NF → модель с PK, FK и связями. Каждый шаг программа проверяет сразу и объясняет ошибки по-русски. Это узнавание и выбор ответов, а не самостоятельное составление схемы."));
    k.appendChild(el("p", "nf-muted", "На экзамене это частое задание в GA1 и GA2: «Überführen Sie die Tabelle in die 3. Normalform», «Erstellen Sie ein relationales Datenmodell». Сценарии авторские, в духе экзамена."));
    const l = el("div", "nf-liste");
    szenarien().forEach(sz => {
      const b = button("", () => oeffnen(sz.id));
      b.appendChild(de("span", "nf-l-titel", sz.titel));
      b.appendChild(el("span", "nf-muted", sz.ru));
      const f = fortschritt(sz.id);
      const st = el("span", "nf-muted nf-l-stand", fortschrittText(sz.id));
      if (f.selbst === f.gesamt) { st.classList.add("nf-ok"); b.classList.add("nf-fertig"); }
      b.appendChild(st);
      l.appendChild(b);
    });
    k.appendChild(l);
    infoKarte(w);
  }
  const STATUS_ZEICHEN = { ok: "✓", "ok-hilfe": "✓", fehler: "✗", gezeigt: "◐", begonnen: "…", offen: "" };
  const STATUS_TEXT = { ok: "верно", "ok-hilfe": "верно с подсказкой", fehler: "есть ошибки", gezeigt: "решение открыто", begonnen: "начат", offen: "не начат" };
  function szenarioAnsicht(w, sz) {
    const ss = szStand(sz.id), idx = ss.schritt || 0;
    aktivSetzen(sz.id, idx);
    const kopf = karte(w, null);
    kopf.appendChild(de("h2", null, sz.titel));
    kopf.appendChild(el("p", "nf-muted", sz.ru + " · " + fortschrittText(sz.id)));
    const act = el("div", "nf-actions");
    act.appendChild(button("← Все сценарии", () => oeffnen(null)));
    let sicher = false;
    const neu = button("Начать сценарий заново", () => {
      if (!sicher) { sicher = true; neu.textContent = "Точно? Ответы всех шагов сотрутся — нажми ещё раз"; return; }
      szZuruecksetzen(sz.id); verlauf(false); zeichnen();
    });
    act.appendChild(neu);
    kopf.appendChild(act);
    infoKarte(w);

    const sit = karte(w, "Ситуация");
    sz.situation.forEach(x => sit.appendChild(de("p", "nf-de", x)));
    const ue = el("details", "nf-uebers"); ue.appendChild(el("summary", null, "Перевод")); ue.appendChild(el("p", null, sz.situationRu)); sit.appendChild(ue);
    const aus = el("details", "nf-ausgang"); aus.open = idx <= 1;
    aus.appendChild(el("summary", null, "Исходная таблица «" + sz.ausgang.name + "» (не нормализована)"));
    aus.appendChild(tabelle(sz.ausgang, { zeilen: sz.ausgang.zeilen }));
    aus.appendChild(el("p", "nf-muted", "Несколько строк в одной ячейке = несколько значений в одной записи. Таблицу можно прокрутить вбок."));
    sit.appendChild(aus);

    const nav = el("nav", "nf-schritte"); nav.setAttribute("aria-label", "Шаги нормализации");
    SCHRITTE.forEach((s, i) => {
      const st = status(sz.id, s.id), b = button(i + " · " + s.kurz + (STATUS_ZEICHEN[st] ? " " + STATUS_ZEICHEN[st] : ""), () => {
        aktivSetzen(sz.id, i); verlauf(false); zeichnen();
        zumSchritt();
      });
      b.classList.add("nf-st-" + st);
      b.setAttribute("aria-label", "Шаг " + i + ": " + s.kurz + " — " + STATUS_TEXT[st]);
      if (i === idx) b.setAttribute("aria-current", "step");
      nav.appendChild(b);
    });
    w.appendChild(nav);
    schrittAnsicht(w, sz, idx);
  }
  function schrittAnsicht(w, sz, idx) {
    const S = SCHRITTE[idx], st = schrittStand(sz.id, S.id), k = karte(w, S.titel);
    k.id = "nfSchritt";
    /* Шаги 1…idx-1 раскрывают ответы предыдущих; аномалии (шаг 0) ничего не подсказывают. */
    const offen = SCHRITTE.findIndex((s, i) => i >= 1 && i < idx && ["offen", "begonnen"].includes(status(sz.id, s.id)));
    if (offen >= 1) {
      const h = el("div", "nf-hinweis");
      h.appendChild(el("p", null, "Шаг " + offen + " («" + SCHRITTE[offen].kurz + "») ещё не проверен. Здесь уже видны его ответы — лучше сначала реши его."));
      h.appendChild(button("К шагу " + offen, () => { aktivSetzen(sz.id, offen); verlauf(false); zeichnen(); }));
      k.appendChild(h);
    }
    const itemsBox = el("div", "nf-items");
    const ergebnis = el("p", "nf-ergebnis"); ergebnis.setAttribute("aria-live", "polite");
    const loesBox = el("div", "nf-loesung");
    const knoten = {};
    const geaendert = key => {
      const n = knoten[key]; if (n) { n.classList.remove("ok", "falsch"); const f = n.querySelector(".nf-feedback"); if (f) f.remove(); }
      if (st.check) ergebnis.textContent = "Ответ изменён — нажми «Проверить» ещё раз.";
    };
    const set = (key, v, itemKey) => {
      if (!setzen(sz.id, S.id, key, v)) ergebnis.textContent = saveError;
      geaendert(itemKey || key);
    };
    const item = (key, kopf) => { const d = el("div", "nf-item"); d.dataset.key = key; if (kopf) d.appendChild(kopf); itemsBox.appendChild(d); knoten[key] = d; return d; };
    const auswahl = (key, opts, txt) => {
      const lab = el("label", "nf-feld"); lab.appendChild(el("span", "nf-frage", txt));
      const s = el("select"); [["", "— выбрать —"]].concat(opts).forEach(([v, t]) => { const o = el("option", null, t); o.value = v; s.appendChild(o); });
      s.value = st.a[key] || ""; s.dataset.a = key; s.onchange = () => set(key, s.value); lab.appendChild(s); return lab;
    };
    const kaestchen = (key, txt, itemKey, sprache) => {
      const lab = el("label", "nf-check"), c = el("input"); c.type = "checkbox"; c.checked = st.a[key] === true; c.dataset.a = key;
      c.onchange = () => set(key, c.checked, itemKey);
      const sp = el("span", null, txt); if (sprache) sp.lang = "de";
      lab.append(c, sp); return lab;
    };

    if (S.id === "anomalie") {
      k.appendChild(el("p", null, "Ниже три изменения данных в исходной таблице. Какая аномалия возникает в каждом случае? Все три — следствие избыточности (Redundanz): одни и те же сведения хранятся в нескольких строках."));
      sz.anomalien.forEach((x, i) => { const d = item(String(i)); d.appendChild(auswahl(String(i), ANOMALIE, (i + 1) + ". " + x.text)); });
    } else if (S.id === "nf1") {
      k.appendChild(el("p", null, "Отметь столбцы исходной таблицы, которые нарушают 1NF: в ячейке несколько частей (значение не атомарно) или несколько значений (повторяющаяся группа, Wiederholungsgruppe)."));
      sz.ausgang.spalten.forEach((s, i) => {
        const v = sz.ausgang.zeilen[0][i], bsp = Array.isArray(v) ? v.join(" | ") : v;
        const d = item(s); d.appendChild(kaestchen(s, s + " — например: «" + bsp + "»", s, true));
      });
    } else if (S.id === "schluessel") {
      k.appendChild(el("p", null, "Таблица уже в 1NF: в каждой ячейке одно значение. Отметь столбцы первичного ключа (Primärschlüssel) — минимальный набор, который однозначно определяет каждую строку."));
      k.appendChild(tabelle(sz.nf1, { zeilen: sz.nf1.zeilen }));
      sz.nf1.spalten.forEach(c => { const d = item(c); d.appendChild(kaestchen(c, c, c, true)); });
    } else if (S.id === "nf2") {
      k.appendChild(el("p", null, "Первичный ключ: (" + plus(sz.schluessel) + "). Для каждого неключевого атрибута выбери, от чего он функционально зависит: от всего ключа или только от части. Зависимость от части ключа — partielle Abhängigkeit, она нарушает 2NF."));
      k.appendChild(tabelle(Object.assign({}, sz.nf1, { pk: sz.schluessel, fk: {} }), { marken: true, zeilen: sz.nf1.zeilen }));
      const opts = nf2Optionen(sz);
      nichtSchluessel(sz).forEach(A => { const d = item(A); d.appendChild(auswahl(A, opts, A + " зависит…")); });
    } else if (S.id === "nf3") {
      k.appendChild(el("p", null, "Это таблицы во 2NF. Для каждого неключевого атрибута выбери: он зависит напрямую от ключа своей таблицы или от другого неключевого атрибута (transitive Abhängigkeit — нарушает 3NF)."));
      const punkte = nf3Punkte(sz);
      sz.nf2.forEach(t => {
        const h = de("h3", null, "Tabelle " + t.name); itemsBox.appendChild(h);
        itemsBox.appendChild(tabMitZeilen(sz, t, true, true));
        const ns = t.spalten.filter(c => !t.pk.includes(c));
        if (ns.length < 2) { itemsBox.appendChild(el("p", "nf-muted", ns.length ? "Здесь только один неключевой атрибут (" + ns[0] + ") — транзитивной зависимости быть не может. Таблица уже в 3NF." : "Неключевых атрибутов нет — таблица уже в 3NF.")); return; }
        punkte.filter(p => p.tab === t).forEach(p => { const d = item(p.key); d.appendChild(auswahl(p.key, p.optionen, p.attr + " зависит…")); });
      });
    } else if (S.id === "modell") {
      k.appendChild(el("p", null, "Это итоговые таблицы в 3NF. Отметь в каждой первичный ключ (PK) и внешние ключи (FK), затем выбери кардинальность связей."));
      sz.nf3.forEach(t => {
        itemsBox.appendChild(de("h3", null, "Tabelle " + t.name));
        itemsBox.appendChild(tabMitZeilen(sz, t, false, true));
        const p = item("pk:" + t.name, el("p", "nf-frage", "Primärschlüssel (PK) — первичный ключ:"));
        t.spalten.forEach(c => p.appendChild(kaestchen("pk:" + t.name + ":" + c, c, "pk:" + t.name, true)));
        const f = item("fk:" + t.name, el("p", "nf-frage", "Fremdschlüssel (FK) — внешние ключи (может не быть ни одного):"));
        t.spalten.forEach(c => f.appendChild(kaestchen("fk:" + t.name + ":" + c, c, "fk:" + t.name, true)));
      });
      itemsBox.appendChild(el("h3", null, "Связи (Beziehungen)"));
      itemsBox.appendChild(el("p", "nf-muted", "«A 1 : n B» — одна запись A связана со многими записями B. Читай пару слева направо."));
      sz.beziehungen.forEach((b, i) => { const d = item("rel:" + i); const l = auswahl("rel:" + i, KARD, b.a + " — " + b.b); l.firstChild.lang = "de"; d.appendChild(l); });
    }
    k.appendChild(itemsBox);

    const acts = el("div", "nf-actions");
    acts.appendChild(button("Проверить", () => {
      const r = pruefenSpeichern(sz.id, S.id);
      if (!r) { ergebnis.textContent = "Сначала выбери ответы — пустой шаг не проверяю."; return; }
      markieren(r); weiterZeigen(); loesungZeichnen(); kopfNeu();
    }, true));
    acts.appendChild(button("Показать правильно", () => { zeigen(sz.id, S.id); markieren(pruefen(sz, S.id, st.a)); loesungZeichnen(); weiterZeigen(); kopfNeu(); }));
    acts.appendChild(button("Пройти шаг заново", () => { zuruecksetzen(sz.id, S.id); zeichnen(); zumSchritt(); }));
    k.appendChild(acts);
    k.appendChild(ergebnis);
    const weiter = el("div", "nf-actions nf-weiter"); k.appendChild(weiter);
    k.appendChild(loesBox);

    function kopfNeu() {
      /* Статус в навигации обновить, не теряя прокрутку */
      document.querySelectorAll(".nf-schritte .btn").forEach((b, i) => {
        const x = status(sz.id, SCHRITTE[i].id);
        b.className = "btn nf-st-" + x;
        b.textContent = i + " · " + SCHRITTE[i].kurz + (STATUS_ZEICHEN[x] ? " " + STATUS_ZEICHEN[x] : "");
        b.setAttribute("aria-label", "Шаг " + i + ": " + SCHRITTE[i].kurz + " — " + STATUS_TEXT[x]);
      });
    }
    function markieren(r) {
      const cur = schrittStand(sz.id, S.id), aktuell = cur.check && cur.check.sig === signatur(cur.a);
      r.items.forEach(x => {
        const n = knoten[x.key]; if (!n) return;
        const alt = n.querySelector(".nf-feedback"); if (alt) alt.remove();
        n.classList.remove("ok", "falsch");
        if (!aktuell && !cur.loesung) return;
        const fb = el("div", "nf-feedback");
        if (aktuell) { n.classList.add(x.ok ? "ok" : "falsch"); fb.appendChild(el("p", "nf-mark", x.ok ? "✓ верно" : "✗ неверно")); }
        if (cur.loesung) fb.appendChild(el("p", "nf-richtig", "Правильно: " + x.richtig));
        if (!x.ok || cur.loesung) {
          fb.appendChild(el("p", "nf-erkl", x.erkl));
          if (x.de) fb.appendChild(de("p", "nf-erkl nf-satz", "„" + x.de + "“"));
        }
        n.appendChild(fb);
      });
      ergebnis.replaceChildren();
      if (aktuell) {
        const c = cur.check;
        ergebnis.appendChild(el("span", "nf-muted", cur.familiar ? "Повтор знакомого примера: выбор ответов, не самостоятельное построение модели." : "Проверка выбора ответов; самостоятельное построение модели здесь не проверяется."));
        ergebnis.appendChild(el("span", c.voll ? "nf-ok" : "nf-fehler", c.voll ? "✓ Всё верно: " + c.correct + " из " + c.max + "." : "Верно " + c.correct + " из " + c.max + ". Объяснения — под пунктами с ✗. Исправь и проверь снова или нажми «Показать правильно»."));
        if (c.support !== "selbst") ergebnis.appendChild(el("span", "nf-muted", c.support === "loesung" ? "Проверено после открытого решения — в журнале как «с решением»." : "Повторная проверка после объяснений — в журнале как «с подсказкой»."));
        else if (!c.voll) ergebnis.appendChild(el("span", "nf-muted", "Следующая проверка этого шага будет считаться «с подсказкой»: объяснения уже видны. «Пройти шаг заново» оставляет отметку знакомства с ответом; для самостоятельного применения нужен другой пример."));
        r.hinweise.forEach(h => ergebnis.appendChild(el("span", "nf-muted", h)));
      } else if (cur.loesung) ergebnis.appendChild(el("span", "nf-muted", "Решение открыто. Сравни со своими ответами; проверка после этого записывается как «с решением»."));
    }
    function weiterZeigen() {
      weiter.replaceChildren();
      const cur = schrittStand(sz.id, S.id);
      if (!cur.check && !cur.loesung) return;
      if (idx < SCHRITTE.length - 1) weiter.appendChild(button("Дальше: шаг " + (idx + 1) + " · " + SCHRITTE[idx + 1].kurz, () => {
        aktivSetzen(sz.id, idx + 1); verlauf(false); zeichnen(); zumSchritt();
      }, true));
      else {
        const naechst = szenarien()[(szenarien().indexOf(sz) + 1) % szenarien().length];
        weiter.appendChild(button("Все сценарии", () => oeffnen(null), true));
        if (naechst && naechst !== sz) weiter.appendChild(button("Следующий сценарий: " + naechst.titel, () => oeffnen(naechst.id)));
      }
    }
    function loesungZeichnen() {
      loesBox.replaceChildren();
      const cur = schrittStand(sz.id, S.id);
      if (!(cur.loesung || (cur.check && cur.check.voll))) return;
      const sk = satz(sz, S.id);
      const blockSatz = () => sk.forEach(([x, y]) => { const p = el("div", "nf-satz"); p.appendChild(el("p", "nf-muted", "Так можно ответить на экзамене:")); p.appendChild(de("p", null, "„" + x + "“")); p.appendChild(el("p", "nf-muted", y)); loesBox.appendChild(p); });
      if (S.id === "anomalie") loesBox.appendChild(el("p", null, "Все три аномалии возникают из-за избыточности (Redundanz). После нормализации каждое сведение хранится один раз — и аномалии исчезают."));
      if (S.id === "nf1") {
        loesBox.appendChild(el("h3", null, "Таблица в 1NF"));
        loesBox.appendChild(tabelle(sz.nf1, { zeilen: sz.nf1.zeilen }));
        loesBox.appendChild(el("p", "nf-muted", "Каждое значение — в своей строке, составные значения разделены на столбцы. Видно, что данные участника/клиента теперь повторяются — это уберут 2NF и 3NF."));
      }
      if (S.id === "schluessel") loesBox.appendChild(el("p", null, "Первичный ключ таблицы 1NF: (" + plus(sz.schluessel) + ")."));
      if (S.id === "nf2") {
        loesBox.appendChild(el("h3", null, "Таблицы во 2NF"));
        sz.nf2.forEach(t => loesBox.appendChild(tabMitZeilen(sz, t, true)));
        loesBox.appendChild(el("p", "nf-muted", "Каждый атрибут, зависящий от части ключа, переехал в таблицу с этой частью как PK. Повторов стало меньше."));
      }
      if (S.id === "nf3") {
        loesBox.appendChild(el("h3", null, "Таблицы в 3NF"));
        sz.nf3.forEach(t => loesBox.appendChild(tabMitZeilen(sz, t, false)));
        loesBox.appendChild(el("p", "nf-muted", "Транзитивно зависимые атрибуты вынесены в отдельные таблицы вместе со своей детерминантой. PK и FK отметишь на шаге 5."));
      }
      if (S.id === "modell") {
        loesBox.appendChild(el("h3", null, "Relationales Datenmodell — запись как на экзамене"));
        const pre = de("pre", "nf-notation", notation(sz).join("\n")); loesBox.appendChild(pre);
        loesBox.appendChild(el("h3", null, "Связи"));
        const ul = el("ul", "nf-rel");
        sz.beziehungen.forEach(b => { const li = el("li"); li.appendChild(de("b", null, beziehungText(b))); li.appendChild(de("span", "nf-muted", b.de)); ul.appendChild(li); });
        loesBox.appendChild(ul);
        sz.nf3.forEach(t => loesBox.appendChild(tabMitZeilen(sz, t, true)));
      }
      blockSatz();
    }
    markieren(pruefen(sz, S.id, st.a));
    loesungZeichnen();
    weiterZeigen();
  }
  function hook() {
    const old = root.schirm;
    if (typeof old === "function" && !old.__nf) {
      const neu = function (name) {
        if (name === "scNormal") { const hs = history.state || {}; oeffnen(hs.nf, true, hs.nfs); return; }
        const s = $("scNormal"); if (s) s.hidden = true;
        return old.apply(this, arguments);
      };
      neu.__nf = true; root.schirm = neu;
    }
    root.addEventListener("popstate", e => {
      const st = e.state || {};
      if (st.seite === "scNormal") { oeffnen(st.nf, true, st.nfs); return; }
      /* Если общий «Zurück» ещё не знает этот экран — уйти самим. */
      const s = $("scNormal");
      if (s && !s.hidden && typeof root.schirm === "function") {
        root.schirm(st.seite || "scStart");
        if ((st.seite || "scStart") === "scStart" && typeof root.renderStart === "function") { try { root.renderStart(); } catch (x) { /* Start zeichnet sich selbst */ } }
      }
    });
    const vorher = state.offen.length; journal(); if (state.offen.length !== vorher) speichern();
    if (root.GENSTART && root.GENSTART.kopfAktualisieren) root.GENSTART.kopfAktualisieren();
  }

  const api = { SCHRITTE: clone(SCHRITTE), oeffnen: (id, schritt) => oeffnen(id, false, schritt), liste, stand: () => clone(state), fehler: () => readError || saveError,
    huelle, nf1Richtig, nf2Ziel, nf3Ziel, nf3Punkte, nf2Optionen, loesung, pruefen, satz, notation, beziehungText, projektion, gegenbeispiel,
    setzen, antworten, pruefenSpeichern, zeigen, zuruecksetzen, szZuruecksetzen, aktivSetzen, status, fortschritt };
  root.GENNORMAL = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hasDom) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook(); }
})(typeof window !== "undefined" ? window : globalThis);
