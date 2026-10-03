/* Авторские упражнения AP2. Не оригинальные задания IHK и не прогноз экзамена. */
"use strict";
(function (root) {
  const zahl = (id, label, loesung, be) => ({ id, label, typ: "zahl", loesung, be: be || 1 });
  const folge = (id, label, loesung, be) => ({ id, label, typ: "folge", loesung, be: be || 1 });
  const kriterium = (id, text, be) => ({ id, text, be: be || 1 });
  const textfeld = () => [{ id: "antwort", label: "Ihre Lösung / Begründung", typ: "text" }];
  const daten = [
    {
      id: "test-trace", thema: "tests", bereich: "Testing", titel: "Переменные по шагам", minuten: 8,
      erklaerung: "Schreibtischtest — выполнить алгоритм на бумаге. После каждого прохода запиши значение переменной, даже если оно не изменилось. Номер элемента начинается с 0.",
      begriffe: [["Durchlauf", "проход цикла"], ["Zwischenwert", "промежуточное значение"]],
      beispiel: "Для [2, −1] и суммы только положительных чисел: сначала сумма 0; после 2 → 2; после −1 → 2. Возвращается 2.",
      hinweis: "Условие wert > 0 проверяется для каждого элемента. Отрицательный элемент оставляет сумму прежней.",
      varianten: [
        { auftrag: "Führen Sie einen Schreibtischtest für werte = [3, −2, 4] durch. Geben Sie summe nach jedem Schleifendurchlauf und den Rückgabewert an.",
          code: "summe ← 0\nfür jeden wert in werte\n    wenn wert > 0 dann summe ← summe + wert\ngib summe zurück",
          felder: [folge("verlauf", "summe nach jedem Durchlauf (mit Leerzeichen)", [3, 3, 7], 2), zahl("ergebnis", "Rückgabewert", 7)],
          loesung: "Zwischenwerte: 3, 3, 7. Rückgabewert: 7.", analyse: "3 добавляется; −2 не проходит условие; затем добавляется 4. Запись 3, 7 пропускает проход и не является полной трассировкой." },
        { auftrag: "Führen Sie einen Schreibtischtest für werte = [−4, 5, 1] durch. Geben Sie summe nach jedem Durchlauf und den Rückgabewert an.",
          code: "summe ← 0\nfür jeden wert in werte\n    wenn wert > 0 dann summe ← summe + wert\ngib summe zurück",
          felder: [folge("verlauf", "summe nach jedem Durchlauf", [0, 5, 6], 2), zahl("ergebnis", "Rückgabewert", 6)],
          loesung: "Zwischenwerte: 0, 5, 6. Rückgabewert: 6.", analyse: "Первый проход тоже нужен: отрицательное число оставляет сумму равной 0. Затем 0 + 5 = 5 и 5 + 1 = 6." }
      ]
    },
    {
      id: "test-grenzen", thema: "tests", bereich: "Testing", titel: "Граница цикла: последний индекс", minuten: 8,
      erklaerung: "У массива длины n допустимы индексы от 0 до n − 1. Слова bis einschließlich означают, что правая граница включена. Обращение к отсутствующему элементу здесь вызывает ошибку.",
      begriffe: [["Indexüberschreitung", "выход за границы массива"], ["einschließlich", "включительно"]],
      beispiel: "У [10, 20] длина 2 и индексы 0, 1. Цикл до 2 включительно ошибочен; исправленный цикл даёт сумму 30.",
      hinweis: "Сначала посчитай элементы. Первый недопустимый индекс равен длине, а не длине минус один.",
      varianten: [
        { auftrag: "werte = [2, 3, 4, 5]. Der folgende Code enthält einen Grenzfehler. Nennen Sie den ersten ungültigen Index und die Summe, die der korrigierte Code zurückgeben soll.",
          code: "summe ← 0\nfür i von 0 bis LÄNGE(werte) einschließlich\n    summe ← summe + werte[i]\ngib summe zurück",
          felder: [zahl("index", "Erster ungültiger Index", 4), zahl("summe", "Summe nach Korrektur", 14)],
          loesung: "Ungültiger Index: 4. Korrektur: i < LÄNGE(werte), also i = 0 bis 3. Summe: 14.", analyse: "Четыре элемента имеют индексы 0–3. Исходный код не возвращает 14: на индексе 4 он падает. Число 14 — ожидаемый результат после исправления." },
        { auftrag: "werte = [6, 1, 8]. Nennen Sie den ersten ungültigen Index im Code und die Summe nach Korrektur der Schleifengrenze.",
          code: "summe ← 0\nfür i von 0 bis LÄNGE(werte) einschließlich\n    summe ← summe + werte[i]\ngib summe zurück",
          felder: [zahl("index", "Erster ungültiger Index", 3), zahl("summe", "Summe nach Korrektur", 15)],
          loesung: "Ungültiger Index: 3. Korrektur: i < 3. Summe: 15.", analyse: "Массив из трёх элементов заканчивается на индексе 2. Не путай фактическую ошибку исходного кода с ожидаемым результатом исправленного." }
      ]
    },
    {
      id: "test-klassen", thema: "tests", bereich: "Testing", titel: "Классы и граничные тесты", minuten: 12,
      erklaerung: "Класс эквивалентности объединяет входы с одинаковым ожидаемым поведением. Граничные значения помогают найти ошибку < вместо ≤. Для каждого теста заранее укажи ожидаемый результат.",
      begriffe: [["Äquivalenzklasse", "класс эквивалентности"], ["Grenzwert", "граничное значение"], ["Soll / Ist", "ожидаемое / фактическое"]],
      beispiel: "Правило: допустимы целые числа 1–3. Классы: меньше 1, от 1 до 3, больше 3. Граничные проверки: 0→отказ, 1→принято, 3→принято, 4→отказ.",
      hinweis: "Здесь вход уже является целым числом. Не трать время на буквы; проверь обе границы диапазона и соседа снаружи.",
      varianten: [{ auftrag: "Eine Anmeldung akzeptiert ein ganzzahliges Alter von 18 bis 65 einschließlich. Leiten Sie die Äquivalenzklassen und vier Grenztests mit erwartetem Ergebnis ab. Beim Test Alter 65 meldet die Anwendung tatsächlich „abgelehnt“. Dokumentieren Sie diese Abweichung.",
        felder: textfeld(), rubrik: [kriterium("klassen", "Названы три класса: <18, 18–65, >65; указан допустимый класс."), kriterium("unten", "Тесты 17 → отказ и 18 → принято."), kriterium("oben", "Тесты 65 → принято и 66 → отказ."), kriterium("sollist", "Для 65 отдельно указаны Soll: принято; Ist: отказ; тест не пройден, возможная ошибка границы.")],
        loesung: "Klassen: Alter < 18 (ungültig), 18 ≤ Alter ≤ 65 (gültig), Alter > 65 (ungültig). Grenztests: 17 abgelehnt; 18 akzeptiert; 65 akzeptiert; 66 abgelehnt. Test 65: Soll akzeptiert, Ist abgelehnt, nicht bestanden. Möglicherweise wurde < 65 statt ≤ 65 implementiert.",
        analyse: "Возраст 30 покрывает допустимый класс, но не ловит ошибку на 65. Причина < вместо ≤ — гипотеза, а не доказанный факт; фактическое отклонение зафиксировано точно." }]
    },
    {
      id: "test-zweige", thema: "tests", bereich: "Testing", titel: "Покрытие ветвей", minuten: 10,
      erklaerung: "У каждого if два исхода: wahr и falsch. Покрытие ветвей = выполненные исходы / все исходы. Два независимых if дают четыре исхода; это не количество возможных полных путей.",
      begriffe: [["Zweigüberdeckung", "покрытие ветвей"], ["Testfall", "тестовый случай"]],
      beispiel: "Один if x > 0: тест x = 2 выполняет только wahr, покрытие 1/2 = 50 %. Добавление x = 0 даёт 2/2 = 100 %.",
      hinweis: "Для каждого if составь две клетки: true и false. Отметь, какие из них выполнены хотя бы одним тестом.",
      varianten: [
        { auftrag: "Zwei unabhängige IF-Anweisungen haben je einen Wahr- und Falsch-Zweig. Tests: (punkte=60, bonus=0) und (punkte=40, bonus=5). Wie viele der vier Zweige werden ausgeführt? Berechnen Sie die Zweigüberdeckung in Prozent.",
          code: "wenn punkte ≥ 50 dann status ← bestanden\nsonst status ← nicht_bestanden\nwenn bonus > 0 dann belohnung ← ja\nsonst belohnung ← nein",
          felder: [zahl("zweige", "Ausgeführte Zweige", 4), zahl("prozent", "Zweigüberdeckung (Zahl ohne %)", 100)],
          loesung: "4 von 4 Zweigen, 100 %.", analyse: "Первый тест: true у первого if, false у второго. Второй: false и true. Все четыре исхода выполнены. Это ещё не доказывает отсутствие ошибок и не равно покрытию всех путей." },
        { auftrag: "Tests: (punkte=20, bonus=0) und (punkte=40, bonus=0). Wie viele der vier Zweige werden ausgeführt? Berechnen Sie die Zweigüberdeckung.",
          code: "wenn punkte ≥ 50 dann status ← bestanden\nsonst status ← nicht_bestanden\nwenn bonus > 0 dann belohnung ← ja\nsonst belohnung ← nein",
          felder: [zahl("zweige", "Ausgeführte Zweige", 2), zahl("prozent", "Zweigüberdeckung (Zahl ohne %)", 50)],
          loesung: "2 verschiedene Zweige von 4, also 50 %.", analyse: "Повторное выполнение false-ветвей не добавляет покрытия. Нужен ещё тест, который выполняет true-исходы." }
      ]
    },
    {
      id: "algo-objekte", thema: "algo", bereich: "Algorithmen", titel: "Список объектов: отбор и сумма", minuten: 15,
      erklaerung: "Обход списка объектов: сначала задать начальное значение, затем проверить все условия для каждого объекта, затем вернуть итог после цикла. Пустой список тоже должен иметь определённый результат.",
      begriffe: [["Datensatz", "запись"], ["Bedingung", "условие"], ["Rückgabewert", "возвращаемое значение"]],
      beispiel: "Сумма открытых счетов: summe ← 0; для каждого счёта, если offen = wahr, добавить betrag; после цикла вернуть summe. Для пустого списка возвращается 0.",
      hinweis: "Нужно логическое UND: заказ не отменён И ещё не оплачен. return внутри цикла обрывает обработку остальных заказов.",
      varianten: [{ auftrag: "Entwickeln Sie Pseudocode für offeneSumme(auftraege). Summieren Sie betrag nur, wenn bezahlt = falsch UND storniert = falsch. Bei leerer Liste soll 0 zurückgegeben werden. Testdaten: [{betrag:40, bezahlt:falsch, storniert:falsch}, {betrag:20, bezahlt:wahr, storniert:falsch}, {betrag:15, bezahlt:falsch, storniert:wahr}, {betrag:35, bezahlt:falsch, storniert:falsch}]. Nennen Sie auch den Rückgabewert für diese Daten.",
        felder: textfeld(), rubrik: [kriterium("initial", "Итог инициализирован 0; пустой список возвращает 0."), kriterium("loop", "Обрабатывается каждый заказ списка."), kriterium("filter", "Суммируются только заказы с bezahlt=false И storniert=false."), kriterium("return", "Итог возвращается после цикла, без изменения исходных объектов."), kriterium("result", "Для примера получено 40 + 35 = 75.")],
        loesung: "funktion offeneSumme(auftraege)\n    summe ← 0\n    für jeden auftrag in auftraege\n        wenn NICHT auftrag.bezahlt UND NICHT auftrag.storniert\n            summe ← summe + auftrag.betrag\n    gib summe zurück\nBeispiel: 75. Leere Liste: 0.",
        analyse: "Здесь проверяется твоя собственная реализация по рубрике. Программа не исполняет введённый код. Сверь отдельно обычный пример, отменённый заказ и пустой список; совпадение одного итогового числа ещё не доказывает правильность алгоритма." }]
    },
    {
      id: "algo-strings", thema: "algo", bereich: "Algorithmen", titel: "Строки: нормализация и точное сравнение", minuten: 10,
      erklaerung: "TRIM убирает пробелы по краям; KLEIN делает буквы строчными. Проверка на равенство строке fehler не принимает строку fehlerhaft. Порядок и индексы исходного списка сохраняются.",
      begriffe: [["Zeichenkette", "строка"], ["Leerzeichen", "пробел"], ["Gleichheit", "равенство"]],
      beispiel: "Для [\" OK \", \"okay\"] после нормализации получится [\"ok\", \"okay\"]. Равна \"ok\" только строка с индексом 0.",
      hinweis: "Сначала мысленно нормализуй каждую строку. Затем сравни всю строку, а не её начало.",
      varianten: [
        { auftrag: "meldungen = [\" Fehler \", \"warnung\", \"FEHLER\", \"fehlerhaft\"]. Gezählt werden nur Einträge mit KLEIN(TRIM(text)) = \"fehler\". Geben Sie die Anzahl und die passenden Indizes (ab 0) in Reihenfolge an.", felder: [zahl("anzahl", "Anzahl", 2), folge("indizes", "Indizes", [0, 2])],
          loesung: "Anzahl: 2. Indizes: 0, 2.", analyse: "После нормализации строки 0 и 2 равны fehler. fehlerhaft — другое слово и не должно пройти точное сравнение." },
        { auftrag: "meldungen = [\" fehler \", \"Fehler\", \"FEHLER\", \"ok\"]. Gezählt werden nur Einträge mit KLEIN(TRIM(text)) = \"fehler\". Geben Sie Anzahl und Indizes ab 0 an.", felder: [zahl("anzahl", "Anzahl", 3), folge("indizes", "Indizes", [0, 1, 2])],
          loesung: "Anzahl: 3. Indizes: 0, 1, 2.", analyse: "Разница в регистре и внешних пробелах исчезает при нормализации. Последняя строка ok не подходит." }
      ]
    },
    {
      id: "algo-leer", thema: "algo", bereich: "Algorithmen", titel: "Пустые данные и отрицательные числа", minuten: 10,
      erklaerung: "Максимум нельзя всегда начинать с 0: все числа могут быть отрицательными. Сначала обрабатывается пустой список, затем максимум инициализируется первым элементом.",
      begriffe: [["leere Liste", "пустой список"], ["Initialisierung", "начальное значение"]],
      beispiel: "Для [−8, −3] максимум −3, а не 0. Для [] наш договор возвращает слово kein; это не число.",
      hinweis: "Проверка пустоты происходит до обращения к werte[0]. Сравнивай отрицательные числа по их обычному порядку.",
      varianten: [
        { auftrag: "Bestimmen Sie die Rückgaben für [] und [−7, −2, −5].", code: "wenn LÄNGE(werte) = 0 dann gib kein zurück\nmaximum ← werte[0]\nfür jeden wert in werte\n    wenn wert > maximum dann maximum ← wert\ngib maximum zurück", felder: [folge("leer", "Rückgabe für [] (ein Wort)", ["kein"]), zahl("wert", "Rückgabe für die Zahlenliste", -2)], loesung: "[] → kein; [−7, −2, −5] → −2.", analyse: "Защита от пустого списка предотвращает доступ к несуществующему индексу. Для непустого списка итог остаётся одним из его элементов." },
        { auftrag: "Bestimmen Sie die Rückgaben für [] und [−9, −6, −8].", code: "wenn LÄNGE(werte) = 0 dann gib kein zurück\nmaximum ← werte[0]\nfür jeden wert in werte\n    wenn wert > maximum dann maximum ← wert\ngib maximum zurück", felder: [folge("leer", "Rückgabe für [] (ein Wort)", ["kein"]), zahl("wert", "Rückgabe für die Zahlenliste", -6)], loesung: "[] → kein; [−9, −6, −8] → −6.", analyse: "Максимальное из отрицательных чисел ближе к нулю. Начальное maximum=0 здесь дало бы неверный результат." }
      ]
    },
    {
      id: "algo-return", thema: "algo", bereich: "Algorithmen", titel: "Почему return обрывает цикл", minuten: 8,
      erklaerung: "return завершает всю функцию. Он не означает «перейти к следующему элементу». Если нужен итог по всему списку, возврат обычно находится после цикла.",
      begriffe: [["vorzeitiger Abbruch", "досрочное завершение"], ["Einrückung", "отступ, показывающий вложенность"]],
      beispiel: "Для [1, 3] возврат суммы внутри первого прохода даёт 1. После цикла он даёт 4.",
      hinweis: "Следи за отступом строки gib summe zurück: она входит в тело цикла.",
      varianten: [
        { auftrag: "werte = [4, 5, 7]. Bestimmen Sie den tatsächlichen Rückgabewert und den gewünschten Rückgabewert nach Verschieben von return hinter die Schleife.", code: "summe ← 0\nfür jeden wert in werte\n    summe ← summe + wert\n    gib summe zurück", felder: [zahl("ist", "Tatsächlicher Rückgabewert", 4), zahl("soll", "Rückgabewert nach Korrektur", 16)], loesung: "Ist: 4. Nach Korrektur: 16. return steht außerhalb der Schleife.", analyse: "После первого элемента функция уже завершена. Значения 5 и 7 исходный код не обрабатывает. Для пустого списка исправленная функция вернула бы 0." },
        { auftrag: "werte = [2, 9, 3]. Bestimmen Sie den tatsächlichen Rückgabewert und den Wert nach Verschieben von return hinter die Schleife.", code: "summe ← 0\nfür jeden wert in werte\n    summe ← summe + wert\n    gib summe zurück", felder: [zahl("ist", "Tatsächlicher Rückgabewert", 2), zahl("soll", "Rückgabewert nach Korrektur", 14)], loesung: "Ist: 2. Nach Korrektur: 14.", analyse: "Не исполняй мысленно оставшиеся проходы после return. Исправление должно сохранить суммирование всех элементов и дать определённый результат для пустого списка." }
      ]
    },
    {
      id: "uml-sequenz", thema: "oop", bereich: "Modelle", titel: "Sequence: кто кому отправляет сообщение", minuten: 15,
      erklaerung: "Sequence показывает взаимодействие участников во времени сверху вниз. У сообщения есть отправитель, получатель и данные. Для альтернативного поведения можно использовать блок alt с условиями.",
      begriffe: [["Lebenslinie", "линия жизни участника"], ["Nachricht", "сообщение"], ["alt-Fragment", "альтернативные ветви"]],
      beispiel: "Login: Nutzer → UI: anmelden(name); UI → Dienst: pruefen(name); Dienst → UI: Ergebnis. Ветка [gültig] открывает экран, [ungültig] показывает ошибку.",
      hinweis: "UI не должна сама читать базу. Сначала сервис проверяет наличие, затем либо сохраняет бронь, либо сообщает об отказе.",
      varianten: [{ auftrag: "Modellieren Sie die Reservierung eines Buchs als Sequenzdiagramm oder als geordnete Liste „Sender → Empfänger: Nachricht“. Teilnehmer: Kunde, UI, Reservierungsdienst, Repository. Der Dienst prüft die Verfügbarkeit. Bei Verfügbarkeit speichert er die Reservierung und bestätigt sie; sonst erhält der Kunde eine Ablehnung. Zeigen Sie beide Alternativen mit Bedingungen.", felder: textfeld(), rubrik: [kriterium("teilnehmer", "Есть все четыре участника и направление сообщений."), kriterium("pruefung", "Запрос от клиента через UI идёт сервису; сервис проверяет доступность через Repository."), kriterium("alt", "Ветви [verfügbar] и [nicht verfügbar] разделены; сохранение только в первой."), kriterium("antwort", "Результат проверки/сохранения возвращается через сервис и UI клиенту; порядок не противоречит процессу.")],
        loesung: "Kunde → UI: reservieren(buchId)\nUI → Reservierungsdienst: reservieren(kundeId, buchId)\nReservierungsdienst → Repository: istVerfügbar(buchId)\nRepository → Reservierungsdienst: verfügbar\nalt [verfügbar]\n  Dienst → Repository: reservierungSpeichern(kundeId, buchId)\n  Repository → Dienst: reservierungsId\n  Dienst → UI: bestätigt(reservierungsId)\n  UI → Kunde: Bestätigung\nelse [nicht verfügbar]\n  Dienst → UI: abgelehnt\n  UI → Kunde: Ablehnung\nend",
        analyse: "Сопоставь каждое сообщение с действием из условия. Ветви не идут одна после другой: выполняется только одна. Текстовая запись проверяет смысл взаимодействия; графическую UML-нотацию нужно дополнительно сверить на бумаге." }]
    },
    {
      id: "uml-zustand", thema: "oop", bereich: "Modelle", titel: "State: событие, условие и переход", minuten: 15,
      erklaerung: "State описывает состояние одного объекта. Переход записывается как событие [условие] / действие. Если условие ложно, переход не происходит.",
      begriffe: [["Zustand", "состояние"], ["Ereignis", "событие"], ["Wächterbedingung", "условие перехода"]],
      beispiel: "Tür: geschlossen → geöffnet по событию öffnen [entriegelt]. Если дверь заперта, то событие öffnen оставляет её закрытой.",
      hinweis: "Состояние — это «оплачено», событие — «оплатить». Не смешивай их. Укажи исходное состояние и запрет изменения финального состояния.",
      varianten: [{ auftrag: "Eine Bestellung startet in Neu. zahlen wechselt bei erfolgreicher Zahlung nach Bezahlt; bei Fehlschlag bleibt sie Neu. versenden ist nur aus Bezahlt möglich und führt nach Versendet. stornieren ist aus Neu oder Bezahlt möglich und führt nach Storniert. Versendet und Storniert sind Endzustände. Notieren Sie alle Übergänge mit Bedingungen sowie den Endzustand nach: zahlen(erfolgreich), versenden, stornieren.", felder: textfeld(), rubrik: [kriterium("start", "Начальное состояние Neu; названы Bezahlt, Versendet, Storniert."), kriterium("zahlung", "Оплата: Neu → Bezahlt только при успехе; отказ оставляет Neu."), kriterium("wechsel", "Отправка только из Bezahlt; отмена только из Neu или Bezahlt."), kriterium("ende", "Оба финальных состояния терминальны; последовательность заканчивается Versendet, поздняя отмена отклоняется.")],
        loesung: "Start → Neu\nNeu → Bezahlt: zahlen [erfolgreich]\nNeu → Neu: zahlen [fehlgeschlagen]\nBezahlt → Versendet: versenden\nNeu → Storniert: stornieren\nBezahlt → Storniert: stornieren\nVersendet, Storniert → Ende\nEreignisfolge: Neu → Bezahlt → Versendet; stornieren wird abgelehnt.", analyse: "После отправки отмена не возвращает заказ назад: условие прямо запрещает такой переход. Важны разрешённые исходные состояния, а не только названия стрелок." }]
    },
    {
      id: "uml-usecase", thema: "oop", bereich: "Modelle", titel: "Use Case: цель пользователя и граница системы", minuten: 12,
      erklaerung: "Use Case показывает, кто использует систему для какой цели. Это не последовательность технических методов. Include уместен для обязательного повторно используемого поведения.",
      begriffe: [["Akteur", "внешний участник"], ["Systemgrenze", "граница системы"], ["include", "обязательное включение поведения"]],
      beispiel: "Для банкомата клиент — актор, «снять деньги» — его цель. «Записать строку в таблицу» обычно внутренняя деталь, а не цель клиента.",
      hinweis: "Выдели две роли и их цели. Платёжный провайдер находится вне системы. Для include стрелка направлена к включаемому поведению.",
      varianten: [{ auftrag: "Ein Shop erlaubt Kunden, Bestellungen aufzugeben, und Mitarbeitern, Bestellungen zu versenden. Jede Bestellung umfasst zwingend die Zahlungsabwicklung über einen externen Zahlungsdienst. Skizzieren Sie Akteure, Systemgrenze und Anwendungsfälle; stellen Sie die obligatorische Einbindung der Zahlungsabwicklung dar und erläutern Sie die Richtung der Beziehung.", felder: textfeld(), rubrik: [kriterium("akteure", "Kunde, Mitarbeiter, Zahlungsdienst находятся вне границы Shop."), kriterium("ziele", "Внутри системы: Bestellung aufgeben, Bestellung versenden, Zahlung abwickeln; роли связаны со своими целями."), kriterium("include", "Bestellung aufgeben → Zahlung abwickeln с «include»; направление к включаемому случаю."), kriterium("grenze", "Платёжный сервис связан с оплатой; техническая БД не выдана за пользовательскую цель.")],
        loesung: "Systemgrenze: Shop. Akteure außen: Kunde, Mitarbeiter, Zahlungsdienst. Kunde — Bestellung aufgeben; Mitarbeiter — Bestellung versenden; Zahlungsdienst — Zahlung abwickeln. Bestellung aufgeben --«include»--> Zahlung abwickeln. Die Zahlung ist laut Aufgabenstellung obligatorisch.", analyse: "В реальном магазине могли бы быть другие способы оплаты, но здесь модель следует конкретному условию. Include не означает «следующий шаг во времени»." }]
    },
    {
      id: "oop-kapselung", thema: "oop", bereich: "Modelle", titel: "OOP: защитить состояние объекта", minuten: 12,
      erklaerung: "Инкапсуляция сохраняет правила объекта: внешний код не должен произвольно менять состояние. Метод проверяет вход и меняет объект только при выполнении условий.",
      begriffe: [["private", "доступ только внутри класса"], ["Invariante", "правило, которое всегда сохраняется"], ["öffentliche Methode", "доступный снаружи метод"]],
      beispiel: "Счётчик не может стать отрицательным. private wert и метод vermindern(n), проверяющий n>0 и n≤wert, сохраняют это правило.",
      hinweis: "Проверить надо и положительность количества, и достаточный остаток. При отказе остаток не меняется.",
      varianten: [{ auftrag: "Entwerfen Sie eine Klasse Lagerartikel mit nicht negativem bestand. Außen darf bestand nur gelesen werden. Die Methode entnehmen(menge) liefert wahr bei Erfolg und falsch bei ungültiger Menge oder unzureichendem Bestand; bei Fehler bleibt der Bestand unverändert. Geben Sie Attribute, Sichtbarkeiten und Pseudocode an. Nennen Sie Tests für menge = 0, menge = bestand und menge > bestand.", felder: textfeld(), rubrik: [kriterium("private", "bestand private; чтение через getter, нет свободного setter; начальное значение тоже проверяется."), kriterium("guard", "При menge≤0 или menge>bestand возвращается false до изменения состояния."), kriterium("mutation", "При успехе вычитается menge и возвращается true; отрицательный остаток невозможен."), kriterium("tests", "0→false/без изменения; всё количество→true/остаток0; больше остатка→false/без изменения.")],
        loesung: "private bestand; Konstruktor akzeptiert nur bestand ≥ 0. public getBestand().\npublic entnehmen(menge):\n    wenn menge ≤ 0 ODER menge > bestand dann gib falsch zurück\n    bestand ← bestand − menge\n    gib wahr zurück\nTests bei bestand=5: 0 → falsch, Bestand 5; 5 → wahr, Bestand 0; 6 → falsch, Bestand 5. Jeder Test startet unabhängig mit 5.", analyse: "Тесты должны начинаться с заданного исходного состояния независимо друг от друга. Одно private без проверки метода не сохраняет инвариант." }]
    },
    {
      id: "ga1-anforderung", thema: "anforderungen", bereich: "GA1", titel: "Требование, приёмка и выбор архитектуры", minuten: 15,
      erklaerung: "Требование описывает наблюдаемое поведение, критерий приёмки — как его проверить. Архитектуру обосновывают условиями проекта, а не тем, что технология популярна.",
      begriffe: [["Akzeptanzkriterium", "проверяемый критерий приёмки"], ["begründen", "обосновать причинную связь"], ["Zielkonflikt", "конфликт целей"]],
      beispiel: "«Система быстрая» непроверяемо. «При 20 одновременных пользователях 95 % запросов списка завершаются за ≤2 секунды на тестовом стенде» даёт измеримый критерий.",
      hinweis: "Укажи вход/действие/ожидаемый результат. Для архитектуры сопоставь простоту эксплуатации и необходимость независимого масштабирования.",
      varianten: [{ auftrag: "Drei Entwickler bauen in zwölf Wochen ein internes Ticketsystem für 80 Beschäftigte. Ein Ticket benötigt Titel und Beschreibung; ohne Titel darf es nicht gespeichert werden. Formulieren Sie eine funktionale Anforderung und zwei prüfbare Akzeptanzkriterien. Empfehlen Sie einen modularen Monolithen oder getrennte Microservices und begründen Sie die Entscheidung anhand der Randbedingungen; nennen Sie einen Nachteil Ihrer Wahl.", felder: textfeld(), rubrik: [kriterium("anforderung", "Функциональное требование описывает создание тикета с обязательными данными."), kriterium("positiv", "Положительный сценарий с данными и наблюдаемым результатом: запись/ID/отображение."), kriterium("negativ", "Отрицательный сценарий: пустой заголовок, сообщение об ошибке, запись не создана."), kriterium("architektur", "Выбор связан с командой/сроком/масштабом; назван реальный недостаток, а не обещание абсолютного превосходства.")],
        loesung: "Anforderung: Beschäftigte können ein Ticket mit Titel und Beschreibung erstellen.\nAkzeptanz: Bei Titel „Drucker defekt“ und Beschreibung wird genau ein Ticket mit ID gespeichert und angezeigt. Bei leerem Titel erscheint ein verständlicher Hinweis; kein Ticket wird gespeichert.\nEin modularer Monolith reduziert für drei Entwickler und zwölf Wochen den Aufwand für Deployment und verteilte Kommunikation. Nachteil: einzelne Module lassen sich nicht unabhängig als Dienste skalieren. Eine andere Wahl ist bei nachvollziehbarer Abwägung möglich.", analyse: "Не переписывай просто «должно работать». Критерий должен позволять другому человеку однозначно провести тест. Архитектурный ответ оценивается по аргументам и ограничениям, не по совпадению одного слова." }]
    },
    {
      id: "ga1-api", thema: "rest", bereich: "GA1", titel: "Контракт API и ошибки", minuten: 15,
      erklaerung: "Контракт интерфейса определяет запрос, данные и ответы. Клиенту нужен различимый результат как при успехе, так и при ошибке. Валидация на сервере обязательна по условию этой задачи.",
      begriffe: [["Schnittstellenvertrag", "контракт интерфейса"], ["Validierung", "проверка входа"], ["Konflikt", "конфликт состояния"]],
      beispiel: "POST /tickets с {titel, beschreibung}: при успехе объект с id; при пустом titel структурированная ошибка с названием поля. Сообщение «что-то пошло не так» недостаточно для клиента.",
      hinweis: "Опиши метод и путь, обязательные поля, успешный ответ и разные ошибки. Конфликт бронирования — не то же самое, что неправильный формат даты.",
      varianten: [{ auftrag: "Entwerfen Sie einen JSON-basierten HTTP-Vertrag zum Reservieren eines Raums. Eingaben: raumId, beginn, ende. beginn muss vor ende liegen. Überlappende Reservierungen sind unzulässig. Legen Sie Methode/Pfad, ein Beispiel des Request-Bodys, die erfolgreiche Antwort sowie Fehler für ungültige Daten und eine Überschneidung fest. Die Prüfung muss auf dem Server erfolgen.", felder: textfeld(), rubrik: [kriterium("vertrag", "POST и осмысленный путь; JSON с raumId, beginn, ende и однозначным временем."), kriterium("validierung", "Сервер проверяет обязательные поля, формат и beginn<ende; неверные данные дают 400 или 422 с понятными деталями."), kriterium("erfolg", "При успехе 201 и идентификатор/представление созданной брони."), kriterium("konflikt", "Пересечение даёт 409; проверка/запись защищены от одновременного создания конфликтующих броней.")],
        loesung: "POST /reservierungen\n{\"raumId\":12,\"beginn\":\"2027-01-15T10:00:00+01:00\",\"ende\":\"2027-01-15T11:00:00+01:00\"}\n201: {\"id\":42,\"raumId\":12,...}\n400 oder 422: {\"code\":\"ungueltiger_zeitraum\",\"feld\":\"ende\"}\n409: {\"code\":\"raum_belegt\"}\nServer validiert Daten; Konfliktprüfung und Speichern bilden eine gegen konkurrierende Buchungen geschützte Operation.", analyse: "Согласованность важнее выученного имени пути. Проверка «свободно» перед отдельной записью без защиты гонки может пропустить две одновременные брони; это нужно учитывать в контракте и реализации." }]
    },
    {
      id: "ga1-sicherheit", thema: "auth", bereich: "GA1", titel: "Права доступа: риск и проверяемая защита", minuten: 12,
      erklaerung: "Аутентификация устанавливает личность, авторизация разрешает конкретное действие над конкретным объектом. Скрытая кнопка не заменяет проверку на сервере.",
      begriffe: [["Authentifizierung", "проверка личности"], ["Autorisierung", "проверка прав"], ["Berechtigung", "право доступа"]],
      beispiel: "Пользователь вошёл в систему, но не должен читать чужой заказ. Проверять надо владельца заказа на сервере при каждом запросе.",
      hinweis: "Свяжи каждую защиту с риском и тестом. Проверь попытку изменить чужой объект прямым запросом, без кнопки UI.",
      varianten: [{ auftrag: "Ein Ticketsystem erlaubt Beschäftigten, nur eigene Tickets zu lesen und zu ändern. Support darf alle Tickets lesen und bearbeiten. Eine Anmeldung existiert bereits. Ein Entwickler blendet fremde Tickets lediglich im Browser aus. Erläutern Sie den Fehler, eine serverseitige Gegenmaßnahme, zwei negative Sicherheitstests und einen sinnvollen Protokolleintrag ohne sensible Inhalte.", felder: textfeld(), rubrik: [kriterium("risiko", "Прямой запрос чужого ticketId может обойти скрытие UI; вход в систему не даёт права на все объекты."), kriterium("server", "На сервере каждый доступ проверяет владельца или роль Support; по умолчанию запрещён."), kriterium("tests", "Отдельные попытки чтения и изменения чужого тикета отклоняются; данные не выдаются и не меняются."), kriterium("log", "Лог содержит время, actorId, действие, объект и отказ; без токена, пароля и текста тикета.")],
        loesung: "Der Browser ist keine Berechtigungsgrenze. Der Server prüft für jedes Ticket: Eigentümer = angemeldeter Nutzer ODER Rolle = Support. Sonst Zugriff verweigern. Test 1: Beschäftigter A liest Ticket von B → abgelehnt, kein Inhalt. Test 2: A ändert Ticket von B → abgelehnt, unverändert. Audit: Zeitpunkt, Nutzer-ID, Ticket-ID, Aktion, Ergebnis „verweigert“; keine Zugangstoken oder Ticketinhalte.", analyse: "Названия защиты без связи с угрозой недостаточны. Скажи, где именно проходит проверка и какой отрицательный тест доказывает её действие." }]
    },
    {
      id: "ga1-kosten", thema: "anforderungen", bereich: "GA1", titel: "Сравнить затраты и точку равенства", minuten: 12,
      erklaerung: "Сначала раздели разовые и ежемесячные затраты. Общая стоимость за m месяцев = разовые + m × ежемесячные. Точка равенства не учитывает качество, риски и время персонала, если они не заданы.",
      begriffe: [["einmalige Kosten", "разовые затраты"], ["laufende Kosten", "регулярные затраты"], ["Kostenvergleich", "сравнение затрат"]],
      beispiel: "A: 1000 € разово + 50 €/месяц; B: 150 €/месяц. Равенство: 1000+50m=150m → m=10. После 10 месяцев A дешевле при этих исходных данных.",
      hinweis: "Сложи все ежемесячные статьи тарифа. Для точки равенства раздели разовую сумму на разницу ежемесячных затрат.",
      varianten: [
        { auftrag: "Vergleichen Sie 36 Monate. Eigenlösung: einmalig 3.600 €, laufend 60 €/Monat. SaaS: Lizenz 150 €/Monat plus Betrieb 30 €/Monat, keine Startkosten. Alle Beträge netto; weitere Kosten bleiben laut Aufgabe außer Betracht. Berechnen Sie beide Gesamtkosten und den Monat, in dem die Kosten gleich hoch sind.", felder: [zahl("eigen", "Gesamtkosten Eigenlösung (Euro ohne Tausendertrenner)", 5760), zahl("saas", "Gesamtkosten SaaS (Euro ohne Tausendertrenner)", 6480), zahl("monat", "Kosten gleich nach wie vielen Monaten?", 30)], loesung: "Eigenlösung: 3600 + 36×60 = 5760 €. SaaS: 36×(150+30) = 6480 €. Gleichstand: 3600/(180−60) = 30 Monate. Nach 36 Monaten ist die Eigenlösung 720 € günstiger.", analyse: "180, а не 150 евро — полная ежемесячная стоимость SaaS. В месяце 30 затраты равны; только после него самостоятельное решение дешевле. Экономическое решение также зависит от рисков, не заданных здесь." },
        { auftrag: "Vergleichen Sie 36 Monate. Eigenlösung: 2.400 € einmalig und 40 €/Monat. SaaS: Lizenz 120 €/Monat plus Betrieb 20 €/Monat, keine Startkosten. Netto; keine weiteren Kosten. Berechnen Sie die Gesamtkosten und den Zeitpunkt gleicher Kosten.", felder: [zahl("eigen", "Gesamtkosten Eigenlösung (Euro ohne Tausendertrenner)", 3840), zahl("saas", "Gesamtkosten SaaS (Euro ohne Tausendertrenner)", 5040), zahl("monat", "Kosten gleich nach wie vielen Monaten?", 24)], loesung: "Eigenlösung: 2400 + 36×40 = 3840 €. SaaS: 36×140 = 5040 €. Gleichstand: 2400/(140−40) = 24 Monate.", analyse: "Не переноси ответ 30 из первого варианта: здесь меняются и разовая сумма, и ежемесячная разница. Сначала составь собственное уравнение." }
      ]
    }
  ];
  root.AP2_PRAXIS = daten;
  if (typeof module === "object" && module.exports) module.exports = daten;
})(typeof window !== "undefined" ? window : globalThis);
