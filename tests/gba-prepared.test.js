import {compareBaseline} from './fixtures/baseline.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {decodePNG,encodePNG,crop} from '../tools/asset-pixels.mjs';
const base=new URL('../public/assets/gba-prepared/',import.meta.url);
const load=file=>decodePNG(fs.readFileSync(new URL(file,base)));
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',base)));
test('prepared PNGs have real alpha, twelve mapped poses and original-source hashes',()=>{
 for(const [file,source] of Object.entries(manifest.sources)){
  const bytes=fs.readFileSync(new URL('../public/assets/'+file,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
  assert.ok(source.alpha.transparent>0);assert.ok(source.alpha.partial>0);
 }
 for(const actor of Object.values(manifest.characters)){
  const sheet=load(actor.file);assert.equal(sheet.width,96);assert.equal(sheet.height,128);
  assert.equal(actor.frames.length,12);assert.equal(actor.origin.y*actor.frameHeight,31);
  for(const dir of ['down','left','right','up'])assert.equal(actor.frames.filter(f=>f.direction===dir).length,3);
  for(const frame of actor.frames){
   const part=crop(sheet,{x:frame.index%3*32,y:Math.floor(frame.index/3)*32,width:32,height:32});
   let count=0;for(let i=3;i<part.pixels.length;i+=4){assert.ok([0,255].includes(part.pixels[i]));if(part.pixels[i])count++;}
   assert.ok(count>150);assert.ok(frame.content.width<=32&&frame.content.height<=30);
   assert.equal(frame.content.y+frame.content.height,31);
   assert.ok(Math.abs(frame.content.width-frame.sourceBounds.width*actor.uniformScale)<=0.5);
   assert.ok(Math.abs(frame.content.height-frame.sourceBounds.height*actor.uniformScale)<=0.5);
  }
  assert.deepEqual(decodePNG(encodePNG(sheet)),sheet);
 }
});
test('modular 16 px tiles reconstruct the prepared decor without stretching',()=>{
 const atlas=load(manifest.tileset.file);
 assert.equal(atlas.width%16,0);assert.equal(atlas.height%16,0);
 const seen=new Set();
 for(const decor of Object.values(manifest.decor)){
  const object=load(decor.file);assert.equal(object.width%16,0);assert.equal(object.height%16,0);
  assert.equal(decor.tiles.length,object.width*object.height/256);
  for(const tile of decor.tiles){
   assert.ok(!seen.has(tile.index));seen.add(tile.index);
   assert.deepEqual(crop(atlas,{x:tile.index%8*16,y:Math.floor(tile.index/8)*16,width:16,height:16}).pixels,crop(object,{x:tile.column*16,y:tile.row*16,width:16,height:16}).pixels);
  }
 }
 assert.equal(seen.size,manifest.tileset.count);
});
test('imported sources and controls remain unchanged after playable integration',()=>{
 compareBaseline('V0.2-PRE-GBA','src/input/Controls.js');
 for(const name of ['hero-gba.png','npc-gba.png','village-gba.png'])compareBaseline('V0.2-PRE-GBA','public/assets/'+name);
});
