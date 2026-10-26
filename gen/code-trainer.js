/* ============================================================================
   gen/code-trainer.js — «Код с автопроверкой» (GA2: Entwickeln Sie eine Methode …)
   ----------------------------------------------------------------------------
   Bildschirm scCode: Aufgabenliste nach Stufen, Aufgabe mit Klassentabelle,
   Editor (Zeilennummern, Tasten fürs Handy) und echte Tests über
   root.GENCODELAUF. Entwurf und Versuche: localStorage "ap2:code".
   Jeder Prüflauf → root.GENLERNSTAND.record({topic:"algo", source:"code", …}).

   Speicher: { v:1, aufgaben: { <id>: { code, hilfe, loesung, laeufe, versuch,
                historie:[{id,t,versuch,bestanden,gesamt,support,fehler,code,erfasst}] } } }
   API: root.GENCODE = { oeffnen(id?), liste(), … }
   ========================================================================== */
"use strict";
(function (root) {
  const SK = "ap2:code", SK_SICHERUNG = "ap2:code:sicherung";
  const hatDom = typeof document !== "undefined" && !!document.createElement;
  const $ = id => document.getElementById(id);
  const kopie = x => JSON.parse(JSON.stringify(x));
  const aufgaben = () => root.AP2_CODE_AUFGABEN || [];
  const lauf = () => root.GENCODELAUF;
  const finde = id => aufgaben().find(a => a.id === id) || null;
  const HILFE_TEXT = { selbst: "самостоятельно", hilfe: "с подсказкой", loesung: "с открытым решением" };

  /* ======================================================================
     Speicher
     ====================================================================== */
  let lesefehler = "", schreibfehler = "", rohDefekt = null;
  const leer = () => ({ v: 1, aufgaben: {} });
  function laden() {
    lesefehler = ""; rohDefekt = null;
    let roh = null;
    try { roh = root.localStorage ? root.localStorage.getItem(SK) : null; }
    catch (e) { lesefehler = "Память браузера недоступна — черновики и попытки сохранятся только до закрытия вкладки."; return leer(); }
    if (!roh) return leer();
    try {
      const x = JSON.parse(roh);
      if (!x || typeof x !== "object" || Array.isArray(x) || !x.aufgaben || typeof x.aufgaben !== "object" || Array.isArray(x.aufgaben)) throw new Error("format");
      const st = Object.assign({}, x, { v: 1, aufgaben: {} });
      Object.keys(x.aufgaben).forEach(id => {
        const a = x.aufgaben[id];
        if (!a || typeof a !== "object" || Array.isArray(a)) return;
        st.aufgaben[id] = Object.assign({}, a, {
          code: typeof a.code === "string" ? a.code : null,
          hilfe: !!a.hilfe, loesung: !!a.loesung,
          laeufe: Number.isInteger(a.laeufe) && a.laeufe >= 0 ? a.laeufe : 0,
          versuch: Number.isInteger(a.versuch) && a.versuch > 0 ? a.versuch : 1,
          historie: Array.isArray(a.historie) ? a.historie.filter(h => h && typeof h === "object" && Number.isFinite(h.bestanden) && Number.isFinite(h.gesamt)) : [],
          t: Number.isFinite(a.t) ? a.t : 0,
          familiar: !!a.familiar || a.versuch > 1
        });
      });
      return st;
    } catch (e) {
      rohDefekt = roh;
      lesefehler = "Сохранённые данные тренажёра повреждены. Старая запись сохранена отдельно (ap2:code:sicherung), тренажёр начинает с чистого листа.";
      return leer();
    }
  }
  let ST = laden();
  function speichern() {
    try {
      if (!root.localStorage) throw new Error("kein Speicher");
      if (rohDefekt) { root.localStorage.setItem(SK_SICHERUNG, rohDefekt); rohDefekt = null; }
      root.localStorage.setItem(SK, JSON.stringify(ST));
      schreibfehler = "";
      return { ok: true };
    } catch (e) {
      schreibfehler = "Не удалось сохранить на устройстве (память браузера переполнена или недоступна). Текст остаётся в поле — скопируй его, чтобы не потерять.";
      return { ok: false, error: schreibfehler };
    }
  }
  function eintrag(id) {
    if (!finde(id)) throw new Error("Неизвестная задача: " + id);
    if (!ST.aufgaben[id]) ST.aufgaben[id] = { code: null, hilfe: false, loesung: false, laeufe: 0, versuch: 1, historie: [], t: 0 };
    return ST.aufgaben[id];
  }
  const vorhanden = id => ST.aufgaben[id] || null;

  /* ======================================================================
     Logik (ohne DOM, testbar)
     ====================================================================== */
  function code(id) { const x = vorhanden(id), a = finde(id); return x && typeof x.code === "string" ? x.code : a ? a.vorlage : ""; }
  function entwurf(id, text) {
    const x = eintrag(id);
    x.code = String(text == null ? "" : text); x.t = Date.now();
    return speichern();
  }
  function support(id) { const x = vorhanden(id); return x && x.loesung ? "loesung" : x && x.hilfe ? "hilfe" : "selbst"; }
  function hilfe(id) { const x = eintrag(id); if (!x.hilfe) { x.hilfe = true; x.t = Date.now(); } return speichern(); }
  function loesungZeigen(id) {
    const x = eintrag(id);
    if (!x.laeufe && !x.loesung) return { ok: false, error: "Решение откроется после первой проверки: сначала попробуй сама и запусти тесты." };
    if (!x.loesung) { x.loesung = true; x.t = Date.now(); }
    const r = speichern();
    return { ok: true, gespeichert: r.ok, error: r.error, loesung: finde(id).loesung };
  }
  function neuerVersuch(id) {
    const x = eintrag(id), a = finde(id);
    x.familiar = !!(x.familiar || x.hilfe || x.loesung || x.historie.length);
    x.versuch = (x.versuch || 1) + 1; x.hilfe = false; x.loesung = false; x.laeufe = 0; x.code = a.vorlage; x.t = Date.now();
    return speichern();
  }
  function ereignis(a, h) {
    return { id: h.id, t: h.t, topic: "algo", source: "code", task: a.id, correct: h.bestanden, max: h.gesamt, support: h.support, kind: "auto",
      familiar: !!h.familiar, answers: { code: h.code },
      snapshot: { type: "code", title: a.titel, question: a.kontext + "\n" + a.aufgabe, signatur: a.signatur, solution: a.loesung } };
  }
  function erfassen(a, h) {
    if (!root.GENLERNSTAND || typeof root.GENLERNSTAND.record !== "function") return false;
    let r;
    try { r = root.GENLERNSTAND.record(ereignis(a, h)); } catch (e) { return false; }
    if (r && (r.ok || /уже существует/.test(r.error || ""))) h.erfasst = true;
    return !!(r && r.ok);
  }
  let folge = 0;
  function pruefen(id, text) {
    const a = finde(id);
    if (!a) throw new Error("Неизвестная задача: " + id);
    if (!lauf()) throw new Error("Исполнитель кода не загружен.");
    const x = eintrag(id);
    if (text != null) x.code = String(text);
    const quell = typeof x.code === "string" ? x.code : a.vorlage;
    const r = lauf().pruefeAufgabe(a, quell);
    const sup = support(id), t = Date.now();
    x.laeufe = (x.laeufe || 0) + 1;
    const h = { id: "code:" + id + ":" + t.toString(36) + ":" + (++folge) + ":" + x.historie.length, t, versuch: x.versuch || 1,
      bestanden: r.bestanden, gesamt: r.gesamt, support: sup, fehler: r.kompiliert ? (r.fehler ? r.fehler.meldung : null) : r.fehler.meldung,
      kompiliert: r.kompiliert, code: quell, erfasst: false, familiar: !!x.familiar };
    x.historie.forEach(alt => { if (!alt.erfasst) erfassen(a, alt); });
    x.historie.push(h);
    erfassen(a, h);
    x.t = t;
    const s = speichern();
    return Object.assign({}, r, { support: sup, eintrag: kopie(h), gespeichert: s.ok, speicherfehler: s.error || "" });
  }
  const RANG = { selbst: 2, hilfe: 1, loesung: 0 };
  function bester(id) {
    const x = vorhanden(id);
    if (!x || !x.historie.length) return null;
    return x.historie.reduce((b, h) => {
      if (!b) return h;
      const qa = h.bestanden / h.gesamt, qb = b.bestanden / b.gesamt;
      if (qa !== qb) return qa > qb ? h : b;
      if (RANG[h.support] !== RANG[b.support]) return RANG[h.support] > RANG[b.support] ? h : b;
      return h.t >= b.t ? h : b;
    }, null);
  }
  const testWort = n => (n % 10 === 1 && n % 100 !== 11 ? "теста" : "тестов");
  function status(id) {
    const a = finde(id), x = vorhanden(id), b = bester(id);
    const gesamt = a ? a.tests.length : 0;
    if (!b) {
      const entwurfDa = !!(x && typeof x.code === "string" && a && x.code.trim() !== a.vorlage.trim());
      return { art: "neu", text: "не решала" + (entwurfDa ? " · есть черновик" : ""), bestanden: 0, gesamt, support: null };
    }
    if (b.bestanden === b.gesamt) {
      const zusatz = b.support === "selbst" ? (b.familiar ? " · знакомая задача — проверь навык на другом примере" : "") : b.support === "hilfe" ? " · с подсказкой — повтори сама" : " · с решением — повтори сама";
      return { art: "fertig", text: "все тесты пройдены" + zusatz, bestanden: b.bestanden, gesamt: b.gesamt, support: b.support, familiar: !!b.familiar };
    }
    return { art: "teil", text: "решено " + b.bestanden + " из " + b.gesamt + " " + testWort(b.gesamt), bestanden: b.bestanden, gesamt: b.gesamt, support: b.support, familiar: !!b.familiar };
  }
  function liste() { return aufgaben().map(a => ({ id: a.id, titel: a.titel, stufe: a.stufe, signatur: a.signatur, status: status(a.id) })); }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  function knopf(text, cls, fn, titel) {
    const b = el("button", "btn" + (cls ? " " + cls : ""), text); b.type = "button";
    if (titel) b.title = titel;
    b.addEventListener("click", fn); return b;
  }
  const karte = (w, titel, cls) => { const c = el("section", "cd-karte" + (cls ? " " + cls : "")); if (titel) c.appendChild(el("h2", null, titel)); w.appendChild(c); return c; };
  const zeit = t => { try { return new Date(t).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  const STUFEN = { 1: "Уровень 1 · один цикл и условие", 2: "Уровень 2 · объекты, строки, особые случаи", 3: "Уровень 3 · вложенные циклы, сортировка, периоды" };

  let aktuell = null;       /* id der offenen Aufgabe */
  let ui = null;            /* Verweise auf Editor-Elemente */

  function seite() {
    let s = $("scCode");
    if (s) return s;
    s = el("div", "seite cd-seite"); s.id = "scCode"; s.hidden = true;
    const w = el("div", "cd-wrap"); w.id = "codeInhalt"; s.appendChild(w);
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling); else document.body.appendChild(s);
    return s;
  }
  function oeffnen(id, ausVerlauf, vonListe) {
    if (!hatDom) return;
    const a = id ? finde(id) : null;
    aktuell = a ? a.id : null;
    const s = seite();
    document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n => { n.hidden = n !== s; });
    s.hidden = false;
    ["fuss", "mwUhr", "btnUhr", "mwPunkte", "schalterKatalog"].forEach(k => { const e = $(k); if (e) e.hidden = true; });
    if ($("kopfTitel")) $("kopfTitel").hidden = false;
    if ($("kEyebrow")) $("kEyebrow").textContent = "GA2 · Entwickeln Sie eine Methode";
    if ($("kTitel")) $("kTitel").textContent = a ? a.titel : "Код с автопроверкой";
    const kopf = document.querySelector(".kopf");
    if (kopf) s.style.setProperty("--cd-kopf", kopf.offsetHeight + "px");
    if (!ausVerlauf) {
      try {
        if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: "scStart" }, "");
        history.pushState({ ihk: 1, seite: "scCode", cd: aktuell, vonListe: !!(a && vonListe) }, "", location.hash || "");
      } catch (e) { }
    }
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scCode", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
    const w = $("codeInhalt"); w.replaceChildren(); ui = null;
    if (lesefehler) { const p = el("p", "cd-alarm", lesefehler); p.setAttribute("role", "alert"); w.appendChild(p); }
    try { if (a) zeichneAufgabe(w, a); else zeichneListe(w); }
    catch (e) { const p = el("p", "cd-alarm", "Ошибка экрана: " + e.message); p.setAttribute("role", "alert"); w.appendChild(p); if (root.console) console.error(e); }
    root.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------- Liste */
  function zeichneListe(w) {
    const intro = karte(w, "Код, который по-настоящему выполняется");
    intro.appendChild(el("p", null, "В GA2 задание «Entwickeln Sie eine Methode …» — это код на Java-подобном псевдокоде. Здесь твой метод запускается на тестах: видимых примерах и скрытых граничных случаях (пустой список, отрицательные числа, одинаковые значения)."));
    const fertig = aufgaben().filter(a => status(a.id).art === "fertig").length;
    const selbst = aufgaben().filter(a => { const s = status(a.id); return s.art === "fertig" && s.support === "selbst" && !s.familiar; }).length;
    intro.appendChild(el("p", "cd-klein", "Все тесты пройдены: " + fertig + " из " + aufgaben().length + " задач" + (fertig ? ", из них самостоятельно — " + selbst : "") + ". Подсказка и решение отмечаются в журнале как помощь."));
    const sp = el("details", "cd-details");
    sp.appendChild(el("summary", null, "Какой код понимает тренажёр"));
    const ul = el("ul", "cd-spick");
    [
      "Метод с типами: int summe(int[] werte) { … }. Можно добавить свои вспомогательные методы и вызывать их.",
      "Типы: int, long, double, boolean, char, String, var, int[], int[][], List<Typ>, классы из задания.",
      "if / else if / else, while, do … while, for (int i = 0; i < n; i++), for (Typ x : liste), break, continue, return.",
      "Массивы: new int[n], new int[r][c], int[] a = {1, 2, 3}; a.length, a[i], a[i][j].",
      "Списки: new ArrayList<>(), size(), get(i), add(x), add(i, x), set(i, x), remove(i), isEmpty(), contains(x).",
      "Строки: length(), charAt(i), equals(…), equalsIgnoreCase, substring, toLowerCase, toUpperCase, contains, indexOf, trim, split.",
      "Math.max / min / abs / round / floor / ceil / sqrt / pow, Integer.MAX_VALUE, Integer.MIN_VALUE, Double.MAX_VALUE.",
      "Геттеры объектов из таблицы класса: m.getWert(), a.isErledigt().",
      "System.out.println(x) — вывод показывается под результатом теста.",
      "Как в Java: int / int — целое деление (7 / 2 = 3); double в int — только явно: (int) x."
    ].forEach(t => ul.appendChild(el("li", null, t)));
    sp.appendChild(ul); intro.appendChild(sp);

    [1, 2, 3].forEach(stufe => {
      const liste = aufgaben().filter(a => a.stufe === stufe);
      if (!liste.length) return;
      const k = karte(w, STUFEN[stufe] || "Уровень " + stufe);
      const ol = el("ul", "cd-liste");
      liste.forEach(a => {
        const s = status(a.id);
        const li = el("li");
        const b = el("button", "cd-aufgabe " + s.art); b.type = "button";
        b.appendChild(el("span", "cd-a-titel", a.titel));
        b.appendChild(el("code", "cd-a-sig", a.signatur));
        const st = el("span", "cd-a-status " + s.art, (s.art === "fertig" ? "✓ " : s.art === "teil" ? "◐ " : "○ ") + s.text);
        b.appendChild(st);
        b.addEventListener("click", () => oeffnen(a.id, false, true));
        li.appendChild(b); ol.appendChild(li);
      });
      k.appendChild(ol);
    });
  }

  /* ---------------------------------------------------------- Aufgabe */
  function zurListe() {
    try { if (history.state && history.state.seite === "scCode" && history.state.vonListe) { history.back(); return; } } catch (e) { }
    oeffnen(null);
  }
  function zeichneAufgabe(w, a) {
    const nav = el("div", "cd-nav");
    nav.appendChild(knopf("← Все задачи", "ghost", zurListe));
    w.appendChild(nav);

    const k = karte(w, null, "cd-aufgabe-karte");
    k.appendChild(el("p", "cd-eyebrow", "Уровень " + a.stufe + " · " + status(a.id).text));
    k.appendChild(el("h2", null, a.titel));
    const sit = el("div", "cd-de"); sit.lang = "de";
    sit.appendChild(el("p", "cd-label", "Situation"));
    sit.appendChild(el("p", null, a.kontext));
    sit.appendChild(el("p", "cd-label", "Aufgabe"));
    sit.appendChild(el("p", "cd-auftrag", a.aufgabe));
    const sg = el("p", "cd-signatur"); sg.appendChild(el("span", "cd-label", "Methodenkopf ")); sg.appendChild(el("code", null, a.signatur));
    sit.appendChild(sg);
    k.appendChild(sit);
    const ru = el("details", "cd-details");
    ru.appendChild(el("summary", null, "Алгоритм по-русски · подсказка"));
    const ol = el("ol"); (a.erklaerungRu || []).forEach(t => ol.appendChild(el("li", null, t))); ru.appendChild(ol);
    ru.addEventListener("toggle", () => { if (ru.open) { hilfe(a.id); if (ui && ui.a.id === a.id) ui.sup.textContent = "Помощь: " + HILFE_TEXT[support(a.id)]; } });
    k.appendChild(ru);
    if (a.begriffe && a.begriffe.length) {
      const be = el("details", "cd-details");
      be.appendChild(el("summary", null, "Begriffe — немецкие слова задания"));
      const dl = el("dl", "cd-begriffe");
      a.begriffe.forEach(([de, r]) => { const dt = el("dt", null, de); dt.lang = "de"; dl.appendChild(dt); dl.appendChild(el("dd", null, r)); });
      be.appendChild(dl); k.appendChild(be);
    }

    if (a.klassen && a.klassen.length) {
      const kk = karte(w, "Klassen aus der Aufgabe");
      a.klassen.forEach(c => {
        kk.appendChild(el("h3", null, "Klasse " + c.name));
        if (c.beschreibung) { const p = el("p", "cd-klein", c.beschreibung); p.lang = "de"; kk.appendChild(p); }
        const sc = el("div", "cd-scroll");
        const tb = el("table", "cd-tabelle"); tb.lang = "de";
        const th = el("thead"), tr = el("tr"); tr.appendChild(el("th", null, "Methode")); tr.appendChild(el("th", null, "Beschreibung")); th.appendChild(tr); tb.appendChild(th);
        const tbd = el("tbody");
        (c.methoden || []).forEach(([m, d]) => { const r = el("tr"); const c1 = el("td"); c1.appendChild(el("code", null, m)); r.appendChild(c1); r.appendChild(el("td", null, d)); tbd.appendChild(r); });
        tb.appendChild(tbd); sc.appendChild(tb); kk.appendChild(sc);
      });
    }

    const bk = karte(w, "Примеры (видимые тесты)");
    const L = lauf(), sig = L ? L.parseSignatur(a.signatur) : null;
    const istVoid = sig && sig.rueck.name === "void" && !sig.rueck.dim;
    const bl = el("ul", "cd-beispiele");
    a.tests.filter(t => !t.verdeckt).forEach(t => {
      const li = el("li");
      const ein = sig ? sig.params.map((p, i) => p.name + " = " + L.formatiere(t.eingabe[i], p.typ, a.klassen)).join("; ") : JSON.stringify(t.eingabe);
      li.appendChild(zeile("Вход", ein));
      const erw = [];
      if (sig && !istVoid) erw.push(L.formatiere(t.erwartet, sig.rueck, a.klassen));
      (t.nachher || []).forEach((x, i) => { if (x != null && sig) erw.push(sig.params[i].name + " после вызова = " + L.formatiere(x, sig.params[i].typ, a.klassen)); });
      li.appendChild(zeile("Ожидается", erw.join("; ")));
      bl.appendChild(li);
    });
    bk.appendChild(bl);
    const n = a.tests.filter(t => t.verdeckt).length;
    if (n) bk.appendChild(el("p", "cd-klein", "Ещё " + n + " " + (n === 1 ? "скрытый граничный случай проверяется" : n < 5 ? "скрытых граничных случая проверяются" : "скрытых граничных случаев проверяются") + " при запуске. Дробные числа сравниваются с допуском 0,01."));

    zeichneEditor(w, a);
  }
  function zeile(label, text) {
    const d = el("div", "cd-zeile");
    d.appendChild(el("span", "cd-z-label", label));
    d.appendChild(el("code", "cd-z-wert", text));
    return d;
  }

  /* ---------------------------------------------------------- Editor */
  const TASTEN = [
    ["{ }", "block", null, "Блок { } с отступом"], ["( )", "paar", ["(", ")"]], ["[ ]", "paar", ["[", "]"]], [";", "text", ";"],
    ["=", "op", "="], ["==", "op", "=="], ["!=", "op", "!="], ["<", "op", "<"], [">", "op", ">"], ["<=", "op", "<="], [">=", "op", ">="],
    ["&&", "op", "&&"], ["||", "op", "||"], ["++", "text", "++"], ["⇥", "text", "    ", "Отступ: 4 пробела"],
    ["for", "for"], ["if", "if"], ["else", "else"], ["while", "while"], ["return", "return"]
  ];
  function zeichneEditor(w, a) {
    const k = karte(w, "Твой код", "cd-editor-karte");
    const x = vorhanden(a.id);
    const sup = el("p", "cd-support"); k.appendChild(sup);
    const ed = el("div", "cd-editor");
    const leiste = el("div", "cd-tasten"); leiste.setAttribute("role", "toolbar"); leiste.setAttribute("aria-label", "Вставка символов и конструкций");
    const feld = el("div", "cd-feld");
    const nummern = el("div", "cd-nummern"); nummern.setAttribute("aria-hidden", "true");
    const flaeche = el("div", "cd-flaeche");
    const mark = el("div", "cd-mark"); mark.hidden = true; mark.setAttribute("aria-hidden", "true");
    const ta = el("textarea", "cd-text");
    ta.id = "cdCode"; ta.value = code(a.id); ta.rows = 10;
    ta.setAttribute("autocapitalize", "off"); ta.setAttribute("autocorrect", "off"); ta.setAttribute("autocomplete", "off");
    ta.spellcheck = false; ta.setAttribute("spellcheck", "false"); ta.setAttribute("wrap", "off");
    ta.setAttribute("aria-label", "Код метода " + a.signatur);
    flaeche.appendChild(mark); flaeche.appendChild(ta);
    feld.appendChild(nummern); feld.appendChild(flaeche);
    TASTEN.forEach(([txt, art, wert, titel]) => {
      const b = el("button", "cd-taste" + (/^[a-z]/.test(txt) ? " wort" : ""), txt); b.type = "button";
      b.setAttribute("aria-label", titel || "Вставить " + txt); if (titel) b.title = titel;
      b.addEventListener("pointerdown", e => e.preventDefault());
      b.addEventListener("mousedown", e => e.preventDefault());
      b.addEventListener("click", () => einfuegen(ta, art, wert));
      leiste.appendChild(b);
    });
    ed.appendChild(leiste); ed.appendChild(feld);
    k.appendChild(ed);
    const info = el("p", "cd-klein cd-speicher"); info.setAttribute("aria-live", "polite");
    info.textContent = "Черновик сохраняется автоматически. Tab — отступ, Esc — выйти из поля, Ctrl+Enter — проверить.";

    const knoepfe = el("div", "cd-knoepfe");
    const bPruef = knopf("Проверить", "primary", () => pruefenUI());
    const bHilfe = knopf("Подсказка", "", () => { const r = hilfe(a.id); zeigeHilfe(true); supportZeigen(); if (!r.ok) speicherInfo(r.error, true); });
    const bLoes = knopf("Показать решение", "", () => {
      const r = loesungZeigen(a.id);
      if (!r.ok) { speicherInfo(r.error, true); return; }
      zeigeLoesung(true); supportZeigen(); if (!r.gespeichert) speicherInfo(r.error, true);
    });
    const bNeu = knopf("Новая попытка", "ghost", () => {
      if (bNeu.dataset.sicher !== "1") { bNeu.dataset.sicher = "1"; bNeu.textContent = "Точно? Код заменится заготовкой"; setTimeout(() => { if (bNeu.isConnected) { bNeu.dataset.sicher = ""; bNeu.textContent = "Новая попытка"; } }, 5000); return; }
      bNeu.dataset.sicher = ""; bNeu.textContent = "Новая попытка";
      const r = neuerVersuch(a.id);
      ta.value = code(a.id); aktualisieren(); setzeFehlerZeile(0);
      zeigeHilfe(false); zeigeLoesung(false); supportZeigen(); ergebnis.replaceChildren(); ergebnis.hidden = true;
      speicherInfo(r.ok ? "Новая попытка начата: код заменён заготовкой. Это повтор знакомой задачи. Для проверки переноса навыка выбери другой пример." : r.error, !r.ok);
    }, "Начать задачу заново: заготовка, без подсказки и решения");
    [bPruef, bHilfe, bLoes, bNeu].forEach(b => knoepfe.appendChild(b));
    k.appendChild(knoepfe);
    /* Statuszeile unter den Knöpfen: ändert sie beim Verlassen des Feldes ihre
       Höhe, dürfen sich die Knöpfe nicht zwischen Drücken und Loslassen verschieben. */
    k.appendChild(info);

    const hilfeBox = el("div", "cd-hilfe"); hilfeBox.hidden = true;
    hilfeBox.appendChild(el("p", "cd-label", "Подсказка"));
    hilfeBox.appendChild(el("p", null, a.hinweis));
    k.appendChild(hilfeBox);
    const loesBox = el("div", "cd-loesung"); loesBox.hidden = true;
    loesBox.appendChild(el("p", "cd-label", "Образец решения"));
    const pre = el("pre", "cd-pre"); pre.textContent = a.loesung; loesBox.appendChild(pre);
    loesBox.appendChild(el("p", "cd-klein", "Сравни со своим кодом построчно. Чтобы попытка засчиталась как самостоятельная, начни позже «Новую попытку» и реши без подсказки."));
    k.appendChild(loesBox);

    const ergebnis = el("section", "cd-karte cd-ergebnis"); ergebnis.hidden = true; ergebnis.id = "cdErgebnis";
    ergebnis.setAttribute("aria-live", "polite");
    w.appendChild(ergebnis);
    const verlauf = el("section", "cd-karte cd-verlauf"); w.appendChild(verlauf);

    ui = { a, ta, nummern, mark, info, sup, bLoes, hilfeBox, loesBox, ergebnis, verlauf, fehlerZeile: 0, timer: null };

    function supportZeigen() {
      const s = support(a.id), xx = vorhanden(a.id);
      sup.className = "cd-support " + s;
      sup.textContent = "Эта попытка засчитывается как: " + HILFE_TEXT[s] + (xx && xx.versuch > 1 ? " · попытка " + xx.versuch : "");
      const darf = !!(xx && (xx.laeufe > 0 || xx.loesung));
      bLoes.disabled = !darf;
      bLoes.title = darf ? "Открыть образец решения (попытка будет отмечена «с решением»)" : "Доступно после первой проверки";
    }
    function zeigeHilfe(an) { hilfeBox.hidden = !an; }
    function zeigeLoesung(an) { loesBox.hidden = !an; }
    function speicherInfo(text, fehler) { info.textContent = text; info.classList.toggle("fehler", !!fehler); }
    ui.speicherInfo = speicherInfo; ui.supportZeigen = supportZeigen;

    function aktualisieren() {
      const n = ta.value.split("\n").length;
      if (nummern.childElementCount !== n) {
        const frag = document.createDocumentFragment();
        for (let i = 1; i <= n; i++) frag.appendChild(el("span", i === ui.fehlerZeile ? "fehl" : null, String(i)));
        nummern.replaceChildren(frag);
      }
      ta.style.height = "auto";
      ta.style.height = (ta.scrollHeight + ta.offsetHeight - ta.clientHeight) + "px";
    }
    ui.aktualisieren = aktualisieren;
    function sichern() {
      clearTimeout(ui.timer); ui.timer = null;
      const r = entwurf(a.id, ta.value);
      speicherInfo(r.ok ? "Черновик сохранён · " + zeit(Date.now()) : r.error, !r.ok);
      return r;
    }
    ui.sichern = sichern;
    ta.addEventListener("input", () => {
      aktualisieren();
      clearTimeout(ui.timer);
      ui.timer = setTimeout(sichern, 500);
    });
    ta.addEventListener("blur", () => { if (ui && ui.timer) sichern(); });
    ta.addEventListener("keydown", e => tastatur(e, ta));
    ["keyup", "click", "blur"].forEach(n => ta.addEventListener(n, () => { ta.dataset.pos = String(ta.selectionEnd); }));

    supportZeigen();
    if (x && x.hilfe) zeigeHilfe(true);
    if (x && x.loesung) zeigeLoesung(true);
    if (schreibfehler) speicherInfo(schreibfehler, true);
    aktualisieren();
    requestAnimationFrame(aktualisieren);
    zeichneVerlauf();
    const letzter = x && x.historie.length ? x.historie[x.historie.length - 1] : null;
    if (letzter) {
      ergebnis.hidden = false;
      ergebnis.appendChild(el("h2", null, "Последняя проверка"));
      ergebnis.appendChild(el("p", "cd-klein", zeit(letzter.t) + " — " + letzter.bestanden + " из " + letzter.gesamt + " " + testWort(letzter.gesamt) + " (" + HILFE_TEXT[letzter.support] + "). Нажми «Проверить», чтобы снова увидеть подробности."));
    }
  }

  function tastatur(e, ta) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); pruefenUI(); return; }
    if (e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (e.shiftKey) {
        const v = ta.value, s = ta.selectionStart, zs = v.lastIndexOf("\n", s - 1) + 1;
        const weg = (/^ {1,4}/.exec(v.slice(zs)) || [""])[0].length;
        if (weg) { ta.setSelectionRange(zs, zs + weg); ersetze(ta, "", 0, 0); const p = Math.max(zs, s - weg); ta.setSelectionRange(p, p); }
        return;
      }
      einfuegen(ta, "text", "    ");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.altKey && !e.isComposing) {
      const v = ta.value, s = ta.selectionStart, zs = v.lastIndexOf("\n", s - 1) + 1;
      const ind = (/^[ \t]*/.exec(v.slice(zs)) || [""])[0];
      const auf = /\{\s*$/.test(v.slice(zs, s));
      if (!ind && !auf) return;
      e.preventDefault();
      const extra = auf ? "    " : "";
      const zu = /^[ \t]*\}/.test(v.slice(ta.selectionEnd));
      if (auf && zu) ersetze(ta, "\n" + ind + extra + "\n" + ind, 1 + ind.length + extra.length, 0);
      else ersetze(ta, "\n" + ind + extra, 1 + ind.length + extra.length, 0);
    }
  }
  /* Text an der Cursorposition einsetzen (Undo bleibt erhalten, wo möglich) */
  function ersetze(ta, text, cursor, auswahl) {
    const s = ta.selectionStart, e = ta.selectionEnd, alt = ta.value;
    let ok = false;
    try {
      if (document.activeElement !== ta) ta.focus({ preventScroll: true });
      ta.setSelectionRange(s, e);
      ok = typeof document.execCommand === "function" && document.execCommand(text ? "insertText" : "delete", false, text);
    } catch (x) { ok = false; }
    if (!ok || ta.value === alt) {
      ta.value = alt.slice(0, s) + text + alt.slice(e);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
    ta.setSelectionRange(s + cursor, s + cursor + (auswahl || 0));
  }
  function einfuegen(ta, art, wert) {
    const v = ta.value;
    if (document.activeElement !== ta) {
      ta.focus({ preventScroll: true });
      if (ta.dataset.pos) { const p = Number(ta.dataset.pos); ta.setSelectionRange(p, p); }
    }
    const s = ta.selectionStart, e = ta.selectionEnd;
    const zs = v.lastIndexOf("\n", s - 1) + 1;
    const ind = (/^[ \t]*/.exec(v.slice(zs)) || [""])[0];
    const vor = s > 0 ? v[s - 1] : "";
    const luecke = vor && !/[\s(]/.test(vor) ? " " : "";
    const block = kopf => kopf + " {\n" + ind + "    \n" + ind + "}";
    let text, cur, sel = 0;
    switch (art) {
      case "text": text = wert; cur = text.length; break;
      case "paar": text = wert[0] + v.slice(s, e) + wert[1]; cur = e > s ? text.length : 1; break;
      case "op": text = luecke + wert + " "; cur = text.length; break;
      case "block": { const l = vor && !/\s/.test(vor) ? " " : ""; text = l + "{\n" + ind + "    \n" + ind + "}"; cur = l.length + 2 + ind.length + 4; break; }
      case "for": text = luecke + block("for (int i = 0; i < n; i++)"); cur = text.indexOf("< n") + 2; sel = 1; break;
      case "if": text = luecke + block("if ()"); cur = luecke.length + 4; break;
      case "while": text = luecke + block("while ()"); cur = luecke.length + 7; break;
      case "else": { const l = vor === "}" ? " " : luecke; text = l + "else {\n" + ind + "    \n" + ind + "}"; cur = l.length + 7 + ind.length + 4; break; }
      case "return": text = luecke + "return ;"; cur = text.length - 1; break;
      default: return;
    }
    ersetze(ta, text, cur, sel);
    ta.dataset.pos = String(ta.selectionEnd);
  }

  function setzeFehlerZeile(z) {
    if (!ui) return;
    ui.fehlerZeile = z || 0;
    Array.from(ui.nummern.children).forEach((s, i) => s.classList.toggle("fehl", i + 1 === ui.fehlerZeile));
    if (ui.fehlerZeile) {
      const cs = getComputedStyle(ui.ta);
      const lh = parseFloat(cs.lineHeight) || 22, pt = parseFloat(cs.paddingTop) || 0;
      ui.mark.style.top = (pt + (ui.fehlerZeile - 1) * lh) + "px";
      ui.mark.style.height = lh + "px";
      ui.mark.hidden = false;
    } else ui.mark.hidden = true;
  }
  function springeZuZeile(z) {
    if (!ui || !z) return;
    const zeilen = ui.ta.value.split("\n");
    let pos = 0; for (let i = 0; i < z - 1 && i < zeilen.length; i++) pos += zeilen[i].length + 1;
    ui.ta.focus({ preventScroll: true });
    ui.ta.setSelectionRange(pos, pos + (zeilen[z - 1] || "").length);
    const ziel = ui.nummern.children[z - 1] || ui.ta;
    if (ziel.scrollIntoView) ziel.scrollIntoView({ block: "center" });
  }

  function pruefenUI() {
    if (!ui) return;
    const a = ui.a;
    clearTimeout(ui.timer); ui.timer = null;
    let r;
    try { r = pruefen(a.id, ui.ta.value); }
    catch (e) { ui.speicherInfo("Проверка не удалась: " + e.message, true); return; }
    ui.speicherInfo(r.gespeichert ? "Черновик и попытка сохранены · " + zeit(Date.now()) : r.speicherfehler, !r.gespeichert);
    zeichneErgebnis(r);
    ui.supportZeigen();
    zeichneVerlauf();
    if ($("kEyebrow")) $("kEyebrow").textContent = "GA2 · Entwickeln Sie eine Methode";
    const eb = document.querySelector(".cd-aufgabe-karte .cd-eyebrow");
    if (eb) eb.textContent = "Уровень " + a.stufe + " · " + status(a.id).text;
    if (ui.ergebnis.scrollIntoView) ui.ergebnis.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function fehlerBox(f, titel) {
    const d = el("div", "cd-fehler"); d.setAttribute("role", "alert");
    if (titel) d.appendChild(el("p", "cd-label", titel));
    d.appendChild(el("p", "cd-f-text", f.meldung || f.text));
    if (f.zeile) d.appendChild(knopf("Перейти к строке " + f.zeile, "ghost klein", () => springeZuZeile(f.zeile)));
    return d;
  }
  function zeichneErgebnis(r) {
    const e = ui.ergebnis; e.replaceChildren(); e.hidden = false;
    const alle = r.bestanden === r.gesamt;
    e.appendChild(el("h2", alle ? "ok" : "", (alle ? "✓ " : "") + "Пройдено " + r.bestanden + " из " + r.gesamt + " " + testWort(r.gesamt)));
    let fazit = "Засчитано: " + HILFE_TEXT[r.support] + ".";
    if (alle) fazit += r.support === "selbst" ? (r.eintrag && r.eintrag.familiar ? " Знакомая задача решена без открытой помощи. Теперь попробуй другой пример." : " Все тесты пройдены без открытой помощи.") : " Помощь была — вернись к задаче позже и реши её сама.";
    e.appendChild(el("p", "cd-klein", fazit));
    if (!r.kompiliert) {
      e.appendChild(fehlerBox(r.fehler, "Код не запустился"));
      e.appendChild(el("p", "cd-klein", "Тесты не запускались: сначала исправь эту ошибку. Номер строки — слева от кода."));
      setzeFehlerZeile(r.fehler.zeile);
    } else setzeFehlerZeile(r.fehler ? r.fehler.zeile : 0);
    if (r.warnungen && r.warnungen.length) {
      const wb = el("div", "cd-warnungen");
      wb.appendChild(el("p", "cd-label", "Замечания"));
      const ul = el("ul"); r.warnungen.forEach(w => ul.appendChild(el("li", null, w.meldung))); wb.appendChild(ul);
      e.appendChild(wb);
    }
    if (!r.kompiliert) return;
    const ol = el("ol", "cd-tests");
    r.tests.forEach(t => {
      const li = el("li", "cd-test " + (t.ok ? "ok" : "nok"));
      const kopf = el("p", "cd-t-kopf");
      kopf.appendChild(el("span", "cd-t-zeichen", t.ok ? "✓" : "✗"));
      kopf.appendChild(el("b", null, "Тест " + t.nr));
      if (t.verdeckt) kopf.appendChild(el("span", "cd-t-fall", "граничный случай: " + t.fall));
      li.appendChild(kopf);
      li.appendChild(zeile("Вход", t.eingabe));
      li.appendChild(zeile("Ожидалось", t.erwartet));
      if (t.fehler) li.appendChild(fehlerBox(t.fehler));
      else li.appendChild(zeile("Получено", t.erhalten || "—"));
      if (t.ausgabe) {
        const d = el("div", "cd-zeile");
        d.appendChild(el("span", "cd-z-label", "Вывод"));
        const p = el("pre", "cd-ausgabe"); p.textContent = t.ausgabe.replace(/\n$/, ""); d.appendChild(p);
        li.appendChild(d);
      }
      if (t.hinweis) li.appendChild(el("p", "cd-t-hinweis", t.hinweis));
      ol.appendChild(li);
    });
    e.appendChild(ol);
  }
  function zeichneVerlauf() {
    if (!ui) return;
    const v = ui.verlauf; v.replaceChildren();
    const x = vorhanden(ui.a.id), h = x ? x.historie.slice().reverse() : [];
    const d = el("details", "cd-details");
    d.appendChild(el("summary", null, "История попыток (" + h.length + ")"));
    if (!h.length) d.appendChild(el("p", "cd-klein", "Проверок пока не было."));
    const ul = el("ul", "cd-historie");
    h.forEach(e => {
      const li = el("li");
      const dd = el("details");
      const s = el("summary", "cd-h-kopf " + (e.bestanden === e.gesamt ? "ok" : ""),
        zeit(e.t) + " · " + e.bestanden + "/" + e.gesamt + " · " + HILFE_TEXT[e.support] + (e.versuch > 1 ? " · попытка " + e.versuch : ""));
      dd.appendChild(s);
      if (e.fehler) dd.appendChild(el("p", "cd-klein", e.fehler));
      const pre = el("pre", "cd-pre"); pre.textContent = e.code || ""; dd.appendChild(pre);
      li.appendChild(dd); ul.appendChild(li);
    });
    d.appendChild(ul);
    v.appendChild(d);
  }

  /* ---------------------------------------------------------- Navigation */
  function einhaengen() {
    const alt = root.schirm;
    if (typeof alt === "function" && !alt.__cd) {
      const neu = function (name) {
        if (name === "scCode") { const hs = history.state || {}; oeffnen(hs.seite === "scCode" ? hs.cd : null, true); return; }
        const s = $("scCode");
        if (s && !s.hidden) { if (ui && ui.timer) ui.sichern(); s.hidden = true; }
        return alt.apply(this, arguments);
      };
      neu.__cd = true; root.schirm = neu;
    }
    root.addEventListener("popstate", ev => {
      const st = ev.state || {};
      if (st.seite === "scCode") { oeffnen(st.cd, true); return; }
      const s = $("scCode");
      if (s && !s.hidden) {
        /* zurueck.js kennt scCode evtl. noch nicht — dann selbst zurückkehren */
        const ziel = st.seite || "scStart";
        if (typeof root.schirm === "function") root.schirm(ziel); else s.hidden = true;
        if (ziel === "scStart" && typeof root.renderStart === "function") { try { root.renderStart(); } catch (e) { } }
      }
    });
    root.addEventListener("pagehide", () => { if (ui && ui.timer) ui.sichern(); });
  }
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }

  const api = {
    oeffnen: id => oeffnen(id || null), liste, status, code, entwurf, hilfe, loesungZeigen, neuerVersuch, pruefen, support,
    stand: () => kopie(ST), aufgabe: id => (finde(id) ? kopie(finde(id)) : null),
    fehler: () => lesefehler || schreibfehler, _neuLaden: () => { ST = laden(); }
  };
  root.GENCODE = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
