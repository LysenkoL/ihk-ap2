/* ============================================================================
   gen/lernen-daten.js — Themen AP2: kurz erklärt, mit Quiz
   ----------------------------------------------------------------------------
   Die Themen folgen dem Prüfungskatalog AP2 (ZPA, 2. Auflage 2024) und
   schließen die Lücken, die in den echten Bögen und im Trainer noch fehlten.
   Angeregt durch die Gliederung von ap2.online — die Texte hier sind eigene,
   in einfachem Deutsch, mit russischen Fachbegriffen. ap2.online steht als
   Link „Nachlesen“ dabei (braucht Internet).

   Thema:
     id, titel, ru (Titel russisch), teil ("GA1" | "GA2" | "GA1+GA2"),
     katalog   — wo es im Prüfungskatalog steht
     links     — [[url, text]] zum Nachlesen
     kurzRu    — das Wichtigste auf Russisch in zwei, drei Sätzen
     punkte    — [[Begriff, russisch, Erklärung]]
     tabelle   — { titel, kopf: [], zeilen: [[]] } (optional)
     code      — [{ titel, text }] (optional)
     merke     — ein Merksatz
     trainer   — "algo" | "sql" | "pseudo" (optional): passender Trainer
     karten    — Kurzfragen (gen/satzbausteine*.js) zu diesem Thema
     quiz      — [{ id, f, code?, o: [Antworten], r: [richtige Indizes], w }]
                 r mit mehreren Einträgen = „alle richtigen ankreuzen“
   ========================================================================== */
"use strict";

