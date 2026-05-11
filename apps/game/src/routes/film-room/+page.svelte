<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount, onDestroy, untrack } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { createInitialState } from '$packages/engine/core';
	import { getProtocol } from '$packages/protocols/registry';
	import type { GameState } from '$packages/engine/types';
	import ReplayGrid from '$lib/components/ReplayGrid.svelte';
	import StateInspector from '$lib/components/StateInspector.svelte';
	import SimWorker from '$lib/workers/sim.worker?worker';
	import { fade } from 'svelte/transition';
	import { scratchpad } from '$lib/stores/scratchpad';
	import VersionBrowser from '$lib/components/VersionBrowser.svelte';
	import TimelineManager from '$lib/components/TimelineManager.svelte';

	import type { CodeBlock, Timeline } from '$lib/types/film-room';

	type MatchItem = { id: string, home_team: { name: string, color: string }, away_team: { name: string, color: string } };
	let replays = $state<MatchItem[]>([]);
	let selectedReplayId = $state<string | null>(null);

	let timelines = $state<Timeline[]>([]);
	let activeTimelineId = $state<string | null>(null);
	let ghostTimelineId = $state<string | null>(null);
	let globalTick = $state(0);
	let isPlaying = $state(false);
	let showControlMap = $state(false);
	let baseTickRate = $state(750);
	let playSpeed = $state(750);
	let playbackInterval: number | null = null;
	let activeConfig = $state<any>(null);
	
	// UI State
	let isLibraryOpen = $state(false);
	let isSpeedOpen = $state(false);
	
	// Simulation Worker state
	let Editor: any = $state();
	let simWorker: Worker | null = null;
	let isSimulating = $state(false);
	let errorMessage = $state<string | null>(null);
	let simulationDebounceTimer: number | null = null;

	// Layout State
	let asideWidth = $state(450);
	let isResizing = $state(false);

	// Logic Editing State
	let activeTab = $state<'A' | 'B' | 'REF'>('A');
	let teamCodes = $state({ A: '', B: '' });
	let teamIds = $state({ A: '', B: '' });
	let teamVersions = $state({ A: [] as any[], B: [] as any[] });
	let activeDraftIds = $state({ A: '', B: '' }); // Points to IDs in the scratchpad store
	let isVersionBrowserOpen = $state(false);
	let loadedMatch = $state<any>(null);

	// Custom Modal State
	let isPublishModalOpen = $state(false);
	let isScratchpadModalOpen = $state(false);
	let modalInputName = $state('');
	let modalSelectedOverwriteId = $state('');

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

	// Auto-sync removed for version switcher

	// Removed loadReplay since we use loadMatchReplay exclusively now.

	async function loadMatchReplay(matchId: string) {
		stopPlayback();
		isSimulating = true;
		
		const { data: match, error } = await supabase
			.from('matches')
			.select(`
				public_seed,
				league_id,
				home_code_version_id,
				away_code_version_id,
				leagues (protocol_version, protocol_config),
				seasons (protocol_version, protocol_config),
				home_team:teams!home_team_id (id, name, color, active_version_id),
				away_team:teams!away_team_id (id, name, color, active_version_id)
			`)
			.eq('id', matchId)
			.single();

		if (error || !match) {
			console.error('Error fetching match:', error);
			isSimulating = false;
			return;
		}

		// @ts-ignore
		loadedMatch = match;
		// @ts-ignore
		teamIds.A = match.home_team.id;
		// @ts-ignore
		teamIds.B = match.away_team.id;

		// Fetch historical versions for both teams
		const { data: allVersions } = await supabase
			.from('team_code_versions')
			.select('id, team_id, version_number, source_code, compiled_code, created_at')
			.in('team_id', [teamIds.A, teamIds.B])
			.order('version_number', { ascending: false });

		if (allVersions) {
			teamVersions.A = allVersions.filter(v => v.team_id === teamIds.A);
			teamVersions.B = allVersions.filter(v => v.team_id === teamIds.B);
		}

		// @ts-ignore
		const matchHomeVersionId = match.home_code_version_id || match.home_team.active_version_id;
		// @ts-ignore
		const matchAwayVersionId = match.away_code_version_id || match.away_team.active_version_id;

		const homeV = teamVersions.A.find(v => v.id === matchHomeVersionId) || teamVersions.A[0];
		const awayV = teamVersions.B.find(v => v.id === matchAwayVersionId) || teamVersions.B[0];

		// Populate initial drafts if they don't exist, or load the match version into a "Match Default" draft
		const setupInitialDraft = (team: 'A' | 'B', teamId: string, version: any) => {
			const existingDrafts = $scratchpad[teamId] || [];
			let draft = existingDrafts.find(d => d.name === 'Match Default' || d.name === 'Autosave');
			
			if (!draft) {
				const id = scratchpad.addScratchpad(teamId, 'Match Default', version?.source_code || STARTER_CODE);
				activeDraftIds[team] = id;
				teamCodes[team] = version?.source_code || STARTER_CODE;
			} else {
				activeDraftIds[team] = draft.id;
				teamCodes[team] = draft.code;
			}
		};

		setupInitialDraft('A', teamIds.A, homeV);
		setupInitialDraft('B', teamIds.B, awayV);
		
		// @ts-ignore
		activeConfig = match.seasons?.protocol_config ?? match.leagues.protocol_config ?? {};
		baseTickRate = activeConfig.tickRateMs || 750;
		playSpeed = baseTickRate;

		// @ts-ignore
		const initialState = createInitialState(Number(match.public_seed), match.seasons?.protocol_version || match.leagues.protocol_version, activeConfig, {
			A: match.home_team,
			B: match.away_team
		});

		const rootTimeline: Timeline = {
			id: 'root',
			name: 'Official Match',
			states: [initialState],
			color: '#3b82f6', // generic blue for root
			parentId: null,
			blocks: {
				A: [{ startTick: 0, endTick: null, code: homeV.source_code, compiled: homeV.compiled_code }],
				B: [{ startTick: 0, endTick: null, code: awayV.source_code, compiled: awayV.compiled_code }]
			}
		};

		timelines = [rootTimeline];
		activeTimelineId = 'root';
		globalTick = 0;

		const maxTicks = (activeConfig?.maxGameTicks || 100) + (activeConfig?.overtimeAllowed ? (activeConfig?.pointZoneMaxAge || 40) : 0) + 100;

		if (simWorker) {
			simWorker.postMessage({
				type: 'SIMULATE_BRANCH',
				timelineId: 'root',
				startState: JSON.parse(JSON.stringify(initialState)),
				alphaBlocks: rootTimeline.blocks.A,
				bravoBlocks: rootTimeline.blocks.B,
				maxTicks,
				config: activeConfig ? JSON.parse(JSON.stringify(activeConfig)) : undefined
			});
		}
	}

	function togglePlayback() {
		if (isPlaying) stopPlayback();
		else startPlayback();
	}

	function startPlayback() {
		const activeTimeline = timelines.find(t => t.id === activeTimelineId);
		if (!activeTimeline) return;
		
		if (globalTick >= activeTimeline.states.length - 1) globalTick = 0;
		isPlaying = true;
		playbackInterval = window.setInterval(() => {
			const currentActive = timelines.find(t => t.id === activeTimelineId);
			if (currentActive && globalTick < currentActive.states.length - 1) {
				globalTick++;
			} else {
				stopPlayback();
			}
		}, playSpeed);
	}

	function stopPlayback() {
		isPlaying = false;
		if (playbackInterval) {
			clearInterval(playbackInterval);
			playbackInterval = null;
		}
	}

	function handleSelection(e: Event) {
		const target = e.target as HTMLSelectElement;
		selectedReplayId = target.value;
		if (selectedReplayId) {
			loadMatchReplay(selectedReplayId);
		}
	}

	function stepForward() {
		stopPlayback();
		const activeTimeline = timelines.find(t => t.id === activeTimelineId);
		if (activeTimeline && globalTick < activeTimeline.states.length - 1) {
			globalTick++;
		}
	}

	function stepBackward() {
		stopPlayback();
		if (globalTick > 0) globalTick--;
	}

	function startResizing(e: MouseEvent) {
		isResizing = true;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isResizing) return;
		asideWidth = Math.max(300, Math.min(800, e.clientX));
	}

	function stopResizing() {
		isResizing = false;
	}

	function selectDraft(team: 'A' | 'B', draftId: string) {
		const draft = ($scratchpad[teamIds[team]] || []).find(d => d.id === draftId);
		if (draft) {
			activeDraftIds[team] = draftId;
			teamCodes[team] = draft.code;
			
			const activeTimeline = timelines.find(t => t.id === activeTimelineId);
			if (activeTimeline) {
				const idx = timelines.findIndex(t => t.id === activeTimeline.id);
				timelines[idx] = { ...activeTimeline, name: draft.name, draftId: draft.id };
			}

			if (simulationDebounceTimer) clearTimeout(simulationDebounceTimer);
			autosaveAndSimulate();
		}
	}

	function loadVersionIntoDraft(team: 'A' | 'B', version: any) {
		const teamId = teamIds[team];
		const code = version.source_code;
		
		// Update the active draft with this code.
		teamCodes[team] = code;
		scratchpad.updateScratchpad(teamId, activeDraftIds[team], code);
		
		const activeTimeline = timelines.find(t => t.id === activeTimelineId);
		if (activeTimeline) {
			const idx = timelines.findIndex(t => t.id === activeTimeline.id);
			timelines[idx] = { ...activeTimeline, name: `V${version.version_number} ${version.name ? `- ${version.name}` : ''}` };
		}
		
		if (simulationDebounceTimer) clearTimeout(simulationDebounceTimer);
		autosaveAndSimulate();
	}

	function handleCodeChange(newCode: string) {
		if (activeTab === 'REF') return;
		teamCodes[activeTab] = newCode;
		
		// Sync to the active scratchpad immediately so we don't lose work
		const draftId = activeDraftIds[activeTab];
		if (draftId) {
			scratchpad.updateScratchpad(teamIds[activeTab], draftId, newCode);
		}

		// Debounce simulation/autosave
		if (simulationDebounceTimer) clearTimeout(simulationDebounceTimer);
		simulationDebounceTimer = window.setTimeout(() => {
			autosaveAndSimulate();
		}, 1500);
	}



	function smartSave() {
		if (activeTab === 'REF') return;
		const teamId = teamIds[activeTab as 'A' | 'B'];
		const draftId = activeDraftIds[activeTab as 'A' | 'B'];
		const draft = ($scratchpad[teamId] || []).find(d => d.id === draftId);
		
		if (draft && draft.name !== 'Match Default' && draft.name !== 'Autosave') {
			// Silent save to existing named draft
			scratchpad.updateScratchpad(teamId, draftId, teamCodes[activeTab as 'A' | 'B']);
			// Show a brief toast or notification if available, otherwise just silent
		} else {
			// Open modal to name/save new draft
			modalInputName = `Draft ${new Date().toLocaleDateString()}`;
			modalSelectedOverwriteId = '';
			isScratchpadModalOpen = true;
		}
	}

	let currentLogicCode = $derived(activeTab === 'REF' ? '' : teamCodes[activeTab as 'A' | 'B']);

	import { modal } from '$lib/stores/modal';

	async function executePublish() {
		if (activeTab === 'REF') return;
		
		const matchId = page.url.searchParams.get('match');
		if (!matchId) {
			modal.alert('Action Required', 'You must be viewing a specific match to publish logic for a team.');
			return;
		}

		isPublishModalOpen = false;
		isSimulating = true;
		
		try {
			// 1. Get the team ID from the match
			const { data: match, error: matchError } = await supabase
				.from('matches')
				.select(`
					home_team_id,
					away_team_id
				`)
				.eq('id', matchId)
				.single();

			if (matchError || !match) throw new Error('Could not find match team data');

			const teamId = activeTab === 'A' ? match.home_team_id : match.away_team_id;
			const code = teamCodes[activeTab];

			// 2. Transpile
			const cleanedCode = code
				.replace(/import\s+[\s\S]*?;/g, '') // Remove imports
				.replace(/export\s+type\s+[\s\S]*?;/g, '') // Remove export types
				.replace(/export\s+interface\s+[\s\S]*?\{[\s\S]*?\}/g, '') // Remove export interfaces
				.replace(/:\s*[A-Z][a-zA-Z0-9<>[\]]*/g, '') // Naive TS type stripping
				.replace(/:\s*(string|number|boolean|any|void|unknown|never)[\s\[\]]*(?=\s*[,)])/g, '') // Strip primitive types
				.replace(/:\s*(["'][^"']*["']\s*\|\s*)+["'][^"']*["'](?=\s*[,)])/g, '') // Strip string union literals
				.replace(/export\s+const\s+([a-zA-Z0-9_]+)/g, 'const $1 = exports.$1') // Convert any export const
				.replace(/export\s+function\s+([a-zA-Z0-9_]+)/g, 'exports.$1 = function $1') // Convert any export function
				.replace(/export\s+default\s+/g, 'exports.default = ') // Remove export default
				.replace(/\bexport\s+/g, '') // Final catch-all for any remaining exports
				.trim();
			
			const compiledCode = `
				const module = { exports: {} };
				const exports = module.exports;
				${cleanedCode};
				
				let logic;
				if (typeof teamLogic !== 'undefined') logic = teamLogic;
				else if (typeof greedyLogic !== 'undefined') logic = greedyLogic;
				else {
					const keys = Object.keys(exports);
					if (keys.length > 0) logic = exports[keys[0]];
				}
				
				if (!logic) throw new Error("No logic function found.");
				return logic(sense);
			`;

			// 3. Get next version number
			const { data: versions, error: vError } = await supabase
				.from('team_code_versions')
				.select('version_number')
				.eq('team_id', teamId)
				.order('version_number', { ascending: false })
				.limit(1);

			const nextVersion = (versions?.[0]?.version_number ?? 0) + 1;

			// 4. Insert new version
			const { data: newV, error: insError } = await supabase
				.from('team_code_versions')
				.insert({
					team_id: teamId,
					version_number: nextVersion,
					source_code: code,
					compiled_code: compiledCode,
					name: modalInputName || null
				})
				.select()
				.single();

			if (insError) throw insError;

			// 5. Update team's active version
			const { error: updError } = await supabase
				.from('teams')
				.update({ active_version_id: newV.id })
				.eq('id', teamId);

			if (updError) throw updError;
			
			// 6. Refresh UI versions
			const { data: allVersions } = await supabase
				.from('team_code_versions')
				.select('id, team_id, version_number, source_code, compiled_code, created_at, name')
				.eq('team_id', teamId)
				.order('version_number', { ascending: false });
			if (allVersions) {
				teamVersions[activeTab] = allVersions;
				// After publishing, we stay on the current draft, but it's now synced with the latest version.
				// Or should we clear the draft? Let's just keep it as is.
			}

			modal.alert('Success', `Team ${activeTab === 'A' ? 'Alpha' : 'Bravo'} logic updated to version ${nextVersion}.`);
		} catch (err: any) {
			console.error('Publish Error:', err);
			modal.alert('Error', `Failed to publish: ${err.message}`);
		} finally {
			isSimulating = false;
		}
	}

	function executeSaveScratchpad() {
		if (activeTab === 'REF') return;
		isScratchpadModalOpen = false;
		const teamId = teamIds[activeTab];
		const draftName = modalInputName || 'Untitled Draft';
		const validTab = activeTab as 'A' | 'B';

		if (modalSelectedOverwriteId) {
			scratchpad.updateScratchpad(teamId, modalSelectedOverwriteId, teamCodes[validTab]);
			activeDraftIds[validTab] = modalSelectedOverwriteId;
		} else {
			const newId = scratchpad.addScratchpad(teamId, draftName, teamCodes[validTab]);
			activeDraftIds[validTab] = newId;
		}

		// Update timeline name to match the saved draft
		const activeTimeline = timelines.find(t => t.id === activeTimelineId);
		if (activeTimeline) {
			const draft = ($scratchpad[teamId] || []).find(d => d.id === activeDraftIds[validTab]);
			if (draft) {
				const idx = timelines.findIndex(t => t.id === activeTimeline.id);
				timelines[idx] = { ...activeTimeline, name: draft.name, draftId: draft.id };
			}
		}
	}

	function autosaveAndSimulate() {
		if (!simWorker) return;
		const activeTimeline = timelines.find(t => t.id === activeTimelineId);
		if (!activeTimeline || activeTimeline.states.length === 0) return;
		
		isSimulating = true;
		const editingTeam = activeTab as 'A' | 'B';
		const teamId = teamIds[editingTeam];
		
		let targetTimeline: Timeline;
		let branchTick = globalTick;

		if (activeTimelineId === 'root') {
			// Branching from official match: Create a new Autosave timeline
			const newTimelineId = crypto.randomUUID();
			
			// Auto-create or get an Autosave draft
			const existingDrafts = $scratchpad[teamId] || [];
			let draft = existingDrafts.find(d => d.name === 'Autosave');
			if (!draft) {
				const id = scratchpad.addScratchpad(teamId, 'Autosave', teamCodes[editingTeam]);
				activeDraftIds[editingTeam] = id;
			} else {
				scratchpad.updateScratchpad(teamId, draft.id, teamCodes[editingTeam]);
				activeDraftIds[editingTeam] = draft.id;
			}

			targetTimeline = {
				id: newTimelineId,
				name: `Autosave`,
				draftId: activeDraftIds[editingTeam],
				states: activeTimeline.states.slice(0, branchTick), // Inherit up to branchTick
				color: activeTab === 'A' ? '#10b981' : '#f43f5e', // Emerald or Rose
				parentId: activeTimeline.id,
				blocks: {
					A: [...activeTimeline.blocks.A],
					B: [...activeTimeline.blocks.B]
				}
			};

			// Splice in the new code block
			targetTimeline.blocks[editingTeam] = targetTimeline.blocks[editingTeam].map(b => {
				if (b.startTick <= branchTick && (b.endTick === null || b.endTick > branchTick)) {
					return { ...b, endTick: branchTick };
				}
				return b;
			}).filter(b => b.startTick < branchTick);

			targetTimeline.blocks[editingTeam].push({
				startTick: branchTick,
				endTick: null,
				code: teamCodes[editingTeam]
			});
			
			timelines = [...timelines, targetTimeline];
			activeTimelineId = newTimelineId;
			
		} else {
			// Editing an existing draft timeline: Update it in-place
			targetTimeline = activeTimeline;
			
			// Find the branch tick (the start of the LAST block for the editing team)
			const blocks = targetTimeline.blocks[editingTeam];
			const lastBlock = blocks[blocks.length - 1];
			branchTick = lastBlock ? lastBlock.startTick : 0;
			
			// Truncate states back to the branch point
			targetTimeline.states = targetTimeline.states.slice(0, branchTick);
			
			// Update the code of the last block
			if (lastBlock) {
				lastBlock.code = teamCodes[editingTeam];
			} else {
				targetTimeline.blocks[editingTeam].push({
					startTick: 0,
					endTick: null,
					code: teamCodes[editingTeam]
				});
			}

			// Force Svelte to recognize the timeline update
			const idx = timelines.findIndex(t => t.id === targetTimeline.id);
			if (idx !== -1) {
				timelines[idx] = { ...targetTimeline };
				targetTimeline = timelines[idx];
			}
		}

		const maxTicks = (activeConfig?.maxGameTicks || 100) + (activeConfig?.overtimeAllowed ? (activeConfig?.pointZoneMaxAge || 40) : 0) + 100;
		const safeTick = branchTick === 0 ? 0 : branchTick - 1;
		const startState = targetTimeline.states[safeTick] || targetTimeline.states[0];

		simWorker.postMessage({
			type: 'SIMULATE_BRANCH',
			timelineId: targetTimeline.id,
			startState: JSON.parse(JSON.stringify($state.snapshot(startState))),
			alphaBlocks: JSON.parse(JSON.stringify($state.snapshot(targetTimeline.blocks.A))),
			bravoBlocks: JSON.parse(JSON.stringify($state.snapshot(targetTimeline.blocks.B))),
			maxTicks: Math.max(0, maxTicks - branchTick),
			config: activeConfig ? JSON.parse(JSON.stringify(activeConfig)) : undefined
		});
	}

	onMount(async () => {
		if (browser) {
			// Initialize Worker
			simWorker = new SimWorker();
			simWorker.onmessage = (e) => {
				if (e.data.type === 'SIMULATION_COMPLETE') {
					const { timelineId, states: newBranch } = e.data;
					const idx = timelines.findIndex(t => t.id === timelineId);
					if (idx !== -1) {
						// Append the new branch states. The worker returns [startState, ...newStates]
						// We already have up to globalTick in our array, so we append the rest.
						const updated = { ...timelines[idx] };
						updated.states = [...updated.states, ...newBranch.slice(1)];
						timelines[idx] = updated;
					}
					isSimulating = false;
					errorMessage = null;
					
					// Auto-play if it's a fresh match load
					if (globalTick === 0) startPlayback();
				} else if (e.data.type === 'SIMULATION_ERROR') {
					console.error('Simulation Error:', e.data.error);
					errorMessage = e.data.error;
					isSimulating = false;
				}
			};

			// Fetch available replays first
			const { data: recentMatches } = await supabase
				.from('matches')
				.select(`id, home_team:teams!home_team_id (name, color), away_team:teams!away_team_id (name, color)`)
				.in('status', ['played', 'simulated', 'simmed'])
				.order('scheduled_time', { ascending: false })
				.limit(10);
				
			if (recentMatches && recentMatches.length > 0) {
				// @ts-ignore
				replays = recentMatches;
			}

			const matchId = page.url.searchParams.get('match');
			if (matchId) {
				selectedReplayId = matchId;
				await loadMatchReplay(matchId);
			} else if (replays.length > 0) {
				selectedReplayId = replays[0].id;
				await loadMatchReplay(replays[0].id);
			}

			// Initialize Editor
			Editor = (await import('$lib/components/Editor.svelte')).default;
		}
	});
	
	// Client-side cleanup only
	$effect(() => {
		return () => {
			stopPlayback();
			if (simWorker) simWorker.terminate();
		};
	});
	let activeTimeline = $derived(timelines.find(t => t.id === activeTimelineId));
	let ghostTimeline = $derived(timelines.find(t => t.id === ghostTimelineId));
	let primaryState = $derived(activeTimeline?.states[globalTick] ?? timelines[0]?.states[globalTick]);
	let ghostState = $derived(ghostTimeline?.states[globalTick]);
	
	// Editor state binding (untracked to prevent reverting user edits)
	$effect(() => {
		if (activeTimeline) {
			const activeBlockA = activeTimeline.blocks.A.find(b => b.startTick <= globalTick && (b.endTick === null || b.endTick > globalTick));
			if (activeBlockA) {
				const currentA = untrack(() => teamCodes.A);
				if (currentA !== activeBlockA.code) {
					teamCodes.A = activeBlockA.code;
				}
			}
			const activeBlockB = activeTimeline.blocks.B.find(b => b.startTick <= globalTick && (b.endTick === null || b.endTick > globalTick));
			if (activeBlockB) {
				const currentB = untrack(() => teamCodes.B);
				if (currentB !== activeBlockB.code) {
					teamCodes.B = activeBlockB.code;
				}
			}
		}
	});
	let currentProtocol = $derived(primaryState ? getProtocol(primaryState.protocolVersion) : null);
	let currentMatch = $derived(replays.find(r => r.id === selectedReplayId));

	// Derived values for VersionBrowser
	let activeTeamData = $derived(activeTab === 'A' ? loadedMatch?.home_team : loadedMatch?.away_team);
