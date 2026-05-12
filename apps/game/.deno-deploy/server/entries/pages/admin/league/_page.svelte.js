import { h as base } from "../../../../chunks/environment.js";
import { X as escape_html, Y as attr, a as derived, d as stringify, n as attr_class, o as ensure_array_like, r as attr_style } from "../../../../chunks/dev.js";
import "../../../../chunks/modal.js";
import "../../../../chunks/paths.js";
import { n as supabase } from "../../../../chunks/supabase.js";
import "../../../../chunks/simulation.js";
//#region src/routes/admin/league/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let seasons = [];
		let selectedSeasonId = null;
		let matches = [];
		let leagues = [];
		let selectedLeagueId = null;
		let activeTab = "schedule";
		let leagueTeams = [];
		let selectedTeamId = null;
		let isGeneratingSchedule = false;
		let isSimulatingMatch = null;
		let selectedSeason = derived(() => seasons.find((s) => s.id === selectedSeasonId));
		let selectedMatchIds = /* @__PURE__ */ new Set();
		let bulkActionType = "absolute";
		let bulkAbsoluteTime = (/* @__PURE__ */ new Date(Date.now() - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4)).toISOString().slice(0, 16);
		let bulkShiftAmount = 1;
		let bulkShiftUnit = "hours";
		let bulkStaggerStartTime = (/* @__PURE__ */ new Date(Date.now() - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4)).toISOString().slice(0, 16);
		let bulkStaggerInterval = 15;
		async function loadLeagueData() {
			if (!selectedLeagueId) return;
			selectedSeasonId = null;
			matches = [];
			await Promise.all([loadSeasons(), loadTeams()]);
		}
		async function handleLeagueChange(event) {
			selectedLeagueId = event.target.value;
			const url = new URL(window.location.href);
			url.searchParams.set("league", selectedLeagueId);
			window.history.pushState({}, "", url);
			await loadLeagueData();
		}
		async function loadTeams() {
			if (!selectedLeagueId) return;
			const { data, error } = await supabase.from("teams").select("*, players(*)").eq("league_id", selectedLeagueId).order("name");
			if (!error && data) leagueTeams = data;
		}
		async function loadSeasons() {
			if (!selectedLeagueId) return;
			const { data, error } = await supabase.from("seasons").select("id, name, season_number, status, start_date, end_date, game_density, game_slots, code_lock_offset_minutes, league_id").eq("league_id", selectedLeagueId).order("season_number", { ascending: false });
			if (!error && data) {
				seasons = data;
				if (data.length > 0 && !selectedSeasonId) {
					selectedSeasonId = data[0].id;
					await loadMatches(data[0].id);
				}
			}
		}
		async function loadMatches(seasonId) {
			const { data, error } = await supabase.from("matches").select(`
				id,
				scheduled_time,
				code_lock_time,
				status,
				home_score,
				away_score,
				public_seed,
				home_team:teams!home_team_id (name, color),
				away_team:teams!away_team_id (name, color)
			`).eq("season_id", seasonId).order("scheduled_time", { ascending: true });
			if (!error && data) matches = data;
		}
		async function handleSeasonChange(event) {
			selectedSeasonId = event.target.value;
			if (selectedSeasonId) await loadMatches(selectedSeasonId);
		}
		$$renderer.push(`<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 p-8 lg:p-12 font-sans selection:bg-[var(--color-brand-primary)]/30"><header class="mb-12 flex items-center justify-between max-w-6xl mx-auto"><div class="flex items-center gap-8"><div class="inline-flex flex-col rounded-2xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl"><div class="flex items-center gap-4"><a${attr("href", `${stringify(base)}/`)} aria-label="Go back" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] shadow-lg"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></a> <div class="flex flex-col"><h1 class="text-2xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">League <span class="text-[var(--color-brand-primary)]">Admin</span></h1> <p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Commissioner Tools</p></div></div></div></div> <div class="flex items-center gap-4">`);
		if (leagues.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="relative">`);
			$$renderer.select({
				value: selectedLeagueId,
				onchange: handleLeagueChange,
				class: "appearance-none bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] outline-none focus:border-[var(--color-brand-primary)]/50 transition-colors cursor-pointer"
			}, ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(leagues);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let league = each_array[$$index];
					$$renderer.option({
						value: league.id,
						class: "text-black"
					}, ($$renderer) => {
						$$renderer.push(`${escape_html(league.name)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			});
			$$renderer.push(` <svg class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-brand-primary)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (activeTab === "schedule" && seasons.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="relative">`);
			$$renderer.select({
				value: selectedSeasonId,
				onchange: handleSeasonChange,
				class: "appearance-none bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-[10px] font-black uppercase tracking-widest text-white/60 outline-none focus:border-white/20 transition-colors cursor-pointer"
			}, ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				const each_array_1 = ensure_array_like(seasons);
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let season = each_array_1[$$index_1];
					$$renderer.option({
						value: season.id,
						class: "text-black"
					}, ($$renderer) => {
						$$renderer.push(`Season ${escape_html(season.season_number)}: ${escape_html(season.name)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			});
			$$renderer.push(` <svg class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (activeTab === "schedule") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<a${attr("href", `${stringify(base)}/admin/league/season/new?league=${stringify(selectedLeagueId)}`)} class="rounded-xl border border-white/5 bg-black/40 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">+ New Season</a>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></header> <div class="max-w-6xl mx-auto flex items-center gap-2 mb-8 border-b border-white/5 pb-4"><button${attr_class(`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${stringify(activeTab === "schedule" ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/20" : "text-white/40 hover:bg-white/5 hover:text-white")}`)}>Schedule Management</button> <button${attr_class(`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${stringify(activeTab === "franchises" ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/20" : "text-white/40 hover:bg-white/5 hover:text-white")}`)}>Franchises &amp; Rosters</button></div> `);
		if (activeTab === "schedule") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="max-w-6xl mx-auto space-y-8">`);
			if (selectedSeason()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="p-6 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-3xl flex items-center justify-between shadow-2xl"><div class="flex flex-col"><div class="flex items-center gap-3"><span class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-primary)]">Season ${escape_html(selectedSeason().season_number)}</span> <div class="h-1 w-1 rounded-full bg-white/20"></div> <span class="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">${escape_html(new Date(selectedSeason().start_date).toLocaleDateString())} → ${escape_html(selectedSeason().end_date ? new Date(selectedSeason().end_date).toLocaleDateString() : "??")}</span></div> <h2 class="text-2xl font-black uppercase tracking-tighter text-white mt-1">${escape_html(selectedSeason().name)}</h2></div> <div class="flex items-center gap-2"><a${attr("href", `${stringify(base)}/admin/league/season/new?league=${stringify(selectedLeagueId)}&template=${stringify(selectedSeason().id)}`)} class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all"><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> Duplicate Template</a> <button class="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:bg-red-500/20 hover:text-red-500 transition-all"><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Delete</button></div></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (selectedSeasonId) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="flex items-center justify-between"><h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Match Management</h3> `);
				if (matches.length === 0) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<button${attr("disabled", isGeneratingSchedule, true)} class="rounded-xl bg-[var(--color-brand-primary)] px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50">Generate Round-Robin</button>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div> `);
				if (matches.length > 0) {
					$$renderer.push("<!--[0-->");
					if (selectedMatchIds.size > 0) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="sticky top-4 z-20 flex flex-col gap-4 p-4 rounded-2xl bg-black/80 border border-[var(--color-brand-primary)]/30 backdrop-blur-3xl shadow-2xl mb-4"><div class="flex items-center justify-between"><span class="text-xs font-bold text-white"><span class="text-[var(--color-brand-primary)]">${escape_html(selectedMatchIds.size)}</span> matches selected</span> <div class="flex gap-2">`);
						$$renderer.select({
							value: bulkActionType,
							class: "bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white outline-none [&amp;>option]:text-black"
						}, ($$renderer) => {
							$$renderer.option({ value: "absolute" }, ($$renderer) => {
								$$renderer.push(`Set Absolute Time`);
							});
							$$renderer.option({ value: "shift" }, ($$renderer) => {
								$$renderer.push(`Shift Time Relative`);
							});
							$$renderer.option({ value: "stagger" }, ($$renderer) => {
								$$renderer.push(`Stagger Starts`);
							});
							$$renderer.option({ value: "simulate" }, ($$renderer) => {
								$$renderer.push(`Simulate Matches`);
							});
						});
						$$renderer.push(`</div></div> <div class="flex items-end gap-4 p-4 rounded-xl bg-white/5 border border-white/5">`);
						if (bulkActionType === "absolute") {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<div class="flex-1 space-y-1"><label class="text-[8px] font-black uppercase tracking-widest text-white/40">Set Time To</label> <input type="datetime-local"${attr("value", bulkAbsoluteTime)} class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"/></div>`);
						} else if (bulkActionType === "shift") {
							$$renderer.push("<!--[1-->");
							$$renderer.push(`<div class="flex-1 space-y-1"><label class="text-[8px] font-black uppercase tracking-widest text-white/40">Amount</label> <input type="number"${attr("value", bulkShiftAmount)} class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"/></div> <div class="flex-1 space-y-1"><label class="text-[8px] font-black uppercase tracking-widest text-white/40">Unit</label> `);
							$$renderer.select({
								value: bulkShiftUnit,
								class: "w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none [&amp;>option]:text-black"
							}, ($$renderer) => {
								$$renderer.option({ value: "minutes" }, ($$renderer) => {
									$$renderer.push(`Minutes`);
								});
								$$renderer.option({ value: "hours" }, ($$renderer) => {
									$$renderer.push(`Hours`);
								});
								$$renderer.option({ value: "days" }, ($$renderer) => {
									$$renderer.push(`Days`);
								});
							});
							$$renderer.push(`</div>`);
						} else if (bulkActionType === "stagger") {
							$$renderer.push("<!--[2-->");
							$$renderer.push(`<div class="flex-1 space-y-1"><label class="text-[8px] font-black uppercase tracking-widest text-white/40">First Match Start</label> <input type="datetime-local"${attr("value", bulkStaggerStartTime)} class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"/></div> <div class="flex-1 space-y-1"><label class="text-[8px] font-black uppercase tracking-widest text-white/40">Interval (Mins)</label> <input type="number"${attr("value", bulkStaggerInterval)} class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"/></div>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (bulkActionType !== "simulate") {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<button class="rounded-lg bg-[var(--color-brand-primary)] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-black hover:scale-105 active:scale-95 transition-all">Apply</button>`);
						} else {
							$$renderer.push("<!--[-1-->");
							$$renderer.push(`<div class="flex-1"></div> <button${attr("disabled", isSimulatingMatch !== null, true)} class="rounded-lg bg-emerald-500 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50">${escape_html("Run Simulation Now")}</button>`);
						}
						$$renderer.push(`<!--]--></div></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl overflow-x-auto shadow-2xl"><table class="w-full text-left"><thead><tr class="border-b border-white/5 bg-white/5"><th class="px-6 py-4 w-12"><input type="checkbox"${attr("checked", matches.length > 0 && selectedMatchIds.size === matches.length, true)} class="accent-[var(--color-brand-primary)] cursor-pointer"/></th><th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Matchup</th><th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Code Lock (Sim)</th><th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Broadcast (Start)</th><th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20 text-right">Status</th></tr></thead><tbody class="divide-y divide-white/5"><!--[-->`);
					const each_array_2 = ensure_array_like(matches);
					for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
						let match = each_array_2[$$index_2];
						$$renderer.push(`<tr${attr_class(`hover:bg-white/5 transition-colors ${stringify(selectedMatchIds.has(match.id) ? "bg-white/5" : "")}`)}><td class="px-6 py-4"><input type="checkbox"${attr("checked", selectedMatchIds.has(match.id), true)} class="accent-[var(--color-brand-primary)] cursor-pointer"/></td><td class="px-6 py-4"><div class="flex items-center gap-4 min-w-[240px]"><div class="flex-1 flex flex-col items-end text-right"><span class="text-xs font-bold"${attr_style(`color: ${stringify(match.home_team.color || "white")}`)}>${escape_html(match.home_team.name)}</span> `);
						if (match.status === "played" || match.status === "simmed" && match.home_score !== null) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<span class="text-[10px] font-black text-white/40 mt-0.5">${escape_html(match.home_score)}</span>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></div> <div class="flex flex-col items-center"><span class="text-white/10 uppercase text-[8px] font-black">VS</span></div> <div class="flex-1 flex flex-col items-start"><span class="text-xs font-bold"${attr_style(`color: ${stringify(match.away_team.color || "white")}`)}>${escape_html(match.away_team.name)}</span> `);
						if (match.status === "played" || match.status === "simmed" && match.away_score !== null) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<span class="text-[10px] font-black text-white/40 mt-0.5">${escape_html(match.away_score)}</span>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></div></div></td><td class="px-6 py-4"><div class="flex items-center gap-2 group"><input type="datetime-local"${attr("value", match.code_lock_time ? (/* @__PURE__ */ new Date(new Date(match.code_lock_time).getTime() - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4)).toISOString().slice(0, 16) : "")} class="bg-transparent border-none text-[10px] font-bold text-white/20 focus:text-white focus:outline-none cursor-pointer p-0"/></div></td><td class="px-6 py-4"><div class="flex items-center gap-2 group"><input type="datetime-local"${attr("value", (/* @__PURE__ */ new Date(new Date(match.scheduled_time).getTime() - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4)).toISOString().slice(0, 16))} class="bg-transparent border-none text-[10px] font-bold text-white/40 focus:text-white focus:outline-none cursor-pointer p-0"/> <button class="text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100" title="Copy Time"><svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button></div></td><td class="px-6 py-4 text-right"><div class="flex flex-col gap-1 items-end"><span${attr_class(`text-[9px] font-black uppercase tracking-widest ${stringify(match.status === "played" ? "text-emerald-400" : match.status === "simmed" ? "text-blue-400" : match.status === "scheduled" ? "text-amber-400" : "text-white/40")}`)}>${escape_html(match.status)}</span> `);
						if (match.status === "played" || match.status === "simmed" && match.home_score !== null) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<a${attr("href", `${stringify(base)}/match/${stringify(match.id)}`)} class="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-[var(--color-brand-primary)] transition-colors">View Replay →</a>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></div></td></tr>`);
					}
					$$renderer.push(`<!--]--></tbody></table></div>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div class="py-24 text-center border-2 border-dashed border-white/5 rounded-2xl"><p class="text-sm font-bold text-white/20 uppercase tracking-widest">No matches found for this season</p></div>`);
				}
				$$renderer.push(`<!--]-->`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="py-24 text-center"><p class="text-sm font-bold text-white/20 uppercase tracking-widest">Select a season to manage matches</p></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else if (activeTab === "franchises") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12"><aside class="space-y-6"><div class="flex items-center justify-between"><h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Franchises</h3> <button class="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:underline">+ New Team</button></div> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="flex flex-col gap-2"><!--[-->`);
			const each_array_3 = ensure_array_like(leagueTeams);
			for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
				let team = each_array_3[$$index_3];
				$$renderer.push(`<button${attr_class(`w-full flex items-center justify-between px-6 py-4 rounded-xl border text-left transition-all ${stringify(selectedTeamId === team.id ? "border-white/20 bg-white/5" : "border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/40")}`)}><div class="flex items-center gap-3"><div class="w-3 h-3 rounded-full shadow-lg"${attr_style(`background-color: ${stringify(team.color)}; box-shadow: 0 0 10px ${stringify(team.color)}40`)}></div> <span class="text-xs font-bold uppercase tracking-widest text-white/80">${escape_html(team.name)}</span></div> <span class="text-[9px] font-black text-white/30 bg-black/40 px-2 py-1 rounded">${escape_html(team.players?.length || 0)} Players</span></button>`);
			}
			$$renderer.push(`<!--]--></div></aside> <div class="lg:col-span-2 space-y-6">`);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="py-24 text-center"><p class="text-sm font-bold text-white/20 uppercase tracking-widest">Select a team to view their roster</p></div>`);
			$$renderer.push(`<!--]--></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };
