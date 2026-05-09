<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Submit Content - Maintainer One</title>
</svelte:head>

<div class="mx-auto max-w-2xl p-6 lg:p-10">
	<header class="mb-10">
		<button 
			onclick={() => window.history.back()}
			class="group mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] active:scale-95" 
			aria-label="Go Back"
		>
			<svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
		</button>
		<h1 class="text-3xl font-black uppercase tracking-tighter text-[var(--color-brand-secondary)]">
			Submit <span class="text-[var(--color-brand-primary)]">Content</span>
		</h1>
		<p class="mt-2 text-sm text-text-secondary">Share news, videos, or analysis with the community.</p>
	</header>

	<form 
		method="POST" 
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				update();
			};
		}}
		class="flex flex-col gap-6 rounded-2xl border border-white/10 bg-black/20 p-8 shadow-2xl backdrop-blur-xl"
	>
		{#if form?.message}
			<div class="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
				{form.message}
			</div>
		{/if}

		<div class="flex flex-col gap-2">
			<label for="title" class="text-xs font-bold uppercase tracking-wider text-text-secondary">Title</label>
			<input 
				type="text" 
				id="title" 
				name="title" 
				value={form?.title ?? ''}
				required
				placeholder="Epic match breakdown..."
				class="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label for="url" class="text-xs font-bold uppercase tracking-wider text-text-secondary">URL</label>
			<input 
				type="url" 
				id="url" 
				name="url" 
				value={form?.url ?? ''}
				required
				placeholder="https://..."
				class="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label for="content_type" class="text-xs font-bold uppercase tracking-wider text-text-secondary">Type</label>
			<select 
				id="content_type" 
				name="content_type" 
				required
				class="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]"
			>
				<option value="link">General Link</option>
				<option value="video">Video / Stream</option>
				<option value="analysis">Analysis / Blog</option>
				<option value="news">League News</option>
			</select>
		</div>

		<button 
			type="submit" 
			disabled={submitting}
			class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--color-brand-primary)]/80 disabled:opacity-50"
		>
			{#if submitting}
				<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
				Submitting...
			{:else}
				Submit to Hub
			{/if}
		</button>
	</form>
</div>
