<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getActiveSeason } from '$lib/supabase';
	import BrandLoading from '$lib/components/BrandLoading.svelte';
	import { fade, fly } from 'svelte/transition';
	import TeamIcon from '$lib/components/TeamIcon.svelte';
	import { modal } from '$lib/stores/modal';

	let { data } = $props();
	let { supabase } = $derived(data);



	let teamId = $derived(page.params.id);
	let teamData = $state<any>(null);
	let versions = $state<any[]>([]);
	let upcomingMatches = $state<any[]>([]);
	let isLoading = $state(true);
	let isSaving = $state(false);

	let editingVersionId = $state<string | null>(null);
	let editingName = $state('');

	let teamMaintainers = $state<any[]>([]);
	let newTeamMaintainer = $state('');

	let dataLoaded = false;
	$effect(() => {
		if (teamId && !dataLoaded) {
			dataLoaded = true;
			loadDashboardData();
		}
	});

	async function loadDashboardData() {
		isLoading = true;
		
		// 1. Fetch team details
		const { data: team, error: teamError } = await supabase
			.from('teams')
			.select('*')
			.eq('id', teamId)
			.single();

		if (teamError || !team) {
			console.error('Error fetching team:', teamError);
			isLoading = false;
			return;
		}
		teamData = team;

		// 2. Fetch versions
		const { data: vData, error: vError } = await supabase
			.from('team_code_versions')
			.select('*')
			.eq('team_id', teamId)
			.order('version_number', { ascending: false });
		
		if (!vError) versions = vData || [];

		// 3. Fetch upcoming matches
		const activeSeason = await getActiveSeason();
		if (activeSeason) {
			const { data: mData } = await supabase
				.from('matches')
				.select(`
					id, scheduled_time, home_team_id, away_team_id,
					home_override_version_id, away_override_version_id,
					home_team:home_team_id (name, color),
					away_team:away_team_id (name, color)
				`)
				.eq('season_id', activeSeason.id)
				.eq('status', 'pending')
				.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
				.order('scheduled_time', { ascending: true });
			
			upcomingMatches = mData || [];
		}

		await loadTeamMaintainers();
		isLoading = false;
	}

	async function loadTeamMaintainers() {
		const { data, error } = await supabase
			.from('user_roles')
			.select('id, role, team_id, user:profiles(username, avatar_url)')
			.eq('team_id', teamId)
			.eq('role', 'team_maintainer');
		
		if (!error && data) {
			teamMaintainers = data;
		}
	}

	async function grantTeamRole(username: string) {
		if (!username) return;
		isSaving = true;
		const { error } = await supabase.rpc('grant_role', {
			target_username: username,
			granted_role: 'team_maintainer',
			target_league_id: teamData.league_id,
			target_team_id: teamId
		});
		
		if (!error) {
			newTeamMaintainer = '';
			await loadTeamMaintainers();
		} else {
			modal.alert('Error', error.message);
		}
		isSaving = false;
	}

	async function revokeRole(roleId: string) {
		modal.confirm('Remove Maintainer', 'Are you sure you want to remove this maintainer?', async () => {
			isSaving = true;
			const { error } = await supabase.rpc('revoke_role', { role_to_revoke_id: roleId });
			if (!error) {
				await loadTeamMaintainers();
			} else {
				modal.alert('Error', error.message);
			}
			isSaving = false;
		});
	}

	async function updateActiveVersion(versionId: string) {
		isSaving = true;
		const { error } = await supabase
			.from('teams')
			.update({ active_version_id: versionId })
			.eq('id', teamId);
		
		if (!error) teamData.active_version_id = versionId;
		isSaving = false;
	}

	async function startEditing(v: any) {
		editingVersionId = v.id;
		editingName = v.name || `Version ${v.version_number}`;
	}

	async function saveVersionName() {
		if (!editingVersionId) return;
		isSaving = true;
		const { error } = await supabase
			.from('team_code_versions')
			.update({ name: editingName })
			.eq('id', editingVersionId);
		
		if (!error) {
			const v = versions.find(v => v.id === editingVersionId);
			if (v) v.name = editingName;
			editingVersionId = null;
		}
		isSaving = false;
	}

	async function updateMatchOverride(matchId: string, versionId: string | null, isHome: boolean) {
		isSaving = true;
		const updateData: any = {};
		if (isHome) updateData.home_override_version_id = versionId || null;
		else updateData.away_override_version_id = versionId || null;

		const { error } = await supabase
			.from('matches')
			.update(updateData)
			.eq('id', matchId);
		
		if (!error) {
			const match = upcomingMatches.find(m => m.id === matchId);
			if (match) {
				if (isHome) match.home_override_version_id = versionId;
				else match.away_override_version_id = versionId;
			}
		}
		isSaving = false;
	}


	function formatTime(iso: string) {
		return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 selection:bg-[var(--color-brand-primary)]/30">
	{#if isLoading}
		<div class="flex h-screen items-center justify-center">
			<BrandLoading message="Initializing Workspace..." />
		</div>
	{:else if teamData}
		<!-- Header -->
		<header class="relative border-b border-white/5 bg-black/40 p-8 lg:p-12">
			<div class="container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
				<div class="flex items-center gap-6" in:fly={{ x: -20, duration: 800 }}>
					<div class="flex h-20 w-20 items-center justify-center rounded-2xl border-2 shadow-2xl overflow-hidden bg-black/40" style="border-color: {teamData.color}44;">
						<TeamIcon teamName={teamData.name} color={teamData.color} size="size-12" class="drop-shadow-[0_0_15px_{teamData.color}44]" />
					</div>
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-3">
							<h1 class="text-3xl font-black tracking-tighter text-white uppercase">{teamData.name}</h1>
							<span class="rounded-full bg-[var(--color-brand-primary)]/10 px-3 py-0.5 text-[8px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/20">Maintainer Hub</span>
						</div>
						<p class="text-xs font-bold text-white/20 uppercase tracking-[0.2em]">Logic Operations & Version Control</p>
					</div>
				</div>

				<div class="flex items-center gap-4">
					<a href="{base}/team/{teamId}/test-runner" class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all shadow-lg">Test Runner</a>
					<a href="{base}/team/{teamId}" class="rounded-xl border border-[var(--color-brand-primary)]/20 bg-[var(--color-brand-primary)]/5 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/10 transition-all shadow-lg">View Profile</a>
				</div>
			</div>
			
			<a href="{base}/team/{teamId}" class="absolute left-8 top-8 group md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
			</a>
		</header>

		<main class="container mx-auto grid grid-cols-1 gap-12 p-8 lg:grid-cols-3 lg:p-12">
			<!-- Left/Center Column: Version Management -->
			<div class="lg:col-span-2 space-y-12">
				<section class="space-y-6">
					<div class="flex items-center justify-between">
						<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Published Logic</h3>
						{#if isSaving}
							<span class="text-[8px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] animate-pulse">Syncing...</span>
						{/if}
					</div>

					<div class="space-y-4">
						{#each versions as v}
							<div class="group relative flex items-center justify-between rounded-2xl border {teamData.active_version_id === v.id ? 'border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/5' : 'border-white/5 bg-black/20'} p-6 transition-all hover:border-white/10 shadow-xl">
								<div class="flex items-center gap-6">
									<div class="flex flex-col">
										{#if editingVersionId === v.id}
											<div class="flex items-center gap-2">
												<input 
													type="text" 
													bind:value={editingName}
													class="bg-black/40 border border-[var(--color-brand-primary)]/50 rounded-lg px-3 py-1 text-sm font-black text-white outline-none"
													onkeydown={(e) => e.key === 'Enter' && saveVersionName()}
												/>
												<button onclick={saveVersionName} class="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:underline">Save</button>
												<button onclick={() => editingVersionId = null} class="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:underline">Cancel</button>
											</div>
										{:else}
											<div class="flex items-center gap-3">
												<span class="text-sm font-black text-white">{v.name || `Version ${v.version_number}`}</span>
												<button onclick={() => startEditing(v)} class="opacity-0 group-hover:opacity-100 transition-opacity">
													<svg class="h-3 w-3 text-white/20 hover:text-[var(--color-brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
												</button>
											</div>
										{/if}
										<div class="flex items-center gap-3 text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">
											<span>v{v.version_number}.0</span>
											<span>•</span>
											<span>{new Date(v.created_at).toLocaleDateString()}</span>
										</div>
									</div>
								</div>

								<div class="flex items-center gap-4">
									{#if teamData.active_version_id === v.id}
										<span class="rounded-lg bg-emerald-500/10 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">Global Active</span>
									{:else}
										<button 
											onclick={() => updateActiveVersion(v.id)}
											disabled={isSaving}
											class="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
										>
											Set Active
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			</div>

			<!-- Right Column: Match Overrides -->
			<div class="space-y-12">
				<section class="space-y-6">
					<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Match Assignments</h3>
					<div class="space-y-4">
						{#each upcomingMatches as match}
							{@const isHome = match.home_team_id === teamId}
							{@const currentOverride = isHome ? match.home_override_version_id : match.away_override_version_id}
							<div class="rounded-2xl border border-white/5 bg-black/20 p-6 space-y-4 shadow-xl">
								<div class="flex justify-between items-center">
									<span class="text-[9px] font-black uppercase tracking-widest text-white/20">{formatTime(match.scheduled_time)}</span>
									<span class="text-[8px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]">vs {isHome ? match.away_team.name : match.home_team.name}</span>
								</div>
								
								<div class="space-y-2">
									<label class="text-[8px] font-black uppercase tracking-widest text-white/40 block">Deployed Logic</label>
									<select 
										value={currentOverride || ''}
										onchange={(e) => updateMatchOverride(match.id, e.currentTarget.value, isHome)}
										disabled={isSaving}
										class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50 transition-all cursor-pointer disabled:opacity-50"
									>
										<option value="">Default (Global Active)</option>
										{#each versions as v}
											<option value={v.id}>{v.name || `Version ${v.version_number}`}</option>
										{/each}
									</select>
								</div>
							</div>
						{/each}
						{#if upcomingMatches.length === 0}
							<div class="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl italic text-white/10 text-xs font-bold uppercase tracking-widest">No pending assignments.</div>
						{/if}
					</div>
				</section>

				<!-- Info Box -->
				<section class="rounded-2xl bg-[var(--color-brand-primary)]/5 border border-[var(--color-brand-primary)]/10 p-8 space-y-4 shadow-2xl">
					<div class="h-10 w-10 rounded-xl bg-[var(--color-brand-primary)]/20 flex items-center justify-center">
						<svg class="h-5 w-5 text-[var(--color-brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
					</div>
					<h4 class="text-xs font-black uppercase tracking-widest text-white">System Note</h4>
					<p class="text-[10px] leading-relaxed font-bold text-white/40 uppercase tracking-widest">
						Match overrides take priority over the global active logic. Use them to deploy specialized strategy against specific opponents without affecting your default behavior.
					</p>
				</section>
				
				<!-- Maintainers Box -->
				<section class="rounded-2xl border border-white/5 bg-black/20 p-8 space-y-4 shadow-xl">
					<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Team Maintainers</h3>
					
					<div class="flex items-center gap-2">
						<input 
							type="text" 
							bind:value={newTeamMaintainer} 
							placeholder="GitHub Username"
							class="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50 transition-colors"
							onkeydown={(e) => e.key === 'Enter' && grantTeamRole(newTeamMaintainer)}
						/>
						<button 
							onclick={() => grantTeamRole(newTeamMaintainer)}
							disabled={!newTeamMaintainer || isSaving}
							class="rounded-lg bg-[var(--color-brand-primary)]/10 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 transition-all disabled:opacity-50"
						>
							Add
						</button>
					</div>
					
					<div class="space-y-2 mt-4">
						{#each teamMaintainers as maintainer}
							<div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
								<div class="flex items-center gap-3">
									<img src={maintainer.user.avatar_url || 'https://github.com/identicons/default.png'} alt={maintainer.user.username} class="w-8 h-8 rounded-full bg-black" />
									<span class="text-sm font-bold text-white/90">{maintainer.user.username}</span>
								</div>
								<button onclick={() => revokeRole(maintainer.id)} class="text-white/30 hover:text-red-400 p-2" disabled={isSaving}>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
								</button>
							</div>
						{/each}
						{#if teamMaintainers.length === 0}
							<div class="text-[9px] font-bold text-white/30 uppercase tracking-widest py-2">No Maintainers Found</div>
						{/if}
					</div>
				</section>
			</div>
		</main>
	{:else}
		<div class="flex h-screen items-center justify-center flex-col gap-4">
			<h1 class="text-4xl font-black uppercase text-white/20">Access Denied</h1>
			<a href="{base}/" class="text-[var(--color-brand-primary)] font-black uppercase tracking-widest hover:underline">Return to Pitch</a>
		</div>
	{/if}
</div>
