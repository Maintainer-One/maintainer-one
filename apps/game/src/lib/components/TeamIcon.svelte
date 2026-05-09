<script lang="ts">
	import AmberSeekersIcon from './logos/AmberSeekersIcon.svelte';

	let { 
		teamName, 
		color, 
		size = 'size-12', 
		logoUrl = null, 
		logoIconUrl = null,
		class: className = ''
	} = $props<{
		teamName: string;
		color: string;
		size?: string;
		logoUrl?: string | null;
		logoIconUrl?: string | null;
		class?: string;
	}>();

	// Map team names to their components
	const components: Record<string, any> = {
		'Amber Seekers': AmberSeekersIcon
	};

	const IconComponent = $derived(components[teamName]);
</script>

{#if IconComponent}
	<IconComponent {size} {color} class={className} />
{:else if logoIconUrl || logoUrl}
	<img 
		src={logoIconUrl || logoUrl} 
		alt={teamName} 
		class="{size} {className} object-contain" 
	/>
{:else}
	<div 
		class="{size} {className} flex items-center justify-center font-black"
		style="color: {color}"
	>
		{teamName.charAt(0)}
	</div>
{/if}
