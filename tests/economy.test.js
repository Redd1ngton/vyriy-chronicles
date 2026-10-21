import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../dist/core/simulation.js?v=0.3.1';
import {ZONES,ITEM_TEMPLATES,ENEMIES} from '../dist/content/region.js?v=0.3.1';
import {CLASSES,skillFor} from '../dist/content/classes.js?v=0.3.1';
import {ECHO_PRICE,salePrice,afterglow} from '../dist/content/economy.js?v=0.3.1';
import {createItem,uid,derive,has,tickEffects} from '../dist/core/rules.js?v=0.3.1';
const cmd=(sim,h,type,data={},op=uid())=>sim.command(h.id,{type,...data,op,round:sim.s.round});
test('inventory sale supports gear and stacks, rejects protected items, and cannot duplicate credit',()=>{
 const sim=new Simulation(),h=sim.addPlayer('mage','Тест'),armor=createItem('armor',h.id);h.inventory.push(armor);const coins=h.zeny,op=uid();
 cmd(sim,h,'sell',{id:armor.id},op);assert.equal(h.zeny,coins+25);assert.ok(!h.inventory.some(i=>i.id===armor.id));cmd(sim,h,'sell',{id:armor.id},op);assert.equal(h.zeny,coins+25);
 assert.throws(()=>cmd(sim,h,'sell',{id:h.equipment.weapon}));
 for(let i=0;i<4;i++)h.inventory.push(createItem('dew',h.id));const dew=h.inventory.find(i=>i.template==='dew');const z=h.zeny;cmd(sim,h,'sell',{id:dew.id,count:4});assert.equal(h.zeny,z+16);assert.equal(h.inventory.filter(i=>i.template==='dew').length,0);
 const legendary=createItem('legendary-mage-40',h.id),quest=createItem('regentcrown',h.id);h.inventory.push(legendary,quest);for(const item of [legendary,quest]){const before=h.zeny;assert.throws(()=>cmd(sim,h,'sell',{id:item.id}));assert.equal(h.zeny,before);assert.ok(h.inventory.some(i=>i.id===item.id));}
 const potion=h.inventory.find(i=>i.template==='potion');assert.throws(()=>cmd(sim,h,'sell',{id:potion.id,count:-1}));assert.throws(()=>cmd(sim,h,'sell',{id:potion.id,count:999}));
 const other=sim.addPlayer('archer','Союзник');other.x=h.x;other.y=h.y;cmd(sim,h,'offer',{item:potion.id,to:other.id});assert.throws(()=>cmd(sim,h,'sell',{id:potion.id}));
});
test('echo conversion requires merchant, charges a fixed price and rejects malformed quantities',()=>{
 const sim=new Simulation(),h=sim.addPlayer('merchant','Тест');h.zeny=ECHO_PRICE*6;assert.throws(()=>cmd(sim,h,'buyEchoes',{count:1}));const npc=ZONES.village.objects.find(o=>o.id==='echo-exchanger');h.x=npc.x;h.y=npc.y;assert.throws(()=>cmd(sim,h,'buy',{template:'legendary-merchant-40'}));const op=uid();cmd(sim,h,'buyEchoes',{count:5},op);assert.equal(h.echoes,5);assert.equal(h.zeny,ECHO_PRICE);cmd(sim,h,'buyEchoes',{count:5},op);assert.equal(h.echoes,5);
 for(const count of [-1,0,1.5,11,NaN])assert.throws(()=>cmd(sim,h,'buyEchoes',{count}));assert.throws(()=>cmd(sim,h,'buyEchoes',{count:2}));
});
test('tuning is per-skill, spends echoes once, enforces learning, level and maximum rank',()=>{
 const sim=new Simulation(),h=sim.addPlayer('mage','Тест');h.echoes=200;const id='firebolt';assert.throws(()=>cmd(sim,h,'skillTune',{id,key:'crit'}));h.level=40;
 cmd(sim,h,'skillTune',{id,key:'crit'});assert.equal(h.echoes,197);assert.equal(skillFor(h,id).critBonus,.02);assert.equal(skillFor(h,'frost').critBonus,0);
 for(let n=1;n<5;n++)cmd(sim,h,'skillTune',{id,key:'crit'});assert.equal(skillFor(h,id).critBonus,.1);const before=h.echoes;assert.throws(()=>cmd(sim,h,'skillTune',{id,key:'crit'}));assert.equal(h.echoes,before);
 assert.throws(()=>cmd(sim,h,'skillTune',{id:'ward',key:'afterglow'}));assert.throws(()=>cmd(sim,h,'skillTune',{id,key:'__proto__'}));h.cast={};assert.throws(()=>cmd(sim,h,'skillTune',{id,key:'afterglow'}));h.cast=null;
 const old=structuredClone(sim.s);delete old.players[h.id].echoes;delete old.players[h.id].skillTuning;const migrated=new Simulation(old);assert.equal(migrated.s.players[h.id].echoes,0);assert.deepEqual(migrated.s.players[h.id].skillTuning,{});
 const restored=new Simulation(structuredClone(sim.s));assert.equal(restored.s.players[h.id].echoes,h.echoes);assert.equal(skillFor(restored.s.players[h.id],id).critBonus,.1);
});
test('critical tuning changes actual skill damage and leaves ordinary attacks unchanged',()=>{
 const sim=new Simulation(null,()=>.1),h=sim.addPlayer('mage','Тест');h.level=40;h.skillTuning.firebolt={crit:5};const e={...ENEMIES.slime,id:'dummy',type:'slime',x:h.x+1,y:h.y,hp:100000,maxHp:100000,damageBy:{},effects:[],dead:false};sim.s.enemies=[e];const base=skillFor(h,'firebolt');let before=e.hp;sim.strike(h,e,{...base,critBonus:0});const normal=before-e.hp;before=e.hp;sim.strike(h,e,base);assert.ok(before-e.hp>normal*1.4);
 const crit=derive(h).crit;assert.ok(crit<.1);h.skillTuning.firebolt.crit=0;assert.equal(derive(h).crit,crit);
});
test('class afterglow expires and is granted on cast completion, preserving stronger existing buffs',()=>{
 for(const classId of Object.keys(CLASSES)){const sim=new Simulation(),h=sim.addPlayer(classId,'Тест');const skill=CLASSES[classId].skills.find(s=>['self','allies','heal','dash','trap'].includes(s.kind));h.skillRanks[skill.id]=1;h.skillTuning[skill.id]={afterglow:1};const glow=afterglow(h,skill.id);assert.ok(glow);assert.ok(!has(h,glow.id));sim.finishSkill(h,{index:1,skill:skillFor(h,skill.id)});assert.ok(has(h,glow.id),classId);tickEffects(h,20);assert.ok(!has(h,glow.id));}
 const sim=new Simulation(),h=sim.addPlayer('swordsman','Тест');h.skillTuning.guard={afterglow:1};sim.finishSkill(h,{index:1,skill:skillFor(h,'guard')});assert.ok(h.effects.find(e=>e.id==='guard').left>=6);
});
test('echo farming gives boss guarantees and excludes monsters which give no experience',()=>{
 const sim=new Simulation(null,()=>0),h=sim.addPlayer('mage','Тест');h.level=20;const corpse=(level,boss)=>({id:uid(),name:'Ворог',type:'slime',level,boss,loot:'dew',x:h.x,y:h.y,dead:true});sim.kill(corpse(1,false),h.id);assert.equal(h.echoes,0);sim.kill(corpse(20,true),h.id);assert.equal(h.echoes,4);sim.kill(corpse(20,false),h.id);assert.equal(h.echoes,5);
 assert.ok(salePrice(ITEM_TEMPLATES.potion,{quality:0})<ITEM_TEMPLATES.potion.price*.9);
});
