<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import type { GameState, TeamID } from '../../../../packages/engine/types';
	import SimWorker from '$lib/workers/sim.worker?worker';
	import { fade, fly } from 'svelte/transition';
	import { scratchpad } from '$lib/stores/scratchpad';

	type Team = { id: string, name: string, color: string };
	type Version = { id: string, version_number: number, source_code: string, compiled_code: string };
	type TestResult = { seed: number, finalState: GameState };

	let teams = $state<Team[]>([]);
	let selectedOpponent = $state<string | null>(null);
	let versionsOpponent = $state<Version[]>([]);
	let selectedVersionOpponent = $state<string | null>(null);
	let testIterations = $state(10);
	
	let isSimulating = $state(false);
	let batchResults = $state<TestResult[]>([]);
	let simWorker: Worker | null = null;
	let errorMessage = $state<string | null>(null);

	// Editor State
	let Editor: any = $state();
	let teamCode = $state('');
	let asideWidth = $state(500);
	let isResizing = $state(false);

	const STARTER_CODE = `import type { PlayerAction, SensedState } from '../../packages/engine/team_api.ts';

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
			if (!teamCode) teamCode = v.A || STARTER_CODE;
		});
		return unsubscribe;
	});

	async function loadTeams() {
		const { data, error } = await supabase.from('teams').select('id, name, color');
		if (!error && data) {
			teams = data;
			if (teams.length >= 2) {
				selectedOpponent = teams[1].id;
				await loadOpponentVersions(teams[1].id);
			}
		}
	}

	async function loadOpponentVersions(teamId: string) {
		const { data, error } = await supabase
			.from('team_code_versions')
			.select('id, version_number, source_code, compiled_code')
			.eq('team_id', teamId)
			.order('version_number', { ascending: false });
		
		if (!error && data) {
			versionsOpponent = data;
			if (data.length > 0) selectedVersionOpponent = data[0].id;
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
		// Assuming team code is for Team A (Home)
		const homeTeam = teams[0]; // Simplified for now, in a real app this would be the user's team

		const seeds = Array.from({ length: testIterations }, () => Math.floor(Math.random() * 1000000));

		if (simWorker) {
			// We must use $state.snapshot() to ensure we're sending raw POJOs to the worker,
			// as postMessage cannot clone Svelte 5 state proxies.
			simWorker.postMessage($state.snapshot({
				type: 'SIMULATE_BATCH',
				iterations: testIterations,
				seeds,
				alphaCode: teamCode,
				bravoCode: oppVersion?.source_code,
				bravoCompiled: oppVersion?.compiled_code,
				protocolVersion: 'v1',
				teamData: { A: homeTeam, B: opponentTeam }
			}));
		}
	}

	function handleCodeChange(newCode: string) {
		teamCode = newCode;
		scratchpad.updateCode('A', newCode);
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
			await loadTeams();
			Editor = (await import('$lib/components/SmartEditor.svelte')).default;
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
				<h2 class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-primary)] leading-none">Logic Editor</h2>
				<p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">{teams[0]?.name || 'Home Team'} Logic</p>
			</div>
			
			<div class="flex items-center gap-4">
				<div class="flex flex-col items-end">
					<span class="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Iterations</span>
					<input type="number" bind:value={testIterations} min="1" max="100" class="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50" />
				</div>
				<button 
					onclick={runTestSuite}
					disabled={isSimulating}
					class="rounded-xl bg-[var(--color-brand-primary)] px-6 py-2.5 text-[10px] font-black text-[var(--color-background-dark)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
				>
					{isSimulating ? 'Running...' : 'Run Test'}
				</button>
			</div>
		</header>
		<div class="flex-1 overflow-y-auto no-scrollbar p-4">
			{#if browser && Editor}
				<Editor code={teamCode} onCodeChange={handleCodeChange} />
			{/if}
		</div>
	</aside>

	<!-- Resize Handle -->
	<div onmousedown={startResizing} class="w-1 cursor-col-resize bg-zinc-800/50 transition-colors hover:bg-emerald-500/50 active:bg-emerald-500"></div>

	<!-- Right Side: Test Results -->
	<main class="flex flex-1 flex-col p-8 lg:p-12 overflow-y-auto no-scrollbar">
		<header class="mb-12 flex items-center justify-between">
			<div class="inline-flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl">
				<div class="flex items-center gap-4">
					<a href="{base}/" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] shadow-lg">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
					</a>
					<div class="flex flex-col">
						<h1 class="text-xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">
							Test <span class="text-[var(--color-brand-primary)]">Runner</span>
						</h1>
						<p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Headless Validation</p>
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
							class="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-rose-500/50 transition-all cursor-pointer"
						>
							{#each teams as team}
								<option value={team.id}>{team.name}</option>
							{/each}
						</select>
						<select 
							bind:value={selectedVersionOpponent}
							class="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-rose-500/50 transition-all cursor-pointer"
						>
							{#each versionsOpponent as v}
								<option value={v.id}>V{v.version_number}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</header>

		{#if stats}
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12" in:fade>
				<div class="rounded-3xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl">
					<div class="text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] mb-2">Win Rate</div>
					<div class="text-4xl font-black text-white">{stats.winRate.toFixed(1)}%</div>
				</div>
				<div class="rounded-3xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl">
					<div class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Avg Score</div>
					<div class="text-2xl font-black text-white">
						<span class="text-blue-400">{stats.avgScoreA.toFixed(1)}</span>
						<span class="text-white/10 mx-2">/</span>
						<span class="text-rose-400">{stats.avgScoreB.toFixed(1)}</span>
					</div>
				</div>
				<div class="rounded-3xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl">
					<div class="text-[9px] font-black uppercase tracking-widest text-amber-500/60 mb-2">Avg Luck ({teams[0]?.name || 'Home'})</div>
					<div class="text-2xl font-black {stats.avgLuckA >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
						{stats.avgLuckA > 0 ? '+' : ''}{stats.avgLuckA.toFixed(2)}
					</div>
				</div>
				<div class="rounded-3xl border border-white/5 bg-black/20 p-6 backdrop-blur-xl">
					<div class="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Samples</div>
					<div class="text-4xl font-black text-white">{batchResults.length}</div>
				</div>
			</div>

			<div class="rounded-3xl border border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden">
				<table class="w-full text-left">
					<thead>
						<tr class="border-b border-white/5 bg-white/5">
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
