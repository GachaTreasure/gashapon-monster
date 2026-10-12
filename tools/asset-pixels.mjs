// Deterministic PNG extraction helpers for the supplied RGBA8 asset sheets.
import { inflateSync, deflateSync } from 'node:zlib';
import { isPNG } from './png-validation.mjs';
export function decodePNG(buffer){
 if(!isPNG(buffer)||buffer[24]!==8||buffer[25]!==6||buffer[28]!==0)throw Error('Expected a valid non-interlaced RGBA8 PNG');
 const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20),chunks=[];
 for(let p=8;p<buffer.length;){const n=buffer.readUInt32BE(p);if(buffer.toString('ascii',p+4,p+8)==='IDAT')chunks.push(buffer.subarray(p+8,p+8+n));p+=n+12;}
 const raw=inflateSync(Buffer.concat(chunks)),pixels=Buffer.alloc(width*height*4),stride=width*4;
 let offset=0;
 for(let y=0;y<height;y++){
  const filter=raw[offset++];
  for(let x=0;x<stride;x++){
   const i=y*stride+x,a=x>=4?pixels[i-4]:0,b=y?pixels[i-stride]:0,c=y&&x>=4?pixels[i-stride-4]:0;
   let predictor=0;
   if(filter===1)predictor=a;if(filter===2)predictor=b;if(filter===3)predictor=Math.floor((a+b)/2);
   if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);predictor=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
   pixels[i]=(raw[offset++]+predictor)&255;
  }
 }
 return {width,height,pixels};
}
function chunk(name,data){
 const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(name,4);data.copy(b,8);
 let c=0xffffffff;for(const n of b.subarray(4,-4)){c^=n;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}
 b.writeUInt32BE((c^0xffffffff)>>>0,b.length-4);return b;
}
export function encodePNG(image){
 const {width,height,pixels}=image,header=Buffer.alloc(13),raw=Buffer.alloc((width*4+1)*height);
 header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 for(let y=0;y<height;y++)pixels.copy(raw,y*(width*4+1)+1,y*width*4,(y+1)*width*4);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
export function blank(width,height){return {width,height,pixels:Buffer.alloc(width*height*4)};}
export function crop(image,{x,y,width,height}){
 if(x<0||y<0||x+width>image.width||y+height>image.height)throw Error('Crop outside source');
 const out=blank(width,height);for(let j=0;j<height;j++)image.pixels.copy(out.pixels,j*width*4,((y+j)*image.width+x)*4,((y+j)*image.width+x+width)*4);return out;
}
export function resize(image,scale){
 const out=blank(Math.max(1,Math.round(image.width*scale)),Math.max(1,Math.round(image.height*scale)));
 for(let y=0;y<out.height;y++)for(let x=0;x<out.width;x++){
  const sx=Math.min(image.width-1,Math.floor((x+0.5)/scale)),sy=Math.min(image.height-1,Math.floor((y+0.5)/scale));
  image.pixels.copy(out.pixels,(y*out.width+x)*4,(sy*image.width+sx)*4,(sy*image.width+sx+1)*4);
 }
 return out;
}
export function blit(target,source,x,y){
 for(let sy=0;sy<source.height;sy++)for(let sx=0;sx<source.width;sx++){
  const tx=x+sx,ty=y+sy;if(tx<0||ty<0||tx>=target.width||ty>=target.height)continue;
  const i=(sy*source.width+sx)*4,o=(ty*target.width+tx)*4,a=source.pixels[i+3]/255;
  for(let c=0;c<3;c++)target.pixels[o+c]=Math.round(source.pixels[i+c]*a+target.pixels[o+c]*(1-a));
  target.pixels[o+3]=Math.round(source.pixels[i+3]+target.pixels[o+3]*(1-a));
 }
}
export function components(image,threshold=127){
 const {width,height,pixels}=image,seen=new Uint8Array(width*height),queue=new Int32Array(width*height),result=[];
 for(let start=0;start<seen.length;start++){
  if(seen[start]||pixels[start*4+3]<=threshold)continue;
  let head=0,tail=1,minX=width,maxX=0,minY=height,maxY=0;queue[0]=start;seen[start]=1;
  while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const n=ny*width+nx;if(!seen[n]&&pixels[n*4+3]>threshold){seen[n]=1;queue[tail++]=n;}}
  }
  result.push({x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1,area:tail});
 }
 return result.sort((a,b)=>b.area-a.area);
}
