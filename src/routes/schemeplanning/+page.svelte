<script lang="ts">
	const favorites = [
		{ name: 'Mint', m: '#99f6e4', one: '#2dd4bf', bg: '#064e3b' },
		{ name: 'Orange', m: '#ffedd5', one: '#f97316', bg: '#431407' },
		{ name: 'Denim', m: '#dbeafe', one: '#1e40af', bg: '#1e3a8a' },
		{ name: 'Ash', m: '#3f3f46', one: '#71717a', bg: '#18181b' },
		{ name: 'Flame', m: '#fee2e2', one: '#ef4444', bg: '#450a0a' },
		{ name: 'Steel', m: '#cbd5e1', one: '#475569', bg: '#1e293b' },
		{ name: 'Ruby', m: '#ffffff', one: '#ef4444', bg: '#111827' },
		{ name: 'Inverted', m: '#00f2fe', one: '#ffffff', bg: '#0a0e17' },
		{ name: 'Stealth', m: '#1e293b', one: '#0f172a', bg: '#ffffff' },
		{ name: 'Gold', m: '#fef08a', one: '#ca8a04', bg: '#171717' },
		{ name: 'Slate', m: '#ffffff', one: '#334155', bg: '#0f172a' }
	];

	const gen2 = [
		// Mint Variations (Mint '1' = #2dd4bf)
		{ name: 'Mint / Pearl', m: '#f1f5f9', one: '#2dd4bf', bg: '#0f172a' },
		{ name: 'Mint / Slate', m: '#475569', one: '#2dd4bf', bg: '#0f172a' },
		{ name: 'Mint / Obsidian', m: '#020617', one: '#2dd4bf', bg: '#0f172a' },
		{ name: 'Mint / Cyber', m: '#4facfe', one: '#2dd4bf', bg: '#0a0e17' },
		
		// Award Tier (Maintainer One Championship)
		{ name: 'M1: Gold', m: '#fde047', one: '#a16207', bg: '#0a0a0a' },
		{ name: 'M1: Platinum', m: '#f8fafc', one: '#94a3b8', bg: '#020617' },
		{ name: 'M1: Obsidian', m: '#171717', one: '#404040', bg: '#f8fafc' },
		
		// Light Mode Concepts
		{ name: 'Stealth L', m: '#0f172a', one: '#334155', bg: '#f1f5f9' },
		{ name: 'Deep Blue L', m: '#1e40af', one: '#60a5fa', bg: '#ffffff' },
		{ name: 'Crimson L', m: '#991b1b', one: '#f87171', bg: '#fef2f2' },
		
		// Remixes
		{ name: 'Ash / Cobalt', m: '#3f3f46', one: '#3b82f6', bg: '#0a0a0a' },
		{ name: 'Flame / Ice', m: '#ef4444', one: '#bae6fd', bg: '#0a0e17' },
		{ name: 'Steel / Neon', m: '#475569', one: '#bef264', bg: '#0a0a0a' },
		{ name: 'Orange / Teal', m: '#f97316', one: '#14b8a6', bg: '#0f172a' },
		
		// New Perspectives
		{ name: 'Eucalyptus', m: '#d1fae5', one: '#059669', bg: '#064e3b' },
		{ name: 'Amethyst', m: '#f3e8ff', one: '#9333ea', bg: '#2e1065' },
		{ name: 'Desert', m: '#fef3c7', one: '#d97706', bg: '#451a03' },
		{ name: 'Forest', m: '#ecfdf5', one: '#10b981', bg: '#064e3b' },
		{ name: 'Midnight', m: '#1e293b', one: '#6366f1', bg: '#020617' },
		{ name: 'Coffee', m: '#fafaf9', one: '#78350f', bg: '#292524' },
		{ name: 'Titanium', m: '#e2e8f0', one: '#475569', bg: '#0f172a' },
		{ name: 'Electric', m: '#ffffff', one: '#8b5cf6', bg: '#0a0e17' },
		{ name: 'Bubblegum', m: '#fdf2f8', one: '#ec4899', bg: '#500724' },
		{ name: 'Radioactive', m: '#f7fee7', one: '#84cc16', bg: '#14532d' }
	];

	let selectedScheme = $state(favorites[0]);

	const mPath = "m111.07 64.621c-4.2329 12.749-8.4384 25.509-12.653 38.265l-12.722-38.096-33.669 0.2558 0.12402 75.794 24.38-5e-3 -0.04031-32.218 10.146 32.215 23.215-0.0228 10.189-32.241c0.055 5.5194 0.0683 20.936 0.0683 20.936 0.0565 5.7664 6.2559 10.984 12.628 11.314 0 0 7.7967-0.0666 11.672-0.0105-0.0196-21.584 0.1048-43.169 0.0603-64.753-1.7236-9.6476-10.397-11.477-14.926-11.485z";
	const onePath = "m110.99 64.677-7.5302 22.763 16.62 0.12247-0.13653 40.34c-0.55064 7.3287 6.4915 12.809 13.511 12.865 3.6589-0.0475 7.3506-0.0104 11.011-7.8e-4l0.14829-63.703c-0.30417-7.3083-6.6924-12.175-13.995-12.446z";
