// Native fullscreen is optional on iPhone. Focus mode is an honest, usable fallback.
export function installDisplay({root,button,doc=document,win=window,toast=()=>{},fallback=()=>{}}){
 let pending=false,focus=false;
 const active=()=>!!(doc.fullscreenElement||doc.webkitFullscreenElement);
 const standalone=()=>win.navigator?.standalone===true||win.matchMedia?.('(display-mode: standalone)').matches||win.matchMedia?.('(display-mode: fullscreen)').matches;
 const orientation=()=>win.screen?.orientation;
 const update=()=>{const full=active();button.setAttribute('aria-pressed',String(full||focus));button.setAttribute('aria-label',full?'Вийти з повноекранного режиму':focus?'Вийти з режиму гри':standalone()?'Горизонтальна гра':'На весь екран · горизонтальна гра');button.querySelector('span').textContent=full||focus?'Вийти':standalone()?'Поворот':'Екран';root.classList.toggle('game-fullscreen',full);root.classList.toggle('game-focus',focus);if(!full&&!standalone())try{orientation()?.unlock?.()}catch{}};
 const rotate=async()=>{if(orientation()?.lock)try{await orientation().lock('landscape')}catch{toast('Поверніть телефон горизонтально. Якщо поворот заблоковано — вимкніть блокування орієнтації телефона.')}else if(win.innerHeight>win.innerWidth)toast('Поверніть телефон горизонтально для ширшого огляду.');};
 async function toggle(){if(pending)return;pending=true;button.disabled=true;try{
  if(active()){const exit=doc.exitFullscreen||doc.webkitExitFullscreen;if(exit)await exit.call(doc);return;}
  if(focus){focus=false;return;}
  if(standalone()){focus=true;await rotate();return;}
  const request=root.requestFullscreen||root.webkitRequestFullscreen;
  if(!request){focus=true;fallback();return;}
  try{if(root.requestFullscreen)await request.call(root,{navigationUI:'hide'});else await request.call(root);}catch{focus=true;fallback();return;}
  await rotate();
 }catch{toast('Браузер не змінив режим екрана. Спробуйте кнопку ще раз.')}finally{pending=false;button.disabled=false;update();}}
 button.addEventListener('click',toggle);doc.addEventListener('fullscreenchange',update);doc.addEventListener('webkitfullscreenchange',update);update();return{toggle,active,standalone};
}
