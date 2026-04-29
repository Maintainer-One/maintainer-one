<script lang="ts">
	import BrandLogo from './BrandLogo.svelte';
	
	let { message = 'Loading...' } = $props();
</script>

<div class="flex flex-col items-center justify-center gap-4 py-12">
	<div class="relative">
		<div class="absolute inset-0 animate-ping rounded-full bg-[var(--color-brand-primary)]/20 opacity-75"></div>
		<BrandLogo size="size-16" class="relative animate-pulse" />
	</div>
	{#if message}
		<p class="text-sm font-medium tracking-widest text-white/40 uppercase animate-pulse">{message}</p>
	{/if}
</div>
