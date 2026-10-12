import {assetUrl} from '../assetUrl.js';
import {scenes,advance} from './story.js';
import {introMarkup} from './markup.js';
export function mountIntroduction(root,{onFinish,fullscreenTarget=root}={}){
 root.innerHTML=introMarkup;
 const $=id=>root.querySelector('#'+id),removers=[];
 const listen=(target,name,fn,options)=>{target.addEventListener(name,fn,options);removers.push(()=>target.removeEventListener(name,fn,options));};
 let position={scene:0,page:0},complete=false,disposed=false,fullText='',letters=0,timer,transitionTimer,transition=false,loadToken=0;
 const status=message=>{$('status').textContent=message;};
 function reveal(){clearInterval(timer);letters=fullText.length;$('text').textContent=fullText;}
 function typePage(){
  clearInterval(timer);const scene=scenes[position.scene];const [speaker,text]=scene.pages[position.page];fullText=text;letters=0;
  $('speaker').textContent=speaker||scene.title;$('counter').textContent=`${position.scene+1} / ${scenes.length} · ${position.page+1} / ${scene.pages.length}`;
  $('promo-links').hidden=scene.id!=='promo';$('next').textContent=scene.id==='promo'?'A · Commencer l’aventure':'A · Continuer';$('text').textContent='';
  timer=setInterval(()=>{letters++;$('text').textContent=fullText.slice(0,letters);if(letters>=fullText.length)clearInterval(timer);},24);
 }
 function loadArt(){
  const scene=scenes[position.scene],token=++loadToken;
  $('picture').classList.remove('visible');$('art').hidden=true;$('missing').hidden=true;$('glow').hidden=true;
  const image=new Image();
  const finish=available=>{
   if(disposed||token!==loadToken)return;
   if(available){$('art').src=image.src;$('art').alt=scene.description;$('art').hidden=false;$('glow').hidden=scene.id!=='compagnon';}
   else{$('brief').textContent=scene.description;$('filename').textContent=`public/assets/intro/${scene.art}`;$('missing').hidden=false;}
   $('picture').classList.add('visible');
  };
  image.onload=()=>{if(image.naturalWidth===240&&image.naturalHeight===160)finish(true);else{finish(false);status('Dimensions incompatibles : fournir un PNG de 240 × 160.');}};
  image.onerror=()=>finish(false);image.src=assetUrl('assets/intro/'+scene.art);
 }
 async function finish(skipped){
  if(complete||disposed)return;
  clearInterval(timer);clearTimeout(transitionTimer);transition=false;loadToken++;complete=true;$('next').disabled=true;$('skip').disabled=true;
  try{await onFinish(skipped);}catch{if(disposed)return;complete=false;$('next').disabled=false;$('skip').disabled=false;status('Transition indisponible. Appuyez sur A ou B pour réessayer.');}
 }
 function next(){
  if(complete||disposed||transition)return;
  if(scenes[position.scene].id==='promo'){finish(false);return;}
  if(letters<fullText.length){reveal();return;}
  const target=advance(position);if(!target){finish(false);return;}
  if(target.scene===position.scene){position=target;typePage();return;}
  transition=true;$('picture').classList.remove('visible');transitionTimer=setTimeout(()=>{position=target;loadArt();typePage();transition=false;},220);
 }
 function replay(){
  if(complete||disposed)return;
  clearTimeout(transitionTimer);clearInterval(timer);transition=false;position={scene:0,page:0};$('next').disabled=false;$('skip').disabled=false;
  status('Introduction V0.4 · A pour continuer · B pour commencer directement.');loadArt();typePage();
 }
 listen($('next'),'click',next);listen($('skip'),'click',()=>finish(true));listen($('replay'),'click',replay);
 // Capture keys before existing game controls, even while the village is paused.
 listen(window,'keydown',e=>{e.stopImmediatePropagation();if(e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;if(['Enter','z','Z',' ','Escape','x','X'].includes(e.key)){e.preventDefault();if(['Escape','x','X'].includes(e.key))finish(true);else next();}},true);
 listen(window,'keyup',e=>e.stopImmediatePropagation(),true);
 listen($('intro-fullscreen'),'click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await fullscreenTarget.requestFullscreen();}catch{status('Plein écran indisponible. Le paysage reste accessible en tournant le téléphone.');}});
 const fullscreenChanged=()=>{$('intro-fullscreen').textContent=document.fullscreenElement?'Quitter le plein écran':'Plein écran';};
 listen(document,'fullscreenchange',fullscreenChanged);fullscreenChanged();replay();
 return ()=>{disposed=true;loadToken++;clearInterval(timer);clearTimeout(transitionTimer);removers.forEach(remove=>remove());};
}
