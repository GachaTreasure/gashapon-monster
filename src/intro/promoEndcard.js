import {PIXEL_FONT} from './pixelFont.js';
export const PROMO_SHARPEN=0.36;
// Phaser 4 ShaderQuad API. Five nearest-neighbour samples, only on scene 6.
// No resampling or mutation of the original PNG; no full-scene post-processing.
export const PROMO_FRAGMENT=`
#pragma phaserTemplate(shaderName)
#pragma phaserTemplate(extensions)
#pragma phaserTemplate(features)
precision mediump float;
varying vec2 outTexCoord;
uniform sampler2D iChannel0;
void main(){
 vec2 stepSize=vec2(1.0/240.0,1.0/160.0);
 vec2 uv=clamp(outTexCoord,stepSize*0.5,vec2(1.0)-stepSize*0.5);
 vec4 center=texture2D(iChannel0,uv);
 vec3 neighbours=texture2D(iChannel0,clamp(uv+vec2(stepSize.x,0.0),stepSize*0.5,vec2(1.0)-stepSize*0.5)).rgb
 +texture2D(iChannel0,clamp(uv-vec2(stepSize.x,0.0),stepSize*0.5,vec2(1.0)-stepSize*0.5)).rgb
 +texture2D(iChannel0,clamp(uv+vec2(0.0,stepSize.y),stepSize*0.5,vec2(1.0)-stepSize*0.5)).rgb
 +texture2D(iChannel0,clamp(uv-vec2(0.0,stepSize.y),stepSize*0.5,vec2(1.0)-stepSize*0.5)).rgb;
 vec3 detail=center.rgb-neighbours*0.25;
 // Limit correction to prevent pronounced halos on contrasting pixel edges.
 gl_FragColor=vec4(clamp(center.rgb+clamp(detail*${PROMO_SHARPEN.toFixed(2)},vec3(-0.06),vec3(0.06)),0.0,1.0),center.a);
}`;
export const PROMO_SHOPS=Object.freeze([
 {name:'Gacha Treasure',host:'gacha-treasure.fr',x:4},
 {name:'Osaka Treasure',host:'osaka-treasure.com',x:124},
]);
export function createPromoEndcard(scene,openShop=url=>window.open(url,'_blank','noopener,noreferrer')){
 const objects=[];
 // The original Image remains underneath as an unmodified fallback.
 if(scene.add.shader){
  const artwork=scene.add.shader({name:'IntroPromoCrisp',fragmentSource:PROMO_FRAGMENT,initialUniforms:{iChannel0:0}},120,80,240,160,['intro-promo']);
  objects.push(artwork);
 }
 const text=(x,y,value,tint)=>scene.add.bitmapText(x,y,PIXEL_FONT,value,6).setTint(tint);
 objects.push(scene.add.rectangle(120,124,240,12,0x12263b,0.95));
 objects.push(text(60,118,'Boutiques officielles',0xffdf86));
 for(const shop of PROMO_SHOPS){
  objects.push(scene.add.rectangle(shop.x+57,146,112,27,0x081422));
  const plate=scene.add.rectangle(shop.x+56,144,112,28,0x12263b).setStrokeStyle(1,0xf4d58a).setInteractive({useHandCursor:true});
  plate.on('pointerup',()=>{if(!scene.finishing&&!scene.changing)openShop('https://'+shop.host);});
  // Keep native bitmap pixels: hierarchy comes from colour, not fractional font scaling.
  const centerX=value=>shop.x+Math.floor((112-value.length*6)/2);
  objects.push(plate,text(centerX(shop.name),131,shop.name,0xffdf86),text(centerX(shop.host),143,shop.host,0xadc2d5));
 }
 for(const object of objects)object.setVisible(false);
 return {objects,setVisible(visible){for(const object of objects)object.setVisible(visible);}};
}
