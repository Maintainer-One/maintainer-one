<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { createInitialState } from '../../../packages/engine/core';
	import type { GameState } from '../../../packages/engine/types';
	import ReplayGrid from '$lib/components/ReplayGrid.svelte';
	import StateInspector from '$lib/components/StateInspector.svelte';
	import SimWorker from '$lib/workers/sim.worker?worker';
	import { scratchpad } from '$lib/stores/scratchpad';

	let replays = [
		'match_2026-04-18T02-25-57-337Z.json',
		'match_2026-04-18T02-28-47-014Z.json'
	];
	let selectedReplay = $state(replays[1]);
	let states = $state<GameState[]>([]);
	let currentTick = $state(0);
	let isPlaying = $state(false);
	let playSpeed = $state(750);
	let playbackInterval: number | null = null;
	
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
	let activeTeam = $state<'A' | 'B'>('A');
	let teamCodes = $state({ A: '', B: '' });

	// Sync scratchpad with state
	$effect(() => {
		const unsubscribe = scratchpad.subscribe(values => {
			// Only update if current state is empty (first load)
			if (!teamCodes.A && values.A) teamCodes.A = values.A;
			if (!teamCodes.B && values.B) teamCodes.B = values.B;
		});
		return unsubscribe;
	});

	let currentLogicCode = $derived(teamCodes[activeTeam]);

	async function loadReplay(filename: string) {
		stopPlayback();
		const response = await fetch(`/replays/${filename}`);
		states = await response.json();
		currentTick = 0;
	}

	async function loadMatchReplay(matchId: string) {
		stopPlayback();
		isSimulating = true;
		
		const { data: match, error } = await supabase
			.from('matches')
			.select(`
				seed,
				league_id,
				leagues (protocol_version),
				home_team:teams!home_team_id (id, active_version_id),
				away_team:teams!away_team_id (id, active_version_id)
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
		const initialState = createInitialState(Number(match.seed), match.leagues.protocol_version);
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
		selectedReplay = target.value;
		loadReplay(selectedReplay);
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
		teamCodes[activeTeam] = newCode;
		scratchpad.updateCode(activeTeam, newCode);
		requestSimulation();
	}

	async function publishLogic() {
		const matchId = page.url.searchParams.get('match');
		if (!matchId) {
			alert('You must be viewing a specific match to publish logic for a team.');
			return;
		}

		const confirmPublish = confirm(`Are you sure you want to publish this logic for Team ${activeTeam === 'A' ? 'Alpha' : 'Bravo'}? This will update the team's active code for future matches.`);
		if (!confirmPublish) return;

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

			const teamId = activeTeam === 'A' ? match.home_team_id : match.away_team_id;
			const code = teamCodes[activeTeam];

			// 2. Transpile (Mocked for now - we would use esbuild in a real backend, 
			// but for browser-side we'll just use the source code as compiled for now 
			// if it's already JS-compatible, or we'd need a worker-side esbuild)
			// For this MVP, we'll store the "cleaned" code from createLogic
			
			// Let's use a simple regex-based "transpiler" like in the worker
			const cleanedCode = code
				.replace(/import\s+[\s\S]*?;/g, '')
				.replace(/:\s*[A-Z][a-zA-Z0-9<>[\]]*/g, '')
				.replace(/export\s+const\s+teamLogic\s*=\s*/, 'const teamLogic = ')
				.trim();
			
			const compiledCode = `
				const module = { exports: {} };
				const exports = module.exports;
				${cleanedCode};
				const logic = typeof teamLogic !== 'undefined' ? teamLogic : (module.exports.teamLogic || module.exports.default || exports.teamLogic);
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

			alert(`Success! Team ${activeTeam === 'A' ? 'Alpha' : 'Bravo'} logic updated to version ${nextVersion}.`);
		} catch (err: any) {
			console.error('Publish Error:', err);
			alert(`Failed to publish: ${err.message}`);
		} finally {
			isSimulating = false;
		}
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

			const matchId = page.url.searchParams.get('match');
			if (matchId) {
				await loadMatchReplay(matchId);
			} else {
				loadReplay(selectedReplay);
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
			<!-- Team Tabs -->
			<div class="flex gap-6">
				<button 
					onclick={() => activeTeam = 'A'}
					class="pb-2 text-[10px] font-black uppercase tracking-widest transition-all {activeTeam === 'A' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-white/20 hover:text-white/40'}"
				>
					Alpha
				</button>
				<button 
					onclick={() => activeTeam = 'B'}
					class="pb-2 text-[10px] font-black uppercase tracking-widest transition-all {activeTeam === 'B' ? 'border-b-2 border-rose-500 text-rose-400' : 'text-white/20 hover:text-white/40'}"
				>
					Bravo
				</button>
			</div>
		</header>
		<div class="flex-1 p-4">
			{#if browser && Editor}
				<Editor code={currentLogicCode} onCodeChange={handleCodeChange} />
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
		<header class="mb-10 flex items-center justify-between border-b border-white/5 pb-6">
			<div class="flex items-center gap-6">
				<a href="{base}/" class="text-white/20 transition-all hover:text-[var(--color-brand-primary)] hover:scale-110" aria-label="Go Back">
					<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
				</a>
				<div class="flex flex-col">
					<h1 class="text-3xl font-black tracking-tighter text-white uppercase leading-none">
						Film <span class="text-[var(--color-brand-primary)]">Room</span>
					</h1>
					<p class="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Deterministic Replay & Branching</p>
				</div>
			</div>
			<div class="flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-[10px] font-black text-white/40 uppercase tracking-[0.15em] border border-white/5">
				<span class="h-2 w-2 rounded-full animate-pulse bg-[var(--color-brand-primary)]"></span> Live Analysis
			</div>
		</header>

		{#if currentState}
			<div class="flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden min-h-0">
				<!-- Pitch -->
				<div class="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden p-4">
					<ReplayGrid state={currentState} />
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

						<div class="flex items-center gap-2">
							<select
								bind:value={playSpeed}
								onchange={stopPlayback}
								class="rounded-xl border border-white/5 bg-black/40 px-4 py-2 text-[10px] font-black uppercase text-[var(--color-brand-secondary)] outline-none hover:bg-black/60 focus:ring-1 focus:ring-[var(--color-brand-primary)]"
							>
								<option value={1500}>0.5x</option>
								<option value={750}>1.0x</option>
								<option value={375}>2.0x</option>
								<option value={100}>MAX</option>
							</select>
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
		<div class="mb-10">
			<label for="replay-select" class="mb-3 block text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">
				Match Library
			</label>
			<select
				id="replay-select"
				value={selectedReplay}
				class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-black text-[var(--color-brand-secondary)] outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]/50 transition-all"
				onchange={handleSelection}
			>
				{#each replays as replay}
					<option value={replay}>{replay.split('_')[1].split('T')[0]}</option>
				{/each}
			</select>
		</div>

		<div class="flex-1 space-y-8 overflow-y-auto no-scrollbar">
			<!-- Live Stats -->
			<section class="space-y-4">
				<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Match Analysis</h3>
				
				<div class="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-inner">
					<div class="mb-1 text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-wider">Elapsed Ticks</div>
					<div class="text-3xl font-black tracking-tighter text-white">
						{currentTick} <span class="text-white/10">/ {states.length - 1}</span>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4">
						<div class="mb-1 text-[9px] font-black text-blue-500 uppercase tracking-wider">Alpha</div>
						<div class="text-2xl font-black text-blue-400">{currentState?.teams.A.score ?? 0}</div>
					</div>
					<div class="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4">
						<div class="mb-1 text-[9px] font-black text-rose-500 uppercase tracking-wider">Bravo</div>
						<div class="text-2xl font-black text-rose-400">{currentState?.teams.B.score ?? 0}</div>
					</div>
				</div>

				<!-- Live State Inspector -->
				<div class="rounded-2xl border border-[var(--color-brand-primary)]/10 bg-[var(--color-brand-primary)]/5 p-5">
					<div class="mb-4 flex items-center justify-between">
						<h4 class="text-[9px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">Live Data</h4>
						<span class="text-[8px] font-bold text-[var(--color-brand-primary)]/40 uppercase tracking-widest">Tick {currentTick}</span>
					</div>
					<div class="max-h-72 overflow-y-auto no-scrollbar">
						{#if currentState}
							<StateInspector data={currentState} />
						{/if}
					</div>
				</div>
			</section>

			<!-- Protocol Reference -->
			<section class="space-y-4">
				<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Protocol Reference</h3>
				
				<div class="space-y-3">
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
  status: 'active' | ...
}`}</code></pre>
					</div>
				</div>
			</section>

			<!-- Protocol Info -->
			<section class="rounded-2xl border border-[var(--color-brand-primary)]/10 bg-[var(--color-brand-primary)]/5 p-5">
				<h3 class="mb-2 text-[10px] font-black text-[var(--color-brand-primary)] uppercase tracking-widest">About V1</h3>
				<p class="text-xs leading-relaxed text-[var(--color-brand-secondary)]/50 font-medium">
					V1: 10x10 Grid. Point zone at (4,5). Teams start at opposite ends. First to capture wins.
				</p>
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
