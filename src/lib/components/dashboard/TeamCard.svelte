<script lang="ts">
	let {
		name = 'Azure',
		color = '#007FFF',
		record = '0-0-0',
		rating = '1000',
	} = $props<{
		name?: string;
		color?: string;
		record?: string;
		rating?: string;
	}>();

	// Derive a gradient using the primary color
	const gradientStyle = `background: linear-gradient(135deg, ${color}22 0%, transparent 100%); border-left-color: ${color};`;
</script>

<div
	class="group relative overflow-hidden rounded-xl border border-white/10 bg-glass transition-all hover:bg-white/10 hover:shadow-lg"
	style="border-left-width: 4px; {gradientStyle}"
>
	<div class="p-4">
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg font-bold shadow-sm"
					style="background-color: {color}44; border: 1px solid {color}88; color: {color}"
				>
					{name.charAt(0)}
				</div>
				<h3 class="text-lg font-bold tracking-tight text-white">{name}</h3>
			</div>
			<div class="text-right">
				<div class="text-xs text-white/50 uppercase tracking-wider">Rating</div>
				<div class="font-mono font-bold text-[var(--color-brand-primary)]">{rating}</div>
			</div>
		</div>

		<div class="flex items-center justify-between text-sm">
			<div class="text-white/60">Record: <span class="text-white font-medium">{record}</span></div>
			<button
				class="text-xs font-bold transition-all hover:translate-x-1"
				style="color: color-mix(in srgb, {color}, white 60%)"
			>
				View Profile &rarr;
			</button>
		</div>
	</div>
	
	<!-- Hover highlight effect -->
	<div 
		class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
		style="background: radial-gradient(circle at center, ${color} 0%, transparent 70%);"
	></div>
</div>
