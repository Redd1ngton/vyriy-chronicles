import test from 'node:test';
import assert from 'node:assert/strict';
import {viewportBox,installViewport} from '../dist/ui/viewport.js';
import {labelPoint,placeLabels} from '../dist/render/world-labels.js';
test('visible Safari viewport fits between browser toolbars and follows viewport changes',()=>{const props={},listeners={},visual={width:390,height:620,offsetTop:47,offsetLeft:0,addEventListener(n,f){listeners['visual:'+n]=f},removeEventListener(){}},win={innerWidth:390,innerHeight:844,visualViewport:visual,addEventListener(n,f){listeners[n]=f},removeEventListener(){},requestAnimationFrame(fn){fn();return 1},cancelAnimationFrame(){}};let resized;const viewport=installViewport({win,shell:{style:{setProperty(k,v){props[k]=v}}},resize:v=>resized=v});assert.deepEqual(resized,{width:390,height:620,top:47,left:0});assert.equal(props['--view-height'],'620px');visual.height=710;visual.offsetTop=0;listeners['visual:resize']();assert.equal(props['--view-height'],'710px');assert.equal(props['--view-top'],'0px');viewport.destroy();assert.deepEqual(viewportBox({innerWidth:844,innerHeight:390}),{width:844,height:390,top:0,left:0});});
test('world names remain screen-sized, snap to pixels and avoid collisions and HUD regions',()=>{assert.deepEqual(labelPoint({width:390,height:620,scrollX:100,scrollY:200,zoom:.79},{x:295,y:510}),{x:195,y:310});const labels=placeLabels([{id:'npc',text:'Берегиня Орися',x:180.4,y:210.2,distance:2,priority:70},{id:'enemy',text:'Вовк',x:185,y:210,distance:1,priority:100},{id:'hud',text:'Приховано',x:200,y:30,distance:1,priority:60}],390,620);assert.deepEqual(labels.map(l=>l.id),['enemy']);});

test('stale portrait visualViewport after rotation uses current landscape window until WebKit catches up',()=>{assert.deepEqual(viewportBox({innerWidth:844,innerHeight:390,visualViewport:{width:390,height:844,offsetTop:0,offsetLeft:0,scale:1}}),{width:844,height:390,top:0,left:0});assert.equal(viewportBox({innerWidth:390,innerHeight:844,visualViewport:{width:390,height:620,offsetTop:0,scale:1}}).height,620);});

import {mobileLayout} from '../dist/ui/mobile-layout.js';
test('mobile camera backs away and adapts to Safari landscape chrome without changing desktop',()=>{
 assert.equal(mobileLayout({width:390,height:664,coarse:true}).zoom,.62);
 for(const height of [244,293,390]){const v=mobileLayout({width:844,height,coarse:true});assert.equal(v.layout,'landscape');assert.ok(v.zoom<=.62);assert.ok(height/v.zoom>=580,'At least 580 world pixels remain visible vertically');}
 assert.equal(mobileLayout({width:1440,height:900}).zoom,1.1);
});
