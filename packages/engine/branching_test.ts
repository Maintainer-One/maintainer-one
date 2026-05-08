import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { tick, createInitialState } from './core.ts';
import { DeterministicRNG } from './random.ts';

Deno.test('Engine: Branching Determinism - Team RNG states should persist across ticks', () => {
    const seed = 12345;
    // Initial state should have rngStateA/B initialized (via v1/state.ts)
    const state0 = createInitialState(seed);
    
    assertEquals(typeof state0.rngStateA, 'number');
    assertEquals(typeof state0.rngStateB, 'number');

    // Worker setup for Tick 0
    const teamA_RNG = new DeterministicRNG(state0.rngStateA!);
    
    // Team A logic consumes some entropy
    const roll1 = teamA_RNG.next();
    const roll2 = teamA_RNG.next();
    
    // Run tick and update states (as worker does)
    const state1 = tick(state0, []);
    state1.rngStateA = teamA_RNG.getState();
    state1.rngStateB = state0.rngStateB; // No change for B

    // --- BRANCHING POINT ---
    
    // New worker starts from state1
    const branched_teamA_RNG = new DeterministicRNG(state1.rngStateA!);
    const branched_roll = branched_teamA_RNG.next();
    
    // Original worker continues
    const original_roll = teamA_RNG.next();
    
    // They must be identical
    assertEquals(branched_roll, original_roll);
    assertEquals(branched_roll !== roll1, true);
    assertEquals(branched_roll !== roll2, true);
});
