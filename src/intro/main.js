import {assetUrl} from '../assetUrl.js';
import './style.css';
import {mountIntroduction} from './runtime.js';
import {savePreview} from './story.js';
const root=document.querySelector('#preview-root');
mountIntroduction(root,{fullscreenTarget:root,onFinish(skipped){
 try{savePreview(localStorage,skipped);}catch{}
 window.location.assign(assetUrl('?play=1'));
}});
