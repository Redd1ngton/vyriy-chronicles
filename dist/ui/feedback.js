export function createFeedback(win=window){
 let prefs={sound:true,haptics:false,motion:!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches};
 try{prefs={...prefs,...JSON.parse(win.localStorage.getItem('vyriy-feedback')||'{}')}}catch{}
 let context=null,unlocked=false,last={},nextHaptic=0;
 function unlock(){unlocked=true;if(!prefs.sound)return;try{const Audio=win.AudioContext||win.webkitAudioContext;if(Audio)context??=new Audio();if(context?.state==='suspended')context.resume().catch(()=>{});}catch{}}
 win.addEventListener('pointerdown',unlock,{passive:true});win.addEventListener('keydown',unlock);
 function set(key,value){if(!['sound','haptics','motion'].includes(key))return;prefs[key]=!!value;try{win.localStorage.setItem('vyriy-feedback',JSON.stringify(prefs))}catch{}if(key==='sound'&&value)unlock();}
 function play(ev,id){
  const own=ev.actor===id,attack=ev.from===id;if(!own&&!attack&&ev.type!=='telegraph')return;
  const kind=ev.type==='hit'?(ev.crit?'crit':own?'hurt':'hit'):ev.type;
  const tones={hit:[240,.045],hurt:[95,.1],crit:[760,.12],cast:[440,.08],telegraph:[140,.22],interrupt:[620,.15],cover:[520,.1],heal:[660,.1],loot:[820,.06],dungeonReward:[980,.18],field:[380,.06]};
  const tone=tones[kind],now=Date.now();if(!tone||now-(last[kind]||0)<75)return;last[kind]=now;
  if(prefs.haptics&&own&&['hurt','crit','telegraph'].includes(kind)&&now>nextHaptic){try{win.navigator.vibrate?.(kind==='hurt'?35:20)}catch{}nextHaptic=now+250;}
  if(!prefs.sound||!unlocked)return;
  try{const Audio=win.AudioContext||win.webkitAudioContext;if(!Audio)return;context??=new Audio();if(context.state!=='running'){context.resume().catch(()=>{});return;}const oscillator=context.createOscillator(),gain=context.createGain(),t=context.currentTime;oscillator.type=['hurt','telegraph'].includes(kind)?'triangle':'sine';oscillator.frequency.setValueAtTime(tone[0],t);oscillator.frequency.exponentialRampToValueAtTime(Math.max(45,tone[0]*(kind==='crit'?1.5:.65)),t+tone[1]);gain.gain.setValueAtTime(.045,t);gain.gain.exponentialRampToValueAtTime(.0001,t+tone[1]);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(t);oscillator.stop(t+tone[1]+.015);}catch{}
 }
 return{prefs,set,play};
}
