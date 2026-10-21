import {inflateSync} from 'node:zlib';
// Read actual screenshot pixels; a visible canvas can still contain a blank frame.
export function sceneColorFraction(png){
 let w,h,channels,parts=[];
 for(let p=8;p+12<=png.length;){const n=png.readUInt32BE(p),type=png.toString('ascii',p+4,p+8);if(type==='IHDR'){w=png.readUInt32BE(p+8);h=png.readUInt32BE(p+12);channels={2:3,6:4}[png[p+17]];if(png[p+16]!==8||!channels)throw Error('Unsupported screenshot format');}if(type==='IDAT')parts.push(png.subarray(p+8,p+8+n));p+=n+12;}
 const raw=inflateSync(Buffer.concat(parts)),stride=w*channels;let previous=Buffer.alloc(stride),colored=0,total=0;
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
 for(let y=0;y<h;y++){const filter=raw[y*(stride+1)],row=Buffer.from(raw.subarray(y*(stride+1)+1,(y+1)*(stride+1)));for(let x=0;x<stride;x++){const a=x>=channels?row[x-channels]:0,b=previous[x],c=x>=channels?previous[x-channels]:0;row[x]=(row[x]+(filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):0))&255;}
 if(y%8===0)for(let x=0;x<w;x+=8){const rgb=[row[x*channels],row[x*channels+1],row[x*channels+2]],max=Math.max(...rgb);total++;if(max>50&&max-Math.min(...rgb)>12)colored++;}previous=row;
 }return colored/total;
}
