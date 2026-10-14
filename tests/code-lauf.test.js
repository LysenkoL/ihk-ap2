"use strict";
/* Ausführer für Java-ähnlichen Pseudocode: Typen, Schleifen, Listen, Arrays,
   Strings, Getter, Fehlermeldungen mit Zeilennummer, Schutzgrenzen, kein eval. */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const L = require("../gen/code-lauf.js");
const AUFGABEN = require("../gen/code-daten.js");

function lauf(code, methode, args, extra) { return L.ausfuehren(code, Object.assign({ methode, args: args || [] }, extra || {})); }
function wert(code, methode, args, extra) {
  const r = lauf(code, methode, args, extra);
  assert(r.ok, "erwartet ok, bekam: " + (r.fehler && r.fehler.meldung) + "\n" + code);
  return r.wert;
}
function fehler(code, methode, args, extra) {
  const r = lauf(code, methode, args, extra);
  assert(!r.ok, "erwartet Fehler, bekam: " + JSON.stringify(r.wert) + "\n" + code);
  return r.fehler;
}

/* ---------- Typen und ganzzahlige Division ---------- */
assert.strictEqual(wert("double f(int a, int b) { return (a + b) / 2; }", "f", [3, 4]), 3, "int / int ist ganzzahlig, erst danach double");
assert.strictEqual(wert("double f(int a, int b) { return (a + b) / 2.0; }", "f", [3, 4]), 3.5);
assert.strictEqual(wert("double f(int s, int n) { return (double) s / n; }", "f", [9, 2]), 4.5);
assert.strictEqual(wert("int f() { return 7 / 2 + -7 / 2 + 7 % 3 + -7 % 3; }", "f"), 3 - 3 + 1 - 1, "Java schneidet zur Null ab");
assert.strictEqual(wert("int f() { int x = Integer.MAX_VALUE; x++; return x; }", "f"), -2147483648, "int läuft über wie in Java");
assert.strictEqual(wert("long f(double d) { return Math.round(d); }", "f", [2.5]), 3);
assert.strictEqual(wert("int f(double d) { return (int) d; }", "f", [-2.9]), -2);
assert.strictEqual(wert("int f(int a) { a += 2.7; return a; }", "f", [1]), 3, "+= wandelt wie Java implizit um");
assert.strictEqual(wert("char f() { char c = 'a'; c++; return c; }", "f"), "b");
assert.strictEqual(wert("int f() { return 'a' + 1; }", "f"), 98);
let f = fehler("int f(double d) {\n    int x = d;\n    return x;\n}", "f", [2.5]);
assert.strictEqual(f.zeile, 2);
assert(/double/.test(f.text) && /привести тип/.test(f.text), f.text);
f = fehler("int f(double d) { return d * 2; }", "f", [1.5]);
assert(/привести тип/.test(f.text), "Rückgabe double in int braucht einen Cast: " + f.text);
f = fehler("int f(double d) { return Math.round(d); }", "f", [1.5]);
assert(/long/.test(f.text) && /\(int\)/.test(f.text), f.text);
f = fehler("int f() {\n  return 7 / 0;\n}", "f");
assert.strictEqual(f.zeile, 2); assert(/деление на ноль/.test(f.text));
assert(Number.isNaN(wert("double f() { return 0.0 / 0; }", "f")), "double-Division durch 0 wie Java: NaN");
assert.strictEqual(wert('String f() { return "" + 1.0 + " " + 10000000.0 + " " + 0.5 + " " + \'c\' + 1 + true; }', "f"), "1.0 1.0E7 0.5 c1true");

