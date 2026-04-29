<script lang="ts">
	import { base } from '$app/paths';
	import LeagueTicker from '$lib/components/dashboard/LeagueTicker.svelte';
	import StandingsBoard from '$lib/components/dashboard/StandingsBoard.svelte';
	import MatchFeed from '$lib/components/dashboard/MatchFeed.svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
</script>

<svelte:head>
	<title>Maintainer One | Command Center</title>
</svelte:head>

<!-- Global League Ticker at the very top -->
<LeagueTicker />

<main
	data-component="dashboard"
	class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8"
>
	<header class="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
		<div class="flex items-center gap-6">
			<BrandLogo size="size-16" />
			<div>
				<h1 class="text-white text-5xl font-black tracking-tighter leading-none">
					COMMAND <span class="text-[var(--color-brand-secondary)]">CENTER</span>
				</h1>
				<p class="text-white/80 font-medium mt-1">Live league dashboard and match feeds.</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<a 
				href="/film-room" 
				class="px-6 py-3 bg-[var(--color-brand-secondary)] text-[var(--color-background-dark)] font-black rounded-xl shadow-lg shadow-black/20 hover:scale-105 transition-all"
			>
				Enter Film Room
			</a>
			<button class="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
				My Team
			</button>
		</div>
	</header>

	<!-- Main Grid Layout -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		
		<!-- Left Column: Big Board / Standings (Takes 4 cols on large screens) -->
		<div class="lg:col-span-4 xl:col-span-3">
			<div class="sticky top-8">
				<StandingsBoard />
			</div>
		</div>

		<!-- Right Column: Match Feeds and Activity (Takes 8 cols) -->
		<div class="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
			
			<!-- Featured Live Action or Hero Section -->
			<div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-glass p-8 shadow-2xl">
				<div class="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#4facfe]/20 to-[#00f2fe]/20 opacity-50 blur-xl transition duration-1000 group-hover:opacity-100"></div>
				
				<div class="relative z-10 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<div class="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
							<span class="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
							MATCH OF THE WEEK
						</div>
						<h2 class="text-3xl font-black text-white">Crimson <span class="text-white/30">vs</span> Denim</h2>
						<p class="mt-1 max-w-md text-sm text-white/60">Watch as the top contenders battle for zone control in a high-stakes match.</p>
					</div>
					
					<a href="{base}/film-room" class="mt-4 flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 md:mt-0">
						Spectate Now
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
					</a>
				</div>
			</div>

			<!-- Match Feed List -->
			<MatchFeed />
		</div>
	</div>
</main>

<style>
	/* Any page-specific styles can go here */
</style>