</script>

<svelte:head>
	<title>Brand Lab | Scheme Planning</title>
</svelte:head>

<main class="min-h-screen bg-[#0a0e17] p-4 text-white font-sans">
	<header class="mb-8">
		<h1 class="text-2xl font-black tracking-tighter">BRAND <span class="text-[#00f2fe]">LAB</span></h1>
		<p class="text-xs text-white/50 uppercase tracking-widest">Gen 2 • Evolution & Feedback</p>
	</header>

	<!-- Favorites Section -->
	<section class="mb-12">
		<h2 class="text-xs font-bold text-[#00f2fe] uppercase tracking-[0.3em] mb-4">Your Favorites</h2>
		<div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
			{#each favorites as scheme}
				<button 
					onclick={() => selectedScheme = scheme}
					class="group flex flex-col gap-1 rounded-lg border transition-all p-2 text-left {selectedScheme.name === scheme.name ? 'border-[#00f2fe] bg-white/10 ring-1 ring-[#00f2fe]' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'}"
				>
					<div class="flex aspect-square items-center justify-center rounded bg-black/60">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135.47 135.47" class="w-10 drop-shadow-lg">
							<g transform="matrix(1.2904 0 0 1.5832 -60.258 -95.036)">
								<path d={mPath} fill={scheme.m} />
								<path d={onePath} fill={scheme.one} />
							</g>
						</svg>
					</div>
					<div class="flex flex-col">
						<span class="text-[9px] font-bold truncate {selectedScheme.name === scheme.name ? 'text-[#00f2fe]' : 'opacity-50 group-hover:opacity-100'} transition-opacity">{scheme.name}</span>
						<div class="mt-1 flex h-1 w-full overflow-hidden rounded-full bg-white/10">
							<div class="h-full w-1/2" style="background: {scheme.m}"></div>
							<div class="h-full w-1/2" style="background: {scheme.one}"></div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<!-- Gen 2 Section -->
	<section class="mb-12">
		<h2 class="text-xs font-bold text-white/30 uppercase tracking-[0.3em] mb-4">Generation 2 (Based on Feedback)</h2>
		<div class="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-3">
			{#each gen2 as scheme}
				<button 
					onclick={() => selectedScheme = scheme}
					class="group flex flex-col gap-1 rounded-lg border transition-all p-2 text-left {selectedScheme.name === scheme.name ? 'border-[#00f2fe] bg-white/10 ring-1 ring-[#00f2fe]' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'}"
				>
					<div class="flex aspect-square items-center justify-center rounded bg-black/60">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135.47 135.47" class="w-10 drop-shadow-lg">
							<g transform="matrix(1.2904 0 0 1.5832 -60.258 -95.036)">
								<path d={mPath} fill={scheme.m} />
								<path d={onePath} fill={scheme.one} />
							</g>
						</svg>
					</div>
					<div class="flex flex-col">
						<span class="text-[9px] font-bold truncate {selectedScheme.name === scheme.name ? 'text-[#00f2fe]' : 'opacity-50 group-hover:opacity-100'} transition-opacity">{scheme.name}</span>
						<div class="mt-1 flex h-1 w-full overflow-hidden rounded-full bg-white/10">
							<div class="h-full w-1/2" style="background: {scheme.m}"></div>
							<div class="h-full w-1/2" style="background: {scheme.one}"></div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<section class="mt-20 max-w-5xl">
		<div class="flex items-center justify-between border-b border-white/10 pb-2 mb-8">
			<h2 class="text-2xl font-black">REAL WORLD CONTEXT</h2>
			<div class="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40">
				Viewing: <span class="text-[#00f2fe]">{selectedScheme.name}</span>
			</div>
		</div>

		<div class="flex flex-col gap-8 transition-all duration-500 rounded-3xl p-8 -mx-8" style="background-color: {selectedScheme.bg}">
			<!-- Header Mockup -->
			<div class="rounded-2xl border border-white/10 bg-black/20 p-8 shadow-2xl backdrop-blur-sm">
				<p class="text-[10px] font-bold text-white/20 mb-6 uppercase tracking-[0.2em]">Dashboard Header Reference</p>
				<div class="flex items-center gap-4">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135.47 135.47" class="w-12 h-12 flex-shrink-0">
						<g transform="matrix(1.2904 0 0 1.5832 -60.258 -95.036)">
							<path d={mPath} fill={selectedScheme.m} />
							<path d={onePath} fill={selectedScheme.one} />
						</g>
					</svg>
					<div>
						<h1 class="text-4xl font-black tracking-tighter leading-none" style="color: {selectedScheme.m}">
							COMMAND <span style="color: {selectedScheme.one}">CENTER</span>
						</h1>
						<p class="text-sm text-white/60 mt-1">Live league dashboard and match feeds.</p>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<!-- Ticker Mockup -->
				<div class="rounded-xl border border-white/10 bg-black/40 p-6">
					<p class="text-[10px] font-bold text-white/20 mb-4 uppercase tracking-widest">Global Ticker</p>
					<div class="flex items-center gap-8 text-xs text-white/70 font-medium overflow-hidden">
						<div class="flex items-center gap-2 flex-shrink-0">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135.47 135.47" class="w-3 h-3">
								<g transform="matrix(1.2904 0 0 1.5832 -60.258 -95.036)">
									<path d={mPath} fill={selectedScheme.m} />
									<path d={onePath} fill={selectedScheme.one} />
								</g>
							</svg>
							Crimson 2 - 1 Denim
						</div>
						<div class="flex items-center gap-2 flex-shrink-0">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135.47 135.47" class="w-3 h-3">
								<g transform="matrix(1.2904 0 0 1.5832 -60.258 -95.036)">
									<path d={mPath} fill={selectedScheme.m} />
									<path d={onePath} fill={selectedScheme.one} />
								</g>
							</svg>
							Season Live
						</div>
					</div>
				</div>

				<!-- Sidebar/Nav Mockup -->
				<div class="rounded-xl border border-white/10 bg-black/40 p-6">
					<p class="text-[10px] font-bold text-white/20 mb-4 uppercase tracking-widest">Navigation Item</p>
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/10">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135.47 135.47" class="w-5 h-5">
								<g transform="matrix(1.2904 0 0 1.5832 -60.258 -95.036)">
									<path d={mPath} fill={selectedScheme.m} />
									<path d={onePath} fill={selectedScheme.one} />
								</g>
							</svg>
							<span class="text-sm font-bold">Project Overview</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>
