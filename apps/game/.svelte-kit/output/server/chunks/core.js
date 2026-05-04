import { t as getProtocol } from "./registry.js";
//#region ../../packages/engine/core.ts
/**
* Creates a fresh game state for a specific Protocol.
*/
function createInitialState(seed, protocolVersion = "v1", config, teams) {
	const protocol = getProtocol(protocolVersion);
	const activeConfig = config && Object.keys(config).length > 0 ? config : protocol.defaultConfig;
	return protocol.createInitialState(activeConfig, seed, teams);
}
//#endregion
export { createInitialState as t };
