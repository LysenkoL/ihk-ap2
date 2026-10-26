/* ============================================================================
   gen/marken.js — Личные отметки к подпунктам экзамена
   ----------------------------------------------------------------------------
   Unter jeder Teilaufgabe im Prüfungsbogen (gen/azubi.js ruft anhaengen() auf,
   wie gen/fotos.js) eine Zeile mit Markierungen:
     ★ избранное · ⏳ вернуться позже · ❓ непонятное условие ·
     ⚠ ошибка в задании (Abschreibfehler im Paket) · ✎ заметка
   Sie zählen NICHT zu Punkten oder Lernstand. Ein eigener Bildschirm
   (scMarken) listet alle Markierungen; die Liste „ошибка в задании“ lässt sich
   als Text kopieren, um das Paket lokal (nach den Scans) zu korrigieren.

   Speicher ap2:marken = { "<modul>|<teil>": { fav, spaeter, unklar, fehler: bool,
                                               notiz, titel, t } }
   gen/sync.js führt je Eintrag zusammen (neueres t gewinnt).
   Reine Funktionen für tests/marken.test.js.
   ========================================================================== */
"use strict";
(function (root) {
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const SK = "ap2:marken";
  const ARTEN = [
    ["fav", "★", "Избранное"],
    ["spaeter", "⏳", "Вернуться позже"],
    ["unklar", "❓", "Непонятное условие"],
    ["fehler", "⚠", "Ошибка в задании"]
  ];
  const NOTIZ_MAX = 1000;

  /* ---- reine Funktionen ---- */
  const schluessel = (modulId, teilId) => String(modulId) + "|" + String(teilId);
  const leer = e => !e || (!ARTEN.some(([k]) => e[k]) && !String(e.notiz || "").trim());
  /** Eintrag ändern: liefert neuen Gesamtstand, leere Einträge werden entfernt */
  function setzen(stand, key, aenderung, jetzt) {
    const st = Object.assign({}, stand || {});
    const e = Object.assign({}, st[key] || {}, aenderung || {});
    if (e.notiz != null) e.notiz = String(e.notiz).slice(0, NOTIZ_MAX);
    e.t = jetzt || Date.now();
    if (leer(e)) delete st[key]; else st[key] = e;
    return st;
  }
  /** Liste für die Übersicht, neueste zuerst; art: "alle" | fav | spaeter | unklar | fehler | notiz */
  function liste(stand, art) {
    return Object.keys(stand || {}).map(key => Object.assign({ key, modul: key.split("|")[0], teil: key.split("|").slice(1).join("|") }, stand[key]))
      .filter(e => !leer(e) && (!art || art === "alle" || (art === "notiz" ? String(e.notiz || "").trim() : e[art])))
      .sort((a, b) => (b.t || 0) - (a.t || 0));
  }
  function zaehlen(stand) {
    const z = { alle: 0, notiz: 0 };
    ARTEN.forEach(([k]) => { z[k] = 0; });
    liste(stand).forEach(e => { z.alle++; ARTEN.forEach(([k]) => { if (e[k]) z[k]++; }); if (String(e.notiz || "").trim()) z.notiz++; });
    return z;
  }
  /** Text der Fehlerliste zum Kopieren (für die Korrektur des Pakets) */
  function fehlerText(stand) {
    const l = liste(stand, "fehler");
    if (!l.length) return "";
    return "Ошибки в заданиях (" + l.length + "):\n" + l.map(e => "- " + (e.titel || e.key) + " [" + e.teil + "]" + (String(e.notiz || "").trim() ? ": " + e.notiz.trim() : "")).join("\n");
  }
  const api = { SK, ARTEN, schluessel, setzen, liste, zaehlen, fehlerText, leer };

  if (hatDom) {
    const $ = id => document.getElementById(id);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    let lesefehler = "";
    function lies() {
      try {
        const roh = root.localStorage.getItem(SK);
        if (!roh) { lesefehler = ""; return {}; }
        const x = JSON.parse(roh);
        if (!x || typeof x !== "object" || Array.isArray(x)) throw new Error("format");
        lesefehler = ""; return x;
      } catch (e) { lesefehler = "Отметки не прочитаны — сохранённые данные оставлены как есть, новые отметки пока не сохраняются."; return null; }
    }
    function aendern(key, aenderung) {
      const st = lies();
      if (st === null) return false;
      try { root.localStorage.setItem(SK, JSON.stringify(setzen(st, key, aenderung))); return true; } catch (e) { return false; }
    }
    const titelVon = (m, t) => (m.kurz || m.id) + " · " + (t.label || ("Aufgabe " + (t.nr || ""))) + (t.titel ? " " + String(t.titel).replace(/<[^>]+>/g, "") : "");

    /* ---- Zeile unter der Teilaufgabe ---- */
    function anhaengen(karte, m, t) {
      if (!karte || !m || !t || !m.id || !t.id) return null;
      karte.querySelectorAll(".mk-zeile").forEach(e => e.remove());
      const key = schluessel(m.id, t.id), titel = titelVon(m, t);
      const box = el("div", "mk-zeile");
      const zeichnen = () => {
        const st = lies() || {}, e = st[key] || {};
        box.replaceChildren();
        const knoepfe = el("div", "mk-knoepfe"); knoepfe.setAttribute("role", "group"); knoepfe.setAttribute("aria-label", "Мои отметки к заданию");
        ARTEN.forEach(([k, sym, name]) => {
          const b = el("button", "mk-knopf" + (e[k] ? " an" : "")); b.type = "button";
          b.setAttribute("aria-pressed", e[k] ? "true" : "false"); b.title = name;
          b.appendChild(el("span", "mk-sym", sym)); b.appendChild(el("span", "mk-name", name));
          b.onclick = () => { if (aendern(key, { [k]: !e[k], titel })) zeichnen(); else meldung(); };
          knoepfe.appendChild(b);
        });
        const nb = el("button", "mk-knopf" + (String(e.notiz || "").trim() ? " an" : "")); nb.type = "button";
        nb.appendChild(el("span", "mk-sym", "✎")); nb.appendChild(el("span", "mk-name", "Заметка"));
        knoepfe.appendChild(nb);
        box.appendChild(knoepfe);
        const nz = el("div", "mk-notiz"); nz.hidden = !String(e.notiz || "").trim() && !box.dataset.offen;
        const ta = el("textarea"); ta.rows = 2; ta.maxLength = NOTIZ_MAX; ta.placeholder = "Заметка к этому заданию (видна только тебе)…"; ta.value = e.notiz || "";
        let uhr = null;
        ta.oninput = () => { clearTimeout(uhr); uhr = setTimeout(() => { if (!aendern(key, { notiz: ta.value, titel })) meldung(); }, 500); };
        nz.appendChild(ta); box.appendChild(nz);
        nb.onclick = () => { box.dataset.offen = "1"; nz.hidden = false; ta.focus(); };
        if (lesefehler) box.appendChild(el("p", "mk-alert", lesefehler));
      };
      const meldung = () => { const p = el("p", "mk-alert", lesefehler || "Не удалось сохранить отметку (память браузера недоступна)."); box.appendChild(p); };
      zeichnen();
      karte.appendChild(box);
      return box;
    }

    /* ---- Übersicht ---- */
    let FILTER = "alle";
    function screen() {
      let s = $("scMarken");
      if (s) return s;
      s = el("div", "seite mk-page"); s.id = "scMarken"; s.hidden = true;
      const w = el("div", "mk-wrap"); w.id = "mkInhalt"; s.appendChild(w);
      const start = $("scStart"); start.parentNode.insertBefore(s, start.nextSibling);
      return s;
    }
    function oeffnen(art, ausVerlauf) {
      if (art) FILTER = art;
      const s = screen();
      document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
      ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { if ($(k)) $(k).hidden = true; });
      if ($("kopfTitel")) $("kopfTitel").hidden = false;
      if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · Prüfungsbögen";
      if ($("kTitel")) $("kTitel").textContent = "Мои отметки";
      if (!ausVerlauf) {
        try {
          if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
          history.pushState({ ihk: 1, seite: "scMarken" }, "");
        } catch (e) { }
      }
      zeichneListe();
      if (root.GENZURUECK) root.GENZURUECK.knopfPflegen();
      root.scrollTo(0, 0);
    }
    function zeichneListe() {
      const w = $("mkInhalt"); w.replaceChildren();
      const st = lies(), z = zaehlen(st || {});
      const c = el("section", "mk-card");
      c.appendChild(el("h2", null, "Мои отметки к заданиям"));
      c.appendChild(el("p", "mk-muted", "Отметки ставятся под каждым подпунктом в бланках экзамена. На баллы и статистику они не влияют."));
      if (lesefehler) c.appendChild(el("p", "mk-alert", lesefehler));
      const f = el("div", "mk-filter");
      [["alle", "Все"]].concat(ARTEN.map(([k, sym, n]) => [k, sym + " " + n]), [["notiz", "✎ С заметкой"]]).forEach(([k, n]) => {
        const b = el("button", "mk-chip" + (FILTER === k ? " an" : "")); b.type = "button";
        b.setAttribute("aria-pressed", FILTER === k ? "true" : "false");
        b.appendChild(document.createTextNode(n + " ")); b.appendChild(el("span", "mk-n", String(z[k] || 0)));
        b.onclick = () => { FILTER = k; zeichneListe(); };
        f.appendChild(b);
      });
      c.appendChild(f);
      if (FILTER === "fehler" && z.fehler) {
        const kb = el("button", "btn", "Скопировать список ошибок"); kb.type = "button";
        kb.onclick = () => { const txt = fehlerText(st || {}); try { navigator.clipboard.writeText(txt).then(() => { kb.textContent = "Скопировано ✓"; }, () => { prompt("Скопируй текст:", txt); }); } catch (e) { prompt("Скопируй текст:", txt); } };
        c.appendChild(kb);
        c.appendChild(el("p", "mk-muted", "Список нужен для правки пакета экзаменов: исправлять — локально, по сканам."));
      }
      w.appendChild(c);
      const l = liste(st || {}, FILTER);
      if (!l.length) { w.appendChild(el("p", "mk-card mk-muted", z.alle ? "В этом фильтре пусто." : "Пока нет отметок. Открой бланк экзамена — под каждым подпунктом есть ряд кнопок ★ ⏳ ❓ ⚠ ✎.")); return; }
      l.forEach(e => {
        const r = el("article", "mk-card mk-eintrag");
        const h = el("b", null, e.titel || e.key); h.lang = "de"; r.appendChild(h);
        const syms = ARTEN.filter(([k]) => e[k]).map(([, s, n]) => s + " " + n).join(" · ");
        if (syms) r.appendChild(el("span", "mk-muted", syms));
        if (String(e.notiz || "").trim()) r.appendChild(el("p", "mk-text", e.notiz));
        const akt = el("div", "mk-akt");
        if (root.GENAZUBI) {
          const ob = el("button", "btn primary", "Открыть задание"); ob.type = "button";
          ob.onclick = () => { const A = root.GENAZUBI; (A.laden ? A.laden() : Promise.resolve()).then(() => A.oeffnen(e.modul, { ziel: e.teil })); };
          akt.appendChild(ob);
        }
        const del = el("button", "btn ghost", "Снять все отметки"); del.type = "button";
        del.onclick = () => { if (confirm("Снять отметки и заметку у этого задания?")) { const leerAenderung = { notiz: "" }; ARTEN.forEach(([k]) => { leerAenderung[k] = false; }); aendern(e.key, leerAenderung); zeichneListe(); } };
        akt.appendChild(del);
        r.appendChild(akt);
        w.appendChild(r);
      });
    }
    function hook() {
      const alt = root.schirm;
      if (typeof alt === "function" && !alt.__mk) {
        const neu = function (name) {
          if (name === "scMarken") { oeffnen(null, true); return; }
          const s = $("scMarken"); if (s) s.hidden = true;
          return alt.apply(this, arguments);
        };
        neu.__mk = true; root.schirm = neu;
      }
    }
    api.anhaengen = anhaengen;
    api.oeffnen = art => oeffnen(art);
    api.anzahl = () => zaehlen(lies() || {}).alle;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  }

  root.GENMARKEN = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
