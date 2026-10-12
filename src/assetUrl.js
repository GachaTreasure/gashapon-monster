// Vite substitutes BASE_URL at build time; the fallback also supports Node tests.
export function assetUrl(path){return (import.meta.env?.BASE_URL??'/')+path.replace(/^\/+/, '');}
