<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import { base } from '$app/paths';

	let player: any = $state(null);
	let team: any = $state(null);
	let matchHistory: any[] = $state([]);
	let careerStats: any = $state(null);
	let isLoading = $state(true);

	const teamId = $page.params.teamId;
	const unitIndex = $page.params.unitIndex;

	onMount(async () => {
		// Fetch player and team
		const { data: playerData, error: playerError } = await supabase
			.from('players')
			.select('*, teams(*)')
			.eq('team_id', teamId)
			.eq('unit_index', unitIndex)
			.single();

		if (playerError || !playerData) {
			console.error('Player not found', playerError);
			isLoading = false;
			return;
		}
		
		player = playerData;
		team = playerData.teams;

		// Fetch match history
		const { data: matches, error: matchError } = await supabase
			.from('matches')
			.select('id, scheduled_time, home_team_id, away_team_id, home_score, away_score, status, stats')
			.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
			.in('status', ['played', 'simulated', 'simmed'])
			.order('scheduled_time', { ascending: false });

		if (!matchError && matches) {
			const history = [];
			const aggStats = {
				matchesPlayed: 0,
				totalCaptures: 0,
				totalStuns: 0,
				squaresMoved: 0,
				expectedCaptures: 0,
				contestedCaptures: 0,
				stolenCaptures: 0,
				singleStuns: 0,
				mutualStuns: 0,
				idleTicks: 0,
				pointsScored: 0
			};

			for (const m of matches) {
				if (!m.stats || !m.stats.players) continue;
				
				// Find this player's stats in the match payload
				// The payload identifies players by id like "a1" or "b2".
				// We need to know if team was home(a) or away(b)
				const isHome = m.home_team_id === teamId;
				const prefix = isHome ? 'a' : 'b';
				const searchId = `${prefix}${unitIndex}`;
				
				const playerMatchStats = m.stats.players.find((p: any) => p.id === searchId);
				if (playerMatchStats) {
					const pStats = playerMatchStats.stats;
					const totalCaps = (pStats.expectedCaptures || 0) + (pStats.contestedCaptures || 0) + (pStats.stolenCaptures || 0);
					const totalStuns = (pStats.singleStuns || 0) + (pStats.mutualStuns || 0);
					
					history.push({
						matchId: m.id,
						date: new Date(m.scheduled_time),
						opponentId: isHome ? m.away_team_id : m.home_team_id,
						result: (isHome && m.home_score > m.away_score) || (!isHome && m.away_score > m.home_score) ? 'W' 
							  : (m.home_score === m.away_score ? 'D' : 'L'),
						score: `${m.home_score} - ${m.away_score}`,
						stats: pStats,
						totalCaps,
						totalStuns
					});

					// Aggregate
					aggStats.matchesPlayed++;
					aggStats.totalCaptures += totalCaps;
					aggStats.totalStuns += totalStuns;
					aggStats.squaresMoved += (pStats.squaresMoved || 0);
					aggStats.expectedCaptures += (pStats.expectedCaptures || 0);
					aggStats.contestedCaptures += (pStats.contestedCaptures || 0);
					aggStats.stolenCaptures += (pStats.stolenCaptures || 0);
					aggStats.singleStuns += (pStats.singleStuns || 0);
					aggStats.mutualStuns += (pStats.mutualStuns || 0);
					aggStats.idleTicks += (pStats.idleTicks || 0);
					aggStats.pointsScored += (pStats.pointsScored || 0);
				}
			}
			
			matchHistory = history;
			careerStats = aggStats;
		}

		isLoading = false;
	});
</script>

<svelte:head>
	<title>{player ? player.name : 'Player Profile'} | Maintainer One</title>
</svelte:head>

