export const ECHO_PRICE=2500;
export const TUNING={
 crit:{name:'Точність душі',costs:[3,5,8,12,18],desc:'Кожен ранг: +2 відсоткові пункти критичного шансу саме цієї навички. Критична шкода/лікування ×1.5.'},
 afterglow:{name:'Післясвітіння',costs:[5,8,12,18,25],desc:'Короткий класовий ефект після успішного завершення цієї навички. Кожен ранг підсилює або подовжує його.'}
};
const CRIT_KINDS=['projectile','burst','melee','cone','area','heal'];
export const tuningRank=(h,id,key)=>h.skillTuning?.[id]?.[key]||0;
export const canTune=(skill,key)=>key!=='crit'||CRIT_KINDS.includes(skill.kind);
export const tuningCost=(h,id,key)=>TUNING[key]?.costs[tuningRank(h,id,key)]??null;
export function soulReward(level,boss=false){return boss?3+Math.floor(level/20):1;}
export const questSoulReward=q=>1+Math.floor(q.level/20);
export function salePrice(template,item){if(!template||template.bound||template.kind==='quest'||!template.price)return 0;return Math.max(1,Math.floor(template.price*(template.kind==='material'?1:.25)*(1+(item.quality||0)*.12)));}
export function afterglow(h,skillId){const rank=tuningRank(h,skillId,'afterglow');if(!rank)return null;
 const effects={swordsman:'guard',mage:'might',archer:'evasion',acolyte:'shield',merchant:'guard',thief:'leech',gunslinger:'might'};
 const id=effects[h.classId],duration=id==='evasion'?.3+rank*.2:id==='shield'?2+rank*.6:1.2+rank*.4;
 return{id,duration,potency:id==='shield'?10+rank*15+(h.stats.INT||0)*.4:0};
}
