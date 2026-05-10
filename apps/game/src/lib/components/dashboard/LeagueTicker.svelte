<script lang="ts">
	import { supabase, getActiveSeason } from '$lib/supabase';
	import { onMount } from 'svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';

	let { season = null } = $props<{ season?: any }>();
	let events: string[] = $state([]);
	let internalSeason = $state<any>(null);
	let activeSeason = $derived(season || internalSeason);

	async function fetchRecentEvents() {
		if (!activeSeason) {
			internalSeason = await getActiveSeason();
			if (!internalSeason) {
				events = ["Welcome to Maintainer One.", "Teams are refining their logic.", "Check the schedule for upcoming matches."];
				return;
			}
			return; // Effect will trigger re-fetch
		}


		const { data, error } = await supabase
			.from('matches')
			.select(`
				id,
				home_team_id,
				away_team_id,
				winner_id,
				status,
				stats,
				home_score,
				away_score,
				scheduled_time,
				leagues (protocol_config),
				seasons (protocol_config),
				home_team:teams!home_team_id (name),
				away_team:teams!away_team_id (name)
			`)
			.in('status', ['played', 'simulated'])
			.eq('season_id', activeSeason.id)
			.order('scheduled_time', { ascending: false });

		if (error) {
			console.error('Error fetching ticker events:', error);
			return;
		}

		const { data: teamsData } = await supabase.from('teams').select('id, name, color');

		const nowTime = new Date().getTime();
		const validMatches = (data || []).filter(m => {
			const config = (m as any).seasons?.protocol_config ?? (m as any).leagues?.protocol_config ?? {};
			const tickRate = config.tickRateMs || 750;
			const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
			const startTime = new Date(m.scheduled_time).getTime();
			const endTime = startTime + (leagueMaxTicks * tickRate);
			return (m.status === 'played' || m.status === 'simulated') && nowTime >= endTime;
		}).slice(0, 10);

		events = validMatches.map(m => {
			const home = m.home_team as unknown as { name: string };
			const away = m.away_team as unknown as { name: string };
			return `${home?.name || 'Unknown'} ${m.home_score} - ${m.away_score} ${away?.name || 'Unknown'}`;
		});

		const isPast = activeSeason.end_date && new Date(activeSeason.end_date).getTime() < nowTime;

		if (isPast) {
			const { calculateSeasonStandings } = await import('$lib/utils/standings');
			const result = calculateSeasonStandings(teamsData || [], data || []);
			if (result.winner) {
				events.unshift(`🏆 ${activeSeason.name.toUpperCase()} CHAMPIONS: ${result.winner.name.toUpperCase()} (${result.winner.record}) 🏆`);
			}
		}

		if (events.length === 0) {
			if (isPast) {
				events = [
					`${activeSeason.name} has concluded!`,
					"Review the matches in the Film Room.",
					"Prepare your logic for the next season."
				];
			} else {
				events = [
					`${activeSeason.name} is approaching!`,
					"Teams are refining their logic.",
					"Check the schedule for upcoming match times."
				];
			}
		}
	}


	onMount(() => {
		fetchRecentEvents();
	});

	$effect(() => {
		if (activeSeason) fetchRecentEvents();
	});

	let duration = $derived(Math.max(20, events.length * 10)); // ~10s per event, min 20s

</script>

<div class="relative flex overflow-x-hidden border-b border-white/10 bg-black/40 py-2 text-sm">
	<div 
		class="animate-marquee whitespace-nowrap text-[var(--color-brand-secondary)]/70"
		style="animation-duration: {duration}s"
	>
		{#each events as event}
			<span class="mx-8 inline-flex items-center gap-2">
				<BrandLogo size="size-4" />
				{event}
			</span>
		{/each}
	</div>
	
	<!-- Duplicate for seamless looping -->
	<div 
		class="absolute top-2 animate-marquee2 whitespace-nowrap text-[var(--color-brand-secondary)]/70"
		style="animation-duration: {duration}s"
	>
		{#each events as event}
			<span class="mx-8 inline-flex items-center gap-2">
				<BrandLogo size="size-4" />
				{event}
			</span>
		{/each}
	</div>
</div>

<style>
	/* Using arbitrary values or we can add these to tailwind config. 
	   Adding simple keyframes for marquee effect here. */
	@keyframes marquee {
		0% {
			transform: translateX(0%);
		}
		100% {
			transform: translateX(-100%);
		}
	}
	@keyframes marquee2 {
		0% {
			transform: translateX(100%);
		}
		100% {
			transform: translateX(0%);
		}
	}

	.animate-marquee {
		animation: marquee 60s linear infinite;
	}
	.animate-marquee2 {
		animation: marquee2 60s linear infinite;
	}
</style>
