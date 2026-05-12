<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { fade, fly } from 'svelte/transition';

	type Season = { id: string, name: string, season_number: number, status: string };
	type Match = { 
		id: string, 
		home_team: { id: string, name: string, color?: string }, 
		away_team: { id: string, name: string, color?: string }, 
		scheduled_time: string, 
		status: 'scheduled' | 'simmed' | 'played' | 'simulated',
		home_score: number | null,
		away_score: number | null
	};

	let seasons = $state<Season[]>([]);
	let selectedSeasonId = $state<string | null>(null);
	let matches = $state<Match[]>([]);
	let isLoading = $state(true);

	async function loadSeasons() {
		const { data, error } = await supabase
			.from('seasons')
			.select('id, name, season_number, status')
			.order('season_number', { ascending: false });
		
		if (!error && data) {
			seasons = data;
			if (data.length > 0) {
				selectedSeasonId = data[0].id;
				await loadMatches(data[0].id);
			} else {
				// Fallback if no seasons yet (maybe legacy matches)
				await loadAllMatches();
			}
		} else {
			await loadAllMatches();
		}
	}

	async function loadMatches(seasonId: string) {
		isLoading = true;
		const { data, error } = await supabase
			.from('matches')
			.select(`
				id,
				scheduled_time,
				status,
				home_score,
				away_score,
				home_team:teams!home_team_id (id, name, color),
				away_team:teams!away_team_id (id, name, color)
			`)
			.eq('season_id', seasonId)
			.order('scheduled_time', { ascending: true });

		if (!error && data) {
			// @ts-ignore
			matches = data;
		}
		isLoading = false;
	}

	async function loadAllMatches() {
		isLoading = true;
		const { data, error } = await supabase
			.from('matches')
			.select(`
				id,
				scheduled_time,
				status,
				home_score,
				away_score,
				home_team:teams!home_team_id (id, name, color),
				away_team:teams!away_team_id (id, name, color)
			`)
			.order('scheduled_time', { ascending: true });

		if (!error && data) {
			// @ts-ignore
			matches = data;
		}
		isLoading = false;
	}

	function formatTime(dateStr: string) {
		const d = new Date(dateStr);
		return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	onMount(async () => {
		await loadSeasons();
	});

	let matchesByDay = $derived.by(() => {
		const groups: Record<string, Match[]> = {};
		matches.forEach(m => {
			const day = new Date(m.scheduled_time).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
			if (!groups[day]) groups[day] = [];
			groups[day].push(m);
		});
		return Object.entries(groups);
	});
</script>

<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 p-8 lg:p-12 font-sans selection:bg-[var(--color-brand-primary)]/30">
	<header class="mb-12 flex items-center justify-between max-w-5xl mx-auto">
		<div class="flex items-center gap-8">
			<div class="inline-flex flex-col rounded-2xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl">
				<div class="flex items-center gap-4">
					<a href="{base}/" aria-label="Go back" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] shadow-lg">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
					</a>
					<div class="flex flex-col">
						<h1 class="text-2xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">
							League <span class="text-[var(--color-brand-primary)]">Schedule</span>
						</h1>
						<p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Season Playback</p>
					</div>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-4">
			{#if seasons.length > 0}
				<div class="flex flex-col items-end">
					<label for="season-select" class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Select Season</label>
					<select 
						id="season-select"
						bind:value={selectedSeasonId}
						onchange={() => selectedSeasonId && loadMatches(selectedSeasonId)}
						class="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50 transition-all appearance-none cursor-pointer pr-10"
					>
						{#each seasons as season}
							<option value={season.id}>Season {season.season_number}: {season.name}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
	</header>

	<div class="max-w-5xl mx-auto space-y-12">
		{#if isLoading}
			<div class="flex flex-col items-center justify-center py-32 space-y-6">
				<div class="h-12 w-12 border-4 border-[var(--color-brand-primary)]/10 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
				<p class="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Syncing Calendar...</p>
			</div>
		{:else if matches.length === 0}
			<div class="flex flex-col items-center justify-center py-32 text-center">
				<div class="h-20 w-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-8">
					<svg class="h-8 w-8 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
				</div>
				<h2 class="text-lg font-black text-white/40 uppercase tracking-widest">No Matches Scheduled</h2>
				<p class="text-xs font-medium text-white/20 mt-2">The league maintainer has not generated a schedule for this season yet.</p>
			</div>
		{:else}
			{#each matchesByDay as [day, dayMatches]}
				<section class="space-y-6" in:fade>
					<div class="flex items-center gap-4">
						<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-primary)] whitespace-nowrap">{day}</h3>
						<div class="h-px flex-1 bg-gradient-to-r from-[var(--color-brand-primary)]/20 to-transparent"></div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each dayMatches as match}
							<div class="group relative flex items-center justify-between bg-black/20 border border-white/5 rounded-2xl p-6 transition-all hover:bg-black/40 hover:border-[var(--color-brand-primary)]/30 hover:scale-[1.01]">
								<div class="flex flex-col gap-1">
									<span class="text-[8px] font-black uppercase tracking-[0.2em] {(match.status === 'played' || match.status === 'simulated') ? 'text-emerald-400' : 'text-amber-400'}">
										{(match.status === 'played' || match.status === 'simulated') ? 'Completed' : 'Upcoming'}
									</span>
									<span class="text-[10px] font-bold text-white/40">{formatTime(match.scheduled_time)}</span>
								</div>

								<div class="flex items-center gap-6">
									<div class="flex flex-col items-end gap-1">
										<span class="text-xs font-black" style="color: {match.home_team.color || 'white'}">{match.home_team.name}</span>
										<span class="text-[8px] font-black uppercase text-white/20">Home</span>
									</div>

									<div class="flex flex-col items-center gap-1">
										{#if match.status === 'played' || match.status === 'simulated'}
											<div class="px-3 py-1 rounded-lg bg-white/5 text-sm font-black text-white tracking-tighter">
												{match.home_score ?? 0} - {match.away_score ?? 0}
											</div>
										{:else}
											<div class="text-[10px] font-black text-white/10 uppercase">vs</div>
										{/if}
									</div>

									<div class="flex flex-col items-start gap-1">
										<span class="text-xs font-black" style="color: {match.away_team.color || 'white'}">{match.away_team.name}</span>
										<span class="text-[8px] font-black uppercase text-white/20">Away</span>
									</div>
								</div>

								<!-- Hover Overlay with Actions -->
								{#if match.status === 'played' || match.status === 'simulated'}
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
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/each}
		{/if}
	</div>
</div>

<style>
	select {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' stroke-opacity='0.2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		background-size: 1.25rem;
	}
</style>
