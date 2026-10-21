// Native content: no paid services, generated images or network dependencies.
export const RELICS = {
 swordsman: [
  {id:'emberblade',name:'Відлуння клинка',skill:'cleave',effect:'echo',desc:'Розтин повторюється через 0.7 с із 55% сили. Повтор не створює нових повторів.'},
  {id:'oathstone',name:'Камінь незламної присяги',skill:'guard',effect:'guardField',desc:'Вартою! залишає на 4 с коло захисту для союзників.'}
 ],
 mage: [
  {id:'fireprism',name:'Призма першого полум’я',skill:'firebolt',effect:'pierce',desc:'Вогняна стріла пробиває до двох ворогів за основною ціллю з 65% сили.'},
  {id:'frostheart',name:'Серце тихої зими',skill:'frost',effect:'frostField',desc:'Крижане коло залишає на 4 с морозне поле: шкода та сповільнення щосекунди.'}
 ],
 archer: [
  {id:'moonstring',name:'Вузол місячної тятиви',skill:'pierce',effect:'ricochet',desc:'Пробивна стріла рикошетить ще у двох ворогів поруч із 55% сили.'},
  {id:'thornseed',name:'Насіння тернового кола',skill:'trap',effect:'thornField',desc:'Спрацьована пастка залишає на 4 с терни, що отруюють і сповільнюють ворогів.'}
 ],
 acolyte: [
  {id:'dawnseal',name:'Печатка тихого світанку',skill:'heal',effect:'guardField',desc:'Світло життя залишає біля зціленого союзника на 4 с захисне коло.'},
  {id:'kindlebell',name:'Дзвін живого світла',skill:'bless',effect:'healField',desc:'Благословення залишає на 4 с коло, що лікує союзників на 2% MaxHP щосекунди.'}
 ],
 merchant: [
  {id:'forgecoal',name:'Вуглина першого горна',skill:'hammer',effect:'emberField',desc:'Удар горна залишає на 4 с жар, що завдає шкоди ворогам щосекунди.'},
  {id:'ironvow',name:'Обітниця рунного коваля',skill:'forge',effect:'wardGuard',desc:'Кована варта додатково дає кожному захищеному союзнику 2 с зменшення шкоди.'}
 ],
 thief: [
  {id:'venomfang',name:'Ікло зеленої тіні',skill:'venom',effect:'spread',desc:'Отруйний клинок уражає ще одного сусіднього ворога з 55% сили та тією ж отрутою.'},
  {id:'nightveil',name:'Вуаль безмовного кроку',skill:'veil',effect:'evade',desc:'Тіньова угода додатково дає 1.2 с ухилення від звичайних ударів.'}
 ],
 gunslinger: [
  {id:'thirdspark',name:'Третя іскра',skill:'burst',effect:'thirdShot',desc:'Подвійний постріл робить третій постріл із 70% сили.'},
  {id:'powderheel',name:'Порохова п’ята',skill:'roll',effect:'dashTrap',desc:'Бойовий перекат залишає на початковому місці отруйну пастку.'}
 ]
};
export const relicChoices = classId => RELICS[classId].map(r=>'relic-'+r.id);
export function activeRelic(h) {
 const item=h.inventory?.find(i=>i.id===h.equipment?.accessory);
 return item ? RELICS[h.classId]?.find(r=>'relic-'+r.id===item.template) : null;
}
export const ROUTES={
 safe:{name:'Західний обхід',desc:'Північна стежка через західну галерею. Три вартові, звичайна сила ворогів.',multiplier:1},
 risky:{name:'Східний склеп',desc:'Центральні зали й східна кімната зі скринею. Вороги: +30% HP, +20% атаки. Вища нагорода.',multiplier:1.4}
};
export const INCIDENTS={
 caravan:{name:'Засідка на караван',text:'Торговці забарикадували віз. Нападники повернуться за мить.',choices:[{id:'fight',name:'Захистити караван',desc:'Подолайте трьох нападників за 90 с.',fight:3},{id:'pay',name:'Викупити прохід',desc:'Сплатіть 25 × рівень місцевості Z. Без бойової нагороди.'}]},
 traveler:{name:'Загублений мандрівник',text:'Поранений подорожній просить допомоги. У хащах чути переслідувачів.',choices:[{id:'fight',name:'Захистити мандрівника',desc:'Подолайте двох переслідувачів за 90 с.',fight:2},{id:'potion',name:'Віддати червоне зілля',desc:'Витратьте одне зілля й отримайте жар-уламок.'}]},
 cursed:{name:'Скриня з чужим шепотом',text:'З-під кришки витікає тінь. Відкрити силою чи очистити печатку?',choices:[{id:'fight',name:'Зламати печатку',desc:'Прокляття на 8 с та троє ворогів, один елітний. Вища нагорода.',fight:3,elite:true},{id:'cleanse',name:'Очистити відлуннями',desc:'Витратьте 2 відлуння й отримайте 4 жар-уламки.'}]},
 hunt:{name:'Нічне полювання',text:'На стежку виходить тіньова зграя. Можна прийняти бій або відвести її приманкою.',choices:[{id:'fight',name:'Прийняти полювання',desc:'Подолайте трьох ворогів за 90 с.',fight:3},{id:'lure',name:'Залишити приманку',desc:'Витратьте два звірячі ікла й отримайте жар-уламок.'}]}
};
export function installJourneys(Z,I) {
 for(const [classId,list] of Object.entries(RELICS))for(const r of list)I['relic-'+r.id]={name:r.name,desc:r.desc,kind:'accessory',slot:'accessory',icon:'✧',rarity:'epic',bound:true,price:0,stats:{hp:60,sp:20},requirements:{level:20,classes:[classId]},relic:r.effect};
 for(const [zone,x,y] of [['village',14,25],['castlecourt',10,43],['winterhold',10,43]])Z[zone].objects.push({id:zone+'-storage',kind:'storage',name:'Скриня мандрівника',x,y,art:9});
 let index=0;
 for(const z of Object.values(Z)){
  if(z.id==='village'||z.kind==='dungeon')continue;
  const camp=z.objects.find(o=>o.kind==='camp');if(!camp)continue;
  const key=Object.keys(INCIDENTS)[index++%4];
  const inside=(x,y,r)=>x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h;const point=[[2,0],[-2,0],[0,-2],[0,2]].map(([dx,dy])=>({x:camp.x+dx,y:camp.y+dy})).find(p=>p.x>0&&p.y>0&&p.x<z.size-1&&p.y<z.size-1&&![...z.water,...z.walls,...z.houses].some(r=>inside(p.x,p.y,r)))||{x:camp.x,y:camp.y};z.objects.push({id:z.id+'-incident',kind:'journey',name:INCIDENTS[key].name,...point,art:9,incident:key});
 }
}
