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

<div class="relative aspect-square h-full max-h-full max-w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl" data-component="ReplayGrid">
	<!-- Pitch Lines -->
	<div class="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-30">
		{#each Array(100) as _, i (i)}
			<div class="border-[0.5px] border-[var(--color-brand-primary)]/20"></div>
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
			<div class="h-4/5 w-4/5 animate-pulse rounded-xl bg-[var(--color-brand-primary)]/10 shadow-[0_0_25px_rgba(5,150,105,0.4)] border border-[var(--color-brand-primary)]/40 flex items-center justify-center">
				<span class="text-[10px] font-black text-[var(--color-brand-secondary)] tracking-widest uppercase">Zone</span>
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
				class="relative flex h-4/5 w-4/5 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-md transition-colors duration-300
                {player.team === 'A' ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-blue-500/20' : 'border-rose-500 bg-rose-500/20 text-rose-300 shadow-rose-500/20'}"
			>
				<span class="text-[10px] font-black uppercase">{player.id}</span>
				
				<!-- Team Indicator Glow -->
				<div class="absolute -inset-1.5 -z-10 animate-pulse rounded-full opacity-20 
                    {player.team === 'A' ? 'bg-blue-400' : 'bg-rose-400'}">
                </div>
			</div>
		</div>
	{/each}

    <!-- Victory Overlay -->
    {#if state.isFinished}
        <div class="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-1000 z-50">
            <div class="rounded-3xl border border-white/20 bg-black/60 p-10 text-center shadow-2xl scale-110 animate-bounce backdrop-blur-2xl">
                <h2 class="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
                    Team <span class="{state.winner === 'A' ? 'text-blue-400' : 'text-rose-400'}">{state.winner}</span> Wins!
                </h2>
                <p class="mt-3 text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">Capture complete at Tick {state.tick}</p>
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
