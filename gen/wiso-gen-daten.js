/* ============================================================================
   gen/wiso-gen-daten.js — WiSo-Rechner (Sammlung für gen/uebung-gen.js)
   ----------------------------------------------------------------------------
   Lohn Brutto → Netto, Urlaub (BUrlG, JArbSchG), Kündigungsfrist (§ 622 BGB),
   Größe von Betriebsrat und JAV, Rechte des Betriebsrats, Rechtsformen,
   Rentabilität, Produktivität und Wirtschaftlichkeit.
   Eigene Aufgaben, jedes Mal neue Werte. Beitragssätze stehen in der Aufgabe
   (wie in der Prüfung), damit nichts von aktuellen Werten abhängt.
   ========================================================================== */
"use strict";
(function (root) {
  const f = (x, n) => (root.GENUEBGEN ? root.GENUEBGEN.fmt(x, n) : String(x));
  const eur = x => { const t = f(x, 2); return (/,\d\d$/.test(t) ? t : /,\d$/.test(t) ? t + "0" : t + ",00") + " €"; };
  const cent = x => Math.round(x * 100) / 100;
  const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  /* ---------- Datum (UTC, ohne Zeitzonen-Ärger) ---------- */
  const tag = (j, m, d) => new Date(Date.UTC(j, m, d));
  const plusTage = (dt, n) => new Date(dt.getTime() + n * 86400000);
  const monatsende = (j, m) => tag(j, m + 1, 0);
  /** § 188 Abs. 2 BGB: Frist in Monaten endet am gleichen Tag des späteren Monats (sonst am Monatsletzten) */
  function plusMonate(dt, n) {
    const j = dt.getUTCFullYear(), m = dt.getUTCMonth() + n, d = dt.getUTCDate();
    const letzter = monatsende(j, m).getUTCDate();
    return tag(j, m, Math.min(d, letzter));
  }
  const datum = dt => String(dt.getUTCDate()).padStart(2, "0") + "." + String(dt.getUTCMonth() + 1).padStart(2, "0") + "." + dt.getUTCFullYear();
  const gleich = (a, b) => a.getTime() === b.getTime();

  /** Grundkündigungsfrist § 622 Abs. 1: 4 Wochen zum 15. oder zum Monatsende */
  function grundfrist(zugang) {
    const frueh = plusTage(zugang, 28);
    const j = frueh.getUTCFullYear(), m = frueh.getUTCMonth();
    const f15 = tag(j, m, 15);
    return frueh.getTime() <= f15.getTime() ? f15 : monatsende(j, m);
  }
  /** Verlängerte Frist für den Arbeitgeber § 622 Abs. 2: n Monate zum Monatsende */
  function monatsfrist(zugang, n) {
    const e = plusMonate(zugang, n);
    return monatsende(e.getUTCFullYear(), e.getUTCMonth());
  }
  /** Betriebszugehörigkeit in Jahren → Monate Kündigungsfrist (Arbeitgeber) */
  function agMonate(jahre) {
    return jahre >= 20 ? 7 : jahre >= 15 ? 6 : jahre >= 12 ? 5 : jahre >= 10 ? 4 : jahre >= 8 ? 3 : jahre >= 5 ? 2 : jahre >= 2 ? 1 : 0;
  }
  /** Kündigungstermin: art "probe" | "an" | "ag"; jahre nur für ag */
  function kuendigungsende(art, zugang, jahre) {
    if (art === "probe") return plusTage(zugang, 14);
    const n = art === "ag" ? agMonate(jahre) : 0;
    return n ? monatsfrist(zugang, n) : grundfrist(zugang);
  }

  /* ---------- Betriebsrat § 9 BetrVG, JAV § 62 BetrVG ---------- */
  const BR_STUFEN = [[5, 1], [21, 3], [51, 5], [101, 7], [201, 9], [401, 11], [701, 13], [1001, 15], [1501, 17], [2001, 19]];
  const JAV_STUFEN = [[5, 1], [21, 3], [51, 5], [151, 7], [301, 9], [501, 11], [701, 13], [1001, 15]];
  const stufe = (tab, n) => { let r = 0; tab.forEach(([ab, k]) => { if (n >= ab) r = k; }); return r; };
  const brGroesse = n => stufe(BR_STUFEN, n), javGroesse = n => stufe(JAV_STUFEN, n);

  /* ---------- Urlaub ---------- */
  /** § 5 Abs. 2 BUrlG: Bruchteile ab einem halben Tag aufrunden; kleinere bleiben stehen */
  const urlaubRunden = x => { const r = Math.round(x * 1000) / 1000, g = Math.floor(r); return r - g >= 0.5 ? g + 1 : r; };
  /** § 19 JArbSchG: Alter zu Beginn des Kalenderjahres → Werktage; ab 18 BUrlG 24 */
  const jugendUrlaub = alter => alter < 16 ? 30 : alter < 17 ? 27 : alter < 18 ? 25 : 24;

  /* ---------- Rechte des Betriebsrats ---------- */
  const RECHTE = [
    "Mitbestimmung: ohne Zustimmung des Betriebsrats nicht umsetzbar (sonst Einigungsstelle)",
    "Zustimmungsverweigerungsrecht bei personellen Einzelmaßnahmen (§ 99 BetrVG)",
    "Anhörung: ohne Anhörung ist die Kündigung unwirksam (§ 102 BetrVG)",
    "Unterrichtung und Beratung: Entscheidung bleibt beim Arbeitgeber"
  ];
  const MASSNAHMEN = [
    ["Ein Ticketsystem soll eingeführt werden, das protokolliert, wer wie viele Tickets bearbeitet.", 0, "§ 87 Abs. 1 Nr. 6: technische Einrichtungen, die Verhalten oder Leistung überwachen können."],
    ["Beginn und Ende der täglichen Arbeitszeit und die Pausen sollen neu geregelt werden.", 0, "§ 87 Abs. 1 Nr. 2: Lage der Arbeitszeit und Pausen."],
    ["Für das nächste Jahr soll der Urlaubsplan der Abteilung aufgestellt werden.", 0, "§ 87 Abs. 1 Nr. 5: allgemeine Urlaubsgrundsätze und Urlaubsplan."],
    ["Wegen eines Projekts sollen für vier Wochen Überstunden angeordnet werden.", 0, "§ 87 Abs. 1 Nr. 3: vorübergehende Verlängerung der Arbeitszeit."],
    ["Im Betrieb soll eine Kleiderordnung für den Kundenkontakt gelten.", 0, "§ 87 Abs. 1 Nr. 1: Ordnung des Betriebs und Verhalten der Arbeitnehmer."],
    ["Der Betrieb (150 Beschäftigte) will eine neue Fachinformatikerin einstellen.", 1, "§ 99: Einstellung in Unternehmen mit mehr als 20 wahlberechtigten Arbeitnehmern."],
    ["Ein Mitarbeiter soll dauerhaft in eine andere Abteilung versetzt werden (Betrieb mit 150 Beschäftigten).", 1, "§ 99: Versetzung ist eine personelle Einzelmaßnahme."],
    ["Eine neue Mitarbeiterin soll in eine Entgeltgruppe des Tarifvertrags eingruppiert werden (Betrieb mit 150 Beschäftigten).", 1, "§ 99: Eingruppierung ist eine personelle Einzelmaßnahme."],
    ["Der Arbeitgeber will einem Mitarbeiter ordentlich kündigen.", 2, "§ 102: Der Betriebsrat ist vor jeder Kündigung anzuhören, sonst ist sie unwirksam."],
    ["Der Arbeitgeber will einer Mitarbeiterin fristlos kündigen.", 2, "§ 102 gilt auch für die außerordentliche Kündigung."],
    ["Das Unternehmen plant neue Büroräume und neue Bildschirmarbeitsplätze.", 3, "§ 90: Unterrichtung und Beratung über die Planung von Räumen und Arbeitsplätzen."],
    ["Der Arbeitgeber erstellt die Personalplanung für die nächsten zwei Jahre.", 3, "§ 92: Unterrichtung und Beratung bei der Personalplanung."]
  ];

  /* ---------- Rechtsformen ---------- */
  const HAFTUNG = [
    "nur das Gesellschaftsvermögen (keine persönliche Haftung der Gesellschafter)",
    "unbeschränkt, auch mit dem Privatvermögen",
    "Komplementär unbeschränkt, Kommanditist nur bis zur Höhe seiner Einlage"
  ];
  /* [Situation, Rechtsform, Mindestkapital, Haftung (Index), falsche Rechtsformen, Merke] */
  const FORMEN = [
    ["Frau Roth gründet allein ein IT-Systemhaus mit kaufmännischem Geschäftsbetrieb. Sie will sofort ins Handelsregister, braucht kein Startkapital und nimmt die volle persönliche Haftung in Kauf.",
      "eingetragene Kauffrau (e. Kfr.)", 0, 1, ["GmbH", "OHG", "AG"], "Einzelunternehmen: kein Mindestkapital, volle Haftung, alle Entscheidungen allein."],
    ["Zwei Freunde betreiben gemeinsam einen Onlineshop für Hardware (Handelsgewerbe). Beide wollen die Geschäfte führen und haften gemeinsam mit ihrem ganzen Vermögen.",
      "OHG", 0, 1, ["KG", "GmbH", "e. K."], "OHG: alle Gesellschafter haften unbeschränkt, unmittelbar und gesamtschuldnerisch."],
    ["Herr Wolf führt eine Softwarefirma und haftet persönlich. Seine Tante gibt 40.000 € Kapital dazu, will aber nicht mitarbeiten und nur bis zu ihrer Einlage haften.",
      "KG", 0, 2, ["OHG", "GbR", "AG"], "KG: mindestens ein Komplementär (voll haftend) und ein Kommanditist (haftet bis zur Einlage, keine Geschäftsführung)."],
    ["Drei Gründer wollen ihre Haftung beschränken, haben zusammen aber nur 1.500 € Startkapital.",
      "UG (haftungsbeschränkt)", 1, 0, ["GmbH", "AG", "OHG"], "UG: ab 1 € Stammkapital; 25 % des Jahresüberschusses gehen in eine Rücklage, bis 25.000 € erreicht sind."],
    ["Drei Gesellschafter gründen ein Beratungsunternehmen für IT-Sicherheit. Sie bringen zusammen 30.000 € Stammkapital ein, setzen eine Geschäftsführerin ein und wollen nicht persönlich haften.",
      "GmbH", 25000, 0, ["AG", "OHG", "KG"], "GmbH: Mindeststammkapital 25.000 €, bei der Gründung mindestens 12.500 € eingezahlt; Organe: Geschäftsführung, Gesellschafterversammlung."],
    ["Ein wachsendes Cloud-Unternehmen will sich Kapital von vielen Anlegern über die Börse beschaffen.",
      "AG", 50000, 0, ["GmbH", "KG", "OHG"], "AG: Grundkapital mindestens 50.000 €; Organe: Vorstand, Aufsichtsrat, Hauptversammlung."],
    ["Zwei freiberufliche Webdesigner (kein Handelsgewerbe) wollen ohne Vertrag beim Notar und ohne Registereintrag zusammenarbeiten.",
      "GbR", 0, 1, ["OHG", "e. K.", "AG"], "GbR: entsteht durch Gesellschaftsvertrag (auch mündlich), kein Mindestkapital, Gesellschafter haften persönlich."]
  ];

  const FRISTEN = ["2 Wochen (Probezeit, beliebiger Tag)", "4 Wochen zum 15. oder zum Monatsende", "1 Monat zum Monatsende", "2 Monate zum Monatsende", "3 Monate zum Monatsende",
    "4 Monate zum Monatsende", "5 Monate zum Monatsende", "6 Monate zum Monatsende", "7 Monate zum Monatsende"];

  const aufgaben = [
    /* ---------------- Entgelt ---------------- */
    { id: "lohn", gruppe: "entgelt", topic: "wiso-entgelt", titel: "Lohn: Brutto → Netto", ru: "Зарплата: из брутто в нетто",
      gen: R => {
        const brutto = R.schritt(2200, 5000, 50), zusatz = R.pick([1.7, 2.1, 2.5, 2.9]), kinderlos = R.zahl() < 0.5;
        const kirche = R.pick([0, 8, 9]), lst = cent(brutto * R.pick([0.08, 0.1, 0.12, 0.14, 0.16]));
        const kv = cent(brutto * (14.6 + zusatz) / 2 / 100), rv = cent(brutto * 9.3 / 100), av = cent(brutto * 1.3 / 100);
        const pvSatz = kinderlos ? 2.4 : 1.8, pv = cent(brutto * pvSatz / 100);
        const sv = cent(kv + rv + av + pv), kist = cent(lst * kirche / 100), netto = cent(brutto - sv - lst - kist);
        const agSv = cent(kv + rv + av + cent(brutto * 1.8 / 100));
        return {
          situation: "Ein Fachinformatiker (" + (kinderlos ? "28 Jahre, kinderlos" : "34 Jahre, ein Kind") + ") erhält ein Monatsgehalt. Lohnsteuer und Kirchensteuer stehen in der Lohnsteuertabelle; der Solidaritätszuschlag fällt hier nicht an.",
          gegeben: [["Bruttogehalt", eur(brutto)], ["Krankenversicherung", "14,6 % + Zusatzbeitrag " + f(zusatz) + " %, je zur Hälfte"], ["Rentenversicherung", "18,6 %, je zur Hälfte"],
            ["Arbeitslosenversicherung", "2,6 %, je zur Hälfte"], ["Pflegeversicherung", "3,6 %, je zur Hälfte; Kinderlose ab 23 zahlen 0,6 % allein dazu"],
            ["Lohnsteuer", eur(lst)], ["Kirchensteuer", kirche ? kirche + " % der Lohnsteuer" : "keine (nicht in der Kirche)"]],
          frage: "Wie hoch ist der Arbeitnehmeranteil zur Sozialversicherung? Wie hoch ist das Nettogehalt? Wie viel Sozialversicherung zahlt der Arbeitgeber zusätzlich?",
          felder: [{ id: "sv", label: "Sozialversicherung Arbeitnehmer", einheit: "€", soll: sv, tol: 0.05 },
            { id: "netto", label: "Nettogehalt", einheit: "€", soll: netto, tol: 0.05 },
            { id: "ag", label: "Sozialversicherung Arbeitgeber", einheit: "€", soll: agSv, tol: 0.05, hinweis: "Arbeitgeber: KV, RV, AV zur Hälfte, PV 1,8 % (ohne Kinderlosenzuschlag)." }],
          weg: ["KV: " + eur(brutto) + " × " + f((14.6 + zusatz) / 2) + " % = " + eur(kv), "RV: × 9,3 % = " + eur(rv), "AV: × 1,3 % = " + eur(av),
            "PV: × " + f(pvSatz) + " % = " + eur(pv) + (kinderlos ? " (1,8 % + 0,6 % kinderlos)" : ""), "Summe Arbeitnehmer: " + eur(sv),
            kirche ? "Kirchensteuer: " + eur(lst) + " × " + kirche + " % = " + eur(kist) : "keine Kirchensteuer",
            "Netto: " + eur(brutto) + " − " + eur(sv) + " − " + eur(lst) + (kirche ? " − " + eur(kist) : "") + " = " + eur(netto),
            "Arbeitgeber: " + eur(kv) + " + " + eur(rv) + " + " + eur(av) + " + " + eur(cent(brutto * 1.8 / 100)) + " = " + eur(agSv)],
          ru: "Взносы в соцстрахование (KV, RV, AV, PV) делятся пополам между работником и работодателем; надбавка за бездетность в PV — только на работнике. Нетто = брутто − взносы − налоги (Lohnsteuer, Kirchensteuer, Soli).",
          merke: "Netto = Brutto − SV-Anteil AN − Lohnsteuer − Soli − Kirchensteuer."
        };
      } },

    /* ---------------- Arbeitsrecht ---------------- */
    { id: "urlaub-teil", gruppe: "arbeit", topic: "wiso-arbeitsrecht", titel: "Teilurlaub (§ 5 BUrlG)", ru: "Частичный отпуск",
      gen: R => {
        let jahres, monate, eintritt, m, wert;
        for (let i = 0; i < 50; i++) {
          jahres = R.pick([24, 25, 26, 27, 28, 29, 30]); eintritt = R.zahl() < 0.5; m = eintritt ? R.int(7, 11) : R.int(0, 5);
          monate = eintritt ? 12 - m : m + 1; wert = jahres * monate / 12;
          const rest = wert - Math.floor(wert);
          if (rest === 0 || rest >= 0.5) break;
        }
        const soll = urlaubRunden(wert);
        return {
          situation: eintritt
            ? "Eine Mitarbeiterin beginnt am 1. " + MONATE[m] + " in einem neuen Betrieb (5-Tage-Woche). Laut Vertrag stehen ihr " + jahres + " Arbeitstage Urlaub im Jahr zu."
            : "Ein Mitarbeiter arbeitet seit vier Jahren im Betrieb (5-Tage-Woche, " + jahres + " Arbeitstage Urlaub im Jahr). Sein Arbeitsverhältnis endet am " + datum(monatsende(2027, m)) + ".",
          frage: (eintritt ? "Erfüllt sie in diesem Jahr die Wartezeit von 6 Monaten? " : "Wie viele volle Monate hat er im Jahr gearbeitet? ") + "Wie viele Urlaubstage stehen " + (eintritt ? "ihr" : "ihm") + " in diesem Jahr zu?",
          felder: [eintritt ? { id: "w", label: "Wartezeit erfüllt?", art: "wahl", optionen: ["ja", "nein"], soll: 1 } : { id: "m", label: "Volle Monate", soll: monate, tol: 0 },
            { id: "u", label: "Urlaubstage", einheit: "Tage", soll, tol: 0.01 }],
          weg: [eintritt ? "Ab 1. " + MONATE[m] + " bis 31.12. sind es nur " + monate + " Monate → keine 6 Monate Wartezeit → Teilurlaub (§ 5 Abs. 1a)" : "Ausscheiden in der ersten Jahreshälfte → Teilurlaub (§ 5 Abs. 1c), Januar bis " + MONATE[m] + " = " + monate + " Monate",
            jahres + " × " + monate + " ÷ 12 = " + f(wert, 3), soll === wert ? "kein Bruchteil" : "Bruchteil ab einem halben Tag → aufrunden auf " + f(soll)],
          ru: "За каждый полный месяц — 1/12 годового отпуска, если полгода стажа в этом году не набирается или человек уходит в первой половине года. Половина дня и больше округляется вверх.",
          merke: "Teilurlaub = Jahresurlaub × volle Monate ÷ 12; ab 0,5 Tag aufrunden."
        };
      } },
    { id: "urlaub-woche", gruppe: "arbeit", topic: "wiso-arbeitsrecht", titel: "Urlaub bei Teilzeit", ru: "Отпуск при неполной неделе",
      gen: R => {
        const tage = R.pick([2, 3, 4, 5, 6]), vertrag = R.pick([25, 26, 28, 30]);
        const gesetz = 24 * tage / 6, vert = vertrag * tage / 5;
        return {
          situation: "Eine Teilzeitkraft arbeitet an " + tage + " Tagen pro Woche. Vollzeitkräfte im Betrieb arbeiten 5 Tage und haben laut Arbeitsvertrag " + vertrag + " Urlaubstage.",
          gegeben: [["Gesetzlicher Mindesturlaub (BUrlG)", "24 Werktage bei 6 Werktagen pro Woche"], ["Arbeitstage der Teilzeitkraft", tage + " pro Woche"]],
          frage: "Wie viele Urlaubstage sind gesetzlich mindestens zu gewähren? Wie viele Urlaubstage stehen ihr nach dem Arbeitsvertrag zu (anteilig)?",
          felder: [{ id: "g", label: "Gesetzlicher Mindesturlaub", einheit: "Arbeitstage", soll: gesetz, tol: 0.01 },
            { id: "v", label: "Vertraglicher Urlaub (anteilig)", einheit: "Arbeitstage", soll: vert, tol: 0.01 }],
          weg: ["Gesetz: 24 × " + tage + " ÷ 6 = " + f(gesetz), "Vertrag: " + vertrag + " × " + tage + " ÷ 5 = " + f(vert)],
          ru: "Отпуск пересчитывается по числу рабочих дней в неделю: так у всех одинаково недель отдыха. Закон считает от 6-дневной недели (24 Werktage = 4 недели).",
          merke: "Urlaub × eigene Arbeitstage ÷ Tage der Bezugswoche (Gesetz 6, Vertrag meist 5)."
        };
      } },
    { id: "urlaub-jugend", gruppe: "arbeit", topic: "wiso-arbeitsrecht", titel: "Urlaub für Jugendliche (JArbSchG)", ru: "Отпуск несовершеннолетних",
      gen: R => {
        const geb = R.int(2007, 2012), jahr = 2027, monat = R.int(0, 11), alter = jahr - geb - 1;   /* Alter am 1. Januar: Geburtstag liegt im Jahr */
        const soll = jugendUrlaub(alter);
        const opt = [30, 27, 25, 24];
        return {
          situation: "Ein Auszubildender ist am 15. " + MONATE[monat] + " " + geb + " geboren. Es geht um seinen Urlaub im Jahr " + jahr + ".",
          gegeben: [["unter 16 am 1. Januar", "30 Werktage"], ["unter 17", "27 Werktage"], ["unter 18", "25 Werktage"], ["ab 18", "24 Werktage (BUrlG)"]],
          frage: "Wie alt ist er zu Beginn des Jahres " + jahr + "? Wie viele Werktage Urlaub stehen ihm mindestens zu?",
          felder: [{ id: "a", label: "Alter am 1. Januar " + jahr, einheit: "Jahre", soll: alter, tol: 0 },
            { id: "u", label: "Urlaub", art: "wahl", optionen: opt.map(x => x + " Werktage"), soll: opt.indexOf(soll) }],
          weg: ["Geburtstag am 15. " + MONATE[monat] + " liegt nach dem 1. Januar → am 1.1. ist er " + jahr + " − " + geb + " − 1 = " + alter + " Jahre", alter >= 18 ? "volljährig → BUrlG: 24 Werktage" : "§ 19 JArbSchG: " + soll + " Werktage"],
          ru: "Для несовершеннолетних отпуск по JArbSchG зависит от возраста на 1 января: младше 16 — 30, младше 17 — 27, младше 18 — 25 рабочих дней (Werktage, т. е. считая субботу).",
          merke: "Maßgeblich ist das Alter zu Beginn des Kalenderjahres."
        };
      } },
    { id: "kuendigung", gruppe: "arbeit", topic: "wiso-arbeitsrecht", titel: "Kündigungsfrist (§ 622 BGB)", ru: "Срок увольнения",
      gen: R => {
        const jahr = R.pick([2026, 2027, 2028]), art = R.pick(["probe", "an", "ag", "ag", "ag"]);
        const jahre = art === "ag" ? R.pick([1, 3, 4, 6, 9, 11, 13, 16, 22]) : art === "an" ? R.int(1, 15) : 0;
        const zugang = tag(jahr, R.int(0, 10), R.int(1, 28)), ende = kuendigungsende(art, zugang, jahre);
        /* Ablenker: andere Rechenwege */
        const kand = [ende, grundfrist(zugang), plusTage(zugang, 14), monatsende(zugang.getUTCFullYear(), zugang.getUTCMonth() + 1), plusTage(zugang, 28), monatsfrist(zugang, Math.max(1, agMonate(jahre) + 1)), monatsfrist(zugang, 2)];
        const opts = []; kand.forEach(d => { if (opts.length < 4 && !opts.some(x => gleich(x, d))) opts.push(d); });
        const gemischt = R.mischen(opts);
        const fristText = art === "probe" ? "2 Wochen (Probezeit, beliebiger Tag)" : art === "an" || agMonate(jahre) === 0 ? "4 Wochen zum 15. oder zum Monatsende" : agMonate(jahre) + (agMonate(jahre) === 1 ? " Monat" : " Monate") + " zum Monatsende";
        const wer = art === "probe" ? "Der Arbeitgeber kündigt einer neuen Mitarbeiterin in der vereinbarten Probezeit (3. Monat)."
          : art === "an" ? "Ein Mitarbeiter (seit " + jahre + (jahre === 1 ? " Jahr" : " Jahren") + " im Betrieb) kündigt selbst."
          : "Der Arbeitgeber kündigt einer Mitarbeiterin, die seit " + jahre + (jahre === 1 ? " Jahr" : " Jahren") + " im Betrieb ist.";
        return {
          situation: wer + " Es gilt kein Tarifvertrag und im Arbeitsvertrag steht nichts anderes. Die schriftliche Kündigung geht am " + datum(zugang) + " zu.",
          frage: "Welche Frist gilt? Wann endet das Arbeitsverhältnis frühestens? Ist eine Kündigung per E-Mail wirksam?",
          felder: [{ id: "frist", label: "Kündigungsfrist", art: "wahl", optionen: FRISTEN, soll: FRISTEN.indexOf(fristText) },
            { id: "ende", label: "Ende des Arbeitsverhältnisses", art: "wahl", optionen: gemischt.map(datum), soll: gemischt.findIndex(d => gleich(d, ende)) },
            { id: "mail", label: "Kündigung per E-Mail?", art: "wahl", optionen: ["wirksam, wenn unterschrieben eingescannt", "unwirksam: Schriftform mit eigenhändiger Unterschrift (§ 623 BGB)", "wirksam mit Lesebestätigung"], soll: 1 }],
          weg: [art === "ag" ? jahre + " Jahre Betriebszugehörigkeit → " + (agMonate(jahre) ? "verlängerte Frist für den Arbeitgeber (§ 622 Abs. 2): " + fristText : "unter 2 Jahren → Grundfrist") : art === "an" ? "Arbeitnehmer kündigt → immer Grundfrist (§ 622 Abs. 1), die Verlängerung gilt nur für den Arbeitgeber" : "Probezeit (höchstens 6 Monate) → 2 Wochen (§ 622 Abs. 3)",
            art === "probe" ? datum(zugang) + " + 14 Tage = " + datum(ende)
              : art === "ag" && agMonate(jahre) ? datum(zugang) + " + " + agMonate(jahre) + " Monat(e) = " + datum(plusMonate(zugang, agMonate(jahre))) + " → nächstes Monatsende " + datum(ende)
              : datum(zugang) + " + 28 Tage = " + datum(plusTage(zugang, 28)) + " → nächster 15. oder Monatsletzter: " + datum(ende),
            "Kündigung braucht Schriftform: Papier mit eigenhändiger Unterschrift; E-Mail, Fax, Scan sind unwirksam."],
          ru: "Базовый срок — 4 недели к 15-му числу или к концу месяца; в испытательный срок — 2 недели. Для работодателя срок растёт со стажем (2 года → 1 месяц … 20 лет → 7 месяцев, к концу месяца). Увольнение — только на бумаге с подписью.",
          merke: "Zugang + Frist, dann auf den nächsten zulässigen Termin."
        };
      } },

    /* ---------------- Mitbestimmung ---------------- */
    { id: "br-groesse", gruppe: "mitbest", topic: "wiso-sozialpartner", titel: "Betriebsrat und JAV: wie groß?", ru: "Размер Betriebsrat и JAV",
      gen: R => {
        const w = R.pick([R.int(3, 4), R.int(5, 20), R.int(21, 50), R.int(51, 100), R.int(101, 200), R.int(201, 400), R.int(401, 700), R.int(701, 1000), R.int(1001, 1500)]);
        const jug = R.zahl() < 0.25 ? R.int(0, Math.min(4, w)) : R.int(5, Math.max(5, Math.min(320, Math.round(w / 3))));
        const br = brGroesse(w), jav = br && jug >= 5 ? javGroesse(jug) : 0;
        return {
          situation: "Die Nordwerk IT GmbH hat " + w + " wahlberechtigte Arbeitnehmer. Darunter sind " + jug + " Jugendliche unter 18 oder Auszubildende unter 25.",
          gegeben: [["Betriebsrat (§ 9 BetrVG)", "5–20: 1 · 21–50: 3 · 51–100: 5 · 101–200: 7 · 201–400: 9 · 401–700: 11 · 701–1.000: 13 · 1.001–1.500: 15"],
            ["JAV (§ 62 BetrVG)", "5–20: 1 · 21–50: 3 · 51–150: 5 · 151–300: 7 · 301–500: 9"], ["Voraussetzung", "Betriebsrat ab 5 ständigen wahlberechtigten AN; JAV ab 5 Jugendlichen/Azubis unter 25 und nur wenn es einen Betriebsrat gibt"]],
          frage: "Wie viele Mitglieder hat der Betriebsrat? Kann eine JAV gewählt werden? Wie viele Mitglieder hat sie?",
          felder: [{ id: "br", label: "Betriebsratsmitglieder", soll: br, tol: 0, hinweis: "0, wenn kein Betriebsrat möglich ist." },
            { id: "j", label: "JAV möglich?", art: "wahl", optionen: ["ja", "nein"], soll: jav ? 0 : 1 },
            { id: "jav", label: "JAV-Mitglieder", soll: jav, tol: 0 }],
          weg: [w + " wahlberechtigte AN → " + (br ? br + " Betriebsratsmitglied" + (br > 1 ? "er" : "") : "unter 5 → kein Betriebsrat"),
            !br ? "ohne Betriebsrat keine JAV" : jug < 5 ? jug + " Jugendliche/Azubis → unter 5 → keine JAV" : jug + " Jugendliche/Azubis → " + jav + " JAV-Mitglied" + (jav > 1 ? "er" : "")],
          ru: "Размер производственного совета зависит от числа работников с правом голоса (с 16 лет). JAV — представительство молодёжи и учеников: от 5 человек младше 18 или учеников младше 25, и только при наличии Betriebsrat.",
          merke: "Wählen: BR ab 16, JAV unter 18 bzw. Azubis unter 25. Wählbar: BR ab 18 (6 Monate im Betrieb), JAV unter 25."
        };
      } },
    { id: "mitbestimmung", gruppe: "mitbest", topic: "wiso-sozialpartner", titel: "Welches Recht hat der Betriebsrat?", ru: "Какое право у Betriebsrat?",
      gen: R => {
        const m = R.pick(MASSNAHMEN);
        return {
          situation: m[0],
          frage: "Welches Beteiligungsrecht hat der Betriebsrat in diesem Fall?",
          felder: [{ id: "r", label: "Beteiligungsrecht", art: "wahl", optionen: RECHTE.slice(), soll: m[1] }],
          weg: [m[2]],
          ru: "Сильнее всего — Mitbestimmung (§ 87, социальные вопросы: время работы, отпуск-план, контроль техники). Кадровые меры — согласие можно не дать (§ 99). Перед увольнением — обязательное слушание (§ 102). Планирование — только информация и консультация.",
          merke: "§ 87 sozial = Mitbestimmung · § 99 personell = Zustimmungsverweigerung · § 102 Kündigung = Anhörung · §§ 90, 92 = Unterrichtung/Beratung."
        };
      } },

    /* ---------------- Betrieb ---------------- */
    { id: "rechtsform", gruppe: "betrieb", topic: "wiso-rechtsformen", titel: "Welche Rechtsform passt?", ru: "Какая правовая форма подходит?",
      gen: R => {
        const x = R.pick(FORMEN), opt = R.mischen([x[1]].concat(x[4]));
        return {
          situation: x[0],
          frage: "Welche Rechtsform passt? Wie hoch ist das gesetzliche Mindestkapital? Wer haftet für die Schulden?",
          felder: [{ id: "form", label: "Rechtsform", art: "wahl", optionen: opt, soll: opt.indexOf(x[1]) },
            { id: "kap", label: "Mindestkapital", einheit: "€", soll: x[2], tol: 0, hinweis: "0, wenn das Gesetz keins vorschreibt." },
            { id: "haft", label: "Haftung", art: "wahl", optionen: HAFTUNG.slice(), soll: x[3] }],
          weg: [x[1] + ": Mindestkapital " + (x[2] ? f(x[2], 0) + " €" : "keins"), "Haftung: " + HAFTUNG[x[3]], x[5]],
          ru: "Личная неограниченная ответственность: e. K., GbR, OHG (и Komplementär в KG). Ответственность только имуществом общества: GmbH (25 000 €), UG (от 1 €), AG (50 000 €).",
          merke: x[5]
        };
      } },
    { id: "rentabilitaet", gruppe: "betrieb", topic: "wiso-unternehmen", titel: "Rentabilität", ru: "Рентабельность",
      gen: R => {
        const ek = R.schritt(200000, 900000, 10000), fk = R.schritt(100000, 800000, 10000), zins = R.pick([3, 4, 5, 6]);
        const z = fk * zins / 100, gewinn = R.schritt(20000, 150000, 1000), umsatz = R.schritt(800000, 4000000, 50000), gk = ek + fk;
        const ekr = gewinn / ek * 100, gkr = (gewinn + z) / gk * 100, ur = gewinn / umsatz * 100;
        return {
          situation: "Die Jahresabschlusszahlen der Elbe Software GmbH liegen vor.",
          gegeben: [["Eigenkapital", eur(ek)], ["Fremdkapital", eur(fk) + ", Zinssatz " + zins + " %"], ["Jahresgewinn", eur(gewinn)], ["Umsatzerlöse", eur(umsatz)]],
          frage: "Berechnen Sie Eigenkapital-, Gesamtkapital- und Umsatzrentabilität in Prozent (zwei Nachkommastellen).",
          felder: [{ id: "ekr", label: "Eigenkapitalrentabilität", einheit: "%", soll: ekr, tol: 0.01 },
            { id: "gkr", label: "Gesamtkapitalrentabilität", einheit: "%", soll: gkr, tol: 0.01 },
            { id: "ur", label: "Umsatzrentabilität", einheit: "%", soll: ur, tol: 0.01 }],
          weg: ["EK-Rentabilität: " + eur(gewinn) + " ÷ " + eur(ek) + " × 100 = " + f(ekr) + " %",
            "Fremdkapitalzinsen: " + eur(fk) + " × " + zins + " % = " + eur(z),
            "GK-Rentabilität: (" + eur(gewinn) + " + " + eur(z) + ") ÷ " + eur(gk) + " × 100 = " + f(gkr) + " %",
            "Umsatzrentabilität: " + eur(gewinn) + " ÷ " + eur(umsatz) + " × 100 = " + f(ur) + " %"],
          ru: "Рентабельность — прибыль в процентах от вложенного. Для всего капитала к прибыли прибавляют проценты по кредитам: они достаются кредиторам.",
          merke: "GK-Rentabilität = (Gewinn + FK-Zinsen) ÷ (EK + FK) × 100."
        };
      } },
    { id: "kennzahlen", gruppe: "betrieb", topic: "wiso-unternehmen", titel: "Produktivität und Wirtschaftlichkeit", ru: "Производительность и экономичность",
      gen: R => {
        const ma = R.int(4, 12), std = R.pick([7.5, 8]), tage = R.int(18, 22), tickets = R.schritt(1500, 6000, 10);
        const ertrag = R.schritt(80000, 260000, 1000), aufwand = R.schritt(80000, 260000, 1000);
        const stunden = ma * std * tage, prod = tickets / stunden, wirt = ertrag / aufwand;
        return {
          situation: "Der Service-Desk eines IT-Dienstleisters wird für einen Monat ausgewertet.",
          gegeben: [["Mitarbeiter", String(ma)], ["Arbeitszeit", f(std) + " h pro Tag an " + tage + " Tagen"], ["Gelöste Tickets", f(tickets, 0)], ["Erträge des Monats", eur(ertrag)], ["Aufwendungen des Monats", eur(aufwand)]],
          frage: "Wie hoch ist die Arbeitsproduktivität (Tickets je Arbeitsstunde)? Wie hoch ist die Wirtschaftlichkeit (zwei Nachkommastellen)? Arbeitet der Service-Desk wirtschaftlich?",
          felder: [{ id: "p", label: "Produktivität", einheit: "Tickets/h", soll: prod, tol: 0.01 },
            { id: "w", label: "Wirtschaftlichkeit", soll: wirt, tol: 0.01 },
            { id: "j", label: "Wirtschaftlich?", art: "wahl", optionen: ["ja (Wirtschaftlichkeit > 1)", "nein (Wirtschaftlichkeit < 1)", "genau kostendeckend (= 1)"], soll: wirt > 1 ? 0 : wirt < 1 ? 1 : 2 }],
          weg: ["Arbeitsstunden: " + ma + " × " + f(std) + " × " + tage + " = " + f(stunden), "Produktivität: " + f(tickets, 0) + " ÷ " + f(stunden) + " = " + f(prod) + " Tickets/h",
            "Wirtschaftlichkeit: " + eur(ertrag) + " ÷ " + eur(aufwand) + " = " + f(wirt)],
          ru: "Производительность — количество результата на единицу затрат (в штуках и часах, без денег). Экономичность — доход ÷ расход в деньгах; больше 1 — работают с выгодой.",
          merke: "Produktivität = Menge ÷ Einsatzmenge; Wirtschaftlichkeit = Ertrag ÷ Aufwand."
        };
      } }
  ];

  const S = {
    id: "wiso", titel: "WiSo-Rechner", eyebrow: "WISO", topic: "wiso",
    ru: "Зарплата брутто → нетто, отпуск, сроки увольнения, Betriebsrat и JAV, правовые формы, рентабельность — каждый раз новые числа.",
    kachel: { name: "WiSo-Rechner", unten: "Lohn · Urlaub · Kündigung · BR · Rentabilität", ikon: "rechnen" },
    gruppen: [{ id: "entgelt", titel: "Entgelt", ru: "Зарплата" }, { id: "arbeit", titel: "Urlaub und Kündigung", ru: "Отпуск и увольнение" },
      { id: "mitbest", titel: "Betriebsrat und JAV", ru: "Производственный совет" }, { id: "betrieb", titel: "Rechtsform und Kennzahlen", ru: "Правовая форма и показатели" }],
    aufgaben, FORMEN, MASSNAHMEN, RECHTE,
    rechnen: { grundfrist, monatsfrist, agMonate, kuendigungsende, plusMonate, brGroesse, javGroesse, urlaubRunden, jugendUrlaub, datum, tag }
  };
  root.AP2_WISO_GEN = S;
  if (root.GENUEBGEN) root.GENUEBGEN.sammlung(S);
  if (typeof module === "object" && module.exports) module.exports = S;
})(typeof window !== "undefined" ? window : globalThis);