/* ---------- Kontrollfluss ---------- */
assert.strictEqual(wert("int f(int n) { int s = 0; for (int i = 1; i <= n; i++) { if (i % 2 == 0) continue; if (i > 7) break; s += i; } return s; }", "f", [20]), 1 + 3 + 5 + 7);
assert.strictEqual(wert("int f() { int i = 0; do { i++; } while (i < 5); return i; }", "f"), 5);
assert.strictEqual(wert("int f() { int i = 10; while (i > 0) { i -= 3; } return i; }", "f"), -2);
assert.strictEqual(wert('String f(int n) { if (n > 0) { return "pos"; } else if (n < 0) { return "neg"; } else { return "null"; } }', "f", [-1]), "neg");
assert.strictEqual(wert("String f(int n) { return n > 0 ? \"pos\" : n < 0 ? \"neg\" : \"null\"; }", "f", [0]), "null");
assert.strictEqual(wert("int f(int n) { if (n <= 1) return 1; return n * f(n - 1); }", "f", [6]), 720, "Rekursion");
assert.strictEqual(wert("int doppelt(int x) { return x * 2; }\nint f(int[] a) { int s = 0; for (int x : a) { s += doppelt(x); } return s; }", "f", [[1, 2, 3]]), 12, "Hilfsmethoden");
assert.strictEqual(wert("boolean f(int a) { return a > 2 && a < 5 || !(a != 10); }", "f", [10]), true);
assert.strictEqual(wert("boolean f(int[] a) { return a.length > 0 && a[0] == 1; }", "f", [[]]), false, "&& wertet kurz aus");

/* ---------- Arrays (auch 2D) ---------- */
assert.deepStrictEqual(wert("int[][] f(int r, int c) { int[][] a = new int[r][c]; a[1][2] = 7; return a; }", "f", [2, 3]), [[0, 0, 0], [0, 0, 7]]);
assert.strictEqual(wert("int f() { int[][] a = {{1, 2}, {3}}; return a[1].length + a[0][1]; }", "f"), 3);
assert.deepStrictEqual(wert("int[] f() { return new int[] {4, 5}; }", "f"), [4, 5]);
assert.deepStrictEqual(wert("double[] f() { double[] d = new double[2]; d[0] = 1; return d; }", "f"), [1, 0]);
assert.strictEqual(wert("int f(boolean[][] b) { int frei = 0; for (int r = 0; r < b.length; r++) for (int p = 0; p < b[r].length; p++) if (!b[r][p]) frei++; return frei; }", "f", [[[true, false], [false]]]), 2);
const swap = lauf("void f(int[] a) { int t = a[0]; a[0] = a[1]; a[1] = t; }", "f", [[1, 2]]);
assert(swap.ok); assert.deepStrictEqual(swap.argsNachher[0], [2, 1], "Array wird als Referenz verändert");
f = fehler("int f(int[] a) {\n  int s = 0;\n  for (int i = 0; i <= a.length; i++) {\n    s += a[i];\n  }\n  return s;\n}", "f", [[1, 2, 3, 4, 5]]);
assert.strictEqual(f.zeile, 4);
assert(/индекс 5 вне массива длины 5/.test(f.text), f.text);
assert.strictEqual(fehler("int f(int[] a) { return a.length(); }", "f", [[1]]).text.includes("a.length"), true);
assert(/size/.test(fehler("int f(int[] a) { return a.size(); }", "f", [[1]]).text));
assert(/отрицательным/.test(fehler("int[] f() { return new int[-1]; }", "f").text));

/* ---------- Listen ---------- */
assert.deepStrictEqual(wert("List<Integer> f() { List<Integer> l = new ArrayList<>(); l.add(3); l.add(0, 1); l.add(5); l.set(1, 9); l.remove(0); return l; }", "f"), [9, 5]);
assert.strictEqual(wert("boolean f(List<String> l) { return l.contains(\"b\") && !l.isEmpty() && l.size() == 2 && l.get(1).equals(\"b\"); }", "f", [["a", "b"]]), true);
assert.strictEqual(wert("int f(List<Integer> l) { int s = 0; for (int x : l) s += x; return s / l.size(); }", "f", [[1, 2]]), 1, "Integer aus List: int-Division");
assert.strictEqual(wert("String f() { var l = new ArrayList<String>(); l.add(\"a\"); l.add(\"b\"); return l.toString() + l.indexOf(\"b\"); }", "f"), "[a, b]1");
f = fehler("int f(List<Integer> l) {\n  return l.get(2);\n}", "f", [[1, 2]]);
assert.strictEqual(f.zeile, 2); assert(/индекс 2 вне списка размера 2/.test(f.text), f.text);
assert(/get/.test(fehler("int f(List<Integer> l) { return l[0]; }", "f", [[1]]).text), "Listenzugriff mit [] erklärt get");
assert(/size\(\)/.test(fehler("int f(List<Integer> l) { return l.length; }", "f", [[1]]).text));
assert(/ConcurrentModification/.test(fehler("int f(List<Integer> l) { for (int x : l) { if (x < 0) l.remove(0); } return l.size(); }", "f", [[1, -1, 2]]).text));
assert(/List<Integer>/.test(fehler("int f() { List<int> l = new ArrayList<>(); return 0; }", "f").text), "List<int> → Wrapper erklären");

