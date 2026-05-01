import type { GameState, PlayerAction, Position, PointZone } from './types.ts';
export type { GameState, PlayerAction, Position, PointZone };



export type SensedPointZone = Omit<PointZone, '_despawnAge'>;

/**
 * SensedState is the snapshot of the world that a Team Logic script receives.
 * For Protocol V1, this is equivalent to the GameState EXCEPT hidden variables like _despawnAge are stripped.
 */
export type SensedState = Omit<GameState, 'pointZones'> & {
	pointZones: SensedPointZone[];
	pointZone?: SensedPointZone; // Convenience for bots that only care about one zone
};

/**
 * TeamLogic is the functional interface for a team's automated behaviors.
 * It receives the current sensed state and returns an array of actions 
 * for its players.
 */
export type TeamLogic = (sense: SensedState) => PlayerAction[];
