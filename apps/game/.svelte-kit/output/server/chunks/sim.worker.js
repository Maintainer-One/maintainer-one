//#region src/lib/workers/sim.worker.ts?worker
function WorkerWrapper(options) {
	return new Worker("/_app/immutable/workers/sim.worker-DeB70_5a.js", { name: options?.name });
}
//#endregion
export { WorkerWrapper as t };
