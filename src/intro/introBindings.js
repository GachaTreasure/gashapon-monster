// DOM is limited to existing control labels. Promo artwork and shop plaques are Phaser objects.
// No dialogue, illustration, overlay, or additional touch button is created here.
export function bindIntroInterface(){
 const $=selector=>document.querySelector(selector),root=$('.console');
 const hidden=['#debug','#revisit-intro','#dialogue','.help'].map(selector=>{const node=$(selector);const old=node.hidden;node.hidden=true;return ()=>{node.hidden=old;};});
 const coordinates=$('#coordinates'),originalCoordinates=coordinates.textContent;
 const buttons=['a','b'].map(key=>{const button=$(`[data-control="${key}"]`);return {button,label:button.getAttribute('aria-label'),caption:button.nextElementSibling,captionText:button.nextElementSibling.textContent};});
 root.dataset.intro='true';
 return {
  page(promo,count){
   // No external link row: the promo uses the same full canvas as the other scenes.
   root.dataset.introPromo='false';coordinates.textContent=count;
   buttons[0].button.setAttribute('aria-label',promo?'A : Commencer l’aventure':'A : Continuer');buttons[0].caption.textContent=promo?'COMMENCER':'CONTINUER';
   buttons[1].button.setAttribute('aria-label','B : Passer l’introduction');buttons[1].caption.textContent='PASSER';
   window.dispatchEvent(new Event('resize'));
  },
  restore(){
   hidden.forEach(restore=>restore());coordinates.textContent=originalCoordinates;
   for(const item of buttons){item.button.setAttribute('aria-label',item.label);item.caption.textContent=item.captionText;}
   delete root.dataset.intro;delete root.dataset.introPromo;window.dispatchEvent(new Event('resize'));
  },
 };
}
