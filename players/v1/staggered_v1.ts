import type { PlayerAction, SensedState } from '../../packages/engine/team_api.ts';

export const teamLogic = (sense: SensedState): PlayerAction[] => {
	const actions: PlayerAction[] = [];
	const pointZone = sense.pointZone || sense.pointZones?.[0];

	if (!pointZone) return [];

	// Only one player moves per tick
	const playerToMoveIndex = sense.tick % sense.players.length;
	const playerToMove = sense.players[playerToMoveIndex];

	for (const player of sense.players) {
		if (player.id !== playerToMove.id) {
			actions.push({ playerId: player.id, type: 'STAY' });
			continue;
		}

		const targetX = pointZone.position.x;
		const targetY = pointZone.position.y;
		const currentX = player.position.x;
		const currentY = player.position.y;

		if (currentX < targetX) {
			actions.push({ playerId: player.id, type: 'MOVE', direction: 'RIGHT' });
		} else if (currentX > targetX) {
			actions.push({ playerId: player.id, type: 'MOVE', direction: 'LEFT' });
		} else if (currentY < targetY) {
			actions.push({ playerId: player.id, type: 'MOVE', direction: 'DOWN' });
		} else if (currentY > targetY) {
			actions.push({ playerId: player.id, type: 'MOVE', direction: 'UP' });
		} else {
			actions.push({ playerId: player.id, type: 'STAY' });
		}
	}

	return actions;
};
