import test from 'node:test';
import http from 'node:http';
const fetch=(url,options={})=>new Promise((resolve,reject)=>{
 const request=http.request(url,{method:options.method??'GET',headers:options.headers},response=>{const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>{const body=Buffer.concat(chunks).toString();resolve({status:response.statusCode,text:async()=>body,json:async()=>JSON.parse(body)});});});request.on('error',reject);if(options.body){request.setHeader('Content-Length',Buffer.byteLength(options.body));request.end(options.body);}else request.end();
});
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {createServer,destinations,isPNG} from '../tools/import-image.mjs';
const chunk=(name,data)=>{
 const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(name,4);data.copy(b,8);
 let crc=0xffffffff;for(const n of b.subarray(4,-4)){crc^=n;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 b.writeUInt32BE((crc^0xffffffff)>>>0,b.length-4);return b;
};
function png(red=255,compressed){
 const ihdr=Buffer.from([0,0,0,1,0,0,0,1,8,6,0,0,0]);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',compressed??deflateSync(Buffer.from([0,red,0,0,255]))),chunk('IEND',Buffer.alloc(0))]);
}
test('PNG content: CRC, compressed pixels, row length and filter validation',()=>{
 assert.ok(isPNG(png()));assert.equal(isPNG(Buffer.from('not PNG')),false);
 assert.equal(isPNG(png().subarray(0,-2)),false);
 const bad=png();bad[40]^=1;assert.equal(isPNG(bad),false);
 assert.equal(isPNG(png(255,Buffer.from('invalid zlib'))),false);
 assert.equal(isPNG(png(255,deflateSync(Buffer.from([0,0])))),false);
 assert.equal(isPNG(png(255,deflateSync(Buffer.from([5,0,0,0,255])))),false);
});
test('four separate destinations, legacy import, limits and local access',async()=>{
 const directory=await mkdtemp(new URL('../tools/.import-test-',import.meta.url).pathname);
 const server=createServer({assetDirectory:directory});
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const page=await fetch(base,{headers:{Host:'127.0.0.1:5174'}});assert.equal(page.status,200);
  const html=await page.text();assert.ok(html.includes('Choisir une image'));
  new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
  const token=html.match(/'X-Import-Token':'([a-f0-9]+)'/)[1];
  const post=(asset,body,extra={})=>fetch(base+'/import'+(asset===null?'':'?asset='+encodeURIComponent(asset)),{method:'POST',headers:{Host:'127.0.0.1:5174',Origin:'http://127.0.0.1:5174','Content-Type':'image/png','X-Import-Token':token,...extra},body});
  let n=20;const expected=new Map();
  for(const [asset,name] of Object.entries(destinations)){const bytes=png(n++);const response=await post(asset,bytes);assert.equal(response.status,200);assert.ok((await response.json()).message.includes(name));expected.set(name,bytes);}
  assert.equal((await post('hero',Buffer.from('bad'))).status,415);
  assert.equal((await post('../escape',png())).status,400);
  assert.equal((await post('hero',png(),{'Content-Type':'image/jpeg'})).status,415);
  assert.equal((await post('hero',png(),{Origin:'https://example.com'})).status,403);
  assert.equal((await post('hero',png(),{'X-Import-Token':'wrong'})).status,403);
  assert.equal((await post('hero',Buffer.alloc(10*1024*1024+1))).status,413);
  for(const [name,bytes] of expected)assert.deepEqual(await readFile(directory+'/'+name),bytes);
  const replacement=png(80);assert.equal((await post('hero',replacement)).status,200);expected.set('hero-gba.png',replacement);
  assert.equal((await post(null,replacement)).status,200);expected.set('mascotte_gacha_treasure.png',replacement);
  for(const [name,bytes] of expected)assert.deepEqual(await readFile(directory+'/'+name),bytes);
  assert.deepEqual((await readdir(directory)).sort(),Object.values(destinations).sort());
 }finally{
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  await rm(directory,{recursive:true,force:true});
 }
});
