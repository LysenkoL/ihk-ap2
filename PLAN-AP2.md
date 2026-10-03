# AP2-Simulator — план

Отдельное приложение для **Teil 2 der Abschlussprüfung** (FIAE). Сделано копией
движка из `ihk-sim` — сам `ihk-sim` не менялся и дальше не меняется.

Письменная AP2: **среда, 28.04.2027** (IHK, Sommer 2027).

---

## Как устроена AP2 (Prüfungskatalog, 2. Auflage 2024)

| Prüfungsbereich | Время | Формат | Вес |
|---|---|---|---|
| GA1 Planen eines Softwareproduktes | 90 мин | 4 задания по 20–30 баллов = 100 | 10 % |
| GA2 Entwicklung und Umsetzung von Algorithmen | 90 мин | 4 задания = 100, с Belegsatz | 10 % |
| WiSo | 60 мин | ≈ 30 заданий, автопроверка (Ziffern) | 10 % |
| Projektarbeit + Präsentation + Fachgespräch | — | — | 50 % |

Сдано (§ 16 FiAusbV): Teil 2 ≥ ausreichend, **3 из 4** Prüfungsbereiche Teil 2
≥ ausreichend, ни одного «ungenügend» (< 30). Одну письменную часть можно
подтянуть mündliche Ergänzungsprüfung.

## Что спрашивают (9 экзаменов W21/22–W25/26, GA1 + GA2)

Почти каждый раз: **Algorithmus/Pseudocode** (20–30 баллов) · **Tests и
Schreibtischtest** · **SQL** · **relationales Modell** · **Klassen/OOP** ·
**UML-Aktivität**. Часто: ER, Zustand, Use-Case, Sequenz, Vorgehensmodelle,
Verschlüsselung, Datenschutz. Sommer 2026: Netzplan (14 + 3 + 2 балла), REST,
LoRa/IoT, RSA, ISO 25010, Barrierefreiheit, Mockups; GA2 — Listen, Polymorphie,
Speicherbedarf, CRUD.

## Материалы (папка «FIAE Teil 2.zip» на рабочем столе)

| Термин | GA1 | GA2 | Lösung GA | Belegsatz | WiSo | Lösung WiSo |
|---|---|---|---|---|---|---|
| Winter 21/22 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sommer 22 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Winter 22/23 | ✓ | ✓ | ✓ (текст) | ✓ | ✓ | ✓ |
| Sommer 23 | ✓ | ✓ | ✓ | ? | ✓ | ? |
| Winter 23/24 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sommer 24 | ✓ | ✓ | ✓ (текст) | ? | ✓ | ✓ |
| Winter 24/25 | ✓ | ✓ | ✓ | ? | ✓ | ✓ |
| Sommer 25 | ✓ | ✓ | ✓ (текст) | ? | ✓ | ✓ |
| Winter 25/26 | ✓ (текст) | ✓ (текст) | ✓ (текст) | ✓ | — | — |
| Sommer 26 | ✓ | ✓ | только GA2, неофиц. | ✓ | ✓ | неофиц. |

«?» — отдельным файлом не нашла. Почти всё — сканы. Как и в AP1, задания
переписываются вручную (Claude читает скан и переносит текст), без API.
WiSo Sommer 2023: решения взяты из Lösungserläuterungen u-form (найдены в
`Sommer 23 Teil 2 Lösungen.pdf`, стр. 18–19).
Там же: Prüfungskatalog (PDF) и «Prüfungsvorbereitung Aktuell — Teil 2».

**Задания ZPA не публиковать** на открытых GitHub Pages: экзамены держать в
`privat/` (в .gitignore) и грузить на телефон «пакетом», как Azubi-Navigator.

## Внешние ресурсы

- **ap2.online** (M. Scheremet, лицензии нет → не копировать, только ссылки и
  свои формулировки). Проверено 02.10.2026: ~40 страниц теории (без картинок и
  упражнений, кое-где «Typische Prüfungsfragen» без ответов) + 2 интерактивных
  SQL-задания (1 сценарий SELECT/JOIN, 1 сценарий m:n-Joins). WiSo — 3 абзаца.
  Экзаменов, псевдокода, проверки ответов нет. Наш SQL-тренажёр (35+ заданий)
  его уже перекрывает. Неточность: MVC там «Strukturmuster» — у IHK это
  Architekturmuster.
- **Платформа «Ausbildung in der IT»** (личный доступ) — Lernpfad WiSo:
  15 Lernmodule, 42 Übungsaufgaben; ещё Arbeitsblätter, Prüfungssimulation,
  Hands-on Labs. Вариант: личный импорт, как Azubi-Navigator (`privat/`, только
  на своих устройствах). Нужны адрес платформы и экспорт из своего аккаунта.

