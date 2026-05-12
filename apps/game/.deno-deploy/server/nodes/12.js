

export const index = 12;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/login/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/12.BwPmzAFu.js","_app/immutable/chunks/FMM7ZXC-.js","_app/immutable/chunks/3bfzTCuz.js"];
export const stylesheets = [];
export const fonts = [];
