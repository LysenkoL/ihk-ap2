/* ============================================================================
   gen/sql-daten.js — Datenbank und Aufgaben für den SQL-Trainer (gen/sql.js)
   ----------------------------------------------------------------------------
   Ein kleiner Online-Händler für IT-Ausstattung, wie er in AP2-Bögen
   vorkommt: Kunden, Artikel, Kategorien, Bestellungen mit Positionen und
   Mitarbeiter mit Vorgesetzten. Die Daten sind so gewählt, dass jede
   Aufgabe ein eindeutiges Ergebnis hat (keine Gleichstände beim Sortieren,
   Kunden ohne Bestellung, Kategorie ohne Artikel, Artikel ohne Bestellung,
   NULL-Werte bei Firma und E-Mail).

   Drei Datenbanken (DBS):
     shop     Online-Händler (SCHEMA, wie bisher; Standard)
     service  IT-Systemhaus: Firma, Lieferant, Techniker, Ticket, Geraet —
              mit Datum + Uhrzeit, Codes für LEFT/RIGHT, NULL-Werten
     mini     winzige Tabellen zum Nachrechnen (Ergebnis vorhersagen)

   Aufgabe:
     id, thema, stufe (1–3), titel, text, loesung (SQL)
     db:      "shop" (Standard) | "service" | "mini"
     art:     "select"     Ergebnis vergleichen (Standard)
              "dml"        Tabelleninhalt danach vergleichen
              "ddl"        Tabellenaufbau prüfen (ddl: {…})
              "view"       Sicht vorhanden + Inhalt vergleichen
              "muster"     CREATE USER / GRANT / REVOKE — SQLite kann das nicht
                           ausführen; Prüfung nach Muster (muster: [{art, …}])
              "vorhersage" Abfrage lesen, Ergebnis bestimmen:
                           frage "wahl" (optionen + richtig), "zeilen" oder
                           "wert" (antwort); zeigen = Tabellen bzw. {titel, sql}
     ordnung: Reihenfolge zählt (ORDER BY verlangt)
     vorher:  SQL, das vor deiner Lösung läuft
     beispiel: Ergebnisbeispiel wie im Prüfungsbogen — Zahl n (die ersten n
              Zeilen der Musterlösung, nie alle) oder { n, sql, titel }
     hinweis: zusätzlicher „Hinweis:“ wie in der Prüfung
     genau:   Texte exakt vergleichen (Leerzeichen am Rand zählen)
     jetzt:   fester Zeitpunkt für NOW() in dieser Aufgabe
     tipp, ru (kurzer Merksatz auf Russisch)
   Alle neuen Aufgaben (n…, r…, v…) sind eigene Übungen, keine IHK-Originale.
   ========================================================================== */
"use strict";

