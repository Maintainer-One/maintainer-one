<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { modal } from '$lib/stores/modal';

	let selectedLeagueId = $state<string | null>(null);
	let isCreatingSeason = $state(false);

	let newSeasonName = $state('');
	let newSeasonStartDate = $state(new Date().toISOString().split('T')[0]);
	let newSeasonEndDate = $state(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
	let newSeasonSlots = $state(['12:00', '15:00']);
	let newSeasonCodeLockOffset = $state(30);

	let protocolVersion = $state('v1');

	// V1 Config Fields
	let v1Config = $state({
		seasonLengthDays: 7,
		teamCount: 6,
		gamesPerSeason: 10,
		pointZoneSpawnRate: 10,
		maxPointZones: 1,
		pointZoneValue: 0,
		pointZoneForesight: 0,
		pointZoneMinAge: 20,
		pointZoneMaxAge: 40,
		stunPenaltyTicks: 3,
		maxGameTicks: 100,
		overtimeAllowed: true,
		tickRateMs: 750
	});

	let leagueName = $state('');

	onMount(async () => {
		const leagueId = page.url.searchParams.get('league');
		const templateId = page.url.searchParams.get('template');
		
		if (leagueId) {
			selectedLeagueId = leagueId;
			const { data: league } = await supabase.from('leagues').select('name').eq('id', leagueId).single();
			if (league) leagueName = league.name;
		}

		if (templateId) {
			const { data: season } = await supabase
				.from('seasons')
				.select('*')
				.eq('id', templateId)
				.single();

			if (season) {
				newSeasonName = `${season.name} (Copy)`;
				newSeasonStartDate = season.start_date.split('T')[0];
				newSeasonEndDate = season.end_date ? season.end_date.split('T')[0] : season.start_date.split('T')[0];
				newSeasonSlots = [...(season.game_slots || [])];
				newSeasonCodeLockOffset = season.code_lock_offset_minutes || 30;
				protocolVersion = season.protocol_version || 'v1';
				
				if (season.protocol_config && Object.keys(season.protocol_config).length > 0) {
					v1Config = { ...v1Config, ...season.protocol_config };
				}
			}
		}
	});

	function applyTimePreset(preset: 'hourly' | 'half-hourly') {
		const slots = [];
		if (preset === 'hourly') {
			for (let i = 12; i <= 20; i++) slots.push(`${i.toString().padStart(2, '0')}:00`);
		} else if (preset === 'half-hourly') {
			for (let i = 12; i <= 16; i++) {
				slots.push(`${i.toString().padStart(2, '0')}:00`);
				if (i < 16) slots.push(`${i.toString().padStart(2, '0')}:30`);
			}
		}
		newSeasonSlots = slots;
	}

	async function createSeason() {
		if (!newSeasonName || !newSeasonStartDate || !newSeasonEndDate || !selectedLeagueId) return;
		
		const parseLocalDate = (dateStr: string) => {
			const [year, month, day] = dateStr.split('-').map(Number);
			return new Date(year, month - 1, day);
		};

		const start = parseLocalDate(newSeasonStartDate);
		const end = parseLocalDate(newSeasonEndDate);
		end.setHours(23, 59, 59, 999);
		
		if (start > end) {
			modal.alert('Error', 'Start date must be on or before end date');
			return;
		}

		isCreatingSeason = true;
		
		const { data: seasons } = await supabase.from('seasons').select('season_number, start_date, end_date, name').eq('league_id', selectedLeagueId).order('season_number', { ascending: false });
		const nextNum = (seasons?.[0]?.season_number ?? 0) + 1;

		// Overlap check
		if (seasons) {
			const overlap = seasons.find(s => {
				const sStart = new Date(s.start_date);
				const sEnd = s.end_date ? new Date(s.end_date) : sStart;
				return (start <= sEnd && end >= sStart);
			});

			if (overlap) {
				modal.alert('Overlap Error', `This season overlaps with Season ${overlap.season_number} (${overlap.name})`);
				isCreatingSeason = false;
				return;
			}
		}

		const { error } = await supabase
			.from('seasons')
			.insert({
				name: newSeasonName,
				season_number: nextNum,
				league_id: selectedLeagueId,
				status: 'pending',
				start_date: start.toISOString(),
				end_date: end.toISOString(),
				game_density: newSeasonSlots.length,
				game_slots: newSeasonSlots,
				code_lock_offset_minutes: newSeasonCodeLockOffset,
				protocol_version: protocolVersion,
				protocol_config: v1Config
			});

		if (!error) {
			window.location.href = `${base}/admin/league?league=${selectedLeagueId}`;
		} else {
			modal.alert('Error', error.message);
			isCreatingSeason = false;
		}
	}
</script>

<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 p-8 lg:p-12 font-sans selection:bg-[var(--color-brand-primary)]/30">
	<header class="mb-12 flex items-center justify-between max-w-4xl mx-auto">
		<div class="flex items-center gap-8">
			<div class="inline-flex flex-col rounded-3xl border border-white/10 bg-black/40 p-4 pr-8 shadow-2xl backdrop-blur-3xl">
				<div class="flex items-center gap-4">
					<a href="{base}/admin/league{selectedLeagueId ? `?league=${selectedLeagueId}` : ''}" aria-label="Go back" class="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] shadow-lg">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
					</a>
					<div class="flex flex-col">
						<h1 class="text-2xl font-black tracking-tighter text-[var(--color-brand-secondary)] uppercase leading-none">
							Create <span class="text-[var(--color-brand-primary)]">Season</span>
						</h1>
						<p class="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">{leagueName || 'League Config'}</p>
					</div>
				</div>
			</div>
		</div>
	</header>

	<div class="max-w-4xl mx-auto">
		<div class="p-8 rounded-3xl bg-black/40 border border-white/5 shadow-2xl backdrop-blur-xl space-y-8">
			
			<div class="space-y-4">
				<h2 class="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)] flex items-center gap-2 border-b border-white/5 pb-2">
					Basic Details
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-1">
						<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Name</label>
						<input 
							type="text" 
							bind:value={newSeasonName} 
							placeholder="Season Name (e.g. Spring 2026)"
							class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50"
						/>
					</div>
					<div class="space-y-1">
						<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Code Lock Offset (Minutes)</label>
						<input 
							type="number" 
							bind:value={newSeasonCodeLockOffset} 
							class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50"
						/>
					</div>
					<div class="space-y-1">
						<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Start Date</label>
						<input 
							type="date" 
							bind:value={newSeasonStartDate} 
							class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50"
						/>
					</div>
					<div class="space-y-1">
						<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">End Date</label>
						<input 
							type="date" 
							bind:value={newSeasonEndDate} 
							class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50"
						/>
					</div>
				</div>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between border-b border-white/5 pb-2">
					<h2 class="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)] flex items-center gap-2">
						Daily Game Slots
					</h2>
					<div class="flex gap-2">
						<button onclick={() => applyTimePreset('hourly')} class="text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white">Hourly 12-20</button>
						<button onclick={() => applyTimePreset('half-hourly')} class="text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white">30m 12-16</button>
						<button onclick={() => newSeasonSlots = [...newSeasonSlots, '18:00']} class="text-[8px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:underline ml-2">+ Add Slot</button>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					{#each newSeasonSlots as slot, i}
						<div class="flex items-center gap-1 w-[150px]">
							<input 
								type="time" 
								bind:value={newSeasonSlots[i]} 
								class="flex-1 bg-black/60 border border-white/10 rounded-xl px-2 py-3 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50"
							/>
							<button onclick={() => newSeasonSlots = newSeasonSlots.filter((_, idx) => idx !== i)} class="p-2 text-white/20 hover:text-red-500 transition-colors" title="Remove Slot">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
							</button>
						</div>
					{/each}
				</div>
			</div>

			<div class="space-y-6">
				<h2 class="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)] flex items-center gap-2 border-b border-white/5 pb-2">
					Protocol Configuration
				</h2>
				
				<div class="space-y-2">
					<label class="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Protocol Version</label>
					<select 
						bind:value={protocolVersion} 
						class="w-full md:w-1/2 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[var(--color-brand-primary)] outline-none focus:border-[var(--color-brand-primary)]/50 transition-colors [&>option]:text-black"
					>
						<option value="v1">Protocol V1: Capture the Core</option>
					</select>
				</div>

				{#if protocolVersion === 'v1'}
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
						<div class="space-y-1">
							<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Max Game Ticks</label>
							<input type="number" bind:value={v1Config.maxGameTicks} class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50" />
						</div>
						<div class="space-y-1">
							<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Tick Rate (ms)</label>
							<input type="number" bind:value={v1Config.tickRateMs} class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50" />
						</div>
						<div class="space-y-1 flex flex-col justify-end pb-2">
							<label class="flex items-center gap-2 cursor-pointer">
								<input type="checkbox" bind:checked={v1Config.overtimeAllowed} class="rounded border-white/10 bg-black/60 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]/50" />
								<span class="text-[9px] font-black uppercase tracking-widest text-white/80">Overtime Allowed</span>
							</label>
						</div>

						<div class="space-y-1">
							<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Zone Spawn Rate (Ticks)</label>
							<input type="number" bind:value={v1Config.pointZoneSpawnRate} class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50" />
						</div>
						<div class="space-y-1">
							<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Max Active Zones</label>
							<input type="number" bind:value={v1Config.maxPointZones} class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50" />
						</div>
						<div class="space-y-1">
							<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Zone Fixed Value (0 = Age)</label>
							<input type="number" bind:value={v1Config.pointZoneValue} class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50" />
						</div>

						<div class="space-y-1">
							<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Zone Min Age</label>
							<input type="number" bind:value={v1Config.pointZoneMinAge} class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50" />
						</div>
						<div class="space-y-1">
							<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Zone Max Age</label>
							<input type="number" bind:value={v1Config.pointZoneMaxAge} class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50" />
						</div>
						<div class="space-y-1">
							<label class="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Stun Penalty Ticks</label>
							<input type="number" bind:value={v1Config.stunPenaltyTicks} class="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[var(--color-brand-primary)]/50" />
						</div>
					</div>
				{/if}
			</div>

			<div class="flex gap-4 pt-8">
				<button 
					onclick={createSeason}
					disabled={isCreatingSeason}
					class="flex-1 rounded-xl bg-[var(--color-brand-primary)] py-4 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(5,150,105,0.3)] hover:scale-[1.02] hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:scale-100"
				>
					{isCreatingSeason ? 'Creating...' : 'Launch Season'}
				</button>
				<a 
					href="{base}/admin/league{selectedLeagueId ? `?league=${selectedLeagueId}` : ''}"
					class="flex-1 rounded-xl bg-white/5 py-4 text-xs font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all text-center flex items-center justify-center"
				>
					Cancel
				</a>
			</div>
		</div>
	</div>
</div>
