<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { browser } from '$app/environment';
	import { supabase } from '$lib/supabase';
	import type { GameState, TeamID } from '$packages/engine/types';
	import SimWorker from '$lib/workers/sim.worker?worker';
	import { fade, fly } from 'svelte/transition';
	import { scratchpad } from '$lib/stores/scratchpad';

	type Team = { id: string, name: string, color: string, active_version_id?: string };
	type Version = { id: string, version_number: number, source_code: string, compiled_code: string, name?: string };
	type TestResult = { seed: number, finalState: GameState };

	let teamId = $derived(page.params.id);
	let homeTeam = $state<Team | null>(null);
	let homeVersions = $state<Version[]>([]);
	let selectedHomeVersionId = $state<string>('scratchpad');

	let teams = $state<Team[]>([]);
	let selectedOpponent = $state<string | null>(null);
	let versionsOpponent = $state<Version[]>([]);
	let selectedVersionOpponent = $state<string | null>(null);
	let testIterations = $state(10);
	let customSeeds = $state<number[]>([]);
	let useLockedSeeds = $state(false);
	
	let isSimulating = $state(false);
	let batchResults = $state<TestResult[]>([]);
	let simWorker: Worker | null = null;
	let errorMessage = $state<string | null>(null);

	// Editor State
	let Editor: any = $state();
	let teamCode = $state('');
	let asideWidth = $state(500);
	let isResizing = $state(false);

	const STARTER_CODE = `import type { PlayerAction, SensedState } from '$packages/engine/team_api.ts';

export const teamLogic = (sense: SensedState): PlayerAction[] => {
	const actions: PlayerAction[] = [];
	const pointZone = sense.pointZones?.[0];

	if (!pointZone) return [];

	for (const player of sense.players) {
		if (player.status !== 'active') continue;

		const targetX = pointZone.position.x;
		const targetY = pointZone.position.y;
		const currentX = player.position.x;
		const currentY = player.position.y;

		let action: PlayerAction = { playerId: player.id, type: 'STAY' };

		if (currentY < targetY) {
			action = { playerId: player.id, type: 'MOVE', direction: 'DOWN' };
		} else if (currentY > targetY) {
			action = { playerId: player.id, type: 'MOVE', direction: 'UP' };
		} else if (currentX < targetX) {
			action = { playerId: player.id, type: 'MOVE', direction: 'RIGHT' };
		} else if (currentX > targetX) {
			action = { playerId: player.id, type: 'MOVE', direction: 'LEFT' };
		}

		actions.push(action);
	}

	return actions;
};`;

	$effect(() => {
		const unsubscribe = scratchpad.subscribe(v => {
			if (selectedHomeVersionId === 'scratchpad' && teamId) {
				const teamDrafts = v[teamId as string];
				teamCode = (teamDrafts && teamDrafts.length > 0) ? teamDrafts[0].code : STARTER_CODE;
			}
		});
		return unsubscribe;
	});

	let dataLoaded = false;
	$effect(() => {
		if (teamId && !dataLoaded && browser) {
			dataLoaded = true;
			
			// Try to restore from sessionStorage FIRST
			const savedSession = sessionStorage.getItem(`m1_test_session_${teamId}`);
			if (savedSession) {
				try {
					const data = JSON.parse(savedSession);
					batchResults = data.batchResults || [];
					testIterations = data.testIterations || 10;
					selectedHomeVersionId = data.selectedHomeVersionId || 'scratchpad';
					// We'll set these but loadInitialData might overwrite them if we aren't careful
					selectedOpponent = data.selectedOpponent || null;
					selectedVersionOpponent = data.selectedVersionOpponent || null;
				} catch (e) {
					console.error('Failed to restore session', e);
				}
			}

			loadInitialData();
			
			// Load saved seeds (localStorage is for persistent suite locking)
			const savedSeeds = localStorage.getItem(`m1_seeds_${teamId}`);
			if (savedSeeds) {
				try {
					customSeeds = JSON.parse(savedSeeds);
					useLockedSeeds = true;
					testIterations = customSeeds.length;
				} catch (e) {}
			}
		}
	});

	// Persist to sessionStorage whenever key state changes
	$effect(() => {
		if (browser && dataLoaded) {
			const sessionData = {
				batchResults: $state.snapshot(batchResults),
				testIterations,
				selectedHomeVersionId,
				selectedOpponent,
				selectedVersionOpponent
			};
			sessionStorage.setItem(`m1_test_session_${teamId}`, JSON.stringify(sessionData));
		}
	});

	async function loadInitialData() {
		// 1. Fetch Home Team
		const { data: home, error: homeErr } = await supabase
			.from('teams')
			.select('id, name, color, active_version_id')
			.eq('id', teamId)
			.single();
		
		if (!homeErr && home) {
			homeTeam = home;
			await loadHomeVersions();
		} else {
			console.error('Error loading home team:', homeErr);
			errorMessage = 'Failed to load team data. Please check the URL.';
		}

		// 2. Fetch All Teams for Opponent Selection
		const { data: allTeams, error: teamsErr } = await supabase.from('teams').select('id, name, color');
		if (!teamsErr && allTeams) {
			const filteredTeams = allTeams.filter(t => t.id !== teamId);
			teams = filteredTeams;
			if (filteredTeams.length > 0) {
				// Only set default if we didn't restore from session
				if (!selectedOpponent) {
					selectedOpponent = filteredTeams[0].id;
				}
				if (selectedOpponent) {
					await loadOpponentVersions(selectedOpponent);
				}
			}
		} else {
			console.error('Error loading opponents:', teamsErr);
		}
	}

	async function loadHomeVersions() {
		const { data, error } = await supabase
			.from('team_code_versions')
			.select('id, version_number, source_code, compiled_code, name')
			.eq('team_id', teamId)
			.order('version_number', { ascending: false });
		
		if (!error && data) {
			homeVersions = data;
			
			// Auto-hydrate scratchpad if empty
			if (!teamId) return;
			const tId = teamId as string;
			const currentDrafts = get(scratchpad)[tId] || [];
			if (currentDrafts.length === 0 || currentDrafts[0].code === STARTER_CODE) {
				const activeVersion = data.find(v => v.id === homeTeam?.active_version_id) || data[0];
				if (activeVersion) {
					if (currentDrafts.length === 0) {
						scratchpad.addScratchpad(tId, 'Draft 1', activeVersion.source_code);
					} else {
						scratchpad.updateScratchpad(tId, currentDrafts[0].id, activeVersion.source_code);
					}
				}
			}
		}
	}

	async function loadOpponentVersions(teamId: string) {
		const { data, error } = await supabase
			.from('team_code_versions')
			.select('id, version_number, source_code, compiled_code, name')
			.eq('team_id', teamId)
			.order('version_number', { ascending: false });
		
		if (!error && data) {
			versionsOpponent = data;
			// Only set default if we didn't restore from session, or if the restored version is gone
			if (data.length > 0) {
				const stillExists = data.some(v => v.id === selectedVersionOpponent);
				if (!selectedVersionOpponent || !stillExists) {
					selectedVersionOpponent = data[0].id;
				}
			}
		}
	}

	function handleHomeVersionChange() {
		if (selectedHomeVersionId === 'scratchpad' && teamId) {
			const teamDrafts = get(scratchpad)[teamId as string];
			teamCode = (teamDrafts && teamDrafts.length > 0) ? teamDrafts[0].code : STARTER_CODE;
		} else {
			const version = homeVersions.find(v => v.id === selectedHomeVersionId);
			if (version) {
				teamCode = version.source_code;
			}
		}
	}

	async function runTestSuite() {
		if (!selectedVersionOpponent || !teamCode) {
			errorMessage = 'Cannot run test. Please select an opponent version and write team logic.';
			return;
		}
		
		isSimulating = true;
		errorMessage = null;
		batchResults = [];

		const oppVersion = versionsOpponent.find(v => v.id === selectedVersionOpponent);
		const opponentTeam = teams.find(t => t.id === selectedOpponent);

		const seeds = useLockedSeeds && customSeeds.length > 0
			? customSeeds
			: Array.from({ length: testIterations }, () => Math.floor(Math.random() * 1000000));

		// Save seeds if not already locked
		if (!useLockedSeeds) {
			customSeeds = seeds;
		}

		if (simWorker) {
			simWorker.postMessage($state.snapshot({
				type: 'SIMULATE_BATCH',
				iterations: seeds.length,
				seeds,
				alphaCode: teamCode,
				bravoCode: oppVersion?.source_code,
				bravoCompiled: oppVersion?.compiled_code,
				protocolVersion: 'v1',
				teamData: { A: homeTeam, B: opponentTeam }
			}));
		}
	}

	function toggleSeedLock() {
		useLockedSeeds = !useLockedSeeds;
		if (useLockedSeeds) {
			localStorage.setItem(`m1_seeds_${teamId}`, JSON.stringify(customSeeds));
		} else {
			localStorage.removeItem(`m1_seeds_${teamId}`);
		}
	}

	function copySeeds() {
		if (customSeeds.length === 0) return;
		navigator.clipboard.writeText(customSeeds.join(', '));
		// Could add a toast here
	}

	async function pasteSeeds() {
		try {
			const text = await navigator.clipboard.readText();
			const seeds = text.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
			if (seeds.length > 0) {
				customSeeds = seeds;
				useLockedSeeds = true;
				testIterations = seeds.length;
				localStorage.setItem(`m1_seeds_${teamId}`, JSON.stringify(customSeeds));
			}
		} catch (e) {
			console.error('Failed to paste seeds', e);
		}
	}

	function handleCodeChange(newCode: string) {
		teamCode = newCode;
		if (selectedHomeVersionId === 'scratchpad' && teamId) {
			const tId = teamId as string;
			const teamDrafts = get(scratchpad)[tId];
			if (teamDrafts && teamDrafts.length > 0) {
				scratchpad.updateScratchpad(tId, teamDrafts[0].id, newCode);
			} else {
				scratchpad.addScratchpad(tId, 'Draft 1', newCode);
			}
		}
	}

	onMount(async () => {
		if (browser) {
			simWorker = new SimWorker();
			simWorker.onmessage = (e) => {
				if (e.data.type === 'BATCH_COMPLETE') {
					batchResults = e.data.results;
					isSimulating = false;
				} else if (e.data.type === 'SIMULATION_ERROR') {
					errorMessage = e.data.error;
					isSimulating = false;
				}
			};
			Editor = (await import('$lib/components/Editor.svelte')).default;
		}
	});

	let stats = $derived.by(() => {
		if (batchResults.length === 0) return null;
		
		let wins = 0;
		let draws = 0;
		let totalScoreA = 0;
		let totalScoreB = 0;
		let totalLuckA = 0;
		
		for (const res of batchResults) {
			const scoreA = res.finalState.teams.A.score;
			const scoreB = res.finalState.teams.B.score;
			totalScoreA += scoreA;
			totalScoreB += scoreB;
			totalLuckA += res.finalState.teams.A.stats.luckScore;

			if (scoreA > scoreB) wins++;
			else if (scoreA === scoreB) draws++;
		}

		return {
			winRate: (wins / batchResults.length) * 100,
			drawRate: (draws / batchResults.length) * 100,
			avgScoreA: totalScoreA / batchResults.length,
			avgScoreB: totalScoreB / batchResults.length,
			avgLuckA: totalLuckA / batchResults.length
		};
	});

	function startResizing() { isResizing = true; }
	function stopResizing() { isResizing = false; }
	function handleMouseMove(e: MouseEvent) {
		if (isResizing) asideWidth = Math.max(300, Math.min(800, e.clientX));
	}
