import http from 'node:http';
import { resolve, dirname } from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile, rename, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1', PORT = 5174;
const ORIGIN = `http://${HOST}:${PORT}`;
const MAX = 10 * 1024 * 1024;
const directory = fileURLToPath(new URL('../public/assets/', import.meta.url));
export const destinations = Object.freeze({
 mascotte: 'mascotte_gacha_treasure.png',
 hero: 'hero-gba.png',
 npc: 'npc-gba.png',
 village: 'village-gba.png',
});
export const introDestinations = Object.freeze({
 'intro-nova': 'intro/01-nova-gacha.png',
 'intro-boutique': 'intro/02-boutique.png',
 'intro-attaques': 'intro/03-attaques.png',
 'intro-compagnon': 'intro/04-compagnon.png',
 'intro-depart': 'intro/05-depart.png',
 'intro-promo': 'intro/06-promo.png',
});
const allDestinations = Object.freeze({...destinations,...introDestinations});
const introLabels = ['Nova Gacha','Boutique familiale','Attaques','Premier compagnon','Départ','Écran promo'];
const token = randomBytes(32).toString('hex');
import { isPNG } from './png-validation.mjs';
export { isPNG } from './png-validation.mjs';
let busy = false;

const page = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Importer les graphismes</title>
<style>body{font:17px system-ui;background:#e5e7d9;color:#354e47;margin:0;padding:24px}main{max-width:450px;margin:30px auto;background:#fffdf3;padding:24px;border-radius:16px}h1{font-size:24px}button{font:inherit;padding:14px 18px;border:0;border-radius:8px;background:#354e47;color:white;margin:8px 0;touch-action:manipulation}button:disabled{opacity:.5}p{line-height:1.5;overflow-wrap:anywhere}img{max-width:100%;max-height:220px;display:block;margin:auto}small{font-size:13px}select{width:100%;font:inherit;padding:12px;margin:8px 0}label{font-weight:bold}</style>
<main><h1>Importer les graphismes</h1><p>Sélectionne ton PNG dans les téléchargements Android. Taille maximale : 10 Mo. Illustrations d’introduction : exactement 240 × 160 pixels. Écran promo : source 1536 × 1024 convertie automatiquement en 240 × 160, sans recadrage.</p>
<label for="asset">Ressource à importer</label><select id="asset"><option value="hero">Héros GBA — hero-gba.png</option><option value="npc">PNJ GBA — npc-gba.png</option><option value="village">Village GBA — village-gba.png</option><option value="mascotte">Mascotte — mascotte_gacha_treasure.png</option>${Object.entries(introDestinations).map(([key,name],i)=>`<option value="${key}">Introduction — ${introLabels[i]} — ${name}</option>`).join('')}</select><input id="file" type="file" accept="image/png,.png" hidden><button id="choose" type="button">Choisir une image</button><p id="selection">Aucune image sélectionnée.</p><img id="preview" alt="Aperçu de l’image sélectionnée" hidden><button id="upload" type="button" disabled>Importer</button><p id="status" role="status" aria-live="polite"></p><small>Destination : <span id="destination">public/assets/hero-gba.png</span><br>Seule la ressource choisie est remplacée. Les autres sont conservées.</small></main>
<script>
const input=document.querySelector('#file'),choose=document.querySelector('#choose'),upload=document.querySelector('#upload'),status=document.querySelector('#status'),preview=document.querySelector('#preview');
const asset=document.querySelector('#asset'),names=${JSON.stringify(allDestinations)};
let selected=null,url=null;
asset.onchange=()=>{document.querySelector('#destination').textContent='public/assets/'+names[asset.value];input.value='';input.onchange();};
choose.onclick=()=>input.click();
input.onchange=()=>{
 selected=null;upload.disabled=true;status.textContent='';preview.hidden=true;if(url){URL.revokeObjectURL(url);url=null;}
 const f=input.files[0];document.querySelector('#selection').textContent=f?f.name+' · '+(f.size/1024/1024).toFixed(2)+' Mo':'Aucune image sélectionnée.';
 if(!f)return;
 if(!/\\.png$/i.test(f.name)||(f.type&&f.type!=='image/png')){status.textContent='Choisis un fichier PNG.';return;}
 if(!f.size||f.size>${MAX}){status.textContent='Le PNG doit faire entre 1 octet et 10 Mo.';return;}
 selected=f;url=URL.createObjectURL(f);preview.src=url;preview.hidden=false;upload.disabled=false;
};
upload.onclick=async()=>{
 if(!selected)return;upload.disabled=true;choose.disabled=true;asset.disabled=true;status.textContent='Importation en cours…';
 try{
  let body=selected;
  const send=async(file,validate=false)=>{
   const response=await fetch('/import?asset='+encodeURIComponent(asset.value)+(validate?'&validate=1':''),{method:'POST',headers:{'Content-Type':'image/png','X-Import-Token':'${token}'},body:file});
   const result=await response.json();if(!response.ok)throw Error(result.message);return result;
  };
  if(asset.value==='intro-promo'){
   // Validate the original file on Node before the browser decodes or converts it.
   await send(selected,true);
   status.textContent='Conversion de l’écran promo en 240 × 160…';
   const bitmap=await createImageBitmap(selected);
   try{
    if(bitmap.width!==240||bitmap.height!==160){
     const canvas=document.createElement('canvas');canvas.width=240;canvas.height=160;
     const ctx=canvas.getContext('2d');if(!ctx)throw Error('Conversion indisponible.');
     ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
     ctx.drawImage(bitmap,0,0,240,160);
     body=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Conversion PNG impossible.')),'image/png'));
    }
   }finally{bitmap.close();}
  }
  const result=await send(body);status.textContent=result.message;
  if(asset.value==='intro-promo'){if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(body);preview.src=url;}
 }
 catch(error){status.textContent='Échec : '+error.message;}
 finally{upload.disabled=!selected;choose.disabled=false;asset.disabled=false;}
};
</script></html>`;
function reply(res, code, message) {
 res.writeHead(code, {'Content-Type':'application/json; charset=utf-8'});
 res.end(JSON.stringify({message}));
}
export function createServer({ assetDirectory=directory }={}) {
 return http.createServer(async (req, res) => {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  if (req.headers.host !== `${HOST}:${PORT}`) return reply(res,403,'Adresse locale non autorisée.');
  if (req.method === 'GET' && req.url === '/') {
   res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});return res.end(page);
  }
  const url=new URL(req.url,ORIGIN);
  if (req.method !== 'POST' || url.pathname !== '/import') return reply(res,404,'Page introuvable.');
  const supplied = Buffer.from(req.headers['x-import-token'] ?? '');
  if (req.headers.origin !== ORIGIN || supplied.length !== token.length || !timingSafeEqual(supplied,Buffer.from(token))) return reply(res,403,'Import autorisé uniquement depuis la page locale.');
  if (req.headers['content-type'] !== 'image/png') return reply(res,415,'Seuls les PNG sont acceptés.');
  if (Number(req.headers['content-length']) > MAX) return reply(res,413,'Taille maximale : 10 Mo.');
  const asset=url.searchParams.get('asset') ?? 'mascotte';
  if(!Object.hasOwn(allDestinations,asset))return reply(res,400,'Ressource inconnue.');
  const destination=resolve(assetDirectory,allDestinations[asset]);
  if (busy) return reply(res,409,'Un import est déjà en cours.');
  busy=true;
  let temporary;
  try {
   const chunks=[];let length=0;
   for await (const chunk of req) {
    length+=chunk.length;
    if(length>MAX){reply(res,413,'Taille maximale : 10 Mo.');req.resume();return;}
    chunks.push(chunk);
   }
   const data=Buffer.concat(chunks);
   if(!isPNG(data))return reply(res,415,'PNG invalide, endommagé ou trop volumineux après décompression (limites : 8192 pixels par côté, 64 Mo décodés).');
   // Read IHDR dimensions only after validating the complete PNG content.
   const width=data.readUInt32BE(16),height=data.readUInt32BE(20);
   if(asset==='intro-promo'&&url.searchParams.get('validate')==='1'){
    if(!((width===1536&&height===1024)||(width===240&&height===160)))
     return reply(res,422,'Écran promo : fournir un PNG de 1536 × 1024 ou 240 × 160 pixels (ratio 3:2).');
    return reply(res,200,'PNG source validé. Conversion autorisée, aucun fichier enregistré.');
   }
   if(Object.hasOwn(introDestinations,asset)&&(width!==240||height!==160))
    return reply(res,422,'Les illustrations d’introduction doivent mesurer exactement 240 × 160 pixels. Aucun fichier n’a été remplacé.');
   await mkdir(dirname(destination),{recursive:true});
   temporary=resolve(assetDirectory,`.image-import-${randomBytes(8).toString('hex')}.tmp`);
   await writeFile(temporary,data,{flag:'wx'});
   await rename(temporary,destination);temporary=null;
   reply(res,200,`Import réussi ! Image enregistrée dans ${destination} (${data.length} octets).`);
  } catch(error) {
   console.error('Échec de l’import :',error.message);
   if(!res.destroyed&&!res.headersSent)reply(res,500,'Impossible d’enregistrer le fichier. Consulte le terminal.');
  } finally {
   if(temporary)await unlink(temporary).catch(()=>{});
   busy=false;
  }
 });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
 const server=createServer();server.requestTimeout=60000;server.headersTimeout=15000;
 server.on('error',error=>{console.error('Serveur non démarré :',error.message);process.exitCode=1;});
 server.listen(PORT,HOST,()=>console.log(`Importateur local : ${ORIGIN}\nDossier : ${directory}\nDix destinations indépendantes, PNG uniquement, 10 Mo maximum. Introduction : 240 × 160 pixels.\nArrêter : Ctrl+C`));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close();server.closeAllConnections();});
}