(function (root) {
  const T = [];

  /* ======================================================== Algorithmen */
  T.push({
    id: "algo", titel: "Such- und Sortieralgorithmen", ru: "Алгоритмы поиска и сортировки", teil: "GA2",
    katalog: "Katalog Entwicklung 18: lineare und binäre Suche, Bubble, Selection, Insertion Sort",
    links: [["https://ap2.online/algorithmen/suchalgorithmen", "Suchalgorithmen"],
            ["https://ap2.online/algorithmen/sortieralgorithmen", "Sortieralgorithmen"]],
    kurzRu: "Линейный поиск проверяет всё по очереди — O(n). Двоичный поиск работает только с отсортированными данными и каждый раз делит область пополам — O(log n). Bubble, Selection и Insertion Sort — простые сортировки O(n²). На экзамене часто: «запишите массив после каждого прохода».",
    punkte: [
      ["Lineare Suche", "линейный поиск", "Von vorn nach hinten jedes Element prüfen, bis der Wert gefunden ist. Die Daten müssen nicht sortiert sein. Im schlechtesten Fall n Vergleiche → O(n)."],
      ["Binäre Suche", "двоичный поиск", "Nur für sortierte Daten. Das mittlere Element prüfen. Ist der gesuchte Wert kleiner, links weitersuchen, sonst rechts. Jeder Schritt halbiert den Bereich → O(log n). Bei 1.000 Elementen höchstens 10 Vergleiche."],
      ["Mitte berechnen", "середина", "mitte = (links + rechts) DIV 2 — ganzzahlig, also abrunden. Danach links = mitte + 1 oder rechts = mitte − 1. Ist links > rechts, gibt es den Wert nicht."],
      ["Bubble Sort", "сортировка пузырьком", "Immer zwei Nachbarn vergleichen und tauschen, wenn sie falsch stehen. Nach jedem Durchlauf steht das größte Element ganz hinten. Gab es in einem Durchlauf keinen Tausch, ist das Feld sortiert → Abbruch. O(n²)."],
      ["Selection Sort", "сортировка выбором", "Im unsortierten Rest das kleinste Element suchen und mit dem ersten Element des Rests tauschen. Immer O(n²) Vergleiche, aber höchstens n − 1 Tauschvorgänge."],
      ["Insertion Sort", "сортировка вставками", "Das nächste Element nehmen und links im schon sortierten Teil an der richtigen Stelle einfügen; größere Elemente rücken eine Stelle nach rechts. Schlechtester Fall O(n²), bei fast sortierten Daten fast O(n)."],
      ["Durchlauf", "проход", "Ein Lauf der äußeren Schleife. Typische Aufgabe: „Geben Sie den Inhalt des Arrays nach jedem Durchlauf an.“ Bei n Elementen gibt es höchstens n − 1 Durchläufe."],
      ["stabil", "устойчивая сортировка", "Gleiche Werte behalten ihre Reihenfolge. Bubble und Insertion Sort sind stabil, Selection Sort in der üblichen Form nicht."],
      ["O-Notation", "O-нотация (сложность)", "Zeigt, wie der Aufwand mit der Datenmenge n wächst: O(1) konstant, O(log n) sehr gut, O(n) linear, O(n²) quadratisch — doppelt so viele Daten, viermal so viel Arbeit."],
      ["schnellere Verfahren", "быстрые сортировки", "Mergesort schafft immer O(n log n). Quicksort schafft O(n log n) im Durchschnitt, im schlechtesten Fall aber O(n²). In AP2 reicht es meist, sie zu nennen."]
    ],
    tabelle: { titel: "Überblick",
      kopf: ["Verfahren", "Idee", "bester Fall", "schlechtester Fall", "stabil"],
      zeilen: [
        ["Lineare Suche", "nacheinander prüfen", "1 Vergleich", "O(n)", "–"],
        ["Binäre Suche", "Mitte prüfen, Hälfte wegwerfen (nur sortiert!)", "1 Vergleich", "O(log n)", "–"],
        ["Bubble Sort", "Nachbarn tauschen, Größtes wandert nach hinten", "O(n) mit Abbruch", "O(n²)", "ja"],
        ["Selection Sort", "Kleinstes im Rest suchen, nach vorn tauschen", "O(n²)", "O(n²)", "nein"],
        ["Insertion Sort", "in den sortierten Teil einfügen", "O(n)", "O(n²)", "ja"]
      ] },
    code: [
      { titel: "Binäre Suche (Pseudocode)", text:
`funktion binaereSuche(a, x)
    links  ← 0
    rechts ← länge(a) − 1
    solange links ≤ rechts
        mitte ← (links + rechts) DIV 2
        wenn a[mitte] = x dann
            gib mitte zurück
        sonst wenn a[mitte] < x dann
            links ← mitte + 1
        sonst
            rechts ← mitte − 1
    gib −1 zurück          // nicht gefunden` },
      { titel: "Bubble Sort mit Abbruch (Pseudocode)", text:
`prozedur bubbleSort(a)
    n ← länge(a)
    für i von 0 bis n − 2
        getauscht ← falsch
        für j von 0 bis n − 2 − i
            wenn a[j] > a[j + 1] dann
                tausche a[j] und a[j + 1]
                getauscht ← wahr
        wenn getauscht = falsch dann
            beende            // schon sortiert` },
      { titel: "Selection Sort (Pseudocode)", text:
`für i von 0 bis n − 2
    min ← i
    für j von i + 1 bis n − 1
        wenn a[j] < a[min] dann
            min ← j
    tausche a[i] und a[min]` },
      { titel: "Insertion Sort (Pseudocode)", text:
`für i von 1 bis n − 1
    wert ← a[i]
    j ← i − 1
    solange j ≥ 0 und a[j] > wert
        a[j + 1] ← a[j]       // nach rechts schieben
        j ← j − 1
    a[j + 1] ← wert` }
    ],
    merke: "Binäre Suche nur auf sortierten Daten. Bubble: Größtes wandert nach hinten. Selection: Kleinstes nach vorn. Insertion: in den sortierten Teil einfügen.",
    trainer: "algo",
    karten: ["a01", "a02", "a03"],
    quiz: [
      { id: "al1", f: "Welche Voraussetzung braucht die binäre Suche?",
        o: ["Die Daten müssen sortiert sein.", "Die Daten müssen in einer verketteten Liste stehen.", "Es dürfen höchstens 1.000 Elemente sein.", "Die Werte müssen Zahlen sein."], r: [0],
        w: "Nur bei sortierten Daten weiß man nach dem Vergleich mit der Mitte, in welcher Hälfte der Wert liegen muss." },
      { id: "al2", f: "Ein sortiertes Feld hat 1.000 Elemente. Wie viele Vergleiche braucht die binäre Suche höchstens?",
        o: ["10", "100", "500", "1.000"], r: [0],
        w: "Jeder Vergleich halbiert den Bereich: 1000 → 500 → 250 → … → 1. Weil 2¹⁰ = 1.024 ≥ 1.000, reichen höchstens 10 Vergleiche." },
      { id: "al3", f: "Wie viele Vergleiche braucht die lineare Suche im schlechtesten Fall bei n Elementen?",
        o: ["n", "n / 2", "log₂ n", "1"], r: [0],
        w: "Steht der Wert ganz hinten oder gar nicht im Feld, wird jedes Element einmal geprüft." },
      { id: "al4", f: "Feld: [5, 1, 4, 2]. Wie sieht es nach dem ersten Durchlauf von Bubble Sort (aufsteigend) aus?",
        o: ["[1, 4, 2, 5]", "[1, 5, 4, 2]", "[1, 2, 4, 5]", "[5, 4, 2, 1]"], r: [0],
        w: "5 > 1 tauschen → [1, 5, 4, 2]; 5 > 4 tauschen → [1, 4, 5, 2]; 5 > 2 tauschen → [1, 4, 2, 5]. Die 5 ist nach hinten „geblubbert“." },
      { id: "al5", f: "Feld: [7, 3, 9, 1]. Wie sieht es nach dem ersten Durchlauf von Selection Sort (aufsteigend) aus?",
        o: ["[1, 3, 9, 7]", "[3, 7, 9, 1]", "[3, 7, 1, 9]", "[1, 7, 3, 9]"], r: [0],
        w: "Das Minimum 1 steht an Index 3. Es wird mit dem ersten Element (7) getauscht: [1, 3, 9, 7]." },
      { id: "al6", f: "Feld: [4, 2, 6, 1]. Wie sieht es nach den ersten zwei Durchläufen von Insertion Sort aus?",
        o: ["[2, 4, 6, 1]", "[1, 2, 4, 6]", "[2, 4, 1, 6]", "[4, 2, 1, 6]"], r: [0],
        w: "Durchlauf 1: die 2 wird vor die 4 eingefügt → [2, 4, 6, 1]. Durchlauf 2: die 6 ist größer als 4 und bleibt stehen → [2, 4, 6, 1]." },
      { id: "al7", f: "Welches Sortierverfahren ist bei einem fast sortierten Feld besonders schnell?",
        o: ["Insertion Sort", "Selection Sort", "Binäre Suche", "Lineare Suche"], r: [0],
        w: "Insertion Sort muss bei fast sortierten Daten kaum etwas verschieben. Selection Sort durchsucht immer den ganzen Rest." },
      { id: "al8", f: "Welche Sortierverfahren sind stabil? (alle richtigen ankreuzen)",
        o: ["Bubble Sort", "Insertion Sort", "Selection Sort", "Binäre Suche"], r: [0, 1],
        w: "Bubble und Insertion Sort tauschen nur, wenn ein Wert echt größer ist — gleiche Werte bleiben in ihrer Reihenfolge. Selection Sort kann gleiche Werte bei einem Tausch über eine weite Strecke in eine andere Reihenfolge bringen. Binäre Suche sortiert gar nicht." },
      { id: "al9", f: "Binäre Suche: links = 0, rechts = 9. Welcher Index wird zuerst geprüft?",
        o: ["4", "5", "4,5", "9"], r: [0],
        w: "mitte = (0 + 9) DIV 2 = 4 — ganzzahlige Division, also abrunden." },
      { id: "al10", f: "Selection Sort, Feld mit 6 Elementen. Wie viele Durchläufe der äußeren Schleife gibt es?",
        o: ["5", "6", "3", "36"], r: [0],
        w: "n − 1 = 5. Danach steht das letzte Element automatisch richtig." },
      { id: "al11", f: "Bubble Sort mit Abbruch: Wann hört der Algorithmus früher auf?",
        o: ["Wenn in einem Durchlauf kein Tausch stattfand.", "Wenn das erste Element das kleinste ist.", "Nach genau n/2 Durchläufen.", "Wenn zwei gleiche Werte gefunden werden."], r: [0],
        w: "Kein Tausch heißt: alle Nachbarn stehen richtig — das Feld ist sortiert." }
    ]
  });

  /* ===================================================== Entwurfsmuster */
  T.push({
    id: "muster", titel: "Entwurfsmuster (Design Patterns)", ru: "Шаблоны проектирования", teil: "GA1+GA2",
    katalog: "Katalog Entwicklung 12: Architektur- und Design-Pattern, z. B. Observer, Singleton, Factory, MVC",
    links: [["https://ap2.online/designpatterns/designpatterns", "Überblick"],
            ["https://ap2.online/designpatterns/singletonpattern", "Singleton"],
            ["https://ap2.online/designpatterns/observerpattern", "Observer"],
            ["https://ap2.online/designpatterns/factorypattern", "Factory"],
            ["https://ap2.online/designpatterns/mvcpattern", "MVC"],
            ["https://ap2.online/designpatterns/facadepattern", "Facade"]],
    kurzRu: "Шаблон проектирования — проверенное решение типовой задачи. В каталоге AP2: Singleton (ровно один объект), Observer (подписчики автоматически получают уведомления), Factory (объекты создаёт фабрика, вызывающий не знает конкретный класс), MVC (данные / отображение / управление раздельно). Facade — один простой «вход» в сложную систему.",
    punkte: [
      ["Entwurfsmuster", "шаблон проектирования", "Bewährte, wiederverwendbare Lösung für ein typisches Problem im Softwareentwurf. Gruppen: Erzeugungsmuster, Strukturmuster, Verhaltensmuster. MVC ist ein Architekturmuster."],
      ["Singleton", "одиночка", "Erzeugungsmuster. Von der Klasse gibt es genau ein Objekt. Der Konstruktor ist private, eine statische Methode getInstanz() gibt immer dasselbe Objekt zurück. Beispiel: Logger, Konfiguration, Datenbankverbindung."],
      ["Observer", "наблюдатель", "Verhaltensmuster. Ein Subjekt hat eine Liste von Beobachtern. Ändert sich sein Zustand, ruft es bei allen aktualisieren() auf. Beobachter können sich an- und abmelden. Beispiel: Kursanzeige, Newsletter, Klick-Ereignisse."],
      ["Factory", "фабрика", "Erzeugungsmuster. Eine Fabrikmethode erzeugt die Objekte, z. B. erzeuge(\"PDF\"). Der Aufrufer arbeitet nur mit der Oberklasse oder dem Interface und kennt die konkrete Klasse nicht. Neue Typen kommen nur in der Fabrik dazu. In der klassischen Form (GoF-Fabrikmethode) überschreibt eine Unterklasse die Methode erzeuge() und entscheidet so, welches Objekt entsteht."],
      ["MVC", "модель–представление–контроллер", "Architekturmuster. Model = Daten und Geschäftslogik, View = Anzeige, Controller = nimmt Eingaben an und steuert Model und View. Vorteil: Oberfläche austauschbar, Logik wiederverwendbar, Arbeit im Team teilbar."],
      ["Facade", "фасад", "Strukturmuster. Eine einfache Klasse bietet wenige Methoden an und ruft dahinter viele Klassen eines Teilsystems auf. Beispiel: bestellen() ruft Lager, Zahlung und Versand auf."],
      ["Vor- und Nachteile", "плюсы и минусы", "Vorteile: gemeinsame Sprache im Team, bewährte Lösung, besser wartbar und erweiterbar. Nachteil: mehr Klassen, bei kleinen Problemen unnötig kompliziert."],
      ["Singleton — Vorsicht", "недостатки Singleton", "Globaler Zustand: Code hängt versteckt vom Singleton ab und ist schwer zu testen. Bei mehreren Threads muss getInstanz() abgesichert sein."],
      ["im Klassendiagramm erkennen", "как узнать на диаграмме", "Singleton: Attribut instanz und getInstanz() unterstrichen (= static), Konstruktor mit −. Observer: Subjekt mit Liste von Beobachtern und Methoden anmelden/abmelden/benachrichtigen. Factory: Klasse mit Methode erzeuge(typ), die die Oberklasse zurückgibt."]
    ],
    code: [
      { titel: "Singleton (Java)", text:
`public class Logger {
    private static Logger instanz;          // das einzige Objekt
    private Logger() { }                     // von außen kein new möglich

    public static Logger getInstanz() {
        if (instanz == null) {
            instanz = new Logger();
        }
        return instanz;
    }
}` },
      { titel: "Observer (Java)", text:
`interface Beobachter { void aktualisieren(double kurs); }

class Aktie {                                    // Subjekt
    private List<Beobachter> beobachter = new ArrayList<>();
    private double kurs;

    void anmelden(Beobachter b) { beobachter.add(b); }
    void abmelden(Beobachter b) { beobachter.remove(b); }

    void setKurs(double k) {
        kurs = k;
        for (Beobachter b : beobachter) {
            b.aktualisieren(kurs);              // alle benachrichtigen
        }
    }
}` }
    ],
    merke: "Singleton = genau eins. Observer = alle benachrichtigen. Factory = Erzeugen auslagern. MVC = Daten, Anzeige, Steuerung trennen. Facade = ein einfacher Eingang.",
    karten: ["a04", "a05", "a06", "a07"],
    quiz: [
      { id: "mu1", f: "Welches Muster zeigt dieser Code?", code:
`class DbVerbindung {
    private static DbVerbindung v;
    private DbVerbindung() { /* verbinden */ }
    public static DbVerbindung hole() {
        if (v == null) v = new DbVerbindung();
        return v;
    }
}`, o: ["Singleton", "Factory", "Observer", "Facade"], r: [0],
        w: "Privater Konstruktor + statisches Attribut + statische Methode, die immer dasselbe Objekt liefert = Singleton." },
      { id: "mu2", f: "Welches Muster zeigt dieser Code?", code:
`class Wetterstation {
    private List<Anzeige> anzeigen = new ArrayList<>();
    void anmelden(Anzeige a) { anzeigen.add(a); }
    void neuerMesswert(double t) {
        for (Anzeige a : anzeigen) a.zeige(t);
    }
}`, o: ["Observer", "Singleton", "Factory", "MVC"], r: [0],
        w: "Eine Liste angemeldeter Objekte, die bei jeder Änderung benachrichtigt werden = Observer." },
      { id: "mu3", f: "Welches Muster zeigt dieser Code?", code:
`class DokumentFabrik {
    static Dokument erzeuge(String typ) {
        switch (typ) {
            case "PDF":  return new PdfDokument();
            case "Word": return new WordDokument();
            default: throw new IllegalArgumentException(typ);
        }
    }
}
Dokument d = DokumentFabrik.erzeuge("PDF");`, o: ["Factory", "Facade", "Singleton", "Observer"], r: [0],
        w: "Eine Methode entscheidet, welche konkrete Klasse erzeugt wird. Der Aufrufer kennt nur Dokument = Factory." },
      { id: "mu4", f: "Welches Muster zeigt dieser Code?", code:
`class Bestellservice {
    private Lager lager = new Lager();
    private Zahlung zahlung = new Zahlung();
    private Versand versand = new Versand();

    public void bestellen(Artikel a, Kunde k) {
        lager.reservieren(a);
        zahlung.abbuchen(k, a.getPreis());
        versand.beauftragen(a, k.getAdresse());
    }
}`, o: ["Facade", "Factory", "Observer", "Singleton"], r: [0],
        w: "Eine einfache Methode verbirgt das Zusammenspiel mehrerer Klassen = Facade (Fassade)." },
      { id: "mu5", f: "In einer App sollen Liste, Diagramm und Zähler sofort neu angezeigt werden, sobald ein neuer Messwert kommt. Welches Muster passt?",
        o: ["Observer", "Singleton", "Factory", "Facade"], r: [0],
        w: "Mehrere Anzeigen hängen von einem Datenobjekt ab und sollen automatisch benachrichtigt werden." },
      { id: "mu6", f: "Warum ist der Konstruktor beim Singleton private?",
        o: ["Damit kein anderer Code mit new ein zweites Objekt erzeugen kann.", "Damit die Klasse schneller geladen wird.", "Weil statische Klassen keinen Konstruktor haben dürfen.", "Damit Unterklassen ihn überschreiben."], r: [0],
        w: "Nur die Klasse selbst darf das eine Objekt erzeugen — in getInstanz()." },
      { id: "mu7", f: "Welche Aufgabe hat der Controller im MVC-Muster?",
        o: ["Er nimmt Eingaben des Nutzers an und ruft Model und View passend auf.", "Er speichert die Daten in der Datenbank.", "Er zeichnet die Oberfläche.", "Er verschlüsselt die Daten."], r: [0],
        w: "Model = Daten und Logik, View = Anzeige, Controller = Eingaben verarbeiten und steuern." },
      { id: "mu8", f: "Zu welcher Gruppe gehören Singleton und Factory?",
        o: ["Erzeugungsmuster", "Strukturmuster", "Verhaltensmuster", "Architekturmuster"], r: [0],
        w: "Beide regeln, wie Objekte erzeugt werden. Observer ist ein Verhaltensmuster, Facade ein Strukturmuster, MVC ein Architekturmuster." },
      { id: "mu9", f: "Welche Aussagen zu MVC stimmen? (alle richtigen ankreuzen)",
        o: ["Die View kann ausgetauscht werden, ohne das Model zu ändern.", "Model, View und Controller können parallel von verschiedenen Personen entwickelt werden.", "Das Model zeichnet die Oberfläche.", "MVC funktioniert nur mit Java."], r: [0, 1],
        w: "Die Trennung macht Teile austauschbar und erlaubt Arbeitsteilung. Gezeichnet wird in der View; MVC ist sprachunabhängig." },
      { id: "mu10", f: "Klassendiagramm: Konfiguration mit „− instanz : Konfiguration“ (unterstrichen), „− Konfiguration()“ und „+ getInstanz() : Konfiguration“ (unterstrichen). Welches Muster?",
        o: ["Singleton", "Observer", "Factory", "Facade"], r: [0],
        w: "Unterstrichen = static. Privater Konstruktor und statische getInstanz() sind das Kennzeichen des Singletons." },
      { id: "mu11", f: "Ein Nachteil des Singleton-Musters ist …",
        o: ["… globaler Zustand: Code hängt versteckt davon ab und ist schwer zu testen.", "… dass man beliebig viele Objekte erzeugen kann.", "… dass es nur zusammen mit MVC funktioniert.", "… dass die Klasse keine Methoden haben darf."], r: [0],
        w: "Weil jeder überall getInstanz() aufrufen kann, entstehen versteckte Abhängigkeiten. In Tests lässt sich das Objekt schwer austauschen." }
    ]
  });

  /* ================================================================ OOP */
  T.push({
    id: "oop", titel: "Objektorientierung", ru: "Объектно-ориентированное программирование", teil: "GA1+GA2",
    katalog: "Katalog Entwicklung 04 und 17: Kapselung, Vererbung, Polymorphie, Interfaces, Fehlerbehandlung",
    links: [["https://ap2.online/programmierung/objektorientiert", "OOP"],
            ["https://ap2.online/programmierung/klassen", "Klassen"],
            ["https://ap2.online/programmierung/konstruktor", "Konstruktoren"],
            ["https://ap2.online/programmierung/polymorphie", "Polymorphie & Vererbung"],
            ["https://ap2.online/programmierung/datenkapselung", "Datenkapselung"]],
    kurzRu: "Класс — чертёж, объект — экземпляр (new). Инкапсуляция: атрибуты private, доступ через методы. Наследование — «является» (extends). Полиморфизм — один вызов, разное поведение. Абстрактный класс и интерфейс нельзя создать через new. Композиция/агрегация — «имеет». Исключения: try/catch/finally.",
    punkte: [
      ["Klasse und Objekt", "класс и объект", "Die Klasse ist der Bauplan mit Attributen und Methoden. Ein Objekt ist ein konkretes Exemplar, erzeugt mit new."],
      ["Konstruktor", "конструктор", "Besondere Methode mit dem Namen der Klasse und ohne Rückgabetyp. Läuft bei new und setzt die Startwerte. Mehrere Konstruktoren mit verschiedenen Parametern sind möglich."],
      ["Kapselung", "инкапсуляция", "Attribute sind private. Zugriff nur über Methoden (Getter/Setter), die Werte prüfen können. So bleibt das Objekt immer gültig."],
      ["Sichtbarkeit im UML", "видимость в UML", "+ public, − private, # protected, ~ package. Statisch = unterstrichen. Abstrakt = kursiv oder {abstract}."],
      ["Vererbung", "наследование", "Die Unterklasse übernimmt Attribute und Methoden der Oberklasse und erweitert sie. „Ist ein“: Ein Pkw ist ein Fahrzeug. Java: extends. UML: durchgezogene Linie mit leerem Dreieck zur Oberklasse."],
      ["Polymorphie", "полиморфизм", "Derselbe Methodenaufruf macht je nach Objekt etwas anderes, z. B. flaeche() bei Kreis und Rechteck. Grundlage ist das Überschreiben."],
      ["Überschreiben und Überladen", "переопределение и перегрузка", "Überschreiben: Die Unterklasse ersetzt eine geerbte Methode mit gleicher Signatur (@Override). Überladen: gleicher Name, andere Parameter, in derselben Klasse."],
      ["abstrakte Klasse", "абстрактный класс", "Kann nicht mit new erzeugt werden. Darf fertige und abstrakte Methoden haben. Unterklassen müssen die abstrakten Methoden umsetzen."],
      ["Interface", "интерфейс", "Legt fest, welche Methoden eine Klasse anbieten muss. Eine Klasse kann mehrere Interfaces implementieren (implements). UML: «interface», gestrichelte Linie mit leerem Dreieck."],
      ["Assoziation, Aggregation, Komposition", "ассоциация, агрегация, композиция", "Assoziation (einfache Linie): Objekte kennen sich und arbeiten zusammen. Aggregation und Komposition bedeuten „hat ein“: Aggregation (leere Raute am Ganzen): Das Teil kann allein weiterleben. Komposition (gefüllte Raute am Ganzen): Das Teil wird mit dem Ganzen gelöscht."],
      ["static", "статический", "Gehört zur Klasse, nicht zum einzelnen Objekt. Alle Objekte teilen sich das Attribut, z. B. ein Zähler für erzeugte Objekte."],
      ["Exceptions", "исключения", "Laufzeitfehler als Objekt. try = gefährlicher Code, catch = Fehler behandeln, finally = läuft immer (z. B. Datei schließen). throw wirft eine Exception."]
    ],
    code: [
      { titel: "Vererbung und Polymorphie (Java)", text:
`abstract class Form {
    abstract double flaeche();
}

class Kreis extends Form {
    private double r;
    Kreis(double r) { this.r = r; }
    @Override double flaeche() { return Math.PI * r * r; }
}

class Rechteck extends Form {
    private double a, b;
    Rechteck(double a, double b) { this.a = a; this.b = b; }
    @Override double flaeche() { return a * b; }
}

// Polymorphie: derselbe Aufruf, verschiedenes Verhalten
double summe = 0;
for (Form f : formen) {
    summe += f.flaeche();
}` },
      { titel: "Kapselung und Exception (Java)", text:
`class Konto {
    private double saldo;                     // von außen nicht erreichbar

    public double getSaldo() { return saldo; }

    public void abheben(double betrag) {
        if (betrag <= 0 || betrag > saldo) {
            throw new IllegalArgumentException("Betrag ungültig");
        }
        saldo -= betrag;
    }
}

try {
    konto.abheben(500);
} catch (IllegalArgumentException e) {
    System.out.println("Fehler: " + e.getMessage());
} finally {
    System.out.println("Vorgang beendet");
}` }
    ],
    merke: "Kapselung = private + Getter/Setter. Vererbung = „ist ein“. Aggregation/Komposition = „hat ein“. Polymorphie = gleicher Aufruf, anderes Verhalten.",
    trainer: "pseudo",
    karten: ["a08", "a09", "a10", "a11"],
    quiz: [
      { id: "oo1", f: "Welches Zeichen steht im UML-Klassendiagramm für protected?",
        o: ["#", "+", "−", "~"], r: [0], w: "+ public, − private, # protected, ~ package." },
      { id: "oo2", f: "Was ist Überladen?",
        o: ["Mehrere Methoden mit gleichem Namen, aber unterschiedlichen Parametern.", "Eine Unterklasse ersetzt eine geerbte Methode.", "Ein Objekt hat zu viele Attribute.", "Eine Methode ruft sich selbst auf."], r: [0],
        w: "Überladen = gleicher Name, andere Parameterliste. Überschreiben = Unterklasse ersetzt geerbte Methode. Selbstaufruf heißt Rekursion." },
      { id: "oo3", f: "Welche Aussage über abstrakte Klassen stimmt?",
        o: ["Man kann kein Objekt direkt mit new erzeugen.", "Sie dürfen keine fertigen Methoden enthalten.", "Sie dürfen keine Unterklassen haben.", "Alle Attribute müssen public sein."], r: [0],
        w: "Abstrakte Klassen sind gerade dafür da, vererbt zu werden. Fertige Methoden sind erlaubt." },
      { id: "oo4", f: "Ein Auftrag besteht aus Auftragspositionen. Wird der Auftrag gelöscht, gibt es die Positionen auch nicht mehr. Welche Beziehung ist das?",
        o: ["Komposition", "Aggregation", "Vererbung", "Realisierung"], r: [0],
        w: "Das Teil lebt nicht ohne das Ganze → Komposition, gefüllte Raute am Auftrag." },
      { id: "oo5", f: "Was bewirkt Kapselung?",
        o: ["Attribute sind nur über Methoden erreichbar, die die Werte prüfen können.", "Die Klasse kann nicht vererbt werden.", "Der Code läuft schneller.", "Alle Objekte teilen sich dieselben Werte."], r: [0],
        w: "private Attribute + öffentliche Methoden: Das Objekt kontrolliert selbst, welche Werte erlaubt sind." },
      { id: "oo6", f: "Welcher Block läuft immer — egal, ob eine Exception auftritt?",
        o: ["finally", "catch", "try", "throw"], r: [0],
        w: "finally läuft immer, z. B. um Dateien oder Verbindungen zu schließen." },
      { id: "oo7", f: "Ein Konstruktor …",
        o: ["… heißt wie die Klasse und hat keinen Rückgabetyp.", "… muss immer static sein.", "… wird bei jedem Methodenaufruf ausgeführt.", "… darf keine Parameter haben."], r: [0],
        w: "Er läuft einmal bei new und kann Parameter für die Startwerte haben." },
      { id: "oo8", f: "Was zeigt eine durchgezogene Linie mit leerer Dreiecksspitze im Klassendiagramm?",
        o: ["Vererbung (Generalisierung)", "Komposition", "Abhängigkeit", "Implementierung eines Interfaces"], r: [0],
        w: "Durchgezogen + leeres Dreieck = Vererbung. Gestrichelt + leeres Dreieck = Interface wird implementiert." },
      { id: "oo9", f: "Welche Aussagen zu Interfaces stimmen? (alle richtigen ankreuzen)",
        o: ["Eine Klasse kann mehrere Interfaces implementieren.", "Ein Interface legt fest, welche Methoden eine Klasse anbieten muss.", "Ein Interface kann mit new erzeugt werden.", "Ein Interface speichert Objektattribute wie eine normale Klasse."], r: [0, 1],
        w: "Interfaces beschreiben Fähigkeiten. Man kann sie nicht instanziieren, und sie haben keine Objektattribute." },
      { id: "oo10", f: "Welches Beispiel zeigt Polymorphie?",
        o: ["form.flaeche() liefert bei einem Kreis- und einem Rechteck-Objekt verschiedene Ergebnisse.", "Eine Klasse hat zwei Attribute vom Typ int.", "Ein Attribut ist private.", "Eine Methode gibt void zurück."], r: [0],
        w: "Gleicher Aufruf über die Oberklasse Form, unterschiedliches Verhalten je nach Objekt." },
      { id: "oo11", f: "Ein Attribut anzahlKunden soll für alle Kunde-Objekte gemeinsam zählen. Welches Schlüsselwort ist entscheidend?",
        o: ["static", "private", "final", "abstract"], r: [0],
        w: "static: Das Attribut gehört der Klasse, alle Objekte teilen sich den einen Wert." }
    ]
  });

  /* ============================================================== Tests */
  T.push({
    id: "tests", titel: "Softwaretests", ru: "Тестирование ПО", teil: "GA1+GA2",
    katalog: "Katalog Datenschutz/Qualität 03: statische und dynamische Tests, Black-/White-Box, Schreibtischtest, Modul-, Integrations-, E2E-, Belastungstests, Testprozess",
    links: [["https://ap2.online/quality/testing", "Softwaretests"],
            ["https://ap2.online/quality/qualitaetsmanagement", "Qualitätsmanagement"]],
    kurzRu: "Статические тесты — программа не запускается (ревью, тест «за столом», анализатор кода). Динамические — программа работает с тестовыми данными: Black-Box (по спецификации: классы эквивалентности, граничные значения) и White-Box (по коду: покрытие операторов/ветвей). Уровни: модульный → интеграционный → системный → приёмочный. Регрессионный тест — после каждого изменения. Нагрузочный, стресс- и тест производительности. FIRST — признаки хорошего юнит-теста.",
    punkte: [
      ["statischer Test", "статическое тестирование", "Das Programm läuft nicht. Der Code wird gelesen und geprüft: Code-Review, Inspektion, statische Codeanalyse (Linter), Schreibtischtest mit Stift und Papier."],
      ["dynamischer Test", "динамическое тестирование", "Das Programm läuft mit Testdaten. Man vergleicht das tatsächliche mit dem erwarteten Ergebnis."],
      ["Black-Box-Test", "тест «чёрного ящика»", "Testfälle aus der Anforderung, ohne den Code zu kennen. Methoden: Äquivalenzklassen und Grenzwertanalyse."],
      ["White-Box-Test", "тест «белого ящика»", "Testfälle aus dem Code. Ziel: Anweisungsüberdeckung C0 (jede Anweisung einmal) oder Zweigüberdeckung C1 (jede Entscheidung einmal wahr und einmal falsch)."],
      ["Äquivalenzklassen und Grenzwerte", "классы эквивалентности, граничные значения", "Erlaubt: Alter 18 bis 65. Klassen: unter 18 (ungültig), 18–65 (gültig), über 65 (ungültig). Grenzwerte: 17, 18, 65, 66 — dort passieren die meisten Fehler."],
      ["Schreibtischtest", "тест «за столом»", "Den Code Zeile für Zeile im Kopf ausführen und alle Variablenwerte in einer Tabelle mitschreiben. Findet Logikfehler, z. B. falsche Schleifengrenzen."],
      ["Teststufen", "уровни тестирования", "Modultest/Unit-Test (eine Methode oder Klasse, meist automatisch, z. B. JUnit) → Integrationstest (Zusammenspiel, Schnittstellen) → Systemtest (ganzes System gegen die Anforderungen) → Abnahmetest (Kunde prüft gegen den Vertrag)."],
      ["End-to-End-Test", "сквозной тест (E2E)", "Ein ganzer Ablauf aus Sicht des Nutzers durch alle Schichten, z. B. „Artikel suchen → bestellen → Rechnung kommt“. Oft automatisch über die Oberfläche."],
      ["Regressionstest", "регрессионный тест", "Nach jeder Änderung die alten Tests wiederholen. Ziel: Nichts, was vorher lief, ist jetzt kaputt. Am besten automatisch."],
      ["Last-, Stress- und Performancetest", "нагрузочный, стресс-, тест производительности", "Lasttest = erwartete Last (z. B. 500 Nutzer gleichzeitig). Stresstest = über die Grenze, bis es bricht. Performancetest = Antwortzeiten messen. Oberbegriff: Belastungstest."],
      ["Staging-Umgebung", "предрелизная среда", "Kopie der echten Umgebung. Dort läuft der letzte Test vor dem Livegang — echte Konfiguration, aber keine echten Kunden."],
      ["FIRST-Prinzip", "принцип FIRST", "Gute Unit-Tests sind Fast (schnell), Independent (unabhängig voneinander), Repeatable (immer gleiches Ergebnis), Self-validating (melden selbst grün/rot), Timely (zeitnah zum Code geschrieben)."],
      ["Testprotokoll", "протокол тестирования", "Testfall-Nr., Beschreibung/Vorbedingung, Testdaten, erwartetes Ergebnis, tatsächliches Ergebnis, bestanden ja/nein, Datum, Tester."],
      ["testgetriebene Entwicklung (TDD)", "разработка через тестирование", "Erst den Test schreiben (rot), dann so viel Code, bis er grün ist, dann aufräumen (Refactoring)."]
    ],
    tabelle: { titel: "Teststufen",
      kopf: ["Stufe", "Was wird geprüft?", "Wer?", "Grundlage"],
      zeilen: [
        ["Modultest (Unit-Test)", "einzelne Methode oder Klasse", "Entwickler", "Modulentwurf"],
        ["Integrationstest", "Zusammenspiel der Module, Schnittstellen", "Entwickler / Testteam", "Architektur"],
        ["Systemtest", "ganzes System, funktional und nicht-funktional", "Testteam", "Pflichtenheft"],
        ["Abnahmetest", "erfüllt das System den Vertrag?", "Kunde", "Pflichtenheft / Vertrag"]
      ] },
    code: [
      { titel: "Unit-Test (JUnit)", text:
`class RabattTest {
    @Test
    void zehnProzentAb100Euro() {
        assertEquals(90.0, Rabatt.berechne(100.0), 0.001);   // Grenzwert
    }
    @Test
    void keinRabattUnter100Euro() {
        assertEquals(99.99, Rabatt.berechne(99.99), 0.001);  // knapp darunter
    }
}` }
    ],
    merke: "Black-Box = aus der Anforderung, White-Box = aus dem Code. Grenzwerte immer auf beiden Seiten testen. Nach jeder Änderung: Regressionstest.",
    trainer: "pseudo",
    karten: ["a12", "a13", "a14", "a15", "s129", "s130", "s131", "s133"],
    quiz: [
      { id: "te1", f: "Eine Eingabe ist gültig von 1 bis 100. Welche Testwerte liefert die Grenzwertanalyse?",
        o: ["0, 1, 100, 101", "1, 50, 100", "−1, 0, 1", "50, 100, 150"], r: [0],
        w: "An jeder Grenze den letzten gültigen und den ersten ungültigen Wert testen." },
      { id: "te2", f: "Welcher Test wird durchgeführt, ohne das Programm auszuführen?",
        o: ["Code-Review", "Lasttest", "Integrationstest", "End-to-End-Test"], r: [0],
        w: "Review, Inspektion und statische Analyse sind statische Tests — der Code wird nur gelesen." },
      { id: "te3", f: "Was ist ein Regressionstest?",
        o: ["Nach einer Änderung werden bestehende Tests wiederholt, um neue Fehler in alten Funktionen zu finden.", "Ein Test mit sehr vielen gleichzeitigen Nutzern.", "Ein Test, den der Kunde bei der Abnahme durchführt.", "Ein Test einzelner Methoden durch den Entwickler."], r: [0],
        w: "„Regression“ = Rückschritt: Etwas, das schon lief, ist durch eine Änderung kaputtgegangen." },
      { id: "te4", f: "Ein Online-Shop soll zeigen, dass er 2.000 gleichzeitige Nutzer mit Antwortzeiten unter 2 Sekunden schafft. Welcher Test passt?",
        o: ["Lasttest / Performancetest", "Unit-Test", "Schreibtischtest", "Code-Review"], r: [0],
        w: "Erwartete Last + Antwortzeit messen = Last- und Performancetest." },
      { id: "te5", f: "Welcher Test gehört im V-Modell zur Anforderungsdefinition?",
        o: ["Abnahmetest", "Modultest", "Integrationstest", "Code-Review"], r: [0],
        w: "Oben im V: Anforderungen ↔ Abnahmetest. Unten: Modulentwurf ↔ Modultest." },
      { id: "te6", f: "Was bedeutet Zweigüberdeckung (C1)?",
        o: ["Jede Entscheidung wurde mindestens einmal mit wahr und einmal mit falsch durchlaufen.", "Jede Anweisung wurde mindestens einmal ausgeführt.", "Jeder mögliche Pfad wurde durchlaufen.", "Jede Klasse hat mindestens einen Test."], r: [0],
        w: "C0 = jede Anweisung, C1 = jeder Zweig, Pfadüberdeckung = jeder Weg durch das Programm." },
      { id: "te7", f: "Welche Aussagen passen zum Black-Box-Test? (alle richtigen ankreuzen)",
        o: ["Die Testfälle entstehen aus der Spezifikation.", "Der Tester muss den Quellcode nicht kennen.", "Ziel ist die Anweisungsüberdeckung.", "Er findet nur Tippfehler im Code."], r: [0, 1],
        w: "Anweisungsüberdeckung ist ein White-Box-Ziel." },
      { id: "te8", f: "Wofür steht das „I“ im FIRST-Prinzip für Unit-Tests?",
        o: ["Independent — Tests hängen nicht voneinander ab.", "Integration — Tests prüfen das Zusammenspiel.", "Interface — Tests prüfen nur Schnittstellen.", "Input — Tests brauchen viele Eingaben."], r: [0],
        w: "Jeder Test muss allein und in beliebiger Reihenfolge laufen können." },
      { id: "te9", f: "Wozu dient eine Staging-Umgebung?",
        o: ["Letzter Test in einer Umgebung, die wie der Livebetrieb aufgebaut ist.", "Dort schreiben die Entwickler ihren Code.", "Dort laufen nur Unit-Tests.", "Sie ersetzt das Backup."], r: [0],
        w: "Staging = Generalprobe vor dem Livegang." },
      { id: "te10", f: "Was gehört NICHT in ein Testprotokoll?",
        o: ["Der komplette Quellcode der getesteten Methode", "Das erwartete Ergebnis", "Das tatsächliche Ergebnis", "Die Testdaten / Eingaben"], r: [0],
        w: "Das Protokoll hält Testfall, Daten, Soll, Ist und Ergebnis fest — nicht den Code." },
      { id: "te11", f: "In welcher Reihenfolge arbeitet man bei TDD?",
        o: ["Test schreiben (rot) → Code bis grün → Refactoring", "Code schreiben → testen → dokumentieren", "Refactoring → Test → Code", "Abnahme → Systemtest → Unit-Test"], r: [0],
        w: "Red – Green – Refactor." },
      { id: "te12", f: "Ein Test prüft den kompletten Ablauf „Login → Warenkorb → Bezahlen → Bestätigungsmail“. Wie heißt er?",
        o: ["End-to-End-Test", "Modultest", "Schreibtischtest", "Stresstest"], r: [0],
        w: "Ganzer Ablauf aus Nutzersicht, durch alle Schichten = End-to-End." }
    ]
  });

  /* ================================================ Versionsverwaltung */
  T.push({
    id: "git", titel: "Versionsverwaltung mit Git", ru: "Контроль версий (Git)", teil: "GA2",
    katalog: "Katalog Datenschutz/Qualität 04: Branches, Pull, Push, Merge",
    links: [],
    kurzRu: "Git хранит всю историю изменений. Commit — сохранённый снимок с сообщением. Branch — отдельная ветка разработки. Merge — слияние веток (конфликт, если обе изменили одну строку — решает человек). Push — отправить коммиты на сервер, Pull — забрать и слить. Pull Request — запрос на слияние с код-ревью.",
    punkte: [
      ["Versionsverwaltung", "система контроля версий", "Speichert jede Änderung mit Autor, Zeit und Nachricht. Man kann alte Stände zurückholen und im Team gleichzeitig arbeiten. Beispiel: Git."],
      ["Repository", "репозиторий", "Projektordner mit der ganzen Geschichte. Lokal auf dem eigenen Rechner und entfernt (remote), z. B. auf GitHub oder GitLab."],
      ["Commit", "коммит", "Gespeicherter Stand mit kurzer Nachricht, was geändert wurde. Vorher wählt man mit add die Dateien aus."],
      ["Branch", "ветка", "Eigener Entwicklungszweig, z. B. für ein neues Feature. Der Hauptzweig (main) bleibt stabil."],
      ["Merge und Merge-Konflikt", "слияние и конфликт", "Zwei Branches zusammenführen. Haben beide dieselbe Zeile geändert, entsteht ein Merge-Konflikt. Den löst ein Mensch von Hand."],
      ["Push, Pull, Clone", "отправить, получить, клонировать", "push = eigene Commits ins entfernte Repository hochladen. pull = neue Commits holen und einbauen (fetch + merge). clone = Repository zum ersten Mal kopieren."],
      ["Pull Request", "запрос на слияние", "Bitte, einen Branch in main zu übernehmen. Kollegen prüfen vorher den Code (Code-Review), automatische Tests laufen mit."],
      ["zentral oder verteilt", "централизованная и распределённая", "Zentral (z. B. SVN): ein Repository auf dem Server. Verteilt (Git): jeder hat eine vollständige Kopie — Arbeiten geht auch offline."],
      [".gitignore", "игнорируемые файлы", "Liste von Dateien, die nicht versioniert werden: Passwörter, Build-Ordner, Logdateien."]
    ],
    code: [
      { titel: "Typischer Ablauf", text:
`git clone https://server/projekt.git     # einmal: Kopie holen
git switch -c feature/login             # neuen Branch anlegen
# ... Code ändern ...
git add LoginService.java               # Änderung vormerken
git commit -m "Login mit Passwortprüfung"
git push origin feature/login           # hochladen → Pull Request
git switch main
git pull                                # neuesten Stand holen
git merge feature/login                 # Branch zusammenführen` }
    ],
    merke: "Commit = speichern. Push = hoch. Pull = runter. Branch = eigener Zweig. Merge = zusammenführen.",
    karten: ["a16", "a17", "a18", "s132"],
    quiz: [
      { id: "gi1", f: "Was macht git pull?",
        o: ["Holt neue Commits aus dem entfernten Repository und führt sie mit dem lokalen Stand zusammen.", "Lädt die eigenen Commits auf den Server.", "Legt einen neuen Branch an.", "Löscht den lokalen Branch."], r: [0],
        w: "pull = fetch + merge. Hochladen ist push." },
      { id: "gi2", f: "Wann entsteht ein Merge-Konflikt?",
        o: ["Wenn zwei Branches dieselbe Stelle einer Datei unterschiedlich geändert haben.", "Wenn ein Branch gelöscht wird.", "Wenn man ohne Internet committet.", "Wenn zwei Entwickler denselben Branch-Namen wählen."], r: [0],
        w: "Git kann nicht entscheiden, welche Änderung gilt — ein Mensch muss es tun." },
      { id: "gi3", f: "Warum entwickelt man ein neues Feature in einem eigenen Branch?",
        o: ["Der Hauptzweig bleibt stabil, bis das Feature fertig und geprüft ist.", "Weil Git sonst keine Commits speichert.", "Damit der Code schneller kompiliert.", "Weil nur ein Entwickler pro Repository erlaubt ist."], r: [0],
        w: "Halbfertiger Code stört so niemanden." },
      { id: "gi4", f: "Welche Vorteile hat eine Versionsverwaltung? (alle richtigen ankreuzen)",
        o: ["Alte Stände lassen sich wiederherstellen.", "Mehrere Entwickler können gleichzeitig am selben Projekt arbeiten.", "Sie ersetzt alle Tests.", "Sie verschlüsselt automatisch den Code."], r: [0, 1],
        w: "Geschichte + Teamarbeit. Tests und Verschlüsselung macht sie nicht." },
      { id: "gi5", f: "Was gehört in die .gitignore?",
        o: ["Zugangsdaten und erzeugte Build-Dateien", "Der Quellcode der Klassen", "Die Testklassen", "Die README-Datei"], r: [0],
        w: "Geheimnisse und alles, was sich automatisch neu erzeugen lässt, gehört nicht ins Repository." },
      { id: "gi6", f: "Was ist ein Pull Request?",
        o: ["Eine Anfrage, Änderungen aus einem Branch in den Hauptzweig zu übernehmen — meist mit Code-Review.", "Der Befehl, um ein Repository herunterzuladen.", "Ein Fehlerbericht des Kunden.", "Ein automatischer Backup-Job."], r: [0],
        w: "Bei GitLab heißt es Merge Request." },
      { id: "gi7", f: "Welcher Vorteil gilt für eine verteilte Versionsverwaltung wie Git?",
        o: ["Jeder hat die ganze Geschichte lokal und kann auch offline committen.", "Es gibt nur eine Kopie auf dem Server.", "Branches sind nicht möglich.", "Commits brauchen immer eine Freigabe des Admins."], r: [0],
        w: "Verteilt = vollständige Kopie auf jedem Rechner." }
    ]
  });

  /* ===================================================== Schnittstellen */
  T.push({
    id: "rest", titel: "Schnittstellen: REST, SOAP, HTTP", ru: "Интерфейсы: REST, SOAP, HTTP", teil: "GA1+GA2",
    katalog: "Katalog Entwicklung 21: Services und Ressourcen eines Servers — REST, SOAP",
    links: [["https://ap2.online/architektur/rest", "REST"], ["https://ap2.online/architektur/soap", "SOAP"],
            ["https://ap2.online/architektur/architektur", "Architektur"]],
    kurzRu: "REST — архитектурный стиль: у каждого ресурса есть адрес (URI), доступ методами HTTP (GET читать, POST создать, PUT заменить, PATCH частично изменить, DELETE удалить), без хранения состояния на сервере, обычно JSON. SOAP — протокол: XML-сообщения (Envelope/Header/Body), описание в WSDL, строже и тяжелее. Коды ответа: 2xx успех, 4xx ошибка клиента, 5xx ошибка сервера. Идемпотентно — повтор оставляет сервер в том же состоянии, что и один вызов (GET, PUT, DELETE; POST — нет).",
    punkte: [
      ["API / Schnittstelle", "программный интерфейс", "Festgelegter Weg, wie Programme Daten austauschen. Webservices bieten ihre Funktionen über HTTP an."],
      ["REST", "архитектурный стиль REST", "Representational State Transfer: Architekturstil. Jede Ressource hat eine Adresse (URI), z. B. /kunden/42. Zugriff mit HTTP-Methoden. Daten meist als JSON."],
      ["REST-Prinzipien", "принципы REST", "Client-Server, zustandslos (jede Anfrage bringt alles mit, der Server merkt sich keine Sitzung), cachefähig, einheitliche Schnittstelle, Schichten."],
      ["HTTP-Methoden", "методы HTTP", "GET = lesen, POST = neu anlegen, PUT = ganz ersetzen, PATCH = teilweise ändern, DELETE = löschen. Das passt zu CRUD (Create, Read, Update, Delete)."],
      ["idempotent", "идемпотентный", "Mehrmals ausführen ergibt denselben Zustand wie einmal. GET, PUT, DELETE: ja. POST: nein — zweimal senden kann zwei Bestellungen anlegen."],
      ["Statuscodes", "коды состояния", "200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized (nicht angemeldet), 403 Forbidden (keine Berechtigung), 404 Not Found, 500 Internal Server Error, 503 Service Unavailable."],
      ["SOAP", "протокол SOAP", "Protokoll mit XML-Nachrichten: Envelope (Umschlag), Header, Body. Der Dienst wird in einer WSDL-Datei beschrieben. Streng und standardisiert (z. B. WS-Security), aber mehr Aufwand und größere Nachrichten."],
      ["REST oder SOAP?", "что выбрать", "REST: leicht, schnell, ideal für Web- und Mobil-Apps. SOAP: feste Verträge, oft bei Banken, Behörden und älteren Unternehmenssystemen."],
      ["Absicherung", "защита API", "Immer HTTPS. Anmeldung mit API-Schlüssel oder Token (z. B. OAuth 2.0 Access Token) im Header. Eingaben auf dem Server prüfen."]
    ],
    tabelle: { titel: "REST und SOAP im Vergleich",
      kopf: ["Merkmal", "REST", "SOAP"],
      zeilen: [
        ["Art", "Architekturstil", "Protokoll"],
        ["Datenformat", "meist JSON (auch XML)", "nur XML"],
        ["Beschreibung", "z. B. OpenAPI", "WSDL"],
        ["Transport", "HTTP", "meist HTTP, auch andere"],
        ["Aufwand", "gering, kleine Nachrichten", "höher (Envelope, Schema)"]
      ] },
    code: [
      { titel: "REST-Anfragen und Antworten", text:
`GET    /api/kunden/42    → 200 OK   {"id": 42, "name": "Müller"}
POST   /api/kunden       → 201 Created      (Body: neuer Kunde als JSON)
PUT    /api/kunden/42    → 200 OK           (ganzer Kunde ersetzt)
PATCH  /api/kunden/42    → 200 OK           (nur {"email": "neu@firma.de"})
DELETE /api/kunden/42    → 204 No Content
GET    /api/kunden/999   → 404 Not Found` },
      { titel: "SOAP-Nachricht", text:
`<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header/>
  <soap:Body>
    <getKunde>
      <id>42</id>
    </getKunde>
  </soap:Body>
</soap:Envelope>` }
    ],
    merke: "GET liest, POST legt an, PUT ersetzt, PATCH ändert teilweise, DELETE löscht. 4xx = Fehler beim Client, 5xx = Fehler beim Server.",
    karten: ["a19", "a20", "a21", "a22"],
    quiz: [
      { id: "re1", f: "Welche HTTP-Methode legt in einer REST-API üblicherweise einen neuen Datensatz an?",
        o: ["POST", "GET", "PATCH", "DELETE"], r: [0], w: "POST = anlegen (Create). Antwort meist 201 Created." },
      { id: "re2", f: "Welcher Statuscode bedeutet: Die Ressource gibt es nicht?",
        o: ["404", "200", "201", "500"], r: [0], w: "404 Not Found — Fehler auf der Seite des Clients (falsche Adresse)." },
      { id: "re3", f: "Welche Methode ist NICHT idempotent?",
        o: ["POST", "GET", "PUT", "DELETE"], r: [0], w: "Zweimal POST kann zwei Datensätze anlegen. PUT und DELETE führen auch beim Wiederholen zum selben Zustand." },
      { id: "re4", f: "Was bedeutet „zustandslos“ bei REST?",
        o: ["Jede Anfrage enthält alle nötigen Informationen; der Server speichert keine Sitzung des Clients.", "Der Server speichert keine Daten in der Datenbank.", "Die API hat keine Statuscodes.", "Die Antwort ist immer leer."], r: [0],
        w: "Daten in der Datenbank sind erlaubt — nur der Sitzungszustand des Clients liegt nicht auf dem Server." },
      { id: "re5", f: "In welchem Format sind SOAP-Nachrichten aufgebaut?",
        o: ["XML mit Envelope, Header und Body", "JSON", "CSV", "YAML"], r: [0], w: "SOAP schreibt XML vor." },
      { id: "re6", f: "Womit wird ein SOAP-Webservice formal beschrieben?",
        o: ["WSDL", "DTD", "SQL", "HTML"], r: [0], w: "WSDL = Web Services Description Language: Operationen, Parameter, Adresse." },
      { id: "re7", f: "Ein Client erhält den Statuscode 401. Was ist los?",
        o: ["Er ist nicht (richtig) angemeldet — die Authentifizierung fehlt.", "Der Server ist abgestürzt.", "Die Ressource wurde angelegt.", "Alles in Ordnung."], r: [0],
        w: "401 Unauthorized = nicht authentifiziert. 403 Forbidden = angemeldet, aber keine Berechtigung." },
      { id: "re8", f: "Welche Aussagen passen zu REST? (alle richtigen ankreuzen)",
        o: ["Ressourcen werden über URIs angesprochen.", "Daten werden meist als JSON übertragen.", "Jede Nachricht braucht einen SOAP-Envelope.", "REST funktioniert nur mit XML."], r: [0, 1],
        w: "Envelope gehört zu SOAP. REST kann XML nutzen, muss aber nicht." },
      { id: "re9", f: "Mit welcher Methode ändert man nur die E-Mail-Adresse eines Kunden, ohne den ganzen Datensatz zu schicken?",
        o: ["PATCH", "PUT", "GET", "POST"], r: [0], w: "PATCH = teilweise ändern. PUT ersetzt den ganzen Datensatz." },
      { id: "re10", f: "Was bedeutet 403 Forbidden?",
        o: ["Angemeldet, aber keine Berechtigung für diese Ressource.", "Die Seite wurde verschoben.", "Der Server ist überlastet.", "Die Anfrage war erfolgreich."], r: [0],
        w: "Authentifizierung hat geklappt, Autorisierung nicht." }
    ]
  });

  /* ======================================================= Datenformate */
  T.push({
    id: "formate", titel: "Datenaustausch: CSV, XML, JSON", ru: "Форматы обмена данными", teil: "GA1+GA2",
    katalog: "Katalog Entwicklung 20: Dateiformate zum Datenaustausch — CSV, XML, JSON",
    links: [["https://ap2.online/entwicklung/dateiformate", "Dateiformate"]],
    kurzRu: "CSV — таблица в тексте (строка = запись, значения через разделитель), без типов и вложенности. XML — теги, один корневой элемент; «wohlgeformt» — синтаксис верен, «gültig» — ещё и соответствует схеме (DTD или XSD). JSON — объекты {} и массивы [], ключи в двойных кавычках; компактнее XML, стандарт для REST.",
    punkte: [
      ["Datenaustauschformat", "формат обмена данными", "Textformat, das verschiedene Programme lesen können — unabhängig von Betriebssystem und Programmiersprache. Zeichensatz am besten UTF-8."],
      ["CSV", "значения через разделитель", "Comma-Separated Values: eine Zeile = ein Datensatz, Werte durch Komma oder Semikolon getrennt, oft mit Kopfzeile. Klein und einfach, gut für Excel. Aber: keine Datentypen, keine Verschachtelung."],
      ["CSV-Falle", "ловушка CSV", "Steht das Trennzeichen im Wert („Meier; Söhne“), muss der Wert in Anführungszeichen stehen."],
      ["XML", "расширяемый язык разметки", "Extensible Markup Language: Daten in Tags, z. B. <kunde nr=\"42\"><name>Müller</name></kunde>. Selbstbeschreibend, verschachtelt, mit Attributen. Recht groß."],
      ["wohlgeformt", "правильно сформированный", "Genau ein Wurzelelement, jedes Start-Tag hat ein End-Tag, richtig verschachtelt, Groß-/Kleinschreibung stimmt, Attributwerte in Anführungszeichen."],
      ["gültig (valide)", "валидный", "Wohlgeformt UND passend zu einem Schema: DTD (Document Type Definition) oder XSD (XML Schema, mit Datentypen)."],
      ["JSON", "текстовый формат объектов", "JavaScript Object Notation: Objekte in { }, Listen in [ ], Schlüssel und Texte in doppelten Anführungszeichen. Werte: Text, Zahl, true/false, null, Objekt, Liste. Keine Kommentare, kein Komma am Ende."],
      ["Wann was?", "что когда", "CSV: flache Tabellen (Import/Export, Excel). XML: strenge Struktur mit Prüfung gegen ein Schema, SOAP, Behörden. JSON: Web, REST-APIs, mobile Apps, Konfiguration."]
    ],
    tabelle: { titel: "Vergleich",
      kopf: ["Merkmal", "CSV", "XML", "JSON"],
      zeilen: [
        ["Struktur", "flache Tabelle", "Baum (verschachtelt)", "Baum (verschachtelt)"],
        ["Datentypen", "keine", "über Schema (XSD)", "Zahl, Text, true/false, null"],
        ["Prüfung", "–", "DTD / XSD", "JSON Schema (optional)"],
        ["Größe", "sehr klein", "groß", "klein"],
        ["typisch", "Excel, Import/Export", "SOAP, Behörden, Konfiguration", "REST-APIs, Web"]
      ] },
    code: [
      { titel: "Dieselben Daten in drei Formaten", text:
`CSV:
KundenNr;Name;Ort
42;Müller;Köln
43;Schneider;München

XML:
<?xml version="1.0" encoding="UTF-8"?>
<kunden>
  <kunde nr="42">
    <name>Müller</name>
    <ort>Köln</ort>
  </kunde>
  <kunde nr="43">
    <name>Schneider</name>
    <ort>München</ort>
  </kunde>
</kunden>

JSON:
{
  "kunden": [
    { "nr": 42, "name": "Müller", "ort": "Köln" },
    { "nr": 43, "name": "Schneider", "ort": "München" }
  ]
}` }
    ],
    merke: "Wohlgeformt = Syntax stimmt. Gültig = Syntax stimmt UND passt zum Schema (DTD/XSD).",
    karten: ["a23", "a24", "s111"],
    quiz: [
      { id: "fo1", f: "Wann ist ein XML-Dokument gültig (valide)?",
        o: ["Wenn es wohlgeformt ist und zu seiner DTD bzw. seinem XSD passt.", "Wenn es kleiner als 1 MB ist.", "Wenn es eine Kopfzeile hat.", "Wenn alle Werte Zahlen sind."], r: [0],
        w: "Gültig setzt wohlgeformt voraus und verlangt zusätzlich ein passendes Schema." },
      { id: "fo2", f: "Was ist an diesem XML falsch?", code: "<kunde><name>Müller</kunde></name>",
        o: ["Die Tags sind falsch verschachtelt — es ist nicht wohlgeformt.", "Es fehlen Kommas.", "Namen dürfen keine Umlaute enthalten.", "Nichts — es ist korrekt."], r: [0],
        w: "Was zuletzt geöffnet wurde, muss zuerst geschlossen werden: </name> vor </kunde>." },
      { id: "fo3", f: "Welche Fehler hat dieses JSON? (alle richtigen ankreuzen)", code: "{ 'name': 'Müller', \"alter\": 42, }",
        o: ["Schlüssel und Texte müssen in doppelten Anführungszeichen stehen.", "Nach dem letzten Wert darf kein Komma stehen.", "Zahlen müssen in Anführungszeichen stehen.", "JSON braucht ein Wurzel-Tag."], r: [0, 1],
        w: "JSON erlaubt nur \"doppelte\" Anführungszeichen und kein Komma am Ende. Zahlen stehen ohne Anführungszeichen." },
      { id: "fo4", f: "Welches Format eignet sich am besten für den Excel-Export einer einfachen Artikelliste?",
        o: ["CSV", "XML mit XSD", "JSON", "WSDL"], r: [0], w: "Flache Tabelle → CSV, Excel öffnet sie direkt." },
      { id: "fo5", f: "Welches Format ist Standard bei modernen REST-APIs?",
        o: ["JSON", "CSV", "DTD", "XLSX"], r: [0], w: "JSON ist kompakt und in JavaScript und fast allen Sprachen leicht zu verarbeiten." },
      { id: "fo6", f: "Welche Aussage über CSV stimmt?",
        o: ["Es kennt keine Datentypen und keine Verschachtelung.", "Es braucht immer ein Schema.", "Es kann Bilder einbetten.", "Es ist ein Binärformat."], r: [0], w: "CSV ist reiner Text in Zeilen und Spalten." },
      { id: "fo7", f: "Wozu dient eine XSD-Datei?",
        o: ["Sie beschreibt den erlaubten Aufbau eines XML-Dokuments inklusive Datentypen.", "Sie verschlüsselt XML-Daten.", "Sie wandelt XML in JSON um.", "Sie speichert Tabellen für Excel."], r: [0],
        w: "XSD = XML Schema Definition, genauer als die DTD." },
      { id: "fo8", f: "Das Feld Firma enthält „Meier; Söhne GmbH“, Trennzeichen ist das Semikolon. Was muss in der CSV-Datei passieren?",
        o: ["Der Wert wird in Anführungszeichen gesetzt.", "Das Semikolon wird gelöscht.", "Die Zeile wird weggelassen.", "Man muss zu XML wechseln."], r: [0],
        w: "\"Meier; Söhne GmbH\" — so bleibt das Semikolon Teil des Werts." }
    ]
  });

  /* ======================================================= Kryptographie */
  T.push({
    id: "krypto", titel: "Verschlüsselung, Hash, Signatur, Zertifikat", ru: "Шифрование, хеш, подпись, сертификат", teil: "GA1+GA2",
    katalog: "Katalog Datenschutz 01: Integrität und Authentizität, digitale Signatur, Verschlüsselungsverfahren; GA1: Hashwerte, Zertifikate",
    links: [["https://ap2.online/security/kryptographie", "Kryptographie"], ["https://ap2.online/security/sicherheit", "IT-Sicherheit"]],
    kurzRu: "Симметричное шифрование — один общий ключ (быстро; проблема — передать ключ; AES). Асимметричное — пара ключей (медленнее; RSA): шифруют открытым ключом получателя, расшифровывает только его закрытый ключ. Гибридное (TLS): асимметрично передают сеансовый ключ, данные — симметрично. Хеш — односторонний «отпечаток»; пароли хранят как хеш + соль. Подпись: хеш документа шифруется закрытым ключом отправителя, проверяется его открытым. Сертификат X.509 связывает открытый ключ с владельцем, подписан удостоверяющим центром (CA).",
    punkte: [
      ["Schutzziele", "цели защиты", "Vertraulichkeit (nur Berechtigte lesen), Integrität (nicht verändert), Authentizität (echter Absender), Verbindlichkeit/Nichtabstreitbarkeit (Absender kann es nicht leugnen), Verfügbarkeit."],
      ["symmetrische Verschlüsselung", "симметричное шифрование", "Ein gemeinsamer Schlüssel zum Ver- und Entschlüsseln. Schnell, gut für große Datenmengen. Problem: Der Schlüssel muss sicher zum Partner kommen. Beispiel: AES."],
      ["asymmetrische Verschlüsselung", "асимметричное шифрование", "Schlüsselpaar: öffentlicher Schlüssel (darf jeder haben) und privater Schlüssel (bleibt geheim). Man verschlüsselt mit dem öffentlichen Schlüssel des Empfängers, nur sein privater Schlüssel entschlüsselt. Langsamer. Beispiel: RSA, ECC."],
      ["hybride Verschlüsselung", "гибридное шифрование", "Asymmetrisch wird nur ein zufälliger Sitzungsschlüssel ausgetauscht, die Daten werden damit symmetrisch verschlüsselt. Sicher und schnell. Beispiel: TLS/HTTPS."],
      ["Hashfunktion", "хеш-функция", "Macht aus beliebigen Daten einen Wert fester Länge. Einweg: nicht umkehrbar. Kleinste Änderung → ganz anderer Hash. Prüft die Integrität. Sicher: SHA-256; veraltet: MD5, SHA-1."],
      ["Passwörter speichern", "хранение паролей", "Nie im Klartext, sondern als Hash mit Salt (zufälliger Zusatz pro Nutzer), am besten mit einem langsamen Verfahren wie bcrypt oder Argon2. Gleiche Passwörter ergeben so verschiedene Hashes."],
      ["digitale Signatur", "цифровая подпись", "Absender bildet den Hash des Dokuments und verschlüsselt ihn mit seinem privaten Schlüssel. Empfänger entschlüsselt mit dem öffentlichen Schlüssel des Absenders und vergleicht mit dem selbst gebildeten Hash. Gleich → unverändert und echt."],
      ["Zertifikat (X.509)", "сертификат", "Bestätigt, dass ein öffentlicher Schlüssel zu einer Person oder einem Server gehört. Inhalt: Inhaber, öffentlicher Schlüssel, Aussteller (CA), Gültigkeitszeitraum, Seriennummer, Signatur der CA."],
      ["PKI", "инфраструктура открытых ключей", "Die Zertifizierungsstelle (CA) stellt Zertifikate aus und signiert sie. Die Registrierungsstelle (RA) prüft die Identität. Ein Verzeichnisdienst veröffentlicht die Zertifikate. Die Sperrliste (CRL) oder OCSP zeigen gesperrte Zertifikate."],
      ["HMAC", "код аутентификации сообщения", "Hash, gebildet mit einem geheimen Schlüssel. Beweist Integrität und dass die Nachricht von jemandem mit dem Schlüssel stammt. Keine Nichtabstreitbarkeit, weil beide Seiten den Schlüssel kennen."],
      ["TLS / HTTPS", "защищённое соединение", "Server zeigt sein Zertifikat, der Browser prüft es, dann wird ein Sitzungsschlüssel ausgehandelt, danach symmetrisch verschlüsselt. HTTPS nutzt Port 443."]
    ],
    tabelle: { titel: "Welcher Schlüssel wofür?",
      kopf: ["Ziel", "Verfahren", "Schlüssel"],
      zeilen: [
        ["Vertraulich an Ben senden", "asymmetrisch verschlüsseln", "öffentlicher Schlüssel von Ben"],
        ["Ben liest die Nachricht", "entschlüsseln", "privater Schlüssel von Ben"],
        ["Anna signiert", "Hash mit privatem Schlüssel verschlüsseln", "privater Schlüssel von Anna"],
        ["Ben prüft Annas Signatur", "Hash entschlüsseln und vergleichen", "öffentlicher Schlüssel von Anna"],
        ["Große Daten schnell verschlüsseln", "symmetrisch (AES)", "gemeinsamer Sitzungsschlüssel"]
      ] },
    merke: "Verschlüsseln an jemanden: SEIN öffentlicher Schlüssel. Signieren: MEIN privater Schlüssel. Passwörter: Hash + Salt.",
    karten: ["a25", "a26", "a27", "a28", "s05", "s54", "s61", "s63"],
    quiz: [
      { id: "kr1", f: "Anna will Ben eine vertrauliche Datei asymmetrisch verschlüsselt schicken. Welchen Schlüssel nutzt sie?",
        o: ["Bens öffentlichen Schlüssel", "Bens privaten Schlüssel", "Annas privaten Schlüssel", "Annas öffentlichen Schlüssel"], r: [0],
        w: "Nur Ben soll lesen können — also verschlüsselt Anna mit Bens öffentlichem Schlüssel; nur Bens privater Schlüssel öffnet es." },
      { id: "kr2", f: "Womit erstellt Anna eine digitale Signatur?",
        o: ["Mit ihrem privaten Schlüssel", "Mit Bens öffentlichem Schlüssel", "Mit ihrem öffentlichen Schlüssel", "Mit einem Salt"], r: [0],
        w: "Nur Anna hat ihren privaten Schlüssel — deshalb beweist die Signatur, dass sie von ihr stammt." },
      { id: "kr3", f: "Warum nutzt TLS hybride Verschlüsselung?",
        o: ["Asymmetrisch wird der Schlüssel sicher ausgetauscht, symmetrisch werden die Daten schnell verschlüsselt.", "Weil symmetrische Verschlüsselung unsicher ist.", "Damit keine Zertifikate nötig sind.", "Weil Hashwerte zu lang sind."], r: [0],
        w: "Das Beste aus beiden Welten: sicherer Schlüsselaustausch + Geschwindigkeit." },
      { id: "kr4", f: "Welche Eigenschaft hat eine kryptografische Hashfunktion?",
        o: ["Aus dem Hashwert kann man die Daten nicht zurückrechnen.", "Der Hash ist immer länger als die Daten.", "Gleiche Daten ergeben jedes Mal einen anderen Hash.", "Man braucht einen privaten Schlüssel."], r: [0],
        w: "Einwegfunktion, feste Länge, gleiche Daten → gleicher Hash." },
      { id: "kr5", f: "Wozu dient ein Salt beim Speichern von Passwörtern?",
        o: ["Gleiche Passwörter ergeben verschiedene Hashwerte; vorberechnete Tabellen (Rainbow Tables) nützen nichts.", "Das Passwort wird damit wieder entschlüsselbar.", "Das Passwort wird kürzer.", "Der Nutzer muss sich nicht mehr anmelden."], r: [0],
        w: "Das Salt ist ein zufälliger Zusatz pro Nutzer und wird mit dem Hash gespeichert." },
      { id: "kr6", f: "Welche Angaben stehen in einem X.509-Zertifikat? (alle richtigen ankreuzen)",
        o: ["Der öffentliche Schlüssel des Inhabers", "Der Gültigkeitszeitraum", "Der private Schlüssel des Inhabers", "Das Passwort des Inhabers"], r: [0, 1],
        w: "Der private Schlüssel verlässt nie den Inhaber." },
      { id: "kr7", f: "Welche Stelle stellt Zertifikate aus und signiert sie?",
        o: ["Zertifizierungsstelle (CA)", "Registrierungsstelle (RA)", "Der Browser", "Der DNS-Server"], r: [0],
        w: "Die RA prüft die Identität, die CA stellt aus und signiert." },
      { id: "kr8", f: "Welche Schutzziele sichert eine digitale Signatur? (alle richtigen ankreuzen)",
        o: ["Integrität", "Authentizität", "Vertraulichkeit", "Verfügbarkeit"], r: [0, 1],
        w: "Eine Signatur verschlüsselt das Dokument nicht — jeder kann es lesen. Sie beweist nur: unverändert und echt (und nicht abstreitbar)." },
      { id: "kr9", f: "Welches Verfahren ist symmetrisch?",
        o: ["AES", "RSA", "ECC", "SHA-256"], r: [0], w: "RSA und ECC sind asymmetrisch, SHA-256 ist eine Hashfunktion." },
      { id: "kr10", f: "Was unterscheidet einen HMAC von einer digitalen Signatur?",
        o: ["Beim HMAC kennen beide Seiten denselben geheimen Schlüssel — deshalb keine Nichtabstreitbarkeit.", "Der HMAC verschlüsselt die ganze Nachricht.", "Der HMAC braucht ein Zertifikat.", "Die Signatur ist umkehrbar, der HMAC nicht."], r: [0],
        w: "Mit einem gemeinsamen Schlüssel könnte auch der Empfänger den HMAC erzeugt haben." }
    ]
  });

  /* ==================================================== Zugriffsschutz */
  T.push({
    id: "auth", titel: "Authentifizierung und Zugriffsschutz", ru: "Аутентификация и управление доступом", teil: "GA1+GA2",
    katalog: "Katalog Datenschutz 01: Datensicherheit — Authentifizierung, Autorisierung, Verschlüsselung",
    links: [["https://ap2.online/security/authentifizierung", "Authentifizierung & Zugriffsschutz"], ["https://ap2.online/security/bedrohungen", "Bedrohungen"]],
    kurzRu: "Аутентификация — доказать, кто ты (пароль, токен, отпечаток). Авторизация — что тебе разрешено (права, роли). MFA — минимум два фактора из разных групп: знание, владение, биометрия. SSO — один вход для многих систем. OAuth 2.0 — приложение получает токен доступа к данным пользователя, не зная его пароля. Принцип минимальных прав.",
    punkte: [
      ["Identifikation, Authentifizierung, Autorisierung", "идентификация, аутентификация, авторизация", "Identifikation = ich sage, wer ich bin (Benutzername). Authentifizierung = ich beweise es (Passwort, Karte, Fingerabdruck). Autorisierung = das System gibt mir Rechte."],
      ["Faktoren", "факторы", "Wissen (Passwort, PIN), Besitz (Smartphone, Chipkarte, Token), Sein/Biometrie (Fingerabdruck, Gesicht)."],
      ["Mehr-Faktor-Authentifizierung", "многофакторная аутентификация", "Mindestens zwei Faktoren aus verschiedenen Gruppen, z. B. Passwort + Code aus der App. Ein gestohlenes Passwort allein reicht dann nicht."],
      ["sichere Passwörter", "надёжные пароли", "Lang (mindestens 12 Zeichen), nirgends doppelt verwenden, Passwortmanager. Im System nur als Hash mit Salt speichern. Nach mehreren Fehlversuchen sperren oder verzögern."],
      ["Single Sign-on (SSO)", "единый вход", "Einmal anmelden, Zugang zu vielen Anwendungen. Vorteil: weniger Passwörter, zentrale Verwaltung. Risiko: Wer den einen Zugang hat, hat alles → mit MFA schützen."],
      ["OAuth 2.0", "делегированная авторизация", "Standard für delegierte Autorisierung. Eine App bekommt ein Access Token und darf damit im Namen des Nutzers auf bestimmte Daten zugreifen — ohne sein Passwort zu kennen. „Login mit Google“ nutzt OpenID Connect, das auf OAuth 2.0 aufbaut."],
      ["Rollen und minimale Rechte", "роли и минимальные права", "Rechte werden Rollen zugeordnet (z. B. Sachbearbeiter, Admin), Nutzer bekommen Rollen (RBAC). Prinzip der minimalen Rechte: nur so viele Rechte wie für die Aufgabe nötig."],
      ["Zutritt, Zugang, Zugriff", "доступ в помещение, к системе, к данным", "Zutrittskontrolle = Räume (Schlüssel, Ausweis). Zugangskontrolle = Systeme (Login). Zugriffskontrolle = Daten (Lese- und Schreibrechte)."],
      ["Protokollierung", "журналирование", "Anmeldungen und Zugriffe aufzeichnen, um Angriffe zu erkennen und nachzuvollziehen — Datenschutz beachten."]
    ],
    merke: "Authentifizierung = Wer bist du? Autorisierung = Was darfst du?",
    karten: ["a29", "a30", "a31", "s02"],
    quiz: [
      { id: "au1", f: "Was ist Autorisierung?",
        o: ["Das System legt fest, was ein angemeldeter Nutzer tun darf.", "Der Nutzer beweist, wer er ist.", "Der Nutzer nennt seinen Benutzernamen.", "Das Passwort wird verschlüsselt."], r: [0],
        w: "Erst authentifizieren (wer?), dann autorisieren (was darf er?)." },
      { id: "au2", f: "Welche Kombination ist eine echte Zwei-Faktor-Authentifizierung?",
        o: ["Passwort + Code aus einer Authenticator-App", "Passwort + PIN", "Passwort + Sicherheitsfrage", "Benutzername + Passwort"], r: [0],
        w: "Passwort, PIN und Sicherheitsfrage sind alle „Wissen“. Die App auf dem Handy ist „Besitz“." },
      { id: "au3", f: "Was ist der Hauptvorteil von Single Sign-on?",
        o: ["Nutzer melden sich einmal an und können viele Anwendungen nutzen.", "Jede Anwendung hat ein eigenes Passwort.", "Man braucht keine Authentifizierung mehr.", "Daten werden automatisch gesichert."], r: [0],
        w: "Weniger Passwörter, zentrale Verwaltung — aber der eine Zugang muss gut geschützt sein." },
      { id: "au4", f: "Eine Fitness-App möchte auf die Schrittzahlen in Ihrem Google-Konto zugreifen, ohne Ihr Google-Passwort zu erhalten. Welcher Standard wird dafür genutzt?",
        o: ["OAuth 2.0", "SOAP", "FTP", "CSV"], r: [0],
        w: "OAuth 2.0: Sie erlauben den Zugriff, die App bekommt nur ein Token mit begrenzten Rechten." },
      { id: "au5", f: "Ein Mitarbeiter darf Kundendaten lesen, aber nicht löschen. Welche Kontrolle ist das?",
        o: ["Zugriffskontrolle", "Zutrittskontrolle", "Zugangskontrolle", "Weitergabekontrolle"], r: [0],
        w: "Zugriff = Rechte auf Daten. Zugang = ins System. Zutritt = in den Raum." },
      { id: "au6", f: "Was besagt das Prinzip der minimalen Rechte?",
        o: ["Jeder bekommt nur die Rechte, die er für seine Aufgabe braucht.", "Administratoren haben keine Rechte.", "Alle Nutzer bekommen die gleichen Rechte.", "Rechte werden nur einmal im Jahr vergeben."], r: [0],
        w: "So richtet ein gestohlenes Konto weniger Schaden an." },
      { id: "au7", f: "Welche Maßnahmen schützen einen Login gegen Passwortraten (Brute Force)? (alle richtigen ankreuzen)",
        o: ["Sperre oder Wartezeit nach mehreren Fehlversuchen", "Mehr-Faktor-Authentifizierung", "Passwörter im Klartext speichern", "Kürzere Passwörter erlauben"], r: [0, 1],
        w: "Fehlversuche begrenzen und einen zweiten Faktor verlangen." }
    ]
  });

  /* =================================================== Datenintegrität */
  T.push({
    id: "integritaet", titel: "Datenintegrität und Transaktionen", ru: "Целостность данных и транзакции", teil: "GA2",
    katalog: "Katalog Datenschutz 02: Constraints, Validierungen, Transaktionssicherheit",
    links: [["https://ap2.online/sql/schluessel", "Schlüssel in Datenbanken"], ["https://ap2.online/sql/syntax", "SQL-Syntax"]],
    kurzRu: "Целостность данных обеспечивают ограничения в БД (PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, CHECK), проверка ввода (в браузере для удобства и обязательно на сервере) и подготовленные запросы против SQL-инъекций. Транзакция — «всё или ничего»: свойства ACID, COMMIT подтверждает, ROLLBACK откатывает.",
    punkte: [
      ["Datenintegrität", "целостность данных", "Daten sind korrekt, vollständig und widerspruchsfrei."],
      ["Constraints", "ограничения", "PRIMARY KEY (eindeutig, nicht leer), FOREIGN KEY (Wert muss in der anderen Tabelle existieren), NOT NULL (Pflichtfeld), UNIQUE (kein Wert doppelt), CHECK (Bedingung, z. B. Preis > 0), DEFAULT (Standardwert)."],
      ["referentielle Integrität", "ссылочная целостность", "Ein Fremdschlüssel zeigt immer auf einen vorhandenen Datensatz. Beim Löschen: ON DELETE RESTRICT (verbieten), CASCADE (abhängige mitlöschen), SET NULL (Fremdschlüssel wird auf NULL gesetzt)."],
      ["Validierung", "проверка ввода", "Eingaben prüfen: Pflichtfeld, Format (E-Mail, Datum), Wertebereich, Länge. Im Browser für den Komfort, auf dem Server immer — der Client kann umgangen werden."],
      ["SQL-Injection verhindern", "защита от SQL-инъекций", "Eingaben nie direkt in den SQL-Text einbauen. Prepared Statements mit Platzhaltern (?) nutzen."],
      ["Transaktion", "транзакция", "Mehrere Schritte, die nur zusammen gelten. Beispiel Überweisung: abbuchen UND gutschreiben — oder keins von beiden."],
      ["ACID", "свойства транзакции", "Atomicity (alles oder nichts), Consistency (danach wieder gültiger Zustand), Isolation (parallele Transaktionen stören sich nicht), Durability (nach COMMIT dauerhaft gespeichert)."],
      ["COMMIT und ROLLBACK", "COMMIT и ROLLBACK", "BEGIN beginnt in SQLite eine Transaktion (MySQL: START TRANSACTION). COMMIT bestätigt dauerhaft, ROLLBACK macht alles seit dem Start rückgängig."],
      ["Sperren", "блокировки", "Damit zwei Nutzer nicht gleichzeitig denselben Datensatz überschreiben (Lost Update), sperrt die Datenbank ihn kurz."]
    ],
    code: [
      { titel: "Constraints, Transaktion, Prepared Statement", text:
`CREATE TABLE Artikel (
  ArtikelNr   INT PRIMARY KEY,
  Bezeichnung VARCHAR(60) NOT NULL,
  EAN         CHAR(13) UNIQUE,
  Preis       DECIMAL(8,2) CHECK (Preis > 0),
  KategorieNr INT,
  FOREIGN KEY (KategorieNr) REFERENCES Kategorie(KategorieNr)
    ON DELETE RESTRICT
);

BEGIN;          -- SQLite; in MySQL: START TRANSACTION;
UPDATE Konto SET Saldo = Saldo - 500 WHERE KontoNr = 1;
UPDATE Konto SET Saldo = Saldo + 500 WHERE KontoNr = 2;
COMMIT;          -- bei einem Fehler stattdessen: ROLLBACK;

// Java: Platzhalter statt String-Verkettung
PreparedStatement ps =
    con.prepareStatement("SELECT * FROM Kunde WHERE Name = ?");
ps.setString(1, eingabe);` }
    ],
    merke: "Die Datenbank prüft mit Constraints, das Programm mit Validierung, die Transaktion sorgt für „alles oder nichts“.",
    trainer: "sql",
    karten: ["a32", "a33", "a34", "a35"],
    quiz: [
      { id: "in1", f: "Welcher Constraint verhindert, dass eine E-Mail-Adresse zweimal vorkommt?",
        o: ["UNIQUE", "NOT NULL", "CHECK", "DEFAULT"], r: [0], w: "UNIQUE = kein Wert doppelt (NULL ist je nach DBMS erlaubt)." },
      { id: "in2", f: "Was bedeutet das „A“ in ACID?",
        o: ["Atomarität: alle Schritte oder keiner", "Authentifizierung", "Aktualität der Daten", "Archivierung"], r: [0], w: "Atomicity — die Transaktion ist unteilbar." },
      { id: "in3", f: "Bei einer Überweisung fällt nach dem Abbuchen der Server aus. Was sorgt dafür, dass das Geld nicht verloren geht?",
        o: ["Die Transaktion wurde nicht bestätigt und wird zurückgesetzt (ROLLBACK).", "Ein UNIQUE-Constraint", "Ein Index auf der Kontonummer", "Eine Sicht (VIEW)"], r: [0],
        w: "Ohne COMMIT gilt nichts davon — die Datenbank setzt beim Neustart zurück." },
      { id: "in4", f: "Warum reicht eine Eingabeprüfung nur im Browser nicht?",
        o: ["Der Browser-Code kann umgangen werden; der Server muss selbst prüfen.", "Browser können keine Zahlen prüfen.", "Weil JavaScript zu langsam ist.", "Weil Datenbanken keine Prüfungen kennen."], r: [0],
        w: "Wer die API direkt aufruft oder JavaScript ausschaltet, umgeht die Prüfung im Browser." },
      { id: "in5", f: "Was schützt zuverlässig vor SQL-Injection?",
        o: ["Prepared Statements mit Platzhaltern", "Lange Tabellennamen", "Ein UNIQUE-Constraint", "Ein schnellerer Server"], r: [0],
        w: "Die Eingabe wird getrennt übergeben und nie als SQL-Code ausgeführt." },
      { id: "in6", f: "Ein Kunde mit Bestellungen soll nicht gelöscht werden können. Welche Einstellung am Fremdschlüssel passt?",
        o: ["ON DELETE RESTRICT", "ON DELETE CASCADE", "ON DELETE SET NULL", "gar kein Fremdschlüssel"], r: [0],
        w: "RESTRICT verbietet das Löschen, solange abhängige Datensätze da sind. CASCADE würde die Bestellungen mitlöschen." },
      { id: "in7", f: "Welcher Constraint stellt sicher, dass ein Preis nie negativ ist?",
        o: ["CHECK (Preis >= 0)", "UNIQUE (Preis)", "PRIMARY KEY (Preis)", "DEFAULT 0"], r: [0], w: "CHECK prüft eine Bedingung bei jedem INSERT und UPDATE." }
    ]
  });

  /* =================================================== Vorgehensmodelle */
  T.push({
    id: "vorgehen", titel: "Vorgehensmodelle: klassisch und agil", ru: "Модели процесса разработки", teil: "GA1",
    katalog: "Katalog Entwicklung 02 und 03: Wasserfall, Spiralmodell, V-Modell, Scrum; Top-down, Bottom-up, Modularisierung",
    links: [["https://ap2.online/management/klassischemethoden", "Klassische Vorgehensmodelle"],
            ["https://ap2.online/management/agilemethoden", "Agile Softwareentwicklung"],
            ["https://ap2.online/management/projektmanagement", "Projektmanagement"]],
    kurzRu: "Классика: водопад (фазы строго по очереди), V-модель (каждой фазе разработки — свой уровень теста), спиральная (циклы с анализом рисков и прототипами). Agile: Scrum (роли Product Owner, Scrum Master, разработчики; спринт — не больше месяца (обычно 2–4 недели); Daily, Review, Retro), Kanban (доска, WIP-лимит), XP (TDD, парное программирование, CI). User Story: «Als … möchte ich …, damit …». MVP — минимальный продукт для раннего отзыва.",
    punkte: [
      ["Wasserfallmodell", "водопадная модель", "Phasen nacheinander: Analyse → Entwurf → Umsetzung → Test → Einführung/Betrieb. Jede Phase endet mit einem Dokument. Gut bei festen, klaren Anforderungen. Nachteil: Änderungen spät und teuer, der Kunde sieht erst am Ende etwas."],
      ["V-Modell", "V-модель", "Wie Wasserfall, aber zu jeder Entwurfsphase gehört eine Testphase: Anforderungen ↔ Abnahmetest, Systementwurf ↔ Systemtest, Architektur ↔ Integrationstest, Modulentwurf ↔ Modultest. Gut für sicherheitskritische Projekte und Behörden."],
      ["Spiralmodell", "спиральная модель", "Mehrere Runden. Jede Runde: Ziele festlegen → Risiken bewerten (oft mit Prototyp) → entwickeln und testen → nächste Runde planen. Gut für große, riskante Projekte."],
      ["Agiles Manifest", "Agile-манифест", "Individuen und Interaktionen (Menschen und ihr Austausch) vor Prozessen und Werkzeugen. Funktionierende Software vor umfassender Dokumentation. Zusammenarbeit mit dem Kunden vor Vertragsverhandlung. Reagieren auf Veränderung vor Befolgen eines Plans."],
      ["Scrum — Rollen", "роли в Scrum", "Product Owner: verantwortet das Produkt und priorisiert das Product Backlog. Scrum Master: sorgt dafür, dass Scrum funktioniert, räumt Hindernisse weg. Developers (Entwicklerteam): setzen um und organisieren sich selbst."],
      ["Scrum — Artefakte und Events", "артефакты и события", "Product Backlog, Sprint Backlog, Inkrement. Sprint (feste Länge, höchstens ein Monat, oft 2–4 Wochen) mit Sprint Planning, Daily Scrum (täglich, höchstens 15 Minuten), Sprint Review (Ergebnis zeigen) und Retrospektive (Zusammenarbeit verbessern)."],
      ["Kanban", "канбан", "Board mit Spalten, z. B. To do – In Arbeit – Fertig. WIP-Limit: nur begrenzt viele Aufgaben gleichzeitig in Arbeit. Pull-Prinzip, keine festen Sprints."],
      ["Extreme Programming (XP)", "экстремальное программирование", "Testgetriebene Entwicklung, Pair Programming, Continuous Integration, Refactoring, kleine Releases."],
      ["User Story", "пользовательская история", "„Als <Rolle> möchte ich <Funktion>, damit <Nutzen>.“ Dazu Akzeptanzkriterien: Wann ist die Story fertig?"],
      ["MVP", "минимально жизнеспособный продукт", "Minimum Viable Product: kleinste nutzbare Version mit den Kernfunktionen. Früh an echte Nutzer geben, Feedback holen, dann ausbauen."],
      ["Top-down und Bottom-up", "сверху вниз и снизу вверх", "Top-down = vom Ganzen zum Detail zerlegen. Bottom-up = aus fertigen Bausteinen das Ganze zusammensetzen. Modularisierung = in kleine, abgeschlossene Teile zerlegen."]
    ],
    tabelle: { titel: "Klassisch oder agil?",
      kopf: ["Merkmal", "klassisch (Wasserfall, V-Modell)", "agil (Scrum)"],
      zeilen: [
        ["Anforderungen", "am Anfang fest", "wachsen und ändern sich"],
        ["Lieferung", "am Ende", "nach jedem Sprint ein Inkrement"],
        ["Kunde", "vor allem am Anfang und am Ende", "ständig beteiligt"],
        ["Dokumentation", "umfangreich", "so viel wie nötig"],
        ["passt zu", "klaren, stabilen Projekten, Behörden", "unklaren, sich ändernden Anforderungen"]
      ] },
    merke: "Feste Anforderungen → Wasserfall oder V-Modell. Unklare, wechselnde Anforderungen → agil (Scrum).",
    karten: ["a36", "a37", "a38", "s18", "s121", "s122"],
    quiz: [
      { id: "vo1", f: "Wer priorisiert in Scrum das Product Backlog?",
        o: ["Product Owner", "Scrum Master", "Entwicklerteam", "Geschäftsführung"], r: [0], w: "Der Product Owner entscheidet, was den meisten Nutzen bringt." },
      { id: "vo2", f: "Wie lange dauert das Daily Scrum höchstens?",
        o: ["15 Minuten", "1 Stunde", "1 Tag", "1 Woche"], r: [0], w: "Kurz, täglich, im Stehen möglich." },
      { id: "vo3", f: "Ein Kunde kann seine Anforderungen am Anfang nur grob beschreiben und will früh Zwischenergebnisse sehen. Welches Vorgehen passt?",
        o: ["Scrum", "Wasserfallmodell", "V-Modell", "kein Vorgehensmodell"], r: [0], w: "Agil: nach jedem Sprint ein lauffähiges Inkrement, Änderungen sind eingeplant." },
      { id: "vo4", f: "Was ist typisch für das Spiralmodell?",
        o: ["In jeder Runde werden Risiken bewertet, oft mit Prototypen.", "Es gibt nur eine Phase.", "Es verzichtet ganz auf Tests.", "Der Kunde ist nie beteiligt."], r: [0], w: "Risikoanalyse ist der Kern jeder Spiralrunde." },
      { id: "vo5", f: "Welche User Story ist richtig formuliert?",
        o: ["Als Kunde möchte ich meine Bestellungen sehen, damit ich den Lieferstatus prüfen kann.", "Das System soll eine Datenbank haben.", "Bestellungen anzeigen.", "Der Entwickler programmiert eine Tabelle."], r: [0], w: "Rolle — Funktion — Nutzen." },
      { id: "vo6", f: "Was ist ein MVP?",
        o: ["Die kleinste Version eines Produkts, die schon echten Nutzen bringt und Feedback liefert.", "Der wichtigste Mitarbeiter im Projekt.", "Ein vollständiges Produkt mit allen Funktionen.", "Ein Testprotokoll."], r: [0], w: "Minimum Viable Product." },
      { id: "vo7", f: "Wozu dient die Sprint-Retrospektive?",
        o: ["Das Team verbessert seine Zusammenarbeit und Arbeitsweise.", "Das Ergebnis wird dem Kunden gezeigt.", "Der nächste Sprint wird geplant.", "Fehler im Code werden gesucht."], r: [0], w: "Review = Produkt zeigen. Retrospektive = Arbeitsweise verbessern." },
      { id: "vo8", f: "Was begrenzt ein WIP-Limit im Kanban?",
        o: ["Die Anzahl der Aufgaben, die gleichzeitig in Arbeit sind.", "Die Länge eines Sprints.", "Die Zahl der Teammitglieder.", "Das Budget."], r: [0], w: "WIP = Work in Progress." },
      { id: "vo9", f: "Welche Nachteile hat das Wasserfallmodell? (alle richtigen ankreuzen)",
        o: ["Änderungen in späten Phasen sind teuer.", "Der Kunde sieht erst spät ein lauffähiges Ergebnis.", "Es gibt keine Dokumentation.", "Es ist nur für sehr kleine Projekte erlaubt."], r: [0, 1], w: "Wasserfall dokumentiert sogar sehr viel." },
      { id: "vo10", f: "Im V-Modell: Welche Teststufe gehört zum Modulentwurf?",
        o: ["Modultest (Unit-Test)", "Abnahmetest", "Systemtest", "Integrationstest"], r: [0], w: "Unten im V liegen Modulentwurf und Modultest gegenüber." }
    ]
  });

  /* ==================================================== Anforderungen */
  T.push({
    id: "anforderungen", titel: "Anforderungen, Qualität, Verträge", ru: "Требования, качество, договоры", teil: "GA1",
    katalog: "Katalog Entwicklung 01: Lasten-/Pflichtenheft; Service Level Agreement; Qualitätsmerkmale",
    links: [["https://ap2.online/management/vereinbarungen", "Vereinbarungen in IT-Projekten"],
            ["https://ap2.online/quality/qualitaetsmanagement", "Qualitätsmanagement"]],
    kurzRu: "Lastenheft пишет заказчик (ЧТО и ЗАЧЕМ), Pflichtenheft — исполнитель (КАК и ЧЕМ). Функциональные требования — что система делает; нефункциональные — насколько хорошо (скорость, доступность, безопасность, удобство), всегда измеримо. ISO 25010 — критерии качества ПО. SLA — договор об уровне сервиса (доступность, время реакции). Werkvertrag — исполнитель отвечает за результат (с приёмкой), Dienstvertrag — только за выполнение работы.",
    punkte: [
      ["Lastenheft", "техзадание заказчика", "Schreibt der Auftraggeber: Was soll das System können und wofür? Grundlage für Angebote."],
      ["Pflichtenheft", "техзадание исполнителя", "Schreibt der Auftragnehmer auf Basis des Lastenhefts: Wie und womit wird es umgesetzt? Der Kunde gibt es frei; es ist Grundlage für die Abnahme."],
      ["funktionale Anforderung", "функциональное требование", "Was das System tut: „Das System erstellt die Rechnung als PDF.“"],
      ["nicht-funktionale Anforderung", "нефункциональное требование", "Wie gut es das tut: Antwortzeit unter 2 Sekunden, Verfügbarkeit 99,5 %, barrierefrei, DSGVO-konform. Immer messbar formulieren."],
      ["ISO 25010", "стандарт качества ПО", "Qualitätsmerkmale: funktionale Eignung, Leistungseffizienz, Kompatibilität, Benutzbarkeit, Zuverlässigkeit, Sicherheit, Wartbarkeit, Übertragbarkeit (Portabilität)."],
      ["SLA", "соглашение об уровне сервиса", "Service Level Agreement: Vertrag über die Qualität einer Dienstleistung — Verfügbarkeit (z. B. 99,9 %), Reaktionszeit, Lösungszeit, Servicezeiten, Messung, Vertragsstrafe bei Verstoß."],
      ["Werkvertrag und Dienstvertrag", "договор подряда и договор услуг", "Werkvertrag: Ein Erfolg ist geschuldet (z. B. fertige Individualsoftware), mit Abnahme. Dienstvertrag: Nur die Tätigkeit ist geschuldet (z. B. Beratung, Support nach Stunden). Standardsoftware kaufen = Kaufvertrag."],
      ["Abnahme", "приёмка", "Der Kunde prüft das Ergebnis gegen das Pflichtenheft und bestätigt es im Abnahmeprotokoll. Danach beginnen Gewährleistung und Zahlungspflicht."],
      ["gute Anforderungen", "хорошие требования", "Eindeutig, vollständig, prüfbar (messbar), widerspruchsfrei, umsetzbar."]
    ],
    tabelle: { titel: "Lastenheft und Pflichtenheft",
      kopf: ["", "Lastenheft", "Pflichtenheft"],
      zeilen: [
        ["Wer schreibt?", "Auftraggeber (Kunde)", "Auftragnehmer (Dienstleister)"],
        ["Frage", "WAS und WOFÜR?", "WIE und WOMIT?"],
        ["Grundlage für", "Angebote", "Umsetzung und Abnahme"]
      ] },
    merke: "Lastenheft = Kunde: was. Pflichtenheft = Dienstleister: wie. Nicht-funktionale Anforderungen immer mit Zahl.",
    karten: ["a39", "a40", "s141", "s15", "s77"],
    quiz: [
      { id: "an1", f: "Wer erstellt das Pflichtenheft?",
        o: ["Der Auftragnehmer", "Der Auftraggeber", "Die IHK", "Der Endnutzer"], r: [0], w: "Der Dienstleister beschreibt, wie er das Lastenheft umsetzt." },
      { id: "an2", f: "Welche Anforderung ist nicht-funktional?",
        o: ["Die Suche liefert Ergebnisse in unter 2 Sekunden.", "Das System erstellt Rechnungen.", "Kunden können sich registrieren.", "Der Admin kann Nutzer sperren."], r: [0], w: "Antwortzeit beschreibt, wie gut — nicht was." },
      { id: "an3", f: "Ein Softwarehaus entwickelt eine App nach Kundenwunsch und schuldet ein funktionierendes Ergebnis. Welche Vertragsart?",
        o: ["Werkvertrag", "Dienstvertrag", "Kaufvertrag", "Mietvertrag"], r: [0], w: "Geschuldet ist ein Erfolg → Werkvertrag mit Abnahme." },
      { id: "an4", f: "Was wird typischerweise in einem SLA festgelegt?",
        o: ["Verfügbarkeit und Reaktionszeiten", "Die Programmiersprache", "Die Farben der Oberfläche", "Das Gehalt der Entwickler"], r: [0], w: "SLA = messbare Qualität der Dienstleistung." },
      { id: "an5", f: "Welches Merkmal gehört zur ISO 25010?",
        o: ["Wartbarkeit", "Preis", "Teamgröße", "Programmiersprache"], r: [0], w: "Die Norm beschreibt Produktqualität, nicht Kosten oder Team." },
      { id: "an6", f: "Welche Eigenschaften sollen Anforderungen haben? (alle richtigen ankreuzen)",
        o: ["prüfbar (messbar)", "eindeutig", "möglichst allgemein", "nur mündlich vereinbart"], r: [0, 1], w: "Nur eindeutige, messbare Anforderungen kann man bei der Abnahme prüfen." },
      { id: "an7", f: "„Das System soll schnell sein.“ — Was ist das Problem?",
        o: ["Die Anforderung ist nicht messbar und damit nicht prüfbar.", "Sie ist funktional.", "Sie gehört ins Pflichtenheft.", "Nichts — sie ist gut formuliert."], r: [0], w: "Besser: „Die Suche antwortet bei 100 gleichzeitigen Nutzern in unter 2 Sekunden.“" },
      { id: "an8", f: "Bei einem Supportvertrag nach Stunden schuldet der Dienstleister …",
        o: ["… die Tätigkeit, nicht einen bestimmten Erfolg (Dienstvertrag).", "… einen bestimmten Erfolg (Werkvertrag).", "… die Übergabe einer Sache (Kaufvertrag).", "… gar nichts."], r: [0], w: "Dienstvertrag: Bezahlt wird die Arbeit." }
    ]
  });

  /* ======================================================== Ergonomie */
  T.push({
    id: "ergonomie", titel: "Softwareergonomie, Usability, Barrierefreiheit", ru: "Эргономика ПО и доступность", teil: "GA1",
    katalog: "Katalog Entwicklung 13–15: Softwareergonomie, Usability, User Experience, Mockups",
    links: [["https://ap2.online/entwicklung/ergonomie", "Softwareergonomie"]],
    kurzRu: "Эргономика ПО — программа подстраивается под человека и его задачу. ISO 9241-110: принципы взаимодействия (соответствие задаче, самоописательность, соответствие ожиданиям, лёгкость обучения, управляемость, устойчивость к ошибкам, вовлечённость). Usability = эффективно, производительно, с удовлетворением. Доступность: WCAG/BITV, альтернативный текст, контраст, управление клавиатурой. Wireframe → Mockup → кликабельный прототип.",
    punkte: [
      ["Softwareergonomie", "эргономика ПО", "Software passt sich dem Menschen und seiner Aufgabe an, nicht umgekehrt. Ziel: wenig Fehler, wenig Belastung, schnelles Arbeiten."],
      ["Usability", "удобство использования", "Gebrauchstauglichkeit nach ISO 9241-11: Nutzer erreichen ihr Ziel effektiv (genau und vollständig), effizient (mit wenig Aufwand) und zufrieden."],
      ["User Experience (UX)", "пользовательский опыт", "Das ganze Erleben rund um das Produkt — vor, während und nach der Nutzung: Erwartung, Gefühl, Vertrauen."],
      ["ISO 9241-110 (1)", "принципы ISO 9241-110", "Aufgabenangemessenheit: nur nötige Schritte und Felder. Selbstbeschreibungsfähigkeit: man versteht ohne Handbuch, wo man ist und was geht. Erwartungskonformität: verhält sich wie gewohnt (gleiche Symbole, gleiche Orte)."],
      ["ISO 9241-110 (2)", "принципы ISO 9241-110", "Erlernbarkeit (Lernförderlichkeit): leicht zu lernen. Steuerbarkeit: Nutzer bestimmt Tempo und Reihenfolge, kann abbrechen und rückgängig machen. Robustheit gegen Benutzungsfehler (Fehlertoleranz): Fehler verhindern oder leicht korrigieren."],
      ["ISO 9241-110 (3)", "принципы ISO 9241-110", "Benutzerbindung (neu seit 2020): Die Software motiviert zur Nutzung. In der alten Fassung von 2006 gab es noch Individualisierbarkeit (an eigene Bedürfnisse anpassbar). Seit 2020 ist sie kein eigener Grundsatz mehr."],
      ["Barrierefreiheit", "доступность", "Alle Menschen können die Software nutzen, auch mit Seh-, Hör- oder motorischen Einschränkungen. Regeln: WCAG. In Deutschland gilt die BITV 2.0 für Behörden (öffentliche Stellen). Seit 28.06.2025 gilt das Barrierefreiheitsstärkungsgesetz (BFSG) auch für viele Produkte und Dienstleistungen von Unternehmen, z. B. Online-Shops und Banking."],
      ["Barrierefreiheit konkret", "как обеспечить доступность", "Alternativtexte für Bilder, genug Kontrast, alles per Tastatur bedienbar, Screenreader-tauglich, Schrift vergrößerbar, Informationen nicht nur über Farbe, Untertitel, einfache Sprache."],
      ["Wireframe, Mockup, Prototyp", "каркас, макет, прототип", "Wireframe = grobe Skizze des Aufbaus (Kästen, keine Farben). Mockup = genaues Aussehen, aber ohne Funktion. Prototyp = klickbar, Abläufe lassen sich ausprobieren."],
      ["Corporate Design", "фирменный стиль", "Farben, Logo und Schrift des Unternehmens einheitlich verwenden — auch das ist Erwartungskonformität."]
    ],
    merke: "Ergonomie = für den Menschen gebaut. Steuerbarkeit = ich kann abbrechen und zurück. Fehlertoleranz = Fehler werden abgefangen.",
    karten: ["a41", "a42", "a43"],
    quiz: [
      { id: "er1", f: "Ein Formular erklärt bei einer falschen Eingabe genau, was falsch ist, und behält alle anderen Eingaben. Welcher Grundsatz?",
        o: ["Robustheit gegen Benutzungsfehler (Fehlertoleranz)", "Individualisierbarkeit", "Aufgabenangemessenheit", "Corporate Design"], r: [0], w: "Fehler werden abgefangen und lassen sich leicht korrigieren." },
      { id: "er2", f: "Der Nutzer kann einen langen Vorgang jederzeit abbrechen und Schritte rückgängig machen. Welcher Grundsatz?",
        o: ["Steuerbarkeit", "Selbstbeschreibungsfähigkeit", "Erwartungskonformität", "Erlernbarkeit"], r: [0], w: "Der Nutzer behält die Kontrolle." },
      { id: "er3", f: "Das Diskettensymbol bedeutet in allen Programmteilen „Speichern“. Welcher Grundsatz?",
        o: ["Erwartungskonformität", "Steuerbarkeit", "Fehlertoleranz", "Aufgabenangemessenheit"], r: [0], w: "Einheitlich und wie gewohnt = erwartungskonform." },
      { id: "er4", f: "Welche Maßnahme verbessert die Barrierefreiheit?",
        o: ["Alternativtexte für Bilder und Bedienung per Tastatur", "Wichtige Hinweise nur in roter Farbe", "Sehr kleine, feste Schriftgröße", "Zeitlimit von 10 Sekunden für Formulare"], r: [0], w: "Screenreader brauchen Alternativtexte; manche Menschen können keine Maus benutzen." },
      { id: "er5", f: "Was ist ein Mockup?",
        o: ["Ein Entwurf, der zeigt, wie die Oberfläche aussehen soll — noch ohne Funktion.", "Ein fertiges Programm.", "Ein Test mit vielen Nutzern.", "Ein Datenbankschema."], r: [0], w: "Klickbar wird es erst als Prototyp." },
      { id: "er6", f: "Welche Kriterien beschreiben Usability nach ISO 9241-11? (alle richtigen ankreuzen)",
        o: ["Effektivität", "Effizienz", "Zufriedenheit", "Farbigkeit"], r: [0, 1, 2], w: "Richtig, mit wenig Aufwand und zufrieden ans Ziel." },
      { id: "er7", f: "Eine Maske zeigt nur die Felder, die für die aktuelle Aufgabe gebraucht werden. Welcher Grundsatz?",
        o: ["Aufgabenangemessenheit", "Steuerbarkeit", "Benutzerbindung", "Fehlertoleranz"], r: [0], w: "Nichts Überflüssiges, alles Nötige." },
      { id: "er8", f: "Welche Vorteile hat ein klickbarer Prototyp? (alle richtigen ankreuzen)",
        o: ["Der Kunde kann Abläufe früh ausprobieren.", "Missverständnisse in den Anforderungen fallen früh auf.", "Er ersetzt alle Tests.", "Die Software muss danach nicht mehr programmiert werden."], r: [0, 1], w: "Früh testen ist billig; programmieren muss man trotzdem." }
    ]
  });

  /* ====================================================== Werkzeuge */
  T.push({
    id: "werkzeuge", titel: "Paradigmen und Entwicklungswerkzeuge", ru: "Парадигмы и инструменты разработки", teil: "GA1+GA2",
    katalog: "Katalog Entwicklung 06–08: Konzepte von Programmiersprachen, Werkzeuge (Editor, IDE, Compiler, Interpreter, Linker, Debugger)",
    links: [["https://ap2.online/entwicklung/entwicklung", "Softwareentwicklung"]],
    kurzRu: "Компилятор заранее переводит весь код в машинный (работает быстро, ошибки видны до запуска). Интерпретатор выполняет код построчно во время работы (переносимо, медленнее). Java: компилятор → байт-код → JVM. Линкер соединяет части и библиотеки. Отладчик — точки останова, пошаговое выполнение. Парадигмы: процедурная, объектно-ориентированная, функциональная, декларативная (SQL).",
    punkte: [
      ["Compiler", "компилятор", "Übersetzt den ganzen Quellcode vor dem Start in Maschinencode. Syntaxfehler sieht man vor dem Start, das Programm läuft schnell. Das Ergebnis passt nur zu einer Plattform. Beispiel: C, C++."],
      ["Interpreter", "интерпретатор", "Führt den Code zur Laufzeit Anweisung für Anweisung aus. Plattformunabhängig und schnell ausprobiert, aber langsamer. Beispiel: Python, JavaScript."],
      ["Java und C#", "Java и C#", "Der Compiler erzeugt Bytecode (Zwischencode), eine virtuelle Maschine (JVM bzw. .NET) führt ihn aus, oft mit JIT-Compiler. So läuft dasselbe Programm auf vielen Systemen."],
      ["Linker", "компоновщик", "Fügt übersetzte Programmteile und Bibliotheken zu einem ausführbaren Programm zusammen."],
      ["Debugger", "отладчик", "Programm an Haltepunkten (Breakpoints) anhalten, Schritt für Schritt ausführen, Variablenwerte ansehen."],
      ["IDE", "среда разработки", "Editor, Compiler, Debugger, Versionsverwaltung und Tests in einem Programm, z. B. IntelliJ, Eclipse, Visual Studio Code."],
      ["Programmierparadigmen", "парадигмы программирования", "Prozedural/strukturiert: Ablauf in Funktionen mit Sequenz, Verzweigung, Schleife (C). Objektorientiert: Klassen und Objekte (Java, C#). Funktional: Funktionen ohne Nebenwirkungen, unveränderliche Daten (Haskell, Lambdas). Deklarativ: sagen, WAS man will, nicht WIE (z. B. SQL)."],
      ["Code in der Prüfung", "код на экзамене", "Laut Prüfungskatalog: allgemein verständlicher Programm- oder Pseudocode, für Dritte lesbar; er muss nicht kompilierbar sein."]
    ],
    tabelle: { titel: "Compiler und Interpreter",
      kopf: ["", "Compiler", "Interpreter"],
      zeilen: [
        ["Übersetzung", "einmal vorher, ganzes Programm", "zur Laufzeit, Anweisung für Anweisung"],
        ["Geschwindigkeit", "schnell", "langsamer"],
        ["Fehler", "vor dem Start sichtbar", "erst, wenn die Stelle läuft"],
        ["Weitergabe", "ausführbare Datei (plattformabhängig)", "Quellcode + Interpreter (plattformunabhängig)"]
      ] },
    merke: "Compiler: erst alles übersetzen, dann starten. Interpreter: übersetzen beim Ausführen. SQL ist deklarativ.",
    karten: ["a44", "a45"],
    quiz: [
      { id: "wz1", f: "Was ist ein Vorteil eines Compilers gegenüber einem Interpreter?",
        o: ["Das fertige Programm läuft schneller.", "Der Code läuft ohne Übersetzung auf jedem System.", "Fehler werden erst zur Laufzeit sichtbar.", "Man braucht keinen Quellcode."], r: [0], w: "Die Übersetzung ist schon erledigt, wenn das Programm startet." },
      { id: "wz2", f: "Welches Werkzeug hält ein Programm an einem Haltepunkt an, damit man Variablen ansehen kann?",
        o: ["Debugger", "Linker", "Compiler", "Versionsverwaltung"], r: [0], w: "Breakpoints und Einzelschritte sind die Kernfunktion des Debuggers." },
      { id: "wz3", f: "Zu welchem Paradigma gehört SQL?",
        o: ["deklarativ", "prozedural", "objektorientiert", "maschinennah"], r: [0], w: "Man beschreibt das gewünschte Ergebnis, die Datenbank sucht den Weg." },
      { id: "wz4", f: "Was macht der Linker?",
        o: ["Er verbindet übersetzte Programmteile und Bibliotheken zu einem ausführbaren Programm.", "Er prüft den Code auf Rechtschreibfehler.", "Er lädt Code ins Repository hoch.", "Er erzeugt Testdaten."], r: [0], w: "Linker = Binder." },
      { id: "wz5", f: "Wie wird ein Java-Programm ausgeführt?",
        o: ["Der Compiler erzeugt Bytecode, die JVM führt ihn aus.", "Ein Interpreter liest direkt den .java-Quellcode.", "Der Linker erzeugt eine .exe für alle Systeme.", "Der Browser übersetzt den Code."], r: [0], w: ".java → javac → .class (Bytecode) → JVM." },
      { id: "wz6", f: "Welche Merkmale hat funktionale Programmierung? (alle richtigen ankreuzen)",
        o: ["Funktionen ohne Nebenwirkungen", "Unveränderliche Daten", "Alle Daten in globalen Variablen", "Viele goto-Sprünge"], r: [0, 1], w: "Gleiche Eingabe → gleiche Ausgabe, nichts wird nebenbei verändert." }
    ]
  });

  /* ================================================ Prüfungstaktik */
  T.push({
    id: "taktik", titel: "Prüfungstaktik GA1 und GA2", ru: "Тактика на экзамене GA1 и GA2", teil: "GA1+GA2",
    katalog: "Prüfungskatalog 2024: GA1 und GA2 je 90 Minuten, WiSo 60 Minuten; je 10 % der Gesamtnote",
    links: [["https://ap2.online/prufung/wichtigethemen", "Zentrale Themen für die AP2"]],
    kurzRu: "GA1 и GA2 — по 90 минут, обычно 4 задания по 20–30 баллов. Примерно 1 минута на балл, на одну диаграмму — не больше ~15 минут. Сначала 5 минут на обзор (и Belegsatz в GA2), начинать с сильной темы. Оператор определяет объём ответа: «nennen» — пункты, «erläutern/beschreiben» — полные предложения с причиной. Если просят два пункта — пиши ровно два. Код должен быть понятен постороннему, компилироваться не обязан.",
    punkte: [
      ["Aufbau", "структура", "GA1 „Planen eines Softwareproduktes“ und GA2 „Entwicklung und Umsetzung von Algorithmen“: je 90 Minuten, meist 4 Aufgaben zu 20–30 Punkten. WiSo: 60 Minuten, Ankreuzen. Jeder Teil zählt 10 %, die Projektarbeit 50 %."],
      ["Zeit", "время", "Rund 1 Minute pro Punkt planen, ein paar Minuten Reserve. Eine Aufgabe mit 25 Punkten → etwa 20–22 Minuten. Ein Diagramm höchstens etwa 15 Minuten."],
      ["zuerst lesen", "сначала прочитать", "5 Minuten Überblick: Ausgangssituation, alle Aufgaben, bei GA2 den Belegsatz (Tabellen, Codevorlagen). Dann mit dem stärksten Thema anfangen."],
      ["Operatoren", "операторы заданий", "„Nennen“ = Stichworte reichen. „Beschreiben/Erläutern“ = ganze Sätze mit Zusammenhang und Begründung. „Beurteilen“ = Kriterien + eigenes Urteil. „Nennen Sie zwei …“ → genau zwei; zusätzliche werden meist nicht gewertet."],
      ["Pseudocode", "псевдокод", "Allgemein verständlich, für Dritte lesbar, muss nicht kompilierbar sein. Sinnvolle Namen, Einrückung zeigt die Struktur. An Randfälle denken: leere Liste, null, erster und letzter Wert."],
      ["Diagramme", "диаграммы", "Erst die Elemente sammeln (Akteure, Klassen, Zustände), dann zeichnen. Notation sauber: Pfeilspitzen, Rauten, Multiplizitäten. Lieber vollständig und einfach als schön und halb."],
      ["SQL", "запросы SQL", "Tabellen- und Spaltennamen genau aus dem Belegsatz übernehmen. JOIN-Bedingung nicht vergessen. Bei GROUP BY alle nicht aggregierten Spalten nennen."],
      ["nichts leer lassen", "ничего не оставлять пустым", "Teilpunkte gibt es auch für richtige Ansätze. Rechenwege hinschreiben."]
    ],
    merke: "1 Minute pro Punkt, Diagramm ≤ 15 Minuten, Operator lesen, nichts leer lassen.",
    karten: ["a46", "s150", "s151"],
    quiz: [
      { id: "pt1", f: "Eine Aufgabe ist 25 Punkte wert. Wie viel Zeit planst du ungefähr ein?",
        o: ["etwa 20–25 Minuten", "etwa 5 Minuten", "etwa 45 Minuten", "so viel, wie nötig ist"], r: [0], w: "90 Minuten für rund 100 Punkte → knapp 1 Minute pro Punkt." },
      { id: "pt2", f: "„Nennen Sie zwei Vorteile …“ — Was ist richtig?",
        o: ["Genau zwei Vorteile als Stichworte; zusätzliche werden meist nicht gewertet.", "Möglichst viele Vorteile aufschreiben.", "Zwei Vorteile mit je einer halben Seite Erklärung.", "Einen Vorteil ausführlich."], r: [0], w: "Gewertet werden in der Regel die ersten genannten." },
      { id: "pt3", f: "Was gilt laut Prüfungskatalog für Programmcode in der Prüfung?",
        o: ["Er muss für Dritte verständlich sein, aber nicht kompilierbar.", "Er muss fehlerfrei in Java kompilieren.", "Er darf nur in Python geschrieben sein.", "Er muss als Struktogramm gezeichnet werden."], r: [0], w: "Allgemein verständlicher Programm- oder Pseudocode." },
      { id: "pt4", f: "Was liest du bei GA2 vor der ersten Aufgabe?",
        o: ["Die Ausgangssituation und den Belegsatz", "Nur die letzte Aufgabe", "Die Lösungshinweise", "Nichts — gleich anfangen"], r: [0], w: "Im Belegsatz stehen Tabellen und Vorlagen, die mehrere Aufgaben brauchen." },
      { id: "pt5", f: "Was verlangt der Operator „Erläutern“?",
        o: ["In ganzen Sätzen erklären, mit Zusammenhang, Begründung oder Beispiel.", "Ein Stichwort nennen.", "Eine Zahl ausrechnen.", "Ein Diagramm zeichnen."], r: [0], w: "Nur ein Stichwort gibt bei „Erläutern“ höchstens die Hälfte." }
    ]
  });

  /* Kurzfassung des Themas für Suche und Anzeige */
  T.forEach(t => { t.anzahl = (t.quiz || []).length; });

  root.AP2_THEMEN = T;
  if (typeof module === "object" && module.exports) module.exports = T;
})(typeof window !== "undefined" ? window : globalThis);
