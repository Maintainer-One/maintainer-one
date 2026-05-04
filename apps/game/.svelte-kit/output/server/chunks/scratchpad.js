import { M as writable } from "./index-server.js";
import "./index-server2.js";
//#region src/lib/stores/scratchpad.ts
/**
* A simple persistence-backed store for the team logic scratchpad.
* Prevents code loss on page refresh.
*/
function createScratchpad() {
	const { subscribe, set, update } = writable({
		A: "",
		B: ""
	});
	return {
		subscribe,
		updateCode: (team, code) => {
			update((s) => {
				return {
					...s,
					[team]: code
				};
			});
		},
		reset: () => {
			set({
				A: "",
				B: ""
			});
		}
	};
}
var scratchpad = createScratchpad();
//#endregion
export { scratchpad as t };
