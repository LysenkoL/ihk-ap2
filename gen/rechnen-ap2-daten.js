/* ============================================================================
   gen/rechnen-ap2-daten.js — Rechen-Trainer AP2: jedes Mal neue Zahlen
   ----------------------------------------------------------------------------
   Sammlung für gen/uebung-gen.js. Eigene Aufgaben im Stil von GA1/GA2
   (keine Kopien von Prüfungen): Speicherbedarf (Foto, Video, Sensoren),
   Einheiten (Bit/Byte, dezimal/binär), Übertragungszeit, RAID-Kapazität,
   Break-even, Amortisation, Nutzwertanalyse, Kostenvergleich.

   Einheiten wie in der Prüfung:
     dezimal  1 kB = 1.000 Byte, 1 MB = 1.000.000 Byte, 1 GB = 10^9 Byte
     binär    1 KiB = 1.024 Byte, 1 MiB = 1.024² Byte, 1 GiB = 1.024³ Byte
     Leitung  Mbit/s = 10^6 Bit pro Sekunde; 1 Byte = 8 Bit
   ========================================================================== */
"use strict";
(function (root) {
  const KiB = 1024, MiB = 1024 * 1024, GiB = 1024 * 1024 * 1024;
  const f = (x, n) => (root.GENUEBGEN ? root.GENUEBGEN.fmt(x, n) : String(x));
  const AUFLOESUNGEN = [[1920, 1080, "Full HD"], [2560, 1440, "WQHD"], [3840, 2160, "4K UHD"], [4000, 3000, "12 Megapixel"], [6000, 4000, "24 Megapixel"]];

  const aufgaben = [
    /* ------------------------------------------------------- Speicher */
    { id: "foto", gruppe: "speicher", titel: "Speicherbedarf von Fotos", ru: "Объём памяти для фото",
      gen: R => {
        const [b, h, name] = R.pick(AUFLOESUNGEN), tiefe = R.pick([24, 24, 32, 48]), n = R.schritt(50, 800, 10);
        const byte = b * h * tiefe / 8, mib = byte / MiB, gib = byte * n / GiB;
        return {
          situation: "Eine Kamera speichert Fotos unkomprimiert. Die Fotos sollen auf einen Server übertragen werden.",
          gegeben: [["Auflösung", f(b, 0) + " × " + f(h, 0) + " Pixel (" + name + ")"], ["Farbtiefe", tiefe + " Bit pro Pixel"], ["Anzahl Fotos", f(n, 0)]],
          frage: "Berechnen Sie den Speicherbedarf eines Fotos in MiB und aller Fotos in GiB. Runden Sie auf zwei Nachkommastellen.",
          felder: [{ id: "eins", label: "Ein Foto", einheit: "MiB", soll: mib, rel: 0.003 }, { id: "alle", label: "Alle Fotos", einheit: "GiB", soll: gib, rel: 0.003 }],
          weg: ["Pixel: " + f(b, 0) + " × " + f(h, 0) + " = " + f(b * h, 0),
            "Bit → Byte: " + f(b * h, 0) + " × " + tiefe + " Bit ÷ 8 = " + f(byte, 0) + " Byte",
            "Byte → MiB: ÷ 1.024 ÷ 1.024 = " + f(mib) + " MiB",
            "Alle: " + f(byte, 0) + " × " + f(n, 0) + " ÷ 1.024³ = " + f(gib) + " GiB"],
          ru: "Пиксели × глубина цвета (бит) ÷ 8 = байты. MiB и GiB — двоичные единицы: делим на 1024 на каждой ступени.",
          merke: "Bit ÷ 8 = Byte. KiB/MiB/GiB: durch 1.024 je Stufe."
        };
      } },
    { id: "video", gruppe: "speicher", titel: "Unkomprimiertes Video", ru: "Несжатое видео",
      gen: R => {
        const [b, h, name] = R.pick(AUFLOESUNGEN.slice(0, 3)), fps = R.pick([25, 30, 50, 60]), sek = R.schritt(10, 180, 5);
        const byteBild = b * h * 3, rate = byteBild * fps / MiB, ges = byteBild * fps * sek / GiB;
        return {
          situation: "Eine Überwachungskamera nimmt ohne Kompression auf. Farbtiefe: 24 Bit (3 Byte) pro Pixel.",
          gegeben: [["Auflösung", f(b, 0) + " × " + f(h, 0) + " (" + name + ")"], ["Bildrate", fps + " Bilder pro Sekunde"], ["Dauer", sek + " Sekunden"]],
          frage: "Berechnen Sie die Datenrate in MiB/s und die Datenmenge der Aufnahme in GiB (zwei Nachkommastellen).",
          felder: [{ id: "rate", label: "Datenrate", einheit: "MiB/s", soll: rate, rel: 0.003 }, { id: "menge", label: "Datenmenge", einheit: "GiB", soll: ges, rel: 0.003 }],
          weg: ["Ein Bild: " + f(b, 0) + " × " + f(h, 0) + " × 3 Byte = " + f(byteBild, 0) + " Byte",
            "Pro Sekunde: × " + fps + " = " + f(byteBild * fps, 0) + " Byte = " + f(rate) + " MiB/s",
            "Gesamt: × " + sek + " s ÷ 1.024³ = " + f(ges) + " GiB"],
          ru: "Одно изображение × кадры в секунду = поток в секунду; × длительность = общий объём."
        };
      } },
    { id: "sensor", gruppe: "speicher", titel: "Messdaten von Sensoren", ru: "Данные датчиков",
      gen: R => {
        const n = R.int(4, 60), wert = R.pick([2, 4, 8]), zeit = R.pick([4, 8]), takt = R.pick([1, 2, 5, 10, 15, 30, 60]), tage = R.pick([1, 7, 30, 365]);
        const satz = wert + zeit, proTag = 86400 / takt, mb = n * satz * proTag * tage / 1e6;
        return {
          situation: "In einer Lagerhalle messen Sensoren die Temperatur. Jeder Messwert wird mit Zeitstempel in einer Datenbank gespeichert.",
          gegeben: [["Sensoren", String(n)], ["Datensatz", wert + " Byte Messwert + " + zeit + " Byte Zeitstempel"], ["Messintervall", "alle " + takt + " Sekunden"], ["Zeitraum", tage + (tage === 1 ? " Tag" : " Tage")]],
          frage: "Wie viele Messungen liefert ein Sensor pro Tag? Wie groß ist die Datenmenge aller Sensoren im Zeitraum in MB (1 MB = 1.000.000 Byte)?",
          felder: [{ id: "tag", label: "Messungen je Sensor und Tag", soll: proTag, tol: 0 }, { id: "mb", label: "Datenmenge", einheit: "MB", soll: mb, rel: 0.003 }],
          weg: ["Ein Tag hat 24 × 60 × 60 = 86.400 Sekunden.", "Messungen: 86.400 ÷ " + takt + " = " + f(proTag, 0),
            "Ein Datensatz: " + wert + " + " + zeit + " = " + satz + " Byte",
            n + " × " + satz + " × " + f(proTag, 0) + " × " + tage + " = " + f(mb * 1e6, 0) + " Byte = " + f(mb) + " MB"],
          ru: "Сначала сколько измерений за сутки (86 400 секунд ÷ интервал), потом × размер записи × число датчиков × дни."
        };
      } },
    { id: "einheiten", gruppe: "speicher", titel: "Einheiten umrechnen: dezimal und binär", ru: "Перевод единиц: десятичные и двоичные приставки",
      gen: R => {
        const art = R.int(0, 4);
        if (art === 0) { const v = R.pick([128, 256, 500, 512, 960, 1000, 2000]); const s = v * 1e9 / GiB;
          return { situation: "Eine SSD wird mit " + v + " GB beworben. Das Betriebssystem zeigt die Größe in GiB an.", frage: "Wie viele GiB zeigt das Betriebssystem an? (zwei Nachkommastellen)",
            felder: [{ label: "Anzeige", einheit: "GiB", soll: s, rel: 0.002 }], weg: [v + " GB = " + v + " × 10⁹ Byte = " + f(v * 1e9, 0) + " Byte", "÷ 1.024³ = " + f(s) + " GiB"],
            ru: "Производитель считает в GB (10⁹), система — в GiB (1024³). Поэтому «пропадает» около 7 %.", merke: "1 GB = 10⁹ Byte, 1 GiB = 1.024³ Byte ≈ 1,074 GB." }; }
        if (art === 1) { const v = R.pick([2, 4, 8, 16, 32, 64]); const s = v * GiB / 1e9;
          return { situation: "Ein Arbeitsspeicher hat " + v + " GiB.", frage: "Wie viele GB (dezimal) sind das? (zwei Nachkommastellen)",
            felder: [{ label: "Größe", einheit: "GB", soll: s, rel: 0.002 }], weg: [v + " × 1.024³ = " + f(v * GiB, 0) + " Byte", "÷ 10⁹ = " + f(s) + " GB"], ru: "Из двоичных в десятичные: умножаем на 1024³ и делим на 10⁹." }; }
        if (art === 2) { const v = R.pick([16, 50, 100, 250, 500, 1000]); const s = v / 8;
          return { situation: "Ein Internetanschluss hat " + v + " Mbit/s.", frage: "Wie viele MB pro Sekunde sind das höchstens? (1 MB = 10⁶ Byte)",
            felder: [{ label: "Datenrate", einheit: "MB/s", soll: s, tol: 0.01 }], weg: [v + " Mbit/s ÷ 8 = " + f(s) + " MB/s"], ru: "Бит → байт: делим на 8. Мегабит в секунду — десятичная единица.", merke: "8 Bit = 1 Byte." }; }
        if (art === 3) { const v = R.pick([3, 5, 12, 20, 64]); const s = v * KiB;
          return { situation: "Eine Datei ist " + v + " KiB groß.", frage: "Wie viele Byte sind das?", felder: [{ label: "Größe", einheit: "Byte", soll: s, tol: 0 }], weg: [v + " × 1.024 = " + f(s, 0) + " Byte"], ru: "KiB = 1024 байта." }; }
        const v = R.pick([1.5, 2, 3, 4.7, 8.5]); const s = v * 1e9 * 8 / 1e9;
        return { situation: "Eine DVD fasst " + f(v) + " GB.", frage: "Wie viele Gbit sind das?", felder: [{ label: "Datenmenge", einheit: "Gbit", soll: s, tol: 0.01 }], weg: [f(v) + " GB × 8 = " + f(s) + " Gbit"], ru: "Байт → бит: умножаем на 8." };
      } },
    /* ------------------------------------------------------- Netz und Speichersysteme */
    { id: "uebertragung", gruppe: "netz", titel: "Übertragungszeit", ru: "Время передачи",
      gen: R => {
        const gb = R.pick([0.7, 1.5, 2, 4.7, 8, 12, 25, 50]), mbit = R.pick([16, 50, 100, 250, 500, 1000]), nutz = R.pick([100, 100, 80, 90]);
        const eff = mbit * nutz / 100, sek = gb * 8000 / eff;
        return {
          situation: "Ein Backup soll über das Netz auf einen Server kopiert werden." + (nutz < 100 ? " Wegen Protokoll-Overhead stehen nur " + nutz + " % der Bandbreite für Nutzdaten zur Verfügung." : ""),
          gegeben: [["Datenmenge", f(gb) + " GB (1 GB = 10⁹ Byte)"], ["Leitung", mbit + " Mbit/s"]],
          frage: "Wie lange dauert die Übertragung in Sekunden und in Minuten? (zwei Nachkommastellen)",
          felder: [{ id: "s", label: "Dauer", einheit: "s", soll: sek, rel: 0.003 }, { id: "min", label: "Dauer", einheit: "min", soll: sek / 60, rel: 0.003 }],
          weg: ["Datenmenge in Bit: " + f(gb) + " GB × 8 = " + f(gb * 8) + " Gbit = " + f(gb * 8000, 0) + " Mbit"].concat(nutz < 100 ? ["Nutzbare Rate: " + mbit + " × " + nutz + " % = " + f(eff) + " Mbit/s"] : [])
            .concat(["Zeit: " + f(gb * 8000, 0) + " ÷ " + f(eff) + " = " + f(sek) + " s", "÷ 60 = " + f(sek / 60) + " min"]),
          ru: "Объём переводим в биты (× 8), потом делим на скорость линии. Единицы должны совпадать: Mbit и Mbit/s.",
          merke: "Zeit = Datenmenge (Bit) ÷ Datenrate (Bit/s)."
        };
      } },
    { id: "raid", gruppe: "netz", titel: "RAID: Nutzkapazität und Ausfallsicherheit", ru: "RAID: полезная ёмкость и отказоустойчивость",
      gen: R => {
        const level = R.pick([0, 1, 5, 6, 10]);
        const n = level === 1 ? 2 : level === 5 ? R.int(3, 8) : level === 6 ? R.int(4, 8) : level === 10 ? R.pick([4, 6, 8]) : R.int(2, 6);
        const tb = R.pick([1, 2, 4, 8, 12, 16]);
        const nutz = level === 0 ? n * tb : level === 1 ? tb : level === 5 ? (n - 1) * tb : level === 6 ? (n - 2) * tb : n / 2 * tb;
        const ausfall = level === 0 ? 0 : level === 6 ? 2 : 1;
        const wie = { 0: "Striping: Daten verteilt, keine Redundanz → Kapazität aller Platten.", 1: "Spiegelung: beide Platten enthalten dasselbe → Kapazität einer Platte.",
          5: "Parität über alle Platten: die Kapazität einer Platte geht verloren.", 6: "doppelte Parität: die Kapazität von zwei Platten geht verloren.", 10: "Spiegel-Paare, die gestriped werden: die Hälfte der Kapazität ist nutzbar." }[level];
        return {
          situation: "Für einen Dateiserver wird ein RAID-Verbund geplant.",
          gegeben: [["RAID-Level", "RAID " + level], ["Festplatten", n + " × " + tb + " TB"]],
          frage: "Wie groß ist die nutzbare Kapazität? Wie viele Platten dürfen höchstens ausfallen, ohne dass Daten verloren gehen (sicher, in jedem Fall)?",
          felder: [{ id: "tb", label: "Nutzkapazität", einheit: "TB", soll: nutz, tol: 0 }, { id: "aus", label: "Ausfallsicher bei", art: "wahl", optionen: ["0 Platten", "1 Platte", "2 Platten", "3 Platten"], soll: ausfall }],
          weg: ["RAID " + level + ": " + wie, "Nutzkapazität: " + f(nutz) + " TB", "Ausfall: " + ["kein Plattenausfall erlaubt", "1 Platte darf ausfallen", "2 Platten dürfen ausfallen"][ausfall] + (level === 10 ? " (eine zweite nur, wenn sie in einem anderen Spiegel-Paar sitzt — sicher ist nur 1)" : "") + "."],
          ru: "RAID 0 — без защиты, RAID 1 — зеркало, RAID 5 — минус один диск на чётность, RAID 6 — минус два, RAID 10 — половина.",
          merke: "RAID ersetzt kein Backup."
        };
      } },
    /* ------------------------------------------------------- Wirtschaftlichkeit */
    { id: "breakeven", gruppe: "wirtschaft", titel: "Break-even-Menge", ru: "Точка безубыточности",
      gen: R => {
        const fix = R.schritt(6000, 60000, 500), vk = R.int(4, 40), preis = vk + R.int(6, 45);
        const db = preis - vk, menge = Math.ceil(fix / db);
        return {
          situation: "Ein Softwarehaus verkauft Lizenzen für eine App. Für die Entwicklung entstehen fixe Kosten, für jede Lizenz variable Kosten (Support, Server).",
          gegeben: [["Fixkosten", f(fix, 0) + " €"], ["Variable Kosten je Lizenz", f(vk, 0) + " €"], ["Verkaufspreis je Lizenz", f(preis, 0) + " €"]],
          frage: "Berechnen Sie den Deckungsbeitrag je Lizenz und die Break-even-Menge (ganze Lizenzen).",
          felder: [{ id: "db", label: "Deckungsbeitrag je Lizenz", einheit: "€", soll: db, tol: 0.01 }, { id: "m", label: "Break-even-Menge", einheit: "Lizenzen", soll: menge, tol: 0, hinweis: "Ab dieser Menge kein Verlust mehr — aufrunden." }],
          weg: ["Deckungsbeitrag = Preis − variable Kosten = " + preis + " − " + vk + " = " + db + " €",
            "Break-even = Fixkosten ÷ Deckungsbeitrag = " + f(fix, 0) + " ÷ " + db + " = " + f(fix / db),
            "Aufrunden: " + f(menge, 0) + " Lizenzen"],
          ru: "Маржинальный доход на единицу = цена − переменные затраты. Точка безубыточности = постоянные затраты ÷ маржинальный доход, округляем вверх.",
          merke: "Break-even-Menge = Fixkosten ÷ (Preis − variable Stückkosten)."
        };
      } },
    { id: "amortisation", gruppe: "wirtschaft", titel: "Amortisationsdauer", ru: "Срок окупаемости",
      gen: R => {
        const inv = R.schritt(6000, 80000, 1000), spar = R.schritt(400, 4000, 50), lauf = R.schritt(0, 300, 50);
        const netto = spar - lauf, monate = inv / netto;
        return {
          situation: "Ein Betrieb führt ein neues Ticketsystem ein. Es spart Arbeitszeit, kostet aber auch monatlich Wartung.",
          gegeben: [["Investition (einmalig)", f(inv, 0) + " €"], ["Einsparung pro Monat", f(spar, 0) + " €"], ["Laufende Kosten pro Monat", f(lauf, 0) + " €"]],
          frage: "Nach wie vielen Monaten hat sich die Investition amortisiert? Geben Sie die Dauer auch in Jahren an (zwei Nachkommastellen).",
          felder: [{ id: "m", label: "Amortisationsdauer", einheit: "Monate", soll: monate, tol: 0.02 }, { id: "j", label: "Amortisationsdauer", einheit: "Jahre", soll: monate / 12, tol: 0.01 }],
          weg: ["Rückfluss pro Monat = Einsparung − laufende Kosten = " + f(spar, 0) + " − " + f(lauf, 0) + " = " + f(netto, 0) + " €",
            "Amortisation = Investition ÷ Rückfluss = " + f(inv, 0) + " ÷ " + f(netto, 0) + " = " + f(monate) + " Monate",
            "÷ 12 = " + f(monate / 12) + " Jahre"],
          ru: "Окупаемость = инвестиция ÷ ежемесячная чистая выгода (экономия минус текущие расходы).",
          merke: "Amortisationsdauer = Investition ÷ jährlicher (monatlicher) Rückfluss."
        };
      } },
    { id: "nutzwert", gruppe: "wirtschaft", titel: "Nutzwertanalyse", ru: "Анализ полезности",
      gen: R => {
        const kriterien = R.mischen(["Preis", "Bedienbarkeit", "Datenschutz", "Support", "Schnittstellen", "Skalierbarkeit", "Lieferzeit"]).slice(0, 3);
        const gew = R.pick([[50, 30, 20], [40, 40, 20], [40, 35, 25], [60, 25, 15], [45, 35, 20]]);
        let a, b, na, nb;
        do {
          a = [R.int(2, 10), R.int(2, 10), R.int(2, 10)]; b = [R.int(2, 10), R.int(2, 10), R.int(2, 10)];
          na = a.reduce((s, p, i) => s + p * gew[i] / 100, 0); nb = b.reduce((s, p, i) => s + p * gew[i] / 100, 0);
        } while (Math.abs(na - nb) < 0.1);
        const tab = kriterien.map((k, i) => [k + " (" + gew[i] + " %)", "A: " + a[i] + " · B: " + b[i] + " Punkte"]);
        return {
          situation: "Für ein CRM-System liegen zwei Angebote vor. Die Punkte (1–10) wurden je Kriterium vergeben.",
          gegeben: tab,
          frage: "Berechnen Sie die Nutzwerte (gewichtete Punktsumme) von Angebot A und B und entscheiden Sie sich.",
          felder: [{ id: "a", label: "Nutzwert A", soll: na, tol: 0.01 }, { id: "b", label: "Nutzwert B", soll: nb, tol: 0.01 },
            { id: "w", label: "Entscheidung", art: "wahl", optionen: ["Angebot A", "Angebot B"], soll: na > nb ? 0 : 1 }],
          weg: ["A: " + a.map((p, i) => p + " × " + f(gew[i] / 100) ).join(" + ") + " = " + f(na),
            "B: " + b.map((p, i) => p + " × " + f(gew[i] / 100)).join(" + ") + " = " + f(nb),
            "Höherer Nutzwert gewinnt: Angebot " + (na > nb ? "A" : "B") + "."],
          ru: "Баллы по каждому критерию × вес критерия, затем сумма. Выигрывает вариант с бо́льшей суммой.",
          merke: "Gewichte zusammen = 100 %."
        };
      } },
    { id: "kostenvergleich", gruppe: "wirtschaft", titel: "Kostenvergleich: einmalig und monatlich", ru: "Сравнение затрат: разовые и ежемесячные",
      gen: R => {
        const m1 = R.schritt(20, 120, 5), diffM = R.schritt(10, 60, 5), diffA = diffM * R.int(6, 36);
        const a2 = R.schritt(300, 2000, 100), a1 = a2 + diffA, m2 = m1 + diffM, schnitt = diffA / diffM;
        return {
          situation: "Zwei Lösungen für die Datensicherung werden verglichen.",
          gegeben: [["Lösung A", "einmalig " + f(a1, 0) + " €, monatlich " + f(m1, 0) + " €"], ["Lösung B", "einmalig " + f(a2, 0) + " €, monatlich " + f(m2, 0) + " €"]],
          frage: "Nach wie vielen Monaten sind die Gesamtkosten gleich? Welche Lösung ist bei 48 Monaten Nutzung günstiger?",
          felder: [{ id: "m", label: "Gleiche Kosten nach", einheit: "Monaten", soll: schnitt, tol: 0.05 },
            { id: "w", label: "Bei 48 Monaten günstiger", art: "wahl", optionen: ["Lösung A", "Lösung B", "beide gleich"], soll: schnitt < 48 ? 0 : schnitt > 48 ? 1 : 2 }],
          weg: [f(a1, 0) + " + " + f(m1, 0) + " · m = " + f(a2, 0) + " + " + f(m2, 0) + " · m",
            f(a1 - a2, 0) + " = " + f(m2 - m1, 0) + " · m  →  m = " + f(schnitt) + " Monate",
            "48 Monate: A = " + f(a1 + 48 * m1, 0) + " €, B = " + f(a2 + 48 * m2, 0) + " €"],
          ru: "Составь уравнение: разовые + ежемесячные × m для обоих вариантов, приравняй и реши относительно m."
        };
      } }
  ];

  const S = {
    id: "rechnen", titel: "Rechen-Trainer AP2", eyebrow: "Rechnen", topic: "rechnen",
    ru: "Задачи на расчёт как в GA1/GA2: каждый раз новые числа. Сначала сама, потом сравни с ходом решения. Ответы с запятой или точкой, единицу можно не писать.",
    kachel: { name: "Rechen-Trainer", unten: "Speicher · Übertragung · RAID · Break-even · Nutzwert", ikon: "rechnen" },
    gruppen: [{ id: "speicher", titel: "Speicher und Einheiten", ru: "Объём памяти, биты и байты, десятичные и двоичные приставки" },
      { id: "netz", titel: "Übertragung und RAID", ru: "Время передачи, ёмкость RAID" },
      { id: "wirtschaft", titel: "Wirtschaftlichkeit", ru: "Безубыточность, окупаемость, анализ полезности, сравнение затрат" }],
    aufgaben
  };
  root.AP2_RECHNEN = S;
  if (root.GENUEBGEN) root.GENUEBGEN.sammlung(S);
  if (typeof module === "object" && module.exports) module.exports = S;
})(typeof window !== "undefined" ? window : globalThis);
