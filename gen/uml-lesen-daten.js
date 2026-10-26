/* ============================================================================
   gen/uml-lesen-daten.js — UML-Diagramme lesen (Sammlung für gen/uebung-gen.js)
   ----------------------------------------------------------------------------
   Das Diagramm wird bei jedem Versuch neu gezeichnet (SVG), die Fragen prüft
   die App selbst:
     • Multiplizitäten einer Assoziation lesen
     • Beziehungsart am Linienende erkennen (Assoziation, Aggregation,
       Komposition, Vererbung, Abhängigkeit)
     • Zustandsdiagramm: Ereignisfolge durchspielen (Endzustand, Übergänge)
   ========================================================================== */
"use strict";
(function (root) {
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const PAARE = [["Kunde", "Bestellung"], ["Abteilung", "Mitarbeiter"], ["Projekt", "Aufgabe"], ["Lager", "Artikel"], ["Kurs", "Teilnehmer"], ["Server", "Dienst"], ["Rechnung", "Position"], ["Team", "Entwickler"]];
  const MULT = ["1", "0..1", "1..*", "0..*"];
  const MIN = { "1": 1, "0..1": 0, "1..*": 1, "0..*": 0 }, MAXV = { "1": "1", "0..1": "1", "1..*": "*", "0..*": "*" };

  /* ---- Zeichnen ---- */
  function klasse(x, y, name) {
    return '<rect x="' + x + '" y="' + y + '" width="130" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<text x="' + (x + 65) + '" y="' + (y + 28) + '" text-anchor="middle" font-size="15" font-weight="700">' + esc(name) + '</text>';
  }
  function zweiKlassen(a, b, links, rechts, art) {
    /* Linie von x=150 bis x=270, y=63 */
    const y = 63, x1 = 150, x2 = 270;
    let ende = "", linie = 'stroke="currentColor" stroke-width="1.6"', start = x1, ziel = x2;
    if (art === "aggregation" || art === "komposition") {
      ende = '<polygon points="' + x1 + ',' + y + ' ' + (x1 + 12) + ',' + (y - 7) + ' ' + (x1 + 24) + ',' + y + ' ' + (x1 + 12) + ',' + (y + 7) + '" ' + (art === "komposition" ? 'fill="currentColor"' : 'fill="var(--card,#fff)"') + ' stroke="currentColor" stroke-width="1.6"/>';
      start = x1 + 24;
    } else if (art === "vererbung") {
      ende = '<polygon points="' + x1 + ',' + y + ' ' + (x1 + 16) + ',' + (y - 9) + ' ' + (x1 + 16) + ',' + (y + 9) + '" fill="var(--card,#fff)" stroke="currentColor" stroke-width="1.6"/>';
      start = x1 + 16;
    } else if (art === "abhaengigkeit") {
      linie += ' stroke-dasharray="6 4"';
      ende = '<path d="M' + (x1 + 14) + ',' + (y - 8) + ' L' + x1 + ',' + y + ' L' + (x1 + 14) + ',' + (y + 8) + '" fill="none" stroke="currentColor" stroke-width="1.6"/>';
    }
    return '<svg viewBox="0 0 420 110" width="420" role="img" aria-label="Klassendiagramm ' + esc(a) + " und " + esc(b) + '">' +
      klasse(20, 40, a) + klasse(270, 40, b) +
      '<line x1="' + start + '" y1="' + y + '" x2="' + ziel + '" y2="' + y + '" ' + linie + '/>' + ende +
      (links ? '<text x="' + (x1 + 30) + '" y="' + (y - 10) + '" font-size="14">' + esc(links) + '</text>' : "") +
      (rechts ? '<text x="' + (x2 - 8) + '" y="' + (y - 10) + '" font-size="14" text-anchor="end">' + esc(rechts) + '</text>' : "") + "</svg>";
  }
  /* Zustandsdiagramm: Zustände mit festen Positionen, Übergänge als Linien mit Pfeil und Beschriftung */
  const L = 10, R2 = 300, Z1 = 22, Z2 = 132, Z3 = 242;      /* zwei Spalten, drei Zeilen */
  const AUTOMATEN = [
    { name: "Bestellung", start: "neu",
      z: { "neu": [L, Z1], "bezahlt": [R2, Z1], "storniert": [L, Z2], "versendet": [R2, Z2], "zugestellt": [R2, Z3] },
      t: [["neu", "bezahlen", "bezahlt"], ["neu", "stornieren", "storniert"], ["bezahlt", "versenden", "versendet"], ["bezahlt", "stornieren", "storniert"], ["versendet", "zustellen", "zugestellt"]] },
    { name: "Ticket", start: "offen",
      z: { "offen": [L, Z1], "in Arbeit": [R2, Z1], "wartet": [L, Z2], "gelöst": [R2, Z2], "geschlossen": [R2, Z3] },
      t: [["offen", "annehmen", "in Arbeit"], ["in Arbeit", "rückfragen", "wartet"], ["wartet", "antworten", "in Arbeit"], ["in Arbeit", "lösen", "gelöst"], ["gelöst", "bestätigen", "geschlossen"], ["gelöst", "ablehnen", "in Arbeit"]] },
    { name: "Benutzerkonto", start: "angelegt",
      z: { "angelegt": [L, Z1], "aktiv": [R2, Z1], "gelöscht": [L, Z2], "gesperrt": [R2, Z2] },
      t: [["angelegt", "aktivieren", "aktiv"], ["aktiv", "3x falsches Passwort", "gesperrt"], ["gesperrt", "entsperren", "aktiv"], ["aktiv", "löschen", "gelöscht"], ["gesperrt", "löschen", "gelöscht"]] }
  ];
  function automatSvg(A) {
    const B = 120, H = 40, mitte = n => [A.z[n][0] + B / 2, A.z[n][1] + H / 2];
    const hoehe = Math.max.apply(null, Object.keys(A.z).map(n => A.z[n][1])) + H + 8;
    let s = '<svg viewBox="0 0 430 ' + hoehe + '" width="430" role="img" aria-label="Zustandsdiagramm ' + esc(A.name) + '"><defs><marker id="pf" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8 z" fill="currentColor"/></marker></defs>';
    const [sx, sy] = A.z[A.start];
    s += '<circle cx="' + (sx + 14) + '" cy="' + (sy - 12) + '" r="5" fill="currentColor"/><line x1="' + (sx + 14) + '" y1="' + (sy - 7) + '" x2="' + (sx + 14) + '" y2="' + (sy - 1) + '" stroke="currentColor" stroke-width="1.4"/>';
    /* Gegenläufige Übergänge: Linien leicht versetzt, Beschriftung bei 1/3 bzw. 2/3 der Linie */
    const hatRueck = (v, n) => A.t.some(t => t[0] === n && t[2] === v);
    let texte = "";
    A.t.forEach(([von, ev, nach]) => {
      const [x1, y1] = mitte(von), [x2, y2] = mitte(nach);
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      const kx = Math.abs(ux) > 0.01 ? (B / 2) / Math.abs(ux) : 1e9, ky = Math.abs(uy) > 0.01 ? (H / 2) / Math.abs(uy) : 1e9, k = Math.min(kx, ky) + 2;
      const rueck = hatRueck(von, nach), v = rueck ? 7 : 0, px = -uy, py = ux;
      const a1 = [x1 + ux * k + px * v, y1 + uy * k + py * v], a2 = [x2 - ux * k + px * v, y2 - uy * k + py * v];
      s += '<line x1="' + a1[0].toFixed(1) + '" y1="' + a1[1].toFixed(1) + '" x2="' + a2[0].toFixed(1) + '" y2="' + a2[1].toFixed(1) + '" stroke="currentColor" stroke-width="1.4" marker-end="url(#pf)"/>';
      const q = rueck ? 0.33 : 0.5;
      const lx = a1[0] + (a2[0] - a1[0]) * q, ly = a1[1] + (a2[1] - a1[1]) * q + 4.5;
      texte += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" font-size="13" font-weight="600" text-anchor="middle" stroke="var(--card,#fff)" stroke-width="4" paint-order="stroke">' + esc(ev) + '</text>';
    });
    Object.keys(A.z).forEach(n => { const [x, y] = A.z[n]; s += '<rect x="' + x + '" y="' + y + '" width="' + B + '" height="' + H + '" rx="14" fill="var(--card,#fff)" stroke="currentColor" stroke-width="1.6"/><text x="' + (x + B / 2) + '" y="' + (y + 25) + '" font-size="15" text-anchor="middle">' + esc(n) + '</text>'; });
    return s + texte + "</svg>";
  }
  /** Ereignisfolge durchspielen: Ereignis ohne passenden Übergang wird ignoriert */
  function durchspielen(A, folge) {
    let z = A.start, n = 0;
    folge.forEach(ev => { const t = A.t.find(x => x[0] === z && x[1] === ev); if (t) { z = t[2]; n++; } });
    return { zustand: z, uebergaenge: n };
  }

  const aufgaben = [
    { id: "multiplizitaet", gruppe: "uml", titel: "Multiplizitäten lesen", ru: "Читать кратности",
      gen: R => {
        const [a, b] = R.pick(PAARE), links = R.pick(MULT), rechts = R.pick(MULT);
        const maxB = MAXV[rechts], minA = MIN[links];
        const opt = ["genau 1", "höchstens 1", "beliebig viele"], idx = maxB === "*" ? 2 : rechts === "1" ? 0 : 1;
        return {
          situation: "Gegeben ist ein Ausschnitt aus einem Klassendiagramm.",
          bild: zweiKlassen(a, b, links, rechts, "assoziation"),
          frage: "Beantworten Sie die Fragen anhand der Multiplizitäten.",
          felder: [{ id: "max", label: "Wie viele " + b + "-Objekte kann ein " + a + "-Objekt höchstens haben?", art: "wahl", optionen: opt, soll: idx },
            { id: "muss", label: "Muss jedes " + b + "-Objekt zu einem " + a + "-Objekt gehören?", art: "wahl", optionen: ["ja, mindestens zu einem", "nein, es kann auch ohne sein"], soll: minA >= 1 ? 0 : 1 },
            { id: "min", label: "Wie viele " + b + "-Objekte muss ein " + a + "-Objekt mindestens haben?", soll: MIN[rechts], tol: 0 }],
          weg: ["Die Multiplizität an der Seite von " + b + " (" + rechts + ") sagt, wie viele " + b + " zu EINEM " + a + " gehören.", "Die Multiplizität an der Seite von " + a + " (" + links + ") sagt, wie viele " + a + " zu EINEM " + b + " gehören.",
            "Untergrenze vor den zwei Punkten, Obergrenze danach; * = beliebig viele, eine einzelne Zahl = genau so viele."],
          ru: "Кратность читаем «через линию»: число у класса B говорит, сколько объектов B связано с одним объектом A. 0..1 — не больше одного (может не быть), 1..* — хотя бы один.",
          merke: "Multiplizität steht beim Ziel: „ein " + a + " hat " + rechts + " " + b + "“."
        };
      } },
    { id: "beziehung", gruppe: "uml", titel: "Beziehungsart erkennen", ru: "Распознать вид связи",
      gen: R => {
        const arten = [["assoziation", "Assoziation", "einfache Linie: Objekte kennen sich."],
          ["aggregation", "Aggregation", "leere Raute beim Ganzen: Teile können auch ohne das Ganze existieren."],
          ["komposition", "Komposition", "gefüllte Raute beim Ganzen: Teile existieren nur mit dem Ganzen."],
          ["vererbung", "Vererbung (Generalisierung)", "leeres Dreieck zeigt auf die Oberklasse."],
          ["abhaengigkeit", "Abhängigkeit", "gestrichelter Pfeil: eine Klasse benutzt die andere."]];
        const k = R.int(0, arten.length - 1), [a, b] = R.pick(PAARE);
        const namen = arten[k][0] === "vererbung" ? R.pick([["Fahrzeug", "Auto"], ["Person", "Kunde"], ["Konto", "Girokonto"], ["Medium", "Buch"]]) : [a, b];
        return {
          situation: "Gegeben ist ein Ausschnitt aus einem Klassendiagramm.",
          bild: zweiKlassen(namen[0], namen[1], "", "", arten[k][0]),
          frage: "Welche Beziehung ist dargestellt?",
          felder: [{ id: "art", label: "Beziehung", art: "wahl", optionen: arten.map(x => x[1]), soll: k }],
          weg: [arten[k][1] + ": " + arten[k][2]],
          ru: "Пустой ромб — агрегация, закрашенный ромб — композиция, пустой треугольник — наследование, пунктирная стрелка — зависимость, простая линия — ассоциация."
        };
      } },
    { id: "zustand", gruppe: "uml", titel: "Zustandsdiagramm durchspielen", ru: "Пройти диаграмму состояний",
      gen: R => {
        const A = R.pick(AUTOMATEN);
        const ereignisse = Array.from(new Set(A.t.map(t => t[1])));
        const folge = Array.from({ length: R.int(3, 5) }, () => R.pick(ereignisse));
        const r = durchspielen(A, folge), zust = Object.keys(A.z);
        let z = A.start; const schritte = folge.map(ev => { const t = A.t.find(x => x[0] === z && x[1] === ev); const vor = z; if (t) z = t[2]; return t ? vor + " —" + ev + "→ " + z : ev + ": kein Übergang aus „" + vor + "“, Zustand bleibt."; });
        return {
          situation: "Gegeben ist das Zustandsdiagramm „" + A.name + "“. Ein Objekt befindet sich im Startzustand. Ein Ereignis, für das es im aktuellen Zustand keinen Übergang gibt, wird ignoriert.",
          bild: automatSvg(A),
          gegeben: [["Ereignisse nacheinander", folge.join(" → ")]],
          frage: "In welchem Zustand ist das Objekt danach? Wie viele Zustandsübergänge fanden statt?",
          felder: [{ id: "z", label: "Endzustand", art: "wahl", optionen: zust, soll: zust.indexOf(r.zustand) }, { id: "n", label: "Anzahl Übergänge", soll: r.uebergaenge, tol: 0 }],
          weg: ["Start: " + A.start].concat(schritte),
          ru: "Начинаем с начального состояния (чёрная точка). Для каждого события ищем стрелку из текущего состояния с этим событием; если её нет, состояние не меняется."
        };
      } }
  ];

  const S = {
    id: "uml-lesen", titel: "UML-Diagramme lesen", eyebrow: "UML", topic: "oop",
    ru: "Каждый раз новая диаграмма: кратности, вид связи, проход по диаграмме состояний. Проверка автоматическая.",
    kachel: { name: "UML lesen", unten: "Multiplizität · Beziehung · Zustände", ikon: "diagramm" },
    gruppen: [{ id: "uml", titel: "Diagramme lesen", ru: "Читать UML" }],
    aufgaben, AUTOMATEN, durchspielen
  };
  root.AP2_UML_LESEN = S;
  if (root.GENUEBGEN) root.GENUEBGEN.sammlung(S);
  if (typeof module === "object" && module.exports) module.exports = S;
})(typeof window !== "undefined" ? window : globalThis);
