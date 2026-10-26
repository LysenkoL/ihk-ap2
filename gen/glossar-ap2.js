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
    ["das Überschreiben von Methoden", "переопределение метода", "Die Unterklasse ersetzt eine geerbte Methode mit gleicher Signatur durch eigene Logik (@Override).", "2", "prog", ["Overriding"]],

    /* ==================================================================
       Wörter aus den echten GA1/GA2-Bögen 2021–2026, die zum Verstehen der
       Aufgabe nötig sind (nicht schon im Glossar oder im Prüfungsdeutsch)
       ================================================================== */
    /* --------------------------------- Prüfungsbogen: Wörter rund um die Aufgabe */
    ["der Belegsatz", "приложения к экзамену (набор материалов)", "Extra-Heft zur Prüfung mit Material wie Diagrammen, SQL-Syntax und Tabellen.", "2", "pruef", ["Belegsätze", "Belegsätzen"]],
    ["die Teilaufgabe", "подзадание (часть задания)", "Ein Teil einer Aufgabe, z. B. aa) oder b), mit eigenen Punkten.", "1+2", "pruef", []],
    ["die Aufgabenstellung", "формулировка задания", "Der Text, der sagt, was man in der Aufgabe tun soll.", "1+2", "pruef", []],
    ["die Ausgangslage", "исходная ситуация", "Beschreibung am Anfang: Firma, Projekt und Problem.", "1+2", "pruef", []],
    ["die Anmerkung", "примечание", "Ein zusätzlicher Hinweis zu einem Text oder einer Lösung.", "1+2", "pruef", []],
    ["der Lösungshinweis", "указание к решению (от составителей)", "Vorschlag der Prüfer, was in der Antwort stehen soll; andere richtige Antworten zählen auch.", "1+2", "pruef", ["Lösungserläuterung", "Lösungserläuterungen"]],
    ["die Punkteaufteilung", "распределение баллов", "Wie viele Punkte es für welchen Teil der Antwort gibt.", "1+2", "pruef", ["Punkteverteilung", "Punktevergabe"]],
    ["der Auszug", "выдержка, фрагмент", "Nur ein Teil von etwas Größerem, z. B. ein Teil einer Tabelle.", "1+2", "pruef", ["Auszüge", "Ausschnitt", "Ausschnitte", "Tabellenauszug", "Tabellenauszüge"]],
    ["die Anlage", "приложение (к документу); также установка, оборудование", "Zusätzliches Blatt zu einem Text oder eine technische Einrichtung, z. B. eine Sprinkler-Anlage.", "1+2", "pruef", []],

    /* ------------------------------------------------- kleine Wörter in Aufgaben */
    ["bzw.", "или; соответственно (beziehungsweise)", "Kurz für „beziehungsweise“: oder, genauer gesagt, oder jeweils passend dazu.", "1+2", "pruef", []],
    ["bspw.", "например (beispielsweise)", "Kurz für „beispielsweise“: zum Beispiel.", "1+2", "pruef", ["bspw", "beispielsweise"]],
    ["gemäß", "согласно, в соответствии с", "So, wie es eine Regel oder ein Text vorgibt.", "1+2", "pruef", []],
    ["laut", "согласно (данным), по словам", "Nach Angabe von, z. B. „laut Tabelle“ = so steht es in der Tabelle.", "1+2", "pruef", []],
    ["mittels", "посредством, с помощью", "Mit Hilfe von etwas.", "1+2", "pruef", []],
    ["entweder … oder", "либо … либо", "Nur eins von beiden ist möglich, nicht beides.", "1+2", "pruef", ["entweder"]],
    ["ebenfalls", "также, тоже", "Auch, genauso wie vorher.", "1+2", "pruef", []],
    ["zukünftig", "в будущем, впредь", "Ab jetzt und später, nicht heute schon.", "1+2", "pruef", ["künftig", "zukünftige", "zukünftigen"]],
    ["solange", "пока, до тех пор пока", "Die ganze Zeit, in der etwas gilt; danach hört es auf.", "1+2", "pruef", []],
    ["sobald", "как только", "Genau dann, wenn etwas passiert, und nicht früher.", "1+2", "pruef", []],
    ["andernfalls", "в противном случае, иначе", "Wenn nicht, dann …", "1+2", "pruef", []],
    ["i. d. R.", "как правило (in der Regel)", "Kurz für „in der Regel“: meistens, normalerweise — Ausnahmen sind möglich.", "1+2", "pruef", ["i.d.R.", "in der Regel"]],
    ["zutreffend", "верный, соответствующий", "Passt zur Situation, ist richtig. „Nicht zutreffend“ = falsch für diesen Fall.", "1+2", "pruef", ["zutreffende", "zutreffenden", "trifft zu"]],
    ["der Sachverhalt", "обстоятельства дела, ситуация", "Was genau passiert ist oder vorliegt — die Fakten eines Falls.", "1+2", "pruef", []],
    ["stichpunktartig", "тезисно, по пунктам", "In kurzen Stichworten, nicht in ganzen Sätzen.", "1+2", "pruef", ["in Stichpunkten", "in Stichworten", "stichwortartig"]],
    ["unter Berücksichtigung", "с учётом", "Dabei an etwas denken und es in die Antwort einbeziehen.", "1+2", "pruef", ["unter Beachtung", "berücksichtigen Sie"]],
    ["siehe", "смотри (см.)", "Hinweis: Dort steht mehr dazu.", "1+2", "pruef", []],
    ["kennzeichnen", "отметить, обозначить", "Etwas sichtbar markieren, z. B. mit einem Kreuz oder einer Farbe.", "1+2", "pruef", ["kennzeichnet", "gekennzeichnet", "gekennzeichnete", "gekennzeichneten", "Kennzeichnung"]],

    /* -------------------------------------------------- UML: Ablauf und Abläufe */
    ["der Startknoten", "начальный узел", "UML: ausgefüllter Punkt, an dem der Ablauf beginnt.", "2", "prog", ["Anfangsknoten", "Initialknoten", "Startpunkt"]],
    ["der Endknoten", "конечный узел", "UML: Punkt mit Ring, an dem der ganze Ablauf endet.", "2", "prog", ["Aktivitätsendknoten"]],
    ["die Aktion", "действие (в т. ч. в UML)", "Ein einzelner Schritt; im UML-Aktivitätsdiagramm ein Rechteck mit runden Ecken.", "2", "prog", []],
    ["die Aktivität", "деятельность (UML)", "UML: ein ganzer Ablauf aus mehreren Aktionen.", "2", "prog", ["Aktivitäten"]],
    ["die Zusammenführung", "слияние (merge, UML)", "UML: Raute, an der sich verschiedene Wege wieder treffen.", "2", "prog", ["Merge-Knoten"]],
    ["die Gabelung", "разветвление (fork, UML)", "UML: dicker Balken, ab dem mehrere Wege gleichzeitig laufen.", "2", "prog", ["Fork", "Parallelisierungsknoten"]],
    ["die Synchronisation", "синхронизация (join, UML)", "UML: dicker Balken, an dem der Ablauf wartet, bis alle parallelen Wege fertig sind.", "2", "prog", ["Synchronisierung", "Synchronisationsbalken", "Synchronisationsknoten", "Join-Knoten"]],
    ["parallel", "параллельно, одновременно", "Gleichzeitig, nebeneinander.", "1+2", "prog", ["Parallelität"]],
    ["die Schwimmbahn", "дорожка (swimlane, UML)", "UML: Streifen im Aktivitätsdiagramm, der zeigt, wer eine Aktion ausführt.", "2", "prog", ["Schwimmbahnen", "Swimlane", "Swimlanes"]],
    ["der Anwendungsfall", "вариант использования (use case)", "Eine Funktion des Systems mit Nutzen für einen Akteur, gezeichnet als Ellipse.", "2", "prog", ["Anwendungsfälle", "Anwendungsfällen", "Use-Case", "Use Cases"]],
    ["die Systemgrenze", "граница системы", "UML: Rechteck um alle Anwendungsfälle; die Akteure stehen außen.", "2", "prog", []],
    ["die include-Beziehung", "отношение «include»", "Ein Anwendungsfall enthält immer einen anderen Anwendungsfall.", "2", "prog", ["include", "«include»", "<<include>>"]],
    ["die extend-Beziehung", "отношение «extend»", "Ein Anwendungsfall erweitert einen anderen nur unter einer Bedingung.", "2", "prog", ["extend", "«extend»", "<<extend>>"]],
    ["die Lebenslinie", "линия жизни (UML)", "UML-Sequenzdiagramm: gestrichelte Linie unter einem Objekt; die Zeit läuft nach unten.", "2", "prog", []],
    ["die Nachricht", "сообщение (в т. ч. в UML)", "UML-Sequenzdiagramm: Pfeil von einem Objekt zum anderen, meist ein Methodenaufruf.", "2", "prog", ["Antwortnachricht"]],
    ["der Aktivierungsbalken", "полоса активации (UML)", "UML-Sequenzdiagramm: schmales Rechteck auf der Lebenslinie, solange das Objekt arbeitet.", "2", "prog", ["Methodenbalken"]],
    ["das kombinierte Fragment", "комбинированный фрагмент (UML)", "UML-Sequenzdiagramm: Rahmen mit alt, opt oder loop für Bedingung oder Schleife.", "2", "prog", ["kombiniertes Fragment", "kombinierten Fragment", "Fragment", "Fragmente"]],
    ["der Selbstaufruf", "самовызов", "Ein Objekt ruft eine eigene Methode auf; im Sequenzdiagramm ein Pfeil zu sich selbst.", "2", "prog", ["Selbstaufrufe", "Selbstnachricht"]],
    ["der Zustandsübergang", "переход между состояниями", "UML-Zustandsdiagramm: Pfeil von einem Zustand zum nächsten, ausgelöst durch ein Ereignis.", "2", "prog", ["Zustandsübergänge", "Übergang", "Übergänge", "Transition", "Transitionen"]],
    ["das Ereignis", "событие", "Etwas passiert, z. B. ein Klick, und löst eine Reaktion aus.", "2", "prog", ["Ereignisse", "Ereignissen", "Event"]],

    /* ------------------------------------------- Programmieren: Wörter im Bogen */
    ["der Durchlauf", "проход (цикла)", "Der Inhalt einer Schleife wird einmal ausgeführt.", "2", "prog", ["Durchläufe", "Durchläufen", "Schleifendurchlauf", "Schleifendurchläufe"]],
    ["die Iteration", "итерация", "Ein Durchgang: in der Schleife ein Durchlauf, im Projekt eine kurze Entwicklungsrunde.", "2", "prog", ["iterativ"]],
    ["Getter und Setter", "геттер и сеттер (методы доступа)", "Der Getter liest ein privates Attribut (getName), der Setter ändert es (setName).", "2", "prog", ["Getter", "Setter", "Get-Methode", "Get-Methoden", "Getter-Methode", "Getter-Methoden", "Set-Methode", "Set-Methoden", "Setter-Methode", "Setter-Methoden"]],
    ["die Unterklasse", "подкласс (дочерний класс)", "Klasse, die von einer anderen Klasse erbt.", "2", "prog", ["Subklasse", "abgeleitete Klasse", "Kindklasse"]],
    ["die Oberklasse", "суперкласс (базовый класс)", "Klasse, von der andere Klassen erben.", "2", "prog", ["Basisklasse", "Superklasse", "Elternklasse"]],
    ["statisch", "статический (static)", "Gehört zur Klasse, nicht zu einem einzelnen Objekt; in UML unterstrichen.", "2", "prog", ["static"]],
    ["void", "void (ничего не возвращает)", "Rückgabetyp einer Methode, die keinen Wert zurückgibt.", "2", "prog", []],
    ["die Rückgabe", "возврат значения; zurückgeben — вернуть", "Die Methode liefert am Ende einen Wert an den Aufrufer (return).", "2", "prog", ["zurückgeben", "zurückgegeben", "zurückgibt", "zurückzugeben", "zurückliefern", "zurückgeliefert", "Rückgabetyp"]],
    ["der Aufruf", "вызов (метода); aufrufen — вызвать", "Eine Methode oder Funktion wird gestartet, z. B. berechne(5).", "2", "prog", ["Aufrufe", "Methodenaufruf", "Methodenaufrufe", "Funktionsaufruf", "aufrufen", "aufgerufen", "aufruft", "aufzurufen"]],
    ["übergeben", "передать (параметр)", "Beim Aufruf bekommt die Methode Werte als Parameter.", "2", "prog", ["übergibt", "Übergabe"]],
    ["die Zuweisung", "присваивание", "Eine Variable bekommt einen Wert, z. B. x = 5.", "2", "prog", []],
    ["der Zähler", "счётчик", "Variable, die mitzählt, z. B. i in einer Zählschleife.", "2", "prog", ["Zählers", "Zählvariable", "Laufvariable"]],
    ["der Schleifenrumpf", "тело цикла", "Die Anweisungen in einer Schleife, die wiederholt werden.", "2", "prog", ["Schleifeninhalt", "Schleifenkörper"]],
    ["der Operator", "оператор (знак операции)", "Zeichen für eine Rechnung oder einen Vergleich, z. B. +, %, == oder AND.", "2", "prog", ["Operatoren"]],
    ["der Modulo-Operator", "остаток от деления (mod, %)", "Liefert den Rest einer ganzzahligen Division, z. B. 7 % 3 = 1.", "2", "prog", ["Modulo", "Modulo-Operation"]],
    ["die Anweisung", "инструкция, оператор (в коде)", "Ein einzelner Befehl im Programm, z. B. eine Zuweisung oder ein Aufruf.", "2", "prog", ["SQL-Anweisung", "SQL-Anweisungen"]],
    ["die Liste", "список", "Datenstruktur, die mitwachsen kann, z. B. ArrayList; auch eine Aufzählung.", "1+2", "prog", ["ArrayList", "Auflistung"]],
    ["die Bibliothek", "библиотека (кода)", "Sammlung fertiger Klassen und Funktionen für das eigene Programm.", "2", "prog", ["Bibliotheken", "Programmbibliothek", "Library"]],
    ["kompilieren", "компилировать", "Quellcode mit dem Compiler in ausführbaren Code übersetzen.", "2", "prog", ["kompiliert", "Kompilierung"]],
    ["der Sortieralgorithmus", "алгоритм сортировки", "Verfahren, das Daten in eine Reihenfolge bringt, z. B. Bubble Sort.", "2", "prog", ["Sortieralgorithmen"]],
    ["die Effizienz", "эффективность (время и память)", "Eine Aufgabe mit wenig Zeit und Speicher lösen.", "2", "prog", ["effizient"]],

    /* ----------------------------------------------------- SQL und Datenmodell */
    ["die Tabelle", "таблица", "In der Datenbank: Daten in Zeilen (Datensätze) und Spalten (Attribute).", "1+2", "db", ["Datenbanktabelle"]],
    ["die Abfrage", "запрос (к базе данных)", "Frage an die Datenbank, meist mit SELECT; das Ergebnis ist eine Tabelle.", "2", "db", ["SQL-Abfrage", "SQL-Abfragen", "Datenbankabfrage", "Datenbankabfragen"]],
    ["die Unterabfrage", "подзапрос", "Ein SELECT innerhalb eines anderen SELECT, z. B. in WHERE … IN (SELECT …).", "2", "db", ["Subquery", "Subselect"]],
    ["die Ergebnistabelle", "таблица результата", "Tabelle, die eine SQL-Abfrage als Ergebnis liefert.", "2", "db", ["Beispiel-Ergebnistabelle", "Ergebnismenge"]],
    ["aufsteigend", "по возрастанию (ASC)", "Vom kleinsten zum größten Wert, von A bis Z; in SQL ASC.", "2", "db", ["ASC"]],
    ["absteigend", "по убыванию (DESC)", "Vom größten zum kleinsten Wert, von Z bis A; in SQL DESC.", "2", "db", ["DESC"]],
    ["die Sortierung", "сортировка", "Daten in eine Reihenfolge bringen, in SQL mit ORDER BY.", "2", "db", ["sortiert", "ORDER BY"]],
    ["die Gruppierung", "группировка", "Datensätze mit gleichem Wert zusammenfassen, in SQL mit GROUP BY.", "2", "db", ["gruppiert", "gruppieren", "GROUP BY"]],
    ["die Aggregatfunktion", "агрегатная функция", "SQL-Funktion über viele Zeilen: COUNT, SUM, AVG, MIN oder MAX.", "2", "db", []],
    ["der Durchschnitt", "среднее значение", "Summe geteilt durch Anzahl; in SQL AVG.", "1+2", "db", ["Mittelwert", "AVG"]],
    ["die Zwischentabelle", "промежуточная (связующая) таблица", "Tabelle, die eine m:n-Beziehung mit den Fremdschlüsseln beider Seiten auflöst.", "2", "db", ["Verknüpfungstabelle", "Koppeltabelle", "Zuordnungstabelle"]],
    ["die Anomalie", "аномалия (данных)", "Fehler beim Einfügen, Ändern oder Löschen, weil Daten mehrfach gespeichert sind.", "2", "db", ["Anomalien", "Einfügeanomalie", "Änderungsanomalie", "Löschanomalie"]],
    ["das Datenmodell", "модель данных", "Plan, welche Daten es gibt und wie sie zusammenhängen.", "2", "db", ["Datenbankmodell", "Datenmodells"]],
    ["relational", "реляционный", "Die Daten stehen in Tabellen, die über Schlüssel verbunden sind.", "2", "db", []],
    ["der NULL-Wert", "значение NULL (пусто)", "Feld ohne Wert — nicht dasselbe wie 0 oder ein leerer Text.", "2", "db", ["NULL-Werte", "Nullwert", "NULL"]],
    ["die Stored Procedure", "хранимая процедура", "In der Datenbank gespeichertes SQL-Programm, das man mit Namen aufruft.", "2", "db", ["Stored Procedures", "gespeicherte Prozedur"]],
    ["der Trigger", "триггер", "SQL-Code, der automatisch startet, z. B. bei INSERT oder UPDATE.", "2", "db", []],

    /* ------------------------------------------------------ Testen und Qualität */
    ["das erwartete Ergebnis", "ожидаемый результат", "Was beim Test herauskommen soll; man vergleicht es mit dem echten Ergebnis.", "2", "qual", ["erwartetes Ergebnis", "erwarteten Ergebnis", "erwartete Ergebnisse", "erwartete Ausgabe", "Sollergebnis", "Soll-Ergebnis"]],
    ["die Testdaten", "тестовые данные", "Eingabewerte, mit denen man ein Programm prüft.", "2", "qual", []],
    ["der Grenzwert", "граничное значение", "Wert direkt an einer Grenze, z. B. 0 oder 100 bei „0 bis 100“.", "2", "qual", []],
    ["die Testabdeckung", "тестовое покрытие", "Wie viel vom Code die Tests ausführen, meist in Prozent.", "2", "qual", ["Codeabdeckung", "Code Coverage", "Testüberdeckung"]],
    ["die Pfadüberdeckung", "покрытие путей (C2)", "White-Box-Kriterium: Jeder mögliche Weg durch das Programm wird getestet.", "2", "qual", ["C2-Test", "C2-Überdeckung"]],
    ["das Qualitätsmerkmal", "характеристика качества", "Eigenschaft guter Software, z. B. Zuverlässigkeit oder Wartbarkeit.", "2", "qual", ["Qualitätskriterium", "Qualitätskriterien"]],
    ["die Zuverlässigkeit", "надёжность", "Die Software arbeitet lange ohne Fehler und Ausfälle.", "2", "qual", []],
    ["die Portabilität", "переносимость", "Die Software läuft auch auf anderen Systemen, z. B. Windows und Linux.", "2", "qual", ["Übertragbarkeit", "portabel"]],
    ["die Fehlertoleranz", "толерантность к ошибкам (ввода)", "Trotz falscher Eingabe kommt man mit wenig Aufwand zum Ziel.", "2", "qual", ["fehlertolerant"]],
    ["die Skalierbarkeit", "масштабируемость", "Das System schafft mehr Nutzer oder Daten, wenn man Ressourcen ergänzt.", "2", "qual", ["skalierbar"]],
    ["die Benutzerfreundlichkeit", "удобство для пользователя", "Die Software ist leicht zu verstehen und zu bedienen.", "1+2", "qual", ["Bedienbarkeit", "Benutzbarkeit", "benutzerfreundlich", "Bedienerfreundlichkeit"]],
    ["die Validierung", "валидация (проверка ввода)", "Prüfen, ob Eingaben gültig sind, z. B. Format oder Pflichtfeld.", "2", "qual", ["validieren", "validiert", "Eingabevalidierung"]],

    /* ---------------------------------------------------------------- Projekt */
    ["der Projektleiter", "руководитель проекта", "Person, die das Projekt plant, steuert und verantwortet.", "1+2", "proj", ["Projektleiterin", "Projektleitung", "Projektmanager"]],
    ["das Teilprojekt", "подпроект", "Abgegrenzter Teil eines großen Projekts mit eigenem Ziel.", "1+2", "proj", []],
    ["das Vorgehensmodell", "модель процесса разработки", "Plan, in welchen Schritten Software entsteht, z. B. Wasserfall, V-Modell oder Scrum.", "1+2", "proj", []],
    ["die Anforderungsanalyse", "анализ требований", "Anforderungen sammeln, prüfen und ordnen, bevor man entwickelt.", "2", "proj", ["Anforderungserhebung"]],
    ["das Projektmanagement", "управление проектом", "Ein Projekt planen, steuern und kontrollieren: Zeit, Kosten, Qualität.", "1+2", "proj", []],
    ["die Ressource", "ресурс", "Was man für die Arbeit braucht: Personen, Geräte, Räume, Geld oder Zeit.", "1+2", "proj", []],
    ["die Dauer", "продолжительность", "Wie lange etwas dauert.", "1+2", "proj", ["Zeitdauer"]],

    /* ------------------------------------------- Personen und Fälle aus der Situation */
    ["der Kunde", "клиент, заказчик", "Person oder Firma, die etwas kauft oder bestellt.", "1+2", "kunde", ["Kundin"]],
    ["der Lieferant", "поставщик", "Firma, die Waren oder Leistungen liefert.", "1+2", "kunde", []],
    ["der Mitarbeiter", "сотрудник", "Person, die in einer Firma arbeitet.", "1+2", "org", ["Mitarbeiterin", "Mitarbeiterinnen", "Mitarbeitende", "Mitarbeitenden"]],
    ["der Benutzer", "пользователь", "Person, die ein Programm oder System bedient.", "1+2", "sys", ["Benutzerin", "Anwender", "Anwenderin"]],
    ["die Abrechnung", "расчёт, выставление счёта", "Kosten oder Leistungen zusammenrechnen und in Rechnung stellen.", "1+2", "wirt", ["abrechnen", "abgerechnet"]],
    ["die Buchung", "бронирование", "Einen Platz, Raum oder ein Ticket fest reservieren, meist mit Bezahlung.", "1+2", "kunde", ["buchen", "gebucht"]],
    ["die Reservierung", "резервирование", "Etwas für später festhalten, z. B. einen Tisch oder Raum.", "1+2", "kunde", ["reservieren", "reserviert"]],
    ["die Bezeichnung", "название, обозначение", "Name, mit dem man etwas benennt, z. B. die Artikelbezeichnung.", "1+2", "org", []],
    ["der Messwert", "измеренное значение", "Zahl, die ein Sensor oder Messgerät liefert.", "2", "hw", ["Messung", "Messungen", "Messdaten"]],
    ["der Sensor", "датчик", "Bauteil, das z. B. Temperatur oder Feuchtigkeit misst.", "1+2", "hw", ["Sensoren"]],

    /* -------------------------------------------- Oberfläche, Web, Sicherheit */
    ["die Benutzeroberfläche", "пользовательский интерфейс", "Was der Nutzer am Bildschirm sieht und bedient: Fenster, Knöpfe, Felder.", "1+2", "sys", ["Oberfläche", "Bedienoberfläche", "GUI"]],
    ["die Schaltfläche", "кнопка (на экране)", "Knopf in einer Oberfläche, den man anklickt.", "1+2", "sys", ["Button", "Buttons"]],
    ["das Eingabefeld", "поле ввода", "Feld in der Oberfläche, in das man Text oder Zahlen tippt.", "1+2", "sys", ["Textfeld", "Textfelder"]],
    ["Request und Response", "запрос и ответ (HTTP)", "Request = Anfrage des Clients an den Server, Response = Antwort des Servers mit Statuscode und Daten.", "2", "prog", ["Request", "Requests", "HTTP-Request", "HTTP-Anfrage", "Response", "HTTP-Response", "HTTP-Antwort"]],
    ["die Bereitstellung", "развёртывание (deployment)", "Software auf den Server bringen und für die Nutzer startklar machen.", "2", "cloud", ["Deployment"]],
    ["die Anmeldung", "вход в систему (логин)", "Sich mit Benutzername und Passwort am System ausweisen.", "1+2", "sich", ["Login", "Log-in", "anmelden", "einloggen"]],
    ["die Berechtigung", "право доступа", "Erlaubnis, im System etwas zu lesen, zu ändern oder zu löschen.", "1+2", "sich", ["Zugriffsrecht", "Zugriffsrechte"]],
    ["die Schwachstelle", "уязвимость", "Fehler oder Lücke, die ein Angreifer ausnutzen kann.", "1+2", "sich", ["Sicherheitslücke", "Sicherheitslücken"]],
    ["die Datensicherheit", "безопасность данных", "Technischer Schutz der Daten vor Verlust, Änderung und fremdem Zugriff.", "1+2", "sich", []]
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
