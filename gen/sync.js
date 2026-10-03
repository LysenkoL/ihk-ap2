/* ============================================================================
   gen/sync.js — Handy ↔ Computer abgleichen, ohne dass etwas verloren geht
   ----------------------------------------------------------------------------
   Der alte Weg (Fortschritt exportieren/importieren) fragte mit zwei
   confirm-Fenstern „OK = zusammenführen, Abbrechen = ersetzen“, ließ bei
   Konflikten immer das Gerät gewinnen, auf dem importiert wird, und
   ADDIERTE Zähler — wer hin und zurück abglich, hatte doppelte Statistik.
   Den Azubi-Navigator kannte er gar nicht: dort gewann einfach eine Seite.

   Neu:
   - Jede Änderung an einem ap2:-Schlüssel bekommt einen Zeitstempel
     (ap2-sync:meta). So weiß der Abgleich, welche Fassung neuer ist.
   - „Stand senden“: eine Datei, über das Teilen-Menü (Telegram, Mail, Drive)
     oder als Download.
   - „Stand holen“: Datei wählen — der Rest passiert von selbst:
       Antworten, Punkte, Stand      → beide Seiten; bei Widerspruch die neuere
       Azubi-Navigator               → je Teilaufgabe zusammengeführt
       Fehler wiederholen            → je Aufgabe die Fassung mit mehr Übung
       Listen (Archiv, Durchgänge …) → vereinigt
       Zähler (Karten, Generator)    → Maximum statt Summe: hin und zurück
                                        abgleichen verdoppelt nichts
   - Vorher wird der eigene Stand gesichert: „Rückgängig“ holt ihn zurück.
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined";
  const PRAEFIX = "ap2:";
  const K_META = "ap2-sync:meta", K_GERAET = "ap2-sync:geraet", K_LETZTE = "ap2-sync:letzte", K_BACKUP = "ap2-sync:backup";

  /* ======================================================================
     Zusammenführen — reine Funktionen (tests/sync.test.js)
     ====================================================================== */
  const parse = r => { try { return JSON.parse(r); } catch (e) { return undefined; } };
  const istObj = v => v && typeof v === "object" && !Array.isArray(v);
  const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /* Objekt-Reihenfolge ist keine neue Antwort oder ein neuer Versuch. */
  const inhalt = v => Array.isArray(v) ? "[" + v.map(inhalt).join(",") + "]" : istObj(v)
    ? "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + inhalt(v[k])).join(",") + "}"
    : JSON.stringify(v);
  const hat = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  function eindeutige(l, f, id = inhalt) {
    const out = [], gesehen = new Set();
    (Array.isArray(l) ? l : []).concat(Array.isArray(f) ? f : []).forEach(x => {
      const k = id(x);
      if (!gesehen.has(k)) { gesehen.add(k); out.push(x); }
    });
    return out;
  }

  const LISTEN = { "ap2:archiv": "id", "ap2:attempts": "datum", "ap2:gen:blaetter": "id", "ap2:gen:fehler": "schluessel" };
  const ZAEHLER = { "ap2:gen:stat": ["versuche", "punkte", "max"], "ap2:cards": ["richtig", "falsch"] };

  /** Objekte je Eintrag vereinigen; bei Widerspruch gewinnt `fremdNeuer` ? fremd : lokal */
  function vereinige(l, f, fremdNeuer, b) {
    const out = Object.assign({}, l);
    Object.keys(f).forEach(k => {
      if (!(k in l)) { out[k] = f[k]; b.neu++; return; }
      if (gleich(l[k], f[k])) return;
      b.konflikt++;
      if (fremdNeuer) { out[k] = f[k]; b.geaendert++; }
    });
    return out;
  }

  function azubiZustand(l, f, b) {
    const fNeuer = (f.zuletzt || 0) > (l.zuletzt || 0);
    const neuer = fNeuer ? f : l, aelter = fNeuer ? l : f;
    const out = Object.assign({}, aelter, neuer);
    const felder = ["a", "p", "auto", "auf", "hilfe"], ids = new Set();
    felder.forEach(feld => {
      out[feld] = {};
      [l, f].forEach(z => Object.keys(istObj(z[feld]) ? z[feld] : {}).forEach(id => ids.add(id)));
    });
    const teilStand = (z, id) => {
      const s = {};
      felder.forEach(feld => { if (istObj(z[feld]) && hat(z[feld], id)) s[feld] = z[feld][id]; });
      return s;
    };
    /* Keine Zeit je Teilaufgabe vorhanden: die Modulzeit wählt nur die aktive
       Fassung. Beide Originale bleiben als Konflikt erhalten, ohne erfundene
       Punktesumme oder einen vermeintlichen abgeschlossenen Versuch. */
    const konflikte = eindeutige(l.konflikte, f.konflikte,
      x => istObj(x) && hat(x, "stand") ? inhalt({ teil: x.teil, stand: x.stand }) : inhalt(x));
    ids.forEach(id => {
      const x = teilStand(l, id), y = teilStand(f, id);
      let s = x;
      if (!Object.keys(x).length) { s = y; b.neu++; }
      else if (Object.keys(y).length && inhalt(x) !== inhalt(y)) {
        b.konflikt++;
        konflikte.push({ teil: id, zuletzt: l.zuletzt || 0, stand: x }, { teil: id, zuletzt: f.zuletzt || 0, stand: y });
        if (inhalt(x.a) !== inhalt(y.a)) s = fNeuer ? y : x;
        else {
          s = Object.assign({}, fNeuer ? x : y, fNeuer ? y : x);
          /* Bei gleicher Antwort kann die andere Seite die Bewertung haben.
             Ihre Auto-Markierung muss mit genau dieser Bewertung wandern. */
          const bewertung = hat(x, "p") && hat(y, "p") ? (fNeuer ? y : x) : hat(y, "p") ? y : x;
          delete s.auto;
          if (hat(bewertung, "auto") && bewertung.p != null) s.auto = bewertung.auto;
          if (x.auf || y.auf) s.auf = x.auf || y.auf;
          if (istObj(x.hilfe) && istObj(y.hilfe)) {
            s.hilfe = Object.assign({}, x.hilfe, y.hilfe);
            ["vorAntwort", "nachLoesung"].forEach(k => { if (hat(x.hilfe, k) || hat(y.hilfe, k)) s.hilfe[k] = !!(x.hilfe[k] || y.hilfe[k]); });
            const zeiten = [x.hilfe.loesungGezeigt, y.hilfe.loesungGezeigt].filter(t => typeof t === "number" && t > 0);
            if (zeiten.length) s.hilfe.loesungGezeigt = Math.min(...zeiten);
          }
        }
        /* Gemeinsame Hilfe-Merkmale können einen dritten Stand ergeben.
           Er ist ausdrücklich als Zusammenführung markiert. Gleich mit
           sichern, damit ein wiederholter Import keine neue Version erzeugt. */
        if (inhalt(s) !== inhalt(x) && inhalt(s) !== inhalt(y)) {
          konflikte.push({ teil: id, zuletzt: Math.max(l.zuletzt || 0, f.zuletzt || 0), stand: s, zusammengefuehrt: true });
        }
        if (inhalt(s) !== inhalt(x)) b.geaendert++;
      }
      felder.forEach(feld => { if (hat(s, feld)) out[feld][id] = s[feld]; });
      if (out.p[id] == null) delete out.auto[id];
    });
    out.konflikte = eindeutige(konflikte, [],
      x => istObj(x) && hat(x, "stand") ? inhalt({ teil: x.teil, stand: x.stand }) : inhalt(x));
    out.versuche = eindeutige(l.versuche, f.versuche).sort((a, x) => ((a && a.d) || 0) - ((x && x.d) || 0));
    b.neu += Math.max(0, out.versuche.length - (Array.isArray(l.versuche) ? l.versuche.length : 0));
    out.zeit = Math.max(l.zeit || 0, f.zeit || 0);
    out.abgegeben = !!(neuer.abgegeben);
    out.modus = neuer.modus || aelter.modus || null;
    const starts = [l.start, f.start].filter(t => typeof t === "number" && t > 0);
    out.start = starts.length ? Math.min(...starts) : 0;
    out.zuletzt = Math.max(l.zuletzt || 0, f.zuletzt || 0);
    out.pos = neuer.pos || aelter.pos || null;
    return out;
  }

  /* Quiz/Algo speichern kumulative Zähler, keine eindeutigen Ereignisse.
     Das Maximum erhält bekannte Übung, ohne Hin-und-zurück zu addieren.
     Beim Quiz ist ok dagegen der letzte Erfolg/Misserfolg, kein Zähler. */
  function uebungsStand(l, f, b, quiz) {
    const out = Object.assign({}, l);
    Object.keys(f).forEach(id => {
      const x = out[id], y = f[id];
      if (!hat(out, id)) { out[id] = y; b.neu++; return; }
      if (gleich(x, y)) return;
      if (quiz && id.indexOf("g:") === 0 && typeof x === "number" && typeof y === "number") {
        out[id] = Math.max(x, y);
      } else if (istObj(x) && istObj(y)) {
        const yNeuer = (y.t || 0) > (x.t || 0);
        const z = Object.assign({}, yNeuer ? x : y, yNeuer ? y : x);
        (quiz ? ["n", "f"] : ["n", "ok", "fehler"]).forEach(k => {
          if (typeof x[k] === "number" || typeof y[k] === "number") z[k] = Math.max(x[k] || 0, y[k] || 0);
        });
        const konflikte = eindeutige(x.konflikte, y.konflikte);
        if (quiz && (x.t || 0) === (y.t || 0) && hat(x, "ok") && hat(y, "ok") && x.ok !== y.ok) {
          konflikte.push({ ok: x.ok, t: x.t || 0 }, { ok: y.ok, t: y.t || 0 });
          /* Die Reihenfolge ist unbekannt: nicht als sicher richtig zeigen. */
          z.ok = 0; b.konflikt++;
        }
        if (konflikte.length) z.konflikte = eindeutige(konflikte, []);
        out[id] = z;
      }
      if (!gleich(out[id], x)) b.geaendert++;
    });
    return out;
  }

  function wiederholen(l, f, b) {
    const out = { k: Object.assign({}, l.k || {}), tage: Object.assign({}, l.tage || {}) };
    Object.keys(f.k || {}).forEach(id => {
      const x = out.k[id], y = f.k[id];
      if (!x) { out.k[id] = y; b.neu++; return; }
      if (gleich(x, y)) return;
      b.konflikt++;
      if ((y.n || 0) > (x.n || 0) || ((y.n || 0) === (x.n || 0) && (y.t || 0) > (x.t || 0))) { out.k[id] = y; b.geaendert++; }
    });
    Object.keys(f.tage || {}).forEach(d => { out.tage[d] = Math.max(out.tage[d] || 0, f.tage[d] || 0); });
    return out;
  }

  /* Je Eintrag gewinnt der zuletzt geänderte (Zeitstempel im Eintrag selbst):
     „Fehler durchgehen“ (ap2:analyse → k[id].t) und Papier-Fehler
     (ap2:papier → [id].geaendert). Sonst gewänne das ganze Objekt der
     Seite, die zuletzt irgendetwas geändert hat.                          */
  function jeEintrag(l, f, b, feld) {
    const out = Object.assign({}, l);
    Object.keys(f).forEach(id => {
      const x = out[id], y = f[id];
      if (!istObj(y)) return;
      if (!istObj(x)) { out[id] = y; b.neu++; return; }
      if (gleich(x, y)) return;
      b.konflikt++;
      if ((y[feld] || 0) > (x[feld] || 0)) { out[id] = y; b.geaendert++; }
    });
    return out;
  }

  /* SQL-Trainer: je Aufgabe „gelöst“ bleibt gelöst, Versuche als Maximum,
     der zuletzt geschriebene Code gewinnt. */
  function sqlStand(l, f, fNeuer, b) {
    const out = Object.assign({}, fNeuer ? l : f, fNeuer ? f : l, { a: Object.assign({}, l.a || {}) });
    Object.keys(f.a || {}).forEach(id => {
      const x = out.a[id], y = f.a[id];
      if (!istObj(y)) return;
      if (!istObj(x)) { out.a[id] = y; b.neu++; return; }
      if (gleich(x, y)) return;
      const z = Object.assign({}, (y.t || 0) > (x.t || 0) ? x : y, (y.t || 0) > (x.t || 0) ? y : x);
      ["ok", "n", "gesehen"].forEach(n => { const m = Math.max(x[n] || 0, y[n] || 0); if (m) z[n] = m; });
      if (!gleich(z, x)) { out.a[id] = z; b.geaendert++; }
    });
    return out;
  }

  /* Kurzfragen: je Karte die zuletzt geübte Fassung, Zähler als Maximum */
  function satzStand(l, f, b) {
    const out = Object.assign({}, l);
    Object.keys(f).forEach(id => {
      const x = out[id], y = f[id];
      if (!istObj(y)) return;
      if (!istObj(x)) { out[id] = y; b.neu++; return; }
      if (gleich(x, y)) return;
      const z = Object.assign({}, (y.t || 0) > (x.t || 0) ? x : y, (y.t || 0) > (x.t || 0) ? y : x);
      ["versuche", "bestPunkte", "wahlN", "wahlOk"].forEach(n => { const m = Math.max(x[n] || 0, y[n] || 0); if (m) z[n] = m; });
      if (!gleich(z, x)) { out[id] = z; b.geaendert++; }
    });
    return out;
  }

  /**
   * Einen Schlüssel zusammenführen. Rückgabe: neuer Rohwert (String) oder null = lokal bleibt.
   * lm/fm: Zeitstempel der letzten Änderung (0 = unbekannt).
   */
  function mischeSchluessel(k, lRoh, fRoh, lm, fm, b) {
    if (fRoh == null) return null;
    if (lRoh == null) { b.neu++; return fRoh; }
    if (lRoh === fRoh) return null;
    const l = parse(lRoh), f = parse(fRoh);
    const fNeuer = (fm || 0) > (lm || 0);
    if (l === undefined || f === undefined) { b.konflikt++; if (fNeuer) { b.geaendert++; return fRoh; } return null; }

    let out;
    if (LISTEN[k] && Array.isArray(l) && Array.isArray(f)) {
      const id = LISTEN[k], pos = {};
      out = l.slice();
      out.forEach((x, i) => { if (x && x[id] != null) pos[x[id]] = i; });
      f.forEach(x => {
        if (!x || x[id] == null) return;
        if (!(x[id] in pos)) { out.push(x); b.neu++; return; }
        const i = pos[x[id]];
        if (gleich(out[i], x)) return;
        b.konflikt++;
        if (fNeuer) { out[i] = x; b.geaendert++; }
      });
      if (id === "datum") out.sort((a, x) => String(a.datum || "").localeCompare(String(x.datum || "")));
    } else if (ZAEHLER[k] && istObj(l) && istObj(f)) {
      out = Object.assign({}, l);
      Object.keys(f).forEach(e => {
        const x = out[e], y = f[e];
        if (!istObj(y)) return;
        if (!istObj(x)) { out[e] = y; b.neu++; return; }
        const z = Object.assign({}, x);
        let anders = false;
        ZAEHLER[k].forEach(n => { if (typeof y[n] === "number" && y[n] > (x[n] || 0)) { z[n] = y[n]; anders = true; } });
        if (anders) { out[e] = z; b.geaendert++; }
      });
    } else if (k === "ap2:zeit" && istObj(l) && istObj(f) && istObj(f.karten)) {
      out = Object.assign({}, l, { karten: Object.assign({}, l.karten || {}) });
      Object.keys(f.karten).forEach(e => {
        const x = out.karten[e], y = f.karten[e];
        if (!x) { out.karten[e] = y; b.neu++; return; }
        const z = Object.assign({}, x, { s: Math.max(x.s || 0, y.s || 0), z: Math.max(x.z || 0, y.z || 0) });
        if (!z.be && y.be) z.be = y.be;
        if (!gleich(z, x)) { out.karten[e] = z; b.geaendert++; }
      });
    } else if (/^ap2:azubi:/.test(k) && !nurHier(k) && istObj(l) && istObj(f)) {
      out = azubiZustand(l, f, b);
    } else if ((k === "ap2:lernen" || k === "ap2:algo") && istObj(l) && istObj(f)) {
      out = uebungsStand(l, f, b, k === "ap2:lernen");
    } else if (k === "ap2:gen:satz" && istObj(l) && istObj(f)) {
      out = satzStand(l, f, b);
    } else if (k === "ap2:sql" && istObj(l) && istObj(f)) {
      out = sqlStand(l, f, fNeuer, b);
    } else if (k === "ap2:wieder" && istObj(l) && istObj(f)) {
      out = wiederholen(l, f, b);
    } else if (k === "ap2:analyse" && istObj(l) && istObj(f)) {
      out = Object.assign({}, l, { k: jeEintrag(istObj(l.k) ? l.k : {}, istObj(f.k) ? f.k : {}, b, "t") });
    } else if (k === "ap2:papier" && istObj(l) && istObj(f)) {
      out = jeEintrag(l, f, b, "geaendert");
    } else if (k === "ap2:endspurt" && istObj(l) && istObj(f)) {
      const neuer = fNeuer ? f : l;
      out = Object.assign({}, fNeuer ? l : f, neuer);
      out.erledigt = Object.assign({}, l.erledigt || {}, f.erledigt || {});
      if (!gleich(out, l)) b.geaendert++;
    } else if (istObj(l) && istObj(f)) {
      out = vereinige(l, f, fNeuer, b);
    } else {
      b.konflikt++;
      if (fNeuer) { b.geaendert++; return fRoh; }
      return null;
    }
    const roh = JSON.stringify(out);
    return roh === lRoh ? null : roh;
  }

  /** Alles zusammenführen. Rückgabe: { schreiben: {k: roh}, bericht: {k: {neu, geaendert, konflikt}} } */
  function mische(lokal, lokalMeta, fremd, fremdMeta) {
    const schreiben = {}, bericht = {};
    Object.keys(fremd || {}).forEach(k => {
      if (k.indexOf(PRAEFIX) !== 0 || nurHier(k) || typeof fremd[k] !== "string") return;
      const b = { neu: 0, geaendert: 0, konflikt: 0 };
      const r = mischeSchluessel(k, lokal[k], fremd[k], (lokalMeta || {})[k] || 0, (fremdMeta || {})[k] || 0, b);
      if (r != null) { schreiben[k] = r; bericht[k] = b; }
    });
    return { schreiben, bericht };
  }

  /* Für den Bericht: welcher Schlüssel gehört zu welchem Bereich */
  function bereichVon(k) {
    if (/^ap2:azubi:azprog/.test(k)) return "Prognose-Prüfungen";
    if (k === "ap2:pruefen:chats") return "Claude-Chats je Prüfung";
    if (/^ap2:azubi:/.test(k) && !nurHier(k)) return "Azubi-Navigator";
    if (k === "ap2:answers" || k === "ap2:scores" || k === "ap2:timer") return "Prüfungen (Antworten, Punkte)";
    if (k === "ap2:attempts" || k === "ap2:archiv") return "Durchgänge und Archiv";
    if (k === "ap2:wieder") return "Fehler wiederholen";
    if (k === "ap2:analyse") return "Fehler durchgehen";
    if (k === "ap2:papier") return "Papier-Fehler";
    if (k === "ap2:gen:satz" || k === "ap2:satz:ein") return "Kurzfragen";
    if (k.indexOf("ap2:gen:") === 0) return "Generator und Fehlerjournal";
    if (k === "ap2:cards") return "Karteikarten";
    if (k.indexOf("ap2:glossar") === 0) return "Fachbegriffe";
    if (k.indexOf("ap2:katalog") === 0) return "Prüfungskatalog";
    if (k === "ap2:endspurt" || k === "ap2:plan") return "Plan";
    if (k.indexOf("ap2:komp") === 0 || k.indexOf("ap2:spick") === 0) return "Kompendium und Spickzettel";
    if (k.indexOf("ap2:sql") === 0) return "SQL-Trainer";
    if (k === "ap2:lernen") return "Themen und Quiz";
    if (k === "ap2:algo") return "Sortieren & Suchen";
    if (k.indexOf("ap2:marker") === 0 || k === "ap2:lesezeichen") return "Markierungen und Lesezeichen";
    if (k === "ap2:zeit") return "Lernzeit";
    if (/^ap2:(theme|start:|pwa:|druck:|er:|veraltet|pseudo|import-history|algo:ui)|:ui$/.test(k)) return "Einstellungen";
    return "Sonstiges";
  }

  /* ======================================================================
     Zeitstempel mitschreiben — muss früh laden (vor den anderen Modulen)
     ====================================================================== */
  let META = {};
  let echt = null;       /* die ursprünglichen Storage-Methoden */
  if (hatDom && root.localStorage && root.Storage) {
    try { META = JSON.parse(localStorage.getItem(K_META) || "{}") || {}; } catch (e) { META = {}; }
    echt = { set: Storage.prototype.setItem, get: Storage.prototype.getItem, del: Storage.prototype.removeItem };
    let metaTimer = null;
    const metaSichern = () => { clearTimeout(metaTimer); metaTimer = setTimeout(() => { try { echt.set.call(localStorage, K_META, JSON.stringify(META)); } catch (e) { } }, 400); };
    Storage.prototype.setItem = function (k, v) {
      if (this === root.localStorage && typeof k === "string" && k.indexOf(PRAEFIX) === 0) {
        let alt = null;
        try { alt = echt.get.call(this, k); } catch (e) { }
        echt.set.call(this, k, v);
        if (alt !== String(v)) { META[k] = Date.now(); metaSichern(); }
        return;
      }
      return echt.set.call(this, k, v);
    };
    Storage.prototype.removeItem = function (k) {
      if (this === root.localStorage && typeof k === "string" && k.indexOf(PRAEFIX) === 0) { META[k] = Date.now(); metaSichern(); }
      return echt.del.call(this, k);
    };
    root.addEventListener("pagehide", () => { try { echt.set.call(localStorage, K_META, JSON.stringify(META)); } catch (e) { } });
  }
  const setzeEcht = (k, v) => (echt ? echt.set : Storage.prototype.setItem).call(localStorage, k, v);

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };

  function geraet() {
    let g = lies(K_GERAET, null);
    if (!g || !g.id) {
      const ua = (root.navigator && navigator.userAgent) || "";
      const name = /iPad|Tablet/i.test(ua) ? "Tablet" : /iPhone|Android|Mobile/i.test(ua) ? "Handy" : "Computer";
      g = { id: Math.random().toString(36).slice(2, 10), name };
      try { setzeEcht(K_GERAET, JSON.stringify(g)); } catch (e) { }
    }
    return g;
  }
  /* Nur für dieses Gerät: Farbschema, offene Blöcke, Filter, Installationshinweis */
  const NUR_HIER = /^ap2:(theme$|pwa:|start:offen$|druck:opt$)|:ui$/;
  const nurHier = k => NUR_HIER.test(k);

  function alleWerte() {
    const o = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(PRAEFIX) === 0 && !nurHier(k)) o[k] = localStorage.getItem(k);
    }
    return o;
  }
  const zeitText = ts => {
    const d = new Date(ts);
    return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + ". " +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };

  /* ---------------------------------------------------------- senden --- */
  function senden(knopf) {
    const g = geraet();
    try { setzeEcht(K_META, JSON.stringify(META)); } catch (e) { }
    const daten = { typ: "ap2-sync", version: 1, geraet: g, zeit: new Date().toISOString(),
                    herkunft: location.protocol === "file:" ? "Datei" : location.origin,
                    speicher: alleWerte(), meta: META };
    const text = JSON.stringify(daten);
    const d = new Date();
    const name = "ap2-stand_" + g.name + "_" + d.toISOString().slice(0, 10) + "_" +
      String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0") + ".json";
    const kb = Math.round(text.length / 1024);
    let datei = null;
    try { datei = new File([text], name, { type: "application/json" }); } catch (e) { }
    const runter = () => {
      const a = el("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      meldung("Gespeichert: " + name + " (" + kb + " KB). Jetzt an dich selbst schicken und auf dem anderen Gerät „Stand holen“.");
    };
    if (datei && navigator.canShare && navigator.canShare({ files: [datei] })) {
      navigator.share({ files: [datei], title: "IHK AP2 — mein Stand", text: "Auf dem anderen Gerät: Startseite → Daten → „Stand holen“." })
        .then(() => meldung("Gesendet (" + kb + " KB). Auf dem anderen Gerät „Stand holen“."))
        .catch(e => { if (!e || e.name !== "AbortError") runter(); });
    } else runter();
    if (knopf) { knopf.textContent = "Stand senden ✓"; setTimeout(() => { knopf.textContent = "Stand senden"; }, 2500); }
  }

  /* ----------------------------------------------------------- holen --- */
  function holen(datei) {
    const r = new FileReader();
    r.onload = () => {
      let d;
      try { d = JSON.parse(r.result); } catch (e) { meldung("Das ist keine gültige Datei.", true); return; }
      let speicher = null, meta = {}, von = "anderes Gerät";
      if (d && d.typ === "ap2-sync" && d.speicher) { speicher = d.speicher; meta = d.meta || {}; von = (d.geraet && d.geraet.name) || von; }
      else if (d && d.typ === "ihk-ap2-fortschritt" && d.speicher) { speicher = d.speicher; von = "alte Sicherung"; }
      if (!speicher) { meldung("Diese Datei enthält keinen Stand der App.", true); return; }
      if (d.geraet && d.geraet.id && d.geraet.id === geraet().id) {
        meldung("Diese Datei stammt von diesem Gerät selbst — nichts zu tun.", true); return;
      }
      const lokal = alleWerte();
      const { schreiben, bericht } = mische(lokal, META, speicher, meta);
      const keys = Object.keys(schreiben);
      if (!keys.length) {
        setzeEcht(K_LETZTE, JSON.stringify({ zeit: Date.now(), von, bereiche: {} }));
        meldung("Schon auf dem gleichen Stand — nichts zu übernehmen.");
        zeichnen();
        return;
      }
      /* eigenen Stand vorher sichern — für „Rückgängig“ */
      let gesichert = true;
      try { setzeEcht(K_BACKUP, JSON.stringify({ zeit: Date.now(), speicher: lokal, meta: META })); } catch (e) { gesichert = false; }
      const bereiche = {};
      keys.forEach(k => {
        const b = bericht[k], name = bereichVon(k);
        const z = bereiche[name] || (bereiche[name] = { neu: 0, geaendert: 0 });
        z.neu += b.neu; z.geaendert += b.geaendert;
      });
      try {
        keys.forEach(k => {
          setzeEcht(k, schreiben[k]);
          META[k] = Math.max(META[k] || 0, meta[k] || 0, 1);
        });
        setzeEcht(K_META, JSON.stringify(META));
        setzeEcht(K_LETZTE, JSON.stringify({ zeit: Date.now(), von, bereiche, gesichert }));
      } catch (e) {
        meldung("Speicher voll — der Abgleich wurde nicht abgeschlossen." + (gesichert ? " „Rückgängig“ stellt den alten Stand her." : ""), true);
        return;
      }
      /* Die laufende Seite hält alte Werte im Kopf und würde sie zurückschreiben */
      try { Storage.prototype.setItem = function () { }; } catch (e) { }
      location.reload();
    };
    r.readAsText(datei, "utf-8");
  }

  function rueckgaengig() {
    const b = lies(K_BACKUP, null);
    if (!b || !b.speicher) { meldung("Keine Sicherung vorhanden.", true); return; }
    const jetzt = alleWerte();
    Object.keys(jetzt).forEach(k => { if (!(k in b.speicher)) { try { echt ? echt.del.call(localStorage, k) : localStorage.removeItem(k); } catch (e) { } } });
    Object.keys(b.speicher).forEach(k => { try { setzeEcht(k, b.speicher[k]); } catch (e) { } });
    META = b.meta || {};
    try { setzeEcht(K_META, JSON.stringify(META)); localStorage.removeItem(K_BACKUP); localStorage.removeItem(K_LETZTE); } catch (e) { }
    try { Storage.prototype.setItem = function () { }; } catch (e) { }
    location.reload();
  }

  let meldTimer = null;
  function meldung(t, fehler) {
    if (typeof root.toast === "function" && !fehler) { root.toast(t); return; }
    let m = $("syMeldung");
    if (!m) { m = el("div", "sy-meldung"); m.id = "syMeldung"; m.setAttribute("role", "status"); document.body.appendChild(m); }
    m.textContent = t; m.classList.toggle("fehler", !!fehler); m.classList.add("an");
    clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove("an"), 6000);
  }

  /* --------------------------------------------------------- Anzeige --- */
  function zeichnen() {
    const alt = $("btnExport");
    const abschnitt = alt && alt.closest(".abschnitt");
    if (!abschnitt) return;
    let box = $("syBox");
    if (!box) {
      box = el("div", "sy-box"); box.id = "syBox";
      const h2 = abschnitt.querySelector("h2");
      if (h2) h2.insertAdjacentElement("afterend", box); else abschnitt.insertBefore(box, abschnitt.firstChild);
      /* den alten Weg in eine Klappe — er bleibt für alte Dateien */
      const steuer = alt.closest(".steuer");
      const klappe = el("details", "sy-alt");
      klappe.appendChild(el("summary", null, "Sicherung als Datei (alter Weg, mit Rückfragen)"));
      Array.from(abschnitt.children).forEach(c => { if (c !== box && c !== h2 && c !== klappe) klappe.appendChild(c); });
      abschnitt.appendChild(klappe);
      if (steuer && !klappe.contains(steuer)) klappe.appendChild(steuer);
      if (h2) h2.textContent = "Geräte abgleichen & sichern";
    }
    box.innerHTML = "";
    const g = geraet();
    const L = lies(K_LETZTE, null);
    box.appendChild(el("p", "sy-geraet", "Dieses Gerät: " + g.name + (location.protocol === "file:" ? " (Datei vom Rechner)" : "") +
      (L ? " · zuletzt abgeglichen " + zeitText(L.zeit) + " mit " + L.von : " · noch nie abgeglichen")));
    if (L && L.bereiche && Object.keys(L.bereiche).length && Date.now() - L.zeit < 30 * 60000) {
      const erg = el("div", "sy-ergebnis");
      erg.appendChild(el("b", null, "Abgleich fertig — übernommen:"));
      const ul = el("ul");
      Object.keys(L.bereiche).forEach(n => {
        const z = L.bereiche[n];
        ul.appendChild(el("li", null, n + (z.neu ? " · " + z.neu + " neu" : "") + (z.geaendert ? " · " + z.geaendert + " aktualisiert" : "")));
      });
      erg.appendChild(ul);
      if (lies(K_BACKUP, null)) {
        const rz = el("button", "btn ghost klein", "Rückgängig");
        rz.type = "button"; rz.onclick = () => { if (root.confirm ? root.confirm("Den Stand von vor dem Abgleich wiederherstellen?") : true) rueckgaengig(); };
        erg.appendChild(rz);
      }
      box.appendChild(erg);
    }
    const ol = el("ol", "sy-schritte");
    const li1 = el("li"); li1.appendChild(el("b", null, "Wo du zuletzt gelernt hast: ")); li1.appendChild(document.createTextNode("„Stand senden“ und an dich selbst schicken (Telegram, Mail, Drive)."));
    const li2 = el("li"); li2.appendChild(el("b", null, "Auf dem anderen Gerät: ")); li2.appendChild(document.createTextNode("„Stand holen“ und die Datei wählen. Beides wird zusammengeführt — nichts wird einfach überschrieben."));
    ol.append(li1, li2);
    box.appendChild(ol);
    const st = el("div", "steuer");
    const s = el("button", "btn primary", "Stand senden"); s.type = "button"; s.onclick = () => senden(s);
    const h = el("label", "btn sy-datei");
    h.appendChild(el("span", null, "Stand holen"));
    const inp = el("input"); inp.type = "file"; inp.accept = ".json,application/json"; inp.id = "syDatei";
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) holen(f); inp.value = ""; };
    h.appendChild(inp);
    st.append(s, h);
    box.appendChild(st);
    box.appendChild(el("p", "sy-klein", "Enthalten: alle Antworten, Punkte, Azubi-Navigator-Fortschritt, Fehler, Fachbegriffe, Katalog-Stand, Plan, SQL-Trainer und Statistik. " +
      "Nicht enthalten: das Azubi-Paket selbst (das lädst du einmal pro Gerät)."));
  }

  function einhaengen() {
    const altStart = root.renderStart;
    if (typeof altStart === "function" && !altStart.__sy) {
      const neu = function () { const r = altStart.apply(this, arguments); try { zeichnen(); } catch (e) { console.error("Sync:", e); } return r; };
      neu.__sy = true; root.renderStart = neu;
    }
    try { zeichnen(); } catch (e) { console.error("Sync:", e); }
    /* nach einem Abgleich: den Bereich einmal aufklappen, damit man das Ergebnis sieht */
    const L = lies(K_LETZTE, null);
    if (L && Date.now() - L.zeit < 15000) setTimeout(() => {
      try { root.GENSTART && root.GENSTART.oeffneBlock && root.GENSTART.oeffneBlock("daten"); } catch (e) { }
      const b = $("syBox"); if (b) b.scrollIntoView({ block: "center" });
      meldung("Abgleich fertig.");
    }, 900);
  }

  const api = { mische, mischeSchluessel, bereichVon, senden, holen, rueckgaengig, zeichnen, geraet,
                get META() { return META; } };
  root.GENSYNC = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }
})(typeof window !== "undefined" ? window : globalThis);
