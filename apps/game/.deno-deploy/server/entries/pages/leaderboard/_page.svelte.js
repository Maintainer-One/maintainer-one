import { h as base } from "../../../chunks/environment.js";
import { X as escape_html, Y as attr, d as stringify, s as head } from "../../../chunks/dev.js";
import "../../../chunks/paths.js";
import "../../../chunks/supabase.js";
import "../../../chunks/registry.js";
import { t as BrandLoading } from "../../../chunks/BrandLoading.js";
//#region src/routes/leaderboard/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let activeSeason = null;
		head("c59208", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Leaderboard | Maintainer One</title>`);
			});
		});
		$$renderer.push(`<div class="flex flex-col gap-12 p-6 lg:p-10 max-w-7xl mx-auto w-full min-h-screen"><header class="flex items-center justify-between border-b border-white/10 pb-6"><div><h1 class="text-3xl font-black tracking-tight text-white flex items-center gap-4"><svg class="h-8 w-8 text-[var(--color-brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg> Global Leaderboard</h1> <p class="text-sm font-medium text-white/50 mt-2 uppercase tracking-widest">${escape_html(activeSeason?.name || "Loading Season...")}</p></div> <a${attr("href", `${stringify(base)}/`)} class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-secondary)]/50 hover:text-[var(--color-brand-primary)] transition-colors px-4 py-2 border border-white/10 rounded-lg hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/10"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg> Back to Dashboard</a></header> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="py-20">`);
		BrandLoading($$renderer, { message: "Compiling Standings..." });
		$$renderer.push(`<!----></div>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };
