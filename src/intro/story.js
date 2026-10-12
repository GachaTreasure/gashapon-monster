export const scenes = [
 {id:'nova-gacha',title:'Nova Gacha',art:'01-nova-gacha.png',description:'Vue de Nova Gacha : boutiques et machines Gashapon.',pages:[
  ['','Sur Gacha Island se trouve Nova Gacha, une ville célèbre pour ses mystérieuses machines Gashapon...'],
  ['','Depuis des générations, collectionneurs et créatures y vivent côte à côte.']]},
 {id:'boutique',title:'La boutique familiale',art:'02-boutique.png',description:'Intérieur chaleureux de la boutique familiale, avec le grand-père et des machines.',pages:[
  ['','Notre famille possède une boutique Gashapon depuis bien longtemps.'],
  ['Grand-père','Un jour, ce sera à toi de poursuivre notre histoire...']]},
 {id:'attaques',title:'Les attaques',art:'03-attaques.png',description:'De nuit, exactement deux agents masqués sabotent une machine ; symbole de capsule brisée. Aucun autre personnage.',pages:[
  ['',"Mais depuis quelques nuits, d'étranges individus attaquent les machines de Nova Gacha..."],
  ['','Ils laissent derrière eux un symbole : une capsule brisée.']]},
 {id:'compagnon',title:'Le premier compagnon',art:'04-compagnon.png',description:'Le grand-père remet une capsule au héros aux cheveux bleus. Réserver la capsule au centre (120, 78).',pages:[
  ['Grand-père','Je crois que le moment est venu...'],
  ['Grand-père','Cette capsule appartient à notre famille depuis des générations.'],
  ['Grand-père','Prends-la. Son occupant sera ton premier compagnon !']]},
 {id:'depart',title:'Le départ',art:'05-depart.png',description:'Le héros devant la boutique familiale, dans Nova Gacha.',pages:[
  ['','Un nouveau Gashapon Monster rejoint ton équipe !'],
  ['','À Nova Gacha, Mila aurait aperçu des individus suspects...'],
  ['','Ton aventure commence !']]},
 {id:'promo',title:'Gashapon Monster',art:'06-promo.png',description:'Gashapon Monster — Gacha Treasure × Osaka Treasure.',pages:[
  ['','Gashapon Monster — Gacha Treasure × Osaka Treasure']]},
];
export function advance(position){
 const scene=scenes[position.scene];
 if(position.page+1<scene.pages.length)return {...position,page:position.page+1};
 if(position.scene+1<scenes.length)return {scene:position.scene+1,page:0};
 return null;
}
// Reserved for eventual game integration; never called by the preview.
// A single persisted record couples completion and the unique companion grant.
export function completeIntroduction(state){
 return {...state,introductionSeen:true,companions:state.companions?.some(c=>c.id==='family-first-companion')
  ? [...state.companions] : [...(state.companions??[]),{id:'family-first-companion',species:'provisional'}]};
}
export const PREVIEW_KEY='gashapon.intro-preview.v1';
export function savePreview(storage,skipped){
 try{storage.setItem(PREVIEW_KEY,JSON.stringify({seen:true,skipped}));return true;}catch{return false;}
}

export const GAME_INTRO_KEY='gashapon.introduction.v1';
export function saveIntroduction(storage){
 try{const state=JSON.parse(storage.getItem(GAME_INTRO_KEY)||'null')||{};storage.setItem(GAME_INTRO_KEY,JSON.stringify(completeIntroduction(state)));return true;}catch{return false;}
}
