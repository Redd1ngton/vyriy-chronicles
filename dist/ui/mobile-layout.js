// Use the actual game viewport: Safari chrome can leave only 244px in landscape.
export function mobileLayout({width,height,coarse=false}){
 const mobile=coarse||width<600,landscape=width>height;
 return {mobile,layout:landscape?'landscape':'portrait',zoom:mobile?(landscape?Math.max(.38,.62*Math.min(1,height/360)):.62):1.1};
}
export function applyMobileLayout(shell,view,coarse=false){
 const metrics=mobileLayout({...view,coarse});
 shell.dataset.mobile=String(metrics.mobile);shell.dataset.layout=metrics.layout;
 const interact=shell.querySelector('#interact'),bar=shell.querySelector('.actionbar');
 if(interact&&bar)(metrics.mobile?shell:bar).append(interact);
 return metrics;
}
