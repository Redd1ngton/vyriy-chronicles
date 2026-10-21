import test from 'node:test';
import assert from 'node:assert/strict';
import {ZONES,ENEMIES,ITEM_TEMPLATES} from '../dist/content/region.js?v=0.3.1';
import {QUESTS} from '../dist/content/quests.js?v=0.3.1';
import {LEGACY_QUEST_IDS,NEW_ENEMIES,NEW_BOSSES,LEGENDARY40} from '../dist/content/chapter2.js?v=0.3.1';
import {Simulation} from '../dist/core/simulation.js?v=0.3.1';
import {uid,derive,createItem,equip,pathfind} from '../dist/core/rules.js?v=0.3.1';
import {questAvailable,questsForNPC} from '../dist/core/quest-rules.js?v=0.3.1';
const cmd=(sim,h,type,data={})=>sim.command(h.id,{type,...data,op:uid(),round:sim.s.round});
function atNPC(sim,h,id){const z=Object.values(ZONES).find(z=>z.objects.some(o=>o.id===id));sim.s.zone=z.id;sim.populate();h.zone=z.id;const npc=z.objects.find(o=>o.id===id);h.x=npc.x+.5;h.y=npc.y+.5;}
test('18 locations, 65 quests, 18 genuinely new ordinary types and six bosses are wired into the world',()=>{
 assert.equal(Object.keys(ZONES).length,18);assert.equal(QUESTS.length,65);
 assert.equal(NEW_ENEMIES.length,18);assert.equal(NEW_BOSSES.length,6);
 const questIds=new Set;for(const q of QUESTS){assert.ok(!questIds.has(q.id));questIds.add(q.id);assert.ok(Object.values(ZONES).some(z=>z.objects.some(o=>o.id===q.npc)),q.npc);for(const o of q.objectives){if(o.type==='collect')assert.ok(ITEM_TEMPLATES[o.id]);if(o.type==='kill')assert.ok(ENEMIES[o.id]);if(o.type==='interact')assert.ok(Object.values(ZONES).some(z=>z.objects.some(a=>a.id===o.id)));}if(q.requires)assert.ok(QUESTS.some(a=>a.id===q.requires));}
 const seen=new Set(['village']),queue=['village'];while(queue.length){const id=queue.shift();for(const o of ZONES[id].objects.filter(o=>o.to)){assert.ok(ZONES[o.to]);assert.ok(pathfind(o.to,ZONES[o.to].spawn,o.entry,{switch:true}).length||Math.hypot(o.entry.x-ZONES[o.to].spawn.x,o.entry.y-ZONES[o.to].spawn.y)<1,`${id} -> ${o.to} entry`);if(!seen.has(o.to)){seen.add(o.to);queue.push(o.to);}}}assert.equal(seen.size,18);
 const frames=new Set;for(const mob of [...NEW_ENEMIES,...NEW_BOSSES]){assert.ok(Object.values(ZONES).some(z=>z.enemies.some(e=>e.type===mob.id)),mob.id);assert.equal(ENEMIES[mob.id].sheet,'frontier');assert.ok(!frames.has(mob.frame));frames.add(mob.frame);assert.ok(ITEM_TEMPLATES[mob.loot]);}
});
test('all seven classes can finish the complete legacy chain and receive exactly their own level-40 legendary',()=>{
 for(const classId of Object.keys(LEGENDARY40)){
  const sim=new Simulation(null,()=>.99),h=sim.addPlayer(classId,'Легенда');
  assert.equal(questAvailable(h,QUESTS.find(q=>q.id==='legacy-weapon')),false);
  for(const id of LEGACY_QUEST_IDS){
   const q=QUESTS.find(q=>q.id===id);h.level=q.level;atNPC(sim,h,q.npc);cmd(sim,h,'questAccept',{id});
   for(const o of q.objectives){
    if(o.type==='interact'){const obj=ZONES[sim.s.zone].objects.find(a=>a.id===o.id);h.x=obj.x+.5;h.y=obj.y+.5;cmd(sim,h,'interact',{id:obj.id});}
    if(o.type==='kill')for(let n=0;n<o.count;n++){const t=ENEMIES[o.id];sim.kill({...structuredClone(t),type:o.id,id:uid(),x:h.x,y:h.y,dead:true},h.id);}
    if(o.type==='collect')while(h.inventory.filter(i=>i.template===o.id).length<o.count)h.inventory.push(createItem(o.id,h.id));
   }
   const npc=ZONES[sim.s.zone].objects.find(a=>a.id===q.npc);h.x=npc.x+.5;h.y=npc.y+.5;
   assert.ok(questsForNPC(h,q.npc).some(a=>a.id===id));cmd(sim,h,'questClaim',{id});assert.equal(h.quests[id].status,'completed');
  }
  const weapon=h.inventory.find(i=>i.template==='legendary-'+classId+'-40');assert.ok(weapon,classId);
  assert.equal(ITEM_TEMPLATES[weapon.template].requirements.level,40);assert.equal(ITEM_TEMPLATES[weapon.template].rarity,'legendary');assert.ok(ITEM_TEMPLATES[weapon.template].bound);
  assert.ok(equip(h,weapon.id));assert.throws(()=>cmd(sim,h,'questClaim',{id:'legacy-weapon'}));
  const other=sim.addPlayer(classId,'Союзник');other.x=h.x;other.y=h.y;h.equipment.weapon=null;
  assert.throws(()=>cmd(sim,h,'offer',{item:weapon.id,to:other.id}));
  h.level=39;assert.equal(equip(h,weapon.id),false);h.level=40;
  const wrong=createItem('legendary-'+(classId==='mage'?'archer':'mage')+'-40',h.id);h.inventory.push(wrong);assert.equal(equip(h,wrong.id),false);
  const restored=new Simulation(structuredClone(sim.s));assert.ok(restored.s.players[h.id].inventory.some(i=>i.id===weapon.id));assert.equal(restored.s.players[h.id].quests['legacy-weapon'].status,'completed');
 }
});
test('castle floors enforce level and completed legacy trial before opening the throne tower',()=>{
 const sim=new Simulation(),h=sim.addPlayer('mage','Тест');sim.s.zone='castlevault';const gate=ZONES.castlevault.objects.find(o=>o.to==='castlespire');h.x=gate.x+.5;h.y=gate.y+.5;h.level=40;
 assert.throws(()=>cmd(sim,h,'interact',{id:gate.id}),/Зоряне горно/);
 h.quests['legacy-trial']={status:'completed'};h.level=39;assert.throws(()=>cmd(sim,h,'interact',{id:gate.id}),/40/);
 h.level=40;cmd(sim,h,'interact',{id:gate.id});assert.equal(sim.s.zone,'castlespire');
});
test('every new boss telegraphs its distinct hazard and sets its permanent victory flag',()=>{
 const patterns=new Set;
 for(const definition of NEW_BOSSES){const sim=new Simulation(null,()=>0),h=sim.addPlayer('mage','Тест'),z=Object.values(ZONES).find(z=>z.enemies.some(e=>e.type===definition.id));sim.s.zone=z.id;sim.populate();const e=sim.s.enemies.find(e=>e.type===definition.id);sim.s.enemies=[e];h.level=e.level;h.hp=derive(h).hp;h.x=e.x;h.y=e.y+1;e.specialCd=0;e.cd=100;
  const hp=h.hp;sim.update(.1);assert.ok(sim.s.hazards.length,definition.id);assert.equal(h.hp,hp);
  const hazard=sim.s.hazards[0];assert.equal(hazard.effect,definition.bossPattern.effect);assert.ok(hazard.total>=2.2);patterns.add(hazard.label);
  sim.kill(e,h.id);assert.equal(sim.s.flags[definition.bossFlag],true);assert.equal(sim.s.flags.zoneBosses[z.id],true);
 }
 assert.equal(patterns.size,6);
});
