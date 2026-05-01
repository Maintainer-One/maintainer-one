import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createInitialStateV1 } from "./state.ts";
import { resolveProtocolV1 } from "./rules.ts";
import type { V1Config } from "./config.ts";

import { defaultV1Config } from "./config.ts";

const defaultConfig = defaultV1Config;

Deno.test("Protocol V1: Stats - Board Control", () => {
    const state = createInitialStateV1(defaultConfig, 123);
    const nextState = resolveProtocolV1(defaultConfig, state, []);

    // Initial positions: 
    // Team A at x=0 (3 players)
    // Team B at x=9 (3 players)
    // Board 10x10.
    // Team A should control the left half, Team B the right half.
    
    assertEquals(nextState.teams.A.stats.controlPercentage, 0.5);
    assertEquals(nextState.teams.B.stats.controlPercentage, 0.5);
    assertEquals(nextState.teams.A.stats.contestedPercentage, 0);
});

Deno.test("Protocol V1: Stats - Wall Hit Stun", () => {
    const state = createInitialStateV1(defaultConfig, 123);
    // Player a1 is at {0, 2}. Try to move LEFT (off board).
    const actions = [{ playerId: 'a1', type: 'MOVE' as const, direction: 'LEFT' as const }];
    const nextState = resolveProtocolV1(defaultConfig, state, actions);

    const playerA1 = nextState.players.find(p => p.id === 'a1')!;
    assertEquals(playerA1.status, 'stunned');
    assertEquals(playerA1.stats.singleStuns, 1);
    assertEquals(playerA1.position, { x: 0, y: 2 });
});

Deno.test("Protocol V1: Stats - Mutual Stun", () => {
    const state = createInitialStateV1(defaultConfig, 123);
    // Move a1 {0, 2} RIGHT to {1, 2}
    // Move b1 {9, 2} LEFT to {8, 2}
    // This won't collide.
    // Let's teleport them closer for a collision.
    state.players[0].position = { x: 4, y: 2 };
    state.players[3].position = { x: 5, y: 2 };

    const actions = [
        { playerId: 'a1', type: 'MOVE' as const, direction: 'RIGHT' as const },
        { playerId: 'b1', type: 'MOVE' as const, direction: 'LEFT' as const }
    ];
    // Both move to {5, 2}? No, a1 moves to 5, b1 moves to 4. That's a swap!
    // Both move to same square:
    state.players[3].position = { x: 6, y: 2 };
    // a1 moves {4,2} -> {5,2}
    // b1 moves {6,2} -> {5,2}
    
    const nextState = resolveProtocolV1(defaultConfig, state, actions);

    const pA1 = nextState.players.find(p => p.id === 'a1')!;
    const pB1 = nextState.players.find(p => p.id === 'b1')!;

    assertEquals(pA1.status, 'stunned');
    assertEquals(pB1.status, 'stunned');
    assertEquals(pA1.stats.mutualStuns, 1);
    assertEquals(pB1.stats.mutualStuns, 1);
});

Deno.test("Protocol V1: Stats - Luck Score", () => {
    const configWithFastSpawn: V1Config = { ...defaultConfig, pointZoneSpawnRate: 1 };
    let state = createInitialStateV1(configWithFastSpawn, 123);
    
    // Control is 50/50.
    // Spawn a zone.
    state = resolveProtocolV1(configWithFastSpawn, state, []);
    
    // Check if a zone spawned and luck score updated
    if (state.pointZones.length > 0) {
        const luckA = state.teams.A.stats.luckScore;
        const luckB = state.teams.B.stats.luckScore;
        // Sum of luck should be 0 (approx due to float)
        assertEquals(Math.abs(luckA + luckB) < 0.0001, true);
        assertEquals(luckA !== 0, true);
    }
});
