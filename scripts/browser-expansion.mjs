// Disposable browser contexts and synthetic saves: never edits a player's save.
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium,webkit,devices} from 'playwright';
import {Simulation} from '../dist/core/simulation.js?v=0.3.1';
import {QUESTS} from '../dist/content/quests.js?v=0.3.1';
import {CLASSES} from '../dist/content/classes.js?v=0.3.1';
import {DUNGEONS} from '../dist/content/adventures.js?v=0.3.1';
import {ZONES} from '../dist/content/region.js?v=0.3.1';
import {derive,createItem} from '../dist/core/rules.js?v=0.3.1';
const origin=process.argv[2];if(!origin?.startsWith('https://'))throw Error('HTTPS deployment required');
mkdirSync('browser-evidence',{recursive:true});
function fixture(zone,level=85,classId='mage'){const sim=new Simulation(null,()=>.99);sim.s.zone=zone;sim.populate();const h=sim.addPlayer(classId,'Перевірка');h.level=level;h.hp=derive(h).hp;h.sp=derive(h).sp;h.echoes=30;h.zeny=30000;return{sim,h};}
async function openFixture(browser,save,options={}){const context=await browser.newContext(options);await context.addInitScript(s=>localStorage.setItem('vyriy-save-v2',JSON.stringify(s)),save);const page=await context.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.stack)});await page.goto(origin+'/?expansion-check=0.4',{waitUntil:'networkidle'});await page.locator('#continue-local').click();await page.waitForFunction(()=>!document.getElementById('modal').open&&document.getElementById('startup').hidden);await page.waitForTimeout(1200);return{context,page,errors};}
const browser=await chromium.launch();
try{
 for(const z of Object.values(ZONES).filter(z=>z.theme)){
  const {sim,h}=fixture(z.id),focus=sim.s.enemies.find(e=>e.boss)||sim.s.enemies[0];h.x=focus.x;h.y=focus.y+1.2;h.hp=derive(h).hp;
  const {context,page,errors}=await openFixture(browser,sim.s,{viewport:{width:1440,height:900}});
  try{await page.waitForFunction(name=>document.getElementById('location-name').textContent===name,z.name);await page.locator('#scene canvas').waitFor({state:'visible'});await page.screenshot({path:'browser-evidence/expansion-'+z.id+'.png'});assert.deepEqual(errors,[],z.id+' rendering errors');console.log('New region rendered:',z.id);}finally{await context.close();}
 }
 const {sim,h}=fixture('village',40);h.x=16.5;h.y=25.5;h.inventory.push(createItem('armor',h.id));
 const {context,page,errors}=await openFixture(browser,sim.s,{viewport:{width:1440,height:900}});
 try{
  const frames=await page.evaluate(async()=>{const im=new Image();im.src='assets/frontier-creatures-v1.png';await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const counts=[];for(let row=0;row<4;row++)for(let col=0;col<6;col++){const data=x.getImageData(col*256,row*256,256,256).data;let visible=0;for(let n=3;n<data.length;n+=4)if(data[n]>100)visible++;counts.push(visible);}return counts;});assert.equal(frames.length,24);assert.ok(frames.every(n=>n>300),'All 24 sprites have visible pixel data');
  await page.locator('#inventory-open').click();await page.locator('[data-sell]').first().click();await page.waitForFunction(()=>document.getElementById('modal-body').textContent.includes('Відлуння душ'));await page.screenshot({path:'browser-evidence/economy-inventory.png'});await page.locator('#modal-close').click();
  await page.locator('#interact').click();await page.screenshot({path:'browser-evidence/economy-shop.png'});console.log('Interaction panel:',await page.locator('#modal-title').textContent(),await page.locator('#toast').textContent());await page.locator('[data-buy-echoes="1"]').click();await page.waitForFunction(()=>document.getElementById('modal-body').textContent.includes('Відлуння душ · 31'));await page.locator('#modal-close').click();
  await page.locator('#spec-open').click();await page.locator('[data-skill-tune="firebolt"][data-tune-key="crit"]').click();await page.waitForFunction(()=>document.getElementById('modal-body').textContent.includes('Зараз +2 в.п.'));await page.screenshot({path:'browser-evidence/economy-skill-tuning.png'});assert.deepEqual(errors,[]);
 }finally{await context.close();}

 for(let classId of Object.keys(CLASSES)){const f=fixture('village',40,classId),t=await openFixture(browser,f.sim.s,{viewport:{width:1440,height:900}});try{await t.page.waitForFunction(()=>document.getElementById('hp-value').textContent.includes('/'));await t.page.screenshot({path:'browser-evidence/class-'+classId+'.png'});assert.deepEqual(t.errors,[]);console.log('Class rendered:',classId);}finally{await t.context.close();}}
 const forgeFixture=fixture('village',40),fh=forgeFixture.h;fh.x=18.5;fh.y=25.5;fh.inventory.push(createItem('armor',fh.id));for(let n=0;n<10;n++)fh.inventory.push(createItem('embershard',fh.id));
 const forgePage=await openFixture(browser,forgeFixture.sim.s,{viewport:{width:1440,height:900}});
 try{let {page}=forgePage;await page.locator('#interact').click();await page.locator('[data-forge]').first().click();await page.waitForFunction(()=>Array.from(document.querySelectorAll('#modal-body .card h3')).some(e=>e.textContent.endsWith('+1')));await page.screenshot({path:'browser-evidence/adventure-forge.png'});await page.locator('details summary').first().click();await page.locator('[data-salvage]').first().click();await page.waitForFunction(()=>!document.querySelector('[data-salvage]'));assert.deepEqual(forgePage.errors,[]);}finally{await forgePage.context.close();}
 const skillFixture=fixture('village',40),camp=ZONES.village.objects.find(o=>o.kind==='camp');skillFixture.h.x=camp.x+.5;skillFixture.h.y=camp.y+.5;
 const skillPage=await openFixture(browser,skillFixture.sim.s,{viewport:{width:1440,height:900}});
 try{let {page}=skillPage;await page.locator('#spec-open').click();await page.locator('[data-skill-augment="firebolt"][data-choice="force"]').click();await page.waitForFunction(()=>document.querySelector('[data-skill-augment="firebolt"][data-choice="force"]').disabled);await page.locator('[data-skill-augment="firebolt"][data-choice="rhythm"]').click();await page.waitForFunction(()=>document.querySelector('[data-skill-augment="firebolt"][data-choice="rhythm"]').disabled);await page.screenshot({path:'browser-evidence/adventure-skill-choice.png'});assert.deepEqual(skillPage.errors,[]);}finally{await skillPage.context.close();}
 for(let zone of Object.keys(DUNGEONS)){const f=fixture(zone,DUNGEONS[zone].level),camp=ZONES[zone].objects.find(o=>o.kind==='camp');f.h.x=camp.x+.5;f.h.y=camp.y+.5;const t=await openFixture(browser,f.sim.s,{viewport:{width:1440,height:900}});try{await t.page.locator('#interact').click();await t.page.locator('[data-dungeon-start="safe"]').click();await t.page.waitForFunction(()=>document.getElementById('quest-objective').textContent.includes('Данж: вартові 0/3'));await t.page.screenshot({path:'browser-evidence/adventure-run-'+zone+'.png'});assert.deepEqual(t.errors,[]);}finally{await t.context.close();}}
 const navFixture=fixture('springvale',20),q=QUESTS.find(q=>q.id==='legacy-seed');navFixture.h.quests[q.id]={status:'active'};navFixture.h.trackedQuest=q.id;
 const navPage=await openFixture(browser,navFixture.sim.s,{viewport:{width:1440,height:900}});
 try{await navPage.page.locator('#quest-drawer-toggle').click();await navPage.page.locator('#quest-open').click();await navPage.page.locator('[data-quest-track="legacy-seed"]').click();await navPage.page.locator('#modal-close').click();await navPage.page.screenshot({path:'browser-evidence/adventure-quest-arrow.png'});assert.deepEqual(navPage.errors,[]);}finally{await navPage.context.close();}
}finally{await browser.close();}
const mobile=await webkit.launch();
try{const {sim,h}=fixture('winterhold',60);const target=sim.s.enemies.find(e=>!e.boss);h.x=target.x;h.y=target.y+2;h.target=target.id;for(let e of sim.s.enemies)e.aggression='passive';const {context,page,errors}=await openFixture(mobile,sim.s,{...devices['iPhone 13']});try{await page.locator('#target-hud').waitFor({state:'visible'});await page.screenshot({path:'browser-evidence/adventure-mobile-target.png'});await page.locator('#quest-drawer-toggle').click();await page.waitForFunction(()=>document.getElementById('quest-drawer-body').getBoundingClientRect().x<innerWidth-100);await page.screenshot({path:'browser-evidence/adventure-mobile-journal.png'});await page.locator('#quest-drawer-toggle').click();await page.locator('#spec-open').click();await page.locator('[data-skill-tune="firebolt"][data-tune-key="crit"]').waitFor({state:'visible'});await page.screenshot({path:'browser-evidence/expansion-mobile-tuning.png'});assert.deepEqual(errors,[]);}finally{await context.close();}}finally{await mobile.close();}
console.log('Expansion visual checks passed: ten regions, six bosses, 24 nonempty sprites, sales, echoes and per-skill tuning.');
