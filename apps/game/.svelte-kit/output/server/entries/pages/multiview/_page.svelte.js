import { G as attr, K as escape_html, a as attr_style, c as head, f as stringify, o as derived, s as ensure_array_like } from "../../../chunks/index-server.js";
import { d as base } from "../../../chunks/environment.js";
import "../../../chunks/paths.js";
import "../../../chunks/state.js";
import "../../../chunks/supabase.js";
import { t as BrandLogo } from "../../../chunks/BrandLogo.js";
import "../../../chunks/simulation.js";
import { t as ReplayGrid } from "../../../chunks/ReplayGrid.js";
//#region src/routes/multiview/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let availableMatches = [];
		let selectedMatchIds = /* @__PURE__ */ new Set();
		let matchSims = {};
		let now = Date.now();
		const DEFAULT_TICK_RATE = 750;
		function getLiveState(matchId, scheduledTime, config) {
			const states = matchSims[matchId];
			if (!states || states.length === 0) return null;
			const tickRate = config?.tickRateMs || DEFAULT_TICK_RATE;
			const elapsed = now - new Date(scheduledTime).getTime();
			if (elapsed < 0) {
				const diff = Math.abs(elapsed);
				const h = Math.floor(diff / 36e5);
				const m = Math.floor(diff % 36e5 / 6e4);
				const s = Math.floor(diff % 6e4 / 1e3);
				const status = h > 0 ? `Starts in ${h}h ${m}m ${s}s` : `Starts in ${m}m ${s}s`;
				return {
					state: states[0],
					tick: 0,
					status
				};
			}
			const tick = Math.floor(elapsed / tickRate);
			const maxTick = states.length - 1;
			if (tick >= maxTick) return {
				state: states[maxTick],
				tick: maxTick,
				status: "Final"
			};
			return {
				state: states[tick],
				tick,
				status: "Live"
			};
		}
		let selectedMatches = derived(() => availableMatches.filter((m) => selectedMatchIds.has(m.id)));
		head("13zclnn", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Maintainer One | Multiview</title>`);
			});
		});
		$$renderer.push(`<div class="flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] font-sans"><main class="flex-1 flex flex-col relative h-full"><header class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 pointer-events-none"><div class="flex items-center gap-4 pointer-events-auto"><a${attr("href", `${stringify(base)}/`)} class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/40 text-white/40 backdrop-blur-xl transition-all hover:border-[var(--color-brand-primary)]/30 hover:text-[var(--color-brand-primary)] shadow-lg" aria-label="Back to Dashboard"><svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></a> <div class="flex items-center gap-3 px-5 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/5 shadow-xl">`);
		BrandLogo($$renderer, { size: "size-6" });
		$$renderer.push(`<!----> <h1 class="text-white text-lg font-black tracking-tighter uppercase flex gap-2">Live <span class="text-[var(--color-brand-primary)] drop-shadow-[0_0_10px_rgba(5,150,105,0.5)]">Multiview</span></h1></div></div> <div class="pointer-events-auto"><button class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)] text-xs font-black uppercase tracking-widest hover:bg-[var(--color-brand-primary)]/20 transition-all shadow-lg backdrop-blur-xl"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Manage Games (${escape_html(selectedMatchIds.size)})</button></div></header> <div class="flex-1 p-6 pt-24 overflow-y-auto overflow-x-hidden relative">`);
		if (selectedMatches().length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">`);
			BrandLogo($$renderer, {
				size: "size-24",
				class: "opacity-10 grayscale mb-6"
			});
			$$renderer.push(`<!----> <h2 class="text-2xl font-black text-white/20 uppercase tracking-widest">No Games Selected</h2> <p class="text-sm text-white/10 font-bold mt-2">Open the menu to add games to your view</p> <button class="mt-8 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all pointer-events-auto">Browse Matches</button></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="grid gap-6 auto-rows-fr max-w-screen-2xl mx-auto h-full"${attr_style(`grid-template-columns: repeat(auto-fit, minmax(${stringify(selectedMatches().length <= 4 ? "400px" : "300px")}, 1fr));`)}><!--[-->`);
			const each_array = ensure_array_like(selectedMatches());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let match = each_array[$$index];
				const liveData = getLiveState(match.id, match.scheduled_time, match.seasons?.protocol_config ?? match.leagues?.protocol_config);
				const playSpeed = match.seasons?.protocol_config?.tickRateMs ?? match.leagues?.protocol_config?.tickRateMs ?? DEFAULT_TICK_RATE;
				const returnUrl = encodeURIComponent(`${base}/multiview?m=${Array.from(selectedMatchIds).join(",")}`);
				$$renderer.push(`<a${attr("href", `${stringify(base)}/match/${stringify(match.id)}?returnTo=${stringify(returnUrl)}`)} class="group relative flex flex-col rounded-3xl border border-white/5 bg-black/40 shadow-2xl overflow-hidden transition-all hover:scale-[1.02] hover:border-[var(--color-brand-primary)]/30 hover:shadow-[0_0_30px_rgba(5,150,105,0.15)]"><div class="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none"><div class="flex items-center gap-3"><div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10"><span class="text-sm font-black"${attr_style(`color: ${stringify(match.home_team.color)}`)}>${escape_html(liveData?.state?.teams.A.score ?? 0)}</span> <span class="text-white/20 text-[10px]">-</span> <span class="text-sm font-black"${attr_style(`color: ${stringify(match.away_team.color)}`)}>${escape_html(liveData?.state?.teams.B.score ?? 0)}</span></div></div> <div class="flex flex-col items-end gap-1"><div class="flex gap-2"><div class="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black tracking-widest"${attr_style(`color: ${stringify(match.home_team.color)}`)}>${escape_html(match.home_team.name)}</div> <div class="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black tracking-widest"${attr_style(`color: ${stringify(match.away_team.color)}`)}>${escape_html(match.away_team.name)}</div></div> `);
				if (liveData) {
					$$renderer.push("<!--[0-->");
					if (liveData.status === "Live") {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md"><span class="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span> Tick ${escape_html(liveData.tick)}</div>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<div class="px-2 py-1 rounded-md bg-white/10 text-white/40 border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md">${escape_html(liveData.status)}</div>`);
					}
					$$renderer.push(`<!--]-->`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div class="px-2 py-1 rounded-md bg-white/10 text-white/40 border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md animate-pulse">Loading...</div>`);
				}
				$$renderer.push(`<!--]--></div></div> <div class="flex-1 relative bg-black/20 flex items-center justify-center p-4">`);
				if (liveData && liveData.state) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="w-full aspect-square pointer-events-none max-h-full">`);
					ReplayGrid($$renderer, {
						state: liveData.state,
						playSpeed,
						showControlMap: false
					});
					$$renderer.push(`<!----></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div> <div class="absolute inset-0 bg-[var(--color-brand-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20 backdrop-blur-[1px]"><div class="px-6 py-3 rounded-xl bg-[var(--color-brand-primary)] text-black font-black uppercase tracking-widest text-xs shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Enter Match</div></div> <button class="absolute bottom-4 right-4 z-30 p-2 rounded-xl bg-black/60 text-white/40 hover:text-rose-400 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0" title="Remove from Multiview"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></a>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div></main> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };
