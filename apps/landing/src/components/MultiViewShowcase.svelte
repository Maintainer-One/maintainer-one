<script lang="ts">
	import MockMultiviewCard from './MockMultiviewCard.svelte';
</script>

<section class="relative z-10 py-32 px-4 bg-[var(--color-background-dark)] overflow-hidden border-y border-white/5">
	<div class="max-w-6xl mx-auto">
		<div class="text-center mb-16">
			<h2 class="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white">The <span class="text-[var(--color-brand-primary)]">Multiview</span> Experience</h2>
			<p class="text-lg text-white/40 font-medium uppercase tracking-widest">Monitor every match. Analyze every move.</p>
		</div>

		<div class="flex flex-wrap justify-center gap-8">
			<!-- CARD 1 -->
			<MockMultiviewCard 
				homeTeam={{ name: 'Amber Seekers', color: '#ffb000' }} 
				awayTeam={{ name: 'Fuchsia Soloists', color: '#d946ef' }} 
				startDelayMs={0} 
			/>
			
			<!-- CARD 2 -->
			<MockMultiviewCard 
				homeTeam={{ name: 'Beige Blockers', color: '#f5f5dc' }} 
				awayTeam={{ name: 'Emerald Pausers', color: '#10b981' }} 
				startDelayMs={18000} 
			/>

			<!-- CARD 3 -->
			<MockMultiviewCard 
				homeTeam={{ name: 'Crimson Strikers', color: '#ef4444' }} 
				awayTeam={{ name: 'Denim Drifters', color: '#3b82f6' }} 
				startDelayMs={36000} 
			/>
		</div>
	</div>
</section>
