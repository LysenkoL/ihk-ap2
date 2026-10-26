/* ============================================================================
   gen/radar-ap2.js — Themen-Radar AP2: wie oft kam ein Thema in GA1, GA2, WiSo?
   ----------------------------------------------------------------------------
   Grundlage sind die Verweise aus «Что тренировать» (AP2_TRAINING:
   gen/lernweg-daten.js für GA1/GA2, gen/training-wiso-daten.js für WiSo):
   je Thema die Aufgaben der Original-Prüfungen W21/22 … S26 als
   [Modul, Nr., Punkte, [Teil-IDs]] — keine Aufgabentexte.

   Je Thema und Termin: Punkte der Aufgaben mit diesem Thema (0 = nicht dran).
   In der AP2 kommen die meisten Themen fast jedes Mal — die Formel des
   AP1-Radars (gen/radar.js) unterscheidet sie nicht. Darum hier:
       Kategorie = Anteil der Termine: alle · ≥ 70 % oft · ≥ 40 % manchmal · sonst selten
       Gewicht   = Punkte je Prüfung im Schnitt (von 100 des Teils) → Sortierung
   Priorität: jedes Mal dran oder ≥ 15 Punkte im Schnitt, eigener Stand < 50 % oder unbekannt.
   Eigener Stand: bewertete Teilaufgaben genau dieser Aufgaben im Bogen-Player
   (aktueller Stand, sonst letzter Versuch). Häufig + schwach = Priorität.

   Bildschirm scRadarAp2. Reine Funktionen für tests/radar-ap2.test.js.
   ========================================================================== */
