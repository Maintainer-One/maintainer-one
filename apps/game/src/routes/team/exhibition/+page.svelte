<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { createInitialState } from '$packages/engine/core';
	import type { GameState } from '$packages/engine/types';
	import SimWorker from '$lib/workers/sim.worker?worker';
	import { fade, fly, slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { scratchpad } from '$lib/stores/scratchpad';

	type Team = { id: string, name: string, color?: string };
	type Version = { id: string, version_number: number, source_code: string, compiled_code: string };

	let teams = $state<Team[]>([]);
	let selectedTeamA = $state<string | null>(null);
	let selectedTeamB = $state<string | null>(null);
	let versionsA = $state<Version[]>([]);
	let versionsB = $state<Version[]>([]);
	let selectedVersionA = $state<string | null>(null);
	let selectedVersionB = $state<string | null>(null);
	let matchSeed = $state(Math.floor(Math.random() * 1000000).toString());
	
	let isSimulating = $state(false);
	let simResult = $state<GameState | null>(null);
	let simWorker: Worker | null = null;
	let errorMessage = $state<string | null>(null);

	// Scratchpad integration
	let useScratchpadA = $state(false);
	let useScratchpadB = $state(false);
	let scratchpadContent = { A: '', B: '' };

	$effect(() => {
		const unsubscribe = scratchpad.subscribe(v => {
			scratchpadContent.A = v.A;
			scratchpadContent.B = v.B;
		});
		return unsubscribe;
	});

	let teamA = $derived(teams.find(t => t.id === selectedTeamA));
	let teamB = $derived(teams.find(t => t.id === selectedTeamB));

	async function loadTeams() {
		const { data, error } = await supabase.from('teams').select('id, name, color');
		if (!error && data) {
			teams = data;
			if (teams.length >= 2) {
				selectedTeamA = teams[0].id;
				selectedTeamB = teams[1].id;
				await loadVersions('A', teams[0].id);
				await loadVersions('B', teams[1].id);
			}
		}
	}

	async function loadVersions(side: 'A' | 'B', teamId: string) {
		const { data, error } = await supabase
			.from('team_code_versions')
			.select('id, version_number, source_code, compiled_code')
			.eq('team_id', teamId)
			.order('version_number', { ascending: false });
		
		if (!error && data) {
			if (side === 'A') {
				versionsA = data;
				if (data.length > 0) selectedVersionA = data[0].id;
			} else {
				versionsB = data;
				if (data.length > 0) selectedVersionB = data[0].id;
			}
		}
	}

	async function startExhibition() {
		if ((!selectedVersionA && !useScratchpadA) || (!selectedVersionB && !useScratchpadB)) return;
		
		isSimulating = true;
		errorMessage = null;
		simResult = null;

		const versionA = versionsA.find(v => v.id === selectedVersionA);
		const versionB = versionsB.find(v => v.id === selectedVersionB);
		const teamA = teams.find(t => t.id === selectedTeamA);
		const teamB = teams.find(t => t.id === selectedTeamB);

		const initialState = createInitialState(Number(matchSeed), 'v1', {}, { A: teamA, B: teamB });
		
		if (simWorker) {
			simWorker.postMessage({
				type: 'SIMULATE_BRANCH',
				startState: initialState,
				alphaCode: useScratchpadA ? scratchpadContent.A : versionA?.source_code,
				bravoCode: useScratchpadB ? scratchpadContent.B : versionB?.source_code,
				alphaCompiled: useScratchpadA ? null : versionA?.compiled_code,
				bravoCompiled: useScratchpadB ? null : versionB?.compiled_code,
				maxTicks: 1000
			});
		}
	}

	function watchInFilmRoom() {
		if (!simResult) return;
		
		// To watch in film room with these specific versions/codes, 
		// we'd ideally pass them via state or a session-based storage
		// For now, we'll just go to the film room. 
		// If they used scratchpad, it's already in the store.
		// If they used specific versions, we'd need a way to tell film room "use these versions".
		// For the MVP, we'll just navigate to film room.
		goto(`${base}/film-room`);
	}

	onMount(async () => {
		if (browser) {
			simWorker = new SimWorker();
			simWorker.onmessage = (e) => {
				if (e.data.type === 'SIMULATION_COMPLETE') {
					const states = e.data.states;
					simResult = states[states.length - 1];
					isSimulating = false;
				} else if (e.data.type === 'SIMULATION_ERROR') {
					errorMessage = e.data.error;
					isSimulating = false;
				}
			};
			await loadTeams();
		}
	});

	function randomizeSeed() {
		matchSeed = Math.floor(Math.random() * 1000000).toString();
	}
</script>

<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 p-8 lg:p-12 font-sans selection:bg-[var(--color-brand-primary)]/30">
	<header class="mb-12 flex items-center justify-between">
		<div class="flex items-center gap-8">
			<div class="inline-flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl">
				<div class="flex items-center gap-4">
					<a href="{base}/" aria-label="Go back" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md">
						<svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
					</a>
					<div class="flex flex-col">
						<h1 class="text-2xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">
							Exhibition <span class="text-[var(--color-brand-primary)]">Room</span>
						</h1>
						<p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Practice & Calibration</p>
					</div>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-4">
			<div class="flex flex-col items-end">
				<label for="seed" class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Match Seed</label>
				<div class="flex items-center gap-2">
					<input 
						id="seed"
						type="text" 
						bind:value={matchSeed}
						class="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--color-brand-primary)] focus:outline-none focus:border-[var(--color-brand-primary)]/50 transition-colors w-32"
					/>
					<button 
						onclick={randomizeSeed}
						class="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white transition-colors"
						title="Randomize Seed"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
					</button>
				</div>
			</div>
		</div>
	</header>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
		<!-- Team A Setup -->
		<div class="space-y-6" in:fly={{ x: -20, duration: 800 }}>
			<div class="flex items-center gap-3">
				<div class="h-8 w-1.5 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]" style="background-color: {teamA?.color || '#3b82f6'}"></div>
				<h2 class="text-xs font-black uppercase tracking-[0.2em]" style="color: {teamA?.color || '#3b82f6'}">{teamA?.name || 'Home Team'}</h2>
			</div>

			<div class="rounded-3xl border border-white/5 bg-black/20 p-8 backdrop-blur-xl space-y-6">
				<div class="space-y-4">
					<label for="team-a-select" class="block text-[10px] font-black uppercase tracking-widest text-white/20">Select Team</label>
					<select 
						id="team-a-select"
						bind:value={selectedTeamA} 
						onchange={() => selectedTeamA && loadVersions('A', selectedTeamA)}
						class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
					>
						{#each teams as team}
							<option value={team.id}>{team.name}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<label for="version-a-select" class="block text-[10px] font-black uppercase tracking-widest text-white/20">Logic Version</label>
						<button 
							onclick={() => useScratchpadA = !useScratchpadA}
							class="text-[9px] font-black uppercase tracking-widest {useScratchpadA ? 'text-blue-400' : 'text-white/40'} hover:text-blue-300 transition-colors"
						>
							{useScratchpadA ? '✓ Using Scratchpad' : 'Use Scratchpad'}
						</button>
					</div>
					
					{#if !useScratchpadA}
						<select 
							id="version-a-select"
							bind:value={selectedVersionA}
							class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
						>
							{#each versionsA as v}
								<option value={v.id}>Version {v.version_number}</option>
							{/each}
						</select>
					{:else}
						<div class="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-[10px] text-blue-300/60 font-medium italic">
							Using current code from the Film Room scratchpad.
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Team B Setup -->
		<div class="space-y-6" in:fly={{ x: 20, duration: 800 }}>
			<div class="flex items-center gap-3 justify-end lg:justify-start">
				<div class="h-8 w-1.5 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.5)] lg:order-first order-last" style="background-color: {teamB?.color || '#f43f5e'}"></div>
				<h2 class="text-xs font-black uppercase tracking-[0.2em]" style="color: {teamB?.color || '#f43f5e'}">{teamB?.name || 'Away Team'}</h2>
			</div>

			<div class="rounded-3xl border border-white/5 bg-black/20 p-8 backdrop-blur-xl space-y-6">
				<div class="space-y-4">
					<label for="team-b-select" class="block text-[10px] font-black uppercase tracking-widest text-white/20">Select Opponent</label>
					<select 
						id="team-b-select"
						bind:value={selectedTeamB}
						onchange={() => selectedTeamB && loadVersions('B', selectedTeamB)}
						class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer"
					>
						{#each teams as team}
							<option value={team.id}>{team.name}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<label for="version-b-select" class="block text-[10px] font-black uppercase tracking-widest text-white/20">Logic Version</label>
						<button 
							onclick={() => useScratchpadB = !useScratchpadB}
							class="text-[9px] font-black uppercase tracking-widest {useScratchpadB ? 'text-rose-400' : 'text-white/40'} hover:text-rose-300 transition-colors"
						>
							{useScratchpadB ? '✓ Using Scratchpad' : 'Use Scratchpad'}
						</button>
					</div>
					
					{#if !useScratchpadB}
						<select 
							id="version-b-select"
							bind:value={selectedVersionB}
							class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer"
						>
							{#each versionsB as v}
								<option value={v.id}>Version {v.version_number}</option>
							{/each}
						</select>
					{:else}
						<div class="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-[10px] text-rose-300/60 font-medium italic">
							Using current code from the Film Room scratchpad.
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Action Section -->
	<div class="mt-16 flex flex-col items-center gap-12 max-w-4xl mx-auto">
		<button 
			onclick={startExhibition}
			disabled={isSimulating}
			class="group relative px-12 py-5 rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
		>
			{#if isSimulating}
				<span class="flex items-center gap-3">
					<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Simulating...
				</span>
			{:else}
				Run Simulation
			{/if}
		</button>

		{#if errorMessage}
			<div class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm font-bold text-rose-400" transition:shake>
				{errorMessage}
			</div>
		{/if}

		{#if simResult}
			<div class="w-full space-y-8" in:fade={{ duration: 600 }}>
				<div class="flex items-center gap-4 justify-center">
					<div class="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
					<h3 class="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap">Match Result</h3>
					<div class="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
				</div>

				<div class="grid grid-cols-3 items-center gap-8 bg-black/40 rounded-3xl border border-white/5 p-10 backdrop-blur-2xl">
					<div class="text-right space-y-2">
						<div class="text-[10px] font-black uppercase tracking-widest opacity-40" style="color: {simResult.teams.A.color}">{simResult.teams.A.name}</div>
						<div class="text-4xl lg:text-6xl font-black text-white">{simResult.teams.A.score}</div>
					</div>
					
					<div class="flex flex-col items-center gap-4">
						<div class="text-[10px] font-black uppercase tracking-[0.2em] text-white/10">vs</div>
						<div class="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
							{simResult.tick} Ticks
						</div>
					</div>

					<div class="text-left space-y-2">
						<div class="text-[10px] font-black uppercase tracking-widest opacity-40" style="color: {simResult.teams.B.color}">{simResult.teams.B.name}</div>
						<div class="text-4xl lg:text-6xl font-black text-white">{simResult.teams.B.score}</div>
					</div>
				</div>

				<div class="flex justify-center">
					<button 
						onclick={watchInFilmRoom}
						class="flex items-center gap-3 px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/10 hover:border-[var(--color-brand-primary)]/30 transition-all"
					>
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
						Watch Replay
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	select {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' stroke-opacity='0.2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		background-size: 1.25rem;
	}
</style>
