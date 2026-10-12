export class Controls {
 constructor(root, onAction, onDebug) {
  this.held=new Map(); this.keys=new Set();this.padPrevious=[];this.onAction=onAction;
  this.keydown=e=>{
   if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Escape'].includes(e.key)) e.preventDefault();
   this.keys.add(e.key.toLowerCase());
   if(!e.repeat) {if([' ','Enter','z','Z'].includes(e.key)) onAction('a');if(['Escape','x','X'].includes(e.key)) onAction('b');if(e.key.toLowerCase()==='d') onDebug();}
  };
  this.keyup=e=>this.keys.delete(e.key.toLowerCase());
  this.clear=()=>{this.keys.clear();this.held.clear();root.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));};
  window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);window.addEventListener('blur',this.clear);
  this.visibility=()=>{if(document.hidden)this.clear();};document.addEventListener('visibilitychange',this.visibility);
  this.bindings=[];
  root.querySelectorAll('[data-control]').forEach(button=>{
   const down=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);button.classList.add('pressed');const key=button.dataset.control;this.held.set(e.pointerId,key);if(key==='a'||key==='b')onAction(key);};
   const up=e=>{this.held.delete(e.pointerId);if(![...this.held.values()].includes(button.dataset.control))button.classList.remove('pressed');};
   button.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(name=>button.addEventListener(name,up));this.bindings.push({button,down,up});
  });
 }
 poll() {
  const pad=Array.from(navigator.getGamepads?.()??[]).find(Boolean);
  this.pad=pad;
  if(pad){[0,1].forEach((index)=>{const pressed=pad.buttons[index]?.pressed??false;if(pressed&&!this.padPrevious[index])this.onAction(index===0?'a':'b');this.padPrevious[index]=pressed;});}
  else this.padPrevious=[];
 }
 direction() {
  const touch=[...this.held.values()].reverse().find(k=>['up','down','left','right'].includes(k));if(touch)return touch;
  for(const [dir,keys] of Object.entries({up:['arrowup','w'],down:['arrowdown','s'],left:['arrowleft','a','q'],right:['arrowright']}))if(keys.some(k=>this.keys.has(k)))return dir;
  const p=this.pad;if(!p)return null;
  if(p.buttons[12]?.pressed)return 'up';if(p.buttons[13]?.pressed)return 'down';if(p.buttons[14]?.pressed)return 'left';if(p.buttons[15]?.pressed)return 'right';
  const [x=0,y=0]=p.axes;if(Math.max(Math.abs(x),Math.abs(y))<0.45)return null;return Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down');
 }
 destroy(){this.clear();window.removeEventListener('keydown',this.keydown);window.removeEventListener('keyup',this.keyup);window.removeEventListener('blur',this.clear);document.removeEventListener('visibilitychange',this.visibility);this.bindings.forEach(({button,down,up})=>{button.removeEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(n=>button.removeEventListener(n,up));});}
}
