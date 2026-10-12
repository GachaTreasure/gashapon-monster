import {assetUrl} from '../assetUrl.js';
import Phaser from 'phaser';
import './style.css';
import {VIEW_WIDTH,VIEW_HEIGHT,TILE,objects,actors,groundTextureAt} from './layout.js';
const base=assetUrl('assets/gba-prepared/');
const status=document.querySelector('#state');
const animateButton=document.querySelector('#animate');
const directions=['down','left','right','up'];
class AssetPreview extends Phaser.Scene{
 constructor(){super('AssetPreview');this.direction='down';this.walking=true;}
 preload(){
  this.load.json('manifest',base+'manifest.json');
  for(const name of ['hero','npc'])this.load.spritesheet(name,base+name+'.png',{frameWidth:32,frameHeight:32});
  this.load.spritesheet('village',base+'village-tiles.png',{frameWidth:16,frameHeight:16});
  this.load.on('loaderror',file=>{status.textContent='Chargement impossible : '+file.key+'. Relance node tools/prepare-gba-assets.mjs.';});
 }
 create(){
  const manifest=this.cache.json.get('manifest');
  if(!manifest||!this.textures.exists('hero')||!this.textures.exists('npc')||!this.textures.exists('village'))return;
  const place=(name,x,y)=>{
   for(const tile of manifest.decor[name].tiles)this.add.image(x+tile.column*TILE,y+tile.row*TILE,'village',tile.index).setOrigin(0);
  };
  for(let y=0;y<VIEW_HEIGHT/TILE;y++)for(let x=0;x<VIEW_WIDTH/TILE;x++)place(groundTextureAt(x,y),x*TILE,y*TILE);
  for(const object of objects)place(object.name,object.x,object.y);
  this.characters=[];
  for(const name of ['hero','npc']){
   const actor=manifest.characters[name];
   directions.forEach((dir,row)=>this.anims.create({key:`${name}-${dir}`,frames:actor.walkSequence.map(i=>({key:name,frame:row*3+i})),frameRate:7,repeat:-1}));
   const {x,y}=actors[name];
   this.add.ellipse(x,y,18,5,0x284b42,0.18);
   const sprite=this.add.sprite(x,y,name,1).setOrigin(actor.origin.x,actor.origin.y);
   this.characters.push({name,sprite});
  }
  const orient=e=>{this.direction=e.currentTarget.dataset.direction;this.refresh();};
  const toggle=()=>{this.walking=!this.walking;this.refresh();};
  const buttons=[...document.querySelectorAll('[data-direction]')];
  buttons.forEach(b=>b.addEventListener('click',orient));animateButton.addEventListener('click',toggle);animateButton.disabled=false;
  this.events.once('shutdown',()=>{buttons.forEach(b=>b.removeEventListener('click',orient));animateButton.removeEventListener('click',toggle);});
  this.refresh();
 }
 refresh(){
  const row=directions.indexOf(this.direction);
  for(const {name,sprite} of this.characters){if(this.walking)sprite.play(`${name}-${this.direction}`,true);else{sprite.stop();sprite.setFrame(row*3+1);}}
  document.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.direction===this.direction)));
  animateButton.setAttribute('aria-pressed',String(this.walking));animateButton.textContent='Animation de marche : '+(this.walking?'active':'en pause');
  status.textContent=`PNG importés chargés · ${['face','gauche','droite','dos'][row]} · ${this.walking?'marche sur place':'pose de repos'}`;
 }
}
const game=new Phaser.Game({type:Phaser.WEBGL,parent:'preview-game',width:VIEW_WIDTH,height:VIEW_HEIGHT,pixelArt:true,roundPixels:true,antialias:false,backgroundColor:'#75a357',audio:{noAudio:true},scene:AssetPreview,scale:{mode:Phaser.Scale.NONE}});
function resize(){if(!game.canvas)return;const zoom=Math.max(1,Math.min(3,Math.floor((window.innerWidth-52)/VIEW_WIDTH)));game.canvas.style.width=`${VIEW_WIDTH*zoom}px`;game.canvas.style.height=`${VIEW_HEIGHT*zoom}px`;}
game.events.once('ready',resize);window.addEventListener('resize',resize);resize();
if(import.meta.hot)import.meta.hot.dispose(()=>{window.removeEventListener('resize',resize);game.destroy(true);});
