/* ============================================================================
   gen/lernen.js — Themen AP2: kurz erklärt, Quiz, Kurzfragen, Trainer
   ----------------------------------------------------------------------------
   Ein Ort für die Theorie, die GA1 und GA2 abfragen, aber kein echter Bogen
   systematisch übt: Sortieren und Suchen, Entwurfsmuster, Tests, Git, REST,
   Datenformate, Kryptographie, Zugriffsschutz, Integrität, Vorgehensmodelle,
   Anforderungen, Ergonomie, Werkzeuge, Prüfungstaktik.

   Je Thema: Erklärung in einfachem Deutsch mit russischen Begriffen,
   Tabelle und Code, Merksatz, Quiz mit Erklärung, passende Kurzfragen
   (gen/satzbau.js) und — wo es einen gibt — der passende Trainer.
   Falsch beantwortete Quizfragen landen in „Fehler wiederholen“.

   Daten:    gen/lernen-daten.js (window.AP2_THEMEN)
   Speicher: ap2:lernen = { "q:<frage>": { ok, n, f, t }, "g:<thema>": Zeit }
             flach, damit der Abgleich zwischen Geräten je Frage mischt.
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const ik = (n, g) => root.GENIKON ? root.GENIKON.svg(n, g || 18) : "";

  const SK = "ap2:lernen";
  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  let ST = lies(SK, {}) || {};
  const sichern = () => schreib(SK, ST);

  const THEMEN = () => root.AP2_THEMEN || [];
  const thema = id => THEMEN().find(t => t.id === id) || null;
  function alleFragen() {
    const out = [];
    THEMEN().forEach(t => (t.quiz || []).forEach(q => out.push(Object.assign({ thema: t.id, themaTitel: t.titel }, q))));
    return out;
  }
  const frage = id => alleFragen().find(q => q.id === id) || null;

  /* ------------------------------------------------------------ Bewertung */
  /** gewählte Indizes (in Original-Reihenfolge) gegen r prüfen */
  function pruefe(q, gewaehlt) {
    const soll = (q.r || []).slice().sort((a, b) => a - b).join(",");
    const ist = Array.from(new Set(gewaehlt || [])).sort((a, b) => a - b).join(",");
    return soll === ist;
  }
  function eintragen(id, ok) {
    const k = "q:" + id, s = Object.assign({ n: 0, f: 0 }, ST[k] || {});
    s.n++; if (!ok) s.f++;
    s.ok = ok ? 1 : 0; s.t = Date.now();
    if (!ok) {
      s.wiederNoetig = true; delete s.wiederFertig;
      if (root.GENWIEDER && root.GENWIEDER.erneut) root.GENWIEDER.erneut("lq:" + id);
    }
    ST[k] = s; sichern();
  }
  function antwortEintragen(id, gewaehlt) {
    const q = frage(id);
    if (!q || !Array.isArray(gewaehlt)) return null;
    const vorher = ST["q:" + id] || {}, ok = pruefe(q, gewaehlt);
    const heute = new Date().toDateString();
    const support = vorher.loesungGesehen && new Date(vorher.loesungGesehen).toDateString() === heute ? "loesung" : "selbst";
    eintragen(id, ok);
    if (root.GENLERNSTAND) root.GENLERNSTAND.record({ topic: q.thema, source: "quiz", task: id,
      correct: ok ? 1 : 0, max: 1, support, kind: "recognition", answers: gewaehlt.slice() });
    ST["q:" + id].loesungGesehen = Date.now(); sichern();
    return ok;
  }
  /** neu | richtig | falsch — die letzte Antwort zählt */
  function standVon(id) {
    const s = ST["q:" + id];
    if (!s) return "neu";
    return s.ok ? "richtig" : "falsch";
  }
  function zahlen(liste) {
    const L = liste || alleFragen(), z = { richtig: 0, falsch: 0, neu: 0, gesamt: L.length };
    L.forEach(q => { z[standVon(q.id)]++; });
    return z;
  }
  const falsche = () => alleFragen().filter(q => standVon(q.id) === "falsch");
  const gelesen = id => !!ST["g:" + id];
  function markiereGelesen(id) { if (!ST["g:" + id]) { ST["g:" + id] = Date.now(); sichern(); } }

  /** Runde: zuerst falsch, dann neu, dann lange nicht gesehen */
  const RANG = { falsch: 0, neu: 1, richtig: 2 };
  function runde(opt) {
    const o = Object.assign({ anzahl: 10, themen: null, nurFalsch: false }, opt || {});
    let pool = alleFragen();
    if (o.ids && o.ids.length) pool = pool.filter(q => o.ids.indexOf(q.id) >= 0);
    else if (o.themen && o.themen.length) pool = pool.filter(q => o.themen.indexOf(q.thema) >= 0);
    if (o.nurFalsch) pool = pool.filter(q => standVon(q.id) === "falsch");
    const jetzt = Date.now();
    return pool.map(q => {
      const s = ST["q:" + q.id];
      const alt = s && s.t ? Math.min(0.9, (jetzt - s.t) / 864e5 / 30) : 0;
      return { q, r: RANG[standVon(q.id)] - alt + Math.random() * 0.5 };
    }).sort((a, b) => a.r - b.r).slice(0, Math.max(1, o.anzahl)).map(x => x.q);
  }

  function mische(n) {
    const a = []; for (let i = 0; i < n; i++) a.push(i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ======================================================================
     Startseite: Block „Themen AP2“
     ====================================================================== */
  function box() {
    if (!hatDom) return;
    const s = $("scStart");
    if (!s) return;
    let b = $("lernenBox");
    if (!b) {
      b = el("div", "abschnitt"); b.id = "lernenBox";
      const vor = $("pseudoBox") || $("sqlBox");
      const nach = vor ? (vor.closest("details.st-block") || vor) : null;
      if (nach && nach.parentNode) nach.parentNode.insertBefore(b, nach);
      else s.appendChild(b);
    }
    b.innerHTML = "";
    const T = THEMEN(), z = zahlen();
    const nGelesen = T.filter(t => gelesen(t.id)).length;
    b.appendChild(el("h2", null, "Themen AP2 — erklärt, mit Quiz"));
    b.appendChild(el("p", null, T.length + " Themen aus dem Prüfungskatalog, die GA1 und GA2 abfragen: Sortieren und Suchen, " +
      "Entwurfsmuster, Tests, Git, REST, Datenformate, Kryptographie, Vorgehensmodelle, Ergonomie … Einfach erklärt, " +
      "mit russischen Begriffen, Code-Beispielen und " + z.gesamt + " Quizfragen."));
    const bal = el("div", "ln-balken");
    [["richtig", z.richtig], ["falsch", z.falsch]].forEach(([k, n]) => {
      if (!n) return; const sp = el("span", "ln-" + k); sp.style.width = (n / Math.max(1, z.gesamt) * 100) + "%"; bal.appendChild(sp);
    });
    b.appendChild(bal);
    b.appendChild(el("p", "ln-zahlen", z.richtig + " richtig · " + z.falsch + " falsch · " + z.neu + " neu · " + nGelesen + " von " + T.length + " Themen gelesen"));
    const st = el("div", "gen-knopfzeile ln-start");
    const k1 = el("button", "btn primary", "Themen ansehen"); k1.type = "button"; k1.onclick = () => oeffnen();
    const k2 = el("button", "btn", "Quiz: 10 Fragen"); k2.type = "button"; k2.onclick = () => quizStarten(runde({ anzahl: 10 }), "Quiz quer durch alle Themen");
    st.append(k1, k2);
    if (z.falsch) {
      const k3 = el("button", "btn ghost", "Falsche wiederholen (" + z.falsch + ")"); k3.type = "button";
      k3.onclick = () => quizStarten(runde({ anzahl: 20, nurFalsch: true }), "Falsch beantwortete Fragen");
      st.appendChild(k3);
    }
    if (root.GENALGO) {
      const k4 = el("button", "btn ghost", "Sortieren & Suchen üben"); k4.type = "button"; k4.onclick = () => root.GENALGO.oeffnen();
      st.appendChild(k4);
    }
    b.appendChild(st);
    const chips = el("div", "ln-chips");
    T.forEach(t => {
      const c = el("button", "ln-chip" + (gelesen(t.id) ? " gelesen" : ""), t.titel); c.type = "button";
      c.onclick = () => oeffnen(t.id);
      chips.appendChild(c);
    });
    b.appendChild(chips);
    const d = document.querySelector('details.st-block[data-key="lernen"] .st-zahl');
    if (d) d.textContent = z.richtig + "/" + z.gesamt;
  }

  /* ======================================================================
     Eigene Seite
     ====================================================================== */
  let VIEW = { art: "liste" };
  let LAUF = null;    /* { titel, fragen, i, antworten: [{ok, gewaehlt}], reihen: {id: [perm]}, gewaehlt: Set, fertig } */
  let herkunft = "scStart";

  function seite() {
    let s = $("scLernen");
    if (s) return s;
    s = el("div", "seite ln-seite"); s.id = "scLernen"; s.hidden = true;
    const w = el("div", "ln-wrap"); w.id = "lernenInhalt";
    s.appendChild(w);
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling);
    else document.body.appendChild(s);
    return s;
  }
  const inhalt = () => { seite(); const w = $("lernenInhalt"); w.innerHTML = ""; return w; };

  function sichtbarMachen() {
    const s = seite();
    const vorher = ["scBogen", "scAuswertung", "scKatalog", "scAzubi", "scWieder", "scGlossar", "scKomp", "scSpick", "scSql", "scSatz", "scAlgo"]
      .find(id => $(id) && !$(id).hidden) || "scStart";
    if (vorher !== "scLernen") herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => { if (e.id !== "scLernen") e.hidden = true; });
    s.hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    const sk = $("schalterKatalog"); if (sk) sk.hidden = true;
    ["mwUhr", "btnUhr", "mwPunkte"].forEach(id => { const e = $(id); if (e) e.hidden = true; });
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scLernen", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
  }
  function kopf(eyebrow, titel) {
    if ($("kEyebrow")) $("kEyebrow").textContent = eyebrow;
    if ($("kTitel")) $("kTitel").textContent = titel;
  }

  /** Ansicht wechseln; ohne `ausVerlauf` gibt es einen Verlaufseintrag (Zurück-Taste) */
  function zeige(view, ausVerlauf) {
    VIEW = view || { art: "liste" };
    sichtbarMachen();
    if (VIEW.art === "quiz" && !LAUF) VIEW = { art: "liste" };
    if (VIEW.art === "thema" && !thema(VIEW.id)) VIEW = { art: "liste" };
    if (VIEW.art === "thema") zeichneThema(thema(VIEW.id));
    else if (VIEW.art === "quiz") zeichneQuiz();
    else zeichneListe();
    if (!ausVerlauf) {
      try {
        if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: herkunft }, "");
        history.pushState({ ihk: 1, seite: "scLernen", ln: VIEW }, "", location.hash || "");
      } catch (e) { }
    }
    root.scrollTo(0, 0);
  }

  function oeffnen(id) { zeige(id ? { art: "thema", id } : { art: "liste" }); }

  /* -------------------------------------------------------- Übersicht */
  function zeichneListe() {
    kopf("Lernen · " + THEMEN().length + " Themen", "Themen AP2");
    const w = inhalt();
    const z = zahlen();
    const k = el("div", "ln-karte");
    k.appendChild(el("h2", null, "Themen AP2 — kurz erklärt"));
    k.appendChild(el("p", "ln-info", "Jedes Thema: Erklärung in einfachen Sätzen, russische Begriffe, Beispiel-Code, Merksatz und Quiz. " +
      "Danach die passenden Kurzfragen schreiben — so wie in der Prüfung."));
    const bal = el("div", "ln-balken");
    [["richtig", z.richtig], ["falsch", z.falsch]].forEach(([c, n]) => { if (!n) return; const sp = el("span", "ln-" + c); sp.style.width = (n / Math.max(1, z.gesamt) * 100) + "%"; bal.appendChild(sp); });
    k.appendChild(bal);
    k.appendChild(el("p", "ln-zahlen", z.richtig + " von " + z.gesamt + " Fragen richtig · " + z.falsch + " falsch · " + z.neu + " neu"));
    const st = el("div", "ln-knoepfe");
    const q1 = el("button", "btn primary", "Quiz: 10 Fragen gemischt"); q1.type = "button";
    q1.onclick = () => quizStarten(runde({ anzahl: 10 }), "Quiz quer durch alle Themen");
    st.appendChild(q1);
    if (z.falsch) {
      const q2 = el("button", "btn", "Falsche wiederholen (" + z.falsch + ")"); q2.type = "button";
      q2.onclick = () => quizStarten(runde({ anzahl: 20, nurFalsch: true }), "Falsch beantwortete Fragen");
      st.appendChild(q2);
    }
    if (root.GENALGO) {
      const q3 = el("button", "btn ghost", "Sortieren & Suchen Schritt für Schritt"); q3.type = "button";
      q3.onclick = () => root.GENALGO.oeffnen();
      st.appendChild(q3);
    }
    k.appendChild(st);
    w.appendChild(k);

    const gitter = el("div", "ln-gitter");
    THEMEN().forEach(t => {
      const zt = zahlen((t.quiz || []).map(q => ({ id: q.id })));
      const c = el("button", "ln-thema" + (gelesen(t.id) ? " gelesen" : "")); c.type = "button";
      const oben = el("span", "ln-t-oben");
      oben.appendChild(el("span", "ln-teil", t.teil));
      if (gelesen(t.id)) oben.appendChild(el("span", "ln-haken", "✓ gelesen"));
      c.appendChild(oben);
      c.appendChild(el("b", "ln-t-titel", t.titel));
      c.appendChild(el("span", "ln-t-ru", t.ru));
      const mini = el("span", "ln-minibalken");
      const g = el("i"); g.style.width = (zt.richtig / Math.max(1, zt.gesamt) * 100) + "%"; mini.appendChild(g);
      c.appendChild(mini);
      c.appendChild(el("span", "ln-t-stand", zt.richtig + "/" + zt.gesamt + " richtig" + (zt.falsch ? " · " + zt.falsch + " falsch" : "")));
      c.onclick = () => oeffnen(t.id);
      gitter.appendChild(c);
    });
    w.appendChild(gitter);
    w.appendChild(el("p", "ln-quelle", "Gliederung angeregt durch ap2.online (M. Scheremet) — die Texte hier sind eigene. Links zum Nachlesen stehen bei jedem Thema."));
  }

  /* ------------------------------------------------------------ Thema */
  function zeichneThema(t) {
    markiereGelesen(t.id);
    kopf("Thema · " + t.teil, t.titel);
    const w = inhalt();
    const T = THEMEN(), i = T.indexOf(t);

    const k = el("div", "ln-karte ln-kopf");
    k.appendChild(el("div", "ln-eyebrow", t.teil + " · " + (t.katalog || "")));
    k.appendChild(el("h2", null, t.titel));
    k.appendChild(el("p", "ln-ru-titel", t.ru));
    const zt = zahlen((t.quiz || []).map(q => ({ id: q.id })));
    const st = el("div", "ln-knoepfe");
    if ((t.quiz || []).length) {
      const q = el("button", "btn primary", "Quiz (" + t.quiz.length + " Fragen)"); q.type = "button";
      q.onclick = () => quizStarten(runde({ themen: [t.id], anzahl: t.quiz.length }), t.titel, t.id);
      st.appendChild(q);
    }
    const karten = (t.karten || []).filter(id => (root.SATZ_POOL || []).some(x => x.id === id));
    if (karten.length && root.GENSATZ) {
      const s = el("button", "btn", "Kurzfragen schreiben (" + karten.length + ")"); s.type = "button";
      s.onclick = () => root.GENSATZ.starten(karten, { modus: "schreiben", anzahl: karten.length });
      st.appendChild(s);
    }
    const tr = trainerKnopf(t.trainer);
    if (tr) st.appendChild(tr);
    k.appendChild(st);
    if (zt.richtig + zt.falsch > 0) k.appendChild(el("p", "ln-zahlen", zt.richtig + " von " + zt.gesamt + " Quizfragen richtig" + (zt.falsch ? " · " + zt.falsch + " falsch" : "")));
    w.appendChild(k);

    if (t.kurzRu) {
      const r = el("div", "ln-karte ln-rubox");
      r.appendChild(el("h3", null, "Коротко по-русски"));
      r.appendChild(el("p", null, t.kurzRu));
      w.appendChild(r);
    }

    const e = el("div", "ln-karte");
    e.appendChild(el("h3", null, "Kurz erklärt"));
    const dl = el("dl", "ln-punkte");
    (t.punkte || []).forEach(([b, ru, text]) => {
      const dt = el("dt");
      dt.appendChild(el("b", null, b));
      if (ru) dt.appendChild(el("span", "ln-ru", ru));
      dl.appendChild(dt);
      dl.appendChild(el("dd", null, text));
    });
    e.appendChild(dl);
    w.appendChild(e);

    if (t.tabelle) {
      const tb = el("div", "ln-karte");
      tb.appendChild(el("h3", null, t.tabelle.titel || "Überblick"));
      const sc = el("div", "ln-tab-scroll");
      const table = el("table", "ln-tab");
      const thead = el("thead"), tr0 = el("tr");
      t.tabelle.kopf.forEach(h => tr0.appendChild(el("th", null, h)));
      thead.appendChild(tr0); table.appendChild(thead);
      const tbody = el("tbody");
      t.tabelle.zeilen.forEach(z => { const tr1 = el("tr"); z.forEach((c, j) => tr1.appendChild(el(j === 0 ? "th" : "td", null, c))); tbody.appendChild(tr1); });
      table.appendChild(tbody); sc.appendChild(table); tb.appendChild(sc);
      w.appendChild(tb);
    }

    (t.code || []).forEach(c => {
      const cb = el("div", "ln-karte");
      cb.appendChild(el("h3", null, c.titel));
      cb.appendChild(el("pre", "ln-code", c.text));
      w.appendChild(cb);
    });

    if (t.merke) {
      const m = el("div", "ln-merke");
      m.appendChild(el("b", null, "Merke: "));
      m.appendChild(document.createTextNode(t.merke));
      w.appendChild(m);
    }

    if ((t.links || []).length) {
      const l = el("div", "ln-karte ln-links");
      l.appendChild(el("h3", null, "Nachlesen auf ap2.online"));
      l.appendChild(el("p", "ln-klein", "Externe Seite, braucht Internet. Gut zum Vertiefen — geübt wird hier."));
      const ul = el("ul");
      t.links.forEach(([url, txt]) => {
        const li = el("li"); const a = el("a", null, txt + " ↗");
        a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
        li.appendChild(a); ul.appendChild(li);
      });
      l.appendChild(ul);
      w.appendChild(l);
    }

    const nav = el("div", "ln-nav");
    const zur = el("button", "btn ghost", "← Alle Themen"); zur.type = "button"; zur.onclick = () => zeige({ art: "liste" });
    nav.appendChild(zur);
    if (i < T.length - 1) {
      const n = el("button", "btn ghost", T[i + 1].titel + " →"); n.type = "button"; n.onclick = () => oeffnen(T[i + 1].id);
      nav.appendChild(n);
    }
    w.appendChild(nav);
  }

  function trainerKnopf(art) {
    const mk = (txt, fn) => { const b = el("button", "btn ghost", txt); b.type = "button"; b.onclick = fn; return b; };
    if (art === "algo" && root.GENALGO) return mk("Trainer: Sortieren & Suchen", () => root.GENALGO.oeffnen());
    if (art === "sql" && root.GENSQL) return mk("SQL-Trainer", () => root.GENSQL.oeffnen());
    if (art === "pseudo" && root.GENPSEUDO && root.GENSTART) return mk("Pseudocode-Trainer", () => {
      root.schirm && root.schirm("scStart");
      if (root.renderStart) root.renderStart();
      setTimeout(() => root.GENSTART.oeffneBlock("pseudo"), 60);
    });
    return null;
  }

  /* ------------------------------------------------------------- Quiz */
  function quizStarten(fragen, titel, themaId) {
    if (!fragen || !fragen.length) return;
    LAUF = { titel, themaId: themaId || null, fragen, i: 0, antworten: [], reihen: {}, gewaehlt: new Set(), fertig: false };
    fragen.forEach(q => { LAUF.reihen[q.id] = mische(q.o.length); });
    zeige({ art: "quiz" });
  }

  function zeichneQuiz() {
    const L = LAUF;
    if (L.i >= L.fragen.length) return zeichneEnde();
    const q = L.fragen[L.i];
    kopf("Quiz · Frage " + (L.i + 1) + " von " + L.fragen.length, L.titel);
    const w = inhalt();
    const leiste = el("div", "ln-leiste");
    leiste.appendChild(el("span", "ln-l-nr", (L.i + 1) + " / " + L.fragen.length));
    const bar = el("span", "ln-l-bar"); const bi = el("i"); bi.style.width = (L.i / L.fragen.length * 100) + "%"; bar.appendChild(bi);
    leiste.appendChild(bar);
    leiste.appendChild(el("span", "ln-l-ok", L.antworten.filter(a => a.ok).length + " ✓"));
    w.appendChild(leiste);

    const k = el("div", "ln-karte ln-frage");
    k.appendChild(el("div", "ln-eyebrow", q.themaTitel || ""));
    k.appendChild(el("p", "ln-klein", "Квиз проверяет узнавание ответа. Самостоятельное применение проверяй в заданиях без вариантов."));
    const mehr = (q.r || []).length > 1;
    k.appendChild(el("p", "ln-f-text", q.f));
    if (q.code) k.appendChild(el("pre", "ln-code", q.code));
    if (mehr) k.appendChild(el("p", "ln-klein", "Mehrere Antworten sind richtig — alle ankreuzen, dann „Prüfen“."));
    const antwort = L.antworten[L.i];
    const ops = el("div", "ln-optionen");
    L.reihen[q.id].forEach(idx => {
      const b = el("button", "ln-option"); b.type = "button";
      b.appendChild(el("span", "ln-o-mark", mehr ? "☐" : "○"));
      b.appendChild(el("span", "ln-o-text", q.o[idx]));
      if (antwort) {
        b.disabled = true;
        const richtig = q.r.indexOf(idx) >= 0, gew = antwort.gewaehlt.indexOf(idx) >= 0;
        if (richtig) b.classList.add("richtig");
        if (gew && !richtig) b.classList.add("falsch");
        if (gew) b.querySelector(".ln-o-mark").textContent = mehr ? "☑" : "●";
      } else {
        if (L.gewaehlt.has(idx)) { b.classList.add("an"); b.querySelector(".ln-o-mark").textContent = "☑"; }
        b.onclick = () => {
          if (mehr) {
            if (L.gewaehlt.has(idx)) L.gewaehlt.delete(idx); else L.gewaehlt.add(idx);
            zeichneQuiz();
          } else beantworten([idx]);
        };
      }
      ops.appendChild(b);
    });
    k.appendChild(ops);

    if (!antwort && mehr) {
      const p = el("button", "btn primary", "Prüfen"); p.type = "button";
      p.disabled = L.gewaehlt.size === 0;
      p.onclick = () => beantworten(Array.from(L.gewaehlt));
      k.appendChild(p);
    }
    if (antwort) {
      const fb = el("div", "ln-feedback " + (antwort.ok ? "gut" : "schlecht"));
      fb.appendChild(el("b", null, antwort.ok ? "Richtig." : "Leider falsch."));
      if (!antwort.ok) fb.appendChild(el("p", null, "Richtig ist: " + q.r.map(i => q.o[i]).join(" · ")));
      if (q.w) fb.appendChild(el("p", null, q.w));
      k.appendChild(fb);
      const weiter = el("button", "btn primary ln-weiter", L.i + 1 < L.fragen.length ? "Weiter →" : "Ergebnis ansehen"); weiter.type = "button";
      weiter.onclick = () => { L.i++; L.gewaehlt = new Set(); zeichneQuiz(); root.scrollTo(0, 0); };
      k.appendChild(weiter);
      setTimeout(() => { try { weiter.focus({ preventScroll: true }); } catch (e) { } }, 30);
    }
    w.appendChild(k);
    const ab = el("button", "ln-link", "Quiz beenden"); ab.type = "button";
    ab.onclick = () => { L.fragen = L.fragen.slice(0, L.antworten.length); L.i = L.antworten.length; zeichneQuiz(); };
    if (L.antworten.length) w.appendChild(ab);
  }

  function beantworten(gewaehlt) {
    const L = LAUF, q = L.fragen[L.i];
    if (L.antworten[L.i]) return;
    const ok = antwortEintragen(q.id, gewaehlt);
    L.antworten[L.i] = { ok, gewaehlt: gewaehlt.slice() };
    zeichneQuiz();
  }

  function zeichneEnde() {
    const L = LAUF;
    const n = L.antworten.length, r = L.antworten.filter(a => a.ok).length;
    kopf("Quiz · Ergebnis", L.titel);
    const w = inhalt();
    const k = el("div", "ln-karte ln-ende");
    k.appendChild(el("h2", null, r + " von " + n + " richtig"));
    const q = n ? r / n : 0;
    k.appendChild(el("p", "ln-info", !n ? "Keine Frage beantwortet." : q === 1 ? "Alle Antworten erkannt. Prüfe als Nächstes, ob du den Inhalt ohne Auswahl erklären oder anwenden kannst." :
      q >= 0.7 ? "Gut. Die falschen Fragen stehen unten und kommen in „Fehler wiederholen“." :
      "Lies das Thema noch einmal und mach die falschen Fragen gleich nochmal."));
    const st = el("div", "ln-knoepfe");
    const falschIds = L.fragen.filter((x, i) => L.antworten[i] && !L.antworten[i].ok).map(x => x.id);
    if (falschIds.length) {
      const b = el("button", "btn primary", "Falsche sofort nochmal (" + falschIds.length + ")"); b.type = "button";
      b.onclick = () => quizStarten(runde({ ids: falschIds, anzahl: falschIds.length }), "Nochmal: " + L.titel, L.themaId);
      st.appendChild(b);
    }
    if (L.themaId) {
      const b2 = el("button", "btn", "Zurück zum Thema"); b2.type = "button"; b2.onclick = () => oeffnen(L.themaId);
      st.appendChild(b2);
      const t = thema(L.themaId);
      const karten = t ? (t.karten || []).filter(id => (root.SATZ_POOL || []).some(x => x.id === id)) : [];
      if (karten.length && root.GENSATZ) {
        const b4 = el("button", "btn", "Jetzt Kurzfragen schreiben"); b4.type = "button";
        b4.onclick = () => root.GENSATZ.starten(karten, { modus: "schreiben", anzahl: Math.min(6, karten.length) });
        st.appendChild(b4);
      }
    }
    const b3 = el("button", "btn ghost", "Alle Themen"); b3.type = "button"; b3.onclick = () => zeige({ art: "liste" });
    st.appendChild(b3);
    k.appendChild(st);
    w.appendChild(k);

    if (falschIds.length) {
      const f = el("div", "ln-karte");
      f.appendChild(el("h3", null, "Das war falsch"));
      L.fragen.forEach((x, i) => {
        const a = L.antworten[i];
        if (!a || a.ok) return;
        const box = el("div", "ln-fehler");
        box.appendChild(el("p", "ln-f-text", x.f));
        box.appendChild(el("p", "ln-du", "Deine Antwort: " + (a.gewaehlt.map(j => x.o[j]).join(" · ") || "—")));
        box.appendChild(el("p", "ln-soll", "Richtig: " + x.r.map(j => x.o[j]).join(" · ")));
        if (x.w) box.appendChild(el("p", "ln-klein", x.w));
        f.appendChild(box);
      });
      w.appendChild(f);
    }
    if (root.GENWIEDER && root.GENWIEDER.block) { try { root.GENWIEDER.block(); } catch (e) { } }
  }

  /* ======================================================================
     Fehler wiederholen: falsch beantwortete Quizfragen als eigene Quelle
     ====================================================================== */
  const WIEDER = {
    key: "lernen", name: "Themen-Quiz", rang: 6,
    sammeln() {
      return alleFragen().filter(q => { const s = ST["q:" + q.id]; return s && !s.wiederFertig && (s.wiederNoetig || !s.ok); }).map(q => ({
        id: "lq:" + q.id, verlust: 1, q,
        titel: q.f, wo: "Quiz · " + (q.themaTitel || ""), punkte: "falsch beantwortet"
      }));
    },
    frage(x, ziel) {
      const q = x.q;
      ziel.appendChild(el("p", "wd-text", q.f));
      if (q.code) ziel.appendChild(el("pre", "ln-code", q.code));
      const ul = el("ul", "ln-wd-liste");
      q.o.forEach(o => ul.appendChild(el("li", null, o)));
      ziel.appendChild(ul);
    },
    loesung(x, ziel) {
      const q = x.q;
      ziel.appendChild(el("div", "wd-text", "Richtig: " + q.r.map(i => q.o[i]).join(" · ")));
      if (q.w) ziel.appendChild(el("p", "wd-sub", q.w));
    },
    einordnen(x, wert, wiederStand) {
      const s = ST["q:" + x.q.id];
      if (!s) return;
      if (wert === "gut" && wiederStand && wiederStand.raus) s.wiederFertig = Date.now();
      else { s.wiederNoetig = true; delete s.wiederFertig; }
      sichern();
      if (root.GENLERNSTAND) root.GENLERNSTAND.record({ topic: x.q.thema, source: "quiz-wieder", task: x.q.id,
        correct: wert === "gut" ? 1 : wert === "halb" ? 0.5 : 0, max: 1, support: "loesung", kind: "selbst", answers: { wert } });
    },
    oeffnen(x) { quizStarten([x.q], "Einzelfrage", x.q.thema); }
  };
  root.GENWIEDER_EXTRA = (root.GENWIEDER_EXTRA || []).filter(p => p.key !== WIEDER.key);
  root.GENWIEDER_EXTRA.push(WIEDER);

  /* ======================================================================
     Einhängen
     ====================================================================== */
  function einhaengen() {
    const alt = root.renderStart;
    if (typeof alt === "function" && !alt.__ln) {
      const neu = function () {
        const r = alt.apply(this, arguments);
        try { setTimeout(box, 0); } catch (e) { console.error("Lernen:", e); }
        return r;
      };
      neu.__ln = true; root.renderStart = neu;
    }
    const altS = root.schirm;
    if (typeof altS === "function" && !altS.__ln) {
      const neu = function (name) {
        if (name === "scLernen") { const hs = history.state || {}; zeige(hs.seite === "scLernen" && hs.ln ? hs.ln : VIEW, true); return; }
        const s = $("scLernen");
        if (s && !s.hidden) s.hidden = true;
        return altS.apply(this, arguments);
      };
      neu.__ln = true; root.schirm = neu;
    }
    /* Zurück-Taste innerhalb der Themen: Übersicht ↔ Thema ↔ Quiz */
    root.addEventListener("popstate", ev => {
      const st = ev.state || {};
      const s = $("scLernen");
      if (st.seite !== "scLernen" || !s || s.hidden) return;
      zeige(st.ln || { art: "liste" }, true);
    });
    setTimeout(box, 360);
  }
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }

  const api = { THEMEN, alleFragen, frage, pruefe, runde, zahlen, standVon, falsche, box, oeffnen, quizStarten,
                stand: () => ST, antwortEintragen, WIEDER };
  root.GENLERNEN = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