/* ---------- Strings ---------- */
assert.strictEqual(wert("String f(String s) { String r = \"\"; for (int i = s.length() - 1; i >= 0; i--) { r += s.charAt(i); } return r.toUpperCase(); }", "f", ["abc"]), "CBA");
assert.strictEqual(wert("int f(String s, char c) { int n = 0; for (int i = 0; i < s.length(); i++) if (Character.toLowerCase(s.charAt(i)) == c) n++; return n; }", "f", ["Anna", "a"]), 2);
assert.strictEqual(wert("String f(String s) { return s.substring(1, 3) + s.indexOf('l') + s.trim().length() + s.contains(\"ll\"); }", "f", [" hallo "]), "ha3" + 5 + "true");
assert.strictEqual(wert("boolean f(String a, String b) { return a.equalsIgnoreCase(b); }", "f", ["Meier", "MEIER"]), true);
assert.strictEqual(wert("int f(String s) { return s.split(\",\").length; }", "f", ["a,b,,c"]), 4);
assert.strictEqual(wert("int f(String a, String b) { return a.compareTo(b); }", "f", ["Apfel", "Birne"]), -1);
const vergleich = lauf("boolean f(String a) {\n  return a == \"x\";\n}", "f", ["x"]);
assert(vergleich.ok && vergleich.wert === true, "String == ist erlaubt");
assert(vergleich.warnungen.some(w => w.zeile === 2 && /equals/.test(w.text)), "… mit Warnung zu equals");
assert(/charAt/.test(fehler("char f(String s) { return s[0]; }", "f", ["ab"]).text));
assert(/length\(\)/.test(fehler("int f(String s) { return s.length; }", "f", ["ab"]).text));
assert(/индекс 3 вне строки длины 3/.test(fehler("char f(String s) { return s.charAt(3); }", "f", ["abc"]).text));

/* ---------- Getter von Objekten aus der Aufgabe ---------- */
const klassen = [{ name: "Messung", felder: { sensor: "String", wert: "double", aktiv: "boolean" } }];
assert.strictEqual(wert("double f(List<Messung> l) { double s = 0; for (Messung m : l) { if (m.isAktiv()) s += m.getWert(); } return s; }", "f",
  [[{ sensor: "A", wert: 2, aktiv: true }, { sensor: "B", wert: 3.5, aktiv: false }, { sensor: "C", wert: 1.25, aktiv: true }]], { klassen }), 3.25);
const gesetzt = lauf("void f(Messung m) { m.setWert(m.getWert() + 1); }", "f", [{ sensor: "A", wert: 2, aktiv: true }], { klassen });
assert(gesetzt.ok); assert.strictEqual(gesetzt.argsNachher[0].wert, 3, "Setter ändern das Objekt");
f = fehler("double f(List<Messung> l) {\n  return l.get(0).getPreiss();\n}", "f", [[{ sensor: "A", wert: 2, aktiv: true }]], { klassen });
assert.strictEqual(f.zeile, 2);
assert(/у объекта Messung нет метода getPreiss\(\)/.test(f.text), f.text);
assert(/getWert/.test(f.text), "vorhandene Methoden werden genannt");
assert(/Messung/.test(fehler("double f(Messung m) { return m.getwert(); }", "f", [{ sensor: "A", wert: 2, aktiv: true }], { klassen }).text));
assert(/null/.test(fehler("double f() { Messung m = null; return m.getWert(); }", "f", [], { klassen }).text), "NullPointer wird erklärt");

/* ---------- Ausgabe ---------- */
const aus = lauf("int f(int n) { for (int i = 0; i < n; i++) { System.out.println(\"i = \" + i); } print(\"ende\"); return n; }", "f", [2]);
assert(aus.ok); assert.strictEqual(aus.ausgabe, "i = 0\ni = 1\nende");

