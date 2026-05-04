<script lang="ts">
	import { onMount } from 'svelte';
	import type { GameState } from '$packages/engine/types';
	import { tick } from '$packages/engine/core';
	import ReplayGrid from '$lib/components/ReplayGrid.svelte';

	let { initialState }: { initialState: GameState } = $props();
	
	let state = $state(initialState);
	let playSpeed = 300;
	let interval: ReturnType<typeof setInterval>;

	function resetAndPlay() {
		state = JSON.parse(JSON.stringify(initialState));
		
		interval = setInterval(() => {
			if (state.isFinished) {
				clearInterval(interval);
				setTimeout(resetAndPlay, 3000); // Wait 3 seconds then restart
			} else {
				state = tick(state);
			}
		}, playSpeed);
	}

	onMount(() => {
		resetAndPlay();
		return () => clearInterval(interval);
	});
</script>

<div class="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden filter blur-sm scale-110">
	<ReplayGrid {state} {playSpeed} showControlMap={true} />
</div>
