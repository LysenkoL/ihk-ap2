/* ============================================================================
   gen/code-daten.js — 10 eigene Programmieraufgaben im Stil von GA2
   ----------------------------------------------------------------------------
   Autorenaufgaben (keine Kopien von IHK-Prüfungen). Jede Aufgabe wird von
   gen/code-lauf.js wirklich ausgeführt: sichtbare Tests (Beispiele) und
   verdeckte Grenzfälle (leere Liste, negative Zahlen, gleiche Werte …).

   Felder: id, titel (ru), stufe 1–3, kontext/aufgabe (de), erklaerungRu,
   klassen [{name, beschreibung, felder:{feld:"Typ"}, methoden:[[Signatur, Beschreibung]]}],
   signatur, vorlage, tests [{eingabe:[…], erwartet, nachher:[…], verdeckt, fall}],
   hinweis (ru), loesung, begriffe [[de, ru]].
   ========================================================================== */
"use strict";
(function (root) {
  const M = (sensor, uhrzeit, wert) => ({ sensor, uhrzeit, wert });
  const A = (nummer, kunde, erledigt) => ({ nummer, kunde, erledigt });
  const P = (personalnummer, name, abteilung) => ({ personalnummer, name, abteilung });
  const B = (produktnummer, sterne) => ({ produktnummer, sterne });
  const R = (artikelnummer, bezeichnung, bestand, mindestbestand) => ({ artikelnummer, bezeichnung, bestand, mindestbestand });
  const K = (belegnummer, datum, betrag) => ({ belegnummer, datum, betrag });

  const AUFGABEN = [
    /* ------------------------------------------------------------ Stufe 1 */
    {
      id: "summe-zugaenge",
      titel: "Сумма положительных значений",
      stufe: 1,
      kontext: "Ein Lagerprogramm speichert die Bestandsänderungen eines Tages in einem Array. Positive Werte sind Zugänge, negative Werte sind Abgänge.",
      aufgabe: "Entwickeln Sie eine Methode summeZugaenge, die die Summe aller positiven Werte des Arrays zurückgibt. Ist das Array leer, gibt die Methode 0 zurück.",
      erklaerungRu: [
        "Заведи переменную для суммы и сразу задай ей 0: int summe = 0;",
        "Пройди циклом по всем элементам массива: индексы от 0 до aenderungen.length - 1.",
        "Если элемент больше 0 — прибавь его к сумме. Отрицательные (списания) пропускай.",
        "После цикла верни сумму: return summe; Для пустого массива цикл не выполнится ни разу — вернётся 0."
      ],
      klassen: [],
      signatur: "int summeZugaenge(int[] aenderungen)",
      vorlage: "int summeZugaenge(int[] aenderungen) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[5, -3, 10, -1]], erwartet: 15 },
        { eingabe: [[7]], erwartet: 7 },
        { eingabe: [[]], erwartet: 0, verdeckt: true, fall: "пустой массив" },
        { eingabe: [[-4, -2, -9]], erwartet: 0, verdeckt: true, fall: "только отрицательные значения" },
        { eingabe: [[0, 3, 0, 3]], erwartet: 6, verdeckt: true, fall: "нули и одинаковые значения" }
      ],
      hinweis: "Условие внутри цикла: if (aenderungen[i] > 0) { summe += aenderungen[i]; }. return summe; пиши после цикла, а не внутри него — иначе метод закончится на первом элементе.",
      loesung: "int summeZugaenge(int[] aenderungen) {\n    int summe = 0;\n    for (int i = 0; i < aenderungen.length; i++) {\n        if (aenderungen[i] > 0) {\n            summe += aenderungen[i];\n        }\n    }\n    return summe;\n}\n",
      begriffe: [["die Summe", "сумма"], ["positiv", "положительный"], ["der Zugang", "поступление на склад"], ["der Abgang", "списание со склада"], ["zurückgeben", "возвращать (return)"], ["das Array", "массив"]]
    },
    {
      id: "offene-auftraege",
      titel: "Сколько заказов ещё не выполнено",
      stufe: 1,
      kontext: "Eine Werkstatt verwaltet ihre Aufträge in einer Liste. Jeder Auftrag ist entweder erledigt oder noch offen.",
      aufgabe: "Entwickeln Sie eine Methode zaehleOffene, die die Anzahl der Aufträge zurückgibt, die noch nicht erledigt sind.",
      erklaerungRu: [
        "Заведи счётчик: int anzahl = 0;",
        "Пройди по всем заказам списка (удобно через for-each: for (Auftrag a : auftraege)).",
        "Если заказ НЕ выполнен — увеличь счётчик. «Не» в Java — восклицательный знак: !a.isErledigt().",
        "После цикла верни счётчик."
      ],
      klassen: [{
        name: "Auftrag", beschreibung: "Ein Auftrag der Werkstatt.",
        felder: { nummer: "int", kunde: "String", erledigt: "boolean" },
        methoden: [["getNummer() : int", "Gibt die Auftragsnummer zurück."], ["getKunde() : String", "Gibt den Namen des Kunden zurück."], ["isErledigt() : boolean", "Gibt true zurück, wenn der Auftrag erledigt ist."]]
      }],
      signatur: "int zaehleOffene(List<Auftrag> auftraege)",
      vorlage: "int zaehleOffene(List<Auftrag> auftraege) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[A(1, "Weber", true), A(2, "Kaya", false), A(3, "Roth", false)]], erwartet: 2 },
        { eingabe: [[A(4, "Lenz", true)]], erwartet: 0 },
        { eingabe: [[]], erwartet: 0, verdeckt: true, fall: "пустой список" },
        { eingabe: [[A(5, "Abel", false), A(6, "Abel", false), A(7, "Berg", false)]], erwartet: 3, verdeckt: true, fall: "все заказы открыты" },
        { eingabe: [[A(8, "Ilic", true), A(9, "Ilic", true)]], erwartet: 0, verdeckt: true, fall: "все заказы выполнены" }
      ],
      hinweis: "for (Auftrag a : auftraege) { if (!a.isErledigt()) { anzahl++; } } — а после цикла return anzahl;",
      loesung: "int zaehleOffene(List<Auftrag> auftraege) {\n    int anzahl = 0;\n    for (Auftrag a : auftraege) {\n        if (!a.isErledigt()) {\n            anzahl++;\n        }\n    }\n    return anzahl;\n}\n",
      begriffe: [["der Auftrag", "заказ"], ["erledigt", "выполнен"], ["offen", "открыт, ещё не выполнен"], ["die Anzahl", "количество"], ["die Werkstatt", "мастерская"]]
    },
    {
      id: "index-name",
      titel: "Позиция сотрудника по имени",
      stufe: 1,
      kontext: "In einer Zeiterfassung stehen alle Mitarbeitenden in einer Liste. Für eine Auswertung wird die Position einer Person in der Liste gesucht.",
      aufgabe: "Entwickeln Sie eine Methode findeIndex, die den Index des ersten Mitarbeiters mit dem übergebenen Namen zurückgibt. Wird kein passender Mitarbeiter gefunden, gibt die Methode -1 zurück.",
      erklaerungRu: [
        "Нужен номер позиции, поэтому цикл с индексом: for (int i = 0; i < liste.size(); i++).",
        "Достань сотрудника: liste.get(i), его имя — getName().",
        "Строки сравнивают через equals, а не через ==: liste.get(i).getName().equals(name).",
        "Как только нашла — сразу return i; (так вернётся первый подходящий).",
        "Если цикл закончился и ничего не нашлось — return -1; после цикла."
      ],
      klassen: [{
        name: "Mitarbeiter", beschreibung: "Eine Person in der Zeiterfassung.",
        felder: { personalnummer: "int", name: "String", abteilung: "String" },
        methoden: [["getPersonalnummer() : int", "Gibt die Personalnummer zurück."], ["getName() : String", "Gibt den Nachnamen zurück."], ["getAbteilung() : String", "Gibt die Abteilung zurück."]]
      }],
      signatur: "int findeIndex(List<Mitarbeiter> liste, String name)",
      vorlage: "int findeIndex(List<Mitarbeiter> liste, String name) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[P(11, "Kraus", "Vertrieb"), P(12, "Yilmaz", "IT"), P(13, "Becker", "Lager")], "Yilmaz"], erwartet: 1 },
        { eingabe: [[P(11, "Kraus", "Vertrieb"), P(12, "Yilmaz", "IT")], "Kraus"], erwartet: 0 },
        { eingabe: [[P(11, "Kraus", "Vertrieb"), P(12, "Yilmaz", "IT")], "Schulz"], erwartet: -1, verdeckt: true, fall: "имени нет в списке" },
        { eingabe: [[], "Kraus"], erwartet: -1, verdeckt: true, fall: "пустой список" },
        { eingabe: [[P(21, "Becker", "IT"), P(22, "Neumann", "IT"), P(23, "Becker", "Lager")], "Becker"], erwartet: 0, verdeckt: true, fall: "имя встречается дважды — нужен первый" },
        { eingabe: [[P(21, "Becker", "IT")], "becker"], erwartet: -1, verdeckt: true, fall: "другой регистр букв: equals различает большие и маленькие" }
      ],
      hinweis: "if (liste.get(i).getName().equals(name)) { return i; } — внутри цикла. return -1; — после цикла, иначе метод сдастся уже на первом элементе.",
      loesung: "int findeIndex(List<Mitarbeiter> liste, String name) {\n    for (int i = 0; i < liste.size(); i++) {\n        if (liste.get(i).getName().equals(name)) {\n            return i;\n        }\n    }\n    return -1;\n}\n",
      begriffe: [["der Index", "индекс, номер позиции"], ["die lineare Suche", "линейный поиск"], ["übergeben", "передавать (в метод)"], ["passend", "подходящий"], ["die Zeiterfassung", "учёт рабочего времени"]]
    },

    /* ------------------------------------------------------------ Stufe 2 */
    {
      id: "hoechste-messung",
      titel: "Измерение с наибольшим значением",
      stufe: 2,
      kontext: "Ein Sensornetz in einem Gewächshaus liefert Messungen der Temperatur. Die Werte können auch negativ sein, zum Beispiel bei Frost in der Nacht.",
      aufgabe: "Entwickeln Sie eine Methode hoechsteMessung, die die Messung mit dem größten Wert zurückgibt. Haben mehrere Messungen denselben größten Wert, wird die erste davon zurückgegeben. Ist die Liste leer, gibt die Methode null zurück.",
      erklaerungRu: [
        "Сначала граничный случай: если список пуст (messungen.isEmpty()) — сразу return null;",
        "Возьми первое измерение как лучшее на данный момент: Messung beste = messungen.get(0);",
        "Пройди по остальным. Если getWert() текущего БОЛЬШЕ, чем у beste, — запомни текущее.",
        "Строго «>», а не «>=»: при равенстве остаётся первое.",
        "Не начинай с 0: если все значения отрицательные, 0 окажется «больше» любого из них."
      ],
      klassen: [{
        name: "Messung", beschreibung: "Eine Temperaturmessung.",
        felder: { sensor: "String", uhrzeit: "int", wert: "double" },
        methoden: [["getSensor() : String", "Gibt die Bezeichnung des Sensors zurück."], ["getUhrzeit() : int", "Gibt die Uhrzeit als Zahl hhmm zurück, z. B. 1430."], ["getWert() : double", "Gibt die Temperatur in °C zurück."]]
      }],
      signatur: "Messung hoechsteMessung(List<Messung> messungen)",
      vorlage: "Messung hoechsteMessung(List<Messung> messungen) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[M("S1", 800, 12.5), M("S2", 1200, 18.25), M("S1", 1600, 15.0)]], erwartet: M("S2", 1200, 18.25) },
        { eingabe: [[M("S3", 900, 21.0)]], erwartet: M("S3", 900, 21.0) },
        { eingabe: [[]], erwartet: null, verdeckt: true, fall: "пустой список → null" },
        { eingabe: [[M("S1", 200, -3.5), M("S2", 300, -1.25), M("S1", 400, -7.0)]], erwartet: M("S2", 300, -1.25), verdeckt: true, fall: "все значения отрицательные" },
        { eingabe: [[M("S1", 800, 20.0), M("S2", 900, 20.0), M("S3", 1000, 19.5)]], erwartet: M("S1", 800, 20.0), verdeckt: true, fall: "одинаковые наибольшие значения — нужна первая" },
        { eingabe: [[M("S4", 500, 3.0), M("S4", 600, 8.5)]], erwartet: M("S4", 600, 8.5), verdeckt: true, fall: "наибольшее значение в конце списка" }
      ],
      hinweis: "if (messungen.isEmpty()) { return null; } Messung beste = messungen.get(0); for (Messung m : messungen) { if (m.getWert() > beste.getWert()) { beste = m; } } return beste;",
      loesung: "Messung hoechsteMessung(List<Messung> messungen) {\n    if (messungen.isEmpty()) {\n        return null;\n    }\n    Messung beste = messungen.get(0);\n    for (Messung m : messungen) {\n        if (m.getWert() > beste.getWert()) {\n            beste = m;\n        }\n    }\n    return beste;\n}\n",
      begriffe: [["die Messung", "измерение"], ["der Wert", "значение"], ["größter Wert", "наибольшее значение (максимум)"], ["leer", "пустой"], ["das Gewächshaus", "теплица"], ["negativ", "отрицательный"]]
    },
    {
      id: "durchschnitt-sterne",
      titel: "Средняя оценка отзывов",
      stufe: 2,
      kontext: "Ein Onlineshop speichert Bewertungen seiner Kunden. Jede Bewertung hat 1 bis 5 Sterne.",
      aufgabe: "Entwickeln Sie eine Methode durchschnitt, die den Durchschnitt der Sterne als Kommazahl zurückgibt. Ist die Liste leer, gibt die Methode 0.0 zurück. Eine Division durch null darf nicht auftreten.",
      erklaerungRu: [
        "Пустой список проверь до деления: if (bewertungen.isEmpty()) return 0.0;",
        "Сложи звёзды всех отзывов в переменную summe.",
        "Раздели сумму на количество: bewertungen.size().",
        "Ловушка: int / int в Java — целое деление (9 / 2 = 4). Приведи к double: (double) summe / bewertungen.size()."
      ],
      klassen: [{
        name: "Bewertung", beschreibung: "Eine Kundenbewertung.",
        felder: { produktnummer: "int", sterne: "int" },
        methoden: [["getProduktnummer() : int", "Gibt die Nummer des bewerteten Produkts zurück."], ["getSterne() : int", "Gibt die Anzahl der Sterne (1 bis 5) zurück."]]
      }],
      signatur: "double durchschnitt(List<Bewertung> bewertungen)",
      vorlage: "double durchschnitt(List<Bewertung> bewertungen) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[B(501, 5), B(501, 4)]], erwartet: 4.5 },
        { eingabe: [[B(502, 3), B(502, 3), B(502, 4)]], erwartet: 3.3333 },
        { eingabe: [[]], erwartet: 0.0, verdeckt: true, fall: "пустой список — без деления на ноль" },
        { eingabe: [[B(503, 2)]], erwartet: 2.0, verdeckt: true, fall: "один отзыв" },
        { eingabe: [[B(504, 1), B(504, 2)]], erwartet: 1.5, verdeckt: true, fall: "дробный результат: целое деление даст 1" }
      ],
      hinweis: "int summe = 0; for (Bewertung b : bewertungen) { summe += b.getSterne(); } return (double) summe / bewertungen.size(); — а самой первой строкой проверка на пустой список.",
      loesung: "double durchschnitt(List<Bewertung> bewertungen) {\n    if (bewertungen.isEmpty()) {\n        return 0.0;\n    }\n    int summe = 0;\n    for (Bewertung b : bewertungen) {\n        summe += b.getSterne();\n    }\n    return (double) summe / bewertungen.size();\n}\n",
      begriffe: [["der Durchschnitt", "среднее значение"], ["die Kommazahl", "дробное число"], ["die Division durch null", "деление на ноль"], ["die Bewertung", "отзыв, оценка"], ["auftreten", "возникать"]]
    },
    {
      id: "nachbestellen",
      titel: "Новый список товаров для дозаказа",
      stufe: 2,
      kontext: "Ein Lagerverwaltungssystem prüft jeden Abend den Bestand. Für jeden Artikel ist ein Mindestbestand festgelegt.",
      aufgabe: "Entwickeln Sie eine Methode nachbestellen, die eine neue Liste mit allen Artikeln zurückgibt, deren Bestand kleiner als der Mindestbestand ist. Die übergebene Liste darf nicht verändert werden.",
      erklaerungRu: [
        "Создай новый пустой список: List<Artikel> ergebnis = new ArrayList<>();",
        "Пройди по всем артикулам исходного списка.",
        "Если запас меньше минимального (getBestand() < getMindestbestand()) — добавь артикул в новый список: ergebnis.add(a);",
        "Из исходного списка ничего не удаляй — он должен остаться как был.",
        "Верни новый список. Если ничего не подошло — вернётся пустой список (не null)."
      ],
      klassen: [{
        name: "Artikel", beschreibung: "Ein Artikel im Lager.",
        felder: { artikelnummer: "int", bezeichnung: "String", bestand: "int", mindestbestand: "int" },
        methoden: [["getArtikelnummer() : int", "Gibt die Artikelnummer zurück."], ["getBezeichnung() : String", "Gibt die Bezeichnung zurück."], ["getBestand() : int", "Gibt den aktuellen Bestand zurück."], ["getMindestbestand() : int", "Gibt den Mindestbestand zurück."]]
      }],
      signatur: "List<Artikel> nachbestellen(List<Artikel> artikel)",
      vorlage: "List<Artikel> nachbestellen(List<Artikel> artikel) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[R(101, "Schrauben", 40, 100), R(102, "Dübel", 500, 200), R(103, "Kabel", 5, 10)]], erwartet: [R(101, "Schrauben", 40, 100), R(103, "Kabel", 5, 10)] },
        { eingabe: [[R(104, "Muttern", 0, 50)]], erwartet: [R(104, "Muttern", 0, 50)] },
        { eingabe: [[]], erwartet: [], verdeckt: true, fall: "пустой список → пустой список" },
        { eingabe: [[R(105, "Kleber", 80, 20), R(106, "Band", 30, 30)]], erwartet: [], verdeckt: true, fall: "запас ровно равен минимуму — не дозаказываем" },
        { eingabe: [[R(107, "Leim", 1, 5), R(108, "Nägel", 900, 100), R(109, "Haken", 2, 3)]], erwartet: [R(107, "Leim", 1, 5), R(109, "Haken", 2, 3)],
          nachher: [[R(107, "Leim", 1, 5), R(108, "Nägel", 900, 100), R(109, "Haken", 2, 3)]], verdeckt: true, fall: "исходный список не должен измениться" }
      ],
      hinweis: "List<Artikel> ergebnis = new ArrayList<>(); for (Artikel a : artikel) { if (a.getBestand() < a.getMindestbestand()) { ergebnis.add(a); } } return ergebnis;",
      loesung: "List<Artikel> nachbestellen(List<Artikel> artikel) {\n    List<Artikel> ergebnis = new ArrayList<>();\n    for (Artikel a : artikel) {\n        if (a.getBestand() < a.getMindestbestand()) {\n            ergebnis.add(a);\n        }\n    }\n    return ergebnis;\n}\n",
      begriffe: [["der Bestand", "запас на складе"], ["der Mindestbestand", "минимальный запас"], ["nachbestellen", "дозаказать"], ["eine neue Liste", "новый список"], ["verändern", "изменять"], ["kleiner als", "меньше чем"]]
    },
    {
      id: "zeichen-zaehlen",
      titel: "Сколько раз встречается буква",
      stufe: 2,
      kontext: "Ein Textprogramm zeigt eine Statistik zu einem eingegebenen Text an.",
      aufgabe: "Entwickeln Sie eine Methode zaehleZeichen, die zurückgibt, wie oft das übergebene Zeichen im Text vorkommt. Groß- und Kleinschreibung wird dabei nicht unterschieden.",
      erklaerungRu: [
        "Счётчик: int anzahl = 0;",
        "Пройди по строке: for (int i = 0; i < text.length(); i++). Символ на позиции i — text.charAt(i).",
        "Регистр не важен — приведи оба символа к маленьким: Character.toLowerCase(…).",
        "Символы (char) сравнивают через ==, они пишутся в апострофах 'a'.",
        "Совпало — anzahl++. После цикла верни anzahl."
      ],
      klassen: [],
      signatur: "int zaehleZeichen(String text, char zeichen)",
      vorlage: "int zaehleZeichen(String text, char zeichen) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: ["Banane", "a"], erwartet: 2 },
        { eingabe: ["Anna", "a"], erwartet: 2 },
        { eingabe: ["", "x"], erwartet: 0, verdeckt: true, fall: "пустая строка" },
        { eingabe: ["Hallo", "z"], erwartet: 0, verdeckt: true, fall: "символа нет в тексте" },
        { eingabe: ["AAaa", "A"], erwartet: 4, verdeckt: true, fall: "большие и маленькие буквы" },
        { eingabe: ["1 + 1 = 2", "1"], erwartet: 2, verdeckt: true, fall: "цифры и пробелы" }
      ],
      hinweis: "if (Character.toLowerCase(text.charAt(i)) == Character.toLowerCase(zeichen)) { anzahl++; } — либо один раз до цикла: String klein = text.toLowerCase();",
      loesung: "int zaehleZeichen(String text, char zeichen) {\n    int anzahl = 0;\n    char gesucht = Character.toLowerCase(zeichen);\n    for (int i = 0; i < text.length(); i++) {\n        if (Character.toLowerCase(text.charAt(i)) == gesucht) {\n            anzahl++;\n        }\n    }\n    return anzahl;\n}\n",
      begriffe: [["das Zeichen", "символ, знак"], ["vorkommen", "встречаться"], ["Groß- und Kleinschreibung", "большие и маленькие буквы (регистр)"], ["unterscheiden", "различать"], ["die Zeichenkette", "строка (String)"]]
    },

    /* ------------------------------------------------------------ Stufe 3 */
    {
      id: "freier-platz",
      titel: "Первое свободное место в зале",
      stufe: 3,
      kontext: "Ein Kino speichert die Belegung eines Saals in einem zweidimensionalen Array. Die erste Dimension ist die Reihe, die zweite der Platz. Der Wert true bedeutet: Der Platz ist belegt. Die Reihen können unterschiedlich lang sein.",
      aufgabe: "Entwickeln Sie eine Methode ersterFreierPlatz, die Reihe und Platz des ersten freien Platzes als Array {reihe, platz} zurückgibt. Gesucht wird Reihe für Reihe von vorn und in jeder Reihe von links. Ist kein Platz frei, gibt die Methode {-1, -1} zurück.",
      erklaerungRu: [
        "Нужны два вложенных цикла: внешний по рядам (belegt.length), внутренний по местам ряда.",
        "Длина ряда у каждого своя: belegt[r].length, а не belegt[0].length.",
        "Место свободно, если belegt[r][p] равно false (то есть !belegt[r][p]).",
        "Нашла — сразу верни новый массив: return new int[] {r, p};",
        "Если оба цикла закончились — свободных мест нет: return new int[] {-1, -1};"
      ],
      klassen: [],
      signatur: "int[] ersterFreierPlatz(boolean[][] belegt)",
      vorlage: "int[] ersterFreierPlatz(boolean[][] belegt) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[[true, true], [true, false]]], erwartet: [1, 1] },
        { eingabe: [[[false, true, true]]], erwartet: [0, 0] },
        { eingabe: [[[true, true], [true, true]]], erwartet: [-1, -1], verdeckt: true, fall: "все места заняты" },
        { eingabe: [[]], erwartet: [-1, -1], verdeckt: true, fall: "в зале нет рядов" },
        { eingabe: [[[true], [true, true, false]]], erwartet: [1, 2], verdeckt: true, fall: "ряды разной длины" },
        { eingabe: [[[true, false, false], [false]]], erwartet: [0, 1], verdeckt: true, fall: "несколько свободных мест — нужно первое" }
      ],
      hinweis: "for (int r = 0; r < belegt.length; r++) { for (int p = 0; p < belegt[r].length; p++) { if (!belegt[r][p]) { return new int[] {r, p}; } } } return new int[] {-1, -1};",
      loesung: "int[] ersterFreierPlatz(boolean[][] belegt) {\n    for (int r = 0; r < belegt.length; r++) {\n        for (int p = 0; p < belegt[r].length; p++) {\n            if (!belegt[r][p]) {\n                return new int[] {r, p};\n            }\n        }\n    }\n    return new int[] {-1, -1};\n}\n",
      begriffe: [["zweidimensionales Array", "двумерный массив"], ["die Reihe", "ряд"], ["der Platz", "место"], ["belegt", "занят"], ["frei", "свободен"], ["die Belegung", "занятость (мест)"]]
    },
    {
      id: "bubble-sort",
      titel: "Сортировка пузырьком (Bubble Sort)",
      stufe: 3,
      kontext: "Eine Lernplattform zeigt die Punktzahlen eines Tests sortiert an. Eine fertige Sortierfunktion der Bibliothek darf nicht verwendet werden.",
      aufgabe: "Entwickeln Sie eine Methode sortiere, die das Array mit dem Verfahren Bubble Sort aufsteigend sortiert. Die Methode verändert das übergebene Array und gibt nichts zurück.",
      erklaerungRu: [
        "Метод void: он ничего не возвращает, а меняет сам массив, который ему передали.",
        "Внешний цикл — проходы: for (int i = 0; i < punkte.length - 1; i++).",
        "Внутренний цикл сравнивает соседей: for (int j = 0; j < punkte.length - 1 - i; j++).",
        "Если punkte[j] > punkte[j + 1] — поменяй их местами через временную переменную.",
        "После каждого прохода самое большое из оставшихся чисел «всплывает» в конец."
      ],
      klassen: [],
      signatur: "void sortiere(int[] punkte)",
      vorlage: "void sortiere(int[] punkte) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[5, 2, 9, 1]], nachher: [[1, 2, 5, 9]] },
        { eingabe: [[3, 1, 2]], nachher: [[1, 2, 3]] },
        { eingabe: [[]], nachher: [[]], verdeckt: true, fall: "пустой массив" },
        { eingabe: [[7]], nachher: [[7]], verdeckt: true, fall: "один элемент" },
        { eingabe: [[4, 4, 1, 4]], nachher: [[1, 4, 4, 4]], verdeckt: true, fall: "одинаковые значения" },
        { eingabe: [[-3, 10, -20, 0]], nachher: [[-20, -3, 0, 10]], verdeckt: true, fall: "отрицательные числа" },
        { eingabe: [[9, 7, 5, 3, 1]], nachher: [[1, 3, 5, 7, 9]], verdeckt: true, fall: "обратный порядок" }
      ],
      hinweis: "Обмен: int temp = punkte[j]; punkte[j] = punkte[j + 1]; punkte[j + 1] = temp; Граница внутреннего цикла — j < punkte.length - 1 - i, иначе punkte[j + 1] выйдет за конец массива.",
      loesung: "void sortiere(int[] punkte) {\n    for (int i = 0; i < punkte.length - 1; i++) {\n        for (int j = 0; j < punkte.length - 1 - i; j++) {\n            if (punkte[j] > punkte[j + 1]) {\n                int temp = punkte[j];\n                punkte[j] = punkte[j + 1];\n                punkte[j + 1] = temp;\n            }\n        }\n    }\n}\n",
      begriffe: [["sortieren", "сортировать"], ["aufsteigend", "по возрастанию"], ["absteigend", "по убыванию"], ["vertauschen", "поменять местами"], ["der Durchlauf", "проход (цикла)"], ["benachbart", "соседний"]]
    },
    {
      id: "umsatz-zeitraum",
      titel: "Сумма продаж за период",
      stufe: 3,
      kontext: "Eine Kasse speichert jede Buchung mit Datum und Betrag. Das Datum ist eine ganze Zahl im Format JJJJMMTT, zum Beispiel 20260315 für den 15.03.2026. Rücknahmen haben einen negativen Betrag.",
      aufgabe: "Entwickeln Sie eine Methode umsatzImZeitraum, die die Summe der Beträge aller Buchungen vom Datum von bis einschließlich zum Datum bis zurückgibt.",
      erklaerungRu: [
        "Дата записана числом JJJJMMTT — более поздняя дата всегда больше. Поэтому даты можно сравнивать обычными < и >.",
        "Сумма — дробное число: double summe = 0.0;",
        "Пройди по всем покупкам. Если дата в периоде — прибавь сумму покупки.",
        "«Bis einschließlich» — включительно: границы входят, нужны >= и <=.",
        "Возвраты (отрицательные суммы) прибавляются как есть — они уменьшают оборот."
      ],
      klassen: [{
        name: "Buchung", beschreibung: "Eine Buchung an der Kasse.",
        felder: { belegnummer: "int", datum: "int", betrag: "double" },
        methoden: [["getBelegnummer() : int", "Gibt die Belegnummer zurück."], ["getDatum() : int", "Gibt das Datum im Format JJJJMMTT zurück."], ["getBetrag() : double", "Gibt den Betrag in Euro zurück."]]
      }],
      signatur: "double umsatzImZeitraum(List<Buchung> buchungen, int von, int bis)",
      vorlage: "double umsatzImZeitraum(List<Buchung> buchungen, int von, int bis) {\n    // Ihr Code\n}\n",
      tests: [
        { eingabe: [[K(1, 20260228, 10.0), K(2, 20260305, 25.5), K(3, 20260320, 4.5), K(4, 20260402, 99.0)], 20260301, 20260331], erwartet: 30.0 },
        { eingabe: [[K(5, 20260110, 12.25), K(6, 20260111, 7.75)], 20260101, 20260131], erwartet: 20.0 },
        { eingabe: [[], 20260101, 20261231], erwartet: 0.0, verdeckt: true, fall: "пустой список" },
        { eingabe: [[K(7, 20260301, 5.0), K(8, 20260331, 6.0), K(9, 20260401, 100.0)], 20260301, 20260331], erwartet: 11.0, verdeckt: true, fall: "границы периода входят (включительно)" },
        { eingabe: [[K(10, 20251230, 8.0), K(11, 20251231, 2.0), K(12, 20260101, 3.0), K(13, 20260102, 50.0)], 20251231, 20260101], erwartet: 5.0, verdeckt: true, fall: "период через Новый год" },
        { eingabe: [[K(14, 20260505, 40.0), K(15, 20260506, -15.5)], 20260501, 20260531], erwartet: 24.5, verdeckt: true, fall: "возврат с отрицательной суммой" },
        { eingabe: [[K(16, 20260601, 9.0)], 20260701, 20260731], erwartet: 0.0, verdeckt: true, fall: "в периоде нет покупок" }
      ],
      hinweis: "double summe = 0.0; for (Buchung b : buchungen) { if (b.getDatum() >= von && b.getDatum() <= bis) { summe += b.getBetrag(); } } return summe;",
      loesung: "double umsatzImZeitraum(List<Buchung> buchungen, int von, int bis) {\n    double summe = 0.0;\n    for (Buchung b : buchungen) {\n        if (b.getDatum() >= von && b.getDatum() <= bis) {\n            summe += b.getBetrag();\n        }\n    }\n    return summe;\n}\n",
      begriffe: [["der Umsatz", "оборот, выручка"], ["der Zeitraum", "период"], ["einschließlich", "включительно"], ["die Buchung", "проводка, покупка (запись в кассе)"], ["der Betrag", "сумма (денег)"], ["die Rücknahme", "возврат товара"]]
    }
  ];

  root.AP2_CODE_AUFGABEN = AUFGABEN;
  if (typeof module === "object" && module.exports) module.exports = AUFGABEN;
})(typeof window !== "undefined" ? window : globalThis);
