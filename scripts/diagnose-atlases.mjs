import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
function inspect(b){
 if(!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'not PNG';
 let pos=8,parts=[],end=false;
 while(pos+12<=b.length){const n=b.readUInt32BE(pos),type=b.toString('ascii',pos+4,pos+8);if(pos+n+12>b.length)return 'truncated '+type+' chunk at '+pos+' / '+b.length;parts.push(type==='IDAT'?b.subarray(pos+8,pos+8+n):Buffer.alloc(0));pos+=n+12;if(type==='IEND'){end=true;break;}}
 if(!end)return 'missing IEND';
 try{inflateSync(Buffer.concat(parts));return 'complete PNG, zlib valid'}catch(e){return 'invalid compressed image: '+e.message}
}
for(const name of ['heroes-v2.png','heroes-extra-v2.png','world-v2.png','enemies-v2.png','bosses-v2.png']){
 console.log('REPOSITORY',name,inspect(readFileSync('dist/assets/'+name)));
 try{const r=await fetch('https://vyriy-chronicles.syrupyriver9.chatgpt.site/assets/'+name,{signal:AbortSignal.timeout(15000)});const b=Buffer.from(await r.arrayBuffer());console.log('ORIGINAL',name,r.status,b.length,inspect(b))}catch(e){console.log('ORIGINAL',name,e.message)}
}
