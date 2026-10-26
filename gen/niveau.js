/* ============================================================================
   gen/niveau.js — «Мой уровень по частям: GA1 · GA2 · WiSo»
   ----------------------------------------------------------------------------
   Карточка на главной (под «Сегодня») и экран подробностей #scNiveau.

   Балл части = среднее последних 3 полностью оценённых пробных экзаменов
   этой части (оригинальные бланки из плеера, gen/azubi.js). Квизы и
   тренажёры в балл не входят: они завысили бы уровень.

   Пороги IHK: ниже 30 ungenügend, 30–49 mangelhaft, от 50 ausreichend.
   Правило FiAusbV § 16: Teil 2 сдан, если не меньше 3 из 4 частей
   (проект, GA1, GA2, WiSo) ≥ 50 и ни одна не ниже 30. Проект здесь не
   вводится — показываем условие «если проект ≥ 50». Это не калькулятор
   итоговой оценки (его Лена исключила 03.10).

   gen/start.js не меняется: renderStart() оборачивается, как в heute.js.
   Ничего не хранит — всё читается из ap2:azubi:* и ap2:lernstand.
   Чистые функции — для tests/niveau.test.js.
   ========================================================================== */
"use strict";
(function (root) {
  const hatDom = typeof document !== "undefined";
  const TEILE = [
    { id: "ga1", name: "GA1", de: "Planen eines Softwareproduktes", minuten: 90, thema: "GA1" },
    { id: "ga2", name: "GA2", de: "Entwicklung und Umsetzung von Algorithmen", minuten: 90, thema: "GA2" },
    { id: "wiso", name: "WiSo", de: "Wirtschafts- und Sozialkunde", minuten: 60, thema: "WiSo", hinweis: "ответы с вариантами" }
  ];
  const ORIGINAL = /^(ga1|ga2|wiso)-\d{4}-[sw]$/;
  const ANZAHL = 3;

  /* ======================================================================
     Чистые функции
     ====================================================================== */
  const runde = x => Math.round(x * 10) / 10;

  /** Полностью оценённые попытки по частям: { ga1: [{id, kurz, d, prozent}], … } */
  function ergebnisse(module, zustandVon, auswertung, bereichVon) {
    const r = { ga1: [], ga2: [], wiso: [] };
    (module || []).forEach(m => {
      if (!m || !ORIGINAL.test(m.id || "")) return;
      const b = bereichVon ? bereichVon(m) : m.id.split("-")[0];
      if (!r[b]) return;
      const z = zustandVon(m.id) || {}, kurz = m.kurz || m.id;
      (Array.isArray(z.versuche) ? z.versuche : []).forEach(v => {
        if (v && v.n > 0 && v.bewertet === v.n && Number.isFinite(v.prozent))
          r[b].push({ id: m.id, kurz, d: v.d || 0, prozent: v.prozent });
      });
      /* Текущая попытка попадает в versuche только при «neuer Versuch» — двойного счёта нет. */
      const s = auswertung ? auswertung(m, z) : null;
      if (s && s.fertig && Number.isFinite(s.prozent)) r[b].push({ id: m.id, kurz, d: z.zuletzt || 0, prozent: s.prozent, aktuell: true });
    });
    return r;
  }

  /** Среднее последних n попыток: { punkte, anzahl, versuche } или null */
  function teilWert(liste, n) {
    const l = (liste || []).filter(v => v && Number.isFinite(v.prozent)).slice().sort((a, b) => (b.d || 0) - (a.d || 0)).slice(0, n || ANZAHL);
    if (!l.length) return null;
    return { punkte: runde(l.reduce((s, v) => s + v.prozent, 0) / l.length), anzahl: l.length, versuche: l };
  }

  const NOTEN = [[92, 1, "sehr gut"], [81, 2, "gut"], [67, 3, "befriedigend"], [50, 4, "ausreichend"], [30, 5, "mangelhaft"], [0, 6, "ungenügend"]];
  function noteVon(p) {
    if (root.GENAZUBI && root.GENAZUBI.note) return root.GENAZUBI.note(p);
    for (const [ab, n, text] of NOTEN) if (p >= ab) return { n, text };
    return { n: 6, text: "ungenügend" };
  }
  /** Пороги IHK → цвет */
  function stufe(punkte) {
    if (punkte == null) return { farbe: "leer", note: null };
    return { farbe: punkte < 30 ? "rot" : punkte < 50 ? "gelb" : "gruen", note: noteVon(punkte) };
  }

  /** Правило «3 из 4» при условии проект ≥ 50. werte: { ga1: число|null, … } */
  function regel(werte) {
    const fehlt = TEILE.filter(t => werte[t.id] == null).map(t => t.name);
    const da = TEILE.filter(t => werte[t.id] != null);
    const unter30 = da.filter(t => werte[t.id] < 30).map(t => t.name);
    const mittel = da.filter(t => werte[t.id] >= 30 && werte[t.id] < 50).map(t => t.name);
    const verletzt = unter30.length > 0 || mittel.length > 1;
    const status = verletzt ? "nein" : fehlt.length ? "offen" : "ja";
    let text;
    if (status === "ja") text = mittel.length ? "сейчас выполняется: одна часть 30–49 (" + mittel[0] + "), остальные ≥ 50" : "сейчас выполняется: все письменные части ≥ 50";
    else if (status === "nein") text = "сейчас не выполняется: " + (unter30.length ? "ниже 30 — " + unter30.join(", ") : "две части 30–49 — " + mittel.join(", "));
    else text = "пока не ясно: нет данных по " + fehlt.join(", ");
    return { status, text, fehlt, unter30, mittel, bedingung: "Если проект ≥ 50: из письменных можно одну 30–49, ни одной ниже 30." };
  }

  /** Что тренировать первым: часть без данных, иначе с самым низким баллом */
  function zuerst(werte) {
    const leer = TEILE.find(t => werte[t.id] == null);
    if (leer) return leer.id;
    return TEILE.slice().sort((a, b) => werte[a.id] - werte[b.id])[0].id;
  }

  /** К каким частям относится тема наблюдений */
  function teileVonThema(topic, themen, training) {
    const t = String(topic || "");
    if (/^(ga1|ga2|wiso)$/i.test(t)) return [];      /* целые бланки — это уже балл части */
    if (/^wiso-/.test(t)) return ["wiso"];
    const th = (themen || []).find(x => x && x.id === t);
    const teile = new Set();
    if (th && th.teil) String(th.teil).split("+").forEach(x => { const k = x.trim().toLowerCase(); if (k === "ga1" || k === "ga2" || k === "wiso") teile.add(k); });
    (training || []).forEach(x => { if (x && (x.lern || []).includes(t)) teile.add(String(x.bereich || "").toLowerCase()); });
    return Array.from(teile).filter(k => k === "ga1" || k === "ga2" || k === "wiso");
  }

  /** До n слабых тем части по GENLERNSTAND.summary(): сначала самая низкая доля */
  function schwacheThemen(teil, summary, themen, training, n) {
    return (summary || []).filter(s => s && ((s.weak || 0) + (s.selfWeak || 0)) > 0 && teileVonThema(s.topic, themen, training).includes(teil))
      .map(s => {
        const th = (themen || []).find(x => x && x.id === s.topic) || null;
        const tr = (training || []).find(x => x && String(x.bereich || "").toLowerCase() === teil && (x.lern || []).includes(s.topic)) || null;
        const quote = s.latestIndependentRatio != null ? s.latestIndependentRatio : s.ratio != null ? s.ratio : 0;
        return { topic: s.topic, titel: th ? th.ru || th.titel : tr ? tr.name : s.topic, fehler: (s.weak || 0) + (s.selfWeak || 0), quote, quiz: th ? th.id : null, training: tr ? tr.id : null };
      })
      .sort((a, b) => a.quote - b.quote || b.fehler - a.fehler || a.topic.localeCompare(b.topic))
      .slice(0, n || 3);
  }

  const terminWert = id => { const m = /-(\d{4})-([sw])$/.exec(id || ""); return m ? (+m[1]) * 2 + (m[2] === "w" ? 1 : 0) : 0; };
  /** Пробный экзамен части: начатый → новый → слабый → остальные; потом решения ZPA → u-form → свои; потом новее */
  function naechsteProbe(teil, eintraege) {
    const rang = { weiter: 0, neu: 1, schwach: 2, gemacht: 3 };
    return (eintraege || []).filter(e => e && e.bereich === teil)
      .sort((a, b) => (rang[a.g] ?? 4) - (rang[b.g] ?? 4) || (a.r || 0) - (b.r || 0) || terminWert(b.id) - terminWert(a.id))[0] || null;
  }

  /** Всё для карточки и экрана */
  function stand(o) {
    const erg = ergebnisse(o.module, o.zustandVon, o.auswertung, o.bereichVon);
    const teile = TEILE.map(t => {
      const w = teilWert(erg[t.id]);
      return Object.assign({}, t, { wert: w, punkte: w ? w.punkte : null, stufe: stufe(w ? w.punkte : null) });
    });
    const werte = {};
    teile.forEach(t => { werte[t.id] = t.punkte; });
    return { teile, werte, regel: regel(werte), zuerst: zuerst(werte) };
  }

  const api = { TEILE, ANZAHL, ergebnisse, teilWert, stufe, regel, zuerst, teileVonThema, schwacheThemen, naechsteProbe, stand };

  /* ======================================================================
     Оформление
     ====================================================================== */
  if (hatDom) {
    const $ = id => document.getElementById(id);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const knopf = (text, tun, haupt) => { const b = el("button", "btn" + (haupt ? " primary" : ""), text); b.type = "button"; b.onclick = tun; return b; };
    const fmt = x => String(x).replace(".", ",");
    const datum = d => { if (!d) return ""; const t = new Date(d); return String(t.getDate()).padStart(2, "0") + "." + String(t.getMonth() + 1).padStart(2, "0") + "."; };
    const A = () => root.GENAZUBI;
    let paketDa = false, laedt = false;

    function aktuell() {
      const a = A();
      if (!a || !a.alleModule) return stand({ module: [] });
      return stand({ module: a.alleModule(), zustandVon: a.zustand, auswertung: a.auswertung, bereichVon: a.bereichVon });
    }
    function ladenDann(f) {
      const a = A();
      if (paketDa || !a || !a.laden || laedt) return;
      laedt = true;
      a.laden().then(p => { paketDa = !!p; laedt = false; if (p) f(); }).catch(() => { laedt = false; });
    }
    function wertText(t) {
      return t.punkte == null ? "нет данных" : fmt(t.punkte) + " / 100 · " + t.stufe.note.text;
    }
    function balken(t) {
      const b = el("span", "nv-balken"), f = el("span", "nv-fuell " + t.stufe.farbe);
      f.style.width = Math.max(0, Math.min(100, t.punkte || 0)) + "%";
      b.appendChild(f);
      [30, 50].forEach(x => { const s = el("span", "nv-marke"); s.style.left = x + "%"; b.appendChild(s); });
      b.setAttribute("aria-hidden", "true");
      return b;
    }
    const regelZeichen = s => s === "ja" ? "✓" : s === "nein" ? "✗" : "?";

    /* ---- Карточка на главной ---- */
    function fuellen(k) {
      const st = aktuell();
      k.replaceChildren();
      const kopf = el("div", "nv-kopf");
      kopf.appendChild(el("h3", "nv-titel", "Мой уровень по частям"));
      kopf.appendChild(el("span", "nv-quelle", "по пробным экзаменам"));
      k.appendChild(kopf);
      const ul = el("ul", "nv-teile");
      st.teile.forEach(t => {
        const li = el("li", "nv-teil " + t.stufe.farbe);
        const z = el("div", "nv-zeile");
        z.appendChild(el("b", "nv-name", t.name));
        z.appendChild(el("span", "nv-wert", wertText(t)));
        li.appendChild(z);
        if (t.punkte != null) li.appendChild(balken(t));
        else li.appendChild(el("span", "nv-leer", paketDa || !A() ? "пройди пробный экзамен " + t.name : "пройди пробный экзамен " + t.name + " (нужен пакет бланков)"));
        ul.appendChild(li);
      });
      k.appendChild(ul);
      const r = el("p", "nv-regel " + st.regel.status);
      r.appendChild(el("span", "nv-zeichen", regelZeichen(st.regel.status)));
      r.appendChild(document.createTextNode(" Если проект ≥ 50 — " + st.regel.text));
      k.appendChild(r);
      const unten = el("div", "nv-unten");
      const zu = st.teile.find(t => t.id === st.zuerst);
      unten.appendChild(el("span", "nv-zuerst", "Тренировать первым: " + zu.name));
      unten.appendChild(knopf("Подробнее", () => oeffnen()));
      k.appendChild(unten);
    }

    let zeichnetGerade = false;
    function platzieren(k) {
      const s = $("scStart"), kopf = $("stKopf");
      const nach = (kopf && kopf.querySelector(":scope > #htKarte")) || (kopf && kopf.querySelector(":scope > .st-heute"));
      if (nach) { if (nach.nextElementSibling !== k) nach.insertAdjacentElement("afterend", k); return; }
      if (kopf) { if (k.parentNode !== kopf) kopf.appendChild(k); return; }
      if (s && !k.parentNode) s.insertBefore(k, s.firstChild);
    }
    function zeichnen() {
      if (!$("scStart") || zeichnetGerade) return;
      zeichnetGerade = true;
      try {
        let k = $("nvKarte");
        if (!k) { k = el("section", "nv-karte"); k.id = "nvKarte"; k.setAttribute("aria-label", "Мой уровень по частям"); }
        fuellen(k);
        platzieren(k);
        beobachten();
      } catch (e) { console.error("Niveau:", e); }
      zeichnetGerade = false;
      ladenDann(() => { zeichnen(); if ($("scNiveau") && !$("scNiveau").hidden) inhalt(); });
    }
    /* kopfAktualisieren() стирает #stKopf, heute.js вставляет свою карточку — вернуть нашу на место */
    let beobachtet = null, mo = null;
    function beobachten() {
      const kopf = $("stKopf");
      if (!kopf || kopf === beobachtet || !root.MutationObserver) return;
      if (mo) mo.disconnect();
      mo = new MutationObserver(() => {
        if (zeichnetGerade) return;
        const k = $("nvKarte"), vor = kopf.querySelector(":scope > #htKarte") || kopf.querySelector(":scope > .st-heute");
        if (!k || k.parentNode !== kopf || (vor && vor.nextElementSibling !== k)) zeichnen();
      });
      mo.observe(kopf, { childList: true });
      beobachtet = kopf;
    }

    /* ---- Экран подробностей ---- */
    function screen() {
      let s = $("scNiveau");
      if (s) return s;
      s = el("div", "seite nv-page"); s.id = "scNiveau"; s.hidden = true;
      const w = el("div", "nv-wrap"); w.id = "niveauInhalt"; s.appendChild(w);
      const start = $("scStart");
      start.parentNode.insertBefore(s, start.nextSibling);
      return s;
    }
    function oeffnen(fromHistory) {
      const s = screen();
      document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
      ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { if ($(k)) $(k).hidden = true; });
      if ($("kopfTitel")) $("kopfTitel").hidden = false;
      if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · личная подготовка";
      if ($("kTitel")) $("kTitel").textContent = "Мой уровень по частям";
      if (!fromHistory) {
        try {
          if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
          history.pushState({ ihk: 1, seite: "scNiveau" }, "");
        } catch (e) { }
      }
      inhalt();
      ladenDann(() => { inhalt(); zeichnen(); });
      if (root.GENZURUECK) root.GENZURUECK.knopfPflegen();
      root.scrollTo(0, 0);
    }
    function karte(w, titel) { const c = el("section", "nv-card"); if (titel) c.appendChild(el("h2", null, titel)); w.appendChild(c); return c; }

    function probeEintraege() {
      const a = A(), L = root.GENLERNWEG;
      if (!a || !a.alleModule) return [];
      return a.alleModule().filter(m => m && ORIGINAL.test(m.id)).map(m => {
        const e = a.einordnen(m, a.zustand(m.id)), q = L && L.quelle ? L.quelle(m) : { r: 0, text: "" };
        return { id: m.id, bereich: a.bereichVon(m), titel: m.kurz || m.id, g: e.g, pr: e.pr, r: q.r, quelle: q.text, minuten: m.minuten };
      });
    }

    function inhalt() {
      const w = $("niveauInhalt");
      if (!w) return;
      w.replaceChildren();
      const st = aktuell();

      /* 1. Части */
      const c1 = karte(w, "Мой уровень по частям");
      c1.appendChild(el("p", null, "Балл части — среднее последних " + ANZAHL + " полностью оценённых пробных экзаменов этой части (из 100). Квизы и тренажёры в балл не входят: они завысили бы уровень."));
      st.teile.forEach(t => {
        const box = el("div", "nv-teilbox " + t.stufe.farbe);
        const z = el("div", "nv-zeile");
        z.appendChild(el("b", "nv-name", t.name));
        z.appendChild(el("span", "nv-wert", wertText(t)));
        box.appendChild(z);
        const de = el("span", "nv-de", t.de); de.lang = "de"; box.appendChild(de);
        box.appendChild(el("span", "nv-muted", t.minuten + " минут · 100 баллов" + (t.hinweis ? " · " + t.hinweis : "")));
        if (t.punkte != null) {
          box.appendChild(balken(t));
          const v = t.wert.versuche.map(x => x.kurz + (x.d ? " · " + datum(x.d) : "") + " · " + fmt(x.prozent) + " %").join("; ");
          box.appendChild(el("p", "nv-muted", "Из " + t.wert.anzahl + " " + (t.wert.anzahl === 1 ? "экзамена" : "экзаменов") + ": " + v));
        } else {
          box.appendChild(el("p", null, "Пока нет полностью оценённого пробного экзамена " + t.name + ". Пройди один и поставь баллы за все задания."));
        }
        c1.appendChild(box);
      });
      c1.appendChild(el("p", "nv-muted", "Пороги IHK: ниже 30 — ungenügend, 30–49 — mangelhaft, от 50 — ausreichend."));
      if (!paketDa && A()) c1.appendChild(el("p", "nv-muted", "Загружаю пакет бланков… Если его нет на устройстве: «Meine Prüfungsbögen» → «Paket laden»."));

      /* 2. Правило */
      const c2 = karte(w, "Сдан ли Teil 2: правило 3 из 4");
      c2.appendChild(el("p", null, "FiAusbV § 16: Teil 2 сдан, если не меньше 3 из 4 частей (проект, GA1, GA2, WiSo) ≥ 50 и ни одна не ниже 30. Проект здесь не вводится."));
      c2.appendChild(el("p", null, st.regel.bedingung));
      const r = el("p", "nv-regel " + st.regel.status);
      r.appendChild(el("span", "nv-zeichen", regelZeichen(st.regel.status)));
      r.appendChild(document.createTextNode(" " + st.regel.text.charAt(0).toUpperCase() + st.regel.text.slice(1) + "."));
      c2.appendChild(r);
      c2.appendChild(el("p", "nv-muted", "Mündliche Ergänzungsprüfung: одну письменную часть ниже 50 можно поднять устно — 15 минут, письменный и устный результат считаются 2 : 1."));
      c2.appendChild(el("p", "nv-muted", "Это не прогноз итоговой оценки: AP1 и проект не учитываются."));

      /* 3. Тренировать первым */
      const zu = st.teile.find(t => t.id === st.zuerst);
      const c3 = karte(w, "Тренировать первым: " + zu.name);
      c3.appendChild(el("p", null, zu.punkte == null ? "По этой части ещё нет оценённого пробного экзамена — начни с него." : "У этой части самый низкий балл: " + fmt(zu.punkte) + " / 100."));
      const L = root.GENLERNSTAND;
      const summary = L && L.summary ? (() => { try { return L.summary(); } catch (e) { return []; } })() : [];
      const schwach = schwacheThemen(zu.id, summary, root.AP2_THEMEN || [], root.AP2_TRAINING || []);
      if (schwach.length) {
        c3.appendChild(el("h3", null, "Слабые темы " + zu.name));
        schwach.forEach(s => {
          const row = el("div", "nv-thema");
          row.appendChild(el("b", null, s.titel));
          row.appendChild(el("span", "nv-muted", "ошибок: " + s.fehler + (s.quote != null ? " · верно " + Math.round(s.quote * 100) + " %" : "")));
          const akt = el("div", "nv-aktionen");
          if (s.quiz && root.GENLERNEN) akt.appendChild(knopf("Тема и квиз", () => root.GENLERNEN.oeffnen(s.quiz)));
          if (s.training && root.GENLERNWEG) akt.appendChild(knopf("Из экзаменов", () => root.GENLERNWEG.oeffnen("@" + s.training)));
          if (akt.childNodes.length) row.appendChild(akt);
          c3.appendChild(row);
        });
      } else {
        c3.appendChild(el("p", "nv-muted", "Пока нет ошибок по темам этой части. Это не значит, что тема освоена — просто ещё мало наблюдений."));
        if (root.GENLERNWEG) c3.appendChild(knopf("Что тренировать", () => root.GENLERNWEG.oeffnen(null, false, "lwTrain")));
      }
      const probe = naechsteProbe(zu.id, probeEintraege());
      const akt = el("div", "nv-aktionen nv-probe");
      if (probe && A()) {
        akt.appendChild(knopf("Пробный экзамен " + zu.name + ": " + probe.titel, () => A().oeffnen(probe.id), true));
        c3.appendChild(akt);
        c3.appendChild(el("p", "nv-muted", [{ weiter: "Начат — закончи его", neu: "Ещё не решала", schwach: "В прошлый раз ниже 50 %", gemacht: "Повтор" }[probe.g], probe.quelle, (probe.minuten || zu.minuten) + " минут"].filter(Boolean).join(" · ") + "."));
      } else if (A()) {
        akt.appendChild(knopf("Открыть бланки", () => A().oeffnen(null), true));
        c3.appendChild(akt);
      }
    }

    function hook() {
      const alt = root.schirm;
      if (typeof alt === "function" && !alt.__nv) {
        const neu = function (name) {
          if (name === "scNiveau") { oeffnen(true); return; }
          const s = $("scNiveau"); if (s) s.hidden = true;
          return alt.apply(this, arguments);
        };
        neu.__nv = true;
        root.schirm = neu;
      }
      const altR = root.renderStart;
      if (typeof altR === "function" && !altR.__nv) {
        const neuR = function () {
          const r = altR.apply(this, arguments);
          try { setTimeout(zeichnen, 0); } catch (e) { }
          return r;
        };
        neuR.__nv = true;
        root.renderStart = neuR;
      }
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && $("scStart") && !$("scStart").hidden) zeichnen();
      });
      zeichnen();
      setTimeout(zeichnen, 200);
      setTimeout(zeichnen, 1100);
    }

    api.oeffnen = () => oeffnen();
    api.zeichnen = zeichnen;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
    else hook();
  }

  root.GENNIVEAU = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
