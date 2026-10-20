import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
const names=['heroes-v2.png','heroes-extra-v2.png','world-v2.png','enemies-v2.png','bosses-v2.png'];
function crc32(b){let c=0xffffffff;for(const v of b){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
const failures=[];
for(const name of names){try{
 const b=readFileSync('dist/assets/'+name);assert.ok(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'invalid signature');
 let pos=8,parts=[],ended=false,width,height,depth,color;
 while(pos+12<=b.length){
  const n=b.readUInt32BE(pos),type=b.toString('ascii',pos+4,pos+8);
  assert.ok(pos+n+12<=b.length,'truncated '+type+' chunk');
  assert.equal(crc32(b.subarray(pos+4,pos+8+n)),b.readUInt32BE(pos+8+n),'bad '+type+' CRC');
  if(type==='IHDR'){assert.equal(n,13);width=b.readUInt32BE(pos+8);height=b.readUInt32BE(pos+12);depth=b[pos+16];color=b[pos+17];assert.equal(b[pos+20],0,'interlacing unsupported');}
  if(type==='IDAT')parts.push(b.subarray(pos+8,pos+8+n));
  pos+=n+12;if(type==='IEND'){assert.equal(n,0);ended=true;break;}
 }
 assert.ok(ended,'missing IEND');assert.equal(pos,b.length,'trailing bytes');
 assert.equal(width,1254);assert.equal(height,1254);assert.equal(depth,8);
 const channels={0:1,2:3,3:1,4:2,6:4}[color];assert.ok(channels,'unsupported color type');
 const raw=inflateSync(Buffer.concat(parts)),stride=width*channels+1;assert.equal(raw.length,height*stride,'incomplete pixel data');
 for(let y=0;y<height;y++)assert.ok(raw[y*stride]<=4,'invalid scanline filter');
 console.log('Atlas integrity OK:',name);
 }catch(e){failures.push(name+': '+e.message);}
}
if(failures.length)throw Error('Sprite atlas integrity check failed:\n'+failures.join('\n'));
