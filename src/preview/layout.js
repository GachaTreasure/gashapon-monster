// Isolated visual staging. Does not import or change gameplay map/collisions.
export const VIEW_WIDTH=240,VIEW_HEIGHT=160,TILE=16;
export const objects=[
 {name:'house',x:32,y:16},
 {name:'tree',x:160,y:16},{name:'tree',x:208,y:16},
 {name:'tree',x:0,y:112},{name:'tree',x:208,y:112},
 {name:'bush',x:16,y:80},{name:'bush',x:192,y:80},
 {name:'fence',x:32,y:80},{name:'fence',x:48,y:80},{name:'fence',x:64,y:80},
];
export const actors={hero:{x:112,y:112},npc:{x:160,y:112}};
export function groundAt(x,y){
 if(y===6||y===7||x===6||x===7)return 'path';
 if((x===1&&y===1)||(x===11&&y===5)||(x===3&&y===9))return 'flowers';
 return 'grass';
}

export function groundTextureAt(x,y){
 const name=groundAt(x,y);if(name!=='path')return name;
 const mask=(groundAt(x,y-1)==='path'?1:0)|(groundAt(x+1,y)==='path'?2:0)|(groundAt(x,y+1)==='path'?4:0)|(groundAt(x-1,y)==='path'?8:0);
 return mask===15?'path':'path-'+mask;
}
