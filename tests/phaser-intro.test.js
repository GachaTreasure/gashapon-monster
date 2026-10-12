import {assetUrl} from '../src/assetUrl.js';
import {INTRO_COMPOSITION} from '../src/intro/composition.js';
import {paginateDialogue,wrapMeasuredText,DIALOGUE_LINES} from '../src/intro/dialoguePages.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {scenes,advance,saveIntroduction,GAME_INTRO_KEY} from '../src/intro/story.js';
import {introductionMode} from '../src/intro/flow.js';
import {Controls} from '../src/input/Controls.js';
import {manageVillageInputs} from '../src/intro/villageInputLifecycle.js';
import {displayLayout} from '../src/ui/mobileLayout.js';
import {spawn} from '../src/world/map.js';
class Target{
 constructor(control){this.events={};this.dataset={control};this.attrs={};this.classList={add(){},remove(){}};}
 addEventListener(n,f){(this.events[n]??=[]).push(f);}removeEventListener(n,f){this.events[n]=(this.events[n]??[]).filter(v=>v!==f);}setPointerCapture(){}
 on(n,f){this.addEventListener(n,f);return this;}off(n,f){this.removeEventListener(n,f);return this;}
 once(n,f){const once=(...args)=>{this.off(n,once);f(...args);};return this.on(n,once);}
 emit(n,e={}){for(const f of [...(this.events[n]??[])])f(e);}
}
function wrapText(text){
 const lines=[];let line='';for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(next.length>41&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;
}
function visual(x=0,y=0,text='',style={}){return {x,y,text,style,visible:true,setStrokeStyle(){return this;},setInteractive(){return this;},on(name,callback){this[name]=callback;return this;},setTint(){return this;},setPosition(x,y){this.x=x;this.y=y;return this;},kind:'PhaserObject',usedTextures:[],getWrappedText:wrapText,setDisplaySize(w,h){this.size=[w,h];return this;},setTexture(key){this.key=key;this.usedTextures.push(key);return this;},setOrigin(){return this;},setVisible(v){this.visible=v;return this;},setText(t){this.text=t;return this;}};}
function harness(mode='first'){
 const win=new Target(),doc=new Target(),buttons=['up','down','left','right','a','b'].map(k=>new Target(k)),root=new Target();root.querySelectorAll=selector=>selector==='.pressed'?[]:buttons;doc.querySelector=()=>root;
 globalThis.window=win;globalThis.document=doc;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>[]}});
 const values=new Map([['old-save','intact']]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const village={events:new Target(),created:false,sleeping:mode==='replay',player:mode==='replay'?{x:11,y:7,facing:'left',moving:true}:null,cameras:{main:{fadeIn(){}}}};
 let hudRestored=false,promo=false,createdControls=0;
 const code=fs.readFileSync('src/intro/IntroScene.js','utf8').replace(/^import .*;\n/gm,'').replace('export class IntroScene','class IntroScene');
 const promoContext={PIXEL_FONT:'test-font',window:win};
 vm.runInNewContext(fs.readFileSync('src/intro/promoEndcard.js','utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'')+';globalThis.createPromoEndcard=createPromoEndcard;',promoContext);
 const context={assetUrl,createPromoEndcard:promoContext.createPromoEndcard,Phaser:{Scene:class{},Textures:{FilterMode:{NEAREST:0}}},scenes,advance,saveIntroduction,paginateDialogue,wrapMeasuredText,INTRO_COMPOSITION,installPixelFont(){},PIXEL_FONT:"test-font",Controls,document:doc,bindIntroInterface(){return {page(value){promo=value;},restore(){hudRestored=true;}};}};
 vm.runInNewContext(code+'\nglobalThis.IntroScene=IntroScene;',context);
 const intro=new context.IntroScene({storage,initialMode:mode});intro.init();intro.events=new Target();intro.textures={exists:()=>false,get:()=>({setFilter(){}})};intro.game={renderer:{}};const loaded=[];intro.load={image:(...args)=>loaded.push(args)};
 intro.add={shader(config,x,y,w,h,textures){return {...visual(x,y),kind:'Shader',config,textures};},rectangle(x,y,w,h,color,alpha){return {...visual(x,y),kind:'Rectangle',size:[w,h],color,alpha};},image(...args){return {...visual(...args),kind:'Image'};},bitmapText(x,y,font,text,size){return {...visual(x,y,text),kind:'BitmapText'};},graphics(){return {...visual(),fillStyle(){},fillRoundedRect(){},lineStyle(){},strokeRoundedRect(){}};}};
 const camera=new Target();camera.setBackgroundColor=()=>{};camera.fadeIn=()=>{};camera.fadeOut=()=>{camera.fading=true;};camera.resetFX=()=>{};intro.cameras={main:camera};intro.time={addEvent(config){return {config,remove(){}};}};
 const stop=()=>intro.events.emit('shutdown');
 intro.scene={get:()=>village,stop,wake(){village.sleeping=false;village.events.emit('wake');},start(key){assert.equal(key,'Village');stop();village.created=true;village.player={...spawn};village.events.emit('create');}};
 intro.preload();intro.create();createdControls++;
 const touch=key=>{buttons.find(b=>b.dataset.control===key).emit('pointerdown',{pointerId:1,preventDefault(){}});buttons.find(b=>b.dataset.control===key).emit('pointerup',{pointerId:1});};
 return {intro,village,camera,loaded,win,doc,buttons,values,storage,touch,get message(){return intro.message.text;},get promo(){return promo;},get restored(){return hudRestored;}};
}
test('Phaser IntroScene: six unchanged assets, village not created before final A and camera fade',()=>{
 const h=harness();assert.equal(h.loaded.length,6);assert.equal(h.village.created,false);assert.equal(h.win.events.keydown.length,1);
 for(let n=0;n<100&&!h.intro.finishing;n++){
  h.touch('a');if(h.intro.changing)h.camera.emit('camerafadeoutcomplete');
  if(!h.intro.finishing)assert.equal(h.village.created,false);
 }
 assert.deepEqual([...new Set(h.intro.image.usedTextures)],scenes.map(scene=>'intro-'+scene.id));
 assert.equal(h.promo,true);assert.equal(h.intro.finishing,true);assert.equal(h.village.created,false);
 h.camera.emit('camerafadeoutcomplete');assert.equal(h.village.created,true);assert.deepEqual(h.village.player,{...spawn});assert.equal(h.restored,true);assert.equal(h.win.events.keydown.length,0);
 const saved=JSON.parse(h.values.get(GAME_INTRO_KEY));assert.equal(saved.introductionSeen,true);assert.equal(saved.companions.length,1);assert.equal(h.values.get('old-save'),'intact');
});
test('Phaser IntroScene: B cancels scene transition; test mode never changes saves',()=>{
 const h=harness('test');for(let n=0;n<20&&!h.intro.changing;n++)h.touch('a');assert.equal(h.intro.changing,true);
 h.touch('b');assert.equal(h.intro.finishing,true);assert.equal(h.village.created,false);h.camera.emit('camerafadeoutcomplete');
 assert.equal(h.village.created,true);assert.equal(h.values.has(GAME_INTRO_KEY),false);assert.equal(h.intro.position.scene,0);
});
test('Phaser replay wakes the same sleeping village, preserving player and saved companion',()=>{
 const h=harness('replay');saveIntroduction(h.storage);const old=h.values.get(GAME_INTRO_KEY),player=h.village.player;
 h.touch('b');h.camera.emit('camerafadeoutcomplete');assert.equal(h.village.sleeping,false);assert.equal(h.village.player,player);assert.equal(player.moving,true);assert.equal(h.village.created,false);assert.equal(h.values.get(GAME_INTRO_KEY),old);
});
test('Village sleep detaches keyboard, touch and debug input; wake restores one set',()=>{
 const h=harness('replay');h.intro.events.emit('shutdown');
 const scene={events:new Target()},debug=new Target();let actions=0,toggles=0;
 const buttonRoot=new Target();buttonRoot.querySelectorAll=s=>s==='.pressed'?[]:h.buttons;
 manageVillageInputs(scene,()=>new Controls(buttonRoot,()=>actions++,()=>toggles++),debug,()=>toggles++);
 scene.events.emit('sleep');assert.equal(h.win.events.keydown.length,0);h.touch('a');debug.emit('click');assert.equal(actions,0);assert.equal(toggles,0);
 scene.events.emit('wake');assert.equal(h.win.events.keydown.length,1);h.touch('a');assert.equal(actions,1);debug.emit('click');assert.equal(toggles,1);
 scene.events.emit('shutdown');assert.equal(h.win.events.keydown.length,0);assert.equal(debug.events.click.length,0);
});
test('Phaser startup selects IntroScene first only when required; no HTML overlay or navigation',()=>{
 const all=fs.readFileSync('src/main.js','utf8');const code=all.slice(all.indexOf('let storage;'),all.indexOf("document.querySelector('#revisit-intro')"));
 for(const [search,seen,expected] of [['',false,'IntroScene'],['',true,'Village'],['?intro=first',true,'IntroScene'],['?play=1',false,'Village']]){
  let config;class Village{}class IntroScene{constructor(context){this.context=context;}};
  vm.runInNewContext(code,{introductionMode,URLSearchParams,window:{localStorage:{getItem:()=>JSON.stringify({introductionSeen:seen})},location:{search,pathname:'/',hash:''}},history:{replaceState(){}},IntroScene,Village,VIEW_WIDTH:240,VIEW_HEIGHT:160,Phaser:{Game:class{constructor(value){config=value;}},Scale:{NONE:0},WEBGL:2}});
  assert.equal(config.scene[0].name??config.scene[0].constructor.name,expected);
 }
 assert.doesNotMatch(all,/mountIntroduction|intro-overlay|location\.(assign|replace)/);
});
test('promo uses the same responsive canvas without an external links panel',()=>{
 for(const [width,height] of [[393,800],[800,360]]){
  const layout=displayLayout({width,height,dpr:2.75,bottomReserve:48});assert.ok(Math.abs(layout.width/layout.height-1.5)<1e-9);
  if(width>height)assert.ok(layout.height+48+44<=height-8);
 }
 const css=fs.readFileSync('src/intro/phaser.css','utf8');assert.doesNotMatch(css,/#intro-promo-links/);
});
test('compact dialogue pagination preserves every word across all six scenes',()=>{
 const normalize=text=>text.replace(/\s+/g,' ').trim();
 for(const scene of scenes)for(const [,text] of scene.pages){
  const pages=paginateDialogue(text,wrapText);
  assert.equal(normalize(pages.join(' ')),normalize(text));
  for(const page of pages)assert.ok(page.split('\n').length<=DIALOGUE_LINES);
 }
 assert.equal(DIALOGUE_LINES,2);
});
test('A reveals then advances subpages without changing the illustration or losing text',()=>{
 const h=harness('test'),initialKey=h.intro.image.key;
 assert.ok(h.intro.dialogueSteps.length>1);assert.equal(h.message,'');
 h.intro.typeTimer.config.callback();h.intro.typeTimer.config.callback();assert.equal(h.message,h.intro.fullText.slice(0,2));
 h.touch('a');assert.equal(h.message,h.intro.fullText);assert.equal(h.intro.dialogueStep,0);
 h.touch('a');assert.equal(h.intro.dialogueStep,1);assert.equal(h.intro.position.scene,0);assert.equal(h.intro.position.page,0);assert.equal(h.intro.image.key,initialKey);assert.equal(h.message,'');
 h.touch('b');h.camera.emit('camerafadeoutcomplete');
});
test('all narrative subpages are reachable in order before the unmasked promotional image',()=>{
 const h=harness('test'),seen=new Map();
 for(let n=0;n<100&&!h.intro.finishing;n++){
  const p=h.intro.position;
  if(p.scene<5){const key=p.scene+':'+p.page;const steps=seen.get(key)??new Map();steps.set(h.intro.dialogueStep,h.intro.fullText);seen.set(key,steps);assert.ok(h.intro.fullText.split('\n').length<=2);}
  h.touch('a');if(h.intro.changing)h.camera.emit('camerafadeoutcomplete');
 }
 const normalize=text=>text.replace(/\s+/g,' ').trim();
 for(let scene=0;scene<5;scene++)for(let page=0;page<scenes[scene].pages.length;page++)assert.equal(normalize([...seen.get(scene+':'+page).values()].join(' ')),normalize(scenes[scene].pages[page][1]));
 assert.equal(h.promo,true);assert.equal(h.promo,true);h.camera.emit('camerafadeoutcomplete');
});
test('interface wrapping fits narrow widths, accents and long words without truncation',()=>{
 for(const width of [12,24,41,60])for(const scene of scenes)for(const [,text] of scene.pages){
  const lines=wrapMeasuredText(text,value=>value.length,width);assert.ok(lines.every(line=>line.length<=width));
  const pages=paginateDialogue(text,value=>wrapMeasuredText(value,line=>line.length,width));assert.ok(pages.every(page=>page.split('\n').length<=2));
 }
 const word='É'.repeat(100);assert.equal(wrapMeasuredText(word,line=>line.length,12).join(''),word);
});
test('cinematic composition keeps full 3:2 artwork separate from Phaser dialogue objects',()=>{
 const h=harness('test'),image=INTRO_COMPOSITION.image,box=INTRO_COMPOSITION.dialogue;
 assert.equal(h.intro.image.kind,'Image');assert.equal(h.intro.message.kind,'BitmapText');assert.equal(h.intro.speaker.kind,'BitmapText');assert.equal(h.intro.pageCounter.kind,'BitmapText');
 assert.equal(image.width/image.height,1.5);assert.equal(image.y+image.height/2,160);assert.equal(box.alpha,0.8);assert.ok(box.y+box.height<=160);assert.ok(image.x-image.width/2>=0&&image.x+image.width/2<=240);
 assert.equal(INTRO_COMPOSITION.message.width,216);assert.equal(h.intro.image.size[0],240);assert.equal(h.intro.image.size[1],160);
 for(const scene of scenes)for(const [,text] of scene.pages)for(const page of paginateDialogue(text,value=>wrapMeasuredText(value,line=>line.length*6,216)))for(const line of page.split('\n'))assert.ok(line.length*6<=216);
 assert.ok(INTRO_COMPOSITION.message.y+20<=box.y+box.height);
 h.intro.events.emit('shutdown');
});
test('shared keyboard and gamepad controls advance/skip only IntroScene',()=>{
 const h=harness('test');h.win.emit('keydown',{key:'Enter',preventDefault(){}});assert.equal(h.message,h.intro.fullText);h.win.emit('keyup',{key:'Enter'});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>[{axes:[0,0],buttons:[{pressed:false},{pressed:true}]}]}});
 h.intro.update();assert.equal(h.intro.finishing,true);assert.equal(h.village.created,false);h.camera.emit('camerafadeoutcomplete');assert.equal(h.village.created,true);
});
test('main entry has no preview runtime, extra buttons, or HTML dialogue dependency',()=>{
 const dependencies=new Set();function walk(file){if(dependencies.has(file))return;dependencies.add(file);const code=fs.readFileSync(file,'utf8');for(const match of code.matchAll(/from\s+['"]([^'"]+)['"]/g)){if(!match[1].startsWith('.')||!match[1].endsWith('.js'))continue;walk(new URL(match[1],new URL(file,import.meta.url)).pathname);}}
 walk(new URL('../src/main.js',import.meta.url).pathname);
 for(const file of dependencies)assert.doesNotMatch(file,/\/intro\/(runtime|markup|main)\.js$/);
 const binding=fs.readFileSync('src/intro/introBindings.js','utf8');assert.doesNotMatch(binding,/<button|<section|<p[ >]|intro-message|intro-navigation|addEventListener/);
 const scene=fs.readFileSync('src/intro/IntroScene.js','utf8');assert.match(scene,/extends Phaser\.Scene/);assert.match(scene,/this\.add\.image/);assert.match(scene,/this\.add\.bitmapText/);assert.match(scene,/this\.scene\.start\('Village'\)/);assert.doesNotMatch(scene,/this\.hud|textContent|innerHTML/);
 const css=fs.readFileSync('src/intro/phaser.css','utf8');assert.doesNotMatch(css,/intro-dialogue|intro-navigation|intro-extras/);
});
test('DOM bindings create no promo panel and restore existing A/B labels',async()=>{
 const {bindIntroInterface}=await import('../src/intro/introBindings.js');
 const nodes=new Map();const node=key=>{if(!nodes.has(key))nodes.set(key,{hidden:false,textContent:key,dataset:{},attrs:{'aria-label':key},nextElementSibling:{textContent:key+' caption'},getAttribute(name){return this.attrs[name];},setAttribute(name,value){this.attrs[name]=value;}});return nodes.get(key);};
 globalThis.document={querySelector:node,createElement(){assert.fail('Promo must not create HTML');}};globalThis.window={dispatchEvent(){}};
 const oldA=node('[data-control="a"]').nextElementSibling.textContent;
 const bindings=bindIntroInterface();bindings.page(false,'1 / 6');assert.equal(node('[data-control="b"]').nextElementSibling.textContent,'PASSER');
 bindings.page(true,'6 / 6');assert.equal(node('[data-control="a"]').nextElementSibling.textContent,'COMMENCER');assert.equal(node('.console').dataset.introPromo,'false');
 bindings.restore();assert.equal(node('[data-control="a"]').nextElementSibling.textContent,oldA);assert.equal(node('#dialogue').hidden,false);
});
test('view artwork pauses typing and A restores the same narrative position',()=>{
 const h=harness('test');h.intro.typeTimer.config.callback();const text=h.message,position=JSON.stringify(h.intro.position),step=h.intro.dialogueStep;
 h.intro.image.pointerdown();assert.equal(h.intro.message.visible,false);assert.equal(h.intro.typeTimer.paused,true);
 h.touch('a');assert.equal(h.intro.message.visible,true);assert.equal(h.intro.typeTimer.paused,false);assert.equal(h.message,text);assert.equal(h.intro.dialogueStep,step);assert.equal(JSON.stringify(h.intro.position),position);
 h.win.emit('keydown',{key:'ArrowUp',preventDefault(){}});h.intro.update();assert.equal(h.intro.message.visible,false);h.intro.update();assert.equal(h.intro.message.visible,false);
 h.touch('b');h.camera.emit('camerafadeoutcomplete');assert.equal(h.village.created,true);
});