---

## Шаг 0 — сделано (02.10.2026)

- Папка `ap2-sim` рядом с `ihk-sim`. Скопирован код (без экзаменов AP1, картинок,
  PDF, `privat/`, `.git`).
- **Изоляция от AP1** (один хост lysenkol.github.io = общий localStorage):
  ключи `ihk2:` → `ap2:`, `ihk-sync:` → `ap2-sync:`, `ihk:auth` → `ap2:auth`,
  IndexedDB `ap2-azubi`, кэши Service Worker `ihk-ap2-*` (удаляются **только
  свои**), файлы сохранения `ap2-…`, тип файла `ihk-ap2-fortschritt` — сохранение
  AP1 сюда не загрузится и наоборот.
- Countdown до 28.04.2027, название «IHK AP2», свой цвет в manifest.
- Генератор: включены только 47 шаблонов, подходящих к AP2 (UML, ER, Netzplan,
  Pseudocode, Normalisierung, SQL lesen, Sicherheit, Datenschutz, Projekt, KI,
  Arbeitsrecht). Kalkulation, Hardware, Subnetting — выключены (список в `gen/kern.js`).
- Симуляция 90 мин / 100 BE — **временно** смешанная GA1+GA2 по частоте тем AP2.
- Тесты: `node tests/alle.js` — 14 активны и проходят, 9 «спят» (модули AP1
  или нужны экзамены), причина у каждого написана.
- Проверено в браузере (телефон и десктоп): без ошибок в консоли, хранилище
  только `ap2:`, кэши только `ihk-ap2-*`.

**Загружено:** генератор, рабочие листы, печать/Papiermodus, симуляция,
Fehlerjournal, Fehler durchgehen/wiederholen, Fehler von Papier, Merkblatt,
Prüfen lassen (Claude), Operatoren, Nachschlagen, Glossar, Sync, Netzplan/Gantt,
ER-тренажёр, UML-тренажёр (Aktivität/Klassen), SQL-Trainer, Pseudocode.

**Лежит в `gen/`, но не загружено** (движки пригодятся, данные AP1):
azubi, katalog, radar, satzbau/Kurzfragen, kompendium, spick, formeln,
endspurt, sprint, rechnen, auftrag, handgriffe, abbildungen.

---

## Шаг 1a — сделано (02.10.2026): все 9 WiSo

- 9 бланков WiSo (W21/22 … S26), 270 заданий, все проверяются автоматически.
- Источник — `privat/quellen/wiso-*.json` (переписано со сканов, ключ сверен
  с официальным Lösungsbogen по каждому пункту). Сборка:
  `python tools/paket_bauen.py` → `privat/ap2-paket.js`.
- Оценка как у IHK: 100 баллов, 3,33 за задание; несколько цифр (Zuordnung,
  Reihenfolge, «zwei aus …», две суммы) — Teilbewertung, одна цифра/сумма/дата —
  Globalbewertung (только полностью верно). Где ключ допускает два ответа
  (S23 №8) — засчитываются оба.
- К каждому ответу — объяснение простым немецким с термином по-русски.
- Плеер — `gen/azubi.js` из AP1 (Übung / Prüfung 60 мин, сохранение,
  Auswertung, «Fehler durchgehen»). Блок «Echte AP2-Prüfungen» на главной.
- **На телефоне:** «Echte AP2-Prüfungen» → «Paket laden» → файл
  `privat/ap2-paket.js` (один раз; хранится в памяти устройства).
- Типы заданий в источнике: `eine`, `mehrere`, `zuordnung`, `reihenfolge`,
  `zahl`, `zahlen` (несколько чисел), `datum`, `text`.

## Шаг 1c — сделано (02.10.2026): темы, квиз, тренажёры

Всё в одном приложении, тексты свои (ap2.online — только ссылки «Nachlesen»).

