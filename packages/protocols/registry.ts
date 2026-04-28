import { resolveProtocolV1 } from './v1/rules.ts';
import type { GameState, PlayerAction } from '../engine/types.ts';

export type ProtocolResolver = (state: GameState, actions: PlayerAction[]) => GameState;

export interface ProtocolDefinition {
	version: string;
	resolve: ProtocolResolver;
	boardSize: number;
}

const registry: Record<string, ProtocolDefinition> = {
	v1: {
		version: 'v1',
		resolve: resolveProtocolV1,
		boardSize: 10
	}
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
