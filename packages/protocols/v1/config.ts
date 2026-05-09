export interface V1Config {
    // League
    seasonLengthDays: number;
    teamCount: number;
    gamesPerSeason: number;
    
    // Match
    pointZoneSpawnRate: number; // Ticks between point zone spawns
    maxPointZones: number;      // Maximum active point zones allowed
    pointZoneValue: number;     // 0 means score = age at capture
    pointZoneForesight: number; // 0 for now
    pointZoneMinAge: number;    // Minimum ticks before despawn
    pointZoneMaxAge: number;    // Maximum ticks before despawn
    stunPenaltyTicks: number;   // How long players are stunned upon collision
    maxGameTicks: number;       // The total duration of the match
    overtimeAllowed: boolean;   // If true, game continues past maxGameTicks until all zones despawn or are captured
    tickRateMs: number;         // Milliseconds per tick for real-time visualization
}

export const defaultV1Config: V1Config = {
    seasonLengthDays: 7,
    teamCount: 6,
    gamesPerSeason: 15, // 5 games per round * 3 rounds (one round robin round)
    pointZoneSpawnRate: 5,
    maxPointZones: 1,
    pointZoneValue: 0, // Age-based scoring
    pointZoneForesight: 0,
    pointZoneMinAge: 10,
    pointZoneMaxAge: 20,
    stunPenaltyTicks: 3,
    maxGameTicks: 300,
    overtimeAllowed: true,
    tickRateMs: 800
};
