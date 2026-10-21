import test from 'node:test';
import assert from 'node:assert/strict';
// Scene lifecycle is not needed to exercise the renderer -> UI feedback bridge.
globalThis.Phaser={Scene:class{}};
const {GameScene}=await import('../dist/render/scene.js');
test('damage, critical and cast events reach audio feedback even without narrative text',()=>{
 const received=[],scene=new GameScene(()=>({id:'hero'}),{event:ev=>received.push(ev),feedback:()=>({motion:false})}),state={players:{},enemies:[]};
 const events=[{type:'hit',actor:'enemy',from:'hero',value:10,crit:true},{type:'cast',actor:'hero',skill:'firebolt'},{type:'hit',actor:'hero',value:5}];
 for(let event of events)scene.onEvent(event,state);
 assert.deepEqual(received,events);
});
