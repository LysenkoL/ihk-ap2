"use strict";

/* SQL-Trainer (gen/sql.js): jede Musterlösung besteht, gleichwertige
   Schreibweisen bestehen auch, typische Fehler werden erkannt und auf
   Deutsch erklärt. Dazu: Funktionen laut SQL-Beiblatt (Stand 2024-10-07),
   Prüfung nach Muster für CREATE USER/GRANT/REVOKE und „Ergebnis
   vorhersagen“ (genau eine Antwort passt — die echte Ausführung).        */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const LIB = path.join(root, "vendor", "sqljs-1.14.2");
const initSqlJs = require(path.join(LIB, "sql-wasm.js"));
const S = require(path.join(root, "gen", "sql.js"));
const D = require(path.join(root, "gen", "sql-daten.js"));

initSqlJs({ locateFile: f => path.join(LIB, f) }).then(SQL => {
  S.setzeSQL(SQL);
  const A = id => { const a = D.AUFGABEN.find(x => x.id === id); assert(a, "Aufgabe " + id); return a; };
  const ok = (id, code, msg) => { const r = S.bewerte(A(id), code); assert(r.ok, (msg || id) + ": " + r.text + (r.punkte ? " " + JSON.stringify(r.punkte) : "")); return r; };
  const nein = (id, code, rx) => { const r = S.bewerte(A(id), code); assert(!r.ok, id + " sollte falsch sein: " + code); if (rx) assert(rx.test(r.text + JSON.stringify(r.punkte || r.teile || "")), id + ": " + r.text + " " + JSON.stringify(r.punkte || "")); return r; };
  /* Ein Wert aus einer frischen Datenbank (name: shop | service | mini) */
  const wert = (sql, name) => { const d = S.neueDb(null, name); try { const l = S.ausfuehren(d, sql); assert(!l.fehler, sql + " → " + (l.fehler && l.fehler.roh + " / " + l.fehler.text)); return l.letztes.zeilen[0][0]; } finally { d.close(); } };
  const zeilen = (sql, name) => { const d = S.neueDb(null, name); try { const l = S.ausfuehren(d, sql); assert(!l.fehler, sql + " → " + (l.fehler && l.fehler.roh)); return l.letztes.zeilen; } finally { d.close(); } };
  const fehler = (sql, name) => { const d = S.neueDb(null, name); try { const l = S.ausfuehren(d, sql); assert(l.fehler, "sollte scheitern: " + sql); return l.fehler.text; } finally { d.close(); } };
  const nah = (x, y, msg) => assert(Math.abs(x - y) < 1e-9, (msg || "") + " " + x + " ≠ " + y);

  /* ---------------------------------------------------- Daten und Aufgaben */
  const ids = new Set();
  const artBekannt = ["select", "dml", "ddl", "view", "muster", "vorhersage", "index"];
  D.AUFGABEN.forEach(a => {
    assert(!ids.has(a.id), "doppelt: " + a.id); ids.add(a.id);
    assert(D.THEMEN.some(t => t.key === a.thema), a.id + " Thema");
    assert(artBekannt.indexOf(a.art || "select") >= 0, a.id + " Art");
    assert(!a.db || D.DBS[a.db], a.id + " Datenbank " + a.db);
    assert(a.text && a.loesung && a.tipp && a.ru, a.id + " unvollständig");
    assert([1, 2, 3].indexOf(a.stufe) >= 0, a.id + " Stufe");
    if (a.art === "muster") return;
    const l = S.loesungLauf(a);
    assert(!l.lauf.fehler, a.id + " Musterlösung: " + (l.lauf.fehler && l.lauf.fehler.roh));
    if (["select", "vorhersage"].indexOf(a.art || "select") >= 0) assert(l.lauf.letztes && l.lauf.letztes.zeilen.length, a.id + " leeres Ergebnis");
    if (a.art !== "vorhersage") ok(a.id, a.loesung, a.id + " Musterlösung gegen sich selbst");
  });
  assert(D.AUFGABEN.length >= 35);
  const neu = D.AUFGABEN.filter(a => /^[nr]\d+$/.test(a.id)), vh = D.AUFGABEN.filter(a => a.art === "vorhersage");
  assert(neu.length >= 12, "mindestens 12 neue Aufgaben nach dem Beiblatt");
  assert(vh.length >= 6 && vh.length <= 10, "6–10 Aufgaben „Ergebnis vorhersagen“");
  ["mengen", "text", "rechte", "vorhersage"].forEach(k => assert(D.AUFGABEN.some(a => a.thema === k), "Thema " + k + " belegt"));
  Object.keys(D.DBS).forEach(n => {
    const d = S.neueDb(null, n);
    try { Object.keys(D.DBS[n].TABELLEN).forEach(t => assert(d.exec("SELECT COUNT(*) FROM " + t)[0].values[0][0] > 0, n + "." + t + " leer")); }
    finally { d.close(); }
  });

  /* Sortier-Aufgaben: keine Gleichstände, sonst wäre die Reihenfolge nicht eindeutig */
  D.AUFGABEN.filter(a => a.ordnung && a.art !== "vorhersage").forEach(a => {
    const z = S.loesungLauf(a).lauf.letztes.zeilen.map(r => JSON.stringify(r));
    assert.strictEqual(new Set(z).size, z.length, a.id);
  });

  /* Liste, Navigation und Zähler folgen der Reihenfolge der Themen */
  const L = S.liste();
  assert.strictEqual(L.length, D.AUFGABEN.length);
  const rang = a => D.THEMEN.findIndex(t => t.key === a.thema);
  L.forEach((a, i) => { if (i) assert(rang(L[i - 1]) <= rang(a), "Reihenfolge " + a.id); });
  const Z = S.zahlen();
  assert.strictEqual(Z.gesamt + Z.vorhersage.gesamt, D.AUFGABEN.length);
  assert.strictEqual(Z.vorhersage.gesamt, vh.length);
  assert.strictEqual(A(S.naechste(null, "vorhersage")).art, "vorhersage");

  /* Ergebnisbeispiel: Auszug der echten Musterlösung, nie das ganze Ergebnis */
  D.AUFGABEN.filter(a => a.beispiel).forEach(a => {
    const b = S.beispielVon(a);
    assert(b && b.spalten.length, a.id + " Beispiel");
    assert(b.zeilen.length < b.gesamt, a.id + " Beispiel verrät nicht alles");
    const quelle = typeof a.beispiel === "object" && a.beispiel.sql ? null : S.loesungLauf(a).lauf.letztes;
    if (quelle) {
      assert.deepStrictEqual(b.spalten, quelle.spalten, a.id + " Spaltenköpfe wie Musterlösung");
      b.zeilen.forEach((z, i) => assert.deepStrictEqual(z, quelle.zeilen[i], a.id + " Beispielzeile " + i));
    }
  });

  /* ------------------------------------------------- Gleichwertige Schreibweisen */
  ok("g1", "select ort, name, vorname from kunde", "Spaltenreihenfolge egal");
  ok("g3", "SELECT CONCAT(Vorname, ' ', Name) FROM Mitarbeiter", "CONCAT");
  ok("g4", "SELECT Name, IFNULL(Firma, 'privat') FROM Kunde");
  ok("w6", "SELECT BestellNr, Datum FROM Bestellung WHERE YEAR(Datum) = 2025", "YEAR()");
  ok("w6", "SELECT BestellNr, Datum FROM Bestellung WHERE Datum >= '2025-01-01' AND Datum < '2026-01-01'");
  ok("j5", "SELECT KundenNr, Name FROM Kunde k WHERE NOT EXISTS (SELECT * FROM Bestellung b WHERE b.KundenNr = k.KundenNr)", "NOT EXISTS");
  ok("j5", "SELECT KundenNr, Name FROM Kunde WHERE KundenNr NOT IN (SELECT KundenNr FROM Bestellung);");
  ok("j5", "SELECT k.KundenNr, k.Name FROM Bestellung b RIGHT JOIN Kunde k ON k.KundenNr = b.KundenNr WHERE b.BestellNr IS NULL", "RIGHT JOIN");
  ok("a3", "SELECT MIN(Preis), MAX(Preis), ROUND(AVG(Preis), 2) FROM Artikel", "gerundet");
  ok("d2", "UPDATE Artikel SET Preis = ROUND(Preis * 1.05, 2) WHERE KategorieNr = 3;");
  ok("d1", "INSERT INTO Kunde VALUES (11, NULL, 'Klein', 'Emma', '50672', 'Köln', 'emma.klein@posteo.de', '2026-09-30')");
  ok("c1", "CREATE TABLE lieferant (LieferantNr INT AUTO_INCREMENT PRIMARY KEY, Firma VARCHAR(60) NOT NULL, Ort VARCHAR(40), Telefon VARCHAR(20))", "AUTO_INCREMENT");
  ok("c2", "ALTER TABLE Artikel ADD LieferantNr INT;\nALTER TABLE Artikel ADD CONSTRAINT fk_lief FOREIGN KEY (LieferantNr) REFERENCES Lieferant(LieferantNr);", "ADD FOREIGN KEY nachgebildet");
  ok("c3", "CREATE TABLE Lieferung (LieferantNr INT, ArtikelNr INT, Einkaufspreis DECIMAL(10,2), LieferzeitTage INT, PRIMARY KEY (LieferantNr, ArtikelNr), FOREIGN KEY (LieferantNr) REFERENCES Lieferant(LieferantNr), FOREIGN KEY (ArtikelNr) REFERENCES Artikel)");
  ok("o4", "SELECT Bezeichnung, Preis FROM Artikel ORDER BY Preis DESC LIMIT 3 -- Kommentar");

  /* ---------------------------------------------------------- Typische Fehler */
  nein("w5", "SELECT KundenNr, Name, Vorname FROM Kunde WHERE Email = NULL", /0 Zeilen|erwartet/);
  nein("g1", "SELECT * FROM Kunde", /Spalten|Werte stimmen/);
  nein("g1", "SELECT Name, Ort FROM Kunde", /fehlen Spalten/);
  nein("o1", "SELECT Bezeichnung, Preis FROM Artikel ORDER BY Preis", /Reihenfolge/);
  nein("j4", "SELECT k.Bezeichnung, COUNT(*) FROM Kategorie k LEFT JOIN Artikel a ON a.KategorieNr = k.KategorieNr GROUP BY k.Bezeichnung", /Werte|Zeilen/);
  nein("j1", "SELECT b.BestellNr, b.Datum, k.Name, k.Ort FROM Bestellung b JOIN Kunde k", /JOIN-Bedingung|zu viele|Zeilen/);
  nein("d2", "UPDATE Artikel SET Preis = Preis * 1.05", /Artikel/);
  nein("d2", "UPDATE Artikel SET Preis = Preis * 1.05 WHERE KategorieNr = 9", /nichts geändert/);
  let r = nein("d5", "DELETE FROM Bestellung WHERE Status = 'storniert'");
  assert(/referentielle Integrität/.test(r.text), r.text);
  r = nein("c1", "CREATE TABLE Lieferant (LieferantNr INT, Firma VARCHAR(50), Ort VARCHAR(40), Telefon INT)");
  assert(r.punkte.some(p => !p.ok && /Primärschlüssel/.test(p.text)));
  assert(r.punkte.some(p => !p.ok && /60 Zeichen/.test(p.text)));
  assert(r.punkte.some(p => !p.ok && /Telefon/.test(p.text)));
  assert(r.punkte.some(p => !p.ok && /NOT NULL/.test(p.text)));
  r = nein("c2", "ALTER TABLE Artikel ADD LieferantNr INT", /Punkt/);
  assert(r.punkte.some(p => !p.ok && /Fremdschlüssel/.test(p.text)));
  r = nein("c3", "CREATE TABLE Lieferung (LieferantNr INT PRIMARY KEY, ArtikelNr INT PRIMARY KEY)");
  assert(/EIN Primärschlüssel/.test(r.text), r.text);
  r = nein("c3", "CREATE TABLE Lieferung (LieferantNr INT REFERENCES Lieferant, ArtikelNr INT REFERENCES Artikel, Einkaufspreis FLOAT, LieferzeitTage INT, PRIMARY KEY (LieferantNr, ArtikelNr))");
  assert(r.punkte.some(p => !p.ok && /DECIMAL/.test(p.text)));
  nein("c4", "CREATE TABLE KundenKoeln (Name TEXT)", /Tabelle/);
  for (const typ of ["DECIMAL(8,0)", "NUMERIC(8,3)", "DECIMAL", "DECIMAL(1,2)"]) {
    nein("c3", A("c3").loesung.replace("DECIMAL(8,2)", typ), /Nachkommastellen|Präzision/);
  }
  ok("c3", A("c3").loesung.replace("DECIMAL(8,2)", "NUMERIC(10,2)"));
  const tx = S.neueDb();
  try {
    const result = S.ausfuehren(tx, "START TRANSACTION; UPDATE Artikel SET Preis = 0; ROLLBACK; SELECT MIN(Preis) FROM Artikel;");
    assert(!result.fehler, "supported transaction syntax must execute");
    assert(result.letztes.zeilen[0][0] > 0, "ROLLBACK must restore prices");
    const literal = S.ausfuehren(tx, "SELECT 'START TRANSACTION' AS Text;");
    assert.strictEqual(literal.letztes.zeilen[0][0], "START TRANSACTION", "do not rewrite quoted values");
  } finally { tx.close(); }

  /* ------------------------------------------------- Fehlermeldungen auf Deutsch */
  const f = code => fehler(code);
  assert(/einfache Anführungszeichen/.test(f("SELECT * FROM Kunde WHERE Ort = Köln")));
  assert(/gibt es nicht/.test(f("SELECT * FROM Kunden")));
  assert(/mehreren Tabellen/.test(f("SELECT KundenNr FROM Kunde JOIN Bestellung ON Kunde.KundenNr = Bestellung.KundenNr")));
  assert(/HAVING/.test(f("SELECT Ort FROM Kunde WHERE COUNT(*) > 1 GROUP BY Ort")));
  assert(/LIMIT/.test(f("SELECT TOP 3 * FROM Artikel")));
  assert(/Komma zu viel/.test(f("SELECT Name, FROM Kunde")));
  assert(/DATEADD/.test(f("SELECT DATE_ADD(Datum, 7) FROM Bestellung")), "MySQL-Funktion → Beiblatt-Funktion");
  assert(/DATEADD/.test(f("SELECT DATE_ADD(Datum, INTERVAL 7 DAY) FROM Bestellung")), "INTERVAL → DATEADD");
  assert(/VARIANCE/.test(f("SELECT VAR(Preis) FROM Artikel")), "SQL-Server-Name → Beiblatt-Name");
  assert(/UNION: Beide SELECT/.test(f("SELECT Ort FROM Kunde UNION SELECT Name, Vorname FROM Mitarbeiter")));

  /* ---------------------------------------------- Warnungen (SQLite lässt durch) */
  const w = c => S.warnungen(c, ["Kunde", "Ort", "Name"]).join(" ");
  assert(/GROUP BY/.test(w("SELECT Ort, Name, COUNT(*) FROM Kunde GROUP BY Ort")));
  assert(!/GROUP BY/.test(w("SELECT k.Ort, COUNT(*) AS n FROM Kunde k GROUP BY k.Ort")));
  assert(/kein GROUP BY/.test(w("SELECT Name, COUNT(*) FROM Kunde")));
  assert(/kein GROUP BY/.test(w("SELECT Name, STDDEV(Gehalt) FROM Mitarbeiter")), "STDDEV ist eine Aggregatfunktion");
  assert(/IS NULL/.test(w("SELECT * FROM Kunde WHERE Email = NULL")));
  assert(/ALLE Zeilen/.test(w("DELETE FROM Kunde")));
  assert(/einfache/.test(w('SELECT * FROM Kunde WHERE Ort = "Köln"')));
  assert(!/einfache/.test(w('SELECT "Name" FROM "Kunde"')));
  assert(/kartesisches/.test(w("SELECT * FROM Kunde k JOIN Bestellung b WHERE k.Ort = 'Köln'")));
  assert(/LIKE/.test(w("SELECT * FROM Artikel WHERE Bezeichnung LIKE 'Logitech'")));
  assert(/JJJJ-MM-TT/.test(w("SELECT * FROM Bestellung WHERE Datum >= '01.01.2026'")), "Datum TT.MM.JJJJ wird nur als Text verglichen");
  assert(!/JJJJ-MM-TT/.test(w("SELECT YEAR('01.01.2026')")));
  assert.strictEqual(w("GRANT SELECT ON service.* TO \"praktikant\""), "", "Rechte-Anweisungen ohne SQL-Warnungen");

  /* Zerlegen: ; in Texten und Kommentare */
  assert.deepStrictEqual(S.zerlege("SELECT ';' ; -- x;\nSELECT 2; /* ; */"), ["SELECT ';'", "SELECT 2"]);

  /* ==================================================================
     Funktionen laut Beiblatt
     ================================================================== */
  /* Datumsteil ohne Anführungszeichen: Umschreiben nur beim ersten von drei Argumenten */
  const dq = S.datumsteilQuoten;
  assert.strictEqual(dq("SELECT DATEDIFF(DAY, a, b) FROM t"), "SELECT DATEDIFF('DAY', a, b) FROM t");
  assert.strictEqual(dq("select datediff ( day , a, b )"), "select datediff ( 'DAY' , a, b )");
  assert.strictEqual(dq("DATEADD(MONTH, 1, DATEADD(DAY, 3, x))"), "DATEADD('MONTH', 1, DATEADD('DAY', 3, x))", "geschachtelt");
  assert.strictEqual(dq("DATEDIFF(MINUTE, LEFT(a, 2), RIGHT(b, 3))"), "DATEDIFF('MINUTE', LEFT(a, 2), RIGHT(b, 3))");
  for (const roh of ["SELECT 'DATEDIFF(DAY, a, b)'", 'SELECT "DATEDIFF(DAY, a, b)"', "SELECT `DATEDIFF(DAY, a, b)`",
    "-- DATEDIFF(DAY, a, b)\nSELECT 1", "/* DATEADD(DAY, 1, x) */ SELECT 1", "SELECT DATEDIFF(DAY, x)", "SELECT DAY FROM t",
    "SELECT DAY(x), YEAR(x) FROM t", "SELECT t.DATEDIFF(DAY, a, b)", "SELECT DATEDIFF(Eingang, Erledigt, DAY)", "SELECT 'it''s DATEDIFF(DAY,a,b)'"])
    assert.strictEqual(dq(roh), roh, "unverändert: " + roh);
  assert.strictEqual(dq("SELECT DATEDIFF(DAY, 'x(DAY, 1)', b)"), "SELECT DATEDIFF('DAY', 'x(DAY, 1)', b)", "Klammern in Texten zählen nicht");

  /* DATEDIFF(Datumsteil, Anfang, Ende) = Ende − Anfang; gezählt werden Wechsel wie in SQL Server */
  assert.strictEqual(wert("SELECT DATEDIFF(DAY, '2026-03-01', '2026-03-15')"), 14);
  assert.strictEqual(wert("SELECT DATEDIFF(DAY, '2026-03-15', '2026-03-01')"), -14);
  assert.strictEqual(wert("SELECT DATEDIFF(day, '2026-02-27', '2026-03-02')"), 3, "kleingeschrieben, Monatswechsel");
  assert.strictEqual(wert("SELECT DATEDIFF('DAY', '2024-02-28', '2024-03-01')"), 2, "in Anführungszeichen, Schaltjahr");
  assert.strictEqual(wert("SELECT DATEDIFF(DAY, '2026-03-02 23:00', '2026-03-03 01:00')"), 1, "DAY zählt Kalendertage");
  assert.strictEqual(wert("SELECT DATEDIFF(DAY, '01.03.2026', '15.03.2026')"), 14, "Datum TT.MM.JJJJ wie im Beiblatt");
  assert.strictEqual(wert("SELECT DATEDIFF(MONTH, '2025-11-15', '2026-02-10')"), 3);
  assert.strictEqual(wert("SELECT DATEDIFF(MONTH, '2026-01-31', '2026-02-01')"), 1);
  assert.strictEqual(wert("SELECT DATEDIFF(YEAR, '2016-11-01', '2026-10-26')"), 10);
  assert.strictEqual(wert("SELECT DATEDIFF(YEAR, '2025-12-31', '2026-01-01')"), 1);
  assert.strictEqual(wert("SELECT DATEDIFF(HOUR, '2026-03-02 08:00', '2026-03-02 11:00')"), 3);
  assert.strictEqual(wert("SELECT DATEDIFF(HOUR, '2026-03-02 23:00', '2026-03-03 01:00')"), 2);
  assert.strictEqual(wert("SELECT DATEDIFF(HOUR, '2026-03-02 08:59', '2026-03-02 09:01')"), 1, "HOUR zählt Stundenwechsel");
  assert.strictEqual(wert("SELECT DATEDIFF(MINUTE, '2026-01-12 07:40', '2026-01-12 09:10')"), 90);
  assert.strictEqual(wert("SELECT DATEDIFF(MINUTE, '2026-03-02 23:50', '2026-03-03 00:10')"), 20);
  assert.strictEqual(wert("SELECT DATEDIFF(DAY, NULL, '2026-01-01')"), null);
  assert.strictEqual(wert("SELECT COUNT(*) FROM Ticket WHERE DATEDIFF(DAY, Eingang, Erledigt) > 2", "service"), 3, "mit Spalten");

  /* Alte MySQL-Form DATEDIFF(Ende, Anfang) in Tagen bleibt gleich */
  const alt = (a, b) => Math.round((Date.parse(String(a).slice(0, 10)) - Date.parse(String(b).slice(0, 10))) / 864e5);
  [["2026-03-15", "2026-03-01"], ["2026-03-01", "2026-03-15"], ["2024-03-01", "2024-02-28"], ["2026-01-01", "2025-12-31"],
   ["2026-03-15 23:59", "2026-03-01 00:00"], ["2030-07-04", "1999-12-31"]].forEach(([a, b]) =>
    assert.strictEqual(wert("SELECT DATEDIFF('" + a + "', '" + b + "')"), alt(a, b), "MySQL-Form " + a + " / " + b));
  assert.strictEqual(wert("SELECT DATEDIFF(Datum, '2025-01-01') FROM Bestellung WHERE BestellNr = 1001"), 40, "MySQL-Form mit Spalte");

  /* DATEADD(Datumsteil, Intervall, Datum) */
  const plus = [["DAY, 14, '2026-03-01'", "2026-03-15"], ["DAY, -1, '2026-03-01'", "2026-02-28"], ["day, 1, '28.02.2026'", "2026-03-01"],
    ["MONTH, 1, '2026-01-31'", "2026-02-28"], ["MONTH, 1, '2024-01-31'", "2024-02-29"], ["MONTH, 24, '2024-03-15'", "2026-03-15"],
    ["MONTH, -3, '2026-01-15'", "2025-10-15"], ["YEAR, 1, '2024-02-29'", "2025-02-28"], ["YEAR, -10, '2026-10-26'", "2016-10-26"],
    ["HOUR, 5, '2026-03-01 22:30'", "2026-03-02 03:30"], ["HOUR, 2, '2026-03-01'", "2026-03-01 02:00"],
    ["MINUTE, 90, '2026-03-01 08:00'", "2026-03-01 09:30"], ["MINUTE, 1, '2026-03-01 08:00:30'", "2026-03-01 08:01:30"],
    ["DAY, 2.9, '2026-03-01'", "2026-03-03"]];
  plus.forEach(([arg, soll]) => assert.strictEqual(wert("SELECT DATEADD(" + arg + ")"), soll, "DATEADD(" + arg + ")"));
  assert.strictEqual(wert("SELECT DATEADD(DAY, 1, NULL)"), null);
  assert.strictEqual(wert("SELECT DATEDIFF(DAY, '2026-03-01', DATEADD(DAY, 30, '2026-03-01'))"), 30, "DATEADD in DATEDIFF");

  /* WEEKDAY (Montag = 0), HOUR, MINUTE, YEAR, MONTH, DAY */
  assert.strictEqual(wert("SELECT WEEKDAY('2026-10-26')"), 0, "Montag");
  assert.strictEqual(wert("SELECT WEEKDAY('2026-10-27')"), 1, "Dienstag");
  assert.strictEqual(wert("SELECT WEEKDAY('2026-01-24 10:15')"), 5, "Samstag");
  assert.strictEqual(wert("SELECT WEEKDAY('25.10.2026')"), 6, "Sonntag");
  assert.strictEqual(wert("SELECT HOUR('2026-03-02 08:30')"), 8);
  assert.strictEqual(wert("SELECT MINUTE('2026-03-02 08:30')"), 30);
  assert.strictEqual(wert("SELECT HOUR('2026-03-02')"), 0, "Datum ohne Uhrzeit = 0 Uhr");
  assert.strictEqual(wert("SELECT HOUR('18:20')"), 18, "reine Uhrzeit");
  assert.deepStrictEqual(zeilen("SELECT YEAR('2026-03-02'), MONTH('2026-03-02'), DAY('2026-03-02'), YEAR('02.03.2026'), MONTH('02.03.2026'), DAY('02.03.2026')"), [[2026, 3, 2, 2026, 3, 2]]);
  assert.strictEqual(wert("SELECT YEAR(NULL)"), null);
  assert.strictEqual(wert("SELECT COUNT(*) FROM Ticket WHERE WEEKDAY(Eingang) >= 5", "service"), 3, "Wochenende in den Daten");

  /* NOW() fest je Aufgabe, sonst echte Zeit */
  const fest = S.neueDb(null, "service", "2026-03-01 09:00");
  try { assert.deepStrictEqual(S.ausfuehren(fest, "SELECT NOW(), CURDATE()").letztes.zeilen, [["2026-03-01 09:00:00", "2026-03-01"]]); } finally { fest.close(); }
  assert(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(wert("SELECT NOW()")));

  /* Verständliche Fehler bei Datumsfunktionen */
  assert(/kein Datumsteil/.test(f("SELECT DATEDIFF('WEEK', '2026-01-01', '2026-02-01')")));
  assert(/Datumsteil „WEEK“ gibt es laut Beiblatt nicht/.test(f("SELECT DATEDIFF(WEEK, '2026-01-01', '2026-02-01')")));
  assert(/Datumsteil/.test(fehler("SELECT DATEDIFF(DAY, Eingang) FROM Ticket", "service")), "Datumsteil bei zwei Angaben");
  assert(/erster Stelle/.test(fehler("SELECT DATEDIFF(Eingang, Erledigt, DAY) FROM Ticket", "service")), "Datumsteil an falscher Stelle");
  assert(/kein gültiges Datum/.test(fehler("SELECT DATEDIFF(DAY, Firmenname, '2026-01-01') FROM Firma", "service")));
  assert(/Intervall/.test(f("SELECT DATEADD(DAY, 'zwei', '2026-01-01')")));
  assert(/drei Angaben/.test(f("SELECT DATEADD('DAY', 1)")));
  assert(/Datumsteil/.test(f("SELECT DATEADD(DAY, 1)")), "zwei Angaben: DAY bleibt Spaltenname → Hinweis auf Datumsteil");
  assert(/drei Angaben/.test(f("SELECT DATEDIFF('2026-01-01')")));

  /* LEFT / RIGHT */
  assert.deepStrictEqual(zeilen("SELECT LEFT('NB-2023-004', 2), RIGHT('NB-2023-004', 3), RIGHT(LEFT('NB-2023-004', 7), 4), LEFT('ab', 5), RIGHT('ab', 0), LEFT(NULL, 2)"),
    [["NB", "004", "2023", "ab", "", null]]);

  /* STDDEV, VARIANCE, CORR — bekannte Daten: 2,4,4,4,5,5,7,9 (Mittel 5, Varianz 4) */
  const st = S.neueDb();
  try {
    st.exec("CREATE TABLE M (g INTEGER, x REAL, y REAL); INSERT INTO M VALUES (1,2,NULL),(1,4,NULL),(1,4,NULL),(1,4,NULL),(1,5,NULL),(1,5,NULL),(1,7,NULL),(1,9,NULL),(1,NULL,NULL);" +
      "INSERT INTO M VALUES (2,1,2),(2,2,4),(2,3,5),(2,4,4),(2,5,5),(3,1,10),(3,2,8),(3,3,6),(4,7,1),(4,7,2);");
    const e = sql => { const l = S.ausfuehren(st, sql); assert(!l.fehler, sql + " " + (l.fehler && l.fehler.roh)); return l.letztes.zeilen; };
    const [[sd, va, sds, vas, sdp, vap, n]] = e("SELECT STDDEV(x), VARIANCE(x), STDDEV_SAMP(x), VAR_SAMP(x), STDDEV_POP(x), VAR_POP(x), COUNT(x) FROM M WHERE g = 1");
    assert.strictEqual(n, 8, "NULL zählt nicht");
    nah(sd, 2, "STDDEV"); nah(va, 4, "VARIANCE"); nah(sdp, 2); nah(vap, 4);
    nah(vas, 32 / 7, "VAR_SAMP"); nah(sds, Math.sqrt(32 / 7), "STDDEV_SAMP");
    nah(e("SELECT CORR(x, y) FROM M WHERE g = 2")[0][0], 6 / Math.sqrt(60), "CORR Pearson");
    nah(e("SELECT CORR(x, 2 * x + 1) FROM M WHERE g = 2")[0][0], 1, "CORR = 1");
    nah(e("SELECT CORR(x, y) FROM M WHERE g = 3")[0][0], -1, "CORR = -1");
    assert.strictEqual(e("SELECT CORR(x, y) FROM M WHERE g = 4")[0][0], null, "ohne Streuung kein Zusammenhang");
    assert.deepStrictEqual(e("SELECT STDDEV(x), VARIANCE(x), CORR(x, y) FROM M WHERE g = 99"), [[null, null, null]], "leere Menge");
    assert.strictEqual(e("SELECT VAR_SAMP(x) FROM M WHERE g = 1 AND x = 2")[0][0], null, "Stichprobe aus einem Wert");
    const grp = e("SELECT g, STDDEV(x), VARIANCE(x) FROM M GROUP BY g ORDER BY g");
    nah(grp[0][1], 2); nah(grp[1][2], 2); nah(grp[2][2], 2 / 3); nah(grp[3][1], 0);
    nah(e("SELECT STDDEV(DISTINCT x) FROM M WHERE g = 1")[0][0], Math.sqrt(29.2 / 5), "DISTINCT in Aggregat: 2,4,5,7,9");
  } finally { st.close(); }

  /* Syntax aus dem Beiblatt läuft: UNION, DISTINCT, RIGHT JOIN, (SELECT …) AS tbl,
     EXISTS / NOT EXISTS, IN / NOT IN, HAVING, LIKE mit % und _, IS NULL, <> */
  const mini = sql => zeilen(sql, "mini");
  assert.strictEqual(mini("SELECT Ort FROM Person UNION SELECT Ort FROM Standort").length, 3);
  assert.strictEqual(mini("SELECT Ort FROM Person UNION ALL SELECT Ort FROM Standort").length, 7);
  assert.strictEqual(mini("SELECT DISTINCT Ort FROM Person").length, 2);
  assert.deepStrictEqual(mini("SELECT p.Name, a.Bezeichnung FROM Person p RIGHT JOIN Abteilung a ON a.AbtNr = p.AbtNr WHERE p.Name IS NULL"), [[null, "Vertrieb"]]);
  assert.strictEqual(mini("SELECT * FROM Person p RIGHT OUTER JOIN Abteilung a ON a.AbtNr = p.AbtNr").length, 5);
  assert.strictEqual(mini("SELECT * FROM Abteilung a LEFT OUTER JOIN Person p ON a.AbtNr = p.AbtNr").length, 5);
  assert.deepStrictEqual(mini("SELECT tbl.AbtNr, tbl.n FROM (SELECT AbtNr, COUNT(*) AS n FROM Person WHERE AbtNr IS NOT NULL GROUP BY AbtNr) AS tbl WHERE tbl.n > 1"), [[2, 3]]);
  assert.deepStrictEqual(mini("SELECT Bezeichnung FROM Abteilung a WHERE EXISTS (SELECT * FROM Person p WHERE p.AbtNr = a.AbtNr) ORDER BY Bezeichnung"), [["Einkauf"], ["IT"]]);
  assert.deepStrictEqual(mini("SELECT Bezeichnung FROM Abteilung a WHERE NOT EXISTS (SELECT * FROM Person p WHERE p.AbtNr = a.AbtNr)"), [["Vertrieb"]]);
  assert.strictEqual(mini("SELECT Name FROM Person WHERE AbtNr IN (SELECT AbtNr FROM Abteilung WHERE Bezeichnung = 'IT')").length, 3);
  assert.deepStrictEqual(mini("SELECT Name FROM Person WHERE AbtNr NOT IN (SELECT AbtNr FROM Abteilung WHERE Bezeichnung = 'IT')"), [["Claus"]], "NULL fällt bei NOT IN heraus");
  assert.deepStrictEqual(mini("SELECT AbtNr FROM Person GROUP BY AbtNr HAVING COUNT(*) >= 3"), [[2]]);
  assert.deepStrictEqual(mini("SELECT Name FROM Person WHERE Name LIKE 'B%'"), [["Brandt"]]);
  assert.deepStrictEqual(mini("SELECT Name FROM Person WHERE Name LIKE '_rndt'"), [["Arndt"]]);
  assert.deepStrictEqual(mini("SELECT Name FROM Person WHERE Gehalt IS NULL"), [["Brandt"]]);
  assert.deepStrictEqual(mini("SELECT COUNT(*) FROM Person WHERE Ort <> 'Leipzig'"), [[2]]);

  /* ALTER TABLE wie im Beiblatt: mehrere ADD COLUMN, DROP COLUMN mit Datentyp */
  assert.deepStrictEqual(S.alterAufteilen("ALTER TABLE Kunde ADD COLUMN A VARCHAR(5), ADD COLUMN B DECIMAL(8,2)"), ["ALTER TABLE Kunde ADD COLUMN A VARCHAR(5)", "ALTER TABLE Kunde ADD COLUMN B DECIMAL(8,2)"]);
  assert.deepStrictEqual(S.alterAufteilen("ALTER TABLE Kunde ADD COLUMN A VARCHAR(5)"), ["ALTER TABLE Kunde ADD COLUMN A VARCHAR(5)"]);
  const at = S.neueDb();
  try {
    const l = S.ausfuehren(at, "ALTER TABLE Kunde ADD COLUMN Vorname2 VARCHAR(50), ADD COLUMN Nachname2 VARCHAR(50);\nALTER TABLE Kunde DROP COLUMN Vorname2 VARCHAR(50);\nSELECT * FROM Kunde WHERE KundenNr = 1;");
    assert(!l.fehler, l.fehler && l.fehler.roh);
    assert(l.letztes.spalten.indexOf("Nachname2") >= 0 && l.letztes.spalten.indexOf("Vorname2") < 0);
    assert(l.notizen.some(n => /nacheinander/.test(n)) && l.notizen.some(n => /DROP COLUMN/.test(n)));
  } finally { at.close(); }

  /* ==================================================================
     Neue Aufgaben: Musterlösung liefert das erwartete Ergebnis
     ================================================================== */
  const soll = {
    n1: [["Dresden"], ["Grimma"], ["Halle"], ["Leipzig"], ["Taucha"]],
    n2: [["Becker", "Lena"], ["Schulze", "Ben"]],
    n3: [["Becker", 3], ["Kraus", 3], ["Nowak", 3], ["Schulze", 1], ["Wagner", 0]],
    n5: [[3]],
    n6: [["Bäckerei Engel", "Taucha"], ["Stadtbibliothek Grimma", "Grimma"]],
    n7: [["Becker", 3, 4.5], ["Kraus", 3, 4], ["Nowak", 3, 2.5]],
    n8: [["DR-2022-011", "DR", "2022", "011"], ["DR-2025-003", "DR", "2025", "003"], ["MO-2024-007", "MO", "2024", "007"], ["NB-2023-004", "NB", "2023", "004"],
      ["NB-2025-012", "NB", "2025", "012"], ["PC-2024-002", "PC", "2024", "002"], ["PC-2025-019", "PC", "2025", "019"], ["RT-2021-001", "RT", "2021", "001"]],
    n9: [["Druckerei Hahn", "Julia", "Hahn"], ["Kanzlei Roth", "Peter", "Roth"], ["Praxis Dr. Lorenz", "Maria", "Lorenz"], ["Bäckerei Engel", "Karl", "Engel"], ["Stadtbibliothek Grimma", "Anna", "Vogt"]],
    n10: [[1, 2], [2, 2], [3, 3], [4, 2]],
    n11: [[103, "Software", 10], [105, "Hardware", 3], [107, "Software", 3]],
    n12: [["NB-2023-004", "Notebook 15 Zoll", "2025-05-10"], ["DR-2022-011", "Laserdrucker A4", "2025-11-21"], ["PC-2024-002", "Mini-PC", "2026-02-15"], ["RT-2021-001", "WLAN-Router", "2023-09-01"]],
    n13: [[105, "2026-01-24 10:15"], [106, "2026-02-03 18:20"], [109, "2026-03-08 10:00"], [112, "2026-04-11 19:30"]]
  };
  const sortiert = z => z.map(x => JSON.stringify(x)).sort();
  Object.keys(soll).forEach(id => {
    const l = S.loesungLauf(A(id)).lauf.letztes;
    if (A(id).ordnung) assert.deepStrictEqual(l.zeilen, soll[id], id);
    else assert.deepStrictEqual(sortiert(l.zeilen), sortiert(soll[id]), id);
  });
  const nachher = (id, t) => S.loesungLauf(A(id)).stand[t].zeilen;
  assert.deepStrictEqual(nachher("n14", "Techniker").map(z => [z[0], Math.round(z[4] * 100) / 100]), [[1, 71.4], [2, 54.6], [3, 58], [4, 74], [5, 38]], "n14 nur Becker und Kraus");
  assert.deepStrictEqual(nachher("n15", "Geraet").map(z => z[0]).sort(), ["DR-2022-011", "MO-2024-007", "NB-2023-004", "NB-2025-012", "PC-2024-002", "PC-2025-019"], "n15 Taucha gelöscht");
  assert.strictEqual(nachher("n15", "Ticket").length, 12, "n15 lässt Tickets stehen");
  assert.deepStrictEqual(nachher("n16", "TicketArchiv"), [[101, 1, "Hardware", "2025-11-05 11:40"], [102, 2, "Netzwerk", "2025-12-15 10:35"]], "n16 Archiv 2025");
  assert.strictEqual(nachher("n16", "Ticket").length, 12, "n16 kopiert nur");

  /* … gleichwertige Lösungen bestehen, typische Fehler nicht */
  ok("n1", "select ort from firma union select ort from lieferant order by 1");
  ok("n1", "SELECT DISTINCT Ort FROM (SELECT Ort FROM Firma UNION ALL SELECT Ort FROM Lieferant) AS tbl ORDER BY Ort");
  nein("n1", "SELECT Ort FROM Firma UNION ALL SELECT Ort FROM Lieferant ORDER BY Ort", /Zeilen/);
  nein("n1", "SELECT Ort FROM Firma ORDER BY Ort", /Zeilen/);
  nein("n2", "SELECT te.Name, te.Vorname FROM Techniker te JOIN Ticket t ON t.TechNr = te.TechNr WHERE t.Kategorie = 'Netzwerk'", /4 Zeilen/);
  ok("n3", "SELECT te.Name, COUNT(t.TicketNr) AS Anzahl FROM Techniker te LEFT JOIN Ticket t ON t.TechNr = te.TechNr GROUP BY te.TechNr, te.Name", "LEFT JOIN geht auch");
  nein("n3", "SELECT te.Name, COUNT(*) FROM Ticket t RIGHT JOIN Techniker te ON te.TechNr = t.TechNr GROUP BY te.TechNr, te.Name", /Werte/);
  nein("n3", "SELECT te.Name, COUNT(t.TicketNr) FROM Ticket t JOIN Techniker te ON te.TechNr = t.TechNr GROUP BY te.TechNr, te.Name", /4 Zeilen.*erwartet sind 5/);
  ok("n5", "SELECT COUNT(*) * 1.0 / COUNT(DISTINCT FirmaNr) AS Durchschnitt FROM Ticket");
  nein("n5", "SELECT AVG(Anzahl) FROM (SELECT f.FirmaNr, COUNT(t.TicketNr) AS Anzahl FROM Firma f LEFT JOIN Ticket t ON t.FirmaNr = f.FirmaNr GROUP BY f.FirmaNr) AS tbl", /Werte/);
  ok("n6", "SELECT Firmenname, Ort FROM Firma WHERE FirmaNr NOT IN (SELECT FirmaNr FROM Ticket WHERE Erledigt IS NULL)", "NOT IN");
  ok("n6", "SELECT f.Firmenname, f.Ort FROM Firma f LEFT JOIN Ticket t ON t.FirmaNr = f.FirmaNr AND t.Erledigt IS NULL WHERE t.TicketNr IS NULL", "LEFT JOIN mit Bedingung im ON");
  nein("n6", "SELECT DISTINCT f.Firmenname, f.Ort FROM Firma f JOIN Ticket t ON t.FirmaNr = f.FirmaNr WHERE t.Erledigt IS NOT NULL");
  nein("n7", "SELECT te.Name, COUNT(*), AVG(COALESCE(t.Bewertung, 0)) FROM Techniker te JOIN Ticket t ON t.TechNr = te.TechNr GROUP BY te.TechNr, te.Name HAVING COUNT(*) >= 3", /Werte/);
  nein("n7", "SELECT te.Name, COUNT(*), AVG(t.Bewertung) FROM Techniker te JOIN Ticket t ON t.TechNr = te.TechNr GROUP BY te.TechNr, te.Name HAVING COUNT(*) > 3", /0 Zeilen/);
  ok("n8", "SELECT InventarNr, LEFT(InventarNr, 2), LEFT(RIGHT(InventarNr, 8), 4), RIGHT(InventarNr, 3) FROM Geraet", "andere Schachtelung");
  nein("n8", "SELECT InventarNr, LEFT(InventarNr, 2), YEAR(Kaufdatum), RIGHT(InventarNr, 3) FROM Geraet", /Werte/);
  ok("n9", "SELECT Firmenname, SUBSTR(Ansprechpartner, 1, INSTR(Ansprechpartner, ' ') - 1), SUBSTR(Ansprechpartner, INSTR(Ansprechpartner, ' ') + 1) FROM Firma", "SUBSTR geht auch");
  nein("n9", "SELECT Firmenname, LEFT(Ansprechpartner, INSTR(Ansprechpartner, ' ')), RIGHT(Ansprechpartner, LENGTH(Ansprechpartner) - INSTR(Ansprechpartner, ' ')) FROM Firma", /Leerzeichen/);
  nein("n9", "SELECT Firmenname, LEFT(Ansprechpartner, INSTR(Ansprechpartner, ' ') - 1), RIGHT(Ansprechpartner, LENGTH(Ansprechpartner) - INSTR(Ansprechpartner, ' ') + 1) FROM Firma", /Leerzeichen/);
  nein("n9", "SELECT Firmenname, LEFT(Ansprechpartner, INSTR(Ansprechpartner, ' ') - 2), RIGHT(Ansprechpartner, 4) FROM Firma", /Werte/);
  ok("g3", "SELECT Vorname || ' ' || Name || ' ' FROM Mitarbeiter", "ohne „genau“ bleibt der Vergleich wie bisher tolerant");
  ok("n10", "SELECT MONTH(Eingang), COUNT(TicketNr) FROM Ticket WHERE Eingang BETWEEN '2026-01-01' AND '2026-12-31 23:59' GROUP BY MONTH(Eingang) ORDER BY MONTH(Eingang)");
  nein("n10", "SELECT MONTH(Eingang) AS Monat, COUNT(*) FROM Ticket WHERE YEAR(Eingang) = 2026 GROUP BY MONTH(Eingang) ORDER BY Monat DESC", /Reihenfolge/);
  ok("n11", "SELECT TicketNr, Kategorie, DATEDIFF(Erledigt, Eingang) AS Tage FROM Ticket WHERE DATEDIFF(Erledigt, Eingang) > 2", "MySQL-Form geht auch");
  nein("n11", "SELECT TicketNr, Kategorie, DATEDIFF(DAY, Erledigt, Eingang) FROM Ticket WHERE DATEDIFF(DAY, Erledigt, Eingang) > 2", /0 Zeilen/);
  ok("n12", "SELECT InventarNr, Bezeichnung, DATEADD(MONTH, GarantieMonate, Kaufdatum) FROM Geraet WHERE DATEADD(MONTH, GarantieMonate, Kaufdatum) < '2026-03-01'");
  nein("n12", "SELECT InventarNr, Bezeichnung, DATEADD(YEAR, GarantieMonate, Kaufdatum) FROM Geraet WHERE DATEADD(YEAR, GarantieMonate, Kaufdatum) < NOW()", /Zeilen/);
  nein("n13", "SELECT TicketNr, Eingang FROM Ticket WHERE WEEKDAY(Eingang) IN (0, 6) OR HOUR(Eingang) >= 18", /Zeilen|Werte/);
  nein("n13", "SELECT TicketNr, Eingang FROM Ticket WHERE WEEKDAY(Eingang) >= 5 AND HOUR(Eingang) >= 18", /Zeilen/);
  ok("n14", "UPDATE Techniker SET Stundensatz = Stundensatz + Stundensatz * 0.05 WHERE EXISTS (SELECT * FROM Ticket t WHERE t.TechNr = Techniker.TechNr AND t.Erledigt IS NOT NULL GROUP BY t.TechNr HAVING COUNT(*) >= 3)");
  nein("n14", "UPDATE Techniker SET Stundensatz = Stundensatz * 1.05 WHERE TechNr IN (SELECT TechNr FROM Ticket GROUP BY TechNr HAVING COUNT(*) >= 3)", /Techniker/);
  ok("n15", "DELETE FROM Geraet WHERE FirmaNr = 4");
  r = nein("n15", "DELETE FROM Firma WHERE Ort = 'Taucha'");
  assert(/referentielle Integrität/.test(r.text), r.text);
  ok("n16", "INSERT INTO TicketArchiv SELECT TicketNr, FirmaNr, Kategorie, Erledigt FROM Ticket WHERE Erledigt BETWEEN '2025-01-01' AND '2025-12-31 23:59'");
  nein("n16", "INSERT INTO TicketArchiv (TicketNr, FirmaNr, Kategorie, Erledigt) SELECT TicketNr, FirmaNr, Kategorie, Erledigt FROM Ticket WHERE YEAR(Eingang) = 2025", /TicketArchiv/);

  /* ==================================================================
     Rechte: Prüfung nach Muster (ohne Ausführung)
     ================================================================== */
  const mu = (id, code) => S.musterPruefen(A(id), code);
  const ja = (id, code) => { const x = mu(id, code); assert(x.ok && x.muster, id + " sollte passen: " + code + " → " + x.text + " " + JSON.stringify(x.punkte)); return x; };
  const neinM = (id, code, rx) => { const x = mu(id, code); assert(!x.ok, id + " sollte nicht passen: " + code); if (rx) assert(rx.test(x.text + " " + x.punkte.map(p => p.text).join(" ")), id + ": " + x.text + " " + JSON.stringify(x.punkte)); return x; };
  ["r1", "r2", "r3"].forEach(id => assert.strictEqual(A(id).art, "muster"));
  ja("r1", "create user praktikant identified by 'Start#2026'; grant select on service.ticket to praktikant;");
  ja("r1", "CREATE USER 'praktikant'@'localhost' IDENTIFIED BY 'Start#2026';\nGRANT SELECT\n  ON TABLE service.Ticket\n  TO 'praktikant'@'localhost'");
  ja("r1", "CREATE USER `praktikant` IDENTIFIED BY 'Start#2026'; -- Kommentar\nGRANT SELECT ON `service`.`Ticket` TO \"praktikant\";");
  let x = ja("r1", "CREATE USER IF NOT EXISTS praktikant IDENTIFIED BY 'Start#2026'; GRANT SELECT ON Ticket TO praktikant");
  assert(x.punkte.some(p => p.info && /Datenbankname/.test(p.text)), "ohne Datenbankname: Hinweis");
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY Start2026; GRANT SELECT ON service.Ticket TO praktikant", /Anführungszeichen/);
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY 'start#2026'; GRANT SELECT ON service.Ticket TO praktikant", /Groß- und Kleinschreibung/);
  neinM("r1", "GRANT SELECT ON service.Ticket TO praktikant; CREATE USER praktikant IDENTIFIED BY 'Start#2026'", /Reihenfolge/);
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY 'Start#2026'; GRANT SELECT, INSERT ON service.Ticket TO praktikant", /Nicht verlangt: INSERT/);
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY 'Start#2026'; GRANT ALL PRIVILEGES ON service.Ticket TO praktikant", /ALL ist zu viel/);
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY 'Start#2026'; GRANT SELECT ON *.* TO praktikant", /alle(n)? Datenbanken/);
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY 'Start#2026'; GRANT SELECT ON service.* TO praktikant", /alle Tabellen/);
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY 'Start#2026'; GRANT SELECT ON service.Ticket TO praktikantin", /praktikantin/);
  neinM("r1", "GRANT SELECT ON service.Ticket TO praktikant", /Es fehlt eine Anweisung: CREATE USER/);
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY 'Start#2026'; GRANT LESEN ON service.Ticket TO praktikant", /kein SQL-Recht/);
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY 'Start#2026'; GRANT SELECT ON service.Ticket TO praktikant WITH GRANT OPTION", /nicht verlangt/);
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY 'Start#2026'; GRANT SELECT ON service.Ticket TO praktikant; DROP TABLE Ticket", /kein CREATE USER, GRANT oder REVOKE/);
  neinM("r1", "CREATE USER praktikant IDENTIFIED BY 'Start#2026'; GRANT SELECT service.Ticket TO praktikant", /Es fehlt ON Objekt|Recht/);
  ja("r2", "GRANT SELECT, INSERT, UPDATE ON service.* TO nowak WITH GRANT OPTION; GRANT support TO kraus;");
  ja("r2", "grant support to 'kraus'@'%';\ngrant update, select, insert on service.* to 'nowak' with grant option");
  neinM("r2", "GRANT SELECT, INSERT, UPDATE ON service.* TO nowak; GRANT support TO kraus;", /WITH GRANT OPTION/);
  neinM("r2", "GRANT SELECT, INSERT, UPDATE, DELETE ON service.* TO nowak WITH GRANT OPTION; GRANT support TO kraus;", /Nicht verlangt: DELETE/);
  neinM("r2", "GRANT SELECT, INSERT ON service.* TO nowak WITH GRANT OPTION; GRANT support TO kraus;", /Es fehlt: UPDATE/);
  neinM("r2", "GRANT SELECT, INSERT, UPDATE ON service.Ticket TO nowak WITH GRANT OPTION; GRANT support TO kraus;", /alle Tabellen der Datenbank/);
  neinM("r2", "GRANT SELECT, INSERT, UPDATE ON service.* TO nowak WITH GRANT OPTION;", /Es fehlt eine Anweisung: GRANT \(Rolle\)/);
  neinM("r2", "GRANT SELECT, INSERT, UPDATE ON service.* TO nowak WITH GRANT OPTION; GRANT support ON service.* TO kraus;", /Es fehlt eine Anweisung: GRANT \(Rolle\)|nicht verlangt/);
  neinM("r2", "GRANT SELECT, INSERT, UPDATE ON service.* FROM nowak WITH GRANT OPTION; GRANT support TO kraus;", /TO, nicht FROM/);
  ja("r3", "REVOKE UPDATE, DELETE ON service.* FROM schulze; REVOKE netzwerk FROM schulze;");
  ja("r3", "revoke netzwerk from 'schulze'@'localhost'; revoke delete, update on service.* from schulze");
  neinM("r3", "REVOKE UPDATE, DELETE ON service.* TO schulze; REVOKE netzwerk FROM schulze;", /FROM, nicht TO/);
  neinM("r3", "REVOKE UPDATE, DELETE ON service.* FROM schulze;", /Es fehlt eine Anweisung: REVOKE \(Rolle\)/);
  neinM("r3", "GRANT UPDATE, DELETE ON service.* TO schulze; REVOKE netzwerk FROM schulze;", /Es fehlt eine Anweisung: REVOKE|nicht verlangt/);
  neinM("r3", "REVOKE UPDATE ON service.* FROM schulze; REVOKE netzwerk FROM schulze;", /Es fehlt: DELETE/);
  neinM("r3", "REVOKE ALL ON service.* FROM schulze; REVOKE netzwerk FROM schulze;", /ALL ist zu viel/);
  neinM("r3", "REVOKE UPDATE, DELETE ON service.* FROM schulze; REVOKE support FROM schulze;", /Rolle/);
  neinM("r3", "", /Noch keine Anweisung/);
  neinM("r3", "REVOKE UPDATE, DELETE ON service.* FROM 'schulze; REVOKE netzwerk FROM schulze", /nicht geschlossen/);
  /* Leser: Normalform unabhängig von Schreibweise */
  assert.deepStrictEqual(S.dclLesen("GRANT update (Preis, bestand), select ON shop.Artikel TO a@'%', b").rechte, ["SELECT", "UPDATE(bestand,preis)"]);
  assert.strictEqual(S.dclLesen("GRANT ALL PRIVILEGES ON *.* TO admin").rechte[0], "ALL");
  assert.strictEqual(S.dclLesen("CREATE ROLE support").art, "create_role");
  assert(!S.dclLesen("GRANT SELECT ON service.* TO").ok);
  /* Im normalen Ausführen: nur Schreibweise prüfen, nicht ausführen */
  const dd = S.neueDb(null, "service");
  try {
    let l = S.ausfuehren(dd, "GRANT SELECT ON service.* TO praktikant; SELECT COUNT(*) FROM Ticket");
    assert(!l.fehler && l.schritte[0].dcl && l.notizen.some(n => /ohne Ausführung/.test(n)) && l.letztes.zeilen[0][0] === 12);
    l = S.ausfuehren(dd, "REVOKE SELECT ON service.* TO praktikant");
    assert(l.fehler && /FROM, nicht TO/.test(l.fehler.text));
  } finally { dd.close(); }
  /* Ein Prüfen-Klick bei Rechte-Aufgaben landet als automatische Prüfung im Journal */
  const journal = [];
  global.GENLERNSTAND = { record: e => { journal.push(JSON.parse(JSON.stringify(e))); return { ok: true }; } };
  const pr = S.pruefen(A("r1"), A("r1").loesung);
  assert(pr.ok && pr.muster);
  assert.strictEqual(journal[0].kind, "auto");
  assert(/Muster/.test(journal[0].reason) && journal[0].snapshot.type === "sql" && /CREATE TABLE Ticket/.test(journal[0].snapshot.schema));

  /* ==================================================================
     Ergebnis vorhersagen: genau eine Antwort passt — die echte Ausführung
     ================================================================== */
  vh.forEach(a => {
    assert(a.db && a.zeigen && a.zeigen.length, a.id + " Daten zum Nachrechnen");
    assert(["wahl", "zeilen", "wert"].indexOf(a.frage) >= 0, a.id + " Frageart");
    const ist = S.loesungLauf(a).lauf.letztes;
    S.vorhersageDaten(a).forEach(d => assert(d.r && d.r.zeilen.length && d.r.zeilen.length <= 12, a.id + " Daten " + d.titel));
    if (a.frage === "wahl") {
      const opt = a.optionen.map(o => ({ spalten: a.spalten, zeilen: o }));
      assert(opt.length >= 3 && opt.length <= 4, a.id + " 3–4 Antworten");
      opt.forEach((o, i) => assert.deepStrictEqual(o.spalten.map(s => s.toLowerCase()), ist.spalten.map(s => s.toLowerCase()), a.id + " Spaltenköpfe Antwort " + i));
      const passt = opt.map((o, i) => S.tabelleGleich(o, ist, a.ordnung) ? i : -1).filter(i => i >= 0);
      assert.deepStrictEqual(passt, [a.richtig], a.id + ": genau eine richtige Antwort, nämlich " + a.richtig + " — passend: " + JSON.stringify(passt));
      assert.strictEqual(new Set(opt.map(o => JSON.stringify(o.zeilen))).size, opt.length, a.id + " Antworten verschieden");
      assert.strictEqual(S.vorhersageSoll(a), a.richtig);
    } else if (a.frage === "zeilen") assert.strictEqual(ist.zeilen.length, a.antwort, a.id);
    else assert.strictEqual(S.eingabeNorm(ist.zeilen[0][0]), S.eingabeNorm(a.antwort), a.id);
  });
  /* Auswahl → „recognition“, Eingabe → „auto“; richtige und falsche Antworten */
  journal.length = 0;
  const v1 = A("v1");
  assert(S.vorhersagePruefen(v1, { wahl: v1.richtig }).ok);
  const falschWahl = S.vorhersagePruefen(v1, { wahl: (v1.richtig + 1) % v1.optionen.length });
  assert(!falschWahl.ok && falschWahl.soll === v1.richtig && /Richtig ist Antwort B/.test(falschWahl.text));
  assert.deepStrictEqual(journal.map(e => [e.kind, e.correct, e.source, e.topic, e.task]), [["recognition", 1, "sql", "sql", "v1"], ["recognition", 0, "sql", "sql", "v1"]]);
  assert.strictEqual(journal[0].support, "selbst");
  assert.strictEqual(journal[1].support, "hilfe", "zweiter Versuch nach Rückmeldung");
  assert(journal[0].id && journal[0].id !== journal[1].id && /^sql-vh:v1:\d+$/.test(journal[0].id), "stabile, eindeutige Kennung je Antwort");
  assert(/Richtig: Antwort B/.test(journal[0].snapshot.solution) && /Person/.test(journal[0].snapshot.question), "Snapshot für „Fehler wiederholen“");
  const v6 = A("v6"), v9 = A("v9"), v10 = A("v10");
  assert(S.vorhersagePruefen(v6, { wert: " 4 " }).ok);
  assert(!S.vorhersagePruefen(v6, { wert: "5" }).ok);
  assert(S.vorhersagePruefen(v9, { wert: "90" }).ok);
  assert(!S.vorhersagePruefen(v9, { wert: "1,5" }).ok);
  assert(S.vorhersagePruefen(v10, { wert: "'2024'" }).ok);
  assert.strictEqual(journal.filter(e => e.task === "v6" || e.task === "v9" || e.task === "v10").every(e => e.kind === "auto"), true);
  assert.strictEqual(S.eingabeNorm("2,75"), S.eingabeNorm(2.75));
  assert.strictEqual(S.eingabeNorm("NULL"), S.eingabeNorm(null));
  assert.strictEqual(S.eingabeNorm("Au"), S.eingabeNorm("au"));
  S.hilfeMerken("v2", "loesung");
  S.vorhersagePruefen(A("v2"), { wahl: A("v2").richtig });
  assert.strictEqual(journal.slice(-1)[0].support, "loesung", "nach „Lösung“ zählt es als Übung mit Lösung");
  delete global.GENLERNSTAND;

  /* ------------------------------------------------------------ Einbindung */
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  ["gen/sql.js", "gen/sql.css", "gen/sql-daten.js"].forEach(x => { assert(html.includes(x), x); assert(sw.includes("./" + x), x); });
  assert(!html.includes("sql-wasm.js"), "Bibliothek erst bei Bedarf laden");
  assert(sw.includes("vendor/"), "Bibliothek offline verfügbar");

  /* ---------------------------------------------------- SQL+: Index, MODIFY/CHANGE, Textfunktionen */
  ok("i1", "create index ix on Kunde(Ort);", "Indexname egal");
  nein("i1", "CREATE INDEX ix ON Kunde (Name);", /nicht auf \(Ort\)/);
  nein("i1", "SELECT * FROM Kunde;", /keinen Index/);
  nein("i2", "CREATE INDEX uk ON Kunde (Email);", /nicht eindeutig/);
  ok("i2", "CREATE UNIQUE INDEX u ON Kunde (Email);");
  nein("i3", "CREATE INDEX x ON Bestellung (Datum, KundenNr);", /Reihenfolge/);
  ok("m1", "ALTER TABLE Kunde MODIFY COLUMN Ort VARCHAR(80);", "MODIFY COLUMN");
  nein("m1", "ALTER TABLE Kunde MODIFY Ort VARCHAR(60);", /80/);
  nein("m1", "DROP TABLE Bestellposition; DROP TABLE Bestellung; DROP TABLE Kunde; CREATE TABLE Kunde (KundenNr INTEGER PRIMARY KEY, Firma VARCHAR(60), Name VARCHAR(40) NOT NULL, Vorname VARCHAR(40), PLZ CHAR(5), Ort VARCHAR(80), Email VARCHAR(80), Registriert DATE);", /Daten|Zeilen/);
  ok("m2", "ALTER TABLE Artikel MODIFY Bestand INT NOT NULL DEFAULT 0;");
  nein("m2", "ALTER TABLE Artikel MODIFY Bestand INTEGER DEFAULT 0;", /NULL/);
  assert(/nicht leer|NOT NULL|leer/.test(fehler("UPDATE Artikel SET Bestand = NULL WHERE ArtikelNr = 1; ALTER TABLE Artikel MODIFY Bestand INTEGER NOT NULL;")), "NOT NULL trotz NULL-Werten scheitert verständlich");
  ok("m3", "ALTER TABLE Kunde CHANGE COLUMN PLZ Postleitzahl CHAR(5);");
  nein("m3", "ALTER TABLE Kunde ADD Postleitzahl CHAR(5);", /PLZ/);
  assert.strictEqual(wert("ALTER TABLE Kunde CHANGE PLZ Postleitzahl CHAR(5); SELECT Postleitzahl FROM Kunde WHERE KundenNr = 10;"), "01067", "Daten bleiben nach CHANGE");
  assert.strictEqual(wert("ALTER TABLE Kunde MODIFY Ort VARCHAR(80); SELECT COUNT(*) FROM Bestellung b JOIN Kunde k ON k.KundenNr = b.KundenNr;") > 0, true, "Fremdschlüssel/Join nach Umbau intakt");
  assert(/gibt es in Kunde nicht/.test(fehler("ALTER TABLE Kunde MODIFY Stadt VARCHAR(80);")));
  assert(/Datentyp/.test(fehler("ALTER TABLE Kunde MODIFY Ort;") + fehler("ALTER TABLE Kunde MODIFY Ort 80;")));
  ok("p2", "UPDATE Kunde SET Email = LOWER(TRIM(Email));", "ohne WHERE: NULL bleibt NULL");
  nein("p2", "UPDATE Kunde SET Email = LOWER(Email);");
  ok("p1", "UPDATE Kunde SET Name = UCASE(Name) WHERE Ort = 'Berlin';", "UCASE wie UPPER");
  nein("p3", "UPDATE Artikel SET Bezeichnung = CONCAT(Bezeichnung, '(Restposten)') WHERE Bestand < 3;");
  ok("p4", "UPDATE Kunde SET Ort = 'Köln' WHERE Ort = 'Koeln';", "auch ohne REPLACE richtig im Ergebnis");

  console.log("sql: " + D.AUFGABEN.length + " Aufgaben (" + vh.length + " Vorhersagen), Beiblatt-Funktionen, Muster-Prüfung, Varianten, Fehler und Warnungen OK");
}).catch(e => { console.error(e); process.exit(1); });
