"use strict";
const assert = require("assert");
const W = require("../gen/lernweg.js");
const units = [{id:"lesen",topic:"sprache"},{id:"code",topic:"algo"},{id:"sql",topic:"sql"}];
assert.strictEqual(W.next(units, {done:{}}, []).id, "lesen", "begin with prerequisites");
assert.strictEqual(W.next(units, {done:{lesen:123}}, []).id, "code", "resume first unfinished unit");
assert.strictEqual(W.next(units, {done:{lesen:123,code:124,sql:125}}, [{topic:"algo",weak:true}]).id, "code", "completed route returns to observed difficulty");
assert.strictEqual(W.next([], {done:{}}, []), null, "empty material does not crash");
assert.strictEqual(W.next(units, {done:{lesen:1,code:1,sql:1}}, []), null, "no endless claim of new lessons");
assert.strictEqual(W.next(units, {done:{lesen:1,code:1,sql:1},checks:{code:{correct:0,max:2}}}, []).id, "code", "self-reported gaps remain actionable");
const data=require("../gen/lernweg-daten.js");
const topics=require("../gen/lernen-daten.js");
const praxis=require("../gen/praxis-daten.js");
data.forEach(u=>{
  if(u.theory)assert(topics.some(t=>t.id===u.theory),"missing theory route: "+u.theory);
  if(u.practice)assert(praxis.some(t=>t.id===u.practice),"missing practice route: "+u.practice);
});
assert.strictEqual(W.sessionMinutes({minutes:10}), 10);
assert.strictEqual(W.sessionMinutes({minutes:-30}), 20, "invalid imported preference is safe");
assert.strictEqual(W.sessionMinutes({minutes:9999}), 20);
const fs=require("fs"),path=require("path"),vm=require("vm");
const memory={},events=[];let now=1000,failRecord=false,failStorage=false;
function loadCourse() {
  const root={Date:class extends Date{static now(){return now;}},console,
    AP2_LERNWEG:data,
    localStorage:{getItem:k=>memory[k]||null,setItem:(k,v)=>{if(failStorage)throw new Error("Quota");memory[k]=v;}},
    GENLERNSTAND:{summary:()=>[],record:e=>{events.push(e);return{ok:!failRecord};}}};
  root.globalThis=root;vm.createContext(root);
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../gen/lernweg.js"),"utf8"),root);
  return root.GENLERNWEG;
}
let C=loadCourse();
assert.strictEqual(typeof C.beginnen,"function","Lernweg braucht gespeicherte Bearbeitungssitzungen");
C.beginnen("lesen","hilfe");
C.hilfe("lesen");
C.entwurf("lesen","Mein ursprünglicher eigener Versuch");
now=2000;C=loadCourse();
C.beginnen("lesen","pruefung");
assert.strictEqual(C.stand().sessions.lesen.assisted,true,"Navigation/Moduswechsel darf Hilfe nicht vergessen");
const submission=C.abgeben("lesen");
assert.strictEqual(submission.answer,"Mein ursprünglicher eigener Versuch");
assert.throws(()=>C.entwurf("lesen","Aus der Musterlösung kopiert"),/сдан/);
C.rubrik("lesen",[0,2]);
C=loadCourse();
assert.deepStrictEqual(Array.from(C.stand().sessions.lesen.submission.selected),[0,2],"Teilweise Selbstprüfung überlebt Reload");
failRecord=true;
const first=C.abschliessen("lesen");
assert.strictEqual(first.correct,2);assert.strictEqual(first.max,3);
assert.strictEqual(first.assisted,true);assert.strictEqual(first.recorded,false);
assert.strictEqual(C.stand().checks.lesen.answer,"Mein ursprünglicher eigener Versuch");
assert(C.stand().done.lesen);
first.answer="manipuliert";events[0].answers="manipuliert";
assert.strictEqual(C.stand().history[0].answer,"Mein ursprünglicher eigener Versuch");
failRecord=false;C=loadCourse();
const retry=C.abschliessen("lesen");
assert.strictEqual(retry.recorded,true);
assert.strictEqual(events[0].id,events[1].id,"Retry benötigt dieselbe Ereignis-ID");
assert.strictEqual(events[1].answers,"Mein ursprünglicher eigener Versuch");
assert.strictEqual(C.stand().history.length,1);
C.abschliessen("lesen");assert.strictEqual(events.length,2,"Doppelklick erzeugt keine neue Bewertung");
now=3000;C.beginnen("lesen","pruefung",true);C.entwurf("lesen","Zweite unabhängige Antwort");C.abgeben("lesen");C.rubrik("lesen",[1]);
const second=C.abschliessen("lesen");assert.strictEqual(second.assisted,false);
assert.strictEqual(C.stand().history.length,2,"Neuer Durchgang behält den alten vollständigen Versuch");
assert.strictEqual(C.stand().history[0].answer,"Mein ursprünglicher eigener Versuch");
assert.strictEqual(C.stand().checks.lesen.answer,"Zweite unabhängige Antwort");

