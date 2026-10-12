import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {decodePNG,encodePNG,blank,crop,resize,blit,components} from './asset-pixels.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'public/assets/gba-prepared');fs.mkdirSync(output,{recursive:true});
const hash=data=>createHash('sha256').update(data).digest('hex');
const manifest={version:1,viewport:{width:240,height:160},tileSize:16,alphaThreshold:127,sources:{},characters:{},decor:{},limitations:[]};
function load(name){const data=fs.readFileSync(path.join(root,'public/assets',name));const im=decodePNG(data);let zero=0,partial=0,solid=0;for(let i=3;i<im.pixels.length;i+=4){const a=im.pixels[i];if(a===0)zero++;else if(a===255)solid++;else partial++;}manifest.sources[name]={sha256:hash(data),width:im.width,height:im.height,alpha:{transparent:zero,partial,opaque:solid}};return im;}
function clean(im){for(let i=3;i<im.pixels.length;i+=4){if(im.pixels[i]<=127){im.pixels.fill(0,i-3,i+1);}else im.pixels[i]=255;}return im;}
for(const name of ['hero','npc']){
 const source=load(name+'-gba.png');
 const regions=components(source).filter(c=>c.area>15000);
 if(regions.length!==12)throw Error(name+': expected exactly 12 isolated major sprites; inspect source manually');
 regions.sort((a,b)=>a.y-b.y);
 const ordered=[];
 for(let row=0;row<4;row++)ordered.push(...regions.slice(row*3,row*3+3).sort((a,b)=>a.x-b.x));
 const scale=30/Math.max(...ordered.map(r=>r.height)),atlas=blank(96,128),frames=[];
 for(let index=0;index<12;index++){
  const region=ordered[index],part=resize(clean(crop(source,region)),scale);
  const localX=Math.floor((32-part.width)/2),localY=31-part.height;
  const col=index%3,row=Math.floor(index/3);
  blit(atlas,part,col*32+localX,row*32+localY);
  frames.push({index,direction:['down','left','right','up'][row],pose:['step-left','idle','step-right'][col],sourceBounds:region,content:{x:localX,y:localY,width:part.width,height:part.height}});
 }
 fs.writeFileSync(path.join(output,name+'.png'),encodePNG(atlas));
 manifest.characters[name]={file:name+'.png',frameWidth:32,frameHeight:32,columns:3,rows:4,origin:{x:0.5,y:31/32},uniformScale:scale,idleColumn:1,walkSequence:[1,0,1,2],frames};
}
const village=load('village-gba.png');
// Manually inspected source rectangles. They deliberately do NOT divide the sheet equally.
const specs={
 grass:{rect:{x:58,y:79,width:64,height:64},scale:0.25,frame:[16,16],role:'ground'},
 flowers:{rect:{x:272,y:75,width:64,height:64},scale:0.25,frame:[16,16],role:'ground'},
 path:{rect:{x:738,y:88,width:32,height:32},scale:0.5,frame:[16,16],role:'ground'},
 tree:{rect:{x:31,y:467,width:165,height:208},scale:40/208,frame:[32,48],role:'object'},
 bush:{rect:{x:568,y:292,width:94,height:88},scale:16/94,frame:[16,16],role:'object'},
 fence:{rect:{x:563,y:386,width:114,height:74},scale:16/114,frame:[16,16],role:'object'},
 house:{rect:{x:94,y:795,width:254,height:325},scale:48/254,frame:[48,64],role:'object',polygon:[[121,0],[254,149],[254,174],[243,163],[243,325],[14,325],[14,163],[0,176],[0,149]]},
};
const objects={};
function inside(x,y,polygon){let value=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])value=!value;}return value;}
for(const [name,spec] of Object.entries(specs)){
 let part=clean(crop(village,spec.rect));
 if(spec.polygon)for(let y=0;y<part.height;y++)for(let x=0;x<part.width;x++)if(!inside(x+0.5,y+0.5,spec.polygon))part.pixels.fill(0,(y*part.width+x)*4,(y*part.width+x+1)*4);
 part=resize(part,spec.scale);const image=blank(...spec.frame);
 blit(image,part,Math.floor((image.width-part.width)/2),spec.role==='ground'?0:image.height-part.height);
 if(spec.role==='ground'){
  // Repeatable opposite edges, copied from the sampled image (no painted replacement).
  for(let y=0;y<16;y++)image.pixels.copy(image.pixels,(y*16+15)*4,(y*16)*4,(y*16+1)*4);
  image.pixels.copy(image.pixels,15*16*4,0,16*4);
 }
 objects[name]=image;
 fs.writeFileSync(path.join(output,name+'.png'),encodePNG(image));
 manifest.decor[name]={file:name+'.png',sourceBounds:spec.rect,uniformScale:spec.scale,width:image.width,height:image.height,role:spec.role,maskPolygon:spec.polygon??null,tiles:[]};
}
// Assemble matching path edges from the real grass/dirt samples. Masks are
// explicit additions because the generated sheet has no consistent autotiles.
for(let mask=0;mask<15;mask++){
 const name='path-'+mask,image=blank(16,16);blit(image,objects.grass,0,0);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  if(!(mask&1)&&y<1||!(mask&2)&&x>14||!(mask&4)&&y>14||!(mask&8)&&x<1)continue;
  if(!(mask&1)&&!(mask&8)&&x+y<4)continue;
  if(!(mask&1)&&!(mask&2)&&15-x+y<4)continue;
  if(!(mask&4)&&!(mask&8)&&x+15-y<4)continue;
  if(!(mask&4)&&!(mask&2)&&30-x-y<4)continue;
  objects.path.pixels.copy(image.pixels,(y*16+x)*4,(y*16+x)*4,(y*16+x+1)*4);
 }
 objects[name]=image;fs.writeFileSync(path.join(output,name+'.png'),encodePNG(image));
 manifest.decor[name]={file:name+'.png',sourceBounds:specs.path.rect,uniformScale:0.5,width:16,height:16,role:'ground',pathMask:mask,tiles:[]};
}
// A genuine 16 px atlas. Larger objects occupy multiple cells and keep transparent edges.
const atlas=blank(128,80);let next=0;
for(const [name,image] of Object.entries(objects)){
 const entry=manifest.decor[name];
 for(let y=0;y<image.height;y+=16)for(let x=0;x<image.width;x+=16){
  const index=next++,tx=index%8,ty=Math.floor(index/8);
  blit(atlas,crop(image,{x,y,width:16,height:16}),tx*16,ty*16);
  entry.tiles.push({index,column:x/16,row:y/16});
 }
}
fs.writeFileSync(path.join(output,'village-tiles.png'),encodePNG(atlas));
manifest.tileset={file:'village-tiles.png',tileWidth:16,tileHeight:16,columns:8,count:next};
manifest.limitations=[
 'Generated sheets are not native pixel grids: nearest-neighbour reduction can lose small details. Source images remain untouched.',
 'Partial alpha is hardened at 127 to remove faint background noise; this is an explicit cleanup, not original transparency.',
 'The house source overlaps adjacent roof pieces. A documented polygon extracts its central gable. This is a window-front test building, not an enterable house.',
 'Ground patches are manually selected interiors; opposite outer edge pixels are copied to make them repeatable. New path-edge masks combine these grass/dirt samples. The generated path autotile set is NOT used: it has uneven dimensions and no proven matching edges.',
 'Decor elements have no reliable common original scale. Each isolated element is uniformly resized, without aspect-ratio distortion. This staging tileset does not redefine gameplay collisions.',
 'NPC and hero front/back/left/right poses are present, but source-generated walking shapes differ; the test scene is intended for visual review before gameplay integration.',
];
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared 24 poses and '+next+' tiles in '+output);
