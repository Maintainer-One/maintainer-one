<script lang="ts">
	import { base } from '$app/paths';
	import { supabase, getActiveSeason } from '$lib/supabase';
	import { onMount, onDestroy } from 'svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
	import ReplayGrid from '$lib/components/ReplayGrid.svelte';
	import { runSimulation } from '$lib/simulation';
	import { fade, slide } from 'svelte/transition';

	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';

	let activeSeason: any = $state(null);
	let availableMatches = $state<any[]>([]);
	let selectedMatchIds = $state<Set<string>>(new Set());
	let matchSims = $state<Record<string, any[]>>({});
	let simulatingMatches = $state<Set<string>>(new Set());

	let now = $state(Date.now());
	let clockInterval: number;

	const DEFAULT_TICK_RATE = 750;
	const MATCH_TICKS = 1000;

	// UI State
	let isSidebarOpen = $state(false);

	// Sync state to URL and vice-versa
	$effect(() => {
		if (browser) {
			const mParam = Array.from(selectedMatchIds).join(',');
			const currentUrl = new URL(location.href);
			if (mParam) {
				currentUrl.searchParams.set('m', mParam);
			} else {
				currentUrl.searchParams.delete('m');
			}
			replaceState(currentUrl, page.state);
		}
	});

	async function fetchMatches() {
		activeSeason = await getActiveSeason();
		if (!activeSeason) return;

		const { data, error } = await supabase
			.from('matches')
			.select(`
				id, status, scheduled_time, seed,
				home_code_version_id, away_code_version_id, home_override_version_id, away_override_version_id,
				leagues (protocol_version, protocol_config),
				seasons (protocol_version, protocol_config),
				home_team:teams!home_team_id (id, name, color, active_version_id),
				away_team:teams!away_team_id (id, name, color, active_version_id)
			`)
			.eq('season_id', activeSeason.id)
			.in('status', ['pending', 'scheduled'])
			.order('scheduled_time', { ascending: true });

		if (error) {
			console.error('Error fetching matches:', error);
			return;
		}

		availableMatches = data || [];
		
		// If URL has matches, load their sims
		const mParam = page.url.searchParams.get('m');
		if (mParam) {
			const ids = mParam.split(',').filter(Boolean);
			selectedMatchIds = new Set(ids);
			for (const m of availableMatches) {
				if (selectedMatchIds.has(m.id)) {
					// Make sure we trigger load
					toggleMatch(m, true);
				}
			}
		} else {
			const nowTime = Date.now();
			for (const m of availableMatches) {
				const startTime = new Date(m.scheduled_time).getTime();
				if (startTime - nowTime <= 5 * 60 * 1000) {
					toggleMatch(m, true);
				}
			}
		}
	}

	async function toggleMatch(match: any, forceAdd = false) {
		const newSet = new Set(selectedMatchIds);
		if (!forceAdd && newSet.has(match.id)) {
			newSet.delete(match.id);
			selectedMatchIds = newSet;
		} else {
			newSet.add(match.id);
			selectedMatchIds = newSet;
			if (!matchSims[match.id] && !simulatingMatches.has(match.id)) {
				simulatingMatches.add(match.id);
				try {
					const states = await runSimulation(match);
					matchSims[match.id] = states;
				} catch (e) {
					console.error("Failed to sim match", e);
				} finally {
					simulatingMatches.delete(match.id);
				}
			}
		}
	}

	onMount(() => {
		fetchMatches();
		clockInterval = window.setInterval(() => {
			now = Date.now();
		}, 100);

		return () => clearInterval(clockInterval);
	});

	function getLiveState(matchId: string, scheduledTime: string, config: any) {
		const states = matchSims[matchId];
		if (!states || states.length === 0) return null;

		const tickRate = config?.tickRateMs || DEFAULT_TICK_RATE;
		const startTime = new Date(scheduledTime).getTime();
		const elapsed = now - startTime;

		if (elapsed < 0) {
			// Match hasn't started yet
			const diff = Math.abs(elapsed);
			const h = Math.floor(diff / 3600000);
			const m = Math.floor((diff % 3600000) / 60000);
			const s = Math.floor((diff % 60000) / 1000);
			const status = h > 0 ? `Starts in ${h}h ${m}m ${s}s` : `Starts in ${m}m ${s}s`;
			return { state: states[0], tick: 0, status };
		}

		const tick = Math.floor(elapsed / tickRate);
		const maxTick = states.length - 1;

		if (tick >= maxTick) {
			return { state: states[maxTick], tick: maxTick, status: 'Final' };
		}

		return { state: states[tick], tick, status: 'Live' };
	}

	let selectedMatches = $derived(availableMatches.filter(m => selectedMatchIds.has(m.id)));
