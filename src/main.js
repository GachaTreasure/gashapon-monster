import {assetUrl} from './assetUrl.js';
import {IntroScene} from './intro/IntroScene.js';
import {introductionMode} from './intro/flow.js';
import {manageVillageInputs} from './intro/villageInputLifecycle.js';
import './intro/phaser.css';
import { mountMobileLayout } from './ui/mobileLayout.js';
import { drawWorld, VIEW_WIDTH, VIEW_HEIGHT } from './world/gbaWorld.js';
import { PLAYER_ORIGIN_Y, idleFrame, characterDepth } from './world/characterGraphics.js';
import Phaser from 'phaser';
import './style.css';
import { collisions, WIDTH, HEIGHT, TILE, spawn, npc, directions, cameraPosition } from './world/map.js';
import { Player } from './entities/Player.js';
import { Controls } from './input/Controls.js';
import { createInterface } from './ui/interface.js';
const ui=createInterface();
class Village extends Phaser.Scene {
 constructor(){super('Village');}
 preload(){
  this.load.json('gba-manifest',assetUrl('assets/gba-v03/manifest.json'));
  this.load.spritesheet('village-gba',assetUrl('assets/gba-v03/village-tiles.png'),{frameWidth:16,frameHeight:16});
  this.load.spritesheet('hero-gba',assetUrl('assets/gba-prepared/hero.png'),{frameWidth:32,frameHeight:32});
  this.load.spritesheet('npc-gba',assetUrl('assets/gba-prepared/npc.png'),{frameWidth:32,frameHeight:32});
  this.load.on('loaderror',file=>{document.querySelector('#coordinates').textContent='PNG introuvable : '+file.key;});
 }
 create(){
  drawWorld(this,this.cache.json.get('gba-manifest'));
  this.add.image(npc.x*TILE+8,npc.y*TILE+8,'npc-gba',idleFrame('down')).setOrigin(0.5,PLAYER_ORIGIN_Y).setDepth(characterDepth(npc.y*TILE+8));
  this.player=new Player(this,spawn,[npc]);
  this.debugLayer=this.add.graphics().setDepth(1000).setVisible(false);
  collisions.forEach((row,y)=>[...row].forEach((blocked,x)=>{if(blocked==='1'){this.debugLayer.fillStyle(0xe85262,0.4);this.debugLayer.fillRect(x*TILE,y*TILE,TILE,TILE);}}));
  this.debugLayer.lineStyle(1,0x193c3b,0.3);
  for(let x=0;x<=WIDTH;x++)this.debugLayer.lineBetween(x*TILE,0,x*TILE,HEIGHT*TILE);
  for(let y=0;y<=HEIGHT;y++)this.debugLayer.lineBetween(0,y*TILE,WIDTH*TILE,y*TILE);
  const debugButton=document.querySelector('#debug');
  const toggleDebug=()=>{const visible=!this.debugLayer.visible;this.debugLayer.setVisible(visible);debugButton.setAttribute('aria-pressed',String(visible));};
  const createControls=()=>new Controls(document.querySelector('.controls'),action=>{
   if(action==='b'){ui.close();return;}
   if(ui.open){ui.next();return;}
   if(this.player.moving)return;
   const [dx,dy]=directions[this.player.facing];
   if(this.player.x+dx===npc.x&&this.player.y+dy===npc.y)ui.show();
  },toggleDebug);
  manageVillageInputs(this,createControls,debugButton,toggleDebug);
  this.cameras.main.setBounds(0,0,WIDTH*TILE,HEIGHT*TILE);
  // Explicit integer scroll keeps the 240 × 160 view inside the map at every step.
 }
 update(){
  if(!this.controls)return;
  this.controls.poll();
  const dir=this.controls.direction();if(!ui.open&&dir)this.player.step(dir);
  this.player.sprite.setDepth(characterDepth(this.player.sprite.y));
  const position=cameraPosition(this.player.sprite.x,this.player.sprite.y);
  this.cameras.main.setScroll(Math.round(position.x),Math.round(position.y));
  document.querySelector('#coordinates').textContent=`${String(this.player.x).padStart(2,'0')} · ${String(this.player.y).padStart(2,'0')}`;
 }
}
let storage;try{storage=window.localStorage;}catch{}
const initialMode=introductionMode(storage,window.location.search);
const query=new URLSearchParams(window.location.search);query.delete('play');query.delete('intro');
history.replaceState(null,'',window.location.pathname+(query.size?'?'+query:'')+window.location.hash);
const intro=new IntroScene({storage,initialMode});
const sceneOrder=initialMode?[intro,Village]:[Village,intro];
const game=new Phaser.Game({type:Phaser.WEBGL,parent:'game',width:VIEW_WIDTH,height:VIEW_HEIGHT,backgroundColor:'#a9c878',pixelArt:true,roundPixels:true,antialias:false,scene:sceneOrder,scale:{mode:Phaser.Scale.NONE},audio:{noAudio:true}});
document.querySelector('#revisit-intro').addEventListener('click',()=>{
 if(!game.scene.isActive('Village')||game.scene.isActive('IntroScene'))return;
 game.scene.sleep('Village');game.scene.start('IntroScene',{mode:'replay'});
});
const disposeLayout=mountMobileLayout(game);
if(import.meta.hot)import.meta.hot.dispose(()=>{disposeLayout();game.destroy(true);});

export {game};
