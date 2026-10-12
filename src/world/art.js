import { drawTree, drawHouse, drawNPC } from './sceneryArt.js';
import { drawHero, HERO_WIDTH, HERO_HEIGHT } from './heroArt.js';
// Original 16 px artwork, drawn into small textures; no external artwork.
export function createArt(scene) {
 const texture = (key, draw, width=16, height=16) => {
  const t = scene.textures.createCanvas(key,width,height), c = t.context;
  c.imageSmoothingEnabled = false;
  const r = (color,x,y,w,h) => { c.fillStyle=color; c.fillRect(x,y,w,h); };
  draw(r); t.refresh();
 };
 const grass = r => { r('#a9c878',0,0,16,16); r('#91b86a',2,3,2,1); r('#bdd58b',10,11,3,1); };
 texture('g',grass);
 texture('f',r=>{grass(r); [[3,5],[10,10]].forEach(([x,y])=>{r('#578d65',x,y+2,1,3);r('#f6e6aa',x-1,y,3,3);r('#df946c',x,y+1,1,1);});});
 texture('p',r=>{r('#dfcf95',0,0,16,16);r('#cab97e',2,5,2,1);r('#eee0ad',10,11,3,1);});
 texture('T',r=>{grass(r);drawTree(r);});
 texture('F',r=>{grass(r);r('#776c51',0,6,16,3);r('#e4d3a0',0,5,16,2);[2,11].forEach(x=>{r('#776c51',x,3,3,10);r('#f0dfb0',x,2,2,10);});});
 for(let y=3;y<=5;y++)for(let x=6;x<=9;x++)texture(`house-${x}-${y}`,r=>drawHouse((color,px,py,w,h)=>r(color,px-(x-6)*16,py-(y-3)*16,w,h)));
 for (const direction of ['down','up','left','right']) for(let frame=0;frame<3;frame++) {
  texture(`hero-${direction}-${frame}`,r=>drawHero(r,direction,frame),HERO_WIDTH,HERO_HEIGHT);
 }
 texture('npc',drawNPC,16,24);
}
