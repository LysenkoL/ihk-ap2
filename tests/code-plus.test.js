"use strict";
/* Weitere Code-Aufgaben (gen/code-daten-plus.js) und neue Sprachmittel im Ausführer:
   switch, eigene Klassen, Map.  node tests/code-plus.test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
const L = require(path.join(root, "gen", "code-lauf.js"));
require(path.join(root, "gen", "code-daten.js"));
const vorher = global.AP2_CODE_AUFGABEN.length;
const NEU = require(path.join(root, "gen", "code-daten-plus.js"));
const A = global.AP2_CODE_AUFGABEN;
assert.strictEqual(A.length, vorher + NEU.length, "angehängt");
assert.strictEqual(new Set(A.map(a => a.id)).size, A.length, "IDs eindeutig");
assert.strictEqual(NEU.filter(a => a.stufe === 4).length, 10, "10 neue Aufgaben (Stufe 4)");
assert.ok(NEU.filter(a => a.stufe === 5).length >= 5, "Finde-den-Fehler-Aufgaben (Stufe 5)");

NEU.forEach(a => {
  ["titel", "kontext", "aufgabe", "signatur", "vorlage", "loesung", "hinweis"].forEach(f => assert.ok(a[f], a.id + ": " + f));
  assert.ok(a.tests.length >= 3 && a.tests.some(t => t.verdeckt), a.id + ": sichtbare und verdeckte Tests");
  const r = L.pruefeAufgabe(a, a.loesung);
  assert.ok(r.kompiliert, a.id + ": Lösung kompiliert: " + (r.fehler && r.fehler.meldung));
  assert.strictEqual(r.bestanden, r.gesamt, a.id + ": Lösung besteht alle Tests: " + JSON.stringify(r.tests.filter(t => !t.ok).map(t => [t.nr, t.erhalten, t.fehler && t.fehler.meldung])));
  const v = L.pruefeAufgabe(a, a.vorlage);
  if (a.stufe === 5) {
    assert.ok(v.kompiliert, a.id + ": fehlerhafte Vorlage läuft (semantischer, kein Syntaxfehler): " + (v.fehler && v.fehler.meldung));
    assert.ok(v.bestanden < v.gesamt, a.id + ": fehlerhafte Vorlage scheitert an mindestens einem Test");
  } else assert.ok(v.bestanden < v.gesamt, a.id + ": leere Vorlage besteht nicht");
});
/* Fehler-Aufgaben: Lösung unterscheidet sich von der Vorlage nur wenig */
NEU.filter(a => a.stufe === 5).forEach(a => {
  const rest = a.vorlage.split("\n").map(z => z.trim());
  const neu = a.loesung.split("\n").map(z => z.trim()).filter(z => { const i = rest.indexOf(z); if (i >= 0) { rest.splice(i, 1); return false; } return true; });
  assert.ok(neu.length <= 3, a.id + ": kleine Korrektur (" + neu.length + " neue Zeilen: " + neu.join(" | ") + ")");
});

