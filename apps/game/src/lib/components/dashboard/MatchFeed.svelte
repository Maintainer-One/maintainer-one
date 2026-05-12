<script lang="ts">
	import { base } from '$app/paths';
	import { supabase, getActiveSeason } from '$lib/supabase';
	import { onMount } from 'svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
	import BrandLoading from '$lib/components/BrandLoading.svelte';
	import TeamIcon from '$lib/components/TeamIcon.svelte';

	import { runSimulation } from '$lib/simulation';

	let { season = null }: { season?: any } = $props();
	let upcomingMatches = $state<any[]>([]);
	let recentMatches = $state<any[]>([]);
	let isLoading = $state(true);
	let now = $state(new Date());

	// Live Simulation State
	let matchSims = $state<Record<string, any[]>>({});
	let simulatingMatches = new Set<string>();

	// Spoiler Protection
	let hideSpoilers = $state(true);
	let revealedScores = $state<Record<string, boolean>>({});

	const DEFAULT_TICK_RATE = 750;
	const MATCH_TICKS = 1000; // Still used as a fallback if config is missing
	const GRACE_PERIOD_MS = 5 * 60 * 1000;

	async function fetchMatches() {
		if (!season) {
			upcomingMatches = [];
			recentMatches = [];
			isLoading = false;
			return;
		}

		const { data, error } = await supabase
			.from('matches')
			.select(`
				id, status, home_score, away_score, scheduled_time, public_seed,
				home_code_version_id, away_code_version_id, home_override_version_id, away_override_version_id,
				leagues (protocol_version, protocol_config),
				seasons (protocol_version, protocol_config),
				home_team:teams!home_team_id (id, name, color, active_version_id),
				away_team:teams!away_team_id (id, name, color, active_version_id)
			`)
			.eq('season_id', season.id)
			.order('scheduled_time', { ascending: true });

		if (error) {
			console.error('Error fetching matches:', error);
			isLoading = false;
			return;
		}

		const allMatches = data || [];
		const nowTime = now.getTime();

		// Logic for sectioning
		upcomingMatches = allMatches
			.filter(m => {
				const startTime = new Date(m.scheduled_time).getTime();
				const config = m.seasons?.protocol_config ?? m.leagues?.protocol_config ?? {};
				const tickRate = config.tickRateMs || DEFAULT_TICK_RATE;
				const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
				const endTimeWithGrace = startTime + (leagueMaxTicks * tickRate) + GRACE_PERIOD_MS;
				
				return m.status === 'pending' || m.status === 'scheduled' || nowTime < endTimeWithGrace;
			})
			.slice(0, 6);

		recentMatches = allMatches
			.filter(m => {
				const startTime = new Date(m.scheduled_time).getTime();
				const config = m.seasons?.protocol_config ?? m.leagues?.protocol_config ?? {};
				const tickRate = config.tickRateMs || DEFAULT_TICK_RATE;
				const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
				const endTimeWithGrace = startTime + (leagueMaxTicks * tickRate) + GRACE_PERIOD_MS;
				return (m.status === 'simulated' || m.status === 'simmed' || m.status === 'played') && nowTime >= endTimeWithGrace;
			})
			.sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime())
			.slice(0, 6);

		isLoading = false;

		// Trigger background sims for Live matches
		allMatches.forEach(m => {
			const startTime = new Date(m.scheduled_time).getTime();
			const config = m.seasons?.protocol_config ?? m.leagues?.protocol_config ?? {};
			const tickRate = config.tickRateMs || DEFAULT_TICK_RATE;
			const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
			const endTime = startTime + (leagueMaxTicks * tickRate);
			
			if ((m.status === 'simulated' || m.status === 'simmed' || m.status === 'played') && nowTime >= startTime && nowTime < endTime && !matchSims[m.id] && !simulatingMatches.has(m.id)) {
				if (m.public_seed !== null && m.public_seed !== undefined) {
					simulatingMatches.add(m.id);
					runSimulation(m).then(states => {
						matchSims[m.id] = states;
						simulatingMatches.delete(m.id);
					}).catch(err => {
						console.error(`Simulation failed for match ${m.id}:`, err);
						simulatingMatches.delete(m.id);
					});
				}
			}
		});
	}

	onMount(() => {
		const stored = localStorage.getItem('hideSpoilers');
		if (stored !== null) hideSpoilers = JSON.parse(stored);

		if (season) fetchMatches();
		const interval = setInterval(() => {
			now = new Date();
			// Re-fetch matches occasionally or just update the local filtering?
			// For now, let's just refresh every 30s to keep statuses fresh
		}, 1000);

		const refreshInterval = setInterval(fetchMatches, 30000);

		return () => {
			clearInterval(interval);
			clearInterval(refreshInterval);
		};
	});

	$effect(() => {
		if (season) fetchMatches();
	});

	$effect(() => {
		localStorage.setItem('hideSpoilers', JSON.stringify(hideSpoilers));
	});

	function getMatchStatus(match: any) {
		const target = new Date(match.scheduled_time);
		const targetTime = target.getTime();
		const nowTime = now.getTime();
		const diff = targetTime - nowTime;

		if (diff > 0) {
			// Upcoming
			if (target.toDateString() === now.toDateString()) {
				const h = Math.floor(diff / 3600000);
				const m = Math.floor((diff % 3600000) / 60000);
				const s = Math.floor((diff % 60000) / 1000);
				return { label: `Starts in ${h > 0 ? h + 'h ' : ''}${m}m ${s}s`, type: 'upcoming' };
			} else {
				return { label: target.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), type: 'upcoming' };
			}
		}

		if (match.status === 'pending' || match.status === 'scheduled') {
			return { label: 'DELAYED', type: 'delayed' };
		}

		// Calculate dynamic max duration from league config
		const config = match.seasons?.protocol_config ?? match.leagues?.protocol_config ?? {};
		const tickRate = config.tickRateMs || DEFAULT_TICK_RATE;
		const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);

		const simResult = matchSims[match.id];
		const actualMaxTicks = simResult ? simResult.length - 1 : leagueMaxTicks;
		const currentTick = Math.floor((nowTime - targetTime) / tickRate);

		if (currentTick < actualMaxTicks) {
			if (match.public_seed === null || match.public_seed === undefined) {
				return { label: 'TECHNICAL DIFFICULTIES', type: 'delayed' };
			}
			return { label: `LIVE - TICK ${currentTick}`, type: 'live', tick: currentTick };
		}

		// Grace period or Finished
		const endTime = targetTime + (actualMaxTicks * tickRate);
		if (nowTime < endTime + GRACE_PERIOD_MS) {
			return { label: 'MATCH COMPLETE', type: 'grace' };
		}

		const totalDiffMins = Math.floor(Math.abs(nowTime - targetTime) / 60000);
		const diffHours = Math.floor(totalDiffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (totalDiffMins < 60) return { label: `${totalDiffMins}m ago`, type: 'past' };
		if (diffHours < 24) return { label: `${diffHours}h ago`, type: 'past' };
		return { label: `${diffDays}d ago`, type: 'past' };
	}

	function getLiveScore(matchId: string, tick: number) {
		const states = matchSims[matchId];
		if (!states) return { A: 0, B: 0 };
		const state = states[Math.min(tick, states.length - 1)];
		return { A: state.teams.A.score, B: state.teams.B.score };
	}
