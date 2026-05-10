<script lang="ts">
	import { base } from '$app/paths';
	let { data } = $props();
	import { onMount } from 'svelte';
	import { supabase, getActiveSeason } from '$lib/supabase';
	import LeagueTicker from '$lib/components/dashboard/LeagueTicker.svelte';
	import StandingsBoard from '$lib/components/dashboard/StandingsBoard.svelte';
	import MatchFeed from '$lib/components/dashboard/MatchFeed.svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
	import SeasonChampion from '$lib/components/dashboard/SeasonChampion.svelte';
	import { calculateSeasonStandings } from '$lib/utils/standings';

	let featuredMatch = $state<any>(null);
	let allSeasons = $state<any[]>([]);
	let selectedSeasonId = $state<string | null>(null);
	let selectedSeason = $derived(allSeasons.find(s => s.id === selectedSeasonId));
	let now = $state(new Date());
	let isSeasonOver = $derived(selectedSeason && (new Date(selectedSeason.end_date) < now || selectedSeason.status === 'completed'));
	let standingsResult = $state<any>(null);

	async function fetchDashboardData() {
		const { data: seasons } = await supabase
			.from('seasons')
			.select('*')
			.order('start_date', { ascending: false });
		
		allSeasons = seasons || [];

		const active = await getActiveSeason();
		if (active) {
			selectedSeasonId = active.id;
		} else if (allSeasons.length > 0) {
			selectedSeasonId = allSeasons[0].id;
		}
	}

	async function fetchFeaturedMatch(seasonId: string) {
		const { data } = await supabase
			.from('matches')
			.select(`
				id,
				status,
				home_team:teams!home_team_id (name, color),
				away_team:teams!away_team_id (id, name, color)
			`)
			.eq('season_id', seasonId)
			.in('status', ['played', 'simmed', 'simulated', 'scheduled', 'live'])
			.order('scheduled_time', { ascending: false }) 
			.limit(1)
			.maybeSingle();
		
		featuredMatch = data;
	}

	async function fetchStandingsData(seasonId: string) {
		if (!selectedSeason) return;

		const { data: teamsData } = await supabase
			.from('teams')
			.select('id, name, color, logo_url, logo_icon_url')
			.eq('league_id', selectedSeason.league_id);

		const { data: matchesData } = await supabase
			.from('matches')
			.select(`
				id, home_team_id, away_team_id, home_score, away_score, scheduled_time, status, stats, winner_id,
				leagues (protocol_version, protocol_config),
				seasons (protocol_version, protocol_config)
			`)
			.in('status', ['simulated', 'simmed', 'played'])
			.eq('season_id', seasonId)
			.order('scheduled_time', { ascending: true });

		standingsResult = calculateSeasonStandings(teamsData || [], matchesData || []);
	}

	$effect(() => {
		if (selectedSeasonId) {
			fetchFeaturedMatch(selectedSeasonId);
			fetchStandingsData(selectedSeasonId);
		}
	});

	onMount(() => {
		fetchDashboardData();
		const interval = setInterval(() => { now = new Date(); }, 1000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Maintainer One | The Dashboard</title>
</svelte:head>

<!-- Global League Ticker at the very top -->
<LeagueTicker season={selectedSeason} />

<main
	data-component="dashboard"
	class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8"
>
	<header class="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
		<div class="flex items-center gap-5 px-5 py-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-xl">
			<BrandLogo size="size-12" />
			<div class="flex flex-col">
				<h1 class="text-white text-3xl font-black tracking-tighter leading-none flex items-center gap-2">
					<span class="text-[var(--color-brand-secondary)]">MAINTAINER</span> 
					<span class="text-[var(--color-brand-primary)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
						ONE
					</span>
				</h1>
				<div class="flex items-center gap-2 mt-1">
					<p class="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">Dashboard</p>
					{#if allSeasons.length > 0}
						<div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
							<span class="text-[9px] font-black uppercase text-white/30 tracking-widest">Season</span>
							<select 
								bind:value={selectedSeasonId}
								class="bg-transparent text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] border-none p-0 cursor-pointer focus:ring-0"
							>
								{#each allSeasons as s}
									<option value={s.id} class="bg-[#111]">{s.name}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>
			</div>
		</div>


		<div class="flex items-center gap-3">
			<a 
				href="{base}/schedule" 
				class="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-black rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest"
			>
				Schedule
			</a>
			<a 
				href="{base}/team/exhibition" 
				class="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-black rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest"
			>
				Practice
			</a>
			<a 
				href="{base}/film-room" 
				class="px-6 py-2.5 bg-[var(--color-brand-secondary)] text-[var(--color-background-dark)] font-black rounded-xl shadow-lg shadow-black/20 hover:scale-105 transition-all text-sm uppercase tracking-tighter"
			>
				Film Room
			</a>
			<a 
				href="{base}/multiview" 
				class="px-6 py-2.5 bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-500/20 hover:scale-105 transition-all text-sm uppercase tracking-tighter flex items-center gap-2"
			>
				<span class="h-2 w-2 rounded-xl bg-white animate-pulse"></span>
				Multiview
			</a>

			{#if data.session}
				<div class="relative group">
					<button 
						class="flex items-center gap-3 p-1.5 pr-4 bg-white/5 border border-white/10 rounded-xl hover:border-[var(--color-brand-primary)]/30 transition-all shadow-xl group/btn"
					>
						<div class="h-8 w-8 rounded-lg overflow-hidden bg-[var(--color-brand-primary)]/20 border border-white/5 flex items-center justify-center">
							{#if data.profile?.avatar_url}
								<img src={data.profile.avatar_url} alt={data.profile.username} class="h-full w-full object-cover" />
							{:else}
								<span class="text-xs font-black text-[var(--color-brand-primary)]">
									{data.profile?.username?.charAt(0).toUpperCase() || 'U'}
								</span>
							{/if}
						</div>
						<div class="flex flex-col items-start">
							<span class="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-0.5">Maintainer</span>
							<span class="text-[11px] font-black text-white uppercase tracking-tighter leading-none">@{data.profile?.username || 'user'}</span>
						</div>
						<svg class="h-4 w-4 text-white/20 group-hover/btn:text-[var(--color-brand-primary)] transition-colors ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
					</button>
					
					<div class="absolute right-0 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
						{#if data.roles?.includes('project_maintainer') || data.roles?.includes('league_maintainer')}
							<div class="px-5 py-2 border-b border-white/5 bg-white/5">
								<span class="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">Management</span>
							</div>
							<a href="{base}/admin/league" class="flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-colors">
								<svg class="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
								League Admin
							</a>
						{/if}
						
						{#if data.roles?.includes('project_maintainer')}
							<a href="{base}/admin/authority" class="flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]/60 hover:bg-[var(--color-brand-primary)]/10 hover:text-[var(--color-brand-primary)] transition-colors border-t border-white/5">
								<svg class="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
								Platform Authority
							</a>
						{/if}

						<button 
							onclick={async () => { await data.supabase.auth.signOut(); window.location.reload(); }}
							class="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-rose-500/60 hover:bg-rose-500/10 hover:text-rose-500 transition-colors border-t border-white/5"
						>
							<svg class="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
							Sign Out
						</button>
					</div>
				</div>
			{:else}
				<a 
					href="{base}/login" 
					class="px-6 py-2.5 bg-white/10 border border-white/10 text-white font-black rounded-xl shadow-lg hover:bg-white/20 transition-all text-sm uppercase tracking-tighter flex items-center gap-2"
				>
					Sign In
				</a>
			{/if}
		</div>
	</header>

	<!-- Main Grid Layout -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		
		<!-- Left Column: Big Board / Standings (Takes 4 cols on large screens) -->
		<div class="lg:col-span-4 xl:col-span-3">
			<div class="sticky top-8">
				<StandingsBoard season={selectedSeason} />
			</div>
		</div>


		<!-- Right Column: Match Feeds and Activity (Takes 8 cols) -->
		<div class="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
			
			<!-- Featured Live Action or Hero Section -->
			{#if isSeasonOver && standingsResult?.winner}
				<SeasonChampion 
					season={selectedSeason} 
					winner={standingsResult.winner} 
					playerAwards={standingsResult.playerAwards}
					teams={standingsResult.teams}
				/>
			{:else}
				<div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-8 shadow-2xl">
					<div class="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--color-brand-primary)]/10 to-[var(--color-brand-secondary)]/10 opacity-50 blur-xl transition duration-1000 group-hover:opacity-100"></div>
					
					<div class="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
						<div>
							<div class="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-3 py-1 text-[10px] font-black tracking-[0.1em] text-[var(--color-brand-secondary)] uppercase">
								<span class="h-2 w-2 animate-pulse rounded-full bg-[var(--color-brand-primary)]"></span>
							{['played', 'simulated', 'simmed'].includes(featuredMatch?.status) ? 'Latest Match' : 'Upcoming Match'}
						</div>
						<h2 class="text-4xl font-black text-white tracking-tighter">
							{#if featuredMatch}
								<span style="color: {featuredMatch.home_team.color}">{featuredMatch.home_team.name}</span>
								<span class="text-[var(--color-brand-secondary)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] mx-2">VS</span>
								<span style="color: {featuredMatch.away_team.color}">{featuredMatch.away_team.name}</span>
							{:else}
								League <span class="text-[var(--color-brand-secondary)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] mx-2">VS</span> Pitch
							{/if}
						</h2>
						<p class="mt-2 max-w-md text-sm text-white/70 font-medium leading-relaxed">
							{selectedSeason ? `Currently viewing ${selectedSeason.name}. Check out the latest high-stakes matchups.` : 'No active season. Create one in the admin panel to get started.'}
						</p>
					</div>

					
					{#if featuredMatch}
						<a 
							href="{base}/match/{featuredMatch.id}" 
							class="mt-4 flex items-center justify-center rounded-xl bg-[var(--color-brand-secondary)] px-8 py-4 font-black text-[var(--color-background-dark)] shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95 md:mt-0"
						>
							{featuredMatch.status === 'played' || featuredMatch.status === 'simulated' ? 'Watch Replay' : 'Match Details'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="ml-2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
							</a>
						{:else if data.roles?.includes('project_maintainer') || data.roles?.includes('league_maintainer')}
							<a 
								href="{base}/admin/league" 
								class="mt-4 flex items-center justify-center rounded-xl bg-[var(--color-brand-secondary)] px-8 py-4 font-black text-[var(--color-background-dark)] shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95 md:mt-0"
							>
								Create Season
								<svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
							</a>
						{:else}
							<div class="mt-4 flex items-center gap-2 text-[var(--color-brand-primary)] font-black uppercase tracking-widest text-xs">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
								Standby for Season Launch
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Match Feed List (Hidden during post-season celebration) -->
			{#if !isSeasonOver}
				<MatchFeed season={selectedSeason} />
			{/if}

		</div>
	</div>
</main>

<style>
	/* Any page-specific styles can go here */
</style>
