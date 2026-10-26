/* ============================================================================
   gen/uebung-gen.js — Übungen mit neuen Zahlen bei jedem Versuch
   ----------------------------------------------------------------------------
   Ein Motor für mehrere Trainer (Rechen-Trainer AP2, Tickets, CPS, WiSo …).
   Jeder Trainer meldet sich als „Sammlung“ an:

     GENUEBGEN.sammlung({
       id: "rechnen", titel: "Rechen-Trainer AP2", ru: "…", topic: "rechnen",
       kachel: { name, unten, ikon }, gruppen: [{ id, titel, ru }],
       (Aufgabe darf zusätzlich bild: "<svg …>" liefern — vom Generator gebaut, z. B. ein UML-Diagramm)
       aufgaben: [{ id, gruppe, titel, ru, gen: R => ({
         situation?, frage, gegeben?: [[Name, Wert]], felder: [Feld], weg: [Schritt], ru?, merke? }) }]
     })
     Feld = { id, label, soll, art: "zahl" | "wahl", einheit?, tol? (absolut), rel? (relativ),
              optionen? (bei wahl: [Text]; soll = Index), hinweis? }

   R ist ein Zufallsgenerator mit Startwert (seed): dieselbe Zahl → dieselbe
   Aufgabe. So kann „Fehler wiederholen“ genau diese Variante wieder öffnen.
     R.int(a, b) · R.pick(liste) · R.schritt(a, b, s) · R.mischen(liste) · R.seed

   Prüfen: Zahlen mit Komma oder Punkt, Tausenderpunkt (1.234,5), Einheit
   dahinter egal. Toleranz je Feld (tol absolut, rel relativ), sonst ±0,01 bzw.
   0,5 % bei großen Zahlen.
   Journal: GENLERNSTAND.record({ topic, source: "gen:<sammlung>", task: "<aufgabe>:<seed>",
            kind: "auto", support, snapshot: { type: "gen", … } }).
   Speicher ap2:genueb = { "<sammlung>": { "<aufgabe>": { n, ok, t } } }.
   Bildschirm scGenUeb (ein Bildschirm für alle Sammlungen).
   ========================================================================== */
