import type { GameState } from '../../engine/types.ts';
import type { V1Config } from './config.ts';
import { DeterministicRNG } from '../../engine/random.ts';

export const BOARD_SIZE = 10;

export function createInitialStateV1(config: V1Config, seed: number): GameState {
    const rng = new DeterministicRNG(seed);
    
    // We do not spawn a point zone immediately in V1 anymore, it waits for nextZoneSpawnTick.
    // We'll set the countdown to start immediately.
    
    return {
        tick: 0,
        protocolVersion: 'v1',
        teams: {
            A: { name: 'Team Alpha', score: 0 },
            B: { name: 'Team Bravo', score: 0 }
        },
        players: [
            // Team A (Left side)
            { id: 'a1', team: 'A', position: { x: 0, y: 2 }, status: 'active', stunTicks: 0 },
            { id: 'a2', team: 'A', position: { x: 0, y: 5 }, status: 'active', stunTicks: 0 },
            { id: 'a3', team: 'A', position: { x: 0, y: 8 }, status: 'active', stunTicks: 0 },
            // Team B (Right side)
            { id: 'b1', team: 'B', position: { x: BOARD_SIZE - 1, y: 2 }, status: 'active', stunTicks: 0 },
            { id: 'b2', team: 'B', position: { x: BOARD_SIZE - 1, y: 5 }, status: 'active', stunTicks: 0 },
            { id: 'b3', team: 'B', position: { x: BOARD_SIZE - 1, y: 8 }, status: 'active', stunTicks: 0 }
        ],
        pointZones: [],
        nextZoneSpawnTick: config.pointZoneSpawnRate,
        rngState: rng.getState(),
        isFinished: false,
        winner: null
    };
}
