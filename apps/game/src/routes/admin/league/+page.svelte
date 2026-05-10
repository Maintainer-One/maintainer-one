<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { fade, slide } from 'svelte/transition';

	type Season = { 
		id: string, 
		name: string, 
		season_number: number, 
		status: string, 
		start_date: string,
		end_date?: string,
		game_density: number,
		game_slots: string[],
		code_lock_offset_minutes: number,
		league_id: string
	};
	type Match = { id: string, home_team: { name: string }, away_team: { name: string }, status: string, scheduled_time: string, code_lock_time: string };

	let seasons = $state<Season[]>([]);
	let selectedSeasonId = $state<string | null>(null);
	let matches = $state<Match[]>([]);
	
	// League & Tab State
	let leagues = $state<any[]>([]);
	let selectedLeagueId = $state<string | null>(null);
	let activeTab = $state<'schedule' | 'franchises'>('schedule');

	// Franchise State
	let leagueTeams = $state<any[]>([]);
	let selectedTeamId = $state<string | null>(null);
	let isCreatingTeam = $state(false);
	let newTeamName = $state('');
	let newTeamColor = $state('#ffffff');
	
	let isCreatingPlayer = $state(false);
	let newPlayerName = $state('');
	let newPlayerUnitIndex = $state('');
	

	let isGeneratingSchedule = $state(false);
	let isSimulatingMatch = $state<string | null>(null);

	let selectedSeason = $derived(seasons.find(s => s.id === selectedSeasonId));

	// Bulk Actions & Copy/Paste State
	let selectedMatchIds = $state<Set<string>>(new Set());
	let clipboardTime = $state<string | null>(null);
	
	let isBulkActionModalOpen = $state(false);
	let bulkActionType = $state<'absolute' | 'shift' | 'stagger' | 'simulate'>('absolute');
	let bulkAbsoluteTime = $state(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
	let bulkShiftAmount = $state(1);
	let bulkShiftUnit = $state<'minutes' | 'hours' | 'days'>('hours');
	let bulkStaggerStartTime = $state(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
	let bulkStaggerInterval = $state(15);

	async function loadLeagues() {
		const { data, error } = await supabase.from('leagues').select('*').order('created_at', { ascending: false });
		if (!error && data) {
			leagues = data;
			const urlParams = new URLSearchParams(window.location.search);
			const urlLeagueId = urlParams.get('league');
			
			if (urlLeagueId && data.find(l => l.id === urlLeagueId)) {
				selectedLeagueId = urlLeagueId;
			} else if (data.length > 0) {
				selectedLeagueId = data[0].id;
			}
			await loadLeagueData();
		}
	}

	async function loadLeagueData() {
		if (!selectedLeagueId) return;
		selectedSeasonId = null;
		matches = [];
		await Promise.all([
			loadSeasons(),
			loadTeams()
		]);
	}

	async function handleLeagueChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		selectedLeagueId = select.value;
		
		const url = new URL(window.location.href);
		url.searchParams.set('league', selectedLeagueId);
		window.history.pushState({}, '', url);

		await loadLeagueData();
	}

	async function loadTeams() {
		if (!selectedLeagueId) return;
		const { data, error } = await supabase
			.from('teams')
			.select('*, players(*)')
			.eq('league_id', selectedLeagueId)
			.order('name');
		
		if (!error && data) {
			leagueTeams = data;
		}
	}

	async function loadSeasons() {
		if (!selectedLeagueId) return;
		const { data, error } = await supabase
			.from('seasons')
			.select('id, name, season_number, status, start_date, end_date, game_density, game_slots, code_lock_offset_minutes, league_id')
			.eq('league_id', selectedLeagueId)
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
				code_lock_time,
				status,
				home_score,
				away_score,
				public_seed,
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

	async function handleSeasonChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		selectedSeasonId = select.value;
		if (selectedSeasonId) {
			await loadMatches(selectedSeasonId);
		}
	}



	function calculateCodeLockTime(scheduledIso: string, offsetMinutes: number) {
		const scheduled = new Date(scheduledIso);
		return new Date(scheduled.getTime() - offsetMinutes * 60000).toISOString();
	}

	function determineNewStatus(match: any, newScheduledIso: string) {
		const now = new Date();
		const newScheduled = new Date(newScheduledIso);
		const isMovingToFuture = newScheduled > now;
		
		console.log('Determining status for', match.id, 'New time:', newScheduledIso, 'Moving to future?', isMovingToFuture, 'Current status:', match.status);

		if (isMovingToFuture) {
			// If moving to the future, it should be ready for a new broadcast cycle
			if (match.status === 'played' || match.status === 'simmed' || match.home_score !== null) {
				return 'simmed'; // Keep results, wait for broadcast
			} else {
				return 'scheduled'; // Needs simulation
			}
		}
		return match.status;
	}

	async function updateMatchTime(matchId: string, newTime: string) {
		const scheduledIso = new Date(newTime).toISOString();
		const season = seasons.find(s => s.id === selectedSeasonId);
		const match = matches.find(m => m.id === matchId);
		const offset = season?.code_lock_offset_minutes || 30;
		const codeLockIso = calculateCodeLockTime(scheduledIso, offset);

		const { error } = await supabase
			.from('matches')
			.update({ 
				scheduled_time: scheduledIso, 
				code_lock_time: codeLockIso,
				status: determineNewStatus(match, scheduledIso)
			})
			.eq('id', matchId);

		if (!error) {
			await loadMatches(selectedSeasonId!);
		} else {
			modal.alert('Error', error.message);
		}
	}

	async function updateCodeLockTime(matchId: string, newTime: string) {
		const lockIso = new Date(newTime).toISOString();
		const { error } = await supabase
			.from('matches')
			.update({ 
				code_lock_time: lockIso
			})
			.eq('id', matchId);

		if (!error) {
			await loadMatches(selectedSeasonId!);
		} else {
			modal.alert('Error', error.message);
		}
	}



	function toggleMatchSelection(matchId: string) {
		const newSet = new Set(selectedMatchIds);
		if (newSet.has(matchId)) {
			newSet.delete(matchId);
		} else {
			newSet.add(matchId);
		}
		selectedMatchIds = newSet;
	}

	function selectAllMatches() {
		if (selectedMatchIds.size === matches.length && matches.length > 0) {
			selectedMatchIds = new Set();
		} else {
			selectedMatchIds = new Set(matches.map(m => m.id));
		}
	}

	async function executeBulkAction() {
		if (selectedMatchIds.size === 0) return;
		
		const selectedMatches = matches.filter(m => selectedMatchIds.has(m.id));
		const updates = [];

		const season = seasons.find(s => s.id === selectedSeasonId);
		const offset = season?.code_lock_offset_minutes || 30;

		if (bulkActionType === 'absolute') {
			const absoluteIso = new Date(bulkAbsoluteTime).toISOString();
			for (const match of selectedMatches) {
				updates.push({ 
					id: match.id, 
					scheduled_time: absoluteIso, 
					code_lock_time: calculateCodeLockTime(absoluteIso, offset),
					status: determineNewStatus(match, absoluteIso)
				});
			}
		} else if (bulkActionType === 'shift') {
			let multiplier = 60000; // minutes
			if (bulkShiftUnit === 'hours') multiplier = 3600000;
			if (bulkShiftUnit === 'days') multiplier = 86400000;
			
			const shiftMs = bulkShiftAmount * multiplier;
			for (const match of selectedMatches) {
				const current = new Date(match.scheduled_time).getTime();
				const newScheduledIso = new Date(current + shiftMs).toISOString();
				updates.push({ 
					id: match.id, 
					scheduled_time: newScheduledIso,
					code_lock_time: calculateCodeLockTime(newScheduledIso, offset),
					status: determineNewStatus(match, newScheduledIso)
				});
			}
		} else if (bulkActionType === 'stagger') {
			let currentStaggerTime = new Date(bulkStaggerStartTime).getTime();
			const intervalMs = bulkStaggerInterval * 60000;
			
			// Order by original scheduled time to maintain sequence
			const orderedMatches = [...selectedMatches].sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());
			
			for (const match of orderedMatches) {
				const newScheduledIso = new Date(currentStaggerTime).toISOString();
				updates.push({ 
					id: match.id, 
					scheduled_time: newScheduledIso,
					code_lock_time: calculateCodeLockTime(newScheduledIso, offset),
					status: determineNewStatus(match, newScheduledIso)
				});
				currentStaggerTime += intervalMs;
			}
		} else if (bulkActionType === 'simulate') {
			for (const match of selectedMatches) {
				await triggerSimulation(match.id);
			}
			isBulkActionModalOpen = false;
			selectedMatchIds = new Set();
			return; // Simulation handles its own loading and alerts
		}

		if (updates.length > 0) {
			const results = await Promise.all(updates.map(u => {
				const { id, ...data } = u;
				return supabase.from('matches').update(data).eq('id', id);
			}));
			
			const firstError = results.find(r => r.error)?.error;
			
			if (firstError) {
				modal.alert('Error', firstError.message);
			} else {
				await loadMatches(selectedSeasonId!);
				isBulkActionModalOpen = false;
				selectedMatchIds = new Set();
			}
		}
	}

	async function deleteSeason(id: string) {
		const season = seasons.find(s => s.id === id);
		if (!season) return;

		modal.confirm(
			'Delete Season',
			`Are you sure you want to delete ${season.name}? This will also delete all associated matches.`,
			async () => {
				const { error } = await supabase
					.from('seasons')
					.delete()
					.eq('id', id);

				if (!error) {
					if (selectedSeasonId === id) {
						selectedSeasonId = null;
						matches = [];
					}
					await loadSeasons();
				} else {
					modal.alert('Error', error.message);
				}
			}
		);
	}

	import { modal } from '$lib/stores/modal';

	async function generateRoundRobin() {
		if (!selectedSeasonId) return;
		isGeneratingSchedule = true;

		try {
			// 1. Get all teams
			const { data: teams } = await supabase.from('teams').select('id, name');
			if (!teams || teams.length < 2) throw new Error('Not enough teams to generate schedule');

			const season = seasons.find(s => s.id === selectedSeasonId)!;
			const startDate = new Date(season.start_date);
			const density = season.game_density || 1;
			const leagueId = season.league_id;

			// 2. Circle Method for Round Robin (Single Set)
			let teamList = [...teams];
			const isOdd = teamList.length % 2 !== 0;
			if (isOdd) {
				// @ts-ignore
				teamList.push({ id: 'BYE', name: 'BYE' });
			}

			const numRounds = teamList.length - 1;
			const matchesPerRound = teamList.length / 2;
			const singleRoundRobin: { home: string, away: string }[] = [];

			for (let round = 0; round < numRounds; round++) {
				for (let i = 0; i < matchesPerRound; i++) {
					const home = teamList[i];
					const away = teamList[teamList.length - 1 - i];

					if (home.id !== 'BYE' && away.id !== 'BYE') {
						if (round % 2 === 0) {
							singleRoundRobin.push({ home: home.id, away: away.id });
						} else {
							singleRoundRobin.push({ home: away.id, away: home.id });
						}
					}
				}
				const rest = teamList.slice(1);
				const last = rest.pop()!;
				teamList = [teamList[0], last, ...rest];
			}

			// 3. Calculate repeats based on duration and density
			const end = season.end_date ? new Date(season.end_date) : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
			const durationDays = (end.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
			const targetMatches = Math.floor(durationDays * density);
			const numRepeats = Math.max(1, Math.floor(targetMatches / singleRoundRobin.length));
			
			const matchUps: { home: string, away: string }[] = [];
			for (let i = 0; i < numRepeats; i++) {
				matchUps.push(...singleRoundRobin);
			}

			// 4. Create matches in Supabase with slot-based timing
			const slots = season.game_slots || ['12:00', '15:00'];
			let matchIdx = 0;
			let dayOffset = 0;

			while (matchIdx < matchUps.length) {
				for (const slot of slots) {
					if (matchIdx >= matchUps.length) break;

					const [hours, minutes] = slot.split(':').map(Number);
					const scheduledTime = new Date(startDate);
					// Important: use getDate/setDate to handle month rollovers correctly
					scheduledTime.setDate(startDate.getDate() + dayOffset);
					scheduledTime.setHours(hours, minutes, 0, 0);

					const m = matchUps[matchIdx];
					const scheduledIso = scheduledTime.toISOString();
					const seed = Math.floor(Math.random() * 1000000);
					
					const { data: createdMatch, error: matchError } = await supabase
						.from('matches')
						.insert({
							league_id: leagueId,
							season_id: selectedSeasonId,
							home_team_id: m.home,
							away_team_id: m.away,
							status: 'scheduled',
							scheduled_time: scheduledIso,
							code_lock_time: calculateCodeLockTime(scheduledIso, season.code_lock_offset_minutes || 30)
						})
						.select()
						.single();
					
					if (matchError) throw matchError;

					const { error: secretError } = await supabase
						.from('match_secrets')
						.insert({
							match_id: createdMatch.id,
							secret_seed: seed
						});
					
					if (secretError) throw secretError;
					matchIdx++;
				}
				dayOffset++;
			}


			await loadMatches(selectedSeasonId);
			modal.alert('Success', `Schedule generated! ${matchUps.length} matches across ${numRepeats} full round-robins.`);
		} catch (err: any) {
			modal.alert('Error', err.message);
		} finally {
			isGeneratingSchedule = false;
		}
	}

	import { runSimulation } from '$lib/simulation';

	async function triggerSimulation(matchId: string) {
		isSimulatingMatch = matchId;
		
		try {
			const { data: match, error } = await supabase
				.from('matches')
				.select(`
					id,
					public_seed,
					league_id,
					home_override_version_id,
					away_override_version_id,
					leagues (protocol_version, protocol_config),
					home_team:teams!home_team_id (id, name, color, active_version_id),
					away_team:teams!away_team_id (id, name, color, active_version_id)
				`)
				.eq('id', matchId)
				.single();

			if (error || !match) throw error;

			// Also fetch the secret seed
			const { data: secretData } = await supabase
				.from('match_secrets')
				.select('secret_seed')
				.eq('match_id', matchId)
				.single();
			
			const seed = secretData?.secret_seed || match.public_seed;
			if (!seed) throw new Error('No seed found for match');

			const states = await runSimulation({ ...match, seed });
			const finalState = states[states.length - 1];

			const { error: updError } = await supabase
				.from('matches')
				.update({ 
					status: 'simmed', 
					home_score: finalState.teams.A.score,
					away_score: finalState.teams.B.score,
					home_code_version_id: match.home_override_version_id || match.home_team.active_version_id,
					away_code_version_id: match.away_override_version_id || match.away_team.active_version_id,
					winner_id: finalState.winner === 'A' ? match.home_team.id : (finalState.winner === 'B' ? match.away_team.id : null)
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

	async function createTeam() {
		if (!selectedLeagueId || !newTeamName) return;
		const { error } = await supabase.from('teams').insert({
			league_id: selectedLeagueId,
			name: newTeamName,
			color: newTeamColor
		});
		if (!error) {
			isCreatingTeam = false;
			newTeamName = '';
			newTeamColor = '#ffffff';
			await loadTeams();
		} else {
			modal.alert('Error', error.message);
		}
	}

	async function createPlayer() {
		if (!selectedTeamId || !newPlayerName || !newPlayerUnitIndex) return;
		const { error } = await supabase.from('players').insert({
			team_id: selectedTeamId,
			name: newPlayerName,
			unit_index: newPlayerUnitIndex
		});
		if (!error) {
			isCreatingPlayer = false;
			newPlayerName = '';
			newPlayerUnitIndex = '';
			await loadTeams();
		} else {
			modal.alert('Error', error.message);
		}
	}

	onMount(async () => {
		await loadLeagues();
	});
</script>

<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 p-8 lg:p-12 font-sans selection:bg-[var(--color-brand-primary)]/30">
	<header class="mb-12 flex items-center justify-between max-w-6xl mx-auto">
		<div class="flex items-center gap-8">
			<div class="inline-flex flex-col rounded-2xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl">
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
			{#if leagues.length > 0}
				<div class="relative">
					<select 
						value={selectedLeagueId} 
						onchange={handleLeagueChange}
						class="appearance-none bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] outline-none focus:border-[var(--color-brand-primary)]/50 transition-colors cursor-pointer"
					>
						{#each leagues as league}
							<option value={league.id} class="text-black">{league.name}</option>
						{/each}
					</select>
					<svg class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-brand-primary)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
				</div>
			{/if}

			{#if activeTab === 'schedule' && seasons.length > 0}
				<div class="relative">
					<select 
						value={selectedSeasonId} 
						onchange={handleSeasonChange}
						class="appearance-none bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-[10px] font-black uppercase tracking-widest text-white/60 outline-none focus:border-white/20 transition-colors cursor-pointer"
					>
						{#each seasons as season}
							<option value={season.id} class="text-black">Season {season.season_number}: {season.name}</option>
						{/each}
					</select>
					<svg class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
				</div>
			{/if}

			{#if activeTab === 'schedule'}
				<a 
					href="{base}/admin/league/season/new?league={selectedLeagueId}"
					class="rounded-xl border border-white/5 bg-black/40 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
				>
					+ New Season
				</a>
			{/if}
		</div>
	</header>

	<!-- Tabs -->
	<div class="max-w-6xl mx-auto flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
		<button 
			onclick={() => activeTab = 'schedule'} 
			class="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all {activeTab === 'schedule' ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}"
		>
			Schedule Management
		</button>
		<button 
			onclick={() => activeTab = 'franchises'} 
			class="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all {activeTab === 'franchises' ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}"
		>
			Franchises & Rosters
		</button>
	</div>

	{#if activeTab === 'schedule'}
		<div class="max-w-6xl mx-auto space-y-8">
			{#if selectedSeason}
				<div class="p-6 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-3xl flex items-center justify-between shadow-2xl">
					<div class="flex flex-col">
						<div class="flex items-center gap-3">
							<span class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-primary)]">Season {selectedSeason.season_number}</span>
							<div class="h-1 w-1 rounded-full bg-white/20"></div>
							<span class="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{new Date(selectedSeason.start_date).toLocaleDateString()} → {selectedSeason.end_date ? new Date(selectedSeason.end_date).toLocaleDateString() : '??'}</span>
						</div>
						<h2 class="text-2xl font-black uppercase tracking-tighter text-white mt-1">{selectedSeason.name}</h2>
					</div>

					<div class="flex items-center gap-2">
						<a 
							href="{base}/admin/league/season/new?league={selectedLeagueId}&template={selectedSeason.id}"
							class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all"
						>
							<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
							Duplicate Template
						</a>
						<button 
							onclick={() => deleteSeason(selectedSeason!.id)}
							class="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:bg-red-500/20 hover:text-red-500 transition-all"
						>
							<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
							Delete
						</button>
					</div>
				</div>
			{/if}
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
					{#if selectedMatchIds.size > 0}
						<div class="sticky top-4 z-20 flex flex-col gap-4 p-4 rounded-2xl bg-black/80 border border-[var(--color-brand-primary)]/30 backdrop-blur-3xl shadow-2xl mb-4">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-white"><span class="text-[var(--color-brand-primary)]">{selectedMatchIds.size}</span> matches selected</span>
								<div class="flex gap-2">
									<select 
										bind:value={bulkActionType}
										class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white outline-none [&>option]:text-black"
									>
										<option value="absolute">Set Absolute Time</option>
										<option value="shift">Shift Time Relative</option>
										<option value="stagger">Stagger Starts</option>
										<option value="simulate">Simulate Matches</option>
									</select>
								</div>
							</div>
							
							<div class="flex items-end gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
								{#if bulkActionType === 'absolute'}
									<div class="flex-1 space-y-1">
										<label class="text-[8px] font-black uppercase tracking-widest text-white/40">Set Time To</label>
										<input type="datetime-local" bind:value={bulkAbsoluteTime} class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none" />
									</div>
								{:else if bulkActionType === 'shift'}
									<div class="flex-1 space-y-1">
										<label class="text-[8px] font-black uppercase tracking-widest text-white/40">Amount</label>
										<input type="number" bind:value={bulkShiftAmount} class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none" />
									</div>
									<div class="flex-1 space-y-1">
										<label class="text-[8px] font-black uppercase tracking-widest text-white/40">Unit</label>
										<select bind:value={bulkShiftUnit} class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none [&>option]:text-black">
											<option value="minutes">Minutes</option>
											<option value="hours">Hours</option>
											<option value="days">Days</option>
										</select>
									</div>
								{:else if bulkActionType === 'stagger'}
									<div class="flex-1 space-y-1">
										<label class="text-[8px] font-black uppercase tracking-widest text-white/40">First Match Start</label>
										<input type="datetime-local" bind:value={bulkStaggerStartTime} class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none" />
									</div>
									<div class="flex-1 space-y-1">
										<label class="text-[8px] font-black uppercase tracking-widest text-white/40">Interval (Mins)</label>
										<input type="number" bind:value={bulkStaggerInterval} class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none" />
									</div>
								{/if}
								{#if bulkActionType !== 'simulate'}
									<button 
										onclick={executeBulkAction}
										class="rounded-lg bg-[var(--color-brand-primary)] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-black hover:scale-105 active:scale-95 transition-all"
									>
										Apply
									</button>
								{:else}
									<div class="flex-1"></div>
									<button 
										onclick={executeBulkAction}
										disabled={isSimulatingMatch !== null}
										class="rounded-lg bg-emerald-500 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
									>
										{isSimulatingMatch ? 'Simulating...' : 'Run Simulation Now'}
									</button>
								{/if}
							</div>
						</div>
					{/if}

					<div class="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl overflow-x-auto shadow-2xl">
						<table class="w-full text-left">
							<thead>
								<tr class="border-b border-white/5 bg-white/5">
									<th class="px-6 py-4 w-12">
										<input 
											type="checkbox" 
											checked={matches.length > 0 && selectedMatchIds.size === matches.length}
											onchange={selectAllMatches}
											class="accent-[var(--color-brand-primary)] cursor-pointer"
										/>
									</th>
									<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Matchup</th>
									<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Code Lock (Sim)</th>
									<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Broadcast (Start)</th>
									<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20 text-right">Status</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-white/5">
								{#each matches as match}
									<tr class="hover:bg-white/5 transition-colors {selectedMatchIds.has(match.id) ? 'bg-white/5' : ''}">
										<td class="px-6 py-4">
											<input 
												type="checkbox" 
												checked={selectedMatchIds.has(match.id)}
												onchange={() => toggleMatchSelection(match.id)}
												class="accent-[var(--color-brand-primary)] cursor-pointer"
											/>
										</td>
										<td class="px-6 py-4">
											<div class="flex items-center gap-4 min-w-[240px]">
												<div class="flex-1 flex flex-col items-end text-right">
													<span class="text-xs font-bold" style="color: {match.home_team.color || 'white'}">{match.home_team.name}</span>
													{#if match.status === 'played' || (match.status === 'simmed' && match.home_score !== null)}
														<span class="text-[10px] font-black text-white/40 mt-0.5">{match.home_score}</span>
													{/if}
												</div>
												
												<div class="flex flex-col items-center">
													<span class="text-white/10 uppercase text-[8px] font-black">VS</span>
												</div>

												<div class="flex-1 flex flex-col items-start">
													<span class="text-xs font-bold" style="color: {match.away_team.color || 'white'}">{match.away_team.name}</span>
													{#if match.status === 'played' || (match.status === 'simmed' && match.away_score !== null)}
														<span class="text-[10px] font-black text-white/40 mt-0.5">{match.away_score}</span>
													{/if}
												</div>
											</div>
										</td>
										<td class="px-6 py-4">
											<div class="flex items-center gap-2 group">
												<input 
													type="datetime-local" 
													value={match.code_lock_time ? new Date(new Date(match.code_lock_time).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
													onchange={(e) => updateCodeLockTime(match.id, e.currentTarget.value)}
													class="bg-transparent border-none text-[10px] font-bold text-white/20 focus:text-white focus:outline-none cursor-pointer p-0"
												/>
											</div>
										</td>
										<td class="px-6 py-4">
											<div class="flex items-center gap-2 group">
												<input 
													type="datetime-local" 
													value={new Date(new Date(match.scheduled_time).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
													onchange={(e) => updateMatchTime(match.id, e.currentTarget.value)}
													class="bg-transparent border-none text-[10px] font-bold text-white/40 focus:text-white focus:outline-none cursor-pointer p-0"
												/>
												<button 
													onclick={() => clipboardTime = match.scheduled_time}
													class="text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
													title="Copy Time"
												>
													<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
												</button>
											</div>
										</td>
										<td class="px-6 py-4 text-right">
											<div class="flex flex-col gap-1 items-end">
												<span class="text-[9px] font-black uppercase tracking-widest {
													match.status === 'played' ? 'text-emerald-400' : 
													match.status === 'simmed' ? 'text-blue-400' : 
													match.status === 'scheduled' ? 'text-amber-400' : 
													'text-white/40'
												}">
													{match.status}
												</span>
												{#if match.status === 'played' || (match.status === 'simmed' && match.home_score !== null)}
													<a href="{base}/match/{match.id}" class="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-[var(--color-brand-primary)] transition-colors">
														View Replay →
													</a>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="py-24 text-center border-2 border-dashed border-white/5 rounded-2xl">
						<p class="text-sm font-bold text-white/20 uppercase tracking-widest">No matches found for this season</p>
					</div>
				{/if}
			{:else}
				<div class="py-24 text-center">
					<p class="text-sm font-bold text-white/20 uppercase tracking-widest">Select a season to manage matches</p>
				</div>
			{/if}
		</div>
	{:else if activeTab === 'franchises'}
		<div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
			<!-- Teams Sidebar -->
			<aside class="space-y-6">
				<div class="flex items-center justify-between">
					<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Franchises</h3>
					<button 
						onclick={() => isCreatingTeam = !isCreatingTeam}
						class="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:underline"
					>
						+ New Team
					</button>
				</div>
				
				{#if isCreatingTeam}
					<div class="p-6 rounded-2xl bg-[var(--color-brand-primary)]/5 border border-[var(--color-brand-primary)]/20 space-y-4" transition:slide>
						<div class="space-y-1">
							<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Team Name</label>
							<input 
								type="text" 
								bind:value={newTeamName} 
								placeholder="e.g. Cobalt Sentinels"
								class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50"
							/>
						</div>
						<div class="space-y-1">
							<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Color (Hex)</label>
							<div class="flex items-center gap-2">
								<input type="color" bind:value={newTeamColor} class="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer" />
								<input 
									type="text" 
									bind:value={newTeamColor} 
									class="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none font-mono focus:border-[var(--color-brand-primary)]/50"
								/>
							</div>
						</div>
						<div class="flex gap-2 pt-2">
							<button 
								onclick={createTeam}
								disabled={!newTeamName}
								class="flex-1 rounded-lg bg-[var(--color-brand-primary)] py-2 text-[10px] font-black uppercase tracking-widest text-black hover:bg-[var(--color-brand-primary)]/80 disabled:opacity-50 transition-colors"
							>
								Create Team
							</button>
						</div>
					</div>
				{/if}

				<div class="flex flex-col gap-2">
					{#each leagueTeams as team}
						<button 
							onclick={() => selectedTeamId = team.id}
							class="w-full flex items-center justify-between px-6 py-4 rounded-xl border text-left transition-all {selectedTeamId === team.id ? 'border-white/20 bg-white/5' : 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/40'}"
						>
							<div class="flex items-center gap-3">
								<div class="w-3 h-3 rounded-full shadow-lg" style="background-color: {team.color}; box-shadow: 0 0 10px {team.color}40"></div>
								<span class="text-xs font-bold uppercase tracking-widest text-white/80">{team.name}</span>
							</div>
							<span class="text-[9px] font-black text-white/30 bg-black/40 px-2 py-1 rounded">{team.players?.length || 0} Players</span>
						</button>
					{/each}
				</div>
			</aside>

			<!-- Roster Management -->
			<div class="lg:col-span-2 space-y-6">
				{#if selectedTeamId}
					{@const team = leagueTeams.find(t => t.id === selectedTeamId)}
					<div class="flex items-center justify-between border-b border-white/5 pb-4">
						<div class="flex items-center gap-4">
							<div class="w-4 h-4 rounded-full" style="background-color: {team.color};"></div>
							<h2 class="text-xl font-black uppercase tracking-widest text-white">{team.name} Roster</h2>
						</div>
						<button 
							onclick={() => isCreatingPlayer = !isCreatingPlayer}
							class="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:underline"
						>
							+ Add Player
						</button>
					</div>

					{#if isCreatingPlayer}
						<div class="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4 mb-8" transition:slide>
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1">
									<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Player Name</label>
									<input 
										type="text" 
										bind:value={newPlayerName} 
										placeholder="e.g. John Doe"
										class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50"
									/>
								</div>
								<div class="space-y-1">
									<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Unit Index (ID)</label>
									<input 
										type="text" 
										bind:value={newPlayerUnitIndex} 
										placeholder="e.g. 1, 2, or 3"
										class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none font-mono focus:border-[var(--color-brand-primary)]/50"
									/>
								</div>
							</div>
							<div class="flex gap-2 pt-2">
								<button 
									onclick={createPlayer}
									disabled={!newPlayerName || !newPlayerUnitIndex}
									class="rounded-lg bg-white/10 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
								>
									Save Player
								</button>
							</div>
						</div>
					{/if}

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each [...(team.players || [])].sort((a, b) => a.unit_index.localeCompare(b.unit_index)) as player}
							<div class="group flex flex-col p-6 rounded-2xl border border-white/5 bg-black/20 hover:border-white/10 transition-all">
								<div class="flex items-start justify-between mb-4">
									<div>
										<h4 class="text-sm font-black text-white uppercase tracking-widest">{player.name}</h4>
										<p class="text-[9px] font-bold text-[var(--color-brand-primary)] uppercase tracking-[0.2em] mt-1">Unit {player.unit_index}</p>
									</div>
									<div class="w-8 h-8 rounded-lg border border-white/5 bg-black/40 flex items-center justify-center font-black text-xs text-white/30 group-hover:text-[var(--color-brand-primary)] transition-colors">
										{player.unit_index}
									</div>
								</div>
								
								<div class="mt-auto flex justify-between items-end border-t border-white/5 pt-4">
									<div class="text-[8px] font-bold text-white/30 uppercase tracking-widest">
										Status: <span class="text-emerald-400 ml-1">{player.status}</span>
									</div>
									<a href="{base}/player/{team.id}/{player.unit_index}" class="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
										View Profile
									</a>
								</div>
							</div>
						{/each}
						
						{#if !team.players || team.players.length === 0}
							<div class="col-span-2 py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
								<p class="text-sm font-bold text-white/20 uppercase tracking-widest">No players on roster</p>
							</div>
						{/if}
					</div>
				{:else}
					<div class="py-24 text-center">
						<p class="text-sm font-bold text-white/20 uppercase tracking-widest">Select a team to view their roster</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
