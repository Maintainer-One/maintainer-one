import type { GameState, PlayerAction, Position, PointZone } from '../../engine/types.ts';
import type { V1Config } from './config.ts';
import { DeterministicRNG } from '../../engine/random.ts';
import { BOARD_SIZE } from './state.ts';

export function resolveProtocolV1(
	config: V1Config,
	state: GameState,
	actions: PlayerAction[]
): GameState {
	// 1. Initialize RNG with current state
	const rng = new DeterministicRNG(state.rngState);

	// Deep clone state
	const nextTeams = {
		A: { ...state.teams.A },
		B: { ...state.teams.B }
	};
	const players = state.players.map((p) => ({ ...p }));
	let pointZones = state.pointZones.map((pz) => ({ ...pz }));
	let nextZoneSpawnTick = state.nextZoneSpawnTick;

	const nextState: GameState = { 
		...state, 
		tick: state.tick + 1,
		teams: nextTeams,
		players: players,
		pointZones: pointZones,
		nextZoneSpawnTick
	};

	// --- PRE-MOVEMENT: AGE & DESPAWN ZONES ---
	// Age existing zones and remove any that hit their hidden despawn age
	pointZones.forEach(pz => pz.age += 1);
	pointZones = pointZones.filter(pz => pz.age < pz._despawnAge);

	// --- SPAWN NEW ZONES ---
	if (nextZoneSpawnTick !== null && nextState.tick >= nextZoneSpawnTick) {
		if (pointZones.length < config.maxPointZones) {
			const x = Math.floor(rng.next() * BOARD_SIZE);
			const y = Math.floor(rng.next() * BOARD_SIZE);
			
			// Roll hidden lifespan
			const spanRange = (config.pointZoneMaxAge ?? 40) - (config.pointZoneMinAge ?? 20);
			const lifespan = (config.pointZoneMinAge ?? 20) + Math.floor(rng.next() * (spanRange + 1));
			
			pointZones.push({
				position: { x, y },
				age: 0,
				_despawnAge: lifespan
			});
		}
		// Reset countdown for next spawn
		nextZoneSpawnTick = nextState.tick + config.pointZoneSpawnRate;
	}

	// --- DECREMENT STUNS ---
	for (const player of players) {
		if (player.status === 'stunned' && player.stunTicks && player.stunTicks > 0) {
			player.stunTicks -= 1;
			if (player.stunTicks === 0) {
				player.status = 'active';
			}
		}
	}

	// --- INTENTIONS ---
	const intents = new Map<string, Position>();
	for (const player of players) {
		const target = { ...player.position };
		
		// Only active players can move
		if (player.status === 'active') {
			const action = actions.find((a) => a.playerId === player.id);
			if (action?.type === 'MOVE' && action.direction) {
				if (action.direction === 'UP' && target.y > 0) target.y -= 1;
				if (action.direction === 'DOWN' && target.y < BOARD_SIZE - 1) target.y += 1;
				if (action.direction === 'LEFT' && target.x > 0) target.x -= 1;
				if (action.direction === 'RIGHT' && target.x < BOARD_SIZE - 1) target.x += 1;
			}
		}
		intents.set(player.id, target);
	}

	// --- ITERATIVE COLLISION RESOLUTION ---
	let changed = true;
	const resolvedPositions = new Map<string, Position>(intents);
	const newlyStunned = new Set<string>();

	while (changed) {
		changed = false;
		const tileOccupancy = new Map<string, string[]>();

		// Map current resolved intentions to tiles
		for (const [pid, pos] of resolvedPositions) {
			const key = `${pos.x},${pos.y}`;
			if (!tileOccupancy.has(key)) tileOccupancy.set(key, []);
			tileOccupancy.get(key)!.push(pid);
		}

		for (const [pid, targetPos] of resolvedPositions) {
			const originalPos = players.find((p) => p.id === pid)!.position;
			const key = `${targetPos.x},${targetPos.y}`;

			// Check for multi-occupancy
			if (tileOccupancy.get(key)!.length > 1) {
				if (targetPos.x !== originalPos.x || targetPos.y !== originalPos.y) {
					resolvedPositions.set(pid, { ...originalPos });
					newlyStunned.add(pid);
					changed = true;
					continue;
				}
			}

			// Check for swaps (A -> B and B -> A)
			const currentOccupantsAtTarget = players.filter(
				(p) => p.position.x === targetPos.x && p.position.y === targetPos.y
			);

			for (const occupant of currentOccupantsAtTarget) {
				const occupantTarget = resolvedPositions.get(occupant.id)!;
				if (occupantTarget.x === originalPos.x && occupantTarget.y === originalPos.y) {
					// Swap detected
					if (targetPos.x !== originalPos.x || targetPos.y !== originalPos.y) {
						resolvedPositions.set(pid, { ...originalPos });
						newlyStunned.add(pid);
						changed = true;
					}
				}
			}
		}
	}

	// Apply resolved positions & apply stuns
	for (const player of players) {
		player.position = resolvedPositions.get(player.id)!;
		if (newlyStunned.has(player.id)) {
			player.status = 'stunned';
			player.stunTicks = config.stunPenaltyTicks;
		}
	}

	// --- ZONE CAPTURES ---
	const zonesToKeep: PointZone[] = [];
	for (const pz of pointZones) {
		const capturers = players.filter(
			(p) => p.position.x === pz.position.x && p.position.y === pz.position.y
		);

		if (capturers.length > 0) {
			// If multiple players capture same zone on same tick, we can split points or give to first.
			// Let's just give it to the first found for simplicity, though collision rules usually prevent multiple.
			const winner = capturers[0];
			const scoreAwarded = config.pointZoneValue === 0 ? pz.age : config.pointZoneValue;
			nextTeams[winner.team].score += scoreAwarded;
			// Zone is destroyed (not added to zonesToKeep)
		} else {
			zonesToKeep.push(pz);
		}
	}
	pointZones = zonesToKeep;

	// Final state updates
	nextState.pointZones = pointZones;
	nextState.nextZoneSpawnTick = nextZoneSpawnTick;
	nextState.rngState = rng.getState();

	// --- VICTORY & OVERTIME CHECK ---
	let gameOver = false;
	if (nextState.tick >= config.maxGameTicks) {
		if (config.overtimeAllowed && pointZones.length > 0) {
			// Overtime: game continues until no zones are active
			gameOver = false;
		} else {
			gameOver = true;
		}
	}

	if (gameOver) {
		nextState.isFinished = true;
		if (nextTeams.A.score > nextTeams.B.score) nextState.winner = 'A';
		else if (nextTeams.B.score > nextTeams.A.score) nextState.winner = 'B';
		else nextState.winner = null; // Tie
	}

	return nextState;
}