test('original pixel font covers French story without missing glyphs or smoothing',()=>{
 const code=fs.readFileSync('src/intro/pixelFont.js','utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');const font={};vm.runInNewContext(code+';globalThis.glyphs=GLYPHS;globalThis.rows=glyphRows;',font);
 for(const scene of scenes)for(const character of scene.title+scene.pages.flat().join(''))assert.ok(font.glyphs.includes(character),'Missing glyph '+character);
 for(const character of font.glyphs){const rows=font.rows(character);assert.equal(rows.length,10);assert.ok(rows.every(row=>row.length===5&&/^[01]+$/.test(row)));}
 assert.match(code,/imageSmoothingEnabled=false/);assert.match(code,/FilterMode.NEAREST/);
});

test('promo-only crisp artwork and shop plaques retain the full source, URLs and final transition',()=>{
 const h=harness('test');const opened=[];h.win.open=(...args)=>opened.push(args);
 assert.equal(h.intro.promoEndcard,null);
 for(let i=0;i<100&&h.intro.position.scene<5;i++){h.touch('a');if(h.intro.changing)h.camera.emit('camerafadeoutcomplete');if(h.intro.position.scene<5)assert.equal(h.intro.promoEndcard,null);}
 assert.equal(h.intro.position.scene,5);assert.equal(h.intro.image.key,'intro-promo');assert.deepEqual(h.intro.image.size,[240,160]);
 const objects=h.intro.promoEndcard.objects;assert.ok(objects.every(o=>o.visible));const shader=objects.find(o=>o.kind==='Shader');assert.equal(shader.textures[0],'intro-promo');assert.equal(shader.config.initialUniforms.iChannel0,0);
 assert.match(shader.config.fragmentSource,/1.0\/240.0,1.0\/160.0/);assert.match(shader.config.fragmentSource,/detail\*0.36/);
 const labels=objects.filter(o=>o.kind==='BitmapText').map(o=>o.text);for(const label of ['Gacha Treasure','Osaka Treasure','gacha-treasure.fr','osaka-treasure.com'])assert.ok(labels.includes(label));
 for(const label of objects.filter(o=>o.kind==='BitmapText'&&o.text.includes('-treasure.'))){assert.ok(label.x>=4);assert.ok(label.x+label.text.length*6<=236);}
 const plates=objects.filter(o=>o.pointerup);assert.equal(plates.length,2);plates.forEach(o=>o.pointerup());assert.deepEqual(opened.map(o=>o[0]),['https://gacha-treasure.fr','https://osaka-treasure.com']);assert.ok(opened.every(o=>o[2]==='noopener,noreferrer'));
 h.touch('a');plates[0].pointerup();assert.equal(opened.length,2);assert.equal(h.intro.finishing,true);h.camera.emit('camerafadeoutcomplete');assert.equal(h.village.created,true);
});
