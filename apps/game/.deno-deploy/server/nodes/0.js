import * as universal from '../entries/pages/_layout.ts.js';
import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.Ci1zJ1Bc.js","_app/immutable/chunks/FMM7ZXC-.js","_app/immutable/chunks/Cc1ceNeC.js","_app/immutable/chunks/NOjmAiGT.js","_app/immutable/chunks/BrdJMsq8.js","_app/immutable/chunks/Bk48epmu.js","_app/immutable/chunks/3bfzTCuz.js","_app/immutable/chunks/CMtOLYb_.js"];
export const stylesheets = ["_app/immutable/assets/0.Hzda1Q6Z.css"];
export const fonts = [];
