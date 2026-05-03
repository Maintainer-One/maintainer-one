<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { supabase, getActiveSeason } from '$lib/supabase';
	import LeagueTicker from '$lib/components/dashboard/LeagueTicker.svelte';
	import StandingsBoard from '$lib/components/dashboard/StandingsBoard.svelte';
	import MatchFeed from '$lib/components/dashboard/MatchFeed.svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';

	let featuredMatch = $state<any>(null);
	let activeSeason = $state<any>(null);

	async function fetchDashboardData() {
		activeSeason = await getActiveSeason();
		if (!activeSeason) return;

		// Fetch a featured match: prefer one that is played/simulated, otherwise next upcoming
		const { data } = await supabase
			.from('matches')
			.select(`
				id,
				status,
				home_team:teams!home_team_id (name, color),
				away_team:teams!away_team_id (id, name, color)
			`)
			.eq('season_id', activeSeason.id)
			.in('status', ['played', 'simmed', 'simulated', 'scheduled'])
			// Custom ordering logic: we want completed matches at the top if they just finished
			.order('scheduled_time', { ascending: false }) 
			.limit(1)
			.maybeSingle();
		
		featuredMatch = data;
	}

	onMount(() => {
		fetchDashboardData();
	});
</script>

<svelte:head>
	<title>Maintainer One | Command Center</title>
</svelte:head>

<!-- Global League Ticker at the very top -->
<LeagueTicker />

<main
	data-component="dashboard"
	class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8"
>
	<header class="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
		<div class="flex items-center gap-5 px-5 py-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-xl">
			<BrandLogo size="size-12" />
			<div class="flex flex-col">
				<h1 class="text-white text-3xl font-black tracking-tighter leading-none flex items-center gap-2">
					<span class="text-[var(--color-brand-secondary)]">COMMAND</span> 
					<span class="text-[var(--color-brand-primary)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
						CENTER
					</span>
				</h1>
				<p class="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em] mt-1">Live Dashboard</p>
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
				class="px-6 py-3 bg-[var(--color-brand-secondary)] text-[var(--color-background-dark)] font-black rounded-xl shadow-lg shadow-black/20 hover:scale-105 transition-all text-sm uppercase tracking-tighter"
			>
				Film Room
			</a>
			<a 
				href="{base}/admin/league" 
				class="p-3 bg-white/5 border border-white/10 text-white/20 rounded-xl hover:text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)]/30 transition-all"
				title="Admin Panel"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
			</a>
		</div>
	</header>

	<!-- Main Grid Layout -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		
		<!-- Left Column: Big Board / Standings (Takes 4 cols on large screens) -->
		<div class="lg:col-span-4 xl:col-span-3">
			<div class="sticky top-8">
				<StandingsBoard />
			</div>
		</div>

		<!-- Right Column: Match Feeds and Activity (Takes 8 cols) -->
		<div class="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
			
			<!-- Featured Live Action or Hero Section -->
			<div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-8 shadow-2xl">
				<div class="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--color-brand-primary)]/10 to-[var(--color-brand-secondary)]/10 opacity-50 blur-xl transition duration-1000 group-hover:opacity-100"></div>
				
				<div class="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
					<div>
						<div class="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-3 py-1 text-[10px] font-black tracking-[0.1em] text-[var(--color-brand-secondary)] uppercase">
							<span class="h-2 w-2 animate-pulse rounded-full bg-[var(--color-brand-primary)]"></span>
						{featuredMatch?.status === 'played' || featuredMatch?.status === 'simulated' ? 'Latest Match' : 'Upcoming Match'}
					</div>
					<h2 class="text-4xl font-black text-white tracking-tighter">
						{#if featuredMatch}
							<span style="color: {featuredMatch.home_team.color}">{featuredMatch.home_team.name}</span>
							<span class="text-[var(--color-brand-secondary)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] mx-2">VS</span>
							<span style="color: {featuredMatch.away_team.color}">{featuredMatch.away_team.name}</span>
						{:else}
							League <span class="text-[var(--color-brand-secondary)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] mx-2">VS</span> Arena
						{/if}
					</h2>
					<p class="mt-2 max-w-md text-sm text-white/70 font-medium leading-relaxed">
						{activeSeason ? `Currently following ${activeSeason.name}. Check out the latest high-stakes matchups.` : 'No active season. Create one in the admin panel to get started.'}
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
					{:else}
						<a 
							href="{base}/admin/league" 
							class="mt-4 flex items-center justify-center rounded-xl bg-[var(--color-brand-secondary)] px-8 py-4 font-black text-[var(--color-background-dark)] shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95 md:mt-0"
						>
							Create Season
							<svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
						</a>
					{/if}
				</div>
			</div>

			<!-- Match Feed List -->
			<MatchFeed />
		</div>
	</div>
</main>

<style>
	/* Any page-specific styles can go here */
</style>
