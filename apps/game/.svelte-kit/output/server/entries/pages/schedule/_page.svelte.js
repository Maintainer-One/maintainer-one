import { G as attr, K as escape_html, f as stringify, o as derived, s as ensure_array_like } from "../../../chunks/index-server.js";
import { d as base } from "../../../chunks/environment.js";
import "../../../chunks/paths.js";
import "../../../chunks/supabase.js";
//#region src/routes/schedule/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let seasons = [];
		let selectedSeasonId = null;
		let matches = [];
		derived(() => {
			const groups = {};
			matches.forEach((m) => {
				const day = new Date(m.scheduled_time).toLocaleDateString([], {
					weekday: "long",
					month: "long",
					day: "numeric"
				});
				if (!groups[day]) groups[day] = [];
				groups[day].push(m);
			});
			return Object.entries(groups);
		});
		$$renderer.push(`<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 p-8 lg:p-12 font-sans selection:bg-[var(--color-brand-primary)]/30"><header class="mb-12 flex items-center justify-between max-w-5xl mx-auto"><div class="flex items-center gap-8"><div class="inline-flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl"><div class="flex items-center gap-4"><a${attr("href", `${stringify(base)}/`)} aria-label="Go back" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] shadow-lg"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></a> <div class="flex flex-col"><h1 class="text-2xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">League <span class="text-[var(--color-brand-primary)]">Schedule</span></h1> <p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Season Playback</p></div></div></div></div> <div class="flex items-center gap-4">`);
		if (seasons.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex flex-col items-end"><label for="season-select" class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Select Season</label> `);
			$$renderer.select({
				id: "season-select",
				value: selectedSeasonId,
				onchange: () => selectedSeasonId,
				class: "bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50 transition-all appearance-none cursor-pointer pr-10"
			}, ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(seasons);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let season = each_array[$$index];
					$$renderer.option({ value: season.id }, ($$renderer) => {
						$$renderer.push(`Season ${escape_html(season.season_number)}: ${escape_html(season.name)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			}, "svelte-19rgvlq");
			$$renderer.push(`</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></header> <div class="max-w-5xl mx-auto space-y-12">`);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="flex flex-col items-center justify-center py-32 space-y-6"><div class="h-12 w-12 border-4 border-[var(--color-brand-primary)]/10 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div> <p class="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Syncing Calendar...</p></div>`);
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
export { _page as default };
