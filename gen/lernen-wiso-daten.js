/* ============================================================================
   gen/lernen-wiso-daten.js — Themen WiSo (Wirtschafts- und Sozialkunde)
   ----------------------------------------------------------------------------
   Ergänzt window.AP2_THEMEN (gen/lernen-daten.js) um 10 Themen für den
   dritten schriftlichen Teil der AP2: WiSo, 60 Minuten, ca. 30 gebundene
   Aufgaben. Grundlage ist der Prüfungskatalog AP2 FIAE (ZPA, 2. Auflage
   2024), Teil 03, Seiten 26–33:

     wiso-ausbildung     03.01.01–04  Ausbildung, BBiG, duales System
     wiso-arbeitsrecht   03.01.05     Arbeitsvertrag, Kündigung, Schutzgesetze
     wiso-sozialpartner  03.01.06–08, 03.02.07, 03.02.09  Betriebsrat, JAV, Tarif
     wiso-entgelt        03.01.09, 03.01.05  Brutto/Netto, Steuern, Sozialvers.
     wiso-weiterbildung  03.01.10–14  Fortbildung, Umschulung, Lern-/Arbeitstechnik
     wiso-rechtsformen   03.02.01–02  Betrieb, Sektoren, Rechtsformen
     wiso-unternehmen    03.02.03–06, 03.02.08  Organisation, Ziele, Kennzahlen
     wiso-arbeitsschutz  03.03.01–07  Arbeitsschutz, Unfall, Brandschutz
     wiso-umwelt         03.04.01–07  Umweltschutz, Abfall, Nachhaltigkeit
     wiso-digital        03.03.08, 03.05.01–03  IT-Sicherheit, DSGVO, Vielfalt

   Nummern: 03 = WiSo, dann Fragenkomplex und Themenkreis (wie in
   gen/lernen-katalog-daten.js „AP2 02.01.01–07“).

   Lädt NACH gen/lernen-daten.js (und ggf. gen/lernen-katalog-daten.js) und
   VOR gen/lernen.js. Die WiSo-Themen kommen als eigener Block ans Ende der
   Liste; doppeltes Laden ersetzt die Themen, statt sie zu verdoppeln.

   Global: window.AP2_THEMEN_WISO = IDs der WiSo-Themen, z. B. für ein reines
   WiSo-Quiz: GENLERNEN.quizStarten(GENLERNEN.runde({ themen: AP2_THEMEN_WISO,
   anzahl: 10 }), "WiSo-Quiz").

   Format wie gen/lernen-daten.js, teil: "WiSo". Abweichungen:
     quiz.w   — Erklärung auf Russisch
     quellen  — [[url, text]] geprüfte Rechtsquellen (Stand Oktober 2026);
                lernen.js zeigt sie noch nicht an (links = ap2.online).
   Werte, die sich jährlich ändern (Beitragssätze, Grenzen, Mindestbeträge),
   stehen nur mit „Stand 2026“ — in der Prüfung stehen sie in der Aufgabe.
   Die Texte sind eigene, nicht aus Katalog, Prüfungen oder Webseiten kopiert.
   ========================================================================== */
"use strict";