// Opening feedback after submission does not change the already frozen support.
C.beginnen("variablen","pruefung");C.entwurf("variablen","a=6 b=7");C.abgeben("variablen");C.hilfe("variablen");C.rubrik("variablen",[0]);
assert.strictEqual(C.abschliessen("variablen").assisted,false);
assert.throws(()=>C.rubrik("variablen",[99]),/критери/);

// Old drafts/checks remain usable and are archived before replacement.
memory["ap2:lernweg"]=JSON.stringify({done:{lesen:10},drafts:{lesen:"alter Entwurf"},checks:{lesen:{time:10,answer:"alte Bewertung",correct:1,max:3,assisted:true}},profile:{mode:"hilfe"}});
C=loadCourse();assert.strictEqual(C.beginnen("lesen","hilfe").answer,"alter Entwurf");
C.entwurf("lesen","neu");C.abgeben("lesen");C.rubrik("lesen",[]);C.abschliessen("lesen");
assert(C.stand().history.some(x=>x.answer==="alte Bewertung"&&x.legacy));
const stored=memory["ap2:lernweg"];
failStorage=true;
assert.throws(()=>C.beginnen("variablen","pruefung"),/сохранить/);
assert.strictEqual(memory["ap2:lernweg"],stored);
failStorage=false;
memory["ap2:lernweg"]="{kaputt";C=loadCourse();
assert(C.fehler());assert.throws(()=>C.beginnen("lesen","pruefung"),/без изменения/);
assert.strictEqual(memory["ap2:lernweg"],"{kaputt","Korruptes Original darf nicht überschrieben werden");

// Занятие можно отметить разобранным без самопроверки; маршрут идёт дальше.
delete memory["ap2:lernweg"];now=5000;C=loadCourse();
assert.strictEqual(C.statusText("lesen"),"Ещё не разобрано");
assert.strictEqual(C.markieren("lesen"),5000);
assert.strictEqual(C.stand().done.lesen,5000);
assert.match(C.statusText("lesen"),/^✓ Разобрано .* без самопроверки$/);
assert.strictEqual(C.next(data,C.stand(),[]).id,"variablen","отмеченное занятие больше не предлагается первым");
assert.strictEqual(C.empfehlung().titel,data[1].title,"главная ведёт к следующему занятию");
assert.strictEqual(C.empfehlung().zusatz.titel,"Что тренировать и пробные экзамены");
now=6000;assert.strictEqual(C.markieren("lesen"),5000,"повторная отметка не меняет дату");
C=loadCourse();assert.strictEqual(C.stand().done.lesen,5000,"отметка переживает перезагрузку");
assert.throws(()=>C.markieren("gibt-es-nicht"),/Неизвестное/);
C.beginnen("variablen","pruefung");C.entwurf("variablen","a=6 b=7");C.abgeben("variablen");C.rubrik("variablen",[0]);C.abschliessen("variablen");
assert.match(C.statusText("variablen"),/самопроверка 1 из 2/);

// Данные «Что тренировать»: все ссылки ведут на существующие занятия, практику, квизы и Kurzfragen.
const training=data.training;
assert(Array.isArray(training)&&training.length>=10,"есть частые темы экзаменов");
global.window=global;require("../gen/satzbausteine.js");require("../gen/satzbausteine2.js");require("../gen/satzbausteine-ap2.js");
const satzThemen=new Set((global.SATZ_POOL||[]).map(k=>k.thema));
training.forEach(t=>{
  assert(["GA1","GA2"].includes(t.bereich),t.id);
  assert(t.pruef>=1&&t.pruef<=10&&t.punkte>0&&t.punkte<=100,t.id);
  (t.units||[]).forEach(id=>assert(data.some(u=>u.id===id),"unbekanntes Lernweg-Kapitel "+id));
  if(t.praxis)assert(praxis.some(p=>p.id===t.praxis),"unbekannte Praxis "+t.praxis);
  if(t.quiz)assert(topics.some(q=>q.id===t.quiz),"unbekanntes Quiz-Thema "+t.quiz);
  if(t.satz)assert(satzThemen.has(t.satz),"keine Kurzfragen zum Thema "+t.satz);
  assert(t.units.length||t.praxis||t.quiz||t.satz||t.trainer||t.hinweis,"тема без действия "+t.id);
});
// Самая выгодная тема: сначала ошибки, затем не разобранное частое занятие.
assert.strictEqual(C.startThema(training,[]).id,"ga1-uml","без данных — частая тема с неразобранным занятием");
assert.strictEqual(C.startThema(training,[{topic:"sql",weak:2,selfWeak:0,total:3}]).id,"ga2-sql","ошибки важнее порядка");

