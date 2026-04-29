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
export function resolveStandingsV1(config: V1Config, matches: any[]) {
    const standings: Record<string, { wins: number, losses: number, ties: number, points: number }> = {};
    
    for (const match of matches) {
        if (match.status !== 'simulated' && match.status !== 'published') continue;
        
        if (!standings[match.home_team_id]) standings[match.home_team_id] = { wins: 0, losses: 0, ties: 0, points: 0 };
        if (!standings[match.away_team_id]) standings[match.away_team_id] = { wins: 0, losses: 0, ties: 0, points: 0 };
        
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
    }
    
    return standings;
}
