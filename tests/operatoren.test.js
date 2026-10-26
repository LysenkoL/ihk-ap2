"use strict";
/* Operator-Erkennung (gen/operatoren.js).  node tests/operatoren.test.js */
const assert = require("assert");
const path = require("path");
global.window = global;
global.document = { readyState: "loading", addEventListener() { } };   /* nur zum Laden; erkenne() braucht kein DOM */
require(path.join(__dirname, "..", "gen", "operatoren.js"));
const E = t => (global.GENOP.erkenne(t) || {}).key || null;
assert.strictEqual(E("Überprüfen Sie, ob die Tabelle in der 3. Normalform ist."), "pruefen", "Ü am Satzanfang");
assert.strictEqual(E("Bitte überprüfen Sie den Algorithmus."), "pruefen", "ü nach Leerzeichen");
assert.strictEqual(E("Ueberpruefen Sie die Angaben."), "pruefen");
assert.strictEqual(E("Prüfen Sie die Eingabe."), "pruefen");
assert.strictEqual(E("Stellen Sie den Ablauf in einem Aktivitätsdiagramm dar."), "beschreiben", "Stellen Sie … dar");
assert.strictEqual(E("Stellen Sie die Vor- und Nachteile beider Varianten gegenüber."), "vergleichen", "Stellen Sie … gegenüber");
assert.strictEqual(E("Stellen Sie fest, ob das stimmt. Danach weiter."), null, "dar fehlt → nichts");
assert.strictEqual(E("Nennen Sie drei Beispiele."), "nennen");
assert.strictEqual(E("Nennen und begründen Sie."), "begruenden");
assert.strictEqual(E("Die Darstellung ist klar."), null, "kein Operator");
console.log("operatoren: ok");
