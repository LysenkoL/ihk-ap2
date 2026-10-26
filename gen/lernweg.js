"use strict";
(function(root) {
  const SK="ap2:lernweg", hasDom=typeof document!=="undefined";
  const clone=x=>JSON.parse(JSON.stringify(x));
  let readError="",saveError="";
  const units=()=>root.AP2_LERNWEG||[];
  function next(list,state,observed) {
    const done=(state||{}).done||{};
    const weak=list.find(u=>(observed||[]).some(s=>s.topic===u.topic&&(s.weak||s.selfWeak))||((state&&state.checks&&state.checks[u.id])&&state.checks[u.id].correct<state.checks[u.id].max));
    if(weak) return weak;
    return list.find(u=>!done[u.id])||null;
  }
  function sessionMinutes(profile) { const n=Number((profile||{}).minutes); return [10,20,40].includes(n)?n:20; }
  function load() {
    const empty=()=>({done:{},drafts:{},checks:{},sessions:{},history:[],sessionConflicts:[],profile:{minutes:20,days:4,level:"basis",mode:"erklaert"}});
    try {
      const raw=root.localStorage&&root.localStorage.getItem(SK);
      if(!raw)return empty();
      const x=JSON.parse(raw);
      if(!x||typeof x!=="object"||Array.isArray(x))throw new Error("format");
      for(const k of ["done","drafts","checks","sessions","profile"])if(x[k]!=null&&(typeof x[k]!=="object"||Array.isArray(x[k])))throw new Error(k);
      for(const k of ["history","sessionConflicts"])if(x[k]!=null&&!Array.isArray(x[k]))throw new Error(k);
      const result=Object.assign(empty(),x);
      for(const k of ["done","drafts","checks","sessions"])result[k]=result[k]||{};
      result.profile=Object.assign(empty().profile,x.profile||{});result.history=result.history||[];result.sessionConflicts=result.sessionConflicts||[];
      // Keep old self-assessments before their latest-check slot is reused.
      Object.entries(result.checks).forEach(([unit,entry])=>{
        if(!entry||typeof entry!=="object")return;
        const id=entry.id||"lernweg:"+unit+":"+entry.time;
        if(!result.history.some(h=>h.id===id))result.history.push(Object.assign({unit},clone(entry),{id,legacy:true,recorded:true}));
      });
      return result;
    } catch(e) {readError="Не удалось прочитать учебный маршрут. Исходные данные оставлены без изменения. Сохрани резервную копию перед восстановлением.";return empty();}
  }
  let state=load(), view=null;
  const observed=()=>root.GENLERNSTAND?root.GENLERNSTAND.summary():[];
  const $=id=>document.getElementById(id);
  const el=(t,c,s)=>{const n=document.createElement(t);if(c)n.className=c;if(s!=null)n.textContent=s;return n;};
  function button(label,fn,primary) { const b=el("button","btn"+(primary?" primary":""),label); b.type="button"; b.onclick=fn; return b; }
  function save(patch) {
    const value=Object.assign({},state,patch,{updated:Date.now()});
    try {if(readError)throw new Error(readError);root.localStorage.setItem(SK,JSON.stringify(value));state=value;saveError="";return true;}
    catch(e) {saveError=readError||"Не удалось сохранить. Текст остаётся на экране. Скопируй его перед закрытием и сделай резервную копию прогресса.";
      if(hasDom){ const alert=$("lwSave")||el("p","lw-alert");alert.id="lwSave";alert.setAttribute("role","alert");alert.textContent=saveError;if(!alert.parentNode)($("lernwegInhalt")||document.body).appendChild(alert);}return false; }
  }
  function persist(patch){if(!save(patch))throw new Error(saveError);}
  function unitVon(id){const u=units().find(x=>x.id===id);if(!u)throw new Error("Неизвестное занятие.");return u;}
  function sessionVon(id){const s=state.sessions[id];if(!s)throw new Error("Сначала открой занятие.");return s;}
  function sessionSave(id,update){const sessions=clone(state.sessions);update(sessions[id]);sessions[id].updatedAt=Date.now();persist({sessions});return clone(sessions[id]);}
  function beginnen(id,mode,neu){
    unitVon(id);mode=mode||state.profile.mode||"erklaert";
    if(!["erklaert","hilfe","pruefung"].includes(mode))throw new Error("Неизвестный режим.");
    const old=state.sessions[id];
    if(old&&!neu){
      if(!old.submission&&mode==="erklaert"&&!old.assisted)return sessionSave(id,s=>{s.assisted=true;s.mode=mode;});
      return clone(old);
    }
    const now=Date.now(),s={id:"lernweg:"+id+":"+now+"-"+Math.random().toString(36).slice(2,9),mode,createdAt:now,updatedAt:now,
      assisted:mode==="erklaert",answer:neu?"":String(state.drafts[id]||""),submission:null};
    const sessions=Object.assign({},state.sessions,{[id]:s}),conflicts=clone(state.sessionConflicts);
    if(old&&!state.history.some(e=>e.id===old.id))conflicts.push(Object.assign({unit:id},clone(old)));
    persist({sessions,sessionConflicts:conflicts,drafts:Object.assign({},state.drafts,{[id]:s.answer})});return clone(s);
  }
  function entwurf(id,answer){
    const s=sessionVon(id);if(s.submission)throw new Error("Ответ уже сдан. Для изменений начни новую попытку.");
    const sessions=clone(state.sessions);sessions[id].answer=String(answer);sessions[id].updatedAt=Date.now();
    persist({sessions,drafts:Object.assign({},state.drafts,{[id]:String(answer)})});return clone(sessions[id]);
  }
  function hilfe(id){const s=sessionVon(id);if(s.submission||s.assisted)return clone(s);return sessionSave(id,x=>{x.assisted=true;});}
  function abgeben(id){
    const s=sessionVon(id),u=unitVon(id);if(s.submission)return clone(s.submission);
    if(!s.answer.trim())throw new Error("Сначала запиши свой ответ или конкретно то, что не удалось понять.");
    return sessionSave(id,x=>{x.submission={answer:x.answer,assisted:x.assisted,time:Date.now(),selected:[],
      snapshot:{title:u.title,topic:u.topic,control:u.control,answer:u.answer,rubric:clone(u.rubric)}};}).submission;
  }
  function rubrik(id,selected){
    const s=sessionVon(id),sub=s.submission;if(!sub)throw new Error("Сначала сдай ответ.");
    const ids=Array.from(new Set(selected||[]));if(ids.some(i=>!Number.isInteger(i)||i<0||i>=sub.snapshot.rubric.length))throw new Error("Неизвестный критерий самопроверки.");
    if(state.history.some(h=>h.id===s.id))throw new Error("Самопроверка уже сохранена. Начни новую попытку.");
    return sessionSave(id,x=>{x.submission.selected=ids;});
  }
  function beobachtung(entry){
    if(entry.recorded||entry.legacy)return clone(entry);
    if(root.GENLERNSTAND&&typeof root.GENLERNSTAND.record==="function"){
      try {
        const r=root.GENLERNSTAND.record({id:entry.id,t:entry.time,topic:entry.snapshot.topic,source:"lernweg",task:entry.unit,
          correct:entry.correct,max:entry.max,support:entry.assisted?"hilfe":"selbst",kind:"selbst",answers:entry.answer});
        if(r&&r.ok){
          const history=clone(state.history),e=history.find(x=>x.id===entry.id);e.recorded=true;
          const checks=clone(state.checks);if(checks[entry.unit]&&checks[entry.unit].id===entry.id)checks[entry.unit].recorded=true;
          if(save({history,checks}))return clone(e);
        }
      }catch(e){/* Full answer remains in local history; retry uses the same ID. */}
    }
    return clone(entry);
  }
  function abschliessen(id){
    const s=sessionVon(id),sub=s.submission;if(!sub)throw new Error("Сначала сдай ответ.");
    const old=state.history.find(h=>h.id===s.id);if(old)return beobachtung(old);
    const entry={id:s.id,unit:id,time:sub.time,correct:sub.selected.length,max:sub.snapshot.rubric.length,
      answer:sub.answer,assisted:sub.assisted,selected:clone(sub.selected),snapshot:clone(sub.snapshot),recorded:false};
    persist({history:state.history.concat(entry),checks:Object.assign({},state.checks,{[id]:entry}),done:Object.assign({},state.done,{[id]:sub.time})});
    return beobachtung(entry);
  }
  function erneut(id){const e=state.history.find(x=>x.id===id);if(!e)throw new Error("Попытка не найдена.");return beobachtung(e);}
  /* Отметить занятие разобранным без самопроверки (только прочитано). */
  function markieren(id){unitVon(id);if(state.done[id])return state.done[id];const t=Date.now();persist({done:Object.assign({},state.done,{[id]:t})});return t;}
  const datum=t=>new Date(t).toLocaleDateString("ru");
  function statusText(id){
    const d=state.done[id];if(!d)return "Ещё не разобрано";
    const c=state.checks[id];
    return "✓ Разобрано "+datum(d)+(c&&c.max?" · самопроверка "+c.correct+" из "+c.max:" · отмечено без самопроверки");
  }
  const zumTraining={titel:"Что тренировать и пробные экзамены",tun:()=>oeffnen(null,false,"lwTrain")};
  function recommend(options) {
    if (!(options && options.ohneWieder) && root.GENWIEDER && typeof root.GENWIEDER.faellig === "function") {
      const f = root.GENWIEDER.faellig();
      if (f && f.length) {
        const item = f[0];
        return {
          titel: "Повторить ошибки: " + (item.titel || "разобранная ошибка"),
          warum: "Сегодня назначено повторение ошибок, чтобы закрепить материал.",
          minuten: 10,
          knopf: "Повторить",
          tun: () => root.GENWIEDER.starten(f.slice(0, 3)),
          ziel: { source: "wiederholung", task: item.id },
          zusatz: zumTraining
        };
      }
    }
    const u=next(units(),state,observed());
    if(!u) return {titel:"Повтори на новом примере",warum:"Вводный маршрут пройден. Выбери самостоятельную задачу или вернись к трудной теме.",minuten:sessionMinutes(state.profile),knopf:"Практика",tun:()=>root.GENPRAXIS?root.GENPRAXIS.oeffnen():oeffnen(),ziel:{source:"praxis"},zusatz:zumTraining};
    return {titel:u.title,warum:u.why,minuten:sessionMinutes(state.profile),knopf:state.done[u.id]?"Повторить тему":"Продолжить занятие",tun:()=>oeffnen(u.id),ziel:{source:"lernweg",task:u.id},zusatz:zumTraining};
  }
  function zielOeffnen(ziel) {
    if (!ziel) return;
    if (ziel.source === "wiederholung" && root.GENWIEDER && root.GENWIEDER.starten) return root.GENWIEDER.starten();
    if (ziel.source === "lernweg") return oeffnen(ziel.task);
    if (ziel.source === "praxis" && root.GENPRAXIS) return root.GENPRAXIS.oeffnen(ziel.task);
    if (ziel.source === "code" && root.GENCODE) return root.GENCODE.oeffnen(ziel.task);
    if (ziel.source === "normal" && root.GENNORMAL) return root.GENNORMAL.oeffnen(ziel.task);
    if (ziel.source === "operatoren" && root.GENOPUEB) return root.GENOPUEB.oeffnen(ziel.task);
    return oeffnen();
  }
  /* ---- «Что тренировать»: частые темы экзаменов, пробные бланки, повтор ---- */
  const balle=n=>{const a=n%10,b=n%100;return a===1&&b!==11?"балл":a>=2&&a<=4&&(b<12||b>14)?"балла":"баллов";};
  const terminWert=id=>{const m=/-(\d{4})-([sw])$/.exec(id||"");return m?(+m[1])*2+(m[2]==="w"?1:0):0;};
  function quelle(m){
    const t=String((m&&m.intro)||"").replace(/<[^>]+>/g," "),x=/Lösungen:\s*([^.]*)/.exec(t),s=x?x[1]:"";
    if(/inoffiziell/i.test(s))return {r:2,text:"неофициальное решение"};
    if(/eigene/i.test(s))return {r:2,text:"собственное решение"};
    if(/u-form/i.test(s))return {r:1,text:"решения u-form"};
    if(/offiziell/i.test(s))return {r:0,text:"официальные решения"};
    return {r:0,text:"решения ZPA"};
  }
  /* eintraege: [{id, bereich, g: weiter|neu|schwach|gemacht, pr, r}] — r: 0 ZPA, 1 u-form, 2 своё. */
  function pruefungsPlan(eintraege){
    const order=(a,b)=>a.r-b.r||terminWert(b.id)-terminWert(a.id);
    const vorschlag=[],add=(e,art)=>{if(e&&!vorschlag.some(v=>v.id===e.id))vorschlag.push(Object.assign({art},e));};
    eintraege.filter(e=>e.g==="weiter").sort(order).slice(0,2).forEach(e=>add(e,"weiter"));
    ["ga2","ga1","wiso"].forEach(b=>add(eintraege.filter(e=>e.bereich===b&&e.g==="neu").sort(order)[0],"neu"));
    eintraege.filter(e=>e.g==="schwach").sort((a,b)=>(a.pr||0)-(b.pr||0)).slice(0,2).forEach(e=>add(e,"schwach"));
    const zaehl={};["ga1","ga2","wiso"].forEach(b=>{const l=eintraege.filter(e=>e.bereich===b);zaehl[b]={fertig:l.filter(e=>e.g==="gemacht"||e.g==="schwach").length,alle:l.length};});
    return {vorschlag,zaehl};
  }
  function themaInfo(t,obs){
    const offen=(t.units||[]).filter(id=>!state.done[id]);
    const o=(obs||[]).filter(x=>(t.lern||[]).includes(x.topic));
    return {offen,fehler:o.reduce((s,x)=>s+(x.weak||0)+(x.selfWeak||0),0),versuche:o.reduce((s,x)=>s+(x.total||0),0)};
  }
  /* Самая выгодная тема сейчас: частая тема, где занятие не разобрано или есть ошибки. */
  function startThema(liste,obs){
    const l=(liste||[]).slice().sort((a,b)=>b.pruef-a.pruef||b.punkte-a.punkte);
    return l.find(t=>{const i=themaInfo(t,obs);return i.fehler>0;})||l.find(t=>themaInfo(t,obs).offen.length)||l.find(t=>!themaInfo(t,obs).versuche&&(t.quiz||t.praxis||t.trainer))||null;
  }
  function themaAktionen(t,i){
    const a=[];
    if(i.offen.length)a.push(["Занятие",()=>oeffnen(i.offen[0])]);
    if((t.aufgaben||[]).length&&root.GENAZUBI)a.push(["Из экзаменов ("+t.aufgaben.length+")",()=>oeffnen("@"+t.id)]);
    if(t.trainer==="sql"&&root.GENSQL)a.push(["SQL-тренажёр",()=>root.GENSQL.oeffnen()]);
    if(t.trainer==="code"&&root.GENCODE)a.push(["Код с проверкой",()=>root.GENCODE.oeffnen()]);
    if(t.trace&&root.GENTRACE)a.push(["Schreibtischtest",()=>root.GENTRACE.oeffnen()]);
    if(t.engl&&root.GENENGL)a.push(["Английский текст",()=>root.GENENGL.oeffnen()]);
    if(t.trainer==="normal"&&root.GENNORMAL)a.push(["Нормализация",()=>root.GENNORMAL.oeffnen()]);
    if(t.praxis&&root.GENPRAXIS)a.push(["Практика",()=>root.GENPRAXIS.oeffnen(t.praxis)]);
    if(t.quiz&&root.GENLERNEN)a.push(["Квиз",()=>root.GENLERNEN.oeffnen(t.quiz)]);
    if(t.satz&&root.GENSATZ)a.push(["Вопросы",()=>root.GENSATZ.starten(null,{themen:[t.satz]})]);
    if(!i.offen.length&&(t.units||[]).length)a.push(["Повторить занятие",()=>oeffnen(t.units[0])]);
    return a.slice(0,5);
  }
  /* Время на задание: как на экзамене — 90 минут на 100 баллов. */
  const minutenFuer=(p,bereich)=>Math.round(p*(bereich==="WiSo"?0.6:0.9));
  const minutenWort=n=>{const a=n%10,b=n%100;return a===1&&b!==11?"минута":a>=2&&a<=4&&(b<12||b>14)?"минуты":"минут";};
  /* Состояние задания экзамена по частям: [ответов, оценено, всего]. */
  function aufgabeStand(z,teile){
    const a=(z&&z.a)||{},p=(z&&z.p)||{},auto=(z&&z.auto)||{};
    const hat=id=>{const v=a[id];return v!=null&&(typeof v!=="object"||Object.values(v).some(x=>String(x==null?"":x).trim()));};
    return {beantwortet:teile.filter(hat).length,bewertet:teile.filter(id=>p[id]!=null||auto[id]!=null).length,gesamt:teile.length};
  }
  function aufgabenListe(w,tid){
    const t=(root.AP2_TRAINING||[]).find(x=>x.id===tid);
    if(!t){overview(w);return;}
    const c=card(w,t.name+" · "+t.bereich+": задания из экзаменов");
    const de=el("p","lw-muted",t.de);de.lang="de";c.appendChild(de);
    c.appendChild(el("p",null,"Каждое задание — часть настоящего экзамена. Решай в режиме «Übung»: сначала сама, потом «Lösung zeigen» и поставь себе баллы. Время как на экзамене: "+(t.bereich==="WiSo"?"0,6 минуты на балл (60 минут на 100 баллов).":"0,9 минуты на балл.")));
    if(t.themen&&t.themen.length){const th=el("p","lw-muted","Темы в бланках: "+t.themen.join(", "));th.lang="de";c.appendChild(th);}
    c.appendChild(button("← Что тренировать",()=>oeffnen(null,false,"lwTrain")));
    const liste=el("div");c.appendChild(liste);
    const A=root.GENAZUBI;
    if(!A||!A.laden){liste.appendChild(el("p","lw-muted","Плеер бланков недоступен."));return;}
    liste.appendChild(el("p","lw-muted","Загружаю бланки…"));
    A.laden().then(()=>{
      liste.replaceChildren();
      const vorhanden=t.aufgaben.filter(([mid])=>A.modul&&A.modul(mid)).sort((x,y)=>quelle(A.modul(x[0])).r-quelle(A.modul(y[0])).r||terminWert(y[0])-terminWert(x[0]));
      if(!vorhanden.length){liste.appendChild(el("p",null,"На этом устройстве нет пакета оригинальных бланков. Открой «Meine Prüfungsbögen» → «Paket laden»."));liste.appendChild(button("Открыть бланки",()=>A.oeffnen(null)));return;}
      let offen=0;
      vorhanden.forEach(([mid,nr,punkte,teile])=>{
        const m=A.modul(mid),auf=(m.aufgaben||[]).find(x=>String(x.nr)===nr)||{},st=aufgabeStand(A.zustand(mid),teile);
        const fertig=st.bewertet===st.gesamt;if(!fertig)offen++;
        const row=el("div","lw-result"+(fertig?" lw-fertig":""));
        row.appendChild(el("b",null,(m.kurz||mid)+" · Aufgabe "+nr));
        if(auf.titel){const ti=el("span","lw-muted",auf.titel);ti.lang="de";row.appendChild(ti);}
        const pz=Math.round(punkte*10)/10,mn=Math.max(1,minutenFuer(punkte,t.bereich));row.appendChild(el("span","lw-muted",String(pz).replace(".",",")+" "+balle(Math.round(punkte))+" · ≈ "+mn+" "+minutenWort(mn)+" · "+quelle(m).text));
        row.appendChild(el("p",null,fertig?"✓ оценено: все "+st.gesamt+" "+teileWort(st.gesamt):st.beantwortet||st.bewertet?"начато: ответ в "+st.beantwortet+" из "+st.gesamt+", оценено "+st.bewertet+" из "+st.gesamt:"ещё не решала"));
        row.appendChild(button(fertig?"Повторить":st.beantwortet?"Продолжить":"Решать",()=>A.oeffnen(mid,{ziel:teile[0]}),!fertig&&offen===1));
        liste.appendChild(row);
      });
      liste.insertBefore(el("p",null,"Не решено до конца: "+offen+" из "+vorhanden.length+"."),liste.firstChild);
    }).catch(()=>{liste.replaceChildren(el("p","lw-muted","Бланки не загрузились. Открой «Meine Prüfungsbögen»."));});
  }
  const teileWort=n=>{const a=n%10,b=n%100;return a===1&&b!==11?"часть":a>=2&&a<=4&&(b<12||b>14)?"части":"частей";};
  function screen() {
    let s=$("scLernweg");if(s)return s;
    s=el("div","seite lw-page");s.id="scLernweg";s.hidden=true;
    const w=el("div","lw-wrap");w.id="lernwegInhalt";s.appendChild(w);
    $("scStart").parentNode.insertBefore(s,$("scStart").nextSibling);return s;
  }
  function oeffnen(id,fromHistory,anker) {
    view=units().some(u=>u.id===id)||(typeof id==="string"&&id[0]==="@")?id:null;
    const s=screen();
    document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n=>n.hidden=n!==s);
    ["fuss","mwUhr","btnUhr","mwPunkte","schalterKatalog"].forEach(k=>{if($(k))$(k).hidden=true;});
    if($("kopfTitel"))$("kopfTitel").hidden=false;
    if($("kEyebrow"))$("kEyebrow").textContent="AP2 · личная подготовка";
    if($("kTitel"))$("kTitel").textContent=view&&view[0]!=="@"?units().find(u=>u.id===view).title:view?"Задания из экзаменов":"Мой учебный маршрут";
    if(!fromHistory){try {if(!history.state||!history.state.ihk)history.replaceState({ihk:1,seite:"scStart"},"");history.pushState({ihk:1,seite:"scLernweg",lw:view},"");}catch(e){}}
    const w=$("lernwegInhalt");w.replaceChildren();
    if(readError){const alert=el("p","lw-alert",readError);alert.setAttribute("role","alert");w.appendChild(alert);}
    else {try{if(view&&view[0]==="@")aufgabenListe(w,view.slice(1));else if(view)lesson(w,units().find(u=>u.id===view));else overview(w);}catch(e){const alert=el("p","lw-alert",e.message);alert.setAttribute("role","alert");w.appendChild(alert);}}
    root.GENZURUECK&&root.GENZURUECK.knopfPflegen();
    const ziel=anker&&$(anker);if(ziel&&ziel.scrollIntoView)ziel.scrollIntoView({block:"start"});else root.scrollTo(0,0);
  }
  /* 🔊 немецкий образец вслух (gen/vorlesen.js; код и русский текст не читаются) */
  function vorlesen(parent,text){if(!root.GENVORLESEN||/[а-яё]/i.test(text||""))return;const k=root.GENVORLESEN.knopf(text);if(k)parent.appendChild(k);}
  function card(parent,title) {const c=el("section","lw-card");if(title)c.appendChild(el("h2",null,title));parent.appendChild(c);return c;}
  function list(parent,lines,ordered) {const l=el(ordered?"ol":"ul");lines.forEach(t=>l.appendChild(el("li",null,t)));parent.appendChild(l);}
  function select(parent,label,values,current,change) {
    const wrap=el("label","lw-field",label),s=el("select");
    values.forEach(([v,t])=>{const o=el("option",null,t);o.value=v;s.appendChild(o);});s.value=current;
    s.onchange=()=>change(s.value);wrap.appendChild(s);parent.appendChild(wrap);
  }
  function overview(w) {
    const lead=card(w,"Один небольшой шаг за раз");
    lead.appendChild(el("p",null,"Сначала понять на русском, затем узнать немецкие термины и решить самой. Прочитанное занятие отмечается как разобранное; это ещё не подтверждение самостоятельного навыка."));
    const r=recommend();lead.appendChild(button(r.knopf+": "+r.titel,r.tun,true));
    lead.appendChild(el("p","lw-muted","Твой ориентир: "+(state.profile.days||4)+" дня в неделю по "+sessionMinutes(state.profile)+" минут. "+(state.profile.level==="praxis"?"Начинай занятие с самостоятельного вопроса; пример открывай, если стало трудно.":"Проходи по порядку: сначала разобранный пример, затем свой ответ.")));
    trainieren(w);
    const settings=el("details","lw-card");settings.appendChild(el("summary",null,"Мой темп и поддержка"));w.appendChild(settings);
    const profile=()=>state.profile||{};
    const change=(key,value)=>{save({profile:Object.assign({},profile(),{[key]:value})});};
    select(settings,"Время на одно занятие",[[10,"10 минут · в дороге"],[20,"20 минут"],[40,"40 минут · за столом"]],sessionMinutes(profile()),v=>change("minutes",+v));
    select(settings,"Дней в неделю",[[2,"2"],[3,"3"],[4,"4"],[5,"5"],[6,"6"]],profile().days||4,v=>change("days",+v));
    select(settings,"Как ощущаю основы",[["basis","Нужно начать с основ"],["praxis","Понимаю теорию, трудно решать самой"]],profile().level||"basis",v=>change("level",v));
    select(settings,"Поддержка в занятиях",[["erklaert","С русским объяснением"],["hilfe","Подсказка по запросу"],["pruefung","Сначала самостоятельно"]],profile().mode||"erklaert",v=>change("mode",v));
    settings.appendChild(el("p","lw-muted","Пропущенный день не обнуляет прогресс. Для 10 минут достаточно разобрать пример и сохранить ответ; практику можно продолжить позже."));
    const all=card(w,"Маршрут от основ к применению");
    const seq=el("ol","lw-units");
    units().forEach(u=>{const li=el("li");const b=button(u.title,()=>oeffnen(u.id));b.appendChild(el("span","lw-muted",u.area+" · "+(state.done[u.id]?"✓ разобрано":"ещё не разобрано")));if(state.done[u.id])b.classList.add("lw-done");li.appendChild(b);seq.appendChild(li);});all.appendChild(seq);
    weakness(w);
  }
  function trainieren(w) {
    const box=card(w,"Что тренировать");box.id="lwTrain";
    box.appendChild(el("p","lw-muted","Ориентир по 20 оригинальным экзаменам GA (W21/22–S26) и твоим попыткам. Это подсказка, что делать дальше, а не прогноз оценки."));
    /* 1. Сегодня: ошибки и шаткие вопросы */
    const W=root.GENWIEDER,S=root.GENSATZ;let faellig=0,wackelig=[];
    try{faellig=W&&W.faellig?W.faellig().length:0;}catch(e){}
    try{wackelig=S&&S.wackelig?S.wackelig():[];}catch(e){}
    if(faellig||wackelig.length){
      box.appendChild(el("h3",null,"Сегодня повторить"));
      if(faellig){const row=el("div","lw-result");row.appendChild(el("b",null,"Ошибки к повторению: "+faellig));row.appendChild(el("span","lw-muted","Задания, где раньше была ошибка. Реши их снова без подсказки."));row.appendChild(button("Повторить ошибки",()=>W.starten(),true));box.appendChild(row);}
      if(wackelig.length){const row=el("div","lw-result");row.appendChild(el("b",null,"Вопросы, которые пока не сидят: "+wackelig.length));row.appendChild(el("span","lw-muted","Kurzfragen, где ответ был неполным. Напиши ответ ещё раз своими словами."));row.appendChild(button("Повторить вопросы",()=>S.starten(wackelig.map(x=>x.id)),!faellig));box.appendChild(row);}
    }
    /* 2. Частые темы экзаменов */
    const T=root.AP2_TRAINING||[],obs=observed();
    if(T.length){
      box.appendChild(el("h3",null,"Темы, которые чаще всего дают баллы"));
      const zeile=(t,haupt)=>{
        const i=themaInfo(t,obs),row=el("div","lw-result");
        row.appendChild(el("b",null,(haupt?(i.fehler?"Есть ошибки: ":i.offen.length?"Частая тема, занятие не разобрано: ":"Частая тема, ещё не тренировала: "):"")+t.name+" · "+t.bereich));
        const de=el("span","lw-muted",t.de);de.lang="de";row.appendChild(de);
        row.appendChild(el("span","lw-muted","В "+t.pruef+" из "+(t.von||10)+" экзаменов "+t.bereich+" · задания с этой темой ≈ "+t.punkte+" "+balle(t.punkte)+" из 100"));
        const st=[];
        if((t.units||[]).length)st.push(i.offen.length?"занятие ещё не разобрано":"занятие разобрано ✓");
        if((t.lern||[]).length)st.push(i.versuche?"попыток: "+i.versuche+(i.fehler?" · с ошибками: "+i.fehler:" · без ошибок"):"ещё не тренировала");
        if(st.length)row.appendChild(el("p",null,st.join(" · ")));
        if(t.hinweis)row.appendChild(el("p","lw-muted",t.hinweis));
        const act=el("div","lw-actions");themaAktionen(t,i).forEach(([l,f],k)=>act.appendChild(button(l,f,haupt&&k===0)));
        if(act.childNodes.length)row.appendChild(act);
        return row;
      };
      const start=startThema(T,obs);
      if(start)box.appendChild(zeile(start,true));
      ["GA1","GA2","WiSo"].forEach(b=>{
        const d=el("details","lw-train-gruppe");d.appendChild(el("summary",null,b+": все частые темы"));
        T.filter(t=>t.bereich===b).forEach(t=>d.appendChild(zeile(t,false)));box.appendChild(d);
      });
      box.appendChild(el("p","lw-muted","Баллы — сумма баллов заданий с этой темой, делённая на число экзаменов (GA — 10, WiSo — 9); в GA одно задание может относиться к двум темам."));
    }
    /* 3. Пробные экзамены */
    box.appendChild(el("h3",null,"Пробные экзамены"));
    box.appendChild(el("p",null,"Раз в неделю — один оригинальный бланк в режиме «Übung»: решай сама, потом сравни с решением и поставь баллы. За 6–8 недель до экзамена — режим «Prüfung»: GA 90 минут, WiSo 60 минут."));
    pruefungenZeigen(box);
  }
  function pruefungenZeigen(box) {
    const A=root.GENAZUBI,ziel=el("div","lw-train-pruef");box.appendChild(ziel);
    if(!A||!A.laden){ziel.appendChild(el("p","lw-muted","Плеер бланков недоступен."));return;}
    ziel.appendChild(el("p","lw-muted","Загружаю список бланков…"));
    A.laden().then(()=>{
      ziel.replaceChildren();
      const module=(A.alleModule?A.alleModule():[]).filter(m=>m&&/^(ga1|ga2|wiso)-\d{4}-[sw]$/.test(m.id));
      if(!module.length){
        ziel.appendChild(el("p",null,"На этом устройстве ещё нет пакета оригинальных бланков. Открой «Meine Prüfungsbögen» → «Paket laden» и выбери файл ap2-paket.js."));
        ziel.appendChild(button("Открыть бланки",()=>A.oeffnen(null)));return;
      }
      const eintraege=module.map(m=>{const e=A.einordnen(m,A.zustand(m.id)),q=quelle(m);
        return {id:m.id,bereich:A.bereichVon(m),titel:m.kurz||m.titel||m.id,g:e.g,pr:e.pr,r:q.r,quelle:q.text,minuten:m.minuten,bewertet:e.s?e.s.bewertet:0,bearbeitet:e.s?e.s.bearbeitet:0,teile:e.s?e.s.n:0};});
      const plan=pruefungsPlan(eintraege),namen={ga1:"GA1",ga2:"GA2",wiso:"WiSo"};
      ziel.appendChild(el("p",null,"Пройдено: "+["ga1","ga2","wiso"].filter(b=>plan.zaehl[b].alle).map(b=>namen[b]+" "+plan.zaehl[b].fertig+" из "+plan.zaehl[b].alle).join(" · ")));
      plan.vorschlag.forEach((v,k)=>{
        const row=el("div","lw-result");
        row.appendChild(el("b",null,{weiter:"Закончить: ",neu:"Следующий: ",schwach:"Повторить: "}[v.art]+v.titel));
        row.appendChild(el("span","lw-muted",v.quelle+" · "+(v.minuten||90)+" минут"+(v.art==="schwach"&&v.pr!=null?" · в прошлый раз "+Math.round(v.pr)+" %":"")+(v.art==="weiter"&&v.teile?" · ответ в "+v.bearbeitet+" из "+v.teile+", оценено "+v.bewertet+" из "+v.teile:"")));
        row.appendChild(button("Открыть бланк",()=>A.oeffnen(v.id),k===0));ziel.appendChild(row);
      });
      if(!plan.vorschlag.length)ziel.appendChild(el("p",null,"Все бланки пройдены. Повтори самые старые в режиме «Prüfung»."));
      ziel.appendChild(el("p","lw-muted","Порядок: сначала новые экзамены с официальными решениями ZPA, потом решения u-form и собственные. «Пройдено» — все части оценены."));
    }).catch(()=>{ziel.replaceChildren(el("p","lw-muted","Список бланков не загрузился. Открой «Meine Prüfungsbögen»."));});
  }
  function weakness(w) {
    const box=card(w,"Что пока даётся трудно");const observations=observed();
    if(!observations.length)box.appendChild(el("p",null,"Пока нет наблюдений из новых попыток. Реши несколько заданий — здесь появятся темы для повторения. Отсутствие данных не означает, что тема освоена."));
    const label=t=>{const u=units().find(x=>x.topic===t);return u?u.title:({ga1:"GA1 · оригинальные бланки",ga2:"GA2 · оригинальные бланки"}[t]||t);};
    observations.slice().sort((a,b)=>(b.weak+(b.selfWeak||0))-(a.weak+(a.selfWeak||0))).forEach(o=>{
      const row=el("div","lw-result");row.appendChild(el("b",null,label(o.topic)));
      row.appendChild(el("p",null,(o.weak?"Есть ошибки — вернись к примеру. ":o.selfWeak?"В самопроверке остались пробелы — повтори на другой задаче. ":"Есть опыт решения. ")+
        "Самостоятельных проверенных: "+o.independent+" · с помощью: "+o.assisted+
        (o.recognition?" · квизов на узнавание: "+o.recognition:"")+(o.selfRated?" · самооценок: "+o.selfRated:"")+(o.selfWeak?" · задач с пробелами по самооценке: "+o.selfWeak:"")));
      const u=units().find(x=>x.topic===o.topic);if(u)row.appendChild(button("Разобрать тему",()=>oeffnen(u.id)));box.appendChild(row);
    });
    box.appendChild(el("p","lw-muted","Это наблюдения по решённым заданиям. Квиз, самостоятельное решение и самооценка показываются отдельно; прогноз экзамена из них не рассчитывается."));
  }
  function lesson(w,u) {
    const mode=(state.profile||{}).mode||"erklaert";
    const session=beginnen(u.id,mode);
    const intro=card(w,u.title);intro.appendChild(el("p","lw-muted",u.area+" · авторское занятие · около "+u.minutes+" минут"));
    intro.appendChild(el("p",null,u.why));
    const st=el("p","lw-status");st.setAttribute("aria-live","polite");intro.appendChild(st);
    const wie=el("p","lw-muted","Полностью: прочитай пример → напиши свой ответ → «Сравнить с разбором» → отметь критерии → «Сохранить самопроверку». Только прочитала — нажми «Отметить разобранным».");intro.appendChild(wie);
    const introActions=el("div","lw-actions");intro.appendChild(introActions);
    function drawStatus(){
      const d=!!state.done[u.id];st.textContent=statusText(u.id);st.classList.toggle("ok",d);wie.hidden=d;
      introActions.replaceChildren();
      if(!d)introActions.appendChild(button("✓ Отметить разобранным",()=>{try{markieren(u.id);drawStatus();}catch(e){st.textContent=e.message;}},true));
      else{const n=next(units(),state,observed());if(n&&n.id!==u.id)introActions.appendChild(button("Дальше: "+n.title,()=>oeffnen(n.id),true));}
      introActions.appendChild(button("Все занятия",()=>oeffnen()));
    }
    drawStatus();
    const explanation=el("details","lw-card");explanation.open=mode==="erklaert";explanation.appendChild(el("summary",null,"Русское объяснение, термины и пример"));
    explanation.addEventListener("toggle",()=>{if(explanation.open){try{hilfe(u.id);}catch(e){explanation.open=false;}}});
    const terms=el("dl","lw-terms");u.terms.forEach(([de,ru])=>{const dt=el("dt",null,de);dt.lang="de";terms.append(dt,el("dd",null,ru));});explanation.appendChild(terms);
    const prompt=el("pre","lw-example",u.prompt);prompt.lang="de";explanation.appendChild(prompt);vorlesen(explanation,u.prompt);list(explanation,u.steps,true);w.appendChild(explanation);
    const exercise=card(w,"Попробуй сформулировать сама");exercise.appendChild(el("p",null,session.submission?session.submission.snapshot.control:u.control));
    const label=el("label","lw-field","Мой ответ / черновик"),ta=el("textarea");ta.rows=5;ta.value=session.submission?session.submission.answer:session.answer;ta.readOnly=!!session.submission;label.appendChild(ta);exercise.appendChild(label);
    const status=el("p","lw-muted");status.setAttribute("aria-live","polite");exercise.appendChild(status);
    ta.oninput=()=>{try{entwurf(u.id,ta.value);status.textContent="Черновик сохранён на этом устройстве.";}catch(e){status.textContent=e.message;}};
    const review=el("div");review.hidden=true;exercise.appendChild(review);
    function drawReview(){
      const current=sessionVon(u.id),sub=current.submission;if(!sub)return;
      const saved=state.history.find(e=>e.id===current.id);
      ta.readOnly=true;compare.hidden=true;
      review.replaceChildren();review.hidden=false;review.appendChild(el("p","lw-example",sub.snapshot.answer));vorlesen(review,sub.snapshot.answer);
      review.appendChild(el("p","lw-muted","Сданный ответ зафиксирован. Поддержка до сдачи: "+(sub.assisted?"с объяснением или подсказкой":"без открытой помощи")+"."));
      review.appendChild(el("p",null,"Самопроверка: отметь только то, что было в твоём ответе до открытия разбора."));
      const checks=[];sub.snapshot.rubric.forEach((t,i)=>{
        const l=el("label","lw-check"),c=el("input");c.type="checkbox";c.checked=sub.selected.includes(i);c.disabled=!!saved;
        c.onchange=()=>{try{rubrik(u.id,checks.flatMap((x,j)=>x.checked?[j]:[]));status.textContent="Отметки самопроверки сохранены.";}catch(e){c.checked=!c.checked;status.textContent=e.message;}};
        l.append(c,el("span",null,t));checks.push(c);review.appendChild(l);
      });
      const actions=el("div","lw-actions");
      if(!saved)actions.appendChild(button("Сохранить самопроверку",()=>{
        try{
          const entry=abschliessen(u.id);
          status.textContent="Занятие разобрано; ответ сохранён в истории. "+(entry.correct<entry.max?"Есть пробелы: вернись к примеру и попробуй новую задачу.":"Теперь проверь понимание на новой практической задаче.");
          drawReview();drawHistory();drawStatus();
        }catch(e){status.textContent=e.message;}
      },true));
      else{
        review.appendChild(el("p",null,"Самопроверка: "+saved.correct+" из "+saved.max+". Это твоя оценка по критериям, не автоматическая проверка смысла."));
        if(!saved.recorded){review.appendChild(el("p","lw-muted","Ответ сохранён здесь; общий журнал ещё не подтвердил запись."));actions.appendChild(button("Повторить запись в общий журнал",()=>{abschliessen(u.id);drawReview();drawHistory();}));}
        actions.appendChild(button("Следующий шаг",()=>{const n=next(units(),state,observed());oeffnen(n&&n.id);}));
      }
      actions.appendChild(button("Новая попытка",()=>{try{beginnen(u.id,mode,true);oeffnen(u.id,true);}catch(e){status.textContent=e.message;}}));
      review.appendChild(actions);
    }
    const compare=button("Сравнить с разбором",()=>{
      try{entwurf(u.id,ta.value);abgeben(u.id);drawReview();status.textContent="Ответ зафиксирован до открытия разбора.";}
      catch(e){status.textContent=e.message;ta.focus();}
    });exercise.appendChild(compare);
    const historyBox=el("details","lw-card");w.appendChild(historyBox);
    function drawHistory(){
      const entries=state.history.filter(e=>e.unit===u.id);historyBox.hidden=!entries.length;historyBox.replaceChildren(el("summary",null,"История самопроверок: "+entries.length));
      entries.slice().reverse().forEach(e=>{
        const d=el("details");d.appendChild(el("summary",null,new Date(e.time).toLocaleString("ru")+" · "+e.correct+"/"+e.max+" · "+(e.assisted?"с помощью":"без открытой помощи")));
        if(e.snapshot)d.appendChild(el("p",null,e.snapshot.control));d.appendChild(el("p","lw-example",e.answer));
        if(e.legacy)d.appendChild(el("p","lw-muted","Ранее сохранённая самопроверка; первоначальная рубрика могла не сохраняться."));
        if(!e.recorded&&!e.legacy)d.appendChild(button("Повторить запись в общий журнал",()=>{erneut(e.id);drawHistory();drawReview();}));
        historyBox.appendChild(d);
      });
    }
    drawReview();drawHistory();
    const practice=card(w,"Применить на другой задаче");
    practice.appendChild(el("p",null,"Выбери режим: сначала с объяснением, затем на новом варианте без помощи. К похожей задаче полезно вернуться в другой день."));
    if(u.practice&&root.GENPRAXIS)practice.appendChild(button("Открыть практику",()=>root.GENPRAXIS.oeffnen(u.practice),true));
    if(u.trainer==="sql"&&root.GENSQL)practice.appendChild(button("Открыть SQL-тренажёр",()=>root.GENSQL.oeffnen(),true));
    if(u.trainer==="wiso"&&root.GENAZUBI)practice.appendChild(button("Открыть мои бланки WiSo",()=>root.GENAZUBI.oeffnen(null),true));
    if(u.trainer==="wiso"&&root.GENLERNEN&&root.GENLERNEN.themenIm){
      const wt=root.GENLERNEN.themenIm("wiso");
      if(wt.length){
        const th=el("div","lw-wiso-theorie");th.appendChild(el("h3",null,"Теория WiSo: "+wt.length+" тем"));
        th.appendChild(el("p","lw-muted","Каждая тема: объяснение простыми немецкими предложениями, русские термины и квиз. Начни с темы, где была последняя ошибка в бланке."));
        const acts=el("div","lw-actions");acts.appendChild(button("WiSo-квиз: 10 вопросов",()=>root.GENLERNEN.teilQuiz("wiso",10)));
        acts.appendChild(button("Все темы WiSo",()=>root.GENLERNEN.oeffnen("wiso")));th.appendChild(acts);
        const ul=el("ul","lw-units");wt.forEach(t=>{const li=el("li");const b=button(t.ru||t.titel,()=>root.GENLERNEN.oeffnen(t.id));li.appendChild(b);ul.appendChild(li);});
        th.appendChild(ul);practice.appendChild(th);
      }
    }
    if(u.theory&&root.GENLERNEN)practice.appendChild(button("Теория и немецкий квиз",()=>root.GENLERNEN.oeffnen(u.theory)));
    if(u.id==="lesen"&&root.GENOPUEB)practice.appendChild(button("Тренажёр операторов: что от меня хотят",()=>root.GENOPUEB.oeffnen()));
    if(u.id==="projekt") {
      const project=el("label","lw-field","Мои сроки IHK / вопросы по проекту"),notes=el("textarea");notes.rows=5;notes.value=state.project||"";
      notes.oninput=()=>save({project:notes.value});project.appendChild(notes);practice.appendChild(project);
    }
  }
  function hook() {
    const old=root.schirm;
    if(typeof old==="function")root.schirm=function(name){if(name==="scLernweg"){oeffnen((history.state||{}).lw,true);return;}const s=$("scLernweg");if(s)s.hidden=true;return old.apply(this,arguments);};
    root.addEventListener("popstate",e=>{if(e.state&&e.state.seite==="scLernweg")oeffnen(e.state.lw,true);});
    if(root.GENSTART)root.GENSTART.kopfAktualisieren();
  }
  const api={next,sessionMinutes,oeffnen,empfehlung:recommend,zielOeffnen,liste:units,stand:()=>clone(state),
    beginnen,entwurf,hilfe,abgeben,rubrik,abschliessen,erneut,markieren,statusText,pruefungsPlan,quelle,startThema,themaInfo,aufgabeStand,
    fehler:()=>readError||saveError};
  root.GENLERNWEG=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(hasDom){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",hook);else hook();}
})(typeof window!=="undefined"?window:globalThis);
