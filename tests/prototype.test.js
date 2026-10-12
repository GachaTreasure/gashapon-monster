import test from 'node:test';
import assert from 'node:assert/strict';
import { rows,collisions,WIDTH,HEIGHT,isBlocked,destination,spawn,npc,cameraPosition } from '../src/world/map.js';
import { Controls } from '../src/input/Controls.js';
import { Player } from '../src/entities/Player.js';
test('20 × 15 tiles, explicit collisions match trees, walls and fences',()=>{
 assert.equal(rows.length,HEIGHT);assert.equal(collisions.length,HEIGHT);
 rows.forEach((row,y)=>{assert.equal(row.length,WIDTH);assert.equal(collisions[y].length,WIDTH);[...row].forEach((tile,x)=>assert.equal(isBlocked(x,y),['T','H','W','D','F'].includes(tile),`${x},${y} ${tile}`));});
 assert.equal(isBlocked(spawn.x,spawn.y,[npc]),false);
 assert.equal(destination(5,4,'right'),null);assert.equal(destination(1,4,'right'),null);
 assert.equal(destination(10,8,'up',[npc]),null);
});
test('every step stays in bounds, cardinal and on a free tile',()=>{
 for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)for(const dir of ['up','down','left','right']){
  const next=destination(x,y,dir,[npc]);if(next){assert.ok(next.x>=0&&next.x<WIDTH&&next.y>=0&&next.y<HEIGHT);assert.equal(Math.abs(next.x-x)+Math.abs(next.y-y),1);assert.equal(isBlocked(next.x,next.y,[npc]),false);}
 }
 for(const [x,y] of [[-1,0],[20,0],[0,-1],[0,15],[1.5,2]])assert.ok(isBlocked(x,y));
});
test('entire walkable village accessible from spawn',()=>{
 const seen=new Set(),queue=[spawn];while(queue.length){const p=queue.shift(),key=`${p.x},${p.y}`;if(seen.has(key))continue;seen.add(key);for(const dir of ['up','down','left','right']){const n=destination(p.x,p.y,dir,[npc]);if(n&&!seen.has(`${n.x},${n.y}`))queue.push(n);}}
 for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)if(!isBlocked(x,y,[npc]))assert.ok(seen.has(`${x},${y}`));
});
test('camera never shows outside the 320 × 240 world',()=>{
 for(let y=-16;y<=256;y+=4)for(let x=-16;x<=336;x+=4){const p=cameraPosition(x,y);assert.ok(p.x>=0&&p.y>=0&&p.x+240<=320&&p.y+160<=240);}
});
test('player finishes precisely on grid and rejects overlapping moves',()=>{
 let tween;const sprite={setOrigin(x,y){this.originX=x;this.originY=y;return this},setDepth(){return this},setFrame(frame){this.frame=frame;return this},play(){},stop(){}};
 const scene={add:{sprite(x,y){sprite.x=x;sprite.y=y;return sprite;}},anims:{create(){}},tweens:{add(config){tween=config;}}};
 const player=new Player(scene,spawn,[npc]);assert.equal(sprite.originX,0.5);assert.equal(sprite.originY,23/32);player.step('left');assert.ok(player.moving);player.step('up');assert.equal(player.facing,'left');Object.assign(sprite,{x:tween.x,y:tween.y});tween.onComplete();assert.equal(player.x,7);assert.equal(player.y,9);assert.equal(sprite.x,120);assert.equal(sprite.y,152);assert.equal(player.moving,false);
});
class Target {
 constructor(control){this.dataset={control};this.listeners={};this.classes=new Set();this.classList={add:k=>this.classes.add(k),remove:k=>this.classes.delete(k)};}
 addEventListener(n,fn){(this.listeners[n]??=[]).push(fn);}removeEventListener(n,fn){this.listeners[n]=this.listeners[n].filter(f=>f!==fn);}setPointerCapture(){}
 emit(n,id=1,key){for(const fn of this.listeners[n]??[])fn({pointerId:id,key,preventDefault(){},repeat:false});}
}
test('touch press, multitouch A, release, cancellation, keyboard and gamepad',()=>{
 const win=new Target(),doc=new Target();globalThis.window=win;globalThis.document=doc;
 let pad=null;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>[pad]}});
 const buttons=['up','down','left','right','a','b'].map(k=>new Target(k));
 const root={querySelectorAll:selector=>selector==='.pressed'?buttons.filter(b=>b.classes.has('pressed')):buttons};const actions=[];const controls=new Controls(root,a=>actions.push(a),()=>{});
 buttons[0].emit('pointerdown',1);assert.equal(controls.direction(),'up');buttons[4].emit('pointerdown',2);assert.deepEqual(actions,['a']);assert.equal(controls.direction(),'up');buttons[0].emit('pointercancel',1);assert.equal(controls.direction(),null);buttons[4].emit('lostpointercapture',2);assert.equal(controls.held.size,0);
 buttons[2].emit('pointerdown',3);buttons[2].emit('pointerup',3);assert.equal(controls.direction(),null);
 win.emit('keydown',1,'ArrowRight');assert.equal(controls.direction(),'right');win.emit('blur');assert.equal(controls.direction(),null);
 pad={axes:[-0.8,0],buttons:Array.from({length:16},()=>({pressed:false}))};pad.buttons[0].pressed=true;controls.poll();controls.poll();assert.equal(controls.direction(),'left');assert.deepEqual(actions,['a','a']);pad=null;controls.poll();assert.equal(controls.direction(),null);controls.destroy();assert.equal(win.listeners.keydown.length,0);
});