/* ---- Sprachmittel ---- */
const lauf = (c, m, a) => L.ausfuehren(c, { methode: m, args: a || [] });
const wert = (c, m, a) => { const r = lauf(c, m, a); assert.ok(r.ok, (r.fehler && r.fehler.meldung) + "\n" + c); return r.wert; };
const fehler = (c, m, a) => { const r = lauf(c, m, a); assert.ok(!r.ok, "Fehler erwartet:\n" + c); return r.fehler.text; };
/* switch: Durchfallen, break, default, String, char, Schachtelung in Schleife (continue gehört zur Schleife) */
assert.strictEqual(wert("int f(char c){ int p=0; switch(c){ case 'a': p+=1; case 'b': p+=10; break; case 'c': p+=100; break; } return p; }", "f", ["a"]), 11);
assert.strictEqual(wert("int f(char c){ int p=0; switch(c){ case 'a': p+=1; case 'b': p+=10; break; case 'c': p+=100; break; } return p; }", "f", ["z"]), 0);
assert.strictEqual(wert('int f(String s){ switch(s){ case "x": return 1; default: return 2; } }', "f", ["y"]), 2);
assert.strictEqual(wert("int f(int n){ int s=0; for(int i=0;i<n;i++){ switch(i%3){ case 0: continue; case 1: s+=i; break; default: s+=100; } } return s; }", "f", [6]), 205);
assert.strictEqual(wert("int f(int n){ switch(n){ case -1: return 7; default: return 0; } }", "f", [-1]), 7, "negative Marke");
assert.strictEqual(wert("int f(int n){ while(true){ switch(n){ case 1: break; } return 3; } }", "f", [1]), 3, "break im switch beendet nicht die Schleife");
assert.ok(/вернуть значение/.test(fehler("int f(int n){ switch(n){ case 1: return 1; } }", "f", [1])), "ohne default fehlt return");
assert.ok(/дважды/.test(fehler("int f(int n){ switch(n){ case 1: return 1; case 1: return 2; default: return 0; } }", "f", [1])));
assert.ok(/break можно писать только внутри цикла или switch/.test(fehler("int f(){ break; }", "f")));
assert.ok(/continue можно писать только внутри цикла/.test(fehler("int f(int n){ switch(n){ default: continue; } }", "f", [1])));
assert.ok(/case … ->/.test(fehler("int f(int n){ switch(n){ case 1 -> 2; } return 0; }", "f", [1])));
/* eigene Klassen */
const K = "class P { private int x; P(int x){ this.x = x; } int doppelt(){ return mal(2); } int mal(int k){ return x * k; } }\n";
assert.strictEqual(wert(K + "int f(){ return new P(7).doppelt(); }", "f"), 14, "Methode ruft Methode, Feld über Name");
assert.strictEqual(wert("class Z { int n = 5; void plus(){ n++; } int wert(){ return n; } } int f(){ Z z = new Z(); z.plus(); z.plus(); return z.wert(); }", "f"), 7, "Feld-Initialisierer, Standardkonstruktor");
assert.strictEqual(wert("class P { int x; P(int x){ x = x; } int getX(){ return x; } } int f(){ return new P(7).getX(); }", "f"), 0, "x = x ohne this ändert das Feld nicht (wie Java)");
assert.strictEqual(wert("class P { int x; P(int a){ x = a; } int getX(){ return x; } } int f(){ P a = new P(1); P b = new P(2); return a.getX() * 10 + b.getX(); }", "f"), 12, "Objekte getrennt");
assert.ok(/конструктор P/.test(fehler("class P { int x; P(int a){ x = a; } } int f(){ P p = new P(); return 1; }", "f")));
assert.ok(/нет метода getX/.test(fehler("class P { int x; } int f(){ P p = new P(); return p.getX(); }", "f")), "keine automatischen Getter bei eigenen Klassen");
assert.ok(/this бывает только/.test(fehler("int f(){ return this.x; }", "f")));
assert.strictEqual(wert("public class Main { int f(int a){ return a*2; } }", "f", [4]), 8, "Klasse nur mit Methoden = Hülle (wie bisher)");
/* Map */
assert.deepStrictEqual(wert("Map<String,Integer> f(String[] w){ Map<String,Integer> m = new HashMap<>(); for(String x : w){ m.put(x, m.getOrDefault(x, 0) + 1); } return m; }", "f", [["a", "b", "a"]]), { a: 2, b: 1 });
assert.strictEqual(wert("int f(Map<String,Integer> m){ int s = 0; for(String k : m.keySet()){ s += m.get(k); } return s; }", "f", [{ a: 2, b: 5 }]), 7);
assert.strictEqual(wert('String f(){ Map<Integer,String> m = new TreeMap<>(); m.put(3, "c"); m.put(1, "a"); m.put(2, "b"); String r = ""; for(int k : m.keySet()) r += m.get(k); return r; }', "f"), "abc", "TreeMap sortiert");
assert.strictEqual(wert('boolean f(){ Map<String,Integer> m = new HashMap<>(); m.put("a", 1); Integer alt = m.put("a", 5); return alt == 1 && m.get("a") == 5 && m.size() == 1 && m.containsKey("a") && !m.containsKey("b") && m.remove("a") == 5 && m.isEmpty(); }', "f"), true);
assert.ok(/null нельзя записать/.test(fehler('int f(){ Map<String,Integer> m = new HashMap<>(); int x = m.get("q"); return x; }', "f")), "get liefert null");
assert.ok(/Map<String, Integer>/.test(fehler("int f(){ Map<String,int> m = new HashMap<>(); return 0; }", "f")), "Wrapper erklären");
assert.ok(/интерфейс/.test(fehler("int f(){ Map<String,Integer> m = new Map<>(); return 0; }", "f")));
assert.ok(/keySet/.test(fehler("int f(Map<String,Integer> m){ for(String k : m){ } return 0; }", "f", [{}])), "for-each über Map erklärt keySet");
assert.ok(/put/.test(fehler('int f(){ Map<String,Integer> m = new HashMap<>(); m.add("a"); return 0; }', "f")));
/* Spur kennt switch */
const sp = L.verfolgen("int f(int n){\n  int s = 0;\n  switch (n) {\n    case 1:\n      s = 5;\n      break;\n    default:\n      s = 9;\n  }\n  return s;\n}", { methode: "f", args: [1], punkte: [{ zeile: 5, wann: "nach", werte: ["s"] }] });
assert.ok(sp.ok); assert.deepStrictEqual(sp.spur.map(z => z.werte[0].js), [5]);

/* Einbindung */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.ok(html.includes("gen/code-daten-plus.js") && sw.includes("./gen/code-daten-plus.js"));
assert.ok(html.indexOf("gen/code-daten.js") < html.indexOf("gen/code-daten-plus.js") && html.indexOf("gen/code-daten-plus.js") < html.indexOf("gen/code-trainer.js"));
console.log("code-plus: " + NEU.length + " Aufgaben, switch/Klassen/Map OK");
