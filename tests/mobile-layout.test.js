import {baseline,compareBaseline} from './fixtures/baseline.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {displayLayout,mountMobileLayout} from '../src/ui/mobileLayout.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('portrait fills 95–98% of typical phone widths, preserving 3:2 and device-aligned edges',()=>{
 for(const [width,height,dpr] of [[320,640,2],[360,780,3],[393,800,2.75],[412,820,2.625],[480,900,1]]){
  const result=displayLayout({width,height,dpr});assert.equal(result.landscape,false);
  assert.ok(result.width/width>=0.95&&result.width/width<=0.98);near(result.width/result.height,1.5);
  near(result.width*dpr,Math.round(result.width*dpr));near(result.height*dpr,Math.round(result.height*dpr));
  assert.ok(result.width<=width-8);assert.ok(result.width>240);
 }
});
test('landscape reserves comfortable side controls and fits browser/safe areas without cropping',()=>{
 for(const [width,height,dpr,padding] of [[800,360,3,{left:4,right:4,top:4,bottom:4}],[873,393,2.75,{left:28,right:12,top:4,bottom:20}],[700,300,2,{left:4,right:4,top:4,bottom:4}],[960,420,2,{left:24,right:4,top:4,bottom:24}]]){
  const r=displayLayout({width,height,dpr,padding});assert.equal(r.landscape,true);assert.ok(r.rail>=132&&r.rail<=156);
  assert.ok(r.width+r.rail*2+8+padding.left+padding.right<=width+1e-6);
  assert.ok(r.height+44+padding.top+padding.bottom<=height+1e-6);near(r.width/r.height,1.5);
 }
});
class Target{
 constructor(){this.events={};this.style={setProperty(n,v){this[n]=v;}};this.dataset={};this.attrs={};}
 addEventListener(n,f){(this.events[n]??=[]).push(f);}removeEventListener(n,f){this.events[n]=this.events[n].filter(v=>v!==f);}
 setAttribute(n,v){this.attrs[n]=v;}
 async emit(n){for(const f of this.events[n]??[])await f();}
}
function setup(){
 const win=new Target(),doc=new Target(),viewport=new Target();Object.assign(win,{innerWidth:393,innerHeight:800,devicePixelRatio:2.75,visualViewport:viewport,getComputedStyle:()=>({paddingLeft:'4px',paddingRight:'4px',paddingTop:'4px',paddingBottom:'4px'})});Object.assign(viewport,{width:393,height:800});doc.documentElement={clientWidth:393};
 const root=new Target(),screen=new Target(),button=new Target(),status=new Target();const nodes={'.console':root,'#screen':screen,'#fullscreen':button,'#display-status':status};doc.querySelector=s=>nodes[s];
 let clear=0,bounds=0;const game={canvas:{width:240,height:160,style:{}},events:{once(){},off(){}},scene:{getScene:()=>({controls:{clear(){clear++;}}})},scale:{updateBounds(){bounds++;},displayScale:{set(x,y){this.x=x;this.y=y;}}}};
 const dispose=mountMobileLayout(game,{win,doc});return {win,doc,viewport,root,screen,button,status,game,dispose,counts:()=>({clear,bounds})};
}
test('orientation and browser-bar resize only change CSS; Phaser backing dimensions remain fixed',async()=>{
 const s=setup();assert.equal(s.game.canvas.style.width,'384px');assert.equal(s.game.canvas.style.height,'256px');assert.equal(s.root.dataset.layout,'portrait');near(s.game.scale.displayScale.x,240/384);
 Object.assign(s.win,{innerWidth:800,innerHeight:360});Object.assign(s.viewport,{width:800,height:360});s.doc.documentElement.clientWidth=800;
 await s.win.emit('orientationchange');assert.equal(s.root.dataset.layout,'landscape');assert.equal(s.counts().clear,1);
 const before=parseFloat(s.game.canvas.style.width);s.viewport.height=400;await s.viewport.emit('resize');assert.ok(parseFloat(s.game.canvas.style.width)>before);
 assert.equal(s.game.canvas.width,240);assert.equal(s.game.canvas.height,160);assert.ok(s.counts().bounds>=3);s.dispose();assert.equal(s.win.events.resize.length,0);assert.equal(s.doc.events.fullscreenchange.length,0);
});
test('fullscreen enters, offers exit and follows system exit; rejection leaves game usable',async()=>{
 const s=setup();let entries=0,exits=0;
 s.root.requestFullscreen=async()=>{entries++;s.doc.fullscreenElement=s.root;await s.doc.emit('fullscreenchange');};
 s.doc.exitFullscreen=async()=>{exits++;s.doc.fullscreenElement=null;await s.doc.emit('fullscreenchange');};
 await s.button.emit('click');assert.equal(entries,1);assert.equal(s.button.textContent,'Quitter le plein écran');assert.equal(s.button.attrs['aria-pressed'],'true');
 await s.button.emit('click');assert.equal(exits,1);assert.equal(s.button.textContent,'Plein écran');assert.equal(s.button.attrs['aria-pressed'],'false');
 await s.button.emit('click');s.doc.fullscreenElement=null;await s.doc.emit('fullscreenchange');assert.equal(s.button.textContent,'Plein écran');
 s.root.requestFullscreen=async()=>{throw Error('denied');};await s.button.emit('click');assert.equal(s.status.hidden,false);assert.ok(s.status.textContent.includes('indisponible'));assert.equal(s.button.disabled,false);assert.equal(s.game.canvas.width,240);s.dispose();
});
test('presentation changes preserve every asset and gameplay system from V0.3 backup',()=>{
 for(const dir of ['public','src/world','src/entities','src/input'])compareBaseline('V0.3-PRE-ERGONOMIE',dir);
 const current=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const update=source=>source.slice(source.indexOf(' update(){'),source.indexOf('\n}\n',source.indexOf(' update(){')));assert.equal(update(current),baseline.update);
 const action=source=>source.slice(source.indexOf('action=>{'),source.indexOf('},toggleDebug);')+15);assert.equal(action(current),baseline.action);
 const dialogue=source=>source.slice(source.indexOf(' return {'));
 assert.equal(dialogue(fs.readFileSync(new URL('../src/ui/interface.js',import.meta.url),'utf8')),baseline.dialogue);
});
