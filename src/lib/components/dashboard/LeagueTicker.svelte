<script lang="ts">
	// Mock ticker events
	const events = [
		"Azure deployed V2 Logic",
		"Burgundy won 5-3 against Crimson",
		"Denim captured the central zone in record time",
		"Emerald's aggression rating spiked to 89%",
		"Fuchsia optimized pathfinding (3ms faster)",
		"Azure vs Denim match starting in 5 minutes",
		"Crimson patched a critical defensive flaw",
	];
</script>

<div class="relative flex overflow-x-hidden border-b border-white/10 bg-black/40 py-2 text-sm">
	<div class="animate-marquee whitespace-nowrap text-white/70">
		{#each events as event}
			<span class="mx-8 inline-flex items-center gap-2">
				<span class="h-2 w-2 rounded-full bg-[#00f2fe] shadow-[0_0_8px_rgba(0,242,254,0.8)]"></span>
				{event}
			</span>
		{/each}
	</div>
	
	<!-- Duplicate for seamless looping -->
	<div class="absolute top-2 animate-marquee2 whitespace-nowrap text-white/70">
		{#each events as event}
			<span class="mx-8 inline-flex items-center gap-2">
				<span class="h-2 w-2 rounded-full bg-[#00f2fe] shadow-[0_0_8px_rgba(0,242,254,0.8)]"></span>
				{event}
			</span>
		{/each}
	</div>
</div>

<style>
	/* Using arbitrary values or we can add these to tailwind config. 
	   Adding simple keyframes for marquee effect here. */
	@keyframes marquee {
		0% {
			transform: translateX(0%);
		}
		100% {
			transform: translateX(-100%);
		}
	}
	@keyframes marquee2 {
		0% {
			transform: translateX(100%);
		}
		100% {
			transform: translateX(0%);
		}
	}

	.animate-marquee {
		animation: marquee 35s linear infinite;
	}
	.animate-marquee2 {
		animation: marquee2 35s linear infinite;
	}
</style>
