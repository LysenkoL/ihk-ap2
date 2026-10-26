/* ============================================================================
   gen/lernen-katalog-daten.js — weitere Themen AP2 nach dem Prüfungskatalog
   ----------------------------------------------------------------------------
   Ergänzt window.AP2_THEMEN (gen/lernen-daten.js) um Themen, die der
   Prüfungskatalog AP2 FIAE (ZPA, 2. Auflage 2024, gilt ab Sommer 2025)
   ausdrücklich nennt, die im Trainer aber noch fehlten:

     netz         Netzwerk für Entwickler            AP2 02.01.01–07
     betrieb      Monitoring, Support, SLA, MTBF     AP2 02.01.08–13
     speicher     RAID, Backup, USV, NAS/SAN         AP2 02.01.10, 02.02
     cps          Cyber-physische Systeme            AP2 02.03.06
     bedrohungen  Angriffe und Schutzmaßnahmen       AP2 01.04
     testen2      TDD, Automatisierung, Lasttests    AP2 02.03.08, 01.03
     architektur  Schichten, Client-Server, MVVM     AP2 02.04.12, 02.01.04
     qualitaet    ISO 25010, Prüfmethoden, Parität   AP2 02.03.01, 01.03
     prozesse     EPK und BPMN                       Anhang „Notationen“
     skripte      Bash, PowerShell, Python, cron     AP2 02.03.07

   Lädt NACH gen/lernen-daten.js und VOR gen/lernen.js. Jedes Thema kommt
   hinter ein verwandtes Thema (NACH); fehlt es, vor „Prüfungstaktik“ oder
   ans Ende. Doppeltes Laden ersetzt das Thema, statt es zu verdoppeln.

   Format wie gen/lernen-daten.js. Abweichung: quiz.w ist eine russische
   Erklärung. Die Texte sind eigene, nicht aus Katalog oder Prüfungen kopiert.
   Kurzfragen k01–k40: gen/satzbausteine-katalog.js.
   ========================================================================== */
"use strict";

