import type { GameState } from '../../engine/types.ts';
import type { V1Config } from './config.ts';
import { DeterministicRNG } from '../../engine/random.ts';

export const BOARD_SIZE = 10;

export function createInitialStateV1(config: V1Config, seed: number, teams?: { A: any, B: any }): GameState {
    const rng = new DeterministicRNG(seed);
    
    const emptyPlayerStats = () => ({
        squaresMoved: 0,
        idleTicks: 0,
        singleStuns: 0,
        mutualStuns: 0,
        expectedCaptures: 0,
        contestedCaptures: 0,
        stolenCaptures: 0
    });

    const emptyTeamStats = () => ({
        controlPercentage: 0,
        averageControlPercentage: 0,
        contestedPercentage: 0,
        averageContestedPercentage: 0,
        oppositionPercentage: 0,
        averageOppositionPercentage: 0,
        expectedSpawns: 0,
        contestedSpawns: 0,
        opposedSpawns: 0,
        despawns: {
            expected: 0,
            contested: 0,
            opposed: 0
        },
        luckScore: 0
    });
    
    return {
        tick: 0,
        protocolVersion: 'v1',
        teams: {
            A: { 
                name: teams?.A?.name || 'Home Team', 
                color: teams?.A?.color || '#3b82f6', 
                score: 0, 
                stats: emptyTeamStats() 
            },
            B: { 
                name: teams?.B?.name || 'Away Team', 
                color: teams?.B?.color || '#f43f5e', 
                score: 0, 
                stats: emptyTeamStats() 
            }
        },
        players: [
            // Team A (Left side)
            { id: 'a1', team: 'A', position: { x: 0, y: 2 }, status: 'active', stunTicks: 0, stats: emptyPlayerStats() },
            { id: 'a2', team: 'A', position: { x: 0, y: 5 }, status: 'active', stunTicks: 0, stats: emptyPlayerStats() },
            { id: 'a3', team: 'A', position: { x: 0, y: 8 }, status: 'active', stunTicks: 0, stats: emptyPlayerStats() },
            // Team B (Right side)
            { id: 'b1', team: 'B', position: { x: BOARD_SIZE - 1, y: 2 }, status: 'active', stunTicks: 0, stats: emptyPlayerStats() },
            { id: 'b2', team: 'B', position: { x: BOARD_SIZE - 1, y: 5 }, status: 'active', stunTicks: 0, stats: emptyPlayerStats() },
            { id: 'b3', team: 'B', position: { x: BOARD_SIZE - 1, y: 8 }, status: 'active', stunTicks: 0, stats: emptyPlayerStats() }
        ],
        pointZones: [],
        nextZoneSpawnTick: config.pointZoneSpawnRate,
        rngState: rng.getState(),
        isFinished: false,
        winner: null
    };
}
