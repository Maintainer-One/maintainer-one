import type { GameState } from '$packages/engine/types';

export type CodeBlock = {
	startTick: number;
	endTick: number | null;
	code: string;
	compiled?: string;
};

export type Timeline = {
	id: string;
	name: string;
	states: GameState[];
	color: string;
	parentId: string | null;
	draftId?: string;
	blocks: {
		A: CodeBlock[];
		B: CodeBlock[];
	};
};
