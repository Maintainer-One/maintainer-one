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
	status: 'active' | 'knocked_out';
};

export type PointZone = {
	position: Position;
	points: number;
};

export type GameState = {
	tick: number;
	teams: Record<TeamID, { name: string; score: number }>;
	players: Player[];
	pointZone: PointZone | null;
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
