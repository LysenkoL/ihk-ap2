/* ============================================================================
   gen/cps-daten.js — Cyber-physische Systeme (Sammlung für gen/uebung-gen.js)
   ----------------------------------------------------------------------------
   Katalog 2025 (CPS): Sensor oder Aktor wählen, Abtastintervall bestimmen
   (Abtasttheorem), Datenmenge einer Messreihe, Auflösung eines A/D-Wandlers,
   Polling oder Interrupt. Eigene Aufgaben, jedes Mal neue Werte.
   ========================================================================== */
"use strict";
(function (root) {
  const f = (x, n) => (root.GENUEBGEN ? root.GENUEBGEN.fmt(x, n) : String(x));
  /* Anforderung → [richtiges Gerät, ist Sensor?] */
  const GERAETE = [
    ["Die Temperatur im Serverraum soll überwacht werden.", "Temperatursensor", true],
    ["Es soll erkannt werden, ob ein Fenster geöffnet ist.", "Magnetkontakt (Reedkontakt)", true],
    ["Der Abstand eines Fahrzeugs zur Wand soll gemessen werden.", "Ultraschallsensor", true],
    ["Bewegungen in einem Flur sollen erkannt werden, um das Licht einzuschalten.", "Bewegungsmelder (PIR-Sensor)", true],
    ["Die Luftfeuchtigkeit im Gewächshaus soll gemessen werden.", "Feuchtesensor (Hygrometer)", true],
    ["Ein Ventil für die Bewässerung soll geöffnet und geschlossen werden.", "Magnetventil", false],
    ["Eine Klappe soll in eine bestimmte Position gedreht werden.", "Servomotor", false],
    ["Eine Warnleuchte soll bei Alarm blinken.", "Signalleuchte (LED)", false],
    ["Ein Lüfter soll bei hoher Temperatur eingeschaltet werden.", "Relais mit Lüftermotor", false],
    ["Die Helligkeit im Büro soll gemessen werden, um die Jalousie zu steuern.", "Lichtsensor (Fotodiode)", true],
    ["Das Gewicht eines Pakets auf dem Förderband soll bestimmt werden.", "Wägezelle (Dehnungsmessstreifen)", true],
    ["Ein Türschloss soll per App geöffnet werden.", "elektrischer Türöffner (Elektromagnet)", false]
  ];

  const aufgaben = [
    { id: "geraet", gruppe: "cps", titel: "Sensor oder Aktor?", ru: "Датчик или исполнительное устройство?",
      gen: R => {
        const g = R.pick(GERAETE);
        const andere = R.mischen(GERAETE.filter(x => x !== g)).slice(0, 3).map(x => x[1]);
        const opt = R.mischen([g[1]].concat(andere));
        return {
          situation: "In einem Smart-Building-Projekt sollen Geräte ausgewählt werden. " + g[0],
          frage: "Ist ein Sensor oder ein Aktor nötig? Welches Gerät passt?",
          felder: [{ id: "art", label: "Art", art: "wahl", optionen: ["Sensor (misst / erfasst)", "Aktor (wirkt / bewegt / schaltet)"], soll: g[2] ? 0 : 1 },
            { id: "g", label: "Gerät", art: "wahl", optionen: opt, soll: opt.indexOf(g[1]) }],
          weg: [g[2] ? "Etwas wird gemessen oder erkannt → Sensor." : "Etwas wird bewegt, geschaltet oder angezeigt → Aktor.", "Passend: " + g[1] + "."],
          ru: "Датчик (Sensor) переводит физическую величину в сигнал. Исполнительное устройство (Aktor) превращает сигнал в действие: движение, свет, звук, переключение.",
          merke: "Sensor: Physik → Signal. Aktor: Signal → Physik."
        };
      } },
    { id: "abtast", gruppe: "cps", titel: "Abtastintervall (Abtasttheorem)", ru: "Интервал опроса (теорема отсчётов)",
      gen: R => {
        const hz = R.pick([0.5, 1, 2, 4, 5, 10, 20, 25, 50, 100]);
        const fa = 2 * hz, ms = 1000 / fa;
        return {
          situation: "Ein Sensor misst Schwingungen an einer Maschine. Das Signal ändert sich höchstens mit " + f(hz) + " Hz.",
          gegeben: [["höchste Signalfrequenz", f(hz) + " Hz"], ["Regel", "Abtastfrequenz mindestens doppelt so hoch wie die höchste Signalfrequenz"]],
          frage: "Wie hoch muss die Abtastfrequenz mindestens sein? Wie groß darf das Abtastintervall höchstens sein (in ms)?",
          felder: [{ id: "fa", label: "Abtastfrequenz mindestens", einheit: "Hz", soll: fa, tol: 0.001 }, { id: "ms", label: "Abtastintervall höchstens", einheit: "ms", soll: ms, tol: 0.01 }],
          weg: ["Abtastfrequenz ≥ 2 × " + f(hz) + " Hz = " + f(fa) + " Hz", "Intervall = 1 ÷ " + f(fa) + " Hz = " + f(1 / fa, 4) + " s = " + f(ms) + " ms"],
          ru: "Чтобы не потерять изменения сигнала, опрашивать нужно минимум в два раза чаще его наибольшей частоты (Nyquist–Shannon). Интервал — обратная величина частоты.",
          merke: "f_Abtast ≥ 2 · f_max; Intervall = 1 / f_Abtast."
        };
      } },
    { id: "ereignis", gruppe: "cps", titel: "Polling: kein Ereignis verpassen", ru: "Опрос: не пропустить событие",
      gen: R => {
        const dauer = R.pick([50, 100, 200, 250, 400, 500, 1000]), intervall = R.pick([20, 40, 80, 150, 300, 600, 800]);
        const ok = intervall < dauer, maxInt = dauer / 2;
        return {
          situation: "Ein Taster an einer Maschine wird per Polling abgefragt. Ein Tastendruck dauert mindestens " + dauer + " ms. Das Programm fragt den Taster alle " + intervall + " ms ab.",
          frage: "Wird jeder Tastendruck sicher erkannt? Welches Intervall ist mit Sicherheitsfaktor 2 höchstens sinnvoll? Was ist die Alternative zu Polling?",
          felder: [{ id: "ok", label: "Jeder Tastendruck erkannt?", art: "wahl", optionen: ["ja", "nein"], soll: ok ? 0 : 1 },
            { id: "max", label: "Intervall höchstens (Faktor 2)", einheit: "ms", soll: maxInt, tol: 0.5 },
            { id: "alt", label: "Alternative", art: "wahl", optionen: ["Interrupt (das Ereignis meldet sich selbst)", "längeres Intervall", "Busy Waiting", "Watchdog"], soll: 0 }],
          weg: [ok ? "Intervall " + intervall + " ms < Dauer " + dauer + " ms → jeder Druck fällt in mindestens eine Abfrage." : "Intervall " + intervall + " ms ≥ Dauer " + dauer + " ms → ein kurzer Druck kann zwischen zwei Abfragen liegen.",
            "Mit Faktor 2: " + dauer + " ÷ 2 = " + f(maxInt) + " ms", "Interrupt: Die Hardware meldet das Ereignis sofort, das Programm muss nicht ständig fragen."],
          ru: "Polling — программа сама регулярно спрашивает датчик: просто, но тратит время и может пропустить короткое событие. Interrupt — датчик сам сообщает о событии.",
          merke: "Polling-Intervall kürzer als das kürzeste Ereignis (sicher: halb so lang)."
        };
      } },
    { id: "messreihe", gruppe: "cps", titel: "Datenmenge einer Messreihe", ru: "Объём данных серии измерений",
      gen: R => {
        const bit = R.pick([8, 10, 12, 16, 24]), hz = R.pick([10, 50, 100, 200, 500, 1000]), kanaele = R.int(1, 8), std = R.pick([1, 2, 8, 24]);
        const byteWert = Math.ceil(bit / 8), byte = byteWert * hz * kanaele * std * 3600, mib = byte / (1024 * 1024);
        return {
          situation: "Ein Messsystem zeichnet Werte eines A/D-Wandlers auf. Jeder Messwert wird in ganzen Bytes gespeichert.",
          gegeben: [["Auflösung", bit + " Bit je Wert"], ["Abtastrate", hz + " Hz"], ["Kanäle", String(kanaele)], ["Dauer", std + (std === 1 ? " Stunde" : " Stunden")]],
          frage: "Wie viele Byte braucht ein Messwert? Wie groß ist die Messreihe in MiB (zwei Nachkommastellen)?",
          felder: [{ id: "b", label: "Byte je Messwert", soll: byteWert, tol: 0 }, { id: "mib", label: "Datenmenge", einheit: "MiB", soll: mib, rel: 0.003 }],
          weg: [bit + " Bit ÷ 8 = " + f(bit / 8) + " → aufgerundet " + byteWert + " Byte", "Werte: " + hz + " × " + kanaele + " × " + std + " × 3.600 s = " + f(hz * kanaele * std * 3600, 0),
            "× " + byteWert + " Byte = " + f(byte, 0) + " Byte ÷ 1.024² = " + f(mib) + " MiB"],
          ru: "Значение из АЦП хранится целыми байтами: 12 бит → 2 байта. Число значений = частота × каналы × секунды."
        };
      } },
    { id: "adc", gruppe: "cps", titel: "Auflösung eines A/D-Wandlers", ru: "Разрешение АЦП",
      gen: R => {
        const bit = R.pick([8, 10, 12]), u = R.pick([3.3, 5, 10]), stufen = Math.pow(2, bit), lsb = u / stufen * 1000;
        const mess = Math.round(R.zahl() * u * 100) / 100, digital = Math.min(stufen - 1, Math.floor(mess / (u / stufen)));   /* höchster Wert: 2^n − 1 */
        return {
          situation: "Ein Temperatursensor liefert eine Spannung, die ein A/D-Wandler in eine Zahl umwandelt.",
          gegeben: [["A/D-Wandler", bit + " Bit"], ["Messbereich", "0 bis " + f(u) + " V"], ["Auflösung", "Messbereich ÷ 2^n"], ["Gemessene Spannung", f(mess) + " V"]],
          frage: "Wie viele Stufen hat der Wandler? Wie groß ist eine Stufe in mV (zwei Nachkommastellen)? Welcher Digitalwert wird ausgegeben (abgerundet)?",
          felder: [{ id: "s", label: "Stufen", soll: stufen, tol: 0 }, { id: "lsb", label: "Spannung je Stufe", einheit: "mV", soll: lsb, tol: 0.01 },
            { id: "d", label: "Digitalwert", soll: digital, tol: 1, hinweis: "± 1 wird wegen Rundung akzeptiert." }],
          weg: ["Stufen: 2^" + bit + " = " + f(stufen, 0), "Je Stufe: " + f(u) + " V ÷ " + f(stufen, 0) + " = " + f(lsb, 3) + " mV", "Digitalwert: " + f(mess) + " V ÷ " + f(lsb / 1000, 6) + " V = " + f(mess / (u / stufen)) + " → " + digital],
          ru: "n-битный АЦП делит диапазон на 2ⁿ ступеней. Шаг = диапазон ÷ 2ⁿ. Цифровое значение = напряжение ÷ шаг (целая часть)."
        };
      } }
  ];

  const S = {
    id: "cps", titel: "Cyber-physische Systeme", eyebrow: "CPS", topic: "cps",
    ru: "Датчики и исполнительные устройства, частота и интервал опроса, polling или interrupt, объём данных и АЦП — каждый раз новые значения.",
    kachel: { name: "CPS: Sensoren & Aktoren", unten: "Abtastung · Polling · A/D-Wandler", ikon: "werkzeug" },
    gruppen: [{ id: "cps", titel: "Sensoren, Aktoren, Abtastung", ru: "Киберфизические системы" }],
    aufgaben, GERAETE
  };
  root.AP2_CPS = S;
  if (root.GENUEBGEN) root.GENUEBGEN.sammlung(S);
  if (typeof module === "object" && module.exports) module.exports = S;
})(typeof window !== "undefined" ? window : globalThis);
