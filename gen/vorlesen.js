/* ============================================================================
   gen/vorlesen.js — deutsche Musterantworten anhören (unterwegs, ohne Lesen)
   ----------------------------------------------------------------------------
   Nutzt die Sprachausgabe des Browsers (speechSynthesis), Sprache de-DE,
   Tempo 0,9. Eine deutsche Stimme wird gewählt, wenn das Gerät eine hat
   (bevorzugt eine lokale — die geht auch ohne Netz); sonst liest der
   Browser mit lang = "de-DE" und seiner Standardstimme.

   API (window.GENVORLESEN):
     knopf(text | () => text)  → <button class="vl-knopf">🔊 Anhören</button>
                                  oder null, wenn es nichts Vorlesbares gibt
                                  (keine Sprachausgabe, leer, Code/SQL,
                                  HTML mit <pre>/<code>/<table>).
                                  Zweites Tippen = Stopp.
     verfuegbar()              → true, wenn der Browser vorlesen kann
     stopp()                   → laufendes Vorlesen beenden
   Reine Funktionen (tests/vorlesen.test.js):
     vorbereiten(roh) → {text, grund}, saeubern, htmlZuText, istCode,
     waehleStimme(stimmen), teile(text, max)

   Speichert nichts.
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined";
  const LANG = "de-DE";
  const TEMPO = 0.9;
  const STUECK = 220;          /* Chrome bricht lange Äußerungen nach ~15 s ab */

  /* ======================================================================
     Text vorbereiten — reine Funktionen
     ====================================================================== */
  const ENTITAETEN = {
    nbsp: " ", amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", shy: "", ndash: "–", mdash: "—",
    hellip: "…", bdquo: "„", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", auml: "ä", ouml: "ö",
    uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß", euro: "€", times: "×", rarr: "→", larr: "←"
  };
  function entitaeten(s) {
    return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (ganz, n) => {
      if (n[0] === "#") {
        const c = n[1] === "x" || n[1] === "X" ? parseInt(n.slice(2), 16) : parseInt(n.slice(1), 10);
        return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : "";
      }
      return Object.prototype.hasOwnProperty.call(ENTITAETEN, n) ? ENTITAETEN[n] : ganz;
    });
  }

  /** HTML → Text mit Zeilenumbrüchen an Absatz-, Listen- und <br>-Grenzen */
  function htmlZuText(roh) {
    let s = String(roh == null ? "" : roh);
    if (s.indexOf("<") < 0) return entitaeten(s);
    s = s.replace(/<(script|style|svg|math)\b[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<img\b[^>]*>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr|ul|ol|pre|blockquote|section|article|header|footer)\s*>/gi, "\n")
      .replace(/<(p|div|h[1-6]|ul|ol|blockquote)\b[^>]*>/gi, "\n")
      .replace(/<\/?[a-z][^>]*>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");
    return entitaeten(s);
  }

  /* Code und SQL werden nicht vorgelesen. Bewusst vorsichtig: Musterantworten
     mit „<“, „<=“, „getInstanz()“ oder „4 × 5 = 20“ bleiben Text.          */
  const SQL = /\b(SELECT\b[\s\S]{0,400}\bFROM|INSERT\s+INTO|DELETE\s+FROM|CREATE\s+(TABLE|VIEW|INDEX|DATABASE)|ALTER\s+TABLE|DROP\s+(TABLE|VIEW|INDEX)|GRANT\s+\w+[\s\S]{0,80}\bON\b|REVOKE\s+\w+[\s\S]{0,80}\bON\b)\b/;
  const SQL_KLEIN = /\bselect\b[^.!?]{0,200}\bfrom\b|\bupdate\s+\w+\s+set\b|\binsert\s+into\b|\bdelete\s+from\b/i;
  const STARK = /(==|!=|&&|\|\||\+\+|\+=|-=|=>|:=|←|\{|\}|;\s*$|\/\/|\/\*|\breturn\b[^.!?]*;|\bfunction\s*\w*\s*\(|\b(public|private|protected)\s+(static\s+)?(void|int|String|boolean|double|class)\b)/m;
  const PSEUDO = /(^|[\s(])(WENN|DANN|SONST|SOLANGE|ENDE\s?WENN|ENDEWENN|ENDE\s?SOLANGE|WIEDERHOLE|ENDE\s?FÜR|RÜCKGABE|AUSGABE|EINGABE|IF|THEN|ELSE|ENDIF|WHILE|ENDWHILE|RETURN)(?=$|[\s:(])/gm;
  function codeZeile(z) {
    const t = z.trim();
    if (!t) return false;
    return /[{};]\s*$/.test(t) ||
      /^(if|for|while|else|switch|case|return|function|def|class|public|private|protected|var|let|const|int|double|float|bool|boolean|String|void|import|package|#include|try|catch)\b[\s({]/.test(t) ||
      /(==|!=|&&|\|\||\+\+|\+=|-=|=>|:=|←)/.test(t) ||
      /^[A-Za-z_$][\w$]*(\.[\w$]+)*(\[[^\]]*\])?\s*=\s*[^=\s]/.test(t) ||
      /^[A-Za-z_$][\w$.]*\([^()]*\)\s*;?$/.test(t);
  }
  function istCode(text) {
    const s = String(text == null ? "" : text);
    if (!s.trim()) return false;
    if (SQL.test(s) || SQL_KLEIN.test(s)) return true;
    if ((s.match(PSEUDO) || []).length >= 2) return true;
    const zeilen = s.split(/\n/).filter(z => z.trim());
    const code = zeilen.filter(codeZeile).length;
    if (code >= 2 && code / zeilen.length >= 0.25) return true;
    if (zeilen.length === 1 && STARK.test(s)) return true;
    const zeichen = s.replace(/\s/g, "");
    const sym = (zeichen.match(/[{}[\];=|&]/g) || []).length;
    return zeichen.length > 0 && sym / zeichen.length > 0.06;
  }

  const ABK = [
    [/\b([zZ])\.\s?B\./g, (g, z) => z === "Z" ? "Zum Beispiel" : "zum Beispiel"],
    [/\b([dD])\.\s?h\./g, (g, d) => d === "D" ? "Das heißt" : "das heißt"],
    [/\b([uU])\.\s?a\./g, (g, u) => u === "U" ? "Unter anderem" : "unter anderem"],
    [/\b([zZ])\.\s?T\./g, (g, z) => z === "Z" ? "Zum Teil" : "zum Teil"],
    [/\bi\.\s?d\.\s?R\./g, "in der Regel"],
    [/\bbzw\./g, "beziehungsweise"], [/\bbspw\./g, "beispielsweise"], [/\bggf\./g, "gegebenenfalls"],
    [/\busw\./g, "und so weiter"], [/\betc\./g, "et cetera"], [/\bevtl\./g, "eventuell"], [/\binkl\./g, "inklusive"],
    [/\bca\./g, "circa"], [/\bvgl\./g, "vergleiche"], [/\bsog\./g, "sogenannte"], [/\bmind\./g, "mindestens"],
    [/\bmax\./g, "maximal"], [/\bNr\./g, "Nummer"],
    [/\(PK\)/g, "(Primärschlüssel)"], [/\(FK\)/g, "(Fremdschlüssel)"]
  ];

  /** Text für die Sprachausgabe: Markup, Zeilennummern und Aufzählungszeichen weg,
      Abkürzungen ausgeschrieben, jede Zeile ein eigener Satz (Pause).          */
  function saeubern(roh) {
    let s = htmlZuText(roh)
      .replace(/\r/g, "")
      .replace(/```[\s\S]*?```/g, "\n")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1")
      .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, "$1");
    const zeilen = s.split("\n").map(z => z
      .replace(/^\s*#{1,6}\s+/, "")
      .replace(/^\s*(\(?\d{1,3}\)|\d{1,3}\s*[:|]\s|[a-z]\)\s)\s*/, "")
      .replace(/^\s*[-–—•·*▪◦►]\s+/, "")
      .replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .map(z => /[.!?:;…]["“”»«)]*$/.test(z) ? z : z + ".");
    s = zeilen.join(" ");
    ABK.forEach(([re, ers]) => { s = s.replace(re, ers); });
    s = s.replace(/\s*(->|→|⇒|=>)\s*/g, " – ")
      .replace(/\s*<=\s*/g, " kleiner gleich ").replace(/\s*>=\s*/g, " größer gleich ")
      .replace(/\s<\s/g, " kleiner als ").replace(/\s>\s/g, " größer als ")
      .replace(/\s*×\s*/g, " mal ").replace(/\s=\s/g, " gleich ")
      .replace(/[*_#`|]/g, " ")
      .replace(/\s+([.,;:!?])/g, "$1")
      .replace(/\s+/g, " ").trim();
    return s;
  }

  /** Rohtext/HTML → {text, grund}; text leer heißt: keinen Knopf zeigen */
  function vorbereiten(roh) {
    const r = String(roh == null ? "" : roh);
    if (/<(pre|code)\b/i.test(r)) return { text: "", grund: "code" };
    if (/<table\b/i.test(r)) return { text: "", grund: "tabelle" };
    const roh2 = htmlZuText(r);
    if (istCode(roh2)) return { text: "", grund: "code" };
    const text = saeubern(r);
    if (!/[A-Za-zÄÖÜäöüß]{2}/.test(text)) return { text: "", grund: "leer" };
    return { text, grund: "" };
  }

  /** Text in Stücke ≤ max an Satzgrenzen (Satzende = .!?… vor Leerraum) */
  function teile(text, max) {
    max = max || STUECK;
    const s = String(text || "").replace(/\s+/g, " ").trim();
    if (!s) return [];
    const saetze = (s.match(/[\s\S]*?[.!?…]+["“”»«)]*(?=\s|$)|[\s\S]+$/g) || []).map(x => x.trim()).filter(Boolean);
    const klein = [];
    saetze.forEach(satz => {
      while (satz.length > max) {
        let cut = satz.lastIndexOf(", ", max);
        if (cut < max / 3) cut = satz.lastIndexOf(" ", max);
        if (cut < 1) cut = max;
        klein.push(satz.slice(0, cut + (satz[cut] === "," ? 1 : 0)).trim());
        satz = satz.slice(cut + 1).trim();
      }
      if (satz) klein.push(satz);
    });
    const out = [];
    klein.forEach(k => {
      if (out.length && out[out.length - 1].length + 1 + k.length <= max) out[out.length - 1] += " " + k;
      else out.push(k);
    });
    return out;
  }

  /** Beste deutsche Stimme: de-DE vor de-AT/de-CH, lokal (offline) vor Netz,
      Standardstimme vor anderen. Keine deutsche → null (dann nur lang).      */
  function waehleStimme(stimmen) {
    let beste = null, bestWert = -1;
    Array.from(stimmen || []).forEach(v => {
      if (!v) return;
      const l = String(v.lang || "").replace(/_/g, "-").toLowerCase();
      let w = l === "de-de" ? 30 : /^de(-|$)/.test(l) ? 20 : -1;
      if (w < 0) return;
      if (v.localService) w += 4;
      if (v.default) w += 2;
      if (/enhanced|premium|natural|neural|verbessert/i.test(String(v.name || ""))) w += 1;
      if (w > bestWert) { beste = v; bestWert = w; }
    });
    return beste;
  }

  /* ======================================================================
     Sprachausgabe
     ====================================================================== */
  function verfuegbar() {
    try {
      return !!(root.speechSynthesis && typeof root.speechSynthesis.speak === "function" &&
                typeof root.SpeechSynthesisUtterance === "function");
    } catch (e) { return false; }
  }

  let STIMMEN = [];
  function stimmenLaden() {
    try { const v = root.speechSynthesis.getVoices(); if (v && v.length) STIMMEN = Array.from(v); } catch (e) { }
    return STIMMEN;
  }
  if (verfuegbar()) {
    stimmenLaden();
    try {
      const ss = root.speechSynthesis;
      if (ss.addEventListener) ss.addEventListener("voiceschanged", stimmenLaden);
      else if ("onvoiceschanged" in ss) ss.onvoiceschanged = stimmenLaden;
    } catch (e) { }
  }

  let SITZUNG = 0;
  let AKTIV = null;    /* { knopf, sitzung, wache } */

  function knopfZustand(b, an) {
    if (!b) return;
    b.classList.toggle("an", !!an);
    b.setAttribute("aria-pressed", an ? "true" : "false");
    b.textContent = an ? "⏹ Stopp" : "🔊 Anhören";
  }

  function beenden(sitzung) {
    if (!AKTIV || (sitzung != null && AKTIV.sitzung !== sitzung)) return;
    clearInterval(AKTIV.wache);
    knopfZustand(AKTIV.knopf, false);
    AKTIV = null;
  }

  function stopp() {
    const war = AKTIV;
    SITZUNG++;
    if (war) { clearInterval(war.wache); knopfZustand(war.knopf, false); AKTIV = null; }
    try { if (verfuegbar()) root.speechSynthesis.cancel(); } catch (e) { }
  }

  /** Text sprechen; der Knopf zeigt „Stopp“, solange gelesen wird */
  function sprechen(text, b) {
    if (!verfuegbar()) return false;
    const ss = root.speechSynthesis;
    const stuecke = teile(text);
    if (!stuecke.length) return false;
    const lief = !!(AKTIV || ss.speaking || ss.pending);
    stopp();
    const sitzung = ++SITZUNG;
    const stimme = waehleStimme(stimmenLaden());
    const los = () => {
      if (sitzung !== SITZUNG) return;
      try { if (ss.paused) ss.resume(); } catch (e) { }
      stuecke.forEach((s, i) => {
        const u = new root.SpeechSynthesisUtterance(s);
        u.lang = LANG; u.rate = TEMPO;
        if (stimme) { try { u.voice = stimme; } catch (e) { } }
        if (i === stuecke.length - 1) u.onend = () => beenden(sitzung);
        u.onerror = ev => {
          if (ev && (ev.error === "interrupted" || ev.error === "canceled")) return;
          beenden(sitzung);
        };
        ss.speak(u);
      });
    };
    let still = 0;
    AKTIV = {
      knopf: b, sitzung,
      wache: setInterval(() => {
        if (sitzung !== SITZUNG) return;
        /* Knopf nicht mehr auf der Seite (weiter, zurück) → aufhören */
        if (b && b.isConnected === false) { stopp(); return; }
        /* manche Android-Browser melden das Ende nicht */
        still = (ss.speaking || ss.pending) ? 0 : still + 1;
        if (still >= 3) beenden(sitzung);
      }, 700)
    };
    knopfZustand(b, true);
    /* Direkt im Tippen sprechen (iOS verlangt das); nur nach einem Abbruch
       kurz warten — Chrome verschluckt sonst manchmal das erste Stück.     */
    if (lief) setTimeout(los, 120); else los();
    return true;
  }

  /* ---------------------------------------------------------- Knopf --- */
  function stil() {
    if (!hatDom || document.getElementById("vlStil")) return;
    const st = document.createElement("style");
    st.id = "vlStil";
    st.textContent =
      ".btn.vl-knopf{display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:44px; max-width:100%;" +
      " margin:10px 0 0; padding:8px 14px; font-family:var(--body); text-transform:none; letter-spacing:0; font-size:14px;" +
      " font-weight:650; border-radius:9px; white-space:normal; text-align:left; line-height:1.25}" +
      ".btn.vl-knopf.an{background:var(--pruefer); border-color:var(--pruefer); color:#fff}";
    (document.head || document.documentElement).appendChild(st);
  }

  /** Knopf „🔊 Anhören“ — oder null, wenn nichts Sinnvolles vorzulesen ist */
  function knopf(quelle, opt) {
    if (!hatDom || !verfuegbar()) return null;
    const lesen = () => { try { return typeof quelle === "function" ? quelle() : quelle; } catch (e) { return ""; } };
    const jetzt = lesen();
    /* Text schon da → gleich entscheiden; bei einer Funktion, die noch leer
       ist, entscheidet erst das Tippen. */
    if (typeof quelle !== "function" || (jetzt != null && String(jetzt).trim())) {
      if (!vorbereiten(jetzt).text) return null;
    }
    stil();
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn vl-knopf" + (opt && opt.klasse ? " " + opt.klasse : "");
    b.title = "Deutsch vorlesen (Sprachausgabe des Geräts)";
    knopfZustand(b, false);
    b.addEventListener("click", ev => {
      ev.preventDefault();
      if (AKTIV && AKTIV.knopf === b) { stopp(); return; }
      const r = vorbereiten(lesen());
      if (!r.text) { b.textContent = "Нечего читать"; setTimeout(() => knopfZustand(b, false), 1500); return; }
      sprechen(r.text, b);
    });
    return b;
  }

  if (hatDom && root.addEventListener) {
    root.addEventListener("pagehide", () => { if (AKTIV) stopp(); });
  }

  const api = { knopf, verfuegbar, stopp, sprechen, vorbereiten, saeubern, htmlZuText, istCode, waehleStimme, teile,
                LANG, TEMPO };
  root.GENVORLESEN = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
