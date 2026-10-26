/* ============================================================================
   gen/wortkarten.js — «Карточки слов»: Fachbegriffe und Prüfungsdeutsch,
   DE → RU und RU → DE, Lernkartei nach Leitner, 5 Minuten am Tag
   ----------------------------------------------------------------------------
   Quellen (nichts wird kopiert, nur gelesen):
     • Meine Wörter      ap2:glossar:mein (gen/nachschlagen.js) — mit Satz aus der Aufgabe
     • Prüfungsdeutsch   window.IHK_WORTSCHATZ (gen/wortschatz-daten.js)
     • Fachbegriffe AP2  window.IHK_GLOSSAR, Spalte AP "2" oder "1+2" (gen/glossar-*.js)
   Neue Karten kommen in dieser Reihenfolge: Meine Wörter → Prüfungsdeutsch →
   Fachbegriffe. Zuerst DE → RU; die Gegenrichtung RU → DE kommt dazu, sobald
   die DE → RU-Karte einmal gewusst wurde (Fach 2).

   Leitner: Fach 1–5. Gewusst → ein Fach höher, wieder fällig nach
   1 / 2 / 4 / 8 / 16 Tagen (Fach 1 … 5). Nicht gewusst → Fach 1, morgen
   wieder und in dieser Runde noch einmal ganz hinten.
   Täglich höchstens NEU_PRO_TAG neue Karten.

   Speicher ap2:wortkarten = { v:1,
     k:    { "<richtung>|<karten-id>": { b: Fach, f: "JJJJ-MM-TT" fällig, n, r, t } },
     tage: { "JJJJ-MM-TT": { n: Antworten, sek: Sekunden, neu: neue Karten } } }
   gen/sync.js führt k je Karte (neuere t) und tage je Tag (größere Werte) zusammen.

   «Сегодня» (gen/heute.js): Schritt «Слова: 5 минут» ist erledigt bei 5 Minuten
   oder wenn heute nichts mehr fällig ist und schon geübt wurde.
   Reine Funktionen für tests/wortkarten.test.js.
   ========================================================================== */
