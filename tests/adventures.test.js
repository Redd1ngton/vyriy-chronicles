import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../dist/core/simulation.js?v=0.3.1';
import {DUNGEONS,ELITES,makeElite} from '../dist/content/adventures.js?v=0.3.1';
import {QUESTS} from '../dist/content/quests.js?v=0.3.1';
import {ZONES,ITEM_TEMPLATES} from '../dist/content/region.js?v=0.3.1';
import {skillFor} from '../dist/content/classes.js?v=0.3.1';
import {questNavigation} from '../dist/core/navigation.js?v=0.3.1';
import {createItem,uid,derive,takeDamage,pathfind} from '../dist/core/rules.js?v=0.3.1';
import {validateImported} from '../dist/core/storage.js?v=0.3.1';
const cmd=(s,h,type,data={},op=uid())=>s.command(h.id,{type,...data,op,round:s.s.round});
function fixture(zone='village',level=40){let sim=new Simulation(null,()=>.99);sim.s.zone=zone;sim.populate();let h=sim.addPlayer('mage','Тест');h.level=level;h.hp=derive(h).hp;h.echoes=100;h.zeny=100000;return{sim,h};}
function dead(sim,e,h){h.x=e.x;h.y=e.y;e.dead=true;e.hp=0;sim.kill(e,h.id);}
test('all four repeatable dungeons lock the boss, reward one completion, restart and preserve story flags',()=>{
 for(let [zone,d]of Object.entries(DUNGEONS)){let {sim,h}=fixture(zone,d.level),camp=ZONES[zone].objects.find(o=>o.kind==='camp');h.x=camp.x;h.y=camp.y;let flags=structuredClone(sim.s.flags);cmd(sim,h,'dungeonStart');assert.equal(sim.s.dungeonRun.status,'active');let boss=sim.s.enemies.find(e=>e.boss);assert.ok(boss,zone);assert.equal(takeDamage(boss,999999),0);assert.equal(sim.s.dungeonRun.guards.length,3);assert.ok(pathfind(zone,camp,boss,sim.s.flags).length,zone+' reachable boss');assert.throws(()=>cmd(sim,h,'dungeonStart'));
 for(let id of sim.s.dungeonRun.guards){let e=sim.s.enemies.find(e=>e.id===id);assert.ok(e.elite);dead(sim,e,h);}
 assert.equal(boss.dungeonLocked,false);let echoes=h.echoes;dead(sim,boss,h);assert.equal(sim.s.dungeonRun.status,'completed');assert.ok(h.echoes>=echoes+5);let coins=h.zeny,count=h.inventory.length;sim.kill(boss,h.id);assert.equal(h.zeny,coins);assert.equal(h.inventory.length,count);
 let saved=validateImported(structuredClone(sim.s));assert.equal(saved.dungeonRun.status,'completed');h.x=camp.x;h.y=camp.y;cmd(sim,h,'dungeonStart');assert.ok(sim.s.enemies.find(e=>e.boss&&!e.dead));if(boss.expeditionOnly){const {expeditionGates,...storyFlags}=sim.s.flags;assert.deepEqual(storyFlags,flags);assert.ok(expeditionGates.length);}
 sim.applyDecision({kind:'transition',to:'village',entry:ZONES.village.spawn});assert.equal(sim.s.dungeonRun,null);
 }
});
test('elite modifiers affect damage cadence, defense and loot; irrelevant levels give no rare currency',()=>{
 for(let key of Object.keys(ELITES)){let {sim,h}=fixture('springvale',8),e=sim.s.enemies.find(e=>!e.boss&&!e.elite),hp=e.maxHp,atk=e.atk;makeElite(e,key);assert.ok(e.maxHp>hp&&e.atk>atk);if(key==='venomous')assert.equal(e.onHit,'poison');let balance=h.echoes;dead(sim,e,h);assert.ok(h.echoes>balance);assert.ok(h.inventory.some(i=>i.template==='embershard'));}
 let {sim,h}=fixture('springvale',85),e=sim.s.enemies.find(e=>!e.boss);makeElite(e,'armored');let before=h.echoes;dead(sim,e,h);assert.equal(h.echoes,before);
});
test('skill directions are exclusive, alter actual skill parameters and persist across a paid change',()=>{
 let {sim,h}=fixture(),camp=ZONES.village.objects.find(o=>o.kind==='camp'),base=skillFor(h,'firebolt'),frostCost=skillFor(h,'frost').cost;h.x=camp.x;h.y=camp.y;cmd(sim,h,'skillAugment',{id:'firebolt',choice:'force'});let force=skillFor(h,'firebolt');assert.ok(force.power>base.power&&force.cost>base.cost);let echoes=h.echoes;assert.throws(()=>cmd(sim,h,'skillAugment',{id:'firebolt',choice:'force'}));assert.equal(h.echoes,echoes);cmd(sim,h,'skillAugment',{id:'firebolt',choice:'rhythm'});let rhythm=skillFor(h,'firebolt');assert.ok(rhythm.cost<base.cost&&rhythm.cd<base.cd&&rhythm.power<base.power);assert.equal(h.echoes,echoes-3);assert.equal(skillFor(h,'frost').cost,frostCost);assert.equal(validateImported(structuredClone(sim.s)).players[h.id].skillAugments.firebolt,'rhythm');h.x=1;h.y=1;assert.throws(()=>cmd(sim,h,'skillAugment',{id:'firebolt',choice:'force'}));
});
test('forge consumes materials and coins, increases actual stats, protects bound gear and rejects duplicate salvage',()=>{
 let {sim,h}=fixture(),anvil=ZONES.village.objects.find(o=>o.kind==='forge');h.x=anvil.x;h.y=anvil.y;let weapon=h.inventory.find(i=>i.id===h.equipment.weapon),atk=derive(h).matk;assert.throws(()=>cmd(sim,h,'forge',{id:weapon.id}));cmd(sim,h,'unequip',{id:weapon.id});for(let n=0;n<30;n++)h.inventory.push(createItem('embershard',h.id));for(let n=0;n<5;n++)cmd(sim,h,'forge',{id:weapon.id});assert.equal(weapon.quality,5);cmd(sim,h,'equip',{id:weapon.id});assert.ok(derive(h).matk>atk);cmd(sim,h,'unequip',{id:weapon.id});assert.throws(()=>cmd(sim,h,'forge',{id:weapon.id}));let op=uid();cmd(sim,h,'salvage',{id:weapon.id},op);let count=h.inventory.length;cmd(sim,h,'salvage',{id:weapon.id},op);assert.equal(h.inventory.length,count);assert.throws(()=>cmd(sim,h,'salvage',{id:weapon.id}));let bound=createItem('legendary-mage-40',h.id);h.inventory.push(bound);assert.throws(()=>cmd(sim,h,'salvage',{id:bound.id}));
});
test('quest arrow resolves all 56 quests, navigates across zones, switches to turn-in NPC, and remembers selection',()=>{
 let {sim,h}=fixture();for(let q of QUESTS){h.quests={[q.id]:{status:'active'}};h.trackedQuest=q.id;let nav=questNavigation(h,sim.s);assert.ok(Number.isFinite(nav?.x)&&Number.isFinite(nav?.y),q.id);}
 let q=QUESTS.find(q=>q.objectives.every(o=>o.type==='collect'));h.quests={[q.id]:{status:'active'}};h.trackedQuest=q.id;for(let o of q.objectives)for(let n=0;n<o.count;n++)h.inventory.push(createItem(o.id,h.id));let nav=questNavigation(h,sim.s);assert.ok(nav.ready);assert.ok(nav.label.includes('Здати')||nav.label.includes('→'));
 let npcZone=Object.values(ZONES).find(z=>z.objects.some(o=>o.id===q.npc));sim.s.zone=npcZone.id;sim.populate();nav=questNavigation(h,sim.s);assert.ok(nav.label.startsWith('Здати:'));assert.equal(nav.x,npcZone.objects.find(o=>o.id===q.npc).x+.5);
 let next=QUESTS.find(a=>a.id!==q.id&&a.level<=h.level&&!a.requires);cmd(sim,h,'questTrack',{id:next.id});assert.equal(validateImported(structuredClone(sim.s)).players[h.id].trackedQuest,next.id);
});
