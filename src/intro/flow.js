import {GAME_INTRO_KEY} from './story.js';
export function introductionMode(storage,search=''){
 const query=new URLSearchParams(search);
 if(query.get('intro')==='first')return 'test';
 if(query.get('play')==='1')return null;
 try{if(JSON.parse(storage?.getItem(GAME_INTRO_KEY)||'null')?.introductionSeen===true)return null;}catch{}
 return 'first';
}
