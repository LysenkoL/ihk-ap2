# IHK AP2 — Prüfungssimulator

Тренажёр для **Teil 2 der Abschlussprüfung** Fachinformatiker/-in
Anwendungsentwicklung: GA1 «Planen eines Softwareproduktes», GA2 «Entwicklung
und Umsetzung von Algorithmen», WiSo. Без сервера: открыть `index.html`.

Отдельное приложение, построенное на движке `ihk-sim` (AP1). `ihk-sim` не
трогается. План и состояние — в **PLAN-AP2.md**.

## Важно про изоляцию

Оба приложения могут жить на одном хосте (lysenkol.github.io) — там общий
localStorage. Поэтому здесь все ключи начинаются с `ap2:` / `ap2-sync:`,
кэши — с `ihk-ap2-`, и Service Worker удаляет только свои кэши.
Новые модули: ключи хранилища только с префиксом `ap2:`.

## Модули AP2 (кроме движка AP1)

- `gen/azubi.js` — настоящие бланки (пакет `privat/ap2-paket.js`).
- `gen/lernen*.js` — 15 тем AP2: объяснение, квиз, Kurzfragen, тренажёр.
- `gen/algo.js` — сортировка и поиск по шагам.
- `gen/satzbausteine-ap2.js` — Kurzfragen AP2; `gen/glossar-ap2.js` — термины.

## Тесты

```
node tests/alle.js
```

## Публикация

Свой репозиторий (например `ap2-sim`) → GitHub Pages. Перед выпуском новой
версии поднять `VERSION` в `sw.js` (`ihk-ap2-vN`). Экзамены ZPA и платные
материалы — только в `privat/` (в .gitignore).

PIN устройства — как в AP1.
