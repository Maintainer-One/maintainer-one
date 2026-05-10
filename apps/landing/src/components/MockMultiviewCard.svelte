<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import TeamIcon from '$lib/components/TeamIcon.svelte';
	import ReplayGrid from '$lib/components/ReplayGrid.svelte';

	let { 
		homeTeam = { name: 'Home', color: '#fff' }, 
		awayTeam = { name: 'Away', color: '#fff' },
		startDelayMs = 0
	} = $props();

	type Phase = 'PREGAME' | 'LIVE' | 'FINAL';
	
	let phase = $state<Phase>('PREGAME');
	let countdown = $state(10); // 10 seconds pregame
	
	let tick = $state(0);
	let state = $state<any>(null);

	let respawnTimer = $state(0);

	function calculateControlMap(players: any[]) {
		const BOARD_SIZE = 10;
		const controlMap = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
		const distMap: Record<string, number[][]> = {
			A: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity)),
			B: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity))
		};

		for (const teamId of ['A', 'B']) {
			const queue: { x: number; y: number; d: number }[] = [];
			for (const p of players.filter(p => p.team === teamId)) {
				queue.push({ ...p.position, d: 0 });
				distMap[teamId][p.position.y][p.position.x] = 0;
			}

			while (queue.length > 0) {
				const { x, y, d } = queue.shift()!;
				for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
						if (distMap[teamId][ny][nx] > d + 1) {
							distMap[teamId][ny][nx] = d + 1;
							queue.push({ x: nx, y: ny, d: d + 1 });
						}
					}
				}
			}
		}

		for (let y = 0; y < BOARD_SIZE; y++) {
			for (let x = 0; x < BOARD_SIZE; x++) {
				const dA = distMap.A[y][x];
				const dB = distMap.B[y][x];
				if (dA === Infinity && dB === Infinity) continue;
				if (dA < dB) controlMap[y][x] = 'A';
				else if (dB < dA) controlMap[y][x] = 'B';
				else controlMap[y][x] = 'CONTESTED';
			}
		}
		return controlMap;
	}

	function getInitialState() {
		const initialPlayers = [
			{ id: 'p1', team: 'A', position: { x: 2, y: 2 }, status: 'active' },
			{ id: 'p2', team: 'A', position: { x: 2, y: 4 }, status: 'active' },
			{ id: 'p3', team: 'A', position: { x: 2, y: 7 }, status: 'active' },
			{ id: 'p4', team: 'B', position: { x: 7, y: 2 }, status: 'active' },
			{ id: 'p5', team: 'B', position: { x: 7, y: 4 }, status: 'active' },
			{ id: 'p6', team: 'B', position: { x: 7, y: 7 }, status: 'active' }
		];

		return {
			tick: 0,
			teams: {
				A: { name: homeTeam.name, score: 0, color: homeTeam.color },
				B: { name: awayTeam.name, score: 0, color: awayTeam.color }
			},
			players: initialPlayers,
			pointZones: [{ position: { x: 4, y: 4 }, age: 0 }],
			controlMap: calculateControlMap(initialPlayers),
			isFinished: false,
			winner: null,
			lastEvents: []
		};
	}

	function resetLifecycle() {
		phase = 'PREGAME';
		countdown = 10;
		tick = 0;
		respawnTimer = 0;
		state = getInitialState();
	}

	onMount(() => {
		state = getInitialState();
		
		let timeout = setTimeout(() => {
			const interval = setInterval(() => {
				if (phase === 'PREGAME') {
					countdown--;
					if (countdown <= 0) {
						phase = 'LIVE';
					}
				} else if (phase === 'LIVE') {
					tick++;
					state.tick = tick;
					state.lastEvents = [];
					
					// 1. Age Zone / Respawn logic
					let zone = state.pointZones[0];
					if (zone) {
						zone.age++;
						if (zone.age > 40) {
							state.pointZones = [];
							respawnTimer = 2;
						}
					} else if (respawnTimer > 0) {
						respawnTimer--;
						if (respawnTimer === 0) {
							state.pointZones = [{ position: { x: Math.floor(Math.random()*10), y: Math.floor(Math.random()*10) }, age: 0 }];
						}
					}

					// Refresh zone reference for movement logic
					zone = state.pointZones[0];

					// 2. Move Players (Orthogonal, towards zone, avoid collisions)
					const occupied = new Set(state.players.map((p: any) => `${p.position.x},${p.position.y}`));
					
					state.players.forEach((p: any) => {
						occupied.delete(`${p.position.x},${p.position.y}`);
						
						let dx = 0; let dy = 0;
						if (zone && Math.random() > 0.2) { // 80% chance to move to zone
							const diffX = zone.position.x - p.position.x;
							const diffY = zone.position.y - p.position.y;
							
							if (diffX !== 0 && diffY !== 0) {
								if (Math.random() > 0.5) dx = diffX > 0 ? 1 : -1;
								else dy = diffY > 0 ? 1 : -1;
							} else if (diffX !== 0) {
								dx = diffX > 0 ? 1 : -1;
							} else if (diffY !== 0) {
								dy = diffY > 0 ? 1 : -1;
							}
						} else {
							const dirs = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
							const r = dirs[Math.floor(Math.random() * dirs.length)];
							dx = r.x; dy = r.y;
						}

						if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
							if (Math.random() > 0.5) dx = 0; else dy = 0;
						}

						let nx = p.position.x + dx;
						let ny = p.position.y + dy;
						nx = Math.max(0, Math.min(9, nx));
						ny = Math.max(0, Math.min(9, ny));

						if (!occupied.has(`${nx},${ny}`)) {
							p.position.x = nx;
							p.position.y = ny;
						}
						occupied.add(`${p.position.x},${p.position.y}`);
					});

					// Update Control Map dynamically using actual Voronoi logic
					state.controlMap = calculateControlMap(state.players);

					// 3. Score & Capture Zone
					if (zone) {
						const playersOnZone = state.players.filter((p: any) => p.position.x === zone.position.x && p.position.y === zone.position.y);
						if (playersOnZone.length === 1) {
							const capturer = playersOnZone[0];
							// Protocol V1: Score is simply the age of the zone
							const pts = zone.age;
							
							state.teams[capturer.team].score += pts;
							state.lastEvents.push({ type: 'CAPTURE', position: { ...zone.position }, team: capturer.team, score: pts });
							
							state.pointZones = [];
							respawnTimer = 2;
						}
					}

					// Finish Match
					if (tick >= 50) {
						phase = 'FINAL';
						state.isFinished = true;
						state.winner = state.teams.A.score > state.teams.B.score ? 'A' : (state.teams.B.score > state.teams.A.score ? 'B' : null);
					}
				} else if (phase === 'FINAL') {
					countdown--;
					if (countdown <= -5) {
						resetLifecycle();
					}
				}
				
			}, 750);
			return () => clearInterval(interval);
		}, startDelayMs);

		return () => clearTimeout(timeout);
	});
