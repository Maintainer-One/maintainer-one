//#region ../../packages/protocols/v1/config.ts
var defaultV1Config = {
	seasonLengthDays: 7,
	teamCount: 6,
	gamesPerSeason: 10,
	pointZoneSpawnRate: 10,
	maxPointZones: 1,
	pointZoneValue: 0,
	pointZoneForesight: 0,
	pointZoneMinAge: 20,
	pointZoneMaxAge: 40,
	stunPenaltyTicks: 3,
	maxGameTicks: 100,
	overtimeAllowed: true,
	tickRateMs: 750
};
//#endregion
//#region ../../packages/engine/random.ts
/**
* Seedable LCG (Linear Congruential Generator) for deterministic randomness.
* We store the state as a single number to make GameState easily serializable.
*/
var DeterministicRNG = class {
	state;
	constructor(seed) {
		this.state = seed || 1;
		if (this.state < 0) this.state = this.state % 4294967296 + 4294967296;
	}
	/**
	* Returns a pseudo-random number between 0 and 1.
	* Updates the internal state.
	*/
	next() {
		this.state = (this.state * 1664525 + 1013904223) % 4294967296;
		if (this.state < 0) this.state += 4294967296;
		return this.state / 4294967296;
	}
	/**
	* Returns a random integer between min (inclusive) and max (inclusive).
	*/
	nextInt(min, max) {
		return Math.floor(this.next() * (max - min + 1)) + min;
	}
	getState() {
		return this.state;
	}
};
function createInitialStateV1(config, seed, teams) {
	const rng = new DeterministicRNG(seed);
	const emptyPlayerStats = () => ({
		squaresMoved: 0,
		idleTicks: 0,
		singleStuns: 0,
		mutualStuns: 0,
		expectedCaptures: 0,
		contestedCaptures: 0,
		stolenCaptures: 0,
		pointsScored: 0
	});
	const emptyTeamStats = () => ({
		controlPercentage: 0,
		averageControlPercentage: 0,
		contestedPercentage: 0,
		averageContestedPercentage: 0,
		oppositionPercentage: 0,
		averageOppositionPercentage: 0,
		expectedSpawns: 0,
		contestedSpawns: 0,
		opposedSpawns: 0,
		despawns: {
			expected: 0,
			contested: 0,
			opposed: 0
		},
		luckScore: 0,
		totalCaptures: 0,
		averagePointsPerCapture: 0
	});
	return {
		tick: 0,
		protocolVersion: "v1",
		teams: {
			A: {
				name: teams?.A?.name || "Home Team",
				color: teams?.A?.color || "#3b82f6",
				score: 0,
				stats: emptyTeamStats()
			},
			B: {
				name: teams?.B?.name || "Away Team",
				color: teams?.B?.color || "#f43f5e",
				score: 0,
				stats: emptyTeamStats()
			}
		},
		players: [
			{
				id: "a1",
				team: "A",
				position: {
					x: 0,
					y: 2
				},
				status: "active",
				stunTicks: 0,
				stats: emptyPlayerStats()
			},
			{
				id: "a2",
				team: "A",
				position: {
					x: 0,
					y: 5
				},
				status: "active",
				stunTicks: 0,
				stats: emptyPlayerStats()
			},
			{
				id: "a3",
				team: "A",
				position: {
					x: 0,
					y: 8
				},
				status: "active",
				stunTicks: 0,
				stats: emptyPlayerStats()
			},
			{
				id: "b1",
				team: "B",
				position: {
					x: 9,
					y: 2
				},
				status: "active",
				stunTicks: 0,
				stats: emptyPlayerStats()
			},
			{
				id: "b2",
				team: "B",
				position: {
					x: 9,
					y: 5
				},
				status: "active",
				stunTicks: 0,
				stats: emptyPlayerStats()
			},
			{
				id: "b3",
				team: "B",
				position: {
					x: 9,
					y: 8
				},
				status: "active",
				stunTicks: 0,
				stats: emptyPlayerStats()
			}
		],
		pointZones: [],
		nextZoneSpawnTick: config.pointZoneSpawnRate,
		rngState: rng.getState(),
		controlMap: calculateInitialControlMap([
			{
				id: "a1",
				team: "A",
				position: {
					x: 0,
					y: 2
				}
			},
			{
				id: "a2",
				team: "A",
				position: {
					x: 0,
					y: 5
				}
			},
			{
				id: "a3",
				team: "A",
				position: {
					x: 0,
					y: 8
				}
			},
			{
				id: "b1",
				team: "B",
				position: {
					x: 9,
					y: 2
				}
			},
			{
				id: "b2",
				team: "B",
				position: {
					x: 9,
					y: 5
				}
			},
			{
				id: "b3",
				team: "B",
				position: {
					x: 9,
					y: 8
				}
			}
		]),
		isFinished: false,
		winner: null
	};
}
function calculateInitialControlMap(players) {
	const controlMap = Array.from({ length: 10 }, () => Array(10).fill(null));
	const distMap = {
		A: Array.from({ length: 10 }, () => Array(10).fill(Infinity)),
		B: Array.from({ length: 10 }, () => Array(10).fill(Infinity))
	};
	for (const teamId of ["A", "B"]) {
		const queue = [];
		for (const p of players.filter((p) => p.team === teamId)) {
			queue.push({
				...p.position,
				d: 0
			});
			distMap[teamId][p.position.y][p.position.x] = 0;
		}
		while (queue.length > 0) {
			const { x, y, d } = queue.shift();
			for (const [dx, dy] of [
				[0, 1],
				[0, -1],
				[1, 0],
				[-1, 0]
			]) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
					if (distMap[teamId][ny][nx] > d + 1) {
						distMap[teamId][ny][nx] = d + 1;
						queue.push({
							x: nx,
							y: ny,
							d: d + 1
						});
					}
				}
			}
		}
	}
	for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
		const dA = distMap.A[y][x];
		const dB = distMap.B[y][x];
		if (dA === Infinity && dB === Infinity) continue;
		if (dA < dB) controlMap[y][x] = "A";
		else if (dB < dA) controlMap[y][x] = "B";
		else controlMap[y][x] = "CONTESTED";
	}
	return controlMap;
}
//#endregion
//#region ../../packages/protocols/v1/rules.ts
function resolveProtocolV1(config, state, actions) {
	const rng = new DeterministicRNG(state.rngState);
	const nextTeams = {
		A: {
			...state.teams.A,
			stats: {
				...state.teams.A.stats,
				despawns: { ...state.teams.A.stats.despawns }
			}
		},
		B: {
			...state.teams.B,
			stats: {
				...state.teams.B.stats,
				despawns: { ...state.teams.B.stats.despawns }
			}
		}
	};
	const players = state.players.map((p) => ({
		...p,
		stats: { ...p.stats }
	}));
	let pointZones = state.pointZones.map((pz) => ({ ...pz }));
	let nextZoneSpawnTick = state.nextZoneSpawnTick;
	const lastEvents = [];
	const nextState = {
		...state,
		tick: state.tick + 1,
		teams: nextTeams,
		players,
		pointZones,
		nextZoneSpawnTick,
		lastEvents
	};
	const controlMap = Array.from({ length: 10 }, () => Array(10).fill(null));
	const distMap = {
		A: Array.from({ length: 10 }, () => Array(10).fill(Infinity)),
		B: Array.from({ length: 10 }, () => Array(10).fill(Infinity))
	};
	for (const teamId of ["A", "B"]) {
		const queue = [];
		for (const p of players.filter((p) => p.team === teamId && p.status === "active")) {
			queue.push({
				...p.position,
				d: 0
			});
			distMap[teamId][p.position.y][p.position.x] = 0;
		}
		while (queue.length > 0) {
			const { x, y, d } = queue.shift();
			for (const [dx, dy] of [
				[0, 1],
				[0, -1],
				[1, 0],
				[-1, 0]
			]) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
					if (distMap[teamId][ny][nx] > d + 1) {
						distMap[teamId][ny][nx] = d + 1;
						queue.push({
							x: nx,
							y: ny,
							d: d + 1
						});
					}
				}
			}
		}
	}
	let countA = 0;
	let countB = 0;
	let countContested = 0;
	for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
		const dA = distMap.A[y][x];
		const dB = distMap.B[y][x];
		if (dA === Infinity && dB === Infinity) continue;
		if (dA < dB) {
			controlMap[y][x] = "A";
			countA++;
		} else if (dB < dA) {
			controlMap[y][x] = "B";
			countB++;
		} else {
			controlMap[y][x] = "CONTESTED";
			countContested++;
		}
	}
	const totalTiles = 100;
	nextTeams.A.stats.controlPercentage = countA / totalTiles;
	nextTeams.B.stats.controlPercentage = countB / totalTiles;
	nextTeams.A.stats.contestedPercentage = countContested / totalTiles;
	nextTeams.B.stats.contestedPercentage = countContested / totalTiles;
	nextTeams.A.stats.oppositionPercentage = countB / totalTiles;
	nextTeams.B.stats.oppositionPercentage = countA / totalTiles;
	const updateAvg = (currentAvg, newVal, tick) => (currentAvg * (tick - 1) + newVal) / tick;
	nextTeams.A.stats.averageControlPercentage = updateAvg(nextTeams.A.stats.averageControlPercentage, nextTeams.A.stats.controlPercentage, nextState.tick);
	nextTeams.B.stats.averageControlPercentage = updateAvg(nextTeams.B.stats.averageControlPercentage, nextTeams.B.stats.controlPercentage, nextState.tick);
	nextTeams.A.stats.averageContestedPercentage = updateAvg(nextTeams.A.stats.averageContestedPercentage, nextTeams.A.stats.contestedPercentage, nextState.tick);
	nextTeams.B.stats.averageContestedPercentage = updateAvg(nextTeams.B.stats.averageContestedPercentage, nextTeams.B.stats.contestedPercentage, nextState.tick);
	nextTeams.A.stats.averageOppositionPercentage = updateAvg(nextTeams.A.stats.averageOppositionPercentage, nextTeams.A.stats.oppositionPercentage, nextState.tick);
	nextTeams.B.stats.averageOppositionPercentage = updateAvg(nextTeams.B.stats.averageOppositionPercentage, nextTeams.B.stats.oppositionPercentage, nextState.tick);
	pointZones.forEach((pz) => pz.age += 1);
	const survivingZones = [];
	for (const pz of pointZones) if (pz.age < pz._despawnAge) survivingZones.push(pz);
	else {
		const owner = controlMap[pz.position.y][pz.position.x];
		if (owner === "A") nextTeams.A.stats.despawns.expected += 1;
		else if (owner === "B") nextTeams.B.stats.despawns.expected += 1;
		else if (owner === "CONTESTED") {
			nextTeams.A.stats.despawns.contested += 1;
			nextTeams.B.stats.despawns.contested += 1;
		} else {
			nextTeams.A.stats.despawns.opposed += 1;
			nextTeams.B.stats.despawns.opposed += 1;
		}
	}
	pointZones = survivingZones;
	if (nextZoneSpawnTick !== null && nextState.tick >= nextZoneSpawnTick) {
		if (pointZones.length < config.maxPointZones) {
			const occupied = new Set(players.filter((p) => p.status !== "knocked_out").map((p) => `${p.position.x},${p.position.y}`));
			const available = [];
			for (let _y = 0; _y < 10; _y++) for (let _x = 0; _x < 10; _x++) if (!occupied.has(`${_x},${_y}`)) available.push({
				x: _x,
				y: _y
			});
			if (available.length > 0) {
				const spawnPos = available[Math.floor(rng.next() * available.length)];
				const x = spawnPos.x;
				const y = spawnPos.y;
				const spanRange = (config.pointZoneMaxAge ?? 40) - (config.pointZoneMinAge ?? 20);
				const lifespan = (config.pointZoneMinAge ?? 20) + Math.floor(rng.next() * (spanRange + 1));
				pointZones.push({
					position: {
						x,
						y
					},
					age: 0,
					_despawnAge: lifespan
				});
				const owner = controlMap[y][x];
				if (owner === "A") {
					nextTeams.A.stats.expectedSpawns += 1;
					nextTeams.A.stats.luckScore += 1 - nextTeams.A.stats.controlPercentage;
					nextTeams.B.stats.luckScore += 0 - nextTeams.B.stats.controlPercentage;
				} else if (owner === "B") {
					nextTeams.B.stats.expectedSpawns += 1;
					nextTeams.B.stats.luckScore += 1 - nextTeams.B.stats.controlPercentage;
					nextTeams.A.stats.luckScore += 0 - nextTeams.A.stats.controlPercentage;
				} else if (owner === "CONTESTED") {
					nextTeams.A.stats.contestedSpawns += 1;
					nextTeams.B.stats.contestedSpawns += 1;
				} else {
					nextTeams.A.stats.opposedSpawns += 1;
					nextTeams.B.stats.opposedSpawns += 1;
				}
			}
		}
		nextZoneSpawnTick = nextState.tick + config.pointZoneSpawnRate;
	}
	for (const player of players) if (player.status === "stunned" && player.stunTicks && player.stunTicks > 0) {
		player.stunTicks -= 1;
		if (player.stunTicks === 0) player.status = "active";
	}
	const intents = /* @__PURE__ */ new Map();
	const wallHits = /* @__PURE__ */ new Set();
	for (const player of players) {
		const target = { ...player.position };
		if (player.status === "active") {
			const action = actions.find((a) => a.playerId === player.id);
			if (action?.type === "MOVE" && action.direction) {
				let moved = false;
				if (action.direction === "UP") if (target.y > 0) {
					target.y -= 1;
					moved = true;
				} else wallHits.add(player.id);
				if (action.direction === "DOWN") if (target.y < 9) {
					target.y += 1;
					moved = true;
				} else wallHits.add(player.id);
				if (action.direction === "LEFT") if (target.x > 0) {
					target.x -= 1;
					moved = true;
				} else wallHits.add(player.id);
				if (action.direction === "RIGHT") if (target.x < 9) {
					target.x += 1;
					moved = true;
				} else wallHits.add(player.id);
				if (moved) player.stats.squaresMoved += 1;
				else if (wallHits.has(player.id)) {} else player.stats.idleTicks += 1;
			} else player.stats.idleTicks += 1;
		} else player.stats.idleTicks += 1;
		intents.set(player.id, target);
	}
	let changed = true;
	const resolvedPositions = new Map(intents);
	const newlyStunned = /* @__PURE__ */ new Set();
	const collisionPartners = /* @__PURE__ */ new Map();
	for (const pid of wallHits) newlyStunned.add(pid);
	while (changed) {
		changed = false;
		const tileOccupancy = /* @__PURE__ */ new Map();
		for (const [pid, pos] of resolvedPositions) {
			const key = `${pos.x},${pos.y}`;
			if (!tileOccupancy.has(key)) tileOccupancy.set(key, []);
			tileOccupancy.get(key).push(pid);
		}
		for (const [pid, targetPos] of resolvedPositions) {
			const originalPos = players.find((p) => p.id === pid).position;
			const key = `${targetPos.x},${targetPos.y}`;
			const occupants = tileOccupancy.get(key);
			if (occupants.length > 1) {
				if (targetPos.x !== originalPos.x || targetPos.y !== originalPos.y) {
					resolvedPositions.set(pid, { ...originalPos });
					newlyStunned.add(pid);
					if (!collisionPartners.has(pid)) collisionPartners.set(pid, []);
					collisionPartners.get(pid).push(...occupants.filter((o) => o !== pid));
					changed = true;
					continue;
				}
			}
			const currentOccupantsAtTarget = players.filter((p) => p.position.x === targetPos.x && p.position.y === targetPos.y);
			for (const occupant of currentOccupantsAtTarget) {
				const occupantTarget = resolvedPositions.get(occupant.id);
				if (occupantTarget.x === originalPos.x && occupantTarget.y === originalPos.y) {
					if (targetPos.x !== originalPos.x || targetPos.y !== originalPos.y) {
						resolvedPositions.set(pid, { ...originalPos });
						newlyStunned.add(pid);
						if (!collisionPartners.has(pid)) collisionPartners.set(pid, []);
						collisionPartners.get(pid).push(occupant.id);
						changed = true;
					}
				}
			}
		}
	}
	for (const player of players) {
		player.position = resolvedPositions.get(player.id);
		if (newlyStunned.has(player.id)) {
			player.status = "stunned";
			player.stunTicks = config.stunPenaltyTicks;
			lastEvents.push({
				type: "STUN",
				playerId: player.id,
				position: { ...player.position }
			});
			if ((collisionPartners.get(player.id) || []).some((partnerId) => newlyStunned.has(partnerId))) player.stats.mutualStuns += 1;
			else player.stats.singleStuns += 1;
		}
	}
	const zonesToKeep = [];
	for (const pz of pointZones) {
		const capturers = players.filter((p) => p.position.x === pz.position.x && p.position.y === pz.position.y);
		if (capturers.length > 0) {
			const winner = capturers[0];
			const team = nextTeams[winner.team];
			const scoreAwarded = config.pointZoneValue === 0 ? Math.max(1, pz.age) : config.pointZoneValue;
			team.score += scoreAwarded;
			team.stats.totalCaptures += 1;
			team.stats.averagePointsPerCapture = team.score / team.stats.totalCaptures;
			lastEvents.push({
				type: "CAPTURE",
				team: winner.team,
				score: scoreAwarded,
				position: { ...pz.position }
			});
			const owner = controlMap[pz.position.y][pz.position.x];
			if (owner === winner.team) winner.stats.expectedCaptures += 1;
			else if (owner === "CONTESTED") winner.stats.contestedCaptures += 1;
			else winner.stats.stolenCaptures += 1;
			winner.stats.pointsScored += scoreAwarded;
		} else zonesToKeep.push(pz);
	}
	pointZones = zonesToKeep;
	nextState.pointZones = pointZones;
	nextState.nextZoneSpawnTick = nextZoneSpawnTick;
	nextState.rngState = rng.getState();
	nextState.controlMap = controlMap;
	let gameOver = false;
	if (nextState.tick >= config.maxGameTicks) if (config.overtimeAllowed && pointZones.length > 0) gameOver = false;
	else gameOver = true;
	if (gameOver) {
		nextState.isFinished = true;
		if (nextTeams.A.score > nextTeams.B.score) nextState.winner = "A";
		else if (nextTeams.B.score > nextTeams.A.score) nextState.winner = "B";
		else nextState.winner = null;
	}
	return nextState;
}
//#endregion
//#region ../../packages/protocols/v1/league.ts
/**
* Generates a round-robin schedule for the given teams.
* In V1, each team plays every other team `gamesPerSeason` times.
*/
function generateScheduleV1(config, teams, startDate) {
	const matches = [];
	const teamIds = teams.map((t) => t.id);
	let matchCount = 0;
	for (let round = 0; round < config.gamesPerSeason; round++) for (let i = 0; i < teamIds.length; i++) for (let j = i + 1; j < teamIds.length; j++) {
		const scheduledTime = new Date(startDate);
		scheduledTime.setDate(scheduledTime.getDate() + matchCount);
		scheduledTime.setHours(10, 0, 0, 0);
		matches.push({
			home_team_id: teamIds[i],
			away_team_id: teamIds[j],
			scheduled_time: scheduledTime.toISOString(),
			status: "pending"
		});
		matchCount++;
	}
	return matches;
}
/**
* Calculates standings based on match results.
* 3 points for win, 1 for tie, 0 for loss.
*/
function resolveStandingsV1(config, matches, teams) {
	const standings = {};
	const seasonPlayerStats = {};
	if (teams) for (const t of teams) {
		standings[t.id] = {
			wins: 0,
			losses: 0,
			ties: 0,
			points: 0,
			statPoints: 0,
			statAwards: []
		};
		for (let i = 1; i <= 3; i++) seasonPlayerStats[`${t.id}_${i}`] = {
			teamId: t.id,
			unitIndex: String(i),
			stats: {}
		};
	}
	for (const match of matches) {
		if (match.status !== "simulated" && match.status !== "published" && match.status !== "played" && match.status !== "simmed") continue;
		if (!standings[match.home_team_id]) standings[match.home_team_id] = {
			wins: 0,
			losses: 0,
			ties: 0,
			points: 0,
			statPoints: 0,
			statAwards: []
		};
		if (!standings[match.away_team_id]) standings[match.away_team_id] = {
			wins: 0,
			losses: 0,
			ties: 0,
			points: 0,
			statPoints: 0,
			statAwards: []
		};
		if (match.winner_id === match.home_team_id) {
			standings[match.home_team_id].wins++;
			standings[match.home_team_id].points += 3;
			standings[match.away_team_id].losses++;
		} else if (match.winner_id === match.away_team_id) {
			standings[match.away_team_id].wins++;
			standings[match.away_team_id].points += 3;
			standings[match.home_team_id].losses++;
		} else {
			standings[match.home_team_id].ties++;
			standings[match.home_team_id].points += 1;
			standings[match.away_team_id].ties++;
			standings[match.away_team_id].points += 1;
		}
		if (match.stats && match.stats.players) for (const p of match.stats.players) {
			const teamId = p.team === "A" ? match.home_team_id : match.away_team_id;
			const unitIndex = p.id.replace(/^[ab]/, "");
			const playerKey = `${teamId}_${unitIndex}`;
			if (!seasonPlayerStats[playerKey]) seasonPlayerStats[playerKey] = {
				teamId,
				unitIndex,
				stats: {}
			};
			for (const statKey in p.stats) seasonPlayerStats[playerKey].stats[statKey] = (seasonPlayerStats[playerKey].stats[statKey] || 0) + p.stats[statKey];
		}
	}
	const statKeys = [
		"squaresMoved",
		"idleTicks",
		"singleStuns",
		"mutualStuns",
		"expectedCaptures",
		"contestedCaptures",
		"stolenCaptures",
		"pointsScored"
	];
	const playerAwards = [];
	for (const key of statKeys) {
		let maxVal = -Infinity;
		let minVal = Infinity;
		for (const playerKey in seasonPlayerStats) {
			const val = seasonPlayerStats[playerKey].stats[key] || 0;
			if (val > maxVal) maxVal = val;
			if (val < minVal) minVal = val;
		}
		if (maxVal === -Infinity || minVal === Infinity) continue;
		const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
		const maxTeams = /* @__PURE__ */ new Set();
		const minTeams = /* @__PURE__ */ new Set();
		const maxPlayersList = [];
		const minPlayersList = [];
		for (const playerKey in seasonPlayerStats) {
			const player = seasonPlayerStats[playerKey];
			const val = player.stats[key] || 0;
			if (val === maxVal) {
				maxTeams.add(player.teamId);
				maxPlayersList.push({
					teamId: player.teamId,
					unitIndex: player.unitIndex
				});
			}
			if (val === minVal) {
				minTeams.add(player.teamId);
				minPlayersList.push({
					teamId: player.teamId,
					unitIndex: player.unitIndex
				});
			}
		}
		if (maxPlayersList.length > 0) playerAwards.push({
			statName: key,
			formattedKey,
			type: "Most",
			value: maxVal,
			players: maxPlayersList
		});
		if (minPlayersList.length > 0) playerAwards.push({
			statName: key,
			formattedKey,
			type: "Least",
			value: minVal,
			players: minPlayersList
		});
		maxTeams.forEach((teamId) => {
			if (standings[teamId]) {
				standings[teamId].points += 1;
				standings[teamId].statPoints += 1;
				standings[teamId].statAwards.push(`Most ${formattedKey}`);
			}
		});
		minTeams.forEach((teamId) => {
			if (standings[teamId]) {
				standings[teamId].points += 1;
				standings[teamId].statPoints += 1;
				standings[teamId].statAwards.push(`Least ${formattedKey}`);
			}
		});
	}
	return {
		standings,
		playerAwards,
		seasonPlayerStats
	};
}
//#endregion
//#region ../../packages/protocols/registry.ts
var registry = { v1: {
	version: "v1",
	name: "Protocol V1: Capture the Core",
	description: `A 3v3 tactical capture game on a 10x10 grid.
Teams spawn on opposite edges.
Point zones spawn randomly and age each tick. A point zone despawns if its age reaches a hidden limit!
Capturing a point zone grants points equal to its age at the time of capture. Wait longer for more points, but risk it vanishing!
Colliding players are stunned for 3 ticks.
Orthogonal movement only.`,
	defaultConfig: defaultV1Config,
	createInitialState: createInitialStateV1,
	resolve: resolveProtocolV1,
	generateSchedule: generateScheduleV1,
	resolveStandings: resolveStandingsV1
} };
function getProtocol(version) {
	const protocol = registry[version];
	if (!protocol) throw new Error(`Protocol version ${version} not found in registry.`);
	return protocol;
}
//#endregion
export { getProtocol as t };
