<script lang="ts">
	import TeamCard from './TeamCard.svelte';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { calculateSeasonStandings } from '$lib/utils/standings';

	let { season = null } = $props<{ season?: any }>();
	let teams: any[] = $state([]);
	let isLoading = $state(true);

	let isSeasonOver = $derived(season && new Date(season.end_date) < new Date());

	async function fetchStandings() {
		if (!season) {
			teams = [];
			isLoading = false;
			return;
		}

		// 2. Fetch all teams
		const { data: teamsData, error: teamsError } = await supabase
			.from('teams')
			.select('id, name, color, logo_url, logo_icon_url');

		if (teamsError) {
			console.error('Error fetching teams:', teamsError);
			isLoading = false;
			return;
		}

		// 3. Fetch matches for active season
		const { data: matchesData, error: matchesError } = await supabase
			.from('matches')
			.select(`
				id, home_team_id, away_team_id, home_score, away_score, scheduled_time, status, stats, winner_id,
				leagues (protocol_version, protocol_config),
				seasons (protocol_version, protocol_config)
			`)
			.in('status', ['simulated', 'simmed', 'played'])
			.eq('season_id', season.id)
			.order('scheduled_time', { ascending: true });

		if (matchesError) {
			console.error('Error fetching matches:', matchesError);
			isLoading = false;
			return;
		}

		// Use shared utility to calculate standings
		const result = calculateSeasonStandings(teamsData || [], matchesData || []);
		teams = result.teams;
		isLoading = false;
	}

	onMount(() => {
		fetchStandings();
		const interval = setInterval(fetchStandings, 10000); // Refresh every 10s
		return () => clearInterval(interval);
	});

	$effect(() => {
		if (season) fetchStandings();
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between border-b border-[var(--color-brand-secondary)]/10 pb-2">
		<h2 class="text-xl font-bold tracking-tight text-[var(--color-brand-secondary)] flex items-center gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-brand-primary)]"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
			{season ? season.name : 'Standings'}
		</h2>
		<a href="/leaderboard" class="text-sm font-semibold tracking-wider uppercase text-[var(--color-brand-secondary)]/50 hover:text-[var(--color-brand-primary)] transition-colors">Full Leaderboard</a>
	</div>

	<div class="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
		{#if isLoading}
			{#each Array(6) as _}
				<div class="h-20 animate-pulse rounded-xl border border-[var(--color-brand-secondary)]/10 bg-[var(--color-brand-secondary)]/5"></div>
			{/each}
		{:else}
			{#each teams as team, i}
				<div class="flex items-center gap-3 text-[var(--color-brand-secondary)]/90">
					<div class="flex w-6 justify-center text-sm font-bold {i < 3 ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-brand-secondary)]/40'}">
						{i + 1}
					</div>
					<div class="flex-1 relative">
						{#if i === 0 && isSeasonOver}
							<div class="absolute -right-2 -top-2 z-10 px-2 py-0.5 rounded-full bg-[var(--color-brand-primary)] text-[8px] font-black text-black uppercase tracking-tighter shadow-lg ring-1 ring-black/10">
								CHAMPION
							</div>
						{/if}
						<TeamCard {...team} />
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
