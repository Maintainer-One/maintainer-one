<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { createInitialState } from '$packages/engine/core';
	import { getProtocol } from '$packages/protocols/registry';
	import type { GameState } from '$packages/engine/types';
	import ReplayGrid from '$lib/components/ReplayGrid.svelte';
	import StateInspector from '$lib/components/StateInspector.svelte';
	import SimWorker from '$lib/workers/sim.worker?worker';
	import { fade } from 'svelte/transition';
	import { scratchpad } from '$lib/stores/scratchpad';

	type MatchItem = { id: string, home_team: { name: string, color: string }, away_team: { name: string, color: string } };
	let replays = $state<MatchItem[]>([]);
	let selectedReplayId = $state<string | null>(null);
	let states = $state<GameState[]>([]);
	let currentTick = $state(0);
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
	let branchTick = $state<number | null>(null);
	let simulationDebounceTimer: number | null = null;

	// Layout State
	let asideWidth = $state(450);
	let isResizing = $state(false);

	// Logic Editing State
	let activeTab = $state<'A' | 'B' | 'REF'>('A');
	let teamCodes = $state({ A: '', B: '' });
	let teamIds = $state({ A: '', B: '' });
	let teamVersions = $state({ A: [] as any[], B: [] as any[] });
	let selectedVersionTypes = $state({ A: 'match', B: 'match' });
	let isSwitcherOpen = $state({ A: false, B: false });
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

		if (homeV) teamCodes.A = homeV.source_code;
		if (awayV) teamCodes.B = awayV.source_code;
		
		selectedVersionTypes.A = 'match';
		selectedVersionTypes.B = 'match';

		// @ts-ignore
		activeConfig = match.seasons?.protocol_config ?? match.leagues.protocol_config ?? {};
		baseTickRate = activeConfig.tickRateMs || 750;
		playSpeed = baseTickRate;

		// @ts-ignore
		const initialState = createInitialState(Number(match.public_seed), match.seasons?.protocol_version || match.leagues.protocol_version, activeConfig, {
			A: match.home_team,
			B: match.away_team
		});
		states = [initialState];
		currentTick = 0;

		const maxTicks = (activeConfig?.maxGameTicks || 100) + (activeConfig?.overtimeAllowed ? (activeConfig?.pointZoneMaxAge || 40) : 0) + 100;

		// Request simulation from worker using the COMPILED code for perfect determinism
		if (simWorker) {
			simWorker.postMessage({
				type: 'SIMULATE_BRANCH',
				startState: JSON.parse(JSON.stringify(initialState)),
				alphaCompiled: homeV.compiled_code,
				bravoCompiled: awayV.compiled_code,
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
		if (currentTick >= states.length - 1) currentTick = 0;
		isPlaying = true;
		playbackInterval = window.setInterval(() => {
			if (currentTick < states.length - 1) currentTick++;
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

	function handleSelection(e: Event) {
		const target = e.target as HTMLSelectElement;
		selectedReplayId = target.value;
		if (selectedReplayId) {
			loadMatchReplay(selectedReplayId);
		}
		branchTick = null; // Reset branch point
	}

	function stepForward() {
		stopPlayback();
		if (currentTick < states.length - 1) currentTick++;
	}

	function stepBackward() {
		stopPlayback();
		if (currentTick > 0) currentTick--;
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

	function selectVersion(team: 'A' | 'B', type: 'match' | 'scratch' | string, scratchId?: string) {
		selectedVersionTypes[team] = scratchId || type;
		isSwitcherOpen[team] = false;
		
		if (type === 'match') {
			// @ts-ignore
			const matchVerId = team === 'A' ? loadedMatch?.home_code_version_id : loadedMatch?.away_code_version_id;
			const v = teamVersions[team].find(v => v.id === matchVerId) || teamVersions[team][0];
			if (v) teamCodes[team] = v.source_code;
		} else if (type === 'scratch' && scratchId) {
			const s = ($scratchpad[teamIds[team]] || []).find(i => i.id === scratchId);
			if (s) teamCodes[team] = s.code;
		} else {
			const v = teamVersions[team].find(v => v.id === type);
			if (v) teamCodes[team] = v.source_code;
		}
		
		requestSimulation();
	}

	function handleCodeChange(newCode: string) {
		if (activeTab === 'REF') return;
		teamCodes[activeTab] = newCode;
		
		// If we are currently editing a scratchpad, sync it back to the store
		const currentVersionType = selectedVersionTypes[activeTab];
		if (currentVersionType !== 'match') {
			const isPublished = teamVersions[activeTab].some(v => v.id === currentVersionType);
			if (!isPublished) {
				scratchpad.updateScratchpad(teamIds[activeTab], currentVersionType, newCode);
			} else {
				autosaveCode(newCode);
			}
		} else {
			autosaveCode(newCode);
		}
	}

	function autosaveCode(newCode: string) {
		const teamId = teamIds[activeTab as 'A'|'B'];
		let autosave = ($scratchpad[teamId] || []).find(s => s.name === 'Autosave');
		if (!autosave) {
			scratchpad.addScratchpad(teamId, 'Autosave', newCode);
		} else {
			scratchpad.updateScratchpad(teamId, autosave.id, newCode);
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
				selectedVersionTypes[activeTab] = newV.id;
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
		if (modalSelectedOverwriteId) {
			scratchpad.updateScratchpad(teamId, modalSelectedOverwriteId, teamCodes[activeTab], modalInputName || undefined);
			selectedVersionTypes[activeTab] = modalSelectedOverwriteId;
		} else {
			const newId = scratchpad.addScratchpad(teamId, modalInputName || 'Untitled Draft', teamCodes[activeTab]);
			selectedVersionTypes[activeTab] = newId;
		}
	}

	function requestSimulation() {
		if (simulationDebounceTimer) clearTimeout(simulationDebounceTimer);
		if (!simWorker || states.length === 0) return;
		
		isSimulating = true;
		branchTick = currentTick; // Mark the fork point
		
		const totalMaxTicks = (activeConfig?.maxGameTicks || 100) + (activeConfig?.overtimeAllowed ? (activeConfig?.pointZoneMaxAge || 40) : 0) + 100;
		
		simWorker.postMessage({
			type: 'SIMULATE_BRANCH',
			startState: JSON.parse(JSON.stringify($state.snapshot(states[currentTick]))),
			alphaCode: teamCodes.A,
			bravoCode: teamCodes.B,
			maxTicks: Math.max(0, totalMaxTicks - currentTick),
			config: activeConfig ? JSON.parse(JSON.stringify(activeConfig)) : undefined
		});
	}

	onMount(async () => {
		if (browser) {
			// Initialize Worker
			simWorker = new SimWorker();
			simWorker.onmessage = (e) => {
				if (e.data.type === 'SIMULATION_COMPLETE') {
					const newBranch = e.data.states;
					states = [...states.slice(0, currentTick), ...newBranch];
					isSimulating = false;
					errorMessage = null;
					
					// Auto-play if it's a fresh match load
					if (currentTick === 0) startPlayback();
				} else if (e.data.type === 'SIMULATION_ERROR') {
					console.error('Simulation Error:', e.data.error);
					errorMessage = e.data.error;
					isSimulating = false;
					branchTick = null;
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
	let currentState = $derived(states[currentTick]);
	let currentProtocol = $derived(currentState ? getProtocol(currentState.protocolVersion) : null);
	let currentMatch = $derived(replays.find(r => r.id === selectedReplayId));
</script>

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
		<header class="flex h-20 flex-col border-b border-white/5 px-6 pt-4">
			<div class="mb-2 flex items-center justify-between">
				<h2 class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-primary)]">Logic Editor</h2>
				<div class="flex items-center gap-3">
						<button 
							disabled={isSimulating}
							onclick={() => {
								if (activeTab === 'REF') return;
								modalInputName = `Draft ${new Date().toLocaleDateString()}`;
								modalSelectedOverwriteId = '';
								isScratchpadModalOpen = true;
							}}
							class="rounded-lg bg-zinc-800/50 px-3 py-1 text-[10px] font-black text-white/50 hover:bg-white/10 hover:text-white transition-colors uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
						>
							Save Draft
						</button>
						<button 
							disabled={isSimulating}
							onclick={requestSimulation}
							class="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1 text-[10px] font-black text-blue-400 hover:bg-blue-500/20 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
						>
							{#if isSimulating}
								<span class="h-1.5 w-1.5 animate-ping rounded-full bg-blue-400"></span>
								Calculating...
							{:else}
								Run Simulation
							{/if}
						</button>
						<button 
							disabled={isSimulating}
							onclick={() => {
								if (activeTab === 'REF') return;
								modalInputName = '';
								isPublishModalOpen = true;
							}}
							class="rounded-lg bg-[var(--color-brand-primary)]/10 px-3 py-1 text-[10px] font-black text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
						>
							Publish
						</button>
				</div>
			</div>
			{#if errorMessage}
				<div class="mb-2 rounded border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[9px] font-medium text-rose-400">
					Error: {errorMessage}
				</div>
			{/if}
			<!-- Tabs -->
			<div class="flex gap-6 relative">
				<button 
					onclick={() => activeTab = 'A'}
					class="group flex items-center gap-1.5 pb-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap {activeTab === 'A' ? 'border-b-2 text-white' : 'text-white/20 hover:text-white/40'}"
					style={activeTab === 'A' ? `border-color: ${loadedMatch?.home_team?.color || '#3b82f6'}` : ''}
				>
					{loadedMatch?.home_team?.name || 'Home'}
					<span 
						role="button"
						tabindex="0"
						onclick={(e) => { e.stopPropagation(); isSwitcherOpen.A = !isSwitcherOpen.A; isSwitcherOpen.B = false; }}
						onkeydown={(e) => e.key === 'Enter' && (isSwitcherOpen.A = !isSwitcherOpen.A)}
						class="opacity-40 transition-all hover:opacity-100 hover:scale-110"
						aria-label="Switch Version"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down {isSwitcherOpen.A ? 'rotate-180' : ''}"><path d="m6 9 6 6 6-6"/></svg>
					</span>
				</button>
				<button 
					onclick={() => activeTab = 'B'}
					class="group flex items-center gap-1.5 pb-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap {activeTab === 'B' ? 'border-b-2 text-white' : 'text-white/20 hover:text-white/40'}"
					style={activeTab === 'B' ? `border-color: ${loadedMatch?.away_team?.color || '#f43f5e'}` : ''}
				>
					{loadedMatch?.away_team?.name || 'Away'}
					<span 
						role="button"
						tabindex="0"
						onclick={(e) => { e.stopPropagation(); isSwitcherOpen.B = !isSwitcherOpen.B; isSwitcherOpen.A = false; }}
						onkeydown={(e) => e.key === 'Enter' && (isSwitcherOpen.B = !isSwitcherOpen.B)}
						class="opacity-40 transition-all hover:opacity-100 hover:scale-110"
						aria-label="Switch Version"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down {isSwitcherOpen.B ? 'rotate-180' : ''}"><path d="m6 9 6 6 6-6"/></svg>
					</span>
				</button>
				<button 
					onclick={() => activeTab = 'REF'}
					class="pb-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap {activeTab === 'REF' ? 'border-b-2 border-emerald-500 text-white' : 'text-white/20 hover:text-white/40'}"
				>
					REFERENCE
				</button>

				<!-- Dropdowns -->
				{#each ['A', 'B'] as teamKey}
					{#if isSwitcherOpen[teamKey as 'A' | 'B']}
						<!-- Click outside to dismiss -->
						<div 
							class="fixed inset-0 z-40" 
							onclick={() => { isSwitcherOpen.A = false; isSwitcherOpen.B = false; }}
							role="presentation"
						></div>

						{@const isA = teamKey === 'A'}
						{@const teamId = teamIds[teamKey as 'A' | 'B']}
						{@const versions = teamVersions[teamKey as 'A' | 'B']}
						{@const currentSelection = selectedVersionTypes[teamKey as 'A' | 'B']}
						{@const teamScratchpads = $scratchpad[teamId] || []}
						<div class="absolute top-10 {isA ? 'left-0' : 'left-32'} z-50 w-72 rounded-xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl">
							<div class="mb-2 px-2 text-[8px] font-black uppercase tracking-widest text-white/30">Match Logic</div>
							<button 
								onclick={() => selectVersion(teamKey as 'A' | 'B', 'match')}
								class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors {currentSelection === 'match' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/70 hover:bg-white/5'}"
							>
								<span>Official Match Logic</span>
								{#if currentSelection === 'match'}
									<div class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
								{/if}
							</button>
							
							{#if versions.length > 0}
								<div class="mb-2 mt-4 px-2 text-[8px] font-black uppercase tracking-widest text-white/30">Published History</div>
								<div class="flex max-h-32 flex-col gap-1 overflow-y-auto pr-1">
									{#each versions as v}
										<button 
											onclick={() => selectVersion(teamKey as 'A' | 'B', v.id)}
											class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors {currentSelection === v.id ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}"
										>
											<span>Version {v.version_number}</span>
											<span class="text-[9px] text-white/30">{new Date(v.created_at).toLocaleDateString()}</span>
										</button>
									{/each}
								</div>
							{/if}

							<div class="mb-2 mt-4 flex items-center justify-between px-2">
								<span class="text-[8px] font-black uppercase tracking-widest text-white/30">Local Scratchpads</span>
							</div>
							<div class="flex max-h-32 flex-col gap-1 overflow-y-auto pr-1 mb-2">
								{#each teamScratchpads as s}
									<div class="group flex w-full items-center rounded-lg {currentSelection === s.id ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}">
										<button 
											onclick={() => selectVersion(teamKey as 'A' | 'B', 'scratch', s.id)}
											class="flex-1 px-3 py-2 text-left text-xs truncate"
										>
											{s.name}
										</button>
										<button 
											onclick={(e) => { e.stopPropagation(); scratchpad.deleteScratchpad(teamId, s.id); }}
											class="px-2 py-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all text-white/30"
											aria-label="Delete scratchpad"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
										</button>
									</div>
								{/each}
							</div>
							<button 
								onclick={() => {
									activeTab = teamKey as 'A' | 'B';
									modalInputName = `Draft ${new Date().toLocaleDateString()}`;
									modalSelectedOverwriteId = '';
									isScratchpadModalOpen = true;
									isSwitcherOpen.A = false;
									isSwitcherOpen.B = false;
								}}
								class="w-full rounded-lg border border-dashed border-white/10 p-2 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white/70"
							>
								+ New Scratchpad
							</button>
						</div>
					{/if}
				{/each}
			</div>
		</header>
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

		{#if currentState}
			<div class="flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden min-h-0">
				<!-- Pitch -->
				<div class="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden p-4">
					<ReplayGrid state={currentState} {playSpeed} {showControlMap} />
				</div>

				<!-- Playback Hub (Floating Glass) -->
				<div class="w-full max-w-3xl space-y-5 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-2xl">
					<div class="flex items-center gap-6">
						<div class="flex items-center gap-3">
							<button
								onclick={stepBackward}
								aria-label="Previous Tick"
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white active:scale-90 border border-white/5"
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
							</button>
							<button
								onclick={togglePlayback}
								aria-label={isPlaying ? 'Pause' : 'Play'}
								class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] transition-all hover:scale-110 active:scale-95 shadow-lg shadow-[var(--color-brand-primary)]/20"
							>
								{#if isPlaying}
									<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
								{:else}
									<svg class="h-6 w-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
								{/if}
							</button>
							<button
								onclick={stepForward}
								aria-label="Next Tick"
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white active:scale-90 border border-white/5"
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
							</button>
						</div>

						<div class="relative flex-1 group">
							<input
								type="range"
								min="0"
								max={states.length - 1}
								bind:value={currentTick}
								class="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/5 accent-[var(--color-brand-primary)]"
							/>
							{#if branchTick !== null}
								<div 
									class="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)] pointer-events-none"
									style="left: {(branchTick / (states.length - 1)) * 100}%"
									title="Simulation Branch Point"
								></div>
							{/if}
						</div>

						<div class="flex items-center gap-2 relative">
							<button
								onclick={() => showControlMap = !showControlMap}
								class="rounded-xl border border-white/5 bg-black/40 px-4 py-2 text-[10px] font-black uppercase transition-all {showControlMap ? 'text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/5' : 'text-white/40 hover:text-white'} outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] min-w-[120px]"
							>
								Map: {showControlMap ? 'Visible' : 'Hidden'}
							</button>

							<button
								onclick={() => isSpeedOpen = !isSpeedOpen}
								class="rounded-xl border border-white/5 bg-black/40 px-4 py-2 text-[10px] font-black uppercase text-[var(--color-brand-secondary)] outline-none hover:bg-black/60 focus:ring-1 focus:ring-[var(--color-brand-primary)] min-w-[75px] flex items-center justify-between gap-2"
							>
								<span>{playSpeed > baseTickRate ? '0.5x' : playSpeed === baseTickRate ? '1.0x' : playSpeed > baseTickRate / 3 ? '2.0x' : 'MAX'}</span>
								<svg class="h-3 w-3 opacity-30 transition-transform {isSpeedOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
							</button>

							{#if isSpeedOpen}
								<div 
									class="absolute bottom-full right-0 z-50 mb-2 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-3xl shadow-2xl overflow-hidden p-1 min-w-[85px]"
									transition:fade={{ duration: 150 }}
								>
									{#each [{v: baseTickRate * 2, l: '0.5x'}, {v: baseTickRate, l: '1.0x'}, {v: Math.floor(baseTickRate / 2), l: '2.0x'}, {v: Math.floor(baseTickRate / 4), l: 'MAX'}] as speed}
										<button 
											onclick={() => {
												playSpeed = speed.v;
												stopPlayback();
												isSpeedOpen = false;
											}}
											class="w-full px-3 py-2 text-left text-[10px] font-black transition-all rounded-lg {playSpeed === speed.v ? 'text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10' : 'text-white/40 hover:text-white hover:bg-white/5'}"
										>
											{speed.l}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
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
						{currentTick} <span class="text-white/10">/ {states.length - 1}</span>
					</div>
				</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-2xl border bg-black/20 p-4 shadow-inner" style="border-color: {currentState?.teams.A.color}22">
							<div class="mb-1 text-[9px] font-black uppercase tracking-wider" style="color: {currentState?.teams.A.color}">{currentState?.teams.A.name}</div>
							<div class="text-2xl font-black text-white">{currentState?.teams.A.score ?? 0}</div>
							<div class="mt-2 text-[8px] font-black text-white/10 uppercase tracking-widest">
								Avg {currentState?.teams.A.stats.averagePointsPerCapture.toFixed(2)} pts/cap
							</div>
						</div>
						<div class="rounded-2xl border bg-black/20 p-4 shadow-inner" style="border-color: {currentState?.teams.B.color}22">
							<div class="mb-1 text-[9px] font-black uppercase tracking-wider" style="color: {currentState?.teams.B.color}">{currentState?.teams.B.name}</div>
							<div class="text-2xl font-black text-white">{currentState?.teams.B.score ?? 0}</div>
							<div class="mt-2 text-[8px] font-black text-white/10 uppercase tracking-widest">
								Avg {currentState?.teams.B.stats.averagePointsPerCapture.toFixed(2)} pts/cap
							</div>
						</div>
					</div>
			</section>

			<!-- Live State Inspector -->
			<section class="flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--color-brand-primary)]/10 bg-[var(--color-brand-primary)]/5 p-5">
				<div class="mb-4 flex items-center justify-between flex-shrink-0">
					<h4 class="text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Live Data</h4>
					<span class="text-[8px] font-bold text-[var(--color-brand-primary)]/40 uppercase tracking-widest">Tick {currentTick}</span>
				</div>
				<div class="flex-1 overflow-y-auto no-scrollbar">
					{#if currentState}
						<StateInspector data={currentState} />
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
								{#each ($scratchpad[teamIds[activeTab]] || []) as draft}
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
