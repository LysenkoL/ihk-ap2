/* ============================================================================
   gen/operatoren-uebung.js — Тренажёр операторов: «что от меня хотят?»
   ----------------------------------------------------------------------------
   В экзамене глагол задания (Operator) решает, сколько и как писать:
   nennen — только пункты, erläutern — пункт + что он даёт, begründen —
   причина, beurteilen — вывод с оценкой …

   Раунд из 10 вопросов:
     • «op»    — какой оператор и что он требует (4 варианта по-русски);
     • «zahl»  — сколько пунктов нужно (zwei / drei / jeweils / mindestens);
     • «genug» — достаточно ли короткого ответа (только авторские фразы).

   Источник фраз:
     1. Настоящие формулировки GA из личного пакета (GENAZUBI). Они живут
        ТОЛЬКО в памяти открытой вкладки: в localStorage и журнал попадают
        лишь ссылки вида "ga:ga2-2025-w-3b#0", никогда сам текст.
     2. Запасной набор — авторские фразы в стиле экзамена (ниже, FALLBACK).

   Распознавание: те же regex и «rang», что в gen/operatoren.js (GENOP).
   Если GENOP загружен, regex и rang берутся оттуда — так оба модуля не
   разойдутся. Русские описания — свои.
   ========================================================================== */
