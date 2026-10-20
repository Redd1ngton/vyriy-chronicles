(()=>{
 const panel=document.getElementById('startup'),title=document.getElementById('startup-title'),message=document.getElementById('startup-message'),progress=document.getElementById('startup-progress'),retry=document.getElementById('startup-retry');
 let scene=false,ui=false,failed=false;
 function fail(reason){failed=true;document.querySelector('dialog[open]')?.close();panel.hidden=false;title.textContent='Не вдалося відкрити світ';message.textContent=reason;retry.hidden=false;progress.hidden=true;}
 function complete(){if(scene&&ui&&!failed){clearTimeout(watchdog);panel.hidden=true;}}
 window.addEventListener('vyriy-scene-ready',()=>{scene=true;complete()});window.addEventListener('vyriy-ui-ready',()=>{ui=true;complete()});
 window.addEventListener('vyriy-load-progress',e=>{progress.value=e.detail;message.textContent='Завантаження графіки · '+Math.round(e.detail*100)+'%'});
 window.addEventListener('vyriy-startup-error',e=>fail(e.detail||'Помилка запуску. Спробуйте перезавантажити сторінку.'));
 retry.addEventListener('click',()=>{let url=new URL(location.href);url.searchParams.set('reload',Date.now());location.replace(url)});
 const watchdog=setTimeout(()=>fail('Завантаження триває надто довго. Перевірте з’єднання та спробуйте ще раз.'),30000);
 const script=document.createElement('script');script.src='assets/phaser-3.90.0.min.js';script.onload=()=>import('./ui/app.js?v=0.3.1').catch(e=>fail('Помилка завантаження гри: '+e.message));script.onerror=()=>fail('Не вдалося завантажити ігровий рушій. Перевірте з’єднання.');document.head.append(script);
})();
