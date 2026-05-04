import SimWorker from '$lib/workers/sim.worker?worker';
import { supabase } from '$lib/supabase';
import { createInitialState } from '$packages/engine/core';
import type { GameState } from '$packages/engine/types';

export async function runSimulation(match: any): Promise<GameState[]> {
	const homeVersionId = match.home_code_version_id || match.home_override_version_id || match.home_team.active_version_id;
	const awayVersionId = match.away_code_version_id || match.away_override_version_id || match.away_team.active_version_id;

	const { data: versions } = await supabase
		.from('team_code_versions')
		.select('id, compiled_code')
		.in('id', [homeVersionId, awayVersionId]);

	if (!versions || versions.length < 2) {
		throw new Error('Team code versions not found');
	}

	const homeV = versions.find(v => v.id === homeVersionId)!;
	const awayV = versions.find(v => v.id === awayVersionId)!;

	const initialState = createInitialState(
		Number(match.seed), 
		match.seasons?.protocol_version || match.leagues.protocol_version, 
		match.seasons?.protocol_config ?? match.leagues.protocol_config, 
		{ A: match.home_team, B: match.away_team }
	);

	return new Promise((resolve) => {
		const worker = new SimWorker();
		worker.onmessage = (e) => {
			if (e.data.type === 'SIMULATION_COMPLETE') {
				resolve(e.data.states);
				worker.terminate();
			}
		};
		worker.postMessage({
			type: 'SIMULATE_BRANCH',
			startState: initialState,
			alphaCompiled: homeV.compiled_code,
			bravoCompiled: awayV.compiled_code,
			maxTicks: 1000
		});
	});
}
