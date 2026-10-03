"use strict";
(function (root) {
  const KEY = "ap2:praxis", MODI = ["erklaert", "hilfe", "pruefung"];
  const clone = x => JSON.parse(JSON.stringify(x));
  const daten = () => root.AP2_PRAXIS || [];
  const task = id => { const t = daten().find(x => x.id === id); if (!t) throw new Error("Unbekannte Aufgabe: " + id); return t; };
  let lesefehler = "", ST = { version: 1, tasks: {} }, zaehler = 0;
  try {
    const raw = root.localStorage && root.localStorage.getItem(KEY);
    if (raw) {
      const value = JSON.parse(raw);
      if (!value || value.version !== 1 || !value.tasks || typeof value.tasks !== "object" || Array.isArray(value.tasks)) throw new Error("Unbekanntes Speicherformat");
      ST = value;
    }
  } catch (e) { lesefehler = "Не удалось прочитать сохранённую практику. Данные оставлены без изменения. " + e.message; }
  function commit(next) {
    if (lesefehler) throw new Error(lesefehler);
    try { if (root.localStorage) root.localStorage.setItem(KEY, JSON.stringify(next)); }
    catch (e) { throw new Error("Не удалось сохранить ответ. Оставь страницу открытой и освободи место в хранилище браузера."); }
    ST = next;
  }
  function stand(id) { task(id); return clone(ST.tasks[id] || { attempts: [], drafts: [], draft: null }); }
  function draft(id) { const d = ST.tasks[id] && ST.tasks[id].draft; if (!d) throw new Error("Сначала открой задание."); return d; }
  function variante(id, d) { return task(id).varianten[(d || draft(id)).variant]; }
  function aendere(id, fn) {
    draft(id);
    const next = clone(ST); fn(next.tasks[id].draft); commit(next);
    return clone(next.tasks[id].draft);
  }
  function modusGueltig(mode) { if (!MODI.includes(mode)) throw new Error("Unbekannter Modus: " + mode); }
  function start(id, mode, neu) {
    const t = task(id), alt = ST.tasks[id];
    if (mode != null) modusGueltig(mode);
    if (alt && alt.draft && !neu) return clone(alt.draft);
    mode = mode || "erklaert";
    const next = clone(ST), s = next.tasks[id] || { attempts: [], drafts: [], draft: null };
    if (s.draft && !s.attempts.some(a => a.id === s.draft.id)) s.drafts.push(clone(s.draft));
    const variant = s.draft ? (s.draft.variant + 1) % t.varianten.length : 0;
    s.draft = {
      id: "px-" + Date.now().toString(36) + "-" + (++zaehler) + "-" + Math.random().toString(36).slice(2, 9),
      variant, mode, support: mode === "erklaert" ? "hilfe" : "selbst", createdAt: Date.now(),
      answers: Object.fromEntries(t.varianten[variant].felder.map(f => [f.id, ""])),
      hintSeen: false, solutionSeen: false, checks: [], reason: "", submission: null
    };
    next.tasks[id] = s; commit(next); return clone(s.draft);
  }
  function entwurf(id, answers) {
    if (draft(id).submission) throw new Error("Ответ уже сдан; для изменений начни новую попытку.");
    const fields = variante(id).felder;
    return aendere(id, d => fields.forEach(f => { if (Object.prototype.hasOwnProperty.call(answers || {}, f.id)) d.answers[f.id] = String(answers[f.id] == null ? "" : answers[f.id]); }));
  }
  function modus(id, mode) {
    modusGueltig(mode);
    if (draft(id).submission) throw new Error("Ответ уже сдан.");
    return aendere(id, d => { d.mode = mode; if (mode === "erklaert" && d.support === "selbst") d.support = "hilfe"; });
  }
  function hilfe(id, art) {
    if (!["hilfe", "loesung"].includes(art)) throw new Error("Неизвестный вид помощи.");
    if (draft(id).submission) return clone(draft(id));
    return aendere(id, d => {
      if (art === "loesung") { d.solutionSeen = true; d.support = "loesung"; }
      else { d.hintSeen = true; if (d.support !== "loesung") d.support = "hilfe"; }
    });
  }
  function zahl(raw) {
    const s = String(raw == null ? "" : raw).trim().replace(/−/g, "-");
    if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(s)) return null;
    const n = Number(s.replace(",", ".")); return Number.isFinite(n) ? n : null;
  }
  function pruefeFeld(f, raw) {
    if (f.typ === "zahl") { const n = zahl(raw); return n != null && Math.abs(n - f.loesung) < 1e-9; }
    if (f.typ !== "folge" && f.typ !== "menge") return false;
    const s = String(raw == null ? "" : raw).trim();
    if (!s) return false;
    const ist = s.split(/[\s,;→]+/), soll = f.loesung.map(String);
    const norm = x => String(x).toLocaleLowerCase("de").replace(/−/g, "-");
    if (ist.length !== soll.length) return false;
    const a = ist.map(norm), b = soll.map(norm);
    if (f.typ === "menge") { a.sort(); b.sort(); }
    return a.every((x, i) => x === b[i]);
  }
  function abgeben(id) {
    const d = draft(id), v = variante(id);
    if (d.submission) return clone(d.submission.result);
    if (!Object.values(d.answers).some(x => String(x).trim())) throw new Error("Сначала запиши хотя бы часть решения.");
    const details = v.rubrik ? [] : v.felder.map(f => ({ id: f.id, correct: pruefeFeld(f, d.answers[f.id]), max: f.be }));
    const result = v.rubrik ? { kind: "selbst", correct: null, max: v.rubrik.reduce((s, r) => s + r.be, 0), details: [] }
      : { kind: "auto", correct: details.reduce((s, r) => s + (r.correct ? r.max : 0), 0), max: details.reduce((s, r) => s + r.max, 0), details };
    aendere(id, x => { x.submission = { answers: clone(x.answers), support: x.support, mode: x.mode, at: Date.now(), result }; });
    return clone(result);
  }
  const reasons = ["sprache", "wissen", "aufmerksamkeit"];
  function rubrik(id, checks, reason) {
    const d = draft(id), v = variante(id);
    if (!d.submission) throw new Error("Сначала сдай ответ.");
    const ids = Array.from(new Set(checks || []));
    if (ids.some(x => !(v.rubrik || []).some(r => r.id === x))) throw new Error("Unbekanntes Kriterium");
    return aendere(id, x => { x.checks = ids; x.reason = reasons.includes(reason) ? reason : ""; });
  }
  function speichern(id, checks, reason) {
    const d = draft(id), v = variante(id), t = task(id);
    const previous = ST.tasks[id].attempts.find(a => a.id === d.id);
    if (previous) return clone(previous);
    if (!d.submission) throw new Error("Сначала сдай ответ.");
    const ids = Array.from(new Set(checks == null ? d.checks : checks));
    if (ids.some(x => !(v.rubrik || []).some(r => r.id === x))) throw new Error("Unbekanntes Kriterium");
    const result = d.submission.result;
    const attempt = {
      id: d.id, task: id, variant: d.variant, t: d.submission.at, savedAt: Date.now(),
      answers: clone(d.submission.answers), support: d.submission.support, mode: d.submission.mode,
      kind: result.kind, correct: v.rubrik ? v.rubrik.filter(r => ids.includes(r.id)).reduce((s, r) => s + r.be, 0) : result.correct,
      max: result.max, checks: ids, details: clone(result.details),
      reason: reasons.includes(reason) ? reason : d.reason,
      snapshot: { titel: t.titel, thema: t.thema, bereich: t.bereich, variante: clone(v) }
    };
    const next = clone(ST); next.tasks[id].attempts.push(attempt); commit(next);
    if (root.GENLERNSTAND && typeof root.GENLERNSTAND.record === "function") {
      try { root.GENLERNSTAND.record({ topic: t.thema, source: "praxis", task: id, correct: attempt.correct, max: attempt.max,
        support: attempt.support, kind: attempt.kind, answers: clone(attempt.answers), reason: attempt.reason || undefined }); }
      catch (e) { if (root.console) root.console.warn("Практика сохранена; общий журнал пока недоступен.", e); }
    }
    return clone(attempt);
  }

  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const $ = id => document.getElementById(id);
  const SUPPORT = { selbst: "самостоятельно", hilfe: "с объяснением или подсказкой", loesung: "разбор открыт до сдачи" };
  const REASON = { sprache: "Язык условия", wissen: "Знание или способ решения", aufmerksamkeit: "Внимательность" };
  let viewId = null;
  function seite() {
    let s = $("scPraxis");
    if (!s) { s = el("div", "seite px-seite"); s.id = "scPraxis"; s.hidden = true; s.appendChild(el("div", "px-wrap")); document.body.appendChild(s); }
    return s;
  }
  function sichtbar() {
    const s = seite();
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(x => { x.hidden = x !== s; });
    s.hidden = false;
    ["fuss", "schalterKatalog", "mwUhr", "btnUhr", "mwPunkte"].forEach(id => { const e = $(id); if (e) e.hidden = true; });
    if ($("kopfTitel")) $("kopfTitel").hidden = false;
    if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · самостоятельная практика";
    if ($("kTitel")) $("kTitel").textContent = "От понимания к собственному решению";
    if (root.GENZURUECK) {
      root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scPraxis", "scStart");
      root.GENZURUECK.knopfPflegen && root.GENZURUECK.knopfPflegen();
    }
  }
  function button(text, action, cls) {
    const b = el("button", "btn " + (cls || ""), text); b.type = "button"; b.onclick = action; return b;
  }
  function card(parent, title) { const c = el("section", "px-card"); if (title) c.appendChild(el("h2", null, title)); parent.appendChild(c); return c; }
  function paragraph(parent, text, cls) { parent.appendChild(el("p", cls, text)); }
  function message(text) {
    let e = $("praxisMeldung"); if (!e) { e = el("p", "px-message"); e.id = "praxisMeldung"; seite().firstChild.appendChild(e); }
    e.setAttribute("role", "status"); e.textContent = text;
  }
  function action(fn) { return () => { try { fn(); render(); } catch (e) { message(e.message); } }; }
  function oeffnen(id) {
    if (!hatDom) return id ? start(id) : liste();
    if (id) start(id);
    viewId = id || null; sichtbar();
    if (root.history) root.history.pushState({ seite: "scPraxis", px: { id: viewId } }, "");
    render();
    if (root.scrollTo) root.scrollTo(0, 0);
  }
  function uebersicht(w) {
    const intro = card(w, "Начни с одной задачи на 8–15 минут");
    paragraph(intro, "Сначала разберись в примере, затем запиши своё решение. Позже открой другой вариант без помощи. Это авторские упражнения, не оригиналы IHK и не прогноз экзаменационной оценки.");
    paragraph(intro, "Числа и последовательности проверяются точно. Псевдокод, модели и обоснования — по рубрике самопроверки; введённый код не исполняется.", "px-muted");
    const last = Object.entries(ST.tasks).filter(([id, s]) => daten().some(t => t.id === id) && s.draft && !s.attempts.some(a => a.id === s.draft.id)).sort((a, b) => b[1].draft.createdAt - a[1].draft.createdAt)[0];
    if (last) intro.appendChild(button("Продолжить черновик: " + task(last[0]).titel, () => oeffnen(last[0]), "primary"));
    for (const group of [...new Set(daten().map(t => t.bereich))]) {
      const c = card(w, group), grid = el("div", "px-grid"); c.appendChild(grid);
      daten().filter(t => t.bereich === group).forEach(t => {
        const s = stand(t.id), b = button(t.titel, () => oeffnen(t.id), "px-task");
        b.appendChild(el("span", "px-muted", t.minuten + " мин · " + (s.attempts.length ? s.attempts.length + " сохранённых попыток" : "ещё не решено")));
        grid.appendChild(b);
      });
    }
  }
  function hilfeBox(w, t, d) {
    if (d.mode === "erklaert") {
      const c = card(w, "Понять перед практикой"); paragraph(c, t.erklaerung);
      const dl = el("dl", "px-terms"); t.begriffe.forEach(([de, ru]) => { dl.append(el("dt", null, de), el("dd", null, ru)); }); c.appendChild(dl);
      paragraph(c, "Разобранный пример: " + t.beispiel);
    }
    if (d.hintSeen) { const c = card(w, "Подсказка"); paragraph(c, t.hinweis); }
  }
  function loesungBox(w, v) {
    const c = card(w, "Решение и разбор"); c.appendChild(el("pre", "px-code px-solution", v.loesung)); paragraph(c, v.analyse);
  }
  function antworten(c, fields, answers) {
    fields.forEach(f => { const p = el("p", "px-answer"); p.appendChild(el("strong", null, f.label + ": ")); p.appendChild(el("span", null, answers[f.id] || "—")); c.appendChild(p); });
  }
  function historie(w, s) {
    if (!s.attempts.length && !s.drafts.length) return;
    const c = card(w, "История: ответы остаются здесь");
    s.attempts.slice().reverse().forEach(a => {
      const d = el("details"); d.appendChild(el("summary", null, new Date(a.t).toLocaleString("ru") + " · " + a.correct + "/" + a.max + " · " + (a.kind === "selbst" ? "самопроверка" : "точная проверка") + " · " + SUPPORT[a.support]));
      paragraph(d, a.snapshot.variante.auftrag); antworten(d, a.snapshot.variante.felder, a.answers);
      if (a.reason) paragraph(d, "Отмеченная причина: " + REASON[a.reason]);
      c.appendChild(d);
    });
    if (s.drafts.length) {
      const old = el("details"); old.appendChild(el("summary", null, "Предыдущие незавершённые черновики: " + s.drafts.length));
      s.drafts.slice().reverse().forEach(d => { paragraph(old, "Вариант " + (d.variant + 1) + " · " + new Date(d.createdAt).toLocaleString("ru")); Object.entries(d.answers).forEach(([key, value]) => paragraph(old, key + ": " + (value || "—"))); }); c.appendChild(old);
    }
  }
  function aufgabenAnsicht(w, id) {
    const t = task(id), s = stand(id), d = s.draft, v = variante(id, d);
    const top = card(w, t.titel);
    paragraph(top, "Авторская практика · " + t.bereich + " · вариант " + (d.variant + 1) + " из " + t.varianten.length + " · примерно " + t.minuten + " мин", "px-muted");
    const label = el("label", "px-label", "Поддержка"); const select = el("select"); select.id = "praxisModus";
    [["erklaert", "С объяснением и примером"], ["hilfe", "Подсказка по запросу"], ["pruefung", "Как на экзамене"]].forEach(([value, text]) => { const o = el("option", null, text); o.value = value; select.appendChild(o); });
    select.value = d.mode; select.disabled = !!d.submission; select.onchange = action(() => modus(id, select.value)); label.appendChild(select); top.appendChild(label);
    paragraph(top, "Эта попытка: " + SUPPORT[d.support] + ". Открытая до сдачи помощь учитывается даже после смены режима.", "px-muted");
    if (!d.submission) hilfeBox(w, t, d);
    const prompt = card(w, "Aufgabe"); const p = el("p", "px-prompt", v.auftrag); p.lang = "de"; prompt.appendChild(p);
    if (v.code) prompt.appendChild(el("pre", "px-code", v.code));
    if (v.rubrik) paragraph(prompt, "Напиши решение по-немецки. Диаграмму можно нарисовать на бумаге и записать здесь её связи. После сдачи сверь каждый критерий: автоматической смысловой оценки нет.", "px-muted");
    else paragraph(prompt, "Числа вводи без единиц и разделителей тысяч. Последовательности — через пробел или запятую. Пустые поля баллов не дают.", "px-muted");
    if (!d.submission) {
      const form = el("form", "px-form"); prompt.appendChild(form);
      v.felder.forEach(f => {
        const l = el("label", "px-label", f.label); const input = el(f.typ === "text" ? "textarea" : "input");
        input.id = "praxis-" + f.id; input.dataset.answer = f.id; input.value = d.answers[f.id];
        if (f.typ === "text") input.rows = 9; else { input.type = "text"; if (f.typ === "zahl") input.inputMode = "decimal"; }
        input.oninput = () => { try { entwurf(id, { [f.id]: input.value }); message("Черновик сохранён на этом устройстве."); } catch (e) { message(e.message); } };
        l.appendChild(input); form.appendChild(l);
      });
      const b = el("button", "btn primary", "Сдать ответ и открыть разбор"); b.type = "submit"; form.appendChild(b);
      form.onsubmit = ev => { ev.preventDefault(); action(() => { const a = {}; form.querySelectorAll("[data-answer]").forEach(x => { a[x.dataset.answer] = x.value; }); entwurf(id, a); abgeben(id); })(); };
      const controls = el("div", "px-actions");
      controls.appendChild(button(d.hintSeen ? "Подсказка уже открыта" : "Открыть подсказку", action(() => hilfe(id, "hilfe"))));
      controls.appendChild(button("Посмотреть решение до сдачи", action(() => hilfe(id, "loesung")), "ghost")); prompt.appendChild(controls);
      if (d.solutionSeen) loesungBox(w, v);
    } else {
      antworten(prompt, v.felder, d.submission.answers);
      loesungBox(w, v);
      const saved = s.attempts.find(a => a.id === d.id), result = saved || d.submission.result;
      const c = card(w, result.kind === "selbst" ? "Самопроверка по конкретным критериям" : "Результат точной проверки");
      if (result.kind === "auto") {
        paragraph(c, result.correct + " из " + result.max + " баллов за эти поля. Это результат данного упражнения.");
        result.details.forEach(r => paragraph(c, (r.correct ? "Верно: " : "Проверь: ") + v.felder.find(f => f.id === r.id).label));
      } else {
        paragraph(c, "Отметь только то, что уже было в сданном ответе. Не засчитывай идеи, прочитанные впервые в разборе.");
        v.rubrik.forEach(r => {
          const l = el("label", "px-check"); const input = el("input"); input.type = "checkbox"; input.value = r.id;
          input.checked = (saved ? saved.checks : d.checks).includes(r.id); input.disabled = !!saved;
          input.onchange = () => { try { const ids = [...c.querySelectorAll('input[type="checkbox"]:checked')].map(x => x.value); rubrik(id, ids, $("praxisGrund").value); } catch (e) { message(e.message); } };
          l.append(input, el("span", null, r.text + " (" + r.be + " б.)")); c.appendChild(l);
        });
        if (saved) paragraph(c, "По твоей самопроверке: " + saved.correct + " из " + saved.max + ". Это не автоматическая проверка правильности.");
      }
      const reasonLabel = el("label", "px-label", "Если было трудно, что помешало? (необязательно)");
      const reason = el("select"); reason.id = "praxisGrund";
      [["", "Не отмечать"], ...Object.entries(REASON)].forEach(([value, text]) => { const o = el("option", null, text); o.value = value; reason.appendChild(o); });
      reason.value = saved ? saved.reason : d.reason; reason.disabled = !!saved;
      reason.onchange = () => { try { rubrik(id, draft(id).checks, reason.value); } catch (e) { message(e.message); } }; reasonLabel.appendChild(reason); c.appendChild(reasonLabel);
      if (!saved) c.appendChild(button("Сохранить результат в истории", action(() => speichern(id)), "primary"));
      else paragraph(c, "Результат и исходный ответ сохранены. Поддержка: " + SUPPORT[saved.support] + ".");
      const next = button(t.varianten.length > 1 ? "Другой вариант без помощи" : "Новая самостоятельная попытка", action(() => { start(id, "pruefung", true); }), "ghost");
      c.appendChild(next); paragraph(c, "Для проверки усвоения вернись к другому примеру позже. Сразу после разбора ответ ещё свеж в памяти.", "px-muted");
    }
    historie(w, s);
  }
  function render() {
    if (!hatDom) return;
    const w = seite().firstChild; w.textContent = "";
    const nav = el("nav", "px-actions"); nav.setAttribute("aria-label", "Навигация практики");
    nav.appendChild(button("К списку задач", () => oeffnen()));
    nav.appendChild(button("На главную", () => { if (root.history) root.history.pushState({ seite: "scStart" }, ""); if (root.schirm) root.schirm("scStart"); })); w.appendChild(nav);
    if (lesefehler) { paragraph(w, lesefehler, "px-message"); return; }
    try { if (viewId) aufgabenAnsicht(w, viewId); else uebersicht(w); } catch (e) { message(e.message); }
  }
  function einhaengen() {
    const alt = root.schirm;
    if (typeof alt === "function" && !alt.__px) {
      const neu = function (name) {
        if (name === "scPraxis") {
          const hs = root.history && root.history.state;
          if (hs && hs.px) viewId = hs.px.id || null;
          if (viewId) start(viewId); sichtbar(); render(); return;
        }
        const s = $("scPraxis"); if (s) s.hidden = true;
        return alt.apply(this, arguments);
      }; neu.__px = true; root.schirm = neu;
    }
    if (root.addEventListener) root.addEventListener("popstate", ev => {
      if (!ev.state || ev.state.seite !== "scPraxis") return;
      viewId = ev.state.px && ev.state.px.id || null;
      if (viewId) start(viewId); sichtbar(); render();
    });
  }
  function liste() { return daten().map(({ id, thema, bereich, titel }) => ({ id, thema, bereich, titel })); }
  const api = { oeffnen, liste, aufgabe: id => clone(task(id)), start, stand, entwurf, modus, hilfe, abgeben, rubrik, speichern, pruefeFeld };
  root.GENPRAXIS = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen); else einhaengen(); }
})(typeof window !== "undefined" ? window : globalThis);
