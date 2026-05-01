import type { PlayerAction, SensedState } from '../../packages/engine/team_api.ts';

export const teamLogic = (sense: SensedState): PlayerAction[] => {
	const actions: PlayerAction[] = [];
	const pointZone = sense.pointZone || sense.pointZones?.[0];

	if (!pointZone) return [];

	for (const player of sense.players) {
		const targetX = pointZone.position.x;
		const targetY = pointZone.position.y;
		const currentX = player.position.x;
		const currentY = player.position.y;

		let action: PlayerAction = { playerId: player.id, type: 'STAY' };

		// Defensive: Stay within 3 tiles of their home side (0 or 9) but move toward zone if it's close
		const isHomeA = player.team === 'A';
		const homeX = isHomeA ? 0 : 9;
		
		if (Math.abs(currentX - homeX) > 3 && Math.abs(currentX - targetX) > 2) {
			// Move back toward home
			action = { playerId: player.id, type: 'MOVE', direction: isHomeA ? 'LEFT' : 'RIGHT' };
		} else {
			// Move toward zone
			if (currentX < targetX) {
				action = { playerId: player.id, type: 'MOVE', direction: 'RIGHT' };
			} else if (currentX > targetX) {
				action = { playerId: player.id, type: 'MOVE', direction: 'LEFT' };
			} else if (currentY < targetY) {
				action = { playerId: player.id, type: 'MOVE', direction: 'DOWN' };
			} else if (currentY > targetY) {
				action = { playerId: player.id, type: 'MOVE', direction: 'UP' };
			}
		}

		actions.push(action);
	}

	return actions;
};
