// Static diagnostic from the same prepared atlas/layout as the Phaser preview.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {decodePNG,encodePNG,blank,crop,resize,blit} from './asset-pixels.mjs';
import {VIEW_WIDTH,VIEW_HEIGHT,TILE,objects,actors,groundTextureAt} from '../src/preview/layout.js';
const directory=fileURLToPath(new URL('../public/assets/gba-prepared/',import.meta.url));
const manifest=JSON.parse(fs.readFileSync(directory+'manifest.json'));
const atlas=decodePNG(fs.readFileSync(directory+'village-tiles.png'));
const image=blank(VIEW_WIDTH,VIEW_HEIGHT);
const place=(name,x,y)=>{for(const tile of manifest.decor[name].tiles)blit(image,crop(atlas,{x:tile.index%8*16,y:Math.floor(tile.index/8)*16,width:16,height:16}),x+tile.column*16,y+tile.row*16);};
for(let y=0;y<VIEW_HEIGHT/TILE;y++)for(let x=0;x<VIEW_WIDTH/TILE;x++)place(groundTextureAt(x,y),x*TILE,y*TILE);
objects.forEach(object=>place(object.name,object.x,object.y));
for(const name of ['hero','npc']){const sheet=decodePNG(fs.readFileSync(directory+name+'.png'));const {x,y}=actors[name];blit(image,crop(sheet,{x:32,y:0,width:32,height:32}),x-16,y-31);}
fs.writeFileSync(fileURLToPath(new URL('./asset-analysis/gba-preview.png',import.meta.url)),encodePNG(resize(image,3)));
console.log('Static diagnostic: tools/asset-analysis/gba-preview.png');
