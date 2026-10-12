import {compareBaseline} from './fixtures/baseline.js';
import {introMarkup} from '../src/intro/markup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {scenes,advance,completeIntroduction,savePreview,PREVIEW_KEY,saveIntroduction,GAME_INTRO_KEY} from '../src/intro/story.js';
test('intro: six scènes, treize pages dans l’ordre, sans divulgation',()=>{
 assert.equal(scenes.length,6);let p={scene:0,page:0},pages=[];
 while(p){pages.push(scenes[p.scene].pages[p.page][1]);p=advance(p);}
 assert.equal(pages.length,13);assert.match(pages[0],/Nova Gacha/);assert.equal(pages[11],'Ton aventure commence !');assert.match(pages.at(-1),/Gacha Treasure × Osaka Treasure/);
 assert.doesNotMatch(JSON.stringify(scenes),/Malek|Capsules Originelles|chef du Cercle/i);
 assert.equal(new Set(scenes.map(s=>s.art)).size,6);
});
test('intro: premier compagnon attribué une seule fois sans mutation',()=>{
 const original={companions:[{id:'other'}],coins:7};const once=completeIntroduction(original);const twice=completeIntroduction(once);
 assert.deepEqual(twice,once);assert.equal(once.introductionSeen,true);assert.equal(once.companions.length,2);assert.equal(original.companions.length,1);assert.equal(once.coins,7);
});
test('intro: stockage séparé et indisponibilité gérée',()=>{
 const writes=[];assert.equal(savePreview({setItem:(...args)=>writes.push(args)},true),true);
 assert.equal(writes[0][0],PREVIEW_KEY);assert.deepEqual(JSON.parse(writes[0][1]),{seen:true,skipped:true});
 assert.equal(savePreview({setItem(){throw Error('quota');}},false),false);
});
test('intro: systèmes de jeu, commandes et graphismes V0.3 inchangés',()=>{
 for(const relative of ['src/style.css','src/world','src/entities','src/input','public/assets/gba-prepared','public/assets/gba-v03'])compareBaseline('V0.3-STABLE',relative);
});

test('intro officielle : sauvegarde isolée, compagnon unique et anciens états préservés',()=>{
 const values=new Map([['existing-save','intact']]);const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 assert.equal(saveIntroduction(storage),true);assert.equal(saveIntroduction(storage),true);
 const state=JSON.parse(values.get(GAME_INTRO_KEY));assert.equal(state.introductionSeen,true);assert.equal(state.companions.length,1);assert.equal(values.get('existing-save'),'intact');assert.equal(values.has(PREVIEW_KEY),false);
 assert.equal(saveIntroduction({getItem(){throw Error('denied');}}),false);
});
test('intro : six PNG conformes et liens promotionnels accessibles',async()=>{
 const {isPNG}=await import('../tools/png-validation.mjs');
 for(const scene of scenes){const png=fs.readFileSync('public/assets/intro/'+scene.art);assert.ok(isPNG(png));assert.equal(png.readUInt32BE(16),240);assert.equal(png.readUInt32BE(20),160);}
 const html=introMarkup;
 for(const domain of ['gacha-treasure.fr','osaka-treasure.com'])assert.ok(html.includes(`https://${domain}`));
 assert.match(html,/rel="noopener noreferrer"/);
});
