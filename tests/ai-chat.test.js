"use strict";
const assert = require("assert");
const AI = require("../gen/ai-chat.js");
function fixture(data = new Map(), copy = async () => {}, doc) {
  const opened = [], texts = [], log = [];
  const env = { localStorage: { getItem: k => data.get(k) || null, setItem: (k,v) => data.set(k,v) },
    navigator: { clipboard: { writeText: async t => { log.push("clipboard"); texts.push(t); return copy(t); } } },
    open: (url,name) => { log.push("open"); const w = { closed:false, location:{href:url}, focus(){log.push("focus");this.focused=true;}, close(){this.closed=true;} }; opened.push({url,name,w}); return w; },
    document: doc ? doc(log, texts) : undefined };
  return { api: AI.create(env), opened, texts, data, log };
}
/* minimal DOM for the synchronous execCommand path */
const fakeDoc = works => (log, texts) => { let last = ""; return { body: { appendChild(){} }, activeElement: null,
  createElement: () => ({ value: "", style: {}, setAttribute(){}, focus(){}, select(){ last = this.value; }, setSelectionRange(){}, remove(){} }),
  execCommand: c => { log.push("exec"); if (works) texts.push(last); return works; } }; };
(async () => {
  const g = {id:"az:ga1-2023-w",name:"GA1 W23"}, h = {id:"az:ga2-2023-w",name:"GA2 W23"};
  const f=fixture();
  assert((await f.api.send("first answer",g)).ok);
  assert.deepEqual(f.log,["clipboard","open"],"copy before the window takes the focus");
  assert.equal(f.opened.length,1); assert.equal(f.opened[0].w.location.href,"https://chatgpt.com/");
  await f.api.send("edited answer",g);
  assert.deepEqual(f.log.slice(-2),["clipboard","focus"],"copy before focusing the open chat");
  assert.equal(f.opened.length,1,"same exam reuses accessible window"); assert.equal(f.texts.at(-1),"edited answer");
  await f.api.send("other exam",h); assert.equal(f.opened.length,2); assert.notEqual(f.opened[0].name,f.opened[1].name);
  await f.api.send("short",{id:"short"},{copyOnly:true}); assert.equal(f.opened.length,2,"copy-only never opens");
  f.opened[0].w.closed=true;
  const lost=await f.api.send("next question",g); assert.equal(f.opened.length,2,"COOP loss must not spawn another tab"); assert.equal(lost.window,"manual");
  const reloaded=fixture(f.data); const re=await reloaded.api.send("after reload",g); assert.equal(reloaded.opened.length,1,"after a reload the chat opens again"); assert.equal(re.window,"opened");
  reloaded.opened[0].w.closed=true; await reloaded.api.send("again",g); assert.equal(reloaded.opened.length,1,"but not twice on the same page");
  reloaded.opened.length=0; f.data.delete("ap2:ai:chats");
  const url="https://chatgpt.com/c/12345678-abcd-5678?x=1#foo";
  assert(reloaded.api.saveLink(g,url).ok); assert.equal(reloaded.api.getLink(g),"https://chatgpt.com/c/12345678-abcd-5678");
  reloaded.api.openChat(g); assert.equal(reloaded.opened.length,1); assert.equal(reloaded.opened[0].w.location.href,"https://chatgpt.com/c/12345678-abcd-5678");
  for(const u of ["javascript:alert(1)","https://chatgpt.com.evil.test/c/12345678","https://user@chatgpt.com/c/12345678","https://chatgpt.com/share/12345678","https://claude.ai/project/12345678","https://chatgpt.com:444/c/12345678"]) assert.equal(AI.validUrl(u),null,u);
  assert.equal(AI.validUrl("https://chatgpt.com/g/g-example/c/12345678"),"https://chatgpt.com/g/g-example/c/12345678");
  const failed=fixture(new Map(),async()=>{throw Error("denied");});
  const fail=await failed.api.send("manual fallback",g); assert.equal(fail.ok,false); assert.equal(failed.opened.length,0,"no window when nothing was copied");
  /* synchronous execCommand first; clipboard only as fallback */
  const sync=fixture(new Map(),async()=>{},fakeDoc(true)); assert((await sync.api.send("sync",g)).ok); assert.deepEqual(sync.log,["exec","open"]); assert.deepEqual(sync.texts,["sync"]);
  const fb=fixture(new Map(),async()=>{},fakeDoc(false)); assert((await fb.api.send("fallback",g)).ok); assert.deepEqual(fb.log,["exec","clipboard","open"]);
  const none=fixture(new Map(),async()=>{throw Error("denied");},fakeDoc(false)); const n=await none.api.send("nothing",g,{copyOnly:true}); assert.equal(n.ok,false); assert.equal(none.opened.length,0);
  let release; const slow=fixture(new Map(),()=>new Promise(r=>{release=r;}));
  const pending=slow.api.send("first",g); const duplicate=await slow.api.send("second",g);
  assert.equal(duplicate.busy,true); assert.equal(slow.opened.length,0,"window waits for the copy"); release(); await pending; assert.equal(slow.opened.length,1);
  const corrupt=fixture(new Map([["ap2:ai:chats","{broken"]]));
  assert.equal(corrupt.api.saveLink(g,url).ok,false); assert.equal(corrupt.data.get("ap2:ai:chats"),"{broken");
  const legacy=fixture(new Map([["ap2:pruefen:chats",JSON.stringify({[g.id]:{url:"https://claude.ai/chat/12345678-abcd"}})]]));
  assert.equal(legacy.api.getLink(g,"claude"),"https://claude.ai/chat/12345678-abcd"); assert.equal(legacy.api.getLink(g),"");
  console.log("ai-chat: groups, copy, reuse, reload, refusal, URL validation and legacy OK");
})().catch(e=>{console.error(e);process.exitCode=1;});
