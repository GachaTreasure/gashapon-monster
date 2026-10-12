import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as map from '../src/world/map.js';
import * as previous from './fixtures/v02-map.js';
import {worldRenderPlan,groundTextureAt,VIEW_WIDTH,VIEW_HEIGHT} from '../src/world/gbaWorld.js';
import {idleFrame,walkFrames,PLAYER_ORIGIN_Y,characterDepth} from '../src/world/characterGraphics.js';
import {Player} from '../src/entities/Player.js';
import {decodePNG,crop} from '../tools/asset-pixels.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../public/assets/gba-v03/manifest.json',import.meta.url)));
test('logical map, collisions and destinations exactly match the saved version',()=>{
 for(const key of ['rows','collisions','TILE','WIDTH','HEIGHT','spawn','npc','directions'])assert.deepEqual(map[key],previous[key]);
 for(let y=-1;y<=15;y++)for(let x=-1;x<=20;x++)for(const dir of Object.keys(map.directions))assert.deepEqual(map.destination(x,y,dir,[map.npc]),previous.destination(x,y,dir,[map.npc]));
});
test('240 × 160 camera clamps to all four corners and follows logical centres',()=>{
 assert.equal(VIEW_WIDTH,240);assert.equal(VIEW_HEIGHT,160);
 assert.deepEqual(map.cameraPosition(0,0),{x:0,y:0});assert.deepEqual(map.cameraPosition(320,240),{x:80,y:80});
 assert.deepEqual(map.cameraPosition(160,120),{x:40,y:40});
});
test('PNG frame mapping and every cardinal step retain grid endpoints and duration',()=>{
 for(const [dir,[dx,dy]] of Object.entries(map.directions)){
  let tween;const animations=[];const sprite={setOrigin(x,y){this.originX=x;this.originY=y;return this;},setDepth(d){this.depth=d;return this;},setFrame(f){this.frame=f;return this;},play(key){this.animation=key;},stop(){this.stopped=true;}};
  const scene={add:{sprite(x,y,key,frame){Object.assign(sprite,{x,y,key,frame});return sprite;}},anims:{create(a){animations.push(a);}},tweens:{add(a){tween=a;}}};
  const player=new Player(scene,map.spawn,[map.npc]);
  assert.equal(sprite.key,'hero-gba');assert.equal(sprite.originY,PLAYER_ORIGIN_Y);
  assert.equal(sprite.y-32*PLAYER_ORIGIN_Y+31,(map.spawn.y+1)*16);
  for(const a of animations){const direction=a.key.slice(5);assert.deepEqual(a.frames.map(f=>f.frame),walkFrames(direction));assert.ok(a.frames.every(f=>f.key==='hero-gba'));}
  player.step(dir);assert.equal(sprite.animation,'walk-'+dir);assert.equal(tween.duration,180);assert.ok(walkFrames(dir).length/12*1000<=tween.duration);assert.equal(tween.x,(map.spawn.x+dx)*16+8);assert.equal(tween.y,(map.spawn.y+dy)*16+8);
  player.step(dir);assert.equal(player.x,map.spawn.x);assert.equal(player.y,map.spawn.y);
  sprite.x=tween.x;sprite.y=tween.y;tween.onComplete();assert.equal(player.moving,false);assert.equal(player.x,map.spawn.x+dx);assert.equal(player.y,map.spawn.y+dy);assert.equal(sprite.frame,idleFrame(dir));
 }
});
test('render plan uses every existing blocker and connected path masks',()=>{
 const plan=worldRenderPlan();assert.equal(plan.ground.length,300);
 assert.equal(plan.objects.filter(o=>o.name==='tree').length,map.rows.join('').split('T').length-1);
 assert.equal(plan.objects.filter(o=>o.name==='fence').length,map.rows.join('').split('F').length-1);
 const house=plan.objects.find(o=>o.name==='house-playable');assert.deepEqual(house,{name:'house-playable',x:96,y:32,depth:96});
 for(const o of [...plan.ground,...plan.objects])assert.ok(manifest.decor[o.name],o.name);
 for(let y=0;y<15;y++)for(let x=0;x<20;x++)if(map.rows[y][x]==='p'){
  const name=groundTextureAt(x,y),mask=name==='path'?15:Number(name.slice(5));
  assert.equal(Boolean(mask&2),map.rows[y]?.[x+1]==='p');assert.equal(Boolean(mask&4),map.rows[y+1]?.[x]==='p');
 }
 assert.ok(characterDepth(72)<house.depth);assert.ok(characterDepth(104)>house.depth);
});
test('playable house tiles reconstruct the source-derived door and garden exactly',()=>{
 const base=new URL('../public/assets/gba-v03/',import.meta.url),load=file=>decodePNG(fs.readFileSync(new URL(file,base)));
 const atlas=load('village-tiles.png'),house=load('house.png'),entry=manifest.decor['house-playable'];
 assert.equal(entry.door.source,'village-gba.png');assert.equal(entry.tiles.length,16);
 for(const tile of entry.tiles)assert.deepEqual(crop(atlas,{x:tile.index%8*16,y:Math.floor(tile.index/8)*16,width:16,height:16}).pixels,crop(house,{x:tile.column*16,y:tile.row*16,width:16,height:16}).pixels);
 for(const [x,y] of [[7,5],[8,5]])assert.equal(map.isBlocked(x,y),true);
});
