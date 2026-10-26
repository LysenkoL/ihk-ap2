/* ============================================================================
   gen/muendlich.js — Режим «Mündliche Ergänzungsprüfung»
   ----------------------------------------------------------------------------
   Liegt eine schriftliche Teilprüfung unter 50 Punkten und kann eine
   mündliche Ergänzungsprüfung das Bestehen entscheiden, darf man sie
   beantragen: etwa 15 Minuten, schriftliches und mündliches Ergebnis
   zählen 2 : 1. Dieser Modus übt genau das:
     Frage aus einem echten Bogen der gewählten Teilprüfung → 3 Minuten
     laut antworten (Aufnahme, wenn das Gerät ein Mikrofon hat) → Musterlösung
     → Selbsteinschätzung nach 5 Kriterien.

   Die Aufgabentexte kommen beim Üben aus dem eigenen Paket (GENAZUBI.ansicht)
   und werden NICHT gespeichert. Die Aufnahme bleibt nur in dieser Seite
   (nicht im Speicher, nicht in der Sicherung).
   Speicher ap2:muendlich = { versuche: [{ t, mid, tid, bereich, n, max, sek, aufnahme }] }.
   Journal: GENLERNSTAND.record({ topic: "muendlich", source: "muendlich", kind: "selbst", … }).
   Bildschirm scMuendlich. Reine Funktionen für tests/muendlich.test.js.
   ========================================================================== */
