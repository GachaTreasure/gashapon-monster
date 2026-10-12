import test from 'node:test';
import assert from 'node:assert/strict';
import {createArt} from '../src/world/art.js';
import {tileTexture} from '../src/world/sceneryArt.js';
import {rows} from '../src/world/map.js';
test('every map tile has a generated texture, NPC and hero share 16 × 24 scale',()=>{
 const textures=new Map();
 createArt({textures:{createCanvas(key,width,height){assert.ok(!textures.has(key));textures.set(key,{width,height});return {context:{set fillStyle(color){assert.match(color,/^#[a-f0-9]{6}$/);},fillRect(x,y,w,h){for(const n of [x,y,w,h])assert.ok(Number.isInteger(n));}},refresh(){}};}}});
 rows.forEach((row,y)=>[...row].forEach((tile,x)=>assert.ok(textures.has(tileTexture(tile,x,y)),`${x},${y}`)));
 assert.deepEqual(textures.get('npc'),{width:16,height:24});
 assert.deepEqual(textures.get('hero-down-0'),textures.get('npc'));
 assert.equal([...textures.keys()].filter(k=>k.startsWith('house-')).length,12);
});
