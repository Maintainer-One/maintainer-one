<script lang="ts">
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import type { GameState } from '../../../packages/engine/types';
	import ReplayGrid from '$lib/components/ReplayGrid.svelte';

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
	}

	onMount(() => loadReplay(selectedReplay));
	onDestroy(() => stopPlayback());

	let currentState = $derived(states[currentTick]);
</script>

<div class="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 font-sans">
	<!-- Main Stage: Field + Controls -->
	<main class="flex flex-1 flex-col p-6 lg:p-10">
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
				<!-- Pitch: Flex-1 with min-h-0 ensures it takes remaining height without overflowing -->
				<div class="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden p-4">
					<ReplayGrid state={currentState} />
				</div>

				<!-- Playback Hub (Under Field) -->
				<div class="w-full max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-2xl backdrop-blur-xl">
					<div class="flex items-center gap-5">
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

						<div class="flex-1">
							<input
								type="range"
								min="0"
								max={states.length - 1}
								bind:value={currentTick}
								class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-emerald-500"
							/>
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

	<!-- Analysis Sidebar -->
	<aside class="flex w-80 flex-col border-l border-white/5 bg-zinc-900/30 p-6 backdrop-blur-3xl lg:p-8">
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

				<div class="rounded-xl border border-white/5 bg-zinc-800/20 p-4">
					<div class="mb-1 text-[9px] font-black text-zinc-500 uppercase">Current Winner</div>
					<div class="text-lg font-black italic tracking-tighter text-white uppercase">
						{currentState?.winner ? `Team ${currentState.winner}` : 'IN PROGRESS'}
					</div>
				</div>
			</section>

			<!-- Protocol Info -->
			<section class="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
				<h3 class="mb-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Protocol</h3>
				<p class="text-xs leading-relaxed text-zinc-400">
					V1: 10x10 Grid. Point zone at (4,5). Teams start at opposite ends. First to capture wins.
				</p>
			</section>
		</div>

		<!-- Footer -->
		<footer class="mt-8 border-t border-white/5 pt-6 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
			Maintainer One v0.0.1
		</footer>
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
