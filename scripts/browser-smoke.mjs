import assert from 'node:assert/strict';
import {sceneColorFraction} from './scene-pixels.mjs';
import {mkdirSync} from 'node:fs';
import {chromium,webkit,devices} from 'playwright';
const origin=process.argv[2];
if(!origin||(!origin.startsWith('https://')&&origin!=='http://127.0.0.1:4173'))throw Error('HTTPS deployment required');
mkdirSync('browser-evidence',{recursive:true});
for(const [name,type,options] of [
 ['desktop',chromium,{viewport:{width:1440,height:900}}],
 ['mobile',webkit,{...devices['iPhone 13']}]
]){
 const browser=await type.launch();
 const context=await browser.newContext(options);
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(origin+'/?check=0.3.2',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.getElementById('startup').hidden,{timeout:40000});
  assert.equal(await page.evaluate(()=>typeof window.Phaser?.Game),'function');
  async function checkCreation(){
   const geometry=await page.evaluate(()=>{const m=document.getElementById('modal'),body=document.getElementById('modal-body'),r=m.getBoundingClientRect();return{width:r.width,height:r.height,scroll:body.scrollHeight-body.clientHeight,viewWidth:visualViewport.width,viewHeight:visualViewport.height,innerWidth,rootWidth:document.documentElement.clientWidth,shellWidth:getComputedStyle(document.getElementById('game-shell')).getPropertyValue('--view-width'),dialogWidth:getComputedStyle(m).getPropertyValue('--view-width'),items:[...document.querySelectorAll('.class-card,#character-name,.creation-actions button')].map(e=>{const b=e.getBoundingClientRect();return{id:e.dataset.class||e.id,x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}})}});
   assert.ok(Math.abs(geometry.width-geometry.viewWidth)<2&&Math.abs(geometry.height-geometry.viewHeight)<2,'Start menu fills visible viewport: '+JSON.stringify(geometry));
   assert.ok(geometry.scroll<=1,'Start menu needs no scrolling: '+JSON.stringify(geometry));assert.equal(await page.locator('.class-card').count(),7);
   for(const b of geometry.items)assert.ok(b.width>0&&b.height>=28&&b.x>=0&&b.y>=0&&b.right<=geometry.width+1&&b.bottom<=geometry.height+1,'Start menu control fits: '+JSON.stringify(b));
  }
  if(name==='mobile'){
   for(const [width,height]of [[390,664],[320,568],[844,390],[844,244]]){await page.setViewportSize({width,height});await page.waitForTimeout(200);await checkCreation();await page.screenshot({path:'browser-evidence/start-'+width+'x'+height+'.png'});}
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
  }
  await checkCreation();
  for(const card of await page.locator('.class-card').all()){await card.click();assert.equal(await card.getAttribute('aria-pressed'),'true');}
  await page.locator('#start-local').click();
  await page.waitForFunction(()=>!document.getElementById('modal').open);
  await page.locator('#scene canvas').waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.getElementById('hp-value').textContent.includes('undefined')&&document.getElementById('hp-value').textContent.length>0);
  await page.waitForFunction(()=>document.querySelectorAll('.world-label:not([hidden])').length>0);
  const labels=await page.locator('.world-label:not([hidden])').evaluateAll(nodes=>nodes.map(el=>({font:parseFloat(getComputedStyle(el).fontSize),transform:getComputedStyle(el).transform})));
  assert.ok(labels.every(l=>l.font>=12),'World names use readable screen-size text');
  async function safeHUD(){const geometry=await page.evaluate(()=>{const h=document.getElementById('hero-open').getBoundingClientRect(),xp=document.querySelector('.xp').getBoundingClientRect(),actions=document.querySelector('.top-actions').getBoundingClientRect(),shell=document.getElementById('game-shell').getBoundingClientRect(),v=visualViewport;return{top:h.top,bottom:xp.bottom,right:h.right,actionsLeft:actions.left,shellHeight:shell.height,height:v?.height||innerHeight,offset:v?.offsetTop||0,bodyWidth:document.body.scrollWidth,width:innerWidth};});assert.ok(geometry.top>=geometry.offset,'Vitals below viewport top');assert.ok(geometry.bottom<=geometry.offset+geometry.height,'XP above viewport bottom');assert.ok(geometry.right<=geometry.actionsLeft+1,'Player vitals do not overlap toolbar');assert.ok(Math.abs(geometry.shellHeight-geometry.height)<=1,'Game fits visible Safari viewport: '+JSON.stringify(geometry));assert.ok(geometry.bodyWidth<=geometry.width+1,'No horizontal page overflow');}
  if(name==='mobile'){
   await safeHUD();
   const joy=await page.locator('#joystick').boundingBox(),attack=await page.locator('#attack').boundingBox();
   assert.ok(joy&&attack&&joy.x>attack.x+attack.width,'Right joystick and left attack');
   assert.ok(attack.width>=64&&attack.width<=76,'Compact usable touch attack');
  }
  assert.equal(await page.locator('#quest-drawer-toggle').getAttribute('aria-expanded'),'false');
  await page.locator('#quest-drawer-toggle').click();assert.equal(await page.locator('#quest-drawer-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#quest-drawer-toggle').click();assert.equal(await page.locator('#quest-drawer-toggle').getAttribute('aria-expanded'),'false');
  await page.waitForFunction(()=>document.getElementById('quest-drawer-body').getBoundingClientRect().x>=innerWidth-1);
  const tracker=await page.locator('#quest-drawer-body').boundingBox();
  if(name==='mobile')assert.ok(tracker.x>=380,'Collapsed journal leaves the mobile playfield');
  await page.locator('#fullscreen-toggle').click();
  await page.waitForFunction(()=>!!document.fullscreenElement||document.getElementById('modal').open);
  if(await page.evaluate(()=>!!document.fullscreenElement)){assert.equal(await page.locator('#fullscreen-toggle').getAttribute('aria-pressed'),'true');await page.screenshot({path:'browser-evidence/'+name+'-fullscreen.png'});await page.locator('#fullscreen-toggle').click();await page.waitForFunction(()=>!document.fullscreenElement);}else{assert.ok((await page.locator('#modal-title').textContent()).includes('Горизонтальна'));await page.screenshot({path:'browser-evidence/'+name+'-fullscreen-guide.png'});await page.locator('#modal-close').click();}
  if(name==='mobile'){
   for(const [width,height] of [[844,390],[844,293],[844,244],[390,664],[320,568]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(250);await safeHUD();
    const geometry=await page.evaluate(()=>{const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}},shell=box(document.getElementById('game-shell'));return {shell,controls:['attack','skill0','skill1','potion','interact','joystick','hero-open','fullscreen-toggle','world-map','coop-open','menu-open','inventory-open','spec-open','help-open'].map(id=>({id,...box(document.getElementById(id))}))};});
    const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1;
    for(const c of geometry.controls){assert.ok(c.x>=geometry.shell.x&&c.y>=geometry.shell.y&&c.right<=geometry.shell.right+1&&c.bottom<=geometry.shell.bottom+1,'Control inside visible game '+width+'x'+height+': '+JSON.stringify(c));}
    for(let i=0;i<geometry.controls.length;i++)for(let j=i+1;j<geometry.controls.length;j++)assert.ok(!overlap(geometry.controls[i],geometry.controls[j]),'Controls do not overlap '+width+'x'+height+': '+geometry.controls[i].id+'/'+geometry.controls[j].id);
    assert.equal(await page.locator('#scene canvas').getAttribute('data-camera-zoom'),'0.5','Camera zoom stays locked across viewport changes');
    const attack=geometry.controls.find(c=>c.id==='attack'),joy=geometry.controls.find(c=>c.id==='joystick');assert.ok(joy.x>attack.right,'Joystick stays right');
    let fraction=sceneColorFraction(await page.locator('#scene canvas').screenshot());
    if(fraction<.15){await page.waitForTimeout(1200);fraction=sceneColorFraction(await page.locator('#scene canvas').screenshot());}
    assert.ok(fraction>.15,'World remains rendered after rotation '+width+'x'+height+': '+fraction);
    await page.screenshot({path:'browser-evidence/mobile-'+width+'x'+height+'.png'});
   }
   await page.setViewportSize({width:390,height:664});await page.waitForTimeout(200);
  }
  await page.locator('#inventory-open').click();
  await page.locator('#modal[open]').waitFor();
  await page.locator('#modal-close').click();
  await page.waitForTimeout(1200);
  await page.screenshot({path:'browser-evidence/'+name+'.png'});
  assert.deepEqual(errors,[],'Uncaught browser errors');
  console.log(name+': engine, scene, character creation, HUD and inventory passed');
 }catch(error){
  console.error(name,errors,await page.locator('#startup-message').textContent());
  await page.screenshot({path:'browser-evidence/'+name+'-failure.png'});
  throw error;
 }finally{await context.close();await browser.close();}
}
