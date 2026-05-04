import { ProtocolV1 } from './v1/index.ts';
import type { GameState, PlayerAction } from '../engine/types.ts';

export interface ProtocolDefinition<ConfigType = any> {
	version: string;
	name: string;
	description: string;
	defaultConfig: ConfigType;
	
	// --- LEAGUE MECHANICS ---
	generateSchedule: (config: ConfigType, teams: any[], startDate: Date) => any[];
	resolveStandings: (config: ConfigType, matches: any[], teams?: any[]) => any;

	// --- MATCH MECHANICS ---
	createInitialState: (config: ConfigType, seed: number, teams?: { A: any, B: any }) => GameState;
	resolve: (config: ConfigType, state: GameState, actions: PlayerAction[]) => GameState;
}

const registry: Record<string, ProtocolDefinition> = {
	v1: ProtocolV1
};

export function getProtocol(version: string): ProtocolDefinition {
	const protocol = registry[version];
	if (!protocol) {
		throw new Error(`Protocol version ${version} not found in registry.`);
	}
	return protocol;
}

export function listProtocols(): string[] {
	return Object.keys(registry);
}