- **Themen AP2** (`gen/lernen-daten.js`, `gen/lernen.js`, `gen/lernen.css`):
  15 тем по Prüfungskatalog — Such-/Sortieralgorithmen, Entwurfsmuster
  (Singleton, Observer, Factory, MVC, Facade), OOP, Softwaretests, Git,
  REST/SOAP/HTTP, CSV/XML/JSON, Kryptographie, Zugriffsschutz, Integrität/ACID,
  Vorgehensmodelle, Anforderungen/ISO 25010/SLA/Verträge, Ergonomie/ISO 9241-110/
  Barrierefreiheit, Werkzeuge/Paradigmen, Prüfungstaktik (1 Min/Punkt, Diagramm
  ≤ 15 Min). У каждой: «Коротко по-русски», объяснение простым немецким с
  русскими терминами, таблица, код, Merksatz, квиз (131 вопрос, с кодом Java для
  паттернов), кнопка Kurzfragen и нужный тренажёр. Ошибки квиза попадают в
  «Fehler wiederholen» (новая общая точка `GENWIEDER_EXTRA` в `wiederholen.js`).
- **Kurzfragen** снова включены: 46 новых карточек AP2 (`satzbausteine-ap2.js`,
  a01–a46) + подходящие карточки AP1; карточки про Hardware/Netzwerk/
  Arbeitsplatz убраны. Всего 166.
- **Sortieren & Suchen** (`gen/algo.js`, `gen/algo.css`): Bubble (с Abbruch),
  Selection, Insertion — массив после каждого прохода (тапать-менять или вводить),
  счётчик сравнений/обменов, объяснение; двоичный поиск (links/rechts/mitte по
  шагам), линейный поиск. Каждый раз новые числа, по возрастанию/убыванию.
- **Glossar** +74 термина (`glossar-ap2.js`), всего 480.
- **SQL**: таблицы Projekt + Projektmitarbeit (n:m) и задания j9–j12, всего 48.
- Поиск находит темы; плитки «Themen & Quiz» и «Sortieren & Suchen» на старте.
- Проверка: `node tests/alle.js` — 18 тестов (новые lernen, algo; kurzfragen
  снова активен), Playwright телефон/ПК без ошибок; содержание вычитано
  отдельной проверкой (исправлены Quicksort O(n²), Sprint ≤ 1 месяц, BITV/BFSG,
  идемпотентность = состояние сервера и др.).

---

## Дальше

**Шаг 1b (октябрь) — каталог + ресурсы**
- Prüfungskatalog AP2 (стр. 17–33) → `katalog-daten.js` + «Lücken».
- Блок «Внешние ресурсы»: ap2.online, платформа WiSo.
- ~~Что взять из ap2.online~~ → сделано, см. «Шаг 1c».
- По желанию: импорт 42 WiSo-заданий платформы в `privat/`.

**Шаг 2 (октябрь–ноябрь) — экзамены GA1/GA2**
- 10 × GA1, 10 × GA2 с Belegsatz рядом с заданием, решения, баллы —
  переписать тем же способом (privat/quellen/ga1-*.json, ga2-*.json).
- Экзамены = личный пакет (не на GitHub Pages).

**Шаг 3 (ноябрь–декабрь) — тренажёры GA2**
- Algorithmus-Trainer «schreiben und ausführen»: Java-подобный код запускается на
  тестах (List get/size/add, null, пустой список) — настоящая автопроверка.
- SQL+: GRANT/REVOKE, CREATE INDEX, ALTER … MODIFY, UPDATE со строковыми
  функциями, CRUD ↔ DDL/DML/DQL.
- Tests: Schreibtischtest, erwartet/tatsächlich, Zeile finden und korrigieren,
  Anweisungs-/Zweig-/Pfadüberdeckung, Äquivalenzklassen/Grenzwerte.
- OOP: Klassendiagramm aus Text, abstrakte Klasse, Interface, Polymorphie, Pattern.

**Шаг 4 (январь) — GA1 + UML**
- Use-Case, Aktivität, Sequenz (alt/opt/loop), Zustand, Klassen — задание,
  эталон и баллы по Lösungen; рисовать — в отдельном UML-приложении.
- Kurzfragen AP2 (движок satzbau): Projekt, ISO 25010, Mockup/Barrierefreiheit,
  REST/HTTP/JSON/XML/XSD, Hash+Salt, RSA, Signatur, Git, englische Texte.
- WiSo-генератор: Lohn (Brutto → Netto), Urlaub, Probezeit/Kündigung, Betriebsrat/JAV,
  Tarif, Rechtsformen, Rentabilität, Arbeitsschutz. Ставки — всегда из текста задания.

**Шаг 5 (февраль) — симуляция и прогноз**
- Отдельно GA1 (90), GA2 (90), WiSo (60) и «Prüfungstag» 240 минут подряд.
- Радар тем AP2 (данные уже есть в `radar-daten.js` → ap2), прогноз,
  калькулятор «сдаю или нет» по § 16, план учёбы до 28.04.

С февраля время уходит и на проект (50 % оценки) — инструменты лучше закончить к январю.
