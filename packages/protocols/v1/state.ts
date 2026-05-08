import type { GameState, TeamID } from '../../engine/types.ts';
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
        stolenCaptures: 0,
        pointsScored: 0
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
        luckScore: 0,
        totalCaptures: 0,
        averagePointsPerCapture: 0
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
        rngStateA: (seed ^ 0xAAAAAAAA) >>> 0,
        rngStateB: (seed ^ 0xBBBBBBBB) >>> 0,
        controlMap: calculateInitialControlMap([
            { id: 'a1', team: 'A', position: { x: 0, y: 2 } },
            { id: 'a2', team: 'A', position: { x: 0, y: 5 } },
            { id: 'a3', team: 'A', position: { x: 0, y: 8 } },
            { id: 'b1', team: 'B', position: { x: BOARD_SIZE - 1, y: 2 } },
            { id: 'b2', team: 'B', position: { x: BOARD_SIZE - 1, y: 5 } },
            { id: 'b3', team: 'B', position: { x: BOARD_SIZE - 1, y: 8 } }
        ] as any),
        isFinished: false,
        winner: null
    };
}

function calculateInitialControlMap(players: any[]): (TeamID | 'CONTESTED' | null)[][] {
    const controlMap: (TeamID | 'CONTESTED' | null)[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
	const distMap: Record<TeamID, number[][]> = {
		A: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity)),
		B: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity))
	};

	for (const teamId of ['A', 'B'] as TeamID[]) {
		const queue: { x: number; y: number; d: number }[] = [];
		for (const p of players.filter(p => p.team === teamId)) {
			queue.push({ ...p.position, d: 0 });
			distMap[teamId][p.position.y][p.position.x] = 0;
		}

		while (queue.length > 0) {
			const { x, y, d } = queue.shift()!;
			for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
					if (distMap[teamId][ny][nx] > d + 1) {
						distMap[teamId][ny][nx] = d + 1;
						queue.push({ x: nx, y: ny, d: d + 1 });
					}
				}
			}
		}
	}

	for (let y = 0; y < BOARD_SIZE; y++) {
		for (let x = 0; x < BOARD_SIZE; x++) {
			const dA = distMap.A[y][x];
			const dB = distMap.B[y][x];
			if (dA === Infinity && dB === Infinity) continue;
			if (dA < dB) controlMap[y][x] = 'A';
			else if (dB < dA) controlMap[y][x] = 'B';
			else controlMap[y][x] = 'CONTESTED';
		}
	}

    return controlMap;
}
