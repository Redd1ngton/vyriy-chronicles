import test from 'node:test';
import assert from 'node:assert/strict';
import {createFeedback} from '../dist/ui/feedback.js';
test('audio waits for a gesture, controls persist, unsupported haptics and unavailable audio fail safely',()=>{
 const events={},values={},calls=[];const param={setValueAtTime(){},exponentialRampToValueAtTime(){}};
 const win={matchMedia:()=>({matches:true}),localStorage:{getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=v},navigator:{vibrate:n=>calls.push('vibrate')},addEventListener:(n,fn)=>events[n]=fn,AudioContext:class{constructor(){calls.push('context');this.state='running';this.currentTime=0;this.destination={}}createOscillator(){return{frequency:param,connect(){},start(){calls.push('sound')},stop(){}}}createGain(){return{gain:param,connect(){}}}}};
 const f=createFeedback(win);assert.equal(f.prefs.motion,false);f.play({type:'hit',actor:'enemy',from:'h',value:20},'h');assert.deepEqual(calls,[]);events.pointerdown();f.play({type:'heal',actor:'h'},'h');assert.ok(calls.includes('context')&&calls.includes('sound'));f.set('sound',false);let n=calls.filter(x=>x==='sound').length;f.play({type:'interrupt',actor:'h'},'h');assert.equal(calls.filter(x=>x==='sound').length,n);f.set('haptics',true);f.play({type:'hit',actor:'h',value:10},'h');assert.ok(calls.includes('vibrate'));assert.equal(JSON.parse(values['vyriy-feedback']).sound,false);delete win.AudioContext;delete win.navigator.vibrate;assert.doesNotThrow(()=>createFeedback(win).play({type:'hit',actor:'h'},'h'));
});