</script>

{#snippet matchCard(match: any)}
	{@const status = getMatchStatus(match)}
	{@const liveScore = status.type === 'live' ? getLiveScore(match.id, status.tick!) : null}
	{@const isRevealed = revealedScores[match.id] || !hideSpoilers}
	
	<div class="group relative flex flex-col gap-3 rounded-xl border border-white/10 bg-glass p-4 transition-all hover:bg-white/10 hover:shadow-lg">
		{#if status.type === 'live'}
			<div class="absolute -right-2 -top-2 flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black text-white shadow-xl">
				<span class="h-2 w-2 animate-pulse rounded-full bg-white"></span>
				LIVE
			</div>
		{/if}

		<div class="flex flex-1 items-center justify-between">
			<!-- Team A -->
			<div class="flex flex-1 flex-col items-center gap-2 text-center">
				<div class="flex h-16 w-16 items-center justify-center rounded-2xl" style="background: radial-gradient(circle at center, {match.home_team.color}33 0%, transparent 70%);">
					<TeamIcon 
						teamName={match.home_team.name} 
						color={match.home_team.color} 
						size="size-12" 
						class="drop-shadow-[0_0_8px_{match.home_team.color}66]"
					/>
				</div>
				<span class="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-secondary)]/60 line-clamp-1">{match.home_team.name}</span>
			</div>

			<!-- Score -->
			<div class="flex flex-col items-center justify-center px-4 min-w-[120px]">
				<div class="text-3xl font-black tracking-tighter text-white italic">
					{#if status.type === 'upcoming' || status.type === 'delayed'}
						0 <span class="text-[var(--color-brand-secondary)]/20">-</span> 0
					{:else if isRevealed}
						{liveScore ? liveScore.A : (match.home_score ?? 0)} 
						<span class="text-[var(--color-brand-secondary)]/20">-</span> 
						{liveScore ? liveScore.B : (match.away_score ?? 0)}
					{:else}
						<button 
							onclick={(e) => { e.preventDefault(); revealedScores[match.id] = true; }}
							class="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-1.5 rounded-md hover:bg-[var(--color-brand-primary)]/20 transition-colors border border-[var(--color-brand-primary)]/20"
						>
							Reveal
						</button>
					{/if}
				</div>
				<span class="text-[9px] uppercase font-black tracking-[0.2em] {status.type === 'live' ? 'text-[var(--color-brand-primary)]' : 'text-white/20'} mt-1">
					{status.label}
				</span>
			</div>

			<!-- Team B -->
			<div class="flex flex-1 flex-col items-center gap-2 text-center">
				<div class="flex h-16 w-16 items-center justify-center rounded-2xl" style="background: radial-gradient(circle at center, {match.away_team.color}33 0%, transparent 70%);">
					<TeamIcon 
						teamName={match.away_team.name} 
						color={match.away_team.color} 
						size="size-12" 
						class="drop-shadow-[0_0_8px_{match.away_team.color}66]"
					/>
				</div>
				<span class="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-secondary)]/60 line-clamp-1">{match.away_team.name}</span>
			</div>
		</div>

		<div class="mt-2 flex gap-2 border-t border-white/10 pt-3">
			{#if status.type === 'upcoming' || status.type === 'delayed'}
				<a href="{base}/match/{match.id}" class="flex-1 text-center text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)] transition-all hover:bg-[var(--color-brand-primary)]/10 py-2 rounded-lg">
					View Details &rarr;
				</a>
			{:else if status.type === 'live'}
				<a href="{base}/match/{match.id}" class="flex-1 text-center text-xs font-black uppercase tracking-widest text-white bg-[var(--color-brand-primary)]/20 transition-all hover:bg-[var(--color-brand-primary)]/30 py-2 rounded-lg border border-[var(--color-brand-primary)]/30">
					Watch Match &rarr;
				</a>
			{:else}
				<a href="{base}/team/{match.home_team.id}/film-room?match={match.id}" class="flex items-center justify-center px-4 transition-all hover:bg-white/5 py-2 rounded-lg group" style="color: {match.home_team.color}" title="{match.home_team.name} Film Room">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-60 group-hover:opacity-100 transition-opacity"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 7.5h4"/><path d="M3 12h4"/><path d="M3 16.5h4"/><path d="M17 7.5h4"/><path d="M17 12h4"/><path d="M17 16.5h4"/></svg>
				</a>
				<div class="flex flex-1 border-l border-r border-white/5">
					<a href="{base}/match/{match.id}" class="flex-1 text-center text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all hover:bg-white/5 py-2">
						Watch
					</a>
					<a href="{base}/match/{match.id}/stats" class="flex-1 text-center text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all hover:bg-white/5 py-2 border-l border-white/5">
						Stats
					</a>
				</div>
				<a href="{base}/team/{match.away_team.id}/film-room?match={match.id}" class="flex items-center justify-center px-4 transition-all hover:bg-white/5 py-2 rounded-lg group" style="color: {match.away_team.color}" title="{match.away_team.name} Film Room">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-60 group-hover:opacity-100 transition-opacity"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 7.5h4"/><path d="M3 12h4"/><path d="M3 16.5h4"/><path d="M17 7.5h4"/><path d="M17 12h4"/><path d="M17 16.5h4"/></svg>
				</a>
			{/if}
		</div>
		
		<div class="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity rounded-xl" style="background: linear-gradient(90deg, {match.home_team.color} 0%, {match.away_team.color} 100%);"></div>
	</div>
{/snippet}

<div class="flex flex-col gap-12">
	{#if isLoading}
		<BrandLoading message="Synchronizing Match Feed..." />
	{:else if upcomingMatches.length === 0 && recentMatches.length === 0}
		<div class="flex flex-col items-center justify-center py-12 text-white/40">
			<BrandLogo size="size-16" class="mb-4 opacity-20 grayscale" />
			<p>No matches scheduled yet.</p>
		</div>
	{:else}
		<!-- Upcoming & Live Section -->
		{#if upcomingMatches.length > 0}
			<section class="space-y-4">
				<div class="flex items-center justify-between border-b border-white/10 pb-2">
					<h2 class="text-xl font-bold tracking-tight text-[var(--color-brand-secondary)] flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-brand-primary)]"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.78-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>
						Upcoming & Live
					</h2>
					<div class="flex items-center gap-3">
						<a 
							href="{base}/multiview" 
							class="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 transition-all flex items-center gap-1.5"
						>
							<span class="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
							Multiview
						</a>
						<button 
							onclick={() => hideSpoilers = !hideSpoilers}
							class="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/10 transition-all {hideSpoilers ? 'bg-white/5 text-white/40' : 'bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/30'}"
						>
							{hideSpoilers ? 'Spoilers Hidden' : 'Showing Scores'}
						</button>
					</div>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each upcomingMatches as match}
						{@render matchCard(match)}
					{/each}
				</div>
			</section>
		{/if}

		<!-- Recent Results Section -->
		{#if recentMatches.length > 0}
			<section class="space-y-4">
				<div class="flex items-center justify-between border-b border-white/10 pb-2">
					<h2 class="text-xl font-bold tracking-tight text-[var(--color-brand-secondary)] flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
						Recent Results
					</h2>
					<button class="text-sm text-white/50 hover:text-white transition-colors">View All</button>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each recentMatches as match}
						{@render matchCard(match)}
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>
