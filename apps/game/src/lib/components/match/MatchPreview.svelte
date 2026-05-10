<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { fade, fly } from 'svelte/transition';
	import TeamIcon from '$lib/components/TeamIcon.svelte';

	let { match, onCountdownComplete } = $props<{ match: any, onCountdownComplete?: () => void }>();

	let homeStats = $state<any>(null);
	let awayStats = $state<any>(null);
	let isLoading = $state(true);
	let countdown = $state('');
	let intervalId: number;

	async function fetchStats(teamId: string) {
		// 1. Try current season matches
		let { data: matches, error } = await supabase
			.from('matches')
			.select('home_team_id, away_team_id, home_score, away_score, status, season_id, scheduled_time, leagues (protocol_config), seasons (protocol_config)')
			.in('status', ['played', 'simulated'])
			.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
			.eq('season_id', match.season_id)
			.order('scheduled_time', { ascending: false });
		// 2. If no matches in current season, try previous season
		if (!matches || matches.length === 0) {
			const { data: seasons } = await supabase
				.from('seasons')
				.select('id')
				.lt('season_number', match.seasons?.season_number || 999)
				.order('season_number', { ascending: false })
				.limit(1);
			
			if (seasons && seasons[0]) {
				const { data: prevMatches } = await supabase
					.from('matches')
					.select('home_team_id, away_team_id, home_score, away_score, status, scheduled_time, leagues (protocol_config), seasons (protocol_config)')
					.in('status', ['played', 'simulated'])
					.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
					.eq('season_id', seasons[0].id)
					.order('scheduled_time', { ascending: false });
				matches = prevMatches;
			}
		}

		if (!matches || matches.length === 0) return { wins: 0, losses: 0, draws: 0, avgScore: 0, form: [] };

		const nowTime = new Date().getTime();
		const validMatches = matches.filter(m => {
			const config = m.seasons?.protocol_config ?? m.leagues?.protocol_config ?? match.seasons?.protocol_config ?? match.leagues?.protocol_config ?? {};
			const tickRate = config.tickRateMs || 750;
			const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
			const startTime = new Date(m.scheduled_time).getTime();
			const endTime = startTime + (leagueMaxTicks * tickRate);
			return (m.status === 'played' || m.status === 'simulated') && nowTime >= endTime;
		});

		if (validMatches.length === 0) return { wins: 0, losses: 0, draws: 0, avgScore: 0, form: [] };

		let wins = 0, losses = 0, draws = 0, totalScore = 0;
		const form: string[] = [];

		validMatches.forEach((m: any) => {
			const isHome = m.home_team_id === teamId;
			const teamScore = isHome ? m.home_score : m.away_score;
			const oppScore = isHome ? m.away_score : m.home_score;
			
			totalScore += teamScore;
			if (teamScore > oppScore) {
				wins++;
				if (form.length < 5) form.push('W');
			} else if (teamScore < oppScore) {
				losses++;
				if (form.length < 5) form.push('L');
			} else {
				draws++;
				if (form.length < 5) form.push('D');
			}
		});

		return {
			wins,
			losses,
			draws,
			avgScore: totalScore / validMatches.length,
			form: form.reverse()
		};
	}

	function updateCountdown() {
		const target = new Date(match.scheduled_time).getTime();
		const now = new Date().getTime();
		const diff = target - now;

		if (diff <= 0) {
			countdown = "00:00:00";
			if (intervalId) clearInterval(intervalId);
			if (onCountdownComplete) onCountdownComplete();
			return;
		}

		const h = Math.floor(diff / (1000 * 60 * 60));
		const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const s = Math.floor((diff % (1000 * 60)) / 1000);

		countdown = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	onMount(async () => {
		isLoading = true;
		[homeStats, awayStats] = await Promise.all([
			fetchStats(match.home_team.id),
			fetchStats(match.away_team.id)
		]);
		isLoading = false;

		updateCountdown();
		intervalId = window.setInterval(updateCountdown, 1000);
		return () => clearInterval(intervalId);
	});
</script>

<div class="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar" in:fade>
	<div class="w-full max-w-4xl space-y-12">
		<!-- Hero Header -->
		<div class="text-center space-y-6">
			<div class="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-4 py-1.5 text-[10px] font-black tracking-[0.2em] text-[var(--color-brand-secondary)] uppercase">
				<span class="h-2 w-2 animate-pulse rounded-full bg-[var(--color-brand-primary)]"></span>
				Match Preview
			</div>
			
			<div class="flex items-center justify-center gap-12 md:gap-24">
				<div class="flex flex-col items-center gap-4" in:fly={{ y: 20, delay: 100 }}>
					<div class="h-24 w-24 rounded-2xl flex items-center justify-center border-2 shadow-2xl overflow-hidden bg-black/40" style="border-color: {match.home_team.color}44;">
						<TeamIcon teamName={match.home_team.name} color={match.home_team.color} size="size-16" class="drop-shadow-[0_0_15px_{match.home_team.color}66]" />
					</div>
					<h2 class="text-2xl font-black text-white tracking-tighter">{match.home_team.name}</h2>
				</div>

				<div class="flex flex-col items-center gap-2">
					<span class="text-6xl font-black text-white/5 tracking-tighter uppercase italic">VS</span>
					<div class="text-2xl font-mono font-black text-[var(--color-brand-primary)] drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
						{countdown}
					</div>
				</div>

				<div class="flex flex-col items-center gap-4" in:fly={{ y: 20, delay: 200 }}>
					<div class="h-24 w-24 rounded-2xl flex items-center justify-center border-2 shadow-2xl overflow-hidden bg-black/40" style="border-color: {match.away_team.color}44;">
						<TeamIcon teamName={match.away_team.name} color={match.away_team.color} size="size-16" class="drop-shadow-[0_0_15px_{match.away_team.color}66]" />
					</div>
					<h2 class="text-2xl font-black text-white tracking-tighter">{match.away_team.name}</h2>
				</div>
			</div>
		</div>

		{#if !isLoading}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8" in:fade={{ delay: 300 }}>
				<!-- Home Stats -->
				<div class="space-y-6">
					<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-center md:text-left">Home Advantage</h3>
					<div class="rounded-2xl border border-white/5 bg-black/40 p-6 space-y-6 shadow-xl">
						<div class="flex justify-between items-end">
							<span class="text-[9px] font-black text-white/40 uppercase">Record</span>
							<span class="text-xl font-black text-white">{homeStats.wins}-{homeStats.losses}-{homeStats.draws}</span>
						</div>
						<div class="flex justify-between items-end">
							<span class="text-[9px] font-black text-white/40 uppercase">Avg Score</span>
							<span class="text-xl font-black text-white">{homeStats.avgScore.toFixed(1)}</span>
						</div>
						<div class="space-y-2">
							<span class="text-[9px] font-black text-white/40 uppercase">Recent Form</span>
							<div class="flex gap-1.5">
								{#each homeStats.form as f}
									<div class="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black {f === 'W' ? 'bg-emerald-500/20 text-emerald-400' : (f === 'L' ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-white/40')}">
										{f}
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Matchup Analytics -->
				<div class="space-y-6">
					<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-center">Matchup Analytics</h3>
					<div class="rounded-2xl border border-[var(--color-brand-primary)]/10 bg-[var(--color-brand-primary)]/5 p-6 space-y-8 shadow-2xl">
						<div class="space-y-3">
							<div class="flex justify-between text-[9px] font-black uppercase text-white/60">
								<span>Offense</span>
								<span>Defense</span>
							</div>
							<div class="flex h-1.5 gap-1">
								<div class="flex-1 bg-white/5 rounded-full overflow-hidden">
									<div class="h-full bg-[var(--color-brand-primary)]" style="width: {Math.min(100, (homeStats.avgScore / 50) * 100)}%"></div>
								</div>
								<div class="flex-1 bg-white/5 rounded-full overflow-hidden">
									<div class="h-full bg-amber-400" style="width: {Math.min(100, (awayStats.avgScore / 50) * 100)}%"></div>
								</div>
							</div>
						</div>

						<div class="space-y-3">
							<div class="flex justify-between text-[9px] font-black uppercase text-white/60">
								<span>Win Prob</span>
								<span>{((homeStats.wins / (homeStats.wins + awayStats.wins + 0.1)) * 100).toFixed(0)}% / {((awayStats.wins / (homeStats.wins + awayStats.wins + 0.1)) * 100).toFixed(0)}%</span>
							</div>
							<div class="flex h-1.5 rounded-full overflow-hidden">
								<div class="h-full" style="width: {(homeStats.wins / (homeStats.wins + awayStats.wins + 0.1)) * 100}%; background-color: {match.home_team.color}aa"></div>
								<div class="h-full" style="width: {(awayStats.wins / (homeStats.wins + awayStats.wins + 0.1)) * 100}%; background-color: {match.away_team.color}aa"></div>
							</div>
						</div>

						<p class="text-[8px] font-medium text-white/20 italic leading-relaxed text-center">
							* Analytics based on historical season data and current team momentum.
						</p>
					</div>
				</div>

				<!-- Away Stats -->
				<div class="space-y-6">
					<h3 class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-center md:text-right">Challenger Form</h3>
					<div class="rounded-2xl border border-white/5 bg-black/40 p-6 space-y-6 shadow-xl">
						<div class="flex justify-between items-end">
							<span class="text-[9px] font-black text-white/40 uppercase">Record</span>
							<span class="text-xl font-black text-white">{awayStats.wins}-{awayStats.losses}-{awayStats.draws}</span>
						</div>
						<div class="flex justify-between items-end">
							<span class="text-[9px] font-black text-white/40 uppercase">Avg Score</span>
							<span class="text-xl font-black text-white">{awayStats.avgScore.toFixed(1)}</span>
						</div>
						<div class="space-y-2">
							<span class="text-[9px] font-black text-white/40 uppercase">Recent Form</span>
							<div class="flex gap-1.5 md:justify-end">
								{#each awayStats.form as f}
									<div class="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black {f === 'W' ? 'bg-emerald-500/20 text-emerald-400' : (f === 'L' ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-white/40')}">
										{f}
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
