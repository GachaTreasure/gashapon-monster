// Run after npm run build and npm run preview. No browser/WebGL automation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=new URL(process.argv[2]??'http://127.0.0.1:4173/gashapon-monster/');
assert.ok(base.pathname.endsWith('/gashapon-monster/'));
function files(dir,relative=''){return fs.readdirSync(path.join(dir,relative),{withFileTypes:true}).flatMap(e=>{const p=path.posix.join(relative,e.name);return e.isDirectory()?files(dir,p):[p];});}
// Vite may still be starting when invoked by Actions.
for(let attempt=0;attempt<20;attempt++){
 try{const response=await fetch(base);if(response.ok)break;}catch{}
 if(attempt===19)throw Error('Vite Preview indisponible');
 await new Promise(resolve=>setTimeout(resolve,250));
}
const all=files('dist');let checked=0;
for(const relative of all){
 assert.doesNotMatch(relative,/V0\.|(^|\/)tools\/|(^|\/)node_modules\/|\.env|\.pem$/);
 const original=fs.readFileSync(path.join('dist',relative)),r=await fetch(new URL(relative,base),{signal:AbortSignal.timeout(10000)});
 assert.equal(r.status,200,relative);assert.deepEqual(Buffer.from(await r.arrayBuffer()),original,'HTTP bytes: '+relative);
 if(/\.(js|css|html)$/.test(relative)){
  const text=original.toString();assert.doesNotMatch(text,/https?:\/\/(127\.0\.0\.1|localhost)(?=[:/])/);
  if(relative.endsWith('.html'))for(const match of text.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)){assert.ok(match[1].startsWith('/gashapon-monster/'),match[1]);assert.ok(fs.existsSync('dist/'+match[1].slice('/gashapon-monster/'.length)),match[1]);}
 }
 checked++;
}
for(let i=1;i<=6;i++)assert.ok(all.some(p=>p.startsWith('assets/intro/0'+i+'-')));
const bundles=all.filter(p=>p.endsWith('.js')).map(p=>fs.readFileSync('dist/'+p,'utf8')).join('\n');
assert.ok(bundles.includes('/gashapon-monster/'));assert.ok(bundles.includes('osaka-treasure.com'));assert.ok(bundles.includes('gacha-treasure.fr'));assert.ok(!bundles.includes('https://osaka-treasure.fr'));
console.log(`${checked} fichiers dist vérifiés par HTTP, octets identiques, six PNG, liens et chemins Pages conformes.`);
