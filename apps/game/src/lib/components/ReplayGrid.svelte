<script lang="ts">
	import type { GameState, Position } from '$packages/engine/types';
	import { fade, fly } from 'svelte/transition';

	let { state, showControlMap = false, playSpeed = 750 }: { state: GameState, showControlMap?: boolean, playSpeed?: number } = $props();

	const GRID_SIZE = 10;

	// Helper to convert grid position to percentage for absolute placement
	function getPos(pos: Position) {
		return {
			left: `${(pos.x / GRID_SIZE) * 100}%`,
			top: `${(pos.y / GRID_SIZE) * 100}%`,
			width: `${(1 / GRID_SIZE) * 100}%`,
			height: `${(1 / GRID_SIZE) * 100}%`
		};
	}
</script>

<div class="relative aspect-square h-full max-h-full max-w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl" data-component="ReplayGrid">
	<!-- Pitch Lines -->
	<div class="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-30">
		{#each Array(100) as _, i (i)}
			<div class="border-[0.5px] border-[var(--color-brand-primary)]/20"></div>
		{/each}
	</div>

	<!-- Control Map Overlay -->
	{#if showControlMap && state.controlMap}
		<div class="absolute inset-0 grid grid-cols-10 grid-rows-10">
			{#each state.controlMap as row, y}
				{#each row as cell, x}
					<div 
						class="transition-colors duration-500"
						style="background-color: {cell && cell !== 'CONTESTED' ? `${state.teams[cell].color}22` : cell === 'CONTESTED' ? '#f59e0b11' : 'transparent'}"
					></div>
				{/each}
			{/each}
		</div>
	{/if}

	<!-- Point Zones -->
	{#each state.pointZones as pz}
		<div
			class="absolute flex items-center justify-center transition-all duration-500"
			style="
                left: {getPos(pz.position).left}; 
                top: {getPos(pz.position).top}; 
                width: {getPos(pz.position).width}; 
                height: {getPos(pz.position).height};
            "
		>
			<div class="h-4/5 w-4/5 animate-pulse rounded-xl bg-[var(--color-brand-primary)]/10 shadow-[0_0_25px_rgba(5,150,105,0.4)] border border-[var(--color-brand-primary)]/40 flex flex-col items-center justify-center relative">
				<span class="text-[10px] font-black text-[var(--color-brand-secondary)] tracking-widest uppercase">Zone</span>
				{#if pz.age !== undefined}
					<span class="absolute -top-2 -right-2 text-[8px] font-black bg-[var(--color-brand-primary)] text-black rounded-full w-4 h-4 flex items-center justify-center shadow-lg">{pz.age}</span>
				{/if}
			</div>
		</div>
	{/each}

	<!-- Players -->
	{#each state.players as player (player.id)}
		<div
			class="absolute flex items-center justify-center transition-all ease-in-out"
			style="
                left: {getPos(player.position).left}; 
                top: {getPos(player.position).top}; 
                width: {getPos(player.position).width}; 
                height: {getPos(player.position).height};
                transition-duration: {playSpeed}ms;
            "
		>
			<div
				class="relative flex h-4/5 w-4/5 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-md transition-colors duration-300"
				style="border-color: {state.teams[player.team].color}; background-color: {state.teams[player.team].color}33; color: {state.teams[player.team].color}; box-shadow: 0 0 10px {state.teams[player.team].color}33;"
			>
				<span class="text-[10px] font-black uppercase">{state.teams[player.team].name[0]}{player.id.slice(1)}</span>
				
				{#if player.status === 'stunned'}
					<span class="absolute -top-2 -right-2 text-[8px] font-black bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center animate-bounce shadow-lg">⚡</span>
				{/if}
				
				<!-- Team Indicator Glow -->
				<div 
					class="absolute -inset-1.5 -z-10 animate-pulse rounded-full opacity-20"
					style="background-color: {state.teams[player.team].color}"
				>
                </div>
			</div>
		</div>
	{/each}

	<!-- Floating Events -->
	{#if state.lastEvents}
		{#each state.lastEvents as event (`${state.tick}-${event.type}-${event.position.x}-${event.position.y}`)}
			<div
				class="absolute flex items-center justify-center pointer-events-none z-40"
				style="
                    left: {getPos(event.position).left}; 
                    top: {getPos(event.position).top}; 
                    width: {getPos(event.position).width}; 
                    height: {getPos(event.position).height};
                "
			>
				{#if event.type === 'CAPTURE'}
					<div 
						in:fly={{ y: 20, duration: Math.min(400, playSpeed) }} 
						out:fade={{ duration: Math.min(300, playSpeed) }}
						class="absolute text-xl md:text-2xl font-black drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] -mt-16"
						style="color: {state.teams[event.team].color}"
					>
						+{event.score}
					</div>
					<div 
						class="absolute inset-0 rounded-full border-[3px] opacity-0"
						style="border-color: {state.teams[event.team].color}; animation: pop {Math.min(600, playSpeed)}ms ease-out forwards;"
					></div>
				{/if}
			</div>
		{/each}
	{/if}

    <!-- Victory Overlay -->
    {#if state.isFinished}
        <div class="absolute inset-0 flex items-center justify-center bg-[var(--color-background-dark)]/60 backdrop-blur-md transition-opacity duration-1000 z-50">
            <div class="rounded-[2rem] border border-[var(--color-brand-primary)]/30 bg-black/40 p-12 text-center shadow-[0_0_50px_rgba(5,150,105,0.2)] backdrop-blur-3xl transition-all duration-500 hover:scale-[1.02]">
                <div class="mb-4 inline-block rounded-full bg-[var(--color-brand-primary)]/10 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-primary)]">
                    Match Concluded
                </div>
                <h2 class="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
                    <span style="color: {state.teams[state.winner].color}">{state.teams[state.winner].name}</span> <span class="text-[var(--color-brand-primary)]">Wins!</span>
                </h2>
                <div class="mt-6 flex flex-col items-center gap-1">
                    <p class="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">Capture complete</p>
                    <p class="text-[var(--color-brand-secondary)] font-black text-xs uppercase">Tick {state.tick}</p>
                </div>
            </div>
        </div>
    {/if}
</div>
<style>
	@keyframes pop {
		0% { transform: scale(0.5); opacity: 1; }
		100% { transform: scale(2); opacity: 0; }
	}
</style>
