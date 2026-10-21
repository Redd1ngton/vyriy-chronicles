import {RELICS} from './journeys.js?v=0.6.0';
export const TRIALS={
 1:{name:'Іскра',hp:1.2,atk:1.1,healing:.75,echoes:3},
 2:{name:'Гарт',hp:1.45,atk:1.25,healing:.6,echoes:5},
 3:{name:'Оберіг',hp:1.7,atk:1.4,healing:.45,echoes:8}
};
export const TRIAL_RECIPES={
 aegis:{name:'Оберіг зоряного гарту',out:'trial-aegis',ore:10,shards:6,zeny:800,stats:{hp:100,def:12,mdef:8}},
 focus:{name:'Фокус зоряного ковача',out:'trial-focus',ore:10,shards:6,zeny:800,stats:{sp:45,atk:10,matk:14}}
};
export const trialChoices=classId=>['trial-resources',...RELICS[classId].map(r=>'trial-relic-'+r.id)];
export function installTrials(I){
 for(const [classId,list] of Object.entries(RELICS))for(const r of list)I['trial-relic-'+r.id]={...I['relic-'+r.id],name:'Зоряний гарт · '+r.name,desc:r.desc+' Посилена реліквія випробувань 40+: +110 HP, +35 SP.',rarity:'legendary',stats:{hp:110,sp:35},requirements:{level:40,classes:[classId]}};
 for(const r of Object.values(TRIAL_RECIPES))I[r.out]={name:r.name,desc:'Особистий аксесуар за рецептом випробувань. Виготовлення біля кузні.',kind:'accessory',slot:'accessory',icon:'✧',rarity:'epic',bound:true,price:0,stats:r.stats,requirements:{level:40}};
}
