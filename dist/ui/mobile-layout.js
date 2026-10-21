// HUD follows the visible surface; camera distance stays fixed through rotation and browser chrome.
export function mobileLayout({width,height,coarse=false}){
 const mobile=coarse||width<600,landscape=width>height;
 return {mobile,layout:landscape?'landscape':'portrait',zoom:mobile?.5:1.1};
}
export function applyMobileLayout(shell,view,coarse=false){
 const metrics=mobileLayout({...view,coarse});
 shell.dataset.mobile=String(metrics.mobile);shell.dataset.layout=metrics.layout;
 const interact=shell.querySelector('#interact'),bar=shell.querySelector('.actionbar');
 if(interact&&bar)(metrics.mobile?shell:bar).append(interact);
 return metrics;
}

export function installCameraLock(shell){
 const prevent=e=>{if(e.cancelable)e.preventDefault();};
 const pinch=e=>{if(e.touches?.length>1||e.ctrlKey)prevent(e);};
 for(const name of ['gesturestart','gesturechange','gestureend'])shell.addEventListener(name,prevent,{passive:false});
 shell.addEventListener('touchmove',pinch,{passive:false});shell.addEventListener('wheel',pinch,{passive:false});
}
