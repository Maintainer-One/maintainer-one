import { G as attr, K as escape_html, a as attr_style, f as stringify, i as attr_class, o as derived, s as ensure_array_like } from "../../../chunks/index-server.js";
import "../../../chunks/modal.js";
import "../../../chunks/paths.js";
import "../../../chunks/state.js";
import "../../../chunks/supabase.js";
import { t as getProtocol } from "../../../chunks/registry.js";
import "../../../chunks/sim.worker.js";
import "../../../chunks/core.js";
import { t as ReplayGrid } from "../../../chunks/ReplayGrid.js";
import "../../../chunks/scratchpad.js";
//#region src/lib/components/StateInspector.svelte
function StateInspector_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data, label = "sense" } = $$props;
		function isObject(val) {
			return val !== null && typeof val === "object";
		}
		$$renderer.push(`<div class="font-mono text-[10px]"><button class="flex items-center gap-1.5 py-1 text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)] transition-colors"><span${attr_class(`text-[8px] transition-transform ${stringify("rotate-90")}`)}>▶</span> <span class="font-black uppercase tracking-tighter">${escape_html(label)}</span> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></button> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="ml-3 border-l border-white/5 pl-3 space-y-0.5">`);
		if (isObject(data)) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(Object.entries(data));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let [key, value] = each_array[$$index];
				if (isObject(value)) {
					$$renderer.push("<!--[0-->");
					StateInspector_1($$renderer, {
						data: value,
						label: key
					});
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div class="flex items-baseline gap-2 py-0.5"><span class="text-white/30">${escape_html(key)}:</span> <span class="text-[var(--color-brand-secondary)] font-bold">${escape_html(typeof value === "string" ? `"${value}"` : value)}</span></div>`);
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="text-[var(--color-brand-secondary)] font-bold">${escape_html(data)}</div>`);
		}
		$$renderer.push(`<!--]--></div>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/routes/film-room/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let replays = [];
		let selectedReplayId = null;
		let states = [];
		let currentTick = 0;
		let showControlMap = false;
		let baseTickRate = 750;
		let playSpeed = 750;
		let branchTick = null;
		let asideWidth = 450;
		let activeTab = "A";
		let teamCodes = {
			A: "",
			B: ""
		};
		derived(() => activeTab === "REF" ? "" : teamCodes[activeTab]);
		let currentState = derived(() => states[currentTick]);
		let currentProtocol = derived(() => currentState() ? getProtocol(currentState().protocolVersion) : null);
		let currentMatch = derived(() => replays.find((r) => r.id === selectedReplayId));
		$$renderer.push(`<div class="flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 selection:bg-[var(--color-brand-primary)]/30 font-sans"><aside class="flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl"${attr_style(`width: ${stringify(asideWidth)}px`)}><header class="flex h-20 flex-col border-b border-white/5 px-6 pt-4"><div class="mb-2 flex items-center justify-between"><h2 class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-primary)]">Logic Editor</h2> <div class="flex items-center gap-3">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<button class="rounded-lg bg-[var(--color-brand-primary)]/10 px-3 py-1 text-[10px] font-black text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 transition-colors uppercase tracking-wider">Publish</button>`);
		$$renderer.push(`<!--]--></div></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="flex gap-6"><button${attr_class(`pb-2 text-[10px] font-black uppercase tracking-widest transition-all ${stringify(activeTab === "A" ? "border-b-2 text-white" : "text-white/20 hover:text-white/40")}`)}${attr_style(activeTab === "A" ? `border-color: ${currentMatch()?.home_team?.color || "#3b82f6"}` : "")}>${escape_html(currentMatch()?.home_team?.name || "Home")}</button> <button${attr_class(`pb-2 text-[10px] font-black uppercase tracking-widest transition-all ${stringify(activeTab === "B" ? "border-b-2 text-white" : "text-white/20 hover:text-white/40")}`)}${attr_style(activeTab === "B" ? `border-color: ${currentMatch()?.away_team?.color || "#f43f5e"}` : "")}>${escape_html(currentMatch()?.away_team?.name || "Away")}</button> <button${attr_class(`pb-2 text-[10px] font-black uppercase tracking-widest transition-all ${stringify(activeTab === "REF" ? "border-b-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]" : "text-white/20 hover:text-white/40")}`)}>Reference</button></div></header> <div class="flex-1 overflow-y-auto no-scrollbar p-4 svelte-158rvpt">`);
		if (activeTab === "REF") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="space-y-8 p-2"><section class="space-y-4"><h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Protocol Reference</h3> <div class="space-y-4"><div class="rounded-2xl border border-white/5 bg-black/40 p-5"><div class="mb-2 text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-wider">SensedState</div> <pre class="text-[10px] leading-relaxed text-[var(--color-brand-secondary)]/40"><code>{
  tick: number,
  players: Player[],
  pointZone: PointZone,
  teams: { A, B }
}</code></pre></div> <div class="rounded-2xl border border-white/5 bg-black/40 p-5"><div class="mb-2 text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-wider">Player</div> <pre class="text-[10px] leading-relaxed text-[var(--color-brand-secondary)]/40"><code>{
  id: string,
  team: 'A' | 'B',
  position: { x, y },
  status: 'active' | 'stunned' | 'knocked_out',
  stunTicks?: number
}</code></pre></div> <div class="rounded-2xl border border-white/5 bg-black/40 p-5"><div class="mb-2 text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-wider">Action</div> <pre class="text-[10px] leading-relaxed text-[var(--color-brand-secondary)]/40"><code>{
  playerId: string,
  type: 'MOVE' | 'STAY',
  direction?: 'UP' | 'DOWN' | ...
}</code></pre></div></div></section> <section class="rounded-2xl border border-[var(--color-brand-primary)]/10 bg-[var(--color-brand-primary)]/5 p-5">`);
			if (currentProtocol()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<h3 class="mb-2 text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">${escape_html(currentProtocol().name)}</h3> <p class="text-xs leading-relaxed text-[var(--color-brand-secondary)]/50 font-medium whitespace-pre-wrap">${escape_html(currentProtocol().description)}</p>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<h3 class="mb-2 text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">About Protocol</h3> <p class="text-xs leading-relaxed text-[var(--color-brand-secondary)]/50 font-medium animate-pulse">Loading protocol data...</p>`);
			}
			$$renderer.push(`<!--]--></section></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div> <footer class="border-t border-white/5 p-4 text-[10px] text-white/20 font-medium italic">* Editing code will branch the simulation from the current tick.</footer></aside> <div class="w-1 cursor-col-resize bg-zinc-800/50 transition-colors hover:bg-emerald-500/50 active:bg-emerald-500" role="separator"></div> <main class="flex flex-1 flex-col p-6 lg:p-10 bg-[var(--color-background-dark)]"><header class="mb-12 flex items-center justify-between"><div class="flex items-center gap-8"><div class="inline-flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl"><div class="flex items-center gap-4"><button class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md" aria-label="Go Back"><svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></button> <div class="flex flex-col"><h1 class="text-xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">Film <span class="text-[var(--color-brand-primary)]">Room</span></h1> <p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Replay &amp; Branching</p></div></div></div></div> <div class="flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border border-white/5 shadow-xl backdrop-blur-md"><span class="h-1.5 w-1.5 rounded-full animate-pulse bg-[var(--color-brand-primary)] shadow-[0_0_8px_var(--color-brand-primary)]"></span> Live Analysis</div></header> `);
		if (currentState()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden min-h-0"><div class="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden p-4">`);
			ReplayGrid($$renderer, {
				state: currentState(),
				playSpeed,
				showControlMap
			});
			$$renderer.push(`<!----></div> <div class="w-full max-w-3xl space-y-5 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-2xl"><div class="flex items-center gap-6"><div class="flex items-center gap-3"><button aria-label="Previous Tick" class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white active:scale-90 border border-white/5"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg></button> <button${attr("aria-label", "Play")} class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] transition-all hover:scale-110 active:scale-95 shadow-lg shadow-[var(--color-brand-primary)]/20">`);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<svg class="h-6 w-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`);
			$$renderer.push(`<!--]--></button> <button aria-label="Next Tick" class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white active:scale-90 border border-white/5"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg></button></div> <div class="relative flex-1 group"><input type="range" min="0"${attr("max", states.length - 1)}${attr("value", currentTick)} class="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/5 accent-[var(--color-brand-primary)] svelte-158rvpt"/> `);
			if (branchTick !== null) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)] pointer-events-none"${attr_style(`left: ${stringify(branchTick / (states.length - 1) * 100)}%`)} title="Simulation Branch Point"></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="flex items-center gap-2 relative"><button${attr_class(`rounded-xl border border-white/5 bg-black/40 px-4 py-2 text-[10px] font-black uppercase transition-all ${stringify("text-white/40 hover:text-white")} outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] min-w-[120px]`)}>Map: ${escape_html("Hidden")}</button> <button class="rounded-xl border border-white/5 bg-black/40 px-4 py-2 text-[10px] font-black uppercase text-[var(--color-brand-secondary)] outline-none hover:bg-black/60 focus:ring-1 focus:ring-[var(--color-brand-primary)] min-w-[75px] flex items-center justify-between gap-2"><span>${escape_html(playSpeed > baseTickRate ? "0.5x" : playSpeed === baseTickRate ? "1.0x" : playSpeed > baseTickRate / 3 ? "2.0x" : "MAX")}</span> <svg${attr_class(`h-3 w-3 opacity-30 transition-transform ${stringify("")}`)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></div></div></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="flex flex-1 items-center justify-center italic text-white/20 font-black uppercase tracking-widest text-sm"><span class="animate-pulse">Decoding replay buffer...</span></div>`);
		}
		$$renderer.push(`<!--]--></main> <aside class="flex w-80 flex-col border-l border-white/5 bg-black/20 p-6 backdrop-blur-3xl lg:p-8"><div class="mb-10 relative"><label class="mb-3 block text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">Match Library</label> <button class="w-full flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-black text-[var(--color-brand-secondary)] outline-none hover:bg-black/60 transition-all group"><span>`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`Select a match`);
		$$renderer.push(`<!--]--></span> <svg${attr_class(`h-4 w-4 transition-transform duration-300 ${stringify("")} text-white/20 group-hover:text-[var(--color-brand-primary)]`)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <div class="flex-1 flex flex-col min-h-0 space-y-6"><section class="space-y-4 flex-shrink-0"><h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Match Analysis</h3> <div class="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-inner"><div class="mb-1 text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-wider">Elapsed Ticks</div> <div class="text-3xl font-black tracking-tighter text-white">${escape_html(currentTick)} <span class="text-white/10">/ ${escape_html(states.length - 1)}</span></div></div> <div class="grid grid-cols-2 gap-3"><div class="rounded-2xl border bg-black/20 p-4 shadow-inner"${attr_style(`border-color: ${stringify(currentState()?.teams.A.color)}22`)}><div class="mb-1 text-[9px] font-black uppercase tracking-wider"${attr_style(`color: ${stringify(currentState()?.teams.A.color)}`)}>${escape_html(currentState()?.teams.A.name)}</div> <div class="text-2xl font-black text-white">${escape_html(currentState()?.teams.A.score ?? 0)}</div> <div class="mt-2 text-[8px] font-black text-white/10 uppercase tracking-widest">Avg ${escape_html(currentState()?.teams.A.stats.averagePointsPerCapture.toFixed(2))} pts/cap</div></div> <div class="rounded-2xl border bg-black/20 p-4 shadow-inner"${attr_style(`border-color: ${stringify(currentState()?.teams.B.color)}22`)}><div class="mb-1 text-[9px] font-black uppercase tracking-wider"${attr_style(`color: ${stringify(currentState()?.teams.B.color)}`)}>${escape_html(currentState()?.teams.B.name)}</div> <div class="text-2xl font-black text-white">${escape_html(currentState()?.teams.B.score ?? 0)}</div> <div class="mt-2 text-[8px] font-black text-white/10 uppercase tracking-widest">Avg ${escape_html(currentState()?.teams.B.stats.averagePointsPerCapture.toFixed(2))} pts/cap</div></div></div></section> <section class="flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--color-brand-primary)]/10 bg-[var(--color-brand-primary)]/5 p-5"><div class="mb-4 flex items-center justify-between flex-shrink-0"><h4 class="text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Live Data</h4> <span class="text-[8px] font-bold text-[var(--color-brand-primary)]/40 uppercase tracking-widest">Tick ${escape_html(currentTick)}</span></div> <div class="flex-1 overflow-y-auto no-scrollbar svelte-158rvpt">`);
		if (currentState()) {
			$$renderer.push("<!--[0-->");
			StateInspector_1($$renderer, { data: currentState() });
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></section></div></aside></div>`);
	});
}
//#endregion
export { _page as default };
