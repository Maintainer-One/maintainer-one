import { createInitialState, tick } from '../packages/engine/core.ts';
import { defaultV1Config } from '../packages/protocols/v1/config.ts';

async function debugSim() {
    let state = createInitialState(12345, 'v1', defaultV1Config);
    console.log(`Initial tick: ${state.tick}, next spawn: ${state.nextZoneSpawnTick}`);
    
    for (let i = 0; i < 20; i++) {
        state = tick(state, [], defaultV1Config);
        console.log(`Tick ${state.tick}: Zones: ${state.pointZones.length}, Next spawn: ${state.nextZoneSpawnTick}`);
    }
}

debugSim();
