<script lang="ts">
	import { base } from '$app/paths';
	import { supabase, getActiveSeason } from '$lib/supabase';
	import { onMount, onDestroy } from 'svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
	import ReplayGrid from '$lib/components/ReplayGrid.svelte';
	import TeamIcon from '$lib/components/TeamIcon.svelte';
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

	let mounted = $state(false);
	let isSidebarOpen = $state(false);

	// Sync state to URL and vice-versa
	$effect(() => {
		if (browser && mounted) {
			const mParam = Array.from(selectedMatchIds).sort().join(',');
			const currentUrl = new URL(location.href);
			const existingParam = currentUrl.searchParams.get('m') || '';
			
			// Only update if the param has actually changed to avoid router initialization issues
			if (existingParam !== mParam) {
				if (mParam) {
					currentUrl.searchParams.set('m', mParam);
				} else {
					currentUrl.searchParams.delete('m');
				}
				replaceState(currentUrl, page.state);
			}
		}
	});

	async function fetchMatches() {
		activeSeason = await getActiveSeason();
		if (!activeSeason) return;

		const { data, error } = await supabase
			.from('matches')
			.select(`
				id, status, scheduled_time, public_seed,
				home_code_version_id, away_code_version_id, home_override_version_id, away_override_version_id,
				leagues (protocol_version, protocol_config),
				seasons (protocol_version, protocol_config),
				home_team:teams!home_team_id (id, name, color, active_version_id),
				away_team:teams!away_team_id (id, name, color, active_version_id)
			`)
			.eq('season_id', activeSeason.id)
			.in('status', ['pending', 'scheduled', 'simulated', 'simmed', 'played'])
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
				const config = (m.seasons as any)?.protocol_config ?? (m.leagues as any)?.protocol_config ?? {};
				const tickRate = config.tickRateMs || 750;
				const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
				const endTime = startTime + (leagueMaxTicks * tickRate);

				// Auto-select if:
				// 1. Match is live (now is between start and end)
				// 2. Match starts in the next 5 minutes
				if ((nowTime >= startTime && nowTime < endTime) || (startTime - nowTime <= 5 * 60 * 1000 && startTime > nowTime)) {
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
			
			// Try to sim if we don't have states OR if we are in PREVIEW mode and match has started
			const needsSim = !matchSims[match.id] || matchSims[match.id] === 'PREVIEW';
			const isSimulating = simulatingMatches.has(match.id);
			
			if (needsSim && !isSimulating) {
				simulatingMatches.add(match.id);
				try {
					// If we don't have a seed yet, try to fetch it again from the DB
					// This fixes the "Awaiting Broadcast" hang where the local data is stale
					if (!match.public_seed) {
						const { data: freshMatch } = await supabase
							.from('matches')
							.select('public_seed')
							.eq('id', match.id)
							.single();
						
						if (freshMatch?.public_seed) {
							match.public_seed = freshMatch.public_seed;
						}
					}

					const states = await runSimulation(match);
					matchSims[match.id] = states;
				} catch (e: any) {
					if (e.message?.includes("seed not revealed") || e.message?.includes("secret_seed")) {
						matchSims[match.id] = 'PREVIEW';
					} else {
						console.error("Failed to sim match", e);
					}
				} finally {
					simulatingMatches.delete(match.id);
				}
			}
		}
	}

	// Auto-upgrade PREVIEW matches once they start
	$effect(() => {
		for (const matchId of selectedMatchIds) {
			const match = availableMatches.find(m => m.id === matchId);
			if (!match) continue;
			
			const startTime = new Date(match.scheduled_time).getTime();
			if (matchSims[matchId] === 'PREVIEW' && now >= startTime && !simulatingMatches.has(matchId)) {
				// Only retry every few seconds to avoid hammering
				const lastAttempt = (match as any)._lastRetry || 0;
				if (now - lastAttempt > 5000) {
					(match as any)._lastRetry = now;
					toggleMatch(match, true);
				}
			}
		}
	});

	onMount(() => {
		// Wait for a frame to ensure SvelteKit router is ready
		requestAnimationFrame(() => {
			mounted = true;
		});
		fetchMatches();
		clockInterval = window.setInterval(() => {
			now = Date.now();
		}, 100);

		return () => clearInterval(clockInterval);
	});

	function getLiveState(matchId: string, scheduledTime: string, config: any) {
		const states = matchSims[matchId];
		const startTime = new Date(scheduledTime).getTime();
		const elapsed = now - startTime;
		const diff = Math.abs(elapsed);
		const h = Math.floor(diff / 3600000);
		const m = Math.floor((diff % 3600000) / 60000);
		const s = Math.floor((diff % 60000) / 1000);
		const countdown = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;

		if (states === 'PREVIEW' || (!states && elapsed < 0)) {
			if (elapsed >= 0) {
				return { state: null, tick: 0, status: `Awaiting Broadcast...`, isPreview: true };
			}
			return { state: null, tick: 0, status: `Starts in ${countdown}`, isPreview: true };
		}

		if (!states || states.length === 0) return null;

		if (elapsed < 0) {
			return { state: states[0], tick: 0, status: `Starts in ${countdown}` };
		}

		const tickRate = config?.tickRateMs || DEFAULT_TICK_RATE;
		const tick = Math.floor(elapsed / tickRate);
		const maxTick = (states as any[]).length - 1;

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

<style>
	.multiview-container {
		--grid-pt: 104px;
		--grid-pb: 32px;
		--grid-gap: 32px;
		/* Calculate height for exactly 2 rows based on viewport */
		--card-height: max(320px, calc((100vh - var(--grid-pt) - var(--grid-pb) - var(--grid-gap)) / 2));
	}

	.multiview-grid {
		display: grid;
		gap: var(--grid-gap);
		/* Fixed width based on height to maintain aspect ratio */
		grid-template-columns: repeat(auto-fill, calc(var(--card-height) * 0.88));
		justify-content: center;
		padding-bottom: var(--grid-pb);
	}

	.multiview-card {
		height: var(--card-height);
		aspect-ratio: 0.88 / 1;
		flex-shrink: 0;
	}

	/* Ensure the replay grid container stays square and fills space correctly */
	.game-render-area {
		min-height: 0;
		flex: 1;
	}
</style>


<div class="multiview-container flex h-screen w-full overflow-hidden bg-[var(--color-background-dark)] font-sans">
	
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
				<div class="multiview-grid w-full mx-auto">
					{#each selectedMatches as match (match.id)}
						{@const liveData = getLiveState(match.id, match.scheduled_time, match.seasons?.protocol_config ?? match.leagues?.protocol_config)}
						{@const playSpeed = match.seasons?.protocol_config?.tickRateMs ?? match.leagues?.protocol_config?.tickRateMs ?? DEFAULT_TICK_RATE}
						{@const returnUrl = encodeURIComponent(`${base}/multiview?m=${Array.from(selectedMatchIds).join(',')}`)}
						
						<a 
							href="{base}/match/{match.id}?returnTo={returnUrl}" 
							class="multiview-card group relative flex flex-col rounded-2xl border border-white/5 bg-black/40 shadow-2xl overflow-hidden transition-all hover:scale-[1.01] hover:border-[var(--color-brand-primary)]/50 hover:shadow-[0_0_40px_rgba(5,150,105,0.2)]"
							transition:fade={{duration: 200}}
						>
							<!-- Header Unit (Status + Score) -->
							<div class="w-full pt-2 flex flex-col items-center bg-black/20 gap-1 px-6 pointer-events-none z-20">
								<!-- Status Header Pill -->
								{#if liveData}
									<div class="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5 shadow-sm" in:fade>
										<div class="flex items-center gap-2">
											{#if liveData.status === 'Live'}
												<div class="flex items-center gap-1.5">
													<span class="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
													<span class="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em]">Live</span>
												</div>
												<div class="w-px h-2 bg-white/10"></div>
												<span class="text-[9px] font-black tabular-nums text-white/70 uppercase tracking-widest">Tick {liveData.tick}</span>
											{:else}
												<span class="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">{liveData.status}</span>
											{/if}
										</div>
									</div>
								{/if}

								<!-- Scoreboard Bar -->
								<div class="flex items-center gap-0.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-1 shadow-2xl">
									<!-- Home Team -->
									<div class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl" style="background-color: {match.home_team.color}11">
										<TeamIcon teamName={match.home_team.name} color={match.home_team.color} size="size-5" />
										<span class="text-sm font-black tabular-nums" style="color: {match.home_team.color}">{liveData?.state?.teams.A.score ?? 0}</span>
									</div>
									
									<div class="w-px h-6 bg-white/10 mx-0.5"></div>
									
									<!-- Away Team -->
									<div class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl" style="background-color: {match.away_team.color}11">
										<span class="text-sm font-black tabular-nums" style="color: {match.away_team.color}">{liveData?.state?.teams.B.score ?? 0}</span>
										<TeamIcon teamName={match.away_team.name} color={match.away_team.color} size="size-5" />
									</div>
								</div>
							</div>

							<!-- Game Render -->
							<div class="game-render-area w-full relative bg-black/20 flex items-center justify-center p-6 pt-2">
								<div class="w-full aspect-square flex items-center justify-center pointer-events-none max-h-full">
									{#if liveData && liveData.state}
										<ReplayGrid primaryState={liveData.state} {playSpeed} showControlMap={false} />
									{:else if liveData?.isPreview}
										<div class="flex flex-col items-center gap-8 text-center" in:fade>
											<div class="flex items-center gap-12">
												<div class="flex flex-col items-center gap-3">
													<TeamIcon teamName={match.home_team.name} color={match.home_team.color} size="size-16" />
													<div class="text-[10px] font-black uppercase tracking-widest text-white/40">{match.home_team.name}</div>
												</div>
												<div class="text-2xl font-black text-white/10 tracking-tighter italic">VS</div>
												<div class="flex flex-col items-center gap-3">
													<TeamIcon teamName={match.away_team.name} color={match.away_team.color} size="size-16" />
													<div class="text-[10px] font-black uppercase tracking-widest text-white/40">{match.away_team.name}</div>
												</div>
											</div>
											<div class="space-y-1">
												<div class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-primary)]">Match Preview</div>
												<div class="text-2xl font-black text-white tabular-nums tracking-tight">
													{liveData.status.replace('Starts in ', '')}
												</div>
											</div>
										</div>
									{:else}
										<div class="flex flex-col items-center gap-4">
											<div class="h-12 w-12 rounded-full border-4 border-white/5 border-t-[var(--color-brand-primary)] animate-spin"></div>
											<div class="text-[10px] font-black uppercase tracking-widest text-white/20">Preparing Simulation...</div>
										</div>
									{/if}
								</div>
							</div>
							
							<!-- Action Buttons (Hover only) -->
							<div class="absolute top-6 right-6 z-30 flex flex-row gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-8px] group-hover:translate-y-0 pointer-events-none">
								<!-- Remove Button -->
								<button 
									onclick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMatch(match); }}
									class="p-2 rounded-lg bg-black/60 text-white/40 hover:text-rose-400 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 transition-all shadow-lg pointer-events-auto"
									title="Remove from Multiview"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
								</button>

								<!-- Expand Indicator -->
								<div class="p-2 rounded-lg bg-[var(--color-brand-primary)] text-black shadow-lg shadow-[var(--color-brand-primary)]/20">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</main>

	<!-- Sidebar (Drawer) -->
	{#if isSidebarOpen}
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div 
			class="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
			onclick={() => isSidebarOpen = false}
			transition:fade={{duration: 200}}
		></div>
		
		<!-- Panel -->
		<aside 
			class="absolute right-0 top-0 bottom-0 w-[400px] max-w-full bg-black/90 border-l border-white/10 shadow-2xl z-[110] flex flex-col"
			transition:slide={{axis: 'x', duration: 300}}
		>
			<div class="flex items-center justify-between p-6 border-b border-white/10">
				<h2 class="text-sm font-black text-white uppercase tracking-widest">Select Games</h2>
				<button 
					onclick={() => isSidebarOpen = false}
					aria-label="Close Sidebar"
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
