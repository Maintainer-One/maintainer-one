import { G as attr, K as escape_html, c as head, d as store_get, f as stringify, p as unsubscribe_stores, tt as getContext } from "../../../../../chunks/index-server.js";
import { d as base } from "../../../../../chunks/environment.js";
import "../../../../../chunks/paths.js";
import "../../../../../chunks/client.js";
import "../../../../../chunks/supabase.js";
//#region ../../node_modules/@sveltejs/kit/src/runtime/app/stores.js
/**
* A function that returns all of the contextual stores. On the server, this must be called during component initialization.
* Only use this if you need to defer store subscription until after the component has mounted, for some reason.
*
* @deprecated Use `$app/state` instead (requires Svelte 5, [see docs for more info](https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated))
*/
var getStores = () => {
	const stores$1 = getContext("__svelte__");
	return {
		/** @type {typeof page} */
		page: { subscribe: stores$1.page.subscribe },
		/** @type {typeof navigating} */
		navigating: { subscribe: stores$1.navigating.subscribe },
		/** @type {typeof updated} */
		updated: stores$1.updated
	};
};
/**
* A readable store whose value contains page data.
*
* On the server, this store can only be subscribed to during component initialization. In the browser, it can be subscribed to at any time.
*
* @deprecated Use `page` from `$app/state` instead (requires Svelte 5, [see docs for more info](https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated))
* @type {import('svelte/store').Readable<import('@sveltejs/kit').Page>}
*/
var page = { subscribe(fn) {
	return getStores().page.subscribe(fn);
} };
//#endregion
//#region src/routes/player/[teamId]/[unitIndex]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		store_get($$store_subs ??= {}, "$page", page).params.teamId;
		store_get($$store_subs ??= {}, "$page", page).params.unitIndex;
		head("aj0106", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>${escape_html("Player Profile")} | Maintainer One</title>`);
			});
		});
		$$renderer.push(`<div class="min-h-screen p-8 text-white max-w-7xl mx-auto space-y-12"><header class="mb-8 flex items-center justify-between"><div class="flex items-center gap-6"><a${attr("href", `${stringify(base)}/leaderboard`)} class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:text-[var(--color-brand-primary)] shadow-lg backdrop-blur-md"><svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 18l-6-6 6-6"></path></svg></a> <div><h1 class="text-3xl font-black uppercase tracking-widest text-white drop-shadow-lg">Player Profile</h1> <p class="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-secondary)] mt-1 opacity-80">Career Statistics</p></div></div></header> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="flex h-64 items-center justify-center"><div class="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-brand-primary)] border-t-transparent"></div></div>`);
		$$renderer.push(`<!--]--></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
