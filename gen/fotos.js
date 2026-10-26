/* ============================================================================
   gen/fotos.js — Foto der Papier-Antwort zu GA1/GA2-Teilaufgaben
   ----------------------------------------------------------------------------
   In GA wird viel gezeichnet (UML, ER-Modell, Netzplan, Struktogramm). Lena
   zeichnet auf Papier, fotografiert das Blatt im Bogen-Player (gen/azubi.js)
   und vergleicht es nach „Lösung zeigen“ mit der Musterlösung.

   · Kamera oder Galerie: <input type="file" accept="image/*" capture>.
   · Verkleinert auf dem Gerät (Canvas): lange Seite ≤ 1400 px, JPEG ≈ 0,8
     (≈ 150–300 KB je Foto).
   · Gespeichert in einer EIGENEN IndexedDB „ap2-fotos“ (Store „fotos“),
     Schlüssel  <modulId>|<teilId>|<Zeit in ms>. Die Datenbank „ap2-azubi“
     (Prüfungspaket) bleibt unberührt.
   · Fotos liegen NUR auf diesem Gerät — der Export/die Sicherung (gen/sync.js)
     nimmt nur localStorage „ap2:*“ mit, Fotos also nicht.

   API (window.GENFOTOS):
     anhaengen(karte, m, t)          Block „📷 Фото ответа“ in die Karte einer
                                     Teilaufgabe hängen (nur GA1/GA2; ersetzt
                                     einen alten Block → keine Doppelten)
     speichern(modulId, teilId, blob) → Promise<{id, t, bytes}>
     liste(modulId, teilId)          → Promise<[{id, modul, teil, t, bytes, typ, w, h, blob}]>
                                       (ohne teilId: alle des Moduls; ohne beides: alle)
     loeschen(id)                    → Promise (Rückfrage macht die Oberfläche)
     verkleinern(datei)              → Promise<{blob, w, h, q}>
   Reine Funktionen (tests/fotos.test.js): schluessel, praefix, grenzen,
     zerlegen, zeigenFuer, masse, naechsteQualitaet, groesseText, zeitText.
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined";
  const DB_NAME = "ap2-fotos";
  const STORE = "fotos";
  const MAX_SEITE = 1400;
  const QUALITAET = 0.8;
  const ZIEL_BYTES = 350 * 1024;          /* darüber noch einmal etwas stärker packen */
  const HINWEIS = "Фото хранятся только на этом устройстве и не входят в файл резервной копии.";

  /* ======================================================================
     Reine Funktionen
     ====================================================================== */
  const praefix = (modulId, teilId) => String(modulId) + "|" + (teilId == null ? "" : String(teilId) + "|");
  /** Schlüssel eines Fotos: Modul + Teilaufgabe + Zeit (ms, 13 Stellen → sortiert richtig) */
  function schluessel(modulId, teilId, t) {
    if (!modulId || !teilId) throw new Error("Modul und Teilaufgabe fehlen");
    return praefix(modulId, teilId) + String(Math.floor(Number(t) || 0));
  }
  /** Schlüsselbereich für IDBKeyRange.bound: alle Fotos einer Teilaufgabe (oder eines Moduls) */
  function grenzen(modulId, teilId) {
    const p = praefix(modulId, teilId);
    return { von: p, bis: p + "￿" };
  }
  function zerlegen(id) {
    const s = String(id || "");
    const a = s.indexOf("|"), b = s.lastIndexOf("|");
    if (a < 1 || b <= a) return null;
    return { modul: s.slice(0, a), teil: s.slice(a + 1, b), t: Number(s.slice(b + 1)) };
  }
  /** Knopf nur bei GA1 und GA2 — WiSo ist Ankreuzen, da gibt es nichts zu zeichnen */
  const zeigenFuer = bereich => bereich === "ga1" || bereich === "ga2";

  /** Zielgröße: lange Seite ≤ max, Seitenverhältnis bleibt, nie vergrößern */
  function masse(w, h, max) {
    max = max || MAX_SEITE;
    w = Number(w); h = Number(h);
    if (!(w > 0) || !(h > 0) || !isFinite(w) || !isFinite(h)) return null;
    const lang = Math.max(w, h);
    if (lang <= max) return { w: Math.round(w), h: Math.round(h), faktor: 1 };
    const f = max / lang;
    return {
      w: w >= h ? max : Math.max(1, Math.round(w * f)),
      h: h > w ? max : Math.max(1, Math.round(h * f)),
      faktor: f
    };
  }
  /** Zu groß geworden? → nächste, etwas niedrigere JPEG-Qualität (oder null = fertig) */
  function naechsteQualitaet(bytes, q) {
    if (!(bytes > ZIEL_BYTES)) return null;
    const n = Math.round((q - 0.1) * 100) / 100;
    return n >= 0.5 ? n : null;
  }
  function groesseText(bytes) {
    const b = Number(bytes) || 0;
    if (b < 1024) return b + " Б";
    if (b < 1024 * 1024) return Math.round(b / 1024) + " КБ";
    return (Math.round(b / 1024 / 1024 * 10) / 10).toString().replace(".", ",") + " МБ";
  }
  function zeitText(t) {
    const d = new Date(Number(t) || 0);
    const z = n => (n < 10 ? "0" : "") + n;
    return z(d.getDate()) + "." + z(d.getMonth() + 1) + "." + d.getFullYear() + " " + z(d.getHours()) + ":" + z(d.getMinutes());
  }
  function bereichVon(m) {
    if (!m) return "";
    if (root.GENAZUBI && typeof root.GENAZUBI.bereichVon === "function") {
      try { return root.GENAZUBI.bereichVon(m); } catch (e) { }
    }
    const b = String(m.bereich || "").toLowerCase();
    return ["ga1", "ga2", "wiso"].includes(b) ? b : ((/^(ga1|ga2|wiso)[-:]/i.exec(m.id || "") || [])[1] || "").toLowerCase();
  }

  /* ======================================================================
     Speicher: IndexedDB „ap2-fotos“
     ====================================================================== */
  let DB = null;
  function db() {
    if (DB) return DB;
    DB = new Promise((ok, nein) => {
      if (!root.indexedDB) { nein(new Error("kein-speicher")); return; }
      let r;
      try { r = root.indexedDB.open(DB_NAME, 1); } catch (e) { nein(e); return; }
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: "id" });
      };
      r.onsuccess = () => {
        const d = r.result;
        d.onversionchange = () => { try { d.close(); } catch (e) { } DB = null; };
        d.onclose = () => { DB = null; };
        ok(d);
      };
      r.onerror = () => nein(r.error || new Error("kein-speicher"));
      r.onblocked = () => nein(new Error("blockiert"));
    });
    DB.catch(() => { DB = null; });
    return DB;
  }
  function tu(modus, fn) {
    return db().then(d => new Promise((ok, nein) => {
      let erg, tx;
      try { tx = d.transaction(STORE, modus); } catch (e) { DB = null; nein(e); return; }
      const req = fn(tx.objectStore(STORE));
      if (req) req.onsuccess = () => { erg = req.result; };
      tx.oncomplete = () => ok(erg);
      tx.onerror = () => nein(tx.error);
      tx.onabort = () => nein(tx.error || new Error("abgebrochen"));
    }));
  }

  function puffer(blob) {
    if (blob && typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
    return new Promise((ok, nein) => {
      const fr = new root.FileReader();
      fr.onload = () => ok(fr.result); fr.onerror = () => nein(fr.error);
      fr.readAsArrayBuffer(blob);
    });
  }

  /** Beim ersten gespeicherten Foto den Browser bitten, den Speicher nicht von
      selbst zu räumen (navigator.storage.persist). Fotos gibt es nur auf diesem
      Gerät; ohne „persistent“ darf der Browser sie bei Platzmangel löschen.
      Einmal je Sitzung; → Promise<true|false|null> (null = nicht unterstützt) */
  let persistGefragt = null;
  function dauerhaft(speicher) {
    const s = speicher !== undefined ? speicher : (root.navigator && root.navigator.storage);
    if (persistGefragt && speicher === undefined) return persistGefragt;
    let p;
    try {
      if (!s || typeof s.persist !== "function") p = Promise.resolve(null);
      else p = Promise.resolve(typeof s.persisted === "function" ? s.persisted() : false).then(ja => ja ? true : s.persist()).then(x => !!x, () => null);
    } catch (e) { p = Promise.resolve(null); }
    if (speicher === undefined) persistGefragt = p;
    return p;
  }

  let letzteZeit = 0;
  /** Foto speichern. Als ArrayBuffer — ältere Safari-Versionen speichern
      Blobs in IndexedDB nicht zuverlässig. */
  function speichern(modulId, teilId, blob, info) {
    if (!blob) return Promise.reject(new Error("kein Bild"));
    const t = letzteZeit = Math.max(Date.now(), letzteZeit + 1);
    let id;
    try { id = schluessel(modulId, teilId, t); } catch (e) { return Promise.reject(e); }
    return puffer(blob).then(daten => tu("readwrite", st => st.put({
      id, modul: String(modulId), teil: String(teilId), t,
      typ: blob.type || "image/jpeg", bytes: daten.byteLength,
      w: info && info.w || 0, h: info && info.h || 0, daten
    }))).then(() => {
      dauerhaft();
      geaendert(modulId, teilId);
      return { id, t, bytes: blob.size || 0 };
    });
  }

  function liste(modulId, teilId) {
    return tu("readonly", st => {
      if (!modulId) return st.getAll();
      const g = grenzen(modulId, teilId);
      return st.getAll(root.IDBKeyRange.bound(g.von, g.bis));
    }).then(alle => (alle || []).map(r => ({
      id: r.id, modul: r.modul, teil: r.teil, t: r.t, bytes: r.bytes, typ: r.typ, w: r.w, h: r.h,
      blob: new root.Blob([r.daten], { type: r.typ || "image/jpeg" })
    })).sort((a, b) => a.t - b.t));
  }

  function loeschen(id) {
    const teile = zerlegen(id);
    return tu("readwrite", st => st.delete(String(id))).then(() => {
      urlWeg(id);
      if (teile) geaendert(teile.modul, teile.teil);
      return true;
    });
  }

  /* ======================================================================
     Verkleinern (Canvas)
     ====================================================================== */
  function bildLaden(datei) {
    return new Promise((ok, nein) => {
      const url = root.URL.createObjectURL(datei);
      const img = new root.Image();
      img.onload = () => ok({ img, fertig: () => root.URL.revokeObjectURL(url) });
      img.onerror = () => { root.URL.revokeObjectURL(url); nein(new Error("format")); };
      img.src = url;
    });
  }
  function alsBlob(cv, q) {
    return new Promise((ok, nein) => {
      if (cv.toBlob) {
        cv.toBlob(b => b ? ok(b) : nein(new Error("canvas")), "image/jpeg", q);
        return;
      }
      try {
        const d = cv.toDataURL("image/jpeg", q);
        const bin = root.atob(d.split(",")[1]);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        ok(new root.Blob([arr], { type: "image/jpeg" }));
      } catch (e) { nein(e); }
    });
  }
  /** Foto → JPEG, lange Seite ≤ 1400 px. Das <img> dreht nach EXIF richtig. */
  function verkleinern(datei) {
    return bildLaden(datei).then(({ img, fertig }) => {
      const m = masse(img.naturalWidth || img.width, img.naturalHeight || img.height, MAX_SEITE);
      if (!m) { fertig(); throw new Error("format"); }
      const cv = document.createElement("canvas");
      cv.width = m.w; cv.height = m.h;
      const cx = cv.getContext("2d");
      cx.fillStyle = "#fff";
      cx.fillRect(0, 0, m.w, m.h);
      cx.imageSmoothingEnabled = true;
      cx.imageSmoothingQuality = "high";
      cx.drawImage(img, 0, 0, m.w, m.h);
      fertig();
      const versuch = q => alsBlob(cv, q).then(b => {
        const n = naechsteQualitaet(b.size, q);
        return n ? versuch(n) : { blob: b, w: m.w, h: m.h, q };
      });
      return versuch(QUALITAET).then(r => { cv.width = cv.height = 1; return r; });
    });
  }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const URLS = new Map();
  function urlVon(f) {
    if (!URLS.has(f.id)) URLS.set(f.id, root.URL.createObjectURL(f.blob));
    return URLS.get(f.id);
  }
  function urlWeg(id) {
    const u = URLS.get(id);
    if (u) { try { root.URL.revokeObjectURL(u); } catch (e) { } URLS.delete(id); }
  }
  const datenKey = (modulId, teilId) => praefix(modulId, teilId);

  function fehlerText(e) {
    const n = e && (e.name || "");
    const msg = e && (e.message || "");
    if (n === "QuotaExceededError" || /quota/i.test(msg)) return "На устройстве не хватает места для фото. Удали старые фото или освободи память.";
    if (msg === "kein-speicher" || n === "InvalidStateError" || n === "SecurityError")
      return "Этот браузер не даёт сохранять фото (возможно, приватный режим).";
    if (msg === "format") return "Не получилось прочитать картинку. Попробуй сделать фото ещё раз или выбери JPEG/PNG.";
    return "Не получилось сохранить фото" + (msg ? " (" + msg + ")" : "") + ". Попробуй ещё раз.";
  }

  /** Inline-Rückfrage statt confirm(): „Удалить это фото?“ [Да, удалить] [Нет] */
  function rueckfrage(ziel, frage, jaText, tun) {
    const alt = ziel.querySelector(".fo-frage");
    if (alt) alt.remove();
    const box = el("div", "fo-frage");
    box.setAttribute("role", "alertdialog");
    box.appendChild(el("span", null, frage));
    const ja = el("button", "btn fo-ja", jaText); ja.type = "button";
    const nein = el("button", "btn ghost", "Нет"); nein.type = "button";
    ja.onclick = ev => { ev.stopPropagation(); ja.disabled = true; tun(box); };
    nein.onclick = ev => { ev.stopPropagation(); box.remove(); };
    box.append(ja, nein);
    ziel.appendChild(box);
    try { nein.focus({ preventScroll: true }); } catch (e) { }
    return box;
  }

  /* -------------------------------------------------- Vollbild-Ansicht --- */
  let VOLL = null;
  function vollZu() {
    if (!VOLL) return;
    const v = VOLL; VOLL = null;
    v.box.remove();
    document.documentElement.classList.remove("fo-offen");
    document.removeEventListener("keydown", v.taste, true);
    root.removeEventListener("popstate", vollZu);
    try { if (v.vorher && v.vorher.focus) v.vorher.focus({ preventScroll: true }); } catch (e) { }
  }
  /** Foto groß; mit vergleich (src der Musterlösung) übereinander zum Vergleichen */
  function vollbild(f, opt) {
    vollZu();
    opt = opt || {};
    const box = el("div", "fo-voll" + (opt.vergleich ? " zwei" : ""));
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Фото ответа");
    const kopf = el("div", "fo-voll-kopf");
    kopf.appendChild(el("span", "fo-voll-info", "Фото · " + zeitText(f.t) + " · " + groesseText(f.bytes)));
    const zu = el("button", "fo-voll-zu", "✕"); zu.type = "button"; zu.setAttribute("aria-label", "Закрыть");
    zu.onclick = vollZu;
    kopf.appendChild(zu);
    box.appendChild(kopf);

    const bilder = el("div", "fo-voll-bilder");
    const feld = (src, titel) => {
      const fig = el("figure", "fo-voll-feld");
      if (titel) fig.appendChild(el("figcaption", null, titel));
      const sc = el("div", "fo-voll-scroll");
      const img = el("img"); img.src = src; img.alt = titel || "Фото ответа";
      img.onclick = ev => { ev.stopPropagation(); sc.classList.toggle("gross"); };
      sc.appendChild(img);
      fig.appendChild(sc);
      return fig;
    };
    bilder.appendChild(feld(urlVon(f), opt.vergleich ? "Мой ответ" : ""));
    if (opt.vergleich) bilder.appendChild(feld(opt.vergleich, "Musterlösung"));
    box.appendChild(bilder);

    const fuss = el("div", "fo-voll-fuss");
    fuss.appendChild(el("span", "fo-voll-tipp", "Нажми на картинку — увеличить / вписать"));
    const weg = el("button", "btn fo-weg-gross", "🗑 Удалить фото"); weg.type = "button";
    weg.onclick = ev => {
      ev.stopPropagation();
      rueckfrage(fuss, "Удалить это фото насовсем?", "Да, удалить", frage => {
        loeschen(f.id).then(vollZu).catch(e => { frage.replaceWith(el("span", "fo-fehler", fehlerText(e))); });
      });
    };
    fuss.appendChild(weg);
    box.appendChild(fuss);

    box.addEventListener("click", ev => { if (ev.target === box || ev.target === bilder) vollZu(); });
    const taste = ev => { if (ev.key === "Escape") { ev.stopPropagation(); vollZu(); } };
    document.addEventListener("keydown", taste, true);
    /* „Zurück“ am Handy: die App wechselt die Seite — das Vollbild geht mit zu */
    root.addEventListener("popstate", vollZu);
    VOLL = { box, taste, vorher: document.activeElement };
    document.body.appendChild(box);
    document.documentElement.classList.add("fo-offen");
    try { zu.focus({ preventScroll: true }); } catch (e) { }
  }

  /* ------------------------------------------------ Block in der Karte --- */
  function miniatur(f, ctx, mitLoeschen) {
    const fig = el("figure", "fo-bild");
    fig.dataset.id = f.id;
    const zeig = el("button", "fo-zeig"); zeig.type = "button";
    zeig.setAttribute("aria-label", "Фото от " + zeitText(f.t) + " — открыть во весь экран");
    const img = el("img"); img.src = urlVon(f); img.alt = ""; img.loading = "lazy";
    zeig.appendChild(img);
    zeig.onclick = () => vollbild(f, { vergleich: mitLoeschen ? null : loesungsBild(ctx.karte) });
    fig.appendChild(zeig);
    fig.appendChild(el("figcaption", null, zeitText(f.t).slice(0, 5) + " " + zeitText(f.t).slice(-5)));
    if (mitLoeschen) {
      const x = el("button", "fo-x", "✕"); x.type = "button";
      x.setAttribute("aria-label", "Удалить фото от " + zeitText(f.t));
      x.onclick = () => rueckfrage(ctx.block, "Удалить фото от " + zeitText(f.t) + "?", "Да, удалить", frage => {
        loeschen(f.id).then(() => frage.remove()).catch(e => { frage.replaceWith(el("p", "fo-fehler", fehlerText(e))); });
      });
      fig.appendChild(x);
    }
    return fig;
  }

  /** Erstes Bild der Musterlösung (zum Nebeneinander-Vergleichen) */
  function loesungsBild(karte) {
    const img = karte && karte.querySelector(".az-loesung .az-text img.az-bild");
    return img ? img.src : null;
  }

  function aktualisieren(ctx) {
    const nr = (ctx.nr || 0) + 1;
    ctx.nr = nr;
    return liste(ctx.m.id, ctx.t.id).then(fotos => {
      if (ctx.nr !== nr) return;
      ctx.mini.innerHTML = "";
      fotos.forEach(f => ctx.mini.appendChild(miniatur(f, ctx, true)));
      ctx.mini.hidden = !fotos.length;
      ctx.knopf.textContent = fotos.length ? "📷 Ещё фото" : "📷 Фото ответа";
      if (ctx.vergleich) {
        ctx.vergleich.innerHTML = "";
        ctx.vergleich.hidden = !fotos.length;
        if (fotos.length) {
          ctx.vergleich.appendChild(el("p", "fo-vergleich-titel",
            fotos.length === 1 ? "Мой рисунок — сравни с решением:" : "Мои рисунки (" + fotos.length + ") — сравни с решением:"));
          const reihe = el("div", "fo-mini");
          fotos.forEach(f => reihe.appendChild(miniatur(f, ctx, false)));
          ctx.vergleich.appendChild(reihe);
        }
      }
    }).catch(e => {
      if (ctx.nr !== nr) return;
      ctx.mini.hidden = true;
      if (e && e.message === "kein-speicher") { ctx.status.textContent = fehlerText(e); ctx.status.className = "fo-status fo-fehler"; }
    });
  }

  /** Nach Speichern/Löschen alle sichtbaren Blöcke dieser Teilaufgabe neu zeichnen */
  function geaendert(modulId, teilId) {
    if (!hatDom) return;
    const key = datenKey(modulId, teilId);
    document.querySelectorAll(".fo-block").forEach(b => { if (b.dataset.fo === key && b._fo) aktualisieren(b._fo); });
  }

  function dateienVerarbeiten(ctx, dateien) {
    const liste = Array.from(dateien || []).filter(Boolean);
    if (!liste.length) return;
    const st = ctx.status;
    st.className = "fo-status";
    let n = 0;
    const einzeln = i => {
      if (i >= liste.length) return Promise.resolve();
      st.textContent = "Сжимаю фото" + (liste.length > 1 ? " " + (i + 1) + " из " + liste.length : "") + "…";
      return verkleinern(liste[i])
        .then(r => { st.textContent = "Сохраняю…"; return speichern(ctx.m.id, ctx.t.id, r.blob, r).then(s => { n++; return s; }); })
        .then(s => {
          st.textContent = "✓ Сохранено" + (liste.length > 1 ? " " + n + " из " + liste.length : "") + " · " + groesseText(s.bytes);
          return einzeln(i + 1);
        });
    };
    ctx.knopf.disabled = true; ctx.galerie.disabled = true;
    einzeln(0).catch(e => {
      console.error("Fotos:", e);
      st.textContent = fehlerText(e);
      st.className = "fo-status fo-fehler";
    }).then(() => { ctx.knopf.disabled = false; ctx.galerie.disabled = false; });
  }

  /** Block an die Karte einer Teilaufgabe hängen (aus gen/azubi.js teilKarte) */
  function anhaengen(karte, m, t) {
    if (!hatDom || !karte || !m || !t || !m.id || !t.id) return null;
    if (!zeigenFuer(bereichVon(m))) return null;
    karte.querySelectorAll(".fo-block, .fo-vergleich").forEach(e => e.remove());

    const block = el("div", "fo-block");
    block.dataset.fo = datenKey(m.id, t.id);
    const zeile = el("div", "fo-zeile");
    const knopf = el("button", "btn fo-knopf", "📷 Фото ответа"); knopf.type = "button";
    const galerie = el("button", "btn ghost fo-galerie", "🖼 Из галереи"); galerie.type = "button";
    const kamera = el("input", "fo-datei"); kamera.type = "file"; kamera.accept = "image/*";
    kamera.setAttribute("capture", "environment"); kamera.tabIndex = -1; kamera.setAttribute("aria-hidden", "true");
    const auswahl = el("input", "fo-datei"); auswahl.type = "file"; auswahl.accept = "image/*"; auswahl.multiple = true;
    auswahl.tabIndex = -1; auswahl.setAttribute("aria-hidden", "true");
    zeile.append(knopf, galerie, kamera, auswahl);
    block.appendChild(zeile);
    const status = el("div", "fo-status"); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    block.appendChild(status);
    const mini = el("div", "fo-mini"); mini.hidden = true;
    block.appendChild(mini);
    block.appendChild(el("p", "fo-hinweis", HINWEIS));

    const ctx = { karte, m, t, block, knopf, galerie, status, mini, vergleich: null };
    block._fo = ctx;
    knopf.onclick = () => kamera.click();
    galerie.onclick = () => auswahl.click();
    const geaendertDatei = inp => () => { const d = Array.from(inp.files || []); inp.value = ""; dateienVerarbeiten(ctx, d); };
    kamera.addEventListener("change", geaendertDatei(kamera));
    auswahl.addEventListener("change", geaendertDatei(auswahl));

    /* unter das Antwortfeld */
    const eingabe = karte.querySelector(".az-eingabe");
    if (eingabe && eingabe.parentNode) eingabe.parentNode.insertBefore(block, eingabe.nextSibling);
    else karte.appendChild(block);

    /* neben die Musterlösung (wenn sie offen ist) */
    const loes = karte.querySelector(".az-loesung");
    if (loes) {
      const v = el("div", "fo-vergleich"); v.hidden = true;
      let ref = loes.querySelector(":scope > .az-text");
      while (ref && ref.nextElementSibling && ref.nextElementSibling.classList.contains("vl-knopf")) ref = ref.nextElementSibling;
      if (ref) ref.parentNode.insertBefore(v, ref.nextSibling); else loes.appendChild(v);
      ctx.vergleich = v;
    }
    aktualisieren(ctx);
    return block;
  }

  const api = {
    anhaengen, speichern, liste, loeschen, verkleinern, dauerhaft,
    schluessel, praefix, grenzen, zerlegen, zeigenFuer, masse, naechsteQualitaet, groesseText, zeitText, bereichVon,
    DB_NAME, STORE, MAX_SEITE, QUALITAET, HINWEIS
  };
  root.GENFOTOS = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
