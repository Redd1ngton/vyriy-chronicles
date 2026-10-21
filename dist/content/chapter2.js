// The roads of four seasons: permanent content, no runtime generation or paid calls.
export const LEGENDARY40={
 swordsman:{name:'Світанковий Оберіг',weapon:'sword',stats:{atk:112,def:20,hp:160}},
 mage:{name:'Посох Семи Сузір’їв',weapon:'staff',stats:{matk:122,sp:130,mdef:18}},
 archer:{name:'Тятива Вічної Весни',weapon:'bow',stats:{atk:114,haste:.12,hp:90}},
 acolyte:{name:'Світло Першої Берегині',weapon:'staff',stats:{matk:110,sp:150,hp:150}},
 merchant:{name:'Серце Зоряного Горна',weapon:'hammer',stats:{atk:115,def:24,hp:180}},
 thief:{name:'Північний Шепіт',weapon:'dagger',stats:{atk:105,haste:.18,mdef:18}},
 gunslinger:{name:'Останній Аргумент Вирію',weapon:'gun',stats:{atk:118,haste:.10,sp:80}}
};
const mob=(id,name,level,frame,ai,loot,role,extra={})=>({id,name,level,sheet:'frontier',frame,ai,loot,role,hp:80+level*19,atk:13+level*3,def:5+level*.8,mdef:4+level*.7,range:['ranged','poison','curse','fire'].includes(ai)?5:1.6,speed:ai==='chase'?3.1:ai==='flank'?3.5:1.65,period:ai==='flank'?1.6:2.5,aggression:'aggressive',aggroRange:4.5,leash:11,art:frame,color:'#b7cda7',...extra});
export const NEW_ENEMIES=[
 mob('springbeetle','Квітковий панцирник',7,0,'melee','pollen','Повільний панцирний захисник; вразливий до магії',{aggression:'passive',def:30,mdef:4}),
 mob('thornmantis','Тернова богомолиця',10,1,'poison','thorn','Отруює здалеку; переривайте зближення'),
 mob('spirithare','Рогатий луговик',12,2,'flank','spiritfur','Швидко обходить ціль',{aggression:'passive'}),
 mob('sandscorpion','Бурштиновий скорпіон',15,3,'poison','venom','Отруйний хвіст; високий фізичний захист'),
 mob('redjackal','Червоний шакал',17,4,'chase','fang','Переслідувач караванних стежок'),
 mob('sunscarab','Сонячний скарабей',19,5,'fire','sunglass','Вогняні снаряди й відступ зблизька',{aggression:'passive'}),
 mob('autumnfox','Лис опалого листя',21,6,'flank','amberleaf','Маневрений мешканець осіннього гаю'),
 mob('scarecrow','Жнивар без обличчя',24,7,'melee','strawseal','Повільний, але сильно б’є серпом',{atk:105,period:3.2}),
 mob('thorndryad','Дріада багряного терну',26,8,'curse','thorn','Прокляття послаблює лікування'),
 mob('crystalspider','Кришталевий павук',25,9,'poison','silk','Отруйні спори кришталевих нір'),
 mob('cavesalamander','Сліпа саламандра',28,10,'fire','cavecrystal','Обстрілює вузькі проходи'),
 mob('ironmole','Кріт рудного дозору',30,11,'melee','ironseal','Важка броня; підходить магічний удар',{def:70,mdef:12}),
 mob('frosthound','Морозний гончак',51,12,'chase','frostfang','Швидкий удар зі сповільненням',{onHit:'slow'}),
 mob('snowraven','Сніговий крук',56,13,'flank','icefeather','Облітає захисника й атакує з флангу'),
 mob('icerevenant','Крижаний поверненець',65,14,'melee','icerune','Накопичує захист у крижаному обладунку',{def:100,onHit:'slow'}),
 mob('castleward','Копійник Багряної варти',29,15,'ranged','wardmedal','Тримає дистанцію; відступає від ближнього бою',{range:4}),
 mob('courtduelist','Дуеліста без імені',34,16,'flank','duelistseal','Швидка рапіра й часті випади',{period:1.8}),
 mob('candlewraith','Свічковий привид',37,17,'curse','candlewax','Дальнє прокляття; низький фізичний захист',{def:8,mdef:70})
];
const boss=(id,name,level,frame,pattern,loot,extra={})=>mob(id,name,level,frame,'boss',loot,'Бос · '+pattern.label,{boss:true,hp:800+level*95,atk:22+level*3.4,def:15+level,mdef:12+level*.8,range:2.4,speed:1.35,aggroRange:5,leash:14,bossPattern:pattern,...extra});
export const NEW_BOSSES=[
 boss('bloomleshy','Кореневий князь Цвітан',14,18,{label:'Коріння весни',radius:3.2,delay:2.4,effect:'root',duration:2,color:0x83b77a,damage:1.6},'springheart',{bossFlag:'bloomCleansed'}),
 boss('sandqueen','Цариця бурштинових жал',22,19,{label:'Отруйна піщана хвиля',radius:4.4,delay:2.7,effect:'poison',duration:5,color:0xd4ad54,damage:1.6},'suncrown',{bossFlag:'dunesCleansed'}),
 boss('autumnsovereign','Багряна Пані',28,20,{label:'Кільце опалого листя',radius:4.8,inner:1.8,delay:2.6,effect:'curse',duration:5,color:0xd57945,damage:1.8},'autumnheart',{bossFlag:'autumnCleansed'}),
 boss('crystalmatriarch','Матір обсидіанової павутини',32,21,{label:'Кришталева пастка',radius:3.8,delay:2.2,effect:'root',duration:2,color:0x839fe6,damage:1.9},'matriarchgem',{bossFlag:'mineCleansed'}),
 boss('scarletregent','Безіменний Регент',40,23,{label:'Королівський вирок',radius:4.6,inner:1.6,delay:2.8,effect:'exposed',duration:6,color:0xc75b68,damage:2},'regentcrown',{bossFlag:'regentFallen'}),
 boss('frostking','Король Порожньої Зими',72,22,{label:'Подих порожньої зими',radius:5.2,inner:2,delay:3,effect:'slow',duration:5,color:0x90d7ef,damage:2.1},'winterheart',{bossFlag:'winterCleansed'})
];
const materialNames={pollen:'Зоряний пилок',thorn:'Багряний терен',spiritfur:'Примарне хутро',venom:'Бурштинова отрута',fang:'Звіряче ікло',sunglass:'Сонячне скло',amberleaf:'Бурштиновий листок',strawseal:'Жниварська печать',silk:'Кришталева павутина',cavecrystal:'Печерний кришталь',ironseal:'Рунна залізна скоба',frostfang:'Крижане ікло',icefeather:'Снігове перо',icerune:'Крижана руна',wardmedal:'Медаль Багряної варти',duelistseal:'Печатка дуелянта',candlewax:'Примарний віск',springheart:'Серце весняного коріння',suncrown:'Бурштинова корона',autumnheart:'Серце багряного гаю',matriarchgem:'Камінь Матері павутини',regentcrown:'Зламана корона Регента',winterheart:'Серце порожньої зими'};
const stories=[
 ['springvale','Долина першого цвіту','spring',6,14,'vesna','Садівниця Весна','Після довгої зими квіти розпускаються зі скляними пелюстками. Цвітан тримає в корінні перше ім’я зоряного коваля.',['springbeetle','thornmantis','spirithare'],'bloomleshy'],
 ['sunreach','Бурштинові дюни','summer',14,22,'nazar','Караванник Назар','Тут літо не закінчується. Каравани зникли між пісками, а скарабеї несуть сонячне скло до корони цариці.',['sandscorpion','redjackal','sunscarab'],'sandqueen'],
 ['autumnwood','Гай останнього листя','autumn',20,28,'mavka','Мавка Рута','Листя зберігає голоси зниклих. Не віддавай Пані своє ім’я — спершу поверни голоси деревам.',['autumnfox','scarecrow','thorndryad'],'autumnsovereign'],
 ['crystalmine','Копальні синього відлуння','crystal',24,32,'ostap','Шахтар Остап','Ми чули власні голоси з покинутих штреків. Кришталь пам’ятає схему зброї, але павутина не відпускає його без бою.',['crystalspider','cavesalamander','ironmole'],'crystalmatriarch'],
 ['castlecourt','Багряний замок · передмістя','autumn',26,34,'kastelian','Кастелян Богдан','Регент викреслив мешканців із літопису. Поверни прапор варти й відкрий шлях до зал.',['castleward','courtduelist'],null],
 ['castlehalls','Багряний замок · зали I','castle',30,38,'archivist','Архіварка Зоряна','На першому поверсі портрети пам’ятають людей краще, ніж живі. У сховищі є остання сторінка креслення.',['courtduelist','candlewraith','castleward'],null],
 ['castlevault','Багряний замок · підземелля II','vault',35,42,'starforger','Зоряний коваль Тарас','Я викую одну зброю саме для твого шляху. Але спершу доведи, що корона більше не тримає твоє ім’я.',['ironmole','candlewraith','courtduelist'],null],
 ['castlespire','Багряний замок · тронна вежа III','castle',38,45,'sentinel','Вартова без імені','За цими сходами Регент. Його вирок залишає безпечною середину кільця; стеж за червоними знаками.',['castleward','courtduelist','candlewraith'],'scarletregent'],
 ['winterhold','Замок снігового сонця · двір','winter',48,64,'olenka','Доглядачка Оленка','Сонце завмерло над снігом. Збери уламки тепла, перш ніж спускатися під крижані мури.',['frosthound','snowraven','icerevenant'],null],
 ['frostcrypt','Замок снігового сонця · крипта','frost',62,78,'moroz','Літописець Мороз','Король називає спокій порожнечею. Його подих заморожує весь зовнішній круг — тримайся ближче або відійди за край.',['icerevenant','snowraven','frosthound'],'frostking']
];
const palettes={spring:['#647d66','#789575','#91aa82'],summer:['#9d8259','#b59a69','#c8ad7d'],autumn:['#79674c','#8f7855','#a48c61'],crystal:['#363951','#434665','#515879'],castle:['#494952','#59585f','#696772'],vault:['#34373f','#434650','#53555e'],winter:['#91a4ab','#afc0c2','#c4d2cd'],frost:['#596e82','#70899d','#94adbc']};
export function installChapterTwo(Z,E,I){
 for(const e of [...NEW_ENEMIES,...NEW_BOSSES]){E[e.id]={...e};delete E[e.id].id;}
 for(const [id,name]of Object.entries(materialNames))I[id]??={name,kind:'material',icon:'◈',price:12,stats:{},requirements:{level:1}};
 I.regentcrown.kind='quest';I.regentcrown.price=0;
 for(const [id,l]of Object.entries(LEGENDARY40))I['legendary-'+id+'-40']={...l,kind:'weapon',slot:'weapon',icon:'✦',rarity:'legendary',bound:true,price:0,requirements:{level:40,classes:[id]},desc:'Особиста легенда зоряного горна. Єдина нагорода за ланцюжок «Спадщина семи шляхів». Не продається й не передається.'};
 for(const [id,name,theme,min,max,npcId,npcName,dialogue,types,bossId]of stories){
  const dungeon=['crystal','castle','vault','frost'].includes(theme),size=dungeon?56:62;
  const roads=[{x:6,y:8,w:5,h:44},{x:8,y:35,w:41,h:5},{x:44,y:8,w:5,h:32},{x:8,y:8,w:41,h:5},{x:25,y:8,w:5,h:31}];
  const rooms=[{x:3,y:40,w:14,h:13},{x:3,y:28,w:16,h:14},{x:18,y:28,w:16,h:15},{x:19,y:4,w:16,h:17},{x:38,y:4,w:14,h:17},{x:38,y:28,w:14,h:15}];
  const objects=[{id:npcId,kind:'npc',name:npcName,x:12,y:37,art:'acolyte',dialogue},
   {id:id+'-camp',kind:'camp',name:'Безпечний привал · '+npcName,x:8,y:44,art:12},
   {id:id+'-record',kind:'relicQuest',name:'Знак пам’яті · '+name,x:27,y:15,art:11,sceneryFrame:theme==='crystal'?7:theme==='winter'||theme==='frost'?13:4,questItem:id+'-memory'},
   {id:id+'-relic',kind:'relicQuest',name:id==='castlevault'?'Зоряне горно':'Загублений літопис · '+name,x:46,y:32,art:9,sceneryFrame:id==='castlevault'?14:undefined,questItem:id+'-relic-item'},
   {id:id+'-cache',kind:'chest',name:'Скриня мандрівників',x:27,y:37,art:9}];
  const enemies=[];for(let n=0;n<6;n++){const type=types[n%types.length],t=E[type];const [x,y]=[[15,36],[27,25],[46,27],[20,9],[36,9],[46,17]][n];enemies.push({type,level:Math.min(max-2,Math.max(min,t.level)+Math.floor(n/3)),x,y,count:n%3===0?3:2});}
  if(bossId)enemies.push({type:bossId,level:E[bossId].level,x:46,y:9,count:1});
  Z[id]={id,name,theme,kind:dungeon?'dungeon':'forest',size,spawn:{x:8,y:48},levels:[min,max],sight:dungeon?11:15,palette:palettes[theme],roads,water:dungeon?[]:[{x:14,y:17,w:8,h:12},{x:34,y:45,w:15,h:9}],walls:dungeon?[{x:32,y:23,w:5,h:2}]:[],floorRooms:dungeon?rooms:[],houses:[],objects,enemies,
   scenery:[{frame:theme==='spring'?4:theme==='summer'?5:theme==='autumn'?6:theme==='crystal'?7:theme==='winter'?12:theme==='frost'?13:theme==='vault'?14:9,x:35,y:13,size:220},...(dungeon?[{frame:id==='castlespire'?11:10,x:41,y:39,size:180},{frame:8,x:34,y:37,size:190}]:[])]};
  const look={vesna:['heroes',8],nazar:['extra',4],mavka:['heroes',4],ostap:['extra',4],kastelian:['heroes',0],archivist:['extra',8],starforger:['extra',4],sentinel:['heroes',0],olenka:['extra',0],moroz:['heroes',4]}[npcId];objects[0].npcSheet=look[0];objects[0].npcFrame=look[1];
  for(const suffix of ['memory','relic-item'])I[id+'-'+suffix]={name:(suffix==='memory'?'Знак пам’яті':'Сторінка літопису')+' · '+name,kind:'quest',icon:'▤',price:0,stats:{},requirements:{level:1},desc:'Сюжетний предмет. Не продається й не передається.'};
 }
 const portal=(a,b,id,x,y,min=1,requires=null,requiresQuest=null)=>{Z[a].objects.push({id,kind:'portal',name:'→ '+Z[b].name,x,y,to:b,entry:{...Z[b].spawn},art:1,sceneryFrame:Z[a].kind==='dungeon'?10:({spring:4,summer:5,autumn:6,winter:12,frost:13,crystal:7}[Z[b].theme||Z[a].theme]??9),minLevel:min,requires,requiresQuest});};
 const link=(a,b,id,x,y,min=1,requires=null,requiresQuest=null)=>{portal(a,b,id,x,y,min,requires,requiresQuest);portal(b,a,id+'-return',8,50);Z[b].objects.at(-1).entry={x,y:y-1};};
 link('village','springvale','spring-road',17,26,6);
 link('forest','sunreach','dunes-road',39,35,14);
 link('marsh','autumnwood','autumn-road',40,35,20);
 link('autumnwood','crystalmine','mine-stairs',46,38,24);
 link('abbey','castlecourt','castle-road',36,32,26);
 link('castlecourt','castlehalls','castle-floor-one',46,38,30);
 link('castlehalls','castlevault','castle-floor-two',46,38,35);
 link('castlevault','castlespire','castle-floor-three',46,38,40,null,'legacy-trial');
 link('cinder','winterhold','snow-castle-road',43,35,48);
 link('winterhold','frostcrypt','winter-crypt-stairs',46,38,62);
 portal('springvale','sunreach','summer-trail',46,38,14,'bloomCleansed');
 portal('sunreach','autumnwood','autumn-trail',46,38,20,'dunesCleansed');
 portal('crystalmine','castlecourt','mine-castle-passage',46,38,26,'mineCleansed');
 portal('castlespire','castlecourt','regent-shortcut',49,36,1,'regentFallen');
 Z.village.objects.push({id:'echo-exchanger',kind:'merchant',name:'Міняйла відлунь Сава',x:16,y:25,art:13});
 Z.castlevault.objects.push({id:'vault-exchanger',kind:'merchant',name:'Хранителька відлунь Ілона',x:10,y:43,art:13});
}
const quest=(id,npc,title,level,objectives,text,requires=null,item='classSet',xp=null)=>({id,npc,title,level,objectives,text,requires,reward:{xp:xp??Math.floor(180+level*level*16),zeny:70+level*24,item}});
export const NEW_QUESTS=[];
export const NEW_DIALOGUES={};
for(const [id,name,theme,min,max,npc,npcName,text,types,bossId]of stories){
 const creature=NEW_ENEMIES.find(e=>e.id===types[0]);
 NEW_QUESTS.push(quest(id+'-hunt',npc,'Відкрити стежки · '+name,min,[{type:'kill',id:types[0],count:6}],text+' Подолай шістьох: '+creature.name+'.'),
  quest(id+'-memory-quest',npc,'Пам’ять місця · '+name,min+1,[{type:'collect',id:id+'-memory',count:1}],"Знайди знак пам’яті біля північного перехрестя та поверни його мені."),
  quest(id+'-conclusion',npc,bossId?'Зняти прокляття · '+name:'Літопис загублених · '+name,Math.min(max,bossId?NEW_BOSSES.find(e=>e.id===bossId).level:min+4),bossId?[{type:'kill',id:bossId,count:1}]:[{type:'collect',id:id+'-relic-item',count:1}],'Поверни голос цій місцевості. '+(bossId?'Подолай її володаря й повернися по особисту нагороду.':'Знайди літопис у східному проході. У ньому збережено шлях до наступного поверху.'),id+'-memory-quest'));
 NEW_DIALOGUES[npc]=[{prompt:'Розкажи про це місце',answer:text},{prompt:'Де шукати знаки й літописи?',answer:'Північне перехрестя зберігає знак пам’яті. Літопис шукай на східній стежці. Входи між поверхами замку розташовані на сході; зворотні сходи — біля привалу.'}];
}
export const LEGACY_QUEST_IDS=['legacy-seed','legacy-sand','legacy-leaf','legacy-crystal','legacy-oath','legacy-archive','legacy-trial','legacy-weapon'];
NEW_QUESTS.push(
 quest('legacy-seed','vesna','Спадщина I · Насіння зорі',10,[{type:'collect',id:'pollen',count:5}],'П’ять часток зоряного пилку відкриють пам’ять коваля. Це початок восьми випробувань; фінал на 40 рівні дасть легендарну зброю саме твого класу.',null,'ether'),
 quest('legacy-sand','nazar','Спадщина II · Скло без сонця',15,[{type:'collect',id:'sunglass',count:5}],'Збери сонячне скло зі скарабеїв. Рута в осінньому гаю пам’ятає наступну частину формули.','legacy-seed','potion'),
 quest('legacy-leaf','mavka','Спадщина III · Голос листка',20,[{type:'interact',id:'autumnwood-record',count:1}],'Доторкнися до знака пам’яті гаю. Кришталь у копальні відгукнеться на його голос.','legacy-sand','ether'),
 quest('legacy-crystal','ostap','Спадщина IV · Відлуння в металі',25,[{type:'kill',id:'crystalspider',count:6},{type:'interact',id:'crystalmine-record',count:1}],'Звільни шість кришталевих павутин і прочитай знак. Кастелян Богдан зустріне тебе у передмісті Багряного замку.','legacy-leaf'),
 quest('legacy-oath','kastelian','Спадщина V · Присяга живим',30,[{type:'kill',id:'castleward',count:6},{type:'interact',id:'castlecourt-record',count:1}],'Поверни присягу варти людям. Після шістьох копійників і знака шукай Зоряну в залах першого поверху.','legacy-crystal'),
 quest('legacy-archive','archivist','Спадщина VI · Сторінка, що горить',35,[{type:'kill',id:'candlewraith',count:6},{type:'interact',id:'castlehalls-relic',count:1}],'Свічкові привиди спалюють креслення. Відбери в них шість вогнів і знайди східний літопис. Коваль чекає в підземеллі II.','legacy-oath'),
 quest('legacy-trial','starforger','Спадщина VII · Зоряне горно',38,[{type:'kill',id:'courtduelist',count:8},{type:'interact',id:'castlevault-relic',count:1}],'Вісім дуелей очистять горно. Торкнися його в східній залі й повернися — я відкрию сходи до Регента.','legacy-archive'),
 quest('legacy-weapon','starforger','Спадщина VIII · Твій власний Оберіг',40,[{type:'kill',id:'scarletregent',count:1},{type:'collect',id:'regentcrown',count:1}],'На 40 рівні піднімися до тронної вежі III, подолай Безіменного Регента й принеси його зламану корону. Я викую особисту легендарну зброю 40 рівня, придатну лише твоєму класу.','legacy-trial','classLegendary',60000)
);
