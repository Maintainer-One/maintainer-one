//#region src/lib/workers/sim.worker.ts?worker
function WorkerWrapper(options) {
	return new Worker("/_app/immutable/workers/sim.worker-De86-9a-.js", { name: options?.name });
}
//#endregion
export { WorkerWrapper as t };
