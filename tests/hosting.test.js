import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';
import {RemoteSession} from '../dist/net/client.js?v=0.3.1';
test('Cloudflare points to the playable dist root and local health is honest',async()=>{
 const config=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
 assert.equal(config.assets.directory,'./dist');
 let response=await worker.fetch(new Request('https://example.test/api/health'),{});
 assert.deepEqual(await response.json(),{mode:'static-local',maxPlayers:0});
 response=await worker.fetch(new Request('https://example.test/api/rooms'),{});
 assert.equal(response.status,503);
 const request=new Request('https://example.test/');
 let forwarded=false;
 response=await worker.fetch(request,{ASSETS:{fetch:async r=>{assert.equal(r,request);forwarded=true;return new Response('game')}}});
 assert.equal(forwarded,true);assert.equal(await response.text(),'game');
});
test('unreachable saved multiplayer session times out instead of blocking local boot',async()=>{
 const originalFetch=globalThis.fetch,originalStorage=globalThis.sessionStorage;const keepAlive=setInterval(()=>{},1000);
 globalThis.sessionStorage={getItem:()=>JSON.stringify({base:'https://offline.example',room:'12345678',token:'test'})};
 globalThis.fetch=(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));
 try{await assert.rejects(RemoteSession.resume(),{name:'TimeoutError'})}
 finally{clearInterval(keepAlive);globalThis.fetch=originalFetch;if(originalStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=originalStorage}
});
