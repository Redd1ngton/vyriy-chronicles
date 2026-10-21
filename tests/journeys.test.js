import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../dist/core/simulation.js?v=0.3.1';
import {ZONES,ITEM_TEMPLATES} from '../dist/content/region.js?v=0.3.1';
import {CLASSES,skillFor} from '../dist/content/classes.js?v=0.3.1';
import {RELICS,INCIDENTS} from '../dist/content/journeys.js?v=0.6.0';
import {bossMechanic,behindCover,worldObjects,resetBossMechanic} from '../dist/core/encounters.js?v=0.6.0';
import {relicCast,tickFields,tickIncident} from '../dist/core/journey-runtime.js?v=0.6.0';
import {createItem,uid,equip,derive,takeDamage,pathfind,blocked} from '../dist/core/rules.js?v=0.3.1';
import {validateImported,upgradeSave} from '../dist/core/storage.js?v=0.3.1';
const cmd=(s,h,type,data={},op=uid())=>s.command(h.id,{type,...data,op,round:s.s.round});
function fixture(zone='village',classId='mage',level=30){const sim=new Simulation(null,()=>.99);sim.s.zone=zone;sim.populate();const h=sim.addPlayer(classId,'Тест');h.level=level;h.hp=derive(h).hp;h.sp=derive(h).sp;h.echoes=100;h.zeny=100000;return{sim,h};}
function at(sim,h,kind){let o=worldObjects(sim.s).find(o=>o.kind===kind);h.x=o.x+.5;h.y=o.y+.5;return o;}
function kill(sim,h,e){h.x=e.x;h.y=e.y;e.hp=0;e.dead=true;sim.kill(e,h.id);}
test('storage preserves item identity, runes and quality, protects quests/equipment/offers and migrates safely',()=>{
 const {sim,h}=fixture(),oldItem=createItem('armor',h.id,{quality:3,card:'rune'});h.inventory.push(oldItem);assert.throws(()=>cmd(sim,h,'storageMove',{id:oldItem.id,direction:'deposit'}));at(sim,h,'storage');let op=uid();cmd(sim,h,'storageMove',{id:oldItem.id,direction:'deposit'},op);cmd(sim,h,'storageMove',{id:oldItem.id,direction:'deposit'},op);assert.equal(h.storage.length,1);assert.deepEqual(h.storage[0],oldItem);cmd(sim,h,'storageMove',{id:oldItem.id,direction:'withdraw'});assert.equal(h.storage.length,0);assert.equal(h.inventory.find(i=>i.id===oldItem.id).quality,3);
 assert.throws(()=>cmd(sim,h,'storageMove',{id:h.equipment.weapon,direction:'deposit'}));let q=createItem('regentcrown',h.id);h.inventory.push(q);assert.throws(()=>cmd(sim,h,'storageMove',{id:q.id,direction:'deposit'}));for(let n=0;n<4;n++)h.inventory.push(createItem('ore',h.id));cmd(sim,h,'storageMaterials');assert.equal(h.storage.length,4);assert.ok(h.inventory.some(i=>i.id===q.id));
 const save=validateImported(structuredClone(sim.s));assert.equal(save.players[h.id].storage.length,4);let duplicate=structuredClone(sim.s);duplicate.players[h.id].inventory.push(structuredClone(h.storage[0]));assert.throws(()=>validateImported(duplicate));let old=structuredClone(sim.s);delete old.players[h.id].storage;delete old.players[h.id].dungeonRewards;upgradeSave(old);assert.deepEqual(old.players[h.id].storage,[]);
 const other=sim.addPlayer('archer','Інший');assert.equal(sim.publicState(other.id).players[h.id].storage,undefined);
});
test('safe and risky dungeon routes have different reachable gates, bonus rooms and persistent single-choice rewards for every class',()=>{
 for(const classId of Object.keys(CLASSES))for(const route of ['safe','risky']){
  const {sim,h}=fixture('crystalmine',classId,26);at(sim,h,'camp');cmd(sim,h,'dungeonStart',{route});let run=sim.s.dungeonRun;assert.equal(run.route,route);for(let id of run.guards){let e=sim.s.enemies.find(e=>e.id===id);assert.ok(pathfind(sim.s.zone,h,e,sim.s.flags).length,route+' reachable guard');kill(sim,h,e);}let boss=sim.s.enemies.find(e=>e.boss);kill(sim,h,boss);assert.equal(h.dungeonRewards.length,1);assert.equal(h.dungeonRewards[0].choices.length,3);assert.equal(sim.s.flags.expeditionGates,undefined);
  const reward=h.dungeonRewards[0];let save=validateImported(structuredClone(sim.s));assert.equal(save.players[h.id].dungeonRewards[0].id,reward.id);let choice=reward.choices[1],op=uid();cmd(sim,h,'dungeonChoice',{id:reward.id,choice},op);cmd(sim,h,'dungeonChoice',{id:reward.id,choice},op);assert.equal(h.inventory.filter(i=>i.template===choice).length,1);assert.throws(()=>cmd(sim,h,'dungeonChoice',{id:reward.id,choice:reward.choices[2]}));assert.ok(equip(h,h.inventory.find(i=>i.template===choice).id));
  if(route==='risky'){assert.ok(run.bonusGuards.length===3);const chest=sim.s.encounterObjects.find(o=>o.kind==='challengeChest');h.x=chest.x;h.y=chest.y;assert.throws(()=>cmd(sim,h,'interact',{id:chest.id}));for(let id of run.bonusGuards)kill(sim,h,sim.s.enemies.find(e=>e.id===id));h.x=chest.x;h.y=chest.y;cmd(sim,h,'interact',{id:chest.id});assert.throws(()=>cmd(sim,h,'interact',{id:chest.id}));}
 }
});
test('matriarch cocoons absorb every source of damage, grant no farm loot and reset cleanly',()=>{
 const {sim,h}=fixture('crystalmine','mage',30),boss=sim.s.enemies.find(e=>e.type==='crystalmatriarch');h.x=boss.x;h.y=boss.y+1;boss.hp=boss.maxHp*.65;bossMechanic(sim,boss,h,.1);assert.ok(boss.mechanicShield);assert.equal(takeDamage(boss,999),0);let cocoons=sim.s.enemies.filter(e=>e.mechanicTarget&&!e.dead);assert.equal(cocoons.length,2);let count=h.inventory.length;for(let c of cocoons)kill(sim,h,c);assert.equal(h.inventory.length,count);assert.equal(boss.mechanicShield,false);assert.ok(takeDamage(boss,5)>0);boss.hp=boss.maxHp*.2;bossMechanic(sim,boss,h,.1);assert.ok(boss.mechanicShield);resetBossMechanic(sim,boss);assert.equal(boss.mechanicShield,false);assert.equal(boss.mechanicStage,0);
});
test('regent ritual interrupts on a real skill hit and heals on failure; frost cover changes actual hazard damage',()=>{
 const {sim,h}=fixture('castlespire','mage',40),boss=sim.s.enemies.find(e=>e.type==='scarletregent');boss.hp=boss.maxHp*.6;h.x=boss.x;h.y=boss.y+1;bossMechanic(sim,boss,h,.1);assert.ok(boss.ritual);sim.strike(h,boss,skillFor(h,'firebolt'));assert.equal(boss.ritual,null);assert.ok(boss.effects.some(e=>e.id==='exposed'));
 boss.hp=boss.maxHp*.2;bossMechanic(sim,boss,h,.1);let hp=boss.hp;bossMechanic(sim,boss,h,9);assert.ok(boss.hp>hp);assert.ok(sim.s.hazards.some(a=>a.kind==='ritual'));
 const f=fixture('frostcrypt','mage',72),king=f.sim.s.enemies.find(e=>e.type==='frostking');king.hp=king.maxHp*.6;bossMechanic(f.sim,king,f.h,.1);assert.equal(king.cast.kind,'blizzard');const hazard=f.sim.s.hazards.find(a=>a.kind==='blizzard'),c=hazard.covers[0];f.h.x=c.x+(c.x-king.x)*.6;f.h.y=c.y+(c.y-king.y)*.6;assert.ok(behindCover(f.h,hazard,hazard.covers));let before=f.h.hp;hazard.left=.01;king.aggression='passive';king.specialCd=99;f.sim.update(.1);assert.equal(f.h.hp,before);assert.ok(f.sim.s.events.some(e=>e.type==='cover'));const danger={...hazard,id:uid(),left:.01,done:false};f.sim.s.hazards.push(danger);f.h.x=king.x;f.h.y=king.y+1;f.sim.update(.1);assert.ok(f.h.hp<before);
});
test('all fourteen class relics change real casts and unequipping removes their special behavior',()=>{
 for(const [classId,list]of Object.entries(RELICS))for(const relic of list){
  const {sim,h}=fixture('springvale',classId,30),item=createItem('relic-'+relic.id,h.id);h.inventory.push(item);assert.ok(equip(h,item.id));h.skillRanks[relic.skill]=1;let skill=skillFor(h,relic.skill),target=sim.s.enemies.find(e=>!e.boss);target.x=9.5;target.y=35.5;h.x=target.x-1;h.y=target.y;sim.s.enemies=[target];let extra=structuredClone(target);extra.id=uid();extra.x=target.x+1;extra.y=target.y;extra.hp=extra.maxHp=10000;sim.s.enemies.push(extra);target.hp=target.maxHp=10000;
  const before={fields:sim.s.fields.length,traps:sim.s.traps.length,shots:sim.s.projectiles.length,hp:extra.hp};if(skill.kind==='trap')sim.s.traps.push({id:uid(),owner:h.id,left:14,armed:1});h.lastHealTarget=h.id;
  relicCast(sim,h,skill,target,{x:h.x-1,y:h.y});
  if(['guardField','healField','frostField','emberField'].includes(relic.effect))assert.ok(sim.s.fields.length>before.fields,relic.id);
  if(['pierce','ricochet','thirdShot'].includes(relic.effect))assert.ok(sim.s.projectiles.length>before.shots,relic.id);
  if(relic.effect==='spread')assert.ok(extra.hp<before.hp);
  if(relic.effect==='dashTrap')assert.ok(sim.s.traps.length>before.traps);
  if(relic.effect==='thornField')assert.equal(sim.s.traps.at(-1).thornField,true);
  if(relic.effect==='evade')assert.ok(h.effects.some(e=>e.id==='evasion'));
  if(relic.effect==='wardGuard')assert.ok(h.effects.some(e=>e.id==='guard'));
  if(relic.effect==='echo'){assert.equal(sim.s.echoCasts.length,1);tickFields(sim,.8);assert.ok(extra.hp<before.hp);}
  h.equipment.accessory=null;let snapshot=JSON.stringify({fields:sim.s.fields,traps:sim.s.traps,shots:sim.s.projectiles});relicCast(sim,h,skill,target,h);assert.equal(JSON.stringify({fields:sim.s.fields,traps:sim.s.traps,shots:sim.s.projectiles}),snapshot);
 }
});
test('travel incidents offer peaceful and combat endings, fail with a deadline and cannot reset by reentering a zone',()=>{
 for(const key of Object.keys(INCIDENTS)){
  const z=Object.values(ZONES).find(z=>z.objects.some(o=>o.incident===key)),{sim,h}=fixture(z.id,'mage',z.levels[0]);let o=at(sim,h,'journey');for(let n=0;n<2;n++)h.inventory.push(createItem('fang',h.id));let choice=INCIDENTS[key].choices[1].id;cmd(sim,h,'journeyChoice',{id:o.id,choice});assert.equal(sim.s.travelEvent.status,'completed');assert.throws(()=>cmd(sim,h,'journeyChoice',{id:o.id,choice}));sim.applyDecision({kind:'transition',to:'village',entry:ZONES.village.spawn});sim.applyDecision({kind:'transition',to:z.id,entry:z.spawn});o=at(sim,h,'journey');assert.throws(()=>cmd(sim,h,'journeyChoice',{id:o.id,choice:'fight'}));
  sim.s.clock+=301;cmd(sim,h,'journeyChoice',{id:o.id,choice:'fight'});let e=sim.s.travelEvent;assert.equal(e.status,'active');for(let id of e.enemyIds)kill(sim,h,sim.s.enemies.find(m=>m.id===id));h.x=e.origin.x;h.y=e.origin.y;let echoes=h.echoes;tickIncident(sim);assert.equal(e.status,'completed');assert.ok(h.echoes>echoes);let balance=h.echoes;tickIncident(sim);assert.equal(h.echoes,balance);
 }
 const z=Object.values(ZONES).find(z=>z.objects.some(o=>o.kind==='journey')),f=fixture(z.id);let o=at(f.sim,f.h,'journey');cmd(f.sim,f.h,'journeyChoice',{id:o.id,choice:'fight'});f.sim.s.clock+=91;tickIncident(f.sim);assert.equal(f.sim.s.travelEvent.status,'failed');
});
test('new storage and event objects are reachable in every installed location',()=>{for(const z of Object.values(ZONES))for(const o of z.objects.filter(o=>['storage','journey'].includes(o.kind)))assert.ok(pathfind(z.id,z.spawn,o,{switch:true}).length||Math.hypot(z.spawn.x-o.x,z.spawn.y-o.y)<1,z.id+' '+o.id);});
test('cooperative dungeon votes show the route and recheck the party before starting',()=>{
 const {sim,h}=fixture('crystalmine','mage',26),camp=at(sim,h,'camp'),other=sim.addPlayer('archer','Друг');other.level=26;other.x=camp.x;other.y=camp.y;h.ready=other.ready=true;cmd(sim,h,'dungeonStart',{route:'risky'});assert.ok(sim.s.vote.label.includes('Східний склеп'));other.x=40;other.y=40;cmd(sim,other,'vote',{value:'yes'});assert.ok(!sim.s.dungeonRun);assert.ok(sim.s.events.some(e=>e.text?.includes('Експедиція не почалася')));
});
test('import rejects malformed pending rewards and quest items hidden in storage',()=>{
 const {sim,h}=fixture('crystalmine','mage',26);at(sim,h,'camp');cmd(sim,h,'dungeonStart');for(const id of sim.s.dungeonRun.guards)kill(sim,h,sim.s.enemies.find(e=>e.id===id));kill(sim,h,sim.s.enemies.find(e=>e.boss));for(const mutation of [r=>r.level=Infinity,r=>r.choices=['resources','resources','resources'],r=>r.zone='village']){const saved=structuredClone(sim.s);mutation(saved.players[h.id].dungeonRewards[0]);assert.throws(()=>validateImported(saved));}const saved=structuredClone(sim.s);saved.players[h.id].storage.push(createItem('regentcrown',h.id));assert.throws(()=>validateImported(saved));
});
