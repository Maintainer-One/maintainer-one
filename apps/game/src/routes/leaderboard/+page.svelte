<script lang="ts">
	import { base } from '$app/paths';
	import { supabase, getActiveSeason } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { getProtocol } from '$packages/protocols/registry';
	import BrandLoading from '$lib/components/BrandLoading.svelte';

	let teams: any[] = $state([]);
	let playerAwards: any[] = $state([]);
	let activeSeason: any = $state(null);
	let isLoading = $state(true);

	let allPlayers: any[] = $state([]);
	let sortColumn = $state('totalCaptures');
	let sortAscending = $state(false);

	const DEFAULT_TICK_RATE = 750;
	const K_FACTOR = 32;

	async function fetchStandings() {
		activeSeason = await getActiveSeason();
		if (!activeSeason) {
			teams = [];
			playerAwards = [];
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
		const { data: matchesData, error: matchesError } = await supabase
			.from('matches')
			.select(`
				id, home_team_id, away_team_id, home_score, away_score, scheduled_time, status, stats, winner_id,
				leagues (protocol_version, protocol_config),
				seasons (protocol_version, protocol_config)
			`)
			.in('status', ['simulated', 'simmed', 'played'])
			.eq('season_id', activeSeason.id)
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
				statPoints: 0,
				statAwards: [],
				rating: 1000
			});
		});

		const nowTime = new Date().getTime();

		// 5. Calculate records and ELO
		const pastMatches = matchesData.filter(m => {
			const config = (m.seasons as any)?.protocol_config ?? (m.leagues as any)?.protocol_config ?? {};
			const tickRate = config.tickRateMs || DEFAULT_TICK_RATE;
			const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
			const startTime = new Date(m.scheduled_time).getTime();
			const endTime = startTime + (leagueMaxTicks * tickRate);
			return nowTime >= endTime;
		});

		if (pastMatches.length > 0 || teamsData.length > 0) {
			const protocolVersion = pastMatches.length > 0 ? (pastMatches[0].leagues as any)?.protocol_version || 'v1' : 'v1';
			const config = pastMatches.length > 0 ? ((pastMatches[0].seasons as any)?.protocol_config ?? (pastMatches[0].leagues as any)?.protocol_config ?? {}) : {};
			const protocol = getProtocol(protocolVersion);
			const resolvedStandingsResult = protocol.resolveStandings(config, pastMatches, teamsData);
			
			const resolvedStandings = resolvedStandingsResult.standings || resolvedStandingsResult;
			playerAwards = resolvedStandingsResult.playerAwards || [];
			
			for (const [teamId, stats] of Object.entries(resolvedStandings)) {
				const team = standingsMap.get(teamId);
				if (team) {
					team.wins = (stats as any).wins;
					team.losses = (stats as any).losses;
					team.draws = (stats as any).ties;
					team.points = (stats as any).points;
					team.statPoints = (stats as any).statPoints || 0;
					team.statAwards = (stats as any).statAwards || [];
				}
			}

			// Process seasonPlayerStats into an array
			if ((resolvedStandingsResult as any).seasonPlayerStats) {
				const playersRaw = Object.values((resolvedStandingsResult as any).seasonPlayerStats);
				allPlayers = playersRaw.map((p: any) => {
					const totalCaptures = (p.stats.expectedCaptures || 0) + (p.stats.contestedCaptures || 0) + (p.stats.stolenCaptures || 0);
					const totalStuns = (p.stats.singleStuns || 0) + (p.stats.mutualStuns || 0);
					return {
						...p,
						totalCaptures,
						totalStuns
					};
				});
				sortPlayers();
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
		fetchStandings();
		const interval = setInterval(fetchStandings, 10000);
		return () => clearInterval(interval);
	});

	function getTeamColor(teamId: string) {
		const team = teams.find(t => t.id === teamId);
		return team ? team.color : '#fff';
	}

	function getTeamName(teamId: string) {
		const team = teams.find(t => t.id === teamId);
		return team ? team.name : 'Unknown';
	}

	function sortPlayers(col?: string) {
		if (col) {
			if (sortColumn === col) {
				sortAscending = !sortAscending;
			} else {
				sortColumn = col;
				sortAscending = false;
			}
		}
		
		allPlayers = [...allPlayers].sort((a, b) => {
			let valA, valB;
			
			if (sortColumn === 'player') {
				valA = `${getTeamName(a.teamId)} ${a.unitIndex}`;
				valB = `${getTeamName(b.teamId)} ${b.unitIndex}`;
			} else if (sortColumn === 'totalCaptures') {
				valA = a.totalCaptures; valB = b.totalCaptures;
			} else if (sortColumn === 'totalStuns') {
				valA = a.totalStuns; valB = b.totalStuns;
			} else if (sortColumn === 'ptsPerCap') {
				valA = a.totalCaptures > 0 ? (a.stats.pointsScored || 0) / a.totalCaptures : 0;
				valB = b.totalCaptures > 0 ? (b.stats.pointsScored || 0) / b.totalCaptures : 0;
			} else {
				valA = a.stats[sortColumn] || 0;
				valB = b.stats[sortColumn] || 0;
			}

			if (valA < valB) return sortAscending ? -1 : 1;
			if (valA > valB) return sortAscending ? 1 : -1;
			return 0;
		});
	}
