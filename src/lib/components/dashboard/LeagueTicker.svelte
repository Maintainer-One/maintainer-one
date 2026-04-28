<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	let events: string[] = $state([]);

	async function fetchRecentEvents() {
		const { data, error } = await supabase
			.from('matches')
			.select(`
				home_score,
				away_score,
				home_team:teams!home_team_id (name),
				away_team:teams!away_team_id (name)
			`)
			.eq('status', 'simulated')
			.order('scheduled_time', { ascending: false })
			.limit(10);

		if (error) {
			console.error('Error fetching ticker events:', error);
			return;
		}

		events = data.map(m => 
			`${m.home_team.name} ${m.home_score} - ${m.away_score} ${m.away_team.name}`
		);

		if (events.length === 0) {
			events = ["Inaugural Season is live!", "Teams are preparing for their first matches.", "Spectators welcome in the Film Room."];
		}
	}

	onMount(() => {
		fetchRecentEvents();
	});
</script>

<div class="relative flex overflow-x-hidden border-b border-white/10 bg-black/40 py-2 text-sm">
	<div class="animate-marquee whitespace-nowrap text-white/70">
		{#each events as event}
			<span class="mx-8 inline-flex items-center gap-2">
				<span class="h-2 w-2 rounded-full bg-[#00f2fe] shadow-[0_0_8px_rgba(0,242,254,0.8)]"></span>
				{event}
			</span>
		{/each}
	</div>
	
	<!-- Duplicate for seamless looping -->
	<div class="absolute top-2 animate-marquee2 whitespace-nowrap text-white/70">
		{#each events as event}
			<span class="mx-8 inline-flex items-center gap-2">
				<span class="h-2 w-2 rounded-full bg-[#00f2fe] shadow-[0_0_8px_rgba(0,242,254,0.8)]"></span>
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
		animation: marquee 35s linear infinite;
	}
	.animate-marquee2 {
		animation: marquee2 35s linear infinite;
	}
</style>
