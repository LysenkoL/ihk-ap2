/* Gemeinsame, unveränderliche Lernbeobachtungen. Alte Summen werden nicht
   nachträglich zu selbständigen Prüfungen umgedeutet. Alles bleibt lokal. */
"use strict";
(function (root) {
  const KEY = "ap2:lernstand";
  const kopie = x => JSON.parse(JSON.stringify(x));
  const inhalt = x => Array.isArray(x) ? "[" + x.map(inhalt).join(",") + "]" : x && typeof x === "object"
    ? "{" + Object.keys(x).sort().map(k => JSON.stringify(k) + ":" + inhalt(x[k])).join(",") + "}" : JSON.stringify(x);
  let speicherFehler = null, folge = 0, memory = [];
  function lesen() {
    try {
      const roh = root.localStorage.getItem(KEY), daten = roh ? JSON.parse(roh) : [];
      if (!Array.isArray(daten)) throw new Error("Ungültiges Lernarchiv");
      speicherFehler = null;
      return daten;
    } catch (e) { speicherFehler = e; return []; }
  }
  function list() {
    const seen = new Set();
    memory = lesen().concat(memory).filter(e => { const k = inhalt(e); if (seen.has(k)) return false; seen.add(k); return true; });
    return kopie(memory);
  }
  function melden(text) {
    if (!root.document || !document.body) return;
    let e = document.getElementById("lernstandSpeicherfehler");
    if (!e) { e = document.createElement("p"); e.id = "lernstandSpeicherfehler"; e.setAttribute("role", "alert"); document.body.appendChild(e); }
    e.textContent = text;
  }
  const gueltig = e => e && ["topic", "source", "task"].every(k => typeof e[k] === "string" && e[k].trim()) &&
    Number.isFinite(e.correct) && Number.isFinite(e.max) && e.max > 0 && e.correct >= 0 && e.correct <= e.max &&
    ["selbst", "hilfe", "loesung"].includes(e.support) && ["auto", "selbst", "recognition"].includes(e.kind);
  function record(e) {
    if (!gueltig(e)) return { ok: false, error: "Некорректное учебное наблюдение." };
    const daten = list();
    const payload = kopie(e);
    if (payload.id) {
      const alt = daten.find(x => x && x.id === payload.id);
      if (alt) {
        const gleich = Object.keys(payload).every(k => inhalt(payload[k]) === inhalt(alt[k]));
        return gleich ? speichern(alt) : { ok: false, error: "Наблюдение с этим номером уже существует." };
      }
    }
    if (!payload.id) payload.id = root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID()
      : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2) + "-" + (++folge);
    payload.t = Number.isFinite(payload.t) ? payload.t : Date.now();
    memory.push(payload);
    return speichern(payload);
  }
  function speichern(payload) {
    try {
      if (speicherFehler) throw speicherFehler;
      root.localStorage.setItem(KEY, JSON.stringify(memory));
      const warn = root.document && document.getElementById("lernstandSpeicherfehler");
      if (warn) warn.remove();
      return { ok: true, event: kopie(payload) };
    } catch (e) {
      const error = "Результат не сохранён на устройстве. Он остаётся в этой открытой вкладке. Сначала сохраните резервную копию данных и освободите место.";
      melden(error);
      return { ok: false, event: kopie(payload), error };
    }
  }
  function summary() {
    const groups = new Map(), events = list(), ids = new Map();
    events.forEach(e => { if (e && e.id) ids.set(e.id, (ids.get(e.id) || 0) + 1); });
    events.forEach(e => {
      /* Kollidierende IDs bleiben im Archiv, sind aber keine sichere Messung. */
      if (!gueltig(e) || ids.get(e.id) > 1) return;
      let s = groups.get(e.topic);
      if (!s) {
        s = { topic: e.topic, total: 0, independent: 0, assisted: 0, recognition: 0, selfRated: 0, weak: 0, latest: 0, ratio: null, correct: 0, max: 0, tasks: new Map() };
        groups.set(e.topic, s);
      }
      s.total++; s.latest = Math.max(s.latest, e.t || 0);
      if (e.support !== "selbst") s.assisted++;
      if (e.kind === "recognition") s.recognition++;
      if (e.kind === "selbst") s.selfRated++;
      if (e.kind === "auto" && e.support === "selbst") { s.independent++; s.correct += e.correct; s.max += e.max; }
      if (e.kind !== "selbst") {
        const key = e.source + ":" + e.task, alt = s.tasks.get(key);
        const rang = e.support === "selbst" ? 1 : 0, altRang = alt && alt.support === "selbst" ? 1 : 0;
        if (!alt || rang > altRang || (rang === altRang && (e.t || 0) >= (alt.t || 0))) s.tasks.set(key, e);
      }
    });
    return Array.from(groups.values()).map(s => {
      s.weak = Array.from(s.tasks.values()).filter(e => e.correct < e.max).length;
      s.ratio = s.max ? s.correct / s.max : null;
      delete s.tasks; delete s.correct; delete s.max;
      return s;
    }).sort((a, b) => a.topic.localeCompare(b.topic));
  }
  function coverage() {
    const events = list();
    return [["quiz", "Тематические квизы", "ap2:lernen"], ["sql", "SQL", "ap2:sql"], ["algo", "Алгоритмы", "ap2:algo"]].map(([source, label, key]) => {
      let hasLegacy = false;
      try { const old = JSON.parse(root.localStorage.getItem(key) || "{}"); hasLegacy = Object.keys(key === "ap2:sql" ? old.a || {} : old).length > 0; } catch (e) { }
      return { source, label, hasLegacy, events: events.filter(e => e && e.source === source).length };
    });
  }
  const api = { record, list, summary, coverage };
  root.GENLERNSTAND = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
