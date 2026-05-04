<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import BrandLoading from '$lib/components/BrandLoading.svelte';

	let match: any = $state(null);
	let stats: any = $state(null);
	let isLoading = $state(true);

	let backLink = $state(`${base}/`);
	let backLabel = $state('Dashboard');

	async function loadMatch(id: string) {
		const { data, error } = await supabase
			.from('matches')
			.select(`
				id, home_score, away_score, status, scheduled_time, stats,
				home_team:teams!home_team_id (id, name, color),
				away_team:teams!away_team_id (id, name, color),
				seasons (season_number, name)
			`)
			.eq('id', id)
			.single();

		if (error || !data) {
			console.error('Error fetching match:', error);
			isLoading = false;
			return;
		}

		match = data;
		stats = data.stats || {};
		isLoading = false;
	}

	onMount(() => {
		const id = page.params.id;
		if (id) loadMatch(id);

		if (typeof document !== 'undefined' && document.referrer) {
			if (document.referrer.includes(`/match/${id}`)) {
				backLink = `${base}/match/${id}`;
				backLabel = 'Replay';
			} else if (document.referrer.includes('/leaderboard')) {
				backLink = `${base}/leaderboard`;
				backLabel = 'Leaderboard';
			}
		}
	});
</script>

<svelte:head>
	<title>Match Stats | Maintainer One</title>
</svelte:head>

