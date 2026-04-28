import { DeterministicRNG } from './random.ts';
import type { GameState, PlayerAction } from './types.ts';
import { getProtocol } from '../protocols/registry.ts';

/**
 * The core simulation engine orchestrator.
 */

export function tick(state: GameState, actions: PlayerAction[]): GameState {
	// 1. Initialize RNG with current state
	const rng = new DeterministicRNG(state.rngState);

	// 2. Resolve the Protocol dynamically
	const protocol = getProtocol(state.protocolVersion);
	let nextState = protocol.resolve(state, actions);

	// 3. Update the RNG state for the next tick
	nextState = {
		...nextState,
		rngState: rng.getState()
	};

	return nextState;
}

/**
 * Creates a fresh game state for a specific Protocol.
 */
export function createInitialState(seed: number, protocolVersion: string = 'v1'): GameState {
	const protocol = getProtocol(protocolVersion);
	
	// Note: In the future, boardSize and player count will be dictated by the protocol definition.
	return {
		tick: 0,
		protocolVersion,
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
			{ id: 'b1', team: 'B', position: { x: protocol.boardSize - 1, y: 2 }, status: 'active' },
			{ id: 'b2', team: 'B', position: { x: protocol.boardSize - 1, y: 5 }, status: 'active' },
			{ id: 'b3', team: 'B', position: { x: protocol.boardSize - 1, y: 8 }, status: 'active' }
		],
		pointZone: { position: { x: Math.floor(protocol.boardSize / 2), y: 5 }, points: 1 },
		rngState: seed || Date.now(),
		isFinished: false,
		winner: null
	};
}
