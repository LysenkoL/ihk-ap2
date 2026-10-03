/* ============================================================================
   gen/algo.js — Sortieren und Suchen Schritt für Schritt
   ----------------------------------------------------------------------------
   Prüfungskatalog AP2, Entwicklung 18: lineare und binäre Suche, Bubble,
   Selection und Insertion Sort. Die typische GA2-Frage lautet „Geben Sie
   den Inhalt des Arrays nach jedem Durchlauf an“ oder „Geben Sie links,
   rechts und mitte für jeden Schritt der binären Suche an“.

   Genau das wird hier geübt — jedes Mal mit neuen Zahlen:
     • Sortieren: Feld nach jedem Durchlauf eingeben (antippen zum Tauschen
       oder eintippen), sofort geprüft, mit Vergleichen und Tauschen.
     • Binäre Suche: links, rechts, mitte je Schritt, dann entscheiden.
     • Lineare Suche: Wie viele Elemente werden geprüft?

   Speicher: ap2:algo = { "<modus>": { n, ok, fehler, t } }
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const SK = "ap2:algo", SK_EIN = "ap2:algo:ui";
  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  let ST = lies(SK, {}) || {};
  let EIN = Object.assign({ n: 6, auf: true, eingabe: "tippen" }, lies(SK_EIN, {}) || {});
  const einMerken = () => schreib(SK_EIN, EIN);

  /* ======================================================================
     Algorithmen — liefern die Zustände nach jedem Durchlauf
     ====================================================================== */
  const groesser = (a, b, auf) => auf ? a > b : a < b;

  /** Bubble Sort mit Abbruch: nach jedem Durchlauf der äußeren Schleife */
  function bubble(feld, auf) {
    const a = feld.slice(), n = a.length, out = [];
    for (let i = 0; i < n - 1; i++) {
      let v = 0, t = 0;
      for (let j = 0; j < n - 1 - i; j++) {
        v++;
        if (groesser(a[j], a[j + 1], auf)) { const h = a[j]; a[j] = a[j + 1]; a[j + 1] = h; t++; }
      }
      out.push({ feld: a.slice(), vergleiche: v, tausche: t, fest: { von: n - 1 - i, bis: n - 1 },
        info: t ? "Die " + a[n - 1 - i] + " ist nach hinten gewandert und steht jetzt fest." : "Kein Tausch in diesem Durchlauf → das Feld ist sortiert, Abbruch." });
      if (!t) break;
    }
    return out;
  }

  /** Selection Sort: Minimum (bzw. Maximum) des Rests nach vorn */
  function selection(feld, auf) {
    const a = feld.slice(), n = a.length, out = [];
    for (let i = 0; i < n - 1; i++) {
      let m = i, v = 0;
      for (let j = i + 1; j < n; j++) { v++; if (groesser(a[m], a[j], auf)) m = j; }
      const wert = a[m];
      let t = 0;
      if (m !== i) { const h = a[i]; a[i] = a[m]; a[m] = h; t = 1; }
      out.push({ feld: a.slice(), vergleiche: v, tausche: t, fest: { von: 0, bis: i },
        info: (auf ? "Kleinstes" : "Größtes") + " Element im Rest: " + wert + (m !== i ? " (Index " + m + ") → mit Index " + i + " getauscht." : " — steht schon an Index " + i + ", kein Tausch.") });
    }
    return out;
  }

  /** Insertion Sort: nächstes Element in den sortierten linken Teil einfügen */
  function insertion(feld, auf) {
    const a = feld.slice(), n = a.length, out = [];
    for (let i = 1; i < n; i++) {
      const wert = a[i];
      let j = i - 1, v = 0, s = 0;
      while (j >= 0) {
        v++;
        if (groesser(a[j], wert, auf)) { a[j + 1] = a[j]; j--; s++; }
        else break;
      }
      a[j + 1] = wert;
      out.push({ feld: a.slice(), vergleiche: v, tausche: s, fest: { von: 0, bis: i }, sortiert: true,
        info: s ? "Die " + wert + " wird an Index " + (j + 1) + " eingefügt; " + s + (s === 1 ? " Element rückt" : " Elemente rücken") + " nach rechts."
                : "Die " + wert + " steht schon richtig — nur ein Vergleich, nichts verschoben." });
    }
    return out;
  }

  /** Binäre Suche: Schritte mit links, rechts, mitte, Wert und Entscheidung */
  function binaer(feld, x) {
    const out = [];
    let l = 0, r = feld.length - 1;
    while (l <= r) {
      const m = Math.floor((l + r) / 2), w = feld[m];
      const ent = w === x ? "gefunden" : (w < x ? "rechts" : "links");
      out.push({ links: l, rechts: r, mitte: m, wert: w, entscheidung: ent });
      if (ent === "gefunden") return { schritte: out, gefunden: true, index: m };
      if (ent === "rechts") l = m + 1; else r = m - 1;
    }
    out.push({ links: l, rechts: r, leer: true });
    return { schritte: out, gefunden: false, index: -1 };
  }
  function linear(feld, x) {
    const i = feld.indexOf(x);
    return i >= 0 ? { pruefungen: i + 1, gefunden: true, index: i } : { pruefungen: feld.length, gefunden: false, index: -1 };
  }

  const VERFAHREN = {
    bubble: { name: "Bubble Sort", ru: "сортировка пузырьком", rechne: bubble,
      idee: "Nachbarn vergleichen und tauschen. Nach jedem Durchlauf steht das größte Element hinten fest. Kein Tausch → fertig.",
      code: "für i von 0 bis n − 2\n    getauscht ← falsch\n    für j von 0 bis n − 2 − i\n        wenn a[j] > a[j + 1] dann\n            tausche a[j] und a[j + 1]\n            getauscht ← wahr\n    wenn getauscht = falsch dann beende" },
    selection: { name: "Selection Sort", ru: "сортировка выбором", rechne: selection,
      idee: "Im unsortierten Rest das kleinste Element suchen und an die erste Stelle des Rests tauschen.",
      code: "für i von 0 bis n − 2\n    min ← i\n    für j von i + 1 bis n − 1\n        wenn a[j] < a[min] dann min ← j\n    tausche a[i] und a[min]" },
    insertion: { name: "Insertion Sort", ru: "сортировка вставками", rechne: insertion,
      idee: "Das nächste Element nehmen und links im sortierten Teil an die richtige Stelle schieben.",
      code: "für i von 1 bis n − 1\n    wert ← a[i]\n    j ← i − 1\n    solange j ≥ 0 und a[j] > wert\n        a[j + 1] ← a[j]\n        j ← j − 1\n    a[j + 1] ← wert" },
    binaer: { name: "Binäre Suche", ru: "двоичный поиск",
      idee: "Nur in sortierten Daten: mitte = (links + rechts) DIV 2 prüfen, dann in einer Hälfte weitersuchen.",
      code: "links ← 0;  rechts ← n − 1\nsolange links ≤ rechts\n    mitte ← (links + rechts) DIV 2\n    wenn a[mitte] = x dann gib mitte zurück\n    sonst wenn a[mitte] < x dann links ← mitte + 1\n    sonst rechts ← mitte − 1\ngib −1 zurück" },
    linear: { name: "Lineare Suche", ru: "линейный поиск",
      idee: "Von vorn nach hinten ein Element nach dem anderen prüfen, bis der Wert gefunden ist.",
      code: "für i von 0 bis n − 1\n    wenn a[i] = x dann gib i zurück\ngib −1 zurück" }
  };

  /* ------------------------------------------------------------ Zufall */
  function zufallsFeld(n, sortiert) {
    const s = new Set();
    while (s.size < n) s.add(1 + Math.floor(Math.random() * 98));
    const a = Array.from(s);
    if (sortiert) return a.sort((x, y) => x - y);
    /* nie schon sortiert anfangen */
    if (a.every((v, i) => i === 0 || a[i - 1] < v) || a.every((v, i) => i === 0 || a[i - 1] > v)) { const h = a[0]; a[0] = a[n - 1]; a[n - 1] = h; }
    return a;
  }
  function suchZiel(feld) {
    if (Math.random() < 0.7) return feld[Math.floor(Math.random() * feld.length)];
    for (let k = 0; k < 50; k++) { const x = 1 + Math.floor(Math.random() * 98); if (feld.indexOf(x) < 0) return x; }
    return 99;
  }

  function merken(modus, fehlerfrei, fehler) {
    const s = Object.assign({ n: 0, ok: 0, fehler: 0 }, ST[modus] || {});
    s.n++; if (fehlerfrei) s.ok++; s.fehler += fehler || 0; s.t = Date.now();
    ST[modus] = s; schreib(SK, ST);
  }

  /* Derselbe Prüfweg für Oberfläche und Beobachtung: die eingegebenen
     Zwischenstände werden mit dem berechneten Schritt verglichen. */
  function schrittBewerten(lauf, input, soll, phase) {
    const norm = x => x && !Array.isArray(x) && typeof x === "object"
      ? Object.keys(x).sort().map(k => [k, x[k]]) : x;
    const ok = JSON.stringify(norm(input)) === JSON.stringify(norm(soll));
    const aufgabe = { feld: lauf.feld, x: lauf.x, auf: lauf.auf };
    if (root.GENLERNSTAND) root.GENLERNSTAND.record({ topic: "algo", source: "algo",
      task: lauf.modus + ":" + JSON.stringify(aufgabe) + ":" + (lauf.k || lauf.runde || 0) + ":" + phase,
      correct: ok ? 1 : 0, max: 1, support: lauf.support || "selbst", kind: phase === "entscheidung" ? "recognition" : "auto",
      answers: { input, aufgabe, schritt: lauf.k || lauf.runde || 0, phase } });
    if (!ok && lauf.support !== "loesung") lauf.support = "hilfe";
    return ok;
  }
  function hilfeNutzen(lauf, art) {
    if (lauf.support !== "loesung") lauf.support = art === "loesung" ? "loesung" : "hilfe";
  }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  let A = null;        /* aktuelle Aufgabe */
  let herkunft = "scStart";

  function seite() {
    let s = $("scAlgo");
    if (s) return s;
    s = el("div", "seite al-seite"); s.id = "scAlgo"; s.hidden = true;
    const w = el("div", "al-wrap"); w.id = "algoInhalt";
    s.appendChild(w);
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling);
    else document.body.appendChild(s);
    return s;
  }
  const inhalt = () => { seite(); const w = $("algoInhalt"); w.innerHTML = ""; return w; };

  function sichtbarMachen() {
    const s = seite();
    const vorher = ["scBogen", "scKatalog", "scAzubi", "scWieder", "scGlossar", "scSql", "scSatz", "scLernen"].find(id => $(id) && !$(id).hidden) || "scStart";
    if (vorher !== "scAlgo") herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => { if (e.id !== "scAlgo") e.hidden = true; });
    s.hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    const sk = $("schalterKatalog"); if (sk) sk.hidden = true;
    ["mwUhr", "btnUhr", "mwPunkte"].forEach(id => { const e = $(id); if (e) e.hidden = true; });
    if ($("kEyebrow")) $("kEyebrow").textContent = "GA2 · Katalog Entwicklung 18";
    if ($("kTitel")) $("kTitel").textContent = "Sortieren & Suchen";
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scAlgo", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
  }
  function zeige(art, ausVerlauf) {
    sichtbarMachen();
    if (art === "aufgabe" && A) zeichneAufgabe(); else { A = art === "aufgabe" ? null : A; zeichneWahl(); }
    if (!ausVerlauf) {
      try {
        if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: herkunft }, "");
        history.pushState({ ihk: 1, seite: "scAlgo", al: art || "wahl" }, "", location.hash || "");
      } catch (e) { }
    }
    root.scrollTo(0, 0);
  }
  function oeffnen(modus) { if (modus && VERFAHREN[modus]) starten(modus); else zeige("wahl"); }

  /* ------------------------------------------------------------- Wahl */
  function zeichneWahl() {
    const w = inhalt();
    const k = el("div", "al-karte");
    k.appendChild(el("h2", null, "Sortieren & Suchen — Schritt für Schritt"));
    k.appendChild(el("p", "al-info", "Typische GA2-Aufgabe: „Geben Sie das Array nach jedem Durchlauf an.“ Hier jedes Mal mit neuen Zahlen. " +
      "Jeder Durchlauf wird sofort geprüft, mit Vergleichen, Tauschen und einer kurzen Erklärung."));
    w.appendChild(k);

    const e = el("div", "al-karte");
    e.appendChild(el("h3", null, "Einstellungen fürs Sortieren"));
    const zeile = (titel, werte, aktiv, setze) => {
      const z = el("div", "al-einst");
      z.appendChild(el("span", "al-e-titel", titel));
      const c = el("div", "al-chips");
      werte.forEach(([v, t]) => {
        const b = el("button", "al-chip" + (aktiv === v ? " an" : ""), t); b.type = "button";
        b.onclick = () => { setze(v); einMerken(); zeichneWahl(); };
        c.appendChild(b);
      });
      z.appendChild(c);
      return z;
    };
    e.appendChild(zeile("Feldgröße", [[5, "5"], [6, "6"], [7, "7"], [8, "8"]], EIN.n, v => { EIN.n = v; }));
    e.appendChild(zeile("Reihenfolge", [[true, "aufsteigend"], [false, "absteigend"]], EIN.auf, v => { EIN.auf = v; }));
    e.appendChild(zeile("Eingabe", [["tippen", "antippen & tauschen"], ["schreiben", "Zahlen eintippen"]], EIN.eingabe, v => { EIN.eingabe = v; }));
    w.appendChild(e);

    const g = el("div", "al-gitter");
    Object.keys(VERFAHREN).forEach(key => {
      const V = VERFAHREN[key], s = ST[key];
      const b = el("button", "al-verf"); b.type = "button";
      b.appendChild(el("b", null, V.name));
      b.appendChild(el("span", "al-v-ru", V.ru));
      b.appendChild(el("span", "al-v-idee", V.idee));
      b.appendChild(el("span", "al-v-stand", s ? s.n + "× geübt · " + s.ok + "× fehlerfrei" : "noch nicht geübt"));
      b.onclick = () => starten(key);
      g.appendChild(b);
    });
    w.appendChild(g);
    if (root.GENLERNEN) {
      const t = el("button", "btn ghost", "Zum Thema „Such- und Sortieralgorithmen“ (Erklärung + Quiz)"); t.type = "button";
      t.onclick = () => root.GENLERNEN.oeffnen("algo");
      w.appendChild(t);
    }
  }

  /* ---------------------------------------------------------- Aufgabe */
  function starten(modus) {
    const V = VERFAHREN[modus];
    if (V.rechne) {
      const feld = zufallsFeld(EIN.n, false);
      A = { modus, feld, auf: EIN.auf, schritte: V.rechne(feld, EIN.auf), k: 0, fehler: 0, versuche: 0,
            eingabe: EIN.eingabe, arbeit: EIN.eingabe === "tippen" ? feld.slice() : feld.map(() => null), wahl: null, falschePos: [], fertig: false, gezeigt: 0 };
    } else if (modus === "binaer") {
      const feld = zufallsFeld(EIN.n < 7 ? 11 : 15, true), x = suchZiel(feld);
      A = { modus, feld, x, loesung: binaer(feld, x), k: 0, phase: "werte", fehler: 0, versuche: 0, falsch: {}, fertig: false };
    } else {
      A = { modus, runde: 0, richtig: 0, fehler: 0, neu: true };
      neueLinear();
    }
    zeige("aufgabe");
  }
  function neueLinear() {
    const feld = zufallsFeld(Math.max(7, EIN.n + 2), false), x = suchZiel(feld);
    Object.assign(A, { feld, x, loesung: linear(feld, x), antwort: null });
  }

  function aufgabenKopf(w, titel) {
    const V = VERFAHREN[A.modus];
    const k = el("div", "al-karte");
    const z = el("div", "al-kopfzeile");
    z.appendChild(el("h2", null, V.name));
    const neu = el("button", "btn ghost", "Neue Zahlen"); neu.type = "button"; neu.onclick = () => starten(A.modus);
    const wahl = el("button", "btn ghost", "Verfahren wechseln"); wahl.type = "button"; wahl.onclick = () => { A = null; zeige("wahl"); };
    const knr = el("div", "al-kopfknoepfe"); knr.append(neu, wahl);
    z.appendChild(knr);
    k.appendChild(z);
    k.appendChild(el("p", "al-info", titel));
    const hilfe = el("p", "al-info");
    const hilfeText = () => { hilfe.textContent = A.support === "loesung" ? "Практика с открытым решением — затем проверь себя на новых числах." :
      A.support === "hilfe" ? "Практика с подсказкой или обратной связью. Для самостоятельной проверки выбери новые числа." : "Самостоятельная попытка. Можно открыть псевдокод как подсказку."; };
    hilfeText(); k.appendChild(hilfe);
    const d = el("details", "al-code");
    d.appendChild(el("summary", null, "Pseudocode zeigen"));
    d.appendChild(el("pre", null, V.code + (A.auf === false ? "\n\n// absteigend: Vergleich umdrehen (> wird <)" : "")));
    d.ontoggle = () => { if (d.open) { hilfeNutzen(A, "hilfe"); hilfeText(); } };
    k.appendChild(d);
    w.appendChild(k);
  }

  function feldZeile(feld, opt) {
    const o = opt || {};
    const r = el("div", "al-feld" + (o.klein ? " klein" : ""));
    feld.forEach((v, i) => {
      const c = el(o.knopf ? "button" : "span", "al-zelle");
      if (o.knopf) c.type = "button";
      if (o.fest && i >= o.fest.von && i <= o.fest.bis) c.classList.add(o.sortiert ? "sortiert" : "fest");
      if (o.falsch && o.falsch.indexOf(i) >= 0) c.classList.add("falsch");
      if (o.wahl === i) c.classList.add("wahl");
      if (o.markiert && o.markiert.indexOf(i) >= 0) c.classList.add("markiert");
      if (o.grau && o.grau(i)) c.classList.add("grau");
      c.appendChild(el("span", "al-wert", String(v)));
      if (o.index !== false) c.appendChild(el("span", "al-idx", String(i)));
      if (o.knopf) c.onclick = () => o.knopf(i);
      r.appendChild(c);
    });
    return r;
  }

  function zeichneAufgabe() {
    if (A.modus === "binaer") return zeichneBinaer();
    if (A.modus === "linear") return zeichneLinear();
    zeichneSort();
  }

  /* ---- Sortieren ---------------------------------------------------- */
  function zeichneSort() {
    const w = inhalt();
    const V = VERFAHREN[A.modus];
    aufgabenKopf(w, "Sortieren Sie das Feld " + (A.auf ? "aufsteigend" : "absteigend") + " mit " + V.name +
      ". Geben Sie den Inhalt des Feldes nach jedem Durchlauf der äußeren Schleife an.");

    const t = el("div", "al-karte");
    t.appendChild(el("div", "al-zeilentitel", "Start"));
    t.appendChild(feldZeile(A.feld, { klein: true }));
    for (let i = 0; i < A.k; i++) {
      const s = A.schritte[i];
      const kopfz = el("div", "al-zeilentitel");
      kopfz.appendChild(el("span", null, "nach Durchlauf " + (i + 1)));
      kopfz.appendChild(el("span", "al-zaehler", s.vergleiche + " Vergl. · " + (A.modus === "insertion" ? s.tausche + " verschoben" : s.tausche + (s.tausche === 1 ? " Tausch" : " Tausche"))));
      t.appendChild(kopfz);
      t.appendChild(feldZeile(s.feld, { klein: true, fest: s.fest, sortiert: s.sortiert, index: false }));
      t.appendChild(el("p", "al-erkl", s.info));
    }
    w.appendChild(t);

    if (A.k >= A.schritte.length) return sortEnde(w);

    const s = A.schritte[A.k];
    const vorher = A.k ? A.schritte[A.k - 1].feld : A.feld;
    const k = el("div", "al-karte al-aktiv");
    k.appendChild(el("h3", null, "Durchlauf " + (A.k + 1) + ": Wie sieht das Feld danach aus?"));
    if (A.eingabe === "tippen") {
      k.appendChild(el("p", "al-klein", "Zwei Zahlen nacheinander antippen = tauschen. Wenn das Feld so aussieht wie nach dem Durchlauf: „Prüfen“."));
      k.appendChild(feldZeile(A.arbeit, { knopf: i => tippe(i), wahl: A.wahl, falsch: A.falschePos }));
    } else {
      k.appendChild(el("p", "al-klein", "Alle Zahlen von links nach rechts eintragen."));
      const r = el("div", "al-feld eingabe");
      A.arbeit.forEach((v, i) => {
        const f = el("input", "al-inp" + (A.falschePos.indexOf(i) >= 0 ? " falsch" : ""));
        f.type = "text"; f.inputMode = "numeric"; f.autocomplete = "off"; f.value = v == null ? "" : String(v);
        f.setAttribute("aria-label", "Index " + i);
        f.oninput = () => { A.arbeit[i] = f.value.trim() === "" ? null : Number(f.value.replace(",", ".")); };
        f.onkeydown = ev => { if (ev.key === "Enter") pruefeSort(); };
        r.appendChild(f);
      });
      k.appendChild(r);
    }
    const st = el("div", "al-knoepfe");
    const p = el("button", "btn primary", "Prüfen"); p.type = "button"; p.onclick = pruefeSort;
    st.appendChild(p);
    const z = el("button", "btn ghost", A.eingabe === "tippen" ? "Zurücksetzen" : "Vorherige Zeile übernehmen"); z.type = "button";
    z.onclick = () => { A.arbeit = vorher.slice(); A.wahl = null; A.falschePos = []; zeichneSort(); };
    st.appendChild(z);
    if (A.versuche >= 2) {
      const l = el("button", "btn ghost", "Lösung zeigen"); l.type = "button";
      l.onclick = () => { A.support = "loesung"; schrittBewerten(A, null, A.schritte[A.k].feld, "sortieren"); A.fehler++; A.gezeigt++; weiterSort(); };
      st.appendChild(l);
    }
    k.appendChild(st);
    if (A.meldung) k.appendChild(el("p", "al-meldung " + A.meldung.art, A.meldung.text));
    w.appendChild(k);
    if (s && A.eingabe === "schreiben") setTimeout(() => { const f = w.querySelector(".al-inp"); if (f && !A.arbeit.some(v => v != null && v !== "")) try { f.focus({ preventScroll: true }); } catch (e) { } }, 30);
  }

  function tippe(i) {
    if (A.wahl == null) { A.wahl = i; }
    else if (A.wahl === i) { A.wahl = null; }
    else { const h = A.arbeit[A.wahl]; A.arbeit[A.wahl] = A.arbeit[i]; A.arbeit[i] = h; A.wahl = null; A.falschePos = []; A.meldung = null; }
    zeichneSort();
  }

  function pruefeSort() {
    const soll = A.schritte[A.k].feld;
    const ist = A.arbeit.map(v => (v == null || isNaN(v)) ? null : Number(v));
    const falsch = [];
    soll.forEach((v, i) => { if (ist[i] !== v) falsch.push(i); });
    if (schrittBewerten(A, ist, soll, "sortieren")) { weiterSort(); return; }
    A.versuche++;
    A.falschePos = falsch;
    A.meldung = { art: "schlecht", text: falsch.length + (falsch.length === 1 ? " Stelle stimmt" : " Stellen stimmen") + " noch nicht (rot markiert)." +
      (A.versuche >= 2 ? " Tipp: " + VERFAHREN[A.modus].idee : "") };
    zeichneSort();
  }
  function weiterSort() {
    if (A.versuche > 0 && A.gezeigt === 0) A.fehler++;
    A.k++; A.versuche = 0; A.gezeigt = 0; A.falschePos = []; A.wahl = null; A.meldung = null;
    A.arbeit = A.k < A.schritte.length ? (A.eingabe === "tippen" ? A.schritte[A.k - 1].feld.slice() : A.schritte[A.k - 1].feld.map(() => null)) : [];
    if (A.k >= A.schritte.length && !A.fertig) { A.fertig = true; merken(A.modus, A.fehler === 0, A.fehler); }
    zeichneSort();
  }
  function sortEnde(w) {
    const S = A.schritte;
    const v = S.reduce((s, x) => s + x.vergleiche, 0), t = S.reduce((s, x) => s + x.tausche, 0);
    const n = A.feld.length;
    const k = el("div", "al-karte al-ende");
    k.appendChild(el("h3", null, A.fehler === 0 ? "Fertig — alles richtig!" : "Fertig — mit " + A.fehler + (A.fehler === 1 ? " Fehler" : " Fehlern")));
    const p = [];
    p.push(S.length + " Durchläufe, zusammen " + v + " Vergleiche und " + t + (A.modus === "insertion" ? " Verschiebungen." : " Tausche."));
    if (A.modus === "bubble") p.push(S.length < n - 1 ? "Durch die Abbruchbedingung reichten " + S.length + " statt " + (n - 1) + " Durchläufe." : "Ohne frühen Abbruch: alle " + (n - 1) + " Durchläufe waren nötig.");
    if (A.modus === "selection") p.push("Selection Sort braucht immer n·(n−1)/2 = " + (n * (n - 1) / 2) + " Vergleiche — egal, wie das Feld vorher aussah.");
    if (A.modus === "insertion") p.push("Im schlechtesten Fall wären es n·(n−1)/2 = " + (n * (n - 1) / 2) + " Vergleiche; fast sortierte Felder brauchen viel weniger.");
    p.forEach(x => k.appendChild(el("p", "al-info", x)));
    const st = el("div", "al-knoepfe");
    const b1 = el("button", "btn primary", "Noch ein Feld"); b1.type = "button"; b1.onclick = () => starten(A.modus);
    const b2 = el("button", "btn ghost", "Anderes Verfahren"); b2.type = "button"; b2.onclick = () => { A = null; zeige("wahl"); };
    st.append(b1, b2);
    k.appendChild(st);
    w.appendChild(k);
  }

  /* ---- Binäre Suche ------------------------------------------------- */
  function zeichneBinaer() {
    const w = inhalt();
    aufgabenKopf(w, "Gesucht wird x = " + A.x + " im sortierten Feld. Geben Sie für jeden Schritt links, rechts und mitte an " +
      "(mitte = (links + rechts) DIV 2) und entscheiden Sie, wie es weitergeht.");
    const S = A.loesung.schritte;
    const akt = S[A.k];
    const bereich = akt && !akt.leer ? [akt.links, akt.rechts] : null;
    const k0 = el("div", "al-karte");
    k0.appendChild(el("div", "al-zeilentitel", "Feld (Index unter dem Wert)"));
    const erledigt = S.slice(0, A.k).filter(s => !s.leer).map(s => s.mitte);
    k0.appendChild(feldZeile(A.feld, { markiert: erledigt,
      grau: i => !A.fertig && A.phase === "entscheiden" && !!bereich && (i < bereich[0] || i > bereich[1]) }));
    w.appendChild(k0);

    /* Tabelle der erledigten Schritte */
    const t = el("div", "al-karte");
    const tab = el("table", "al-tab");
    const kz = el("tr"); ["Nr.", "links", "rechts", "mitte", "a[mitte]", "weiter"].forEach(h => kz.appendChild(el("th", null, h)));
    const thead = el("thead"); thead.appendChild(kz); tab.appendChild(thead);
    const tb = el("tbody");
    for (let i = 0; i < A.k; i++) {
      const s = S[i]; const tr = el("tr");
      if (s.leer) { [String(i + 1), String(s.links), String(s.rechts), "—", "—", "leer → nicht gefunden"].forEach(c => tr.appendChild(el("td", null, c))); }
      else [String(i + 1), String(s.links), String(s.rechts), String(s.mitte), String(s.wert), entscheidText(s.entscheidung, A.x, s.wert)].forEach(c => tr.appendChild(el("td", null, c)));
      tb.appendChild(tr);
    }
    tab.appendChild(tb);
    const sc = el("div", "al-tab-scroll"); sc.appendChild(tab);
    t.appendChild(sc);
    w.appendChild(t);

    if (A.fertig) return binaerEnde(w);

    const k = el("div", "al-karte al-aktiv");
    k.appendChild(el("h3", null, "Schritt " + (A.k + 1)));
    if (A.phase === "werte") {
      const reihe = el("div", "al-werte");
      ["links", "rechts", "mitte"].forEach(n => {
        const lab = el("label", "al-wert-feld" + (A.falsch[n] ? " falsch" : ""));
        lab.appendChild(el("span", null, n));
        const f = el("input", "al-inp"); f.type = "text"; f.inputMode = "numeric"; f.autocomplete = "off";
        f.value = A.eingaben && A.eingaben[n] != null ? A.eingaben[n] : "";
        f.oninput = () => { A.eingaben = A.eingaben || {}; A.eingaben[n] = f.value; };
        f.onkeydown = ev => { if (ev.key === "Enter") pruefeWerte(); };
        lab.appendChild(f);
        reihe.appendChild(lab);
      });
      k.appendChild(reihe);
      const st = el("div", "al-knoepfe");
      const p = el("button", "btn primary", "Prüfen"); p.type = "button"; p.onclick = pruefeWerte;
      const leer = el("button", "btn ghost", "links > rechts → nicht gefunden"); leer.type = "button"; leer.onclick = () => entscheide("leer");
      st.append(p, leer);
      if (A.versuche >= 2) { const l = el("button", "btn ghost", "Lösung zeigen"); l.type = "button"; l.onclick = () => { A.fehler++; zeigeWerteLoesung(); }; st.appendChild(l); }
      k.appendChild(st);
    } else {
      k.appendChild(el("p", "al-info", "links = " + akt.links + ", rechts = " + akt.rechts + ", mitte = " + akt.mitte + "  →  a[" + akt.mitte + "] = " + akt.wert + ". Gesucht: " + A.x + "."));
      const st = el("div", "al-knoepfe al-entscheid");
      [["gefunden", "a[mitte] = x → gefunden"], ["rechts", "x ist größer → rechts weiter (links = mitte + 1)"], ["links", "x ist kleiner → links weiter (rechts = mitte − 1)"]].forEach(([e, txt]) => {
        const b = el("button", "btn", txt); b.type = "button"; b.onclick = () => entscheide(e); st.appendChild(b);
      });
      k.appendChild(st);
    }
    if (A.meldung) k.appendChild(el("p", "al-meldung " + A.meldung.art, A.meldung.text));
    w.appendChild(k);
  }
  function entscheidText(e, x, w) {
    return e === "gefunden" ? "gefunden ✓" : e === "rechts" ? w + " < " + x + " → rechts" : w + " > " + x + " → links";
  }
  function pruefeWerte() {
    const s = A.loesung.schritte[A.k];
    if (s.leer) { schrittBewerten(A, A.eingaben || {}, { bereich: "leer" }, "suchgrenzen"); A.versuche++; A.meldung = { art: "schlecht", text: "Schau auf links und rechts: Ist der Bereich überhaupt noch da?" }; zeichneBinaer(); return; }
    const e = A.eingaben || {}, f = {};
    ["links", "rechts", "mitte"].forEach(n => { if (Number(String(e[n] == null ? "" : e[n]).trim()) !== s[n] || String(e[n] == null ? "" : e[n]).trim() === "") f[n] = 1; });
    A.falsch = f;
    const input = {}, soll = {};
    ["links", "rechts", "mitte"].forEach(n => { input[n] = String(e[n] == null ? "" : e[n]).trim() === "" ? null : Number(e[n]); soll[n] = s[n]; });
    if (schrittBewerten(A, input, soll, "suchgrenzen")) { A.phase = "entscheiden"; A.meldung = null; if (A.versuche) A.fehler++; A.versuche = 0; zeichneBinaer(); return; }
    A.versuche++;
    A.meldung = { art: "schlecht", text: (f.mitte && !f.links && !f.rechts ? "mitte stimmt nicht: (" + s.links + " + " + s.rechts + ") DIV 2 — ganzzahlig, also abrunden." :
      "Noch nicht richtig. Nach einem Schritt nach rechts gilt links = mitte + 1, nach links rechts = mitte − 1.") };
    zeichneBinaer();
  }
  function zeigeWerteLoesung() {
    const s = A.loesung.schritte[A.k];
    A.support = "loesung";
    schrittBewerten(A, null, s.leer ? { bereich: "leer" } : { links: s.links, rechts: s.rechts, mitte: s.mitte }, "suchgrenzen");
    if (s.leer) { entscheide("leer", true); return; }
    A.eingaben = { links: String(s.links), rechts: String(s.rechts), mitte: String(s.mitte) };
    A.falsch = {}; A.phase = "entscheiden"; A.versuche = 0; A.meldung = null;
    zeichneBinaer();
  }
  function entscheide(e, gezeigt) {
    const s = A.loesung.schritte[A.k];
    schrittBewerten(A, e, s.leer ? "leer" : s.entscheidung, "entscheidung");
    if (e === "leer") {
      if (s.leer) { A.k++; A.fertig = true; merken("binaer", A.fehler === 0, A.fehler); A.meldung = null; zeichneBinaer(); return; }
      A.versuche++; A.fehler++; A.meldung = { art: "schlecht", text: "Der Bereich ist noch nicht leer: links (" + s.links + ") ≤ rechts (" + s.rechts + "). Weiter suchen!" };
      zeichneBinaer(); return;
    }
    if (e !== s.entscheidung) {
      A.fehler++;
      A.meldung = { art: "schlecht", text: "Vergleiche a[mitte] = " + s.wert + " mit x = " + A.x + "." };
      zeichneBinaer(); return;
    }
    A.k++; A.phase = "werte"; A.eingaben = {}; A.falsch = {}; A.meldung = null; A.versuche = 0;
    if (e === "gefunden") { A.fertig = true; merken("binaer", A.fehler === 0, A.fehler); }
    zeichneBinaer();
  }
  function binaerEnde(w) {
    const L = A.loesung, lin = linear(A.feld, A.x);
    const schritte = L.schritte.filter(s => !s.leer).length;
    const k = el("div", "al-karte al-ende");
    k.appendChild(el("h3", null, (L.gefunden ? "Gefunden an Index " + L.index : A.x + " ist nicht im Feld") + (A.fehler ? " — " + A.fehler + (A.fehler === 1 ? " Fehler" : " Fehler") : " — alles richtig!")));
    k.appendChild(el("p", "al-info", "Die binäre Suche hat " + schritte + (schritte === 1 ? " Element" : " Elemente") + " geprüft. Die lineare Suche hätte " +
      lin.pruefungen + " gebraucht. Höchstens nötig bei " + A.feld.length + " Elementen: " + (Math.floor(Math.log2(A.feld.length)) + 1) + " (⌊log₂ n⌋ + 1)."));
    const st = el("div", "al-knoepfe");
    const b1 = el("button", "btn primary", "Noch eine Suche"); b1.type = "button"; b1.onclick = () => starten("binaer");
    const b2 = el("button", "btn ghost", "Anderes Verfahren"); b2.type = "button"; b2.onclick = () => { A = null; zeige("wahl"); };
    st.append(b1, b2); k.appendChild(st);
    w.appendChild(k);
  }

  /* ---- Lineare Suche ------------------------------------------------ */
  function zeichneLinear() {
    const w = inhalt();
    aufgabenKopf(w, "Runde " + (A.runde + 1) + " von 5. Wie viele Elemente prüft die lineare Suche, bis sie x = " + A.x + " findet — oder bis klar ist, dass x fehlt?");
    const k = el("div", "al-karte al-aktiv");
    const geprueft = A.antwort ? A.loesung.pruefungen : 0;
    k.appendChild(feldZeile(A.feld, { markiert: A.antwort ? Array.from({ length: geprueft }, (_, i) => i) : [] }));
    if (!A.antwort) {
      const r = el("div", "al-werte");
      const lab = el("label", "al-wert-feld"); lab.appendChild(el("span", null, "geprüfte Elemente"));
      const f = el("input", "al-inp"); f.type = "text"; f.inputMode = "numeric"; f.autocomplete = "off";
      f.onkeydown = ev => { if (ev.key === "Enter") p.click(); };
      lab.appendChild(f); r.appendChild(lab); k.appendChild(r);
      const st = el("div", "al-knoepfe");
      const p = el("button", "btn primary", "Prüfen"); p.type = "button";
      p.onclick = () => {
        const v = Number(String(f.value).trim());
        A.antwort = { wert: v, ok: schrittBewerten(A, String(f.value).trim() === "" ? null : v, A.loesung.pruefungen, "linear") };
        if (A.antwort.ok) A.richtig++; else A.fehler++;
        zeichneLinear();
      };
      st.appendChild(p); k.appendChild(st);
      setTimeout(() => { try { f.focus({ preventScroll: true }); } catch (e) { } }, 30);
    } else {
      const ok = A.antwort.ok;
      k.appendChild(el("p", "al-meldung " + (ok ? "gut" : "schlecht"), (ok ? "Richtig: " : "Nicht ganz — richtig ist ") + A.loesung.pruefungen + ". " +
        (A.loesung.gefunden ? "x steht an Index " + A.loesung.index + ", also werden Index 0 bis " + A.loesung.index + " geprüft." :
                              "x fehlt — alle " + A.feld.length + " Elemente müssen geprüft werden (schlechtester Fall, O(n)).")));
      const st = el("div", "al-knoepfe");
      if (A.runde < 4) {
        const n = el("button", "btn primary", "Nächste Runde"); n.type = "button";
        n.onclick = () => { A.runde++; neueLinear(); zeichneLinear(); };
        st.appendChild(n);
      } else {
        if (!A.fertig) { A.fertig = true; merken("linear", A.fehler === 0, A.fehler); }
        k.appendChild(el("p", "al-info", A.richtig + " von 5 richtig."));
        const n = el("button", "btn primary", "Nochmal 5 Runden"); n.type = "button"; n.onclick = () => starten("linear");
        st.appendChild(n);
        const b2 = el("button", "btn ghost", "Anderes Verfahren"); b2.type = "button"; b2.onclick = () => { A = null; zeige("wahl"); };
        st.appendChild(b2);
      }
      k.appendChild(st);
    }
    w.appendChild(k);
  }

  /* ------------------------------------------------- Startseite: Block */
  function box() {
    const s = $("scStart");
    if (!s) return;
    let b = $("algoBox");
    if (!b) {
      b = el("div", "abschnitt"); b.id = "algoBox";
      const g = $("pseudoBox");
      const nach = g ? (g.closest("details.st-block") || g) : null;
      if (nach && nach.parentNode) nach.parentNode.insertBefore(b, nach.nextSibling);
      else s.appendChild(b);
    }
    b.innerHTML = "";
    b.appendChild(el("h2", null, "Sortieren & Suchen Schritt für Schritt"));
    b.appendChild(el("p", null, "GA2 fragt: „Geben Sie den Inhalt des Arrays nach jedem Durchlauf an.“ Hier mit immer neuen Zahlen — " +
      "jeder Durchlauf wird sofort geprüft. Dazu die binäre Suche mit links, rechts und mitte."));
    const st = el("div", "gen-knopfzeile");
    Object.keys(VERFAHREN).forEach((key, i) => {
      const s2 = ST[key];
      const k = el("button", "btn" + (i === 0 ? " primary" : ""), VERFAHREN[key].name + (s2 ? " · " + s2.n + "×" : "")); k.type = "button";
      k.onclick = () => starten(key);
      st.appendChild(k);
    });
    b.appendChild(st);
    const d = document.querySelector('details.st-block[data-key="algo"] .st-zahl');
    if (d) { const n = Object.keys(ST).reduce((x, k) => x + ((ST[k] || {}).n || 0), 0); d.textContent = n ? n + "× geübt" : ""; }
  }

  /* ======================================================================
     Einhängen
     ====================================================================== */
  function einhaengen() {
    const alt = root.renderStart;
    if (typeof alt === "function" && !alt.__al) {
      const neu = function () {
        const r = alt.apply(this, arguments);
        try { setTimeout(box, 0); } catch (e) { console.error("Algo:", e); }
        return r;
      };
      neu.__al = true; root.renderStart = neu;
    }
    setTimeout(box, 380);
    const altS = root.schirm;
    if (typeof altS === "function" && !altS.__al) {
      const neu = function (name) {
        if (name === "scAlgo") { const hs = history.state || {}; zeige(hs.al === "aufgabe" && A ? "aufgabe" : "wahl", true); return; }
        const s = $("scAlgo");
        if (s && !s.hidden) s.hidden = true;
        return altS.apply(this, arguments);
      };
      neu.__al = true; root.schirm = neu;
    }
    root.addEventListener("popstate", ev => {
      const st = ev.state || {};
      const s = $("scAlgo");
      if (st.seite !== "scAlgo" || !s || s.hidden) return;
      zeige(st.al === "aufgabe" && A ? "aufgabe" : "wahl", true);
    });
  }
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }

  const api = { bubble, selection, insertion, binaer, linear, zufallsFeld, schrittBewerten, hilfeNutzen, VERFAHREN, oeffnen, starten, box, stand: () => ST };
  root.GENALGO = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
