"""WiSo für «Что тренировать»: Aufgaben der 9 WiSo-Prüfungen nach Themen.

Liest privat/quellen/wiso-*.json (Feld "thema" jeder Aufgabe) und
privat/ap2-paket.js (Punkte und Teil-IDs) und schreibt
gen/training-wiso-daten.js: je WiSo-Thema der App (gen/lernen-wiso-daten.js)
die Liste der Prüfungsaufgaben als Verweise [Modul, Nr., Punkte, [Teil-IDs]].
Keine Aufgabentexte — die kommen beim Üben aus dem eigenen Paket.

Aufruf (nach dem Abschreiben oder Umbenennen von Themen):
    python tools/wiso_training.py          schreibt die Datei
    python tools/wiso_training.py --pruefe meldet nur Themen ohne Zuordnung
"""
import collections
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Reihenfolge zählt: die erste passende Regel gewinnt.
REGELN = [
    ("wiso-digital", r"AGG|Gleichbehandlung|Diversity|Phishing|Compliance|Urheberrecht|IT-Sicherheit|WLAN|Schutzziele"),
    ("wiso-umwelt", r"Umwelt|Nachhaltig|Recycling|Emission|Ökologische"),
    ("wiso-arbeitsschutz", r"^Arbeitsschutz|Arbeitsschutzgesetze|Sicherheitszeichen|Brandschutz|Unfall|Erste Hilfe|Feuerlöscher|Arbeitssicherheit|Unterweisung|Gesundheit am Arbeitsplatz"),
    ("wiso-entgelt", r"Sozialversicherung|Rentenversicherung|Krankenversicherung|Pflegeversicherung|Arbeitslosengeld|Lohn|Einkommen|Vermögenswirksame|Altersvorsorge|Sozialstaat"),
    ("wiso-sozialpartner", r"Betriebsrat|Auszubildendenvertretung|Mitbestimmung|Betriebsvereinbarung|Betriebsversammlung|Tarif|Gewerkschaft|Friedenspflicht|Arbeitskampf|Anhörung"),
    ("wiso-ausbildung", r"Ausbild|Berichtsheft|\bIHK\b|Zuständige Stelle|Berufsbildungsgesetz|^Probezeit$"),
    ("wiso-arbeitsrecht", r"Kündigung|Arbeitsvertrag|Arbeitszeugnis|Probezeit|Urlaub|Befrist|Jugendarbeitsschutz|Mutterschutz|Arbeitsrecht|Einstellung|Vorstellungsgespräch|Arbeitspapiere|Arbeitnehmerüberlassung|Gerichtsbarkeit|Rechtsquellen|Rechtsgrundlagen"),
    ("wiso-weiterbildung", r"Weiterbildung|Umschulung|Europass|Existenzgründung|Agile Methoden"),
    ("wiso-rechtsformen", r"GmbH|Rechtsform|Handelsregister|Kaufmann|Unternehmensarten|Wirtschaftssektoren"),
    ("wiso-unternehmen", r"Organisation|Leitungssystem|Kennzahl|Konjunktur|Wirtschaftlichkeit|Ziel|Kartell|Markt|Globalisierung|Standort|Zusammenschl|Unternehmensverbind|Arbeitsteilung|Wirtschaftsordnung|Ökonomisch|Statistik"),
]


def gruppe(thema):
    for gid, rx in REGELN:
        if re.search(rx, thema or "", re.I):
            return gid
    return None


def paket_module():
    text = open(os.path.join(ROOT, "privat", "ap2-paket.js"), encoding="utf-8").read()
    start = text.index("{")
    ende = text.rindex("}") + 1
    return {m["id"]: m for m in json.loads(text[start:ende])["module"]}


def termin(mid):
    m = re.search(r"-(\d{4})-([sw])$", mid)
    return int(m.group(1)) * 2 + (1 if m.group(2) == "w" else 0)


def sammeln():
    module = paket_module()
    gruppen = collections.defaultdict(list)
    ohne = collections.Counter()
    pruefungen = sorted((os.path.basename(f)[:-5] for f in glob.glob(os.path.join(ROOT, "privat", "quellen", "wiso-*.json"))), key=termin, reverse=True)
    for mid in pruefungen:
        quelle = json.load(open(os.path.join(ROOT, "privat", "quellen", mid + ".json"), encoding="utf-8"))
        m = module.get(mid)
        if not m:
            raise SystemExit("Modul fehlt im Paket: " + mid + " (erst tools/paket_bauen.py)")
        nach_nr = {str(a["nr"]): a for a in m["aufgaben"]}
        for x in quelle["aufgaben"]:
            g = gruppe(x.get("thema"))
            if not g:
                ohne[x.get("thema")] += 1
                continue
            a = nach_nr[str(x["nr"])]
            punkte = round(sum(t.get("punkte", 0) for t in a["teile"]), 2)
            gruppen[g].append([mid, str(x["nr"]), punkte, [t["id"] for t in a["teile"]], x.get("thema")])
    return pruefungen, gruppen, ohne


def main():
    pruefungen, gruppen, ohne = sammeln()
    if ohne:
        print("Ohne Zuordnung:", dict(ohne))
    if "--pruefe" in sys.argv:
        sys.exit(1 if ohne else 0)
    n = len(pruefungen)
    eintraege = []
    for gid, _ in REGELN:
        l = gruppen.get(gid, [])
        eintraege.append({
            "id": gid, "pruef": len({x[0] for x in l}), "von": n,
            "punkte": round(sum(x[2] for x in l) / n),
            "aufgaben": [x[:4] for x in l],
            "themen": sorted({x[4] for x in l}),
        })
    eintraege.sort(key=lambda e: (-e["punkte"], -e["pruef"], e["id"]))
    js = """/* gen/training-wiso-daten.js — ERZEUGT von tools/wiso_training.py, nicht von Hand ändern.
   «Что тренировать» für WiSo: je Thema der App die Aufgaben aus den %d WiSo-Prüfungen
   (Verweise [Modul, Nr., Punkte, [Teil-IDs]], keine Aufgabentexte).
   Ergänzt window.AP2_TRAINING (gen/lernweg-daten.js) um Einträge mit bereich "WiSo". */
"use strict";
(function (root) {
  const DATEN = %s;
  const liste = Array.isArray(root.AP2_TRAINING) ? root.AP2_TRAINING : (root.AP2_TRAINING = []);
  const themen = root.AP2_THEMEN || [];
  DATEN.forEach(d => {
    if (liste.some(t => t.id === d.id)) return;
    const th = themen.find(t => t.id === d.id) || {};
    liste.push({ id: d.id, bereich: "WiSo", name: th.ru || d.id, de: d.themen.slice(0, 5).join(", "), pruef: d.pruef, von: d.von,
      punkte: d.punkte, units: ["wiso"], quiz: th.id ? d.id : undefined, lern: [d.id], aufgaben: d.aufgaben, themen: d.themen });
  });
  if (typeof module === "object" && module.exports) module.exports = DATEN;
})(typeof window !== "undefined" ? window : globalThis);
""" % (n, json.dumps(eintraege, ensure_ascii=False, separators=(",", ":")))
    ziel = os.path.join(ROOT, "gen", "training-wiso-daten.js")
    open(ziel, "w", encoding="utf-8").write(js)
    for e in sorted(eintraege, key=lambda e: -e["punkte"]):
        print("%-20s in %d von %d · ≈ %2d Punkte · %d Aufgaben" % (e["id"], e["pruef"], n, e["punkte"], len(e["aufgaben"])))
    print("geschrieben:", os.path.relpath(ziel, ROOT))


if __name__ == "__main__":
    main()
