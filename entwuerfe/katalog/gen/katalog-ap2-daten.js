/* ============================================================================
   gen/katalog-ap2-daten.js — Prüfungskatalog AP2 FIAE als Checkliste (Daten)
   ----------------------------------------------------------------------------
   Grundlage: Prüfungskatalog für die IHK-Abschlussprüfungen, Fachinformatiker/
   Fachinformatikerin Anwendungsentwicklung, 2. Auflage 2024 (ZPA Nord-West,
   Köln 10/2024), gilt für die AP2 ab Sommer 2025. Abgeglichen Seite für Seite
   mit den Bildern der Katalogseiten:
     AP2 01 (alle IT-Berufe) ....... Katalog S. 17–19 (PDF 19–21)
     AP2 02 (Anwendungsentwicklung)  Katalog S. 20–25 (PDF 22–27)
     AP2 03 (WiSo) ................. Katalog S. 26–33 (PDF 28–35)
     Anhang (Notationen, Beiblätter) Katalog S. 34–44 (PDF 36–46)
   Ein Eintrag = ein Themenkreis („02.04.18“ = Teil 02, Fragenkomplex 04,
   Themenkreis 18). Der Anhang hat keine Nummern im Katalog: hier „A.01“ …

   Wichtig: Titel und Stichworte sind EIGENE kurze Formulierungen, keine
   Abschrift des Katalogs. Sie sollen das Thema wiedererkennbar machen.

   Felder je Punkt:
     id, nr, s (Seite im Katalog), bereich ("AP2-01" | "AP2-02" | "WiSo" |
     "Anhang"), gruppe (Fragenkomplex, z. B. "02.04"), titel (deutsch), ru,
     stichworte, neu (neu in der 2. Auflage — NUR wenn die Übersicht der
     Änderungen es nennt UND es auf der Katalogseite steht), pruefung
     ("GA1" | "GA2" | "GA1+GA2" | "WiSo" | "keine" = nicht schriftlich;
     Einschätzung nach Raster S. 6 und Häufigkeit in den 20 GA, AP2_TRAINING),
     trainieren (höchstens 4 Ziele in der App), hinweis, luecke (was in der
     App fehlt).

   Link-Typen in `trainieren` (gen/katalog-ap2.js öffnet sie):
     quiz <Thema>          GENLERNEN.oeffnen(id)        AP2_THEMEN
     lernweg <Einheit>     GENLERNWEG.oeffnen(id)       AP2_LERNWEG
     praxis <Aufgabe>      GENPRAXIS.oeffnen(id)        AP2_PRAXIS
     satz <thema>          GENSATZ.starten(null,{themen:[thema]})  SATZ_POOL
     pruefung <Trainings-Id>  GENLERNWEG.oeffnen("@"+id)  AP2_TRAINING
     code [<Aufgabe>]      GENCODE.oeffnen(id)          AP2_CODE_AUFGABEN
     sql | algo | normal | operatoren   GENSQL / GENALGO / GENNORMAL / GENOPUEB
     diagramm <art>        Knopf im Diagramm-Trainer (index.html):
                           netzplan, gantt, aktivitaet, klasse, er
     bogen                 GENAZUBI.oeffnen(null) — Original-Bögen
   ========================================================================== */
"use strict";

