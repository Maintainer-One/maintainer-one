import { A as get, G as attr, K as escape_html, a as attr_style, f as stringify, i as attr_class, o as derived, s as ensure_array_like } from "../../../../../chunks/index-server.js";
import { d as base } from "../../../../../chunks/environment.js";
import "../../../../../chunks/index-server2.js";
import "../../../../../chunks/paths.js";
import { t as page } from "../../../../../chunks/state.js";
import "../../../../../chunks/supabase.js";
import "../../../../../chunks/sim.worker.js";
import { t as scratchpad } from "../../../../../chunks/scratchpad.js";
//#region src/routes/team/[id]/test-runner/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let teamId = derived(() => page.params.id);
		let homeTeam = null;
		let homeVersions = [];
		let selectedHomeVersionId = "scratchpad";
		let teams = [];
		let selectedOpponent = null;
		let versionsOpponent = [];
		let selectedVersionOpponent = null;
		let testIterations = 10;
		let useLockedSeeds = false;
		let isSimulating = false;
		let batchResults = [];
		let asideWidth = 500;
		function handleHomeVersionChange() {
			if (selectedHomeVersionId === "scratchpad") get(scratchpad).A;
			else {
				const version = homeVersions.find((v) => v.id === selectedHomeVersionId);
				if (version) version.source_code;
			}
		}
		let stats = derived(() => {
			if (batchResults.length === 0) return null;
			let wins = 0;
			let draws = 0;
			let totalScoreA = 0;
			let totalScoreB = 0;
			let totalLuckA = 0;
			for (const res of batchResults) {
				const scoreA = res.finalState.teams.A.score;
				const scoreB = res.finalState.teams.B.score;
				totalScoreA += scoreA;
				totalScoreB += scoreB;
				totalLuckA += res.finalState.teams.A.stats.luckScore;
				if (scoreA > scoreB) wins++;
				else if (scoreA === scoreB) draws++;
			}
			return {
				winRate: wins / batchResults.length * 100,
				drawRate: draws / batchResults.length * 100,
				avgScoreA: totalScoreA / batchResults.length,
				avgScoreB: totalScoreB / batchResults.length,
				avgLuckA: totalLuckA / batchResults.length
			};
		});
		$$renderer.push(`<div class="flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 font-sans"><aside class="flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl"${attr_style(`width: ${stringify(asideWidth)}px`)}><header class="flex h-20 items-center justify-between border-b border-white/5 px-6"><div class="flex flex-col"><div class="flex items-center gap-2 mb-1"><span class="h-1.5 w-1.5 rounded-full"${attr_style(`background-color: ${stringify(homeTeam?.color || "var(--color-brand-primary)")}`)}></span> <span class="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">${escape_html(homeTeam?.name || "Loading...")}</span></div> <h2 class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-primary)] leading-none">Logic Editor</h2> `);
		$$renderer.select({
			value: selectedHomeVersionId,
			onchange: handleHomeVersionChange,
			class: "bg-transparent border-none p-0 text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5 outline-none cursor-pointer hover:text-white/40 transition-colors"
		}, ($$renderer) => {
			$$renderer.option({
				value: "scratchpad",
				class: "bg-zinc-900"
			}, ($$renderer) => {
				$$renderer.push(`Scratchpad Logic`);
			});
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(homeVersions);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let v = each_array[$$index];
				$$renderer.option({
					value: v.id,
					class: "bg-zinc-900"
				}, ($$renderer) => {
					$$renderer.push(`V${escape_html(v.version_number)} ${escape_html(v.name ? `- ${v.name}` : "")}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		});
		$$renderer.push(`</div> <div class="flex items-center gap-4"><div class="flex flex-col items-end"><div class="flex items-center gap-2 mb-1">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<span class="text-[8px] font-black uppercase tracking-widest text-white/20">Iterations</span>`);
		$$renderer.push(`<!--]--></div> <div class="flex items-center gap-1.5"><input type="number"${attr("value", testIterations)} min="1" max="100"${attr("disabled", useLockedSeeds, true)} class="w-12 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50 disabled:opacity-50 disabled:border-emerald-500/20"/> <div class="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5"><button${attr_class(`p-1.5 rounded-md transition-all ${stringify("text-white/20 hover:text-white hover:bg-white/5")}`)}${attr("title", "Lock Current Seeds")}><svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg></button> <button class="p-1.5 rounded-md text-white/20 hover:text-white hover:bg-white/5 transition-all" title="Copy Seed List"><svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg></button> <button class="p-1.5 rounded-md text-white/20 hover:text-white hover:bg-white/5 transition-all" title="Paste Seed List"><svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg></button></div> <button${attr("disabled", isSimulating, true)} class="ml-2 rounded-xl bg-[var(--color-brand-primary)] px-6 py-2.5 text-[10px] font-black text-[var(--color-background-dark)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50">${escape_html("Run Test")}</button></div></div></div></header> <div class="flex-1 overflow-y-auto no-scrollbar p-4 svelte-1fcoz90">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></aside> <div class="w-1 cursor-col-resize bg-zinc-800/50 transition-colors hover:bg-emerald-500/50 active:bg-emerald-500"></div> <main class="flex flex-1 flex-col p-8 lg:p-12 overflow-hidden"><header class="mb-12 flex items-center justify-between flex-shrink-0"><div class="inline-flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl"><div class="flex items-center gap-4"><a${attr("href", `${stringify(base)}/team/${stringify(teamId())}`)} class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] shadow-lg"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></a> <div class="flex flex-col"><h1 class="text-xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">Test <span class="text-[var(--color-brand-primary)]">Runner</span></h1> <p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">${escape_html(homeTeam?.name || "Loading...")} HQ</p></div></div></div> <div class="flex items-center gap-6"><div class="flex flex-col items-end"><label class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Target Opponent</label> <div class="flex gap-2">`);
		$$renderer.select({
			value: selectedOpponent,
			onchange: () => selectedOpponent,
			class: "bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-rose-500/50 transition-all cursor-pointer min-w-[120px]"
		}, ($$renderer) => {
			if (teams.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.option({ value: null }, ($$renderer) => {
					$$renderer.push(`Loading Teams...`);
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--><!--[-->`);
			const each_array_1 = ensure_array_like(teams);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let team = each_array_1[$$index_1];
				$$renderer.option({ value: team.id }, ($$renderer) => {
					$$renderer.push(`${escape_html(team.name)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		});
		$$renderer.push(` `);
		$$renderer.select({
			value: selectedVersionOpponent,
			class: "bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-rose-500/50 transition-all cursor-pointer min-w-[80px]"
		}, ($$renderer) => {
			if (versionsOpponent.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.option({ value: null }, ($$renderer) => {
					$$renderer.push(`Loading...`);
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--><!--[-->`);
			const each_array_2 = ensure_array_like(versionsOpponent);
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let v = each_array_2[$$index_2];
				$$renderer.option({ value: v.id }, ($$renderer) => {
					$$renderer.push(`V${escape_html(v.version_number)} ${escape_html(v.name ? `- ${v.name}` : "")}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		});
		$$renderer.push(`</div></div></div></header> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (stats()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 flex-shrink-0"><div class="rounded-3xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl"><div class="text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] mb-2">Win Rate</div> <div class="text-4xl font-black text-white">${escape_html(stats().winRate.toFixed(1))}%</div></div> <div class="rounded-3xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl"><div class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Avg Score</div> <div class="text-2xl font-black text-white"><span class="text-blue-400">${escape_html(stats().avgScoreA.toFixed(1))}</span> <span class="text-white/10 mx-2">/</span> <span class="text-rose-400">${escape_html(stats().avgScoreB.toFixed(1))}</span></div></div> <div class="rounded-3xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl"><div class="text-[9px] font-black uppercase tracking-widest text-amber-500/60 mb-2">Avg Luck (${escape_html(homeTeam?.name || "Home")})</div> <div${attr_class(`text-2xl font-black ${stringify(stats().avgLuckA >= 0 ? "text-emerald-400" : "text-rose-400")}`)}>${escape_html(stats().avgLuckA > 0 ? "+" : "")}${escape_html(stats().avgLuckA.toFixed(2))}</div></div> <div class="rounded-3xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl"><div class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Samples</div> <div class="text-4xl font-black text-white">${escape_html(batchResults.length)}</div></div></div> <div class="flex-1 min-h-0 rounded-3xl border border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl"><div class="overflow-y-auto no-scrollbar flex-1 svelte-1fcoz90"><table class="w-full text-left border-collapse"><thead class="sticky top-0 bg-zinc-900/90 backdrop-blur-md z-10 border-b border-white/5"><tr><th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Seed</th><th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Result</th><th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20 text-center">Score</th><th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20 text-center">Luck</th><th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20 text-right">Action</th></tr></thead><tbody class="divide-y divide-white/5"><!--[-->`);
			const each_array_3 = ensure_array_like(batchResults);
			for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
				let res = each_array_3[$$index_3];
				$$renderer.push(`<tr class="hover:bg-white/5 transition-colors group"><td class="px-6 py-4 text-[10px] font-mono text-white/40">${escape_html(res.seed)}</td><td class="px-6 py-4">`);
				if (res.finalState.teams.A.score > res.finalState.teams.B.score) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Win</span>`);
				} else if (res.finalState.teams.A.score < res.finalState.teams.B.score) {
					$$renderer.push("<!--[1-->");
					$$renderer.push(`<span class="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded">Loss</span>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<span class="text-[9px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-2 py-0.5 rounded">Draw</span>`);
				}
				$$renderer.push(`<!--]--></td><td class="px-6 py-4 text-center font-bold"><span${attr_style(`color: ${stringify(res.finalState.teams.A.color)}`)}>${escape_html(res.finalState.teams.A.score)}</span> <span class="text-white/10 mx-2">-</span> <span${attr_style(`color: ${stringify(res.finalState.teams.B.color)}`)}>${escape_html(res.finalState.teams.B.score)}</span></td><td${attr_class(`px-6 py-4 text-center text-[10px] font-bold ${stringify(res.finalState.teams.A.stats.luckScore >= 0 ? "text-emerald-500/60" : "text-rose-500/60")}`)}>${escape_html(res.finalState.teams.A.stats.luckScore > 0 ? "+" : "")}${escape_html(res.finalState.teams.A.stats.luckScore.toFixed(2))}</td><td class="px-6 py-4 text-right"><a${attr("href", `${stringify(base)}/film-room?seed=${stringify(res.seed)}`)} class="text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity hover:underline">Visual Replay</a></td></tr>`);
			}
			$$renderer.push(`<!--]--></tbody></table></div></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="flex flex-1 flex-col items-center justify-center py-24 text-center"><div class="h-24 w-24 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-8"><svg class="h-10 w-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div> <h2 class="text-lg font-black text-white/40 uppercase tracking-widest mb-2">No Test Data</h2> <p class="text-xs font-medium text-white/20 max-w-sm">Select an opponent and click "Run Test" to evaluate your logic across multiple randomized seeds.</p></div>`);
		}
		$$renderer.push(`<!--]--></main></div>`);
	});
}
//#endregion
export { _page as default };
