/* ============================================================================
   gen/code-lauf.js — Ausführung von Java-ähnlichem Pseudocode (GA2)
   ----------------------------------------------------------------------------
   Lexer → Parser → statische Prüfung → Baumdurchlauf. Der Code der Lernenden
   wird NIE zu JavaScript: kein eval, kein new Function, kein setTimeout mit
   Text. Alle Namen werden über Map/Set/switch nachgeschlagen, nie über
   obj[name] auf JS-Objekten — so ist auch constructor/__proto__ unerreichbar.

   Werte zur Laufzeit:
     int/long/double/char → {t:"int"|"long"|"double"|"char", v:Zahl}
     boolean → true/false, String → JS-String, null → null
     Array  → {t:"array", et:Typ, a:[…]}
     Liste  → {t:"list",  et:Typ|null, a:[…], mod:Zähler}
     Objekt → {t:"obj", klasse, def, f:{feld:Wert}}
   Typ = {name, args:[Typ], dim}

   Fehlermeldungen auf Russisch mit Zeilennummer: «Строка 4: …».
   API: root.GENCODELAUF = { uebersetzen, ausfuehren, pruefeAufgabe, … }
   ========================================================================== */
"use strict";
(function (root) {
  const GRENZE = { schritte: 200000, tiefe: 150, zeichen: 100000, zellen: 1000000, ausgabe: 4000 };

  class CodeFehler extends Error {
    constructor(text, zeile, art) {
      super((zeile ? "Строка " + zeile + ": " : "") + text);
      this.text = text; this.zeile = zeile || 0; this.art = art || "laufzeit";
    }
  }
  const info = e => ({ text: e.text, zeile: e.zeile, meldung: e.message, art: e.art });
  const hat = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
  function plural(n, a, b, c) { const m = Math.abs(n) % 100, k = m % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k >= 2 && k <= 4 ? b : c; }
  function abstand(a, b) {
    const d = []; for (let i = 0; i <= a.length; i++) { d[i] = [i]; for (let j = 1; j <= b.length; j++) d[i][j] = i ? 0 : j; }
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function aehnlich(name, kandidaten) {
    const l = name.toLowerCase();
    const gleich = kandidaten.find(k => k !== name && k.toLowerCase() === l);
    if (gleich) return gleich;
    let best = null, bd = 99;
    kandidaten.forEach(k => { if (k === name) return; const d = abstand(l, k.toLowerCase()); if (d < bd) { bd = d; best = k; } });
    return best && bd <= (name.length > 5 ? 2 : 1) ? best : null;
  }

  /* ======================================================================
     Lexer
     ====================================================================== */
  const PRIM = new Set(["int", "long", "double", "float", "boolean", "char", "byte", "short", "void"]);
  const KW = new Set(("if else while do for return break continue new true false null class public private protected static final " +
    "switch case default this instanceof try catch throw throws import package abstract interface extends implements enum super").split(" ").concat(Array.from(PRIM)));
  const OPS = ["++", "--", "+=", "-=", "*=", "/=", "%=", "==", "!=", "<=", ">=", "&&", "||", "->", "::",
    "+", "-", "*", "/", "%", "=", "<", ">", "!", "?", ":", ";", ",", ".", "(", ")", "{", "}", "[", "]", "&", "|", "^", "~", "@"];
  const BUCHSTABE = /[\p{L}_$]/u, ZEICHEN = /[\p{L}\p{N}_$]/u;
  const ERSATZ = { "“": '"', "”": '"', "„": '"', "«": '"', "»": '"', "‘": "'", "’": "'", "‚": "'", "−": "-" };

  function lexer(q) {
    const t = [], n = q.length; let i = 0, z = 1;
    const c = k => { const x = q[k]; return x !== undefined && hat(ERSATZ, x) ? ERSATZ[x] : x; };
    /* q[k] ist ein Backslash → [Zeichen, nächste Position] */
    const escape = (k, zz) => {
      const e = q[k + 1];
      switch (e) {
        case "n": return ["\n", k + 2]; case "t": return ["\t", k + 2]; case "r": return ["\r", k + 2]; case "0": return ["\0", k + 2];
        case "\\": return ["\\", k + 2]; case "'": return ["'", k + 2]; case '"': return ['"', k + 2]; case "b": return ["\b", k + 2]; case "f": return ["\f", k + 2];
        case "u": { const h = q.slice(k + 2, k + 6); if (!/^[0-9a-fA-F]{4}$/.test(h)) throw new CodeFehler("неверная запись \\u — нужны 4 шестнадцатеричные цифры", zz, "syntax"); return [String.fromCharCode(parseInt(h, 16)), k + 6]; }
      }
      throw new CodeFehler("неизвестная escape-последовательность \\" + (e || ""), zz, "syntax");
    };
    while (i < n) {
      const ch = c(i);
      if (ch === "\n") { i++; z++; continue; }
      if (ch === " " || ch === "\t" || ch === "\r" || ch === " " || ch === "\f" || ch === "﻿") { i++; continue; }
      if (ch === "/" && q[i + 1] === "/") { while (i < n && q[i] !== "\n") i++; continue; }
      if (ch === "/" && q[i + 1] === "*") {
        const z0 = z; i += 2;
        while (i < n && !(q[i] === "*" && q[i + 1] === "/")) { if (q[i] === "\n") z++; i++; }
        if (i >= n) throw new CodeFehler("комментарий /* не закрыт — не хватает */", z0, "syntax");
        i += 2; continue;
      }
      if (BUCHSTABE.test(ch)) {
        let j = i; while (j < n && ZEICHEN.test(q[j])) j++;
        const w = q.slice(i, j); t.push({ typ: KW.has(w) ? "kw" : "id", wert: w, z }); i = j; continue;
      }
      if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(q[i + 1] || ""))) {
        let j = i, dbl = false;
        while (j < n && /[0-9_]/.test(q[j])) j++;
        if (q[j] === "." && /[0-9]/.test(q[j + 1] || "")) { dbl = true; j++; while (j < n && /[0-9_]/.test(q[j])) j++; }
        else if (q[j] === "." && !/[A-Za-z_]/.test(q[j + 1] || "")) { dbl = true; j++; }
        if (/[eE]/.test(q[j] || "") && /[0-9+-]/.test(q[j + 1] || "")) {
          dbl = true; j++; if (q[j] === "+" || q[j] === "-") j++;
          if (!/[0-9]/.test(q[j] || "")) throw new CodeFehler("неверная запись числа", z, "syntax");
          while (j < n && /[0-9]/.test(q[j])) j++;
        }
        const text = q.slice(i, j).replace(/_/g, ""); let typ = dbl ? "double" : "int";
        if (/[lL]/.test(q[j] || "") && !dbl) { typ = "long"; j++; }
        else if (/[dDfF]/.test(q[j] || "")) { typ = "double"; j++; }
        if (ZEICHEN.test(q[j] || "")) throw new CodeFehler("неверная запись числа «" + q.slice(i, j + 1) + "…» — имя переменной не может начинаться с цифры", z, "syntax");
        const v = Number(text);
        if (typ === "int" && v > 2147483647) throw new CodeFehler("число " + text + " слишком большое для int (максимум 2147483647); для long допиши L: " + text + "L", z, "syntax");
        t.push({ typ, wert: v, z, roh: q.slice(i, j) }); i = j; continue;
      }
      if (ch === '"') {
        /* Typografische Anführungszeichen (Handy-Tastatur) gelten als ", aber
           eine mit " begonnene Zeichenkette endet nur an einem geraden ". */
        const z0 = z, zeilenEnde = q.indexOf("\n", i) < 0 ? n : q.indexOf("\n", i);
        const gerade = q[i] === '"' && q.slice(i + 1, zeilenEnde).includes('"'); let s = ""; i++;
        for (;;) {
          if (i >= n || q[i] === "\n") throw new CodeFehler("строка не закрыта кавычкой \"", z0, "syntax");
          if (gerade ? q[i] === '"' : c(i) === '"') { i++; break; }
          if (q[i] === "\\") { const r = escape(i, z0); s += r[0]; i = r[1]; continue; }
          s += q[i]; i++;
        }
        t.push({ typ: "str", wert: s, z: z0 }); continue;
      }
      if (ch === "'") {
        let j = i + 1, s;
        if (c(j) === "'") throw new CodeFehler("пустой символ '' — между апострофами должен быть ровно один знак", z, "syntax");
        const roh = q[j];
        if (roh === "\\") { const r = escape(j, z); s = r[0]; j = r[1]; }
        else { s = roh; j++; }
        if (s === undefined || roh === "\n" || c(j) !== "'")
          throw new CodeFehler("символ в апострофах '…' — ровно один знак, например 'a'. Для текста нужны кавычки \"…\"", z, "syntax");
        i = j + 1;
        t.push({ typ: "char", wert: s.charCodeAt(0), z }); continue;
      }
      const op = OPS.find(o => q.startsWith(o, i));
      if (op) { t.push({ typ: "op", wert: op, z }); i += op.length; continue; }
      throw new CodeFehler("непонятный символ «" + ch + "»", z, "syntax");
    }
    t.push({ typ: "eof", wert: "", z });
    return t;
  }

  /* ======================================================================
     Typen
     ====================================================================== */
  const T = (name, args, dim) => ({ name, args: args || [], dim: dim || 0 });
  function typStr(t) { if (!t) return "?"; return t.name + (t.args && t.args.length ? "<" + t.args.map(typStr).join(", ") + ">" : "") + "[]".repeat(t.dim || 0); }
  const typGleich = (a, b) => typStr(a) === typStr(b);
  const elementTyp = t => T(t.name, t.args, t.dim - 1);
  const GANZ = new Set(["int", "short", "byte", "Integer", "Short", "Byte"]);
  const LANG = new Set(["long", "Long"]);
  const KOMMA = new Set(["double", "float", "Double", "Float"]);
  const LISTEN = new Set(["List", "ArrayList", "LinkedList", "Collection"]);
  const BEKANNT = ["int", "long", "double", "float", "boolean", "char", "byte", "short", "String", "Integer", "Long", "Double", "Float",
    "Boolean", "Character", "Short", "Byte", "Object", "List", "ArrayList", "LinkedList", "Collection", "var"];
  const WRAPPER = { int: "Integer", long: "Long", double: "Double", float: "Float", boolean: "Boolean", char: "Character", short: "Short", byte: "Byte" };

  /* ======================================================================
     Parser
     ====================================================================== */
  function parse(tokens) {
    let p = 0;
    const tk = () => tokens[p];
    const at = k => tokens[Math.min(k, tokens.length - 1)];
    const ist = (w, typ) => { const t = tokens[p]; return t.wert === w && (typ ? t.typ === typ : t.typ === "op"); };
    const zeig = t => t.typ === "eof" ? "конец кода" : t.typ === "str" ? "\"" + t.wert + "\"" : t.typ === "char" ? "'" + String.fromCharCode(t.wert) + "'" : String(t.roh || t.wert);
    function erwarte(w, extra) {
      if (ist(w)) return tokens[p++];
      const vor = tokens[Math.max(0, p - 1)];
      if ((w === ";" || w === ")" || w === "]") && p > 0 && vor.z < tk().z)
        throw new CodeFehler("ожидалась `" + w + "` после «" + zeig(vor) + "»" + (extra || ""), vor.z, "syntax");
      throw new CodeFehler("ожидалась `" + w + "`, а стоит «" + zeig(tk()) + "»" + (extra || ""), tk().z, "syntax");
    }
    function name(was) {
      const t = tk();
      if (t.typ === "id") { p++; return t; }
      if (t.typ === "kw") throw new CodeFehler("«" + t.wert + "» — служебное слово Java, его нельзя использовать как " + was, t.z, "syntax");
      throw new CodeFehler("ожидалось " + was + ", а стоит «" + zeig(t) + "»", t.z, "syntax");
    }
    /* Typ ab Position q versuchen — ohne Fehler, liefert {typ, ende} oder null */
    function versucheTyp(q) {
      const t = at(q);
      let nm;
      if (t.typ === "kw" && PRIM.has(t.wert)) nm = t.wert;
      else if (t.typ === "id") nm = t.wert;
      else return null;
      q++;
      let args = [];
      if (at(q).typ === "op" && at(q).wert === "<") {
        q++;
        if (at(q).wert === ">") q++;
        else for (;;) {
          const r = versucheTyp(q); if (!r) return null;
          args.push(r.typ); q = r.ende;
          if (at(q).wert === ",") { q++; continue; }
          if (at(q).wert === ">") { q++; break; }
          return null;
        }
      }
      let dim = 0;
      while (at(q).wert === "[" && at(q + 1).wert === "]") { dim++; q += 2; }
      return { typ: T(nm, args, dim), ende: q };
    }
    const MODIF = new Set(["public", "private", "protected", "static", "final", "abstract"]);
    const modifikatoren = () => { while (tk().typ === "kw" && MODIF.has(tk().wert)) p++; };

    function programm() {
      const methoden = [];
      while (tk().typ !== "eof") {
        modifikatoren();
        if (ist("import", "kw") || ist("package", "kw")) { while (!ist(";") && tk().typ !== "eof") p++; erwarte(";"); continue; }
        if (ist("class", "kw")) {
          const k = tokens[p++]; name("имя класса");
          const auf = erwarte("{");
          for (;;) {
            modifikatoren();
            if (ist("}")) { p++; break; }
            if (tk().typ === "eof") throw new CodeFehler("класс не закрыт — не хватает `}`", auf.z || k.z, "syntax");
            methoden.push(methode());
          }
          continue;
        }
        if (ist("}")) throw new CodeFehler("лишняя `}` — для неё нет открывающей `{`", tk().z, "syntax");
        if (tk().typ === "eof") break;
        methoden.push(methode());
      }
      return methoden;
    }
    function methode() {
      modifikatoren();
      const start = tk(), r = versucheTyp(p);
      if (!r || at(r.ende).typ !== "id" || at(r.ende + 1).wert !== "(") {
        if (r && at(r.ende).typ === "id") throw new CodeFehler("здесь ожидалось объявление метода. Команды и переменные пишутся внутри метода: int summe(int[] werte) { … }", start.z, "syntax");
        if (start.typ === "id" && at(p + 1).wert === "(") throw new CodeFehler("у метода " + start.wert + " не указан тип результата: например int " + start.wert + "(…) или void " + start.wert + "(…)", start.z, "syntax");
        throw new CodeFehler("здесь ожидалось объявление метода, например: int summe(int[] werte) { … }. Весь код должен стоять внутри метода.", start.z, "syntax");
      }
      p = r.ende;
      const nm = tokens[p++];
      erwarte("(");
      const params = [];
      if (!ist(")")) for (;;) {
        if (ist("final", "kw")) p++;
        const pt = versucheTyp(p);
        if (!pt) throw new CodeFehler("ожидался тип параметра, например int[] werte", tk().z, "syntax");
        p = pt.ende;
        const pn = name("имя параметра");
        params.push({ typ: pt.typ, name: pn.wert, z: pn.z });
        if (ist(",")) { p++; continue; }
        break;
      }
      erwarte(")");
      if (ist("throws", "kw")) { p++; name("имя исключения"); while (ist(",")) { p++; name("имя исключения"); } }
      if (ist(";")) throw new CodeFehler("после заголовка метода нужен блок { … }, а не `;`", tk().z, "syntax");
      if (!ist("{")) throw new CodeFehler("ожидалась `{` — тело метода " + nm.wert, tk().z, "syntax");
      const body = block();
      return { name: nm.wert, rueck: r.typ, params, body, z: start.z, ende: body.ende };
    }
    function block() {
      const auf = erwarte("{"), body = [];
      while (!ist("}")) {
        if (tk().typ === "eof") throw new CodeFehler("блок `{` из этой строки не закрыт — не хватает `}`", auf.z, "syntax");
        body.push(anweisung());
      }
      const zu = tokens[p++];
      return { k: "block", body, z: auf.z, ende: zu.z };
    }
    function istDeklaration() {
      const r = versucheTyp(p);
      return r && at(r.ende).typ === "id" ? r : null;
    }
    function anweisung() {
      const t = tk();
      if (ist("{")) return block();
      if (ist(";")) { p++; return { k: "leer", z: t.z }; }
      if (t.typ === "kw") switch (t.wert) {
        case "if": {
          p++; erwarte("(", " — условие if пишется в скобках: if (…)"); const c = ausdruck(); erwarte(")");
          const dann = anweisung(); let sonst = null;
          if (ist("else", "kw")) { p++; sonst = anweisung(); }
          return { k: "if", c, dann, sonst, z: t.z };
        }
        case "while": { p++; erwarte("(", " — условие while пишется в скобках: while (…)"); const c = ausdruck(); erwarte(")"); return { k: "while", c, body: anweisung(), z: t.z }; }
        case "do": {
          p++; const body = anweisung();
          if (!ist("while", "kw")) throw new CodeFehler("после do { … } ожидалось while (…);", tk().z, "syntax");
          const w = tokens[p++]; erwarte("("); const c = ausdruck(); erwarte(")"); erwarte(";");
          return { k: "do", body, c, z: t.z, zw: w.z };
        }
        case "for": return forSchleife();
        case "return": { p++; let e = null; if (!ist(";")) e = ausdruck(); erwarte(";"); return { k: "return", e, z: t.z }; }
        case "break": case "continue": p++; erwarte(";"); return { k: t.wert, z: t.z };
        case "else": throw new CodeFehler("else без if — проверь фигурные скобки { } перед else", t.z, "syntax");
        case "switch": case "case": case "default": throw new CodeFehler("switch в этом тренажёре не поддерживается — используй if / else if", t.z, "syntax");
        case "try": case "catch": case "throw": throw new CodeFehler("try / catch / throw в этих заданиях не нужны", t.z, "syntax");
        case "final": { p++; if (!istDeklaration()) throw new CodeFehler("после final ожидалось объявление переменной", tk().z, "syntax"); const d = deklaration(); erwarte(";"); return d; }
        case "class": throw new CodeFehler("класс внутри метода объявлять не нужно", t.z, "syntax");
        case "public": case "private": case "protected": case "static":
          throw new CodeFehler("«" + t.wert + "» внутри метода не пишется. Если это начало нового метода — выше не хватает `}`", t.z, "syntax");
        case "this": throw new CodeFehler("this в этих заданиях не нужен — пиши просто имя переменной", t.z, "syntax");
      }
      const r = istDeklaration();
      if (r) {
        if (at(r.ende + 1).wert === "(") throw new CodeFehler("объявление метода внутри другого метода — похоже, выше не хватает `}`", t.z, "syntax");
        const d = deklaration(); erwarte(";"); return d;
      }
      if (t.typ === "id") {
        const l = t.wert.toLowerCase();
        if (KW.has(l) && l !== t.wert) throw new CodeFehler("служебные слова пишутся строчными буквами: " + l + ", а не " + t.wert, t.z, "syntax");
        if (["elseif", "elsif", "elif"].includes(l)) throw new CodeFehler("в Java пишут else if (…) — двумя словами", t.z, "syntax");
        if (["foreach", "repeat", "until", "then", "endif", "wenn", "solange", "sonst"].includes(l)) throw new CodeFehler("«" + t.wert + "» — нет такой команды в Java. Используй if, else, while, for", t.z, "syntax");
      }
      const e = ausdruck();
      if (!["assign", "pre", "post", "call", "newobj"].includes(e.k))
        throw new CodeFehler("это выражение ничего не делает. Нужна команда: присваивание (x = …), вызов метода, ++ / -- или return", e.z || t.z, "syntax");
      erwarte(";");
      return { k: "expr", e, z: t.z };
    }
    function deklaration() {
      const r = versucheTyp(p), start = tk(); p = r.ende;
      const vars = [];
      for (;;) {
        const n = name("имя переменной");
        if (ist("[")) throw new CodeFehler("в Java скобки массива пишут у типа: " + typStr(r.typ) + "[] " + n.wert, n.z, "syntax");
        let init = null;
        if (ist("=")) { p++; init = ist("{") ? feldLiteral() : ausdruck(); }
        vars.push({ name: n.wert, init, z: n.z });
        if (ist(",") && at(p + 1).typ === "id" && [",", "=", ";"].includes(at(p + 2).wert)) { p++; continue; }
        break;
      }
      return { k: "decl", typ: r.typ, vars, z: start.z };
    }
    function feldLiteral() {
      const auf = erwarte("{"), elems = [];
      if (!ist("}")) for (;;) {
        elems.push(ist("{") ? feldLiteral() : ausdruck());
        if (ist(",")) { p++; if (ist("}")) break; continue; }
        break;
      }
      erwarte("}");
      return { k: "arrlit", elems, z: auf.z };
    }
    function anweisungsAusdruck() {
      const e = ausdruck();
      if (!["assign", "pre", "post", "call", "newobj"].includes(e.k)) throw new CodeFehler("в этой части for нужна команда, например i++ или i = i + 1", e.z, "syntax");
      return e;
    }
    function forSchleife() {
      const t = tokens[p++];
      erwarte("(", " — заголовок for пишется в скобках");
      const merk = p;
      if (ist("final", "kw")) p++;
      const r = versucheTyp(p);
      if (r && at(r.ende).typ === "id" && at(r.ende + 1).wert === ":") {
        p = r.ende; const n = tokens[p++]; p++;
        const e = ausdruck(); erwarte(")");
        return { k: "foreach", typ: r.typ, name: n.wert, nz: n.z, e, body: anweisung(), z: t.z };
      }
      p = merk;
      if (ist("final", "kw")) p++;
      const init = [];
      const hinweis = " — в заголовке for три части разделяются точкой с запятой: for (int i = 0; i < n; i++)";
      if (!ist(";")) {
        if (istDeklaration()) init.push(deklaration());
        else { init.push({ k: "expr", e: anweisungsAusdruck(), z: tk().z }); while (ist(",")) { p++; init.push({ k: "expr", e: anweisungsAusdruck(), z: tk().z }); } }
      }
      erwarte(";", hinweis);
      let c = null; if (!ist(";")) c = ausdruck();
      erwarte(";", hinweis);
      const upd = [];
      if (!ist(")")) { upd.push(anweisungsAusdruck()); while (ist(",")) { p++; upd.push(anweisungsAusdruck()); } }
      erwarte(")");
      return { k: "for", init, c, upd, body: anweisung(), z: t.z };
    }

    /* ---------- Ausdrücke ---------- */
    const ZUW = new Set(["=", "+=", "-=", "*=", "/=", "%="]);
    function ausdruck() { return zuweisung(); }
    function zuweisung() {
      const l = ternaer();
      if (tk().typ === "op" && ZUW.has(tk().wert)) {
        const op = tokens[p++];
        if (!["name", "index", "feld"].includes(l.k)) throw new CodeFehler("слева от " + op.wert + " должна стоять переменная или элемент массива", op.z, "syntax");
        if (ist("{")) throw new CodeFehler("литерал {…} можно писать только при объявлении массива; иначе: new int[] {…}", tk().z, "syntax");
        return { k: "assign", op: op.wert, ziel: l, wert: zuweisung(), z: op.z };
      }
      return l;
    }
    function ternaer() {
      const c = binaer(0);
      if (ist("?")) { const t = tokens[p++]; const a = ausdruck(); erwarte(":"); return { k: "cond", c, a, b: ternaer(), z: t.z }; }
      return c;
    }
    const STUFEN = [["||"], ["&&"], ["==", "!="], ["<", "<=", ">", ">="], ["+", "-"], ["*", "/", "%"]];
    function binaer(s) {
      if (s >= STUFEN.length) return unaer();
      let l = binaer(s + 1);
      while (tk().typ === "op" && STUFEN[s].includes(tk().wert)) {
        const op = tokens[p++];
        l = { k: "bin", op: op.wert, l, r: binaer(s + 1), z: op.z };
      }
      if (s === 0 && tk().typ === "op" && ["&", "|", "^"].includes(tk().wert))
        throw new CodeFehler("одиночный «" + tk().wert + "» здесь не используется: «и» — это &&, «или» — это ||", tk().z, "syntax");
      if (s === 0 && ist("instanceof", "kw")) throw new CodeFehler("instanceof в этих заданиях не нужен", tk().z, "syntax");
      return l;
    }
    const CASTBAR = new Set(["int", "long", "double", "float", "char", "short", "byte", "boolean"]);
    function unaer() {
      const t = tk();
      if (t.typ === "op") {
        if (t.wert === "!" || t.wert === "-" || t.wert === "+") {
          p++; const e = unaer();
          if (t.wert === "-" && e.k === "lit" && e.w && typeof e.w === "object" && e.w.t !== "char") return { k: "lit", w: { t: e.w.t, v: -e.w.v }, z: t.z };
          return { k: "unary", op: t.wert, e, z: t.z };
        }
        if (t.wert === "++" || t.wert === "--") {
          p++; const e = unaer();
          if (!["name", "index", "feld"].includes(e.k)) throw new CodeFehler(t.wert + " можно применять только к переменной", t.z, "syntax");
          return { k: "pre", op: t.wert, e, z: t.z };
        }
        if (t.wert === "(") {
          const a = at(p + 1), b = at(p + 2);
          const castTyp = (a.typ === "kw" && CASTBAR.has(a.wert)) || (a.typ === "id" && ["String", "Integer", "Double", "Long", "Character", "Boolean", "Object"].includes(a.wert) && b.wert === ")");
          if (castTyp && b.wert === ")") { p += 3; const e = unaer(); return { k: "cast", typ: T(a.wert), e, z: t.z }; }
        }
        if (t.wert === "~") throw new CodeFehler("битовые операции (~) в этих заданиях не нужны", t.z, "syntax");
      }
      return postfix(primaer());
    }
    function argumente() {
      erwarte("(");
      const a = [];
      if (!ist(")")) for (;;) { a.push(ausdruck()); if (ist(",")) { p++; continue; } break; }
      erwarte(")");
      return a;
    }
    function postfix(e) {
      for (;;) {
        if (ist(".")) {
          p++;
          const n = tk();
          if (n.typ !== "id") {
            if (n.typ === "kw" && n.wert === "class") throw new CodeFehler(".class в этих заданиях не нужен", n.z, "syntax");
            throw new CodeFehler("после точки ожидалось имя метода или поля", n.z, "syntax");
          }
          p++;
          if (ist("(")) e = { k: "call", obj: e, name: n.wert, args: argumente(), z: n.z };
          else e = { k: "feld", e, name: n.wert, z: n.z };
          continue;
        }
        if (ist("[")) { const t = tokens[p++]; const i = ausdruck(); erwarte("]"); e = { k: "index", e, i, z: t.z }; continue; }
        if (ist("++") || ist("--")) {
          const t = tokens[p++];
          if (!["name", "index", "feld"].includes(e.k)) throw new CodeFehler(t.wert + " можно применять только к переменной", t.z, "syntax");
          e = { k: "post", op: t.wert, e, z: t.z }; continue;
        }
        if (ist("->")) throw new CodeFehler("лямбда-выражения (->) в этом тренажёре не поддерживаются — напиши обычный цикл", tk().z, "syntax");
        if (ist("::")) throw new CodeFehler("ссылки на методы (::) в этом тренажёре не поддерживаются", tk().z, "syntax");
        return e;
      }
    }
    function primaer() {
      const t = tk();
      switch (t.typ) {
        case "int": case "long": case "double": p++; return { k: "lit", w: { t: t.typ, v: t.wert }, z: t.z };
        case "char": p++; return { k: "lit", w: { t: "char", v: t.wert }, z: t.z };
        case "str": p++; return { k: "lit", w: t.wert, z: t.z };
        case "id":
          p++;
          if (ist("(")) return { k: "call", obj: null, name: t.wert, args: argumente(), z: t.z };
          return { k: "name", name: t.wert, z: t.z };
        case "kw":
          if (t.wert === "true" || t.wert === "false") { p++; return { k: "lit", w: t.wert === "true", z: t.z }; }
          if (t.wert === "null") { p++; return { k: "lit", w: null, z: t.z }; }
          if (t.wert === "new") return neu();
          if (t.wert === "this" || t.wert === "super") throw new CodeFehler(t.wert + " в этих заданиях не нужен — пиши просто имя", t.z, "syntax");
          if (PRIM.has(t.wert)) throw new CodeFehler("здесь ожидалось значение, а стоит тип " + t.wert + ". Объявление переменной пишется отдельной командой", t.z, "syntax");
          throw new CodeFehler("здесь ожидалось значение, а стоит служебное слово «" + t.wert + "»", t.z, "syntax");
        case "op":
          if (t.wert === "(") { p++; const e = ausdruck(); erwarte(")"); return Object.assign({}, e, { klammer: true }); }
          if (t.wert === "{") throw new CodeFehler("литерал {…} можно писать только при объявлении массива: int[] a = {1, 2};", t.z, "syntax");
          if (t.wert === ")" ) throw new CodeFehler("лишняя `)` или пропущено значение перед ней", t.z, "syntax");
          if (t.wert === ";") throw new CodeFehler("перед `;` не хватает значения", t.z, "syntax");
          break;
        case "eof": throw new CodeFehler("код оборвался — выражение не закончено", t.z, "syntax");
      }
      throw new CodeFehler("здесь ожидалось значение или переменная, а стоит «" + zeig(t) + "»", t.z, "syntax");
    }
    function neu() {
      const t = tokens[p++], b = tk();
      if (!(b.typ === "id" || (b.typ === "kw" && PRIM.has(b.wert)))) throw new CodeFehler("после new ожидался тип: new int[5] или new ArrayList<>()", b.z, "syntax");
      p++;
      let args = [];
      if (ist("<")) {
        p++;
        if (ist(">")) p++;
        else for (;;) {
          const r = versucheTyp(p); if (!r) throw new CodeFehler("в <…> ожидался тип, например Integer", tk().z, "syntax");
          args.push(r.typ); p = r.ende;
          if (ist(",")) { p++; continue; }
          erwarte(">"); break;
        }
      }
      if (ist("[")) {
        const dims = []; let leer = 0;
        while (ist("[")) {
          p++;
          if (ist("]")) { p++; leer++; continue; }
          if (leer) throw new CodeFehler("размеры массива указываются слева направо: new int[3][]", tk().z, "syntax");
          dims.push(ausdruck()); erwarte("]");
        }
        const dim = dims.length + leer;
        if (!dims.length) {
          if (!ist("{")) throw new CodeFehler("ожидался размер массива new " + b.wert + "[5] или значения new " + b.wert + "[] {1, 2}", tk().z, "syntax");
          return { k: "newarr", basis: T(b.wert, args), dims, dim, init: feldLiteral(), z: t.z };
        }
        if (ist("{")) throw new CodeFehler("нельзя одновременно указать размер и значения: new int[] {1, 2} без числа в скобках", tk().z, "syntax");
        return { k: "newarr", basis: T(b.wert, args), dims, dim, z: t.z };
      }
      if (ist("(")) return { k: "newobj", typ: T(b.wert, args), args: argumente(), z: t.z };
      throw new CodeFehler("после new " + b.wert + " ожидались ( ) или [ ]", tk().z, "syntax");
    }

    return { programm, methode, versucheTyp: () => { const r = versucheTyp(p); if (r) p = r.ende; return r && r.typ; }, ende: () => tk().typ === "eof" };
  }

  function parseTyp(text) {
    const tk = lexer(String(text)), P = parse(tk), t = P.versucheTyp();
    if (!t || !P.ende()) throw new Error("Ungültiger Typ: " + text);
    return t;
  }
  function parseSignatur(sig) {
    const P = parse(lexer(String(sig) + " { }"));
    const m = P.methode();
    return { name: m.name, rueck: m.rueck, params: m.params };
  }

  /* ======================================================================
     Statische Prüfung (wie der Java-Compiler: vor dem Start)
     ====================================================================== */
  const STATIK = new Set(["Math", "Integer", "Double", "Long", "Float", "String", "Character", "Boolean", "System", "Arrays", "List", "Collections", "Objects"]);
  const AUSGABE = new Set(["print", "println"]);

  function klassenMap(klassen) {
    const m = new Map();
    (klassen || []).forEach(k => {
      const felder = Object.create(null);
      Object.keys(k.felder || {}).forEach(f => { felder[f] = parseTyp(k.felder[f]); });
      m.set(k.name, { name: k.name, felder, konstruktor: Array.isArray(k.konstruktor) ? k.konstruktor.slice() : null });
    });
    return m;
  }

  function pruefeTyp(t, z, klassen, erlaubt) {
    const n = t.name;
    if (n === "void") { if (erlaubt !== "void" || t.dim) throw new CodeFehler("void можно писать только как тип результата метода", z, "typ"); return; }
    if (n === "var") { if (erlaubt !== "var" || t.dim || t.args.length) throw new CodeFehler("var можно использовать только для локальной переменной со значением: var x = 5;", z, "typ"); return; }
    if (!BEKANNT.includes(n) && !klassen.has(n)) {
      const alle = BEKANNT.concat(Array.from(klassen.keys()));
      const s = aehnlich(n, alle.concat(["return", "if", "for", "while", "else"]));
      if (s && /^[a-z]/.test(s) && !PRIM.has(s) && s !== "var") throw new CodeFehler("непонятное слово «" + n + "» — может быть, " + s + "?", z, "typ");
      if (["Map", "HashMap", "Set", "HashSet", "TreeMap", "Queue", "Stack", "Scanner", "Iterator"].includes(n)) throw new CodeFehler("тип " + n + " в этом тренажёре не поддерживается — обойдись массивом или List", z, "typ");
      throw new CodeFehler("неизвестный тип " + n + (s ? " — может быть, " + s + "?" : ". Известны: int, double, boolean, char, String, List<…>" + (klassen.size ? ", " + Array.from(klassen.keys()).join(", ") : "")), z, "typ");
    }
    if (t.args.length) {
      if (!LISTEN.has(n)) throw new CodeFehler("у типа " + n + " не бывает <…>", z, "typ");
      if (t.args.length > 1) throw new CodeFehler("у List в <…> указывается один тип", z, "typ");
      t.args.forEach(a => {
        if (PRIM.has(a.name) && !a.dim) throw new CodeFehler("в List<…> нужен класс-обёртка: List<" + WRAPPER[a.name] + ">, а не List<" + a.name + ">", z, "typ");
        pruefeTyp(a, z, klassen);
      });
    }
  }

  function kannEnden(s) {
    if (!s) return true;
    switch (s.k) {
      case "return": return false;
      case "block": return s.body.every(kannEnden);
      case "if": return !s.sonst || kannEnden(s.dann) || kannEnden(s.sonst);
      case "while": return !istWahr(s.c) || hatBreak(s.body);
      case "do": return istWahr(s.c) ? hatBreak(s.body) : true;
      case "for": return (s.c && !istWahr(s.c)) || hatBreak(s.body);
      default: return true;
    }
  }
  const istWahr = c => c && c.k === "lit" && c.w === true;
  function hatBreak(s) {
    if (!s) return false;
    switch (s.k) {
      case "break": return true;
      case "block": return s.body.some(hatBreak);
      case "if": return hatBreak(s.dann) || hatBreak(s.sonst);
      default: return false;
    }
  }

  function pruefeStatisch(methoden, klassen, warnungen) {
    const nachName = new Map();
    methoden.forEach(m => {
      const l = nachName.get(m.name) || [];
      if (l.some(x => x.params.length === m.params.length)) throw new CodeFehler("метод " + m.name + " с " + m.params.length + " " + plural(m.params.length, "параметром", "параметрами", "параметрами") + " объявлен дважды", m.z, "typ");
      l.push(m); nachName.set(m.name, l);
    });
    methoden.forEach(m => {
      pruefeTyp(m.rueck, m.z, klassen, "void");
      const scopes = [new Map()];
      m.params.forEach(pa => {
        pruefeTyp(pa.typ, pa.z, klassen);
        if (scopes[0].has(pa.name)) throw new CodeFehler("параметр " + pa.name + " указан дважды", pa.z, "typ");
        scopes[0].set(pa.name, pa.z);
      });
      const finde = n => scopes.some(s => s.has(n));
      const sichtbar = () => { const a = []; scopes.forEach(s => s.forEach((_, k) => a.push(k))); return a; };
      const deklariere = (n, z) => {
        for (const s of scopes) if (s.has(n)) throw new CodeFehler("переменная " + n + " уже объявлена (строка " + s.get(n) + "). Повторно тип не пишут: просто " + n + " = …", z, "typ");
        scopes[scopes.length - 1].set(n, z);
      };
      let schleifen = 0;
      const istVoid = m.rueck.name === "void" && !m.rueck.dim;
      function ausdruck(e, rolle) {
        if (!e) return;
        switch (e.k) {
          case "lit": return;
          case "name":
            if (finde(e.name)) return;
            if (STATIK.has(e.name) && rolle === "obj") return;
            if (STATIK.has(e.name)) throw new CodeFehler(e.name + " — это класс, а не значение. Используй его методы, например " + e.name + (e.name === "Math" ? ".max(a, b)" : ".…"), e.z, "typ");
            if (nachName.has(e.name)) throw new CodeFehler(e.name + " — это метод; вызов пишется со скобками: " + e.name + "(…)", e.z, "typ");
            {
              const s = aehnlich(e.name, sichtbar());
              throw new CodeFehler("переменная " + e.name + " не объявлена" + (s ? " — может быть, " + s + "?" : ". Объяви её с типом, например int " + e.name + " = 0;"), e.z, "typ");
            }
          case "assign": ausdruck(e.ziel); ausdruck(e.wert); return;
          case "cond": ausdruck(e.c); ausdruck(e.a); ausdruck(e.b); return;
          case "bin": ausdruck(e.l); ausdruck(e.r); return;
          case "unary": case "pre": case "post": case "cast": ausdruck(e.e); return;
          case "index": ausdruck(e.e); ausdruck(e.i); return;
          case "feld": ausdruck(e.e, "obj"); return;
          case "call":
            e.args.forEach(a => ausdruck(a));
            if (e.obj) {
              if (e.obj.k === "feld" && e.obj.e.k === "name" && e.obj.e.name === "System" && !finde("System")) return;
              ausdruck(e.obj, "obj"); return;
            }
            if (nachName.has(e.name)) {
              const l = nachName.get(e.name);
              if (!l.some(x => x.params.length === e.args.length)) {
                const n = l[0].params.length;
                throw new CodeFehler("метод " + e.name + " ожидает " + n + " " + plural(n, "аргумент", "аргумента", "аргументов") + ", а передано " + e.args.length, e.z, "typ");
              }
              return;
            }
            if (AUSGABE.has(e.name)) return;
            if (["length", "size", "get", "charAt", "equals", "add"].includes(e.name))
              throw new CodeFehler("метод " + e.name + "() вызывается у объекта: например werte." + e.name + "(…)", e.z, "typ");
            {
              const s = aehnlich(e.name, Array.from(nachName.keys()).concat(["println", "print"]));
              throw new CodeFehler("метод " + e.name + "(…) не объявлен" + (s ? " — может быть, " + s + "?" : ""), e.z, "typ");
            }
          case "newarr": pruefeTyp(T(e.basis.name, e.basis.args, e.dim), e.z, klassen); e.dims.forEach(d => ausdruck(d)); if (e.init) literal(e.init); return;
          case "newobj":
            pruefeTyp(e.typ, e.z, klassen);
            e.args.forEach(a => ausdruck(a)); return;
          case "arrlit": literal(e); return;
        }
      }
      function literal(l) { l.elems.forEach(x => x.k === "arrlit" ? literal(x) : ausdruck(x)); }
      function anw(s) {
        if (!s) return;
        switch (s.k) {
          case "block": scopes.push(new Map()); s.body.forEach(anw); scopes.pop(); return;
          case "leer": return;
          case "decl":
            pruefeTyp(s.typ, s.z, klassen, "var");
            s.vars.forEach(v => {
              if (s.typ.name === "var" && !v.init) throw new CodeFehler("var требует начального значения: var " + v.name + " = …;", v.z, "typ");
              if (v.init && v.init.k === "arrlit" && !s.typ.dim) throw new CodeFehler(s.typ.name === "var" ? "var " + v.name + " = {…} нельзя: укажи тип, например int[] " + v.name : "значения в {…} подходят только для массива, например int[] " + v.name + " = {1, 2};", v.z, "typ");
              ausdruck(v.init);
              deklariere(v.name, v.z);
            });
            return;
          case "expr": ausdruck(s.e); return;
          case "if": ausdruck(s.c); scopes.push(new Map()); anw(s.dann); scopes.pop(); scopes.push(new Map()); anw(s.sonst); scopes.pop(); return;
          case "while": case "do": ausdruck(s.c); schleifen++; scopes.push(new Map()); anw(s.body); scopes.pop(); schleifen--; return;
          case "for":
            scopes.push(new Map());
            s.init.forEach(anw); ausdruck(s.c); s.upd.forEach(u => ausdruck(u));
            schleifen++; scopes.push(new Map()); anw(s.body); scopes.pop(); schleifen--;
            scopes.pop(); return;
          case "foreach":
            ausdruck(s.e);
            pruefeTyp(s.typ, s.z, klassen, "var");
            scopes.push(new Map()); deklariere(s.name, s.nz);
            schleifen++; anw(s.body); schleifen--;
            scopes.pop(); return;
          case "break": case "continue":
            if (!schleifen) throw new CodeFehler(s.k + " можно писать только внутри цикла", s.z, "typ");
            return;
          case "return":
            if (istVoid && s.e) throw new CodeFehler("метод " + m.name + " объявлен как void и ничего не возвращает — убери значение после return (или поменяй тип метода)", s.z, "typ");
            if (!istVoid && !s.e) throw new CodeFehler("return без значения: метод " + m.name + " должен вернуть " + typStr(m.rueck), s.z, "typ");
            ausdruck(s.e); return;
        }
      }
      anw(m.body);
      if (!istVoid && kannEnden(m.body))
        throw new CodeFehler("метод " + m.name + " должен вернуть значение типа " + typStr(m.rueck) + " — в конце не хватает return", m.ende || m.z, "typ");
    });
  }

  /* ======================================================================
     Werte
     ====================================================================== */
  const I = v => ({ t: "int", v }), L = v => ({ t: "long", v }), D = v => ({ t: "double", v }), C = v => ({ t: "char", v });
  const istZahl = w => w !== null && typeof w === "object" && (w.t === "int" || w.t === "long" || w.t === "double" || w.t === "char");
  function typName(w) {
    if (w === null) return "null";
    if (w === undefined) return "void";
    if (typeof w === "string") return "String";
    if (typeof w === "boolean") return "boolean";
    switch (w.t) {
      case "array": return typStr(w.et) + "[]";
      case "list": return w.et ? "List<" + typStr(w.et) + ">" : "List";
      case "obj": return w.klasse;
      case "out": return "PrintStream";
      default: return w.t;
    }
  }
  function typVon(w, z) {
    if (w === null) throw new CodeFehler("var x = null нельзя — у null нет типа; укажи тип явно", z, "typ");
    if (typeof w === "string") return T("String");
    if (typeof w === "boolean") return T("boolean");
    switch (w.t) {
      case "array": return T(w.et.name, w.et.args, w.et.dim + 1);
      case "list": return T("List", w.et ? [w.et] : []);
      case "obj": return T(w.klasse);
      default: return T(w.t);
    }
  }
  function dblStr(v) {
    if (Number.isNaN(v)) return "NaN";
    if (v === Infinity) return "Infinity";
    if (v === -Infinity) return "-Infinity";
    if (v === 0) return 1 / v < 0 ? "-0.0" : "0.0";
    const a = Math.abs(v);
    if (a >= 1e-3 && a < 1e7) { const s = String(v); return /[.e]/.test(s) ? s : s + ".0"; }
    const m = v.toExponential().match(/^(-?[\d.]+)e([+-]\d+)$/);
    if (!m) return String(v);
    return (m[1].includes(".") ? m[1] : m[1] + ".0") + "E" + Number(m[2]);
  }
  function str(w) {
    if (w === null) return "null";
    if (typeof w === "string") return w;
    if (typeof w === "boolean") return String(w);
    switch (w.t) {
      case "int": case "long": return String(w.v);
      case "double": return dblStr(w.v);
      case "char": return String.fromCharCode(w.v);
      case "list": case "array": return "[" + w.a.map(str).join(", ") + "]";
      case "obj": return w.klasse + "[" + Object.keys(w.f).map(k => k + "=" + str(w.f[k])).join(", ") + "]";
    }
    return "?";
  }
  function standardWert(t) {
    if (t.dim) return null;
    if (GANZ.has(t.name) && PRIM.has(t.name)) return I(0);
    if (t.name === "long") return L(0);
    if (t.name === "double" || t.name === "float") return D(0);
    if (t.name === "char") return C(0);
    if (t.name === "boolean") return false;
    return null;
  }

  /* JS-Wert aus einem Test → Laufzeitwert nach Typ */
  function vonJS(x, t, klassen, wo) {
    wo = wo || "значение";
    if (x === null || x === undefined) {
      if (t.dim || !PRIM.has(t.name)) return null;
      throw new Error("Test: " + wo + " ist null, Typ " + typStr(t));
    }
    if (t.dim) {
      if (!Array.isArray(x)) throw new Error("Test: " + wo + " ist kein Array");
      const et = elementTyp(t);
      return { t: "array", et, a: x.map((y, i) => vonJS(y, et, klassen, wo + "[" + i + "]")) };
    }
    const n = t.name;
    if (GANZ.has(n)) return I(Number(x) | 0);
    if (LANG.has(n)) return L(Math.trunc(Number(x)));
    if (KOMMA.has(n)) return D(Number(x));
    if (n === "char" || n === "Character") return C(typeof x === "number" ? x : String(x).charCodeAt(0));
    if (n === "boolean" || n === "Boolean") return !!x;
    if (n === "String") return String(x);
    if (LISTEN.has(n)) {
      if (!Array.isArray(x)) throw new Error("Test: " + wo + " ist keine Liste");
      const et = t.args[0] || null;
      return { t: "list", et, a: x.map((y, i) => et ? vonJS(y, et, klassen, wo + "[" + i + "]") : y), mod: 0 };
    }
    const def = klassen.get(n);
    if (!def) throw new Error("Test: unbekannte Klasse " + n);
    const f = Object.create(null);
    Object.keys(def.felder).forEach(k => { f[k] = vonJS(hat(x, k) ? x[k] : null, def.felder[k], klassen, wo + "." + k); });
    return { t: "obj", klasse: n, def, f };
  }
  function zuJS(w) {
    if (w === null || w === undefined) return w === undefined ? undefined : null;
    if (typeof w === "string" || typeof w === "boolean") return w;
    switch (w.t) {
      case "int": case "long": case "double": return w.v;
      case "char": return String.fromCharCode(w.v);
      case "array": case "list": return w.a.map(zuJS);
      case "obj": { const o = {}; Object.keys(w.f).forEach(k => { o[k] = zuJS(w.f[k]); }); return o; }
    }
    return null;
  }

  /* ======================================================================
     Laufzeit
     ====================================================================== */
  const BRK = { k: "break" }, CONT = { k: "continue" };

  function laufzeit(programm, klassen, optionen) {
    const max = (optionen && optionen.maxSchritte) || GRENZE.schritte;
    const methoden = new Map();
    programm.methoden.forEach(m => { const l = methoden.get(m.name) || []; l.push(m); methoden.set(m.name, l); });
    let schritte = 0, tiefe = 0, ausgabe = "", ausgabeVoll = false;
    const warnungen = new Map();
    const warn = (z, text) => { const k = z + "|" + text; if (!warnungen.has(k)) warnungen.set(k, { zeile: z, text, meldung: (z ? "Строка " + z + ": " : "") + text }); };
    let schleifenZeile = 0;
    function schritt(z) {
      if (++schritte > max) throw new CodeFehler("похоже на бесконечный цикл: программа сделала больше " + max.toLocaleString("ru-RU") + " шагов. Проверь условие цикла и то, что счётчик меняется.", schleifenZeile || z, "limit");
    }
    const fehl = (text, z, art) => new CodeFehler(text, z, art || "laufzeit");
    const npe = (was, z) => fehl(was + " — значение равно null (NullPointerException)", z);

    function finde(sc, n) { for (let s = sc; s; s = s.eltern) { const v = s.vars.get(n); if (v) return v; } return null; }
    const scope = eltern => ({ vars: new Map(), eltern });

    function beispiel(t, n) {
      if (t.dim) return typStr(t) + " " + n + " = new " + t.name + "[…];";
      if (GANZ.has(t.name) || LANG.has(t.name)) return typStr(t) + " " + n + " = 0;";
      if (KOMMA.has(t.name)) return typStr(t) + " " + n + " = 0.0;";
      if (t.name === "boolean") return "boolean " + n + " = false;";
      if (t.name === "String") return "String " + n + " = \"\";";
      if (LISTEN.has(t.name)) return typStr(t) + " " + n + " = new ArrayList<>();";
      return typStr(t) + " " + n + " = …;";
    }

    function fehlTyp(w, t, z, wo) {
      const von = typName(w), nach = typStr(t);
      let rat = "";
      if (istZahl(w) && !t.dim && (GANZ.has(t.name) || LANG.has(t.name) || t.name === "char")) {
        const ziel = PRIM.has(t.name) ? t.name : Object.keys(WRAPPER).find(k => WRAPPER[k] === t.name) || t.name;
        rat = " — нужно привести тип: (" + ziel + ") …" + (w.t === "double" ? " (дробная часть отбрасывается). Или объяви переменную как double" : "");
      } else if (typeof w === "string" && (GANZ.has(t.name) || KOMMA.has(t.name)) && !t.dim) rat = " — текст в число переводит Integer.parseInt(…) / Double.parseDouble(…)";
      else if (t.name === "String" && !t.dim && (istZahl(w) || typeof w === "boolean")) rat = w && w.t === "char" ? " — символ в строку: String.valueOf(c) или \"\" + c" : " — число в строку: String.valueOf(x) или \"\" + x";
      else if (t.name === "boolean" && istZahl(w)) rat = " — в Java true/false не заменяются числами 1/0";
      else if (w && w.t === "list" && t.dim) rat = " — List и массив — разные вещи";
      else if (w && w.t === "array" && LISTEN.has(t.name)) rat = " — массив и List — разные вещи";
      return fehl("нельзя записать значение типа " + von + " в " + wo + " (тип " + nach + ")" + rat, z, "typ");
    }
    function konvertiere(w, t, z, wo) {
      if (w === undefined) throw fehl("здесь нужно значение, а метод void ничего не возвращает", z, "typ");
      const n = t.name;
      if (t.dim) {
        if (w === null) return null;
        if (w && w.t === "array" && typStr(w.et) === typStr(elementTyp(t))) return w;
        throw fehlTyp(w, t, z, wo);
      }
      if (n === "Object" || n === "var") return w;
      if (w === null) {
        if (PRIM.has(n)) throw fehl("null нельзя записать в " + wo + " простого типа " + n, z, "typ");
        return null;
      }
      if (GANZ.has(n)) { if (w.t === "int") return w; if (w.t === "char" && n !== "Integer") return I(w.v); }
      else if (LANG.has(n)) { if (w.t === "long") return w; if (w.t === "int" || w.t === "char") return L(w.v); }
      else if (KOMMA.has(n)) { if (istZahl(w)) return w.t === "double" ? w : D(w.v); }
      else if (n === "char" || n === "Character") { if (w.t === "char") return w; }
      else if (n === "boolean" || n === "Boolean") { if (typeof w === "boolean") return w; }
      else if (n === "String") { if (typeof w === "string") return w; }
      else if (LISTEN.has(n)) {
        if (w.t === "list") {
          const et = t.args[0];
          if (et && !w.et) { w.a = w.a.map(x => konvertiere(x, et, z, "элемент списка")); w.et = et; }
          else if (et && w.et && typStr(et) !== typStr(w.et) && !(KOMMA.has(et.name) && KOMMA.has(w.et.name)))
            throw fehl("нельзя записать " + typName(w) + " в " + wo + " (тип " + typStr(t) + ")", z, "typ");
          return w;
        }
      } else if (w.t === "obj" && w.klasse === n) return w;
      throw fehlTyp(w, t, z, wo);
    }
    /* Explizite Umwandlung (Cast) — auch für zusammengesetzte Zuweisung */
    function d2i(v) { if (Number.isNaN(v)) return 0; if (v >= 2147483647) return 2147483647; if (v <= -2147483648) return -2147483648; return Math.trunc(v); }
    function cast(w, t, z) {
      const n = t.name;
      if (w === null && !PRIM.has(n)) return null;
      if (GANZ.has(n) || LANG.has(n) || KOMMA.has(n) || n === "char") {
        if (!istZahl(w)) throw fehl("(" + n + ") можно применить только к числу или символу, а здесь " + typName(w) + (typeof w === "string" ? ". Текст в число: Integer.parseInt(…)" : ""), z, "typ");
        if (GANZ.has(n)) return I(w.t === "double" ? d2i(w.v) : w.v | 0);
        if (LANG.has(n)) return L(w.t === "double" ? (Number.isNaN(w.v) ? 0 : Math.trunc(w.v)) : w.v);
        if (KOMMA.has(n)) return D(w.v);
        return C((w.t === "double" ? d2i(w.v) : w.v) & 0xFFFF);
      }
      if (n === "boolean" || n === "Boolean") { if (typeof w === "boolean") return w; throw fehl("(boolean) нельзя применить к " + typName(w) + " — в Java числа не превращаются в true/false", z, "typ"); }
      if (n === "String") { if (typeof w === "string") return w; throw fehl("(String) нельзя применить к " + typName(w) + " — используй String.valueOf(x) или \"\" + x", z, "typ"); }
      if (n === "Object") return w;
      return konvertiere(w, t, z, "приведение");
    }
    function zuweisbarMitCast(w, t, z) {
      if (t.dim || !(GANZ.has(t.name) || LANG.has(t.name) || KOMMA.has(t.name) || t.name === "char")) return konvertiere(w, t, z, "переменную");
      return cast(w, t, z);
    }

    function zahlFehler(op, w, z) {
      if (w === null) return npe("значение null нельзя использовать в «" + op + "»", z);
      if (w === undefined) return fehl("метод void ничего не возвращает — его результат нельзя использовать в «" + op + "»", z, "typ");
      if (typeof w === "boolean") return fehl("с true/false нельзя считать через «" + op + "»", z, "typ");
      if (typeof w === "string") return fehl("«" + op + "» не работает со строкой" + (["<", ">", "<=", ">="].includes(op) ? " — строки сравнивают через equals() или compareTo()" : ""), z, "typ");
      if (w.t === "list" || w.t === "array") return fehl("«" + op + "» не работает с " + (w.t === "list" ? "List" : "массивом") + " целиком — нужен отдельный элемент", z, "typ");
      return fehl("«" + op + "» не подходит для значения типа " + typName(w), z, "typ");
    }
    function machZahl(t, v) { return t === "int" ? I(v | 0) : t === "long" ? L(v) : D(v); }
    function binOp(op, l, r, z) {
      if (op === "+" && (typeof l === "string" || typeof r === "string")) {
        if (l === undefined || r === undefined) throw fehl("метод void ничего не возвращает — его нельзя склеить со строкой", z, "typ");
        const s = str(l) + str(r);
        if (s.length > GRENZE.zeichen) throw fehl("строка стала слишком длинной (больше " + GRENZE.zeichen + " символов)", z, "limit");
        return s;
      }
      if (op === "==" || op === "!=") { const g = gleich(l, r, z); return op === "==" ? g : !g; }
      if (!istZahl(l)) throw zahlFehler(op, l, z);
      if (!istZahl(r)) throw zahlFehler(op, r, z);
      const t = l.t === "double" || r.t === "double" ? "double" : l.t === "long" || r.t === "long" ? "long" : "int";
      const a = l.v, b = r.v;
      switch (op) {
        case "<": return a < b; case "<=": return a <= b; case ">": return a > b; case ">=": return a >= b;
        case "+": return machZahl(t, a + b);
        case "-": return machZahl(t, a - b);
        case "*": return t === "int" ? I(Math.imul(a, b)) : machZahl(t, a * b);
        case "/":
          if (t !== "double" && b === 0) throw fehl("деление на ноль (целые числа, ArithmeticException) — перед делением проверь, что делитель не 0", z);
          return t === "double" ? D(a / b) : machZahl(t, Math.trunc(a / b));
        case "%":
          if (t !== "double" && b === 0) throw fehl("остаток от деления на ноль (ArithmeticException) — проверь делитель", z);
          return machZahl(t, a % b);
      }
      throw fehl("неизвестная операция " + op, z);
    }
    function gleich(l, r, z) {
      if (l === undefined || r === undefined) throw fehl("метод void ничего не возвращает — сравнивать нечего", z, "typ");
      if (istZahl(l) && istZahl(r)) return l.v === r.v;
      if (typeof l === "boolean" && typeof r === "boolean") return l === r;
      if (l === null || r === null) return l === r;
      if (typeof l === "string" && typeof r === "string") {
        warn(z, "строки сравнены через == или != — в Java для строк используют equals(): a.equals(b). Здесь сравнение засчитано по тексту, но в настоящей Java оно может дать false.");
        return l === r;
      }
      if ((typeof l === "string" && r.t === "char") || (typeof r === "string" && l.t === "char"))
        throw fehl("нельзя сравнить String и char через == — символ пишут в апострофах 'a', строку сравнивают через equals(\"a\")", z, "typ");
      if (typeof l === "object" && typeof r === "object" && !istZahl(l) && !istZahl(r)) return l === r;
      throw fehl("нельзя сравнить " + typName(l) + " и " + typName(r) + " через ==", z, "typ");
    }
    function gleichWert(a, b) {
      if (istZahl(a) && istZahl(b)) return a.v === b.v && (a.t === "double") === (b.t === "double");
      return a === b;
    }
    function bedingung(e, sc) {
      const w = wert(e, sc);
      if (typeof w === "boolean") return w;
      if (e.k === "assign" && e.op === "=") throw fehl("в условии стоит присваивание `=`; для сравнения нужно `==`", e.z, "typ");
      throw fehl("условие должно быть true или false (boolean), а здесь значение типа " + typName(w), e.z, "typ");
    }
    function intWert(w, z, was) {
      if (w && (w.t === "int" || w.t === "char")) return w.v;
      if (w && w.t === "long") throw fehl(was + " должен быть int, а здесь long — нужно привести тип: (int) …", z, "typ");
      if (w && w.t === "double") throw fehl(was + " должен быть целым числом (int), а здесь double — нужно привести тип: (int) …", z, "typ");
      if (w === null) throw npe(was, z);
      throw fehl(was + " должен быть целым числом, а здесь " + typName(w), z, "typ");
    }

    /* ---------- Anweisungen ---------- */
    function ausf(s, sc) {
      schritt(s.z);
      switch (s.k) {
        case "block": {
          const inner = scope(sc);
          for (const x of s.body) { const r = ausf(x, inner); if (r) return r; }
          return;
        }
        case "leer": return;
        case "decl":
          for (const v of s.vars) {
            let t = s.typ, w;
            if (v.init) {
              w = v.init.k === "arrlit" ? feldAusLiteral(v.init, t, sc) : wert(v.init, sc);
              if (t.name === "var") t = typVon(w, v.z);
              else w = konvertiere(w, t, v.z, "переменную " + v.name);
            }
            sc.vars.set(v.name, { typ: t, w, init: !!v.init, name: v.name });
          }
          return;
        case "expr": wert(s.e, sc); return;
        case "if": return bedingung(s.c, sc) ? ausf(s.dann, sc) : s.sonst ? ausf(s.sonst, sc) : undefined;
        case "while": {
          const alt = schleifenZeile; schleifenZeile = s.z;
          try {
            while (bedingung(s.c, sc)) {
              schritt(s.z);
              const r = ausf(s.body, sc);
              if (r === BRK) break; if (r === CONT) continue; if (r) return r;
            }
          } finally { schleifenZeile = alt; }
          return;
        }
        case "do": {
          const alt = schleifenZeile; schleifenZeile = s.z;
          try {
            do {
              schritt(s.z);
              const r = ausf(s.body, sc);
              if (r === BRK) break; if (r && r !== CONT) return r;
            } while (bedingung(s.c, sc));
          } finally { schleifenZeile = alt; }
          return;
        }
        case "for": {
          const fs = scope(sc), alt = schleifenZeile;
          s.init.forEach(i => ausf(i, fs));
          schleifenZeile = s.z;
          try {
            for (;;) {
              schritt(s.z);
              if (s.c && !bedingung(s.c, fs)) break;
              const r = ausf(s.body, fs);
              if (r === BRK) break; if (r && r !== CONT) return r;
              s.upd.forEach(u => wert(u, fs));
            }
          } finally { schleifenZeile = alt; }
          return;
        }
        case "foreach": {
          const q = wert(s.e, sc);
          if (q === null) throw npe("for-each по " + "значению null", s.z);
          if (typeof q === "string") throw fehl("for-each по строке не работает — используй for (int i = 0; i < s.length(); i++) и s.charAt(i) или s.toCharArray()", s.z, "typ");
          if (!q || (q.t !== "array" && q.t !== "list")) throw fehl("for-each работает только с массивом или списком, а здесь " + typName(q), s.z, "typ");
          const alt = schleifenZeile; schleifenZeile = s.z;
          const mod = q.mod;
          try {
            for (let i = 0; i < q.a.length; i++) {
              schritt(s.z);
              if (q.t === "list" && q.mod !== mod) throw fehl("список изменён внутри for-each (в Java — ConcurrentModificationException). Чтобы удалять или добавлять, используй обычный for с индексом или новый список", s.z);
              const fs = scope(sc);
              const t = s.typ.name === "var" ? typVon(q.a[i], s.z) : s.typ;
              fs.vars.set(s.name, { typ: t, w: s.typ.name === "var" ? q.a[i] : konvertiere(q.a[i], t, s.nz, "переменную " + s.name), init: true, name: s.name });
              const r = ausf(s.body, fs);
              if (r === BRK) break; if (r && r !== CONT) return r;
            }
            if (q.t === "list" && q.mod !== mod) throw fehl("список изменён внутри for-each (в Java — ConcurrentModificationException). Чтобы удалять или добавлять, используй обычный for с индексом или новый список", s.z);
          } finally { schleifenZeile = alt; }
          return;
        }
        case "break": return BRK;
        case "continue": return CONT;
        case "return": return { k: "return", w: s.e ? wert(s.e, sc) : undefined, z: s.z };
      }
      throw fehl("неизвестная команда", s.z);
    }

    /* ---------- Ausdrücke ---------- */
    function ort(e, sc) {
      if (e.k === "name") {
        const v = finde(sc, e.name);
        if (!v) throw fehl("переменная " + e.name + " не объявлена", e.z, "typ");
        return { typ: v.typ, wo: "переменную " + e.name,
          lesen: () => { if (!v.init) throw fehl("переменная " + e.name + " ещё не получила значение — задай начальное значение, например " + beispiel(v.typ, e.name), e.z); return v.w; },
          schreiben: w => { v.w = w; v.init = true; } };
      }
      if (e.k === "index") {
        const f = wert(e.e, sc), i = intWert(wert(e.i, sc), e.i.z || e.z, "индекс");
        pruefeFeld(f, i, e);
        return { typ: f.et, wo: "элемент массива " + typName(f), lesen: () => f.a[i], schreiben: w => { f.a[i] = w; } };
      }
      if (e.k === "feld") {
        const o = wert(e.e, sc);
        if (o === null) throw npe("обращение к полю " + e.name, e.z);
        if (o && o.t === "array" && e.name === "length") throw fehl("длину массива изменить нельзя", e.z, "typ");
        if (o && o.t === "obj" && hat(o.f, e.name)) {
          const gross = e.name[0].toUpperCase() + e.name.slice(1);
          warn(e.z, "прямой доступ к полю " + e.name + " — в задании поля закрыты (private), используй set" + gross + "(…) и get" + gross + "()");
          const ft = o.def.felder[e.name];
          return { typ: ft, wo: "поле " + e.name, lesen: () => o.f[e.name], schreiben: w => { o.f[e.name] = w; } };
        }
        throw fehl("сюда нельзя записать значение: " + e.name, e.z, "typ");
      }
      throw fehl("сюда нельзя записать значение", e.z, "typ");
    }
    function pruefeFeld(f, i, e) {
      const nm = e.e.k === "name" ? e.e.name : null;
      if (f === null) throw npe("обращение по индексу [" + i + "]", e.z);
      if (f && f.t === "list") throw fehl("к элементу списка обращаются через get: " + (nm || "liste") + ".get(" + i + ")", e.z, "typ");
      if (typeof f === "string") throw fehl("символ строки получают через charAt: " + (nm || "s") + ".charAt(" + i + ")", e.z, "typ");
      if (!f || f.t !== "array") throw fehl("[ ] применяют только к массиву, а здесь " + typName(f), e.z, "typ");
      if (i < 0 || i >= f.a.length) throw fehl("индекс " + i + " вне массива длины " + f.a.length + (i === f.a.length ? " (последний индекс — " + (f.a.length - 1) + "; проверь условие цикла: < вместо <=)" : ""), e.z);
    }

    function wert(e, sc) {
      switch (e.k) {
        case "lit": return e.w;
        case "name": {
          const v = finde(sc, e.name);
          if (!v) throw fehl("переменная " + e.name + " не объявлена", e.z, "typ");
          if (!v.init) throw fehl("переменная " + e.name + " ещё не получила значение — задай начальное значение, например " + beispiel(v.typ, e.name), e.z);
          return v.w;
        }
        case "assign": {
          const o = ort(e.ziel, sc);
          let w;
          if (e.op === "=") w = konvertiere(wert(e.wert, sc), o.typ, e.z, o.wo);
          else {
            const alt = o.lesen(), r = wert(e.wert, sc);
            if (o.typ && o.typ.name === "String" && !o.typ.dim) {
              if (e.op !== "+=") throw fehl("для строки подходит только +=", e.z, "typ");
              w = binOp("+", alt, r, e.z);
            } else {
              if (!istZahl(alt)) throw zahlFehler(e.op, alt, e.z);
              w = zuweisbarMitCast(binOp(e.op[0], alt, r, e.z), o.typ, e.z);
            }
          }
          o.schreiben(w);
          return w;
        }
        case "cond": return bedingung(e.c, sc) ? wert(e.a, sc) : wert(e.b, sc);
        case "bin": {
          if (e.op === "&&" || e.op === "||") {
            const l = wert(e.l, sc);
            if (typeof l !== "boolean") throw fehl("слева от " + e.op + " должно быть условие (true/false), а здесь " + typName(l) + (e.l.k === "assign" ? " — для сравнения нужно ==" : ""), e.z, "typ");
            if (e.op === "&&" ? !l : l) return l;
            const r = wert(e.r, sc);
            if (typeof r !== "boolean") throw fehl("справа от " + e.op + " должно быть условие (true/false), а здесь " + typName(r) + (e.r.k === "assign" ? " — для сравнения нужно ==" : ""), e.z, "typ");
            return r;
          }
          return binOp(e.op, wert(e.l, sc), wert(e.r, sc), e.z);
        }
        case "unary": {
          const w = wert(e.e, sc);
          if (e.op === "!") { if (typeof w !== "boolean") throw fehl("! (не) применяют только к условию true/false, а здесь " + typName(w), e.z, "typ"); return !w; }
          if (!istZahl(w)) throw zahlFehler(e.op, w, e.z);
          const t = w.t === "char" ? "int" : w.t;
          return e.op === "-" ? machZahl(t, -w.v) : machZahl(t, w.v);
        }
        case "pre": case "post": {
          const o = ort(e.e, sc), alt = o.lesen();
          if (!istZahl(alt)) throw fehl(e.op + " работает только с числами, а здесь " + typName(alt), e.z, "typ");
          const neu = zuweisbarMitCast(binOp(e.op === "++" ? "+" : "-", alt, I(1), e.z), o.typ || typVon(alt), e.z);
          o.schreiben(neu);
          return e.k === "pre" ? neu : alt;
        }
        case "cast": return cast(wert(e.e, sc), e.typ, e.z);
        case "index": {
          const f = wert(e.e, sc), i = intWert(wert(e.i, sc), e.z, "индекс");
          pruefeFeld(f, i, e);
          return f.a[i];
        }
        case "feld": return feldLesen(e, sc);
        case "call": return aufruf(e, sc);
        case "newarr": {
          const t = T(e.basis.name, e.basis.args, e.dim);
          if (e.init) return feldAusLiteral(e.init, t, sc);
          const gr = e.dims.map(d => intWert(wert(d, sc), e.z, "размер массива"));
          let zellen = 1;
          gr.forEach(n => { if (n < 0) throw fehl("размер массива не может быть отрицательным: " + n, e.z); zellen *= Math.max(n, 1); });
          if (zellen > GRENZE.zellen) throw fehl("массив слишком большой для тренажёра (больше " + GRENZE.zellen + " элементов)", e.z, "limit");
          const bau = (k, dim) => {
            const et = T(t.name, t.args, dim - 1);
            const a = new Array(gr[k]);
            for (let i = 0; i < gr[k]; i++) a[i] = k + 1 < gr.length ? bau(k + 1, dim - 1) : standardWert(et);
            return { t: "array", et, a };
          };
          return bau(0, e.dim);
        }
        case "newobj": return neuesObjekt(e, sc);
        case "arrlit": throw fehl("литерал {…} можно писать только при объявлении массива", e.z, "syntax");
      }
      throw fehl("неизвестное выражение", e.z);
    }
    function feldAusLiteral(lit, t, sc) {
      if (!t.dim) throw fehl("значения в {…} подходят только для массива", lit.z, "typ");
      const et = elementTyp(t);
      return { t: "array", et, a: lit.elems.map(x => x.k === "arrlit" ? feldAusLiteral(x, et, sc) : konvertiere(wert(x, sc), et, x.z || lit.z, "массив " + typStr(t))) };
    }
    function neuesObjekt(e, sc) {
      const n = e.typ.name, args = e.args.map(a => wert(a, sc));
      if (n === "List" || n === "Collection") throw fehl(n + " — это интерфейс; создают так: new ArrayList<>()", e.z, "typ");
      if (n === "ArrayList" || n === "LinkedList") {
        const l = { t: "list", et: e.typ.args[0] || null, a: [], mod: 0 };
        if (args.length > 1) throw fehl("new ArrayList<>() принимает не больше одного аргумента", e.z, "typ");
        if (args.length === 1) {
          const q = args[0];
          if (q && q.t === "list") l.a = q.a.slice();
          else if (!(q && q.t === "int")) throw fehl("new ArrayList<>(…) ожидает другой список (копия) или число (ёмкость)", e.z, "typ");
        }
        return l;
      }
      if (n === "String") { if (args.length === 0) return ""; if (typeof args[0] === "string") return args[0]; throw fehl("new String(…) ожидает строку", e.z, "typ"); }
      const def = klassen.get(n);
      if (def) {
        if (!def.konstruktor) throw fehl("в этом задании объекты " + n + " не создаются вручную — они уже приходят в метод готовыми", e.z, "typ");
        if (args.length !== def.konstruktor.length) throw fehl("конструктор " + n + "(…) ожидает " + def.konstruktor.length + " " + plural(def.konstruktor.length, "аргумент", "аргумента", "аргументов") + ": " + def.konstruktor.join(", "), e.z, "typ");
        const f = Object.create(null);
        Object.keys(def.felder).forEach(k => { f[k] = standardWert(def.felder[k]); });
        def.konstruktor.forEach((k, i) => { f[k] = konvertiere(args[i], def.felder[k], e.z, "параметр " + k + " конструктора"); });
        return { t: "obj", klasse: n, def, f };
      }
      if (PRIM.has(n)) throw fehl("new для " + n + " пишут только с массивом: new " + n + "[5]", e.z, "typ");
      throw fehl("класс " + n + " здесь недоступен", e.z, "typ");
    }
    function feldLesen(e, sc) {
      if (e.e.k === "name" && !finde(sc, e.e.name) && STATIK.has(e.e.name)) return statischesFeld(e.e.name, e.name, e.z);
      const o = wert(e.e, sc), nm = e.e.k === "name" ? e.e.name : "x";
      if (o === null) throw npe("обращение к ." + e.name, e.z);
      if (o === undefined) throw fehl("метод void ничего не возвращает — у результата нет ." + e.name, e.z, "typ");
      if (typeof o === "string") throw fehl(e.name === "length" ? "у строки длина — это метод со скобками: " + nm + ".length()" : "у строки нет поля " + e.name, e.z, "typ");
      if (typeof o === "boolean" || istZahl(o)) throw fehl("у простого значения " + typName(o) + " нет поля " + e.name, e.z, "typ");
      if (o.t === "array") { if (e.name === "length") return I(o.a.length); throw fehl("у массива есть только поле length, а не " + e.name, e.z, "typ"); }
      if (o.t === "list") throw fehl(e.name === "length" || e.name === "size" ? "размер списка — это метод: " + nm + ".size()" : "у списка нет поля " + e.name, e.z, "typ");
      if (o.t === "obj") {
        if (hat(o.f, e.name)) { warn(e.z, "прямой доступ к полю " + e.name + " — в задании поля закрыты (private), используй get" + e.name[0].toUpperCase() + e.name.slice(1) + "()"); return o.f[e.name]; }
        throw fehl("у объекта " + o.klasse + " нет поля " + e.name + " — используй методы из таблицы класса", e.z, "typ");
      }
      throw fehl("нет поля " + e.name, e.z, "typ");
    }
    function statischesFeld(k, n, z) {
      const s = k + "." + n;
      switch (s) {
        case "Integer.MAX_VALUE": return I(2147483647);
        case "Integer.MIN_VALUE": return I(-2147483648);
        case "Long.MAX_VALUE": return L(9223372036854775807);
        case "Long.MIN_VALUE": return L(-9223372036854775808);
        case "Double.MAX_VALUE": return D(Number.MAX_VALUE);
        case "Double.MIN_VALUE": return D(Number.MIN_VALUE);
        case "Double.POSITIVE_INFINITY": return D(Infinity);
        case "Double.NEGATIVE_INFINITY": return D(-Infinity);
        case "Math.PI": return D(Math.PI);
        case "Math.E": return D(Math.E);
        case "System.out": case "System.err": return { t: "out" };
      }
      throw fehl("неизвестное поле " + s, z, "typ");
    }

    function ausgeben(args, zeile, z) {
      if (args.length > 1) throw fehl("println/print принимает одно значение; склей части через +: \"a = \" + a", z, "typ");
      const w = args.length ? args[0] : "";
      if (w === undefined) throw fehl("метод void ничего не возвращает — печатать нечего", z, "typ");
      if (w && w.t === "array") warn(z, "в настоящей Java println(массив) печатает адрес вида [I@1b6d3586; здесь для удобства показано содержимое. Для текста массива: Arrays.toString(a)");
      if (ausgabeVoll) return;
      ausgabe += str(w) + (zeile ? "\n" : "");
      if (ausgabe.length > GRENZE.ausgabe) { ausgabe = ausgabe.slice(0, GRENZE.ausgabe) + "\n… (вывод обрезан)"; ausgabeVoll = true; }
    }

    function aufruf(e, sc) {
      if (!e.obj) {
        const l = methoden.get(e.name);
        if (l) {
          const m = l.find(x => x.params.length === e.args.length);
          if (!m) throw fehl("метод " + e.name + " ожидает " + l[0].params.length + " " + plural(l[0].params.length, "аргумент", "аргумента", "аргументов") + ", а передано " + e.args.length, e.z, "typ");
          return rufe(m, e.args.map(a => wert(a, sc)), e.z);
        }
        if (AUSGABE.has(e.name)) { ausgeben(e.args.map(a => wert(a, sc)), e.name === "println", e.z); return undefined; }
        throw fehl("метод " + e.name + "(…) не объявлен", e.z, "typ");
      }
      if (e.obj.k === "name" && !finde(sc, e.obj.name) && STATIK.has(e.obj.name)) return statisch(e.obj.name, e.name, e.args.map(a => wert(a, sc)), e);
      const o = wert(e.obj, sc);
      const args = e.args.map(a => wert(a, sc));
      const nm = e.obj.k === "name" ? e.obj.name : null;
      if (o === null) throw npe("вызов " + e.name + "() у " + (nm || "значения"), e.z);
      if (o === undefined) throw fehl("метод void ничего не возвращает — у результата нельзя вызвать " + e.name + "()", e.z, "typ");
      if (typeof o === "string") return stringMethode(o, e.name, args, e, nm);
      if (typeof o === "boolean" || istZahl(o)) {
        if (e.name === "equals") throw fehl(typName(o) + " — простой тип: сравнивай через ==" + (o.t === "char" ? ", например c == 'a'" : ""), e.z, "typ");
        throw fehl("у простого значения " + typName(o) + " нет методов (" + e.name + "())", e.z, "typ");
      }
      switch (o.t) {
        case "out":
          if (e.name === "println" || e.name === "print") { ausgeben(args, e.name === "println", e.z); return undefined; }
          throw fehl("System.out." + e.name + " здесь не поддерживается — используй println", e.z, "typ");
        case "list": return listenMethode(o, e.name, args, e, nm || "liste");
        case "array": return feldMethode(o, e.name, args, e, nm || "werte");
        case "obj": return objektMethode(o, e.name, args, e);
      }
      throw fehl("у значения типа " + typName(o) + " нет метода " + e.name + "()", e.z, "typ");
    }
    function anzahl(name, args, n, z) {
      const ok = Array.isArray(n) ? n.includes(args.length) : args.length === n;
      if (!ok) { const k = Array.isArray(n) ? n.join(" или ") : n; throw fehl("метод " + name + "() ожидает " + k + " " + plural(Array.isArray(n) ? 2 : n, "аргумент", "аргумента", "аргументов") + ", а передано " + args.length, z, "typ"); }
    }
    function strArg(w, z, name) {
      if (typeof w === "string") return w;
      if (w && w.t === "char") throw fehl(name + "() ожидает строку в кавычках \"…\", а не символ '" + String.fromCharCode(w.v) + "'", z, "typ");
      if (w === null) throw npe(name + "(null)", z);
      throw fehl(name + "() ожидает строку (String), а здесь " + typName(w), z, "typ");
    }
    function stringMethode(s, n, a, e, nm) {
      const z = e.z; nm = nm || "s";
      switch (n) {
        case "length": anzahl(n, a, 0, z); return I(s.length);
        case "charAt": {
          anzahl(n, a, 1, z);
          const i = intWert(a[0], z, "индекс в charAt");
          if (i < 0 || i >= s.length) throw fehl("индекс " + i + " вне строки длины " + s.length + " (charAt)" + (i === s.length ? " — последний индекс " + (s.length - 1) : ""), z);
          return C(s.charCodeAt(i));
        }
        case "equals":
          anzahl(n, a, 1, z);
          if (a[0] && a[0].t === "char") warn(z, "строку сравнили с символом '" + String.fromCharCode(a[0].v) + "' — equals всегда даст false; пиши строку в кавычках \"…\"");
          return typeof a[0] === "string" && a[0] === s;
        case "equalsIgnoreCase": anzahl(n, a, 1, z); return typeof a[0] === "string" && a[0].toLowerCase() === s.toLowerCase();
        case "isEmpty": anzahl(n, a, 0, z); return s.length === 0;
        case "isBlank": anzahl(n, a, 0, z); return s.trim().length === 0;
        case "toLowerCase": anzahl(n, a, 0, z); return s.toLowerCase();
        case "toUpperCase": anzahl(n, a, 0, z); return s.toUpperCase();
        case "trim": case "strip": anzahl(n, a, 0, z); return s.trim();
        case "substring": {
          anzahl(n, a, [1, 2], z);
          const b = intWert(a[0], z, "начало substring"), en = a.length > 1 ? intWert(a[1], z, "конец substring") : s.length;
          if (b < 0 || en > s.length || b > en) throw fehl("substring(" + b + (a.length > 1 ? ", " + en : "") + "): границы вне строки длины " + s.length, z);
          return s.slice(b, en);
        }
        case "contains": anzahl(n, a, 1, z); return s.includes(strArg(a[0], z, "contains"));
        case "startsWith": anzahl(n, a, 1, z); return s.startsWith(strArg(a[0], z, "startsWith"));
        case "endsWith": anzahl(n, a, 1, z); return s.endsWith(strArg(a[0], z, "endsWith"));
        case "indexOf": case "lastIndexOf": {
          anzahl(n, a, [1, 2], z);
          const x = a[0] && a[0].t === "char" ? String.fromCharCode(a[0].v) : a[0] && a[0].t === "int" ? String.fromCharCode(a[0].v) : strArg(a[0], z, n);
          if (a.length > 1) { const v = intWert(a[1], z, "начальная позиция"); return I(n === "indexOf" ? s.indexOf(x, Math.max(0, v)) : s.lastIndexOf(x, v)); }
          return I(n === "indexOf" ? s.indexOf(x) : s.lastIndexOf(x));
        }
        case "compareTo": case "compareToIgnoreCase": {
          anzahl(n, a, 1, z);
          let x = strArg(a[0], z, n), y = s;
          if (n === "compareToIgnoreCase") { x = x.toLowerCase(); y = y.toLowerCase(); }
          const k = Math.min(x.length, y.length);
          for (let i = 0; i < k; i++) if (y.charCodeAt(i) !== x.charCodeAt(i)) return I(y.charCodeAt(i) - x.charCodeAt(i));
          return I(y.length - x.length);
        }
        case "replace": {
          anzahl(n, a, 2, z);
          const tx = w => w && w.t === "char" ? String.fromCharCode(w.v) : strArg(w, z, "replace");
          const von = tx(a[0]), zu = tx(a[1]);
          if (!von) return s;
          const r = s.split(von).join(zu);
          if (r.length > GRENZE.zeichen) throw fehl("строка стала слишком длинной", z, "limit");
          return r;
        }
        case "split": {
          anzahl(n, a, 1, z);
          const muster = strArg(a[0], z, "split");
          const regeln = { "\\s+": /\s+/, "\\s": /\s/, " +": / +/, "\\.": ".", "\\|": "|", "\\+": "+", "\\*": "*", "\\?": "?" };
          let teile;
          if (hat(regeln, muster)) teile = s.split(regeln[muster]);
          else if (/^[^\\.[\]{}()*+?^$|]+$/.test(muster)) teile = s.split(muster);
          else throw fehl("split с шаблоном «" + muster + "» здесь не поддерживается — используй простой разделитель, например \",\" или \" \"", z, "typ");
          while (teile.length > 1 && teile[teile.length - 1] === "") teile.pop();
          if (s === "") teile = [""];
          return { t: "array", et: T("String"), a: teile };
        }
        case "toCharArray": anzahl(n, a, 0, z); return { t: "array", et: T("char"), a: Array.from(s, ch => C(ch.charCodeAt(0))) };
        case "toString": anzahl(n, a, 0, z); return s;
        case "repeat": {
          anzahl(n, a, 1, z);
          const k = intWert(a[0], z, "repeat");
          if (k < 0) throw fehl("repeat: отрицательное число", z);
          if (s.length * k > GRENZE.zeichen) throw fehl("строка стала слишком длинной", z, "limit");
          return s.repeat(k);
        }
        case "size": throw fehl("у строки длина — это " + nm + ".length()", z, "typ");
        case "get": throw fehl("символ строки получают через " + nm + ".charAt(i)", z, "typ");
      }
      const v = aehnlich(n, ["length", "charAt", "equals", "equalsIgnoreCase", "isEmpty", "toLowerCase", "toUpperCase", "trim", "substring", "contains", "indexOf", "lastIndexOf", "startsWith", "endsWith", "compareTo", "replace", "split", "toCharArray"]);
      throw fehl("у строки (String) нет метода " + n + "()" + (v ? " — может быть, " + v + "()?" : ""), z, "typ");
    }
    function listenElement(l, w, z) { return l.et ? konvertiere(w, l.et, z, "список " + typName(l)) : w; }
    function listenIndex(l, w, z, n, bisInklusive) {
      const i = intWert(w, z, "индекс в " + n);
      const grenze = bisInklusive ? l.a.length + 1 : l.a.length;
      if (i < 0 || i >= grenze) throw fehl("индекс " + i + " вне списка размера " + l.a.length + " (" + n + ")" + (i === l.a.length && !bisInklusive ? " — последний индекс " + (l.a.length - 1) + "; проверь условие цикла: < вместо <=" : ""), z);
      return i;
    }
    function listenMethode(l, n, a, e, nm) {
      const z = e.z;
      switch (n) {
        case "size": anzahl(n, a, 0, z); return I(l.a.length);
        case "isEmpty": anzahl(n, a, 0, z); return l.a.length === 0;
        case "get": anzahl(n, a, 1, z); return l.a[listenIndex(l, a[0], z, "get")];
        case "add":
          anzahl(n, a, [1, 2], z);
          if (l.a.length >= GRENZE.zellen) throw fehl("список слишком большой для тренажёра", z, "limit");
          if (a.length === 1) { l.a.push(listenElement(l, a[0], z)); l.mod++; return true; }
          { const i = listenIndex(l, a[0], z, "add", true); l.a.splice(i, 0, listenElement(l, a[1], z)); l.mod++; return undefined; }
        case "set": { anzahl(n, a, 2, z); const i = listenIndex(l, a[0], z, "set"); const alt = l.a[i]; l.a[i] = listenElement(l, a[1], z); return alt; }
        case "remove": {
          anzahl(n, a, 1, z);
          if (a[0] && a[0].t === "int") { const i = listenIndex(l, a[0], z, "remove"); l.mod++; return l.a.splice(i, 1)[0]; }
          const k = l.a.findIndex(x => gleichWert(x, a[0]));
          if (k < 0) return false;
          l.a.splice(k, 1); l.mod++; return true;
        }
        case "contains": anzahl(n, a, 1, z); return l.a.some(x => gleichWert(x, a[0]));
        case "indexOf": anzahl(n, a, 1, z); return I(l.a.findIndex(x => gleichWert(x, a[0])));
        case "clear": anzahl(n, a, 0, z); l.a = []; l.mod++; return undefined;
        case "addAll": {
          anzahl(n, a, 1, z);
          if (!a[0] || a[0].t !== "list") throw fehl("addAll ожидает другой список", z, "typ");
          a[0].a.slice().forEach(x => l.a.push(listenElement(l, x, z))); l.mod++; return true;
        }
        case "toString": anzahl(n, a, 0, z); return str(l);
        case "equals": anzahl(n, a, 1, z); return !!(a[0] && a[0].t === "list" && a[0].a.length === l.a.length && a[0].a.every((x, i) => gleichWert(x, l.a[i])));
        case "length": throw fehl("размер списка — " + nm + ".size()", z, "typ");
        case "sort": case "stream": case "forEach": case "removeIf":
          throw fehl(nm + "." + n + "(…) здесь не поддерживается — на экзамене это пишут обычным циклом", z, "typ");
      }
      const v = aehnlich(n, ["size", "get", "add", "set", "remove", "isEmpty", "contains", "indexOf", "clear", "addAll"]);
      throw fehl("у списка (List) нет метода " + n + "()" + (v ? " — может быть, " + v + "()?" : ""), z, "typ");
    }
    function feldMethode(f, n, a, e, nm) {
      const z = e.z;
      switch (n) {
        case "length": throw fehl("у массива length без скобок: " + nm + ".length", z, "typ");
        case "size": throw fehl("у массива нет size() — используй " + nm + ".length", z, "typ");
        case "get": throw fehl("элемент массива: " + nm + "[i], а не " + nm + ".get(i)", z, "typ");
        case "add": case "remove": throw fehl("размер массива фиксирован — " + n + "() у массива нет. Для изменяемого набора используй List", z, "typ");
        case "clone": anzahl(n, a, 0, z); return { t: "array", et: f.et, a: f.a.slice() };
        case "equals": anzahl(n, a, 1, z); return f === a[0];
      }
      throw fehl("у массива нет метода " + n + "()", z, "typ");
    }
    function feldname(rest, felder) {
      /* Java-Konvention: getWert → wert; getwert gibt es nicht (Groß-/Kleinschreibung zählt) */
      if (!/^\p{Lu}/u.test(rest)) return null;
      const k = rest[0].toLowerCase() + rest.slice(1);
      if (hat(felder, k)) return k;
      if (hat(felder, rest)) return rest;
      return null;
    }
    function objektMethoden(def) {
      const l = [];
      Object.keys(def.felder).forEach(f => { const g = f[0].toUpperCase() + f.slice(1); l.push((def.felder[f].name === "boolean" ? "is" : "get") + g + "()"); });
      return l;
    }
    function objektMethode(o, n, a, e) {
      const z = e.z, def = o.def;
      if (n === "equals") { anzahl(n, a, 1, z); return o === a[0]; }
      if (n === "toString") { anzahl(n, a, 0, z); return str(o); }
      const m = /^(get|is|set)(.+)$/.exec(n);
      if (m) {
        const f = feldname(m[2], def.felder);
        if (f) {
          const ft = def.felder[f];
          if (m[1] === "set") { anzahl(n, a, 1, z); o.f[f] = konvertiere(a[0], ft, z, "поле " + f); return undefined; }
          if (m[1] === "is" && ft.name !== "boolean") throw fehl("is…() бывает только у boolean-полей — используй get" + m[2] + "()", z, "typ");
          if (a.length) throw fehl(n + "() вызывается без аргументов", z, "typ");
          return o.f[f];
        }
      }
      const vorhanden = objektMethoden(def);
      const v = aehnlich(n, vorhanden.map(x => x.slice(0, -2)));
      throw fehl("у объекта " + o.klasse + " нет метода " + n + "()" + (v ? " — может быть, " + v + "()?" : ".") + " Есть: " + vorhanden.join(", "), z, "typ");
    }

    function statisch(k, n, a, e) {
      const z = e.z;
      const zahl = (w, was) => { if (!istZahl(w)) throw zahlFehler(was || k + "." + n, w, z); return w; };
      switch (k + "." + n) {
        case "Math.abs": { anzahl(n, a, 1, z); const w = zahl(a[0]); return machZahl(w.t === "char" ? "int" : w.t, Math.abs(w.v)); }
        case "Math.max": case "Math.min": {
          anzahl(n, a, 2, z); const x = zahl(a[0]), y = zahl(a[1]);
          const t = x.t === "double" || y.t === "double" ? "double" : x.t === "long" || y.t === "long" ? "long" : "int";
          return machZahl(t, n === "max" ? Math.max(x.v, y.v) : Math.min(x.v, y.v));
        }
        case "Math.round": { anzahl(n, a, 1, z); const w = zahl(a[0]); return w.t === "double" ? L(Number.isNaN(w.v) ? 0 : Math.floor(w.v + 0.5)) : w.t === "long" ? w : I(w.v); }
        case "Math.floor": anzahl(n, a, 1, z); return D(Math.floor(zahl(a[0]).v));
        case "Math.ceil": anzahl(n, a, 1, z); return D(Math.ceil(zahl(a[0]).v));
        case "Math.sqrt": anzahl(n, a, 1, z); return D(Math.sqrt(zahl(a[0]).v));
        case "Math.pow": anzahl(n, a, 2, z); return D(Math.pow(zahl(a[0]).v, zahl(a[1]).v));
        case "Math.random": throw fehl("Math.random() не используется: тесты должны давать один и тот же результат", z, "typ");
        case "Integer.parseInt": case "Integer.valueOf": case "Long.parseLong": case "Double.parseDouble": case "Double.valueOf": {
          anzahl(n, a, 1, z);
          if ((n === "valueOf") && istZahl(a[0])) return k === "Integer" ? konvertiere(a[0], T("Integer"), z, "Integer.valueOf") : D(a[0].v);
          const s = strArg(a[0], z, k + "." + n).trim();
          if (k === "Double") { if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) throw fehl("«" + s + "» — не число (NumberFormatException)", z); return D(Number(s)); }
          if (!/^[+-]?\d+$/.test(s)) throw fehl("«" + s + "» — не целое число (NumberFormatException)", z);
          const v = Number(s);
          if (k === "Integer" && (v > 2147483647 || v < -2147483648)) throw fehl("«" + s + "» не помещается в int (NumberFormatException)", z);
          return k === "Long" ? L(v) : I(v);
        }
        case "Integer.toString": case "Double.toString": case "String.valueOf": anzahl(n, a, 1, z); if (a[0] === undefined) throw fehl("метод void ничего не возвращает", z, "typ"); return str(a[0]);
        case "Integer.compare": case "Double.compare": { anzahl(n, a, 2, z); const x = zahl(a[0]).v, y = zahl(a[1]).v; return I(x < y ? -1 : x > y ? 1 : 0); }
        case "Character.isDigit": case "Character.isLetter": case "Character.isLetterOrDigit": case "Character.isUpperCase":
        case "Character.isLowerCase": case "Character.isWhitespace": case "Character.toUpperCase": case "Character.toLowerCase": {
          anzahl(n, a, 1, z);
          const w = a[0];
          if (typeof w === "string") throw fehl(k + "." + n + "() ожидает символ 'a' (char), а не строку \"…\"", z, "typ");
          if (!w || (w.t !== "char" && w.t !== "int")) throw fehl(k + "." + n + "() ожидает символ (char), а здесь " + typName(w), z, "typ");
          const ch = String.fromCharCode(w.v);
          switch (n) {
            case "isDigit": return /\p{Nd}/u.test(ch);
            case "isLetter": return /\p{L}/u.test(ch);
            case "isLetterOrDigit": return /[\p{L}\p{Nd}]/u.test(ch);
            case "isUpperCase": return /\p{Lu}/u.test(ch);
            case "isLowerCase": return /\p{Ll}/u.test(ch);
            case "isWhitespace": return /\s/.test(ch);
            case "toUpperCase": { const c = ch.toUpperCase(); const v = c.length === 1 ? c.charCodeAt(0) : w.v; return w.t === "char" ? C(v) : I(v); }
            case "toLowerCase": { const c = ch.toLowerCase(); const v = c.length === 1 ? c.charCodeAt(0) : w.v; return w.t === "char" ? C(v) : I(v); }
          }
          break;
        }
        case "Arrays.toString": { anzahl(n, a, 1, z); if (a[0] === null) return "null"; if (!a[0] || a[0].t !== "array") throw fehl("Arrays.toString ожидает массив", z, "typ"); return str(a[0]); }
        case "Arrays.fill": {
          anzahl(n, a, 2, z); const f = a[0];
          if (!f || f.t !== "array") throw fehl("Arrays.fill ожидает массив", z, "typ");
          const w = konvertiere(a[1], f.et, z, "массив " + typName(f)); for (let i = 0; i < f.a.length; i++) f.a[i] = w; return undefined;
        }
        case "Arrays.copyOf": {
          anzahl(n, a, 2, z); const f = a[0], len = intWert(a[1], z, "длина");
          if (!f || f.t !== "array") throw fehl("Arrays.copyOf ожидает массив", z, "typ");
          if (len < 0 || len > GRENZE.zellen) throw fehl("недопустимая длина массива: " + len, z);
          const r = []; for (let i = 0; i < len; i++) r.push(i < f.a.length ? f.a[i] : standardWert(f.et)); return { t: "array", et: f.et, a: r };
        }
        case "Arrays.sort": case "Collections.sort": case "List.sort":
          throw fehl(k + ".sort здесь не используется: на экзамене алгоритм сортировки пишут сами (например, Bubble Sort)", z, "typ");
        case "System.out": break;
        case "Objects.equals": anzahl(n, a, 2, z); if (a[0] === null || a[1] === null) return a[0] === a[1]; if (typeof a[0] === "string") return a[0] === a[1]; return gleichWert(a[0], a[1]);
        case "List.of": case "Arrays.asList":
          throw fehl(k + "." + n + "(…) здесь не поддерживается — создай список через new ArrayList<>() и add(…)", z, "typ");
      }
      throw fehl("метод " + k + "." + n + "(…) в этом тренажёре не поддерживается", z, "typ");
    }

    function rufe(m, args, z) {
      if (++tiefe > GRENZE.tiefe) { tiefe--; throw fehl("слишком глубокая рекурсия: метод " + m.name + " вызывается больше " + GRENZE.tiefe + " раз подряд. Нет условия выхода?", z, "limit"); }
      try {
        schritt(z);
        const sc = scope(null);
        m.params.forEach((p, i) => sc.vars.set(p.name, { typ: p.typ, w: konvertiere(args[i], p.typ, z, "параметр " + p.name + " метода " + m.name), init: true, name: p.name }));
        const r = ausf(m.body, sc);
        if (m.rueck.name === "void" && !m.rueck.dim) return undefined;
        if (!r || r.k !== "return") throw fehl("метод " + m.name + " закончился без return — нужно вернуть значение типа " + typStr(m.rueck), m.ende || m.z, "typ");
        return konvertiere(r.w, m.rueck, r.z, "результат метода " + m.name);
      } finally { tiefe--; }
    }

    return {
      rufe,
      methode: (name, n) => (methoden.get(name) || []).find(m => m.params.length === n) || null,
      zustand: () => ({ ausgabe, warnungen: Array.from(warnungen.values()), schritte })
    };
  }

  /* ======================================================================
     Öffentliche Funktionen
     ====================================================================== */
  function uebersetzen(quelltext, optionen) {
    const klassen = optionen && optionen.klassen instanceof Map ? optionen.klassen : klassenMap(optionen && optionen.klassen);
    try {
      const tokens = lexer(String(quelltext == null ? "" : quelltext));
      const methoden = parse(tokens).programm();
      if (!methoden.length) throw new CodeFehler("код пустой — напиши метод целиком: заголовок и тело в { }", 1, "syntax");
      pruefeStatisch(methoden, klassen, []);
      return { ok: true, programm: { methoden }, klassen };
    } catch (e) {
      if (e instanceof CodeFehler) return { ok: false, fehler: info(e) };
      if (e instanceof RangeError) return { ok: false, fehler: { text: "код слишком глубоко вложен", zeile: 0, meldung: "Код слишком глубоко вложен.", art: "limit" } };
      throw e;
    }
  }

  /* Eine Methode mit JS-Werten aufrufen. optionen: {methode, args, klassen, signatur?, maxSchritte?} */
  function ausfuehren(quelltext, optionen) {
    const o = optionen || {};
    const u = uebersetzen(quelltext, o);
    if (!u.ok) return { ok: false, phase: "uebersetzen", fehler: u.fehler, ausgabe: "", warnungen: [] };
    return starte(u.programm, u.klassen, o);
  }
  function starte(programm, klassen, o) {
    const L = laufzeit(programm, klassen, o);
    const args = o.args || [];
    const m = L.methode(o.methode, args.length);
    if (!m) return { ok: false, phase: "uebersetzen", fehler: { text: "в коде нет метода " + o.methode + " с " + args.length + " " + plural(args.length, "параметром", "параметрами", "параметрами"), zeile: 0, meldung: "В коде нет метода " + o.methode + ".", art: "typ" }, ausgabe: "", warnungen: [] };
    const sig = o.signatur ? (typeof o.signatur === "string" ? parseSignatur(o.signatur) : o.signatur) : null;
    const typen = (sig || m).params.map(p => p.typ);
    const werte = args.map((x, i) => vonJS(JSON.parse(JSON.stringify(x === undefined ? null : x)), typen[i], klassen, "Parameter " + i));
    try {
      const w = L.rufe(m, werte, m.z);
      const s = L.zustand();
      return { ok: true, wert: zuJS(w), roh: w, typ: m.rueck, argsNachher: werte.map(zuJS), ausgabe: s.ausgabe, warnungen: s.warnungen, schritte: s.schritte };
    } catch (e) {
      const s = L.zustand();
      let f;
      if (e instanceof CodeFehler) f = info(e);
      else if (e instanceof RangeError) f = { text: "слишком глубокая рекурсия — нет условия выхода?", zeile: 0, meldung: "Слишком глубокая рекурсия — нет условия выхода?", art: "limit" };
      else f = { text: "внутренняя ошибка тренажёра: " + (e && e.message), zeile: 0, meldung: "Внутренняя ошибка тренажёра: " + (e && e.message), art: "intern" };
      return { ok: false, phase: "lauf", fehler: f, ausgabe: s.ausgabe, warnungen: s.warnungen, schritte: s.schritte };
    }
  }

  /* Werte vergleichen: tief, Kommazahlen mit Toleranz 0,01 */
  function gleichJS(a, b) {
    if (typeof a === "number" && typeof b === "number") {
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      if (Number.isInteger(a) && Number.isInteger(b)) return a === b;
      return Math.abs(a - b) <= 0.01 + 1e-9;
    }
    if (a === null || b === null || a === undefined || b === undefined || typeof a !== "object" || typeof b !== "object") return a === b;
    if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => gleichJS(x, b[i]));
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => hat(b, k) && gleichJS(a[k], b[k]));
  }

  /* JS-Wert mit Typ als Java-ähnlicher Text */
  function formatiere(x, t, klassen) {
    if (x === undefined) return "—";
    if (x === null) return "null";
    if (typeof t === "string") t = parseTyp(t);
    klassen = klassen instanceof Map ? klassen : klassenMap(klassen);
    if (!t) return JSON.stringify(x);
    if (t.dim) return Array.isArray(x) ? "{" + x.map(y => formatiere(y, elementTyp(t), klassen)).join(", ") + "}" : String(x);
    const n = t.name;
    if (KOMMA.has(n)) return typeof x === "number" ? dblStr(x) : String(x);
    if (GANZ.has(n) || LANG.has(n)) return String(x);
    if (n === "char" || n === "Character") return "'" + x + "'";
    if (n === "String") return JSON.stringify(String(x));
    if (n === "boolean" || n === "Boolean") return String(x);
    if (LISTEN.has(n)) return Array.isArray(x) ? "[" + x.map(y => formatiere(y, t.args[0] || null, klassen)).join(", ") + "]" : String(x);
    const def = klassen.get(n);
    if (def && x && typeof x === "object") return n + "(" + Object.keys(def.felder).map(k => k + "=" + formatiere(x[k], def.felder[k], klassen)).join(", ") + ")";
    return JSON.stringify(x);
  }
  function formatiereRoh(w, klassen) {
    if (w === undefined) return "—";
    if (w === null) return "null";
    if (typeof w === "string") return JSON.stringify(w);
    if (typeof w === "boolean") return String(w);
    switch (w.t) {
      case "int": case "long": return String(w.v);
      case "double": return dblStr(w.v);
      case "char": return "'" + String.fromCharCode(w.v) + "'";
      case "array": return "{" + w.a.map(y => formatiereRoh(y, klassen)).join(", ") + "}";
      case "list": return "[" + w.a.map(y => formatiereRoh(y, klassen)).join(", ") + "]";
      case "obj": return w.klasse + "(" + Object.keys(w.f).map(k => k + "=" + formatiereRoh(w.f[k], klassen)).join(", ") + ")";
    }
    return "?";
  }

  /* Alle Tests einer Aufgabe ausführen */
  function pruefeAufgabe(aufgabe, code, optionen) {
    const klassen = klassenMap(aufgabe.klassen);
    const sig = parseSignatur(aufgabe.signatur);
    const tests = aufgabe.tests || [];
    const eingabeText = t => sig.params.map((p, i) => p.name + " = " + formatiere(t.eingabe[i], p.typ, klassen)).join("; ");
    const istVoid = sig.rueck.name === "void" && !sig.rueck.dim;
    const erwartetText = t => {
      const teile = [];
      if (!istVoid) teile.push(formatiere(t.erwartet, sig.rueck, klassen));
      (t.nachher || []).forEach((x, i) => { if (x !== undefined && x !== null) teile.push(sig.params[i].name + " после вызова = " + formatiere(x, sig.params[i].typ, klassen)); });
      return teile.join("; ");
    };
    const basis = (t, i) => ({ nr: i + 1, verdeckt: !!t.verdeckt, fall: t.fall || "", eingabe: eingabeText(t), erwartet: erwartetText(t) });
    const u = uebersetzen(code, { klassen });
    let fehler = null, m = null;
    if (u.ok) {
      m = u.programm.methoden.find(x => x.name === sig.name && x.params.length === sig.params.length);
      if (!m) {
        const aehn = u.programm.methoden.find(x => x.name === sig.name) || u.programm.methoden.find(x => x.name.toLowerCase() === sig.name.toLowerCase());
        fehler = { text: "в коде нет метода " + aufgabe.signatur + " — оставь заголовок из заготовки" + (aehn ? " (сейчас: " + typStr(aehn.rueck) + " " + aehn.name + "(" + aehn.params.map(p => typStr(p.typ) + " " + p.name).join(", ") + "))" : ""), zeile: aehn ? aehn.z : 0, art: "typ" };
        fehler.meldung = (fehler.zeile ? "Строка " + fehler.zeile + ": " : "") + fehler.text;
      }
    } else fehler = u.fehler;
    if (fehler) return { kompiliert: false, fehler, bestanden: 0, gesamt: tests.length, tests: tests.map((t, i) => Object.assign(basis(t, i), { ok: false, gelaufen: false })), warnungen: [] };
    const warnungen = new Map();
    const sigText = typStr(sig.rueck) + " " + sig.name + "(" + sig.params.map(p => typStr(p.typ)).join(", ") + ")";
    const ihrText = typStr(m.rueck) + " " + m.name + "(" + m.params.map(p => typStr(p.typ)).join(", ") + ")";
    if (sigText !== ihrText) warnungen.set("sig", { zeile: m.z, text: "заголовок метода отличается от задания: нужно " + aufgabe.signatur, meldung: "Строка " + m.z + ": заголовок метода отличается от задания: нужно " + aufgabe.signatur });
    let ersterFehler = null;
    const ergebnisse = tests.map((t, i) => {
      const r = starte(u.programm, klassen, { methode: sig.name, args: t.eingabe, signatur: sig, maxSchritte: optionen && optionen.maxSchritte });
      (r.warnungen || []).forEach(w => warnungen.set(w.meldung, w));
      const e = Object.assign(basis(t, i), { gelaufen: true, ausgabe: r.ausgabe || "" });
      if (!r.ok) { e.ok = false; e.fehler = r.fehler; if (!ersterFehler) ersterFehler = r.fehler; return e; }
      let ok = istVoid ? true : gleichJS(t.erwartet === undefined ? null : t.erwartet, r.wert === undefined ? null : r.wert);
      const teile = [];
      if (!istVoid) teile.push(formatiereRoh(r.roh, klassen));
      (t.nachher || []).forEach((x, k) => {
        if (x === undefined || x === null) return;
        if (!gleichJS(x, r.argsNachher[k])) ok = false;
        teile.push(sig.params[k].name + " после вызова = " + formatiere(r.argsNachher[k], sig.params[k].typ, klassen));
      });
      e.erhalten = teile.join("; ");
      e.ok = ok;
      if (!ok && r.roh && r.roh.t === "double" && Number.isNaN(r.roh.v)) e.hinweis = "NaN получается при делении 0.0 / 0 — например, для пустого списка. Проверь этот случай до деления.";
      else if (!ok && r.roh && r.roh.t === "double" && typeof t.erwartet === "number" && !Number.isInteger(t.erwartet) && Number.isInteger(r.roh.v) && Math.trunc(t.erwartet) === r.roh.v)
        e.hinweis = "Дробная часть потерялась — похоже на целочисленное деление int / int. Приведи к double: (double) summe / anzahl.";
      return e;
    });
    const bestanden = ergebnisse.filter(e => e.ok).length;
    return { kompiliert: true, fehler: ersterFehler, bestanden, gesamt: tests.length, tests: ergebnisse, warnungen: Array.from(warnungen.values()) };
  }

  const api = { uebersetzen, ausfuehren, pruefeAufgabe, formatiere, gleichJS, parseSignatur, parseTyp, typStr, klassenMap, CodeFehler, GRENZE,
    _intern: { lexer, dblStr } };
  root.GENCODELAUF = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
