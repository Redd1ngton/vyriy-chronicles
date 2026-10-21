import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../dist/core/simulation.js';
import {ZONES} from '../dist/content/region.js';
import {CLASSES} from '../dist/content/classes.js';
import {DUNGEONS} from '../dist/content/adventures.js';
import {derive,heal,createItem,equip,uid} from '../dist/core/rules.js';
import {tickTrials,activeTrial} from '../dist/core/trials.js';
import {validateImported,upgradeSave} from '../dist/core/storage.js';
import {activeRelic} from '../dist/content/journeys.js';
const cmd=(s,h,type,data={})=>s.command(h.id,{type,...data,op:uid(),round:s.s.round});
function fixture(zone='crystalmine',classId='mage',level=40){const sim=new Simulation(null,()=>.99);sim.s.zone=zone;sim.populate();const h=sim.addPlayer(classId,'Випробувач');h.level=level;h.hp=derive(h).hp;h.sp=derive(h).sp;const camp=ZONES[zone].objects.find(o=>o.kind==='camp');h.x=camp.x+.5;h.y=camp.y+.5;return{sim,h,camp};}
function kill(sim,h,e){h.x=e.x;h.y=e.y;e.dead=true;e.hp=0;sim.kill(e,h.id);}
test('trials scale all four existing dungeons for all seven classes and save class-specific single-choice relics',()=>{
 for(const zone of Object.keys(DUNGEONS))for(const c of Object.keys(CLASSES)){
  const {sim,h}=fixture(zone,c,Math.max(40,DUNGEONS[zone].level));cmd(sim,h,'dungeonStart',{trial:2});assert.equal(activeTrial(sim.s).trial,2);assert.ok(sim.s.enemies.every(e=>e.level>=h.level));assert.equal(sim.s.encounterObjects.filter(o=>o.kind==='trialTrap').length,3);
  h.hp=1;assert.equal(heal(h,100),60);h.hp=derive(h).hp;
  for(const id of sim.s.dungeonRun.guards)kill(sim,h,sim.s.enemies.find(e=>e.id===id));kill(sim,h,sim.s.enemies.find(e=>e.boss));
  assert.equal(h.healingScale,undefined);assert.equal(h.trials.best,2);assert.ok(h.trials.recipes&&h.trials.appearance);assert.ok(!sim.s.hazards.some(a=>a.kind==='trial'));
  const saved=validateImported(structuredClone(sim.s)),restored=new Simulation(saved),player=restored.s.players[h.id],reward=player.dungeonRewards[0];assert.equal(reward.trial,2);const choice=reward.choices[1];assert.ok(choice.startsWith('trial-relic-'));cmd(restored,player,'dungeonChoice',{id:reward.id,choice});assert.throws(()=>cmd(restored,player,'dungeonChoice',{id:reward.id,choice}));const item=player.inventory.find(i=>i.template===choice);equip(player,item.id);assert.ok(activeRelic(player));assert.ok(derive(player).hp>derive(h).hp);
 }
});
test('trial entry, rest, joining and resurrection respect level and active group rules',()=>{
 const {sim,h,camp}=fixture('crystalmine','mage',39);assert.throws(()=>cmd(sim,h,'dungeonStart',{trial:1}));h.level=40;assert.throws(()=>cmd(sim,h,'dungeonStart',{trial:4}));cmd(sim,h,'dungeonStart',{trial:1});assert.throws(()=>cmd(sim,h,'interact',{id:camp.id}));assert.throws(()=>sim.addPlayer('mage','Пізній'));h.dead=true;assert.throws(()=>cmd(sim,h,'respawn'));sim.update(.1);assert.equal(sim.s.dungeonRun.status,'failed');assert.equal(h.healingScale,undefined);cmd(sim,h,'respawn');assert.equal(h.dead,false);
 const normal=fixture();cmd(normal.sim,normal.h,'dungeonStart');assert.equal(activeTrial(normal.sim.s),null);assert.equal(normal.h.healingScale,undefined);
});
test('trial rifts telegraph, damage players and stop on exit; enemy affixes affect actual attacks',()=>{
 const {sim,h}=fixture();cmd(sim,h,'dungeonStart',{trial:3});const trap=sim.s.encounterObjects.find(o=>o.kind==='trialTrap');h.x=trap.x;h.y=trap.y;sim.s.clock=sim.s.dungeonRun.nextPulse;tickTrials(sim);assert.equal(sim.s.hazards.length,3);assert.ok(sim.s.hazards.every(a=>a.left===1.8));for(const e of sim.s.enemies){e.aggression='passive';e.aggroTarget=null;e.cd=100;}
 const before=h.hp;for(let n=0;n<20;n++)sim.update(.1);assert.ok(h.hp<before);const e=sim.s.enemies.find(e=>!e.boss);e.trialAffix='draining';h.sp=100;sim.strike(e,h,{power:1});assert.equal(h.sp,91);
 sim.applyDecision({kind:'transition',to:'village',entry:ZONES.village.spawn});assert.equal(h.healingScale,undefined);assert.equal(activeTrial(sim.s),null);assert.equal(sim.s.hazards.length,0);
});
test('trial recipes spend only available materials atomically; cosmetic unlocks and old saves persist',()=>{
 const sim=new Simulation(null,()=>.99),h=sim.addPlayer('mage','Ковач');h.level=40;h.trials={best:2,recipes:true,appearance:true,equipped:false};const forge=ZONES.village.objects.find(o=>o.kind==='forge');h.x=forge.x+.5;h.y=forge.y+.5;h.zeny=1000;
 for(let n=0;n<10;n++)h.inventory.push(createItem('ore',h.id));for(let n=0;n<6;n++)h.inventory.push(createItem('embershard',h.id));h.inventory.find(i=>i.template==='ore').favorite=true;const before=JSON.stringify(h.inventory);assert.throws(()=>cmd(sim,h,'trialCraft',{recipe:'aegis'}));assert.equal(JSON.stringify(h.inventory),before);assert.equal(h.zeny,1000);h.inventory.push(createItem('ore',h.id));cmd(sim,h,'trialCraft',{recipe:'aegis'});assert.equal(h.zeny,200);assert.equal(h.inventory.filter(i=>i.template==='trial-aegis').length,1);assert.ok(h.inventory.some(i=>i.favorite));cmd(sim,h,'trialAppearance');assert.equal(h.trials.equipped,true);
 const saved=validateImported(structuredClone(sim.s));assert.equal(saved.players[h.id].trials.equipped,true);saved.players[h.id].trials.best=0;assert.throws(()=>validateImported(saved));const old=structuredClone(sim.s);delete old.players[h.id].trials;upgradeSave(old);assert.equal(old.players[h.id].trials.best,0);
});
