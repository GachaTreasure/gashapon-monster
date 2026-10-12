export const TILE = 16;
export const rows = [
 'TTTTTTTTTTTTTTTTTTTT',
 'TggggggggggggggggggT',
 'TgffggggggggggffgggT',
 'TgggggHHHHggggggTggT',
 'TgTTggHWWHggggggTggT',
 'TgTTggHDDHgggggggggT',
 'TgggggppppggFFFFgggT',
 'TggggggppggggggggggT',
 'TppppppppppppppppppT',
 'TggggggppggggggggggT',
 'TgFFgggppgggTTggfggT',
 'TggggggppgggTTgggggT',
 'TgffgggppggggggffggT',
 'TggggggppggggggggggT',
 'TTTTTTTTTTTTTTTTTTTT',
];
// Collision data is explicit and independent of the visual tiles. 1 = blocked.
export const collisions = [
 '11111111111111111111',
 '10000000000000000001',
 '10000000000000000001',
 '10000011110000001001',
 '10110011110000001001',
 '10110011110000000001',
 '10000000000011110001',
 '10000000000000000001',
 '10000000000000000001',
 '10000000000000000001',
 '10110000000011000001',
 '10000000000011000001',
 '10000000000000000001',
 '10000000000000000001',
 '11111111111111111111',
];
export const WIDTH = 20, HEIGHT = 15;
export const spawn = { x: 8, y: 9 };
export const npc = { x: 10, y: 7, name: 'Mila' };
export const directions = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
export function isBlocked(x, y, actors = []) {
 return !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT || collisions[y][x] === '1' || actors.some(a => a.x === x && a.y === y);
}
export function destination(x, y, direction, actors = []) {
 const vector = directions[direction];
 if (!vector) return null;
 const next = { x: x + vector[0], y: y + vector[1] };
 return isBlocked(next.x, next.y, actors) ? null : next;
}
export function cameraPosition(x, y) {
 return { x: Math.max(0, Math.min(WIDTH*TILE-160, x-80)), y: Math.max(0, Math.min(HEIGHT*TILE-144, y-72)) };
}
