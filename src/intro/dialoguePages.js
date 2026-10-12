export const DIALOGUE_LINES=2;
// Word wrapping uses the actual interface font, including very long words.
export function wrapMeasuredText(text,measure,width){
 const limit=Math.max(1,width),lines=[];let line='';
 for(const word of text.trim().split(/\s+/)){
  if(!word)continue;
  if(line&&measure(line+' '+word)<=limit){line+=' '+word;continue;}
  if(line){lines.push(line);line='';}
  for(const char of Array.from(word)){
   if(line&&measure(line+char)>limit){lines.push(line);line='';}
   line+=char;
  }
 }
 if(line)lines.push(line);
 return lines;
}
export function paginateDialogue(text,wrap,maxLines=DIALOGUE_LINES){
 if(!Number.isInteger(maxLines)||maxLines<1)throw Error('Invalid dialogue line limit');
 const lines=wrap(text),pages=[];
 for(let i=0;i<lines.length;i+=maxLines)pages.push(lines.slice(i,i+maxLines).join('\n'));
 return pages.length?pages:[''];
}
