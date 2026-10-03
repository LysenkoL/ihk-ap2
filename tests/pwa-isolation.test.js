"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

async function worker(file, own, other) {
  const handlers = {}, removed = [], added = [];
  let pending;
  const code = fs.readFileSync(file, "utf8");
  const version = code.match(/const VERSION\s*=\s*"([^"]+)"/)[1];
  const context = {
    self: { addEventListener: (name, fn) => handlers[name] = fn,
      clients: { claim: async () => {} } },
    caches: {
      keys: async () => [version + "-app", own + "bilder", own + "lib", own + "v0-app", other + "v3-app", other + "bilder", "another-app"],
      delete: async key => removed.push(key),
      open: async () => ({ add: async req => added.push(req.url) })
    },
    Request: class { constructor(url) { this.url = url; } }, URL
  };
  vm.runInNewContext(code, context);
  handlers.activate({waitUntil: p => pending = p});
  await pending;
  assert.deepStrictEqual(removed, [own + "v0-app"], "activation must preserve other apps and permanent caches");
  handlers.install({waitUntil: p => pending = p});
  await pending;
  assert(added.includes("./index.html"), "offline shell must contain the entry page");
  for (const resource of added) {
    assert(fs.existsSync(path.resolve(path.dirname(file), resource)), "missing offline resource: " + resource);
  }
  // A broken mandatory file must prevent activation of an incomplete new shell.
  context.caches.open = async () => ({add: async () => {throw new Error("offline");}});
  handlers.install({waitUntil: p => pending = p});
  await assert.rejects(pending, /offline/);
  if (own === "ihk-ap2-") {
    context.self.location = {origin:"https://example.test"};
    let intercepted = false;
    handlers.fetch({request:{method:"GET",mode:"navigate",url:"https://example.test/ap2/tests/lernweg-browser.html"},respondWith:()=>{intercepted=true;},waitUntil:()=>{}});
    assert.strictEqual(intercepted,false,"test fixture must not replace the offline entry page");
  }
}

(async () => {
  await worker(path.join(__dirname, "../sw.js"), "ihk-ap2-", "ihk-ap1-");
  const ap1 = path.join(__dirname, "../../ihk-sim/sw.js");
  if (fs.existsSync(ap1)) await worker(ap1, "ihk-ap1-", "ihk-ap2-");
  console.log("PWA cache isolation and atomic installation verified");
})().catch(e => { console.error(e); process.exitCode = 1; });
