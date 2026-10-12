import { PLAYER_ORIGIN_Y, idleFrame, walkFrames, characterDepth } from '../world/characterGraphics.js';
import { TILE, destination } from '../world/map.js';
export class Player {
 constructor(scene, spawn, actors) {
  this.scene=scene; this.x=spawn.x; this.y=spawn.y; this.actors=actors; this.facing='down'; this.moving=false;
  this.sprite=scene.add.sprite(this.x*TILE+8,this.y*TILE+8,'hero-gba',idleFrame('down')).setOrigin(0.5,PLAYER_ORIGIN_Y).setDepth(characterDepth(this.y*TILE+8));
  for(const dir of ['up','down','left','right']) scene.anims.create({key:`walk-${dir}`,frames:walkFrames(dir).map(frame=>({key:'hero-gba',frame})),frameRate:12,repeat:-1});
 }
 step(direction) {
  if(this.moving) return;
  this.facing=direction;
  this.sprite.setFrame(idleFrame(direction));
  const next=destination(this.x,this.y,direction,this.actors);
  if(!next) return;
  this.moving=true; this.sprite.play(`walk-${direction}`);
  this.scene.tweens.add({targets:this.sprite,x:next.x*TILE+8,y:next.y*TILE+8,duration:180,ease:'Linear',onComplete:()=>{
   this.x=next.x;this.y=next.y;this.moving=false;this.sprite.stop();this.sprite.setFrame(idleFrame(this.facing));
  }});
 }
}
