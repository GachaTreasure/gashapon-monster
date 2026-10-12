// Portable historical checks: hashes only, never package the local backup folders.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
export const baseline=JSON.parse(fs.readFileSync(new URL('./stable-checks.json',import.meta.url)));
export function compareBaseline(root,relative){
 const reference=root+'/'+relative;
 if(baseline.hashes[reference]){
  const current=fs.readFileSync(relative);
  assert.equal(createHash('sha256').update(current).digest('hex'),baseline.hashes[reference],relative);
  // Also verify the local archive itself, when present.
  if(fs.existsSync(reference))assert.deepEqual(current,fs.readFileSync(reference),reference);
 }else{
  const prefix=reference+'/';const entries=Object.keys(baseline.hashes).filter(key=>key.startsWith(prefix));assert.ok(entries.length,'Missing reference '+reference);
  for(const key of entries)compareBaseline(root,key.slice(root.length+1));
 }
}
