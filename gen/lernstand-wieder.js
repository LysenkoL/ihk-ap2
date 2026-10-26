/* Общая очередь новых наблюдений. Самооценки остаются самооценками;
   скопированное решение не закрывает самостоятельную ошибку. */
"use strict";
(function (root) {
  const QUELLEN = { sql: "SQL", algo: "Алгоритмы", praxis: "Практика", lernweg: "Учебный маршрут", code: "Код", normal: "Нормализация", operatoren: "Операторы IHK", trace: "Schreibtischtest", englisch: "Английский текст" };
  /* Übungen mit neuen Zahlen (gen/uebung-gen.js): source "gen:<sammlung>" */
  const quelleName = s => Object.prototype.hasOwnProperty.call(QUELLEN, s) ? QUELLEN[s]
    : /^gen:/.test(String(s)) ? (((root.GENUEBGEN && root.GENUEBGEN.sammlungen().find(x => "gen:" + x.id === s)) || {}).titel || "Упражнение") : null;
  const HILFE = { selbst: "самостоятельно", hilfe: "с помощью", loesung: "с открытым решением" };
  const ART = { auto: "автопроверка", recognition: "узнавание ответа", selbst: "самооценка" };
  const MODI = { bubble: "Bubble Sort", selection: "Selection Sort", insertion: "Insertion Sort", binaer: "Binäre Suche", linear: "Lineare Suche" };
  const read = key => { try { return JSON.parse(root.localStorage.getItem(key) || "null"); } catch (e) { return null; } };
  const show = value => typeof value === "string" ? value : JSON.stringify(value);
  const array = value => Array.isArray(value) ? value : [];
  function algoVollstaendig(s) {
    if (!s || s.type !== "algo" || !Object.prototype.hasOwnProperty.call(MODI, s.modus) || !s.aufgabe ||
        !Array.isArray(s.aufgabe.feld) || !Number.isInteger(s.schritt) || s.schritt < 0 || !Object.prototype.hasOwnProperty.call(s, "soll")) return false;
    if (s.phase === "sortieren") return ["bubble", "selection", "insertion"].includes(s.modus) && typeof s.aufgabe.auf === "boolean";
    if (["suchgrenzen", "entscheidung"].includes(s.phase)) return s.modus === "binaer" && Number.isFinite(s.aufgabe.x);
    return s.phase === "linear" && s.modus === "linear" && Number.isFinite(s.aufgabe.x);
  }
  function sammeln() {
    const events = root.GENLERNSTAND ? root.GENLERNSTAND.list() : [], ids = new Map(), offen = new Map();
    events.forEach(e => { if (e && e.id) ids.set(e.id, (ids.get(e.id) || 0) + 1); });
    events.slice().sort((a, b) => ((a && a.t) || 0) - ((b && b.t) || 0)).forEach(e => {
      if (!e || !quelleName(e.source) || !e.id || ids.get(e.id) !== 1 || !Object.prototype.hasOwnProperty.call(ART, e.kind) || !Object.prototype.hasOwnProperty.call(HILFE, e.support) ||
          typeof e.task !== "string" || !Number.isFinite(e.correct) || !Number.isFinite(e.max) || e.max <= 0 || e.correct < 0 || e.correct > e.max) return;
      const key = JSON.stringify([e.source, e.task, e.kind]);
      if (e.correct < e.max) offen.set(key, e);
      else if (e.support === "selbst" && !e.familiar && offen.has(key) && (e.t || 0) > (offen.get(key).t || 0)) offen.delete(key);
      else if ((e.support !== "selbst" || e.familiar) && !offen.has(key)) offen.set(key, e);
    });
    return Array.from(offen.values()).map(e => {
      let titel = quelleName(e.source);
      try { titel = material(e).title || titel; } catch (error) { }
      const pruefen = e.correct === e.max;
      const d = new Date(e.t); d.setDate(d.getDate() + 1);
      const faellig = pruefen ? d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") : undefined;
      return { id: "ls:" + e.source + ":" + e.id, event: e, verlust: e.max - e.correct, pruefen, faellig,
        titel, wo: quelleName(e.source) + " · " + ART[e.kind] + " · " + HILFE[e.support],
        punkte: e.correct + "/" + e.max + " · " + ART[e.kind] + " · " + HILFE[e.support] };
    });
  }
  function original(e) {
    if (e.snapshot) return e.snapshot;
    if (e.source === "praxis") {
      let state;
      try { state = root.GENPRAXIS && root.GENPRAXIS.stand(e.task); } catch (error) { }
      if (!state) state = ((read("ap2:praxis") || {}).tasks || {})[e.task];
      const attempt = state && (state.attempts || []).find(a => "praxis:" + a.id === e.id);
      return attempt && attempt.snapshot;
    }
    if (e.source === "lernweg") {
      const state = root.GENLERNWEG ? root.GENLERNWEG.stand() : read("ap2:lernweg");
      const attempt = state && (state.history || []).find(a => a.id === e.id);
      return attempt && attempt.snapshot;
    }
    return null;
  }
  function material(e) {
    const s = original(e);
    if (["code", "normal", "operatoren"].includes(e.source) && s) return {
      title: s.title || quelleName(e.source), question: s.question, code: s.signatur, solution: s.solution,
      explanation: s.explanation, notice: s.notice
    };
    if (e.source === "code") {
      const a = (root.AP2_CODE || []).find(a => a.id === e.task);
      if (a) return { title: a.titel, question: a.kontext + "\n" + a.aufgabe, solution: a.loesung,
        notice: "Текущая версия: условие прежней попытки не сохранено." };
    }
    if (e.source === "trace") {
      const loesung = (() => { try { return root.GENTRACE ? root.GENTRACE.loesungText(e.task) : ""; } catch (error) { return ""; } })();
      if (s && s.type === "trace") return { title: s.title, question: s.question, code: s.code, solution: loesung || "Открой задачу в тренажёре «Schreibtischtest» и нажми «Показать правильно»." };
    }
    if (e.source === "sql") {
      if (s && s.type === "sql") return { title: s.title, question: s.question, solution: s.solution, explanation: s.explanation, schema: s.schema, code: s.before };
      const a = root.GENSQLDATEN && root.GENSQLDATEN.AUFGABEN.find(a => a.id === e.task);
      if (a) return { title: a.titel, question: a.text, solution: a.loesung, explanation: a.ru,
        notice: "Текущая версия задания: в старом наблюдении снимок условия не сохранён. Схему таблиц можно открыть в SQL-тренажёре." };
    }
    if (e.source === "algo") {
      if (algoVollstaendig(s)) {
        const a = s.aufgabe, n = (s.schritt || 0) + 1;
        const instruction = s.phase === "sortieren" ? "Geben Sie das Array nach Durchlauf " + n + " an. Sortieren Sie " + (a.auf === false ? "absteigend." : "aufsteigend.") :
          s.phase === "suchgrenzen" ? "Geben Sie links, rechts und mitte im Suchschritt " + n + " an, oder begründen Sie, warum der Suchbereich leer ist. Indizes beginnen bei 0." :
          s.phase === "entscheidung" ? "Welche Entscheidung folgt in Suchschritt " + n + ": links, rechts, gefunden oder leer?" :
            "Wie viele Elemente prüft die lineare Suche, bis der Wert gefunden ist oder sein Fehlen feststeht?";
        return { title: MODI[s.modus], question: instruction + "\nМассив: " + show(a.feld) + (a.x != null ? "\nGesucht: " + a.x : ""),
          solution: show(s.soll), notice: "Сохранён конкретный шаг. В тренажёре откроется новый пример этого алгоритма." };
      }
      return { title: "Алгоритмы", question: "Исходную задачу нельзя полностью восстановить из этой старой записи. Открой новый пример того же навыка и запиши промежуточные состояния.",
        solution: "Для этой записи точный разбор не сохранён. Реши новый пример в тренажёре: там проверяется каждый введённый шаг." };
    }
    if (e.source === "praxis" && s && s.variante) {
      const v = s.variante;
      return { title: s.titel, question: v.auftrag, code: v.code,
        fields: array(v.felder).filter(Boolean).map(f => f.label), solution: v.loesung, explanation: v.analyse,
        rubric: array(v.rubrik).filter(Boolean).map(r => r.text), notice: "Сохранено условие этой попытки. Открытие тренажёра продолжит текущую работу; история ответов остаётся на месте." };
    }
    if (e.source === "lernweg") {
      const u = !s && (root.AP2_LERNWEG || []).find(u => u.id === e.task);
      const v = s || u;
      if (v) return { title: v.title, question: v.control, solution: v.answer, rubric: v.rubric,
        notice: s ? "Разбор сохранён вместе с твоей самооценкой. Это не автоматическая проверка смысла ответа." : "Текущая версия занятия: снимок прежнего условия не сохранён." };
    }
    if (e.source === "englisch" && s && s.type === "englisch") return { title: s.title, question: s.question, solution: s.solution };
    if (/^gen:/.test(e.source) && s && s.type === "gen") return { title: s.title, question: s.question, solution: s.solution, explanation: s.explanation,
      notice: "Тот же вариант (те же числа) можно открыть снова и решить без подсказки." };
    return { title: quelleName(e.source), question: "Условие этой попытки здесь недоступно. Сохранившийся ответ можно сравнить с новой задачей в тренажёре.",
      solution: "Точный разбор не сохранён. Открой тренажёр и выбери новую задачу этого навыка." };
  }
  const append = (target, tag, value, cls) => {
    if (value == null || value === "") return;
    const n = document.createElement(tag); n.className = cls || "wd-text"; n.textContent = value; target.appendChild(n); return n;
  };
  function frage(x, ziel) {
    const m = material(x.event);
    append(ziel, "h3", m.title); append(ziel, "p", m.notice, "wd-sub");
    if (x.pruefen) append(ziel, "p", "Решено с помощью или уже знакомо. Проверь понимание без подсказок в другой день, затем на другом примере. Самооценка здесь не доказывает самостоятельное владение.", "wd-sub");
    append(ziel, "p", m.question); append(ziel, "pre", m.code);
    array(m.fields).forEach(label => append(ziel, "p", label));
    if (m.schema) { const d = document.createElement("details"); append(d, "summary", "Схема таблиц для этого задания"); append(d, "pre", m.schema); ziel.appendChild(d); }
    append(ziel, "p", "Сначала сформулируй новый ответ. После раскрытия разбора оцени его сама; эта отметка не заменяет автоматическую проверку.", "wd-sub");
  }
  function loesung(x, ziel) {
    const m = material(x.event);
    append(ziel, "pre", m.solution); append(ziel, "p", m.explanation, "wd-sub");
    array(m.rubric).forEach(rule => append(ziel, "p", "Критерий: " + rule));
    if (m.rubric != null && !Array.isArray(m.rubric)) append(ziel, "p", "Критерии в этой записи неполные. Сравни ответ с разбором в исходном тренажёре.", "wd-sub");
    append(ziel, "p", "Твой прежний ответ:", "wd-sub");
    append(ziel, "pre", show(x.event.source === "sql" && x.event.answers && typeof x.event.answers.code === "string" ? x.event.answers.code : x.event.answers));
    append(ziel, "p", ART[x.event.kind] + "; " + HILFE[x.event.support] + ".", "wd-sub");
  }
  function einordnen(x, wert, stand, antwort) {
    if (!["gut", "halb", "nicht"].includes(wert) || !root.GENLERNSTAND) return;
    root.GENLERNSTAND.record({ topic: x.event.topic, source: "wiederholung", task: x.event.source + ":" + x.event.task,
      correct: wert === "gut" ? 1 : wert === "halb" ? 0.5 : 0, max: 1, kind: "selbst", support: "loesung",
      answers: { wert, ursprung: x.event.id, antwort: String(antwort || "") }, snapshot: material(x.event), reason: "Самооценка после раскрытия разбора в очереди повторения." });
  }
  function oeffnen(x) {
    const e = x.event;
    if (e.source === "sql" && root.GENSQL) return root.GENSQL.oeffnen({ id: e.task });
    if (e.source === "algo" && root.GENALGO) {
      const mode = (e.snapshot || {}).modus || e.task.split(":")[0];
      return root.GENALGO.oeffnen(MODI[mode] ? mode : undefined);
    }
    if (e.source === "praxis" && root.GENPRAXIS) return root.GENPRAXIS.oeffnen(e.task);
    if (e.source === "lernweg" && root.GENLERNWEG) return root.GENLERNWEG.oeffnen(e.task);
    if (e.source === "code" && root.GENCODE) return root.GENCODE.oeffnen(e.task);
    if (e.source === "trace" && root.GENTRACE) return root.GENTRACE.oeffnen(e.task);
    if (e.source === "englisch" && root.GENENGL) return root.GENENGL.oeffnen(String(e.task).split(":")[0]);
    if (/^gen:/.test(e.source) && root.GENUEBGEN) { const s = e.snapshot || {}, [aid, seed] = String(e.task).split(":"); return root.GENUEBGEN.oeffnen(s.sammlung || e.source.slice(4), s.aufgabe || aid, s.seed || Number(seed) || undefined); }
    if (e.source === "normal" && root.GENNORMAL) { const [id, step] = e.task.split(":"); return root.GENNORMAL.oeffnen(id, step); }
    if (e.source === "operatoren" && root.GENOPUEB) return root.GENOPUEB.oeffnen({task:e.task,ref:(e.answers||{}).ref,event:e});
  }
  const api = { key: "lernstand", name: "Практика и учебный маршрут", rang: 7, sammeln, frage, loesung, einordnen, oeffnen };
  root.GENLERNSTANDWIEDER = api;
  root.GENWIEDER_EXTRA = (root.GENWIEDER_EXTRA || []).filter(p => p.key !== api.key);
  root.GENWIEDER_EXTRA.push(api);
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
