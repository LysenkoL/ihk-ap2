/* ============================================================================
   gen/englisch.js — «Английский текст GA1»: englischen Fachtext lesen,
   auf Deutsch antworten
   ----------------------------------------------------------------------------
   Texte: gen/englisch-daten.js (window.AP2_ENGLISCH).
   Fragen „wahl“ prüft die App (Antworten gemischt, je Frage immer gleich),
   Fragen „offen“ schreibt man selbst und vergleicht dann mit der
   Musterlösung und den Kriterien (Selbstprüfung, ehrlich als solche
   bezeichnet).

   Speicher ap2:englisch = { "<text>": { a: { "<frage>": Text|Index }, mc: { "<frage>": true|false },
                                          selbst: { "<frage>": [true|false…] }, offen: { "<frage>": true }, t } }
   Journal: GENLERNSTAND.record({ topic: "englisch", source: "englisch", task: "<text>:<frage>",
            kind: "recognition" (Auswahl) | "selbst" (offen), support … })
   Bildschirm scEngl.
   ========================================================================== */
"use strict";
(function (root) {
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const SK = "ap2:englisch";
  const TEXTE = () => root.AP2_ENGLISCH || [];

  /* ---- reine Funktionen ---- */
  function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  /** Reihenfolge der Antworten: fest je Text und Frage, die richtige steht nicht immer vorn */
  function reihenfolge(textId, qi, n) {
    const idx = Array.from({ length: n }, (_, i) => i);
    let a = hash(textId + ":" + qi) || 1;
    for (let i = n - 1; i > 0; i--) { a = Math.imul(a ^ (a >>> 15), 2246822507) >>> 0; const j = a % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }
  function stand(roh) {
    if (!roh) return {};
    const x = JSON.parse(roh);
    if (!x || typeof x !== "object" || Array.isArray(x)) throw new Error("format");
    return x;
  }
  /** Fortschritt eines Textes: beantwortete Fragen, Punkte (Auswahl richtig + Kriterien erfüllt) */
  function fortschritt(text, e) {
    e = e || {};
    let fertig = 0, punkte = 0, max = 0;
    text.fragen.forEach((f, qi) => {
      if (f.art === "wahl") { max += 1; if (e.mc && e.mc[qi] != null) { fertig++; if (e.mc[qi]) punkte += 1; } }
      else {
        max += f.punkte;
        const s = e.selbst && e.selbst[qi];
        if (Array.isArray(s)) { fertig++; punkte += Math.min(f.punkte, Math.round(s.filter(Boolean).length / f.kriterien.length * f.punkte * 2) / 2); }
      }
    });
    return { fertig, gesamt: text.fragen.length, punkte, max };
  }
  const api = { SK, reihenfolge, fortschritt, stand };

  if (hatDom) {
    const $ = id => document.getElementById(id);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const knopf = (text, fn, cls) => { const b = el("button", "btn" + (cls ? " " + cls : ""), text); b.type = "button"; b.onclick = fn; return b; };
    let fehler = "";
    function lies() { try { const x = stand(root.localStorage.getItem(SK)); fehler = ""; return x; } catch (e) { fehler = "Сохранённые ответы не прочитаны — они оставлены как есть, новые не сохраняются."; return null; } }
    function aendern(id, fn) {
      const st = lies();
      if (st === null) return false;
      const e = st[id] = st[id] || {};
      fn(e); e.t = Date.now();
      try { root.localStorage.setItem(SK, JSON.stringify(st)); return true; } catch (x) { fehler = "Не удалось сохранить: память браузера недоступна."; return false; }
    }
    const melden = ev => { try { if (root.GENLERNSTAND) root.GENLERNSTAND.record(ev); } catch (e) { } };
    let AKTUELL = null;

    function screen() {
      let s = $("scEngl");
      if (s) return s;
      s = el("div", "seite en-page"); s.id = "scEngl"; s.hidden = true;
      const w = el("div", "en-wrap"); w.id = "enInhalt"; s.appendChild(w);
      const start = $("scStart"); start.parentNode.insertBefore(s, start.nextSibling);
      return s;
    }
    function oeffnen(id, ausVerlauf) {
      AKTUELL = TEXTE().some(t => t.id === id) ? id : null;
      const s = screen();
      document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
      ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { if ($(k)) $(k).hidden = true; });
      if ($("kopfTitel")) $("kopfTitel").hidden = false;
      if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · GA1 · Englisch";
      if ($("kTitel")) $("kTitel").textContent = "Английский текст";
      if (!ausVerlauf) {
        try {
          if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
          history.pushState({ ihk: 1, seite: "scEngl", en: AKTUELL }, "");
        } catch (e) { }
      }
      if (AKTUELL) zeichneText(TEXTE().find(t => t.id === AKTUELL)); else liste();
      if (root.GENZURUECK) root.GENZURUECK.knopfPflegen();
      root.scrollTo(0, 0);
    }

    function liste() {
      const w = $("enInhalt"); w.replaceChildren();
      const st = lies() || {};
      const c = el("section", "en-card");
      c.appendChild(el("h2", null, "Английский текст в GA1"));
      c.appendChild(el("p", null, "В 6 из 10 GA1 есть английский текст (≈ 15 баллов). Читаешь по-английски, отвечаешь по-немецки: короткими предложениями, только то, что есть в тексте."));
      c.appendChild(el("p", "en-muted", "Как работать: 1) прочитай вопросы; 2) прочитай текст и подчеркни ключевые слова; 3) выпиши 3–5 слов из словарика; 4) ответь по-немецки и сравни с образцом. Тексты — авторские, в стиле экзамена."));
      if (fehler) c.appendChild(el("p", "en-alert", fehler));
      w.appendChild(c);
      TEXTE().forEach(t => {
        const p = fortschritt(t, st[t.id]);
        const b = el("button", "en-zeile"); b.type = "button";
        const ti = el("span", "en-z-titel", t.titel); ti.lang = "de"; b.appendChild(ti);
        b.appendChild(el("span", "en-z-ru", t.ru));
        b.appendChild(el("span", "en-z-stand" + (p.fertig === p.gesamt ? " ok" : ""), p.fertig ? "ответы: " + p.fertig + " из " + p.gesamt + " · " + String(p.punkte).replace(".", ",") + " из " + p.max + " баллов" : "ещё не решала"));
        b.onclick = () => oeffnen(t.id);
        w.appendChild(b);
      });
    }

    function zeichneText(t) {
      const w = $("enInhalt"); w.replaceChildren();
      const e = (lies() || {})[t.id] || {};
      const k = el("section", "en-card");
      k.appendChild(knopf("← Все тексты", () => oeffnen(null), "ghost klein"));
      const h = el("h2", null, t.titel); h.lang = "de"; k.appendChild(h);
      const si = el("p", "en-situation", t.situation); si.lang = "de"; k.appendChild(si);
      const txt = el("div", "en-text"); txt.lang = "en";
      t.text.forEach(p => txt.appendChild(el("p", null, p)));
      k.appendChild(txt);
      const vok = el("details", "en-vok");
      vok.appendChild(el("summary", null, "Слова из текста (" + t.vokabeln.length + ")"));
      const ul = el("ul");
      t.vokabeln.forEach(([en, de, ru]) => {
        const li = el("li"); const a = el("b", null, en); a.lang = "en"; li.appendChild(a);
        const d = el("span", null, " — " + de); d.lang = "de"; li.appendChild(d); li.appendChild(el("span", "en-muted-i", " — " + ru)); ul.appendChild(li);
      });
      vok.appendChild(ul); k.appendChild(vok);
      w.appendChild(k);
      if (fehler) w.appendChild(el("p", "en-alert", fehler));
      t.fragen.forEach((f, qi) => w.appendChild(f.art === "wahl" ? wahlFrage(t, f, qi, e) : offeneFrage(t, f, qi, e)));
      const p = fortschritt(t, e);
      w.appendChild(el("p", "en-muted en-summe", "Итого: " + String(p.punkte).replace(".", ",") + " из " + p.max + " баллов · вопросы с выбором проверяет приложение, открытые — самопроверка по образцу."));
    }

    function kopfFrage(t, f, qi) {
      const c = el("section", "en-card en-frage");
      const h = el("h3"); h.appendChild(el("span", "en-nr", (qi + 1) + ")"));
      const tx = el("span", null, " " + f.frage); tx.lang = "de"; h.appendChild(tx);
      if (f.punkte) h.appendChild(el("span", "en-punkte", " · " + f.punkte + " P."));
      c.appendChild(h);
      return c;
    }
    function wahlFrage(t, f, qi, e) {
      const c = kopfFrage(t, f, qi);
      const ord = reihenfolge(t.id, qi, f.optionen.length);
      const name = "en-" + t.id + "-" + qi;
      const fertig = e.mc && e.mc[qi] != null, gewaehlt = e.a ? e.a[qi] : null;
      const box = el("div", "en-optionen");
      ord.forEach(i => {
        const lab = el("label", "en-option");
        const inp = el("input"); inp.type = "radio"; inp.name = name; inp.value = String(i); inp.disabled = fertig;
        if (gewaehlt === i) inp.checked = true;
        lab.appendChild(inp); const s = el("span", null, f.optionen[i]); s.lang = "de"; lab.appendChild(s);
        if (fertig && i === f.soll) lab.classList.add("ok");
        if (fertig && gewaehlt === i && i !== f.soll) lab.classList.add("falsch");
        box.appendChild(lab);
      });
      c.appendChild(box);
      if (!fertig) c.appendChild(knopf("Проверить", () => {
        const sel = box.querySelector("input:checked");
        if (!sel) return;
        const wahl = Number(sel.value), ok = wahl === f.soll;
        aendern(t.id, x => { x.a = x.a || {}; x.mc = x.mc || {}; x.a[qi] = wahl; x.mc[qi] = ok; });
        melden({ topic: "englisch", source: "englisch", task: t.id + ":" + qi, correct: ok ? 1 : 0, max: 1, support: "selbst", kind: "recognition",
          answers: { wahl: f.optionen[wahl] }, snapshot: { type: "englisch", title: t.titel + " · " + (qi + 1), question: t.situation + "\n\n" + t.text.join("\n\n") + "\n\n" + f.frage, solution: f.optionen[f.soll] } });
        oeffnen(t.id, true);
      }, "primary"));
      else c.appendChild(el("p", "en-ergebnis " + (e.mc[qi] ? "ok" : "falsch"), e.mc[qi] ? "✓ Верно" : "✗ Неверно. Правильно: " + f.optionen[f.soll]));
      if (fertig) c.appendChild(knopf("Ещё раз", () => { aendern(t.id, x => { if (x.mc) delete x.mc[qi]; if (x.a) delete x.a[qi]; }); oeffnen(t.id, true); }, "ghost klein"));
      return c;
    }
    function offeneFrage(t, f, qi, e) {
      const c = kopfFrage(t, f, qi);
      const offen = !!(e.offen && e.offen[qi]), bewertet = e.selbst && Array.isArray(e.selbst[qi]);
      const ta = el("textarea", "en-antwort"); ta.rows = 4; ta.lang = "de"; ta.placeholder = "Antwort auf Deutsch …";
      ta.value = (e.a && typeof e.a[qi] === "string") ? e.a[qi] : "";
      ta.disabled = offen;
      let uhr = null;
      ta.oninput = () => { clearTimeout(uhr); uhr = setTimeout(() => aendern(t.id, x => { x.a = x.a || {}; x.a[qi] = ta.value; }), 400); };
      c.appendChild(ta);
      if (!offen) {
        c.appendChild(knopf("Сравнить с образцом", () => {
          aendern(t.id, x => { x.a = x.a || {}; x.a[qi] = ta.value; x.offen = x.offen || {}; x.offen[qi] = true; x.ohne = x.ohne || {}; x.ohne[qi] = !ta.value.trim(); });
          oeffnen(t.id, true);
        }, "primary"));
        c.appendChild(el("p", "en-muted", "Сначала напиши свой ответ. Образец откроется после нажатия — тогда ответ уже не изменить."));
        return c;
      }
      const m = el("div", "en-muster"); m.appendChild(el("b", null, "Musterlösung: "));
      const ms = el("span", null, f.muster); ms.lang = "de"; m.appendChild(ms);
      if (root.GENVORLESEN) { const vk = root.GENVORLESEN.knopf(f.muster); if (vk) m.appendChild(vk); }
      c.appendChild(m);
      const kr = el("div", "en-kriterien");
      kr.appendChild(el("p", "en-muted", "Отметь, что есть в твоём ответе (каждый пункт — смысл, не точные слова):"));
      const checks = f.kriterien.map((text, i) => {
        const lab = el("label", "en-krit"); const cb = el("input"); cb.type = "checkbox";
        cb.checked = bewertet ? !!e.selbst[qi][i] : false; cb.disabled = bewertet;
        lab.appendChild(cb); const s = el("span", null, text); s.lang = "de"; lab.appendChild(s); kr.appendChild(lab); return cb;
      });
      c.appendChild(kr);
      if (!bewertet) c.appendChild(knopf("Сохранить самопроверку", () => {
        const werte = checks.map(cb => cb.checked), n = werte.filter(Boolean).length;
        const ohne = !!(e.ohne && e.ohne[qi]);
        aendern(t.id, x => { x.selbst = x.selbst || {}; x.selbst[qi] = werte; });
        melden({ topic: "englisch", source: "englisch", task: t.id + ":" + qi, correct: n, max: f.kriterien.length, support: ohne ? "loesung" : "selbst", kind: "selbst",
          answers: { text: ta.value }, snapshot: { type: "englisch", title: t.titel + " · " + (qi + 1), question: t.situation + "\n\n" + t.text.join("\n\n") + "\n\n" + f.frage, solution: f.muster + "\n\nKriterien:\n- " + f.kriterien.join("\n- ") } });
        oeffnen(t.id, true);
      }, "primary"));
      else {
        const n = e.selbst[qi].filter(Boolean).length;
        c.appendChild(el("p", "en-ergebnis " + (n === f.kriterien.length ? "ok" : "falsch"), "Самопроверка: " + n + " из " + f.kriterien.length + " пунктов"));
        c.appendChild(knopf("Ответить заново", () => { aendern(t.id, x => { ["a", "offen", "selbst", "ohne"].forEach(k => { if (x[k]) delete x[k][qi]; }); }); oeffnen(t.id, true); }, "ghost klein"));
      }
      return c;
    }

    function hook() {
      const alt = root.schirm;
      if (typeof alt === "function" && !alt.__en) {
        const neu = function (name) {
          if (name === "scEngl") { oeffnen((history.state && history.state.en) || null, true); return; }
          const s = $("scEngl"); if (s) s.hidden = true;
          return alt.apply(this, arguments);
        };
        neu.__en = true; root.schirm = neu;
      }
      root.addEventListener("popstate", ev => { const st = ev.state || {}; if (st.seite === "scEngl") oeffnen(st.en || null, true); });
    }
    api.oeffnen = id => oeffnen(id || null);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  }

  root.GENENGL = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
