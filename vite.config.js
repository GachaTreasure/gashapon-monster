import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
// Keep the main prototype and the isolated GBA preview as separate entry points.
export default defineConfig(({command,isPreview})=>({
 base: (command==='build'||isPreview)?'/gashapon-monster/':'/',
 preview: { host:'127.0.0.1' },
 server: { host: '127.0.0.1' },
 build: { rolldownOptions: { input: {
  game: fileURLToPath(new URL('./index.html',import.meta.url)),
  introPreview: fileURLToPath(new URL('./intro-preview.html',import.meta.url)),
  gbaPreview: fileURLToPath(new URL('./gba-preview.html',import.meta.url)),
 } } },
}));
