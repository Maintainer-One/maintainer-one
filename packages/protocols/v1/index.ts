import type { ProtocolDefinition } from '../registry.ts';
import { defaultV1Config, type V1Config } from './config.ts';
import { createInitialStateV1 } from './state.ts';
import { resolveProtocolV1 } from './rules.ts';
import { generateScheduleV1, resolveStandingsV1 } from './league.ts';

export const ProtocolV1: ProtocolDefinition<V1Config> = {
    version: 'v1',
    name: 'Protocol V1: Capture the Core',
    description: `A 3v3 tactical capture game on a 10x10 grid.
Teams spawn on opposite edges.
Point zones spawn randomly and age each tick. A point zone despawns if its age reaches a hidden limit!
Capturing a point zone grants points equal to its age at the time of capture. Wait longer for more points, but risk it vanishing!
Colliding players are stunned for 3 ticks.
Orthogonal movement only.`,
    defaultConfig: defaultV1Config,
    createInitialState: createInitialStateV1,
    resolve: resolveProtocolV1,
    generateSchedule: generateScheduleV1,
    resolveStandings: resolveStandingsV1
};
