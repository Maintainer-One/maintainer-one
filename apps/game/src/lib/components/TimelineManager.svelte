<script lang="ts">
	import type { Timeline } from '$lib/types/film-room';

	let {
		timelines,
		activeTimelineId = $bindable(),
		ghostTimelineId = $bindable(),
		globalTick = $bindable(),
		isPlaying = false,
		onTogglePlay,
		onStepForward,
		onStepBackward,
		onSave,
		onLoad,
		onPublish
	} : {
		timelines: Timeline[];
		activeTimelineId: string | null;
		ghostTimelineId: string | null;
		globalTick: number;
		isPlaying: boolean;
		onTogglePlay: () => void;
		onStepForward: () => void;
		onStepBackward: () => void;
		onSave: (timelineId: string) => void;
		onLoad: (timelineId: string) => void;
		onPublish?: () => void;
	} = $props();


	// Find the maximum tick length across all timelines to scale the UI
	let maxTicks = $derived(Math.max(100, ...timelines.map(t => t.states.length - 1)));

</script>

<div class="w-full max-w-3xl flex flex-col rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-2xl overflow-hidden">
	<!-- Control Bar -->
	<div class="flex items-center justify-between gap-6 p-4 border-b border-white/5 bg-black/20">
		<div class="flex items-center gap-3">
			<button
				onclick={onStepBackward}
				aria-label="Previous Tick"
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white active:scale-90 border border-white/5"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
			</button>
			<button
				onclick={onTogglePlay}
				aria-label={isPlaying ? 'Pause' : 'Play'}
				class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] transition-all hover:scale-110 active:scale-95 shadow-lg shadow-[var(--color-brand-primary)]/20"
			>
				{#if isPlaying}
					<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
				{:else}
					<svg class="h-6 w-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
				{/if}
			</button>
			<button
				onclick={onStepForward}
				aria-label="Next Tick"
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white active:scale-90 border border-white/5"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
			</button>
		</div>
	</div>

	<!-- Tracks Container -->
	<div class="relative w-full p-4 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
		<!-- Global Playhead overlay moved to track bar for alignment -->

		{#each timelines as timeline, idx}
			{@const isPrimary = activeTimelineId === timeline.id}
			{@const isGhost = ghostTimelineId === timeline.id}
			{@const isFinished = timeline.states[timeline.states.length - 1]?.isFinished}
			{@const lastBlock = timeline.blocks.A[timeline.blocks.A.length - 1] || timeline.blocks.B[timeline.blocks.B.length - 1]}
			{@const startTick = lastBlock ? lastBlock.startTick : 0}
			{@const endTick = timeline.states.length - 1}
			
			<div class="flex items-center gap-3 relative z-20 group">
				<!-- Toggles -->
				<div class="flex items-center gap-1 min-w-[50px]">
					<button 
						onclick={() => activeTimelineId = timeline.id}
						class="w-5 h-5 rounded-full flex items-center justify-center border transition-all {isPrimary ? 'bg-white border-white text-black' : 'border-white/20 text-transparent hover:border-white/50'}"
						title="Set as Primary"
					>
						<svg class="h-3 w-3 {isPrimary ? 'opacity-100' : 'opacity-0'}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
					</button>
					<button 
						onclick={() => ghostTimelineId = isGhost ? null : timeline.id}
						class="w-5 h-5 flex items-center justify-center rounded transition-all {isGhost ? 'text-white' : 'text-white/20 hover:text-white/50'}"
						title="Set as Ghost"
					>
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
					</button>
				</div>
				
				<!-- Track Name & Info (with Hover Actions) -->
				<div class="relative min-w-[150px] w-[150px] text-[10px] font-black uppercase overflow-hidden" style="color: {isPrimary ? 'white' : 'rgba(255,255,255,0.4)'}">
					
					<!-- Normal View -->
					<div class="flex flex-col justify-center transition-all duration-200 group-hover:-translate-y-full group-hover:opacity-0">
						<span class="truncate">{timeline.name}</span>
						<span class="text-[8px] text-white/30 tracking-widest mt-0.5">T{startTick} - T{endTick}</span>
					</div>

					<!-- Hover View (Actions) -->
					<div class="absolute inset-0 flex items-center gap-1.5 translate-y-full opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
						<button
							onclick={(e) => { e.stopPropagation(); onSave(timeline.id); }}
							class="flex flex-1 h-full items-center justify-center gap-1 rounded bg-white/5 border border-white/10 text-[9px] text-white/60 hover:bg-white/10 hover:text-white transition-all"
							title="Save Timeline Draft"
						>
							<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
							Save
						</button>
						<button
							onclick={(e) => { e.stopPropagation(); onLoad(timeline.id); }}
							class="flex flex-1 h-full items-center justify-center gap-1 rounded bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 text-[9px] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 transition-all"
							title="Load Library / Publish"
						>
							<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
							Library
						</button>
					</div>
				</div>

				<!-- Track Bar -->
				<div class="relative flex-1 h-6 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center cursor-pointer group-hover:bg-white/10 transition-colors">
					<input
						type="range"
						min="0"
						max={maxTicks}
						bind:value={globalTick}
						class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
					/>
					
					<!-- Lifespan Bar -->
					<div 
						class="absolute h-full transition-all duration-300"
						style="width: {((timeline.states.length - 1) / maxTicks) * 100}%; background-color: {isPrimary ? timeline.color : timeline.color + '44'}"
					></div>

					<!-- Playhead overlay (Per track for perfect alignment) -->
					<div 
						class="absolute top-0 bottom-0 w-px bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)] z-40 pointer-events-none transition-all duration-75"
						style="left: {(globalTick / maxTicks) * 100}%"
					></div>
					
					<!-- Splice Indicators -->
					{#each [...timeline.blocks.A, ...timeline.blocks.B] as block}
						{#if block.startTick > 0}
							<div 
								class="absolute top-0 bottom-0 border-l border-dashed border-white/40 z-20 pointer-events-none"
								style="left: {(block.startTick / maxTicks) * 100}%"
							></div>
						{/if}
					{/each}

					<!-- Knockout Indicator -->
					{#if isFinished}
						<div class="absolute right-0 h-full w-4 flex items-center justify-center bg-black/40 z-20 pointer-events-none border-l border-white/20">
							<span class="text-[8px]">🏁</span>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