"use strict";
(function (root) {
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const SK = "ap2:wortkarten";
  const INTERVALL = [0, 1, 2, 4, 8, 16];          /* Tage bis zur nächsten Wiederholung je Fach 1–5 */
  const NEU_PRO_TAG = 10;
  const ZIEL_SEK = 300;
  const RICHTUNGEN = { "de-ru": "DE → RU", "ru-de": "RU → DE" };
  const GEBIETE = () => root.IHK_GLOSSAR_GEBIETE || {};

  /* ======================================================================
     Reine Funktionen
     ====================================================================== */
  const zwei = n => String(n).padStart(2, "0");
  const tagKey = d => { const x = d instanceof Date ? d : new Date(d == null ? Date.now() : d); return x.getFullYear() + "-" + zwei(x.getMonth() + 1) + "-" + zwei(x.getDate()); };
  function plusTage(ymd, n) {
    const [y, m, d] = ymd.split("-").map(Number);
    const x = new Date(Date.UTC(y, m - 1, d + n));
    return x.getUTCFullYear() + "-" + zwei(x.getUTCMonth() + 1) + "-" + zwei(x.getUTCDate());
  }
  const slug = s => String(s || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9а-яё]+/g, "-").replace(/^-|-$/g, "");
  const ohneTrenn = w => String(w || "").replace(/\|/g, "");

  /** Alle Karten aus den Quellen: [{ id, de, ru, beispiel, quelle, info }] — ohne Doppelte (gleiches Wort) */
  function karten(q) {
    q = q || {};
    const out = [], gesehen = new Set();
    const add = k => {
      const schl = slug(String(k.de).replace(/^(der|die|das)\s+/i, ""));
      if (!k.de || !k.ru || !schl || gesehen.has(schl)) return;
      gesehen.add(schl); out.push(k);
    };
    const mein = q.mein || {};
    Object.keys(mein).sort((a, b) => (mein[b].t || 0) - (mein[a].t || 0)).forEach(id => {
      const m = mein[id];
      if (m && m.wort && m.ru) add({ id: "m:" + id, de: m.wort, ru: m.ru, beispiel: m.kontext || "", quelle: "mein", info: "Мои слова" + (m.quelle ? " · " + m.quelle : "") });
    });
    (q.wortschatz || []).forEach(z => {
      if (!Array.isArray(z) || !z[1] || !z[2]) return;
      add({ id: "w:" + slug(ohneTrenn(z[1])), de: ohneTrenn(z[1]), ru: z[2], beispiel: "", quelle: "pruefung", info: "Prüfungsdeutsch" });
    });
    (q.glossar || []).forEach(z => {
      if (!Array.isArray(z) || !/2/.test(String(z[3] || ""))) return;
      add({ id: "g:" + slug(z[0]), de: z[0], ru: z[1], beispiel: z[2] || "", quelle: "glossar", info: "Fachbegriff" + (q.gebiete && q.gebiete[z[4]] ? " · " + q.gebiete[z[4]] : "") });
    });
    return out;
  }

  const leerStand = () => ({ v: 1, k: {}, tage: {} });
  function normStand(x) {
    const s = leerStand();
    if (!x || typeof x !== "object" || Array.isArray(x)) return s;
    if (x.k && typeof x.k === "object") Object.keys(x.k).forEach(key => {
      const e = x.k[key];
      if (e && Number.isInteger(e.b) && e.b >= 1 && e.b <= 5 && /^\d{4}-\d{2}-\d{2}$/.test(e.f || "")) s.k[key] = e;
    });
    if (x.tage && typeof x.tage === "object") Object.keys(x.tage).forEach(d => { const t = x.tage[d]; if (t && typeof t === "object") s.tage[d] = t; });
    return s;
  }
  const schluessel = (richtung, id) => richtung + "|" + id;

  /** Reihenfolge einer Runde: fällige Karten (niedriges Fach, früh fällig zuerst), dann neue bis zum Tageslimit */
  function runde(alle, stand, heute, opt) {
    const o = Object.assign({ neuMax: NEU_PRO_TAG }, opt || {});
    const st = normStand(stand), ids = new Set(alle.map(k => k.id));
    const faellig = Object.keys(st.k).filter(key => st.k[key].f <= heute && ids.has(key.split("|").slice(1).join("|")))
      .sort((a, b) => st.k[a].b - st.k[b].b || (st.k[a].f < st.k[b].f ? -1 : st.k[a].f > st.k[b].f ? 1 : 0) || (st.k[a].t || 0) - (st.k[b].t || 0));
    const heuteNeu = (st.tage[heute] && st.tage[heute].neu) || 0;
    let frei = Math.max(0, o.neuMax - heuteNeu);
    const neu = [];
    /* Gegenrichtung zuerst: die Wörter sind schon bekannt */
    alle.forEach(k => {
      if (!frei) return;
      const hin = st.k[schluessel("de-ru", k.id)], rueck = schluessel("ru-de", k.id);
      if (hin && hin.b >= 2 && !st.k[rueck]) { neu.push(rueck); frei--; }
    });
    alle.forEach(k => {
      if (!frei) return;
      const hin = schluessel("de-ru", k.id);
      if (!st.k[hin]) { neu.push(hin); frei--; }
    });
    return { faellig, neu, liste: faellig.concat(neu) };
  }

  /** Antwort eintragen. Gibt den neuen Stand zurück (der alte bleibt unverändert). */
  function antworten(stand, key, gewusst, heute, jetzt, sek) {
    const st = normStand(JSON.parse(JSON.stringify(stand || {})));
    const alt = st.k[key];
    const b = gewusst ? Math.min(5, (alt ? alt.b : 1) + 1) : 1;
    st.k[key] = { b, f: plusTage(heute, INTERVALL[gewusst ? b : 1]), n: ((alt && alt.n) || 0) + 1, r: ((alt && alt.r) || 0) + (gewusst ? 1 : 0), t: jetzt || Date.now() };
    const tg = st.tage[heute] = Object.assign({ n: 0, sek: 0, neu: 0 }, st.tage[heute]);
    tg.n++;
    if (!alt) tg.neu++;
    if (sek > 0) tg.sek = Math.round((tg.sek || 0) + sek);
    return st;
  }
  function zeitBuchen(stand, heute, sek) {
    const st = normStand(JSON.parse(JSON.stringify(stand || {})));
    if (sek > 0) { const tg = st.tage[heute] = Object.assign({ n: 0, sek: 0, neu: 0 }, st.tage[heute]); tg.sek = Math.round(tg.sek + sek); }
    return st;
  }

  /** Überblick: Karten je Fach, heute fällig, heute geübt */
  function ueberblick(alle, stand, heute) {
    const st = normStand(stand), r = runde(alle, st, heute);
    const faecher = [0, 0, 0, 0, 0];
    Object.keys(st.k).forEach(key => { faecher[st.k[key].b - 1]++; });
    const tg = st.tage[heute] || {};
    const sek = tg.sek || 0, n = tg.n || 0;
    return { gesamt: alle.length, gelernt: Object.keys(st.k).length, faecher, faellig: r.faellig.length, neuHeute: r.neu.length,
      heuteN: n, heuteSek: sek, fertig: sek >= ZIEL_SEK || (n > 0 && !r.faellig.length && !r.neu.length) };
  }

  /** Karte für die Anzeige */
  function seiten(k, richtung) {
    return richtung === "ru-de"
      ? { vorne: k.ru, vorneDe: false, hinten: k.de, hintenDe: true }
      : { vorne: k.de, vorneDe: true, hinten: k.ru, hintenDe: false };
  }

  /** Zusammenführen zweier Stände (Geräteabgleich): je Karte neuere t, je Tag größere Werte */
  function vereinigen(l, f) {
    const a = normStand(l), b = normStand(f), out = leerStand();
    new Set(Object.keys(a.k).concat(Object.keys(b.k))).forEach(key => {
      const x = a.k[key], y = b.k[key];
      out.k[key] = !x ? y : !y ? x : ((y.t || 0) > (x.t || 0) ? y : x);
    });
    new Set(Object.keys(a.tage).concat(Object.keys(b.tage))).forEach(d => {
      const x = a.tage[d] || {}, y = b.tage[d] || {};
      out.tage[d] = { n: Math.max(x.n || 0, y.n || 0), sek: Math.max(x.sek || 0, y.sek || 0), neu: Math.max(x.neu || 0, y.neu || 0) };
    });
    return out;
  }

  const api = { SK, INTERVALL, NEU_PRO_TAG, ZIEL_SEK, RICHTUNGEN, tagKey, plusTage, karten, normStand, runde, antworten, zeitBuchen, ueberblick, seiten, vereinigen, schluessel };

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  if (hatDom) {
    const $ = id => document.getElementById(id);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const knopf = (text, fn, cls) => { const b = el("button", "btn" + (cls ? " " + cls : ""), text); b.type = "button"; b.onclick = fn; return b; };
    let lesefehler = "";
    function lesen() {
      try {
        const roh = root.localStorage.getItem(SK);
        if (!roh) { lesefehler = ""; return leerStand(); }
        const x = JSON.parse(roh);
        if (!x || typeof x !== "object" || Array.isArray(x)) throw new Error("format");
        lesefehler = ""; return normStand(x);
      } catch (e) { lesefehler = "Сохранённые карточки не прочитаны — они оставлены как есть, новые ответы пока не сохраняются."; return leerStand(); }
    }
    function schreiben(st) {
      if (lesefehler) return false;
      try { root.localStorage.setItem(SK, JSON.stringify(st)); return true; } catch (e) { return false; }
    }
    const quellen = () => {
      let mein = {};
      try { mein = JSON.parse(root.localStorage.getItem("ap2:glossar:mein")) || {}; } catch (e) { mein = {}; }
      return { mein, wortschatz: root.IHK_WORTSCHATZ || [], glossar: root.IHK_GLOSSAR || [], gebiete: GEBIETE() };
    };
    const alleKarten = () => karten(quellen());
    const heute = () => tagKey(new Date());

    let LAUF = null;   /* { liste:[key], i, offen, start, sek, ergebnis:{ja,nein} } */
    function screen() {
      let s = $("scWort");
      if (s) return s;
      s = el("div", "seite wk-page"); s.id = "scWort"; s.hidden = true;
      const w = el("div", "wk-wrap"); w.id = "wkInhalt"; s.appendChild(w);
      const start = $("scStart");
      start.parentNode.insertBefore(s, start.nextSibling);
      return s;
    }
    function zeigen(fromHistory) {
      const s = screen();
      document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
      ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { if ($(k)) $(k).hidden = true; });
      if ($("kopfTitel")) $("kopfTitel").hidden = false;
      if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · Wortschatz";
      if ($("kTitel")) $("kTitel").textContent = "Карточки слов";
      if (!fromHistory) {
        try {
          if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
          history.pushState({ ihk: 1, seite: "scWort" }, "");
        } catch (e) { }
      }
      if (root.GENZURUECK) root.GENZURUECK.knopfPflegen();
      root.scrollTo(0, 0);
    }
    function oeffnen(fromHistory) { zeitStopp(); LAUF = null; zeigen(fromHistory); uebersicht(); }
    function starten() { zeigen(); neueRunde(); }

    /* ---- Zeit: zählt nur, solange die Karte sichtbar ist ---- */
    let uhr = null, seit = 0;
    function zeitStart() { if (!uhr) { seit = Date.now(); uhr = setInterval(zeitAnzeige, 1000); } }
    function zeitStopp() {
      if (!uhr) return 0;
      clearInterval(uhr); uhr = null;
      const sek = (Date.now() - seit) / 1000; seit = 0;
      if (LAUF) LAUF.sek += sek;
      return sek;
    }
    function zeitJetzt() { return LAUF ? LAUF.sek + (uhr ? (Date.now() - seit) / 1000 : 0) : 0; }
    function zeitAnzeige() {
      const b = $("wkZeit"); if (!b || !LAUF) return;
      const st = lesen(), vorher = ((st.tage[heute()] || {}).sek || 0);
      const ges = vorher + zeitJetzt() - LAUF.gebucht;
      b.style.width = Math.min(100, ges / ZIEL_SEK * 100) + "%";
      const t = $("wkZeitText"); if (t) t.textContent = Math.min(5, Math.floor(ges / 60)) + " из 5 минут сегодня";
    }

    function uebersicht() {
      const w = $("wkInhalt"); if (!w) return;
      w.replaceChildren();
      const alle = alleKarten(), st = lesen(), u = ueberblick(alle, st, heute());
      const c = el("section", "wk-card");
      c.appendChild(el("h2", null, "Карточки слов"));
      if (lesefehler) { const a = el("p", "wk-alert", lesefehler); a.setAttribute("role", "alert"); c.appendChild(a); }
      c.appendChild(el("p", "wk-muted", "Термины AP2 и Prüfungsdeutsch: сначала DE → RU, потом RU → DE. Знала — карточка уходит в следующую коробку и вернётся позже (1, 2, 4, 8, 16 дней). Не знала — снова в первую коробку."));
      const z = el("div", "wk-zahlen");
      [[u.faellig, "к повтору сегодня"], [u.neuHeute, "новых сегодня"], [u.gelernt, "карточек в работе"], [u.gesamt, "слов всего"]]
        .forEach(([n, t]) => { const d = el("div", "wk-zahl"); d.appendChild(el("b", null, String(n))); d.appendChild(el("span", null, t)); z.appendChild(d); });
      c.appendChild(z);
      const f = el("div", "wk-faecher"); f.setAttribute("aria-label", "Карточки по коробкам");
      u.faecher.forEach((n, i) => { const d = el("div", "wk-fach"); d.appendChild(el("b", null, String(n))); d.appendChild(el("span", null, "коробка " + (i + 1))); f.appendChild(d); });
      c.appendChild(f);
      const zt = el("p", "wk-muted", "Сегодня: " + Math.floor(u.heuteSek / 60) + " мин, ответов " + u.heuteN + (u.fertig ? " · норма дня ✓" : ""));
      c.appendChild(zt);
      const akt = el("div", "wk-akt");
      akt.appendChild(knopf(u.faellig + u.neuHeute ? "Начать: 5 минут" : "На сегодня всё", starten, "primary"));
      c.appendChild(akt);
      if (!(u.faellig + u.neuHeute)) c.appendChild(el("p", "wk-muted", "Новых карточек сегодня больше нет (не больше " + NEU_PRO_TAG + " в день), повторять нечего. Завтра будут новые."));
      w.appendChild(c);
      const q = el("p", "wk-muted wk-quelle", "Источники: «Мои слова» из «Nachschlagen» (первыми), Prüfungsdeutsch, термины глоссария AP2. Новое слово в свои карточки: выдели его в тексте задания → «Nachschlagen» → «+ Mein Glossar».");
      w.appendChild(q);
    }

    /* weiter: nach der Tagesnorm bewusst weitermachen — dann endet die Runde nicht nach 5 Minuten */
    function neueRunde(weiter) {
      const r = runde(alleKarten(), lesen(), heute());
      LAUF = { liste: r.liste.slice(), i: 0, offen: false, sek: 0, gebucht: 0, ja: 0, nein: 0, wiederholt: new Set(), weiterTrotzdem: !!weiter };
      karte();
    }
    function karte() {
      const w = $("wkInhalt"); if (!w || !LAUF) return;
      w.replaceChildren();
      const st = lesen(), u = ueberblick(alleKarten(), st, heute());
      const ges = ((st.tage[heute()] || {}).sek || 0) + zeitJetzt() - LAUF.gebucht;
      if (LAUF.i >= LAUF.liste.length || (ges >= ZIEL_SEK && LAUF.i > 0 && !LAUF.offen && LAUF.weiterTrotzdem !== true)) { ende(u); return; }
      const key = LAUF.liste[LAUF.i], [richtung, ...rest] = key.split("|"), id = rest.join("|");
      const k = alleKarten().find(x => x.id === id);
      if (!k) { LAUF.i++; karte(); return; }
      const s = seiten(k, richtung), e = st.k[key];
      const c = el("section", "wk-card wk-karte");
      const kopf = el("div", "wk-kopf");
      kopf.appendChild(el("span", "wk-badge", RICHTUNGEN[richtung]));
      kopf.appendChild(el("span", "wk-badge", e ? "коробка " + e.b : "новая"));
      kopf.appendChild(el("span", "wk-muted wk-pos", (LAUF.i + 1) + " / " + LAUF.liste.length));
      c.appendChild(kopf);
      const bar = el("div", "wk-zeit"); const fill = el("span"); fill.id = "wkZeit"; bar.appendChild(fill); c.appendChild(bar);
      const zt = el("p", "wk-muted wk-zeittext"); zt.id = "wkZeitText"; c.appendChild(zt);
      const vorne = el("p", "wk-vorne", s.vorne); if (s.vorneDe) vorne.lang = "de"; c.appendChild(vorne);
      if (s.vorneDe && root.GENVORLESEN) { const vk = root.GENVORLESEN.knopf(s.vorne); if (vk) c.appendChild(vk); }
      const hinten = el("div", "wk-hinten"); hinten.hidden = !LAUF.offen;
      const h = el("p", "wk-antwort", s.hinten); if (s.hintenDe) h.lang = "de"; hinten.appendChild(h);
      if (s.hintenDe && root.GENVORLESEN) { const vk = root.GENVORLESEN.knopf(s.hinten); if (vk) hinten.appendChild(vk); }
      if (k.beispiel) {
        const b = el("p", "wk-beispiel"); b.lang = "de"; b.textContent = k.beispiel; hinten.appendChild(b);
        if (root.GENVORLESEN) { const vk = root.GENVORLESEN.knopf(k.beispiel, { klasse: "ghost" }); if (vk) hinten.appendChild(vk); }
      }
      hinten.appendChild(el("p", "wk-muted", k.info));
      c.appendChild(hinten);
      const akt = el("div", "wk-akt");
      if (!LAUF.offen) {
        akt.appendChild(knopf("Показать ответ", () => { LAUF.offen = true; karte(); }, "primary wk-gross"));
        akt.appendChild(el("p", "wk-muted", richtung === "ru-de" ? "Скажи слово по-немецки вслух — с артиклем, если это существительное." : "Скажи перевод вслух, потом открой ответ."));
      } else {
        akt.appendChild(knopf("Не знала", () => bewerten(key, false), "wk-gross wk-nein"));
        akt.appendChild(knopf("Знала", () => bewerten(key, true), "primary wk-gross wk-ja"));
      }
      c.appendChild(akt);
      w.appendChild(c);
      w.appendChild(knopf("Закончить", () => { zeitBuchenJetzt(); oeffnen(); }, "ghost"));
      zeitStart(); zeitAnzeige();
    }
    function zeitBuchenJetzt() {
      if (!LAUF) return;
      zeitStopp();
      const offen = LAUF.sek - LAUF.gebucht;
      if (offen > 0) { const st = zeitBuchen(lesen(), heute(), offen); schreiben(st); LAUF.gebucht = LAUF.sek; }
    }
    function bewerten(key, gewusst) {
      zeitStopp();
      const sek = LAUF.sek - LAUF.gebucht;
      const st = antworten(lesen(), key, gewusst, heute(), Date.now(), sek);
      if (!schreiben(st)) { const w = $("wkInhalt"); if (w) { const a = el("p", "wk-alert", lesefehler || "Не удалось сохранить: память браузера переполнена или недоступна."); a.setAttribute("role", "alert"); w.prepend(a); } }
      LAUF.gebucht = LAUF.sek;
      if (gewusst) LAUF.ja++; else { LAUF.nein++; if (!LAUF.wiederholt.has(key)) { LAUF.wiederholt.add(key); LAUF.liste.push(key); } }
      LAUF.i++; LAUF.offen = false;
      karte();
      try { if (root.GENHEUTE && root.GENHEUTE.zeichnen) root.GENHEUTE.zeichnen(); } catch (e) { }
    }
    function ende(u) {
      zeitStopp();
      const w = $("wkInhalt"); w.replaceChildren();
      const c = el("section", "wk-card");
      c.appendChild(el("h2", null, u.fertig ? "Норма дня ✓" : "Круг закончен"));
      c.appendChild(el("p", null, "Знала: " + LAUF.ja + " · не знала: " + LAUF.nein + ". Сегодня " + Math.floor(u.heuteSek / 60) + " мин."));
      c.appendChild(el("p", "wk-muted", "Не знала — эти карточки вернутся завтра. Знала — позже, по коробкам."));
      const akt = el("div", "wk-akt");
      const r = runde(alleKarten(), lesen(), heute());
      if (r.liste.length) akt.appendChild(knopf("Ещё карточки (" + r.liste.length + ")", () => neueRunde(true), "primary"));
      akt.appendChild(knopf("К обзору", () => oeffnen()));
      c.appendChild(akt);
      w.appendChild(c);
    }
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") zeitBuchenJetzt(); else if (LAUF && $("scWort") && !$("scWort").hidden) zeitStart(); });
    document.addEventListener("keydown", ev => {
      const s = $("scWort"); if (!s || s.hidden || !LAUF) return;
      const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      if (ev.key === " " && !LAUF.offen) { ev.preventDefault(); LAUF.offen = true; karte(); }
      else if (LAUF.offen && (ev.key === "1" || ev.key === "2")) { ev.preventDefault(); bewerten(LAUF.liste[LAUF.i], ev.key === "2"); }
    });

    function hook() {
      const alt = root.schirm;
      if (typeof alt === "function" && !alt.__wk) {
        const neu = function (name) {
          if (name === "scWort") { oeffnen(true); return; }
          const s = $("scWort"); if (s && !s.hidden) { zeitBuchenJetzt(); s.hidden = true; }
          return alt.apply(this, arguments);
        };
        neu.__wk = true; root.schirm = neu;
      }
    }
    api.oeffnen = () => oeffnen();
    api.starten = starten;
    api.heute = () => ueberblick(alleKarten(), lesen(), heute());
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  }

  root.GENWORTKARTEN = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
