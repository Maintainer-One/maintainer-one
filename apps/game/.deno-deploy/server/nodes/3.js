import * as server from '../entries/pages/team/_id_/dashboard/_layout.server.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/team/[id]/dashboard/+layout.server.ts";
export const imports = ["_app/immutable/nodes/3.D9DteDAJ.js","_app/immutable/chunks/Dax4pK76.js","_app/immutable/chunks/FMM7ZXC-.js","_app/immutable/chunks/3bfzTCuz.js"];
export const stylesheets = [];
export const fonts = [];
