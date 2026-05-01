<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { fade, slide } from 'svelte/transition';

	type Season = { id: string, name: string, season_number: number, status: string, start_date: string };
	type Match = { id: string, home_team: { name: string }, away_team: { name: string }, status: string, scheduled_time: string };

	let seasons = $state<Season[]>([]);
	let selectedSeasonId = $state<string | null>(null);
	let matches = $state<Match[]>([]);
	
	let isCreatingSeason = $state(false);
	let newSeasonName = $state('');
	let isGeneratingSchedule = $state(false);
	let isSimulatingMatch = $state<string | null>(null);

	async function loadSeasons() {
		const { data, error } = await supabase
			.from('seasons')
			.select('id, name, season_number, status, start_date, league_id')
			.order('season_number', { ascending: false });
		if (!error && data) {
			seasons = data;
			if (data.length > 0 && !selectedSeasonId) {
				selectedSeasonId = data[0].id;
				await loadMatches(data[0].id);
			}
		}
	}

	async function loadMatches(seasonId: string) {
		const { data, error } = await supabase
			.from('matches')
			.select(`
				id,
				scheduled_time,
				status,
				home_team:teams!home_team_id (name, color),
				away_team:teams!away_team_id (name, color)
			`)
			.eq('season_id', seasonId)
			.order('scheduled_time', { ascending: true });
		if (!error && data) {
			// @ts-ignore
			matches = data;
		}
	}

	async function createSeason() {
		if (!newSeasonName) return;
		isCreatingSeason = true;
		
		// Get next season number
		const nextNum = (seasons[0]?.season_number ?? 0) + 1;
		
		const { data: leagues } = await supabase.from('leagues').select('id').limit(1).single();
		if (!leagues) return;

		const { data, error } = await supabase
			.from('seasons')
			.insert({
				name: newSeasonName,
				season_number: nextNum,
				league_id: leagues.id,
				status: 'pending',
				start_date: new Date().toISOString()
			})
			.select()
			.single();

		if (!error && data) {
			newSeasonName = '';
			await loadSeasons();
			selectedSeasonId = data.id;
			await loadMatches(data.id);
		}
		isCreatingSeason = false;
	}

	import { modal } from '$lib/stores/modal';

	async function generateRoundRobin() {
		if (!selectedSeasonId) return;
		isGeneratingSchedule = true;

		try {
			// 1. Get all teams
			const { data: teams } = await supabase.from('teams').select('id, name');
			if (!teams || teams.length < 2) throw new Error('Not enough teams to generate schedule');

			// 2. Generate pairs (Round Robin)
			const matchUps: { home: string, away: string }[] = [];
			for (let i = 0; i < teams.length; i++) {
				for (let j = i + 1; j < teams.length; j++) {
					matchUps.push({ home: teams[i].id, away: teams[j].id });
				}
			}

			// 3. Create matches in Supabase
			const season = seasons.find(s => s.id === selectedSeasonId)!;
			const startDate = new Date(season.start_date);
			const leagueId = season.league_id;

			const matchInserts = matchUps.map((m, idx) => ({
				league_id: leagueId,
				season_id: selectedSeasonId,
				home_team_id: m.home,
				away_team_id: m.away,
				status: 'pending',
				seed: Math.floor(Math.random() * 1000000),
				scheduled_time: new Date(startDate.getTime() + idx * 12 * 60 * 60 * 1000).toISOString() // 2 games a day (every 12 hours)
			}));

			const { error } = await supabase.from('matches').insert(matchInserts);
			if (error) throw error;

			await loadMatches(selectedSeasonId);
			modal.alert('Success', 'Schedule generated successfully!');
		} catch (err: any) {
			modal.alert('Error', err.message);
		} finally {
			isGeneratingSchedule = false;
		}
	}

	async function triggerSimulation(matchId: string) {
		isSimulatingMatch = matchId;
		
		try {
			const { data: match, error } = await supabase
				.from('matches')
				.select(`
					id,
					seed,
					league_id,
					leagues (protocol_version, protocol_config),
					home_team:teams!home_team_id (id, active_version_id),
					away_team:teams!away_team_id (id, active_version_id)
				`)
				.eq('id', matchId)
				.single();

			if (error || !match) throw error;

			const { error: updError } = await supabase
				.from('matches')
				.update({ 
					status: 'simulated', 
					home_score: Math.floor(Math.random() * 50),
					away_score: Math.floor(Math.random() * 50)
				})
				.eq('id', matchId);

			if (updError) throw updError;
			await loadMatches(selectedSeasonId!);
		} catch (err: any) {
			modal.alert('Error', 'Sim failed: ' + err.message);
		} finally {
			isSimulatingMatch = null;
		}
	}

	onMount(async () => {
		await loadSeasons();
	});
</script>

