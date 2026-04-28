<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import type { GameState } from '../../../packages/engine/types';
	import ReplayGrid from '$lib/components/ReplayGrid.svelte';
	import StateInspector from '$lib/components/StateInspector.svelte';
	import SimWorker from '$lib/workers/sim.worker?worker';

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
	let teamCodes = $state({
		A: `// Team Alpha Logic
import type { PlayerAction, SensedState } from '../../packages/engine/team_api.ts';

export const teamLogic = (sense: SensedState): PlayerAction[] => {
	const actions: PlayerAction[] = [];
	// Move toward the center
	return actions;
};`,
		B: `// Team Bravo Logic
import type { PlayerAction, SensedState } from '../../packages/engine/team_api.ts';

export const teamLogic = (sense: SensedState): PlayerAction[] => {
	const actions: PlayerAction[] = [];
	// Counter Alpha strategy
	return actions;
};`
	});

	let currentLogicCode = $derived(teamCodes[activeTeam]);

	async function loadReplay(filename: string) {
		stopPlayback();
		const response = await fetch(`/replays/${filename}`);
		states = await response.json();
		currentTick = 0;
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
		requestSimulation();
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
		loadReplay(selectedReplay);

		if (browser) {
			// Initialize Worker
			simWorker = new SimWorker();
			simWorker.onmessage = (e) => {
				if (e.data.type === 'SIMULATION_COMPLETE') {
					const newBranch = e.data.states;
					states = [...states.slice(0, currentTick), ...newBranch];
					isSimulating = false;
					errorMessage = null;
				} else if (e.data.type === 'SIMULATION_ERROR') {
					console.error('Simulation Error:', e.data.error);
					errorMessage = e.data.error;
					isSimulating = false;
					branchTick = null; // Clear branch point on error
				}
			};

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
	class="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 font-sans"
	onmousemove={handleMouseMove}
	onmouseup={stopResizing}
	onmouseleave={stopResizing}
>
	<!-- Left Side: Editor (New) -->
	<aside 
		class="flex flex-col border-r border-white/5 bg-zinc-900/50 backdrop-blur-xl"
		style="width: {asideWidth}px"
	>
		<header class="flex h-16 flex-col border-b border-white/5 px-6 pt-3">
			<div class="mb-2 flex items-center justify-between">
				<h2 class="text-xs font-black uppercase tracking-widest text-emerald-500">Logic Editor</h2>
				<div class="flex items-center gap-3">
					{#if isSimulating}
						<span class="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500/70 uppercase">
							<span class="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500"></span>
							Calculating...
						</span>
					{:else}
						<button class="rounded bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/20">
							Save
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
			<div class="flex gap-4">
				<button 
					onclick={() => activeTeam = 'A'}
					class="pb-2 text-[10px] font-bold uppercase tracking-widest transition-all {activeTeam === 'A' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}"
				>
					Alpha
				</button>
				<button 
					onclick={() => activeTeam = 'B'}
					class="pb-2 text-[10px] font-bold uppercase tracking-widest transition-all {activeTeam === 'B' ? 'border-b-2 border-rose-500 text-rose-400' : 'text-zinc-500 hover:text-zinc-300'}"
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
		<footer class="border-t border-white/5 p-4 text-[9px] text-zinc-500">
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
	<main class="flex flex-1 flex-col p-6 lg:p-10 bg-zinc-950">
		<header class="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
			<div class="flex items-center gap-4">
				<a href="{base}/" class="text-zinc-500 transition-colors hover:text-emerald-500" aria-label="Go Back">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
				</a>
				<h1 class="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
					Film Room
				</h1>
			</div>
			<div class="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
				<span class="h-2 w-2 rounded-full animate-pulse bg-emerald-500"></span> Live Perspective
			</div>
		</header>

		{#if currentState}
			<div class="flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden min-h-0">
				<!-- Pitch -->
				<div class="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden p-4">
					<ReplayGrid state={currentState} />
				</div>

				<!-- Playback Hub -->
				<div class="w-full max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-2xl backdrop-blur-xl">
					<div class="flex items-center gap-5">
						<div class="flex items-center gap-2">
							<button
								onclick={stepBackward}
								aria-label="Previous Tick"
								class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-all hover:bg-zinc-700 active:scale-90"
							>
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
							</button>
							<button
								onclick={togglePlayback}
								aria-label={isPlaying ? 'Pause' : 'Play'}
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black transition-all hover:scale-110 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
							>
								{#if isPlaying}
									<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
								{:else}
									<svg class="h-5 w-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
								{/if}
							</button>
							<button
								onclick={stepForward}
								aria-label="Next Tick"
								class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-all hover:bg-zinc-700 active:scale-90"
							>
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
							</button>
						</div>

						<div class="relative flex-1 group">
							<input
								type="range"
								min="0"
								max={states.length - 1}
								bind:value={currentTick}
								class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-emerald-500"
							/>
							{#if branchTick !== null}
								<div 
									class="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] pointer-events-none"
									style="left: {(branchTick / (states.length - 1)) * 100}%"
									title="Simulation Branch Point"
								></div>
							{/if}
						</div>

						<div class="flex items-center gap-2">
							<select
								bind:value={playSpeed}
								onchange={stopPlayback}
								class="rounded-md border border-white/5 bg-zinc-800 px-3 py-1.5 text-[10px] font-black uppercase text-white outline-none hover:bg-zinc-700 focus:ring-1 focus:ring-emerald-500"
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
			<div class="flex flex-1 items-center justify-center italic text-zinc-600">
				Decoding replay buffer...
			</div>
		{/if}
	</main>

	<!-- Analysis Sidebar (Right) -->
	<aside class="flex w-72 flex-col border-l border-white/5 bg-zinc-900/30 p-6 backdrop-blur-3xl lg:p-8">
		<div class="mb-8">
			<label for="replay-select" class="mb-2 block text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
				Match Library
			</label>
			<select
				id="replay-select"
				value={selectedReplay}
				class="w-full rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
				onchange={handleSelection}
			>
				{#each replays as replay}
					<option value={replay}>{replay.split('_')[1].split('T')[0]}</option>
				{/each}
			</select>
		</div>

		<div class="flex-1 space-y-6 overflow-y-auto no-scrollbar">
			<!-- Live Stats -->
			<section class="space-y-4">
				<h3 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Match Analysis</h3>
				
				<div class="rounded-xl border border-white/5 bg-white/5 p-4 shadow-sm">
					<div class="mb-1 text-[9px] font-black text-zinc-500 uppercase">Elapsed Ticks</div>
					<div class="text-3xl font-black tracking-tight text-white">
						{currentTick} <span class="text-zinc-600">/ {states.length - 1}</span>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="rounded-xl border border-white/5 bg-blue-500/5 p-4">
						<div class="mb-1 text-[9px] font-black text-blue-500 uppercase">Alpha</div>
						<div class="text-2xl font-black text-blue-400">{currentState?.teams.A.score ?? 0}</div>
					</div>
					<div class="rounded-xl border border-white/5 bg-rose-500/5 p-4">
						<div class="mb-1 text-[9px] font-black text-rose-500 uppercase">Bravo</div>
						<div class="text-2xl font-black text-rose-400">{currentState?.teams.B.score ?? 0}</div>
					</div>
				</div>

				<!-- Live State Inspector -->
				<div class="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
					<div class="mb-3 flex items-center justify-between">
						<h4 class="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Live Data</h4>
						<span class="text-[8px] font-bold text-emerald-500/50 uppercase">Tick {currentTick}</span>
					</div>
					<div class="max-h-64 overflow-y-auto no-scrollbar">
						{#if currentState}
							<StateInspector data={currentState} />
						{/if}
					</div>
				</div>
			</section>

			<!-- Protocol Reference -->
			<section class="space-y-4">
				<h3 class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol Reference</h3>
				
				<div class="space-y-2">
					<div class="rounded-xl border border-white/5 bg-zinc-900/50 p-4">
						<div class="mb-2 text-[9px] font-black text-emerald-500 uppercase">SensedState</div>
						<pre class="text-[10px] leading-relaxed text-zinc-400"><code>{`{
  tick: number,
  players: Player[],
  pointZone: PointZone,
  teams: { A, B }
}`}</code></pre>
					</div>

					<div class="rounded-xl border border-white/5 bg-zinc-900/50 p-4">
						<div class="mb-2 text-[9px] font-black text-emerald-500 uppercase">Player</div>
						<pre class="text-[10px] leading-relaxed text-zinc-400"><code>{`{
  id: string,
  team: 'A' | 'B',
  position: { x, y },
  status: 'active' | ...
}`}</code></pre>
					</div>

					<div class="rounded-xl border border-white/5 bg-zinc-900/50 p-4">
						<div class="mb-2 text-[9px] font-black text-emerald-500 uppercase">Action</div>
						<pre class="text-[10px] leading-relaxed text-zinc-400"><code>{`{
  playerId: string,
  type: 'MOVE' | 'STAY',
  direction?: 'UP' | 'DOWN' | ...
}`}</code></pre>
					</div>
				</div>
			</section>

			<!-- Protocol Info -->
			<section class="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
				<h3 class="mb-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">About V1</h3>
				<p class="text-xs leading-relaxed text-zinc-400">
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
