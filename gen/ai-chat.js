/* Local handoff to a personal AI chat. No API, prompt URLs or automatic sending. */
"use strict";
(function(root){
  const CHATS="ap2:ai:chats";
  const PROVIDERS={chatgpt:{name:"ChatGPT",home:"https://chatgpt.com/"},claude:{name:"Claude",home:"https://claude.ai/new"}};
  function validUrl(value,provider){
    try {
      const u=new URL(String(value||"").trim());
      if(u.protocol!=="https:"||u.username||u.password||u.port)return null;
      if(u.hostname==="chat.openai.com")u.hostname="chatgpt.com";
      const g=u.hostname==="chatgpt.com"&&/^\/(?:g\/[A-Za-z0-9_-]+\/)?c\/[A-Za-z0-9-]{8,}\/?$/.test(u.pathname);
      const c=u.hostname==="claude.ai"&&/^\/chat\/[A-Za-z0-9-]{8,}\/?$/.test(u.pathname);
      if(!(provider==="claude"?c:provider==="chatgpt"?g:g||c))return null;
      return u.origin+u.pathname.replace(/\/$/,"");
    }catch(e){return null;}
  }
  function create(env){
    const handles=new Map(),seen=new Set(),pending=new Set();
    const provider=p=>PROVIDERS[p]?p:"chatgpt";
    const key=(g,p)=>provider(p)+":"+String(g&&g.id||"allgemein");
    function read(k){
      const raw=env.localStorage&&env.localStorage.getItem(k);
      const v=raw?JSON.parse(raw):{};
      if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Неверный формат сохранённых чатов.");
      return v;
    }
    function getLink(g,p){
      p=provider(p);
      try {
        const all=read(CHATS),entry=all[key(g,p)];
        if(entry)return validUrl(entry.url,p)||"";
        if(p==="claude")return validUrl((read("ap2:pruefen:chats")[g.id]||{}).url,p)||"";
      }catch(e){}
      return "";
    }
    function saveLink(g,value,p){
      p=provider(p);const url=value?validUrl(value,p):"";
      if(value&&!url)return {ok:false,error:"Нужна личная ссылка на беседу из адресной строки, не ссылка «Поделиться»."};
      try{
        const all=read(CHATS);all[key(g,p)]={url,name:g.name||g.id,t:Date.now()};
        env.localStorage.setItem(CHATS,JSON.stringify(all));handles.delete(key(g,p));
        return {ok:true,url};
      }catch(e){return {ok:false,error:"Не удалось сохранить ссылку. Старые данные не изменены; сохрани ссылку отдельно."};}
    }
    // Guard against duplicate tabs only while this page lives: after a reload the chat opens again.
    const remember=k=>seen.add(k);
    // Window name unique per page load: after a reload the old chat tab is cross-origin and has no
    // opener, so reusing its name only triggers an "unsafe navigation" error before a new tab opens.
    const laden=Math.random().toString(36).slice(2,8);
    const nameFor=k=>"ap2-ai-"+laden+"-"+Array.from(k).map(c=>c.codePointAt(0).toString(16)).join("-");
    function focus(k){const w=handles.get(k);try{if(w&&!w.closed){w.focus();return true;}}catch(e){}return false;}
    function blank(k){try{const w=env.open("about:blank",nameFor(k));if(w){try{w.opener=null;}catch(e){} }return w;}catch(e){return null;}}
    function navigate(w,g,p,k){
      try{w.location.href=getLink(g,p)||PROVIDERS[provider(p)].home;handles.set(k,w);remember(k);return true;}
      catch(e){try{w.close();}catch(ignore){}return false;}
    }
    function openChat(g,p){
      const k=key(g,p);if(focus(k))return {window:"focused"};
      const w=blank(k);return {window:w&&navigate(w,g,p,k)?"opened":"blocked"};
    }
    // Synchronous copy first: it runs while the page still has focus and the click is fresh.
    // navigator.clipboard fails once another window took the focus ("Document is not focused").
    function copySync(text){
      const doc=env.document;if(!doc||typeof doc.execCommand!=="function"||!doc.body)return false;
      const before=doc.activeElement;let f;
      try{
        f=doc.createElement("textarea");f.value=text;f.setAttribute("readonly","");
        f.style.cssText="position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
        doc.body.appendChild(f);try{f.focus({preventScroll:true});}catch(e){}
        f.select();try{f.setSelectionRange(0,text.length);}catch(e){}
        return !!doc.execCommand("copy");
      }catch(e){return false;}
      finally{if(f)f.remove();try{if(before&&before.focus)before.focus({preventScroll:true});}catch(e){}}
    }
    async function copy(text){
      if(copySync(text))return true;
      try{if(env.navigator&&env.navigator.clipboard){await env.navigator.clipboard.writeText(text);return true;}}catch(e){}
      return false;
    }
    async function send(text,g,options){
      const o=options||{},p=provider(o.provider),k=key(g,p);
      if(pending.has(k))return {ok:false,busy:true,window:"none"};
      if(!String(text||"").trim())return {ok:false,window:"none",error:"Нет текста для копирования."};
      pending.add(k);
      // Copy BEFORE opening or focusing a chat window: a window in front takes the focus,
      // and the browser then refuses the clipboard.
      try{
        const ok=await copy(String(text));
        let action="none";
        if(ok&&!o.copyOnly){
          if(focus(k))action="focused";
          else if(seen.has(k))action="manual";
          else {const w=blank(k);action=w&&navigate(w,g,p,k)?"opened":"blocked";}
        }
        return {ok,window:action,provider:p,link:getLink(g,p)};
      }finally{pending.delete(k);}
    }
    function controls(options){
      const doc=env.document,g=options.group||{id:"allgemein",name:"Короткие вопросы"};
      const el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
      const box=el("div","pf-ai"),label=el("label","pf-klein","Обсуждение: "),select=el("select");
      Object.entries(PROVIDERS).forEach(([v,p])=>{const o=el("option",null,p.name);o.value=v;select.appendChild(o);});label.appendChild(select);box.appendChild(label);
      const row=el("div","pf-claude"),status=el("p","pf-klein");status.setAttribute("role","status");
      const field=el("textarea","pf-prompt");field.rows=8;field.readOnly=true;field.hidden=true;field.setAttribute("aria-label","Сообщение для ИИ");
      const button=(text,fn,primary)=>{const b=el("button","btn "+(primary?"primary":"ghost")+" klein",text);b.type="button";b.onclick=fn;row.appendChild(b);return b;};
      const build=()=>String(options.buildText()||"");
      async function transfer(copyOnly){
        field.value=build();main.disabled=only.disabled=true;
        try{
          const r=await send(field.value,g,{copyOnly,provider:select.value});
          if(!r.ok){field.hidden=false;try{field.focus();field.select();}catch(e){}status.textContent="Браузер не дал скопировать. Текст ниже уже выделен — нажми Ctrl+C (на телефоне «Копировать»), потом «Открыть чат».";return;}
          status.textContent=r.window==="manual"?"Скопировано. Переключись в уже открытый чат и вставь текст. Если вкладка закрыта — нажми «Открыть чат»."
            :r.window==="blocked"?"Скопировано. Браузер не открыл окно: нажми «Открыть чат»."
            :copyOnly?"Текст скопирован. Вставь его в нужный чат. Новое окно не открывалось."
            :"Текст скопирован. Вставь в чат (Ctrl+V или «Вставить») и отправь.";
        }finally{main.disabled=only.disabled=false;}
      }
      const main=button("Обсудить в ChatGPT",()=>transfer(false),true);
      const only=button("Только скопировать",()=>transfer(true));
      button("Открыть чат",()=>{const r=openChat(g,select.value);status.textContent=r.window==="blocked"?"Браузер заблокировал окно. Открой "+PROVIDERS[select.value].name+" вручную; текст можно скопировать здесь.":"Открыт чат для «"+g.name+"». Вставь подготовленный текст.";});
      button("Посмотреть сообщение",()=>{field.value=build();field.hidden=!field.hidden;});
      box.append(row,status);
      const details=el("details","pf-link"),summary=el("summary",null,"Закрепить чат за «"+g.name+"»");details.appendChild(summary);
      details.appendChild(el("p","pf-klein","После первого сообщения скопируй адрес беседы из адресной строки и сохрани здесь. Для другого экзамена будет своя ссылка. Не используй «Поделиться»."));
      const form=el("div","pf-link-feld"),input=el("input","pf-link-inp");input.type="url";input.setAttribute("aria-label","Личная ссылка на чат");
      const save=el("button","pf-mini","Сохранить ссылку");save.type="button";
      save.onclick=()=>{const r=saveLink(g,input.value,select.value);status.textContent=r.ok?"Чат закреплён за «"+g.name+"». При необходимости открой его отдельной кнопкой.":r.error;};
      form.append(input,save);details.appendChild(form);box.append(details,field);
      box.appendChild(el("p","pf-klein","Копируется только показанное сообщение. ИИ может ошибаться; сверяй разбор с условием и критериями. Ответ не отправляется автоматически."));
      function providerChanged(){main.textContent="Обсудить в "+PROVIDERS[select.value].name;input.value=getLink(g,select.value);input.placeholder=select.value==="claude"?"https://claude.ai/chat/…":"https://chatgpt.com/c/…";}
      select.onchange=providerChanged;providerChanged();return box;
    }
    return {send,copy,openChat,getLink,saveLink,controls};
  }
  const api=Object.assign({create,validUrl},create(root));root.GENAICHAT=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
