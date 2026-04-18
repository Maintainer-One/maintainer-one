import type { GameState, PlayerAction, Position } from './types.ts';
export type { GameState, PlayerAction, Position };



/**
 * SensedState is the snapshot of the world that a Team Logic script receives.
 * For Protocol V1, this is equivalent to the GameState (Perfect Information).
 */
export type SensedState = GameState;

/**
 * TeamLogic is the functional interface for a team's automated behaviors.
 * It receives the current sensed state and returns an array of actions 
 * for its players.
 */
export type TeamLogic = (sense: SensedState) => PlayerAction[];
