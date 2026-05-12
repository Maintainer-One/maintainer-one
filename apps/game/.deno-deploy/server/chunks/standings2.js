import { t as getProtocol } from "./registry.js";
/**
* Calculates standings and player awards for a given season based on match history.
*/
function calculateSeasonStandings(teamsData, matchesData) {
	if (!teamsData || teamsData.length === 0) return {
		teams: [],
		playerAwards: [],
		winner: null
	};
	const standingsMap = /* @__PURE__ */ new Map();
	teamsData.forEach((t) => {
		standingsMap.set(t.id, {
			...t,
			wins: 0,
			losses: 0,
			draws: 0,
			points: 0,
			rating: 1e3,
			statPoints: 0,
			statAwards: []
		});
	});
	const sortedMatches = [...matchesData].sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());
	const nowTime = (/* @__PURE__ */ new Date()).getTime();
	const pastMatches = sortedMatches.filter((m) => {
		const config = m.seasons?.protocol_config ?? m.leagues?.protocol_config ?? {};
		const tickRate = config.tickRateMs || 750;
		const leagueMaxTicks = (config.maxGameTicks ?? 100) + (config.overtimeAllowed ? config.pointZoneMaxAge ?? 40 : 0);
		const endTime = new Date(m.scheduled_time).getTime() + leagueMaxTicks * tickRate;
		return (m.status === "played" || m.status === "simulated" || m.status === "simmed") && nowTime >= endTime;
	});
	let playerAwards = [];
	if (pastMatches.length > 0 || teamsData.length > 0) {
		const protocolVersion = pastMatches.length > 0 ? pastMatches[0].seasons?.protocol_version || pastMatches[0].leagues?.protocol_version || "v1" : "v1";
		const config = pastMatches.length > 0 ? pastMatches[0].seasons?.protocol_config ?? pastMatches[0].leagues?.protocol_config ?? {} : {};
		const resolvedStandingsResult = getProtocol(protocolVersion).resolveStandings(config, pastMatches, teamsData);
		const resolvedStandings = resolvedStandingsResult.standings || resolvedStandingsResult;
		playerAwards = resolvedStandingsResult.playerAwards || [];
		for (const [teamId, stats] of Object.entries(resolvedStandings)) {
			const team = standingsMap.get(teamId);
			if (team) {
				team.wins = stats.wins;
				team.losses = stats.losses;
				team.draws = stats.ties;
				team.points = stats.points;
				team.statPoints = stats.statPoints || 0;
				team.statAwards = stats.statAwards || [];
			}
		}
	}
	pastMatches.forEach((m) => {
		const home = standingsMap.get(m.home_team_id);
		const away = standingsMap.get(m.away_team_id);
		if (!home || !away) return;
		const Ra = home.rating;
		const Rb = away.rating;
		const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
		const Eb = 1 / (1 + Math.pow(10, (Ra - Rb) / 400));
		let Sa = .5;
		if (m.home_score > m.away_score) Sa = 1;
		else if (m.away_score > m.home_score) Sa = 0;
		const Sb = 1 - Sa;
		home.rating = Math.round(Ra + 32 * (Sa - Ea));
		away.rating = Math.round(Rb + 32 * (Sb - Eb));
	});
	const sortedTeams = Array.from(standingsMap.values()).map((t) => ({
		...t,
		record: `${t.wins}-${t.losses}-${t.draws}`
	})).sort((a, b) => b.points - a.points || b.wins - a.wins || b.rating - a.rating);
	playerAwards.sort((a, b) => a.players.length - b.players.length);
	return {
		teams: sortedTeams,
		playerAwards,
		winner: sortedTeams.length > 0 ? sortedTeams[0] : null
	};
}
//#endregion
export { calculateSeasonStandings as t };