<div class="min-h-screen p-8 text-white max-w-7xl mx-auto space-y-12">
	<header class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-6">
			<a href="{base}/leaderboard" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:text-[var(--color-brand-primary)] shadow-lg backdrop-blur-md">
				<svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 18l-6-6 6-6"/></svg>
			</a>
			<div>
				<h1 class="text-3xl font-black uppercase tracking-widest text-white drop-shadow-lg">
					Player Profile
				</h1>
				<p class="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-secondary)] mt-1 opacity-80">
					Career Statistics
				</p>
			</div>
		</div>
	</header>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<div class="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-brand-primary)] border-t-transparent"></div>
		</div>
	{:else if !player}
		<div class="flex h-64 items-center justify-center text-rose-400">
			Player not found.
		</div>
	{:else}
		<!-- Hero Section -->
		<section class="flex flex-col md:flex-row gap-8 items-start">
			<div class="flex-1 rounded-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden" style="background-color: {team.color}15">
				<div class="absolute -right-20 -top-20 opacity-10 pointer-events-none text-[20rem] font-black leading-none" style="color: {team.color}">
					{unitIndex}
				</div>
				<div class="relative z-10">
					<div class="inline-flex px-3 py-1 rounded border mb-6 text-[10px] font-black uppercase tracking-widest" style="background-color: {team.color}33; border-color: {team.color}; color: {team.color}">
						{team.name}
					</div>
					<h2 class="text-5xl font-black uppercase tracking-tight text-white mb-2">
						{player.name}
					</h2>
					<p class="text-sm font-bold uppercase tracking-widest text-white/50 mb-12">
						Unit {unitIndex} • Active Roster
					</p>

					<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
						<div>
							<div class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Total Captures</div>
							<div class="text-4xl font-black font-mono" style="color: {team.color}">{careerStats.totalCaptures}</div>
						</div>
						<div>
							<div class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Pts Scored</div>
							<div class="text-4xl font-black font-mono text-white">{careerStats.pointsScored}</div>
						</div>
						<div>
							<div class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Total Stuns</div>
							<div class="text-4xl font-black font-mono text-white">{careerStats.totalStuns}</div>
						</div>
						<div>
							<div class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Matches</div>
							<div class="text-4xl font-black font-mono text-white/50">{careerStats.matchesPlayed}</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Granular Stats -->
		<section class="grid grid-cols-2 lg:grid-cols-5 gap-6">
			<div class="rounded-xl border border-white/5 bg-[var(--color-brand-primary)]/5 p-6 backdrop-blur-md">
				<div class="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] mb-2">Pts / Capture</div>
				<div class="text-2xl font-black font-mono text-white/80">{careerStats.totalCaptures > 0 ? (careerStats.pointsScored / careerStats.totalCaptures).toFixed(1) : '0.0'}</div>
			</div>
			<div class="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-md">
				<div class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Total Movement</div>
				<div class="text-2xl font-black font-mono text-white/80">{careerStats.squaresMoved} <span class="text-xs text-white/30 ml-1">sq</span></div>
			</div>
			<div class="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-md">
				<div class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Expected Captures</div>
				<div class="text-2xl font-black font-mono text-white/80">{careerStats.expectedCaptures}</div>
			</div>
			<div class="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-md">
				<div class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Contested Captures</div>
				<div class="text-2xl font-black font-mono text-white/80">{careerStats.contestedCaptures}</div>
			</div>
			<div class="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-md">
				<div class="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2">Stolen Captures</div>
				<div class="text-2xl font-black font-mono text-rose-300">{careerStats.stolenCaptures}</div>
			</div>
		</section>

		<!-- Match History -->
		<section class="space-y-6">
			<h2 class="text-lg font-black tracking-widest uppercase text-[var(--color-brand-secondary)] flex items-center gap-3">
				<span class="w-8 h-[1px] bg-white/20"></span>
				Match History
				<span class="flex-1 h-[1px] bg-white/5"></span>
			</h2>
			
			<div class="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden shadow-2xl">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
							<th class="p-4 pl-6">Date</th>
							<th class="p-4 text-center">Result</th>
							<th class="p-4 text-center">Score</th>
							<th class="p-4 text-center text-[var(--color-brand-primary)]">Captures</th>
							<th class="p-4 text-center">Points</th>
							<th class="p-4 text-center">Pts/Cap</th>
							<th class="p-4 text-center">Stuns</th>
							<th class="p-4 text-center">Moved</th>
							<th class="p-4 pr-6 text-center text-rose-400">Stolen</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						{#each matchHistory as match}
							<tr class="group hover:bg-white/5 transition-colors cursor-pointer" onclick={() => window.location.href = `${base}/match/${match.matchId}/stats`}>
								<td class="p-4 pl-6">
									<div class="font-bold text-white/80 group-hover:text-white transition-colors">{match.date.toLocaleDateString()}</div>
								</td>
								<td class="p-4 text-center font-black">
									{#if match.result === 'W'}
										<span class="text-green-400">W</span>
									{:else if match.result === 'L'}
										<span class="text-rose-400">L</span>
									{:else}
										<span class="text-white/40">D</span>
									{/if}
								</td>
								<td class="p-4 text-center font-mono text-sm text-white/60">{match.score}</td>
								<td class="p-4 text-center font-mono font-black text-[var(--color-brand-primary)] text-lg">{match.totalCaps}</td>
								<td class="p-4 text-center font-mono font-bold text-white text-md">{match.stats.pointsScored || 0}</td>
								<td class="p-4 text-center font-mono text-sm text-[var(--color-brand-primary)]">{match.totalCaps > 0 ? ((match.stats.pointsScored || 0) / match.totalCaps).toFixed(1) : '0.0'}</td>
								<td class="p-4 text-center font-mono font-bold text-white text-md">{match.totalStuns}</td>
								<td class="p-4 text-center font-mono text-sm text-white/40">{match.stats.squaresMoved || 0}</td>
								<td class="p-4 pr-6 text-center font-mono font-bold text-rose-400">{match.stats.stolenCaptures || 0}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>