(function (root) {
  const T = [];

  /* ============================================================ Netzwerk */
  T.push({
    id: "netz", titel: "Netzwerk für Entwickler: Schichten, Protokolle, Dienste", ru: "Сети глазами разработчика", teil: "GA1+GA2",
    katalog: "AP2 02.01.01–07 (S. 20): OSI und TCP/IP, Switch, Router, Firewall, VLAN, VPN, RADIUS, Kerberos, TCP/UDP, DNS, DHCP, Proxy",
    links: [],
    kurzRu: "Разработчику важно понимать, как данные его программы проходят по сети. Модели OSI (7 уровней) и TCP/IP (4 уровня) делят эту работу на слои: switch работает с MAC-адресами (уровень 2), router — с IP-адресами (уровень 3), TCP доставляет надёжно, а UDP — быстро, но без гарантии. Сервисы и защита: DNS переводит имя в IP-адрес, DHCP раздаёт адреса, VPN строит зашифрованный туннель, VLAN логически делит сеть, RADIUS и Kerberos централизованно проверяют вход.",
    punkte: [
      ["OSI-Modell", "модель OSI", "Sieben Schichten: 1 Bitübertragung, 2 Sicherung, 3 Vermittlung, 4 Transport, 5 Sitzung, 6 Darstellung, 7 Anwendung. Jede Schicht hat eine feste Aufgabe und nutzt die Schicht darunter. Bei der Fehlersuche prüft man Schicht für Schicht."],
      ["TCP/IP-Modell", "модель TCP/IP", "Vier Schichten: Netzzugang (OSI 1–2), Internet (OSI 3), Transport (OSI 4), Anwendung (OSI 5–7). Nach diesem Modell arbeitet das Internet."],
      ["MAC-Adresse, IP-Adresse, ARP", "MAC-адрес, IP-адрес, ARP", "Die MAC-Adresse (48 Bit) ist die feste Adresse der Netzwerkkarte (Schicht 2). Die IP-Adresse ist die logische Adresse im Netz (Schicht 3): IPv4 hat 32 Bit (192.168.1.10), IPv6 hat 128 Bit in Hexadezimal (2001:db8::1). ARP findet im lokalen Netz zu einer IPv4-Adresse die passende MAC-Adresse."],
      ["Switch, Bridge, Router, Firewall", "коммутатор, мост, маршрутизатор, межсетевой экран", "Switch und Bridge verbinden Geräte im selben Netz anhand der MAC-Adresse (Schicht 2). Ein Router verbindet verschiedene Netze anhand der IP-Adresse (Schicht 3). Eine Firewall lässt Verkehr nur nach Regeln durch, z. B. nach IP-Adresse und Port (bis Schicht 4)."],
      ["TCP und UDP", "TCP и UDP", "TCP ist verbindungsorientiert: Verbindungsaufbau (Drei-Wege-Handshake), Bestätigungen, richtige Reihenfolge; verlorene Pakete werden neu gesendet. Gut für Web, E-Mail und Dateien. UDP sendet ohne Verbindung und ohne Bestätigung: schneller, aber Pakete können fehlen. Gut für Video, Internettelefonie (VoIP) und DNS-Anfragen."],
      ["Port", "порт", "Nummer, über die ein Dienst auf einem Rechner erreichbar ist. IP-Adresse + Port = Socket. Beispiele: HTTP 80, HTTPS 443 (HTTP mit TLS), SSH 22, DNS 53, SMB 445."],
      ["DNS, DHCP, Proxy", "DNS, DHCP, прокси", "DNS übersetzt Namen in IP-Adressen (shop.example.com → 203.0.113.5). DHCP verteilt automatisch IP-Adresse, Subnetzmaske, Gateway und DNS-Server. Ein Proxy stellt Anfragen im Auftrag der Clients; er kann filtern, protokollieren und Inhalte zwischenspeichern (Cache)."],
      ["LAN, WAN, VLAN", "локальная, глобальная и виртуальная сеть", "PAN: wenige Meter (Bluetooth). LAN: lokal, z. B. ein Gebäude. MAN: eine Stadt. WAN: große Entfernungen. GAN: weltweit. Ein VLAN teilt ein physisches Netz logisch in getrennte Netze (IEEE 802.1Q); zwischen VLANs vermittelt ein Router."],
      ["VPN und IPsec", "VPN и IPsec", "Ein VPN baut einen verschlüsselten Tunnel durch ein unsicheres Netz wie das Internet. Site-to-Site verbindet zwei Standorte, End-to-Site (Remote Access) verbindet einen Rechner im Homeoffice mit der Firma. IPsec verschlüsselt auf Schicht 3; andere Beispiele sind OpenVPN und WireGuard."],
      ["RADIUS", "RADIUS (централизованная проверка доступа)", "Zentraler Server für die Anmeldung im Netz. AAA: Authentication (Wer bist du?), Authorization (Was darfst du?), Accounting (Was hast du genutzt?). Typisch für WLAN mit WPA2/WPA3-Enterprise (IEEE 802.1X) und für VPN-Zugänge."],
      ["Kerberos", "Kerberos (вход по билетам)", "Anmeldeverfahren mit Tickets, z. B. im Windows-Active-Directory. Nach der Anmeldung gibt das Key Distribution Center (KDC) ein Ticket Granting Ticket (TGT). Damit holt der Client Service-Tickets für einzelne Dienste. Das Passwort geht nicht über das Netz, und der Nutzer meldet sich nur einmal an (Single Sign-on)."],
      ["SMB/CIFS, NFS, ODBC", "сетевой доступ к файлам и базам данных", "SMB (ältere Version: CIFS) gibt Dateien und Drucker im Windows-Netz frei, NFS macht das unter Linux. ODBC ist eine einheitliche Schnittstelle für den Zugriff auf Datenbanken: Das Programm bleibt gleich, für jedes Datenbanksystem gibt es einen Treiber (in Java: JDBC)."]
    ],
    tabelle: { titel: "Schichten und Beispiele",
      kopf: ["Schicht: OSI → TCP/IP", "Beispiele", "Gerät, Adresse"],
      zeilen: [
        ["7–5 Anwendung → Anwendung", "HTTP(S), DNS, DHCP, SMB, SSH", "Daten der Anwendung"],
        ["4 Transport → Transport", "TCP, UDP", "Port"],
        ["3 Vermittlung → Internet", "IPv4, IPv6, ICMP (ping), IPsec", "Router, IP-Adresse"],
        ["2 Sicherung → Netzzugang", "Ethernet, WLAN", "Switch, Bridge, MAC-Adresse"],
        ["1 Bitübertragung → Netzzugang", "Kupfer, Glasfaser, Funk", "Kabel, Stecker"]
      ] },
    code: [
      { titel: "Was passiert bei https://shop.example.com/api/artikel?", text:
`1. DNS:  shop.example.com
         → 203.0.113.5 (UDP, Port 53)
2. TCP:  Verbindung zu Port 443:
         SYN → SYN-ACK → ACK
3. TLS:  Zertifikat prüfen,
         Sitzungsschlüssel aushandeln
4. HTTP: GET /api/artikel
         (verschlüsselt)
5. IP:   Router leiten die Pakete
         weiter. Im LAN findet ARP
         die MAC-Adresse des Gateways.
6. HTTP: 200 OK, Artikel als JSON` }
    ],
    merke: "Switch = MAC-Adresse (Schicht 2), Router = IP-Adresse (Schicht 3), Firewall = Regeln für IP und Port. TCP = zuverlässig und geordnet, UDP = schnell ohne Garantie. DNS = Name → IP, DHCP = Adresse automatisch, VPN = verschlüsselter Tunnel.",
    karten: ["k01", "k02", "k03", "k04", "k05"],
    quiz: [
      { id: "ne1", f: "Auf welcher OSI-Schicht arbeitet ein klassischer Switch?",
        o: ["Schicht 2 (Sicherung)", "Schicht 1 (Bitübertragung)", "Schicht 3 (Vermittlung)", "Schicht 4 (Transport)"], r: [0],
        w: "Switch пересылает кадры по MAC-адресам — это уровень 2 (Sicherungsschicht). Router работает с IP-адресами — уровень 3." },
      { id: "ne2", f: "Eine App überträgt ein Live-Video. Einzelne verlorene Pakete stören kaum, wichtig ist eine kleine Verzögerung. Welches Transportprotokoll passt?",
        o: ["UDP", "TCP", "ARP", "SMB"], r: [0],
        w: "UDP работает без соединения и без повторной отправки — задержка меньше. Потеря нескольких кадров видео не критична, а TCP ждал бы повторной отправки и тормозил." },
      { id: "ne3", f: "Welche Aussagen zu TCP stimmen? (alle richtigen ankreuzen)",
        o: ["Vor der Übertragung wird eine Verbindung aufgebaut (Drei-Wege-Handshake).", "Verlorene Pakete werden erneut gesendet.", "TCP ist schneller als UDP, weil es keine Bestätigungen gibt.", "TCP arbeitet auf OSI-Schicht 2."], r: [0, 1],
        w: "TCP: соединение (SYN, SYN-ACK, ACK), подтверждения, повторная отправка, правильный порядок. Поэтому он надёжнее, но медленнее UDP. Уровень — 4 (Transport)." },
      { id: "ne4", f: "Ein Nutzer gibt shop.example.com im Browser ein. Welcher Dienst ermittelt die IP-Adresse?",
        o: ["DNS", "DHCP", "Proxy", "ARP"], r: [0],
        w: "DNS переводит имя в IP-адрес. DHCP раздаёт устройствам сетевые настройки, ARP ищет MAC-адрес к IP-адресу в локальной сети." },
      { id: "ne5", f: "Welche Angaben verteilt ein DHCP-Server typischerweise? (alle richtigen ankreuzen)",
        o: ["IP-Adresse und Subnetzmaske", "Standardgateway und DNS-Server", "Das Passwort des Benutzers", "Die MAC-Adresse der Netzwerkkarte"], r: [0, 1],
        w: "DHCP выдаёт сетевые настройки: IP-адрес, маску, шлюз, DNS-сервер. MAC-адрес принадлежит сетевой карте, пароли DHCP не раздаёт." },
      { id: "ne6", f: "Mitarbeiter im Homeoffice sollen sicher auf einen Server in der Firma zugreifen. Was ist die passende Lösung?",
        o: ["Ein VPN (End-to-Site) mit verschlüsseltem Tunnel", "Ein VLAN im Homeoffice", "Den Port des Servers direkt im Internet freigeben", "Einen DHCP-Server im Homeoffice"], r: [0],
        w: "VPN строит зашифрованный туннель через интернет в сеть фирмы. VLAN делит только локальную сеть, а открытый в интернет порт сервера — лишний риск." },
      { id: "ne7", f: "Wofür steht AAA bei einem RADIUS-Server?",
        o: ["Authentication, Authorization, Accounting", "Access, Admin, Audit", "Anmeldung, Abmeldung, Archivierung", "Address, Allocation, ARP"], r: [0],
        w: "RADIUS централизованно проверяет, кто входит (Authentication), что ему разрешено (Authorization), и учитывает использование (Accounting). Типично: WLAN с WPA2/3-Enterprise и VPN." },
      { id: "ne8", f: "Was bekommt ein Benutzer bei Kerberos nach der erfolgreichen Anmeldung zuerst?",
        o: ["Ein Ticket Granting Ticket (TGT) vom Key Distribution Center", "Ein Zertifikat von einer Zertifizierungsstelle", "Eine IP-Adresse vom DHCP-Server", "Für jeden Dienst sofort ein eigenes Passwort"], r: [0],
        w: "Сначала KDC выдаёт TGT. С ним клиент получает у Ticket Granting Server билеты (Service-Tickets) для нужных сервисов — без повторного ввода пароля (Single Sign-on)." },
      { id: "ne9", f: "Buchhaltung und Entwicklung hängen am selben Switch, sollen aber logisch getrennte Netze bekommen. Was richten Sie ein?",
        o: ["VLANs", "Einen Proxy", "Ein Peer-to-Peer-Netz", "Einen zweiten DNS-Server"], r: [0],
        w: "VLAN логически делит одну физическую сеть на изолированные сети. Для связи между VLAN нужен router или Layer-3-Switch." },
      { id: "ne10", f: "Ein Programm soll über eine einheitliche Schnittstelle auf verschiedene Datenbanksysteme zugreifen; für jedes System gibt es einen Treiber. Wie heißt diese Schnittstelle?",
        o: ["ODBC", "SMB", "SNMP", "ARP"], r: [0],
        w: "ODBC (Open Database Connectivity) — единый интерфейс доступа к базам данных, для каждой СУБД нужен свой драйвер; в Java аналог — JDBC. SMB — общий доступ к файлам, SNMP — мониторинг." }
    ]
  });

  /* ============================================================= Betrieb */
  T.push({
    id: "betrieb", titel: "IT-Betrieb: Monitoring, Support, SLA, Verfügbarkeit", ru: "Эксплуатация и поддержка", teil: "GA1+GA2",
    katalog: "AP2 02.01.08–13 (S. 20–21): Verfügbarkeit, MTBF, Notfall, PDCA, Monitoring, SLA, Service Level 1–3, Tickets, Eskalation, Handbücher",
    links: [["https://ap2.online/quality/qualitaetsmanagement", "PDCA-Zyklus und KVP"]],
    kurzRu: "После запуска программу нужно эксплуатировать: мониторинг измеряет нагрузку и доступность и предупреждает при превышении порогов. Сбой фиксируют в тикет-системе и решают по уровням поддержки (1st → 2nd → 3rd Level), а сроки задаёт SLA; Incident Management быстро возвращает работу, Problem Management устраняет причину. Доступность считают в процентах, надёжность оборудования описывает MTBF, на крупную аварию заранее готовят Notfallkonzept, а процессы улучшают по циклу PDCA.",
    punkte: [
      ["Monitoring", "мониторинг", "Systeme werden laufend gemessen: CPU, Arbeitsspeicher, Festplatte, Antwortzeit, Erreichbarkeit der Dienste. Liegt ein Wert über einem Schwellwert, gibt es eine Warnung. So erkennt man Engpässe, bevor die Nutzer etwas merken."],
      ["SNMP und S.M.A.R.T.", "SNMP и S.M.A.R.T.", "SNMP (Simple Network Management Protocol) fragt Werte von Servern und Netzwerkgeräten ab. Bei einem Problem schickt das Gerät selbst eine Meldung (Trap). S.M.A.R.T. ist die Selbstdiagnose von Festplatten und SSDs; sie warnt vor einem drohenden Ausfall."],
      ["Schwellwert und Predictive Maintenance", "порог и предиктивное обслуживание", "Ein Schwellwert ist die Grenze für einen Alarm, z. B. Warnung ab 80 % Plattenbelegung, kritisch ab 95 %. Predictive Maintenance: Aus den Messdaten erkennt man früh, dass ein Teil bald ausfällt, und tauscht es vorher."],
      ["Ticketsystem", "тикет-система", "Jede Störung und jede Anfrage bekommt ein Ticket mit Nummer, Zeit, Beschreibung, Priorität, Status und Bearbeiter. Nichts geht verloren, jeder sieht den Stand, und Fehler lassen sich später auswerten."],
      ["Support-Level (1st, 2nd, 3rd Level)", "уровни поддержки", "1st Level (Service Desk): nimmt die Meldung an, ordnet sie ein und löst einfache Fälle. 2nd Level: Fachleute für schwierigere Fälle. 3rd Level: Entwickler oder Hersteller, z. B. bei einem Fehler im Code."],
      ["Eskalation", "эскалация", "Funktionale Eskalation: Das Ticket geht an das nächste Support-Level mit mehr Fachwissen. Hierarchische Eskalation: Eine Führungskraft wird eingeschaltet, z. B. wenn die Frist aus dem SLA in Gefahr ist."],
      ["Incident und Problem Management", "управление инцидентами и проблемами", "Incident Management: die Störung schnell beheben, damit die Nutzer wieder arbeiten können — auch mit einer Übergangslösung (Workaround). Problem Management: die Ursache finden und dauerhaft beseitigen, damit der Fehler nicht wiederkommt."],
      ["SLA und SOP", "SLA и SOP", "SLA (Service Level Agreement): Vertrag über messbare Leistungen, z. B. Verfügbarkeit 99,9 %, Reaktionszeit 30 Minuten, Servicezeiten. SOP (Standard Operating Procedure): schriftliche Schritt-für-Schritt-Anleitung für wiederkehrende Aufgaben, z. B. einen Dienst neu starten."],
      ["Dokumentation", "документация", "Benutzerhandbuch für die Anwender. Betriebs- oder Administratorhandbuch für die Systembetreuer: Installation, Start, Backup, Fehlerbehebung. Programmdokumentation für Entwickler: Aufbau und Schnittstellen. Konfigurationsdokumentation: Server, Versionen, Einstellungen, Ports. Dazu Checklisten für Routinearbeiten."],
      ["Verfügbarkeit", "доступность", "Anteil der Zeit, in der ein Dienst nutzbar ist: (Gesamtzeit − Ausfallzeit) ÷ Gesamtzeit × 100 %. 99,9 % im Jahr erlauben etwa 8,76 Stunden Ausfall (0,1 % von 8.760 Stunden). Wie viel nötig ist, hängt vom Dienst ab: Telefonie und Datenbanken brauchen mehr als ein internes Wiki."],
      ["MTBF und AFR", "MTBF и AFR", "MTBF (Mean Time Between Failures): mittlere Betriebszeit zwischen zwei Ausfällen — ein statistischer Wert für viele Geräte, keine Garantie für ein einzelnes. AFR (Annualized Failure Rate): erwarteter Anteil der Geräte, die in einem Jahr ausfallen. Bei Dauerbetrieb gilt ungefähr: AFR ≈ 8.760 h ÷ MTBF."],
      ["Notfallkonzept und PDCA", "план на случай аварии и цикл PDCA", "Das Notfallkonzept (Disaster Recovery) legt vorher fest: Wer tut was bei einem großen Ausfall, in welcher Reihenfolge wird wiederhergestellt, wo liegen Backups und Kontaktlisten. Es wird regelmäßig geübt. PDCA = Plan, Do, Check, Act: planen, umsetzen, prüfen, verbessern — immer wieder (KVP)."]
    ],
    tabelle: { titel: "Verfügbarkeit und erlaubter Ausfall",
      kopf: ["Verfügbarkeit", "Ausfall pro Jahr (8.760 h)", "Ausfall pro Monat (720 h)"],
      zeilen: [
        ["99 %", "87,6 h (≈ 3,65 Tage)", "7,2 h"],
        ["99,5 %", "43,8 h", "3,6 h"],
        ["99,9 %", "8,76 h", "43,2 min"],
        ["99,99 %", "52,56 min", "4,32 min"]
      ] },
    code: [
      { titel: "Monitoring mit Schwellwerten (Pseudocode)", text:
`// läuft alle 5 Minuten
belegung ← platte.belegtInProzent()
wenn belegung >= 95 dann
    melde("KRITISCH", belegung)
    erstelleTicket("hoch")
sonst wenn belegung >= 80 dann
    melde("WARNUNG", belegung)
sonst
    protokolliere("OK", belegung)` }
    ],
    merke: "Monitoring erkennt, Ticket dokumentiert, Support löst (1st → 2nd → 3rd Level), das SLA gibt die Fristen vor. Incident = schnell wieder arbeiten, Problem = Ursache beseitigen. 99,9 % ≈ 8,76 Stunden Ausfall im Jahr.",
    karten: ["k06", "k07", "k08", "k09", "a40"],
    quiz: [
      { id: "be1", f: "Das Monitoring meldet: Festplatte zu 92 % belegt. Schwellwerte: Warnung ab 80 %, kritisch ab 95 %. Was passiert?",
        o: ["Es gibt eine Warnung.", "Es gibt eine kritische Meldung.", "Es gibt keine Meldung.", "Der Server wird automatisch abgeschaltet."], r: [0],
        w: "92 % — выше порога предупреждения (80 %), но ниже критического (95 %), поэтому будет Warnung." },
      { id: "be2", f: "Ein Mitarbeiter kann nicht drucken. Der Service Desk hilft sofort mit einem anderen Drucker. Später sucht ein Team, warum der Druckdienst immer wieder abstürzt. Welche Zuordnung stimmt?",
        o: ["Anderer Drucker = Incident Management, Ursachensuche = Problem Management", "Anderer Drucker = Problem Management, Ursachensuche = Incident Management", "Beides ist Monitoring", "Beides ist Eskalation"], r: [0],
        w: "Incident Management быстро возвращает работу (обходное решение допустимо). Problem Management ищет и устраняет первопричину повторяющихся сбоев." },
      { id: "be3", f: "Der 1st Level Support kann eine Störung nicht lösen und gibt das Ticket an die Datenbank-Spezialisten im 2nd Level. Wie heißt das?",
        o: ["Funktionale Eskalation", "Hierarchische Eskalation", "Problem Management", "Predictive Maintenance"], r: [0],
        w: "Передача на уровень с большей экспертизой — функциональная эскалация. Иерархическая — подключение руководства, например когда срок по SLA под угрозой." },
      { id: "be4", f: "Ein SLA garantiert 99,9 % Verfügbarkeit pro Jahr (8.760 Stunden). Wie lange darf der Dienst höchstens ausfallen?",
        o: ["8,76 Stunden", "87,6 Stunden", "52,56 Minuten", "0,9 Stunden"], r: [0],
        w: "Допустимый простой = 0,1 % × 8 760 ч = 8,76 ч в год. 87,6 ч соответствует 99 %, 52,56 мин — 99,99 %." },
      { id: "be5", f: "Eine Festplatte hat eine MTBF von 1.000.000 Stunden. Was bedeutet das?",
        o: ["Bei vielen gleichen Platten vergehen im Mittel etwa 1.000.000 Betriebsstunden zwischen zwei Ausfällen; eine einzelne Platte kann trotzdem früher ausfallen.", "Jede Platte hält garantiert 1.000.000 Stunden.", "Die Platte muss nach 1.000.000 Stunden getauscht werden.", "Eine Reparatur dauert im Mittel 1.000.000 Stunden."], r: [0],
        w: "MTBF — статистическое среднее по многим устройствам, а не гарантия для одного. Ориентир: AFR ≈ 8 760 ÷ 1 000 000 ≈ 0,9 % дисков в год." },
      { id: "be6", f: "Welche Angaben gehören in ein Störungsticket? (alle richtigen ankreuzen)",
        o: ["Beschreibung der Störung und wer sie gemeldet hat", "Priorität und Status", "Das Passwort des Nutzers", "Der komplette Quellcode des Programms"], r: [0, 1],
        w: "В тикете: номер, время, описание, кто сообщил, приоритет, статус, исполнитель. Пароли в тикет не пишут никогда." },
      { id: "be7", f: "Wozu dient eine SOP (Standard Operating Procedure)?",
        o: ["Wiederkehrende Aufgaben werden nach einer festen, schriftlichen Anleitung immer gleich erledigt.", "Sie misst die CPU-Last eines Servers.", "Sie ist der Vertrag mit dem Kunden über die Verfügbarkeit.", "Sie verschlüsselt die Konfigurationsdateien."], r: [0],
        w: "SOP — пошаговая инструкция для типовых операций (перезапуск сервиса, восстановление из бэкапа). Договор об уровне сервиса — это SLA." },
      { id: "be8", f: "In welcher Reihenfolge laufen die Schritte im PDCA-Zyklus?",
        o: ["Plan → Do → Check → Act", "Do → Plan → Act → Check", "Check → Plan → Do → Act", "Plan → Check → Do → Act"], r: [0],
        w: "Plan (спланировать) → Do (выполнить, опробовать) → Check (проверить результат) → Act (закрепить или скорректировать) — и снова по кругу: непрерывное улучшение (KVP)." },
      { id: "be9", f: "Was gehört in ein Notfallkonzept (Disaster Recovery)? (alle richtigen ankreuzen)",
        o: ["Wer im Notfall was tut und wie man diese Personen erreicht", "In welcher Reihenfolge die Systeme wiederhergestellt werden", "Die Farbgestaltung der Benutzeroberfläche", "Die Gehälter des IT-Teams"], r: [0, 1],
        w: "План на случай аварии: роли и контакты, приоритеты и порядок восстановления, где лежат резервные копии; план регулярно отрабатывают." },
      { id: "be10", f: "Ein Administrator soll die Anwendung installieren, sichern und überwachen. Welche Dokumentation braucht er vor allem?",
        o: ["Betriebs- bzw. Administratorhandbuch mit Konfigurationsdokumentation", "Benutzerhandbuch", "Lastenheft", "Testprotokoll"], r: [0],
        w: "Администратору нужен Betriebshandbuch: установка, запуск и остановка, резервное копирование, мониторинг, настройки. Benutzerhandbuch — для пользователей." }
    ]
  });

  /* ============================================================ Speicher */
  T.push({
    id: "speicher", titel: "Ausfallsicherheit und Speicher: RAID, Backup, USV, NAS/SAN", ru: "Отказоустойчивость и хранение данных", teil: "GA1+GA2",
    katalog: "AP2 02.01.10, 02.02.04/06 (S. 21): USV, RAID, Backup, Cloud, NAS, SAN, iSCSI, NFS — RAID kommt nur in Teil 2 vor",
    links: [],
    kurzRu: "RAID объединяет несколько дисков: RAID 0 — скорость без защиты, RAID 1 — зеркало, RAID 5 переживает отказ одного диска, RAID 6 — двух, RAID 10 — зеркала с чередованием. RAID защищает только от отказа диска, поэтому нужен ещё бэкап (полный, инкрементный или дифференциальный) по правилу 3-2-1 с проверкой восстановления. ИБП (USV) перекрывает сбои питания, NAS отдаёт по сети файлы (SMB, NFS), а SAN — блоки, как локальный диск (iSCSI, Fibre Channel).",
    punkte: [
      ["RAID", "массив дисков", "Redundant Array of Independent Disks: Mehrere Festplatten arbeiten zusammen — für mehr Ausfallsicherheit, mehr Tempo oder beides. Gerechnet wird mit der kleinsten Platte. Ein Hot-Spare ist eine Ersatzplatte, die beim Ausfall automatisch einspringt."],
      ["RAID 0 (Striping)", "RAID 0 — чередование", "Die Daten werden auf mindestens 2 Platten verteilt. Schnell, volle Kapazität (n × Platte). Aber keine Redundanz: Fällt eine Platte aus, sind alle Daten weg."],
      ["RAID 1 (Mirroring)", "RAID 1 — зеркалирование", "Zwei Platten mit genau denselben Daten (Spiegel). Nutzbar ist nur die Kapazität einer Platte. Eine Platte darf ausfallen."],
      ["RAID 5", "RAID 5 — с чётностью", "Mindestens 3 Platten. Daten und Paritätsinformationen sind auf alle Platten verteilt. Nutzbar: (n − 1) × Platte. Eine Platte darf ausfallen. Schreiben ist langsamer, weil die Parität berechnet wird."],
      ["RAID 6", "RAID 6 — двойная чётность", "Mindestens 4 Platten, doppelte Parität. Nutzbar: (n − 2) × Platte. Zwei Platten dürfen gleichzeitig ausfallen."],
      ["RAID 10 (1+0)", "RAID 10 — зеркала с чередованием", "Mindestens 4 Platten. Je zwei Platten bilden einen Spiegel, die Spiegel werden per Striping verbunden. Nutzbar: n ÷ 2 × Platte. Schnell und sicher: In jedem Spiegelpaar darf eine Platte ausfallen."],
      ["RAID ist kein Backup", "RAID не заменяет бэкап", "RAID schützt nur gegen den Ausfall einer Platte. Gelöschte Dateien, Ransomware, Brand oder Diebstahl treffen alle Platten gleichzeitig. Deshalb braucht man zusätzlich Backups."],
      ["Backup-Arten", "виды резервного копирования", "Vollsicherung: alle Daten. Inkrementelle Sicherung: nur die Änderungen seit der letzten Sicherung, egal welcher Art. Differenzielle Sicherung: alle Änderungen seit der letzten Vollsicherung."],
      ["3-2-1-Regel und Restore-Test", "правило 3-2-1 и проверка восстановления", "3 Kopien der Daten, auf 2 verschiedenen Medien, 1 Kopie außer Haus (offline oder an einem anderen Ort). Ein Backup zählt erst, wenn die Wiederherstellung getestet ist."],
      ["USV", "ИБП (источник бесперебойного питания)", "Unterbrechungsfreie Stromversorgung: Ein Akku überbrückt Stromausfälle und glättet Spannungsschwankungen, damit Server sauber herunterfahren können. Beste Klasse: VFI (Online-USV, Doppelwandler) — ohne Umschaltzeit."],
      ["NAS und SAN", "NAS и SAN", "NAS (Network Attached Storage): Speichergerät im normalen LAN, gibt Dateien über SMB oder NFS frei. SAN (Storage Area Network): eigenes schnelles Speichernetz; Server bekommen Blöcke wie von einer lokalen Platte, über Fibre Channel oder iSCSI (SCSI über TCP/IP)."],
      ["On Premises oder Cloud", "локально или в облаке", "On Premises: eigene Server im eigenen Haus — volle Kontrolle, aber eigene Kosten und Arbeit. Cloud: Leistung beim Anbieter mieten. IaaS = Infrastruktur (Server, Speicher), PaaS = Plattform für eigene Programme, SaaS = fertige Software im Browser."]
    ],
    tabelle: { titel: "RAID-Level im Vergleich",
      kopf: ["Level", "min. Platten", "nutzbar", "darf ausfallen"],
      zeilen: [
        ["RAID 0", "2", "n × Platte", "keine"],
        ["RAID 1", "2", "1 × Platte", "1 von 2"],
        ["RAID 5", "3", "(n − 1) × Platte", "1"],
        ["RAID 6", "4", "(n − 2) × Platte", "2"],
        ["RAID 10", "4", "n ÷ 2 × Platte", "1 je Spiegelpaar"]
      ] },
    code: [
      { titel: "Rechenbeispiel: 4 Platten zu je 4 TiB", text:
`RAID 0:  4 × 4 TiB       = 16 TiB
RAID 5:  (4 − 1) × 4 TiB = 12 TiB
RAID 6:  (4 − 2) × 4 TiB =  8 TiB
RAID 10: 4 ÷ 2 × 4 TiB   =  8 TiB

Verschieden große Platten
(2, 4, 4 TiB) als RAID 5:
Es zählt die kleinste Platte.
(3 − 1) × 2 TiB = 4 TiB` },
      { titel: "Wiederherstellung am Donnerstagmorgen", text:
`So = Vollsicherung
Mo bis Mi = Teilsicherungen

inkrementell:  So + Mo + Di + Mi
               (alle, der Reihe nach)
differenziell: So + Mi
               (nur die letzte)` }
    ],
    merke: "RAID 1 = Spiegel. RAID 5 = (n − 1), ein Ausfall. RAID 6 = (n − 2), zwei Ausfälle. RAID 10 = n ÷ 2. RAID ersetzt kein Backup: sichern nach 3-2-1 und die Wiederherstellung testen.",
    karten: ["k10", "k11", "k12", "k13", "s03", "s107", "s56", "s59"],
    quiz: [
      { id: "sp1", f: "Ein RAID 5 besteht aus 4 Platten zu je 4 TiB. Wie viel Speicher ist nutzbar?",
        o: ["12 TiB", "16 TiB", "8 TiB", "4 TiB"], r: [0],
        w: "RAID 5: (n − 1) × размер диска = (4 − 1) × 4 TiB = 12 TiB. Объём одного диска уходит на чётность." },
      { id: "sp2", f: "Ein RAID 10 besteht aus 6 Platten zu je 2 TiB. Wie viel Speicher ist nutzbar?",
        o: ["6 TiB", "12 TiB", "10 TiB", "4 TiB"], r: [0],
        w: "RAID 10: половина дисков — зеркальные копии, значит 6 ÷ 2 × 2 TiB = 6 TiB." },
      { id: "sp3", f: "Wie viele Platten dürfen in einem RAID 6 gleichzeitig ausfallen, ohne dass Daten verloren gehen?",
        o: ["2", "1", "0", "die Hälfte aller Platten"], r: [0],
        w: "RAID 6 хранит двойную чётность и переживает отказ двух дисков одновременно. Полезный объём: (n − 2) × диск." },
      { id: "sp4", f: "Welches RAID-Level bietet keine Redundanz?",
        o: ["RAID 0", "RAID 1", "RAID 5", "RAID 10"], r: [0],
        w: "RAID 0 только распределяет данные (Striping) ради скорости. Отказ любого диска — потеря всех данных." },
      { id: "sp5", f: "Jemand löscht versehentlich einen wichtigen Ordner auf einem Server mit RAID 1. Was stimmt?",
        o: ["Der Ordner ist auch auf der Spiegelplatte gelöscht — helfen kann nur ein Backup.", "Die Spiegelplatte hat den Ordner noch.", "RAID 1 stellt gelöschte Dateien automatisch wieder her.", "Man muss nur eine Platte ausbauen."], r: [0],
        w: "Зеркало копирует и удаление — сразу на оба диска. От ошибок пользователя, шифровальщиков и пожара защищает только резервная копия." },
      { id: "sp6", f: "Sonntag: Vollsicherung. Montag bis Mittwoch: jeden Abend eine inkrementelle Sicherung. Am Donnerstagmorgen fällt der Server aus. Was braucht man für die Wiederherstellung?",
        o: ["Die Vollsicherung und alle drei inkrementellen Sicherungen (Mo, Di, Mi)", "Nur die Sicherung vom Mittwoch", "Die Vollsicherung und nur die Sicherung vom Mittwoch", "Nur die Vollsicherung"], r: [0],
        w: "Инкрементная копия содержит изменения только с предыдущей копии, поэтому нужны полная и все инкрементные по порядку. При дифференциальной хватило бы полной и последней (среды)." },
      { id: "sp7", f: "Welche Aussagen zur differenziellen Sicherung stimmen? (alle richtigen ankreuzen)",
        o: ["Sie sichert alle Änderungen seit der letzten Vollsicherung.", "Zur Wiederherstellung braucht man die Vollsicherung und die letzte differenzielle Sicherung.", "Sie wird von Tag zu Tag kleiner.", "Sie ersetzt die Vollsicherung."], r: [0, 1],
        w: "Дифференциальная копия растёт день ото дня (все изменения с последней полной), зато восстановление проще: полная + последняя дифференциальная." },
      { id: "sp8", f: "Was beschreibt die 3-2-1-Regel?",
        o: ["3 Kopien der Daten, auf 2 verschiedenen Medien, davon 1 außer Haus", "3 Vollsicherungen pro Woche, 2 Platten, 1 Server", "RAID 3, RAID 2 und RAID 1 kombinieren", "3 Administratoren, 2 Passwörter, 1 Tresor"], r: [0],
        w: "3 копии, 2 разных носителя, 1 копия вне здания (offline или в другом месте) — защита от пожара, кражи и шифровальщиков." },
      { id: "sp9", f: "Ein Datenbankserver soll zentralen Speicher wie eine lokale Platte (blockbasiert) nutzen. Die Firma will dafür das normale Ethernet verwenden. Was passt?",
        o: ["SAN mit iSCSI", "NAS mit SMB-Freigabe", "USB-Stick", "RAID 0 im Notebook"], r: [0],
        w: "SAN даёт блочный доступ — сервер видит «свой» диск; iSCSI передаёт команды SCSI по TCP/IP через обычный Ethernet. NAS отдаёт файлы (SMB, NFS), а не блоки." },
      { id: "sp10", f: "Welche USV-Klasse liefert ohne Umschaltzeit sauberen Strom, weil sie den Strom ständig selbst neu erzeugt (Doppelwandler)?",
        o: ["VFI (Online-USV)", "VFD (Offline-USV)", "VI (Line-Interactive)", "Jede USV, egal welche Klasse"], r: [0],
        w: "VFI (Voltage and Frequency Independent): ток постоянно выпрямляется и снова преобразуется — нет времени переключения, защита от всех помех сети. VFD переключается на батарею с задержкой." }
    ]
  });

  /* ======================================================== Cyber-physisch */
  T.push({
    id: "cps", titel: "Cyber-physische Systeme: Sensoren und Aktoren", ru: "Киберфизические системы: датчики и исполнительные устройства", teil: "GA1+GA2",
    katalog: "AP2 02.03.06 (S. 22): Cyber-physische Systeme — Sensoren und Aktoren auswählen, Bibliotheken, Abfragerhythmus planen",
    links: [],
    kurzRu: "Киберфизическая система соединяет программу с физическим миром: датчик (Sensor) измеряет, программа решает, исполнительное устройство (Aktor) действует — например, термостат или полив по влажности почвы. Сигналы бывают аналоговые (непрерывные, их переводит в числа АЦП) и цифровые (вкл/выкл). Опрос (Polling) проверяет датчик через заданный интервал, прерывание (Interrupt) реагирует сразу на событие, а интервал опроса определяет время реакции и объём данных.",
    punkte: [
      ["Cyber-physisches System (CPS)", "киберфизическая система", "Software ist mit der physischen Welt verbunden: Sensoren messen, die Software entscheidet, Aktoren handeln. Oft sind die Geräte vernetzt (Internet der Dinge, IoT). Beispiele: Heizungsregelung, Industrieroboter, Smart Meter, Bewässerung."],
      ["Sensor", "датчик", "Misst eine physikalische Größe und macht daraus ein elektrisches Signal. Beispiele: Temperatur, Feuchte, Licht, Druck, Abstand, Bewegung."],
      ["Aktor", "исполнительное устройство (актуатор)", "Wandelt ein Signal in eine Handlung um. Beispiele: Motor, Ventil, Relais, Heizung, Lampe, Summer."],
      ["EVA und Regelkreis", "ввод — обработка — вывод, контур регулирования", "EVA: Eingabe (Sensor) → Verarbeitung (Programm) → Ausgabe (Aktor). Bei einer Regelung meldet der Sensor den Istwert, das Programm vergleicht ihn mit dem Sollwert und steuert den Aktor nach — immer wieder. Ohne Rückmeldung heißt es Steuerung."],
      ["analog und digital", "аналоговый и цифровой сигнал", "Digital: nur zwei Zustände, z. B. Taster gedrückt (1) oder nicht (0). Analog: stufenlose Werte, z. B. eine Spannung von 0 bis 5 V für die Temperatur. Ein A/D-Wandler macht daraus eine Zahl: Mit 10 Bit gibt es 1.024 Stufen (0 bis 1.023)."],
      ["Polling", "опрос", "Das Programm fragt den Sensor in einem festen Abstand ab, z. B. jede Sekunde. Einfach zu programmieren. Nachteil: kostet Rechenzeit und Energie, und ein kurzes Ereignis zwischen zwei Abfragen kann verloren gehen."],
      ["Interrupt (ereignisgesteuert)", "прерывание (по событию)", "Die Hardware meldet sich selbst, sobald etwas passiert, z. B. wenn ein Taster gedrückt wird. Das Programm reagiert sofort und muss nicht ständig fragen. Effizienter, aber schwieriger zu programmieren."],
      ["Abfragerhythmus planen", "интервал опроса", "Der Abstand richtet sich danach, wie schnell sich der Wert ändert und wie schnell man reagieren muss. Zu oft: viele Daten, viel Energie, viel Netzlast. Zu selten: Änderungen fallen zu spät auf. Datenmenge = Anzahl Messungen × Größe je Messung."],
      ["Zugriff und Bibliotheken", "доступ к датчикам и библиотеки", "Sensoren und Aktoren hängen an GPIO-Pins oder an Bussystemen wie I²C, SPI oder UART. Eine Bibliothek kapselt diesen Zugriff: Man ruft z. B. leseTemperatur() auf und muss das Protokoll nicht selbst programmieren. Lizenz und Pflege der Bibliothek muss man trotzdem prüfen."],
      ["Sensor auswählen", "выбор датчика", "Kriterien: Messbereich, Genauigkeit, Auflösung, Reaktionszeit, Schnittstelle (analog, digital, I²C …), Stromverbrauch, Umgebung (Nässe, Hitze) und Preis."],
      ["Vernetzung (IoT)", "сеть устройств (IoT)", "Messwerte gehen oft an einen Server, z. B. über MQTT: Geräte (Publisher) senden Nachrichten zu einem Thema (Topic) an einen Broker; Programme (Subscriber) abonnieren das Thema und bekommen die Werte."],
      ["Hysterese", "гистерезис", "Damit ein Aktor nicht ständig an- und ausschaltet, nutzt man zwei Grenzen, z. B. Heizung an unter 19 °C und aus über 21 °C. Dazwischen bleibt der Zustand, wie er ist."]
    ],
    tabelle: { titel: "Polling oder Interrupt?",
      kopf: ["", "Polling (Abfrage)", "Interrupt (Ereignis)"],
      zeilen: [
        ["Wer wird aktiv?", "das Programm fragt regelmäßig", "die Hardware meldet sich selbst"],
        ["Reaktionszeit", "bis zu einem ganzen Intervall", "sofort"],
        ["Aufwand", "einfach", "komplexer"],
        ["Ressourcen", "fragt auch, wenn nichts passiert", "nur bei Ereignissen aktiv"],
        ["passt zu", "langsam veränderlichen Werten (Temperatur)", "seltenen, kurzen Ereignissen (Taster, Türkontakt)"]
      ] },
    code: [
      { titel: "Thermostat mit Polling und Hysterese (Pseudocode)", text:
`konstante INTERVALL = 10   // Sekunden
konstante EIN_UNTER = 19.0 // °C
konstante AUS_UEBER = 21.0 // °C

solange wahr
    // die Bibliothek liest den Sensor
    temp ← sensor.leseTemperatur()
    wenn temp < EIN_UNTER dann
        heizung.ein()      // Aktor
    sonst wenn temp > AUS_UEBER dann
        heizung.aus()      // Aktor
    // dazwischen nichts tun: Hysterese
    speichere(jetzt(), temp) // 4 Byte
    warte(INTERVALL)` },
      { titel: "Interrupt: die Hardware ruft auf", text:
`// Interrupt-Handler: läuft sofort,
// wenn der Taster gedrückt wird
bei taster.gedrueckt()
    tuer.oeffnen()         // Aktor
    protokolliere(jetzt(), "Taster")` },
      { titel: "Datenmenge berechnen", text:
`1 Messwert alle 10 s, je 4 Byte
Messungen pro Tag:
  86.400 s ÷ 10 s = 8.640
Datenmenge pro Tag:
  8.640 × 4 Byte = 34.560 Byte
  34.560 ÷ 1.024 = 33,75 KiB
Datenmengen mit Binärpräfix (KiB),
Datenraten dezimal (kbit/s, Mbit/s).` }
    ],
    merke: "Sensor misst, Software entscheidet, Aktor handelt. Polling = regelmäßig fragen, Interrupt = sofort reagieren. Datenmenge = Messungen × Bytes — Datenmengen in KiB/MiB angeben.",
    karten: ["k14", "k15", "k16", "k17"],
    quiz: [
      { id: "cp1", f: "Welches Bauteil ist ein Aktor?",
        o: ["Ein Stellmotor, der ein Ventil öffnet", "Ein Temperaturfühler", "Ein Bewegungsmelder", "Ein Lichtsensor"], r: [0],
        w: "Актор выполняет действие (мотор, клапан, реле). Остальные варианты — датчики: они только измеряют." },
      { id: "cp2", f: "Ein Programm fragt einen Türkontakt alle 5 Sekunden ab. Was ist der wichtigste Nachteil?",
        o: ["Ein kurzes Öffnen zwischen zwei Abfragen kann übersehen werden, und die Reaktion kommt bis zu 5 Sekunden zu spät.", "Der Türkontakt geht dadurch kaputt.", "Polling braucht immer ein Netzwerk.", "Polling funktioniert nur mit analogen Sensoren."], r: [0],
        w: "При опросе реакция запаздывает до одного интервала, а короткое событие между двумя опросами можно пропустить. Решение — прерывание или более короткий интервал." },
      { id: "cp3", f: "Welche Vorteile hat ein Interrupt gegenüber Polling? (alle richtigen ankreuzen)",
        o: ["Das Programm reagiert sofort auf das Ereignis.", "Der Prozessor muss nicht ständig nachfragen und spart Energie.", "Ein Interrupt ist immer einfacher zu programmieren.", "Ein Interrupt funktioniert ohne Sensor."], r: [0, 1],
        w: "Прерывание даёт мгновенную реакцию и экономит ресурсы. Минус — программировать сложнее (обработчик события, параллельность)." },
      { id: "cp4", f: "Ein Sensor liefert alle 10 Sekunden einen Messwert mit 4 Byte. Wie groß ist die Datenmenge pro Tag?",
        o: ["33,75 KiB", "3,375 KiB", "337,5 KiB", "34,56 MiB"], r: [0],
        w: "86 400 с ÷ 10 с = 8 640 измерений; 8 640 × 4 байта = 34 560 байт; 34 560 ÷ 1 024 = 33,75 KiB. Объёмы данных указывают с двоичными префиксами (KiB)." },
      { id: "cp5", f: "Ein Temperatursensor liefert eine Spannung zwischen 0 und 5 V. Der Mikrocontroller hat einen 10-Bit-A/D-Wandler. Wie viele Stufen kann er unterscheiden?",
        o: ["1.024", "10", "512", "100"], r: [0],
        w: "10 бит дают 2¹⁰ = 1 024 значения (0…1 023). Чем больше бит, тем тоньше разрешение." },
      { id: "cp6", f: "Eine Heizung soll nicht ständig an- und ausgehen, wenn die Temperatur um 20 °C schwankt. Was hilft?",
        o: ["Zwei Schaltgrenzen (Hysterese), z. B. an unter 19 °C und aus über 21 °C", "Den Sensor öfter abfragen", "Einen zweiten Aktor einbauen", "Die Messwerte nur speichern und nicht auswerten"], r: [0],
        w: "Гистерезис: включение и выключение на разных порогах. Между ними состояние не меняется, и реле не щёлкает постоянно." },
      { id: "cp7", f: "Warum nutzt man für einen Sensor oft eine fertige Bibliothek? (alle richtigen ankreuzen)",
        o: ["Sie kapselt das Protokoll (z. B. I²C); man ruft nur eine Methode auf.", "Sie ist meist schon getestet und spart Entwicklungszeit.", "Man muss dann keine Lizenz mehr beachten.", "Der Sensor misst dadurch genauer als im Datenblatt angegeben."], r: [0, 1],
        w: "Библиотека скрывает низкоуровневый доступ и уже проверена другими. Лицензию и поддержку библиотеки всё равно проверяют, а точность датчика она не повышает." },
      { id: "cp8", f: "Wovon hängt ein sinnvoller Abfragerhythmus vor allem ab?",
        o: ["Wie schnell sich der Messwert ändert und wie schnell das System reagieren muss", "Von der Farbe des Gehäuses", "Nur vom Preis des Sensors", "Von der Anzahl der Programmierer im Team"], r: [0],
        w: "Интервал выбирают по скорости изменения величины и нужному времени реакции. Слишком часто — много данных и энергии, слишком редко — поздняя реакция." },
      { id: "cp9", f: "Welches Beispiel ist ein cyber-physisches System?",
        o: ["Eine Bewässerungsanlage misst die Bodenfeuchte und öffnet bei Trockenheit ein Ventil.", "Eine Tabellenkalkulation berechnet Umsätze.", "Ein Texteditor speichert Dateien.", "Eine Webseite zeigt Öffnungszeiten an."], r: [0],
        w: "КФС = программа + датчик (влажность) + актор (клапан), связанные с физическим процессом. Остальные примеры — программы без связи с физическим миром." }
    ]
  });

  /* ========================================================= Bedrohungen */
  T.push({
    id: "bedrohungen", titel: "Bedrohungen und Schutzmaßnahmen", ru: "Угрозы и меры защиты", teil: "GA1+GA2",
    katalog: "AP2 01.04.01–06 (S. 19): Schäden, Ransomware, Phishing, Man-in-the-Middle, SQL-Injection, DDoS, TOM, Security by Design, Pentest",
    links: [["https://ap2.online/security/bedrohungen", "Bedrohungen"], ["https://ap2.online/security/sicherheit", "IT-Sicherheit"]],
    kurzRu: "Для каждой угрозы отвечай на три вопроса: что происходит, какая цель защиты нарушена и что помогает. Man-in-the-Middle перехватывает связь (TLS с проверкой сертификата, VPN), SQL-инъекция подмешивает SQL-код во ввод (Prepared Statements, минимальные права), XSS внедряет скрипт в страницу (экранирование вывода), DDoS перегружает сервер (защитный сервис провайдера, ограничение запросов). Меры по DSGVO делятся на технические и организационные (TOM), защиту проверяют сканированием уязвимостей и пентестом, а Security by Design закладывает безопасность с первого дня.",
    punkte: [
      ["Risiko und Schaden", "риск и ущерб", "Risiko = Eintrittswahrscheinlichkeit × Schadenshöhe. Mögliche Schäden: Datenverlust, wirtschaftlicher Schaden (Ausfall, Strafen) und Imageschaden (Kunden verlieren Vertrauen)."],
      ["Man-in-the-Middle", "атака «человек посередине»", "Ein Angreifer schaltet sich unbemerkt zwischen zwei Partner, z. B. über ein gefälschtes WLAN. Er kann mitlesen und Daten verändern. Schutz: TLS/HTTPS mit Prüfung des Zertifikats, VPN; Zertifikatswarnungen nie wegklicken."],
      ["SQL-Injection", "SQL-инъекция", "Der Angreifer schreibt SQL-Code in ein Eingabefeld. Baut das Programm die Eingabe direkt in den SQL-Befehl ein, führt die Datenbank den fremden Code aus. Folgen: Daten lesen, ändern oder löschen, Login umgehen."],
      ["Schutz gegen SQL-Injection", "защита от SQL-инъекций", "Prepared Statements mit Platzhaltern: Die Eingabe bleibt Daten und wird nie Code. Dazu: Eingaben prüfen (Whitelist), Datenbankbenutzer mit minimalen Rechten, keine technischen Fehlermeldungen an den Nutzer."],
      ["Cross-Site-Scripting (XSS)", "межсайтовый скриптинг", "Der Angreifer bringt JavaScript in eine Webseite, z. B. über ein Kommentarfeld. Der Browser anderer Nutzer führt es aus und kann z. B. ihre Sitzung stehlen. Schutz: Ausgaben maskieren (HTML-Encoding), Eingaben prüfen, Content Security Policy, Cookies mit HttpOnly."],
      ["DDoS", "распределённая атака «отказ в обслуживании»", "Distributed Denial of Service: Viele gekaperte Geräte (Botnetz) überfluten einen Server mit Anfragen. Der Dienst ist nicht mehr erreichbar — die Verfügbarkeit ist verletzt. Schutz: DDoS-Schutzdienst beim Provider, Lastverteilung, Anfragen begrenzen (Rate Limiting)."],
      ["Ransomware und Phishing", "шифровальщики и фишинг", "Ransomware verschlüsselt Daten und fordert Lösegeld; dagegen helfen Offline-Backups, Updates und Schulungen. Phishing lockt mit gefälschten Mails auf falsche Seiten, um Zugangsdaten zu stehlen (Identitätsdiebstahl); dagegen helfen MFA, Schulungen und Mailfilter."],
      ["TOM nach DSGVO", "технические и организационные меры", "Art. 32 DSGVO verlangt technische und organisatorische Maßnahmen. Technisch: z. B. Verschlüsselung, Zugriffsrechte, Backup, Protokollierung. Organisatorisch: z. B. Rollenkonzept, Schulung, Besucherausweise, Löschkonzept. Ihre Wirksamkeit muss man regelmäßig prüfen."],
      ["Schwachstellenanalyse und Penetrationstest", "анализ уязвимостей и пентест", "Schwachstellenanalyse (Scan): Ein Werkzeug sucht automatisch bekannte Lücken, z. B. alte Versionen und offene Ports. Penetrationstest: Fachleute greifen das System mit Erlaubnis gezielt an, wie ein echter Angreifer. Am Ende steht ein Bericht mit Maßnahmen."],
      ["Identity & Access Management (IAM)", "управление учётными записями и доступом", "Zentrale Verwaltung aller Benutzerkonten und Rechte: anlegen beim Eintritt, ändern beim Wechsel der Abteilung, sperren beim Austritt. Dazu gehören Rollen, MFA und Single Sign-on."],
      ["Security by Design", "безопасность с этапа проектирования", "Sicherheit wird von Anfang an mitgeplant, nicht am Ende angehängt: Bedrohungen früh analysieren, sichere Voreinstellungen, minimale Rechte, Eingaben prüfen, Daten verschlüsseln. Später nachbessern ist teurer."],
      ["IT-Grundschutz (BSI)", "базовая защита ИТ по методике BSI", "Methode des BSI: den Schutzbedarf bestimmen (normal, hoch, sehr hoch) und für jedes System die passenden Bausteine mit Maßnahmen umsetzen. So lassen sich Systeme objektiv bewerten."]
    ],
    tabelle: { titel: "Bedrohung, Schutzziel, Schutz",
      kopf: ["Bedrohung", "verletztes Schutzziel", "Schutz"],
      zeilen: [
        ["Man-in-the-Middle", "Vertraulichkeit, Integrität", "TLS mit Zertifikatsprüfung, VPN"],
        ["SQL-Injection", "Vertraulichkeit, Integrität", "Prepared Statements, minimale DB-Rechte"],
        ["XSS", "Vertraulichkeit", "Ausgaben maskieren, CSP"],
        ["DDoS", "Verfügbarkeit", "Schutzdienst, Rate Limiting"],
        ["Ransomware", "Verfügbarkeit", "Offline-Backup, Updates"],
        ["Phishing", "Vertraulichkeit", "MFA, Schulung"]
      ] },
    code: [
      { titel: "SQL-Injection und Prepared Statement (Java)", text:
`// UNSICHER: Eingabe wird Teil von SQL
String sql =
  "SELECT * FROM kunde WHERE name = '"
  + eingabe + "'";
// Eingabe: ' OR '1'='1
// SQL: ... WHERE name = '' OR '1'='1'
// → immer wahr → alle Datensätze!

// SICHER: Platzhalter ?
PreparedStatement ps =
  con.prepareStatement(
  "SELECT * FROM kunde WHERE name = ?");
ps.setString(1, eingabe); // nur Text
ResultSet rs = ps.executeQuery();` },
      { titel: "XSS: unsicher und sicher anzeigen (JavaScript)", text:
`// Kommentar eines Angreifers:
// <script>
//   senden(document.cookie)
// </script>

// UNSICHER: das Skript läuft
feld.innerHTML = kommentar;
// SICHER: wird nur als Text gezeigt
feld.textContent = kommentar;` }
    ],
    merke: "Zu jeder Bedrohung: Was passiert? Welches Schutzziel? Welche Maßnahme? SQL-Injection → Prepared Statements. Man-in-the-Middle → TLS mit Zertifikatsprüfung. DDoS → Verfügbarkeit schützen.",
    karten: ["k18", "k19", "k20", "k21", "k22", "a33", "s73"],
    quiz: [
      { id: "bd1", f: "Ein Angreifer gibt im Login-Feld ' OR '1'='1 ein und ist danach angemeldet. Welcher Angriff ist das?",
        o: ["SQL-Injection", "Cross-Site-Scripting", "DDoS", "Phishing"], r: [0],
        w: "Ввод стал частью SQL-запроса, условие всегда истинно — вход без пароля. Это SQL-инъекция." },
      { id: "bd2", f: "Welche Maßnahmen verringern zusätzlich den Schaden einer SQL-Injection? (alle richtigen ankreuzen)",
        o: ["Der Datenbankbenutzer der Anwendung bekommt nur die nötigen Rechte.", "Technische Fehlermeldungen werden dem Nutzer nicht angezeigt.", "Die Anwendung verbindet sich mit dem Administratorkonto der Datenbank.", "Eingaben werden direkt in den SQL-Text eingefügt."], r: [0, 1],
        w: "Минимальные права ограничивают ущерб (например, нельзя удалить таблицы), а скрытые технические сообщения не выдают атакующему структуру базы. Работа под администратором и склейка строк, наоборот, опасны." },
      { id: "bd3", f: "Im öffentlichen WLAN eines Cafés liest ein Angreifer den Datenverkehr mit und verändert ihn. Wie heißt der Angriff?",
        o: ["Man-in-the-Middle", "SQL-Injection", "Brute Force", "Ransomware"], r: [0],
        w: "Злоумышленник встал между пользователем и сервером (поддельная точка доступа) — это Man-in-the-Middle. Защита: HTTPS с проверкой сертификата, VPN." },
      { id: "bd4", f: "Der Browser zeigt bei der Webseite der eigenen Bank eine Zertifikatswarnung. Was ist richtig?",
        o: ["Nicht weitermachen — es kann ein Man-in-the-Middle-Angriff sein.", "Die Warnung wegklicken, weil die Bank bekannt ist.", "Die Seite einfach mit http statt https aufrufen.", "Das Passwort zur Sicherheit zweimal eingeben."], r: [0],
        w: "Предупреждение о сертификате может означать подмену сервера (MITM). Продолжать нельзя, а http вообще без шифрования." },
      { id: "bd5", f: "Ein Onlineshop ist nicht erreichbar, weil Tausende gekaperte Geräte ihn gleichzeitig mit Anfragen überfluten. Welches Schutzziel ist verletzt?",
        o: ["Verfügbarkeit", "Vertraulichkeit", "Integrität", "Authentizität"], r: [0],
        w: "DDoS не крадёт данные, а делает сервис недоступным — нарушена доступность (Verfügbarkeit)." },
      { id: "bd6", f: "Ein Angreifer speichert im Kommentarfeld eines Forums JavaScript, das bei jedem Besucher ausgeführt wird. Welche Gegenmaßnahme passt?",
        o: ["Ausgaben maskieren (HTML-Encoding), damit der Kommentar nur als Text erscheint", "Prepared Statements in der Datenbank", "Einen größeren Server kaufen", "Die Kommentare in einer CSV-Datei speichern"], r: [0],
        w: "Это XSS. Защита — экранировать вывод (HTML-Encoding), проверять ввод, Content Security Policy, cookie с HttpOnly. Prepared Statements защищают от SQL-инъекций, а не от XSS." },
      { id: "bd7", f: "Was unterscheidet einen Penetrationstest von einem Schwachstellenscan?",
        o: ["Beim Penetrationstest greifen Fachleute mit Erlaubnis gezielt an; der Scan sucht automatisch nach bekannten Lücken.", "Beides ist dasselbe.", "Der Scan ist ein echter Angriff von Kriminellen.", "Der Penetrationstest prüft nur die Rechtschreibung im Code."], r: [0],
        w: "Сканер автоматически ищет известные уязвимости (старые версии, открытые порты). Пентест — разрешённая целенаправленная атака специалистов: можно ли реально проникнуть и каков ущерб." },
      { id: "bd8", f: "Welche Beispiele sind organisatorische Maßnahmen (TOM)? (alle richtigen ankreuzen)",
        o: ["Schulungen der Mitarbeiter zur IT-Sicherheit", "Besucherausweise und Regeln für Besucher", "Verschlüsselung der Festplatten", "Firewall"], r: [0, 1],
        w: "Организационные меры — правила, обучение, процессы, пропуска. Шифрование и межсетевой экран — технические меры." },
      { id: "bd9", f: "Videoüberwachung und Besucherausweise am Serverraum gehören zu welcher Kontrolle?",
        o: ["Zutrittskontrolle", "Zugangskontrolle", "Zugriffskontrolle", "Weitergabekontrolle"], r: [0],
        w: "Zutritt — физический доступ в помещение (сигнализация, видеонаблюдение, пропуска). Zugang — вход в систему (блокировка экрана с паролем, биометрия, чип-карта). Zugriff — права на данные." },
      { id: "bd10", f: "Was bedeutet Security by Design?",
        o: ["Sicherheit wird von Anfang an in Planung und Entwicklung berücksichtigt.", "Sicherheit wird erst nach dem Livegang getestet.", "Die Oberfläche bekommt ein Schloss-Symbol.", "Nur der Administrator kümmert sich um Sicherheit."], r: [0],
        w: "Безопасность закладывают с самого начала: анализ угроз, безопасные настройки по умолчанию, минимальные права, проверка ввода. Исправлять потом дороже." }
    ]
  });

  /* ============================================================ Testen 2 */
  T.push({
    id: "testen2", titel: "Testen vertieft: TDD, Automatisierung, Last- und Performancetests", ru: "Тестирование углублённо: TDD, автоматизация, нагрузка", teil: "GA1+GA2",
    katalog: "AP2 02.03.08 (S. 22): TDD, Unit-Test, E2E, print-Debugging; 01.03 (S. 18): Last- und Performancetest, Testdatengeneratoren",
    links: [["https://ap2.online/quality/testing", "Softwaretests"], ["https://ap2.online/architektur/architektur", "CI/CD"]],
    kurzRu: "TDD: сначала пишут падающий тест (Red), затем минимальный код, чтобы он прошёл (Green), потом улучшают код при зелёных тестах (Refactor). Автотесты запускаются при каждом изменении (Continuous Integration), а по пирамиде тестов unit-тестов много, интеграционных меньше, E2E-тестов мало. Нагрузочные тесты отличаются целью: Lasttest — ожидаемая нагрузка, Stresstest — выше предела до отказа, Dauertest — долгая работа (утечки памяти).",
    punkte: [
      ["TDD (Test-Driven Development)", "разработка через тестирование", "Erst der Test, dann der Code. Zyklus Red – Green – Refactor: Test schreiben und scheitern sehen (rot), nur so viel Code schreiben, bis er besteht (grün), dann den Code aufräumen — die Tests bleiben grün."],
      ["Vor- und Nachteile von TDD", "плюсы и минусы TDD", "Vorteile: Jede Funktion hat Tests, Fehler fallen sofort auf, Änderungen sind sicher, der Code wird gut testbar. Nachteile: am Anfang mehr Aufwand, die Tests müssen gepflegt werden, nicht bedachte Fälle bleiben ungetestet."],
      ["Aufbau eines Unit-Tests (AAA)", "структура юнит-теста", "Arrange: Testdaten vorbereiten. Act: die Methode aufrufen. Assert: das Ergebnis mit dem erwarteten Wert vergleichen, z. B. assertEquals(erwartet, ist)."],
      ["Mock und Stub", "заглушки", "Ersatzobjekte für echte Abhängigkeiten wie Datenbank oder Webservice. Ein Stub liefert feste Antworten, ein Mock prüft zusätzlich, ob er richtig aufgerufen wurde. So testet man eine Klasse allein, schnell und wiederholbar."],
      ["Testautomatisierung und CI", "автоматизация тестов и непрерывная интеграция", "Tests laufen per Werkzeug (z. B. JUnit, pytest) ohne Handarbeit. Bei Continuous Integration baut ein Server nach jedem Push das Projekt und startet alle Tests. Fehler fallen sofort auf, und Regressionstests kosten fast nichts."],
      ["Testpyramide", "пирамида тестов", "Unten viele Unit-Tests (schnell, billig), in der Mitte weniger Integrationstests, oben wenige End-to-End-Tests über die Oberfläche (langsam, aufwendig, anfällig für Änderungen)."],
      ["Testabdeckung (Code Coverage)", "покрытие кода тестами", "Ein Werkzeug misst, welcher Anteil der Anweisungen oder Zweige beim Testen ausgeführt wurde. 100 % heißt nicht fehlerfrei: Man sieht nur, was lief, nicht, ob alles richtig geprüft wurde."],
      ["Performancetest", "тест производительности", "Misst Antwortzeit, Durchsatz (Anfragen pro Sekunde) und Auslastung (CPU, Speicher) unter festgelegten Bedingungen. Das Ziel ist messbar, z. B. 95 % der Anfragen in unter 2 Sekunden."],
      ["Last-, Stress- und Dauertest", "нагрузочный, стресс- и длительный тест", "Lasttest: erwartete Last, auch Spitzen (z. B. 500 Nutzer gleichzeitig). Stresstest: über die Grenze hinaus, bis das System versagt, und prüfen, ob es sich danach erholt. Dauertest: Last über viele Stunden; findet z. B. Speicherlecks."],
      ["Testdaten und Testdatengenerator", "тестовые данные и генератор", "Testdaten enthalten normale Werte, Grenzwerte und falsche Eingaben. Ein Testdatengenerator erzeugt viele realistische, aber erfundene Datensätze — gut für Lasttests und ohne echte personenbezogene Daten (DSGVO)."],
      ["print-Debugging und Logging", "отладочный вывод и журналирование", "print-Debugging: Variablenwerte ausgeben, um den Ablauf zu verfolgen — einfach, aber danach wieder entfernen. Im Betrieb besser: Logging mit Stufen (DEBUG, INFO, WARN, ERROR). Für Einzelschritte: Debugger mit Haltepunkten."]
    ],
    tabelle: { titel: "Welcher Belastungstest?",
      kopf: ["Test", "Frage", "Beispiel"],
      zeilen: [
        ["Performancetest", "Wie schnell antwortet das System?", "95 % der Suchen in unter 2 s"],
        ["Lasttest", "Hält es die erwartete Last aus?", "500 Nutzer gleichzeitig, Spitze am Montagmorgen"],
        ["Stresstest", "Wo ist die Grenze, und was passiert darüber?", "Nutzerzahl steigern bis zum Ausfall, dann Neustart prüfen"],
        ["Dauertest", "Bleibt es lange stabil?", "24 Stunden Last, Speicherverbrauch beobachten"]
      ] },
    code: [
      { titel: "TDD Schritt für Schritt (Java, JUnit)", text:
`// 1. RED: erst der Test — die Methode
//    versandkosten() gibt es noch nicht
@Test
void abFuenfzigEuroVersandfrei() {
    // Arrange
    Warenkorb w = new Warenkorb();
    w.hinzu(new Artikel("Buch", 50.0));
    // Act
    double v = w.versandkosten();
    // Assert
    assertEquals(0.00, v, 0.001);
}

// 2. GREEN: so wenig Code wie möglich
double versandkosten() {
    return summe() >= 50 ? 0.00 : 4.90;
}

// 3. REFACTOR: Konstanten statt Zahlen,
//    die Tests bleiben grün
static final double GRENZE = 50.00;
static final double VERSAND = 4.90;` },
      { titel: "Stub statt echter Datenbank", text:
`class RepoStub implements KundenRepo {
    public Kunde finde(int id) {
        // feste Antwort, keine DB
        return new Kunde(id, "Test AG");
    }
}
RechnungService s =
    new RechnungService(new RepoStub());` }
    ],
    merke: "TDD = Red – Green – Refactor. Viele schnelle Unit-Tests, wenige End-to-End-Tests. Lasttest = erwartete Last, Stresstest = über die Grenze, Dauertest = lange Zeit.",
    karten: ["k23", "k24", "k25", "k26", "a15", "a13"],
    quiz: [
      { id: "tz1", f: "Ein neuer Test ist sofort grün, obwohl die Funktion noch gar nicht programmiert ist. Was bedeutet das nach TDD?",
        o: ["Der Test prüft wahrscheinlich nichts Sinnvolles — ein neuer Test muss zuerst rot sein.", "Alles ist gut, man kann gleich weitermachen.", "Jetzt muss man sofort Refactoring machen.", "Der Compiler ist kaputt."], r: [0],
        w: "В TDD новый тест сначала должен упасть (Red) — так видно, что он действительно проверяет новое поведение. Сразу зелёный тест, скорее всего, ничего не проверяет." },
      { id: "tz2", f: "Was passiert im Schritt „Refactor“ bei TDD?",
        o: ["Der Code wird verbessert (Namen, Struktur, Doppeltes), ohne das Verhalten zu ändern; alle Tests bleiben grün.", "Neue Funktionen werden ohne Test ergänzt.", "Alle Tests werden gelöscht.", "Der Test wird so geändert, dass er besteht."], r: [0],
        w: "Рефакторинг — улучшение структуры кода без изменения поведения; зелёные тесты показывают, что ничего не сломалось." },
      { id: "tz3", f: "Welche Aussagen zur Testpyramide stimmen? (alle richtigen ankreuzen)",
        o: ["Es sollte viele schnelle Unit-Tests geben.", "End-to-End-Tests sind langsam und aufwendig, deshalb gibt es weniger davon.", "Man testet am besten nur über die Oberfläche.", "Unit-Tests ersetzen alle anderen Tests."], r: [0, 1],
        w: "В основании пирамиды — много быстрых unit-тестов, на вершине — немного медленных E2E-тестов через интерфейс. Нужны все уровни, но в разной пропорции." },
      { id: "tz4", f: "Eine Klasse RechnungService liest Kunden aus der Datenbank. Wie testet man sie schnell und ohne echte Datenbank?",
        o: ["Mit einem Stub oder Mock, der die Datenbank ersetzt", "Gar nicht — ohne Datenbank kann man nicht testen", "Nur mit einem Lasttest", "Mit der Produktivdatenbank"], r: [0],
        w: "Заглушка (Stub или Mock) подменяет зависимость: тест быстрый, повторяемый и не трогает настоящие данные." },
      { id: "tz5", f: "Ein Shop wird mit immer mehr Nutzern belastet, bis er nicht mehr antwortet. Danach prüft man, ob er wieder sauber startet. Welcher Test ist das?",
        o: ["Stresstest", "Lasttest", "Dauertest", "Unit-Test"], r: [0],
        w: "Стресс-тест выходит за пределы ожидаемой нагрузки до отказа и проверяет восстановление. Lasttest — ожидаемая нагрузка, Dauertest — долгая работа." },
      { id: "tz6", f: "Eine Anwendung läuft 24 Stunden unter normaler Last. Der Speicherverbrauch steigt dabei langsam immer weiter. Welcher Test zeigt das, und was ist die wahrscheinliche Ursache?",
        o: ["Dauertest — wahrscheinlich ein Speicherleck", "Stresstest — zu viele Nutzer", "Unit-Test — falscher Rückgabewert", "Abnahmetest — falsche Anforderung"], r: [0],
        w: "Длительный тест (Dauertest) выявляет то, что копится со временем: утечки памяти, переполнение журналов." },
      { id: "tz7", f: "Was bedeutet eine Testabdeckung (Code Coverage) von 100 %?",
        o: ["Jede Anweisung wurde beim Testen mindestens einmal ausgeführt — Fehler kann es trotzdem geben.", "Das Programm ist garantiert fehlerfrei.", "Alle Anforderungen des Kunden sind erfüllt.", "Es gibt genauso viele Tests wie Klassen."], r: [0],
        w: "Покрытие показывает, что код выполнялся во время тестов, но не то, что результаты проверены правильно и все случаи учтены." },
      { id: "tz8", f: "Warum lässt man bei Continuous Integration nach jedem Push automatisch alle Tests laufen?",
        o: ["Fehler und Regressionen fallen sofort auf, solange die Änderung noch klein ist.", "Damit man keinen Code mehr schreiben muss.", "Weil manuelle Tests verboten sind.", "Damit der Server ausgelastet ist."], r: [0],
        w: "При CI после каждого изменения сборка и тесты запускаются автоматически: ошибка видна сразу, и её легко найти в небольшом изменении." },
      { id: "tz9", f: "Wozu dient ein Testdatengenerator? (alle richtigen ankreuzen)",
        o: ["Er erzeugt schnell viele realistische Datensätze, z. B. für einen Lasttest.", "Man muss keine echten personenbezogenen Daten zum Testen verwenden.", "Er ersetzt die Abnahme durch den Kunden.", "Er findet automatisch alle Fehler im Code."], r: [0, 1],
        w: "Генератор создаёт много правдоподобных, но вымышленных данных — для нагрузочных тестов и без нарушения DSGVO." },
      { id: "tz10", f: "Ein Entwickler schreibt System.out.println(\"summe = \" + summe) in eine Schleife, um einen Fehler zu finden. Was stimmt?",
        o: ["Das ist print-Debugging: einfach, aber die Ausgaben müssen danach wieder entfernt werden.", "Das ist ein automatischer Unit-Test.", "Das ist ein Lasttest.", "Dadurch wird der Fehler automatisch behoben."], r: [0],
        w: "Отладочный вывод показывает значения переменных во время работы. Это быстро, но потом вывод убирают или заменяют журналированием; удобнее — отладчик с точками останова." }
    ]
  });

  /* ========================================================= Architektur */
  T.push({
    id: "architektur", titel: "Softwarearchitektur: Schichten, Client-Server, MVC, MVVM", ru: "Архитектура ПО", teil: "GA1+GA2",
    katalog: "AP2 02.04.12 (S. 23): Architektur-Pattern, MVC; 02.04.03: Modularisierung; 02.01.04 (S. 20): Client-Server und Peer-to-Peer",
    links: [["https://ap2.online/architektur/architektur", "Drei-Schichten-Architektur, Data Binding"], ["https://ap2.online/designpatterns/mvcpattern", "MVC"]],
    kurzRu: "Архитектура описывает крупные части программы и то, как они взаимодействуют; цель — слабая связанность и ясные обязанности. Многослойная архитектура (представление, логика, данные) разделяет задачи, в модели клиент-сервер клиенты обращаются к центральному серверу, а в peer-to-peer все узлы равноправны. MVC и MVVM отделяют интерфейс от данных (в MVVM View связан с ViewModel через Data Binding), монолит развёртывается целиком, микросервисы — маленькими независимыми сервисами.",
    punkte: [
      ["Softwarearchitektur", "архитектура ПО", "Die grobe Struktur einer Anwendung: Welche Teile gibt es, was macht jeder Teil, wie arbeiten sie zusammen? Ziel: lose Kopplung (Teile hängen wenig voneinander ab) und hohe Kohäsion (jeder Teil hat eine klare Aufgabe)."],
      ["Schichtenarchitektur", "многослойная архитектура", "Die Anwendung wird in Schichten geteilt; jede Schicht nutzt nur die Schicht darunter. Typisch sind drei Schichten: Präsentation (Oberfläche), Geschäftslogik, Datenhaltung (Datenbankzugriff)."],
      ["Vor- und Nachteile von Schichten", "плюсы и минусы слоёв", "Vorteile: Schichten sind austauschbar (z. B. eine neue Oberfläche), einzeln testbar, und Teams können parallel arbeiten. Nachteile: mehr Code und mehr Aufrufe, jede Anfrage läuft durch alle Schichten."],
      ["Client-Server", "клиент-сервер", "Clients schicken Anfragen, ein zentraler Server bietet Dienste und Daten an. Vorteile: Daten, Rechte und Backups sind zentral. Nachteile: Fällt der Server aus, steht alles (Single Point of Failure), und der Server muss die ganze Last tragen."],
      ["Peer-to-Peer", "одноранговая сеть", "Alle Rechner sind gleichberechtigt; jeder ist Client und Server zugleich. Gut für sehr kleine Netze oder verteilte Dateien. Nachteil: keine zentrale Verwaltung, Sicherheit und Backup sind schwierig."],
      ["Thin Client und Fat Client", "тонкий и толстый клиент", "Thin Client: zeigt nur an, die Logik läuft auf dem Server (z. B. Webanwendung im Browser). Fat (Rich) Client: viel Logik auf dem Gerät, arbeitet auch offline, muss aber auf jedem Gerät installiert und aktualisiert werden."],
      ["2-Tier und 3-Tier", "двух- и трёхзвенная архитектура", "2-Tier: Der Client spricht direkt mit dem Datenbankserver. 3-Tier: Dazwischen liegt ein Anwendungsserver mit der Geschäftslogik. Vorteile von 3-Tier: Logik an einer Stelle, Datenbank nicht direkt erreichbar, besser skalierbar."],
      ["MVC", "модель — представление — контроллер", "Model = Daten und Logik, View = Anzeige, Controller = nimmt Eingaben an und steuert Model und View. Typisch für Webanwendungen."],
      ["MVVM", "модель — представление — модель представления", "Model – View – ViewModel. Das ViewModel bereitet die Daten für die View auf und bietet Befehle an. View und ViewModel sind über Data Binding verbunden. Das ViewModel kennt die View nicht und lässt sich ohne Oberfläche testen."],
      ["Data Binding", "привязка данных", "Automatische Verbindung zwischen Oberfläche und Daten. One-Way: Daten → Anzeige. Two-Way: Eingaben in der Anzeige ändern die Daten sofort mit, und umgekehrt."],
      ["Monolith und Microservices", "монолит и микросервисы", "Monolith: eine Anwendung, die als Ganzes gebaut und ausgeliefert wird — einfach, aber schwer einzeln zu skalieren. Microservices: viele kleine, unabhängige Dienste mit eigener Datenhaltung, verbunden über APIs (z. B. REST). Einzeln auslieferbar und skalierbar, aber Betrieb und Fehlersuche sind aufwendiger."]
    ],
    tabelle: { titel: "MVC und MVVM im Vergleich",
      kopf: ["", "MVC", "MVVM"],
      zeilen: [
        ["Vermittler", "Controller", "ViewModel"],
        ["Eingaben", "gehen an den Controller", "gehen über Data Binding und Befehle an das ViewModel"],
        ["kennt der Vermittler die View?", "ja, er wählt und aktualisiert sie", "nein"],
        ["Testbarkeit", "Model und Controller testbar", "ViewModel ohne Oberfläche testbar"],
        ["typisch", "Webanwendungen", "Desktop- und Mobile-Apps (z. B. WPF, .NET MAUI, Android)"]
      ] },
    code: [
      { titel: "Drei Schichten (Java, vereinfacht)", text:
`// Präsentation: annehmen und anzeigen
class KundenController {
    String zeige(int id) {
        Kunde k = service.holeKunde(id);
        return k.getName();
    }
}

// Geschäftslogik: Regeln, kein SQL
class KundenService {
    Kunde holeKunde(int id) {
        Kunde k = repo.finde(id);
        if (k == null)
            throw new NichtGefunden(id);
        return k;
    }
}

// Datenhaltung: nur Datenbankzugriff
class KundenRepository {
    Kunde finde(int id) {
        // SELECT ... WHERE id = ?
    }
}` },
      { titel: "MVVM: Data Binding (C#/XAML, vereinfacht)", text:
`// das ViewModel kennt die View nicht
class KundeViewModel {
    public string Name { get; set; }
    public ICommand Speichern { get; }
}

<!-- View (XAML) -->
<TextBox Text="{Binding Name}" />
<Button Command="{Binding Speichern}"
        Content="Speichern" />` }
    ],
    merke: "Schichten: Jede nutzt nur die darunter. Client-Server = zentral, Peer-to-Peer = gleichberechtigt. MVC: Der Controller steuert. MVVM: ViewModel + Data Binding, das ViewModel kennt die View nicht.",
    karten: ["k27", "k28", "k29", "k30", "a06"],
    quiz: [
      { id: "ar1", f: "Welche drei Schichten hat eine klassische Drei-Schichten-Architektur?",
        o: ["Präsentation, Geschäftslogik, Datenhaltung", "Model, View, Controller", "Client, Router, Server", "Analyse, Entwurf, Test"], r: [0],
        w: "Слои: представление (интерфейс), бизнес-логика, хранение данных. MVC — шаблон для интерфейса, а анализ, проектирование и тест — фазы разработки." },
      { id: "ar2", f: "In einer Schichtenarchitektur schickt die Oberfläche SQL-Befehle direkt an die Datenbank. Was ist das Problem?",
        o: ["Die Schichtentrennung ist verletzt: Oberfläche und Datenbank sind eng gekoppelt und schwer austauschbar.", "Kein Problem, das ist schneller und deshalb empfohlen.", "SQL funktioniert technisch nur in der Logikschicht.", "Die Datenbank wird dadurch automatisch verschlüsselt."], r: [0],
        w: "Каждый слой обращается только к нижележащему. Прямой SQL из интерфейса связывает его со структурой базы: заменять и тестировать трудно, логика дублируется." },
      { id: "ar3", f: "Welche Aussagen passen zu MVVM? (alle richtigen ankreuzen)",
        o: ["View und ViewModel sind über Data Binding verbunden.", "Das ViewModel kennt die konkrete View nicht und ist ohne Oberfläche testbar.", "Der Controller zeichnet die Oberfläche.", "MVVM verbietet ein Model."], r: [0, 1],
        w: "MVVM: Model — данные, ViewModel — подготовленные данные и команды для View, связь через Data Binding; ViewModel не знает View, поэтому его легко тестировать. Контроллера в MVVM нет." },
      { id: "ar4", f: "Ein Nutzer tippt seinen Namen in ein Textfeld, und das Attribut name im ViewModel ändert sich sofort mit. Wie heißt das?",
        o: ["Two-Way Data Binding", "One-Way Data Binding", "Polling", "Peer-to-Peer"], r: [0],
        w: "Двусторонняя привязка: изменения в интерфейсе сразу попадают в данные, и наоборот. One-Way — только данные → отображение." },
      { id: "ar5", f: "Was ist ein typischer Nachteil der Client-Server-Architektur?",
        o: ["Fällt der zentrale Server aus, können alle Clients nicht mehr arbeiten (Single Point of Failure).", "Daten lassen sich nicht zentral sichern.", "Rechte können nicht zentral vergeben werden.", "Jeder Client muss Server für alle anderen sein."], r: [0],
        w: "Центральный сервер — единая точка отказа и узкое место по нагрузке. Зато данные, права и бэкапы централизованы. «Каждый — сервер» — это peer-to-peer." },
      { id: "ar6", f: "Ein Büro mit drei Mitarbeitern teilt ohne Server einige Ordner direkt zwischen den PCs. Welches Konzept ist das?",
        o: ["Peer-to-Peer", "Client-Server", "3-Tier-Architektur", "Microservices"], r: [0],
        w: "Все компьютеры равноправны и сами раздают папки — это peer-to-peer. Для маленькой группы просто, но нет центрального управления и бэкапа." },
      { id: "ar7", f: "Warum nutzt man für eine Webanwendung oft eine 3-Tier-Architektur mit Anwendungsserver? (alle richtigen ankreuzen)",
        o: ["Die Geschäftslogik liegt zentral und muss nicht auf jedem Client installiert werden.", "Die Datenbank ist nicht direkt aus dem Internet erreichbar.", "Der Browser kann dann ohne Netzwerk arbeiten.", "Man braucht keine Datenbank mehr."], r: [0, 1],
        w: "Трёхзвенная архитектура: логика централизована на сервере приложений, база данных скрыта за ним — безопаснее и проще масштабировать." },
      { id: "ar8", f: "Ein Onlineshop besteht aus den Diensten Katalog, Warenkorb und Zahlung. Jeder Dienst hat eine eigene Datenbank und wird einzeln ausgeliefert. Welche Architektur ist das?",
        o: ["Microservices", "Monolith", "Peer-to-Peer", "2-Tier"], r: [0],
        w: "Микросервисы: маленькие независимые сервисы со своими данными, общаются через API, выпускаются и масштабируются по отдельности. Минус — сложнее эксплуатация." },
      { id: "ar9", f: "Was bedeutet „lose Kopplung“?",
        o: ["Bausteine hängen wenig voneinander ab und lassen sich einzeln ändern oder austauschen.", "Alle Klassen greifen direkt auf alle anderen zu.", "Die Anwendung hat keine Schnittstellen.", "Der Server ist nur locker verkabelt."], r: [0],
        w: "Слабая связанность: модули знают друг о друге минимум (через интерфейсы), поэтому изменение одного не тянет цепочку правок в других." }
    ]
  });

  /* =========================================================== Qualität */
  T.push({
    id: "qualitaet", titel: "Softwarequalität: Merkmale nach ISO 25010 und Prüfmethoden", ru: "Качество ПО: характеристики и их проверка", teil: "GA1",
    katalog: "AP2 02.03.01 (S. 22): Qualitätsmerkmale von Funktionalität bis Übertragbarkeit, Normen; 01.03 (S. 18): Parität, Soll-Ist-Vergleich",
    links: [["https://ap2.online/quality/qualitaetsmanagement", "Qualitätsmanagement"]],
    kurzRu: "Качество ПО описывают характеристиками: в каталоге IHK это функциональность, надёжность, удобство использования, эффективность, изменяемость (сопровождаемость) и переносимость, а ISO/IEC 25010 добавляет безопасность и совместимость. Требование к качеству формулируют измеримо, и для каждой характеристики есть способ проверки: функциональный тест, нагрузочный тест, юзабилити-тест, код-ревью и статический анализ, установка на целевых системах. Отклонение от цели считают в Soll-Ist-Vergleich, а ошибки передачи данных простым способом обнаруживает бит чётности.",
    punkte: [
      ["Qualitätsmerkmale im Prüfungskatalog", "характеристики качества в каталоге", "Funktionalität, Zuverlässigkeit, Benutzbarkeit, Effizienz, Änderbarkeit (Wartbarkeit), Übertragbarkeit. Das sind die Merkmale der älteren Norm ISO 9126. Mit ihnen beschreibt man nicht-funktionale Anforderungen."],
      ["ISO/IEC 25010", "стандарт ISO/IEC 25010", "Nachfolger von ISO 9126. Die Fassung von 2011 hat 8 Merkmale: funktionale Eignung, Leistungseffizienz, Kompatibilität, Benutzbarkeit, Zuverlässigkeit, Sicherheit, Wartbarkeit, Übertragbarkeit. Die Fassung von 2023 hat 9: Neu ist Safety (Schutz von Menschen und Umwelt); Usability heißt dort Interaction Capability, Portability heißt Flexibility."],
      ["Funktionalität (funktionale Eignung)", "функциональность", "Die Software tut, was gefordert ist: vollständig, richtig und passend zur Aufgabe. Prüfen: Funktionstests (Black-Box) gegen das Pflichtenheft, Abnahmetest."],
      ["Zuverlässigkeit", "надёжность", "Die Software läuft stabil, ist verfügbar, verträgt Fehler (Fehlertoleranz) und kann nach einem Absturz die Daten wiederherstellen. Prüfen: Dauertest, Ausfalltest, Verfügbarkeit messen."],
      ["Benutzbarkeit", "удобство использования", "Leicht zu lernen und zu bedienen, schützt vor Bedienfehlern, barrierefrei. Prüfen: Usability-Test mit echten Nutzern, Befragung, Prüfung nach ISO 9241-110."],
      ["Effizienz (Leistungseffizienz)", "эффективность", "Kurze Antwortzeiten und wenig Verbrauch von CPU, Speicher und Netz. Prüfen: Performance- und Lasttest, Profiler."],
      ["Wartbarkeit (Änderbarkeit)", "сопровождаемость (изменяемость)", "Der Code ist verständlich, modular und gut testbar; Änderungen und Erweiterungen sind leicht. Prüfen: Code-Review, statische Codeanalyse (z. B. zu komplexe Methoden, doppelter Code), Testabdeckung, Coding-Richtlinien."],
      ["Übertragbarkeit (Portabilität)", "переносимость", "Die Software läuft auch in anderen Umgebungen und lässt sich leicht installieren und austauschen. Prüfen: auf allen Zielsystemen installieren und testen, z. B. Windows und Linux, verschiedene Browser."],
      ["Sicherheit und Kompatibilität", "безопасность и совместимость", "Sicherheit: Schutz vor unberechtigtem Zugriff — prüfen mit Penetrationstest, Schwachstellenscan und Code-Review. Kompatibilität: Zusammenarbeit mit anderen Systemen — prüfen mit Schnittstellen- und Integrationstests."],
      ["messbare Qualitätsanforderung", "измеримое требование к качеству", "Nicht „schnell“, sondern: „Bei 200 gleichzeitigen Nutzern antwortet die Suche in 95 % der Fälle in unter 2 Sekunden.“ Nur eine Zahl lässt sich bei der Abnahme prüfen."],
      ["Soll-Ist-Vergleich", "сравнение плана и факта", "Der gemessene Wert (Ist) wird mit dem Ziel (Soll) verglichen. Abweichung = Ist − Soll; in Prozent: (Ist − Soll) ÷ Soll × 100 %. Danach werden Maßnahmen geplant und es wird erneut gemessen."],
      ["Paritätsprüfung", "проверка чётности", "Einfaches Prüfverfahren für Daten: Ein Paritätsbit wird so angehängt, dass die Anzahl der Einsen gerade ist (gerade Parität). Kippt ein Bit, stimmt die Parität nicht mehr — der Fehler wird erkannt, aber nicht korrigiert. Zwei gekippte Bits bleiben unentdeckt."]
    ],
    tabelle: { titel: "Merkmal, messbare Anforderung, Prüfung",
      kopf: ["Merkmal", "Beispiel für eine messbare Anforderung", "so wird geprüft"],
      zeilen: [
        ["Funktionalität", "Die Rechnung enthält alle Positionen und die richtige Umsatzsteuer.", "Funktionstest, Abnahmetest"],
        ["Zuverlässigkeit", "Verfügbarkeit 99,5 % im Monat", "Monitoring, Dauertest"],
        ["Benutzbarkeit", "Neue Nutzer legen ohne Schulung in 3 Minuten einen Auftrag an.", "Usability-Test mit Nutzern"],
        ["Effizienz", "95 % der Suchen in unter 2 s bei 200 Nutzern", "Performance- und Lasttest"],
        ["Wartbarkeit", "Testabdeckung mindestens 80 %, keine Methode über 30 Zeilen", "Code-Review, statische Analyse"],
        ["Übertragbarkeit", "Läuft in den aktuellen Versionen von Chrome, Firefox und Edge.", "Test auf jeder Zielplattform"],
        ["Sicherheit", "Passwörter nur als Hash mit Salt", "Penetrationstest, Code-Review"]
      ] },
    code: [
      { titel: "Gerade Parität", text:
`Regel: Einsen + Paritätsbit = gerade

Daten 1011001 → 4 Einsen → Bit 0
gesendet: 1011001 0

Daten 1110000 → 3 Einsen → Bit 1
gesendet: 1110000 1

Empfangen: 1001001 0
→ 3 Einsen: ungerade
→ ein Bit ist gekippt: Fehler erkannt` },
      { titel: "Soll-Ist-Vergleich", text:
`Soll: 2,0 s       Ist: 2,6 s
Abweichung: 2,6 s − 2,0 s = 0,6 s
in Prozent: 0,6 ÷ 2,0 × 100 %
          = 30 % über dem Soll
Immer durch das Soll teilen!
→ Ursache suchen, Maßnahme planen,
  danach neu messen` }
    ],
    merke: "Katalog: Funktionalität, Zuverlässigkeit, Benutzbarkeit, Effizienz, Wartbarkeit/Änderbarkeit, Übertragbarkeit. Jede Qualitätsanforderung braucht eine Zahl und eine Methode, die sie prüft. Abweichung in Prozent: immer durch das Soll teilen.",
    karten: ["k31", "k32", "k33", "k34", "a39"],
    quiz: [
      { id: "qu1", f: "Eine Anwendung soll ohne Änderungen unter Windows und unter Linux laufen. Welches Qualitätsmerkmal ist gemeint?",
        o: ["Übertragbarkeit (Portabilität)", "Zuverlässigkeit", "Funktionalität", "Benutzbarkeit"], r: [0],
        w: "Переносимость — работа в разных средах (операционные системы, браузеры), лёгкая установка и замена." },
      { id: "qu2", f: "Welche Methode prüft vor allem die Wartbarkeit?",
        o: ["Code-Review und statische Codeanalyse", "Lasttest mit 1.000 Nutzern", "Usability-Test mit Kunden", "Penetrationstest"], r: [0],
        w: "Сопровождаемость — это понятность и модульность кода: ревью, статический анализ (сложность, дубликаты), покрытие тестами. Нагрузочный тест проверяет эффективность, юзабилити-тест — удобство, пентест — безопасность." },
      { id: "qu3", f: "„Neue Mitarbeiter sollen ohne Schulung in höchstens 3 Minuten einen Auftrag anlegen können.“ Zu welchem Merkmal gehört das, und wie prüft man es?",
        o: ["Benutzbarkeit — Usability-Test mit neuen Nutzern und Zeitmessung", "Effizienz — Lasttest", "Zuverlässigkeit — Dauertest", "Übertragbarkeit — Installationstest"], r: [0],
        w: "Лёгкость освоения и работы — это Benutzbarkeit; проверяют юзабилити-тестом с реальными новыми пользователями и замером времени." },
      { id: "qu4", f: "Welche Qualitätsmerkmale nennt der Prüfungskatalog bei „Softwareanforderungen erfassen“? (alle richtigen ankreuzen)",
        o: ["Zuverlässigkeit", "Effizienz", "Programmiersprache", "Preis"], r: [0, 1],
        w: "В каталоге: Funktionalität, Zuverlässigkeit, Benutzbarkeit, Effizienz, Änderbarkeit/Wartbarkeit, Übertragbarkeit. Язык программирования и цена — не характеристики качества продукта." },
      { id: "qu5", f: "Welches Merkmal ist in ISO/IEC 25010 ein eigenes Hauptmerkmal, in der alten ISO 9126 aber nicht?",
        o: ["Sicherheit", "Zuverlässigkeit", "Effizienz", "Benutzbarkeit"], r: [0],
        w: "В ISO 9126 безопасность была частью функциональности; в ISO/IEC 25010 Sicherheit (Security) — отдельная характеристика, как и совместимость." },
      { id: "qu6", f: "Soll: 2,0 Sekunden Antwortzeit. Gemessen (Ist): 2,5 Sekunden. Wie groß ist die Abweichung in Prozent?",
        o: ["25 % über dem Soll", "20 % über dem Soll", "0,5 % über dem Soll", "125 % unter dem Soll"], r: [0],
        w: "(Ist − Soll) ÷ Soll × 100 % = (2,5 − 2,0) ÷ 2,0 × 100 % = 25 %. Делят на Soll; 0,5 ÷ 2,5 = 20 % — типичная ошибка." },
      { id: "qu7", f: "Gerade Parität: Die Daten 1101001 enthalten vier Einsen. Welches Paritätsbit wird angehängt?",
        o: ["0", "1", "Das hängt vom Empfänger ab", "Es werden zwei Bits angehängt"], r: [0],
        w: "При чётной чётности число единиц вместе с битом чётности должно быть чётным. Единиц уже четыре, значит бит чётности — 0." },
      { id: "qu8", f: "Bei einer Übertragung mit Paritätsbit kippen zwei Bits gleichzeitig. Was passiert?",
        o: ["Der Fehler wird nicht erkannt, weil die Parität wieder stimmt.", "Der Fehler wird erkannt und automatisch korrigiert.", "Die Übertragung bricht immer ab.", "Das Paritätsbit verdoppelt sich."], r: [0],
        w: "Бит чётности замечает только нечётное число ошибок: две ошибки компенсируют друг друга. И даже одну ошибку он не исправляет, а только обнаруживает." },
      { id: "qu9", f: "„Nach einem Absturz sind spätestens nach 10 Minuten alle Daten bis zur letzten Buchung wieder da.“ Zu welchem Qualitätsmerkmal gehört diese Anforderung?",
        o: ["Zuverlässigkeit (Wiederherstellbarkeit)", "Benutzbarkeit", "Übertragbarkeit", "Wartbarkeit"], r: [0],
        w: "Восстановление после сбоя — часть надёжности (Zuverlässigkeit), вместе с отказоустойчивостью и доступностью." }
    ]
  });

  /* ============================================================ Prozesse */
  T.push({
    id: "prozesse", titel: "Geschäftsprozesse modellieren: EPK und BPMN", ru: "Моделирование бизнес-процессов: EPK и BPMN", teil: "GA1",
    katalog: "AP2 · Anhang „Notationen“ (S. 34–35): EPK und BPMN; Vorbemerkung: Platz für neue Methoden wie UML und BPMN",
    links: [],
    kurzRu: "Бизнес-процесс показывают как цепочку действий от начала до результата. В EPK шестиугольник — событие, скруглённый прямоугольник — функция; цепочка начинается и заканчивается событием, события и функции чередуются, а после события не бывает ветвления XOR или ИЛИ. В BPMN круги — события (тонкий — начало, жирный — конец), ромбы — шлюзы (X — ровно один путь, O — один или несколько, + — все сразу), пулы и дорожки показывают участников, сплошная стрелка — поток последовательности, пунктир — сообщения между пулами.",
    punkte: [
      ["Geschäftsprozess", "бизнес-процесс", "Eine Folge von Tätigkeiten mit Start und Ende, die ein Ergebnis liefert, z. B. „Bestellung bearbeiten“. Man modelliert ihn, um ihn zu verstehen, zu verbessern oder als Software umzusetzen."],
      ["EPK: Ereignis und Funktion", "EPK: событие и функция", "Ereignis (Sechseck): ein Zustand, der eingetreten ist, z. B. „Bestellung ist eingegangen“. Funktion (abgerundetes Rechteck): eine Tätigkeit, z. B. „Bestellung prüfen“. Pfeile (Kontrollfluss) verbinden sie."],
      ["EPK: Regeln", "правила EPK", "Eine EPK beginnt und endet mit einem Ereignis. Ereignisse und Funktionen wechseln sich ab. Auf ein Ereignis darf kein XOR- oder ODER-Konnektor folgen, denn ein Ereignis kann nichts entscheiden — entscheiden ist eine Funktion."],
      ["EPK: Konnektoren", "соединители EPK", "UND (∧): alle Wege. XOR (exklusives Oder): genau ein Weg. ODER (∨): mindestens ein Weg. Was ein Konnektor aufteilt, führt man meist mit demselben Konnektor wieder zusammen."],
      ["erweiterte EPK (eEPK)", "расширенная EPK", "Zusätzlich gibt es Organisationseinheiten (Oval mit Strich, z. B. „Vertrieb“) und Informationsobjekte (Rechteck, z. B. „Kundendaten“). So sieht man, wer etwas tut und welche Daten dafür nötig sind."],
      ["BPMN", "нотация BPMN", "Business Process Model and Notation: internationaler Standard für Prozessdiagramme. Grundelemente: Aufgabe (Task, abgerundetes Rechteck), Ereignisse (Kreise), Gateways (Rauten) und Flüsse (Pfeile)."],
      ["BPMN: Ereignisse", "события BPMN", "Startereignis: dünner Kreis. Zwischenereignis: doppelter Kreis. Endereignis: dicker Kreis. Ein Symbol im Kreis zeigt die Art: Brief = Nachricht, Uhr = Zeit (Timer), Blitz = Fehler (Exception)."],
      ["BPMN: Gateways", "шлюзы BPMN", "Raute mit X: exklusiv, genau ein Weg. Raute mit Kreis (O): inklusiv, ein oder mehrere Wege. Raute mit +: parallel, alle Wege gleichzeitig."],
      ["Pool und Lane", "пул и дорожка", "Ein Pool steht für einen Beteiligten, z. B. den Kunden oder die Firma. Lanes teilen den Pool in Rollen oder Abteilungen, z. B. Vertrieb und Lager. Sequenzfluss (durchgezogener Pfeil) läuft innerhalb eines Pools, Nachrichtenfluss (gestrichelt) verbindet verschiedene Pools."],
      ["EPK oder BPMN?", "EPK или BPMN", "Die EPK ist vor allem in Deutschland verbreitet (ARIS, SAP) und leicht zu lesen. BPMN ist international genormt, zeigt Beteiligte und Nachrichten genauer und kann von Workflow-Systemen sogar ausgeführt werden."]
    ],
    tabelle: { titel: "Symbole im Überblick",
      kopf: ["Bedeutung", "EPK", "BPMN"],
      zeilen: [
        ["Tätigkeit", "Funktion (abgerundetes Rechteck)", "Task (abgerundetes Rechteck)"],
        ["Zustand, Auslöser", "Ereignis (Sechseck)", "Ereignis (Kreis: Start dünn, Ende dick)"],
        ["genau ein Weg", "XOR-Konnektor", "exklusives Gateway (Raute mit X)"],
        ["ein oder mehrere Wege", "ODER-Konnektor (∨)", "inklusives Gateway (Raute mit O)"],
        ["alle Wege", "UND-Konnektor (∧)", "paralleles Gateway (Raute mit +)"],
        ["wer?", "Organisationseinheit", "Pool und Lane"],
        ["Daten", "Informationsobjekt (Rechteck)", "Datenobjekt (Blatt mit Ecke)"],
        ["Ablauf", "Kontrollfluss (Pfeil)", "Sequenzfluss (durchgezogen), Nachrichtenfluss (gestrichelt)"]
      ] },
    code: [
      { titel: "EPK „Bestellung bearbeiten“ (als Text)", text:
`(E) Bestellung eingegangen
 |
[F] Bestand prüfen
 |
(XOR)---------------+
 |                  |
(E) vorrätig       (E) nicht vorrätig
 |                  |
[F] versenden      [F] nachbestellen
 |                  |
(E) versendet      (E) nachbestellt
 |                  |
(XOR)---------------+
 |
[F] Kunden informieren
 |
(E) Kunde informiert

(E) = Ereignis (Sechseck)
[F] = Funktion (abgerundetes Rechteck)
Die Verzweigung folgt auf eine Funktion.` }
    ],
    merke: "EPK: Ereignis – Funktion – Ereignis …; Start und Ende sind Ereignisse; nach einem Ereignis kein XOR und kein ODER. BPMN: X = genau einer, O = einer oder mehrere, + = alle; Nachrichtenfluss nur zwischen Pools.",
    karten: ["k35", "k36", "k37"],
    quiz: [
      { id: "pm1", f: "Mit welchem Element beginnt und endet eine EPK?",
        o: ["Mit einem Ereignis", "Mit einer Funktion", "Mit einem XOR-Konnektor", "Mit einer Organisationseinheit"], r: [0],
        w: "EPK начинается и заканчивается событием (шестиугольник); события и функции чередуются." },
      { id: "pm2", f: "Eine EPK zeigt: Ereignis „Antrag ist eingegangen“ → XOR → zwei Wege. Was ist falsch?",
        o: ["Auf ein Ereignis darf kein XOR folgen; die Entscheidung trifft eine Funktion wie „Antrag prüfen“.", "Nichts, das ist korrekt.", "Ein Ereignis darf nie am Anfang stehen.", "XOR gibt es in der EPK nicht."], r: [0],
        w: "Событие пассивно и ничего не решает. Ветвление XOR или ИЛИ ставят после функции, которая принимает решение." },
      { id: "pm3", f: "Welches BPMN-Gateway bedeutet: Alle ausgehenden Wege laufen gleichzeitig?",
        o: ["Raute mit + (parallel)", "Raute mit X (exklusiv)", "Raute mit Kreis (inklusiv)", "Doppelter Kreis"], r: [0],
        w: "+ — параллельный шлюз: все пути одновременно. X — ровно один путь, O — один или несколько. Двойной круг — промежуточное событие." },
      { id: "pm4", f: "Wie wird in BPMN ein Endereignis dargestellt?",
        o: ["Kreis mit dicker Linie", "Kreis mit dünner Linie", "Kreis mit doppelter Linie", "Sechseck"], r: [0],
        w: "Начальное событие — тонкий круг, промежуточное — двойной, конечное — жирный. Шестиугольник — событие в EPK." },
      { id: "pm5", f: "Der Kunde (eigener Pool) schickt eine Bestellung an den Onlineshop (anderer Pool). Welche Verbindung zeichnet man?",
        o: ["Nachrichtenfluss (gestrichelter Pfeil)", "Sequenzfluss (durchgezogener Pfeil)", "Eine Linie ohne Pfeil", "Keine — Pools haben keine Verbindung"], r: [0],
        w: "Между пулами (разными участниками) — только поток сообщений, пунктиром. Сплошной поток последовательности — внутри одного пула." },
      { id: "pm6", f: "Wofür stehen Lanes in einem BPMN-Pool?",
        o: ["Für Rollen oder Abteilungen innerhalb eines Beteiligten", "Für einzelne Datenobjekte", "Für Zeitereignisse", "Für Fehlerfälle"], r: [0],
        w: "Пул — участник процесса (фирма, клиент), дорожки (Lanes) — роли или отделы внутри него, например Vertrieb и Lager." },
      { id: "pm7", f: "Nach der Funktion „Antrag prüfen“ gibt es genau zwei mögliche Ergebnisse: genehmigt oder abgelehnt. Welcher Konnektor passt?",
        o: ["XOR", "UND", "ODER", "Kein Konnektor nötig"], r: [0],
        w: "Наступает ровно один из двух исходов — исключающее ИЛИ (XOR). UND означал бы, что наступают оба события." },
      { id: "pm8", f: "Welche Aussagen zu BPMN stimmen? (alle richtigen ankreuzen)",
        o: ["BPMN ist ein internationaler Standard.", "Ein Brief im Kreis zeigt ein Nachrichtenereignis.", "In BPMN müssen sich Ereignisse und Aufgaben immer abwechseln.", "BPMN kennt keine Verzweigungen."], r: [0, 1],
        w: "BPMN — международный стандарт (ISO/IEC 19510); символ внутри круга показывает тип события: письмо — сообщение, часы — таймер. Строгое чередование — правило EPK, а не BPMN." }
    ]
  });

  /* ============================================================= Skripte */
  T.push({
    id: "skripte", titel: "Skripte: Abläufe automatisieren und überwachen", ru: "Скрипты: автоматизация и контроль", teil: "GA2",
    katalog: "AP2 02.03.07 (S. 22): wiederkehrende Systemabläufe mit Skripten automatisieren und überwachen — Bash, PowerShell, Python",
    links: [],
    kurzRu: "Скрипт — небольшая программа на интерпретируемом языке для повторяющихся задач: резервное копирование, очистка журналов, создание пользователей, отчёты. Bash — оболочка Linux, PowerShell — оболочка Microsoft (по конвейеру передаёт объекты), Python работает везде и богат библиотеками. Скрипты запускают по расписанию (cron, Планировщик заданий Windows) и контролируют через код завершения (0 — успех), журнал и уведомления.",
    punkte: [
      ["Skript", "скрипт", "Ein kleines Programm in einer interpretierten Sprache. Es erledigt wiederkehrende Aufgaben automatisch: Backups, alte Logdateien löschen, Benutzer anlegen, Berichte erstellen. Vorteile: spart Zeit, macht weniger Fehler als Handarbeit, läuft immer gleich."],
      ["Bash", "командная оболочка Linux", "Die Shell unter Linux und macOS. Erste Zeile: #!/bin/bash (Shebang). Variable setzen: ZIEL=\"/backup\", lesen: $ZIEL. Befehle lassen sich mit | (Pipe) verketten; > schreibt in eine Datei, >> hängt an."],
      ["PowerShell", "оболочка PowerShell", "Die Shell von Microsoft (Windows, auch Linux). Befehle (Cmdlets) heißen Verb-Nomen, z. B. Get-ChildItem, Remove-Item, Get-Service. Die Pipeline gibt Objekte weiter, nicht nur Text."],
      ["Python", "язык Python", "Skriptsprache für alle Systeme, gut lesbar, mit vielen Bibliotheken, z. B. für Dateien, CSV und HTTP. Gut für größere Auswertungen, z. B. Logdateien analysieren."],
      ["Zeitplanung", "запуск по расписанию", "Linux: cron mit einer Zeile in der crontab: Minute Stunde Tag Monat Wochentag Befehl. Beispiel: 0 2 * * * /opt/backup.sh = jeden Tag um 2:00 Uhr. Windows: Aufgabenplanung (Task Scheduler)."],
      ["Exit-Code", "код завершения", "Jedes Programm gibt am Ende eine Zahl zurück: 0 = Erfolg, alles andere = Fehler. In Bash steht sie in $?. Ein Skript prüft sie und reagiert, z. B. mit einer Meldung an den Admin."],
      ["Überwachen", "контроль выполнения", "Ein Skript schreibt ein Protokoll (Log) mit Zeit und Ergebnis. Bei Fehlern schickt es eine Meldung, z. B. per E-Mail, oder meldet sich beim Monitoring. So fällt ein fehlgeschlagenes Backup sofort auf."],
      ["gute Skripte", "хорошие скрипты", "Kommentare, Parameter statt fester Pfade, Fehler abfangen, erst mit Testdaten ausprobieren. Keine Passwörter im Klartext ins Skript schreiben. Nur mit den nötigen Rechten laufen lassen."]
    ],
    tabelle: { titel: "Bash, PowerShell, Python",
      kopf: ["", "Bash", "PowerShell", "Python"],
      zeilen: [
        ["läuft auf", "Linux, macOS", "Windows, auch Linux", "allen Systemen"],
        ["Dateien zeigen", "ls", "Get-ChildItem", "os.listdir()"],
        ["Variable", "X=5 (lesen: $X)", "$x = 5", "x = 5"],
        ["Pipeline", "Text", "Objekte", "—"],
        ["mit Fehler beenden", "exit 1", "exit 1", "sys.exit(1)"]
      ] },
    code: [
      { titel: "Backup mit Aufräumen (Bash)", text:
`#!/bin/bash
# Projekt sichern, Sicherungen
# älter als 30 Tage löschen
QUELLE="/srv/projekt"
ZIEL="/backup"
LOG="/var/log/backup.log"
DATUM=$(date +%Y-%m-%d)
DATEI="$ZIEL/projekt_$DATUM.tar.gz"

tar -czf "$DATEI" "$QUELLE"
if [ $? -ne 0 ]; then
    echo "$DATUM FEHLER" >> "$LOG"
    exit 1
fi
find "$ZIEL" -name "projekt_*.tar.gz" \\
     -mtime +30 -delete
echo "$DATUM OK" >> "$LOG"
exit 0

# crontab: jeden Tag um 2:00 Uhr
# 0 2 * * * /opt/backup.sh` },
      { titel: "Alte Logdateien löschen (PowerShell)", text:
`# Logdateien älter als 30 Tage löschen
$grenze = (Get-Date).AddDays(-30)
Get-ChildItem "C:\\Logs" -Filter *.log |
  Where-Object {
    $_.LastWriteTime -lt $grenze
  } |
  Remove-Item` },
      { titel: "Fehler im Log zählen (Python)", text:
`anzahl = 0
with open("app.log") as datei:
    for zeile in datei:
        if "ERROR" in zeile:
            anzahl += 1
print(anzahl, "Fehler gefunden")
if anzahl > 0:
    # Exit-Code 1 für das Monitoring
    raise SystemExit(1)` }
    ],
    merke: "Wiederkehrende Aufgabe → Skript + Zeitplan (cron oder Aufgabenplanung). Exit-Code 0 = Erfolg. Protokollieren und bei Fehlern melden — sonst merkt niemand, dass das Backup fehlt.",
    karten: ["k38", "k39", "k40"],
    quiz: [
      { id: "sk1", f: "Was bedeutet die crontab-Zeile 0 2 * * * /opt/backup.sh?",
        o: ["Das Skript läuft jeden Tag um 2:00 Uhr.", "Das Skript läuft alle 2 Minuten.", "Das Skript läuft am 2. Tag jedes Monats um 0:00 Uhr.", "Das Skript läuft zweimal am Tag."], r: [0],
        w: "Поля cron: минута, час, день месяца, месяц, день недели. 0 2 * * * — минута 0, час 2, каждый день." },
      { id: "sk2", f: "Ein Skript endet mit dem Exit-Code 0. Was bedeutet das?",
        o: ["Es ist erfolgreich gelaufen.", "Es ist mit einem Fehler abgebrochen.", "Es wurde nie gestartet.", "Es läuft noch."], r: [0],
        w: "Код 0 — успех, любое другое число — ошибка. Мониторинг и другие скрипты проверяют именно этот код." },
      { id: "sk3", f: "Was ist typisch für PowerShell? (alle richtigen ankreuzen)",
        o: ["Cmdlets heißen nach dem Muster Verb-Nomen, z. B. Get-Service.", "Die Pipeline gibt Objekte weiter.", "Sie läuft ausschließlich unter Linux.", "Jedes Skript muss vor dem Start kompiliert werden."], r: [0, 1],
        w: "PowerShell: командлеты по схеме «глагол-существительное», по конвейеру передаются объекты. Работает в Windows, а современная версия — и в Linux, macOS; скрипты не компилируют." },
      { id: "sk4", f: "Was macht dieser Bash-Befehl?", code: "find /var/log/app -name \"*.log\" -mtime +30 -delete",
        o: ["Er löscht .log-Dateien, die älter als 30 Tage sind.", "Er löscht alle Dateien außer den .log-Dateien.", "Er sucht 30 Logdateien und zeigt sie an.", "Er erstellt 30 neue Logdateien."], r: [0],
        w: "find ищет в каталоге файлы *.log, изменённые более 30 дней назад (-mtime +30), и удаляет их (-delete)." },
      { id: "sk5", f: "Ein nächtliches Backup-Skript schlägt fehl, aber niemand merkt es wochenlang. Was fehlt?",
        o: ["Überwachung: Exit-Code prüfen, Log schreiben und bei Fehlern eine Meldung schicken", "Ein schnellerer Server", "Eine grafische Oberfläche", "Mehr Kommentare im Code"], r: [0],
        w: "Автоматизация без контроля опасна: нужно проверять код завершения, вести журнал и отправлять уведомления (почта, мониторинг)." },
      { id: "sk6", f: "Welche Regeln gelten für gute Skripte? (alle richtigen ankreuzen)",
        o: ["Keine Passwörter im Klartext im Skript speichern", "Erst mit Testdaten ausprobieren, dann produktiv einsetzen", "Immer mit Administratorrechten ausführen", "Pfade und Werte fest überall im Code verteilen"], r: [0, 1],
        w: "Пароли хранят в защищённом хранилище, сначала проверяют на тестовых данных, запускают с минимальными правами, пути передают параметрами." },
      { id: "sk7", f: "Welchen Vorteil hat ein Skript gegenüber derselben Aufgabe von Hand?",
        o: ["Es läuft immer gleich ab, spart Zeit und vermeidet Tippfehler.", "Es muss nie gepflegt werden.", "Es ist immer schneller als ein kompiliertes Programm.", "Es braucht keine Rechte."], r: [0],
        w: "Скрипт повторяет шаги одинаково и без ошибок по невнимательности, экономит время. Но его тоже нужно сопровождать." }
    ]
  });

  /* ======================================================================
     Einordnen: hinter das verwandte Thema, sonst vor „Prüfungstaktik“.
     Reihenfolge der Verarbeitung so, dass Anker unter den neuen Themen
     schon eingefügt sind.
     ====================================================================== */
  const NACH = {
    architektur: "muster", testen2: "tests", qualitaet: "testen2", bedrohungen: "auth",
    prozesse: "anforderungen", skripte: "werkzeuge", cps: "skripte", netz: "cps",
    betrieb: "netz", speicher: "betrieb"
  };
  const REIHE = ["architektur", "testen2", "qualitaet", "bedrohungen", "prozesse", "skripte", "cps", "netz", "betrieb", "speicher"];
  const liste = Array.isArray(root.AP2_THEMEN) ? root.AP2_THEMEN : (root.AP2_THEMEN = []);
  const stelle = id => liste.findIndex(x => x && x.id === id);
  REIHE.forEach(id => {
    const t = T.find(x => x.id === id);
    if (!t) return;
    t.anzahl = (t.quiz || []).length;
    const alt = stelle(id);
    if (alt >= 0) { liste[alt] = t; return; }              /* zweimal geladen: ersetzen */
    let i = stelle(NACH[id]);
    if (i >= 0) { liste.splice(i + 1, 0, t); return; }
    i = stelle("taktik");
    if (i >= 0) liste.splice(i, 0, t); else liste.push(t);
  });

  root.AP2_THEMEN_KATALOG = T.map(t => t.id);
  if (typeof module === "object" && module.exports) module.exports = T;
})(typeof window !== "undefined" ? window : globalThis);
