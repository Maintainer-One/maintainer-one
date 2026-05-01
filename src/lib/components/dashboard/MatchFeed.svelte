<script lang="ts">
	import { base } from '$app/paths';
	import { supabase, getActiveSeason } from '$lib/supabase';
	import { onMount } from 'svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
	import BrandLoading from '$lib/components/BrandLoading.svelte';

	let upcomingMatches: any[] = $state([]);
	let recentMatches: any[] = $state([]);
	let activeSeason: any = $state(null);
	let isLoading = $state(true);
	let now = $state(new Date());

	async function fetchMatches() {
		isLoading = true;
		
		activeSeason = await getActiveSeason();
		if (!activeSeason) {
			upcomingMatches = [];
			recentMatches = [];
			isLoading = false;
			return;
		}

		// 1. Fetch upcoming matches (pending)
		const { data: upcoming } = await supabase
			.from('matches')
			.select(`
				id, status, home_score, away_score, scheduled_time,
				home_team:teams!home_team_id (name, color),
				away_team:teams!away_team_id (name, color)
			`)
			.eq('season_id', activeSeason.id)
			.eq('status', 'pending')
			.order('scheduled_time', { ascending: true })
			.limit(6);

		// 2. Fetch recent matches (simulated)
		const { data: recent } = await supabase
			.from('matches')
			.select(`
				id, status, home_score, away_score, scheduled_time,
				home_team:teams!home_team_id (name, color),
				away_team:teams!away_team_id (name, color)
			`)
			.eq('season_id', activeSeason.id)
			.eq('status', 'simulated')
			.order('scheduled_time', { ascending: false })
			.limit(6);

		upcomingMatches = upcoming || [];
		recentMatches = recent || [];
		isLoading = false;
	}

	onMount(() => {
		fetchMatches();
		const interval = setInterval(() => {
			now = new Date();
		}, 1000);
		return () => clearInterval(interval);
	});

	function formatMatchTime(scheduledTime: string, status: string) {
		const target = new Date(scheduledTime);
		const diff = target.getTime() - now.getTime();

		if (status === 'simulated') {
			const diffMins = Math.floor(Math.abs(diff) / 60000);
			const diffHours = Math.floor(diffMins / 60);
			const diffDays = Math.floor(diffHours / 24);

			if (diffMins < 1) return 'Just now';
			if (diffMins < 60) return `${diffMins}m ago`;
			if (diffHours < 24) return `${diffHours}h ago`;
			return `${diffDays}d ago`;
		}

		if (diff > 0) {
			if (target.toDateString() === now.toDateString()) {
				const h = Math.floor(diff / 3600000);
				const m = Math.floor((diff % 3600000) / 60000);
				const s = Math.floor((diff % 60000) / 1000);
				return `Starts in ${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
			} else {
				return target.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
			}
		}

		if (status === 'live') return 'LIVE NOW';
		return 'In Progress';
	}
</script>

{#snippet matchCard(match: any)}
	<div class="group relative flex flex-col gap-3 rounded-xl border border-white/10 bg-glass p-4 transition-all hover:bg-white/10 hover:shadow-lg">
		{#if match.status === 'live'}
			<div class="absolute -right-2 -top-2 flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-500 border border-red-500/50">
				<span class="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
				LIVE
			</div>
		{/if}

		<div class="flex flex-1 items-center justify-between">
			<div class="flex flex-1 flex-col items-center gap-1 text-center">
				<div class="flex h-12 w-12 items-center justify-center rounded-full font-bold shadow-md" style="background-color: {match.home_team.color}44; border: 2px solid {match.home_team.color}88; color: {match.home_team.color}">
					{match.home_team.name.charAt(0)}
				</div>
				<span class="text-xs font-bold text-[var(--color-brand-secondary)]/80 line-clamp-1">{match.home_team.name}</span>
			</div>

			<div class="flex flex-col items-center justify-center px-4">
				<div class="text-2xl font-black tracking-tighter text-white">
					{match.home_score ?? 0} <span class="text-[var(--color-brand-secondary)]/20">-</span> {match.away_score ?? 0}
				</div>
				<span class="text-[10px] uppercase text-[var(--color-brand-secondary)]/40 font-bold tracking-wider">{formatMatchTime(match.scheduled_time, match.status)}</span>
			</div>

			<div class="flex flex-1 flex-col items-center gap-1 text-center">
				<div class="flex h-12 w-12 items-center justify-center rounded-full font-bold shadow-md" style="background-color: {match.away_team.color}44; border: 2px solid {match.away_team.color}88; color: {match.away_team.color}">
					{match.away_team.name.charAt(0)}
				</div>
				<span class="text-xs font-bold text-[var(--color-brand-secondary)]/80 line-clamp-1">{match.away_team.name}</span>
			</div>
		</div>

		<div class="mt-2 flex border-t border-white/10 pt-3">
			<a href="{base}/match/{match.id}" class="flex-1 text-center text-xs font-medium text-[var(--color-brand-primary)] transition-colors hover:text-white">
				{match.status === 'live' ? 'Spectate Live' : (match.status === 'simulated' ? 'Watch Replay' : 'View Details')} &rarr;
			</a>
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
		<!-- Upcoming Section -->
		{#if upcomingMatches.length > 0}
			<section class="space-y-4">
				<div class="flex items-center justify-between border-b border-white/10 pb-2">
					<h2 class="text-xl font-bold tracking-tight text-[var(--color-brand-secondary)] flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-brand-primary)]"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.78-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>
						Upcoming Matches
					</h2>
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
