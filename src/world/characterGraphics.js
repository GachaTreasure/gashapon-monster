// Prepared PNG frames, shared with the validated GBA preview.
export const CHARACTER_FRAME=32;
export const PLAYER_ORIGIN_Y=(31-8)/CHARACTER_FRAME;
export const directionRows={down:0,left:1,right:2,up:3};
export const idleFrame=direction=>directionRows[direction]*3+1;
// Two moving poses fit within one unchanged 180 ms step. Frame 1 is idle.
export const walkFrames=direction=>[0,2].map(frame=>directionRows[direction]*3+frame);
export const characterDepth=logicalY=>logicalY+8+0.1;
