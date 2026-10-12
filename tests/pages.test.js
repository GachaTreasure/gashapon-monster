import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import config from '../vite.config.js';
import {scenes} from '../src/intro/story.js';
test('Pages base applies to build and preview, while development stays at root',()=>{
 for(const [command,isPreview,base] of [['build',false,'/gashapon-monster/'],['serve',true,'/gashapon-monster/'],['serve',false,'/']])assert.equal(config({command,isPreview}).base,base);
});
test('all dynamic game and preview resource URLs respect the deployment base',()=>{
 const source=fs.readFileSync('src/assetUrl.js','utf8').replace('export function','function').replace('import.meta.env?.BASE_URL',"'/gashapon-monster/'");const ctx={};vm.runInNewContext(source+';globalThis.url=assetUrl;',ctx);
 for(const path of ['assets/gba-v03/manifest.json','assets/gba-v03/village-tiles.png','assets/gba-prepared/hero.png','assets/gba-prepared/npc.png',...scenes.map(s=>'assets/intro/'+s.art)]){assert.equal(ctx.url(path),'/gashapon-monster/'+path);assert.ok(fs.existsSync('public/'+path));}
 assert.equal(ctx.url('?play=1'),'/gashapon-monster/?play=1');
 for(const path of ['src/main.js','src/intro/IntroScene.js','src/intro/runtime.js','src/intro/main.js','src/preview/main.js'])assert.doesNotMatch(fs.readFileSync(path,'utf8'),/['"`]\/assets\/|127\.0\.0\.1|localhost/);
});
test('deployment is restricted to publication branch and uploads only dist',()=>{
 const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');assert.match(workflow,/branches: \[publication\]/);assert.match(workflow,/github.ref == 'refs\/heads\/publication'/);assert.match(workflow,/path: .\/dist/);assert.match(workflow,/npm test/);assert.doesNotMatch(workflow,/secrets\./);
 const promo=fs.readFileSync('src/intro/promoEndcard.js','utf8');assert.match(promo,/gacha-treasure\.fr/);assert.match(promo,/osaka-treasure\.com/);assert.doesNotMatch(promo,/osaka-treasure\.fr/);
});