"use strict";
(function (root) {
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const TEILE = [{ id: "GA1", name: "GA1" }, { id: "GA2", name: "GA2" }, { id: "WiSo", name: "WiSo" }];
  const KAT = {
    immer: ["каждый экзамен", "тема была во всех сроках"],
    oft: ["часто", "в 70 % сроков и чаще"],
    manch: ["иногда", "в 40–69 % сроков"],
    selten: ["редко", "реже чем в 40 % сроков"]
  };
  const GEWICHT = 15;
  const RX = /^(ga1|ga2|wiso)-(\d{4})-([sw])$/;

  /* ---- reine Funktionen ---- */
  /** "2021-w" → "W21/22", "2022-s" → "S22" */
  function terminName(k) {
    const [j, s] = k.split("-"), y = Number(j) % 100;
    return s === "s" ? "S" + String(y).padStart(2, "0") : "W" + String(y).padStart(2, "0") + "/" + String((y + 1) % 100).padStart(2, "0");
  }
  /** Sortierschlüssel: Sommer vor Winter desselben Jahres */
  const ordnung = k => { const [j, s] = k.split("-"); return Number(j) * 2 + (s === "w" ? 1 : 0); };
  const terminVon = mid => { const r = RX.exec(mid); return r ? r[2] + "-" + r[3] : null; };

  /** Termine je Teil (aus allen Verweisen dieses Teils), aufsteigend */
  function termineJeTeil(training) {
    const out = {};
    TEILE.forEach(t => { out[t.id] = new Set(); });
    (training || []).forEach(x => { if (out[x.bereich]) (x.aufgaben || []).forEach(a => { const k = terminVon(a[0]); if (k) out[x.bereich].add(k); }); });
    Object.keys(out).forEach(b => { out[b] = [...out[b]].sort((a, c) => ordnung(a) - ordnung(c)); });
    return out;
  }
  function kategorie(n, von) { return !von ? "selten" : n >= von ? "immer" : n / von >= 0.7 ? "oft" : n / von >= 0.4 ? "manch" : "selten"; }

  /** Radar-Zeilen: [{ id, bereich, name, de, zellen: [{ termin, punkte }], n, von, n4, wert, kat, schnitt, zuletzt }] */
  function radar(training) {
    const tj = termineJeTeil(training);
    return (training || []).filter(x => tj[x.bereich]).map(x => {
      const termine = tj[x.bereich], p = {};
      (x.aufgaben || []).forEach(a => { const k = terminVon(a[0]); if (k) p[k] = Math.round(((p[k] || 0) + (Number(a[2]) || 0)) * 100) / 100; });
      const zellen = termine.map(k => ({ termin: k, punkte: p[k] || 0 }));
      const n = zellen.filter(z => z.punkte > 0).length, n4 = zellen.slice(-4).filter(z => z.punkte > 0).length;
      const summe = zellen.reduce((s, z) => s + z.punkte, 0);
      const letzt = zellen.map(z => z.punkte > 0).lastIndexOf(true);
      return { id: x.id, bereich: x.bereich, name: x.name, de: x.de || "", zellen, n, von: termine.length, n4, kat: kategorie(n, termine.length),
        schnitt: termine.length ? Math.round(summe / termine.length * 10) / 10 : 0, zuletzt: letzt < 0 ? null : zellen[letzt].termin,
        pause: letzt < 0 ? null : zellen.length - 1 - letzt };
    }).sort((a, b) => b.schnitt - a.schnitt || b.n - a.n || (a.name < b.name ? -1 : 1));
  }

  /** Eigener Stand zu einem Thema: { punkte, max, teile } aus den bewerteten Teilaufgaben, null = nichts bewertet.
      zustandVon(mid) → Zustand; teilPunkte(mid, tid) → Höchstpunkte der Teilaufgabe */
  function eigenerStand(thema, zustandVon, teilPunkte) {
    let punkte = 0, max = 0, teile = 0;
    (thema.aufgaben || []).forEach(a => {
      const z = zustandVon(a[0]);
      if (!z) return;
      const letzter = z.versuche && z.versuche.length ? (z.versuche[z.versuche.length - 1].zustand || {}) : {};
      const pAkt = z.p || {}, pAlt = letzter.p || {}, nutzAkt = Object.keys(pAkt).length > 0;
      (a[3] || []).forEach(tid => {
        const wert = nutzAkt ? pAkt[tid] : pAlt[tid];
        const mx = teilPunkte(a[0], tid);
        if (wert == null || !mx) return;
        punkte += Number(wert) || 0; max += mx; teile++;
      });
    });
    return teile ? { punkte: Math.round(punkte * 10) / 10, max: Math.round(max * 10) / 10, prozent: Math.round(punkte / max * 1000) / 10, teile } : null;
  }
  /** Priorität: jedes Mal dran oder viele Punkte, und eigener Stand < 50 % oder unbekannt */
  const prioritaet = (zeile, stand) => (zeile.kat === "immer" || zeile.schnitt >= GEWICHT) && (!stand || stand.prozent < 50);

  const api = { TEILE, KAT, GEWICHT, terminName, terminVon, termineJeTeil, kategorie, radar, eigenerStand, prioritaet };

  if (hatDom) {
    const $ = id => document.getElementById(id);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const knopf = (text, fn, cls) => { const b = el("button", "btn" + (cls ? " " + cls : ""), text); b.type = "button"; b.onclick = fn; return b; };
    const zahl = x => String(x).replace(".", ",");
    let FILTER = "alle", NUR_PRIO = false;

    function screen() {
      let s = $("scRadarAp2");
      if (s) return s;
      s = el("div", "seite ra-page"); s.id = "scRadarAp2"; s.hidden = true;
      const w = el("div", "ra-wrap"); w.id = "raInhalt"; s.appendChild(w);
      const start = $("scStart"); start.parentNode.insertBefore(s, start.nextSibling);
      return s;
    }
    function oeffnen(ausVerlauf) {
      const s = screen();
      document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
      ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { if ($(k)) $(k).hidden = true; });
      if ($("kopfTitel")) $("kopfTitel").hidden = false;
      if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · Radar";
      if ($("kTitel")) $("kTitel").textContent = "Радар тем AP2";
      if (!ausVerlauf) {
        try {
          if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
          history.pushState({ ihk: 1, seite: "scRadarAp2" }, "");
        } catch (e) { }
      }
      zeichnen();
      const A = root.GENAZUBI;
      if (A && A.laden) A.laden().then(zeichnen).catch(() => { });
      if (root.GENZURUECK) root.GENZURUECK.knopfPflegen();
      root.scrollTo(0, 0);
    }

    function standFuer(thema) {
      const A = root.GENAZUBI;
      if (!A || !A.paket || !A.paket()) return null;
      const teilPunkte = (mid, tid) => { const m = A.modul(mid); if (!m) return 0; const t = A.teileVon(m).find(x => x.id === tid); return t ? Number(t.punkte) || 0 : 0; };
      try { return eigenerStand(thema, mid => (A.modul(mid) ? A.zustand(mid) : null), teilPunkte); } catch (e) { return null; }
    }

    function zeichnen() {
      const w = $("raInhalt"); if (!w) return;
      w.replaceChildren();
      const training = root.AP2_TRAINING || [];
      const zeilen = radar(training);
      const kopf = el("section", "ra-card");
      kopf.appendChild(el("h2", null, "Как часто тема встречается в AP2"));
      const tj = termineJeTeil(training);
      kopf.appendChild(el("p", null, "Основа — оригинальные экзамены " + TEILE.map(t => t.name + ": " + tj[t.id].length).join(" · ") + " (" + (tj.GA1[0] ? terminName(tj.GA1[0]) : "") + " – " + (tj.GA1.length ? terminName(tj.GA1[tj.GA1.length - 1]) : "") + "). Клетка = срок; цвет — сколько баллов было по теме."));
      kopf.appendChild(el("p", "ra-muted", "Порядок — по среднему числу баллов за экзамен (из 100 баллов части). Приоритет — тема в каждом экзамене или ≥ " + GEWICHT + " баллов в среднем, а твой результат ниже 50 % или неизвестен. Это статистика прошлых экзаменов, не обещание."));
      const fl = el("div", "ra-filter"); fl.setAttribute("role", "group");
      [["alle", "Все"]].concat(TEILE.map(t => [t.id, t.name])).forEach(([id, txt]) => {
        const b = el("button", "ra-chip" + (FILTER === id ? " an" : ""), txt); b.type = "button"; b.setAttribute("aria-pressed", FILTER === id ? "true" : "false");
        b.onclick = () => { FILTER = id; zeichnen(); }; fl.appendChild(b);
      });
      const pr = el("button", "ra-chip" + (NUR_PRIO ? " an" : ""), "Только приоритет"); pr.type = "button"; pr.setAttribute("aria-pressed", NUR_PRIO ? "true" : "false");
      pr.onclick = () => { NUR_PRIO = !NUR_PRIO; zeichnen(); }; fl.appendChild(pr);
      kopf.appendChild(fl);
      w.appendChild(kopf);

      const byId = Object.fromEntries(training.map(t => [t.id, t]));
      const sichtbar = zeilen.filter(z => FILTER === "alle" || z.bereich === FILTER)
        .map(z => ({ z, st: standFuer(byId[z.id]) }))
        .filter(x => !NUR_PRIO || prioritaet(x.z, x.st));
      if (!sichtbar.length) { w.appendChild(el("p", "ra-card ra-muted", NUR_PRIO ? "Нет частых тем со слабым результатом. Отлично — или ещё не решены бланки: тогда приоритет — все частые темы." : "Нет данных.")); return; }
      const maxJe = {};   /* Farbe je Teil skalieren: WiSo-Aufgaben haben ~3 Punkte, GA-Aufgaben ~25 */
      zeilen.forEach(z => z.zellen.forEach(c => { maxJe[z.bereich] = Math.max(maxJe[z.bereich] || 1, c.punkte); }));
      const liste = el("div", "ra-liste");
      sichtbar.forEach(({ z, st }) => liste.appendChild(zeile(z, st, maxJe[z.bereich])));
      w.appendChild(liste);
      w.appendChild(el("p", "ra-muted ra-fuss", "Свой результат — по оценённым частям именно этих заданий в «Meine Prüfungsbögen». Квизы и тренажёры сюда не входят."));
    }

    function zeile(z, st, maxP) {
      const c = el("article", "ra-thema ra-" + z.kat + (prioritaet(z, st) ? " ra-prio" : ""));
      const k = el("div", "ra-kopf");
      const t = el("div", "ra-titel");
      t.appendChild(el("b", null, z.name));
      const de = el("span", "ra-de", z.bereich + " · " + z.de); de.lang = "de"; t.appendChild(de);
      k.appendChild(t);
      k.appendChild(el("span", "ra-kat", KAT[z.kat][0]));
      c.appendChild(k);
      const reihe = el("div", "ra-reihe"); reihe.setAttribute("role", "img");
      reihe.setAttribute("aria-label", z.zellen.map(x => terminName(x.termin) + (x.punkte ? " " + zahl(x.punkte) + " баллов" : " нет")).join(", "));
      z.zellen.forEach(x => {
        const d = el("span", "ra-zelle" + (x.punkte ? " an" : ""));
        if (x.punkte) d.style.setProperty("--a", String(Math.max(0.25, Math.min(1, x.punkte / maxP))));
        d.title = terminName(x.termin) + ": " + (x.punkte ? zahl(x.punkte) + " P." : "—");
        reihe.appendChild(d);
      });
      c.appendChild(reihe);
      const ach = el("div", "ra-achse"); ach.appendChild(el("span", null, terminName(z.zellen[0].termin))); ach.appendChild(el("span", null, terminName(z.zellen[z.zellen.length - 1].termin))); c.appendChild(ach);
      const info = el("p", "ra-info");
      info.textContent = z.n + " из " + z.von + " сроков · в последних 4: " + z.n4 + " · в среднем " + zahl(z.schnitt) + " баллов за экзамен" +
        (z.pause > 0 ? " · не было " + z.pause + " " + (z.pause === 1 ? "срок" : z.pause < 5 ? "срока" : "сроков") : "");
      c.appendChild(info);
      const s = el("p", "ra-stand");
      if (st) s.textContent = "Твой результат: " + zahl(st.prozent) + " % (" + zahl(st.punkte) + " из " + zahl(st.max) + ", частей: " + st.teile + ")";
      else s.textContent = "Твой результат: ещё нет оценённых заданий по теме";
      if (st) s.classList.add(st.prozent < 30 ? "rot" : st.prozent < 50 ? "gelb" : "gruen");
      c.appendChild(s);
      if (prioritaet(z, st)) c.appendChild(el("p", "ra-prio-text", st ? "Приоритет: тема весомая, а результат ниже 50 %." : "Приоритет: тема весомая — реши задания из бланков, чтобы узнать свой уровень."));
      if (root.GENLERNWEG && root.GENLERNWEG.oeffnen) c.appendChild(knopf("Тренировать тему", () => root.GENLERNWEG.oeffnen("@" + z.id), "ghost"));
      return c;
    }

    function hook() {
      const alt = root.schirm;
      if (typeof alt === "function" && !alt.__ra) {
        const neu = function (name) {
          if (name === "scRadarAp2") { oeffnen(true); return; }
          const s = $("scRadarAp2"); if (s && !s.hidden) s.hidden = true;
          return alt.apply(this, arguments);
        };
        neu.__ra = true; root.schirm = neu;
      }
    }
    api.oeffnen = () => oeffnen();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  }

  root.GENRADARAP2 = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
