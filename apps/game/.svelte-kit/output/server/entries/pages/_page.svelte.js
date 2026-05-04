import { G as attr, K as escape_html, c as head, f as stringify, s as ensure_array_like } from "../../chunks/index-server.js";
import { d as base } from "../../chunks/environment.js";
import "../../chunks/paths.js";
import "../../chunks/supabase.js";
import { t as BrandLogo } from "../../chunks/BrandLogo.js";
import "../../chunks/registry.js";
import { t as BrandLoading } from "../../chunks/BrandLoading.js";
import "../../chunks/simulation.js";
//#region src/lib/components/dashboard/LeagueTicker.svelte
function LeagueTicker($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let events = [];
		$$renderer.push(`<div class="relative flex overflow-x-hidden border-b border-white/10 bg-black/40 py-2 text-sm svelte-1n0qmju"><div class="animate-marquee whitespace-nowrap text-[var(--color-brand-secondary)]/70 svelte-1n0qmju"><!--[-->`);
		const each_array = ensure_array_like(events);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let event = each_array[$$index];
			$$renderer.push(`<span class="mx-8 inline-flex items-center gap-2 svelte-1n0qmju">`);
			BrandLogo($$renderer, { size: "size-4" });
			$$renderer.push(`<!----> ${escape_html(event)}</span>`);
		}
		$$renderer.push(`<!--]--></div> <div class="absolute top-2 animate-marquee2 whitespace-nowrap text-[var(--color-brand-secondary)]/70 svelte-1n0qmju"><!--[-->`);
		const each_array_1 = ensure_array_like(events);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let event = each_array_1[$$index_1];
			$$renderer.push(`<span class="mx-8 inline-flex items-center gap-2 svelte-1n0qmju">`);
			BrandLogo($$renderer, { size: "size-4" });
			$$renderer.push(`<!----> ${escape_html(event)}</span>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/lib/components/dashboard/StandingsBoard.svelte
function StandingsBoard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<div class="flex flex-col gap-4"><div class="flex items-center justify-between border-b border-[var(--color-brand-secondary)]/10 pb-2"><h2 class="text-xl font-bold tracking-tight text-[var(--color-brand-secondary)] flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-brand-primary)]"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg> ${escape_html("Standings")}</h2> <a href="/leaderboard" class="text-sm font-semibold tracking-wider uppercase text-[var(--color-brand-secondary)]/50 hover:text-[var(--color-brand-primary)] transition-colors">Full Leaderboard</a></div> <div class="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">`);
		{
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(Array(6));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				each_array[$$index];
				$$renderer.push(`<div class="h-20 animate-pulse rounded-xl border border-[var(--color-brand-secondary)]/10 bg-[var(--color-brand-secondary)]/5"></div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/lib/components/dashboard/MatchFeed.svelte
function MatchFeed($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<div class="flex flex-col gap-12">`);
		$$renderer.push("<!--[0-->");
		BrandLoading($$renderer, { message: "Synchronizing Match Feed..." });
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let featuredMatch = null;
		head("1uha8ag", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Maintainer One | Command Center</title>`);
			});
		});
		LeagueTicker($$renderer, {});
		$$renderer.push(`<!----> <main data-component="dashboard" class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8"><header class="flex flex-col md:flex-row items-center justify-between gap-6 mb-12"><div class="flex items-center gap-5 px-5 py-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-xl">`);
		BrandLogo($$renderer, { size: "size-12" });
		$$renderer.push(`<!----> <div class="flex flex-col"><h1 class="text-white text-3xl font-black tracking-tighter leading-none flex items-center gap-2"><span class="text-[var(--color-brand-secondary)]">COMMAND</span> <span class="text-[var(--color-brand-primary)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">CENTER</span></h1> <p class="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em] mt-1">Live Dashboard</p></div></div> <div class="flex items-center gap-3"><a${attr("href", `${stringify(base)}/schedule`)} class="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-black rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest">Schedule</a> <a${attr("href", `${stringify(base)}/team/exhibition`)} class="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-black rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest">Practice</a> <a${attr("href", `${stringify(base)}/film-room`)} class="px-6 py-3 bg-[var(--color-brand-secondary)] text-[var(--color-background-dark)] font-black rounded-xl shadow-lg shadow-black/20 hover:scale-105 transition-all text-sm uppercase tracking-tighter">Film Room</a> <a${attr("href", `${stringify(base)}/multiview`)} class="px-6 py-3 bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-500/20 hover:scale-105 transition-all text-sm uppercase tracking-tighter flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-white animate-pulse"></span> Multiview</a> <div class="relative group"><button class="p-3 bg-white/5 border border-white/10 text-white/20 rounded-xl group-hover:text-[var(--color-brand-primary)] group-hover:border-[var(--color-brand-primary)]/30 transition-all flex items-center justify-center" title="Admin Panel"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></button> <div class="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"><a${attr("href", `${stringify(base)}/admin/league`)} class="block px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-colors">League Admin</a> <a${attr("href", `${stringify(base)}/admin/authority`)} class="block px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]/60 hover:bg-[var(--color-brand-primary)]/10 hover:text-[var(--color-brand-primary)] transition-colors border-t border-white/5">Platform Authority</a></div></div></div></header> <div class="grid grid-cols-1 gap-8 lg:grid-cols-12"><div class="lg:col-span-4 xl:col-span-3"><div class="sticky top-8">`);
		StandingsBoard($$renderer, {});
		$$renderer.push(`<!----></div></div> <div class="lg:col-span-8 xl:col-span-9 flex flex-col gap-8"><div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-8 shadow-2xl"><div class="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--color-brand-primary)]/10 to-[var(--color-brand-secondary)]/10 opacity-50 blur-xl transition duration-1000 group-hover:opacity-100"></div> <div class="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between"><div><div class="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-3 py-1 text-[10px] font-black tracking-[0.1em] text-[var(--color-brand-secondary)] uppercase"><span class="h-2 w-2 animate-pulse rounded-full bg-[var(--color-brand-primary)]"></span> ${escape_html(featuredMatch?.status === "played" || featuredMatch?.status === "simulated" ? "Latest Match" : "Upcoming Match")}</div> <h2 class="text-4xl font-black text-white tracking-tighter">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`League <span class="text-[var(--color-brand-secondary)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] mx-2">VS</span> Arena`);
		$$renderer.push(`<!--]--></h2> <p class="mt-2 max-w-md text-sm text-white/70 font-medium leading-relaxed">${escape_html("No active season. Create one in the admin panel to get started.")}</p></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<a${attr("href", `${stringify(base)}/admin/league`)} class="mt-4 flex items-center justify-center rounded-xl bg-[var(--color-brand-secondary)] px-8 py-4 font-black text-[var(--color-background-dark)] shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95 md:mt-0">Create Season <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></a>`);
		$$renderer.push(`<!--]--></div></div> `);
		MatchFeed($$renderer, {});
		$$renderer.push(`<!----></div></div></main>`);
	});
}
//#endregion
export { _page as default };