"use strict";
(function (root) {
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const SK = "ap2:genueb";
  const SAMMLUNGEN = [];

  /* ======================================================================
     Reine Funktionen
     ====================================================================== */
  function zufall(seed) {
    let a = (seed >>> 0) || 1;
    const next = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const R = {
      seed: seed >>> 0,
      zahl: next,
      int: (x, y) => x + Math.floor(next() * (y - x + 1)),
      pick: l => l[Math.floor(next() * l.length)],
      schritt: (x, y, s) => x + s * Math.floor(next() * (Math.floor((y - x) / s) + 1)),
      mischen: l => { const c = l.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; }
    };
    return R;
  }
  const neuerSeed = () => (Math.floor(Math.random() * 0x7fffffff) + 1);

  /** Eingabe → Zahl oder null. "1.234,5" "1234.5" "1,5 GiB" "12 %" "-3" "≈ 4" */
  function zahlLesen(s, soll) {
    let t = String(s == null ? "" : s).trim().replace(/[≈~]/g, "").replace(/\s+/g, " ").replace(/[−–—]/g, "-");
    const m = /^[-+]?[\d.,' ]*\d/.exec(t);
    if (!m) return null;
    t = m[0].replace(/['\s]/g, "");
    const punkte = (t.match(/\./g) || []).length, kommas = (t.match(/,/g) || []).length;
    if (punkte && kommas) t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
    else if (kommas) t = kommas > 1 ? t.replace(/,/g, "") : t.replace(",", ".");
    else if (punkte > 1) t = t.replace(/\./g, "");
    else if (punkte === 1 && /^[-+]?\d{1,3}\.\d{3}$/.test(t) && soll != null && Math.abs(soll) >= 1000) t = t.replace(".", "");
    const v = Number(t);
    return Number.isFinite(v) ? v : null;
  }
  function feldOk(f, eingabe) {
    if (f.art === "wahl") return eingabe !== "" && eingabe != null && Number(eingabe) === f.soll;
    const v = zahlLesen(eingabe, f.soll);
    if (v == null) return false;
    const tol = f.tol != null ? f.tol : Math.max(0.01, Math.abs(f.soll) * (f.rel != null ? f.rel : 0.005));
    return Math.abs(v - f.soll) <= tol + 1e-9;
  }
  function bewerten(aufgabe, antworten) {
    const a = antworten || {};
    const felder = aufgabe.felder.map(f => ({ id: f.id, ok: feldOk(f, a[f.id]), leer: a[f.id] == null || String(a[f.id]).trim() === "" }));
    return { felder, correct: felder.filter(x => x.ok).length, max: felder.length };
  }
  /** Zahl schön für die Anzeige: deutsches Komma, Tausenderpunkt, höchstens n Nachkommastellen */
  function fmt(x, n) {
    if (typeof x !== "number" || !Number.isFinite(x)) return String(x);
    const d = n == null ? 2 : n;
    const r = Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
    const [g, k] = Math.abs(r).toFixed(d).split(".");
    const ganz = g.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const nach = (k || "").replace(/0+$/, "");
    return (r < 0 ? "−" : "") + ganz + (nach ? "," + nach : "");
  }
  const runde = (x, n) => Math.round(x * Math.pow(10, n || 0)) / Math.pow(10, n || 0);

  /** Eine Aufgabe bauen (mit Prüfung der Form) */
  function bauen(sammlung, aufgabeId, seed) {
    const s = typeof sammlung === "string" ? SAMMLUNGEN.find(x => x.id === sammlung) : sammlung;
    if (!s) throw new Error("Unbekannte Sammlung: " + sammlung);
    const a = s.aufgaben.find(x => x.id === aufgabeId);
    if (!a) throw new Error("Unbekannte Aufgabe: " + aufgabeId);
    const sd = seed || neuerSeed();
    const x = a.gen(zufall(sd), { fmt, runde });
    if (!x || !x.frage || !Array.isArray(x.felder) || !x.felder.length) throw new Error("Aufgabe " + a.id + ": frage/felder fehlen");
    x.felder.forEach((f, i) => {
      if (!f.id) f.id = "f" + (i + 1);
      if (f.art === "wahl" ? !(Array.isArray(f.optionen) && Number.isInteger(f.soll) && f.soll >= 0 && f.soll < f.optionen.length) : !Number.isFinite(f.soll))
        throw new Error("Aufgabe " + a.id + ": Feld " + f.id + " ungültig");
    });
    return Object.assign({ sammlung: s.id, aufgabe: a.id, titel: a.titel, seed: sd, weg: [], gegeben: [] }, x);
  }

  function sammlung(def) {
    if (!def || !def.id || !Array.isArray(def.aufgaben)) throw new Error("Sammlung braucht id und aufgaben");
    const alt = SAMMLUNGEN.findIndex(x => x.id === def.id);
    if (alt >= 0) SAMMLUNGEN.splice(alt, 1, def); else SAMMLUNGEN.push(def);
    return def;
  }

  const api = { SK, zufall, zahlLesen, feldOk, bewerten, fmt, runde, bauen, sammlung, sammlungen: () => SAMMLUNGEN.slice() };

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  if (hatDom) {
    const $ = id => document.getElementById(id);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const knopf = (text, fn, cls) => { const b = el("button", "btn" + (cls ? " " + cls : ""), text); b.type = "button"; b.onclick = fn; return b; };
    const lies = () => { try { const v = JSON.parse(root.localStorage.getItem(SK)); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; } catch (e) { return null; } };
    function merken(sid, aid, ok) {
      const st = lies();
      if (st === null) return false;           /* kaputte Daten nicht überschreiben */
      const s = st[sid] = st[sid] || {}, e = s[aid] = s[aid] || { n: 0, ok: 0 };
      e.n++; if (ok) e.ok++; e.t = Date.now();
      try { root.localStorage.setItem(SK, JSON.stringify(st)); return true; } catch (x) { return false; }
    }
    let ANSICHT = { sid: null, aid: null, seed: null };
    let LAUF = null;   /* { a: gebaute Aufgabe, antworten, hilfe, loesung, geprueft } */

    function screen() {
      let s = $("scGenUeb");
      if (s) return s;
      s = el("div", "seite gu-page"); s.id = "scGenUeb"; s.hidden = true;
      const w = el("div", "gu-wrap"); w.id = "guInhalt"; s.appendChild(w);
      const start = $("scStart"); start.parentNode.insertBefore(s, start.nextSibling);
      return s;
    }
    function oeffnen(sid, aid, seed, ausVerlauf) {
      const S = SAMMLUNGEN.find(x => x.id === sid) || SAMMLUNGEN[0];
      if (!S) return;
      ANSICHT = { sid: S.id, aid: aid || null, seed: seed || null };
      const s = screen();
      document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
      ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { if ($(k)) $(k).hidden = true; });
      if ($("kopfTitel")) $("kopfTitel").hidden = false;
      if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · " + (S.eyebrow || "Übung");
      if ($("kTitel")) $("kTitel").textContent = S.titel;
      if (!ausVerlauf) {
        try {
          if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
          history.pushState({ ihk: 1, seite: "scGenUeb", gu: ANSICHT }, "");
        } catch (e) { }
      }
      if (ANSICHT.aid) aufgabeStarten(S, ANSICHT.aid, ANSICHT.seed); else liste(S);
      if (root.GENZURUECK) root.GENZURUECK.knopfPflegen();
      root.scrollTo(0, 0);
    }

    function liste(S) {
      LAUF = null;
      const w = $("guInhalt"); w.replaceChildren();
      const st = lies() || {}, my = st[S.id] || {};
      const c = el("section", "gu-card");
      c.appendChild(el("h2", null, S.titel));
      if (S.ru) c.appendChild(el("p", "gu-muted", S.ru));
      const akt = el("div", "gu-akt");
      akt.appendChild(knopf("Случайная задача", () => { const a = S.aufgaben[Math.floor(Math.random() * S.aufgaben.length)]; oeffnen(S.id, a.id); }, "primary"));
      c.appendChild(akt);
      w.appendChild(c);
      (S.gruppen || [{ id: null, titel: "" }]).forEach(g => {
        const auf = S.aufgaben.filter(a => !g.id || a.gruppe === g.id);
        if (!auf.length) return;
        const gc = el("section", "gu-card gu-gruppe");
        const h = el("h3", null, g.titel || "Aufgaben"); h.lang = "de"; gc.appendChild(h);
        if (g.ru) gc.appendChild(el("p", "gu-muted", g.ru));
        auf.forEach(a => {
          const e = my[a.id];
          const b = el("button", "gu-zeile"); b.type = "button";
          const t = el("span", "gu-z-titel", a.titel); t.lang = "de"; b.appendChild(t);
          if (a.ru) b.appendChild(el("span", "gu-z-ru", a.ru));
          b.appendChild(el("span", "gu-z-stand" + (e && e.ok ? " ok" : ""), e ? "решено верно " + e.ok + " из " + e.n : "ещё не решала"));
          b.onclick = () => oeffnen(S.id, a.id);
          gc.appendChild(b);
        });
        w.appendChild(gc);
      });
    }

    function aufgabeStarten(S, aid, seed) {
      let a;
      try { a = bauen(S, aid, seed); } catch (e) { const w = $("guInhalt"); w.replaceChildren(el("p", "gu-alert", e.message)); return; }
      LAUF = { a, S, antworten: {}, hilfe: false, loesung: false, geprueft: null };
      ANSICHT.seed = a.seed;
      try { if (history.state && history.state.seite === "scGenUeb") history.replaceState(Object.assign({}, history.state, { gu: ANSICHT }), ""); } catch (e) { }
      zeichneAufgabe();
    }
    function support() { return LAUF.loesung ? "loesung" : LAUF.hilfe ? "hilfe" : "selbst"; }

    function zeichneAufgabe() {
      const { a, S } = LAUF;
      const w = $("guInhalt"); w.replaceChildren();
      const c = el("section", "gu-card");
      const kopf = el("div", "gu-kopf");
      kopf.appendChild(knopf("← Все задачи", () => oeffnen(S.id)));
      kopf.appendChild(el("span", "gu-muted gu-seed", "вариант " + a.seed));
      c.appendChild(kopf);
      const h = el("h2", null, a.titel); h.lang = "de"; c.appendChild(h);
      if (a.situation) { const p = el("p", "gu-situation", a.situation); p.lang = "de"; c.appendChild(p); }
      if (a.gegeben && a.gegeben.length) {
        const dl = el("dl", "gu-gegeben"); dl.lang = "de";
        a.gegeben.forEach(([k, v]) => { dl.appendChild(el("dt", null, k)); dl.appendChild(el("dd", null, v)); });
        c.appendChild(dl);
      }
      /* bild: SVG, das der Generator selbst erzeugt (keine Eingaben von außen) */
      if (a.bild) { const bx = el("div", "gu-bild"); bx.innerHTML = a.bild; c.appendChild(bx); }
      const fr = el("p", "gu-frage", a.frage); fr.lang = "de"; c.appendChild(fr);
      const form = el("div", "gu-felder");
      a.felder.forEach(f => {
        const lab = el("label", "gu-feld");
        const t = el("span", "gu-f-label", f.label); t.lang = "de"; lab.appendChild(t);
        let inp;
        if (f.art === "wahl") {
          inp = el("select");
          inp.appendChild(el("option", null, "— выбрать —")).value = "";
          f.optionen.forEach((o, i) => { const op = el("option", null, o); op.value = String(i); op.lang = "de"; inp.appendChild(op); });
        } else {
          inp = el("input"); inp.type = "text"; inp.inputMode = "decimal"; inp.autocomplete = "off";
        }
        inp.value = LAUF.antworten[f.id] != null ? LAUF.antworten[f.id] : "";
        inp.disabled = !!LAUF.geprueft;
        inp.oninput = inp.onchange = () => { LAUF.antworten[f.id] = inp.value; };
        const zeile = el("span", "gu-f-zeile"); zeile.appendChild(inp);
        if (f.einheit) zeile.appendChild(el("span", "gu-einheit", f.einheit));
        if (LAUF.geprueft) {
          const ok = LAUF.geprueft.felder.find(x => x.id === f.id).ok;
          lab.classList.add(ok ? "ok" : "falsch");
          zeile.appendChild(el("span", "gu-marke", ok ? "✓" : "✗"));
        }
        lab.appendChild(zeile);
        if (LAUF.geprueft && !LAUF.geprueft.felder.find(x => x.id === f.id).ok)
          lab.appendChild(el("span", "gu-soll", "Richtig: " + (f.art === "wahl" ? f.optionen[f.soll] : fmt(f.soll, f.stellen != null ? f.stellen : 2) + (f.einheit ? " " + f.einheit : ""))));
        if (f.hinweis && !LAUF.geprueft) lab.appendChild(el("span", "gu-muted", f.hinweis));
        form.appendChild(lab);
      });
      c.appendChild(form);
      if (LAUF.hilfe && !LAUF.geprueft && a.weg.length) {
        const hb = el("div", "gu-hilfe"); hb.appendChild(el("b", null, "Подсказка: ")); const t = el("span", null, a.weg[0]); t.lang = "de"; hb.appendChild(t); c.appendChild(hb);
      }
      const akt = el("div", "gu-akt");
      if (!LAUF.geprueft) {
        akt.appendChild(knopf("Проверить", pruefen, "primary"));
        if (!LAUF.hilfe && a.weg.length > 1) akt.appendChild(knopf("Подсказка", () => { LAUF.hilfe = true; zeichneAufgabe(); }));
        akt.appendChild(knopf("Показать решение", () => { LAUF.loesung = true; pruefen(); }, "ghost"));
      } else {
        akt.appendChild(knopf("Новые числа", () => aufgabeStarten(S, a.aufgabe), "primary"));
        akt.appendChild(knopf("Другая задача", () => { const l = S.aufgaben.filter(x => x.id !== a.aufgabe); const n = l[Math.floor(Math.random() * l.length)] || S.aufgaben[0]; aufgabeStarten(S, n.id); }));
      }
      c.appendChild(akt);
      w.appendChild(c);
      if (LAUF.geprueft) {
        const r = LAUF.geprueft;
        const e = el("section", "gu-card gu-ergebnis" + (r.correct === r.max ? " ok" : ""));
        e.appendChild(el("h3", null, (r.correct === r.max ? "✓ Верно" : "Верно " + r.correct + " из " + r.max) + (LAUF.loesung ? " · с решением" : LAUF.hilfe ? " · с подсказкой" : "")));
        if (a.weg.length) {
          e.appendChild(el("h4", null, "Lösungsweg"));
          const ol = el("ol", "gu-weg"); ol.lang = "de";
          a.weg.forEach(s => ol.appendChild(el("li", null, s)));
          e.appendChild(ol);
        }
        if (a.ru) e.appendChild(el("p", "gu-ru", a.ru));
        if (a.merke) { const m = el("p", "gu-merke"); m.appendChild(el("b", null, "Merke: ")); const t = el("span", null, a.merke); t.lang = "de"; m.appendChild(t); e.appendChild(m); }
        if (r.gespeichert === false) e.appendChild(el("p", "gu-alert", "Результат не сохранён на устройстве (память недоступна)."));
        w.appendChild(e);
      }
    }

    function pruefen() {
      if (!LAUF || LAUF.geprueft) return;
      const { a, S } = LAUF;
      const r = bewerten(a, LAUF.antworten);
      if (LAUF.loesung && r.felder.every(x => x.leer)) {
        /* nur angesehen, nichts eingegeben: kein Versuch fürs Journal */
        LAUF.geprueft = Object.assign(r, { nurAngesehen: true });
        zeichneAufgabe(); return;
      }
      const sup = support();
      r.gespeichert = merken(S.id, a.aufgabe, r.correct === r.max && sup === "selbst");
      if (root.GENLERNSTAND) {
        try {
          root.GENLERNSTAND.record({ topic: S.topic || S.id, source: "gen:" + S.id, task: a.aufgabe + ":" + a.seed, correct: r.correct, max: r.max,
            support: sup, kind: "auto", answers: Object.assign({}, LAUF.antworten),
            snapshot: { type: "gen", sammlung: S.id, aufgabe: a.aufgabe, seed: a.seed, title: a.titel,
              question: [a.situation, (a.gegeben || []).map(([k, v]) => k + ": " + v).join("\n"), a.frage].filter(Boolean).join("\n"),
              solution: a.felder.map(f => f.label + ": " + (f.art === "wahl" ? f.optionen[f.soll] : fmt(f.soll, f.stellen != null ? f.stellen : 2) + (f.einheit ? " " + f.einheit : ""))).join("\n") + (a.weg.length ? "\n\n" + a.weg.join("\n") : ""),
              explanation: a.ru || "" } });
        } catch (e) { }
      }
      LAUF.geprueft = r;
      zeichneAufgabe();
    }

    function hook() {
      const alt = root.schirm;
      if (typeof alt === "function" && !alt.__gu) {
        const neu = function (name) {
          if (name === "scGenUeb") { const st = (history.state && history.state.gu) || ANSICHT; oeffnen(st.sid, st.aid, st.seed, true); return; }
          const s = $("scGenUeb"); if (s) s.hidden = true;
          return alt.apply(this, arguments);
        };
        neu.__gu = true; root.schirm = neu;
      }
      root.addEventListener("popstate", e => { const st = e.state || {}; if (st.seite === "scGenUeb" && st.gu) oeffnen(st.gu.sid, st.gu.aid, st.gu.seed, true); });
    }
    api.oeffnen = (sid, aid, seed) => oeffnen(sid, aid, seed);
    api.stand = () => lies() || {};
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  }

  root.GENUEBGEN = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
