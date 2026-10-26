/* ============================================================================
   gen/code-daten-plus.js — weitere Programmieraufgaben (Stufe 4 und 5)
   ----------------------------------------------------------------------------
   Ergänzt window.AP2_CODE_AUFGABEN (gen/code-daten.js), Format wie dort.
     Stufe 4: switch, eigene kleine Klassen, Map
     Stufe 5: „Finde den Fehler“ — die Vorlage enthält genau einen
              semantischen Fehler; die Tests zeigen, was herauskommen soll.
   Eigene Aufgaben im Stil von GA2. tests/code-plus.test.js prüft: Lösung
   besteht alle Tests; bei Stufe 5 scheitert die fehlerhafte Vorlage.
   ========================================================================== */
"use strict";
(function (root) {
  const SPEZ = "Код можно писать прямо в заготовке: метод задания и, если нужно, свой класс рядом с ним.";
  const NEU = [
    /* ------------------------------------------------------------ Stufe 4 · switch */
    {
      id: "wochentag", titel: "switch: название дня недели", stufe: 4,
      kontext: "Eine Kalender-App speichert Wochentage als Zahl: 1 = Montag … 7 = Sonntag.",
      aufgabe: "Entwickeln Sie eine Methode wochentag, die zur Zahl den Namen des Tages zurückgibt. Verwenden Sie switch. Für ungültige Zahlen gibt die Methode \"ungültig\" zurück.",
      erklaerungRu: ["switch (nr) { case 1: return \"Montag\"; … }", "После return break не нужен: метод уже закончился.", "default: return \"ungültig\"; — для всех остальных чисел."],
      klassen: [], signatur: "String wochentag(int nr)",
      vorlage: "String wochentag(int nr) {\n    switch (nr) {\n        // Ihr Code\n    }\n}\n",
      tests: [
        { eingabe: [1], erwartet: "Montag" }, { eingabe: [5], erwartet: "Freitag" },
        { eingabe: [7], erwartet: "Sonntag", verdeckt: true, fall: "последнее значение" },
        { eingabe: [0], erwartet: "ungültig", verdeckt: true, fall: "ноль" },
        { eingabe: [8], erwartet: "ungültig", verdeckt: true, fall: "больше 7" }
      ],
      hinweis: "Не забудь default — иначе для 0 и 8 метод закончится без return (компилятор не пропустит).",
      loesung: "String wochentag(int nr) {\n    switch (nr) {\n        case 1: return \"Montag\";\n        case 2: return \"Dienstag\";\n        case 3: return \"Mittwoch\";\n        case 4: return \"Donnerstag\";\n        case 5: return \"Freitag\";\n        case 6: return \"Samstag\";\n        case 7: return \"Sonntag\";\n        default: return \"ungültig\";\n    }\n}\n",
      begriffe: [["der Wochentag", "день недели"], ["ungültig", "недопустимый"], ["die Fallunterscheidung", "ветвление по значениям (switch)"]]
    },
    {
      id: "versandkosten", titel: "switch по строке: стоимость доставки", stufe: 4,
      kontext: "Ein Onlineshop berechnet die Versandkosten nach der Zone: \"DE\" 4,99 €, \"EU\" 9,99 €, \"WELT\" 19,99 €. Bei Bestellungen ab 50 € ist der Versand innerhalb Deutschlands kostenlos.",
      aufgabe: "Entwickeln Sie eine Methode versandkosten, die für Zone und Bestellwert die Versandkosten zurückgibt. Für eine unbekannte Zone gibt sie -1 zurück.",
      erklaerungRu: ["switch (zone) работает со строками: case \"DE\": …", "Внутри case \"DE\" сначала проверь сумму заказа (if (wert >= 50) return 0.0;).", "default: return -1;"],
      klassen: [], signatur: "double versandkosten(String zone, double wert)",
      vorlage: "double versandkosten(String zone, double wert) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: ["DE", 20], erwartet: 4.99 }, { eingabe: ["EU", 80], erwartet: 9.99 },
        { eingabe: ["DE", 50], erwartet: 0, verdeckt: true, fall: "ровно 50 € — бесплатно" },
        { eingabe: ["WELT", 100], erwartet: 19.99, verdeckt: true, fall: "за границей бесплатной доставки нет" },
        { eingabe: ["MARS", 10], erwartet: -1, verdeckt: true, fall: "неизвестная зона" }
      ],
      hinweis: "«ab 50 €» включает 50: условие wert >= 50.",
      loesung: "double versandkosten(String zone, double wert) {\n    switch (zone) {\n        case \"DE\":\n            if (wert >= 50) {\n                return 0.0;\n            }\n            return 4.99;\n        case \"EU\":\n            return 9.99;\n        case \"WELT\":\n            return 19.99;\n        default:\n            return -1;\n    }\n}\n",
      begriffe: [["die Versandkosten", "стоимость доставки"], ["kostenlos", "бесплатно"], ["der Bestellwert", "сумма заказа"]]
    },
    {
      id: "rabattgruppe", titel: "switch по символу: группы с одинаковым результатом", stufe: 4,
      kontext: "Kunden haben eine Rabattgruppe als Buchstaben. Groß- und Kleinbuchstaben bedeuten dasselbe: A/a = 15 %, B/b = 10 %, C/c = 5 %. Alle anderen Gruppen erhalten keinen Rabatt.",
      aufgabe: "Entwickeln Sie eine Methode endpreis, die den Preis nach Abzug des Rabatts zurückgibt. Nutzen Sie switch mit mehreren case-Marken für denselben Zweig.",
      erklaerungRu: ["case 'A': case 'a': rabatt = 15; break; — две метки, один код.", "break обязателен: без него выполнение «провалится» в следующий case.", "endpreis = preis - preis * rabatt / 100.0"],
      klassen: [], signatur: "double endpreis(double preis, char gruppe)",
      vorlage: "double endpreis(double preis, char gruppe) {\n    int rabatt = 0;\n    // Ihr Code\n    return preis;\n}\n",
      tests: [
        { eingabe: [100, "A"], erwartet: 85 }, { eingabe: [200, "c"], erwartet: 190 },
        { eingabe: [50, "b"], erwartet: 45, verdeckt: true, fall: "маленькая буква" },
        { eingabe: [80, "X"], erwartet: 80, verdeckt: true, fall: "нет скидки" }
      ],
      hinweis: "Деление на 100.0 (а не 100), иначе при целых числах дробная часть пропадёт.",
      loesung: "double endpreis(double preis, char gruppe) {\n    int rabatt = 0;\n    switch (gruppe) {\n        case 'A': case 'a': rabatt = 15; break;\n        case 'B': case 'b': rabatt = 10; break;\n        case 'C': case 'c': rabatt = 5; break;\n        default: rabatt = 0;\n    }\n    return preis - preis * rabatt / 100.0;\n}\n",
      begriffe: [["der Rabatt", "скидка"], ["der Endpreis", "итоговая цена"], ["der Großbuchstabe", "заглавная буква"]]
    },
    /* ------------------------------------------------------------ Stufe 4 · eigene Klassen */
    {
      id: "klasse-konto", titel: "Свой класс: банковский счёт", stufe: 4,
      kontext: "Ein Konto hat einen Kontostand (Startwert 0). Einzahlungen erhöhen ihn. Eine Auszahlung ist nur möglich, wenn genug Geld da ist; sonst wird sie abgelehnt.",
      aufgabe: "Schreiben Sie eine Klasse Konto mit dem Attribut kontostand, den Methoden einzahlen(double betrag), boolean auszahlen(double betrag) und double getKontostand(). Entwickeln Sie dann die Methode buchen: Positive Werte sind Einzahlungen, negative Auszahlungen. Sie gibt den Kontostand am Ende zurück.",
      erklaerungRu: ["class Konto { private double kontostand; … } — поле, начальное значение 0.0.", "auszahlen: если betrag > kontostand → return false; иначе уменьшить и return true.", "В buchen: Konto k = new Konto(); для каждого значения: if (b >= 0) k.einzahlen(b); else k.auszahlen(-b);", "В конце return k.getKontostand();"],
      klassen: [], signatur: "double buchen(double[] buchungen)",
      vorlage: "class Konto {\n    private double kontostand;\n\n    // Methoden\n}\n\ndouble buchen(double[] buchungen) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[100, -30, 50]], erwartet: 120 },
        { eingabe: [[100, -200, -50]], erwartet: 50, fall: "слишком большая выплата отклоняется" },
        { eingabe: [[]], erwartet: 0, verdeckt: true, fall: "нет операций" },
        { eingabe: [[-10]], erwartet: 0, verdeckt: true, fall: "выплата с пустого счёта" },
        { eingabe: [[40, -40]], erwartet: 0, verdeckt: true, fall: "ровно весь остаток" }
      ],
      hinweis: "Отрицательное значение — выплата суммы -b (минус на минус даёт плюс).",
      loesung: "class Konto {\n    private double kontostand;\n\n    void einzahlen(double betrag) {\n        kontostand = kontostand + betrag;\n    }\n\n    boolean auszahlen(double betrag) {\n        if (betrag > kontostand) {\n            return false;\n        }\n        kontostand = kontostand - betrag;\n        return true;\n    }\n\n    double getKontostand() {\n        return kontostand;\n    }\n}\n\ndouble buchen(double[] buchungen) {\n    Konto k = new Konto();\n    for (double b : buchungen) {\n        if (b >= 0) {\n            k.einzahlen(b);\n        } else {\n            k.auszahlen(-b);\n        }\n    }\n    return k.getKontostand();\n}\n",
      begriffe: [["das Konto", "счёт"], ["der Kontostand", "остаток на счёте"], ["einzahlen / auszahlen", "внести / снять"], ["das Attribut", "поле класса"], ["ablehnen", "отклонить"]]
    },
    {
      id: "klasse-position", titel: "Свой класс с конструктором: позиция заказа", stufe: 4,
      kontext: "Eine Bestellung besteht aus Positionen. Jede Position hat eine Menge und einen Einzelpreis. Ab einer Menge von 10 Stück gibt es 5 % Mengenrabatt auf die Position.",
      aufgabe: "Schreiben Sie eine Klasse Position mit Konstruktor Position(int menge, double einzelpreis) und der Methode double gesamt(). Entwickeln Sie die Methode bestellwert, die aus den Arrays Positionen erzeugt und die Summe aller Positionen zurückgibt.",
      erklaerungRu: ["Конструктор: Position(int menge, double einzelpreis) { this.menge = menge; this.einzelpreis = einzelpreis; }", "this.menge — поле, menge — параметр: без this поле останется 0.", "gesamt(): double s = menge * einzelpreis; if (menge >= 10) s = s * 0.95; return s;", "bestellwert: в цикле new Position(mengen[i], preise[i]) и сумма gesamt()."],
      klassen: [], signatur: "double bestellwert(int[] mengen, double[] preise)",
      vorlage: "class Position {\n    private int menge;\n    private double einzelpreis;\n\n    // Konstruktor und Methode gesamt()\n}\n\ndouble bestellwert(int[] mengen, double[] preise) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[2, 1], [5, 20]], erwartet: 30 },
        { eingabe: [[10], [3]], erwartet: 28.5, fall: "ровно 10 штук — скидка" },
        { eingabe: [[], []], erwartet: 0, verdeckt: true, fall: "пустой заказ" },
        { eingabe: [[9, 12], [1, 1]], erwartet: 20.4, verdeckt: true, fall: "9 без скидки, 12 со скидкой" }
      ],
      hinweis: "Скидка относится к одной позиции, а не ко всему заказу.",
      loesung: "class Position {\n    private int menge;\n    private double einzelpreis;\n\n    Position(int menge, double einzelpreis) {\n        this.menge = menge;\n        this.einzelpreis = einzelpreis;\n    }\n\n    double gesamt() {\n        double summe = menge * einzelpreis;\n        if (menge >= 10) {\n            summe = summe * 0.95;\n        }\n        return summe;\n    }\n}\n\ndouble bestellwert(int[] mengen, double[] preise) {\n    double summe = 0.0;\n    for (int i = 0; i < mengen.length; i++) {\n        Position p = new Position(mengen[i], preise[i]);\n        summe = summe + p.gesamt();\n    }\n    return summe;\n}\n",
      begriffe: [["die Position", "позиция (строка заказа)"], ["der Einzelpreis", "цена за штуку"], ["der Konstruktor", "конструктор"], ["der Mengenrabatt", "скидка за количество"]]
    },
    {
      id: "klasse-messreihe", titel: "Свой класс: серия измерений", stufe: 4,
      kontext: "Eine Messreihe sammelt Temperaturwerte. Sie merkt sich nur Anzahl, Summe, Minimum und Maximum — nicht alle Werte.",
      aufgabe: "Schreiben Sie eine Klasse Messreihe mit der Methode void hinzufuegen(double wert) und den Methoden double durchschnitt() und double spanne() (Maximum minus Minimum). Entwickeln Sie die Methode auswerten: Sie gibt durchschnitt + spanne zurück; für ein leeres Array 0.",
      erklaerungRu: ["Поля: int anzahl; double summe; double min; double max;", "В hinzufuegen: если anzahl == 0 — min и max равны первому значению; иначе сравнить.", "durchschnitt: summe / anzahl; spanne: max - min.", "Пустой массив проверь в auswerten до вызова методов."],
      klassen: [], signatur: "double auswerten(double[] werte)",
      vorlage: "class Messreihe {\n    private int anzahl;\n    private double summe;\n    private double min;\n    private double max;\n\n    // Methoden\n}\n\ndouble auswerten(double[] werte) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[10, 20, 30]], erwartet: 40 },
        { eingabe: [[5]], erwartet: 5, fall: "одно значение: спан 0" },
        { eingabe: [[]], erwartet: 0, verdeckt: true, fall: "пустой массив" },
        { eingabe: [[-4, -2, -6]], erwartet: 0, verdeckt: true, fall: "только отрицательные: min/max не с 0" }
      ],
      hinweis: "min и max нельзя начинать с 0 — для отрицательных значений max останется 0.",
      loesung: "class Messreihe {\n    private int anzahl;\n    private double summe;\n    private double min;\n    private double max;\n\n    void hinzufuegen(double wert) {\n        if (anzahl == 0 || wert < min) {\n            min = wert;\n        }\n        if (anzahl == 0 || wert > max) {\n            max = wert;\n        }\n        summe = summe + wert;\n        anzahl++;\n    }\n\n    double durchschnitt() {\n        return summe / anzahl;\n    }\n\n    double spanne() {\n        return max - min;\n    }\n}\n\ndouble auswerten(double[] werte) {\n    if (werte.length == 0) {\n        return 0.0;\n    }\n    Messreihe m = new Messreihe();\n    for (double w : werte) {\n        m.hinzufuegen(w);\n    }\n    return m.durchschnitt() + m.spanne();\n}\n",
      begriffe: [["die Messreihe", "серия измерений"], ["der Durchschnitt", "среднее значение"], ["die Spanne", "размах (max − min)"], ["hinzufügen", "добавить"]]
    },
    /* ------------------------------------------------------------ Stufe 4 · Map */
    {
      id: "map-woerter", titel: "Map: сколько раз встречается слово", stufe: 4,
      kontext: "Ein Support-Team möchte wissen, welche Begriffe in Tickets oft vorkommen. Die Wörter eines Tickets stehen in einem Array, schon kleingeschrieben.",
      aufgabe: "Entwickeln Sie eine Methode zaehlen, die eine Map zurückgibt: Schlüssel ist das Wort, Wert ist die Anzahl.",
      erklaerungRu: ["Map<String, Integer> m = new HashMap<>();", "Для каждого слова: m.put(w, m.getOrDefault(w, 0) + 1);", "Вернуть m."],
      klassen: [], signatur: "Map<String, Integer> zaehlen(String[] woerter)",
      vorlage: "Map<String, Integer> zaehlen(String[] woerter) {\n    Map<String, Integer> anzahl = new HashMap<>();\n    // Ihr Code\n    return anzahl;\n}\n",
      tests: [
        { eingabe: [["drucker", "netz", "drucker"]], erwartet: { drucker: 2, netz: 1 } },
        { eingabe: [["vpn"]], erwartet: { vpn: 1 } },
        { eingabe: [[]], erwartet: {}, verdeckt: true, fall: "нет слов" },
        { eingabe: [["a", "a", "a", "b"]], erwartet: { a: 3, b: 1 }, verdeckt: true, fall: "много повторов" }
      ],
      hinweis: "getOrDefault(w, 0) даёт 0 для нового слова — так не нужен отдельный if.",
      loesung: "Map<String, Integer> zaehlen(String[] woerter) {\n    Map<String, Integer> anzahl = new HashMap<>();\n    for (String w : woerter) {\n        anzahl.put(w, anzahl.getOrDefault(w, 0) + 1);\n    }\n    return anzahl;\n}\n",
      begriffe: [["die Map", "словарь «ключ → значение»"], ["der Schlüssel", "ключ"], ["der Wert", "значение"], ["vorkommen", "встречаться"]]
    },
    {
      id: "map-umsatz", titel: "Map: оборот по клиентам", stufe: 4,
      kontext: "In einem Array stehen die Kundennamen von Rechnungen, im zweiten Array an derselben Stelle der Rechnungsbetrag.",
      aufgabe: "Entwickeln Sie eine Methode umsatzJeKunde, die eine Map Kunde → Summe aller Rechnungsbeträge zurückgibt.",
      erklaerungRu: ["Map<String, Double> m = new HashMap<>();", "Для каждого i: m.put(kunden[i], m.getOrDefault(kunden[i], 0.0) + betraege[i]);", "0.0, а не 0: значения Double."],
      klassen: [], signatur: "Map<String, Double> umsatzJeKunde(String[] kunden, double[] betraege)",
      vorlage: "Map<String, Double> umsatzJeKunde(String[] kunden, double[] betraege) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [["Kaya", "Brandt", "Kaya"], [100, 50, 25.5]], erwartet: { Kaya: 125.5, Brandt: 50 } },
        { eingabe: [[], []], erwartet: {}, verdeckt: true, fall: "нет счетов" },
        { eingabe: [["A"], [0]], erwartet: { A: 0 }, verdeckt: true, fall: "счёт на 0 €" }
      ],
      hinweis: "Индекс i общий для двух массивов: kunden[i] и betraege[i] — один счёт.",
      loesung: "Map<String, Double> umsatzJeKunde(String[] kunden, double[] betraege) {\n    Map<String, Double> umsatz = new HashMap<>();\n    for (int i = 0; i < kunden.length; i++) {\n        umsatz.put(kunden[i], umsatz.getOrDefault(kunden[i], 0.0) + betraege[i]);\n    }\n    return umsatz;\n}\n",
      begriffe: [["der Umsatz", "оборот, выручка"], ["die Rechnung", "счёт"], ["der Betrag", "сумма"]]
    },
    {
      id: "map-lager", titel: "Map как вход: что нельзя отгрузить", stufe: 4,
      kontext: "Der Lagerbestand liegt als Map Artikel → Stückzahl vor. Jede Bestellung ist ein Artikelname und bestellt genau ein Stück. Ist der Artikel nicht (mehr) vorrätig, kann das Stück nicht geliefert werden.",
      aufgabe: "Entwickeln Sie eine Methode fehlmenge, die die Bestellungen der Reihe nach abarbeitet, den Bestand verringert und die Anzahl der nicht lieferbaren Stücke zurückgibt.",
      erklaerungRu: ["int fehlt = 0; для каждой позиции заказа:", "int vorrat = bestand.getOrDefault(a, 0);", "если vorrat > 0 → bestand.put(a, vorrat - 1); иначе fehlt++;", "Неизвестный артикул — тоже недостача."],
      klassen: [], signatur: "int fehlmenge(Map<String, Integer> bestand, String[] bestellungen)",
      vorlage: "int fehlmenge(Map<String, Integer> bestand, String[] bestellungen) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [{ Maus: 2, Kabel: 1 }, ["Maus", "Kabel", "Maus"]], erwartet: 0 },
        { eingabe: [{ Maus: 1 }, ["Maus", "Maus", "Maus"]], erwartet: 2 },
        { eingabe: [{}, ["Monitor"]], erwartet: 1, verdeckt: true, fall: "артикула нет в Map" },
        { eingabe: [{ Kabel: 0 }, ["Kabel"]], erwartet: 1, verdeckt: true, fall: "остаток 0" },
        { eingabe: [{ Maus: 3 }, []], erwartet: 0, verdeckt: true, fall: "нет заказов" }
      ],
      hinweis: "get() для отсутствующего ключа даёт null — поэтому getOrDefault(a, 0).",
      loesung: "int fehlmenge(Map<String, Integer> bestand, String[] bestellungen) {\n    int fehlt = 0;\n    for (String a : bestellungen) {\n        int vorrat = bestand.getOrDefault(a, 0);\n        if (vorrat > 0) {\n            bestand.put(a, vorrat - 1);\n        } else {\n            fehlt++;\n        }\n    }\n    return fehlt;\n}\n",
      begriffe: [["der Lagerbestand", "складской остаток"], ["vorrätig", "в наличии"], ["lieferbar", "можно поставить"], ["abarbeiten", "обработать по очереди"]]
    },
    {
      id: "map-haeufigster", titel: "Map: самый частый товар", stufe: 4,
      kontext: "Ein Café speichert jede Bestellung als Namen des Getränks.",
      aufgabe: "Entwickeln Sie eine Methode beliebtestes, die das am häufigsten bestellte Getränk zurückgibt. Bei Gleichstand gewinnt das alphabetisch erste. Gibt es keine Bestellung, wird \"\" zurückgegeben.",
      erklaerungRu: ["Сначала посчитай всё в Map (как в задаче «сколько раз встречается слово»).", "Потом пройди по keySet() и найди наибольшее значение.", "При равенстве: k.compareTo(bestes) < 0 — k раньше по алфавиту.", "Начальное значение: String bestes = \"\"; int max = 0;"],
      klassen: [], signatur: "String beliebtestes(String[] bestellungen)",
      vorlage: "String beliebtestes(String[] bestellungen) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [["Tee", "Kaffee", "Tee"]], erwartet: "Tee" },
        { eingabe: [["Saft", "Kakao", "Saft", "Kakao"]], erwartet: "Kakao", fall: "равенство → по алфавиту" },
        { eingabe: [[]], erwartet: "", verdeckt: true, fall: "нет заказов" },
        { eingabe: [["Wasser"]], erwartet: "Wasser", verdeckt: true, fall: "один заказ" }
      ],
      hinweis: "Порядок ключей в HashMap не гарантирован — поэтому правило «по алфавиту» решай через compareTo, а не через порядок обхода.",
      loesung: "String beliebtestes(String[] bestellungen) {\n    Map<String, Integer> anzahl = new HashMap<>();\n    for (String b : bestellungen) {\n        anzahl.put(b, anzahl.getOrDefault(b, 0) + 1);\n    }\n    String bestes = \"\";\n    int max = 0;\n    for (String k : anzahl.keySet()) {\n        int n = anzahl.get(k);\n        if (n > max || (n == max && k.compareTo(bestes) < 0)) {\n            max = n;\n            bestes = k;\n        }\n    }\n    return bestes;\n}\n",
      begriffe: [["beliebt", "популярный"], ["der Gleichstand", "равенство (ничья)"], ["alphabetisch", "по алфавиту"]]
    },
    /* ------------------------------------------------------------ Stufe 5 · Finde den Fehler */
    {
      id: "fehler-maximum", titel: "Найди ошибку: максимум", stufe: 5,
      kontext: "Die Methode soll die höchste Temperatur einer Messreihe zurückgeben. Im Winter sind alle Werte negativ.",
      aufgabe: "Die Methode enthält einen semantischen Fehler. Finden und korrigieren Sie ihn. Das Array enthält mindestens einen Wert.",
      erklaerungRu: ["Проверь начальное значение max.", "Если все значения отрицательные, 0 больше любого из них — неверно.", "Начни с первого элемента: int max = werte[0];"],
      klassen: [], signatur: "int maximum(int[] werte)",
      vorlage: "int maximum(int[] werte) {\n    int max = 0;\n    for (int i = 0; i < werte.length; i++) {\n        if (werte[i] > max) {\n            max = werte[i];\n        }\n    }\n    return max;\n}\n",
      tests: [
        { eingabe: [[3, 8, 5]], erwartet: 8 },
        { eingabe: [[-5, -2, -9]], erwartet: -2 },
        { eingabe: [[-1]], erwartet: -1, verdeckt: true, fall: "одно отрицательное значение" }
      ],
      hinweis: "Ошибка в одной строке — инициализация.",
      loesung: "int maximum(int[] werte) {\n    int max = werte[0];\n    for (int i = 0; i < werte.length; i++) {\n        if (werte[i] > max) {\n            max = werte[i];\n        }\n    }\n    return max;\n}\n",
      begriffe: [["der semantische Fehler", "смысловая ошибка"], ["die Initialisierung", "начальное значение"]]
    },
    {
      id: "fehler-durchschnitt", titel: "Найди ошибку: средняя оценка", stufe: 5,
      kontext: "Die Methode soll den Durchschnitt von Noten als Kommazahl zurückgeben.",
      aufgabe: "Finden und korrigieren Sie den Fehler. Das Array ist nicht leer.",
      erklaerungRu: ["Сравни ожидаемый и полученный результат: где пропала дробная часть?", "int / int в Java — целое деление.", "Приведи к double: (double) summe / noten.length"],
      klassen: [], signatur: "double durchschnitt(int[] noten)",
      vorlage: "double durchschnitt(int[] noten) {\n    int summe = 0;\n    for (int n : noten) {\n        summe += n;\n    }\n    return summe / noten.length;\n}\n",
      tests: [
        { eingabe: [[2, 3]], erwartet: 2.5 },
        { eingabe: [[1, 1, 2]], erwartet: 1.33 },
        { eingabe: [[4]], erwartet: 4, verdeckt: true, fall: "одна оценка" }
      ],
      hinweis: "Ошибка в строке return.",
      loesung: "double durchschnitt(int[] noten) {\n    int summe = 0;\n    for (int n : noten) {\n        summe += n;\n    }\n    return (double) summe / noten.length;\n}\n",
      begriffe: [["die Ganzzahldivision", "целочисленное деление"], ["die Typumwandlung (Cast)", "приведение типа"]]
    },
    {
      id: "fehler-schleife", titel: "Найди ошибку: подсчёт заказов", stufe: 5,
      kontext: "Die Methode soll zählen, wie viele Bestellungen über 100 € liegen.",
      aufgabe: "Finden und korrigieren Sie den Fehler in der Schleife.",
      erklaerungRu: ["Проверь, с какого индекса начинается цикл.", "Первый элемент массива — индекс 0.", "Первый заказ сейчас пропускается."],
      klassen: [], signatur: "int grosseBestellungen(double[] betraege)",
      vorlage: "int grosseBestellungen(double[] betraege) {\n    int anzahl = 0;\n    for (int i = 1; i < betraege.length; i++) {\n        if (betraege[i] > 100) {\n            anzahl++;\n        }\n    }\n    return anzahl;\n}\n",
      tests: [
        { eingabe: [[150, 20, 300]], erwartet: 2 },
        { eingabe: [[50, 120]], erwartet: 1 },
        { eingabe: [[]], erwartet: 0, verdeckt: true, fall: "пусто" },
        { eingabe: [[101]], erwartet: 1, verdeckt: true, fall: "один большой заказ" }
      ],
      hinweis: "Ошибка в заголовке for.",
      loesung: "int grosseBestellungen(double[] betraege) {\n    int anzahl = 0;\n    for (int i = 0; i < betraege.length; i++) {\n        if (betraege[i] > 100) {\n            anzahl++;\n        }\n    }\n    return anzahl;\n}\n",
      begriffe: [["der Index", "индекс"], ["die Schleife", "цикл"]]
    },
    {
      id: "fehler-switch", titel: "Найди ошибку: switch без break", stufe: 5,
      kontext: "Die Methode berechnet die Bearbeitungszeit eines Tickets in Stunden: Priorität 1 = 4 Stunden, 2 = 8 Stunden, 3 = 24 Stunden, sonst 72 Stunden.",
      aufgabe: "Finden und korrigieren Sie den Fehler im switch.",
      erklaerungRu: ["Пройди switch для prio = 1: где выполнение останавливается?", "Без break выполнение «проваливается» в следующие case.", "После каждого присваивания нужен break;"],
      klassen: [], signatur: "int stunden(int prio)",
      vorlage: "int stunden(int prio) {\n    int h;\n    switch (prio) {\n        case 1: h = 4;\n        case 2: h = 8;\n        case 3: h = 24;\n            break;\n        default: h = 72;\n    }\n    return h;\n}\n",
      tests: [
        { eingabe: [1], erwartet: 4 }, { eingabe: [2], erwartet: 8 },
        { eingabe: [3], erwartet: 24, verdeckt: true, fall: "приоритет 3" },
        { eingabe: [9], erwartet: 72, verdeckt: true, fall: "default" }
      ],
      hinweis: "Не хватает break в двух местах.",
      loesung: "int stunden(int prio) {\n    int h;\n    switch (prio) {\n        case 1: h = 4;\n            break;\n        case 2: h = 8;\n            break;\n        case 3: h = 24;\n            break;\n        default: h = 72;\n    }\n    return h;\n}\n",
      begriffe: [["die Priorität", "приоритет"], ["durchfallen (fall-through)", "«проваливаться» в следующий case"]]
    },
    {
      id: "fehler-map", titel: "Найди ошибку: подсчёт в Map", stufe: 5,
      kontext: "Die Methode soll zählen, wie oft jeder Fehlercode in einer Logdatei vorkommt.",
      aufgabe: "Finden und korrigieren Sie den Fehler.",
      erklaerungRu: ["Что происходит, когда код встречается второй раз?", "put(k, 1) перезаписывает старое значение.", "Нужно прибавлять: put(k, getOrDefault(k, 0) + 1)."],
      klassen: [], signatur: "Map<String, Integer> codes(String[] log)",
      vorlage: "Map<String, Integer> codes(String[] log) {\n    Map<String, Integer> m = new HashMap<>();\n    for (String c : log) {\n        m.put(c, 1);\n    }\n    return m;\n}\n",
      tests: [
        { eingabe: [["E404", "E500", "E404"]], erwartet: { E404: 2, E500: 1 } },
        { eingabe: [["E1"]], erwartet: { E1: 1 } },
        { eingabe: [["X", "X", "X"]], erwartet: { X: 3 }, verdeckt: true, fall: "три раза одно и то же" }
      ],
      hinweis: "Ошибка в строке с put.",
      loesung: "Map<String, Integer> codes(String[] log) {\n    Map<String, Integer> m = new HashMap<>();\n    for (String c : log) {\n        m.put(c, m.getOrDefault(c, 0) + 1);\n    }\n    return m;\n}\n",
      begriffe: [["der Fehlercode", "код ошибки"], ["überschreiben", "перезаписать"]]
    },
    {
      id: "fehler-konstruktor", titel: "Найди ошибку: конструктор без this", stufe: 5,
      kontext: "Ein Artikel hat einen Preis. Die Methode berechnet den Preis von n Stück eines Artikels.",
      aufgabe: "Finden und korrigieren Sie den Fehler in der Klasse Artikel.",
      erklaerungRu: ["Почему getPreis() возвращает 0?", "В конструкторе preis = preis; присваивает параметр самому себе.", "Нужно this.preis = preis;"],
      klassen: [], signatur: "double kosten(double preis, int stueck)",
      vorlage: "class Artikel {\n    private double preis;\n\n    Artikel(double preis) {\n        preis = preis;\n    }\n\n    double getPreis() {\n        return preis;\n    }\n}\n\ndouble kosten(double preis, int stueck) {\n    Artikel a = new Artikel(preis);\n    return a.getPreis() * stueck;\n}\n",
      tests: [
        { eingabe: [2.5, 4], erwartet: 10 },
        { eingabe: [19.99, 1], erwartet: 19.99 },
        { eingabe: [5, 0], erwartet: 0, verdeckt: true, fall: "0 штук" }
      ],
      hinweis: "Ошибка в теле конструктора.",
      loesung: "class Artikel {\n    private double preis;\n\n    Artikel(double preis) {\n        this.preis = preis;\n    }\n\n    double getPreis() {\n        return preis;\n    }\n}\n\ndouble kosten(double preis, int stueck) {\n    Artikel a = new Artikel(preis);\n    return a.getPreis() * stueck;\n}\n",
      begriffe: [["der Konstruktor", "конструктор"], ["this", "ссылка на текущий объект"], ["der Parameter", "параметр"]]
    }
  ];
  NEU.forEach(a => { a.spez = SPEZ; });
  const liste = Array.isArray(root.AP2_CODE_AUFGABEN) ? root.AP2_CODE_AUFGABEN : (root.AP2_CODE_AUFGABEN = []);
  NEU.forEach(a => { if (!liste.some(x => x.id === a.id)) liste.push(a); });
  if (typeof module === "object" && module.exports) module.exports = NEU;
})(typeof window !== "undefined" ? window : globalThis);
