import { h as base } from "../../../chunks/environment.js";
import { X as escape_html, Y as attr, a as derived, d as stringify, o as ensure_array_like, r as attr_style, s as head } from "../../../chunks/dev.js";
import "../../../chunks/paths.js";
import "../../../chunks/navigation.js";
import "../../../chunks/state.js";
import "../../../chunks/supabase.js";
import { t as BrandLogo } from "../../../chunks/BrandLogo.js";
import { t as TeamIcon } from "../../../chunks/TeamIcon.js";
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
			const elapsed = now - new Date(scheduledTime).getTime();
			const diff = Math.abs(elapsed);
			const h = Math.floor(diff / 36e5);
			const m = Math.floor(diff % 36e5 / 6e4);
			const s = Math.floor(diff % 6e4 / 1e3);
			const countdown = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
			if (states === "PREVIEW" || !states && elapsed < 0) {
				if (elapsed >= 0) return {
					state: null,
					tick: 0,
					status: `Awaiting Broadcast...`,
					isPreview: true
				};
				return {
					state: null,
					tick: 0,
					status: `Starts in ${countdown}`,
					isPreview: true
				};
			}
			if (!states || states.length === 0) return null;
			if (elapsed < 0) return {
				state: states[0],
				tick: 0,
				status: `Starts in ${countdown}`
			};
			const tickRate = config?.tickRateMs || DEFAULT_TICK_RATE;
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
		$$renderer.push(`<div class="multiview-container flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] font-sans svelte-13zclnn"><main class="flex-1 flex flex-col relative h-full"><header class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 pointer-events-none"><div class="flex items-center gap-4 pointer-events-auto"><a${attr("href", `${stringify(base)}/`)} class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/40 text-white/40 backdrop-blur-xl transition-all hover:border-[var(--color-brand-primary)]/30 hover:text-[var(--color-brand-primary)] shadow-lg" aria-label="Back to Dashboard"><svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></a> <div class="flex items-center gap-3 px-5 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/5 shadow-xl">`);
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
			$$renderer.push(`<div class="multiview-grid w-full mx-auto svelte-13zclnn"><!--[-->`);
			const each_array = ensure_array_like(selectedMatches());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let match = each_array[$$index];
				const liveData = getLiveState(match.id, match.scheduled_time, match.seasons?.protocol_config ?? match.leagues?.protocol_config);
				const playSpeed = match.seasons?.protocol_config?.tickRateMs ?? match.leagues?.protocol_config?.tickRateMs ?? DEFAULT_TICK_RATE;
				const returnUrl = encodeURIComponent(`${base}/multiview?m=${Array.from(selectedMatchIds).join(",")}`);
				$$renderer.push(`<a${attr("href", `${stringify(base)}/match/${stringify(match.id)}?returnTo=${stringify(returnUrl)}`)} class="multiview-card group relative flex flex-col rounded-2xl border border-white/5 bg-black/40 shadow-2xl overflow-hidden transition-all hover:scale-[1.01] hover:border-[var(--color-brand-primary)]/50 hover:shadow-[0_0_40px_rgba(5,150,105,0.2)] svelte-13zclnn"><div class="w-full pt-2 flex flex-col items-center bg-black/20 gap-1 px-6 pointer-events-none z-20">`);
				if (liveData) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5 shadow-sm"><div class="flex items-center gap-2">`);
					if (liveData.status === "Live") {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span> <span class="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em]">Live</span></div> <div class="w-px h-2 bg-white/10"></div> <span class="text-[9px] font-black tabular-nums text-white/70 uppercase tracking-widest">Tick ${escape_html(liveData.tick)}</span>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<span class="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">${escape_html(liveData.status)}</span>`);
					}
					$$renderer.push(`<!--]--></div></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="flex items-center gap-0.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-1 shadow-2xl"><div class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"${attr_style(`background-color: ${stringify(match.home_team.color)}11`)}>`);
				TeamIcon($$renderer, {
					teamName: match.home_team.name,
					color: match.home_team.color,
					size: "size-5"
				});
				$$renderer.push(`<!----> <span class="text-sm font-black tabular-nums"${attr_style(`color: ${stringify(match.home_team.color)}`)}>${escape_html(liveData?.state?.teams.A.score ?? 0)}</span></div> <div class="w-px h-6 bg-white/10 mx-0.5"></div> <div class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"${attr_style(`background-color: ${stringify(match.away_team.color)}11`)}><span class="text-sm font-black tabular-nums"${attr_style(`color: ${stringify(match.away_team.color)}`)}>${escape_html(liveData?.state?.teams.B.score ?? 0)}</span> `);
				TeamIcon($$renderer, {
					teamName: match.away_team.name,
					color: match.away_team.color,
					size: "size-5"
				});
				$$renderer.push(`<!----></div></div></div> <div class="game-render-area w-full relative bg-black/20 flex items-center justify-center p-6 pt-2 svelte-13zclnn"><div class="w-full aspect-square flex items-center justify-center pointer-events-none max-h-full">`);
				if (liveData && liveData.state) {
					$$renderer.push("<!--[0-->");
					ReplayGrid($$renderer, {
						primaryState: liveData.state,
						playSpeed,
						showControlMap: false
					});
				} else if (liveData?.isPreview) {
					$$renderer.push("<!--[1-->");
					$$renderer.push(`<div class="flex flex-col items-center gap-8 text-center"><div class="flex items-center gap-12"><div class="flex flex-col items-center gap-3">`);
					TeamIcon($$renderer, {
						teamName: match.home_team.name,
						color: match.home_team.color,
						size: "size-16"
					});
					$$renderer.push(`<!----> <div class="text-[10px] font-black uppercase tracking-widest text-white/40">${escape_html(match.home_team.name)}</div></div> <div class="text-2xl font-black text-white/10 tracking-tighter italic">VS</div> <div class="flex flex-col items-center gap-3">`);
					TeamIcon($$renderer, {
						teamName: match.away_team.name,
						color: match.away_team.color,
						size: "size-16"
					});
					$$renderer.push(`<!----> <div class="text-[10px] font-black uppercase tracking-widest text-white/40">${escape_html(match.away_team.name)}</div></div></div> <div class="space-y-1"><div class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-primary)]">Match Preview</div> <div class="text-2xl font-black text-white tabular-nums tracking-tight">${escape_html(liveData.status.replace("Starts in ", ""))}</div></div></div>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div class="flex flex-col items-center gap-4"><div class="h-12 w-12 rounded-full border-4 border-white/5 border-t-[var(--color-brand-primary)] animate-spin"></div> <div class="text-[10px] font-black uppercase tracking-widest text-white/20">Preparing Simulation...</div></div>`);
				}
				$$renderer.push(`<!--]--></div></div> <div class="absolute top-6 right-6 z-30 flex flex-row gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-8px] group-hover:translate-y-0 pointer-events-none"><button class="p-2 rounded-lg bg-black/60 text-white/40 hover:text-rose-400 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 transition-all shadow-lg pointer-events-auto" title="Remove from Multiview"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button> <div class="p-2 rounded-lg bg-[var(--color-brand-primary)] text-black shadow-lg shadow-[var(--color-brand-primary)]/20"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg></div></div></a>`);
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