/* ---------- Fehler mit Zeilennummer ---------- */
f = fehler("int f() {\n    int x = 5\n    return x;\n}", "f");
assert.strictEqual(f.zeile, 2); assert(/ожидалась `;`/.test(f.text), f.text);
assert.strictEqual(f.meldung.indexOf("Строка 2:"), 0, "Meldung beginnt mit der Zeile");
f = fehler("int f() {\n    int s = 0;\n    return summe;\n}", "f");
assert.strictEqual(f.zeile, 3); assert(/переменная summe не объявлена/.test(f.text), f.text);
f = fehler("int f() {\n    int summe = 0;\n    return Summe;\n}", "f");
assert(/может быть, summe/.test(f.text), "ähnlicher Name wird vorgeschlagen: " + f.text);
f = fehler("int f(int a) {\n    if (a > 5) {\n        return 1;\n    \n    return 0;\n}", "f", [1]);
assert(/не хватает `}`/.test(f.text), f.text); assert(f.zeile >= 1);
f = fehler("int f(int a) {\n    if (a > 5) {\n        return 1;\n    }\n}", "f", [1]);
assert.strictEqual(f.zeile, 5); assert(/не хватает return/.test(f.text), f.text);
assert(/==/.test(fehler("int f(int a) { if (a = 5) { return 1; } return 0; }", "f", [1]).text), "= statt == wird erkannt");
assert(/boolean/.test(fehler("int f(int a) { if (a) { return 1; } return 0; }", "f", [1]).text));
assert(/String/.test(fehler("int f() { string s = \"a\"; return 1; }", "f").text), "string → String");
assert(/точкой с запятой/.test(fehler("int f() { for (int i = 0, i < 3, i++) { } return 1; }", "f").text));
assert(/строчными/.test(fehler("int f() {\n  If (true) { return 1; }\n  return 0;\n}", "f").text));
assert(/return/.test(fehler("int f(int x) { retrun x; }", "f", [1]).text));
assert(/уже объявлена/.test(fehler("int f() { int x = 1; int x = 2; return x; }", "f").text));
assert(/не получила значение/.test(fehler("int f(int[] a) { int s; for (int x : a) s += x; return s; }", "f", [[1]]).text));
assert(/break/.test(fehler("int f() { break; }", "f").text));
assert(/void/.test(fehler("void f() { return 1; }", "f").text));
assert(/внутри метода/.test(fehler("int x = 5;", "f").text));
assert(/кавычк/.test(fehler("String f() {\n  return \"abc;\n}", "f").text));
assert.strictEqual(wert("String f() { return „Hallo“; }", "f"), "Hallo", "typografische Anführungszeichen vom Handy");
assert(/Arrays.sort/.test(fehler("void f(int[] a) { Arrays.sort(a); }", "f", [[2, 1]]).text), "fertige Sortierung ist gesperrt");

/* ---------- Schutzgrenzen ---------- */
f = fehler("int f() {\n    int s = 0;\n    int i = 0;\n    while (i < 10) {\n        s++;\n    }\n    return s;\n}", "f");
assert.strictEqual(f.art, "limit"); assert.strictEqual(f.zeile, 4); assert(/бесконечный цикл/.test(f.text), f.text);
assert(/бесконечный цикл/.test(fehler("int f() { for (;;) { } }", "f").text));
f = fehler("int f(int n) { return f(n + 1); }", "f", [1]);
assert.strictEqual(f.art, "limit"); assert(/рекурсия/.test(f.text));
assert(/слишком длинной/.test(fehler("String f() { String s = \"ab\"; for (int i = 0; i < 40; i++) { s = s + s; } return s; }", "f").text));
assert(/слишком большой/.test(fehler("int[][] f() { return new int[5000][5000]; }", "f").text));