(function (root) {
  const T = [];
  const GII = "https://www.gesetze-im-internet.de/";

  /* ============================================================ 1 Ausbildung */
  T.push({
    id: "wiso-ausbildung", titel: "Berufsausbildung im dualen System", ru: "Профессиональное обучение в дуальной системе", teil: "WiSo",
    katalog: "AP2 03.01.01–04 (S. 26): Ausbildungsvertrag nach BBiG, Rechte und Pflichten, duales System, Betrieb, Berufsschule, Kammer, Ausbildungsrahmenplan",
    links: [],
    quellen: [[GII + "bbig_2005/", "Berufsbildungsgesetz (BBiG), v. a. §§ 10–24, 37, 40"],
              ["https://www.bibb.de/de/pressemitteilung_229684.php", "BIBB: Mindestausbildungsvergütung 2026 und 2027"]],
    kurzRu: "Дуальная система означает учёбу в двух местах: на предприятии (практика) и в профессиональной школе (теория); правила обучения на предприятии задаёт закон BBiG, а следит за ними палата (для IT — IHK). Обучение начинается с испытательного срока от 1 до 4 месяцев, в это время обе стороны могут расторгнуть договор в любой день без срока уведомления. Позже предприятие может расторгнуть договор только по важной причине, ученик — ещё и с уведомлением за 4 недели при отказе от обучения или смене профессии, и всегда письменно с подписью.",
    punkte: [
      ["Duales System", "дуальная система", "Man lernt an zwei Lernorten: im Betrieb (Praxis) und in der Berufsschule (Theorie). Beide arbeiten zusammen (Lernortkooperation). Teile der Ausbildung sind auch überbetrieblich möglich. Bis zu einem Viertel der Ausbildungszeit kann man im Ausland lernen."],
      ["Berufsbildungsgesetz (BBiG)", "закон о профессиональном образовании", "Das BBiG regelt die Ausbildung im Betrieb: Vertrag, Pflichten, Vergütung, Probezeit, Kündigung und Prüfung. Die Berufsschule regeln die Bundesländer in ihren Schulgesetzen (Berufsschulpflicht)."],
      ["Ausbildungsordnung und Pläne", "положение об обучении и учебные планы", "Die Ausbildungsordnung gilt bundesweit für einen Beruf: Name, Dauer, Inhalte, Ausbildungsrahmenplan und Prüfung. Daraus macht der Betrieb seinen betrieblichen Ausbildungsplan: was, wann, in welcher Abteilung. Für die Berufsschule gilt der Rahmenlehrplan der Kultusministerkonferenz (KMK)."],
      ["Ausbildungsvertrag", "договор об обучении", "Ausbildender (Betrieb) und Auszubildender schließen ihn vor dem Beginn. Bei Minderjährigen unterschreiben die Eltern mit. Der Betrieb hält den wesentlichen Inhalt in Textform fest (§ 11 BBiG), z. B. Beginn und Dauer, Probezeit, tägliche Ausbildungszeit, Vergütung, Urlaub und Kündigungsbedingungen."],
      ["Verbotene Vereinbarungen", "недопустимые условия договора", "Nichtig sind (§ 12 BBiG): Geld für die Ausbildung verlangen, Vertragsstrafen, pauschaler Schadensersatz und ein Verbot, nach der Ausbildung woanders zu arbeiten. Erlaubt ist: In den letzten 6 Monaten sagt der Azubi zu, danach im Betrieb zu bleiben."],
      ["Probezeit", "испытательный срок", "Die Ausbildung beginnt mit der Probezeit. Sie dauert mindestens 1 Monat und höchstens 4 Monate (§ 20 BBiG). In der Probezeit können beide Seiten jederzeit ohne Frist kündigen — aber schriftlich."],
      ["Kündigung nach der Probezeit", "расторжение после испытательного срока", "Der Betrieb kann nur aus wichtigem Grund fristlos kündigen, z. B. bei Diebstahl. Der Azubi kann zusätzlich mit 4 Wochen Frist kündigen, wenn er die Ausbildung aufgibt oder einen anderen Beruf lernen will. Immer schriftlich mit Unterschrift und mit den Gründen. Eine E-Mail reicht nicht (§ 22 BBiG)."],
      ["Pflichten des Auszubildenden", "обязанности ученика", "Lernen und Aufgaben sorgfältig erledigen. Zur Berufsschule und zu Prüfungen gehen. Weisungen folgen und die Betriebsordnung beachten. Geräte pfleglich behandeln. Betriebsgeheimnisse für sich behalten. Den Ausbildungsnachweis (Berichtsheft) führen (§ 13 BBiG)."],
      ["Pflichten des Ausbildenden", "обязанности обучающего предприятия", "Planmäßig ausbilden und einen geeigneten Ausbilder stellen. Ausbildungsmittel wie Bücher und Software kostenlos geben. Für die Berufsschule freistellen. Nur Aufgaben geben, die der Ausbildung dienen. Vergütung zahlen und am Ende ein Zeugnis ausstellen (§§ 14–16 BBiG)."],
      ["Vergütung", "вознаграждение ученика", "Sie muss angemessen sein und jedes Jahr steigen (§ 17 BBiG). Es gibt eine Mindestvergütung. Stand 2026: 724 € im 1. Jahr für Ausbildungen, die 2026 beginnen; der Betrag ändert sich jedes Jahr. Sie wird spätestens am letzten Arbeitstag des Monats gezahlt. Überstunden werden extra bezahlt oder mit Freizeit ausgeglichen."],
      ["Berufsschule und Freistellung", "освобождение для профшколы", "Beginnt der Unterricht vor 9 Uhr, darf der Betrieb den Azubi vorher nicht beschäftigen. Ein langer Schultag mit mehr als 5 Stunden à 45 Minuten zählt einmal pro Woche als ganzer Arbeitstag. Frei ist auch der Arbeitstag direkt vor der schriftlichen Abschlussprüfung (§ 15 BBiG)."],
      ["Zuständige Stelle (IHK)", "палата (IHK)", "Die Kammer trägt den Vertrag in das Verzeichnis der Ausbildungsverhältnisse ein. Sie berät und überwacht die Ausbildung (Ausbildungsberater). Sie kürzt oder verlängert auf Antrag die Ausbildungszeit und führt die Prüfungen durch. Für IT-Berufe ist das die IHK."],
      ["Abschlussprüfung", "выпускной экзамен", "Bei den IT-Berufen ist sie gestreckt: Teil 1 und Teil 2. Der Prüfungsausschuss hat mindestens 3 Mitglieder: Vertreter der Arbeitgeber und der Arbeitnehmer in gleicher Zahl und mindestens eine Lehrkraft. Wer nicht besteht, darf zweimal wiederholen. Teil 1 allein kann man nicht wiederholen."],
      ["Ende der Ausbildung", "окончание обучения", "Sie endet mit dem Ablauf der Ausbildungszeit. Wer vorher besteht, ist mit der Bekanntgabe des Ergebnisses fertig. Wer nicht besteht, kann eine Verlängerung bis zur nächsten Prüfung verlangen, höchstens 1 Jahr. Arbeitet man danach einfach weiter, entsteht ein unbefristetes Arbeitsverhältnis (§ 24 BBiG)."]
    ],
    tabelle: { titel: "Kündigung des Ausbildungsverhältnisses",
      kopf: ["Zeitpunkt", "Wer?", "Frist", "Grund"],
      zeilen: [
        ["Probezeit (1–4 Monate)", "beide Seiten", "keine Frist", "kein Grund nötig"],
        ["nach der Probezeit", "Betrieb oder Azubi", "fristlos, spätestens 2 Wochen nach Kenntnis des Grundes", "wichtiger Grund (z. B. Diebstahl)"],
        ["nach der Probezeit", "nur der Azubi", "4 Wochen", "Ausbildung aufgeben oder anderen Beruf lernen"],
        ["jederzeit", "beide gemeinsam", "nach Vereinbarung", "Aufhebungsvertrag (Einigung)"]
      ] },
    merke: "Probezeit 1–4 Monate: jederzeit ohne Frist kündbar. Danach kündigt der Betrieb nur aus wichtigem Grund, der Azubi auch mit 4 Wochen Frist bei Abbruch oder Berufswechsel. Kündigung immer schriftlich. Wer vorher besteht, ist mit der Bekanntgabe des Ergebnisses fertig.",
    quiz: [
      { id: "wiso-au1", f: "Lea beginnt am 1. August eine Ausbildung zur Fachinformatikerin. Im Ausbildungsvertrag steht eine Probezeit von 6 Monaten. Welche Aussage trifft zu?",
        o: ["6 Monate sind erlaubt, weil im Arbeitsrecht bis zu 6 Monate Probezeit gelten.", "Die Probezeit ist zu lang: Erlaubt sind mindestens 1 und höchstens 4 Monate.", "In einer Ausbildung gibt es keine Probezeit.", "Die Probezeit muss genau 3 Monate dauern."], r: [1],
        w: "§ 20 BBiG: испытательный срок в обучении — минимум 1, максимум 4 месяца. 6 месяцев — предел для обычного трудового договора (§ 622 Abs. 3 BGB), а не для Ausbildung." },
      { id: "wiso-au2", f: "Tim ist seit 6 Monaten Auszubildender. Er möchte die Ausbildung aufgeben und studieren. Wie kann er das Ausbildungsverhältnis kündigen?",
        o: ["Per E-Mail mit einer Frist von 2 Wochen", "Mündlich und sofort, weil er die Ausbildung aufgibt", "Schriftlich mit einer Frist von 4 Wochen und mit Angabe des Grundes", "Gar nicht — nach der Probezeit kann nur der Betrieb kündigen"], r: [2],
        w: "§ 22 Abs. 2 Nr. 2 и Abs. 3 BBiG: после испытательного срока ученик может уйти с уведомлением за 4 недели, если бросает обучение или переходит на другую профессию. Только письменно (бумага с подписью) и с указанием причины; e-mail недостаточно." },
      { id: "wiso-au3", f: "Welche Vereinbarung in einem Ausbildungsvertrag ist nichtig?",
        o: ["Die Probezeit beträgt 3 Monate.", "Die Ausbildungsvergütung steigt jedes Jahr.", "Der Azubi führt seinen Ausbildungsnachweis elektronisch.", "Der Azubi zahlt 2.000 €, wenn er die Ausbildung abbricht."], r: [3],
        w: "§ 12 BBiG: договорный штраф (Vertragsstrafe) и плата за обучение запрещены — такое условие ничтожно. Остальное законно: испытательный срок 3 месяца (допустимо 1–4), ежегодный рост вознаграждения, электронный отчёт об обучении." },
      { id: "wiso-au4", f: "Welche Pflichten hat der Ausbildende (Betrieb) nach dem BBiG? Kreuzen Sie alle richtigen an.",
        o: ["Ausbildungsmittel wie Fachbücher und Software kostenlos zur Verfügung stellen", "Den Azubi für den Berufsschulunterricht freistellen", "Den Azubi nach der Ausbildung unbefristet übernehmen", "Dem Azubi nur Aufgaben geben, die dem Ausbildungszweck dienen"], r: [0, 1, 3],
        w: "§ 14 BBiG: средства обучения бесплатно, только задания, которые служат цели обучения; § 15: освобождение для профшколы. Обязанности взять ученика на работу после обучения закон не содержит." },
      { id: "wiso-au5", f: "Lisa (19 Jahre) hat am Dienstag Berufsschule von 8:00 bis 13:15 Uhr: 6 Unterrichtsstunden à 45 Minuten. Was gilt für diesen Tag?",
        o: ["Sie muss nach der Schule noch 4 Stunden in den Betrieb.", "Sie wird für den ganzen Tag freigestellt; der Tag zählt mit der durchschnittlichen täglichen Ausbildungszeit.", "Die Regel gilt nur für Azubis unter 18 Jahren, Lisa muss nachmittags arbeiten.", "Sie muss die Schulzeit am Samstag nacharbeiten."], r: [1],
        w: "§ 15 BBiG (с 2020 года — для всех учеников, независимо от возраста): один раз в неделю день с более чем 5 уроками по 45 минут засчитывается как полный рабочий день, после школы в фирму не идут." },
      { id: "wiso-au6", f: "Jonas besteht die Abschlussprüfung. Das Ergebnis wird ihm am 20. Juni bekannt gegeben. Sein Ausbildungsvertrag läuft bis zum 31. Juli. Wann endet das Ausbildungsverhältnis?",
        o: ["Am 20. Juni mit der Bekanntgabe des Ergebnisses durch den Prüfungsausschuss", "Am 31. Juli, wie im Vertrag steht", "Erst wenn das Zeugnis per Post ankommt", "Am Ende des Kalenderjahres"], r: [0],
        w: "§ 21 Abs. 2 BBiG: кто сдал экзамен раньше окончания срока договора, заканчивает обучение в день объявления результата экзаменационной комиссией." },
      { id: "wiso-au7", f: "Nach der bestandenen Prüfung arbeitet Jonas am nächsten Montag einfach weiter. Über die Weiterarbeit wurde nichts vereinbart. Welche Aussage trifft zu?",
        o: ["Er arbeitet weiter als Auszubildender.", "Es besteht ein auf 6 Monate befristetes Arbeitsverhältnis.", "Er hat keinen Anspruch auf Lohn, weil kein Vertrag unterschrieben ist.", "Es besteht ein unbefristetes Arbeitsverhältnis."], r: [3],
        w: "§ 24 BBiG: если после обучения продолжают работать без отдельной договорённости, считается заключённым трудовой договор на неопределённый срок." },
      { id: "wiso-au8", f: "Welche Aufgabe hat die IHK als zuständige Stelle in der Berufsausbildung NICHT?",
        o: ["Sie trägt Ausbildungsverträge in das Verzeichnis der Berufsausbildungsverhältnisse ein.", "Sie zahlt die Ausbildungsvergütung an die Auszubildenden.", "Sie berät und überwacht die Ausbildung durch Ausbildungsberater.", "Sie führt die Abschlussprüfungen durch."], r: [1],
        w: "Вознаграждение платит предприятие (Ausbildender), а не палата. IHK регистрирует договоры (§ 34 BBiG), консультирует и контролирует (§ 76) и проводит экзамены." },
      { id: "wiso-au9", f: "Wie ist ein Prüfungsausschuss für die Abschlussprüfung zusammengesetzt?",
        o: ["Nur aus Lehrkräften der Berufsschule", "Nur aus Ausbildern des eigenen Betriebs", "Aus mindestens 3 Mitgliedern: Arbeitgeber- und Arbeitnehmervertreter in gleicher Zahl und mindestens eine Lehrkraft einer berufsbildenden Schule", "Aus einer Beamtin der IHK allein"], r: [2],
        w: "§ 40 BBiG: не менее 3 членов; представителей работодателей и работников поровну плюс минимум один преподаватель профшколы. Работа в комиссии — почётная (ehrenamtlich)." },
      { id: "wiso-au10", f: "Was ist der Unterschied zwischen Ausbildungsrahmenplan und betrieblichem Ausbildungsplan?",
        o: ["Der Rahmenplan gilt bundesweit für den Beruf; der betriebliche Plan setzt ihn für den eigenen Betrieb um.", "Der betriebliche Plan regelt den Unterricht in der Berufsschule.", "Den Rahmenplan schreibt jeder Betrieb selbst.", "Beide Begriffe meinen den Stundenplan der Berufsschule."], r: [0],
        w: "Ausbildungsrahmenplan — часть Ausbildungsordnung, одинаков по всей Германии. Betrieblicher Ausbildungsplan — конкретный план предприятия (что, когда, в каком отделе). Для школы есть свой Rahmenlehrplan KMK." },
      { id: "wiso-au11", f: "Welche Aussage zur Dauer der Ausbildung trifft zu?",
        o: ["Eine Ausbildung in Teilzeit ist verboten.", "Nur der Betrieb allein kann die Ausbildungszeit verkürzen.", "Wer die Prüfung nicht besteht, muss die ganze Ausbildung neu beginnen.", "Auf gemeinsamen Antrag von Azubi und Betrieb kürzt die IHK die Ausbildung, wenn das Ziel trotzdem erreicht wird."], r: [3],
        w: "§ 8 BBiG: сокращение — по совместному заявлению, решает палата. Teilzeit разрешена (§ 7a). Кто не сдал, может продлить обучение до следующей пересдачи, максимум на 1 год (§ 21 Abs. 3)." }
    ]
  });

  /* =========================================================== 2 Arbeitsrecht */
  T.push({
    id: "wiso-arbeitsrecht", titel: "Arbeitsvertrag, Kündigung und Arbeitnehmerschutz", ru: "Трудовой договор, увольнение и защита работников", teil: "WiSo",
    katalog: "AP2 03.01.05 (S. 26): Rechte und Pflichten, Kündigungsschutzgesetz, Arbeitszeit, Urlaub, Jugendarbeitsschutz, Mutterschutz, Elternzeit, Schwerbehinderte",
    links: [],
    quellen: [[GII + "bgb/__622.html", "BGB § 622 Kündigungsfristen, § 623 Schriftform"],
              [GII + "kschg/", "Kündigungsschutzgesetz (KSchG) §§ 1, 4, 15, 23"],
              [GII + "arbzg/", "Arbeitszeitgesetz (ArbZG) §§ 3–5"],
              [GII + "jarbschg/", "Jugendarbeitsschutzgesetz (JArbSchG)"],
              [GII + "burlg/", "Bundesurlaubsgesetz (BUrlG)"],
              [GII + "entgfg/", "Entgeltfortzahlungsgesetz (EntgFG) §§ 3, 5"]],
    kurzRu: "Трудовой договор действует и устно, а вот увольнение — только на бумаге с собственноручной подписью. Срок уведомления — 4 недели к 15-му числу или к концу месяца (в испытательный срок — 2 недели); закон о защите от увольнения действует после 6 месяцев работы в фирме, где обычно больше 10 работников, и иск подают за 3 недели. Отдельные законы защищают беременных, родителей в Elternzeit, людей с тяжёлой инвалидностью и подростков, ограничивают рабочий день 8 часами и дают минимум 24 дня отпуска (Werktage) в год.",
    punkte: [
      ["Arbeitsvertrag", "трудовой договор", "Der Arbeitnehmer arbeitet nach den Weisungen des Arbeitgebers, der Arbeitgeber zahlt dafür Lohn (§ 611a BGB). Der Vertrag gilt auch mündlich. Der Arbeitgeber muss die wichtigsten Bedingungen aber aufschreiben und aushändigen (Nachweisgesetz). In vielen Branchen geht das inzwischen auch in Textform, z. B. per E-Mail."],
      ["Pflichten im Arbeitsverhältnis", "обязанности сторон", "Arbeitnehmer: arbeiten, Weisungen befolgen, Geheimnisse wahren, nicht gegen den Arbeitgeber konkurrieren. Arbeitgeber: Lohn zahlen, für Sicherheit und Gesundheit sorgen (Fürsorgepflicht), Urlaub gewähren, am Ende ein Zeugnis ausstellen."],
      ["Befristung", "срочный трудовой договор", "Ohne sachlichen Grund höchstens 2 Jahre, dabei höchstens 3 Verlängerungen (§ 14 TzBfG). Das geht nur, wenn vorher noch kein Arbeitsverhältnis mit diesem Arbeitgeber bestand; eine frühere Ausbildung im Betrieb zählt dabei nicht. Die Befristung muss schriftlich vereinbart sein."],
      ["Kündigungsfristen", "сроки уведомления об увольнении", "Grundfrist für beide Seiten: 4 Wochen zum 15. oder zum Ende eines Monats (§ 622 BGB). In der Probezeit (höchstens 6 Monate): 2 Wochen. Kündigt der Arbeitgeber, wird die Frist mit der Betriebszugehörigkeit länger. Ab 2 Jahren: 1 Monat, ab 5 Jahren: 2 Monate … ab 20 Jahren: 7 Monate, jeweils zum Monatsende."],
      ["Schriftform", "письменная форма", "Kündigung und Aufhebungsvertrag sind nur schriftlich mit eigenhändiger Unterschrift wirksam. E-Mail, SMS, Fax oder WhatsApp reichen nicht (§ 623 BGB). Entscheidend ist der Tag, an dem die Kündigung beim Empfänger ankommt (Zugang)."],
      ["Fristlose Kündigung", "увольнение без срока уведомления", "Nur aus wichtigem Grund, z. B. Diebstahl, Gewalt oder Betrug (§ 626 BGB). Sie muss innerhalb von 2 Wochen ausgesprochen werden, nachdem der Kündigende den Grund erfahren hat."],
      ["Abmahnung", "предупреждение (выговор)", "Bei Fehlverhalten, z. B. wiederholtem Zuspätkommen, mahnt der Arbeitgeber in der Regel zuerst ab. Er beschreibt das Fehlverhalten genau und droht für den Wiederholungsfall die Kündigung an. Erst danach folgt eine verhaltensbedingte Kündigung."],
      ["Kündigungsschutzgesetz (KSchG)", "закон о защите от увольнения", "Es gilt, wenn das Arbeitsverhältnis länger als 6 Monate besteht und der Betrieb in der Regel mehr als 10 Arbeitnehmer hat (Azubis zählen nicht). Dann braucht die Kündigung einen Grund: in der Person, im Verhalten oder dringende betriebliche Gründe. Die Klage beim Arbeitsgericht muss man innerhalb von 3 Wochen erheben."],
      ["Anhörung des Betriebsrats", "заслушивание производственного совета", "Gibt es einen Betriebsrat, muss der Arbeitgeber ihn vor jeder Kündigung anhören und die Gründe nennen. Ohne Anhörung ist die Kündigung unwirksam (§ 102 BetrVG)."],
      ["Besonderer Kündigungsschutz", "особая защита от увольнения", "Fast nicht kündbar sind: Schwangere und Mütter bis 4 Monate nach der Geburt (MuSchG), Eltern in Elternzeit (BEEG) und Mitglieder von Betriebsrat und JAV (KSchG). Schwerbehinderten Menschen darf der Arbeitgeber nur mit vorheriger Zustimmung des Integrationsamts kündigen (SGB IX)."],
      ["Arbeitszeit (ArbZG)", "рабочее время", "Höchstens 8 Stunden pro Werktag. Bis 10 Stunden sind erlaubt, wenn der Durchschnitt in 6 Monaten 8 Stunden bleibt. Pause: 30 Minuten bei mehr als 6 Stunden, 45 Minuten bei mehr als 9 Stunden. Ruhezeit zwischen zwei Arbeitstagen: 11 Stunden. Sonntags ist grundsätzlich frei. Stand 10/2026: Eine Reform mit Wochenhöchstarbeitszeit ist geplant, aber nicht beschlossen."],
      ["Urlaub und Krankheit", "отпуск и болезнь", "Mindesturlaub: 24 Werktage bei 6-Tage-Woche, also 20 Arbeitstage bei 5-Tage-Woche (BUrlG). Den vollen Anspruch gibt es nach 6 Monaten. Bei Krankheit: den Arbeitgeber sofort informieren. Dauert sie länger als 3 Kalendertage, braucht man eine ärztliche Bescheinigung (bei gesetzlich Versicherten elektronisch, eAU). Der Arbeitgeber zahlt den Lohn bis zu 6 Wochen weiter, wenn das Arbeitsverhältnis schon 4 Wochen besteht."],
      ["Jugendarbeitsschutz (JArbSchG)", "охрана труда подростков", "Für Jugendliche unter 18: höchstens 8 Stunden am Tag und 40 Stunden pro Woche, 5-Tage-Woche, Arbeit nur von 6 bis 20 Uhr. Pausen: 30 Minuten bei 4,5 bis 6 Stunden, 60 Minuten bei mehr als 6 Stunden. Mindestens 12 Stunden Freizeit zwischen zwei Arbeitstagen. Urlaub: 25 bis 30 Werktage je nach Alter. Vor dem Start: ärztliche Erstuntersuchung."],
      ["Arbeitszeugnis", "трудовая характеристика", "Jeder Arbeitnehmer hat am Ende Anspruch auf ein schriftliches Zeugnis (§ 109 GewO). Einfaches Zeugnis: Art und Dauer der Tätigkeit. Qualifiziertes Zeugnis (auf Wunsch): auch Leistung und Verhalten. Es muss klar formuliert sein und darf keine versteckten Codes enthalten."]
    ],
    tabelle: { titel: "Schutzgesetze im Überblick",
      kopf: ["Gesetz", "Das Wichtigste", "Wen schützt es?"],
      zeilen: [
        ["ArbZG", "8 Std./Werktag (bis 10 mit Ausgleich), Pausen 30/45 Min., 11 Std. Ruhezeit", "Arbeitnehmer ab 18"],
        ["JArbSchG", "8 Std./Tag, 40 Std./Woche, 5-Tage-Woche, 6–20 Uhr, Pausen 30/60 Min., 12 Std. Freizeit", "Jugendliche unter 18"],
        ["BUrlG", "mind. 24 Werktage = 20 Arbeitstage bei 5-Tage-Woche", "alle Arbeitnehmer"],
        ["MuSchG", "Schutzfrist 6 Wochen vor und 8 Wochen nach der Geburt; Kündigungsverbot", "Schwangere und Mütter"],
        ["BEEG", "Elternzeit bis 3 Jahre je Kind; 7 Wochen vorher verlangen; Kündigungsschutz", "Mütter und Väter"],
        ["SGB IX", "Kündigung nur mit Zustimmung des Integrationsamts; 5 Tage Zusatzurlaub", "schwerbehinderte Menschen"],
        ["KSchG", "Kündigung braucht einen Grund; Klage innerhalb von 3 Wochen", "mehr als 6 Monate im Betrieb mit mehr als 10 Arbeitnehmern"],
        ["EntgFG", "Lohn bei Krankheit bis 6 Wochen; Bescheinigung, wenn länger als 3 Kalendertage", "alle Arbeitnehmer"]
      ] },
    code: [
      { titel: "Kündigungsfrist berechnen (Grundfrist)", text:
`Grundfrist: 4 Wochen
zum 15. oder zum Monatsende

Zugang am 10. März
+ 4 Wochen   → 7. April
nächster Termin → 15. April

Zugang am 3. März
+ 4 Wochen   → 31. März
= Monatsende → Ende am 31. März

Spätester Zugang für den 31. Mai:
31. Mai − 28 Tage = 3. Mai` }
    ],
    merke: "4 Wochen zum 15. oder Monatsende, in der Probezeit 2 Wochen. Kündigung nur auf Papier mit Unterschrift. KSchG: mehr als 6 Monate und mehr als 10 Arbeitnehmer — Klage in 3 Wochen. 8 Stunden am Tag, 30/45 Minuten Pause, 11 Stunden Ruhe, 24 Werktage Urlaub.",
    quiz: [
      { id: "wiso-ar1", f: "Frau Kaya arbeitet seit 3 Jahren bei der Lindenwerk IT GmbH. Der Arbeitgeber kündigt ordentlich. Es gilt kein Tarifvertrag. Welche Kündigungsfrist gilt nach dem BGB?",
        o: ["4 Wochen zum 15. oder zum Monatsende", "1 Monat zum Ende eines Kalendermonats", "2 Wochen", "3 Monate zum Quartalsende"], r: [1],
        w: "§ 622 Abs. 2 BGB: если увольняет работодатель, срок растёт со стажем: от 2 лет — 1 месяц к концу месяца, от 5 лет — 2 месяца. 3 года стажа → 1 месяц." },
      { id: "wiso-ar2", f: "Ein Arbeitnehmer will zum 31. Mai kündigen. Es gilt die Grundfrist von 4 Wochen zum 15. oder zum Monatsende. Wann muss die Kündigung spätestens beim Arbeitgeber ankommen?",
        o: ["Am 30. April", "Am 1. Mai", "Am 3. Mai", "Am 17. Mai"], r: [2],
        w: "31 мая минус 4 недели (28 дней) = 3 мая. Важен день получения письма работодателем (Zugang), а не дата отправки." },
      { id: "wiso-ar3", f: "Ein Arbeitnehmer kündigt per E-Mail. Im Anhang ist ein Scan mit seiner Unterschrift. Welche Aussage trifft zu?",
        o: ["Die Kündigung ist wirksam, weil eine Unterschrift zu sehen ist.", "Die Kündigung ist wirksam, sobald der Arbeitgeber die E-Mail liest.", "Eine Kündigung ist an keine Form gebunden.", "Die Kündigung ist unwirksam, weil sie die Schriftform mit eigenhändiger Unterschrift braucht."], r: [3],
        w: "§ 623 BGB: увольнение — только письменно, на бумаге с собственноручной подписью; электронная форма прямо исключена. Скан подписи в e-mail не помогает." },
      { id: "wiso-ar4", f: "In welchem Fall gilt das Kündigungsschutzgesetz für Herrn Berg? Herr Berg arbeitet …",
        o: ["seit 8 Monaten in einem Betrieb mit 25 Arbeitnehmern.", "seit 4 Monaten in einem Betrieb mit 200 Arbeitnehmern.", "seit 3 Jahren in einem Betrieb mit 6 Arbeitnehmern.", "seit 2 Monaten, noch in der Probezeit, in einem Betrieb mit 50 Arbeitnehmern."], r: [0],
        w: "KSchG действует, если трудовые отношения длятся больше 6 месяцев (§ 1) и в фирме обычно больше 10 работников (§ 23). 4 и 2 месяца — слишком мало, 6 работников — слишком маленькая фирма." },
      { id: "wiso-ar5", f: "Welche Gründe können eine ordentliche Kündigung nach dem Kündigungsschutzgesetz rechtfertigen? Kreuzen Sie alle richtigen an.",
        o: ["Gründe in der Person, z. B. lange Krankheit ohne Aussicht auf Besserung", "Gründe im Verhalten, z. B. wiederholtes Zuspätkommen trotz Abmahnung", "Dringende betriebliche Gründe, z. B. die Abteilung wird geschlossen", "Die Mitgliedschaft in einer Gewerkschaft"], r: [0, 1, 2],
        w: "§ 1 Abs. 2 KSchG: причины в личности, в поведении или срочные производственные нужды. Членство в профсоюзе защищено (Art. 9 Abs. 3 GG) — это не основание для увольнения." },
      { id: "wiso-ar6", f: "Eine Arbeitnehmerin erhält eine Kündigung. Sie hält sie für sozial ungerechtfertigt. Bis wann muss sie spätestens Klage beim Arbeitsgericht erheben?",
        o: ["Innerhalb von 2 Wochen nach Zugang der Kündigung", "Innerhalb von 3 Wochen nach Zugang der Kündigung", "Innerhalb von 3 Monaten", "Bis zum Ende der Kündigungsfrist"], r: [1],
        w: "§ 4 KSchG: иск о защите от увольнения — в течение 3 недель после получения письменного уведомления. Если пропустить срок, увольнение считается действительным." },
      { id: "wiso-ar7", f: "Welche Aussage zur Abmahnung trifft zu?",
        o: ["Sie ist dasselbe wie eine fristlose Kündigung.", "Sie ist nur gültig, wenn der Betriebsrat zustimmt.", "Sie beschreibt ein konkretes Fehlverhalten und droht für den Wiederholungsfall Folgen bis zur Kündigung an.", "Nach einer Abmahnung darf der Arbeitgeber nie mehr kündigen."], r: [2],
        w: "Abmahnung: конкретно описать нарушение, потребовать его прекратить и предупредить о последствиях вплоть до увольнения. Обычно нужна перед увольнением за поведение. Согласие Betriebsrat не требуется." },
      { id: "wiso-ar8", f: "Ein volljähriger Arbeitnehmer arbeitet heute 7 Stunden. Welche Aussage trifft nach dem Arbeitszeitgesetz zu?",
        o: ["Ihm stehen mindestens 30 Minuten Pause zu.", "Er darf ohne Ausgleich täglich 12 Stunden arbeiten.", "Zwischen zwei Arbeitstagen reichen 8 Stunden Ruhezeit.", "Pausen sind erst ab 9 Stunden Arbeit vorgeschrieben."], r: [0],
        w: "§ 4 ArbZG: больше 6 и до 9 часов — пауза минимум 30 минут, больше 9 часов — 45 минут. § 3: максимум 8 часов (до 10 — с компенсацией). § 5: отдых между рабочими днями — 11 часов." },
      { id: "wiso-ar9", f: "Die 17-jährige Auszubildende Nele arbeitet an einem Tag 7 Stunden. Was gilt nach dem Jugendarbeitsschutzgesetz?",
        o: ["30 Minuten Pause reichen.", "Sie darf bis 22 Uhr im Büro arbeiten.", "Sie darf an 6 Tagen pro Woche beschäftigt werden.", "Sie bekommt mindestens 60 Minuten Pause."], r: [3],
        w: "§ 11 JArbSchG: больше 6 часов работы — минимум 60 минут перерыва (30 минут — при 4,5–6 часах). Подростки работают только с 6 до 20 часов (§ 14) и 5 дней в неделю (§ 15)." },
      { id: "wiso-ar10", f: "Ein Arbeitnehmer arbeitet an 5 Tagen pro Woche. Wie hoch ist sein gesetzlicher Mindesturlaub?",
        o: ["20 Arbeitstage (das entspricht 24 Werktagen bei einer 6-Tage-Woche)", "24 Arbeitstage", "30 Arbeitstage", "15 Arbeitstage"], r: [0],
        w: "§ 3 BUrlG: 24 Werktage (Werktage — с понедельника по субботу). При пятидневке: 24 : 6 × 5 = 20 рабочих дней. Больше может дать тарифный или трудовой договор." },
      { id: "wiso-ar11", f: "Wer hat einen besonderen Kündigungsschutz? Kreuzen Sie alle richtigen an.",
        o: ["Eine schwangere Arbeitnehmerin, deren Schwangerschaft der Arbeitgeber kennt", "Ein Vater in Elternzeit", "Ein Mitglied des Betriebsrats", "Ein Arbeitnehmer, der gerade einen Urlaubsantrag gestellt hat"], r: [0, 1, 2],
        w: "MuSchG § 17 (беременность и 4 месяца после родов), BEEG § 18 (Elternzeit), KSchG § 15 (члены BR и JAV — только увольнение по важной причине с согласия BR). Заявление на отпуск никакой защиты не даёт." },
      { id: "wiso-ar12", f: "Herr Paul ist gesetzlich krankenversichert. Er ist seit Montag krank, wahrscheinlich eine Woche lang. Was muss er tun?",
        o: ["Nichts — er meldet sich erst nach der Rückkehr.", "Er muss erst ab der zweiten Woche zum Arzt.", "Den Arbeitgeber sofort informieren und die Arbeitsunfähigkeit ärztlich feststellen lassen; der Arbeitgeber ruft die Bescheinigung elektronisch ab.", "Er muss Urlaub beantragen, sonst bekommt er keinen Lohn."], r: [2],
        w: "§ 5 EntgFG: сообщить работодателю сразу. Если болезнь дольше 3 календарных дней — нужна справка врача (у застрахованных в государственной кассе она электронная, eAU). Зарплата сохраняется до 6 недель (§ 3)." }
    ]
  });

  /* ========================================================= 3 Sozialpartner */
  T.push({
    id: "wiso-sozialpartner", titel: "Mitbestimmung und Tarifrecht: Betriebsrat, JAV, Tarifvertrag", ru: "Соцпартнёрство: производственный совет, JAV, тарифный договор", teil: "WiSo",
    katalog: "AP2 03.01.06–08 (S. 27), 03.02.07 und 03.02.09 (S. 29): Arbeitgeber- und Arbeitnehmerorganisationen, Betriebsrat, JAV, Betriebsvereinbarung, Tarifrecht, Arbeitskampf",
    links: [],
    quellen: [[GII + "betrvg/", "Betriebsverfassungsgesetz (BetrVG) §§ 1, 7–9, 60–67, 76, 77, 87, 99, 102"],
              [GII + "tvg/", "Tarifvertragsgesetz (TVG) §§ 1–5"],
              [GII + "gg/art_9.html", "Grundgesetz Art. 9 Abs. 3 (Koalitionsfreiheit)"]],
    kurzRu: "Внутри предприятия интересы работников представляет Betriebsrat (его выбирают на 4 года, если в фирме не меньше 5 постоянных работников) и JAV — представительство подростков до 18 лет и учеников (на 2 года). Соглашения совета с работодателем называются Betriebsvereinbarung, а при споре решает согласительная комиссия (Einigungsstelle). Зарплату и условия труда для отрасли согласуют профсоюз и союз работодателей в тарифном договоре; пока он действует, бастовать по его темам нельзя (Friedenspflicht).",
    punkte: [
      ["Sozialpartner", "социальные партнёры", "Gewerkschaften vertreten die Arbeitnehmer (z. B. ver.di, IG Metall; Dachverband DGB). Arbeitgeberverbände vertreten die Arbeitgeber (Dachverband BDA). Sie handeln Tarifverträge aus. Das Recht, solche Vereinigungen zu gründen und ihnen beizutreten, schützt Art. 9 Abs. 3 Grundgesetz (Koalitionsfreiheit)."],
      ["Kammern und Verbände", "палаты и отраслевые союзы", "Die IHK vertritt die gewerbliche Wirtschaft ihrer Region; Gewerbebetriebe sind Pflichtmitglied. Sie ist zuständige Stelle für die Ausbildung. Wirtschaftsverbände wie der Branchenverband Bitkom vertreten Branchen gegenüber der Politik; dort ist die Mitgliedschaft freiwillig. Ehrenamtliche aus Betrieben und Gewerkschaften arbeiten z. B. in Prüfungsausschüssen mit."],
      ["Betriebsrat (BR)", "производственный совет", "Er wird in Betrieben mit mindestens 5 ständigen wahlberechtigten Arbeitnehmern gewählt (3 davon wählbar). Wählen dürfen alle ab 16 Jahren. Gewählt werden kann man ab 18 Jahren und nach 6 Monaten im Betrieb. Amtszeit: 4 Jahre. Die Arbeit ist ein Ehrenamt; die Kosten trägt der Arbeitgeber."],
      ["Größe des Betriebsrats", "размер совета", "Sie hängt von der Zahl der wahlberechtigten Arbeitnehmer ab (§ 9 BetrVG). 5 bis 20: 1 Person. 21 bis 50: 3 Mitglieder. 51 bis 100: 5 Mitglieder. 101 bis 200: 7 Mitglieder."],
      ["Rechte des Betriebsrats", "права совета", "Die Stufen: Information → Beratung → Mitwirkung (z. B. Anhörung vor jeder Kündigung) → Mitbestimmung. Echte Mitbestimmung in sozialen Fragen (§ 87 BetrVG): Beginn und Ende der Arbeitszeit, Pausen, Urlaubsplan, technische Einrichtungen zur Überwachung (z. B. Software, die Leistung messen kann), mobile Arbeit."],
      ["Personelle Maßnahmen", "кадровые решения", "In Unternehmen mit mehr als 20 wahlberechtigten Arbeitnehmern braucht der Arbeitgeber für Einstellung, Versetzung und Eingruppierung die Zustimmung des Betriebsrats (§ 99 BetrVG). Verweigert der Betriebsrat sie, kann das Arbeitsgericht die Zustimmung ersetzen."],
      ["Betriebsvereinbarung", "производственное соглашение", "Ein schriftlicher Vertrag zwischen Arbeitgeber und Betriebsrat, z. B. über Gleitzeit oder Homeoffice. Sie gilt unmittelbar und zwingend für die Arbeitnehmer des Betriebs. Was üblicherweise ein Tarifvertrag regelt, z. B. die Lohnhöhe, darf sie nur regeln, wenn der Tarifvertrag das erlaubt."],
      ["Einigungsstelle", "согласительная комиссия", "Sie schlichtet Streit zwischen Arbeitgeber und Betriebsrat. Beide Seiten schicken gleich viele Beisitzer, dazu kommt ein unparteiischer Vorsitzender. In Fragen der Mitbestimmung ersetzt ihr Spruch die Einigung."],
      ["Betriebsversammlung", "собрание коллектива", "Der Betriebsrat beruft sie einmal im Kalendervierteljahr ein und berichtet über seine Arbeit. Alle Arbeitnehmer des Betriebs dürfen teilnehmen. Der Arbeitgeber wird eingeladen und darf sprechen."],
      ["Jugend- und Auszubildendenvertretung (JAV)", "представительство молодёжи и учеников", "Sie wird gewählt, wenn mindestens 5 Arbeitnehmer unter 18 oder Auszubildende (jedes Alter) im Betrieb sind. Wählbar sind alle unter 25 und alle Azubis. Amtszeit: 2 Jahre. Die JAV handelt über den Betriebsrat: Sie nimmt an seinen Sitzungen teil und stimmt mit, wenn ein Beschluss überwiegend Jugendliche oder Azubis betrifft."],
      ["Vertrauensvolle Zusammenarbeit", "доверительное сотрудничество", "Arbeitgeber und Betriebsrat arbeiten vertrauensvoll zusammen (§ 2 BetrVG) und treffen sich mindestens einmal im Monat. Ein Arbeitskampf zwischen ihnen ist verboten. Im öffentlichen Dienst heißt die Vertretung Personalrat (Personalvertretungsgesetze), statt Betriebsvereinbarung gibt es dort die Dienstvereinbarung."],
      ["Tarifvertrag", "тарифный договор", "Ein schriftlicher Vertrag zwischen Gewerkschaft und Arbeitgeberverband (Flächentarif) oder einem einzelnen Arbeitgeber (Haus- oder Firmentarif). Manteltarifvertrag: Arbeitszeit, Urlaub, Kündigungsfristen — lange Laufzeit. Lohn- und Gehaltstarifvertrag: Höhe der Entgelte — kurze Laufzeit."],
      ["Tarifbindung", "действие тарифного договора", "Der Tarifvertrag gilt unmittelbar und zwingend, wenn Arbeitnehmer und Arbeitgeber tarifgebunden sind (Mitglieder der Tarifparteien). Abweichungen sind nur zugunsten des Arbeitnehmers erlaubt (Günstigkeitsprinzip). Das Bundesarbeitsministerium kann ihn für allgemeinverbindlich erklären — dann gilt er für die ganze Branche."],
      ["Tarifautonomie und Arbeitskampf", "тарифная автономия и трудовой конфликт", "Die Tarifparteien verhandeln ohne den Staat. Während der Laufzeit gilt die Friedenspflicht: kein Streik zu geregelten Themen. Scheitern die Verhandlungen, folgen eventuell Schlichtung, dann Urabstimmung und Streik; der Arbeitgeber kann aussperren. Wer streikt, bekommt keinen Lohn. Gewerkschaftsmitglieder bekommen Streikgeld."]
    ],
    tabelle: { titel: "Betriebsrat und JAV im Vergleich",
      kopf: ["Merkmal", "Betriebsrat", "JAV"],
      zeilen: [
        ["Wann gewählt?", "ab 5 ständigen wahlberechtigten Arbeitnehmern", "ab 5 Arbeitnehmern unter 18 oder Azubis"],
        ["Wer wählt?", "alle Arbeitnehmer ab 16 Jahren", "Arbeitnehmer unter 18 und alle Azubis"],
        ["Wer ist wählbar?", "ab 18 Jahren, 6 Monate im Betrieb", "alle unter 25 und alle Azubis"],
        ["Amtszeit", "4 Jahre (Wahl 1. März – 31. Mai)", "2 Jahre (Wahl 1. Oktober – 30. November)"],
        ["Rechte", "Information, Beratung, Mitwirkung, Mitbestimmung", "über den Betriebsrat: Teilnahme an Sitzungen, Stimmrecht bei Jugendthemen"]
      ] },
    code: [
      { titel: "Ablauf eines Arbeitskampfes", text:
`Tarifvertrag läuft aus
  → Friedenspflicht endet
Verhandlungen (evtl. Warnstreiks)
  → gescheitert
Schlichtung (wenn vereinbart)
  → gescheitert
Urabstimmung der Mitglieder
  → Streik
  (Arbeitgeber: Aussperrung)
Neue Verhandlungen → Einigung
  → 2. Urabstimmung
Neuer Tarifvertrag
  → wieder Friedenspflicht` }
    ],
    merke: "Betriebsrat: ab 5 Arbeitnehmern, wählen ab 16, gewählt werden ab 18, 4 Jahre. JAV: unter 18 und Azubis, wählbar unter 25 und alle Azubis, 2 Jahre. Tarifvertrag: Gewerkschaft und Arbeitgeberverband, Friedenspflicht während der Laufzeit, Abweichung nur zugunsten des Arbeitnehmers.",
    quiz: [
      { id: "wiso-sp1", f: "In der Lindenwerk IT GmbH arbeiten 18 wahlberechtigte Arbeitnehmer. Sie wollen einen Betriebsrat wählen. Aus wie vielen Mitgliedern besteht er?",
        o: ["Aus 3 Mitgliedern", "Aus 1 Person", "Aus 5 Mitgliedern", "Ein Betriebsrat ist erst ab 20 Arbeitnehmern erlaubt."], r: [1],
        w: "§ 9 BetrVG: 5–20 работников с правом голоса → 1 человек; 21–50 → 3. Совет можно выбрать уже при 5 постоянных работниках (§ 1)." },
      { id: "wiso-sp2", f: "Die 16-jährige Auszubildende Sara möchte bei der Betriebsratswahl mitmachen. Welche Aussage trifft zu?",
        o: ["Sie darf weder wählen noch gewählt werden.", "Sie darf wählen und gewählt werden.", "Sie darf wählen, aber nicht in den Betriebsrat gewählt werden.", "Sie darf nur die JAV wählen, nicht den Betriebsrat."], r: [2],
        w: "§ 7 BetrVG (с 2021 года): голосовать можно с 16 лет. § 8: быть избранным — с 18 лет и после 6 месяцев в фирме. На выборах JAV Sara тоже может голосовать." },
      { id: "wiso-sp3", f: "Der Arbeitgeber will eine Software einführen, mit der man die Leistung der Mitarbeiter messen kann. Welche Aussage trifft zu?",
        o: ["Der Betriebsrat muss nur informiert werden.", "Der Betriebsrat hat ein Mitbestimmungsrecht; ohne seine Zustimmung oder einen Spruch der Einigungsstelle darf die Software nicht eingeführt werden.", "Der Betriebsrat hat kein Recht, weil es um Technik geht.", "Darüber entscheidet die Gewerkschaft."], r: [1],
        w: "§ 87 Abs. 1 Nr. 6 BetrVG: введение технических средств, которые могут контролировать поведение или результаты работников, — полное право совместного решения. В IT такие системы часто регулируют Betriebsvereinbarung." },
      { id: "wiso-sp4", f: "Was unterscheidet eine Betriebsvereinbarung von einem Tarifvertrag?",
        o: ["Die Betriebsvereinbarung schließen Arbeitgeber und Betriebsrat für einen Betrieb; den Tarifvertrag schließen Gewerkschaft und Arbeitgeberverband oder ein einzelner Arbeitgeber.", "Die Betriebsvereinbarung schließt die Gewerkschaft mit dem Staat.", "Ein Tarifvertrag gilt nur für Auszubildende.", "Eine Betriebsvereinbarung gilt auch mündlich."], r: [0],
        w: "Betriebsvereinbarung — письменное соглашение совета и работодателя (§ 77 BetrVG). Tarifvertrag — письменный договор профсоюза с союзом работодателей или с одной фирмой (§§ 1–2 TVG)." },
      { id: "wiso-sp5", f: "Welche Aussage zur Jugend- und Auszubildendenvertretung (JAV) trifft zu?",
        o: ["Sie schließt eigene Betriebsvereinbarungen mit dem Arbeitgeber.", "Sie wird für 4 Jahre gewählt.", "Wählbar sind nur Auszubildende unter 18 Jahren.", "Sie kann zu allen Betriebsratssitzungen einen Vertreter schicken."], r: [3],
        w: "§ 67 BetrVG: JAV направляет представителя на все заседания BR; по молодёжным темам участвует и голосует вся JAV. Своих соглашений с работодателем не заключает — действует через совет. Срок — 2 года; избирать можно всех до 25 лет и всех учеников." },
      { id: "wiso-sp6", f: "Während der Laufzeit eines Tarifvertrags ruft die Gewerkschaft zum Streik für höhere Löhne auf. Die Löhne sind in diesem Tarifvertrag geregelt. Welche Aussage trifft zu?",
        o: ["Der Streik ist rechtswidrig, weil während der Laufzeit die Friedenspflicht gilt.", "Der Streik ist erlaubt, weil Streiken ein Grundrecht ist.", "Der Streik ist erlaubt, wenn der Betriebsrat zustimmt.", "Der Streik ist erlaubt, wenn er höchstens einen Tag dauert."], r: [0],
        w: "Friedenspflicht: пока действует тарифный договор, бастовать по урегулированным в нём вопросам нельзя. Даже предупредительная забастовка (Warnstreik) возможна только после окончания срока договора." },
      { id: "wiso-sp7", f: "Welche Reihenfolge eines Arbeitskampfes ist richtig?",
        o: ["Streik → Urabstimmung → Verhandlungen → Einigung", "Verhandlungen scheitern → Urabstimmung → Streik → Einigung → zweite Urabstimmung", "Urabstimmung → Verhandlungen → Aussperrung → Streik", "Einigung → Streik → Urabstimmung → Verhandlungen"], r: [1],
        w: "Сначала переговоры; если они сорвались (и не помогло посредничество — Schlichtung, если оно согласовано), профсоюз проводит голосование членов (Urabstimmung), затем забастовка. После договорённости — второе голосование и новый тарифный договор." },
      { id: "wiso-sp8", f: "Ein Tarifvertrag sieht 30 Urlaubstage vor. Im Arbeitsvertrag eines tarifgebundenen Arbeitnehmers stehen 32 Urlaubstage. Was gilt?",
        o: ["30 Tage, weil der Tarifvertrag immer vorgeht.", "24 Werktage nach dem Bundesurlaubsgesetz.", "Der Arbeitsvertrag ist insgesamt unwirksam.", "32 Tage, weil Abweichungen zugunsten des Arbeitnehmers erlaubt sind (Günstigkeitsprinzip)."], r: [3],
        w: "§ 4 Abs. 3 TVG: отклоняться от тарифа можно только в пользу работника (Günstigkeitsprinzip). 32 дня лучше для работника — они действуют." },
      { id: "wiso-sp9", f: "Welche Aussage zur Allgemeinverbindlicherklärung eines Tarifvertrags trifft zu?",
        o: ["Jeder Tarifvertrag gilt automatisch für alle Arbeitnehmer in Deutschland.", "Die IHK erklärt Tarifverträge für allgemeinverbindlich.", "Das Bundesministerium für Arbeit und Soziales kann einen Tarifvertrag für allgemeinverbindlich erklären; dann gilt er auch für nicht tarifgebundene Arbeitgeber und Arbeitnehmer der Branche.", "Allgemeinverbindlich bedeutet, dass der Tarifvertrag nie gekündigt werden kann."], r: [2],
        w: "§ 5 TVG: решение принимает BMAS (по совместному заявлению сторон и вместе с тарифным комитетом), если это в общественных интересах. Тогда договор действует для всей отрасли, даже для тех, кто не состоит в союзах." },
      { id: "wiso-sp10", f: "Was regelt üblicherweise ein Manteltarifvertrag?",
        o: ["Allgemeine Arbeitsbedingungen wie Arbeitszeit, Urlaub und Kündigungsfristen", "Nur die Höhe der Löhne und Gehälter für ein Jahr", "Die Wahl des Betriebsrats", "Die Steuerklassen der Arbeitnehmer"], r: [0],
        w: "Manteltarifvertrag (рамочный) — общие условия труда: рабочее время, отпуск, сроки увольнения, надбавки; действует долго. Lohn- und Gehaltstarifvertrag — размер оплаты, срок обычно 1–2 года." },
      { id: "wiso-sp11", f: "Arbeitgeber und Betriebsrat können sich über den Urlaubsplan nicht einigen. Wer entscheidet?",
        o: ["Allein der Arbeitgeber", "Die Einigungsstelle aus Beisitzern beider Seiten und einem unparteiischen Vorsitzenden", "Die Gewerkschaft", "Die IHK"], r: [1],
        w: "§ 87 Abs. 1 Nr. 5 и Abs. 2 BetrVG: план отпусков — вопрос совместного решения; при споре решает Einigungsstelle, и её решение заменяет соглашение сторон (§ 76)." }
    ]
  });

  /* ============================================================== 4 Entgelt */
  T.push({
    id: "wiso-entgelt", titel: "Entgelt: Brutto, Netto und Sozialversicherung", ru: "Зарплата: брутто, нетто и социальное страхование", teil: "WiSo",
    katalog: "AP2 03.01.09 (S. 27) und 03.01.05 (S. 26): Lohn- und Gehaltsformen, Brutto/Netto, Lohnsteuer, Kirchensteuer, Sozialabgaben, vermögenswirksame Leistungen, Sozialversicherung",
    links: [],
    quellen: [["https://www.tk.de/firmenkunden/versicherung/beitraege-faq-und-mehr/beitragssaetze/aktuelle-beitragssaetze-in-der-sozialversicherung-2031554", "TK: Beitragssätze in der Sozialversicherung 2026"],
              ["https://www.tk.de/firmenkunden/versicherung/beitraege-faq-und-mehr/zahlen-und-grenzwerte/sozialversicherungs-rechengroessen-2026-2203234", "TK: Rechengrößen 2026 (Beitragsbemessungsgrenzen, Minijob, 325 €)"],
              [GII + "sgb_4/__20.html", "SGB IV § 20: Übergangsbereich, Geringverdienergrenze 325 €"],
              [GII + "sgb_11/__58.html", "SGB XI § 58: Pflegeversicherung, Sonderregel Sachsen"],
              [GII + "estg/__38b.html", "EStG § 38b: Steuerklassen"]],
    kurzRu: "От брутто до нетто: из зарплаты удерживают налоги (Lohnsteuer, иногда солидарный и церковный налог) и долю работника во взносах на четыре ветви социального страхования, а пятую ветвь — страхование от несчастных случаев — платит только работодатель. Взносы в больничную, пенсионную, по уходу и по безработице делятся примерно пополам; ставки и пределы меняются каждый год, поэтому на экзамене их дают в задании. Важная ловушка: церковный налог считают от суммы Lohnsteuer, а не от брутто.",
    punkte: [
      ["Lohnformen", "формы оплаты", "Zeitlohn: Bezahlung nach Zeit (Stundenlohn; Monatsgehalt). Leistungslohn: nach Menge (Akkordlohn) oder mit einer Prämie für gute Leistung. Dazu können Provision und Erfolgsbeteiligung kommen."],
      ["Brutto und Netto", "брутто и нетто", "Brutto ist der Verdienst vor allen Abzügen: Grundgehalt, Zuschläge, Prämien, Zuschuss zu vermögenswirksamen Leistungen. Netto ist, was nach Steuern und Sozialabgaben übrig bleibt. Danach können noch Abzüge kommen, z. B. die Sparrate für vermögenswirksame Leistungen. Was am Ende überwiesen wird, ist der Auszahlungsbetrag."],
      ["Lohnsteuer", "подоходный налог с зарплаты", "Der Arbeitgeber zieht sie vom Lohn ab und zahlt sie an das Finanzamt. Die Höhe hängt vom Einkommen und von der Steuerklasse ab. Steuerklassen (Stand 2026): I ledig; II alleinerziehend; III und V verheiratet mit sehr unterschiedlichem Einkommen; IV verheiratet mit ähnlichem Einkommen; VI zweiter Job."],
      ["Soli und Kirchensteuer", "солидарный и церковный налог", "Der Solidaritätszuschlag fällt seit 2021 nur noch bei hohen Einkommen an. Kirchensteuer zahlen nur Kirchenmitglieder: 9 % der Lohnsteuer, in Bayern und Baden-Württemberg 8 %. Beide werden von der Lohnsteuer berechnet, nicht vom Brutto."],
      ["Fünf Zweige der Sozialversicherung", "пять ветвей соцстрахования", "Krankenversicherung (Krankenkassen), Pflegeversicherung (Pflegekassen), Rentenversicherung (Deutsche Rentenversicherung), Arbeitslosenversicherung (Bundesagentur für Arbeit), Unfallversicherung (Berufsgenossenschaften). Die ersten vier zahlen Arbeitgeber und Arbeitnehmer etwa je zur Hälfte. Die Unfallversicherung zahlt der Arbeitgeber allein."],
      ["Beitragssätze", "ставки взносов", "Stand 2026: Krankenversicherung 14,6 % plus Zusatzbeitrag der Kasse (Durchschnitt 2,9 %). Pflegeversicherung 3,6 %; Kinderlose ab 23 zahlen 0,6 % mehr (nur der Arbeitnehmer). Rentenversicherung 18,6 %. Arbeitslosenversicherung 2,6 %. In Sachsen zahlt der Arbeitnehmer bei der Pflege mehr: 2,3 %, der Arbeitgeber 1,3 %. Die Werte ändern sich jedes Jahr — in der Prüfung stehen sie in der Aufgabe."],
      ["Beitragsbemessungsgrenze", "предел для расчёта взносов", "Nur bis zu diesem Monatsbetrag werden Beiträge berechnet, darüber nicht. Stand 2026: Kranken- und Pflegeversicherung 5.812,50 €, Renten- und Arbeitslosenversicherung 8.450 € im Monat."],
      ["Leistungen der Versicherungen", "что дают страховки", "Krankenversicherung: Arzt, Krankenhaus, Krankengeld nach 6 Wochen Krankheit. Pflegeversicherung: Hilfe bei Pflegebedürftigkeit. Rentenversicherung: Altersrente, Erwerbsminderungsrente, Reha. Arbeitslosenversicherung: Arbeitslosengeld, Vermittlung, Weiterbildung. Unfallversicherung: Arbeitsunfälle, Wegeunfälle, Berufskrankheiten."],
      ["Generationenvertrag", "договор поколений", "Die Rentenversicherung arbeitet im Umlageverfahren: Die heutigen Beitragszahler finanzieren die heutigen Renten. Es gibt immer mehr Rentner und weniger junge Beitragszahler. Darum steigt der Druck auf Beiträge und Renten (demografischer Wandel)."],
      ["Minijob und Übergangsbereich", "мини-джоб и переходная зона", "Minijob: Verdienst bis zur Geringfügigkeitsgrenze (Stand 2026: 603 € im Monat). Der Arbeitgeber zahlt Pauschalabgaben; der Arbeitnehmer zahlt nur einen kleinen Rentenbeitrag und kann sich davon befreien lassen. Übergangsbereich (Midijob, Stand 2026: 603,01 € bis 2.000 €): Der Anteil des Arbeitnehmers steigt langsam an."],
      ["Geringverdienergrenze für Azubis", "граница малого дохода для учеников", "Verdient ein Azubi höchstens 325 € im Monat, zahlt der Arbeitgeber alle Sozialversicherungsbeiträge allein. Das kommt heute selten vor, weil Ausbildungsvergütungen meist höher sind."],
      ["Vermögenswirksame Leistungen (VL)", "взносы на формирование имущества", "Ein Zuschuss des Arbeitgebers zum langfristigen Sparen, oft im Tarifvertrag geregelt, z. B. für einen Bausparvertrag oder Fondssparplan. Der Zuschuss gehört zum Bruttolohn. Der Staat gibt eine Arbeitnehmer-Sparzulage, wenn das zu versteuernde Einkommen niedrig genug ist (Stand 2026: bis 40.000 €, verheiratet bis 80.000 €)."],
      ["Entgeltabrechnung lesen", "как читать расчётный лист", "Oben stehen die Bruttobestandteile. Dann folgen die steuerlichen Abzüge (Lohnsteuer, Soli, Kirchensteuer) und die Sozialversicherung (Anteil des Arbeitnehmers). Das Ergebnis ist das Netto. Zum Schluss kommen sonstige Abzüge, z. B. die VL-Sparrate, und dann der Auszahlungsbetrag."],
      ["Arbeitgeberanteil", "доля работодателя", "Der Arbeitgeber zahlt zusätzlich zum Brutto seinen Anteil an der Sozialversicherung, die Unfallversicherung und Umlagen. Diese Lohnnebenkosten stehen nicht auf dem Netto des Arbeitnehmers, sind aber Kosten für den Betrieb."]
    ],
    /* \u00AD = weiches Trennzeichen: lange Wörter dürfen am Handy umbrechen */
    tabelle: { titel: "Sozialversicherung (Stand 2026; AG = Arbeitgeber, AN = Arbeitnehmer)",
      kopf: ["Zweig", "Satz 2026", "Wer zahlt?", "Träger"],
      zeilen: [
        ["Kranken\u00ADversicherung", "14,6 % + Zusatz\u00ADbeitrag (Ø 2,9 %)", "AG und AN je ½", "Kranken\u00ADkassen"],
        ["Pflege\u00ADversicherung", "3,6 % (Kinderlose + 0,6 %)", "AG und AN; in Sachsen AN mehr", "Pflege\u00ADkassen"],
        ["Renten\u00ADversicherung", "18,6 %", "AG und AN je ½", "Deutsche Renten\u00ADversicherung"],
        ["Arbeitslosen\u00ADversicherung", "2,6 %", "AG und AN je ½", "Bundes\u00ADagentur für Arbeit"],
        ["Unfall\u00ADversicherung", "je nach Branche und Gefahr", "nur AG", "Berufs\u00ADgenossen\u00ADschaften"]
      ] },
    code: [
      { titel: "Rechenbeispiel: Werte laut Aufgabe", text:
`Bruttogehalt             3.000,00 €
− Lohnsteuer (Tabelle)     350,00 €
− Kirchensteuer 9 %
  von 350 €                 31,50 €
− Sozialversicherung
  Anteil AN 21 %           630,00 €
= Netto                  1.988,50 €
− VL-Sparrate               40,00 €
= Auszahlung             1.948,50 €` }
    ],
    merke: "Brutto − Steuern (Lohnsteuer, Soli, Kirchensteuer von der Lohnsteuer) − Arbeitnehmeranteil Sozialversicherung = Netto. Die Unfallversicherung zahlt nur der Arbeitgeber. Sätze und Grenzen ändern sich jedes Jahr — in der Prüfung stehen sie in der Aufgabe.",
    quiz: [
      { id: "wiso-en1", f: "Welchen Zweig der Sozialversicherung bezahlt der Arbeitgeber allein?",
        o: ["Die Rentenversicherung", "Die Pflegeversicherung", "Die gesetzliche Unfallversicherung", "Die Arbeitslosenversicherung"], r: [2],
        w: "Unfallversicherung (Berufsgenossenschaft) финансирует только работодатель. Остальные четыре ветви делят работник и работодатель." },
      { id: "wiso-en2", f: "Wer ist Träger der Arbeitslosenversicherung?",
        o: ["Die Bundesagentur für Arbeit", "Die Deutsche Rentenversicherung", "Die Berufsgenossenschaft", "Die Krankenkasse"], r: [0],
        w: "Arbeitslosenversicherung → Bundesagentur für Arbeit (агентство по труду). Пенсия → DRV, несчастные случаи → Berufsgenossenschaft, здоровье → Krankenkasse." },
      { id: "wiso-en3", f: "Laut Aufgabe gilt: Bruttogehalt 2.800 €, Lohnsteuer 280 €, Kirchensteuer 9 % der Lohnsteuer, Arbeitnehmeranteil zur Sozialversicherung 21 %. Wie hoch ist das Nettogehalt?",
        o: ["1.932,00 €", "1.906,80 €", "2.212,00 €", "1.680,00 €"], r: [1],
        w: "Kirchensteuer считают от Lohnsteuer: 9 % × 280 = 25,20 €. Соцвзносы: 21 % × 2 800 = 588 €. Netto = 2 800 − 280 − 25,20 − 588 = 1 906,80 €. 1 680 € получится, если по ошибке взять 9 % от брутто." },
      { id: "wiso-en4", f: "Welche Aussage zur Beitragsbemessungsgrenze trifft zu?",
        o: ["Wer mehr als die Grenze verdient, zahlt doppelte Beiträge.", "Für den Teil des Gehalts über der Grenze werden in diesem Versicherungszweig keine Beiträge berechnet.", "Die Grenze ist für alle Zweige gleich und ändert sich nie.", "Unter der Grenze muss man keine Beiträge zahlen."], r: [1],
        w: "Beitragsbemessungsgrenze — потолок: взносы считают только с дохода до этой суммы. Пределы разные (для KV/PV ниже, для RV/AV выше) и меняются каждый год." },
      { id: "wiso-en5", f: "Welche Aussage zur Lohnsteuer trifft zu?",
        o: ["Der Arbeitnehmer überweist sie jeden Monat selbst an die Krankenkasse.", "Sie gehört zu den Sozialversicherungsbeiträgen.", "Sie ist für alle Arbeitnehmer gleich hoch.", "Der Arbeitgeber behält sie vom Bruttolohn ein und führt sie an das Finanzamt ab."], r: [3],
        w: "Lohnsteuer — это налог, а не соцвзнос. Работодатель удерживает его и перечисляет в Finanzamt; размер зависит от дохода и налогового класса." },
      { id: "wiso-en6", f: "Herr Demir ist verheiratet. Er verdient viel mehr als seine Frau. Welche Steuerklassen-Kombination führt beim Paar meist zu den geringsten monatlichen Abzügen? (Stand 2026)",
        o: ["III für Herrn Demir, V für seine Frau", "I für beide", "II für Herrn Demir, VI für seine Frau", "V für Herrn Demir, III für seine Frau"], r: [0],
        w: "III/V — для супругов с сильно разными доходами: класс III (меньше удержаний) у того, кто зарабатывает больше. IV/IV — при похожих доходах. I — не в браке (ledig), II — одинокие родители (alleinerziehend), VI — вторая работа." },
      { id: "wiso-en7", f: "Welche Leistung gehört zur gesetzlichen Unfallversicherung?",
        o: ["Arbeitslosengeld nach einer Kündigung", "Behandlung nach einem Unfall auf dem direkten Weg zur Arbeit", "Altersrente ab dem Rentenalter", "Krankengeld bei einer Grippe"], r: [1],
        w: "Unfallversicherung покрывает несчастные случаи на работе, на прямом пути на работу и домой (Wegeunfall, § 8 SGB VII) и профзаболевания. Грипп — это Krankenversicherung." },
      { id: "wiso-en8", f: "Was sind vermögenswirksame Leistungen?",
        o: ["Eine Steuer auf hohe Vermögen", "Ein Zuschlag für Nachtarbeit", "Geld vom Arbeitgeber, das der Arbeitnehmer langfristig anlegt, z. B. in einem Bausparvertrag", "Eine Leistung der Rentenversicherung"], r: [2],
        w: "VL — деньги работодателя (часто по тарифному договору) на долгосрочные накопления. Они входят в брутто. Государство может доплатить Arbeitnehmer-Sparzulage, если доход ниже лимита." },
      { id: "wiso-en9", f: "Welche Abzüge auf der Entgeltabrechnung sind Sozialversicherungsbeiträge? Kreuzen Sie alle richtigen an.",
        o: ["Rentenversicherung", "Kirchensteuer", "Pflegeversicherung", "Solidaritätszuschlag"], r: [0, 2],
        w: "Пенсионное страхование и страхование по уходу относятся к соцстрахованию. Kirchensteuer и Solidaritätszuschlag — налоги; их считают от Lohnsteuer." },
      { id: "wiso-en10", f: "Warum gerät die gesetzliche Rentenversicherung unter Druck?",
        o: ["Weil im Umlageverfahren immer weniger Beitragszahler immer mehr Rentner finanzieren", "Weil jeder Versicherte sein eigenes Geld auf einem Sparkonto ansammelt", "Weil die Arbeitgeber keine Beiträge zahlen", "Weil Renten nur aus Steuern bezahlt werden"], r: [0],
        w: "Umlageverfahren (договор поколений): сегодняшние взносы сразу идут на сегодняшние пенсии. Демографический сдвиг: плательщиков меньше, пенсионеров больше." },
      { id: "wiso-en11", f: "Eine Minijobberin verdient 450 € im Monat (Stand 2026: Geringfügigkeitsgrenze 603 €). Welche Aussage trifft zu?",
        o: ["Sie zahlt die vollen Beiträge wie bei einem normalen Job.", "Ein Minijob ist in Deutschland verboten.", "Weder sie noch der Arbeitgeber zahlen Abgaben.", "Es ist eine geringfügige Beschäftigung: Der Arbeitgeber zahlt Pauschalabgaben, sie selbst höchstens einen kleinen Rentenbeitrag."], r: [3],
        w: "Minijob до 603 € (2026): работодатель платит фиксированные взносы и налог (Pauschalabgaben); работник — только небольшой пенсионный взнос, от которого можно отказаться. Граница привязана к минимальной зарплате и меняется." }
    ]
  });

  /* ========================================================= 5 Weiterbildung */
  T.push({
    id: "wiso-weiterbildung", titel: "Lebenslanges Lernen: Fortbildung, Umschulung, Lern- und Arbeitstechniken", ru: "Обучение через всю жизнь: курсы, переобучение, техники учёбы и работы", teil: "WiSo",
    katalog: "AP2 03.01.10–14 (S. 27–28): lebensbegleitendes Lernen, Lerntechniken, Arbeitstechniken, berufliche Fortbildung und Umschulung, Lebensplanung",
    links: [],
    quellen: [[GII + "bbig_2005/__1.html", "BBiG § 1 (Fortbildung, Umschulung), § 53a (Fortbildungsstufen)"],
              [GII + "sgb_3/__81.html", "SGB III § 81: Bildungsgutschein"],
              ["https://www.revosax.sachsen.de/vorschrift/21486", "Sächsisches Qualifizierungszeitgesetz (ab 1. Januar 2027)"],
              ["https://www.ihk.de/magdeburg/bildung/weiterbildungen-1/foerderungen/aufstiegs-bafoeg-3297200", "IHK: Aufstiegs-BAföG"]],
    kurzRu: "В IT знания быстро стареют, поэтому учатся всю жизнь: Anpassungsfortbildung обновляет знания в своей профессии, Aufstiegsfortbildung (например, Bachelor Professional) даёт карьерный рост, а Umschulung — новую профессию. Деньги дают государство (Aufstiegs-BAföG, Bildungsgutschein от агентства по труду) и иногда работодатель; в Саксонии с 2027 года появляется право на 3 оплачиваемых учебных дня в году. Каталог спрашивает и техники учёбы (визуальная, аудиальная, коммуникативная, моторная), и техники работы (Eisenhower, ALPEN, SMART).",
    punkte: [
      ["Lebenslanges Lernen", "обучение через всю жизнь", "Technik und Arbeitswelt ändern sich schnell. Wer weiterlernt, bleibt beschäftigungsfähig, verdient oft mehr und kann aufsteigen. Man lernt in Kursen mit Prüfung, in betrieblichen Schulungen und ganz nebenbei am Arbeitsplatz oder mit Fachliteratur."],
      ["Anpassungsfortbildung", "повышение квалификации", "Sie hält das Wissen auf dem neuesten Stand, z. B. eine Schulung zu einer neuen Programmiersprache. Man bleibt im gleichen Beruf. Ähnlich ist die Erhaltungsfortbildung: Sie frischt vorhandenes Wissen auf."],
      ["Aufstiegsfortbildung", "образование для карьерного роста", "Sie führt zu einem höheren Abschluss mit mehr Verantwortung, z. B. Meister oder Fachwirt. Nach dem BBiG gibt es drei Stufen: Geprüfter Berufsspezialist, Bachelor Professional, Master Professional. Die Prüfung ist bei der Kammer."],
      ["Umschulung", "переобучение", "Sie befähigt zu einem anderen Beruf (§ 1 BBiG), z. B. wenn man den alten Beruf nicht mehr ausüben kann oder keine Stelle findet. Sie endet mit einer Prüfung vor der Kammer, z. B. als Fachinformatikerin."],
      ["Innerbetrieblich und extern", "внутри фирмы и вне её", "Innerbetriebliche Fortbildung: Schulungen im eigenen Betrieb, oft während der Arbeitszeit. Externe oder überbetriebliche Weiterbildung: bei Kammern, Bildungsträgern, Hochschulen oder online. Manche Tarifverträge regeln einen Anspruch auf Weiterbildung."],
      ["Förderung durch den Staat", "господдержка", "Aufstiegs-BAföG: für Aufstiegsfortbildungen; die Hälfte der Lehrgangs- und Prüfungsgebühren ist ein Zuschuss, der Rest ein günstiges Darlehen; keine Altersgrenze. Bildungsgutschein der Agentur für Arbeit oder des Jobcenters: Er übernimmt die Kosten einer zugelassenen Weiterbildung, z. B. wenn Arbeitslosigkeit droht."],
      ["Bildungsurlaub", "учебный отпуск", "Das regeln die Bundesländer, meist 5 bezahlte Arbeitstage pro Jahr. Sachsen: ab 1. Januar 2027 Qualifizierungszeit von 3 Arbeitstagen pro Jahr, wenn man länger als 6 Monate im Betrieb ist. Bayern hat keinen solchen Anspruch."],
      ["Lerntechniken", "способы учёбы", "Der Katalog nennt vier Wege: visuell (Mindmap, Lernposter, Videos), auditiv (Vorträge hören, Lernstoff aufnehmen), kommunikativ (Lerngruppe, Diskussion, Frage-Antwort-Spiele) und motorisch (Learning by Doing, Rollenspiele). Am besten kombiniert man mehrere Wege."],
      ["Digitale Lernmedien", "цифровые средства обучения", "CBT (Computer Based Training): Ein Lernprogramm läuft auf dem Rechner, auch ohne Internet. WBT (Web Based Training): online im Browser, oft mit Tutor oder Forum. Dazu kommen Apps, Lernplattformen und Videos. Vorteil: Man lernt, wann und wo man will. Nachteil: Man braucht Selbstdisziplin."],
      ["Zeitmanagement", "управление временем", "Eisenhower-Prinzip: wichtig und dringend → sofort selbst erledigen; wichtig, aber nicht dringend → einplanen; dringend, aber nicht wichtig → delegieren; weder noch → weglassen. ALPEN-Methode: Aufgaben notieren, Länge schätzen, Pufferzeit einplanen, Entscheidungen über Prioritäten treffen, Nachkontrolle."],
      ["SMART-Ziele", "SMART-цели", "Ein gutes Ziel ist spezifisch, messbar, attraktiv, realistisch und terminiert. Beispiel: „Bis zum 31. März löse ich jede Woche zwei alte WiSo-Prüfungen und erreiche mindestens 70 %.“"],
      ["Europa: Europass, Mobilität, Sozialcharta", "Европа: Europass, мобильность, Социальная хартия", "Der Europass ist eine Sammlung von EU-Dokumenten, mit denen Qualifikationen in Europa verständlich werden, z. B. Lebenslauf und Mobilitätsnachweis. Erasmus+ fördert Auslandsaufenthalte, auch für Azubis. Die Europäische Sozialcharta des Europarats schützt soziale Rechte, z. B. auf faire Arbeitsbedingungen und Berufsausbildung."],
      ["Potenzialanalyse und Karriereplanung", "анализ потенциала и карьера", "Man erkennt die eigenen Stärken, Schwächen, Interessen und Werte, z. B. mit Tests oder Feedback. Daraus leitet man Ziele und Schritte ab: Fortbildung, Studium, Spezialisierung oder Führung."],
      ["Existenzgründung", "открытие своего дела", "Chancen: eigene Ideen umsetzen, selbst entscheiden, vielleicht mehr verdienen. Grenzen: finanzielles Risiko, schwankendes Einkommen, oft persönliche Haftung, eigene Kranken- und Altersvorsorge, viel Bürokratie. Hilfe gibt es z. B. bei der Gründungsberatung der IHK."]
    ],
    tabelle: { titel: "Arten der beruflichen Weiterbildung",
      kopf: ["Art", "Ziel", "Beispiel"],
      zeilen: [
        ["Anpassungsfortbildung", "Wissen aktuell halten", "Schulung zu einem neuen Framework"],
        ["Aufstiegsfortbildung", "höherer Abschluss, mehr Verantwortung", "Bachelor Professional, Meister, Fachwirt"],
        ["Umschulung", "ein neuer Beruf", "Umschulung zur Fachinformatikerin"],
        ["Innerbetriebliche Fortbildung", "Bedarf des eigenen Betriebs", "interne Schulung zum Datenschutz"]
      ] },
    merke: "Anpassung = auf dem neuesten Stand bleiben, Aufstieg = höherer Abschluss, Umschulung = neuer Beruf. Geld: Aufstiegs-BAföG, Bildungsgutschein, Bildungszeit der Länder. Ziele SMART formulieren, Aufgaben nach Eisenhower ordnen.",
    quiz: [
      { id: "wiso-wb1", f: "Frau Novak war 10 Jahre Bürokauffrau. Jetzt lernt sie mit einem Bildungsgutschein den Beruf Fachinformatikerin. Wie nennt man diese Maßnahme?",
        o: ["Anpassungsfortbildung", "Umschulung", "Aufstiegsfortbildung", "Erhaltungsfortbildung"], r: [1],
        w: "Umschulung — переход в другую профессию (§ 1 Abs. 5 BBiG). Anpassung — обновить знания в своей профессии, Aufstieg — подняться на более высокий уровень в своей профессии." },
      { id: "wiso-wb2", f: "Ein Anwendungsentwickler besucht einen zweitägigen Kurs zur neuen Version seines Frameworks. Welche Art der Weiterbildung ist das?",
        o: ["Umschulung", "Aufstiegsfortbildung", "Berufsausbildungsvorbereitung", "Anpassungsfortbildung"], r: [3],
        w: "Профессия та же, знания приспосабливают к новой технике — Anpassungsfortbildung." },
      { id: "wiso-wb3", f: "Welche Aussage zum Aufstiegs-BAföG trifft zu?",
        o: ["Es fördert Aufstiegsfortbildungen wie Meister oder Bachelor Professional, und es gibt keine Altersgrenze.", "Es ist nur für Studierende an Universitäten unter 30 Jahren.", "Es ist ein Kredit der Hausbank ohne Zuschuss.", "Es zahlt nur der Arbeitgeber."], r: [0],
        w: "Aufstiegs-BAföG (AFBG): плата за курсы и экзамены — на 50 % субсидия, остальное — льготный кредит KfW; при успешной сдаче часть кредита списывают; возрастного ограничения нет." },
      { id: "wiso-wb4", f: "Eine Aufgabe ist dringend, aber nicht wichtig. Was tun Sie nach dem Eisenhower-Prinzip?",
        o: ["Sofort selbst erledigen", "Delegieren", "Fest einplanen und später selbst erledigen", "Weglassen"], r: [1],
        w: "Eisenhower: важно и срочно → сделать сразу; важно, но не срочно → запланировать; срочно, но не важно → поручить другому; ни то ни другое → не делать." },
      { id: "wiso-wb5", f: "Welche Lernmethode gehört zum motorischen Lernen?",
        o: ["Einen Podcast hören", "Eine Mindmap ansehen", "Eine Aufgabe praktisch ausprobieren (Learning by Doing)", "In einer Lerngruppe diskutieren"], r: [2],
        w: "Моторный способ — учиться действием (делать руками, ролевые игры). Подкаст — аудиальный способ, Mindmap — визуальный, дискуссия — коммуникативный." },
      { id: "wiso-wb6", f: "Was ist ein Web Based Training (WBT)?",
        o: ["Ein Lernprogramm, das nur offline von einer DVD läuft", "Ein Präsenzseminar ohne Computer", "Eine Prüfung der IHK", "Ein Lernprogramm, das online im Browser läuft, oft mit Austausch über Forum oder Tutor"], r: [3],
        w: "WBT работает онлайн в браузере (можно обновлять материал и общаться). CBT (Computer Based Training) — программа на компьютере, работает и без интернета." },
      { id: "wiso-wb7", f: "Welches Ziel ist nach der SMART-Regel formuliert?",
        o: ["„Bis zum 31. März löse ich jede Woche zwei alte WiSo-Prüfungen und erreiche mindestens 70 %.“", "„Ich will in WiSo besser werden.“", "„Ich lerne irgendwann mehr.“", "„Ich möchte alles wissen.“"], r: [0],
        w: "SMART: конкретно (старые экзамены WiSo), измеримо (2 в неделю, не меньше 70 %), реалистично, со сроком (31 марта). Остальные цели расплывчаты." },
      { id: "wiso-wb8", f: "Was ist der Europass?",
        o: ["Ein Reisepass für Auszubildende", "EU-Dokumente wie Lebenslauf und Mobilitätsnachweis, mit denen Qualifikationen in Europa verständlich werden", "Eine Fahrkarte für Bahnreisen in der EU", "Ein Steuerausweis für Arbeit im Ausland"], r: [1],
        w: "Europass — набор документов ЕС (резюме, подтверждение учёбы за рубежом и другие), чтобы квалификации понимали в разных странах." },
      { id: "wiso-wb9", f: "Welche Aussagen zur Existenzgründung treffen zu? Kreuzen Sie alle richtigen an.",
        o: ["Selbstständige müssen sich oft selbst um Kranken- und Altersvorsorge kümmern.", "Das Einkommen kann schwanken, und es gibt ein finanzielles Risiko.", "Selbstständige haben automatisch Anspruch auf bezahlten Urlaub.", "Eine Gründung hat kein Risiko, wenn die Idee gut ist."], r: [0, 1],
        w: "Своё дело — свобода решений, но и риски: нестабильный доход, ответственность по долгам, самостоятельная страховка и пенсия. Оплачиваемого отпуска по закону у предпринимателя нет." },
      { id: "wiso-wb10", f: "Wann kann die Agentur für Arbeit eine berufliche Weiterbildung mit einem Bildungsgutschein fördern?",
        o: ["Für jede private Reise ins Ausland", "Nur für Abiturientinnen und Abiturienten", "Wenn die Weiterbildung nötig ist, um Arbeitslosigkeit zu beenden oder zu verhindern, und Maßnahme und Träger zugelassen sind", "Nur wenn der Arbeitgeber die Hälfte bezahlt"], r: [2],
        w: "§ 81 SGB III: если обучение нужно, чтобы вернуться к работе или не потерять её, была консультация в агентстве по труду, а курс и организатор допущены к финансированию." }
    ]
  });

  /* ========================================================== 6 Rechtsformen */
  T.push({
    id: "wiso-rechtsformen", titel: "Betrieb und Rechtsformen", ru: "Предприятие и организационно-правовые формы", teil: "WiSo",
    katalog: "AP2 03.02.01–02 (S. 29): Betrieb, Branche, Wirtschaftssektoren, Rechtsformen (GbR, e. K., OHG, KG, GmbH & Co. KG, GmbH, AG), gemeinnützige Organisationen",
    links: [],
    quellen: [[GII + "hgb/", "Handelsgesetzbuch (HGB) §§ 1, 17, 19, 105, 126, 161, 164, 171"],
              [GII + "gmbhg/", "GmbH-Gesetz §§ 5, 5a, 7, 13"],
              [GII + "aktg/__7.html", "Aktiengesetz § 7 Grundkapital, §§ 76, 111"],
              [GII + "bgb/__709.html", "BGB § 709 Gewinnverteilung, § 721 Haftung (seit 2024)"]],
    kurzRu: "Правовая форма определяет, кто отвечает по долгам, кто руководит и сколько нужно капитала. В товариществах (GbR, OHG, Komplementär в KG) участники отвечают всем личным имуществом, а в обществах капитала (GmbH, UG, AG) отвечает только имущество самой фирмы. Минимальный капитал: GmbH — 25 000 €, UG — 1 €, AG — 50 000 €, а для индивидуального предпринимателя, GbR, OHG и KG минимума нет.",
    punkte: [
      ["Betrieb und Unternehmen", "производство и предприятие", "Der Betrieb ist der Ort, an dem Leistungen erstellt werden, z. B. eine Niederlassung. Das Unternehmen ist die rechtliche und wirtschaftliche Einheit; es kann mehrere Betriebe haben. Jeder Betrieb gehört zu einer Branche und bietet Produkte auf bestimmten Märkten an. Erwerbswirtschaftliche Betriebe wollen Gewinn erzielen."],
      ["Wirtschaftssektoren", "секторы экономики", "Primärer Sektor: Urproduktion (Landwirtschaft, Bergbau). Sekundärer Sektor: Verarbeitung (Industrie, Handwerk, Bau). Tertiärer Sektor: Dienstleistungen (Handel, Banken, IT-Dienstleister). Ein Softwarehaus gehört zum tertiären Sektor."],
      ["Haftung", "ответственность по долгам", "Unbeschränkt: mit dem ganzen Privatvermögen. Unmittelbar: Gläubiger können direkt vom Gesellschafter fordern. Gesamtschuldnerisch (solidarisch): Jeder haftet für die ganze Schuld. Beschränkt: nur mit dem Gesellschaftsvermögen oder bis zur Einlage."],
      ["Einzelunternehmen (e. K.)", "индивидуальный предприниматель", "Eine Person gründet, entscheidet allein und haftet allein und unbeschränkt. Es gibt kein Mindestkapital. Kaufleute werden ins Handelsregister eingetragen und führen den Zusatz „e. K.“ (eingetragene Kauffrau / eingetragener Kaufmann). Kleine Gewerbetreibende müssen das nicht."],
      ["GbR", "товарищество гражданского права", "Mindestens 2 Personen mit einem gemeinsamen Zweck, z. B. zwei freiberufliche Entwickler. Kein Mindestkapital. Die Gesellschafter haften persönlich, unbeschränkt und gesamtschuldnerisch. Seit 2024 kann sich eine GbR ins Gesellschaftsregister eintragen lassen (eGbR)."],
      ["OHG", "полное товарищество", "Handelsgesellschaft mit gemeinsamer Firma. Alle Gesellschafter haften unbeschränkt, unmittelbar und gesamtschuldnerisch. Jeder darf grundsätzlich die Geschäfte führen. Der Gewinn wird nach dem vereinbarten Beteiligungsverhältnis verteilt; die alte Regel „4 % auf den Kapitalanteil, Rest nach Köpfen“ gilt seit 2024 nicht mehr."],
      ["KG", "коммандитное товарищество", "Mindestens ein Komplementär: Er haftet unbeschränkt und führt die Geschäfte. Mindestens ein Kommanditist: Er haftet nur bis zur Höhe seiner Einlage, führt keine Geschäfte und hat Kontrollrechte."],
      ["GmbH & Co. KG", "KG, где полный товарищ — GmbH", "Eine KG, deren Komplementär eine GmbH ist. So haftet am Ende keine natürliche Person unbeschränkt. Die Firma muss die Haftungsbeschränkung zeigen."],
      ["GmbH", "общество с ограниченной ответственностью", "Eine juristische Person; sie haftet nur mit dem Gesellschaftsvermögen. Stammkapital mindestens 25.000 €. Bei der Anmeldung müssen mindestens 12.500 € eingezahlt sein. Der Gesellschaftsvertrag wird notariell beurkundet, dann folgt die Eintragung ins Handelsregister. Organe: Geschäftsführer und Gesellschafterversammlung; bei mehr als 500 Arbeitnehmern zusätzlich ein Aufsichtsrat."],
      ["UG (haftungsbeschränkt)", "мини-ГмбХ", "Eine „Mini-GmbH“: Stammkapital ab 1 €. Es muss vor der Anmeldung voll in Geld eingezahlt sein. Ein Viertel des Jahresüberschusses kommt in eine Rücklage, bis 25.000 € erreicht sind."],
      ["AG", "акционерное общество", "Grundkapital mindestens 50.000 €, aufgeteilt in Aktien. Organe: Vorstand (leitet die Gesellschaft), Aufsichtsrat (überwacht den Vorstand) und Hauptversammlung der Aktionäre (wählt Mitglieder des Aufsichtsrats, entscheidet über die Verwendung des Gewinns). Aktionäre haften nicht persönlich."],
      ["Handelsregister", "торговый реестр", "Öffentliches Verzeichnis beim Amtsgericht. Abteilung A: Einzelkaufleute und Personengesellschaften (e. K., OHG, KG). Abteilung B: Kapitalgesellschaften (GmbH, UG, AG). Eine GmbH oder AG entsteht als juristische Person erst mit der Eintragung."],
      ["Firma", "фирменное наименование", "Die Firma ist der Name, unter dem ein Kaufmann seine Geschäfte betreibt — nicht das Gebäude. Sie muss die Rechtsform zeigen, z. B. „Lindenwerk IT GmbH“ oder „Mia Weber e. K.“."],
      ["Gemeinnützige Organisationen", "некоммерческие организации", "Sie wollen keinen Gewinn für ihre Mitglieder, sondern dienen dem Gemeinwohl, z. B. ein eingetragener Verein (e. V.), eine gGmbH oder eine Stiftung. Sie bekommen Steuervorteile, müssen ihr Geld aber für den gemeinnützigen Zweck verwenden."]
    ],
    tabelle: { titel: "Rechtsformen im Vergleich",
      kopf: ["Form", "Haftung", "Mindestkapital", "Leitung"],
      zeilen: [
        ["e. K.", "Inhaber/in unbeschränkt", "keins", "Inhaber/in"],
        ["GbR", "alle unbeschränkt, gesamt\u00ADschuldnerisch", "keins", "alle Gesellschafter"],
        ["OHG", "alle unbeschränkt, unmittelbar, gesamt\u00ADschuldnerisch", "keins", "alle Gesellschafter"],
        ["KG", "Komplementär unbeschränkt, Kommanditist bis zur Einlage", "keins", "Komplementär"],
        ["GmbH", "nur Gesellschafts\u00ADvermögen", "25.000 € (bei Anmeldung mind. 12.500 €)", "Geschäftsführer"],
        ["UG (haftungs\u00ADbeschränkt)", "nur Gesellschafts\u00ADvermögen", "ab 1 € (voll einzahlen)", "Geschäftsführer"],
        ["AG", "nur Gesellschafts\u00ADvermögen", "50.000 €", "Vorstand; Kontrolle: Aufsichtsrat"]
      ] },
    merke: "Personengesellschaften (GbR, OHG, Komplementär der KG): persönlich und unbeschränkt. Kapitalgesellschaften (GmbH, UG, AG): nur das Gesellschaftsvermögen. Mindestkapital: GmbH 25.000 €, UG 1 €, AG 50.000 €.",
    quiz: [
      { id: "wiso-rf1", f: "Anna und Ben betreiben eine OHG. Ein Lieferant hat eine offene Rechnung über 30.000 €. Welche Aussage trifft zu?",
        o: ["Anna haftet nur bis zur Höhe ihrer Einlage.", "Der Lieferant muss sich zuerst an Ben wenden.", "Der Lieferant bekommt von Anna höchstens 15.000 €.", "Der Lieferant kann die ganzen 30.000 € direkt von Anna verlangen, auch aus ihrem Privatvermögen."], r: [3],
        w: "OHG: каждый участник отвечает неограниченно, напрямую и солидарно (§ 126 HGB). Кредитор может требовать всю сумму с любого участника, в том числе из личного имущества." },
      { id: "wiso-rf2", f: "Welche Aussage zum Kommanditisten einer KG trifft zu?",
        o: ["Er haftet nur bis zur Höhe seiner Einlage und führt keine Geschäfte.", "Er haftet unbeschränkt mit seinem Privatvermögen.", "Er führt die Geschäfte allein.", "Er muss mindestens 25.000 € einzahlen."], r: [0],
        w: "§§ 161, 164, 171 HGB: Kommanditist отвечает только в пределах своего вклада и не ведёт дела. Неограниченно отвечает и руководит Komplementär." },
      { id: "wiso-rf3", f: "Drei Freunde wollen eine GmbH gründen. Welche Aussage trifft zu?",
        o: ["Das Stammkapital beträgt mindestens 50.000 €.", "Das Stammkapital beträgt mindestens 25.000 €; bei der Anmeldung müssen mindestens 12.500 € eingezahlt sein.", "Die Gesellschafter haften mit ihrem ganzen Privatvermögen.", "Eine GmbH braucht keine Eintragung im Handelsregister."], r: [1],
        w: "§ 5 GmbHG: уставный капитал минимум 25 000 €; § 7: при регистрации внесена минимум половина (12 500 €). Отвечает только имущество общества (§ 13). 50 000 € — это AG." },
      { id: "wiso-rf4", f: "Welches Organ überwacht bei einer AG den Vorstand?",
        o: ["Die Hauptversammlung allein", "Der Betriebsrat", "Der Aufsichtsrat", "Das Handelsregister"], r: [2],
        w: "§ 111 AktG: Aufsichtsrat контролирует правление (Vorstand) и назначает его. Hauptversammlung — собрание акционеров: выбирает членов наблюдательного совета и решает, что делать с прибылью." },
      { id: "wiso-rf5", f: "Welche Kapitalgesellschaft kann man mit einem Stammkapital von nur 1 € gründen?",
        o: ["Die UG (haftungsbeschränkt)", "Die GmbH", "Die AG", "Keine — Kapitalgesellschaften brauchen immer mindestens 25.000 €."], r: [0],
        w: "§ 5a GmbHG: UG (haftungsbeschränkt) — от 1 €, только деньгами и полностью до регистрации; четверть годовой прибыли идёт в резерв, пока не наберётся 25 000 €." },
      { id: "wiso-rf6", f: "Was ist die „Firma“ im Sinne des Handelsgesetzbuchs?",
        o: ["Das Firmengebäude", "Die Gesamtheit aller Mitarbeiter", "Das Logo des Unternehmens", "Der Name, unter dem ein Kaufmann seine Geschäfte betreibt"], r: [3],
        w: "§ 17 HGB: Firma — это имя, под которым купец ведёт дела и подписывается. В быту Firma — это предприятие, а в праве — только название." },
      { id: "wiso-rf7", f: "Ein Softwarehaus entwickelt Apps für Kunden. Zu welchem Wirtschaftssektor gehört es?",
        o: ["Zum primären Sektor (Urproduktion)", "Zum tertiären Sektor (Dienstleistungen)", "Zum sekundären Sektor (Industrie und Handwerk)", "Zu keinem Sektor"], r: [1],
        w: "Первичный сектор — добыча и сельское хозяйство, вторичный — переработка и производство, третичный — услуги (торговля, банки, IT-услуги)." },
      { id: "wiso-rf8", f: "Bei welchen Rechtsformen haften die Gesellschafter für Schulden der Gesellschaft grundsätzlich NICHT mit ihrem Privatvermögen? Kreuzen Sie alle richtigen an.",
        o: ["OHG", "GmbH", "GbR", "AG"], r: [1, 3],
        w: "В GmbH и AG отвечает только имущество общества — это юридические лица. В OHG и GbR участники отвечают лично и неограниченно." },
      { id: "wiso-rf9", f: "In welche Abteilung des Handelsregisters wird eine GmbH eingetragen?",
        o: ["In Abteilung A", "In Abteilung B", "In das Vereinsregister", "In das Gesellschaftsregister für GbR"], r: [1],
        w: "Abteilung A — e. K., OHG, KG (купцы и товарищества); Abteilung B — общества капитала (GmbH, UG, AG). Объединения e. V. — в Vereinsregister, GbR — в Gesellschaftsregister." },
      { id: "wiso-rf10", f: "Im Gesellschaftsvertrag einer OHG steht nichts zur Gewinnverteilung, auch keine Beteiligungsverhältnisse und keine Werte der Beiträge. Wie wird der Gewinn nach dem Recht seit 2024 verteilt?",
        o: ["4 % auf den Kapitalanteil, der Rest nach Köpfen", "Nur an den Gesellschafter mit der höchsten Einlage", "Zu gleichen Teilen an alle Gesellschafter", "Der Gewinn bleibt immer ganz in der Gesellschaft."], r: [2],
        w: "С 2024 года (реформа MoPeG) прибыль делят по согласованным долям; если их нет — по согласованной стоимости вкладов; если нет и этого — поровну (§ 709 Abs. 3 BGB, § 120 HGB). Старое правило «4 % + остальное поровну» отменено, но ещё встречается в старых учебниках." }
    ]
  });

  /* ========================================================= 7 Unternehmen */
  T.push({
    id: "wiso-unternehmen", titel: "Unternehmen: Organisation, Ziele, Wirtschaftsordnung", ru: "Предприятие: организация, цели, экономический порядок", teil: "WiSo",
    katalog: "AP2 03.02.03–06 und 03.02.08 (S. 29): Organisationsformen, Verflechtungen, Ziele und Zielkonflikte, Produktivität, Wirtschaftlichkeit, Rentabilität, Arbeitsteilung, Globalisierung, Soziale Marktwirtschaft, Behörden",
    links: [],
    quellen: [[GII + "aktg/__18.html", "Aktiengesetz § 18: Konzern"],
              [GII + "gwb/__1.html", "GWB § 1: Kartellverbot"]],
    kurzRu: "Организационная структура показывает, кто кому подчиняется: Einlinien — один начальник, Mehrlinien — несколько начальников-специалистов, Stablinien — плюс советники без права приказывать, Sparten — деление по продуктам, Matrix — два начальника сразу. Цели предприятия (экономические, экологические, социальные) могут помогать друг другу (komplementär), мешать (konkurrierend) или не влиять друг на друга (indifferent). Главные показатели: производительность (количество к количеству), экономичность (доходы к расходам) и рентабельность (прибыль к капиталу в процентах).",
    punkte: [
      ["Aufbau- und Ablauforganisation", "структура и процессы", "Die Aufbauorganisation regelt Stellen, Abteilungen und wer wem Weisungen gibt (Organigramm). Die Ablauforganisation regelt, in welcher Reihenfolge Arbeitsschritte erledigt werden (Prozesse, z. B. als EPK oder BPMN)."],
      ["Einliniensystem", "линейная структура", "Jede Stelle hat genau einen Vorgesetzten. Vorteil: klare Zuständigkeit, eindeutige Weisungen. Nachteil: lange Dienstwege, die Leitung wird überlastet."],
      ["Mehrliniensystem", "функциональная структура", "Eine Stelle bekommt Weisungen von mehreren spezialisierten Vorgesetzten. Vorteil: viel Fachwissen, kurze Wege. Nachteil: Kompetenzkonflikte und widersprüchliche Anweisungen."],
      ["Stabliniensystem", "линейно-штабная структура", "Ein Einliniensystem mit Stabsstellen. Stabsstellen beraten die Leitung, dürfen aber keine Weisungen geben, z. B. die Rechtsabteilung oder die Assistenz der Geschäftsführung."],
      ["Sparten- und Matrixorganisation", "дивизиональная и матричная структура", "Spartenorganisation: Gliederung nach Produkten, Kunden oder Regionen; jede Sparte arbeitet fast wie ein eigenes Unternehmen. Matrixorganisation: zwei Dimensionen gleichzeitig, z. B. Fachabteilung und Projekt; ein Mitarbeiter hat zwei Vorgesetzte. Vorteil: flexibel. Nachteil: Konflikte zwischen den Leitungen."],
      ["Konzern, Kartell, Fusion", "концерн, картель, слияние", "Konzern: Die Unternehmen bleiben rechtlich selbstständig, werden aber einheitlich geleitet. Kartell: Selbstständige Unternehmen sprechen z. B. Preise ab — das ist grundsätzlich verboten, das Bundeskartellamt kontrolliert. Fusion: Unternehmen verschmelzen zu einem; mindestens eines verliert die rechtliche Selbstständigkeit. Große Fusionen prüft das Bundeskartellamt."],
      ["Unternehmensziele", "цели предприятия", "Ökonomisch: Gewinn, Umsatz, Marktanteil, Liquidität. Ökologisch: Energie sparen, weniger Emissionen und Abfall. Sozial: sichere Arbeitsplätze, faire Bezahlung, Weiterbildung, Gesundheit."],
      ["Zielbeziehungen", "отношения между целями", "Komplementär (Zielharmonie): Ein Ziel fördert das andere, z. B. weniger Strom → weniger Kosten. Konkurrierend (Zielkonflikt): Ein Ziel behindert das andere, z. B. höhere Löhne ↔ höherer Gewinn. Indifferent (Zielneutralität): Die Ziele beeinflussen sich nicht."],
      ["Produktivität", "производительность", "Ein Mengenverhältnis: Ausbringungsmenge ÷ Einsatzmenge. Beispiel für Arbeitsproduktivität: 1.200 gelöste Tickets ÷ 400 Arbeitsstunden = 3 Tickets pro Stunde."],
      ["Wirtschaftlichkeit", "экономичность", "Ein Wertverhältnis: Ertrag ÷ Aufwand (oder Leistung ÷ Kosten). Ist der Wert größer als 1, wurde wirtschaftlich gearbeitet. Beispiel: 600.000 € ÷ 500.000 € = 1,2."],
      ["Rentabilität", "рентабельность", "Der Gewinn im Verhältnis zum Kapital, in Prozent. Eigenkapitalrentabilität = Gewinn ÷ Eigenkapital × 100. Umsatzrentabilität = Gewinn ÷ Umsatz × 100. Gesamtkapitalrentabilität = (Gewinn + Fremdkapitalzinsen) ÷ Gesamtkapital × 100."],
      ["Ökonomisches Prinzip", "экономический принцип", "Maximalprinzip: Mit gegebenen Mitteln den größten Erfolg erreichen. Minimalprinzip: Ein festes Ziel mit möglichst wenig Mitteln erreichen."],
      ["Arbeitsteilung und Globalisierung", "разделение труда и глобализация", "Betriebliche Arbeitsteilung: Spezialisierung in Abteilungen. Gesamtwirtschaftliche Arbeitsteilung: Sektoren und Berufe. Globalisierung: weltweite Arbeitsteilung und Märkte. Vorteile: größere Märkte, günstigere Produkte. Nachteile: Abhängigkeit von Lieferketten, Druck auf Löhne und Standorte, mehr Transport."],
      ["Soziale Marktwirtschaft und Behörden", "социальное рыночное хозяйство и ведомства", "Der Markt regelt Angebot und Preise. Der Staat schützt den Wettbewerb (Kartellamt) und sorgt für sozialen Ausgleich (Sozialversicherung, Tarifautonomie, Steuern). Grenzen: Staatsschulden, demografischer Wandel, Umweltkosten. Wichtige Behörden für Betriebe: Finanzamt (Steuern), Gewerbeamt (Anmeldung), Gewerbeaufsicht (Arbeitsschutz), Agentur für Arbeit, Datenschutzaufsicht."]
    ],
    tabelle: { titel: "Organisationsformen",
      kopf: ["Form", "Weisungen von …", "Vorteil", "Nachteil"],
      zeilen: [
        ["Einlinien", "genau 1 Vorgesetzten", "klare Wege", "lange Dienstwege"],
        ["Mehrlinien", "mehreren Fach\u00ADvorgesetzten", "Spezialwissen", "widersprüchliche Weisungen"],
        ["Stablinien", "1 Vorgesetzten; der Stab berät nur", "Experten entlasten die Leitung", "Stab ohne Entscheidungs\u00ADmacht"],
        ["Sparten", "Leitung je Produkt oder Region", "marktnah", "doppelte Abteilungen"],
        ["Matrix", "2 Vorgesetzten (Fach und Projekt)", "flexibel", "Kompetenz\u00ADkonflikte"]
      ] },
    code: [
      { titel: "Kennzahlen rechnen", text:
`Produktivität (Menge ÷ Menge)
  1.200 Tickets ÷ 400 h
  = 3 Tickets pro Stunde

Wirtschaftlichkeit (Wert ÷ Wert)
  600.000 € ÷ 500.000 € = 1,2

Eigenkapitalrentabilität
  Gewinn ÷ Eigenkapital × 100
  40.000 € ÷ 250.000 € × 100
  = 16 %` }
    ],
    merke: "Ein Chef = Einlinien, mehrere Fachchefs = Mehrlinien, Berater ohne Weisungsrecht = Stab, zwei Chefs = Matrix. Produktivität = Menge ÷ Menge, Wirtschaftlichkeit = Ertrag ÷ Aufwand, Rentabilität = Gewinn ÷ Kapital × 100. Ziele: komplementär, konkurrierend, indifferent.",
    quiz: [
      { id: "wiso-un1", f: "In der Lindenwerk IT GmbH bekommt eine Entwicklerin Anweisungen von der Leiterin der Entwicklungsabteilung und gleichzeitig vom Leiter eines Kundenprojekts. Welche Organisationsform liegt vor?",
        o: ["Einliniensystem", "Stabliniensystem", "Spartenorganisation", "Matrixorganisation"], r: [3],
        w: "Два руководителя одновременно (отдел и проект) — признак матричной структуры (Matrixorganisation)." },
      { id: "wiso-un2", f: "Welche Aussage zum Stabliniensystem trifft zu?",
        o: ["Stabsstellen beraten die Leitung, dürfen aber keine Weisungen an die Linie geben.", "Jeder Mitarbeiter hat mehrere gleichberechtigte Vorgesetzte.", "Stabsstellen sind die obersten Vorgesetzten im Unternehmen.", "Es gibt keine Hierarchie."], r: [0],
        w: "Stab — эксперты-советники (юристы, ассистенты) без права отдавать распоряжения. Остальная структура устроена как Einlinien." },
      { id: "wiso-un3", f: "Ein Unternehmen will gleichzeitig den Gewinn steigern und die Löhne deutlich erhöhen. Welche Zielbeziehung liegt vor?",
        o: ["Komplementär (Zielharmonie)", "Konkurrierend (Zielkonflikt)", "Indifferent (Zielneutralität)"], r: [1],
        w: "Более высокие зарплаты — больше затрат и меньше прибыли. Цели мешают друг другу — konkurrierend." },
      { id: "wiso-un4", f: "Ein Rechenzentrum spart durch eine effiziente Kühlung Strom. Dadurch sinken die Kosten und die CO₂-Emissionen. Welche Beziehung besteht zwischen den Zielen „Kosten senken“ und „Emissionen senken“?",
        o: ["Konkurrierend", "Indifferent", "Komplementär"], r: [2],
        w: "Одна цель помогает другой: меньше энергии — меньше затрат и меньше выбросов. Это komplementär (Zielharmonie)." },
      { id: "wiso-un5", f: "Laut Aufgabe beträgt der Gewinn 40.000 € und das Eigenkapital 250.000 €. Wie hoch ist die Eigenkapitalrentabilität?",
        o: ["6,25 %", "1,6 %", "16 %", "160 %"], r: [2],
        w: "Рентабельность = прибыль ÷ капитал × 100 = 40 000 ÷ 250 000 × 100 = 16 %. 6,25 получится, если перевернуть дробь (капитал ÷ прибыль)." },
      { id: "wiso-un6", f: "Ein Support-Team löst 1.200 Tickets in 400 Arbeitsstunden: 1.200 ÷ 400 = 3 Tickets pro Stunde. Welche Kennzahl ist das?",
        o: ["Arbeitsproduktivität", "Wirtschaftlichkeit", "Rentabilität", "Liquidität"], r: [0],
        w: "Количество результата ÷ количество затраченного (часы) — производительность (Produktivität). Это соотношение количеств, а не денег." },
      { id: "wiso-un7", f: "Welche Aussage zur Wirtschaftlichkeit trifft zu?",
        o: ["Sie ist das Verhältnis von Gewinn zu Eigenkapital in Prozent.", "Sie ist das Verhältnis von Ertrag zu Aufwand; ein Wert über 1 bedeutet, dass wirtschaftlich gearbeitet wurde.", "Sie vergleicht nur Mengen, keine Geldwerte.", "Sie zeigt, ob ein Unternehmen seine Rechnungen sofort bezahlen kann."], r: [1],
        w: "Wirtschaftlichkeit = доходы ÷ расходы (в деньгах); больше 1 — экономично. Прибыль ÷ капитал — рентабельность; количество ÷ количество — производительность; способность платить сразу — ликвидность (Liquidität)." },
      { id: "wiso-un8", f: "Zwei IT-Händler sprechen heimlich ab, ihre Preise für Notebooks nicht unter 900 € zu senken. Welche Aussage trifft zu?",
        o: ["Es ist ein Konzern, weil beide einheitlich geleitet werden.", "Es ist eine Fusion, weil die Unternehmen verschmelzen.", "Preisabsprachen sind erlaubt, wenn sie geheim bleiben.", "Es ist ein Kartell; solche Absprachen sind grundsätzlich verboten."], r: [3],
        w: "Kartell: самостоятельные фирмы договариваются (например, о ценах) и ограничивают конкуренцию — это запрещено (§ 1 GWB), контролирует Bundeskartellamt." },
      { id: "wiso-un9", f: "Welche Aussage zum Konzern trifft zu?",
        o: ["Die Unternehmen bleiben rechtlich selbstständig, werden aber einheitlich geleitet.", "Die Unternehmen verlieren ihre rechtliche Selbstständigkeit und werden ein Unternehmen.", "Ein Konzern ist eine verbotene Preisabsprache.", "Ein Konzern hat immer nur einen Betrieb."], r: [0],
        w: "§ 18 AktG: концерн — юридически самостоятельные компании под единым руководством (например, материнская и дочерние). Слияние — это Fusion, ценовой сговор — Kartell." },
      { id: "wiso-un10", f: "Welche Aufgaben hat der Staat in der Sozialen Marktwirtschaft? Kreuzen Sie alle richtigen an.",
        o: ["Er schützt den Wettbewerb, z. B. durch das Bundeskartellamt.", "Er legt alle Preise und Löhne selbst fest.", "Er sorgt für sozialen Ausgleich, z. B. durch die Sozialversicherung.", "Er verbietet privates Eigentum an Unternehmen."], r: [0, 2],
        w: "В социальном рыночном хозяйстве цены формирует рынок, а зарплаты согласуют профсоюзы и работодатели (Tarifautonomie). Государство охраняет конкуренцию и обеспечивает социальный баланс." },
      { id: "wiso-un11", f: "Ein Betrieb will mit einem festen Budget von 50.000 € möglichst viele Arbeitsplätze modernisieren. Nach welchem Prinzip handelt er?",
        o: ["Minimalprinzip", "Maximalprinzip", "Günstigkeitsprinzip", "Umlageverfahren"], r: [1],
        w: "Средства заданы (50 000 €), результат — максимальный: Maximalprinzip. Minimalprinzip — наоборот: результат задан, средства — минимальные." }
    ]
  });

  /* ======================================================= 8 Arbeitsschutz */
  T.push({
    id: "wiso-arbeitsschutz", titel: "Arbeitsschutz, Unfall und Brandschutz", ru: "Охрана труда, несчастный случай и пожарная безопасность", teil: "WiSo",
    katalog: "AP2 03.03.01–07 (S. 30): Arbeitsschutzvorschriften, Gefährdungen, Vorsorge, Sicherheitsbeauftragte, Sicherheitszeichen, Prüfzeichen, Schutzklassen, Verhalten bei Unfällen, Brandschutz",
    links: [],
    quellen: [[GII + "arbschg/", "Arbeitsschutzgesetz (ArbSchG) §§ 3, 5, 9, 12, 15–17"],
              [GII + "sgb_7/__22.html", "SGB VII § 22 Sicherheitsbeauftragte (Fassung 2026), § 193 Unfallanzeige"],
              [GII + "arbst_ttv_2004/anhang.html", "Arbeitsstättenverordnung, Anhang 6: Bildschirmarbeitsplätze"],
              ["https://www.dguv.de/fb-erstehilfe/themenfelder/betrieblicher-ersthelfer/index.jsp", "DGUV: Zahl und Ausbildung der Ersthelfer"]],
    kurzRu: "За безопасность отвечает работодатель: он оценивает опасности (Gefährdungsbeurteilung, включая психическую нагрузку), инструктирует работников и сам платит за меры защиты, а контролируют государство (Gewerbeaufsicht) и страховые союзы (Berufsgenossenschaft). Работник обязан соблюдать инструкции и сразу сообщать об опасностях и неисправностях. При пожаре: сохранять спокойствие, сообщить (112), спасаться самому и предупредить других без лифта и закрывая двери, и только потом тушить, если это безопасно.",
    punkte: [
      ["Duales Arbeitsschutzsystem", "двойная система охраны труда", "Der Staat macht Gesetze und Verordnungen, z. B. ArbSchG, Arbeitsstättenverordnung, Betriebssicherheitsverordnung (sichere Arbeitsmittel) und ArbZG. Die Arbeitsschutzbehörden der Länder (Gewerbeaufsicht) kontrollieren. Die Berufsgenossenschaften erlassen Unfallverhütungsvorschriften, beraten und kontrollieren ebenfalls."],
      ["Pflichten des Arbeitgebers", "обязанности работодателя", "Er macht eine Gefährdungsbeurteilung und dokumentiert sie, auch zu psychischen Belastungen. Er trifft Maßnahmen und prüft, ob sie wirken. Er unterweist die Beschäftigten bei der Einstellung, bei neuen Aufgaben und regelmäßig, und zwar während der Arbeitszeit. Die Kosten darf er nicht auf die Beschäftigten abwälzen."],
      ["Pflichten und Rechte der Beschäftigten", "обязанности и права работников", "Weisungen und Unterweisungen befolgen, Schutzausrüstung richtig benutzen, Gefahren und Defekte sofort melden. Rechte: Vorschläge machen; bei unmittelbarer erheblicher Gefahr den Arbeitsplatz verlassen, ohne Nachteile zu haben."],
      ["Fachkraft für Arbeitssicherheit und Betriebsarzt", "специалист по охране труда и производственный врач", "Der Arbeitgeber muss beide bestellen (Arbeitssicherheitsgesetz). Sie beraten ihn. In Betrieben mit mehr als 20 Beschäftigten gibt es einen Arbeitsschutzausschuss; er trifft sich mindestens einmal im Vierteljahr."],
      ["Sicherheitsbeauftragte", "уполномоченные по безопасности", "Beschäftigte, die den Arbeitgeber ehrenamtlich unterstützen: Sie achten auf Schutzeinrichtungen und machen Kollegen auf Gefahren aufmerksam. Sie haben keine Weisungsbefugnis und dürfen nicht benachteiligt werden. Seit 2026 sind sie ab regelmäßig 50 Beschäftigten Pflicht (vorher: mehr als 20), bei besonderer Gefährdung schon ab mehr als 20."],
      ["Bildschirmarbeitsplatz", "рабочее место с монитором", "Die Regeln stehen heute in der Arbeitsstättenverordnung (früher Bildschirmarbeitsverordnung). Der Bildschirm ist frei von Reflexionen und Blendung, dreh- und neigbar, die Zeichengröße ist einstellbar. Es gibt Platz für wechselnde Haltungen. Die Arbeit wird durch Pausen oder andere Tätigkeiten unterbrochen. Der Arbeitgeber bietet eine Untersuchung der Augen an und stellt eine nötige Bildschirmbrille zur Verfügung."],
      ["Gefährdungsarten", "виды опасностей", "Mechanisch (stolpern, quetschen), elektrisch (Stromschlag), thermisch (Hitze, Verbrennung), chemisch (Tonerstaub, Reinigungsmittel), ergonomisch (falsche Haltung), akustisch (Lärm) und psychisch (Zeitdruck, ständige Erreichbarkeit)."],
      ["Sicherheitszeichen", "знаки безопасности", "Verbotszeichen: rund, roter Rand, roter Balken. Warnzeichen: dreieckig, gelb. Gebotszeichen: rund, blau. Rettungszeichen und Erste Hilfe: rechteckig, grün, z. B. Notausgang. Brandschutzzeichen: rechteckig, rot, z. B. Feuerlöscher."],
      ["Prüfzeichen", "знаки соответствия и проверки", "CE: Der Hersteller erklärt selbst, dass das Produkt die EU-Vorschriften erfüllt; es ist Pflicht, aber keine Prüfung durch Dritte. GS (Geprüfte Sicherheit): freiwillig; eine unabhängige Prüfstelle hat das Produkt getestet."],
      ["Schutzklassen und Schutzarten", "классы защиты и степени защиты", "Schutzklasse I: Schutzleiter (Schukostecker, Metallgehäuse). Schutzklasse II: Schutzisolierung, doppelt isoliert, Symbol: zwei Quadrate ineinander. Schutzklasse III: Schutzkleinspannung (ungefährlich kleine Spannung). Schutzart IP, z. B. IP54: 1. Ziffer = Schutz gegen Fremdkörper und Berührung, 2. Ziffer = Schutz gegen Wasser."],
      ["Erste Hilfe und Ersthelfer", "первая помощь", "Bei 2 bis 20 anwesenden Versicherten ist mindestens 1 Ersthelfer nötig. Darüber: in Verwaltung und Handel 5 %, in anderen Betrieben 10 % der Anwesenden. Die Ausbildung dauert 9 Unterrichtseinheiten, eine Fortbildung ist spätestens alle 2 Jahre nötig. Jede Erste-Hilfe-Leistung wird dokumentiert (z. B. Verbandbuch) und 5 Jahre aufbewahrt."],
      ["Verhalten bei Unfällen", "действия при несчастном случае", "Unfallstelle sichern, Erste Hilfe leisten, Notruf 112 wählen, Ersthelfer und Vorgesetzte informieren (Meldekette). Nach Arbeits- und Wegeunfällen geht man in der Regel zum Durchgangsarzt (D-Arzt), wenn man über den Unfalltag hinaus arbeitsunfähig ist."],
      ["Unfallanzeige", "сообщение о несчастном случае", "Der Arbeitgeber meldet einen Unfall der Berufsgenossenschaft, wenn jemand stirbt oder mehr als 3 Tage arbeitsunfähig ist. Die Anzeige muss innerhalb von 3 Tagen erfolgen. Der Betriebsrat unterschreibt mit."],
      ["Brandschutz", "пожарная безопасность", "Vorbeugen: Geräte wie Kaffeemaschinen nicht unbeaufsichtigt lassen, Fluchtwege freihalten, Brandschutztüren nicht festkeilen. Die Brandschutzordnung des Betriebs sagt, was zu tun ist. Im Brandfall: Ruhe bewahren → Brand melden → in Sicherheit bringen (keinen Aufzug benutzen, Türen schließen, zum Sammelplatz) → löschen nur ohne eigene Gefahr. Für IT-Geräte eignet sich ein CO₂-Löscher, weil er keine Rückstände hinterlässt."]
    ],
    tabelle: { titel: "Brandklassen und Löschmittel",
      kopf: ["Klasse", "Was brennt?", "geeignet z. B.", "Beispiele"],
      zeilen: [
        ["A", "feste, glutbildende Stoffe", "Wasser, Schaum, ABC-Pulver", "Papier, Holz, Textilien"],
        ["B", "flüssige oder flüssig werdende Stoffe", "Schaum, ABC-Pulver, CO₂", "Benzin, Öl, Lack, Wachs"],
        ["C", "Gase", "ABC-Pulver; Gaszufuhr sperren", "Erdgas, Propan"],
        ["D", "Metalle", "Metallbrandpulver (D-Pulver)", "Aluminium, Magnesium"],
        ["F", "Speiseöle und -fette", "Fettbrandlöscher — nie Wasser", "Fett in der Fritteuse"]
      ] },
    code: [
      { titel: "Notruf 112 und Brandfall", text:
`Notruf 112 — die W-Fragen:
  Wo ist es passiert?
  Was ist passiert?
  Wie viele Verletzte?
  Welche Verletzungen?
  Warten auf Rückfragen!

Brandfall — Reihenfolge:
  1. Ruhe bewahren
  2. Brand melden
  3. In Sicherheit bringen
  4. Löschversuch unternehmen` }
    ],
    merke: "Arbeitgeber: Gefährdungsbeurteilung, Unterweisung, Kosten. Beschäftigte: Weisungen befolgen, Gefahren melden. Brand: melden → retten → löschen. CE = Erklärung des Herstellers, GS = unabhängig geprüft. Unfallanzeige: mehr als 3 Tage arbeitsunfähig, innerhalb von 3 Tagen.",
    quiz: [
      { id: "wiso-as1", f: "Wer muss die Gefährdungsbeurteilung für die Arbeitsplätze im Betrieb durchführen?",
        o: ["Jeder Beschäftigte für sich selbst", "Die Gewerkschaft", "Der Arbeitgeber", "Die IHK"], r: [2],
        w: "§ 5 ArbSchG: работодатель обязан оценить опасности (включая психическую нагрузку) и определить меры. Fachkraft и Betriebsarzt помогают, но отвечает работодатель." },
      { id: "wiso-as2", f: "Welche Aussage zur Unterweisung nach dem Arbeitsschutzgesetz trifft zu?",
        o: ["Sie findet während der Arbeitszeit statt: bei der Einstellung, bei neuen Aufgaben oder Arbeitsmitteln und bei Bedarf regelmäßig.", "Sie ist freiwillig und findet in der Freizeit statt.", "Sie ist nur für Auszubildende vorgeschrieben.", "Die Kosten trägt der Beschäftigte."], r: [0],
        w: "§ 12 ArbSchG: инструктаж проводят в рабочее время — при приёме, при новых задачах, средствах труда или технологиях и при необходимости регулярно. Расходы на охрану труда нельзя перекладывать на работников (§ 3 Abs. 3)." },
      { id: "wiso-as3", f: "Welches Sicherheitszeichen ist ein Rettungszeichen?",
        o: ["Ein rundes Zeichen mit rotem Rand und Querbalken", "Ein gelbes Dreieck mit schwarzem Symbol", "Ein rundes blaues Zeichen mit weißem Symbol", "Ein grünes Rechteck mit weißem Symbol, z. B. Notausgang"], r: [3],
        w: "Зелёный прямоугольник — спасение и первая помощь (выход, аптечка). Красный круг с полосой — запрет, жёлтый треугольник — предупреждение, синий круг — предписание, красный прямоугольник — средства пожаротушения." },
      { id: "wiso-as4", f: "Was bedeutet das CE-Zeichen auf einem Monitor?",
        o: ["Eine unabhängige Prüfstelle hat das Gerät geprüft und zertifiziert.", "Der Hersteller erklärt, dass das Gerät die geltenden EU-Anforderungen erfüllt.", "Das Gerät ist besonders umweltfreundlich.", "Das Gerät wurde in der EU hergestellt."], r: [1],
        w: "CE — декларация самого производителя о соответствии нормам ЕС, а не знак качества и не независимая проверка. Независимую проверку показывает знак GS (Geprüfte Sicherheit)." },
      { id: "wiso-as5", f: "Im Serverraum brennt ein Gerät. Welche Reihenfolge ist richtig?",
        o: ["Erst selbst löschen, dann melden, dann weggehen", "Brand melden → in Sicherheit bringen → Löschversuch, wenn er ohne Gefahr möglich ist", "Mit dem Aufzug ins Erdgeschoss fahren und dann melden", "Fenster öffnen, damit der Rauch abzieht, dann löschen"], r: [1],
        w: "Порядок при пожаре: сохранять спокойствие → сообщить (112, пожарный извещатель) → спастись и предупредить других (без лифта, закрыть двери) → тушить, только если это безопасно. Открытое окно даёт огню кислород." },
      { id: "wiso-as6", f: "Welcher Feuerlöscher eignet sich besonders für einen Brand an Computern und Servern?",
        o: ["Ein Wasserlöscher", "Ein Fettbrandlöscher (Brandklasse F)", "Ein Kohlendioxid-Löscher (CO₂), weil er keine Rückstände hinterlässt", "Metallbrandpulver (Brandklasse D)"], r: [2],
        w: "CO₂ не оставляет следов и подходит для электроники (в маленьком помещении осторожно: CO₂ вытесняет кислород). Вода и электричество — опасно." },
      { id: "wiso-as7", f: "Eine Auszubildende stolpert im Büro über ein Kabel und ist danach 5 Tage arbeitsunfähig. Welche Aussage trifft zu?",
        o: ["Der Arbeitgeber muss den Unfall innerhalb von 3 Tagen der Berufsgenossenschaft melden.", "Der Unfall muss nicht gemeldet werden, weil niemand gestorben ist.", "Die Auszubildende muss den Unfall selbst der Krankenkasse melden.", "Die Meldung ist erst nach 6 Wochen Arbeitsunfähigkeit nötig."], r: [0],
        w: "§ 193 SGB VII: если пострадавший нетрудоспособен больше 3 дней (или погиб), работодатель сообщает в Berufsgenossenschaft в течение 3 дней после того, как узнал. 5 дней > 3 — сообщать нужно." },
      { id: "wiso-as8", f: "In einem Büro (Verwaltung) sind 60 Beschäftigte anwesend. Wie viele Ersthelfer braucht der Betrieb mindestens?",
        o: ["1", "3", "6", "60"], r: [1],
        w: "DGUV Vorschrift 1 § 26: больше 20 человек — в офисах и торговле 5 %: 5 % × 60 = 3. На других предприятиях — 10 % (было бы 6)." },
      { id: "wiso-as9", f: "Welche Aussage zu Sicherheitsbeauftragten trifft zu?",
        o: ["Sie tragen die volle rechtliche Verantwortung für den Arbeitsschutz.", "Sie dürfen Kollegen abmahnen.", "Sie werden von der IHK bestellt.", "Sie unterstützen den Arbeitgeber ehrenamtlich und machen auf Gefahren aufmerksam, haben aber keine Weisungsbefugnis."], r: [3],
        w: "§ 22 SGB VII: Sicherheitsbeauftragte помогают работодателю, проверяют защитные устройства, указывают на опасности. Права приказывать у них нет, ответственность остаётся у работодателя; назначает их работодатель с участием Betriebsrat. С 2026 года обязательны с 50 работников." },
      { id: "wiso-as10", f: "Was gilt an einem Bildschirmarbeitsplatz? Kreuzen Sie alle richtigen an.",
        o: ["Der Bildschirm muss frei von störenden Reflexionen und Blendungen sein.", "Die Arbeit am Bildschirm wird durch Pausen oder andere Tätigkeiten unterbrochen.", "Der Arbeitgeber bietet eine Untersuchung der Augen an.", "Der Beschäftigte muss eine Bildschirmbrille immer selbst bezahlen."], r: [0, 1, 2],
        w: "ArbStättV (Anhang 6): экран без бликов, работа прерывается паузами или другой деятельностью. ArbMedVV: работодатель предлагает обследование глаз, а нужные специальные очки для монитора предоставляет сам." },
      { id: "wiso-as11", f: "Auf einem Netzteil ist das Symbol „zwei Quadrate ineinander“. Was bedeutet das?",
        o: ["Schutzklasse I: Gerät mit Schutzleiter", "Schutzklasse II: Schutzisolierung, kein Schutzleiter nötig", "Schutzklasse III: Schutzkleinspannung", "Das Gerät ist wasserdicht nach IP68."], r: [1],
        w: "Двойной квадрат — Schutzklasse II: двойная или усиленная изоляция. Класс I — защитный провод (заземление), класс III — безопасное малое напряжение." }
    ]
  });

  /* ============================================================ 9 Umwelt */
  T.push({
    id: "wiso-umwelt", titel: "Umweltschutz und Nachhaltigkeit im IT-Betrieb", ru: "Охрана окружающей среды и устойчивость в IT", teil: "WiSo",
    katalog: "AP2 03.04.01–07 (S. 32): Umweltbelastungen, Abfälle, Duales System, Immissionsschutz, Nachhaltigkeit, Ressourcen, Rechtsfolgen",
    links: [],
    quellen: [[GII + "krwg/__6.html", "Kreislaufwirtschaftsgesetz § 6: Abfallhierarchie"],
              [GII + "elektrog_2015/__17.html", "ElektroG § 17: Rücknahme durch den Handel, § 10 getrennte Erfassung"],
              ["https://www.umweltpakt.bayern.de/abfall/recht/bund/520/verpackdg-verpackungsrecht-durchfuehrungsgesetz", "Umweltpakt Bayern: Verpackungsrecht-Durchführungsgesetz (ersetzt seit August 2026 das VerpackG)"],
              ["https://www.blauer-engel.de/sites/default/files/2026-07/Factsheet%20DE-UZ215%20Ressourcen-%20und%20energieeffiziente%20Softwareprodukte.pdf", "Blauer Engel: ressourcen- und energieeffiziente Software (DE-UZ 215)"]],
    kurzRu: "IT тоже нагружает природу: электричество для серверов и устройств, бумага и тонер, электронный лом с ценными и ядовитыми веществами. Порядок обращения с отходами такой: не создавать → подготовить к повторному использованию → переработать → иначе использовать (например, сжечь с получением энергии) → утилизировать; электронику и батарейки нельзя выбрасывать в бытовой мусор, а личные данные с устройств перед сдачей удаляет сам владелец. Экологичные товары узнают по знакам вроде Blauer Engel, за нарушения грозят штраф, возмещение ущерба, а в тяжёлых случаях и уголовное наказание.",
    punkte: [
      ["Umweltbelastungen durch IT", "нагрузка IT на природу", "Strom für Rechenzentren, Server und Geräte, Papier und Toner, Elektroschrott mit wertvollen und giftigen Stoffen, Akkus in Notebooks und USV-Anlagen. Auch Software verbraucht unnötig Energie, wenn sie schlecht programmiert ist."],
      ["Energie sparen", "экономия энергии", "Geräte nach der Arbeit ausschalten statt Standby, Energiesparmodus nutzen, Server virtualisieren, effizient kühlen, Strom aus erneuerbaren Quellen beziehen. Beim Kauf auf das EU-Energielabel achten (Klassen A bis G)."],
      ["Papier und Druck", "бумага и печать", "Nur drucken, wenn es nötig ist, und dann doppelseitig und schwarz-weiß. Recyclingpapier mit dem Blauen Engel nutzen. Tonerkartuschen über Rücknahmesysteme zurückgeben oder nachfüllen lassen."],
      ["Abfallhierarchie", "иерархия обращения с отходами", "Die Rangfolge nach § 6 Kreislaufwirtschaftsgesetz: 1. Vermeidung, 2. Vorbereitung zur Wiederverwendung, 3. Recycling, 4. sonstige Verwertung (z. B. verbrennen und die Energie nutzen), 5. Beseitigung (Deponie)."],
      ["Elektroaltgeräte", "старая электроника", "Das Symbol durchgestrichene Mülltonne heißt: nicht in den Hausmüll. Rückgabe kostenlos beim Wertstoffhof oder im Handel. Händler mit mindestens 400 m² Verkaufsfläche für Elektrogeräte nehmen beim Kauf ein gleichartiges Altgerät zurück. Kleine Geräte bis 25 cm nehmen sie auch ohne Kauf zurück, höchstens 3 pro Geräteart (ElektroG). Online-Händler zählen ihre Lager- und Versandfläche."],
      ["Daten und Datenträger", "данные и носители", "Vor der Rückgabe muss der Besitzer selbst personenbezogene Daten löschen. Betriebe lassen Festplatten sicher löschen oder von zertifizierten Entsorgern vernichten, z. B. nach den Sicherheitsstufen der DIN 66399. Kabel und Metalle werden recycelt."],
      ["Batterien und Akkus", "батарейки и аккумуляторы", "Sie gehören nie in den Hausmüll: Es gibt Brandgefahr und Schadstoffe. Man gibt sie kostenlos im Handel oder an Sammelstellen zurück. Herausnehmbare Batterien nimmt man vorher aus dem Altgerät. Rechtsgrundlage (Stand 2026): EU-Batterieverordnung und Batterierecht-Durchführungsgesetz."],
      ["Verpackungen und duales System", "упаковка и дуальная система", "Hersteller von Verpackungen für private Endkunden beteiligen sich an einem dualen System und registrieren sich im Verpackungsregister LUCID. Gesammelt wird über die gelbe Tonne oder den gelben Sack. Seit August 2026 gilt dafür die EU-Verpackungsverordnung mit dem Verpackungsrecht-Durchführungsgesetz; vorher galt das Verpackungsgesetz."],
      ["Immissionsschutz", "защита от вредных воздействий", "Das Bundes-Immissionsschutzgesetz schützt Menschen und Umwelt vor Lärm, Luftverschmutzung und Erschütterungen. Technische Anleitungen wie die TA Lärm und die TA Luft nennen Grenzwerte für Anlagen."],
      ["Umweltzeichen", "экологические знаки", "Blauer Engel: Umweltzeichen der Bundesregierung seit 1978, z. B. für Recyclingpapier, Drucker, Computer und ressourcenschonende Software. EU Ecolabel (Euro-Blume): Umweltzeichen der EU. TCO Certified: Nachhaltigkeitszeichen für IT-Produkte. EU-Energielabel: Energieeffizienz von A bis G."],
      ["Nachhaltigkeit", "устойчивое развитие", "Heute so wirtschaften, dass auch künftige Generationen gut leben können. Drei Säulen: ökologisch (Umwelt), ökonomisch (Wirtschaft) und sozial (Menschen). Dazu gehören auch die Folgen für Pflanzen, Tiere und Lebensräume."],
      ["Nachhaltiger Einkauf", "устойчивые закупки", "Schon beim Einkauf und bei der Wahl der Lieferanten auf Energieverbrauch, Reparierbarkeit, lange Updates, Rücknahme und faire Herstellung achten. Geräte länger nutzen oder generalüberholt (refurbished) kaufen spart Ressourcen."],
      ["Roh-, Hilfs- und Betriebsstoffe", "сырьё, вспомогательные и эксплуатационные материалы", "Rohstoffe werden Hauptbestandteil des Produkts. Hilfsstoffe werden Nebenbestandteil, z. B. Schrauben oder Leim. Betriebsstoffe gehen nicht ins Produkt ein, z. B. Strom oder Schmiermittel. Gefährliche Stoffe kennzeichnen und getrennt lagern."],
      ["Rechtsfolgen bei Verstößen", "последствия нарушений", "Ordnungswidrigkeit: Bußgeld, z. B. bei falscher Entsorgung. Umweltstraftat: Geld- oder Freiheitsstrafe, z. B. bei Verschmutzung des Bodens oder unerlaubtem Umgang mit gefährlichen Abfällen. Dazu kommen Schadensersatz, Auflagen der Behörde und ein Imageschaden."]
    ],
    tabelle: { titel: "Umweltzeichen und Symbole erkennen",
      kopf: ["Zeichen", "Bedeutung", "Beispiel aus der IT"],
      zeilen: [
        ["Blauer Engel", "Umweltzeichen der Bundesregierung (seit 1978)", "Recyclingpapier, Drucker, Software"],
        ["EU Ecolabel (Euro-Blume)", "Umweltzeichen der EU", "Papier und viele andere Produktgruppen"],
        ["EU-Energielabel", "Pflichtangabe zur Energieeffizienz (A bis G)", "Monitore und Fernseher"],
        ["TCO Certified", "internationales Nachhaltigkeitszeichen für IT", "Monitore, Notebooks"],
        ["Durchgestrichene Mülltonne", "Gerät nicht in den Hausmüll (ElektroG)", "alle Elektro- und Elektronikgeräte"]
      ] },
    merke: "Vermeiden vor Wiederverwenden vor Recycling vor Verwerten vor Beseitigen. Elektrogeräte und Batterien nie in den Hausmüll, Daten vorher löschen. Blauer Engel = Umweltzeichen der Bundesregierung. Nachhaltigkeit hat drei Säulen: ökologisch, ökonomisch, sozial.",
    quiz: [
      { id: "wiso-um1", f: "Welche Reihenfolge der Abfallhierarchie nach dem Kreislaufwirtschaftsgesetz ist richtig? (höchste Priorität zuerst)",
        o: ["Recycling → Vermeidung → Beseitigung → Wiederverwendung → sonstige Verwertung", "Vermeidung → Wiederverwendung → Recycling → sonstige Verwertung → Beseitigung", "Beseitigung → Recycling → Vermeidung → sonstige Verwertung → Wiederverwendung", "Wiederverwendung → Beseitigung → Vermeidung → Recycling → sonstige Verwertung"], r: [1],
        w: "§ 6 KrWG: лучше всего не создавать отходы; дальше — подготовка к повторному использованию, переработка, иное использование (например, сжигание с получением энергии), и только в конце — утилизация." },
      { id: "wiso-um2", f: "Ein Betrieb entsorgt alte Notebooks. Was ist richtig? Kreuzen Sie alle richtigen an.",
        o: ["Vorher personenbezogene Daten sicher löschen oder die Datenträger vernichten lassen", "Die Geräte getrennt vom Hausmüll abgeben, z. B. an einen zertifizierten Entsorger", "Kaputte Geräte in den Restmüll werfen", "Herausnehmbare Akkus im Gerät lassen"], r: [0, 1],
        w: "Электронику сдают отдельно от бытового мусора (ElektroG); удалить данные — ответственность владельца. Батареи, которые можно вынуть без разрушения, вынимают перед сдачей (§ 10 ElektroG)." },
      { id: "wiso-um3", f: "Ein Elektronikmarkt hat 1.000 m² Verkaufsfläche für Elektrogeräte. Ein Kunde möchte eine alte Computermaus (10 cm) abgeben, ohne etwas zu kaufen. Was gilt?",
        o: ["Der Markt darf die Maus nur zurücknehmen, wenn der Kunde eine neue kauft.", "Der Markt darf eine Gebühr von 5 € verlangen.", "Der Markt muss nichts zurücknehmen.", "Der Markt muss die Maus kostenlos zurücknehmen (kleine Geräte bis 25 cm, höchstens 3 pro Geräteart)."], r: [3],
        w: "§ 17 ElektroG: магазины с площадью для электроники от 400 м² бесплатно принимают мелкие приборы (до 25 см) и без покупки, до 3 штук одного вида; крупные — при покупке похожего нового прибора." },
      { id: "wiso-um4", f: "Welches Zeichen ist das Umweltzeichen der Bundesregierung?",
        o: ["Der Blaue Engel", "Das CE-Zeichen", "Das GS-Zeichen", "Der Grüne Punkt"], r: [0],
        w: "Blauer Engel — государственный экологический знак Германии с 1978 года. CE и GS — знаки соответствия и безопасности, а не экологии; Grüner Punkt — марка системы сбора упаковки, а не знак экологичного товара." },
      { id: "wiso-um5", f: "Welche Maßnahme spart im Büro am direktesten Energie?",
        o: ["Alle E-Mails ausdrucken und abheften", "Rechner und Monitore nach Feierabend ganz ausschalten statt im Standby zu lassen", "Einen Bildschirmschoner mit Animation nutzen", "Mehr Geräte im Standby betreiben"], r: [1],
        w: "Standby тоже потребляет ток. Анимированная заставка энергию не экономит — экономят выключение экрана и режим сна." },
      { id: "wiso-um6", f: "Was gehört zu den drei Säulen der Nachhaltigkeit? Kreuzen Sie alle richtigen an.",
        o: ["Ökologisch", "Ökonomisch", "Sozial", "Militärisch"], r: [0, 1, 2],
        w: "Три опоры устойчивого развития: экология, экономика и социальная сфера." },
      { id: "wiso-um7", f: "Auf einem Notebook ist eine durchgestrichene Mülltonne abgebildet. Was bedeutet das?",
        o: ["Das Gerät ist aus recyceltem Material.", "Das Gerät ist besonders energiesparend.", "Das Gerät darf nicht über den Hausmüll entsorgt werden.", "Das Gerät enthält keinen Akku."], r: [2],
        w: "Перечёркнутый мусорный бак (ElektroG) — сдавать отдельно: в пункт приёма (Wertstoffhof) или в магазин." },
      { id: "wiso-um8", f: "Was zählt in einem Betrieb zu den Betriebsstoffen?",
        o: ["Die Platine, die in ein Gerät eingebaut wird", "Strom für die Server", "Die Schrauben, die das Gehäuse halten", "Das Gehäuse eines Rechners"], r: [1],
        w: "Betriebsstoffe не входят в продукт (электричество, смазка). Основные части продукта (плата, корпус) — Rohstoffe, мелкие части (винты) — Hilfsstoffe." },
      { id: "wiso-um9", f: "Ein Unternehmen lagert alte Bleiakkus aus einer USV-Anlage ungesichert im Hof. Säure läuft in den Boden. Welche Folgen sind möglich? Kreuzen Sie alle richtigen an.",
        o: ["Bußgeld oder Strafe für das Unternehmen bzw. die Verantwortlichen", "Schadensersatz und die Pflicht, den Boden zu sanieren", "Ein Imageschaden", "Eine Belohnung durch das Umweltamt"], r: [0, 1, 2],
        w: "Последствия нарушений: штраф (Ordnungswidrigkeit) или уголовное наказание (загрязнение почвы — Straftat), возмещение ущерба и очистка, предписания властей и потеря репутации." },
      { id: "wiso-um10", f: "Welche Aussage zum dualen System der Verpackungsentsorgung trifft zu?",
        o: ["Es sammelt nur Elektroschrott.", "Es ist für Sondermüll aus Betrieben zuständig.", "Es ist eine Steuer, die jeder Bürger auf Verpackungen zahlt.", "Es organisiert die Sammlung und Verwertung von Verkaufsverpackungen privater Haushalte, z. B. über die gelbe Tonne."], r: [3],
        w: "Дуальная система (жёлтый мешок или бак) собирает и перерабатывает упаковку частных потребителей. Производители упаковки платят системе и регистрируются в реестре LUCID." }
    ]
  });

  /* =========================================================== 10 Digital */
  T.push({
    id: "wiso-digital", titel: "Digitale Zusammenarbeit: Sicherheit, Datenschutz, Vielfalt", ru: "Цифровое сотрудничество: безопасность, защита данных, разнообразие", teil: "WiSo",
    katalog: "AP2 03.03.08 (S. 31) und 03.05.01–03 (S. 33): Informationssicherheit, Datenschutz, DSGVO, BSI, TOM, sichere Kommunikation, Social Media, Social Engineering, Diversity, Compliance",
    links: [],
    quellen: [["https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679", "Datenschutz-Grundverordnung (DSGVO), v. a. Art. 5, 15–21, 32, 33, 83"],
              [GII + "bdsg_2018/__38.html", "BDSG § 38: Datenschutzbeauftragter ab 20 Personen"],
              [GII + "agg/", "Allgemeines Gleichbehandlungsgesetz (AGG) §§ 1, 11, 13, 15, 22"],
              [GII + "hinschg/__12.html", "Hinweisgeberschutzgesetz § 12: interne Meldestelle"],
              [GII + "kunsturhg/__22.html", "Kunsturhebergesetz § 22: Recht am eigenen Bild"]],
    kurzRu: "Информационная безопасность защищает все данные фирмы, а защита данных (DSGVO) — именно персональные данные людей; главные цели — конфиденциальность, целостность, доступность и подлинность. Часто атакуют не технику, а людей: социальная инженерия (фишинг, звонок «из поддержки») давит на авторитет и срочность, поэтому пароли никому не сообщают, а подозрительные случаи сразу передают в службу IT-безопасности. В команде важны уважение и разнообразие (Diversity): закон AGG запрещает дискриминацию по шести признакам, а соблюдение законов и внутренних правил фирмы называют Compliance.",
    punkte: [
      ["Informationssicherheit und Datenschutz", "информационная безопасность и защита данных", "Informationssicherheit schützt alle Informationen des Unternehmens, auch Baupläne oder Quellcode. Datenschutz schützt Menschen: ihre personenbezogenen Daten und ihr Recht, selbst darüber zu bestimmen (DSGVO, BDSG)."],
      ["Schutzziele", "цели защиты", "Vertraulichkeit: Nur Berechtigte sehen die Daten. Integrität: Die Daten sind vollständig und unverändert. Verfügbarkeit: Daten und Systeme sind nutzbar, wenn man sie braucht. Authentizität: Absender und Daten sind echt."],
      ["Grundsätze der DSGVO", "принципы DSGVO", "Daten rechtmäßig und transparent verarbeiten. Nur für einen festgelegten Zweck (Zweckbindung). So wenig Daten wie möglich (Datenminimierung). Richtig halten und nicht länger als nötig speichern. Sicher verarbeiten — und das nachweisen können (Rechenschaftspflicht)."],
      ["Rechte der Betroffenen", "права человека, чьи это данные", "Auskunft, Berichtigung, Löschung („Recht auf Vergessenwerden“), Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch."],
      ["Datenpanne", "утечка данных", "Bei einer Datenpanne (z. B. Kundendaten gestohlen) meldet der Verantwortliche sie unverzüglich der Aufsichtsbehörde, möglichst innerhalb von 72 Stunden. Keine Meldung ist nötig, wenn voraussichtlich kein Risiko für Menschen besteht. Bei hohem Risiko informiert er auch die Betroffenen. Bußgelder: bis 20 Mio. € oder 4 % des weltweiten Jahresumsatzes."],
      ["Datenschutzbeauftragter", "уполномоченный по защите данных", "Er ist Pflicht, wenn in der Regel mindestens 20 Personen ständig personenbezogene Daten automatisiert verarbeiten (§ 38 BDSG). Er berät und kontrolliert und bekommt dabei keine Weisungen."],
      ["BSI", "федеральное ведомство по информационной безопасности", "Das Bundesamt für Sicherheit in der Informationstechnik in Bonn ist die Cybersicherheitsbehörde des Bundes. Es warnt vor Sicherheitslücken und berät Behörden, Unternehmen und Bürger. Es gibt den IT-Grundschutz und die BSI-Standards heraus: 200-1 Managementsystem, 200-2 Vorgehen, 200-3 Risikoanalyse, 200-4 Notfallmanagement."],
      ["Technische und organisatorische Maßnahmen (TOM)", "технические и организационные меры", "Technisch: Verschlüsselung, Backup, Firewall, Zugriffsrechte, Protokollierung. Organisatorisch: Regeln, Schulungen, Vier-Augen-Prinzip, Besucherregelung, aufgeräumter Schreibtisch (Clean Desk). Die Grundlage ist das IT-Sicherheitskonzept des Betriebs."],
      ["Social Engineering", "социальная инженерия", "Angreifer manipulieren Menschen statt Technik. Sie nutzen Hilfsbereitschaft, Autorität, Zeitdruck oder Neugier. Beispiele: Phishing-Mail, Anruf vom angeblichen IT-Support, CEO-Fraud („Überweisen Sie sofort …“), ein gefundener USB-Stick. Schutz: Schulungen, Rückruf über eine bekannte Nummer, nie Passwörter weitergeben, Vorfälle melden."],
      ["E-Mail und Netiquette", "этикет деловой переписки", "Kurz, höflich und mit klarem Betreff schreiben. An die Sicht des Empfängers denken. Bei Rundmails an Externe die Adressen ins BCC setzen, denn E-Mail-Adressen sind personenbezogene Daten. Vertrauliches nur verschlüsselt senden. Klären, wer wofür zuständig ist."],
      ["Social Media und Äußerungen", "соцсети и высказывания", "Meinungsfreiheit gilt. Beleidigungen des Arbeitgebers, verratene Geschäftsgeheimnisse oder Hetze können aber zu Abmahnung oder Kündigung führen. Keine Interna, Kundendaten oder Fotos aus dem Büro posten. Auch private Profile liefern Angreifern Informationen für Social Engineering."],
      ["Persönlichkeitsrechte und Urheberrecht", "права личности и авторское право", "Fotos von Personen nur mit ihrer Einwilligung veröffentlichen (Recht am eigenen Bild). Fremde Bilder, Texte und Code nur mit Erlaubnis oder passender Lizenz verwenden."],
      ["Vielfalt und AGG", "разнообразие и закон о равном обращении", "Diversity heißt: Unterschiede wie Alter, Herkunft, Geschlecht, Religion, Behinderung oder sexuelle Orientierung werden wertgeschätzt; gemischte Teams sind oft kreativer. Das AGG verbietet Benachteiligung wegen Rasse oder ethnischer Herkunft, Geschlecht, Religion oder Weltanschauung, Behinderung, Alter und sexueller Identität. Stellenanzeigen sind neutral (m/w/d; d = divers). Ansprüche macht man innerhalb von 2 Monaten schriftlich geltend."],
      ["Compliance und Ethik", "соблюдение правил и этика", "Compliance heißt: Gesetze und interne Regeln einhalten, z. B. Verhaltenskodex, Datenschutz, keine Bestechung. Betriebe ab 50 Beschäftigten brauchen eine interne Meldestelle für Hinweisgeber (Hinweisgeberschutzgesetz); Hinweisgeber sind vor Nachteilen geschützt. IT-Lösungen sollen die Würde aller Menschen achten: fair, barrierefrei, ohne Diskriminierung."]
    ],
    tabelle: { titel: "Schutzziel, Maßnahme, Gefahr",
      kopf: ["Schutzziel", "Maßnahme (TOM)", "Was kann passieren?"],
      zeilen: [
        ["Vertraulichkeit", "Verschlüsselung, Zugriffsrechte, Passwortregeln", "Fremde lesen Kundendaten"],
        ["Integrität", "Hashwerte, digitale Signatur, Protokollierung", "Daten werden unbemerkt verändert"],
        ["Verfügbarkeit", "Backup, USV, Redundanz, Notfallplan", "Server fällt aus, Ransomware"],
        ["Authentizität", "Zertifikate, Signatur, Zwei-Faktor-Anmeldung", "gefälschter Absender (Phishing)"]
      ] },
    merke: "Vertraulichkeit, Integrität, Verfügbarkeit, Authentizität. Datenpanne: möglichst innerhalb von 72 Stunden melden. Passwörter nie am Telefon nennen. Rundmail an Externe: BCC. AGG: sechs Merkmale, Frist 2 Monate.",
    quiz: [
      { id: "wiso-di1", f: "Ein Mitarbeiter bekommt einen Anruf: „Hier ist der IT-Support. Wir brauchen kurz Ihr Passwort für ein Update.“ Wie reagiert er richtig?",
        o: ["Er nennt das Passwort, weil es der Support ist.", "Er schickt das Passwort lieber per E-Mail.", "Er nennt das Passwort und ändert es danach.", "Er nennt das Passwort nicht, legt auf und meldet den Vorfall über die bekannte interne Nummer der IT-Sicherheit."], r: [3],
        w: "Классическая социальная инженерия: давление авторитетом и срочностью. Настоящая поддержка пароль не спрашивает. Не называть, перепроверить по известному номеру и сообщить." },
      { id: "wiso-di2", f: "Ein Server fällt aus. Die Kunden können zwei Tage lang nicht bestellen. Welches Schutzziel ist verletzt?",
        o: ["Vertraulichkeit", "Verfügbarkeit", "Integrität", "Authentizität"], r: [1],
        w: "Система недоступна, когда она нужна, — нарушена доступность (Verfügbarkeit). Меры: резервные копии, резервные системы, план действий при аварии." },
      { id: "wiso-di3", f: "Was unterscheidet Datenschutz von Informationssicherheit?",
        o: ["Datenschutz schützt personenbezogene Daten von Menschen; Informationssicherheit schützt alle Informationen des Unternehmens.", "Datenschutz gilt nur für Papierakten, Informationssicherheit nur für Computer.", "Beides ist dasselbe.", "Informationssicherheit gilt nur für Behörden."], r: [0],
        w: "Datenschutz (DSGVO) защищает людей и их персональные данные. Informationssicherheit защищает все данные фирмы, в том числе неперсональные (исходный код, планы), — и на бумаге, и в IT." },
      { id: "wiso-di4", f: "Ein Unternehmen bemerkt am Montagmorgen, dass Unbekannte Kundendaten kopiert haben. Was gilt nach der DSGVO?",
        o: ["Es erwähnt den Vorfall im nächsten Jahresbericht.", "Es meldet den Vorfall innerhalb von 4 Wochen dem BSI.", "Es meldet die Datenpanne unverzüglich, möglichst innerhalb von 72 Stunden, der Datenschutz-Aufsichtsbehörde.", "Eine Meldung ist nur nötig, wenn mehr als 1.000 Personen betroffen sind."], r: [2],
        w: "Art. 33 DSGVO: сообщить в надзорный орган по защите данных без промедления, по возможности в течение 72 часов после обнаружения (если есть риск для людей). При высоком риске уведомляют и самих пострадавших (Art. 34)." },
      { id: "wiso-di5", f: "Eine Mitarbeiterin schickt eine Einladung an 80 externe Kunden. Alle Adressen stehen im Feld „An“. Welche Aussage trifft zu?",
        o: ["Das ist die empfohlene Methode, damit jeder sieht, wer eingeladen ist.", "Das ist problematisch: Alle sehen die E-Mail-Adressen der anderen; besser BCC verwenden.", "E-Mail-Adressen sind keine personenbezogenen Daten.", "Das ist nur bei internen E-Mails ein Problem."], r: [1],
        w: "Адрес e-mail — персональные данные. Открытый список рассылки показывает их всем получателям — это возможное нарушение защиты данных. Для внешних рассылок — BCC (скрытая копия)." },
      { id: "wiso-di6", f: "Welche Merkmale schützt das Allgemeine Gleichbehandlungsgesetz (AGG)? Kreuzen Sie alle richtigen an.",
        o: ["Alter", "Behinderung", "Religion oder Weltanschauung", "Die Note im Abschlusszeugnis"], r: [0, 1, 2],
        w: "§ 1 AGG: раса или этническое происхождение, пол, религия или мировоззрение, инвалидность, возраст, сексуальная идентичность. Оценка в аттестате — не защищённый признак." },
      { id: "wiso-di7", f: "Eine Bewerberin wurde wegen ihres Alters abgelehnt. Bis wann muss sie einen Anspruch nach dem AGG schriftlich geltend machen?",
        o: ["Innerhalb von 3 Wochen", "Innerhalb von 3 Jahren", "Es gibt keine Frist.", "Innerhalb von 2 Monaten nach Zugang der Ablehnung"], r: [3],
        w: "§ 15 Abs. 4 AGG: в течение 2 месяцев и письменно (если тарифный договор не устанавливает другое). Срок начинается с получения отказа." },
      { id: "wiso-di8", f: "Was versteht man unter Compliance?",
        o: ["Die Einhaltung von Gesetzen und internen Regeln, z. B. Verhaltenskodex, Datenschutz und Antikorruption", "Ein Programm zur Komprimierung von Daten", "Die Pflicht, jedes Jahr die Rechtsform zu ändern", "Die Gewinnverteilung in einer OHG"], r: [0],
        w: "Compliance — соблюдение законов и внутренних правил (кодекс поведения, запрет взяток, защита данных). О нарушениях можно сообщать во внутренний пункт приёма сообщений (HinSchG, с 50 работников)." },
      { id: "wiso-di9", f: "Ein Kollege postet auf Instagram ein Foto aus dem Büro. Auf dem Bildschirm sind Kundendaten zu sehen, und eine Kollegin ist erkennbar, die nicht gefragt wurde. Welche Aussagen treffen zu? Kreuzen Sie alle richtigen an.",
        o: ["Kundendaten wurden unbefugt offengelegt; das ist ein Datenschutzverstoß.", "Die Kollegin hätte vorher einwilligen müssen (Recht am eigenen Bild).", "Das ist erlaubt, weil der Account privat ist.", "Fotos aus dem Büro sind für die Werbung immer Pflicht."], r: [0, 1],
        w: "Видимые данные клиентов — раскрытие персональных данных. Фото узнаваемого человека публикуют только с его согласия (§ 22 KUG). Частный аккаунт ничего не меняет; возможны предупреждение или увольнение." },
      { id: "wiso-di10", f: "Welche Maßnahme ist eine organisatorische Maßnahme (TOM)?",
        o: ["Festplattenverschlüsselung", "Eine Firewall", "Regelmäßige Schulungen zu Phishing", "Ein automatisches Backup"], r: [2],
        w: "Организационные меры — правила, обучение, распределение обязанностей, принцип четырёх глаз. Шифрование, firewall и backup — технические меры." },
      { id: "wiso-di11", f: "Welche Aufgabe hat das BSI?",
        o: ["Es verhängt Bußgelder nach der DSGVO gegen Unternehmen.", "Es ist eine private Firma für Antivirensoftware.", "Es ist die Cybersicherheitsbehörde des Bundes, warnt vor Sicherheitslücken und gibt den IT-Grundschutz heraus.", "Es korrigiert die Abschlussprüfungen der IHK."], r: [2],
        w: "BSI (Бонн) — федеральное ведомство по кибербезопасности: предупреждения, стандарты BSI 200-x, IT-Grundschutz, консультации. Штрафы по DSGVO назначают надзорные органы по защите данных федеральных земель." },
      { id: "wiso-di12", f: "Was gehört zu einer wertschätzenden Zusammenarbeit in einem interkulturellen Team? Kreuzen Sie alle richtigen an.",
        o: ["Unterschiedliche Sichtweisen anhören und ernst nehmen", "Feiertage und Gewohnheiten anderer Kulturen respektieren", "Witze über die Herkunft von Kollegen machen, um das Eis zu brechen", "Nur die Meinung der Mehrheit gelten lassen"], r: [0, 1],
        w: "Уважительное сотрудничество: выслушивать разные точки зрения, уважать культурные различия, ценить вклад каждого. Шутки о происхождении могут быть дискриминацией (AGG)." }
    ]
  });

  /* ======================================================================
     Einordnen: als eigener Block ans Ende der Liste (hinter alle GA-Themen,
     auch hinter gen/lernen-katalog-daten.js). Zweimal geladen: ersetzen.
     ====================================================================== */
  const liste = Array.isArray(root.AP2_THEMEN) ? root.AP2_THEMEN : (root.AP2_THEMEN = []);
  T.forEach(t => {
    t.anzahl = (t.quiz || []).length;
    const alt = liste.findIndex(x => x && x.id === t.id);
    if (alt >= 0) liste[alt] = t; else liste.push(t);
  });

  root.AP2_THEMEN_WISO = T.map(t => t.id);
  if (typeof module === "object" && module.exports) module.exports = T;
})(typeof window !== "undefined" ? window : globalThis);
