import type { GameState, PlayerAction, Position, PointZone, TeamID } from '../../engine/types.ts';
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

	// Deep clone state including stats
	const nextTeams = {
		A: { ...state.teams.A, stats: { ...state.teams.A.stats, despawns: { ...state.teams.A.stats.despawns } } },
		B: { ...state.teams.B, stats: { ...state.teams.B.stats, despawns: { ...state.teams.B.stats.despawns } } }
	};
	const players = state.players.map((p) => ({ ...p, stats: { ...p.stats } }));
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

	// --- BOARD CONTROL CALCULATION ---
	// BFS to determine reachability for each team
	const controlMap: (TeamID | 'CONTESTED' | null)[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
	const distMap: Record<TeamID, number[][]> = {
		A: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity)),
		B: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity))
	};

	for (const teamId of ['A', 'B'] as TeamID[]) {
		const queue: { x: number; y: number; d: number }[] = [];
		for (const p of players.filter(p => p.team === teamId && p.status === 'active')) {
			queue.push({ ...p.position, d: 0 });
			distMap[teamId][p.position.y][p.position.x] = 0;
		}

		while (queue.length > 0) {
			const { x, y, d } = queue.shift()!;
			for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
					if (distMap[teamId][ny][nx] > d + 1) {
						distMap[teamId][ny][nx] = d + 1;
						queue.push({ x: nx, y: ny, d: d + 1 });
					}
				}
			}
		}
	}

	let countA = 0;
	let countB = 0;
	let countContested = 0;

	for (let y = 0; y < BOARD_SIZE; y++) {
		for (let x = 0; x < BOARD_SIZE; x++) {
			const dA = distMap.A[y][x];
			const dB = distMap.B[y][x];
			if (dA === Infinity && dB === Infinity) continue;
			if (dA < dB) {
				controlMap[y][x] = 'A';
				countA++;
			} else if (dB < dA) {
				controlMap[y][x] = 'B';
				countB++;
			} else {
				controlMap[y][x] = 'CONTESTED';
				countContested++;
			}
		}
	}

	const totalTiles = BOARD_SIZE * BOARD_SIZE;
	nextTeams.A.stats.controlPercentage = countA / totalTiles;
	nextTeams.B.stats.controlPercentage = countB / totalTiles;
	nextTeams.A.stats.contestedPercentage = countContested / totalTiles;
	nextTeams.B.stats.contestedPercentage = countContested / totalTiles;
	nextTeams.A.stats.oppositionPercentage = countB / totalTiles;
	nextTeams.B.stats.oppositionPercentage = countA / totalTiles;

	// Update averages
	const updateAvg = (currentAvg: number, newVal: number, tick: number) => (currentAvg * (tick - 1) + newVal) / tick;
	nextTeams.A.stats.averageControlPercentage = updateAvg(nextTeams.A.stats.averageControlPercentage, nextTeams.A.stats.controlPercentage, nextState.tick);
	nextTeams.B.stats.averageControlPercentage = updateAvg(nextTeams.B.stats.averageControlPercentage, nextTeams.B.stats.controlPercentage, nextState.tick);
	nextTeams.A.stats.averageContestedPercentage = updateAvg(nextTeams.A.stats.averageContestedPercentage, nextTeams.A.stats.contestedPercentage, nextState.tick);
	nextTeams.B.stats.averageContestedPercentage = updateAvg(nextTeams.B.stats.averageContestedPercentage, nextTeams.B.stats.contestedPercentage, nextState.tick);
	nextTeams.A.stats.averageOppositionPercentage = updateAvg(nextTeams.A.stats.averageOppositionPercentage, nextTeams.A.stats.oppositionPercentage, nextState.tick);
	nextTeams.B.stats.averageOppositionPercentage = updateAvg(nextTeams.B.stats.averageOppositionPercentage, nextTeams.B.stats.oppositionPercentage, nextState.tick);

	// --- PRE-MOVEMENT: AGE & DESPAWN ZONES ---
	// Age existing zones and remove any that hit their hidden despawn age
	pointZones.forEach(pz => pz.age += 1);
	const survivingZones: PointZone[] = [];
	for (const pz of pointZones) {
		if (pz.age < pz._despawnAge) {
			survivingZones.push(pz);
		} else {
			// Despawned! Track it.
			const owner = controlMap[pz.position.y][pz.position.x];
			if (owner === 'A') nextTeams.A.stats.despawns.expected += 1;
			else if (owner === 'B') nextTeams.B.stats.despawns.expected += 1;
			else if (owner === 'CONTESTED') {
				nextTeams.A.stats.despawns.contested += 1;
				nextTeams.B.stats.despawns.contested += 1;
			} else {
				nextTeams.A.stats.despawns.opposed += 1;
				nextTeams.B.stats.despawns.opposed += 1;
			}
		}
	}
	pointZones = survivingZones;

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

			// --- xS & LUCK CALCULATION ---
			const owner = controlMap[y][x];
			if (owner === 'A') {
				nextTeams.A.stats.expectedSpawns += 1;
				// Luck A: 1 - controlA, Luck B: 0 - controlB
				nextTeams.A.stats.luckScore += (1 - nextTeams.A.stats.controlPercentage);
				nextTeams.B.stats.luckScore += (0 - nextTeams.B.stats.controlPercentage);
			} else if (owner === 'B') {
				nextTeams.B.stats.expectedSpawns += 1;
				// Luck B: 1 - controlB, Luck A: 0 - controlA
				nextTeams.B.stats.luckScore += (1 - nextTeams.B.stats.controlPercentage);
				nextTeams.A.stats.luckScore += (0 - nextTeams.A.stats.controlPercentage);
			} else if (owner === 'CONTESTED') {
				nextTeams.A.stats.contestedSpawns += 1;
				nextTeams.B.stats.contestedSpawns += 1;
				// Contested spawn doesn't directly impact luck score in the same way? 
				// Actually, we could say it's neutral.
			} else {
				// No owner (unreachable by both)
				nextTeams.A.stats.opposedSpawns += 1; // Or some other category? 
				nextTeams.B.stats.opposedSpawns += 1;
			}
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
	const wallHits = new Set<string>();
	for (const player of players) {
		const target = { ...player.position };
		
		// Only active players can move
		if (player.status === 'active') {
			const action = actions.find((a) => a.playerId === player.id);
			if (action?.type === 'MOVE' && action.direction) {
				let moved = false;
				if (action.direction === 'UP') {
					if (target.y > 0) { target.y -= 1; moved = true; }
					else wallHits.add(player.id);
				}
				if (action.direction === 'DOWN') {
					if (target.y < BOARD_SIZE - 1) { target.y += 1; moved = true; }
					else wallHits.add(player.id);
				}
				if (action.direction === 'LEFT') {
					if (target.x > 0) { target.x -= 1; moved = true; }
					else wallHits.add(player.id);
				}
				if (action.direction === 'RIGHT') {
					if (target.x < BOARD_SIZE - 1) { target.x += 1; moved = true; }
					else wallHits.add(player.id);
				}

				if (moved) {
					player.stats.squaresMoved += 1;
				} else if (wallHits.has(player.id)) {
					// Wall hit is handled in the collision resolution as a "newlyStunned"
				} else {
					player.stats.idleTicks += 1;
				}
			} else {
				player.stats.idleTicks += 1;
			}
		} else {
			// Stunned players also technically idle
			player.stats.idleTicks += 1;
		}
		intents.set(player.id, target);
	}

	// --- ITERATIVE COLLISION RESOLUTION ---
	let changed = true;
	const resolvedPositions = new Map<string, Position>(intents);
	const newlyStunned = new Set<string>();
	const collisionPartners = new Map<string, string[]>(); // pid -> list of pids it collided with

	// Initialize with wall hits
	for (const pid of wallHits) {
		newlyStunned.add(pid);
	}

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
			const occupants = tileOccupancy.get(key)!;

			// Check for multi-occupancy
			if (occupants.length > 1) {
				if (targetPos.x !== originalPos.x || targetPos.y !== originalPos.y) {
					resolvedPositions.set(pid, { ...originalPos });
					newlyStunned.add(pid);
					// Record collision partners
					if (!collisionPartners.has(pid)) collisionPartners.set(pid, []);
					collisionPartners.get(pid)!.push(...occupants.filter(o => o !== pid));
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
						if (!collisionPartners.has(pid)) collisionPartners.set(pid, []);
						collisionPartners.get(pid)!.push(occupant.id);
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

			// Determine if it was a mutual stun
			const partners = collisionPartners.get(player.id) || [];
			const isMutual = partners.some(partnerId => newlyStunned.has(partnerId));
			if (isMutual) {
				player.stats.mutualStuns += 1;
			} else {
				player.stats.singleStuns += 1;
			}
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

			// Track capture stats
			const owner = controlMap[pz.position.y][pz.position.x];
			if (owner === winner.team) {
				winner.stats.expectedCaptures += 1;
			} else if (owner === 'CONTESTED') {
				winner.stats.contestedCaptures += 1;
			} else {
				winner.stats.stolenCaptures += 1;
			}

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
	nextState.controlMap = controlMap;

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
