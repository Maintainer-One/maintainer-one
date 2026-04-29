import { tick } from '../../../packages/engine/core';
import type { GameState, PlayerAction, PointZone, Player } from '../../../packages/engine/types';

/**
 * Web Worker for running the simulation engine in the background.
 */

self.onmessage = async (e: MessageEvent) => {
	const { type, startState, alphaCode, bravoCode, alphaCompiled, bravoCompiled, maxTicks = 500 } = e.data;

	if (type === 'SIMULATE_BRANCH') {
		try {
			const alphaLogic = alphaCompiled ? loadCompiled(alphaCompiled) : createLogic(alphaCode);
			const bravoLogic = bravoCompiled ? loadCompiled(bravoCompiled) : createLogic(bravoCode);

			const states: GameState[] = [startState];
			let currentState = startState;

			for (let i = 0; i < maxTicks; i++) {
				if (currentState.isFinished) break;

				// 1. Get actions from both teams
				// V1 has perfect info EXCEPT for hidden despawn ages
				const sense = {
					...currentState,
					pointZones: currentState.pointZones.map((pz: PointZone) => {
						const { _despawnAge, ...visible } = pz;
						return visible;
					})
				};
				
				const alphaActions: PlayerAction[] = alphaLogic(sense) || [];
				const bravoActions: PlayerAction[] = bravoLogic(sense) || [];

				// Filter actions to ensure players only control their own team
				const teamAActions = alphaActions.filter(a => 
					currentState.players.find((p: Player) => p.id === a.playerId)?.team === 'A'
				);
				const teamBActions = bravoActions.filter(a => 
					currentState.players.find((p: Player) => p.id === a.playerId)?.team === 'B'
				);

				const combinedActions = [...teamAActions, ...teamBActions];

				// 2. Tick the engine
				currentState = tick(currentState, combinedActions);
				states.push(currentState);
			}

			self.postMessage({ type: 'SIMULATION_COMPLETE', states });
		} catch (error) {
			self.postMessage({ type: 'SIMULATION_ERROR', error: (error as Error).message });
		}
	}
};

function loadCompiled(code: string) {
	try {
		return new Function('sense', code);
	} catch (err) {
		console.error('Failed to load compiled logic:', err);
		throw err;
	}
}

function createLogic(code: string) {
	try {
		// Strips imports and extracts the logic function
		// Note: We also strip common TypeScript type annotations so the browser can execute it
		const cleanedCode = code
			.replace(/import\s+[\s\S]*?;/g, '') // Remove imports
			.replace(/:\s*[A-Z][a-zA-Z0-9<>[\]]*/g, '') // Naive TS type stripping (e.g., : SensedState)
			.replace(/export\s+const\s+teamLogic\s*=\s*/, 'const teamLogic = ') // Convert export to local const
			.trim();
		
		// Wrap in a factory function that returns the teamLogic function
		const factory = new Function(`${cleanedCode}; return teamLogic;`);
		return factory();
	} catch (err) {
		console.error('Failed to parse logic code:', err);
		throw err;
	}
}
