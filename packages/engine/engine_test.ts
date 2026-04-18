import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { createInitialState, tick } from './core.ts';
import type { PlayerAction } from './types.ts';

Deno.test('Engine: Determinism - Same seed and actions should produce same state', () => {
	const actions: PlayerAction[] = [
		{ playerId: 'a1', type: 'MOVE', direction: 'RIGHT' },
		{ playerId: 'b1', type: 'MOVE', direction: 'LEFT' }
	];

	const state1 = tick(createInitialState(123), actions);
	const state2 = tick(createInitialState(123), actions);

	assertEquals(JSON.stringify(state1), JSON.stringify(state2));
});

Deno.test('Protocol V1: Simple Collision - Two players moving to same tile should revert', () => {
	let state = createInitialState(123);
	// Manually place two players near each other
	state.players[0].position = { x: 4, y: 4 };
	state.players[3].position = { x: 6, y: 4 };

	const actions: PlayerAction[] = [
		{ playerId: 'a1', type: 'MOVE', direction: 'RIGHT' }, // moves to (5,4)
		{ playerId: 'b1', type: 'MOVE', direction: 'LEFT' }   // moves to (5,4)
	];

	state = tick(state, actions);

	assertEquals(state.players[0].position, { x: 4, y: 4 });
	assertEquals(state.players[3].position, { x: 6, y: 4 });
});

Deno.test('Protocol V1: Tile Swap - Players swapping places should revert', () => {
	let state = createInitialState(123);
	state.players[0].position = { x: 4, y: 4 };
	state.players[3].position = { x: 5, y: 4 };

	const actions: PlayerAction[] = [
		{ playerId: 'a1', type: 'MOVE', direction: 'RIGHT' }, // tries to go to (5,4)
		{ playerId: 'b1', type: 'MOVE', direction: 'LEFT' }   // tries to go to (4,4)
	];

	state = tick(state, actions);

	assertEquals(state.players[0].position, { x: 4, y: 4 });
	assertEquals(state.players[3].position, { x: 5, y: 4 });
});

Deno.test('Protocol V1: Cascading Collision - One collision halts a chain', () => {
	let state = createInitialState(123);
	// A(4,4) -> (5,4)
	// B(5,4) -> (6,4)
	// C(7,4) -> (6,4) <-- COLLISION with B
	state.players[0].id = 'A'; state.players[0].position = { x: 4, y: 4 };
	state.players[1].id = 'B'; state.players[1].position = { x: 5, y: 4 };
	state.players[3].id = 'C'; state.players[3].position = { x: 7, y: 4 };

	const actions: PlayerAction[] = [
		{ playerId: 'A', type: 'MOVE', direction: 'RIGHT' }, // target (5,4)
		{ playerId: 'B', type: 'MOVE', direction: 'RIGHT' }, // target (6,4)
		{ playerId: 'C', type: 'MOVE', direction: 'LEFT' }   // target (6,4)
	];

	state = tick(state, actions);

	// B and C collided at (6,4), so both reverted.
	// B reverted to (5,4).
	// Because B is now at (5,4), A (moving to 5,4) must also revert.
	assertEquals(state.players.find(p => p.id === 'A')?.position, { x: 4, y: 4 });
	assertEquals(state.players.find(p => p.id === 'B')?.position, { x: 5, y: 4 });
	assertEquals(state.players.find(p => p.id === 'C')?.position, { x: 7, y: 4 });
});

Deno.test('Protocol V1: Teammate Collision - Should revert just like opponents', () => {
	let state = createInitialState(123);
	state.players[0].position = { x: 4, y: 4 };
	state.players[1].position = { x: 4, y: 6 };

	const actions: PlayerAction[] = [
		{ playerId: 'a1', type: 'MOVE', direction: 'DOWN' }, // target (4,5)
		{ playerId: 'a2', type: 'MOVE', direction: 'UP' }     // target (4,5)
	];

	state = tick(state, actions);

	assertEquals(state.players[0].position, { x: 4, y: 4 });
	assertEquals(state.players[1].position, { x: 4, y: 6 });
});
