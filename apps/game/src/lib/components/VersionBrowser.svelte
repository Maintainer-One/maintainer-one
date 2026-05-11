<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { scratchpad } from '$lib/stores/scratchpad';

	let { 
		teamId, 
		teamName, 
		teamColor,
		versions = [], 
		drafts = [], 
		activeDraftId, 
		matchVersionId, 
		officialVersionId,
		onLoadVersion, 
		onSelectDraft, 
		onDeleteDraft,
		onClose 
	} = $props();

	let activeSection = $state<'history' | 'drafts'>('history');
</script>

<div 
	class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
	transition:fade={{ duration: 200 }}
>
	<!-- Backdrop -->
	<div 
		class="absolute inset-0 bg-black/80 backdrop-blur-sm" 
		onclick={onClose}
		role="presentation"
	></div>

	<!-- Modal Content -->
	<div 
		class="relative flex h-full max-h-[800px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
		transition:scale={{ duration: 300, start: 0.95, opacity: 0 }}
	>
		<!-- Header -->
		<header class="flex items-center justify-between border-b border-white/5 p-6 md:px-8">
			<div class="flex items-center gap-4">
				<div 
					class="h-10 w-10 rounded-xl border border-white/10 flex items-center justify-center"
					style="background: {teamColor}20; color: {teamColor}"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-2"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
				</div>
				<div>
					<h2 class="text-xl font-black uppercase tracking-tight text-white">{teamName} <span class="text-white/30">Library</span></h2>
					<p class="text-[10px] font-bold uppercase tracking-widest text-white/20">Manage versions and local drafts</p>
				</div>
			</div>
			<button 
				onclick={onClose}
				class="rounded-xl border border-white/5 bg-white/5 p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			</button>
		</header>

		<!-- Navigation -->
		<nav class="flex gap-8 border-b border-white/5 px-8">
			<button 
				onclick={() => activeSection = 'history'}
				class="relative pb-4 pt-6 text-[10px] font-black uppercase tracking-[0.2em] transition-colors {activeSection === 'history' ? 'text-white' : 'text-white/20 hover:text-white/40'}"
			>
				Published History
				{#if activeSection === 'history'}
					<div class="absolute bottom-0 left-0 h-0.5 w-full bg-white" in:fade></div>
				{/if}
			</button>
			<button 
				onclick={() => activeSection = 'drafts'}
				class="relative pb-4 pt-6 text-[10px] font-black uppercase tracking-[0.2em] transition-colors {activeSection === 'drafts' ? 'text-white' : 'text-white/20 hover:text-white/40'}"
			>
				Local Drafts ({drafts.length})
				{#if activeSection === 'drafts'}
					<div class="absolute bottom-0 left-0 h-0.5 w-full bg-white" in:fade></div>
				{/if}
			</button>
		</nav>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
			{#if activeSection === 'history'}
				<div class="grid gap-4 md:grid-cols-2">
					{#each versions as v}
						<div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10 hover:bg-white/[0.04]">
							<div class="mb-4 flex items-start justify-between">
								<div>
									<div class="mb-1 flex items-center gap-2">
										<span class="text-lg font-black text-white">V{v.version_number}</span>
										{#if v.id === matchVersionId}
											<span class="rounded-full bg-blue-500/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20">Match</span>
										{/if}
										{#if v.id === officialVersionId}
											<span class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">Official</span>
										{/if}
									</div>
									<p class="text-[10px] font-bold text-white/30">{new Date(v.created_at).toLocaleString()}</p>
								</div>
							</div>
							
							{#if v.name}
								<p class="mb-6 text-xs text-white/60 line-clamp-2 italic">"{v.name}"</p>
							{/if}

							<button 
								onclick={() => onLoadVersion(v)}
								class="w-full rounded-xl bg-white/5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all hover:bg-white/10 hover:text-white"
							>
								Load into Editor
							</button>
						</div>
					{:else}
						<div class="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/5 text-white/20">
							<p class="text-sm font-medium">No published versions yet.</p>
						</div>
					{/each}
				</div>
			{:else}
				<div class="grid gap-4 md:grid-cols-2">
					{#each drafts as d}
						<div class="group relative overflow-hidden rounded-2xl border {activeDraftId === d.id ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'} p-5 transition-all hover:border-white/10 hover:bg-white/[0.04]">
							<div class="mb-4 flex items-start justify-between">
								<div class="flex-1 min-w-0">
									<h3 class="truncate text-sm font-bold text-white">{d.name}</h3>
									<p class="text-[10px] font-bold text-white/20 uppercase tracking-widest">Local Scratchpad</p>
								</div>
								{#if activeDraftId === d.id}
									<div class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
								{/if}
							</div>

							<div class="flex gap-2">
								<button 
									onclick={() => onSelectDraft(d.id)}
									class="flex-1 rounded-xl {activeDraftId === d.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/70'} py-2.5 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/10 hover:text-white"
								>
									{activeDraftId === d.id ? 'Active' : 'Select'}
								</button>
								<button 
									onclick={() => onDeleteDraft(d.id)}
									class="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500/20"
									aria-label="Delete Draft"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
								</button>
							</div>
						</div>
					{:else}
						<div class="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/5 text-white/20">
							<p class="text-sm font-medium">No local drafts found.</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<footer class="border-t border-white/5 p-6 bg-black/40">
			<div class="flex items-center justify-between text-[10px] text-white/20 font-medium">
				<p>Published versions are stored on the server. Drafts are stored in your browser's local storage.</p>
				<button 
					onclick={() => {
						const name = `Draft ${new Date().toLocaleDateString()}`;
						const id = scratchpad.addScratchpad(teamId, name, '');
						onSelectDraft(id);
						activeSection = 'drafts';
					}}
					class="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
					NEW DRAFT
				</button>
			</div>
		</footer>
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
