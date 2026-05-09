<script lang="ts">
	import { base } from '$app/paths';
	import TeamIcon from '$lib/components/TeamIcon.svelte';
	import { spring } from 'svelte/motion';

	let { season, winner, playerAwards, teams } = $props<{
		season: any;
		winner: any;
		playerAwards: any[];
		teams: any[];
	}>();

	function getTeam(teamId: string) {
		return teams.find((t: any) => t.id === teamId);
	}

	const topAwards = $derived(playerAwards.slice(0, 6));

	// 3D Tilt Logic
	let tiltX = spring(0, { stiffness: 0.1, damping: 0.3 });
	let tiltY = spring(0, { stiffness: 0.1, damping: 0.3 });

	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;
		
		tiltX.set((y - centerY) / 15);
		tiltY.set((centerX - x) / 15);
	}

	function handleMouseLeave() {
		tiltX.set(0);
		tiltY.set(0);
	}
</script>

<div class="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-[#fbbf24]/20 border-[#fbbf24]/30" style="--team-color: {winner?.color || 'var(--color-brand-primary)'}; --color-gold: #fbbf24;">
	<!-- Background Decorations -->
	<div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--team-color)]/20 blur-[100px]"></div>
	<div class="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#fbbf24]/10 blur-[100px]"></div>
	
	<!-- Confetti / Particle effect -->
	<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40">
		{#each Array(24) as _, i}
			<div 
				class="confetti absolute size-1.5 rounded-full"
				style="
					left: {Math.random() * 100}%;
					top: -10px;
					background-color: {i % 3 === 0 ? 'var(--color-gold)' : (i % 2 === 0 ? 'var(--team-color)' : 'white')};
					animation: confetti-fall {7 + Math.random() * 12}s linear infinite;
					animation-delay: -{Math.random() * 15}s;
				"
			></div>
		{/each}
	</div>

	<div class="relative z-10 flex flex-col gap-12">
		<!-- Hero Section -->
		<div class="flex flex-col items-center justify-between gap-8 md:flex-row">
			<div class="flex flex-col items-center gap-6 md:items-start">
				<div class="inline-flex items-center gap-3 rounded-full border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[var(--color-gold)] border shadow-[0_0_15px_rgba(251,191,36,0.1)]">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
					{season.name} Champions
				</div>

				<div class="text-center md:text-left">
					<h2 class="text-6xl font-black tracking-tighter text-white sm:text-7xl">
						<span style="color: {winner?.color}">{winner?.name || 'Undisputed'}</span>
					</h2>
					<p class="mt-4 max-w-md text-lg font-medium leading-relaxed text-white/50">
						Dominating the season with a final record of <span class="text-white">{winner?.record}</span>. 
						Their protocol proved superior for Protocol One.
					</p>
				</div>

				<div class="flex items-center gap-4">
					<div class="flex flex-col">
						<span class="text-[10px] font-black uppercase tracking-widest text-white/30">Final Rating</span>
						<span class="text-2xl font-black text-[var(--team-color)]">{winner?.rating}</span>
					</div>
					<div class="h-8 w-px bg-white/10"></div>
					<div class="flex flex-col">
						<span class="text-[10px] font-black uppercase tracking-widest text-white/30">Total Points</span>
						<span class="text-2xl font-black text-white/90">{winner?.points}</span>
					</div>
				</div>
			</div>

			<div 
				class="relative flex size-48 items-center justify-center rounded-3xl bg-white/5 p-8 shadow-inner md:size-64 perspective-1000 group/logo"
				onmousemove={handleMouseMove}
				onmouseleave={handleMouseLeave}
			>
				<!-- Multi-layered Glow -->
				<div class="absolute inset-0 animate-pulse rounded-full bg-[var(--team-color)]/10 blur-[80px]"></div>
				<div class="absolute inset-0 rounded-full bg-[var(--team-color)]/20 blur-[40px] transition-opacity duration-500 group-hover/logo:opacity-100 opacity-40"></div>
				
				<!-- Rotating Corona -->
				<div class="absolute inset-0 z-0 flex items-center justify-center opacity-10 group-hover/logo:opacity-30 transition-opacity duration-700">
					<svg class="size-full animate-[spin_30s_linear_infinite]" viewBox="0 0 100 100">
						<defs>
							<radialGradient id="corona-grad" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
								<stop offset="30%" stop-color="var(--team-color)" stop-opacity="1" />
								<stop offset="100%" stop-color="var(--team-color)" stop-opacity="0" />
							</radialGradient>
						</defs>
						{#each Array(8) as _, i}
							<path 
								d="M50 50 L49.5 5 L50.5 5 Z" 
								fill="url(#corona-grad)" 
								transform="rotate({i * 45} 50 50)"
							/>
						{/each}
					</svg>
				</div>

				<!-- The Icon with 3D Tilt -->
				<div 
					class="relative z-10 transition-all duration-200"
					style="transform: perspective(1000px) rotateX({$tiltX}deg) rotateY({$tiltY}deg) scale({$tiltX !== 0 ? 1.02 : 1});"
				>
					{#if winner}
						<div class="relative">
							<TeamIcon 
								teamName={winner.name} 
								color={winner.color} 
								size="size-32 md:size-48" 
								class="drop-shadow-[0_0_20px_var(--team-color)] filter brightness-110" 
							/>
						</div>
					{:else}
						<BrandLogo size="size-32 md:size-48" />
					{/if}
				</div>
			</div>
		</div>

		<!-- Awards Section -->
		<div class="flex flex-col gap-6">
			<div class="flex items-center justify-between border-b border-white/10 pb-4">
				<h3 class="text-xl font-black tracking-tight text-white uppercase">Bonus Points Secured</h3>
				<span class="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Season Performance Awards</span>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each topAwards as award}
					<div 
						class="group relative flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-[var(--color-gold)]/30 {award.players.length === 1 ? 'border-[var(--color-gold)]/20 bg-[var(--color-gold)]/5' : ''}"
					>
						{#if award.players.length === 1}
							<div class="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-[var(--color-gold)] text-[10px] font-black text-black shadow-lg">
								★
							</div>
						{/if}

						<div class="flex flex-col gap-1">
							<span class="text-[10px] font-black uppercase tracking-widest text-white/30">
								{award.type} {award.formattedKey}
							</span>
							<div class="flex items-baseline gap-2">
								<span class="text-2xl font-black text-white">{award.value}</span>
								<span class="text-[10px] font-bold text-white/40">Total</span>
							</div>
						</div>

						<div class="flex flex-wrap gap-2">
							{#each award.players as player}
								{@const team = getTeam(player.teamId)}
								<div class="inline-flex items-center gap-2 rounded-lg bg-black/40 px-2.5 py-1.5 border border-white/5">
									<div class="size-2 rounded-full" style="background-color: {team?.color}"></div>
									<span class="text-[10px] font-black text-white/80 uppercase tracking-tighter">
										{team?.name} <span class="text-white/40">U{player.unitIndex}</span>
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
			
			<div class="mt-4 flex justify-center">
				<a 
					href="{base}/leaderboard" 
					class="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-[var(--team-color)] transition-colors"
				>
					View Full Season Statistics
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:translate-x-1"><path d="m9 18 6-6-6-6"/></svg>
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes -global-confetti-fall {
		0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
		25% { transform: translate(20px, 200px) rotate(180deg); }
		50% { transform: translate(-20px, 400px) rotate(360deg); }
		75% { transform: translate(20px, 600px) rotate(540deg); }
		100% { transform: translate(0, 800px) rotate(720deg); opacity: 0; }
	}

	.confetti {
		z-index: 0;
	}

	.perspective-1000 {
		perspective: 1000px;
	}
</style>
