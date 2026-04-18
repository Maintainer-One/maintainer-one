import { DeterministicRNG } from './random.ts';
import type { GameState, PlayerAction } from './types.ts';
import { resolveProtocolV1 } from '../protocols/v1/rules.ts';

/**
 * The core simulation engine orchestrator.
 */

export function tick(state: GameState, actions: PlayerAction[]): GameState {
	// 1. Initialize RNG with current state
	const rng = new DeterministicRNG(state.rngState);

	// 2. Resolve the Protocol (currently hardcoded to V1)
	let nextState = resolveProtocolV1(state, actions);

	// 3. Update the RNG state for the next tick
	nextState = {
		...nextState,
		rngState: rng.getState()
	};

	return nextState;
}

/**
 * Creates a fresh game state for Protocol V1.
 */
export function createInitialState(seed: number): GameState {
	return {
		tick: 0,
		teams: {
			A: { name: 'Team Alpha', score: 0 },
			B: { name: 'Team Bravo', score: 0 }
		},
		players: [
			// Team A (Left side)
			{ id: 'a1', team: 'A', position: { x: 0, y: 2 }, status: 'active' },
			{ id: 'a2', team: 'A', position: { x: 0, y: 5 }, status: 'active' },
			{ id: 'a3', team: 'A', position: { x: 0, y: 8 }, status: 'active' },
			// Team B (Right side)
			{ id: 'b1', team: 'B', position: { x: 9, y: 2 }, status: 'active' },
			{ id: 'b2', team: 'B', position: { x: 9, y: 5 }, status: 'active' },
			{ id: 'b3', team: 'B', position: { x: 9, y: 8 }, status: 'active' }
		],
		pointZone: { position: { x: 4, y: 5 }, points: 1 },
		rngState: seed || Date.now(),
		isFinished: false,
		winner: null
	};
}
