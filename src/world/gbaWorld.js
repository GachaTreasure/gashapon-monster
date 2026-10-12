import {rows,TILE,WIDTH,HEIGHT} from './map.js';
export const VIEW_WIDTH=240,VIEW_HEIGHT=160;
export function groundTextureAt(x,y){
 const tile=rows[y]?.[x];
 if(tile==='f')return 'flowers';
 if(tile!=='p')return 'grass';
 const path=(px,py)=>rows[py]?.[px]==='p';
 const mask=(path(x,y-1)?1:0)|(path(x+1,y)?2:0)|(path(x,y+1)?4:0)|(path(x-1,y)?8:0);
 return mask===15?'path':'path-'+mask;
}
export function worldRenderPlan(){
 const ground=[],objects=[];
 for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
  ground.push({name:groundTextureAt(x,y),x:x*TILE,y:y*TILE});
  const tile=rows[y][x],feet=(y+1)*TILE;
  if(tile==='T')objects.push({name:'tree',x:x*TILE-8,y:feet-48,depth:feet});
  if(tile==='F')objects.push({name:'fence',x:x*TILE,y:y*TILE,depth:feet});
 }
 // Logical footprint stays x=6..9, y=3..5. Roof extends into the walkable row behind.
 objects.push({name:'house-playable',x:6*TILE,y:2*TILE,depth:6*TILE});
 return {ground,objects};
}
export function drawWorld(scene,manifest){
 const place=(object,depth)=>{
  for(const tile of manifest.decor[object.name].tiles)scene.add.image(object.x+tile.column*TILE,object.y+tile.row*TILE,'village-gba',tile.index).setOrigin(0).setDepth(depth);
 };
 const plan=worldRenderPlan();
 plan.ground.forEach(o=>place(o,-1));plan.objects.forEach(o=>place(o,o.depth));
}
