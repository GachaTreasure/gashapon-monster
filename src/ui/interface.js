export function createInterface() {
 document.querySelector('#app').innerHTML=`
 <main class="console">
  <header><div class="brand"><span class="capsule">◒</span> GASHAPON<span>MONSTER</span></div><div class="header-actions"><span class="version">V0.4</span><button id="fullscreen" type="button" aria-pressed="false">Plein écran</button></div></header>
  <p id="display-status" role="status" aria-live="polite" hidden></p>
  <div class="location"><span class="light"></span> NOVA GACHA <span class="region">GACHA ISLAND</span></div>
  <div id="screen" role="application" aria-label="Village explorable de Gashapon Monster"><div id="game"></div><div id="dialogue" role="status" aria-live="polite" hidden><strong id="speaker"></strong><p id="message"></p><small>A · continuer &nbsp; B · fermer</small></div></div>
  <div class="screen-caption"><span>Une petite île. Une grande aventure.</span><span>240 × 160</span></div>
  <div class="controls" aria-label="Commandes tactiles">
   <div class="dpad"><button data-control="up" aria-label="Haut">▲</button><button data-control="left" aria-label="Gauche">◀</button><span class="pivot">✚</span><button data-control="right" aria-label="Droite">▶</button><button data-control="down" aria-label="Bas">▼</button></div>
   <div class="action-buttons"><div><button data-control="b" aria-label="B : fermer le dialogue">B</button><small>RETOUR</small></div><div><button data-control="a" aria-label="A : parler ou continuer">A</button><small>PARLER</small></div></div>
  </div>
  <footer><button id="debug" aria-pressed="false">GRILLE DEBUG</button><button id="revisit-intro" type="button">Revoir l’introduction</button><span id="coordinates">08 · 09</span></footer>
  <p class="help">Approche-toi de Mila et regarde vers elle, puis appuie sur A.<br>Clavier : flèches · A : Entrée / Z · B : Échap / X</p>
 </main>`;
 return {
  open:false,page:0,
  pages:["Bienvenue à Bourg-Soleil ! Je suis Mila, la gardienne du village.","Prends le temps d’explorer les chemins. La maison au toit de terre cuite est notre atelier.","Les monstres viendront un jour… Pour l’instant, profite du calme de notre île !"],
  show(){this.open=true;this.page=0;this.render();},
  next(){if(++this.page>=this.pages.length)this.close();else this.render();},
  close(){this.open=false;document.querySelector('#dialogue').hidden=true;},
  render(){document.querySelector('#speaker').textContent='Mila';document.querySelector('#message').textContent=this.pages[this.page];document.querySelector('#dialogue').hidden=false;},
 };
}
