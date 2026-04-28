<script lang="ts">
	import { base } from '$app/paths';

	// Mock match data
	const matches = [
		{
			id: 'm-1',
			teamA: { name: 'Azure', color: '#007FFF', score: 5 },
			teamB: { name: 'Burgundy', color: '#800020', score: 3 },
			time: '10 mins ago',
			status: 'final'
		},
		{
			id: 'm-2',
			teamA: { name: 'Crimson', color: '#DC143C', score: 2 },
			teamB: { name: 'Denim', color: '#1560BD', score: 2 },
			time: 'LIVE',
			status: 'live'
		},
		{
			id: 'm-3',
			teamA: { name: 'Emerald', color: '#50C878', score: 1 },
			teamB: { name: 'Fuchsia', color: '#FF00FF', score: 4 },
			time: '1 hr ago',
			status: 'final'
		},
		{
			id: 'm-4',
			teamA: { name: 'Azure', color: '#007FFF', score: 6 },
			teamB: { name: 'Denim', color: '#1560BD', score: 1 },
			time: '3 hrs ago',
			status: 'final'
		}
	];
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between border-b border-white/10 pb-2">
		<h2 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#4facfe]"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.78-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>
			High-Impact Matches
		</h2>
		<button class="text-sm text-white/50 hover:text-white transition-colors">Feed Settings</button>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		{#each matches as match}
			<div class="group relative flex flex-col gap-3 rounded-xl border border-white/10 bg-glass p-4 transition-all hover:bg-white/10 hover:shadow-lg">
				
				<!-- Live indicator -->
				{#if match.status === 'live'}
					<div class="absolute -right-2 -top-2 flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-500 border border-red-500/50">
						<span class="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
						LIVE
					</div>
				{/if}

				<div class="flex flex-1 items-center justify-between">
					
					<!-- Team A -->
					<div class="flex flex-1 flex-col items-center gap-1">
						<div class="flex h-12 w-12 items-center justify-center rounded-full font-bold shadow-md" style="background-color: {match.teamA.color}44; border: 2px solid {match.teamA.color}88; color: {match.teamA.color}">
							{match.teamA.name.charAt(0)}
						</div>
						<span class="text-xs font-bold text-white/80">{match.teamA.name}</span>
					</div>

					<!-- Score -->
					<div class="flex flex-col items-center justify-center px-4">
						<div class="text-2xl font-black tracking-tighter text-white">
							{match.teamA.score} <span class="text-white/30">-</span> {match.teamB.score}
						</div>
						<span class="text-[10px] uppercase text-white/40">{match.time}</span>
					</div>

					<!-- Team B -->
					<div class="flex flex-1 flex-col items-center gap-1">
						<div class="flex h-12 w-12 items-center justify-center rounded-full font-bold shadow-md" style="background-color: {match.teamB.color}44; border: 2px solid {match.teamB.color}88; color: {match.teamB.color}">
							{match.teamB.name.charAt(0)}
						</div>
						<span class="text-xs font-bold text-white/80">{match.teamB.name}</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="mt-2 flex border-t border-white/10 pt-3">
					<a href="{base}/film-room?match={match.id}" class="flex-1 text-center text-xs font-medium text-[#00f2fe] transition-colors hover:text-white">
						{match.status === 'live' ? 'Spectate Live' : 'Watch Replay'} &rarr;
					</a>
				</div>
				
				<!-- Subtle background gradient -->
				<div class="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity rounded-xl" style="background: linear-gradient(90deg, {match.teamA.color} 0%, {match.teamB.color} 100%);"></div>
			</div>
		{/each}
	</div>
</div>
