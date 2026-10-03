/* ============================================================================
   gen/glossar-ap2.js — weitere Fachbegriffe für AP2 (DE → RU)
   ----------------------------------------------------------------------------
   Lädt NACH glossar-daten.js und VOR glossar.js. Ergänzt die Begriffe aus
   den neuen Themen (gen/lernen-daten.js): Entwurfsmuster, Tests, Git,
   REST/SOAP, Datenformate, Kryptographie, Agil, Ergonomie, Werkzeuge,
   Such- und Sortierverfahren.

   Format wie glossar-daten.js. Die erste Form gewinnt beim Markieren im
   Text — deshalb werden ein paar allgemeine Varianten bei älteren Einträgen
   entfernt (z. B. „Singleton“ beim Entwurfsmuster), damit der genauere
   neue Begriff greift.
   ========================================================================== */
"use strict";

(function (root) {
  const NEU = [
    /* -------------------------------------------------- Entwurfsmuster */
    ["das Singleton", "одиночка (шаблон Singleton)", "Entwurfsmuster: Von einer Klasse gibt es genau ein Objekt. Privater Konstruktor, Zugriff über eine statische Methode getInstanz().", "2", "prog", ["Singleton-Muster", "Singleton Pattern"]],
    ["das Observer-Muster", "наблюдатель (шаблон Observer)", "Entwurfsmuster: Ein Subjekt benachrichtigt alle angemeldeten Beobachter automatisch, wenn sich sein Zustand ändert.", "2", "prog", ["Observer", "Beobachter-Muster", "Observer Pattern"]],
    ["das Factory-Muster", "фабрика (шаблон Factory)", "Entwurfsmuster: Eine Fabrikmethode erzeugt die Objekte. Der Aufrufer kennt die konkrete Klasse nicht.", "2", "prog", ["Factory", "Fabrikmethode", "Factory Method", "Factory Pattern"]],
    ["das Fassaden-Muster", "фасад (шаблон Facade)", "Entwurfsmuster: Eine einfache Klasse ist der Eingang zu vielen komplizierten Klassen dahinter.", "2", "prog", ["Facade", "Fassade", "Facade Pattern"]],
    ["Model-View-Controller", "модель–представление–контроллер (MVC)", "Architekturmuster: Model = Daten und Logik, View = Anzeige, Controller = verarbeitet Eingaben und steuert beide.", "2", "prog", ["MVC", "MVC-Muster"]],

    /* ----------------------------------------------------------- Tests */
    ["der Systemtest", "системное тестирование", "Test des ganzen Systems gegen die Anforderungen, in einer Umgebung wie im echten Betrieb.", "2", "qual", ["Systemtests"]],
    ["der Regressionstest", "регрессионное тестирование", "Nach einer Änderung laufen die alten Tests noch einmal. So sieht man, ob dabei etwas kaputtgegangen ist.", "2", "qual", ["Regressionstests"]],
    ["der Lasttest", "нагрузочное тестирование", "Prüft das System unter der erwarteten Last, z. B. 500 Nutzer gleichzeitig.", "2", "qual", ["Lasttests"]],
    ["der Stresstest", "стресс-тест", "Last über die Grenze hinaus: Wann bricht das System zusammen und wie verhält es sich dann?", "2", "qual", ["Stresstests"]],
    ["der Performancetest", "тест производительности", "Misst Antwortzeiten und Durchsatz, z. B. „Die Suche antwortet in unter 2 Sekunden“.", "2", "qual", ["Performancetests", "Leistungstest"]],
    ["die Staging-Umgebung", "предрелизная среда (staging)", "Testumgebung, aufgebaut wie der echte Betrieb. Dort läuft der letzte Test vor dem Livegang.", "2", "qual", ["Staging", "Staging-System"]],
    ["der End-to-End-Test", "сквозной тест (E2E)", "Testet einen ganzen Ablauf aus Sicht des Nutzers durch alle Schichten, z. B. von der Bestellung bis zur Rechnung.", "2", "qual", ["E2E-Test", "End-to-End-Tests", "E2E-Tests"]],
    ["die Äquivalenzklasse", "класс эквивалентности", "Gruppe von Eingaben, die das Programm gleich behandelt. Aus jeder Klasse reicht ein Testwert.", "2", "qual", ["Äquivalenzklassen", "Äquivalenzklassenbildung"]],
    ["die Grenzwertanalyse", "анализ граничных значений", "Testwerte direkt an den Grenzen wählen, z. B. 17, 18, 65, 66 bei „18 bis 65“. Dort passieren die meisten Fehler.", "2", "qual", ["Grenzwerttest", "Grenzwerte", "Extremwerttest"]],
    ["die Anweisungsüberdeckung", "покрытие операторов (C0)", "White-Box-Kriterium: Jede Anweisung wird mindestens einmal ausgeführt.", "2", "qual", ["C0-Test", "C0-Überdeckung"]],
    ["die Zweigüberdeckung", "покрытие ветвей (C1)", "White-Box-Kriterium: Jeder Zweig jeder Entscheidung (wahr und falsch) wird mindestens einmal durchlaufen.", "2", "qual", ["C1-Test", "C1-Überdeckung"]],
    ["die testgetriebene Entwicklung", "разработка через тестирование (TDD)", "Erst den Test schreiben, dann den Code, bis der Test grün ist, dann aufräumen (Red – Green – Refactor).", "2", "qual", ["TDD", "Test-Driven Development"]],
    ["das FIRST-Prinzip", "принцип FIRST (юнит-тесты)", "Gute Unit-Tests: Fast, Independent, Repeatable, Self-validating, Timely — schnell, unabhängig, wiederholbar, selbstprüfend, rechtzeitig.", "2", "qual", ["FIRST-Prinzipien"]],
    ["die Continuous Integration", "непрерывная интеграция (CI)", "Jede Änderung kommt oft ins gemeinsame Repository und wird automatisch gebaut und getestet.", "2", "qual", ["kontinuierliche Integration", "CI/CD"]],

    /* ------------------------------------------------------------- Git */
    ["das Repository", "репозиторий", "Speicher eines Projekts in der Versionsverwaltung: alle Dateien und die ganze Änderungsgeschichte.", "2", "prog", ["Repositories", "Repo"]],
    ["der Commit", "коммит (фиксация изменений)", "Gespeicherter Stand von Änderungen in Git, mit Nachricht, Autor und Zeit.", "2", "prog", ["Commits", "committen"]],
    ["der Branch (Git)", "ветка (Git)", "Eigener Entwicklungszweig in Git. Man arbeitet getrennt, ohne den Hauptzweig zu stören.", "2", "prog", ["Git-Branch", "Feature-Branch", "Branches"]],
    ["der Merge", "слияние веток (merge)", "Zwei Branches zusammenführen. Ändern beide dieselbe Zeile, entsteht ein Merge-Konflikt, den ein Mensch löst.", "2", "prog", ["Merge-Konflikt", "Mergekonflikt", "mergen"]],
    ["git push", "отправка коммитов (push)", "Lädt die lokalen Commits ins entfernte Repository hoch.", "2", "prog", ["pushen"]],
    ["git pull", "получение коммитов (pull)", "Holt neue Commits aus dem entfernten Repository und baut sie in den eigenen Stand ein (fetch + merge).", "2", "prog", ["pullen"]],
    ["der Pull Request", "запрос на слияние (pull request)", "Bitte, einen Branch in den Hauptzweig zu übernehmen. Vorher prüfen Kollegen den Code (Review).", "2", "prog", ["Pull Requests", "Merge Request", "Merge Requests"]],

    /* ---------------------------------------------------- Schnittstellen */
    ["REST", "архитектурный стиль REST", "Stil für Webschnittstellen: Ressourcen mit URI, Zugriff über HTTP-Methoden (GET, POST, PUT, DELETE), zustandslos, meist JSON.", "2", "prog", ["RESTful", "REST-Schnittstelle"]],
    ["SOAP", "протокол SOAP", "Protokoll für Webservices: Nachrichten in XML (Envelope, Header, Body), Beschreibung des Dienstes in einer WSDL.", "2", "prog", ["SOAP-Webservice", "WSDL"]],
    ["der HTTP-Statuscode", "код состояния HTTP", "Dreistellige Antwort des Servers: 2xx Erfolg, 3xx Umleitung, 4xx Fehler des Clients, 5xx Fehler des Servers.", "2", "prog", ["Statuscode", "Statuscodes", "HTTP-Statuscodes"]],
    ["idempotent", "идемпотентный", "Mehrmals ausführen ergibt denselben Zustand auf dem Server wie einmal. GET, PUT und DELETE sind idempotent, POST nicht.", "2", "prog", ["Idempotenz"]],

    /* ------------------------------------------------------- Formate */
    ["das CSV-Format", "формат CSV", "Text-Tabelle: eine Zeile pro Datensatz, Werte durch Komma oder Semikolon getrennt. Keine Datentypen, keine Verschachtelung.", "2", "prog", ["CSV", "CSV-Datei", "CSV-Dateien"]],
    ["wohlgeformt", "правильно сформированный (XML)", "XML ist wohlgeformt, wenn die Syntax stimmt: ein Wurzelelement, jedes Tag geschlossen, richtig verschachtelt.", "2", "prog", ["wohlgeformtes", "Wohlgeformtheit"]],
    ["das gültige XML", "валидный XML", "XML ist gültig (valide), wenn es wohlgeformt ist und zusätzlich zu seinem Schema (DTD oder XSD) passt.", "2", "prog", ["valides XML", "valide XML"]],
    ["die DTD", "DTD (определение типа документа)", "Document Type Definition: legt fest, welche Elemente und Attribute ein XML-Dokument haben darf.", "2", "prog", ["Document Type Definition"]],
    ["das XML-Schema", "XML-схема (XSD)", "Beschreibt den erlaubten Aufbau eines XML-Dokuments — genauer als die DTD, auch mit Datentypen.", "2", "prog", ["XSD", "XML Schema"]],

    /* -------------------------------------------------- IT-Sicherheit */
    ["das Salt", "соль (случайная добавка к паролю)", "Zufallswert, der vor dem Hashen an das Passwort gehängt wird. Gleiche Passwörter ergeben so verschiedene Hashwerte.", "2", "sich", ["Salting", "gesalzen"]],
    ["die Public-Key-Infrastruktur", "инфраструктура открытых ключей (PKI)", "System aus Zertifizierungsstelle (CA), Registrierungsstelle (RA), Verzeichnis und Sperrlisten für Zertifikate.", "2", "sich", ["PKI"]],
    ["die Zertifizierungsstelle", "удостоверяющий центр (CA)", "Vertrauenswürdige Stelle, die Zertifikate ausstellt und digital signiert.", "2", "sich", ["Certificate Authority", "Zertifizierungsstellen"]],
    ["X.509", "стандарт сертификатов X.509", "Standard für digitale Zertifikate: Inhaber, öffentlicher Schlüssel, Aussteller, Gültigkeit, Seriennummer, Signatur.", "2", "sich", ["X.509-Zertifikat"]],
    ["der HMAC", "HMAC (код аутентификации сообщения)", "Hashwert mit geheimem Schlüssel: zeigt, dass die Nachricht unverändert ist und vom Schlüsselinhaber kommt.", "2", "sich", ["HMAC", "Message Authentication Code"]],
    ["das Single Sign-on", "единый вход (SSO)", "Einmal anmelden, dann Zugang zu vielen Anwendungen. Der eine Zugang muss gut geschützt sein (MFA).", "2", "sich", ["SSO", "Single Sign-On", "Einmalanmeldung"]],
    ["OAuth 2.0", "протокол авторизации OAuth 2.0", "Standard, mit dem eine App im Namen des Nutzers auf Daten zugreifen darf (Access Token), ohne sein Passwort zu kennen.", "2", "sich", ["OAuth", "OAuth2"]],
    ["die rollenbasierte Zugriffskontrolle", "ролевое управление доступом (RBAC)", "Rechte hängen an Rollen (z. B. Buchhaltung), Nutzer bekommen Rollen. Einfacher zu verwalten als Rechte je Person.", "2", "sich", ["RBAC", "Rollenkonzept"]],
    ["das Prepared Statement", "подготовленный запрос", "SQL-Befehl mit Platzhaltern (?). Die Eingaben werden getrennt übergeben — Schutz vor SQL-Injection.", "2", "sich", ["Prepared Statements", "parametrisierte Abfrage"]],

    /* ---------------------------------------------------- Datenbank */
    ["der Constraint", "ограничение целостности", "Regel in der Datenbank: PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, CHECK. Falsche Daten werden abgelehnt.", "2", "db", ["Constraints", "Integritätsbedingung", "Integritätsbedingungen"]],
    ["der Rollback", "откат транзакции", "Macht alle Änderungen einer Transaktion rückgängig, z. B. wenn ein Schritt fehlschlägt.", "2", "db", ["ROLLBACK"]],
    ["die referentielle Integrität", "ссылочная целостность", "Ein Fremdschlüssel zeigt immer auf einen vorhandenen Datensatz. Die Datenbank verhindert „Waisen“.", "2", "db", ["referenzielle Integrität"]],

    /* --------------------------------------------------- Vorgehen */
    ["das Spiralmodell", "спиральная модель", "Vorgehensmodell in Runden: Ziele, Risiken prüfen (oft mit Prototyp), entwickeln und testen, nächste Runde planen.", "2", "proj", ["Spiral-Modell"]],
    ["die User Story", "пользовательская история", "Anforderung aus Sicht des Nutzers: „Als <Rolle> möchte ich <Funktion>, damit <Nutzen>.“", "2", "proj", ["User Stories", "Userstory"]],
    ["das Minimum Viable Product", "минимально жизнеспособный продукт (MVP)", "Kleinste Version eines Produkts, die schon nützt. Damit holt man früh echtes Feedback.", "2", "proj", ["MVP"]],
    ["das Pair Programming", "парное программирование", "Zwei Entwickler an einem Rechner: einer schreibt, einer prüft mit. Weniger Fehler, Wissen wird geteilt.", "2", "proj", ["Paarprogrammierung"]],
    ["das Refactoring", "рефакторинг", "Code verbessern (lesbarer, einfacher), ohne sein Verhalten zu ändern. Tests sichern das ab.", "2", "prog", ["Refaktorisierung"]],
    ["der Top-down-Entwurf", "проектирование сверху вниз", "Vom Ganzen zum Detail: Eine große Aufgabe wird schrittweise in kleinere Teile zerlegt.", "2", "prog", ["Top-down"]],
    ["der Bottom-up-Entwurf", "проектирование снизу вверх", "Vom Detail zum Ganzen: Erst einzelne Bausteine bauen, dann zu größeren Teilen zusammensetzen.", "2", "prog", ["Bottom-up"]],

    /* ------------------------------------------------ Ergonomie */
    ["ISO 9241-110", "ISO 9241-110 (принципы взаимодействия)", "Norm mit Grundsätzen guter Bedienung, z. B. Aufgabenangemessenheit, Erwartungskonformität, Steuerbarkeit, Fehlertoleranz.", "2", "qual", ["DIN EN ISO 9241-110", "Dialoggestaltung", "Interaktionsprinzipien"]],
    ["die Erwartungskonformität", "соответствие ожиданиям", "Grundsatz der ISO 9241-110: Die Software verhält sich wie gewohnt — gleiche Symbole, gleiche Orte, gleiche Abläufe.", "2", "qual", []],
    ["die Steuerbarkeit", "управляемость", "Grundsatz der ISO 9241-110: Der Nutzer bestimmt Tempo und Reihenfolge, kann abbrechen und rückgängig machen.", "2", "qual", []],
    ["die Aufgabenangemessenheit", "соответствие задаче", "Grundsatz der ISO 9241-110: Nur die Schritte und Felder, die für die Aufgabe nötig sind.", "2", "qual", []],
    ["die Usability", "удобство использования (юзабилити)", "Gebrauchstauglichkeit: Nutzer erreichen ihr Ziel effektiv, effizient und zufrieden (ISO 9241-11).", "2", "qual", ["Gebrauchstauglichkeit"]],
    ["die User Experience", "пользовательский опыт (UX)", "Das ganze Erleben eines Produkts — vor, während und nach der Nutzung, nicht nur die Bedienung.", "2", "qual", ["UX"]],
    ["das Wireframe", "каркас интерфейса (wireframe)", "Einfache Skizze einer Oberfläche: nur Aufbau und Elemente, ohne Farben und Design.", "2", "proj", ["Wireframes"]],
    ["der Prototyp", "прототип", "Frühe, ausprobierbare Version (z. B. klickbar). Der Kunde kann testen, bevor alles programmiert ist.", "2", "proj", ["Prototypen", "Prototyping", "Klickdummy"]],

    /* ------------------------------------------------- Werkzeuge */
    ["der Linker (Binder)", "компоновщик (линкер)", "Verbindet übersetzte Programmteile und Bibliotheken zu einem ausführbaren Programm.", "2", "prog", []],
    ["der Debugger", "отладчик", "Werkzeug zur Fehlersuche: Haltepunkte setzen, Schritt für Schritt ausführen, Variablen ansehen.", "2", "prog", ["Breakpoint", "Haltepunkt"]],
    ["der Bytecode", "байт-код", "Zwischencode, den z. B. der Java-Compiler erzeugt. Eine virtuelle Maschine (JVM) führt ihn auf jedem System aus.", "2", "prog", ["JVM"]],
    ["das Programmierparadigma", "парадигма программирования", "Grundstil des Programmierens: prozedural, objektorientiert, funktional oder deklarativ (z. B. SQL).", "2", "prog", ["Programmierparadigmen", "deklarativ", "prozedural"]],

    /* ---------------------------------------------- Algorithmen */
    ["die lineare Suche", "линейный поиск", "Prüft ein Element nach dem anderen. Geht auch bei unsortierten Daten. Aufwand O(n).", "2", "prog", ["sequenzielle Suche"]],
    ["die binäre Suche", "двоичный поиск", "Nur bei sortierten Daten: die Mitte prüfen, dann in der passenden Hälfte weitersuchen. Aufwand O(log n).", "2", "prog", ["Binärsuche"]],
    ["der Bubble Sort", "сортировка пузырьком", "Vergleicht Nachbarn und tauscht sie. Das größte Element wandert pro Durchlauf nach hinten. Aufwand O(n²).", "2", "prog", ["Bubblesort", "Bubble-Sort"]],
    ["der Selection Sort", "сортировка выбором", "Sucht im unsortierten Rest das kleinste Element und tauscht es nach vorn. O(n²), aber wenige Tauschvorgänge.", "2", "prog", ["Selectionsort", "Sortieren durch Auswahl"]],
    ["der Insertion Sort", "сортировка вставками", "Nimmt das nächste Element und fügt es links an der richtigen Stelle ein. Schnell bei fast sortierten Daten.", "2", "prog", ["Insertionsort", "Sortieren durch Einfügen"]],
    ["die Laufzeitkomplexität", "временная сложность (O-нотация)", "Wie der Aufwand mit der Datenmenge n wächst, z. B. O(n), O(log n), O(n²).", "2", "prog", ["O-Notation", "Landau-Notation", "Zeitkomplexität"]],

    /* --------------------------------------------------- OOP */
    ["die Exception", "исключение", "Fehlerobjekt zur Laufzeit. Mit try und catch wird es abgefangen, finally läuft immer.", "2", "prog", ["Exceptions", "Ausnahmebehandlung", "try-catch"]],
    ["das Überladen von Methoden", "перегрузка метода", "Gleicher Methodenname, aber andere Parameter — in derselben Klasse.", "2", "prog", ["Overloading", "Methodenüberladung"]],
    ["das Überschreiben von Methoden", "переопределение метода", "Die Unterklasse ersetzt eine geerbte Methode mit gleicher Signatur durch eigene Logik (@Override).", "2", "prog", ["Overriding"]]
  ];

  const G = root.IHK_GLOSSAR || (root.IHK_GLOSSAR = []);
  /* allgemeinere Varianten älterer Einträge abgeben, damit der genaue Begriff greift */
  const ABGEBEN = { "das Entwurfsmuster": ["Singleton"], "die API": ["REST"], "das Sortierverfahren": ["Bubblesort"], "das Debugging": ["Debugger"] };
  G.forEach(r => { const weg = ABGEBEN[r[0]]; if (weg && Array.isArray(r[5])) r[5] = r[5].filter(v => weg.indexOf(v) < 0); });
  /* „Modultest“ ist dasselbe wie Unit-Test */
  G.forEach(r => { if (r[0] === "der Unit-Test" && Array.isArray(r[5]) && r[5].indexOf("Modultest") < 0) r[5].push("Modultest", "Modultests"); });
  const da = new Set(G.map(r => r[0].toLowerCase()));
  NEU.forEach(r => { if (!da.has(r[0].toLowerCase())) G.push(r); });
  if (typeof module === "object" && module.exports) module.exports = { NEU };
})(typeof window !== "undefined" ? window : globalThis);
