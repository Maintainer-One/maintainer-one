import * as server from '../entries/pages/around-the-league/_page.server.ts.js';

export const index = 9;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/around-the-league/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/around-the-league/+page.server.ts";
export const imports = ["_app/immutable/nodes/9.BOTwWwKd.js","_app/immutable/chunks/FMM7ZXC-.js","_app/immutable/chunks/3bfzTCuz.js"];
export const stylesheets = [];
export const fonts = [];
