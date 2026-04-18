import { createInitialState, tick } from './core.ts';
import type { GameState, PlayerAction } from './types.ts';
import { greedyLogic } from '../../players/v1/greedy_team.ts';

/**
 * Match Runner: Orchestrates a full 500-tick game between two automated teams.
 */

const MAX_TICKS = 500;

async function runMatch() {
	console.log('🏟 Starting Maintainer One Match...');
	
	let state = createInitialState(Date.now());
	const replay: GameState[] = [state];

	for (let i = 0; i < MAX_TICKS; i++) {
		if (state.isFinished) {
			console.log(`🏁 Match finished at tick ${state.tick}. Winner: Team ${state.winner}`);
			break;
		}

		// 1. Generate SensedState for each team
		// For now, we pass the same full state to both
		const sense = { ...state };

		// 2. Get actions from both Team Logic instances
		// In a real scenario, we would load these dynamically
		const teamAActions = greedyLogic(sense).filter(a => 
			state.players.find(p => p.id === a.playerId)?.team === 'A'
		);
		const teamBActions = greedyLogic(sense).filter(a => 
			state.players.find(p => p.id === a.playerId)?.team === 'B'
		);

		const combinedActions: PlayerAction[] = [...teamAActions, ...teamBActions];

		// 3. Tick the engine
		state = tick(state, combinedActions);
		replay.push(state);

		if (state.tick % 50 === 0) {
			console.log(`⏱ Tick ${state.tick}...`);
		}
	}

	if (!state.isFinished) {
		console.log(`⌛ Match reached MAX_TICKS (${MAX_TICKS}). Draw!`);
	}

	// 4. Save Replay
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const filename = `./static/replays/match_${timestamp}.json`;
	
	try {
		await Deno.writeTextFile(filename, JSON.stringify(replay, null, 2));
		console.log(`✅ Replay saved to ${filename}`);
	} catch (err) {
		console.error('❌ Failed to save replay:', err);
	}
}

// Ensure this script can be run directly
if (import.meta.main) {
	runMatch();
}
