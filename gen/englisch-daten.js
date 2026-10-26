/* ============================================================================
   gen/englisch-daten.js — Englische Fachtexte für GA1 (eigene Texte)
   ----------------------------------------------------------------------------
   In 6 von 10 GA1 steht ein englischer Text (≈ 15 Punkte): Man liest ihn und
   antwortet AUF DEUTSCH mit Operatoren wie „Nennen Sie“, „Erläutern Sie“.
   Diese Texte sind eigene, kurze Texte im Stil der Prüfung (keine Kopien).

   Aufgabe: { id, titel (de), ru, situation (de), text: [Absatz (en)],
     vokabeln: [[en, de, ru]],
     fragen: [ { art: "wahl", frage, optionen, soll }                 — automatisch geprüft
             | { art: "offen", frage, punkte, muster, kriterien:[…] } ] — Selbstprüfung }
   ========================================================================== */
"use strict";
(function (root) {
  const T = [
    {
      id: "cloud-migration", titel: "Migration in die Cloud", ru: "Переезд в облако",
      situation: "Ihr Betrieb plant, den eigenen Dateiserver durch einen Cloud-Speicher zu ersetzen. Die Geschäftsleitung hat dazu einen Artikel gefunden.",
      text: [
        "Moving file storage to the cloud can reduce costs for hardware and maintenance. Instead of buying servers every few years, a company pays a monthly fee based on the storage it actually uses. Updates and security patches are installed by the provider.",
        "However, a migration must be planned carefully. First, the company should classify its data: which files contain personal data or business secrets? This data may only be stored with a provider that complies with the GDPR and keeps the data in the European Union.",
        "Second, the available bandwidth is critical. If many employees open large files at the same time, a slow internet connection becomes a bottleneck. A pilot phase with one department helps to measure real usage before all users are moved.",
        "Finally, the company should not forget an exit strategy. If the provider raises prices or closes its service, it must be possible to export all data in a standard format."
      ],
      vokabeln: [["fee", "Gebühr", "плата"], ["provider", "Anbieter", "поставщик услуги"], ["to comply with", "einhalten", "соблюдать"], ["bandwidth", "Bandbreite", "пропускная способность"], ["bottleneck", "Engpass", "узкое место"], ["exit strategy", "Ausstiegsstrategie", "стратегия выхода"]],
      fragen: [
        { art: "wahl", frage: "Welche Aussage passt zum Text?", optionen: ["Der Anbieter installiert Updates und Sicherheitspatches.", "Personenbezogene Daten dürfen in der Cloud nicht gespeichert werden.", "Eine Pilotphase ist nur bei kleinen Firmen nötig.", "Die Cloud ist immer schneller als ein eigener Server."], soll: 0 },
        { art: "offen", frage: "Nennen Sie zwei Vorteile des Cloud-Speichers laut Text.", punkte: 2,
          muster: "Geringere Kosten für Hardware und Wartung; man zahlt nur den Speicher, den man nutzt (monatliche Gebühr); Updates und Sicherheitspatches installiert der Anbieter.",
          kriterien: ["Vorteil 1 aus dem Text (Kosten Hardware/Wartung oder nutzungsabhängige Gebühr)", "Vorteil 2 aus dem Text (Updates/Patches durch Anbieter)"] },
        { art: "offen", frage: "Erläutern Sie, welche Anforderung laut Text für personenbezogene Daten gilt.", punkte: 3,
          muster: "Personenbezogene Daten und Geschäftsgeheimnisse dürfen nur bei einem Anbieter gespeichert werden, der die DSGVO einhält und die Daten in der EU speichert. Dazu muss die Firma ihre Daten vorher klassifizieren.",
          kriterien: ["DSGVO einhalten", "Speicherung in der EU", "Daten vorher klassifizieren (welche Daten sind betroffen)"] },
        { art: "offen", frage: "Erläutern Sie den Begriff „Ausstiegsstrategie“ (exit strategy) im Zusammenhang des Textes.", punkte: 2,
          muster: "Die Firma plant schon vorher, wie sie den Anbieter wieder verlassen kann, z. B. bei Preiserhöhung oder Einstellung des Dienstes: Alle Daten müssen in einem Standardformat exportiert werden können.",
          kriterien: ["Anlass: Preiserhöhung oder Ende des Dienstes", "Daten in Standardformat exportierbar"] }
      ]
    },
    {
      id: "api-doku", titel: "Dokumentation einer REST-API", ru: "Документация REST-API",
      situation: "Ihre Abteilung soll eine App an den Paketdienst eines Partners anbinden. Sie lesen die Dokumentation der Schnittstelle.",
      text: [
        "The Parcel Tracking API allows clients to request the current status of a shipment. All requests must be sent via HTTPS. Each client receives an API key, which has to be included in the request header. Requests without a valid key are rejected with status code 401.",
        "To get the status of a parcel, send a GET request to /parcels/{trackingNumber}. The response is returned in JSON format and contains the fields status, lastLocation and estimatedDelivery.",
        "Please note the rate limit: a client may send a maximum of 60 requests per minute. If the limit is exceeded, the API responds with status code 429 and the header Retry-After, which tells the client how many seconds to wait.",
        "The API is versioned. The current version is v2. Version v1 will be switched off on 31 March; clients should migrate before this date."
      ],
      vokabeln: [["request", "Anfrage", "запрос"], ["shipment / parcel", "Sendung / Paket", "отправление / посылка"], ["header", "Kopfzeile (HTTP-Header)", "заголовок"], ["to reject", "ablehnen", "отклонить"], ["rate limit", "Begrenzung der Anfragen", "ограничение частоты запросов"], ["to exceed", "überschreiten", "превысить"], ["to switch off", "abschalten", "отключить"]],
      fragen: [
        { art: "wahl", frage: "Was passiert, wenn ein Client mehr als 60 Anfragen pro Minute sendet?", optionen: ["Die API antwortet mit 429 und nennt im Header die Wartezeit.", "Der API-Key wird gesperrt.", "Die API antwortet mit 401.", "Die Anfrage wird automatisch an Version v1 weitergeleitet."], soll: 0 },
        { art: "offen", frage: "Beschreiben Sie, wie ein Client den Status eines Pakets abfragt.", punkte: 3,
          muster: "Der Client sendet per HTTPS eine GET-Anfrage an /parcels/{Sendungsnummer}. Im Header steht sein API-Key. Die Antwort kommt im JSON-Format mit status, lastLocation und estimatedDelivery.",
          kriterien: ["GET-Anfrage an /parcels/{Sendungsnummer} über HTTPS", "API-Key im Header", "Antwort in JSON mit den genannten Feldern"] },
        { art: "offen", frage: "Nennen Sie die Bedeutung der Statuscodes 401 und 429 laut Text.", punkte: 2,
          muster: "401: Anfrage ohne gültigen API-Key, sie wird abgelehnt. 429: zu viele Anfragen, das Limit von 60 pro Minute ist überschritten.",
          kriterien: ["401 = kein gültiger API-Key", "429 = Rate-Limit überschritten"] },
        { art: "offen", frage: "Erläutern Sie, was Ihre Abteilung wegen der Versionierung beachten muss.", punkte: 2,
          muster: "Die App muss Version v2 verwenden. Version v1 wird am 31. März abgeschaltet; wer noch v1 nutzt, muss vorher umstellen, sonst funktioniert die Anbindung nicht mehr.",
          kriterien: ["v2 verwenden / vor dem 31. März umstellen", "Folge: v1 funktioniert danach nicht mehr"] }
      ]
    },
    {
      id: "phishing", titel: "Bericht über einen Phishing-Angriff", ru: "Отчёт о фишинговой атаке",
      situation: "Nach einem Sicherheitsvorfall bei einem Kunden liegt Ihnen der englische Abschlussbericht vor.",
      text: [
        "On Monday morning, several employees received an e-mail that seemed to come from the IT department. The message asked them to confirm their password on a website because of a \"mandatory security update\". The link led to a fake login page that looked exactly like the company portal.",
        "Three employees entered their credentials. Within an hour, the attackers used one account to send further phishing e-mails to customers. The incident was detected by the help desk after a customer called to ask about the strange message.",
        "The IT team immediately blocked the affected accounts, reset the passwords and informed all customers. Because the accounts were not protected by multi-factor authentication, the stolen passwords were enough to log in.",
        "As lessons learned, the company introduced multi-factor authentication for all users and will run regular awareness trainings. In addition, external e-mails are now marked with a warning in the subject line."
      ],
      vokabeln: [["to confirm", "bestätigen", "подтвердить"], ["fake", "gefälscht", "поддельный"], ["credentials", "Zugangsdaten", "учётные данные"], ["incident", "Vorfall", "инцидент"], ["to detect", "erkennen", "обнаружить"], ["affected", "betroffen", "затронутый"], ["awareness training", "Sensibilisierungsschulung", "обучение осведомлённости"], ["lessons learned", "Erkenntnisse", "выводы"]],
      fragen: [
        { art: "wahl", frage: "Wie wurde der Angriff entdeckt?", optionen: ["Ein Kunde rief beim Helpdesk wegen einer seltsamen Nachricht an.", "Die Firewall hat die gefälschte Seite blockiert.", "Die Mitarbeiter haben den Angriff sofort gemeldet.", "Durch die Multi-Faktor-Authentifizierung."], soll: 0 },
        { art: "offen", frage: "Beschreiben Sie den Ablauf des Angriffs.", punkte: 3,
          muster: "Die Angreifer schickten eine E-Mail, die scheinbar von der IT-Abteilung kam. Ein Link führte zu einer gefälschten Anmeldeseite. Drei Mitarbeiter gaben ihre Zugangsdaten ein; mit einem Konto wurden weitere Phishing-Mails an Kunden verschickt.",
          kriterien: ["gefälschte E-Mail im Namen der IT-Abteilung", "Link zu gefälschter Login-Seite, Zugangsdaten eingegeben", "Konto für weitere Mails an Kunden missbraucht"] },
        { art: "offen", frage: "Erläutern Sie, warum die gestohlenen Passwörter für eine Anmeldung ausreichten, und nennen Sie die Maßnahme dagegen.", punkte: 2,
          muster: "Die Konten waren nicht durch Multi-Faktor-Authentifizierung geschützt, also genügte das Passwort. Maßnahme: MFA für alle Benutzer.",
          kriterien: ["keine MFA → Passwort allein genügte", "Maßnahme: MFA für alle"] },
        { art: "offen", frage: "Nennen Sie zwei weitere Maßnahmen, die das Unternehmen laut Text einführt.", punkte: 2,
          muster: "Regelmäßige Sensibilisierungsschulungen (Awareness-Trainings); externe E-Mails werden im Betreff mit einer Warnung markiert.",
          kriterien: ["Awareness-Schulungen", "Warnhinweis bei externen E-Mails"] }
      ]
    },
    {
      id: "retrospektive", titel: "Sprint-Retrospektive", ru: "Ретроспектива спринта",
      situation: "Ein neues Teammitglied aus Irland hat das Protokoll der letzten Retrospektive auf Englisch geschrieben.",
      text: [
        "In the retrospective of Sprint 14, the team discussed why only five of eight user stories were completed. The main reason was that two stories were much larger than estimated. They should have been split into smaller stories during backlog refinement.",
        "The team also noticed that the daily stand-up often took more than 30 minutes. Technical details were discussed with the whole team, although only two developers were involved. In future, such topics will be moved to a separate meeting after the stand-up.",
        "On the positive side, the new automated tests found several bugs before the review. The product owner was satisfied with the quality of the delivered features.",
        "Action items: the Scrum Master will timebox the stand-up to 15 minutes, and the team will check in refinement that every story can be finished within one sprint."
      ],
      vokabeln: [["to complete", "fertigstellen", "завершить"], ["to estimate", "schätzen", "оценивать"], ["to split", "aufteilen", "разделить"], ["backlog refinement", "Backlog-Verfeinerung", "уточнение бэклога"], ["to be involved", "beteiligt sein", "быть вовлечённым"], ["action item", "Maßnahme, Aufgabe", "пункт действий"], ["to timebox", "zeitlich begrenzen", "ограничить по времени"]],
      fragen: [
        { art: "wahl", frage: "Was war laut Protokoll positiv?", optionen: ["Die automatisierten Tests fanden Fehler vor dem Review.", "Alle User Stories wurden fertig.", "Das Daily dauerte nur 15 Minuten.", "Die Schätzungen waren genau."], soll: 0 },
        { art: "offen", frage: "Erläutern Sie den Hauptgrund, warum nicht alle User Stories fertig wurden.", punkte: 2,
          muster: "Zwei Stories waren viel größer als geschätzt. Sie hätten im Backlog-Refinement in kleinere Stories aufgeteilt werden müssen.",
          kriterien: ["Stories größer als geschätzt", "hätten im Refinement aufgeteilt werden sollen"] },
        { art: "offen", frage: "Beschreiben Sie das Problem mit dem Daily Stand-up und die vereinbarte Lösung.", punkte: 3,
          muster: "Das Daily dauerte oft über 30 Minuten, weil technische Details mit dem ganzen Team besprochen wurden, obwohl nur zwei Entwickler betroffen waren. Lösung: Solche Themen in ein eigenes Meeting nach dem Daily verlegen; der Scrum Master begrenzt das Daily auf 15 Minuten.",
          kriterien: ["über 30 Minuten wegen technischer Details", "Details in separates Meeting", "Timebox 15 Minuten durch den Scrum Master"] }
      ]
    },
    {
      id: "barrierefreiheit", titel: "Richtlinie zur Barrierefreiheit", ru: "Рекомендации по доступности",
      situation: "Für ein Webportal sollen Sie die Anforderungen an die Barrierefreiheit prüfen. Dazu liegt ein englischer Leitfaden vor.",
      text: [
        "An accessible website can be used by everyone, including people with visual, hearing or motor impairments. In the EU, many digital services must meet accessibility requirements from June 2025.",
        "All images that carry information need an alternative text, so that screen readers can describe them. Colour must never be the only way to show information: an error in a form should be marked with a colour and with a text message.",
        "The contrast between text and background must be high enough. Users must be able to operate all functions with the keyboard alone, and the focus should always be visible.",
        "Videos need subtitles. Finally, accessibility should be tested early: automated tools find many problems, but tests with real users, for example people who use a screen reader, are still necessary."
      ],
      vokabeln: [["accessible", "barrierefrei", "доступный"], ["impairment", "Beeinträchtigung", "нарушение (здоровья)"], ["requirement", "Anforderung", "требование"], ["screen reader", "Bildschirmleser", "программа экранного доступа"], ["to operate", "bedienen", "управлять"], ["subtitles", "Untertitel", "субтитры"]],
      fragen: [
        { art: "wahl", frage: "Wie soll ein Fehler in einem Formular laut Text angezeigt werden?", optionen: ["Mit Farbe und zusätzlich mit einer Textmeldung.", "Nur in roter Farbe.", "Nur mit einem Ton.", "Mit einem Bild ohne Alternativtext."], soll: 0 },
        { art: "offen", frage: "Nennen Sie vier Anforderungen an eine barrierefreie Website laut Text.", punkte: 4,
          muster: "Alternativtexte für informative Bilder; Informationen nicht nur über Farbe; ausreichender Kontrast; alle Funktionen per Tastatur bedienbar mit sichtbarem Fokus; Untertitel für Videos.",
          kriterien: ["Anforderung 1", "Anforderung 2", "Anforderung 3", "Anforderung 4 (jeweils aus dem Text)"] },
        { art: "offen", frage: "Erläutern Sie, warum automatische Prüfwerkzeuge laut Text nicht ausreichen.", punkte: 2,
          muster: "Automatische Werkzeuge finden viele, aber nicht alle Probleme. Deshalb sind Tests mit echten Nutzern nötig, z. B. mit Menschen, die einen Bildschirmleser verwenden.",
          kriterien: ["Tools finden nicht alle Probleme", "Tests mit echten Nutzern (z. B. Screenreader)"] }
      ]
    },
    {
      id: "release-notes", titel: "Release Notes einer Software", ru: "Примечания к выпуску",
      situation: "Ihr Betrieb nutzt ein Ticketsystem. Vor dem Update lesen Sie die Release Notes des Herstellers.",
      text: [
        "Version 5.2 introduces a new dashboard that shows open tickets by priority and by team. Administrators can now define service level agreements (SLAs) for each customer; tickets that are close to the SLA deadline are highlighted in orange.",
        "Breaking change: the old import interface for CSV files has been removed. Please use the new REST endpoint /import, which accepts JSON. Existing scripts that use the CSV interface must be adapted before the update.",
        "Fixed issues: attachments larger than 10 MB could not be uploaded; this limit has been increased to 50 MB. The search function now also finds tickets by customer number.",
        "Known issue: e-mail notifications may be delayed by up to five minutes when more than 1,000 tickets are created per hour. A fix is planned for version 5.3. Before installing the update, create a full backup of the database."
      ],
      vokabeln: [["to introduce", "einführen", "вводить"], ["deadline", "Frist", "срок"], ["breaking change", "inkompatible Änderung", "несовместимое изменение"], ["to remove", "entfernen", "удалить"], ["to adapt", "anpassen", "адаптировать"], ["known issue", "bekanntes Problem", "известная проблема"], ["to be delayed", "verzögert sein", "задерживаться"]],
      fragen: [
        { art: "wahl", frage: "Was müssen Sie vor dem Update unbedingt tun?", optionen: ["Skripte für den CSV-Import anpassen und ein vollständiges Datenbank-Backup erstellen.", "Alle Anhänge über 10 MB löschen.", "Auf Version 5.3 warten.", "Die SLAs für alle Kunden löschen."], soll: 0 },
        { art: "offen", frage: "Erläutern Sie die Auswirkung des „breaking change“ auf Ihren Betrieb.", punkte: 3,
          muster: "Die alte CSV-Importschnittstelle wurde entfernt. Skripte, die sie nutzen, funktionieren nach dem Update nicht mehr. Sie müssen vorher auf den neuen REST-Endpunkt /import mit JSON umgestellt werden.",
          kriterien: ["CSV-Import entfernt", "bestehende Skripte funktionieren nicht mehr", "Umstellung auf /import mit JSON vor dem Update"] },
        { art: "offen", frage: "Nennen Sie zwei behobene Fehler und das bekannte Problem.", punkte: 3,
          muster: "Behoben: Anhänge über 10 MB konnten nicht hochgeladen werden (jetzt bis 50 MB); die Suche findet jetzt auch Kundennummern. Bekanntes Problem: E-Mail-Benachrichtigungen bis zu fünf Minuten verzögert bei mehr als 1.000 Tickets pro Stunde.",
          kriterien: ["Anhänge bis 50 MB", "Suche nach Kundennummer", "verzögerte E-Mail-Benachrichtigungen bei hoher Last"] }
      ]
    },
    {
      id: "green-it", titel: "Energieeffizienz im Rechenzentrum", ru: "Энергоэффективность в ЦОД",
      situation: "Ihr Unternehmen möchte den Stromverbrauch seiner Server senken. Sie haben einen englischen Fachartikel gefunden.",
      text: [
        "Data centres consume a large amount of electricity, and a significant part of it is used for cooling. A common key figure is the Power Usage Effectiveness (PUE): the total energy of the data centre divided by the energy used by the IT equipment. A PUE of 1.0 would be ideal; many older data centres reach values around 1.8.",
        "Virtualisation helps to save energy because several virtual servers share one physical machine. Servers that are rarely used can be switched off or consolidated.",
        "Modern data centres also use free cooling, where outside air cools the servers when the temperature is low enough. Some operators reuse the waste heat to heat nearby buildings.",
        "Finally, energy efficiency should already be considered when buying hardware: devices with an energy label and a long support period reduce both energy consumption and electronic waste."
      ],
      vokabeln: [["to consume", "verbrauchen", "потреблять"], ["key figure", "Kennzahl", "показатель"], ["equipment", "Ausstattung, Geräte", "оборудование"], ["to share", "teilen", "делить, совместно использовать"], ["to consolidate", "zusammenlegen", "консолидировать"], ["waste heat", "Abwärme", "отработанное тепло"], ["electronic waste", "Elektroschrott", "электронные отходы"]],
      fragen: [
        { art: "wahl", frage: "Ein Rechenzentrum verbraucht 1.500 kWh, die IT-Geräte davon 1.000 kWh. Wie hoch ist der PUE laut Definition im Text?", optionen: ["1,5", "0,67", "2,5", "500"], soll: 0 },
        { art: "offen", frage: "Erläutern Sie die Kennzahl PUE.", punkte: 2,
          muster: "PUE = Gesamtenergie des Rechenzentrums ÷ Energie der IT-Geräte. Je näher der Wert an 1,0 liegt, desto weniger Energie geht z. B. für Kühlung verloren.",
          kriterien: ["Formel: Gesamtenergie ÷ Energie IT", "1,0 ideal / kleiner ist besser"] },
        { art: "offen", frage: "Nennen Sie drei Maßnahmen zur Senkung des Energieverbrauchs laut Text.", punkte: 3,
          muster: "Virtualisierung; selten genutzte Server abschalten oder zusammenlegen; freie Kühlung mit Außenluft; Abwärme nutzen; beim Einkauf auf Energielabel und lange Supportdauer achten.",
          kriterien: ["Maßnahme 1", "Maßnahme 2", "Maßnahme 3 (jeweils aus dem Text)"] }
      ]
    },
    {
      id: "datenschutz-hinweis", titel: "Datenschutzhinweis einer App", ru: "Уведомление о защите данных в приложении",
      situation: "Ihr Team entwickelt eine Fitness-App für einen britischen Partner. Sie prüfen den englischen Datenschutzhinweis.",
      text: [
        "We collect your name, e-mail address and training data such as distance, heart rate and duration. Health data like the heart rate is sensitive personal data; we only process it with your explicit consent, which you can withdraw at any time in the settings.",
        "Your data is stored on servers in Frankfurt and is encrypted during transmission and at rest. We do not sell your data to third parties. Anonymised statistics may be used to improve the app.",
        "You have the right to access your data, to correct it and to have it deleted. To use these rights, contact our data protection officer at privacy@example.com.",
        "If you do not use the app for 24 months, your account and all training data will be deleted automatically."
      ],
      vokabeln: [["to collect", "erheben, sammeln", "собирать"], ["explicit consent", "ausdrückliche Einwilligung", "явное согласие"], ["to withdraw", "widerrufen", "отозвать"], ["encrypted at rest", "verschlüsselt gespeichert", "зашифрованы при хранении"], ["third parties", "Dritte", "третьи лица"], ["right to access", "Auskunftsrecht", "право на доступ"], ["data protection officer", "Datenschutzbeauftragter", "уполномоченный по защите данных"]],
      fragen: [
        { art: "wahl", frage: "Unter welcher Bedingung verarbeitet die App die Herzfrequenz?", optionen: ["Nur mit ausdrücklicher Einwilligung, die man widerrufen kann.", "Immer, weil sie für die App nötig ist.", "Nur in anonymisierter Form.", "Nur, wenn man 24 Monate aktiv ist."], soll: 0 },
        { art: "offen", frage: "Nennen Sie drei Rechte der Nutzer laut Text und wie sie diese ausüben.", punkte: 4,
          muster: "Recht auf Auskunft, auf Berichtigung und auf Löschung der Daten. Man wendet sich dazu an den Datenschutzbeauftragten (privacy@example.com). Die Einwilligung kann man in den Einstellungen widerrufen.",
          kriterien: ["Auskunft", "Berichtigung", "Löschung", "Kontakt: Datenschutzbeauftragter"] },
        { art: "offen", frage: "Beschreiben Sie zwei technische oder organisatorische Maßnahmen zum Schutz der Daten aus dem Text.", punkte: 2,
          muster: "Verschlüsselung bei der Übertragung und bei der Speicherung; Speicherung in Frankfurt (EU); automatische Löschung nach 24 Monaten Inaktivität; keine Weitergabe an Dritte.",
          kriterien: ["Maßnahme 1 (z. B. Verschlüsselung)", "Maßnahme 2 (z. B. Löschung nach 24 Monaten, Server in der EU)"] }
      ]
    }
  ];
  root.AP2_ENGLISCH = T;
  if (typeof module === "object" && module.exports) module.exports = T;
})(typeof window !== "undefined" ? window : globalThis);
