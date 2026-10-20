import {QUESTS} from '../content/quests.js';
export function objectiveProgress(h,s,o){if(o.type==='collect')return h.inventory.filter(i=>i.template===o.id).length;if(o.type==='flag'){let v=s.flags[o.id];return Array.isArray(v)?v.length:v?1:0;}return h.counters?.[`${o.type}:${o.id}`]||0;}
export function questReady(h,s,q){return q.objectives.every(o=>objectiveProgress(h,s,o)>=o.count);}
export function questAvailable(h,q){return !h.quests?.[q.id]&&h.level>=q.level&&(!q.requires||h.quests?.[q.requires]?.status==='completed');}
export function track(h,type,id,n=1){h.counters??={};let key=`${type}:${id}`;h.counters[key]=(h.counters[key]||0)+n;}
