/* ============================================================================
   gen/trace-trainer.js — «Schreibtischtest» (GA2: Wertetabelle, Fehler finden,
   Was wird ausgegeben?)
   ----------------------------------------------------------------------------
   Bildschirm scTrace. Aufgaben aus root.AP2_TRACE_AUFGABEN (gen/trace-daten.js).
   Die richtigen Werte werden NICHT gespeichert, sondern mit
   root.GENCODELAUF.verfolgen() / pruefeAufgabe() / ausfuehren() berechnet.

   Speicher: localStorage "ap2:trace"
     { v:1, aufgaben: { <id>: { antwort, hilfe, loesung, laeufe, versuch, t,
                                historie:[{id,t,versuch,correct,max,support,antwort,erfasst}] } } }
     antwort: tabelle → { zellen:{"zeile:spalte": Text}, rueckgabe }
              fehler  → { markiert:[Zeilennummern], korrektur:{Zeile: Text} }
              ausgabe → { text }
   Journal: root.GENLERNSTAND.record({topic:"tests", source:"trace", task, correct,
            max, kind:"auto", support, …}) — correct/max nach Zellen bzw. Punkten.
   API: root.GENTRACE = { oeffnen(id?), liste(), status, antwort, entwurf, hilfe,
        loesungZeigen, neuerVersuch, pruefen, bewerten, referenz, … }
   ========================================================================== */
