#!/usr/bin/env python3
"""
tools/paket_bauen.py — echte AP2-Prüfungen → privat/ap2-paket.js
=================================================================

Quellen: privat/quellen/*.json — je Prüfungsbogen eine Datei, von Hand aus dem
Original-PDF (raw/) abgeschrieben und mit dem Lösungsschlüssel abgeglichen.
Ergebnis: privat/ap2-paket.js (window.IHK_AZUBI = {...}) im Modulformat von
gen/azubi.js — der Bogen-Player mit Übung/Prüfung, Uhr, Speichern, Auswertung.

    python tools/paket_bauen.py

Die Aufgaben sind urheberrechtlich geschützt (ZPA). privat/ steht in
.gitignore und geht NICHT auf GitHub Pages. Aufs Handy: in der App
„Paket laden“ und die Datei privat/ap2-paket.js wählen.

Format einer Aufgabe (WiSo):
  {"nr": 1, "thema": "…", "kontext": "…", "text": "…", "frage": "…", "anlage": "<html>",
   "typ": "eine" | "mehrere" | "reihenfolge" | "zuordnung" | "zahl",
   "optionen": [...], "zeilen": {"a": "…"}, "soll": [3] | {"a": 1} | "357,00",
   "einheit": "EUR", "otitel": "…", "erkl": "…", "punkte": 3}
"""
import html
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUELLEN = ROOT / "privat" / "quellen"
ZIEL = ROOT / "privat" / "ap2-paket.js"

BEREICH = {
    "wiso": ("WiSo", "Wirtschafts- und Sozialkunde"),
    "ga1": ("GA1", "Planen eines Softwareproduktes"),
    "ga2": ("GA2", "Entwicklung und Umsetzung von Algorithmen"),
}
KOMPLEX = {"mehrere", "reihenfolge", "zuordnung", "zahl"}
FEHLER = []


def e(s):
    """Text aus der Quelle: HTML-Tags (<b>, <br>) bleiben, sonst escapen."""
    s = str(s or "")
    return s if ("<b>" in s or "<br>" in s or "<i>" in s) else html.escape(s, quote=False)


def punkte_verteilen(aufgaben):
    """WiSo laut offiziellem Lösungsbogen: 100 Punkte, je Aufgabe gleich viel (bei 30 Aufgaben 3,33333).
       Eigene Angabe "punkte" in der Quelle hat Vorrang."""
    n = len(aufgaben)
    if all("punkte" in a for a in aufgaben):
        return [a["punkte"] for a in aufgaben]
    return [100 / n] * n


def teilbewertung(a):
    """Teilbewertung = mehrere Lösungsziffern (Zuordnung, Reihenfolge, „zwei aus …“).
       Globalbewertung = eine Ziffer bzw. ein Betrag: nur ganz richtig zählt."""
    if "teil" in a:
        return bool(a["teil"])
    return a["typ"] in ("mehrere", "reihenfolge", "zuordnung", "zahlen")


def soll_text(a):
    t = a["typ"]
    if t in ("eine", "mehrere"):
        s = ", ".join(str(x) for x in a["soll"])
        return s + "".join(" (auch richtig: " + ", ".join(str(y) for y in x) + ")" for x in a.get("auch", []))
    if t in ("reihenfolge", "zuordnung"):
        return ", ".join(f"{k} = {v}" for k, v in sorted(a["soll"].items()))
    if t == "zahlen":
        return " · ".join(f'{f["h"]}: {f["soll"]} {f.get("einheit", "")}'.strip() for f in a["felder"])
    if t == "text":
        return str(a["soll"][0])
    return f'{a["soll"]} {a.get("einheit", "")}'.strip()


