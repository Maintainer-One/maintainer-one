import { getProtocol } from '$packages/protocols/registry';

export const DEFAULT_TICK_RATE = 750;
export const K_FACTOR = 32;

/**
 * Calculates standings and player awards for a given season based on match history.
 */
export function calculateSeasonStandings(teamsData: any[], matchesData: any[]) {
	if (!teamsData || teamsData.length === 0) {
		return { teams: [], playerAwards: [], winner: null };
	}

	// 1. Initialize standings map
	const standingsMap = new Map();
	teamsData.forEach(t => {
		standingsMap.set(t.id, { 
			...t, 
			wins: 0, 
			losses: 0, 
			draws: 0, 
			points: 0,
			rating: 1000,
			statPoints: 0,
			statAwards: []
		});
	});

	// Sort matches by time to ensure chronological processing (important for ELO)
	const sortedMatches = [...matchesData].sort((a, b) => 
		new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
	);

	const nowTime = new Date().getTime();

	// 2. Filter out live/unstarted matches to only include completed ones
	const pastMatches = sortedMatches.filter(m => {
		const config = (m.seasons as any)?.protocol_config ?? (m.leagues as any)?.protocol_config ?? {};
		const tickRate = config.tickRateMs || DEFAULT_TICK_RATE;
		const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? (config.pointZoneMaxAge ?? 40) : 0);
		const startTime = new Date(m.scheduled_time).getTime();
		const endTime = startTime + (leagueMaxTicks * tickRate);
		return (m.status === 'played' || m.status === 'simulated' || m.status === 'simmed') && nowTime >= endTime;
	});

	let playerAwards: any[] = [];

	// 3. Resolve standings via Protocol
	if (pastMatches.length > 0 || teamsData.length > 0) {
		// Use the protocol version from the first match or default to v1
		const protocolVersion = pastMatches.length > 0 
			? (pastMatches[0].seasons as any)?.protocol_version || (pastMatches[0].leagues as any)?.protocol_version || 'v1' 
			: 'v1';
		
		const config = pastMatches.length > 0 
			? ((pastMatches[0].seasons as any)?.protocol_config ?? (pastMatches[0].leagues as any)?.protocol_config ?? {}) 
			: {};
		
		const protocol = getProtocol(protocolVersion);
		const resolvedStandingsResult = protocol.resolveStandings(config, pastMatches, teamsData);
		const resolvedStandings = resolvedStandingsResult.standings || resolvedStandingsResult;
		playerAwards = resolvedStandingsResult.playerAwards || [];
		
		for (const [teamId, stats] of Object.entries(resolvedStandings)) {
			const team = standingsMap.get(teamId);
			if (team) {
				team.wins = (stats as any).wins;
				team.losses = (stats as any).losses;
				team.draws = (stats as any).ties; 
				team.points = (stats as any).points;
				team.statPoints = (stats as any).statPoints || 0;
				team.statAwards = (stats as any).statAwards || [];
			}
		}
	}

	// 4. Calculate ELO
	pastMatches.forEach(m => {
		const home = standingsMap.get(m.home_team_id);
		const away = standingsMap.get(m.away_team_id);
		if (!home || !away) return;

		const Ra = home.rating;
		const Rb = away.rating;
		const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
		const Eb = 1 / (1 + Math.pow(10, (Ra - Rb) / 400));
		
		let Sa = 0.5; // Draw
		if (m.home_score > m.away_score) Sa = 1;
		else if (m.away_score > m.home_score) Sa = 0;
		
		const Sb = 1 - Sa;

		home.rating = Math.round(Ra + K_FACTOR * (Sa - Ea));
		away.rating = Math.round(Rb + K_FACTOR * (Sb - Eb));
	});

	// 5. Sort and format teams
	const sortedTeams = Array.from(standingsMap.values())
		.map(t => ({
			...t,
			record: `${t.wins}-${t.losses}-${t.draws}`
		}))
		.sort((a, b) => b.points - a.points || b.wins - a.wins || b.rating - a.rating);

	// 6. Sort player awards: Sole winners first (shorter player list)
	playerAwards.sort((a: any, b: any) => a.players.length - b.players.length);

	return { 
		teams: sortedTeams, 
		playerAwards,
		winner: sortedTeams.length > 0 ? sortedTeams[0] : null
	};
}
