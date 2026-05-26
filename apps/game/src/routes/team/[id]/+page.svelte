<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { getActiveSeason } from '$lib/supabase';
	import { modal } from '$lib/stores/modal';

	let { data } = $props();
	let { supabase } = $derived(data);

	import BrandLoading from '$lib/components/BrandLoading.svelte';
	import TeamIcon from '$lib/components/TeamIcon.svelte';
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
	let isContributor = $state(false);
	let contributorRoleId = $state<string | null>(null);
	let isFollowing = $state(false);


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

		// 2. Fetch ALL teams IN THIS LEAGUE to initialize standings map (required for ELO)
		const { data: allTeams } = await supabase
			.from('teams')
			.select('id, name, color')
			.eq('league_id', teamData.league_id);
			
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
				leagues (protocol_config),
				seasons (protocol_version, protocol_config),
				home_team:teams!home_team_id (id, name, color),
				away_team:teams!away_team_id (id, name, color)
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
			const config = (m.seasons as any)?.protocol_config ?? (m.leagues as any)?.protocol_config ?? {};
			const tickRate = config.tickRateMs || DEFAULT_TICK_RATE;
			const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
			
			const startTime = new Date(m.scheduled_time).getTime();
			const endTime = startTime + (leagueMaxTicks * tickRate);

			const isPast = (m.status === 'played' || m.status === 'simulated' || m.status === 'simmed') && now >= endTime;

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
						result: teamScore > oppScore ? 'W' : (teamScore < oppScore ? 'L' : 'D'),
						home_team: m.home_team,
						away_team: m.away_team
					});
				} else {
					processedUpcoming.push({ ...m, opponent, home_team: m.home_team, away_team: m.away_team });
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
		
		// Check contributor status
		const { data: { session } } = await supabase.auth.getSession();
		if (session) {
			const { data: roles } = await supabase
				.from('user_roles')
				.select('id')
				.eq('user_id', session.user.id)
				.eq('team_id', teamId)
				.eq('role', 'contributor')
				.maybeSingle();
			
			if (roles) {
				isContributor = true;
				contributorRoleId = roles.id;
			} else {
				isContributor = false;
				contributorRoleId = null;
			}
		}


		isLoading = false;
	}

	async function becomeContributor() {
		isFollowing = true;
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) {
			modal.alert('Auth Required', 'You must be logged in to follow a team.');
			isFollowing = false;
			return;
		}
		
		const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
		if (profile) {
			const { error } = await supabase.rpc('grant_role', {
				target_username: profile.username,
				granted_role: 'contributor',
				target_team_id: teamId
			});
			
			if (!error) {
				// Refresh data to get the new role ID
				await loadTeamData();
			} else {
				modal.alert('Error', error.message);
			}
		}
		isFollowing = false;
	}

	async function unfollowTeam() {
		if (!contributorRoleId) return;
		isFollowing = true;
		
		const { error } = await supabase.rpc('revoke_role', {
			role_to_revoke_id: contributorRoleId
		});
		
		if (!error) {
			isContributor = false;
			contributorRoleId = null;
		} else {
			modal.alert('Error', error.message);
		}
		isFollowing = false;
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
			<BrandLoading message="Retrieving Team Data..." />
		</div>
	{:else if teamData}
		<!-- Header -->
		<header class="relative h-64 overflow-hidden border-b border-white/5 bg-black/40">
			<div class="absolute inset-0 opacity-10" style="background: radial-gradient(circle at 50% 50%, {teamData.color} 0%, transparent 70%);"></div>
			
			<div class="container mx-auto flex h-full items-end p-8 lg:p-12">
				<div class="flex items-center gap-8" in:fly={{ y: 20, duration: 800 }}>
					<div class="flex h-32 w-32 items-center justify-center rounded-2xl border-4 shadow-2xl overflow-hidden bg-black/40" style="border-color: {teamData.color}44;">
						<TeamIcon teamName={teamData.name} color={teamData.color} size="size-20" class="drop-shadow-[0_0_20px_{teamData.color}66]" />
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-4">
							<h1 class="text-5xl font-black tracking-tighter text-white uppercase">{teamData.name}</h1>
							<span class="rounded-full bg-white/5 px-4 py-1 text-xs font-black uppercase tracking-widest text-white/40 border border-white/10">Active Logic</span>
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

				<div class="flex items-center gap-4" in:fly={{ x: 20, duration: 800 }}>
					{#if isContributor}
						<button 
							onclick={unfollowTeam}
							disabled={isFollowing}
							class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 shadow-lg backdrop-blur-md flex items-center gap-2 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all group/follow"
						>
							<svg class="h-3 w-3 block group-hover/follow:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
							<svg class="h-3 w-3 hidden group-hover/follow:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
							<span class="block group-hover/follow:hidden">Following</span>
							<span class="hidden group-hover/follow:block">Unfollow</span>
						</button>
					{:else}
						<button 
							onclick={becomeContributor}
							disabled={isFollowing}
							class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all shadow-lg backdrop-blur-md disabled:opacity-50 flex items-center gap-2"
						>
							<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
							{isFollowing ? 'Following...' : 'Follow Team'}
						</button>
					{/if}

					<a href="{base}/team/{teamId}/test-runner" class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all shadow-lg backdrop-blur-md">Test Logic</a>
					<a href="{base}/team/{teamId}/dashboard" class="rounded-xl border border-[var(--color-brand-primary)]/20 bg-[var(--color-brand-primary)]/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 transition-all shadow-lg backdrop-blur-md">Manage Team</a>
				</div>
			</div>

			<a href="{base}/" aria-label="Back to Pitch" class="absolute left-8 top-8 group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:text-[var(--color-brand-primary)] shadow-lg backdrop-blur-md">
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
							<div class="group relative flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4 transition-all hover:bg-black/40 hover:border-[var(--color-brand-primary)]/30 group shadow-lg">
								<div class="flex items-center gap-4">
									<div class="relative">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black {match.result === 'W' ? 'bg-emerald-500/10 text-emerald-400' : (match.result === 'L' ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-white/40')}">
											{match.result}
										</div>
										<div class="absolute -right-2 -bottom-2 bg-black/60 rounded-full p-0.5 border border-white/5">
											<TeamIcon teamName={match.opponent.name} color={match.opponent.color} size="size-4" />
										</div>
									</div>
									<div class="flex flex-col">
										<span class="text-xs font-black text-white group-hover:text-[var(--color-brand-primary)] transition-colors">vs {match.opponent.name}</span>
										<span class="text-[10px] font-bold text-white/20 uppercase tracking-widest">{formatTime(match.scheduled_time)}</span>
									</div>
								</div>
								<div class="text-lg font-black text-white">
									{match.teamScore} <span class="text-white/10">-</span> {match.oppScore}
								</div>

								<!-- Hover Overlay with Actions -->
								<div class="absolute inset-0 flex items-center justify-center gap-4 sm:gap-6 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl z-10">
									<a href="{base}/team/{match.home_team.id}/film-room?match={match.id}" 
									   class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-current"
									   style="color: {match.home_team.color}"
									   title="{match.home_team.name} Film Room">
										<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
										<span class="text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden sm:inline">Film Room</span>
									</a>

									<a href="{base}/match/{match.id}" 
									   class="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-[var(--color-brand-primary)] text-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(5,150,105,0.3)] border border-emerald-400">
										<svg class="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
										<span class="text-[10px] sm:text-xs font-black uppercase tracking-widest">Play</span>
									</a>

									<a href="{base}/team/{match.away_team.id}/film-room?match={match.id}" 
									   class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-current"
									   style="color: {match.away_team.color}"
									   title="{match.away_team.name} Film Room">
										<span class="text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden sm:inline">Film Room</span>
										<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
									</a>
								</div>
							</div>
						{/each}

						{#if recentMatches.length === 0}
							<div class="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl italic text-white/10">No recent match results found.</div>
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
									<div class="h-10 w-10 rounded-xl flex items-center justify-center bg-black/40 border" style="border-color: {match.opponent.color}44">
										<TeamIcon teamName={match.opponent.name} color={match.opponent.color} size="size-6" />
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
			<a href="{base}/" class="text-[var(--color-brand-primary)] font-black uppercase tracking-widest hover:underline">Return to Pitch</a>
		</div>
	{/if}
</div>
