/* ============================================================================
   gen/pruefungstag.js — «Prüfungstag»: GA1 + GA2 + WiSo eines Termins am Stück
   ----------------------------------------------------------------------------
   Ein echter Prüfungstag: GA1 (90 Min.), GA2 (90 Min.), WiSo (60 Min.) —
   240 Minuten Schreibzeit. Hier läuft er in einem Durchgang: man wählt einen
   Termin (Sommer/Winter + Jahr), bei dem alle drei Bögen im Paket sind, und
   startet die Teile nacheinander im Bogen-Player mit dem strengen Timer.
   Am Ende: Punkte je Teil, Note und die Bestehensregel (GENNIVEAU.regel).

   Die Bögen selbst bleiben im Paket; hier stehen nur ids, Zeiten, Punkte.
   Speicher ap2:pruefungstag = { aktiv: { termin, start, teile: { ga1: { id, start } } } | null,
                                 tage: [{ termin, start, ende, werte: { ga1: Prozent|null } }] }.
   Bildschirm scPruefTag. Reine Funktionen für tests/pruefungstag.test.js.
   ========================================================================== */
"use strict";
(function (root) {
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const SK = "ap2:pruefungstag";
  const PLAN = [{ id: "ga1", name: "GA1", min: 90 }, { id: "ga2", name: "GA2", min: 90 }, { id: "wiso", name: "WiSo", min: 60 }];
  const GESAMT = PLAN.reduce((s, t) => s + t.min, 0);
  const RX = /^(ga1|ga2|wiso)-(\d{4})-([sw])$/;

  /* ---- reine Funktionen ---- */
  /** Termine, bei denen GA1, GA2 und WiSo da sind: [{ termin: "2024-s", name, ids: { ga1, ga2, wiso } }], neueste zuerst */
  function termine(module) {
    const map = {};
    (module || []).forEach(m => {
      const r = m && RX.exec(m.id);
      if (!r) return;
      const k = r[2] + "-" + r[3];
      (map[k] = map[k] || {})[r[1]] = m.id;
    });
    return Object.keys(map).filter(k => PLAN.every(t => map[k][t.id]))
      .sort((a, b) => b.localeCompare(a))
      .map(k => ({ termin: k, name: terminName(k), ids: map[k] }));
  }
  const terminName = k => { const [j, s] = k.split("-"); return (s === "s" ? "Sommer " : "Winter ") + j; };

  /** Status eines Teils im laufenden Tag.
      offen · laeuft (mit rest ms) · zeitUm (Zeit vorbei, noch nicht im Player abgegeben) · abgegeben */
  function teilStatus(tag, teil, z, jetzt) {
    const t = tag && tag.teile && tag.teile[teil.id];
    if (!t || !z || z.modus !== "pruefung" || z.start !== t.start) return { s: "offen" };
    if (z.abgegeben) return { s: "abgegeben" };
    const rest = teil.min * 60000 - (jetzt - t.start);
    return rest > 0 ? { s: "laeuft", rest } : { s: "zeitUm", rest: 0 };
  }
  /** Welcher Teil ist dran? Der erste, der nicht abgegeben ist; null = alle fertig */
  function dran(stati) {
    const i = stati.findIndex(x => x.s !== "abgegeben");
    return i < 0 ? null : i;
  }
  /** Werte für die Bestehensregel: Prozent je Teil, null solange Textantworten unbewertet sind */
  function werte(auswertungen) {
    const w = {};
    PLAN.forEach(t => { const a = auswertungen[t.id]; w[t.id] = a && a.fertig ? a.prozent : null; });
    return w;
  }
  const zahl = x => String(Math.round((Number(x) || 0) * 10) / 10).replace(".", ",");
  const uhr = ms => { const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(x).padStart(2, "0"); };

  const api = { SK, PLAN, GESAMT, termine, terminName, teilStatus, dran, werte, uhr, zahl };

  if (hatDom) {
    const $ = id => document.getElementById(id);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const knopf = (text, fn, cls) => { const b = el("button", "btn" + (cls ? " " + cls : ""), text); b.type = "button"; b.onclick = fn; return b; };
    const A = () => root.GENAZUBI;
    const lies = () => { try { const v = JSON.parse(root.localStorage.getItem(SK)); return v && typeof v === "object" ? { aktiv: v.aktiv || null, tage: Array.isArray(v.tage) ? v.tage : [] } : { aktiv: null, tage: [] }; } catch (e) { return null; } };
    const schreib = st => { try { root.localStorage.setItem(SK, JSON.stringify(st)); return true; } catch (e) { return false; } };
    let TICK = null, WAHL = null;

    function screen() {
      let s = $("scPruefTag");
      if (s) return s;
      s = el("div", "seite pt-page"); s.id = "scPruefTag"; s.hidden = true;
      const w = el("div", "pt-wrap"); w.id = "ptInhalt"; s.appendChild(w);
      const start = $("scStart"); start.parentNode.insertBefore(s, start.nextSibling);
      return s;
    }
    function oeffnen(ausVerlauf) {
      const s = screen();
      document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
      ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { if ($(k)) $(k).hidden = true; });
      if ($("kopfTitel")) $("kopfTitel").hidden = false;
      if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · Prüfungstag";
      if ($("kTitel")) $("kTitel").textContent = "Prüfungstag";
      if (!ausVerlauf) {
        try {
          if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
          history.pushState({ ihk: 1, seite: "scPruefTag" }, "");
        } catch (e) { }
      }
      const a = A();
      zeichnen();
      if (a && a.laden) a.laden().then(zeichnen).catch(zeichnen);
      if (root.GENZURUECK) root.GENZURUECK.knopfPflegen();
      root.scrollTo(0, 0);
    }
    function stopp() { if (TICK) { clearInterval(TICK); TICK = null; } }

    function zeichnen() {
      stopp();
      const w = $("ptInhalt"); if (!w) return;
      w.replaceChildren();
      const a = A(), st = lies();
      if (st === null) { w.appendChild(el("p", "pt-card pt-alert", "Память браузера недоступна — день экзамена не сохранить.")); return; }
      const liste = a && a.paket && a.paket() ? termine(a.alleModule()) : [];
      if (st.aktiv) tagZeichnen(w, st, liste); else auswahl(w, st, liste);
      verlauf(w, st);
    }

    function auswahl(w, st, liste) {
      const c = el("section", "pt-card");
      c.appendChild(el("h2", null, "Prüfungstag: 240 минут подряд"));
      c.appendChild(el("p", null, "Три письменные части одного срока одна за другой: GA1 90 минут → GA2 90 минут → WiSo 60 минут. Каждая часть идёт со строгим таймером: время считается и при закрытой вкладке. Так проверяется выносливость и темп."));
      c.appendChild(el("p", "pt-muted", "На настоящем экзамене между частями бывают перерывы. Здесь можно сделать паузу между частями: таймер следующей части стартует, только когда ты её откроешь."));
      if (!liste.length) {
        c.appendChild(el("p", "pt-alert", "Нет срока, для которого в пакете есть все три бланка. Загрузи пакет: «Meine Prüfungsbögen» → «Paket laden»."));
        w.appendChild(c); return;
      }
      const sp = new Set(st.tage.map(t => t.termin));
      if (!WAHL || !liste.some(x => x.termin === WAHL)) WAHL = (liste.find(x => !sp.has(x.termin)) || liste[0]).termin;
      const lab = el("label", "pt-feld"); lab.appendChild(el("span", null, "Срок"));
      const sel = el("select");
      liste.forEach(x => { const o = el("option", null, x.name + (sp.has(x.termin) ? " · уже был" : "")); o.value = x.termin; o.selected = x.termin === WAHL; sel.appendChild(o); });
      sel.onchange = () => { WAHL = sel.value; zeichnen(); };
      lab.appendChild(sel); c.appendChild(lab);
      const x = liste.find(y => y.termin === WAHL), a = A();
      const ol = el("ol", "pt-plan");
      PLAN.forEach(t => {
        const m = a.modul(x.ids[t.id]), z = a.zustand(x.ids[t.id]);
        const li = el("li"); li.appendChild(el("b", null, t.name + " · " + t.min + " мин"));
        li.appendChild(el("span", "pt-muted", (m ? m.titel : x.ids[t.id]) + (Object.keys(z.a).length ? " — начатая попытка будет сохранена в истории, бланк начнётся заново" : "")));
        ol.appendChild(li);
      });
      c.appendChild(ol);
      c.appendChild(knopf("Начать день: " + x.name, () => {
        const s2 = lies(); if (s2 === null) return;
        s2.aktiv = { termin: x.termin, start: Date.now(), teile: {} };
        schreib(s2); zeichnen();
      }, "primary"));
      w.appendChild(c);
    }

    function tagZeichnen(w, st, liste) {
      const a = A(), tag = st.aktiv, x = liste.find(y => y.termin === tag.termin);
      const c = el("section", "pt-card");
      c.appendChild(el("h2", null, "Prüfungstag · " + terminName(tag.termin)));
      if (!x) { c.appendChild(el("p", "pt-alert", "Бланков этого срока нет в пакете на устройстве.")); c.appendChild(knopf("Отменить день", abbrechen, "ghost")); w.appendChild(c); return; }
      const gesamt = el("p", "pt-gesamt"); c.appendChild(gesamt);
      const jetzt = () => Date.now();
      const stati = PLAN.map(t => teilStatus(tag, t, a.zustand(x.ids[t.id]), jetzt()));
      const i = dran(stati);
      const ol = el("ol", "pt-teile");
      const restEls = [];
      PLAN.forEach((t, k) => {
        const s = stati[k], id = x.ids[t.id];
        const li = el("li", "pt-teil pt-" + s.s + (k === i ? " pt-dran" : ""));
        const kopf = el("div", "pt-teilkopf");
        kopf.appendChild(el("b", null, t.name)); kopf.appendChild(el("span", "pt-muted", t.min + " мин"));
        li.appendChild(kopf);
        if (s.s === "abgegeben") {
          const e = a.auswertung(a.modul(id), a.zustand(id));
          li.appendChild(el("p", null, "Сдано · " + zahl(e.punkte) + " из " + zahl(e.max) + " баллов" + (e.fertig ? " · " + e.note.text : " · не оценено ответов: " + (e.n - e.bewertet))));
          li.appendChild(knopf(e.fertig ? "Посмотреть ответы" : "Оценить текстовые ответы", () => a.oeffnen(id), "ghost"));
        } else if (s.s === "laeuft" || s.s === "zeitUm") {
          const r = el("p", "pt-rest"); restEls.push({ r, t, start: tag.teile[t.id].start }); li.appendChild(r);
          li.appendChild(knopf(s.s === "zeitUm" ? "Время вышло — открыть и сдать" : "Продолжить " + t.name, () => a.oeffnen(id), "primary"));
        } else if (k === i) {
          li.appendChild(el("p", "pt-muted", "Таймер стартует при нажатии."));
          li.appendChild(knopf("Начать " + t.name + " (" + t.min + " мин)", () => teilStarten(t, id), "primary"));
        } else li.appendChild(el("p", "pt-muted", "Откроется после " + PLAN[k - 1].name + "."));
        ol.appendChild(li);
      });
      c.appendChild(ol);
      const tick = () => {
        const d = Date.now() - tag.start;
        gesamt.textContent = "С начала дня прошло " + uhr(d) + " · чистое время экзамена: " + GESAMT + " мин";
        restEls.forEach(({ r, t, start }) => { const rest = t.min * 60000 - (Date.now() - start); r.textContent = rest > 0 ? "Осталось " + uhr(rest) : "Время вышло"; r.classList.toggle("knapp", rest > 0 && rest < 10 * 60000); });
      };
      tick();
      if (i != null) TICK = setInterval(() => { if ($("scPruefTag") && !$("scPruefTag").hidden) tick(); else stopp(); }, 1000);
      w.appendChild(c);
      if (i == null) w.appendChild(ergebnis(st, x));
      else c.appendChild(knopf("Отменить день", abbrechen, "ghost"));
    }

    function teilStarten(t, id) {
      const a = A();
      const start = a.pruefungStarten ? a.pruefungStarten(id, "streng") : 0;
      if (!start) { alert("Не удалось начать бланк (память заполнена?)."); return; }
      const st = lies(); if (!st || !st.aktiv) return;
      st.aktiv.teile[t.id] = { id, start };
      schreib(st);
      a.oeffnen(id);
    }
    function abbrechen() {
      if (!confirm("Отменить день экзамена? Ответы в бланках сохранятся, но день не попадёт в историю.")) return;
      const st = lies(); if (!st) return;
      st.aktiv = null; schreib(st); zeichnen();
    }

    function ergebnis(st, x) {
      const a = A(), N = root.GENNIVEAU;
      const c = el("section", "pt-card");
      c.appendChild(el("h3", null, "Итог дня"));
      const ausw = {};
      PLAN.forEach(t => { const id = x.ids[t.id]; ausw[t.id] = a.auswertung(a.modul(id), a.zustand(id)); });
      const w = werte(ausw);
      const tab = el("div", "pt-ergebnis");
      PLAN.forEach(t => {
        const e = ausw[t.id], z = el("div", "pt-zeile");
        z.appendChild(el("b", null, t.name));
        z.appendChild(el("span", null, e.fertig ? zahl(e.prozent) + " / 100 · " + e.note.text : "ещё не всё оценено"));
        if (w[t.id] != null) { const bar = el("span", "pt-balken"); const f = el("i", w[t.id] < 30 ? "rot" : w[t.id] < 50 ? "gelb" : "gruen"); f.style.width = Math.min(100, w[t.id]) + "%"; bar.appendChild(f); z.appendChild(bar); }
        tab.appendChild(z);
      });
      c.appendChild(tab);
      const offen = PLAN.filter(t => w[t.id] == null);
      if (offen.length) c.appendChild(el("p", "pt-muted", "Оцени текстовые ответы в " + offen.map(t => t.name).join(", ") + " по образцу — тогда появится итог и проверка правила."));
      else {
        if (N && N.regel) { const r = N.regel(w); c.appendChild(el("p", r.status === "ja" ? "pt-ok" : "pt-alert", r.bedingung + " — " + r.text)); }
        const unter = PLAN.filter(t => w[t.id] < 50);
        if (unter.length && root.GENMUENDLICH) c.appendChild(knopf("Потренировать устное дополнение (" + unter.map(t => t.name).join(", ") + ")", () => root.GENMUENDLICH.oeffnen(), "ghost"));
      }
      c.appendChild(knopf("Завершить день и сохранить в историю", () => {
        const s2 = lies(); if (!s2 || !s2.aktiv) return;
        s2.tage.push({ termin: s2.aktiv.termin, start: s2.aktiv.start, ende: Date.now(), werte: w });
        if (s2.tage.length > 50) s2.tage.splice(0, s2.tage.length - 50);
        s2.aktiv = null; schreib(s2); zeichnen();
      }, "primary"));
      c.appendChild(el("p", "pt-muted", "Баллы каждого бланка попадают и в «Мой уровень по частям»."));
      return c;
    }

    function verlauf(w, st) {
      if (!st.tage.length) return;
      const c = el("section", "pt-card");
      c.appendChild(el("h3", null, "Прошлые дни"));
      const ul = el("ul", "pt-verlauf");
      st.tage.slice(-8).reverse().forEach(t => {
        const d = new Date(t.start);
        const w2 = PLAN.map(p => p.name + " " + (t.werte && t.werte[p.id] != null ? zahl(t.werte[p.id]) : "—")).join(" · ");
        ul.appendChild(el("li", null, String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + ". · " + terminName(t.termin) + " · " + w2 + " · " + uhr(t.ende - t.start)));
      });
      c.appendChild(ul);
      w.appendChild(c);
    }

    function hook() {
      const alt = root.schirm;
      if (typeof alt === "function" && !alt.__pt) {
        const neu = function (name) {
          if (name === "scPruefTag") { oeffnen(true); return; }
          const s = $("scPruefTag"); if (s && !s.hidden) { stopp(); s.hidden = true; }
          return alt.apply(this, arguments);
        };
        neu.__pt = true; root.schirm = neu;
      }
    }
    api.oeffnen = () => oeffnen();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  }

  root.GENPRUEFTAG = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
