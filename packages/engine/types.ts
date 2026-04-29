/**
 * Core types for the Maintainer One simulation engine.
 */

export type Position = {
	x: number;
	y: number;
};

export type TeamID = 'A' | 'B';

export type Player = {
	id: string;
	team: TeamID;
	position: Position;
	status: 'active' | 'stunned' | 'knocked_out';
	stunTicks?: number;
};

export type PointZone = {
	position: Position;
	age: number;
	_despawnAge: number; // Hidden from logic, despawns when age >= _despawnAge
};

export type GameState = {
	tick: number;
	protocolVersion: string;
	teams: Record<TeamID, { name: string; score: number }>;
	players: Player[];
	pointZones: PointZone[];
	nextZoneSpawnTick: number | null;
	rngState: number; // The seed/state for the next random call
	isFinished: boolean;
	winner: TeamID | null;
};

export type ActionType = 'MOVE' | 'STAY';
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type PlayerAction = {
	playerId: string;
	type: ActionType;
	direction?: Direction;
};
