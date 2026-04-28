import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * A simple persistence-backed store for the team logic scratchpad.
 * Prevents code loss on page refresh.
 */
function createScratchpad() {
	const initialValues = {
		A: '',
		B: ''
	};

	// Initialize from localStorage if in browser
	if (browser) {
		const saved = localStorage.getItem('m1_scratchpad');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				initialValues.A = parsed.A || '';
				initialValues.B = parsed.B || '';
			} catch (e) {
				console.error('Failed to parse scratchpad from localStorage', e);
			}
		}
	}

	const { subscribe, set, update } = writable(initialValues);

	return {
		subscribe,
		updateCode: (team: 'A' | 'B', code: string) => {
			update(s => {
				const newState = { ...s, [team]: code };
				if (browser) {
					localStorage.setItem('m1_scratchpad', JSON.stringify(newState));
				}
				return newState;
			});
		},
		reset: () => {
			const empty = { A: '', B: '' };
			set(empty);
			if (browser) {
				localStorage.removeItem('m1_scratchpad');
			}
		}
	};
}

export const scratchpad = createScratchpad();
