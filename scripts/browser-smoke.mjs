import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium,webkit,devices} from 'playwright';
const origin=process.argv[2];
if(!origin||!origin.startsWith('https://'))throw Error('HTTPS deployment required');
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
  await page.locator('#start-local').click();
  await page.waitForFunction(()=>!document.getElementById('modal').open);
  await page.locator('#scene canvas').waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.getElementById('hp-value').textContent.includes('undefined')&&document.getElementById('hp-value').textContent.length>0);
  if(name==='mobile'){
   const joy=await page.locator('#joystick').boundingBox(),attack=await page.locator('#attack').boundingBox();
   assert.ok(joy&&attack&&joy.x>attack.x+attack.width,'Right joystick and left attack');
   assert.ok(attack.width>=80,'Large touch attack');
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
  if(name==='mobile'){await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>innerWidth>innerHeight);const joy=await page.locator('#joystick').boundingBox(),attack=await page.locator('#attack').boundingBox();assert.ok(joy.x>attack.x+attack.width,'Landscape keeps joystick right and attack left');await page.screenshot({path:'browser-evidence/mobile-landscape.png'});await page.setViewportSize({width:390,height:664});}
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
