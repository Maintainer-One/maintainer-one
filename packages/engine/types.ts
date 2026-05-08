/**
 * Core types for the Maintainer One simulation engine.
 */

export type Position = {
	x: number;
	y: number;
};

export type TeamID = 'A' | 'B';

export type PlayerStats = {
	squaresMoved: number;
	idleTicks: number;
	singleStuns: number;
	mutualStuns: number;
	expectedCaptures: number;
	contestedCaptures: number;
	stolenCaptures: number;
	pointsScored: number;
};

export type Player = {
	id: string;
	team: TeamID;
	position: Position;
	status: 'active' | 'stunned' | 'knocked_out';
	stunTicks?: number;
	stats: PlayerStats;
};

export type PointZone = {
	position: Position;
	age: number;
	_despawnAge: number; // Hidden from logic, despawns when age >= _despawnAge
};

export type TeamStats = {
	controlPercentage: number;
	averageControlPercentage: number;
	contestedPercentage: number;
	averageContestedPercentage: number;
	oppositionPercentage: number;
	averageOppositionPercentage: number;
	expectedSpawns: number;
	contestedSpawns: number;
	opposedSpawns: number;
	despawns: {
		expected: number;
		contested: number;
		opposed: number;
	};
	luckScore: number;
	totalCaptures: number;
	averagePointsPerCapture: number;
};

export type GameEvent = {
	type: 'CAPTURE';
	team: TeamID;
	score: number;
	position: Position;
} | {
	type: 'STUN';
	playerId: string;
	position: Position;
};

export type GameState = {
	tick: number;
	protocolVersion: string;
	teams: Record<TeamID, { name: string; score: number; color: string; stats: TeamStats }>;
	players: Player[];
	pointZones: PointZone[];
	nextZoneSpawnTick: number | null;
	rngState: number; // The seed/state for the next random call
	rngStateA?: number; // Siloed PRNG state for Team A
	rngStateB?: number; // Siloed PRNG state for Team B
	isFinished: boolean;
	winner: TeamID | null;
	controlMap?: (TeamID | 'CONTESTED' | null)[][];
	lastEvents?: GameEvent[];
};

export type ActionType = 'MOVE' | 'STAY';
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type PlayerAction = {
	playerId: string;
	type: ActionType;
	direction?: Direction;
};
