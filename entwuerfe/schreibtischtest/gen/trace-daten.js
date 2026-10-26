/* ============================================================================
   gen/trace-daten.js — 12 eigene Aufgaben «Schreibtischtest» im Stil von GA2
   ----------------------------------------------------------------------------
   Autorenaufgaben (keine Kopien von IHK-Prüfungen). Die richtigen Werte stehen
   hier NICHT: der Trainer (gen/trace-trainer.js) lässt den Code mit
   GENCODELAUF.verfolgen() wirklich laufen und liest die Wertetabelle, die
   Ausgabe und die Testergebnisse daraus ab. tests/trace.test.js vergleicht das
   mit von Hand gerechneten Erwartungswerten.

   Typen:
     typ "tabelle" — Wertetabelle ausfüllen:
        eingabe [Argumente], tabelle { kopf, punkte:[{zeile, wann, label}],
        spalten:[{titel, wert:"Ausdruck"} | {titel, bedingung:Zeile} | {titel, ausgabe:true}],
        vorgabeZeilen }, rueckgabe (Rückgabewert mit abfragen)
     typ "fehler"  — semantische Fehler finden:
        tests [{eingabe, erwartet | nachher}], fehler [{zeilen:[…], art, fix:{zeile:"Text"}, ru}]
        (Fehler, der zwei Zeilen betrifft — z. B. vertauschte Reihenfolge —
        hat zwei Zeilen; markiert sein muss mindestens eine davon)
     typ "ausgabe" — Was wird ausgegeben? eingabe [Argumente]
   Gemeinsam: id, titel (ru), titelDe, kontext/aufgabe (de, einfache Sätze),
   code, signatur, methode, klassen, erklaerungRu (wie man vorgeht),
   hinweis (ru), analyse (ru, Besprechung), begriffe [[de, ru]].
   ========================================================================== */
