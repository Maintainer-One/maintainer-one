<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { modal } from '$lib/stores/modal';

	let { data } = $props();
	let { supabase } = $derived(data);



	let leagues: any[] = $state([]);
	let isLoading = $state(true);

	// New League State
	let isCreatingLeague = $state(false);
	let newLeagueName = $state('');
	let newLeagueProtocol = $state('v1');

	// Edit League State
	let editingLeagueId = $state<string | null>(null);
	let editLeagueName = $state('');

	let projectMaintainers: any[] = $state([]);
	let leagueMaintainers: Record<string, any[]> = $state({});
	let newProjectMaintainer = $state('');
	let newLeagueMaintainer: Record<string, string> = $state({});

	async function loadLeagues() {
		const { data, error } = await supabase
			.from('leagues')
			.select('*')
			.order('created_at', { ascending: false });
		
		if (!error && data) {
			leagues = data;
			leagues.forEach(l => newLeagueMaintainer[l.id] = '');
		}

		await loadRoles();
		isLoading = false;
	}

	async function loadRoles() {
		const { data, error } = await supabase
			.from('user_roles')
			.select('id, role, league_id, team_id, user:profiles(username, avatar_url)');
		
		if (!error && data) {
			projectMaintainers = data.filter(r => r.role === 'project_maintainer');
			
			const l_maintainers: Record<string, any[]> = {};
			leagues.forEach(l => l_maintainers[l.id] = []);
			
			data.filter(r => r.role === 'league_maintainer' && r.league_id).forEach(r => {
				if (!l_maintainers[r.league_id]) l_maintainers[r.league_id] = [];
				l_maintainers[r.league_id].push(r);
			});
			leagueMaintainers = l_maintainers;
		}
	}

	async function grantRole(username: string, role: string, leagueId: string | null = null, teamId: string | null = null) {
		if (!username) return;
		const { error } = await supabase.rpc('grant_role', {
			target_username: username,
			granted_role: role,
			target_league_id: leagueId,
			target_team_id: teamId
		});
		
		if (!error) {
			newProjectMaintainer = '';
			if (leagueId) newLeagueMaintainer[leagueId] = '';
			await loadRoles();
		} else {
			modal.alert('Error', error.message);
		}
	}

	async function revokeRole(roleId: string) {
		modal.confirm('Revoke Role', 'Are you sure you want to revoke this role?', async () => {
			const { error } = await supabase.rpc('revoke_role', {
				role_to_revoke_id: roleId
			});
			
			if (!error) {
				await loadRoles();
			} else {
				modal.alert('Error', error.message);
			}
		});
	}

	async function createLeague() {
		if (!newLeagueName) return;

		const { data, error } = await supabase
			.from('leagues')
			.insert({
				name: newLeagueName,
				protocol_version: newLeagueProtocol,
				protocol_config: {}
			})
			.select()
			.single();

		if (!error && data) {
			newLeagueName = '';
			isCreatingLeague = false;
			await loadLeagues();
		} else if (error) {
			console.error(error);
			modal.alert('Error', error.message);
		}
	}

	async function startEditing(league: any) {
		editingLeagueId = league.id;
		editLeagueName = league.name;
	}

	function cancelEditing() {
		editingLeagueId = null;
		editLeagueName = '';
	}

	async function saveLeagueName(id: string) {
		if (!editLeagueName) return;

		const { error } = await supabase
			.from('leagues')
			.update({ name: editLeagueName })
			.eq('id', id);

		if (!error) {
			const index = leagues.findIndex(l => l.id === id);
			if (index !== -1) {
				leagues[index].name = editLeagueName;
			}
			editingLeagueId = null;
		} else {
			modal.alert('Error', error.message);
		}
	}

	onMount(() => {
		loadLeagues();
	});
</script>