</script>

<svelte:head>
	<title>Maintainer One | Multiview</title>
</svelte:head>

<div class="flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] font-sans">
	
	<!-- Main Area -->
	<main class="flex-1 flex flex-col relative h-full">
		<!-- Header -->
		<header class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 pointer-events-none">
			<div class="flex items-center gap-4 pointer-events-auto">
				<a 
					href="{base}/"
					class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/40 text-white/40 backdrop-blur-xl transition-all hover:border-[var(--color-brand-primary)]/30 hover:text-[var(--color-brand-primary)] shadow-lg"
					aria-label="Back to Dashboard"
				>
					<svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
				</a>
				<div class="flex items-center gap-3 px-5 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/5 shadow-xl">
					<BrandLogo size="size-6" />
					<h1 class="text-white text-lg font-black tracking-tighter uppercase flex gap-2">
						Live <span class="text-[var(--color-brand-primary)] drop-shadow-[0_0_10px_rgba(5,150,105,0.5)]">Multiview</span>
					</h1>
				</div>
			</div>

			<div class="pointer-events-auto">
				<button 
					onclick={() => isSidebarOpen = !isSidebarOpen}
					class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)] text-xs font-black uppercase tracking-widest hover:bg-[var(--color-brand-primary)]/20 transition-all shadow-lg backdrop-blur-xl"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
					Manage Games ({selectedMatchIds.size})
				</button>
			</div>
		</header>

		<!-- Grid -->
		<div class="flex-1 p-6 pt-24 overflow-y-auto overflow-x-hidden relative">
			{#if selectedMatches.length === 0}
				<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
					<BrandLogo size="size-24" class="opacity-10 grayscale mb-6" />
					<h2 class="text-2xl font-black text-white/20 uppercase tracking-widest">No Games Selected</h2>
					<p class="text-sm text-white/10 font-bold mt-2">Open the menu to add games to your view</p>
					<button 
						onclick={() => isSidebarOpen = true}
						class="mt-8 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all pointer-events-auto"
					>
						Browse Matches
					</button>
				</div>
			{:else}
				<div 
					class="grid gap-6 auto-rows-fr max-w-screen-2xl mx-auto h-full"
					style="grid-template-columns: repeat(auto-fit, minmax({selectedMatches.length <= 4 ? '400px' : '300px'}, 1fr));"
				>
					{#each selectedMatches as match (match.id)}
						{@const liveData = getLiveState(match.id, match.scheduled_time, match.seasons?.protocol_config ?? match.leagues?.protocol_config)}
						{@const playSpeed = match.seasons?.protocol_config?.tickRateMs ?? match.leagues?.protocol_config?.tickRateMs ?? DEFAULT_TICK_RATE}
						{@const returnUrl = encodeURIComponent(`${base}/multiview?m=${Array.from(selectedMatchIds).join(',')}`)}
						
						<a 
							href="{base}/match/{match.id}?returnTo={returnUrl}" 
							class="group relative flex flex-col rounded-3xl border border-white/5 bg-black/40 shadow-2xl overflow-hidden transition-all hover:scale-[1.02] hover:border-[var(--color-brand-primary)]/30 hover:shadow-[0_0_30px_rgba(5,150,105,0.15)]"
							transition:fade={{duration: 200}}
						>
							<!-- Match Info Header -->
							<div class="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
								<div class="flex items-center gap-3">
									<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
										<span class="text-sm font-black" style="color: {match.home_team.color}">{liveData?.state?.teams.A.score ?? 0}</span>
										<span class="text-white/20 text-[10px]">-</span>
										<span class="text-sm font-black" style="color: {match.away_team.color}">{liveData?.state?.teams.B.score ?? 0}</span>
									</div>
								</div>
								
								<div class="flex flex-col items-end gap-1">
									<div class="flex gap-2">
										<div class="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black tracking-widest" style="color: {match.home_team.color}">{match.home_team.name}</div>
										<div class="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black tracking-widest" style="color: {match.away_team.color}">{match.away_team.name}</div>
									</div>
									{#if liveData}
										{#if liveData.status === 'Live'}
											<div class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
												<span class="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
												Tick {liveData.tick}
											</div>
										{:else}
											<div class="px-2 py-1 rounded-md bg-white/10 text-white/40 border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
												{liveData.status}
											</div>
										{/if}
									{:else}
										<div class="px-2 py-1 rounded-md bg-white/10 text-white/40 border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md animate-pulse">
											Loading...
										</div>
									{/if}
								</div>
							</div>

							<!-- Game Render -->
							<div class="flex-1 relative bg-black/20 flex items-center justify-center p-4">
								{#if liveData && liveData.state}
									<div class="w-full aspect-square pointer-events-none max-h-full">
										<ReplayGrid state={liveData.state} {playSpeed} showControlMap={false} />
									</div>
								{/if}
							</div>
							
							<!-- Hover Overlay -->
							<div class="absolute inset-0 bg-[var(--color-brand-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20 backdrop-blur-[1px]">
								<div class="px-6 py-3 rounded-xl bg-[var(--color-brand-primary)] text-black font-black uppercase tracking-widest text-xs shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
									Enter Match
								</div>
							</div>
							
							<!-- Remove Button (appears on hover) -->
							<button 
								onclick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMatch(match); }}
								class="absolute bottom-4 right-4 z-30 p-2 rounded-xl bg-black/60 text-white/40 hover:text-rose-400 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
								title="Remove from Multiview"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
							</button>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</main>

	<!-- Sidebar (Drawer) -->
	{#if isSidebarOpen}
		<!-- Backdrop -->
		<div 
			class="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
			onclick={() => isSidebarOpen = false}
			transition:fade={{duration: 200}}
		></div>
		
		<!-- Panel -->
		<aside 
			class="absolute right-0 top-0 bottom-0 w-[400px] max-w-full bg-black/90 border-l border-white/10 shadow-2xl z-50 flex flex-col"
			transition:slide={{axis: 'x', duration: 300}}
		>
			<div class="flex items-center justify-between p-6 border-b border-white/10">
				<h2 class="text-sm font-black text-white uppercase tracking-widest">Select Games</h2>
				<button 
					onclick={() => isSidebarOpen = false}
					class="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
				</button>
			</div>
			
			<div class="flex-1 overflow-y-auto p-4 space-y-2">
				{#each availableMatches as match}
					<button 
						onclick={() => toggleMatch(match)}
						class="w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group
							{selectedMatchIds.has(match.id) 
								? 'bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)]/30' 
								: 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'}"
					>
						<div class="flex flex-col gap-1">
							<div class="flex items-center gap-2">
								<span class="text-xs font-black" style="color: {match.home_team.color}">{match.home_team.name}</span>
								<span class="text-white/20 text-[10px] uppercase">vs</span>
								<span class="text-xs font-black" style="color: {match.away_team.color}">{match.away_team.name}</span>
							</div>
							<div class="text-[9px] font-bold uppercase tracking-wider text-white/40">
								{new Date(match.scheduled_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
							</div>
						</div>
						
						<div class="flex items-center justify-center w-6 h-6 rounded-md border {selectedMatchIds.has(match.id) ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' : 'border-white/20 group-hover:border-white/40'} transition-colors">
							{#if selectedMatchIds.has(match.id)}
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
							{/if}
						</div>
					</button>
				{/each}
			</div>
			
			{#if availableMatches.length === 0}
				<div class="flex-1 flex items-center justify-center text-white/30 text-xs font-bold uppercase tracking-widest p-6 text-center">
					No matches available in the active season.
				</div>
			{/if}
		</aside>
	{/if}
</div>