"use strict";
(function (root) {
  const SK = "ap2:trace", SK_SICHERUNG = "ap2:trace:sicherung", MAX_HISTORIE = 30;
  const TEXT_MAX = 300, AUSGABE_MAX = 4000;
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const $ = id => document.getElementById(id);
  const kopie = x => JSON.parse(JSON.stringify(x));
  const hat = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
  const aufgaben = () => root.AP2_TRACE_AUFGABEN || [];
  const lauf = () => root.GENCODELAUF;
  const finde = id => aufgaben().find(a => a.id === id) || null;
  const HILFE_TEXT = { selbst: "самостоятельно", hilfe: "с подсказкой", loesung: "с открытым решением" };
  const TYPEN = {
    tabelle: { name: "Wertetabelle", ru: "Заполни таблицу значений", liste: "Wertetabelle ausfüllen",
      wie: "Schreibtischtest — выполнить код «на бумаге», строка за строкой, и записывать значения переменных в таблицу." },
    fehler: { name: "Fehler finden", ru: "Найди смысловые ошибки", liste: "Semantische Fehler finden",
      wie: "Смысловая ошибка (semantischer Fehler): код запускается, но делает не то. Найди её Schreibtischtest’ом по тестовому случаю." },
    ausgabe: { name: "Was wird ausgegeben?", ru: "Что выведет программа", liste: "Was wird ausgegeben?",
      wie: "Пройди код по шагам и записывай всё, что выводят print и println, — ровно в том виде, как это появится на экране." }
  };
  const codeZeilen = a => String(a.code || "").replace(/\n$/, "").split("\n");
  const normLeer = s => String(s == null ? "" : s).replace(/\s+/g, " ").trim();

  /* ======================================================================
     Speicher
     ====================================================================== */
  let lesefehler = "", schreibfehler = "", rohDefekt = null;
  const leer = () => ({ v: 1, aufgaben: {} });
  function laden() {
    lesefehler = ""; rohDefekt = null;
    let roh = null;
    try { roh = root.localStorage ? root.localStorage.getItem(SK) : null; }
    catch (e) { lesefehler = "Память браузера недоступна — ответы сохранятся только до закрытия вкладки."; return leer(); }
    if (!roh) return leer();
    try {
      const x = JSON.parse(roh);
      if (!x || typeof x !== "object" || Array.isArray(x) || !x.aufgaben || typeof x.aufgaben !== "object" || Array.isArray(x.aufgaben)) throw new Error("format");
      const st = leer();
      Object.keys(x.aufgaben).forEach(id => {
        const e = x.aufgaben[id];
        if (!e || typeof e !== "object" || Array.isArray(e)) return;
        st.aufgaben[id] = {
          antwort: e.antwort && typeof e.antwort === "object" && !Array.isArray(e.antwort) ? e.antwort : null,
          hilfe: !!e.hilfe, loesung: !!e.loesung,
          laeufe: Number.isInteger(e.laeufe) && e.laeufe >= 0 ? e.laeufe : 0,
          versuch: Number.isInteger(e.versuch) && e.versuch > 0 ? e.versuch : 1,
          historie: Array.isArray(e.historie) ? e.historie.filter(h => h && typeof h === "object" && Number.isFinite(h.correct) && Number.isFinite(h.max) && h.max > 0) : [],
          t: Number.isFinite(e.t) ? e.t : 0
        };
      });
      return st;
    } catch (e) {
      rohDefekt = roh;
      lesefehler = "Сохранённые ответы тренажёра повреждены. Старая запись сохранена отдельно (ap2:trace:sicherung), тренажёр начинает с чистого листа.";
      return leer();
    }
  }
  let ST = laden();
  function speichern() {
    try {
      if (!root.localStorage) throw new Error("kein Speicher");
      if (rohDefekt) { root.localStorage.setItem(SK_SICHERUNG, rohDefekt); rohDefekt = null; }
      root.localStorage.setItem(SK, JSON.stringify(ST));
      schreibfehler = "";
      return { ok: true };
    } catch (e) {
      schreibfehler = "Не удалось сохранить на устройстве (память браузера переполнена или недоступна). Введённые значения остаются на экране — не закрывай вкладку.";
      return { ok: false, error: schreibfehler };
    }
  }
  function eintrag(id) {
    if (!finde(id)) throw new Error("Неизвестная задача: " + id);
    if (!ST.aufgaben[id]) ST.aufgaben[id] = { antwort: null, hilfe: false, loesung: false, laeufe: 0, versuch: 1, historie: [], t: 0 };
    return ST.aufgaben[id];
  }
  const vorhanden = id => ST.aufgaben[id] || null;

  /* ======================================================================
     Antworten: Form prüfen
     ====================================================================== */
  const kurz = (s, n) => String(s == null ? "" : s).slice(0, n);
  function leereAntwort(a) {
    if (a.typ === "tabelle") return { zellen: {}, rueckgabe: "" };
    if (a.typ === "fehler") return { markiert: [], korrektur: {} };
    return { text: "" };
  }
  function normAntwort(a, x) {
    const r = leereAntwort(a);
    if (!x || typeof x !== "object" || Array.isArray(x)) return r;
    if (a.typ === "tabelle") {
      if (x.zellen && typeof x.zellen === "object" && !Array.isArray(x.zellen))
        Object.keys(x.zellen).sort().forEach(k => { const v = x.zellen[k]; if (/^\d{1,3}:\d{1,2}$/.test(k) && v != null && String(v) !== "") r.zellen[k] = kurz(v, TEXT_MAX); });
      r.rueckgabe = kurz(x.rueckgabe, TEXT_MAX);
    } else if (a.typ === "fehler") {
      const n = codeZeilen(a).length;
      const gueltig = z => Number.isInteger(z) && z >= 1 && z <= n;
      r.markiert = Array.from(new Set((Array.isArray(x.markiert) ? x.markiert : []).filter(gueltig))).sort((p, q) => p - q);
      if (x.korrektur && typeof x.korrektur === "object" && !Array.isArray(x.korrektur))
        Object.keys(x.korrektur).map(Number).filter(gueltig).sort((p, q) => p - q).forEach(z => {
          if (typeof x.korrektur[z] === "string") r.korrektur[z] = kurz(x.korrektur[z].replace(/[\r\n]+/g, " "), TEXT_MAX);
        });
    } else r.text = kurz(x.text, AUSGABE_MAX);
    return r;
  }
  function istLeer(a, ant) {
    if (!ant) return true;
    if (a.typ === "tabelle") return !Object.keys(ant.zellen).some(k => String(ant.zellen[k]).trim()) && !String(ant.rueckgabe || "").trim();
    if (a.typ === "fehler") return !ant.markiert.length;
    return !String(ant.text || "").trim();
  }

  /* ======================================================================
     Richtige Werte — immer vom Ausführer berechnet (Cache je Aufgabe)
     ====================================================================== */
  const refCache = new Map();
  function referenz(id) {
    const a = finde(id);
    if (!a) throw new Error("Неизвестная задача: " + id);
    if (refCache.has(id)) return refCache.get(id);
    const L = lauf();
    if (!L) throw new Error("Исполнитель кода не загружен.");
    const ref = a.typ === "tabelle" ? tabellenReferenz(a, L) : a.typ === "fehler" ? fehlerReferenz(a, L) : ausgabeReferenz(a, L);
    refCache.set(id, ref);
    return ref;
  }
  function tabellenReferenz(a, L) {
    const sp = a.tabelle.spalten, werte = [], bed = [];
    const quelle = sp.map(s => s.ausgabe ? { art: "ausgabe" } : s.bedingung != null ? { art: "bedingung", k: bed.push(s.bedingung) - 1 } : { art: "wert", k: werte.push(s.wert) - 1 });
    const r = L.verfolgen(a.code, { methode: a.methode, args: a.eingabe, klassen: a.klassen,
      punkte: a.tabelle.punkte.map(p => ({ zeile: p.zeile, wann: p.wann, werte, bedingungen: bed })) });
    if (!r.ok) throw new Error("Задача " + a.id + " не выполняется: " + (r.fehler && r.fehler.meldung));
    const zeilen = r.spur.map(z => {
      const p = a.tabelle.punkte[z.punkt] || {};
      return {
        label: String(p.label || "{n}").replace("{n}", String(z.nr)),
        zellen: quelle.map(q => {
          if (q.art === "ausgabe") return { typ: "ausgabe", js: z.ausgabe, text: normLeer(z.ausgabe) };
          if (q.art === "bedingung") { const b = z.bedingungen[q.k]; return b == null ? null : { typ: "boolean", js: b, text: String(b) }; }
          return z.werte[q.k];
        })
      };
    });
    const typen = sp.map((s, k) => { const c = zeilen.map(z => z.zellen[k]).find(Boolean); return c ? c.typ : (s.ausgabe ? "ausgabe" : "String"); });
    return { art: "tabelle", zeilen, typen, rueckgabe: r.rueckgabe, ausgabe: r.ausgabe };
  }
  const testAufgabe = a => ({ signatur: a.signatur, tests: a.tests || [], klassen: a.klassen || [] });
  /* Laufzeit-Tipps des Ausführers («проверь условие цикла …») verraten hier die Lösung */
  const ohneTipp = m => String(m || "").replace(/\s*\([^()]*(?:проверь|последний индекс)[^()]*\)/g, "").replace(/\s*—\s*последний индекс[^;)]*/g, "");
  function testListe(p, mitTipp) {
    return p.tests.map(t => ({ nr: t.nr, eingabe: t.eingabe, erwartet: t.erwartet, ok: !!t.ok,
      erhalten: t.fehler ? "ошибка — " + (mitTipp ? t.fehler.meldung : ohneTipp(t.fehler.meldung)) : (t.erhalten || "—") }));
  }
  function fehlerReferenz(a, L) {
    const p = L.pruefeAufgabe(testAufgabe(a), a.code);
    const alle = {}; a.fehler.forEach(f => Object.keys(f.fix).forEach(z => { alle[z] = f.fix[z]; }));
    return { art: "fehler", zeilen: codeZeilen(a), kompiliert: p.kompiliert, tests: testListe(p, false), korrigiert: codeMit(a, alle) };
  }
  function ausgabeZeilen(text) { return String(text == null ? "" : text).split(/\r?\n/).map(normLeer).filter(z => z !== ""); }
  function ausgabeReferenz(a, L) {
    const r = L.ausfuehren(a.code, { methode: a.methode, args: a.eingabe, klassen: a.klassen });
    if (!r.ok) throw new Error("Задача " + a.id + " не выполняется: " + (r.fehler && r.fehler.meldung));
    return { art: "ausgabe", text: r.ausgabe.replace(/\n$/, ""), zeilen: ausgabeZeilen(r.ausgabe) };
  }
  function codeMit(a, aend) {
    const z = codeZeilen(a).slice();
    Object.keys(aend || {}).forEach(k => {
      const n = Number(k);
      if (!Number.isInteger(n) || n < 1 || n > z.length) return;
      const einzug = /^\s*/.exec(z[n - 1])[0];
      z[n - 1] = einzug + String(aend[k] == null ? "" : aend[k]).replace(/[\r\n]+/g, " ").trim();
    });
    return z.join("\n") + "\n";
  }

  /* ======================================================================
     Vergleich einer Eingabe mit dem richtigen Wert
     ====================================================================== */
  const STRICH = /^[-–—−/]$/;
  const ANF = [["\"", "\""], ["'", "'"], ["„", "“"], ["„", "”"], ["“", "”"], ["”", "”"], ["‚", "‘"], ["‘", "’"], ["«", "»"], ["»", "«"]];
  function ohneAnf(s) {
    const t = String(s).trim();
    for (const [l, r] of ANF) if (t.length >= 2 && t.startsWith(l) && t.endsWith(r)) return t.slice(l.length, t.length - r.length);
    return t;
  }
  const minus = s => String(s).replace(/\s+/g, "").replace(/[−–—]/g, "-");
  function ganz(s) { const t = minus(s); return /^[+-]?\d+$/.test(t) ? Number(t) : null; }
  function komma(s) { const t = minus(s).replace(",", "."); return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : null; }
  const WAHR = new Set(["true", "wahr", "w", "t"]), FALSCH = new Set(["false", "falsch", "f"]);
  function bool(s) { const t = String(s).trim().toLowerCase(); return WAHR.has(t) ? true : FALSCH.has(t) ? false : null; }
  const GANZ_T = new Set(["int", "long", "short", "byte", "Integer", "Long", "Short", "Byte"]);
  const KOMMA_T = new Set(["double", "float", "Double", "Float"]);
  const istFeldTyp = typ => /\[\]$/.test(typ) || /^(List|ArrayList|LinkedList)\b/.test(typ);
  function skalarGleich(typ, js, s, text) {
    if (GANZ_T.has(typ)) return ganz(s) === js;
    if (KOMMA_T.has(typ)) { const v = komma(s); return v !== null && Math.abs(v - js) <= 1e-9 * Math.max(1, Math.abs(js)); }
    if (typ === "boolean" || typ === "Boolean") return bool(s) === js;
    if (typ === "char" || typ === "Character") {
      if (js === " ") return /^(['"‚‘„“]\s['"’‘“”]|leerzeichen|пробел|␣)$/i.test(String(s).trim());
      return ohneAnf(s) === js;
    }
    if (typ === "String") return ohneAnf(s) === js;
    if (typ === "null") return String(s).trim() === "null";
    return normLeer(s) === normLeer(text);
  }
  function feldGleich(typ, js, s, text) {
    if (!Array.isArray(js)) return false;
    const et = /\[\]$/.test(typ) ? typ.slice(0, -2) : ((/^\w+<(.+)>$/.exec(typ) || [])[1] || "String");
    const plain = t => String(t).replace(/\s+/g, "").replace(/[[(]/g, "{").replace(/[\])]/g, "}");
    if (/\[\]$/.test(et) || et.startsWith("List")) return plain(s) === plain(text);
    let t = String(s).trim();
    if (/^[{[(]/.test(t) && /[}\])]$/.test(t)) t = t.slice(1, -1).trim();
    const teile = t === "" ? [] : /[,;]/.test(t) && !KOMMA_T.has(et) ? t.split(/[,;]/) : KOMMA_T.has(et) && t.includes(";") ? t.split(";") : t.split(/[\s,]+(?=\S)/);
    return teile.length === js.length && teile.every((x, i) => skalarGleich(et, js[i], x.trim(), ""));
  }
  /* Zelle richtig? Leere Ausgabe-Zelle zählt nur, wenn in der Zeile sonst etwas steht —
     sonst gäbe eine leere Tabelle schon Punkte. */
  function zelleOk(c, roh, zeileGefuellt) {
    const s = String(roh == null ? "" : roh).trim();
    if (c.typ === "ausgabe") {
      const soll = normLeer(c.js);
      if (!soll) return !!zeileGefuellt && (s === "" || STRICH.test(s));
      return normLeer(s) === soll;
    }
    if (s === "") return false;
    if (istFeldTyp(c.typ)) return feldGleich(c.typ, c.js, s, c.text);
    return skalarGleich(c.typ, c.js, s, c.text);
  }

  /* ======================================================================
     Bewerten (ohne Speichern)
     ====================================================================== */
  function bewerten(id, antwort) {
    const a = finde(id);
    if (!a) throw new Error("Неизвестная задача: " + id);
    const ant = normAntwort(a, antwort), ref = referenz(id);
    if (a.typ === "tabelle") return bewerteTabelle(a, ref, ant);
    if (a.typ === "fehler") return bewerteFehler(a, ref, ant);
    return bewerteAusgabe(a, ref, ant);
  }
  function bewerteTabelle(a, ref, ant) {
    const vorgabe = a.tabelle.vorgabeZeilen || 0, zellen = {};
    let correct = 0, max = 0;
    ref.zeilen.forEach((z, r) => {
      if (r < vorgabe) return;
      const gefuellt = z.zellen.some((c, k) => c && String(ant.zellen[r + ":" + k] || "").trim() !== "");
      z.zellen.forEach((c, k) => {
        if (!c) return;
        const ok = zelleOk(c, ant.zellen[r + ":" + k], gefuellt);
        zellen[r + ":" + k] = ok; max++; if (ok) correct++;
      });
    });
    let rueckgabe = null;
    if (a.rueckgabe && ref.rueckgabe) { rueckgabe = zelleOk(ref.rueckgabe, ant.rueckgabe, true); max++; if (rueckgabe) correct++; }
    return { typ: "tabelle", correct, max, zellen, rueckgabe };
  }
  const ohneLeer = s => String(s).replace(/\s+/g, "");
  function bewerteFehler(a, ref, ant) {
    const L = lauf(), auf = testAufgabe(a), zeilen = ref.zeilen;
    const markiert = new Set(ant.markiert);
    const text = z => (hat(ant.korrektur, z) ? ant.korrektur[z] : zeilen[z - 1].trim());
    const geaendert = z => markiert.has(z) && ohneLeer(text(z)) !== ohneLeer(zeilen[z - 1]);
    const eigene = {}; ant.markiert.forEach(z => { eigene[z] = text(z); });
    const pg = L.pruefeAufgabe(auf, codeMit(a, eigene));
    const gesamtOk = pg.kompiliert && pg.bestanden === pg.gesamt;
    const fehlerZeilen = new Set();
    a.fehler.forEach(f => f.zeilen.forEach(z => fehlerZeilen.add(z)));
    const fehler = a.fehler.map((f, i) => {
      const gefunden = f.zeilen.some(z => markiert.has(z)), bearbeitet = f.zeilen.some(geaendert);
      let behoben = false, meldung = "";
      if (gefunden && bearbeitet) {
        /* nur diese Korrektur prüfen: die übrigen Fehler sind dafür richtig behoben */
        const aend = {};
        a.fehler.forEach((g, j) => { if (j !== i) Object.keys(g.fix).forEach(z => { aend[z] = g.fix[z]; }); });
        f.zeilen.forEach(z => { if (markiert.has(z)) aend[z] = text(z); });
        const p = L.pruefeAufgabe(auf, codeMit(a, aend));
        behoben = (p.kompiliert && p.bestanden === p.gesamt) || gesamtOk;
        if (!behoben) meldung = !p.kompiliert ? "код не запускается: " + (p.fehler && p.fehler.meldung) : "с этим исправлением проходят " + p.bestanden + " из " + p.gesamt + " тестов";
      } else if (gefunden) meldung = "строка отмечена, но текст не изменён";
      return { gefunden, bearbeitet, behoben, meldung, zeilen: f.zeilen.slice() };
    });
    const falsch = ant.markiert.filter(z => !fehlerZeilen.has(z));
    const punkte = fehler.reduce((s, f) => s + (f.gefunden ? 1 : 0) + (f.behoben ? 1 : 0), 0);
    return { typ: "fehler", correct: Math.max(0, punkte - falsch.length), max: 2 * a.fehler.length, fehler, falsch,
      gesamt: { kompiliert: pg.kompiliert, bestanden: pg.bestanden, gesamt: pg.gesamt, fehler: pg.kompiliert ? null : pg.fehler && pg.fehler.meldung, tests: pg.kompiliert ? testListe(pg, true) : [] } };
  }
  function bewerteAusgabe(a, ref, ant) {
    const soll = ref.zeilen, ist = ausgabeZeilen(ant.text);
    const zeilen = soll.map((z, i) => ({ ok: ist[i] === z, ist: i < ist.length ? ist[i] : null }));
    const richtig = zeilen.filter(z => z.ok).length, extra = Math.max(0, ist.length - soll.length);
    return { typ: "ausgabe", correct: Math.max(0, richtig - extra), max: soll.length, zeilen, extra };
  }

  /* ======================================================================
     Aktionen (ohne DOM, testbar)
     ====================================================================== */
  function antwort(id) {
    const a = finde(id);
    if (!a) throw new Error("Неизвестная задача: " + id);
    const x = vorhanden(id);
    return normAntwort(a, x && x.antwort);
  }
  function entwurf(id, ant) {
    const x = eintrag(id);
    x.antwort = normAntwort(finde(id), ant); x.t = Date.now();
    return speichern();
  }
  function support(id) { const x = vorhanden(id); return x && x.loesung ? "loesung" : x && x.hilfe ? "hilfe" : "selbst"; }
  function hilfe(id) { const x = eintrag(id); if (!x.hilfe) { x.hilfe = true; x.t = Date.now(); } return speichern(); }
  function loesungZeigen(id) {
    const x = eintrag(id);
    if (!x.laeufe && !x.loesung) return { ok: false, error: "Правильный ответ откроется после первой проверки: сначала попробуй сама и нажми «Проверить»." };
    if (!x.loesung) { x.loesung = true; x.t = Date.now(); }
    const r = speichern();
    return { ok: true, gespeichert: r.ok, error: r.error };
  }
  function neuerVersuch(id) {
    const x = eintrag(id);
    x.versuch = (x.versuch || 1) + 1; x.hilfe = false; x.loesung = false; x.laeufe = 0; x.antwort = null; x.t = Date.now();
    return speichern();
  }
  function loesungText(a) {
    if (a.typ === "fehler") return a.fehler.map(f => f.zeilen.map(z => "Zeile " + z + ": " + f.fix[z]).join("\n")).join("\n");
    const ref = referenz(a.id);
    if (a.typ === "ausgabe") return ref.zeilen.join("\n");
    const kopf = [a.tabelle.kopf].concat(a.tabelle.spalten.map(s => s.titel.replace(/­/g, "")));
    const zeilen = ref.zeilen.map(z => [z.label].concat(z.zellen.map(c => c ? c.text : "—")).join(" | "));
    return [kopf.join(" | ")].concat(zeilen).join("\n") + (a.rueckgabe && ref.rueckgabe ? "\nRückgabewert: " + ref.rueckgabe.text : "");
  }
  function ereignis(a, h) {
    return { id: h.id, t: h.t, topic: "tests", source: "trace", task: a.id, correct: h.correct, max: h.max, support: h.support, kind: "auto",
      answers: h.antwort,
      snapshot: { type: "trace", typ: a.typ, title: a.titel, question: a.kontext + "\n" + a.aufgabe, code: a.code } };
  }
  function erfassen(a, h) {
    if (!root.GENLERNSTAND || typeof root.GENLERNSTAND.record !== "function") return false;
    let r;
    try { r = root.GENLERNSTAND.record(ereignis(a, h)); } catch (e) { return false; }
    if (r && (r.ok || /уже существует/.test(r.error || ""))) h.erfasst = true;
    return !!(r && r.ok);
  }
  let folge = 0;
  function pruefen(id, ant) {
    const a = finde(id);
    if (!a) throw new Error("Неизвестная задача: " + id);
    if (!lauf()) throw new Error("Исполнитель кода не загружен.");
    const x = eintrag(id);
    if (ant !== undefined) x.antwort = normAntwort(a, ant);
    const jetzt = normAntwort(a, x.antwort);
    const res = bewerten(id, jetzt);
    const sup = support(id), t = Date.now();
    x.laeufe = (x.laeufe || 0) + 1;
    const h = { id: "trace:" + id + ":" + t.toString(36) + ":" + (++folge) + ":" + x.historie.length, t, versuch: x.versuch || 1,
      correct: res.correct, max: res.max, support: sup, antwort: kopie(jetzt), erfasst: false };
    x.historie.forEach(alt => { if (!alt.erfasst) erfassen(a, alt); });
    x.historie.push(h);
    if (x.historie.length > MAX_HISTORIE) x.historie.splice(0, x.historie.length - MAX_HISTORIE);
    erfassen(a, h);
    x.t = t;
    const s = speichern();
    return Object.assign({}, res, { support: sup, eintrag: kopie(h), gespeichert: s.ok, speicherfehler: s.error || "" });
  }
  const RANG = { selbst: 2, hilfe: 1, loesung: 0 };
  function bester(id) {
    const x = vorhanden(id);
    if (!x || !x.historie.length) return null;
    return x.historie.reduce((b, h) => {
      if (!b) return h;
      const qa = h.correct / h.max, qb = b.correct / b.max;
      if (qa !== qb) return qa > qb ? h : b;
      if (RANG[h.support] !== RANG[b.support]) return RANG[h.support] > RANG[b.support] ? h : b;
      return h.t >= b.t ? h : b;
    }, null);
  }
  function status(id) {
    const a = finde(id), x = vorhanden(id), b = bester(id);
    if (!b) {
      const entwurfDa = !!(a && x && x.antwort && !istLeer(a, normAntwort(a, x.antwort)));
      return { art: "neu", text: "не решала" + (entwurfDa ? " · есть черновик" : ""), correct: 0, max: 0, support: null };
    }
    if (b.correct === b.max) {
      const zusatz = b.support === "selbst" ? "" : b.support === "hilfe" ? " · с подсказкой — повтори сама" : " · с решением — повтори сама";
      return { art: "fertig", text: "всё верно" + zusatz, correct: b.correct, max: b.max, support: b.support };
    }
    return { art: "teil", text: "верно " + b.correct + " из " + b.max, correct: b.correct, max: b.max, support: b.support };
  }
  function liste() { return aufgaben().map(a => ({ id: a.id, typ: a.typ, titel: a.titel, titelDe: a.titelDe, status: status(a.id) })); }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  function knopf(text, cls, fn, titel) {
    const b = el("button", "btn" + (cls ? " " + cls : ""), text); b.type = "button";
    if (titel) b.title = titel;
    b.addEventListener("click", fn); return b;
  }
  const karte = (w, titel, cls) => { const c = el("section", "tr-karte" + (cls ? " " + cls : "")); if (titel) c.appendChild(el("h2", null, titel)); w.appendChild(c); return c; };
  const zeit = t => { try { return new Date(t).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  const de = (t, c, x) => { const e = el(t, c, x); e.lang = "de"; return e; };

  let aktuell = null;   /* id der offenen Aufgabe */
  let ui = null;        /* Verweise auf die Elemente der offenen Aufgabe */

  function seite() {
    let s = $("scTrace");
    if (s) return s;
    s = el("div", "seite tr-seite"); s.id = "scTrace"; s.hidden = true;
    const w = el("div", "tr-wrap"); w.id = "traceInhalt"; s.appendChild(w);
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling); else document.body.appendChild(s);
    return s;
  }
  function oeffnen(id, ausVerlauf, vonListe) {
    if (!hatDom) return;
    if (ui && ui.timer) ui.sichern();
    const a = id ? finde(id) : null;
    aktuell = a ? a.id : null;
    const s = seite();
    document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
    s.hidden = false;
    ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { const e = $(k); if (e) e.hidden = true; });
    if ($("kopfTitel")) $("kopfTitel").hidden = false;
    if ($("kEyebrow")) $("kEyebrow").textContent = "GA2 · Schreibtischtest";
    if ($("kTitel")) $("kTitel").textContent = a ? a.titelDe : "Schreibtischtest";
    const kopf = document.querySelector(".kopf");
    if (kopf) s.style.setProperty("--tr-kopf", kopf.offsetHeight + "px");
    if (!ausVerlauf) {
      try {
        if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
        history.pushState({ ihk: 1, seite: "scTrace", tr: aktuell, vonListe: !!(a && vonListe) }, "", location.hash || "");
      } catch (e) { }
    }
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scTrace", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
    const w = $("traceInhalt"); w.replaceChildren(); ui = null;
    if (lesefehler) { const p = el("p", "tr-alarm", lesefehler); p.setAttribute("role", "alert"); w.appendChild(p); }
    try { if (a) zeichneAufgabe(w, a); else zeichneListe(w); }
    catch (e) { const p = el("p", "tr-alarm", "Ошибка экрана: " + e.message); p.setAttribute("role", "alert"); w.appendChild(p); if (root.console) console.error(e); }
    root.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------- Liste */
  function zeichneListe(w) {
    const intro = karte(w, "Schreibtischtest: код на бумаге");
    intro.appendChild(el("p", null, "В GA2 часто просят: «Führen Sie einen Schreibtischtest durch und tragen Sie die Werte in die Tabelle ein» или «Der Algorithmus enthält zwei semantische Fehler». Здесь код по-настоящему выполняется, а твои ответы проверяются по его реальному ходу."));
    const fertig = aufgaben().filter(a => status(a.id).art === "fertig").length;
    const selbst = aufgaben().filter(a => { const s = status(a.id); return s.art === "fertig" && s.support === "selbst"; }).length;
    intro.appendChild(el("p", "tr-klein", "Всё верно: " + fertig + " из " + aufgaben().length + " задач" + (fertig ? ", из них самостоятельно — " + selbst : "") + ". Подсказка и «Показать правильно» отмечаются в журнале как помощь."));
    const d = el("details", "tr-details");
    d.appendChild(el("summary", null, "Как вести Schreibtischtest — коротко"));
    const ol = el("ol");
    [
      "Выпиши все переменные — это столбцы таблицы. Начальные значения возьми из кода до цикла.",
      "Иди по коду строка за строкой. Каждое присваивание (Zuweisung) меняет одно значение — сразу запиши новое.",
      "В условии (Bedingung) подставь текущие значения и реши: true или false.",
      "Один Durchlauf — одно выполнение тела цикла. После прохода снова проверяется Schleifenbedingung.",
      "Не перескакивай: даже если значение не изменилось, запиши его в строке прохода.",
      "В конце: что возвращает return (Rückgabewert) и что было выведено (Ausgabe)."
    ].forEach(t => ol.appendChild(el("li", null, t)));
    d.appendChild(ol); intro.appendChild(d);

    ["tabelle", "fehler", "ausgabe"].forEach(typ => {
      const l = aufgaben().filter(a => a.typ === typ);
      if (!l.length) return;
      const k = karte(w, TYPEN[typ].ru + " · " + l.length);
      k.appendChild(de("p", "tr-klein", TYPEN[typ].liste));
      const ul = el("ul", "tr-liste");
      l.forEach(a => {
        const s = status(a.id), li = el("li");
        const b = el("button", "tr-aufgabe " + s.art); b.type = "button";
        b.appendChild(el("span", "tr-a-titel", a.titel));
        b.appendChild(de("span", "tr-a-de", a.titelDe));
        b.appendChild(el("span", "tr-a-status " + s.art, (s.art === "fertig" ? "✓ " : s.art === "teil" ? "◐ " : "○ ") + s.text));
        b.addEventListener("click", () => oeffnen(a.id, false, true));
        li.appendChild(b); ul.appendChild(li);
      });
      k.appendChild(ul);
    });
  }

  /* ---------------------------------------------------------- Aufgabe */
  function zurListe() {
    try { if (history.state && history.state.seite === "scTrace" && history.state.vonListe) { history.back(); return; } } catch (e) { }
    oeffnen(null);
  }
  function zeichneAufgabe(w, a) {
    const ref = referenz(a.id);
    const nav = el("div", "tr-nav");
    nav.appendChild(knopf("← Все задачи", "ghost", zurListe));
    w.appendChild(nav);

    const k = karte(w, null, "tr-aufgabe-karte");
    const eb = el("p", "tr-eyebrow", TYPEN[a.typ].name + " · " + status(a.id).text); k.appendChild(eb);
    k.appendChild(el("h2", null, a.titel));
    const sit = de("div", "tr-de");
    sit.appendChild(el("p", "tr-label", "Situation"));
    sit.appendChild(el("p", null, a.kontext));
    sit.appendChild(el("p", "tr-label", "Aufgabe"));
    sit.appendChild(el("p", "tr-auftrag", a.aufgabe));
    k.appendChild(sit);
    const ru = el("details", "tr-details");
    ru.appendChild(el("summary", null, "Как вести Schreibtischtest в этой задаче"));
    ru.appendChild(el("p", "tr-klein", TYPEN[a.typ].wie));
    const ol = el("ol"); (a.erklaerungRu || []).forEach(t => ol.appendChild(el("li", null, t))); ru.appendChild(ol);
    k.appendChild(ru);
    if (a.begriffe && a.begriffe.length) {
      const be = el("details", "tr-details");
      be.appendChild(el("summary", null, "Begriffe — немецкие слова"));
      const dl = el("dl", "tr-begriffe");
      a.begriffe.forEach(([d, r]) => { dl.appendChild(de("dt", null, d)); dl.appendChild(el("dd", null, r)); });
      be.appendChild(dl); k.appendChild(be);
    }

    const ck = karte(w, a.typ === "fehler" ? "Quellcode — нажми на строку с ошибкой" : "Quellcode");
    ui = { a, ref, ant: antwort(a.id), eb, timer: null, felder: [], zellen: {}, letztesFeld: null };
    if (a.typ === "fehler") {
      ck.appendChild(el("p", "tr-klein", "Нажатие отмечает строку (ещё раз — снимает отметку). Исправленный текст впиши ниже, в «Исправления»."));
      ck.appendChild(codeAuswahl(a, ref));
    } else ck.appendChild(codeBlock(a));
    klassenZeigen(ck, a);
    if (a.typ !== "fehler") eingabeZeigen(ck, a);

    if (a.typ === "fehler") zeichneTests(w, a, ref);
    const arbeit = karte(w, a.typ === "tabelle" ? "Wertetabelle" : a.typ === "fehler" ? "Исправления" : "Ausgabe", "tr-arbeit");
    const sup = el("p", "tr-support"); arbeit.appendChild(sup); ui.sup = sup;
    if (a.typ === "tabelle") zeichneTabelle(arbeit, a, ref);
    else if (a.typ === "fehler") { ui.korrBox = el("div", "tr-korrekturen"); arbeit.appendChild(ui.korrBox); zeichneKorrekturen(); }
    else zeichneAusgabeFeld(arbeit, a);

    const knoepfe = el("div", "tr-knoepfe");
    const bPruef = knopf("Проверить", "primary", () => pruefenUI());
    const bHilfe = knopf("Подсказка", "", () => { const r = hilfe(a.id); hilfeBox.hidden = false; supportZeigen(); if (!r.ok) info(r.error, true); });
    const bLoes = knopf("Показать правильно", "", () => {
      const r = loesungZeigen(a.id);
      if (!r.ok) { info(r.error, true); return; }
      loesungAn(); supportZeigen(); if (!r.gespeichert) info(r.error, true);
    });
    const bNeu = knopf("Новая попытка", "ghost", () => {
      if (bNeu.dataset.sicher !== "1") {
        bNeu.dataset.sicher = "1"; bNeu.textContent = "Точно? Ответы будут стёрты";
        setTimeout(() => { if (bNeu.isConnected) { bNeu.dataset.sicher = ""; bNeu.textContent = "Новая попытка"; } }, 5000);
        return;
      }
      clearTimeout(ui.timer); ui.timer = null;   /* alter Entwurf darf den Neuanfang nicht überschreiben */
      const r = neuerVersuch(a.id);
      oeffnen(a.id, true);
      if (ui) ui.info(r.ok ? "Новая попытка начата: поля очищены. Лучше решать её в другой день, без подсказки." : r.error, !r.ok);
    }, "Начать задачу заново: пустые поля, без подсказки и решения");
    [bPruef, bHilfe, bLoes, bNeu].forEach(b => knoepfe.appendChild(b));
    arbeit.appendChild(knoepfe);
    const infoZeile = el("p", "tr-klein tr-speicher"); infoZeile.setAttribute("aria-live", "polite");
    infoZeile.textContent = "Черновик сохраняется автоматически.";
    arbeit.appendChild(infoZeile);
    const hilfeBox = el("div", "tr-hilfe"); hilfeBox.hidden = true;
    hilfeBox.appendChild(el("p", "tr-label", "Подсказка"));
    hilfeBox.appendChild(el("p", null, a.hinweis));
    arbeit.appendChild(hilfeBox);
    const loesBox = el("div", "tr-loesung"); loesBox.hidden = true;
    arbeit.appendChild(loesBox);

    const ergebnis = el("section", "tr-karte tr-ergebnis"); ergebnis.hidden = true; ergebnis.id = "trErgebnis";
    ergebnis.setAttribute("aria-live", "polite");
    w.appendChild(ergebnis);
    const verlauf = el("section", "tr-karte tr-verlauf"); w.appendChild(verlauf);
    Object.assign(ui, { bLoes, hilfeBox, loesBox, ergebnis, verlauf, infoZeile, letzteBewertung: null });

    function info(text, fehler) { infoZeile.textContent = text; infoZeile.classList.toggle("fehler", !!fehler); }
    function supportZeigen() {
      const s = support(a.id), xx = vorhanden(a.id);
      sup.className = "tr-support " + s;
      sup.textContent = "Эта попытка засчитывается как: " + HILFE_TEXT[s] + (xx && xx.versuch > 1 ? " · попытка " + xx.versuch : "");
      const darf = !!(xx && (xx.laeufe > 0 || xx.loesung));
      bLoes.disabled = !darf;
      bLoes.title = darf ? "Открыть правильные значения (попытка будет отмечена «с решением»)" : "Доступно после первой проверки";
    }
    ui.info = info; ui.supportZeigen = supportZeigen;
    ui.sichern = function () {
      clearTimeout(ui.timer); ui.timer = null;
      const r = entwurf(a.id, ui.ant);
      info(r.ok ? "Черновик сохранён · " + zeit(Date.now()) : r.error, !r.ok);
      return r;
    };

    const x = vorhanden(a.id);
    supportZeigen();
    if (x && x.hilfe) hilfeBox.hidden = false;
    if (schreibfehler) info(schreibfehler, true);
    zeichneVerlauf();
    /* Nach dem Neuladen: letzte Prüfung wieder anzeigen, wenn die Antwort seitdem gleich ist */
    const letzter = x && x.historie.length ? x.historie[x.historie.length - 1] : null;
    if (letzter && JSON.stringify(normAntwort(a, letzter.antwort)) === JSON.stringify(ui.ant)) {
      try { zeigeErgebnis(bewerten(a.id, ui.ant), letzter); } catch (e) { }
    } else if (letzter) {
      ergebnis.hidden = false;
      ergebnis.appendChild(el("h2", null, "Последняя проверка"));
      ergebnis.appendChild(el("p", "tr-klein", zeit(letzter.t) + " — верно " + letzter.correct + " из " + letzter.max + " (" + HILFE_TEXT[letzter.support] + "). С тех пор ответ менялся — нажми «Проверить»."));
    }
    if (x && x.loesung) loesungAn();
  }
  function aendern() {
    if (!ui) return;
    clearTimeout(ui.timer);
    ui.timer = setTimeout(() => { if (ui) ui.sichern(); }, 500);
  }

  /* ---------------------------------------------------------- Code */
  function codeBlock(a) {
    const sc = el("div", "tr-code-scroll"); sc.tabIndex = 0;
    sc.setAttribute("role", "region"); sc.setAttribute("aria-label", "Quellcode mit Zeilennummern");
    const ol = el("ol", "tr-code"); ol.lang = "en";
    codeZeilen(a).forEach((z, i) => {
      const li = el("li");
      const nr = el("span", "tr-nr", String(i + 1)); nr.setAttribute("aria-hidden", "true");
      li.appendChild(nr); li.appendChild(el("code", null, z || " "));
      ol.appendChild(li);
    });
    sc.appendChild(ol);
    return sc;
  }
  function codeAuswahl(a, ref) {
    const sc = el("div", "tr-code-scroll");
    const ol = el("ol", "tr-code tr-wahl"); ol.lang = "en";
    ui.zeilenKnoepfe = {};
    ref.zeilen.forEach((z, i) => {
      const n = i + 1, li = el("li");
      const b = el("button", "tr-zeile"); b.type = "button";
      b.setAttribute("aria-pressed", ui.ant.markiert.includes(n) ? "true" : "false");
      b.setAttribute("aria-label", "Zeile " + n + ": " + (z.trim() || "leer"));
      const nr = el("span", "tr-nr", String(n)); nr.setAttribute("aria-hidden", "true");
      b.appendChild(nr); b.appendChild(el("code", null, z || " "));
      b.addEventListener("click", () => markieren(n));
      li.appendChild(b); ol.appendChild(li);
      ui.zeilenKnoepfe[n] = b;
    });
    sc.appendChild(ol);
    return sc;
  }
  function markieren(n) {
    if (!ui) return;
    const m = ui.ant.markiert, i = m.indexOf(n);
    if (i >= 0) m.splice(i, 1); else { m.push(n); m.sort((p, q) => p - q); }
    const b = ui.zeilenKnoepfe[n]; if (b) b.setAttribute("aria-pressed", i >= 0 ? "false" : "true");
    zeichneKorrekturen(i < 0 ? n : 0);
    aendern();
  }
  function zeichneKorrekturen(fokus) {
    const box = ui.korrBox, a = ui.a, zeilen = ui.ref.zeilen;
    box.replaceChildren();
    if (!ui.ant.markiert.length) {
      box.appendChild(el("p", "tr-klein", a.fehler.length > 1 ? "Пока не отмечено ни одной строки. В задании " + a.fehler.length + " ошибки — найди их по тестам." : "Пока не отмечено ни одной строки. В задании одна ошибка — найди её по тестам."));
      return;
    }
    ui.ant.markiert.forEach(n => {
      const d = el("div", "tr-korr");
      const id = "trK" + n;
      const lab = el("label", "tr-k-label", "Zeile " + n + " — исправленная строка"); lab.htmlFor = id;
      d.appendChild(lab);
      const alt = el("div", "tr-k-alt"); alt.appendChild(el("span", "tr-k-wort", "было: ")); alt.appendChild(el("code", null, zeilen[n - 1].trim())); d.appendChild(alt);
      const inp = el("input", "tr-feld tr-k-feld"); inp.id = id; inp.type = "text";
      inp.value = hat(ui.ant.korrektur, n) ? ui.ant.korrektur[n] : zeilen[n - 1].trim();
      ["autocapitalize", "autocorrect", "autocomplete"].forEach(k => inp.setAttribute(k, "off"));
      inp.spellcheck = false; inp.setAttribute("enterkeyhint", "done");
      inp.addEventListener("input", () => { ui.ant.korrektur[n] = inp.value.replace(/[\r\n]+/g, " "); d.classList.remove("ok", "falsch"); aendern(); });
      inp.addEventListener("blur", () => { if (ui && ui.timer) ui.sichern(); });
      d.appendChild(inp);
      d.appendChild(knopf("Снять отметку", "ghost klein", () => markieren(n)));
      const fb = el("p", "tr-k-fb"); fb.hidden = true; d.appendChild(fb);
      box.appendChild(d);
      if (fokus === n) setTimeout(() => { try { inp.focus({ preventScroll: true }); d.scrollIntoView && d.scrollIntoView({ block: "nearest" }); } catch (e) { } }, 0);
    });
  }
  function klassenZeigen(parent, a) {
    (a.klassen || []).forEach(c => {
      const d = el("div", "tr-klasse");
      d.appendChild(de("p", "tr-label", "Klasse " + c.name));
      const sc = el("div", "tr-scroll");
      const tb = de("table", "tr-mtab");
      const th = el("thead"), tr = el("tr"); tr.appendChild(el("th", null, "Methode")); tr.appendChild(el("th", null, "Beschreibung")); th.appendChild(tr); tb.appendChild(th);
      const tbd = el("tbody");
      (c.methoden || []).forEach(([m, txt]) => { const r = el("tr"); const c1 = el("td"); c1.appendChild(el("code", null, m)); r.appendChild(c1); r.appendChild(el("td", null, txt)); tbd.appendChild(r); });
      tb.appendChild(tbd); sc.appendChild(tb); d.appendChild(sc);
      parent.appendChild(d);
    });
  }
  function eingabeZeigen(parent, a) {
    const L = lauf(), sig = L.parseSignatur(a.signatur);
    const box = el("div", "tr-eingabe");
    box.appendChild(de("p", "tr-label", "Eingabe"));
    const klassen = new Map((a.klassen || []).map(c => [c.name, c]));
    sig.params.forEach((p, i) => {
      const x = a.eingabe[i];
      const def = (p.typ.dim === 1 || /^(List|ArrayList)$/.test(p.typ.name)) ? klassen.get(p.typ.dim === 1 ? p.typ.name : (p.typ.args[0] || {}).name) : null;
      if (def && Array.isArray(x)) {
        box.appendChild(el("p", "tr-e-name", p.name + " (" + x.length + " " + (x.length === 1 ? "объект" : x.length < 5 ? "объекта" : "объектов") + "):"));
        const sc = el("div", "tr-scroll"), tb = el("table", "tr-mtab tr-objekte");
        const felder = Object.keys(def.felder);
        const hr = el("tr"); felder.forEach(f => hr.appendChild(el("th", null, f))); const th = el("thead"); th.appendChild(hr); tb.appendChild(th);
        const tbd = el("tbody");
        x.forEach(o => { const r = el("tr"); felder.forEach(f => r.appendChild(el("td", null, L.formatiere(o[f], def.felder[f], a.klassen)))); tbd.appendChild(r); });
        tb.appendChild(tbd); sc.appendChild(tb); box.appendChild(sc);
      } else {
        const c = el("code", "tr-e-wert", p.name + " = " + L.formatiere(x, p.typ, a.klassen));
        const pp = el("p", "tr-e-zeile"); pp.appendChild(c); box.appendChild(pp);
      }
    });
    parent.appendChild(box);
  }

  /* ---------------------------------------------------------- Wertetabelle */
  const ART = typ => GANZ_T.has(typ) ? "zahl" : KOMMA_T.has(typ) ? "komma" : typ === "boolean" || typ === "Boolean" ? "bool" : "text";
  function feldBauen(art, wert, label, breit) {
    let f;
    if (art === "bool") {
      f = el("select", "tr-feld tr-bool");
      [["", "?"], ["true", "true"], ["false", "false"]].forEach(([v, t]) => { const o = el("option", null, t); o.value = v; f.appendChild(o); });
      const b = bool(wert || "");
      f.value = b === null ? "" : String(b);
    } else {
      f = el("input", "tr-feld" + (breit ? " breit" : "")); f.type = "text";
      f.value = wert || "";
      if (art === "zahl") f.setAttribute("inputmode", "numeric");
      else if (art === "komma") f.setAttribute("inputmode", "decimal");
      ["autocapitalize", "autocorrect", "autocomplete"].forEach(k => f.setAttribute(k, "off"));
      f.spellcheck = false;
      f.setAttribute("enterkeyhint", "next");
    }
    f.setAttribute("aria-label", label);
    return f;
  }
  function weiter(e) {
    if (e.key !== "Enter" || e.shiftKey || e.altKey || e.isComposing) return;
    const i = ui.felder.indexOf(e.target);
    if (i < 0) return;
    e.preventDefault();
    const n = ui.felder[i + 1];
    if (n) n.focus(); else e.target.blur();
  }
  function zeichneTabelle(parent, a, ref) {
    const t = a.tabelle, vorgabe = t.vorgabeZeilen || 0;
    const zahlen = ref.typen.some(x => ART(x) === "zahl" || ART(x) === "komma") || (a.rueckgabe && ref.rueckgabe && /^(int|long|double|float)$/.test(ref.rueckgabe.typ));
    parent.appendChild(el("p", "tr-klein", "Строки — " + (t.punkte.some(p => p.wann === "bedingung") ? "каждая проверка условия" : "моменты из задания") +
      ". «—» — переменной в этот момент ещё нет (или значение не вычисляется). Нет вывода — оставь клетку пустой."));
    if (zahlen) {
      const leiste = el("div", "tr-tasten"); leiste.setAttribute("role", "toolbar"); leiste.setAttribute("aria-label", "Ввод чисел");
      const pm = el("button", "tr-taste", "± минус"); pm.type = "button";
      pm.setAttribute("aria-label", "Поменять знак числа в выбранной клетке");
      pm.addEventListener("pointerdown", e => e.preventDefault());
      pm.addEventListener("mousedown", e => e.preventDefault());
      pm.addEventListener("click", () => {
        const f = ui && ui.letztesFeld;
        if (!f || f.tagName !== "INPUT") { ui.info("Сначала нажми на клетку с числом, потом «±».", true); return; }
        const v = f.value.trim();
        f.value = /^[-−–]/.test(v) ? v.replace(/^[-−–]\s*/, "") : "-" + v;
        f.dispatchEvent(new Event("input", { bubbles: true }));
        try { f.focus({ preventScroll: true }); f.setSelectionRange(f.value.length, f.value.length); } catch (e) { }
      });
      leiste.appendChild(pm);
      leiste.appendChild(el("span", "tr-klein", "для отрицательных чисел; дробные — с точкой или запятой"));
      parent.appendChild(leiste);
    }
    const wrap = el("div", "tr-tabwrap"); wrap.tabIndex = -1;
    wrap.setAttribute("role", "region"); wrap.setAttribute("aria-label", "Wertetabelle (прокручивается вбок)");
    const tb = de("table", "tr-tabelle");
    const th = el("thead"), hr = el("tr");
    const h0 = el("th", "tr-h0", t.kopf); h0.scope = "col"; hr.appendChild(h0);
    t.spalten.forEach((s, k) => {
      const h = el("th", ART(ref.typen[k]) === "text" ? "tr-h-text" : null, s.titel); h.scope = "col";
      if (s.bedingung != null) h.title = "Ergebnis der Bedingung in Zeile " + s.bedingung + ": true oder false";
      hr.appendChild(h);
    });
    th.appendChild(hr); tb.appendChild(th);
    const tbd = el("tbody");
    ref.zeilen.forEach((z, r) => {
      const tr = el("tr"); if (r < vorgabe) tr.className = "tr-vorgabe";
      const rh = el("th", null, z.label); rh.scope = "row"; tr.appendChild(rh);
      z.zellen.forEach((c, k) => {
        const td = el("td", "tr-zelle");
        if (!c) { td.classList.add("leer"); td.appendChild(el("span", "tr-strich", "—")); td.setAttribute("aria-label", "нет значения"); }
        else if (r < vorgabe) { td.classList.add("fix"); td.appendChild(el("span", "tr-fixwert", c.text === "" ? " " : c.text)); }
        else {
          const key = r + ":" + k;
          const f = feldBauen(ART(c.typ), ui.ant.zellen[key], t.kopf + " " + z.label + ", " + t.spalten[k].titel.replace(/­/g, ""), c.typ === "ausgabe" || c.typ === "String");
          const upd = () => {
            const v = f.value;
            if (v === "") delete ui.ant.zellen[key]; else ui.ant.zellen[key] = v.slice(0, TEXT_MAX);
            td.classList.remove("ok", "falsch"); f.removeAttribute("aria-invalid");
            aendern();
          };
          f.addEventListener(f.tagName === "SELECT" ? "change" : "input", upd);
          f.addEventListener("keydown", weiter);
          f.addEventListener("focus", () => { ui.letztesFeld = f; });
          f.addEventListener("blur", () => { if (ui && ui.timer) ui.sichern(); });
          td.appendChild(f);
          const soll = el("span", "tr-soll"); soll.hidden = true; td.appendChild(soll);
          ui.felder.push(f); ui.zellen[key] = { td, f, soll, c };
        }
        tr.appendChild(td);
      });
      tbd.appendChild(tr);
    });
    tb.appendChild(tbd); wrap.appendChild(tb); parent.appendChild(wrap);
    if (a.rueckgabe && ref.rueckgabe) {
      const rb = el("div", "tr-rueckgabe tr-zelle");
      const lab = de("label", "tr-label", "Rückgabewert"); lab.htmlFor = "trRueck"; rb.appendChild(lab);
      const typ = ref.rueckgabe.typ;
      const f = feldBauen(ART(typ), ui.ant.rueckgabe, "Rückgabewert", true); f.id = "trRueck";
      if (istFeldTyp(typ)) f.placeholder = "{…}";
      f.addEventListener(f.tagName === "SELECT" ? "change" : "input", () => { ui.ant.rueckgabe = f.value.slice(0, TEXT_MAX); rb.classList.remove("ok", "falsch"); f.removeAttribute("aria-invalid"); aendern(); });
      f.addEventListener("keydown", weiter);
      f.addEventListener("focus", () => { ui.letztesFeld = f; });
      f.addEventListener("blur", () => { if (ui && ui.timer) ui.sichern(); });
      rb.appendChild(f);
      const soll = el("span", "tr-soll"); soll.hidden = true; rb.appendChild(soll);
      parent.appendChild(rb);
      ui.felder.push(f); ui.rueck = { td: rb, f, soll, c: ref.rueckgabe };
    }
  }

  /* ---------------------------------------------------------- Ausgabe */
  function zeichneAusgabeFeld(parent, a) {
    const lab = el("label", "tr-k-label", "Что появится на экране (каждая строка вывода — с новой строки)"); lab.htmlFor = "trAusgabe";
    parent.appendChild(lab);
    const ta = el("textarea", "tr-ausgabe-feld"); ta.id = "trAusgabe"; ta.rows = 6;
    ta.value = ui.ant.text || "";
    ["autocapitalize", "autocorrect", "autocomplete"].forEach(k => ta.setAttribute(k, "off"));
    ta.spellcheck = false;
    ta.addEventListener("input", () => { ui.ant.text = ta.value.slice(0, AUSGABE_MAX); ui.ausgabeMarken && ui.ausgabeMarken.replaceChildren(); aendern(); });
    ta.addEventListener("blur", () => { if (ui && ui.timer) ui.sichern(); });
    parent.appendChild(ta);
    ui.ta = ta;
  }

  /* ---------------------------------------------------------- Tests (Fehler finden) */
  function testKarten(liste, mitErhalten) {
    const ol = el("ol", "tr-tests");
    liste.forEach(t => {
      const li = el("li", "tr-test " + (t.ok ? "ok" : "nok"));
      const kopf = el("p", "tr-t-kopf");
      kopf.appendChild(el("span", "tr-t-zeichen", t.ok ? "✓" : "✗"));
      kopf.appendChild(el("b", null, "Testfall " + t.nr));
      li.appendChild(kopf);
      li.appendChild(zeile("Eingabe", t.eingabe));
      li.appendChild(zeile("Erwartet", t.erwartet));
      if (mitErhalten) li.appendChild(zeile("Erhalten", t.erhalten));
      ol.appendChild(li);
    });
    return ol;
  }
  function zeile(label, text) {
    const d = el("div", "tr-zeile-kv");
    d.appendChild(de("span", "tr-z-label", label));
    d.appendChild(el("code", "tr-z-wert", text));
    return d;
  }
  function zeichneTests(w, a, ref) {
    const k = karte(w, "Testfälle — ожидается / получено");
    k.appendChild(el("p", "tr-klein", "«Erhalten» — что выдаёт код из задания (с ошибками). Красный крестик — тест не пройден."));
    if (!ref.kompiliert) k.appendChild(el("p", "tr-alarm", "Код задания не компилируется — сообщи об этом."));
    k.appendChild(testKarten(ref.tests, true));
  }

  /* ---------------------------------------------------------- Prüfen und Ergebnis */
  function pruefenUI() {
    if (!ui) return;
    const a = ui.a;
    clearTimeout(ui.timer); ui.timer = null;
    let r;
    try { r = pruefen(a.id, ui.ant); }
    catch (e) { ui.info("Проверка не удалась: " + e.message, true); return; }
    ui.info(r.gespeichert ? "Ответ и попытка сохранены · " + zeit(Date.now()) : r.speicherfehler, !r.gespeichert);
    zeigeErgebnis(r, r.eintrag);
    ui.supportZeigen();
    zeichneVerlauf();
    ui.eb.textContent = TYPEN[a.typ].name + " · " + status(a.id).text;
    if (ui.ergebnis.scrollIntoView) ui.ergebnis.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function markiereTabelle(res) {
    Object.keys(ui.zellen).forEach(key => {
      const z = ui.zellen[key], ok = res.zellen[key];
      z.td.classList.toggle("ok", ok === true); z.td.classList.toggle("falsch", ok === false);
      if (ok === false) z.f.setAttribute("aria-invalid", "true"); else z.f.removeAttribute("aria-invalid");
    });
    if (ui.rueck && res.rueckgabe != null) {
      ui.rueck.td.classList.toggle("ok", res.rueckgabe); ui.rueck.td.classList.toggle("falsch", !res.rueckgabe);
      if (!res.rueckgabe) ui.rueck.f.setAttribute("aria-invalid", "true"); else ui.rueck.f.removeAttribute("aria-invalid");
    }
  }
  function zeigeErgebnis(res, h) {
    const e = ui.ergebnis, a = ui.a;
    e.replaceChildren(); e.hidden = false;
    const alle = res.correct === res.max;
    e.appendChild(el("h2", alle ? "ok" : "", (alle ? "✓ " : "") + "Верно " + res.correct + " из " + res.max + (res.typ === "tabelle" ? " клеток" : res.typ === "ausgabe" ? " строк" : " баллов")));
    const sup = h && h.support ? h.support : support(a.id);
    let fazit = (h && h.t ? zeit(h.t) + " · " : "") + "засчитано: " + HILFE_TEXT[sup] + ".";
    if (alle) fazit += sup === "selbst" ? " Отлично — это самостоятельное решение." : " Помощь была — вернись к задаче позже и реши её сама.";
    e.appendChild(el("p", "tr-klein", fazit));
    if (res.typ === "tabelle") {
      markiereTabelle(res);
      const falsch = Object.keys(res.zellen).filter(k => !res.zellen[k]).length + (res.rueckgabe === false ? 1 : 0);
      if (falsch) e.appendChild(el("p", null, "Неверных или пустых клеток: " + falsch + ". Они подсвечены красным в таблице" + (res.rueckgabe === false ? " (включая Rückgabewert)" : "") + ". Исправь и проверь ещё раз — или открой «Показать правильно»."));
    } else if (res.typ === "fehler") ergebnisFehler(e, res);
    else ergebnisAusgabe(e, res);
    if (alle || support(a.id) === "loesung") {
      const an = el("div", "tr-analyse");
      an.appendChild(el("p", "tr-label", "Разбор"));
      an.appendChild(el("p", null, a.analyse));
      e.appendChild(an);
    } else e.appendChild(el("p", "tr-klein", "Разбор откроется, когда всё будет верно, или вместе с «Показать правильно»."));
    ui.letzteBewertung = res;
  }
  function ergebnisFehler(e, res) {
    const ul = el("ul", "tr-befund");
    res.fehler.forEach(f => {
      if (!f.gefunden) return;
      const zl = f.zeilen.length > 1 ? "Строки " + f.zeilen.join(" и ") : "Строка " + f.zeilen[0];
      const li = el("li", f.behoben ? "ok" : "teil");
      li.appendChild(el("b", null, (f.behoben ? "✓ " : "◐ ") + zl + ": ошибка найдена"));
      li.appendChild(el("span", null, f.behoben ? " — и исправлена (+2)." : " (+1), но исправление не подходит" + (f.meldung ? ": " + f.meldung : "") + "."));
      ul.appendChild(li);
    });
    res.falsch.forEach(z => {
      const li = el("li", "nok");
      li.appendChild(el("b", null, "✗ Строка " + z + ": "));
      li.appendChild(el("span", null, "здесь смысловой ошибки нет (−1). Сними отметку."));
      ul.appendChild(li);
    });
    const offen = res.fehler.filter(f => !f.gefunden).length;
    if (offen) { const li = el("li", "nok"); li.appendChild(el("b", null, "○ Не найдено ошибок: " + offen)); li.appendChild(el("span", null, ". Проведи Schreibtischtest для непройденного теста.")); ul.appendChild(li); }
    if (ul.childNodes.length) e.appendChild(ul);
    /* Markierungen im Code */
    Object.keys(ui.zeilenKnoepfe || {}).forEach(n => {
      const b = ui.zeilenKnoepfe[n], z = Number(n);
      const f = res.fehler.find(x => x.gefunden && x.zeilen.includes(z));
      b.classList.toggle("ok", !!(f && f.behoben)); b.classList.toggle("teil", !!(f && !f.behoben)); b.classList.toggle("nok", res.falsch.includes(z));
    });
    const g = res.gesamt;
    const d = el("div", "tr-gesamt");
    d.appendChild(el("p", "tr-label", "Твой код со всеми исправлениями"));
    if (!g.kompiliert) d.appendChild(el("p", "tr-alarm", "Код не запускается: " + (g.fehler || "ошибка")));
    else {
      d.appendChild(el("p", g.bestanden === g.gesamt ? "tr-ok-text" : null, "Тесты: " + g.bestanden + " из " + g.gesamt + " пройдено."));
      d.appendChild(testKarten(g.tests, true));
    }
    e.appendChild(d);
  }
  function ergebnisAusgabe(e, res) {
    const ol = el("ol", "tr-a-zeilen");
    res.zeilen.forEach((z, i) => {
      const li = el("li", z.ok ? "ok" : "nok");
      li.appendChild(el("span", "tr-t-zeichen", z.ok ? "✓" : "✗"));
      li.appendChild(el("span", null, "Строка " + (i + 1) + ": "));
      li.appendChild(el("code", null, z.ist == null ? "(нет строки)" : z.ist));
      ol.appendChild(li);
    });
    e.appendChild(ol);
    if (res.extra) e.appendChild(el("p", "tr-klein fehler", "Лишних строк: " + res.extra + " (−" + res.extra + "). Программа выводит " + res.zeilen.length + " " + (res.zeilen.length < 5 ? "строки" : "строк") + "."));
    e.appendChild(el("p", "tr-klein", "Сравнение построчно: пробелы в начале и в конце строки и пустые строки не учитываются."));
  }

  /* ---------------------------------------------------------- Lösung */
  function loesungAn() {
    const a = ui.a, ref = ui.ref, box = ui.loesBox;
    box.replaceChildren(); box.hidden = false;
    box.appendChild(el("p", "tr-label", "Правильно"));
    if (a.typ === "tabelle") {
      Object.keys(ui.zellen).forEach(key => { const z = ui.zellen[key]; z.soll.hidden = false; z.soll.textContent = "верно: " + (z.c.text === "" ? "(пусто)" : z.c.text); });
      if (ui.rueck) { ui.rueck.soll.hidden = false; ui.rueck.soll.textContent = "верно: " + ui.rueck.c.text; }
      box.appendChild(el("p", null, "Правильные значения показаны под каждой клеткой таблицы" + (ui.rueck ? " и под Rückgabewert" : "") + "."));
    } else if (a.typ === "fehler") {
      const ol = el("ol", "tr-fixliste");
      a.fehler.forEach(f => {
        const li = el("li");
        f.zeilen.forEach(z => {
          const p = el("p", "tr-fix");
          p.appendChild(el("b", null, "Zeile " + z + ": "));
          p.appendChild(el("code", "tr-alt-code", ref.zeilen[z - 1].trim()));
          p.appendChild(el("span", null, " → "));
          p.appendChild(el("code", "tr-neu-code", f.fix[z]));
          li.appendChild(p);
        });
        li.appendChild(el("p", "tr-klein", f.ru));
        ol.appendChild(li);
        f.zeilen.forEach(z => { const b = ui.zeilenKnoepfe && ui.zeilenKnoepfe[z]; if (b) b.classList.add("soll"); });
      });
      box.appendChild(ol);
      box.appendChild(el("p", "tr-klein", "Строки с ошибками отмечены в коде полосой слева. Другие правильные варианты исправления тоже засчитываются, если с ними проходят все тесты."));
    } else {
      const pre = el("pre", "tr-pre", ref.zeilen.join("\n")); box.appendChild(pre);
    }
    if (ui.letzteBewertung && ui.ergebnis && !ui.ergebnis.querySelector(".tr-analyse")) {
      const an = el("div", "tr-analyse");
      an.appendChild(el("p", "tr-label", "Разбор"));
      an.appendChild(el("p", null, a.analyse));
      const alt = ui.ergebnis.querySelector(".tr-klein:last-child");
      if (alt && /Разбор откроется/.test(alt.textContent)) alt.remove();
      ui.ergebnis.appendChild(an);
    }
    box.appendChild(el("p", "tr-klein", "Чтобы попытка засчиталась как самостоятельная, начни позже «Новую попытку» и реши без подсказки."));
  }

  function zeichneVerlauf() {
    if (!ui) return;
    const v = ui.verlauf; v.replaceChildren();
    const x = vorhanden(ui.a.id), h = x ? x.historie.slice().reverse() : [];
    const d = el("details", "tr-details");
    d.appendChild(el("summary", null, "История проверок (" + h.length + ")"));
    if (!h.length) d.appendChild(el("p", "tr-klein", "Проверок пока не было."));
    const ul = el("ul", "tr-historie");
    h.forEach(e => {
      ul.appendChild(el("li", e.correct === e.max ? "ok" : null,
        zeit(e.t) + " · " + e.correct + "/" + e.max + " · " + HILFE_TEXT[e.support] + (e.versuch > 1 ? " · попытка " + e.versuch : "")));
    });
    d.appendChild(ul);
    v.appendChild(d);
  }

  /* ---------------------------------------------------------- Navigation */
  function einhaengen() {
    const alt = root.schirm;
    if (typeof alt === "function" && !alt.__tr) {
      const neu = function (name) {
        if (name === "scTrace") { const hs = history.state || {}; oeffnen(hs.seite === "scTrace" ? hs.tr : null, true); return; }
        const s = $("scTrace");
        if (s && !s.hidden) { if (ui && ui.timer) ui.sichern(); s.hidden = true; }
        return alt.apply(this, arguments);
      };
      neu.__tr = true; root.schirm = neu;
    }
    root.addEventListener("popstate", ev => {
      const st = ev.state || {};
      if (st.seite === "scTrace") { oeffnen(st.tr, true); return; }
      const s = $("scTrace");
      if (s && !s.hidden) {
        /* zurueck.js kennt scTrace evtl. noch nicht — dann selbst zurückkehren */
        const ziel = st.seite || "scStart";
        if (typeof root.schirm === "function") root.schirm(ziel); else s.hidden = true;
        if (ziel === "scStart" && typeof root.renderStart === "function") { try { root.renderStart(); } catch (e) { } }
      }
    });
    root.addEventListener("pagehide", () => { if (ui && ui.timer) ui.sichern(); });
  }
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }

  const api = {
    oeffnen: id => oeffnen(id || null), liste, status, antwort, entwurf, hilfe, loesungZeigen, neuerVersuch, pruefen, bewerten, support,
    referenz: id => kopie(referenz(id)), loesungText: id => { const a = finde(id); if (!a) throw new Error("Неизвестная задача: " + id); return loesungText(a); },
    codeMit: (id, aend) => codeMit(finde(id), aend),
    stand: () => kopie(ST), aufgabe: id => (finde(id) ? kopie(finde(id)) : null),
    fehler: () => lesefehler || schreibfehler, _neuLaden: () => { ST = laden(); refCache.clear(); }
  };
  root.GENTRACE = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