<svelte:head>
	<title>Maintainer Authority | Maintainer One</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 p-8 lg:p-12 font-sans selection:bg-[var(--color-brand-primary)]/30">
	<header class="mb-12 flex items-center justify-between max-w-4xl mx-auto">
		<div class="flex items-center gap-8">
			<div class="inline-flex flex-col rounded-2xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl">
				<div class="flex items-center gap-4">
					<a href="{base}/" aria-label="Go back" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-500 shadow-lg">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
					</a>
					<div class="flex flex-col">
						<h1 class="text-2xl font-black tracking-tighter text-white uppercase leading-none">
							Maintainer <span class="text-emerald-400">Authority</span>
						</h1>
						<p class="text-[8px] font-black text-emerald-400/50 uppercase tracking-[0.4em] mt-1.5">Platform Management</p>
					</div>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-4">
			<button 
				onclick={() => isCreatingLeague = !isCreatingLeague}
				class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
			>
				+ New League
			</button>
		</div>
	</header>

	<div class="max-w-4xl mx-auto space-y-8">
		{#if isCreatingLeague}
			<div class="p-8 rounded-2xl bg-black/40 border border-emerald-500/20 shadow-2xl backdrop-blur-xl" transition:slide>
				<h2 class="text-xs font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
					<div class="w-2 h-2 rounded-full bg-emerald-500"></div>
					Create New League
				</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-2">
						<label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">League Name</label>
						<input 
							type="text" 
							bind:value={newLeagueName} 
							placeholder="e.g. Maintainer Two"
							class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-colors"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Protocol Version</label>
						<select 
							bind:value={newLeagueProtocol} 
							class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-colors [&>option]:text-black"
						>
							<option value="v1">Protocol V1</option>
						</select>
					</div>
				</div>

				<div class="flex gap-4 mt-8">
					<button 
						onclick={createLeague}
						disabled={!newLeagueName}
						class="rounded-xl bg-emerald-500 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
					>
						Launch League
					</button>
					<button 
						onclick={() => isCreatingLeague = false}
						class="rounded-xl bg-white/5 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}

		<div class="space-y-4">
			<h2 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2 mb-4">Project Maintainers</h2>
			
			{#if isLoading}
				<div class="flex h-16 items-center justify-center">
					<div class="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
				</div>
			{:else}
				<div class="p-6 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-xl shadow-xl space-y-6">
					<div class="flex items-center gap-4">
						<input 
							type="text" 
							bind:value={newProjectMaintainer} 
							placeholder="GitHub Username"
							class="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-colors"
							onkeydown={(e) => e.key === 'Enter' && grantRole(newProjectMaintainer, 'project_maintainer')}
						/>
						<button 
							onclick={() => grantRole(newProjectMaintainer, 'project_maintainer')}
							disabled={!newProjectMaintainer}
							class="rounded-xl bg-white/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-500 hover:text-black transition-all disabled:opacity-50"
						>
							Add Maintainer
						</button>
					</div>

					<div class="flex flex-wrap gap-4">
						{#each projectMaintainers as maintainer}
							<div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pr-4 p-1">
								<img src={maintainer.user.avatar_url || 'https://github.com/identicons/default.png'} alt={maintainer.user.username} class="w-8 h-8 rounded-full bg-black" />
								<span class="text-sm font-bold text-white">{maintainer.user.username}</span>
								<button onclick={() => revokeRole(maintainer.id)} class="text-white/40 hover:text-red-400 ml-2">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<div class="space-y-4">
			<h2 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2 mb-4">Active Leagues</h2>
			
			{#if isLoading}
				<div class="flex h-32 items-center justify-center">
					<div class="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each leagues as league}
						<div class="group relative rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-md hover:border-emerald-500/30 transition-all">
							<div class="flex items-start justify-between mb-8">
								<div>
									{#if editingLeagueId === league.id}
										<div class="flex items-center gap-2">
											<input 
												type="text" 
												bind:value={editLeagueName} 
												class="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-colors"
												onkeydown={(e) => e.key === 'Enter' && saveLeagueName(league.id)}
											/>
											<button onclick={() => saveLeagueName(league.id)} class="text-emerald-400 hover:text-emerald-300">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
											</button>
											<button onclick={cancelEditing} class="text-white/40 hover:text-white/80">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
											</button>
										</div>
									{:else}
										<div class="flex items-center gap-3">
											<h3 class="text-xl font-black text-white">{league.name}</h3>
											<button onclick={() => startEditing(league)} class="text-white/20 hover:text-emerald-400 transition-colors" title="Rename League">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
											</button>
										</div>
									{/if}
									<div class="flex items-center gap-2 mt-2">
										<span class="px-2 py-1 rounded bg-white/5 text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
											{league.protocol_version}
										</span>
										<span class="text-[8px] font-bold text-white/30 uppercase tracking-wider">
											Launched {new Date(league.created_at).toLocaleDateString()}
										</span>
									</div>
								</div>
								
								<a href="{base}/admin/league?league={league.id}" class="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all" title="Manage League">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
								</a>
							</div>
							
							<div class="mt-6 border-t border-white/5 pt-4 space-y-4">
								<div class="text-[9px] font-black uppercase tracking-widest text-white/20 flex items-center justify-between">
									<span>League Maintainers</span>
								</div>

								<div class="flex flex-col gap-2">
									{#if leagueMaintainers[league.id]?.length === 0}
										<div class="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
											<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
											No Maintainers Assigned
										</div>
									{:else}
										<div class="flex flex-wrap gap-2">
											{#each leagueMaintainers[league.id] as maintainer}
												<div class="flex items-center gap-2 bg-black/40 border border-white/5 rounded-full pr-3 p-1">
													<img src={maintainer.user.avatar_url || 'https://github.com/identicons/default.png'} alt={maintainer.user.username} class="w-5 h-5 rounded-full bg-black" />
													<span class="text-xs font-bold text-white/80">{maintainer.user.username}</span>
													<button onclick={() => revokeRole(maintainer.id)} class="text-white/40 hover:text-red-400 ml-1">
														<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
													</button>
												</div>
											{/each}
										</div>
									{/if}
								</div>

								<div class="flex items-center gap-2 pt-2">
									<input 
										type="text" 
										bind:value={newLeagueMaintainer[league.id]} 
										placeholder="Username"
										class="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition-colors"
										onkeydown={(e) => e.key === 'Enter' && grantRole(newLeagueMaintainer[league.id], 'league_maintainer', league.id)}
									/>
									<button 
										onclick={() => grantRole(newLeagueMaintainer[league.id], 'league_maintainer', league.id)}
										disabled={!newLeagueMaintainer[league.id]}
										class="rounded-lg bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
									>
										Add
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
