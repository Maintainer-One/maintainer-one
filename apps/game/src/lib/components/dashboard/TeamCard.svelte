<script lang="ts">
	import { base } from '$app/paths';

	let {
		id,
		name = 'Azure',
		color = '#007FFF',
		record = '0-0-0',
		rating = '1000',
		points = 0,
		statPoints = 0,
		statAwards = [],
		logo_url = null,
		logo_icon_url = null,
	} = $props<{
		id: string;
		name?: string;
		color?: string;
		record?: string;
		rating?: string;
		points?: number;
		statPoints?: number;
		statAwards?: string[];
		logo_url?: string | null;
		logo_icon_url?: string | null;
	}>();

	// Derive a gradient using the primary color
	let gradientStyle = $derived(`background: linear-gradient(135deg, ${color}22 0%, transparent 100%); border-left-color: ${color};`);
</script>

<a
	href="{base}/team/{id}"
	class="group relative block rounded-xl border border-white/10 bg-glass transition-all hover:bg-white/10 hover:shadow-lg"
	style="border-left-width: 4px; {gradientStyle}"
>
	<div class="p-4">
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg font-bold shadow-sm overflow-hidden"
					style="background-color: {color}44; border: 1px solid {color}88; color: {color}"
				>
					{#if logo_icon_url}
						<img src={logo_icon_url} alt={name} class="h-full w-full object-cover" />
					{:else if logo_url}
						<img src={logo_url} alt={name} class="h-full w-full object-cover" />
					{:else}
						{name.charAt(0)}
					{/if}
				</div>
				<h3 class="text-lg font-bold tracking-tight text-white">{name}</h3>
			</div>
			<div class="text-right">
				<div class="mb-2">
					<div class="text-[9px] text-white/30 uppercase font-black tracking-[0.2em] mb-0.5">Points</div>
					<div class="font-mono text-xl font-black text-[var(--color-brand-primary)] leading-none flex items-center justify-end gap-1">
						<span>{points - statPoints}</span>
						<span class="text-xs text-[var(--color-brand-primary)]/50">+</span>
						<div class="group/tooltip relative flex items-center">
							<span class="text-[var(--color-brand-primary)]/80 cursor-help border-b border-dashed border-[var(--color-brand-primary)]/30 leading-none">
								{statPoints}
							</span>
							{#if statAwards.length > 0}
								<div class="pointer-events-none absolute bottom-full right-0 mb-2 w-max max-w-xs opacity-0 transition-opacity duration-75 group-hover/tooltip:opacity-100 z-50 bg-[#111] border border-white/10 rounded-lg p-2.5 shadow-2xl text-left text-xs font-bold text-white/90 whitespace-pre leading-relaxed tracking-wide font-sans">
									{statAwards.join('\n')}
								</div>
							{/if}
						</div>
					</div>
				</div>
				<div>
					<div class="text-[9px] text-white/30 uppercase font-black tracking-[0.2em] mb-0.5">Rating</div>
					<div class="font-mono text-sm font-black text-white/60 leading-none">{rating}</div>
				</div>
			</div>
		</div>

		<div class="flex items-center justify-between text-sm">
			<div class="text-xs font-bold text-[var(--color-brand-secondary)]/40 uppercase tracking-widest">Record: <span class="text-white ml-1">{record}</span></div>
			<div
				class="text-[10px] font-black uppercase tracking-widest transition-all group-hover:translate-x-1"
				style="color: {color}"
			>
				View Profile &rarr;
			</div>
		</div>
	</div>
	
	<!-- Hover highlight effect -->
	<div 
		class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none rounded-xl overflow-hidden"
		style="background: radial-gradient(circle at center, {color} 0%, transparent 70%);"
	></div>
</a>