// Порядок пробных экзаменов: начатое → новые с решениями ZPA → слабые.
assert.strictEqual(C.quelle({intro:"<div>Lösungen: Lösungshinweise der ZPA (Abschlussprüfung Winter 2025/26).</div>"}).r,0);
assert.strictEqual(C.quelle({intro:"<div>Lösungen: u-form Lösungserläuterungen Winter 2021/22 (keine offiziellen ZPA-Lösungshinweise).</div>"}).r,1);
assert.strictEqual(C.quelle({intro:"<div>Lösungen: eigene Musterlösung (keine offiziellen ZPA-Lösungshinweise).</div>"}).r,2);
assert.strictEqual(C.quelle({intro:"<div>Lösungen: inoffizieller Lösungsvorschlag (keine ZPA-Lösungshinweise).</div>"}).r,2);
assert.strictEqual(C.quelle({intro:"<div>Lösungen: offizielle Lösungen der IHK.</div>"}).text,"официальные решения");
assert.strictEqual(C.quelle({intro:"<div>Lösungen: inoffizielle Lösungen.</div>"}).r,2);
assert.strictEqual(C.quelle({intro:"<div>Lösungen: inoffizieller Lösungsvorschlag (keine ZPA-Lösungshinweise), fachlich nachgeprüft; Lücken mit eigener Musterlösung ergänzt.</div>"}).text,"неофициальное решение");
const bl=[
  {id:"ga2-2026-s",bereich:"ga2",g:"neu",r:2},{id:"ga2-2025-w",bereich:"ga2",g:"neu",r:0},{id:"ga2-2025-s",bereich:"ga2",g:"neu",r:0},
  {id:"ga1-2021-w",bereich:"ga1",g:"neu",r:1},{id:"ga1-2024-w",bereich:"ga1",g:"gemacht",pr:80,r:0},{id:"ga1-2024-s",bereich:"ga1",g:"neu",r:0},
  {id:"wiso-2026-s",bereich:"wiso",g:"schwach",pr:40,r:0},{id:"wiso-2025-s",bereich:"wiso",g:"neu",r:0},{id:"wiso-2023-w",bereich:"wiso",g:"weiter",r:0}];
const plan=C.pruefungsPlan(bl);
assert.strictEqual(JSON.stringify(plan.vorschlag.map(v=>v.art+":"+v.id)),JSON.stringify(["weiter:wiso-2023-w","neu:ga2-2025-w","neu:ga1-2024-s","neu:wiso-2025-s","schwach:wiso-2026-s"]));
assert.strictEqual(JSON.stringify(plan.zaehl),JSON.stringify({ga1:{fertig:1,alle:3},ga2:{fertig:0,alle:3},wiso:{fertig:1,alle:3}}));
assert.strictEqual(C.pruefungsPlan([]).vorschlag.length,0);
// Задания из экзаменов по теме: ссылки корректны и (если пакет есть) ведут на существующие части.
training.forEach(t=>{
  assert(!t.trainer||["sql","code","normal"].includes(t.trainer),"trainer "+t.trainer);
  t.aufgaben.forEach(([mid,nr,p,teile])=>{
    assert(/^ga[12]-\d{4}-[sw]$/.test(mid)&&mid.slice(0,3)===t.bereich.toLowerCase(),t.id+" "+mid);
    assert(p>0&&p<=50&&teile.length>0&&teile.every(x=>x.startsWith(mid+"-"+nr)),t.id+" "+mid+" "+nr);
  });
});
assert(training.every(t=>t.aufgaben.length>0),"у каждой частой темы есть задания из экзаменов");
const paketDatei=path.join(__dirname,"../privat/ap2-paket.js");
if(fs.existsSync(paketDatei)){
  require(paketDatei);const ids=new Set();global.IHK_AZUBI.module.forEach(m=>(m.aufgaben||[]).forEach(a=>(a.teile||[]).forEach(x=>ids.add(x.id))));
  training.forEach(t=>t.aufgaben.forEach(([mid,nr,p,teile])=>teile.forEach(x=>assert(ids.has(x),"нет части "+x))));
}
const st=C.aufgabeStand({a:{"x-1a":"Antwort","x-1b":{"0":" "}},p:{"x-1a":3}},["x-1a","x-1b","x-1c"]);
assert.strictEqual(JSON.stringify(st),JSON.stringify({beantwortet:1,bewertet:1,gesamt:3}));
console.log("Lernweg recommendation and recovery verified");

/* «Что тренировать»: Netzplan/Gantt bei Projektmanagement (Knöpfe des Arbeitsblatts) */
{
  const fs2 = require("fs"), path2 = require("path");
  const html2 = fs2.readFileSync(path2.join(__dirname, "..", "index.html"), "utf8");
  delete require.cache[require.resolve("../gen/lernweg-daten.js")];
  const tr = require("../gen/lernweg-daten.js").training.find(t => t.id === "ga1-pm");
  assert.ok(tr.diagramm && tr.diagramm.length === 2, "ga1-pm hat Netzplan und Gantt");
  tr.diagramm.forEach(([id]) => assert.ok(html2.includes('id="' + id + '"'), "Knopf " + id + " in index.html"));
}
