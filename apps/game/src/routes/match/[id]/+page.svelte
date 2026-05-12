<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { data } = $props();
	let { supabase } = $derived(data);

	import { createInitialState } from '$packages/engine/core';
	import type { GameState } from '$packages/engine/types';
	import ReplayGrid from '$lib/components/ReplayGrid.svelte';
	import SimWorker from '$lib/workers/sim.worker?worker';
	import { fade, fly } from 'svelte/transition';
	import TeamIcon from '$lib/components/TeamIcon.svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';

	let states = $state<GameState[]>([]);
	let currentTick = $state(0);
	let isPlaying = $state(false);
	let playSpeed = $state(750);
	let playbackInterval: number | null = null;
	
	let simWorker: Worker | null = null;
	let isSimulating = $state(false);
	let showControlMap = $state(true);

	let matchData = $state<any | null>(null);
	let currentTime = $state(Date.now());
	
	const isPastStartTime = $derived.by(() => {
		if (!matchData) return false;
		return currentTime >= new Date(matchData.scheduled_time).getTime();
	});

	const isPreview = $derived.by(() => {
		if (!matchData) return true;
		return !isPastStartTime;
	});

	const isAwaitingSeed = $derived.by(() => {
		return isPastStartTime && matchData?.public_seed === null;
	});

	const isLive = $derived.by(() => {
		if (!matchData || states.length === 0) return false;
		const startTime = new Date(matchData.scheduled_time).getTime();
		const endTime = startTime + (states.length * playSpeed);
		return currentTime >= startTime && currentTime < endTime;
	});

	const isCompleted = $derived.by(() => {
		if (!matchData || states.length === 0) return false;
		const startTime = new Date(matchData.scheduled_time).getTime();
		const endTime = startTime + (states.length * playSpeed);
		return currentTime >= endTime;
	});

	// Auto-sync currentTick for live matches
	$effect(() => {
		if (isLive && matchData) {
			const startTime = new Date(matchData.scheduled_time).getTime();
			const elapsed = currentTime - startTime;
			const liveTick = Math.floor(elapsed / playSpeed);
			if (currentTick !== Math.min(liveTick, states.length - 1)) {
				currentTick = Math.min(liveTick, states.length - 1);
			}
		}
	});

	// Poll for seed reveal if we are past scheduled time but still in preview
	let lastPollTime = 0;
	$effect(() => {
		const now = currentTime;
		if (matchData && isPreview && now >= new Date(matchData.scheduled_time).getTime() && !isSimulating) {
			if (now - lastPollTime > 5000) {
				lastPollTime = now;
				loadMatch(matchData.id);
			}
		}
	});

	async function loadMatch(matchId: string) {
		isSimulating = true;
		
		const { data: match, error } = await supabase
			.from('matches')
			.select(`
				id,
				public_seed,
				scheduled_time,
				league_id,
				season_id,
				leagues (protocol_version, protocol_config),
				seasons (season_number, protocol_version, protocol_config),
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
		matchData = match;

		if (matchData.public_seed === null) {
			console.log('Match is past scheduled time but public_seed is not yet revealed.');
			isSimulating = false;
			return;
		}

		// Set play speed from config
		// @ts-ignore
		const config = match.seasons?.protocol_config ?? match.leagues?.protocol_config ?? {};
		playSpeed = config.tickRateMs || 750;

		// @ts-ignore
		const homeVersionId = match.home_team.active_version_id;
		// @ts-ignore
		const awayVersionId = match.away_team.active_version_id;

		const { data: versions, error: versionError } = await supabase
			.from('team_code_versions')
			.select('id, compiled_code')
			.in('id', [homeVersionId, awayVersionId]);

		if (versionError || !versions || versions.length < 2) {
			console.error('Error fetching versions:', versionError);
			isSimulating = false;
			return;
		}

		const homeV = versions.find(v => v.id === homeVersionId)!;
		const awayV = versions.find(v => v.id === awayVersionId)!;

		// @ts-ignore
		const initialState = createInitialState(Number(match.public_seed), match.seasons?.protocol_version || match.leagues.protocol_version, config, { A: match.home_team, B: match.away_team });
		states = [initialState];
		currentTick = 0;

		const maxTicks = (config?.maxGameTicks || 100) + (config?.overtimeAllowed ? (config?.pointZoneMaxAge || 40) : 0) + 100;

		if (simWorker) {
			simWorker.postMessage({
				type: 'SIMULATE_BRANCH',
				startState: JSON.parse(JSON.stringify(initialState)),
				alphaBlocks: [{ startTick: 0, endTick: null, compiled: homeV.compiled_code }],
				bravoBlocks: [{ startTick: 0, endTick: null, compiled: awayV.compiled_code }],
				maxTicks,
				config: config ? JSON.parse(JSON.stringify(config)) : undefined
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

	onMount(async () => {
		if (browser) {
			simWorker = new SimWorker();
		simWorker.onmessage = (e) => {
			if (e.data.type === 'SIMULATION_COMPLETE') {
				states = e.data.states;
				isSimulating = false;
				// If not live and not playing, start playback automatically if match just completed
				if (!isPlaying && !isLive) {
					startPlayback();
				}
			}
		};

		const interval = setInterval(() => {
			currentTime = Date.now();
		}, 100);

		const matchId = page.params.id;
		if (matchId) loadMatch(matchId);

		return () => {
			if (simWorker) simWorker.terminate();
			if (playbackInterval) window.clearInterval(playbackInterval);
			clearInterval(interval);
		};
		}
	});

	let currentState = $derived(states[currentTick]);

	import MatchPreview from '$lib/components/match/MatchPreview.svelte';
	let returnToUrl = $derived(page.url.searchParams.get('returnTo') || `${base}/`);
</script>

<div class="flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 font-sans selection:bg-[var(--color-brand-primary)]/30">
	<!-- Left Panel: Pitch -->
	<main class="flex flex-1 flex-col p-6 lg:p-10 relative overflow-hidden">
		<header class="mb-8 flex items-center justify-between min-h-[64px]">
			<div class="flex-1 flex items-center justify-start">
				<a href="{returnToUrl}" aria-label="Back to Match View" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:text-[var(--color-brand-primary)] shadow-lg backdrop-blur-md">
					<svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
				</a>
			</div>
			
			<div class="flex items-center justify-center gap-6">
				<div class="flex items-center gap-6 bg-black/40 rounded-2xl border border-white/5 px-6 py-3 backdrop-blur-3xl shadow-2xl min-w-[520px]">
					{#if matchData && currentState}
						<div class="flex flex-1 items-center justify-end gap-4">
							<div class="flex items-center gap-3">
								<TeamIcon 
									teamName={matchData.home_team.name} 
									color={matchData.home_team.color} 
									size="size-10" 
									class="drop-shadow-[0_0_10px_{matchData.home_team.color}44]" 
								/>
								<div class="text-right">
									<div class="text-[8px] font-black uppercase tracking-widest leading-none mb-1 opacity-20">Home</div>
									<div class="text-sm font-black leading-none" style="color: {matchData.home_team.color}">{matchData.home_team.name}</div>
								</div>
							</div>
							<div class="w-12 text-center text-3xl font-black text-white tabular-nums">{currentState.teams.A.score}</div>
						</div>

						<div class="flex flex-col items-center w-36 border-x border-white/10">
							<div class="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-primary)] mb-1">Tick</div>
							<div class="text-xl font-mono font-black text-white tabular-nums">
								{currentTick}
								<span class="text-white/10 text-[10px]">/ {isLive ? currentTick : states.length - 1}</span>
							</div>
						</div>

						<div class="flex flex-1 items-center justify-start gap-4">
							<div class="w-12 text-center text-3xl font-black text-white tabular-nums">{currentState.teams.B.score}</div>
							<div class="flex items-center gap-3">
								<div class="text-left">
									<div class="text-[8px] font-black uppercase tracking-widest leading-none mb-1 opacity-20">Away</div>
									<div class="text-sm font-black leading-none" style="color: {matchData.away_team.color}">{matchData.away_team.name}</div>
								</div>
								<TeamIcon 
									teamName={matchData.away_team.name} 
									color={matchData.away_team.color} 
									size="size-10" 
									class="drop-shadow-[0_0_10px_{matchData.away_team.color}44]" 
								/>
							</div>
						</div>
					{:else if matchData}
						<div class="flex flex-1 items-center justify-end gap-3">
							<TeamIcon teamName={matchData.home_team.name} color={matchData.home_team.color} size="size-8 opacity-40" />
							<div class="text-right">
								<div class="text-[9px] font-black uppercase tracking-widest leading-none mb-1 opacity-40">Home</div>
								<div class="text-sm font-black leading-none" style="color: {matchData.home_team.color}">{matchData.home_team.name}</div>
							</div>
						</div>
						<div class="px-3 text-[10px] font-black text-white/10 uppercase tracking-widest">vs</div>
						<div class="flex flex-1 items-center justify-start gap-3">
							<div class="text-left">
								<div class="text-[9px] font-black uppercase tracking-widest leading-none mb-1 opacity-40">Away</div>
								<div class="text-sm font-black leading-none" style="color: {matchData.away_team.color}">{matchData.away_team.name}</div>
							</div>
							<TeamIcon teamName={matchData.away_team.name} color={matchData.away_team.color} size="size-8 opacity-40" />
						</div>
					{:else}
						<div class="h-8 w-60 bg-white/5 rounded-lg animate-pulse"></div>
					{/if}
				</div>

				{#if isLive}
					<div class="flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 shadow-lg animate-pulse">
						<span class="h-1.5 w-1.5 rounded-full bg-white"></span>
						<span class="text-[10px] font-black text-white uppercase tracking-widest">Live</span>
					</div>
				{/if}
			</div>

			<div class="flex-1 flex items-center justify-end gap-4">
				{#if isCompleted}
					<a 
						href="{base}/match/{matchData?.id}/stats"
						class="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] transition-all hover:bg-[var(--color-brand-primary)]/20 shadow-lg shadow-[var(--color-brand-primary)]/10"
					>
						<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
						View Final Stats
					</a>
				{/if}
				<button 
					onclick={() => showControlMap = !showControlMap}
					class="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 bg-black/40 text-[9px] font-black uppercase tracking-widest {showControlMap ? 'text-[var(--color-brand-primary)]' : 'text-white/20'} transition-all hover:bg-black/60"
				>
					<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg>
					Control Map
				</button>
			</div>
		</header>

		{#if isPreview && matchData}
			<MatchPreview match={matchData} onCountdownComplete={() => loadMatch(matchData.id)} />
		{:else if isPreview || isAwaitingSeed}
			<div class="flex flex-1 flex-col items-center justify-center gap-6">
				<div class="flex items-center justify-center italic text-white/20 font-black uppercase tracking-widest text-sm animate-pulse">
					{isAwaitingSeed ? 'Technical Difficulties - Awaiting Pitch Feed...' : 'Synchronizing Pitch Data...'}
				</div>
				{#if isAwaitingSeed}
					<button 
						onclick={() => loadMatch(matchData.id)}
						class="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all"
					>
						Retry Connection
					</button>
				{/if}
			</div>
		{:else if currentState}
			<div class="flex-1 flex flex-col items-center justify-center min-h-0">
				<div class="flex-1 w-full max-w-4xl min-h-0 p-4 flex items-center justify-center">
					<ReplayGrid primaryState={currentState} {showControlMap} {playSpeed} />
				</div>

				<!-- Playback Controls -->
				<div class="w-full max-w-2xl mt-8 rounded-2xl border border-white/10 bg-black/40 p-4 shadow-2xl backdrop-blur-2xl">
					<div class="flex items-center gap-6">
						<button 
							onclick={togglePlayback}
							disabled={isLive}
							class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
						>
							{#if isPlaying}
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
							{:else}
								<svg class="h-5 w-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
							{/if}
						</button>

						<input
							type="range"
							min="0"
							max={isLive ? currentTick : states.length - 1}
							bind:value={currentTick}
							disabled={isLive}
							class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/5 accent-[var(--color-brand-primary)] disabled:cursor-not-allowed"
						/>

						<div class="text-[10px] font-mono text-white/40 whitespace-nowrap">
							Tick {currentTick} <span class="text-white/10">/ {isLive ? currentTick : states.length - 1}</span>
						</div>
					</div>
				</div>
			</div>
		{:else if isSimulating}
			<div class="flex flex-1 items-center justify-center italic text-white/20 font-black uppercase tracking-widest text-sm animate-pulse">
				Broadcasting from Pitch...
			</div>
		{/if}
	</main>

	<!-- Right Panel: Advanced Stats -->
	<aside class="w-96 border-l border-white/5 bg-black/20 p-8 backdrop-blur-3xl overflow-y-auto no-scrollbar">
		{#if currentState}
			<div class="space-y-12">


				<!-- RNG Luck Factor -->
				<section>
					<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Fortune / Luck (xS)</h3>
					<div class="space-y-4">
						{#each ['A', 'B'] as teamID}
							{@const team = currentState.teams[teamID as TeamID]}
							<div class="rounded-2xl border border-white/5 bg-white/5 p-5">
								<div class="flex items-center justify-between mb-3">
									<span class="text-[9px] font-black uppercase tracking-widest" style="color: {team.color}">{team.name}</span>
									<span class="text-xs font-black {team.stats.luckScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
										{team.stats.luckScore > 0 ? '+' : ''}{team.stats.luckScore.toFixed(2)}
									</span>
								</div>
								<div class="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
									<div 
										class="absolute top-0 bottom-0 {team.stats.luckScore >= 0 ? 'bg-emerald-400' : 'bg-rose-400'} transition-all duration-1000" 
										style="width: {Math.min(100, Math.abs(team.stats.luckScore) * 10)}%; left: 0"
									></div>
								</div>
							</div>
						{/each}
						<p class="text-[8px] font-medium text-white/20 italic leading-relaxed">
							* xS (Expected Spawns) measures if a team is receiving more points in their controlled territory than their map control dictates.
						</p>
					</div>
				</section>

				<!-- Map Control -->
				<section>
					<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Map Dominance</h3>
					<div class="space-y-6">
						<div class="flex h-3 w-full rounded-full overflow-hidden border border-white/5">
							<div class="transition-all duration-1000" style="width: {currentState.teams.A.stats.controlPercentage * 100}%; background-color: {currentState.teams.A.color}aa"></div>
							<div class="bg-amber-500/10 transition-all duration-1000" style="width: {currentState.teams.A.stats.contestedPercentage * 100}%"></div>
							<div class="transition-all duration-1000" style="width: {currentState.teams.B.stats.controlPercentage * 100}%; background-color: {currentState.teams.B.color}aa"></div>
						</div>
						<div class="flex justify-between text-[9px] font-black uppercase tracking-widest">
							<span style="color: {currentState.teams.A.color}">{(currentState.teams.A.stats.controlPercentage * 100).toFixed(0)}%</span>
							<span class="text-white/20">{(currentState.teams.A.stats.contestedPercentage * 100).toFixed(0)}% Contested</span>
							<span style="color: {currentState.teams.B.color}">{(currentState.teams.B.stats.controlPercentage * 100).toFixed(0)}%</span>
						</div>
					</div>
				</section>

				<!-- Capture Efficiency -->
				<section>
					<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Capture Efficiency</h3>
					<div class="grid grid-cols-2 gap-4">
						<div class="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
							<div class="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Pts / Capture</div>
							<div class="text-xl font-black" style="color: {currentState.teams.A.color}">{currentState.teams.A.stats.averagePointsPerCapture.toFixed(2)}</div>
						</div>
						<div class="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
							<div class="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Pts / Capture</div>
							<div class="text-xl font-black" style="color: {currentState.teams.B.color}">{currentState.teams.B.stats.averagePointsPerCapture.toFixed(2)}</div>
						</div>
					</div>
				</section>

				<!-- Player Performance -->
				<section>
					<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Player Performance</h3>
					<div class="space-y-4">
						{#each currentState.players as p}
							<div class="rounded-2xl border border-white/5 bg-white/5 p-4 flex items-center justify-between group hover:border-[var(--color-brand-primary)]/20 transition-all">
								<div class="flex items-center gap-3">
									<div class="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black border" style="border-color: {currentState.teams[p.team].color}33; color: {currentState.teams[p.team].color}">
										{currentState.teams[p.team].name[0]}{p.id.slice(1)}
									</div>
									<div class="flex flex-col">
										<div class="flex items-center gap-1.5 leading-none mb-1">
											<span class="text-[10px] font-black text-white/80 group/pts relative cursor-help">
												{p.stats.pointsScored || 0} Pts
												<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111] border border-white/10 rounded text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover/pts:opacity-100 transition-opacity duration-75 whitespace-nowrap pointer-events-none z-50 shadow-2xl">Points Scored</div>
											</span>
											<span class="text-[10px] font-black text-white/20">/</span>
											<span class="text-[10px] font-black text-white/80 group/cps relative cursor-help">
												{p.stats.expectedCaptures + p.stats.contestedCaptures + p.stats.stolenCaptures} Cps
												<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111] border border-white/10 rounded text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover/cps:opacity-100 transition-opacity duration-75 whitespace-nowrap pointer-events-none z-50 shadow-2xl">Total Captures</div>
											</span>
											<span class="text-[10px] font-black text-white/20">/</span>
											<span class="text-[10px] font-black text-[var(--color-brand-primary)] group/ppc relative cursor-help">
												{((p.stats.pointsScored || 0) / Math.max(1, p.stats.expectedCaptures + p.stats.contestedCaptures + p.stats.stolenCaptures)).toFixed(1)} PPC
												<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111] border border-white/10 rounded text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover/ppc:opacity-100 transition-opacity duration-75 whitespace-nowrap pointer-events-none z-50 shadow-2xl">Points Per Capture</div>
											</span>
										</div>
										<span class="text-[8px] font-bold text-white/20 uppercase tracking-widest">{p.stats.squaresMoved} Squares Moved</span>
									</div>
								</div>
								<div class="text-right">
									<div class="text-[9px] font-black text-white/40 uppercase tracking-widest">{p.stats.singleStuns + p.stats.mutualStuns} Stuns</div>
									<div class="text-[8px] font-medium text-rose-500/40 italic">{p.stats.mutualStuns} Mutual</div>
								</div>
							</div>
						{/each}
					</div>
				</section>
			</div>
		{/if}
	</aside>
</div>

<style>
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 10px;
		width: 10px;
		border-radius: 50%;
		background: #10b981;
		cursor: pointer;
	}
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
