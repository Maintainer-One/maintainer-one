import { h as base } from "../../../../chunks/environment.js";
import { X as escape_html, Y as attr, a as derived, d as stringify, n as attr_class, o as ensure_array_like, r as attr_style } from "../../../../chunks/dev.js";
import "../../../../chunks/paths.js";
import { t as page } from "../../../../chunks/state.js";
import { n as supabase } from "../../../../chunks/supabase.js";
import "../../../../chunks/BrandLogo.js";
import { t as TeamIcon } from "../../../../chunks/TeamIcon.js";
import "../../../../chunks/sim.worker.js";
import { t as createInitialState } from "../../../../chunks/core.js";
import { t as ReplayGrid } from "../../../../chunks/ReplayGrid.js";
//#region src/lib/components/match/MatchPreview.svelte
function MatchPreview($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { match, onCountdownComplete } = $$props;
		let countdown = "";
		$$renderer.push(`<div class="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar svelte-13nzxi7"><div class="w-full max-w-4xl space-y-12"><div class="text-center space-y-6"><div class="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-4 py-1.5 text-[10px] font-black tracking-[0.2em] text-[var(--color-brand-secondary)] uppercase"><span class="h-2 w-2 animate-pulse rounded-full bg-[var(--color-brand-primary)]"></span> Match Preview</div> <div class="flex items-center justify-center gap-12 md:gap-24"><div class="flex flex-col items-center gap-4"><div class="h-24 w-24 rounded-2xl flex items-center justify-center border-2 shadow-2xl overflow-hidden bg-black/40"${attr_style(`border-color: ${stringify(match.home_team.color)}44;`)}>`);
		TeamIcon($$renderer, {
			teamName: match.home_team.name,
			color: match.home_team.color,
			size: "size-16",
			class: `drop-shadow-[0_0_15px_${stringify(match.home_team.color)}66]`
		});
		$$renderer.push(`<!----></div> <h2 class="text-2xl font-black text-white tracking-tighter">${escape_html(match.home_team.name)}</h2></div> <div class="flex flex-col items-center gap-2"><span class="text-6xl font-black text-white/5 tracking-tighter uppercase italic">VS</span> <div class="text-2xl font-mono font-black text-[var(--color-brand-primary)] drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">${escape_html(countdown)}</div></div> <div class="flex flex-col items-center gap-4"><div class="h-24 w-24 rounded-2xl flex items-center justify-center border-2 shadow-2xl overflow-hidden bg-black/40"${attr_style(`border-color: ${stringify(match.away_team.color)}44;`)}>`);
		TeamIcon($$renderer, {
			teamName: match.away_team.name,
			color: match.away_team.color,
			size: "size-16",
			class: `drop-shadow-[0_0_15px_${stringify(match.away_team.color)}66]`
		});
		$$renderer.push(`<!----></div> <h2 class="text-2xl font-black text-white tracking-tighter">${escape_html(match.away_team.name)}</h2></div></div></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/routes/match/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let states = [];
		let currentTick = 0;
		let playSpeed = 750;
		let isSimulating = false;
		let showControlMap = true;
		let matchData = null;
		let currentTime = Date.now();
		const isPastStartTime = derived(() => {
			if (!matchData) return false;
			return currentTime >= new Date(matchData.scheduled_time).getTime();
		});
		const isPreview = derived(() => {
			if (!matchData) return true;
			return !isPastStartTime();
		});
		const isAwaitingSeed = derived(() => {
			return isPastStartTime() && matchData?.public_seed === null;
		});
		const isLive = derived(() => {
			if (!matchData || states.length === 0) return false;
			const startTime = new Date(matchData.scheduled_time).getTime();
			const endTime = startTime + states.length * playSpeed;
			return currentTime >= startTime && currentTime < endTime;
		});
		const isCompleted = derived(() => {
			if (!matchData || states.length === 0) return false;
			return currentTime >= new Date(matchData.scheduled_time).getTime() + states.length * playSpeed;
		});
		async function loadMatch(matchId) {
			isSimulating = true;
			const { data: match, error } = await supabase.from("matches").select(`
				id,
				public_seed,
				scheduled_time,
				league_id,
				season_id,
				leagues (protocol_version, protocol_config),
				seasons (season_number, protocol_version, protocol_config),
				home_team:teams!home_team_id (id, name, color, active_version_id),
				away_team:teams!away_team_id (id, name, color, active_version_id)
			`).eq("id", matchId).single();
			if (error || !match) {
				console.error("Error fetching match:", error);
				isSimulating = false;
				return;
			}
			matchData = match;
			if (matchData.public_seed === null) {
				console.log("Match is past scheduled time but public_seed is not yet revealed.");
				isSimulating = false;
				return;
			}
			const config = match.seasons?.protocol_config ?? match.leagues?.protocol_config ?? {};
			playSpeed = config.tickRateMs || 750;
			const homeVersionId = match.home_team.active_version_id;
			const awayVersionId = match.away_team.active_version_id;
			const { data: versions, error: versionError } = await supabase.from("team_code_versions").select("id, compiled_code").in("id", [homeVersionId, awayVersionId]);
			if (versionError || !versions || versions.length < 2) {
				console.error("Error fetching versions:", versionError);
				isSimulating = false;
				return;
			}
			versions.find((v) => v.id === homeVersionId);
			versions.find((v) => v.id === awayVersionId);
			states = [createInitialState(Number(match.public_seed), match.seasons?.protocol_version || match.leagues.protocol_version, config, {
				A: match.home_team,
				B: match.away_team
			})];
			currentTick = 0;
			(config?.maxGameTicks || 100) + (config?.overtimeAllowed ? config?.pointZoneMaxAge || 40 : 0) + 100;
		}
		let currentState = derived(() => states[currentTick]);
		let returnToUrl = derived(() => page.url.searchParams.get("returnTo") || `${base}/`);
		$$renderer.push(`<div class="flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 font-sans selection:bg-[var(--color-brand-primary)]/30"><main class="flex flex-1 flex-col p-6 lg:p-10 relative overflow-hidden"><header class="mb-8 flex items-center justify-between min-h-[64px]"><div class="flex-1 flex items-center justify-start"><a${attr("href", returnToUrl())} aria-label="Back to Match View" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:text-[var(--color-brand-primary)] shadow-lg backdrop-blur-md"><svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></a></div> <div class="flex items-center justify-center gap-6"><div class="flex items-center gap-6 bg-black/40 rounded-2xl border border-white/5 px-6 py-3 backdrop-blur-3xl shadow-2xl min-w-[520px]">`);
		if (matchData && currentState()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex flex-1 items-center justify-end gap-4"><div class="flex items-center gap-3">`);
			TeamIcon($$renderer, {
				teamName: matchData.home_team.name,
				color: matchData.home_team.color,
				size: "size-10",
				class: `drop-shadow-[0_0_10px_${stringify(matchData.home_team.color)}44]`
			});
			$$renderer.push(`<!----> <div class="text-right"><div class="text-[8px] font-black uppercase tracking-widest leading-none mb-1 opacity-20">Home</div> <div class="text-sm font-black leading-none"${attr_style(`color: ${stringify(matchData.home_team.color)}`)}>${escape_html(matchData.home_team.name)}</div></div></div> <div class="w-12 text-center text-3xl font-black text-white tabular-nums">${escape_html(currentState().teams.A.score)}</div></div> <div class="flex flex-col items-center w-36 border-x border-white/10"><div class="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-primary)] mb-1">Tick</div> <div class="text-xl font-mono font-black text-white tabular-nums">${escape_html(currentTick)} <span class="text-white/10 text-[10px]">/ ${escape_html(isLive() ? currentTick : states.length - 1)}</span></div></div> <div class="flex flex-1 items-center justify-start gap-4"><div class="w-12 text-center text-3xl font-black text-white tabular-nums">${escape_html(currentState().teams.B.score)}</div> <div class="flex items-center gap-3"><div class="text-left"><div class="text-[8px] font-black uppercase tracking-widest leading-none mb-1 opacity-20">Away</div> <div class="text-sm font-black leading-none"${attr_style(`color: ${stringify(matchData.away_team.color)}`)}>${escape_html(matchData.away_team.name)}</div></div> `);
			TeamIcon($$renderer, {
				teamName: matchData.away_team.name,
				color: matchData.away_team.color,
				size: "size-10",
				class: `drop-shadow-[0_0_10px_${stringify(matchData.away_team.color)}44]`
			});
			$$renderer.push(`<!----></div></div>`);
		} else if (matchData) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="flex flex-1 items-center justify-end gap-3">`);
			TeamIcon($$renderer, {
				teamName: matchData.home_team.name,
				color: matchData.home_team.color,
				size: "size-8 opacity-40"
			});
			$$renderer.push(`<!----> <div class="text-right"><div class="text-[9px] font-black uppercase tracking-widest leading-none mb-1 opacity-40">Home</div> <div class="text-sm font-black leading-none"${attr_style(`color: ${stringify(matchData.home_team.color)}`)}>${escape_html(matchData.home_team.name)}</div></div></div> <div class="px-3 text-[10px] font-black text-white/10 uppercase tracking-widest">vs</div> <div class="flex flex-1 items-center justify-start gap-3"><div class="text-left"><div class="text-[9px] font-black uppercase tracking-widest leading-none mb-1 opacity-40">Away</div> <div class="text-sm font-black leading-none"${attr_style(`color: ${stringify(matchData.away_team.color)}`)}>${escape_html(matchData.away_team.name)}</div></div> `);
			TeamIcon($$renderer, {
				teamName: matchData.away_team.name,
				color: matchData.away_team.color,
				size: "size-8 opacity-40"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="h-8 w-60 bg-white/5 rounded-lg animate-pulse"></div>`);
		}
		$$renderer.push(`<!--]--></div> `);
		if (isLive()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 shadow-lg animate-pulse"><span class="h-1.5 w-1.5 rounded-full bg-white"></span> <span class="text-[10px] font-black text-white uppercase tracking-widest">Live</span></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <div class="flex-1 flex items-center justify-end gap-4">`);
		if (isCompleted()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<a${attr("href", `${stringify(base)}/match/${stringify(matchData?.id)}/stats`)} class="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] transition-all hover:bg-[var(--color-brand-primary)]/20 shadow-lg shadow-[var(--color-brand-primary)]/10"><svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> View Final Stats</a>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button${attr_class(`flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 bg-black/40 text-[9px] font-black uppercase tracking-widest ${stringify("text-[var(--color-brand-primary)]")} transition-all hover:bg-black/60`)}><svg class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z"></path></svg> Control Map</button></div></header> `);
		if (isPreview() && matchData) {
			$$renderer.push("<!--[0-->");
			MatchPreview($$renderer, {
				match: matchData,
				onCountdownComplete: () => loadMatch(matchData.id)
			});
		} else if (isPreview() || isAwaitingSeed()) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="flex flex-1 flex-col items-center justify-center gap-6"><div class="flex items-center justify-center italic text-white/20 font-black uppercase tracking-widest text-sm animate-pulse">${escape_html(isAwaitingSeed() ? "Technical Difficulties - Awaiting Pitch Feed..." : "Synchronizing Pitch Data...")}</div> `);
			if (isAwaitingSeed()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button class="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all">Retry Connection</button>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else if (currentState()) {
			$$renderer.push("<!--[2-->");
			$$renderer.push(`<div class="flex-1 flex flex-col items-center justify-center min-h-0"><div class="flex-1 w-full max-w-4xl min-h-0 p-4 flex items-center justify-center">`);
			ReplayGrid($$renderer, {
				primaryState: currentState(),
				showControlMap,
				playSpeed
			});
			$$renderer.push(`<!----></div> <div class="w-full max-w-2xl mt-8 rounded-2xl border border-white/10 bg-black/40 p-4 shadow-2xl backdrop-blur-2xl"><div class="flex items-center gap-6"><button${attr("disabled", isLive(), true)} class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed">`);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<svg class="h-5 w-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`);
			$$renderer.push(`<!--]--></button> <input type="range" min="0"${attr("max", isLive() ? currentTick : states.length - 1)}${attr("value", currentTick)}${attr("disabled", isLive(), true)} class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/5 accent-[var(--color-brand-primary)] disabled:cursor-not-allowed svelte-w3i9ri"/> <div class="text-[10px] font-mono text-white/40 whitespace-nowrap">Tick ${escape_html(currentTick)} <span class="text-white/10">/ ${escape_html(isLive() ? currentTick : states.length - 1)}</span></div></div></div></div>`);
		} else if (isSimulating) {
			$$renderer.push("<!--[3-->");
			$$renderer.push(`<div class="flex flex-1 items-center justify-center italic text-white/20 font-black uppercase tracking-widest text-sm animate-pulse">Broadcasting from Pitch...</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></main> <aside class="w-96 border-l border-white/5 bg-black/20 p-8 backdrop-blur-3xl overflow-y-auto no-scrollbar svelte-w3i9ri">`);
		if (currentState()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="space-y-12"><section><h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Fortune / Luck (xS)</h3> <div class="space-y-4"><!--[-->`);
			const each_array = ensure_array_like(["A", "B"]);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let teamID = each_array[$$index];
				const team = currentState().teams[teamID];
				$$renderer.push(`<div class="rounded-2xl border border-white/5 bg-white/5 p-5"><div class="flex items-center justify-between mb-3"><span class="text-[9px] font-black uppercase tracking-widest"${attr_style(`color: ${stringify(team.color)}`)}>${escape_html(team.name)}</span> <span${attr_class(`text-xs font-black ${stringify(team.stats.luckScore >= 0 ? "text-emerald-400" : "text-rose-400")}`)}>${escape_html(team.stats.luckScore > 0 ? "+" : "")}${escape_html(team.stats.luckScore.toFixed(2))}</span></div> <div class="relative h-1 w-full bg-white/5 rounded-full overflow-hidden"><div${attr_class(`absolute top-0 bottom-0 ${stringify(team.stats.luckScore >= 0 ? "bg-emerald-400" : "bg-rose-400")} transition-all duration-1000`)}${attr_style(`width: ${stringify(Math.min(100, Math.abs(team.stats.luckScore) * 10))}%; left: 0`)}></div></div></div>`);
			}
			$$renderer.push(`<!--]--> <p class="text-[8px] font-medium text-white/20 italic leading-relaxed">* xS (Expected Spawns) measures if a team is receiving more points in their controlled territory than their map control dictates.</p></div></section> <section><h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Map Dominance</h3> <div class="space-y-6"><div class="flex h-3 w-full rounded-full overflow-hidden border border-white/5"><div class="transition-all duration-1000"${attr_style(`width: ${stringify(currentState().teams.A.stats.controlPercentage * 100)}%; background-color: ${stringify(currentState().teams.A.color)}aa`)}></div> <div class="bg-amber-500/10 transition-all duration-1000"${attr_style(`width: ${stringify(currentState().teams.A.stats.contestedPercentage * 100)}%`)}></div> <div class="transition-all duration-1000"${attr_style(`width: ${stringify(currentState().teams.B.stats.controlPercentage * 100)}%; background-color: ${stringify(currentState().teams.B.color)}aa`)}></div></div> <div class="flex justify-between text-[9px] font-black uppercase tracking-widest"><span${attr_style(`color: ${stringify(currentState().teams.A.color)}`)}>${escape_html((currentState().teams.A.stats.controlPercentage * 100).toFixed(0))}%</span> <span class="text-white/20">${escape_html((currentState().teams.A.stats.contestedPercentage * 100).toFixed(0))}% Contested</span> <span${attr_style(`color: ${stringify(currentState().teams.B.color)}`)}>${escape_html((currentState().teams.B.stats.controlPercentage * 100).toFixed(0))}%</span></div></div></section> <section><h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Capture Efficiency</h3> <div class="grid grid-cols-2 gap-4"><div class="rounded-2xl border border-white/5 bg-white/5 p-4 text-center"><div class="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Pts / Capture</div> <div class="text-xl font-black"${attr_style(`color: ${stringify(currentState().teams.A.color)}`)}>${escape_html(currentState().teams.A.stats.averagePointsPerCapture.toFixed(2))}</div></div> <div class="rounded-2xl border border-white/5 bg-white/5 p-4 text-center"><div class="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Pts / Capture</div> <div class="text-xl font-black"${attr_style(`color: ${stringify(currentState().teams.B.color)}`)}>${escape_html(currentState().teams.B.stats.averagePointsPerCapture.toFixed(2))}</div></div></div></section> <section><h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Player Performance</h3> <div class="space-y-4"><!--[-->`);
			const each_array_1 = ensure_array_like(currentState().players);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let p = each_array_1[$$index_1];
				$$renderer.push(`<div class="rounded-2xl border border-white/5 bg-white/5 p-4 flex items-center justify-between group hover:border-[var(--color-brand-primary)]/20 transition-all"><div class="flex items-center gap-3"><div class="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black border"${attr_style(`border-color: ${stringify(currentState().teams[p.team].color)}33; color: ${stringify(currentState().teams[p.team].color)}`)}>${escape_html(currentState().teams[p.team].name[0])}${escape_html(p.id.slice(1))}</div> <div class="flex flex-col"><div class="flex items-center gap-1.5 leading-none mb-1"><span class="text-[10px] font-black text-white/80 group/pts relative cursor-help">${escape_html(p.stats.pointsScored || 0)} Pts <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111] border border-white/10 rounded text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover/pts:opacity-100 transition-opacity duration-75 whitespace-nowrap pointer-events-none z-50 shadow-2xl">Points Scored</div></span> <span class="text-[10px] font-black text-white/20">/</span> <span class="text-[10px] font-black text-white/80 group/cps relative cursor-help">${escape_html(p.stats.expectedCaptures + p.stats.contestedCaptures + p.stats.stolenCaptures)} Cps <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111] border border-white/10 rounded text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover/cps:opacity-100 transition-opacity duration-75 whitespace-nowrap pointer-events-none z-50 shadow-2xl">Total Captures</div></span> <span class="text-[10px] font-black text-white/20">/</span> <span class="text-[10px] font-black text-[var(--color-brand-primary)] group/ppc relative cursor-help">${escape_html(((p.stats.pointsScored || 0) / Math.max(1, p.stats.expectedCaptures + p.stats.contestedCaptures + p.stats.stolenCaptures)).toFixed(1))} PPC <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111] border border-white/10 rounded text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover/ppc:opacity-100 transition-opacity duration-75 whitespace-nowrap pointer-events-none z-50 shadow-2xl">Points Per Capture</div></span></div> <span class="text-[8px] font-bold text-white/20 uppercase tracking-widest">${escape_html(p.stats.squaresMoved)} Squares Moved</span></div></div> <div class="text-right"><div class="text-[9px] font-black text-white/40 uppercase tracking-widest">${escape_html(p.stats.singleStuns + p.stats.mutualStuns)} Stuns</div> <div class="text-[8px] font-medium text-rose-500/40 italic">${escape_html(p.stats.mutualStuns)} Mutual</div></div></div>`);
			}
			$$renderer.push(`<!--]--></div></section></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></aside></div>`);
	});
}
//#endregion
export { _page as default };
