/* Нормализация шаг за шагом — 4 авторских сценария (не копии IHK).
   Для каждого сценария:
   ausgang     — ненормализованная таблица; массив в ячейке = несколько значений (Wiederholungsgruppe)
   zerlegung   — какой исходный столбец распадается на какие столбцы 1NF (составные значения)
   nf1         — таблица в 1NF с примерами строк (из неё вычисляются примеры для 2NF/3NF)
   schluessel  — первичный ключ таблицы 1NF
   abh         — функциональные зависимости: неключевой атрибут → von (детерминанта), warum (по-русски)
   nf2 / nf3   — эталонные таблицы (pk, fk: {столбец: таблица})
   beziehungen — связи итоговых таблиц: a art b (1:n, n:1, n:m über …) */
"use strict";
(function (root) {
  const S = [
    {
      id: "kurs",
      titel: "Volkshochschule: Kursanmeldung",
      ru: "Курсы народного университета: участники записываются на курсы.",
      situation: [
        "Eine Volkshochschule speichert alle Kursanmeldungen in einer Tabelle.",
        "Ein Teilnehmer kann mehrere Kurse buchen. Ein Kurs hat viele Teilnehmer.",
        "Jeder Kurs hat einen festen Preis. Zu jeder PLZ gehört genau ein Ort."
      ],
      situationRu: "Народный университет хранит все записи на курсы в одной таблице. Участник может записаться на несколько курсов, у курса много участников. У каждого курса фиксированная цена. Каждому почтовому индексу (PLZ) соответствует ровно один город (Ort).",
      ausgang: {
        name: "Kursanmeldung",
        spalten: ["TeilnehmerNr", "Name", "Wohnort", "Kurse", "Preis", "Anmeldedatum"],
        zeilen: [
          ["101", "Kowalski", "04109 Leipzig", ["K12 Excel Grundlagen", "K14 Word kompakt"], ["89 €", "59 €"], ["02.09.2026", "05.09.2026"]],
          ["102", "Schulz", "04416 Markkleeberg", ["K12 Excel Grundlagen"], ["89 €"], ["03.09.2026"]],
          ["103", "Nguyen", "04229 Leipzig", ["K14 Word kompakt", "K20 Spanisch A1"], ["59 €", "120 €"], ["03.09.2026", "10.09.2026"]],
          ["104", "Schulz", "04109 Leipzig", ["K25 Fotografie"], ["59 €"], ["11.09.2026"]],
          ["105", "Becker", "04416 Markkleeberg", ["K12 Excel Grundlagen", "K21 Spanisch A1"], ["89 €", "140 €"], ["12.09.2026", "12.09.2026"]]
        ]
      },
      zerlegung: { Wohnort: ["PLZ", "Ort"], Kurse: ["KursNr", "Kurstitel"] },
      nf1: {
        name: "Kursanmeldung",
        spalten: ["TeilnehmerNr", "Name", "PLZ", "Ort", "KursNr", "Kurstitel", "Preis", "Anmeldedatum"],
        zeilen: [
          ["101", "Kowalski", "04109", "Leipzig", "K12", "Excel Grundlagen", "89 €", "02.09.2026"],
          ["101", "Kowalski", "04109", "Leipzig", "K14", "Word kompakt", "59 €", "05.09.2026"],
          ["102", "Schulz", "04416", "Markkleeberg", "K12", "Excel Grundlagen", "89 €", "03.09.2026"],
          ["103", "Nguyen", "04229", "Leipzig", "K14", "Word kompakt", "59 €", "03.09.2026"],
          ["103", "Nguyen", "04229", "Leipzig", "K20", "Spanisch A1", "120 €", "10.09.2026"],
          ["104", "Schulz", "04109", "Leipzig", "K25", "Fotografie", "59 €", "11.09.2026"],
          ["105", "Becker", "04416", "Markkleeberg", "K12", "Excel Grundlagen", "89 €", "12.09.2026"],
          ["105", "Becker", "04416", "Markkleeberg", "K21", "Spanisch A1", "140 €", "12.09.2026"]
        ]
      },
      schluessel: ["TeilnehmerNr", "KursNr"],
      schluesselWarum: {
        TeilnehmerNr: "Один курс посещают многие участники — одного KursNr мало.",
        KursNr: "Один участник записан на несколько курсов — одного TeilnehmerNr мало."
      },
      abh: {
        Name: { von: ["TeilnehmerNr"], warum: "Фамилия — свойство участника. Курс на неё не влияет." },
        PLZ: { von: ["TeilnehmerNr"], warum: "Почтовый индекс — часть адреса участника." },
        Ort: { von: ["PLZ"], warum: "По правилу задания каждому PLZ соответствует ровно один Ort." },
        Kurstitel: { von: ["KursNr"], warum: "Название — свойство курса, участник на него не влияет." },
        Preis: { von: ["KursNr"], warum: "У курса фиксированная цена — одна для всех участников." },
        Anmeldedatum: { von: ["TeilnehmerNr", "KursNr"], warum: "Дата относится к конкретной записи: этот участник на этот курс." }
      },
      anomalien: [
        { typ: "aenderung", text: "Курс K12 «Excel Grundlagen» с октября стоит 95 € вместо 89 €.",
          erkl: "Цена K12 записана у трёх участников (101, 102, 105). Менять нужно везде. Если забыть одну строку, данные противоречат друг другу.",
          de: "Änderungsanomalie: Der Preis von K12 steht mehrfach in der Tabelle. Man muss ihn in allen Zeilen ändern." },
        { typ: "einfuege", text: "Университет хочет добавить новый курс K30 «Python für Einsteiger». Записей на него пока нет.",
          erkl: "Курс можно сохранить только вместе с участником: без TeilnehmerNr строки нет. Новый курс без участников не внести.",
          de: "Einfügeanomalie: Ein neuer Kurs kann erst gespeichert werden, wenn sich ein Teilnehmer anmeldet." },
        { typ: "loesch", text: "Участник 104 (Schulz) отменяет свой единственный курс, его строку удаляют.",
          erkl: "Вместе со строкой пропадают данные курса K25 «Fotografie» (название, цена) — больше нигде их нет.",
          de: "Löschanomalie: Mit dem Teilnehmer 104 gehen auch die Daten von Kurs K25 verloren." }
      ],
      nf2: [
        { name: "Teilnehmer", spalten: ["TeilnehmerNr", "Name", "PLZ", "Ort"], pk: ["TeilnehmerNr"], fk: {} },
        { name: "Kurs", spalten: ["KursNr", "Kurstitel", "Preis"], pk: ["KursNr"], fk: {} },
        { name: "Anmeldung", spalten: ["TeilnehmerNr", "KursNr", "Anmeldedatum"], pk: ["TeilnehmerNr", "KursNr"], fk: { TeilnehmerNr: "Teilnehmer", KursNr: "Kurs" } }
      ],
      nf3: [
        { name: "Teilnehmer", spalten: ["TeilnehmerNr", "Name", "PLZ"], pk: ["TeilnehmerNr"], fk: { PLZ: "Ort" } },
        { name: "Ort", spalten: ["PLZ", "Ort"], pk: ["PLZ"], fk: {} },
        { name: "Kurs", spalten: ["KursNr", "Kurstitel", "Preis"], pk: ["KursNr"], fk: {} },
        { name: "Anmeldung", spalten: ["TeilnehmerNr", "KursNr", "Anmeldedatum"], pk: ["TeilnehmerNr", "KursNr"], fk: { TeilnehmerNr: "Teilnehmer", KursNr: "Kurs" } }
      ],
      beziehungen: [
        { a: "Ort", b: "Teilnehmer", art: "1:n", de: "In einem Ort wohnen mehrere Teilnehmer. Ein Teilnehmer wohnt in genau einem Ort." },
        { a: "Teilnehmer", b: "Anmeldung", art: "1:n", de: "Ein Teilnehmer hat mehrere Anmeldungen. Eine Anmeldung gehört zu genau einem Teilnehmer." },
        { a: "Anmeldung", b: "Kurs", art: "n:1", de: "Zu einem Kurs gibt es viele Anmeldungen. Eine Anmeldung gilt für genau einen Kurs." },
        { a: "Teilnehmer", b: "Kurs", art: "n:m", ueber: "Anmeldung", de: "Ein Teilnehmer bucht mehrere Kurse. Ein Kurs hat mehrere Teilnehmer." }
      ]
    },

    {
      id: "werkstatt",
      titel: "Kfz-Werkstatt: Werkstattauftrag",
      ru: "Автомастерская: заказы, машины, клиенты и выполненные работы.",
      situation: [
        "Eine Kfz-Werkstatt erfasst ihre Aufträge in einer Tabelle.",
        "Ein Auftrag gehört zu genau einem Fahrzeug. Ein Fahrzeug gehört genau einem Kunden.",
        "In einem Auftrag werden mehrere Leistungen ausgeführt. Jede Leistung hat einen festen Preis."
      ],
      situationRu: "Автомастерская записывает заказы в одну таблицу. Заказ относится ровно к одной машине, машина принадлежит ровно одному клиенту. В одном заказе выполняется несколько работ (Leistungen), у каждой работы фиксированная цена.",
      ausgang: {
        name: "Werkstattauftrag",
        spalten: ["AuftragNr", "Datum", "Fahrzeug", "KundenNr", "Name", "Leistungen", "Anzahl"],
        zeilen: [
          ["A501", "06.10.2026", "L-MK 412, VW Golf", "K7", "Hoffmann", ["L01 Ölwechsel (60 €)", "L04 Reifen montieren (15 €)"], ["1", "4"]],
          ["A502", "06.10.2026", "L-ZR 88, Opel Corsa", "K3", "Brandt", ["L09 Hauptuntersuchung (139 €)"], ["1"]],
          ["A503", "07.10.2026", "L-MK 412, VW Golf", "K7", "Hoffmann", ["L07 Bremsbelag tauschen (60 €)"], ["2"]],
          ["A504", "08.10.2026", "L-TS 5, Skoda Fabia", "K7", "Hoffmann", ["L01 Ölwechsel (60 €)", "L09 Hauptuntersuchung (139 €)"], ["1", "1"]],
          ["A505", "08.10.2026", "L-PA 301, VW Golf", "K12", "Brandt", ["L04 Reifen montieren (15 €)"], ["2"]]
        ]
      },
      zerlegung: { Fahrzeug: ["Kennzeichen", "Modell"], Leistungen: ["LeistungNr", "Bezeichnung", "Preis"] },
      nf1: {
        name: "Werkstattauftrag",
        spalten: ["AuftragNr", "Datum", "Kennzeichen", "Modell", "KundenNr", "Name", "LeistungNr", "Bezeichnung", "Preis", "Anzahl"],
        zeilen: [
          ["A501", "06.10.2026", "L-MK 412", "VW Golf", "K7", "Hoffmann", "L01", "Ölwechsel", "60 €", "1"],
          ["A501", "06.10.2026", "L-MK 412", "VW Golf", "K7", "Hoffmann", "L04", "Reifen montieren", "15 €", "4"],
          ["A502", "06.10.2026", "L-ZR 88", "Opel Corsa", "K3", "Brandt", "L09", "Hauptuntersuchung", "139 €", "1"],
          ["A503", "07.10.2026", "L-MK 412", "VW Golf", "K7", "Hoffmann", "L07", "Bremsbelag tauschen", "60 €", "2"],
          ["A504", "08.10.2026", "L-TS 5", "Skoda Fabia", "K7", "Hoffmann", "L01", "Ölwechsel", "60 €", "1"],
          ["A504", "08.10.2026", "L-TS 5", "Skoda Fabia", "K7", "Hoffmann", "L09", "Hauptuntersuchung", "139 €", "1"],
          ["A505", "08.10.2026", "L-PA 301", "VW Golf", "K12", "Brandt", "L04", "Reifen montieren", "15 €", "2"]
        ]
      },
      schluessel: ["AuftragNr", "LeistungNr"],
      schluesselWarum: {
        AuftragNr: "Одна и та же работа встречается в разных заказах — одного LeistungNr мало.",
        LeistungNr: "В одном заказе несколько работ — одного AuftragNr мало."
      },
      abh: {
        Datum: { von: ["AuftragNr"], warum: "Дата — свойство заказа." },
        Kennzeichen: { von: ["AuftragNr"], warum: "Заказ относится ровно к одной машине (правило задания)." },
        Modell: { von: ["Kennzeichen"], warum: "Модель — свойство машины, а не заказа." },
        KundenNr: { von: ["Kennzeichen"], warum: "Машина принадлежит ровно одному клиенту. С заказом клиент связан только через машину." },
        Name: { von: ["KundenNr"], warum: "Фамилия — свойство клиента." },
        Bezeichnung: { von: ["LeistungNr"], warum: "Название — свойство работы (Leistung)." },
        Preis: { von: ["LeistungNr"], warum: "У каждой работы фиксированная цена." },
        Anzahl: { von: ["AuftragNr", "LeistungNr"], warum: "Количество относится к позиции: эта работа в этом заказе." }
      },
      anomalien: [
        { typ: "loesch", text: "Заказ A502 отменён, его строку удаляют.",
          erkl: "Вместе с заказом пропадает, что машина L-ZR 88 — Opel Corsa и принадлежит клиенту K3 Brandt. Других строк с этими данными нет.",
          de: "Löschanomalie: Mit dem Auftrag A502 gehen auch die Daten von Kunde K3 und seinem Fahrzeug verloren." },
        { typ: "aenderung", text: "Клиент K7 сменил фамилию: теперь Hoffmann-Roth.",
          erkl: "Фамилия K7 хранится в трёх строках (A501, A503, A504). Менять нужно везде, иначе у одного клиента окажутся две разные фамилии.",
          de: "Änderungsanomalie: Der Name von Kunde K7 steht in mehreren Zeilen. Vergisst man eine Zeile, sind die Daten widersprüchlich." },
        { typ: "einfuege", text: "Мастерская вводит новую работу L12 «Klimaanlage prüfen» за 59 €. Заказов с ней ещё нет.",
          erkl: "Работу можно записать только внутри заказа: без AuftragNr строки нет.",
          de: "Einfügeanomalie: Eine neue Leistung kann erst gespeichert werden, wenn es einen Auftrag dafür gibt." }
      ],
      nf2: [
        { name: "Auftrag", spalten: ["AuftragNr", "Datum", "Kennzeichen", "Modell", "KundenNr", "Name"], pk: ["AuftragNr"], fk: {} },
        { name: "Leistung", spalten: ["LeistungNr", "Bezeichnung", "Preis"], pk: ["LeistungNr"], fk: {} },
        { name: "Auftragsposition", spalten: ["AuftragNr", "LeistungNr", "Anzahl"], pk: ["AuftragNr", "LeistungNr"], fk: { AuftragNr: "Auftrag", LeistungNr: "Leistung" } }
      ],
      nf3: [
        { name: "Kunde", spalten: ["KundenNr", "Name"], pk: ["KundenNr"], fk: {} },
        { name: "Fahrzeug", spalten: ["Kennzeichen", "Modell", "KundenNr"], pk: ["Kennzeichen"], fk: { KundenNr: "Kunde" } },
        { name: "Auftrag", spalten: ["AuftragNr", "Datum", "Kennzeichen"], pk: ["AuftragNr"], fk: { Kennzeichen: "Fahrzeug" } },
        { name: "Leistung", spalten: ["LeistungNr", "Bezeichnung", "Preis"], pk: ["LeistungNr"], fk: {} },
        { name: "Auftragsposition", spalten: ["AuftragNr", "LeistungNr", "Anzahl"], pk: ["AuftragNr", "LeistungNr"], fk: { AuftragNr: "Auftrag", LeistungNr: "Leistung" } }
      ],
      beziehungen: [
        { a: "Kunde", b: "Fahrzeug", art: "1:n", de: "Ein Kunde hat ein oder mehrere Fahrzeuge. Ein Fahrzeug gehört genau einem Kunden." },
        { a: "Auftrag", b: "Fahrzeug", art: "n:1", de: "Zu einem Fahrzeug gibt es mehrere Aufträge. Ein Auftrag betrifft genau ein Fahrzeug." },
        { a: "Auftrag", b: "Auftragsposition", art: "1:n", de: "Ein Auftrag hat mehrere Positionen. Eine Position gehört zu genau einem Auftrag." },
        { a: "Leistung", b: "Auftragsposition", art: "1:n", de: "Eine Leistung steht in mehreren Positionen. Eine Position nennt genau eine Leistung." },
        { a: "Auftrag", b: "Leistung", art: "n:m", ueber: "Auftragsposition", de: "Ein Auftrag enthält mehrere Leistungen. Eine Leistung kommt in mehreren Aufträgen vor." }
      ]
    },

    {
      id: "bestellung",
      titel: "Online-Shop: Bestellung mit Positionen",
      ru: "Интернет-магазин канцтоваров: заказы, клиенты, доставка и товары.",
      situation: [
        "Ein Online-Shop für Bürobedarf speichert Bestellungen in einer Tabelle.",
        "Eine Bestellung enthält mehrere Artikel. Ein Artikel kommt in vielen Bestellungen vor.",
        "Jede Bestellung hat genau eine Versandart. Die Versandkosten hängen nur von der Versandart ab."
      ],
      situationRu: "Интернет-магазин канцтоваров хранит заказы в одной таблице. В заказе несколько товаров, товар встречается во многих заказах. У каждого заказа ровно один способ доставки (Versandart). Стоимость доставки зависит только от способа доставки.",
      ausgang: {
        name: "Bestellung",
        spalten: ["BestellNr", "Datum", "Kunde", "Versand", "Artikel", "Menge"],
        zeilen: [
          ["7001", "01.10.2026", "K201 Lange", "DHL Paket, 4,90 €", ["A10 Ordner A4 (2,49 €)", "A22 Kugelschreiber (0,99 €)"], ["10", "50"]],
          ["7002", "01.10.2026", "K305 Yilmaz", "Hermes, 3,90 €", ["A22 Kugelschreiber (0,99 €)"], ["20"]],
          ["7003", "02.10.2026", "K201 Lange", "Abholung, 0,00 €", ["A31 Druckerpapier (5,99 €)", "A10 Ordner A4 (2,49 €)"], ["5", "2"]],
          ["7004", "03.10.2026", "K118 Lange", "DHL Paket, 4,90 €", ["A45 Tacker (8,49 €)", "A22 Kugelschreiber (0,99 €)"], ["1", "10"]],
          ["7005", "03.10.2026", "K305 Yilmaz", "DPD, 4,90 €", ["A45 Tacker (8,49 €)"], ["2"]]
        ]
      },
      zerlegung: { Kunde: ["KundenNr", "Name"], Versand: ["Versandart", "Versandkosten"], Artikel: ["ArtikelNr", "Bezeichnung", "Einzelpreis"] },
      nf1: {
        name: "Bestellung",
        spalten: ["BestellNr", "Datum", "KundenNr", "Name", "Versandart", "Versandkosten", "ArtikelNr", "Bezeichnung", "Einzelpreis", "Menge"],
        zeilen: [
          ["7001", "01.10.2026", "K201", "Lange", "DHL Paket", "4,90 €", "A10", "Ordner A4", "2,49 €", "10"],
          ["7001", "01.10.2026", "K201", "Lange", "DHL Paket", "4,90 €", "A22", "Kugelschreiber", "0,99 €", "50"],
          ["7002", "01.10.2026", "K305", "Yilmaz", "Hermes", "3,90 €", "A22", "Kugelschreiber", "0,99 €", "20"],
          ["7003", "02.10.2026", "K201", "Lange", "Abholung", "0,00 €", "A31", "Druckerpapier", "5,99 €", "5"],
          ["7003", "02.10.2026", "K201", "Lange", "Abholung", "0,00 €", "A10", "Ordner A4", "2,49 €", "2"],
          ["7004", "03.10.2026", "K118", "Lange", "DHL Paket", "4,90 €", "A45", "Tacker", "8,49 €", "1"],
          ["7004", "03.10.2026", "K118", "Lange", "DHL Paket", "4,90 €", "A22", "Kugelschreiber", "0,99 €", "10"],
          ["7005", "03.10.2026", "K305", "Yilmaz", "DPD", "4,90 €", "A45", "Tacker", "8,49 €", "2"]
        ]
      },
      schluessel: ["BestellNr", "ArtikelNr"],
      schluesselWarum: {
        BestellNr: "Один товар встречается в нескольких заказах — одного ArtikelNr мало.",
        ArtikelNr: "В одном заказе несколько товаров — одного BestellNr мало."
      },
      abh: {
        Datum: { von: ["BestellNr"], warum: "Дата — свойство заказа." },
        KundenNr: { von: ["BestellNr"], warum: "Каждый заказ делает ровно один клиент." },
        Name: { von: ["KundenNr"], warum: "Фамилия — свойство клиента, а не заказа." },
        Versandart: { von: ["BestellNr"], warum: "У каждого заказа ровно один способ доставки (правило задания)." },
        Versandkosten: { von: ["Versandart"], warum: "По правилу задания стоимость доставки зависит только от способа доставки." },
        Bezeichnung: { von: ["ArtikelNr"], warum: "Название — свойство товара." },
        Einzelpreis: { von: ["ArtikelNr"], warum: "Цена за штуку — свойство товара." },
        Menge: { von: ["BestellNr", "ArtikelNr"], warum: "Количество — сколько штук этого товара в этом заказе." }
      },
      anomalien: [
        { typ: "einfuege", text: "В магазине появился новый товар A50 «Locher» за 6,99 €. Его ещё никто не заказывал.",
          erkl: "Товар можно записать только внутри заказа: без BestellNr строки нет.",
          de: "Einfügeanomalie: Ein neuer Artikel kann erst gespeichert werden, wenn ihn jemand bestellt." },
        { typ: "aenderung", text: "Доставка «DHL Paket» с ноября стоит 5,49 € вместо 4,90 €.",
          erkl: "Стоимость DHL Paket хранится в нескольких строках (заказы 7001 и 7004). Менять нужно каждую; пропущенная строка даст противоречие.",
          de: "Änderungsanomalie: Die Versandkosten von DHL Paket stehen mehrfach in der Tabelle." },
        { typ: "loesch", text: "Заказ 7002 отменён и удалён.",
          erkl: "Пропадает информация, что доставка Hermes стоит 3,90 € — она была только в этом заказе.",
          de: "Löschanomalie: Mit der Bestellung 7002 geht die Information über die Versandart Hermes verloren." }
      ],
      nf2: [
        { name: "Bestellung", spalten: ["BestellNr", "Datum", "KundenNr", "Name", "Versandart", "Versandkosten"], pk: ["BestellNr"], fk: {} },
        { name: "Artikel", spalten: ["ArtikelNr", "Bezeichnung", "Einzelpreis"], pk: ["ArtikelNr"], fk: {} },
        { name: "Bestellposition", spalten: ["BestellNr", "ArtikelNr", "Menge"], pk: ["BestellNr", "ArtikelNr"], fk: { BestellNr: "Bestellung", ArtikelNr: "Artikel" } }
      ],
      nf3: [
        { name: "Kunde", spalten: ["KundenNr", "Name"], pk: ["KundenNr"], fk: {} },
        { name: "Versand", spalten: ["Versandart", "Versandkosten"], pk: ["Versandart"], fk: {} },
        { name: "Bestellung", spalten: ["BestellNr", "Datum", "KundenNr", "Versandart"], pk: ["BestellNr"], fk: { KundenNr: "Kunde", Versandart: "Versand" } },
        { name: "Artikel", spalten: ["ArtikelNr", "Bezeichnung", "Einzelpreis"], pk: ["ArtikelNr"], fk: {} },
        { name: "Bestellposition", spalten: ["BestellNr", "ArtikelNr", "Menge"], pk: ["BestellNr", "ArtikelNr"], fk: { BestellNr: "Bestellung", ArtikelNr: "Artikel" } }
      ],
      beziehungen: [
        { a: "Kunde", b: "Bestellung", art: "1:n", de: "Ein Kunde gibt mehrere Bestellungen auf. Eine Bestellung gehört zu genau einem Kunden." },
        { a: "Bestellung", b: "Versand", art: "n:1", de: "Viele Bestellungen nutzen dieselbe Versandart. Eine Bestellung hat genau eine Versandart." },
        { a: "Bestellung", b: "Bestellposition", art: "1:n", de: "Eine Bestellung hat mehrere Positionen. Eine Position gehört zu genau einer Bestellung." },
        { a: "Artikel", b: "Bestellposition", art: "1:n", de: "Ein Artikel steht in mehreren Positionen. Eine Position nennt genau einen Artikel." },
        { a: "Bestellung", b: "Artikel", art: "n:m", ueber: "Bestellposition", de: "Eine Bestellung enthält mehrere Artikel. Ein Artikel kommt in mehreren Bestellungen vor." }
      ]
    },

    {
      id: "termine",
      titel: "Arztpraxis: Termine",
      ru: "Врачебная практика: пациенты, приёмы и врачи.",
      situation: [
        "Eine Arztpraxis speichert alle Termine in einer Tabelle.",
        "Ein Patient hat höchstens einen Termin pro Tag.",
        "Jeder Termin findet bei genau einem Arzt statt. Jeder Arzt hat genau eine Fachrichtung."
      ],
      situationRu: "Врачебная практика хранит все приёмы в одной таблице. У пациента не больше одного приёма в день. Каждый приём ведёт ровно один врач, у каждого врача одна специализация (Fachrichtung).",
      ausgang: {
        name: "Termine",
        spalten: ["PatientNr", "Patient", "Geburtsdatum", "Termine", "Arzt"],
        zeilen: [
          ["301", "Meier, Jonas", "03.05.1988", ["14.10.2026 Kontrolle", "28.10.2026 Impfung"], ["A2 Dr. Wolf, Innere Medizin", "A2 Dr. Wolf, Innere Medizin"]],
          ["302", "Hahn, Lea", "17.11.1995", ["14.10.2026 Rückenschmerzen"], ["A5 Dr. Pohl, Orthopädie"]],
          ["303", "Meier, Petra", "22.01.1961", ["15.10.2026 Kontrolle", "05.11.2026 Röntgen"], ["A2 Dr. Wolf, Innere Medizin", "A8 Dr. Sommer, Orthopädie"]],
          ["304", "Krause, Jonas", "09.09.2001", ["28.10.2026 Impfung"], ["A7 Dr. Krüger, Allgemeinmedizin"]],
          ["305", "Hahn, Lea", "30.06.1979", ["14.10.2026 Kontrolle"], ["A5 Dr. Pohl, Orthopädie"]]
        ]
      },
      zerlegung: { Patient: ["Nachname", "Vorname"], Termine: ["Datum", "Anlass"], Arzt: ["ArztNr", "Arztname", "Fachrichtung"] },
      nf1: {
        name: "Termine",
        spalten: ["PatientNr", "Nachname", "Vorname", "Geburtsdatum", "Datum", "Anlass", "ArztNr", "Arztname", "Fachrichtung"],
        zeilen: [
          ["301", "Meier", "Jonas", "03.05.1988", "14.10.2026", "Kontrolle", "A2", "Dr. Wolf", "Innere Medizin"],
          ["301", "Meier", "Jonas", "03.05.1988", "28.10.2026", "Impfung", "A2", "Dr. Wolf", "Innere Medizin"],
          ["302", "Hahn", "Lea", "17.11.1995", "14.10.2026", "Rückenschmerzen", "A5", "Dr. Pohl", "Orthopädie"],
          ["303", "Meier", "Petra", "22.01.1961", "15.10.2026", "Kontrolle", "A2", "Dr. Wolf", "Innere Medizin"],
          ["303", "Meier", "Petra", "22.01.1961", "05.11.2026", "Röntgen", "A8", "Dr. Sommer", "Orthopädie"],
          ["304", "Krause", "Jonas", "09.09.2001", "28.10.2026", "Impfung", "A7", "Dr. Krüger", "Allgemeinmedizin"],
          ["305", "Hahn", "Lea", "30.06.1979", "14.10.2026", "Kontrolle", "A5", "Dr. Pohl", "Orthopädie"]
        ]
      },
      schluessel: ["PatientNr", "Datum"],
      schluesselWarum: {
        PatientNr: "В один день приходят разные пациенты — одной даты мало. Имя не подходит: имена повторяются (два пациента «Hahn, Lea»).",
        Datum: "У пациента несколько приёмов — одного PatientNr мало. По правилу задания в день не больше одного приёма, поэтому даты достаточно."
      },
      abh: {
        Nachname: { von: ["PatientNr"], warum: "Фамилия — свойство пациента." },
        Vorname: { von: ["PatientNr"], warum: "Имя — свойство пациента." },
        Geburtsdatum: { von: ["PatientNr"], warum: "Дата рождения — свойство пациента." },
        Anlass: { von: ["PatientNr", "Datum"], warum: "Повод относится к конкретному приёму: этот пациент в этот день." },
        ArztNr: { von: ["PatientNr", "Datum"], warum: "Какой врач ведёт приём, зависит от конкретного приёма (пациент + день)." },
        Arztname: { von: ["ArztNr"], warum: "Имя — свойство врача. С приёмом оно связано только через ArztNr." },
        Fachrichtung: { von: ["ArztNr"], warum: "Специализация — свойство врача (у каждого врача одна)." }
      },
      anomalien: [
        { typ: "einfuege", text: "В практике начинает работать новый врач A9 Dr. Neumann (Dermatologie). Приёмов у него пока нет.",
          erkl: "Врача можно записать только вместе с приёмом пациента: без PatientNr и даты строки нет.",
          de: "Einfügeanomalie: Ein neuer Arzt kann erst gespeichert werden, wenn er einen Termin hat." },
        { typ: "loesch", text: "Пациент 304 переехал, его строку удаляют.",
          erkl: "Вместе с ним пропадают данные врача A7 Dr. Krüger (Allgemeinmedizin) — других строк с ним нет.",
          de: "Löschanomalie: Mit dem Patienten 304 gehen auch die Daten von Arzt A7 verloren." },
        { typ: "aenderung", text: "Врач A2 после свадьбы носит фамилию Dr. Wolf-Berger.",
          erkl: "Имя врача A2 записано в нескольких местах (у пациентов 301 и 303, у 301 даже дважды). Исправлять нужно везде, иначе данные противоречат друг другу.",
          de: "Änderungsanomalie: Der Name von Arzt A2 steht mehrfach in der Tabelle." }
      ],
      nf2: [
        { name: "Patient", spalten: ["PatientNr", "Nachname", "Vorname", "Geburtsdatum"], pk: ["PatientNr"], fk: {} },
        { name: "Termin", spalten: ["PatientNr", "Datum", "Anlass", "ArztNr", "Arztname", "Fachrichtung"], pk: ["PatientNr", "Datum"], fk: { PatientNr: "Patient" } }
      ],
      nf3: [
        { name: "Patient", spalten: ["PatientNr", "Nachname", "Vorname", "Geburtsdatum"], pk: ["PatientNr"], fk: {} },
        { name: "Arzt", spalten: ["ArztNr", "Arztname", "Fachrichtung"], pk: ["ArztNr"], fk: {} },
        { name: "Termin", spalten: ["PatientNr", "Datum", "Anlass", "ArztNr"], pk: ["PatientNr", "Datum"], fk: { PatientNr: "Patient", ArztNr: "Arzt" } }
      ],
      beziehungen: [
        { a: "Patient", b: "Termin", art: "1:n", de: "Ein Patient hat mehrere Termine. Ein Termin gehört zu genau einem Patienten." },
        { a: "Termin", b: "Arzt", art: "n:1", de: "Ein Arzt hat mehrere Termine. Ein Termin findet bei genau einem Arzt statt." },
        { a: "Patient", b: "Arzt", art: "n:m", ueber: "Termin", de: "Ein Patient kann zu mehreren Ärzten gehen. Ein Arzt behandelt mehrere Patienten." }
      ]
    }
  ];
  root.AP2_NORMAL = S;
  if (typeof module === "object" && module.exports) module.exports = S;
})(typeof window !== "undefined" ? window : globalThis);
