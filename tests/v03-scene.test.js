import {assetUrl} from '../src/assetUrl.js';
import {manageVillageInputs} from '../src/intro/villageInputLifecycle.js';
import { mountMobileLayout } from '../src/ui/mobileLayout.js';
// Exercise the actual scene/action callback with simulated Phaser and DOM APIs.
// This checks gameplay wiring; it is not a WebGL/browser rendering test.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {Player} from '../src/entities/Player.js';
import {Controls} from '../src/input/Controls.js';
import {createInterface} from '../src/ui/interface.js';
import {drawWorld,VIEW_WIDTH,VIEW_HEIGHT} from '../src/world/gbaWorld.js';
import {PLAYER_ORIGIN_Y,idleFrame,characterDepth} from '../src/world/characterGraphics.js';
import * as map from '../src/world/map.js';
class Target{
 constructor(control){this.dataset={control};this.events={};this.attrs={};this.classes=new Set();this.style={setProperty(name,value){this[name]=value;}};this.classList={add:k=>this.classes.add(k),remove:k=>this.classes.delete(k)};}
 addEventListener(n,f){(this.events[n]??=[]).push(f);}removeEventListener(n,f){this.events[n]=(this.events[n]??[]).filter(v=>v!==f);}setPointerCapture(){}
 setAttribute(n,v){this.attrs[n]=v;}emit(n,id=1){for(const f of this.events[n]??[])f({pointerId:id,preventDefault(){}});}
}
function visual(x=0,y=0,key,frame){return {x,y,key,frame,setOrigin(x,y){this.originX=x;this.originY=y;return this;},setDepth(d){this.depth=d;return this;},setFrame(f){this.frame=f;return this;},play(k){this.animation=k;},stop(){this.animation=null;}};}
test('actual scene preserves touch movement, NPC dialogue, debug and GBA canvas sizing',()=>{
 const win=new Target(),doc=new Target(),buttons=['up','down','left','right','a','b'].map(k=>new Target(k));
 win.location={search:'',pathname:'/',hash:''};win.innerWidth=360;win.innerHeight=780;win.getComputedStyle=()=>({paddingLeft:"4px",paddingRight:"4px",paddingTop:"4px",paddingBottom:"4px"});doc.documentElement={clientWidth:360};
 const elements=Object.fromEntries(['#app','#coordinates','#screen','#game','#dialogue','#speaker','#message','#debug','#fullscreen','#revisit-intro','#display-status','.console'].map(id=>[id,new Target()]));
 const root=new Target();root.querySelectorAll=s=>s==='.pressed'?buttons.filter(b=>b.classes.has('pressed')):buttons;
 doc.querySelector=s=>s==='.controls'?root:elements[s];
 globalThis.window=win;globalThis.document=doc;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>[]}});
 let game;
 class Game{constructor(config){this.config=config;this.canvas={style:{}};this.events={once(){}};game=this;}}
 const source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8').split('\n').filter(line=>!line.startsWith('import ')&&!line.startsWith('export ')&&!line.startsWith('if(import.meta.hot)')).join('\n');
 const context={assetUrl,IntroScene:class{},introductionMode:()=>null,manageVillageInputs,URLSearchParams,history:{replaceState(){}},Phaser:{Scene:class{},Game,WEBGL:2,Scale:{NONE:0}},Player,Controls,createInterface,mountMobileLayout,drawWorld,VIEW_WIDTH,VIEW_HEIGHT,PLAYER_ORIGIN_Y,idleFrame,characterDepth,...map,document:doc,window:win};
 vm.runInNewContext(source+'\nglobalThis.testScene=Village;',context);
 assert.equal(game.config.width,240);assert.equal(game.config.height,160);assert.equal(game.canvas.style.width,'351px');assert.equal(game.canvas.style.height,'234px');assert.equal(elements['#screen'].style.width,'351px');
 assert.ok(elements['#app'].innerHTML.includes('V0.4'));
 const scene=new context.testScene(),loads=[];let pending;
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/assets/gba-v03/manifest.json',import.meta.url)));
 scene.load={json(...args){loads.push(args);},spritesheet(...args){loads.push(args);},on(){}};
 scene.cache={json:{get(){return manifest;}}};
 scene.add={image:visual,sprite:visual,graphics(){return {visible:false,setDepth(){return this;},setVisible(v){this.visible=v;return this;},fillStyle(){},fillRect(){},lineStyle(){},lineBetween(){}};}};
 scene.anims={create(){}};scene.tweens={add(t){pending=t;}};const camera={setBounds(...v){this.bounds=v;},setScroll(x,y){this.x=x;this.y=y;}};
 scene.cameras={main:camera};const cleanups=[];scene.events={once(n,f){cleanups.push(f);},on(){},off(){}};
 scene.preload();scene.create();assert.deepEqual(camera.bounds,[0,0,320,240]);assert.equal(loads.length,4);assert.equal(scene.player.sprite.key,'hero-gba');
 const touch=dir=>buttons.find(b=>b.dataset.control===dir);
 touch('left').emit('pointerdown');scene.update();assert.equal(pending.x,120);assert.equal(pending.y,152);assert.equal(scene.player.sprite.animation,'walk-left');touch('left').emit('pointerup');
 Object.assign(scene.player.sprite,{x:pending.x,y:pending.y});pending.onComplete();assert.equal(scene.player.x,7);assert.equal(scene.player.moving,false);
 // Stand directly below Mila and face up; use the real scene's action callback.
 Object.assign(scene.player,{x:10,y:8,facing:'up'});Object.assign(scene.player.sprite,{x:168,y:136});
 touch('a').emit('pointerdown',2);touch('a').emit('pointerup',2);assert.equal(elements['#dialogue'].hidden,false);assert.equal(elements['#speaker'].textContent,'Mila');assert.ok(elements['#message'].textContent.includes('Bienvenue'));
 touch('left').emit('pointerdown');scene.update();assert.equal(scene.player.moving,false);touch('left').emit('pointerup');
 touch('a').emit('pointerdown',2);touch('a').emit('pointerup',2);assert.ok(elements['#message'].textContent.includes('atelier'));
 touch('a').emit('pointerdown',2);touch('a').emit('pointerup',2);assert.ok(elements['#message'].textContent.includes('monstres'));
 touch('a').emit('pointerdown',2);touch('a').emit('pointerup',2);assert.equal(elements['#dialogue'].hidden,true);
 touch('a').emit('pointerdown',2);touch('a').emit('pointerup',2);touch('b').emit('pointerdown',3);touch('b').emit('pointerup',3);assert.equal(elements['#dialogue'].hidden,true);
 scene.player.facing='right';touch('a').emit('pointerdown',2);touch('a').emit('pointerup',2);assert.equal(elements['#dialogue'].hidden,true);
 elements['#debug'].emit('click');assert.equal(scene.debugLayer.visible,true);assert.equal(elements['#debug'].attrs['aria-pressed'],'true');elements['#debug'].emit('click');assert.equal(scene.debugLayer.visible,false);
 assert.ok(camera.x>=0&&camera.x<=80&&camera.y>=0&&camera.y<=80);
 cleanups.forEach(f=>f());assert.equal(scene.controls.held.size,0);
});