</script>

{#if isVersionBrowserOpen && activeTab !== 'REF'}
	<VersionBrowser
		teamId={teamIds[activeTab as 'A'|'B']}
		teamName={activeTeamData?.name || 'Team'}
		teamColor={activeTeamData?.color || '#ffffff'}
		versions={teamVersions[activeTab as 'A'|'B']}
		drafts={$scratchpad[teamIds[activeTab as 'A'|'B']] || []}
		activeDraftId={activeDraftIds[activeTab as 'A'|'B']}
		matchVersionId={activeTab === 'A' ? loadedMatch?.home_code_version_id : loadedMatch?.away_code_version_id}
		officialVersionId={activeTeamData?.active_version_id}
		onLoadVersion={(v: any) => { loadVersionIntoDraft(activeTab as 'A'|'B', v); isVersionBrowserOpen = false; }}
		onSelectDraft={(id: string) => { selectDraft(activeTab as 'A'|'B', id); isVersionBrowserOpen = false; }}
		onDeleteDraft={(id: string) => scratchpad.deleteScratchpad(teamIds[activeTab as 'A'|'B'], id)}
		onClose={() => isVersionBrowserOpen = false}
	/>
{/if}

<div 
	class="flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 selection:bg-[var(--color-brand-primary)]/30 font-sans"
	onmousemove={handleMouseMove}
	onmouseup={stopResizing}
	onmouseleave={stopResizing}
>
	<!-- Left Side: Editor -->
	<aside 
		class="flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl"
		style="width: {asideWidth}px"
	>
		<header class="flex h-14 items-center justify-between border-b border-white/5 px-6">
			<!-- Tabs -->
			<div class="flex items-center gap-6">
				<button 
					onclick={() => activeTab = 'A'}
					class="group relative flex flex-col pt-1 transition-all {activeTab === 'A' ? 'text-white' : 'text-white/20 hover:text-white/40'}"
				>
					<div class="flex items-center gap-2">
						<span class="text-[10px] font-black uppercase tracking-widest">{loadedMatch?.home_team?.name || 'Home'}</span>
						{#if activeTab === 'A'}
							<button 
								onclick={(e) => { e.stopPropagation(); isVersionBrowserOpen = true; }}
								class="opacity-40 transition-all hover:opacity-100 hover:text-[var(--color-brand-primary)]"
								aria-label="Open Version Browser"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-library"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
							</button>
						{/if}
					</div>
					{#if activeTab === 'A'}
						<div class="absolute -bottom-[15px] left-0 h-0.5 w-full" style="background-color: {loadedMatch?.home_team?.color || '#3b82f6'}"></div>
					{/if}
				</button>

				<button 
					onclick={() => activeTab = 'B'}
					class="group relative flex flex-col pt-1 transition-all {activeTab === 'B' ? 'text-white' : 'text-white/20 hover:text-white/40'}"
				>
					<div class="flex items-center gap-2">
						<span class="text-[10px] font-black uppercase tracking-widest">{loadedMatch?.away_team?.name || 'Away'}</span>
						{#if activeTab === 'B'}
							<button 
								onclick={(e) => { e.stopPropagation(); isVersionBrowserOpen = true; }}
								class="opacity-40 transition-all hover:opacity-100 hover:text-[var(--color-brand-primary)]"
								aria-label="Open Version Browser"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-library"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
							</button>
						{/if}
					</div>
					{#if activeTab === 'B'}
						<div class="absolute -bottom-[15px] left-0 h-0.5 w-full" style="background-color: {loadedMatch?.away_team?.color || '#f43f5e'}"></div>
					{/if}
				</button>

				<button 
					onclick={() => activeTab = 'REF'}
					class="relative pt-1 text-[10px] font-black uppercase tracking-widest transition-all {activeTab === 'REF' ? 'text-white' : 'text-white/20 hover:text-white/40'}"
				>
					REF
					{#if activeTab === 'REF'}
						<div class="absolute -bottom-[15px] left-0 h-0.5 w-full bg-emerald-500"></div>
					{/if}
				</button>
			</div>
		</header>

		{#if errorMessage}
			<div class="m-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-[10px] font-black uppercase tracking-widest text-rose-400 animate-pulse">
				Error: {errorMessage}
			</div>
		{/if}

		<div class="flex-1 overflow-y-auto no-scrollbar flex flex-col p-4">
			{#if activeTab === 'REF'}
				<!-- Protocol Reference Tab Content -->
				<div class="space-y-8 p-2">
					<section class="space-y-4">
						<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Protocol Reference</h3>
						
						<div class="space-y-4">
							<div class="rounded-2xl border border-white/5 bg-black/40 p-5">
								<div class="mb-2 text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-wider">SensedState</div>
								<pre class="text-[10px] leading-relaxed text-[var(--color-brand-secondary)]/40"><code>{`{
  tick: number,
  players: Player[],
  pointZone: PointZone,
  teams: { A, B }
}`}</code></pre>
							</div>

							<div class="rounded-2xl border border-white/5 bg-black/40 p-5">
								<div class="mb-2 text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-wider">Player</div>
								<pre class="text-[10px] leading-relaxed text-[var(--color-brand-secondary)]/40"><code>{`{
  id: string,
  team: 'A' | 'B',
  position: { x, y },
  status: 'active' | 'stunned' | 'knocked_out',
  stunTicks?: number
}`}</code></pre>
							</div>

							<div class="rounded-2xl border border-white/5 bg-black/40 p-5">
								<div class="mb-2 text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-wider">Action</div>
								<pre class="text-[10px] leading-relaxed text-[var(--color-brand-secondary)]/40"><code>{`{
  playerId: string,
  type: 'MOVE' | 'STAY',
  direction?: 'UP' | 'DOWN' | ...
}`}</code></pre>
							</div>
						</div>
					</section>

					<section class="rounded-2xl border border-[var(--color-brand-primary)]/10 bg-[var(--color-brand-primary)]/5 p-5">
						{#if currentProtocol}
							<h3 class="mb-2 text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">{currentProtocol.name}</h3>
							<p class="text-xs leading-relaxed text-[var(--color-brand-secondary)]/50 font-medium whitespace-pre-wrap">{currentProtocol.description}</p>
						{:else}
							<h3 class="mb-2 text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">About Protocol</h3>
							<p class="text-xs leading-relaxed text-[var(--color-brand-secondary)]/50 font-medium animate-pulse">Loading protocol data...</p>
						{/if}
					</section>
				</div>
			{:else}
				<div class="flex-1 w-full bg-[#1e1e1e] relative min-h-0 overflow-hidden rounded-xl border border-white/5 shadow-inner">
					{#if browser && Editor}
						{#key activeTab}
							<Editor code={currentLogicCode} onCodeChange={handleCodeChange} />
						{/key}
					{/if}
				</div>
			{/if}
		</div>
		<footer class="border-t border-white/5 p-4 text-[10px] text-white/20 font-medium italic">
			* Editing code will branch the simulation from the current tick.
		</footer>
	</aside>

	<!-- Resize Handle -->
	<div 
		onmousedown={startResizing}
		class="w-1 cursor-col-resize bg-zinc-800/50 transition-colors hover:bg-emerald-500/50 active:bg-emerald-500"
		role="separator"
	></div>

	<!-- Middle: Field + Controls -->
	<main class="flex flex-1 flex-col p-6 lg:p-10 bg-[var(--color-background-dark)]">
		<header class="mb-12 flex items-center justify-between">
			<div class="flex items-center gap-8">
				
				<!-- Identity Block Card -->
				<div class="inline-flex flex-col rounded-2xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl">
					<div class="flex items-center gap-4">
						<button 
							onclick={() => window.history.back()}
							class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md" 
							aria-label="Go Back"
						>
							<svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
						</button>
						<div class="flex flex-col">
							<h1 class="text-xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">
								Film <span class="text-[var(--color-brand-primary)]">Room</span>
							</h1>
							<p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Replay & Branching</p>
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border border-white/5 shadow-xl backdrop-blur-md">
				<span class="h-1.5 w-1.5 rounded-full animate-pulse bg-[var(--color-brand-primary)] shadow-[0_0_8px_var(--color-brand-primary)]"></span> Live Analysis
			</div>
		</header>

		{#if primaryState}
			<div class="flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden min-h-0">
				<!-- Pitch -->
				<div class="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden p-4">
					<ReplayGrid {primaryState} {ghostState} {playSpeed} {showControlMap} />
				</div>

				<!-- Timeline Manager -->
				<TimelineManager 
					{timelines}
					bind:activeTimelineId
					bind:ghostTimelineId
					bind:globalTick
					{isPlaying}
					onTogglePlay={togglePlayback}
					onStepForward={stepForward}
					onStepBackward={stepBackward}
					onSave={(timelineId: string) => {
						activeTimelineId = timelineId;
						const timeline = timelines.find(t => t.id === timelineId);
						modalSelectedOverwriteId = timeline?.draftId || null;
						isScratchpadModalOpen = true;
					}}
					onLoad={(timelineId: string) => {
						activeTimelineId = timelineId;
						isVersionBrowserOpen = true;
					}}
				/>
			</div>
		{:else}
			<div class="flex flex-1 items-center justify-center italic text-white/20 font-black uppercase tracking-widest text-sm">
				<span class="animate-pulse">Decoding replay buffer...</span>
			</div>
		{/if}
	</main>

	<!-- Analysis Sidebar (Right) -->
	<aside class="flex w-80 flex-col border-l border-white/5 bg-black/20 p-6 backdrop-blur-3xl lg:p-8">
		<div class="mb-10 relative">
			<label class="mb-3 block text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">
				Match Library
			</label>
			<button 
				onclick={() => isLibraryOpen = !isLibraryOpen}
				class="w-full flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-black text-[var(--color-brand-secondary)] outline-none hover:bg-black/60 transition-all group"
			>
				<span>
					{#if selectedReplayId}
						{@const selected = replays.find(r => r.id === selectedReplayId)}
						{selected ? `${selected.home_team.name} vs ${selected.away_team.name}` : 'Select a match'}
					{:else}
						Select a match
					{/if}
				</span>
				<svg class="h-4 w-4 transition-transform duration-300 {isLibraryOpen ? 'rotate-180' : ''} text-white/20 group-hover:text-[var(--color-brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
			</button>

			{#if isLibraryOpen}
				<div 
					class="absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-3xl shadow-2xl overflow-hidden p-1 max-h-60 overflow-y-auto no-scrollbar"
					transition:fade={{ duration: 150 }}
				>
					{#each replays as replay}
						<button 
							onclick={() => {
								selectedReplayId = replay.id;
								loadMatchReplay(replay.id);
								isLibraryOpen = false;
							}}
							class="w-full px-4 py-3 text-left text-[11px] font-bold transition-all rounded-xl {selectedReplayId === replay.id ? 'text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10' : 'text-white/40 hover:text-white hover:bg-white/5'}"
						>
							<div class="flex items-center justify-between">
								<span>{replay.home_team.name} vs {replay.away_team.name}</span>
								{#if selectedReplayId === replay.id}
									<span class="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)] shadow-[0_0_8px_rgba(5,150,105,1)]"></span>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex-1 flex flex-col min-h-0 space-y-6">
			<!-- Live Stats -->
			<section class="space-y-4 flex-shrink-0">
				<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Match Analysis</h3>
				
				<div class="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-inner">
					<div class="mb-1 text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-wider">Elapsed Ticks</div>
					<div class="text-3xl font-black tracking-tighter text-white">
						{globalTick} <span class="text-white/10">/ {activeTimeline ? activeTimeline.states.length - 1 : 0}</span>
					</div>
				</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-2xl border bg-black/20 p-4 shadow-inner" style="border-color: {primaryState?.teams.A.color}22">
							<div class="mb-1 text-[9px] font-black uppercase tracking-wider" style="color: {primaryState?.teams.A.color}">{primaryState?.teams.A.name}</div>
							<div class="text-2xl font-black text-white">{primaryState?.teams.A.score ?? 0}</div>
							<div class="mt-2 text-[8px] font-black text-white/10 uppercase tracking-widest">
								Avg {primaryState?.teams.A.stats.averagePointsPerCapture.toFixed(2)} pts/cap
							</div>
						</div>
						<div class="rounded-2xl border bg-black/20 p-4 shadow-inner" style="border-color: {primaryState?.teams.B.color}22">
							<div class="mb-1 text-[9px] font-black uppercase tracking-wider" style="color: {primaryState?.teams.B.color}">{primaryState?.teams.B.name}</div>
							<div class="text-2xl font-black text-white">{primaryState?.teams.B.score ?? 0}</div>
							<div class="mt-2 text-[8px] font-black text-white/10 uppercase tracking-widest">
								Avg {primaryState?.teams.B.stats.averagePointsPerCapture.toFixed(2)} pts/cap
							</div>
						</div>
					</div>
			</section>

			<!-- Live State Inspector -->
			<section class="flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--color-brand-primary)]/10 bg-[var(--color-brand-primary)]/5 p-5">
				<div class="mb-4 flex items-center justify-between flex-shrink-0">
					<h4 class="text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Live Data</h4>
					<span class="text-[8px] font-bold text-[var(--color-brand-primary)]/40 uppercase tracking-widest">Tick {globalTick}</span>
				</div>
				<div class="flex-1 overflow-y-auto no-scrollbar">
					{#if primaryState}
						<StateInspector data={primaryState} />
					{/if}
				</div>
			</section>
		</div>
	</aside>
</div>

<!-- Publish Modal -->
{#if isPublishModalOpen}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
		<div class="absolute inset-0" onclick={() => isPublishModalOpen = false}></div>
		<div class="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0c] p-8 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
			<div class="relative z-10 space-y-6">
				<header>
					<h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-brand-primary)] mb-2">Publish Logic</h2>
					<p class="text-sm font-medium text-white/70 leading-relaxed mb-4">
						Publishing will create a permanent new version for Team {activeTab === 'A' ? 'Alpha' : 'Bravo'}.
					</p>
					<label class="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Version Name (Optional)</label>
					<input 
						type="text" 
						bind:value={modalInputName}
						placeholder="e.g. Aggressive Push V2"
						class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white placeholder-white/20 outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]"
					/>
				</header>
				<footer class="flex items-center justify-end gap-3 pt-4">
					<button onclick={() => isPublishModalOpen = false} class="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">Cancel</button>
					<button onclick={executePublish} class="px-8 py-3 rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Publish</button>
				</footer>
			</div>
		</div>
	</div>
{/if}

<!-- Save Scratchpad Modal -->
{#if isScratchpadModalOpen}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
		<div class="absolute inset-0" onclick={() => isScratchpadModalOpen = false}></div>
		<div class="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0c] p-8 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
			<div class="relative z-10 space-y-6">
				<header>
					<h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-brand-primary)] mb-2">Save Scratchpad</h2>
					
					<div class="space-y-4">
						<div>
							<label class="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Save as New Draft</label>
							<input 
								type="text" 
								bind:value={modalInputName}
								oninput={() => modalSelectedOverwriteId = ''}
								placeholder="Enter draft name..."
								class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white placeholder-white/20 outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]"
							/>
						</div>
						
						<div class="relative flex items-center py-2">
							<div class="flex-grow border-t border-white/10"></div>
							<span class="flex-shrink-0 mx-4 text-[10px] font-black uppercase text-white/20">OR</span>
							<div class="flex-grow border-t border-white/10"></div>
						</div>

						<div>
							<label class="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Overwrite Existing</label>
							<select 
								bind:value={modalSelectedOverwriteId}
								onchange={() => modalInputName = ''}
								class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] appearance-none"
							>
								<option value="">-- Select draft to overwrite --</option>
								{#each ($scratchpad[teamIds[activeTab as 'A'|'B']] || []) as draft}
									<option value={draft.id}>{draft.name}</option>
								{/each}
							</select>
						</div>
					</div>
				</header>
				<footer class="flex items-center justify-end gap-3 pt-4">
					<button onclick={() => isScratchpadModalOpen = false} class="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">Cancel</button>
					<button onclick={executeSaveScratchpad} class="px-8 py-3 rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Save</button>
				</footer>
			</div>
		</div>
	</div>
{/if}

<style>
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 14px;
		width: 14px;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
		cursor: pointer;
	}

	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
