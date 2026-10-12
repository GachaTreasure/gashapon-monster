// Keep the existing control implementation, but detach it while Village sleeps.
export function manageVillageInputs(scene,createControls,button,toggleDebug){
 const bind=()=>{
  scene.controls=createControls();
  const pad=Array.from(navigator.getGamepads?.()??[]).find(Boolean);
  scene.controls.padPrevious=[0,1].map(i=>pad?.buttons[i]?.pressed??false);
  button.addEventListener('click',toggleDebug);
 };
 const unbind=()=>{scene.controls?.destroy();button.removeEventListener('click',toggleDebug);};
 bind();scene.events.on('sleep',unbind);scene.events.on('wake',bind);
 scene.events.once('shutdown',()=>{unbind();scene.events.off('sleep',unbind);scene.events.off('wake',bind);});
}
