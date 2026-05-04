import { G as attr, K as escape_html, a as attr_style, f as stringify, i as attr_class, o as derived, s as ensure_array_like } from "../../../../chunks/index-server.js";
import { d as base } from "../../../../chunks/environment.js";
import "../../../../chunks/paths.js";
import "../../../../chunks/client.js";
import "../../../../chunks/supabase.js";
import "../../../../chunks/sim.worker.js";
import "../../../../chunks/scratchpad.js";
//#region src/routes/team/exhibition/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let teams = [];
		let selectedTeamA = null;
		let selectedTeamB = null;
		let versionsA = [];
		let versionsB = [];
		let selectedVersionA = null;
		let selectedVersionB = null;
		let matchSeed = Math.floor(Math.random() * 1e6).toString();
		let isSimulating = false;
		let teamA = derived(() => teams.find((t) => t.id === selectedTeamA));
		let teamB = derived(() => teams.find((t) => t.id === selectedTeamB));
		$$renderer.push(`<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 p-8 lg:p-12 font-sans selection:bg-[var(--color-brand-primary)]/30"><header class="mb-12 flex items-center justify-between"><div class="flex items-center gap-8"><div class="inline-flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl"><div class="flex items-center gap-4"><a${attr("href", `${stringify(base)}/`)} aria-label="Go back" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md"><svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></a> <div class="flex flex-col"><h1 class="text-2xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">Exhibition <span class="text-[var(--color-brand-primary)]">Room</span></h1> <p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Practice &amp; Calibration</p></div></div></div></div> <div class="flex items-center gap-4"><div class="flex flex-col items-end"><label for="seed" class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Match Seed</label> <div class="flex items-center gap-2"><input id="seed" type="text"${attr("value", matchSeed)} class="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--color-brand-primary)] focus:outline-none focus:border-[var(--color-brand-primary)]/50 transition-colors w-32"/> <button class="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white transition-colors" title="Randomize Seed"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button></div></div></div></header> <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto"><div class="space-y-6"><div class="flex items-center gap-3"><div class="h-8 w-1.5 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"${attr_style(`background-color: ${stringify(teamA()?.color || "#3b82f6")}`)}></div> <h2 class="text-xs font-black uppercase tracking-[0.2em]"${attr_style(`color: ${stringify(teamA()?.color || "#3b82f6")}`)}>${escape_html(teamA()?.name || "Home Team")}</h2></div> <div class="rounded-3xl border border-white/5 bg-black/20 p-8 backdrop-blur-xl space-y-6"><div class="space-y-4"><label for="team-a-select" class="block text-[10px] font-black uppercase tracking-widest text-white/20">Select Team</label> `);
		$$renderer.select({
			id: "team-a-select",
			value: selectedTeamA,
			onchange: () => selectedTeamA,
			class: "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
		}, ($$renderer) => {
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(teams);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let team = each_array[$$index];
				$$renderer.option({ value: team.id }, ($$renderer) => {
					$$renderer.push(`${escape_html(team.name)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		}, "svelte-q4o3n0");
		$$renderer.push(`</div> <div class="space-y-4"><div class="flex items-center justify-between"><label for="version-a-select" class="block text-[10px] font-black uppercase tracking-widest text-white/20">Logic Version</label> <button${attr_class(`text-[9px] font-black uppercase tracking-widest ${stringify("text-white/40")} hover:text-blue-300 transition-colors`)}>${escape_html("Use Scratchpad")}</button></div> `);
		$$renderer.push("<!--[0-->");
		$$renderer.select({
			id: "version-a-select",
			value: selectedVersionA,
			class: "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
		}, ($$renderer) => {
			$$renderer.push(`<!--[-->`);
			const each_array_1 = ensure_array_like(versionsA);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let v = each_array_1[$$index_1];
				$$renderer.option({ value: v.id }, ($$renderer) => {
					$$renderer.push(`Version ${escape_html(v.version_number)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		}, "svelte-q4o3n0");
		$$renderer.push(`<!--]--></div></div></div> <div class="space-y-6"><div class="flex items-center gap-3 justify-end lg:justify-start"><div class="h-8 w-1.5 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.5)] lg:order-first order-last"${attr_style(`background-color: ${stringify(teamB()?.color || "#f43f5e")}`)}></div> <h2 class="text-xs font-black uppercase tracking-[0.2em]"${attr_style(`color: ${stringify(teamB()?.color || "#f43f5e")}`)}>${escape_html(teamB()?.name || "Away Team")}</h2></div> <div class="rounded-3xl border border-white/5 bg-black/20 p-8 backdrop-blur-xl space-y-6"><div class="space-y-4"><label for="team-b-select" class="block text-[10px] font-black uppercase tracking-widest text-white/20">Select Opponent</label> `);
		$$renderer.select({
			id: "team-b-select",
			value: selectedTeamB,
			onchange: () => selectedTeamB,
			class: "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer"
		}, ($$renderer) => {
			$$renderer.push(`<!--[-->`);
			const each_array_2 = ensure_array_like(teams);
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let team = each_array_2[$$index_2];
				$$renderer.option({ value: team.id }, ($$renderer) => {
					$$renderer.push(`${escape_html(team.name)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		}, "svelte-q4o3n0");
		$$renderer.push(`</div> <div class="space-y-4"><div class="flex items-center justify-between"><label for="version-b-select" class="block text-[10px] font-black uppercase tracking-widest text-white/20">Logic Version</label> <button${attr_class(`text-[9px] font-black uppercase tracking-widest ${stringify("text-white/40")} hover:text-rose-300 transition-colors`)}>${escape_html("Use Scratchpad")}</button></div> `);
		$$renderer.push("<!--[0-->");
		$$renderer.select({
			id: "version-b-select",
			value: selectedVersionB,
			class: "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer"
		}, ($$renderer) => {
			$$renderer.push(`<!--[-->`);
			const each_array_3 = ensure_array_like(versionsB);
			for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
				let v = each_array_3[$$index_3];
				$$renderer.option({ value: v.id }, ($$renderer) => {
					$$renderer.push(`Version ${escape_html(v.version_number)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		}, "svelte-q4o3n0");
		$$renderer.push(`<!--]--></div></div></div></div> <div class="mt-16 flex flex-col items-center gap-12 max-w-4xl mx-auto"><button${attr("disabled", isSimulating, true)} class="group relative px-12 py-5 rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`Run Simulation`);
		$$renderer.push(`<!--]--></button> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
export { _page as default };
