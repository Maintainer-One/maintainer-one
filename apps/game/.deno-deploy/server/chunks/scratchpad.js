import { P as writable } from "./dev.js";
import "./index-server.js";
//#region src/lib/stores/scratchpad.ts
/**
* A persistence-backed store for team-specific scratchpads.
* Allows multiple named code drafts per team.
*/
function createScratchpad() {
	const { subscribe, set, update } = writable({});
	return {
		subscribe,
		getScratchpads: (teamId, state) => {
			return state[teamId] || [];
		},
		addScratchpad: (teamId, name, code) => {
			const newId = crypto.randomUUID();
			update((s) => {
				const teamScratchpads = s[teamId] || [];
				const newItem = {
					id: newId,
					name,
					code
				};
				return {
					...s,
					[teamId]: [...teamScratchpads, newItem]
				};
			});
			return newId;
		},
		updateScratchpad: (teamId, scratchId, code) => {
			update((s) => {
				const teamScratchpads = s[teamId] || [];
				return {
					...s,
					[teamId]: teamScratchpads.map((item) => item.id === scratchId ? {
						...item,
						code
					} : item)
				};
			});
		},
		renameScratchpad: (teamId, scratchId, newName) => {
			update((s) => {
				const teamScratchpads = s[teamId] || [];
				return {
					...s,
					[teamId]: teamScratchpads.map((item) => item.id === scratchId ? {
						...item,
						name: newName
					} : item)
				};
			});
		},
		deleteScratchpad: (teamId, scratchId) => {
			update((s) => {
				const teamScratchpads = s[teamId] || [];
				return {
					...s,
					[teamId]: teamScratchpads.filter((item) => item.id !== scratchId)
				};
			});
		},
		reset: () => {
			set({});
		}
	};
}
var scratchpad = createScratchpad();
//#endregion
export { scratchpad as t };
