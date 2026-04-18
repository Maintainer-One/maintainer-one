<script lang="ts">
	import { base } from '$app/paths';
	import { supabase } from '$lib/supabase';
	// Note: supabase client is initialized but will need ENV keys in .env
</script>

<svelte:head>
	<title>Maintainer One | The Screeps for Sports Platform</title>
</svelte:head>

<main
	data-component="landing-page"
	class="flex min-h-[90vh] flex-col items-center justify-center px-4 text-center"
>
	<div class="group relative">
		<div
			class="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#4facfe] to-[#00f2fe] opacity-25 blur transition duration-1000 group-hover:opacity-50 group-hover:duration-200"
		></div>
		<div class="relative rounded-2xl border-white/5 bg-glass px-12 py-10 shadow-2xl">
			<h1
				class="mb-4 bg-gradient-to-br from-white to-white/60 bg-clip-text text-6xl font-black tracking-tighter text-transparent"
			>
				MAINTAINER<br /><span class="text-[#00f2fe]">ONE</span>
			</h1>
			<p class="mx-auto mb-8 max-w-md text-xl text-white/60">
				Your logic is your team. The Protocol is your limit. Are you ready to win the league?
			</p>

			<div class="flex justify-center gap-4">
				<a href="{base}/film-room" class="btn-primary flex items-center"> Enter Film Room </a>
				<button
					class="rounded-lg border border-white/10 bg-white/10 px-6 py-2 font-bold transition-all hover:bg-white/20"
				>
					Docs
				</button>
			</div>
		</div>
	</div>

	<div class="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
		<div class="rounded-xl border-l-4 border-[#4facfe] bg-glass p-6 text-left">
			<h3 class="mb-2 text-lg font-bold">Protocol V1</h3>
			<p class="text-sm text-white/50">
				3v3. 10x10 Grid. Capture the Zone. The foundational test of strategy.
			</p>
		</div>
		<div class="rounded-xl border-l-4 border-[#00f2fe] bg-glass p-6 text-left">
			<h3 class="mb-2 text-lg font-bold">Deterministic Sim</h3>
			<p class="text-sm text-white/50">
				Deno-powered logic execution ensures 100% reproducibility in every replay.
			</p>
		</div>
		<div class="rounded-xl border-l-4 border-white/20 bg-glass p-6 text-left">
			<h3 class="mb-2 text-lg font-bold">Film Room</h3>
			<p class="text-sm text-white/50">
				Pause, tweak, and branch. Analyze the numbers to optimize your code.
			</p>
		</div>
	</div>
</main>

<style>
	/* Local component micro-animations if needed */
</style>
