import { n as supabase } from "./supabase.js";
import { t as WorkerWrapper } from "./sim.worker.js";
import { t as createInitialState } from "./core.js";
//#region src/lib/simulation.ts
async function runSimulation(match) {
	const homeVersionId = match.home_code_version_id || match.home_override_version_id || match.home_team.active_version_id;
	const awayVersionId = match.away_code_version_id || match.away_override_version_id || match.away_team.active_version_id;
	const { data: versions } = await supabase.from("team_code_versions").select("id, compiled_code").in("id", [homeVersionId, awayVersionId]);
	if (!versions || versions.length < 2) throw new Error("Team code versions not found");
	const homeV = versions.find((v) => v.id === homeVersionId);
	const awayV = versions.find((v) => v.id === awayVersionId);
	const config = match.seasons?.protocol_config ?? match.leagues.protocol_config;
	const maxTicks = (config?.maxGameTicks || 100) + (config?.overtimeAllowed ? config?.pointZoneMaxAge || 40 : 0) + 100;
	const seed = match.seed ?? match.public_seed;
	if (seed === void 0 || seed === null) throw new Error("Match seed not revealed yet");
	const initialState = createInitialState(Number(seed), match.seasons?.protocol_version || match.leagues.protocol_version, config, {
		A: match.home_team,
		B: match.away_team
	});
	return new Promise((resolve) => {
		const worker = new WorkerWrapper();
		worker.onmessage = (e) => {
			if (e.data.type === "SIMULATION_COMPLETE") {
				resolve(e.data.states);
				worker.terminate();
			}
		};
		worker.postMessage({
			type: "SIMULATE_BRANCH",
			startState: JSON.parse(JSON.stringify(initialState)),
			alphaCompiled: homeV.compiled_code,
			bravoCompiled: awayV.compiled_code,
			maxTicks,
			config: config ? JSON.parse(JSON.stringify(config)) : void 0
		});
	});
}
//#endregion
export { runSimulation as t };
