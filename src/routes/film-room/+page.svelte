<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { createInitialState } from '../../../packages/engine/core';
	import { getProtocol } from '../../../packages/protocols/registry';
	import type { GameState } from '../../../packages/engine/types';
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
	let baseTickRate = $state(750);
	let playSpeed = $state(750);
	let playbackInterval: number | null = null;
	
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

	const STARTER_CODE = `import type { PlayerAction, SensedState } from '../../packages/engine/team_api.ts';

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

	// Sync scratchpad with state
	$effect(() => {
		const unsubscribe = scratchpad.subscribe(values => {
			// Priority: Existing state > Scratchpad > Starter Code
			if (!teamCodes.A) teamCodes.A = values.A || STARTER_CODE;
			if (!teamCodes.B) teamCodes.B = values.B || STARTER_CODE;
		});
		return unsubscribe;
	});

	// Removed loadReplay since we use loadMatchReplay exclusively now.

	async function loadMatchReplay(matchId: string) {
		stopPlayback();
		isSimulating = true;
		
		const { data: match, error } = await supabase
			.from('matches')
			.select(`
				seed,
				league_id,
				leagues (protocol_version, protocol_config),
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
		const homeVersionId = match.home_team.active_version_id;
		// @ts-ignore
		const awayVersionId = match.away_team.active_version_id;

		const { data: versions, error: versionError } = await supabase
			.from('team_code_versions')
			.select('id, source_code, compiled_code')
			.in('id', [homeVersionId, awayVersionId]);

		if (versionError || !versions || versions.length < 2) {
			console.error('Error fetching versions:', versionError);
			isSimulating = false;
			return;
		}

		const homeV = versions.find(v => v.id === homeVersionId)!;
		const awayV = versions.find(v => v.id === awayVersionId)!;

		teamCodes.A = homeV.source_code;
		teamCodes.B = awayV.source_code;

		// Initialize from tick 0
		// @ts-ignore
		const config = match.leagues.protocol_config || {};
		baseTickRate = config.tickRateMs || 750;
		playSpeed = baseTickRate;

		// @ts-ignore
		const initialState = createInitialState(Number(match.seed), match.leagues.protocol_version, config, {
			A: match.home_team,
			B: match.away_team
		});
		states = [initialState];
		currentTick = 0;

		// Request simulation from worker using the COMPILED code for perfect determinism
		if (simWorker) {
			simWorker.postMessage({
				type: 'SIMULATE_BRANCH',
				startState: initialState,
				alphaCompiled: homeV.compiled_code,
				bravoCompiled: awayV.compiled_code,
				maxTicks: 500
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

	function handleCodeChange(newCode: string) {
		if (activeTab === 'REF') return;
		teamCodes[activeTab] = newCode;
		scratchpad.updateCode(activeTab, newCode);
		requestSimulation();
	}

	let currentLogicCode = $derived(activeTab === 'REF' ? '' : teamCodes[activeTab as 'A' | 'B']);

	import { modal } from '$lib/stores/modal';

	async function publishLogic() {
		if (activeTab === 'REF') return;
		
		const matchId = page.url.searchParams.get('match');
		if (!matchId) {
			modal.alert('Action Required', 'You must be viewing a specific match to publish logic for a team.');
			return;
		}

		modal.confirm(
			'Publish Logic', 
			`Are you sure you want to publish this logic for Team ${activeTab === 'A' ? 'Alpha' : 'Bravo'}? This will update the team's active code for future matches.`,
			async () => {
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
							compiled_code: compiledCode
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

					modal.alert('Success', `Team ${activeTab === 'A' ? 'Alpha' : 'Bravo'} logic updated to version ${nextVersion}.`);
				} catch (err: any) {
					console.error('Publish Error:', err);
					modal.alert('Error', `Failed to publish: ${err.message}`);
				} finally {
					isSimulating = false;
				}
			}
		);
	}

	function requestSimulation() {
		if (simulationDebounceTimer) clearTimeout(simulationDebounceTimer);
		
		simulationDebounceTimer = window.setTimeout(() => {
			if (!simWorker || states.length === 0) return;
			isSimulating = true;
			branchTick = currentTick; // Mark the fork point
			
			simWorker.postMessage({
				type: 'SIMULATE_BRANCH',
				startState: $state.snapshot(states[currentTick]),
				alphaCode: teamCodes.A,
				bravoCode: teamCodes.B,
				maxTicks: 500 - currentTick
			});
		}, 500);
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
				.eq('status', 'simulated')
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

			// Initialize Smart Editor
			Editor = (await import('$lib/components/SmartEditor.svelte')).default;
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
					{#if isSimulating}
						<span class="flex items-center gap-1.5 text-[9px] font-bold text-[var(--color-brand-primary)]/70 uppercase">
							<span class="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--color-brand-primary)]"></span>
							Calculating...
						</span>
					{:else}
						<button 
							onclick={publishLogic}
							class="rounded-lg bg-[var(--color-brand-primary)]/10 px-3 py-1 text-[10px] font-black text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 transition-colors uppercase tracking-wider"
						>
							Publish
						</button>
					{/if}
				</div>
			</div>
			{#if errorMessage}
				<div class="mb-2 rounded border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[9px] font-medium text-rose-400">
					Error: {errorMessage}
				</div>
			{/if}
			<!-- Tabs -->
			<div class="flex gap-6">
					<button 
						onclick={() => activeTab = 'A'}
						class="pb-2 text-[10px] font-black uppercase tracking-widest transition-all {activeTab === 'A' ? 'border-b-2 text-white' : 'text-white/20 hover:text-white/40'}"
						style={activeTab === 'A' ? `border-color: ${currentMatch?.home_team?.color || '#3b82f6'}` : ''}
					>
						{currentMatch?.home_team?.name || 'Home'}
					</button>
					<button 
						onclick={() => activeTab = 'B'}
						class="pb-2 text-[10px] font-black uppercase tracking-widest transition-all {activeTab === 'B' ? 'border-b-2 text-white' : 'text-white/20 hover:text-white/40'}"
						style={activeTab === 'B' ? `border-color: ${currentMatch?.away_team?.color || '#f43f5e'}` : ''}
					>
						{currentMatch?.away_team?.name || 'Away'}
					</button>
				<button 
					onclick={() => activeTab = 'REF'}
					class="pb-2 text-[10px] font-black uppercase tracking-widest transition-all {activeTab === 'REF' ? 'border-b-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]' : 'text-white/20 hover:text-white/40'}"
				>
					Reference
				</button>
			</div>
		</header>
		<div class="flex-1 overflow-y-auto no-scrollbar p-4">
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
				{#if browser && Editor}
					<Editor code={currentLogicCode} onCodeChange={handleCodeChange} />
				{/if}
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
				<div class="inline-flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl">
					<div class="flex items-center gap-4">
						<a href="{base}/" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md" aria-label="Go Back">
							<svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
						</a>
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
					<ReplayGrid state={currentState} {playSpeed} />
				</div>

				<!-- Playback Hub (Floating Glass) -->
				<div class="w-full max-w-3xl space-y-5 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-2xl">
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
