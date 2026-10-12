import {assetUrl} from '../src/assetUrl.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runInNewContext} from 'node:vm';
import {introductionMode} from '../src/intro/flow.js';
import {GAME_INTRO_KEY,scenes,advance} from '../src/intro/story.js';
import {introMarkup} from '../src/intro/markup.js';
function storage(){const values=new Map([['other-save','untouched']]);return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
test('first launch, next launch, force-first test and denied storage',()=>{
 const s=storage();assert.equal(introductionMode(s),'first');
 s.setItem(GAME_INTRO_KEY,JSON.stringify({introductionSeen:true}));assert.equal(introductionMode(s),null);
 assert.equal(introductionMode(s,'?intro=first'),'test');assert.equal(introductionMode(s,'?play=1'),null);
 assert.equal(introductionMode({getItem(){throw Error('denied');}}),'first');
});
class Target{
 constructor(){this.handlers={};this.textContent='';this.hidden=false;this.disabled=false;this.classes=new Set();this.classList={add:k=>this.classes.add(k),remove:k=>this.classes.delete(k)};}
 addEventListener(name,fn,option){(this.handlers[name]??=[]).push({fn,option});}
 removeEventListener(name,fn){this.handlers[name]=(this.handlers[name]??[]).filter(item=>item.fn!==fn);}
 async emit(name,event={}){for(const {fn} of this.handlers[name]??[])await fn(event);}
}
function runtime(){
 const elements=new Map(),root=new Target();root.querySelector=id=>{if(!elements.has(id))elements.set(id,new Target());return elements.get(id);};
 const win=new Target(),doc=new Target(),timers=new Map();let interval,sequence=0,finishCount=0,skipped;
 class Image{set src(src){this.value=src;this.naturalWidth=240;this.naturalHeight=160;this.onload();}get src(){return this.value;}}
 const source=fs.readFileSync('src/intro/runtime.js','utf8').replace(/^import .*;\n/gm,'').replace('export function mountIntroduction','function mountIntroduction');
 const context={assetUrl,scenes,advance,introMarkup,window:win,document:doc,Image,setInterval(fn){interval=fn;return 1;},clearInterval(){interval=null;},setTimeout(fn){timers.set(++sequence,fn);return sequence;},clearTimeout(id){timers.delete(id);}};
 runInNewContext(source+'\nglobalThis.mount=mountIntroduction;',context);
 root.requestFullscreen=async()=>{doc.fullscreenElement=root;await doc.emit('fullscreenchange');};doc.exitFullscreen=async()=>{doc.fullscreenElement=null;await doc.emit('fullscreenchange');};
 const dispose=context.mount(root,{fullscreenTarget:root,onFinish:async value=>{finishCount++;skipped=value;}});
 return {root,win,doc,e:id=>root.querySelector('#'+id),timers,dispose,get finished(){return finishCount;},get skipped(){return skipped;},get interval(){return interval;}};
}
test('runtime: six scenes, promo links, A completes in place, handlers disposed',async()=>{
 const r=runtime();assert.match(r.e('counter').textContent,/1 \/ 6/);
 for(let n=0;n<40&&!r.finished;n++){
  await r.e('next').emit('click');for(const [id,fn] of [...r.timers]){r.timers.delete(id);fn();}
 }
 assert.equal(r.finished,1);assert.equal(r.skipped,false);assert.equal(r.e('promo-links').hidden,false);assert.match(r.e('next').textContent,/Commencer l’aventure/);assert.equal(r.interval,null);
 await r.e('skip').emit('click');assert.equal(r.finished,1);r.dispose();assert.equal(r.win.handlers.keydown.length,0);assert.equal(r.doc.handlers.fullscreenchange.length,0);
});
test('runtime: B cancels a fade, keys never reach village, stable fullscreen target',async()=>{
 const r=runtime();await r.e('intro-fullscreen').emit('click');assert.equal(r.doc.fullscreenElement,r.root);assert.equal(r.e('intro-fullscreen').textContent,'Quitter le plein écran');
 await r.e('next').emit('click');await r.e('next').emit('click');await r.e('next').emit('click');await r.e('next').emit('click');assert.equal(r.timers.size,1);
 let blocked=false,prevented=false;
 assert.equal(r.win.handlers.keydown[0].option,true);
 await r.win.emit('keydown',{key:'Escape',stopImmediatePropagation(){blocked=true;},preventDefault(){prevented=true;}});
 assert.ok(blocked&&prevented);assert.equal(r.finished,1);assert.equal(r.skipped,true);assert.equal(r.timers.size,0);assert.equal(r.doc.fullscreenElement,r.root);r.dispose();
});
