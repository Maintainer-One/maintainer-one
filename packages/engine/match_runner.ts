import { createInitialState, tick } from './core.ts';
import type { GameState, PlayerAction } from './types.ts';
import type { TeamLogic } from './team_api.ts';
import { DeterministicRNG } from './random.ts';

/**
 * Match Runner: Orchestrates a full game between two automated teams.
 * Returns the final GameState.
 */

const MAX_TICKS = 500;

export async function simulateMatch(
	seed: number,
	protocolVersion: string,
	homeLogic: TeamLogic,
	awayLogic: TeamLogic,
	config?: any,
	teamData?: { A: any, B: any }
): Promise<{ finalState: GameState; replay?: GameState[] }> {
	let state = createInitialState(seed, protocolVersion, config, teamData);
	const replay: GameState[] = [state];

	const originalMathRandom = Math.random;
	const sandboxRNG = new DeterministicRNG((state.rngState ^ 0xdeadbeef) >>> 0);
	Math.random = () => sandboxRNG.next();

	try {

	for (let i = 0; i < MAX_TICKS; i++) {
		if (state.isFinished) break;

		// 1. Generate SensedState for each team (strip hidden vars)
		const visibleZones = state.pointZones.map(pz => {
			const { _despawnAge, ...visible } = pz;
			return visible;
		});

		const sense = {
			...state,
			pointZones: visibleZones,
			pointZone: visibleZones[0]
		};

		// 2. Get actions from both Team Logic instances
		const homeActions = homeLogic(sense).filter(a => 
			state.players.find(p => p.id === a.playerId)?.team === 'A'
		);
		const awayActions = awayLogic(sense).filter(a => 
			state.players.find(p => p.id === a.playerId)?.team === 'B'
		);

		const combinedActions: PlayerAction[] = [...homeActions, ...awayActions];

		// 3. Tick the engine
		state = tick(state, combinedActions, config);
		replay.push(state);
	}

	} finally {
		Math.random = originalMathRandom;
	}

	return { finalState: state, replay };
}
