import { inflateSync } from 'node:zlib';
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
// Check signature, chunk CRCs, legal IHDR, then decompress actual scanlines.
// Both ordinary PNGs and Adam7 interlaced PNGs are accepted.
export function isPNG(data){
 try{
  if(data.length<45||!data.subarray(0,8).equals(signature))return false;
  let offset=8,header=null,palette=false,paletteSeen=false,ended=false,closed=false;
  const compressed=[];
  while(offset+12<=data.length){
   const size=data.readUInt32BE(offset),end=offset+12+size;
   if(end>data.length)return false;
   const kind=data.toString('ascii',offset+4,offset+8);
   if(!/^[A-Za-z]{4}$/.test(kind)||kind[2]!==kind[2].toUpperCase())return false;
   let crc=0xffffffff;
   for(let i=offset+4;i<end-4;i++){crc^=data[i];for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
   if(((crc^0xffffffff)>>>0)!==data.readUInt32BE(end-4))return false;
   const payload=data.subarray(offset+8,end-4);
   if(!header){
    if(kind!=='IHDR'||size!==13)return false;
    const width=payload.readUInt32BE(0),height=payload.readUInt32BE(4),depth=payload[8],type=payload[9];
    const depths={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
    if(!width||!height||width>8192||height>8192||!depths[type]?.includes(depth)||payload[10]||payload[11]||payload[12]>1)return false;
    header={width,height,depth,type,interlace:payload[12]};
   }else if(kind==='IHDR')return false;
   else if(kind==='PLTE'){
    if(paletteSeen||compressed.length||!size||size%3||size>768||[0,4].includes(header.type))return false;
    if(header.type===3&&size/3>2**header.depth)return false;
    palette=true;paletteSeen=true;
   }else if(kind==='IDAT'){
    if(closed||(header.type===3&&!palette))return false;
    compressed.push(payload);
   }else{
    if(compressed.length)closed=true;
    if(kind==='IEND'){if(size||end!==data.length||!compressed.length)return false;ended=true;break;}
    if(kind[0]===kind[0].toUpperCase())return false;
   }
   offset=end;
  }
  if(!ended)return false;
  const {width,height,depth,type,interlace}=header;
  const channels={0:1,2:3,3:1,4:2,6:4}[type];
  const passes=interlace?[[0,0,8,8],[4,0,8,8],[0,4,4,8],[2,0,4,4],[0,2,2,4],[1,0,2,2],[0,1,1,2]]:[[0,0,1,1]];
  const scans=[];let expected=0;
  for(const [x,y,dx,dy] of passes){
   const pw=Math.max(0,Math.ceil((width-x)/dx)),ph=Math.max(0,Math.ceil((height-y)/dy));
   if(!pw||!ph)continue;
   const stride=Math.ceil(pw*depth*channels/8)+1;
   scans.push({stride,rows:ph});expected+=stride*ph;
  }
  // Bound decompression memory independently of the uploaded file size.
  if(expected>64*1024*1024)return false;
  const decoded=inflateSync(Buffer.concat(compressed),{maxOutputLength:expected});
  if(decoded.length!==expected)return false;
  let cursor=0;for(const scan of scans)for(let y=0;y<scan.rows;y++){if(decoded[cursor]>4)return false;cursor+=scan.stride;}
  return true;
 }catch{return false;}
}
