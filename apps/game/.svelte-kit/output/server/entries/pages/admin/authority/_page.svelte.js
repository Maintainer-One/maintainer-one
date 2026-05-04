import { G as attr, c as head, f as stringify } from "../../../../chunks/index-server.js";
import { d as base } from "../../../../chunks/environment.js";
import "../../../../chunks/paths.js";
import "../../../../chunks/supabase.js";
//#region src/routes/admin/authority/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		head("12ecahi", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Maintainer Authority | Maintainer One</title>`);
			});
		});
		$$renderer.push(`<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 p-8 lg:p-12 font-sans selection:bg-[var(--color-brand-primary)]/30"><header class="mb-12 flex items-center justify-between max-w-4xl mx-auto"><div class="flex items-center gap-8"><div class="inline-flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl"><div class="flex items-center gap-4"><a${attr("href", `${stringify(base)}/`)} aria-label="Go back" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-500 shadow-lg"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></a> <div class="flex flex-col"><h1 class="text-2xl font-black tracking-tighter text-white uppercase leading-none">Maintainer <span class="text-emerald-400">Authority</span></h1> <p class="text-[8px] font-black text-emerald-400/50 uppercase tracking-[0.4em] mt-1.5">Platform Management</p></div></div></div></div> <div class="flex items-center gap-4"><button class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">+ New League</button></div></header> <div class="max-w-4xl mx-auto space-y-8">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="space-y-4"><h2 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2 mb-4">Active Leagues</h2> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="flex h-32 items-center justify-center"><div class="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div></div>`);
		$$renderer.push(`<!--]--></div></div></div>`);
	});
}
//#endregion
export { _page as default };
