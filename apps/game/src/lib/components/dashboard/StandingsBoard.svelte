<script lang="ts">
	import TeamCard from './TeamCard.svelte';
	import { supabase, getActiveSeason } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { getProtocol } from '$packages/protocols/registry';

	let { season = null }: { season?: any } = $props();
	let teams: any[] = $state([]);
	let isLoading = $state(true);

	const DEFAULT_TICK_RATE = 750;
	const K_FACTOR = 32;

	async function fetchStandings() {
		if (!season) {
			teams = [];
			isLoading = false;
			return;
		}

		// 2. Fetch all teams
		const { data: teamsData, error: teamsError } = await supabase
			.from('teams')
			.select('id, name, color');

		if (teamsError) {
			console.error('Error fetching teams:', teamsError);
			isLoading = false;
			return;
		}

		// 3. Fetch matches for active season
		// We fetch all simulated matches and their metadata to calculate ELO and filter by time
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

		// 4. Initialize standings map
		const standingsMap = new Map();
		teamsData.forEach(t => {
			standingsMap.set(t.id, { 
				...t, 
				wins: 0, 
				losses: 0, 
				draws: 0, 
				points: 0,
				rating: 1000
			});
		});

		const nowTime = new Date().getTime();

		// 5. Calculate records and ELO
		// Filter out live/unstarted matches
		const pastMatches = matchesData.filter(m => {
			const config = (m.seasons as any)?.protocol_config ?? (m.leagues as any)?.protocol_config ?? {};
			const tickRate = config.tickRateMs || DEFAULT_TICK_RATE;
			const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
			const startTime = new Date(m.scheduled_time).getTime();
			const endTime = startTime + (leagueMaxTicks * tickRate);
			return (m.status === 'played' || m.status === 'simulated' || m.status === 'simmed') && nowTime >= endTime;
		});

		// Resolve standings via Protocol
		if (pastMatches.length > 0 || teamsData.length > 0) {
			const protocolVersion = pastMatches.length > 0 ? (pastMatches[0].leagues as any)?.protocol_version || 'v1' : 'v1';
			const config = pastMatches.length > 0 ? ((pastMatches[0].seasons as any)?.protocol_config ?? (pastMatches[0].leagues as any)?.protocol_config ?? {}) : {};
			const protocol = getProtocol(protocolVersion);
			const resolvedStandingsResult = protocol.resolveStandings(config, pastMatches, teamsData);
			const resolvedStandings = resolvedStandingsResult.standings || resolvedStandingsResult;
			
			for (const [teamId, stats] of Object.entries(resolvedStandings)) {
				const team = standingsMap.get(teamId);
				if (team) {
					team.wins = (stats as any).wins;
					team.losses = (stats as any).losses;
					team.draws = (stats as any).ties; // resolveStandings uses 'ties'
					team.points = (stats as any).points;
					team.statPoints = (stats as any).statPoints || 0;
					team.statAwards = (stats as any).statAwards || [];
				}
			}
		}

		// Calculate ELO
		pastMatches.forEach(m => {
			const home = standingsMap.get(m.home_team_id);
			const away = standingsMap.get(m.away_team_id);
			if (!home || !away) return;

			const Ra = home.rating;
			const Rb = away.rating;
			const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
			const Eb = 1 / (1 + Math.pow(10, (Ra - Rb) / 400));
			
			let Sa = 0.5; // Draw
			if (m.home_score > m.away_score) Sa = 1;
			else if (m.away_score > m.home_score) Sa = 0;
			
			const Sb = 1 - Sa;

			home.rating = Math.round(Ra + K_FACTOR * (Sa - Ea));
			away.rating = Math.round(Rb + K_FACTOR * (Sb - Eb));
		});

		// 6. Sort and format
		teams = Array.from(standingsMap.values())
			.map(t => ({
				...t,
				record: `${t.wins}-${t.losses}-${t.draws}`
			}))
			.sort((a, b) => b.points - a.points || b.wins - a.wins || b.rating - a.rating);

		isLoading = false;
	}

	onMount(() => {
		if (season) fetchStandings();
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
					<div class="flex-1">
						<TeamCard {...team} />
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
