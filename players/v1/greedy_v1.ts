import type { PlayerAction, SensedState } from '../../packages/engine/team_api.ts';


/**
 * Greedy Team Logic for Protocol V1.
 * Moves all team players toward the point zone using Manhattan distance.
 */
export const greedyLogic = (sense: SensedState): PlayerAction[] => {
	const actions: PlayerAction[] = [];
	const pointZone = sense.pointZones?.[0];

	if (!pointZone) return [];

	// Identify which team this logic is running for 
	// (In a real scenario, this would be passed or determined by the player IDs)
	// For this sample, we'll assume it's called with the context of a specific team
	// but the engine will handle splitting it later.
	
	for (const player of sense.players) {
		const targetX = pointZone.position.x;
		const targetY = pointZone.position.y;
		const currentX = player.position.x;
		const currentY = player.position.y;

		let action: PlayerAction = { playerId: player.id, type: 'STAY' };

		// Simple greedy pathing (Orthogonal only)
		if (currentX < targetX) {
			action = { playerId: player.id, type: 'MOVE', direction: 'RIGHT' };
		} else if (currentX > targetX) {
			action = { playerId: player.id, type: 'MOVE', direction: 'LEFT' };
		} else if (currentY < targetY) {
			action = { playerId: player.id, type: 'MOVE', direction: 'DOWN' };
		} else if (currentY > targetY) {
			action = { playerId: player.id, type: 'MOVE', direction: 'UP' };
		}

		actions.push(action);
	}

	return actions;
};
