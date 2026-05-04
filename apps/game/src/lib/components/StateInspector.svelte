<script lang="ts">
	import StateInspector from './StateInspector.svelte';
	let { data, label = 'sense' }: { data: any, label?: string } = $props();
	
	let isOpen = $state(true);

	function isObject(val: any) {
		return val !== null && typeof val === 'object';
	}
</script>

<div class="font-mono text-[10px]">
	<button 
		onclick={() => isOpen = !isOpen}
		class="flex items-center gap-1.5 py-1 text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)] transition-colors"
	>
		<span class="text-[8px] transition-transform {isOpen ? 'rotate-90' : ''}">▶</span>
		<span class="font-black uppercase tracking-tighter">{label}</span>
		{#if !isOpen}
			<span class="text-white/20">{Array.isArray(data) ? `[${data.length}]` : '{...}'}</span>
		{/if}
	</button>

	{#if isOpen}
		<div class="ml-3 border-l border-white/5 pl-3 space-y-0.5">
			{#if isObject(data)}
				{#each Object.entries(data) as [key, value]}
					{#if isObject(value)}
						<StateInspector data={value} label={key} />
					{:else}
						<div class="flex items-baseline gap-2 py-0.5">
							<span class="text-white/30">{key}:</span>
							<span class="text-[var(--color-brand-secondary)] font-bold">
								{typeof value === 'string' ? `"${value}"` : value}
							</span>
						</div>
					{/if}
				{/each}
			{:else}
				<div class="text-[var(--color-brand-secondary)] font-bold">{data}</div>
			{/if}
		</div>
	{/if}
</div>
