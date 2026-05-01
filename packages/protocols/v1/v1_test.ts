import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resolveProtocolV1 } from "./rules.ts";
import { createInitialStateV1 } from "./state.ts";
import { defaultV1Config } from "./config.ts";

Deno.test("Protocol V1: Spawning Logic", () => {
    const config = { ...defaultV1Config, pointZoneSpawnRate: 5, maxPointZones: 1 };
    let state = createInitialStateV1(config, 12345);
    
    assertEquals(state.pointZones.length, 0, "Should start with no zones");
    assertEquals(state.nextZoneSpawnTick, 5, "Initial spawn tick should be 5");

    // Tick 1-4: No spawn
    for (let i = 1; i < 5; i++) {
        state = resolveProtocolV1(config, state, []);
        assertEquals(state.pointZones.length, 0, `Tick ${i}: Should not have spawned yet`);
    }

    // Tick 5: Spawn!
    state = resolveProtocolV1(config, state, []);
    assertEquals(state.pointZones.length, 1, "Tick 5: Should have spawned a zone");
    assertEquals(state.nextZoneSpawnTick, 10, "Next spawn should be scheduled for tick 10");
    
    // Tick 6-10: No more spawns because maxPointZones is 1
    for (let i = 6; i <= 10; i++) {
        state = resolveProtocolV1(config, state, []);
        assertEquals(state.pointZones.length, 1, "Should respect maxPointZones");
    }
});

Deno.test("Protocol V1: Despawning Logic", () => {
    const config = { ...defaultV1Config, pointZoneSpawnRate: 100, maxPointZones: 1 };
    let state = createInitialStateV1(config, 12345);
    
    // Inject a zone that is about to despawn
    state.pointZones = [
        { position: { x: 5, y: 5 }, age: 10, _despawnAge: 12 }
    ];

    // Tick 1: Age 10 -> 11
    state = resolveProtocolV1(config, state, []);
    assertEquals(state.pointZones.length, 1);
    assertEquals(state.pointZones[0].age, 11);

    // Tick 2: Age 11 -> 12. Should despawn (age >= _despawnAge)
    state = resolveProtocolV1(config, state, []);
    assertEquals(state.pointZones.length, 0, "Zone should have despawned");
});

Deno.test("Protocol V1: Collision & Stun Mechanics", () => {
    const config = { ...defaultV1Config, stunPenaltyTicks: 3 };
    let state = createInitialStateV1(config, 12345);
    
    // Position two players one tile apart
    state.players[0].position = { x: 2, y: 2 }; // a1
    state.players[1].position = { x: 4, y: 2 }; // a2
    
    // Move them toward each other to collide at (3, 2)
    const actions = [
        { playerId: 'a1', type: 'MOVE' as const, direction: 'RIGHT' as const },
        { playerId: 'a2', type: 'MOVE' as const, direction: 'LEFT' as const }
    ];

    state = resolveProtocolV1(config, state, actions);

    // Both should be back at original positions and stunned
    assertEquals(state.players[0].position, { x: 2, y: 2 });
    assertEquals(state.players[1].position, { x: 4, y: 2 });
    assertEquals(state.players[0].status, 'stunned');
    assertEquals(state.players[1].status, 'stunned');
    assertEquals(state.players[0].stunTicks, 3);
    
    // Verify stun decrement
    state = resolveProtocolV1(config, state, []);
    assertEquals(state.players[0].stunTicks, 2);
    assertEquals(state.players[0].status, 'stunned');
    
    state = resolveProtocolV1(config, state, []);
    state = resolveProtocolV1(config, state, []);
    assertEquals(state.players[0].stunTicks, 0);
    assertEquals(state.players[0].status, 'active', "Should be active after stun expires");
});

Deno.test("Protocol V1: Age-based Scoring", () => {
    const config = { ...defaultV1Config, pointZoneValue: 0 }; // 0 means age-based
    let state = createInitialStateV1(config, 12345);
    
    // Inject a zone and a player right next to it
    state.pointZones = [{ position: { x: 5, y: 5 }, age: 10, _despawnAge: 100 }];
    state.players[0].position = { x: 4, y: 5 }; // a1
    
    // Move player onto the zone
    const actions = [
        { playerId: 'a1', type: 'MOVE' as const, direction: 'RIGHT' as const }
    ];

    state = resolveProtocolV1(config, state, actions);

    // Note: Zone aging happens BEFORE movement resolution in rules.ts
    // Age 10 -> 11. Then capture happens.
    assertEquals(state.teams.A.score, 11, "Should award points equal to age (11)");
    assertEquals(state.pointZones.length, 0, "Zone should be removed after capture");
});
