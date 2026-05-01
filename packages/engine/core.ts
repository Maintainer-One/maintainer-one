import { DeterministicRNG } from './random.ts';
import type { GameState, PlayerAction } from './types.ts';
import { getProtocol } from '../protocols/registry.ts';

/**
 * The core simulation engine orchestrator.
 */

export function tick(state: GameState, actions: PlayerAction[], config?: any): GameState {
	// 1. Initialize RNG with current state
	const rng = new DeterministicRNG(state.rngState);

	// 2. Resolve the Protocol dynamically
	const protocol = getProtocol(state.protocolVersion);
	// Fallback to default config if none provided
	const activeConfig = (config && Object.keys(config).length > 0) ? config : protocol.defaultConfig;
	let nextState = protocol.resolve(activeConfig, state, actions);

	// 3. Update the RNG state for the next tick
	// Note: protocol.resolve might have already updated rngState if it used the RNG.
	// But we'll ensure we capture the final state. Wait, if protocol used its own RNG instance, 
	// it should have updated nextState.rngState itself. The previous implementation just overrode it.
	// Let's trust nextState.rngState, or override if protocol didn't change it. Actually, V1 updates it.
	// We'll leave it to the protocol, but ensure it's not lost.

	return nextState;
}

/**
 * Creates a fresh game state for a specific Protocol.
 */
export function createInitialState(seed: number, protocolVersion: string = 'v1', config?: any, teams?: { A: any, B: any }): GameState {
	const protocol = getProtocol(protocolVersion);
	const activeConfig = (config && Object.keys(config).length > 0) ? config : protocol.defaultConfig;
	return protocol.createInitialState(activeConfig, seed, teams);
}
