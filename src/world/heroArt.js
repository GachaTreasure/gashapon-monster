// Original V0.2 handheld-RPG palette and pixel-native character art.
export const HERO_WIDTH=16, HERO_HEIGHT=24, HERO_ORIGIN_Y=16/24;
export const heroPalette={o:'#293b50',h:'#22468e',b:'#397acb',l:'#87bee8',s:'#ffdaa5',e:'#fff4de',y:'#f6cf51',c:'#8bd1df',r:'#df565e'};
const front=[
 '........oo......','.......ohlo.....','......ohlo......','....oohhhoo.....',
 '...ohhhhhhoo....','..ohhblhhhhho...','.ohhblhhhhhhho..','..ohhhhhhhhhho..',
 '..ohhsshhssho...','...osssssssso...','...oseesseeso...','...oseossoeso...',
 '...osssssssso...','....osssssso....','.....osssso.....','....ocbbbbco....',
 '...ocbbyybbco...','...osbbyybbso...','...osbbbbbbso...','...ocbbbbbbco...',
 '....ocbbbbco....','....orroorro....','...orrroorrro...','....ooo.ooo.....',
];
const back=[
 '........oo......','.......ohlo.....','......ohlo......','....oohhhoo.....',
 '...ohhhhhhoo....','..ohhblhhhhho...','.ohhblhhhhhhho..','..ohhhhhhhhhho..',
 '..ohhhhhhhhhho..','...ohhhhhhhho...','...ohhhhhhhho...','...ohhhhhhhho...',
 '....ohhhhhho....','.....ohhhho.....','......oooo......','....ocbbbbco....',
 '...occcccccco...','...osccccccso...','...osccccccso...','...occcccccco...',
 '....occcccco....','....orroorro....','...orrroorrro...','....ooo.ooo.....',
];
const left=[
 '.......oo.......','......ohlo......','.....ohlo.......','....ohhhoo......',
 '...ohhhhhhho....','..ohhblhhhhho...','..ohblhhhhhhho..','.ohhhhhhhhhhho..',
 '..ohsshhhhhhho..','..osssshhhhhho..','..oseesshhhho...','..oseosshhhho...',
 '..ossssshhho....','...ossssshho....','....ossssoo.....','....obbybco.....',
 '...obbyybcco....','...obsbbbcco....','...osssbbcco....','....osbbccco....',
 '.....obbbco.....','...orrroorro....','..orrrroorrro...','...oooo.ooo.....',
];
export function drawHero(rect,direction,frame){
 const rows=direction==='up'?back:direction==='down'?front:left;
 rows.forEach((row,y)=>[...row].forEach((color,x)=>{
  if(color==='.')return;
  let px=direction==='right'?15-x:x,py=y;
  if(y>=21&&frame&&((x<8)===(frame===1)))py--;
  if(y===20&&color==='c'&&frame)px+=frame===1?-1:1;
  rect(heroPalette[color],px,py,1,1);
 }));
}
