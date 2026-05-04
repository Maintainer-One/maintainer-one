import type { V1Config } from './config.ts';

/**
 * Generates a round-robin schedule for the given teams.
 * In V1, each team plays every other team `gamesPerSeason` times.
 */
export function generateScheduleV1(config: V1Config, teams: { id: string }[], startDate: Date) {
    const matches: any[] = [];
    const teamIds = teams.map(t => t.id);
    
    // Simple round robin algorithm
    // Note: If team count is odd, we'd need a dummy "bye" team. 
    // Assuming even team count for V1 as per Inaugural setup (6 teams).
    
    let matchCount = 0;
    
    for (let round = 0; round < config.gamesPerSeason; round++) {
        for (let i = 0; i < teamIds.length; i++) {
            for (let j = i + 1; j < teamIds.length; j++) {
                const scheduledTime = new Date(startDate);
                // Schedule one match per day roughly (or just sequential days)
                scheduledTime.setDate(scheduledTime.getDate() + matchCount);
                scheduledTime.setHours(10, 0, 0, 0);

                matches.push({
                    home_team_id: teamIds[i],
                    away_team_id: teamIds[j],
                    scheduled_time: scheduledTime.toISOString(),
                    status: 'pending'
                });
                matchCount++;
            }
        }
    }

    return matches;
}

/**
 * Calculates standings based on match results.
 * 3 points for win, 1 for tie, 0 for loss.
 */
export function resolveStandingsV1(config: V1Config, matches: any[], teams?: any[]) {
    const standings: Record<string, { wins: number, losses: number, ties: number, points: number, statPoints: number, statAwards: string[] }> = {};
    const seasonPlayerStats: Record<string, any> = {};

    if (teams) {
        for (const t of teams) {
            standings[t.id] = { wins: 0, losses: 0, ties: 0, points: 0, statPoints: 0, statAwards: [] };
            for (let i = 1; i <= 3; i++) {
                seasonPlayerStats[`${t.id}_${i}`] = { teamId: t.id, unitIndex: String(i), stats: {} };
            }
        }
    }

    for (const match of matches) {
        if (match.status !== 'simulated' && match.status !== 'published' && match.status !== 'played' && match.status !== 'simmed') continue;
        
        if (!standings[match.home_team_id]) standings[match.home_team_id] = { wins: 0, losses: 0, ties: 0, points: 0, statPoints: 0, statAwards: [] };
        if (!standings[match.away_team_id]) standings[match.away_team_id] = { wins: 0, losses: 0, ties: 0, points: 0, statPoints: 0, statAwards: [] };
        
        if (match.winner_id === match.home_team_id) {
            standings[match.home_team_id].wins++;
            standings[match.home_team_id].points += 3;
            standings[match.away_team_id].losses++;
        } else if (match.winner_id === match.away_team_id) {
            standings[match.away_team_id].wins++;
            standings[match.away_team_id].points += 3;
            standings[match.home_team_id].losses++;
        } else {
            // Tie
            standings[match.home_team_id].ties++;
            standings[match.home_team_id].points += 1;
            standings[match.away_team_id].ties++;
            standings[match.away_team_id].points += 1;
        }

        // Aggregate stats per unit
        if (match.stats && match.stats.players) {
            for (const p of match.stats.players) {
                const teamId = p.team === 'A' ? match.home_team_id : match.away_team_id;
                // standardize unit id (e.g. 'a1' -> '1')
                const unitIndex = p.id.replace(/^[ab]/, ''); 
                const playerKey = `${teamId}_${unitIndex}`;
                
                if (!seasonPlayerStats[playerKey]) {
                    seasonPlayerStats[playerKey] = { teamId, unitIndex, stats: {} };
                }
                
                for (const statKey in p.stats) {
                    seasonPlayerStats[playerKey].stats[statKey] = (seasonPlayerStats[playerKey].stats[statKey] || 0) + p.stats[statKey];
                }
            }
        }
    }

    // Distribute Stat Points
    const statKeys = ['squaresMoved', 'idleTicks', 'singleStuns', 'mutualStuns', 'expectedCaptures', 'contestedCaptures', 'stolenCaptures'];
    
    // We will collect player awards to return alongside standings
    const playerAwards: Array<{ statName: string, formattedKey: string, type: 'Most' | 'Least', value: number, players: { teamId: string, unitIndex: string }[] }> = [];

    for (const key of statKeys) {
        let maxVal = -Infinity;
        let minVal = Infinity;
        
        // Find min/max season total across all players
        for (const playerKey in seasonPlayerStats) {
            const val = seasonPlayerStats[playerKey].stats[key] || 0;
            if (val > maxVal) maxVal = val;
            if (val < minVal) minVal = val;
        }
        
        if (maxVal === -Infinity || minVal === Infinity) continue;

        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const maxTeams = new Set<string>();
        const minTeams = new Set<string>();
        
        const maxPlayersList: { teamId: string, unitIndex: string }[] = [];
        const minPlayersList: { teamId: string, unitIndex: string }[] = [];

        for (const playerKey in seasonPlayerStats) {
            const player = seasonPlayerStats[playerKey];
            const val = player.stats[key] || 0;
            if (val === maxVal) {
                maxTeams.add(player.teamId);
                maxPlayersList.push({ teamId: player.teamId, unitIndex: player.unitIndex });
            }
            if (val === minVal) {
                minTeams.add(player.teamId);
                minPlayersList.push({ teamId: player.teamId, unitIndex: player.unitIndex });
            }
        }
        
        if (maxPlayersList.length > 0) {
            playerAwards.push({ statName: key, formattedKey, type: 'Most', value: maxVal, players: maxPlayersList });
        }
        
        if (minPlayersList.length > 0) {
            playerAwards.push({ statName: key, formattedKey, type: 'Least', value: minVal, players: minPlayersList });
        }

        maxTeams.forEach(teamId => {
            if (standings[teamId]) {
                standings[teamId].points += 1;
                standings[teamId].statPoints += 1;
                standings[teamId].statAwards.push(`Most ${formattedKey}`);
            }
        });
        minTeams.forEach(teamId => {
            if (standings[teamId]) {
                standings[teamId].points += 1;
                standings[teamId].statPoints += 1;
                standings[teamId].statAwards.push(`Least ${formattedKey}`);
            }
        });
    }
    
    return { standings, playerAwards, seasonPlayerStats };
}

