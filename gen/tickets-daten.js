/* ============================================================================
   gen/tickets-daten.js — Tickets und Eskalation (Sammlung für gen/uebung-gen.js)
   ----------------------------------------------------------------------------
   Eigene Fälle im Stil der GA1 (IT-Betrieb, Katalog 02.01.08–13):
     • Priorität aus Auswirkung × Dringlichkeit (Matrix steht in der Aufgabe)
     • Art des Tickets: Incident, Service Request, Problem, Change
     • Support-Level und Art der Eskalation (funktional / hierarchisch)
     • SLA-Frist innerhalb der Servicezeit
   Bei jedem Versuch: anderer Fall, andere Namen, Zeiten und Fristen.
   ========================================================================== */
"use strict";
(function (root) {
  const STUFE = ["hoch", "mittel", "niedrig"];
  /* Priorität 1 (kritisch) … 5 (planbar): Zeile Auswirkung, Spalte Dringlichkeit */
  const MATRIX = [[1, 2, 3], [2, 3, 4], [3, 4, 5]];
  const PRIO_TEXT = ["1 – kritisch", "2 – hoch", "3 – mittel", "4 – niedrig", "5 – planbar"];
  const MATRIX_TEXT = "Auswirkung hoch: 1 / 2 / 3 · mittel: 2 / 3 / 4 · niedrig: 3 / 4 / 5 (jeweils Dringlichkeit hoch / mittel / niedrig)";
  const NAMEN = ["Frau Kaya", "Herr Brandt", "Frau Novak", "Herr Okafor", "Frau Lehmann", "Herr Schulz", "Frau Petrović", "Herr Yilmaz"];

  /* Fälle: a = Auswirkung, d = Dringlichkeit (0 hoch … 2 niedrig), art, level (1–3), warum */
  const FAELLE = [
    { t: "Der Online-Shop ist seit zehn Minuten für alle Kunden nicht erreichbar. Es gehen keine Bestellungen ein.", a: 0, d: 0, art: 0, level: 2,
      wa: "alle Kunden und der Umsatz sind betroffen", wd: "das Geschäft steht sofort still" },
    { t: "{name} aus der Buchhaltung kann sich nicht am ERP-System anmelden. Die Kolleginnen können normal arbeiten. Der Monatsabschluss muss heute bis 16 Uhr fertig sein.", a: 2, d: 0, art: 0, level: 1,
      wa: "nur eine Person ist betroffen", wd: "die Frist ist heute" },
    { t: "Im Vertrieb (15 Personen) ist das CRM seit dem Update sehr langsam. Man kann damit arbeiten, aber jede Suche dauert eine Minute.", a: 1, d: 1, art: 0, level: 2,
      wa: "eine ganze Abteilung ist betroffen", wd: "Arbeit ist möglich, aber eingeschränkt" },
    { t: "Der Farbdrucker im 2. Stock druckt nur noch Streifen. Im selben Flur steht ein zweiter Drucker, den alle nutzen können.", a: 1, d: 2, art: 0, level: 1,
      wa: "eine Etage nutzt den Drucker", wd: "es gibt eine Ausweichlösung (Workaround)" },
    { t: "{name} möchte für die Präsentation nächste Woche einen zweiten Monitor bekommen.", a: 2, d: 2, art: 1, level: 1,
      wa: "eine Person", wd: "kann warten" },
    { t: "Seit drei Wochen stürzt die Lager-App jeden Montagmorgen ab. Der Service Desk hat jedes Mal den Server neu gestartet. Jetzt soll die Ursache gefunden werden.", a: 1, d: 2, art: 2, level: 3,
      wa: "das Lagerteam ist betroffen", wd: "der Neustart hilft vorerst" },
    { t: "Die Personalabteilung möchte, dass die Software für die Zeiterfassung eine neue Schnittstelle zum Lohnprogramm bekommt. Das soll im nächsten Quartal umgesetzt werden.", a: 1, d: 2, art: 3, level: 3,
      wa: "eine Abteilung", wd: "geplant für das nächste Quartal" },
    { t: "Das gesamte Firmennetz ist ausgefallen. Niemand kann auf E-Mails, Dateien oder Telefonie zugreifen.", a: 0, d: 0, art: 0, level: 2,
      wa: "das ganze Unternehmen", wd: "niemand kann arbeiten" },
    { t: "{name} hat das Passwort vergessen und kann sich morgens nicht am PC anmelden.", a: 2, d: 0, art: 1, level: 1,
      wa: "eine Person", wd: "die Person kann gar nicht arbeiten" },
    { t: "Die Rechtschreibprüfung im Textprogramm funktioniert bei allen 200 Mitarbeitenden nicht mehr. Sonst läuft alles normal.", a: 0, d: 2, art: 0, level: 2,
      wa: "alle Mitarbeitenden", wd: "die Arbeit geht ohne Rechtschreibprüfung weiter" },
    { t: "Ein neuer Auszubildender beginnt am Montag. Er braucht ein Benutzerkonto, einen Laptop und Zugriff auf das Ticketsystem.", a: 2, d: 1, art: 1, level: 1,
      wa: "eine Person", wd: "Termin steht fest, aber noch Zeit" },
    { t: "Die Webanwendung für Kundenportale zeigt bei Umlauten im Namen eine Fehlermeldung. Der Fehler liegt im Programmcode. Kunden mit Umlauten (etwa jeder zehnte) können sich nicht registrieren.", a: 1, d: 0, art: 0, level: 3,
      wa: "ein Teil der Kunden", wd: "diese Kunden können sich gar nicht registrieren" }
  ];
  const ART = ["Incident (Störung)", "Service Request (Serviceanfrage)", "Problem (Ursache wiederkehrender Störungen)", "Change (geplante Änderung)"];
  const ART_RU = ["сбой, работа нарушена — быстро восстановить", "обычный запрос: доступ, оборудование, пароль", "поиск причины повторяющихся сбоев", "плановое изменение системы"];
  const LEVEL = ["1st Level (Service Desk)", "2nd Level (Fachspezialisten)", "3rd Level (Entwicklung / Hersteller)"];
  const text = (f, R) => f.t.replace("{name}", R.pick(NAMEN));

  const aufgaben = [
    { id: "prio", gruppe: "tickets", titel: "Priorität bestimmen", ru: "Определить приоритет",
      gen: R => {
        const f = R.pick(FAELLE.filter(x => x.art !== 3)), prio = MATRIX[f.a][f.d];
        return {
          situation: "Beim Service Desk geht folgende Meldung ein: " + text(f, R),
          gegeben: [["Prioritätsmatrix", MATRIX_TEXT]],
          frage: "Bestimmen Sie Auswirkung, Dringlichkeit und Priorität des Tickets.",
          felder: [{ id: "a", label: "Auswirkung (Impact)", art: "wahl", optionen: STUFE, soll: f.a },
            { id: "d", label: "Dringlichkeit (Urgency)", art: "wahl", optionen: STUFE, soll: f.d },
            { id: "p", label: "Priorität", art: "wahl", optionen: PRIO_TEXT, soll: prio - 1 }],
          weg: ["Auswirkung " + STUFE[f.a] + ": " + f.wa + ".", "Dringlichkeit " + STUFE[f.d] + ": " + f.wd + ".", "Matrix: " + STUFE[f.a] + " × " + STUFE[f.d] + " → Priorität " + PRIO_TEXT[prio - 1] + "."],
          ru: "Влияние — сколько людей/процессов затронуто. Срочность — как быстро вред растёт (можно ли работать, есть ли обходной путь, есть ли срок). Приоритет берём из матрицы.",
          merke: "Priorität = Auswirkung × Dringlichkeit."
        };
      } },
    { id: "art", gruppe: "tickets", titel: "Art des Tickets", ru: "Тип обращения",
      gen: R => {
        const f = R.pick(FAELLE);
        return {
          situation: text(f, R),
          frage: "Um welche Art von Ticket handelt es sich?",
          felder: [{ id: "art", label: "Ticketart", art: "wahl", optionen: ART, soll: f.art }],
          weg: [ART[f.art] + ".", "Incident = Störung, schnell wieder arbeiten. Service Request = Standardanfrage. Problem = Ursache wiederkehrender Störungen. Change = geplante Änderung."],
          ru: ART_RU[f.art] + "."
        };
      } },
    { id: "level", gruppe: "tickets", titel: "Support-Level", ru: "Уровень поддержки",
      gen: R => {
        const f = R.pick(FAELLE);
        const warum = ["Standardfall mit bekannter Lösung — das erledigt der Service Desk direkt.", "Fachwissen für ein bestimmtes System nötig — Spezialisten im 2nd Level.", "Fehler im Programm oder Änderung an der Software — Entwicklung bzw. Hersteller."][f.level - 1];
        return {
          situation: text(f, R),
          frage: "Welches Support-Level löst diesen Fall voraussichtlich?",
          felder: [{ id: "l", label: "Support-Level", art: "wahl", optionen: LEVEL, soll: f.level - 1 }],
          weg: [LEVEL[f.level - 1] + ": " + warum],
          ru: "1st Level принимает обращение и решает типовые случаи, 2nd Level — специалисты по системам, 3rd Level — разработчики или производитель."
        };
      } },
    { id: "eskalation", gruppe: "tickets", titel: "Funktionale oder hierarchische Eskalation", ru: "Функциональная или иерархическая эскалация",
      gen: R => {
        const name = R.pick(NAMEN);
        const fall = R.pick([
          [name + " im 1st Level kann den Datenbankfehler nicht lösen und gibt das Ticket an die Datenbankadministratoren weiter.", 0],
          ["Die im SLA vereinbarte Lösungszeit läuft in einer Stunde ab. Der Teamleiter wird informiert und stellt zusätzliches Personal bereit.", 1],
          ["Der 2nd Level findet einen Fehler im Programmcode und leitet das Ticket an das Entwicklerteam weiter.", 0],
          ["Ein wichtiger Kunde beschwert sich zum dritten Mal. Die Abteilungsleitung übernimmt die Kommunikation mit dem Kunden.", 1],
          ["Für die Lösung muss Geld für einen Hardwaretausch freigegeben werden. Der Fall geht an die IT-Leitung.", 1],
          ["Der Service Desk erkennt, dass für das Netzwerkproblem ein Netzwerkspezialist nötig ist, und übergibt das Ticket.", 0]
        ]);
        return {
          situation: fall[0],
          frage: "Um welche Art von Eskalation handelt es sich?",
          felder: [{ id: "e", label: "Eskalation", art: "wahl", optionen: ["funktionale Eskalation", "hierarchische Eskalation"], soll: fall[1] }],
          weg: [fall[1] ? "Hierarchisch: eine Führungskraft wird eingeschaltet (Entscheidung, Ressourcen, Frist in Gefahr)." : "Funktional: das Ticket geht an Personen mit mehr Fachwissen."],
          ru: "Функциональная — передаём специалистам с бо́льшими знаниями. Иерархическая — подключаем руководство (сроки SLA, деньги, недовольный клиент)."
        };
      } },
    { id: "sla", gruppe: "tickets", titel: "SLA-Frist berechnen", ru: "Рассчитать срок по SLA",
      gen: R => {
        const beginn = 8, ende = R.pick([16, 17, 18]), std = R.pick([2, 4, 6, 8]);
        const tagNamen = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
        const tag = R.int(0, 4), stunde = R.int(beginn, ende - 1), minute = R.pick([0, 15, 30, 45]);
        /* Frist innerhalb der Servicezeit (Mo–Fr) */
        let rest = std * 60, t = tag, m = stunde * 60 + minute;
        while (rest > 0) {
          const bisEnde = ende * 60 - m;
          if (rest <= bisEnde) { m += rest; rest = 0; }
          else { rest -= bisEnde; t++; m = beginn * 60; }
        }
        const woche = t > 4 ? " (nächste Woche)" : "";
        const tagText = tagNamen[t % 5] + woche;
        const uhr = mm => String(Math.floor(mm / 60)).padStart(2, "0") + ":" + String(mm % 60).padStart(2, "0");
        const loesung = tagText + ", " + uhr(m) + " Uhr";
        /* Ablenker: ohne Servicezeit gerechnet, Ende statt Beginn, eine Stunde daneben */
        const ohne = (() => { let mm = stunde * 60 + minute + std * 60, tt = tag; while (mm >= 24 * 60) { mm -= 24 * 60; tt++; } return tagNamen[tt % 5] + (tt > 4 ? " (nächste Woche)" : "") + ", " + uhr(mm) + " Uhr"; })();
        const daneben = tagText + ", " + uhr(m + 60 > ende * 60 ? m - 60 : m + 60) + " Uhr";
        const anders = (t === tag ? tagNamen[(t + 1) % 5] + ((t + 1) > 4 ? " (nächste Woche)" : "") : tagNamen[tag]) + ", " + uhr(m) + " Uhr";
        const opt = Array.from(new Set([loesung, ohne, daneben, anders]));
        const gemischt = R.mischen(opt);
        return {
          situation: "Laut SLA muss eine Störung der Priorität 2 innerhalb von " + std + " Stunden gelöst sein. Es zählt nur die Servicezeit.",
          gegeben: [["Servicezeit", "Montag bis Freitag, " + beginn + ":00–" + ende + ":00 Uhr"], ["Ticket eingegangen", tagNamen[tag] + ", " + uhr(stunde * 60 + minute) + " Uhr"], ["Lösungszeit laut SLA", std + " Stunden"]],
          frage: "Bis wann muss die Störung gelöst sein?",
          felder: [{ id: "f", label: "Frist", art: "wahl", optionen: gemischt, soll: gemischt.indexOf(loesung) }],
          weg: ["Rest des Tages in der Servicezeit: " + uhr(stunde * 60 + minute) + "–" + ende + ":00 = " + String(Math.round((ende * 60 - stunde * 60 - minute) / 6) / 10).replace(".", ",") + " Std.",
            t === tag ? "Die " + std + " Stunden passen noch in denselben Tag." : "Die restliche Zeit läuft am nächsten Servicetag ab " + beginn + ":00 Uhr weiter.",
            "Frist: " + loesung + "."],
          ru: "Время SLA идёт только в часы обслуживания: вечер, ночь и выходные не считаются. Остаток переносится на следующий рабочий день с начала смены."
        };
      } }
  ];

  const S = {
    id: "tickets", titel: "Tickets und Eskalation", eyebrow: "IT-Betrieb", topic: "betrieb",
    ru: "Каждый раз новый случай: приоритет по матрице «влияние × срочность», тип обращения, уровень поддержки, вид эскалации, срок по SLA.",
    kachel: { name: "Tickets & Eskalation", unten: "Priorität · Ticketart · Support-Level · SLA", ikon: "check" },
    gruppen: [{ id: "tickets", titel: "Service Desk", ru: "Обращения в службу поддержки" }],
    aufgaben, MATRIX, FAELLE
  };
  root.AP2_TICKETS = S;
  if (root.GENUEBGEN) root.GENUEBGEN.sammlung(S);
  if (typeof module === "object" && module.exports) module.exports = S;
})(typeof window !== "undefined" ? window : globalThis);