"use strict";
(function (root) {
  const SK = "ap2:opueb", hasDom = typeof document !== "undefined", RUNDE_N = 10;
  const kopie = x => JSON.parse(JSON.stringify(x));

  /* ---------------------------------------------------------------------
     Каталог. regex и rang — копия gen/operatoren.js (тест следит за этим).
     ru      — что требуется (это и есть варианты ответа в вопросе «op»)
     umfang  — сколько писать;  falle — типичная ловушка
     muster  — немецкий шаблон ответа простыми словами
     ------------------------------------------------------------------ */
  const KATALOG = [
    { key: "nennen", rang: 1, verb: "nennen", name: "Nennen / Aufzählen",
      regex: /\bnennen\b|\baufz(ä|ae)hlen\b|\bgeben sie .* an\b/i,
      ru: "Только назвать пункты — слова, без объяснений",
      umfang: "Одно слово или короткая фраза на пункт, каждый с новой строки. Ровно столько, сколько просят.",
      falle: "Длинный текст баллов не добавит — только съест время. Лишние пункты часто не засчитывают: проверяют первые N.",
      muster: "1. Begriff\n2. Begriff\n(nur Stichworte)" },
    { key: "beschreiben", rang: 2, verb: "beschreiben", name: "Beschreiben / Darstellen",
      regex: /\bbeschreiben\b|\bdarstellen\b|\bschildern\b/i,
      ru: "Описать своими словами, как это устроено или в каком порядке идёт — без оценки",
      umfang: "2–4 предложения, по порядку, без своего мнения.",
      falle: "Одних слов мало — нужны полные предложения. Но «weil» и оценка здесь не требуются.",
      muster: "Zuerst … . Danach … . Zum Schluss … ." },
    { key: "erklaeren", rang: 3, verb: "erklären", name: "Erklären",
      regex: /\berkl(ä|ae)ren\b|\bwas versteht man\b|\bwie funktioniert\b/i,
      ru: "Объяснить, что это такое и как работает (причина → следствие)",
      umfang: "2–4 предложения: что это, зачем, как работает.",
      falle: "Один термин ничего не объясняет. Скажи, ЧТО это и ЗАЧЕМ оно нужно.",
      muster: "… ist … . Es dient dazu, … . Dadurch … ." },
    { key: "erlaeutern", rang: 4, verb: "erläutern", name: "Erläutern",
      regex: /\berl(ä|ae)utern\b/i,
      ru: "Назвать пункт и раскрыть его: что он даёт, с примером или связью с ситуацией",
      umfang: "На каждый пункт 1–2 полных предложения: пункт + что он даёт / пример.",
      falle: "Самая частая потеря баллов: написано только слово («Verschlüsselung»). Нужно: что это даёт в этой ситуации.",
      muster: "… , weil … . Zum Beispiel … ." },
    { key: "begruenden", rang: 5, verb: "begründen", name: "Begründen",
      regex: /\bbegr(ü|ue)nden\b|\bwarum\b|\bweshalb\b|\bwieso\b/i,
      ru: "Обосновать: утверждение + причина (weil / da / damit)",
      umfang: "На каждую причину предложение с «weil / da / damit». Две причины — две РАЗНЫЕ причины.",
      falle: "Без «weil / damit / dadurch» это не обоснование. И нужна связь с ситуацией из задания.",
      muster: "Ich wähle … , weil … . Dadurch … ." },
    { key: "beurteilen", rang: 6, verb: "beurteilen", name: "Beurteilen / Bewerten / Stellung nehmen",
      regex: /\bbeurteilen\b|\bbewerten\b|\bstellung nehmen\b|\bw(ä|ae)gen sie ab\b|\babw(ä|ae)gen\b/i,
      ru: "Взвесить плюсы и минусы и сделать вывод с оценкой",
      umfang: "За — 1–2 предложения, против — 1–2 предложения, в конце свой вывод.",
      falle: "Без последнего предложения-вывода («Insgesamt …») полных баллов нет.",
      muster: "Dafür spricht … . Dagegen spricht … . Insgesamt … , weil … ." },
    { key: "vergleichen", rang: 4, verb: "vergleichen", name: "Vergleichen / Gegenüberstellen / Unterscheiden",
      regex: /\bvergleichen\b|\bgegen(ü|ue)berstellen\b|\bunterscheiden\b|\bworin unterscheiden\b|\bunterschied\b/i,
      ru: "Сравнить обе стороны по одним и тем же признакам",
      umfang: "На каждый признак одно предложение, где есть ОБЕ стороны.",
      falle: "Сначала всё про A, потом всё про B — это не сравнение. В каждом предложении — обе стороны.",
      muster: "Bei A ist … , bei B dagegen … ." },
    { key: "empfehlen", rang: 5, verb: "empfehlen", name: "Empfehlen / Entscheiden / Vorschlagen",
      regex: /\bempfehlen\b|\bentscheiden\b|\bvorschlagen\b|\bwelche .* w(ä|ae)hlen\b|\bwof(ü|ue)r entscheiden\b/i,
      ru: "Выбрать один вариант и обосновать выбор через ситуацию",
      umfang: "Одно предложение — решение, потом 1–2 причины из ситуации задания.",
      falle: "«Возможно и то, и другое» = 0 баллов. Выбери один вариант.",
      muster: "Ich empfehle … , weil … . Außerdem … ." },
    { key: "berechnen", rang: 3, verb: "berechnen", name: "Berechnen / Ermitteln",
      regex: /\bberechnen\b|\bermitteln\b|\brechnen sie\b|\brechenweg\b/i,
      ru: "Рассчитать: ход решения и результат с единицей",
      umfang: "Каждый шаг — строка: подход, промежуточный результат, ответ с единицей.",
      falle: "Без хода решения и единицы теряются верные баллы. За ход решения дают баллы, даже если ответ неверный.",
      muster: "Ansatz: … \nRechnung: … = … \nErgebnis: … (mit Einheit)" },
    { key: "pruefen", rang: 4, verb: "prüfen", name: "Prüfen / Überprüfen / Kontrollieren",
      regex: /\bpr(ü|ue)fen sie\b|\b(ü|ue)berpr(ü|ue)fen\b|\bkontrollieren\b|\btrifft .* zu\b/i,
      ru: "Проверить по критерию и ответить «да / нет» с шагом проверки",
      umfang: "Критерий → проверка → ответ «да / нет» в одном предложении.",
      falle: "Одного «ja» или «nein» мало — нужен шаг проверки.",
      muster: "Kriterium: … . Hier gilt: … . Also: ja / nein, weil … ." }
  ];
  /* Часто путаемые пары — из них в первую очередь берутся неверные варианты. */
  const AEHNLICH = {
    nennen: ["beschreiben", "erlaeutern"],
    beschreiben: ["erklaeren", "erlaeutern", "nennen"],
    erklaeren: ["beschreiben", "erlaeutern"],
    erlaeutern: ["beschreiben", "erklaeren", "begruenden", "nennen"],
    begruenden: ["erlaeutern", "beurteilen", "empfehlen"],
    beurteilen: ["begruenden", "vergleichen", "empfehlen"],
    vergleichen: ["beschreiben", "beurteilen"],
    empfehlen: ["beurteilen", "begruenden"],
    berechnen: ["pruefen", "nennen"],
    pruefen: ["beurteilen", "berechnen"]
  };
  /* regex / rang синхронно с GENOP, если он уже загружен (в браузере). */
  function abgleichen() {
    const G = root.GENOP && Array.isArray(root.GENOP.OPERATOREN) ? root.GENOP.OPERATOREN : null;
    if (!G) return;
    KATALOG.forEach(o => { const g = G.find(x => x && x.key === o.key); if (g && g.regex instanceof RegExp) { o.regex = g.regex; o.rang = g.rang; } });
  }
  abgleichen();
  const opVon = key => KATALOG.find(o => o.key === key) || null;

  /* ---------------------------------------------------------- Распознавание */
  /** Все найденные операторы (в порядке каталога). */
  function alleTreffer(text) { const t = String(text == null ? "" : text); return KATALOG.filter(o => o.regex.test(t)); }
  /** Как GENOP.erkenne: при нескольких — самый требовательный (rang), при равенстве — первый в каталоге. */
  function erkenne(text) {
    let best = null;
    alleTreffer(text).forEach(o => { if (!best || o.rang > best.rang) best = o; });
    return best;
  }
  const globalRe = re => new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  /** Позиции глагола(ов) для подсветки: [{s, e, cls}] без пересечений. */
  function verbStellen(text) {
    const t = String(text || ""), win = erkenne(t), out = [];
    alleTreffer(t).forEach(o => {
      const re = globalRe(o.regex); let m;
      while ((m = re.exec(t))) { if (!m[0]) { re.lastIndex++; continue; } out.push({ s: m.index, e: m.index + m[0].length, cls: o === win ? "ou-verb" : "ou-verb2" }); }
    });
    return ohneUeberlappung(out);
  }
  function ohneUeberlappung(list) {
    const res = [];
    list.slice().sort((a, b) => a.s - b.s || (a.cls === "ou-verb" ? -1 : 1)).forEach(x => {
      if (!res.length || x.s >= res[res.length - 1].e) res.push(x);
    });
    return res;
  }

  /* ------------------------------------------------------- Сколько пунктов */
  const ZAHLWORT = { zwei: 2, drei: 3, vier: 4, "fünf": 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10 };
  const EINS = /^(ein|eine|einen|einem|einer)$/i;
  const NICHT_ZAEHLEN = /^(punkte?n?|p|minuten?|min|stunden?|std|tage?n?|wochen?|monate?n?|jahre?n?|prozent|euro|eur|cent|byte|bytes|bit|kb|mb|gb|tb|kbit|mbit|gbit|ghz|mhz|nachkommastellen|dezimalstellen|stellen|uhr|mal|zeichen)$/i;
  const VOR_NICHT = /^(aufgabe|tabelle|anlage|abbildung|abb|version|zeile|zeilen|schritt|seite|kapitel|nr|raum|stufe|ebene|normalform|level|layer|punkt|teil|teilaufgabe|listing|zeitpunkt)$/i;
  const VOR_NICHT_ZIFFER = /^(um|bis|von|ab|vom|zum|seit|nach|vor|über|unter|ca|etwa)$/i;
  /**
   * Сколько пунктов просят?  → {n, jeweils, mindestens, objekte, s, e, wort} | null
   * Ищем после «Sie» / после глагола — числа из описания ситуации не в счёт.
   */
  function anzahl(text) {
    const t = String(text || "");
    const sie = t.search(/\bSie\b/), op = erkenne(t), oi = op ? t.search(op.regex) : -1;
    const start = [sie, oi].filter(x => x >= 0).reduce((a, b) => Math.min(a, b), t.length);
    if (start >= t.length) return null;
    const re = /[A-Za-zÄÖÜäöüß]+|\d+(?:[.,]\d+)?\.?/g;
    const toks = []; let m;
    while ((m = re.exec(t))) toks.push({ w: m[0], s: m.index, e: m.index + m[0].length });
    const kand = [];
    toks.forEach((k, i) => {
      if (k.s < start) return;
      const vor = toks[i - 1] ? toks[i - 1].w.toLowerCase() : "", nach = toks[i + 1] ? toks[i + 1].w : "";
      const zwischen = toks[i + 1] ? t.slice(k.e, toks[i + 1].s) : "";
      let n = null;
      const low = k.w.toLowerCase();
      if (ZAHLWORT[low]) n = ZAHLWORT[low];
      else if (/^([2-9]|10)$/.test(k.w)) {
        /* Ziffer nur vor einem Nomen: „3 Testarten“, nicht „Tabelle 3“, „2. NF“, „4 Punkte“ */
        if (!/^\s+$/.test(zwischen) || !/^[A-ZÄÖÜ]/.test(nach)) return;
        if (VOR_NICHT_ZIFFER.test(vor)) return;
        n = +k.w;
      } else if (EINS.test(k.w) && /^(jeweils|je|mindestens|genau)$/.test(vor)) n = 1;
      if (n == null) return;
      if (VOR_NICHT.test(vor)) return;
      if (nach && NICHT_ZAEHLEN.test(nach) && /^\s+$/.test(zwischen)) return;
      kand.push({ n, s: k.s, e: k.e, wort: k.w, jeweils: /^(jeweils|je)$/.test(vor), mindestens: vor === "mindestens" });
    });
    if (!kand.length) return null;
    /* «jeweils zwei» важнее, чем число объектов перед ним («für drei Systeme jeweils zwei …») */
    const jw = kand.find(k => k.jeweils);
    let wahl = jw || kand[0], jeweils = !!jw;
    if (!jw) {
      /* «Nennen Sie jeweils auch zwei …» — jeweils не прямо перед числом, но число после него */
      const jIdx = t.slice(start).search(/\bjeweils\b/i);
      const nach = jIdx >= 0 ? kand.find(k => k.s > start + jIdx) : null;
      if (nach) { wahl = nach; jeweils = true; }
    }
    /* Сумма частей: «drei Vorteile und einen Nachteil» = 3 + 1, «einen Vor- und Nachteil» = 1 + 1 */
    let n = wahl.n, e = wahl.e;
    const teile = [wahl.n], hinten = t.slice(wahl.e);
    const pm = /^((?:\s+[A-Za-zÄÖÜäöüß-]+){1,2}?)\s+und\s+(zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|[2-9]|10|ein|eine|einen|einem|einer)\b/i.exec(hinten);
    const pv = /^\s+[A-Za-zÄÖÜäöüß]+-\s+und\s+[A-Za-zÄÖÜäöüß]+/.exec(hinten);
    if (pm) { const m2 = ZAHLWORT[pm[2].toLowerCase()] || (EINS.test(pm[2]) ? 1 : +pm[2]); teile.push(m2); n += m2; e = wahl.e + pm[0].length; }
    else if (pv) { teile.push(wahl.n); n *= 2; e = wahl.e + pv[0].length; }
    let objekte = null;
    if (jeweils) {
      /* число объектов: другое число во фразе («für drei Systeme», «aus den zwei Bereichen») или «beide» */
      const andere = kand.filter(k => k !== wahl && !k.jeweils && !(k.s >= wahl.s && k.s < e));
      const obj = andere.find(k => k.s < wahl.s) || andere[0];
      if (obj) objekte = obj.n;
      else if (/\bbeiden?\b/i.test(t)) objekte = 2;
    }
    const paar = teile.length > 1;
    return { n, jeweils, mindestens: wahl.mindestens, objekte, paar, teile, s: wahl.s, e, wort: t.slice(wahl.s, e) };
  }

  /* ------------------------------------------------ HTML → предложения */
  const ENT = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", shy: "", ndash: "–", mdash: "—", bdquo: "„", ldquo: "“", rdquo: "”", hellip: "…", auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß", euro: "€" };
  function entities(s) {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, x) => {
      if (x[0] === "#") { const c = x[1] === "x" || x[1] === "X" ? parseInt(x.slice(2), 16) : parseInt(x.slice(1), 10); return Number.isFinite(c) && c > 0 && c < 0x110000 ? String.fromCodePoint(c) : " "; }
      return Object.prototype.hasOwnProperty.call(ENT, x) ? ENT[x] : all;
    });
  }
  /** Текст задания без HTML. Таблицы и блоки кода выкидываются (в них нет формулировок). */
  function htmlZuText(html) {
    let s = String(html == null ? "" : html);
    s = s.replace(/<!--[\s\S]*?-->/g, " ");
    s = s.replace(/<(table|pre|script|style|svg)\b[\s\S]*?<\/\1\s*>/gi, "\n");
    s = s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(p|div|li|ul|ol|h\d|tr|td|th|thead|tbody|table|pre|hr|blockquote|dl|dt|dd)\b[^>]*>/gi, "\n");
    s = s.replace(/<[^>]*>/g, "");
    return entities(s).replace(/[ \t ]+/g, " ");
  }
  const ABK = new Set(["z", "d", "u", "o", "s", "v", "i", "e", "a", "bzw", "ggf", "ggfs", "ca", "evtl", "inkl", "exkl", "usw", "etc", "nr", "vgl", "bspw", "max", "min", "abb", "tab", "std", "mio", "mrd", "dr", "hr", "fr", "st", "zzgl", "bzgl", "ff", "gem", "lt", "sog", "allg", "einschl", "jew", "ä", "u.a", "z.b", "d.h", "o.ä", "u.u", "i.d.r", "o.g", "sek", "tsd", "mind", "zb", "co", "kg", "mwst", "evtl", "insb", "ggü", "bsp"]);
  /** Разбить текст на предложения; сокращения (z. B., bzw., 2. Normalform) не режут. */
  function saetze(text) {
    const out = [];
    String(text == null ? "" : text).split(/\n+/).forEach(zeile => {
      zeile = zeile.replace(/\s+/g, " ").trim();
      if (!zeile) return;
      let anfang = 0;
      const re = /[.!?]+["“”'»)\]]?(?=\s|$)/g; let m;
      while ((m = re.exec(zeile))) {
        const ende = m.index + m[0].length;
        if (m[0][0] === ".") {
          const wort = (/(\S+)$/.exec(zeile.slice(anfang, m.index)) || ["", ""])[1].replace(/^[(„"“'»]+/, "");
          const rest = zeile.slice(ende).trim();
          const wl = wort.toLowerCase();
          if (/^\d+$/.test(wort) || ABK.has(wl) || /^[a-zäöü]$/i.test(wort) || /\.[a-zäöü]/i.test(wort) || (rest && /^[a-zäöü]/.test(rest))) continue;
        }
        const satz = zeile.slice(anfang, ende).trim();
        if (satz) out.push(satz);
        anfang = ende;
      }
      const rest = zeile.slice(anfang).trim();
      if (rest) out.push(rest);
    });
    return out;
  }
  /* Повелительные глаголы, которых нет в каталоге: «Erstellen Sie eine SQL-Abfrage,
     mit der Sie ermitteln …» — это не «berechnen», а задание «составить». */
  const NICHT_OP = new Set(["erstellen", "ergänzen", "vervollständigen", "entwickeln", "zeichnen", "modellieren", "schreiben",
    "kennzeichnen", "implementieren", "korrigieren", "programmieren", "tragen", "füllen", "markieren", "übertragen", "ordnen",
    "skizzieren", "formulieren", "erweitern", "definieren", "entwerfen", "notieren", "verbinden", "kreuzen", "streichen", "führen"]);
  const istOpVerb = (verb, satz) => (verb === "geben" ? KATALOG[0].regex.test(satz) : KATALOG.some(o => o.regex.test(verb + " sie") || o.regex.test(verb)));
  function hauptverbOk(s) {
    const imp = []; const re = /(?:^|[,;:]\s*|\bund\s+|\bsowie\s+)([A-Za-zÄÖÜäöüß]+)\s+Sie\b/g; let m;
    while ((m = re.exec(s))) imp.push(m[1].toLowerCase());
    if (!imp.length || !NICHT_OP.has(imp[0])) return true;
    return imp.some(v => !NICHT_OP.has(v) && istOpVerb(v, s));
  }
  /** Предложения-задания: есть «Sie» и оператор; метка «bb)» в начале убирается. */
  function kandidaten(html) {
    return saetze(htmlZuText(html)).map(s => s.replace(/^[a-z]{1,2}\)\s*/, "").replace(/^Hinweis:\s*/i, ""))
      .filter(s => s.length >= 15 && s.length <= 320 && /\bSie\b/.test(s) && !!erkenne(s) && hauptverbOk(s));
  }
  const quelleText = (m, a, t) => (m.marke || m.kurz || m.id) + ", Aufgabe " + (t.nr != null ? t.nr : a.nr) + String(t.label || "").replace(/[)\s]/g, "");
  /** Фразы из личного пакета экзаменов. Только в памяти — никуда не сохраняются. */
  function gaPool(module) {
    const items = [], gesehen = new Set();
    (module || []).filter(m => m && /^ga[12]-/i.test(String(m.id || ""))).forEach(m => {
      (m.aufgaben || []).forEach(a => (a.teile || []).forEach(t => {
        if (!t || !t.id) return;
        kandidaten(t.text).forEach((s, i) => {
          const k = s.toLowerCase();
          if (gesehen.has(k)) return;
          gesehen.add(k);
          items.push({ id: "ga:" + t.id + "#" + i, text: s, op: erkenne(s).key, quelle: quelleText(m, a, t), ga: true });
        });
      }));
    });
    return items;
  }

  /* ---------------------------------------------------------------------
     Запасной набор: авторские фразы в стиле экзамена (не IHK).
     muster — достаточный ответ; luecke — неполный ответ и чего не хватает.
     ------------------------------------------------------------------ */
  const FALLBACK = [
    { id: "f01", op: "nennen", text: "Nennen Sie drei Maßnahmen, mit denen die Firma ihre Kundendaten vor Verlust schützt.",
      muster: "1. tägliches Backup\n2. RAID 1\n3. USV (unterbrechungsfreie Stromversorgung)",
      luecke: { text: "1. tägliches Backup\n2. RAID 1", fehlt: "punkte" } },
    { id: "f02", op: "nennen", text: "Nennen Sie zwei Vorteile einer Cloud-Lösung für das kleine Büro.",
      muster: "1. keine eigene Server-Hardware\n2. Zugriff von überall",
      luecke: { text: "1. keine eigene Server-Hardware", fehlt: "punkte" } },
    { id: "f03", op: "nennen", text: "Nennen Sie 3 Testarten aus dem V-Modell.",
      muster: "1. Komponententest\n2. Integrationstest\n3. Abnahmetest" },
    { id: "f04", op: "nennen", text: "Nennen Sie für beide Varianten jeweils zwei Nachteile.",
      muster: "Variante A: hohe Kosten, lange Einführung\nVariante B: wenig Support, keine Schnittstelle",
      luecke: { text: "Variante A: hohe Kosten\nVariante B: wenig Support", fehlt: "punkte" } },
    { id: "f05", op: "erlaeutern", text: "Erläutern Sie zwei Vorteile von Unit-Tests für das Entwicklerteam.",
      muster: "Fehler werden früh gefunden, weil die Tests nach jeder Änderung laufen.\nÄnderungen sind sicherer: Ein Test zeigt sofort, wenn alter Code nicht mehr funktioniert.",
      luecke: { text: "Fehler früh finden.\nSichere Änderungen.", fehlt: "erklaerung" } },
    { id: "f06", op: "erlaeutern", text: "Erläutern Sie mindestens zwei Maßnahmen zum Datenschutz im Homeoffice.",
      muster: "Der Laptop wird verschlüsselt. So kann ein Dieb die Daten nicht lesen.\nDer Zugriff läuft über VPN. Dadurch sind die Daten im WLAN geschützt.",
      luecke: { text: "Der Laptop wird verschlüsselt. So kann ein Dieb die Daten nicht lesen.", fehlt: "punkte" } },
    { id: "f07", op: "erlaeutern", text: "Erläutern Sie, wie ein Index die Suche in der Tabelle Kunde beschleunigt.",
      muster: "Ein Index ist eine sortierte Liste der Werte einer Spalte. Die Datenbank muss deshalb nicht jede Zeile lesen. Zum Beispiel findet sie die Kundennummer 4711 direkt.",
      luecke: { text: "Mit Index ist die Suche schneller.", fehlt: "erklaerung" } },
    { id: "f08", op: "beschreiben", text: "Beschreiben Sie den Ablauf einer Anmeldung mit Zwei-Faktor-Authentifizierung.",
      muster: "Zuerst gibt der Nutzer Name und Passwort ein. Danach bekommt er einen Code auf sein Smartphone. Zum Schluss gibt er den Code ein und ist angemeldet.",
      luecke: { text: "Passwort, Code.", fehlt: "erklaerung" } },
    { id: "f09", op: "beschreiben", text: "Beschreiben Sie zwei Aufgaben eines Scrum Masters.",
      muster: "Der Scrum Master moderiert das Daily Scrum.\nEr beseitigt Hindernisse, damit das Team arbeiten kann.",
      luecke: { text: "Der Scrum Master moderiert das Daily Scrum.", fehlt: "punkte" } },
    { id: "f10", op: "beschreiben", text: "Beschreiben Sie vier Schritte beim Einrichten eines neuen Arbeitsplatzrechners." },
    { id: "f11", op: "erklaeren", text: "Erklären Sie den Begriff Normalisierung.",
      muster: "Normalisierung bedeutet: Man teilt Tabellen so auf, dass keine Daten doppelt gespeichert werden. Dadurch entstehen keine Widersprüche (Anomalien).",
      luecke: { text: "Tabellen aufteilen.", fehlt: "erklaerung" } },
    { id: "f12", op: "erklaeren", text: "Erklären Sie, was man unter einem Deadlock versteht.",
      muster: "Ein Deadlock ist eine Verklemmung. Zwei Prozesse warten gegenseitig auf eine Ressource, die der andere hält. Deshalb kann keiner weiterarbeiten." },
    { id: "f13", op: "begruenden", text: "Begründen Sie, warum Passwörter nur als Hashwert gespeichert werden sollen.",
      muster: "Wenn ein Angreifer die Datenbank stiehlt, sieht er nur Hashwerte. Daraus kann er das Passwort nicht direkt zurückrechnen. Deshalb bleiben die Konten geschützt.",
      luecke: { text: "Wegen der Sicherheit.", fehlt: "erklaerung" } },
    { id: "f14", op: "begruenden", text: "Nennen und begründen Sie zwei Vorteile eines agilen Vorgehens für die neue Kunden-App.",
      muster: "Der Kunde sieht früh Ergebnisse, weil nach jedem Sprint geliefert wird.\nÄnderungen sind leicht möglich, da nur der nächste Sprint fest geplant ist.",
      luecke: { text: "Schnelle Ergebnisse.\nFlexible Planung.", fehlt: "erklaerung" } },
    { id: "f15", op: "begruenden", text: "Begründen Sie mit zwei Argumenten, weshalb die Datenbank täglich gesichert werden soll." },
    { id: "f16", op: "beurteilen", text: "Beurteilen Sie, ob die Firma den alten Server weiter nutzen sollte.",
      muster: "Dafür spricht, dass keine Kosten für neue Hardware entstehen. Dagegen spricht, dass es keine Sicherheitsupdates mehr gibt. Insgesamt empfehle ich einen neuen Server, weil die Sicherheit wichtiger ist.",
      luecke: { text: "Dafür: keine Kosten. Dagegen: keine Updates mehr.", fehlt: "erklaerung" } },
    { id: "f17", op: "beurteilen", text: "Bewerten Sie den Einsatz einer Open-Source-Datenbank für den Webshop." },
    { id: "f18", op: "vergleichen", text: "Vergleichen Sie TCP und UDP anhand von zwei Merkmalen.",
      muster: "TCP baut eine Verbindung auf, UDP dagegen nicht.\nTCP garantiert die Reihenfolge der Pakete, UDP nicht – dafür ist UDP schneller.",
      luecke: { text: "TCP baut eine Verbindung auf, UDP dagegen nicht.", fehlt: "punkte" } },
    { id: "f19", op: "vergleichen", text: "Unterscheiden Sie Black-Box-Test und White-Box-Test." },
    { id: "f20", op: "vergleichen", text: "Erklären Sie den Unterschied zwischen Authentifizierung und Autorisierung." },
    { id: "f21", op: "empfehlen", text: "Entscheiden Sie sich für eine Speicherlösung und nennen Sie zwei Gründe.",
      muster: "Ich empfehle das NAS, weil es im eigenen Netz steht. Außerdem entstehen keine monatlichen Kosten.",
      luecke: { text: "Ich empfehle das NAS, weil es im eigenen Netz steht.", fehlt: "punkte" } },
    { id: "f22", op: "empfehlen", text: "Empfehlen Sie dem Kunden eines der beiden Angebote." },
    { id: "f23", op: "berechnen", text: "Ermitteln Sie die Übertragungsdauer der Datei in Sekunden.",
      muster: "Ansatz: 800 MB · 8 = 6400 Mbit\nRechnung: 6400 Mbit ÷ 100 Mbit/s = 64 s\nErgebnis: 64 s",
      luecke: { text: "64", fehlt: "erklaerung" } },
    { id: "f24", op: "berechnen", text: "Berechnen Sie die monatlichen Kosten für 12 Lizenzen. Geben Sie den Rechenweg an." },
    { id: "f25", op: "pruefen", text: "Prüfen Sie, ob die Tabelle Bestellung die 2. Normalform erfüllt.",
      muster: "Kriterium: Jedes Nicht-Schlüsselattribut hängt vom ganzen Schlüssel ab. Der Artikelname hängt nur von der ArtikelNr ab. Also ist die 2. NF nicht erfüllt.",
      luecke: { text: "Nein.", fehlt: "erklaerung" } },
    { id: "f26", op: "beurteilen", text: "Wägen Sie ab, ob Kauf oder Leasing der Notebooks für die Firma sinnvoller ist." }
  ];
  const fallbackPool = () => FALLBACK.map(f => Object.assign({}, f, { id: "f:" + f.id, op: erkenne(f.text).key, quelle: "Авторская фраза в стиле экзамена", ga: false }));

  /* ----------------------------------------------------------- Варианты */
  function mischen(arr, rng) {
    const a = arr.slice(), r = rng || Math.random;
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  /** 4 разных оператора, правильный всегда среди них; неверные — сначала «похожие». */
  function optionen(richtig, rng) {
    const aehn = mischen((AEHNLICH[richtig] || []).filter(k => k !== richtig && opVon(k)), rng).slice(0, 2);
    const rest = mischen(KATALOG.map(o => o.key).filter(k => k !== richtig && !aehn.includes(k)), rng);
    return mischen([richtig].concat(aehn, rest).slice(0, 4), rng);
  }
  /** 4 разных числа ≥ 1, правильное среди них; по возрастанию. */
  function zahlOptionen(n, rng) {
    const nah = mischen([n - 1, n + 1, n + 2, n - 2].filter(x => x >= 1), rng);
    const set = [n];
    nah.concat([1, 2, 3, 4, 5, 6, 7]).forEach(x => { if (set.length < 4 && !set.includes(x)) set.push(x); });
    return set.sort((a, b) => a - b);
  }
  const GENUG = [["ok", "Достаточно"], ["erklaerung", "Не хватает объяснения (или вывода)"], ["punkte", "Не хватает пунктов"]];

  /* ---------------------------------------------------------- Хранение */
  const leer = () => ({ v: 1, ops: {}, typen: { op: { r: 0, f: 0 }, zahl: { r: 0, f: 0 }, genug: { r: 0, f: 0 } }, verwechslung: {}, fehler: {}, runden: [], runde: null });
  let readError = "", saveError = "";
  function load() {
    readError = "";
    try {
      const raw = root.localStorage && root.localStorage.getItem(SK);
      if (!raw) return leer();
      const x = JSON.parse(raw);
      if (!x || typeof x !== "object" || Array.isArray(x)) throw new Error("format");
      const r = Object.assign(leer(), x);
      ["ops", "typen", "verwechslung", "fehler"].forEach(k => { if (!r[k] || typeof r[k] !== "object" || Array.isArray(r[k])) r[k] = leer()[k]; });
      r.typen = Object.assign(leer().typen, r.typen);
      if (!Array.isArray(r.runden)) r.runden = [];
      if (r.runde && (typeof r.runde !== "object" || !Array.isArray(r.runde.fragen) || !Array.isArray(r.runde.antworten))) r.runde = null;
      return r;
    } catch (e) {
      readError = "Статистику тренажёра прочитать не удалось. Старые данные не тронуты; новые результаты видны только в этой вкладке.";
      return leer();
    }
  }
  let state = load();
  function save() {
    if (readError) { saveError = readError; return false; }
    try { root.localStorage.setItem(SK, JSON.stringify(state)); saveError = ""; return true; }
    catch (e) { saveError = "Не удалось сохранить на устройстве (память полна или закрыта). Раунд продолжается, результаты остаются в этой вкладке."; return false; }
  }

  /* ------------------------------------------------------ Раунд строить */
  const fehlerKey = (ref, typ) => ref + "|" + typ;
  function frageBauen(typ, item, rng) {
    if (typ === "op") return { typ, ref: item.id, richtig: item.op, optionen: optionen(item.op, rng) };
    if (typ === "zahl") { const a = anzahl(item.text); if (!a) return null; return { typ, ref: item.id, richtig: a.n, optionen: zahlOptionen(a.n, rng) }; }
    if (typ === "genug") {
      if (!item.muster) return null;
      const variante = item.luecke && rng() < 0.55 ? "luecke" : "muster";
      return { typ, ref: item.id, variante, richtig: variante === "muster" ? "ok" : item.luecke.fehlt, optionen: GENUG.map(g => g[0]) };
    }
    return null;
  }
  /** Обычный раунд: 2 вопроса «genug», 2–3 «zahl» (сразу после «op» к той же фразе), остальное — «op» по кругу. */
  function rundeBauen(pool, opt) {
    opt = opt || {};
    const rng = opt.rng || Math.random, n = opt.n || RUNDE_N, st = opt.stand || leer();
    pool = pool || [];
    if (opt.nurFehler) {
      const fragen = [];
      Object.keys(st.fehler).map(k => st.fehler[k]).sort((a, b) => (b.t || 0) - (a.t || 0)).forEach(f => {
        if (fragen.length >= n) return;
        const item = pool.find(x => x.id === f.ref);
        const fr = item && frageBauen(f.typ, item, rng);
        if (fr) fragen.push(fr);
      });
      return mischen(fragen, rng);
    }
    const genugItems = mischen(pool.filter(x => x.muster), rng).slice(0, n > 3 ? 2 : 0);
    const ziel = n - genugItems.length, benutzt = new Set(genugItems.map(x => x.id));
    /* блоки: [op] или [op, zahl] к одной фразе — пара не разрывается */
    const bloecke = [];
    let anzahlFragen = 0;
    const nehmen = (item, mitZahl) => {
      benutzt.add(item.id);
      const b = [frageBauen("op", item, rng)];
      if (mitZahl && anzahlFragen + 2 <= ziel) b.push(frageBauen("zahl", item, rng));
      bloecke.push(b); anzahlFragen += b.length;
    };
    /* 1) две фразы с числом (разные операторы, GA в приоритете) — вопросы «сколько пунктов» */
    const zk = mischen(pool.filter(x => x.ga && anzahl(x.text)), rng).concat(mischen(pool.filter(x => !x.ga && anzahl(x.text)), rng));
    const zOps = new Set();
    zk.forEach(x => { if (zOps.size < 2 && !zOps.has(x.op) && !benutzt.has(x.id) && anzahlFragen + 2 <= ziel) { zOps.add(x.op); nehmen(x, true); } });
    /* 2) остальное — «op» по кругу по операторам; слабые операторы (больше ошибок) — в начало круга */
    const quote = k => { const q = st.ops[k] || { r: 0, f: 0 }; return (q.f + 1) / (q.r + q.f + 2); };
    const ops = mischen(Array.from(new Set(pool.map(x => x.op))), rng).sort((a, b) => quote(b) - quote(a));
    let leerLauf = 0, i = 0;
    while (anzahlFragen < ziel && ops.length && leerLauf < ops.length) {
      const op = ops[i++ % ops.length];
      const frei = pool.filter(x => x.op === op && !benutzt.has(x.id));
      const ga = frei.filter(x => x.ga), aus = ga.length ? ga : frei;
      if (!aus.length) { leerLauf++; continue; }
      leerLauf = 0;
      const item = aus[Math.floor(rng() * aus.length)];
      /* третий вопрос «сколько» — иногда, если у фразы есть число */
      nehmen(item, bloecke.filter(b => b.length > 1).length < 3 && !!anzahl(item.text) && rng() < 0.5);
    }
    const fragen = [].concat.apply([], mischen(bloecke, rng));
    genugItems.forEach(item => {
      const fr = frageBauen("genug", item, rng);
      let p = Math.min(fragen.length, 1 + Math.floor(rng() * fragen.length));
      while (p < fragen.length && fragen[p].typ === "zahl") p++;   /* не между op и zahl */
      fragen.splice(p, 0, fr);
    });
    return fragen.slice(0, n);
  }

  /* ------------------------------------------------- Ответ и статистика */
  function pruefe(frage, wahl) { return String(frage.richtig) === String(wahl); }
  /** Учесть ответ в статистике (чисто: возвращает новый объект). */
  function verbuchen(st, frage, item, wahl, t) {
    const s = kopie(st), ok = pruefe(frage, wahl), op = item ? item.op : (frage.typ === "op" ? frage.richtig : null);
    const typ = s.typen[frage.typ] || (s.typen[frage.typ] = { r: 0, f: 0 });
    typ[ok ? "r" : "f"]++;
    if (frage.typ === "op") {
      const o = s.ops[frage.richtig] || (s.ops[frage.richtig] = { r: 0, f: 0 });
      o[ok ? "r" : "f"]++;
      if (!ok) { const k = frage.richtig + ">" + wahl; s.verwechslung[k] = (s.verwechslung[k] || 0) + 1; }
    }
    const fk = fehlerKey(frage.ref, frage.typ);
    if (ok) delete s.fehler[fk];
    else s.fehler[fk] = { ref: frage.ref, typ: frage.typ, op, t: t || Date.now() };
    return s;
  }
  /** «Путаешь A и B»: пары без учёта направления, по убыванию. */
  function verwechslungen(map) {
    const paare = {};
    Object.keys(map || {}).forEach(k => {
      const [a, b] = k.split(">"); if (!a || !b) return;
      const key = [a, b].sort().join("|");
      paare[key] = (paare[key] || 0) + map[k];
    });
    return Object.keys(paare).map(k => ({ a: k.split("|")[0], b: k.split("|")[1], n: paare[k] })).sort((x, y) => y.n - x.n || x.a.localeCompare(y.a));
  }
  function journalEintrag(runde, i, frage, item, wahl, t) {
    return { id: "opueb:" + runde.id + ":" + i, t, topic: "taktik", source: "operatoren", task: item ? item.op : String(frage.richtig),
      correct: pruefe(frage, wahl) ? 1 : 0, max: 1, support: "selbst", kind: "recognition",
      answers: { typ: frage.typ, wahl: String(wahl), richtig: String(frage.richtig), ref: frage.ref } };
  }
  function journal(ev) {
    const L = root.GENLERNSTAND;
    if (!L || typeof L.record !== "function") return false;
    try { const r = L.record(ev); return !!(r && r.ok); } catch (e) { return false; }
  }

  /* ----------------------------------------------------------- Пул фраз */
  let POOL = null, INFO = { ga: 0, fb: 0, paket: false }, ladeP = null;
  function poolSetzen(module) {
    const ga = gaPool(module), fb = fallbackPool();
    POOL = ga.concat(fb);
    INFO = { ga: ga.length, fb: fb.length, paket: ga.length > 0 };
    return POOL;
  }
  function poolLaden() {
    if (ladeP) return ladeP;
    const A = root.GENAZUBI;
    const mods = A && typeof A.laden === "function"
      ? Promise.resolve().then(() => A.laden()).then(() => (typeof A.alleModule === "function" ? A.alleModule() : [])).catch(() => [])
      : Promise.resolve([]);
    ladeP = mods.then(m => poolSetzen(m)).catch(() => poolSetzen([]));
    return ladeP;
  }
  const itemVon = ref => (POOL || []).find(x => x.id === ref) || null;

  /* ------------------------------------------- Ход раунда (без DOM) */
  /** Новый раунд из текущего пула. false — нет вопросов (например, нет ошибок). */
  function starten(nurFehler, rng) {
    const fragen = rundeBauen(POOL || [], { stand: state, nurFehler, rng });
    if (!fragen.length) return false;
    state.runde = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: Date.now(), nur: !!nurFehler, fragen, antworten: [], pos: 0 };
    save();
    return true;
  }
  /** Ответ на текущий вопрос: статистика, ошибки, журнал. Повторный ответ игнорируется. */
  function beantworten(wahl) {
    const r = state.runde; if (!r) return null;
    const i = r.pos, f = r.fragen[i];
    if (!f || r.antworten[i]) return null;
    const item = itemVon(f.ref), t = Date.now();
    const ok = pruefe(f, wahl);
    const ev = journalEintrag(r, i, f, item, wahl, t);
    r.antworten[i] = { wahl, richtig: ok, t, event: ev, recorded: false };
    state = Object.assign(verbuchen(state, f, item, wahl, t), { runde: r });
    r.antworten[i].recorded = journal(ev);
    save();
    return { richtig: ok, korrekt: f.richtig };
  }
  function weiter() { const r = state.runde; if (!r) return; r.pos = Math.min(r.fragen.length, r.pos + 1); if (r.pos >= r.fragen.length) rundeAbschliessen(r); save(); }
  function rundeAbschliessen(r) {
    if (r.abgeschlossen) return;
    /* журнал: неподтверждённые записи повторить с тем же id */
    r.antworten.forEach(a => { if (a && !a.recorded && a.event) a.recorded = journal(a.event); });
    const beantwortet = r.antworten.filter(Boolean);
    state.runden = state.runden.concat({ t: Date.now(), r: beantwortet.filter(a => a.richtig).length, n: beantwortet.length, nur: r.nur }).slice(-30);
    r.abgeschlossen = true;
  }
  function abbrechen() { const r = state.runde; if (r && r.antworten.some(Boolean)) rundeAbschliessen(r); state.runde = null; save(); }
  function zumUeberblick() { state.runde = null; save(); }

  /* ================================================================ UI */
  const $ = id => document.getElementById(id);
  const el = (t, c, s) => { const n = document.createElement(t); if (c) n.className = c; if (s != null) n.textContent = s; return n; };
  function button(label, fn, primary) { const b = el("button", "btn" + (primary ? " primary" : ""), label); b.type = "button"; b.onclick = fn; return b; }
  const pkt = n => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? "пункт" : a >= 2 && a <= 4 && (b < 12 || b > 14) ? "пункта" : "пунктов"; };
  const verbName = k => { const o = opVon(k); return o ? o.verb : k; };

  function screen() {
    let s = $("scOpUeb"); if (s) return s;
    s = el("div", "seite ou-page"); s.id = "scOpUeb"; s.hidden = true;
    const w = el("div", "ou-wrap"); w.id = "ouInhalt"; s.appendChild(w);
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling); else document.body.appendChild(s);
    return s;
  }
  function oeffnen(fromHistory) {
    fromHistory = fromHistory === true;   /* из истории — без нового шага в истории */
    abgleichen();
    const s = screen();
    document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
    s.hidden = false;
    ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { if ($(k)) $(k).hidden = true; });
    if ($("kopfTitel")) $("kopfTitel").hidden = false;
    if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · тактика экзамена";
    if ($("kTitel")) $("kTitel").textContent = "Что от меня хотят? · Operatoren";
    if (!fromHistory) {
      try {
        if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
        /* уже на этом экране (например, после перезагрузки) — без лишнего шага «назад» */
        if (history.state.seite === "scOpUeb") history.replaceState({ ihk: 1, seite: "scOpUeb" }, "");
        else history.pushState({ ihk: 1, seite: "scOpUeb" }, "");
      } catch (e) { }
    }
    /* пакет могли загрузить позже («Paket laden») — тогда пересобрать пул */
    const A = root.GENAZUBI;
    if (POOL && !INFO.paket && A && typeof A.paket === "function" && A.paket()) ladeP = null;
    root.GENZURUECK && root.GENZURUECK.knopfPflegen();
    root.scrollTo && root.scrollTo(0, 0);
    render();
  }
  function render() {
    const w = $("ouInhalt"); if (!w) return;
    w.replaceChildren();
    if (readError) { const a = el("p", "ou-alert", readError); a.setAttribute("role", "alert"); w.appendChild(a); }
    if (!POOL || !ladeP) {
      w.appendChild(card(null, "Загружаю формулировки…"));
      poolLaden().then(() => { const s = $("scOpUeb"); if (s && !s.hidden) render(); });
      return;
    }
    const r = state.runde;
    try {
      if (r && r.pos < r.fragen.length) frageZeigen(w, r);
      else if (r) endeZeigen(w, r);
      else startZeigen(w);
    } catch (e) {
      const a = el("p", "ou-alert", "Ошибка показа: " + e.message); a.setAttribute("role", "alert"); w.appendChild(a);
      w.appendChild(button("К обзору", () => { zumUeberblick(); render(); }));
    }
    w.appendChild(spick());
    if (saveError && !readError) { const a = el("p", "ou-alert", saveError); a.setAttribute("role", "alert"); w.appendChild(a); }
  }
  function card(parent, title, cls) {
    const c = el("section", "ou-card" + (cls ? " " + cls : ""));
    if (title) c.appendChild(el("h2", null, title));
    if (parent) parent.appendChild(c);
    return c;
  }
  function fehlerAnzahl() {
    return Object.keys(state.fehler).filter(k => itemVon(state.fehler[k].ref)).length;
  }
  function neueRunde(nurFehler) {
    if (!starten(nurFehler)) return false;
    render();
    root.scrollTo && root.scrollTo(0, 0);
    return true;
  }
  function startZeigen(w) {
    const c = card(w, "Что от меня хотят?");
    c.appendChild(el("p", null, "Глагол в задании (Operator) решает, сколько и как писать. «Nennen» — только пункты. «Erläutern» — пункт и что он даёт. «Begründen» — причина с «weil». «Beurteilen» — вывод с оценкой."));
    c.appendChild(el("p", null, "Раунд — 10 коротких вопросов: какой оператор, что он требует, сколько пунктов, хватает ли ответа."));
    const q = el("p", "ou-muted");
    q.textContent = INFO.paket
      ? "Фразы: " + INFO.ga + " настоящих формулировок из твоих экзаменов GA (только на этом устройстве) + " + INFO.fb + " авторских."
      : "Пакет экзаменов не найден — тренируемся на " + INFO.fb + " авторских фразах в стиле экзамена. С пакетом («Meine Prüfungsbögen» → «Paket laden») появятся настоящие формулировки GA.";
    c.appendChild(q);
    const act = el("div", "ou-actions");
    act.appendChild(button("Начать раунд · 10 вопросов", () => neueRunde(false), true));
    const nf = fehlerAnzahl();
    const fb = button("Только мои ошибки" + (nf ? " · " + nf : ""), () => { if (!neueRunde(true)) render(); });
    fb.disabled = !nf;
    act.appendChild(fb);
    c.appendChild(act);
    if (!nf) c.appendChild(el("p", "ou-muted", "Раунд «только мои ошибки» станет доступен, когда появятся ошибки."));
    statistik(w);
  }
  function statistik(w) {
    const keys = KATALOG.map(o => o.key).filter(k => state.ops[k] && (state.ops[k].r + state.ops[k].f));
    const T = state.typen;
    if (!keys.length && !(T.zahl.r + T.zahl.f) && !(T.genug.r + T.genug.f)) return;
    const c = card(w, "Мои результаты");
    const tab = el("div", "ou-tab");
    keys.forEach(k => {
      const s = state.ops[k], n = s.r + s.f;
      const z = el("div", "ou-zeile");
      const v = el("b", null, verbName(k)); v.lang = "de";
      z.append(v, el("span", null, s.r + " из " + n + " верно"));
      const bar = el("span", "ou-bar"), fill = el("span"); fill.style.width = Math.round(100 * s.r / n) + "%"; bar.appendChild(fill); z.appendChild(bar);
      tab.appendChild(z);
    });
    [["zahl", "Сколько пунктов"], ["genug", "Хватает ли ответа"]].forEach(([k, t]) => {
      const s = T[k], n = s.r + s.f; if (!n) return;
      const z = el("div", "ou-zeile");
      z.append(el("b", null, t), el("span", null, s.r + " из " + n + " верно"));
      const bar = el("span", "ou-bar"), fill = el("span"); fill.style.width = Math.round(100 * s.r / n) + "%"; bar.appendChild(fill); z.appendChild(bar);
      tab.appendChild(z);
    });
    c.appendChild(tab);
    const vw = verwechslungen(state.verwechslung).slice(0, 3);
    if (vw.length) {
      c.appendChild(el("h3", null, "Чаще всего путаешь"));
      const ul = el("ul");
      vw.forEach(v => ul.appendChild(el("li", null, verbName(v.a) + " и " + verbName(v.b) + " — " + v.n + " раз(а)")));
      c.appendChild(ul);
    }
    if (state.runden.length) {
      const l = state.runden[state.runden.length - 1];
      c.appendChild(el("p", "ou-muted", "Последний раунд: " + l.r + " из " + l.n + " · раундов всего: " + state.runden.length));
    }
  }

  /* Предложение с подсветкой (только текстовые узлы — без innerHTML). */
  function satzEl(text, marks) {
    const p = el("p", "ou-satz"); p.lang = "de";
    let pos = 0;
    ohneUeberlappung(marks || []).forEach(m => {
      if (m.s > pos) p.appendChild(document.createTextNode(text.slice(pos, m.s)));
      p.appendChild(el("mark", m.cls, text.slice(m.s, m.e)));
      pos = m.e;
    });
    if (pos < text.length) p.appendChild(document.createTextNode(text.slice(pos)));
    return p;
  }
  function frageZeigen(w, r) {
    const i = r.pos, f = r.fragen[i], item = itemVon(f.ref), antw = r.antworten[i];
    if (!item) {
      /* фраза из пакета недоступна (пакет удалён) — пропустить вопрос */
      weiter(); render(); return;
    }
    const c = card(w, null, "ou-frage");
    const kopf = el("div", "ou-kopfzeile");
    kopf.appendChild(el("span", "ou-fortschritt", "Вопрос " + (i + 1) + " из " + r.fragen.length + (r.nur ? " · мои ошибки" : "")));
    const richtigBisher = r.antworten.filter(a => a && a.richtig).length;
    kopf.appendChild(el("span", "ou-muted", "верно: " + richtigBisher));
    c.appendChild(kopf);
    const titel = { op: "Что требует этот глагол?", zahl: "Сколько пунктов нужно?", genug: "Этого ответа достаточно?" }[f.typ];
    c.appendChild(el("h2", null, titel));

    /* фраза */
    const marks = [];
    const op = opVon(item.op);
    if (antw || f.typ !== "op") verbStellen(item.text).forEach(m => marks.push(m));
    const a = anzahl(item.text);
    if (a && ((antw && f.typ === "zahl") || f.typ === "genug")) marks.push({ s: a.s, e: a.e, cls: "ou-zahl" });
    c.appendChild(satzEl(item.text, marks));
    c.appendChild(el("p", "ou-quelle", "Источник: " + item.quelle));

    if (f.typ === "op") c.appendChild(el("p", null, "Что нужно сделать в ответе?"));
    if (f.typ === "zahl") c.appendChild(el("p", null, a && a.jeweils ? "Здесь стоит «jeweils». Сколько пунктов нужно на КАЖДЫЙ объект?" : "Сколько пунктов (или предложений-пунктов) нужно написать?"));
    if (f.typ === "genug") {
      c.appendChild(el("p", null, "Ответ ученика:"));
      const txt = f.variante === "luecke" ? item.luecke.text : item.muster;
      const pre = el("p", "ou-antwort", txt); pre.lang = "de"; c.appendChild(pre);
    }

    /* варианты */
    const liste = el("div", "ou-optionen"); liste.setAttribute("role", "group"); liste.setAttribute("aria-label", "Варианты ответа");
    f.optionen.forEach(o => {
      let label;
      if (f.typ === "op") label = opVon(o).ru;
      else if (f.typ === "zahl") label = a && a.jeweils ? "по " + o + " " + pkt(o) + " на каждый" : o + " " + pkt(o);
      else label = (GENUG.find(g => g[0] === o) || [o, o])[1];
      const b = button(label, () => antworten(o));
      b.classList.add("ou-opt");
      if (antw) {
        b.disabled = true;
        if (String(o) === String(f.richtig)) { b.classList.add("ou-richtig"); b.prepend(el("span", "ou-zeichen", "✓ ")); }
        else if (String(o) === String(antw.wahl)) { b.classList.add("ou-falsch"); b.prepend(el("span", "ou-zeichen", "✗ ")); }
        b.setAttribute("aria-pressed", String(o) === String(antw.wahl) ? "true" : "false");
      }
      liste.appendChild(b);
    });
    c.appendChild(liste);

    if (antw) {
      const fb = el("div", "ou-feedback " + (antw.richtig ? "ok" : "falsch"));
      fb.setAttribute("aria-live", "polite");
      fb.appendChild(el("b", "ou-urteil", antw.richtig ? "✓ Верно" : "✗ Неверно"));
      erklaerung(fb, f, item, antw, op, a);
      c.appendChild(fb);
      const act = el("div", "ou-actions");
      const letzte = i + 1 >= r.fragen.length;
      const weiterKnopf = button(letzte ? "Итог раунда" : "Дальше →", () => { weiter(); render(); root.scrollTo && root.scrollTo(0, 0); }, true);
      act.appendChild(weiterKnopf);
      c.appendChild(act);
      setTimeout(() => { try { weiterKnopf.focus({ preventScroll: true }); } catch (e) { } }, 0);
    }
    const ab = el("div", "ou-actions ou-leise");
    ab.appendChild(button("Прервать раунд", () => { abbrechen(); render(); }));
    c.appendChild(ab);
  }
  function erklaerung(fb, f, item, antw, op, a) {
    const p = t => fb.appendChild(el("p", null, t));
    if (f.typ === "op") {
      if (!antw.richtig) p("Ты выбрала: «" + opVon(antw.wahl).ru + "» — это " + verbName(antw.wahl) + ".");
      const tr = alleTreffer(item.text);
      const zeile = el("p");
      zeile.append("Глагол: ");
      const v = el("b", null, op.name); v.lang = "de"; zeile.append(v, " — " + op.ru.charAt(0).toLowerCase() + op.ru.slice(1) + ".");
      fb.appendChild(zeile);
      if (tr.length > 1) p("Во фразе несколько глаголов (" + tr.map(o => o.verb).join(" + ") + "). Считается самый требовательный — " + op.verb + ".");
      if (op.key === "vergleichen" && /\bunterschied\b/i.test(item.text) && !/\bvergleichen|unterscheiden\b/i.test(item.text)) p("Слово «Unterschied» (разница) превращает задание в сравнение — обе стороны в каждом предложении.");
      if (op.key === "begruenden" && !/begr(ü|ue)nden/i.test(item.text)) p("«warum / weshalb / wieso» = «почему» → нужна причина, как при begründen.");
      p("Объём: " + op.umfang);
      p("Ловушка: " + op.falle);
    } else if (f.typ === "zahl") {
      const n = f.richtig;
      p((a.paar ? "«" + a.wort + " …» — это части одного задания: " + a.teile.join(" + ") + " = " + n + ". " : "«" + a.wort + "» = " + n + ". ") + (a.mindestens ? "«mindestens» = минимум: " + n + " — нижняя граница, но больше писать не нужно." : "Пиши ровно " + n + " " + pkt(n) + ": лишние часто не засчитывают, а время уходит."));
      if (a.jeweils) p("«jeweils» = «для каждого»: " + n + " " + pkt(n) + " на каждый объект" + (a.objekte ? " → всего " + a.objekte + " × " + n + " = " + (a.objekte * n) + "." : "."));
      p("Оформление: каждый пункт с новой строки (1., 2., …) — проверяющему легко сосчитать.");
    } else {
      const fehlt = f.richtig;
      if (fehlt === "ok") p("Ответ полный: " + (op.key === "nennen" ? "все пункты на месте, объяснения не нужны." : "все пункты на месте и раскрыты так, как требует «" + op.verb + "»."));
      if (fehlt === "erklaerung") p(op.key === "beurteilen" ? "Не хватает вывода: при «" + op.verb + "» в конце нужно своё решение («Insgesamt …»)." :
        op.key === "berechnen" ? "Одного числа мало: нужен ход решения и единица." :
        op.key === "empfehlen" ? "Решение есть, но нет причины из ситуации («weil …»)." :
        "Одних слов мало: «" + op.verb + "» требует полных предложений — что это и что даёт (weil / dadurch).");
      if (fehlt === "punkte") p("Пунктов меньше, чем просят" + (a ? " («" + a.wort + "» = " + a.n + (a.jeweils ? " на каждый" : "") + ")" : "") + ". Каждый недостающий пункт — потерянные баллы.");
      if (f.variante === "luecke") {
        fb.appendChild(el("p", "ou-lbl", "Полный ответ:"));
        const m = el("p", "ou-antwort", item.muster); m.lang = "de"; fb.appendChild(m);
      }
    }
    fb.appendChild(el("p", "ou-lbl", "Шаблон ответа (" + op.verb + "):"));
    const mu = el("p", "ou-muster", op.muster); mu.lang = "de"; fb.appendChild(mu);
  }
  function antworten(wahl) { if (beantworten(wahl)) render(); }
  function endeZeigen(w, r) {
    if (!r.abgeschlossen) { rundeAbschliessen(r); save(); }
    const beantwortet = r.antworten.map((a, i) => ({ a, f: r.fragen[i] })).filter(x => x.a);
    const richtig = beantwortet.filter(x => x.a.richtig).length;
    const c = card(w, "Итог раунда: " + richtig + " из " + beantwortet.length);
    c.appendChild(el("p", null, richtig === beantwortet.length ? "Всё верно. Глаголы узнаёшь — теперь главное писать столько, сколько они требуют." :
      richtig >= beantwortet.length * 0.7 ? "Хорошо. Посмотри ошибки ниже — и повтори их раундом «только мои ошибки»." :
      "Ошибок пока много — это нормально. Открой шпаргалку внизу и повтори раунд «только мои ошибки»."));
    const falsch = beantwortet.filter(x => !x.a.richtig);
    if (falsch.length) {
      c.appendChild(el("h3", null, "Ошибки по операторам"));
      const proOp = {};
      falsch.forEach(x => { const it = itemVon(x.f.ref); const k = it ? it.op : x.f.richtig; (proOp[k] = proOp[k] || []).push(x); });
      const ul = el("ul");
      Object.keys(proOp).forEach(k => {
        const typen = proOp[k].map(x => ({ op: "что требует", zahl: "сколько пунктов", genug: "хватает ли ответа" }[x.f.typ]));
        const li = el("li"); const b = el("b", null, verbName(k)); b.lang = "de";
        li.append(b, ": " + proOp[k].length + " ош. (" + Array.from(new Set(typen)).join(", ") + ")");
        ul.appendChild(li);
      });
      c.appendChild(ul);
      const rv = {};
      falsch.filter(x => x.f.typ === "op").forEach(x => { const k = x.f.richtig + ">" + x.a.wahl; rv[k] = (rv[k] || 0) + 1; });
      const vw = verwechslungen(rv);
      if (vw.length) {
        c.appendChild(el("h3", null, "Что путаешь"));
        vw.forEach(v => {
          const A = opVon(v.a), B = opVon(v.b);
          const d = el("div", "ou-paar");
          d.appendChild(el("b", null, "Путаешь " + A.verb + " и " + B.verb));
          d.appendChild(el("p", null, A.verb + ": " + A.ru + "."));
          d.appendChild(el("p", null, B.verb + ": " + B.ru + "."));
          c.appendChild(d);
        });
      }
    }
    const offen = r.antworten.filter(a => a && !a.recorded).length;
    if (offen && root.GENLERNSTAND) c.appendChild(el("p", "ou-muted", "Общий журнал пока не подтвердил " + offen + " запис(ей). Результаты сохранены здесь; запись повторится в следующем раунде."));
    const act = el("div", "ou-actions");
    act.appendChild(button("Ещё раунд", () => neueRunde(false), true));
    const nf = fehlerAnzahl();
    const fb = button("Только мои ошибки" + (nf ? " · " + nf : ""), () => { if (!neueRunde(true)) render(); });
    fb.disabled = !nf;
    act.appendChild(fb);
    act.appendChild(button("К обзору", () => { zumUeberblick(); render(); }));
    c.appendChild(act);
  }
  function spick() {
    const d = el("details", "ou-card ou-spick");
    d.appendChild(el("summary", null, "Шпаргалка операторов"));
    d.appendChild(el("p", "ou-muted", "От простого к сложному. Если в задании два глагола — отвечай по самому требовательному."));
    KATALOG.slice().sort((a, b) => a.rang - b.rang).forEach(o => {
      const b = el("div", "ou-spick-op");
      const h = el("h3", null, o.name); h.lang = "de"; b.appendChild(h);
      b.appendChild(el("p", null, o.ru + "."));
      b.appendChild(el("p", "ou-muted", "Объём: " + o.umfang));
      b.appendChild(el("p", "ou-muted", "Ловушка: " + o.falle));
      const m = el("p", "ou-muster", o.muster); m.lang = "de"; b.appendChild(m);
      d.appendChild(b);
    });
    const z = el("div", "ou-spick-op");
    z.appendChild(el("h3", null, "Числа в задании"));
    z.appendChild(el("p", null, "zwei = 2, drei = 3, vier = 4, fünf = 5. «jeweils» = для каждого (2 объекта × jeweils zwei = 4 пункта). «mindestens» = минимум."));
    d.appendChild(z);
    return d;
  }

  function hook() {
    const old = root.schirm;
    if (typeof old === "function" && !old.__ou) {
      const neu = function (name) {
        if (name === "scOpUeb") { oeffnen(true); return; }
        const s = $("scOpUeb"); if (s) s.hidden = true;
        return old.apply(this, arguments);
      };
      neu.__ou = true; root.schirm = neu;
    }
    root.addEventListener("popstate", e => {
      const st = e.state || {}, s = $("scOpUeb");
      if (st.seite === "scOpUeb") { oeffnen(true); return; }
      /* пока scOpUeb не внесён в GENZURUECK: самой уйти со своего экрана */
      if (s && !s.hidden) {
        s.hidden = true;
        if (typeof root.schirm === "function") root.schirm(st.seite || "scStart");
        if ((st.seite || "scStart") === "scStart" && typeof root.renderStart === "function") { try { root.renderStart(); } catch (x) { } }
      }
    });
  }

  const api = {
    oeffnen, KATALOG, FALLBACK, erkenne, alleTreffer, verbStellen, anzahl, htmlZuText, saetze, kandidaten, gaPool, fallbackPool,
    optionen, zahlOptionen, rundeBauen, frageBauen, pruefe, verbuchen, verwechslungen, journalEintrag, poolSetzen, poolLaden,
    starten, beantworten, weiter, abbrechen, zumUeberblick,
    stand: () => kopie(state), neuLaden: () => { state = load(); return kopie(state); }, speichern: save,
    info: () => kopie(INFO), fehler: () => readError || saveError
  };
  root.GENOPUEB = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hasDom) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook(); }
})(typeof window !== "undefined" ? window : globalThis);