"use strict";
(function (root) {
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const SK = "ap2:muendlich";
  const DAUER = 180;
  const TEILE = { ga1: "GA1", ga2: "GA2", wiso: "WiSo" };
  const KRITERIEN = [
    "Die Frage direkt beantwortet (zuerst die Kernaussage)",
    "Fachbegriffe richtig verwendet",
    "Begründet: warum / welche Folge",
    "Bezug zur Situation oder ein Beispiel",
    "Zusammenhängend gesprochen, ohne lange Pausen"
  ];
  const KRIT_RU = ["сразу ответ на вопрос", "правильные термины", "обоснование: почему / какое следствие", "связь с ситуацией или пример", "связная речь без долгих пауз"];

  /* ---- reine Funktionen ---- */
  /** Ergebnis nach mündlicher Ergänzung: (2 × schriftlich + mündlich) ÷ 3 (eine Nachkommastelle, ohne Rundungsregel der IHK) */
  const ergebnis = (schriftlich, muendlich) => Math.round((2 * schriftlich + muendlich) / 3 * 10) / 10;
  /** Mindestpunkte mündlich (ganze Punkte), damit (2·s + m) ÷ 3 ≥ ziel; null = auch mit 100 nicht erreichbar */
  function noetig(schriftlich, ziel) {
    const z = ziel == null ? 50 : ziel;
    if (schriftlich >= z) return 0;              /* bestanden — keine Ergänzung nötig */
    const m = Math.max(0, Math.ceil(3 * z - 2 * schriftlich - 1e-9));
    return m > 100 ? null : m;
  }
  /** Zufällige Teilaufgabe einer Teilprüfung mit Musterlösung: [{ mid, tid }] → eine davon */
  function kandidaten(module, bereichVon, bereich) {
    const out = [];
    (module || []).forEach(m => {
      if (!m || !/^(ga1|ga2|wiso)-\d{4}-[sw]$/.test(m.id) || (bereichVon ? bereichVon(m) : m.id.split("-")[0]) !== bereich) return;
      (m.aufgaben || []).forEach(a => (a.teile || []).forEach(t => { if (t && t.id && t.loesung) out.push({ mid: m.id, tid: t.id, punkte: t.punkte || 0 }); }));
    });
    return out;
  }
  const api = { SK, DAUER, KRITERIEN, ergebnis, noetig, kandidaten };

  if (hatDom) {
    const $ = id => document.getElementById(id);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const knopf = (text, fn, cls) => { const b = el("button", "btn" + (cls ? " " + cls : ""), text); b.type = "button"; b.onclick = fn; return b; };
    const lies = () => { try { const v = JSON.parse(root.localStorage.getItem(SK)); return v && Array.isArray(v.versuche) ? v : { versuche: [] }; } catch (e) { return null; } };
    function merken(eintrag) {
      const st = lies();
      if (st === null) return false;
      st.versuche.push(eintrag);
      if (st.versuche.length > 200) st.versuche.splice(0, st.versuche.length - 200);
      try { root.localStorage.setItem(SK, JSON.stringify(st)); return true; } catch (e) { return false; }
    }
    const A = () => root.GENAZUBI;
    let LAUF = null;     /* { bereich, mid, tid, phase: "lesen"|"sprechen"|"auswerten", start, sek, rec, url, chunks } */
    let BEREICH = null;

    function screen() {
      let s = $("scMuendlich");
      if (s) return s;
      s = el("div", "seite mu-page"); s.id = "scMuendlich"; s.hidden = true;
      const w = el("div", "mu-wrap"); w.id = "muInhalt"; s.appendChild(w);
      const start = $("scStart"); start.parentNode.insertBefore(s, start.nextSibling);
      return s;
    }
    function oeffnen(ausVerlauf) {
      const s = screen();
      document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
      ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { if ($(k)) $(k).hidden = true; });
      if ($("kopfTitel")) $("kopfTitel").hidden = false;
      if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · mündlich";
      if ($("kTitel")) $("kTitel").textContent = "Mündliche Ergänzungsprüfung";
      if (!ausVerlauf) {
        try {
          if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
          history.pushState({ ihk: 1, seite: "scMuendlich" }, "");
        } catch (e) { }
      }
      stopp(); LAUF = null;
      uebersicht();
      if (root.GENZURUECK) root.GENZURUECK.knopfPflegen();
      root.scrollTo(0, 0);
    }
    function vorschlag() {
      const a = A(), N = root.GENNIVEAU;
      if (!a || !N || !N.stand || !a.alleModule) return null;
      try {
        const st = N.stand({ module: a.alleModule(), zustandVon: a.zustand, auswertung: a.auswertung, bereichVon: a.bereichVon });
        const unter = st.teile.filter(t => t.punkte != null && t.punkte < 50).sort((x, y) => x.punkte - y.punkte)[0];
        return unter ? { id: unter.id, punkte: unter.punkte } : null;
      } catch (e) { return null; }
    }

    function uebersicht() {
      const w = $("muInhalt"); w.replaceChildren();
      const c = el("section", "mu-card");
      c.appendChild(el("h2", null, "Mündliche Ergänzungsprüfung"));
      c.appendChild(el("p", null, "Если одна письменная часть (GA1, GA2 или WiSo) ниже 50 баллов и устный экзамен может решить, сдан ли экзамен, можно подать заявление на устное дополнение: около 15 минут, письменный и устный результат считаются 2 : 1."));
      c.appendChild(el("p", "mu-muted", "Порядок здесь: вопрос из настоящего бланка этой части → 3 минуты отвечаешь вслух по-немецки (если у устройства есть микрофон — с записью) → образец решения → самооценка по 5 пунктам. Запись остаётся только на этой странице и нигде не сохраняется."));
      const v = vorschlag();
      const rechner = el("div", "mu-rechner");
      rechner.appendChild(el("h3", null, "Сколько нужно набрать устно?"));
      const lab = el("label", "mu-feld"); lab.appendChild(el("span", null, "Письменно (баллы)"));
      const inp = el("input"); inp.type = "number"; inp.min = "0"; inp.max = "100"; inp.inputMode = "numeric"; inp.value = v ? String(Math.round(v.punkte)) : "40";
      lab.appendChild(inp); rechner.appendChild(lab);
      const aus = el("p", "mu-ergebnis"); rechner.appendChild(aus);
      const rechne = () => {
        const x = Math.max(0, Math.min(100, Number(inp.value) || 0)), n = noetig(x);
        aus.textContent = x >= 50 ? "Эта часть уже ≥ 50 — устное дополнение для неё не нужно."
          : n == null ? "Даже 100 устных баллов не дают 50: (2 × " + x + " + 100) ÷ 3 = " + String(ergebnis(x, 100)).replace(".", ",") + "."
          : "Нужно минимум " + n + " " + (n % 10 === 1 && n % 100 !== 11 ? "балл" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "балла" : "баллов") + " устно: (2 × " + x + " + " + n + ") ÷ 3 = " + String(ergebnis(x, n)).replace(".", ",") + ". Округление считает IHK — ориентируйся на этот минимум.";
      };
      inp.oninput = rechne; rechne();
      c.appendChild(rechner);
      w.appendChild(c);

      const k = el("section", "mu-card");
      k.appendChild(el("h3", null, "Тренировка: вопрос из экзамена"));
      if (v) k.appendChild(el("p", "mu-muted", "По «Мой уровень по частям» ниже 50 сейчас " + TEILE[v.id] + " (" + Math.round(v.punkte) + ") — начни с неё."));
      BEREICH = BEREICH || (v ? v.id : "ga1");
      const wahl = el("div", "mu-wahl"); wahl.setAttribute("role", "group");
      Object.keys(TEILE).forEach(b => {
        const x = el("button", "mu-chip" + (BEREICH === b ? " an" : ""), TEILE[b]); x.type = "button";
        x.setAttribute("aria-pressed", BEREICH === b ? "true" : "false");
        x.onclick = () => { BEREICH = b; uebersicht(); };
        wahl.appendChild(x);
      });
      k.appendChild(wahl);
      k.appendChild(knopf("Новый вопрос", neueFrage, "primary"));
      const st = lies();
      const meine = st ? st.versuche.filter(x => x.bereich === BEREICH) : [];
      if (meine.length) {
        const sch = meine.slice(-5).map(x => x.n + "/" + x.max).join(" · ");
        k.appendChild(el("p", "mu-muted", "Последние самооценки " + TEILE[BEREICH] + ": " + sch + " (всего попыток: " + meine.length + ")"));
      }
      w.appendChild(k);
    }

    function neueFrage() {
      const a = A();
      if (!a || !a.laden) { meldung("Плеер бланков недоступен."); return; }
      a.laden().then(() => {
        const l = kandidaten(a.alleModule ? a.alleModule() : [], a.bereichVon, BEREICH);
        if (!l.length) { meldung("Для " + TEILE[BEREICH] + " на устройстве нет пакета бланков. «Meine Prüfungsbögen» → «Paket laden»."); return; }
        const x = l[Math.floor(Math.random() * l.length)];
        LAUF = { bereich: BEREICH, mid: x.mid, tid: x.tid, phase: "lesen", sek: 0 };
        frage();
      }).catch(() => meldung("Пакет бланков не загрузился."));
    }
    function meldung(text) { const w = $("muInhalt"); w.appendChild(el("p", "mu-card mu-alert", text)); }

    function frageKarte(mitLoesung) {
      const a = A(), v = a && a.ansicht ? a.ansicht(LAUF.mid, LAUF.tid) : null;
      const c = el("section", "mu-card");
      const m = a.modul ? a.modul(LAUF.mid) : null;
      c.appendChild(el("p", "mu-muted", (m && (m.kurz || m.id)) + " · " + (v ? v.titel : "")));
      if (!v) { c.appendChild(el("p", "mu-alert", "Задание не найдено в пакете.")); return c; }
      if (v.situation) { const d = el("details", "mu-situation"); d.appendChild(el("summary", null, "Ausgangssituation")); const b = el("div"); b.lang = "de"; b.appendChild(v.situation); d.appendChild(b); c.appendChild(d); }
      const f = el("div", "mu-frage"); f.lang = "de"; f.appendChild(v.frage); c.appendChild(f);
      if (mitLoesung) { const l = el("div", "mu-loesung"); l.lang = "de"; l.appendChild(el("h4", null, "Musterlösung")); l.appendChild(v.loesung); c.appendChild(l); }
      return c;
    }

    function frage() {
      const w = $("muInhalt"); w.replaceChildren();
      w.appendChild(knopf("← Назад", () => oeffnen(true), "ghost"));
      w.appendChild(frageKarte(false));
      const c = el("section", "mu-card");
      if (LAUF.phase === "lesen") {
        c.appendChild(el("p", null, "Прочитай вопрос. Подумай 30 секунд: главная мысль → 2–3 термина → пример из ситуации. Потом говори 3 минуты по-немецки, как экзаменатору."));
        const kannAufnehmen = !!(root.navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && root.MediaRecorder);
        c.appendChild(knopf(kannAufnehmen ? "Начать: 3 минуты с записью" : "Начать: 3 минуты", () => sprechen(kannAufnehmen), "primary"));
        if (kannAufnehmen) c.appendChild(knopf("Без записи", () => sprechen(false), "ghost"));
        c.appendChild(el("p", "mu-muted", "Подсказка-структура: «Zunächst … Außerdem … Ein Beispiel aus der Situation ist … Deshalb empfehle ich …»"));
      }
      w.appendChild(c);
    }

    function sprechen(mitAufnahme) {
      LAUF.phase = "sprechen"; LAUF.start = Date.now(); LAUF.aufnahme = false;
      const w = $("muInhalt"); w.replaceChildren();
      w.appendChild(frageKarte(false));
      const c = el("section", "mu-card mu-uhr");
      const zeit = el("p", "mu-zeit", "3:00"); c.appendChild(zeit);
      const bar = el("div", "mu-balken"); const fill = el("span"); bar.appendChild(fill); c.appendChild(bar);
      const status = el("p", "mu-muted", mitAufnahme ? "Запрашиваю микрофон…" : "Говори вслух. Запись выключена."); c.appendChild(status);
      c.appendChild(knopf("Закончить ответ", fertig, "primary"));
      w.appendChild(c);
      LAUF.uhr = setInterval(() => {
        const s = Math.floor((Date.now() - LAUF.start) / 1000), rest = Math.max(0, DAUER - s);
        zeit.textContent = Math.floor(rest / 60) + ":" + String(rest % 60).padStart(2, "0");
        fill.style.width = Math.min(100, s / DAUER * 100) + "%";
        if (rest === 0) fertig();
      }, 250);
      if (mitAufnahme) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          if (!LAUF || LAUF.phase !== "sprechen") { stream.getTracks().forEach(t => t.stop()); return; }
          const rec = new MediaRecorder(stream), chunks = [];
          rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); if (LAUF && chunks.length) { LAUF.url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" })); auswerten(); } };
          rec.start(); LAUF.rec = rec; LAUF.aufnahme = true;
          status.textContent = "● Идёт запись. Говори по-немецки.";
        }).catch(() => { status.textContent = "Микрофон недоступен — говори вслух без записи."; });
      }
    }
    function stopp() {
      if (LAUF && LAUF.uhr) { clearInterval(LAUF.uhr); LAUF.uhr = null; }
      if (LAUF && LAUF.rec && LAUF.rec.state === "recording") { try { LAUF.rec.stop(); } catch (e) { } }
    }
    function fertig() {
      if (!LAUF || LAUF.phase !== "sprechen") return;
      LAUF.sek = Math.min(DAUER, Math.round((Date.now() - LAUF.start) / 1000));
      LAUF.phase = "auswerten";
      const warteAufAufnahme = LAUF.rec && LAUF.rec.state === "recording";
      stopp();
      if (!warteAufAufnahme) auswerten();      /* sonst ruft rec.onstop auswerten() */
    }
    function auswerten() {
      const w = $("muInhalt"); w.replaceChildren();
      w.appendChild(frageKarte(true));
      const c = el("section", "mu-card");
      c.appendChild(el("h3", null, "Твой ответ: " + Math.floor(LAUF.sek / 60) + ":" + String(LAUF.sek % 60).padStart(2, "0")));
      if (LAUF.url) { const au = el("audio"); au.controls = true; au.src = LAUF.url; c.appendChild(au); c.appendChild(el("p", "mu-muted", "Послушай запись и сравни с образцом. Запись не сохраняется.")); }
      c.appendChild(el("p", null, "Отметь, что было в твоём ответе:"));
      const checks = KRITERIEN.map((k, i) => {
        const lab = el("label", "mu-krit"); const cb = el("input"); cb.type = "checkbox";
        const s = el("span"); const de = el("span", null, k); de.lang = "de"; s.appendChild(de); s.appendChild(el("span", "mu-muted-i", " — " + KRIT_RU[i]));
        lab.appendChild(cb); lab.appendChild(s); c.appendChild(lab); return cb;
      });
      c.appendChild(knopf("Сохранить самооценку", () => {
        const n = checks.filter(x => x.checked).length;
        const ok = merken({ t: Date.now(), mid: LAUF.mid, tid: LAUF.tid, bereich: LAUF.bereich, n, max: KRITERIEN.length, sek: LAUF.sek, aufnahme: !!LAUF.url });
        try { if (root.GENLERNSTAND) root.GENLERNSTAND.record({ topic: "muendlich", source: "muendlich", task: LAUF.mid + ":" + LAUF.tid, correct: n, max: KRITERIEN.length, support: "selbst", kind: "selbst", answers: { sek: LAUF.sek, kriterien: checks.map(x => x.checked) } }); } catch (e) { }
        if (LAUF.url) { try { URL.revokeObjectURL(LAUF.url); } catch (e) { } }
        LAUF = null;
        uebersicht();
        const w2 = $("muInhalt");
        w2.insertBefore(el("p", "mu-card " + (ok ? "mu-ok" : "mu-alert"), ok ? "Сохранено: " + n + " из " + KRITERIEN.length + ". Следующий вопрос — в другой день или сразу ещё один." : "Не удалось сохранить (память браузера недоступна)."), w2.firstChild);
      }, "primary"));
      c.appendChild(knopf("Ещё раз этот вопрос", () => { if (LAUF.url) { try { URL.revokeObjectURL(LAUF.url); } catch (e) { } } LAUF = Object.assign(LAUF, { phase: "lesen", url: null }); frage(); }, "ghost"));
      w.appendChild(c);
    }

    function hook() {
      const alt = root.schirm;
      if (typeof alt === "function" && !alt.__mu) {
        const neu = function (name) {
          if (name === "scMuendlich") { oeffnen(true); return; }
          const s = $("scMuendlich"); if (s && !s.hidden) { stopp(); s.hidden = true; }
          return alt.apply(this, arguments);
        };
        neu.__mu = true; root.schirm = neu;
      }
    }
    api.oeffnen = () => oeffnen();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  }

  root.GENMUENDLICH = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
