// Static inspection with the gameplay render plan and foot-based depth ordering.
import fs from 'node:fs';import {fileURLToPath} from 'node:url';
import {decodePNG,encodePNG,blank,crop,resize,blit} from './asset-pixels.mjs';
import {worldRenderPlan,VIEW_WIDTH,VIEW_HEIGHT} from '../src/world/gbaWorld.js';
import {spawn,npc,cameraPosition} from '../src/world/map.js';
import {characterDepth} from '../src/world/characterGraphics.js';
const base=fileURLToPath(new URL('../public/assets/',import.meta.url));
const manifest=JSON.parse(fs.readFileSync(base+'gba-v03/manifest.json'));
const atlas=decodePNG(fs.readFileSync(base+'gba-v03/village-tiles.png'));
const world=blank(320,240),plan=worldRenderPlan();
const place=object=>{for(const tile of manifest.decor[object.name].tiles)blit(world,crop(atlas,{x:tile.index%8*16,y:Math.floor(tile.index/8)*16,width:16,height:16}),object.x+tile.column*16,object.y+tile.row*16);};
plan.ground.forEach(place);
const elements=[...plan.objects];for(const [name,actor] of Object.entries({hero:spawn,npc})){elements.push({name,actor,x:actor.x*16+8,y:actor.y*16+8,depth:characterDepth(actor.y*16+8)});}
for(const o of elements.sort((a,b)=>a.depth-b.depth)){
 if(o.actor){const sheet=decodePNG(fs.readFileSync(base+'gba-prepared/'+o.name+'.png'));blit(world,crop(sheet,{x:32,y:0,width:32,height:32}),o.x-16,o.y-23);}
 else place(o);
}
const directory=fileURLToPath(new URL('./asset-analysis/',import.meta.url));
fs.writeFileSync(directory+'v03-world.png',encodePNG(resize(world,3)));
const scroll=cameraPosition(spawn.x*16+8,spawn.y*16+8);
fs.writeFileSync(directory+'v03-start.png',encodePNG(resize(crop(world,{x:scroll.x,y:scroll.y,width:VIEW_WIDTH,height:VIEW_HEIGHT}),3)));
console.log('Static V0.3 diagnostics rendered.');
