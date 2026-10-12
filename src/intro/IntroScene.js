import {assetUrl} from '../assetUrl.js';
import {createPromoEndcard} from './promoEndcard.js';
import {installPixelFont,PIXEL_FONT} from './pixelFont.js';
import {wrapMeasuredText,paginateDialogue} from './dialoguePages.js';
import Phaser from 'phaser';
import {scenes,advance,saveIntroduction} from './story.js';
import {Controls} from '../input/Controls.js';
import {bindIntroInterface} from './introBindings.js';
import {INTRO_COMPOSITION} from './composition.js';
export class IntroScene extends Phaser.Scene {
 constructor(context){super('IntroScene');this.context=context;}
 init(data={}){this.mode=data.mode??this.context.initialMode??'replay';this.position={scene:0,page:0};this.finishing=false;this.changing=false;this.token=0;}
 preload(){
  for(const scene of scenes)if(!this.textures.exists('intro-'+scene.id))this.load.image('intro-'+scene.id,assetUrl('assets/intro/'+scene.art));
 }
 create(){
  this.cameras.main.setBackgroundColor('#101c2c');
  const layout=INTRO_COMPOSITION;
  installPixelFont(this);
  for(const scene of scenes)this.textures.get('intro-'+scene.id).setFilter(Phaser.Textures.FilterMode.NEAREST);
  if(this.game.renderer.context?.canvas)this.game.renderer.context.imageSmoothingEnabled=false;
  this.image=this.add.image(layout.image.x,layout.image.y,'intro-nova-gacha').setDisplaySize(layout.image.width,layout.image.height);
  this.image.setInteractive().on('pointerdown',()=>this.toggleDialogue());
  this.viewHeld=false;
  this.promoEndcard=null;
  const box=layout.dialogue;
  this.dialogueFrame=this.add.graphics();this.dialogueFrame.fillStyle(0x12263b,box.alpha);this.dialogueFrame.fillRoundedRect(box.x,box.y,box.width,box.height,3);this.dialogueFrame.lineStyle(1,0xf4d58a,1);this.dialogueFrame.strokeRoundedRect(box.x,box.y,box.width,box.height,3);
  this.speaker=this.add.bitmapText(layout.speaker.x,layout.speaker.y,PIXEL_FONT,'',6).setTint(0xffdf86);
  this.message=this.add.bitmapText(layout.message.x,layout.message.y,PIXEL_FONT,'',6).setTint(0xfff3ce);
  this.pageCounter=this.add.bitmapText(layout.page.x,layout.page.y,PIXEL_FONT,'',6).setOrigin(1,0).setTint(0xffdf86);
  this.interfaceBindings=bindIntroInterface();
  this.controls=new Controls(document.querySelector('.controls'),action=>this.action(action),()=>{});
  this.events.once('shutdown',()=>{
   this.token++;this.typeTimer?.remove();this.controls.destroy();this.interfaceBindings.restore();
  });
  this.renderPage();this.cameras.main.fadeIn(240,0,0,0);
 }
 action(action){if(action==='b')this.finish();else if(action==='a')this.next();}
 renderPage(){
  this.typeTimer?.remove();const scene=scenes[this.position.scene];const [speaker,text]=scene.pages[this.position.page];
  this.image.setTexture('intro-'+scene.id);
  this.dialogueSteps=paginateDialogue(text,value=>wrapMeasuredText(value,line=>line.length*6,INTRO_COMPOSITION.message.width));this.dialogueStep=0;
  this.currentSpeaker=speaker||scene.title;
  const promo=scene.id==='promo';
  if(promo&&!this.promoEndcard)this.promoEndcard=createPromoEndcard(this);
  this.promoEndcard?.setVisible(promo);
  const area=INTRO_COMPOSITION.image;
  this.dialogueHidden=false;
  this.image.setPosition(area.x,area.y).setDisplaySize(area.width,area.height);
  for(const object of [this.dialogueFrame,this.speaker,this.message,this.pageCounter])object.setVisible(!promo);
  this.interfaceBindings.page(promo,`${this.position.scene+1} / ${scenes.length}`);
  this.renderStep(promo);
 }
 renderStep(promo=false){
  this.typeTimer?.remove();this.fullText=this.dialogueSteps[this.dialogueStep];this.letters=0;
  this.speaker.setText(this.currentSpeaker);this.pageCounter.setText(`${this.dialogueStep+1}/${this.dialogueSteps.length}`);this.message.setText('');
  if(!promo&&this.fullText.length)this.typeTimer=this.time.addEvent({delay:24,repeat:this.fullText.length-1,callback:()=>{this.message.setText(this.fullText.slice(0,++this.letters));}});
 }
 toggleDialogue(){
  if(this.finishing||this.changing||scenes[this.position.scene].id==='promo')return;
  this.dialogueHidden=!this.dialogueHidden;
  for(const object of [this.dialogueFrame,this.speaker,this.message,this.pageCounter])object.setVisible(!this.dialogueHidden);
  if(this.typeTimer)this.typeTimer.paused=this.dialogueHidden;
 }
 next(){
  if(this.finishing||this.changing)return;
  if(this.dialogueHidden){this.toggleDialogue();return;}
  if(scenes[this.position.scene].id==='promo'){this.finish();return;}
  if(this.letters<this.fullText.length){this.typeTimer?.remove();this.letters=this.fullText.length;this.message.setText(this.fullText);return;}
  if(this.dialogueStep+1<this.dialogueSteps.length){this.dialogueStep++;this.renderStep();return;}
  const target=advance(this.position);if(!target){this.finish();return;}
  if(target.scene===this.position.scene){this.position=target;this.renderPage();return;}
  this.changing=true;const token=++this.token;
  this.cameras.main.once('camerafadeoutcomplete',()=>{
   if(token!==this.token||this.finishing)return;
   this.position=target;this.renderPage();this.cameras.main.fadeIn(180,0,0,0);this.changing=false;
  });
  this.cameras.main.fadeOut(180,0,0,0);
 }
 finish(){
  if(this.finishing)return;
  this.finishing=true;this.token++;this.typeTimer?.remove();this.controls.clear();
  this.cameras.main.resetFX();
  this.cameras.main.once('camerafadeoutcomplete',()=>{
   if(this.mode==='first')saveIntroduction(this.context.storage);
   const village=this.scene.get('Village');
   const reveal=()=>{village.cameras.main.fadeIn(260,0,0,0);};
   if(this.mode==='replay'){
    // A sleeping Scene retains its player, tweens, camera and dialogue state.
    village.events.once('wake',reveal);this.scene.stop();this.scene.wake('Village');
   }else{
    village.events.once('create',reveal);this.scene.start('Village');
   }
  });
  this.cameras.main.fadeOut(260,0,0,0);
 }
 update(){
  if(this.finishing)return;
  this.controls?.poll();
  if(this.finishing)return;
  const viewing=this.controls?.direction()==='up';
  if(viewing&&!this.viewHeld)this.toggleDialogue();
  this.viewHeld=viewing;
 }
}
