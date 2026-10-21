// Verifies the actual public deployment, not the development HTTP server.
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {readdirSync} from 'node:fs';
const origin=process.argv[2];
if(!origin||!/^https:\/\//.test(origin))throw Error('Pass the HTTPS deployment origin');
async function fetchFile(path){const r=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(10000),cache:'no-store'});assert.equal(r.status,200,path+' HTTP '+r.status);return r}
let ready=false,last;
for(let attempt=0;attempt<18;attempt++){try{const r=await fetchFile('/');const html=await r.text();assert.ok(html.includes('<meta name="vyriy-release" content="0.5.2">'),'Waiting for 0.5.2 deployment');const engineResponse=await fetchFile('/assets/phaser-3.90.0.min.js?v=0.3.2');try{new Script(await engineResponse.text())}catch{throw Error('Waiting for valid Phaser build')}ready=true;break}catch(e){last=e;console.log('Waiting for deployment:',e.message);await new Promise(r=>setTimeout(r,10000))}}
if(!ready)throw last;
const modules=[];
function collect(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory()){if(e.name!=='assets')collect(path)}else if(e.name.endsWith('.js'))modules.push('/'+path.slice(5)+'?v=0.3.1')}}
collect('dist');
await Promise.all(modules.map(async path=>{const r=await fetchFile(path);assert.match(r.headers.get('content-type')||'',/(java|ecma)script/,path);const body=await r.text();assert.ok(!/^\s*<!doctype html/i.test(body),path+' returned HTML');console.log('JS OK',path)}));
for(const name of ['heroes-v2.png','heroes-extra-v2.png','enemies-v2.png','bosses-v2.png','world-v2.png']){
 const r=await fetchFile('/assets/'+name);assert.match(r.headers.get('content-type')||'',/image\/png/);
 const reader=r.body.getReader();const {value}=await reader.read();assert.deepEqual([...value.slice(0,8)],[137,80,78,71,13,10,26,10],name);await reader.cancel();console.log('PNG OK',name);
}
const engine=await fetchFile('/assets/phaser-3.90.0.min.js?v=0.3.2');assert.match(engine.headers.get('content-type')||'',/(java|ecma)script/);const engineSource=await engine.text();try{new Script(engineSource)}catch{throw Error('Deployed Phaser has invalid JavaScript')}assert.ok(engineSource.includes('Phaser'));
const health=await fetchFile('/api/health');assert.equal((await health.json()).mode,'static-local');
console.log('Public Cloudflare deployment verified: HTML, module graph, engine, atlases and health.');
