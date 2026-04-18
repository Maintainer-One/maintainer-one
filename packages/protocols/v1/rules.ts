import type { GameState, Player, PlayerAction, Position } from '../../engine/types.ts';

/**
 * Protocol V1: 3v3 on a 10x10 grid. Orthogonal movement.
 * Iterative cascading collision resolution.
 */

export const BOARD_SIZE = 10;

export function resolveProtocolV1(
	state: GameState,
	actions: PlayerAction[]
): GameState {
	// Deep clone teams and players to ensure absolute immutability
	const nextTeams = {
		A: { ...state.teams.A },
		B: { ...state.teams.B }
	};
	const players = state.players.map((p) => ({ ...p }));
	
	const nextState: GameState = { 
		...state, 
		tick: state.tick + 1,
		teams: nextTeams,
		players: players
	};

	// 1. Calculate Intentions
	const intents = new Map<string, Position>();
	for (const player of players) {
		const action = actions.find((a) => a.playerId === player.id);
		const target = { ...player.position };

		if (action?.type === 'MOVE' && action.direction) {
			if (action.direction === 'UP' && target.y > 0) target.y -= 1;
			if (action.direction === 'DOWN' && target.y < BOARD_SIZE - 1) target.y += 1;
			if (action.direction === 'LEFT' && target.x > 0) target.x -= 1;
			if (action.direction === 'RIGHT' && target.x < BOARD_SIZE - 1) target.x += 1;
		}
		intents.set(player.id, target);
	}

	// 2. Iterative Collision Resolution
	let changed = true;
	const resolvedPositions = new Map<string, Position>(intents);

	while (changed) {
		changed = false;
		const tileOccupancy = new Map<string, string[]>();

		// Map current resolved intentions to tiles
		for (const [pid, pos] of resolvedPositions) {
			const key = `${pos.x},${pos.y}`;
			if (!tileOccupancy.has(key)) tileOccupancy.set(key, []);
			tileOccupancy.get(key)!.push(pid);
		}

		for (const [pid, targetPos] of resolvedPositions) {
			const originalPos = players.find((p) => p.id === pid)!.position;
			const key = `${targetPos.x},${targetPos.y}`;

			// Check for multi-occupancy
			if (tileOccupancy.get(key)!.length > 1) {
				if (targetPos.x !== originalPos.x || targetPos.y !== originalPos.y) {
					resolvedPositions.set(pid, { ...originalPos });
					changed = true;
					continue;
				}
			}

			// Check for swaps (A -> B and B -> A)
			const currentOccupantsAtTarget = players.filter(
				(p) => p.position.x === targetPos.x && p.position.y === targetPos.y
			);

			for (const occupant of currentOccupantsAtTarget) {
				const occupantTarget = resolvedPositions.get(occupant.id)!;
				if (occupantTarget.x === originalPos.x && occupantTarget.y === originalPos.y) {
					// Swap detected
					if (targetPos.x !== originalPos.x || targetPos.y !== originalPos.y) {
						resolvedPositions.set(pid, { ...originalPos });
						changed = true;
					}
				}
			}
		}
	}

	// Apply resolved positions
	for (const player of players) {
		player.position = resolvedPositions.get(player.id)!;
	}

	nextState.players = players;

	// 3. Victory Check (Point Zone)
	if (state.pointZone) {
		const winners = players.filter(
			(p) =>
				p.position.x === state.pointZone!.position.x &&
				p.position.y === state.pointZone!.position.y
		);

		if (winners.length > 0) {
			// In V1, the first player found wins the tick/point
			const winner = winners[0];
			nextState.teams[winner.team].score += state.pointZone!.points;
			
			// For simplicity in V1, let's say a point ends the game or we just respawn the zone.
			// The user said "first player to capture wins".
			nextState.isFinished = true;
			nextState.winner = winner.team;
		}
	}

	return nextState;
}
