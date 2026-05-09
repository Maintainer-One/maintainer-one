<script lang="ts">
	import AmberSeekersIcon from './logos/AmberSeekersIcon.svelte';
	import CrimsonStrikersIcon from './logos/CrimsonStrikersIcon.svelte';
	import DenimDriftersIcon from './logos/DenimDriftersIcon.svelte';
	import EmeraldPausersIcon from './logos/EmeraldPausersIcon.svelte';
	import FuchsiaSoloistsIcon from './logos/FuchsiaSoloistsIcon.svelte';
	import BeigeBlockersIcon from './logos/BeigeBlockersIcon.svelte';

	let { 
		teamName, 
		color, 
		size = 'size-12', 
		class: className = ''
	} = $props<{
		teamName: string;
		color: string;
		size?: string;
		class?: string;
	}>();

	// Map team names to their components
	const components: Record<string, any> = {
		'Amber Seekers': AmberSeekersIcon,
		'Crimson Strikers': CrimsonStrikersIcon,
		'Denim Drifters': DenimDriftersIcon,
		'Emerald Pausers': EmeraldPausersIcon,
		'Fuchsia Soloists': FuchsiaSoloistsIcon,
		'Beige Blockers': BeigeBlockersIcon
	};

	const IconComponent = $derived(components[teamName]);
</script>

{#if IconComponent}
	<IconComponent {size} {color} class={className} />
{:else}
	<div 
		class="{size} {className} flex items-center justify-center font-black"
		style="color: {color}"
	>
		{teamName.charAt(0)}
	</div>
{/if}
