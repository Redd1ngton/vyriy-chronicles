// Feature detection keeps the same button useful on Android, Safari and desktop.
export function installDisplay({root,button,doc=document,win=window,toast=()=>{},fallback=()=>{}}){
 let pending=false;
 const active=()=>!!(doc.fullscreenElement||doc.webkitFullscreenElement);
 const orientation=()=>win.screen?.orientation;
 const update=()=>{const full=active();button.setAttribute('aria-pressed',String(full));button.setAttribute('aria-label',full?'Вийти з повноекранного режиму':'На весь екран · горизонтальна гра');button.querySelector('span').textContent=full?'Згорнути':'Екран';root.classList.toggle('game-fullscreen',full);if(!full)try{orientation()?.unlock?.()}catch{}};
 async function toggle(){if(pending)return;pending=true;button.disabled=true;try{
  if(active()){const exit=doc.exitFullscreen||doc.webkitExitFullscreen;if(exit)await exit.call(doc);return;}
  const request=root.requestFullscreen||root.webkitRequestFullscreen;if(!request){fallback();return;}
  try{await request.call(root,{navigationUI:'hide'})}catch{fallback();return;}
  if(orientation()?.lock)try{await orientation().lock('landscape')}catch{toast('Поверніть телефон горизонтально. Якщо поворот заблоковано — вимкніть блокування орієнтації телефона.')}else if(win.innerHeight>win.innerWidth)toast('Поверніть телефон горизонтально для ширшого огляду.');
 }catch{toast('Браузер не змінив режим екрана. Спробуйте кнопку ще раз.')}finally{pending=false;button.disabled=false;update();}}
 button.addEventListener('click',toggle);doc.addEventListener('fullscreenchange',update);doc.addEventListener('webkitfullscreenchange',update);update();return{toggle,active};
}
