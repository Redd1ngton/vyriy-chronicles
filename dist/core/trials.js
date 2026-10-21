import {TRIALS,TRIAL_RECIPES,trialChoices} from '../content/trials.js?v=0.9.0';
import {ENEMIES} from '../content/region.js?v=0.3.1';
import {createItem,derive,uid,lineOfSight} from './rules.js?v=0.3.1';
import {worldObjects,openPoint} from './encounters.js?v=0.6.0';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const activeTrial=s=>s.dungeonRun?.status==='active'&&TRIALS[s.dungeonRun.trial]?s.dungeonRun:null;
export function initTrials(h){h.trials??={best:0,recipes:false,appearance:false,equipped:false};}
export function syncTrialHealing(s){const run=activeTrial(s);for(const h of Object.values(s.players)){if(run)h.healingScale=TRIALS[run.trial].healing;else delete h.healingScale;}}
export function configureTrial(sim,tier){
 const d=TRIALS[tier];if(!d)return;const run=sim.s.dungeonRun;run.trial=tier;run.participants=Object.values(sim.s.players).filter(h=>h.online).map(h=>h.id);
 run.affix=sim.s.round%2?'draining':'relentless';run.nextPulse=sim.s.clock+6;run.trapIds=[];
 const level=Math.min(85,Math.max(40,...run.participants.map(id=>sim.s.players[id].level))+tier-1);
 for(const e of sim.s.enemies){const base=ENEMIES[e.type],next=Math.max(level,e.level),ratio=(1+Math.max(0,next-base.level)*.16)/(1+Math.max(0,e.level-base.level)*.16);e.hp=e.maxHp=Math.round(e.maxHp*ratio*d.hp);e.atk=Math.round(e.atk*d.atk*(1+Math.max(0,next-e.level)*.045));e.def+=(next-e.level)*.7;e.mdef+=(next-e.level)*.6;e.level=next;e.trialAffix=run.affix;if(run.affix==='relentless'){e.period*=.8;e.speed*=1.12;}e.name=(run.affix==='draining'?'Пожирач відлунь · ':'Невтомний · ')+e.name;}
 for(const id of run.guards){const guard=sim.s.enemies.find(e=>e.id===id),p=openPoint(sim,{x:guard.home.x+2,y:guard.home.y});const trap={id:uid(),kind:'trialTrap',name:'Зоряний розлом · відійдіть із кола',...p,art:null};sim.s.encounterObjects.push(trap);run.trapIds.push(trap.id);}
 syncTrialHealing(sim.s);sim.event('story',{text:'Випробування '+d.name+' · рівень ворогів '+level+' · лікування '+Math.round(d.healing*100)+'%. Привал не лікує до завершення. Розломи спалахують кожні 6 с.'});
}
export function tickTrials(sim){
 syncTrialHealing(sim.s);const run=activeTrial(sim.s);if(!run||sim.s.clock<run.nextPulse)return;run.nextPulse=sim.s.clock+6;
 for(const o of sim.s.encounterObjects.filter(o=>run.trapIds.includes(o.id))){sim.s.hazards.push({id:uid(),kind:'trial',x:o.x,y:o.y,radius:1.65,inner:0,left:1.8,total:1.8,source:o.id,atk:70+run.trial*35+Math.max(...run.participants.map(id=>sim.s.players[id]?.level||40))*2,effect:'exposed',duration:3,color:0xe4b35d,label:'Зоряний розлом · 1.8 с'});}
}
export function completeTrial(sim,nearby){const run=sim.s.dungeonRun;if(!TRIALS[run?.trial])return;for(const h of nearby){if(!run.participants.includes(h.id))continue;initTrials(h);h.trials.best=Math.max(h.trials.best,run.trial);h.trials.recipes=true;if(run.trial>=2)h.trials.appearance=true;h.echoes+=TRIALS[run.trial].echoes;sim.event('loot',{actor:h.id,text:'Випробування завершено: відкрито два рецепти'+(run.trial>=2?' та зоряну ауру':'')+'. Посилена реліквія — серед нагород експедиції.'});}syncTrialHealing(sim.s);sim.s.hazards=sim.s.hazards.filter(h=>h.kind!=='trial');}
export function trialCommand(sim,h,i){
 if(!['trialCraft','trialAppearance'].includes(i.type))return null;initTrials(h);if(h.dead||activeTrial(sim.s))throw Error('Завершіть бій або випробування');
 if(i.type==='trialAppearance'){if(!h.trials.appearance)throw Error('Завершіть випробування II або III');h.trials.equipped=!h.trials.equipped;return{};}
 const r=TRIAL_RECIPES[i.recipe];if(!Object.hasOwn(TRIAL_RECIPES,i.recipe)||!h.trials.recipes||h.level<40)throw Error('Рецепти відкриваються після випробування від рівня 40');
 if(!worldObjects(sim.s).some(o=>o.kind==='forge'&&dist(h,o)<3&&lineOfSight(sim.s.zone,h,o,sim.s.flags))||sim.s.enemies.some(e=>!e.dead&&e.aggroTarget===h.id&&dist(e,h)<8))throw Error('Поверніться до кузні поза боєм');
 const free=h.inventory.filter(a=>!a.favorite&&!Object.values(h.equipment).includes(a.id)&&!sim.s.offers.some(o=>o.item===a.id&&o.status==='pending'));
 const ore=free.filter(a=>a.template==='ore').slice(0,r.ore),shards=free.filter(a=>a.template==='embershard').slice(0,r.shards);
 if(ore.length<r.ore||shards.length<r.shards||h.zeny<r.zeny)throw Error('Бракує вільних матеріалів або Zeny');
 const ids=new Set([...ore,...shards].map(a=>a.id));h.inventory=h.inventory.filter(a=>!ids.has(a.id));h.zeny-=r.zeny;h.inventory.push(createItem(r.out,h.id));return{};
}
export function validateTrials(h){const t=h.trials;if(t!==undefined&&(!t||!Number.isInteger(t.best)||t.best<0||t.best>3||['recipes','appearance','equipped'].some(k=>typeof t[k]!=='boolean')||t.recipes&&t.best<1||t.appearance&&t.best<2||t.equipped&&!t.appearance))throw Error('Невірні випробування');}
export {trialChoices};
