/* ============================================================================
   gen/sql.js — SQL-Trainer (AP2)
   ----------------------------------------------------------------------------
   Echte Datenbank im Browser (sql.js = SQLite als WebAssembly, MIT-Lizenz,
   vendor/sqljs-1.14.2/). Wird erst geladen, wenn der Trainer geöffnet wird,
   danach liegt sie im Offline-Speicher.

   Jede Ausführung startet mit frischen Daten (gen/sql-daten.js: Online-Shop,
   IT-Service, Mini-Daten). Geprüft wird nicht der Text, sondern das Ergebnis:
     select      gleiche Zeilen und Spalten wie die Musterlösung
                 (Spaltenreihenfolge und Aliasnamen egal, Zeilenreihenfolge nur
                 bei ORDER BY-Aufgaben)
     dml         alle Tabellen danach wie nach der Musterlösung
     ddl         Tabelle, Spalten, Datentypen, Primär- und Fremdschlüssel
     view        Sicht vorhanden und liefert dasselbe
     muster      CREATE USER / GRANT / REVOKE kann SQLite nicht ausführen:
                 Anweisungen werden zerlegt und mit dem Muster verglichen
                 (Groß-/Kleinschreibung, Leerraum, Anführungszeichen, Host-
                 Angabe @… und Reihenfolge der Rechte egal) — ehrlich als
                 „Prüfung nach Muster, ohne Ausführung“ beschriftet
     vorhersage  Abfrage lesen, Ergebnistabelle wählen bzw. Zeilenzahl/Wert
                 eingeben. Die Wahrheit ist die echte Ausführung.

   SQL-Beiblatt der IHK (Stand 2024-10-07), so läuft es hier:
     YEAR, MONTH, DAY, WEEKDAY (Montag = 0), HOUR, MINUTE, NOW, LEFT, RIGHT
     als eigene Funktionen. DATEDIFF(Datumsteil, Anfang, Ende) und
     DATEADD(Datumsteil, Intervall, Datum) mit DAY, MONTH, YEAR, HOUR, MINUTE.
     Der Datumsteil steht ohne Anführungszeichen; SQLite hielte DAY für eine
     Spalte. Darum wird jede Anweisung vor dem Ausführen von links nach rechts
     gelesen (Texte '…', Namen "…" `…` [...] und Kommentare werden
     übersprungen) und nur das erste Argument eines DATEDIFF/DATEADD-Aufrufs
     mit genau drei Argumenten zu 'DAY' usw. — siehe datumsteilQuoten().
     DATEDIFF zählt wie SQL Server die Grenzen (YEAR = Jahr(Ende) −
     Jahr(Anfang), DAY = Kalendertage). Die alte MySQL-Form DATEDIFF(Ende,
     Anfang) mit zwei Angaben (Tage) bleibt gültig — unterschieden wird an der
     Zahl der Argumente (Funktion mit variabler Argumentzahl).
     STDDEV, VARIANCE (über alle Werte, Teiler n wie MySQL), CORR (Pearson):
     Aggregatfunktionen über create_aggregate; NULL zählt nicht.
   Dazu MySQL-Schreibweisen: UCASE, LCASE, CURDATE, CONCAT; AUTO_INCREMENT
   wird still entfernt, ALTER TABLE … ADD FOREIGN KEY nachgebildet, mehrere
   ADD/DROP in einem ALTER TABLE nacheinander ausgeführt, der Datentyp hinter
   DROP COLUMN (so im Beiblatt) weggelassen.

   Fortschritt: ap2:sql = { v:1, a: { id: { ok, n, t, code, gesehen, hilfe,
   feedback, letzt } }, pos, frei, freiDb }
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined";
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const LIB = "vendor/sqljs-1.14.2/";
  const SK = "ap2:sql";
  const MAX_ZEILEN = 20000;
  const BUCHST = ["A", "B", "C", "D", "E", "F"];

  const daten = () => root.GENSQLDATEN || (typeof require === "function" ? require("./sql-daten.js") : null);
  /** Datenbank einer Aufgabe: { titel, SCHEMA, TABELLEN } — ohne Angabe der Online-Shop. */
  function datenbank(name) {
    const D = daten();
    return (D.DBS && D.DBS[name || "shop"]) || { titel: "Online-Shop", SCHEMA: D.SCHEMA, TABELLEN: D.TABELLEN };
  }
  /** Alle Aufgaben in der Reihenfolge der Themen (so wie in der Liste). */
  let REIHE = null;
  function liste() {
    if (REIHE) return REIHE;
    const D = daten(), k = D.THEMEN.map(t => t.key);
    const rang = a => { const i = k.indexOf(a.thema); return i < 0 ? k.length : i; };
    REIHE = D.AUFGABEN.map((a, i) => ({ a, i })).sort((x, y) => (rang(x.a) - rang(y.a)) || (x.i - y.i)).map(x => x.a);
    return REIHE;
  }

  /* ======================================================================
     Laden der Datenbank-Bibliothek
     ====================================================================== */
  let SQL = null, ladeVersprechen = null;
  function setzeSQL(s) { SQL = s; }
  function laden() {
    if (SQL) return Promise.resolve(SQL);
    if (ladeVersprechen) return ladeVersprechen;
    ladeVersprechen = new Promise((ok, nein) => {
      const los = () => root.initSqlJs({ locateFile: f => LIB + f }).then(s => { SQL = s; ok(s); }, nein);
      if (typeof root.initSqlJs === "function") { los(); return; }
      /* Als Datei geöffnet (file://) darf der Browser keine .wasm nachladen —
         dann die reine JavaScript-Fassung (größer, gleiche Funktionen). */
      const s = document.createElement("script");
      s.src = LIB + (location.protocol === "file:" ? "sql-asm.js" : "sql-wasm.js");
      s.onload = los;
      s.onerror = () => nein(new Error("Bibliothek nicht geladen"));
      document.head.appendChild(s);
    }).catch(e => { ladeVersprechen = null; throw e; });
    return ladeVersprechen;
  }

  /* ======================================================================
     Text zerlegen und vorbereiten — reine Funktionen
     ====================================================================== */
  /** SQL-Text in einzelne Anweisungen (Kommentare raus, ; in Texten bleibt). */
  function zerlege(sql) {
    const out = []; let cur = "", q = null;
    const s = String(sql || "");
    for (let i = 0; i < s.length; i++) {
      const c = s[i], n = s[i + 1];
      if (q) { cur += c; if (c === q) { if (n === q) { cur += n; i++; } else q = null; } continue; }
      if (c === "'" || c === '"' || c === "`") { q = c; cur += c; continue; }
      if (c === "-" && n === "-") { const e = s.indexOf("\n", i); i = e < 0 ? s.length : e - 1; cur += " "; continue; }
      if (c === "#") { const e = s.indexOf("\n", i); i = e < 0 ? s.length : e - 1; cur += " "; continue; }
      if (c === "/" && n === "*") { const e = s.indexOf("*/", i + 2); i = e < 0 ? s.length : e + 1; cur += " "; continue; }
      if (c === ";") { if (cur.trim()) out.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  const DATUMSTEILE = ["DAY", "MONTH", "YEAR", "HOUR", "MINUTE"];
  /** Ende eines Textes, Namens oder Kommentars ab Position i — sonst -1. */
  function ueberspringen(s, i) {
    const c = s[i];
    if (c === "'" || c === '"' || c === "`") {
      for (let j = i + 1; j < s.length; j++) {
        if (s[j] === c) { if (s[j + 1] === c) { j++; continue; } return j + 1; }
      }
      return s.length;
    }
    if (c === "[") { const e = s.indexOf("]", i + 1); return e < 0 ? s.length : e + 1; }
    if (c === "-" && s[i + 1] === "-") { const e = s.indexOf("\n", i); return e < 0 ? s.length : e; }
    if (c === "/" && s[i + 1] === "*") { const e = s.indexOf("*/", i + 2); return e < 0 ? s.length : e + 2; }
    return -1;
  }
  /** Zahl der Argumente des Aufrufs, dessen „(“ an Position auf steht (-1 = offen). */
  function argumente(s, auf) {
    let tiefe = 0, n = 1, leer = true;
    for (let i = auf; i < s.length; i++) {
      const sp = ueberspringen(s, i);
      if (sp >= 0) { i = sp - 1; leer = false; continue; }
      const c = s[i];
      if (c === "(") { tiefe++; continue; }
      if (c === ")") { tiefe--; if (!tiefe) return leer ? 0 : n; continue; }
      if (c === "," && tiefe === 1) n++;
      else if (!/\s/.test(c)) leer = false;
    }
    return -1;
  }
  /** DATEDIFF(DAY, …) → DATEDIFF('DAY', …): nur das erste von genau drei
      Argumenten, nur außerhalb von Texten, Namen und Kommentaren. */
  function datumsteilQuoten(sql) {
    const s = String(sql == null ? "" : sql);
    let aus = "", i = 0;
    while (i < s.length) {
      const sp = ueberspringen(s, i);
      if (sp >= 0) { aus += s.slice(i, sp); i = sp; continue; }
      const c = s[i];
      if (/[A-Za-z_]/.test(c) && !/[\w$]/.test(s[i - 1] || "")) {
        let j = i;
        while (j < s.length && /[\w$]/.test(s[j])) j++;
        const wort = s.slice(i, j);
        const vorPunkt = s[i - 1] === ".";
        aus += wort; i = j;
        if (!vorPunkt && /^DATE(DIFF|ADD)$/i.test(wort)) {
          const m = /^\s*\(/.exec(s.slice(i));
          if (m) {
            const auf = i + m[0].length - 1;
            const k = /^\(\s*([A-Za-z]+)(?=\s*,)/.exec(s.slice(auf));
            if (k && DATUMSTEILE.indexOf(k[1].toUpperCase()) >= 0 && argumente(s, auf) === 3) {
              aus += s.slice(i, auf + k[0].length - k[1].length) + "'" + k[1].toUpperCase() + "'";
              i = auf + k[0].length;
            }
          }
        }
        continue;
      }
      aus += c; i++;
    }
    return aus;
  }

  /** ALTER TABLE t ADD COLUMN a …, ADD COLUMN b … (MySQL) → einzelne Anweisungen. */
  const RX_ALTER = /^(\s*ALTER\s+TABLE\s+[`"]?\w+[`"]?)\s+((?:ADD|DROP)\b[\s\S]*)$/i;
  function alterAufteilen(stmt) {
    const m = RX_ALTER.exec(stmt);
    if (!m) return [stmt];
    const teile = obenTeilen(m[2]);
    if (teile.length < 2 || !teile.every(t => /^(ADD|DROP)\b/i.test(t))) return [stmt];
    return teile.map(t => m[1].trim() + " " + t);
  }

  const RX_FK = /^\s*ALTER\s+TABLE\s+[`"]?(\w+)[`"]?\s+ADD\s+(?:CONSTRAINT\s+[`"]?\w+[`"]?\s+)?FOREIGN\s+KEY\s*\(\s*[`"]?(\w+)[`"]?\s*\)\s*REFERENCES\s+[`"]?(\w+)[`"]?\s*(?:\(\s*[`"]?(\w+)[`"]?\s*\))?\s*(?:ON\s+(?:DELETE|UPDATE)\s+[\w ]+)?$/i;
  const RX_DROP_TYP = /^(\s*ALTER\s+TABLE\s+[`"]?\w+[`"]?\s+DROP\s+COLUMN\s+[`"]?\w+[`"]?)\s+(?!CASCADE\b|RESTRICT\b)[A-Za-z]+(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?\s*$/i;

  /** MySQL-/Beiblatt-Eigenheiten angleichen. Rückgabe { sql, fk?, notiz? } */
  function vorbereiten(stmt) {
    if (/^\s*START\s+TRANSACTION\s*$/i.test(stmt)) return {
      sql: "BEGIN TRANSACTION",
      notiz: "START TRANSACTION (MySQL) wird hier als BEGIN TRANSACTION (SQLite) ausgeführt. COMMIT und ROLLBACK bleiben gleich."
    };
    const m = RX_FK.exec(stmt);
    if (m) return { sql: null, fk: { tabelle: m[1], von: m[2], zu: m[3], spalte: m[4] || null },
      notiz: "ALTER TABLE … ADD FOREIGN KEY kann SQLite nicht ausführen — hier nachgebildet und mitgewertet." };
    let s = stmt, notiz = null;
    if (/\bAUTO_?INCREMENT\b/i.test(s)) {
      s = s.replace(/\s*\bAUTO_?INCREMENT\b(\s*=\s*\d+)?/gi, "");
      notiz = "AUTO_INCREMENT entfernt — in SQLite zählt INTEGER PRIMARY KEY von selbst hoch.";
    }
    s = s.replace(/\)\s*ENGINE\s*=\s*\w+[^)]*$/i, ")");
    const dc = RX_DROP_TYP.exec(s);
    if (dc) { s = dc[1]; notiz = "Der Datentyp hinter DROP COLUMN (so steht es im Beiblatt) wird hier weggelassen — SQLite braucht ihn nicht."; }
    s = datumsteilQuoten(s);
    return { sql: s, notiz };
  }

  /* ======================================================================
     Fehlermeldungen auf Deutsch, mit dem typischen Grund
     ====================================================================== */
  const STATT = {
    DATE_ADD: "DATEADD(Datumsteil, Intervall, Datum), z. B. DATEADD(DAY, 7, Datum)",
    ADDDATE: "DATEADD(Datumsteil, Intervall, Datum)",
    DATE_SUB: "DATEADD(DAY, -Anzahl, Datum)",
    SUBDATE: "DATEADD(DAY, -Anzahl, Datum)",
    TIMESTAMPDIFF: "DATEDIFF(Datumsteil, Anfangsdatum, Enddatum)",
    DATEPART: "YEAR(), MONTH(), DAY(), HOUR(), MINUTE(), WEEKDAY()",
    DAYOFWEEK: "WEEKDAY(Datum) — Montag = 0, Sonntag = 6",
    GETDATE: "NOW()",
    SYSDATE: "NOW()",
    LEN: "LENGTH(Text)",
    CHARINDEX: "INSTR(Text, Suchtext)",
    LOCATE: "INSTR(Text, Suchtext)",
    SUBSTRING_INDEX: "LEFT(…) bzw. RIGHT(…) zusammen mit INSTR(Text, Suchtext)",
    STDEVP: "STDDEV(Spalte)",
    STD: "STDDEV(Spalte)",
    VAR: "VARIANCE(Spalte)",
    VARP: "VARIANCE(Spalte)",
    ISNULL: "COALESCE(Spalte, Ersatz)"
  };
  function fehlerText(msg, stmt) {
    const m = String(msg || "");
    let r;
    if ((r = /no such table: (?:main\.)?(\S+)/.exec(m))) return "Die Tabelle „" + r[1] + "“ gibt es nicht. Tabellennamen im Schema nachsehen (Tippfehler, Mehrzahl?).";
    if ((r = /no such column: (\S+)/.exec(m))) {
      const w = r[1];
      if (/^(DAY|MONTH|YEAR|HOUR|MINUTE)$/i.test(w)) return "„" + w + "“ ist ein Datumsteil. Er steht an erster Stelle: DATEDIFF(" + w.toUpperCase() + ", Anfangsdatum, Enddatum) bzw. DATEADD(" + w.toUpperCase() + ", Intervall, Datum).";
      if (/^(DAYS|MONTHS|YEARS|HOURS|MINUTES|WEEK|WEEKS|SECOND|SECONDS|QUARTER|DD|D|MM|M|YY|YYYY|HH|MI|N)$/i.test(w) && /\bDATE(DIFF|ADD)\s*\(/i.test(stmt || ""))
        return "Datumsteil „" + w + "“ gibt es laut Beiblatt nicht. Möglich: DAY, MONTH, YEAR, HOUR, MINUTE (Einzahl, ohne Anführungszeichen).";
      if (/^[A-ZÄÖÜa-zäöüß]+$/.test(w) && stmt && new RegExp("=\\s*" + w + "\\b").test(stmt))
        return "„" + w + "“ wird als Spaltenname gelesen. Texte gehören in einfache Anführungszeichen: '" + w + "'.";
      return "Die Spalte „" + w + "“ gibt es nicht — oder nicht in den Tabellen hinter FROM/JOIN. Bei a.Spalte muss der Alias a vergeben sein.";
    }
    if ((r = /ambiguous column name: (\S+)/.exec(m))) return "„" + r[1] + "“ steht in mehreren Tabellen. Schreib Tabelle.Spalte oder Alias.Spalte (z. B. k." + r[1].replace(/^.*\./, "") + ").";
    if (/near "TOP"/i.test(m) || /syntax error/.test(m) && /^\s*SELECT\s+(DISTINCT\s+)?TOP\s/i.test(stmt || "")) return "TOP gibt es nur in MS SQL. Hier (und in MySQL): … ORDER BY … LIMIT 3.";
    if (/near "INTERVAL"/i.test(m) || /syntax error/.test(m) && /\bINTERVAL\s+[-+]?\d/i.test(stmt || "")) return "INTERVAL (MySQL) geht hier nicht. Laut Beiblatt: DATEADD(DAY, 7, Datum) bzw. DATEDIFF(DAY, Anfangsdatum, Enddatum).";
    if (/near "FROM": syntax error/i.test(m)) return "Syntaxfehler vor FROM — oft ein Komma zu viel hinter der letzten Spalte.";
    if (/near "(MODIFY|CHANGE)"/i.test(m) || /near "COLUMN"/i.test(m) && /ALTER\s+COLUMN/i.test(stmt || ""))
      return "Spalten nachträglich ändern (MODIFY / ALTER COLUMN) kann SQLite nicht. In MySQL: ALTER TABLE t MODIFY Spalte Typ; — für diese Übung nicht nötig.";
    if ((r = /near "([^"]+)": syntax error/.exec(m))) return "Syntaxfehler bei „" + r[1] + "“. Häufig: Komma fehlt oder ist zu viel, Schlüsselwort falsch geschrieben, Reihenfolge SELECT – FROM – WHERE – GROUP BY – HAVING – ORDER BY.";
    if (/incomplete input/.test(m)) return "Die Anweisung ist unvollständig — fehlt eine Klammer, ein Anführungszeichen oder ein Teil nach WHERE?";
    if (/misuse of aggregate/.test(m)) return "Aggregatfunktion an falscher Stelle: Bedingungen mit COUNT/SUM/AVG gehören in HAVING (nach GROUP BY), nicht in WHERE.";
    if (/GROUP BY clause is required before HAVING/i.test(m)) return "HAVING ohne GROUP BY — erst gruppieren, dann HAVING.";
    if (/FOREIGN KEY constraint failed/.test(m)) return "Fremdschlüssel verletzt (referentielle Integrität): Es gibt noch Datensätze, die auf diese Zeile verweisen — oder der Wert, auf den du verweist, existiert nicht.";
    if ((r = /UNIQUE constraint failed: (\S+)/.exec(m))) return "Schlüssel doppelt: Ein Datensatz mit diesem Wert in " + r[1] + " existiert schon (Primärschlüssel muss eindeutig sein).";
    if ((r = /NOT NULL constraint failed: (\S+)/.exec(m))) return r[1] + " darf nicht leer sein (NOT NULL).";
    if ((r = /table (\S+) already exists/.exec(m))) return "Die Tabelle " + r[1] + " gibt es schon.";
    if ((r = /(\d+) values for (\d+) columns/.exec(m))) return "Anzahl der Werte (" + r[1] + ") passt nicht zur Anzahl der Spalten (" + r[2] + ").";
    if ((r = /table (\S+) has (\d+) columns but (\d+) values were supplied/.exec(m))) return "Die Tabelle " + r[1] + " hat " + r[2] + " Spalten, du gibst " + r[3] + " Werte an. Spalten in Klammern nennen oder alle Werte angeben.";
    if (/SELECTs to the left and right of UNION do not have the same number of result columns/i.test(m)) return "UNION: Beide SELECT brauchen gleich viele Spalten.";
    if (/more than one primary key/.test(m)) return "Nur EIN Primärschlüssel je Tabelle. Aus zwei Spalten: am Ende PRIMARY KEY (Spalte1, Spalte2).";
    if ((r = /no such function: (\S+)/.exec(m))) {
      const statt = STATT[r[1].toUpperCase()];
      return "Die Funktion " + r[1] + " kennt diese Datenbank nicht." + (statt ? " Laut Beiblatt bzw. hier: " + statt + "." : "");
    }
    if ((r = /wrong number of arguments to function (\S+)/.exec(m))) return "Falsche Anzahl von Angaben in " + r[1] + "(…).";
    if (/cannot (modify|UPDATE|DELETE|INSERT)/i.test(m) && /view/i.test(m)) return "In eine Sicht (VIEW) kann man hier nicht schreiben — ändere die Tabelle dahinter.";
    if (/no such view/.test(m)) return "Diese Sicht gibt es nicht.";
    if (/duplicate column name: (\S+)/.test(m)) return "Die Spalte gibt es schon: " + /duplicate column name: (\S+)/.exec(m)[1] + ".";
    return m;
  }

  /* ======================================================================
     Stolperfallen, die SQLite durchgehen lässt (Warnungen, kein Fehler)
     ====================================================================== */
  const AGG = /\b(COUNT|SUM|AVG|MIN|MAX|GROUP_CONCAT|STDDEV|STDDEV_POP|STDDEV_SAMP|VARIANCE|VAR_POP|VAR_SAMP|CORR)\s*\(/i;
  function obenPositionen(s) {
    const U = s.toUpperCase(), pos = {};
    const KW = ["SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT", "UNION", "EXCEPT", "INTERSECT"];
    let tiefe = 0, q = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) { if (c === q) q = null; continue; }
      if (c === "'" || c === '"') { q = c; continue; }
      if (c === "(") { tiefe++; continue; }
      if (c === ")") { tiefe--; continue; }
      if (tiefe) continue;
      for (const kw of KW) {
        if (pos[kw] == null && U.startsWith(kw, i) && !/\w/.test(U[i - 1] || " ") && !/\w/.test(U[i + kw.length] || " ")) pos[kw] = i;
      }
    }
    return pos;
  }
  function obenTeilen(s) {
    const out = []; let tiefe = 0, q = null, cur = "";
    for (const c of s) {
      if (q) { cur += c; if (c === q) q = null; continue; }
      if (c === "'" || c === '"') { q = c; cur += c; continue; }
      if (c === "(") tiefe++;
      if (c === ")") tiefe--;
      if (c === "," && !tiefe) { out.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function gruppenWarnung(stmt) {
    const s = stmt.replace(/\s+/g, " ").trim();
    if (!/^SELECT\b/i.test(s)) return null;
    const p = obenPositionen(s);
    if (p.FROM == null || p.UNION != null || p.EXCEPT != null || p.INTERSECT != null) return null;
    const liste = obenTeilen(s.slice(p.SELECT + 6, p.FROM).replace(/^\s*(DISTINCT|ALL)\b/i, ""));
    const ende = k => Math.min(...["HAVING", "ORDER BY", "LIMIT"].map(x => p[x]).filter(x => x != null && x > k).concat([s.length]));
    const gruppe = p["GROUP BY"] != null ? obenTeilen(s.slice(p["GROUP BY"] + 8, ende(p["GROUP BY"])))
      .map(x => x.replace(/^.*\./, "").replace(/[`"]/g, "").toLowerCase()) : null;
    const mitAgg = liste.some(x => AGG.test(x)) || p.HAVING != null;
    if (!gruppe && !mitAgg) return null;
    const lose = [];
    liste.forEach(x => {
      if (AGG.test(x)) return;
      const ohneAlias = x.replace(/\s+AS\s+[\w"`']+$/i, "").replace(/^([\w.]+)\s+\w+$/, "$1").trim();
      if (!/^(\w+\.)?\w+$/.test(ohneAlias) || /^\d/.test(ohneAlias)) return;
      const name = ohneAlias.replace(/^.*\./, "").toLowerCase();
      if (!gruppe || gruppe.indexOf(name) < 0) lose.push(ohneAlias);
    });
    if (!lose.length) return null;
    return gruppe
      ? lose.join(", ") + " steht im SELECT, aber nicht im GROUP BY. SQLite rechnet trotzdem, in der Prüfung (und in vielen Datenbanken) ist das ein Fehler — mit ins GROUP BY aufnehmen."
      : lose.join(", ") + " steht neben einer Aggregatfunktion, aber es gibt kein GROUP BY. SQLite lässt das durch, in der Prüfung ist es falsch.";
  }

  const RX_DE_DATUM_VERGLEICH = /(?:[=<>]|\bBETWEEN|\bAND)\s*'\d{1,2}\.\d{1,2}\.\d{4}[^']*'|'\d{1,2}\.\d{1,2}\.\d{4}[^']*'\s*(?:[=<>]|\bAND\b)/i;
  function warnungen(code, namen) {
    const w = [];
    const teile = zerlege(code);
    const bekannt = new Set((namen || []).map(x => String(x).toLowerCase()));
    teile.forEach(t => {
      if (RX_DCL.test(t)) return;
      const ohneTexte = t.replace(/'(?:[^']|'')*'/g, "''");
      if (/(=|<>|!=)\s*NULL\b/i.test(ohneTexte)) w.push("„= NULL“ ist nie wahr. Mit NULL vergleicht man mit IS NULL bzw. IS NOT NULL.");
      if (/^\s*(UPDATE|DELETE)\b/i.test(t) && !/\bWHERE\b/i.test(ohneTexte)) w.push(/^\s*UPDATE/i.test(t) ? "UPDATE ohne WHERE ändert ALLE Zeilen der Tabelle." : "DELETE ohne WHERE löscht ALLE Zeilen der Tabelle.");
      const dq = t.replace(/'(?:[^']|'')*'/g, "''").match(/"[^"]*"/g) || [];
      if (dq.some(x => !bekannt.has(x.slice(1, -1).toLowerCase())))
        w.push("Texte in \"doppelten\" Anführungszeichen: in Standard-SQL sind das Namen. Texte schreibt man in 'einfache' Anführungszeichen.");
      if (RX_DE_DATUM_VERGLEICH.test(t))
        w.push("Ein Datum wie 'TT.MM.JJJJ' (Schreibweise im Beiblatt) vergleicht diese Datenbank nur als Text. Für <, >, = und BETWEEN hier 'JJJJ-MM-TT' schreiben, z. B. '2026-03-01'.");
      let m;
      const rxLike = /LIKE\s+'([^'%_]*)'/gi;
      while ((m = rxLike.exec(t))) { w.push("LIKE '" + m[1] + "' ohne % sucht genau diesen Text — gemeint ist meist '%" + m[1] + "%'."); break; }
      if (/\bJOIN\s+[`"]?\w+[`"]?(\s+(AS\s+)?\w+)?\s*($|\bWHERE\b|\bJOIN\b|\bGROUP\b|\bORDER\b|\bLEFT\b|\bRIGHT\b|\bINNER\b|\bUNION\b)/i.test(ohneTexte.replace(/\s+/g, " ") + " ") &&
          !/\b(ON|USING|NATURAL|CROSS)\b/i.test(ohneTexte))
        w.push("JOIN ohne ON: jede Zeile wird mit jeder kombiniert (kartesisches Produkt). Verbindung angeben: JOIN … ON a.Schluessel = b.Schluessel.");
      const g = gruppenWarnung(t);
      if (g) w.push(g);
    });
    return Array.from(new Set(w));
  }

  /* ======================================================================
     Datum und Zeit wie im Beiblatt — reine Funktionen
     Ein UDF-Fehler muss als Text geworfen werden (sql.js reicht sonst
     eine leere Meldung weiter).
     ====================================================================== */
  const RX_ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;
  const RX_DE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
  const RX_UHR = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  const p2 = n => String(n).padStart(2, "0");
  const tageImMonat = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const kurz = v => { const s = String(v); return s.length > 30 ? s.slice(0, 28) + "…" : s; };
  /** 'JJJJ-MM-TT[ hh:mm[:ss]]', 'TT.MM.JJJJ[ hh:mm[:ss]]' oder 'hh:mm' → Teile; ungültig → null */
  function zeitpunkt(v) {
    const s = String(v).trim();
    let m, z = null;
    if ((m = RX_ISO.exec(s))) z = { y: +m[1], mo: +m[2], d: +m[3], h: +(m[4] || 0), mi: +(m[5] || 0), se: +(m[6] || 0), zeit: m[4] != null, sek: m[6] != null };
    else if ((m = RX_DE.exec(s))) z = { y: +m[3], mo: +m[2], d: +m[1], h: +(m[4] || 0), mi: +(m[5] || 0), se: +(m[6] || 0), zeit: m[4] != null, sek: m[6] != null };
    else if ((m = RX_UHR.exec(s))) z = { nurZeit: true, h: +m[1], mi: +m[2], se: +(m[3] || 0), zeit: true, sek: m[3] != null };
    if (!z || z.h > 23 || z.mi > 59 || z.se > 59) return null;
    if (!z.nurZeit) {
      if (z.mo < 1 || z.mo > 12 || z.d < 1 || z.d > tageImMonat(z.y, z.mo)) return null;
      z.tag = Math.round(Date.UTC(z.y, z.mo - 1, z.d) / 864e5);
    }
    return z;
  }
  /** NULL → null; kein Datum → Fehlertext; uhrOk: auch reine Uhrzeit erlaubt */
  function datum(fn, v, uhrOk) {
    if (v == null) return null;
    const z = zeitpunkt(v);
    if (z && (!z.nurZeit || uhrOk)) return z;
    throw fn + ": „" + kurz(v) + "“ ist kein gültiges Datum. Schreibweise hier: 'JJJJ-MM-TT' oder 'JJJJ-MM-TT hh:mm'.";
  }
  function datumsteil(fn, t) {
    const s = t == null ? "" : String(t).trim().toUpperCase();
    if (DATUMSTEILE.indexOf(s) >= 0) return s;
    throw fn + ": „" + kurz(t) + "“ ist kein Datumsteil. An erster Stelle steht DAY, MONTH, YEAR, HOUR oder MINUTE, z. B. " +
      (fn === "DATEADD" ? "DATEADD(DAY, 14, Datum)." : "DATEDIFF(DAY, Anfangsdatum, Enddatum).");
  }
  const datumText = (y, mo, d) => String(y).padStart(4, "0") + "-" + p2(mo) + "-" + p2(d);
  /** DATEDIFF(Datumsteil, Anfang, Ende) — oder MySQL DATEDIFF(Ende, Anfang) in Tagen */
  function datediff(a) {
    if (a.length === 2) {
      const e = datum("DATEDIFF", a[0]), s = datum("DATEDIFF", a[1]);
      return e && s ? e.tag - s.tag : null;
    }
    if (a.length !== 3) throw "DATEDIFF braucht laut Beiblatt drei Angaben: DATEDIFF(Datumsteil, Anfangsdatum, Enddatum).";
    const t = datumsteil("DATEDIFF", a[0]);
    const s = datum("DATEDIFF", a[1]), e = datum("DATEDIFF", a[2]);
    if (!s || !e) return null;
    const tage = e.tag - s.tag;
    if (t === "YEAR") return e.y - s.y;
    if (t === "MONTH") return (e.y - s.y) * 12 + (e.mo - s.mo);
    if (t === "DAY") return tage;
    if (t === "HOUR") return tage * 24 + (e.h - s.h);
    return (tage * 24 + (e.h - s.h)) * 60 + (e.mi - s.mi);
  }
  /** DATEADD(Datumsteil, Intervall, Datum); Monatsende wird gekappt (31.01. + 1 Monat = 28./29.02.) */
  function dateadd(a) {
    if (a.length !== 3) throw "DATEADD braucht laut Beiblatt drei Angaben: DATEADD(Datumsteil, Intervall, Datum).";
    const t = datumsteil("DATEADD", a[0]);
    if (a[1] == null || a[2] == null) return null;
    const n = Number(a[1]);
    if (String(a[1]).trim() === "" || !isFinite(n)) throw "DATEADD: Das Intervall (2. Angabe) muss eine Zahl sein, z. B. DATEADD(DAY, 14, Datum).";
    const k = Math.trunc(n);
    const z = datum("DATEADD", a[2]);
    let y = z.y, mo = z.mo, d = z.d, h = z.h, mi = z.mi, se = z.se;
    if (t === "YEAR" || t === "MONTH") {
      const m0 = y * 12 + (mo - 1) + (t === "YEAR" ? 12 * k : k);
      y = Math.floor(m0 / 12); mo = m0 - y * 12 + 1;
      d = Math.min(d, tageImMonat(y, mo));
    } else {
      const x = new Date(Date.UTC(y, mo - 1, d, h, mi, se) + k * (t === "DAY" ? 864e5 : t === "HOUR" ? 36e5 : 6e4));
      y = x.getUTCFullYear(); mo = x.getUTCMonth() + 1; d = x.getUTCDate(); h = x.getUTCHours(); mi = x.getUTCMinutes(); se = x.getUTCSeconds();
    }
    const mitZeit = z.zeit || t === "HOUR" || t === "MINUTE";
    return datumText(y, mo, d) + (mitZeit ? " " + p2(h) + ":" + p2(mi) + (z.sek ? ":" + p2(se) : "") : "");
  }
  /** 'JJJJ-MM-TT hh:mm[:ss]' → 'JJJJ-MM-TT hh:mm:ss' (für NOW() mit festem Zeitpunkt) */
  function jetztText(jetzt) {
    if (jetzt) {
      const z = zeitpunkt(jetzt);
      if (z && !z.nurZeit) return datumText(z.y, z.mo, z.d) + " " + p2(z.h) + ":" + p2(z.mi) + ":" + p2(z.se);
    }
    const x = new Date();
    return datumText(x.getFullYear(), x.getMonth() + 1, x.getDate()) + " " + p2(x.getHours()) + ":" + p2(x.getMinutes()) + ":" + p2(x.getSeconds());
  }
  const jetztDeutsch = jetzt => { const z = zeitpunkt(jetzt); return z ? p2(z.d) + "." + p2(z.mo) + "." + z.y + ", " + p2(z.h) + ":" + p2(z.mi) + " Uhr" : String(jetzt); };

  /* Aggregatfunktionen: Zustand = Liste der Werte einer Gruppe */
  function sammeln(s, v) { if (v != null && v !== "") { const x = Number(v); if (isFinite(x)) s.push(x); } return s; }
  function paare(s, x, y) {
    if (x != null && y != null && x !== "" && y !== "") { const a = Number(x), b = Number(y); if (isFinite(a) && isFinite(b)) s.push([a, b]); }
    return s;
  }
  function varianz(w, stichprobe) {
    const n = w.length;
    if (!n || (stichprobe && n < 2)) return null;
    const m = w.reduce((a, b) => a + b, 0) / n;
    return w.reduce((a, b) => a + (b - m) * (b - m), 0) / (stichprobe ? n - 1 : n);
  }
  const wurzel = v => v == null ? null : Math.sqrt(v);
  function korrelation(w) {
    const n = w.length;
    if (n < 2) return null;
    const mx = w.reduce((a, p) => a + p[0], 0) / n, my = w.reduce((a, p) => a + p[1], 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    w.forEach(p => { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) * (p[0] - mx); syy += (p[1] - my) * (p[1] - my); });
    if (!sxx || !syy) return null;
    return Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
  }

  /* ======================================================================
     Datenbank
     ====================================================================== */
  function funktionen(db, jetzt) {
    const f = (n, fn) => { try { db.create_function(n, fn); } catch (e) { } };
    /* sql.js meldet fn.length als Argumentzahl an SQLite; -1 = beliebig viele */
    const variabel = fn => { try { Object.defineProperty(fn, "length", { value: -1 }); } catch (e) { } return fn; };
    const agg = (n, step, ende) => {
      if (typeof db.create_aggregate !== "function") return;
      try { db.create_aggregate(n, { init: () => [], step, finalize: s => ende(s || []) }); } catch (e) { }
    };
    const anzahl = n => Math.trunc(Number(n)) || 0;
    f("UPPER", v => v == null ? null : String(v).toUpperCase());
    f("LOWER", v => v == null ? null : String(v).toLowerCase());
    f("UCASE", v => v == null ? null : String(v).toUpperCase());
    f("LCASE", v => v == null ? null : String(v).toLowerCase());
    f("LEFT", (v, n) => v == null || n == null ? null : String(v).slice(0, Math.max(0, anzahl(n))));
    f("RIGHT", (v, n) => v == null || n == null ? null : (anzahl(n) > 0 ? String(v).slice(-anzahl(n)) : ""));
    f("YEAR", v => { const z = datum("YEAR", v); return z ? z.y : null; });
    f("MONTH", v => { const z = datum("MONTH", v); return z ? z.mo : null; });
    f("DAY", v => { const z = datum("DAY", v); return z ? z.d : null; });
    f("WEEKDAY", v => { const z = datum("WEEKDAY", v); return z ? (new Date(z.tag * 864e5).getUTCDay() + 6) % 7 : null; });
    f("HOUR", v => { const z = datum("HOUR", v, true); return z ? z.h : null; });
    f("MINUTE", v => { const z = datum("MINUTE", v, true); return z ? z.mi : null; });
    f("DATEDIFF", variabel(function () { return datediff(Array.prototype.slice.call(arguments)); }));
    f("DATEADD", variabel(function () { return dateadd(Array.prototype.slice.call(arguments)); }));
    f("CURDATE", () => jetztText(jetzt).slice(0, 10));
    f("NOW", () => jetztText(jetzt));
    agg("VARIANCE", sammeln, w => varianz(w, false));
    agg("VAR_POP", sammeln, w => varianz(w, false));
    agg("VAR_SAMP", sammeln, w => varianz(w, true));
    agg("STDDEV", sammeln, w => wurzel(varianz(w, false)));
    agg("STDDEV_POP", sammeln, w => wurzel(varianz(w, false)));
    agg("STDDEV_SAMP", sammeln, w => wurzel(varianz(w, true)));
    agg("CORR", paare, korrelation);
  }

  /** Frische Datenbank: name = "shop" | "service" | "mini", jetzt = fester NOW()-Zeitpunkt */
  function neueDb(vorher, name, jetzt) {
    if (!SQL) throw new Error("SQL noch nicht geladen");
    const db = new SQL.Database();
    funktionen(db, jetzt);
    db.exec(datenbank(name).SCHEMA);
    db.run("PRAGMA foreign_keys = ON");
    if (vorher) db.exec(datumsteilQuoten(vorher));
    return db;
  }
  const dbFuer = a => neueDb(a && a.vorher, a && a.db, a && a.jetzt);
  const notieren = (lauf, n) => { if (n && lauf.notizen.indexOf(n) < 0) lauf.notizen.push(n); };

  /** Anweisungen nacheinander ausführen; beim ersten Fehler stehen bleiben. */
  function ausfuehren(db, code) {
    const lauf = { schritte: [], fehler: null, letztes: null, fk: [], notizen: [] };
    const teile = [];
    zerlege(code).forEach(t => {
      const x = alterAufteilen(t);
      if (x.length > 1) notieren(lauf, "Mehrere Änderungen in einem ALTER TABLE (MySQL-Schreibweise) — hier nacheinander einzeln ausgeführt.");
      teile.push(...x);
    });
    if (!teile.length) { lauf.fehler = { text: "Noch keine Anweisung eingegeben.", roh: "" }; return lauf; }
    for (let i = 0; i < teile.length; i++) {
      const schritt = { nr: i + 1, sql: teile[i], spalten: [], zeilen: [], geaendert: null, zuViel: false };
      if (RX_DCL.test(teile[i])) {
        const d = dclLesen(teile[i]);
        if (!d.ok) { lauf.fehler = { nr: i + 1, sql: teile[i], text: d.text, roh: "" }; break; }
        notieren(lauf, DCL_NOTIZ);
        schritt.dcl = d;
        lauf.schritte.push(schritt);
        continue;
      }
      const v = vorbereiten(teile[i]);
      notieren(lauf, v.notiz);
      if (v.fk) {
        const t = tabelleFinden(db, v.fk.tabelle, "table");
        if (!t) { lauf.fehler = { nr: i + 1, sql: teile[i], text: "Die Tabelle „" + v.fk.tabelle + "“ gibt es nicht.", roh: "" }; break; }
        if (!spaltenVon(db, t).some(s => s.name.toLowerCase() === v.fk.von.toLowerCase())) {
          lauf.fehler = { nr: i + 1, sql: teile[i], text: "Die Spalte „" + v.fk.von + "“ gibt es in " + t + " nicht — erst mit ALTER TABLE … ADD anlegen.", roh: "" }; break;
        }
        lauf.fk.push(v.fk);
        lauf.schritte.push(schritt);
        continue;
      }
      let st = null;
      try {
        st = db.prepare(v.sql);
        schritt.spalten = st.getColumnNames();
        while (st.step()) {
          if (schritt.zeilen.length >= MAX_ZEILEN) { schritt.zuViel = true; break; }
          schritt.zeilen.push(st.get());
        }
        st.free(); st = null;
        if (/^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(v.sql)) schritt.geaendert = db.getRowsModified();
      } catch (e) {
        try { if (st) st.free(); } catch (x) { }
        lauf.fehler = { nr: i + 1, sql: teile[i], text: fehlerText(e.message, teile[i]), roh: e.message };
        break;
      }
      lauf.schritte.push(schritt);
      if (schritt.spalten.length) lauf.letztes = schritt;
    }
    return lauf;
  }

  function tabelleFinden(db, name, typ) {
    const r = db.exec("SELECT name FROM sqlite_master WHERE type = '" + typ + "' AND lower(name) = lower(?)".replace("?", "'" + String(name).replace(/'/g, "''") + "'"));
    return r.length && r[0].values.length ? r[0].values[0][0] : null;
  }
  const q = n => '"' + String(n).replace(/"/g, '""') + '"';
  function spaltenVon(db, t) {
    const r = db.exec("PRAGMA table_info(" + q(t) + ")");
    return r.length ? r[0].values.map(v => ({ name: v[1], typ: v[2], notnull: !!v[3], pk: v[5] })) : [];
  }
  function fkVon(db, t) {
    const r = db.exec("PRAGMA foreign_key_list(" + q(t) + ")");
    return r.length ? r[0].values.map(v => ({ von: v[3], zu: v[2], spalte: v[4] })) : [];
  }
  function tabellen(db) {
    const r = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    return r.length ? r[0].values.map(v => v[0]) : [];
  }
  function schnappschuss(db) {
    const s = {};
    tabellen(db).forEach(t => {
      const r = db.exec("SELECT * FROM " + q(t));
      s[t] = { spalten: spaltenVon(db, t).map(x => x.name), zeilen: r.length ? r[0].values : [] };
    });
    return s;
  }

  /* ======================================================================
     Rechte: CREATE USER, GRANT, REVOKE (SQLite kennt keine Benutzer).
     Die Anweisung wird in Wörter zerlegt und gelesen; geprüft wird nach
     Muster — nie ausgeführt.
     ====================================================================== */
  const RX_DCL = /^\s*(?:CREATE\s+(?:USER|ROLE)|GRANT|REVOKE)\b/i;
  const DCL_NOTIZ = "CREATE USER, GRANT und REVOKE kann die Übungsdatenbank (SQLite) nicht ausführen. Hier wird nur die Schreibweise geprüft — ohne Ausführung.";
  const RECHTE = ["SELECT", "INSERT", "UPDATE", "DELETE", "ALL", "CREATE", "DROP", "ALTER", "INDEX", "REFERENCES", "EXECUTE", "USAGE",
    "TRIGGER", "EVENT", "CREATE VIEW", "SHOW VIEW", "CREATE USER", "CREATE ROUTINE", "ALTER ROUTINE", "LOCK TABLES", "CREATE TEMPORARY TABLES", "GRANT OPTION"];
  const RECHT_WORTE = "lesen = SELECT, einfügen = INSERT, ändern = UPDATE, löschen = DELETE";
  const DCL_ART = { create_user: "CREATE USER", create_role: "CREATE ROLE", grant: "GRANT", revoke: "REVOKE", grant_role: "GRANT (Rolle)", revoke_role: "REVOKE (Rolle)" };

  function dclZerlegen(s) {
    const t = [];
    for (let i = 0; i < s.length;) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === "'" || c === '"' || c === "`") {
        let j = i + 1, v = "";
        for (;;) {
          if (j >= s.length) return { fehler: "Ein Anführungszeichen " + c + " ist nicht geschlossen." };
          if (s[j] === c) { if (s[j + 1] === c) { v += c; j += 2; continue; } break; }
          v += s[j]; j++;
        }
        t.push({ art: c === "'" ? "text" : "name", v });
        i = j + 1; continue;
      }
      const m = /^[\wÄÖÜäöüß#$]+/.exec(s.slice(i));
      if (m) { t.push({ art: "wort", v: m[0] }); i += m[0].length; continue; }
      t.push({ art: "zeichen", v: c }); i++;
    }
    return { t };
  }
  function rechteNorm(r) {
    const l = r.map(x => {
      let s = String(x.text).toUpperCase().replace(/\s+/g, " ").trim();
      if (s === "ALL PRIVILEGES") s = "ALL";
      return s + (x.spalten && x.spalten.length ? "(" + x.spalten.slice().sort().join(",") + ")" : "");
    });
    return Array.from(new Set(l)).sort();
  }
  /** Eine Rechte-Anweisung lesen → { ok, art, … } oder { ok:false, text } */
  function dclLesen(stmt) {
    const z = dclZerlegen(String(stmt == null ? "" : stmt).trim().replace(/;\s*$/, ""));
    if (z.fehler) return { ok: false, text: z.fehler };
    const t = z.t;
    let p = 0;
    const W = () => (t[p] && t[p].art === "wort") ? t[p].v.toUpperCase() : null;
    const ist = w => W() === w;
    const zeichen = c => !!t[p] && t[p].art === "zeichen" && t[p].v === c;
    const nein = text => ({ ok: false, text });
    const rest = () => t.slice(p).map(x => x.art === "text" ? "'" + x.v + "'" : x.v).join(" ");
    const STOPP = ["ON", "TO", "FROM", "WITH", "IDENTIFIED"];
    function konto() {
      const x = t[p];
      if (!x || x.art === "zeichen" || (x.art === "wort" && STOPP.indexOf(x.v.toUpperCase()) >= 0)) return null;
      p++;
      const k = { name: x.v.toLowerCase(), roh: x.v };
      if (zeichen("@")) {
        p++;
        const h = t[p];
        if (!h || (h.art === "zeichen" && h.v !== "%")) return null;
        k.host = h.v; p++;
      }
      return k;
    }
    function konten() {
      const l = [];
      for (;;) { const k = konto(); if (!k) return null; l.push(k); if (!zeichen(",")) return l; p++; }
    }
    function rechteLesen() {
      const l = [];
      for (;;) {
        const w = [];
        while (t[p] && t[p].art === "wort" && ["ON", "TO", "FROM"].indexOf(t[p].v.toUpperCase()) < 0) { w.push(t[p].v); p++; }
        if (!w.length && t[p] && (t[p].art === "text" || t[p].art === "name")) { w.push(t[p].v); p++; }
        if (!w.length) return null;
        let spalten = null;
        if (zeichen("(")) {
          p++; spalten = [];
          while (t[p] && !zeichen(")")) { if (t[p].art !== "zeichen") spalten.push(t[p].v.toLowerCase()); p++; }
          if (!zeichen(")")) return null;
          p++;
        }
        l.push({ text: w.join(" "), spalten });
        if (!zeichen(",")) return l;
        p++;
      }
    }
    function objekt() {
      if (ist("TABLE")) p++;
      const teil = () => {
        const x = t[p];
        if (!x) return null;
        if (x.art === "zeichen") { if (x.v === "*") { p++; return "*"; } return null; }
        if (x.art === "wort" && ["TO", "FROM"].indexOf(x.v.toUpperCase()) >= 0) return null;
        p++; return x.v.toLowerCase();
      };
      const a = teil();
      if (a == null) return null;
      if (zeichen(".")) { p++; const b = teil(); if (b == null) return null; return a + "." + b; }
      return a;
    }
    if (ist("CREATE")) {
      p++;
      const typ = W();
      if (typ !== "USER" && typ !== "ROLE") return nein("Nach CREATE erwartet: USER (Benutzer) oder ROLE (Rolle).");
      p++;
      if (ist("IF")) {
        p++;
        if (!ist("NOT")) return nein("Gemeint ist IF NOT EXISTS.");
        p++;
        if (!ist("EXISTS")) return nein("Gemeint ist IF NOT EXISTS.");
        p++;
      }
      const k = konten();
      if (!k) return nein("Nach CREATE " + typ + " fehlt der Name.");
      let passwort = null;
      if (ist("IDENTIFIED")) {
        p++;
        if (ist("WITH")) { p++; if (t[p] && t[p].art !== "zeichen" && !ist("BY")) p++; }
        if (!ist("BY")) return nein("Nach IDENTIFIED fehlt BY: IDENTIFIED BY 'Passwort'.");
        p++;
        const x = t[p];
        if (!x) return nein("Nach IDENTIFIED BY fehlt das Passwort in einfachen Anführungszeichen.");
        if (x.art !== "text") return nein("Das Passwort steht in einfachen Anführungszeichen: IDENTIFIED BY '" + x.v + "'.");
        passwort = x.v; p++;
      }
      if (p < t.length) return nein("Unerwartet am Ende: „" + rest() + "“.");
      return { ok: true, art: typ === "USER" ? "create_user" : "create_role", konten: k, passwort };
    }
    if (ist("GRANT") || ist("REVOKE")) {
      const grant = ist("GRANT");
      p++;
      const ziel = grant ? "TO" : "FROM", falsch = grant ? "FROM" : "TO";
      const r = rechteLesen();
      if (!r) return nein("Nach " + (grant ? "GRANT" : "REVOKE") + " fehlt das Recht (z. B. SELECT) oder die Rolle.");
      let obj = null;
      if (ist("ON")) {
        p++;
        obj = objekt();
        if (!obj) return nein("Nach ON fehlt das Objekt: *.* oder Datenbank.* oder Datenbank.Tabelle.");
      }
      if (ist(falsch)) return nein(grant ? "Bei GRANT heißt es TO, nicht FROM: GRANT … TO Benutzer." : "Bei REVOKE heißt es FROM, nicht TO: REVOKE … FROM Benutzer.");
      if (!ist(ziel)) return nein(obj ? "Es fehlt " + ziel + " Benutzer." : "Es fehlt ON Objekt (bei Rechten) oder " + ziel + " Benutzer (bei einer Rolle).");
      p++;
      const k = konten();
      if (!k) return nein("Nach " + ziel + " fehlt der Benutzer oder die Rolle.");
      let weiter = false;
      if (grant && ist("WITH")) {
        p++;
        if (!ist("GRANT") && !ist("ADMIN")) return nein("Gemeint ist WITH GRANT OPTION.");
        p++;
        if (!ist("OPTION")) return nein("Gemeint ist WITH GRANT OPTION.");
        p++; weiter = true;
      }
      if (p < t.length) return nein("Unerwartet am Ende: „" + rest() + "“.");
      if (obj) return { ok: true, art: grant ? "grant" : "revoke", rechte: rechteNorm(r), objekt: obj, konten: k, weitergeben: weiter };
      return { ok: true, art: grant ? "grant_role" : "revoke_role", rollen: r.map(x => String(x.text).toLowerCase()), konten: k, weitergeben: weiter };
    }
    return nein("Das ist keine CREATE USER-, GRANT- oder REVOKE-Anweisung.");
  }
  function dclBeschreiben(d) {
    const k = (d.konten || []).map(x => x.name).join(", ");
    if (d.art === "create_user" || d.art === "create_role") return (d.art === "create_user" ? "CREATE USER " : "CREATE ROLE ") + k;
    if (d.art === "grant" || d.art === "revoke") return (d.art === "grant" ? "GRANT " : "REVOKE ") + d.rechte.join(", ") + " ON " + d.objekt + (d.art === "grant" ? " TO " : " FROM ") + k + (d.weitergeben ? " WITH GRANT OPTION" : "");
    return (d.art === "grant_role" ? "GRANT " : "REVOKE ") + d.rollen.join(", ") + (d.art === "grant_role" ? " TO " : " FROM ") + k;
  }
  function mengeVergleich(ist, soll) {
    const I = new Set(ist), S = new Set(soll);
    return { fehlt: soll.filter(x => !I.has(x)), zuviel: ist.filter(x => !S.has(x)) };
  }
  function objektHinweis(ist, soll) {
    if (ist === "*.*" || ist === "*") return "„" + ist + "“ heißt: alles in allen Datenbanken. Gefragt ist nur " + soll + ".";
    if (/\.\*$/.test(ist) && !/\.\*$/.test(soll)) return "„" + ist + "“ gilt für alle Tabellen der Datenbank. Gefragt ist nur " + soll + ".";
    if (!/\.\*$/.test(ist) && /\.\*$/.test(soll)) return "„" + ist + "“ ist nur ein Objekt. Gefragt sind alle Tabellen der Datenbank: " + soll + ".";
    return "Das Objekt „" + ist + "“ passt nicht. Gefragt ist " + soll + " (Schreibweise: Datenbank.Tabelle bzw. Datenbank.*).";
  }
  /** Eine gelesene Anweisung d mit dem Muster m vergleichen → Punkte */
  function dclAbgleich(m, d) {
    const p = [];
    const gut = text => p.push({ ok: true, text }), schlecht = text => p.push({ ok: false, text }), info = text => p.push({ info: true, text });
    const namen = d.konten.map(k => k.name);
    const sollNamen = (m.namen || m.an || m.von || []).map(x => String(x).toLowerCase());
    const nv = mengeVergleich(namen, sollNamen);
    const wer = m.art === "create_role" ? "Rolle" : "Benutzer";
    if (nv.fehlt.length || nv.zuviel.length) schlecht((nv.zuviel.length ? "„" + nv.zuviel.join(", ") + "“ passt nicht. " : "") + wer + " laut Aufgabe: " + sollNamen.join(", ") + ".");
    else gut(wer + ": " + sollNamen.join(", "));
    if (d.konten.some(k => k.host != null)) info("Die Host-Angabe (@…) ist in MySQL üblich. Hier ist sie nicht nötig — sie wird akzeptiert.");
    if (m.art === "create_user" && m.passwort != null) {
      if (d.passwort == null) schlecht("Es fehlt das Passwort: IDENTIFIED BY '…'.");
      else if (d.passwort !== m.passwort) schlecht(d.passwort.toLowerCase() === String(m.passwort).toLowerCase()
        ? "Das Passwort muss genau so geschrieben sein wie in der Aufgabe — Groß- und Kleinschreibung zählt."
        : "Das Passwort stimmt nicht mit der Aufgabe überein.");
      else gut("Passwort in einfachen Anführungszeichen");
    }
    if (m.art === "grant" || m.art === "revoke") {
      const soll = rechteNorm(m.rechte.map(x => ({ text: x })));
      const rv = mengeVergleich(d.rechte, soll);
      if (!rv.fehlt.length && !rv.zuviel.length) gut("Rechte: " + soll.join(", "));
      else if (d.rechte.indexOf("ALL") >= 0 && soll.indexOf("ALL") < 0) {
        schlecht(m.art === "grant" ? "ALL ist zu viel — gib nur die verlangten Rechte (so wenig wie nötig)." : "ALL ist zu viel — entzieh nur die genannten Rechte.");
      } else {
        const unbekannt = rv.zuviel.filter(x => RECHTE.indexOf(x.replace(/\(.*$/, "")) < 0);
        const bekannt = rv.zuviel.filter(x => unbekannt.indexOf(x) < 0);
        if (unbekannt.length) schlecht("„" + unbekannt.join(", ") + "“ ist kein SQL-Recht. " + RECHT_WORTE + ".");
        if (bekannt.length) schlecht("Nicht verlangt: " + bekannt.join(", ") + (m.art === "grant" ? " — nur so viele Rechte wie nötig." : "."));
        if (rv.fehlt.length) schlecht("Es fehlt: " + rv.fehlt.join(", ") + ".");
      }
      const erlaubt = [].concat(m.objekt).map(x => String(x).toLowerCase());
      const ohneDb = erlaubt.map(x => x.replace(/^[^.]*\./, ""));
      if (erlaubt.indexOf(d.objekt) >= 0) gut("Objekt: " + d.objekt);
      else if (m.ohneDb !== false && d.objekt.indexOf(".") < 0 && d.objekt !== "*" && ohneDb.indexOf(d.objekt) >= 0) {
        gut("Objekt: " + d.objekt);
        info("Ohne Datenbankname gilt die Datenbank, die gerade benutzt wird. Eindeutiger ist " + erlaubt[0] + ".");
      } else schlecht(objektHinweis(d.objekt, erlaubt[0]));
      if (m.art === "grant") {
        if (!!m.weitergeben !== !!d.weitergeben) schlecht(m.weitergeben
          ? "Es fehlt WITH GRANT OPTION — ohne diesen Zusatz darf der Benutzer die Rechte nicht weitergeben."
          : "WITH GRANT OPTION war nicht verlangt. Damit dürfte der Benutzer die Rechte an andere weitergeben.");
        else if (m.weitergeben) gut("WITH GRANT OPTION");
      }
    }
    if (m.art === "grant_role" || m.art === "revoke_role") {
      const soll = m.rollen.map(x => String(x).toLowerCase());
      const rv = mengeVergleich(d.rollen, soll);
      if (!rv.fehlt.length && !rv.zuviel.length) gut("Rolle: " + soll.join(", "));
      else schlecht("Rolle „" + d.rollen.join(", ") + "“ passt nicht. Rolle laut Aufgabe: " + soll.join(", ") + ".");
      if (d.weitergeben && !m.weitergeben) schlecht("WITH ADMIN/GRANT OPTION war nicht verlangt.");
    }
    return p;
  }
  /** Prüfung nach Muster (ohne Ausführung) für Aufgaben mit art "muster" */
  function musterPruefen(a, code) {
    const teile = zerlege(code);
    const r = { muster: true, punkte: [] };
    if (!teile.length) return Object.assign(r, { ok: false, text: "Noch keine Anweisung eingegeben." });
    const ist = [];
    for (let i = 0; i < teile.length; i++) {
      if (!RX_DCL.test(teile[i])) return Object.assign(r, { ok: false, text: "Anweisung " + (i + 1) + " ist kein CREATE USER, GRANT oder REVOKE. Gefragt sind hier nur Anweisungen für Rechte." });
      const d = dclLesen(teile[i]);
      if (!d.ok) return Object.assign(r, { ok: false, text: "Anweisung " + (i + 1) + ": " + d.text });
      d.nr = i + 1;
      ist.push(d);
    }
    const punkte = [], frei = ist.slice(), paarung = [];
    (a.muster || []).forEach(m => {
      const kand = frei.filter(d => d.art === m.art);
      if (!kand.length) { punkte.push({ ok: false, text: "Es fehlt eine Anweisung: " + DCL_ART[m.art] + "." }); return; }
      let best = null, bestP = null, bestF = Infinity;
      kand.forEach(d => { const pk = dclAbgleich(m, d); const f = pk.filter(x => x.ok === false).length; if (f < bestF) { best = d; bestP = pk; bestF = f; } });
      frei.splice(frei.indexOf(best), 1);
      paarung.push({ m, d: best });
      bestP.forEach(x => punkte.push(Object.assign({}, x, { text: "Anweisung " + best.nr + ": " + x.text })));
    });
    frei.forEach(d => punkte.push({ ok: false, text: "Anweisung " + d.nr + " ist nicht verlangt: " + dclBeschreiben(d) + "." }));
    paarung.filter(x => x.d.art === "create_user" || x.d.art === "create_role").forEach(c => {
      const namen = c.d.konten.map(k => k.name);
      if (paarung.some(g => (g.d.art === "grant" || g.d.art === "grant_role") && g.d.nr < c.d.nr && g.d.konten.some(k => namen.indexOf(k.name) >= 0)))
        punkte.push({ ok: false, text: "Reihenfolge: erst CREATE USER, dann GRANT. Einem Benutzer, den es noch nicht gibt, kann man keine Rechte geben." });
    });
    const fehler = punkte.filter(x => x.ok === false).length;
    return Object.assign(r, { ok: !fehler, punkte,
      text: fehler ? "Noch nicht ganz — " + fehler + (fehler === 1 ? " Punkt passt" : " Punkte passen") + " nicht zum Muster."
        : "Richtig! Entspricht dem Muster (geprüft nach Muster, nicht ausgeführt)." });
  }

  /* ======================================================================
     Vergleichen
     ====================================================================== */
  function normWert(v) {
    if (v == null) return "∅";
    if (typeof v === "number") return String(Math.round(v * 100) / 100);
    if (typeof v === "object") return "[blob]";
    const s = String(v).trim();
    if (/^-?\d+(\.\d+)?$/.test(s) && !/^0\d/.test(s)) return String(Math.round(parseFloat(s) * 100) / 100);
    return s;
  }
  const zeileSchl = z => z.map(normWert).join("\u0001");
  const zeigeZeile = z => z.map(v => v == null ? "NULL" : String(v)).join(" | ");

  function mengenDiff(a, b) {
    const zaehl = {};
    b.forEach(z => { const k = zeileSchl(z); zaehl[k] = (zaehl[k] || 0) + 1; });
    const fehlt = [];
    a.forEach(z => { const k = zeileSchl(z); if (zaehl[k]) zaehl[k]--; else fehlt.push(z); });
    return fehlt;
  }

  /** soll/ist: { spalten, zeilen } — Rückgabe { ok, text, fehlt, zuviel } */
  function vergleiche(soll, ist, ordnung) {
    if (!ist) return { ok: false, text: "Keine Ergebnistabelle — die letzte Anweisung muss ein SELECT sein." };
    const sc = soll.spalten.length, ic = ist.spalten.length;
    const sig = (zeilen, j) => zeilen.map(z => normWert(z[j])).sort().join("\u0001");
    const sSig = soll.spalten.map((_, j) => sig(soll.zeilen, j));
    const iSig = ist.spalten.map((_, k) => sig(ist.zeilen, k));
    const frei = new Set(ist.spalten.map((_, k) => k));
    const karte = sSig.map((s, j) => {
      let k = frei.has(j) && iSig[j] === s ? j : -1;
      if (k < 0) for (const x of frei) if (iSig[x] === s) { k = x; break; }
      if (k >= 0) { frei.delete(k); return k; }
      return null;
    });
    const namen = soll.spalten.join(", ");
    if (karte.every(k => k != null)) {
      const proj = ist.zeilen.map(z => karte.map(k => z[k]));
      const fehlt = mengenDiff(soll.zeilen, proj), zuviel = mengenDiff(proj, soll.zeilen);
      if (!fehlt.length && !zuviel.length) {
        if (ic > sc) return { ok: false, text: "Die Werte stimmen, aber du lieferst " + ic + " Spalten statt " + sc + " (" + namen + "). Die zusätzlichen Spalten weglassen." };
        if (ordnung && proj.some((z, i) => zeileSchl(z) !== zeileSchl(soll.zeilen[i])))
          return { ok: false, text: "Die Zeilen stimmen, aber die Reihenfolge nicht. ORDER BY prüfen (Spalte? ASC oder DESC?)." };
        return { ok: true, text: "Richtig! " + soll.zeilen.length + (soll.zeilen.length === 1 ? " Zeile" : " Zeilen") + " wie in der Musterlösung." };
      }
      return { ok: false, text: "Die Spalten passen, aber einzelne Zeilen nicht.", fehlt: fehlt.slice(0, 3), zuviel: zuviel.slice(0, 3) };
    }
    if (ic < sc) return { ok: false, text: "Es fehlen Spalten: erwartet sind " + sc + " (" + namen + "), du lieferst " + ic + "." };
    const is = ist.zeilen.length, ss = soll.zeilen.length;
    const proj = ist.zeilen.map(z => karte.map((k, j) => z[k != null ? k : j]));
    const fehlt = mengenDiff(soll.zeilen, proj).slice(0, 3), zuviel = mengenDiff(proj, soll.zeilen).slice(0, 3);
    if (is !== ss) {
      const grund = is > ss
        ? (is > ss * 3 && is > 30 ? " Viel zu viele — fehlt eine JOIN-Bedingung (ON) oder das WHERE?" : " Ist die Bedingung zu weit, fehlt ein Filter oder ein GROUP BY?")
        : " Ist die Bedingung zu streng? Sollen auch Zeilen ohne Partner erscheinen (LEFT JOIN)?";
      return { ok: false, text: "Du bekommst " + is + (is === 1 ? " Zeile" : " Zeilen") + ", erwartet sind " + ss + "." + grund, fehlt, zuviel };
    }
    const falsch = karte.map((k, j) => k == null ? soll.spalten[j] : null).filter(Boolean);
    return { ok: false, text: "Die Anzahl der Zeilen stimmt, aber die Werte nicht" + (falsch.length ? " — erwartet wird: " + falsch.join(", ") : "") + ".", fehlt, zuviel };
  }

  /** Alle Zellen gleich — Texte exakt, also auch mit Leerzeichen am Rand */
  function gleicheZellen(soll, ist) {
    const z = r => [].concat(...r.zeilen).map(v => typeof v === "string" ? "s:" + v : normWert(v)).sort().join("\u0001");
    return !!soll && !!ist && z(soll) === z(ist);
  }

  function vergleicheStand(soll, ist, start) {
    const alle = Array.from(new Set(Object.keys(soll).concat(Object.keys(ist)))).sort();
    const teile = [];
    alle.forEach(t => {
      const s = soll[t], i = ist[t];
      if (!i) { teile.push({ tabelle: t, text: "Tabelle " + t + " fehlt bei dir (gelöscht?)." }); return; }
      if (!s) { teile.push({ tabelle: t, text: "Tabelle " + t + " gibt es bei dir zusätzlich." }); return; }
      const fehlt = mengenDiff(s.zeilen, i.zeilen), zuviel = mengenDiff(i.zeilen, s.zeilen);
      if (fehlt.length || zuviel.length) {
        const n = Math.max(fehlt.length, zuviel.length);
        teile.push({ tabelle: t, spalten: s.spalten, fehlt: fehlt.slice(0, 2), zuviel: zuviel.slice(0, 2),
          text: t + ": " + n + (n === 1 ? " Zeile weicht" : " Zeilen weichen") + " von der Musterlösung ab" +
            (i.zeilen.length !== s.zeilen.length ? " (" + i.zeilen.length + " statt " + s.zeilen.length + " Zeilen)" : "") + "." });
      }
    });
    if (!teile.length) return { ok: true, text: "Richtig! Die Tabellen sehen genau so aus wie nach der Musterlösung." };
    const unveraendert = start && JSON.stringify(start) === JSON.stringify(ist);
    return { ok: false, text: unveraendert ? "Es hat sich nichts geändert — trifft die WHERE-Bedingung keine Zeile?" : "Noch nicht ganz.", teile };
  }

  function familie(typ) {
    const t = String(typ || "").toUpperCase();
    if (!t) return "ohne";
    if (/INT/.test(t)) return "int";
    if (/CHAR|TEXT|CLOB|STRING/.test(t)) return "text";
    if (/DEC|NUMERIC|NUMBER|MONEY/.test(t)) return "dezimal";
    if (/REAL|FLOA|DOUB/.test(t)) return "gleitkomma";
    if (/DATETIME|TIMESTAMP/.test(t)) return "zeitpunkt";
    if (/DATE/.test(t)) return "datum";
    if (/BOOL/.test(t)) return "bool";
    return "anders";
  }
  const FAM_NAME = { int: "ganze Zahl (INT/INTEGER)", text: "Text (VARCHAR(n))", dezimal: "Dezimalzahl (DECIMAL(p,s))", datum: "Datum (DATE)", bool: "Wahrheitswert (BOOLEAN)" };

  function pruefeAufbau(db, spec, fkExtra) {
    const punkte = [];
    const t = tabelleFinden(db, spec.tabelle, "table");
    if (!t) {
      const v = tabelleFinden(db, spec.tabelle, "view");
      return { ok: false, text: v ? spec.tabelle + " ist eine Sicht, keine Tabelle." : "Die Tabelle " + spec.tabelle + " gibt es noch nicht.", punkte };
    }
    const sp = spaltenVon(db, t);
    const von = {};
    sp.forEach(s => { von[s.name.toLowerCase()] = s; });
    let fehler = 0;
    const gut = x => punkte.push({ ok: true, text: x });
    const schlecht = x => { fehler++; punkte.push({ ok: false, text: x }); };
    const info = x => punkte.push({ info: true, text: x });
    Object.keys(spec.spalten).forEach(n => {
      const s = von[n.toLowerCase()], soll = spec.spalten[n];
      if (!s) { schlecht("Spalte " + n + " fehlt."); return; }
      const f = familie(s.typ);
      if (f === soll) {
        if (soll === "dezimal" && spec.nachkommastellen && spec.nachkommastellen[n] != null) {
          const scale = spec.nachkommastellen[n];
          const dec = /\(\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(s.typ || "");
          if (!dec || +dec[2] !== scale || +dec[1] <= scale) {
            schlecht(n + ": verlangt sind " + scale + " Nachkommastellen und eine Präzision mit Platz vor dem Komma, z. B. DECIMAL(8," + scale + ").");
            return;
          }
        }
        const l = /\(\s*(\d+)/.exec(s.typ || "");
        const L = spec.laenge && spec.laenge[n];
        if (L && soll === "text" && l && +l[1] !== L) schlecht(n + ": " + s.typ + " — verlangt waren " + L + " Zeichen.");
        else if (L && soll === "text" && !l) { info(n + ": ohne Länge — besser VARCHAR(" + L + ")."); gut(n + " " + (s.typ || "")); }
        else gut(n + " " + s.typ);
      } else if (f === "ohne") schlecht(n + ": Datentyp fehlt — erwartet " + FAM_NAME[soll] + ".");
      else if (soll === "dezimal" && f === "gleitkomma") schlecht(n + ": " + s.typ + " rundet ungenau. Für Geldbeträge DECIMAL(8,2).");
      else schlecht(n + ": " + s.typ + " passt nicht — erwartet " + (FAM_NAME[soll] || soll) + ".");
    });
    if (spec.alle !== false) {
      const extra = sp.filter(s => !Object.keys(spec.spalten).some(n => n.toLowerCase() === s.name.toLowerCase()));
      if (extra.length) info("Zusätzliche Spalte(n), nicht verlangt: " + extra.map(s => s.name).join(", ") + ".");
    }
    if (spec.pk) {
      const ist = sp.filter(s => s.pk).sort((a, b) => a.pk - b.pk).map(s => s.name.toLowerCase()).sort();
      const soll = spec.pk.map(x => x.toLowerCase()).sort();
      if (ist.join() === soll.join()) gut("Primärschlüssel: " + spec.pk.join(", "));
      else if (!ist.length) schlecht("Kein Primärschlüssel. Verlangt: " + spec.pk.join(" + ") + (spec.pk.length > 1 ? " → PRIMARY KEY (" + spec.pk.join(", ") + ")" : " → PRIMARY KEY") + ".");
      else schlecht("Primärschlüssel ist " + ist.join(" + ") + ", verlangt ist " + spec.pk.join(" + ") + ".");
    }
    (spec.notnull || []).forEach(n => {
      const s = von[n.toLowerCase()];
      if (s && !s.notnull && !s.pk) schlecht(n + " ist ein Pflichtfeld → NOT NULL fehlt.");
      else if (s) gut(n + " NOT NULL");
    });
    if (spec.fk) {
      const liste = fkVon(db, t).concat((fkExtra || []).filter(f => f.tabelle.toLowerCase() === t.toLowerCase()));
      spec.fk.forEach(([vonSp, zu, zuSp]) => {
        const f = liste.find(x => x.von.toLowerCase() === vonSp.toLowerCase());
        if (!f) { schlecht(vonSp + " ist noch kein Fremdschlüssel → REFERENCES " + zu + "(" + zuSp + ")."); return; }
        if (f.zu.toLowerCase() !== zu.toLowerCase()) { schlecht(vonSp + " verweist auf " + f.zu + ", erwartet " + zu + "."); return; }
        if (!tabelleFinden(db, f.zu, "table")) { schlecht("Die Tabelle " + f.zu + " gibt es nicht."); return; }
        if (f.spalte && f.spalte.toLowerCase() !== zuSp.toLowerCase()) { schlecht(vonSp + " verweist auf " + f.zu + "." + f.spalte + ", erwartet " + zu + "." + zuSp + "."); return; }
        gut(vonSp + " → " + zu + "(" + zuSp + ")");
      });
    }
    return { ok: !fehler, text: fehler ? "Noch nicht ganz — " + fehler + (fehler === 1 ? " Punkt fehlt." : " Punkte fehlen.") : "Richtig! Tabelle, Datentypen und Schlüssel stimmen.", punkte };
  }

  /* ======================================================================
     Bewerten
     ====================================================================== */
  const LOES = {};
  function loesungLauf(a) {
    if (LOES[a.id]) return LOES[a.id];
    if (a.art === "muster") return (LOES[a.id] = { lauf: null, stand: null, sicht: null, beispiel: null });
    const db = dbFuer(a);
    try {
      const lauf = ausfuehren(db, a.loesung);
      const r = { lauf, stand: (a.art === "dml") ? schnappschuss(db) : null, sicht: null, beispiel: null };
      if (a.art === "view") { const x = ausfuehren(db, "SELECT * FROM " + q(a.view)); r.sicht = x.letztes; }
      if (a.beispiel) {
        /* Wie im Prüfungsbogen: nur ein Auszug, nie das ganze Ergebnis */
        const b = typeof a.beispiel === "object" ? a.beispiel : { n: a.beispiel };
        const quelle = b.sql ? ausfuehren(db, b.sql).letztes : (r.sicht || lauf.letztes);
        if (quelle) {
          const n = Math.max(0, Math.min(b.n || 2, quelle.zeilen.length - 1));
          r.beispiel = { titel: b.titel || "Ergebnisbeispiel", spalten: quelle.spalten.slice(), zeilen: quelle.zeilen.slice(0, n), gesamt: quelle.zeilen.length };
        }
      }
      LOES[a.id] = r;
      return r;
    } finally { db.close(); }
  }
  const beispielVon = a => (a && a.beispiel && a.art !== "muster" && a.art !== "vorhersage") ? loesungLauf(a).beispiel : null;

  function bewerte(a, code) {
    if (a.art === "muster") return musterPruefen(a, code);
    if (a.art === "vorhersage") return { ok: false, text: "Bei dieser Aufgabe schreibst du kein SQL — wähle das Ergebnis aus." };
    const db = dbFuer(a);
    try {
      const lauf = ausfuehren(db, code);
      if (lauf.fehler) return { ok: false, lauf, text: "Fehler in Anweisung " + lauf.fehler.nr + ": " + lauf.fehler.text };
      const art = a.art || "select";
      const soll = loesungLauf(a);
      let r;
      if (art === "select") {
        r = vergleiche(soll.lauf.letztes, lauf.letztes, !!a.ordnung);
        /* Text-Aufgaben: Leerzeichen am Rand zählen (LEFT/RIGHT ±1 ist genau der Fehler) */
        if (r.ok && a.genau && !gleicheZellen(soll.lauf.letztes, lauf.letztes))
          r = { ok: false, text: "Fast: Die Werte stimmen nur bis auf Leerzeichen am Anfang oder Ende. Prüfe die Zeichenzahl bei LEFT/RIGHT — oft ist sie um 1 zu groß, weil das Leerzeichen mitgezählt wird." };
      } else if (art === "dml") {
        const start = (() => { const d = dbFuer(a); try { return schnappschuss(d); } finally { d.close(); } })();
        r = vergleicheStand(soll.stand, schnappschuss(db), start);
      } else if (art === "ddl") r = pruefeAufbau(db, a.ddl, lauf.fk);
      else if (art === "view") {
        const v = tabelleFinden(db, a.view, "view");
        if (!v) r = { ok: false, text: tabelleFinden(db, a.view, "table") ? a.view + " ist eine Tabelle — gefragt ist eine Sicht: CREATE VIEW " + a.view + " AS SELECT …" : "Die Sicht " + a.view + " gibt es noch nicht (Name genau so schreiben)." };
        else {
          const x = ausfuehren(db, "SELECT * FROM " + q(v));
          r = vergleiche(soll.sicht, x.letztes, false);
          if (r.ok) r.text = "Richtig! Die Sicht " + v + " liefert dasselbe wie die Musterlösung.";
        }
      }
      r.lauf = lauf;
      return r;
    } finally { db.close(); }
  }

  /* ======================================================================
     Ergebnis vorhersagen — Wahrheit ist die echte Ausführung
     ====================================================================== */
  const vhOptionen = a => (a.optionen || []).map(o => Array.isArray(o) ? { spalten: a.spalten || [], zeilen: o } : o);
  /** Gleiche Tabelle? Spalten nach Position, Zeilen als Menge (bei ordnung in Reihenfolge). */
  function tabelleGleich(o, ist, ordnung) {
    if (!o || !ist || o.spalten.length !== ist.spalten.length || o.zeilen.length !== ist.zeilen.length) return false;
    if (o.zeilen.some(z => z.length !== o.spalten.length)) return false;
    if (ordnung) return o.zeilen.every((z, i) => zeileSchl(z) === zeileSchl(ist.zeilen[i]));
    return !mengenDiff(o.zeilen, ist.zeilen).length && !mengenDiff(ist.zeilen, o.zeilen).length;
  }
  /** Richtige Antwort aus der Ausführung: Index (wahl), Zeilenzahl oder erster Wert */
  function vorhersageSoll(a) {
    const ist = loesungLauf(a).lauf.letztes;
    if (a.frage === "wahl") {
      const treffer = vhOptionen(a).map((o, i) => tabelleGleich(o, ist, a.ordnung) ? i : -1).filter(i => i >= 0);
      return treffer.length === 1 ? treffer[0] : a.richtig;
    }
    if (a.frage === "zeilen") return ist ? ist.zeilen.length : a.antwort;
    return ist && ist.zeilen.length ? ist.zeilen[0][0] : a.antwort;
  }
  /** Eingabe vergleichbar machen: Leerraum, 'Anführungszeichen', Dezimalkomma, Groß/klein egal */
  function eingabeNorm(v) {
    if (v == null) return "∅";
    let s = String(v).trim().replace(/^(['"])([\s\S]*)\1$/, "$2").trim();
    if (/^null$/i.test(s)) return "∅";
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
    return normWert(s).toLowerCase();
  }
  const anzeigeWert = v => v == null ? "NULL" : typeof v === "number" && !Number.isInteger(v) ? String(Math.round(v * 10000) / 10000) : String(v);
  function vorhersageDaten(a) {
    const db = dbFuer(a);
    try {
      return (a.zeigen || []).map(z => {
        const x = typeof z === "string" ? { titel: z, sql: "SELECT * FROM " + q(z) } : z;
        return { titel: x.titel, r: ausfuehren(db, x.sql).letztes };
      });
    } finally { db.close(); }
  }
  const tabelleText = r => r ? [r.spalten.join(" | ")].concat(r.zeilen.map(zeigeZeile)).join("\n") : "";
  function vorhersageSnapshot(a, soll) {
    const loes = a.frage === "wahl" ? "Richtig: Antwort " + BUCHST[soll] + "\n" + tabelleText(vhOptionen(a)[soll])
      : a.frage === "zeilen" ? soll + " Zeilen" : anzeigeWert(soll);
    return { type: "sql", title: a.titel, question: a.text + "\n\n" + a.loesung + "\n\n" + vorhersageDaten(a).map(d => d.titel + ":\n" + tabelleText(d.r)).join("\n\n"),
      solution: loes, explanation: a.ru, schema: schemaText(a.db), before: a.vorher || "" };
  }

  /* ======================================================================
     Fortschritt
     ====================================================================== */
  const lies = () => { try { const v = JSON.parse(localStorage.getItem(SK)); return v && typeof v === "object" ? v : null; } catch (e) { return null; } };
  let STAND = null;
  function stand() {
    if (!STAND) STAND = Object.assign({ v: 1, a: {}, pos: null }, hatDom ? lies() || {} : {});
    if (!STAND.a) STAND.a = {};
    return STAND;
  }
  let merkTimer = null, speicherFehler = false;
  function merken(sofort) {
    clearTimeout(merkTimer);
    const los = () => {
      try { localStorage.setItem(SK, JSON.stringify(stand())); speicherFehler = false; }
      catch (e) { speicherFehler = true; meldeSpeicherFehler(); }
    };
    if (sofort) los(); else merkTimer = setTimeout(los, 500);
  }
  function meldeSpeicherFehler() {
    if (!hatDom) return;
    const s = $("scSql");
    if (!s || s.querySelector(".sq-speicherfehler")) return;
    const p = el("p", "sq-notiz warn sq-speicherfehler", "Der Fortschritt konnte auf diesem Gerät nicht gespeichert werden (Speicher voll oder gesperrt). Dein Text bleibt in dieser Seite stehen — Прогресс не сохранён на устройстве; введённый текст остаётся на странице.");
    p.setAttribute("role", "alert");
    s.prepend(p);
  }
  const eintrag = id => stand().a[id] || (stand().a[id] = {});
  function hilfeMerken(id, art) {
    const x = eintrag(id);
    if (art === "loesung") x.gesehen = 1; else x.hilfe = 1;
    x.t = Date.now(); merken(true);
  }
  const schemaText = name => zerlege(datenbank(name).SCHEMA).filter(s => /^CREATE\s+TABLE\b/i.test(s)).join(";\n");
  function pruefen(a, code) {
    const x = eintrag(a.id), r = bewerte(a, code);
    const support = x.gesehen ? "loesung" : x.hilfe || x.feedback ? "hilfe" : "selbst";
    x.n = (x.n || 0) + 1; x.t = Date.now(); x.code = code;
    if (r.ok) x.ok = 1;
    if (root.GENLERNSTAND) root.GENLERNSTAND.record({ topic: "sql", source: "sql", task: a.id,
      correct: r.ok ? 1 : 0, max: 1, support, kind: "auto", answers: { code },
      reason: r.muster ? r.text + " (Prüfung nach Muster, ohne Ausführung)" : r.text,
      snapshot: { type: "sql", title: a.titel, question: a.text + (a.hinweis ? "\nHinweis: " + a.hinweis : ""), solution: a.loesung, explanation: a.ru,
        schema: schemaText(a.db), before: a.vorher || "" } });
    r.support = support;
    /* Ein weiterer Versuch verwendet bereits die Rückmeldung dieser Prüfung. */
    x.feedback = 1; merken(true);
    return r;
  }
  /** Antwort bei „Ergebnis vorhersagen“ prüfen und ins Lernjournal schreiben.
      Auswahl → kind "recognition", eingetippte Zahl/Wert → kind "auto". */
  function vorhersagePruefen(a, antwort) {
    const x = eintrag(a.id);
    const support = x.gesehen ? "loesung" : x.hilfe || x.feedback ? "hilfe" : "selbst";
    const soll = vorhersageSoll(a);
    let ok, gegeben, text;
    if (a.frage === "wahl") {
      ok = antwort.wahl === soll;
      gegeben = BUCHST[antwort.wahl] || "?";
      text = ok ? "Antwort " + gegeben + " ist genau das Ergebnis der Abfrage." : "Richtig ist Antwort " + BUCHST[soll] + " (deine Wahl: " + gegeben + "). Vergleiche die markierten Tabellen.";
    } else {
      ok = eingabeNorm(antwort.wert) === eingabeNorm(soll);
      gegeben = String(antwort.wert == null ? "" : antwort.wert).trim();
      const was = a.frage === "zeilen" ? soll + (soll === 1 ? " Zeile" : " Zeilen") : anzeigeWert(soll);
      text = ok ? "Die Abfrage liefert " + was + "." : "Die Abfrage liefert " + was + " — deine Antwort: " + (gegeben || "(leer)") + ".";
    }
    const t = Date.now();
    x.n = (x.n || 0) + 1; x.t = t;
    if (ok) x.ok = 1;
    x.letzt = { ok: !!ok, antwort: gegeben };
    if (root.GENLERNSTAND) root.GENLERNSTAND.record({ id: "sql-vh:" + a.id + ":" + t, t, topic: "sql", source: "sql", task: a.id,
      correct: ok ? 1 : 0, max: 1, support, kind: a.frage === "wahl" ? "recognition" : "auto",
      answers: a.frage === "wahl" ? { wahl: gegeben } : { wert: gegeben }, reason: text, snapshot: vorhersageSnapshot(a, soll) });
    x.feedback = 1; merken(true);
    return { ok: !!ok, soll, text, support };
  }
  function zahlen() {
    const A = liste(), S = stand().a;
    const schreiben = A.filter(a => a.art !== "vorhersage"), vh = A.filter(a => a.art === "vorhersage");
    const geloest = l => l.filter(a => S[a.id] && S[a.id].ok).length;
    return { gesamt: schreiben.length, geloest: geloest(schreiben),
      versucht: schreiben.filter(a => S[a.id] && !S[a.id].ok && (S[a.id].n || S[a.id].code)).length,
      vorhersage: { gesamt: vh.length, geloest: geloest(vh) } };
  }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  let UI = { ansicht: "liste", thema: "", id: null, sandkasten: null };
  let herkunft = "scStart";

  function seite() {
    let s = $("scSql");
    if (s) return s;
    s = el("div", "seite sq-seite"); s.id = "scSql"; s.hidden = true;
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling);
    else document.body.appendChild(s);
    return s;
  }
  function zeigen() {
    const s = seite();
    const vorher = ["scBogen", "scAuswertung", "scKatalog", "scAzubi", "scWieder", "scGlossar", "scKomp", "scSpick"].find(id => $(id) && !$(id).hidden) || "scStart";
    if (vorher !== "scSql") herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => { if (e.id !== "scSql") e.hidden = true; });
    s.hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    if ($("kTitel")) $("kTitel").textContent = "SQL-Trainer";
    if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · echte Datenbank, läuft offline";
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scSql", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
    try {
      if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: herkunft }, "");
      if (history.state.seite !== "scSql") history.pushState({ ihk: 1, seite: "scSql" }, "", location.hash || "");
    } catch (e) { }
  }

  function oeffnen(opt) {
    opt = opt || {};
    const s = seite();
    zeigen();
    if (!SQL) {
      s.innerHTML = "";
      const k = el("div", "sq-karte sq-laden");
      k.appendChild(el("b", null, "Datenbank wird geladen …"));
      k.appendChild(el("p", "sq-klein", "Einmalig rund 0,7 MB, danach offline verfügbar."));
      s.appendChild(k);
      laden().then(() => oeffnen(opt), e => {
        s.innerHTML = "";
        const f = el("div", "sq-karte sq-fehlerbox");
        f.appendChild(el("b", null, "Die Datenbank konnte nicht geladen werden."));
        f.appendChild(el("p", "sq-klein", location.protocol === "file:"
          ? "Die Datei vendor/sqljs-1.14.2/sql-asm.js fehlt im Ordner. (" + (e && e.message || e) + ")"
          : "Einmal mit Internet öffnen — danach geht es auch offline. (" + (e && e.message || e) + ")"));
        const n = el("button", "btn", "Nochmal versuchen"); n.type = "button"; n.onclick = () => oeffnen(opt);
        f.appendChild(n);
        s.appendChild(f);
      });
      return;
    }
    if (opt.id) { UI.ansicht = "aufgabe"; UI.id = opt.id; }
    else if (opt.sandkasten) UI.ansicht = "frei";
    else if (opt.vorhersage) { UI.ansicht = "aufgabe"; UI.id = naechste(null, "vorhersage"); }
    else if (opt.weiter) { UI.ansicht = "aufgabe"; UI.id = naechste(); }
    else if (!opt.bleiben) UI.ansicht = "liste";
    zeichnen();
    root.scrollTo(0, 0);
  }

  /** Nächste ungelöste Aufgabe (nach der Aufgabe „nach“), optional nur einer Art */
  function naechste(nach, art) {
    const alle = liste(), S = stand().a;
    const A = art ? alle.filter(a => (a.art || "select") === art) : alle;
    if (!A.length) return alle[0].id;
    const ab = nach ? A.findIndex(a => a.id === nach) + 1 : 0;
    const reihe = A.slice(ab).concat(A.slice(0, ab));
    const x = reihe.find(a => !(S[a.id] && S[a.id].ok));
    return (x || A[0]).id;
  }

  function zeichnen() {
    const s = seite();
    s.innerHTML = "";
    const box = el("div", "sq-wrap");
    s.appendChild(box);
    if (UI.ansicht === "aufgabe") aufgabeZeichnen(box);
    else if (UI.ansicht === "frei") freiZeichnen(box);
    else listeZeichnen(box);
  }

  /* ------------------------------------------------------------ Liste --- */
  function listeZeichnen(box) {
    const D = daten(), Z = zahlen(), S = stand().a, A = liste();
    const kopf = el("div", "sq-karte");
    kopf.appendChild(el("h2", null, "SQL-Trainer"));
    kopf.appendChild(el("p", "sq-info", Z.gesamt + " Aufgaben im IHK-Stil an echten Datenbanken (Online-Shop und IT-Service), passend zum SQL-Beiblatt der Prüfung (Stand 2024-10-07). " +
      "Du schreibst SQL, die App führt es aus und vergleicht dein Ergebnis mit der Musterlösung. Dazu " + Z.vorhersage.gesamt +
      " Aufgaben „Ergebnis vorhersagen“: Abfrage lesen und das Ergebnis bestimmen — wie beim Lesen einer Prüfungsaufgabe."));
    const bar = el("div", "sq-balken"); const f = el("span"); f.style.width = Math.round(Z.geloest / Math.max(1, Z.gesamt) * 100) + "%"; bar.appendChild(f);
    kopf.appendChild(bar);
    kopf.appendChild(el("p", "sq-klein", Z.geloest + " von " + Z.gesamt + " gelöst" + (Z.versucht ? " · " + Z.versucht + " angefangen" : "") +
      " · Ergebnis vorhersagen: " + Z.vorhersage.geloest + " von " + Z.vorhersage.gesamt + " richtig"));
    const st = el("div", "sq-steuer");
    const w = el("button", "btn primary", Z.geloest ? "Weiter üben" : "Erste Aufgabe"); w.type = "button";
    w.onclick = () => oeffnen({ weiter: true });
    const vh = el("button", "btn", "Ergebnis vorhersagen"); vh.type = "button"; vh.onclick = () => oeffnen({ vorhersage: true });
    const fr = el("button", "btn", "Freies SQL"); fr.type = "button"; fr.onclick = () => oeffnen({ sandkasten: true });
    st.append(w, vh, fr);
    kopf.appendChild(st);
    box.appendChild(kopf);

    const chips = el("div", "sq-chips");
    [{ key: "", name: "Alle" }].concat(D.THEMEN).forEach(t => {
      const n = A.filter(a => !t.key || a.thema === t.key);
      if (!n.length) return;
      const g = n.filter(a => S[a.id] && S[a.id].ok).length;
      const c = el("button", "sq-chip" + (UI.thema === t.key ? " an" : ""), t.name + " " + g + "/" + n.length); c.type = "button";
      c.setAttribute("aria-pressed", UI.thema === t.key ? "true" : "false");
      c.onclick = () => { UI.thema = t.key; zeichnen(); };
      chips.appendChild(c);
    });
    box.appendChild(chips);

    const listeEl = el("div", "sq-liste");
    D.THEMEN.filter(t => !UI.thema || UI.thema === t.key).forEach(t => {
      const auf = A.filter(a => a.thema === t.key);
      if (!auf.length) return;
      listeEl.appendChild(el("h3", "sq-thema", t.name));
      auf.forEach(a => {
        const e = S[a.id] || {};
        const z = el("button", "sq-zeile" + (e.ok ? " ok" : (e.n || e.code) ? " halb" : "")); z.type = "button";
        const pkt = el("span", "sq-status"); pkt.textContent = e.ok ? "✓" : (e.n || e.code) ? "…" : "";
        const txt = el("span", "sq-z-text");
        const b = el("b", null, a.titel);
        if (a.db && a.db !== "shop") b.appendChild(el("small", "sq-db", datenbank(a.db).titel));
        txt.appendChild(b);
        const unter = a.art === "vorhersage" ? a.loesung.replace(/\s+/g, " ") : a.text;
        txt.appendChild(el("span", null, unter.length > 90 ? unter.slice(0, 88) + " …" : unter));
        z.append(pkt, txt, el("span", "sq-stufe s" + a.stufe, "●".repeat(a.stufe)));
        z.onclick = () => oeffnen({ id: a.id });
        listeEl.appendChild(z);
      });
    });
    box.appendChild(listeEl);
  }

  /* ------------------------------------------------------------ Schema --- */
  function schemaKasten(offen, dbName) {
    const def = datenbank(dbName);
    const d = el("details", "sq-schema");
    if (offen) d.open = true;
    d.appendChild(el("summary", null, "Datenbank-Schema ansehen" + (dbName && dbName !== "shop" ? " (" + def.titel + ")" : "")));
    let db = null;
    try {
      db = neueDb(null, dbName);
      const inhalt = el("div", "sq-schema-in");
      Object.keys(def.TABELLEN).forEach(t => {
        const k = el("div", "sq-tab");
        const kopf = el("div", "sq-tab-kopf");
        kopf.appendChild(el("b", null, t));
        const r = db.exec("SELECT COUNT(*) FROM " + q(t));
        kopf.appendChild(el("span", "sq-klein", r[0].values[0][0] + " Zeilen"));
        k.appendChild(kopf);
        const fks = fkVon(db, t);
        const sp = el("div", "sq-spalten");
        spaltenVon(db, t).forEach(s => {
          const fk = fks.find(f => f.von === s.name);
          const c = el("span", "sq-sp" + (s.pk ? " pk" : "") + (fk ? " fk" : ""));
          c.textContent = s.name;
          c.title = s.typ + (s.pk ? " · Primärschlüssel" : "") + (fk ? " · verweist auf " + fk.zu + "." + fk.spalte : "");
          if (fk) { const x = el("small", null, " → " + fk.zu); c.appendChild(x); }
          sp.appendChild(c);
        });
        k.appendChild(sp);
        k.appendChild(el("p", "sq-klein", def.TABELLEN[t]));
        const zeig = el("button", "sq-mini", "Daten zeigen"); zeig.type = "button";
        zeig.onclick = () => {
          const vorhanden = k.querySelector(".sq-ergebnis");
          if (vorhanden) { vorhanden.remove(); zeig.textContent = "Daten zeigen"; return; }
          let d2 = null;
          try { d2 = neueDb(null, dbName); const l = ausfuehren(d2, "SELECT * FROM " + q(t)); k.appendChild(ergebnisTabelle(l.letztes)); }
          finally { if (d2) d2.close(); }
          zeig.textContent = "Daten ausblenden";
        };
        k.appendChild(zeig);
        inhalt.appendChild(k);
      });
      inhalt.appendChild(el("p", "sq-klein", "Unterstrichen = Primärschlüssel, → = Fremdschlüssel. Datum als 'JJJJ-MM-TT' (mit Uhrzeit 'JJJJ-MM-TT hh:mm'). Groß-/Kleinschreibung von Befehlen und Namen ist egal, von Texten nicht ('Köln')."));
      d.appendChild(inhalt);
    } finally { if (db) db.close(); }
    return d;
  }

  /* Kurzfassung der Funktionen aus dem Beiblatt — eigene Worte, keine Kopie */
  const BEIBLATT = [
    ["YEAR(d), MONTH(d), DAY(d)", "Jahr, Monat, Tag als Zahl"],
    ["WEEKDAY(d)", "Wochentag als Zahl: Montag = 0 … Sonntag = 6"],
    ["HOUR(d), MINUTE(d)", "Stunde, Minute als Zahl"],
    ["NOW()", "jetzt (Datum mit Uhrzeit); in manchen Aufgaben fest vorgegeben"],
    ["DATEDIFF(DAY, Anfang, Ende)", "Ende − Anfang in DAY, MONTH, YEAR, HOUR oder MINUTE. Gezählt werden Wechsel: DATEDIFF(YEAR, '2025-12-31', '2026-01-01') = 1"],
    ["DATEADD(MONTH, 3, Datum)", "Datum plus Intervall; negativ = zurück. 31.01. + 1 Monat = Monatsende Februar"],
    ["LEFT(Text, n), RIGHT(Text, n)", "n Zeichen von links bzw. von rechts"],
    ["STDDEV(x), VARIANCE(x)", "Streuung über alle Werte (geteilt durch n); NULL zählt nicht"],
    ["CORR(x, y)", "Zusammenhang von −1 bis 1 (1 = gleichläufig, 0 = keiner)"],
    ["UNION", "zwei Ergebnisse untereinander, doppelte Zeilen fallen weg"],
    ["CREATE USER, GRANT, REVOKE", "kann SQLite nicht ausführen — Prüfung nach Muster"],
    ["Datum", "hier 'JJJJ-MM-TT' bzw. 'JJJJ-MM-TT hh:mm'. 'TT.MM.JJJJ' verstehen die Funktionen auch, Vergleiche (<, >, BETWEEN) aber nur mit 'JJJJ-MM-TT'"]
  ];
  function beiblattKasten() {
    const d = el("details", "sq-schema sq-beiblatt");
    d.appendChild(el("summary", null, "Funktionen laut Beiblatt — so rechnet der Trainer"));
    const ul = el("ul", "sq-bb");
    BEIBLATT.forEach(([code, text]) => { const li = el("li"); li.appendChild(el("code", null, code)); li.appendChild(document.createTextNode(" — " + text)); ul.appendChild(li); });
    d.appendChild(ul);
    d.appendChild(el("p", "sq-ru", "Шпаргалка по листу «SQL-Syntax (Auszug)», своими словами. В DATEDIFF и DATEADD единицу (DAY, MONTH …) пишут первой и без кавычек. Старая форма MySQL DATEDIFF(конец, начало) в днях тоже работает."));
    return d;
  }

  function ergebnisTabelle(r, max, opt) {
    opt = opt || {};
    const w = el("div", "sq-ergebnis");
    if (!r) return w;
    const t = el("table", "sq-tabelle");
    const kopf = el("tr");
    const zahlSp = r.spalten.map((_, j) => r.zeilen.length > 0 && r.zeilen.every(z => z[j] == null || typeof z[j] === "number"));
    r.spalten.forEach((s, j) => kopf.appendChild(el("th", zahlSp[j] ? "zahl" : null, s)));
    const th = el("thead"); th.appendChild(kopf); t.appendChild(th);
    const tb = el("tbody");
    const M = max || 200;
    r.zeilen.slice(0, M).forEach(z => {
      const tr = el("tr");
      z.forEach(v => {
        const td = el("td", v == null ? "null" : typeof v === "number" ? "zahl" : null);
        td.textContent = anzeigeWert(v);
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    if (opt.mehr) { const tr = el("tr", "mehr"); r.spalten.forEach(() => tr.appendChild(el("td", null, "…"))); tb.appendChild(tr); }
    t.appendChild(tb);
    w.appendChild(t);
    if (!opt.ohneFuss) w.appendChild(el("p", "sq-klein", r.zeilen.length + (r.zeilen.length === 1 ? " Zeile" : " Zeilen") +
      (r.zeilen.length > M ? " — die ersten " + M + " angezeigt" : "") + (r.zuViel ? " — abgebrochen (mehr als " + MAX_ZEILEN + ")" : "")));
    return w;
  }
  function beispielKasten(b) {
    const w = el("div", "sq-beispiel");
    const teil = b.zeilen.length < b.gesamt;
    w.appendChild(el("p", "sq-beispiel-titel", b.titel + (teil ? " (Auszug)" : "") + ":"));
    w.appendChild(ergebnisTabelle({ spalten: b.spalten, zeilen: b.zeilen }, null, { ohneFuss: true, mehr: teil }));
    return w;
  }

  /* ------------------------------------------------------------ Editor --- */
  const TASTEN = ["SELECT", "*", "FROM", "WHERE", "AND", "OR", "=", "<>", "'", ",", ";", "(", ")", "JOIN", "LEFT JOIN", "ON",
    "GROUP BY", "HAVING", "ORDER BY", "DESC", "AS", "COUNT(*)", "SUM(", "AVG(", "MAX(", "MIN(", "IN (", "LIKE '%", "IS NULL", "DISTINCT", "LIMIT",
    "INSERT INTO", "VALUES (", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "PRIMARY KEY", "REFERENCES", "NOT NULL", "INTEGER", "VARCHAR(", "DECIMAL(8,2)", "DATE"];
  /* Zusatztasten je Thema — vorne in der Leiste, damit sie ohne Wischen sichtbar sind */
  const TASTEN_THEMA = {
    mengen: ["UNION", "DISTINCT", "RIGHT JOIN"],
    join: ["RIGHT JOIN"],
    sub: ["EXISTS (", "NOT EXISTS (", "AS tbl"],
    agg: ["HAVING"],
    text: ["LEFT(", "RIGHT(", "YEAR(", "MONTH(", "WEEKDAY(", "HOUR(", "DATEDIFF(DAY,", "DATEADD(MONTH,", "NOW()"],
    dml: ["IN (SELECT"]
  };
  const TASTEN_RECHTE = ["CREATE USER", "IDENTIFIED BY '", "GRANT", "REVOKE", "SELECT", "INSERT", "UPDATE", "DELETE", "ALL PRIVILEGES",
    "ON", "service.*", "TO", "FROM", "WITH GRANT OPTION", ",", ";", "'"];
  function tastenFuer(a) {
    if (a && a.art === "muster") return TASTEN_RECHTE;
    const extra = a ? (TASTEN_THEMA[a.thema] || []) : Array.from(new Set([].concat(...Object.keys(TASTEN_THEMA).map(k => TASTEN_THEMA[k]))));
    return TASTEN.slice(0, 4).concat(extra, TASTEN.slice(4).filter(x => extra.indexOf(x) < 0));
  }
  function editor(wert, beiAenderung, ausfuehrenFn, opt) {
    opt = opt || {};
    const w = el("div", "sq-editor-w");
    const ta = el("textarea", "sq-editor");
    ta.value = wert || "";
    ta.rows = 6;
    ta.spellcheck = false;
    ["autocapitalize", "autocomplete", "autocorrect"].forEach(a => ta.setAttribute(a, "off"));
    ta.setAttribute("aria-label", "SQL eingeben");
    ta.placeholder = opt.platzhalter || "SELECT …";
    const passen = () => { ta.style.height = "auto"; ta.style.height = Math.min(Math.max(ta.scrollHeight + 2, 130), 420) + "px"; };
    ta.addEventListener("input", () => { passen(); beiAenderung && beiAenderung(ta.value); });
    ta.addEventListener("keydown", ev => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); ausfuehrenFn && ausfuehrenFn(); }
      if (ev.key === "Tab" && !ev.shiftKey) { ev.preventDefault(); einfuegen(ta, "  ", beiAenderung); }
    });
    const leiste = el("div", "sq-tasten");
    const namen = [];
    let db = null;
    try { db = neueDb(null, opt.db); tabellen(db).forEach(t => namen.push(opt.praefix ? opt.praefix + t : t)); } finally { if (db) db.close(); }
    (opt.tasten || TASTEN).concat(namen).forEach(t => {
      const b = el("button", "sq-taste" + (namen.indexOf(t) >= 0 ? " tab" : ""), t); b.type = "button";
      b.addEventListener("mousedown", ev => ev.preventDefault());
      b.onclick = () => einfuegen(ta, t, beiAenderung);
      leiste.appendChild(b);
    });
    w.append(ta, leiste);
    setTimeout(passen, 0);
    w.ta = ta;
    return w;
  }
  function einfuegen(ta, t, beiAenderung) {
    const a = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    const vor = v.slice(0, a), nach = v.slice(e);
    const eng = /^[,;()'*=]$|^<>$/.test(t) || /[(%]$/.test(t);
    let ein = t;
    if (!eng && vor && !/[\s(]$/.test(vor)) ein = " " + ein;
    if (!/[(%']$/.test(t) && t !== "'" && !/^\s/.test(nach)) ein += " ";
    if (t === "LIKE '%") ein = (vor && !/\s$/.test(vor) ? " " : "") + "LIKE '%%'";
    ta.value = vor + ein + nach;
    let p = (vor + ein).length;
    if (t === "LIKE '%") p -= 2;
    ta.focus();
    ta.setSelectionRange(p, p);
    ta.dispatchEvent(new Event("input"));
    beiAenderung && beiAenderung(ta.value);
  }

  function laufZeigen(ziel, lauf, a) {
    ziel.innerHTML = "";
    lauf.notizen.forEach(n => ziel.appendChild(el("p", "sq-notiz", n)));
    if (lauf.fehler) {
      const f = el("div", "sq-meldung falsch");
      f.appendChild(el("b", null, "Fehler" + (lauf.schritte.length || lauf.fehler.nr > 1 ? " in Anweisung " + lauf.fehler.nr : "")));
      f.appendChild(el("p", null, lauf.fehler.text));
      if (lauf.fehler.roh && lauf.fehler.roh !== lauf.fehler.text) f.appendChild(el("p", "sq-roh", lauf.fehler.roh));
      ziel.appendChild(f);
    }
    lauf.schritte.forEach(s => {
      if (s.dcl) ziel.appendChild(el("p", "sq-notiz ok", "Anweisung " + s.nr + ": " + dclBeschreiben(s.dcl) + " — Schreibweise erkannt, nicht ausgeführt."));
      if (s.geaendert != null) ziel.appendChild(el("p", "sq-notiz ok", "Anweisung " + s.nr + ": " + s.geaendert + (s.geaendert === 1 ? " Zeile" : " Zeilen") + " betroffen."));
    });
    const nurRechte = lauf.schritte.length && lauf.schritte.every(s => s.dcl);
    if (lauf.letztes) ziel.appendChild(ergebnisTabelle(lauf.letztes));
    else if (!lauf.fehler && a && a.art === "dml") {
      const t = (/^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+[`"]?(\w+)/i.exec(lauf.schritte.length ? lauf.schritte[lauf.schritte.length - 1].sql : "") || [])[1];
      if (t) ziel.appendChild(el("p", "sq-klein", "Tabelle " + t + " nach deiner Änderung:"));
      if (t && lauf.tabelleDanach) ziel.appendChild(ergebnisTabelle(lauf.tabelleDanach));
    } else if (!lauf.fehler && lauf.aufbau) {
      ziel.appendChild(el("p", "sq-klein", "Aufbau von " + lauf.aufbau.name + ":"));
      ziel.appendChild(ergebnisTabelle(lauf.aufbau.r));
    } else if (!lauf.fehler && !nurRechte) ziel.appendChild(el("p", "sq-notiz ok", "Ausgeführt."));
  }

  /** Ausführen (ohne Bewertung) — auf frischen Daten, zeigt Ergebnis bzw. geänderte Tabelle */
  function probelauf(a, code) {
    const db = dbFuer(a);
    try {
      const lauf = ausfuehren(db, code);
      if (!lauf.fehler && !lauf.letztes && lauf.schritte.length) {
        const letzt = lauf.schritte[lauf.schritte.length - 1].sql;
        const m = /^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+[`"]?(\w+)/i.exec(letzt);
        if (m) { const x = ausfuehren(db, "SELECT * FROM " + q(m[1])); lauf.tabelleDanach = x.letztes; }
        const c = /^\s*(?:CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?|ALTER\s+TABLE)\s+[`"]?(\w+)/i.exec(letzt);
        if (c) {
          const t = tabelleFinden(db, c[1], "table");
          if (t) {
            const fks = fkVon(db, t).concat(lauf.fk.filter(f => f.tabelle.toLowerCase() === t.toLowerCase()));
            lauf.aufbau = { name: t, r: { spalten: ["Spalte", "Datentyp", "Schlüssel", "NOT NULL"],
              zeilen: spaltenVon(db, t).map(s => {
                const fk = fks.find(f => f.von.toLowerCase() === s.name.toLowerCase());
                return [s.name, s.typ || "—", [s.pk ? "PK" : "", fk ? "FK → " + fk.zu : ""].filter(Boolean).join(", ") || "", s.notnull ? "ja" : ""];
              }) } };
          }
        }
        const v = /^\s*CREATE\s+VIEW\s+[`"]?(\w+)/i.exec(letzt);
        if (v) { const x = ausfuehren(db, "SELECT * FROM " + q(v[1])); lauf.letztes = x.letztes; }
      }
      return lauf;
    } finally { db.close(); }
  }

  /* ----------------------------------------------------------- Aufgabe --- */
  function navLeiste(A, i) {
    const nav = el("div", "sq-nav");
    const zur = el("button", "sq-mini", "‹ Alle Aufgaben"); zur.type = "button"; zur.onclick = () => { UI.ansicht = "liste"; zeichnen(); };
    const pos = el("span", "sq-klein", "Aufgabe " + (i + 1) + " von " + A.length);
    const vor = el("button", "sq-mini", "‹"); vor.type = "button"; vor.disabled = i === 0; vor.setAttribute("aria-label", "vorherige Aufgabe");
    vor.onclick = () => { UI.id = A[i - 1].id; zeichnen(); root.scrollTo(0, 0); };
    const nach = el("button", "sq-mini", "›"); nach.type = "button"; nach.disabled = i === A.length - 1; nach.setAttribute("aria-label", "nächste Aufgabe");
    nach.onclick = () => { UI.id = A[i + 1].id; zeichnen(); root.scrollTo(0, 0); };
    const rechts = el("span", "sq-nav-r"); rechts.append(pos, vor, nach);
    nav.append(zur, rechts);
    return nav;
  }
  function kopfZeile(a, e) {
    const D = daten();
    const kopf = el("div", "sq-a-kopf");
    kopf.appendChild(el("span", "sq-marke", (D.THEMEN.find(t => t.key === a.thema) || {}).name || ""));
    if (a.db && a.db !== "shop") kopf.appendChild(el("span", "sq-marke db", datenbank(a.db).titel));
    if (a.art === "muster") kopf.appendChild(el("span", "sq-marke muster", "Prüfung nach Muster"));
    kopf.appendChild(el("span", "sq-stufe s" + a.stufe, "●".repeat(a.stufe)));
    if (e.ok) kopf.appendChild(el("span", "sq-marke ok", "✓ gelöst"));
    return kopf;
  }
  function aufgabeZeichnen(box) {
    const A = liste();
    const i = Math.max(0, A.findIndex(x => x.id === UI.id));
    const a = A[i];
    UI.id = a.id;
    stand().pos = a.id; merken();
    box.appendChild(navLeiste(A, i));
    if (a.art === "vorhersage") { vorhersageZeichnen(box, a); return; }
    const e = eintrag(a.id);
    const muster = a.art === "muster";

    const k = el("div", "sq-karte sq-aufgabe");
    const kopf = kopfZeile(a, e);
    k.appendChild(kopf);
    k.appendChild(el("h2", null, a.titel));
    k.appendChild(el("p", "sq-text", a.text));
    if (a.hinweis) { const h = el("p", "sq-hinweis"); h.appendChild(el("b", null, "Hinweis: ")); h.appendChild(document.createTextNode(a.hinweis)); k.appendChild(h); }
    if (a.jetzt) k.appendChild(el("p", "sq-klein", "Für diese Aufgabe gilt NOW() = " + jetztDeutsch(a.jetzt) + " (fester Zeitpunkt, damit das Ergebnis gleich bleibt)."));
    const bsp = beispielVon(a);
    if (bsp) k.appendChild(beispielKasten(bsp));
    if (muster) {
      const m = el("div", "sq-muster-info");
      m.appendChild(el("p", null, "SQLite kennt keine Benutzer und Rechte. Deine Anweisungen werden nicht ausgeführt, sondern mit dem Muster verglichen. Groß-/Kleinschreibung, Anführungszeichen, eine Host-Angabe (@…) und die Reihenfolge der Rechte sind egal."));
      m.appendChild(el("p", "sq-ru", "Проверка по образцу, без выполнения: команда разбирается по словам и сравнивается с эталоном."));
      k.appendChild(m);
    }
    if (a.vorher) k.appendChild(el("p", "sq-klein", "Vorher ausgeführt: " + a.vorher));
    k.appendChild(schemaKasten(false, a.db));
    k.appendChild(beiblattKasten());
    box.appendChild(k);

    const ausgabe = el("div", "sq-ausgabe");
    const urteil = el("div", "sq-urteil");
    const ed = editor(e.code || "", v => { const x = eintrag(a.id); x.code = v; x.t = Date.now(); merken(); }, () => (muster ? pruefenKnopf : ausfuehrenKnopf).click(),
      { db: a.db, tasten: tastenFuer(a), praefix: muster ? "service." : "", platzhalter: muster ? "CREATE USER … / GRANT … / REVOKE …" : "SELECT …" });
    const knoepfe = el("div", "sq-knoepfe");
    const ausfuehrenKnopf = el("button", "btn", "▶ Ausführen"); ausfuehrenKnopf.type = "button";
    const pruefenKnopf = el("button", "btn primary", muster ? "Nach Muster prüfen" : "Prüfen"); pruefenKnopf.type = "button";
    const tipp = el("button", "sq-mini", "Tipp"); tipp.type = "button";
    const loes = el("button", "sq-mini", "Lösung"); loes.type = "button";
    if (muster) knoepfe.append(pruefenKnopf, tipp, loes);
    else knoepfe.append(ausfuehrenKnopf, pruefenKnopf, tipp, loes);

    const namen = () => { const d = dbFuer(a); try { const t = tabellen(d); return t.concat(...t.map(x => spaltenVon(d, x).map(s => s.name))); } finally { d.close(); } };
    const warnZeigen = (ziel, code) => warnungen(code, namen()).forEach(w => ziel.appendChild(el("p", "sq-notiz warn", w)));

    ausfuehrenKnopf.onclick = () => {
      urteil.innerHTML = "";
      const lauf = probelauf(a, ed.ta.value);
      laufZeigen(ausgabe, lauf, a);
      if (!lauf.fehler) warnZeigen(ausgabe, ed.ta.value);
    };
    pruefenKnopf.onclick = () => {
      const r = pruefen(a, ed.ta.value);
      urteilZeigen(urteil, r, a);
      if (!muster) {
        const l = probelauf(a, ed.ta.value);
        laufZeigen(ausgabe, l, a);
        if (!l.fehler) warnZeigen(ausgabe, ed.ta.value);
      }
      if (r.ok) {
        const n = naechste(a.id);
        const w = el("div", "sq-weiter");
        const nb = el("button", "btn primary", n === a.id ? "Alle gelöst — zur Liste" : "Nächste Aufgabe →"); nb.type = "button";
        nb.onclick = () => { if (n === a.id) UI.ansicht = "liste"; else UI.id = n; zeichnen(); root.scrollTo(0, 0); };
        w.appendChild(nb);
        urteil.appendChild(w);
        kopf.querySelector(".sq-marke.ok") || kopf.appendChild(el("span", "sq-marke ok", "✓ gelöst"));
      }
      urteil.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    tipp.onclick = () => {
      if (urteil.querySelector(".sq-tipp")) return;
      hilfeMerken(a.id, "hilfe");
      urteil.prepend(el("p", "sq-tipp", "Tipp: " + a.tipp));
    };
    loes.onclick = () => {
      if (urteil.querySelector(".sq-loesung")) return;
      hilfeMerken(a.id, "loesung");
      const d = el("div", "sq-loesung");
      d.appendChild(el("b", null, "Musterlösung"));
      d.appendChild(el("pre", null, a.loesung));
      d.appendChild(el("p", "sq-ru", a.ru));
      const ueb = el("button", "sq-mini", "In den Editor übernehmen"); ueb.type = "button";
      ueb.onclick = () => { ed.ta.value = a.loesung; ed.ta.dispatchEvent(new Event("input")); ed.ta.focus(); };
      d.appendChild(ueb);
      urteil.appendChild(d);
    };

    const arbeit = el("div", "sq-karte sq-arbeit");
    arbeit.append(ed, knoepfe, urteil, ausgabe);
    arbeit.appendChild(el("p", "sq-klein", muster
      ? "Strg+Enter = nach Muster prüfen. Mehrere Anweisungen mit ; trennen."
      : "Jede Ausführung startet mit frischen Daten — du kannst nichts kaputt machen. Strg+Enter = Ausführen."));
    box.appendChild(arbeit);
  }

  function supportHinweis(support) {
    return support === "selbst" ? "Самостоятельная попытка. Результат проверен на учебной базе данных." :
      support === "loesung" ? "Решение уже было показано. Это практика с решением; проверь себя на другом задании." :
        "Использована подсказка или предыдущая обратная связь. Проверь себя на другом задании без помощи.";
  }
  function urteilZeigen(ziel, r, a) {
    ziel.querySelectorAll(".sq-meldung, .sq-weiter").forEach(x => x.remove());
    const m = el("div", "sq-meldung " + (r.ok ? "richtig" : "falsch"));
    m.appendChild(el("b", null, r.ok ? "✓ " + r.text : r.text));
    if (r.muster) m.appendChild(el("p", "sq-klein", "Prüfung nach Muster, ohne Ausführung — SQLite kennt keine Benutzer."));
    if (r.support) m.appendChild(el("p", "sq-ru", supportHinweis(r.support)));
    const zeilen = (titel, liste) => {
      if (!liste || !liste.length) return;
      m.appendChild(el("p", "sq-klein", titel));
      const ul = el("ul", "sq-diff");
      liste.forEach(z => ul.appendChild(el("li", null, zeigeZeile(z))));
      m.appendChild(ul);
    };
    zeilen("Fehlt bei dir (Musterlösung hat diese Zeile):", r.fehlt);
    zeilen("Zu viel bzw. anders bei dir:", r.zuviel);
    (r.teile || []).forEach(t => {
      m.appendChild(el("p", null, t.text));
      if (t.spalten && t.fehlt && t.fehlt.length) { m.appendChild(el("p", "sq-klein", "erwartet (" + t.spalten.join(" | ") + "):")); const ul = el("ul", "sq-diff"); t.fehlt.forEach(z => ul.appendChild(el("li", null, zeigeZeile(z)))); m.appendChild(ul); }
      if (t.zuviel && t.zuviel.length) { m.appendChild(el("p", "sq-klein", "bei dir:")); const ul = el("ul", "sq-diff"); t.zuviel.forEach(z => ul.appendChild(el("li", null, zeigeZeile(z)))); m.appendChild(ul); }
    });
    if (r.punkte && r.punkte.length) {
      const ul = el("ul", "sq-punkte");
      r.punkte.forEach(p => ul.appendChild(el("li", p.ok ? "ok" : p.info ? "info" : "nein", p.text)));
      m.appendChild(ul);
    }
    if (r.ok && a && a.ru) m.appendChild(el("p", "sq-ru", a.ru));
    ziel.appendChild(m);
  }

  /* -------------------------------------------- Ergebnis vorhersagen --- */
  function vorhersageZeichnen(box, a) {
    const e = eintrag(a.id);
    const k = el("div", "sq-karte sq-aufgabe sq-vh");
    k.appendChild(kopfZeile(a, e));
    k.appendChild(el("h2", null, a.titel));
    k.appendChild(el("p", "sq-text", a.text));
    k.appendChild(el("p", "sq-ru", a.frage === "wahl" ? "Прочитай запрос и данные, мысленно выполни его и выбери итоговую таблицу." : "Прочитай запрос и данные, мысленно выполни его и впиши ответ."));
    const code = el("pre", "sq-code"); code.textContent = a.loesung; k.appendChild(code);
    const dat = el("div", "sq-vh-daten");
    vorhersageDaten(a).forEach(d => {
      const w = el("div", "sq-vh-tab");
      w.appendChild(el("p", "sq-vh-name", d.titel));
      w.appendChild(ergebnisTabelle(d.r, null, { ohneFuss: true }));
      dat.appendChild(w);
    });
    k.appendChild(dat);
    box.appendChild(k);

    const arbeit = el("div", "sq-karte sq-arbeit");
    const pruefKnopf = el("button", "btn primary", "Antwort prüfen"); pruefKnopf.type = "button"; pruefKnopf.disabled = true;
    const tipp = el("button", "sq-mini", "Tipp"); tipp.type = "button";
    const loes = el("button", "sq-mini", "Lösung"); loes.type = "button";
    const urteil = el("div", "sq-urteil"), ausgabe = el("div", "sq-ausgabe");
    let wahl = null, fertig = false, eingabe = null;
    const optionen = [];
    if (a.frage === "wahl") {
      const frage = el("p", "sq-frage", "Welche Tabelle ist das Ergebnis? Tippe eine Antwort an.");
      frage.id = "sqVhFrage";
      arbeit.appendChild(frage);
      const gruppe = el("div", "sq-optionen");
      gruppe.setAttribute("role", "radiogroup");
      gruppe.setAttribute("aria-labelledby", "sqVhFrage");
      vhOptionen(a).forEach((o, j) => {
        const b = el("div", "sq-option");
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", "false");
        b.tabIndex = j === 0 ? 0 : -1;
        b.appendChild(el("span", "sq-opt-kopf", "Antwort " + BUCHST[j]));
        b.appendChild(ergebnisTabelle(o, null, { ohneFuss: true }));
        const waehlen = () => {
          if (fertig) return;
          wahl = j;
          optionen.forEach((x, n) => { x.classList.toggle("gewaehlt", n === j); x.setAttribute("aria-checked", n === j ? "true" : "false"); x.tabIndex = n === j ? 0 : -1; });
          pruefKnopf.disabled = false;
        };
        b.addEventListener("click", waehlen);
        b.addEventListener("keydown", ev => {
          if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); waehlen(); }
          else if (/^Arrow(Down|Right|Up|Left)$/.test(ev.key)) {
            ev.preventDefault();
            const n = (j + (/Down|Right/.test(ev.key) ? 1 : -1) + optionen.length) % optionen.length;
            optionen[n].focus();
          }
        });
        optionen.push(b);
        gruppe.appendChild(b);
      });
      arbeit.appendChild(gruppe);
    } else {
      const lab = el("label", "sq-frage", a.frage === "zeilen" ? "Wie viele Zeilen hat das Ergebnis?" : "Welcher Wert steht im Ergebnis?");
      eingabe = el("input", "sq-eingabe");
      eingabe.id = "sqVhEingabe"; lab.htmlFor = eingabe.id;
      eingabe.type = "text";
      eingabe.inputMode = a.frage === "zeilen" ? "numeric" : "text";
      ["autocapitalize", "autocomplete", "autocorrect"].forEach(x => eingabe.setAttribute(x, "off"));
      eingabe.spellcheck = false;
      eingabe.addEventListener("input", () => { if (!fertig) pruefKnopf.disabled = !eingabe.value.trim(); });
      eingabe.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); if (!pruefKnopf.disabled) pruefKnopf.click(); } });
      arbeit.append(lab, eingabe);
    }
    const knoepfe = el("div", "sq-knoepfe");
    knoepfe.append(pruefKnopf, tipp, loes);
    arbeit.append(knoepfe, urteil, ausgabe);
    box.appendChild(arbeit);

    const kontrolle = () => {
      const c = el("button", "sq-mini", "Abfrage zur Kontrolle ausführen"); c.type = "button";
      c.onclick = () => {
        const db = dbFuer(a);
        try { laufZeigen(ausgabe, ausfuehren(db, a.loesung), a); } finally { db.close(); }
        c.disabled = true;
      };
      return c;
    };
    pruefKnopf.onclick = () => {
      if (fertig || (a.frage === "wahl" && wahl == null) || (eingabe && !eingabe.value.trim())) return;
      const r = vorhersagePruefen(a, a.frage === "wahl" ? { wahl } : { wert: eingabe.value });
      fertig = true; pruefKnopf.disabled = true;
      if (a.frage === "wahl") optionen.forEach((x, n) => {
        x.classList.add("fest");
        x.setAttribute("aria-disabled", "true");
        if (n === r.soll) x.classList.add("richtig");
        else if (n === wahl) x.classList.add("falsch");
      });
      else eingabe.readOnly = true;
      urteil.querySelectorAll(".sq-meldung, .sq-weiter").forEach(x => x.remove());
      const m = el("div", "sq-meldung " + (r.ok ? "richtig" : "falsch"));
      m.appendChild(el("b", null, r.ok ? "✓ Richtig!" : "Leider falsch."));
      m.appendChild(el("p", null, r.text));
      m.appendChild(el("p", "sq-ru", a.ru));
      m.appendChild(el("p", "sq-ru", (a.frage === "wahl" ? "Выбор из вариантов — это узнавание, а не написание запроса. " : "") + supportHinweis(r.support)));
      m.appendChild(kontrolle());
      urteil.appendChild(m);
      const A = liste().filter(x => x.art === "vorhersage");
      const nx = A[A.indexOf(a) + 1];
      const w = el("div", "sq-weiter");
      const nb = el("button", "btn primary", nx ? "Nächste Vorhersage →" : "Zur Liste"); nb.type = "button";
      nb.onclick = () => { if (nx) UI.id = nx.id; else UI.ansicht = "liste"; zeichnen(); root.scrollTo(0, 0); };
      w.appendChild(nb);
      urteil.appendChild(w);
      if (r.ok) { const kopf = box.querySelector(".sq-a-kopf"); if (kopf && !kopf.querySelector(".sq-marke.ok")) kopf.appendChild(el("span", "sq-marke ok", "✓ gelöst")); }
      urteil.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    tipp.onclick = () => {
      if (urteil.querySelector(".sq-tipp")) return;
      hilfeMerken(a.id, "hilfe");
      urteil.prepend(el("p", "sq-tipp", "Tipp: " + a.tipp));
    };
    loes.onclick = () => {
      if (urteil.querySelector(".sq-loesung")) return;
      hilfeMerken(a.id, "loesung");
      const soll = vorhersageSoll(a);
      const d = el("div", "sq-loesung");
      d.appendChild(el("b", null, "Lösung"));
      d.appendChild(el("p", null, a.frage === "wahl" ? "Richtig ist Antwort " + BUCHST[soll] + "." :
        a.frage === "zeilen" ? "Die Abfrage liefert " + soll + (soll === 1 ? " Zeile." : " Zeilen.") : "Die Abfrage liefert: " + anzeigeWert(soll)));
      d.appendChild(el("p", "sq-ru", a.ru));
      d.appendChild(kontrolle());
      urteil.appendChild(d);
    };
  }

  /* ---------------------------------------------------- Freies Üben --- */
  let FREI_DB = null, FREI_NAME = null;
  function freiZeichnen(box) {
    const D = daten();
    const nav = el("div", "sq-nav");
    const zur = el("button", "sq-mini", "‹ Alle Aufgaben"); zur.type = "button"; zur.onclick = () => { UI.ansicht = "liste"; zeichnen(); };
    nav.appendChild(zur);
    box.appendChild(nav);
    const namen = Object.keys(D.DBS || { shop: 1 });
    let aktuell = stand().freiDb;
    if (namen.indexOf(aktuell) < 0) aktuell = "shop";
    const k = el("div", "sq-karte");
    k.appendChild(el("h2", null, "Freies SQL"));
    k.appendChild(el("p", "sq-info", "Alles ausprobieren, was du willst. Änderungen bleiben erhalten, bis du die Datenbank zurücksetzt oder wechselst."));
    const wahl = el("div", "sq-chips sq-db-wahl");
    wahl.setAttribute("role", "group");
    wahl.setAttribute("aria-label", "Datenbank wählen");
    namen.forEach(n => {
      const c = el("button", "sq-chip" + (n === aktuell ? " an" : ""), datenbank(n).titel); c.type = "button";
      c.setAttribute("aria-pressed", n === aktuell ? "true" : "false");
      c.onclick = () => { if (n === aktuell) return; stand().freiDb = n; merken(true); zeichnen(); };
      wahl.appendChild(c);
    });
    k.appendChild(wahl);
    k.appendChild(schemaKasten(false, aktuell));
    k.appendChild(beiblattKasten());
    box.appendChild(k);
    if (!FREI_DB || FREI_NAME !== aktuell) {
      try { if (FREI_DB) FREI_DB.close(); } catch (e) { }
      FREI_DB = neueDb(null, aktuell); FREI_NAME = aktuell;
    }
    /* Entwurf je Datenbank; der Online-Shop behält den alten Schlüssel „frei“ */
    const start = { shop: "SELECT * FROM Kunde;", service: "SELECT * FROM Ticket;", mini: "SELECT * FROM Person;" };
    const entwurf = aktuell === "shop" ? stand().frei : (stand().freiTexte || {})[aktuell];
    const entwurfMerken = v => {
      if (aktuell === "shop") stand().frei = v;
      else { if (!stand().freiTexte || typeof stand().freiTexte !== "object") stand().freiTexte = {}; stand().freiTexte[aktuell] = v; }
      merken();
    };
    const ausgabe = el("div", "sq-ausgabe");
    const ed = editor(entwurf || start[aktuell] || "", entwurfMerken, () => los.click(), { db: aktuell, tasten: tastenFuer(null) });
    const knoepfe = el("div", "sq-knoepfe");
    const los = el("button", "btn primary", "▶ Ausführen"); los.type = "button";
    const neu = el("button", "sq-mini", "Datenbank zurücksetzen"); neu.type = "button";
    knoepfe.append(los, neu);
    los.onclick = () => {
      const lauf = ausfuehren(FREI_DB, ed.ta.value);
      laufZeigen(ausgabe, lauf, null);
      if (!lauf.fehler) warnungen(ed.ta.value, tabellen(FREI_DB)).forEach(w => ausgabe.appendChild(el("p", "sq-notiz warn", w)));
    };
    neu.onclick = () => { try { FREI_DB.close(); } catch (e) { } FREI_DB = neueDb(null, aktuell); ausgabe.innerHTML = ""; ausgabe.appendChild(el("p", "sq-notiz ok", "Datenbank ist wieder im Ausgangszustand.")); };
    const arbeit = el("div", "sq-karte sq-arbeit");
    arbeit.append(ed, knoepfe, ausgabe);
    box.appendChild(arbeit);
  }

  /* -------------------------------------------------------- Startseite --- */
  function block() {
    const s = $("scStart");
    if (!s || !daten()) return;
    let b = $("sqlBox");
    if (!b) { b = el("div", "abschnitt"); b.id = "sqlBox"; s.appendChild(b); }
    b.innerHTML = "";
    b.appendChild(el("h2", null, "SQL-Trainer (AP2)"));
    const Z = zahlen();
    b.appendChild(el("p", null, Z.gesamt + " Aufgaben im IHK-Stil an echten Datenbanken: SELECT, JOIN, GROUP BY, UNION, Unterabfragen, Text- und Datumsfunktionen laut Beiblatt, INSERT/UPDATE/DELETE, CREATE TABLE, Rechte (GRANT/REVOKE). " +
      "Dein SQL wird ausgeführt und mit der Musterlösung verglichen. Dazu " + Z.vorhersage.gesamt + " Aufgaben „Ergebnis vorhersagen“."));
    const st = el("div", "steuer");
    const o = el("button", "btn primary", Z.geloest ? "Weiter üben (" + Z.geloest + "/" + Z.gesamt + ")" : "SQL-Trainer öffnen"); o.type = "button";
    o.onclick = () => oeffnen(Z.geloest ? { weiter: true } : {});
    const l = el("button", "btn", "Alle Aufgaben"); l.type = "button"; l.onclick = () => oeffnen();
    const v = el("button", "btn", "Ergebnis vorhersagen"); v.type = "button"; v.onclick = () => oeffnen({ vorhersage: true });
    st.append(o, l, v);
    b.appendChild(st);
    const d = document.querySelector('details.st-block[data-key="sql"] .st-zahl');
    if (d) d.textContent = Z.geloest + "/" + Z.gesamt;
  }

  /* -------------------------------------------------------- Einhängen --- */
  function einhaengen() {
    const altStart = root.renderStart;
    if (typeof altStart === "function" && !altStart.__sq) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { block(); } catch (e) { console.error("SQL:", e); }
        return r;
      };
      neu.__sq = true; root.renderStart = neu;
    }
    const altSchirm = root.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__sq) {
      const neu = function (name) {
        if (name === "scSql") { oeffnen({ bleiben: true }); return; }
        const s = $("scSql"); if (s) s.hidden = true;
        return altSchirm.apply(this, arguments);
      };
      neu.__sq = true; root.schirm = neu;
    }
    if (root.MutationObserver) {
      new MutationObserver(muts => {
        const k = $("scSql");
        if (!k || k.hidden) return;
        for (const m of muts) {
          const z = m.target;
          if (z !== k && z.id && /^sc/.test(z.id) && z.classList &&
              (z.classList.contains("seite") || z.classList.contains("blatt")) && !z.hidden) { k.hidden = true; return; }
        }
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    }
    try { block(); } catch (e) { console.error("SQL:", e); }
  }

  const api = { laden, setzeSQL, zerlege, vorbereiten, fehlerText, warnungen, gruppenWarnung, neueDb, ausfuehren,
    vergleiche, vergleicheStand, pruefeAufbau, bewerte, loesungLauf, probelauf, normWert, familie, schnappschuss,
    oeffnen, block, zahlen, pruefen, hilfeMerken,
    datumsteilQuoten, alterAufteilen, dclLesen, musterPruefen, vorhersagePruefen, vorhersageSoll, vorhersageDaten,
    tabelleGleich, eingabeNorm, liste, datenbank, beispielVon, naechste,
    get UI() { return UI; } };
  root.GENSQL = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }
})(typeof window !== "undefined" ? window : globalThis);
