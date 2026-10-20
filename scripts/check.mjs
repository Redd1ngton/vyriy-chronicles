import {readdirSync} from 'node:fs';import {execFileSync} from 'node:child_process';
function check(dir){for(let e of readdirSync(dir,{withFileTypes:true})){let p=dir+'/'+e.name;if(e.isDirectory())check(p);else if(p.endsWith('.js')&&!p.includes('/assets/'))execFileSync(process.execPath,['--check',p]);}}
check('dist');check('server');check('worker');console.log('All application modules parse.');
