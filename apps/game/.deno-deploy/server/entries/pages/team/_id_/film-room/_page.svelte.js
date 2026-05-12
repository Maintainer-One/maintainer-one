import "../../../../../chunks/environment.js";
import { X as escape_html, Y as attr, a as derived, d as stringify, f as unsubscribe_stores, i as bind_props, n as attr_class, o as ensure_array_like, r as attr_style, u as store_get } from "../../../../../chunks/dev.js";
import "../../../../../chunks/modal.js";
import "../../../../../chunks/paths.js";
import { t as page } from "../../../../../chunks/state.js";
import { n as supabase } from "../../../../../chunks/supabase.js";
import { t as getProtocol } from "../../../../../chunks/registry.js";
import "../../../../../chunks/sim.worker.js";
import { t as createInitialState } from "../../../../../chunks/core.js";
import { t as ReplayGrid } from "../../../../../chunks/ReplayGrid.js";
import { t as scratchpad } from "../../../../../chunks/scratchpad.js";
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
//#region src/lib/components/VersionBrowser.svelte
function VersionBrowser($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { teamId, teamName, teamColor, versions = [], drafts = [], activeDraftId, matchVersionId, officialVersionId, onLoadVersion, onSelectDraft, onDeleteDraft, onClose } = $$props;
		let activeSection = "history";
		$$renderer.push(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"><div class="absolute inset-0 bg-black/80 backdrop-blur-sm" role="presentation"></div> <div class="relative flex h-full max-h-[800px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl"><header class="flex items-center justify-between border-b border-white/5 p-6 md:px-8"><div class="flex items-center gap-4"><div class="h-10 w-10 rounded-xl border border-white/10 flex items-center justify-center"${attr_style(`background: ${stringify(teamColor)}20; color: ${stringify(teamColor)}`)}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-2"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg></div> <div><h2 class="text-xl font-black uppercase tracking-tight text-white">${escape_html(teamName)} <span class="text-white/30">Library</span></h2> <p class="text-[10px] font-bold uppercase tracking-widest text-white/20">Manage versions and local drafts</p></div></div> <button class="rounded-xl border border-white/5 bg-white/5 p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></header> <nav class="flex gap-8 border-b border-white/5 px-8"><button${attr_class(`relative pb-4 pt-6 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${stringify(activeSection === "history" ? "text-white" : "text-white/20 hover:text-white/40")}`)}>Published History `);
		if (activeSection === "history") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="absolute bottom-0 left-0 h-0.5 w-full bg-white"></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></button> <button${attr_class(`relative pb-4 pt-6 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${stringify(activeSection === "drafts" ? "text-white" : "text-white/20 hover:text-white/40")}`)}>Local Drafts (${escape_html(drafts.length)}) `);
		if (activeSection === "drafts") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="absolute bottom-0 left-0 h-0.5 w-full bg-white"></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></button></nav> <div class="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar svelte-5hfhy0">`);
		if (activeSection === "history") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="grid gap-4 md:grid-cols-2">`);
			const each_array = ensure_array_like(versions);
			if (each_array.length !== 0) {
				$$renderer.push("<!--[-->");
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let v = each_array[$$index];
					$$renderer.push(`<div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10 hover:bg-white/[0.04]"><div class="mb-4 flex items-start justify-between"><div><div class="mb-1 flex items-center gap-2"><span class="text-lg font-black text-white">V${escape_html(v.version_number)}</span> `);
					if (v.id === matchVersionId) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="rounded-full bg-blue-500/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20">Match</span>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (v.id === officialVersionId) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">Official</span>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div> <p class="text-[10px] font-bold text-white/30">${escape_html(new Date(v.created_at).toLocaleString())}</p></div></div> `);
					if (v.name) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<p class="mb-6 text-xs text-white/60 line-clamp-2 italic">"${escape_html(v.name)}"</p>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <button class="w-full rounded-xl bg-white/5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all hover:bg-white/10 hover:text-white">Load into Editor</button></div>`);
				}
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push(`<div class="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/5 text-white/20"><p class="text-sm font-medium">No published versions yet.</p></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="grid gap-4 md:grid-cols-2">`);
			const each_array_1 = ensure_array_like(drafts);
			if (each_array_1.length !== 0) {
				$$renderer.push("<!--[-->");
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let d = each_array_1[$$index_1];
					$$renderer.push(`<div${attr_class(`group relative overflow-hidden rounded-2xl border ${stringify(activeDraftId === d.id ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/5 bg-white/[0.02]")} p-5 transition-all hover:border-white/10 hover:bg-white/[0.04]`)}><div class="mb-4 flex items-start justify-between"><div class="flex-1 min-w-0"><h3 class="truncate text-sm font-bold text-white">${escape_html(d.name)}</h3> <p class="text-[10px] font-bold text-white/20 uppercase tracking-widest">Local Scratchpad</p></div> `);
					if (activeDraftId === d.id) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div> <div class="flex gap-2"><button${attr_class(`flex-1 rounded-xl ${stringify(activeDraftId === d.id ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/70")} py-2.5 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/10 hover:text-white`)}>${escape_html(activeDraftId === d.id ? "Active" : "Select")}</button> <button class="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500/20" aria-label="Delete Draft"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg></button></div></div>`);
				}
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push(`<div class="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/5 text-white/20"><p class="text-sm font-medium">No local drafts found.</p></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div> <footer class="border-t border-white/5 p-6 bg-black/40"><div class="flex items-center justify-between text-[10px] text-white/20 font-medium"><p>Published versions are stored on the server. Drafts are stored in your browser's local storage.</p> <button class="flex items-center gap-2 text-white/40 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg> NEW DRAFT</button></div></footer></div></div>`);
	});
}
//#endregion
//#region src/lib/components/TimelineManager.svelte
function TimelineManager($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { timelines, activeTimelineId = void 0, ghostTimelineId = void 0, globalTick = void 0, isPlaying = false, onTogglePlay, onStepForward, onStepBackward, onRequestSimulation, onSave, onPublish } = $$props;
		let maxTicks = derived(() => Math.max(100, ...timelines.map((t) => t.states.length - 1)));
		$$renderer.push(`<div class="w-full max-w-3xl flex flex-col rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-2xl overflow-hidden"><div class="flex items-center justify-between gap-6 p-4 border-b border-white/5 bg-black/20"><div class="flex items-center gap-3"><button aria-label="Previous Tick" class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white active:scale-90 border border-white/5"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg></button> <button${attr("aria-label", isPlaying ? "Pause" : "Play")} class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] transition-all hover:scale-110 active:scale-95 shadow-lg shadow-[var(--color-brand-primary)]/20">`);
		if (isPlaying) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<svg class="h-6 w-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`);
		}
		$$renderer.push(`<!--]--></button> <button aria-label="Next Tick" class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white active:scale-90 border border-white/5"><svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg></button></div></div> <div class="relative w-full p-4 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar"><!--[-->`);
		const each_array = ensure_array_like(timelines);
		for (let idx = 0, $$length = each_array.length; idx < $$length; idx++) {
			let timeline = each_array[idx];
			const isPrimary = activeTimelineId === timeline.id;
			const isGhost = ghostTimelineId === timeline.id;
			const isFinished = timeline.states[timeline.states.length - 1]?.isFinished;
			const lastBlock = timeline.blocks.A[timeline.blocks.A.length - 1] || timeline.blocks.B[timeline.blocks.B.length - 1];
			const startTick = lastBlock ? lastBlock.startTick : 0;
			const endTick = timeline.states.length - 1;
			$$renderer.push(`<div class="flex items-center gap-3 relative z-20 group"><div class="flex items-center gap-1 min-w-[50px]"><button${attr_class(`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${stringify(isPrimary ? "bg-white border-white text-black" : "border-white/20 text-transparent hover:border-white/50")}`)} title="Set as Primary"><svg${attr_class(`h-3 w-3 ${stringify(isPrimary ? "opacity-100" : "opacity-0")}`)} fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></button> <button${attr_class(`w-5 h-5 flex items-center justify-center rounded transition-all ${stringify(isGhost ? "text-white" : "text-white/20 hover:text-white/50")}`)} title="Set as Ghost"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg></button></div> <div class="relative min-w-[150px] w-[150px] text-[10px] font-black uppercase overflow-hidden"${attr_style(`color: ${stringify(isPrimary ? "white" : "rgba(255,255,255,0.4)")}`)}><div class="flex flex-col justify-center transition-all duration-200 group-hover:-translate-y-full group-hover:opacity-0"><span class="truncate">${escape_html(timeline.name)}</span> <span class="text-[8px] text-white/30 tracking-widest mt-0.5">T${escape_html(startTick)} - T${escape_html(endTick)}</span></div> <div class="absolute inset-0 flex items-center gap-1.5 translate-y-full opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"><button class="flex flex-1 h-full items-center justify-center gap-1 rounded bg-white/5 border border-white/10 text-[9px] text-white/60 hover:bg-white/10 hover:text-white transition-all" title="Save Timeline Draft"><svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg> Save</button> <button class="flex flex-1 h-full items-center justify-center gap-1 rounded bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 text-[9px] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 transition-all" title="Load Library / Publish"><svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m16 6 4 14"></path><path d="M12 6v14"></path><path d="M8 8v12"></path><path d="M4 4v16"></path></svg> Library</button></div></div> <div class="relative flex-1 h-6 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center cursor-pointer group-hover:bg-white/10 transition-colors"><input type="range" min="0"${attr("max", maxTicks())}${attr("value", globalTick)} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"/> <div class="absolute h-full transition-all duration-300"${attr_style(`width: ${stringify((timeline.states.length - 1) / maxTicks() * 100)}%; background-color: ${stringify(isPrimary ? timeline.color : timeline.color + "44")}`)}></div> <div class="absolute top-0 bottom-0 w-px bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)] z-40 pointer-events-none transition-all duration-75"${attr_style(`left: ${stringify(globalTick / maxTicks() * 100)}%`)}></div> <!--[-->`);
			const each_array_1 = ensure_array_like([...timeline.blocks.A, ...timeline.blocks.B]);
			for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
				let block = each_array_1[$$index];
				if (block.startTick > 0) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="absolute top-0 bottom-0 border-l border-dashed border-white/40 z-20 pointer-events-none"${attr_style(`left: ${stringify(block.startTick / maxTicks() * 100)}%`)}></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--> `);
			if (isFinished) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="absolute right-0 h-full w-4 flex items-center justify-center bg-black/40 z-20 pointer-events-none border-l border-white/20"><span class="text-[8px]">🏁</span></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
		bind_props($$props, {
			activeTimelineId,
			ghostTimelineId,
			globalTick
		});
	});
}
//#endregion
//#region src/routes/team/[id]/film-room/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let teamId = derived(() => page.params.id);
		let replays = [];
		let selectedReplayId = null;
		let timelines = [];
		let activeTimelineId = null;
		let ghostTimelineId = null;
		let globalTick = 0;
		let isPlaying = false;
		let showControlMap = false;
		let baseTickRate = 750;
		let playSpeed = 750;
		let playbackInterval = null;
		let activeConfig = null;
		let isSimulating = false;
		let asideWidth = 450;
		let activeTab = "A";
		let teamCodes = {
			A: "",
			B: ""
		};
		let teamIds = {
			A: "",
			B: ""
		};
		let teamVersions = {
			A: [],
			B: []
		};
		let activeDraftIds = {
			A: "",
			B: ""
		};
		let isVersionBrowserOpen = false;
		let loadedMatch = null;
		let userTeamSlot = derived(() => loadedMatch?.away_team?.id === teamId() ? "B" : "A");
		let opponentTeamSlot = derived(() => loadedMatch?.away_team?.id === teamId() ? "A" : "B");
		let allTeams = [];
		let selectedOpponentId = null;
		let versionsOpponent = [];
		let selectedOpponentVersionId = null;
		let customSeed = Math.floor(Math.random() * 1e6);
		let isScratchpadModalOpen = false;
		let modalInputName = "";
		let modalSelectedOverwriteId = "";
		const STARTER_CODE = `import type { PlayerAction, SensedState } from '$packages/engine/team_api.ts';

export const teamLogic = (sense: SensedState): PlayerAction[] => {
	const actions: PlayerAction[] = [];
	const pointZone = sense.pointZones[0];

	if (!pointZone) return [];

	for (const player of sense.players) {
		if (player.status !== 'active') continue;

		const targetX = pointZone.position.x;
		const targetY = pointZone.position.y;
		const currentX = player.position.x;
		const currentY = player.position.y;

		let action: PlayerAction = { playerId: player.id, type: 'STAY' };

		// Starter Strategy: Direct path to Point Zone
		if (currentY < targetY) {
			action = { playerId: player.id, type: 'MOVE', direction: 'DOWN' };
		} else if (currentY > targetY) {
			action = { playerId: player.id, type: 'MOVE', direction: 'UP' };
		} else if (currentX < targetX) {
			action = { playerId: player.id, type: 'MOVE', direction: 'RIGHT' };
		} else if (currentX > targetX) {
			action = { playerId: player.id, type: 'MOVE', direction: 'LEFT' };
		}

		actions.push(action);
	}

	return actions;
};`;
		const setupInitialDraft = (team, tId, version) => {
			let draft = (store_get($$store_subs ??= {}, "$scratchpad", scratchpad)[tId] || []).find((d) => d.name === "Match Default" || d.name === "Autosave");
			if (!draft) {
				activeDraftIds[team] = scratchpad.addScratchpad(tId, "Match Default", version?.source_code || STARTER_CODE);
				teamCodes[team] = version?.source_code || STARTER_CODE;
			} else {
				activeDraftIds[team] = draft.id;
				teamCodes[team] = draft.code;
			}
		};
		async function loadMatchReplay(matchId) {
			stopPlayback();
			isSimulating = true;
			const { data: match, error } = await supabase.from("matches").select(`
				public_seed,
				league_id,
				home_code_version_id,
				away_code_version_id,
				leagues (protocol_version, protocol_config),
				seasons (protocol_version, protocol_config),
				home_team:teams!home_team_id (id, name, color, active_version_id),
				away_team:teams!away_team_id (id, name, color, active_version_id)
			`).eq("id", matchId).single();
			if (error || !match) {
				console.error("Error fetching match:", error);
				isSimulating = false;
				return;
			}
			loadedMatch = match;
			teamIds.A = match.home_team.id;
			teamIds.B = match.away_team.id;
			const { data: allVersions } = await supabase.from("team_code_versions").select("id, team_id, version_number, source_code, compiled_code, created_at").in("team_id", [teamIds.A, teamIds.B]).order("version_number", { ascending: false });
			if (allVersions) {
				teamVersions.A = allVersions.filter((v) => v.team_id === teamIds.A);
				teamVersions.B = allVersions.filter((v) => v.team_id === teamIds.B);
			}
			const matchHomeVersionId = match.home_code_version_id || match.home_team.active_version_id;
			const matchAwayVersionId = match.away_code_version_id || match.away_team.active_version_id;
			const homeV = teamVersions.A.find((v) => v.id === matchHomeVersionId) || teamVersions.A[0];
			const awayV = teamVersions.B.find((v) => v.id === matchAwayVersionId) || teamVersions.B[0];
			setupInitialDraft("A", teamIds.A, homeV);
			setupInitialDraft("B", teamIds.B, awayV);
			activeConfig = match.seasons?.protocol_config ?? match.leagues.protocol_config ?? {};
			baseTickRate = activeConfig.tickRateMs || 750;
			playSpeed = baseTickRate;
			customSeed = Number(match.public_seed);
			const computedOpponentSlot = match.away_team?.id === teamId() ? "A" : "B";
			selectedOpponentId = teamIds[computedOpponentSlot];
			if (selectedOpponentId) await loadOpponentVersions(selectedOpponentId);
			selectedOpponentVersionId = computedOpponentSlot === "A" ? matchHomeVersionId : matchAwayVersionId;
			timelines = [{
				id: "root",
				name: "Official Match",
				states: [createInitialState(customSeed, match.seasons?.protocol_version || match.leagues.protocol_version, activeConfig, {
					A: match.home_team,
					B: match.away_team
				})],
				color: "#3b82f6",
				parentId: null,
				blocks: {
					A: [{
						startTick: 0,
						endTick: null,
						code: homeV.source_code,
						compiled: homeV.compiled_code
					}],
					B: [{
						startTick: 0,
						endTick: null,
						code: awayV.source_code,
						compiled: awayV.compiled_code
					}]
				}
			}];
			activeTimelineId = "root";
			globalTick = 0;
			(activeConfig?.maxGameTicks || 100) + (activeConfig?.overtimeAllowed ? activeConfig?.pointZoneMaxAge || 40 : 0) + 100;
		}
		function togglePlayback() {
			if (isPlaying) stopPlayback();
			else startPlayback();
		}
		function startPlayback() {
			const activeTimeline = timelines.find((t) => t.id === activeTimelineId);
			if (!activeTimeline) return;
			if (globalTick >= activeTimeline.states.length - 1) globalTick = 0;
			isPlaying = true;
			playbackInterval = window.setInterval(() => {
				const currentActive = timelines.find((t) => t.id === activeTimelineId);
				if (currentActive && globalTick < currentActive.states.length - 1) globalTick++;
				else stopPlayback();
			}, playSpeed);
		}
		function stopPlayback() {
			isPlaying = false;
			if (playbackInterval) {
				clearInterval(playbackInterval);
				playbackInterval = null;
			}
		}
		function handleSelection(e) {
			selectedReplayId = e.target.value;
			if (selectedReplayId) loadMatchReplay(selectedReplayId);
		}
		async function loadOpponentVersions(oppTeamId) {
			const { data, error } = await supabase.from("team_code_versions").select("id, version_number, source_code, compiled_code, name").eq("team_id", oppTeamId).order("version_number", { ascending: false });
			if (!error && data) {
				versionsOpponent = data;
				if (data.length > 0 && !selectedOpponentVersionId) selectedOpponentVersionId = data[0].id;
			}
		}
		function handleOpponentChange() {
			if (selectedOpponentId) {
				selectedOpponentVersionId = null;
				loadOpponentVersions(selectedOpponentId);
			}
		}
		function stepForward() {
			stopPlayback();
			const activeTimeline = timelines.find((t) => t.id === activeTimelineId);
			if (activeTimeline && globalTick < activeTimeline.states.length - 1) globalTick++;
		}
		function stepBackward() {
			stopPlayback();
			if (globalTick > 0) globalTick--;
		}
		function selectDraft(team, draftId) {
			const draft = (store_get($$store_subs ??= {}, "$scratchpad", scratchpad)[teamIds[team]] || []).find((d) => d.id === draftId);
			if (draft) {
				activeDraftIds[team] = draftId;
				teamCodes[team] = draft.code;
				const activeTimeline = timelines.find((t) => t.id === activeTimelineId);
				if (activeTimeline) {
					const idx = timelines.findIndex((t) => t.id === activeTimeline.id);
					timelines[idx] = {
						...activeTimeline,
						name: draft.name,
						draftId: draft.id
					};
				}
			}
		}
		function loadVersionIntoDraft(team, version) {
			const teamId = teamIds[team];
			const code = version.source_code;
			teamCodes[team] = code;
			scratchpad.updateScratchpad(teamId, activeDraftIds[team], code);
			const activeTimeline = timelines.find((t) => t.id === activeTimelineId);
			if (activeTimeline) {
				const idx = timelines.findIndex((t) => t.id === activeTimeline.id);
				timelines[idx] = {
					...activeTimeline,
					name: `V${version.version_number} ${version.name ? `- ${version.name}` : ""}`
				};
			}
		}
		derived(() => activeTab === "REF" ? "" : teamCodes[activeTab]);
		let activeTimeline = derived(() => timelines.find((t) => t.id === activeTimelineId));
		let ghostTimeline = derived(() => timelines.find((t) => t.id === ghostTimelineId));
		let primaryState = derived(() => activeTimeline()?.states[globalTick] ?? timelines[0]?.states[globalTick]);
		let ghostState = derived(() => ghostTimeline()?.states[globalTick]);
		let currentProtocol = derived(() => primaryState() ? getProtocol(primaryState().protocolVersion) : null);
		derived(() => replays.find((r) => r.id === selectedReplayId));
		let activeTeamData = derived(() => activeTab === "A" ? loadedMatch?.home_team : loadedMatch?.away_team);
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (isVersionBrowserOpen && activeTab !== "REF") {
				$$renderer.push("<!--[0-->");
				VersionBrowser($$renderer, {
					teamId: teamIds[activeTab],
					teamName: activeTeamData()?.name || "Team",
					teamColor: activeTeamData()?.color || "#ffffff",
					versions: teamVersions[activeTab],
					drafts: store_get($$store_subs ??= {}, "$scratchpad", scratchpad)[teamIds[activeTab]] || [],
					activeDraftId: activeDraftIds[activeTab],
					matchVersionId: activeTab === "A" ? loadedMatch?.home_code_version_id : loadedMatch?.away_code_version_id,
					officialVersionId: activeTeamData()?.active_version_id,
					onLoadVersion: (v) => {
						loadVersionIntoDraft(activeTab, v);
						isVersionBrowserOpen = false;
					},
					onSelectDraft: (id) => {
						selectDraft(activeTab, id);
						isVersionBrowserOpen = false;
					},
					onDeleteDraft: (id) => scratchpad.deleteScratchpad(teamIds[activeTab], id),
					onClose: () => isVersionBrowserOpen = false
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 selection:bg-[var(--color-brand-primary)]/30 font-sans"><aside class="flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl"${attr_style(`width: ${stringify(asideWidth)}px`)}><header class="flex h-14 items-center justify-between border-b border-white/5 px-6"><div class="flex items-center gap-6"><button${attr_class(`group relative flex flex-col pt-1 transition-all ${stringify(activeTab === userTeamSlot() ? "text-white" : "text-white/20 hover:text-white/40")}`)}><div class="flex items-center gap-2"><span class="text-[10px] font-black uppercase tracking-widest">${escape_html(loadedMatch?.[userTeamSlot() === "A" ? "home_team" : "away_team"]?.name || "Home")}</span> `);
			if (activeTab === userTeamSlot()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button class="opacity-40 transition-all hover:opacity-100 hover:text-[var(--color-brand-primary)]" aria-label="Open Version Browser"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-library"><path d="m16 6 4 14"></path><path d="M12 6v14"></path><path d="M8 8v12"></path><path d="M4 4v16"></path></svg></button>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> `);
			if (activeTab === userTeamSlot()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="absolute -bottom-[15px] left-0 h-0.5 w-full"${attr_style(`background-color: ${stringify(loadedMatch?.[userTeamSlot() === "A" ? "home_team" : "away_team"]?.color || "#3b82f6")}`)}></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></button> <button${attr_class(`group relative flex flex-col pt-1 transition-all ${stringify(activeTab === opponentTeamSlot() ? "text-white" : "text-white/20 hover:text-white/40")}`)}><div class="flex items-center gap-2"><span class="text-[10px] font-black uppercase tracking-widest">${escape_html(loadedMatch?.[opponentTeamSlot() === "A" ? "home_team" : "away_team"]?.name || "Away")}</span> <svg class="h-3 w-3 opacity-30" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></svg></div> `);
			if (activeTab === opponentTeamSlot()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="absolute -bottom-[15px] left-0 h-0.5 w-full"${attr_style(`background-color: ${stringify(loadedMatch?.[opponentTeamSlot() === "A" ? "home_team" : "away_team"]?.color || "#f43f5e")}`)}></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></button> <button${attr_class(`relative pt-1 text-[10px] font-black uppercase tracking-widest transition-all ${stringify(activeTab === "REF" ? "text-white" : "text-white/20 hover:text-white/40")}`)}>REF `);
			if (activeTab === "REF") {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="absolute -bottom-[15px] left-0 h-0.5 w-full bg-emerald-500"></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></button></div></header> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="flex-1 overflow-y-auto no-scrollbar flex flex-col p-4 svelte-z9si4n">`);
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
				$$renderer.push(`<div class="flex-1 w-full bg-[#1e1e1e] relative min-h-0 overflow-hidden rounded-xl border border-white/5 shadow-inner">`);
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--></div> <footer class="border-t border-white/5 p-4 text-[10px] text-white/20 font-medium italic">* Editing code will branch the simulation from the current tick.</footer></aside> <div class="w-1 cursor-col-resize bg-zinc-800/50 transition-colors hover:bg-emerald-500/50 active:bg-emerald-500" role="separator"></div> <main class="flex flex-1 flex-col p-6 lg:p-10 bg-[var(--color-background-dark)]"><header class="mb-12 flex items-center justify-between"><div class="flex items-center gap-8"><div class="inline-flex flex-col rounded-2xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl"><div class="flex items-center gap-4"><button class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md" aria-label="Go Back"><svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></button> <div class="flex flex-col"><h1 class="text-xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">Film <span class="text-[var(--color-brand-primary)]">Room</span></h1> <p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Replay &amp; Branching</p></div></div></div></div> <div class="flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border border-white/5 shadow-xl backdrop-blur-md"><span class="h-1.5 w-1.5 rounded-full animate-pulse bg-[var(--color-brand-primary)] shadow-[0_0_8px_var(--color-brand-primary)]"></span> Live Analysis</div></header> `);
			if (primaryState()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden min-h-0"><div class="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden p-4">`);
				ReplayGrid($$renderer, {
					primaryState: primaryState(),
					ghostState: ghostState(),
					playSpeed,
					showControlMap
				});
				$$renderer.push(`<!----></div> `);
				TimelineManager($$renderer, {
					timelines,
					isPlaying,
					onTogglePlay: togglePlayback,
					onStepForward: stepForward,
					onStepBackward: stepBackward,
					onSave: (timelineId) => {
						activeTimelineId = timelineId;
						modalSelectedOverwriteId = timelines.find((t) => t.id === timelineId)?.draftId || null;
						isScratchpadModalOpen = true;
					},
					onLoad: (timelineId) => {
						activeTimelineId = timelineId;
						isVersionBrowserOpen = true;
					},
					get activeTimelineId() {
						return activeTimelineId;
					},
					set activeTimelineId($$value) {
						activeTimelineId = $$value;
						$$settled = false;
					},
					get ghostTimelineId() {
						return ghostTimelineId;
					},
					set ghostTimelineId($$value) {
						ghostTimelineId = $$value;
						$$settled = false;
					},
					get globalTick() {
						return globalTick;
					},
					set globalTick($$value) {
						globalTick = $$value;
						$$settled = false;
					}
				});
				$$renderer.push(`<!----></div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="flex flex-1 items-center justify-center italic text-white/20 font-black uppercase tracking-widest text-sm"><span class="animate-pulse">Decoding replay buffer...</span></div>`);
			}
			$$renderer.push(`<!--]--></main> <aside class="flex w-80 flex-col border-l border-white/5 bg-black/20 p-6 backdrop-blur-3xl lg:p-8"><div class="mb-10 flex flex-col gap-4 relative"><label class="block text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">Scenario Configuration</label> <div class="space-y-3"><div><label class="mb-1.5 block text-[8px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Target Opponent</label> `);
			$$renderer.select({
				value: selectedOpponentId,
				onchange: handleOpponentChange,
				class: "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50 transition-all cursor-pointer"
			}, ($$renderer) => {
				$$renderer.option({ value: null }, ($$renderer) => {
					$$renderer.push(`Select opponent...`);
				});
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(allTeams);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let team = each_array[$$index];
					$$renderer.option({ value: team.id }, ($$renderer) => {
						$$renderer.push(`${escape_html(team.name)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			});
			$$renderer.push(`</div> <div><label class="mb-1.5 block text-[8px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Opponent Version</label> `);
			$$renderer.select({
				value: selectedOpponentVersionId,
				disabled: !selectedOpponentId,
				class: "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50 transition-all cursor-pointer disabled:opacity-50"
			}, ($$renderer) => {
				if (versionsOpponent.length === 0) {
					$$renderer.push("<!--[0-->");
					$$renderer.option({ value: null }, ($$renderer) => {
						$$renderer.push(`${escape_html(selectedOpponentId ? "Loading..." : "Select team first")}`);
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--><!--[-->`);
				const each_array_1 = ensure_array_like(versionsOpponent);
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let v = each_array_1[$$index_1];
					$$renderer.option({ value: v.id }, ($$renderer) => {
						$$renderer.push(`V${escape_html(v.version_number)} ${escape_html(v.name ? `- ${v.name}` : "")}`);
					});
				}
				$$renderer.push(`<!--]-->`);
				if (selectedOpponentId && store_get($$store_subs ??= {}, "$scratchpad", scratchpad)[selectedOpponentId]) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<optgroup label="Local Drafts"><!--[-->`);
					const each_array_2 = ensure_array_like(store_get($$store_subs ??= {}, "$scratchpad", scratchpad)[selectedOpponentId]);
					for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
						let draft = each_array_2[$$index_2];
						$$renderer.option({ value: draft.id }, ($$renderer) => {
							$$renderer.push(`Draft: ${escape_html(draft.name)}`);
						});
					}
					$$renderer.push(`<!--]--></optgroup>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			});
			$$renderer.push(`</div> <div class="flex items-end gap-3"><div class="flex-1"><label class="mb-1.5 block text-[8px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">Match Seed</label> <input type="number"${attr("value", customSeed)} class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-mono font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50 transition-all"/></div> <button${attr("disabled", !selectedOpponentId || !selectedOpponentVersionId || isSimulating, true)} class="rounded-xl bg-[var(--color-brand-primary)] px-4 py-3 text-xs font-black uppercase tracking-widest text-[var(--color-background-dark)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0">Load</button></div></div> `);
			if (replays.length > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="mt-4 pt-4 border-t border-white/5"><label class="mb-1.5 block text-[8px] font-black uppercase tracking-widest text-white/30">Quick Load Official Match</label> `);
				$$renderer.select({
					value: selectedReplayId,
					onchange: handleSelection,
					class: "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-[10px] font-bold text-white/60 outline-none focus:border-white/20 transition-all cursor-pointer"
				}, ($$renderer) => {
					$$renderer.option({ value: null }, ($$renderer) => {
						$$renderer.push(`Select recent match...`);
					});
					$$renderer.push(`<!--[-->`);
					const each_array_3 = ensure_array_like(replays);
					for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
						let replay = each_array_3[$$index_3];
						$$renderer.option({ value: replay.id }, ($$renderer) => {
							$$renderer.push(`${escape_html(replay.home_team.name)} vs ${escape_html(replay.away_team.name)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				});
				$$renderer.push(`</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="flex-1 flex flex-col min-h-0 space-y-6"><section class="space-y-4 flex-shrink-0"><h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Match Analysis</h3> <div class="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-inner"><div class="mb-1 text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-wider">Elapsed Ticks</div> <div class="text-3xl font-black tracking-tighter text-white">${escape_html(globalTick)} <span class="text-white/10">/ ${escape_html(activeTimeline() ? activeTimeline().states.length - 1 : 0)}</span></div></div> <div class="grid grid-cols-2 gap-3"><div class="rounded-2xl border bg-black/20 p-4 shadow-inner"${attr_style(`border-color: ${stringify(primaryState()?.teams.A.color)}22`)}><div class="mb-1 text-[9px] font-black uppercase tracking-wider"${attr_style(`color: ${stringify(primaryState()?.teams.A.color)}`)}>${escape_html(primaryState()?.teams.A.name)}</div> <div class="text-2xl font-black text-white">${escape_html(primaryState()?.teams.A.score ?? 0)}</div> <div class="mt-2 text-[8px] font-black text-white/10 uppercase tracking-widest">Avg ${escape_html(primaryState()?.teams.A.stats.averagePointsPerCapture.toFixed(2))} pts/cap</div></div> <div class="rounded-2xl border bg-black/20 p-4 shadow-inner"${attr_style(`border-color: ${stringify(primaryState()?.teams.B.color)}22`)}><div class="mb-1 text-[9px] font-black uppercase tracking-wider"${attr_style(`color: ${stringify(primaryState()?.teams.B.color)}`)}>${escape_html(primaryState()?.teams.B.name)}</div> <div class="text-2xl font-black text-white">${escape_html(primaryState()?.teams.B.score ?? 0)}</div> <div class="mt-2 text-[8px] font-black text-white/10 uppercase tracking-widest">Avg ${escape_html(primaryState()?.teams.B.stats.averagePointsPerCapture.toFixed(2))} pts/cap</div></div></div></section> <section class="flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--color-brand-primary)]/10 bg-[var(--color-brand-primary)]/5 p-5"><div class="mb-4 flex items-center justify-between flex-shrink-0"><h4 class="text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Live Data</h4> <span class="text-[8px] font-bold text-[var(--color-brand-primary)]/40 uppercase tracking-widest">Tick ${escape_html(globalTick)}</span></div> <div class="flex-1 overflow-y-auto no-scrollbar svelte-z9si4n">`);
			if (primaryState()) {
				$$renderer.push("<!--[0-->");
				StateInspector_1($$renderer, { data: primaryState() });
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></section></div></aside></div> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (isScratchpadModalOpen) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40"><div class="absolute inset-0"></div> <div class="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0c] p-8 shadow-[0_0_80px_rgba(0,0,0,0.5)]"><div class="relative z-10 space-y-6"><header><h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-brand-primary)] mb-2">Save Scratchpad</h2> <div class="space-y-4"><div><label class="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Save as New Draft</label> <input type="text"${attr("value", modalInputName)} placeholder="Enter draft name..." class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white placeholder-white/20 outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]"/></div> <div class="relative flex items-center py-2"><div class="flex-grow border-t border-white/10"></div> <span class="flex-shrink-0 mx-4 text-[10px] font-black uppercase text-white/20">OR</span> <div class="flex-grow border-t border-white/10"></div></div> <div><label class="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Overwrite Existing</label> `);
				$$renderer.select({
					value: modalSelectedOverwriteId,
					onchange: () => modalInputName = "",
					class: "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] appearance-none"
				}, ($$renderer) => {
					$$renderer.option({ value: "" }, ($$renderer) => {
						$$renderer.push(`-- Select draft to overwrite --`);
					});
					$$renderer.push(`<!--[-->`);
					const each_array_4 = ensure_array_like(store_get($$store_subs ??= {}, "$scratchpad", scratchpad)[teamIds[activeTab]] || []);
					for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
						let draft = each_array_4[$$index_4];
						$$renderer.option({ value: draft.id }, ($$renderer) => {
							$$renderer.push(`${escape_html(draft.name)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				});
				$$renderer.push(`</div></div></header> <footer class="flex items-center justify-end gap-3 pt-4"><button class="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">Cancel</button> <button class="px-8 py-3 rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Save</button></footer></div></div></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
