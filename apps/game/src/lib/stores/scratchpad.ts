import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface ScratchpadItem {
	id: string;
	name: string;
	code: string;
}

export type ScratchpadState = Record<string, ScratchpadItem[]>;

/**
 * A persistence-backed store for team-specific scratchpads.
 * Allows multiple named code drafts per team.
 */
function createScratchpad() {
	const initialValues: ScratchpadState = {};

	// Initialize from localStorage if in browser
	if (browser) {
		const saved = localStorage.getItem('m1_scratchpad_v2');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				Object.assign(initialValues, parsed);
			} catch (e) {
				console.error('Failed to parse scratchpad from localStorage', e);
			}
		}
	}

	const { subscribe, set, update } = writable(initialValues);

	const saveToLocalStorage = (state: ScratchpadState) => {
		if (browser) {
			localStorage.setItem('m1_scratchpad_v2', JSON.stringify(state));
		}
	};

	return {
		subscribe,
		getScratchpads: (teamId: string, state: ScratchpadState) => {
			return state[teamId] || [];
		},
		addScratchpad: (teamId: string, name: string, code: string) => {
			const newId = crypto.randomUUID();
			update(s => {
				const teamScratchpads = s[teamId] || [];
				const newItem: ScratchpadItem = {
					id: newId,
					name,
					code
				};
				const newState = { ...s, [teamId]: [...teamScratchpads, newItem] };
				saveToLocalStorage(newState);
				return newState;
			});
			return newId;
		},
		updateScratchpad: (teamId: string, scratchId: string, code: string) => {
			update(s => {
				const teamScratchpads = s[teamId] || [];
				const newState = {
					...s,
					[teamId]: teamScratchpads.map(item => 
						item.id === scratchId ? { ...item, code } : item
					)
				};
				saveToLocalStorage(newState);
				return newState;
			});
		},
		renameScratchpad: (teamId: string, scratchId: string, newName: string) => {
			update(s => {
				const teamScratchpads = s[teamId] || [];
				const newState = {
					...s,
					[teamId]: teamScratchpads.map(item => 
						item.id === scratchId ? { ...item, name: newName } : item
					)
				};
				saveToLocalStorage(newState);
				return newState;
			});
		},
		deleteScratchpad: (teamId: string, scratchId: string) => {
			update(s => {
				const teamScratchpads = s[teamId] || [];
				const newState = {
					...s,
					[teamId]: teamScratchpads.filter(item => item.id !== scratchId)
				};
				saveToLocalStorage(newState);
				return newState;
			});
		},
		reset: () => {
			set({});
			if (browser) {
				localStorage.removeItem('m1_scratchpad_v2');
			}
		}
	};
}

export const scratchpad = createScratchpad();
