import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { DeterministicRNG } from './random.ts';

Deno.test('Engine: Entropy Isolation - XOR seeds should be distinct and deterministic', () => {
    const masterSeed = 123456;
    const teamA_seed = (masterSeed ^ 0xAAAAAAAA) >>> 0;
    const teamB_seed = (masterSeed ^ 0xBBBBBBBB) >>> 0;

    // Seeds should be distinct
    assertEquals(teamA_seed !== teamB_seed, true);
    assertEquals(teamA_seed !== masterSeed, true);

    // Seeds should produce different sequences
    const rngA = new DeterministicRNG(teamA_seed);
    const rngB = new DeterministicRNG(teamB_seed);
    const rngMaster = new DeterministicRNG(masterSeed);

    const valA = rngA.next();
    const valB = rngB.next();
    const valMaster = rngMaster.next();

    assertEquals(valA !== valB, true);
    assertEquals(valA !== valMaster, true);
    assertEquals(valB !== valMaster, true);

    // Same seed should produce identical sequences
    const rngA2 = new DeterministicRNG(teamA_seed);
    assertEquals(rngA2.next(), valA);
});