def eingabe(a, mid):
    t = a["typ"]
    if t in ("eine", "mehrere"):
        opt = a["optionen"]
        for s in a["soll"]:
            if not 1 <= s <= len(opt):
                FEHLER.append(f"{mid} {a['nr']}: Soll {s} außerhalb 1..{len(opt)}")
        if t == "eine" and len(a["soll"]) != 1:
            FEHLER.append(f"{mid} {a['nr']}: 'eine' mit {len(a['soll'])} Lösungen")
        m = {"typ": "mehrfach", "optionen": [f"<b>{i}</b>&nbsp; {e(o)}" for i, o in enumerate(opt, 1)],
             "soll": list(a["soll"]), "anzahl": len(a["soll"])}
        if a.get("auch"):          # weitere als richtig gewertete Lösungen
            m["alternativen"] = [list(x) for x in a["auch"]]
        return m
    if t in ("reihenfolge", "zuordnung"):
        zeilen = a["zeilen"]
        if t == "reihenfolge":
            optionen = [f"{i}. Schritt" for i in range(1, len(zeilen) + 1)]
            otitel = "Reihenfolge"
        else:
            optionen = [e(o) for o in a["optionen"]]
            otitel = a.get("otitel", "Auswahl")
        if set(zeilen) != set(a["soll"]):
            FEHLER.append(f"{mid} {a['nr']}: Zeilen und Soll passen nicht zusammen")
        for k, v in a["soll"].items():
            if not 1 <= int(v) <= len(optionen):
                FEHLER.append(f"{mid} {a['nr']}: Soll {k}={v} außerhalb 1..{len(optionen)}")
        return {"typ": "zuordnung", "otitel": otitel, "ftitel": "", "optionen": optionen,
                "zeilen": [{"id": k, "h": f"<b>{k})</b> {e(zeilen[k])}", "soll": str(a["soll"][k])}
                           for k in sorted(zeilen)]}
    if t == "zahlen":
        return {"typ": "zeilen", "zeilen": [{"h": f"<b>{e(f['h'])}</b>", "felder": [
            {"id": str(i), "art": "zahl", "soll": [str(f["soll"])], "einheit": f.get("einheit", "")}]}
            for i, f in enumerate(a["felder"], 1)]}
    if t == "text":
        return {"typ": "zeilen", "zeilen": [{"h": f"<b>{e(a.get('label', 'Antwort'))}</b>", "felder": [
            {"id": "1", "art": "text", "soll": [str(x) for x in a["soll"]], "einheit": ""}]}]}
    if t == "datum":
        s = str(a["soll"])
        tt, mm, jj = s.split(".")
        varianten = sorted({s, f"{int(tt)}.{int(mm)}.{jj}", f"{tt}.{mm}.{jj[-2:]}", f"{int(tt)}.{int(mm)}.{jj[-2:]}"})
        return {"typ": "zeilen", "zeilen": [{"h": "<b>Datum (TT.MM.JJJJ)</b>", "felder": [
            {"id": "1", "art": "text", "soll": varianten, "einheit": ""}]}]}
    if t == "zahl":
        return {"typ": "zeilen", "zeilen": [{"h": "<b>Ergebnis</b>", "felder": [
            {"id": "1", "art": "zahl", "soll": [str(a["soll"])], "einheit": a.get("einheit", "")}]}]}
    FEHLER.append(f"{mid} {a['nr']}: unbekannter Typ {t}")
    return {"typ": "zeilen", "zeilen": [{"h": "", "frei": "1", "gross": False}]}


def aufgabentext(a):
    teile = []
    if a.get("kontext"):
        teile.append(f'<div class="az-kontext"><b>{e(a["kontext"])}</b></div>')
    if a.get("text"):
        teile.append(f"<div>{e(a['text'])}</div>")
    if a.get("anlage"):
        teile.append(f"<div><br>{a['anlage']}</div>")
    teile.append(f"<div><br><b>{e(a['frage'])}</b></div>")
    return "".join(teile)