<div class="flex flex-col gap-12 p-6 lg:p-10 max-w-7xl mx-auto w-full min-h-screen">
	{#if isLoading}
		<div class="py-20"><BrandLoading message="Loading Final Stats..." /></div>
	{:else if match}
		<header class="flex items-center justify-between border-b border-white/10 pb-6">
			<div>
				<h1 class="text-3xl font-black tracking-tight text-white flex items-center gap-4">
					<svg class="h-8 w-8 text-[var(--color-brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
					Post-Match Analysis
				</h1>
				<p class="text-sm font-medium text-white/50 mt-2 uppercase tracking-widest">{match.seasons?.name || 'Season Match'}</p>
			</div>
			<div class="flex gap-3">
				<a href="{base}/film-room?match={match.id}" class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors px-4 py-2 border border-white/10 rounded-lg hover:bg-white/10 bg-white/5">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
					Film Room
				</a>
				<a href="{base}/match/{match.id}" class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors px-4 py-2 border border-white/10 rounded-lg hover:bg-white/10 bg-white/5">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
					Watch Replay
				</a>
				<a href={backLink} class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:text-white transition-colors px-4 py-2 border border-[var(--color-brand-primary)]/30 rounded-lg hover:bg-[var(--color-brand-primary)]/20 bg-[var(--color-brand-primary)]/10">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
					Back to {backLabel}
				</a>
			</div>
		</header>

		<!-- Scoreboard Header -->
		<section class="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-8 rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl relative overflow-hidden">
			<div class="absolute inset-0 pointer-events-none opacity-20" style="background: linear-gradient(90deg, {match.home_team.color} 0%, transparent 50%, {match.away_team.color} 100%);"></div>
			
			<div class="flex flex-col items-center z-10">
				<div class="flex h-20 w-20 items-center justify-center rounded-2xl font-black text-3xl shadow-lg mb-4 border-2" style="background-color: {match.home_team.color}22; border-color: {match.home_team.color}88; color: {match.home_team.color}">
					{match.home_team.name.charAt(0)}
				</div>
				<h2 class="text-xl font-bold text-white">{match.home_team.name}</h2>
			</div>
			
			<div class="flex items-center gap-6 z-10">
				<div class="text-7xl font-black text-white">{match.home_score}</div>
				<div class="text-2xl font-black text-white/20">-</div>
				<div class="text-7xl font-black text-white">{match.away_score}</div>
			</div>

			<div class="flex flex-col items-center z-10">
				<div class="flex h-20 w-20 items-center justify-center rounded-2xl font-black text-3xl shadow-lg mb-4 border-2" style="background-color: {match.away_team.color}22; border-color: {match.away_team.color}88; color: {match.away_team.color}">
					{match.away_team.name.charAt(0)}
				</div>
				<h2 class="text-xl font-bold text-white">{match.away_team.name}</h2>
			</div>
		</section>

		{#if stats && Object.keys(stats).length > 0}
			<!-- Team Stats Comparison -->
			<section class="space-y-6 mt-8">
				<h2 class="text-lg font-black tracking-widest uppercase text-[var(--color-brand-secondary)] flex items-center gap-3">
					<span class="w-8 h-[1px] bg-white/20"></span>
					Team Performance
					<span class="flex-1 h-[1px] bg-white/5"></span>
				</h2>

				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<!-- Luck / xS -->
					<div class="rounded-2xl border border-white/10 bg-black/20 p-6 flex flex-col items-center text-center">
						<div class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Fortune (xS)</div>
						<div class="flex w-full justify-between items-center mt-auto">
							<div class="flex flex-col items-start">
								<span class="text-xs font-bold" style="color: {match.home_team.color}">{stats.home_team.luckScore > 0 ? '+' : ''}{(stats.home_team.luckScore || 0).toFixed(2)}</span>
							</div>
							<div class="h-8 w-[1px] bg-white/10"></div>
							<div class="flex flex-col items-end">
								<span class="text-xs font-bold" style="color: {match.away_team.color}">{stats.away_team.luckScore > 0 ? '+' : ''}{(stats.away_team.luckScore || 0).toFixed(2)}</span>
							</div>
						</div>
					</div>

					<!-- Total Captures -->
					<div class="rounded-2xl border border-white/10 bg-black/20 p-6 flex flex-col items-center text-center">
						<div class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Captures</div>
						<div class="flex w-full justify-between items-center mt-auto">
							<div class="text-2xl font-black" style="color: {match.home_team.color}">{stats.home_team.totalCaptures || 0}</div>
							<div class="h-8 w-[1px] bg-white/10"></div>
							<div class="text-2xl font-black" style="color: {match.away_team.color}">{stats.away_team.totalCaptures || 0}</div>
						</div>
					</div>

					<!-- Pts per Capture -->
					<div class="rounded-2xl border border-white/10 bg-black/20 p-6 flex flex-col items-center text-center">
						<div class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Pts / Capture</div>
						<div class="flex w-full justify-between items-center mt-auto">
							<div class="text-2xl font-black" style="color: {match.home_team.color}">{(stats.home_team.averagePointsPerCapture || 0).toFixed(1)}</div>
							<div class="h-8 w-[1px] bg-white/10"></div>
							<div class="text-2xl font-black" style="color: {match.away_team.color}">{(stats.away_team.averagePointsPerCapture || 0).toFixed(1)}</div>
						</div>
					</div>

					<!-- Map Control -->
					<div class="rounded-2xl border border-white/10 bg-black/20 p-6 flex flex-col items-center text-center">
						<div class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Avg. Map Control</div>
						<div class="flex w-full justify-between items-center mt-auto">
							<div class="text-2xl font-black" style="color: {match.home_team.color}">{((stats.home_team.averageControlPercentage || 0) * 100).toFixed(0)}%</div>
							<div class="h-8 w-[1px] bg-white/10"></div>
							<div class="text-2xl font-black" style="color: {match.away_team.color}">{((stats.away_team.averageControlPercentage || 0) * 100).toFixed(0)}%</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Player Stats -->
			<section class="space-y-6 mt-8">
				<h2 class="text-lg font-black tracking-widest uppercase text-[var(--color-brand-secondary)] flex items-center gap-3">
					<span class="w-8 h-[1px] bg-white/20"></span>
					Player Statistics
					<span class="flex-1 h-[1px] bg-white/5"></span>
				</h2>

				<div class="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden shadow-2xl overflow-x-auto">
					<table class="w-full text-left border-collapse min-w-[800px]">
						<thead>
							<tr class="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
								<th class="p-4 pl-6">Player</th>
								<th class="p-4 text-center">Movement</th>
								<th class="p-4 text-center">Idle Ticks</th>
								<th class="p-4 text-center">Stuns</th>
								<th class="p-4 text-center">Mutual Stuns</th>
								<th class="p-4 text-center text-[var(--color-brand-primary)]">Captures</th>
								<th class="p-4 text-center">Points</th>
								<th class="p-4 text-center">Pts/Cap</th>
								<th class="p-4 pr-6 text-center text-rose-400">Stolen</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-white/5">
							{#each [...(stats.players || [])].sort((a, b) => a.id.localeCompare(b.id)) as p}
								{@const team = p.team === 'A' ? match.home_team : match.away_team}
								<tr class="group hover:bg-white/5 transition-colors cursor-pointer" onclick={() => window.location.href = `${base}/player/${team.id}/${p.id.replace(/^[ab]/, '')}`}>
									<td class="p-4 pl-6">
										<div class="flex items-center gap-3">
											<div class="h-8 w-8 rounded flex items-center justify-center font-black text-xs uppercase" style="background-color: {team.color}22; border: 1px solid {team.color}66; color: {team.color}">
												{team.name.charAt(0)}{p.id.replace(/^[ab]/, '')}
											</div>
											<div class="font-bold text-white group-hover:text-[var(--color-brand-primary)] transition-colors">{team.name} Unit {p.id.replace(/^[ab]/, '')}</div>
										</div>
									</td>
									<td class="p-4 text-center font-mono text-sm text-white/70">{p.stats.squaresMoved}</td>
									<td class="p-4 text-center font-mono text-sm text-white/40">{p.stats.idleTicks}</td>
									<td class="p-4 text-center font-mono text-sm text-white/70">{p.stats.singleStuns}</td>
									<td class="p-4 text-center font-mono text-sm text-white/40">{p.stats.mutualStuns}</td>
									<td class="p-4 text-center font-mono font-bold text-[var(--color-brand-primary)] text-lg">{p.stats.expectedCaptures + p.stats.contestedCaptures}</td>
									<td class="p-4 text-center font-mono font-bold text-white text-md">{p.stats.pointsScored || 0}</td>
									<td class="p-4 text-center font-mono text-sm text-[var(--color-brand-primary)]">{(p.stats.expectedCaptures + p.stats.contestedCaptures) > 0 ? ((p.stats.pointsScored || 0) / (p.stats.expectedCaptures + p.stats.contestedCaptures)).toFixed(1) : '0.0'}</td>
									<td class="p-4 pr-6 text-center font-mono font-bold text-rose-400 text-lg">{p.stats.stolenCaptures}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{:else}
			<div class="text-center py-20 text-white/40 font-bold uppercase tracking-widest text-sm">
				Detailed stats are not available for this match.
			</div>
		{/if}
	{:else}
		<div class="text-center py-20 text-white/40 font-bold uppercase tracking-widest text-sm">
			Match not found.
		</div>
	{/if}
</div>
