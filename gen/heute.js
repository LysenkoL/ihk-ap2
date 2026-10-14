/* ============================================================================
   gen/heute.js — карточка «Сегодня» на главной
   ----------------------------------------------------------------------------
   Одна компактная карточка сразу под «Следующим шагом» (hero в #stKopf):
     1. Сегодня · N минут — чек-лист из 2–4 шагов, галочки ставятся сами
        по сохранённым данным (повтор ошибок, занятие, Kurzfragen, бланк).
     2. Неделя — 7 кружков Пн–Вс, дни с любой активностью.
     3. Этап до экзамена 28.04.2027 (по берлинскому календарю).
     4. Резервная копия — когда последний раз нажимали «Stand senden».

   gen/start.js не меняется: renderStart() оборачивается так же, как это
   делает start.js, а MutationObserver на #stKopf возвращает карточку после
   каждого kopfAktualisieren() (он стирает #stKopf через innerHTML = "").

   Хранение: ap2:heute:ui = { sicherung: { zeit, geraet } } — только для этого
   устройства (суффикс :ui sync.js не отправляет на другие устройства).
   Чистые функции — для tests/heute.test.js.
   ========================================================================== */
"use strict";
(function (root) {
  const hatDom = typeof document !== "undefined";
  const SK = "ap2:heute:ui";
  const PRUEFUNG = "2027-04-28";
  const WT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const LERN_QUELLEN = ["lernweg", "praxis", "code", "normal", "operatoren"];
  const EXAM_QUELLEN = ["azubi"];

  /* ======================================================================
     Чистые функции
     ====================================================================== */
  const zwei = n => String(n).padStart(2, "0");
  /** локальная дата → "YYYY-MM-DD" */
  function tagKey(t) {
    const d = t instanceof Date ? t : new Date(t);
    if (isNaN(d.getTime())) return null;
    return d.getFullYear() + "-" + zwei(d.getMonth() + 1) + "-" + zwei(d.getDate());
  }
  /** время (мс), Date или готовый ключ "YYYY-MM-DD" → ключ дня; мусор → null */
  function zuKey(z) {
    if (z instanceof Date) return tagKey(z);
    if (typeof z === "string" && /^\d{4}-\d{2}-\d{2}$/.test(z)) return z;
    const n = Number(z);
    if (z == null || z === "" || !isFinite(n) || n <= 0) return null;
    return tagKey(n);
  }
  /** календарная дата в Берлине "YYYY-MM-DD" (если Intl не умеет — локальная) */
  function berlinTag(jetzt) {
    const d = jetzt instanceof Date ? jetzt : new Date(jetzt == null ? Date.now() : jetzt);
    try {
      const teile = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(d).reduce((o, p) => { o[p.type] = p.value; return o; }, {});
      if (teile.year && teile.month && teile.day) return teile.year + "-" + teile.month + "-" + teile.day;
    } catch (e) { }
    return tagKey(d);
  }
  const utcVon = ymd => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || ""); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; };
  /** дней от ymd до дня экзамена (0 = экзамен сегодня, < 0 = позади) */
  function restTage(ymd, ziel) { return Math.round((utcVon(ziel || PRUEFUNG) - utcVon(ymd)) / 864e5); }

  /** русское число: plural(5, ["день","дня","дней"]) → "дней" */
  function plural(n, f) {
    const a = Math.abs(n) % 10, b = Math.abs(n) % 100;
    if (a === 1 && b !== 11) return f[0];
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return f[1];
    return f[2];
  }
  const TAGE = ["день", "дня", "дней"];

  const ETAPPEN = [
    { bis: "2027-01-31", nr: 1, name: "основы и частые темы",
      tipp: "Проходи занятия маршрута и решай частые темы GA1 и GA2." },
    { bis: "2027-03-31", nr: 2, name: "раз в неделю пробный экзамен (Übung)",
      tipp: "Раз в неделю реши один бланк в режиме «Übung» и разбери ошибки." },
    { bis: PRUEFUNG, nr: 3, name: "режим Prüfung 90 минут и повтор ошибок",
      tipp: "Решай бланки в режиме «Prüfung» за 90 минут и каждый день повторяй ошибки." }
  ];
  /** этап по берлинской дате "YYYY-MM-DD" */
  function etappe(ymd) {
    const rest = restTage(ymd);
    const e = ETAPPEN.find(x => ymd <= x.bis);
    if (!e || !(rest >= 0)) return { nr: 0, von: 3, vorbei: true, rest: 0, titel: "Экзамен позади", tipp: "", restText: "" };
    const restText = rest === 0 ? "экзамен сегодня"
      : (plural(rest, ["остался", "осталось", "осталось"]) + " " + rest + " " + plural(rest, TAGE));
    return { nr: e.nr, von: 3, vorbei: false, rest, titel: "Этап " + e.nr + " из 3: " + e.name, tipp: e.tipp, restText };
  }

  /** семь локальных дат текущей недели, с понедельника */
  function wochenTage(jetzt) {
    const d = new Date(jetzt == null ? Date.now() : jetzt);
    const wd = (d.getDay() + 6) % 7;                 /* Пн = 0 … Вс = 6 */
    const out = [];
    for (let i = 0; i < 7; i++) out.push(tagKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - wd + i)));
    return out;
  }
  /** какие дни этой недели были активны; zeiten: мс | Date | "YYYY-MM-DD" */
  function woche(zeiten, jetzt) {
    const set = new Set((zeiten || []).map(zuKey).filter(Boolean));
    const heute = tagKey(jetzt == null ? new Date() : new Date(jetzt));
    const tage = wochenTage(jetzt).map((key, i) => ({ key, wt: WT[i], aktiv: set.has(key), heute: key === heute, zukunft: key > heute }));
    return { tage, anzahl: tage.filter(t => t.aktiv).length };
  }
  /** было ли что-то сегодня (локальная дата) */
  function heuteDa(zeiten, jetzt) {
    const h = tagKey(jetzt == null ? new Date() : new Date(jetzt));
    return (zeiten || []).some(z => zuKey(z) === h);
  }
  /** календарных дней между двумя моментами (локально, не меньше 0) */
  function tageZwischen(a, b) {
    const x = new Date(a), y = new Date(b);
    const n = Math.round((new Date(y.getFullYear(), y.getMonth(), y.getDate()) - new Date(x.getFullYear(), x.getMonth(), x.getDate())) / 864e5);
    return Math.max(0, n);
  }

  /** профиль маршрута → минуты (10/20/40, иначе 20) и дни в неделю (1–7, иначе 4) */
  function profil(p) {
    p = p || {};
    const m = Number(p.minutes), d = Number(p.days);
    return { minuten: [10, 20, 40].includes(m) ? m : 20, tage: Number.isInteger(d) && d >= 1 && d <= 7 ? d : 4 };
  }

  /** Собрать времена активности из сырых данных модулей.
      q = { lernstand:[{t,source}], lernweg:{done,history}, satz:{id:{t}}, azubi:[zuletzt], wieder:{"YYYY-MM-DD":n} } */
  function zeitenSammeln(q) {
    q = q || {};
    const lern = [], satz = [], exam = [], alle = [];
    (Array.isArray(q.lernstand) ? q.lernstand : []).forEach(e => {
      if (!e || !e.t) return;
      alle.push(e.t);
      if (LERN_QUELLEN.includes(e.source)) lern.push(e.t);
      if (EXAM_QUELLEN.includes(e.source)) exam.push(e.t);
    });
    const lw = q.lernweg || {};
    Object.keys(lw.done || {}).forEach(k => { const t = lw.done[k]; if (t) { lern.push(t); alle.push(t); } });
    (Array.isArray(lw.history) ? lw.history : []).forEach(h => { if (h && h.time) { lern.push(h.time); alle.push(h.time); } });
    const s = q.satz && typeof q.satz === "object" ? q.satz : {};
    Object.keys(s).forEach(k => { const t = s[k] && s[k].t; if (t) { satz.push(t); alle.push(t); } });
    (Array.isArray(q.azubi) ? q.azubi : []).forEach(t => { if (t) { exam.push(t); alle.push(t); } });
    const w = q.wieder && typeof q.wieder === "object" ? q.wieder : {};
    const wieder = Object.keys(w).filter(k => w[k] > 0);
    wieder.forEach(k => alle.push(k));
    return { alle, lern, satz, exam, wieder };
  }

  /** Шаги дня. o = { minuten, wieder:{faellig, geschafft}|null, lern:{titel}|null, lernFertig,
                      satz:bool, satzFertig, exam:bool, examFertig } */
  function schritte(o) {
    o = o || {};
    const min = profil({ minutes: o.minuten }).minuten;
    const L = [];
    if (o.wieder) {
      const k = Math.max(0, o.wieder.faellig | 0), g = Math.max(0, o.wieder.geschafft | 0);
      L.push({
        key: "wieder",
        titel: k ? "Повторить ошибки (" + k + ")" : g ? "Ошибки повторены" : "Ошибок к повтору нет",
        unter: g ? "сегодня: " + g : "",
        fertig: g > 0 || k === 0,
        knopf: k ? "Начать" : null
      });
    }
    if (min >= 20 && o.lern) {
      const t = o.lern.titel || "Занятие маршрута";
      /* после занятия маршрут уже предлагает следующее — не выдавать его за сделанное */
      L.push(o.lernFertig
        ? { key: "lern", titel: "Занятие сделано", unter: "дальше: " + t, fertig: true, knopf: "Открыть" }
        : { key: "lern", titel: t, unter: "Занятие или практика", fertig: false, knopf: "Открыть" });
    }
    if (o.satz) L.push({ key: "satz", titel: "5 вопросов", unter: "Kurzfragen", unterDe: true, fertig: !!o.satzFertig, knopf: "Начать" });
    if (min >= 40 && o.exam) L.push({ key: "exam", titel: "Задание из экзамена", unter: "бланк GA1 · GA2 · WiSo", fertig: !!o.examFertig, knopf: "Выбрать" });
    return { minuten: min, liste: L, fertig: L.filter(x => x.fertig).length, gesamt: L.length };
  }

  /* Есть ли что терять: ключи ap2: с данными, кроме настроек этого устройства */
  const NUR_EINSTELLUNG = /^ap2:(auth|theme|pwa:|start:|druck:|satz:ein$|heute:)|:ui$/;
  function leer(v) {
    if (v == null || v === "" || v === 0 || v === false) return true;
    if (Array.isArray(v)) return v.every(leer);
    if (typeof v === "object") return Object.keys(v).every(k => leer(v[k]));
    return false;
  }
  /** werte = { key: rohe Zeichenkette } */
  function hatFortschritt(werte) {
    return Object.keys(werte || {}).some(k => {
      if (k.indexOf("ap2:") !== 0 || NUR_EINSTELLUNG.test(k)) return false;
      const roh = werte[k];
      if (roh == null) return false;
      let v; try { v = JSON.parse(roh); } catch (e) { v = String(roh).trim(); }
      return !leer(v);
    });
  }

  /** строка о резервной копии. letzte = мс или null */
  function sicherung(o) {
    o = o || {};
    const jetzt = o.jetzt == null ? Date.now() : o.jetzt;
    const tage = o.letzte ? tageZwischen(o.letzte, jetzt) : null;
    if (tage == null && !o.fortschritt) return { zeigen: false, warn: false, tage: null, text: "" };
    const warn = !!o.fortschritt && (tage == null || tage > 7);
    const vor = tage == null ? "" : tage === 0 ? "сегодня" : tage === 1 ? "вчера" : tage + " " + plural(tage, TAGE) + " назад";
    const text = tage == null ? "Резервная копия: ещё не делала"
      : "Резервная копия: " + (warn ? "последняя " : "") + vor;
    return { zeigen: true, warn, tage, text };
  }
  const sicherungNoetig = o => sicherung(o).warn;

  const api = { tagKey, zuKey, berlinTag, restTage, plural, etappe, wochenTage, woche, heuteDa, tageZwischen,
                profil, zeitenSammeln, schritte, hatFortschritt, sicherung, sicherungNoetig,
                SK, PRUEFUNG, LERN_QUELLEN, ETAPPEN };

  /* ======================================================================
     Оформление на главной
     ====================================================================== */
  if (hatDom) {
    const $ = id => document.getElementById(id);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const lies = (k, d) => { try { const v = JSON.parse(root.localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
    const versuch = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };

    function geraetId() { return versuch(() => root.GENSYNC && root.GENSYNC.geraet ? root.GENSYNC.geraet().id : "", ""); }
    /** время последней копии с ЭТОГО устройства (старый экспорт может принести чужую отметку) */
    function letzteSicherung() {
      const s = lies(SK, {}) || {};
      const r = s.sicherung;
      if (!r || !r.zeit) return null;
      const g = geraetId();
      if (r.geraet && g && r.geraet !== g) return null;
      return r.zeit;
    }
    function merkeSicherung() {
      try {
        const s = lies(SK, {}) || {};
        s.sicherung = { zeit: Date.now(), geraet: geraetId() };
        root.localStorage.setItem(SK, JSON.stringify(s));
      } catch (e) { /* не страшно: строка просто останется предупреждением */ }
      setTimeout(zeichnen, 50);
    }
    function speicherWerte() {
      const o = {};
      try {
        for (let i = 0; i < root.localStorage.length; i++) {
          const k = root.localStorage.key(i);
          if (k && k.indexOf("ap2:") === 0) o[k] = root.localStorage.getItem(k);
        }
      } catch (e) { }
      return o;
    }
    function azubiZeiten(werte) {
      const out = [];
      Object.keys(werte).forEach(k => {
        if (!/^ap2:azubi:/.test(k) || k === "ap2:azubi:ui") return;
        try { const z = JSON.parse(werte[k]); if (z && z.zuletzt) out.push(z.zuletzt); } catch (e) { }
      });
      return out;
    }

    function daten() {
      const R = root, jetzt = new Date();
      const werte = speicherWerte();
      const st = versuch(() => R.GENLERNWEG ? R.GENLERNWEG.stand() : null, null);
      const prof = profil(st && st.profile);
      const z = zeitenSammeln({
        lernstand: versuch(() => R.GENLERNSTAND ? R.GENLERNSTAND.list() : [], []),
        lernweg: st,
        satz: lies("ap2:gen:satz", {}),
        azubi: azubiZeiten(werte),
        wieder: versuch(() => R.GENWIEDER && R.GENWIEDER.S ? R.GENWIEDER.S.tage : {}, {})
      });
      let wieder = null;
      if (R.GENWIEDER && R.GENWIEDER.faellig) {
        wieder = versuch(() => ({ faellig: R.GENWIEDER.faellig().length, geschafft: R.GENWIEDER.heuteGeschafft ? R.GENWIEDER.heuteGeschafft() : 0 }), null);
      }
      const lern = R.GENLERNWEG && R.GENLERNWEG.empfehlung ? versuch(() => R.GENLERNWEG.empfehlung(), null) : null;
      const plan = schritte({
        minuten: prof.minuten, wieder, lern,
        lernFertig: heuteDa(z.lern, jetzt),
        satz: !!(R.GENSATZ && R.GENSATZ.starten), satzFertig: heuteDa(z.satz, jetzt),
        exam: !!(R.GENLERNWEG && R.GENLERNWEG.oeffnen), examFertig: heuteDa(z.exam, jetzt)
      });
      return {
        plan, lern,
        woche: woche(z.alle, jetzt), tageSoll: prof.tage,
        etappe: etappe(berlinTag(jetzt)),
        sicherung: sicherung({ letzte: letzteSicherung(), jetzt: jetzt.getTime(), fortschritt: hatFortschritt(werte) })
      };
    }

    function aktion(key, d) {
      const R = root;
      try {
        if (key === "wieder" && R.GENWIEDER) R.GENWIEDER.starten();
        else if (key === "lern" && d.lern && typeof d.lern.tun === "function") d.lern.tun();
        else if (key === "satz" && R.GENSATZ) R.GENSATZ.starten(null, { anzahl: 5 });
        else if (key === "exam" && R.GENLERNWEG) R.GENLERNWEG.oeffnen(null, false, "lwTrain");
      } catch (e) { console.error("Heute:", e); }
    }
    function sicherungOeffnen() {
      const S = root.GENSTART;
      if (S && S.oeffneBlock && S.oeffneBlock("daten", "syBox")) return;
      if (root.GENSYNC && root.GENSYNC.senden) root.GENSYNC.senden();
    }
    function haken(an) {
      const h = el("span", "ht-haken" + (an ? " an" : ""));
      h.setAttribute("aria-hidden", "true");
      if (an) {
        const ik = root.GENIKON && root.GENIKON.knoten ? versuch(() => root.GENIKON.knoten("check", 14), null) : null;
        if (ik) h.appendChild(ik); else h.textContent = "✓";
      }
      return h;
    }

    function fuellen(k) {
      const d = daten();
      k.replaceChildren();
      const p = d.plan;
      k.classList.toggle("fertig", p.gesamt > 0 && p.fertig === p.gesamt);

      const kopf = el("div", "ht-kopf");
      kopf.appendChild(el("h2", "ht-titel", "Сегодня · " + p.minuten + " минут"));
      if (p.gesamt) kopf.appendChild(el("span", "ht-stand", "Сделано " + p.fertig + " из " + p.gesamt));
      k.appendChild(kopf);

      if (p.gesamt) {
        const ul = el("ul", "ht-schritte");
        p.liste.forEach(s => {
          const li = el("li", "ht-schritt" + (s.fertig ? " fertig" : ""));
          li.dataset.schritt = s.key;
          li.appendChild(haken(s.fertig));
          const tx = el("span", "ht-text");
          tx.appendChild(el("span", "ht-st", s.titel));
          const unten = el("span", "ht-su", s.unter || "");
          if (s.unterDe) unten.lang = "de";
          if (s.unter) tx.appendChild(unten);
          tx.appendChild(el("span", "ht-sr", s.fertig ? "сделано сегодня" : "ещё не сделано"));
          li.appendChild(tx);
          if (s.knopf) {
            const b = el("button", "btn ht-los", s.knopf);
            b.type = "button";
            b.setAttribute("aria-label", s.knopf + ": " + s.titel);
            b.onclick = () => aktion(s.key, d);
            li.appendChild(b);
          }
          ul.appendChild(li);
        });
        k.appendChild(ul);
      }

      const unten = el("div", "ht-unten");
      const w = el("div", "ht-woche");
      const ol = el("ol", "ht-tage");
      ol.setAttribute("aria-hidden", "true");
      d.woche.tage.forEach(t => {
        const li = el("li", "ht-tag" + (t.aktiv ? " an" : "") + (t.heute ? " heute" : "") + (t.zukunft ? " spaeter" : ""), t.wt);
        ol.appendChild(li);
      });
      w.appendChild(ol);
      const x = d.woche.anzahl, soll = d.tageSoll;
      w.appendChild(el("span", "ht-wtext" + (x >= soll ? " ok" : ""),
        "На этой неделе: " + x + " из " + soll + " " + (soll % 10 === 1 && soll % 100 !== 11 ? "дня" : "дней") + (x >= soll ? " ✓" : "")));
      unten.appendChild(w);

      const e = d.etappe;
      const et = el("p", "ht-etappe");
      et.appendChild(el("b", null, e.titel));
      if (e.restText) et.appendChild(document.createTextNode(" · " + e.restText));
      if (e.tipp) { et.appendChild(el("br")); et.appendChild(el("span", "ht-tipp", e.tipp)); }
      unten.appendChild(et);

      const s = d.sicherung;
      if (s.zeigen) {
        const z = el("div", "ht-sich" + (s.warn ? " warn" : ""));
        z.appendChild(el("span", null, s.text));
        if (s.warn) {
          const b = el("button", "btn ht-sknopf", "Сохранить копию");
          b.type = "button";
          b.onclick = sicherungOeffnen;
          z.appendChild(b);
        }
        unten.appendChild(z);
      }
      k.appendChild(unten);
    }

    /* ---- Platz: direkt unter dem hero „Следующий шаг“ ---- */
    let zeichnetGerade = false;
    function platzieren(k) {
      const s = $("scStart"), kopf = $("stKopf");
      const hero = kopf && kopf.querySelector(":scope > .st-heute");
      if (hero) { if (hero.nextElementSibling !== k) hero.insertAdjacentElement("afterend", k); return true; }
      if (kopf) {
        if (k.parentNode !== kopf) { const c = kopf.querySelector(":scope > .st-count"); c ? c.insertAdjacentElement("afterend", k) : kopf.insertBefore(k, kopf.firstChild); }
        return true;
      }
      if (s && !k.parentNode) s.insertBefore(k, s.firstChild);
      return !!s;
    }
    function zeichnen() {
      if (!$("scStart") || zeichnetGerade) return;
      zeichnetGerade = true;
      try {
        let k = $("htKarte");
        if (!k) { k = el("section", "ht-karte"); k.id = "htKarte"; k.setAttribute("aria-label", "Сегодня"); }
        fuellen(k);
        platzieren(k);
        beobachten();
      } catch (e) { console.error("Heute:", e); }
      zeichnetGerade = false;
    }
    /* kopfAktualisieren() стирает #stKopf — вернуть карточку до отрисовки */
    let beobachtet = null, mo = null;
    function beobachten() {
      const kopf = $("stKopf");
      if (!kopf || kopf === beobachtet || !root.MutationObserver) return;
      if (mo) mo.disconnect();
      mo = new MutationObserver(() => {
        if (zeichnetGerade) return;
        const k = $("htKarte"), hero = kopf.querySelector(":scope > .st-heute");
        if (!k || k.parentNode !== kopf || (hero && hero.nextElementSibling !== k)) zeichnen();
      });
      mo.observe(kopf, { childList: true });
      beobachtet = kopf;
    }

    function einhaengen() {
      const alt = root.renderStart;
      if (typeof alt === "function" && !alt.__ht) {
        const neu = function () {
          const r = alt.apply(this, arguments);
          try { setTimeout(zeichnen, 0); } catch (e) { }
          return r;
        };
        neu.__ht = true;
        root.renderStart = neu;
      }
      /* Старый экспорт файлом — отметить время копии. «Stand senden» отмечает
         сам gen/sync.js, и только после удачного сохранения/отправки. */
      document.addEventListener("click", ev => {
        const b = ev.target && ev.target.closest && ev.target.closest("#btnExport");
        if (b) merkeSicherung();
      }, true);
      /* вернулась к приложению на следующий день — обновить */
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && $("scStart") && !$("scStart").hidden) zeichnen();
      });
      zeichnen();
      setTimeout(zeichnen, 150);
      setTimeout(zeichnen, 1000);
    }

    api.zeichnen = zeichnen;
    api.daten = daten;
    api.letzteSicherung = letzteSicherung;
    api.merkeSicherung = merkeSicherung;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }

  root.GENHEUTE = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
