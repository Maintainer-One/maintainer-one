<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { supabase, getActiveSeason } from '$lib/supabase';
	import BrandLoading from '$lib/components/BrandLoading.svelte';
	import { fade, fly } from 'svelte/transition';

	let teamId = $derived(page.params.id);
	let teamData = $state<any>(null);
	let recentMatches = $state<any[]>([]);
	let upcomingMatches = $state<any[]>([]);
	let stats = $state<any>({
		wins: 0,
		losses: 0,
		draws: 0,
		pointsScored: 0,
		pointsAgainst: 0,
		rating: 1000,
		form: []
	});
	let isLoading = $state(true);

	async function loadTeamData() {
		isLoading = true;
		
		// 1. Fetch team details
		const { data: team, error: teamError } = await supabase
			.from('teams')
			.select('*')
			.eq('id', teamId)
			.single();

		if (teamError || !team) {
			console.error('Error fetching team:', teamError);
			isLoading = false;
			return;
		}
		teamData = team;

		// 2. Fetch ALL teams to initialize standings map (required for ELO)
		const { data: allTeams } = await supabase.from('teams').select('id, name, color');
		if (!allTeams) {
			isLoading = false;
			return;
		}

		const standingsMap = new Map();
		allTeams.forEach(t => {
			standingsMap.set(t.id, {
				id: t.id,
				wins: 0,
				losses: 0,
				draws: 0,
				pointsScored: 0,
				pointsAgainst: 0,
				rating: 1000,
				form: []
			});
		});

		// 3. Fetch ALL matches for the active season
		const activeSeason = await getActiveSeason();
		if (!activeSeason) {
			isLoading = false;
			return;
		}

		const { data: allMatches, error: matchesError } = await supabase
			.from('matches')
			.select(`
				id, status, home_score, away_score, scheduled_time, home_team_id, away_team_id,
				leagues (protocol_config)
			`)
			.eq('season_id', activeSeason.id)
			.order('scheduled_time', { ascending: true });

		if (matchesError || !allMatches) {
			console.error('Error fetching matches:', matchesError);
			isLoading = false;
			return;
		}

		const now = new Date().getTime();
		const K_FACTOR = 32;
		const DEFAULT_TICK_RATE = 750;

		const processedRecent: any[] = [];
		const processedUpcoming: any[] = [];

		// 4. Process all matches to calculate accurate ELO and stats
		allMatches.forEach(m => {
			const home = standingsMap.get(m.home_team_id);
			const away = standingsMap.get(m.away_team_id);
			if (!home || !away) return;

			// Calculate dynamic broadcast window
			const config = (m.leagues as any)?.protocol_config || {};
			const tickRate = config.tickRateMs || DEFAULT_TICK_RATE;
			const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
			
			const startTime = new Date(m.scheduled_time).getTime();
			const endTime = startTime + (leagueMaxTicks * tickRate);

			const isPast = (m.status === 'played' || m.status === 'simulated');

			if (isPast) {
				// Update Records
				if (m.home_score > m.away_score) {
					home.wins++;
					home.form.push('W');
					away.losses++;
					away.form.push('L');
				} else if (m.away_score > m.home_score) {
					away.wins++;
					away.form.push('W');
					home.losses++;
					home.form.push('L');
				} else {
					home.draws++;
					home.form.push('D');
					away.draws++;
					away.form.push('D');
				}

				home.pointsScored += m.home_score;
				home.pointsAgainst += m.away_score;
				away.pointsScored += m.away_score;
				away.pointsAgainst += m.home_score;

				// Calculate ELO
				const Ra = home.rating;
				const Rb = away.rating;
				const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
				const Eb = 1 / (1 + Math.pow(10, (Ra - Rb) / 400));
				
				let Sa = 0.5;
				if (m.home_score > m.away_score) Sa = 1;
				else if (m.away_score > m.home_score) Sa = 0;
				const Sb = 1 - Sa;

				home.rating = Math.round(Ra + K_FACTOR * (Sa - Ea));
				away.rating = Math.round(Rb + K_FACTOR * (Sb - Eb));
			}

			// If this match involves our team, add to list
			if (m.home_team_id === teamId || m.away_team_id === teamId) {
				const isHome = m.home_team_id === teamId;
				const oppId = isHome ? m.away_team_id : m.home_team_id;
				const opponent = allTeams.find(t => t.id === oppId);
				const teamScore = isHome ? m.home_score : m.away_score;
				const oppScore = isHome ? m.away_score : m.home_score;

				if (isPast) {
					processedRecent.push({
						...m,
						opponent,
						teamScore,
						oppScore,
						result: teamScore > oppScore ? 'W' : (teamScore < oppScore ? 'L' : 'D')
					});
				} else {
					processedUpcoming.push({ ...m, opponent });
				}
			}
		});

		// 5. Extract final stats for our team
		const teamStats = standingsMap.get(teamId);
		if (teamStats) {
			stats = {
				...teamStats,
				form: teamStats.form.slice(-5)
			};
		}

		recentMatches = processedRecent.reverse().slice(0, 10);
		upcomingMatches = processedUpcoming.slice(0, 10);
		
		isLoading = false;
	}

	onMount(() => {
		loadTeamData();
	});

	function formatTime(iso: string) {
		return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 selection:bg-[var(--color-brand-primary)]/30">
	{#if isLoading}
		<div class="flex h-screen items-center justify-center">
			<BrandLoading message="Retrieving Team Protocol..." />
		</div>
	{:else if teamData}
		<!-- Header -->
		<header class="relative h-64 overflow-hidden border-b border-white/5 bg-black/40">
			<div class="absolute inset-0 opacity-10" style="background: radial-gradient(circle at 50% 50%, {teamData.color} 0%, transparent 70%);"></div>
			
			<div class="container mx-auto flex h-full items-end p-8 lg:p-12">
				<div class="flex items-center gap-8" in:fly={{ y: 20, duration: 800 }}>
					<div class="flex h-32 w-32 items-center justify-center rounded-3xl border-4 shadow-2xl text-5xl font-black" style="background-color: {teamData.color}22; border-color: {teamData.color}44; color: {teamData.color}">
						{teamData.name.charAt(0)}
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-4">
							<h1 class="text-5xl font-black tracking-tighter text-white uppercase">{teamData.name}</h1>
							<span class="rounded-full bg-white/5 px-4 py-1 text-xs font-black uppercase tracking-widest text-white/40 border border-white/10">Active Protocol</span>
						</div>
						<div class="flex items-center gap-6 text-sm font-bold text-white/40">
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
								{stats.wins}-{stats.losses}-{stats.draws} Record
							</div>
							<div class="flex items-center gap-2">
								<svg class="h-4 w-4 text-[var(--color-brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
								{stats.rating} Rating
							</div>
						</div>
					</div>
				</div>
			</div>

			<a href="{base}/" class="absolute left-8 top-8 group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:text-[var(--color-brand-primary)] shadow-lg backdrop-blur-md">
				<svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
			</a>
		</header>

		<main class="container mx-auto grid grid-cols-1 gap-12 p-8 lg:grid-cols-3 lg:p-12">
			<!-- Left Column: Stats & Info -->
			<div class="space-y-12">
				<!-- Quick Stats -->
				<section class="space-y-6">
					<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Season Performance</h3>
					<div class="grid grid-cols-2 gap-4">
						<div class="rounded-2xl border border-white/5 bg-black/20 p-6 text-center shadow-xl">
							<div class="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Avg Points</div>
							<div class="text-3xl font-black text-white">{(stats.pointsScored / Math.max(1, stats.wins + stats.losses + stats.draws)).toFixed(1)}</div>
						</div>
						<div class="rounded-2xl border border-white/5 bg-black/20 p-6 text-center shadow-xl">
							<div class="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Point Diff</div>
							<div class="text-3xl font-black {stats.pointsScored >= stats.pointsAgainst ? 'text-emerald-400' : 'text-rose-400'}">
								{stats.pointsScored - stats.pointsAgainst > 0 ? '+' : ''}{stats.pointsScored - stats.pointsAgainst}
							</div>
						</div>
					</div>
					
					<!-- Form Tracker -->
					<div class="rounded-2xl border border-white/5 bg-black/20 p-6 shadow-xl">
						<div class="flex items-center justify-between mb-4">
							<span class="text-[9px] font-black uppercase tracking-widest text-white/40">Recent Form</span>
							<span class="text-[9px] font-black text-white/20">Last 5</span>
						</div>
						<div class="flex gap-2">
							{#each stats.form as result}
								<div class="flex h-8 w-8 flex-1 items-center justify-center rounded-lg text-[10px] font-black border {result === 'W' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : (result === 'L' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-white/5 border-white/10 text-white/40')}">
									{result}
								</div>
							{/each}
						</div>
					</div>
				</section>

				<!-- Team Identity -->
				<section class="space-y-4">
					<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Operational Data</h3>
					<div class="rounded-2xl border border-white/5 bg-black/20 p-6 space-y-4 shadow-xl">
						<div class="flex justify-between items-center text-xs">
							<span class="text-white/20 font-bold">Protocol ID</span>
							<span class="font-mono text-white/60">{teamData.id.slice(0, 8)}</span>
						</div>
						<div class="flex justify-between items-center text-xs">
							<span class="text-white/20 font-bold">Code Version</span>
							<span class="text-[var(--color-brand-primary)] font-black uppercase tracking-widest">V{teamData.active_version_id ? '1.2' : '1.0'}</span>
						</div>
					</div>
				</section>
			</div>

			<!-- Center/Right: Matches -->
			<div class="lg:col-span-2 space-y-12">
				<!-- Recent Results -->
				<section class="space-y-6">
					<div class="flex items-center justify-between">
						<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Recent Results</h3>
					</div>
					<div class="space-y-3">
						{#each recentMatches as match}
							<a href="{base}/match/{match.id}" class="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4 transition-all hover:bg-white/5 hover:border-white/10 group shadow-lg">
								<div class="flex items-center gap-4">
									<div class="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black {match.result === 'W' ? 'bg-emerald-500/10 text-emerald-400' : (match.result === 'L' ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-white/40')}">
										{match.result}
									</div>
									<div class="flex flex-col">
										<span class="text-xs font-black text-white group-hover:text-[var(--color-brand-primary)] transition-colors">vs {match.opponent.name}</span>
										<span class="text-[10px] font-bold text-white/20 uppercase tracking-widest">{formatTime(match.scheduled_time)}</span>
									</div>
								</div>
								<div class="text-lg font-black text-white">
									{match.teamScore} <span class="text-white/10">-</span> {match.oppScore}
								</div>
							</a>
						{/each}
						{#if recentMatches.length === 0}
							<div class="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl italic text-white/10">No recent protocol logs found.</div>
						{/if}
					</div>
				</section>

				<!-- Upcoming Schedule -->
				<section class="space-y-6">
					<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Upcoming Schedule</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each upcomingMatches as match}
							<a href="{base}/match/{match.id}" class="flex flex-col gap-4 rounded-2xl border border-white/5 bg-black/20 p-6 transition-all hover:bg-white/5 hover:border-white/10 group shadow-lg">
								<div class="flex items-center justify-between">
									<span class="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-primary)]">Match Event</span>
									<span class="text-[9px] font-black uppercase tracking-widest text-white/20">{formatTime(match.scheduled_time)}</span>
								</div>
								<div class="flex items-center gap-4">
									<div class="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black" style="background-color: {match.opponent.color}22; color: {match.opponent.color}; border: 1px solid {match.opponent.color}44">
										{match.opponent.name.charAt(0)}
									</div>
									<div class="flex flex-col">
										<span class="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none mb-1">Opponent</span>
										<span class="text-sm font-black text-white group-hover:text-[var(--color-brand-primary)] transition-colors">{match.opponent.name}</span>
									</div>
								</div>
							</a>
						{/each}
						{#if upcomingMatches.length === 0}
							<div class="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl italic text-white/10 lg:col-span-2">No future assignments scheduled.</div>
						{/if}
					</div>
				</section>
			</div>
		</main>
	{:else}
		<div class="flex h-screen items-center justify-center flex-col gap-4">
			<h1 class="text-4xl font-black uppercase text-white/20">Team Not Found</h1>
			<a href="{base}/" class="text-[var(--color-brand-primary)] font-black uppercase tracking-widest hover:underline">Return to Arena</a>
		</div>
	{/if}
</div>