(function (root) {
  const SCHEMA = `
CREATE TABLE Kunde (
  KundenNr    INTEGER PRIMARY KEY,
  Firma       VARCHAR(60),
  Name        VARCHAR(40) NOT NULL,
  Vorname     VARCHAR(40),
  PLZ         CHAR(5),
  Ort         VARCHAR(40),
  Email       VARCHAR(80),
  Registriert DATE
);
CREATE TABLE Kategorie (
  KategorieNr INTEGER PRIMARY KEY,
  Bezeichnung VARCHAR(40) NOT NULL
);
CREATE TABLE Artikel (
  ArtikelNr   INTEGER PRIMARY KEY,
  Bezeichnung VARCHAR(60) NOT NULL,
  KategorieNr INTEGER REFERENCES Kategorie(KategorieNr),
  Preis       DECIMAL(8,2) NOT NULL,
  Bestand     INTEGER DEFAULT 0
);
CREATE TABLE Bestellung (
  BestellNr INTEGER PRIMARY KEY,
  KundenNr  INTEGER NOT NULL REFERENCES Kunde(KundenNr),
  Datum     DATE NOT NULL,
  Status    VARCHAR(20)
);
CREATE TABLE Bestellposition (
  BestellNr INTEGER REFERENCES Bestellung(BestellNr),
  ArtikelNr INTEGER REFERENCES Artikel(ArtikelNr),
  Menge     INTEGER NOT NULL,
  PRIMARY KEY (BestellNr, ArtikelNr)
);
CREATE TABLE Mitarbeiter (
  PersNr         INTEGER PRIMARY KEY,
  Name           VARCHAR(40),
  Vorname        VARCHAR(40),
  Abteilung      VARCHAR(30),
  Gehalt         DECIMAL(8,2),
  Eintritt       DATE,
  VorgesetzterNr INTEGER REFERENCES Mitarbeiter(PersNr)
);

INSERT INTO Kunde VALUES
 (1,'Müller Bau GmbH','Müller','Stefan','50667','Köln','s.mueller@muellerbau.de','2023-03-14'),
 (2,NULL,'Schneider','Anna','80331','München','anna.schneider@web.de','2024-01-09'),
 (3,'Praxis Dr. Weber','Weber','Thomas','50674','Köln',NULL,'2022-11-02'),
 (4,NULL,'Fischer','Julia','10115','Berlin','julia.f@gmx.de','2025-06-21'),
 (5,'Wagner Logistik KG','Wagner','Michael','20095','Hamburg','einkauf@wagner-logistik.de','2021-08-30'),
 (6,NULL,'Becker','Laura','50823','Köln','laura.becker@t-online.de','2025-02-17'),
 (7,'Hoffmann IT-Service','Hoffmann','Jan','40210','Düsseldorf','info@hoffmann-it.de','2024-09-05'),
 (8,NULL,'Schulz','Mehmet','80335','München',NULL,'2026-01-12'),
 (9,'Kanzlei Koch & Partner','Koch','Sabine','10117','Berlin','kanzlei@koch-partner.de','2023-05-23'),
 (10,NULL,'Richter','Paul','01067','Dresden','paul.richter@gmail.com','2026-03-03');

INSERT INTO Kategorie VALUES
 (1,'Notebooks'),(2,'Monitore'),(3,'Zubehör'),(4,'Netzwerk'),(5,'Software');

INSERT INTO Artikel VALUES
 (1,'ProBook 450 G10',1,899.00,12),
 (2,'ThinkPad E14',1,749.00,5),
 (3,'MacBook Air 13',1,1199.00,0),
 (4,'Monitor 24 Zoll Full HD',2,229.00,20),
 (5,'Monitor 27 Zoll 4K',2,389.00,7),
 (6,'Logitech MX Keys',3,109.99,30),
 (7,'Logitech MX Master 3S',3,99.99,25),
 (8,'USB-C Dockingstation',3,189.00,3),
 (9,'Headset Jabra Evolve2 40',3,79.90,0),
 (10,'Switch 24 Port Gigabit',4,249.00,4),
 (11,'WLAN Access Point AX3000',4,159.00,9),
 (12,'Patchkabel Cat6 2m',4,4.99,200),
 (13,'Webcam Full HD',3,59.00,14),
 (14,'Monitorarm Doppel',3,89.00,6);

INSERT INTO Bestellung VALUES
 (1001,1,'2025-02-10','versandt'),
 (1002,3,'2025-03-05','versandt'),
 (1003,5,'2025-05-19','versandt'),
 (1004,2,'2025-07-01','storniert'),
 (1005,1,'2025-09-12','versandt'),
 (1006,7,'2025-11-28','versandt'),
 (1007,4,'2026-01-15','versandt'),
 (1008,5,'2026-02-02','versandt'),
 (1009,9,'2026-03-20','versandt'),
 (1010,6,'2026-05-08','offen'),
 (1011,1,'2026-06-30','offen'),
 (1012,7,'2026-07-14','offen');

INSERT INTO Bestellposition VALUES
 (1001,1,3),(1001,6,3),(1001,7,3),
 (1002,2,1),(1002,4,2),
 (1003,10,2),(1003,12,50),(1003,11,4),
 (1004,3,1),
 (1005,4,5),(1005,8,5),
 (1006,11,2),(1006,12,20),(1006,7,1),
 (1007,3,1),(1007,7,1),
 (1008,1,10),(1008,5,10),(1008,6,10),(1008,7,10),
 (1009,2,2),(1009,9,2),
 (1010,5,1),
 (1011,8,3),(1011,12,10),
 (1012,10,1),(1012,9,4);

INSERT INTO Mitarbeiter VALUES
 (1,'Krause','Heike','Geschäftsleitung',7800,'2012-04-01',NULL),
 (2,'Neumann','Tobias','Vertrieb',4200,'2016-09-01',1),
 (3,'Lang','Miriam','Vertrieb',3650,'2021-02-15',2),
 (4,'Yilmaz','Deniz','IT',4600,'2018-07-01',1),
 (5,'Hartmann','Sophie','IT',3100,'2025-08-01',4),
 (6,'Braun','Felix','Lager',2900,'2019-03-01',1),
 (7,'Zimmer','Olga','Lager',2750,'2023-10-01',6),
 (8,'Wolf','Kevin','IT',3900,'2020-01-15',4);

CREATE TABLE Projekt (
  ProjektNr INTEGER PRIMARY KEY,
  Titel     VARCHAR(60) NOT NULL,
  Start     DATE,
  Budget    DECIMAL(10,2)
);
CREATE TABLE Projektmitarbeit (
  PersNr    INTEGER REFERENCES Mitarbeiter(PersNr),
  ProjektNr INTEGER REFERENCES Projekt(ProjektNr),
  Stunden   INTEGER NOT NULL,
  PRIMARY KEY (PersNr, ProjektNr)
);

INSERT INTO Projekt VALUES
 (1,'Webshop-Relaunch','2025-09-01',48000),
 (2,'Lagerverwaltung','2025-11-15',32000),
 (3,'Cloud-Migration','2026-02-01',60000),
 (4,'Kundenportal','2026-06-01',25000);

INSERT INTO Projektmitarbeit VALUES
 (4,1,120),(5,1,80),(8,1,60),
 (4,3,40),(8,3,150),
 (6,2,90),(7,2,70),(2,2,20);
`;

  /* Für die Schema-Ansicht: Kurzbeschreibung je Tabelle */
  const TABELLEN = {
    Kunde: "Privat- und Firmenkunden. Firma und Email dürfen leer (NULL) sein.",
    Kategorie: "Warengruppen. „Software“ hat noch keine Artikel.",
    Artikel: "Sortiment mit Preis (netto) und Lagerbestand.",
    Bestellung: "Kopf der Bestellung. Status: offen, versandt oder storniert.",
    Bestellposition: "Welche Artikel in welcher Menge zu einer Bestellung gehören. Schlüssel aus zwei Spalten.",
    Mitarbeiter: "Beschäftigte. VorgesetzterNr verweist auf einen anderen Mitarbeiter (NULL = Geschäftsleitung).",
    Projekt: "IT-Projekte der Firma. „Kundenportal“ hat noch niemanden.",
    Projektmitarbeit: "Zwischentabelle (n:m): Wer arbeitet wie viele Stunden in welchem Projekt. Schlüssel aus zwei Spalten."
  };

  /* ------------------------------------------------------------------
     Zweite Datenbank: ein kleines IT-Systemhaus (Tickets, Geräte).
     Eingang/Erledigt mit Uhrzeit ('JJJJ-MM-TT hh:mm'). Erledigt NULL =
     offen, TechNr NULL = noch niemand zugeordnet, Bewertung NULL = nicht
     bewertet. Wagner (Azubi) hat kein Team und kein Ticket, die
     Stadtbibliothek kein Ticket. Bei NB-2025-012 weicht das Jahr in der
     InventarNr vom Kaufjahr ab (inventarisiert im Folgejahr).
     ------------------------------------------------------------------ */
  const SERVICE = `
CREATE TABLE Firma (
  FirmaNr         INTEGER PRIMARY KEY,
  Firmenname      VARCHAR(60) NOT NULL,
  Ort             VARCHAR(40),
  Ansprechpartner VARCHAR(60)
);
CREATE TABLE Lieferant (
  LieferantNr INTEGER PRIMARY KEY,
  Firmenname  VARCHAR(60) NOT NULL,
  Ort         VARCHAR(40)
);
CREATE TABLE Techniker (
  TechNr      INTEGER PRIMARY KEY,
  Name        VARCHAR(40) NOT NULL,
  Vorname     VARCHAR(40),
  Team        VARCHAR(20),
  Stundensatz DECIMAL(6,2),
  Eintritt    DATE
);
CREATE TABLE Ticket (
  TicketNr   INTEGER PRIMARY KEY,
  FirmaNr    INTEGER NOT NULL REFERENCES Firma(FirmaNr),
  TechNr     INTEGER REFERENCES Techniker(TechNr),
  Kategorie  VARCHAR(20),
  Prioritaet INTEGER,
  Eingang    DATETIME NOT NULL,
  Erledigt   DATETIME,
  Bewertung  INTEGER
);
CREATE TABLE Geraet (
  InventarNr     CHAR(11) PRIMARY KEY,
  FirmaNr        INTEGER REFERENCES Firma(FirmaNr),
  Bezeichnung    VARCHAR(60) NOT NULL,
  Kaufdatum      DATE,
  GarantieMonate INTEGER,
  Preis          DECIMAL(8,2)
);

INSERT INTO Firma VALUES
 (1,'Druckerei Hahn','Leipzig','Julia Hahn'),
 (2,'Kanzlei Roth','Halle','Peter Roth'),
 (3,'Praxis Dr. Lorenz','Leipzig','Maria Lorenz'),
 (4,'Bäckerei Engel','Taucha','Karl Engel'),
 (5,'Stadtbibliothek Grimma','Grimma','Anna Vogt');

INSERT INTO Lieferant VALUES
 (1,'Netzwerk-Profi GmbH','Leipzig'),
 (2,'Druckerwelt','Halle'),
 (3,'Office Direkt','Dresden');

INSERT INTO Techniker VALUES
 (1,'Becker','Lena','Netzwerk',68.00,'2019-04-01'),
 (2,'Kraus','Tom','Support',52.00,'2022-09-15'),
 (3,'Nowak','Ewa','Support',58.00,'2021-02-01'),
 (4,'Schulze','Ben','Netzwerk',74.00,'2016-11-01'),
 (5,'Wagner','Mia',NULL,38.00,'2025-08-01');

INSERT INTO Ticket VALUES
 (101,1,2,'Hardware',2,'2025-11-04 09:10','2025-11-05 11:40',4),
 (102,2,4,'Netzwerk',1,'2025-12-15 08:05','2025-12-15 10:35',5),
 (103,3,3,'Software',3,'2025-12-29 14:00','2026-01-08 16:30',3),
 (104,1,1,'Netzwerk',1,'2026-01-12 07:40','2026-01-12 09:10',5),
 (105,4,2,'Hardware',2,'2026-01-24 10:15','2026-01-27 12:00',NULL),
 (106,3,1,'Netzwerk',2,'2026-02-03 18:20','2026-02-04 09:00',4),
 (107,2,3,'Software',3,'2026-02-17 11:00','2026-02-20 15:00',2),
 (108,1,2,'Software',1,'2026-03-02 08:30','2026-03-02 09:15',4),
 (109,4,1,'Netzwerk',2,'2026-03-08 10:00','2026-03-09 13:30',NULL),
 (110,2,NULL,'Hardware',3,'2026-03-26 16:45',NULL,NULL),
 (111,3,3,'Hardware',1,'2026-04-07 09:00',NULL,NULL),
 (112,1,NULL,'Software',2,'2026-04-11 19:30',NULL,NULL);

INSERT INTO Geraet VALUES
 ('NB-2023-004',1,'Notebook 15 Zoll','2023-05-10',24,899.00),
 ('DR-2022-011',1,'Laserdrucker A4','2022-11-21',36,649.00),
 ('PC-2024-002',2,'Mini-PC','2024-02-15',24,749.00),
 ('MO-2024-007',3,'Monitor 27 Zoll','2024-06-03',36,289.00),
 ('NB-2025-012',3,'Notebook 14 Zoll','2024-12-20',24,829.00),
 ('RT-2021-001',4,'WLAN-Router','2021-09-01',24,219.00),
 ('DR-2025-003',4,'Etikettendrucker','2025-10-06',12,189.00),
 ('PC-2025-019',5,'Ausleih-PC','2025-03-12',36,699.00);
`;
  const SERVICE_TABELLEN = {
    Firma: "Kundenfirmen. Der Ansprechpartner steht als „Vorname Nachname“ in einer Spalte.",
    Lieferant: "Lieferanten für Hardware und Material.",
    Techniker: "Mitarbeiter im Außendienst. Wagner ist Azubi: noch ohne Team und ohne Ticket.",
    Ticket: "Störungsmeldungen. Erledigt NULL = noch offen, TechNr NULL = noch niemand zugeordnet, Bewertung 1–5 (NULL = nicht bewertet). Prioritaet 1 = hoch.",
    Geraet: "Betreute Geräte. InventarNr = Typkürzel-Jahr-Nummer, z. B. NB-2023-004."
  };

  /* Winzige Tabellen zum Nachrechnen: Dietz ohne Abteilung, Brandt ohne
     Gehalt, Vertrieb ohne Personen. */
  const MINI = `
CREATE TABLE Abteilung (
  AbtNr       INTEGER PRIMARY KEY,
  Bezeichnung VARCHAR(30) NOT NULL
);
CREATE TABLE Person (
  PersNr INTEGER PRIMARY KEY,
  Name   VARCHAR(30) NOT NULL,
  AbtNr  INTEGER REFERENCES Abteilung(AbtNr),
  Gehalt DECIMAL(8,2),
  Ort    VARCHAR(30)
);
CREATE TABLE Standort (
  StandortNr INTEGER PRIMARY KEY,
  Ort        VARCHAR(30) NOT NULL
);
INSERT INTO Abteilung VALUES (1,'Einkauf'),(2,'IT'),(3,'Vertrieb');
INSERT INTO Person VALUES
 (1,'Arndt',2,3200,'Leipzig'),
 (2,'Brandt',2,NULL,'Halle'),
 (3,'Claus',1,2800,'Leipzig'),
 (4,'Dietz',NULL,3000,'Leipzig'),
 (5,'Ernst',2,3600,'Halle');
INSERT INTO Standort VALUES (1,'Leipzig'),(2,'Dresden');
`;
  const MINI_TABELLEN = {
    Abteilung: "Drei Abteilungen. Im Vertrieb arbeitet noch niemand.",
    Person: "Fünf Personen. Dietz hat keine Abteilung (NULL), bei Brandt fehlt das Gehalt (NULL).",
    Standort: "Zwei Standorte der Firma."
  };

  const THEMEN = [
    { key: "grund", name: "Grundlagen" },
    { key: "filter", name: "WHERE" },
    { key: "sort", name: "Sortieren" },
    { key: "agg", name: "Gruppieren" },
    { key: "join", name: "JOIN" },
    { key: "sub", name: "Unterabfragen" },
    { key: "mengen", name: "UNION & DISTINCT" },
    { key: "text", name: "Text & Datum" },
    { key: "dml", name: "Daten ändern" },
    { key: "ddl", name: "Tabellen anlegen" },
    { key: "rechte", name: "Rechte" },
    { key: "vorhersage", name: "Ergebnis vorhersagen" }
  ];

  const LIEFERANT = "CREATE TABLE Lieferant (LieferantNr INTEGER PRIMARY KEY, Firma VARCHAR(60) NOT NULL, Ort VARCHAR(40), Telefon VARCHAR(20));";

  const AUFGABEN = [
    /* --------------------------------------------------------- Grundlagen */
    { id: "g1", thema: "grund", stufe: 1, titel: "Spalten auswählen",
      text: "Geben Sie Name, Vorname und Ort aller Kunden aus.",
      loesung: "SELECT Name, Vorname, Ort\nFROM Kunde;",
      tipp: "SELECT Spalte1, Spalte2 FROM Tabelle;",
      ru: "SELECT — какие столбцы, FROM — из какой таблицы. Столбцы через запятую, после последнего запятой нет." },
    { id: "g2", thema: "grund", stufe: 1, titel: "Berechnete Spalte mit Alias",
      text: "Geben Sie für jeden Artikel die Bezeichnung und den Lagerwert (Bestand × Preis) aus. Die berechnete Spalte soll „Lagerwert“ heißen.",
      loesung: "SELECT Bezeichnung, Bestand * Preis AS Lagerwert\nFROM Artikel;",
      tipp: "Rechnen direkt im SELECT, Name mit AS vergeben.",
      ru: "В SELECT можно считать (*, +, -, /). AS даёт столбцу понятное имя (псевдоним)." },
    { id: "g3", thema: "grund", stufe: 2, titel: "Texte verbinden",
      text: "Geben Sie für alle Mitarbeiter den vollständigen Namen in einer Spalte aus, im Format „Vorname Name“ (z. B. „Heike Krause“). Die Spalte soll „Mitarbeiter“ heißen.",
      loesung: "SELECT Vorname || ' ' || Name AS Mitarbeiter\nFROM Mitarbeiter;",
      tipp: "Standard-SQL: Vorname || ' ' || Name. In MySQL: CONCAT(Vorname, ' ', Name) — geht hier auch.",
      ru: "Склейка строк: || (стандарт) или CONCAT() (MySQL). Пробел — отдельной строкой ' '." },
    { id: "g4", thema: "grund", stufe: 2, titel: "NULL ersetzen",
      text: "Geben Sie Name und Firma aller Kunden aus. Ist keine Firma eingetragen, soll stattdessen „privat“ erscheinen.",
      loesung: "SELECT Name, COALESCE(Firma, 'privat') AS Firma\nFROM Kunde;",
      tipp: "COALESCE(Spalte, Ersatz) nimmt den ersten Wert, der nicht NULL ist. MySQL kennt auch IFNULL.",
      ru: "COALESCE(a, b) — вернёт a, если он не NULL, иначе b. Удобно для пустых полей." },
    { id: "g5", thema: "grund", stufe: 2, titel: "Fallunterscheidung mit CASE",
      text: "Geben Sie Bezeichnung und Bestand aller Artikel aus und dazu eine Spalte „Lager“: „ausverkauft“ bei Bestand 0, „knapp“ bei einem Bestand unter 5, sonst „ok“.",
      loesung: "SELECT Bezeichnung, Bestand,\n  CASE WHEN Bestand = 0 THEN 'ausverkauft'\n       WHEN Bestand < 5 THEN 'knapp'\n       ELSE 'ok' END AS Lager\nFROM Artikel;",
      tipp: "CASE WHEN Bedingung THEN Wert WHEN … ELSE Wert END — die erste zutreffende Bedingung zählt.",
      ru: "CASE WHEN … THEN … ELSE … END — как if/else прямо в запросе. Проверяется сверху вниз." },

    /* --------------------------------------------------------------- WHERE */
    { id: "w1", thema: "filter", stufe: 1, titel: "Einfache Bedingung",
      text: "Geben Sie alle Angaben (alle Spalten) zu den Kunden aus Köln aus.",
      loesung: "SELECT *\nFROM Kunde\nWHERE Ort = 'Köln';",
      tipp: "Texte stehen in einfachen Anführungszeichen: 'Köln'.",
      ru: "WHERE фильтрует строки. Текст — в одинарных кавычках. * = все столбцы." },
    { id: "w2", thema: "filter", stufe: 1, titel: "Vergleich mit Zahl",
      text: "Geben Sie Bezeichnung und Preis aller Artikel aus, die weniger als 100 € kosten.",
      loesung: "SELECT Bezeichnung, Preis\nFROM Artikel\nWHERE Preis < 100;",
      tipp: "Zahlen ohne Anführungszeichen und ohne €-Zeichen, Dezimalpunkt statt Komma.",
      ru: "Числа пишем без кавычек и без €, дробную часть — через точку (99.99)." },
    { id: "w3", thema: "filter", stufe: 2, titel: "AND verknüpfen",
      text: "Geben Sie ArtikelNr, Bezeichnung und Bestand aller Artikel aus, deren Bestand unter 5 liegt und die mehr als 150 € kosten.",
      loesung: "SELECT ArtikelNr, Bezeichnung, Bestand\nFROM Artikel\nWHERE Bestand < 5 AND Preis > 150;",
      tipp: "Beide Bedingungen müssen gelten → AND.",
      ru: "AND — должны выполняться оба условия, OR — хотя бы одно." },
    { id: "w4", thema: "filter", stufe: 1, titel: "LIKE",
      text: "Geben Sie Bezeichnung und Preis aller Artikel aus, deren Bezeichnung „Logitech“ enthält.",
      loesung: "SELECT Bezeichnung, Preis\nFROM Artikel\nWHERE Bezeichnung LIKE '%Logitech%';",
      tipp: "% steht für beliebig viele Zeichen, _ für genau ein Zeichen.",
      ru: "LIKE ищет по шаблону: % — любое количество символов, _ — ровно один." },
    { id: "w5", thema: "filter", stufe: 1, titel: "IS NULL",
      text: "Geben Sie KundenNr, Name und Vorname aller Kunden aus, für die keine E-Mail-Adresse gespeichert ist.",
      loesung: "SELECT KundenNr, Name, Vorname\nFROM Kunde\nWHERE Email IS NULL;",
      tipp: "Mit NULL vergleicht man nie mit =, sondern mit IS NULL / IS NOT NULL.",
      ru: "NULL — «нет значения». Сравнивать только IS NULL / IS NOT NULL, «= NULL» никогда не срабатывает." },
    { id: "w6", thema: "filter", stufe: 1, titel: "BETWEEN mit Datum",
      text: "Geben Sie BestellNr und Datum aller Bestellungen aus dem Jahr 2025 aus.",
      loesung: "SELECT BestellNr, Datum\nFROM Bestellung\nWHERE Datum BETWEEN '2025-01-01' AND '2025-12-31';",
      tipp: "Datum als Text im Format 'JJJJ-MM-TT'. BETWEEN schließt beide Grenzen ein. YEAR(Datum) = 2025 geht hier auch.",
      ru: "Дата пишется как 'ГГГГ-ММ-ДД'. BETWEEN включает обе границы." },
    { id: "w7", thema: "filter", stufe: 1, titel: "IN-Liste",
      text: "Geben Sie Name und Ort aller Kunden aus Berlin, Hamburg oder München aus.",
      loesung: "SELECT Name, Ort\nFROM Kunde\nWHERE Ort IN ('Berlin', 'Hamburg', 'München');",
      tipp: "IN (…) ersetzt mehrere OR-Bedingungen.",
      ru: "IN ('a','b','c') — короче, чем три условия через OR." },

    /* ----------------------------------------------------------- Sortieren */
    { id: "o1", thema: "sort", stufe: 1, titel: "ORDER BY absteigend", ordnung: true,
      text: "Geben Sie Bezeichnung und Preis aller Artikel aus — der teuerste Artikel zuerst.",
      loesung: "SELECT Bezeichnung, Preis\nFROM Artikel\nORDER BY Preis DESC;",
      tipp: "ASC = aufsteigend (Standard), DESC = absteigend.",
      ru: "ORDER BY сортирует: ASC — по возрастанию (по умолчанию), DESC — по убыванию." },
    { id: "o2", thema: "sort", stufe: 2, titel: "Nach zwei Spalten sortieren", ordnung: true,
      text: "Geben Sie Abteilung, Name und Gehalt aller Mitarbeiter aus, sortiert nach Abteilung (A–Z) und innerhalb der Abteilung nach Gehalt, das höchste zuerst.",
      loesung: "SELECT Abteilung, Name, Gehalt\nFROM Mitarbeiter\nORDER BY Abteilung ASC, Gehalt DESC;",
      tipp: "ORDER BY Spalte1 ASC, Spalte2 DESC — die zweite Spalte entscheidet nur bei Gleichstand der ersten.",
      ru: "Сортировка по нескольким столбцам: второй работает только внутри одинаковых значений первого." },
    { id: "o3", thema: "sort", stufe: 1, titel: "DISTINCT", ordnung: true,
      text: "Aus welchen Orten kommen die Kunden? Geben Sie jeden Ort nur einmal aus, alphabetisch sortiert.",
      loesung: "SELECT DISTINCT Ort\nFROM Kunde\nORDER BY Ort;",
      tipp: "DISTINCT direkt hinter SELECT entfernt doppelte Zeilen.",
      ru: "DISTINCT убирает повторы в результате." },
    { id: "o4", thema: "sort", stufe: 2, titel: "Die drei teuersten", ordnung: true,
      text: "Geben Sie Bezeichnung und Preis der drei teuersten Artikel aus.",
      loesung: "SELECT Bezeichnung, Preis\nFROM Artikel\nORDER BY Preis DESC\nLIMIT 3;",
      tipp: "Erst sortieren, dann begrenzen: LIMIT 3 (MySQL). MS SQL: SELECT TOP 3 …, Standard: FETCH FIRST 3 ROWS ONLY.",
      ru: "Сначала ORDER BY, потом LIMIT. В MS SQL вместо LIMIT пишут TOP 3 после SELECT." },

    /* ---------------------------------------------------------- Gruppieren */
    { id: "a1", thema: "agg", stufe: 1, titel: "Zählen",
      text: "Wie viele Kunden sind gespeichert? Geben Sie nur die Anzahl aus.",
      loesung: "SELECT COUNT(*) AS Anzahl\nFROM Kunde;",
      tipp: "COUNT(*) zählt Zeilen.",
      ru: "COUNT(*) считает строки." },
    { id: "a2", thema: "agg", stufe: 2, titel: "COUNT(Spalte) und NULL",
      text: "Wie viele Kunden haben eine E-Mail-Adresse hinterlegt? Geben Sie nur die Anzahl aus.",
      loesung: "SELECT COUNT(Email) AS Anzahl\nFROM Kunde;",
      tipp: "COUNT(Spalte) zählt nur Zeilen, in denen die Spalte nicht NULL ist.",
      ru: "COUNT(столбец) не считает NULL, COUNT(*) считает всё." },
    { id: "a3", thema: "agg", stufe: 1, titel: "MIN, MAX, AVG",
      text: "Geben Sie den niedrigsten, den höchsten und den durchschnittlichen Artikelpreis aus (drei Spalten in dieser Reihenfolge).",
      loesung: "SELECT MIN(Preis), MAX(Preis), AVG(Preis)\nFROM Artikel;",
      tipp: "Aggregatfunktionen: COUNT, SUM, AVG, MIN, MAX.",
      ru: "Агрегатные функции сводят много строк в одно значение: COUNT, SUM, AVG, MIN, MAX." },
    { id: "a4", thema: "agg", stufe: 2, titel: "GROUP BY",
      text: "Geben Sie für jeden Ort die Anzahl der Kunden aus (Ort, Anzahl).",
      loesung: "SELECT Ort, COUNT(*) AS Anzahl\nFROM Kunde\nGROUP BY Ort;",
      tipp: "Jede Spalte im SELECT, die nicht in einer Aggregatfunktion steht, muss ins GROUP BY.",
      ru: "GROUP BY собирает строки в группы. Всё в SELECT без агрегатной функции должно стоять в GROUP BY." },
    { id: "a5", thema: "agg", stufe: 2, titel: "Summe und Schnitt je Gruppe",
      text: "Geben Sie für jede Abteilung die Gehaltssumme und das Durchschnittsgehalt aus (Abteilung, Summe, Durchschnitt).",
      loesung: "SELECT Abteilung, SUM(Gehalt) AS Summe, AVG(Gehalt) AS Durchschnitt\nFROM Mitarbeiter\nGROUP BY Abteilung;",
      tipp: "GROUP BY Abteilung, dann SUM und AVG.",
      ru: "SUM — сумма, AVG — среднее, считаются отдельно для каждой группы." },
    { id: "a6", thema: "agg", stufe: 2, titel: "HAVING",
      text: "Geben Sie alle Orte aus, in denen mindestens zwei Kunden wohnen — mit der Anzahl (Ort, Anzahl).",
      loesung: "SELECT Ort, COUNT(*) AS Anzahl\nFROM Kunde\nGROUP BY Ort\nHAVING COUNT(*) >= 2;",
      tipp: "Bedingungen auf Gruppen (COUNT, SUM …) gehören in HAVING, nicht in WHERE.",
      ru: "WHERE фильтрует строки ДО группировки, HAVING — группы ПОСЛЕ неё (условия с COUNT/SUM)." },
    { id: "a7", thema: "agg", stufe: 3, titel: "WHERE und GROUP BY",
      text: "Wie viele Bestellungen gibt es seit dem 01.01.2026 je Status? Geben Sie Status und Anzahl aus.",
      loesung: "SELECT Status, COUNT(*) AS Anzahl\nFROM Bestellung\nWHERE Datum >= '2026-01-01'\nGROUP BY Status;",
      tipp: "Reihenfolge: SELECT – FROM – WHERE – GROUP BY – HAVING – ORDER BY.",
      ru: "Порядок частей запроса: SELECT – FROM – WHERE – GROUP BY – HAVING – ORDER BY." },

    /* ---------------------------------------------------------------- JOIN */
    { id: "j1", thema: "join", stufe: 1, titel: "Zwei Tabellen verbinden",
      text: "Geben Sie zu jeder Bestellung BestellNr und Datum sowie Name und Ort des Kunden aus.",
      loesung: "SELECT b.BestellNr, b.Datum, k.Name, k.Ort\nFROM Bestellung b\nJOIN Kunde k ON k.KundenNr = b.KundenNr;",
      tipp: "JOIN … ON Fremdschlüssel = Primärschlüssel. Aliase (b, k) sparen Schreibarbeit.",
      ru: "JOIN соединяет таблицы по ключу: внешний ключ = первичный ключ. Без ON получится каждая строка с каждой." },
    { id: "j2", thema: "join", stufe: 2, titel: "Positionen einer Bestellung",
      text: "Geben Sie für die Bestellung 1008 die Bezeichnung, die Menge und den Einzelpreis jedes bestellten Artikels aus.",
      loesung: "SELECT a.Bezeichnung, p.Menge, a.Preis\nFROM Bestellposition p\nJOIN Artikel a ON a.ArtikelNr = p.ArtikelNr\nWHERE p.BestellNr = 1008;",
      tipp: "Bestellposition kennt die ArtikelNr, die Bezeichnung steht in Artikel.",
      ru: "Нужные данные в двух таблицах — соединяем через общий столбец ArtikelNr." },
    { id: "j3", thema: "join", stufe: 2, titel: "Bestellwert", ordnung: true,
      text: "Berechnen Sie den Gesamtwert (Menge × Preis) jeder Bestellung. Geben Sie BestellNr und Gesamtwert aus, der höchste Wert zuerst.",
      loesung: "SELECT p.BestellNr, SUM(p.Menge * a.Preis) AS Gesamtwert\nFROM Bestellposition p\nJOIN Artikel a ON a.ArtikelNr = p.ArtikelNr\nGROUP BY p.BestellNr\nORDER BY Gesamtwert DESC;",
      tipp: "Erst verbinden, dann GROUP BY BestellNr und SUM(Menge * Preis).",
      ru: "JOIN + GROUP BY + SUM: сначала соединяем, потом группируем по заказу и суммируем." },
    { id: "j4", thema: "join", stufe: 2, titel: "LEFT JOIN mit 0",
      text: "Geben Sie alle Kategorien mit der Anzahl ihrer Artikel aus (Bezeichnung, Anzahl). Kategorien ohne Artikel sollen mit 0 erscheinen.",
      loesung: "SELECT k.Bezeichnung, COUNT(a.ArtikelNr) AS Anzahl\nFROM Kategorie k\nLEFT JOIN Artikel a ON a.KategorieNr = k.KategorieNr\nGROUP BY k.KategorieNr, k.Bezeichnung;",
      tipp: "LEFT JOIN behält alle Zeilen der linken Tabelle. COUNT(a.ArtikelNr) statt COUNT(*), sonst steht bei „Software“ 1.",
      ru: "LEFT JOIN оставляет все строки левой таблицы, даже без пары. COUNT(столбец справа) даст 0, COUNT(*) дал бы 1." },
    { id: "j5", thema: "join", stufe: 2, titel: "Kunden ohne Bestellung",
      text: "Geben Sie KundenNr und Name aller Kunden aus, die noch nie bestellt haben.",
      loesung: "SELECT k.KundenNr, k.Name\nFROM Kunde k\nLEFT JOIN Bestellung b ON b.KundenNr = k.KundenNr\nWHERE b.BestellNr IS NULL;",
      tipp: "LEFT JOIN und dann die Zeilen ohne Partner: WHERE b.BestellNr IS NULL. Mit NOT IN oder NOT EXISTS geht es auch.",
      ru: "«У кого нет ни одного…» = LEFT JOIN + WHERE правая_таблица.ключ IS NULL (или NOT EXISTS)." },
    { id: "j6", thema: "join", stufe: 3, titel: "Selbstbezug: Vorgesetzte",
      text: "Geben Sie für jeden Mitarbeiter seinen Namen und den Namen seines Vorgesetzten aus (Mitarbeiter, Vorgesetzter). Auch die Geschäftsleitung ohne Vorgesetzten soll erscheinen.",
      loesung: "SELECT m.Name AS Mitarbeiter, v.Name AS Vorgesetzter\nFROM Mitarbeiter m\nLEFT JOIN Mitarbeiter v ON v.PersNr = m.VorgesetzterNr;",
      tipp: "Dieselbe Tabelle zweimal mit verschiedenen Aliasen (m, v). LEFT JOIN, damit Frau Krause nicht wegfällt.",
      ru: "Таблица соединяется сама с собой: два псевдонима (m — сотрудник, v — начальник)." },
    { id: "j7", thema: "join", stufe: 3, titel: "Umsatz je Kunde mit HAVING",
      text: "Geben Sie Name und Umsatz (Summe aus Menge × Preis) aller Kunden aus, deren Umsatz über 1.000 € liegt. Stornierte Bestellungen zählen nicht.",
      loesung: "SELECT k.Name, SUM(p.Menge * a.Preis) AS Umsatz\nFROM Kunde k\nJOIN Bestellung b ON b.KundenNr = k.KundenNr\nJOIN Bestellposition p ON p.BestellNr = b.BestellNr\nJOIN Artikel a ON a.ArtikelNr = p.ArtikelNr\nWHERE b.Status <> 'storniert'\nGROUP BY k.KundenNr, k.Name\nHAVING SUM(p.Menge * a.Preis) > 1000;",
      tipp: "Vier Tabellen: Kunde – Bestellung – Bestellposition – Artikel. Storno raus mit WHERE, die Grenze mit HAVING.",
      ru: "Цепочка JOIN по ключам; «не считать отменённые» — WHERE, «больше 1000» по сумме — HAVING." },
    { id: "j8", thema: "join", stufe: 3, titel: "Umsatz je Kategorie",
      text: "Geben Sie für jede Kategorie (Bezeichnung) den Umsatz aus versandten Bestellungen aus. Kategorien ohne Umsatz müssen nicht erscheinen.",
      loesung: "SELECT k.Bezeichnung, SUM(p.Menge * a.Preis) AS Umsatz\nFROM Kategorie k\nJOIN Artikel a ON a.KategorieNr = k.KategorieNr\nJOIN Bestellposition p ON p.ArtikelNr = a.ArtikelNr\nJOIN Bestellung b ON b.BestellNr = p.BestellNr\nWHERE b.Status = 'versandt'\nGROUP BY k.KategorieNr, k.Bezeichnung;",
      tipp: "Kategorie → Artikel → Bestellposition → Bestellung. Nur Status 'versandt'.",
      ru: "Путь по ключам через четыре таблицы, фильтр по статусу, группировка по категории." },
    { id: "j9", thema: "join", stufe: 2, titel: "n:m über die Zwischentabelle",
      text: "Geben Sie für jede Projektzuordnung den Namen des Mitarbeiters und den Titel des Projekts aus (Name, Titel).",
      loesung: "SELECT m.Name, p.Titel\nFROM Mitarbeiter m\nJOIN Projektmitarbeit pm ON pm.PersNr = m.PersNr\nJOIN Projekt p ON p.ProjektNr = pm.ProjektNr;",
      tipp: "Bei n:m führt der Weg immer über die Zwischentabelle: Mitarbeiter → Projektmitarbeit → Projekt, also zwei JOINs.",
      ru: "Многие-ко-многим всегда через промежуточную таблицу: два JOIN подряд." },
    { id: "j10", thema: "join", stufe: 2, titel: "Projekte ohne Mitarbeiter",
      text: "Geben Sie den Titel aller Projekte aus, denen noch kein Mitarbeiter zugeordnet ist.",
      loesung: "SELECT p.Titel\nFROM Projekt p\nLEFT JOIN Projektmitarbeit pm ON pm.ProjektNr = p.ProjektNr\nWHERE pm.PersNr IS NULL;",
      tipp: "Von der Tabelle ausgehen, die vollständig erscheinen soll (Projekt), LEFT JOIN auf die Zwischentabelle und dann die Zeilen ohne Partner: IS NULL.",
      ru: "«Проекты без сотрудников» = LEFT JOIN от Projekt к промежуточной таблице + WHERE … IS NULL." },
    { id: "j11", thema: "join", stufe: 3, titel: "Anzahl Projekte je Mitarbeiter (auch 0)",
      text: "Geben Sie für jeden Mitarbeiter den Namen und die Anzahl seiner Projekte aus (Name, Anzahl). Mitarbeiter ohne Projekt sollen mit 0 erscheinen. Sortieren Sie absteigend nach Anzahl, bei Gleichstand nach Name.",
      loesung: "SELECT m.Name, COUNT(pm.ProjektNr) AS Anzahl\nFROM Mitarbeiter m\nLEFT JOIN Projektmitarbeit pm ON pm.PersNr = m.PersNr\nGROUP BY m.PersNr, m.Name\nORDER BY Anzahl DESC, m.Name;",
      ordnung: true,
      tipp: "LEFT JOIN, damit niemand verloren geht, und COUNT(Spalte der rechten Tabelle) — COUNT(*) würde für Leute ohne Projekt 1 zählen.",
      ru: "Чтобы были и нули: LEFT JOIN + COUNT(столбец правой таблицы), а не COUNT(*)." },
    { id: "j12", thema: "join", stufe: 3, titel: "Stunden je Projekt mit HAVING",
      text: "Geben Sie Titel und Summe der geplanten Stunden aller Projekte aus, in denen insgesamt mehr als 185 Stunden geplant sind (Titel, Stunden).",
      loesung: "SELECT p.Titel, SUM(pm.Stunden) AS Stunden\nFROM Projekt p\nJOIN Projektmitarbeit pm ON pm.ProjektNr = p.ProjektNr\nGROUP BY p.ProjektNr, p.Titel\nHAVING SUM(pm.Stunden) > 185;",
      tipp: "Erst gruppieren, dann mit HAVING die Summe filtern — WHERE kennt die Summe noch nicht.",
      ru: "Условие на сумму группы — в HAVING, не в WHERE." },

    /* ------------------------------------------------------- Unterabfragen */
    { id: "u1", thema: "sub", stufe: 2, titel: "Über dem Durchschnitt",
      text: "Geben Sie Bezeichnung und Preis aller Artikel aus, die teurer sind als der Durchschnittspreis aller Artikel.",
      loesung: "SELECT Bezeichnung, Preis\nFROM Artikel\nWHERE Preis > (SELECT AVG(Preis) FROM Artikel);",
      tipp: "Aggregat im WHERE geht nicht direkt — aber als Unterabfrage in Klammern.",
      ru: "В WHERE нельзя написать AVG напрямую, но можно подзапрос в скобках: (SELECT AVG(…) FROM …)." },
    { id: "u2", thema: "sub", stufe: 2, titel: "NOT IN",
      text: "Geben Sie ArtikelNr und Bezeichnung aller Artikel aus, die noch nie bestellt wurden.",
      loesung: "SELECT ArtikelNr, Bezeichnung\nFROM Artikel\nWHERE ArtikelNr NOT IN (SELECT ArtikelNr FROM Bestellposition);",
      tipp: "Die Unterabfrage liefert alle bestellten ArtikelNr, NOT IN nimmt den Rest.",
      ru: "NOT IN (подзапрос) — все, кого нет в списке из подзапроса." },
    { id: "u3", thema: "sub", stufe: 3, titel: "EXISTS",
      text: "Geben Sie Name und Vorname aller Kölner Kunden aus, die mindestens eine offene Bestellung haben.",
      loesung: "SELECT k.Name, k.Vorname\nFROM Kunde k\nWHERE k.Ort = 'Köln'\n  AND EXISTS (SELECT * FROM Bestellung b\n              WHERE b.KundenNr = k.KundenNr AND b.Status = 'offen');",
      tipp: "EXISTS (Unterabfrage) ist wahr, sobald die Unterabfrage mindestens eine Zeile findet. Sie bezieht sich auf k aus der äußeren Abfrage.",
      ru: "EXISTS — «есть хотя бы одна строка». Подзапрос ссылается на внешнюю таблицу (коррелированный)." },
    { id: "u4", thema: "sub", stufe: 3, titel: "Spitzenverdiener je Abteilung",
      text: "Geben Sie für jede Abteilung den Mitarbeiter mit dem höchsten Gehalt aus (Abteilung, Name, Gehalt).",
      loesung: "SELECT m.Abteilung, m.Name, m.Gehalt\nFROM Mitarbeiter m\nWHERE m.Gehalt = (SELECT MAX(m2.Gehalt) FROM Mitarbeiter m2\n                  WHERE m2.Abteilung = m.Abteilung);",
      tipp: "Korrelierte Unterabfrage: das Maximum der eigenen Abteilung.",
      ru: "Подзапрос считает максимум для отдела текущей строки (m2.Abteilung = m.Abteilung)." },

    /* -------------------------------------------------------- Daten ändern */
    { id: "d1", thema: "dml", stufe: 1, art: "dml", titel: "INSERT",
      text: "Legen Sie einen neuen Kunden an: KundenNr 11, Emma Klein, Privatkundin (keine Firma), 50672 Köln, E-Mail emma.klein@posteo.de, registriert am 30.09.2026.",
      loesung: "INSERT INTO Kunde (KundenNr, Firma, Name, Vorname, PLZ, Ort, Email, Registriert)\nVALUES (11, NULL, 'Klein', 'Emma', '50672', 'Köln', 'emma.klein@posteo.de', '2026-09-30');",
      tipp: "INSERT INTO Tabelle (Spalten …) VALUES (Werte …); — PLZ ist Text ('50672'), das Datum als '2026-09-30'.",
      ru: "INSERT INTO таблица (столбцы) VALUES (значения) — порядок значений = порядок столбцов." },
    { id: "d2", thema: "dml", stufe: 1, art: "dml", titel: "UPDATE",
      text: "Alle Artikel der Kategorie „Zubehör“ (KategorieNr 3) werden um 5 % teurer. Ändern Sie die Preise.",
      loesung: "UPDATE Artikel\nSET Preis = Preis * 1.05\nWHERE KategorieNr = 3;",
      tipp: "UPDATE Tabelle SET Spalte = neuer Wert WHERE …; — ohne WHERE trifft es ALLE Zeilen.",
      ru: "UPDATE … SET … WHERE … — без WHERE изменятся все строки таблицы!" },
    { id: "d3", thema: "dml", stufe: 1, art: "dml", titel: "DELETE",
      text: "Löschen Sie den Kunden mit der KundenNr 10 (Paul Richter hat nie bestellt).",
      loesung: "DELETE FROM Kunde\nWHERE KundenNr = 10;",
      tipp: "DELETE FROM Tabelle WHERE …;",
      ru: "DELETE FROM … WHERE … — удаляет строки. Без WHERE удалит всё." },
    { id: "d4", thema: "dml", stufe: 3, art: "dml", titel: "UPDATE mit Unterabfrage",
      text: "Alle offenen Bestellungen von Kunden aus Köln wurden heute verschickt. Setzen Sie ihren Status auf „versandt“.",
      loesung: "UPDATE Bestellung\nSET Status = 'versandt'\nWHERE Status = 'offen'\n  AND KundenNr IN (SELECT KundenNr FROM Kunde WHERE Ort = 'Köln');",
      tipp: "Der Ort steht in Kunde, der Status in Bestellung → Unterabfrage mit IN.",
      ru: "В UPDATE нельзя просто JOIN (по стандарту) — берём подзапрос: KundenNr IN (SELECT …)." },
    { id: "d5", thema: "dml", stufe: 3, art: "dml", titel: "Löschen trotz Fremdschlüssel",
      text: "Löschen Sie alle stornierten Bestellungen vollständig aus der Datenbank.",
      loesung: "DELETE FROM Bestellposition\nWHERE BestellNr IN (SELECT BestellNr FROM Bestellung WHERE Status = 'storniert');\nDELETE FROM Bestellung\nWHERE Status = 'storniert';",
      tipp: "Referentielle Integrität: Solange Positionen auf die Bestellung verweisen, darf sie nicht gelöscht werden. Erst die Positionen, dann die Bestellung.",
      ru: "Ссылочная целостность: сначала удаляем строки, которые ссылаются (позиции), потом сам заказ." },

    /* ------------------------------------------------- SQL+: Text ändern (UPDATE mit Textfunktionen) */
    { id: "p1", thema: "dml", stufe: 2, art: "dml", titel: "UPDATE mit UPPER",
      text: "Für den Etikettendruck sollen die Nachnamen aller Kunden aus Berlin in Großbuchstaben gespeichert werden.",
      loesung: "UPDATE Kunde\nSET Name = UPPER(Name)\nWHERE Ort = 'Berlin';",
      tipp: "UPDATE … SET Spalte = Funktion(Spalte) WHERE …; UPPER (oder UCASE) macht Großbuchstaben.",
      ru: "В SET справа может стоять функция от старого значения: UPPER(Name) — заглавными буквами." },
    { id: "p2", thema: "dml", stufe: 2, art: "dml", genau: true, titel: "E-Mail bereinigen: TRIM und LOWER",
      vorher: "UPDATE Kunde SET Email = '  S.Mueller@MuellerBau.de ' WHERE KundenNr = 1;\nUPDATE Kunde SET Email = 'Julia.F@GMX.de  ' WHERE KundenNr = 4;",
      text: "Beim Import sind E-Mail-Adressen mit Leerzeichen am Rand und Großbuchstaben gespeichert worden. Speichern Sie alle E-Mail-Adressen ohne Leerzeichen am Rand und in Kleinbuchstaben. Leere E-Mail-Adressen (NULL) bleiben leer.",
      loesung: "UPDATE Kunde\nSET Email = LOWER(TRIM(Email))\nWHERE Email IS NOT NULL;",
      tipp: "Funktionen lassen sich schachteln: LOWER(TRIM(Email)). Für NULL liefern beide wieder NULL — das WHERE ist trotzdem sauber.",
      ru: "TRIM убирает пробелы по краям, LOWER — строчные буквы. Функции вкладываются друг в друга." },
    { id: "p3", thema: "dml", stufe: 3, art: "dml", titel: "Text anhängen mit CONCAT",
      text: "Alle Artikel mit einem Bestand unter 3 Stück werden als Restposten verkauft. Hängen Sie an ihre Bezeichnung den Text ' (Restposten)' an.",
      loesung: "UPDATE Artikel\nSET Bezeichnung = CONCAT(Bezeichnung, ' (Restposten)')\nWHERE Bestand < 3;",
      tipp: "CONCAT(Text1, Text2) verbindet Texte. Das Leerzeichen vor der Klammer gehört zum zweiten Text.",
      ru: "CONCAT склеивает строки. Условие по остатку — в WHERE, а не в SET." },
    { id: "p4", thema: "dml", stufe: 3, art: "dml", titel: "Schreibweise korrigieren mit REPLACE",
      vorher: "UPDATE Kunde SET Ort = 'Koeln' WHERE KundenNr IN (3, 6);",
      text: "Einige Kunden wurden mit dem Ort 'Koeln' statt 'Köln' erfasst. Korrigieren Sie die Schreibweise mit einer Textfunktion.",
      loesung: "UPDATE Kunde\nSET Ort = REPLACE(Ort, 'Koeln', 'Köln')\nWHERE Ort LIKE '%Koeln%';",
      tipp: "REPLACE(Text, alt, neu) ersetzt jedes Vorkommen. Mit WHERE nur die betroffenen Zeilen ändern.",
      ru: "REPLACE(текст, что, на что) заменяет все вхождения подстроки." },

    /* ---------------------------------------------------- Tabellen anlegen */
    { id: "c1", thema: "ddl", stufe: 2, art: "ddl", titel: "CREATE TABLE",
      text: "Legen Sie die Tabelle Lieferant an: LieferantNr (ganze Zahl, Primärschlüssel), Firma (Text bis 60 Zeichen, Pflichtfeld), Ort (Text bis 40 Zeichen), Telefon (Text bis 20 Zeichen).",
      loesung: "CREATE TABLE Lieferant (\n  LieferantNr INTEGER PRIMARY KEY,\n  Firma       VARCHAR(60) NOT NULL,\n  Ort         VARCHAR(40),\n  Telefon     VARCHAR(20)\n);",
      ddl: { tabelle: "Lieferant", spalten: { LieferantNr: "int", Firma: "text", Ort: "text", Telefon: "text" },
             pk: ["LieferantNr"], notnull: ["Firma"], laenge: { Firma: 60, Ort: 40, Telefon: 20 } },
      tipp: "Spalte Datentyp [NOT NULL], … und PRIMARY KEY. Telefonnummern sind Text (führende 0, +49).",
      ru: "CREATE TABLE имя (столбец тип ограничения, …). Телефон — текст, не число (ведущий 0, +49)." },
    { id: "c2", thema: "ddl", stufe: 2, art: "ddl", titel: "ALTER TABLE mit Fremdschlüssel",
      vorher: LIEFERANT,
      text: "Die Tabelle Lieferant gibt es jetzt. Erweitern Sie die Tabelle Artikel um die Spalte LieferantNr (ganze Zahl), die als Fremdschlüssel auf Lieferant verweist.",
      loesung: "ALTER TABLE Artikel\nADD COLUMN LieferantNr INTEGER REFERENCES Lieferant(LieferantNr);",
      ddl: { tabelle: "Artikel", spalten: { LieferantNr: "int" }, alle: false,
             fk: [["LieferantNr", "Lieferant", "LieferantNr"]] },
      tipp: "ALTER TABLE Artikel ADD LieferantNr INT; danach ALTER TABLE Artikel ADD FOREIGN KEY (LieferantNr) REFERENCES Lieferant(LieferantNr); — oder beides in einem: ADD COLUMN … REFERENCES ….",
      ru: "ALTER TABLE … ADD — добавить столбец; FOREIGN KEY … REFERENCES — связать с другой таблицей." },
    { id: "c3", thema: "ddl", stufe: 3, art: "ddl", titel: "Zwischentabelle (n:m)",
      vorher: LIEFERANT,
      text: "Ein Artikel kann von mehreren Lieferanten kommen, ein Lieferant liefert mehrere Artikel. Legen Sie die Tabelle Lieferung an: LieferantNr und ArtikelNr bilden zusammen den Primärschlüssel und sind jeweils Fremdschlüssel. Dazu Einkaufspreis (Dezimalzahl mit 2 Nachkommastellen) und LieferzeitTage (ganze Zahl).",
      loesung: "CREATE TABLE Lieferung (\n  LieferantNr    INTEGER REFERENCES Lieferant(LieferantNr),\n  ArtikelNr      INTEGER REFERENCES Artikel(ArtikelNr),\n  Einkaufspreis  DECIMAL(8,2),\n  LieferzeitTage INTEGER,\n  PRIMARY KEY (LieferantNr, ArtikelNr)\n);",
      ddl: { tabelle: "Lieferung", spalten: { LieferantNr: "int", ArtikelNr: "int", Einkaufspreis: "dezimal", LieferzeitTage: "int" },
             nachkommastellen: { Einkaufspreis: 2 },
             pk: ["LieferantNr", "ArtikelNr"],
             fk: [["LieferantNr", "Lieferant", "LieferantNr"], ["ArtikelNr", "Artikel", "ArtikelNr"]] },
      tipp: "Zusammengesetzter Schlüssel: PRIMARY KEY (Spalte1, Spalte2) am Ende. Fremdschlüssel: FOREIGN KEY (Spalte) REFERENCES Tabelle(Spalte).",
      ru: "Связь n:m = отдельная таблица; её первичный ключ — из двух внешних ключей." },
    /* ------------------------------------------------- SQL+: Index und Spalten ändern */
    { id: "i1", thema: "ddl", stufe: 2, art: "index", titel: "CREATE INDEX",
      text: "Im Shop wird sehr oft nach dem Ort eines Kunden gesucht. Legen Sie einen Index mit dem Namen idx_kunde_ort auf die Spalte Ort der Tabelle Kunde an.",
      loesung: "CREATE INDEX idx_kunde_ort ON Kunde (Ort);",
      index: { tabelle: "Kunde", spalten: ["Ort"] },
      tipp: "CREATE INDEX name ON Tabelle (Spalte); Ein Index beschleunigt das Suchen (WHERE, JOIN), macht aber INSERT/UPDATE etwas langsamer.",
      ru: "Индекс — как алфавитный указатель в книге: поиск быстрее, запись чуть медленнее." },
    { id: "i2", thema: "ddl", stufe: 2, art: "index", titel: "UNIQUE INDEX",
      text: "Jede E-Mail-Adresse darf nur einmal vorkommen. Sorgen Sie mit einem eindeutigen Index uk_kunde_email dafür.",
      loesung: "CREATE UNIQUE INDEX uk_kunde_email ON Kunde (Email);",
      index: { tabelle: "Kunde", spalten: ["Email"], unique: true },
      tipp: "CREATE UNIQUE INDEX … verhindert doppelte Werte. NULL darf mehrfach vorkommen.",
      ru: "UNIQUE INDEX запрещает повторы значений в столбце (NULL — не считается повтором)." },
    { id: "i3", thema: "ddl", stufe: 3, art: "index", titel: "Zusammengesetzter Index",
      text: "Eine häufige Abfrage sucht Bestellungen eines Kunden in einem Zeitraum (WHERE KundenNr = … AND Datum BETWEEN …). Legen Sie den Index idx_best_kunde_datum auf KundenNr und Datum an — in dieser Reihenfolge.",
      loesung: "CREATE INDEX idx_best_kunde_datum ON Bestellung (KundenNr, Datum);",
      index: { tabelle: "Bestellung", spalten: ["KundenNr", "Datum"] },
      tipp: "Mehrere Spalten in der Klammer, durch Komma getrennt. Die Spalte mit der Gleichheitsbedingung zuerst.",
      ru: "Составной индекс: порядок столбцов важен — сначала столбец с условием «=»." },
    { id: "m1", thema: "ddl", stufe: 2, art: "ddl", titel: "ALTER TABLE … MODIFY",
      text: "Ortsnamen mit mehr als 40 Zeichen passen nicht in die Tabelle Kunde. Ändern Sie den Datentyp der Spalte Ort auf VARCHAR(80). Die vorhandenen Daten müssen erhalten bleiben.",
      loesung: "ALTER TABLE Kunde\nMODIFY Ort VARCHAR(80);",
      ddl: { tabelle: "Kunde", spalten: { Ort: "text" }, laenge: { Ort: 80 }, alle: false, datenBleiben: true },
      tipp: "MySQL-Schreibweise (Beiblatt): ALTER TABLE Tabelle MODIFY Spalte NeuerTyp; Die übrigen Eigenschaften der Spalte schreibt man mit.",
      ru: "MODIFY меняет тип существующего столбца. Данные остаются; новый тип должен их вмещать." },
    { id: "m2", thema: "ddl", stufe: 3, art: "ddl", titel: "MODIFY mit NOT NULL",
      text: "Der Bestand eines Artikels darf nie leer sein. Ändern Sie die Spalte Bestand der Tabelle Artikel so, dass sie eine ganze Zahl mit Standardwert 0 ist und nicht NULL sein darf.",
      loesung: "ALTER TABLE Artikel\nMODIFY Bestand INTEGER NOT NULL DEFAULT 0;",
      ddl: { tabelle: "Artikel", spalten: { Bestand: "int" }, notnull: ["Bestand"], alle: false, datenBleiben: true },
      tipp: "Alle Eigenschaften neu angeben: Typ, NOT NULL, DEFAULT. Gibt es schon NULL-Werte in der Spalte, schlägt die Änderung fehl.",
      ru: "NOT NULL можно добавить, только если в столбце уже нет пустых значений." },
    { id: "m3", thema: "ddl", stufe: 3, art: "ddl", titel: "Spalte umbenennen mit CHANGE",
      text: "Die Spalte PLZ der Tabelle Kunde soll künftig Postleitzahl heißen (weiterhin CHAR(5)). Benennen Sie sie um, ohne Daten zu verlieren.",
      loesung: "ALTER TABLE Kunde\nCHANGE PLZ Postleitzahl CHAR(5);",
      ddl: { tabelle: "Kunde", spalten: { Postleitzahl: "text" }, laenge: { Postleitzahl: 5 }, weg: ["PLZ"], alle: false, datenBleiben: true },
      tipp: "CHANGE alterName neuerName Typ; — bei CHANGE gibt man den Typ immer mit an (MODIFY ändert nur den Typ).",
      ru: "CHANGE переименовывает столбец и задаёт тип; MODIFY — только тип." },
    { id: "c4", thema: "ddl", stufe: 2, art: "view", titel: "Sicht (VIEW)",
      text: "Erstellen Sie eine Sicht (View) mit dem Namen KundenKoeln, die Name, Vorname und Email aller Kölner Kunden zeigt.",
      loesung: "CREATE VIEW KundenKoeln AS\nSELECT Name, Vorname, Email\nFROM Kunde\nWHERE Ort = 'Köln';",
      view: "KundenKoeln",
      tipp: "CREATE VIEW Name AS SELECT …; — danach kann man SELECT * FROM KundenKoeln schreiben.",
      ru: "VIEW — сохранённый запрос, с ним работают как с таблицей." },

    /* ==================================================================
       Nach dem SQL-Beiblatt (Stand 2024-10-07) — Datenbank „IT-Service“.
       Eigene Übungen im Stil der GA2, keine IHK-Originale.
       ================================================================== */
    /* ----------------------------------------------- UNION & DISTINCT */
    { id: "n1", thema: "mengen", db: "service", stufe: 2, titel: "UNION: Orte von Kunden und Lieferanten", ordnung: true, beispiel: 2,
      text: "Erstellen Sie eine Liste aller Orte, in denen Kundenfirmen (Tabelle Firma) oder Lieferanten (Tabelle Lieferant) ihren Sitz haben. Jeder Ort soll nur einmal erscheinen. Sortieren Sie die Orte alphabetisch.",
      loesung: "SELECT Ort FROM Firma\nUNION\nSELECT Ort FROM Lieferant\nORDER BY Ort;",
      tipp: "UNION setzt zwei Ergebnisse untereinander und entfernt doppelte Zeilen. Beide SELECT brauchen gleich viele Spalten. ORDER BY steht nur einmal, ganz am Ende.",
      ru: "UNION ставит результаты двух SELECT друг под другом и убирает повторы (UNION ALL оставил бы повторы). В обоих SELECT одинаковое число столбцов; ORDER BY пишется один раз в самом конце." },
    { id: "n2", thema: "mengen", db: "service", stufe: 2, titel: "DISTINCT nach einem JOIN", beispiel: 1,
      text: "Welche Techniker haben schon Tickets der Kategorie „Netzwerk“ bearbeitet? Geben Sie Name und Vorname aus. Jeder Techniker soll nur einmal in der Liste stehen.",
      loesung: "SELECT DISTINCT te.Name, te.Vorname\nFROM Techniker te\nJOIN Ticket t ON t.TechNr = te.TechNr\nWHERE t.Kategorie = 'Netzwerk';",
      tipp: "Nach dem JOIN steht ein Techniker so oft da, wie er passende Tickets hat. SELECT DISTINCT entfernt die doppelten Zeilen.",
      ru: "После JOIN техник повторяется столько раз, сколько у него подходящих тикетов. SELECT DISTINCT убирает одинаковые строки." },

    /* ------------------------------------------------------- JOIN */
    { id: "n3", thema: "join", db: "service", stufe: 2, titel: "RIGHT JOIN: alle Techniker, auch ohne Ticket", beispiel: 2,
      text: "Geben Sie für jeden Techniker den Namen und die Anzahl seiner Tickets aus (Name, Anzahl). Auch Techniker ohne Ticket sollen erscheinen — mit der Anzahl 0.",
      loesung: "SELECT te.Name, COUNT(t.TicketNr) AS Anzahl\nFROM Ticket t\nRIGHT JOIN Techniker te ON te.TechNr = t.TechNr\nGROUP BY te.TechNr, te.Name;",
      tipp: "RIGHT JOIN behält alle Zeilen der rechten (zweiten) Tabelle — hier Techniker. COUNT(t.TicketNr) zählt nur vorhandene Tickets, darum steht bei Wagner 0. Genauso richtig: FROM Techniker te LEFT JOIN Ticket t ON …",
      ru: "RIGHT JOIN сохраняет все строки правой (второй) таблицы. COUNT(t.TicketNr) не считает NULL, поэтому у техника без тикетов будет 0. LEFT JOIN с переставленными таблицами даёт то же самое." },

    /* ------------------------------------------------ Unterabfragen */
    { id: "n5", thema: "sub", db: "service", stufe: 3, titel: "Unterabfrage als Tabelle (AS tbl)", beispiel: 1,
      text: "Wie viele Tickets hat eine Kundenfirma im Durchschnitt? Zählen Sie zuerst die Tickets je Firma. Berechnen Sie dann aus diesen Anzahlen den Durchschnitt (eine Spalte: Durchschnitt). Firmen ohne Ticket zählen nicht mit.",
      loesung: "SELECT AVG(Anzahl) AS Durchschnitt\nFROM (SELECT FirmaNr, COUNT(*) AS Anzahl\n      FROM Ticket\n      GROUP BY FirmaNr) AS tbl;",
      tipp: "Die innere Abfrage ergibt eine Zwischentabelle (FirmaNr, Anzahl). Sie steht in Klammern hinter FROM und bekommt mit AS tbl einen Namen. Die äußere Abfrage rechnet damit wie mit einer Tabelle.",
      ru: "Подзапрос во FROM работает как временная таблица: сначала считаем тикеты каждой фирмы, потом берём среднее. У такой таблицы обязательно есть имя (AS tbl)." },
    { id: "n6", thema: "sub", db: "service", stufe: 3, titel: "NOT EXISTS: Firmen ohne offenes Ticket", beispiel: 1,
      text: "Ein Ticket ist offen, wenn Erledigt leer (NULL) ist. Geben Sie Firmenname und Ort aller Firmen aus, für die es kein offenes Ticket gibt. Firmen ganz ohne Ticket gehören auch dazu.",
      loesung: "SELECT f.Firmenname, f.Ort\nFROM Firma f\nWHERE NOT EXISTS (SELECT *\n                  FROM Ticket t\n                  WHERE t.FirmaNr = f.FirmaNr\n                    AND t.Erledigt IS NULL);",
      tipp: "NOT EXISTS (Unterabfrage) ist wahr, wenn die Unterabfrage keine Zeile findet. Sie bezieht sich mit t.FirmaNr = f.FirmaNr auf die Firma der äußeren Abfrage. Mit NOT IN geht es auch.",
      ru: "NOT EXISTS истинно, когда подзапрос не нашёл ни одной строки. Подзапрос связан с внешней строкой условием t.FirmaNr = f.FirmaNr. Обычный JOIN потерял бы фирму совсем без тикетов." },

    /* --------------------------------------------------- Gruppieren */
    { id: "n7", thema: "agg", db: "service", stufe: 3, titel: "HAVING: Anzahl und Durchschnitt", beispiel: 1,
      text: "Geben Sie für jeden Techniker mit mindestens drei Tickets den Namen, die Anzahl seiner Tickets und die durchschnittliche Bewertung aus (Name, Anzahl, Bewertung). Tickets ohne Bewertung zählen beim Durchschnitt nicht mit.",
      loesung: "SELECT te.Name, COUNT(*) AS Anzahl, AVG(t.Bewertung) AS Bewertung\nFROM Techniker te\nJOIN Ticket t ON t.TechNr = te.TechNr\nGROUP BY te.TechNr, te.Name\nHAVING COUNT(*) >= 3;",
      tipp: "WHERE filtert Zeilen vor dem Gruppieren, HAVING filtert Gruppen danach. AVG lässt NULL-Werte von selbst weg.",
      ru: "Условие на количество в группе пишем в HAVING. AVG сам пропускает NULL — среднее считается только по оценённым тикетам." },

    /* ------------------------------------------------- Text & Datum */
    { id: "n8", thema: "text", db: "service", stufe: 2, titel: "LEFT und RIGHT: Inventarnummer zerlegen", beispiel: 2, genau: true,
      text: "Eine Inventarnummer ist so aufgebaut: Typkürzel – Jahr – laufende Nummer, z. B. NB-2023-004. Geben Sie für jedes Gerät die InventarNr, das Typkürzel (die ersten zwei Zeichen), das Jahr (die vier Ziffern in der Mitte) und die laufende Nummer (die letzten drei Zeichen) aus (InventarNr, Typ, Jahr, LfdNr).",
      loesung: "SELECT InventarNr,\n       LEFT(InventarNr, 2) AS Typ,\n       RIGHT(LEFT(InventarNr, 7), 4) AS Jahr,\n       RIGHT(InventarNr, 3) AS LfdNr\nFROM Geraet;",
      tipp: "LEFT(Text, n) liefert n Zeichen von links, RIGHT(Text, n) von rechts. Für die Mitte schachteln: LEFT(InventarNr, 7) ergibt 'NB-2023', davon RIGHT(…, 4) ergibt '2023'.",
      ru: "LEFT(текст, n) — n символов слева, RIGHT(текст, n) — справа. Середину достаём вложением: LEFT(…, 7) = 'NB-2023', затем RIGHT(…, 4) = '2023'. Год покупки (Kaufdatum) не всегда совпадает с годом в номере." },
    { id: "n9", thema: "text", db: "service", stufe: 3, titel: "Namen trennen mit LEFT, RIGHT und INSTR", beispiel: 2, genau: true,
      text: "In der Tabelle Firma steht der Ansprechpartner als „Vorname Nachname“ in einer Spalte. Geben Sie Firmenname, Vorname und Nachname des Ansprechpartners in drei Spalten aus (Firmenname, Vorname, Nachname).",
      hinweis: "Die Funktion INSTR(Zeichenkette, Suchtext) liefert die Position des Suchtextes (erstes Zeichen = 1). LENGTH(Zeichenkette) liefert die Anzahl der Zeichen.",
      loesung: "SELECT Firmenname,\n       LEFT(Ansprechpartner, INSTR(Ansprechpartner, ' ') - 1) AS Vorname,\n       RIGHT(Ansprechpartner, LENGTH(Ansprechpartner) - INSTR(Ansprechpartner, ' ')) AS Nachname\nFROM Firma;",
      tipp: "Position des Leerzeichens: INSTR(Ansprechpartner, ' '). Vorname = so viele Zeichen von links: Position − 1. Nachname = so viele Zeichen von rechts: LENGTH − Position.",
      ru: "Находим позицию пробела (INSTR). Имя — LEFT на (позиция − 1) символов, фамилия — RIGHT на (длина − позиция) символов. На экзамене нужную вспомогательную функцию дают в «Hinweis» — читай его внимательно." },
    { id: "n10", thema: "text", db: "service", stufe: 2, titel: "YEAR und MONTH: Tickets je Monat", ordnung: true, beispiel: 2,
      text: "Ermitteln Sie für das Jahr 2026 die Anzahl der eingegangenen Tickets je Monat (Monat, Anzahl). Sortieren Sie aufsteigend nach dem Monat.",
      loesung: "SELECT MONTH(Eingang) AS Monat, COUNT(*) AS Anzahl\nFROM Ticket\nWHERE YEAR(Eingang) = 2026\nGROUP BY MONTH(Eingang)\nORDER BY Monat;",
      tipp: "YEAR(Datum) und MONTH(Datum) liefern Zahlen. Das Jahr filtern Sie mit WHERE, gruppiert wird nach MONTH(Eingang).",
      ru: "YEAR() и MONTH() возвращают числа: по году фильтруем (WHERE), по месяцу группируем (GROUP BY) и сортируем." },
    { id: "n11", thema: "text", db: "service", stufe: 2, titel: "DATEDIFF: länger als 2 Tage", beispiel: 1,
      text: "Geben Sie TicketNr, Kategorie und die Bearbeitungsdauer in Tagen (Tage) aller Tickets aus, deren Bearbeitung mehr als 2 Tage gedauert hat. Verwenden Sie DATEDIFF wie im Beiblatt.",
      loesung: "SELECT TicketNr, Kategorie, DATEDIFF(DAY, Eingang, Erledigt) AS Tage\nFROM Ticket\nWHERE DATEDIFF(DAY, Eingang, Erledigt) > 2;",
      tipp: "DATEDIFF(DAY, Anfangsdatum, Enddatum) = Enddatum − Anfangsdatum in Tagen. Reihenfolge laut Beiblatt: Datumsteil, Anfang, Ende. Offene Tickets (Erledigt NULL) ergeben NULL und fallen von selbst heraus.",
      ru: "DATEDIFF(DAY, начало, конец) — сколько дней от начала до конца. Порядок: единица (DAY), начало, конец. Если конец NULL, результат NULL — такая строка не проходит условие." },
    { id: "n12", thema: "text", db: "service", stufe: 3, titel: "DATEADD: Garantie abgelaufen", jetzt: "2026-03-01 09:00:00", beispiel: 1,
      text: "Jedes Gerät hat ab dem Kaufdatum so viele Monate Garantie, wie in GarantieMonate steht. Geben Sie InventarNr, Bezeichnung und das Garantieende aller Geräte aus, deren Garantie heute (NOW()) schon abgelaufen ist (InventarNr, Bezeichnung, Garantieende).",
      loesung: "SELECT InventarNr, Bezeichnung,\n       DATEADD(MONTH, GarantieMonate, Kaufdatum) AS Garantieende\nFROM Geraet\nWHERE DATEADD(MONTH, GarantieMonate, Kaufdatum) < NOW();",
      tipp: "DATEADD(MONTH, Anzahl, Datum) zählt Monate zu einem Datum dazu. Ist dieses Garantieende kleiner als NOW(), ist die Garantie vorbei.",
      ru: "DATEADD(MONTH, n, дата) прибавляет n месяцев. Гарантия истекла, если дата её окончания меньше текущего момента NOW()." },
    { id: "n13", thema: "text", db: "service", stufe: 3, titel: "WEEKDAY und HOUR: außerhalb der Arbeitszeit", beispiel: 2,
      text: "Welche Tickets sind außerhalb der Arbeitszeit eingegangen? Das sind alle Tickets vom Samstag oder Sonntag und alle Tickets, die ab 18 Uhr eingegangen sind. Geben Sie TicketNr und Eingang aus.",
      hinweis: "WEEKDAY liefert für Montag 0, für Dienstag 1 … für Sonntag 6.",
      loesung: "SELECT TicketNr, Eingang\nFROM Ticket\nWHERE WEEKDAY(Eingang) >= 5\n   OR HOUR(Eingang) >= 18;",
      tipp: "Samstag = 5, Sonntag = 6. HOUR(Eingang) liefert die Stunde als Zahl. Beide Bedingungen mit OR verbinden.",
      ru: "WEEKDAY: понедельник = 0 … воскресенье = 6, выходные — 5 и 6. HOUR() даёт час как число. Два условия соединяем через OR." },

    /* ------------------------------------------------- Daten ändern */
    { id: "n14", thema: "dml", db: "service", art: "dml", stufe: 3, titel: "UPDATE mit Unterabfrage und HAVING",
      text: "Techniker mit mindestens drei erledigten Tickets bekommen 5 % mehr Stundensatz. Ändern Sie die Tabelle Techniker entsprechend.",
      loesung: "UPDATE Techniker\nSET Stundensatz = Stundensatz * 1.05\nWHERE TechNr IN (SELECT TechNr\n                 FROM Ticket\n                 WHERE Erledigt IS NOT NULL\n                 GROUP BY TechNr\n                 HAVING COUNT(*) >= 3);",
      tipp: "Die Unterabfrage liefert die TechNr aller Techniker mit mindestens drei erledigten Tickets (WHERE Erledigt IS NOT NULL, GROUP BY, HAVING). UPDATE … WHERE TechNr IN (…) ändert genau diese.",
      ru: "Подзапрос с GROUP BY и HAVING находит нужных техников, UPDATE … WHERE TechNr IN (подзапрос) меняет только их. Считаем только выполненные тикеты: Erledigt IS NOT NULL." },
    { id: "n15", thema: "dml", db: "service", art: "dml", stufe: 2, titel: "DELETE mit Unterabfrage",
      text: "Die Kundenfirmen aus Taucha betreut ab sofort ein Partner. Löschen Sie alle Geräte dieser Firmen aus der Tabelle Geraet.",
      loesung: "DELETE FROM Geraet\nWHERE FirmaNr IN (SELECT FirmaNr FROM Firma WHERE Ort = 'Taucha');",
      tipp: "Der Ort steht in Firma, die Geräte stehen in Geraet. Die Unterabfrage liefert die FirmaNr der Firmen aus Taucha.",
      ru: "Город хранится в Firma, а удаляем из Geraet — номера фирм берём подзапросом: WHERE FirmaNr IN (SELECT …)." },
    { id: "n16", thema: "dml", db: "service", art: "dml", stufe: 2, titel: "INSERT INTO … SELECT: Tickets archivieren",
      vorher: "CREATE TABLE TicketArchiv (TicketNr INTEGER PRIMARY KEY, FirmaNr INTEGER, Kategorie VARCHAR(20), Erledigt DATETIME);",
      beispiel: { sql: "SELECT * FROM TicketArchiv", n: 1, titel: "TicketArchiv danach" },
      text: "Die Tabelle TicketArchiv (TicketNr, FirmaNr, Kategorie, Erledigt) ist schon angelegt. Kopieren Sie mit einer einzigen Anweisung alle Tickets, die im Jahr 2025 erledigt wurden, in diese Tabelle.",
      loesung: "INSERT INTO TicketArchiv (TicketNr, FirmaNr, Kategorie, Erledigt)\nSELECT TicketNr, FirmaNr, Kategorie, Erledigt\nFROM Ticket\nWHERE YEAR(Erledigt) = 2025;",
      tipp: "Statt VALUES (…) folgt direkt ein SELECT. Die Spalten im SELECT müssen in Anzahl und Reihenfolge zur Liste hinter INSERT INTO passen.",
      ru: "INSERT INTO … SELECT вставляет сразу все строки результата. Вместо VALUES пишем SELECT; столбцы совпадают по количеству и порядку." },

    /* ------------------------------------------- Rechte (nach Muster) */
    { id: "r1", thema: "rechte", db: "service", art: "muster", stufe: 1, titel: "CREATE USER und GRANT",
      text: "Für eine neue Praktikantin soll ein Datenbankbenutzer angelegt werden. Legen Sie den Benutzer praktikant mit dem Passwort Start#2026 an. Er darf in der Datenbank service nur die Tabelle Ticket lesen.",
      loesung: "CREATE USER praktikant IDENTIFIED BY 'Start#2026';\nGRANT SELECT ON service.Ticket TO praktikant;",
      muster: [
        { art: "create_user", namen: ["praktikant"], passwort: "Start#2026" },
        { art: "grant", rechte: ["SELECT"], objekt: "service.Ticket", an: ["praktikant"] }
      ],
      tipp: "Zwei Anweisungen: zuerst CREATE USER … IDENTIFIED BY 'Passwort', dann GRANT Recht ON Datenbank.Tabelle TO Benutzer. Lesen = SELECT.",
      ru: "Сначала создаём пользователя (CREATE USER … IDENTIFIED BY 'пароль'), потом даём право: GRANT SELECT ON база.таблица TO пользователь. «Читать» = SELECT." },
    { id: "r2", thema: "rechte", db: "service", art: "muster", stufe: 2, titel: "GRANT mit WITH GRANT OPTION und Rolle",
      text: "Die Teamleiterin nowak soll in allen Tabellen der Datenbank service Daten lesen, einfügen und ändern dürfen. Diese Rechte soll sie an ihr Team weitergeben können. Weisen Sie außerdem dem Benutzer kraus die Rolle support zu.",
      loesung: "GRANT SELECT, INSERT, UPDATE ON service.* TO nowak WITH GRANT OPTION;\nGRANT support TO kraus;",
      muster: [
        { art: "grant", rechte: ["SELECT", "INSERT", "UPDATE"], objekt: "service.*", an: ["nowak"], weitergeben: true },
        { art: "grant_role", rollen: ["support"], an: ["kraus"] }
      ],
      tipp: "Mehrere Rechte mit Komma trennen. Alle Tabellen einer Datenbank: service.* — Weitergeben dürfen: WITH GRANT OPTION am Ende. Eine Rolle zuweisen: GRANT Rolle TO Benutzer (ohne ON).",
      ru: "Несколько прав — через запятую. Все таблицы базы — service.* . Право передавать права дальше — WITH GRANT OPTION в конце. Роль назначают так: GRANT роль TO пользователь (без ON)." },
    { id: "r3", thema: "rechte", db: "service", art: "muster", stufe: 2, titel: "REVOKE: Rechte und Rolle entziehen",
      text: "Der Benutzer schulze wechselt in die Projektleitung. Entziehen Sie ihm in der Datenbank service das Recht, in allen Tabellen Daten zu ändern und zu löschen. Entziehen Sie ihm außerdem die Rolle netzwerk.",
      loesung: "REVOKE UPDATE, DELETE ON service.* FROM schulze;\nREVOKE netzwerk FROM schulze;",
      muster: [
        { art: "revoke", rechte: ["UPDATE", "DELETE"], objekt: "service.*", von: ["schulze"] },
        { art: "revoke_role", rollen: ["netzwerk"], von: ["schulze"] }
      ],
      tipp: "REVOKE ist das Gegenstück zu GRANT: statt TO steht FROM. Eine Rolle entziehen: REVOKE Rolle FROM Benutzer.",
      ru: "REVOKE — противоположность GRANT: вместо TO пишем FROM. Роль снимают так же: REVOKE роль FROM пользователь." },

    /* ================================================================
       Ergebnis vorhersagen: Abfrage lesen und das Ergebnis bestimmen.
       Die Wahrheit ist immer die echte Ausführung (Test prüft: genau
       eine Antwort passt, und es ist die mit „richtig“).
       ================================================================ */
    { id: "v1", thema: "vorhersage", art: "vorhersage", db: "mini", stufe: 1, titel: "JOIN: Wer steht im Ergebnis?",
      frage: "wahl", zeigen: ["Person", "Abteilung"],
      text: "Welche Ergebnistabelle liefert die Abfrage?",
      loesung: "SELECT p.Name, a.Bezeichnung\nFROM Person p\nJOIN Abteilung a ON a.AbtNr = p.AbtNr;",
      spalten: ["Name", "Bezeichnung"],
      optionen: [
        [["Arndt", "IT"], ["Brandt", "IT"], ["Claus", "Einkauf"], ["Dietz", null], ["Ernst", "IT"]],
        [["Arndt", "IT"], ["Brandt", "IT"], ["Claus", "Einkauf"], ["Ernst", "IT"]],
        [["Arndt", "IT"], ["Brandt", "IT"], ["Claus", "Einkauf"], ["Ernst", "IT"], [null, "Vertrieb"]],
        [["Arndt", "IT"], ["Brandt", "IT"], ["Claus", "Einkauf"], ["Dietz", null], ["Ernst", "IT"], [null, "Vertrieb"]]
      ], richtig: 1,
      tipp: "JOIN (INNER JOIN) nimmt nur Zeilen, die in beiden Tabellen einen Partner haben.",
      ru: "Обычный JOIN (INNER) берёт только пары с совпадением. Dietz без отдела и отдел Vertrieb без сотрудников в результат не попадают." },
    { id: "v2", thema: "vorhersage", art: "vorhersage", db: "mini", stufe: 2, titel: "LEFT JOIN mit COUNT",
      frage: "wahl", zeigen: ["Abteilung", "Person"],
      text: "Welche Ergebnistabelle liefert die Abfrage?",
      loesung: "SELECT a.Bezeichnung, COUNT(p.PersNr) AS Anzahl\nFROM Abteilung a\nLEFT JOIN Person p ON p.AbtNr = a.AbtNr\nGROUP BY a.Bezeichnung;",
      spalten: ["Bezeichnung", "Anzahl"],
      optionen: [
        [["Einkauf", 1], ["IT", 3], ["Vertrieb", 1]],
        [["Einkauf", 1], ["IT", 3]],
        [["Einkauf", 1], ["IT", 2], ["Vertrieb", 0]],
        [["Einkauf", 1], ["IT", 3], ["Vertrieb", 0]]
      ], richtig: 3,
      tipp: "LEFT JOIN behält alle Abteilungen. Was zählt COUNT(p.PersNr), wenn p.PersNr NULL ist?",
      ru: "LEFT JOIN сохраняет все отделы, в том числе Vertrieb без людей (там p.PersNr = NULL). COUNT(p.PersNr) не считает NULL → 0. COUNT(*) посчитал бы саму строку и дал бы 1." },
    { id: "v3", thema: "vorhersage", art: "vorhersage", db: "mini", stufe: 2, titel: "RIGHT JOIN: Welche Tabelle bleibt vollständig?",
      frage: "wahl", zeigen: ["Abteilung", "Person"],
      text: "Welche Ergebnistabelle liefert die Abfrage?",
      loesung: "SELECT a.Bezeichnung, p.Name\nFROM Abteilung a\nRIGHT JOIN Person p ON p.AbtNr = a.AbtNr;",
      spalten: ["Bezeichnung", "Name"],
      optionen: [
        [["IT", "Arndt"], ["IT", "Brandt"], ["Einkauf", "Claus"], [null, "Dietz"], ["IT", "Ernst"]],
        [["IT", "Arndt"], ["IT", "Brandt"], ["Einkauf", "Claus"], ["IT", "Ernst"], ["Vertrieb", null]],
        [["IT", "Arndt"], ["IT", "Brandt"], ["Einkauf", "Claus"], ["IT", "Ernst"]],
        [["IT", "Arndt"], ["IT", "Brandt"], ["Einkauf", "Claus"], [null, "Dietz"], ["IT", "Ernst"], ["Vertrieb", null]]
      ], richtig: 0,
      tipp: "RIGHT JOIN behält alle Zeilen der zweiten (rechten) Tabelle. Welche Tabelle steht hier rechts?",
      ru: "RIGHT JOIN сохраняет все строки ВТОРОЙ (правой) таблицы — здесь это Person. Поэтому Dietz есть (с NULL вместо отдела), а Vertrieb без людей — нет." },
    { id: "v4", thema: "vorhersage", art: "vorhersage", db: "mini", stufe: 2, titel: "NULL in COUNT und AVG",
      frage: "wahl", zeigen: ["Person"],
      text: "Welche Ergebnistabelle liefert die Abfrage?",
      loesung: "SELECT COUNT(*) AS Alle, COUNT(Gehalt) AS MitGehalt, AVG(Gehalt) AS Schnitt\nFROM Person;",
      spalten: ["Alle", "MitGehalt", "Schnitt"],
      optionen: [
        [[5, 5, 2520]],
        [[4, 4, 3150]],
        [[5, 4, 2520]],
        [[5, 4, 3150]]
      ], richtig: 3,
      tipp: "COUNT(*) zählt Zeilen, COUNT(Spalte) nur Werte, die nicht NULL sind. Durch wie viele Werte teilt AVG?",
      ru: "COUNT(*) считает все строки (5). COUNT(Gehalt) пропускает NULL (4). AVG тоже пропускает NULL: (3200 + 2800 + 3000 + 3600) / 4 = 3150, а не делит на 5." },
    { id: "v5", thema: "vorhersage", art: "vorhersage", db: "mini", stufe: 2, titel: "GROUP BY und HAVING",
      frage: "wahl", zeigen: ["Person"],
      text: "Welche Ergebnistabelle liefert die Abfrage?",
      loesung: "SELECT Ort, COUNT(*) AS Anzahl, SUM(Gehalt) AS Summe\nFROM Person\nGROUP BY Ort\nHAVING COUNT(*) > 2;",
      spalten: ["Ort", "Anzahl", "Summe"],
      optionen: [
        [["Leipzig", 3, 9000], ["Halle", 2, 3600]],
        [["Leipzig", 3, 9000]],
        [["Halle", 2, 3600]],
        [["Leipzig", 3, 9000], ["Halle", 2, null]]
      ], richtig: 1,
      tipp: "Erst Gruppen bilden (je Ort), dann mit HAVING ganze Gruppen aussortieren. SUM lässt NULL weg.",
      ru: "Сначала группы по городу: Leipzig — 3 человека, Halle — 2. HAVING COUNT(*) > 2 оставляет только Leipzig. SUM пропускает NULL: 3200 + 2800 + 3000 = 9000." },
    { id: "v6", thema: "vorhersage", art: "vorhersage", db: "mini", stufe: 2, titel: "DISTINCT über zwei Spalten",
      frage: "zeilen", antwort: 4, zeigen: ["Person"],
      text: "Wie viele Zeilen liefert die Abfrage?",
      loesung: "SELECT DISTINCT Ort, AbtNr\nFROM Person;",
      tipp: "DISTINCT vergleicht ganze Zeilen: Eine Zeile fällt nur weg, wenn Ort UND AbtNr gleich sind.",
      ru: "DISTINCT убирает строки, у которых совпадают ВСЕ выбранные столбцы. Пары (Ort, AbtNr): Leipzig/2, Halle/2, Leipzig/1, Leipzig/NULL, Halle/2 — повторяется только Halle/2, остаётся 4 строки." },
    { id: "v7", thema: "vorhersage", art: "vorhersage", db: "mini", stufe: 1, titel: "UNION entfernt Doppelte",
      frage: "wahl", zeigen: ["Person", "Standort"],
      text: "Welche Ergebnistabelle liefert die Abfrage?",
      loesung: "SELECT Ort FROM Person\nUNION\nSELECT Ort FROM Standort;",
      spalten: ["Ort"],
      optionen: [
        [["Leipzig"]],
        [["Leipzig"], ["Halle"], ["Leipzig"], ["Leipzig"], ["Halle"], ["Leipzig"], ["Dresden"]],
        [["Dresden"], ["Halle"], ["Leipzig"]],
        [["Halle"]]
      ], richtig: 2,
      tipp: "UNION hängt beide Ergebnisse untereinander. Was passiert mit Zeilen, die doppelt vorkommen?",
      ru: "UNION ставит оба результата друг под другом и убирает повторы: Leipzig, Halle, Dresden. UNION ALL оставил бы все 7 строк." },
    { id: "v8", thema: "vorhersage", art: "vorhersage", db: "mini", stufe: 2, titel: "NULL in der WHERE-Bedingung",
      frage: "wahl", zeigen: ["Person"],
      text: "Welche Ergebnistabelle liefert die Abfrage?",
      loesung: "SELECT Name\nFROM Person\nWHERE AbtNr <> 2;",
      spalten: ["Name"],
      optionen: [
        [["Claus"], ["Dietz"]],
        [["Arndt"], ["Brandt"], ["Ernst"]],
        [["Claus"]],
        [["Dietz"]]
      ], richtig: 2,
      tipp: "Was ergibt der Vergleich NULL <> 2: wahr, falsch oder unbekannt?",
      ru: "У Dietz отдел не указан (NULL). Сравнение NULL <> 2 даёт не «истину», а «неизвестно» — строка в результат не попадает. Чтобы Dietz был в списке, нужно добавить OR AbtNr IS NULL." },
    { id: "v9", thema: "vorhersage", art: "vorhersage", db: "service", stufe: 2, titel: "DATEDIFF in Minuten",
      frage: "wert", antwort: 90,
      zeigen: [{ titel: "Ticket (Auszug)", sql: "SELECT TicketNr, Eingang, Erledigt FROM Ticket WHERE TicketNr BETWEEN 103 AND 105" }],
      text: "Welchen Wert liefert die Abfrage?",
      loesung: "SELECT DATEDIFF(MINUTE, Eingang, Erledigt) AS Dauer\nFROM Ticket\nWHERE TicketNr = 104;",
      tipp: "DATEDIFF(MINUTE, Anfang, Ende) = Ende − Anfang in Minuten. Rechne die Uhrzeiten von Ticket 104 nach.",
      ru: "От 07:40 до 09:10 проходит 1 час 30 минут = 90 минут. DATEDIFF(MINUTE, начало, конец) — это конец минус начало в минутах." },
    { id: "v10", thema: "vorhersage", art: "vorhersage", db: "service", stufe: 2, titel: "LEFT und RIGHT geschachtelt",
      frage: "wert", antwort: "2024",
      zeigen: [{ titel: "Geraet (Auszug)", sql: "SELECT InventarNr, Bezeichnung FROM Geraet" }],
      text: "Welchen Wert liefert die Abfrage?",
      loesung: "SELECT RIGHT(LEFT(InventarNr, 7), 4) AS Teil\nFROM Geraet\nWHERE Bezeichnung = 'Monitor 27 Zoll';",
      tipp: "Von innen nach außen rechnen: zuerst LEFT(…, 7), dann davon RIGHT(…, 4).",
      ru: "Сначала внутренняя функция: LEFT('MO-2024-007', 7) = 'MO-2024'. Потом внешняя: RIGHT('MO-2024', 4) = '2024'." }
  ];

  const DBS = {
    shop: { titel: "Online-Shop", kurz: "Kunden, Artikel, Bestellungen, Mitarbeiter, Projekte", SCHEMA, TABELLEN },
    service: { titel: "IT-Service", kurz: "Firmen, Techniker, Tickets, Geräte, Lieferanten", SCHEMA: SERVICE, TABELLEN: SERVICE_TABELLEN },
    mini: { titel: "Mini-Daten", kurz: "Abteilung, Person, Standort — zum Nachrechnen", SCHEMA: MINI, TABELLEN: MINI_TABELLEN }
  };

  const api = { SCHEMA, TABELLEN, THEMEN, AUFGABEN, DBS };
  root.GENSQLDATEN = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
