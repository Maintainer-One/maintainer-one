import { createInitialState, tick } from './core.ts';
import type { GameState, PlayerAction } from './types.ts';
import type { TeamLogic } from './team_api.ts';

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
	config?: any
): Promise<{ finalState: GameState; replay?: GameState[] }> {
	let state = createInitialState(seed, protocolVersion, config);
	const replay: GameState[] = [state];

	for (let i = 0; i < MAX_TICKS; i++) {
		if (state.isFinished) break;

		// 1. Generate SensedState for each team (strip hidden vars)
		const sense = {
			...state,
			pointZones: state.pointZones.map(pz => {
				const { _despawnAge, ...visible } = pz;
				return visible;
			})
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

	return { finalState: state, replay };
}
