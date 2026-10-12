// CSS display sizing only. Never resize Phaser's 240 × 160 backing canvas.
export function displayLayout({width,height,dpr=1,bottomReserve=0,padding={left:4,right:4,top:4,bottom:4}}){
 const landscape=width>height;
 const availableWidth=Math.max(1,width-padding.left-padding.right);
 const availableHeight=Math.max(1,height-padding.top-padding.bottom);
 const rail=landscape?Math.max(132,Math.min(156,availableWidth*0.18)):0;
 const maxWidth=landscape?Math.max(1,availableWidth-rail*2-8):Math.min(availableWidth,width*0.98);
 const maxHeight=landscape?Math.max(1,availableHeight-44-bottomReserve):Infinity;
 const ideal=Math.min(maxWidth,maxHeight*1.5);
 // A 3-device-pixel width increment keeps both outer edges on device pixels.
 // Fractional zoom deliberately fills phones instead of snapping down to 1×.
 const step=3/Math.max(1,dpr);
 const canvasWidth=Math.max(Math.min(ideal,step),Math.floor((ideal+1e-8)/step)*step);
 return {landscape,rail,width:canvasWidth,height:canvasWidth/1.5};
}
export function mountMobileLayout(game,{win=window,doc=document}={}){
 const root=doc.querySelector('.console'),screen=doc.querySelector('#screen');
 const fullscreen=doc.querySelector('#fullscreen'),status=doc.querySelector('#display-status');
 let frame=null,disposed=false,lastLandscape;
 const listen=(target,name,handler)=>{target?.addEventListener(name,handler);return ()=>target?.removeEventListener(name,handler);};
 const removers=[];
 function resize(){
  if(disposed)return;
  const viewport=win.visualViewport;
  const width=Math.min(viewport?.width??win.innerWidth,doc.documentElement?.clientWidth||win.innerWidth);
  const height=viewport?.height??win.innerHeight;
  root.style.setProperty('--app-width',width+'px');root.style.setProperty('--app-height',height+'px');
  const style=win.getComputedStyle(root);
  const padding={};for(const edge of ['left','right','top','bottom'])padding[edge]=parseFloat(style['padding'+edge[0].toUpperCase()+edge.slice(1)])||0;
  const bottomReserve=root.dataset.introPromo==='true'?Math.max(48,(doc.querySelector('#intro-promo-links')?.offsetHeight??0)+4):0;
  const layout=displayLayout({width,height,dpr:win.devicePixelRatio??1,padding,bottomReserve});
  root.dataset.layout=layout.landscape?'landscape':'portrait';
  root.style.setProperty('--rail-width',layout.rail+'px');
  root.style.setProperty('--screen-width',layout.width+'px');root.style.setProperty('--screen-height',layout.height+'px');
  screen.style.width=layout.width+'px';screen.style.height=layout.height+'px';
  if(game.canvas){
   game.canvas.style.width=layout.width+'px';game.canvas.style.height=layout.height+'px';
   game.scale?.updateBounds();
   game.scale?.displayScale?.set(240/layout.width,160/layout.height);
  }
  // Rotation can cancel a gesture: clear held buttons, without changing controls.
  if(lastLandscape!==undefined&&lastLandscape!==layout.landscape)game.scene?.getScene('Village')?.controls?.clear();
  lastLandscape=layout.landscape;
 }
 function schedule(){
  if(disposed)return;
  if(!win.requestAnimationFrame){resize();return;}
  if(frame===null)frame=win.requestAnimationFrame(()=>{frame=null;resize();});
 }
 function fullscreenChanged(){
  const active=doc.fullscreenElement===root;
  fullscreen.textContent=active?'Quitter le plein écran':'Plein écran';
  fullscreen.setAttribute('aria-pressed',String(active));
  root.dataset.fullscreen=String(active);schedule();
 }
 async function toggleFullscreen(){
  fullscreen.disabled=true;status.hidden=true;
  try{
   if(doc.fullscreenElement)await doc.exitFullscreen();
   else if(root.requestFullscreen)await root.requestFullscreen();
   else throw Error('unavailable');
  }catch{
   status.textContent='Plein écran indisponible. Le mode paysage reste utilisable en tournant le téléphone.';status.hidden=false;
  }finally{fullscreen.disabled=false;fullscreenChanged();}
 }
 removers.push(listen(fullscreen,'click',toggleFullscreen));
 for(const name of ['resize','orientationchange'])removers.push(listen(win,name,schedule));
 for(const name of ['resize','scroll'])removers.push(listen(win.visualViewport,name,schedule));
 removers.push(listen(doc,'fullscreenchange',fullscreenChanged));
 const observer=win.ResizeObserver?new win.ResizeObserver(schedule):null;observer?.observe(root);
 game.events.once('ready',schedule);
 fullscreenChanged();resize();
 return ()=>{disposed=true;if(frame!==null)win.cancelAnimationFrame?.(frame);removers.forEach(remove=>remove());observer?.disconnect();game.events.off?.('ready',schedule);};
}
