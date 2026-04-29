import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getProtocol, listProtocols } from "../protocols/registry.ts";
import { loadLogicFromString } from "./logic_loader.ts";
import { simulateMatch } from "./match_runner.ts";
import { createInitialState } from "./core.ts";

Deno.test("Phase 3: Protocol Registry", () => {
    const protocols = listProtocols();
    assertEquals(protocols.includes("v1"), true, "v1 should be in the registry");
    
    const v1 = getProtocol("v1");
    assertEquals(v1.version, "v1");
    assertEquals(v1.name, "Protocol V1: Capture the Core");
    
    assertThrows(() => {
        getProtocol("non_existent_protocol");
    });
});

Deno.test("Phase 3: Dynamic Logic Loading", () => {
    // A simple logic string that always returns a MOVE RIGHT for player a1
    const logicCode = `
        const teamLogic = (sense) => {
            return [{ playerId: 'a1', type: 'MOVE', direction: 'RIGHT' }];
        };
        return teamLogic(sense);
    `;
    
    const logic = loadLogicFromString(logicCode);
    const state = createInitialState(123, "v1");
    // Simulate what match_runner does: strip hidden vars
    const sense = {
        ...state,
        pointZones: state.pointZones.map(pz => {
            const { _despawnAge, ...visible } = pz;
            return visible;
        })
    };
    const actions = logic(sense);
    
    assertEquals(actions.length, 1);
    assertEquals(actions[0].playerId, "a1");
    assertEquals(actions[0].direction, "RIGHT");
});

Deno.test("Phase 3: End-to-End Simulation Integration", async () => {
    const homeLogicCode = `
        const teamLogic = (sense) => {
            // Simple logic: everyone stays
            return sense.players.filter(p => p.team === 'A').map(p => ({ playerId: p.id, type: 'STAY' }));
        };
        return teamLogic(sense);
    `;
    
    const awayLogicCode = `
        const teamLogic = (sense) => {
            // Simple logic: everyone stays
            return sense.players.filter(p => p.team === 'B').map(p => ({ playerId: p.id, type: 'STAY' }));
        };
        return teamLogic(sense);
    `;
    
    const homeLogic = loadLogicFromString(homeLogicCode);
    const awayLogic = loadLogicFromString(awayLogicCode);
    
    const { finalState, replay } = await simulateMatch(
        456, 
        "v1", 
        homeLogic, 
        awayLogic
    );
    
    assertEquals(finalState.protocolVersion, "v1");
    assertEquals(finalState.tick > 0, true);
    assertEquals(replay?.length! > 1, true);
    // Since everyone stays, scores should be 0
    assertEquals(finalState.teams.A.score, 0);
    assertEquals(finalState.teams.B.score, 0);
});

Deno.test("Phase 3: Logic Loader Error Handling", () => {
    const invalidCode = "this is not valid javascript {{{{";
    const logic = loadLogicFromString(invalidCode);
    
    const state = createInitialState(123, "v1");
    const sense = {
        ...state,
        pointZones: state.pointZones.map(pz => {
            const { _despawnAge, ...visible } = pz;
            return visible;
        })
    };
    const actions = logic(sense);
    
    // Should return an empty array instead of crashing
    assertEquals(Array.isArray(actions), true);
    assertEquals(actions.length, 0);
});