</script>

<div 
	class="flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 font-sans"
	onmousemove={handleMouseMove}
	onmouseup={stopResizing}
	onmouseleave={stopResizing}
>
	<!-- Left Side: Editor -->
	<aside class="flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl" style="width: {asideWidth}px">
		<header class="flex h-20 items-center justify-between border-b border-white/5 px-6">
			<div class="flex flex-col">
				<div class="flex items-center gap-2 mb-1">
					<span class="h-1.5 w-1.5 rounded-full" style="background-color: {homeTeam?.color || 'var(--color-brand-primary)'}"></span>
					<span class="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">{homeTeam?.name || 'Loading...'}</span>
				</div>
				<h2 class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-primary)] leading-none">Logic Editor</h2>
				<select 
					bind:value={selectedHomeVersionId}
					onchange={handleHomeVersionChange}
					class="bg-transparent border-none p-0 text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5 outline-none cursor-pointer hover:text-white/40 transition-colors"
				>
					<option value="scratchpad" class="bg-zinc-900">Scratchpad Logic</option>
					{#each homeVersions as v}
						<option value={v.id} class="bg-zinc-900">V{v.version_number} {v.name ? `- ${v.name}` : ''}</option>
					{/each}
				</select>
			</div>
			
			<div class="flex items-center gap-4">
				<div class="flex flex-col items-end">
					<div class="flex items-center gap-2 mb-1">
						{#if useLockedSeeds}
							<span class="text-[8px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">Seeds Locked</span>
						{:else}
							<span class="text-[8px] font-black uppercase tracking-widest text-white/20">Iterations</span>
						{/if}
					</div>
					<div class="flex items-center gap-1.5">
						<input 
							type="number" 
							bind:value={testIterations} 
							min="1" 
							max="100" 
							disabled={useLockedSeeds}
							class="w-12 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50 disabled:opacity-50 disabled:border-emerald-500/20" 
						/>
						
						<div class="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
							<button 
								onclick={toggleSeedLock} 
								class="p-1.5 rounded-md transition-all {useLockedSeeds ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/20 hover:text-white hover:bg-white/5'}" 
								title={useLockedSeeds ? 'Unlock Seeds' : 'Lock Current Seeds'}
							>
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
							</button>
							<button 
								onclick={copySeeds} 
								class="p-1.5 rounded-md text-white/20 hover:text-white hover:bg-white/5 transition-all" 
								title="Copy Seed List"
							>
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
							</button>
							<button 
								onclick={pasteSeeds} 
								class="p-1.5 rounded-md text-white/20 hover:text-white hover:bg-white/5 transition-all" 
								title="Paste Seed List"
							>
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
							</button>
						</div>

						<button 
							onclick={runTestSuite}
							disabled={isSimulating}
							class="ml-2 rounded-xl bg-[var(--color-brand-primary)] px-6 py-2.5 text-[10px] font-black text-[var(--color-background-dark)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
						>
							{isSimulating ? 'Running...' : 'Run Test'}
						</button>
					</div>
				</div>
			</div>
		</header>
		<div class="flex-1 overflow-y-auto no-scrollbar p-4">
			{#if Editor}
				<Editor code={teamCode} onCodeChange={handleCodeChange} />
			{/if}
		</div>
	</aside>

	<!-- Resize Handle -->
	<div onmousedown={startResizing} class="w-1 cursor-col-resize bg-zinc-800/50 transition-colors hover:bg-emerald-500/50 active:bg-emerald-500"></div>

	<!-- Right Side: Test Results -->
	<main class="flex flex-1 flex-col p-8 lg:p-12 overflow-hidden">
		<header class="mb-12 flex items-center justify-between flex-shrink-0">
			<div class="inline-flex flex-col rounded-2xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl">
				<div class="flex items-center gap-4">
					<a href="{base}/team/{teamId}" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] shadow-lg">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
					</a>
					<div class="flex flex-col">
						<h1 class="text-xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">
							Test <span class="text-[var(--color-brand-primary)]">Runner</span>
						</h1>
						<p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">{homeTeam?.name || 'Loading...'} HQ</p>
					</div>
				</div>
			</div>

			<div class="flex items-center gap-6">
				<div class="flex flex-col items-end">
					<label class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Target Opponent</label>
					<div class="flex gap-2">
						<select 
							bind:value={selectedOpponent}
							onchange={() => selectedOpponent && loadOpponentVersions(selectedOpponent)}
							class="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-rose-500/50 transition-all cursor-pointer min-w-[120px]"
						>
							{#if teams.length === 0}
								<option value={null}>Loading Teams...</option>
							{/if}
							{#each teams as team}
								<option value={team.id}>{team.name}</option>
							{/each}
						</select>
						<select 
							bind:value={selectedVersionOpponent}
							class="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-rose-500/50 transition-all cursor-pointer min-w-[80px]"
						>
							{#if versionsOpponent.length === 0}
								<option value={null}>Loading...</option>
							{/if}
							{#each versionsOpponent as v}
								<option value={v.id}>V{v.version_number} {v.name ? `- ${v.name}` : ''}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</header>
		
		{#if errorMessage}
			<div class="mb-12 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-[10px] font-black uppercase tracking-widest text-rose-400 animate-pulse flex-shrink-0">
				Error: {errorMessage}
			</div>
		{/if}

		{#if stats}
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 flex-shrink-0" in:fade>
				<div class="rounded-2xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl">
					<div class="text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] mb-2">Win Rate</div>
					<div class="text-4xl font-black text-white">{stats.winRate.toFixed(1)}%</div>
				</div>
				<div class="rounded-2xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl">
					<div class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Avg Score</div>
					<div class="text-2xl font-black text-white">
						<span class="text-blue-400">{stats.avgScoreA.toFixed(1)}</span>
						<span class="text-white/10 mx-2">/</span>
						<span class="text-rose-400">{stats.avgScoreB.toFixed(1)}</span>
					</div>
				</div>
				<div class="rounded-2xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl">
					<div class="text-[9px] font-black uppercase tracking-widest text-amber-500/60 mb-2">Avg Luck ({homeTeam?.name || 'Home'})</div>
					<div class="text-2xl font-black {stats.avgLuckA >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
						{stats.avgLuckA > 0 ? '+' : ''}{stats.avgLuckA.toFixed(2)}
					</div>
				</div>
				<div class="rounded-2xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl">
					<div class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Samples</div>
					<div class="text-4xl font-black text-white">{batchResults.length}</div>
				</div>
			</div>

			<div class="flex-1 min-h-0 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl">
				<div class="overflow-y-auto no-scrollbar flex-1">
					<table class="w-full text-left border-collapse">
						<thead class="sticky top-0 bg-zinc-900/90 backdrop-blur-md z-10 border-b border-white/5">
							<tr>
								<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Seed</th>
								<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20">Result</th>
								<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20 text-center">Score</th>
								<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20 text-center">Luck</th>
								<th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/20 text-right">Action</th>
							</tr>
						</thead>
					<tbody class="divide-y divide-white/5">
						{#each batchResults as res}
							<tr class="hover:bg-white/5 transition-colors group">
								<td class="px-6 py-4 text-[10px] font-mono text-white/40">{res.seed}</td>
								<td class="px-6 py-4">
									{#if res.finalState.teams.A.score > res.finalState.teams.B.score}
										<span class="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Win</span>
									{:else if res.finalState.teams.A.score < res.finalState.teams.B.score}
										<span class="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded">Loss</span>
									{:else}
										<span class="text-[9px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-2 py-0.5 rounded">Draw</span>
									{/if}
								</td>
								<td class="px-6 py-4 text-center font-bold">
									<span style="color: {res.finalState.teams.A.color}">{res.finalState.teams.A.score}</span>
									<span class="text-white/10 mx-2">-</span>
									<span style="color: {res.finalState.teams.B.color}">{res.finalState.teams.B.score}</span>
								</td>
								<td class="px-6 py-4 text-center text-[10px] font-bold {res.finalState.teams.A.stats.luckScore >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}">
									{res.finalState.teams.A.stats.luckScore > 0 ? '+' : ''}{res.finalState.teams.A.stats.luckScore.toFixed(2)}
								</td>
								<td class="px-6 py-4 text-right">
									<a 
										href="{base}/film-room?seed={res.seed}" 
										class="text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
									>
										Visual Replay
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else if isSimulating}
			<div class="flex flex-1 flex-col items-center justify-center gap-6 py-24" in:fade>
				<div class="relative h-16 w-16">
					<div class="absolute inset-0 rounded-full border-4 border-[var(--color-brand-primary)]/10"></div>
					<div class="absolute inset-0 rounded-full border-4 border-t-[var(--color-brand-primary)] animate-spin"></div>
				</div>
				<p class="text-xs font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Processing Batch Simulation...</p>
			</div>
		{:else}
			<div class="flex flex-1 flex-col items-center justify-center py-24 text-center" in:fade>
				<div class="h-24 w-24 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-8">
					<svg class="h-10 w-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
				</div>
				<h2 class="text-lg font-black text-white/40 uppercase tracking-widest mb-2">No Test Data</h2>
				<p class="text-xs font-medium text-white/20 max-w-sm">Select an opponent and click "Run Test" to evaluate your logic across multiple randomized seeds.</p>
			</div>
		{/if}
	</main>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
