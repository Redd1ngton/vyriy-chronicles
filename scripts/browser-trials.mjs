import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium,webkit,devices} from 'playwright';
import {Simulation} from '../dist/core/simulation.js';
import {ZONES} from '../dist/content/region.js';
import {derive,createItem,uid} from '../dist/core/rules.js';
const origin=process.argv[2];if(!origin?.startsWith('https://')&&origin!=='http://127.0.0.1:4173')throw Error('Expected deployment or CI preview');
mkdirSync('journey-evidence',{recursive:true});
function combat(){const sim=new Simulation(null,()=>.99);sim.s.zone='castlehalls';sim.populate();const h=sim.addPlayer('mage','Зоряна перевірка');h.level=40;h.hp=derive(h).hp;h.sp=derive(h).sp;const camp=ZONES.castlehalls.objects.find(o=>o.kind==='camp');h.x=camp.x+.5;h.y=camp.y+.5;sim.command(h.id,{type:'dungeonStart',trial:2,route:'safe',op:uid(),round:sim.s.round});for(const id of sim.s.dungeonRun.guards){const e=sim.s.enemies.find(e=>e.id===id);h.x=e.x;h.y=e.y;e.dead=true;e.hp=0;sim.kill(e,h.id);}const boss=sim.s.enemies.find(e=>e.boss);for(const e of sim.s.enemies)if(e!==boss){e.dead=true;e.rewarded=true;}boss.hp=1;h.x=boss.x-1;h.y=boss.y;h.target=boss.id;h.hp=derive(h).hp;return{sim,h};}
async function open(browser,fixture,options){const context=await browser.newContext(options);await context.addInitScript(s=>{if(!localStorage.getItem('vyriy-save-v2'))localStorage.setItem('vyriy-save-v2',JSON.stringify(s))},fixture.sim.s);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/?trials-check=0.9.0',{waitUntil:'networkidle'});await page.locator('#continue-local').click();await page.waitForFunction(()=>!document.getElementById('modal').open);return{context,page,errors};}
for(const [name,type,options]of [['desktop',chromium,{viewport:{width:1440,height:900}}],['mobile',webkit,{...devices['iPhone 13'],viewport:{width:844,height:390}}]]){
 const browser=await type.launch();let currentPage;try{
  const t=await open(browser,combat(),options),p=t.page;currentPage=p;
  await p.locator('#attack').click();
  await p.waitForFunction(()=>document.getElementById('toast').textContent.includes('Данж пройдено')||[...document.querySelectorAll('#event-log p')].some(e=>e.textContent.includes('Випробування завершено')),{timeout:20000});
  if(await p.locator('#modal').evaluate(e=>e.open))await p.locator('#modal-close').click();
  await p.locator('#world-map').click();await p.locator('[data-open="trials"]').click();await p.getByText('Найкраще проходження: 2/3.',{exact:false}).waitFor();
  await p.locator('[data-trial-appearance]').click();await p.getByRole('button',{name:'Прибрати ауру',exact:true}).waitFor();
  await p.screenshot({path:'journey-evidence/trials-'+name+'.png'});
  await p.locator('[data-open="rewards"]').click();await p.locator('[data-choice^="trial-relic-"]').first().click();await p.getByText('Немає неотриманих нагород.',{exact:false}).waitFor();
  await p.locator('#modal-close').click();await p.waitForTimeout(5500);await p.reload({waitUntil:'networkidle'});await p.locator('#continue-local').click();await p.waitForFunction(()=>!document.getElementById('modal').open);
  await p.waitForTimeout(300);assert.equal(await p.locator('#modal').evaluate(e=>e.open),false,'Historical reward events do not reopen after reload');
  const save=await p.evaluate(()=>JSON.parse(localStorage.getItem('vyriy-save-v2'))),h=Object.values(save.players)[0];assert.equal(h.trials.best,2);assert.ok(h.trials.equipped);assert.equal(h.dungeonRewards.length,0);assert.ok(h.inventory.some(i=>i.template.startsWith('trial-relic-')));assert.deepEqual(t.errors,[]);await t.context.close();
  const sim=new Simulation(null,()=>.99),smith=sim.addPlayer('mage','Зоряний ковач');smith.level=40;smith.zeny=2000;smith.trials={best:2,recipes:true,appearance:true,equipped:false};const forge=ZONES.village.objects.find(o=>o.kind==='forge');smith.x=forge.x+.5;smith.y=forge.y+.5;for(let n=0;n<10;n++)smith.inventory.push(createItem('ore',smith.id));for(let n=0;n<6;n++)smith.inventory.push(createItem('embershard',smith.id));
  const craft=await open(browser,{sim,h:smith},options);currentPage=craft.page;await craft.page.locator('#world-map').click();await craft.page.locator('[data-open="trials"]').click();await craft.page.locator('[data-trial-craft="aegis"]').click();await craft.page.waitForTimeout(5500);const made=await craft.page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('vyriy-save-v2')).players)[0]);assert.ok(made.inventory.some(i=>i.template==='trial-aegis'));assert.equal(made.zeny,1200);assert.deepEqual(craft.errors,[]);await craft.context.close();console.log('Trials verified: '+name+' real final hit, rewards, aura, reload and forge');
 }catch(error){if(currentPage){console.error(name,await currentPage.locator('#toast').textContent());await currentPage.screenshot({path:'journey-evidence/trials-failure-'+name+'.png'});}throw error;}finally{await browser.close();}
}