/* ---------- Kein eval: Code wird nie zu JavaScript ---------- */
const quelle = fs.readFileSync(path.join(__dirname, "../gen/code-lauf.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
assert(!/\beval\s*\(/.test(quelle), "kein eval");
assert(!/new\s+Function\b/.test(quelle) && !/\bFunction\s*\(/.test(quelle), "kein Function-Konstruktor");
assert(!/setTimeout|setInterval/.test(quelle), "keine Timer mit Text");
globalThis.__angriff = 0;
const angriffe = [
  'int f() { return constructor.constructor("return process")(); }',
  'int f() { return constructor.constructor("globalThis.__angriff = 1"); }',
  'int f(String s) { return s.constructor.constructor("globalThis.__angriff = 1").length(); }',
  'int f(String s) { s.constructor("x"); return 0; }',
  'int f() { return Math.constructor; }',
  'int f(int[] a) { return a.__proto__; }',
  'int f(List<Integer> l) { l.constructor.call(); return 0; }',
  'int f() { return toString.call(); }',
  'int f() { return globalThis.process.exit(1); }',
  'int f() { return process.exit(1); }',
  'int f() { return this.constructor; }'
];
angriffe.forEach(code => {
  const r = lauf(code, "f", code.includes("String s") ? ["x"] : code.includes("int[] a") ? [[1]] : code.includes("List<") ? [[1]] : []);
  assert(!r.ok, "Angriff darf nicht laufen: " + code);
  assert(r.fehler && typeof r.fehler.text === "string" && r.fehler.art !== "intern", "verständlicher Fehler statt JS-Zugriff: " + code + " → " + JSON.stringify(r.fehler));
});
assert.strictEqual(globalThis.__angriff, 0, "kein Code der Lernenden wurde als JavaScript ausgeführt");
const obj = lauf("int f(Messung m) { return m.constructor; }", "f", [{ sensor: "A", wert: 1, aktiv: true }], { klassen });
assert(!obj.ok);
const getter = lauf("String f(Messung m) { return m.getConstructor(); }", "f", [{ sensor: "A", wert: 1, aktiv: true }], { klassen });
assert(!getter.ok && /нет метода/.test(getter.fehler.text), "getConstructor erreicht kein JS-Feld");

/* ---------- Vergleich der Ergebnisse ---------- */
assert(L.gleichJS(3.333, 3.3333333)); assert(!L.gleichJS(4, 4.5)); assert(!L.gleichJS(2, 3));
assert(L.gleichJS([{ a: 1.004 }], [{ a: 1 }])); assert(!L.gleichJS(null, 0)); assert(!L.gleichJS(NaN, NaN));
assert.strictEqual(L.formatiere(2, "double"), "2.0");
assert.strictEqual(L.formatiere([1, 2], "int[]"), "{1, 2}");
assert.strictEqual(L.formatiere("a", "char"), "'a'");

/* ---------- Alle Musterlösungen bestehen, alle Vorlagen nicht ---------- */
assert.strictEqual(AUFGABEN.length, 10, "10 Aufgaben");
const ids = new Set();
AUFGABEN.forEach(a => {
  assert(!ids.has(a.id), "doppelte id " + a.id); ids.add(a.id);
  ["id", "titel", "kontext", "aufgabe", "signatur", "vorlage", "hinweis", "loesung"].forEach(k => assert(typeof a[k] === "string" && a[k].trim(), a.id + ": " + k));
  assert([1, 2, 3].includes(a.stufe), a.id + ": stufe");
  assert(Array.isArray(a.erklaerungRu) && a.erklaerungRu.length >= 3, a.id + ": erklaerungRu");
  assert(/^Entwickeln Sie eine Methode /.test(a.aufgabe), a.id + ": Operator der Aufgabe");
  assert(Array.isArray(a.begriffe) && a.begriffe.length >= 3 && a.begriffe.every(b => b.length === 2), a.id + ": begriffe");
  const sichtbar = a.tests.filter(t => !t.verdeckt), verdeckt = a.tests.filter(t => t.verdeckt);
  assert(sichtbar.length >= 2 && sichtbar.length <= 3, a.id + ": 2–3 sichtbare Tests");
  assert(verdeckt.length >= 2 && verdeckt.every(t => t.fall), a.id + ": verdeckte Grenzfälle mit Beschreibung");
  const sig = L.parseSignatur(a.signatur);
  assert(a.vorlage.startsWith(a.signatur + " {"), a.id + ": Vorlage beginnt mit dem Methodenkopf");
  assert(/\/\/ Ihr Code/.test(a.vorlage), a.id + ": Vorlage mit // Ihr Code");
  a.tests.forEach(t => assert.strictEqual(t.eingabe.length, sig.params.length, a.id + ": Anzahl Parameter im Test"));
  (a.klassen || []).forEach(k => k.methoden.forEach(([m]) => {
    const n = /^(\w+)\(/.exec(m)[1], g = /^(?:get|is|set)(\w+)$/.exec(n);
    assert(g && Object.keys(k.felder).some(feld => feld.toLowerCase() === g[1].toLowerCase()), a.id + ": Methode " + n + " passt zu einem Feld");
  }));
  const ok = L.pruefeAufgabe(a, a.loesung);
  assert(ok.kompiliert, a.id + ": Lösung kompiliert: " + (ok.fehler && ok.fehler.meldung));
  assert.strictEqual(ok.bestanden, ok.gesamt, a.id + ": Lösung besteht alle Tests: " + JSON.stringify(ok.tests.filter(t => !t.ok)));
  assert.strictEqual(ok.warnungen.length, 0, a.id + ": Musterlösung ohne Warnungen");
  const leer = L.pruefeAufgabe(a, a.vorlage);
  assert(leer.bestanden < leer.gesamt, a.id + ": Vorlage darf nicht bestehen");
});

/* Typische Fehler werden von den verdeckten Tests gefunden */
const finde = id => AUFGABEN.find(a => a.id === id);
let r = L.pruefeAufgabe(finde("durchschnitt-sterne"), "double durchschnitt(List<Bewertung> bewertungen) {\n    int summe = 0;\n    for (Bewertung b : bewertungen) {\n        summe += b.getSterne();\n    }\n    return summe / bewertungen.size();\n}\n");
assert(r.kompiliert && r.bestanden < r.gesamt, "ganzzahlige Division fällt auf");
assert(r.tests.some(t => !t.ok && t.fehler && /деление на ноль/.test(t.fehler.text)), "leere Liste → Division durch null");
assert(r.tests.some(t => t.hinweis && /int \/ int/.test(t.hinweis)), "Hinweis auf int-Division");
r = L.pruefeAufgabe(finde("hoechste-messung"), "Messung hoechsteMessung(List<Messung> messungen) {\n    Messung beste = null;\n    double max = 0;\n    for (Messung m : messungen) {\n        if (m.getWert() > max) { max = m.getWert(); beste = m; }\n    }\n    return beste;\n}\n");
assert(r.tests.some(t => !t.ok && t.verdeckt && /отрицательные/.test(t.fall)), "Start mit 0 scheitert an negativen Werten");
r = L.pruefeAufgabe(finde("index-name"), "int findeIndex(List<Mitarbeiter> liste, String name) {\n    for (int i = 0; i < liste.size(); i++) {\n        if (liste.get(i).getName() == name) {\n            return i;\n        }\n    }\n    return -1;\n}\n");
assert(r.warnungen.some(w => /equals/.test(w.text)), "== bei Strings → Warnung");
r = L.pruefeAufgabe(finde("nachbestellen"), "List<Artikel> nachbestellen(List<Artikel> artikel) {\n    for (int i = artikel.size() - 1; i >= 0; i--) {\n        if (artikel.get(i).getBestand() >= artikel.get(i).getMindestbestand()) {\n            artikel.remove(i);\n        }\n    }\n    return artikel;\n}\n");
assert(r.tests.some(t => !t.ok && /исходный список/.test(t.fall)), "veränderte Originalliste fällt auf");
r = L.pruefeAufgabe(finde("freier-platz"), "int[] ersterFreierPlatz(boolean[][] belegt) {\n    for (int r = 0; r < belegt.length; r++) {\n        for (int p = 0; p < belegt[0].length; p++) {\n            if (!belegt[r][p]) {\n                return new int[] {r, p};\n            }\n        }\n    }\n    return new int[] {-1, -1};\n}\n");
assert(r.tests.some(t => !t.ok && /разной длины/.test(t.fall)), "belegt[0].length scheitert an unterschiedlich langen Reihen");
r = L.pruefeAufgabe(finde("summe-zugaenge"), "int summeZugaenge(int[] aenderungen) {\n    int summe = 0;\n    for (int i = 0; i < aenderungen.length; i++) {\n        if (aenderungen[i] > 0) {\n            summe += aenderungen[i];\n        }\n    return summe;\n    }\n}\n");
assert(!r.kompiliert || r.bestanden < r.gesamt, "return in der Schleife fällt auf");
r = L.pruefeAufgabe(finde("summe-zugaenge"), "int summeZugaenge(int[] werte) {\n    return 0;\n}\nint hilfe() { return 1; }\n");
assert(r.kompiliert, "Parametername darf anders heißen");
r = L.pruefeAufgabe(finde("summe-zugaenge"), "int summe(int[] aenderungen) {\n    return 0;\n}\n");
assert(!r.kompiliert && /summeZugaenge/.test(r.fehler.text), "fehlender Methodenname wird erklärt");

console.log("code-lauf: ok");