"use strict";
(function (root) {
  const code = zeilen => zeilen.join("\n") + "\n";
  const BESTELLUNG = {
    name: "Bestellung", beschreibung: "Eine Bestellung im Onlineshop.",
    felder: { nummer: "int", betrag: "double", bezahlt: "boolean" },
    methoden: [["getNummer() : int", "Gibt die Bestellnummer zurück."], ["getBetrag() : double", "Gibt den Betrag in Euro zurück."],
      ["isBezahlt() : boolean", "Gibt true zurück, wenn die Bestellung bezahlt ist."]]
  };
  const ARTIKEL = {
    name: "Artikel", beschreibung: "Ein Artikel im Lager.",
    felder: { bezeichnung: "String", preis: "double", bestand: "int" },
    methoden: [["getBezeichnung() : String", "Gibt die Bezeichnung zurück."], ["getPreis() : double", "Gibt den Preis in Euro zurück."],
      ["getBestand() : int", "Gibt die Stückzahl im Lager zurück."]]
  };
  const B = (nummer, betrag, bezahlt) => ({ nummer, betrag, bezahlt });
  const A = (bezeichnung, preis, bestand) => ({ bezeichnung, preis, bestand });

  const AUFGABEN = [
    /* ================================================== Wertetabelle (6) */
    {
      id: "lager-buchungen",
      typ: "tabelle",
      titel: "Склад: проводки и отказ",
      titelDe: "Lagerbuchungen prüfen",
      kontext: "Ein Lagerprogramm bucht Zugänge und Abgänge. Ein Abgang ist nur erlaubt, wenn der Bestand danach nicht negativ ist. Sonst wird die Buchung abgelehnt.",
      aufgabe: "Führen Sie einen Schreibtischtest für start = 10 und buchungen = {-4, 7, -15, -6} durch. Tragen Sie die Werte am Ende jedes Schleifendurchlaufs in die Wertetabelle ein. Die erste Zeile ist vorgegeben. Geben Sie auch den Rückgabewert an.",
      signatur: "int pruefeBuchungen(int start, int[] buchungen)",
      methode: "pruefeBuchungen",
      code: code([
        "int pruefeBuchungen(int start, int[] buchungen) {",
        "    int bestand = start;",
        "    for (int i = 0; i < buchungen.length; i++) {",
        "        if (bestand + buchungen[i] >= 0) {",
        "            bestand = bestand + buchungen[i];",
        "        } else {",
        "            System.out.println(\"abgelehnt: \" + buchungen[i]);",
        "        }",
        "    }",
        "    return bestand;",
        "}"
      ]),
      klassen: [],
      eingabe: [10, [-4, 7, -15, -6]],
      tabelle: {
        kopf: "Durchlauf",
        punkte: [{ zeile: 3, wann: "durchlauf", label: "{n}" }],
        spalten: [
          { titel: "i", wert: "i" },
          { titel: "buchungen[i]", wert: "buchungen[i]" },
          { titel: "Bedingung (Z. 4)", bedingung: 4 },
          { titel: "bestand", wert: "bestand" },
          { titel: "Ausgabe", ausgabe: true }
        ],
        vorgabeZeilen: 1
      },
      rueckgabe: true,
      erklaerungRu: [
        "До цикла: bestand = start = 10.",
        "Строка таблицы = один Durchlauf (проход тела цикла). Значения пиши в конце прохода, до i++.",
        "Условие строки 4 считается со «старым» bestand: сначала сложи bestand + buchungen[i], потом сравни с 0.",
        "Если условие false, bestand не меняется, зато появляется вывод (Ausgabe). Нет вывода в этом проходе — оставь клетку пустой.",
        "Когда i становится 4, условие i < 4 ложно: цикл заканчивается, return возвращает bestand."
      ],
      hinweis: "В 3-м проходе 13 + (−15) = −2, это меньше 0 → условие false. bestand остаётся 13, а на экран выводится «abgelehnt: -15».",
      analyse: "Ловушка — проход с отклонённой проводкой: bestand не меняется (13), но появляется вывод. Условие строки 4 считается до присваивания в строке 5, поэтому берётся ещё старый bestand. Rückgabewert — последнее значение bestand: 7.",
      begriffe: [["der Schreibtischtest", "ручная трассировка кода на бумаге"], ["die Wertetabelle", "таблица значений переменных"],
        ["der Schleifendurchlauf", "один проход цикла"], ["die Bedingung", "условие: true или false"], ["die Ausgabe", "вывод на экран"],
        ["der Rückgabewert", "возвращаемое значение (return)"], ["der Zugang / der Abgang", "поступление / списание"]]
    },
    {
      id: "noten-while",
      typ: "tabelle",
      titel: "Оценки: while с условием",
      titelDe: "Notendurchschnitt mit while",
      kontext: "Eine Lehrkraft gibt die Noten einer Klassenarbeit nacheinander ein. Die Eingabe 0 beendet die Erfassung. Die Methode berechnet den Durchschnitt der erfassten Noten.",
      aufgabe: "Führen Sie einen Schreibtischtest für noten = {2, 3, 1, 0, 5} durch. Tragen Sie bei jeder Prüfung der Schleifenbedingung (Zeile 5) die Werte ein. Geben Sie den Rückgabewert an.",
      signatur: "double durchschnitt(int[] noten)",
      methode: "durchschnitt",
      code: code([
        "double durchschnitt(int[] noten) {",
        "    int summe = 0;",
        "    int anzahl = 0;",
        "    int i = 0;",
        "    while (i < noten.length && noten[i] != 0) {",
        "        summe = summe + noten[i];",
        "        anzahl++;",
        "        i++;",
        "    }",
        "    if (anzahl == 0) {",
        "        return 0.0;",
        "    }",
        "    return (double) summe / anzahl;",
        "}"
      ]),
      klassen: [],
      eingabe: [[2, 3, 1, 0, 5]],
      tabelle: {
        kopf: "Prüfung",
        punkte: [{ zeile: 5, wann: "bedingung", label: "{n}" }],
        spalten: [
          { titel: "i", wert: "i" },
          { titel: "noten[i]", wert: "noten[i]" },
          { titel: "Schleifen­bedingung", bedingung: 5 },
          { titel: "summe", wert: "summe" },
          { titel: "anzahl", wert: "anzahl" }
        ]
      },
      rueckgabe: true,
      erklaerungRu: [
        "Здесь строка таблицы — каждая проверка условия while в строке 5, включая последнюю, когда условие false.",
        "Значения пиши в момент проверки — до выполнения тела цикла.",
        "Условие из двух частей: i < noten.length И noten[i] != 0. Оно true, только если обе части true.",
        "После false цикл заканчивается, дальше строки 10–13.",
        "(double) summe / anzahl — деление с дробной частью: ответ пиши как double, например 2.0."
      ],
      hinweis: "4-я проверка: i = 3, noten[3] = 0 → noten[i] != 0 даёт false, значит всё условие false. summe и anzahl к этому моменту — после трёх проходов.",
      analyse: "Строк на одну больше, чем проходов: последняя проверка (false) тоже записывается. Оценка 5 после нуля не учитывается — цикл остановился на 0 (Abbruchbedingung). Rückgabewert: (double) 6 / 3 = 2.0; без приведения (double) было бы целочисленное деление.",
      begriffe: [["die Schleifenbedingung", "условие цикла"], ["die Abbruchbedingung", "условие окончания цикла"],
        ["kopfgesteuerte Schleife", "цикл с предусловием (while)"], ["die Prüfung", "проверка"], ["der Durchschnitt", "среднее значение"],
        ["erfassen", "вводить, регистрировать"], ["true / false (wahr / falsch)", "истина / ложь"]]
    },
    {
      id: "temperatur-anstieg",
      typ: "tabelle",
      titel: "Температура: самый большой рост",
      titelDe: "Größter Temperaturanstieg",
      kontext: "Eine Wetterstation misst jede Stunde die Temperatur in °C. Die Methode sucht den größten Anstieg zwischen zwei Messungen, die direkt nacheinander liegen.",
      aufgabe: "Führen Sie einen Schreibtischtest für temp = {12.5, 14.0, 13.5, 17.0, 18.5} durch. Tragen Sie die Startwerte vor der Schleife und die Werte am Ende jedes Durchlaufs ein. Geben Sie den Rückgabewert an.",
      signatur: "double groessterAnstieg(double[] temp)",
      methode: "groessterAnstieg",
      code: code([
        "double groessterAnstieg(double[] temp) {",
        "    double max = 0.0;",
        "    for (int i = 1; i < temp.length; i++) {",
        "        double diff = temp[i] - temp[i - 1];",
        "        if (diff > max) {",
        "            max = diff;",
        "        }",
        "    }",
        "    return max;",
        "}"
      ]),
      klassen: [],
      eingabe: [[12.5, 14.0, 13.5, 17.0, 18.5]],
      tabelle: {
        kopf: "Durchlauf",
        punkte: [{ zeile: 3, wann: "vor", label: "Start" }, { zeile: 3, wann: "durchlauf", label: "{n}" }],
        spalten: [
          { titel: "i", wert: "i" },
          { titel: "diff", wert: "diff" },
          { titel: "max", wert: "max" }
        ]
      },
      rueckgabe: true,
      erklaerungRu: [
        "Строка «Start» — значения до цикла: max = 0.0; i и diff ещё не существуют (клетки с «—»).",
        "Цикл начинается с i = 1: каждое измерение сравнивается с предыдущим (i − 1).",
        "diff объявлена внутри цикла и в каждом проходе получает новое значение.",
        "max меняется, только если diff > max. Отрицательная разница (похолодание) max не меняет.",
        "Числа double пиши с точкой или запятой: 1.5 или 1,5. Для минуса — кнопка «±»."
      ],
      hinweis: "Посчитай разницы заранее: 14.0 − 12.5 = 1.5; 13.5 − 14.0 = −0.5; 17.0 − 13.5 = 3.5; 18.5 − 17.0 = 1.5.",
      analyse: "max запоминает наибольшее значение «на данный момент»: 1.5 → 1.5 → 3.5 → 3.5. Последний diff = 1.5 не больше 3.5, поэтому max не меняется. Цикл стартует с i = 1 — иначе temp[i − 1] обратился бы к индексу −1.",
      begriffe: [["der Anstieg", "подъём, рост"], ["die Differenz", "разность"], ["der Startwert / der Anfangswert", "начальное значение"],
        ["die Zuweisung", "присваивание (=)"], ["die Kommazahl (double)", "дробное число"], ["die Messung", "измерение"]]
    },
    {
      id: "passwort-punkte",
      typ: "tabelle",
      titel: "Строка: баллы за пароль",
      titelDe: "Passwortstärke bewerten",
      kontext: "Ein Anmeldeformular bewertet die Stärke eines Passworts. Jeder Großbuchstabe gibt 1 Punkt. Nur die erste Ziffer gibt 2 Punkte.",
      aufgabe: "Führen Sie einen Schreibtischtest für pw = \"aB3x7Q\" durch. Tragen Sie die Werte am Ende jedes Schleifendurchlaufs ein. Geben Sie den Rückgabewert an.",
      signatur: "int bewertePasswort(String pw)",
      methode: "bewertePasswort",
      code: code([
        "int bewertePasswort(String pw) {",
        "    int punkte = 0;",
        "    boolean zifferGefunden = false;",
        "    for (int i = 0; i < pw.length(); i++) {",
        "        char c = pw.charAt(i);",
        "        if (Character.isDigit(c) && !zifferGefunden) {",
        "            punkte = punkte + 2;",
        "            zifferGefunden = true;",
        "        } else if (Character.isUpperCase(c)) {",
        "            punkte++;",
        "        }",
        "    }",
        "    return punkte;",
        "}"
      ]),
      klassen: [],
      eingabe: ["aB3x7Q"],
      tabelle: {
        kopf: "Durchlauf",
        punkte: [{ zeile: 4, wann: "durchlauf", label: "{n}" }],
        spalten: [
          { titel: "i", wert: "i" },
          { titel: "c", wert: "c" },
          { titel: "punkte", wert: "punkte" },
          { titel: "zifferGefunden", wert: "zifferGefunden" }
        ]
      },
      rueckgabe: true,
      erklaerungRu: [
        "charAt(i) даёт символ на позиции i. Позиции считаются с 0: a — 0, B — 1, 3 — 2 …",
        "Сначала проверяется первое условие (цифра И цифры ещё не было). Только если оно false, проверяется else if (заглавная буква).",
        "zifferGefunden меняется один раз и потом остаётся true.",
        "Символ пиши без кавычек: a, B, 3."
      ],
      hinweis: "Символ 7: Character.isDigit = true, но цифра уже была (zifferGefunden = true) → первое условие false. Заглавной буквой 7 тоже не является.",
      analyse: "Ключевой проход — 5-й (символ 7): !zifferGefunden = false, поэтому всё условие с && даёт false; else if тоже false — punkte остаётся 3. Итог: B (+1), 3 (+2), Q (+1) = 4.",
      begriffe: [["die Zeichenkette (String)", "строка"], ["das Zeichen (char)", "символ"], ["der Großbuchstabe", "заглавная буква"],
        ["die Ziffer", "цифра"], ["der Wahrheitswert (boolean)", "логическое значение"], ["die Verzweigung (if / else if)", "ветвление"]]
    },
    {
      id: "regal-summen",
      typ: "tabelle",
      titel: "Стеллажи: вложенные циклы",
      titelDe: "Summe pro Regal (2D-Array)",
      kontext: "Ein Lager hat mehrere Regale. Jedes Regal hat Fächer mit einer Stückzahl. Die Regale sind unterschiedlich lang. Die Methode summiert die Stückzahlen pro Regal.",
      aufgabe: "Führen Sie einen Schreibtischtest für lager = {{4, 0, 6}, {2, 5}, {3}} durch. Tragen Sie die Werte am Ende jedes Durchlaufs der inneren Schleife ein. Geben Sie den Rückgabewert an.",
      signatur: "int[] summeProRegal(int[][] lager)",
      methode: "summeProRegal",
      code: code([
        "int[] summeProRegal(int[][] lager) {",
        "    int[] summen = new int[lager.length];",
        "    for (int r = 0; r < lager.length; r++) {",
        "        for (int f = 0; f < lager[r].length; f++) {",
        "            summen[r] = summen[r] + lager[r][f];",
        "        }",
        "    }",
        "    return summen;",
        "}"
      ]),
      klassen: [],
      eingabe: [[[4, 0, 6], [2, 5], [3]]],
      tabelle: {
        kopf: "Innerer Durchlauf",
        punkte: [{ zeile: 4, wann: "durchlauf", label: "{n}" }],
        spalten: [
          { titel: "r", wert: "r" },
          { titel: "f", wert: "f" },
          { titel: "lager[r][f]", wert: "lager[r][f]" },
          { titel: "summen[r]", wert: "summen[r]" }
        ]
      },
      rueckgabe: true,
      erklaerungRu: [
        "Вложенные циклы: для каждого r внутренний цикл проходит все f от 0 до конца ряда.",
        "Строка таблицы — один проход внутреннего цикла. Пока внутренний цикл не закончился, r не меняется.",
        "lager[r].length — длина конкретного ряда: в ряду 0 три полки, в ряду 1 — две, в ряду 2 — одна.",
        "new int[3] заполняется нулями, поэтому каждая summen[r] начинается с 0.",
        "Rückgabewert — весь массив, запиши его так: {10, 7, 3}."
      ],
      hinweis: "Порядок пар (r, f): (0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (2, 0). summen[r] — сумма только текущего ряда.",
      analyse: "Внешний цикл (r) — ряды, внутренний (f) — полки ряда. Проходов внутреннего цикла 3 + 2 + 1 = 6. Условие f < lager[r].length берёт длину текущего ряда, поэтому ряды разной длины обрабатываются правильно. Rückgabewert: {10, 7, 3}.",
      begriffe: [["die verschachtelte Schleife", "вложенный цикл"], ["äußere / innere Schleife", "внешний / внутренний цикл"],
        ["das zweidimensionale Array", "двумерный массив"], ["das Regal / das Fach", "стеллаж / полка"], ["die Stückzahl", "количество штук"],
        ["der Index", "индекс, номер позиции"]]
    },
    {
      id: "offene-bestellungen",
      typ: "tabelle",
      titel: "Список объектов: неоплаченные заказы",
      titelDe: "Offene Bestellungen summieren",
      kontext: "Ein Onlineshop speichert Bestellungen in einer Liste. Für eine Zahlungserinnerung braucht der Shop die Summe aller unbezahlten Bestellungen.",
      aufgabe: "Führen Sie einen Schreibtischtest mit der Liste bestellungen (siehe Eingabe) durch. Tragen Sie die Werte am Ende jedes Schleifendurchlaufs ein. Geben Sie den Rückgabewert an.",
      signatur: "double offenerBetrag(List<Bestellung> bestellungen)",
      methode: "offenerBetrag",
      code: code([
        "double offenerBetrag(List<Bestellung> bestellungen) {",
        "    double summe = 0.0;",
        "    int offen = 0;",
        "    for (Bestellung b : bestellungen) {",
        "        if (!b.isBezahlt()) {",
        "            summe = summe + b.getBetrag();",
        "            offen++;",
        "        }",
        "    }",
        "    System.out.println(offen + \" offen\");",
        "    return summe;",
        "}"
      ]),
      klassen: [BESTELLUNG],
      eingabe: [[B(101, 49.9, true), B(102, 120.0, false), B(103, 15.5, false), B(104, 80.0, true)]],
      tabelle: {
        kopf: "Durchlauf",
        punkte: [{ zeile: 4, wann: "durchlauf", label: "{n}" }],
        spalten: [
          { titel: "b.getNummer()", wert: "b.getNummer()" },
          { titel: "b.isBezahlt()", wert: "b.isBezahlt()" },
          { titel: "summe", wert: "summe" },
          { titel: "offen", wert: "offen" }
        ]
      },
      rueckgabe: true,
      erklaerungRu: [
        "for-each берёт объекты списка по очереди: b — сначала заказ 101, потом 102 и так далее.",
        "Значения полей читаем через геттеры: b.getNummer(), b.getBetrag(), b.isBezahlt().",
        "! — отрицание: !b.isBezahlt() даёт true, когда заказ НЕ оплачен.",
        "summe — double: пиши 0.0, 120.0 … (можно с запятой)."
      ],
      hinweis: "Заказы 101 и 104 оплачены — в этих проходах ничего не меняется. 102: 0.0 + 120.0 = 120.0; 103: 120.0 + 15.5 = 135.5.",
      analyse: "В сумму и в счётчик offen попадают только неоплаченные заказы (isBezahlt() = false → !false = true). В оплаченных проходах значения переписываются без изменений. Rückgabewert: 135.5; после цикла на экран выводится «2 offen».",
      begriffe: [["das Objekt", "объект"], ["die Liste (List)", "список"], ["die for-each-Schleife", "цикл «для каждого элемента»"],
        ["der Getter", "метод чтения поля (get… / is…)"], ["die Negation (!)", "отрицание"], ["unbezahlt / offen", "неоплаченный / открытый"]]
    },

    /* ================================================== Fehler finden (4) */
    {
      id: "beste-note",
      typ: "fehler",
      titel: "Лучшая оценка: две ошибки",
      titelDe: "Beste Note finden",
      kontext: "In Deutschland ist 1 die beste Note und 6 die schlechteste. Die Methode soll die beste Note einer Klassenarbeit zurückgeben. Das Array enthält mindestens eine Note.",
      aufgabe: "Der Algorithmus enthält zwei semantische Fehler. Markieren Sie die fehlerhaften Zeilen und korrigieren Sie diese. Die Testfälle zeigen das erwartete Ergebnis.",
      signatur: "int besteNote(int[] noten)",
      methode: "besteNote",
      code: code([
        "int besteNote(int[] noten) {",
        "    int beste = 0;",
        "    for (int i = 0; i <= noten.length; i++) {",
        "        if (noten[i] < beste) {",
        "            beste = noten[i];",
        "        }",
        "    }",
        "    return beste;",
        "}"
      ]),
      klassen: [],
      tests: [
        { eingabe: [[3, 2, 4]], erwartet: 2 },
        { eingabe: [[5]], erwartet: 5 },
        { eingabe: [[2, 1, 6, 1]], erwartet: 1 }
      ],
      fehler: [
        { zeilen: [2], art: "init", fix: { 2: "int beste = noten[0];" },
          ru: "Anfangswert 0 меньше любой оценки 1–6: условие noten[i] < beste никогда не станет true. Начинают с первой оценки (или с 6)." },
        { zeilen: [3], art: "grenze", fix: { 3: "for (int i = 0; i < noten.length; i++) {" },
          ru: "i <= noten.length доходит до индекса length — такого элемента нет (выход за границу массива). Нужно i < noten.length." }
      ],
      erklaerungRu: [
        "Сначала пойми, что метод ДОЛЖЕН вернуть (Soll): самое маленькое число массива.",
        "Проведи Schreibtischtest для первого теста: где программа падает или результат расходится с ожидаемым?",
        "Типичные смысловые ошибки: граница цикла (<= вместо <), неверное начальное значение, перепутанное условие, порядок присваиваний.",
        "Нажми на строку с ошибкой — она отметится. Ниже впиши исправленную строку целиком."
      ],
      hinweis: "Проверь две вещи: какой последний допустимый индекс у массива из 3 элементов? И может ли условие noten[i] < beste хоть раз стать true, если beste = 0?",
      analyse: "Ошибка в строке 3: i <= noten.length — в последнем проходе noten[length] выходит за границу массива. Правильно: i < noten.length. Ошибка в строке 2: Anfangswert 0 меньше любой оценки, поэтому минимум не находится и возвращается 0. Правильно: int beste = noten[0]; (или 6).",
      begriffe: [["semantischer Fehler", "смысловая ошибка: код запускается, но работает неправильно"], ["der Syntaxfehler", "синтаксическая ошибка: код не компилируется"],
        ["der Anfangswert / die Initialisierung", "начальное значение"], ["die Schleifengrenze", "граница цикла"], ["der Testfall", "тестовый случай"],
        ["erwartet / tatsächlich", "ожидается / фактически"]]
    },
    {
      id: "bubble-fehler",
      typ: "fehler",
      titel: "Сортировка пузырьком: две ошибки",
      titelDe: "Bubble Sort reparieren",
      kontext: "Ein Versanddienst sortiert Paketgewichte (in kg) aufsteigend mit Bubble Sort. Benachbarte Werte werden verglichen und bei Bedarf getauscht.",
      aufgabe: "Der Algorithmus enthält zwei semantische Fehler. Markieren Sie die fehlerhaften Zeilen und korrigieren Sie diese. Ist die Reihenfolge von zwei Zeilen falsch, markieren Sie beide Zeilen.",
      signatur: "void sortiere(int[] gewichte)",
      methode: "sortiere",
      code: code([
        "void sortiere(int[] gewichte) {",
        "    for (int i = 0; i < gewichte.length - 1; i++) {",
        "        for (int j = 0; j < gewichte.length - i; j++) {",
        "            if (gewichte[j] > gewichte[j + 1]) {",
        "                gewichte[j] = gewichte[j + 1];",
        "                int tmp = gewichte[j];",
        "                gewichte[j + 1] = tmp;",
        "            }",
        "        }",
        "    }",
        "}"
      ]),
      klassen: [],
      tests: [
        { eingabe: [[5, 1, 4, 2]], nachher: [[1, 2, 4, 5]] },
        { eingabe: [[3, 2, 1]], nachher: [[1, 2, 3]] },
        { eingabe: [[7]], nachher: [[7]] },
        { eingabe: [[2, 2, 1]], nachher: [[1, 2, 2]] }
      ],
      fehler: [
        { zeilen: [3], art: "grenze", fix: { 3: "for (int j = 0; j < gewichte.length - 1 - i; j++) {" },
          ru: "j < gewichte.length − i пускает j до последнего индекса, и gewichte[j + 1] выходит за границу. Нужно j < gewichte.length − 1 − i." },
        { zeilen: [5, 6], art: "reihenfolge", fix: { 5: "int tmp = gewichte[j];", 6: "gewichte[j] = gewichte[j + 1];" },
          ru: "Порядок присваиваний: gewichte[j] перезаписывается раньше, чем его значение сохранено в tmp. Сначала int tmp = gewichte[j]; потом gewichte[j] = gewichte[j + 1];" }
      ],
      erklaerungRu: [
        "Bubble Sort: внутренний цикл сравнивает соседей gewichte[j] и gewichte[j + 1] и меняет их местами, если левый больше.",
        "Проверь границу: при каком j обращение к gewichte[j + 1] выходит за массив?",
        "Обмен (Tausch) двух значений: сначала сохранить одно значение во вспомогательной переменной, потом перезаписывать.",
        "Если две строки стоят в неправильном порядке — отметь обе и поменяй их тексты местами."
      ],
      hinweis: "Для массива из 4 элементов последний допустимый j — 2 (сравниваем с j + 1 = 3). В строках 5–6 значение gewichte[j] теряется раньше, чем его сохранили в tmp.",
      analyse: "Ошибка в строке 3: j < gewichte.length − i — при i = 0 j доходит до length − 1, и gewichte[j + 1] выходит за границу. Правильно: j < gewichte.length − 1 − i. Ошибка в строках 5/6: неверный порядок присваиваний — оба элемента получают одно и то же значение. Правильно: int tmp = gewichte[j]; gewichte[j] = gewichte[j + 1]; gewichte[j + 1] = tmp;",
      begriffe: [["Bubble Sort", "сортировка пузырьком"], ["aufsteigend", "по возрастанию"], ["benachbart", "соседний"],
        ["tauschen / der Tausch", "менять местами / обмен"], ["die Hilfsvariable", "вспомогательная переменная"],
        ["die Reihenfolge der Zuweisungen", "порядок присваиваний"], ["semantischer Fehler", "смысловая ошибка"]]
    },
    {
      id: "vokale-zaehlen",
      typ: "fehler",
      titel: "Подсчёт гласных: две ошибки",
      titelDe: "Vokale zählen",
      kontext: "Ein Textprogramm zählt die Vokale a, e, i, o und u in einem Wort. Großbuchstaben und Kleinbuchstaben zählen gleich.",
      aufgabe: "Die Methode enthält zwei semantische Fehler. Markieren Sie die fehlerhaften Zeilen und korrigieren Sie diese.",
      signatur: "int zaehleVokale(String text)",
      methode: "zaehleVokale",
      code: code([
        "int zaehleVokale(String text) {",
        "    int anzahl = 1;",
        "    for (int i = 0; i < text.length(); i++) {",
        "        char c = Character.toLowerCase(text.charAt(i));",
        "        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' && c == 'u') {",
        "            anzahl++;",
        "        }",
        "    }",
        "    return anzahl;",
        "}"
      ]),
      klassen: [],
      tests: [
        { eingabe: ["Lager"], erwartet: 2 },
        { eingabe: ["Buchung"], erwartet: 2 },
        { eingabe: ["OTTO"], erwartet: 2 },
        { eingabe: [""], erwartet: 0 }
      ],
      fehler: [
        { zeilen: [2], art: "init", fix: { 2: "int anzahl = 0;" },
          ru: "Счётчик начинают с 0. С anzahl = 1 для пустого слова метод вернёт 1, а для «Lager» — 3." },
        { zeilen: [5], art: "bedingung", fix: { 5: "if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {" },
          ru: "c == 'o' && c == 'u' никогда не true: один символ не может быть двумя буквами сразу. Нужно ИЛИ: c == 'o' || c == 'u'." }
      ],
      erklaerungRu: [
        "Сначала посчитай вручную, сколько гласных в каждом тестовом слове — это Soll.",
        "Сравни с «Получено»: результат всегда на 1 больше? Это признак неправильного начального значения.",
        "Для слов с o и u проверь условие: && (И) требует, чтобы обе части были true одновременно.",
        "Отметь строку и впиши исправленную строку целиком."
      ],
      hinweis: "Что метод должен вернуть для пустого слова? И может ли один символ быть одновременно 'o' и 'u'?",
      analyse: "Ошибка в строке 2: Anfangswert 1 — для пустой строки метод возвращает 1 вместо 0. Ошибка в строке 5: c == 'o' && c == 'u' всегда false, поэтому o и u не считаются. Правильно: … || c == 'o' || c == 'u'.",
      begriffe: [["der Vokal", "гласная"], ["der Zähler", "счётчик"], ["logisches UND (&&)", "логическое И"], ["logisches ODER (||)", "логическое ИЛИ"],
        ["die Initialisierung", "начальное присваивание"], ["Groß- und Kleinschreibung", "заглавные и строчные буквы"]]
    },
    {
      id: "durchschnitt-preis",
      typ: "fehler",
      titel: "Средняя цена товаров: одна ошибка",
      titelDe: "Durchschnittspreis im Lager",
      kontext: "Ein Lager verwaltet Artikel mit Preis und Bestand. Gesucht ist der Durchschnittspreis aller Artikel, die vorrätig sind (Bestand größer als 0). Gibt es keinen vorrätigen Artikel, ist das Ergebnis 0.0.",
      aufgabe: "Die Methode enthält einen semantischen Fehler. Markieren Sie die fehlerhafte Zeile und korrigieren Sie diese.",
      signatur: "double durchschnittPreis(List<Artikel> artikel)",
      methode: "durchschnittPreis",
      code: code([
        "double durchschnittPreis(List<Artikel> artikel) {",
        "    double summe = 0.0;",
        "    int anzahl = 0;",
        "    for (int i = 1; i < artikel.size(); i++) {",
        "        if (artikel.get(i).getBestand() > 0) {",
        "            summe = summe + artikel.get(i).getPreis();",
        "            anzahl++;",
        "        }",
        "    }",
        "    if (anzahl == 0) {",
        "        return 0.0;",
        "    }",
        "    return summe / anzahl;",
        "}"
      ]),
      klassen: [ARTIKEL],
      tests: [
        { eingabe: [[A("Kabel", 4.0, 10), A("Maus", 12.0, 0), A("Tastatur", 20.0, 3)]], erwartet: 12.0 },
        { eingabe: [[A("Monitor", 150.0, 2)]], erwartet: 150.0 },
        { eingabe: [[A("Stecker", 5.0, 0), A("Adapter", 7.0, 1)]], erwartet: 7.0 },
        { eingabe: [[]], erwartet: 0.0 }
      ],
      fehler: [
        { zeilen: [4], art: "grenze", fix: { 4: "for (int i = 0; i < artikel.size(); i++) {" },
          ru: "Список начинается с индекса 0. С i = 1 первый артикул пропускается." }
      ],
      erklaerungRu: [
        "Посмотри на тесты: какие проходят, а какие нет? Чем отличаются непройденные?",
        "Проведи Schreibtischtest для теста 2 (один артикул): сколько раз выполнится тело цикла?",
        "Индексы списка: от 0 до size() − 1.",
        "Один зелёный тест ещё не доказывает, что код правильный."
      ],
      hinweis: "С какого индекса начинается список? Какой артикул цикл никогда не смотрит?",
      analyse: "Ошибка в строке 4: цикл начинается с i = 1 и пропускает первый артикул (индекс 0). Тест 3 случайно проходит: там первый артикул не на складе. Тест 4 (пустой список) тоже проходит. Правильно: for (int i = 0; i < artikel.size(); i++).",
      begriffe: [["der Artikel", "товар"], ["vorrätig", "в наличии"], ["der Durchschnittspreis", "средняя цена"], ["der Startindex", "начальный индекс"],
        ["der Testfall", "тестовый случай"], ["semantischer Fehler", "смысловая ошибка"]]
    },

    /* ================================================== Was wird ausgegeben? (2) */
    {
      id: "muster-ausgabe",
      typ: "ausgabe",
      titel: "Что выведет: числовой узор",
      titelDe: "Zahlenmuster ausgeben",
      kontext: "Ein Lernprogramm zeigt ein Muster aus Produkten an. print schreibt ohne Zeilenumbruch, println beendet die Zeile.",
      aufgabe: "Was gibt die Methode für reihen = 4 aus? Schreiben Sie die Ausgabe zeilenweise auf.",
      signatur: "void zeigeMuster(int reihen)",
      methode: "zeigeMuster",
      code: code([
        "void zeigeMuster(int reihen) {",
        "    for (int r = 1; r <= reihen; r++) {",
        "        for (int f = 1; f <= r; f++) {",
        "            System.out.print(r * f + \" \");",
        "        }",
        "        System.out.println();",
        "    }",
        "    System.out.println(\"Ende\");",
        "}"
      ]),
      klassen: [],
      eingabe: [4],
      erklaerungRu: [
        "print пишет текст без перехода на новую строку, println — переводит строку после текста.",
        "println() без аргумента просто заканчивает текущую строку.",
        "Внутренний цикл зависит от r: в ряду r ровно r чисел.",
        "Пиши каждую строку вывода с новой строки. Пробелы в конце строки не важны."
      ],
      hinweis: "В ряду r печатаются r·1, r·2, …, r·r через пробел. После внутреннего цикла — переход строки. В самом конце — «Ende».",
      analyse: "Внешний цикл задаёт строки (r = 1 … 4), внутренний — числа в строке (f = 1 … r). print не переводит строку, поэтому числа стоят рядом; println() после внутреннего цикла завершает строку. После внешнего цикла выводится «Ende».",
      begriffe: [["die Ausgabe", "вывод"], ["zeilenweise", "построчно"], ["print / println", "вывод без перевода строки / с переводом"],
        ["der Zeilenumbruch", "перевод строки"], ["das Produkt", "произведение"], ["die verschachtelte Schleife", "вложенный цикл"]]
    },
    {
      id: "rabatt-ausgabe",
      typ: "ausgabe",
      titel: "Что выведет: скидки и while",
      titelDe: "Mengenrabatt ausgeben",
      kontext: "Ein Großhandel gibt Mengenrabatt: ab 100 Stück 10 %, ab 50 Stück 5 %. Die Mengen einer Bestellung stehen in einem Array. Die Menge 0 beendet die Liste.",
      aufgabe: "Was gibt die Methode für mengen = {120, 50, 49, 0, 300} aus? Schreiben Sie die vollständige Ausgabe auf.",
      signatur: "void druckeRabatte(int[] mengen)",
      methode: "druckeRabatte",
      code: code([
        "void druckeRabatte(int[] mengen) {",
        "    int i = 0;",
        "    while (i < mengen.length && mengen[i] > 0) {",
        "        if (mengen[i] >= 100) {",
        "            System.out.println(mengen[i] + \": 10 %\");",
        "        } else if (mengen[i] >= 50) {",
        "            System.out.println(mengen[i] + \": 5 %\");",
        "        } else {",
        "            System.out.println(mengen[i] + \": kein Rabatt\");",
        "        }",
        "        i++;",
        "    }",
        "    System.out.println(\"Ende nach \" + i);",
        "}"
      ]),
      klassen: [],
      eingabe: [[120, 50, 49, 0, 300]],
      erklaerungRu: [
        "Ветки if / else if / else проверяются сверху вниз; выполняется только первая подходящая.",
        ">= 50 включает саму границу: 50 >= 50 — true.",
        "Условие while проверяется перед каждым проходом. На 0 цикл останавливается.",
        "Пиши ровно то, что появится на экране, без кавычек: каждая команда println — новая строка."
      ],
      hinweis: "Порядок проверок важен: сначала >= 100, потом >= 50. На mengen[3] = 0 цикл останавливается — 300 не обрабатывается, а i в этот момент равно 3.",
      analyse: "120 → 10 %; 50 не >= 100, но >= 50 → 5 %; 49 → kein Rabatt. На mengen[3] = 0 условие mengen[i] > 0 даёт false, цикл заканчивается при i = 3. Поэтому последняя строка — «Ende nach 3», а 300 не выводится.",
      begriffe: [["der Mengenrabatt", "скидка за количество"], ["ab 100 Stück", "от 100 штук (включительно, >=)"], ["die Verzweigung", "ветвление"],
        ["die Schleifenbedingung", "условие цикла"], ["vollständig", "полностью"], ["der Großhandel", "оптовая торговля"]]
    }
  ];

  root.AP2_TRACE_AUFGABEN = AUFGABEN;
  if (typeof module === "object" && module.exports) module.exports = AUFGABEN;
})(typeof window !== "undefined" ? window : globalThis);
