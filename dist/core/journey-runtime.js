import {killXP} from '../content/progression.js?v=0.3.1';
import {RELICS,ROUTES,INCIDENTS,relicChoices,activeRelic} from '../content/journeys.js?v=0.6.0';
import {DUNGEONS,makeElite} from '../content/adventures.js?v=0.3.1';
import {ZONES,ITEM_TEMPLATES} from '../content/region.js?v=0.3.1';
import {uid,createItem,derive,addEffect,heal,damage,takeDamage,lineOfSight,blocked} from './rules.js?v=0.3.1';
import {worldObjects,spawnEnemy,openPoint} from './encounters.js?v=0.6.0';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const near=(sim,h,kinds)=>worldObjects(sim.s).some(o=>kinds.includes(o.kind)&&dist(h,o)<3&&lineOfSight(sim.s.zone,h,o,sim.s.flags));
const reserved=(sim,id)=>sim.s.offers.some(o=>o.item===id&&o.status==='pending');
const removeItems=(h,ids)=>{let set=new Set(ids);h.inventory=h.inventory.filter(i=>!set.has(i.id));};
const shards=(h,count)=>{for(let n=0;n<count;n++)h.inventory.push(createItem('embershard',h.id));};
export function configureDungeon(sim,route='safe') {
 const run=sim.s.dungeonRun;run.id=uid();for(let h of Object.values(sim.s.players))if(h.online)h.navigationMode='activity';run.route=route;run.bonusClaims=[];
 const spots=route==='risky'?[[26,30],[26,15],[46,32]]:[[8,30],[8,16],[26,9]];
 run.guards.forEach((id,n)=>{let e=sim.s.enemies.find(e=>e.id===id),p=openPoint(sim,{x:spots[n][0],y:spots[n][1]});Object.assign(e,p,{home:{...p}});});
 if(route==='risky')for(let e of sim.s.enemies){e.hp=e.maxHp=Math.round(e.maxHp*1.3);e.atk=Math.round(e.atk*1.2);}
 sim.s.flags.expeditionGates=route==='risky'?[{x:6,y:21,w:5,h:2}]:[{x:25,y:21,w:5,h:2},{x:44,y:21,w:5,h:2}];
 for(const e of sim.s.enemies)if(blocked(sim.s.zone,e.x,e.y,sim.s.flags)){const p=openPoint(sim,e);Object.assign(e,p,{home:{...p}});}
 sim.s.encounterObjects??=[];
 if(route==='risky'){
  const template=sim.s.enemies.find(e=>!e.boss).type,level=DUNGEONS[sim.s.zone].level+3,guards=[];
  for(let [dx,dy]of [[-2,0],[1,-2],[2,1]]){let e=spawnEnemy(sim,template,level,{x:46+dx,y:32+dy},{temporary:true});makeElite(e,'raging');e.name='Сторож східного склепу';guards.push(e.id);}
  run.bonusGuards=guards;sim.s.encounterObjects.push({id:'expedition-chest:'+run.id,kind:'challengeChest',name:'Скриня східного склепу',x:46.5,y:32.5,runId:run.id,art:9});
 }
 sim.event('story',{text:ROUTES[route].name+': '+ROUTES[route].desc});
}
export function dungeonChoices(sim,enemy,nearby) {
 const run=sim.s.dungeonRun;if(!run)return;
 delete sim.s.flags.expeditionGates;
 for(let h of nearby){
  // The caller already limits participation to living players near the boss.
  if(killXP(h.level,enemy.level,true,enemy.type)<=0)continue;
  h.dungeonRewards??=[];h.dungeonRewards.push({id:uid(),runId:run.id,zone:sim.s.zone,level:enemy.level,route:run.route||'safe',choices:['resources',...relicChoices(h.classId)]});
  if(run.route==='risky'){h.echoes+=2;shards(h,2);h.zeny+=300+enemy.level*10;}
  sim.event('dungeonReward',{actor:h.id,text:'Оберіть одну з трьох нагород експедиції. Вибір збережено до отримання.'});
 }
}
function claimedChoice(sim,h,i){
 const reward=h.dungeonRewards?.find(r=>r.id===i.id);if(!reward||!reward.choices.includes(i.choice))throw Error('Ця нагорода вже отримана або вибір недоступний');
 const atBoss=sim.s.dungeonRun?.id===reward.runId&&sim.s.dungeonRun.status==='completed'&&sim.s.enemies.some(e=>e.boss&&dist(h,e)<14);
 if(!atBoss&&!near(sim,h,['camp','storage']))throw Error('Заберіть нагороду біля боса, привалу або скрині сховища');
 if(i.choice==='resources'){shards(h,reward.route==='risky'?6:4);h.echoes+=reward.route==='risky'?4:3;h.zeny+=400+reward.level*10;}else h.inventory.push(createItem(i.choice,h.id));
 h.dungeonRewards=h.dungeonRewards.filter(r=>r.id!==reward.id);sim.event('loot',{actor:h.id,text:i.choice==='resources'?'Ресурси експедиції отримано':'Реліквія отримана: '+ITEM_TEMPLATES[i.choice].name});return{};
}
function store(sim,h,i){
 if(!near(sim,h,['storage']))throw Error('Підійдіть до скрині мандрівника');h.storage??=[];
 if(i.type==='storageMaterials'){
  const list=h.inventory.filter(a=>ITEM_TEMPLATES[a.template].kind==='material'&&!reserved(sim,a.id)).slice(0,Math.max(0,500-h.storage.length));
  removeItems(h,list.map(a=>a.id));h.storage.push(...list);return{moved:list.length};
 }
 if(!['deposit','withdraw'].includes(i.direction)||!Number.isInteger(i.count??1)||(i.count??1)<1||(i.count??1)>500)throw Error('Невірна передача до сховища');
 const source=i.direction==='deposit'?h.inventory:h.storage,target=i.direction==='deposit'?h.storage:h.inventory,item=source.find(a=>a.id===i.id&&a.owner===h.id);
 if(!item||ITEM_TEMPLATES[item.template].kind==='quest'||Object.values(h.equipment).includes(item.id)||reserved(sim,item.id))throw Error('Квестові, споряджені або запропоновані для передачі речі залишаються в торбі');
 const count=i.count??1,list=[item,...source.filter(a=>a.id!==item.id&&a.template===item.template&&a.owner===h.id&&!Object.values(h.equipment).includes(a.id)&&!reserved(sim,a.id))].slice(0,count);
 if(list.length!==count||target.length+count>(i.direction==='deposit'?500:10000))throw Error('Бракує речей або місця у сховищі');
 const ids=new Set(list.map(a=>a.id));if(i.direction==='deposit')h.inventory=source.filter(a=>!ids.has(a.id));else h.storage=source.filter(a=>!ids.has(a.id));target.push(...list);return{moved:count};
}
export function journeyCommand(sim,h,i){
 if(i.type==='dungeonChoice')return claimedChoice(sim,h,i);
 if(['storageMove','storageMaterials'].includes(i.type))return store(sim,h,i);
 if(i.type==='inventorySort'){h.inventory.sort((a,b)=>ITEM_TEMPLATES[a.template].kind.localeCompare(ITEM_TEMPLATES[b.template].kind)||ITEM_TEMPLATES[a.template].name.localeCompare(ITEM_TEMPLATES[b.template].name,'uk')||(b.quality||0)-(a.quality||0));return{};}
 if(i.type==='journeyChoice')return incidentChoice(sim,h,i);
 return null;
}
export function incidentFor(sim,object){
 const old=sim.s.travelEvent;
 const cooldown=sim.s.journeyCooldowns?.[sim.s.zone]||0;
 if(old?.zone===sim.s.zone&& (old.status==='active'||cooldown>sim.s.clock))return old;
 return {id:object.id,key:object.incident,zone:sim.s.zone,status:cooldown>sim.s.clock?'cooldown':'available',cooldown};
}
function incidentChoice(sim,h,i){
 const object=ZONES[sim.s.zone].objects.find(o=>o.kind==='journey'&&o.id===i.id);
 if(!object||dist(h,object)>3||!lineOfSight(sim.s.zone,h,object,sim.s.flags))throw Error('Підійдіть до місця події');
 const old=incidentFor(sim,object);if(old.status!=='available')throw Error(old.status==='active'?'Подія вже триває':'Ця подія вже закрита. Нові сліди з’являться згодом');
 const data=INCIDENTS[object.incident],choice=data.choices.find(c=>c.id===i.choice);
 if(i.choice==='leave'){sim.s.travelEvent={...old,status:'skipped'};sim.s.journeyCooldowns??={};sim.s.journeyCooldowns[sim.s.zone]=sim.s.clock+180;return{};}
 if(!choice)throw Error('Невідомий варіант події');
 const level=Math.max(1,ZONES[sim.s.zone].levels?.[0]||7);
 if(choice.id==='pay'){const cost=25*level;if(h.zeny<cost)throw Error('Бракує Zeny для викупу');h.zeny-=cost;}
 if(['potion','lure'].includes(choice.id)){let template=choice.id==='potion'?'potion':'fang',count=choice.id==='potion'?1:2,items=h.inventory.filter(a=>a.template===template&&!reserved(sim,a.id)).slice(0,count);if(items.length!==count)throw Error('Бракує предметів для цього рішення');removeItems(h,items.map(a=>a.id));shards(h,1);}
 if(choice.id==='cleanse'){if(h.echoes<2)throw Error('Для очищення потрібні 2 відлуння');h.echoes-=2;shards(h,4);h.hp=derive(h).hp;h.sp=derive(h).sp;h.effects=[];}
 sim.s.enemies=sim.s.enemies.filter(e=>!e.travelEventId);
 const event={...old,id:uid(),objectId:object.id,status:choice.fight?'active':'completed',choice:choice.id,level,participants:Object.values(sim.s.players).filter(p=>p.online&&!p.dead&&dist(p,h)<8).map(p=>p.id),enemyIds:[],expires:sim.s.clock+90,origin:{x:object.x+.5,y:object.y+.5}};
 if(choice.fight)for(let id of event.participants)sim.s.players[id].navigationMode='activity';sim.s.travelEvent=event;sim.s.journeyCooldowns??={};sim.s.journeyCooldowns[sim.s.zone]=sim.s.clock+300;
 if(choice.fight){const type=ZONES[sim.s.zone].enemies.find(e=>!sim.s.enemies.find(a=>a.type===e.type)?.boss)?.type||'wolf';
  for(let n=0;n<choice.fight;n++){let e=spawnEnemy(sim,type,level+2,{x:object.x+3+n,y:object.y-2+n},{temporary:true,travelEventId:event.id});if(choice.elite&&n===0)makeElite(e,'venomous');event.enemyIds.push(e.id);}
  if(choice.elite)addEffect(h,'curse',8,h.id);sim.event('journey',{actor:h.id,text:data.name+': подолайте нападників за 90 с!'});
 }else sim.event('journey',{actor:h.id,text:data.name+': ви обрали мирне завершення.'});
 return{};
}
export function tickIncident(sim){
 const e=sim.s.travelEvent;if(!e||e.status!=='active')return;
 if(e.zone!==sim.s.zone||sim.s.clock>=e.expires||e.participants.every(id=>!sim.s.players[id]?.online||sim.s.players[id]?.dead)){
  e.status='failed';for(let mob of sim.s.enemies.filter(a=>a.travelEventId===e.id)){mob.dead=true;mob.rewarded=true;}sim.event('journey',{text:'Подію втрачено. Сліди загубилися; наступного разу спробуйте інший шлях.'});return;
 }
 if(e.enemyIds.every(id=>sim.s.enemies.some(a=>a.id===id&&a.dead))){e.status='completed';for(let id of e.participants){const h=sim.s.players[id];if(!h||h.dead||!h.online||dist(h,e.origin)>16||killXP(h.level,e.level+2)<=0)continue;shards(h,e.key==='cursed'?3:2);h.echoes+=e.key==='cursed'?3:2;h.zeny+=100+e.level*15;sim.event('journey',{actor:id,text:INCIDENTS[e.key].name+': перемога! Отримано жар-уламки, відлуння та Zeny.'});}}
}
export function addField(sim,h,kind,point,skill={}){sim.s.fields??=[];sim.s.fields.push({id:uid(),owner:h.id,kind,x:point.x,y:point.y,radius:2.2,left:4,tick:0,power:(skill.power||1)*.18,skillId:skill.id});sim.event('field',{actor:h.id,kind,x:point.x,y:point.y});}
export function relicCast(sim,h,skill,target,origin){
 const relic=activeRelic(h);if(!relic||relic.skill!==skill.id)return;
 const effect=relic.effect,point=target||h;
 if(effect==='echo'){sim.s.echoCasts??=[];sim.s.echoCasts.push({owner:h.id,left:.7,skill:{...skill,power:skill.power*.55,echo:true},target:target?.id,point:{x:point.x,y:point.y}});}
 if(['guardField','healField','frostField','emberField'].includes(effect))addField(sim,h,effect,effect==='guardField'&&skill.kind==='heal'?(sim.s.players[h.lastHealTarget]||h):point,skill);
 if(effect==='wardGuard')for(let p of Object.values(sim.s.players))if(!p.dead&&dist(p,h)<=skill.range)addEffect(p,'guard',2,h.id);
 if(effect==='evade')addEffect(h,'evasion',1.2,h.id);
 if(effect==='thirdShot'&&target)sim.projectile(h,target,{...skill,power:skill.power*.7,delay:.3,relicEcho:true});
 if(effect==='dashTrap')sim.s.traps.push({id:uid(),x:origin.x,y:origin.y,owner:h.id,left:12,armed:.3,duration:5,potency:5+h.level*.08});
 if(effect==='thornField'){let trap=sim.s.traps.findLast(t=>t.owner===h.id);if(trap)trap.thornField=true;}
 if(['pierce','ricochet','spread'].includes(effect)&&target){let dx=target.x-h.x,dy=target.y-h.y,len=Math.hypot(dx,dy)||1;
  const candidates=sim.s.enemies.filter(e=>!e.dead&&e!==target&&lineOfSight(sim.s.zone,h,e,sim.s.flags)&& (effect==='pierce'?((e.x-h.x)*dx+(e.y-h.y)*dy)/len>len&&((e.x-h.x)*dx+(e.y-h.y)*dy)/len<skill.range+2&&Math.abs((e.x-h.x)*dy-(e.y-h.y)*dx)/len<.9:dist(e,target)<(effect==='spread'?2:4))).sort((a,b)=>dist(a,target)-dist(b,target)).slice(0,effect==='spread'?1:2);
  for(let e of candidates){const modified={...skill,power:skill.power*(effect==='pierce'?.65:.55),splash:true,relicEcho:true};if(effect==='spread')sim.strike(h,e,modified);else sim.projectile(h,e,modified);}
 }
}
export function tickFields(sim,dt){
 for(let echo of sim.s.echoCasts||[]){echo.left-=dt;if(echo.left<=0&&!echo.done){const h=sim.s.players[echo.owner],target=sim.s.enemies.find(e=>e.id===echo.target&&!e.dead)||echo.point;if(h&&!h.dead&&target&&dist(h,target)<=echo.skill.range+.5&&lineOfSight(sim.s.zone,h,target,sim.s.flags))for(let e of sim.s.enemies.filter(e=>!e.dead&&dist(e,target)<2&&lineOfSight(sim.s.zone,h,e,sim.s.flags)))sim.strike(h,e,echo.skill);echo.done=true;}}
 sim.s.echoCasts=(sim.s.echoCasts||[]).filter(e=>!e.done);
 for(let f of sim.s.fields||[]){f.left-=dt;f.tick-=dt;const h=sim.s.players[f.owner];if(!h||h.dead){f.left=0;continue;}if(f.left<=0||f.tick>0)continue;f.tick+=1;
  if(['guardField','healField'].includes(f.kind)){for(let p of Object.values(sim.s.players))if(!p.dead&&dist(p,f)<f.radius&&lineOfSight(sim.s.zone,f,p,sim.s.flags)){if(f.kind==='guardField')addEffect(p,'guard',1.3,h.id);else{const amount=heal(p,derive(p).hp*.02);if(amount)sim.event('heal',{actor:p.id,value:Math.round(amount)});}}}
  else for(let e of sim.s.enemies.filter(e=>!e.dead&&dist(e,f)<f.radius&&lineOfSight(sim.s.zone,f,e,sim.s.flags))){if(f.kind==='thornField'){addEffect(e,'slow',1.4,h.id);addEffect(e,'poison',3,h.id,5+h.level*.05);}else{sim.strike(h,e,{id:f.skillId,power:f.power,magic:f.kind==='frostField',field:true,splash:true,relicEcho:true});if(f.kind==='frostField')addEffect(e,'slow',1.4,h.id);}}
 }
 sim.s.fields=(sim.s.fields||[]).filter(f=>f.left>0);
}