(function (root) {
  /* ---- kurze Helfer für die Ziele ---- */
  const Q = id => ({ typ: "quiz", id });
  const L = id => ({ typ: "lernweg", id });
  const P = id => ({ typ: "praxis", id });
  const S = thema => ({ typ: "satz", id: thema });
  const A = id => ({ typ: "pruefung", id });
  const D = art => ({ typ: "diagramm", id: art });
  const C = id => (id ? { typ: "code", id } : { typ: "code" });
  const SQL = () => ({ typ: "sql" });
  const ALGO = () => ({ typ: "algo" });
  const NORMAL = () => ({ typ: "normal" });
  const BOGEN = () => ({ typ: "bogen" });

  const STRUKTOGRAMM = "Struktogramm и PAP во 2-м издании убраны. Контрольные структуры показывай псевдокодом или диаграммой активности (UML).";

  const BEREICHE = [
    { id: "AP2-01", titel: "AP2 · Teil 01: für alle IT-Berufe", ru: "AP2 · общая часть для всех IT-профессий (GA1/GA2)" },
    { id: "AP2-02", titel: "AP2 · Teil 02: Anwendungsentwicklung", ru: "AP2 · специализация Anwendungsentwicklung (GA1/GA2)" },
    { id: "WiSo", titel: "AP2 · Teil 03: Wirtschafts- und Sozialkunde", ru: "WiSo: экономика и социальные вопросы (60 минут)" },
    { id: "Anhang", titel: "Anhang: Notationen und Beiblätter", ru: "Приложение каталога: нотации и справочные листы" }
  ];

  /* Fragenkomplexe — eigene Kurztitel */
  const GRUPPEN = [
    { id: "01.01", bereich: "AP2-01", s: "17", titel: "Kunden informieren und beraten", ru: "Информировать и консультировать клиентов" },
    { id: "01.02", bereich: "AP2-01", s: "17", titel: "IT-Lösungen entwickeln und betreuen", ru: "Разработка и сопровождение IT-решений" },
    { id: "01.03", bereich: "AP2-01", s: "18", titel: "Qualität sichern und dokumentieren", ru: "Обеспечение качества" },
    { id: "01.04", bereich: "AP2-01", s: "19", titel: "IT-Sicherheit und Datenschutz umsetzen", ru: "IT-безопасность и защита данных" },
    { id: "02.01", bereich: "AP2-02", s: "20–21", titel: "IT-Systeme betreiben", ru: "Эксплуатация IT-систем" },
    { id: "02.02", bereich: "AP2-02", s: "21", titel: "Speicherlösungen einrichten", ru: "Системы хранения данных" },
    { id: "02.03", bereich: "AP2-02", s: "22", titel: "Softwarelösungen programmieren", ru: "Программирование решений" },
    { id: "02.04", bereich: "AP2-02", s: "23–24", titel: "Kundenspezifische Software konzipieren und umsetzen", ru: "Проектирование и разработка ПО под заказчика" },
    { id: "02.05", bereich: "AP2-02", s: "25", titel: "Softwarequalität sicherstellen", ru: "Качество программного обеспечения" },
    { id: "03.01", bereich: "WiSo", s: "26–28", titel: "Ausbildung, Arbeits- und Tarifrecht", ru: "Профобучение, трудовое и тарифное право" },
    { id: "03.02", bereich: "WiSo", s: "29", titel: "Aufbau und Organisation des Betriebs", ru: "Устройство и организация предприятия" },
    { id: "03.03", bereich: "WiSo", s: "30–31", titel: "Arbeitssicherheit und Gesundheitsschutz", ru: "Охрана труда и здоровья" },
    { id: "03.04", bereich: "WiSo", s: "32", titel: "Umweltschutz", ru: "Охрана окружающей среды" },
    { id: "03.05", bereich: "WiSo", s: "33", titel: "Digital vernetzt zusammenarbeiten", ru: "Совместная работа с цифровыми медиа" },
    { id: "A", bereich: "Anhang", s: "34–44", titel: "Notationen und Beiblätter im Anhang", ru: "Нотации и справочные листы из приложения" }
  ];

  const PUNKTE = [];
  const punkt = (nr, s, o) => {
    const gruppe = /^A\./.test(nr) ? "A" : nr.slice(0, 5);
    const g = GRUPPEN.find(x => x.id === gruppe);
    PUNKTE.push(Object.assign({
      id: "k2-" + nr.toLowerCase().replace(/\./g, "-"), nr, s: String(s), bereich: g ? g.bereich : "", gruppe,
      neu: false, trainieren: []
    }, o));
  };

  /* ===================================================================
     AP2 · Teil 01 — fachrichtungsübergreifend (Katalog S. 17–19)
     =================================================================== */
  punkt("01.01.01", 17, { titel: "Kundengespräche und Kommunikation", ru: "Разговор с клиентом и коммуникация",
    stichworte: ["aktives Zuhören", "Kommunikationsmodelle", "Chat, Telefon- und Videokonferenz", "Anfrage – Angebot – Auftrag", "Kundenbedarf analysieren"],
    pruefung: "keine",
    hinweis: "По каталогу этот пункт не входит в письменный экзамен. Для GA1/GA2 его тренировать не нужно." });
  punkt("01.01.02", 17, { titel: "Kundenbeziehungen rechtssicher gestalten", ru: "Отношения с клиентом: право и правила",
    stichworte: ["BGB, HGB", "UWG (unlauterer Wettbewerb)", "AGB", "Compliance, Regelkonformität", "CRM"],
    pruefung: "GA1", trainieren: [S("Recht"), Q("anforderungen")],
    luecke: "Нет материала по UWG, AGB, Compliance и CRM. В Kurzfragen «Recht» — только Kaufvertrag, дефекты товара, Werk-/Dienstvertrag, лицензии." });
  punkt("01.01.03", 17, { titel: "Daten und Ergebnisse präsentieren", ru: "Представлять данные и результаты",
    stichworte: ["Präsentationstechnik", "Diagrammarten", "Visualisierung", "Tabellenkalkulation", "Corporate Identity"],
    pruefung: "GA1",
    luecke: "Нет материала. Только пункт «Corporate Design» в теме «Эргономика ПО»." });

  punkt("01.02.01", 17, { titel: "Fehler finden und beheben: Debugging und Tests", ru: "Находить и исправлять ошибки: отладка и тесты",
    stichworte: ["Debugging, Breakpoint", "statische und dynamische Tests", "Black-Box, White-Box, Review", "Extremwerte, Testdaten", "Komponenten-, Integrations-, Systemtest", "Versionsverwaltung"],
    pruefung: "GA1+GA2", trainieren: [Q("tests"), L("tests"), P("test-trace"), A("ga2-test")] });
  punkt("01.02.02", 17, { titel: "Algorithmen, UML und Bildschirmmasken entwerfen", ru: "Алгоритмы, UML и макеты экранов",
    stichworte: ["Kontrollstrukturen als Aktivitätsdiagramm oder Pseudocode", "Use-Case-, Klassen-, Aktivitätsdiagramm", "Bildschirmmasken", "Softwareergonomie, Barrierefreiheit"],
    pruefung: "GA1+GA2", trainieren: [L("schleifen"), C(), D("aktivitaet"), A("ga1-uml")],
    hinweis: STRUKTOGRAMM });
  punkt("01.02.03", 17, { titel: "Datenbanken modellieren und anlegen", ru: "Моделировать и создавать базы данных",
    stichworte: ["relational und NoSQL", "Datentypen (BLOB, Geokoordinaten …)", "Anomalien, Redundanzen", "Normalformen 1–3", "ER-Modell, Kardinalitäten", "referenzielle Integrität, Lösch-/Aktualisierungsweitergabe", "Primär- und Fremdschlüssel", "SQL (Beiblatt im Anhang)", "OpenData, API"],
    neu: true, pruefung: "GA1+GA2", trainieren: [NORMAL(), SQL(), Q("integritaet"), A("ga1-db")],
    luecke: "Нет материала: NoSQL, типы данных (BLOB, геокоординаты), OpenData." });

  punkt("01.03.01", 18, { titel: "Qualität prüfen: Prüfverfahren und Tests", ru: "Проверка качества: методы контроля и тесты",
    stichworte: ["Parität, Redundanz", "Black-/White-Box, Review", "Extremwerttest, Testdaten", "Last- und Performancetest", "Debugging, Ablaufverfolgung"],
    neu: true, pruefung: "GA1+GA2", trainieren: [Q("testen2"), Q("qualitaet"), Q("tests"), P("test-trace")] });
  punkt("01.03.02", 18, { titel: "Zielerreichung messen: PDCA, Soll-Ist, Protokolle", ru: "Измерять достижение целей: PDCA, план-факт, протоколы",
    stichworte: ["PDCA, KVP", "Kennzahlen", "Soll-Ist-Vergleich, Abweichung berechnen", "Testdatengenerator", "Testprotokoll, Abnahmeprotokoll"],
    pruefung: "GA1", trainieren: [Q("qualitaet"), Q("betrieb"), Q("testen2"), S("Qualität & Test")],
    luecke: "Kennzahlen в QM-процессе отдельно не разобраны; расчёт отклонения план-факт — одна Kurzfrage (k34)." });

  punkt("01.04.01", 19, { titel: "Schadenspotenzial von Sicherheitsvorfällen einschätzen", ru: "Оценить возможный ущерб от инцидентов",
    stichworte: ["Vertraulichkeit, Integrität, Verfügbarkeit", "Imageschaden", "wirtschaftlicher Schaden", "Datenverlust"],
    pruefung: "GA1", trainieren: [Q("bedrohungen"), Q("krypto"), S("IT-Sicherheit")] });
  punkt("01.04.02", 19, { titel: "Vorbeugen gegen Datendiebstahl, Ransomware, Phishing", ru: "Профилактика: кража данных, вымогатели, фишинг",
    stichworte: ["Datendiebstahl", "Ransomware (digitale Erpressung)", "Phishing, Identitätsdiebstahl", "präventive Maßnahmen"],
    pruefung: "GA1", trainieren: [Q("bedrohungen"), L("sicherheit"), P("ga1-sicherheit"), A("ga1-sicher")] });
  punkt("01.04.03", 19, { titel: "Sicherheitskriterien: Grundschutz, Security by Design", ru: "Критерии безопасности: Grundschutz, Security by Design",
    stichworte: ["Richtschnur für Entwickler", "IT-Grundschutz (BSI)", "Security by Design", "Sicherheitsprodukt auswählen"],
    pruefung: "GA1", trainieren: [Q("bedrohungen"), S("IT-Sicherheit")] });
  punkt("01.04.04", 19, { titel: "Kunden zur IT-Sicherheit beraten: Risiken und Angriffe", ru: "Консультировать по IT-безопасности: риски и атаки",
    stichworte: ["privat, Unternehmen, öffentliche Hand", "funktionale und Qualitätsanforderungen", "TOM", "Rahmenbedingungen: technisch, organisatorisch, rechtlich, ethisch", "Risikoanalyse", "Man-in-the-Middle, SQL-Injection, DDoS"],
    neu: true, pruefung: "GA1+GA2", trainieren: [Q("bedrohungen"), S("IT-Sicherheit"), Q("integritaet"), A("ga1-sicher")] });
  punkt("01.04.05", 19, { titel: "Werkzeuge zur Sicherheitsprüfung", ru: "Инструменты проверки безопасности",
    stichworte: ["Penetrationstest", "Schwachstellenanalyse", "Device Security Check", "Identity & Access Management"],
    pruefung: "GA1", trainieren: [Q("bedrohungen"), S("IT-Sicherheit")],
    luecke: "Device Security Check отдельно не разобран." });
  punkt("01.04.06", 19, { titel: "TOM prüfen: Zutritt, Zugang, Zugriff, Protokolle", ru: "Проверить TOM: помещение, система, данные, журналы",
    stichworte: ["Zutrittskontrolle (Alarmanlage, Video, Besucherausweis)", "Zugangskontrolle (Sperrbildschirm, Biometrie, Chipkarte)", "Zugriffskontrolle (Verschlüsselung, Löschen, Rollenkonzept)", "Log Management", "Compliance Reports"],
    neu: true, pruefung: "GA1", trainieren: [Q("auth"), Q("bedrohungen"), S("IT-Sicherheit"), S("Datenschutz")],
    luecke: "Log Management и Compliance Reports отдельно не разобраны." });

  /* ===================================================================
     AP2 · Teil 02 — Anwendungsentwicklung (Katalog S. 20–25)
     =================================================================== */
  punkt("02.01.01", 20, { titel: "Schichtenmodelle OSI und TCP/IP", ru: "Модели уровней OSI и TCP/IP",
    stichworte: ["IPv4/IPv6", "MAC", "Routing, Switching", "ARP", "TCP/UDP"],
    pruefung: "GA1", trainieren: [Q("netz"), S("Netze & Dienste")] });
  punkt("02.01.02", 20, { titel: "Netzwerkkomponenten vergleichen", ru: "Сравнить сетевые компоненты",
    stichworte: ["Switch", "Bridge", "Router", "Firewall"],
    neu: true, pruefung: "GA1", trainieren: [Q("netz")] });
  punkt("02.01.03", 20, { titel: "Netzwerkkonzepte und Infrastruktur", ru: "Сетевые концепции и инфраструктура",
    stichworte: ["LAN, WAN, MAN, GAN", "Übertragungsrate", "RADIUS, Kerberos", "Verschlüsselung, VPN", "strukturierte Verkabelung", "VLAN", "PAN, WLAN, Mesh, Bluetooth", "Topologie, Netzwerkplan"],
    neu: true, pruefung: "GA1", trainieren: [Q("netz"), S("Netze & Dienste")],
    luecke: "Нет материала: структурированная кабельная система, расчёт скорости передачи. PAN/Mesh/Bluetooth — только кратко." });
  punkt("02.01.04", 20, { titel: "Peer-to-Peer oder Client-Server", ru: "Peer-to-Peer или клиент-сервер",
    stichworte: ["Dateifreigabe: SMB/CIFS", "Datenabruf: HTTP, ODBC"],
    neu: true, pruefung: "GA1", trainieren: [Q("architektur"), Q("netz"), S("Softwarearchitektur")] });
  punkt("02.01.05", 20, { titel: "Übertragungsprotokolle einsetzen", ru: "Протоколы передачи данных",
    stichworte: ["TCP/UDP", "HTTP/HTTPS"],
    pruefung: "GA1", trainieren: [Q("netz"), Q("rest"), Q("krypto"), S("Netze & Dienste")] });
  punkt("02.01.06", 20, { titel: "Standorte verbinden: VPN und Tunnel", ru: "Связь между площадками: VPN и туннели",
    stichworte: ["VPN-Modelle", "Tunneling", "IPsec"],
    pruefung: "GA1", trainieren: [Q("netz"), S("Netze & Dienste")] });
  punkt("02.01.07", 20, { titel: "Netzwerkdienste DNS, DHCP, Proxy", ru: "Сетевые службы DNS, DHCP, Proxy",
    stichworte: ["DNS", "DHCP", "Proxy"],
    pruefung: "GA1", trainieren: [Q("netz"), S("Netze & Dienste")] });
  punkt("02.01.08", 20, { titel: "Verfügbarkeit von Diensten beurteilen", ru: "Оценить требования к доступности сервисов",
    stichworte: ["Echtzeitkommunikation", "Mail- und Webserver", "Groupware", "Datenbanken"],
    pruefung: "GA1", trainieren: [Q("betrieb"), S("IT-Betrieb")],
    hinweis: "Load Balancing в текущем каталоге отдельно не назван (по обзорам 2-го издания — убран).",
    luecke: "Требования отдельных сервисов (почта, Groupware, связь в реальном времени) не разобраны — есть общая тема доступности и SLA." });
  punkt("02.01.09", 20, { titel: "Risiken und Ausfallwahrscheinlichkeit", ru: "Риски и вероятность отказа",
    stichworte: ["PDCA-Zyklus", "MTBF, AFR", "Notfallkonzept, Disaster Recovery"],
    pruefung: "GA1", trainieren: [Q("betrieb"), S("IT-Betrieb")] });
  punkt("02.01.10", 21, { titel: "Betrieb absichern: USV, Redundanz, RAID, Backup", ru: "Надёжная работа: ИБП, резервирование, RAID, бэкап",
    stichworte: ["USV", "Hardware-Redundanz", "RAID", "Backup"],
    pruefung: "GA1", trainieren: [Q("speicher"), S("IT-Betrieb"), S("IT-Sicherheit")],
    hinweis: "По вводной странице каталога RAID (как и SQL) теперь спрашивают только во второй части (AP2)." });
  punkt("02.01.11", 21, { titel: "Monitoring einrichten und auswerten", ru: "Настроить и читать мониторинг",
    stichworte: ["Monitoringdaten festlegen", "SNMP, S.M.A.R.T.", "Systemlast", "Predictive Maintenance", "Engpässe, Schwellwerte"],
    neu: true, pruefung: "GA1", trainieren: [Q("betrieb"), S("IT-Betrieb")],
    luecke: "Анализ нагрузки системы (Systemlastanalyse) отдельно не разобран." });
  punkt("02.01.12", 21, { titel: "Auf Monitoring reagieren: SLA, Tickets, Eskalation", ru: "Реагировать на мониторинг: SLA, тикеты, эскалация",
    stichworte: ["SOP", "SLA, Service Level 1–3", "Incident Management, Ticketsystem", "Eskalationsstufen"],
    neu: true, pruefung: "GA1", trainieren: [Q("betrieb"), S("IT-Betrieb"), Q("anforderungen")] });
  punkt("02.01.13", 21, { titel: "Handbücher und Dokumentation erstellen", ru: "Руководства и документация",
    stichworte: ["Programmdokumentation", "Konfigurationsdokumentation", "Checklisten", "Handbuch für Benutzer und Systembetreuer"],
    neu: true, pruefung: "GA1", trainieren: [Q("betrieb")],
    luecke: "Только краткий пункт «Dokumentation» в теме «Эксплуатация»; упражнения на составление документации нет." });

  punkt("02.02.01", 21, { titel: "TOM: Berechtigungen und Zuständigkeiten", ru: "TOM: права доступа и ответственность",
    stichworte: ["technische und organisatorische Maßnahmen", "Berechtigungskonzept", "Zugang, Zutritt, Zugriff"],
    neu: true, pruefung: "GA1", trainieren: [Q("auth"), Q("bedrohungen"), S("Datenschutz"), P("ga1-sicherheit")] });
  punkt("02.02.02", 21, { titel: "Physische Absicherung", ru: "Физическая защита",
    stichworte: ["Zugang zu Gebäude, Serverraum, Schrank", "Elementarrisiken: Feuer, Hochwasser"],
    pruefung: "GA1", trainieren: [Q("auth"), S("IT-Sicherheit")],
    luecke: "Элементарные риски (пожар, наводнение) отдельно не разобраны." });
  punkt("02.02.03", 21, { titel: "Softwareseitige Absicherung", ru: "Программная защита",
    stichworte: ["Benutzer- und Zugriffsverwaltung", "Firewall, Webfilter", "Port Security", "Verschlüsselung (z. B. BitLocker)"],
    pruefung: "GA1", trainieren: [Q("auth"), Q("krypto"), Q("netz"), S("IT-Sicherheit")],
    luecke: "Webfilter, Port Security и шифрование дисков (BitLocker) отдельно не разобраны." });
  punkt("02.02.04", 21, { titel: "Service- und Liefermodelle wählen", ru: "Модели поставки: on-premises, облако, SaaS/IaaS/PaaS",
    stichworte: ["On Premises", "Cloud", "SaaS, IaaS, PaaS"],
    pruefung: "GA1", trainieren: [Q("speicher"), S("Software"), P("ga1-kosten"), L("wirtschaft")] });
  punkt("02.02.05", 21, { titel: "Daten aus verschiedenen Quellen zusammenführen", ru: "Объединять данные из разных источников",
    stichworte: ["XML, JSON, CSV", "Data Lake"],
    pruefung: "GA1+GA2", trainieren: [Q("formate"), S("Datenformate")],
    hinweis: "Data Warehouse в текущем каталоге не назван (по обзорам — убран); назван Data Lake.",
    luecke: "Data Lake в приложении не разобран." });
  punkt("02.02.06", 21, { titel: "Speichernetze und Protokolle: NAS, SAN, iSCSI", ru: "Сетевые хранилища и протоколы: NAS, SAN, iSCSI",
    stichworte: ["NAS", "SAN", "iSCSI", "SMB, NFS", "Ethernet, Fibre Channel"],
    neu: true, pruefung: "GA1", trainieren: [Q("speicher"), Q("netz"), S("IT-Betrieb")] });

  punkt("02.03.01", 22, { titel: "Softwareanforderungen und Qualitätsmerkmale", ru: "Требования к ПО и характеристики качества",
    stichworte: ["Änderbarkeit, Wartbarkeit", "Benutzbarkeit", "Effizienz", "Funktionalität", "Übertragbarkeit", "Zuverlässigkeit", "Normen (ISO/IEC 25010)"],
    neu: true, pruefung: "GA1", trainieren: [Q("qualitaet"), Q("anforderungen"), S("Qualität & Test"), A("ga1-test")] });
  punkt("02.03.02", 22, { titel: "Mit Modellen planen: ERM, UML, Mockup", ru: "Планировать с моделями: ERM, UML, макет",
    stichworte: ["ER-Modell", "relationales Modell", "UML: Klassen, Aktivität, Anwendungsfall, Sequenz, Zustand", "Mockup"],
    pruefung: "GA1+GA2", trainieren: [L("uml"), P("uml-usecase"), NORMAL(), A("ga1-uml")] });
  punkt("02.03.03", 22, { titel: "Schnittstellen festlegen und nutzen", ru: "Определять и использовать интерфейсы",
    stichworte: ["Austauschformate XML, JSON", "SQL", "API, z. B. REST"],
    pruefung: "GA1+GA2", trainieren: [L("api"), P("ga1-api"), Q("rest"), Q("formate")] });
  punkt("02.03.04", 22, { titel: "Programmiersprache begründet auswählen", ru: "Обоснованно выбрать язык программирования",
    stichworte: ["Performance, Speicherbedarf", "Portabilität", "Frameworks, Bibliotheken", "Entwicklungsumgebung (IDE)", "Know-how im Team"],
    pruefung: "GA1", trainieren: [Q("werkzeuge"), S("Programmierung")],
    luecke: "Критерии выбора языка разобраны кратко (тема «Парадигмы и инструменты»)." });
  punkt("02.03.05", 22, { titel: "Algorithmen als Programm- oder Pseudocode", ru: "Алгоритм в виде кода или псевдокода",
    stichworte: ["allgemein verständlicher Pseudocode", "nicht 1:1 kompilierbar", "Syntaxfehler werden toleriert", "Einrückung zeigt die Kontrollstrukturen"],
    pruefung: "GA2", trainieren: [C(), L("schleifen"), P("algo-return"), A("ga2-algo")],
    hinweis: STRUKTOGRAMM });
  punkt("02.03.06", 22, { titel: "Cyber-physische Systeme", ru: "Киберфизические системы",
    stichworte: ["CPS-Software", "Sensoren und Aktoren auswählen", "Bibliotheken nutzen", "Abfragerhythmus planen", "Zugriff auf Sensoren und Aktoren"],
    neu: true, pruefung: "GA1+GA2", trainieren: [Q("cps"), S("Cyber-physische Systeme")] });
  punkt("02.03.07", 22, { titel: "Abläufe mit Skripten automatisieren", ru: "Автоматизация задач скриптами",
    stichworte: ["Shell: PowerShell, Bash", "Python", "automatisieren und überwachen"],
    pruefung: "GA2", trainieren: [Q("skripte"), S("Programmierung")] });
  punkt("02.03.08", 22, { titel: "Testvorgehen: Unit-Test, E2E, TDD", ru: "Подход к тестам: unit, E2E, TDD",
    stichworte: ["Black-/White-Box", "print-Debugging", "TDD", "Unit-Test", "E2E-Test"],
    neu: true, pruefung: "GA1+GA2", trainieren: [Q("testen2"), Q("tests"), P("test-zweige"), S("Qualität & Test")] });

  punkt("02.04.01", 23, { titel: "Lasten- und Pflichtenheft", ru: "Lastenheft и Pflichtenheft",
    stichworte: ["Lastenheft", "Pflichtenheft"],
    pruefung: "GA1", trainieren: [Q("anforderungen"), L("anforderungen"), P("ga1-anforderung"), S("Projektmanagement")] });
  punkt("02.04.02", 23, { titel: "Vorgehensmodelle unterscheiden", ru: "Модели процесса разработки",
    stichworte: ["Wasserfallmodell", "Spiralmodell", "V-Modell", "agil: Scrum"],
    neu: true, pruefung: "GA1", trainieren: [Q("vorgehen"), S("Projektmanagement"), A("ga1-pm")] });
  punkt("02.04.03", 23, { titel: "Strukturierter Entwurf: Top-down, Bottom-up", ru: "Структурное проектирование: сверху вниз и снизу вверх",
    stichworte: ["Top-down-Entwurf", "Bottom-up-Entwurf", "Modularisierung"],
    pruefung: "GA1", trainieren: [Q("vorgehen"), Q("architektur")],
    luecke: "Разобрано кратко — только теория, без упражнения." });
  punkt("02.04.04", 23, { titel: "Objektorientierte Analyse und Entwurf", ru: "Объектно-ориентированный анализ и проектирование",
    stichworte: ["OOA, OOD", "Klassen und Beziehungen finden"],
    pruefung: "GA1+GA2", trainieren: [L("oop"), Q("oop"), D("klasse"), A("ga1-oop")] });
  punkt("02.04.05", 23, { titel: "Spezifikation, Datenmodell und Schnittstellen ableiten", ru: "Спецификация, модель данных и интерфейсы из требований",
    stichworte: ["Programmspezifikation", "Datenmodelle aus Anforderungen", "Schnittstellen festlegen", "Programmiersprache wählen"],
    pruefung: "GA1", trainieren: [L("anforderungen"), P("ga1-anforderung"), L("api"), Q("anforderungen")] });
  punkt("02.04.06", 23, { titel: "Programmierparadigmen", ru: "Парадигмы программирования",
    stichworte: ["strukturiert", "prozedural", "funktional", "objektorientiert", "Beispielsprachen"],
    pruefung: "GA1", trainieren: [Q("werkzeuge"), S("Programmierung")] });
  punkt("02.04.07", 23, { titel: "Entwicklungswerkzeuge passend auswählen", ru: "Инструменты разработки",
    stichworte: ["Editor, IDE", "Programmgenerator", "Compiler, Linker, Interpreter", "Debugger", "Testsoftware", "Versionsverwaltung"],
    pruefung: "GA1", trainieren: [Q("werkzeuge"), Q("git"), S("Programmierung")],
    luecke: "Programmgenerator отдельно не разобран." });
  punkt("02.04.08", 23, { titel: "Einsatzgebiete von Programmiersprachen", ru: "Где применяются языки программирования",
    stichworte: ["Einsatzbereiche", "Beispielsprachen"],
    pruefung: "GA1", trainieren: [Q("werkzeuge")],
    luecke: "Разобрано кратко (Java/C#, парадигмы)." });
  punkt("02.04.09", 23, { titel: "UML-Diagramme zeichnen", ru: "Рисовать UML-диаграммы",
    stichworte: ["Klassendiagramm", "Anwendungsfalldiagramm", "Zustandsdiagramm", "Aktivitätsdiagramm", "Sequenzdiagramm", "Notation im Anhang"],
    pruefung: "GA1+GA2", trainieren: [A("ga1-uml"), A("ga2-uml"), P("uml-zustand"), D("aktivitaet")] });
  punkt("02.04.10", 23, { titel: "Datenmodelle erstellen: ERM und relational", ru: "Модели данных: ER и реляционная",
    stichworte: ["ER-Modell", "relationales Modell"],
    pruefung: "GA1+GA2", trainieren: [D("er"), NORMAL(), A("ga1-db"), A("ga2-db")] });
  punkt("02.04.11", 23, { titel: "Normalisieren bis zur 3. Normalform", ru: "Нормализация до третьей нормальной формы",
    stichworte: ["1. Normalform", "2. Normalform", "3. Normalform"],
    pruefung: "GA1+GA2", trainieren: [NORMAL(), S("Daten"), A("ga2-db")] });
  punkt("02.04.12", 23, { titel: "Architektur- und Entwurfsmuster", ru: "Архитектурные шаблоны и паттерны проектирования",
    stichworte: ["Observer", "Singleton", "Factory", "MVC"],
    neu: true, pruefung: "GA1+GA2", trainieren: [Q("muster"), Q("architektur"), S("Entwurfsmuster"), A("ga1-oop")] });
  punkt("02.04.13", 23, { titel: "Anforderungen an die Softwareergonomie", ru: "Требования эргономики ПО",
    stichworte: ["Softwareergonomie", "Anforderungen benennen und beurteilen"],
    pruefung: "GA1", trainieren: [Q("ergonomie"), S("Software"), A("ga1-ergo")],
    hinweis: "В приложении эргономика разобрана по принципам диалога ISO 9241-110." });
  punkt("02.04.14", 24, { titel: "Benutzeroberfläche gestalten: Usability und UX", ru: "Пользовательский интерфейс: usability и UX",
    stichworte: ["Usability", "User Experience"],
    pruefung: "GA1", trainieren: [Q("ergonomie"), S("Software"), A("ga1-ergo")] });
  punkt("02.04.15", 24, { titel: "Prototypen und Mockups erstellen", ru: "Прототипы и мокапы",
    stichworte: ["Mockup", "Prototyp"],
    pruefung: "GA1", trainieren: [Q("ergonomie"), S("Software")],
    luecke: "Нарисовать мокап в приложении нельзя — только теория и Kurzfrage. Рисуй на бумаге по бланкам GA1." });
  punkt("02.04.16", 24, { titel: "Algorithmen in Pseudocode entwickeln", ru: "Разработка алгоритмов в псевдокоде",
    stichworte: ["Pseudocode"],
    pruefung: "GA2", trainieren: [C(), L("variablen"), P("algo-leer"), A("ga2-algo")],
    hinweis: STRUKTOGRAMM });
  punkt("02.04.17", 24, { titel: "OOP-Konzepte anwenden", ru: "Применять концепции ООП",
    stichworte: ["Kapselung", "Vererbung", "Polymorphie", "Interfaces", "Fehlerbehandlung (Exceptions)"],
    neu: true, pruefung: "GA1+GA2", trainieren: [Q("oop"), L("oop"), P("oop-kapselung"), S("Programmierung")] });
  punkt("02.04.18", 24, { titel: "Such- und Sortierverfahren", ru: "Алгоритмы поиска и сортировки",
    stichworte: ["lineare Suche", "binäre Suche", "Bubble Sort", "Selection Sort", "Insertion Sort"],
    neu: true, pruefung: "GA2", trainieren: [ALGO(), Q("algo"), C("bubble-sort"), S("Algorithmen")] });
  punkt("02.04.19", 24, { titel: "Vorhandene Funktionen und Klassen erweitern", ru: "Дополнять существующие функции и классы",
    stichworte: ["Programm- oder Pseudocode", "für Dritte lesbar", "nicht kompilierbar nötig"],
    pruefung: "GA2", trainieren: [C(), P("algo-objekte"), A("ga2-algo")] });
  punkt("02.04.20", 24, { titel: "Austauschformate CSV, XML, JSON", ru: "Форматы обмена CSV, XML, JSON",
    stichworte: ["CSV", "XML", "JSON", "Einsatzbereiche"],
    pruefung: "GA1+GA2", trainieren: [Q("formate"), S("Datenformate")] });
  punkt("02.04.21", 24, { titel: "Server-Dienste nutzen: REST und SOAP", ru: "Использовать сервисы сервера: REST и SOAP",
    stichworte: ["REST", "SOAP"],
    pruefung: "GA1+GA2", trainieren: [Q("rest"), L("api"), P("ga1-api"), S("Schnittstellen")] });
  punkt("02.04.22", 24, { titel: "SQL: Tabellen, Abfragen, Datenpflege", ru: "SQL: таблицы, запросы, изменение данных",
    stichworte: ["CREATE und ALTER TABLE", "CREATE INDEX", "INSERT, UPDATE, DELETE", "SELECT mit WHERE, Unterabfrage", "ORDER BY", "GROUP BY, HAVING", "JOIN über mehrere Tabellen", "Aggregatfunktionen", "SQL-Beiblatt (Anhang)"],
    neu: true, pruefung: "GA2", trainieren: [SQL(), L("sql"), A("ga2-sql")],
    luecke: "В SQL-тренажёре нет задания на CREATE INDEX." });

  punkt("02.05.01", 25, { titel: "Datenschutz und Datensicherheit in Anwendungen", ru: "Защита и безопасность данных в приложениях",
    stichworte: ["Integrität, Authentizität", "digitale Signatur", "Verschlüsselungsverfahren", "Archivierung: Fristen, Pflichten", "Authentifizierung, Autorisierung"],
    pruefung: "GA1+GA2", trainieren: [Q("krypto"), Q("auth"), L("sicherheit"), S("Datenschutz")],
    luecke: "Архивирование (сроки хранения, обязанности) — только кратко." });
  punkt("02.05.02", 25, { titel: "Datenintegrität technisch sichern", ru: "Техническое обеспечение целостности данных",
    stichworte: ["Constraints", "Validierung", "Transaktionssicherheit"],
    pruefung: "GA2", trainieren: [Q("integritaet"), S("Daten"), SQL()] });
  punkt("02.05.03", 25, { titel: "Softwaretests planen, durchführen, auswerten", ru: "Планировать, проводить и оценивать тесты",
    stichworte: ["Black-/Whitebox", "Schreibtischtest", "Modul-, Integrations-, E2E-Test", "Belastungstest", "Testprozess: Verfahren, Kriterien, Testdaten, Protokoll"],
    pruefung: "GA1+GA2", trainieren: [L("tests"), P("test-klassen"), A("ga2-test"), A("ga1-test")] });
  punkt("02.05.04", 25, { titel: "Versionsverwaltung: Branch, Pull, Push, Merge", ru: "Контроль версий: branch, pull, push, merge",
    stichworte: ["Branches", "Pull, Push", "Merge"],
    pruefung: "GA1+GA2", trainieren: [Q("git"), S("Versionsverwaltung")],
    hinweis: "По каталогу работу с системой версий могут проверять и в практической части." });
  punkt("02.05.05", 25, { titel: "Testergebnisse aufbereiten und präsentieren", ru: "Подготовить и представить результаты тестов",
    stichworte: ["Testergebnisse", "multimedial aufbereiten", "digitale Werkzeuge"],
    pruefung: "GA1", trainieren: [L("projekt")],
    hinweis: "По каталогу может быть частью практической части экзамена (проект, презентация).",
    luecke: "Отдельного упражнения нет; ближе всего — занятие «Проект и устное объяснение»." });

  /* ===================================================================
     AP2 · Teil 03 — WiSo (Katalog S. 26–33)
     =================================================================== */
  const W = (nr, s, titel, ru, stichworte, quiz, extra) => punkt(nr, s, Object.assign({ titel, ru, stichworte, pruefung: "WiSo",
    trainieren: quiz.map(q => (typeof q === "string" ? Q(q) : q)).concat([BOGEN()]) }, extra || {}));

  W("03.01.01", 26, "Rechte und Pflichten im Ausbildungsvertrag", "Права и обязанности по договору обучения",
    ["Ausbildungsvertrag nach BBiG", "Probezeit", "Vergütung, Urlaub", "Kündigung, Beendigung", "Prüfungen"], ["wiso-ausbildung", L("wiso")]);
  W("03.01.02", 26, "Duales System: Vorteile", "Дуальная система: преимущества",
    ["Lernorte Betrieb und Berufsschule", "Absprachen, Arbeitskreise"], ["wiso-ausbildung"]);
  W("03.01.03", 26, "Aufgaben von Betrieb, Berufsschule und Kammer", "Задачи предприятия, профшколы и палаты",
    ["Ausbildungsordnung", "BBiG", "Berufsschulpflicht", "Freistellung zur Prüfung", "Arbeitsmittel"], ["wiso-ausbildung"]);
  W("03.01.04", 26, "Ausbildungsrahmenplan und betrieblicher Plan", "Рамочный план обучения и план предприятия",
    ["Rahmenlehrplan", "betrieblicher Ausbildungsplan", "sachliche und zeitliche Gliederung", "Versetzungsplan"], ["wiso-ausbildung"]);
  W("03.01.05", 26, "Arbeitsrecht: Gesetze und Rechte der Beschäftigten", "Трудовое право: законы и права работников",
    ["ArbZG, KSchG, JArbSchG", "MuSchG, BEEG, AGG", "BetrVG, Betriebsvereinbarung", "Sozialversicherung, Lohnsteuer", "Schwerbehinderte"], ["wiso-arbeitsrecht", "wiso-entgelt", L("wiso")]);
  W("03.01.06", 27, "Arbeitgeberorganisationen", "Организации работодателей",
    ["Arbeitgeberverbände", "IHK", "Wirtschaftsverbände"], ["wiso-sozialpartner"]);
  W("03.01.07", 27, "Gewerkschaften und Betriebsrat", "Профсоюзы и производственный совет",
    ["Gewerkschaften", "Betriebsratswahl", "Mitbestimmung, Mitwirkung", "Betriebsversammlung, Einigungsstelle", "JAV"], ["wiso-sozialpartner"]);
  W("03.01.08", 27, "Tarifrecht", "Тарифное право",
    ["Tarifvertrag", "Tarifautonomie", "Arbeitskampf, Schlichtung", "Tarifbindung", "Laufzeit"], ["wiso-sozialpartner"]);
  W("03.01.09", 27, "Lohn und Gehalt: brutto und netto", "Зарплата: брутто и нетто",
    ["Brutto, Netto", "Lohn- und Kirchensteuer", "Sozialabgaben", "vermögenswirksame Leistungen"], ["wiso-entgelt", L("wiso")]);
  W("03.01.10", 27, "Lebenslanges Lernen", "Обучение через всю жизнь",
    ["interne und externe Weiterbildung", "Fortbildung, Umschulung", "staatliche Förderung"], ["wiso-weiterbildung"]);
  W("03.01.11", 27, "Lerntechniken", "Техники обучения",
    ["visuell", "auditiv", "kommunikativ", "motorisch"], ["wiso-weiterbildung"]);
  W("03.01.12", 27, "Arbeitstechniken und digitale Lernmedien", "Техники работы и цифровые средства обучения",
    ["Zeitmanagement", "Moderation, Präsentation", "Projektplanung", "CBT, WBT, Apps"], ["wiso-weiterbildung"]);
  W("03.01.13", 28, "Fortbildung und Umschulung", "Повышение квалификации и переобучение",
    ["Anpassungs-, Aufstiegs-, Erhaltungsfortbildung", "Umschulung", "Förderung"], ["wiso-weiterbildung"]);
  W("03.01.14", 28, "Lebens- und Karriereplanung", "Планирование жизни и карьеры",
    ["Europass, Mobilität", "Europäische Sozialcharta", "Potenzialanalyse", "Existenzgründung"], ["wiso-weiterbildung"]);

  W("03.02.01", 29, "Betrieb, Branche, Wirtschaftssektoren", "Предприятие, отрасль, секторы экономики",
    ["Branche", "primärer, sekundärer, tertiärer Sektor", "Produkte und Märkte"], ["wiso-rechtsformen"]);
  W("03.02.02", 29, "Rechtsformen", "Организационно-правовые формы",
    ["GbR", "Einzelunternehmen, OHG, KG, GmbH & Co. KG", "GmbH, AG", "gemeinnützige Organisationen"], ["wiso-rechtsformen"]);
  W("03.02.03", 29, "Organisationsformen", "Организационные структуры",
    ["Einlinien-, Mehrlinien-, Stabliniensystem", "Sparten-, Matrixorganisation", "Arbeitsabläufe"], ["wiso-unternehmen"]);
  W("03.02.04", 29, "Konzern, Kartell, Fusion", "Концерн, картель, слияние",
    ["Konzern", "Kartell", "Fusion"], ["wiso-unternehmen"]);
  W("03.02.05", 29, "Unternehmensziele", "Цели предприятия",
    ["Produktivität", "Wirtschaftlichkeit", "Rentabilität", "Zielkonflikte"], ["wiso-unternehmen"]);
  W("03.02.06", 29, "Arbeitsteilung und soziale Marktwirtschaft", "Разделение труда и социальная рыночная экономика",
    ["Globalisierung", "soziale Marktwirtschaft"], ["wiso-unternehmen"]);
  W("03.02.07", 29, "Verbände und berufsständische Vertretungen", "Союзы и профессиональные представительства",
    ["Gewerkschaften, Arbeitgeberverbände", "Wirtschaftsorganisationen", "Ehrenamt, z. B. Prüfungsausschuss"], ["wiso-sozialpartner"]);
  W("03.02.08", 29, "Behörden und Verwaltungen", "Органы власти и управления",
    ["Ziele und Aufgaben von Behörden"], ["wiso-unternehmen"],
    { luecke: "Разобрано кратко (вместе с социальной рыночной экономикой)." });
  W("03.02.09", 29, "Zusammenarbeit von Arbeitgeber und Betriebsrat", "Сотрудничество работодателя и производственного совета",
    ["BetrVG", "Betriebsrat, JAV", "Betriebsvereinbarung", "Personalvertretung"], ["wiso-sozialpartner"]);

  W("03.03.01", 30, "Arbeitsschutzvorschriften", "Нормы охраны труда",
    ["ArbSchG, ASiG, ArbZG", "BetrSichV, ArbStättV", "Unfallverhütungsvorschriften", "Bildschirmarbeit", "Gewerbeaufsicht", "JArbSchG"], ["wiso-arbeitsschutz"]);
  W("03.03.02", 30, "Gefährdungen und Belastungen erkennen", "Распознавать опасности и нагрузки",
    ["mechanisch, elektrisch, thermisch, chemisch", "ergonomisch, akustisch, psychisch", "Fürsorgepflicht", "Ersthelfer"], ["wiso-arbeitsschutz"]);
  W("03.03.03", 30, "Vorsorgeuntersuchungen", "Профилактические медосмотры",
    ["Augenuntersuchung bei Bildschirmarbeit", "psychische Gefährdungsbeurteilung"], ["wiso-arbeitsschutz"]);
  W("03.03.04", 30, "Sicherheitsbeauftragte", "Уполномоченные по безопасности",
    ["Aufgaben der Sicherheitsbeauftragten"], ["wiso-arbeitsschutz"]);
  W("03.03.05", 30, "Sicherheitsregeln im Arbeitsalltag", "Правила безопасности в работе",
    ["Flucht- und Rettungswege, Notausgänge", "Schutzarten, Schutzklassen", "Prüfzeichen (CE)", "Sicherheitszeichen und -farben"], ["wiso-arbeitsschutz"]);
  W("03.03.06", 30, "Verhalten bei Unfällen", "Действия при несчастном случае",
    ["Erste Hilfe", "Notruf, Meldekette", "Sammelplatz, Evakuierung", "Meldepflicht"], ["wiso-arbeitsschutz"]);
  W("03.03.07", 30, "Brandschutz", "Пожарная безопасность",
    ["Brandursachen", "Brandschutzordnung", "kein Aufzug im Brandfall", "Feuerlöscher, Löschdecke", "Brandklassen A–D"], ["wiso-arbeitsschutz"]);
  W("03.03.08", 31, "Grundlagen der IT-Sicherheit und des Datenschutzes", "Основы IT-безопасности и защиты данных",
    ["Informationssicherheit und Datenschutz", "DSGVO", "Schutzziele", "BSI", "IT-Sicherheitskonzept", "TOM"], ["wiso-digital", S("Datenschutz")]);

  W("03.04.01", 32, "Umweltbelastungen vermeiden", "Избегать нагрузки на окружающую среду",
    ["IT-spezifische Risiken (z. B. USV-Akkus)", "Energie sparen", "Speicher- und Druckmedien", "Recycling, Mülltrennung"], ["wiso-umwelt"]);
  W("03.04.02", 32, "Abfälle richtig behandeln", "Обращение с отходами",
    ["branchenspezifische Abfälle", "Datenträger und Kabel entsorgen"], ["wiso-umwelt"]);
  W("03.04.03", 32, "Umweltgesetze und öffentliche Systeme", "Экологические законы и общественные системы",
    ["duales System (Verpackungen)", "Immissionsschutzgesetz", "TA Lärm, Luft, Abfall"], ["wiso-umwelt"]);
  W("03.04.04", 32, "Nachhaltigkeit und externe Auswirkungen", "Устойчивость и влияние на природу",
    ["Umwelt, Pflanzen, Tiere, Lebensräume"], ["wiso-umwelt"]);
  W("03.04.05", 32, "Ressourcen umweltschonend nutzen", "Бережное использование ресурсов",
    ["nachhaltiger Einkauf", "Roh-, Hilfs-, Betriebsstoffe", "Strom aus erneuerbaren Quellen"], ["wiso-umwelt"]);
  W("03.04.06", 32, "Abfall vermeiden und verringern", "Избегать и сокращать отходы",
    ["Abfallvermeidung"], ["wiso-umwelt"]);
  W("03.04.07", 32, "Rechtsfolgen bei Verstößen", "Правовые последствия нарушений",
    ["Rechtsfolgen"], ["wiso-umwelt"]);

  W("03.05.01", 33, "Wertschätzend im Team arbeiten", "Уважительная работа в команде",
    ["Interdisziplinarität, Interkulturalität", "gemeinsame Verantwortung", "Unternehmenswerte, Ethikregeln"], ["wiso-digital"]);
  W("03.05.02", 33, "Sicher kommunizieren: E-Mail und Social Media", "Безопасная коммуникация: e-mail и соцсети",
    ["Sicherheitsbewusstsein", "Social Media", "Netiquette, E-Mail", "Adresslisten", "Social Engineering"], ["wiso-digital", S("IT-Sicherheit")]);
  W("03.05.03", 33, "Ethik, Vielfalt und Compliance", "Этика, разнообразие и compliance",
    ["Diversity", "geschlechtergerechte Sprache, drittes Geschlecht", "Würde und Integrität", "Nachhaltigkeit", "Compliance-Regeln"], ["wiso-digital"]);

  /* ===================================================================
     Anhang — Notationen und Beiblätter (Katalog S. 34–44)
     =================================================================== */
  punkt("A.01", 34, { titel: "EPK (ereignisgesteuerte Prozesskette)", ru: "EPK — событийная цепочка процессов",
    stichworte: ["Ereignis, Funktion", "Konnektoren UND, XOR, ODER", "Organisationseinheit, Informationsobjekt"],
    pruefung: "GA1", trainieren: [Q("prozesse"), S("Prozessmodelle")],
    hinweis: "Нотация из приложения каталога; в пунктах AP2 FIAE EPK прямо не названа." });
  punkt("A.02", 35, { titel: "BPMN", ru: "BPMN — нотация бизнес-процессов",
    stichworte: ["Task", "Gateways XOR, OR, AND", "Start-, Zwischen-, Endereignis", "Pool, Lane", "Sequenz- und Nachrichtenfluss"],
    pruefung: "GA1", trainieren: [Q("prozesse"), S("Prozessmodelle")],
    hinweis: "На вводной странице каталога BPMN назван среди «новых методов»; в пунктах AP2 FIAE отдельно не назван." });
  punkt("A.03", 36, { titel: "Netzplan: FAZ, FEZ, SAZ, SEZ, Puffer", ru: "Сетевой график: сроки и резервы",
    stichworte: ["Vorgangsliste", "FAZ, FEZ, SAZ, SEZ", "Gesamtpuffer, freier Puffer", "kritischer Pfad"],
    pruefung: "GA1", trainieren: [D("netzplan"), S("Projektmanagement"), A("ga1-pm")] });
  punkt("A.04", 37, { titel: "Netzwerkplan: Symbole", ru: "Схема сети: условные обозначения",
    stichworte: ["Switch (Layer 2)", "Router (Layer 3)", "Firewall", "Access Point, Server", "(Teil-)Netz mit Adresse"],
    pruefung: "GA1", trainieren: [Q("netz")],
    luecke: "Нет упражнения на чтение или рисование схемы сети." });
  punkt("A.05", "38–39", { titel: "SQL-Syntax (Beiblatt)", ru: "Справочный лист по SQL",
    stichworte: ["CREATE, ALTER, DROP TABLE", "Schlüssel und Datentypen", "SELECT, JOIN, Unterabfrage", "GROUP BY, HAVING, ORDER BY", "INSERT, UPDATE, DELETE", "CREATE USER, GRANT, REVOKE", "Aggregat-, Text- und Datumsfunktionen", "UNION, LIKE, IS NULL"],
    neu: true, pruefung: "GA2", trainieren: [SQL(), L("sql"), A("ga2-sql")],
    luecke: "В SQL-тренажёре нет: CREATE INDEX, DROP TABLE, RIGHT JOIN, UNION, CREATE USER/GRANT/REVOKE, STDDEV/VARIANCE/CORR, функции дат (DATEADD, DATEDIFF, MONTH …) и строк (LEFT, RIGHT)." });
  punkt("A.06", "40–42", { titel: "UML-Notation", ru: "Нотация UML",
    stichworte: ["Anwendungsfall: include, extend", "Aktivität: Start, Ende, Gabelung, Entscheidung, Schwimmbahn", "Klasse: Sichtbarkeit, Multiplizität, Aggregation, Komposition", "Sequenz: synchron, asynchron, alt, loop", "Zustand: Ereignis [Bedingung] / Aktion"],
    pruefung: "GA1+GA2", trainieren: [L("uml"), P("uml-sequenz"), D("klasse"), Q("oop")] });
  punkt("A.07", 43, { titel: "Dezimal- und Binärpräfixe", ru: "Десятичные и двоичные приставки",
    stichworte: ["kB, MB, GB (Basis 10)", "KiB, MiB, GiB (Basis 2)", "Datenmengen nur mit Binärpräfixen"],
    pruefung: "GA1",
    hinweis: "Правило каталога: объёмы данных — только двоичными приставками (1 KiB = 1024 байта), физические величины (ток, мощность, скорость) — десятичными.",
    luecke: "Нет материала: упражнений на перевод KiB/MiB/GiB нет." });
  punkt("A.08", 44, { titel: "Belegsatz: Beispielrechnung", ru: "Пример документа: счёт",
    stichworte: ["Rechnung: Rabatt, Nettopreis, MwSt.", "Skonto"],
    pruefung: "GA1", trainieren: [L("wirtschaft"), S("Wirtschaftlichkeit")],
    hinweis: "На вводной странице каталога: единые Belegsätze для всех IT-профессий впервые во 2-м издании." });

  /* Was sich mit der 2. Auflage geändert hat — „neu“ nur, was die Übersichten
     nennen UND auf den Katalogseiten steht. */
  const AENDERUNGEN = {
    neu: [
      ["SQL-Beiblatt (SQL-Syntax im Anhang)", ["A.05", "02.04.22"]],
      ["Anomalien, Redundanzen", ["01.02.03"]],
      ["Last- und Performancetest", ["01.03.01"]],
      ["Man-in-the-Middle, SQL-Injection, DDoS", ["01.04.04"]],
      ["TOM (technische und organisatorische Maßnahmen)", ["01.04.06", "02.02.01"]],
      ["Switch, Bridge, Router", ["02.01.02"]],
      ["RADIUS, Kerberos", ["02.01.03"]],
      ["SMB/CIFS, ODBC", ["02.01.04"]],
      ["Monitoring", ["02.01.11", "02.01.12"]],
      ["Programm- und Konfigurationsdokumentation", ["02.01.13"]],
      ["NAS, SAN (aus AP1)", ["02.02.06"]],
      ["Softwarequalitätsmerkmale nach ISO (aus AP1)", ["02.03.01"]],
      ["Cyber-physische Systeme", ["02.03.06"]],
      ["TDD", ["02.03.08"]],
      ["Scrum", ["02.04.02"]],
      ["Architekturmuster MVC", ["02.04.12"]],
      ["Kapselung", ["02.04.17"]],
      ["Bubble, Selection, Insertion Sort", ["02.04.18"]]
    ],
    nichtGefunden: "SSO и MVVM упоминаются в обзорах, но на страницах каталога AP2 FIAE прямо не названы. В приложении они разобраны (Kerberos/SSO, MVVM) — как дополнение.",
    entfernt: [
      ["Struktogramm, PAP", "Контрольные структуры — псевдокодом или диаграммой активности."],
      ["KI, IoT, Blockchain, Big Data как отдельные «модные» темы", "В пунктах AP2 FIAE их нет; KI во 2-м издании стоит в AP1."],
      ["Load Balancing", "В пункте о доступности сервисов (02.01.08) не назван."],
      ["Data Warehouse", "Назван только Data Lake (02.02.05)."]
    ],
    auch: [
      "SQL и RAID по вводной странице каталога теперь только во второй части (AP2).",
      "Каталог действует с AP2 лета 2025; экзамены до этого составлялись по 1-му изданию."
    ]
  };

  const DATEN = {
    quelle: "Prüfungskatalog AP2 FIAE, 2. Auflage 2024 (ZPA Nord-West, Köln 10/2024)",
    gueltig: "ab AP2 Sommer 2025",
    bereiche: BEREICHE, gruppen: GRUPPEN, punkte: PUNKTE, aenderungen: AENDERUNGEN
  };
  root.AP2_KATALOG2 = DATEN;
  if (typeof module === "object" && module.exports) module.exports = DATEN;
})(typeof window !== "undefined" ? window : globalThis);
