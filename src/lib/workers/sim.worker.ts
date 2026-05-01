import { tick } from '../../../packages/engine/core';
import type { GameState, PlayerAction, PointZone, Player } from '../../../packages/engine/types';
import { DeterministicRNG } from '../../../packages/engine/random';

const originalMathRandom = Math.random;

/**
 * Web Worker for running the simulation engine in the background.
 */

self.onmessage = async (e: MessageEvent) => {
	const { type, startState, alphaCode, bravoCode, alphaCompiled, bravoCompiled, maxTicks = 500 } = e.data;

	if (type === 'SIMULATE_BRANCH') {
		try {
			const alphaLogic = alphaCompiled ? loadCompiled(alphaCompiled) : createLogic(alphaCode);
			const bravoLogic = bravoCompiled ? loadCompiled(bravoCompiled) : createLogic(bravoCode);

			// Sandbox Math.random for deterministic team logic
			const sandboxRNG = new DeterministicRNG(startState.rngState ^ 0xdeadbeef);
			self.Math.random = () => sandboxRNG.next();

			const states: GameState[] = [startState];
			let currentState = startState;

			for (let i = 0; i < maxTicks; i++) {
				if (currentState.isFinished) break;

				const visibleZones = currentState.pointZones.map((pz: PointZone) => {
					const { _despawnAge, ...visible } = pz;
					return visible;
				});

				const sense = {
					...currentState,
					pointZones: visibleZones,
					pointZone: visibleZones[0]
				};
				
				const alphaActions: PlayerAction[] = alphaLogic(sense) || [];
				const bravoActions: PlayerAction[] = bravoLogic(sense) || [];

				const teamAActions = alphaActions.filter(a => 
					currentState.players.find((p: Player) => p.id === a.playerId)?.team === 'A'
				);
				const teamBActions = bravoActions.filter(a => 
					currentState.players.find((p: Player) => p.id === a.playerId)?.team === 'B'
				);

				const combinedActions = [...teamAActions, ...teamBActions];

				currentState = tick(currentState, combinedActions);
				states.push(currentState);
			}

			// Restore just in case
			self.Math.random = originalMathRandom;
			self.postMessage({ type: 'SIMULATION_COMPLETE', states });
		} catch (error) {
			self.Math.random = originalMathRandom;
			self.postMessage({ type: 'SIMULATION_ERROR', error: (error as Error).message });
		}
	} else if (type === 'SIMULATE_BATCH') {
		const { iterations, seeds, alphaCode, bravoCode, alphaCompiled, bravoCompiled, protocolVersion = 'v1', config, teamData } = e.data;
		
		try {
			const alphaLogic = alphaCompiled ? loadCompiled(alphaCompiled) : createLogic(alphaCode);
			const bravoLogic = bravoCompiled ? loadCompiled(bravoCompiled) : createLogic(bravoCode);
			
			const results = [];

			for (let i = 0; i < iterations; i++) {
				const seed = seeds ? seeds[i] : Math.floor(originalMathRandom() * 1000000);
				const { createInitialState } = await import('../../../packages/engine/core');
				let currentState = createInitialState(seed, protocolVersion, config, teamData);
				
				// Sandbox Math.random per match
				const sandboxRNG = new DeterministicRNG(seed ^ 0xdeadbeef);
				self.Math.random = () => sandboxRNG.next();
				
				const states: GameState[] = [currentState];

				for (let t = 0; t < 1000; t++) {
					if (currentState.isFinished) break;

					const visibleZones = currentState.pointZones.map((pz: PointZone) => {
						const { _despawnAge, ...visible } = pz;
						return visible;
					});

					const sense = {
						...currentState,
						pointZones: visibleZones,
						pointZone: visibleZones[0]
					};
					
					const alphaActions: PlayerAction[] = alphaLogic(sense) || [];
					const bravoActions: PlayerAction[] = bravoLogic(sense) || [];

					const teamAActions = alphaActions.filter(a => 
						currentState.players.find((p: Player) => p.id === a.playerId)?.team === 'A'
					);
					const teamBActions = bravoActions.filter(a => 
						currentState.players.find((p: Player) => p.id === a.playerId)?.team === 'B'
					);

					const combinedActions = [...teamAActions, ...teamBActions];
					currentState = tick(currentState, combinedActions);
					// For batch, we might not need every state, just the final one or specific intervals
					// But let's keep the final state for now.
				}
				results.push({ seed, finalState: currentState });
			}

			// Restore just in case
			self.Math.random = originalMathRandom;
			self.postMessage({ type: 'BATCH_COMPLETE', results });
		} catch (error) {
			self.Math.random = originalMathRandom;
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
