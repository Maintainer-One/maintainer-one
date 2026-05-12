import * as server from '../entries/pages/around-the-league/submit/_page.server.ts.js';

export const index = 10;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/around-the-league/submit/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/around-the-league/submit/+page.server.ts";
export const imports = ["_app/immutable/nodes/10.C9y4YQhL.js","_app/immutable/chunks/FMM7ZXC-.js","_app/immutable/chunks/Cc1ceNeC.js","_app/immutable/chunks/Bk48epmu.js","_app/immutable/chunks/3bfzTCuz.js"];
export const stylesheets = [];
export const fonts = [];
