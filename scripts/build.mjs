import {readFileSync,statSync,readdirSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
// Always replace the vendored asset with the integrity-checked npm package.
copyFileSync('node_modules/phaser/dist/phaser.min.js','dist/assets/phaser-3.90.0.min.js');
execFileSync(process.execPath,['--check','dist/assets/phaser-3.90.0.min.js'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check.mjs'],{stdio:'inherit'});
for(const path of ['dist/index.html','dist/bootstrap.js','dist/ui/app.js','dist/assets/phaser-3.90.0.min.js'])if(!statSync(path).size)throw Error('Missing deployment file: '+path);
function inspect(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory()){if(e.name!=='assets')inspect(path)}else if(e.name.endsWith('.js')){const source=readFileSync(path,'utf8');for(const m of source.matchAll(/from\s*['"](\.{1,2}\/[^'"]+)['"]/g)){const target=new URL(m[1],new URL(path,'file://'+process.cwd()+'/'));target.search='';statSync(target)}}}}
execFileSync(process.execPath,['scripts/check-atlases.mjs'],{stdio:'inherit'});
inspect('dist');console.log('Cloudflare static output verified: dist/');