<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 p-8 lg:p-12 font-sans selection:bg-[var(--color-brand-primary)]/30">
	<header class="mb-12 flex items-center justify-between max-w-6xl mx-auto">
		<div class="flex items-center gap-8">
			<div class="inline-flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl">
				<div class="flex items-center gap-4">
					<a href="{base}/" aria-label="Go back" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] shadow-lg">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
					</a>
					<div class="flex flex-col">
						<h1 class="text-2xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">
							League <span class="text-[var(--color-brand-primary)]">Admin</span>
						</h1>
						<p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Commissioner Tools</p>
					</div>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-4">
			<button 
				onclick={() => isCreatingSeason = !isCreatingSeason}
				class="rounded-xl border border-white/5 bg-black/40 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
			>
				+ New Season
			</button>
		</div>
	</header>

	<div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
		<!-- Sidebar: Season Selection -->
		<aside class="space-y-6">
			<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Seasons</h3>
			
			{#if isCreatingSeason}
				<div class="p-6 rounded-2xl bg-[var(--color-brand-primary)]/5 border border-[var(--color-brand-primary)]/20 space-y-4" transition:slide>
					<input 
						type="text" 
						bind:value={newSeasonName} 
						placeholder="Season Name (e.g. Spring 2026)"
						class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50"
					/>
					<div class="flex gap-2">
						<button 
							onclick={createSeason}
							class="flex-1 rounded-xl bg-[var(--color-brand-primary)] py-3 text-[9px] font-black uppercase text-black"
						>
							Create
						</button>
						<button 
							onclick={() => isCreatingSeason = false}
							class="flex-1 rounded-xl bg-white/5 py-3 text-[9px] font-black uppercase text-white/40"
						>
							Cancel
						</button>
					</div>
				</div>
			{/if}

			<div class="space-y-2">
				{#each seasons as season}
					<button 
						onclick={() => {
							selectedSeasonId = season.id;
							loadMatches(season.id);
						}}
						class="w-full flex items-center justify-between p-4 rounded-xl border transition-all {selectedSeasonId === season.id ? 'bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)]/30 text-white' : 'bg-black/20 border-white/5 text-white/40 hover:bg-black/40'}"
					>
						<div class="flex flex-col items-start">
							<span class="text-[10px] font-black uppercase tracking-widest">Season {season.season_number}</span>
							<span class="text-xs font-bold">{season.name}</span>
						</div>
						<div class="px-2 py-0.5 rounded bg-black/40 text-[8px] font-black uppercase tracking-widest">
							{season.status}
						</div>
					</button>
				{/each}
			</div>
		</aside>

		<!-- Main: Match Management -->
		<div class="lg:col-span-2 space-y-8">
			{#if selectedSeasonId}
				<div class="flex items-center justify-between">
					<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Match Management</h3>
					
					{#if matches.length === 0}
						<button 
							onclick={generateRoundRobin}
							disabled={isGeneratingSchedule}
							class="rounded-xl bg-[var(--color-brand-primary)] px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
						>
							Generate Round-Robin
						</button>
					{/if}
				</div>

				{#if matches.length > 0}
					<div class="rounded-3xl border border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden shadow-2xl">
						<table class="w-full text-left">
							<thead>
								<tr class="border-b border-white/5 bg-white/5">
									<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Matchup</th>
									<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Scheduled Time</th>
									<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Status</th>
									<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20 text-right">Action</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-white/5">
								{#each matches as match}
									<tr class="hover:bg-white/5 transition-colors">
										<td class="px-6 py-4">
											<div class="flex items-center gap-2 text-xs font-bold text-white">
												<span style="color: {match.home_team.color || 'white'}">{match.home_team.name}</span>
												<span class="text-white/10 uppercase text-[9px]">vs</span>
												<span style="color: {match.away_team.color || 'white'}">{match.away_team.name}</span>
											</div>
										</td>
										<td class="px-6 py-4 text-[10px] font-bold text-white/40">
											{new Date(match.scheduled_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
										</td>
										<td class="px-6 py-4">
											<span class="text-[9px] font-black uppercase tracking-widest {match.status === 'simulated' ? 'text-emerald-400' : 'text-amber-400'}">
												{match.status}
											</span>
										</td>
										<td class="px-6 py-4 text-right">
											{#if match.status === 'pending'}
												<button 
													onclick={() => triggerSimulation(match.id)}
													disabled={isSimulatingMatch === match.id}
													class="text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:underline disabled:opacity-50"
												>
													{isSimulatingMatch === match.id ? 'Simulating...' : 'Run Sim Now'}
												</button>
											{:else}
												<a href="{base}/match/{match.id}" class="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
													View Replay
												</a>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="py-24 text-center border-2 border-dashed border-white/5 rounded-3xl">
						<p class="text-sm font-bold text-white/20 uppercase tracking-widest">No matches found for this season</p>
					</div>
				{/if}
			{:else}
				<div class="py-24 text-center">
					<p class="text-sm font-bold text-white/20 uppercase tracking-widest">Select a season to manage matches</p>
				</div>
			{/if}
		</div>
	</div>
</div>
