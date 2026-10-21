import {ZONES,ENEMIES} from '../content/region.js?v=0.3.1';
import {uid,blocked,addEffect} from './rules.js?v=0.3.1';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const worldObjects=s=>[...ZONES[s.zone].objects,...(s.encounterObjects||[])];
export function openPoint(sim,point,offsets=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[2,1],[-2,1],[1,2],[-1,2]]){
 for(const [dx,dy]of offsets){let p={x:Math.floor(point.x)+dx+.5,y:Math.floor(point.y)+dy+.5};if(!blocked(sim.s.zone,p.x,p.y,sim.s.flags))return p;}
 return {...ZONES[sim.s.zone].spawn,x:ZONES[sim.s.zone].spawn.x+.5,y:ZONES[sim.s.zone].spawn.y+.5};
}
export function spawnEnemy(sim,type,level,point,extra={}){
 const t=structuredClone(ENEMIES[type]),scale=1+Math.max(0,level-t.level)*.16,p=openPoint(sim,point);
 const e={...t,id:uid(),type,level,...p,home:{...p},hp:Math.round(t.hp*scale),maxHp:Math.round(t.hp*scale),atk:Math.round(t.atk*(1+Math.max(0,level-t.level)*.065)),def:t.def+Math.max(0,level-t.level)*.7,mdef:t.mdef+Math.max(0,level-t.level)*.6,effects:[],cd:1,specialCd:6,damageBy:{},dead:false,action:'idle',actionTime:0,cast:null,aggroTarget:null,aggroUntil:0,...extra};
 sim.s.enemies.push(e);return e;
}
export function behindCover(hero,origin,covers){
 const dx=hero.x-origin.x,dy=hero.y-origin.y,length2=dx*dx+dy*dy;if(length2<1)return false;
 return covers.some(c=>{let t=((c.x-origin.x)*dx+(c.y-origin.y)*dy)/length2;return t>.08&&t<.94&&Math.hypot(origin.x+t*dx-c.x,origin.y+t*dy-c.y)<.85;});
}
export function clearBossObjects(sim,id){sim.s.encounterObjects=(sim.s.encounterObjects||[]).filter(o=>o.bossOwner!==id);}
export function mechanicHit(sim,from,to,skill,amount){
 if(!from.classId||amount<=0||!to.ritual)return;
 to.ritual.hits++;
 if(skill.id&&skill.power||to.ritual.hits>=6){to.ritual=null;to.cast=null;to.mechanicHint='Ритуал перервано! Регент уразливий 4 с.';to.hintUntil=sim.s.clock+4;addEffect(to,'exposed',4,from.id);sim.event('interrupt',{actor:to.id,from:from.id,text:'Ритуал Регента перервано!'});}
}
export function mechanicDeath(sim,e){
 if(e.mechanicTarget){const boss=sim.s.enemies.find(b=>b.id===e.bossOwner);if(boss&&!sim.s.enemies.some(c=>c.bossOwner===boss.id&&c.mechanicTarget&&!c.dead)){boss.mechanicShield=false;boss.mechanicHint='Кокони розбиті! Матір кришталю уразлива 4 с.';boss.hintUntil=sim.s.clock+4;addEffect(boss,'exposed',4);sim.event('interrupt',{actor:boss.id,text:boss.mechanicHint});}return true;}
 if(e.boss){clearBossObjects(sim,e.id);for(let c of sim.s.enemies.filter(c=>c.bossOwner===e.id)){c.dead=true;c.rewarded=true;}sim.s.hazards=sim.s.hazards.filter(a=>a.source!==e.id);}
 return false;
}
export function bossMechanic(sim,e,h,dt){
 if(!['crystalmatriarch','scarletregent','frostking'].includes(e.type))return false;
 if(e.hintUntil&&sim.s.clock>e.hintUntil&&!e.ritual&&!e.mechanicShield){e.mechanicHint='';e.hintUntil=0;}
 if(e.mechanicShield){e.mechanicHint='Розбийте два кришталеві кокони: вони захищають матріарху.';return true;}
 if(e.ritual){e.ritual.left-=dt;e.action='cast';e.actionTime=.3;if(e.ritual.left<=0){e.ritual=null;e.cast=null;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.08);e.mechanicHint='Ритуал завершено: Регент відновив 8% HP. Відійдіть від вибуху!';e.hintUntil=sim.s.clock+4;sim.s.hazards.push({id:uid(),x:e.x,y:e.y,radius:5,inner:0,left:1,total:1,source:e.id,kind:'ritual',atk:e.atk*2.5,effect:'curse',duration:5,color:0xb878d4,label:'Вибух ритуалу'});sim.event('telegraph',{actor:e.id,text:e.mechanicHint});}return true;}
 const stage=e.mechanicStage||0,threshold=e.type==='crystalmatriarch'?[.7,.35][stage]:e.type==='scarletregent'?[.65,.3][stage]:[.65,.3][stage];
 if(threshold===undefined||e.hp/e.maxHp>threshold)return false;
 e.mechanicStage=stage+1;e.cast=null;e.specialCd=7;
 if(e.type==='crystalmatriarch'){
  e.mechanicShield=true;
  for(let n of [-1,1])spawnEnemy(sim,'crystalspider',e.level,{x:e.x+n*2,y:e.y+2},{name:'Кришталевий кокон',ai:'mechanic',aggression:'passive',mechanicTarget:true,temporary:true,bossOwner:e.id,boss:false,hp:Math.max(90,Math.round(e.maxHp*.055)),maxHp:Math.max(90,Math.round(e.maxHp*.055)),atk:0,loot:null});
  e.mechanicHint='Матріарха сховалась у павутині. Розбийте два кокони!';
 }else if(e.type==='scarletregent'){
  e.ritual={left:8,total:8,hits:0};e.mechanicHint='Ритуал · 8 с. Перервіть бойовою навичкою або шістьма звичайними влучаннями!';
 }else{
  clearBossObjects(sim,e.id);
  const covers=[[-3,2],[2,3]].map(([x,y])=>({id:uid(),kind:'cover',name:'Крижана колона · укриття',...openPoint(sim,{x:e.x+x,y:e.y+y}),bossOwner:e.id}));
  sim.s.encounterObjects??=[];sim.s.encounterObjects.push(...covers);
  sim.s.hazards.push({id:uid(),x:e.x,y:e.y,radius:9,inner:0,left:5,total:5,source:e.id,kind:'blizzard',atk:e.atk*3,effect:'slow',duration:4,color:0x83cbe9,label:'Хуртовина · сховайтеся за колоною',covers:covers.map(c=>({x:c.x,y:c.y}))});
  e.mechanicHint='Хуртовина через 5 с! Станьте за крижаною колоною відносно боса або вийдіть із кола.';e.hintUntil=sim.s.clock+6;
 }
 sim.event('telegraph',{actor:e.id,text:e.mechanicHint});return e.type!=='frostking';
}

export function resetBossMechanic(sim,e){if(!e.boss)return;clearBossObjects(sim,e.id);for(const c of sim.s.enemies.filter(c=>c.bossOwner===e.id)){c.dead=true;c.rewarded=true;}sim.s.hazards=sim.s.hazards.filter(a=>a.source!==e.id);e.ritual=null;e.mechanicStage=0;e.mechanicShield=false;e.mechanicHint='';}
