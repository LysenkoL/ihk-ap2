/* ============================================================================
   gen/katalog-ap2.js — Prüfungskatalog AP2 als Checkliste: Thema → wo üben →
   mein Stand
   ----------------------------------------------------------------------------
   Zeigt alle Themenkreise des Katalogs AP2 FIAE (2. Auflage 2024, Daten in
   gen/katalog-ap2-daten.js): was es ist, wo man es in dieser App übt, wie es
   bisher lief, was mit der 2. Auflage neu ist — und ehrlich, wo es (noch)
   nichts zu üben gibt.

   Bewusst ein eigenes, leichtes Modul statt gen/katalog.js (AP1): der alte
   Katalog ordnet Material über Suchmuster zu und schreibt den Katalogtext
   wörtlich ab; hier sind die Ziele von Hand gewählt (höchstens 4 je Punkt)
   und die Texte eigene Kurzfassungen. Alte Dateien bleiben unverändert.

   Stand je Punkt (nichts davon ist eine Note oder Prognose):
     • Quiz              GENLERNEN.zahlen  — letzte Antwort je Frage (Erkennen)
     • Lernweg           GENLERNWEG.stand() — done / Selbstprüfung
     • Praxis            GENPRAXIS.stand(id) — letzter Versuch
     • Trainer-Themen    GENLERNSTAND.summary() — sql, algo, normalisierung, taktik
     • Kurzfragen        GENSATZ.zahlen — sitzt / wackelig / neu
     • Aus Prüfungen     GENAZUBI.zustand + GENLERNWEG.aufgabeStand
   Eigene Einschätzung je Punkt: „знаю / повторить / не знаю“ in
   localStorage "ap2:katalog2" = { "<punkt-id>": { s: "kann"|"wieder"|"nicht"|"", t } }
   (flach, damit der Geräteabgleich je Punkt zusammenführt). Kaputte Daten
   werden nie überschrieben: dann ist das Markieren gesperrt, mit Hinweis.

   API: window.GENKATALOG2 = { oeffnen(filter|id|ansicht?), statusVon, filtern,
        zaehlen, suchen, marke, markieren, quellenAusApp, … }
   Bildschirm: div.seite#scKatalog2 (Muster: gen/lernweg.js).
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const SK = "ap2:katalog2";
  const MARKEN = { kann: "Знаю", wieder: "Повторить", nicht: "Не знаю" };
  const FILTER = [["alle", "Все"], ["neu", "Новое 2025"], ["offen", "Не начато"], ["fehler", "Есть ошибки"],
    ["ga1", "GA1"], ["ga2", "GA2"], ["wiso", "WiSo"], ["luecken", "Пробелы"]];
  const FILTER_INFO = {
    neu: "Пункты, которые обзоры 2-го издания называют новыми и которые есть на страницах каталога.",
    offen: "Ни одной попытки по ссылкам этого пункта, и ты не отметила его «Знаю».",
    fehler: "Ошибки в квизе, практике, тренажёре, Kurzfragen, самопроверке или потерянные баллы в заданиях из экзаменов — плюс пункты, которые ты сама отметила «Повторить» или «Не знаю».",
    ga1: "Где ждать: GA1 «Planen eines Softwareproduktes» (оценка по смыслу и по 20 экзаменам).",
    ga2: "Где ждать: GA2 «Entwicklung und Umsetzung von Algorithmen» (оценка по смыслу и по 20 экзаменам).",
    wiso: "Wirtschafts- und Sozialkunde: 60 минут, около 30 заданий.",
    luecken: "Пункты без материала в приложении, только с бланками или с частичным пробелом (что именно не покрыто — в описании пункта)."
  };
  /* Knöpfe im Diagramm-Trainer (index.html) — wie gen/finder.js: Klick auf den Knopf */
  const DIAGRAMM = {
    netzplan: ["btnNetzZufall", "Netzplan üben"], gantt: ["btnGantt", "Gantt-Diagramm üben"],
    aktivitaet: ["btnAktivitaet", "Aktivitätsdiagramm üben"], klasse: ["btnKlassen", "Klassendiagramm üben"],
    er: ["btnErGen", "ER-Modell zeichnen"]
  };
  const OEFFNER = { quiz: "GENLERNEN", lernweg: "GENLERNWEG", praxis: "GENPRAXIS", pruefung: "GENLERNWEG", satz: "GENSATZ",
    code: "GENCODE", sql: "GENSQL", algo: "GENALGO", normal: "GENNORMAL", operatoren: "GENOPUEB", bogen: "GENAZUBI" };
  /* Themen im Lernjournal für Trainer-Ziele (gen/lernstand.js, Feld topic) */
  const JOURNAL = { sql: "sql", code: "algo", algo: "algo", normal: "normalisierung", operatoren: "taktik" };
  const JOURNAL_NAME = { sql: "SQL", algo: "алгоритмы и код", normalisierung: "нормализация", taktik: "операторы и тактика" };
  const STUFE = {
    keine: "не входит в письменный экзамен", nichts: "нет материала в приложении", bogen: "пока только в бланках",
    offen: "не начато", fehler: "есть ошибки", begonnen: "в работе, ошибок нет"
  };

  const daten = () => root.AP2_KATALOG2 || { punkte: [], gruppen: [], bereiche: [], aenderungen: {} };
  const punkte = () => daten().punkte || [];
  const THEMEN = () => root.AP2_THEMEN || [];
  const UNITS = () => root.AP2_LERNWEG || [];
  const PRAXIS = () => root.AP2_PRAXIS || [];
  const TRAINING = () => root.AP2_TRAINING || [];
  const CODE = () => root.AP2_CODE_AUFGABEN || [];
  const hat = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const wort = (n, eins, zwei, fuenf) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? eins : a >= 2 && a <= 4 && (b < 12 || b > 14) ? zwei : fuenf; };

  /* ======================================================================
     Eigene Markierung — ap2:katalog2
     ====================================================================== */
  let marken = {}, lesefehler = "";
  function lesen() {
    let roh;
    try { roh = root.localStorage ? root.localStorage.getItem(SK) : null; }
    catch (e) { return { fehler: "Хранилище браузера сейчас недоступно: отметки не загружены, новые тоже не сохранятся." }; }
    if (roh == null || roh === "") return { werte: {} };
    try {
      const x = JSON.parse(roh);
      if (!x || typeof x !== "object" || Array.isArray(x)) throw new Error("Format");
      return { werte: x };
    } catch (e) {
      return { fehler: "Не удалось прочитать сохранённые отметки каталога. Они оставлены как есть; новые отметки пока не сохраняются. Сохрани резервную копию в «Geräte abgleichen & sichern»." };
    }
  }
  function neuLesen() { const r = lesen(); lesefehler = r.fehler || ""; marken = r.werte || {}; return !lesefehler; }
  neuLesen();
  /** "kann" | "wieder" | "nicht" | "" — ungültige Einträge zählen als „keine Markierung“ */
  function marke(id) { const v = marken[id]; return v && typeof v === "object" && hat(MARKEN, v.s) ? v.s : ""; }
  /** wert "" nimmt die Markierung zurück (bleibt als { s: "" } für den Abgleich stehen) */
  function markieren(id, wert) {
    wert = wert || "";
    if (!punkte().some(p => p.id === id)) return { ok: false, fehler: "Неизвестный пункт каталога." };
    if (wert && !hat(MARKEN, wert)) return { ok: false, fehler: "Неизвестная отметка." };
    const r = lesen();                       /* frisch lesen: Abgleich oder anderer Tab */
    if (r.fehler) { lesefehler = r.fehler; return { ok: false, fehler: r.fehler }; }
    const neu = Object.assign({}, r.werte, { [id]: { s: wert, t: Date.now() } });
    try { root.localStorage.setItem(SK, JSON.stringify(neu)); }
    catch (e) { return { ok: false, fehler: "Не удалось сохранить отметку: хранилище браузера переполнено или недоступно. Отметка осталась прежней." }; }
    marken = neu; lesefehler = "";
    return { ok: true, wert };
  }

  /* ======================================================================
     Ziele: gibt es sie in den Daten, und ist das Modul geladen?
     ====================================================================== */
  function zielVon(l) {
    if (!l || typeof l !== "object") return null;
    switch (l.typ) {
      case "quiz": return THEMEN().find(t => t.id === l.id) || null;
      case "lernweg": return UNITS().find(u => u.id === l.id) || null;
      case "praxis": return PRAXIS().find(p => p.id === l.id) || null;
      case "pruefung": return TRAINING().find(t => t.id === l.id) || null;
      case "satz": return (root.SATZ_POOL || []).some(c => c.thema === l.id) ? { thema: l.id } : null;
      case "code": return l.id ? (CODE().find(a => a.id === l.id) || null) : {};
      case "diagramm": return hat(DIAGRAMM, l.id) ? { knopf: DIAGRAMM[l.id][0] } : null;
      case "sql": case "algo": case "normal": case "operatoren": case "bogen": return l.id ? null : {};
      default: return null;
    }
  }
  function verfuegbar(l) {
    if (!zielVon(l)) return false;
    if (l.typ === "diagramm") return hatDom && !!document.getElementById(DIAGRAMM[l.id][0]);
    const m = root[OEFFNER[l.typ]];
    return !!m && typeof (l.typ === "satz" ? m.starten : m.oeffnen) === "function";
  }
  function linkText(l) {
    const z = zielVon(l) || {};
    switch (l.typ) {
      case "quiz": return "Тема и квиз: " + (z.ru || z.titel || l.id);
      case "lernweg": return "Занятие: " + (z.title || l.id);
      case "praxis": return "Практика: " + (z.titel || l.id);
      case "pruefung": return "Из экзаменов: " + (z.name || l.id) + (z.aufgaben ? " (" + z.aufgaben.length + ")" : "");
      case "satz": return "Kurzfragen: " + l.id;
      case "code": return l.id ? "Код с проверкой: " + (z.titel || l.id) : "Код с автопроверкой";
      case "sql": return "SQL-тренажёр";
      case "algo": return "Сортировка и поиск по шагам";
      case "normal": return "Нормализация по шагам";
      case "operatoren": return "Операторы: что от меня хотят";
      case "diagramm": return "Тренажёр: " + (DIAGRAMM[l.id] ? DIAGRAMM[l.id][1] : l.id);
      case "bogen": return "Оригинальные бланки";
      default: return l.typ;
    }
  }

  /* ======================================================================
     Stand je Punkt — reine Funktion. Q liefert die Beobachtungen
     (quellenAusApp() im Browser, Attrappen im Test).
     ====================================================================== */
  const LEER = { verfuegbar: () => false, quiz: () => null, lernweg: () => null, praxis: () => null,
    journal: () => null, satz: () => null, pruefung: () => null };
  const datum = t => { try { return new Date(t).toLocaleDateString("ru"); } catch (e) { return ""; } };
  function statusVon(p, Q) {
    Q = Object.assign({}, LEER, Q || {});
    const links = (p.trainieren || []).filter(l => { try { return Q.verfuegbar(l); } catch (e) { return false; } });
    const material = p.pruefung === "keine" ? "keine" : links.some(l => l.typ !== "bogen") ? "ja" : links.length ? "bogen" : "nein";
    const zeilen = [], kurz = [], themen = [];
    let fehler = false, aktiv = false;
    const name = l => { const z = zielVon(l) || {}; return z.ru || z.title || z.titel || z.name || l.id; };
    links.forEach(l => {
      if (JOURNAL[l.typ] && !themen.includes(JOURNAL[l.typ])) themen.push(JOURNAL[l.typ]);
      if (l.typ === "quiz") {
        const z = Q.quiz(l.id);
        if (!z || !z.gesamt) return;
        const n = (z.richtig || 0) + (z.falsch || 0);
        if (n) { aktiv = true; kurz.push("квиз " + z.richtig + "/" + z.gesamt); }
        if (z.falsch) fehler = true;
        zeilen.push("Квиз «" + name(l) + "»: " + (n ? "верно " + z.richtig + " из " + z.gesamt +
          (z.falsch ? ", ошибка в " + z.falsch + " " + wort(z.falsch, "вопросе", "вопросах", "вопросах") : "") +
          (z.neu ? ", без ответа " + z.neu : "") : "ещё не начат (" + z.gesamt + " " + wort(z.gesamt, "вопрос", "вопроса", "вопросов") + ")") + ".");
      } else if (l.typ === "lernweg") {
        const z = Q.lernweg(l.id);
        if (!z) return;
        const luecke = z.max != null && z.correct != null && z.correct < z.max;
        if (z.done) { aktiv = true; kurz.push("занятие ✓"); }
        if (luecke) fehler = true;
        zeilen.push("Занятие «" + name(l) + "»: " + (z.done ? "разобрано " + datum(z.done) +
          (z.max ? ", самопроверка " + z.correct + " из " + z.max : ", без самопроверки") : "ещё не разобрано") + ".");
      } else if (l.typ === "praxis") {
        const z = Q.praxis(l.id);
        if (!z) return;
        if (z.versuche) {
          aktiv = true; kurz.push("практика ×" + z.versuche);
          if (z.max != null && z.correct != null && z.correct < z.max) fehler = true;
        }
        zeilen.push("Практика «" + name(l) + "»: " + (z.versuche ? z.versuche + " " + wort(z.versuche, "попытка", "попытки", "попыток") +
          (z.max ? ", последняя " + z.correct + " из " + z.max : "") : "ещё не решала") + ".");
      } else if (l.typ === "satz") {
        const z = Q.satz(l.id);
        if (!z || !z.gesamt) return;
        const wackelig = (z.halb || 0) + (z.nicht || 0), geuebt = (z.gut || 0) + wackelig;
        if (geuebt) { aktiv = true; kurz.push("Kurzfragen " + (z.gut || 0) + "/" + z.gesamt); }
        if (wackelig) fehler = true;
        zeilen.push("Kurzfragen «" + l.id + "»: " + (geuebt ? "сидят " + (z.gut || 0) + ", шатко " + wackelig + ", новых " + (z.neu || 0) :
          "ещё не отвечала (" + z.gesamt + " " + wort(z.gesamt, "вопрос", "вопроса", "вопросов") + ")") + ".");
      } else if (l.typ === "pruefung") {
        const z = Q.pruefung(l.id);
        if (!z || !z.gesamt) return;
        if (z.begonnen) { aktiv = true; kurz.push("экзамены " + z.fertig + "/" + z.gesamt); }
        if (z.verlust) fehler = true;
        zeilen.push("Из экзаменов «" + name(l) + "»: " + (z.begonnen ? "оценено " + z.fertig + " из " + z.gesamt + " " + wort(z.gesamt, "задания", "заданий", "заданий") +
          (z.begonnen > z.fertig ? ", начато ещё " + (z.begonnen - z.fertig) : "") + (z.verlust ? ", с потерей баллов: " + z.verlust : "") :
          "ещё не решала (" + z.gesamt + " " + wort(z.gesamt, "задание", "задания", "заданий") + ")") + ".");
      }
    });
    themen.forEach(t => {
      const j = Q.journal(t);
      if (!j || !j.total) return;
      aktiv = true;
      const weak = (j.weak || 0) + (j.selfWeak || 0);
      if (weak) fehler = true;
      kurz.push((JOURNAL_NAME[t] || t) + ": " + j.total + " " + wort(j.total, "попытка", "попытки", "попыток"));
      zeilen.push("Журнал, вся тема «" + (JOURNAL_NAME[t] || t) + "»: " + j.total + " " + wort(j.total, "попытка", "попытки", "попыток") +
        " (сама с автопроверкой " + (j.independent || 0) + ", с помощью " + (j.assisted || 0) +
        (j.recognition ? ", узнавание " + j.recognition : "") + (j.selfRated ? ", самооценка " + j.selfRated : "") + ")" +
        (weak ? ", задач с ошибками: " + weak : ", ошибок нет") + ".");
    });
    let stufe;
    if (material === "keine") stufe = "keine";
    else if (fehler) stufe = "fehler";
    else if (aktiv) stufe = "begonnen";
    else if (material === "nein") stufe = "nichts";
    else if (material === "bogen") stufe = "bogen";
    else stufe = "offen";
    return { stufe, text: STUFE[stufe], material, fehler, aktiv, zeilen, kurz: kurz.slice(0, 3), links };
  }

  /* ======================================================================
     Beobachtungen aus der App (mit Zwischenspeicher je Aufbau)
     ====================================================================== */
  function pruefungStand(id, zustand) {
    const t = TRAINING().find(x => x.id === id);
    if (!t) return null;
    const r = { gesamt: (t.aufgaben || []).length, begonnen: 0, fertig: 0, verlust: 0 };
    const W = root.GENLERNWEG;
    if (!W || typeof W.aufgabeStand !== "function" || typeof zustand !== "function") return r;
    (t.aufgaben || []).forEach(([mid, , punkteMax, teile]) => {
      let z = null;
      try { z = zustand(mid); } catch (e) { z = null; }
      if (!z || !Array.isArray(teile)) return;
      const st = W.aufgabeStand(z, teile);
      if (st.beantwortet || st.bewertet) r.begonnen++;
      if (st.gesamt && st.bewertet === st.gesamt) {
        r.fertig++;
        const p = teile.map(tid => (z.p || {})[tid]);
        if (p.every(x => typeof x === "number" && isFinite(x)) && p.reduce((s, x) => s + x, 0) < punkteMax) r.verlust++;
      }
    });
    return r;
  }
  function quellenAusApp() {
    const cache = new Map();
    const memo = (k, f) => {
      if (!cache.has(k)) { let v = null; try { v = f(); } catch (e) { v = null; } cache.set(k, v); }
      return cache.get(k);
    };
    const lw = () => memo("lw", () => (root.GENLERNWEG && root.GENLERNWEG.stand ? root.GENLERNWEG.stand() : null));
    return {
      verfuegbar,
      quiz: id => memo("q:" + id, () => {
        const L = root.GENLERNEN;
        if (!L || !L.alleFragen || !L.zahlen) return null;
        const fr = L.alleFragen().filter(q => q.thema === id);
        return fr.length ? L.zahlen(fr) : null;
      }),
      lernweg: id => memo("l:" + id, () => {
        const st = lw();
        if (!st) return null;
        const c = (st.checks || {})[id];
        return { done: (st.done || {})[id] || 0, correct: c && c.max ? c.correct : null, max: c && c.max ? c.max : null };
      }),
      praxis: id => memo("p:" + id, () => {
        const P = root.GENPRAXIS;
        if (!P || !P.stand) return null;
        const a = (P.stand(id) || {}).attempts || [], z = a[a.length - 1];
        return { versuche: a.length, correct: z ? z.correct : null, max: z ? z.max : null };
      }),
      journal: topic => (memo("j", () => (root.GENLERNSTAND && root.GENLERNSTAND.summary ? root.GENLERNSTAND.summary() : [])) || [])
        .find(s => s && s.topic === topic) || null,
      satz: thema => memo("s:" + thema, () => {
        const S = root.GENSATZ;
        if (!S || !S.zahlen) return null;
        const l = (root.SATZ_POOL || []).filter(c => c.thema === thema);
        return l.length ? S.zahlen(l) : null;
      }),
      pruefung: id => memo("a:" + id, () => pruefungStand(id, root.GENAZUBI && root.GENAZUBI.zustand
        ? mid => memo("z:" + mid, () => root.GENAZUBI.zustand(mid)) : null))
    };
  }

  /* ======================================================================
     Suche, Filter, Zählen
     ====================================================================== */
  /* ä = ae = a usw.: „Uebung“, „Übung“ und „Ubung“ finden dasselbe; ё = е */
  const norm = s => String(s == null ? "" : s).toLowerCase()
    .replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u")
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss").replace(/ё/g, "е")
    .replace(/[‐-―−]/g, "-").replace(/\s+/g, " ").trim();
  const gruppeVon = p => (daten().gruppen || []).find(g => g.id === p.gruppe) || {};
  function suchtext(p) {
    const g = gruppeVon(p);
    return norm([p.nr, p.titel, p.ru, (p.stichworte || []).join(" "), p.hinweis, p.luecke, p.pruefung, g.titel, g.ru, p.neu ? "neu 2025 новое" : ""].join(" "));
  }
  function suchen(p, q) {
    const w = norm(q).split(" ").filter(Boolean);
    if (!w.length) return true;
    const t = suchtext(p);
    return w.every(x => t.includes(x));
  }
  function passt(p, filter, st, mk) {
    switch (filter) {
      case "neu": return !!p.neu;
      case "offen": return p.pruefung !== "keine" && !st.aktiv && mk !== "kann";
      case "fehler": return st.fehler || mk === "wieder" || mk === "nicht";
      case "ga1": return /GA1/.test(p.pruefung || "");
      case "ga2": return /GA2/.test(p.pruefung || "");
      case "wiso": return p.pruefung === "WiSo";
      case "luecken": return p.pruefung !== "keine" && (st.material !== "ja" || !!p.luecke);
      default: return true;
    }
  }
  /** ansicht: { f, q }; liefert [{ p, st, mk }] in Katalogreihenfolge */
  function filtern(liste, ansicht, Q, mkVon) {
    const a = ansicht || {};
    mkVon = mkVon || marke;
    return liste.map(p => ({ p, st: statusVon(p, Q), mk: mkVon(p.id) }))
      .filter(x => passt(x.p, a.f || "alle", x.st, x.mk) && suchen(x.p, a.q || ""));
  }
  function zaehlen(liste, Q, mkVon) {
    mkVon = mkVon || marke;
    const z = { gesamt: liste.length, mitTraining: 0, kann: 0, wieder: 0, nicht: 0, neu: 0, offen: 0, fehler: 0, nichts: 0, bogen: 0, teil: 0, filter: {} };
    FILTER.forEach(([f]) => { z.filter[f] = 0; });
    liste.forEach(p => {
      const st = statusVon(p, Q), mk = mkVon(p.id);
      if (st.material === "ja") z.mitTraining++;
      if (st.material === "nein") z.nichts++;
      if (st.material === "bogen") z.bogen++;
      if (st.material === "ja" && p.luecke) z.teil++;
      if (mk) z[mk]++;
      if (p.neu) z.neu++;
      FILTER.forEach(([f]) => { if (passt(p, f, st, mk)) z.filter[f]++; });
    });
    z.offen = z.filter.offen; z.fehler = z.filter.fehler;
    return z;
  }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  let ansicht = { f: "alle", q: "", auf: [] };
  let Q = null, suchUhr = null;
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  function knopf(text, fn, klasse) { const b = el("button", "btn" + (klasse ? " " + klasse : ""), text); b.type = "button"; b.onclick = fn; return b; }

  function screen() {
    let s = $("scKatalog2");
    if (s) return s;
    s = el("div", "seite k2-page"); s.id = "scKatalog2"; s.hidden = true;
    const w = el("div", "k2-wrap"); w.id = "k2Inhalt"; s.appendChild(w);
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling); else document.body.appendChild(s);
    return s;
  }

  function zustandSpeichern(extra) {
    try {
      const h = root.history;
      if (!h || !h.state || h.state.seite !== "scKatalog2") return;
      h.replaceState(Object.assign({}, h.state, { k2: Object.assign({ f: ansicht.f, q: ansicht.q, auf: ansicht.auf.slice() }, extra || {}) }), "");
    } catch (e) { /* Verlauf ist Komfort */ }
  }

  function ansichtAus(arg) {
    const P = punkte();
    if (arg && typeof arg === "object") {
      return { f: FILTER.some(([f]) => f === arg.f) ? arg.f : "alle", q: typeof arg.q === "string" ? arg.q : "",
        auf: Array.isArray(arg.auf) ? arg.auf.filter(x => typeof x === "string") : [], y: Number(arg.y) || 0, ziel: arg.ziel || "" };
    }
    if (typeof arg === "string") {
      if (FILTER.some(([f]) => f === arg)) return { f: arg, q: "", auf: ansicht.auf.slice() };
      const p = P.find(x => x.id === arg || x.nr === arg);
      if (p) return { f: "alle", q: p.nr, auf: [p.gruppe], ziel: p.id };
    }
    return { f: ansicht.f, q: ansicht.q, auf: ansicht.auf.slice() };
  }

  function oeffnen(arg, ausVerlauf) {
    if (!hatDom) return null;
    neuLesen();
    const a = ansichtAus(arg);
    ansicht = { f: a.f, q: a.q, auf: a.auf };
    const s = screen();
    document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
    s.hidden = false;
    ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { const e = $(k); if (e) e.hidden = true; });
    if ($("kopfTitel")) $("kopfTitel").hidden = false;
    if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · Prüfungskatalog 2024";
    if ($("kTitel")) $("kTitel").textContent = "Каталог AP2: что учить";
    if (!ausVerlauf) {
      try {
        if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
        history.pushState({ ihk: 1, seite: "scKatalog2", k2: { f: ansicht.f, q: ansicht.q, auf: ansicht.auf.slice() } }, "");
      } catch (e) { }
    }
    zeichnen();
    if (root.GENZURUECK && root.GENZURUECK.knopfPflegen) root.GENZURUECK.knopfPflegen();
    const ziel = a.ziel && $(a.ziel);
    if (ziel) {
      ziel.classList.add("k2-zuletzt");
      if (a.y) root.scrollTo(0, a.y); else if (ziel.scrollIntoView) ziel.scrollIntoView({ block: "start" });
    } else root.scrollTo(0, a.y || 0);
    return ansicht;
  }

  function zeichnen() {
    const w = $("k2Inhalt");
    if (!w) return;
    Q = quellenAusApp();
    w.replaceChildren();
    if (lesefehler) { const al = el("p", "k2-alert", lesefehler); al.setAttribute("role", "alert"); w.appendChild(al); }
    kopf(w);
    const liste = el("div", "k2-liste"); liste.id = "k2Liste"; w.appendChild(liste);
    listeZeichnen();
  }

  function kopf(w) {
    const D = daten();
    const c = el("section", "k2-card k2-kopf");
    c.appendChild(el("h2", null, "Каталог AP2: что учить и где тренировать"));
    const q = el("p", "k2-muted", D.quelle ? D.quelle + " · действует " + (D.gueltig || "") : "");
    q.lang = "de"; c.appendChild(q);
    const zahlen = el("div", "k2-zahlen"); zahlen.id = "k2Zahlen"; c.appendChild(zahlen);

    const wie = el("details", "k2-info");
    wie.appendChild(el("summary", null, "Как читать статус и отметки"));
    [["Статус", "собирается из твоих попыток в приложении: квизы, занятия маршрута, практика, тренажёры, Kurzfragen и задания из экзаменов по теме. Квиз — это узнавание ответа; он не доказывает, что ты решишь задачу сама."],
      ["Есть ошибки", "последний ответ в квизе неверный, в практике или самопроверке остались пробелы, Kurzfrage «шатко», в журнале темы есть задачи с ошибками или в задании из экзамена потеряны баллы."],
      ["Моя отметка", "«Знаю / Повторить / Не знаю» — твоя собственная оценка. Повторное нажатие снимает отметку. Отметки хранятся на этом устройстве и переносятся при «Geräte abgleichen & sichern»."],
      ["Где ждать", "GA1, GA2, WiSo — оценка по разделам экзамена и по частоте тем в 20 оригинальных GA. Это ориентир, а не прогноз."],
      ["Пробелы", "«нет материала» или «пока только в бланках» — в приложении это пока не потренировать. Частичные пробелы описаны в пункте («Чего не хватает»)."]]
      .forEach(([t, x]) => { const p = el("p"); p.appendChild(el("b", null, t + ": ")); p.appendChild(document.createTextNode(x)); wie.appendChild(p); });
    c.appendChild(wie);

    const A = D.aenderungen || {};
    const neu = el("details", "k2-info");
    neu.appendChild(el("summary", null, "Что изменилось во 2-м издании"));
    neu.appendChild(el("p", "k2-muted", "Новое — по обзорам (IT-Berufe-Podcast #191 и др.), отмечено только то, что есть на страницах каталога. Нажми номер, чтобы найти пункт."));
    const ul = el("ul", "k2-aend");
    (A.neu || []).forEach(([was, nrs]) => {
      const li = el("li");
      const t = el("span", null, was + " "); t.lang = "de"; li.appendChild(t);
      (nrs || []).forEach(nr => li.appendChild(knopf(nr, () => { ansicht.f = "alle"; sucheSetzen(nr); }, "ghost klein k2-nr-knopf")));
      ul.appendChild(li);
    });
    neu.appendChild(ul);
    if (A.nichtGefunden) neu.appendChild(el("p", "k2-muted", A.nichtGefunden));
    if ((A.entfernt || []).length) {
      neu.appendChild(el("h3", null, "Убрано"));
      const ul2 = el("ul", "k2-aend");
      A.entfernt.forEach(([was, warum]) => {
        const li = el("li"); const b = el("b", null, was); b.lang = "de"; li.appendChild(b);
        if (warum) li.appendChild(document.createTextNode(" — " + warum));
        ul2.appendChild(li);
      });
      neu.appendChild(ul2);
    }
    (A.auch || []).forEach(x => neu.appendChild(el("p", "k2-muted", x)));
    c.appendChild(neu);

    if (root.GENOPUEB && root.GENOPUEB.oeffnen) {
      const op = el("p", "k2-muted k2-op", "Глубину темы в каталоге задают операторы в заголовках (nennen, erläutern, beurteilen …).");
      op.appendChild(knopf("Тренажёр операторов", () => { merkeAnsicht(""); root.GENOPUEB.oeffnen(); }, "klein"));
      c.appendChild(op);
    }

    const fz = el("div", "k2-filter"); fz.id = "k2Filter"; fz.setAttribute("role", "group"); fz.setAttribute("aria-label", "Фильтр пунктов");
    c.appendChild(fz);
    const lab = el("label", "k2-suche");
    lab.appendChild(el("span", "k2-muted", "Поиск по словам (немецкие или русские)"));
    const inp = el("input"); inp.type = "search"; inp.id = "k2Suche"; inp.placeholder = "например: SQL, Scrum, нормализация, 02.04"; inp.value = ansicht.q;
    inp.setAttribute("autocomplete", "off"); inp.setAttribute("enterkeyhint", "search");
    inp.oninput = () => { clearTimeout(suchUhr); suchUhr = setTimeout(() => { ansicht.q = inp.value; zustandSpeichern(); listeZeichnen(); }, 180); };
    lab.appendChild(inp); c.appendChild(lab);
    const info = el("p", "k2-treffer"); info.id = "k2Treffer"; info.setAttribute("aria-live", "polite"); c.appendChild(info);
    w.appendChild(c);
    /* erst jetzt im Dokument: zahlenZeichnen() und filterZeichnen() suchen ihre Kästen per id */
    zahlenZeichnen();
    filterZeichnen();
  }

  function zahlenZeichnen() {
    const box = $("k2Zahlen");
    if (!box) return;
    const z = zaehlen(punkte(), Q);
    box.replaceChildren();
    [[z.gesamt, "пунктов в каталоге"], [z.mitTraining, "можно тренировать здесь"], [z.kann, "отмечено «Знаю»"], [z.neu, "новых во 2-м издании"]]
      .forEach(([n, t]) => { const d = el("div", "k2-zahl"); d.appendChild(el("b", null, String(n))); d.appendChild(el("span", null, t)); box.appendChild(d); });
    const p = el("p", "k2-muted k2-zahlen-text",
      "Повторить: " + z.wieder + " · не знаю: " + z.nicht + " · есть ошибки: " + z.fehler + " · не начато: " + z.offen +
      " · без материала: " + z.nichts + (z.bogen ? " · только бланки: " + z.bogen : "") + " · частичные пробелы: " + z.teil + ".");
    box.appendChild(p);
    return z;
  }

  function filterZeichnen() {
    const fz = $("k2Filter");
    if (!fz) return;
    const z = zaehlen(punkte(), Q);
    fz.replaceChildren();
    FILTER.forEach(([f, t]) => {
      const b = el("button", "k2-chip" + (ansicht.f === f ? " an" : "")); b.type = "button";
      b.setAttribute("aria-pressed", ansicht.f === f ? "true" : "false");
      b.appendChild(document.createTextNode(t + " ")); b.appendChild(el("span", "k2-n", String(z.filter[f])));
      b.onclick = () => { ansicht.f = f; zustandSpeichern(); filterZeichnen(); listeZeichnen(); };
      fz.appendChild(b);
    });
  }

  function sucheSetzen(q) {
    ansicht.q = q;
    const inp = $("k2Suche"); if (inp) inp.value = q;
    zustandSpeichern(); filterZeichnen(); listeZeichnen();
    const l = $("k2Filter"); if (l && l.scrollIntoView) l.scrollIntoView({ block: "start" });
  }

  function listeZeichnen() {
    const box = $("k2Liste");
    if (!box) return;
    const D = daten(), alle = punkte();
    const treffer = filtern(alle, ansicht, Q);
    const info = $("k2Treffer");
    if (info) {
      info.replaceChildren();
      info.appendChild(document.createTextNode("Показано " + treffer.length + " из " + alle.length + "."));
      if (ansicht.q) info.appendChild(knopf("Сбросить поиск «" + ansicht.q + "»", () => sucheSetzen(""), "ghost klein"));
      if (FILTER_INFO[ansicht.f]) info.appendChild(el("span", "k2-muted k2-filter-info", FILTER_INFO[ansicht.f]));
    }
    box.replaceChildren();
    if (!treffer.length) { box.appendChild(el("p", "k2-card k2-leer", "Ничего не найдено. Попробуй другое слово или фильтр «Все».")); return; }
    const offenAlle = ansicht.f !== "alle" || !!norm(ansicht.q);
    let bereich = "";
    (D.gruppen || []).forEach(g => {
      const inG = treffer.filter(x => x.p.gruppe === g.id);
      if (!inG.length) return;
      if (g.bereich !== bereich) {
        bereich = g.bereich;
        const b = (D.bereiche || []).find(x => x.id === bereich) || { titel: bereich };
        const h = el("h3", "k2-bereich"); const ht = el("span", null, b.titel); ht.lang = "de"; h.appendChild(ht);
        if (b.ru) h.appendChild(el("span", "k2-muted", b.ru));
        box.appendChild(h);
      }
      box.appendChild(gruppeZeichnen(g, inG, offenAlle));
    });
  }

  function gruppeZeichnen(g, inG, offenAlle) {
    const d = el("details", "k2-gruppe");
    d.id = "k2g-" + g.id.replace(/\./g, "-").toLowerCase();
    const alleG = punkte().filter(p => p.gruppe === g.id);
    const s = el("summary");
    const kopfZ = el("span", "k2-g-titel");
    kopfZ.appendChild(el("span", "k2-g-nr", g.id === "A" ? "Anhang" : g.id));
    const t = el("span", null, g.titel); t.lang = "de"; kopfZ.appendChild(t);
    s.appendChild(kopfZ);
    s.appendChild(el("span", "k2-muted", g.ru + " · S. " + g.s));
    const z = zaehlen(alleG, Q);
    const teile = [alleG.length + " " + wort(alleG.length, "пункт", "пункта", "пунктов")];
    if (inG.length !== alleG.length) teile.push("показано " + inG.length);
    if (z.kann) teile.push("знаю " + z.kann);
    if (z.fehler) teile.push("ошибки " + z.fehler);
    if (z.neu) teile.push("новое " + z.neu);
    s.appendChild(el("span", "k2-g-zahl", teile.join(" · ")));
    d.appendChild(s);
    const inhalt = el("div", "k2-g-inhalt");
    d.appendChild(inhalt);
    let gefuellt = false;
    const fuellen = () => { if (gefuellt) return; gefuellt = true; inG.forEach(x => inhalt.appendChild(punktZeichnen(x.p, x.st, x.mk))); };
    d.open = offenAlle || ansicht.auf.includes(g.id);
    if (d.open) fuellen();
    d.addEventListener("toggle", () => {
      if (d.open) fuellen();
      if (offenAlle) return;
      const i = ansicht.auf.indexOf(g.id);
      if (d.open && i < 0) ansicht.auf.push(g.id);
      if (!d.open && i >= 0) ansicht.auf.splice(i, 1);
      zustandSpeichern();
    });
    return d;
  }

  function merkeAnsicht(id) { zustandSpeichern({ y: root.scrollY || 0, ziel: id || "" }); }
  function oeffneLink(p, l) {
    merkeAnsicht(p ? p.id : "");
    switch (l.typ) {
      case "quiz": return root.GENLERNEN.oeffnen(l.id);
      case "lernweg": return root.GENLERNWEG.oeffnen(l.id);
      case "pruefung": return root.GENLERNWEG.oeffnen("@" + l.id);
      case "praxis": return root.GENPRAXIS.oeffnen(l.id);
      case "satz": return root.GENSATZ.starten(null, { themen: [l.id] });
      case "code": return root.GENCODE.oeffnen(l.id || undefined);
      case "sql": return root.GENSQL.oeffnen();
      case "algo": return root.GENALGO.oeffnen();
      case "normal": return root.GENNORMAL.oeffnen();
      case "operatoren": return root.GENOPUEB.oeffnen();
      case "bogen": return root.GENAZUBI.oeffnen(null);
      case "diagramm": { const b = $(DIAGRAMM[l.id][0]); if (b) b.click(); return undefined; }
      default: return undefined;
    }
  }

  function punktZeichnen(p, st, mk) {
    const a = el("article", "k2-punkt k2-st-" + st.stufe); a.id = p.id;
    const zeile = el("div", "k2-zeile");
    zeile.appendChild(el("span", "k2-nr", p.nr));
    if (p.neu) zeile.appendChild(el("span", "k2-badge k2-neu", "neu 2025"));
    zeile.appendChild(el("span", "k2-badge", p.pruefung === "keine" ? "не письменно" : p.pruefung));
    const oft = (p.trainieren || []).filter(l => l.typ === "pruefung").map(l => zielVon(l)).filter(Boolean)
      .sort((x, y) => (y.pruef || 0) - (x.pruef || 0))[0];
    if (oft && oft.pruef) zeile.appendChild(el("span", "k2-badge k2-oft", "в " + oft.pruef + " из 10 " + oft.bereich));
    a.appendChild(zeile);
    const h = el("h4", "k2-titel", p.titel); h.lang = "de"; a.appendChild(h);
    a.appendChild(el("p", "k2-ru", p.ru));
    const sz = el("p", "k2-status");
    sz.appendChild(el("span", "k2-punkt-farbe", "●"));
    sz.appendChild(el("b", null, " " + st.text[0].toUpperCase() + st.text.slice(1)));
    if (st.kurz.length) sz.appendChild(document.createTextNode(" · " + st.kurz.join(" · ")));
    a.appendChild(sz);
    if (st.material === "nein" || st.material === "bogen") {
      if (p.luecke) a.appendChild(el("p", "k2-luecke", p.luecke));
    }

    const mehr = el("details", "k2-mehr");
    mehr.appendChild(el("summary", null, "Ключевые слова и подробности"));
    const ul = el("ul", "k2-stich"); ul.lang = "de";
    (p.stichworte || []).forEach(x => ul.appendChild(el("li", null, x)));
    mehr.appendChild(ul);
    if (p.hinweis) { const hp = el("p", "k2-hinweis"); hp.appendChild(el("b", null, "Важно: ")); hp.appendChild(document.createTextNode(p.hinweis)); mehr.appendChild(hp); }
    if (p.luecke && st.material === "ja") { const lp = el("p", "k2-luecke"); lp.appendChild(el("b", null, "Чего не хватает: ")); lp.appendChild(document.createTextNode(p.luecke)); mehr.appendChild(lp); }
    if (st.zeilen.length) { const sl = el("ul", "k2-zeilen"); st.zeilen.forEach(x => sl.appendChild(el("li", null, x))); mehr.appendChild(sl); }
    else if (st.material === "ja") mehr.appendChild(el("p", "k2-muted", "Пока нет попыток по ссылкам этого пункта."));
    const fehlend = (p.trainieren || []).filter(l => !st.links.includes(l));
    if (fehlend.length) mehr.appendChild(el("p", "k2-muted", "Сейчас недоступно на этой странице: " + fehlend.map(linkText).join("; ") + "."));
    mehr.appendChild(el("p", "k2-muted", "Prüfungskatalog, S. " + p.s + (p.pruefung && p.pruefung !== "keine" ? " · где ждать: " + p.pruefung : "")));
    a.appendChild(mehr);

    if (st.links.length) {
      const akt = el("div", "k2-akt");
      st.links.slice(0, 4).forEach((l, i) => akt.appendChild(knopf(linkText(l), () => oeffneLink(p, l), i === 0 && st.stufe !== "begonnen" ? "primary" : "")));
      a.appendChild(akt);
    }

    const mz = el("div", "k2-marke"); mz.setAttribute("role", "group"); mz.setAttribute("aria-label", "Моя отметка: " + p.nr);
    mz.appendChild(el("span", "k2-muted", "Моя отметка:"));
    const knoepfe = {};
    const meldung = el("p", "k2-alert"); meldung.hidden = true; meldung.setAttribute("role", "alert");
    const pflegen = () => {
      const jetzt = marke(p.id);
      Object.keys(knoepfe).forEach(k => {
        knoepfe[k].classList.toggle("an", jetzt === k);
        knoepfe[k].setAttribute("aria-pressed", jetzt === k ? "true" : "false");
      });
    };
    Object.keys(MARKEN).forEach(k => {
      const b = el("button", "k2-mk k2-mk-" + k, MARKEN[k]); b.type = "button";
      b.onclick = () => {
        const r = markieren(p.id, marke(p.id) === k ? "" : k);
        if (r.ok) { meldung.hidden = true; pflegen(); zahlenZeichnen(); filterZeichnen(); }
        else { meldung.textContent = r.fehler; meldung.hidden = false; }
      };
      knoepfe[k] = b; mz.appendChild(b);
    });
    pflegen();
    a.appendChild(mz);
    a.appendChild(meldung);
    return a;
  }

  /* ======================================================================
     Einhängen: schirm() und Zurück-Taste (wie gen/lernweg.js)
     ====================================================================== */
  function hook() {
    const alt = root.schirm;
    if (typeof alt === "function" && !alt.__k2) {
      const neu = function (name) {
        if (name === "scKatalog2") { oeffnen((root.history && history.state && history.state.k2) || null, true); return undefined; }
        const s = $("scKatalog2"); if (s) s.hidden = true;
        return alt.apply(this, arguments);
      };
      neu.__k2 = true;
      root.schirm = neu;
    }
    root.addEventListener("popstate", e => { if (e.state && e.state.seite === "scKatalog2") oeffnen(e.state.k2 || null, true); });
  }

  const api = { oeffnen, statusVon, filtern, zaehlen, suchen, norm, passt, marke, markieren, lesen, neuLesen, zielVon, verfuegbar,
    linkText, quellenAusApp, pruefungStand, daten, punkte, FILTER, MARKEN, DIAGRAMM, SK, fehler: () => lesefehler };
  root.GENKATALOG2 = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook(); }
})(typeof window !== "undefined" ? window : globalThis);
