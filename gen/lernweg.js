"use strict";
(function(root) {
  const SK="ap2:lernweg", hasDom=typeof document!=="undefined";
  const units=()=>root.AP2_LERNWEG||[];
  function next(list,state,observed) {
    const done=(state||{}).done||{};
    const pending=list.find(u=>!done[u.id]);
    if(pending) return pending;
    return list.find(u=>(observed||[]).some(s=>s.topic===u.topic&&s.weak)||((state.checks||{})[u.id]&&state.checks[u.id].correct<state.checks[u.id].max))||null;
  }
  function sessionMinutes(profile) { const n=Number((profile||{}).minutes); return [10,20,40].includes(n)?n:20; }
  function load() {
    try { const x=JSON.parse(root.localStorage.getItem(SK));
      return Object.assign({done:{},drafts:{},checks:{},profile:{minutes:20,days:4,level:"basis",mode:"erklaert"}},x&&typeof x==="object"&&!Array.isArray(x)?x:{});
    } catch(e) {return {done:{},drafts:{},checks:{},profile:{minutes:20,days:4,level:"basis",mode:"erklaert"}};}
  }
  let state=load(), view=null;
  const observed=()=>root.GENLERNSTAND?root.GENLERNSTAND.summary():[];
  const $=id=>document.getElementById(id);
  const el=(t,c,s)=>{const n=document.createElement(t);if(c)n.className=c;if(s!=null)n.textContent=s;return n;};
  function button(label,fn,primary) { const b=el("button","btn"+(primary?" primary":""),label); b.type="button"; b.onclick=fn; return b; }
  function save(patch) {
    const value=Object.assign({},state,patch,{updated:Date.now()});
    try {root.localStorage.setItem(SK,JSON.stringify(value));state=value;return true;}
    catch(e) { if(hasDom){ const alert=$("lwSave")||el("p","lw-alert");alert.id="lwSave";alert.setAttribute("role","alert");alert.textContent="Не удалось сохранить. Текст остаётся на экране. Скопируй его перед закрытием и сделай резервную копию прогресса."; if(!alert.parentNode)($("lernwegInhalt")||document.body).appendChild(alert);}return false; }
  }
  function recommend() {
    const u=next(units(),state,observed());
    if(!u) return {titel:"Повтори на новом примере",warum:"Вводный маршрут пройден. Выбери самостоятельную задачу или вернись к трудной теме.",minuten:sessionMinutes(state.profile),knopf:"Практика",tun:()=>root.GENPRAXIS?root.GENPRAXIS.oeffnen():oeffnen()};
    return {titel:u.title,warum:u.why,minuten:sessionMinutes(state.profile),knopf:state.done[u.id]?"Повторить тему":"Продолжить занятие",tun:()=>oeffnen(u.id)};
  }
  function screen() {
    let s=$("scLernweg");if(s)return s;
    s=el("div","seite lw-page");s.id="scLernweg";s.hidden=true;
    const w=el("div","lw-wrap");w.id="lernwegInhalt";s.appendChild(w);
    $("scStart").parentNode.insertBefore(s,$("scStart").nextSibling);return s;
  }
  function oeffnen(id,fromHistory) {
    view=units().some(u=>u.id===id)?id:null;
    const s=screen();
    document.querySelectorAll("div.seite[id^='sc'],#scBogen").forEach(n=>n.hidden=n!==s);
    ["fuss","mwUhr","btnUhr","mwPunkte","schalterKatalog"].forEach(k=>{if($(k))$(k).hidden=true;});
    if($("kopfTitel"))$("kopfTitel").hidden=false;
    if($("kEyebrow"))$("kEyebrow").textContent="AP2 · личная подготовка";
    if($("kTitel"))$("kTitel").textContent=view?units().find(u=>u.id===view).title:"Мой учебный маршрут";
    if(!fromHistory){try {if(!history.state||!history.state.ihk)history.replaceState({ihk:1,seite:"scStart"},"");history.pushState({ihk:1,seite:"scLernweg",lw:view},"");}catch(e){}}
    const w=$("lernwegInhalt");w.replaceChildren();
    if(view)lesson(w,units().find(u=>u.id===view));else overview(w);
    root.GENZURUECK&&root.GENZURUECK.knopfPflegen();root.scrollTo(0,0);
  }
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
    const settings=el("details","lw-card");settings.appendChild(el("summary",null,"Мой темп и поддержка"));w.appendChild(settings);
    const profile=()=>state.profile||{};
    const change=(key,value)=>{save({profile:Object.assign({},profile(),{[key]:value})});};
    select(settings,"Время на одно занятие",[[10,"10 минут · в дороге"],[20,"20 минут"],[40,"40 минут · за столом"]],sessionMinutes(profile()),v=>change("minutes",+v));
    select(settings,"Дней в неделю",[[2,"2"],[3,"3"],[4,"4"],[5,"5"],[6,"6"]],profile().days||4,v=>change("days",+v));
    select(settings,"Как ощущаю основы",[["basis","Нужно начать с основ"],["praxis","Понимаю теорию, трудно решать самой"]],profile().level||"basis",v=>change("level",v));
    select(settings,"Поддержка в занятиях",[["erklaert","С русским объяснением"],["hilfe","Подсказка по запросу"],["pruefung","Сначала самостоятельно"]],profile().mode||"erklaert",v=>change("mode",v));
    settings.appendChild(el("p","lw-muted","Пропущенный день не обнуляет прогресс. Для10минут достаточно разобрать пример и сохранить ответ; практику можно продолжить позже."));
    const all=card(w,"Маршрут от основ к применению");
    const seq=el("ol","lw-units");
    units().forEach(u=>{const li=el("li");const b=button(u.title,()=>oeffnen(u.id));b.appendChild(el("span","lw-muted",u.area+" · "+(state.done[u.id]?"разобрано":"ещё не разобрано")));li.appendChild(b);seq.appendChild(li);});all.appendChild(seq);
    weakness(w);
  }
  function weakness(w) {
    const box=card(w,"Что пока даётся трудно");const observations=observed();
    if(!observations.length)box.appendChild(el("p",null,"Пока нет наблюдений из новых попыток. Реши несколько заданий — здесь появятся темы для повторения. Отсутствие данных не означает, что тема освоена."));
    const label=t=>{const u=units().find(x=>x.topic===t);return u?u.title:t;};
    observations.slice().sort((a,b)=>Number(b.weak)-Number(a.weak)).forEach(o=>{
      const row=el("div","lw-result");row.appendChild(el("b",null,label(o.topic)));
      row.appendChild(el("p",null,(o.weak?"Есть ошибки — вернись к примеру. ":"Есть опыт решения. ")+
        "Самостоятельных проверенных: "+o.independent+" · с помощью: "+o.assisted+
        (o.recognition?" · квизов на узнавание: "+o.recognition:"")+(o.selfRated?" · самооценок: "+o.selfRated:"")));
      const u=units().find(x=>x.topic===o.topic);if(u)row.appendChild(button("Разобрать тему",()=>oeffnen(u.id)));box.appendChild(row);
    });
    box.appendChild(el("p","lw-muted","Это наблюдения по решённым заданиям. Квиз, самостоятельное решение и самооценка показываются отдельно; прогноз экзамена из них не рассчитывается."));
  }
  function lesson(w,u) {
    const mode=(state.profile||{}).mode||"erklaert";
    const intro=card(w,u.title);intro.appendChild(el("p","lw-muted",u.area+" · авторское занятие · около "+u.minutes+" минут"));
    intro.appendChild(el("p",null,u.why));intro.appendChild(button("Все занятия",()=>oeffnen()));
    let assisted=mode==="erklaert";
    const explanation=el("details","lw-card");explanation.open=mode==="erklaert";explanation.appendChild(el("summary",null,"Русское объяснение, термины и пример"));
    explanation.addEventListener("toggle",()=>{if(explanation.open)assisted=true;});
    const terms=el("dl","lw-terms");u.terms.forEach(([de,ru])=>{const dt=el("dt",null,de);dt.lang="de";terms.append(dt,el("dd",null,ru));});explanation.appendChild(terms);
    const prompt=el("pre","lw-example",u.prompt);prompt.lang="de";explanation.appendChild(prompt);list(explanation,u.steps,true);w.appendChild(explanation);
    const exercise=card(w,"Попробуй сформулировать сама");exercise.appendChild(el("p",null,u.control));
    const label=el("label","lw-field","Мой ответ / черновик"),ta=el("textarea");ta.rows=5;ta.value=(state.drafts||{})[u.id]||"";label.appendChild(ta);exercise.appendChild(label);
    const status=el("p","lw-muted");status.setAttribute("aria-live","polite");exercise.appendChild(status);
    ta.oninput=()=>{if(save({drafts:Object.assign({},state.drafts,{[u.id]:ta.value})}))status.textContent="Черновик сохранён на этом устройстве.";};
    const review=el("div");review.hidden=true;exercise.appendChild(review);
    exercise.appendChild(button("Сравнить с разбором",()=>{
      if(!ta.value.trim()){status.textContent="Сначала запиши свой ответ или конкретно то, что не удалось понять.";ta.focus();return;}
      review.replaceChildren();review.hidden=false;review.appendChild(el("p","lw-example",u.answer));
      review.appendChild(el("p",null,"Самопроверка: отметь только то, что было в твоём ответе до открытия разбора."));
      const checks=[];u.rubric.forEach(t=>{const l=el("label","lw-check"),c=el("input");c.type="checkbox";l.append(c,el("span",null,t));checks.push(c);review.appendChild(l);});
      const actions=el("div","lw-actions");
      actions.appendChild(button("Сохранить самопроверку",()=>{
        const correct=checks.filter(c=>c.checked).length;
        const stamp=Date.now(),entry={time:stamp,correct,max:checks.length,answer:ta.value,assisted};
        if(!save({done:Object.assign({},state.done,{[u.id]:stamp}),checks:Object.assign({},state.checks,{[u.id]:entry})}))return;
        root.GENLERNSTAND&&root.GENLERNSTAND.record({id:"lernweg:"+u.id+":"+stamp,topic:u.topic,source:"lernweg",task:u.id,correct,max:checks.length,support:assisted?"hilfe":"selbst",kind:"selbst",answers:ta.value});
        status.textContent="Занятие разобрано. "+(correct<checks.length?"Есть пробелы: вернись к примеру и попробуй новую практическую задачу.":"Теперь проверь понимание на новой практической задаче.");
        actions.replaceChildren(button("Следующий шаг",()=>{const n=next(units(),state,observed());oeffnen(n&&n.id);}));
      },true));review.appendChild(actions);
    }));
    const practice=card(w,"Применить на другой задаче");
    practice.appendChild(el("p",null,"Сначала попробуй без помощи. Если не получилось, открой подсказку и отдельно вернись к похожей задаче в другой день."));
    if(u.practice&&root.GENPRAXIS)practice.appendChild(button("Самостоятельная практика",()=>root.GENPRAXIS.oeffnen(u.practice),true));
    if(u.trainer==="sql"&&root.GENSQL)practice.appendChild(button("Открыть SQL-тренажёр",()=>root.GENSQL.oeffnen(),true));
    if(u.trainer==="wiso"&&root.GENAZUBI)practice.appendChild(button("Открыть мои бланки WiSo",()=>root.GENAZUBI.oeffnen(null),true));
    if(u.theory&&root.GENLERNEN)practice.appendChild(button("Теория и немецкий квиз",()=>root.GENLERNEN.oeffnen(u.theory)));
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
  const api={next,sessionMinutes,oeffnen,empfehlung:recommend,liste:units,stand:()=>JSON.parse(JSON.stringify(state))};
  root.GENLERNWEG=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(hasDom){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",hook);else hook();}
})(typeof window!=="undefined"?window:globalThis);
