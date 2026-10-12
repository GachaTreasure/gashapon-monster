import test from 'node:test';
import assert from 'node:assert/strict';
import { drawHero, HERO_WIDTH, HERO_HEIGHT, HERO_ORIGIN_Y } from '../src/world/heroArt.js';
test('twelve hero poses fit 16 × 24, keep foot baseline and distinct walk frames',()=>{
 assert.equal(HERO_WIDTH,16);assert.equal(HERO_HEIGHT,24);
 assert.equal(8-HERO_HEIGHT*HERO_ORIGIN_Y+HERO_HEIGHT,16);
 for(const dir of ['up','down','left','right']){
  const frames=[];
  for(let frame=0;frame<3;frame++){
   const pixels=new Map();drawHero((color,x,y,w,h)=>{
    assert.match(color,/^#[a-f0-9]{6}$/);assert.ok(Number.isInteger(x)&&Number.isInteger(y));
    assert.ok(x>=0&&x<HERO_WIDTH&&y>=0&&y<HERO_HEIGHT);assert.equal(w,1);assert.equal(h,1);
    pixels.set(`${x},${y}`,color);
   },dir,frame);
   frames.push(pixels);
  }
  assert.equal(new Set(frames.map(p=>JSON.stringify([...p]))).size,3);
  for(const [key,color] of frames[0])if(Number(key.split(',')[1])<19){assert.equal(frames[1].get(key),color);assert.equal(frames[2].get(key),color);}
 }
});