</script>

<style>
	.multiview-card {
		height: 380px;
		aspect-ratio: 0.88 / 1;
		flex-shrink: 0;
	}

	.game-render-area {
		min-height: 0;
		flex: 1;
	}
</style>

<button 
	class="multiview-card group relative flex flex-col rounded-2xl border border-white/5 bg-black/40 shadow-2xl overflow-hidden transition-all hover:scale-[1.01] hover:border-[var(--color-brand-primary)]/50 hover:shadow-[0_0_40px_rgba(5,150,105,0.2)] text-left"
	onclick={(e) => { e.preventDefault(); resetLifecycle(); }}
>
	<div class="w-full pt-2 flex flex-col items-center bg-black/20 gap-1 px-6 pointer-events-none z-20">
		<div class="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5 shadow-sm">
			<div class="flex items-center gap-2">
				{#if phase === 'PREGAME'}
					<span class="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Starts in {countdown}s</span>
				{:else if phase === 'LIVE'}
					<div class="flex items-center gap-1.5">
						<span class="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
						<span class="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em]">Live</span>
					</div>
					<div class="w-px h-2 bg-white/10"></div>
					<span class="text-[9px] font-black tabular-nums text-white/70 uppercase tracking-widest">Tick {tick}</span>
				{:else}
					<span class="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Final</span>
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-0.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-1 shadow-2xl">
			<div class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl" style="background-color: {homeTeam.color}11">
				<TeamIcon teamName={homeTeam.name} color={homeTeam.color} size="size-5" />
				<span class="text-sm font-black tabular-nums" style="color: {homeTeam.color}">{state?.teams?.A?.score ?? 0}</span>
			</div>
			<div class="w-px h-6 bg-white/10 mx-0.5"></div>
			<div class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl" style="background-color: {awayTeam.color}11">
				<span class="text-sm font-black tabular-nums" style="color: {awayTeam.color}">{state?.teams?.B?.score ?? 0}</span>
				<TeamIcon teamName={awayTeam.name} color={awayTeam.color} size="size-5" />
			</div>
		</div>
	</div>

	<div class="game-render-area w-full relative bg-black/20 flex items-center justify-center p-6 pt-2">
		<div class="w-full aspect-square flex items-center justify-center pointer-events-none max-h-full relative">
			{#if phase === 'PREGAME'}
				<div class="flex flex-col items-center gap-8 text-center" in:fade>
					<div class="flex items-center gap-12">
						<div class="flex flex-col items-center gap-3">
							<TeamIcon teamName={homeTeam.name} color={homeTeam.color} size="size-16" />
							<div class="text-[10px] font-black uppercase tracking-widest text-white/40 max-w-[80px]">{homeTeam.name}</div>
						</div>
						<div class="text-2xl font-black text-white/10 tracking-tighter italic">VS</div>
						<div class="flex flex-col items-center gap-3">
							<TeamIcon teamName={awayTeam.name} color={awayTeam.color} size="size-16" />
							<div class="text-[10px] font-black uppercase tracking-widest text-white/40 max-w-[80px]">{awayTeam.name}</div>
						</div>
					</div>
					<div class="space-y-1">
						<div class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-primary)]">Match Preview</div>
						<div class="text-2xl font-black text-white tabular-nums tracking-tight">{countdown}s</div>
					</div>
				</div>
			{:else}
				<ReplayGrid {state} playSpeed={750} showControlMap={true} />
			{/if}
		</div>
	</div>

	<div class="absolute inset-0 bg-black/0 group-hover:bg-white/5 transition-colors pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100">
		<div class="px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
			Click to Reset
		</div>
	</div>
</button>
