<script lang="ts">
	import TeamCard from './TeamCard.svelte';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	let teams: any[] = $state([]);
	let isLoading = $state(true);

	async function fetchStandings() {
		isLoading = true;
		
		// 1. Fetch all teams
		const { data: teamsData, error: teamsError } = await supabase
			.from('teams')
			.select('id, name, color');

		if (teamsError) {
			console.error('Error fetching teams:', teamsError);
			isLoading = false;
			return;
		}

		// 2. Fetch all simulated matches
		const { data: matchesData, error: matchesError } = await supabase
			.from('matches')
			.select('home_team_id, away_team_id, home_score, away_score, winner_id')
			.eq('status', 'simulated');

		if (matchesError) {
			console.error('Error fetching matches:', matchesError);
			isLoading = false;
			return;
		}

		// 3. Calculate records
		const standingsMap = new Map();
		teamsData.forEach(t => {
			standingsMap.set(t.id, { 
				...t, 
				wins: 0, 
				losses: 0, 
				draws: 0, 
				points: 0,
				rating: 1000 + Math.floor(Math.random() * 50) // Placeholder rating
			});
		});

		matchesData.forEach(m => {
			const home = standingsMap.get(m.home_team_id);
			const away = standingsMap.get(m.away_team_id);
			
			if (!home || !away) return;

			if (m.home_score > m.away_score) {
				home.wins++;
				home.points += 3;
				away.losses++;
			} else if (m.away_score > m.home_score) {
				away.wins++;
				away.points += 3;
				home.losses++;
			} else {
				home.draws++;
				away.draws++;
				home.points += 1;
				away.points += 1;
			}
		});

		// 4. Sort and format
		teams = Array.from(standingsMap.values())
			.map(t => ({
				...t,
				record: `${t.wins}-${t.losses}-${t.draws}`
			}))
			.sort((a, b) => b.points - a.points || b.wins - a.wins);

		isLoading = false;
	}

	onMount(() => {
		fetchStandings();
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between border-b border-white/10 pb-2">
		<h2 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-brand-primary)]"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
			Global Standings
		</h2>
		<button class="text-sm text-white/50 hover:text-white transition-colors">View All</button>
	</div>

	<div class="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
		{#if isLoading}
			{#each Array(6) as _}
				<div class="h-20 animate-pulse rounded-xl border border-white/10 bg-white/5"></div>
			{/each}
		{:else}
			{#each teams as team, i}
				<div class="flex items-center gap-3">
					<div class="flex w-6 justify-center text-sm font-bold {i < 3 ? 'text-[var(--color-brand-primary)]' : 'text-white/40'}">
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
