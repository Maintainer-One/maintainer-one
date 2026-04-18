<script lang="ts">
	import type { GameState, Position } from '../../../packages/engine/types';

	let { state }: { state: GameState } = $props();

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

<div class="relative aspect-square h-full max-h-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950/50 backdrop-blur-md shadow-2xl" data-component="ReplayGrid">
	<!-- Pitch Lines -->
	<div class="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-20">
		{#each Array(100) as _, i (i)}
			<div class="border-[0.5px] border-emerald-500/30"></div>
		{/each}
	</div>

	<!-- Point Zone -->
	{#if state.pointZone}
		<div
			class="absolute flex items-center justify-center transition-all duration-500"
			style="
                left: {getPos(state.pointZone.position).left}; 
                top: {getPos(state.pointZone.position).top}; 
                width: {getPos(state.pointZone.position).width}; 
                height: {getPos(state.pointZone.position).height};
            "
		>
			<div class="h-4/5 w-4/5 animate-pulse rounded-lg bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-500/50 flex items-center justify-center">
				<span class="text-[10px] font-bold text-emerald-400">ZONE</span>
			</div>
		</div>
	{/if}

	<!-- Players -->
	{#each state.players as player (player.id)}
		<div
			class="absolute flex items-center justify-center transition-all duration-750 ease-in-out"
			style="
                left: {getPos(player.position).left}; 
                top: {getPos(player.position).top}; 
                width: {getPos(player.position).width}; 
                height: {getPos(player.position).height};
            "
		>
			<div
				class="relative flex h-4/5 w-4/5 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-sm transition-colors duration-300
                {player.team === 'A' ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-rose-500 bg-rose-500/20 text-rose-300'}"
			>
				<span class="text-[10px] font-black uppercase">{player.id}</span>
				
				<!-- Team Indicator Glow -->
				<div class="absolute -inset-1 -z-10 animate-pulse rounded-full opacity-20 
                    {player.team === 'A' ? 'bg-blue-400' : 'bg-rose-400'}">
                </div>
			</div>
		</div>
	{/each}

    <!-- Victory Overlay -->
    {#if state.isFinished}
        <div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-1000">
            <div class="rounded-2xl border border-white/20 bg-zinc-900/80 p-8 text-center shadow-2xl scale-110 animate-bounce">
                <h2 class="text-3xl font-black italic tracking-tighter text-white uppercase">
                    Team {state.winner} Wins!
                </h2>
                <p class="mt-2 text-zinc-400 font-medium">Capture complete at Tick {state.tick}</p>
            </div>
        </div>
    {/if}
</div>

<style>
	/* Ensures smooth gliding between tiles */
	.duration-750 {
		transition-duration: 750ms;
	}
</style>
