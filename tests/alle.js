"use strict";
/* Alle Tests des AP2-Simulators:  node tests/alle.js
   „Ruhend“ = Test für ein Modul, das in AP2 (noch) nicht geladen ist, oder
   der AP1-Prüfungsdaten braucht. Wird wieder aktiv, sobald der Schritt dran ist. */
const { spawnSync } = require("child_process");
const fs = require("fs"), path = require("path");
const RUHEND = {
  "generator-ipconfig.test.js": "ipconfig-Vorlage ist AP1 und hier nicht angemeldet",
  "katalog.test.js":            "Prüfungskatalog AP2 — Schritt 1",
  "kompendium-status.test.js":  "Kompendium — später, nur AP2-Themen",
  "nachschlagen.test.js":       "braucht echte Prüfungstexte — wieder aktiv nach Schritt 1/2",
  "prognose.test.js":           "Prognose-Prüfungen AP1",
  "radar.test.js":              "Themen-Radar AP1 — AP2-Radar in Schritt 5",
  "sprint.test.js":             "Rechen-Sprint AP1"
};
let ok = 0, fail = 0;
for (const f of fs.readdirSync(__dirname).filter(f => f.endsWith(".test.js")).sort()) {
  if (RUHEND[f]) { console.log("–  " + f + "  (ruht: " + RUHEND[f] + ")"); continue; }
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: "utf8" });
  if (r.status === 0) { ok++; console.log("✓  " + f); }
  else { fail++; console.log("✗  " + f + "\n" + (r.stderr || r.stdout).split("\n").slice(0, 8).join("\n")); }
}
for (const f of ["pwa-shell_test.py", "check_kompendium_test.py"]) {
  const r = spawnSync(process.env.PYTHON || "python", [path.join(__dirname, f)], { encoding: "utf8" });
  if (r.status === 0) { ok++; console.log("✓  " + f); }
  else { fail++; console.log("✗  " + f + "\n" + (r.error ? r.error.message : r.stderr || r.stdout).split("\n").slice(0, 8).join("\n")); }
}
console.log("\n" + ok + " bestanden, " + fail + " fehlgeschlagen, " + Object.keys(RUHEND).length + " ruhend");
process.exit(fail ? 1 : 0);
