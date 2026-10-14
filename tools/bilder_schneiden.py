#!/usr/bin/env python3
"""
tools/bilder_schneiden.py — Bildausschnitte für die GA-Bögen
=============================================================

Liest in privat/quellen/*.json die Angaben unter "bilder":
    "w25-ga1-uc": {"seite": "w25/l1-3", "box": [0.08, 0.16, 0.87, 0.55]}
schneidet den Ausschnitt (Anteile der Seitenbreite/-höhe) aus dem Seitenbild
<SEITEN>/w25/l1-3.jpg und speichert privat/bilder/w25-ga1-uc.webp
(höchstens 1000 px breit, WebP). paket_bauen.py bettet sie ins Paket ein.

    AP2_SEITEN=/pfad/zu/seiten python tools/bilder_schneiden.py [--neu] [--nur ga1-2024-s]

Die Seitenbilder (pdftoppm, 150 dpi) liegen nicht im Projekt. Fehlt eine Seite,
bleibt ein schon vorhandener Ausschnitt einfach stehen.
"""
import json
import os
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
QUELLEN = ROOT / "privat" / "quellen"
BILDER = ROOT / "privat" / "bilder"
SEITEN = Path(os.environ.get("AP2_SEITEN", "/home/claude/seiten"))


def main():
    neu = "--neu" in sys.argv
    nur = sys.argv[sys.argv.index("--nur") + 1] if "--nur" in sys.argv else None
    BILDER.mkdir(parents=True, exist_ok=True)
    n = fehlt = 0
    for p in sorted(QUELLEN.glob("*.json")):
        if nur and p.stem != nur:
            continue
        q = json.loads(p.read_text(encoding="utf-8"))
        for k, b in (q.get("bilder") or {}).items():
            ziel = BILDER / f"{k}.webp"
            if ziel.exists() and not neu:
                continue
            seite = SEITEN / (b["seite"] + ".jpg")
            if not seite.exists():
                print(f"  fehlt: {seite} ({k})")
                fehlt += 1
                continue
            im = Image.open(seite)
            w, h = im.size
            x0, y0, x1, y1 = b["box"]
            aus = im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
            if aus.width > 1000:
                aus = aus.resize((1000, round(aus.height * 1000 / aus.width)), Image.LANCZOS)
            aus.convert("RGB").save(ziel, "WEBP", quality=b.get("q", 62), method=6)
            n += 1
    print(f"{n} Ausschnitte geschnitten, {fehlt} Seiten fehlen, {len(list(BILDER.glob('*.webp')))} im Ordner")
    if fehlt:
        sys.exit(1)


if __name__ == "__main__":
    main()
