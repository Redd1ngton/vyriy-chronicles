import test from 'node:test';
import assert from 'node:assert/strict';
import {viewportBox,installViewport} from '../dist/ui/viewport.js';
import {labelPoint,placeLabels} from '../dist/render/world-labels.js';
test('visible Safari viewport fits between browser toolbars and follows viewport changes',()=>{const props={},listeners={},visual={width:390,height:620,offsetTop:47,offsetLeft:0,addEventListener(n,f){listeners['visual:'+n]=f},removeEventListener(){}},win={innerWidth:390,innerHeight:844,visualViewport:visual,addEventListener(n,f){listeners[n]=f},removeEventListener(){},requestAnimationFrame(fn){fn();return 1},cancelAnimationFrame(){}};let resized;const viewport=installViewport({win,shell:{style:{setProperty(k,v){props[k]=v}}},resize:v=>resized=v});assert.deepEqual(resized,{width:390,height:620,top:47,left:0});assert.equal(props['--view-height'],'620px');visual.height=710;visual.offsetTop=0;listeners['visual:resize']();assert.equal(props['--view-height'],'710px');assert.equal(props['--view-top'],'0px');viewport.destroy();assert.deepEqual(viewportBox({innerWidth:844,innerHeight:390}),{width:844,height:390,top:0,left:0});});
test('world names remain screen-sized, snap to pixels and avoid collisions and HUD regions',()=>{assert.deepEqual(labelPoint({width:390,height:620,scrollX:100,scrollY:200,zoom:.79},{x:295,y:510}),{x:195,y:310});const labels=placeLabels([{id:'npc',text:'Берегиня Орися',x:180.4,y:210.2,distance:2,priority:70},{id:'enemy',text:'Вовк',x:185,y:210,distance:1,priority:100},{id:'hud',text:'Приховано',x:200,y:30,distance:1,priority:60}],390,620);assert.deepEqual(labels.map(l=>l.id),['enemy']);});

test('stale portrait visualViewport after rotation uses current landscape window until WebKit catches up',()=>{assert.deepEqual(viewportBox({innerWidth:844,innerHeight:390,visualViewport:{width:390,height:844,offsetTop:0,offsetLeft:0,scale:1}}),{width:844,height:390,top:0,left:0});assert.equal(viewportBox({innerWidth:390,innerHeight:844,visualViewport:{width:390,height:620,offsetTop:0,scale:1}}).height,620);});

import {mobileLayout,installCameraLock} from '../dist/ui/mobile-layout.js';
test('camera distance stays fixed across rotation and Safari toolbar changes',()=>{
 for(const [width,height] of [[390,664],[390,844],[844,244],[844,293],[844,390],[320,568]])assert.equal(mobileLayout({width,height,coarse:true}).zoom,.5);
 assert.equal(mobileLayout({width:1440,height:900}).zoom,1.1);
});

test('camera gesture lock blocks pinch and Ctrl-wheel without blocking ordinary touch movement',()=>{
 const listeners={};installCameraLock({addEventListener(n,fn){listeners[n]=fn}});
 const event=extra=>({cancelable:true,preventDefault(){this.prevented=true},...extra});
 for(const name of ['gesturestart','gesturechange','gestureend']){const e=event({});listeners[name](e);assert.equal(e.prevented,true);}
 for(const extra of [{touches:[{},{}]},{ctrlKey:true}]){const e=event(extra);listeners[extra.ctrlKey?'wheel':'touchmove'](e);assert.equal(e.prevented,true);}
 const e=event({touches:[{}]});listeners.touchmove(e);assert.equal(e.prevented,undefined);
});
