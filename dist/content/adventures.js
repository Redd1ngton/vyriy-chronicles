// Shared rules for repeatable expeditions and equipment sinks.
export const DUNGEONS={crystalmine:{level:24,name:'Серце синьої копальні'},castlehalls:{level:30,name:'Дозор Багряних залів'},castlevault:{level:35,name:'Тіні під замком'},frostcrypt:{level:62,name:'Пробудження крижаної крипти'}};
export const ELITES={armored:{name:'Панцирний',desc:'Більше броні',color:0xe5c782},venomous:{name:'Отруйний',desc:'Отруює ударами',color:0xa7d574},raging:{name:'Несамовитий',desc:'Швидші й сильніші атаки',color:0xef958b}};
export const AUGMENTS={force:{name:'Міць',desc:'+20% шкоди й лікування; +25% тривалості ефектів. Вартість SP +15%.'},rhythm:{name:'Ритм',desc:'Вартість SP −20%, відновлення −15%. Шкода й лікування −10%.'}};
export function makeElite(e,key){if(e.boss||e.elite)return e;let mod=ELITES[key];if(!mod)return e;e.elite=key;e.name=mod.name+' '+e.name;e.maxHp=Math.round(e.maxHp*1.8);e.hp=e.maxHp;e.atk=Math.round(e.atk*1.15);if(key==='armored'){e.def*=1.6;e.mdef*=1.6;}if(key==='venomous')e.onHit='poison';if(key==='raging'){e.period*=.7;e.atk=Math.round(e.atk*1.2);}return e;}
export const forgeCost=item=>({shards:2+(item.quality||0)*2,zeny:400*((item.quality||0)+1)**2});
export const salvageYield=item=>1+(item.quality||0)*2+(item.rarity==='epic'?3:item.rarity==='rare'?1:0);
export function mutableGear(h,item,offers=[],salvage=false){return !!item&&item.owner===h.id&&!Object.values(h.equipment).includes(item.id)&&!offers.some(o=>o.item===item.id&&o.status==='pending')&&(!salvage||!item.bound);}