</script>

<svelte:head>
	<title>Leaderboard | Maintainer One</title>
</svelte:head>

<div class="flex flex-col gap-12 p-6 lg:p-10 max-w-7xl mx-auto w-full min-h-screen">
	<header class="flex items-center justify-between border-b border-white/10 pb-6">
		<div>
			<h1 class="text-3xl font-black tracking-tight text-white flex items-center gap-4">
				<svg class="h-8 w-8 text-[var(--color-brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
				Global Leaderboard
			</h1>
			<p class="text-sm font-medium text-white/50 mt-2 uppercase tracking-widest">{activeSeason?.name || 'Loading Season...'}</p>
		</div>
		<a href="{base}/" class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-secondary)]/50 hover:text-[var(--color-brand-primary)] transition-colors px-4 py-2 border border-white/10 rounded-lg hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/10">
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
			Back to Dashboard
		</a>
	</header>

	{#if isLoading}
		<div class="py-20"><BrandLoading message="Compiling Standings..." /></div>
	{:else}
		<!-- League Standings Table -->
		<section class="space-y-6">
			<h2 class="text-lg font-black tracking-widest uppercase text-[var(--color-brand-secondary)] flex items-center gap-3">
				<span class="w-8 h-[1px] bg-white/20"></span>
				Team Standings
				<span class="flex-1 h-[1px] bg-white/5"></span>
			</h2>
			
			<div class="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden shadow-2xl">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
							<th class="p-4 pl-6 w-16 text-center">Rank</th>
							<th class="p-4">Team</th>
							<th class="p-4 text-center">W-L-D</th>
							<th class="p-4 text-center hidden sm:table-cell">Rating (ELO)</th>
							<th class="p-4 text-center">Stat Bonus</th>
							<th class="p-4 pr-6 text-right text-[var(--color-brand-primary)]">Total Pts</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						{#each teams as team, i}
							<tr class="group hover:bg-white/5 transition-colors">
								<td class="p-4 pl-6 text-center">
									<div class="flex items-center justify-center font-black {i < 3 ? 'text-[var(--color-brand-primary)] text-xl' : 'text-white/30'}">
										{i + 1}
									</div>
								</td>
								<td class="p-4">
									<div class="flex items-center gap-3">
										<div class="h-8 w-8 rounded flex items-center justify-center font-bold text-xs" style="background-color: {team.color}22; border: 1px solid {team.color}66; color: {team.color}">
											{team.name.charAt(0)}
										</div>
										<a href="{base}/team/{team.id}" class="font-bold text-white group-hover:text-[var(--color-brand-primary)] transition-colors">{team.name}</a>
									</div>
								</td>
								<td class="p-4 text-center text-sm font-bold text-white/70 tracking-widest">{team.record}</td>
								<td class="p-4 text-center text-sm font-mono text-white/50 hidden sm:table-cell">{team.rating}</td>
								<td class="p-4 text-center">
									<div class="group/tooltip relative inline-flex items-center justify-center">
										<span class="text-sm font-black text-[var(--color-brand-primary)]/70 cursor-help border-b border-dashed border-[var(--color-brand-primary)]/30 px-2">
											+{team.statPoints}
										</span>
										{#if team.statAwards.length > 0}
											<div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 transition-opacity duration-75 group-hover/tooltip:opacity-100 z-50 bg-[#111] border border-white/10 rounded-lg p-2.5 shadow-2xl text-left text-[10px] font-bold text-white/90 whitespace-pre leading-relaxed tracking-wide font-sans">
												{team.statAwards.join('\n')}
											</div>
										{/if}
									</div>
								</td>
								<td class="p-4 pr-6 text-right">
									<span class="text-2xl font-black text-[var(--color-brand-primary)]">{team.points}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<!-- Bonus Points Breakdown -->
		{#if playerAwards.length > 0}
			<section class="space-y-6 mt-16">
				<h2 class="text-lg font-black tracking-widest uppercase text-[var(--color-brand-secondary)] flex items-center gap-3">
					<span class="w-8 h-[1px] bg-white/20"></span>
					Player Performance Awards
					<span class="flex-1 h-[1px] bg-white/5"></span>
				</h2>
				
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each playerAwards as award}
						<div class="rounded-2xl border border-white/10 bg-black/20 p-6 flex flex-col relative overflow-hidden group hover:border-[var(--color-brand-primary)]/30 transition-colors">
							<div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
							
							<div class="relative z-10 flex flex-col flex-1">
								<div class="text-[10px] font-black uppercase tracking-widest {award.type === 'Most' ? 'text-[var(--color-brand-primary)]' : 'text-rose-400'} mb-1">
									{award.type}
								</div>
								<h3 class="text-lg font-bold text-white mb-4 line-clamp-1">{award.formattedKey}</h3>
								
								<div class="text-3xl font-black text-white/20 mb-6 font-mono leading-none">
									{award.value.toLocaleString()}
								</div>
								
								<div class="mt-auto space-y-3">
									<div class="text-[9px] font-black uppercase tracking-widest text-white/30 border-b border-white/10 pb-2">
										Awarded Players (+1 Team Pt)
									</div>
									<div class="flex flex-wrap gap-2">
										{#each award.players as player}
											{@const color = getTeamColor(player.teamId)}
											{@const teamName = getTeamName(player.teamId)}
											<a href="{base}/player/{player.teamId}/{player.unitIndex}" class="flex items-center gap-2 rounded bg-black/40 px-2 py-1.5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group/link" style="border-left: 2px solid {color}">
												<span class="text-[10px] font-black group-hover/link:text-white transition-colors" style="color: {color}">{teamName.charAt(0)}{player.unitIndex}</span>
												<span class="text-[9px] font-bold text-white/50 group-hover/link:text-white/80 transition-colors">{teamName}</span>
											</a>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Player Statistics Table -->
		{#if allPlayers.length > 0}
			<section class="space-y-6 mt-16">
				<h2 class="text-lg font-black tracking-widest uppercase text-[var(--color-brand-secondary)] flex items-center gap-3">
					<span class="w-8 h-[1px] bg-white/20"></span>
					League Player Statistics
					<span class="flex-1 h-[1px] bg-white/5"></span>
				</h2>
				
				<div class="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden shadow-2xl overflow-x-auto">
					<table class="w-full text-left border-collapse min-w-[1000px]">
						<thead>
							<tr class="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
								<th class="p-4 pl-6 cursor-pointer hover:bg-white/5 transition-colors group" onclick={() => sortPlayers('player')}>
									<div class="flex items-center gap-2">Player {#if sortColumn === 'player'}<span class="text-[var(--color-brand-primary)]"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors" onclick={() => sortPlayers('squaresMoved')}>
									<div class="flex items-center justify-center gap-2">Movement {#if sortColumn === 'squaresMoved'}<span class="text-[var(--color-brand-primary)]"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors" onclick={() => sortPlayers('idleTicks')}>
									<div class="flex items-center justify-center gap-2">Idle Ticks {#if sortColumn === 'idleTicks'}<span class="text-[var(--color-brand-primary)]"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors" onclick={() => sortPlayers('pointsScored')}>
									<div class="flex items-center justify-center gap-2">Points {#if sortColumn === 'pointsScored'}<span class="text-[var(--color-brand-primary)]"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors" onclick={() => sortPlayers('ptsPerCap')}>
									<div class="flex items-center justify-center gap-2">Pts/Cap {#if sortColumn === 'ptsPerCap'}<span class="text-[var(--color-brand-primary)]"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors" onclick={() => sortPlayers('totalStuns')}>
									<div class="flex items-center justify-center gap-2">Total Stuns {#if sortColumn === 'totalStuns'}<span class="text-[var(--color-brand-primary)]"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors" onclick={() => sortPlayers('singleStuns')}>
									<div class="flex items-center justify-center gap-2">Single Stuns {#if sortColumn === 'singleStuns'}<span class="text-[var(--color-brand-primary)]"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors" onclick={() => sortPlayers('mutualStuns')}>
									<div class="flex items-center justify-center gap-2">Mutual Stuns {#if sortColumn === 'mutualStuns'}<span class="text-[var(--color-brand-primary)]"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors text-[var(--color-brand-primary)]" onclick={() => sortPlayers('totalCaptures')}>
									<div class="flex items-center justify-center gap-2">Total Captures {#if sortColumn === 'totalCaptures'}<span class="text-white"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors" onclick={() => sortPlayers('expectedCaptures')}>
									<div class="flex items-center justify-center gap-2">Expected {#if sortColumn === 'expectedCaptures'}<span class="text-[var(--color-brand-primary)]"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors" onclick={() => sortPlayers('contestedCaptures')}>
									<div class="flex items-center justify-center gap-2">Contested {#if sortColumn === 'contestedCaptures'}<span class="text-[var(--color-brand-primary)]"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
								<th class="p-4 pr-6 text-center cursor-pointer hover:bg-white/5 transition-colors text-rose-400" onclick={() => sortPlayers('stolenCaptures')}>
									<div class="flex items-center justify-center gap-2">Stolen {#if sortColumn === 'stolenCaptures'}<span class="text-white"><svg class="h-4 w-4 transition-transform duration-200 {sortAscending ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg></span>{/if}</div>
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-white/5">
							{#each allPlayers as p}
								{@const color = getTeamColor(p.teamId)}
								{@const teamName = getTeamName(p.teamId)}
								<tr class="group hover:bg-white/5 transition-colors cursor-pointer" onclick={() => window.location.href = `${base}/player/${p.teamId}/${p.unitIndex}`}>
									<td class="p-4 pl-6">
										<div class="flex items-center gap-3">
											<div class="h-8 w-8 rounded flex items-center justify-center font-black text-xs uppercase" style="background-color: {color}22; border: 1px solid {color}66; color: {color}">
												{teamName.charAt(0)}{p.unitIndex}
											</div>
											<div class="font-bold text-white group-hover:text-[var(--color-brand-primary)] transition-colors">{teamName} Unit {p.unitIndex}</div>
										</div>
									</td>
									<td class="p-4 text-center font-mono text-sm text-white/70">{p.stats.squaresMoved || 0}</td>
									<td class="p-4 text-center font-mono text-sm text-white/40">{p.stats.idleTicks || 0}</td>
									<td class="p-4 text-center font-mono font-bold text-white text-md">{p.stats.pointsScored || 0}</td>
									<td class="p-4 text-center font-mono text-sm text-[var(--color-brand-primary)]">{p.totalCaptures > 0 ? ((p.stats.pointsScored || 0) / p.totalCaptures).toFixed(1) : '0.0'}</td>
									<td class="p-4 text-center font-mono font-bold text-white text-md">{p.totalStuns}</td>
									<td class="p-4 text-center font-mono text-sm text-white/70">{p.stats.singleStuns || 0}</td>
									<td class="p-4 text-center font-mono text-sm text-white/40">{p.stats.mutualStuns || 0}</td>
									<td class="p-4 text-center font-mono font-black text-[var(--color-brand-primary)] text-xl">{p.totalCaptures}</td>
									<td class="p-4 text-center font-mono text-sm text-white/70">{p.stats.expectedCaptures || 0}</td>
									<td class="p-4 text-center font-mono text-sm text-white/70">{p.stats.contestedCaptures || 0}</td>
									<td class="p-4 pr-6 text-center font-mono font-bold text-rose-400 text-lg">{p.stats.stolenCaptures || 0}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}
	{/if}
</div>