def modul(q):
    mid = q["id"]
    kuerzel, name = BEREICH[q["bereich"]]
    auf = q["aufgaben"]
    nrs = [a["nr"] for a in auf]
    if nrs != list(range(1, len(auf) + 1)):
        FEHLER.append(f"{mid}: Aufgabennummern lückenhaft: {nrs}")
    pkt = punkte_verteilen(auf)
    sek_je_p = q.get("minuten", 60) * 60 / 100
    aufgaben = []
    for a, p in zip(auf, pkt):
        teil = {
            "id": f"{mid}-{a['nr']}", "nr": str(a["nr"]), "label": "", "titel": a.get("thema", ""),
            "punkte": p, "sek": round(p * sek_je_p), "text": aufgabentext(a), "eingabe": eingabe(a, mid),
            "loesung": f"<b>Lösung: {e(soll_text(a))}</b><br>{e(a.get('erkl', ''))}",
            "hinweis": "Teilbewertung: jede richtige Ziffer zählt anteilig." if teilbewertung(a) else "Globalbewertung: nur ganz richtig gibt Punkte.",
            "global": not teilbewertung(a),
        }
        aufgaben.append({"nr": str(a["nr"]), "titel": f"{a['nr']}. Aufgabe · {a.get('thema', '')}",
                         "themen": [a.get("thema", "")], "teile": [teil]})
    summe = sum(pkt)
    if abs(summe - 100) > 1e-6:
        FEHLER.append(f"{mid}: Punktsumme {summe} statt 100")
    je = f"{100 / len(auf):.2f}".replace(".", ",")
    intro = (f"<div>{len(auf)} Aufgaben · {q.get('minuten', 60)} Minuten · 100 Punkte. "
             "Ziffer ankreuzen bzw. Zahl eintragen — die App prüft selbst.</div>"
             f"<div>Je Aufgabe {je} Punkte (wie im IHK-Lösungsbogen). Mehrere Lösungsziffern: Teilbewertung. "
             "Eine Ziffer oder ein Betrag: nur ganz richtig zählt.</div>"
             f"<div>Original-Aufgabensatz {html.escape(q['termin'])}. "
             f"Lösungen: {html.escape(q.get('schluessel', 'offizieller Lösungsbogen'))}.</div>")
    return {
        "id": mid, "art": "pruefung", "nr": q.get("nr", 0), "marke": q["kurz"],
        "bereich": q["bereich"], "termin": q["termin"],
        "kurz": f"{kuerzel} {q['termin']}", "titel": f"{name} · {q['termin']}",
        "kurzinfo": f"{len(auf)} Aufgaben · {q.get('minuten', 60)} Min. · 100 Punkte",
        "minuten": q.get("minuten", 60), "punkte": 100, "intro": intro,
        "einleitung": [{"titel": "Ausgangssituation", "html": f"<div>{e(q.get('situation', ''))}</div>", "anlagen": []}],
        "aufgaben": aufgaben,
    }


def sortschluessel(q):
    """Neueste zuerst: Jahr absteigend, Winter vor Sommer im selben Jahr."""
    t = q["termin"]
    jahr = int("".join(c for c in t if c.isdigit())[:4] or 0)
    return (-jahr, 0 if t.startswith("Winter") else 1, q["bereich"])


def main():
    quellen = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(QUELLEN.glob("*.json"))]
    if not quellen:
        sys.exit("Keine Quellen in privat/quellen/")
    quellen.sort(key=sortschluessel)
    module = [modul(q) for q in quellen]
    if FEHLER:
        print("FEHLER:\n  " + "\n  ".join(FEHLER))
        sys.exit(1)
    paket = {"stand": date.today().isoformat(), "quelle": "IHK-Prüfungen AP2 (ZPA), abgeschrieben",
             "module": module, "bilder": {}}
    ZIEL.write_text("window.IHK_AZUBI = " + json.dumps(paket, ensure_ascii=False) + ";\n", encoding="utf-8")
    n = sum(len(m["aufgaben"]) for m in module)
    print(f"{ZIEL.relative_to(ROOT)}: {len(module)} Bögen, {n} Aufgaben, {ZIEL.stat().st_size // 1024} KB")
    for m in module:
        print(f"  {m['marke']:<10} {m['kurzinfo']}")


if __name__ == "__main__":
    main()
