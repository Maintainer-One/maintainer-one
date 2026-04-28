<script lang="ts">
	import TeamCard from './TeamCard.svelte';

	// Mock Standings data
	const standings = [
		{ name: 'Azure', color: '#007FFF', record: '12-2-0', rating: '1450' },
		{ name: 'Burgundy', color: '#800020', record: '10-3-1', rating: '1390' },
		{ name: 'Crimson', color: '#DC143C', record: '9-4-1', rating: '1310' },
		{ name: 'Denim', color: '#1560BD', record: '8-6-0', rating: '1255' },
		{ name: 'Emerald', color: '#50C878', record: '6-7-1', rating: '1120' },
		{ name: 'Fuchsia', color: '#FF00FF', record: '4-9-1', rating: '980' },
	];
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between border-b border-white/10 pb-2">
		<h2 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#00f2fe]"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
			Global Standings
		</h2>
		<button class="text-sm text-white/50 hover:text-white transition-colors">View All</button>
	</div>

	<div class="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
		{#each standings as team, i}
			<div class="flex items-center gap-3">
				<div class="flex w-6 justify-center text-sm font-bold {i < 3 ? 'text-[#00f2fe]' : 'text-white/40'}">
					{i + 1}
				</div>
				<div class="flex-1">
					<TeamCard {...team} />
				</div>
			</div>
		{/each}
	</div>
</div>
