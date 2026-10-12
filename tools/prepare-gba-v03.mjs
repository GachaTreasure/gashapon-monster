// Add a real source-PNG door and foundation; keep the validated preview intact.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {decodePNG,encodePNG,blank,crop,resize,blit} from './asset-pixels.mjs';
const base=fileURLToPath(new URL('../public/assets/',import.meta.url));
const old=base+'gba-prepared/',out=base+'gba-v03/';fs.mkdirSync(out,{recursive:true});
const load=file=>decodePNG(fs.readFileSync(file));
const manifest=JSON.parse(fs.readFileSync(old+'manifest.json'));
const village=load(base+'village-gba.png');
function clean(im){for(let i=3;i<im.pixels.length;i+=4){if(im.pixels[i]<=127)im.pixels.fill(0,i-3,i+1);else im.pixels[i]=255;}return im;}
const doorBounds={x:1003,y:971,width:87,height:134};
const door=resize(clean(crop(village,doorBounds)),22/134);
const stone=resize(clean(crop(village,{x:782,y:924,width:80,height:25})),0.2);
const house=blank(64,64);
// Raised stone foundation and planted sides signal the existing 4 × 3 blocked plot.
for(let x=0;x<64;x+=16)blit(house,stone,x,59);
const bush=load(old+'bush.png');
for(const x of [0,48])for(const y of [32,48])blit(house,bush,x,y);
blit(house,load(old+'house.png'),8,0);
blit(house,door,Math.floor((64-door.width)/2),64-door.height);
fs.writeFileSync(out+'house.png',encodePNG(house));
const atlas=blank(128,112);blit(atlas,load(old+'village-tiles.png'),0,0);
const tiles=[];let next=manifest.tileset.count;
for(let y=0;y<64;y+=16)for(let x=0;x<64;x+=16){const index=next++;blit(atlas,crop(house,{x,y,width:16,height:16}),index%8*16,Math.floor(index/8)*16);tiles.push({index,column:x/16,row:y/16});}
manifest.decor['house-playable']={file:'house.png',width:64,height:64,tiles,door:{source:'village-gba.png',sourceBounds:doorBounds,scale:22/134}};
manifest.tileset={...manifest.tileset,count:next};
for(const actor of Object.values(manifest.characters))actor.file='../gba-prepared/'+actor.file;
for(const [name,decor] of Object.entries(manifest.decor))if(name!=='house-playable')decor.file='../gba-prepared/'+decor.file;
manifest.version='0.3';
fs.writeFileSync(out+'village-tiles.png',encodePNG(atlas));
fs.writeFileSync(out+'manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('V0.3 atlas: '+next+' tiles; visible door extracted without stretching.');
