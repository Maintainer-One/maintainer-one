import type { PlayerAction, SensedState, Direction } from '../../packages/engine/team_api.ts';

export const teamLogic = (sense: SensedState): PlayerAction[] => {
	const actions: PlayerAction[] = [];
	const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

	for (const player of sense.players) {
		// 20% chance to move randomly, 80% to move toward zone
		if (Math.random() < 0.2) {
			const randomDir = directions[Math.floor(Math.random() * directions.length)];
			actions.push({ playerId: player.id, type: 'MOVE', direction: randomDir });
		} else {
			const pointZone = sense.pointZone;
			if (!pointZone) {
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
	}

	return actions;
};
