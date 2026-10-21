export class EncounterVisuals {
 constructor(scene,project){this.scene=scene;this.project=project;this.g=scene.add.graphics().setDepth(6001);this.labels=new Map();this.props=new Map();}
 update(s,h,time){
  const g=this.g,p=this.project,scene=this.scene;g.clear();const ids=new Set(),propIds=new Set();
  const label=(id,x,y,text,color='#ffe0a5')=>{ids.add(id);let t=this.labels.get(id);if(!t){t=scene.add.text(x,y,text,{fontFamily:'system-ui',fontSize:'11px',color,stroke:'#152722',strokeThickness:4,align:'center'}).setOrigin(.5,1).setDepth(10003);this.labels.set(id,t);}t.setPosition(x,y).setText(text).setColor(color);};
  for(const f of s.fields||[]){const a=p(f.x,f.y),color={guardField:0xb7d6a1,healField:0xc9e8ac,frostField:0x91d3ed,emberField:0xeeb16d,thornField:0xa1c67d}[f.kind]||0xdfc489;g.fillStyle(color,.14).fillEllipse(a.x,a.y,f.radius*64,f.radius*32);g.lineStyle(2,color,.8).strokeEllipse(a.x,a.y,f.radius*64,f.radius*32);}
  for(const o of s.encounterObjects||[]){if(Math.hypot(o.x-h.x,o.y-h.y)>22)continue;const a=p(o.x,o.y);
   if(o.kind==='cover'){g.fillStyle(0xa7d7e7,.9).fillPoints([{x:a.x-12,y:a.y},{x:a.x-8,y:a.y-55},{x:a.x+2,y:a.y-75},{x:a.x+16,y:a.y-43},{x:a.x+13,y:a.y+3}],true);g.lineStyle(2,0xe0f7ff,.95).lineBetween(a.x+2,a.y-75,a.x+2,a.y-3);label(o.id,a.x,a.y+19,'Укриття','#c2edfc');}
   if(o.kind==='challengeChest'){propIds.add(o.id);let prop=this.props.get(o.id);if(!prop){prop=scene.add.image(a.x,a.y,'world',9).setOrigin(.5,.85).setDisplaySize(85,85);this.props.set(o.id,prop);}prop.setPosition(a.x,a.y).setDepth(a.y);const claimed=s.dungeonRun?.bonusClaims?.includes(h.id);prop.setAlpha(claimed?.45:1);label(o.id,a.x,a.y+20,claimed?'Скриню відкрито':'Скриня східного склепу');}
  }
  for(const gate of s.flags.expeditionGates||[]){for(let n=0;n<gate.w;n++){const a=p(gate.x+n+.5,gate.y+.5);g.lineStyle(3,0xc29e77,.8).lineBetween(a.x,a.y-37,a.x,a.y+2);}const a=p(gate.x+gate.w*.5,gate.y+.5);label('gate:'+gate.x,a.x,a.y-40,'Інший маршрут','#d2b495');}
  for(const a of s.hazards){if(a.done)continue;const center=p(a.x,a.y);if(a.label)label('hazard:'+a.id,center.x,center.y-25,a.label+' · '+Math.ceil(a.left)+' с');if(a.covers)for(const c of a.covers){const dx=c.x-a.x,dy=c.y-a.y,len=Math.hypot(dx,dy)||1,px=-dy/len*.7,py=dx/len*.7;const vertices=[p(c.x+px,c.y+py),p(c.x-px,c.y-py),p(a.x+dx/len*a.radius-px*3,a.y+dy/len*a.radius-py*3),p(a.x+dx/len*a.radius+px*3,a.y+dy/len*a.radius+py*3)];g.fillStyle(0x8be0bd,.2).fillPoints(vertices,true);g.lineStyle(1,0xa6f2cf,.6).strokePoints(vertices,true);}}
  for(const [id,t]of this.labels)if(!ids.has(id)){t.destroy();this.labels.delete(id);}for(const [id,t]of this.props)if(!propIds.has(id)){t.destroy();this.props.delete(id);}
 }
}
